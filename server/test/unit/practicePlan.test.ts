import { describe, expect, it } from "vitest";
import { sortPlan, type PracticePlanItem } from "../../src/modules/practice/plan.js";

/** Minimal fixture builder — only the fields that matter for sorting. */
function item(over: Partial<PracticePlanItem> & { conceptId: string }): PracticePlanItem {
  return {
    code: "c",
    title: "مفهوم",
    lessonId: null,
    lessonTitle: null,
    mastery: 0.5,
    decayedMastery: 0.5,
    level: "developing",
    labelAr: "قيد التقدم",
    trend: "steady",
    attempts: 1,
    correct: 0,
    daysSinceLastPractice: 0,
    availableQuestions: 1,
    tracked: true,
    ...over,
  };
}

/**
 * PHASE 25 — the pure plan ranking: weakest (most-decayed) concepts first,
 * then the most-stale (longest since practice), then a deterministic id
 * tie-break. The input array is never mutated.
 */
describe("sortPlan (practice plan ranking) — PHASE 25", () => {
  it("puts the weakest decayed mastery first", () => {
    const plan = sortPlan([
      item({ conceptId: "a", decayedMastery: 0.9, level: "mastered", labelAr: "متقن" }),
      item({ conceptId: "b", decayedMastery: 0.2, level: "needs_review", labelAr: "يحتاج مراجعة" }),
      item({ conceptId: "c", decayedMastery: 0.6, level: "advanced", labelAr: "متقدم" }),
    ]);
    expect(plan.map((p) => p.conceptId)).toEqual(["b", "c", "a"]);
  });

  it("breaks decayed-mastery ties by staleness (longest since practice first)", () => {
    const plan = sortPlan([
      item({ conceptId: "fresh", decayedMastery: 0.5, daysSinceLastPractice: 0 }),
      item({ conceptId: "stale", decayedMastery: 0.5, daysSinceLastPractice: 12 }),
      item({ conceptId: "week", decayedMastery: 0.5, daysSinceLastPractice: 7 }),
    ]);
    expect(plan.map((p) => p.conceptId)).toEqual(["stale", "week", "fresh"]);
  });

  it("uses conceptId as the deterministic final tie-break", () => {
    const plan = sortPlan([
      item({ conceptId: "zebra", decayedMastery: 0.4, daysSinceLastPractice: 3 }),
      item({ conceptId: "apple", decayedMastery: 0.4, daysSinceLastPractice: 3 }),
    ]);
    expect(plan.map((p) => p.conceptId)).toEqual(["apple", "zebra"]);
  });

  it("never mutates the input array", () => {
    const input = [
      item({ conceptId: "first", decayedMastery: 0.9 }),
      item({ conceptId: "second", decayedMastery: 0.1 }),
    ];
    const before = input.map((p) => p.conceptId);
    const sorted = sortPlan(input);
    expect(sorted.map((p) => p.conceptId)).toEqual(["second", "first"]);
    // The original array keeps its order and is a different object.
    expect(input.map((p) => p.conceptId)).toEqual(before);
    expect(sorted).not.toBe(input);
  });

  it("orders mastered concepts after needs-review ones with equal recency", () => {
    const plan = sortPlan([
      item({ conceptId: "mastered", decayedMastery: 0.95, level: "mastered", daysSinceLastPractice: 0 }),
      item({ conceptId: "weak", decayedMastery: 0.3, level: "needs_review", daysSinceLastPractice: 0 }),
    ]);
    expect(plan.map((p) => p.conceptId)).toEqual(["weak", "mastered"]);
  });

  // PHASE 28 — the plan covers untracked enrolled concepts so questionless
  // concepts stay discoverable, but tracked practice always comes first.
  it("keeps tracked concepts ahead of untracked ones even when mastery is lower", () => {
    const plan = sortPlan([
      item({ conceptId: "fresh", tracked: false, decayedMastery: 0 }),
      item({ conceptId: "weak", tracked: true, decayedMastery: 0.1 }),
      item({ conceptId: "strong", tracked: true, decayedMastery: 0.9 }),
    ]);
    // the weak tracked concept, then the strong tracked one, THEN the untracked
    expect(plan.map((p) => p.conceptId)).toEqual(["weak", "strong", "fresh"]);
    expect(plan[2]!.tracked).toBe(false);
  });

  it("breaks ties among untracked concepts deterministically", () => {
    const plan = sortPlan([
      item({ conceptId: "zebra", tracked: false, decayedMastery: 0 }),
      item({ conceptId: "apple", tracked: false, decayedMastery: 0 }),
    ]);
    expect(plan.map((p) => p.conceptId)).toEqual(["apple", "zebra"]);
  });
});