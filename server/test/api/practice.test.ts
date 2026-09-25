import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import {
  csrfHeaders,
  makeApp,
  registerParent,
  registerStudent,
  seedMiniCorpus,
  type AuthSession,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";
import { answers, assessments, curriculumEnrollments, studentProgress } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

let emailSeq = 0;
const nth = (n: number) => `practice-${n}@test.local`;

/**
 * PHASE 24 — practice loop for the concept-mastery engine. Serves questions
 * scoped to enrolled curricula (weakest concepts first), grades answers
 * deterministically, and feeds every attempt into recordAssessment — the
 * first production caller of the assessments path. Never leaks the answer
 * key; parents and non-enrolled students can't reach it.
 */
describe("practice loop (GET /api/practice) — PHASE 24", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let student!: AuthSession;
  let stranger!: AuthSession;
  let parent!: AuthSession;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    student = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    stranger = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    parent = await registerParent(api.app, nth(++emailSeq));
    // student is enrolled in the test corpus (stranger deliberately is not).
    await api.db.db.insert(curriculumEnrollments).values({
      id: newId("enr"),
      studentId: student.studentId!,
      curriculumId: corpus.curriculumId,
      isActive: true,
      createdAt: new Date(),
    });
  });

  it("serves the weakest tracked concept's question with no answer-key leak", async () => {
    // Concept A is the student's only tracked concept and it's weak (0.1).
    await api.memory.recordAssessment({ studentId: student.studentId!, conceptId: corpus.conceptAId, correct: false, type: "concept_check" });

    const res = await api.app.inject({ method: "GET", url: "/api/practice/question", headers: csrfHeaders(student) });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { question: { id: string; content: string; options: string[]; conceptId: string | null; conceptTitle: string | null; difficulty: string } | null };
    expect(body.question).not.toBeNull();
    expect(body.question!.conceptId).toBe(corpus.conceptAId);
    expect(body.question!.content).toContain("487");
    expect(body.question!.options).toEqual(["845", "835", "745", "855"]);
    // The key must never appear — not even as a stray field.
    expect(JSON.stringify(body)).not.toContain("correctIndex");
    expect(JSON.stringify(body)).not.toContain("answerKey");
  });

  it("conceptId filter returns that concept's question (or null when none)", async () => {
    const res = await api.app.inject({
      method: "GET",
      url: `/api/practice/question?conceptId=${corpus.conceptBId}`,
      headers: csrfHeaders(student),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { question: { content: string; conceptId: string | null } | null };
    expect(body.question).not.toBeNull();
    expect(body.question!.conceptId).toBe(corpus.conceptBId);
    expect(body.question!.content).toContain("3/5");
  });

  it("grading a correct answer records the attempt and updates mastery", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${corpus.questionA1Id}/submit`,
      headers: csrfHeaders(student),
      payload: { optionIndex: 0 }, // "845" is correct
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { correct: boolean; explanation: string | null; mastery: { score: number; decayedScore: number; level: string; labelAr: string } | null };
    expect(body.correct).toBe(true);
    expect(body.explanation).toContain("845");
    expect(body.mastery).not.toBeNull();
    expect(body.mastery!.score).toBeGreaterThan(0);
    expect(["mastered", "advanced", "developing", "needs_review"]).toContain(body.mastery!.level);
    expect(typeof body.mastery!.labelAr).toBe("string");

    const answerRow = await api.db.db.select().from(answers).where(eq(answers.questionId, corpus.questionA1Id)).get();
    expect(answerRow).not.toBeNull();
    expect(answerRow!.studentId).toBe(student.studentId);
    expect(answerRow!.correct).toBe(1);
    expect(answerRow!.content).toBe("845");

    const asmtRows = await api.db.db.select().from(assessments).where(eq(assessments.studentId, student.studentId!));
    const exercise = asmtRows.find((a) => a.type === "exercise");
    expect(exercise).toBeDefined();
    expect(JSON.parse(exercise!.resultJson ?? "{}")).toEqual({ conceptId: corpus.conceptAId, correct: true });

    const prog = await api.db.db.select().from(studentProgress).where(eq(studentProgress.conceptId, corpus.conceptAId)).get();
    expect(prog!.attempts).toBe(2); // 1 concept_check + 1 exercise
    expect(prog!.correct).toBe(1);
    expect(prog!.mastery).toBeCloseTo(0.25, 5); // 0.1 + 0.15
  });

  it("grading a wrong answer lowers mastery", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${corpus.questionA1Id}/submit`,
      headers: csrfHeaders(student),
      payload: { optionIndex: 1 }, // "835" is wrong
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { correct: boolean };
    expect(body.correct).toBe(false);

    const prog = await api.db.db.select().from(studentProgress).where(eq(studentProgress.conceptId, corpus.conceptAId)).get();
    expect(prog!.attempts).toBe(3);
    expect(prog!.correct).toBe(1);
    expect(prog!.mastery).toBeCloseTo(0.15, 5); // 0.25 - 0.1
  });

  it("progress/me exposes the mastery summary with levels + trend + recency", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/progress/me", headers: csrfHeaders(student) });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      progress: { concepts: unknown[]; strengths: Array<{ title: string }>; weaknesses: Array<{ title: string }> };
      mastery: Array<{ conceptId: string; title: string; mastery: number; decayedMastery: number; level: string; labelAr: string; attempts: number; correct: number; daysSinceLastPractice: number; trend: string }>;
    };
    const entry = body.mastery.find((m) => m.conceptId === corpus.conceptAId);
    expect(entry).toBeDefined();
    expect(entry!.mastery).toBeCloseTo(0.15, 5);
    expect(entry!.decayedMastery).toBeLessThanOrEqual(entry!.mastery);
    expect(["mastered", "advanced", "developing", "needs_review"]).toContain(entry!.level);
    expect(entry!.labelAr).toBeTruthy();
    expect(entry!.attempts).toBe(3);
    expect(entry!.correct).toBe(1);
    expect(entry!.daysSinceLastPractice).toBe(0);
    expect(["up", "steady", "down"]).toContain(entry!.trend);
  });

  it("parents are blocked from practice endpoints", async () => {
    const q = await api.app.inject({ method: "GET", url: "/api/practice/question", headers: csrfHeaders(parent) });
    expect(q.statusCode).toBe(403);
    const submit = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${corpus.questionA1Id}/submit`,
      headers: csrfHeaders(parent),
      payload: { optionIndex: 0 },
    });
    expect(submit.statusCode).toBe(403);
  });

  it("a non-enrolled student gets no question and 404 on any submit", async () => {
    const q = await api.app.inject({ method: "GET", url: "/api/practice/question", headers: csrfHeaders(stranger) });
    expect(q.statusCode).toBe(200);
    expect((q.json() as { question: unknown }).question).toBeNull();

    const submit = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${corpus.questionA1Id}/submit`,
      headers: csrfHeaders(stranger),
      payload: { optionIndex: 0 },
    });
    expect(submit.statusCode).toBe(404);
    expect((submit.json() as { error: { code: string } }).error.code).toBe("NOT_FOUND");
  });

  it("rejects malformed option indexes", async () => {
    const bad = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${corpus.questionA1Id}/submit`,
      headers: csrfHeaders(student),
      payload: { optionIndex: 99 },
    });
    expect(bad.statusCode).toBe(400);
    expect((bad.json() as { error: { code: string } }).error.code).toBe("INVALID_OPTION");

    const nan = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${corpus.questionA1Id}/submit`,
      headers: csrfHeaders(student),
      payload: { optionIndex: "zero" },
    });
    expect(nan.statusCode).toBe(400);
  });
});