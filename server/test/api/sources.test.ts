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
import { answers, concepts, curricula, lessons, terms, units } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

/**
 * PHASE 160 (W5) — GET /api/lessons/:lessonId/sources
 *
 * The route wires the pure builder to the real world: the lesson's curriculum
 * code + lesson code resolve the stage (printed pages), the pages' OCR text is
 * loaded, the concepts join the review tab, wrong MCQ answers are aggregated
 * into «أخطاء شائعة», and the book-derived tabs are cached per lesson.
 */

describe("lesson sources (GET /api/lessons/:id/sources) — PHASE 160", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let student!: AuthSession;
  let parent!: AuthSession;
  let bookLessonId!: string;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    student = await registerStudent(api.app, "sources-student@test.local", undefined, undefined, corpus.gradeId);
    parent = await registerParent(api.app, "sources-parent@test.local");

    // A curriculum carrying a REAL book's stable code (eg-g6-math) with the
    // book's own lesson code (l-con-1-1): the stage registry then resolves the
    // printed pages 0–14 and the OCR corpus serves their text — the same data
    // the live lesson page gets.
    const now = new Date();
    const bookCur = {
      id: newId("cur"),
      countryId: corpus.countryId,
      educationSystemId: corpus.systemId,
      gradeId: corpus.gradeId,
      subjectId: corpus.subjectId,
      code: "eg-g6-math",
      title: "رياضيات الصف السادس",
      version: "1.0",
      isActive: true,
      createdAt: now,
    };
    await api.db.db.insert(curricula).values(bookCur);
    const bookTerm = { id: newId("t"), curriculumId: bookCur.id, code: "term-1", title: "الفصل الدراسي الأول", sortOrder: 1 };
    await api.db.db.insert(terms).values(bookTerm);
    const bookUnit = { id: newId("u"), termId: bookTerm.id, code: "unit-1", title: "الوحدة الأولى", sortOrder: 1 };
    await api.db.db.insert(units).values(bookUnit);
    const bookLesson = { id: newId("l"), unitId: bookUnit.id, code: "l-con-1-1", title: "المفهوم 1-1", sortOrder: 1 };
    await api.db.db.insert(lessons).values(bookLesson);
    bookLessonId = bookLesson.id;
    await api.db.db.insert(concepts).values({
      id: newId("con"),
      lessonId: bookLesson.id,
      code: "c-1-1-1",
      title: "أستطيع أن أستنتج قابلية القسمة على 2 ، 3 ، 4 ، 5 ، 10 ، 6",
    });
  });

  it("builds the six tabs from the lesson's real printed pages", async () => {
    const res = await api.app.inject({
      method: "GET",
      url: `/api/lessons/${bookLessonId}/sources`,
      headers: headers(student),
    });
    expect(res.statusCode).toBe(200);
    const { sources } = res.json() as {
      sources: {
        hasBookText: boolean;
        pageRange: { from: number; to: number } | null;
        summary: Array<{ kind: string; text: string; page?: number }>;
        definitions: Array<{ term?: string; text: string; page?: number }>;
        cards: Array<{ card: string; text: string; page?: number }>;
        cardCounts: Record<string, number>;
        errors: Array<{ kind: string }>;
        examples: Array<{ kind: string; page?: number }>;
        review: Array<{ kind: string; text: string; page?: number }>;
      };
    };

    expect(sources.hasBookText).toBe(true);
    expect(sources.pageRange).toEqual({ from: 0, to: 13 });

    // Summary: the book's own objectives (OCR line breaks merged back).
    expect(sources.summary.length).toBeGreaterThanOrEqual(6);
    expect(sources.summary.some((i) => i.kind === "objective" && i.text.includes("قابلية القسمة على 2 ، 3 ، 4 ، 5 ، 10 ، 6"))).toBe(true);
    for (const item of sources.summary) {
      expect(typeof item.page).toBe("number");
      expect(item.page).toBeGreaterThanOrEqual(0);
      expect(item.page).toBeLessThanOrEqual(13);
    }

    // Definitions: real terms the book prints (page 4 of the lesson).
    expect(sources.definitions.length).toBeGreaterThanOrEqual(2);
    expect(sources.definitions.some((i) => i.text.includes("الأعداد الأولية فيما بينها"))).toBe(true);

    // Cards: typed, counted, page-tagged.
    expect(sources.cards.length).toBeGreaterThanOrEqual(2);
    const cardTypes = Object.keys(sources.cardCounts);
    expect(cardTypes.length).toBeGreaterThanOrEqual(2);
    expect(cardTypes).toContain("understand");
    expect(sources.cards.every((c) => typeof c.page === "number")).toBe(true);

    // The discussion prompt «هيا نتحدث معًا · ناقش مع زميلك…» is a task — the
    // label strips to «ناقش…» and the task filter keeps it out of both tabs.
    expect(sources.definitions.every((i) => !i.text.includes("ناقش مع زميلك"))).toBe(true);
    expect(sources.cards.every((c) => !c.text.includes("ناقش مع زميلك"))).toBe(true);

    // Examples: the book's own explore scenarios.
    expect(sources.examples.length).toBeGreaterThanOrEqual(3);
    expect(sources.examples.some((i) => i.kind === "explore")).toBe(true);

    // Review: objectives + the book's own questions, all real.
    expect(sources.review.length).toBeGreaterThanOrEqual(3);
    expect(sources.review.some((i) => i.kind === "check")).toBe(true);
    expect(sources.review.some((i) => i.kind === "question")).toBe(true);

    // Deterministic: the second read is the cached first one.
    const again = await api.app.inject({ method: "GET", url: `/api/lessons/${bookLessonId}/sources`, headers: headers(student) });
    expect(again.json()).toEqual(res.json());
  });

  it("turns observed wrong MCQ answers into «أخطاء شائعة» — aggregates only, never a name", async () => {
    const now = new Date();
    await api.db.db.insert(answers).values([
      { id: newId("ans"), questionId: corpus.questionA1Id, studentId: student.studentId!, content: "835", correct: 0, createdAt: now },
      { id: newId("ans"), questionId: corpus.questionA1Id, studentId: student.studentId!, content: "835", correct: 0, createdAt: now },
    ]);

    const res = await api.app.inject({ method: "GET", url: `/api/lessons/${corpus.lessonA}/sources`, headers: headers(student) });
    expect(res.statusCode).toBe(200);
    const { sources } = res.json() as { sources: { hasBookText: boolean; errors: Array<{ kind: string; text: string; wrong?: string; count?: number }> } };

    // The mini-corpus lesson has no printed stage — the tabs degrade honestly…
    expect(sources.hasBookText).toBe(false);
    // …while the observed errors still report the real, aggregated mistake.
    const observed = sources.errors.find((e) => e.kind === "observed");
    expect(observed).toBeDefined();
    expect(observed!.text).toContain("487 + 358");
    expect(observed!.wrong).toBe("835");
    expect(observed!.count).toBe(2);
    // Privacy: the payload never carries a student identity.
    expect(JSON.stringify(res.json())).not.toContain(student.studentId);
  });

  it("answers 404 for an unknown lesson and keeps sources student-only", async () => {
    const missing = await api.app.inject({ method: "GET", url: "/api/lessons/l-does-not-exist/sources", headers: headers(student) });
    expect(missing.statusCode).toBe(404);

    const asParent = await api.app.inject({ method: "GET", url: `/api/lessons/${bookLessonId}/sources`, headers: headers(parent) });
    expect(asParent.statusCode).toBe(403);

    const anonymous = await api.app.inject({ method: "GET", url: `/api/lessons/${bookLessonId}/sources` });
    expect(anonymous.statusCode).toBe(401);
  });

  it("keeps the CSRF gate on writes only — GET needs no token", async () => {
    const res = await api.app.inject({ method: "GET", url: `/api/lessons/${bookLessonId}/sources`, headers: csrfHeaders(student) });
    expect(res.statusCode).toBe(200);
  });
});
