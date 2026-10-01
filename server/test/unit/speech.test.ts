import { afterEach, describe, expect, it, vi } from "vitest";
import { config } from "../../src/config/env.js";
import { SpeechService, capText } from "../../src/modules/ai/speech/service.js";
import { createSpeechProvider } from "../../src/modules/ai/speech/factory.js";
import { GeminiSpeechProvider, splitForSynthesis } from "../../src/modules/ai/speech/providers/geminiSpeech.js";
import { StubSpeechProvider } from "../../src/modules/ai/speech/providers/stubSpeech.js";
import { isPcmMime, pcmToWav, readPcmSampleRate, toPlayableWav, WAV_MIME } from "../../src/modules/ai/speech/wav.js";
import type { SpeechProvider, SpeechRequest } from "../../src/modules/ai/speech/types.js";

/**
 * PHASE 40 (D-044) — server-side speech synthesis.
 *
 * The point of this phase is that the *server* owns the voice, so a student
 * with no Arabic voice pack installed still hears Arabic. These tests pin the
 * three things that make that work: the provider request shape, the PCM→WAV
 * conversion every browser can play, and the cache (a second 🔊 press must not
 * cost a second synthesis).
 */
describe("WAV helpers — PHASE 40", () => {
  it("wraps raw PCM in a valid RIFF/WAVE header", () => {
    const pcm = Buffer.alloc(200); // 100 samples × 2 bytes @ 24 kHz mono
    pcm.writeInt16LE(1234, 0);
    const wav = pcmToWav(pcm, { sampleRate: 24000, channels: 1, bitsPerSample: 16 });
    expect(wav.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(wav.subarray(8, 12).toString("ascii")).toBe("WAVE");
    expect(wav.readUInt32LE(4)).toBe(36 + pcm.length);
    expect(wav.readUInt16LE(20)).toBe(1); // PCM
    expect(wav.readUInt32LE(24)).toBe(24000);
    expect(wav.readUInt32LE(28)).toBe(48000); // byte rate
    expect(wav.readUInt16LE(34)).toBe(16);
    expect(wav.readUInt32LE(40)).toBe(pcm.length);
    expect(wav.length).toBe(44 + pcm.length);
    expect(wav.readInt16LE(44)).toBe(1234);
  });

  it("recognizes the L16 payload Gemini returns and reads its sample rate", () => {
    expect(isPcmMime("audio/L16;codec=pcm;rate=24000")).toBe(true);
    expect(isPcmMime("audio/wav")).toBe(false);
    expect(readPcmSampleRate("audio/L16;codec=pcm;rate=16000")).toBe(16000);
    expect(readPcmSampleRate("audio/L16")).toBe(24000);
  });

  it("turns an L16 payload into a playable WAV and passes a WAV through", () => {
    const pcm = Buffer.alloc(64);
    const fromPcm = toPlayableWav(pcm, "audio/L16;codec=pcm;rate=24000");
    expect(fromPcm?.mimeType).toBe(WAV_MIME);
    expect(fromPcm?.audio.subarray(0, 4).toString("ascii")).toBe("RIFF");
    const alreadyWav = Buffer.from("RIFF0000WAVE", "ascii");
    expect(toPlayableWav(alreadyWav, "audio/wav")?.audio).toBe(alreadyWav);
  });

  it("refuses a non-audio payload instead of streaming junk to the browser", () => {
    expect(toPlayableWav(Buffer.from("<html>"), "text/html")).toBeNull();
  });
});

describe("StubSpeechProvider — PHASE 40", () => {
  it("produces a real, playable WAV without a network call", async () => {
    const result = await new StubSpeechProvider().synthesize({ text: "مرحبًا", language: "ar" });
    expect(result.mimeType).toBe(WAV_MIME);
    expect(result.audio.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(result.audio.length).toBeGreaterThan(44);
  });
});

describe("createSpeechProvider — PHASE 40", () => {
  it("returns null for the default (off) configuration", () => {
    expect(createSpeechProvider("none")).toBeNull();
  });

  it("builds the gemini provider only when asked for", () => {
    expect(createSpeechProvider("gemini")?.id).toBe("gemini");
    expect(createSpeechProvider("stub")?.id).toBe("stub");
  });
});

describe("GeminiSpeechProvider — PHASE 40", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const pcmPayload = (bytes: number): string => Buffer.alloc(bytes).toString("base64");

  it("asks for audio output with the configured voice and returns playable bytes", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as Record<string, never>;
      const config = (body as unknown as { generationConfig: { responseModalities: string[]; speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: string } } } } }).generationConfig;
      expect(config.responseModalities).toEqual(["AUDIO"]);
      expect(config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe("Kore");
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: "audio/L16;codec=pcm;rate=24000", data: pcmPayload(128) } }] } }] }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await new GeminiSpeechProvider().synthesize({ text: "مرحبًا", language: "ar" });
    expect(result.mimeType).toBe(WAV_MIME);
    expect(result.audio.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(":generateContent?key=");
  });

  it("turns a provider error into 503 SPEECH_UNAVAILABLE, never a 500", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("quota exceeded", { status: 429 })));
    await expect(new GeminiSpeechProvider().synthesize({ text: "hi", language: "en" })).rejects.toMatchObject({
      statusCode: 503,
      code: "SPEECH_UNAVAILABLE",
    });
  });

  it("turns a network failure into 503 so the client can fall back", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("socket hang up");
      }),
    );
    await expect(new GeminiSpeechProvider().synthesize({ text: "hi", language: "en" })).rejects.toMatchObject({
      statusCode: 503,
      code: "SPEECH_UNAVAILABLE",
    });
  });

  it("fails over to the next TTS model when the primary hits its quota (PHASE 44)", async () => {
    const originalModel = config.GEMINI_TTS_MODEL;
    const originalFallbacks = config.GEMINI_TTS_FALLBACKS;
    config.GEMINI_TTS_MODEL = "broken-tts-1";
    config.GEMINI_TTS_FALLBACKS = " also-broken , healthy-tts ";
    const fetchMock = vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes("broken-tts-1") || u.includes("also-broken")) {
        return new Response(JSON.stringify({ error: { code: 429, message: "quota" } }), { status: 429 });
      }
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ inlineData: { mimeType: "audio/L16;codec=pcm;rate=24000", data: pcmPayload(64) } }] } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    try {
      const result = await new GeminiSpeechProvider().synthesize({ text: "مرحبًا", language: "ar" });
      expect(result.mimeType).toBe(WAV_MIME);
      expect(result.audio.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(String(fetchMock.mock.calls[2]?.[0])).toContain("healthy-tts");
    } finally {
      config.GEMINI_TTS_MODEL = originalModel;
      config.GEMINI_TTS_FALLBACKS = originalFallbacks;
    }
  });

  it("reports 503 when every TTS model fails (PHASE 44)", async () => {
    const originalModel = config.GEMINI_TTS_MODEL;
    const originalFallbacks = config.GEMINI_TTS_FALLBACKS;
    config.GEMINI_TTS_MODEL = "broken-a";
    config.GEMINI_TTS_FALLBACKS = "broken-b";
    const fetchMock = vi.fn(async () => new Response("quota exceeded", { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      await expect(new GeminiSpeechProvider().synthesize({ text: "hi", language: "en" })).rejects.toMatchObject({
        statusCode: 503,
        code: "SPEECH_UNAVAILABLE",
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      config.GEMINI_TTS_MODEL = originalModel;
      config.GEMINI_TTS_FALLBACKS = originalFallbacks;
    }
  });

  it("reports a reply that came back with no audio at all", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "…" }] } }] }), { status: 200 })));
    await expect(new GeminiSpeechProvider().synthesize({ text: "hi", language: "en" })).rejects.toMatchObject({
      code: "SPEECH_UNAVAILABLE",
    });
  });
});

