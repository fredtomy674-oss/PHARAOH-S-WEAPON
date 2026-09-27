import { config } from "../../../config/env.js";
import { GeminiSpeechProvider } from "./providers/geminiSpeech.js";
import { StubSpeechProvider } from "./providers/stubSpeech.js";
import type { SpeechProvider } from "./types.js";

export type SpeechProviderKind = "none" | "stub" | "gemini";

/**
 * Resolves the speech provider from configuration (PHASE 40 / D-044).
 *
 * "none" (the default) returns null: the server has no voice, and the student
 * keeps the browser voice exactly as before. This keeps the offline promise
 * honest — no surprise network calls, no surprise cost — while making the fix
 * one env var away for operators who want Arabic narration everywhere.
 */
export function createSpeechProvider(kind: SpeechProviderKind = config.SPEECH_PROVIDER): SpeechProvider | null {
  switch (kind) {
    case "gemini":
      return new GeminiSpeechProvider();
    case "stub":
      return new StubSpeechProvider();
    case "none":
      return null;
  }
}
