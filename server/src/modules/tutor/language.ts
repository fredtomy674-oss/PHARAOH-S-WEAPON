/**
 * PHASE 38 — D-042: the tutor's reply language follows the *subject*, not the UI.
 * PHASE 63 — extended from {ar, en} to {ar, en, fr, de} so curricula taught in
 * French or German (the French-medium maths book) can be explained in the
 * language they are taught in, not forced into English.
 *
 * The product is Arabic-first, so the default reply language is Arabic. But a
 * curriculum taught in a foreign language cannot be explained well in another:
 * the student is learning that language (or learning maths *in* it), and a
 * second-language translation of the explanation is one hop away from useless.
 * For those curricula the tutor explains **in the taught language**.
 *
 * The rule is deliberately narrow and deterministic — a pure function of the
 * subject's `code` (the global subject catalog, shared across countries):
 *   • a subject whose code names a taught language      → that language
 *     (`french` → fr, `german` → de, `english` → en)
 *   • a subject whose code carries a medium suffix      → that language
 *     (`math-fr` → fr, `math-en` → en, `math-de` → de)
 *   • anything else (math, science, Arabic itself, …)   → Arabic
 * No fuzzy title matching, no per-student preference, no model call: the same
 * subject always resolves to the same language, in tests and in production.
 *
 * Only the four languages the voice layer can actually speak are supported;
 * any other foreign-language subject degrades to English, its previous
 * behaviour, rather than to a language no one asked for.
 */
export type TutorLanguage = "ar" | "en" | "fr" | "de";

/** Every reply language, in the order the product introduces them. */
export const TUTOR_LANGUAGES: readonly TutorLanguage[] = ["ar", "en", "fr", "de"];

const TUTOR_LANGUAGE_SET: ReadonlySet<string> = new Set(TUTOR_LANGUAGES);

/** Narrows an untrusted tag (from a prompt, a request) to a reply language. */
export function isTutorLanguage(value: string): value is TutorLanguage {
  return TUTOR_LANGUAGE_SET.has(value);
}

/**
 * Every subject/medium name the tutor can be explained in, mapped to the
 * language itself. `english`/`french`/`german` are foreign-language *subjects*;
 * `math-fr` / `math-en` are the medium suffix of a subject taught in another
 * language. Both routes end up here, so there is one table to audit.
 */
const NAME_TO_LANGUAGE: ReadonlyMap<string, TutorLanguage> = new Map([
  ["arabic", "ar"],
  ["ar", "ar"],
  ["english", "en"],
  ["eng", "en"],
  ["en", "en"],
  ["french", "fr"],
  ["fra", "fr"],
  ["fr", "fr"],
  ["francais", "fr"],
  ["german", "de"],
  ["deu", "de"],
  ["ger", "de"],
  ["de", "de"],
  ["deutsch", "de"],
]);

/**
 * Subject codes taught in a non-Arabic language. Note what is NOT here:
 * `arabic` (اللغة العربية) stays Arabic — teaching Arabic in Arabic is the
 * norm, and this is the "one hop away from useless" case in reverse. A code
 * that merely *carries* one of these as a suffix (`english_language`, `lang-en`)
 * is matched by the prefix rule below.
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
 * The language a *medium suffix* names: `math-fr` → `fr`, `math` → null.
 *
 * Only ISO tags count as a suffix, never a full word: `math-fr` is a medium,
 * while a two-part name such as `social-studies` must stay Arabic. Requiring a
 * preceding token keeps a bare `fr` (a French-subject code) on the name route.
 */
function suffixLanguage(code: string): TutorLanguage | null {
  const tokens = code.trim().toLowerCase().split(/[\s_-]+/).filter((t) => t.length > 0);
  if (tokens.length < 2) return null;
  const last = tokens[tokens.length - 1]!;
  if (last.length !== 2) return null;
  return NAME_TO_LANGUAGE.get(last) ?? null;
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
 *
 * Order matters: an explicit medium suffix (`math-fr`) wins over a name, then
 * a named language subject, then the descriptive prefix rule, else Arabic.
 */
export function resolveTutorLanguage(subject: { code: string }): TutorLanguage {
  const code = subject.code ?? "";

  const suffix = suffixLanguage(code);
  if (suffix) return suffix;

  const normalized = normalizeCode(code);
  if (normalized.length === 0) return "ar";

  const direct = NAME_TO_LANGUAGE.get(normalized);
  if (direct) return direct;

  if (normalized.startsWith(LANGUAGE_PREFIX)) {
    const rest = normalized.slice(LANGUAGE_PREFIX.length);
    return NAME_TO_LANGUAGE.get(rest) ?? "en";
  }

  for (const known of LANGUAGE_SUBJECT_CODES) {
    if (known.length >= 4 && normalized.startsWith(known)) {
      return NAME_TO_LANGUAGE.get(known) ?? "en";
    }
  }

  return "ar";
}

export interface LanguageStyle {
  /** Behavioural rule injected as rule #1 of the tutor's system prompt. */
  rule: string;
  /** Closing instruction next to the JSON schema ("reply in …"). */
  reply: string;
}

/**
 * The four language voices of the tutor. Rules 2–7 stay identical in all of
 * them, so the pedagogical contract and the safety contract never drift per
 * language. The rule is written *in* the target language, which is what a
 * multilingual model follows most reliably while the rest of the scaffolding
 * stays Arabic.
 */
export const LANGUAGE_STYLES: Record<TutorLanguage, LanguageStyle> = {
  ar: {
    rule: "تحدث باللغة العربية الفصحى المبسطة المناسبة لعمر طالب المرحلة الابتدائية، بأسلوب دافئ ومشجع.",
    reply: "أجب بالعربية وفق القواعد أعلاه",
  },
  en: {
    rule: "This lesson is taught in English, so explain and reply in English, in simple clear words suited to a primary-school student, warm and encouraging. Keep every structural marker (JSON keys, concept names quoted from the lesson) exactly as written, and never switch languages mid-reply.",
    reply: "Reply in English following the rules above",
  },
  fr: {
    rule: "Cette leçon est enseignée en français : explique et réponds en français, avec des mots simples et clairs adaptés à un élève du primaire, sur un ton chaleureux et encourageant. Garde tels quels tous les repères structurels (clés JSON, noms de concepts cités de la leçon) et ne change jamais de langue en cours de réponse.",
    reply: "Réponds en français en suivant les règles ci-dessus",
  },
  de: {
    rule: "Diese Lektion wird auf Deutsch unterrichtet: erkläre und antworte auf Deutsch, in einfachen, klaren Worten für ein Grundschulkind, warm und ermutigend. Behalte alle strukturellen Marker (JSON-Schlüssel, aus der Lektion zitierte Konzeptnamen) unverändert bei und wechsle die Sprache nicht mitten in der Antwort.",
    reply: "Antworte auf Deutsch nach den obigen Regeln",
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
  const tag = system.slice(open + "<reply_language>".length, close).trim();
  return isTutorLanguage(tag) ? tag : "ar";
}
