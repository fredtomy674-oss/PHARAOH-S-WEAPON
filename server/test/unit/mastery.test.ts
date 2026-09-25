import { describe, expect, it } from "vitest";
import {
  clampMastery,
  daysBetween,
  decayMastery,
  describeMastery,
  masteryLevel,
  masteryTrend,
  round2,
  safeParseAssessment,
} from "../../src/modules/progress/mastery.js";

/**
 * PHASE 24 — the pure concept-mastery engine: level banding, Ebbinghaus
 * decay, trend derivation and assessment-payload tolerance. No I/O.
 */
describe("concept mastery engine (PHASE 24)", () => {
  describe("masteryLevel / describeMastery", () => {
    it("bands scores into the four Arabic-labelled levels", () => {
      expect(masteryLevel(1)).toBe("mastered");
      expect(masteryLevel(0.8)).toBe("mastered");
      expect(masteryLevel(0.79)).toBe("advanced");
      expect(masteryLevel(0.6)).toBe("advanced");
      expect(masteryLevel(0.59)).toBe("developing");
      expect(masteryLevel(0.4)).toBe("developing");
      expect(masteryLevel(0.39)).toBe("needs_review");
      expect(masteryLevel(0)).toBe("needs_review");
    });

    it("tolerates out-of-range input but never leaks a level outside the band", () => {
      expect(clampMastery(-3)).toBe(0);
      expect(clampMastery(1.7)).toBe(1);
      expect(masteryLevel(-3)).toBe("needs_review");
    });

    it("describeMastery returns level + Arabic label together", () => {
      expect(describeMastery(0.9)).toEqual({ level: "mastered", labelAr: "متقن" });
      expect(describeMastery(0.5)).toEqual({ level: "developing", labelAr: "قيد التقدم" });
      expect(describeMastery(0.2)).toEqual({ level: "needs_review", labelAr: "يحتاج مراجعة" });
    });
  });

  describe("decayMastery / daysBetween", () => {
    it("keeps mastery intact when practiced today", () => {
      expect(decayMastery(0.9, 0, 0.02)).toBeCloseTo(0.9, 10);
    });

    it("decays exponentially with time and clamps to [0, 1]", () => {
      // e^(-0.02*10) ≈ 0.8187
      expect(decayMastery(0.9, 10, 0.02)).toBeCloseTo(0.9 * Math.exp(-0.2), 5);
      expect(decayMastery(0.5, 1000, 0.02)).toBeLessThan(1e-8);
      expect(decayMastery(0.5, 1000, 0.02)).toBeGreaterThanOrEqual(0);
    });

    it("perDay = 0 disables decay (static mastery)", () => {
      expect(decayMastery(0.7, 400, 0)).toBe(0.7);
    });

    it("never accepts negative days or rates", () => {
      expect(decayMastery(0.7, -10, 0.02)).toBe(0.7);
      expect(decayMastery(0.7, 10, -1)).toBe(0.7);
    });

    it("daysBetween is a non-negative whole-day delta", () => {
      const now = new Date("2026-01-10T00:00:00Z");
      expect(daysBetween(now, now)).toBe(0);
      expect(daysBetween(new Date("2026-01-01T00:00:00Z"), now)).toBe(9);
      expect(daysBetween(new Date("2026-01-20T00:00:00Z"), now)).toBe(0); // future → 0
    });
  });

  describe("masteryTrend", () => {
    it("treats an empty history as steady", () => {
      expect(masteryTrend([])).toBe("steady");
    });

    it("single / small histories without a comparator are steady", () => {
      expect(masteryTrend([{ correct: true }])).toBe("steady");
      expect(masteryTrend([{ correct: true }, { correct: false }])).toBe("steady");
    });

    it("recent wins raise the trend when they beat earlier results", () => {
      const history = [
        { correct: false }, { correct: false }, { correct: false },
        { correct: false }, { correct: true }, { correct: true }, { correct: true },
      ];
      expect(masteryTrend(history)).toBe("up");
    });

    it("recent misses push the trend down", () => {
      const history = [
        { correct: true }, { correct: true }, { correct: true },
        { correct: true }, { correct: false }, { correct: false },
      ];
      expect(masteryTrend(history)).toBe("down");
    });

    it("mixed-but-close histories stay steady", () => {
      const history = [
        { correct: true }, { correct: false }, { correct: true },
        { correct: true }, { correct: false }, { correct: true },
      ];
      expect(masteryTrend(history)).toBe("steady");
    });
  });

  describe("safeParseAssessment + round2", () => {
    it("rounds to two decimals for stable display", () => {
      expect(round2(0.81534)).toBe(0.82);
      expect(round2(0.4)).toBe(0.4);
    });

    it("parses well-formed assessment payloads and rejects garbage", () => {
      expect(safeParseAssessment(null)).toBeNull();
      expect(safeParseAssessment("not-json")).toBeNull();
      expect(safeParseAssessment("[1,2]")).toBeNull();
      expect(safeParseAssessment("")).toBeNull();
      expect(safeParseAssessment(JSON.stringify({ conceptId: "c-1", correct: true }))).toEqual({ conceptId: "c-1", correct: true });
      // Sparse/extra-key payloads pass through as plain objects (still JSON), which
      // callers treat as "no conceptId → skip".
      expect(safeParseAssessment(JSON.stringify({ score: 0.6 }))).toEqual({ score: 0.6 });
    });
  });
});