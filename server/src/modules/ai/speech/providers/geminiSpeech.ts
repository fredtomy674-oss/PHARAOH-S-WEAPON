import { config } from "../../../../config/env.js";
import { Errors } from "../../../../utils/errors.js";
import type { SpeechProvider, SpeechRequest, SpeechLanguage } from "../types.js";
import { isPcmMime, pcmToWav, readPcmSampleRate, toPlayableWav, WAV_MIME } from "../wav.js";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/**
 * BCP-47 dialect hint per language, when the operator configured one. An empty
 * hint asks the model to detect the language from the text itself; the four
 * entries mirror the tutor's reply languages (PHASE 63).
 */
const LANGUAGE_HINTS: Record<SpeechLanguage, () => string> = {
  ar: () => config.GEMINI_TTS_LANGUAGE_AR,
  en: () => config.GEMINI_TTS_LANGUAGE_EN,
  fr: () => config.GEMINI_TTS_LANGUAGE_FR,
  de: () => config.GEMINI_TTS_LANGUAGE_DE,
};

function languageHint(language: SpeechLanguage): string {
  return LANGUAGE_HINTS[language]();
}

/** How many pieces are synthesized at once (see `synthesizeParts`). */
const PART_CONCURRENCY = 3;
/** Above this many characters one request is measurably faster than several. */
const PART_MAX_CHARS = 120;
/** A piece shorter than this sounds worse than it saves. */
const PART_MIN_CHARS = 40;
/** A hard bound on pieces, so a long reply cannot fan out into a dozen buckets. */
const PART_MAX_COUNT = 8;

/**
 * Splits narration into sentence-sized pieces that can be synthesized in
 * parallel.
 *
 * PHASE 56, measured on the real provider with the real Arabic voice: synthesis
 * time grows with the text — 48 chars 3.0s, 160 chars 6.7s, 389 chars 12.5s — so
 * asking for a whole reply in one request made the 🔊 button wait longer than
 * the tutor's own answer. The same 160 characters in three parallel requests
 * came back in 3.9s instead of 6.7s.
 *
 * Splitting happens at sentence boundaries, because a piece that ends mid-number
 * is spoken wrongly, and pieces are merged up to `PART_MIN_CHARS` so a reply of
 * short sentences does not turn into a burst of tiny requests.
 */
export function splitForSynthesis(
  text: string,
  maxChars = PART_MAX_CHARS,
  minChars = PART_MIN_CHARS,
  maxCount = PART_MAX_COUNT,
): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return [trimmed];

  const pieces: string[] = [];
  let current = "";
  const flush = (): void => {
    const piece = current.trim();
    if (piece) pieces.push(piece);
    current = "";
  };
  for (const sentence of trimmed.split(/(?<=[.!?؟…\n])\s*/u)) {
    if (!sentence) continue;
    if (current && current.length + sentence.length > maxChars) flush();
    current += (current ? " " : "") + sentence;
  }
  flush();

  // Merge neighbours that are too small to be worth a request of their own.
  const merged: string[] = [];
  for (const piece of pieces) {
    const last = merged[merged.length - 1];
    if (last !== undefined && last.length < minChars && last.length + piece.length + 1 <= maxChars) {
      merged[merged.length - 1] = `${last} ${piece}`;
    } else {
      merged.push(piece);
    }
  }
  // Fewer pieces than the bound: fold the tail into the last one rather than
  // dropping words — the reply must be spoken whole.
  while (merged.length > maxCount) {
    const tail = merged.pop()!;
    merged[merged.length - 1] = `${merged[merged.length - 1]} ${tail}`;
  }
  return merged;
}

/**
 * Joins parallel pieces back into one playable file.
 *
 * Only raw PCM of one rate can be concatenated safely; anything else (a
 * container the browser may or may not play) returns null so the caller speaks
 * the whole reply in one request instead of shipping audio that would break at
 * the seam.
 */
function joinParts(parts: Array<{ audio: Buffer; mimeType: string }>): { audio: Buffer; mimeType: string } | null {
  if (parts.length === 0) return null;
  if (parts.length === 1) return toPlayableWav(parts[0]!.audio, parts[0]!.mimeType);
  const rate = readPcmSampleRate(parts[0]!.mimeType, 0);
  if (rate === 0) return null;
  for (const part of parts) {
    if (!isPcmMime(part.mimeType) || readPcmSampleRate(part.mimeType, 0) !== rate) return null;
  }
  return { audio: pcmToWav(Buffer.concat(parts.map((p) => p.audio)), { sampleRate: rate, channels: 1, bitsPerSample: 16 }), mimeType: WAV_MIME };
}

/**
 * Gemini speech synthesis (PHASE 40 / D-044).
 *
 * Plain `fetch` like the text/embedding/OCR providers above — no client
 * dependency. The student never talks to this API: the server does, and the
 * student receives audio bytes, so the key stays off the browser and the
 * student installs nothing.
 *
 * Model and voice are operator-configurable because only the operator's key
 * decides which of the preview TTS models is available; a wrong name fails
 * loudly here (→ 503 → the client falls back to the browser voice) instead of
 * silently degrading the lesson.
 *
 * PHASE 44 — availability: preview TTS models exhaust their per-model quota
 * and hit transient 429/503 spikes independently (measured live: one model
 * was exhausted while the reply went English via the browser voice). The
 * provider therefore walks an ordered candidate list (primary + fallbacks),
 * one fetch per model, and serves the first success. The cache then makes
 * repeat presses free, so Arabic narration survives any single bad bucket.
 */
