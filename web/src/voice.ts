// Web Speech layer for voice questions (سؤال بصوت) and spoken tutor replies.
//
// Design (D-015): browser-native STT (SpeechRecognition) + TTS
// (speechSynthesis) keep the voice layer fully client-side and key-free,
// reusing the existing chat message API unchanged — text chat and Vision
// (سؤال مصور) keep working as before by construction. The APIs require a
// secure context (HTTPS or localhost) and a Chromium-based browser; the E2E
// suite injects deterministic stubs for both (see e2e/voice.spec.ts).
//
// Language (D-043): dictation and narration follow the *reply* language the
// server resolved for the lesson (D-042) — never a hardcoded Arabic.
//
// Voice (D-044): the spoken reply comes from the *server* when it has a voice
// (that is what makes Arabic audible on a machine with no Arabic voice pack);
// the browser's own voice is the fallback, used when the server has none or
// something fails. Dictation stays browser-native — Chrome already recognizes
// Arabic without any installed voice.

/**
 * PHASE 39 (D-043) — the *spoken* layer follows the same language as the
 * written reply (PHASE 38/D-042): a language curriculum is dictated and
 * narrated in English, every other curriculum in Egyptian Arabic. The chrome
 * around it (labels, notices) stays Arabic — only the content language moves.
 */
export type VoiceLanguage = "ar" | "en";

/** BCP-47 tags handed to SpeechRecognition / SpeechSynthesis. */
const SPEECH_TAG: Record<VoiceLanguage, string> = {
  ar: "ar-EG",
  en: "en-US",
};

const LANGUAGE_NAME_AR: Record<VoiceLanguage, string> = {
  ar: "العربية",
  en: "الإنجليزية",
};

/** The language's own label in the (usually English) Windows settings UI. */
const LANGUAGE_WIN: Record<VoiceLanguage, string> = {
  ar: "Arabic (Egypt)",
  en: "English (United States)",
};

/** The BCP-47 tag for a reply language (Egypt is the default Arabic locale). */
export function speechTag(language: VoiceLanguage): string {
  return SPEECH_TAG[language] ?? SPEECH_TAG.ar;
}

/**
 * Actionable notice for a machine with no voice for the lesson language — the
 * browser then reads the text with some other voice, which is exactly the
 * "the tutor talks in English" confusion this phase removes.
 *
 * The wording names the Windows path because that is where a real blocked
 * student lands, and a notice that does not say *where* to act is just an
 * apology. Verified on a machine that ships a single en-US voice: without the
 * Arabic pack the browser genuinely cannot pronounce Arabic, and no amount of
 * application code changes that.
 */
export function missingVoiceNotice(language: VoiceLanguage): string {
  const name = LANGUAGE_NAME_AR[language] ?? LANGUAGE_NAME_AR.ar;
  const win = LANGUAGE_WIN[language] ?? LANGUAGE_WIN.ar;
  return (
    `لا يوجد صوت ${name} مثبّت على هذا الجهاز، فقد يُنطق الردّ بصوت آخر. ` +
    `أضِفه من إعدادات نظامك (ويندوز: Time & language ← Language & region ← ${win} ← Language options ← Speech) ` +
    `ثم أعد تشغيل المتصفح. ونصّ الردّ متاح دائمًا في الفقاعة.`
  );
}

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
 * Starts dictation in the reply language (D-043: Egyptian Arabic by default,
 * English inside a language curriculum). Final results accumulate and are
 * delivered as one transcript on `onEnd` (so the student can review/edit it
 * before sending). Returns null when the browser has no SpeechRecognition.
 */
export function startTranscription(
  callbacks: SttCallbacks,
  language: VoiceLanguage = "ar",
): SttHandle | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.lang = speechTag(language);
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

let voiceCache: SpeechSynthesisVoice[] = [];
let voicesListenerAttached = false;

type SynthWithListener = {
  addEventListener?: (type: string, listener: () => void) => void;
};

/**
 * Reads the installed voices, keeping the last non-empty list.
 *
 * Chrome fills the voice list asynchronously: `getVoices()` returns `[]` until
 * the `voiceschanged` event fires, so the FIRST 🔊 used to run with an empty
 * list — no voice to pick and (worse) a false "no voice installed" warning on
 * machines that do have one. Refreshing on the event fixes both.
 */
function primeVoices(synth: SpeechSynthesis): SpeechSynthesisVoice[] {
  const fresh = synth.getVoices();
  if (fresh.length > 0) voiceCache = fresh;
  if (!voicesListenerAttached) {
    const add = (synth as unknown as SynthWithListener).addEventListener;
    // A stubbed/absent EventTarget simply refreshes on every call instead.
    if (typeof add === "function") {
      voicesListenerAttached = true;
      add.call(synth, "voiceschanged", () => primeVoices(synth));
    }
  }
  return voiceCache;
}

