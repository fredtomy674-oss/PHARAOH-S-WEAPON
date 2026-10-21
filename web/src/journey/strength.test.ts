import { describe, expect, it } from "vitest";
import type { MasteryConcept } from "../api.js";
import { learningStrength, strengthProgress, STRENGTH_LEVELS } from "./strength.js";

/**
 * PHASE 161.1 — «قوة التعلم»: العقد هو الحتمية والصدق:
 * نفس الإتقان ⇒ نفس الرقم والمستوى، والرقم لا يقرأ إلا إتقانًا حقيقيًا.
 */

const m = (over: Partial<MasteryConcept> & { conceptId: string }): MasteryConcept => ({
  code: `C-${over.conceptId}`,
  title: `مفهوم ${over.conceptId}`,
  mastery: 0.5,
  decayedMastery: 0.5,
  level: "developing",
  labelAr: "نامٍ",
  attempts: 3,
  correct: 2,
  lastSeenAt: "2026-01-01T00:00:00.000Z",
  daysSinceLastPractice: 1,
  trend: "steady",
  ...over,
});

describe("learningStrength — PHASE 161.1", () => {
  it("starts at zero with nothing practiced — وتبقى العتبة القادمة معلَنة", () => {
    const s = learningStrength([]);
    expect(s).toEqual({
      score: 0,
      level: 1,
      levelNameAr: "بداية",
      nextLevelAt: 20,
      mastered: 0,
      practiced: 0,
    });
  });

  it("is deterministic — same mastery, same number, even re-ordered", () => {
    const input = [
      m({ conceptId: "c1", decayedMastery: 0.92, level: "mastered" }),
      m({ conceptId: "c2", decayedMastery: 0.31, level: "developing" }),
      m({ conceptId: "c3", decayedMastery: 0.64, level: "advanced" }),
    ];
    expect(learningStrength(input)).toEqual(learningStrength(input));
    expect(learningStrength([input[2]!, input[0]!, input[1]!])).toEqual(learningStrength(input));
  });

  it("mixes mastery depth (70%) with the mastered ratio (30%) — pinned", () => {
    // avg = (0.92 + 0.31 + 0.64)/3 = 0.62333… · mastered = 1/3
    // score = round((0.62333 * 0.7 + 0.33333 * 0.3) * 100) = round(53.63) = 54
    const s = learningStrength([
      m({ conceptId: "c1", decayedMastery: 0.92, level: "mastered", attempts: 5 }),
      m({ conceptId: "c2", decayedMastery: 0.31, level: "developing", attempts: 2 }),
      m({ conceptId: "c3", decayedMastery: 0.64, level: "advanced", attempts: 0 }),
    ]);
    expect(s.score).toBe(54);
    expect(s.level).toBe(3);
    expect(s.levelNameAr).toBe("صعود");
    expect(s.nextLevelAt).toBe(60);
    expect(s.mastered).toBe(1);
    expect(s.practiced).toBe(2); // c3 لم تُجرَّب بعد — لا تُحسب ممارسة
  });

  it("reaches 100 and the top level when every concept is fully mastered", () => {
    const s = learningStrength([
      m({ conceptId: "a", decayedMastery: 1, level: "mastered" }),
      m({ conceptId: "b", decayedMastery: 1, level: "mastered" }),
    ]);
    expect(s.score).toBe(100);
    expect(s.level).toBe(5);
    expect(s.levelNameAr).toBe("القمة");
    expect(s.nextLevelAt).toBeNull();
  });

  it("never drops when a value rises, and clamps broken numbers honestly", () => {
    const base = [m({ conceptId: "a", decayedMastery: 0.4, level: "developing" })];
    const raised = [m({ conceptId: "a", decayedMastery: 0.8, level: "advanced" })];
    expect(learningStrength(raised).score).toBeGreaterThanOrEqual(learningStrength(base).score);

    const broken = learningStrength([
      m({ conceptId: "a", decayedMastery: 1.7, level: "mastered" }),
      m({ conceptId: "b", decayedMastery: Number.NaN, level: "needs_review" }),
    ]);
    // 1.7 ⇒ 1، NaN ⇒ 0: المتوسط 0.5 ونسبة الإتقان 0.5 ⇒ 50.
    expect(broken.score).toBe(50);
  });

  it("strengthProgress walks inside the current band and saturates at the top", () => {
    const band = learningStrength([
      m({ conceptId: "a", decayedMastery: 0.54, level: "advanced", attempts: 4 }),
      m({ conceptId: "b", decayedMastery: 0.54, level: "mastered", attempts: 4 }),
    ]);
    // avg = 0.54، mastered = 1/2 ⇒ (0.54×0.7 + 0.5×0.3) = 0.528 ⇒ 53 داخل «صعود» (40..60).
    expect(band.score).toBe(53);
    expect(strengthProgress(band)).toBeCloseTo(13 / 20);

    const top = learningStrength([m({ conceptId: "a", decayedMastery: 1, level: "mastered" })]);
    expect(strengthProgress(top)).toBe(1);
  });

  it("keeps the five level names in order", () => {
    expect(STRENGTH_LEVELS.map((l) => l.name)).toEqual(["بداية", "تقدّم", "صعود", "إتقان", "القمة"]);
  });
});
