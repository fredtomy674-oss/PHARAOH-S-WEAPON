import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import {
  csrfHeaders,
  makeApp,
  registerStudent,
  seedMiniCorpus,
  type AuthSession,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";
import { curriculumEnrollments, studentProgress } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

let emailSeq = 0;
const nth = (n: number) => `session-recency-${n}@test.local`;

const DAY_MS = 86_400_000;
const dayAgo = (days: number): Date => new Date(Date.now() - days * DAY_MS);

/**
 * PHASE 33 — learning sessions feed the mastery loop (read-side recency):
 * ending a lesson session refreshes the EXPOSURE recency (`lastSeenAt`) of the
 * lesson's concepts the student already practices — mastery/attempts unchanged,
 * untracked concepts stay untracked, other lessons untouched. The practice
 * plan and mastery display therefore reflect "just studied this lesson" while
 * ACHIEVEMENTS keep decaying against the separate `lastPracticedAt` timestamp,
 * so a badge is never granted by mere exposure (only by real attempts).
 */
describe("lesson sessions refresh concept recency (PHASE 33)", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  const students: AuthSession[] = [];

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    for (let i = 0; i < 6; i++) {
      const s = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
      students.push(s);
      await api.db.db.insert(curriculumEnrollments).values({
        id: newId("enr"),
        studentId: s.studentId!,
        curriculumId: corpus.curriculumId,
        isActive: true,
        createdAt: new Date(),
      });
    }
  });

  const submit = async (s: AuthSession, questionId: string): Promise<void> => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${questionId}/submit`,
      headers: csrfHeaders(s),
      payload: { optionIndex: 0 },
    });
    expect(res.statusCode).toBe(200);
  };

  /** Simulate a concept practiced `days` ago (both recency + practice stamps). */
  const rewind = async (s: AuthSession, conceptId: string, days: number): Promise<void> => {
    await api.db.db
      .update(studentProgress)
      .set({ lastSeenAt: dayAgo(days), lastPracticedAt: dayAgo(days) })
      .where(and(eq(studentProgress.studentId, s.studentId!), eq(studentProgress.conceptId, conceptId)));
  };

  const progressRow = async (s: AuthSession, conceptId: string) =>
    api.db.db
      .select()
      .from(studentProgress)
      .where(and(eq(studentProgress.studentId, s.studentId!), eq(studentProgress.conceptId, conceptId)))
      .get();

  const myPlan = async (s: AuthSession) =>
    (await api.app.inject({ method: "GET", url: "/api/practice/plan", headers: csrfHeaders(s) })).json();

  const myAchievements = async (s: AuthSession) =>
    (await api.app.inject({ method: "GET", url: "/api/achievements/me", headers: csrfHeaders(s) })).json();

  /** Start a lesson session, send one message and end it (the real walk). */
  const studyAndEndLesson = async (s: AuthSession, lessonId: string): Promise<void> => {
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(s),
      payload: {
        curriculumId: corpus.curriculumId,
        gradeId: corpus.gradeId,
        subjectId: corpus.subjectId,
        lessonId,
      },
    });
    expect(start.statusCode).toBe(201);
    const sessionId = (start.json() as { session: { id: string } }).session.id;
    const turn = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "أراجع هذا الدرس للمذاكرة" },
    });
    expect(turn.statusCode).toBe(200);
    const end = await api.app.inject({ method: "POST", url: `/api/sessions/${sessionId}/end`, headers: csrfHeaders(s) });
    expect(end.statusCode).toBe(200);
  };

  it("ending a lesson refreshes recency of its practiced concepts — mastery untouched", async () => {
    const s = students[0]!;
    await submit(s, corpus.questionA1Id); // concept A → mastery 0.6, both stamps = now
    await rewind(s, corpus.conceptAId, 10);

    await studyAndEndLesson(s, corpus.lessonA); // covers concepts A + C

    const row = await progressRow(s, corpus.conceptAId);
    expect(row).toBeTruthy();
    // Exposure recency refreshed to (about) now…
    expect(Date.now() - row!.lastSeenAt.getTime()).toBeLessThan(60_000);
    // …while the practice stamp stays 10 days old (only the lesson ran).
    expect(row!.lastPracticedAt!.getTime()).toBeLessThan(Date.now() - 9 * DAY_MS);
    // Mastery/attempts are untouched by the session.
    expect(row!.mastery).toBe(0.6);
    expect(row!.attempts).toBe(1);
    expect(row!.correct).toBe(1);

    // The plan now sees the concept as freshly engaged (no decay, no staleness).
    const planBody = await myPlan(s);
    const entry = planBody.plan.find((p: { conceptId: string }) => p.conceptId === corpus.conceptAId);
    expect(entry.daysSinceLastPractice).toBe(0);
    expect(entry.decayedMastery).toBe(0.6);
    expect(entry.mastery).toBe(0.6);
  });

  it("untracked lesson concepts stay untracked; other lessons are untouched", async () => {
    const s = students[1]!;
    await submit(s, corpus.questionB1Id); // concept B (lesson B)
    await rewind(s, corpus.conceptBId, 10);

    // A lesson-A session must not resurrect A/C (never practiced) nor touch B.
    await studyAndEndLesson(s, corpus.lessonA);

    expect(await progressRow(s, corpus.conceptAId)).toBeUndefined();
    expect(await progressRow(s, corpus.conceptCId)).toBeUndefined();
    const bRow = await progressRow(s, corpus.conceptBId);
    expect(bRow).toBeTruthy();
    expect(Math.abs(bRow!.lastSeenAt.getTime() - dayAgo(10).getTime())).toBeLessThan(60_000);
    expect(Math.abs(bRow!.lastPracticedAt!.getTime() - dayAgo(10).getTime())).toBeLessThan(60_000);
    expect(bRow!.mastery).toBe(0.6);
  });

  it("badges stay practice-gated: studying a lesson never grants «متقن»", async () => {
    const s = students[2]!;
    // One real attempt (0.6 — no badge fires), then the RAW mastery is bumped
    // directly so no evaluation ever runs at 0.9.
    await submit(s, corpus.questionB1Id);
    await api.db.db
      .update(studentProgress)
      .set({ mastery: 0.9 })
      .where(and(eq(studentProgress.studentId, s.studentId!), eq(studentProgress.conceptId, corpus.conceptBId)));
    await rewind(s, corpus.conceptBId, 30); // forgotten in practice terms

    await studyAndEndLesson(s, corpus.lessonB); // display recency → fresh

    // The student's own progress card now shows «متقن» — pure exposure effect.
    const planBody = await myPlan(s);
    const entry = planBody.plan.find((p: { conceptId: string }) => p.conceptId === corpus.conceptBId);
    expect(entry.labelAr).toBe("متقن");
    expect(entry.decayedMastery).toBe(0.9);

    // …but no mastery badge: practice decay (30 days idle) is still low.
    let badges = await myAchievements(s);
    const byCode = (code: string) => badges.achievements.find((a: { code: string }) => a.code === code);
    expect(byCode("mastery_first").awardedAt).toBeNull();

    // A real attempt refreshes the practice stamp → the badge is earned.
    await submit(s, corpus.questionB1Id);
    badges = await myAchievements(s);
    expect(byCode("mastery_first").awardedAt).toBeTruthy();
  });

  it("legacy rows (null lastPracticedAt) decay against lastSeenAt", async () => {
    const s = students[3]!;
    // One real attempt (0.6), raw mastery bumped to 0.9 WITHOUT any
    // evaluation run, then "forgotten" for 30 days (both stamps).
    await submit(s, corpus.questionB1Id);
    await api.db.db
      .update(studentProgress)
      .set({ mastery: 0.9 })
      .where(and(eq(studentProgress.studentId, s.studentId!), eq(studentProgress.conceptId, corpus.conceptBId)));
    await rewind(s, corpus.conceptBId, 30);
    // Simulate a pre-PHASE-33 row: no separate practice stamp.
    await api.db.db
      .update(studentProgress)
      .set({ lastPracticedAt: null })
      .where(and(eq(studentProgress.studentId, s.studentId!), eq(studentProgress.conceptId, corpus.conceptBId)));
    const svc = (api.app as unknown as { achievements: { evaluate: (id: string, ev: string) => Promise<void> } }).achievements;

    const isGranted = async () => {
      const b = await myAchievements(s);
      return b.achievements.find((a: { code: string }) => a.code === "mastery_first").awardedAt != null;
    };

    // Old lastSeenAt → still not mastered (fallback reads lastSeenAt).
    await svc.evaluate(s.studentId!, "mastery_achieved");
    expect(await isGranted()).toBe(false);

    // A fresh exposure (e.g. an old row's lastSeenAt refreshed by a session)
    // falls back through lastSeenAt — this is exactly the pre-PHASE-33 behavior.
    await api.db.db
      .update(studentProgress)
      .set({ lastSeenAt: new Date() })
      .where(and(eq(studentProgress.studentId, s.studentId!), eq(studentProgress.conceptId, corpus.conceptBId)));
    await svc.evaluate(s.studentId!, "mastery_achieved");
    expect(await isGranted()).toBe(true);
  });

  it("ending a session with no lesson / no practice stays a no-op (best-effort)", async () => {
    const s = students[4]!;
    // No practice at all: a lesson session end must not create progress rows.
    await studyAndEndLesson(s, corpus.lessonA);
    expect(await progressRow(s, corpus.conceptAId)).toBeUndefined();
    expect(await progressRow(s, corpus.conceptCId)).toBeUndefined();

    // A lesson-less session (start → end) is also a clean no-op.
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(s),
      payload: { curriculumId: corpus.curriculumId, gradeId: corpus.gradeId, subjectId: corpus.subjectId },
    });
    expect(start.statusCode).toBe(201);
    const sessionId = (start.json() as { session: { id: string } }).session.id;
    const end = await api.app.inject({ method: "POST", url: `/api/sessions/${sessionId}/end`, headers: csrfHeaders(s) });
    expect(end.statusCode).toBe(200);

    // Everything downstream still healthy.
    const planBody = await myPlan(s);
    expect(typeof planBody.streak).toBe("number");
    expect(Array.isArray(planBody.plan)).toBe(true);
    const badges = await myAchievements(s);
    expect(badges.total).toBe(12);
  });

  it("a studied lesson drops its stale weak concept below the queue — plan re-ranks", async () => {
    const s = students[5]!;
    // A: fresh (practiced today, raw 0.5). B: stale 10d (raw 0.4). C: stale 10d (raw 0.35).
    await submit(s, corpus.questionA1Id);
    await api.db.db
      .update(studentProgress)
      .set({ mastery: 0.5 })
      .where(and(eq(studentProgress.studentId, s.studentId!), eq(studentProgress.conceptId, corpus.conceptAId)));
    await submit(s, corpus.questionB1Id);
    await api.db.db
      .update(studentProgress)
      .set({ mastery: 0.4 })
      .where(and(eq(studentProgress.studentId, s.studentId!), eq(studentProgress.conceptId, corpus.conceptBId)));
    await rewind(s, corpus.conceptBId, 10);
    await submit(s, corpus.questionC1Id);
    await api.db.db
      .update(studentProgress)
      .set({ mastery: 0.35 })
      .where(and(eq(studentProgress.studentId, s.studentId!), eq(studentProgress.conceptId, corpus.conceptCId)));
    await rewind(s, corpus.conceptCId, 10);

    const orderOf = (body: { plan: Array<{ conceptId: string }> }) => body.plan.map((p) => p.conceptId);

    // Weakest-first: C (decayed ≈ 0.29) before B (≈ 0.33) before A (0.5).
    const before = orderOf(await myPlan(s));
    expect(before.indexOf(corpus.conceptCId)).toBe(0);
    expect(before.indexOf(corpus.conceptBId)).toBe(1);

    // Studying lesson A refreshes A + C → C's decayed rises to its raw 0.35,
    // so the untouched B (0.33) becomes the weakest — the queue re-ranks.
    await studyAndEndLesson(s, corpus.lessonA);
    const after = orderOf(await myPlan(s));
    expect(after.indexOf(corpus.conceptBId)).toBe(0);
    expect(after.indexOf(corpus.conceptCId)).toBe(1);
    expect(after.indexOf(corpus.conceptAId)).toBe(2);

    // The refreshed concept reports fresh engagement with unchanged raw mastery.
    const afterBody = await myPlan(s);
    const cEntry = afterBody.plan.find((p: { conceptId: string }) => p.conceptId === corpus.conceptCId);
    expect(cEntry.daysSinceLastPractice).toBe(0);
    expect(cEntry.mastery).toBe(0.35);
  });
});