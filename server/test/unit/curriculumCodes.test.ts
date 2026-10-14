import { describe, expect, it } from "vitest";
import {
  EGYPT_AGRICULTURE_G8_SPEC,
  EGYPT_ARABIC_G8_SPEC,
  EGYPT_ARABIC_G9_SPEC,
  EGYPT_ARABIC_P1_SPEC,
  EGYPT_ARABIC_STORY_G10_SPEC,
  EGYPT_INTEGRATED_SCIENCE_G10_SPEC,
  EGYPT_PHILOSOPHY_G10_SPEC,
  EGYPT_NAHW_G10_SPEC,
  EGYPT_ARABIC_G10_SPEC,
  EGYPT_ICT_G10_EN_SPEC,
  EGYPT_FRENCH2_G10_SPEC,
  EGYPT_INTEGRATED_SCIENCE_EN_G10_SPEC,
  EGYPT_ENGLISH_G1_SPEC,
  EGYPT_FRENCH_STORY_G10_SPEC,
  EGYPT_DISCOVERY_G1_SPEC,
  EGYPT_ISLAMIC_G10_SPEC,
  EGYPT_MATH_G1_SPEC,
  EGYPT_INTEGRATED_SCIENCE_FR_G10_SPEC,
  EGYPT_MATH_EN_G1_SPEC,
  EGYPT_MATH_FR_G10_SPEC,
  EGYPT_MATH_FR_G1_SPEC,
  EGYPT_MATH_G10_SPEC,
  EGYPT_CHRISTIAN_G10_SPEC,
  EGYPT_HISTORY_G10_SPEC,
  EGYPT_ICT_G10_AR_SPEC,
  EGYPT_ENGLISH_G2_SPEC,
  EGYPT_ARABIC_G1_SPEC,
  EGYPT_ARABIC_G2_SPEC,
  EGYPT_ARABIC_G3_SPEC,
  EGYPT_CHRISTIAN_G2_SPEC,
  EGYPT_DISCOVERY_EN_KG1_SPEC,
  EGYPT_DISCOVERY_FR_KG2_SPEC,
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
  EGYPT_ENGLISH_G3_SPEC,
  EGYPT_CHRISTIAN_G3_SPEC,
  EGYPT_ENGLISH_G4_SPEC,
  EGYPT_MATH_EN_G3_SPEC,
  EGYPT_CHRISTIAN_G4_SPEC,
  EGYPT_SOCIAL_G5_SPEC,
  EGYPT_ENGLISH_G5_SPEC,
  EGYPT_CHRISTIAN_G5_SPEC,
  EGYPT_SOCIAL_G4_SPEC,
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
const SPECS = [EGYPT_SPEC, EGYPT_ENGLISH_SPEC, EGYPT_SCIENCE_SPEC, EGYPT_SOCIAL_SPEC, EGYPT_ARABIC_SPEC, EGYPT_ICT_G9_SPEC, EGYPT_CHRISTIAN_G9_SPEC, EGYPT_SOCIAL_G9_SPEC, EGYPT_ISLAMIC_G9_SPEC, EGYPT_MATH_G9_SPEC, EGYPT_SCIENCE_G9_SPEC, EGYPT_ENGLISH_G9_SPEC, EGYPT_ENGLISH_G10_SPEC, EGYPT_ENGLISH2_G10_SPEC, EGYPT_ITALIAN_G10_SPEC, EGYPT_GERMAN_G10_SPEC, EGYPT_SPANISH_G10_SPEC, EGYPT_FRENCH_G10_SPEC, EGYPT_ARABIC_G9_SPEC, EGYPT_ARABIC_STORY_G10_SPEC, EGYPT_INTEGRATED_SCIENCE_G10_SPEC, EGYPT_PHILOSOPHY_G10_SPEC, EGYPT_NAHW_G10_SPEC, EGYPT_ARABIC_G10_SPEC, EGYPT_ICT_G10_EN_SPEC, EGYPT_FRENCH2_G10_SPEC, EGYPT_INTEGRATED_SCIENCE_EN_G10_SPEC, EGYPT_ENGLISH_G1_SPEC, EGYPT_FRENCH_STORY_G10_SPEC, EGYPT_DISCOVERY_G1_SPEC, EGYPT_ISLAMIC_G10_SPEC, EGYPT_MATH_G1_SPEC, EGYPT_INTEGRATED_SCIENCE_FR_G10_SPEC, EGYPT_MATH_EN_G1_SPEC, EGYPT_MATH_FR_G10_SPEC, EGYPT_MATH_FR_G1_SPEC, EGYPT_MATH_G10_SPEC, EGYPT_CHRISTIAN_G10_SPEC, EGYPT_HISTORY_G10_SPEC, EGYPT_ICT_G10_AR_SPEC, EGYPT_ENGLISH_G2_SPEC, EGYPT_ARABIC_G1_SPEC, EGYPT_ARABIC_G2_SPEC, EGYPT_ARABIC_G3_SPEC, EGYPT_CHRISTIAN_G2_SPEC, EGYPT_DISCOVERY_EN_KG1_SPEC, EGYPT_DISCOVERY_FR_KG2_SPEC, SAUDI_SPEC, EGYPT_ARABIC_G8_SPEC, EGYPT_CHRISTIAN_G8_SPEC, EGYPT_ENGLISH_G8_SPEC, EGYPT_ICT_G8_SPEC, EGYPT_ICT_G8_EN_SPEC, EGYPT_ISLAMIC_G8_SPEC, EGYPT_MATH_G8_SPEC, EGYPT_MATH_G8_EN_SPEC, EGYPT_MATH_G8_FR_SPEC, EGYPT_SCIENCE_G8_SPEC, EGYPT_SCIENCE_G8_EN_SPEC, EGYPT_SOCIAL_G8_SPEC, EGYPT_AGRICULTURE_G8_SPEC, EGYPT_INDUSTRY_G8_SPEC, EGYPT_LIBRARIES_G8_SPEC, EGYPT_ENGLISH_P1_SPEC, EGYPT_CHRISTIAN_P1_SPEC, EGYPT_MATH_P1_SPEC, EGYPT_MATH_EN_P1_SPEC, EGYPT_SCIENCE_P1_SPEC, EGYPT_SCIENCE_EN_P1_SPEC, EGYPT_SCIENCE_FR_P1_SPEC, EGYPT_SOCIAL_P1_SPEC, EGYPT_THEATER_P1_SPEC, EGYPT_LIBRARIES_P1_SPEC, EGYPT_EDUCATIONAL_MEDIA_P1_SPEC, EGYPT_ICT_P1_SPEC, EGYPT_ARABIC_P1_SPEC, EGYPT_ISLAMIC_P1_SPEC, EGYPT_ENGLISH_G3_SPEC, EGYPT_CHRISTIAN_G3_SPEC, EGYPT_ENGLISH_G4_SPEC, EGYPT_MATH_EN_G3_SPEC, EGYPT_CHRISTIAN_G4_SPEC, EGYPT_SOCIAL_G5_SPEC, EGYPT_ENGLISH_G5_SPEC, EGYPT_CHRISTIAN_G5_SPEC, EGYPT_SOCIAL_G4_SPEC];

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
    // The Grade-10 Integrated Science book owns its own lesson namespace (PHASE 107).
    expect(EGYPT_INTEGRATED_SCIENCE_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-isci-1-1");
    // The Grade-10 Philosophy & Logic book owns its own lesson namespace (PHASE 108).
    expect(EGYPT_PHILOSOPHY_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-phil-1-1");
    // The Grade-10 Arabic Grammar book owns its own lesson namespace (PHASE 109).
    expect(EGYPT_NAHW_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-nahw-1-1");
    // The Grade-10 Arabic Language book owns its own lesson namespace (PHASE 110).
    expect(EGYPT_ARABIC_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-ara-1-1");
    // The Grade-10 ICT (English) book owns its own lesson namespace (PHASE 111).
    expect(EGYPT_ICT_G10_EN_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-ict-en-1-1");
    // The Grade-10 second French book (Club@dos plus 1) owns its own lesson namespace (PHASE 112).
    expect(EGYPT_FRENCH2_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-fra2-1-1");
    // The Grade-10 Integrated Science (English) book owns its own lesson namespace (PHASE 113).
    expect(EGYPT_INTEGRATED_SCIENCE_EN_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-isci-en-1-1");
    // The Grade-1 English book owns its own lesson namespace (PHASE 114).
    expect(EGYPT_ENGLISH_G1_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g1-eng-1-1");
    // The Grade-10 French story book owns its own lesson namespace (PHASE 115).
    expect(EGYPT_FRENCH_STORY_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-fra-story-1-1");
    // The Grade-1 Discover book owns its own lesson namespace (PHASE 116).
    expect(EGYPT_DISCOVERY_G1_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g1-dis-1-1");
    // The Grade-10 Islamic Education book owns its own lesson namespace (PHASE 117).
    expect(EGYPT_ISLAMIC_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-isl-1-1");
    // The Grade-1 Mathematics book owns its own lesson namespace (PHASE 118).
    expect(EGYPT_MATH_G1_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g1-math-1-1");
    // The Grade-10 Integrated Science (French) book owns its own lesson namespace (PHASE 119).
    expect(EGYPT_INTEGRATED_SCIENCE_FR_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-isci-fr-1-1");
    // The Grade-1 Mathematics (English) book owns its own lesson namespace (PHASE 120).
    expect(EGYPT_MATH_EN_G1_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g1-math-en-1-1");
    // The Grade-10 Mathematics (French) book owns its own lesson namespace (PHASE 121).
    expect(EGYPT_MATH_FR_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-math-fr-1-1");
    // The Grade-1 Mathematics (French) book owns its own lesson namespace (PHASE 122).
    expect(EGYPT_MATH_FR_G1_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g1-math-fr-1-1");
    // The Grade-10 Mathematics book owns its own lesson namespace (PHASE 123).
    expect(EGYPT_MATH_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-math-1-1");
    // The Grade-10 Christian Education book owns its own lesson namespace (PHASE 124).
    expect(EGYPT_CHRISTIAN_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-chr-1-1");
    // The Grade-10 History book owns its own lesson namespace (PHASE 125).
    expect(EGYPT_HISTORY_G10_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-his-1-1");
    // The Grade-10 ICT (Arabic) book owns its own lesson namespace (PHASE 126).
    expect(EGYPT_ICT_G10_AR_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g10-ict-1-1");
    // The Grade-2 English book owns its own lesson namespace (PHASE 127).
    expect(EGYPT_ENGLISH_G2_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g2-eng-1-1");
    // The Grade-1 Arabic book owns its own lesson namespace (PHASE 128).
    expect(EGYPT_ARABIC_G1_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g1-ara-adab-1");
    // The Grade-2 Arabic book owns its own lesson namespace (PHASE 133).
    expect(EGYPT_ARABIC_G2_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g2-ara-muraja-1");
    // The Grade-3 Arabic book owns its own lesson namespace (PHASE 134).
    expect(EGYPT_ARABIC_G3_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g3-ara-1-1");
    // The Grade-2 Christian Education book owns its own lesson namespace (PHASE 129).
    expect(EGYPT_CHRISTIAN_G2_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g2-chr-1-1");
    // The KG1 Discovery (English) book owns its own lesson namespace (PHASE 130).
    expect(EGYPT_DISCOVERY_EN_KG1_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-kg1-dis-en-1-1");
    // The KG2 Discovery (French) book owns its own lesson namespace (PHASE 131).
    expect(EGYPT_DISCOVERY_FR_KG2_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-kg2-dis-fr-1-1");
    // The Grade-3 English book owns its own lesson namespace (PHASE 136).
    expect(EGYPT_ENGLISH_G3_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g3-eng-1-1");
    // The Grade-3 Christian Education book owns its own lesson namespace (PHASE 136).
    expect(EGYPT_CHRISTIAN_G3_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g3-chr-1-1");
    // The Grade-4 English book owns its own lesson namespace (PHASE 136).
    expect(EGYPT_ENGLISH_G4_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g4-eng-1-1");
    // The Grade-3 Mathematics (English) book owns its own lesson namespace (PHASE 136).
    expect(EGYPT_MATH_EN_G3_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g3-math-en-1-1");
    // The Grade-4 Christian Education book owns its own lesson namespace (PHASE 136).
    expect(EGYPT_CHRISTIAN_G4_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g4-chr-1-1");
    // The Grade-5 Social Studies book owns its own lesson namespace (PHASE 137).
    expect(EGYPT_SOCIAL_G5_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g5-soc-1-1");
    // The Grade-5 English book owns its own lesson namespace (PHASE 137).
    expect(EGYPT_ENGLISH_G5_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g5-eng-1-1");
    // The Grade-5 Christian Education book owns its own lesson namespace (PHASE 137).
    expect(EGYPT_CHRISTIAN_G5_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g5-chr-1-1");
    // The Grade-4 Social Studies book owns its own lesson namespace (PHASE 137).
    expect(EGYPT_SOCIAL_G4_SPEC.terms[0]!.units[0]!.lessons[0]!.code).toBe("l-g4-soc-1-1");
  });
});
