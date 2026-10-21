import type { MasteryConcept } from "../api.js";

/**
 * PHASE 161.1 — «قوة التعلم»: قوة الطالب كرقم حتمي واحد.
 *
 * الرقم يقرأ إشارتين صادقتين فقط: متانة الإتقان نفسه (70%)، ونسبة المفاهيم
 * التي بلغت «متقن» (30%). لا يدخل فيه شيء غير الإتقان الحقيقي — ولا يتغيّر
 * بلا تعلّم. نفس البيانات ⇒ نفس الرقم ونفس المستوى دائمًا (مثبَّت بالاختبارات).
 */

export interface LearningStrength {
  /** 0..100 — الرقم الرئيسي المعروض. */
  score: number;
  /** 1..5 — المستوى الذي يقع فيه الرقم. */
  level: 1 | 2 | 3 | 4 | 5;
  levelNameAr: string;
  /** عتبة المستوى القادم، أو null عند القمة. */
  nextLevelAt: number | null;
  /** المفاهيم عند «متقن». */
  mastered: number;
  /** المفاهيم التي جرّبها الطالب فعلًا (لها محاولات). */
  practiced: number;
}

/** عتبات المستويات — خمس درجات صاعدة حتى «القمة». */
export const STRENGTH_LEVELS: ReadonlyArray<{ min: number; name: string }> = [
  { min: 0, name: "بداية" },
  { min: 20, name: "تقدّم" },
  { min: 40, name: "صعود" },
  { min: 60, name: "إتقان" },
  { min: 80, name: "القمة" },
];

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(Math.max(n, 0), 1) : 0);

export function learningStrength(mastery: MasteryConcept[]): LearningStrength {
  const n = mastery.length;
  if (n === 0) {
    return {
      score: 0,
      level: 1,
      levelNameAr: STRENGTH_LEVELS[0]!.name,
      nextLevelAt: STRENGTH_LEVELS[1]!.min,
      mastered: 0,
      practiced: 0,
    };
  }
  const avg = mastery.reduce((sum, m) => sum + clamp01(m.decayedMastery), 0) / n;
  const mastered = mastery.filter((m) => m.level === "mastered").length;
  const practiced = mastery.filter((m) => m.attempts > 0).length;
  const score = Math.round((avg * 0.7 + (mastered / n) * 0.3) * 100);
  let level = 1;
  for (let i = STRENGTH_LEVELS.length - 1; i >= 0; i -= 1) {
    if (score >= STRENGTH_LEVELS[i]!.min) {
      level = i + 1;
      break;
    }
  }
  return {
    score,
    level: level as LearningStrength["level"],
    levelNameAr: STRENGTH_LEVELS[level - 1]!.name,
    nextLevelAt: level < STRENGTH_LEVELS.length ? STRENGTH_LEVELS[level]!.min : null,
    mastered,
    practiced,
  };
}

/**
 * 0..1 — مَسير الرقم داخل مستواه الحالي نحو العتبة القادمة (للشريط أسفل
 * «قوة التعلم»). عند القمة يعود 1 — لا وعد بما هو أبعد منها.
 */
export function strengthProgress(s: LearningStrength): number {
  if (s.nextLevelAt === null) return 1;
  const floor = STRENGTH_LEVELS[s.level - 1]!.min;
  const span = s.nextLevelAt - floor;
  if (span <= 0) return 1;
  return clamp01((s.score - floor) / span);
}
