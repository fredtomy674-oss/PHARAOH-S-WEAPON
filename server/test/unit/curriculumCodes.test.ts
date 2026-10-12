import { describe, expect, it } from "vitest";
import {
  EGYPT_AGRICULTURE_G8_SPEC,
  EGYPT_ARABIC_G8_SPEC,
  EGYPT_ARABIC_G9_SPEC,
  EGYPT_ARABIC_P1_SPEC,
  EGYPT_ARABIC_STORY_G10_SPEC,
  EGYPT_ARABIC_SPEC,
  EGYPT_CHRISTIAN_G8_SPEC,
  EGYPT_CHRISTIAN_G9_SPEC,
  EGYPT_CHRISTIAN_P1_SPEC,
  EGYPT_EDUCATIONAL_MEDIA_P1_SPEC,
  EGYPT_ENGLISH_G8_SPEC,
  EGYPT_ENGLISH_G9_SPEC,
  EGYPT_ENGLISH_G10_SPEC,
  EGYPT_ENGLISH2_G10_SPEC,
  EGYPT_ITALIAN_G10_SPEC,
  EGYPT_GERMAN_G10_SPEC,
  EGYPT_SPANISH_G10_SPEC,
  EGYPT_FRENCH_G10_SPEC,
  EGYPT_ENGLISH_P1_SPEC,
  EGYPT_ENGLISH_SPEC,
  EGYPT_ICT_G8_EN_SPEC,
  EGYPT_ICT_G8_SPEC,
  EGYPT_ICT_G9_SPEC,
  EGYPT_ICT_P1_SPEC,
  EGYPT_INDUSTRY_G8_SPEC,
  EGYPT_ISLAMIC_G8_SPEC,
  EGYPT_ISLAMIC_G9_SPEC,
  EGYPT_ISLAMIC_P1_SPEC,
  EGYPT_LIBRARIES_G8_SPEC,
  EGYPT_LIBRARIES_P1_SPEC,
  EGYPT_MATH_EN_P1_SPEC,
  EGYPT_MATH_G8_EN_SPEC,
  EGYPT_MATH_G8_FR_SPEC,
  EGYPT_MATH_G8_SPEC,
  EGYPT_MATH_G9_SPEC,
  EGYPT_MATH_P1_SPEC,
  EGYPT_SCIENCE_EN_P1_SPEC,
  EGYPT_SCIENCE_FR_P1_SPEC,
  EGYPT_SCIENCE_G8_EN_SPEC,
  EGYPT_SCIENCE_G8_SPEC,
  EGYPT_SCIENCE_G9_SPEC,
  EGYPT_SCIENCE_P1_SPEC,
  EGYPT_SCIENCE_SPEC,
  EGYPT_SOCIAL_G8_SPEC,
  EGYPT_SOCIAL_G9_SPEC,
  EGYPT_SOCIAL_P1_SPEC,
  EGYPT_SOCIAL_SPEC,
  EGYPT_THEATER_P1_SPEC,
  EGYPT_SPEC,
  SAUDI_SPEC,
} from "../../src/db/seed.js";

/**
 * PHASE 60 — the same «chapter-lesson» labels are printed by more than one
 * Ministry book (maths, science and social studies all print «1-1»، «1-2» …),
 * and the app resolves a lesson by its `code`. If two curricula ever shared a
 * code, a lookup would silently answer from the wrong book — a live probe was
 * fooled by exactly that. The codes are namespaced per book; this pins it at the
 * spec level, so a future curriculum cannot reintroduce the collision.
 */
const SPECS = [EGYPT_SPEC, EGYPT_ENGLISH_SPEC, EGYPT_SCIENCE_SPEC, EGYPT_SOCIAL_SPEC, EGYPT_ARABIC_SPEC, EGYPT_ICT_G9_SPEC, EGYPT_CHRISTIAN_G9_SPEC, EGYPT_SOCIAL_G9_SPEC, EGYPT_ISLAMIC_G9_SPEC, EGYPT_MATH_G9_SPEC, EGYPT_SCIENCE_G9_SPEC, EGYPT_ENGLISH_G9_SPEC, EGYPT_ENGLISH_G10_SPEC, EGYPT_ENGLISH2_G10_SPEC, EGYPT_ITALIAN_G10_SPEC, EGYPT_GERMAN_G10_SPEC, EGYPT_SPANISH_G10_SPEC, EGYPT_FRENCH_G10_SPEC, EGYPT_ARABIC_G9_SPEC, EGYPT_ARABIC_STORY_G10_SPEC, SAUDI_SPEC, EGYPT_ARABIC_G8_SPEC, EGYPT_CHRISTIAN_G8_SPEC, EGYPT_ENGLISH_G8_SPEC, EGYPT_ICT_G8_SPEC, EGYPT_ICT_G8_EN_SPEC, EGYPT_ISLAMIC_G8_SPEC, EGYPT_MATH_G8_SPEC, EGYPT_MATH_G8_EN_SPEC, EGYPT_MATH_G8_FR_SPEC, EGYPT_SCIENCE_G8_SPEC, EGYPT_SCIENCE_G8_EN_SPEC, EGYPT_SOCIAL_G8_SPEC, EGYPT_AGRICULTURE_G8_SPEC, EGYPT_INDUSTRY_G8_SPEC, EGYPT_LIBRARIES_G8_SPEC, EGYPT_ENGLISH_P1_SPEC, EGYPT_CHRISTIAN_P1_SPEC, EGYPT_MATH_P1_SPEC, EGYPT_MATH_EN_P1_SPEC, EGYPT_SCIENCE_P1_SPEC, EGYPT_SCIENCE_EN_P1_SPEC, EGYPT_SCIENCE_FR_P1_SPEC, EGYPT_SOCIAL_P1_SPEC, EGYPT_THEATER_P1_SPEC, EGYPT_LIBRARIES_P1_SPEC, EGYPT_EDUCATIONAL_MEDIA_P1_SPEC, EGYPT_ICT_P1_SPEC, EGYPT_ARABIC_P1_SPEC, EGYPT_ISLAMIC_P1_SPEC];

