import { describe, expect, it } from "vitest";
import {
  EGYPT_ARABIC_SPEC,
  EGYPT_ENGLISH_SPEC,
  EGYPT_ICT_G9_SPEC,
  EGYPT_SCIENCE_SPEC,
  EGYPT_SOCIAL_SPEC,
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
const SPECS = [EGYPT_SPEC, EGYPT_ENGLISH_SPEC, EGYPT_SCIENCE_SPEC, EGYPT_SOCIAL_SPEC, EGYPT_ARABIC_SPEC, EGYPT_ICT_G9_SPEC, SAUDI_SPEC];

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
  });
});