describe("GeminiSpeechProvider BCP-47 hint placement — PHASE 40 regression", () => {
  const pcmPayload = (bytes: number): string => Buffer.alloc(bytes).toString("base64");
  const audioOk = JSON.stringify({
    candidates: [{ content: { parts: [{ inlineData: { mimeType: "audio/L16;codec=pcm;rate=24000", data: pcmPayload(64) } }] } }],
  });

  const captureBody = () => {
    let captured: unknown;
    const read = () => captured;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        captured = JSON.parse(String(init.body));
        return new Response(audioOk, { status: 200, headers: { "content-type": "application/json" } });
      }),
    );
    return read;
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends a configured ar hint at speechConfig.languageCode — never inside prebuiltVoiceConfig", async () => {
    const original = config.GEMINI_TTS_LANGUAGE_AR;
    config.GEMINI_TTS_LANGUAGE_AR = "ar-EG";
    const readBody = captureBody();
    try {
      await new GeminiSpeechProvider().synthesize({ text: "أهلاً بك يا بطل", language: "ar" });
    } finally {
      config.GEMINI_TTS_LANGUAGE_AR = original;
    }
    const g = (readBody() as { generationConfig: { speechConfig: { languageCode?: string; voiceConfig: { prebuiltVoiceConfig: { voiceName: string } } } } }).generationConfig;
    // The hint lands where the live API accepts it…
    expect(g.speechConfig.languageCode).toBe("ar-EG");
    // …and NOT in the field the API rejects with a 400 ("Cannot find field"),
    // which is what silently broke every previously configured hint.
    expect(g.speechConfig.voiceConfig.prebuiltVoiceConfig).not.toHaveProperty("languageCode");
  });

  it("sends no languageCode when the operator left the hint empty (auto-detect stays the default)", async () => {
    const original = config.GEMINI_TTS_LANGUAGE_AR;
    config.GEMINI_TTS_LANGUAGE_AR = "";
    const readBody = captureBody();
    try {
      await new GeminiSpeechProvider().synthesize({ text: "أهلاً بك يا بطل", language: "ar" });
    } finally {
      config.GEMINI_TTS_LANGUAGE_AR = original;
    }
    const speechConfig = (readBody() as { generationConfig: { speechConfig: { languageCode?: string } } }).generationConfig.speechConfig;
    expect(speechConfig).not.toHaveProperty("languageCode");
  });
});

