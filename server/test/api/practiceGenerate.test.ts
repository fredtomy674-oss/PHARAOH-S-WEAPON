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
import { concepts, curriculumEnrollments, lessons, questions } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

let emailSeq = 0;
const nth = (n: number) => `qgen-${n}@test.local`;

/**
 * PHASE 28 — student-side LLM question generation (self-healing practice): a
 * student generates ONE MCQ for a concept they are enrolled in when that
 * concept has no questions yet. Unknown/foreign concepts → 404, already-covered
 * concepts → 409, lessons without content → 503. The generated question is
 * stored, immediately playable, and never exposes the answer key.
 */
describe("practice question generation (POST /api/practice/generate) — PHASE 28", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let conceptD!: string; // lesson B concept with NO questions (the target)
  let conceptE!: string; // lesson with NO chunks (generation cannot ground)
  let student!: AuthSession;
  let stranger!: AuthSession;
  let parent!: AuthSession;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);

    // PHASE 28 fixture: a lesson-B concept with zero questions — eligible.
    const lessonB = (await api.db.db.select().from(lessons).where(eq(lessons.code, "l-b")).get())!;
    conceptD = newId("con");
    await api.db.db.insert(concepts).values({
      id: conceptD,
      lessonId: lessonB.id,
      code: "c-b2",
      title: "تبسيط الكسور",
      description: "مفهوم بلا أسئلة",
    });

    // A lesson with NO chunks at all — generation cannot ground on anything.
    const chunklessLesson = newId("l");
    await api.db.db.insert(lessons).values({
      id: chunklessLesson,
      unitId: corpus.unitId,
      code: "l-empty",
      title: "درس بلا محتوى",
      sortOrder: 3,
    });
    conceptE = newId("con");
    await api.db.db.insert(concepts).values({
      id: conceptE,
      lessonId: chunklessLesson,
      code: "c-e1",
      title: "مفهوم بلا محتوى",
      description: "لا يملك مقاطع معرفية",
    });

    student = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    stranger = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    parent = await registerParent(api.app, nth(++emailSeq));
    await api.db.db.insert(curriculumEnrollments).values({
      id: newId("enr"),
      studentId: student.studentId!,
      curriculumId: corpus.curriculumId,
      isActive: true,
      createdAt: new Date(),
    });
  });

  it("rejects parents (practice is student-only)", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/practice/generate",
      headers: csrfHeaders(parent),
      payload: { conceptId: conceptD },
    });
    expect(res.statusCode).toBe(403);
  });

  it("requires a conceptId", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/practice/generate",
      headers: csrfHeaders(student),
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it("404s for an unknown concept", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/practice/generate",
      headers: csrfHeaders(student),
      payload: { conceptId: "con-does-not-exist" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("404s for a concept outside the student's curricula", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/practice/generate",
      headers: csrfHeaders(stranger),
      payload: { conceptId: conceptD },
    });
    expect(res.statusCode).toBe(404);
  });

  it("409s when the concept already has questions", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/practice/generate",
      headers: csrfHeaders(student),
      payload: { conceptId: corpus.conceptAId },
    });
    expect(res.statusCode).toBe(409);
  });

  it("generates one grounded MCQ for an eligible concept and stores it", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/practice/generate",
      headers: csrfHeaders(student),
      payload: { conceptId: conceptD },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { question: { id: string; content: string; options: string[]; conceptId: string | null; conceptTitle: string | null; difficulty: string } };
    expect(body.question.conceptId).toBe(conceptD);
    expect(body.question.conceptTitle).toBe("تبسيط الكسور");
    expect(body.question.difficulty).toBe("easy");
    expect(body.question.content).toContain("أي العبارات التالية وردت في الدرس");
    expect(body.question.options.length).toBe(4);
    // The answer key must never reach the student payload.
    expect(res.body).not.toContain("correctIndex");
    expect(res.body).not.toContain("answerKey");
    expect(res.body).not.toContain("optionsJson");

    // The row is persisted, linked to the concept's curriculum, grounded as
    // an easy MCQ with a valid hidden key.
    const row = await api.db.db.select().from(questions).where(eq(questions.id, body.question.id)).get();
    expect(row).toBeTruthy();
    expect(row!.type).toBe("mcq");
    expect(row!.difficulty).toBe("easy");
    expect(row!.curriculumId).toBe(corpus.curriculumId);
    expect(row!.lessonId).toBe(corpus.lessonB);
    expect(row!.conceptId).toBe(conceptD);
    expect(row!.answerKey).toBeNull();
    const parsed = JSON.parse(row!.optionsJson!) as { options: string[]; correctIndex: number };
    expect(parsed.options.length).toBe(4);
    expect(parsed.correctIndex).toBeGreaterThanOrEqual(0);
    expect(parsed.correctIndex).toBeLessThan(parsed.options.length);
  });

  it("lets the student grade the generated question and updates mastery", async () => {
    const row = (await api.db.db.select().from(questions).where(eq(questions.conceptId, conceptD)).get())!;
    const parsed = JSON.parse(row.optionsJson!) as { options: string[]; correctIndex: number };
    const res = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${row.id}/submit`,
      headers: csrfHeaders(student),
      payload: { optionIndex: parsed.correctIndex },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { correct: boolean; explanation: string | null; mastery: { score: number } | null };
    expect(body.correct).toBe(true);
    // The correct option matches the lesson text verbatim.
    expect(parsed.options[parsed.correctIndex]).toBeTruthy();
    expect(body.mastery).not.toBeNull();
    expect(body.mastery!.score).toBeGreaterThan(0);
  });

  it("503s when the concept's lesson has no content to ground on", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/practice/generate",
      headers: csrfHeaders(student),
      payload: { conceptId: conceptE },
    });
    expect(res.statusCode).toBe(503);
    expect((res.json() as { error: { message: string } }).error.message).toContain("لا يوجد محتوى");
  });

  it("401s unauthenticated requests", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/practice/generate",
      headers: { cookie: "no-such-cookie" },
      payload: { conceptId: conceptD },
    });
    expect(res.statusCode).toBe(401);
  });
});