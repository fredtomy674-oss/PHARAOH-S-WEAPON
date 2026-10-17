import { describe, expect, it } from "vitest";
import type { ParentWeeklyReport } from "../../src/modules/parent/weeklyReport.js";
import {
  buildHelpPlan,
  buildTeacherMessage,
  type WeakConceptHint,
} from "../../src/modules/parent/teacherMessage.js";

/**
 * PHASE 163 (W9) — «رسالة المعلّم» + «كيف أساعد ابني هذا الأسبوع؟».
 * كل الجمل تُولَّد من حقول تقرير الأسبوع وحدها (أعداد وعناوين ودقة)، فهي
 * حتمية بلا ساعة ولا قاعدة بيانات — ويُثبَّت نصّها هنا حرفيًا.
 */

type ReportFacts = Omit<ParentWeeklyReport, "child" | "window">;

function baseFacts(overrides: Partial<ReportFacts> = {}): ReportFacts {
  return {
    activity: { sessions: 0, studyMinutes: 0, activeDays: 0, studentMessages: 0, tutorMessages: 0 },
    streak: { currentDays: 0, daysThisWeek: 0 },
    focus: { practiced: [], improving: [], needsWork: [] },
    masteryLevels: { strong: 0, developing: 0, weak: 0 },
    headline: "—",
    highlights: [],
    parentActions: [],
    ...overrides,
  };
}

/** One focus concept as the report would carry it. */
function concept(title: string, accuracy: number, attempts = 4) {
  return {
    conceptId: `c-${title}`,
    title,
    attempts,
    correct: Math.round(accuracy * attempts),
    accuracy,
    mastery: null,
    labelAr: null,
  };
}

describe("teacher weekly message — pure and deterministic (PHASE 163)", () => {
  it("an active week speaks in real numbers: sessions, streak, then improvement", () => {
    const facts = baseFacts({
      activity: { sessions: 3, studyMinutes: 75, activeDays: 3, studentMessages: 9, tutorMessages: 9 },
      streak: { currentDays: 3, daysThisWeek: 3 },
      focus: {
        practiced: [concept("مقارنة الكسور", 0.9)],
        improving: [concept("مقارنة الكسور", 0.9)],
        needsWork: [],
      },
    });

    const message = buildTeacherMessage("سارة", facts, []);
    expect(message.achieved).toEqual([
      "درس سارة 3 جلسات بإجمالي 75 دقيقة على مدار 3 أيام.",
      "واصل التعلّم 3 أيام على التوالي.",
      "تحسّن واضح في «مقارنة الكسور» هذا الأسبوع.",
    ]);
    // أسبوع نشِط نظيف: لا نقطة قلق مصطنعة.
    expect(message.attention).toBeNull();
    expect(message.step).toBe("حافظوا على السلسلة: جلسة قصيرة كل يوم أفضل من جلسة طويلة متقطعة.");
  });

  it("an empty week is quiet and honest — no fabricated achievements", () => {
    const message = buildTeacherMessage("رامي", baseFacts(), []);

    expect(message.achieved).toEqual([]);
    expect(message.attention).toBe("لم يبدأ رامي أي نشاط هذا الأسبوع بعد.");
    expect(message.step).toBe("شجّعوا رامي على جلسة قصيرة (١٠ دقائق) من الصفحة الرئيسية اليوم.");
  });

  it("a single session reads naturally: «جلسة واحدة» وبلا «على مدار»", () => {
    const facts = baseFacts({
      activity: { sessions: 1, studyMinutes: 12, activeDays: 1, studentMessages: 2, tutorMessages: 2 },
      streak: { currentDays: 1, daysThisWeek: 1 },
    });

    const message = buildTeacherMessage("عمر", facts, []);
    expect(message.achieved).toEqual(["درس عمر جلسة واحدة بإجمالي 12 دقيقة."]);
  });

  it("needsWork wins the attention line — with its real accuracy", () => {
    const facts = baseFacts({
      activity: { sessions: 0, studyMinutes: 0, activeDays: 0, studentMessages: 0, tutorMessages: 0 },
      focus: {
        practiced: [concept("طرح الكسور", 0.5)],
        improving: [],
        needsWork: [concept("طرح الكسور", 0.5)],
      },
    });

    const message = buildTeacherMessage("عمر", facts, []);
    expect(message.achieved).toEqual(["أنجز عمر تدريبات على مفهوم واحد هذا الأسبوع."]);
    expect(message.attention).toBe("«طرح الكسور» يحتاج مراجعة — دقّته 50٪ هذا الأسبوع.");
    expect(message.step).toBe("راجعوا «طرح الكسور» مع عمر ١٥ دقيقة — حلّا معًا مثالًا واحدًا ثم اطلبوا منه شرحه.");
  });

  it("counts in proper Arabic: واحد · مثنى · جمع القلة · 11+ مفرد منصوب", () => {
    const line = (sessions: number, studyMinutes: number) =>
      buildTeacherMessage(
        "نور",
        baseFacts({
          activity: { sessions, studyMinutes, activeDays: 1, studentMessages: 1, tutorMessages: 1 },
        }),
        [],
      ).achieved[0];

    expect(line(1, 5)).toBe("درس نور جلسة واحدة بإجمالي 5 دقائق.");
    expect(line(2, 2)).toBe("درس نور جلستان بإجمالي دقيقتين.");
    expect(line(3, 7)).toBe("درس نور 3 جلسات بإجمالي 7 دقائق.");
    expect(line(14, 75)).toBe("درس نور 14 جلسة بإجمالي 75 دقيقة.");
  });

  it("when the week is clean but a tracked concept lags, attention falls back to it", () => {
    const facts = baseFacts({
      activity: { sessions: 2, studyMinutes: 40, activeDays: 2, studentMessages: 4, tutorMessages: 4 },
      streak: { currentDays: 2, daysThisWeek: 2 },
      focus: { practiced: [concept("الهمزة المتوسطة", 0.8)], improving: [], needsWork: [] },
    });
    const weak: WeakConceptHint[] = [{ title: "الهمزة المتوسطة", mastery: 0.31, labelAr: "مبتدئ" }];

    const message = buildTeacherMessage("ليلى", facts, weak);
    expect(message.attention).toBe("«الهمزة المتوسطة» ما زال بمستوى «مبتدئ» في خريطة الإتقان — مراجعة قصيرة تكفي.");
  });

  it("achievement lines stop at three and follow the same order every time", () => {
    const facts = baseFacts({
      activity: { sessions: 5, studyMinutes: 90, activeDays: 4, studentMessages: 12, tutorMessages: 12 },
      streak: { currentDays: 4, daysThisWeek: 4 },
      focus: {
        practiced: [concept("ة", 1), concept("ب", 1)],
        improving: [concept("ة", 1), concept("ب", 1)],
        needsWork: [],
      },
    });

    const message = buildTeacherMessage("سلمى", facts, []);
    expect(message.achieved).toHaveLength(3);
    expect(message.achieved[0]).toContain("درس سلمى");
    expect(message.achieved[1]).toContain("واصل التعلّم");
    expect(message.achieved[2]).toContain("تحسّن واضح");
  });
});

