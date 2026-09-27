/**
 * PHASE 38 — D-042: the tutor's reply language follows the *subject*, not the UI.
 *
 * The product is Arabic-first, so the default reply language is Arabic. But a
 * curriculum that teaches a foreign language (English, French, …) cannot be
 * explained in Arabic: the student is learning English, and an Arabic
 * explanation of English grammar is one translation hop away from useless.
 * For those curricula the tutor explains **in the taught language**.
 *
 * The rule is deliberately narrow and deterministic — a pure function of the
 * subject's `code` (the global subject catalog, shared across countries):
 *   • a subject whose code names a non-Arabic language  → English
 *   • anything else (math, science, Arabic itself, …)   → Arabic
 * No fuzzy title matching, no per-student preference, no model call: the same
 * subject always resolves to the same language, in tests and in production.
 */
export type TutorLanguage = "ar" | "en";

/**
 * Subject codes taught in a non-Arabic language. Note what is NOT here:
 * `arabic` (اللغة العربية) stays Arabic — teaching Arabic in Arabic is the
 * norm, and this is the "one hop away from useless" case in reverse.
 */
export const LANGUAGE_SUBJECT_CODES: ReadonlySet<string> = new Set([
  "english",
  "eng",
  "french",
  "fra",
  "german",
  "de",
  "spanish",
  "es",
  "italian",
  "turkish",
  "russian",
  "chinese",
  "japanese",
  "korean",
  "portuguese",
  "hindi",
]);

/** `lang_en`, `language-english`, … — the prefix convention for future catalogs. */
const LANGUAGE_PREFIX = "lang";

/** Normalizes a subject code for matching: case, spaces, dashes, underscores. */
function normalizeCode(code: string): string {
  return code.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

/**
 * True when this subject's code marks it as a foreign-language curriculum.
 *
 * Matching is exact on the normalized code, plus a prefix rule for the
 * descriptive convention (`english_language`, `lang-en`). The prefix rule is
 * restricted to names of four characters or more so a two-letter code can
 * never hijack an unrelated subject (`en` must not claim "engineering").
 */
export function isLanguageSubject(code: string): boolean {
  const normalized = normalizeCode(code);
  if (normalized.length === 0) return false;
  if (LANGUAGE_SUBJECT_CODES.has(normalized)) return true;
  if (normalized.startsWith(LANGUAGE_PREFIX)) return true;
  for (const known of LANGUAGE_SUBJECT_CODES) {
    if (known.length >= 4 && normalized.startsWith(known)) return true;
  }
  return false;
}

/**
 * Resolves the reply language for a subject. Accepts any object carrying a
 * `code` (the full `subjects` row, or a bare `{code}` in tests).
 */
export function resolveTutorLanguage(subject: { code: string }): TutorLanguage {
  return isLanguageSubject(subject.code) ? "en" : "ar";
}

export interface LanguageStyle {
  /** Behavioural rule injected as rule #1 of the tutor's system prompt. */
  rule: string;
  /** Closing instruction next to the JSON schema ("reply in …"). */
  reply: string;
}

/**
 * The two language voices of the tutor. Rules 2–7 stay identical in both, so
 * the pedagogical contract and the safety contract never drift per language.
 */
export const LANGUAGE_STYLES: Record<TutorLanguage, LanguageStyle> = {
  ar: {
    rule: "تحدث باللغة العربية الفصحى المبسطة المناسبة لعمر طالب المرحلة الابتدائية، بأسلوب دافئ ومشجع.",
    reply: "أجب بالعربية وفق القواعد أعلاه",
  },
  en: {
    rule: "This lesson teaches a foreign language, so explain and reply in that language (English), in simple clear words suited to a primary-school student, warm and encouraging. Keep every structural marker (JSON keys, concept names quoted from the lesson) exactly as written, and never switch languages mid-reply.",
    reply: "Reply in English following the rules above",
  },
};

/**
 * Explicit, machine-readable language tag embedded in the system prompt. The
 * real provider reads it as an instruction; the deterministic mock provider
 * reads it to decide which language to write its reply in (the same way it
 * reads `<context>`), which is what makes the behaviour observable offline.
 */
export function replyLanguageTag(language: TutorLanguage): string {
  return `<reply_language>${language}</reply_language>`;
}

/** Reads the tag back out of a system prompt; anything unknown → Arabic. */
export function readReplyLanguageTag(system: string): TutorLanguage {
  const open = system.lastIndexOf("<reply_language>");
  if (open === -1) return "ar";
  const close = system.indexOf("</reply_language>", open);
  if (close === -1) return "ar";
  return system.slice(open + "<reply_language>".length, close).trim() === "en" ? "en" : "ar";
}
