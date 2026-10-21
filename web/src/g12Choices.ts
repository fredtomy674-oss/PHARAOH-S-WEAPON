import type {
  FirstForeignLanguage,
  G12Choices,
  ReligionChoice,
  SecondForeignLanguage,
  StudyLanguage,
} from "./api";

/**
 * PHASE 192 — labels for the G12 language-school choices.
 *
 * The server owns validation; this file only mirrors the official option list
 * so onboarding and the child editor speak the same language. `fr` is the
 * default second language when English is first, and `en` when French is first.
 */
export const STUDY_LANGUAGE_OPTIONS: Array<{ code: StudyLanguage; label: string }> = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "الإنجليزية" },
  { code: "fr", label: "الفرنسية" },
];

export const FIRST_LANGUAGE_OPTIONS: Array<{ code: FirstForeignLanguage; label: string }> = [
  { code: "en", label: "الإنجليزية" },
  { code: "fr", label: "الفرنسية" },
];

export const RELIGION_OPTIONS: Array<{ code: ReligionChoice; label: string }> = [
  { code: "islamic", label: "التربية الدينية الإسلامية" },
  { code: "christian", label: "التربية الدينية المسيحية" },
];

const SECOND_LANGUAGE_LABELS: Record<SecondForeignLanguage, string> = {
  en: "الإنجليزية",
  fr: "الفرنسية",
  de: "الألمانية",
  it: "الإيطالية",
  es: "الإسبانية",
};

/** The Ministry pairing: the second language can never equal the first. */
export function secondLanguageOptions(first: FirstForeignLanguage | null | undefined) {
  const codes: SecondForeignLanguage[] =
    first === "fr" ? ["en", "de", "it", "es"] : ["fr", "de", "it", "es"];
  return codes.map((code) => ({ code, label: SECOND_LANGUAGE_LABELS[code] }));
}

export function isG12Grade(gradeCode: string | null | undefined): boolean {
  return gradeCode === "grade-12";
}

export interface G12ChoiceView {
  studyLanguage?: StudyLanguage | null;
  firstForeignLanguage?: FirstForeignLanguage | null;
  secondForeignLanguage?: SecondForeignLanguage | null;
  religion?: ReligionChoice | null;
}

export function g12ChoicesComplete(
  choices: G12ChoiceView | null | undefined,
): choices is G12Choices {
  return Boolean(
    choices?.studyLanguage &&
      choices.firstForeignLanguage &&
      choices.secondForeignLanguage &&
      choices.religion,
  );
}

export function g12ChoiceSummary(choices: G12ChoiceView | null | undefined): string {
  if (!g12ChoicesComplete(choices)) return "لم تُحدَّد اختيارات اللغة بعد";
  const study = STUDY_LANGUAGE_OPTIONS.find((option) => option.code === choices.studyLanguage)?.label;
  const first = FIRST_LANGUAGE_OPTIONS.find((option) => option.code === choices.firstForeignLanguage)?.label;
  const second = SECOND_LANGUAGE_LABELS[choices.secondForeignLanguage];
  const religion = RELIGION_OPTIONS.find((option) => option.code === choices.religion)?.label;
  return `دراسة ${study} · أولى ${first} · ثانية ${second} · ${religion}`;
}
