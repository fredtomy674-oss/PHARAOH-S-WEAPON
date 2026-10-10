import { describe, expect, it } from "vitest";
import {
  buildWeeklyReport,
  calendarDayIndex,
  computeCurrentStreak,
  type WeeklyReportInput,
} from "../../src/modules/parent/weeklyReport.js";

/**
 * PHASE 93 — the pure half of the parent's weekly digest. All the period math
 * (window totals, active days, streaks, accuracy bands, ordering and the
 * deterministic Arabic narrative) is decided here, so it can be pinned without
 * a database or a clock.
 */

const NOW = new Date(2026, 0, 15, 12, 0, 0); // Thu 15 Jan 2026, local noon

function baseInput(overrides: Partial<WeeklyReportInput> = {}): WeeklyReportInput {
  return {
    now: NOW,
    childName: "سارة",
    weekSessions: [],
    weekMessages: { studentMessages: 0, tutorMessages: 0 },
    allSessionStarts: [],
    weekAssessments: [],
    concepts: new Map(),
    masterySummary: [],
    days: 7,
    ...overrides,
  };
}

describe("parent weekly digest — pure aggregation (PHASE 93)", () => {
  it("sums study minutes and counts distinct active days", () => {
    const report = buildWeeklyReport(
      baseInput({
        weekSessions: [
          { startedAt: new Date(2026, 0, 15, 9, 0), endedAt: null, durationMinutes: 12.4 },
          { startedAt: new Date(2026, 0, 15, 18, 0), endedAt: null, durationMinutes: 7.6 },
          { startedAt: new Date(2026, 0, 13, 10, 0), endedAt: null, durationMinutes: 20 },
        ],
      }),
    );
    expect(report.activity.sessions).toBe(3);
    expect(report.activity.studyMinutes).toBe(40);
    // 15 Jan twice + 13 Jan once = two distinct days.
    expect(report.activity.activeDays).toBe(2);
    expect(report.streak.daysThisWeek).toBe(2);
  });

  it("computes a current streak that may end today or yesterday", () => {
    const day = (d: number, h = 10) => new Date(2026, 0, d, h, 0, 0);
    const days = (...ds: number[]) => ds.map((d) => calendarDayIndex(day(d)));
    // Studying today, yesterday and the day before → a 3-day streak.
    expect(computeCurrentStreak(days(15, 14, 13), NOW)).toBe(3);
    // A streak ending yesterday still counts until today is over.
    expect(computeCurrentStreak(days(14, 13), NOW)).toBe(2);
    // A one-day gap breaks it: only today stands alone.
    expect(computeCurrentStreak(days(15, 13), NOW)).toBe(1);
    // Nothing today or yesterday → no streak.
    expect(computeCurrentStreak(days(13, 12), NOW)).toBe(0);
    // Duplicates on the same day never inflate the streak.
    expect(computeCurrentStreak(days(15, 15, 14), NOW)).toBe(2);
  });

  it("classifies focus concepts by accuracy, weakest first", () => {
    const concepts = new Map([
      ["a", { title: "الجمع مع التجميع", mastery: 0.8, labelAr: "متقن" }],
      ["b", { title: "مقارنة الكسور", mastery: 0.1, labelAr: "ضعيف" }],
      ["c", { title: "الطرح", mastery: 0.5, labelAr: "نامٍ" }],
    ]);
    const report = buildWeeklyReport(
      baseInput({
        concepts,
        weekAssessments: [
          { conceptId: "a", correct: true },
          { conceptId: "a", correct: true },
          { conceptId: "b", correct: false },
          { conceptId: "b", correct: false },
          { conceptId: "c", correct: true },
          { conceptId: "c", correct: false },
        ],
      }),
    );

    // Weakest first: b (0.00) then c (0.50) then a (1.00).
    expect(report.focus.practiced.map((c) => c.conceptId)).toEqual(["b", "c", "a"]);
    expect(report.focus.practiced[0]).toMatchObject({ attempts: 2, correct: 0, accuracy: 0 });
    expect(report.focus.practiced[2]).toMatchObject({ attempts: 2, correct: 2, accuracy: 1 });

    // Improving needs at least two attempts AND high accuracy; needsWork is the
    // low-accuracy band, so both b (0.0) and c (0.5) need support.
    expect(report.focus.improving.map((c) => c.conceptId)).toEqual(["a"]);
    expect(report.focus.needsWork.map((c) => c.conceptId)).toEqual(["b", "c"]);

    expect(report.headline).toContain("نقاط تحتاج دعمًا");
    expect(report.highlights.some((h) => h.includes("الجمع مع التجميع"))).toBe(true);
    expect(report.highlights.some((h) => h.includes("مقارنة الكسور"))).toBe(true);
    expect(report.parentActions.some((a) => a.includes("مقارنة الكسور"))).toBe(true);
  });

  it("gives an honest, actionable report when the child did not study", () => {
    const report = buildWeeklyReport(baseInput({ childName: "عمر" }));
    expect(report.activity.sessions).toBe(0);
    expect(report.streak.currentDays).toBe(0);
    expect(report.focus.practiced).toEqual([]);
    expect(report.headline).toContain("لا توجد جلسات");
    expect(report.headline).toContain("عمر");
    expect(report.parentActions.length).toBeGreaterThan(0);
    expect(report.parentActions[0]).toContain("عمر");
  });

  it("tallies mastery levels and reports a positive week", () => {
    const report = buildWeeklyReport(
      baseInput({
        weekSessions: [{ startedAt: new Date(2026, 0, 15, 9, 0), endedAt: null, durationMinutes: 30 }],
        weekMessages: { studentMessages: 4, tutorMessages: 4 },
        allSessionStarts: [new Date(2026, 0, 15, 9, 0), new Date(2026, 0, 14, 9, 0)],
        masterySummary: [{ mastery: 0.9 }, { mastery: 0.5 }, { mastery: 0.2 }],
      }),
    );
    expect(report.masteryLevels).toEqual({ strong: 1, developing: 1, weak: 1 });
    expect(report.activity.studentMessages).toBe(4);
    expect(report.activity.tutorMessages).toBe(4);
    expect(report.streak.currentDays).toBe(2);
    expect(report.headline).toContain("أسبوع تعلّم جيد");
    // With no focus concepts answered, the parent is nudged toward practice.
    expect(report.highlights.some((h) => h.includes("لا توجد إجابات تدريبية"))).toBe(true);
  });
});
