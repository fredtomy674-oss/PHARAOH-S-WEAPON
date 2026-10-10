import { beforeAll, describe, expect, it } from "vitest";
import {
  csrfHeaders,
  headers,
  makeApp,
  registerParent,
  registerStudent,
  seedMiniCorpus,
  type AuthSession,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";
import { curriculumEnrollments, learningSessions } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

let emailSeq = 200;
const nth = (n: number) => `weekly-${n}@test.local`;

/** A distinctive string we can assert never appears in the parent payload. */
const SECRET_MESSAGE = "سرّ الطالب الذي يجب ألا يظهر لولي الأمر أبدًا";

interface WeeklyReportShape {
  child: { studentId: string; displayName: string; gradeNameAr: string | null };
  window: { from: string; to: string; days: number };
  activity: { sessions: number; studyMinutes: number; activeDays: number; studentMessages: number; tutorMessages: number };
  streak: { currentDays: number; daysThisWeek: number };
  focus: { practiced: Array<{ conceptId: string; title: string; accuracy: number }>; improving: unknown[]; needsWork: unknown[] };
  masteryLevels: { strong: number; developing: number; weak: number };
  headline: string;
  highlights: string[];
  parentActions: string[];
}

/**
 * PHASE 93 — the parent's weekly digest endpoint. It is metadata-only (never
 * message content), windowed (only activity inside the window is counted), and
 * gated by the parent↔child link like every other parent read.
 */
describe("parent weekly digest (GET /api/parent/children/:id/weekly-report) — PHASE 93", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let student!: AuthSession;
  let parent!: AuthSession;
  let stranger!: AuthSession;
  let linkedStudentId = "";

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    student = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    await api.db.db.insert(curriculumEnrollments).values({
      id: newId("enr"),
      studentId: student.studentId!,
      curriculumId: corpus.curriculumId,
      isActive: true,
      createdAt: new Date(),
    });
    parent = await registerParent(api.app, nth(++emailSeq));
    stranger = await registerParent(api.app, nth(++emailSeq));

    const me = await api.app.inject({ method: "GET", url: "/api/auth/me", headers: headers(student) });
    const linkCode = (me.json() as { user: { linkCode: string } }).user.linkCode!;
    const link = await api.app.inject({
      method: "POST",
      url: "/api/parent/link",
      headers: csrfHeaders(parent),
      payload: { code: linkCode },
    });
    expect(link.statusCode).toBe(200);
    linkedStudentId = (link.json() as { child: { studentId: string } }).child.studentId;
  });

  const getReport = (days?: number) =>
    api.app.inject({
      method: "GET",
      url: `/api/parent/children/${linkedStudentId}/weekly-report${days === undefined ? "" : `?days=${days}`}`,
      headers: csrfHeaders(parent),
    });

  it("an empty week is honest: no sessions, and a concrete next step", async () => {
    const res = await getReport();
    expect(res.statusCode).toBe(200);
    const report = (res.json() as { report: WeeklyReportShape }).report;
    expect(report.child.studentId).toBe(linkedStudentId);
    expect(report.window.days).toBe(7);
    expect(report.activity.sessions).toBe(0);
    expect(report.activity.studyMinutes).toBe(0);
    expect(report.streak.currentDays).toBe(0);
    expect(report.focus.practiced).toEqual([]);
    expect(report.headline).toContain("لا توجد جلسات");
    expect(report.parentActions.length).toBeGreaterThan(0);
  });

  it("counts this week's sessions and messages", async () => {
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(student),
      payload: {
        curriculumId: corpus.curriculumId,
        gradeId: corpus.gradeId,
        subjectId: corpus.subjectId,
        lessonId: corpus.lessonA,
      },
    });
    expect(start.statusCode).toBe(201);
    const sessionId = (start.json() as { session: { id: string } }).session.id;
    for (let i = 0; i < 2; i++) {
      const turn = await api.app.inject({
        method: "POST",
        url: `/api/sessions/${sessionId}/messages`,
        headers: csrfHeaders(student),
        payload: { content: SECRET_MESSAGE },
      });
      expect(turn.statusCode).toBe(200);
    }

    const report = ((await getReport()).json() as { report: WeeklyReportShape }).report;
    expect(report.activity.sessions).toBe(1);
    expect(report.activity.studentMessages).toBe(2);
    expect(report.activity.tutorMessages).toBe(2);
    expect(report.activity.activeDays).toBeGreaterThanOrEqual(1);
    expect(report.streak.currentDays).toBeGreaterThanOrEqual(1);
    expect(report.headline).not.toContain("لا توجد جلسات");
    // Privacy: content never crosses to the parent surface.
    expect(JSON.stringify(report)).not.toContain(SECRET_MESSAGE);
  });

  it("lists focus concepts from this week's assessments, weakest first", async () => {
    // concept A: two correct answers → improving. concept B: two wrong → needs work.
    await api.memory.recordAssessment({ studentId: student.studentId!, conceptId: corpus.conceptAId, correct: true });
    await api.memory.recordAssessment({ studentId: student.studentId!, conceptId: corpus.conceptAId, correct: true });
    await api.memory.recordAssessment({ studentId: student.studentId!, conceptId: corpus.conceptBId, correct: false });
    await api.memory.recordAssessment({ studentId: student.studentId!, conceptId: corpus.conceptBId, correct: false });

    const report = ((await getReport()).json() as { report: WeeklyReportShape }).report;
    expect(report.focus.practiced.map((c) => c.conceptId)).toEqual([corpus.conceptBId, corpus.conceptAId]);
    expect(report.focus.practiced[0]!.title).toBe("مقارنة الكسور");
    expect(report.focus.practiced[1]!.title).toBe("الجمع مع التجميع");
    expect(report.focus.needsWork).toHaveLength(1);
    expect(report.focus.improving).toHaveLength(1);
    expect(report.highlights.some((h) => h.includes("مقارنة الكسور"))).toBe(true);
    expect(report.parentActions.some((a) => a.includes("مقارنة الكسور"))).toBe(true);
  });

  it("counts only activity inside the window", async () => {
    // A finished session thirty days ago, with a known 30-minute duration.
    const oldStart = new Date(Date.now() - 30 * 86_400_000);
    const oldEnd = new Date(oldStart.getTime() + 30 * 60_000);
    await api.db.db.insert(learningSessions).values({
      id: newId("ses"),
      studentId: student.studentId!,
      curriculumId: corpus.curriculumId,
      gradeId: corpus.gradeId,
      subjectId: corpus.subjectId,
      lessonId: corpus.lessonB,
      status: "ended",
      startedAt: oldStart,
      endedAt: oldEnd,
    });

    const week = ((await getReport(7)).json() as { report: WeeklyReportShape }).report;
    expect(week.activity.sessions).toBe(1); // only the recent session

    // A 31-day window reaches back far enough to include the 30-day-old one.
    const wide = ((await getReport(31)).json() as { report: WeeklyReportShape }).report;
    expect(wide.activity.sessions).toBe(2); // recent + the 30-day-old one
    expect(wide.activity.studyMinutes).toBeGreaterThanOrEqual(30);
  });

  it("rejects an out-of-range window", async () => {
    for (const days of [0, 99, -1]) {
      const res = await getReport(days);
      expect(res.statusCode).toBe(400);
      expect((res.json() as { error: { code: string } }).error.code).toBe("INVALID_WINDOW");
    }
  });

  it("is gated by the parent↔child link and the parent role", async () => {
    const foreign = await api.app.inject({
      method: "GET",
      url: `/api/parent/children/${linkedStudentId}/weekly-report`,
      headers: csrfHeaders(stranger),
    });
    expect(foreign.statusCode).toBe(404);

    const byStudent = await api.app.inject({
      method: "GET",
      url: `/api/parent/children/${linkedStudentId}/weekly-report`,
      headers: csrfHeaders(student),
    });
    expect(byStudent.statusCode).toBe(403);
  });
});
