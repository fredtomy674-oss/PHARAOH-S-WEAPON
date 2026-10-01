import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiEmbeddingProvider, GeminiLLMProvider } from "../../src/modules/ai/providers/gemini.js";
import { config } from "../../src/config/env.js";
import { AppError } from "../../src/utils/errors.js";
import type { LLMRequest } from "../../src/modules/ai/types.js";

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
 * PHASE 56 — the thinking budget. Measured on the real tutor prompt: the Gemini 3
 * family reasons by default, those tokens arrive *before* the first visible word,
 * and a fallback that thought freely spent its whole 600-token budget on
 * reasoning and returned a truncated, unparseable envelope (`MAX_TOKENS`).
 *
 * Support is per-model and measured: `gemini-3.5-flash-lite` refuses the field
 * with a 400 while other flash models accept it — so a refusal that names the
 * thinking controls must be retried once with them dropped, never end the turn.
 */
describe("Gemini thinking budget (PHASE 56)", () => {
  const originalFallbacks = config.GEMINI_LLM_FALLBACKS;
  const originalModel = config.GEMINI_LLM_MODEL;

  afterEach(() => {
    vi.restoreAllMocks();
    config.GEMINI_LLM_FALLBACKS = originalFallbacks;
    config.GEMINI_LLM_MODEL = originalModel;
  });

  /** Records every request BODY, so what was actually sent can be asserted. */
  function stubFetchBodies(responses: Array<{ status: number; body: unknown }>) {
    const bodies: Array<Record<string, unknown>> = [];
    let index = 0;
    const impl = vi.fn(async (_input: unknown, init?: { body?: string }) => {
      bodies.push(JSON.parse(init?.body ?? "{}") as Record<string, unknown>);
      const next = responses[Math.min(index, responses.length - 1)]!;
      index += 1;
      return {
        ok: next.status >= 200 && next.status < 300,
        status: next.status,
        statusText: "",
        json: async () => next.body,
        text: async () => (typeof next.body === "string" ? next.body : JSON.stringify(next.body)),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", impl);
    return bodies;
  }

  const okBody = { candidates: [{ content: { parts: [{ text: "إجابة" }] } }] };
  const thinkingConfig = (body: Record<string, unknown>) =>
    (body.generationConfig as { thinkingConfig?: { thinkingBudget?: number } }).thinkingConfig;

  it("sends the budget it was given (0 = answer immediately)", async () => {
    const bodies = stubFetchBodies([{ status: 200, body: okBody }]);
    await new GeminiLLMProvider().complete({
      operation: "tutor",
      messages: [{ role: "user", content: "hi" }],
      thinkingBudget: 0,
    });
    expect(thinkingConfig(bodies[0]!)).toEqual({ thinkingBudget: 0 });
  });

  it("says nothing about thinking when no budget was asked for", async () => {
    const bodies = stubFetchBodies([{ status: 200, body: okBody }]);
    await new GeminiLLMProvider().complete({ operation: "tutor", messages: [{ role: "user", content: "hi" }] });
    expect(thinkingConfig(bodies[0]!)).toBeUndefined();
  });

  it("retries once without the controls when a model refuses them (measured 400)", async () => {
    // The measured refusal verbatim: it does NOT name the field, which is why
    // the retry keys off the status and what we sent, not off the message.
    const bodies = stubFetchBodies([
      { status: 400, body: { error: { code: 400, message: "Request contains an invalid argument.", status: "INVALID_ARGUMENT" } } },
      { status: 200, body: okBody },
    ]);
    const res = await new GeminiLLMProvider().complete({
      operation: "tutor",
      messages: [{ role: "user", content: "hi" }],
      thinkingBudget: 0,
    });
    expect(res.content).toBe("إجابة");
    expect(bodies).toHaveLength(2);
    expect(thinkingConfig(bodies[0]!)).toEqual({ thinkingBudget: 0 });
    // Same prompt, same everything else: only the refused field is gone.
    expect(thinkingConfig(bodies[1]!)).toBeUndefined();
    expect(JSON.stringify(bodies[1]!)).not.toContain("thinking");
  });

  it("a 400 that survives the retry is the honest failure, and stays off the screen", async () => {
    const bodies = stubFetchBodies([{ status: 400, body: { error: { message: "Request contains an invalid argument." } } }]);
    const error = await new GeminiLLMProvider()
      .complete({
        operation: "tutor",
        messages: [{ role: "user", content: "hi" }],
        thinkingBudget: 0,
      })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    // One honest attempt, then the same request without the controls: a refusal
    // that was never about the controls fails identically, so the turn ends.
    expect(bodies).toHaveLength(2);
    const appErr = error as AppError;
    expect(appErr.expose).toBe(false);
    // The student's screen gets a sentence they can act on; the upstream's own
    // words stay in the log (PHASE 42's rule, now applied to a 400 as well).
    expect(appErr.message).not.toContain("invalid argument");
    expect(appErr.meta).toMatchObject({ upstreamStatus: 400 });
  });

  it("asks a refusing model only once (measured: the first word moved 0.7s)", async () => {
    const bodies = stubFetchBodies([
      { status: 400, body: { error: { code: 400, message: "Request contains an invalid argument." } } },
      { status: 200, body: okBody },
      { status: 200, body: okBody },
    ]);
    const provider = new GeminiLLMProvider();
    const request: LLMRequest = { operation: "tutor", messages: [{ role: "user", content: "hi" }], thinkingBudget: 0 };
    // The first turn pays to find out what this model accepts…
    await provider.complete(request);
    expect(bodies).toHaveLength(2);
    // …and the next one goes straight to the answer. That is the whole point: the
    // doomed attempt was 700ms of the student's wait, every single turn.
    await provider.complete(request);
    expect(bodies).toHaveLength(3);
    expect(thinkingConfig(bodies[2]!)).toBeUndefined();
  });

  it("never retries a 400 that was never sent thinking controls", async () => {
    const bodies = stubFetchBodies([{ status: 400, body: { error: { message: "Invalid JSON payload" } } }]);
    await new GeminiLLMProvider()
      .complete({ operation: "tutor", messages: [{ role: "user", content: "hi" }] })
      .catch(() => undefined);
    expect(bodies).toHaveLength(1);
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

  // Measured against the live provider: its records end with `\r\n\r\n`, and the
  // reader that only looked for `\n\n` held every frame until the body ended. The
  // student therefore saw each reply in one lump, no matter how well the room
  // streamed it. These two frames are the shape that bug had.
  it("releases a CRLF-separated frame the moment it arrives", async () => {
    let release!: (t: string) => void;
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(
          new TextEncoder().encode(
            'data: {"candidates":[{"content":{"parts":[{"text":"يقبل"}]}}]}\r\n\r\n',
          ),
        );
        // The provider is still thinking; the room must already have the word.
        release = (t: string) =>
          c.enqueue(
            new TextEncoder().encode(
              `data: {"candidates":[{"content":{"parts":[{"text":"${t}"}]}}]}\r\n\r\n`,
            ),
          );
      },
    });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status: 200 })));
    const deltas: string[] = [];
    const settled = new GeminiLLMProvider()
      .stream(
        { operation: "tutor", messages: [{ role: "user", content: "hi" }] },
        (t) => {
          deltas.push(t);
        },
        { timeoutMs: 5000, stallMs: 400 },
      )
      .catch(() => undefined);
    await vi.waitFor(() => expect(deltas).toEqual(["يقبل"]));
    release("القسمة");
    await settled;
    expect(deltas).toEqual(["يقبل", "القسمة"]);
  });

  it("reassembles a frame the transport cut in half", async () => {
    const whole = 'data: {"candidates":[{"content":{"parts":[{"text":"العدد زوجي"}]}}]}';
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        // Cut inside the JSON, and inside the word "data:" itself.
        c.enqueue(new TextEncoder().encode(whole.slice(0, 9)));
        c.enqueue(new TextEncoder().encode(whole.slice(9) + "\r\n\r\n"));
        c.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status: 200 })));
    const deltas: string[] = [];
    await new GeminiLLMProvider().stream(
      { operation: "tutor", messages: [{ role: "user", content: "hi" }] },
      (t) => {
        deltas.push(t);
      },
      { timeoutMs: 5000, stallMs: 500 },
    );
    expect(deltas).toEqual(["العدد زوجي"]);
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
