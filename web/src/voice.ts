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

import { classifyLiveUtterance, shouldYieldFloor, visibleLiveCaption } from "./echoGuard.js";

/**
 * PHASE 39 (D-043) — the *spoken* layer follows the same language as the
 * written reply (PHASE 38/D-042): a language curriculum is dictated and
 * narrated in English, every other curriculum in Egyptian Arabic. The chrome
 * around it (labels, notices) stays Arabic — only the content language moves.
 */
/**
 * PHASE 39 (D-043) — the *spoken* layer follows the same language as the
 * written reply (PHASE 38/D-042). PHASE 63 — extended to French and German so a
 * curriculum taught in either is dictated and narrated in that language. The
 * chrome around it (labels, notices) stays Arabic — only the content language
 * moves.
 */
export type VoiceLanguage = "ar" | "en" | "fr" | "de";

/** BCP-47 tags handed to SpeechRecognition / SpeechSynthesis. */
const SPEECH_TAG: Record<VoiceLanguage, string> = {
  ar: "ar-EG",
  en: "en-US",
  fr: "fr-FR",
  de: "de-DE",
};

const LANGUAGE_NAME_AR: Record<VoiceLanguage, string> = {
  ar: "العربية",
  en: "الإنجليزية",
  fr: "الفرنسية",
  de: "الألمانية",
};

/** The language's own label in the (usually English) Windows settings UI. */
const LANGUAGE_WIN: Record<VoiceLanguage, string> = {
  ar: "Arabic (Egypt)",
  en: "English (United States)",
  fr: "French (France)",
  de: "German (Germany)",
};

/** The BCP-47 tag for a reply language (Egypt is the default Arabic locale). */
export function speechTag(language: VoiceLanguage): string {
  return SPEECH_TAG[language] ?? SPEECH_TAG.ar;
}

/**
 * PHASE 172 — which machine the student is holding, for notices that must name
 * a path he can actually walk. The owner's phone presented the tutor going
 * silent and then read instructions for opening Windows settings — a phone
 * cannot follow that, so a notice that does not know the device is just an
 * apology. Kept a pure string function (clock- and DOM-injected) so every
 * platform's wording is unit-testable.
 */
export type VoicePlatform = "android" | "ios" | "desktop";

export function voicePlatform(): VoicePlatform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  // iPadOS reports itself as macOS — the touch points are what expose it.
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && "ontouchend" in navigator)) return "ios";
  return "desktop";
}

/**
 * Actionable notice for a machine with no voice for the lesson language. The
 * room never falls back to a wrong-language voice (PHASE 78), so the honest
 * outcome is the written reply plus this notice — and the fix is free on every
 * platform it names (PHASE 172: the phone paths were missing, and on the
 * owner's Android the free install is the whole difference between the tutor
 * speaking and the tutor being mute).
 */
export function missingVoiceNotice(language: VoiceLanguage, platform: VoicePlatform = voicePlatform()): string {
  const name = LANGUAGE_NAME_AR[language] ?? LANGUAGE_NAME_AR.ar;
  const win = LANGUAGE_WIN[language] ?? LANGUAGE_WIN.ar;
  const steps =
    platform === "android"
      ? "الإعدادات ← النظام ← اللغات والإدخال ← تحويل النصّ إلى كلام ← محرك Google ← ⚙ إعدادات المحرك ← تثبيت بيانات الصوت ← «العربية»"
      : platform === "ios"
        ? "الإعدادات ← إمكانية الوصول ← المحتوى المنطوق ← الأصوات ← «العربية»"
        : `ويندوز: Time & language ← Language & region ← ${win} ← Language options ← Speech`;
  return (
    `لا يوجد صوت ${name} مثبّت على هذا الجهاز، ولن يُسمع الردّ حتى يُثبَّت (التثبيت مجاني). ` +
    `أضِفه من: ${steps} ` +
    `ثم أعد تشغيل المتصفح. ونصّ الردّ متاح دائمًا في الفقاعة.`
  );
}

/**
 * PHASE 172 — the second half of the truth when the server's voice is also
 * down (the narration quota): saying only "no voice on this machine" would
 * hide that the cloud voice was asked for and refused. Shown together with
 * `missingVoiceNotice` when both facts are known.
 */
export const SERVER_VOICE_DOWN_NOTE =
  "وصوت المعلّم السحابي غير متاح حاليًا (انتهى رصيد النطق على الخادم) — التثبيت المجاني أعلاه يعمل بلا رصيد.";

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
  /** First result changed in this event (real engines); may be absent. */
  resultIndex?: number;
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
  // PHASE 174 — the failure this text names most often is a busy device (a
  // call, a voice note recording, another tab holding the microphone), on a
  // phone far more often than on a desktop.
  "audio-capture": "تعذر الوصول إلى الميكروفون — تأكد من أنه غير مستخدم في تطبيق آخر ثم أعد المحاولة",
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

/**
 * PHASE 56 — the reply as it should be HEARD: whole sentences, in order.
 *
 * A voice reading half a sentence aloud while the sentence is still being
 * written sounds broken and is wrong to do, so a chunk is only released once it
 * is finished: a full stop, a question mark, an exclamation mark, an ellipsis,
 * or a line break (which is how models separate the parts of a reply).
 *
 * Two details that Arabic maths actually needs:
 *
 *  • `2.5` is a number, not an ending — a point between digits is never a
 *    sentence end, so a decimal never cuts the voice off mid-number.
 *  • A reply that runs on without punctuation must not hold the voice hostage:
 *    past `limit` characters the chunk is released anyway.
 */
/** One whole sentence, and where it ends inside the text it came from. */
export interface Sentence {
  text: string;
  /** Index in the source text just past this sentence. */
  end: number;
}

/**
 * Does the character at `i` end a sentence? Two guards Arabic maths actually
 * needs: `2.5` is a number, not an ending, and a point only ends a sentence
 * when whitespace (or the end) follows it — which also keeps abbreviations and
 * file names from cutting a sentence. Exported because the narrator's fast
 * start (PHASE 169) must agree with it exactly.
 */
export function isSentenceEnd(text: string, i: number): boolean {
  const ch = text[i];
  if (ch === undefined || !/[.!?؟…\n]/.test(ch)) return false;
  if (ch === "." && /\d/.test(text[i - 1] ?? "") && /\d/.test(text[i + 1] ?? "")) return false;
  const next = text[i + 1];
  if (ch === "." && next !== undefined && !/\s/.test(next)) return false;
  return true;
}

