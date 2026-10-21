/**
 * PHASE 192 — G12 language-school choice model.
 *
 * The Ministry prints one Arabic edition of each scientific subject plus
 * English/French editions for language schools, and a separate book for each
 * foreign language. Showing every edition to every child would put three
 * chemistry books in one library, so enrollment is driven by four explicit
 * choices stored on the student row:
 *
 *   studyLanguage         ar | en | fr
 *   firstForeignLanguage  en | fr
 *   secondForeignLanguage fr | de | it | es  (or en when the first is French)
 *   religion              islamic | christian
 *
 * The selector below is pure data-in/data-out. Both new students and the seed
 * repair pass use it, so a child can never be enrolled in the other track's
 * book or in a second edition of the same subject.
 */

import { Errors } from "../../utils/errors.js";

export const STUDY_LANGUAGES = [
  { code: "ar", name: "Arabic", nameAr: "العربية" },
  { code: "en", name: "English", nameAr: "الإنجليزية" },
  { code: "fr", name: "French", nameAr: "الفرنسية" },
] as const;

export const FIRST_FOREIGN_LANGUAGES = [
  { code: "en", name: "English", nameAr: "الإنجليزية" },
  { code: "fr", name: "French", nameAr: "الفرنسية" },
] as const;

export const RELIGIONS = [
  { code: "islamic", name: "Islamic", nameAr: "التربية الدينية الإسلامية" },
  { code: "christian", name: "Christian", nameAr: "التربية الدينية المسيحية" },
] as const;

const SECOND_LANGUAGES = [
  { code: "fr", name: "French", nameAr: "الفرنسية" },
  { code: "de", name: "German", nameAr: "الألمانية" },
  { code: "it", name: "Italian", nameAr: "الإيطالية" },
  { code: "es", name: "Spanish", nameAr: "الإسبانية" },
  { code: "en", name: "English", nameAr: "الإنجليزية" },
] as const;

export type StudyLanguage = (typeof STUDY_LANGUAGES)[number]["code"];
export type FirstForeignLanguage = (typeof FIRST_FOREIGN_LANGUAGES)[number]["code"];
export type SecondForeignLanguage = (typeof SECOND_LANGUAGES)[number]["code"];
export type Religion = (typeof RELIGIONS)[number]["code"];

export interface G12Choices {
  studyLanguage: StudyLanguage;
  firstForeignLanguage: FirstForeignLanguage;
  secondForeignLanguage: SecondForeignLanguage;
  religion: Religion | null;
}

export interface G12ChoiceInput {
  studyLanguage?: string | null;
  firstForeignLanguage?: string | null;
  secondForeignLanguage?: string | null;
  religion?: string | null;
}

/** Safe fallback for a G12 row created before the choice columns existed. */
export const DEFAULT_G12_CHOICES: G12Choices = {
  studyLanguage: "ar",
  firstForeignLanguage: "en",
  secondForeignLanguage: "fr",
  religion: null,
};

export function secondLanguageOptions(first: FirstForeignLanguage) {
  const allowed = first === "fr" ? ["en", "de", "it", "es"] : ["fr", "de", "it", "es"];
  return allowed.map((code) => SECOND_LANGUAGES.find((option) => option.code === code)!);
}

export function isG12ChoicesComplete(choices: G12ChoiceInput | null | undefined): boolean {
  return Boolean(
    choices?.studyLanguage &&
      choices.firstForeignLanguage &&
      choices.secondForeignLanguage &&
      choices.religion,
  );
}

/**
 * Validate and normalize the four choices. Onboarding requires a complete set;
 * an older row may pass its existing values as `existing` so a rename does not
 * accidentally clear them.
 */
