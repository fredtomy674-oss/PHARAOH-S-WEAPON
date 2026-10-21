import { describe, expect, it } from "vitest";
import type { PracticePlanItem } from "./api.js";
import { needsGeneration, planPageText, planReason } from "./planMeta.js";

function item(over: Partial<PracticePlanItem> = {}): PracticePlanItem {
  return {
    conceptId: "c1",
    code: "c1",
    title: "مفهوم",
    lessonId: null,
    lessonTitle: null,
    subjectId: null,
    subjectNameAr: null,
    bookPageStart: null,
    bookPageEnd: null,
    mastery: 0.2,
    decayedMastery: 0.2,
    level: "needs_review",
    labelAr: "يحتاج مراجعة",
    trend: "steady",
    attempts: 0,
    correct: 0,
    daysSinceLastPractice: 0,
    availableQuestions: 0,
    openQuestions: 0,
    tracked: true,
    dueForReview: false,
    ...over,
  };
}

describe("planReason (PHASE 182)", () => {
  it("explains stale review, untouched concepts, and failed attempts honestly", () => {
    expect(planReason(item({ dueForReview: true, daysSinceLastPractice: 21 }))).toContain("مرّ 21");
    expect(planReason(item({ tracked: false }))).toContain("لم تتدرّب");
    expect(planReason(item({ attempts: 3, correct: 0 }))).toContain("3 مرات");
    expect(planReason(item({ attempts: 3, correct: 1 }))).toContain("أصبت 1 من 3");
  });

  it("falls back to a short mastery sentence, not an empty row", () => {
    expect(planReason(item({ decayedMastery: 0.72 }))).toContain("حافظ على مستواك");
  });
});

describe("plan actions (PHASE 182)", () => {
  it("keeps «تدرّب الآن» for MCQ and the essay behind its own action", () => {
    expect(needsGeneration(item(), "mcq")).toBe(true);
    expect(needsGeneration(item({ availableQuestions: 2 }), "mcq")).toBe(false);
    expect(needsGeneration(item({ openQuestions: 1 }), "open")).toBe(false);
    expect(needsGeneration(item(), "open")).toBe(true);
  });
});

describe("planPageText (PHASE 182)", () => {
  it("never prints page zero", () => {
    expect(planPageText(item({ bookPageStart: 0, bookPageEnd: 13 }))).toBe("صفحات 1–13");
    expect(planPageText(item({ bookPageStart: 0, bookPageEnd: 0 }))).toBe("صفحة الافتتاح");
    expect(planPageText(item())).toBeNull();
  });
});