export function splitSentences(text: string, limit = 140): { ready: Sentence[]; rest: string } {
  const ready: Sentence[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (!isSentenceEnd(text, i)) continue;
    const cut = i + 1;
    const chunk = text.slice(start, cut).trim();
    // `end` is an offset into `text`, not into the trimmed chunk: the narrator
    // needs to know exactly how much of the reply has been read, and searching
    // for trimmed text to recover that offset would fail on the very whitespace
    // trimming removed.
    if (chunk) ready.push({ text: chunk, end: cut });
    start = cut;
  }
  if (text.length - start >= limit) {
    const cut = start + limit;
    const chunk = text.slice(start, cut).trim();
    if (chunk) ready.push({ text: chunk, end: cut });
    return { ready, rest: text.slice(cut) };
  }
  return { ready, rest: text.slice(start) };
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

// -------------------------------------------------- the watchdog (PHASE 166) --

/**
 * How long an utterance may stay silent before it counts as not started.
 *
 * PHASE 172 — 2000 → 3000: on the owner's phone, a start that was merely slow
 * (a cold TTS service after the previous sentence) fell inside the old budget,
 * so the watchdog cancelled a healthy sentence and handed it over again — the
 * audible «يتوقف ثم يستمر» that was reported. A truly dead utterance still
 * gets its revive; it just waits one more breath for a living one to prove it.
 */
const WATCH_START_MS = 3000;

/**
 * PHASE 167 — the breath the engine gets between cancelling a reading and the
 * next hand-over. `cancel()` immediately followed by `speak()` in the same
 * task is what wedges Chrome on Android (the owner's «بعد ردّين ثلاثة الاستماع
 * لا يعمل»): a later task, a few hundred ms apart, keeps it alive.
 */
const CANCEL_GAP_MS = 260;

/** The second revive's rest: longer, because the first gap did not save it. */
const REVIVE_GAP_2_MS = 700;

/**
 * A generous upper bound for a spoken line (Arabic TTS is slow; measured
 * replies run around 60–90 ms per character). Only a dead utterance is ever
 * cancelled, so the bound errs large on purpose.
 */
function watchEndMs(textLength: number): number {
  return Math.min(30_000, Math.max(4_000, textLength * 110 + 3000));
}

/** Bumped by every cancel: a watchdog left over from a cancelled attempt dies. */
let speechEpoch = 0;

/**
 * True while a hand-over from this module is queued or being spoken. The
 * engine's own flags lie on exactly the phones this watchdog exists for
 * (`speaking` sticks true after a cancel), so a later `speakText` must also
 * know that *this module* just handed something over — otherwise it would
 * `speak()` straight into the previous, still-fresh utterance.
 */
let engineBusyFlag = false;

/** The local engine proved wedged on this page session (see `speakText`). */
let localVoiceFailed = false;

/**
 * True once the local engine has been declared wedged: callers stop asking it
 * to speak and fall back (the room asks the server for a voice; the narrator
 * reports `broken`). Sticky per page load — the revive already failed twice.
 */
export function localVoiceWedged(): boolean {
  return localVoiceFailed;
}

/**
 * PHASE 167 — an engine declared wedged gets a fresh chance when the *student*
 * asks for the voice: pressing 🔊 «استمع مرة أخرى», or switching «القراءة
 * التلقائية» back on. The wedge is a property of this page load, and an
 * explicit press is exactly the moment a new attempt is honest — never
 * automatic (an automatic retry every turn would re-pay the silence every
 * turn), and never silent.
 */
export function resetLocalVoice(): void {
  localVoiceFailed = false;
}

/**
 * PHASE 172 — one honest record of the voice decision, written by the room on
 * every turn: WHICH path will read this reply and WHY. The stutter and the
 * silence were both diagnosed from outside this time; the next phone test
 * should not need a guessing game — `window.__voiceDiag` answers it.
 */
export interface VoiceDiag {
  /** The browser has speechSynthesis at all. */
  tts: boolean;
  /** How many voices the browser lists (0 = still loading, not "none"). */
  voices: number;
  /** A voice for the lesson language is listed. */
  arabic: boolean;
  /** The engine was declared wedged on this page load. */
  wedged: boolean;
  /** Who reads the reply: this machine, the server, or nobody. */
  path: "local" | "server" | "none";
}

export function setVoiceDiag(info: VoiceDiag): void {
  if (typeof window === "undefined") return;
  (window as unknown as { __voiceDiag?: VoiceDiag }).__voiceDiag = info;
}

/**
 * True when this machine can read `language` aloud with a voice that actually
 * speaks it.
 *
 * `speakText` cannot answer this *before* speaking: it hands the text to the
 * engine and only then reports `missingVoice`, by which point a machine with no
 * Arabic voice has already started reading Arabic in its English voice. Anything
 * that may abandon the reading (the progressive narrator) must ask first.
 *
 * An empty voice list means "still loading", not "no voice" — Chrome fills it
 * asynchronously — so it answers yes and lets the attempt itself decide.
 */
export function canSpeakLanguage(language: VoiceLanguage): boolean {
  if (!ttsSupported()) return false;
  const voices = primeVoices(window.speechSynthesis);
  if (voices.length === 0) return true;
  return pickVoice(voices, language) !== null;
}

/**
 * Speaks `text` in the reply language, using an installed voice for that
 * language when there is one. Any previously playing utterance is cancelled
 * first, so only one voice is heard at a time. `onDone` fires when the
 * utterance ends or errors. Returns the utterance (caller tracks it to ignore
 * stale end-events from cancelled earlier utterances) plus whether the machine
 * has a voice for the language, or `utterance: null` if TTS is unavailable.
 *
 * PHASE 166 — the watchdog. On some phones (Android Chrome especially) the
 * engine accepts an utterance and then goes silent forever: no `start`, no
 * `end`, no error — and every later sentence queues behind it. That is the
 * owner-reported «بعد أول 3 ردود الاستماع لا يعمل» on the local path: it is not
 * the quota, it is a wedged engine. So every utterance is watched:
 *
 *  • no start within a short budget, or no end within a generous estimate of
 *    its duration → `cancel()` + `resume()` (the documented revive) and the
 *    same sentence is handed over again — up to twice (PHASE 167);
 *  • still nothing → the engine is declared wedged for this page session
 *    (`localVoiceWedged()`), the line reports done (a queue must never freeze)
 *    and every later caller gets `utterance: null` and falls back — the room
 *    to the server's voice, the narrator to `broken`. An explicit press
 *    (`resetLocalVoice`) re-arms it; a reload certainly does.
 *
 * The estimate is deliberately generous (Arabic TTS is slow): a healthy
 * utterance is never cut short, only a dead one is revived.
 *
 * PHASE 167 — why the revive used to fail on the exact phones it was written
 * for: the re-hand happened in the same task as `cancel()`, and that is itself
 * the wedge trigger on Android Chrome. Every hand-over now happens in a later
 * task after a real gap (`launch`) — including the first one, because the race
 * was there from the very first sentence.
 */
export function speakText(
  text: string,
  language: VoiceLanguage,
  onDone: () => void,
): SpeakResult {
  if (!ttsSupported()) return { utterance: null, missingVoice: false };
  const trimmed = text.trim();
  if (!trimmed) return { utterance: null, missingVoice: false };
  // A wedged engine gets no more attempts this session: the caller may fall
  // back (see the doc above). A page reload clears it.
  if (localVoiceFailed) return { utterance: null, missingVoice: false };

  const synth = window.speechSynthesis;
  // PHASE 167 — never `cancel()` into an idle engine, and never hand a new
  // sentence over in the same task as the cancel: both are documented ways to
  // wedge Android Chrome. Cancel only what is actually queued (the engine's own
  // flags, plus this module's — they stick on the phones this phase is about),
  // and let `launch` do every hand-over in a later task.
  //
  // PHASE 172 — only a reading THIS MODULE knows is still in the air justifies
  // a cancel. The engine's own flags lie on exactly the phones this module
  // exists for: after a natural end `speaking`/`pending` often stay true for a
  // beat, and the cancel + 260ms breath they used to buy was paid at EVERY
  // sentence boundary — heard as the stutter «يتوقف ثم يستمر ثم يتوقف» on the
  // owner's phone. `engineBusyFlag` is this module's own honest bookkeeping:
  // set at hand-over, cleared by `finish` (whether the end was natural or a
  // failure) and by `stopSpeaking`.
  const wasBusy = engineBusyFlag;
  engineBusyFlag = true;
  if (wasBusy) synth.cancel();
  const epoch = ++speechEpoch;

  const voices = primeVoices(synth);
  const voice = pickVoice(voices, language);
  const missingVoice = voices.length > 0 && voice === null;

  let settled = false;
  let started = false;
  /** Revive rounds already spent on this sentence (PHASE 167: up to two). */
  let retries = 0;
  let timer = 0;
  let launchTimer = 0;
  let firstUtterance: SpeechSynthesisUtterance | null = null;
  /** Built but not yet handed over (the first sentence is pre-built, below). */
  let prebuilt: SpeechSynthesisUtterance | null = null;

  const finish = () => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timer);
    window.clearTimeout(launchTimer);
    // Only the newest attempt may clear the module-wide busy flag: an older
    // attempt finishing late must not un-arm the one that cancelled it.
    if (epoch === speechEpoch) engineBusyFlag = false;
    onDone();
  };

  /**
   * PHASE 167 — hand a sentence to the engine in a later task, after `gap` ms.
   * Leaving the current task is what keeps a re-hand after a cancel alive on
   * Android; the guards are what keep a silenced sentence from ever starting
   * late (a stop bumps `speechEpoch`).
   */
  const launch = (gap: number) => {
    window.clearTimeout(launchTimer);
    launchTimer = window.setTimeout(() => {
      if (settled) return;
      if (epoch !== speechEpoch) {
        // Silenced before it ever reached the engine: report it over so a
        // queue waiting on this attempt cannot freeze (the retract path).
        finish();
        return;
      }
      speak();
    }, gap);
  };

  const arm = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(
      () => {
        // A cancelled attempt's watchdog (student pressed stop, next sentence
        // arrived) must never revive anything.
        if (settled || epoch !== speechEpoch) return;
        if (retries < 2) {
          retries += 1;
          started = false;
          try {
            synth.cancel();
            synth.resume();
          } catch {
            /* some engines refuse resume; the retry itself may still work */
          }
          // PHASE 167 — a revive only deserves the name when the engine gets a
          // real breath: the re-hand goes out in a later task, after the gap.
          launch(retries === 1 ? CANCEL_GAP_MS : REVIVE_GAP_2_MS);
          return;
        }
        localVoiceFailed = true;
        finish();
      },
      started ? watchEndMs(trimmed.length) : WATCH_START_MS,
    );
  };

  const build = (): SpeechSynthesisUtterance => {
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
    utterance.onstart = () => {
      started = true;
      arm();
    };
    // Some engines report progress only through boundary events (the same
    // events drive the avatar's mouth): either one proves it is running.
    utterance.onboundary = () => {
      started = true;
      arm();
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    if (firstUtterance === null) firstUtterance = utterance;
    return utterance;
  };

  const speak = () => {
    const utterance = prebuilt ?? build();
    prebuilt = null;
    try {
      synth.speak(utterance);
    } catch {
      localVoiceFailed = true;
      finish();
      return;
    }
    arm();
  };

  // The first sentence is built NOW, so `firstUtterance` is the real object the
  // caller tracks even though the hand-over itself waits out the gap.
  prebuilt = build();
  launch(wasBusy ? CANCEL_GAP_MS : 0);
  return { utterance: firstUtterance, missingVoice };
}

