import { describe, expect, it } from "vitest";
import { assessmentDelta } from "../../src/modules/progress/mastery.js";

/**
 * PHASE 26 — difficulty-aware mastery deltas (D-028 deferred item). Harder
 * questions move mastery more on both sides; easy keeps the historical
 * defaults so existing behavior is unchanged.
 */
describe("assessmentDelta (difficulty-aware mastery) — PHASE 26", () => {
  it("easy keeps the historical defaults (+0.15 / −0.1)", () => {
    expect(assessmentDelta("easy")).toEqual({ onCorrect: 0.15, onWrong: -0.1 });
  });

  it("medium moves mastery a bit more (+0.175 / −0.125)", () => {
    expect(assessmentDelta("medium")).toEqual({ onCorrect: 0.175, onWrong: -0.125 });
  });

  it("hard moves mastery the most (+0.2 / −0.15)", () => {
    expect(assessmentDelta("hard")).toEqual({ onCorrect: 0.2, onWrong: -0.15 });
  });

  it("missing difficulty falls back to easy defaults", () => {
    expect(assessmentDelta(undefined)).toEqual(assessmentDelta("easy"));
  });

  it("correct deltas are always positive and wrong deltas always negative", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const d = assessmentDelta(difficulty);
      expect(d.onCorrect).toBeGreaterThan(0);
      expect(d.onWrong).toBeLessThan(0);
    }
  });

  it("ordered strength: hard > medium > easy on both sides", () => {
    const easy = assessmentDelta("easy");
    const medium = assessmentDelta("medium");
    const hard = assessmentDelta("hard");
    expect(medium.onCorrect).toBeGreaterThan(easy.onCorrect);
    expect(hard.onCorrect).toBeGreaterThan(medium.onCorrect);
    expect(medium.onWrong).toBeLessThan(easy.onWrong);
    expect(hard.onWrong).toBeLessThan(medium.onWrong);
  });
});