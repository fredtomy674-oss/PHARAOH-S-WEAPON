import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { csrfHeaders, makeApp, registerParent, registerStudent, seedMiniCorpus, type AuthSession, type MiniCorpus, type TestApi } from "../helpers.js";
import { concepts, studentProgress } from "../../src/db/schema.js";

let emailSeq = 0;
const nth = (n: number) => `recency-${n}@test.local`;

const DAY_MS = 86_400_000;
const dayAgo = (days: number): Date => new Date(Date.now() - days * DAY_MS);

interface ChildProgressShape {
  progress: {
    concepts: Array<{
      conceptId: string;
      title: string;
      mastery: number;
      lastPracticedAt: string;
      daysSinceRealPractice: number;
    }>;
  };
}

interface PlanShape {
  plan: Array<{ conceptId: string; dueForReview: boolean; daysSinceLastPractice: number }>;
}

/**
 * PHASE 35 — the D-037 tail. Two separate clocks finally reach the surfaces:
 *   1. the parent dashboard shows «آخر ممارسة» (a graded answer), separate from
 *      the exposure refresh a lesson session already provides (PHASE 33);
 *   2. the practice plan flags and prioritises «راجع قبل أن ينسى» once a concept
 *      has gone unseen long enough for decay alone to be eroding it.
 */
describe("practice recency on parent + plan surfaces (D-037 tail) — PHASE 35", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let parent!: AuthSession;
  let student!: AuthSession;
  let linkedStudentId!: string;
  let conceptAId!: string;
  let conceptBId!: string;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    parent = await registerParent(api.app, nth(++emailSeq));
    student = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);

    // Link the child to the parent by the student's sharing code.
    const me = await api.app.inject({ method: "GET", url: "/api/auth/me", headers: csrfHeaders(student) });
    const code = (me.json() as { user: { linkCode: string } }).user.linkCode;
    const link = await api.app.inject({ method: "POST", url: "/api/parent/link", headers: csrfHeaders(parent), payload: { code } });
    expect(link.statusCode).toBe(200);
    linkedStudentId = (link.json() as { child: { studentId: string } }).child.studentId;

    conceptAId = (await api.db.db.select().from(concepts).where(eq(concepts.code, "c-a1")).get())!.id;
    conceptBId = (await api.db.db.select().from(concepts).where(eq(concepts.code, "c-b1")).get())!.id;

    // Concept A: graded 40 days ago, then only EXPOSED (a lesson session) 20
    // days ago → practice is stale even though exposure is fresher.
    // Concept B: graded yesterday → not due.
    await api.db.db.insert(studentProgress).values([
      {
        id: `sp_${emailSeq}_a`,
        studentId: student.studentId!,
        conceptId: conceptAId,
        mastery: 0.6,
        attempts: 4,
        correct: 3,
        lastSeenAt: dayAgo(20),
        lastPracticedAt: dayAgo(40),
      },
      {
        id: `sp_${emailSeq}_b`,
        studentId: student.studentId!,
        conceptId: conceptBId,
        mastery: 0.5,
        attempts: 2,
        correct: 1,
        lastSeenAt: dayAgo(1),
        lastPracticedAt: dayAgo(1),
      },
    ]);
  });

  const getPlan = async (): Promise<PlanShape> => {
    const res = await api.app.inject({ method: "GET", url: "/api/practice/plan", headers: csrfHeaders(student) });
    expect(res.statusCode).toBe(200);
    return res.json() as PlanShape;
  };

  it("parent child detail reports the real last-practice date per concept", async () => {
    const res = await api.app.inject({
      method: "GET",
      url: `/api/parent/children/${linkedStudentId}`,
      headers: csrfHeaders(parent),
    });
    expect(res.statusCode).toBe(200);
    const detail = res.json() as ChildProgressShape;
    expect(detail.progress.concepts).toHaveLength(2);

    const a = detail.progress.concepts.find((c) => c.conceptId === conceptAId)!;
    const b = detail.progress.concepts.find((c) => c.conceptId === conceptBId)!;
    // Practice age ≠ exposure age: A was answered 40 days ago.
    expect(a.daysSinceRealPractice).toBeGreaterThanOrEqual(39);
    expect(b.daysSinceRealPractice).toBe(1);
    // The stamp itself is exposed for display.
    expect(new Date(a.lastPracticedAt).getTime()).toBeLessThan(new Date(b.lastPracticedAt).getTime());
  });

  it("the plan flags a stale-exposure concept as due for review", async () => {
    const plan = await getPlan();
    const a = plan.plan.find((p) => p.conceptId === conceptAId)!;
    const b = plan.plan.find((p) => p.conceptId === conceptBId)!;
    expect(a.dueForReview).toBe(true);
    expect(b.dueForReview).toBe(false);
  });

  it("the due concept is ranked ahead of fresher work in the plan", async () => {
    const plan = await getPlan();
    const idxA = plan.plan.findIndex((p) => p.conceptId === conceptAId);
    const idxB = plan.plan.findIndex((p) => p.conceptId === conceptBId);
    expect(idxA).toBeGreaterThanOrEqual(0);
    expect(idxB).toBeGreaterThanOrEqual(0);
    expect(idxA).toBeLessThan(idxB);
  });

  it("a legacy row with no practice stamp falls back to exposure recency", async () => {
    const legacyConcept = (await api.db.db.select().from(concepts).where(eq(concepts.code, "c-a2")).get())!.id;
    await api.db.db.insert(studentProgress).values({
      id: `sp_${emailSeq}_legacy`,
      studentId: student.studentId!,
      conceptId: legacyConcept,
      mastery: 0.5,
      attempts: 1,
      correct: 1,
      lastSeenAt: dayAgo(3),
      lastPracticedAt: null, // PHASE 33 backfill did not run for this row
    });

    const res = await api.app.inject({
      method: "GET",
      url: `/api/parent/children/${linkedStudentId}`,
      headers: csrfHeaders(parent),
    });
    const detail = res.json() as ChildProgressShape;
    const legacy = detail.progress.concepts.find((c) => c.conceptId === legacyConcept)!;
    // Never claims «never practiced»: it reports the exposure age instead.
    expect(legacy.daysSinceRealPractice).toBe(3);
  });

  it("an in-lesson practice stamps the same clock the parent reads", async () => {
    // A real graded answer refreshes `last_practiced_at` (PHASE 33 contract),
    // so the parent's «آخر ممارسة» follows practice, not session exposure.
    const before = (await api.db.db
      .select({ lastPracticedAt: studentProgress.lastPracticedAt })
      .from(studentProgress)
      .where(and(eq(studentProgress.studentId, student.studentId!), eq(studentProgress.conceptId, conceptBId)))
      .get())!.lastPracticedAt;

    await api.memory.recordAssessment({ studentId: student.studentId!, conceptId: conceptBId, correct: true });
    const after = (await api.db.db
      .select({ lastPracticedAt: studentProgress.lastPracticedAt })
      .from(studentProgress)
      .where(and(eq(studentProgress.studentId, student.studentId!), eq(studentProgress.conceptId, conceptBId)))
      .get())!.lastPracticedAt!;

    expect(after.getTime()).toBeGreaterThan(before!.getTime());
    // And the plan no longer calls it stale.
    const plan = await getPlan();
    expect(plan.plan.find((p) => p.conceptId === conceptBId)!.daysSinceLastPractice).toBe(0);
  });
});