function baseLang(tag: string): string {
  return tag.slice(0, 2).toLowerCase();
}

/** Best installed voice for the language: exact tag first, then same base. */
function pickVoice(voices: SpeechSynthesisVoice[], language: VoiceLanguage): SpeechSynthesisVoice | null {
  const wanted = speechTag(language);
  return (
    voices.find((v) => v.lang.toLowerCase() === wanted.toLowerCase()) ??
    voices.find((v) => baseLang(v.lang) === baseLang(wanted)) ??
    null
  );
}

export interface SpeakResult {
  utterance: SpeechSynthesisUtterance | null;
  /**
   * The browser listed its voices and none of them speaks the reply language.
   * An empty list means "still loading", which is NOT a missing voice.
   */
  missingVoice: boolean;
}

/**
 * Speaks `text` in the reply language, using an installed voice for that
 * language when there is one. Any previously playing utterance is cancelled
 * first, so only one voice is heard at a time. `onDone` fires when the
 * utterance ends or errors. Returns the utterance (caller tracks it to ignore
 * stale end-events from cancelled earlier utterances) plus whether the machine
 * has a voice for the language, or `utterance: null` if TTS is unavailable.
 */
export function speakText(
  text: string,
  language: VoiceLanguage,
  onDone: () => void,
): SpeakResult {
  if (!ttsSupported()) return { utterance: null, missingVoice: false };
  const trimmed = text.trim();
  if (!trimmed) return { utterance: null, missingVoice: false };

  const synth = window.speechSynthesis;
  synth.cancel();

  const voices = primeVoices(synth);
  const voice = pickVoice(voices, language);

  const utterance = new SpeechSynthesisUtterance(trimmed);
  // The tag is the contract every engine honours; attaching the voice object
  // is a best-effort extra (some engines reject foreign voice objects, and
  // the E2E stubs expose plain objects rather than SpeechSynthesisVoices).
  utterance.lang = voice?.lang ?? speechTag(language);
  if (voice) {
    try {
      utterance.voice = voice;
    } catch {
      // Keep the explicit `lang` — that alone selects the right language.
    }
  }
  utterance.onend = () => onDone();
  utterance.onerror = () => onDone();

  try {
    synth.speak(utterance);
  } catch {
    return { utterance: null, missingVoice: false };
  }
  return { utterance, missingVoice: voices.length > 0 && voice === null };
}

/** Stops whatever the browser is currently reading aloud. */
export function stopSpeaking(): void {
  stopAudio();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// ------------------------------------------------- server audio (PHASE 40) --

/**
 * PHASE 40 (D-044) — plays audio the *server* generated.
 *
 * The server holds the voice (and the key), so a student on a machine with no
 * Arabic voice installed still hears the Arabic reply — the whole point of
 * this phase. The browser fallback above stays for offline/provider-off cases.
 *
 * A single element is ever active, and it is always released: stopping clears
 * playback and revokes the object URL, so repeated presses cannot leak blobs.
 */
let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;

export interface AudioHandle {
  /** Stops playback (also fires `onDone`, so the caller's state stays true). */
  stop: () => void;
}

export interface AudioHandlers {
  /** Playback actually started (the promise from `play()` resolved). */
  onStart: () => void;
  /** Playback finished or was stopped. */
  onDone: () => void;
  /** The browser refused or failed to play these bytes (→ fall back). */
  onError: () => void;
}

export function playAudioBlob(blob: Blob, handlers: AudioHandlers): AudioHandle | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  stopAudio();

  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;
  currentAudioUrl = url;
  let finished = false;

  const release = () => {
    if (finished) return false;
    finished = true;
    if (currentAudio === audio) {
      currentAudio = null;
      currentAudioUrl = null;
    }
    URL.revokeObjectURL(url);
    return true;
  };

  audio.addEventListener("ended", () => {
    if (!release()) return;
    handlers.onDone();
  });
  audio.addEventListener("error", () => {
    if (!release()) return;
    handlers.onError();
  });

  const stop = () => {
    audio.pause();
    // `ended` never fires for a paused element, so finish it ourselves.
    if (release()) handlers.onDone();
  };

  audio.play().then(
    () => {
      if (!finished) handlers.onStart();
    },
    () => {
      // Autoplay policy or an undecodable stream: let the caller fall back to
      // the browser's own voice rather than leaving 🔊 dead.
      if (release()) handlers.onError();
    },
  );

  return { stop };
}

/** Stops server-generated audio, if any is playing. */
export function stopAudio(): void {
  const audio = currentAudio;
  currentAudio = null;
  if (!audio) return;
  audio.pause();
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
}