export function resolveG12Choices(input: G12ChoiceInput, existing?: G12ChoiceInput | null): G12Choices {
  const studyLanguage = input.studyLanguage ?? existing?.studyLanguage ?? null;
  const firstForeignLanguage = input.firstForeignLanguage ?? existing?.firstForeignLanguage ?? null;
  const secondForeignLanguage = input.secondForeignLanguage ?? existing?.secondForeignLanguage ?? null;
  const religion = input.religion ?? existing?.religion ?? null;

  if (!studyLanguage) {
    throw Errors.badRequest("اختر لغة الدراسة: العربية أو الإنجليزية أو الفرنسية", "STUDY_LANGUAGE_REQUIRED");
  }
  if (!STUDY_LANGUAGES.some((option) => option.code === studyLanguage)) {
    throw Errors.badRequest("لغة الدراسة المختارة غير متاحة", "STUDY_LANGUAGE_NOT_AVAILABLE");
  }
  if (!firstForeignLanguage) {
    throw Errors.badRequest("اختر اللغة الأجنبية الأولى: الإنجليزية أو الفرنسية", "FIRST_LANGUAGE_REQUIRED");
  }
  if (!FIRST_FOREIGN_LANGUAGES.some((option) => option.code === firstForeignLanguage)) {
    throw Errors.badRequest("اللغة الأجنبية الأولى المختارة غير متاحة", "FIRST_LANGUAGE_NOT_AVAILABLE");
  }
  const allowedSecond = secondLanguageOptions(firstForeignLanguage as FirstForeignLanguage).map((option) => option.code);
  if (!secondForeignLanguage) {
    throw Errors.badRequest("اختر اللغة الأجنبية الثانية", "SECOND_LANGUAGE_REQUIRED");
  }
  if (!allowedSecond.includes(secondForeignLanguage as SecondForeignLanguage)) {
    throw Errors.badRequest(
      firstForeignLanguage === "fr"
        ? "اللغة الثانية يجب أن تكون الإنجليزية أو الألمانية أو الإيطالية أو الإسبانية"
        : "اللغة الثانية يجب أن تكون الفرنسية أو الألمانية أو الإيطالية أو الإسبانية",
      "SECOND_LANGUAGE_NOT_AVAILABLE",
    );
  }
  if (!religion) {
    throw Errors.badRequest("اختر كتاب التربية الدينية: الإسلامية أو المسيحية", "RELIGION_REQUIRED");
  }
  if (!RELIGIONS.some((option) => option.code === religion)) {
    throw Errors.badRequest("كتاب التربية الدينية المختار غير متاح", "RELIGION_NOT_AVAILABLE");
  }

  return {
    studyLanguage: studyLanguage as StudyLanguage,
    firstForeignLanguage: firstForeignLanguage as FirstForeignLanguage,
    secondForeignLanguage: secondForeignLanguage as SecondForeignLanguage,
    religion: religion as Religion,
  };
}

export interface CurriculumChoiceRow {
  id: string;
  code: string;
  track: string | null;
  subjectCode: string;
  language: string | null;
  variantOf: string | null;
  languageRole: string | null;
}

const VARIANT_SUBJECTS = new Set(["chemistry", "physics", "biology", "math", "statistics", "ict"]);

/**
 * Choose exactly one book per subject from the rows of one grade.
 *
 * `isG12` is supplied by the caller from the grade code. Non-G12 grades keep
 * the old track-only behaviour, so this feature can never change G1–G11.
 */
export function selectCurriculumIds(
  rows: CurriculumChoiceRow[],
  options: { track: string | null; isG12: boolean; choices?: G12Choices | null },
): string[] {
  const inTrack = rows.filter((row) => row.track === null || row.track === options.track);
  if (!options.isG12) return [...new Set(inTrack.map((row) => row.id))];

  const choices = options.choices ?? DEFAULT_G12_CHOICES;
  const selected: string[] = [];

  const add = (row: CurriculumChoiceRow | undefined) => {
    if (row) selected.push(row.id);
  };

  for (const row of inTrack) {
    // Language editions are never enrolled directly; the base row below picks
    // the one edition that matches the child's study language.
    if (row.variantOf) continue;

    if (row.languageRole === "grammar") {
      add(row);
      continue;
    }
    if (row.languageRole === "first") {
      if (row.language === choices.firstForeignLanguage) add(row);
      continue;
    }
    if (row.languageRole === "second") {
      if (row.language === choices.secondForeignLanguage) add(row);
      continue;
    }
    if (row.languageRole === "story" || row.languageRole === "workbook") {
      // The French story and workbook accompany French as a first language.
      if (choices.firstForeignLanguage === "fr") add(row);
      continue;
    }
    if (row.subjectCode === "islamic-education") {
      if (!choices.religion || choices.religion === "islamic") add(row);
      continue;
    }
    if (row.subjectCode === "christian-education") {
      if (!choices.religion || choices.religion === "christian") add(row);
      continue;
    }

    if (VARIANT_SUBJECTS.has(row.subjectCode)) {
      const edition = inTrack.find(
        (candidate) =>
          candidate.variantOf === row.code &&
          candidate.language === choices.studyLanguage,
      );
      add(edition ?? row);
      continue;
    }

    add(row);
  }

  // Defensive: a malformed catalog must not enroll the same row twice.
  return [...new Set(selected)];
}
