// PHASE 169 — echo exclusion for «المحادثة الحيّة»: the tutor's own voice must
// never become the student's question.
//
// The microphone stays open while the tutor speaks — that *is* the mode: the
// student interrupts by talking, like any real conversation. But the phone's
// speaker feeds the tutor's words back into the microphone, and the Web Speech
// recognizer (which cannot be handed a stream we cleaned ourselves) reports
// them as if the student had said them. The owner lived exactly that: the tutor
// read two or three of its own words, "heard" them, and answered itself in a
// loop.
//
// Two independent facts decide whose words a transcript is, both checked here
// so they are proved without a browser:
//
//  • the words — the tutor's text is KNOWN. The room feeds every spoken chunk
//    into a rolling buffer (`noteTutorText` in `voice.ts`), so a transcript
//    made of the tutor's words is the tutor, whatever the microphone believes;
//  • the microphone — a second, echo-cancelled probe (`startMicProbe` in
//    `voice.ts`) runs on the same page: the browser's own echo cancellation
//    removes what the speaker plays, so the probe's level rises for the
//    STUDENT's voice, this time as *evidence for him* — it lets the room trust
//    an interruption the words alone look ambiguous about.
//
// The rules are deliberately asymmetric: mistaking the tutor for the student
// costs a nonsense question and a self-reply loop (the reported defect), while
// asking the student to repeat one word costs a moment — so a transcript is
// only called "the student" when the words or the microphone say so plainly.

export type UtteranceVerdict = "user" | "echo";

/**
 * A match-normalised copy: case folded, tashkeel/tatweel stripped, letter
 * variants unified (أ/إ/آ→ا, ى→ي, ة→ه), punctuation turned into spaces.
 * This is for *matching* only — nothing shown or spoken ever comes from here.
 */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0626/g, "\u064A")
    .replace(/\u0624/g, "\u0648")
    .replace(/\u0629/g, "\u0647")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalised words; empty for text with no letters or digits. */
export function tokenizeForMatch(text: string): string[] {
  const normalized = normalizeForMatch(text);
  return normalized ? normalized.split(" ") : [];
}

/**
 * Two words of the same language often differ only in a suffix (`الجمع` /
 * `الجمعية`, `العشرات` / `العشرتين`): a shared four-letter stem counts as the
 * same word — but never for shorter words, where four letters would swallow
 * the whole word and match everything. A glued conjunction gets the same
 * treatment («والعشرات» is «العشرات» for matching).
 */
function sameToken(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 4) return false;
  if (a.slice(0, 4) === b.slice(0, 4)) return true;
  if (a.length >= 5 && a.startsWith("\u0648")) return sameToken(a.slice(1), b);
  if (b.length >= 5 && b.startsWith("\u0648")) return sameToken(a, b.slice(1));
  return false;
}

/**
 * How many words of `text` do NOT appear in the tutor's recent speech. Zero
 * means "every word the student 'said' is what the tutor is saying" — the
 * recognizer heard the speaker, not the student.
 */
export function novelTokenCount(text: string, tutorText: string): number {
  const spoken = tokenizeForMatch(text);
  if (spoken.length === 0) return 0;
  const tutor = tokenizeForMatch(tutorText);
  if (tutor.length === 0) return spoken.length;
  let novel = 0;
  for (const token of spoken) {
    if (!tutor.some((word) => sameToken(word, token))) novel += 1;
  }
  return novel;
}

export interface UtteranceSignals {
  /** The whole utterance the recognizer reported. */
  text: string;
  /** Everything the tutor recently said, as one rolling text. */
  tutorText: string;
  /** The tutor's voice was in the air during this utterance's window. */
  tutorAudible: boolean;
  /** The echo-cancelled probe heard the student's own voice in that window. */
  userVoice: boolean;
}

/**
 * Whose utterance is this?
 *
 *  • the tutor was silent through the window → the student, no questions asked;
 *  • every word is the tutor's → the tutor, whatever the microphone says (this
 *    is the loop-killer: the tutor's own sentence can never become a question);
 *  • two or more words that are not the tutor's → the student;
 *  • exactly one such word → only trusted when the probe heard a voice too
 *    (one stray word is what a mis-recognized echo looks like).
 */
export function classifyLiveUtterance(signals: UtteranceSignals): UtteranceVerdict {
  if (!signals.tutorAudible) return "user";
  const tokens = tokenizeForMatch(signals.text);
  if (tokens.length === 0) return "echo";
  const novel = novelTokenCount(signals.text, signals.tutorText);
  if (novel === 0) return "echo";
  if (novel >= 2) return "user";
  return signals.userVoice ? "user" : "echo";
}

/**
 * Should this fragment silence the tutor *right now*? Called while the tutor
 * speaks, on the accumulated words so far: two non-tutor words are a real
 * interruption on their own; a single one needs the probe's voice evidence
 * (so a one-word mis-recognition of the speaker can never stop a lesson).
 */
export function shouldYieldFloor(input: {
  text: string;
  tutorText: string;
  userVoiceRecently: boolean;
}): boolean {
  const novel = novelTokenCount(input.text, input.tutorText);
  if (novel >= 2) return true;
  return novel === 1 && input.userVoiceRecently;
}

/**
 * What the live caption may show while the tutor is audible: the student's own
 * words (he is interrupting — he should see them), never the echo. With the
 * tutor silent everything heard is his.
 */
export function visibleLiveCaption(input: { text: string; tutorText: string; tutorAudible: boolean }): boolean {
  if (!input.tutorAudible) return true;
  return novelTokenCount(input.text, input.tutorText) >= 1;
}
