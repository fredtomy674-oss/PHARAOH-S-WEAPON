import { describe, expect, it, vi } from "vitest";
import type { AiService } from "../../src/modules/ai/aiService.js";
import { ModelReranker, parseRanking } from "../../src/modules/rag/modelReranker.js";
import type { RankedChunk } from "../../src/modules/rag/types.js";

/**
 * PHASE 21 (D-025) — ModelReranker: LLM-driven reordering with strict parse
 * and safe fallback. Stubbed AiService keeps the LLM deterministic and offline;
 * the parser and every degradation path are the real production code.
 */

let content = "";
let calls = 0;
const stubAi = (): AiService => {
  calls = 0;
  const stub = {
    complete: vi.fn(async () => {
      calls++;
      return { content, model: "stub", inputTokens: 0, outputTokens: 0, latencyMs: 0 };
    }),
  };
  return stub as unknown as AiService;
};

const chunk = (id: string, contentText: string, position = 0): RankedChunk => ({
  chunkId: id,
  content: contentText,
  score: 1 - position / 10,
  metadata: { documentId: "doc_test" },
  position,
});

const c = [chunk("a", "مقدمة عن الجمع"), chunk("b", "أمثلة محلولة"), chunk("c", "تمارين تطبيقية")];

describe("ModelReranker (PHASE 21 — model-based reranking)", () => {
  it("reorders chunks by the model's JSON ranking", async () => {
    const ai = stubAi();
    content = '[3, 1, 2]';
    const reranker = new ModelReranker(ai);
    const out = await reranker.rerank("اشرح التمارين", c);
    expect(out.map((x) => x.chunkId)).toEqual(["c", "a", "b"]);
    expect(out.map((x) => x.position)).toEqual([0, 1, 2]);
    expect(calls).toBe(1);
  });

  it("accepts a partial subset: chosen first, remainder in original order", async () => {
    content = "[2]";
    const out = await new ModelReranker(stubAi()).rerank("سؤال", c);
    expect(out.map((x) => x.chunkId)).toEqual(["b", "a", "c"]);
  });

  it("skips the model for 0 or 1 chunks (no waste)", async () => {
    await new ModelReranker(stubAi()).rerank("سؤال", []);
    await new ModelReranker(stubAi()).rerank("سؤال", [c[0]!]);
    expect(calls).toBe(0);
  });

  it("falls back unchanged when the reply is not a JSON array", async () => {
    content = "لا يمكنني تقديم قائمة مرتبة الآن.";
    const out = await new ModelReranker(stubAi()).rerank("سؤال", c);
    expect(out.map((x) => x.chunkId)).toEqual(["a", "b", "c"]);
    expect(calls).toBe(1);
  });

  it("falls back unchanged on invalid indices (out of range or duplicates)", async () => {
    content = "[1, 99]";
    expect((await new ModelReranker(stubAi()).rerank("سؤال", c)).map((x) => x.chunkId)).toEqual(["a", "b", "c"]);
    content = "[1, 1]";
    expect((await new ModelReranker(stubAi()).rerank("سؤال", c)).map((x) => x.chunkId)).toEqual(["a", "b", "c"]);
  });

  it("never breaks the turn when the model call fails", async () => {
    const ai = {
      complete: vi.fn(async () => {
        throw new Error("provider down");
      }),
    } as unknown as AiService;
    const out = await new ModelReranker(ai).rerank("سؤال", c);
    expect(out.map((x) => x.chunkId)).toEqual(["a", "b", "c"]);
  });

  it("parseRanking: strict and safe", () => {
    expect(parseRanking("إليك الترتيب: [2, 1]", 3)).toEqual([1, 0]);
    expect(parseRanking('```json\n[3,1,2]\n```', 3)).toEqual([2, 0, 1]);
    expect(parseRanking("بدون مصفوفة", 3)).toBeNull();
    expect(parseRanking("[1.5, 2]", 3)).toBeNull();
    expect(parseRanking("[0, 2]", 3)).toBeNull();
    expect(parseRanking("[4]", 3)).toBeNull();
    expect(parseRanking("[2, 2]", 3)).toBeNull();
    expect(parseRanking("[]", 3)).toBeNull();
  });
});