export type TutorIntent =
  | "explanation"
  | "exercise"
  | "hint_request"
  | "check_understanding"
  | "answer"
  | "motivation"
  | "off_topic"
  | "admin_bypass_attempt";

export interface IntentResult {
  intent: TutorIntent;
  /** Confidence hint (0-1); rule-based estimate for now. */
  confidence: number;
  /** Concept keywords spotted (e.g. "الجمع", "الكسور"). */
  concepts: string[];
  /**
   * PHASE 93/adaptive — the student explicitly said they did not understand, or
   * asked for a different explanation. This is a *different* signal from a plain
   * `explanation` request (which also covers «اشرح»): it drives the adaptive
   * policy to pick a meaningfully different teaching action instead of repeating.
   */
  confused?: boolean;
}

/**
 * PHASE 45 — context the classifier needs to tell "an answer" apart from "a new
 * question": when the tutor has JUST asked a question, an ordinary student reply
 * («الإجابة هي 15», «مش متأكد», «ب») is an ANSWER to that question. Without this
 * flag the classifier is content-only, and anything that does not match the
 * strict patterns below falls through to `explanation` — which made the tutor
 * keep explaining instead of verifying the answer.
 */
export interface ClassifyOptions {
  /** TRUE when the tutor's most recent message was a question the student is now answering. */
  pendingQuestion?: boolean;
}

const ADMIN_BYPASS_PATTERNS = [
  /تجاهل\s*(كل\s*)?(التعليمات|القواعد|السياق)/i,
  /امسح\s*(كل\s*)?(التعليمات|القواعد|السياق)/i,
  /اكشف\s*(لي\s*)?(عن\s*)?(النظام|البيانات\s*الداخلية|كلمات\s*المرور|الأسرار)/i,
  /ignore\s*(all\s*)?(instructions|previous|context)/i,
  /prompt\s*injection/i,
  /Drop\s*all\s*(previous|instructions)/i,
  /you\s*are\s*now\s*(an?\s*)?/i,
  /أصبحت\s*(الآن)?\s*(مدرس|نظام|شخص)/i,
  /system\s*prompt/i,
];

const EXERCISE_PATTERNS = [/حل\s*(لي)?\s*(هذا)?\s*(ال)?(سؤال|تمرين)/i, /مثال\s*على/i, /تمرين/i, /طبق/i, /احسب/i, /أوجد/i, /أوجد قيمة/i, /قسّم|اقسم/i, /حل المعادلة/i, /ما\s*ناتج/i, /\bsolve\b/i, /\bcalculate\b/i, /\bexample\b/i, /\bpracti[cs]e\b/i];

const HINT_PATTERNS = [/تلميح/i, /هينت/i, /ساعدني/i, /عايز\s*مساعدة/i, /دلني/i, /مش\s*عايز\s*الحل\s*(كامل|مباشر)/i, /hint/i, /help me/i];

/**
 * PHASE 146 — an acknowledgement, not a sentence. The old patterns matched
 * ANYWHERE in the message (`/واضح/`, `/فهمت/`, `/تمام/`), so «مش واضح» (I do not
 * understand) and a student's own answer that merely mentioned understanding
 * were both classified as «فهمت» — and the engine then told the model the
 * student had understood, praising an answer nobody had verified. Anchored at
 * the start, and `isAcknowledgement` below additionally requires the message to
 * be short and to carry no value (an answer is never an acknowledgement).
 */
/**
 * PHASE 146 — anchored at the START (see `isAcknowledgement`) and WITHOUT `\b`:
 * JavaScript word boundaries are ASCII-only, so `/^فهمت\b/` never matches Arabic
 * text and the whole pattern would be dead. `isAcknowledgement` keeps the match
 * narrow instead (short message, no value, no answer word).
 */
