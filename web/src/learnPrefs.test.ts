import { describe, expect, it } from "vitest";
import type { PracticePlanItem } from "./api.js";
import { weeklyPracticeItem } from "./learnPrefs.js";

/**
 * PHASE 179 — «خطة الأسبوع» تختار خطوة تدريب واحدة حتمية: مفهوم مستحق
 * ولديه سؤال أولًا، وإلا أضعف مفهوم قابل للتمرين. لا عشوائية ولا اعتماد
 * على ترتيب غير مضمون.
 */

function item(over: Partial<PracticePlanItem> & { conceptId: string }): PracticePlanItem {
  return {
    code: "c",
    title: `مفهوم ${over.conceptId}`,
    lessonId: null,
    lessonTitle: null,
    subjectId: null,
    subjectNameAr: null,
    mastery: 0.2,
    decayedMastery: 0.2,
    level: "needs_review",
    labelAr: "يحتاج مراجعة",
    trend: "steady",
    attempts: 1,
    correct: 0,
    daysSinceLastPractice: 1,
    availableQuestions: 1,
    openQuestions: 0,
    tracked: true,
    dueForReview: false,
    ...over,
  };
}

describe("weeklyPracticeItem (PHASE 179)", () => {
  it("prefers a due-for-review concept that has a question", () => {
    const plan = [
      item({ conceptId: "a", dueForReview: false }),
      item({ conceptId: "b", dueForReview: true }),
      item({ conceptId: "c", dueForReview: true, availableQuestions: 0 }),
    ];
    expect(weeklyPracticeItem(plan)?.conceptId).toBe("b");
  });

  it("skips concepts without any question and falls back to the weakest practicable one", () => {
    const plan = [
      item({ conceptId: "no-q", availableQuestions: 0, openQuestions: 0 }),
      item({ conceptId: "first" }),
      item({ conceptId: "second" }),
    ];
    expect(weeklyPracticeItem(plan)?.conceptId).toBe("first");
  });

  it("accepts an open question as practice material", () => {
    const plan = [item({ conceptId: "open", availableQuestions: 0, openQuestions: 1 })];
    expect(weeklyPracticeItem(plan)?.conceptId).toBe("open");
  });

  it("returns null for an empty plan or a plan with nothing practicable", () => {
    expect(weeklyPracticeItem([])).toBeNull();
    expect(weeklyPracticeItem([item({ conceptId: "x", availableQuestions: 0, openQuestions: 0 })])).toBeNull();
  });
});