describe("SpeechService — PHASE 40", () => {
  const recordingProvider = (): SpeechProvider & { calls: SpeechRequest[] } => {
    const calls: SpeechRequest[] = [];
    return {
      id: "recording",
      calls,
      synthesize: async (request) => {
        calls.push(request);
        return { audio: pcmToWav(Buffer.alloc(8), { sampleRate: 24000, channels: 1, bitsPerSample: 16 }), mimeType: WAV_MIME };
      },
    };
  };

  it("synthesizes once per (language, text) and serves the rest from cache", async () => {
    const provider = recordingProvider();
    const service = new SpeechService({ provider });

    const first = await service.synthesize({ text: "الجمع مع إعادة التجميع", language: "ar" });
    expect(first.cached).toBe(false);
    const second = await service.synthesize({ text: "الجمع مع إعادة التجميع", language: "ar" });
    expect(second.cached).toBe(true);
    expect(second.audio.length).toBe(first.audio.length);
    expect(provider.calls).toHaveLength(1);

    // A different language is a different utterance — never served the Arabic one.
    await service.synthesize({ text: "الجمع مع إعادة التجميع", language: "en" });
    expect(provider.calls).toHaveLength(2);
    expect(service.cacheStats().hits).toBe(1);
  });

  it("reports 503 when the server has no voice at all", async () => {
    const service = new SpeechService({ provider: null });
    expect(service.available).toBe(false);
    expect(service.providerId()).toBe("none");
    await expect(service.synthesize({ text: "مرحبًا", language: "ar" })).rejects.toMatchObject({ statusCode: 503, code: "SPEECH_UNAVAILABLE" });
  });

  it("maps an unexpected provider failure to 503, and empty text to 400", async () => {
    const broken: SpeechProvider = {
      id: "broken",
      synthesize: async () => {
        throw new Error("boom");
      },
    };
    await expect(new SpeechService({ provider: broken }).synthesize({ text: "hi", language: "en" })).rejects.toMatchObject({ code: "SPEECH_UNAVAILABLE" });
    await expect(new SpeechService({ provider: recordingProvider() }).synthesize({ text: "   ", language: "ar" })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("refuses a provider that returns no audio", async () => {
    const silent: SpeechProvider = { id: "silent", synthesize: async () => ({ audio: Buffer.alloc(0), mimeType: WAV_MIME }) };
    await expect(new SpeechService({ provider: silent }).synthesize({ text: "hi", language: "en" })).rejects.toMatchObject({ code: "SPEECH_UNAVAILABLE" });
  });
});

describe("capText — PHASE 40", () => {
  it("leaves a normal reply untouched and cuts a huge one at a word boundary", () => {
    expect(capText("  مرحبًا بيك  ", 100)).toBe("مرحبًا بيك");
    const long = `${"كلمة ".repeat(50)}نهاية`;
    const capped = capText(long, 100);
    expect(capped.length).toBeLessThanOrEqual(100);
    expect(capped.endsWith("نهاية")).toBe(false); // cut inside, not appended to
    expect(capped.endsWith("كلمة")).toBe(true);
  });
});

/**
 * PHASE 56 — narration split into parallel pieces.
 *
 * Measured on the real provider: synthesis time grows with the text (48 chars
 * 3.0s, 160 chars 6.7s, 389 chars 12.5s), and the same 160 characters in three
 * parallel requests came back in 3.9s. These pin the two things that must never
 * break for that to be worth it: no word is ever lost or cut mid-sentence, and
 * the joined audio is one playable file.
 */
describe("splitForSynthesis — PHASE 56", () => {
  const longReply = [
    "العدد 48 يقبل القسمة على 2 لأن رقم آحاده 8 زوجي.",
    "والعدد 49 لا يقبل القسمة على 2 لأن رقم آحاده 9 فردي.",
    "جرّب بنفسك: اكتب عددًا زوجيًا ثم اقسمه على 2.",
    "إذا كان رقم الآحاد زوجيًا فالناتج عدد صحيح بلا باقٍ.",
    "وإذا كان فرديًا فتبقى 1 عند القسمة على 2.",
    "جرّب مع 100: رقم آحاده 0 زوجي إذن الناتج 50.",
  ].join(" ");

  it("sends a short line in one request", () => {
    expect(splitForSynthesis("مرحبًا")).toEqual(["مرحبًا"]);
    expect(splitForSynthesis("  مرحبًا بيك  ")).toEqual(["مرحبًا بيك"]);
  });

  it("cuts a long reply into pieces small enough to speak in parallel", () => {
    const parts = splitForSynthesis(longReply);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.length).toBeLessThanOrEqual(8);
    for (const part of parts) expect(part.length).toBeLessThanOrEqual(120);
  });

  it("loses nothing: the pieces still say every word, and never end mid-number", () => {
    const parts = splitForSynthesis(longReply);
    const said = parts.join(" ").split(/\s+/).filter(Boolean);
    const original = longReply.split(/\s+/).filter(Boolean);
    expect(said).toEqual(original);
    // A cut inside a number would be spoken as two wrong numbers, so every piece
    // except the last must end on a sentence boundary.
    for (const part of parts.slice(0, -1)) expect(part).toMatch(/[.!؟…:]$/);
  });

  it("never makes a piece too small to be worth a request of its own", () => {
    const choppy = "نعم. لا. ربما.-large sentence that comfortably exceeds the minimum length on its own.";
    const parts = splitForSynthesis(choppy);
    for (const part of parts.slice(0, -1)) expect(part.length).toBeGreaterThanOrEqual(40);
  });

  it("bounds the fan-out of a very long reply without dropping the tail", () => {
    const huge = Array.from({ length: 40 }, (_, i) => `الجملة رقم ${i} تشرح فكرة مفيدة للطالب.`).join(" ");
    const parts = splitForSynthesis(huge);
    expect(parts.length).toBeLessThanOrEqual(8);
    expect(parts.join(" ")).toContain("الجملة رقم 39");
  });
});

describe("GeminiSpeechProvider parallel narration — PHASE 56", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const longReply = [
    "العدد 48 يقبل القسمة على 2 لأن رقم آحاده 8 زوجي.",
    "والعدد 49 لا يقبل القسمة على 2 لأن رقم آحاده 9 فردي.",
    "جرّب بنفسك: اكتب عددًا زوجيًا ثم اقسمه على 2.",
  ].join(" ");

  const audio = (bytes: number): string => Buffer.alloc(bytes).toString("base64");

  it("speaks the pieces at once and returns one playable file", async () => {
    const fetchMock = vi.fn(
      async (_url: string, init: RequestInit) => {
        const body = JSON.parse(String(init.body)) as { contents: Array<{ parts: Array<{ text: string }> }> };
        // 100 bytes per requested character keeps the sizes distinguishable.
        const chars = body.contents[0]!.parts[0]!.text.length;
        return new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: "audio/L16;codec=pcm;rate=24000", data: audio(chars * 10) } }] } }] }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await new GeminiSpeechProvider().synthesize({ text: longReply, language: "ar" });
    const parts = splitForSynthesis(longReply);
    expect(fetchMock).toHaveBeenCalledTimes(parts.length);
    expect(result.mimeType).toBe(WAV_MIME);
    expect(result.audio.subarray(0, 4).toString("ascii")).toBe("RIFF");
    // One header, every piece's samples: no truncation, no double-wrap.
    const spokenChars = parts.reduce((sum, p) => sum + p.length, 0);
    expect(result.audio.length).toBe(44 + spokenChars * 10);
    expect(result.audio.readUInt32LE(40)).toBe(spokenChars * 10);
  });

  it("falls back to one whole-text request when the pieces cannot be joined", async () => {
    const seen: string[] = [];
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { contents: Array<{ parts: Array<{ text: string }> }> };
      seen.push(body.contents[0]!.parts[0]!.text);
      // An audio type the browser may not play: joining it would cut words.
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: "audio/mpeg", data: audio(64) } }] } }] }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await new GeminiSpeechProvider().synthesize({ text: longReply, language: "ar" });
    expect(result.mimeType).toBe("audio/mpeg");
    expect(seen[seen.length - 1]).toBe(longReply.trim());
  });

  it("retries a single dropped piece instead of losing the whole voice", async () => {
    const attempts = new Map<string, number>();
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { contents: Array<{ parts: Array<{ text: string }> }> };
      const text = body.contents[0]!.parts[0]!.text;
      const seen = (attempts.get(text) ?? 0) + 1;
      attempts.set(text, seen);
      if (text.includes("49") && seen === 1) throw new TypeError("socket hang up");
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: "audio/L16;codec=pcm;rate=24000", data: audio(128) } }] } }] }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await new GeminiSpeechProvider().synthesize({ text: longReply, language: "ar" });
    expect(result.mimeType).toBe(WAV_MIME);
    expect([...attempts.values()].filter((n) => n === 2)).toHaveLength(1);
  });

  it("an empty bucket stops the fan-out at once instead of walking every piece", async () => {
    const originalModel = config.GEMINI_TTS_MODEL;
    const originalFallbacks = config.GEMINI_TTS_FALLBACKS;
    config.GEMINI_TTS_MODEL = "tts-a";
    config.GEMINI_TTS_FALLBACKS = "tts-b";
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: { code: 429 } }), { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);
    const t0 = Date.now();
    try {
      await expect(new GeminiSpeechProvider().synthesize({ text: longReply, language: "ar" })).rejects.toMatchObject({
        statusCode: 503,
        code: "SPEECH_UNAVAILABLE",
      });
    } finally {
      config.GEMINI_TTS_MODEL = originalModel;
      config.GEMINI_TTS_FALLBACKS = originalFallbacks;
    }
    // Each candidate is probed once per piece and never retried: the full fan-out
    // with a retry per piece was measured at 24s of silence before the browser's
    // own voice took over.
    const pieces = splitForSynthesis(longReply).length;
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(2 * pieces);
    expect(Date.now() - t0).toBeLessThan(5_000);
  });
});
