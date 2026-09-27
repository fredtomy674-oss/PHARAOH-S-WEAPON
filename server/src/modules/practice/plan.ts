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
  /**
   * PHASE 35 (D-037 tail) — «راجع قبل أن ينسى»: true when the concept has NOT
   * been seen (studied or practiced) for a long enough stretch, i.e. its decay
   * is now driven by pure forgetting rather than by anything new. Derived from
   * the same `daysSinceLastPractice` the ranking already uses, so the plan and
   * the exposure clock can never disagree.
   */
  dueForReview: boolean;
}

/**
 * PHASE 35 — a concept is «due for review» once its last exposure is at least
 * this many days old. Tuned against the decay constant (MASTERY_DECAY_PER_DAY
 * 2% ⇒ a 30-day gap costs ~0.45 of a 0.6 mastery, enough to demote a solid
 * concept to «يحتاج مراجعة»), and asserted by the unit tests.
 */
export const REVIEW_DUE_DAYS = 14;

/** True when the concept's last exposure is at least `REVIEW_DUE_DAYS` old. */
export function isDueForReview(daysSinceLastPractice: number): boolean {
  return daysSinceLastPractice >= REVIEW_DUE_DAYS;
}

/**
 * Rank the plan weakest-first, with forgetting first (PHASE 35):
 *   1. due-for-review concepts (D-037 tail) — exposure is old enough that the
 *      remaining mastery is being eaten by decay alone, so reviewing it is the
 *      highest-value action; ties inside the group fall through to the usual
 *      weakest-first order;
 *   2. tracked concepts before untracked ones — practiced-but-weak work comes
 *      first; brand-new (mastery 0) concepts follow so they stay discoverable;
 *   3. current (decayed) mastery ascending — practice what you know least;
 *   4. days since last practice descending — stale concepts jump the queue;
 *   5. conceptId — deterministic tie-break (stable ordering for tests/UI).
 * Returns a new array; the input is never mutated.
 */
export function sortPlan(items: PracticePlanItem[]): PracticePlanItem[] {
  return [...items].sort((a, b) => {
    if (a.dueForReview !== b.dueForReview) return a.dueForReview ? -1 : 1;
    if (a.tracked !== b.tracked) return a.tracked ? -1 : 1;
    if (a.decayedMastery !== b.decayedMastery) return a.decayedMastery - b.decayedMastery;
    if (a.daysSinceLastPractice !== b.daysSinceLastPractice) return b.daysSinceLastPractice - a.daysSinceLastPractice;
    return a.conceptId < b.conceptId ? -1 : a.conceptId > b.conceptId ? 1 : 0;
  });
}