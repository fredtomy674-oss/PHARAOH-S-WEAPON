import type { LearningGoal } from "./goals.js";
import { STRENGTH_LEVELS, strengthProgress, type LearningStrength } from "./strength.js";

/**
 * PHASE 183 — «مسار القمة»: the learning-progress model that replaced the
 * decorative Nile garden.
 *
 * The map reads only the same two honest signals as `learningStrength`:
 * mastery depth and the share of concepts actually mastered. It never invents
 * a level, a score or a mission — same progress in, same map out.
 */
export type ChallengeStepState = "done" | "current" | "next" | "locked";

export interface ChallengeStep {
  /** 1..5 */
  level: number;
  name: string;
  /** First score inside this band (inclusive). */
  min: number;
  /** Last score inside this band (inclusive; 100 at the summit). */
  max: number;
  state: ChallengeStepState;
  /** 0..1 progress inside this band (completed bands are full). */
  progress: number;
}

export function challengeSteps(strength: LearningStrength): ChallengeStep[] {
  return STRENGTH_LEVELS.map((band, index) => {
    const level = index + 1;
    const min = band.min;
    const max = index + 1 < STRENGTH_LEVELS.length ? STRENGTH_LEVELS[index + 1]!.min - 1 : 100;
    const state: ChallengeStepState =
      level < strength.level
        ? "done"
        : level === strength.level
          ? "current"
          : level === strength.level + 1
            ? "next"
            : "locked";
    const progress =
      state === "done" ? 1 : state === "current" ? Math.max(0, Math.min(1, strengthProgress(strength))) : 0;
    return { level, name: band.name, min, max, state, progress };
  });
}

/**
 * The one mission the map invites the student to accept next. Only a real
 * concept goal can open a practice question; a milestone is progress, not a
 * question, so it is never dressed as a button.
 */
export function challengeMission(goals: LearningGoal[]): LearningGoal | null {
  return goals.find((goal) => goal.kind === "concept" && !!goal.conceptId) ?? null;
}
