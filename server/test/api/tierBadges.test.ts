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
import { concepts, curriculumEnrollments, questions } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

let emailSeq = 0;
const nth = (n: number) => `tier-${n}@test.local`;

const mc = (options: string[], correctIndex: number) => JSON.stringify({ options, correctIndex });

/**
 * PHASE 31 — tiered mastery badges (D-028/D-030 deferred item «متقن 3/5
 * مفاهيم»). Mastering 3 distinct concepts earns «متقن 3 مفاهيم»; 5 earns
 * «متقن 5 مفاهيم». Driven through the real submit loop so the practice
 * evaluate hooks fire exactly as in production (black-box).
 */
describe("tiered mastery achievements (PHASE 31)", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let student!: AuthSession;

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
  });

  const answerCorrect = async (questionId: string): Promise<void> => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${questionId}/submit`,
      headers: csrfHeaders(student),
      payload: { optionIndex: 0 },
    });
    expect(res.statusCode).toBe(200);
  };

  const myAchievements = async () =>
    (await api.app.inject({ method: "GET", url: "/api/achievements/me", headers: csrfHeaders(student) })).json();

  it("mastering 3 concepts earns متقن 3 مفاهيم while متقن 5 مفاهيم stays locked", async () => {
    const ids = [corpus.questionA1Id, corpus.questionB1Id, corpus.questionC1Id];
    for (let round = 0; round < 3; round++) {
      for (const id of ids) await answerCorrect(id);
    }
    const body = await myAchievements();
    expect(body.total).toBe(10);
    const byCode = (code: string) => body.achievements.find((a: { code: string }) => a.code === code);
    expect(byCode("mastery_first").awardedAt).toBeTruthy();
    expect(byCode("mastery_three").awardedAt).toBeTruthy();
    expect(byCode("mastery_five").awardedAt).toBeNull();
  });

  it("mastering 2 more concepts earns متقن 5 مفاهيم", async () => {
    // Two extra lesson-A concepts, each with one easy MCQ, answered ×3.
    const extraIds: string[] = [];
    for (const tag of ["d", "e"]) {
      const concept = {
        id: newId("con"),
        lessonId: corpus.lessonA,
        code: `c-a-${tag}`,
        title: `مفهوم إضافي ${tag}`,
        description: `مفهوم إضافي للشارة المتدرجة ${tag}`,
      };
      const question = {
        id: newId("q"),
        curriculumId: corpus.curriculumId,
        lessonId: corpus.lessonA,
        conceptId: concept.id,
        difficulty: "easy" as const,
        type: "mcq" as const,
        content: `ما ناتج سؤال ${tag}؟`,
        explanation: "إجابة نموذجية.",
        optionsJson: mc(["الصحيح", "خطأ"], 0),
        answerKey: null,
        createdAt: new Date(),
      };
      await api.db.db.insert(concepts).values(concept);
      await api.db.db.insert(questions).values(question);
      extraIds.push(question.id);
    }
    for (let round = 0; round < 3; round++) {
      for (const id of extraIds) await answerCorrect(id);
    }
    const body = await myAchievements();
    expect(body.achievements.find((a: { code: string }) => a.code === "mastery_five").awardedAt).toBeTruthy();
    // The tier locks GET /me isolation already covered: earned stays per student.
    expect(body.total).toBe(10);
  });
});