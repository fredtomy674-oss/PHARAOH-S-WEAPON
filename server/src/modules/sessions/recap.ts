/**
 * PHASE 29 (closes D-027 deferred item) — safe, display-ready session recap.
 *
 * The AI receives ONLY metadata (lesson/concept titles + counters), never
 * message content, so a transcript leak is impossible by construction. A
 * no-verbatim guard additionally rejects any generated text that reproduces a
 * message body, and on any failure the pipeline falls back to a deterministic
 * structured recap — the student and parent ALWAYS see something safe.
 */

export interface RecapConceptEntry {
  title: string;
  attempts: number;
  correct: number;
}

export interface SessionRecapMetadata {
  lessonTitle: string | null;
  durationMinutes: number;
  userMessages: number;
  tutorMessages: number;
  attachmentCount: number;
  safetyFlagged: number;
  concepts: RecapConceptEntry[];
}

export interface SessionRecap extends SessionRecapMetadata {
  headline: string;
  focus: string;
  strengths: string[];
  suggestions: string[];
  /** True when the AI output was unusable/unsafe → deterministic fallback shown. */
  fallback: boolean;
}

/** The JSON contract the provider must return for a recap turn. */
export interface RecapAiJson {
  headline: string;
  focus: string;
  strengths: string[];
  suggestions: string[];
}

const MAX_STRENGTHS = 4;
const MAX_SUGGESTIONS = 4;
/** Bodies shorter than this may legitimately appear inside titles/statements. */
const MIN_BODY_CHARS = 12;
/** A recap "sentence" used for the reverse (copy-from-message) detection. */
const MIN_SENTENCE_CHARS = 25;
/** Titles shorter than this are not scrubbed (too generic to matter). */
const MIN_TOKEN_CHARS = 6;
/** Headline/focus length bounds for the AI JSON parser. */
const MIN_HEADLINE_CHARS = 5;
const MIN_FOCUS_CHARS = 3;

/** System rules for the recap operation — short, strict, Arabic. */
export const RECAP_SYSTEM_RULES = [
  "أنت مدرّس خصوصي يلخّص جلسة تعلّم للطالب ووليّ أمره، بأسلوب مشجع وبسيط.",
  "ستتلقى بيانات وصفية فقط: عنوان الدرس والمفاهيم وأعداد الرسائل والمدة والمرفقات وأعلام الأمان. لا شيء غير ذلك.",
  "قواعد صارمة:",
  "1. اعتمد حصريًا على هذه البيانات الوصفية — لا تخترع درجات ولا حقائق ولا نقاطًا لم ترد فيها.",
  "2. لا تنسخ نصوصًا من المحادثة ولا تعيد صياغتها؛ محتوى الرسائل غير متاح لك أصلًا.",
  "3. لا تذكر أسماءً ولا معرّفات ولا أي تفاصيل شخصية.",
  "4. أخرج JSON خالصًا ONLY بالشكل: {\"headline\": string, \"focus\": string, \"strengths\": string[], \"suggestions\": string[]}.",
  "5. اجعل النقاط قصيرة (3-12 كلمة) وباللغة العربية، والعناوين 8-40 كلمة.",
].join("\n");

/** Serializes the metadata-only recap inputs (safe by construction). */
export function buildRecapMetadataBlock(meta: SessionRecapMetadata): string {
  const concepts = meta.concepts.map((c) => `«${c.title}» (${c.attempts}/${c.correct})`).join("، ");
  return [
    "<metadata>",
    `Lesson: ${meta.lessonTitle ? `«${meta.lessonTitle}»` : "(بدون درس)"}`,
    `DurationMinutes: ${meta.durationMinutes}`,
    `UserMessages: ${meta.userMessages}`,
    `TutorMessages: ${meta.tutorMessages}`,
    `Attachments: ${meta.attachmentCount}`,
    `SafetyFlagged: ${meta.safetyFlagged}`,
    `Concepts: ${concepts || "بدون"}`,
    "</metadata>",
  ].join("\n");
}

/**
 * Strict parser for the AI recap JSON. Tolerates a ```json fence; rejects
 * anything that is not the exact shape (headline+focus strings, bounded lists).
 */
