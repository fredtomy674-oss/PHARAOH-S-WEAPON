import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiEmbeddingProvider, GeminiLLMProvider } from "../../src/modules/ai/providers/gemini.js";
import { config } from "../../src/config/env.js";
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
    expect(calls).toHaveLength(4);
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

/**
 * PHASE 53 — model failover. Measured live: the configured primary 500'd while
 * three other models answered 200 on the same key within the same minute, so a
 * 429/500/503 on the primary must move the turn, not end it.
 */
describe("Gemini LLM failover (PHASE 53)", () => {
  const originalFallbacks = config.GEMINI_LLM_FALLBACKS;
  const originalModel = config.GEMINI_LLM_MODEL;

  afterEach(() => {
    vi.restoreAllMocks();
    config.GEMINI_LLM_FALLBACKS = originalFallbacks;
    config.GEMINI_LLM_MODEL = originalModel;
  });

  function stubFetchFailover(responses: Array<{ status: number; body: unknown }>) {
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

  it("moves to the fallback when the primary's bucket is exhausted", async () => {
    config.GEMINI_LLM_MODEL = "primary-model";
    config.GEMINI_LLM_FALLBACKS = "fallback-model";
    // Primary burns its whole retry budget on 503s, then the fallback answers.
    const calls = stubFetchFailover([
      { status: 503, body: {} },
      { status: 503, body: {} },
      { status: 503, body: {} },
      { status: 503, body: {} },
      { status: 200, body: okBody },
    ]);
    const res = await new GeminiLLMProvider().complete({ operation: "tutor", messages: [{ role: "user", content: "hi" }] });
    expect(res.content).toBe("إجابة");
    expect(res.model).toBe("fallback-model");
    expect(calls).toHaveLength(5);
    expect(calls[0]).toContain("primary-model");
    expect(calls[4]).toContain("fallback-model");
  });

  it("skips a retired fallback name without retries", async () => {
    config.GEMINI_LLM_MODEL = "primary-model";
    config.GEMINI_LLM_FALLBACKS = "retired-model, healthy-model";
    const calls = stubFetchFailover([
      { status: 503, body: {} },
      { status: 503, body: {} },
      { status: 503, body: {} },
      { status: 503, body: {} },
      { status: 404, body: {} },
      { status: 200, body: okBody },
    ]);
    const res = await new GeminiLLMProvider().complete({ operation: "tutor", messages: [{ role: "user", content: "hi" }] });
    expect(res.model).toBe("healthy-model");
    // 4 primary + 1 retired (no retry) + 1 healthy.
    expect(calls).toHaveLength(6);
  });

  it("still throws the honest 503 when every bucket is empty", async () => {
    config.GEMINI_LLM_MODEL = "primary-model";
    config.GEMINI_LLM_FALLBACKS = "fallback-model";
    const calls = stubFetchFailover([{ status: 429, body: {} }]);
    const error = await new GeminiLLMProvider()
      .complete({ operation: "tutor", messages: [{ role: "user", content: "hi" }] })
      .catch((e: unknown) => e);
    expect((error as AppError).code).toBe("AI_UPSTREAM_BUSY");
    // 4 primary attempts + 2 fallback attempts, then the honest error.
    expect(calls).toHaveLength(6);
  });

  it("never leaves the primary when no fallbacks are configured", async () => {
    config.GEMINI_LLM_MODEL = "primary-model";
    config.GEMINI_LLM_FALLBACKS = "";
    const calls = stubFetchFailover([
      { status: 503, body: {} },
      { status: 200, body: okBody },
    ]);
    const res = await new GeminiLLMProvider().complete({ operation: "tutor", messages: [{ role: "user", content: "hi" }] });
    expect(res.model).toBe("primary-model");
    expect(calls).toHaveLength(2);
  });
});

/**
 * PHASE 55 — time bounds. Measured live: a tutor turn burned 181s (then 300s+
 * on retry) because a hung attempt waits forever. A hanging socket must spend
 * the budget on the next attempt, and a silent stream must be cut — never
 * watched.
 */
describe("Gemini time bounds (PHASE 55)", () => {
  const originalFallbacks = config.GEMINI_LLM_FALLBACKS;
  const originalModel = config.GEMINI_LLM_MODEL;

  afterEach(() => {
    vi.restoreAllMocks();
    config.GEMINI_LLM_FALLBACKS = originalFallbacks;
    config.GEMINI_LLM_MODEL = originalModel;
  });

  /** A fetch that hangs until OUR abort fires — real fetch semantics. */
  function stubHangingFetch(calls: string[]) {
    const impl = vi.fn(async (input: unknown, init?: { signal?: AbortSignal }) => {
      calls.push(String(input));
      await new Promise((_, reject) => {
        if (init?.signal?.aborted) {
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
          return;
        }
        init?.signal?.addEventListener("abort", () => {
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        });
      });
      throw new Error("unreachable");
    });
    vi.stubGlobal("fetch", impl);
    return calls;
  }

  const okBody = { candidates: [{ content: { parts: [{ text: "إجابة" }] } }] };

  it("a hung primary yields to a healthy fallback instead of hanging the turn", async () => {
    config.GEMINI_LLM_MODEL = "primary-model";
    config.GEMINI_LLM_FALLBACKS = "fallback-model";
    const calls: string[] = [];
    const hanging = vi.fn(async (input: unknown, init?: { signal?: AbortSignal }) => {
      calls.push(String(input));
      if (String(input).includes("fallback-model")) {
        return { ok: true, status: 200, json: async () => okBody, text: async () => JSON.stringify(okBody) } as unknown as Response;
      }
      await new Promise((_, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        });
      });
      throw new Error("unreachable");
    });
    vi.stubGlobal("fetch", hanging);
    const res = await new GeminiLLMProvider().complete(
      { operation: "tutor", messages: [{ role: "user", content: "hi" }] },
      { timeoutMs: 30 },
    );
    expect(res.content).toBe("إجابة");
    expect(res.model).toBe("fallback-model");
    // 4 hung primary attempts, then the fallback answers on its first try.
    expect(calls).toHaveLength(5);
  });

  it("silence all the way down is an honest, retryable 503 — never a 500", async () => {
    config.GEMINI_LLM_MODEL = "primary-model";
    config.GEMINI_LLM_FALLBACKS = "";
    const calls: string[] = [];
    stubHangingFetch(calls);
    const error = await new GeminiLLMProvider()
      .complete({ operation: "tutor", messages: [{ role: "user", content: "hi" }] }, { timeoutMs: 30 })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    const appErr = error as AppError;
    expect(appErr.statusCode).toBe(503);
    expect(appErr.code).toBe("AI_UPSTREAM_BUSY");
    expect(appErr.meta).toMatchObject({ timeout: true });
    expect(calls).toHaveLength(4);
  });

  it("cuts a stream silent before the first word and fails over", async () => {
    config.GEMINI_LLM_MODEL = "primary-model";
    config.GEMINI_LLM_FALLBACKS = "fallback-model";
    // Primary opens fine but never sends a frame; the fallback answers whole.
    const hangingStream = new ReadableStream<Uint8Array>({});
    let n = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: unknown) => {
        n += 1;
        if (String(input).includes("fallback-model")) {
          const body = new ReadableStream<Uint8Array>({
            start(c) {
              c.enqueue(
                new TextEncoder().encode('data: {"candidates":[{"content":{"parts":[{"text":"إجابة"}]}}]}\n\n'),
              );
              c.close();
            },
          });
          return new Response(body, { status: 200 });
        }
        return new Response(hangingStream, { status: 200 });
      }),
    );
    const deltas: string[] = [];
    const res = await new GeminiLLMProvider().stream(
      { operation: "tutor", messages: [{ role: "user", content: "hi" }] },
      (t) => {
        deltas.push(t);
      },
      { timeoutMs: 5000, stallMs: 40 },
    );
    expect(res.content).toBe("إجابة");
    expect(res.model).toBe("fallback-model");
    expect(deltas).toEqual(["إجابة"]);
    expect(n).toBe(2);
  });

  it("a stall after the first word fails honestly — the opening is never replayed", async () => {
    config.GEMINI_LLM_MODEL = "primary-model";
    config.GEMINI_LLM_FALLBACKS = "fallback-model";
    // One frame, then eternal silence: the student owns the opening already.
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode('data: {"candidates":[{"content":{"parts":[{"text":"أهلا"}]}}]}\n\n'));
      },
    });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status: 200 })));
    const deltas: string[] = [];
    const error = await new GeminiLLMProvider()
      .stream(
        { operation: "tutor", messages: [{ role: "user", content: "hi" }] },
        (t) => {
          deltas.push(t);
        },
        { timeoutMs: 5000, stallMs: 40 },
      )
      .catch((e: unknown) => e);
    expect(deltas).toEqual(["أهلا"]);
    expect(error).toBeInstanceOf(AppError);
    const appErr = error as AppError;
    expect(appErr.statusCode).toBe(503);
    expect(appErr.meta).toMatchObject({ stall: true });
    // The student's words are saved: the message says so, plainly.
    expect(appErr.message).toContain("رسالتك محفوظة");
  });
});
