import type { PracticePlanItem } from "./api.js";
import { planPageLabel } from "./bookPages.js";

/** PHASE 182 — shared, honest wording for every practice-plan row. */

export const PLAN_HOME_COUNT = 3;

export function trendArrow(trend: PracticePlanItem["trend"]): string {
  return trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
}

export function planPageText(item: PracticePlanItem): string | null {
  return planPageLabel(item.bookPageStart, item.bookPageEnd);
}

export function planReason(item: PracticePlanItem): string {
  if (item.dueForReview) {
    return item.daysSinceLastPractice === 0
      ? "حان وقت مراجعتها اليوم قبل أن تنسى."
      : `مرّ ${item.daysSinceLastPractice} يومًا منذ آخر مراجعة — راجعها قبل أن تنسى.`;
  }
  if (!item.tracked) return "مفهوم من درسك لم تتدرّب عليه بعد.";
  if (item.attempts > 0 && item.correct === 0) {
    return `جرّبتها ${item.attempts === 1 ? "مرة" : `${item.attempts} مرات`} ولم تصب بعد — ابدأ من هنا.`;
  }
  if (item.attempts > 0 && item.correct < item.attempts) {
    return `أصبت ${item.correct} من ${item.attempts} — يحتاج تثبيتًا.`;
  }
  const percent = Math.round(item.decayedMastery * 100);
  if (item.decayedMastery < 0.5) return `إتقانك ${percent}% — خطوة صغيرة ترفعه.`;
  return "حافظ على مستواك — مراجعة قصيرة تكفي.";
}

/** The primary button always practises MCQ; the secondary one is the essay. */
export function needsGeneration(item: PracticePlanItem, mode: "mcq" | "open"): boolean {
  return mode === "mcq" ? item.availableQuestions === 0 : item.openQuestions === 0;
}
