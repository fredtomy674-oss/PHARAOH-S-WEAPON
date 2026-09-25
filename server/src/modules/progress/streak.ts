/**
 * PHASE 32 — daily activity streak (D-020/D-035 deferred item: «تتابع أسبوعي» /
 * «بقاء شارة أسبوعية (تميّز تعاقبي)»). Pure date arithmetic, no I/O.
 *
 * A student's streak is the number of CONSECUTIVE activity days ending at
 * "now" (a day counts as active when the student learned or practiced, i.e.
 * any `answers` or `learning_sessions` row exists on that UTC calendar day).
 * Grace rule: a day that has not ended yet cannot break the streak, so the run
 * may legitimately start at "yesterday" when today is still empty.
 */
export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The calendar day `steps` days before `key` ("YYYY-MM-DD" lexicographic = chronological). */
export function previousDay(key: string, steps = 1): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - steps);
  return dayKey(d);
}

/**
 * Consecutive-day streak ending at `now` (defaults to the UTC today). Invalid
 * keys are ignored; duplicates collapse; isolated future days never start a run.
 */
export function streakForDates(dates: readonly string[], now = dayKey(new Date())): number {
  const seen = new Set(dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)));
  if (seen.size === 0) return 0;
  const todayActive = seen.has(now);
  let cursor = todayActive ? now : previousDay(now);
  let streak = 0;
  while (seen.has(cursor)) {
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}