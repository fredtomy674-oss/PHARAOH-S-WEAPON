import { describe, expect, it } from "vitest";
import { OUTPUT_FORMAT } from "msedge-tts";
import { createSpeechProvider } from "../../src/modules/ai/speech/factory.js";
import {
  EDGE_MIME,
  EDGE_PROSODY,
  EDGE_VOICES,
  EdgeSpeechProvider,
  type EdgeAudioStream,
  type EdgeTtsConnection,
} from "../../src/modules/ai/speech/providers/edgeSpeech.js";

/**
 * PHASE 173 — the key-less voice.
 *
 * These tests pin the contract the speech service and the progressive narrator
 * rely on: one voice per reply language, MP3 bytes out, and every failure
 * mapped to 503 SPEECH_UNAVAILABLE (never a 500, and never an empty 200 that
 * would leave the room silent while the client waits for audio).
 *
 * The connection is faked: no WebSocket is opened here, so the suite stays
 * offline. The real endpoint was measured live (369 Arabic chars → 2113 ms).
 */

interface Script {
  chunks?: Buffer[];
  metadataError?: Error;
  streamError?: Error;
}

/** A fake connection: records what was asked for, replays the scripted bytes. */
function scripted(script: Script = {}): {
  factory: () => EdgeTtsConnection;
  calls: {
    voices: string[];
    formats: string[];
    texts: string[];
    prosody: Array<{ rate?: string; pitch?: string; volume?: string } | undefined>;
    closes: number;
  };
} {
  const calls = {
    voices: [] as string[],
    formats: [] as string[],
    texts: [] as string[],
    prosody: [] as Array<{ rate?: string; pitch?: string; volume?: string } | undefined>,
    closes: 0,
  };
  const factory = (): EdgeTtsConnection => ({
    setMetadata: async (voice, format) => {
      calls.voices.push(voice);
      calls.formats.push(String(format));
      if (script.metadataError) throw script.metadataError;
    },
    toStream: (text, prosody) => {
      calls.texts.push(text);
      calls.prosody.push(prosody);
      const { stream, emit } = makeStream();
      // Emitted after the provider has attached its listeners (toStream returns
      // synchronously, then collectAudio subscribes in the same turn).
      queueMicrotask(() => {
        if (script.streamError) {
          emit("error", script.streamError);
          return;
        }
        for (const chunk of script.chunks ?? []) emit("data", chunk);
        emit("end");
      });
      return { audioStream: stream };
    },
    close: () => {
      calls.closes += 1;
    },
  });
  return { factory, calls };
}

function makeStream(): { stream: EdgeAudioStream; emit: (event: string, arg?: unknown) => void } {
  const listeners = new Map<string, Array<(arg?: unknown) => void>>();
  const stream: EdgeAudioStream = {
    on: ((event: string, listener: (arg?: unknown) => void) => {
      const bucket = listeners.get(event) ?? [];
      bucket.push(listener);
      listeners.set(event, bucket);
      return stream;
    }) as EdgeAudioStream["on"],
  };
  return {
    stream,
    emit: (event, arg) => {
      for (const listener of listeners.get(event) ?? []) listener(arg);
    },
  };
}

describe("EdgeSpeechProvider — PHASE 173", () => {
  it("uses the owner's teacher voice for Arabic (PHASE 187)", () => {
    expect(EDGE_VOICES.ar).toBe("ar-EG-ShakirNeural");
  });

  it("asks Edge for a calmer Arabic teacher reading, without changing the other languages (PHASE 188)", async () => {
    expect(EDGE_PROSODY.ar).toEqual({ rate: "-4%", pitch: "-2Hz" });
    expect(EDGE_PROSODY.en).toEqual({ rate: "0%", pitch: "0Hz" });
    const { factory, calls } = scripted({ chunks: [Buffer.from([1])] });
    await new EdgeSpeechProvider(factory).synthesize({ text: "مرحبًا", language: "ar" });
    expect(calls.prosody).toEqual([EDGE_PROSODY.ar]);
  });

  it("speaks Arabic with its own voice and returns the MP3 bytes whole", async () => {
    const { factory, calls } = scripted({ chunks: [Buffer.from([0xff, 0xf3, 1, 2]), Buffer.from([3, 4])] });
    const result = await new EdgeSpeechProvider(factory).synthesize({ text: "مرحبًا يا بطل", language: "ar" });
    expect(result.mimeType).toBe(EDGE_MIME);
    expect([...result.audio]).toEqual([0xff, 0xf3, 1, 2, 3, 4]);
    expect(calls.voices).toEqual([EDGE_VOICES.ar]);
    expect(calls.formats).toEqual([OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3]);
    expect(calls.texts).toEqual(["مرحبًا يا بطل"]);
    expect(calls.prosody).toEqual([EDGE_PROSODY.ar]);
    expect(calls.closes).toBe(1);
  });

  it("has a voice for every language the tutor writes in (D-042)", async () => {
    for (const language of ["ar", "en", "fr", "de"] as const) {
      const { factory, calls } = scripted({ chunks: [Buffer.from([1])] });
      await new EdgeSpeechProvider(factory).synthesize({ text: "hello", language });
      expect(calls.voices).toEqual([EDGE_VOICES[language]]);
    }
  });

  it("maps a failed handshake to 503 SPEECH_UNAVAILABLE, never a 500", async () => {
    const { factory } = scripted({ metadataError: new Error("403 handshake rejected") });
    await expect(new EdgeSpeechProvider(factory).synthesize({ text: "مرحبًا", language: "ar" })).rejects.toMatchObject({
      statusCode: 503,
      code: "SPEECH_UNAVAILABLE",
    });
  });

  it("keeps the cause in the message so the operator log says why", async () => {
    const { factory } = scripted({ metadataError: new Error("403 handshake rejected") });
    await expect(new EdgeSpeechProvider(factory).synthesize({ text: "مرحبًا", language: "ar" })).rejects.toThrow(
      /403 handshake rejected/,
    );
  });

  it("maps a stream error mid-synthesis to 503", async () => {
    const { factory } = scripted({ streamError: new Error("socket closed before turn.end") });
    await expect(new EdgeSpeechProvider(factory).synthesize({ text: "مرحبًا", language: "ar" })).rejects.toMatchObject({
      statusCode: 503,
      code: "SPEECH_UNAVAILABLE",
    });
  });

  it("refuses an empty synthesis: no audio is a 503, not a silent 200", async () => {
    const { factory } = scripted({ chunks: [] });
    await expect(new EdgeSpeechProvider(factory).synthesize({ text: "مرحبًا", language: "ar" })).rejects.toMatchObject({
      code: "SPEECH_UNAVAILABLE",
    });
  });

  it("always closes the connection, success or failure", async () => {
    const okRun = scripted({ chunks: [Buffer.from([1])] });
    await new EdgeSpeechProvider(okRun.factory).synthesize({ text: "hi", language: "en" });
    expect(okRun.calls.closes).toBe(1);

    const failRun = scripted({ streamError: new Error("boom") });
    await expect(new EdgeSpeechProvider(failRun.factory).synthesize({ text: "hi", language: "en" })).rejects.toBeDefined();
    expect(failRun.calls.closes).toBe(1);
  });

  it("is built by the factory only when asked for", () => {
    expect(createSpeechProvider("edge")?.id).toBe("edge");
  });
});
