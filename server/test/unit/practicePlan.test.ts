import { describe, expect, it } from "vitest";
import { isDueForReview, REVIEW_DUE_DAYS, sortPlan, type PracticePlanItem } from "../../src/modules/practice/plan.js";

/** Minimal fixture builder — only the fields that matter for sorting. */
function item(over: Partial<PracticePlanItem> & { conceptId: string }): PracticePlanItem {
  const days = over.daysSinceLastPractice ?? 0;
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
    daysSinceLastPractice: days,
    availableQuestions: 1,
    openQuestions: 0,
    tracked: true,
    // PHASE 35 — the flag is DERIVED from the exposure age, so fixtures can
    // never claim a staleness the sort would not honour.
    dueForReview: isDueForReview(days),
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

/**
 * PHASE 35 (D-037 tail) — «راجع قبل أن ينسى»: a concept whose last EXPOSURE
 * (study or practice) is old enough is due for review, and the plan ranks the
 * due group ahead of stronger work because decay alone is eroding it.
 */
describe("due-for-review (D-037 tail) — PHASE 35", () => {
  it("marks a concept due once its exposure is at least the threshold", () => {
    expect(REVIEW_DUE_DAYS).toBe(14);
    expect(isDueForReview(REVIEW_DUE_DAYS - 1)).toBe(false);
    expect(isDueForReview(REVIEW_DUE_DAYS)).toBe(true);
    expect(isDueForReview(REVIEW_DUE_DAYS + 30)).toBe(true);
  });

  it("treats a concept seen today as not due", () => {
    expect(isDueForReview(0)).toBe(false);
  });

  it("ranks due concepts ahead of stronger, fresher work", () => {
    const plan = sortPlan([
      item({ conceptId: "strong", decayedMastery: 0.95, level: "mastered", daysSinceLastPractice: 0 }),
      item({ conceptId: "due", decayedMastery: 0.6, daysSinceLastPractice: 20 }),
    ]);
    expect(plan.map((p) => p.conceptId)).toEqual(["due", "strong"]);
    expect(plan[0]!.dueForReview).toBe(true);
    expect(plan[1]!.dueForReview).toBe(false);
  });

  it("orders the due group by weakness, then staleness — the usual rules still apply inside it", () => {
    const plan = sortPlan([
      item({ conceptId: "older", decayedMastery: 0.5, daysSinceLastPractice: 40 }),
      item({ conceptId: "weaker", decayedMastery: 0.1, daysSinceLastPractice: 15 }),
      item({ conceptId: "newer", decayedMastery: 0.5, daysSinceLastPractice: 15 }),
    ]);
    // Inside the due group the ranking is unchanged: 0.1 mastery beats 0.5
    // (weakness first), then the two 0.5 rows fall to the staleness
    // tie-break, which puts the LONGEST-unseen concept first.
    expect(plan.map((p) => p.conceptId)).toEqual(["weaker", "older", "newer"]);
  });

  it("keeps an untracked (never seen) concept out of the due group", () => {
    const plan = sortPlan([
      item({ conceptId: "untracked", tracked: false, decayedMastery: 0, daysSinceLastPractice: 0 }),
      item({ conceptId: "due", decayedMastery: 0.7, daysSinceLastPractice: 30 }),
    ]);
    expect(plan.map((p) => p.conceptId)).toEqual(["due", "untracked"]);
    expect(plan[1]!.dueForReview).toBe(false);
  });

  it("never mutates the input array when re-ranking due items", () => {
    const input = [item({ conceptId: "b", daysSinceLastPractice: 20 }), item({ conceptId: "a", daysSinceLastPractice: 0 })];
    const before = input.map((p) => p.conceptId);
    const sorted = sortPlan(input);
    expect(sorted.map((p) => p.conceptId)).toEqual(["b", "a"]);
    expect(input.map((p) => p.conceptId)).toEqual(before);
  });
});