/**
 * PHASE 34 — pure day-bucketing for the admin time-analytics section.
 *
 * Closes two deferred tails with pure arithmetic and no I/O:
 *   - D-021: «مؤشرات زمنية (جلسات/يوم)، ترتيب الدروس الأكثر نشاطًا»
 *   - D-031: «تقسيم الفترة الزمنية للاستخدام والوفورات»
 *
 * Days are UTC calendar days, reusing the SAME `dayKey`/`previousDay` helpers
 * the streak engine (PHASE 32) uses, so the product has exactly one definition
 * of "a day" and the chart buckets can never disagree with the streak badge.
 * Every bucket of the window is emitted (zero-filled) so a chart column always
 * exists for today, and timestamps outside the window are ignored.
 */
import { dayKey, previousDay } from "../progress/streak.js";

export interface DayCount {
  /** "YYYY-MM-DD" (UTC). */
  day: string;
  count: number;
}

/** The last `days` UTC day keys, ascending: [today-days+1 … today]. */
export function lastNDayKeys(days: number, now: Date = new Date()): string[] {
  const today = dayKey(now);
  const keys: string[] = [];
  for (let back = days - 1; back >= 0; back -= 1) {
    keys.push(previousDay(today, back));
  }
  return keys;
}

/**
 * Start instant of the window (00:00:00Z of its oldest day) — the WHERE bound
 * for range-filtered queries so a SQL filter and the JS buckets can never
 * disagree about what "the last `days`" means.
 */
export function windowStart(days: number, now: Date = new Date()): Date {
  return new Date(`${lastNDayKeys(days, now)[0] ?? dayKey(now)}T00:00:00.000Z`);
}

/**
 * Counts timestamps per UTC day, aligned to the last `days` buckets (ascending,
 * zero-filled). Timestamps older than the window are dropped; the buckets are
 * stable regardless of input order.
 */
export function countsByDay(days: number, timestamps: readonly Date[], now: Date = new Date()): DayCount[] {
  const keys = lastNDayKeys(days, now);
  const counts = new Map<string, number>(keys.map((key) => [key, 0]));
  for (const t of timestamps) {
    const key = dayKey(t);
    const current = counts.get(key);
    if (current !== undefined) counts.set(key, current + 1);
  }
  return keys.map((day) => ({ day, count: counts.get(day) ?? 0 }));
}

export interface DayUsage {
  /** "YYYY-MM-DD" (UTC). */
  day: string;
  calls: number;
  tokens: number;
  costUsd: number;
}

/**
 * Aggregates AI usage rows per UTC day over the same window shape as
 * `countsByDay` (ascending, zero-filled, out-of-window rows ignored). Cost is
 * rounded to 4 decimals so float accumulation noise never reaches the UI.
 */
export function usageByDay(
  days: number,
  logs: ReadonlyArray<{ createdAt: Date; inputTokens: number; outputTokens: number; costUsd: number }>,
  now: Date = new Date(),
): DayUsage[] {
  const keys = lastNDayKeys(days, now);
  const sums = new Map<string, { calls: number; tokens: number; costUsd: number }>(
    keys.map((key) => [key, { calls: 0, tokens: 0, costUsd: 0 }]),
  );
  for (const log of logs) {
    const bucket = sums.get(dayKey(log.createdAt));
    if (!bucket) continue; // outside the window
    bucket.calls += 1;
    bucket.tokens += log.inputTokens + log.outputTokens;
    bucket.costUsd += log.costUsd;
  }
  return keys.map((day) => {
    const bucket = sums.get(day) ?? { calls: 0, tokens: 0, costUsd: 0 };
    return {
      day,
      calls: bucket.calls,
      tokens: bucket.tokens,
      costUsd: Math.round(bucket.costUsd * 10_000) / 10_000,
    };
  });
}
