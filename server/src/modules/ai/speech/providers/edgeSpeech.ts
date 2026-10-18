import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { config } from "../../../../config/env.js";
import { AppError, Errors } from "../../../../utils/errors.js";
import type { SpeechLanguage, SpeechProvider, SpeechRequest } from "../types.js";

/**
 * PHASE 173 — الصوت المجاني الذي لا يحتاج مفتاحًا.
 *
 * PHASE 44's promise was that a bad quota bucket never costs the student his
 * voice; on 2026-10-18 every Gemini TTS model had exhausted its free quota at
 * once (429 on all five candidates, measured in api.log), and the promise had
 * a hole: one provider, one billing surface — and the owner's phone heard
 * nothing at all.
 *
 * This provider speaks through the Microsoft Edge Read Aloud endpoint — the
 * same neural voices the Edge browser uses — over a plain WebSocket, with no
 * key and no bill. Measured on this host: 369 Arabic characters came back as
 * playable MP3 in 2113 ms, a short sentence in 643 ms. The contract is the
 * same `SpeechProvider` as the others, so the speech service, the progressive
 * narrator and the 🔊 route never learn which engine is behind it; switching
 * is one env var (`SPEECH_PROVIDER=edge`).
 *
 * Trade-off, stated plainly: the endpoint is Microsoft's consumer service, not
 * a contracted API. It is the right default for a zero-budget tutoring demo;
 * for permanent hosting, swap the provider or add a key — the interface is
 * what keeps that a configuration change and not a rewrite.
 */

/** One voice per reply language (D-042): the lesson's language is heard. */
export const EDGE_VOICES: Record<SpeechLanguage, string> = {
  ar: "ar-EG-SalmaNeural",
  en: "en-US-AriaNeural",
  fr: "fr-FR-DeniseNeural",
  de: "de-DE-KatjaNeural",
};

/** MP3: every browser the room supports plays it, and WebAudio decodes it. */
export const EDGE_MIME = "audio/mpeg";

/** How long the WebSocket handshake may take before the fallback takes over. */
const EDGE_CONNECT_TIMEOUT_MS = 10_000;

/** The slice of `MsEdgeTTS` this provider needs — small so tests inject a fake. */
export interface EdgeAudioStream {
  on(event: "data", listener: (chunk: Buffer) => void): unknown;
  on(event: "end" | "close", listener: () => void): unknown;
  on(event: "error", listener: (error: Error) => void): unknown;
}

export interface EdgeTtsConnection {
  setMetadata(voice: string, format: OUTPUT_FORMAT): Promise<void>;
  toStream(text: string): { audioStream: EdgeAudioStream };
  close(): void;
}

export type EdgeTtsFactory = () => EdgeTtsConnection;

const defaultTtsFactory: EdgeTtsFactory = () =>
  new MsEdgeTTS({ connectionTimeoutMs: EDGE_CONNECT_TIMEOUT_MS, synthesisTimeoutMs: config.SPEECH_TIMEOUT_MS });

export class EdgeSpeechProvider implements SpeechProvider {
  readonly id = "edge";

  constructor(private readonly createTts: EdgeTtsFactory = defaultTtsFactory) {}

  async synthesize(request: SpeechRequest): Promise<{ audio: Buffer; mimeType: string }> {
    const tts = this.createTts();
    try {
      await tts.setMetadata(EDGE_VOICES[request.language], OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const audio = await collectAudio(tts.toStream(request.text).audioStream);
      if (audio.length === 0) {
        throw Errors.serviceUnavailable("عاد الصوت فارغًا من مزوّد edge", "SPEECH_UNAVAILABLE");
      }
      return { audio, mimeType: EDGE_MIME };
    } catch (error) {
      // 503 + the exact SPEECH_UNAVAILABLE code: the speech service rethrows it
      // untouched, so the operator log keeps the cause, and the client answers
      // it by reading the reply with the browser's own voice.
      if (error instanceof AppError && error.code === "SPEECH_UNAVAILABLE") throw error;
      throw Errors.serviceUnavailable(
        `مزوّد الصوت (edge) أخطأ: ${error instanceof Error ? error.message : String(error)}`,
        "SPEECH_UNAVAILABLE",
      );
    } finally {
      try {
        tts.close();
      } catch {
        // The socket may already be gone; nothing is left to release.
      }
    }
  }
}

/**
 * Collects the synthesized bytes.
 *
 * Both `end` and `close` resolve: the library ends the stream on a complete
 * turn, but a socket that closes right after the last audio frame emits
 * `close` — treating `close` as failure would drop audio that actually
 * arrived, and resolving only on `end` would hang that same turn.
 */
function collectAudio(stream: EdgeAudioStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let settled = false;
    const settle = (action: () => void): void => {
      if (!settled) {
        settled = true;
        action();
      }
    };
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => settle(() => resolve(Buffer.concat(chunks))));
    stream.on("close", () => settle(() => resolve(Buffer.concat(chunks))));
    stream.on("error", (error) => settle(() => reject(error)));
  });
}
