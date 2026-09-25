import { beforeAll, describe, expect, it } from "vitest";
import {
  csrfHeaders,
  makeApp,
  registerStudent,
  seedMiniCorpus,
  type AuthSession,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";
import { answers, curriculumEnrollments, learningSessions } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

let emailSeq = 0;
const nth = (n: number) => `streak-${n}@test.local`;

const DAY_MS = 86_400_000;
const dayAgo = (days: number): Date => new Date(Date.now() - days * DAY_MS);

/**
 * PHASE 32 — the daily-activity streak (D-020/D-035 deferred «تتابع أسبوعي»):
 * a streak of consecutive UTC activity days (answers ∪ learning sessions)
 * grants the «مواظب 3 أيام» / «مواظب أسبوع» badges through the real submit
 * loop, surfaces on GET /api/practice/plan, never double-grants, and isolates
 * per student. Past-day rows are seeded directly so the run is deterministic.
 */
describe("daily activity streak (PHASE 32)", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let streaker!: AuthSession;
  let gappy!: AuthSession;
  let solo!: AuthSession;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    streaker = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    gappy = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    solo = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    for (const s of [streaker, gappy, solo]) {
      await api.db.db.insert(curriculumEnrollments).values({
        id: newId("enr"),
        studentId: s.studentId!,
        curriculumId: corpus.curriculumId,
        isActive: true,
        createdAt: new Date(),
      });
    }
  });

  const seedAnswer = async (studentId: string, questionId: string, daysAgo: number): Promise<void> => {
    await api.db.db.insert(answers).values({
      id: newId("ans"),
      questionId,
      studentId,
      sessionId: null,
      content: "إجابة سابقة مسجَّلة",
      correct: 1,
      answerSeconds: null,
      createdAt: dayAgo(daysAgo),
    });
  };

  const submitToday = async (s: AuthSession, questionId: string): Promise<void> => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${questionId}/submit`,
      headers: csrfHeaders(s),
      payload: { optionIndex: 0 },
    });
    expect(res.statusCode).toBe(200);
  };

  const myAchievements = async (s: AuthSession) =>
    (await api.app.inject({ method: "GET", url: "/api/achievements/me", headers: csrfHeaders(s) })).json();

  const myPlan = async (s: AuthSession) =>
    (await api.app.inject({ method: "GET", url: "/api/practice/plan", headers: csrfHeaders(s) })).json();

  it("three consecutive activity days grant مواظب 3 أيام while مواظب أسبوع stays locked", async () => {
    // Past two days + a real answer today = a 3-day run.
    await seedAnswer(streaker.studentId!, corpus.questionA1Id, 2);
    await seedAnswer(streaker.studentId!, corpus.questionB1Id, 1);
    await submitToday(streaker, corpus.questionA1Id);

    const body = await myAchievements(streaker);
    expect(body.total).toBe(12);
    const byCode = (code: string) => body.achievements.find((a: { code: string }) => a.code === code);
    expect(byCode("streak_three").awardedAt).toBeTruthy();
    expect(byCode("streak_seven").awardedAt).toBeNull();

    // The plan reports the same run read-side.
    const plan = await myPlan(streaker);
    expect(plan.streak).toBe(3);
  });

  it("a missed day resets the run (no badge below the threshold)", async () => {
    // day-3 and day-1 only → the gap breaks the chain: today + yesterday = 2.
    await seedAnswer(gappy.studentId!, corpus.questionC1Id, 3);
    await seedAnswer(gappy.studentId!, corpus.questionB1Id, 1);
    await submitToday(gappy, corpus.questionA1Id);

    const plan = await myPlan(gappy);
    expect(plan.streak).toBe(2);

    const body = await myAchievements(gappy);
    expect(body.achievements.find((a: { code: string }) => a.code === "streak_three").awardedAt).toBeNull();
  });

  it("sessions count as activity too, deduplicated per calendar day", async () => {
    // Only sessions, no answers: two sessions on the same day count as one day.
    for (let i = 0; i < 2; i++) {
      await api.db.db.insert(learningSessions).values({
        id: newId("lsn"),
        studentId: solo.studentId!,
        curriculumId: corpus.curriculumId,
        gradeId: corpus.gradeId,
        subjectId: corpus.subjectId,
        lessonId: corpus.lessonA,
        status: "ended",
        startedAt: dayAgo(1),
        endedAt: dayAgo(1),
      });
    }
    expect((await myPlan(solo)).streak).toBe(1); // sessions only

    await submitToday(solo, corpus.questionA1Id); // and now today's answer
    const plan = await myPlan(solo);
    expect(plan.streak).toBe(2); // yesterday (deduped) + today

    // streak 2 < 3 → still no streak badge; and this student's grant did not
    // leak to the others (isolation covered by per-student evaluation).
    const body = await myAchievements(solo);
    expect(body.achievements.find((a: { code: string }) => a.code === "streak_three").awardedAt).toBeNull();
    expect((await myAchievements(gappy)).achievements.find((a: { code: string }) => a.code === "streak_three").awardedAt).toBeNull();
  });

  it("never double-grants: re-evaluating the same streak keeps one award", async () => {
    const before = await myAchievements(streaker);
    await submitToday(streaker, corpus.questionB1Id); // fires evaluateStreak again
    const after = await myAchievements(streaker);
    const earned = (b: { achievements: Array<{ awardedAt: string | null }> }) =>
      b.achievements.filter((a) => a.awardedAt).length;
    expect(earned(after)).toBe(earned(before)); // no double grant on re-eval
    expect(after.achievements.find((a: { code: string }) => a.code === "streak_three").awardedAt).toBeTruthy();
  });
});