/**
 * PHASE 146 — the teacher's own answer key for a WRITTEN question, and the
 * deterministic verdict built from it.
 *
 * The bug this module exists to close: the tutor asked a question, the student
 * answered, and the tutor's verdict was whatever the model happened to say. The
 * engine graded nothing for written answers (only the number line was ever
 * verified), so a WRONG answer could be praised — the single most corrosive
 * failure a tutoring app can have. The project's own doctrine («المحرك يقرّر،
 * والذكاء يعلّم» — the engine decides, the AI teaches) was violated in the one
 * place it matters most.
 *
 * The fix mirrors the number-line widget exactly: a `question` part carries an
 * `answer` key, the key is stored server-side (`messages.question_answer`) and
 * never travels to the browser, and the ENGINE grades the student's text against
 * it. The model is then TOLD the verdict; it never invents one.
 *
 * Everything here is pure and model-free, so the verdict is reproducible in
 * tests and identical in production.
 */

import { GRADE_CORRECT_THRESHOLD, normalizeArabic, tokensOf } from "../practice/grade.js";

/** Longest teacher key we accept — a key is a short answer, not a lesson. */
export const QUESTION_ANSWER_MAX_CHARS = 200;

/** The reply-part shape this module reads (a superset of the wire shape). */
export interface ReplyPartLike {
  type: string;
  text?: string;
  answer?: unknown;
  widget?: unknown;
}

/** A number in text, in document order (Latin and Arabic-Indic digits alike). */
export function numbersIn(normalizedText: string): number[] {
  const out: number[] = [];
  for (const m of normalizedText.matchAll(/\d+(?:\.\d+)?/g)) {
    const n = Number(m[0]);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

/** True when `needle` appears as a contiguous run inside `haystack`. */
function containsSequence(haystack: number[], needle: number[]): boolean {
  if (needle.length === 0) return true;
  if (needle.length > haystack.length) return false;
  for (let i = 0; i + needle.length <= haystack.length; i += 1) {
    let ok = true;
    for (let j = 0; j < needle.length; j += 1) {
      if (Math.abs(haystack[i + j]! - needle[j]!) > 1e-9) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/**
 * The content words of a normalized answer, with the Arabic definite article
 * folded away («الارتفاع» ≡ «ارتفاع») — the student writes prose, the key names
 * the idea, and an article must not decide a verdict. The article is only
 * dropped when at least three letters remain, so a name like «الله» is left
 * alone. Numbers are handled separately (as an ordered run), never as words.
 */
function contentWords(normalized: string): string[] {
  return tokensOf(normalized)
    .filter((t) => !/^\d+(?:\.\d+)?$/.test(t))
    .map((t) => (t.length >= 5 && t.startsWith("ال") ? t.slice(2) : t));
}

/**
 * Grades a short typed answer against the teacher's key. Numeric keys are
 * compared as an ordered number run (so «2/3» is not «3/2», and a key of 7 is
 * not satisfied by 17), word keys by token coverage — the same threshold the
 * rest of the platform grades with. A key that mixes both needs both.
 */
export function gradeTextAnswer(key: string, answer: string): boolean {
  const k = normalizeArabic(key);
  const a = normalizeArabic(answer);
  if (k.length === 0 || a.length === 0) return false;
  if (k === a) return true;

  const keyNumbers = numbersIn(k);
  const numberOk = containsSequence(numbersIn(a), keyNumbers);

  const answerWords = new Set(contentWords(a));
  const keyWords = contentWords(k);
  const covered = keyWords.filter((t) => answerWords.has(t)).length;
  const wordOk = keyWords.length === 0 || covered / keyWords.length >= GRADE_CORRECT_THRESHOLD;

  return numberOk && wordOk;
}

/**
 * Splits the teacher's answer key out of a reply's parts. The returned parts
 * carry no `answer` field at all, so no later step can leak the key to the
 * browser (the wire view must never contain it). The FIRST key found is kept:
 * the teaching method allows one question per reply.
 */
export function splitReplyQuestionKey<T extends ReplyPartLike>(parts: T[] | undefined): {
  parts: T[];
  questionAnswer: string | null;
} {
  let questionAnswer: string | null = null;
  const kept: T[] = [];
  for (const part of parts ?? []) {
    const { answer, ...rest } = part;
    if (questionAnswer === null && part.type === "question" && typeof answer === "string") {
      const key = answer.trim();
      if (key.length > 0) questionAnswer = key.slice(0, QUESTION_ANSWER_MAX_CHARS);
    }
    kept.push(rest as T);
  }
  return { parts: kept, questionAnswer };
}

/**
 * Praise the tutor may not give when the engine holds NO verdict. Deliberately
 * narrow: it names the reward words a student reads as «your answer is right»,
 * so a legitimate teaching sentence («الخيار الصحيح هو…») is not caught.
 */
const CORRECTNESS_CLAIMS: RegExp[] = [
  /أحسنت/,
  /ممتاز/,
  /برافو/,
  /رائع/,
  /مبدع/,
  /إجابة\s*(?:صحيحة|موفقة|دقيقة|سليمة|رائعة)/,
  /إجابتك\s*(?:صحيحة|موفقة|دقيقة|سليمة|رائعة)/,
  /بالضبط/,
  /مظبوط/,
  /صح\s*(?:تمام|كده|كدا|جدًا|جدا)/,
  /(?:^|[\s،,.!؟?])صحيح(?:$|[\s،,.!؟?])/m,
  /\b(?:correct|exactly right|well done|great job|that'?s right)\b/i,
];

/** True when `text` tells the student his answer is right. */
export function assertsCorrectness(text: string): boolean {
  return CORRECTNESS_CLAIMS.some((p) => p.test(text));
}
