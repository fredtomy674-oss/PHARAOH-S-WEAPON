/**
 * Pure concept-mastery engine (PHASE 24) — no I/O, deterministic, fully
 * unit-testable. Levels, exponential forgetting and trend derivation live here
 * so every surface (student UI, parent dashboard, practice feedback) shares ONE
 * definition of "متقن".
 */

export type MasteryLevel = "mastered" | "advanced" | "developing" | "needs_review";
export type MasteryTrend = "up" | "steady" | "down";
export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface AssessmentDelta {
  onCorrect: number;
  onWrong: number;
}

/**
 * PHASE 26 — difficulty-aware mastery deltas (D-028 deferred item: "المعادلة
 * تعتمد على صعوبة السؤال"). Harder questions carry a stronger learning
 * signal, so they move mastery more — and miss harder questions costs more.
 * Easy keeps the historical defaults so existing behavior (and lesson
 * concept-checks without a difficulty) is unchanged.
 */
export const DIFFICULTY_DELTAS: Record<QuestionDifficulty, AssessmentDelta> = {
  easy: { onCorrect: 0.15, onWrong: -0.1 },
  medium: { onCorrect: 0.175, onWrong: -0.125 },
  hard: { onCorrect: 0.2, onWrong: -0.15 },
};

/** The EWMA deltas for an assessment of the given difficulty (easy default). */
export function assessmentDelta(difficulty?: QuestionDifficulty): AssessmentDelta {
  return DIFFICULTY_DELTAS[difficulty ?? "easy"];
}

/**
 * PHASE 31 — answer-time-aware mastery (D-028/D-030 deferred item: «زمن الإجابة
 * في معادلة الإتقان»). The speed of an answer is a SIGNAL-STRENGTH multiplier
 * on the difficulty delta: a brisk, confident answer (fast) moves mastery more
 * in both directions (quick correct = solid mastery; quick wrong = guess or
 * misconception worth correcting), while a hesitant answer (slow) is a weaker
 * signal. No recorded time (null/undefined) → "unknown" = unit multiplier, so
 * existing callers (session concept-checks, open answers) are unchanged — and
 * the FIRST attempt on any concept stays neutral (0.6 / 0.1) regardless of
 * speed (D-030 keeps the starting expectation fixed; differentiation appears
 * on the series).
 */
export type AnswerTimeBand = "fast" | "normal" | "slow" | "unknown";

/** Time-band cutoffs in whole seconds (display → submit). */
export const ANSWER_TIME_FAST_MAX_SECONDS = 10;
export const ANSWER_TIME_SLOW_MIN_SECONDS = 60;

export const TIME_MULTIPLIER: Record<AnswerTimeBand, number> = {
  fast: 1.25,
  normal: 1,
  slow: 0.75,
  unknown: 1,
};

/** Maps an answer time (seconds) to its signal-strength band. */
export function answerTimeBand(seconds: number | null | undefined): AnswerTimeBand {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return "unknown";
  if (seconds < ANSWER_TIME_FAST_MAX_SECONDS) return "fast";
  if (seconds <= ANSWER_TIME_SLOW_MIN_SECONDS) return "normal";
  return "slow";
}

/** Difficulty delta scaled by answer speed (unit multiplier when unknown). */
export function timeScaledDelta(
  difficulty: QuestionDifficulty | undefined,
  answerSeconds: number | null | undefined,
): AssessmentDelta {
  const base = assessmentDelta(difficulty);
  const mult = TIME_MULTIPLIER[answerTimeBand(answerSeconds)];
  return { onCorrect: base.onCorrect * mult, onWrong: base.onWrong * mult };
}

/** The subset of an assessment result payload the mastery engine consumes. */
export interface AssessmentPayload {
  conceptId?: string;
  correct?: boolean;
}

/** Tolerates missing/malformed result_json on assessments rows (PHASE 23/24). */
export function safeParseAssessment(json: string | null): AssessmentPayload | null {
  if (!json) return null;
  try {
    const value = JSON.parse(json) as unknown;
    // Plain objects only — arrays and primitives are never valid payloads.
    if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
    return value as AssessmentPayload;
  } catch {
    return null;
  }
}

/** Round to 2 decimals for stable display of mastery scores. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface LevelDef {
  level: MasteryLevel;
  labelAr: string;
  /** Inclusive lower bound of the level. */
  threshold: number;
}

const LEVELS: readonly LevelDef[] = [
  { level: "mastered", labelAr: "متقن", threshold: 0.8 },
  { level: "advanced", labelAr: "متقدم", threshold: 0.6 },
  { level: "developing", labelAr: "قيد التقدم", threshold: 0.4 },
  { level: "needs_review", labelAr: "يحتاج مراجعة", threshold: 0 },
];

/** Clamp a mastery score into [0, 1]. */
export function clampMastery(mastery: number): number {
  return Math.max(0, Math.min(1, mastery));
}

/** The level a mastery value belongs to (exclusive-inclusive banding above). */
export function masteryLevel(mastery: number): MasteryLevel {
  const clamped = clampMastery(mastery);
  return LEVELS.find((l) => clamped >= l.threshold)?.level ?? "needs_review";
}

/** The level + its Arabic label, in one call. */
export function describeMastery(mastery: number): { level: MasteryLevel; labelAr: string } {
  const level = masteryLevel(mastery);
  return { level, labelAr: LEVELS.find((l) => l.level === level)!.labelAr };
}

/**
 * Exponential forgetting curve (Ebbinghaus-style): mastery decays toward 0 the
 * longer a concept goes unpracticed. `perDay` is the decay rate (default 0.02
 * ≈ 2%/day, half-life ≈ 35 days); 0 disables decay.
 */
export function decayMastery(mastery: number, daysSinceLastPractice: number, perDay = 0.02): number {
  const days = Math.max(0, daysSinceLastPractice);
  const rate = Math.max(0, perDay);
  return clampMastery(mastery * Math.exp(-rate * days));
}

/** Whole days between two dates (never negative). */
export function daysBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / 86_400_000);
}

/**
 * Trajectory from an ordered assessment history (oldest → newest): compares
 * the correct-rate of the most recent ≤3 events against everything earlier. One
 * or fewer events, or a near-identical rate, reads as "steady".
 */
export function masteryTrend(events: readonly { correct: boolean }[]): MasteryTrend {
  if (events.length === 0) return "steady";
  const recentCount = Math.min(3, events.length);
  const recent = events.slice(-recentCount);
  const earlier = events.slice(0, events.length - recentCount);
  const rate = (list: readonly { correct: boolean }[]): number =>
    list.filter((e) => e.correct).length / list.length;
  const recentRate = rate(recent);
  const earlierRate = earlier.length === 0 ? recentRate : rate(earlier);
  if (recentRate >= earlierRate + 0.2) return "up";
  if (recentRate <= earlierRate - 0.2) return "down";
  return "steady";
}