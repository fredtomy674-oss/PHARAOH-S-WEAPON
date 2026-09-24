import { config } from "../../config/env.js";
import type { Db } from "../../db/index.js";
import type { AiService } from "../ai/aiService.js";
import { ModelReranker } from "./modelReranker.js";
import { QdrantVectorStore } from "./qdrant.js";
import { LexicalReranker, NoopReranker } from "./retrieval.js";
import type { Reranker, VectorStore } from "./types.js";
import { SqliteVectorStore } from "./vectorStore.js";

/**
 * PHASE 21 (D-025): provider factories. The RAG pipeline depends on the
 * `VectorStore`/`Reranker` interfaces; the concrete implementations are a pure
 * configuration choice here (mirrors the AI provider pattern: mock default,
 * external opt-in). Overrides let tests/seed force a flavor regardless of env.
 */
export interface VectorStoreOptions {
  kind?: "sqlite" | "qdrant";
  url?: string;
  collectionName?: string;
  dimension?: number;
}

export function createVectorStore(db: Db, opts: VectorStoreOptions = {}): VectorStore {
  const kind = opts.kind ?? config.VECTOR_STORE;
  if (kind === "qdrant") {
    return new QdrantVectorStore({
      url: opts.url ?? config.QDRANT_URL,
      collectionName: opts.collectionName ?? config.QDRANT_COLLECTION,
      dimension: opts.dimension ?? config.QDRANT_DIMENSION,
    });
  }
  return new SqliteVectorStore(db);
}

export interface RerankerOptions {
  enabled?: boolean;
  kind?: "lexical" | "model";
}

export function createReranker(ai: AiService, opts: RerankerOptions = {}): Reranker {
  const enabled = opts.enabled ?? config.RAG_ENABLE_RERANK;
  if (!enabled) return new NoopReranker();
  const kind = opts.kind ?? config.RAG_RERANKER;
  return kind === "model" ? new ModelReranker(ai) : new LexicalReranker();
}