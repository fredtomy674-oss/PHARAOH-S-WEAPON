import type { MasteryConcept } from "../api.js";

/**
 * PHASE 161.1 — «أهدافي الآن»: حتى ثلاثة أهداف تدفع الطالب للخطوة القادمة.
 *
 * هدف إتقان واحد (العلامة التالية من مضاعفات الثلاثة) + أضعف مفهومين، وكل
 * هدف مفهوم معه زر «تدرّب الآن» يفتح تمرينًا مقيّدًا بمفهومه نفسه. كل شيء
 * محسوب من بيانات الإتقان الحقيقية فقط — بلا وعود ولا أرقام مُتخيَّلة.
 * دالّة نقية حتمية: نفس الإتقان ⇒ نفس الأهداف بالضبط (مثبَّت بالاختبارات).
 */

export type GoalKind = "milestone" | "concept";

export interface LearningGoal {
  id: string;
  kind: GoalKind;
  title: string;
  detail: string;
  /** 0..1 — كم تحقّق من الهدف حتى الآن. */
  progress: number;
  /** هدف المفهوم فقط: المفهوم الذي يفتحه زر التمرين. */
  conceptId?: string;
  conceptTitle?: string;
}

/** المعالم تتسلّق بالثلاثة: 3 ← 6 ← 9… */
export const MILESTONE_STEP = 3;

/** أهداف المفهوم المعروضة (بعد هدف الإتقان) — هدفان لا أكثر. */
export const MAX_CONCEPT_GOALS = 2;

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(Math.max(n, 0), 1) : 0);

export function nextGoals(mastery: MasteryConcept[]): LearningGoal[] {
  if (mastery.length === 0) return [];

  const mastered = mastery.filter((m) => m.level === "mastered").length;
  const target = (Math.floor(mastered / MILESTONE_STEP) + 1) * MILESTONE_STEP;
  const goals: LearningGoal[] = [
    {
      id: `milestone-${target}`,
      kind: "milestone",
      title: `أتقن ${target} مفاهيم`,
      detail: `متقن حتى الآن: ${mastered} — بقي ${target - mastered} حتى العلامة التالية.`,
      progress: clamp01(mastered / target),
    },
  ];

  const weakest = mastery
    .filter((m) => m.level !== "mastered")
    .sort((a, b) => a.decayedMastery - b.decayedMastery || (a.conceptId < b.conceptId ? -1 : 1))
    .slice(0, MAX_CONCEPT_GOALS);

  for (const m of weakest) {
    goals.push({
      id: `concept-${m.conceptId}`,
      kind: "concept",
      title: `قوِّ «${m.title}»`,
      detail: `إتقانه الآن ${Math.round(clamp01(m.decayedMastery) * 100)}% — تمرين واحد يرفعه خطوة.`,
      progress: clamp01(m.decayedMastery),
      conceptId: m.conceptId,
      conceptTitle: m.title,
    });
  }

  return goals;
}
