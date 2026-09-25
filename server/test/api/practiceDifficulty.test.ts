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
import { curriculumEnrollments } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

let emailSeq = 0;
const nth = (n: number) => `diff-${n}@test.local`;

interface SubmitBody {
  correct: boolean;
  mastery: { score: number; level: string } | null;
}

/**
 * PHASE 26 — difficulty-aware grading: the first attempt starts at the same
 * 0.6/0.1 baseline, but follow-up deltas follow the question's difficulty
 * (hard: +0.2 / −0.15). Easy/medium deltas are already covered by the unit
 * suite + the PHASE 24 practice tests (easy fixtures).
 */
describe("difficulty-aware mastery grading (POST submit) — PHASE 26", () => {
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

  async function submit(questionId: string, optionIndex: number): Promise<SubmitBody> {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${encodeURIComponent(questionId)}/submit`,
      payload: { optionIndex },
      headers: csrfHeaders(student),
    });
    expect(res.statusCode).toBe(200);
    return res.json() as SubmitBody;
  }

  it("a hard question's first correct attempt uses the 0.6 baseline (difficulty-neutral start)", async () => {
    const body = await submit(corpus.questionC1Id, 0);
    expect(body.correct).toBe(true);
    expect(body.mastery!.score).toBeCloseTo(0.6, 2);
  });

  it("a second correct answer on the hard question adds the hard delta (+0.2 → 0.8)", async () => {
    const body = await submit(corpus.questionC1Id, 0);
    expect(body.mastery!.score).toBeCloseTo(0.8, 2);
    expect(body.mastery!.level).toBe("mastered");
  });

  it("a wrong answer on the hard question subtracts the hard penalty (−0.15 → 0.65)", async () => {
    const body = await submit(corpus.questionC1Id, 1);
    expect(body.correct).toBe(false);
    expect(body.mastery!.score).toBeCloseTo(0.65, 2);
  });
});