import type { PracticePlanItem } from "./api.js";

/**
 * PHASE 179 — «آخر اختيار» أصبح حقيقة مشتركة: «تعلّم» يكتبها، و«الرئيسية»
 * تقرأها لتبني خطة الأسبوع على المادة التي يعمل عليها الطفل فعلًا — بدل أن
 * تعيد اكتشافها أو تعرض مواد أخرى.
 *
 * المفتاح نفسه منذ PHASE 159 (W3) — لا تهجير ولا فقدان لاختيار قائم.
 */
export const LAST_PICK_KEY = "alfarouq_last_pick";

export interface LastPick {
  subjectId: string;
  unitId: string;
}

/** «آخر اختيار» — أو null عند أول زيارة/تخزين تالف (لا استثناء للواجهة). */
export function readLastPick(): LastPick | null {
  try {
    const raw = localStorage.getItem(LAST_PICK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { subjectId?: unknown; unitId?: unknown };
    if (typeof parsed.subjectId !== "string") return null;
    return { subjectId: parsed.subjectId, unitId: typeof parsed.unitId === "string" ? parsed.unitId : "" };
  } catch {
    return null;
  }
}

export function saveLastPick(pick: LastPick): void {
  try {
    localStorage.setItem(LAST_PICK_KEY, JSON.stringify(pick));
  } catch {
    // التخزين المحلي قد يكون معطّلًا (وضع خاص) — لا يكسر التعلّم.
  }
}

export function clearLastPick(): void {
  try {
    localStorage.removeItem(LAST_PICK_KEY);
  } catch {
    // لا شيء.
  }
}

/**
 * PHASE 179 — أهم خطوة تدريب في خطة الأسبوع: أول مفهوم «مستحق للمراجعة»
 * ولديه سؤال، وإلا أضعف مفهوم عملي. حتمية بالكامل من خطة الخادم المرتّبة.
 */
export function weeklyPracticeItem(plan: PracticePlanItem[]): PracticePlanItem | null {
  const practicable = plan.filter((p) => p.availableQuestions > 0 || p.openQuestions > 0);
  return practicable.find((p) => p.dueForReview) ?? practicable[0] ?? null;
}
