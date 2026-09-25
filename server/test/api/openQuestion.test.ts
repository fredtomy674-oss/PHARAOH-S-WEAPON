import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
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
import { answers, curriculumEnrollments, questions, studentProgress } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

let emailSeq = 0;
const nth = (n: number) => `opengrade-${n}@test.local`;

/**
 * PHASE 30 — open questions end-to-end (إغلاق آخر بند D-028): a student
 * generates an OPEN (free-text) question for an enrolled concept and submits
 * a written answer; the server grades it through the `grade_open` AI
 * operation (deterministic mock offline), persists the attempt, updates
 * mastery, and never leaks the answerKey to the student. Anti-cases: wrong
 * payload kinds are rejected per question type and parents are blocked.
 */
describe("open question grading (PHASE 30)", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let student!: AuthSession;
  let parent!: AuthSession;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    student = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    parent = await registerParent(api.app, nth(++emailSeq));
    await api.db.db.insert(curriculumEnrollments).values({
      id: newId("enr"),
      studentId: student.studentId!,
      curriculumId: corpus.curriculumId,
      isActive: true,
      createdAt: new Date(),
    });
  });

  it("generates one open question for a concept and never leaks the answer key", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/practice/generate",
      headers: csrfHeaders(student),
      payload: { conceptId: corpus.conceptBId, kind: "open" },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.stringify(res.json());
    expect(body).not.toContain("answerKey");
    expect(body).not.toContain("optionsJson");
    const { question } = res.json() as {
      question: { id: string; type: string; options: string[] | null; content: string };
    };
    expect(question.type).toBe("open");
    expect(question.options).toBeNull();
    expect(question.content.length).toBeGreaterThan(0);

    // The row stores the hidden model answer server-side only.
    const row = await api.db.db.select().from(questions).where(eq(questions.id, question.id)).get();
    expect(row?.type).toBe("open");
    expect(row?.optionsJson).toBeNull();
    expect(typeof row?.answerKey).toBe("string");
    expect((row?.answerKey ?? "").length).toBeGreaterThan(0);
  });

  it("409 when the concept already has an open question of the same kind", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/practice/generate",
      headers: csrfHeaders(student),
      payload: { conceptId: corpus.conceptBId, kind: "open" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("serves the open question via ?type=open without the key", async () => {
    const res = await api.app.inject({
      method: "GET",
      url: `/api/practice/question?conceptId=${corpus.conceptBId}&type=open`,
      headers: csrfHeaders(student),
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.stringify(res.json());
    expect(body).not.toContain("answerKey");
    expect(body).not.toContain("correctIndex");
    const { question } = res.json() as { question: { type: string; options: string[] | null } | null };
    expect(question?.type).toBe("open");
    expect(question?.options).toBeNull();
  });

  it("grades a correct written answer: correct=true, score=1, safe feedback, mastery recorded", async () => {
    const row = (await api.db.db.select().from(questions).where(and(eq(questions.type, "open"), eq(questions.conceptId, corpus.conceptBId))).get())!;
    const key = row.answerKey!;

    const res = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${row.id}/submit`,
      headers: csrfHeaders(student),
      payload: { answer: key },
    });
    expect(res.statusCode).toBe(200);
    const result = res.json() as {
      correct: boolean;
      score: number | null;
      feedback: string | null;
      explanation: string | null;
      mastery: { labelAr: string } | null;
    };
    expect(result.correct).toBe(true);
    expect(result.score).toBe(1);
    expect(result.feedback).toBeTruthy();
    expect(result.feedback).not.toContain(key);
    expect(result.mastery).not.toBeNull();

    const attempted = await api.db.db.select().from(answers).where(eq(answers.questionId, row.id)).get();
    expect(attempted?.content).toBe(key);
    expect(attempted?.correct).toBe(1);

    // The open attempt feeds the concept-mastery engine like any exercise.
    const progress = await api.db.db
      .select()
      .from(studentProgress)
      .where(and(eq(studentProgress.studentId, student.studentId!), eq(studentProgress.conceptId, corpus.conceptBId)))
      .get();
    expect(progress?.attempts).toBeGreaterThanOrEqual(1);
    expect(progress?.correct).toBeGreaterThanOrEqual(1);
  });

  it("grades a wrong written answer: correct=false, score below threshold, safe feedback", async () => {
    const row = (await api.db.db.select().from(questions).where(and(eq(questions.type, "open"), eq(questions.conceptId, corpus.conceptBId))).get())!;
    const res = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${row.id}/submit`,
      headers: csrfHeaders(student),
      payload: { answer: "هذا نص مختلف تمامًا لا علاقة له بالدرس" },
    });
    expect(res.statusCode).toBe(200);
    const result = res.json() as { correct: boolean; score: number | null; feedback: string | null; explanation: string | null };
    expect(result.correct).toBe(false);
    expect(result.score).toBeLessThan(0.7);
    expect(result.feedback).toBeTruthy();
    expect(result.feedback).not.toContain(row.answerKey!);
  });

  it("rejects an option index for an open question and a text answer for an MCQ", async () => {
    const openRow = (await api.db.db.select().from(questions).where(and(eq(questions.type, "open"), eq(questions.conceptId, corpus.conceptBId))).get())!;
    const openRes = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${openRow.id}/submit`,
      headers: csrfHeaders(student),
      payload: { optionIndex: 0 },
    });
    expect(openRes.statusCode).toBe(400);
    expect((openRes.json() as { error: { code: string } }).error.code).toBe("INVALID_ANSWER");

    const mcqRes = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${corpus.questionA1Id}/submit`,
      headers: csrfHeaders(student),
      payload: { answer: "نص حر" },
    });
    expect(mcqRes.statusCode).toBe(400);
    expect((mcqRes.json() as { error: { code: string } }).error.code).toBe("INVALID_OPTION");
  });

  it("rejects ambiguous payloads with both optionIndex and answer", async () => {
    const openRow = (await api.db.db.select().from(questions).where(and(eq(questions.type, "open"), eq(questions.conceptId, corpus.conceptBId))).get())!;
    const res = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${openRow.id}/submit`,
      headers: csrfHeaders(student),
      payload: { optionIndex: 0, answer: "نص" },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe("INVALID_SUBMIT");
  });

  it("rejects an empty answer", async () => {
    const openRow = (await api.db.db.select().from(questions).where(and(eq(questions.type, "open"), eq(questions.conceptId, corpus.conceptBId))).get())!;
    const res = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${openRow.id}/submit`,
      headers: csrfHeaders(student),
      payload: { answer: "   " },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe("INVALID_ANSWER");
  });

  it("rejects invalid type/kind values", async () => {
    const badType = await api.app.inject({
      method: "GET",
      url: "/api/practice/question?type=essay",
      headers: csrfHeaders(student),
    });
    expect(badType.statusCode).toBe(400);
    expect((badType.json() as { error: { code: string } }).error.code).toBe("INVALID_TYPE");

    const badKind = await api.app.inject({
      method: "POST",
      url: "/api/practice/generate",
      headers: csrfHeaders(student),
      payload: { conceptId: corpus.conceptBId, kind: "essay" },
    });
    expect(badKind.statusCode).toBe(400);
    expect((badKind.json() as { error: { code: string } }).error.code).toBe("INVALID_KIND");
  });

  it("plan reports openQuestions and never leaks the key", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/practice/plan", headers: csrfHeaders(student) });
    expect(res.statusCode).toBe(200);
    const body = JSON.stringify(res.json());
    expect(body).not.toContain("answerKey");
    expect(body).not.toContain("optionsJson");
    const { plan } = res.json() as { plan: Array<{ conceptId: string; openQuestions: number }> };
    const rowB = plan.find((p) => p.conceptId === corpus.conceptBId);
    expect(rowB?.openQuestions).toBe(1);
  });

  it("blocks parents from the open endpoints", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/practice/generate",
      headers: csrfHeaders(parent),
      payload: { conceptId: corpus.conceptAId, kind: "open" },
    });
    expect(res.statusCode).toBe(403);

    const get = await api.app.inject({ method: "GET", url: "/api/practice/question?type=open", headers: csrfHeaders(parent) });
    expect(get.statusCode).toBe(403);
  });
});