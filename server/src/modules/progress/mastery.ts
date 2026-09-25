/**
 * Pure concept-mastery engine (PHASE 24) — no I/O, deterministic, fully
 * unit-testable. Levels, exponential forgetting and trend derivation live here
 * so every surface (student UI, parent dashboard, practice feedback) shares ONE
 * definition of "متقن".
 */

export type MasteryLevel = "mastered" | "advanced" | "developing" | "needs_review";
export type MasteryTrend = "up" | "steady" | "down";

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