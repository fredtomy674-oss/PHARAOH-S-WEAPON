import { config } from "../../../config/env.js";
import { AppError, Errors } from "../../../utils/errors.js";
import { sha256Hex } from "../../../utils/ids.js";
import { AiCache } from "../cache.js";
import { createSpeechProvider } from "./factory.js";
import type { SpeechLanguage, SpeechProvider, SpeechRequest, SpeechResult } from "./types.js";

/**
 * Cache policy: a reply is read aloud as often as the student presses 🔊, and
 * re-synthesizing identical text costs money and a second of latency every
 * time. Keyed by (language, model, voice, text) so a reply never changes voice
 * mid-lesson, and a *changed* voice/model invalidates old entries.
 *
 * Capped small on purpose: 24 kB/s of PCM means a 10-second reply is ~480 KB,
 * so this stays an LRU of recent replies rather than a growing store.
 */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 32;

export interface SpeechServiceOptions {
  /** Explicit provider (tests); otherwise resolved from configuration. */
  provider?: SpeechProvider | null;
  ttlMs?: number;
  maxEntries?: number;
}

/**
 * PHASE 40 (D-044) — the server's voice.
 *
 * Owns three decisions and nothing else: *whether* the server can speak at
 * all, *how long* a text may be before we refuse it, and *caching*. Route
 * authorization, message lookup and language resolution stay in the session
 * service — this class never touches the database.
 */
export class SpeechService {
  private readonly cache: AiCache<Omit<SpeechResult, "cached">>;
  private resolved: SpeechProvider | null | undefined;

  constructor(private readonly opts: SpeechServiceOptions = {}) {
    this.cache = new AiCache<Omit<SpeechResult, "cached">>({ ttlMs: opts.ttlMs ?? CACHE_TTL_MS, maxEntries: opts.maxEntries ?? CACHE_MAX_ENTRIES });
  }

  /** The active provider, or null when server speech is switched off. */
  get provider(): SpeechProvider | null {
    if (this.resolved === undefined) {
      this.resolved = this.opts.provider === undefined ? createSpeechProvider() : this.opts.provider;
    }
    return this.resolved;
  }

  /** True when the server can produce audio (the client uses it as a hint). */
  get available(): boolean {
    return this.provider !== null;
  }

  /** Provider id for /api/health — "none" when server speech is off. */
  providerId(): string {
    return this.provider?.id ?? "none";
  }

  /**
   * Synthesizes `text` in `language`.
   *
   * Throws `503 SPEECH_UNAVAILABLE` when the server has no provider, and
   * 503 as well on any provider failure or timeout: the client answers that by
   * reading the reply with the browser's own voice, so an outage degrades the
   * experience instead of breaking the 🔊 button.
   */
  async synthesize(request: SpeechRequest): Promise<SpeechResult> {
    const provider = this.provider;
    if (!provider) {
      throw Errors.serviceUnavailable("النطق على الخادم غير مُفعَّل", "SPEECH_UNAVAILABLE");
    }
    const text = capText(request.text, config.SPEECH_MAX_CHARS);
    if (!text) {
      throw Errors.badRequest("لا يوجد نصّ للنطق", "SPEECH_EMPTY_TEXT");
    }

    const key = `${request.language}:${config.GEMINI_TTS_MODEL}:${config.GEMINI_TTS_VOICE}:${sha256Hex(text)}`;
    const hit = this.cache.get(key);
    if (hit) return { ...hit, cached: true };

    try {
      const result = await provider.synthesize({ text, language: request.language });
      if (result.audio.length === 0) {
        throw Errors.serviceUnavailable("ملف صوتي فارغ", "SPEECH_UNAVAILABLE");
      }
      this.cache.set(key, result);
      return { ...result, cached: false };
    } catch (error) {
      // Providers map their own failures to SPEECH_UNAVAILABLE; anything else
      // (a bug, an unparsable response) is still a 503 — never a 500, because
      // the client's answer to 503 is "read it with the browser voice".
      if (error instanceof AppError && error.code === "SPEECH_UNAVAILABLE") throw error;
      throw Errors.serviceUnavailable("تعذّر توليد الصوت", "SPEECH_UNAVAILABLE");
    }
  }

  /** Cache counters (surfaced on /api/health next to the AI cache). */
  cacheStats(): { hits: number; misses: number; size: number; maxEntries: number } {
    return this.cache.stats();
  }
}

/**
 * Trims over-long text to the cap, cutting at the last space so the audio
 * never starts mid-word. Replies are ~600 chars, so this is a guardrail for
 * pathological content, not a routine path.
 */
export function capText(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  const cut = trimmed.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxChars / 2 ? cut.slice(0, lastSpace) : cut).trim();
}

export type { SpeechLanguage, SpeechProvider, SpeechRequest, SpeechResult };
