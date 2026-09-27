/**
 * PHASE 40 — D-044: server-side speech synthesis.
 *
 * The browser's `speechSynthesis` is not a speech engine: it hands the text to
 * voices **installed on the reader's operating system**. A student on a plain
 * Windows install therefore cannot hear an Arabic reply at all — a platform
 * fact no application code can change (verified on the dev machine: one
 * en-US voice, no Arabic pack, no OneCore entry).
 *
 * So the *server* becomes the voice: it holds the provider key and the
 * language model, and the student receives finished audio. The browser voice
 * remains the fallback (offline, provider down, decode failure), which is why
 * this is a provider interface and not a rewrite of the voice layer.
 */
export type SpeechLanguage = "ar" | "en";

export interface SpeechRequest {
  /** The text to read aloud (already capped by the service). */
  text: string;
  /**
   * The language to speak — the same language the tutor wrote in (D-042), so
   * an English curriculum is *heard* in English.
   */
  language: SpeechLanguage;
}

export interface SpeechResult {
  /** Encoded audio bytes, ready to stream to the browser. */
  audio: Buffer;
  /** Always an `audio/*` type the browser can play (WAV in practice). */
  mimeType: string;
  /** True when this result came from the in-memory cache, not the provider. */
  cached: boolean;
}

export interface SpeechProvider {
  readonly id: string;
  synthesize(request: SpeechRequest): Promise<Omit<SpeechResult, "cached">>;
}
