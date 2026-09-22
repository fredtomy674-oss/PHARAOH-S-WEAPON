export type TutorIntent =
  | "explanation"
  | "exercise"
  | "hint_request"
  | "check_understanding"
  | "motivation"
  | "off_topic"
  | "admin_bypass_attempt";

export interface IntentResult {
  intent: TutorIntent;
  /** Confidence hint (0-1); rule-based estimate for now. */
  confidence: number;
  /** Concept keywords spotted (e.g. "الجمع", "الكسور"). */
  concepts: string[];
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

const EXERCISE_PATTERNS = [/حل\s*(لي)?\s*(هذا)?\s*(ال)?(سؤال|تمرين)/i, /مثال\s*على/i, /تمرين/i, /طبق/i, /احسب/i, /أوجد/i, /أوجد قيمة/i, /قسّم|اقسم/i, /حل المعادلة/i, /ما\s*ناتج/i];

const HINT_PATTERNS = [/تلميح/i, /هينت/i, /ساعدني/i, /عايز\s*مساعدة/i, /دلني/i, /مش\s*عايز\s*الحل\s*(كامل|مباشر)/i, /hint/i, /help me/i];

const UNDERSTAND_PATTERNS = [/فهمت/i, /تمام\s*فهمت/i, /ماشي/i, /أوكي\s*فهمت/i, /واضح/i];

const CONFUSED_PATTERNS = [/مش\s*(فاهم|فاهمة)/i, /ما\s*فهمتش/i, /لم\s*أفهم/i, /أبسط/i, /أسهل/i, /بطريقة\s*(أخرى|ثانية|مختلفة)/i, /شرح\s*تاني/i, /مش\s*واضح/i];

const GREETING_PATTERNS = [/^(مرحبا|اهلا|السلام|صباح|مساء|ازيك|عامل)/i, /hi|hello|hey|salam/i];

/** Rule-based, deterministic intent classification (cheap, no tokens). */
export function classifyIntent(question: string): IntentResult {
  const text = question.trim();
  const concepts = extractConcepts(text);

  if (ADMIN_BYPASS_PATTERNS.some((p) => p.test(text))) {
    return { intent: "admin_bypass_attempt", confidence: 0.95, concepts };
  }
  if (EXERCISE_PATTERNS.some((p) => p.test(text))) {
    if (CONFUSED_PATTERNS.some((p) => p.test(text))) return { intent: "explanation", confidence: 0.7, concepts };
    return { intent: "exercise", confidence: 0.8, concepts };
  }
  if (HINT_PATTERNS.some((p) => p.test(text))) return { intent: "hint_request", confidence: 0.85, concepts };
  if (UNDERSTAND_PATTERNS.some((p) => p.test(text))) return { intent: "check_understanding", confidence: 0.8, concepts };
  if (CONFUSED_PATTERNS.some((p) => p.test(text))) return { intent: "explanation", confidence: 0.8, concepts };
  if (GREETING_PATTERNS.some((p) => p.test(text))) return { intent: "motivation", confidence: 0.9, concepts };
  if (text.length === 0) return { intent: "motivation", confidence: 1, concepts };
  return { intent: "explanation", confidence: 0.5, concepts };
}

/** Light concept-keyword detection for progress tagging. */
export function extractConcepts(text: string): string[] {
  const keywords = ["الجمع", "الطرح", "الضرب", "القسمة", "الكسور", "الأعداد", "المعادلات", "الإنشاءات", "القياس", "النسبة", "الهندسة", "الوتر"];
  return keywords.filter((k) => text.includes(k));
}