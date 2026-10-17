import { beforeAll, describe, expect, it } from "vitest";
import {
  headers,
  makeApp,
  registerParent,
  registerStudent,
  seedMiniCorpus,
  type AuthSession,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";
import { answers, questions } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

/**
 * PHASE 161 (W6) — GET /api/progress/me/mistakes
 *
 * The journey's «دفتر أخطائي» wiring: the student's OWN wrong MCQ picks grouped
 * per question (count, latest pick, concept, lesson). Correct answers, open
 * answers and other students' rows are all invisible — the notebook is own-data,
 * MCQ-only, and carries no free text.
 */

describe("mistakes notebook (GET /api/progress/me/mistakes) — PHASE 161", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let student!: AuthSession;
  let other!: AuthSession;
  let parent!: AuthSession;
  let openQuestionId!: string;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    student = await registerStudent(api.app, "mistakes-student@test.local", undefined, undefined, corpus.gradeId);
    other = await registerStudent(api.app, "mistakes-other@test.local", undefined, undefined, corpus.gradeId);
    parent = await registerParent(api.app, "mistakes-parent@test.local");

    // An open (free-text) question on the same lesson — its answers must never
    // enter the notebook (MCQ-only by design).
    openQuestionId = newId("q");
    await api.db.db.insert(questions).values({
      id: openQuestionId,
      curriculumId: corpus.curriculumId,
      lessonId: corpus.lessonA,
      conceptId: corpus.conceptAId,
      difficulty: "medium",
      type: "open",
      content: "اشرح خطوات جمع 487 و358.",
      explanation: "نبدأ من الآحاد.",
      optionsJson: null,
      answerKey: "نبدأ من الآحاد ثم العشرات.",
      createdAt: new Date(),
    });

    const base = Date.now() - 60_000;
    await api.db.db.insert(answers).values([
      // The student's own wrong picks: qA1 missed twice, qC1 once.
      { id: newId("ans"), questionId: corpus.questionA1Id, studentId: student.studentId!, content: "835", correct: 0, createdAt: new Date(base) },
      { id: newId("ans"), questionId: corpus.questionA1Id, studentId: student.studentId!, content: "745", correct: 0, createdAt: new Date(base + 2000) },
      { id: newId("ans"), questionId: corpus.questionC1Id, studentId: student.studentId!, content: "31", correct: 0, createdAt: new Date(base + 1000) },
      // A correct pick — not a mistake.
      { id: newId("ans"), questionId: corpus.questionA2Id, studentId: student.studentId!, content: "20", correct: 1, createdAt: new Date(base + 3000) },
      // A wrong OPEN answer — free text never enters the notebook.
      { id: newId("ans"), questionId: openQuestionId, studentId: student.studentId!, content: "لا أعرف", correct: 0, createdAt: new Date(base + 4000) },
      // Another student's mistake — must never leak across students.
      { id: newId("ans"), questionId: corpus.questionB1Id, studentId: other.studentId!, content: "خطأ آخر", correct: 0, createdAt: new Date(base + 5000) },
    ]);
  });

  it("groups the student's own wrong MCQ picks — count, latest pick, concept and lesson", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/progress/me/mistakes", headers: headers(student) });
    expect(res.statusCode).toBe(200);
    const { mistakes } = res.json() as {
      mistakes: Array<{ questionId: string; question: string; chosen: string; count: number; conceptTitle: string | null; lessonTitle: string | null }>;
    };

    expect(mistakes).toHaveLength(2);
    const first = mistakes[0]!;
    expect(first.questionId).toBe(corpus.questionA1Id);
    expect(first.count).toBe(2);
    // The latest wrong pick for qA1 is «745» (the newer row).
    expect(first.chosen).toBe("745");
    expect(first.conceptTitle).toBe("الجمع مع التجميع");
    expect(first.lessonTitle).toBe("الجمع ضمن الأعداد حتى 999");
    expect(first.question).toContain("487");

    const second = mistakes[1]!;
    expect(second.questionId).toBe(corpus.questionC1Id);
    expect(second.count).toBe(1);
    expect(second.chosen).toBe("31");

    // MCQ-only: the open question's row is never in the notebook.
    expect(mistakes.some((m) => m.questionId === openQuestionId)).toBe(false);
    // Correct answers and other students' rows are invisible.
    expect(mistakes.some((m) => m.questionId === corpus.questionA2Id)).toBe(false);
    expect(mistakes.some((m) => m.questionId === corpus.questionB1Id)).toBe(false);
  });

  it("answers 403 for a parent and 401 for anonymous visitors", async () => {
    const parentRes = await api.app.inject({ method: "GET", url: "/api/progress/me/mistakes", headers: headers(parent) });
    expect(parentRes.statusCode).toBe(403);

    const anon = await api.app.inject({ method: "GET", url: "/api/progress/me/mistakes" });
    expect(anon.statusCode).toBe(401);
  });
});
