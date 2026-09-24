import { Errors } from "../../utils/errors.js";
import { sha256Hex } from "../../utils/ids.js";
import type { CurriculumScope, VectorStore } from "./types.js";

/**
 * Qdrant vector store over plain HTTP (PHASE 21 / D-025): zero new
 * dependencies, works against Docker or Qdrant Cloud. Chunk content and its
 * metadata STAY in SQLite (`chunks`); Qdrant holds only chunkId + vector +
 * the scope fields mirrored into the payload, so retrieval re-fetches the row
 * from SQLite exactly like the local store. The scope payload filter IS the
 * isolation barrier (same AND-semantics as the SQL scope filter).
 *
 * Failures are asymmetric by design: `upsert`/`remove` throw (an admin ingest
 * must surface), while `search` degrades to `[]` (a student turn must never
 * crash because the vector service is down — the tutor falls back to
 * "لم أستطع الوصول لمحتوى الدرس").
 */
export interface QdrantOptions {
  url: string;
  collectionName?: string;
  /** Fixed dimension; when absent the store adopts the first embedding's dim. */
  dimension?: number;
  timeoutMs?: number;
  /** Injectable for tests (node:http fake server). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

/** Scope keys mirrored into every point payload (used by the search filter). */
const SCOPE_PAYLOAD_KEYS = [
  "countryId",
  "educationSystemId",
  "gradeId",
  "subjectId",
  "curriculumId",
  "termId",
  "unitId",
  "lessonId",
] as const;

interface QdrantHit {
  id: string;
  score: number;
  payload?: { chunkId?: string };
}

export class QdrantVectorStore implements VectorStore {
  private readonly baseUrl: string;
  private readonly collectionName: string;
  private readonly dimension?: number;
  private readonly timeoutMs: number;
  private readonly fetcher: typeof fetch;
  private prepared = false;

  constructor(opts: QdrantOptions) {
    this.baseUrl = opts.url.replace(/\/+$/, "");
    this.collectionName = opts.collectionName ?? "alfarouq";
    this.dimension = opts.dimension;
    this.timeoutMs = opts.timeoutMs ?? 5000;
    this.fetcher = opts.fetchImpl ?? ((...args) => fetch(...args));
  }

  async upsert(input: { chunkId: string; embedding: number[]; model: string; scope?: CurriculumScope }): Promise<void> {
    const effectiveDim = this.dimension ?? input.embedding.length;
    if (this.dimension !== undefined && this.dimension !== input.embedding.length) {
      throw Errors.badRequest(`بُعد المتجه (${input.embedding.length}) يخالف إعداد QDRANT_DIMENSION (${this.dimension})`, "VECTOR_DIMENSION_MISMATCH");
    }
    await this.ensureCollection(effectiveDim);
    const res = await this.send("PUT", `/collections/${this.collectionName}/points?wait=true`, {
      points: [{ id: pointUuid(input.chunkId), vector: input.embedding, payload: { chunkId: input.chunkId, ...scopePayload(input.scope) } }],
    });
    if (!res.ok) throw unavailable(res.status);
  }

  async remove(chunkId: string): Promise<void> {
    const res = await this.send("POST", `/collections/${this.collectionName}/points/delete`, {
      filter: { must: [{ key: "chunkId", match: { value: chunkId } }] },
    });
    if (!res.ok && res.status !== 404) throw unavailable(res.status);
  }

  async search(input: { query: number[]; scope: CurriculumScope; topK: number; maxCandidates?: number }): Promise<Array<{ chunkId: string; score: number }>> {
    // Exact ANN search — topK is the limit (maxCandidates is SQLite-specific).
    let res: Response;
    try {
      res = await this.send("POST", `/collections/${this.collectionName}/points/search`, {
        vector: input.query,
        limit: input.topK,
        with_payload: ["chunkId"],
        filter: scopeFilter(input.scope),
      });
    } catch {
      return []; // network/abort → safe fallback, never break a student turn
    }
    if (!res.ok) return [];
    const body = (await res.json().catch(() => null)) as { result?: QdrantHit[] } | null;
    const hits = body?.result ?? [];
    return hits
      .filter((h) => typeof h.payload?.chunkId === "string")
      .map((h) => ({ chunkId: h.payload!.chunkId!, score: h.score }));
  }

  /** Creates the collection on first use (Cosine + the embedding dimension). */
  private async ensureCollection(dim: number): Promise<void> {
    if (this.prepared) return;
    const res = await this.send("GET", `/collections/${this.collectionName}`);
    if (res.status === 404) {
      const created = await this.send("PUT", `/collections/${this.collectionName}`, {
        vectors: { size: dim, distance: "Cosine" },
      });
      if (!created.ok) throw unavailable(created.status);
    } else if (!res.ok) {
      throw unavailable(res.status);
    }
    this.prepared = true;
  }

  private async send(method: string, path: string, body?: unknown): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetcher(`${this.baseUrl}${path}`, {
        method,
        headers: { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      throw Errors.serviceUnavailable(
        aborted ? "انتهت مهلة الاتصال بتخزين المتجهات" : "تعذر الاتصال بتخزين المتجهات — راجع QDRANT_URL",
        "VECTOR_STORE_UNAVAILABLE",
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Deterministic UUID from a chunkId (stable across upserts/removes). */
export function pointUuid(chunkId: string): string {
  const hex = sha256Hex(chunkId);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function unavailable(status: number): ReturnType<typeof Errors.serviceUnavailable> {
  return Errors.serviceUnavailable(`تخزين المتجهات رفض الطلب (${status})`, "VECTOR_STORE_UNAVAILABLE");
}

/** Mirrors the chunk's scope fields into the point payload (search filters on them). */
function scopePayload(scope?: CurriculumScope): Record<string, string> {
  const payload: Record<string, string> = {};
  if (!scope) return payload;
  for (const key of SCOPE_PAYLOAD_KEYS) {
    const value = scope[key];
    if (typeof value === "string" && value.length > 0) payload[key] = value;
  }
  return payload;
}

/** AND-group over the scope payload keys — the retrieval isolation barrier. */
function scopeFilter(scope: CurriculumScope): { must: Array<{ key: string; match: { value: string } }> } {
  const must: Array<{ key: string; match: { value: string } }> = [];
  for (const key of SCOPE_PAYLOAD_KEYS) {
    const value = scope[key];
    if (typeof value === "string" && value.length > 0) must.push({ key, match: { value } });
  }
  return { must };
}