import { describe, expect, it } from "vitest";
import {
  resolveG12Choices,
  secondLanguageOptions,
  selectCurriculumIds,
  type CurriculumChoiceRow,
  type G12Choices,
} from "../../src/modules/curriculum/g12Selection.js";

function row(
  id: string,
  code: string,
  subjectCode: string,
  options: {
    track?: string | null;
    language?: string | null;
    variantOf?: string | null;
    languageRole?: string | null;
  } = {},
): CurriculumChoiceRow {
  return {
    id,
    code,
    subjectCode,
    track: options.track ?? null,
    language: options.language ?? null,
    variantOf: options.variantOf ?? null,
    languageRole: options.languageRole ?? null,
  };
}

const rows: CurriculumChoiceRow[] = [
  row("chem-ar", "eg-g12-chemistry", "chemistry", { track: "science", language: "ar" }),
  row("chem-en", "eg-g12-chemistry-en", "chemistry", { track: "science", language: "en", variantOf: "eg-g12-chemistry" }),
  row("chem-fr", "eg-g12-chemistry-fr", "chemistry", { track: "science", language: "fr", variantOf: "eg-g12-chemistry" }),
  row("stat-ar", "eg-g12-statistics", "statistics", { track: "literature", language: "ar" }),
  row("stat-en", "eg-g12-statistics-en", "statistics", { track: "literature", language: "en", variantOf: "eg-g12-statistics" }),
  row("stat-fr", "eg-g12-statistics-fr", "statistics", { track: "literature", language: "fr", variantOf: "eg-g12-statistics" }),
  row("ict-ar", "eg-g12-ict", "ict", { language: "ar" }),
  row("ict-en", "eg-g12-ict-en", "ict", { language: "en", variantOf: "eg-g12-ict" }),
  row("islamic", "eg-g12-islamic-education", "islamic-education"),
  row("christian", "eg-g12-christian-education", "christian-education"),
  row("eng-first", "eg-g12-english", "english", { language: "en", languageRole: "first" }),
  row("fre-first", "eg-g12-french", "french", { language: "fr", languageRole: "first" }),
  row("eng-second", "eg-g12-english2", "english", { language: "en", languageRole: "second" }),
  row("fre-second", "eg-g12-french2", "french", { language: "fr", languageRole: "second" }),
  row("ger-second", "eg-g12-german", "german", { language: "de", languageRole: "second" }),
  row("ita-second", "eg-g12-italian", "italian", { language: "it", languageRole: "second" }),
  row("story", "eg-g12-french-story", "french", { language: "fr", languageRole: "story" }),
  row("nahw", "eg-g12-nahw", "arabic", { language: "ar", languageRole: "grammar" }),
];

function selected(choices: G12Choices, track: "science" | "literature") {
  return selectCurriculumIds(rows, { track, isG12: true, choices });
}

describe("PHASE 192 — G12 choice validation", () => {
  it("accepts the four choices and enforces the second-language pairing", () => {
    expect(
      resolveG12Choices({
        studyLanguage: "en",
        firstForeignLanguage: "fr",
        secondForeignLanguage: "en",
        religion: "islamic",
      }),
    ).toEqual({
      studyLanguage: "en",
      firstForeignLanguage: "fr",
      secondForeignLanguage: "en",
      religion: "islamic",
    });
    expect(secondLanguageOptions("en").map((option) => option.code)).toEqual(["fr", "de", "it", "es"]);
    expect(secondLanguageOptions("fr").map((option) => option.code)).toEqual(["en", "de", "it", "es"]);
  });

  it("rejects a second language equal to the first and a missing religion", () => {
    expect(() =>
      resolveG12Choices({
        studyLanguage: "ar",
        firstForeignLanguage: "en",
        secondForeignLanguage: "en",
        religion: "islamic",
      }),
    ).toThrow(/اللغة الثانية/);
    expect(() =>
      resolveG12Choices({
        studyLanguage: "ar",
        firstForeignLanguage: "en",
        secondForeignLanguage: "fr",
      }),
    ).toThrow(/التربية الدينية/);
  });

  it("uses existing choices on a rename so they are not cleared", () => {
    expect(resolveG12Choices({}, { studyLanguage: "ar", firstForeignLanguage: "en", secondForeignLanguage: "de", religion: "christian" })).toEqual({
      studyLanguage: "ar",
      firstForeignLanguage: "en",
      secondForeignLanguage: "de",
      religion: "christian",
    });
  });
});

describe("PHASE 192 — one edition per subject and no cross-track leakage", () => {
  it("gives an Arabic-medium science student exactly one edition and the chosen religion", () => {
    const ids = selected(
      { studyLanguage: "ar", firstForeignLanguage: "en", secondForeignLanguage: "fr", religion: "islamic" },
      "science",
    );
    expect(ids).toContain("chem-ar");
    expect(ids).not.toContain("chem-en");
    expect(ids).not.toContain("chem-fr");
    expect(ids).toContain("eng-first");
    expect(ids).toContain("fre-second");
    expect(ids).not.toContain("fre-first");
    expect(ids).not.toContain("ger-second");
    expect(ids).toContain("islamic");
    expect(ids).not.toContain("christian");
    expect(ids).toContain("nahw");
    expect(ids).not.toContain("stat-ar");
    expect(ids.filter((id) => id.startsWith("chem-"))).toHaveLength(1);
  });

  it("gives an English-medium science student the English editions and the French first-language books", () => {
    const ids = selected(
      { studyLanguage: "en", firstForeignLanguage: "fr", secondForeignLanguage: "de", religion: "christian" },
      "science",
    );
    expect(ids).toContain("chem-en");
    expect(ids).not.toContain("chem-ar");
    expect(ids).toContain("fre-first");
    expect(ids).toContain("ger-second");
    expect(ids).toContain("story");
    expect(ids).not.toContain("eng-first");
    expect(ids).not.toContain("fre-second");
    expect(ids).toContain("christian");
    expect(ids).not.toContain("islamic");
    expect(ids).not.toContain("stat-en");
  });

  it("gives a French-medium literature student French statistics and falls back to Arabic ICT", () => {
    const ids = selected(
      { studyLanguage: "fr", firstForeignLanguage: "en", secondForeignLanguage: "it", religion: "islamic" },
      "literature",
    );
    expect(ids).toContain("stat-fr");
    expect(ids).not.toContain("stat-ar");
    expect(ids).toContain("ict-ar"); // the Ministry prints no French ICT book
    expect(ids).toContain("eng-first");
    expect(ids).toContain("ita-second");
    expect(ids).not.toContain("fre-first");
    expect(ids).not.toContain("story");
    expect(ids).not.toContain("chem-ar");
  });

  it("uses safe defaults for a legacy G12 row with no choices", () => {
    const ids = selected(
      { studyLanguage: "ar", firstForeignLanguage: "en", secondForeignLanguage: "fr", religion: null },
      "science",
    );
    expect(ids).toContain("chem-ar");
    expect(ids).toContain("islamic");
    expect(ids).toContain("christian");
  });

  it("leaves non-G12 grades on the old track-only rule", () => {
    const ids = selectCurriculumIds(rows, { track: "science", isG12: false });
    expect(ids).toEqual(["chem-ar", "chem-en", "chem-fr", "ict-ar", "ict-en", "islamic", "christian", "eng-first", "fre-first", "eng-second", "fre-second", "ger-second", "ita-second", "story", "nahw"]);
  });
});
