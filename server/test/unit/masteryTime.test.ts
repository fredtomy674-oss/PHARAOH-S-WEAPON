import { describe, expect, it } from "vitest";
import {
  answerTimeBand,
  assessmentDelta,
  round2,
  timeScaledDelta,
  TIME_MULTIPLIER,
} from "../../src/modules/progress/mastery.js";

/**
 * PHASE 31 — the answer-time awareness of the mastery engine (D-028/D-030
 * deferred item «زمن الإجابة في معادلة الإتقان»): pure band derivation and
 * speed-scaled deltas. No I/O, deterministic.
 */
describe("answer-time aware mastery (PHASE 31)", () => {
  describe("answerTimeBand", () => {
    it("maps unknown/missing/invalid times to the unit band", () => {
      expect(answerTimeBand(null)).toBe("unknown");
      expect(answerTimeBand(undefined)).toBe("unknown");
      expect(answerTimeBand(-5)).toBe("unknown");
      expect(answerTimeBand(NaN)).toBe("unknown");
    });

    it("brisk answers (under 10s) are fast", () => {
      expect(answerTimeBand(0)).toBe("fast");
      expect(answerTimeBand(1)).toBe("fast");
      expect(answerTimeBand(9)).toBe("fast");
    });

    it("10..60 seconds is the normal band", () => {
      expect(answerTimeBand(10)).toBe("normal");
      expect(answerTimeBand(30)).toBe("normal");
      expect(answerTimeBand(60)).toBe("normal");
    });

    it("hesitant answers (over 60s) are slow", () => {
      expect(answerTimeBand(61)).toBe("slow");
      expect(answerTimeBand(600)).toBe("slow");
    });
  });

  describe("TIME_MULTIPLIER", () => {
    it("fast = 1.25x, normal = 1x, slow = 0.75x, unknown = 1x", () => {
      expect(TIME_MULTIPLIER.fast).toBe(1.25);
      expect(TIME_MULTIPLIER.normal).toBe(1);
      expect(TIME_MULTIPLIER.slow).toBe(0.75);
      expect(TIME_MULTIPLIER.unknown).toBe(1);
    });
  });

  describe("timeScaledDelta", () => {
    it("keeps the historical difficulty deltas when time is unknown", () => {
      expect(timeScaledDelta("easy", null)).toEqual(assessmentDelta("easy"));
      expect(timeScaledDelta("medium", undefined)).toEqual(assessmentDelta("medium"));
      expect(timeScaledDelta("hard", null)).toEqual(assessmentDelta("hard"));
      expect(timeScaledDelta(undefined, null)).toEqual(assessmentDelta("easy"));
    });

    it("scales the difficulty delta by the speed band", () => {
      // same-direction scaling (a fast answer is a strong signal either way)
      expect(timeScaledDelta("easy", 3)).toEqual({ onCorrect: 0.15 * 1.25, onWrong: -0.1 * 1.25 });
      expect(timeScaledDelta("medium", 30)).toEqual({ onCorrect: 0.175, onWrong: -0.125 });
      expect(timeScaledDelta("hard", 120)).toEqual({ onCorrect: 0.2 * 0.75, onWrong: -0.15 * 0.75 });
    });

    it("composes with the EWMA update like recordAssessment does (rounded)", () => {
      // first attempt is always neutral (0.6); a FAST second correct answer lands 0.79.
      expect(round2(0.6 + timeScaledDelta("easy", 3).onCorrect)).toBe(0.79);
      // the same flow answered SLOWLY lands 0.71 — weaker mastery signal.
      expect(round2(0.6 + timeScaledDelta("easy", 500).onCorrect)).toBe(0.71);
      // a WRONG fast answer corrects harder than a wrong normal one.
      expect(round2(0.6 + timeScaledDelta("easy", 3).onWrong)).toBe(0.48);
      expect(round2(0.6 + timeScaledDelta("easy", null).onWrong)).toBe(0.5);
    });
  });
});