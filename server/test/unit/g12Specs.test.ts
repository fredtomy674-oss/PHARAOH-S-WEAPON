import { describe, expect, it } from "vitest";
import {
  EGYPT_APPLIED_MATH_G12_SPEC,
  EGYPT_ARABIC_G12_SPEC,
  EGYPT_ARABIC_STORY_G12_SPEC,
  EGYPT_BIOLOGY_G12_SPEC,
  EGYPT_CHEMISTRY_G12_SPEC,
  EGYPT_CHRISTIAN_G12_SPEC,
  EGYPT_ENGLISH2_G12_SPEC,
  EGYPT_ENGLISH_G12_SPEC,
  EGYPT_FRENCH2_G12_SPEC,
  EGYPT_FRENCH_G12_SPEC,
  EGYPT_FRENCH_STORY_G12_SPEC,
  EGYPT_G12_EXTRA_SPECS,
  EGYPT_GEOGRAPHY_G12_SPEC,
  EGYPT_GERMAN_G12_SPEC,
  EGYPT_HISTORY_G12_SPEC,
  EGYPT_ICT_G12_SPEC,
  EGYPT_ISLAMIC_G12_SPEC,
  EGYPT_ITALIAN_G12_SPEC,
  EGYPT_NAHW_G12_SPEC,
  EGYPT_NATIONAL_EDUCATION_G12_SPEC,
  EGYPT_PHYSICS_G12_SPEC,
  EGYPT_PSYCHOLOGY_G12_SPEC,
  EGYPT_PURE_MATH_G12_SPEC,
  EGYPT_SPANISH_G12_SPEC,
  EGYPT_STATISTICS_G12_SPEC,
} from "../../src/db/seed.js";

/**
 * PHASE 192 — the complete G12 catalog.
 *
 * Sixteen core books, seven choice-driven language books, the grammar book and
 * thirteen English/French editions. Exactly one edition per subject reaches a
 * learner; the catalog itself keeps every official edition.
 */
const core = [
  EGYPT_ARABIC_G12_SPEC,
  EGYPT_ARABIC_STORY_G12_SPEC,
  EGYPT_ENGLISH_G12_SPEC,
  EGYPT_ISLAMIC_G12_SPEC,
  EGYPT_CHRISTIAN_G12_SPEC,
  EGYPT_ICT_G12_SPEC,
  EGYPT_NATIONAL_EDUCATION_G12_SPEC,
  EGYPT_CHEMISTRY_G12_SPEC,
  EGYPT_PHYSICS_G12_SPEC,
  EGYPT_BIOLOGY_G12_SPEC,
  EGYPT_PURE_MATH_G12_SPEC,
  EGYPT_APPLIED_MATH_G12_SPEC,
  EGYPT_HISTORY_G12_SPEC,
  EGYPT_GEOGRAPHY_G12_SPEC,
  EGYPT_PSYCHOLOGY_G12_SPEC,
  EGYPT_STATISTICS_G12_SPEC,
] as const;

const all = [...core, ...EGYPT_G12_EXTRA_SPECS];

describe("PHASE 192 — G12 Term 1 seed specs", () => {
  it("registers every official book on grade-12", () => {
    expect(all).toHaveLength(37);
    for (const spec of all) {
      expect(spec.grade.code).toBe("grade-12");
      expect(spec.grade.nameAr).toBe("الصف الثالث الثانوي");
      expect(spec.curriculum.code).toMatch(/^eg-g12-/);
      expect(spec.terms).toHaveLength(1);
    }
  });

  it("keeps the official track split at 16 common, 15 science, 6 literature", () => {
    const byTrack = { common: 0, science: 0, literature: 0 };
    for (const spec of all) {
      const track = spec.curriculum.track ?? null;
      if (track === "science" || track === "literature") byTrack[track] += 1;
      else byTrack.common += 1;
    }
    expect(byTrack).toEqual({ common: 16, science: 15, literature: 6 });
  });

  it("seeds 445 lessons with unique app codes and real concepts", () => {
    const codes = new Set<string>();
    let lessons = 0;
    for (const spec of all) {
      for (const unit of spec.terms[0]!.units) {
        for (const lesson of unit.lessons) {
          lessons += 1;
          expect(lesson.code).toMatch(/^l-g12-/);
          expect(codes.has(lesson.code)).toBe(false);
          codes.add(lesson.code);
          expect(lesson.concepts.length).toBeGreaterThanOrEqual(2);
          expect(lesson.doc?.content.length ?? 0).toBeGreaterThan(180);
        }
      }
    }
    expect(lessons).toBe(445);
    expect(codes.size).toBe(445);
  });

  it("pairs every science/mathematics base book with English and French editions", () => {
    const variants = all.filter((spec) => spec.curriculum.variantOf);
    expect(variants).toHaveLength(13);
    const pairs = new Map<string, Set<string>>();
    for (const spec of variants) {
      const key = spec.curriculum.variantOf!;
      const languages = pairs.get(key) ?? new Set<string>();
      languages.add(spec.curriculum.language ?? "");
      pairs.set(key, languages);
    }
    expect(pairs.get("eg-g12-chemistry")).toEqual(new Set(["en", "fr"]));
    expect(pairs.get("eg-g12-physics")).toEqual(new Set(["en", "fr"]));
    expect(pairs.get("eg-g12-biology")).toEqual(new Set(["en", "fr"]));
    expect(pairs.get("eg-g12-pure-math")).toEqual(new Set(["en", "fr"]));
    expect(pairs.get("eg-g12-applied-math")).toEqual(new Set(["en", "fr"]));
    expect(pairs.get("eg-g12-statistics")).toEqual(new Set(["en", "fr"]));
    // The Ministry prints no French ICT edition, so French-medium learners use
    // the Arabic ICT book through the selector fallback.
    expect(pairs.get("eg-g12-ict")).toEqual(new Set(["en"]));
  });

  it("exposes the seven choice-driven language books and the grammar book", () => {
    const roles = all.map((spec) => spec.curriculum.languageRole).filter(Boolean);
    expect(roles.sort()).toEqual(["first", "first", "grammar", "second", "second", "second", "second", "second", "story"]);
    expect(EGYPT_ENGLISH2_G12_SPEC.curriculum.language).toBe("en");
    expect(EGYPT_FRENCH_G12_SPEC.curriculum.language).toBe("fr");
    expect(EGYPT_FRENCH2_G12_SPEC.curriculum.language).toBe("fr");
    expect(EGYPT_FRENCH_STORY_G12_SPEC.curriculum.language).toBe("fr");
    expect(EGYPT_GERMAN_G12_SPEC.curriculum.language).toBe("de");
    expect(EGYPT_ITALIAN_G12_SPEC.curriculum.language).toBe("it");
    expect(EGYPT_SPANISH_G12_SPEC.curriculum.language).toBe("es");
    expect(EGYPT_NAHW_G12_SPEC.curriculum.languageRole).toBe("grammar");
  });
});
