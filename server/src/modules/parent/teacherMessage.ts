/**
 * PHASE 163 (W9) — «رسالة المعلّم» الأسبوعية + «كيف أساعد ابني هذا الأسبوع؟».
 *
 * A parent does not want a telemetry dump; they want a short human message:
 * what the child achieved, the one point worth a look, and a single concrete
 * step. This module turns the ALREADY-BUILT weekly report (numbers, concept
 * titles, accuracy — never message content) into that message plus three
 * deterministic help steps.
 *
 * Purity matters twice here:
 *  - Determinism: same report in ⇒ same Arabic out (unit-pinned, no clock).
 *  - Privacy: the input type is the report payload, which by construction
 *    carries no message content — so the message cannot leak it.
 */
import type { ParentWeeklyReport } from "./weeklyReport.js";

/** «رسالة المعلّم» — ملخّص بشري موجز من بيانات التقرير. */
export interface TeacherWeeklyMessage {
  /** إنجاز الأسبوع — حتى ثلاثة أسطر صادقة (فارغة في أسبوع بلا نشاط). */
  achieved: string[];
  /** نقطة واحدة تحتاج نظرة، أو null عندما لا يوجد ما يستدعي قلقًا. */
  attention: string | null;
  /** خطوة واحدة عملية لهذا الأسبوع. */
  step: string;
}

/** خطوة عملية واحدة في «كيف أساعد؟». */
export interface ParentHelpStep {
  title: string;
  detail: string;
  /** الوقت المقترح بالدقائق. */
  minutes: number;
}

/**
 * PHASE 163 — مفهوم متعثر في خريطة الإتقان (حتى لو لم يُجب عنه هذا الأسبوع)،
 * من `masterySummary` الحقيقي: أدنى إتقان متدهور أولًا.
 */
export interface WeakConceptHint {
  title: string;
  /** mastery بعد الانحدار (0..1). */
  mastery: number;
  labelAr: string | null;
}

/** التقرير الأسبوعي + الطبقة البشرية الجديدة (PHASE 163). */
export interface ParentWeeklyDigest extends ParentWeeklyReport {
  teacherMessage: TeacherWeeklyMessage;
  helpPlan: ParentHelpStep[];
}

/** حقائق الأسبوع بلا مظروف الواجهة — نفس مدخلات `buildWeeklyReport`. */
type ReportFacts = Omit<ParentWeeklyReport, "child" | "window">;

/** نسبة مئوية مقرّبة — يُبنى عليها كل ذكر للأرقام في الرسالة. */
function pct(x: number): number {
  return Math.round(x * 100);
}

/** «يوم واحد» · «يومين» · «3 أيام» · «14 يومًا» — عربية سليمة لكل عدد. */
function daysLabel(n: number): string {
  if (n === 1) return "يوم واحد";
  if (n === 2) return "يومين";
  if (n <= 10) return `${n} أيام`;
  return `${n} يومًا`;
}

/** «جلسة واحدة» · «جلستان» · «3 جلسات» · «14 جلسة». */
function sessionsCount(n: number): string {
  if (n === 1) return "جلسة واحدة";
  if (n === 2) return "جلستان";
  if (n <= 10) return `${n} جلسات`;
  return `${n} جلسة`;
}

/** «دقيقة واحدة» · «دقيقتين» · «7 دقائق» · «75 دقيقة». */
function minutesCount(n: number): string {
  if (n === 1) return "دقيقة واحدة";
  if (n === 2) return "دقيقتين";
  if (n <= 10) return `${n} دقائق`;
  return `${n} دقيقة`;
}

/** «مفهوم واحد» · «مفهومين» · «3 مفاهيم» · «14 مفهومًا». */
function conceptsCount(n: number): string {
  if (n === 1) return "مفهوم واحد";
  if (n === 2) return "مفهومين";
  if (n <= 10) return `${n} مفاهيم`;
  return `${n} مفهومًا`;
}

/** Join Arabic titles for a short, readable list («أ»، «ب» و«ج»). */
function arabicList(titles: string[], max = 2): string {
  const quoted = titles.slice(0, max).map((t) => `«${t}»`);
  if (quoted.length <= 1) return quoted[0] ?? "";
  return `${quoted.slice(0, -1).join("، ")} و${quoted[quoted.length - 1]}`;
}

/** هل وقع أي شيء هذا الأسبوع أصلًا؟ (نشاط، تدريب، أو محادثة مسجّلة) */
function weekHasActivity(report: ReportFacts): boolean {
  return (
    report.activity.sessions > 0 ||
    report.focus.practiced.length > 0 ||
    report.activity.studentMessages + report.activity.tutorMessages > 0
  );
}

/**
 * «رسالة المعلّم»: أنجز… · يحتاج نظرة… · خطوة واحدة.
 * حتمية بالكامل — كل جملة تُتركّب من حقول التقرير وحدها.
 */
