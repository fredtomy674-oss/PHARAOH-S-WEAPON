import { describe, expect, it, vi } from "vitest";
import type { AiService } from "../../src/modules/ai/aiService.js";
import { createDb } from "../../src/db/index.js";
import { createReranker, createVectorStore } from "../../src/modules/rag/factory.js";
import { ModelReranker } from "../../src/modules/rag/modelReranker.js";
import { QdrantVectorStore } from "../../src/modules/rag/qdrant.js";
import { LexicalReranker, NoopReranker } from "../../src/modules/rag/retrieval.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";

/**
 * PHASE 21 (D-025) — provider factories: the RAG pipeline picks its storage
 * and reranker from configuration (mock-like pattern), with explicit overrides
 * for tests/seed regardless of the module-scoped env.
 */
describe("RAG provider factory (PHASE 21)", () => {
  const db = createDb();
  const ai = { complete: vi.fn() } as unknown as AiService;

  it("vector store: sqlite by override → local store", () => {
    expect(createVectorStore(db, { kind: "sqlite" })).toBeInstanceOf(SqliteVectorStore);
    expect(createVectorStore(db)).toBeInstanceOf(SqliteVectorStore); // env default is sqlite
  });

  it("vector store: qdrant by override → HTTP adapter (no db dependency)", () => {
    const store = createVectorStore(db, { kind: "qdrant", url: "http://127.0.0.1:6333", collectionName: "t" });
    expect(store).toBeInstanceOf(QdrantVectorStore);
  });

  it("reranker: disabled → NoopReranker", () => {
    expect(createReranker(ai, { enabled: false })).toBeInstanceOf(NoopReranker);
  });

  it("reranker: lexical by default → LexicalReranker", () => {
    expect(createReranker(ai, { enabled: true, kind: "lexical" })).toBeInstanceOf(LexicalReranker);
  });

  it("reranker: model opt-in → ModelReranker", () => {
    expect(createReranker(ai, { enabled: true, kind: "model" })).toBeInstanceOf(ModelReranker);
  });
});