type Spec = (typeof SPECS)[number];

function lessonCodes(spec: Spec): string[] {
  return spec.terms.flatMap((term) => term.units.flatMap((unit) => unit.lessons.map((l) => l.code)));
}

function conceptCodes(spec: Spec): string[] {
  return spec.terms.flatMap((term) =>
    term.units.flatMap((unit) =>
      unit.lessons.flatMap((lesson) => lesson.concepts.map((_, j) => `c-${lesson.code}-${j + 1}`)),
    ),
  );
}

describe("PHASE 60 — curriculum codes are unique across every book", () => {
  it("never reuses a lesson code between curricula", () => {
    const all = SPECS.flatMap(lessonCodes);
    expect(new Set(all).size).toBe(all.length);
  });

  it("never reuses a concept code between curricula", () => {
    const all = SPECS.flatMap(conceptCodes);
    expect(new Set(all).size).toBe(all.length);
  });

  it("namespaces each official book tree even though the books print the same labels", () => {
    expect(lessonCodes(EGYPT_SPEC)).toContain("l-con-1-1");
    expect(lessonCodes(EGYPT_SCIENCE_SPEC)).toContain("l-sci-con-1-1");
    expect(lessonCodes(EGYPT_SOCIAL_SPEC)).toContain("l-soc-1-1");
    expect(lessonCodes(EGYPT_ARABIC_SPEC)).toContain("l-ara-1-1");
    // …and the four codes above are genuinely different strings, which is the
    // whole point: the same printed «1-1» must stay addressable per book.
    expect(new Set(["l-con-1-1", "l-sci-con-1-1", "l-soc-1-1", "l-ara-1-1"]).size).toBe(4);
    // The four Prep-1 (Grade 7) books continue the namespacing (PHASE 99).
    expect(lessonCodes(EGYPT_MATH_EN_P1_SPEC)).toContain("l-g7-math-en-1-1");
    expect(lessonCodes(EGYPT_SCIENCE_P1_SPEC)).toContain("l-g7-sci-1-1");
    expect(lessonCodes(EGYPT_SCIENCE_FR_P1_SPEC)).toContain("l-g7-sci-fr-1-1");
    expect(lessonCodes(EGYPT_SOCIAL_P1_SPEC)).toContain("l-g7-social-1-1");
    // The three Grade-8 books the Prep-1 sweep left out (PHASE 99).
    expect(lessonCodes(EGYPT_AGRICULTURE_G8_SPEC)).toContain("l-g8-agri-1-1");
    expect(lessonCodes(EGYPT_INDUSTRY_G8_SPEC)).toContain("l-g8-ind-1-1");
    expect(lessonCodes(EGYPT_LIBRARIES_G8_SPEC)).toContain("l-g8-lib-1-1");
    expect(new Set(["l-g8-agri-1-1", "l-g8-ind-1-1", "l-g8-lib-1-1"]).size).toBe(3);
    expect(EGYPT_ENGLISH_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-eng-start-1");
    // The Grade-10 second-foreign-language book shares the grade and the subject
    // code but must keep its own lesson namespace (PHASE 101).
    expect(EGYPT_ENGLISH2_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-eng2-1-1");
    // The Grade-10 Italian book owns its own lesson namespace (PHASE 102).
    expect(EGYPT_ITALIAN_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-ita-1-1");
    // The Grade-10 German book owns its own lesson namespace (PHASE 103).
    expect(EGYPT_GERMAN_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-deu-1-1");
    // The Grade-10 Spanish book owns its own lesson namespace (PHASE 104).
    expect(EGYPT_SPANISH_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-spa-1-1");
    // The Grade-10 French book owns its own lesson namespace (PHASE 105).
    expect(EGYPT_FRENCH_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-fra-1-1");
    // The Grade-10 Arabic story (Antara) owns its own lesson namespace (PHASE 106).
    expect(EGYPT_ARABIC_STORY_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-story-1-1");
  });
});
