import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiEmbeddingProvider, GeminiLLMProvider } from "../../src/modules/ai/providers/gemini.js";
import { AppError } from "../../src/utils/errors.js";

/**
 * PHASE 42 — the real Gemini provider against a stubbed network.
 *
 * Everything here was measured on the live API first: the same model answered
 * 5/5 and then, minutes later, "503 high demand", and a different model
 * answered 429 once its own quota ran out. So the provider must (a) retry the
 * statuses that mean "ask again", (b) never retry the ones that are
 * deterministic, and (c) hand the student an honest 503 instead of a masked
 * 500 that nobody can debug. These cases pin all three.
 */
describe("Gemini provider resilience (PHASE 42 — transient retries + honest 503)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function stubFetch(responses: Array<{ status: number; body: unknown }>) {
    const calls: string[] = [];
    let index = 0;
    const impl = vi.fn(async (input: unknown) => {
      calls.push(String(input));
      const next = responses[Math.min(index, responses.length - 1)]!;
      index += 1;
      return {
        ok: next.status >= 200 && next.status < 300,
        status: next.status,
        json: async () => next.body,
        text: async () => JSON.stringify(next.body),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", impl);
    return calls;
  }

  const okBody = { candidates: [{ content: { parts: [{ text: "إجابة" }] } }] };

  it("retries a 503 and returns the reply the second attempt produced", async () => {
    const calls = stubFetch([
      { status: 503, body: { error: { message: "high demand" } } },
      { status: 200, body: okBody },
    ]);
    const res = await new GeminiLLMProvider().complete({ operation: "tutor", messages: [{ role: "user", content: "hi" }] });
    expect(res.content).toBe("إجابة");
    expect(calls).toHaveLength(2);
  });

  it("retries a 429 too (a per-model quota can refill within the turn)", async () => {
    const calls = stubFetch([
      { status: 429, body: { error: { message: "quota" } } },
      { status: 200, body: okBody },
    ]);
    const res = await new GeminiLLMProvider().complete({ operation: "tutor", messages: [{ role: "user", content: "hi" }] });
    expect(res.content).toBe("إجابة");
    expect(calls).toHaveLength(2);
  });

  it("gives up after the bounded budget instead of hammering the upstream", async () => {
    const calls = stubFetch([{ status: 503, body: { error: { message: "high demand" } } }]);
    const provider = new GeminiLLMProvider();
    const error = await provider
      .complete({ operation: "tutor", messages: [{ role: "user", content: "hi" }] })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    const appErr = error as AppError;
    expect(appErr.statusCode).toBe(503);
    expect(appErr.code).toBe("AI_UPSTREAM_BUSY");
    // The message must be something a student can act on, and the hidden cause
    // must ride along for the log instead of leaking to the client.
    expect(appErr.expose).toBe(true);
    expect(appErr.message).not.toContain("high demand");
    expect(appErr.meta).toMatchObject({ upstreamStatus: 503 });
    expect(calls).toHaveLength(3);
  });

  it("never retries a deterministic failure (a retired model name stays 404)", async () => {
    const calls = stubFetch([{ status: 404, body: { error: { message: "not found" } } }]);
    const error = await new GeminiLLMProvider()
      .complete({ operation: "tutor", messages: [{ role: "user", content: "hi" }] })
      .catch((e: unknown) => e);
    expect((error as AppError).statusCode).toBe(500);
    expect(calls).toHaveLength(1);
  });

  it("retries the embedding call and maps an exhausted upstream the same way", async () => {
    const calls = stubFetch([{ status: 200, body: { embedding: { values: [0.1, 0.2] } } }]);
    const res = await new GeminiEmbeddingProvider().embed({ texts: ["سؤال"] });
    expect(res.vectors[0]).toEqual([0.1, 0.2]);
    expect(calls).toHaveLength(1);

    stubFetch([{ status: 503, body: { error: { message: "high demand" } } }]);
    const error = await new GeminiEmbeddingProvider().embed({ texts: ["سؤال"] }).catch((e: unknown) => e);
    const appErr = error as AppError;
    expect(appErr.code).toBe("AI_UPSTREAM_BUSY");
    expect(appErr.meta).toMatchObject({ upstreamStatus: 503, label: "مزود التضمين" });
  });
});
