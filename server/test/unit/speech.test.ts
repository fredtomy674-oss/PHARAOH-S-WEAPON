import { afterEach, describe, expect, it, vi } from "vitest";
import { SpeechService, capText } from "../../src/modules/ai/speech/service.js";
import { createSpeechProvider } from "../../src/modules/ai/speech/factory.js";
import { GeminiSpeechProvider } from "../../src/modules/ai/speech/providers/geminiSpeech.js";
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

  it("reports a reply that came back with no audio at all", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "…" }] } }] }), { status: 200 })));
    await expect(new GeminiSpeechProvider().synthesize({ text: "hi", language: "en" })).rejects.toMatchObject({
      code: "SPEECH_UNAVAILABLE",
    });
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