/** Stops whatever the browser is currently reading aloud. */
export function stopSpeaking(): void {
  // Invalidate every pending watchdog: nothing may revive what the student
  // just silenced.
  speechEpoch += 1;
  engineBusyFlag = false;
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

// --------------------------------------- live conversation (PHASE 168) --

/**
 * PHASE 168 — «المحادثة الحيّة»: one open microphone, not a button per question.
 *
 * `startTranscription` above is deliberately one-shot: press, speak, review,
 * send. The owner asked for the other shape — a conversation where the tutor
 * hears while the student talks, answers while the answer is still being
 * written, and never asks him to touch anything between turns. PHASE 169 kept
 * the microphone open for the whole exchange — the owner's own words: «اريد
 * المحادثة تفاعلية… الطالب ممكن يقاطع المعلم اثناء الشرح… ويتم استثناء صوت
 * المعلم فقط» — so the pieces of behaviour here are:
 *
 *  • segmentation — a continuous session reports fragments; the tracker below
 *    gathers them into whole utterances that end on a short silence, or sooner
 *    on the end of the student's voice as the echo-cancelled probe hears it;
 *  • echo exclusion — that same open microphone also hears the phone's
 *    speaker: the tutor's words arrive as transcripts «كأني أنا الذي أتكلم»
 *    and used to be sent back to it, in a loop. Every utterance is now judged
 *    against two independent facts (`echoGuard.ts`): the words themselves
 *    (the tutor's text is KNOWN — its own sentence can never become a
 *    question) and the probe's echo-cancelled level (a real voice over the
 *    tutor's). Echo is dropped in silence — never sent, never shown;
 *  • yield — while the tutor holds the floor, a fragment of NEW words (not the
 *    tutor's) announces barge-in at once, so the room silences the voice
 *    before the student is even done — interrupting stays a spoken act;
 *  • survival — Chrome ends recognition on its own (its silence timer, a ~60s
 *    cap). A conversation must not die with it: the session is reopened
 *    invisibly, unless the *student* ended the mode.
 */

/**
 * The silence that ends the student's utterance and releases it, in ms.
 * PHASE 169 — 1200 → 900: with the echo rules carrying the safety, this wait
 * is pure felt latency between the student stopping and the tutor starting.
 */
export const LIVE_SILENCE_MS = 900;

/** The tracker's clock: 250 → 150ms (PHASE 169), so a release lands sooner. */
const LIVE_TICK_MS = 150;

/**
 * PHASE 169 — the student's voice stopped (the probe heard it end) and the
 * recognizer has settled: release after this short tail instead of waiting out
 * the full silence window.
 */
const LIVE_VAD_TAIL_MS = 350;

/**
 * PHASE 169 — how long after the tutor's voice stops its words may still be
 * in flight through the recognizer (engines report with a delay): an utterance
 * that started this close to the tutor's last word is judged by the echo
 * rules, not trusted blindly.
 */
const LIVE_TUTOR_TAIL_MS = 1500;

/**
 * PHASE 176 — how long the tutor's words stay "the live context" for the
 * words rule. The owner's phone proved 1.5s is not the recognizer's memory:
 * it reports the speaker's words seconds after the audio ends (the echoed
 * sentence «الصفحه طفلا وطفله جميلين يلعبان…» reached the server ~13s after
 * its reply began, with the audio already over — 1 false word in 25). Within
 * this window a transcript that is mostly the tutor's words is the tutor,
 * whenever it arrives; the share test keeps real speech (short answers except
 * one-word ones, questions, interruptions) out of it. Bounded at 20s so a
 * student answering from memory later is never judged against stale words.
 */
const LIVE_TUTOR_RECENT_MS = 20_000;

/**
 * PHASE 177 — how long the tutor's words answer for the verbatim rule: a
 * transcript of four words or more made ENTIRELY of the tutor's words is its
 * echo even here (see `classifyLiveUtterance`). The owner's phone kept
 * producing exactly that shape while the room's speaking flag lied — «تجد في
 * اول السطر عباره من اكون», 0% new words, answered itself seconds later. Long
 * enough to survive a recognizer that reports a minute late, and every note
 * of the tutor's words or voice refreshes it (`noteTutorText` /
 * `noteTutorSpeaking`).
 */
const LIVE_TUTOR_CONTEXT_MS = 60_000;

/** PHASE 169 — the rolling window of tutor speech kept for word matching. */
const LIVE_TUTOR_WINDOW = 800;

/** A student talking without a pause still gets a turn at this bound. */
export const LIVE_MAX_UTTERANCE_MS = 20_000;

/**
 * PHASE 172 — …and at this much text, whatever the clock says. The message
 * route refuses content past 4000 characters, and a live utterance is spoken
 * words: releasing at 700 keeps every turn inside the ordinary length of a
 * child's question and makes an engine that streams fragments for minutes
 * (background noise, a long reading) unable to grow one giant turn — the
 * shape that produced the server's «content must NOT have more than 4000
 * characters» rejections in the wild.
 */
export const LIVE_MAX_UTTERANCE_CHARS = 700;

/** The breath before a recognition session Chrome ended is reopened. */
const LIVE_RESTART_GAP_MS = 500;

/**
 * PHASE 174 — the words come first. A capture-class failure ("audio-capture")
 * means the microphone could not be opened, and the one consumer this page
 * owns on that device is the echo probe: it joins every live session. The
 * probe is an enhancement (barge-in speed and the early release); the
 * recognizer IS the mode. When a capture fails, the probe is dropped for good
 * and the recognizer reopens — and only a capture that fails without the probe
 * this many times is fatal. The owner's phone ended the whole mode on those
 * errors, which reads to a parent as «المحادثة الحيّة لا تعمل».
 */
const LIVE_CAPTURE_RETRY_LIMIT = 2;

/** A longer breath after a capture-class failure — the device needs the beat. */
const LIVE_CAPTURE_RETRY_GAP_MS = 800;

/**
 * …and after `getUserMedia` confirms the permission was in fact granted (the
 * Android first-run race: the grant lands just after the recognizer's own
 * request was refused).
 */
const LIVE_PERMISSION_RETRY_GAP_MS = 1200;

/**
 * A late final that merely re-reports what was just released is the same
 * question, not a new one: engines can finalize a phrase right after its
 * interim was released, and sending both would ask the tutor twice.
 */
const LIVE_ECHO_MS = 2500;

export interface LiveUtteranceOptions {
  /** Silence that ends an utterance (default `LIVE_SILENCE_MS`). */
  silenceMs?: number;
  /** Longest one utterance may run before it is released anyway. */
  maxMs?: number;
  /** Longest one utterance's text may grow before it is released anyway. */
  maxChars?: number;
}

/**
 * Turns a stream of recognition fragments into whole utterances.
 *
 * Pure and clock-injected on purpose: the segmentation rules (when a burst
 * began, when it ended, what text it contains) are the part worth unit-testing,
 * and they do not need a browser to be true. No word is invented here — the
 * utterance is exactly the text the engine reported, finals plus the interim
 * tail that was on screen when the silence arrived.
 */
export class LiveUtteranceTracker {
  private finals = "";
  private interim = "";
  private active = false;
  private startedAt = 0;
  private lastResultAt = 0;
  /** The last utterance released, and when — for the echo guard. */
  private released = "";
  private releasedAt = 0;
  private readonly silenceMs: number;
  private readonly maxMs: number;
  private readonly maxChars: number;

  constructor(opts: LiveUtteranceOptions = {}) {
    this.silenceMs = opts.silenceMs ?? LIVE_SILENCE_MS;
    this.maxMs = opts.maxMs ?? LIVE_MAX_UTTERANCE_MS;
    this.maxChars = opts.maxChars ?? LIVE_MAX_UTTERANCE_CHARS;
  }

  /** The utterance as it stands right now (for a live caption). */
  get live(): string {
    return [this.finals, this.interim]
      .map((t) => this.normalize(t))
      .filter(Boolean)
      .join(" ");
  }

  /**
   * A final fragment arrived. Returns true when it opened a NEW utterance —
   * the moment the tutor's voice must yield.
   */
  noteFinal(text: string, now: number): boolean {
    const t = this.normalize(text);
    // The engine can report the *final* of a phrase just after its interim was
    // released (the silence arrived first): that is the same question again,
    // not a new one.
    if (!this.active && t && this.isEcho(t, now)) return false;
    const began = this.note(now);
    if (t) this.finals = this.finals ? `${this.finals} ${t}` : t;
    // A final replaces the interim tail it finalizes: only the NEXT interim is
    // a new phrase. Without this, a phrase whose interim was already shown
    // would appear twice in the same utterance.
    this.interim = "";
    return began;
  }

  /** An interim fragment arrived (the same utterance, still being refined). */
  noteInterim(text: string, now: number): boolean {
    const t = this.normalize(text);
    if (!this.active && t && this.isEcho(t, now)) return false;
    const began = this.note(now);
    this.interim = t;
    return began;
  }

  /**
   * The clock moved: returns the utterance when the student has been silent
   * for `silenceMs`, or talking for `maxMs` without a pause, or when the text
   * itself has grown to `maxChars` (PHASE 172 — a bounded question beats a
   * refused one).
   */
  tick(now: number): string | null {
    if (!this.active) return null;
    const text = this.live;
    if (!text) {
      // A burst that never produced words (engine noise): drop it at the bound.
      if (now - this.startedAt >= this.maxMs) this.reset();
      return null;
    }
    if (
      now - this.lastResultAt >= this.silenceMs ||
      now - this.startedAt >= this.maxMs ||
      text.length >= this.maxChars
    ) {
      this.reset();
      this.released = text;
      this.releasedAt = now;
      return text;
    }
    return null;
  }

  /** Ends the utterance right now (the recognition session closed). */
  flush(now: number = Date.now()): string | null {
    if (!this.active) return null;
    const text = this.live;
    this.reset();
    if (!text) return null;
    this.released = text;
    this.releasedAt = now;
    return text;
  }

  private note(now: number): boolean {
    const began = !this.active;
    if (began) {
      this.active = true;
      this.startedAt = now;
    }
    this.lastResultAt = now;
    return began;
  }

  private normalize(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }

  private isEcho(text: string, now: number): boolean {
    return (
      this.released !== "" &&
      now >= this.releasedAt &&
      now - this.releasedAt <= LIVE_ECHO_MS &&
      text === this.released
    );
  }

  private reset(): void {
    this.active = false;
    this.finals = "";
    this.interim = "";
    this.startedAt = 0;
    this.lastResultAt = 0;
  }
}

// ------------------------------------------------- the mic probe (PHASE 169) --

/**
 * The echo-cancelled probe: one `getUserMedia` stream of the SAME microphone
 * the recognizer listens to, with the browser's own echo cancellation on. The
 * tutor's voice plays from this page, so the browser subtracts it from the
 * probe — a level above the calibrated floor therefore means the STUDENT is
 * speaking. That is the one signal the recognizer's transcripts cannot give:
 * the Web Speech API offers no way to hand it a stream we cleaned ourselves,
 * so the probe's evidence is kept as a *separate* fact for `echoGuard.ts` to
 * weigh, never as a replacement for the words.
 *
 * Kept deliberately small: it only reports when the student's voice begins and
 * ends. Privacy: the audio never leaves this function — only levels are read,
 * and only two events come out.
 */
export interface MicProbeHandlers {
  /** The student's own voice just started (post-cancellation level). */
  onVoiceStart: () => void;
  /** The student's voice stopped (a short quiet, hysteresis included). */
  onVoiceEnd: () => void;
  /** No probe on this machine (no permission, no Web Audio): word rules only. */
  onError: () => void;
}

export interface MicProbeHandle {
  stop: () => void;
}

/** The probe's clock, in ms — fast enough for barge-in to feel instant. */
const MIC_PROBE_TICK_MS = 120;
/** Consecutive frames above the floor before a voice counts as started. */
const MIC_PROBE_START_FRAMES = 2;
/** Consecutive quiet frames before it counts as done (mid-sentence breath ≠ end). */
const MIC_PROBE_END_FRAMES = 4;
/** The floor never asks for more than this — a loud-echo room must still pass. */
const MIC_PROBE_MAX_THRESHOLD = 0.09;
/** …nor lower than this — a silent room must not trigger on nothing. */
const MIC_PROBE_MIN_THRESHOLD = 0.035;

/**
 * PHASE 172 — the breath the recognizer gets before the probe asks for the
 * microphone. Both requests land on the same device at mode start; when they
 * race, Android Chrome can hand the microphone to one of them and leave the
 * other hearing nothing — the owner's «المحادثة الحيّة لا تعمل» (the mode
 * opens, and no word ever arrives). The words alone still carry the mode;
 * the probe joins once the session is up.
 */
const MIC_PROBE_START_DELAY_MS = 900;

type MicProbeWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
  /**
   * PHASE 169 test seam, the same shape as the E2E recognition stubs: the
   * deterministic suites install it to announce "the student's voice" exactly
   * when they mean to; a real page never has it.
   */
  __liveMicProbe?: (handlers: MicProbeHandlers) => MicProbeHandle;
};