const UNDERSTAND_PATTERNS = [
  /^فهمت/,
  /^تمام/,
  /^ماشي/,
  /^أوكي|^اوكي/,
  /^واضح/,
  /^حاضر/,
  /^i\s*understand\b/i,
  /^got\s*it\b/i,
];

/** Longest message that can still be a bare acknowledgement («تمام فهمت» ≈ 9). */
const MAX_ACKNOWLEDGEMENT_CHARS = 30;

/** True when the whole message is a short «I understand» with no answer in it. */
function isAcknowledgement(text: string): boolean {
  const t = text.trim();
  if (t.length === 0 || t.length > MAX_ACKNOWLEDGEMENT_CHARS) return false;
  // A message carrying a value or an answer word is an ANSWER, never an
  // acknowledgement — «تمام، الإجابة ٥» must not report the student as done.
  if (/[0-9٠-٩]/.test(t)) return false;
  if (/إجابة|الجواب|ناتج/.test(t)) return false;
  return UNDERSTAND_PATTERNS.some((p) => p.test(t));
}

/**
 * PHASE 45 — a reply that starts with one of these is the student asking
 * something NEW, even while the tutor's question is pending. Combined with a
 * trailing ؟/?, this keeps the contextful fallback from swallowing fresh
 * questions as answers.
 */
const QUESTION_WORD_PATTERNS = [
  /^(كم|ما|لماذا|كيف|متى|أين|هل|ازاي|إزاي|مين|عايز|أريد|ليه|ليش|ايه|إيه)\b/i,
];

