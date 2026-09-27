import { config } from "../../../../config/env.js";
import { Errors } from "../../../../utils/errors.js";
import type { SpeechProvider, SpeechRequest, SpeechLanguage } from "../types.js";
import { toPlayableWav } from "../wav.js";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/** BCP-47 dialect hint per language, when the operator configured one. */
function languageHint(language: SpeechLanguage): string {
  return language === "en" ? config.GEMINI_TTS_LANGUAGE_EN : config.GEMINI_TTS_LANGUAGE_AR;
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
 */
export class GeminiSpeechProvider implements SpeechProvider {
  readonly id = "gemini";

  async synthesize(request: SpeechRequest): Promise<{ audio: Buffer; mimeType: string }> {
    if (!config.GEMINI_API_KEY) {
      throw Errors.serviceUnavailable("مفتاح مزوّد الصوت غير مضبوط", "SPEECH_UNAVAILABLE");
    }
    const model = config.GEMINI_TTS_MODEL;
    const hint = languageHint(request.language);
    const body = {
      contents: [{ role: "user", parts: [{ text: request.text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: config.GEMINI_TTS_VOICE,
              ...(hint ? { languageCode: hint } : {}),
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
      // Timeout or network failure: the client falls back to the browser voice,
      // so this is a "service unavailable", not an internal error.
      throw Errors.serviceUnavailable("تعذّر الوصول إلى مزوّد الصوت", "SPEECH_UNAVAILABLE");
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw Errors.serviceUnavailable(`مزوّد الصوت أخطأ (${res.status}) ${detail.slice(0, 200)}`, "SPEECH_UNAVAILABLE");
    }

    const data = (await res.json().catch(() => null)) as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }>;
    } | null;
    const inline = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
    if (!inline?.data) {
      throw Errors.serviceUnavailable("لم يُرجع مزوّد الصوت أي ملف صوتي", "SPEECH_UNAVAILABLE");
    }

    const mimeType = inline.mimeType ?? "audio/L16";
    const playable = toPlayableWav(Buffer.from(inline.data, "base64"), mimeType);
    if (!playable) {
      throw Errors.serviceUnavailable(`صيغة صوت غير مدعومة (${mimeType})`, "SPEECH_UNAVAILABLE");
    }
    return playable;
  }
}