export function parseRecap(raw: string): RecapAiJson | null {
  let text = raw.trim();
  if (!text) return null;
  const first = text.indexOf("```");
  const last = text.lastIndexOf("```");
  if (first >= 0 && last > first) {
    text = text
      .slice(first + 3, last)
      .replace(/^json\s*/i, "")
      .trim();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;
  const headline = typeof obj.headline === "string" ? obj.headline.trim() : "";
  const focus = typeof obj.focus === "string" ? obj.focus.trim() : "";
  if (headline.length < MIN_HEADLINE_CHARS || focus.length < MIN_FOCUS_CHARS) return null;
  const strengths = parseStringList(obj.strengths, MAX_STRENGTHS);
  const suggestions = parseStringList(obj.suggestions, MAX_SUGGESTIONS);
  if (strengths === null || suggestions === null) return null;
  return { headline, focus, strengths, suggestions };
}

/**
 * PHASE 29 no-verbatim guard — returns TRUE when the recap reproduces any
 * message content (unsafe for display). Lesson/concept titles are curriculum
 * metadata and are scrubbed out of both sides first so a student typing the
 * lesson title as their message can't trip the guard.
 */
export function recapContainsMessageContent(recapText: string, messageBodies: string[], allowedTokens: string[] = []): boolean {
  const scrubTokens = allowedTokens.map((t) => normalizeWhitespace(t)).filter((t) => t.length >= MIN_TOKEN_CHARS);
  const scrub = (text: string): string => {
    let t = normalizeWhitespace(text);
    for (const token of scrubTokens) t = t.split(token).join(" ");
    return normalizeWhitespace(t);
  };

  const recap = scrub(recapText);
  if (!recap) return false;

  for (const body of messageBodies) {
    const b = scrub(body);
    if (b.length >= MIN_BODY_CHARS && recap.includes(b)) return true;
  }
  // Reverse direction: the recap copied a long sentence out of a message.
  const sentences = recap
    .split(/[.!؟؛\n]+/u)
    .map((s) => s.trim())
    .filter((s) => s.length >= MIN_SENTENCE_CHARS);
  for (const sentence of sentences) {
    for (const body of messageBodies) {
      if (scrub(body).includes(scrub(sentence))) return true;
    }
  }
  return false;
}

/**
 * Merges the AI recap into the final view, or falls back to the deterministic
 * structured recap when the AI output is unusable or leaks content.
 */
export function buildSessionRecap(
  meta: SessionRecapMetadata,
  aiJson: RecapAiJson | null,
  messageBodies: string[],
): SessionRecap {
  if (aiJson) {
    const allowedTokens = [meta.lessonTitle, ...meta.concepts.map((c) => c.title)].filter((t): t is string => Boolean(t));
    const text = [aiJson.headline, aiJson.focus, ...aiJson.strengths, ...aiJson.suggestions].join(" ");
    if (!recapContainsMessageContent(text, messageBodies, allowedTokens)) {
      return {
        ...meta,
        headline: aiJson.headline,
        focus: aiJson.focus,
        strengths: aiJson.strengths,
        suggestions: aiJson.suggestions,
        fallback: false,
      };
    }
  }
  return buildRecapFallback(meta);
}

/** Deterministic metadata-only recap — the guaranteed-safe last resort. */
export function buildRecapFallback(meta: SessionRecapMetadata): SessionRecap {
  const lesson = meta.lessonTitle ? `«${meta.lessonTitle}»` : "موضوع الدرس";
  const strengths: string[] = [];
  if (meta.userMessages >= 1) strengths.push("طرحت أسئلة وتفاعلت مع الشرح.");
  if (meta.attachmentCount >= 1) strengths.push("أرفقت ملفًا أو صورة وسألت عنها.");
  if (meta.safetyFlagged === 0 && meta.userMessages >= 1) strengths.push("التزمت بأسلوب الجلسة الآمن.");
  if (strengths.length === 0) strengths.push("بداية الجلسة خطوة جيدة — واصل المسير.");
  const suggestions: string[] = [];
  if (meta.safetyFlagged > 0) suggestions.push("التزم بموضوع الدرس — أي محاولة لتجاوز قواعد الجلسة تُرفض بأمان.");
  if (meta.durationMinutes < 5) suggestions.push("أعطِ الجلسة وقتًا أطول لتتعمق أكثر.");
  suggestions.push("أعد قراءة الدرس ثم جرّب الأسئلة لتثبيت الفهم.");
  return {
    ...meta,
    headline: `جلسة تعلّم حول ${lesson} — ${meta.userMessages > 0 ? "تفاعلنا فيها بأسئلة وشرح." : "جلسة قصيرة."}`,
    focus: `محور الجلسة: ${lesson} — ${meta.tutorMessages} ردّ من المدرّس خلال ${meta.durationMinutes} دقيقة.`,
    strengths: strengths.slice(0, MAX_STRENGTHS),
    suggestions: suggestions.slice(0, MAX_SUGGESTIONS),
    fallback: true,
  };
}

function parseStringList(value: unknown, cap: number): string[] | null {
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    const text = item.trim();
    if (text.length < 1 || text.length > 200) return null;
    out.push(text);
  }
  return out.slice(0, cap);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}