/**
 * Starts the probe, or returns null when this machine cannot run one — the
 * mode then runs on the word rules alone: slower to trust an interruption,
 * but never wrong about the tutor's own voice.
 */
export function startMicProbe(handlers: MicProbeHandlers): MicProbeHandle | null {
  if (typeof window === "undefined" || typeof navigator === "undefined") return null;
  const win = window as MicProbeWindow;
  if (typeof win.__liveMicProbe === "function") return win.__liveMicProbe(handlers);

  const media = navigator.mediaDevices;
  const Ctx = win.AudioContext ?? win.webkitAudioContext;
  if (!media?.getUserMedia || typeof Ctx === "undefined") return null;

  let stopped = false;
  let stream: MediaStream | null = null;
  let context: AudioContext | null = null;
  let timer = 0;
  let openTimer = 0;

  const stop = (): void => {
    stopped = true;
    window.clearTimeout(openTimer);
    window.clearInterval(timer);
    stream?.getTracks().forEach((track) => track.stop());
    if (context && context.state !== "closed") void context.close().catch(() => undefined);
  };

  // PHASE 172 — see `MIC_PROBE_START_DELAY_MS`: the recognizer's own request
  // goes first, the probe follows once the session is up. The seam path above
  // answered instantly on purpose — a suite that drives events by hand has no
  // real microphone to race.
  openTimer = window.setTimeout(() => {
    if (stopped) return;
    media
      .getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      })
      .then((opened) => {
        if (stopped) {
          opened.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = opened;
        const ctx = new Ctx();
        context = ctx;
        // A suspended context processes nothing; the toggle that opened the mode
        // was a real press, so resuming here is allowed.
        if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(opened).connect(analyser);
        const frame = new Uint8Array(analyser.fftSize);
        // The floor adapts to the quiet of THIS room (and to whatever the echo
        // cancellation leaves behind): a fixed threshold would be deaf in a
        // quiet room and deafened by echo in a loud one.
        let floor = 0.01;
        let above = 0;
        let below = 0;
        let inVoice = false;
        let voiceAt = 0;

        timer = window.setInterval(() => {
          if (stopped) return;
          analyser.getByteTimeDomainData(frame);
          let sum = 0;
          for (let i = 0; i < frame.length; i++) {
            const v = ((frame[i] ?? 128) - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / frame.length);
          const threshold = Math.max(
            MIC_PROBE_MIN_THRESHOLD,
            Math.min(MIC_PROBE_MAX_THRESHOLD, floor * 2.5),
          );
          if (rms < threshold) floor = floor * 0.98 + rms * 0.02;
          if (!inVoice) {
            if (rms >= threshold) {
              above += 1;
              if (above >= MIC_PROBE_START_FRAMES) {
                inVoice = true;
                above = 0;
                below = 0;
                voiceAt = Date.now();
                handlers.onVoiceStart();
              }
            } else {
              above = 0;
            }
            return;
          }
          if (rms < threshold * 0.7) {
            below += 1;
            if (below >= MIC_PROBE_END_FRAMES && Date.now() - voiceAt >= 250) {
              inVoice = false;
              below = 0;
              handlers.onVoiceEnd();
            }
          } else {
            below = 0;
          }
        }, MIC_PROBE_TICK_MS);
      })
      .catch(() => {
        try {
          handlers.onError();
        } catch {
          /* the probe's absence must never break the conversation */
        }
      });
  }, MIC_PROBE_START_DELAY_MS);

  return { stop };
}

