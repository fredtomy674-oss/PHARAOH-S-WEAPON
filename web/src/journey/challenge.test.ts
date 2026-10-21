import { describe, expect, it } from "vitest";
import type { MasteryConcept } from "../api.js";
import { challengeMission, challengeSteps } from "./challenge.js";
import type { LearningGoal } from "./goals.js";
import { learningStrength } from "./strength.js";

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

const goal = (over: Partial<LearningGoal> & Pick<LearningGoal, "id">): LearningGoal => ({
  kind: "concept",
  title: "هدف",
  detail: "تفصيل",
  progress: 0.5,
  conceptId: "c1",
  conceptTitle: "مفهوم",
  ...over,
});

describe("PHASE 183 — مسار القمة", () => {
  it("marks exactly one current level and one next level, with honest ranges", () => {
    const s = learningStrength([
      m({ conceptId: "a", decayedMastery: 0.54, level: "advanced", attempts: 4 }),
      m({ conceptId: "b", decayedMastery: 0.54, level: "mastered", attempts: 4 }),
    ]);
    const steps = challengeSteps(s);
    expect(steps.map((step) => step.state)).toEqual(["done", "done", "current", "next", "locked"]);
    expect(steps.map((step) => [step.min, step.max])).toEqual([
      [0, 19],
      [20, 39],
      [40, 59],
      [60, 79],
      [80, 100],
    ]);
    expect(steps[2]!.progress).toBeCloseTo(13 / 20);
    expect(steps[0]!.progress).toBe(1);
    expect(steps[3]!.progress).toBe(0);
  });

  it("is deterministic — same strength, same map", () => {
    const s = learningStrength([m({ conceptId: "a", decayedMastery: 0.9, level: "mastered" })]);
    expect(challengeSteps(s)).toEqual(challengeSteps(s));
  });

  it("puts the summit at level five and makes every lower step complete", () => {
    const s = learningStrength([
      m({ conceptId: "a", decayedMastery: 1, level: "mastered" }),
      m({ conceptId: "b", decayedMastery: 1, level: "mastered" }),
    ]);
    const steps = challengeSteps(s);
    expect(steps[4]).toMatchObject({ level: 5, name: "القمة", state: "current", progress: 1, max: 100 });
    expect(steps.slice(0, 4).every((step) => step.state === "done")).toBe(true);
  });

  it("offers only a real concept mission, never a milestone disguised as practice", () => {
    const milestone = goal({ id: "milestone-3", kind: "milestone", conceptId: undefined, conceptTitle: undefined });
    const concept = goal({ id: "concept-c2", conceptId: "c2", conceptTitle: "مفهوم 2" });
    expect(challengeMission([milestone, concept])).toBe(concept);
    expect(challengeMission([milestone])).toBeNull();
    expect(challengeMission([])).toBeNull();
  });
});