const CONFUSED_PATTERNS = [/مش\s*(فاهم|فاهمة)/i, /ما\s*فهمتش/i, /لم\s*أفهم/i, /أبسط/i, /أسهل/i, /بطريقة\s*(أخرى|ثانية|مختلفة)/i, /شرح\s*تاني/i, /مش\s*واضح/i, /i\s*(don'?t|dont)\s*understand/i, /explain\s*(again|another\s*way|differently)/i];

const GREETING_PATTERNS = [/^(مرحبا|اهلا|السلام|صباح|مساء|ازيك|عامل)/i, /hi|hello|hey|salam/i];

/**
 * PHASE 76 — explicit "teach me more" commands. A student who types «اشرح»,
 * «كمّل»، «وضّح» or «وبعدين؟» is asking for the next teaching move, NOT
 * answering the tutor's pending question. Without this check the PHASE 45
 * fallback (below) swallowed the lesson's most common request as an "answer"
 * whenever a question was pending — «اشرح الدرس» became a reply to
 * «هل تحب…؟», and the teacher praised an answer the student never gave instead
 * of teaching. These patterns are checked after genuinely new questions
 * (exercise/hint/confusion) and before the answer fallback.
 */
const TEACH_MORE_PATTERNS = [
  /اشرح/i,
  /وضّ?ح/i,
  /فسّ?ر/i,
  /علّ?مني|علّ?من|درّسني/i,
  /كمّل|كمل|أكمل|اكمل|نكمل|نكمّل/i,
  /بعد\s*(كده|كدا|ذلك)|وبعدين|ماذا\s*بعد|ثم\s*ماذا/i,
  /عايز\s*أفهم|عاوز\s*أفهم|أريد\s*أن\s*أفهم/i,
  /\bexplain\b|\bcontinue\b|\bgo\s*on\b|\bnext\b/i,
];

/**
 * PHASE 44 — short answers to the tutor's pending question. A bare "9",
 * "٥٠٠٠ جم", "نعم", "لا" or "ok" is almost always the student ANSWERING the
 * last question, never a new question of their own. Recognised deterministically
 * (full match only) so the tutor can verify the answer and move on instead of
 * replying "هل تقصد أنك تريد شرحًا…" to a correct answer.
 */
const NUMERIC_ANSWER_PATTERN =
  /^[+\-]?[٠-٩0-9][٠-٩0-9\s.,:،]*(?:\s*(?:كجم|جرام|جم|كيلوجرام|كيلوغرام|متر|م|سنتيمتر|سم|كيلومتر|كم|مليمتر|مم|ليتر|لتر|درجة|دقيقة|ساعة|جنيه|جنية|ريال|مرة|مرات))?[.!؟…]?$/;
const WORD_ANSWER_PATTERN =
  /^(?:نعم|لا|ايوه|إيوه|أيوه|أه|اه|آه|صح|مظبوط|بالظبط|أكيد|اكيد|طبعا|طبعًا|أوكي|اوكي|يس|يو|yes|no|ok|okay|yep|nope)\s*[.!؟…]?$/i;

/** Rule-based, deterministic intent classification (cheap, no tokens). */
export function classifyIntent(question: string, opts: ClassifyOptions = {}): IntentResult {
  const text = question.trim();
  const concepts = extractConcepts(text);

  if (ADMIN_BYPASS_PATTERNS.some((p) => p.test(text))) {
    return { intent: "admin_bypass_attempt", confidence: 0.95, concepts };
  }
  if (EXERCISE_PATTERNS.some((p) => p.test(text))) {
    if (CONFUSED_PATTERNS.some((p) => p.test(text))) return { intent: "explanation", confidence: 0.7, concepts, confused: true };
    return { intent: "exercise", confidence: 0.8, concepts };
  }
  if (HINT_PATTERNS.some((p) => p.test(text))) return { intent: "hint_request", confidence: 0.85, concepts };
  // PHASE 146 — confusion is decided BEFORE «فهمت»: a student who says «مش
  // واضح» or «مش فاهم» is not done, and treating him as done is how the tutor
  // came to praise an answer it never verified.
  if (CONFUSED_PATTERNS.some((p) => p.test(text))) return { intent: "explanation", confidence: 0.8, concepts, confused: true };
  if (isAcknowledgement(text)) return { intent: "check_understanding", confidence: 0.8, concepts };
  // PHASE 76 — an explicit teach-me-more command stays an explanation request
  // even with a question pending (see TEACH_MORE_PATTERNS).
  if (TEACH_MORE_PATTERNS.some((p) => p.test(text))) return { intent: "explanation", confidence: 0.75, concepts };
  // PHASE 44 — short answers are checked after "confused" so "لا مش فاهم"
  // stays an explanation request, and "فهمت تماماً" stays check_understanding.
  if (NUMERIC_ANSWER_PATTERN.test(text) || WORD_ANSWER_PATTERN.test(text)) {
    return { intent: "answer", confidence: 0.85, concepts };
  }
  if (GREETING_PATTERNS.some((p) => p.test(text))) return { intent: "motivation", confidence: 0.9, concepts };
  if (text.length === 0) return { intent: "motivation", confidence: 1, concepts };
  // PHASE 45 — the contextful fallback. With a pending question, an unmatched
  // ordinary reply is far more likely to be the student ANSWERING (a sentence
  // answer like «الإجابة هي 15», «ب», «لا أعرف», «مش متأكد») than a brand-new
  // question of their own, so it becomes an answer turn instead of a fresh
  // explanation. A reply that is itself a question (starts with a question word
  // or ends with ؟/?) is the student asking something NEW — never an answer.
  if (opts.pendingQuestion) {
    const isItselfAQuestion =
      /[؟?]\s*$/.test(text) || QUESTION_WORD_PATTERNS.some((p) => p.test(text));
    if (!isItselfAQuestion) return { intent: "answer", confidence: 0.6, concepts };
  }
  return { intent: "explanation", confidence: 0.5, concepts };
}

/** Light concept-keyword detection for progress tagging. */
export function extractConcepts(text: string): string[] {
  const keywords = ["الجمع", "الطرح", "الضرب", "القسمة", "الكسور", "الأعداد", "المعادلات", "الإنشاءات", "القياس", "النسبة", "الهندسة", "الوتر"];
  return keywords.filter((k) => text.includes(k));
}