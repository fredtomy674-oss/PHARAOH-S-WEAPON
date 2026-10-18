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
//
// PHASE 176 — the owner's phone re-opened this class the day live mode finally
// heard him: «يوجد تكرار فى الرد بعد عده ثوانى… ويستمر هذا بشكل متكرر». The
// database showed six echoed messages in four minutes and zero real questions
// after the second one — the tutor talking to itself. Two facts broke the 169
// rules on that phone:
//
//  • "two non-tutor words" was too small a door. The recognizer's echo of the
//    tutor's own voice always contains a few slips — it reads «صفحة رقم 8»
//    aloud and hears «ثمانيه», «فصلنا» becomes «فصل», «نتعرف» becomes
//    «تعرفوا» — so every echoed sentence carried 2–4 "new" words and became a
//    question. Measured over the whole session: every echo scored 0–17% new
//    words of its length, every genuine question 100%. The rule is now a share
//    of the utterance, not an absolute count.
//  • the audible window was too short a clock. A phone's recognizer reports
//    the speaker's words seconds *after* the audio ended (silence detection +
//    service round-trip), so whole echoed sentences arrived past the 1.5s tail
//    and were called "the student" before any word was ever weighed. The words
//    rule now outlives the window (`tutorRecent`) — if the tutor spoke within
//    the last seconds-to-20s, a mostly-its-words transcript is its voice, at
//    whatever moment the recognizer chose to report it.

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
 *
 * PHASE 176 — the owner's phone proved the four-letter rule too narrow: the
 * recognizer's echo of the tutor arrived with «فصل» for «فصلنا» (three letters
 * against a suffixed word) and «تعرفوا» for «نتعرف» (the verb prefix swapped)
 * — a handful of such slips per sentence made the tutor's own voice look "new"
 * and it answered itself. So: containment counts from three letters up (never
 * below — «من» must not swallow «منزل»), the fused prefixes و/ن/ت/ي peel off,
 * and a definite article never changes a word («الزهور» is «زهور»).
 */
function sameToken(a: string, b: string): boolean {
  if (a === b) return true;
  const shorter = Math.min(a.length, b.length);
  if (shorter >= 4 && a.slice(0, 4) === b.slice(0, 4)) return true;
  if (shorter >= 3 && (a.startsWith(b) || b.startsWith(a))) return true;
  if (a.length >= 5 && "وتني".includes(a[0])) return sameToken(a.slice(1), b);
  if (b.length >= 5 && "وتني".includes(b[0])) return sameToken(a, b.slice(1));
  if (a.length >= 5 && a.startsWith("\u0627\u0644")) return sameToken(a.slice(2), b);
  if (b.length >= 5 && b.startsWith("\u0627\u0644")) return sameToken(a, b.slice(2));
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
  /**
   * PHASE 176 — the tutor spoke recently enough that its words are still the
   * live context, wherever this utterance's own window sits. The 169 rules
   * only ran inside the audible window (plus a 1.5s tail) and the owner's
   * phone proved that window wrong: its recognizer reported the speaker's
   * words *seconds* after the audio ended, so whole echoed sentences arrived
   * outside the tail and sailed through as questions. A words rule that only
   * holds while a clock agrees is not a rule.
   */
  tutorRecent: boolean;
  /** The echo-cancelled probe heard the student's own voice in that window. */
  userVoice: boolean;
}

/**
 * Whose utterance is this?
 *
 *  • the tutor spoke recently and this transcript is mostly ITS words → the
 *    tutor, however late the recognizer reported it (the loop-killer);
 *  • the tutor was silent through the window → the student, no questions asked
 *    — with the words seed above, short real answers survive time that would
 *    once have swallowed them;
 *  • every word is the tutor's → the tutor, whatever the microphone says;
 *  • two or more words that are not the tutor's → the student;
 *  • exactly one such word → only trusted when the probe heard a voice too
 *    (one stray word is what a mis-recognized echo looks like).
 */
export function classifyLiveUtterance(signals: UtteranceSignals): UtteranceVerdict {
  const tokens = tokenizeForMatch(signals.text);
  if (tokens.length === 0) return "echo";
  const novel = novelTokenCount(signals.text, signals.tutorText);
  // PHASE 176 — the words decide, even when the clock is wrong. Under 40% new
  // words is the speaker, not the student: the owner's six echoed messages
  // scored 0–17% new (digit-vs-number, prefix and suffix slips), while every
  // genuine question he actually said scored 100%. A short utterance can never
  // be dragged in by the ratio alone: one new word in two still passes
  // (5×1 ≥ 2×2), and «نعم» as a one-word answer keeps its chance — it only
  // falls back to the probe's evidence like any other single word.
  if (signals.tutorRecent && novel * 5 < tokens.length * 2) return "echo";
  if (!signals.tutorAudible) return "user";
  if (novel === 0) return "echo";
  if (novel >= 2) return "user";
  return signals.userVoice ? "user" : "echo";
}

/**
 * Should this fragment silence the tutor *right now*? Called while the tutor
 * speaks, on the accumulated words so far: interruption needs most of the
 * utterance to be words the tutor did not just say (PHASE 176 — the same
 * ratio, on the live fragments: the tutor's own echoed sentence must never
 * cut itself off); a single new word needs the probe's voice evidence (so a
 * one-word mis-recognition of the speaker can never stop a lesson).
 */
export function shouldYieldFloor(input: {
  text: string;
  tutorText: string;
  userVoiceRecently: boolean;
}): boolean {
  const tokens = tokenizeForMatch(input.text);
  const novel = novelTokenCount(input.text, input.tutorText);
  if (novel >= 2 && novel * 5 >= tokens.length * 2) return true;
  return novel === 1 && input.userVoiceRecently;
}

/**
 * What the live caption may show while the tutor is audible: the student's own
 * words (he is interrupting — he should see them), never the echo. With the
 * tutor silent everything heard is his. A longer stretch of the tutor's words
 * with a couple of recognizer slips is still the echo (PHASE 176 — the same
 * ratio as the verdict, so the caption and the answer always agree on whose
 * words these are).
 */
export function visibleLiveCaption(input: { text: string; tutorText: string; tutorAudible: boolean }): boolean {
  if (!input.tutorAudible) return true;
  const tokens = tokenizeForMatch(input.text);
  if (tokens.length === 0) return false;
  const novel = novelTokenCount(input.text, input.tutorText);
  if (novel === 0) return false;
  return novel * 5 >= tokens.length * 2;
}
