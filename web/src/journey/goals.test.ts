import { describe, expect, it } from "vitest";
import type { MasteryConcept } from "../api.js";
import { MAX_CONCEPT_GOALS, MILESTONE_STEP, nextGoals } from "./goals.js";

/**
 * PHASE 161.1 — «أهدافي الآن»: أهداف حتمية من الإتقان الحقيقي فقط:
 * هدف إتقان واحد يتسلّق بالثلاثة + أضعف مفهومين بزر تمرين لكل واحد.
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

describe("nextGoals — PHASE 161.1", () => {
  it("says nothing when nothing is tracked — لا نعد بما لا نعرفه", () => {
    expect(nextGoals([])).toEqual([]);
  });

  it("starts the milestone at 3 and shows the two weakest concepts, each with its practice door", () => {
    const input = [
      m({ conceptId: "c1", title: "الكسور", decayedMastery: 0.2, level: "needs_review" }),
      m({ conceptId: "c2", title: "الضرب", decayedMastery: 0.44, level: "developing" }),
      m({ conceptId: "c3", title: "القسمة", decayedMastery: 0.66, level: "advanced" }),
      m({ conceptId: "c4", title: "الجمع", decayedMastery: 0.95, level: "mastered" }),
    ];
    const goals = nextGoals(input);
    expect(goals).toHaveLength(1 + MAX_CONCEPT_GOALS);

    const [milestone, first, second] = goals;
    expect(milestone!.id).toBe("milestone-3");
    expect(milestone!.title).toBe("أتقن 3 مفاهيم");
    expect(milestone!.detail).toContain("متقن حتى الآن: 1");
    expect(milestone!.detail).toContain("بقي 2");
    expect(milestone!.progress).toBeCloseTo(1 / 3);
    expect(milestone!.conceptId).toBeUndefined();

    // الأضعف أولًا، ولا يدخل هدف المتقن أبدًا.
    expect(first!.conceptId).toBe("c1");
    expect(first!.conceptTitle).toBe("الكسور");
    expect(first!.detail).toContain("20%");
    expect(second!.conceptId).toBe("c2");
    expect(goals.some((g) => g.conceptId === "c4")).toBe(false);
  });

  it("climbs the milestone by threes and keeps it as progress to the next mark", () => {
    const mastered = (n: number, offset = 0): MasteryConcept[] =>
      Array.from({ length: n }, (_, i) => m({ conceptId: `ok${i + offset}`, level: "mastered", decayedMastery: 0.96 }));
    expect(nextGoals(mastered(3))[0]!.id).toBe(`milestone-${2 * MILESTONE_STEP}`);
    expect(nextGoals(mastered(3))[0]!.progress).toBeCloseTo(0.5);
    expect(nextGoals(mastered(6))[0]!.id).toBe(`milestone-${3 * MILESTONE_STEP}`);
    expect(nextGoals(mastered(6))[0]!.progress).toBeCloseTo(2 / 3);
  });

  it("returns only the milestone goal when every concept is mastered — ويبقى سقف الأهداف", () => {
    const goals = nextGoals([
      m({ conceptId: "a", level: "mastered", decayedMastery: 0.9 }),
      m({ conceptId: "b", level: "mastered", decayedMastery: 0.85 }),
    ]);
    expect(goals).toHaveLength(1);
    expect(goals[0]!.kind).toBe("milestone");
    expect(goals.length).toBeLessThanOrEqual(1 + MAX_CONCEPT_GOALS);
  });

  it("is deterministic — same mastery, same goals, even re-ordered; ties break by concept id", () => {
    const input = [
      m({ conceptId: "b", decayedMastery: 0.3 }),
      m({ conceptId: "a", decayedMastery: 0.3 }),
      m({ conceptId: "c", decayedMastery: 0.8, level: "advanced" }),
    ];
    const goals = nextGoals(input);
    expect(goals).toEqual(nextGoals([input[2]!, input[0]!, input[1]!]));
    expect(goals[1]!.conceptId).toBe("a");
    expect(goals[2]!.conceptId).toBe("b");
  });
});
