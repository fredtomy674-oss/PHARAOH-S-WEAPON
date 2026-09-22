// Web Speech layer for voice questions (سؤال بصوت) and spoken tutor replies.
//
// Design (D-015): browser-native STT (SpeechRecognition) + TTS
// (speechSynthesis) keep the voice layer fully client-side and key-free,
// reusing the existing chat message API unchanged — text chat and Vision
// (سؤال مصور) keep working as before by construction. The APIs require a
// secure context (HTTPS or localhost) and a Chromium-based browser; the E2E
// suite injects deterministic stubs for both (see e2e/voice.spec.ts).

export interface SttCallbacks {
  /** Fired once with the accumulated final transcript when recognition ends. */
  onTranscript: (finalText: string) => void;
  /** Fired when recognition stops (finished naturally or stopped by the user). */
  onEnd: () => void;
  /** Fired with a user-friendly Arabic message on a non-aborted error. */
  onError: (message: string | null) => void;
}

export interface SttHandle {
  /** Stops recognition; `onEnd` fires afterwards. */
  stop: () => void;
}

// Minimal structural types: cover both the standard SpeechRecognition and the
// webkit-prefixed variant, which the TS DOM lib does not type.
interface RecognitionCtor {
  new (): RecognitionLike;
}

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface RecognitionResultEvent {
  results: ArrayLike<RecognitionResult>;
}

type SpeechSynthWindow = Window & {
  SpeechRecognition?: RecognitionCtor;
  webkitSpeechRecognition?: RecognitionCtor;
};

function recognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as SpeechSynthWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function speechRecognitionSupported(): boolean {
  return recognitionCtor() !== undefined;
}

const STT_ERROR_MESSAGES: Record<string, string> = {
  "not-allowed":
    "الميكروفون غير مسموح — اسمح بالوصول إليه من إعدادات المتصفح ثم أعد المحاولة",
  "service-not-allowed": "الميكروفون غير مسموح بهذه الخدمة",
  "no-speech": "لم نسمع صوتًا — حاول التحدث مرة أخرى",
  "audio-capture": "تعذر الوصول إلى الميكروفون — تأكد من توصيله",
  network: "تعذر الاتصال بخدمة التعرف على الكلام — تحقق من اتصالك بالإنترنت",
  "language-not-supported": "اللغة المحددة غير مدعومة في هذا المتصفح",
};

/**
 * Starts dictation in Egyptian Arabic. Final results accumulate and are
 * delivered as one transcript on `onEnd` (so the student can review/edit it
 * before sending). Returns null when the browser has no SpeechRecognition.
 */
export function startTranscription(callbacks: SttCallbacks): SttHandle | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.lang = "ar-EG";
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  let finals = "";

  rec.onresult = (event) => {
    const results = event.results;
    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      if (item.isFinal) {
        const t = item[0]?.transcript ?? "";
        const trimmed = t.trim();
        if (trimmed) finals += (finals ? " " : "") + trimmed;
      }
    }
  };

  rec.onerror = (event) => {
    const message = STT_ERROR_MESSAGES[event.error] ?? null;
    // "aborted" is our own stop — treat as a clean end, no error toast.
    if (event.error === "aborted") {
      rec.onerror = null;
      callbacks.onEnd();
      return;
    }
    callbacks.onError(message);
  };

  rec.onend = () => {
    if (finals.trim()) {
      const transcript = finals;
      finals = "";
      callbacks.onTranscript(transcript);
    }
    callbacks.onEnd();
  };

  // Handlers above are called asynchronously by the browser; exceptions must
  // not escape into the speech stack (and must not hit the console).
  try {
    rec.start();
  } catch {
    return null;
  }
  return { stop: () => rec.stop() };
}

// ---------------------------------------------------------------- TTS ----

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function arabicVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  return synth.getVoices().find((v) => /^ar/i.test(v.lang)) ?? null;
}

/**
 * Speaks `text` through the browser's speech synthesis (Arabic voice when one
 * is installed). Any previously playing utterance is cancelled first, so only
 * one voice is heard at a time. `onDone` fires when the utterance ends or
 * errors. Returns the utterance (caller tracks it to ignore stale end-events
 * from cancelled earlier utterances), or null if TTS is unavailable.
 */
export function speakText(text: string, onDone: () => void): SpeechSynthesisUtterance | null {
  if (!ttsSupported()) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(trimmed);
  const voice = arabicVoice(synth);
  utterance.lang = voice?.lang ?? "ar";
  if (voice) {
    try {
      utterance.voice = voice;
    } catch {
      // Some engines reject voice objects that don't conform to the
      // SpeechSynthesisVoice contract (e.g. stubbed E2E voices). The
      // utterance still plays with an explicit `lang`, which is enough.
    }
  }
  utterance.onend = () => onDone();
  utterance.onerror = () => onDone();

  try {
    synth.speak(utterance);
  } catch {
    return null;
  }
  return utterance;
}

/** Stops whatever the browser is currently reading aloud. */
export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}