// ------------------------------------- one ear at a time (PHASE 175) ---------

/**
 * PHASE 175 — «أذن واحدة»: does live mode have to listen *exactly* the way
 * the dictation key listens?
 *
 * The owner's phone settled it: the mic key on the question box transcribes
 * his Arabic perfectly, while live mode — a continuously-running session with
 * the echo probe holding the same microphone beside it — opens, says
 * «أسمعك», and hears nothing at all: no word, no error, only the 174 hint.
 * Two differences, one device class. Phones and tablets hand their microphone
 * to ONE of the two requesters and leave the other silent (PHASE 172's own
 * observed rule), and single-utterance sessions are the shape mobile engines
 * are actually built around (Safari has no continuous mode at all, and
 * Android usually ends a continuous session after its first result anyway).
 *
 * So on touch-first devices live mode listens like the dictation that is
 * proved to work there: one session at a time (`continuous = false`, reopened
 * on every natural end) and no probe beside it. The words carry the mode —
 * the probe's jobs fall back to the text rules of `echoGuard.ts`: two novel
 * words still yield the floor, still send and still answer; only the one-word
 * interruption waits for a second word instead of the probe's evidence.
 */
export function listensLikeDictation(): boolean {
  if (typeof navigator === "undefined") return false;
  const uaData = (navigator as { userAgentData?: { mobile?: boolean } }).userAgentData;
  if (uaData?.mobile === true) return true;
  return navigator.maxTouchPoints > 0;
}

