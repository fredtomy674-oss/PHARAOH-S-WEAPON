/** PHASE 182 — date-only helpers for the child's homework planner. */

/** The local calendar date, never UTC (a 11pm homework in Cairo is still today). */
export function localISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse a `YYYY-MM-DD` value at local noon, avoiding DST edge cases. */
export function parseISODate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

export function addDaysISO(value: string, days: number): string {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return localISODate(date);
}

export function daysBetweenISO(from: string, to: string): number {
  const a = parseISODate(from).getTime();
  const b = parseISODate(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function arabicShortDate(value: string): string {
  return new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short" }).format(parseISODate(value));
}

export function arabicLongDate(value: string): string {
  return new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long" }).format(parseISODate(value));
}

export function arabicWeekday(value: string): string {
  return new Intl.DateTimeFormat("ar-EG", { weekday: "short" }).format(parseISODate(value));
}

/** «اليوم» · «غدًا» · «بعد 3 أيام» · «متأخر يومين» — honest, local labels. */
export function dueLabel(dueDate: string, today: string = localISODate()): string {
  const delta = daysBetweenISO(today, dueDate);
  if (delta === 0) return "اليوم";
  if (delta === 1) return "غدًا";
  if (delta === -1) return "متأخر يومًا";
  if (delta < -1 && delta >= -10) return `متأخر ${Math.abs(delta)} أيام`;
  if (delta < -10) return `متأخر ${Math.abs(delta)} يومًا`;
  if (delta <= 10) return `بعد ${delta} أيام`;
  return arabicShortDate(dueDate);
}
