/**
 * PHASE 93 — the parent's weekly digest (Faheem-inspired periodic parent update).
 *
 * A parent does not open the dashboard every day; the value of the product to a
 * parent is a short, honest, Arabic summary of what actually happened this week
 * and what to do about it. This module is deliberately PURE: it takes numbers
 * already gathered from the DB (sessions, assessments, concept metadata) and
 * decides the headline, the highlights and the suggested actions. Keeping it
 * pure makes the period logic (windows, streaks, accuracy, ordering) unit
 * testable without a database, and keeps the service a thin query layer.
 *
 * Privacy: like every other parent read, this surface is derived from metadata
 * only — session timestamps, assessment outcomes and concept titles. Message
 * CONTENT never enters this module, so it cannot leak by construction.
 */

/** One focus concept the child actually answered in the window. */
export interface WeeklyFocusConcept {
  conceptId: string;
  title: string;
  attempts: number;
  correct: number;
  /** correct / attempts, rounded to 2 decimals. */
  accuracy: number;
  /** Current persisted mastery (0..1) for context, or null if untracked. */
  mastery: number | null;
  /** Arabic mastery label, when known. */
  labelAr: string | null;
}

export interface ParentWeeklyReport {
  child: {
    studentId: string;
    displayName: string;
    gradeNameAr: string | null;
  };
  /** Half-open window [from, to); `days` is the window length in days. */
  window: { from: Date; to: Date; days: number };
  activity: {
    sessions: number;
    studyMinutes: number;
    activeDays: number;
    studentMessages: number;
    tutorMessages: number;
  };
  streak: {
    /** Consecutive calendar days (ending today or yesterday) with a session. */
    currentDays: number;
    /** Distinct days studied inside the window. */
    daysThisWeek: number;
  };
  focus: {
    /** Every concept answered at least once in the window, hardest first. */
    practiced: WeeklyFocusConcept[];
    /** Subset that went well (accuracy ≥ 0.75 and at least 2 attempts). */
    improving: WeeklyFocusConcept[];
    /** Subset that needs support (accuracy < 0.6), weakest first. */
    needsWork: WeeklyFocusConcept[];
  };
  /** How many of the child's tracked concepts sit at each mastery level. */
  masteryLevels: { strong: number; developing: number; weak: number };
  /** A one-line Arabic summary the parent can read at a glance. */
  headline: string;
  /** 2–4 Arabic bullet statements, most important first. */
  highlights: string[];
  /** 1–3 concrete Arabic suggestions for the parent. */
  parentActions: string[];
}

export interface WeeklyReportInput {
  now: Date;
  childName: string;
  /** Sessions that STARTED inside the window. */
  weekSessions: Array<{ startedAt: Date; endedAt: Date | null; durationMinutes: number }>;
  /** Student/tutor message counts across the window's sessions. */
  weekMessages: { studentMessages: number; tutorMessages: number };
  /** Every session start the child has ever had (for the streak). */
  allSessionStarts: Date[];
  /** Assessments recorded inside the window. */
  weekAssessments: Array<{ conceptId: string; correct: boolean }>;
  /** conceptId → { title, mastery, labelAr } for concepts in the window. */
  concepts: Map<string, { title: string; mastery: number | null; labelAr: string | null }>;
  /** All tracked concepts with a current mastery, for the level tally. */
  masterySummary: Array<{ mastery: number }>;
  days: number;
}