export class GeminiSpeechProvider implements SpeechProvider {
  readonly id = "gemini";

  async synthesize(request: SpeechRequest): Promise<{ audio: Buffer; mimeType: string }> {
    if (!config.GEMINI_API_KEY) {
      throw Errors.serviceUnavailable("مفتاح مزوّد الصوت غير مضبوط", "SPEECH_UNAVAILABLE");
    }
    const candidates: string[] = [
      config.GEMINI_TTS_MODEL,
      ...(config.GEMINI_TTS_FALLBACKS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ];
    const hint = languageHint(request.language);
    // PHASE 56 — a long reply is synthesized as parallel sentence-sized pieces
    // (measured: 160 chars took 6.7s in one request, 3.9s in three).
    const parts = splitForSynthesis(request.text);
    const failures: string[] = [];
    for (const model of candidates) {
      try {
        if (parts.length > 1) {
          const spoken = joinParts(await this.synthesizeParts(model, hint, parts));
          // Pieces that cannot be joined (an unexpected container) are no reason
          // to give up on the voice: one request for the whole reply is slower
          // but always correct.
          if (spoken) return spoken;
        }
        const raw = await this.fetchAudio(model, hint, request.text);
        const playable = toPlayableWav(raw.audio, raw.mimeType);
        if (!playable) {
          throw Errors.serviceUnavailable(`صيغة صوت غير مدعومة (${raw.mimeType})`, "SPEECH_UNAVAILABLE");
        }
        return playable;
      } catch (err) {
        // e.g. "429 quota" — note the model + code, move to the next bucket.
        const code = (err as { code?: string }).code ?? "ERR";
        failures.push(`${model}(${code})`);
      }
    }
    throw Errors.serviceUnavailable(
      `مزوّد الصوت لا يجيب على أي من النماذج: ${failures.join("، ")}`,
      "SPEECH_UNAVAILABLE",
    );
  }

  /**
   * PHASE 56 — the pieces of one reply, at a bounded concurrency.
   *
   * Three at a time, not eight: measured live, a burst of parallel requests is
   * what earns the per-model 429 PHASE 44 already had to work around. A piece
   * that fails once is retried on its own before the whole model is written off,
   * because one busy bucket should not cost the student the voice.
   */
  private async synthesizeParts(
    model: string,
    hint: string,
    parts: string[],
  ): Promise<Array<{ audio: Buffer; mimeType: string }>> {
    const pieces: Array<{ audio: Buffer; mimeType: string }> = new Array(parts.length);
    let next = 0;
    let bucketEmpty = false;
    const worker = async (): Promise<void> => {
      while (next < parts.length) {
        if (bucketEmpty) throw Errors.serviceUnavailable("حصة النموذج نفدت", "SPEECH_UNAVAILABLE:429");
        const i = next;
        next += 1;
        try {
          pieces[i] = await this.fetchAudio(model, hint, parts[i]!);
        } catch (err) {
          // A 429 is the *model's* bucket being empty, not one unlucky piece, so
          // it stops the fan-out here and the caller moves to the next candidate.
          // Measured: walking six pieces — each retried — before failing over
          // took 24s, silence far longer than the whole voice path costs, while
          // the browser's own voice could have started at once.
          if (String((err as { code?: string }).code ?? "").endsWith(":429")) {
            bucketEmpty = true;
            throw err;
          }
          // A dropped socket on one piece is worth one more try of that piece:
          // the voice is not worth losing the whole reply over.
          pieces[i] = await this.fetchAudio(model, hint, parts[i]!);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(PART_CONCURRENCY, parts.length) }, worker));
    return pieces;
  }

  /** One request, one piece, exactly as the provider returned it. */
  private async fetchAudio(
    model: string,
    hint: string,
    text: string,
  ): Promise<{ audio: Buffer; mimeType: string }> {
    const body = {
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          // The BCP-47 dialect hint lives on speechConfig, NOT inside
          // prebuiltVoiceConfig: the API rejected `languageCode` there (400
          // "Cannot find field"), which silently broke every configured hint
          // (they were off by default, so it only surfaced once an operator
          // set GEMINI_TTS_LANGUAGE_*). Without a hint the model auto-detects
          // the language from the text, which flipped to English on repeated
          // Arabic synthesis during upstream variability — the hint pins it.
          ...(hint ? { languageCode: hint } : {}),
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: config.GEMINI_TTS_VOICE,
            },
          },
        },
      },
    };

    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/models/${model}:generateContent?key=${config.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(config.SPEECH_TIMEOUT_MS),
      });
    } catch {
      // Timeout or network failure: fall through to the next candidate (the
      // client's last resort is the browser voice, so this is still a 503).
      throw Errors.serviceUnavailable("تعذّر الوصول إلى مزوّد الصوت", "SPEECH_UNAVAILABLE");
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw Errors.serviceUnavailable(
        `مزوّد الصوت أخطأ (${res.status}) ${detail.slice(0, 200)}`,
        `SPEECH_UNAVAILABLE:${res.status}`,
      );
    }

    const data = (await res.json().catch(() => null)) as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }>;
    } | null;
    const inline = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
    if (!inline?.data) {
      throw Errors.serviceUnavailable("لم يُرجع مزوّد الصوت أي ملف صوتي", "SPEECH_UNAVAILABLE");
    }

    const mimeType = inline.mimeType ?? "audio/L16";
    return { audio: Buffer.from(inline.data, "base64"), mimeType };
  }
}