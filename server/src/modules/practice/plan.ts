import type { MasteryLevel, MasteryTrend } from "../progress/mastery.js";

/**
 * PHASE 25 — practice plan (recommendations from the mastery engine).
 * Converts the read-side mastery summaries into a ranked, actionable plan:
 * the weakest (most-decayed) tracked concepts come first, so the student
 * knows exactly what to practice next. Pure module — sorting only, no I/O.
 */

export interface PracticePlanItem {
  conceptId: string;
  code: string;
  title: string;
  lessonId: string | null;
  lessonTitle: string | null;
  /** Raw persisted mastery (tutor-memory value, no decay). */
  mastery: number;
  /** Read-side Ebbinghaus-decayed score the ranking is built on. */
  decayedMastery: number;
  level: MasteryLevel;
  labelAr: string;
  trend: MasteryTrend;
  attempts: number;
  correct: number;
  daysSinceLastPractice: number;
  /** MCQ questions the student can practice for this concept (enrolled curricula only). */
  availableQuestions: number;
  /** PHASE 30 — open (free-text) questions available for this concept (enrolled curricula only). */
  openQuestions: number;
  /**
   * PHASE 28 — false for concepts the student never practiced (no progress
   * row). Untracked concepts of the enrolled curricula are listed so concepts
   * without questions are discoverable and can be generated into practice.
   */
  tracked: boolean;
}

/**
 * Rank the plan weakest-first:
 *   1. tracked concepts before untracked ones — practiced-but-weak work comes
 *      first; brand-new (mastery 0) concepts follow so they stay discoverable;
 *   2. current (decayed) mastery ascending — practice what you know least;
 *   3. days since last practice descending — stale concepts jump the queue;
 *   4. conceptId — deterministic tie-break (stable ordering for tests/UI).
 * Returns a new array; the input is never mutated.
 */
export function sortPlan(items: PracticePlanItem[]): PracticePlanItem[] {
  return [...items].sort((a, b) => {
    if (a.tracked !== b.tracked) return a.tracked ? -1 : 1;
    if (a.decayedMastery !== b.decayedMastery) return a.decayedMastery - b.decayedMastery;
    if (a.daysSinceLastPractice !== b.daysSinceLastPractice) return b.daysSinceLastPractice - a.daysSinceLastPractice;
    return a.conceptId < b.conceptId ? -1 : a.conceptId > b.conceptId ? 1 : 0;
  });
}