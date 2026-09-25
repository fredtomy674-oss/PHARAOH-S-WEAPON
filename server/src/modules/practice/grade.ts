/**
 * PHASE 30 — LLM grading of open questions (إغلاق آخر بند D-028 المؤجل).
 * Pure helpers around the AI output, mirroring the `recap` boundary style:
 *  - `parseGrade` is the strict boundary for the provider's structured JSON;
 *  - `gradeContainsAnswerKey` is the "لا نص حرفي" guard: feedback must never
 *    re-quote a substantial part of the reference answer (the answer key the
 *    student never sees);
 *  - `gradeFallback` is a deterministic offline fallback (same idea as the
 *    recap fallback) so a malformed / leaking provider reply still produces a
 *    safe, useful grade.
 * Arabic normalization + token overlap are shared by the service (fallback)
 * so answers are graded deterministically in tests. No I/O here — the service
 * layer owns DB + AI calls.
 */

export interface GradeResult {
  correct: boolean;
  /** 0..1 — how confident the grader is / how close the answer is. */
  score: number;
  /** Short teaching note shown to the student (never the answer key). */
  feedback: string;
}

/** Upper bound on a student's free-text answer (keeps prompts small). */
export const GRADE_OPEN_MAX_STUDENT_ANSWER_CHARS = 1500;
/** Coverage at/above which an answer counts as correct (matches the mock). */
export const GRADE_CORRECT_THRESHOLD = 0.7;
/** Coverage at/above which a wrong answer is "close" (partial credit band). */
export const GRADE_CLOSE_THRESHOLD = 0.4;

/**
 * Normalizes Arabic text for deterministic comparison: drops tashkeel +
 * tatweel, unifies alef forms (أ إ آ → ا) and ى → ي, maps Arabic-Indic digits
 * to Latin, collapses whitespace. Lowercase is a no-op for Arabic but keeps
 * Latin tokens (e.g. "2/3") comparable for free.
 */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Splits a normalized string into meaningful tokens (letters + digits). */
export function tokensOf(normalized: string): string[] {
  return normalized.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 0);
}

/**
 * Fraction of the reference answer's tokens covered by the student answer
 * (0..1). Multi-word references are tolerant of modest rephrasing; short
 * numeric keys (e.g. "26") are effectively exact-match because they tokenize
 * to a single token.
 */
export function referenceCoverage(reference: string, answer: string): number {
  const refTokens = tokensOf(normalizeArabic(reference));
  if (refTokens.length === 0) return 0;
  const answerTokens = new Set(tokensOf(normalizeArabic(answer)));
  const covered = refTokens.filter((t) => answerTokens.has(t)).length;
  return covered / refTokens.length;
}

/**
 * Builds the system + user messages for ONE grading call. The reference answer
 * (server-only key) lives inside the SYSTEM prompt; the student's free text is
 * untrusted user data and goes ONLY in the user turn inside <student_answer>
 * — the same convention the mock provider reads.
 */
export function gradePrompt(args: {
  conceptTitle: string | null;
  questionContent: string;
  referenceAnswer: string;
  studentAnswer: string;
}): { system: string; user: string } {
  const system = [
    "أنت مصحح أجوبة رياضيات للصف السادس الابتدائي باللغة العربية.",
    "قارن إجابة الطالب بالإجابة المرجعية داخل <reference> ثم أصدر حكمًا عادلًا وتدريجيًا: صحيح/خاطئ، ودرجة من 0 إلى 1، وملاحظة تعليمية قصيرة.",
    "قواعد صارمة: لا تُعد كتابة الإجابة المرجعية داخل الملاحظة إطلاقًا؛ اجعل الملاحظة تشير إلى الفكرة أو الخطوات دون حلّ السؤال نفسه.",
    'أخرج JSON فقط بالصيغة: {"correct": true|false, "score": 0.6, "feedback": "ملاحظة قصيرة"} — على score أن يكون رقمًا بين 0 و1.',
    "",
    `<reference>${args.referenceAnswer}</reference>`,
  ].join("\n");
  const concept = args.conceptTitle ? ` (مفهوم «${args.conceptTitle}»)` : "";
  const user = [
    `السؤال: ${args.questionContent}${concept}`,
    "",
    "<student_answer>",
    args.studentAnswer,
    "</student_answer>",
  ].join("\n");
  return { system, user };
}

/**
 * Parses + validates a provider reply. Tolerates a fenced JSON block
 * (```json … ```), requires a boolean `correct`, a finite `score` inside
 * [0, 1] and a non-empty `feedback`. Returns null when anything is off —
 * callers route to the deterministic fallback, never crash.
 */
export function parseGrade(raw: string): GradeResult | null {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (text.length === 0) return null;
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.correct !== "boolean") return null;
  if (typeof v.score !== "number" || !Number.isFinite(v.score) || v.score < 0 || v.score > 1) return null;
  if (typeof v.feedback !== "string" || v.feedback.trim().length === 0) return null;
  return { correct: v.correct, score: v.score, feedback: v.feedback.trim() };
}

/**
 * "لا نص حرفي" for grading: true when the feedback re-quotes a substantial
 * part of the reference answer (either verbatim after normalization, or ≥60%
 * token coverage for longer answers). Very short keys (<3 normalized chars)
 * are below the meaningfulness floor and are not flagged — their grading
 * relies on the provider/template not echoing them.
 */
export function gradeContainsAnswerKey(feedback: string, referenceAnswer: string): boolean {
  const fb = normalizeArabic(feedback);
  const ref = normalizeArabic(referenceAnswer);
  if (ref.length < 3 || fb.length === 0) return false;
  if (fb.includes(ref)) return true;
  const refTokens = tokensOf(ref);
  if (refTokens.length === 0) return false;
  const answerTokens = new Set(tokensOf(fb));
  const covered = refTokens.filter((t) => answerTokens.has(t)).length;
  return covered / refTokens.length >= 0.6;
}

export interface GradeFallbackResult extends GradeResult {
  fallback: true;
}

/** Deterministic offline grading: token-coverage score tapping fixed templates that never echo the answer key. */
export function gradeFallback(args: {
  conceptTitle: string | null;
  referenceAnswer: string;
  studentAnswer: string;
}): GradeFallbackResult {
  const score = referenceCoverage(args.referenceAnswer, args.studentAnswer);
  const correct = score >= GRADE_CORRECT_THRESHOLD;
  const conceptClause = args.conceptTitle ? ` عن مفهوم «${args.conceptTitle}»` : "";
  const feedback = correct
    ? `إجابة موفقة! فهمت الفكرة${conceptClause} وأحسنت التعبير عن الحل.`
    : score >= GRADE_CLOSE_THRESHOLD
      ? "إجابة قريبة — خطواتك تقترب من الحل لكن ينقصها بعض التفاصيل حول هذا المفهوم. أعد قراءة الشرح ثم حاول مجددًا."
      : "إجابة غير دقيقة هذه المرة — أعد قراءة المثال المحلول في الدرس ثم حاول مجددًا بخطوات كاملة.";
  return { correct, score: Math.round(score * 100) / 100, feedback, fallback: true };
}