/**
 * PHASE 175 — …and a silence with no error is cleared once, like a capture
 * failure: this many word-less milliseconds after the mode opened — the same
 * moment the room's «لم أسمعك بعد» hint appears — a mode that has never heard
 * a single fragment drops its probe and rebuilds the recognition session,
 * silently. If the child then speaks, as the hint asks, the field is already
 * fresh. One shot per session; touch devices never start a probe and their
 * sessions cycle on their own, so nothing happens there.
 */
const LIVE_QUIET_RESCUE_MS = 9000;

export interface LiveConversationCallbacks {
  /** The current utterance so far, live (empty string once it is released). */
  onLive: (text: string) => void;
  /**
   * PHASE 169 — the student is interrupting: his own words (not the tutor's
   * echo) are in the air while the tutor speaks. Fired once per utterance, as
   * soon as that is clear, so the room silences the voice before the student
   * is even done.
   */
  onBargeIn: () => void;
  /** A whole utterance, released by the silence (or the bound) that ended it. */
  onUtterance: (text: string) => void;
  /** A fatal recognition error (permission, capture, network). */
  onError: (message: string | null) => void;
  /** Recognition is fully stopped (student ended the mode, or it failed). */
  onEnd: () => void;
  /**
   * PHASE 177 — the room's live floor, read at the instant a decision is made
   * («is the tutor's voice in the air right now?»). Optional: the note*
   * timeline alone still carries every engine that does not supply it.
   */
  roomSpeaking?: () => boolean;
}

export interface LiveConversationHandle {
  /** Ends the live session; whatever was half-spoken is dropped, not sent. */
  stop: () => void;
  /**
   * PHASE 169 — the room reports the tutor's floor: true while its voice holds
   * the air. The echo rules need this timeline ("was the tutor audible during
   * this utterance?") to tell the student's words from the speaker's.
   */
  noteTutorSpeaking: (speaking: boolean) => void;
  /** Every chunk the tutor is about to say, for the word-matching window. */
  noteTutorText: (text: string) => void;
}

