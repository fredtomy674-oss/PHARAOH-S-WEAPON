/* eslint-disable no-console */
import { config } from "../config/env.js";
import { AiService } from "../modules/ai/aiService.js";
import { createVectorStore } from "../modules/rag/factory.js";
import type { CurriculumScope } from "../modules/rag/types.js";
import { openDbAndMigrate } from "./index.js";
import { chunks, ragVectors } from "./schema.js";

/** Chunks sent per provider call — bounds one request's payload. */
const BATCH_SIZE = 4;

interface ChunkRow {
  id: string;
  content: string;
  countryId: string | null;
  educationSystemId: string | null;
  gradeId: string | null;
  subjectId: string | null;
  curriculumId: string;
  termId: string | null;
  unitId: string | null;
  lessonId: string | null;
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A single batch's embed call, retried with generous backoff on upstream
 * pressure (the free tier resets its request quota within seconds-to-minutes,
 * so a wide pause almost always clears it). The embedding provider issues one
 * HTTP request PER TEXT, so a small BATCH_SIZE keeps each call inside the
 * throttle window. Re-posting an embed batch is idempotent at the store level,
 * and the batch is tiny, so retrying is cheap.
 */
async function embedBatchWithBackoff(
  ai: AiService,
  texts: string[],
  batchNumber: number,
): Promise<Awaited<ReturnType<AiService["embed"]>>> {
  const maxAttempts = 8;
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await ai.embed({ texts });
    } catch (err) {
      if (attempt >= maxAttempts) throw err;
      console.log(`  batch ${batchNumber} upstream pressure (attempt ${attempt}/${maxAttempts}) — cooling ${15 * attempt}s`);
      await delay(15_000 * attempt); // 15s → 120s; wide enough for quota resets
    }
  }
}

/**
 * Re-embeds every existing knowledge chunk with the CURRENTLY configured
 * embedding provider.
 *
 * Why this tool exists: the corpus is embedded once, at ingest time, with
 * whatever provider was configured then. Switching `AI_EMBEDDING_PROVIDER`
 * (mock → gemini) does NOT retro-fit the rows that are already stored, and the
 * similarity search truncates both sides to the shorter vector, so mixed
 * dimensions quietly return meaningless neighbors instead of an error. Running
 * this after the switch rewrites every vector in the new dimension.
 *
 * Safe to re-run: the store upserts by chunk id, so the result is idempotent.
 * Incremental: chunks whose stored vector already matches the current provider's
 * model are skipped, so a quota-capped run resumes instead of redoing the whole
 * corpus. The seeder deliberately never re-embeds (it is mock-only and
 * idempotent), so this is the single entry point for "I changed the provider"
 * work.
 */
async function main(): Promise<void> {
  const db = openDbAndMigrate();
  // No forceProvider here on purpose: the whole point is to honour the env.
  const ai = new AiService(db);
  const vectorStore = createVectorStore(db);

  const rows = (await db.db.select().from(chunks)) as ChunkRow[];
  if (rows.length === 0) {
    console.log("Nothing to re-embed: the knowledge base has no chunks yet (run `npm run db:seed` first).");
    db.sqlite.close();
    return;
  }

  if (config.AI_EMBEDDING_PROVIDER === "mock") {
    console.warn("AI_EMBEDDING_PROVIDER=mock → the vectors stay deterministic stand-ins. Set it to gemini for real retrieval.");
  }

  // Incremental & resumable: skip chunks whose stored vector ALREADY matches
  // the model the current provider will produce (the seeder writes mock rows,
  // so a quota-capped first run only tops up what is still mock — and re-runs
  // after a partial run finish the remainder instead of redoing everything).
  const expectedModel = config.AI_EMBEDDING_PROVIDER === "gemini" ? config.GEMINI_EMBEDDING_MODEL : "mock-hash-64";
  const stored = new Map((await db.db.select().from(ragVectors)).map((v) => [v.chunkId, v.embeddingModel]));
  const todo = rows.filter((row) => stored.get(row.id) !== expectedModel);
  if (todo.length === 0) {
    console.log(`Nothing to re-embed — all ${rows.length} chunk(s) already carry ${expectedModel} vectors.`);
    db.sqlite.close();
    return;
  }
  console.log(`Re-embedding ${todo.length} of ${rows.length} chunk(s) via ${ai.providers.embeddings.id} (skipping ${rows.length - todo.length} already-${expectedModel}) into ${config.VECTOR_STORE}…`);

  let done = 0;
  let lastModel = "";
  let dim = 0;
  for (let start = 0; start < todo.length; start += BATCH_SIZE) {
    const batch = todo.slice(start, start + BATCH_SIZE);
    // Free-tier embedding quotas throttle with short recovery windows; a wide
    // escalating pause turns a transient 429 into a few seconds of waiting
    // instead of aborting the whole re-run (which is idempotent either way).
    const result = await embedBatchWithBackoff(ai, batch.map((row) => row.content), start / BATCH_SIZE + 1);
    lastModel = result.model;
    for (let i = 0; i < batch.length; i++) {
      const vector = result.vectors[i];
      const row = batch[i]!;
      if (!vector || vector.length === 0) continue;
      dim = vector.length;
      await vectorStore.upsert({ chunkId: row.id, embedding: vector, model: result.model, scope: scopeOf(row) });
    }
    done += batch.length;
    console.log(`  ${done}/${todo.length}`);
  }

  console.log(`✓ Re-embed complete — ${done} chunk(s) with ${lastModel} (dim ${dim}).`);
  db.sqlite.close();
}

/** Rebuilds the RAG isolation scope from the stored chunk row (Qdrant filters on it). */
function scopeOf(row: ChunkRow): CurriculumScope {
  return {
    countryId: row.countryId ?? undefined,
    educationSystemId: row.educationSystemId ?? undefined,
    gradeId: row.gradeId ?? undefined,
    subjectId: row.subjectId ?? undefined,
    curriculumId: row.curriculumId,
    termId: row.termId ?? undefined,
    unitId: row.unitId ?? undefined,
    lessonId: row.lessonId ?? undefined,
  };
}

main().catch((err: unknown) => {
  console.error("Re-embed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
