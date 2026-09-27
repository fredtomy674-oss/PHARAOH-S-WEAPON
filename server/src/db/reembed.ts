/* eslint-disable no-console */
import { config } from "../config/env.js";
import { AiService } from "../modules/ai/aiService.js";
import { createVectorStore } from "../modules/rag/factory.js";
import type { CurriculumScope } from "../modules/rag/types.js";
import { openDbAndMigrate } from "./index.js";
import { chunks } from "./schema.js";

/** Chunks sent per provider call — bounds one request's payload. */
const BATCH_SIZE = 16;

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
 * The seeder deliberately never re-embeds (it is mock-only and idempotent), so
 * this is the single entry point for "I changed the provider" work.
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
  console.log(`Re-embedding ${rows.length} chunk(s) via ${ai.providers.embeddings.id} into ${config.VECTOR_STORE}…`);

  let done = 0;
  let lastModel = "";
  let dim = 0;
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batch = rows.slice(start, start + BATCH_SIZE);
    const result = await ai.embed({ texts: batch.map((row) => row.content) });
    lastModel = result.model;
    for (let i = 0; i < batch.length; i++) {
      const vector = result.vectors[i];
      const row = batch[i]!;
      if (!vector || vector.length === 0) continue;
      dim = vector.length;
      await vectorStore.upsert({ chunkId: row.id, embedding: vector, model: result.model, scope: scopeOf(row) });
    }
    done += batch.length;
    console.log(`  ${done}/${rows.length}`);
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