/** Whole-day ordinal for a Date using its LOCAL calendar day (timezone-stable). */
export function calendarDayIndex(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/**
 * Consecutive calendar days with at least one session, ending today — or
 * yesterday, so a streak is not "broken" simply because the child has not yet
 * studied today. Returns 0 when neither today nor yesterday was studied.
 */
export function computeCurrentStreak(dayIndices: Iterable<number>, now: Date): number {
  const days = new Set(dayIndices);
  const today = calendarDayIndex(now);
  let cursor = days.has(today) ? today : days.has(today - 1) ? today - 1 : null;
  if (cursor === null) return 0;
  let length = 0;
  while (days.has(cursor)) {
    length += 1;
    cursor -= 1;
  }
  return length;
}

/** A concept's accuracy this week, ordered hardest-first then by title. */
function focusOrder(a: WeeklyFocusConcept, b: WeeklyFocusConcept): number {
  if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
  return a.title.localeCompare(b.title, "ar");
}

/** Join Arabic titles for a short, readable list («أ»، «ب» و«ج»). */
function arabicList(titles: string[], max = 3): string {
  const shown = titles.slice(0, max);
  const quoted = shown.map((t) => `«${t}»`);
  if (quoted.length <= 1) return quoted[0] ?? "";
  return `${quoted.slice(0, -1).join("، ")} و${quoted[quoted.length - 1]}`;
}

/**
 * Turn the week's raw facts into the display-ready digest. Pure and
 * deterministic: the same input always yields the same Arabic narrative.
 */
export function buildWeeklyReport(input: WeeklyReportInput): Omit<ParentWeeklyReport, "child" | "window"> {
  const { now, childName, weekSessions, weekMessages, allSessionStarts, weekAssessments, concepts, days } = input;

  const sessions = weekSessions.length;
  const studyMinutes = Math.max(0, Math.round(weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0)));
  const weekDays = new Set(weekSessions.map((s) => calendarDayIndex(s.startedAt)));
  const activeDays = weekDays.size;
  const streakDays = computeCurrentStreak(allSessionStarts.map(calendarDayIndex), now);

  // Group the window's assessment outcomes per concept.
  const tally = new Map<string, { attempts: number; correct: number }>();
  for (const a of weekAssessments) {
    const t = tally.get(a.conceptId) ?? { attempts: 0, correct: 0 };
    t.attempts += 1;
    if (a.correct) t.correct += 1;
    tally.set(a.conceptId, t);
  }
  const practiced: WeeklyFocusConcept[] = [...tally.entries()].map(([conceptId, t]) => {
    const meta = concepts.get(conceptId);
    return {
      conceptId,
      title: meta?.title ?? "مفهوم",
      attempts: t.attempts,
      correct: t.correct,
      accuracy: Math.round((t.correct / t.attempts) * 100) / 100,
      mastery: meta?.mastery ?? null,
      labelAr: meta?.labelAr ?? null,
    };
  });
  practiced.sort(focusOrder);

  const improving = practiced.filter((c) => c.attempts >= 2 && c.accuracy >= 0.75);
  const needsWork = practiced.filter((c) => c.accuracy < 0.6);

  const masteryLevels = { strong: 0, developing: 0, weak: 0 };
  for (const m of input.masterySummary) {
    if (m.mastery >= 0.75) masteryLevels.strong += 1;
    else if (m.mastery >= 0.4) masteryLevels.developing += 1;
    else masteryLevels.weak += 1;
  }

  const highlights: string[] = [];
  const parentActions: string[] = [];
  const hasMessages = weekMessages.studentMessages + weekMessages.tutorMessages > 0;
  const hasActivity = sessions > 0 || practiced.length > 0 || hasMessages;
  let headline: string;

  if (!hasActivity) {
    headline = `لا توجد جلسات لـ${childName} هذا الأسبوع بعد`;
    highlights.push(`لم يبدأ ${childName} أي جلسة في آخر ${days} أيام.`);
    parentActions.push(`شجّعوا ${childName} على جلسة قصيرة (١٠ دقائق) من الصفحة الرئيسية.`);
  } else {
    headline = needsWork.length > 0 ? `أسبوع نشِط — وهناك نقاط تحتاج دعمًا` : `أسبوع تعلّم جيد لـ${childName}`;
    if (sessions > 0) {
      highlights.push(`درس ${childName} ${sessions} جلسة بإجمالي ${studyMinutes} دقيقة على مدار ${activeDays} يوم.`);
    } else {
      highlights.push(`أنجز ${childName} تدريبات على ${practiced.length} مفاهيم خلال آخر ${days} أيام.`);
    }
  }

  if (streakDays >= 2) {
    highlights.push(`واصل التعلّم ${streakDays} أيام متتالية — استمروا على هذا الإيقاع.`);
    parentActions.push("حافظوا على السلسلة: جلسة قصيرة كل يوم أفضل من جلسة طويلة متقطعة.");
  }

  if (improving.length > 0) {
    highlights.push(`تحسّن واضح في ${arabicList(improving.map((c) => c.title))}.`);
  }
  if (needsWork.length > 0) {
    highlights.push(`يحتاج دعمًا في ${arabicList(needsWork.map((c) => c.title))}.`);
    for (const c of needsWork.slice(0, 2)) {
      parentActions.push(`خصّصوا ١٥ دقيقة لمراجعة «${c.title}» مع ${childName}.`);
    }
  }

  if (sessions > 0 && practiced.length === 0) {
    highlights.push("لا توجد إجابات تدريبية مسجّلة هذا الأسبوع — شجّعوه على تمارين الدرس.");
    parentActions.push("اطلبوا من الطالب حل تمرين واحد بعد كل درس لقياس الفهم.");
  }

  if (hasActivity && parentActions.length === 0) {
    parentActions.push(`اطلبوا من ${childName} أن يشرح لكم ما تعلّمه اليوم بصوته.`);
  }

  return {
    activity: {
      sessions,
      studyMinutes,
      activeDays,
      studentMessages: weekMessages.studentMessages,
      tutorMessages: weekMessages.tutorMessages,
    },
    streak: { currentDays: streakDays, daysThisWeek: activeDays },
    focus: { practiced, improving, needsWork },
    masteryLevels,
    headline,
    highlights: highlights.slice(0, 4),
    parentActions: parentActions.slice(0, 3),
  };
}