/**
 * One continuous recognition session, kept alive across the browser's own
 * endings, reporting whole utterances as the student speaks them — with the
 * tutor's own voice excluded by the PHASE 169 rules above.
 *
 * Errors are read the way the mode works: "aborted" is our own stop, and
 * "no-speech" is exactly the quiet this session waits for — neither is news.
 * PHASE 174 — a capture-class failure gets the field cleared first (the probe
 * goes), and the first-ever permission refusal gets one retry behind a
 * `getUserMedia` oracle. What is left — a capture that fails twice with no
 * probe beside it, a refusal the oracle cannot lift, an unreachable service —
 * still ends the mode honestly through `onError`, because a session that
 * looks alive while hearing nothing is worse than a notice.
 */
export function startLiveConversation(
  callbacks: LiveConversationCallbacks,
  language: VoiceLanguage = "ar",
): LiveConversationHandle | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;

  let active = true;
  let current: RecognitionLike | null = null;
  const tracker = new LiveUtteranceTracker();
  let tickTimer = 0;
  let restartTimer = 0;
  // PHASE 174 — bounded recovery budgets (see the LIVE_*_RETRY_* constants).
  let captureRetries = 0;
  let permissionRetried = false;
  // PHASE 175 — the device's listening shape, decided once (see
  // `listensLikeDictation`), and the quiet rescue's own state.
  const dictationShape = listensLikeDictation();
  const openedAt = Date.now();
  let rescued = false;

  // PHASE 169 — the tutor's side of the conversation, as the room reports it.
  let tutorText = "";
  let tutorSpeaking = false;
  let tutorSpeechEndAt: number | null = null;
  // PHASE 177 — the newest proof the tutor's voice or words were in the air.
  // Both notes stamp it, so the verbatim rule still has a clock even when the
  // room's speaking flag is the broken thing (the owner's phone).
  let lastTutorSignalAt = 0;
  // …and the student's side, as the echo-cancelled probe hears it.
  let lastUserVoiceAt = 0;
  let userVoiceEndAt: number | null = null;
  // The utterance on the table: when it began, and whether the room was already
  // told to yield for it (interrupting is one act, announced once).
  let windowStart = 0;
  let yielded = false;
  let lastFragmentAt = 0;

  const noteTutorText = (text: string): void => {
    const t = text.replace(/\s+/g, " ").trim();
    if (!t) return;
    tutorText = `${tutorText} ${t}`.trim().slice(-LIVE_TUTOR_WINDOW);
    // PHASE 177 — words about to be in the air are their own clock.
    lastTutorSignalAt = Date.now();
  };

  const noteTutorSpeaking = (speaking: boolean): void => {
    tutorSpeaking = speaking;
    if (!speaking) tutorSpeechEndAt = Date.now();
    lastTutorSignalAt = Date.now();
  };

  /**
   * PHASE 177 — «هل صوت المعلّم في الهواء الآن؟» asked of the room itself, at
   * this instant. The note* timeline above is the history; this is the present,
   * and it cannot lag a render or survive a stopped player: the room's floor
   * is a count of what is actually sounding (see `LessonRoom.tsx`).
   */
  const roomNowSpeaking = (): boolean => {
    try {
      return callbacks.roomSpeaking?.() === true;
    } catch {
      return false;
    }
  };

  /**
   * Was the tutor's voice in the air during an utterance that began at
   * `start`? True while it speaks, and for a tail after it stops — the
   * recognizer reports with a delay, so the tutor's last words can still
   * arrive (and be "said") after its voice is already silent.
   */
  const tutorAudibleDuring = (start: number): boolean => {
    if (tutorSpeaking) return true;
    return tutorSpeechEndAt !== null && tutorSpeechEndAt >= start - LIVE_TUTOR_TAIL_MS;
  };

  /** Releases a finished utterance, after the echo rules had their say. */
  const release = (text: string | null): void => {
    const start = windowStart;
    windowStart = 0;
    yielded = false;
    userVoiceEndAt = null;
    callbacks.onLive("");
    if (!text) return;
    const roomNow = roomNowSpeaking();
    const verdict = classifyLiveUtterance({
      text,
      tutorText,
      tutorAudible: tutorAudibleDuring(start) || roomNow,
      // PHASE 176 — the tutor's words stay "the live context" for tens of
      // seconds, not just the 1.5s tail: the phone's recognizer reports the
      // speaker late, and a mostly-tutor transcript is the tutor whenever it
      // arrives (see `LIVE_TUTOR_RECENT_MS`).
      // PHASE 177 — the room's own floor joins it (the flag the note stream
      // copies can drift from the audio that actually sounds), and so does the
      // newest note of any kind: words fed at a player's start count even when
      // the speaking flag never did.
      tutorRecent:
        tutorSpeaking ||
        roomNow ||
        Date.now() - Math.max(tutorSpeechEndAt ?? 0, lastTutorSignalAt) <= LIVE_TUTOR_RECENT_MS,
      // PHASE 177 — the long window for the verbatim rule («الكلمة الحرفية»).
      tutorContext:
        tutorSpeaking ||
        roomNow ||
        Date.now() - Math.max(tutorSpeechEndAt ?? 0, lastTutorSignalAt) <= LIVE_TUTOR_CONTEXT_MS,
      userVoice: lastUserVoiceAt >= start - 250,
    });
    // The tutor's own voice, read back through the speaker: dropped in
    // silence — never sent as a question, never shown as the student's words.
    if (verdict === "echo") return;
    callbacks.onUtterance(text);
  };

  // PHASE 175 — on a touch-first device there is no probe at all: its second
  // claim on the microphone is exactly what left the words unheard there, and
  // the word rules carry the whole mode (see `listensLikeDictation`).
  let probe = dictationShape
    ? null
    : startMicProbe({
        onVoiceStart: () => {
          lastUserVoiceAt = Date.now();
          userVoiceEndAt = null;
        },
        onVoiceEnd: () => {
          userVoiceEndAt = Date.now();
        },
        onError: () => undefined, // word rules alone still carry the mode
      });

  const fatal = (message: string | null): void => {
    if (!active) return;
    active = false;
    current = null;
    window.clearInterval(tickTimer);
    window.clearTimeout(restartTimer);
    probe?.stop();
    callbacks.onError(message);
    callbacks.onEnd();
  };

  /** Opens one recognition session; `onend` decides whether another follows. */
  const open = (): void => {
    if (!active) return;
    const rec = new Ctor();
    current = rec;
    rec.lang = speechTag(language);
    // PHASE 175 — the dictation shape on touch-first devices (see
    // `listensLikeDictation`): one utterance per session, reopened on end.
    rec.continuous = !dictationShape;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    // Indices already counted as final: real engines may re-deliver an
    // unchanged final result, and words must never be appended twice.
    const countedFinals = new Set<number>();

    rec.onresult = (event) => {
      if (!active) return;
      const now = Date.now();
      let began = false;
      const results = event.results;
      const from = Math.max(0, event.resultIndex ?? 0);
      for (let i = from; i < results.length; i++) {
        const item = results[i];
        // A sparse result list (the E2E stub, some engines) simply has no
        // fragment at this index — never an error.
        if (!item) continue;
        const text = item[0]?.transcript ?? "";
        if (item.isFinal) {
          if (countedFinals.has(i)) continue;
          countedFinals.add(i);
          began = tracker.noteFinal(text, now) || began;
        } else {
          began = tracker.noteInterim(text, now) || began;
        }
      }
      if (began) {
        windowStart = now;
        yielded = false;
      }
      lastFragmentAt = now;
      const live = tracker.live;
      // PHASE 169 — yield the floor the moment the words say "this is the
      // student": two words that are not the tutor's, or one word plus the
      // probe's voice. The tutor's own echoed words never yield — those are
      // the words that used to stop it after two or three (the reported
      // defect); without new words there is nothing to answer.
      if (live && !yielded && (tutorAudibleDuring(windowStart || now) || roomNowSpeaking())) {
        if (
          shouldYieldFloor({
            text: live,
            tutorText,
            userVoiceRecently: now - lastUserVoiceAt <= 1500,
          })
        ) {
          yielded = true;
          callbacks.onBargeIn();
        }
      }
      // The caption is the student's words only: echo never appears as his.
      if (live && visibleLiveCaption({ text: live, tutorText, tutorAudible: tutorSpeaking || roomNowSpeaking() })) {
        callbacks.onLive(live);
      } else {
        callbacks.onLive("");
      }
    };

    rec.onerror = (event) => {
      if (!active) return;
      if (event.error === "aborted") return; // our own stop — `onend` closes it
      if (event.error === "no-speech") return; // the quiet the tracker waits for
      // PHASE 174 — the words come first (see the constants): a capture failure
      // clears the field — the probe is dropped for good — and reopens the
      // recognizer; only a capture that keeps failing alone is fatal.
      if (event.error === "audio-capture" && captureRetries < LIVE_CAPTURE_RETRY_LIMIT) {
        captureRetries += 1;
        current = null;
        // Whatever the failed session still holds must not feed the tracker:
        // its late results are dead air, not the student.
        rec.onresult = null;
        probe?.stop();
        window.clearTimeout(restartTimer);
        restartTimer = window.setTimeout(open, LIVE_CAPTURE_RETRY_GAP_MS);
        return;
      }
      // The first-ever refusal may be the Android grant race — the recognizer
      // asked before the permission settled. `getUserMedia` is the oracle: it
      // resolves exactly when the phone now allows the microphone, and it
      // rejects when the student (or the platform) really said no.
      if (event.error === "not-allowed" && !permissionRetried) {
        permissionRetried = true;
        current = null;
        // The refused session is dead; only the reopened one may speak.
        rec.onresult = null;
        window.clearTimeout(restartTimer);
        const media = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
        if (!media?.getUserMedia) {
          fatal(STT_ERROR_MESSAGES[event.error] ?? null);
          return;
        }
        media
          .getUserMedia({ audio: true })
          .then((stream) => {
            stream.getTracks().forEach((track) => track.stop());
            if (active) restartTimer = window.setTimeout(open, LIVE_PERMISSION_RETRY_GAP_MS);
          })
          .catch(() => fatal(STT_ERROR_MESSAGES[event.error] ?? null));
        return;
      }
      fatal(STT_ERROR_MESSAGES[event.error] ?? null);
    };

    rec.onend = () => {
      if (current !== rec) return; // a late end from an older session
      current = null;
      if (!active) return;
      // The session ended (Chrome's own silence timer, the ~60s cap): release
      // what was heard — it was an utterance (the echo rules still judge it) —
      // and reopen after a breath.
      release(tracker.flush());
      restartTimer = window.setTimeout(open, LIVE_RESTART_GAP_MS);
    };

    try {
      rec.start();
    } catch {
      fatal("تعذر بدء التعرف على الكلام — أعد المحاولة");
    }
  };

  tickTimer = window.setInterval(() => {
    if (!active) return;
    const now = Date.now();
    // PHASE 175 — the quiet rescue (see `LIVE_QUIET_RESCUE_MS`): at the very
    // moment the room admits «لم أسمعك بعد», a mode that has never heard one
    // fragment clears the field — the probe goes and the session is rebuilt —
    // so the child's next words, the ones the hint asks for, start fresh.
    // (A capture failure gets the same treatment from the 174 ladder; this is
    // its silent sibling — the death with no error.)
    if (!rescued && probe && lastFragmentAt === 0 && now - openedAt >= LIVE_QUIET_RESCUE_MS) {
      rescued = true;
      probe.stop();
      probe = null;
      const rec = current;
      if (rec) {
        try {
          rec.stop();
        } catch {
          /* already closed */
        }
      }
    }
    // PHASE 169 — the student's voice ended (the probe heard it stop) and no
    // newer fragment arrived: release now, without waiting out the full
    // silence window. This is the felt latency of a reply.
    if (
      userVoiceEndAt !== null &&
      now - userVoiceEndAt >= LIVE_VAD_TAIL_MS &&
      lastFragmentAt <= userVoiceEndAt + 250
    ) {
      release(tracker.flush(now));
      return;
    }
    const whole = tracker.tick(now);
    if (whole) release(whole);
  }, LIVE_TICK_MS);

  open();

  return {
    stop: () => {
      if (!active) return;
      active = false;
      window.clearInterval(tickTimer);
      window.clearTimeout(restartTimer);
      // Half-spoken text is dropped: ending the mode is not a question.
      tracker.flush();
      probe?.stop();
      const rec = current;
      current = null;
      if (rec) {
        try {
          rec.stop();
        } catch {
          /* already closed */
        }
      }
      callbacks.onEnd();
    },
    noteTutorSpeaking,
    noteTutorText,
  };
}