export function buildTeacherMessage(childName: string, report: ReportFacts, weakConcepts: WeakConceptHint[]): TeacherWeeklyMessage {
  const { activity, streak, focus } = report;
  const hasActivity = weekHasActivity(report);

  // ------------------------------ أنجز ------------------------------
  const achieved: string[] = [];
  if (hasActivity) {
    if (activity.sessions > 0) {
      const across = activity.activeDays > 1 ? ` على مدار ${daysLabel(activity.activeDays)}` : "";
      achieved.push(`درس ${childName} ${sessionsCount(activity.sessions)} بإجمالي ${minutesCount(activity.studyMinutes)}${across}.`);
    } else if (focus.practiced.length > 0) {
      achieved.push(`أنجز ${childName} تدريبات على ${conceptsCount(focus.practiced.length)} هذا الأسبوع.`);
    }
    if (streak.currentDays >= 2) {
      achieved.push(`واصل التعلّم ${daysLabel(streak.currentDays)} على التوالي.`);
    }
    if (focus.improving.length > 0) {
      achieved.push(`تحسّن واضح في ${arabicList(focus.improving.map((c) => c.title))} هذا الأسبوع.`);
    }
  }

  // --------------------------- يحتاج نظرة ---------------------------
  let attention: string | null = null;
  if (!hasActivity) {
    attention = `لم يبدأ ${childName} أي نشاط هذا الأسبوع بعد.`;
  } else if (focus.needsWork.length > 0) {
    const c = focus.needsWork[0]!;
    attention = `«${c.title}» يحتاج مراجعة — دقّته ${pct(c.accuracy)}٪ هذا الأسبوع.`;
  } else if (weakConcepts.length > 0) {
    const w = weakConcepts[0]!;
    attention = `«${w.title}» ما زال بمستوى «${w.labelAr ?? "يحتاج تثبيتًا"}» في خريطة الإتقان — مراجعة قصيرة تكفي.`;
  }

  // --------------------------- خطوة واحدة ---------------------------
  let step: string;
  if (!hasActivity) {
    step = `شجّعوا ${childName} على جلسة قصيرة (١٠ دقائق) من الصفحة الرئيسية اليوم.`;
  } else if (focus.needsWork.length > 0) {
    step = `راجعوا «${focus.needsWork[0]!.title}» مع ${childName} ١٥ دقيقة — حلّا معًا مثالًا واحدًا ثم اطلبوا منه شرحه.`;
  } else if (streak.currentDays >= 2) {
    step = "حافظوا على السلسلة: جلسة قصيرة كل يوم أفضل من جلسة طويلة متقطعة.";
  } else if (focus.improving.length > 0) {
    step = `اطلبوا من ${childName} شرح «${focus.improving[0]!.title}» بصوته — الشرح للغير يثبّت الفهم.`;
  } else {
    step = `اسألوا ${childName} ماذا تعلّم اليوم — خمس دقائق من الحوار تكفي.`;
  }

  return { achieved: achieved.slice(0, 3), attention, step };
}

/**
 * «كيف أساعد ابني هذا الأسبوع؟» — ثلاث خطوات عملية بالضبط، حتمية من بيانات
 * الأسبوع + أضعف المفاهيم المسجّلة. عند نقص البيانات تُكمَّل الخطوات بعادات
 * صادقة عامة (سؤال يومي · تمرين قصير) — لا وعود فارغة ولا إحصاءات مخترعة.
 */
export function buildHelpPlan(childName: string, report: ReportFacts, weakConcepts: WeakConceptHint[]): ParentHelpStep[] {
  const { streak, focus } = report;
  const hasActivity = weekHasActivity(report);
  const steps: ParentHelpStep[] = [];
  const usedTitles = new Set<string>();

  const push = (s: ParentHelpStep) => {
    if (steps.length < 3) steps.push(s);
  };

  if (!hasActivity) {
    push({
      title: "ابدأوا اليوم بجلسة قصيرة",
      detail: `افتحوا الصفحة الرئيسية مع ${childName} واختاروا أول درس — عشر دقائق تكفي لكسر التوقف.`,
      minutes: 10,
    });
  }

  const needs = focus.needsWork[0];
  if (needs) {
    usedTitles.add(needs.title);
    push({
      title: `راجعوا «${needs.title}» معه`,
      detail: `دقّته ${pct(needs.accuracy)}٪ هذا الأسبوع — افتحوا الدرس معًا وراجعوا تبويب «أخطاء شائعة» عشر دقائق.`,
      minutes: 15,
    });
  }

  if (streak.currentDays >= 2) {
    push({
      title: "حافظوا على السلسلة",
      detail: `واصل ${childName} ${daysLabel(streak.currentDays)} على التوالي — جلسة قصيرة اليوم تحفظ الإيقاع.`,
      minutes: 10,
    });
  }

  const improving = focus.improving[0];
  if (improving) {
    usedTitles.add(improving.title);
    push({
      title: `احتفلوا بتقدّم «${improving.title}»`,
      detail: "اطلبوا منه شرح ما تعلّمه بصوته — الاعتراف بالتقدّم مع الشرح للغير يثبّتان الإتقان.",
      minutes: 5,
    });
  }

  const weak = weakConcepts[0];
  if (weak && !usedTitles.has(weak.title)) {
    usedTitles.add(weak.title);
    push({
      title: `ثبّتوا «${weak.title}»`,
      detail: `مستواه «${weak.labelAr ?? "يحتاج تثبيتًا"}» في خريطة الإتقان — راجعوا أمثلة الدرس ثم دعوه يحلّ تمرينًا وحده.`,
      minutes: 10,
    });
  }

  // عادات صادقة تكمل الخطوات الثلاث عند شحّ البيانات.
  push({
    title: "سؤال يومي واحد",
    detail: `اسألوا ${childName} كل يوم: «ماذا تعلّمت اليوم؟» — الاسترجاع من الذاكرة يثبّت المعلومة.`,
    minutes: 5,
  });
  push({
    title: "تمرين إتقان قصير",
    detail: "تمرين واحد قصير يوميًا أفضل من مراجعة طويلة متقطعة — من «أهدافي الآن» في رحلته.",
    minutes: 10,
  });
  push({
    title: "طقس مذاكرة ثابت",
    detail: `حددوا وقتًا يوميًا ثابتًا لـ${childName} — الثبات أهم من الطول.`,
    minutes: 10,
  });

  return steps.slice(0, 3);
}
