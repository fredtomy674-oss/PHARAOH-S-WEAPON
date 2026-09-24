import { and, eq } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { chunks, ragVectors } from "../../db/schema.js";
import type { CurriculumScope, VectorStore } from "./types.js";

/**
 * Local vector store over SQLite (MVP). Embeddings are stored as JSON text;
 * search = SQL scope filter (join with `chunks` metadata) + brute-force cosine
 * similarity in JS. Deliberately dependency-free; the `VectorStore` interface
 * lets pgvector / Chroma / Qdrant drop in later with zero `rag/` changes.
 */
export class SqliteVectorStore implements VectorStore {
  constructor(private readonly db: Db) {}

  async upsert(input: { chunkId: string; embedding: number[]; model: string; scope?: CurriculumScope }): Promise<void> {
    await this.db.db
      .insert(ragVectors)
      .values({
        chunkId: input.chunkId,
        embedding: JSON.stringify(input.embedding),
        embeddingModel: input.model,
        dim: input.embedding.length,
      })
      .onConflictDoUpdate({
        target: ragVectors.chunkId,
        set: { embedding: JSON.stringify(input.embedding), embeddingModel: input.model, dim: input.embedding.length },
      });
  }

  async remove(chunkId: string): Promise<void> {
    await this.db.db.delete(ragVectors).where(eq(ragVectors.chunkId, chunkId));
  }

  async search(input: { query: number[]; scope: CurriculumScope; topK: number; maxCandidates?: number }): Promise<Array<{ chunkId: string; score: number }>> {
    const scopeConds = buildScopeConditions(input.scope);
    const where = scopeConds.length > 0 ? and(...scopeConds) : undefined;
    const joinConds = [eq(ragVectors.chunkId, chunks.id)];
    if (where) joinConds.push(where);

    const rows = await this.db.db
      .select({
        chunkId: ragVectors.chunkId,
        embedding: ragVectors.embedding,
        content: chunks.content,
        metadataJson: chunks.metadataJson,
      })
      .from(ragVectors)
      .innerJoin(chunks, and(...joinConds))
      .limit(input.maxCandidates ?? 500);

    const scored = rows
      .map((row) => {
        let vector: number[];
        try {
          vector = JSON.parse(row.embedding) as number[];
        } catch {
          return null;
        }
        return { chunkId: row.chunkId, score: cosine(input.query, vector) };
      })
      .filter((x): x is { chunkId: string; score: number } => x !== null)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, input.topK);
  }
}

export function cosine(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** AND-group over the chunk metadata columns (the isolation barrier). */
function buildScopeConditions(scope: CurriculumScope) {
  const conds: ReturnType<typeof eq>[] = [];
  const scopeFields = [
    ["countryId", chunks.countryId],
    ["educationSystemId", chunks.educationSystemId],
    ["gradeId", chunks.gradeId],
    ["subjectId", chunks.subjectId],
    ["curriculumId", chunks.curriculumId],
    ["termId", chunks.termId],
    ["unitId", chunks.unitId],
    ["lessonId", chunks.lessonId],
  ] as const;
  for (const [key, column] of scopeFields) {
    const val = scope[key];
    if (typeof val === "string" && val.length > 0) conds.push(eq(column, val));
  }
  return conds;
}