describe("parent help plan — always three concrete steps (PHASE 163)", () => {
  it("an empty week starts with a short session and still fills three steps", () => {
    const plan = buildHelpPlan("رامي", baseFacts(), []);

    expect(plan).toHaveLength(3);
    expect(plan[0]!.title).toBe("ابدأوا اليوم بجلسة قصيرة");
    expect(plan[0]!.detail).toContain("رامي");
    for (const step of plan) {
      expect(step.minutes).toBeGreaterThan(0);
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.detail.length).toBeGreaterThan(0);
    }
  });

  it("a hard week leads with the weakest concept and points at the real «أخطاء شائعة» tab", () => {
    const facts = baseFacts({
      activity: { sessions: 1, studyMinutes: 20, activeDays: 1, studentMessages: 3, tutorMessages: 3 },
      streak: { currentDays: 1, daysThisWeek: 1 },
      focus: {
        practiced: [concept("مقارنة الكسور", 0.4)],
        improving: [],
        needsWork: [concept("مقارنة الكسور", 0.4)],
      },
    });

    const plan = buildHelpPlan("عمر", facts, []);
    expect(plan).toHaveLength(3);
    expect(plan[0]!.title).toBe("راجعوا «مقارنة الكسور» معه");
    expect(plan[0]!.detail).toContain("40٪");
    expect(plan[0]!.detail).toContain("أخطاء شائعة");
    expect(plan[0]!.minutes).toBe(15);
  });

  it("never repeats the same concept title across steps — fillers take the empty slot", () => {
    const facts = baseFacts({
      activity: { sessions: 1, studyMinutes: 20, activeDays: 1, studentMessages: 3, tutorMessages: 3 },
      streak: { currentDays: 1, daysThisWeek: 1 },
      focus: {
        practiced: [concept("مقارنة الكسور", 0.4)],
        improving: [],
        needsWork: [concept("مقارنة الكسور", 0.4)],
      },
    });
    const weak: WeakConceptHint[] = [{ title: "مقارنة الكسور", mastery: 0.3, labelAr: "مبتدئ" }];

    const plan = buildHelpPlan("عمر", facts, weak);
    expect(plan).toHaveLength(3);
    const withTitle = plan.filter((s) => s.title.includes("مقارنة الكسور"));
    expect(withTitle).toHaveLength(1);
  });

  it("a keeping-the-streak week celebrates it without inventing problems", () => {
    const facts = baseFacts({
      activity: { sessions: 3, studyMinutes: 45, activeDays: 3, studentMessages: 6, tutorMessages: 6 },
      streak: { currentDays: 3, daysThisWeek: 3 },
      focus: { practiced: [], improving: [], needsWork: [] },
    });

    const plan = buildHelpPlan("ليلى", facts, []);
    expect(plan).toHaveLength(3);
    expect(plan[0]!.title).toBe("حافظوا على السلسلة");
    expect(plan[0]!.detail).toContain("3 أيام");
  });

  it("same facts, same message — twice (determinism)", () => {
    const facts = baseFacts({
      activity: { sessions: 2, studyMinutes: 30, activeDays: 2, studentMessages: 4, tutorMessages: 4 },
      streak: { currentDays: 2, daysThisWeek: 2 },
      focus: {
        practiced: [concept("الجمع مع التجميع", 0.9), concept("مقارنة الكسور", 0.4)],
        improving: [concept("الجمع مع التجميع", 0.9)],
        needsWork: [concept("مقارنة الكسور", 0.4)],
      },
    });
    const weak: WeakConceptHint[] = [{ title: "الهمزة المتوسطة", mastery: 0.35, labelAr: "مبتدئ" }];

    expect(JSON.stringify(buildTeacherMessage("سارة", facts, weak))).toBe(JSON.stringify(buildTeacherMessage("سارة", facts, weak)));
    expect(JSON.stringify(buildHelpPlan("سارة", facts, weak))).toBe(JSON.stringify(buildHelpPlan("سارة", facts, weak)));
  });
});
