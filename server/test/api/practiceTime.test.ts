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
import { answers, curriculumEnrollments, questions, studentProgress } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

let emailSeq = 0;
const nth = (n: number) => `time-${n}@test.local`;

const submitMcq = (api: TestApi, s: AuthSession, questionId: string, optionIndex: number, timeTakenSeconds?: unknown) =>
  api.app.inject({
    method: "POST",
    url: `/api/practice/questions/${questionId}/submit`,
    headers: csrfHeaders(s),
    payload: { optionIndex, ...(timeTakenSeconds !== undefined ? { timeTakenSeconds } : {}) },
  });

/**
 * PHASE 31 — answer-time-aware mastery (D-028/D-030 deferred item «زمن الإجابة
 * في معادلة الإتقان»). The client measures display→submit seconds; the server
 * stores them on the answers row and scales the difficulty delta by speed band
 * (fast 1.25×, normal 1×, slow 0.75×, unknown 1×) on EXISTING rows. First
 * attempts stay neutral (0.6 / 0.1), malformed/out-of-range times are dropped,
 * and open answers never record time.
 */
describe("answer-time aware practice (PHASE 31)", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let fast!: AuthSession;
  let slow!: AuthSession;
  let weird!: AuthSession;
  let open!: AuthSession;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    fast = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    slow = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    weird = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    open = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    for (const s of [fast, slow, weird, open]) {
      await api.db.db.insert(curriculumEnrollments).values({
        id: newId("enr"),
        studentId: s.studentId!,
        curriculumId: corpus.curriculumId,
        isActive: true,
        createdAt: new Date(),
      });
    }
  });

  const answerSecondsOf = async (studentId: string, questionId: string): Promise<number | null | undefined> => {
    const row = await api.db.db
      .select({ seconds: answers.answerSeconds })
      .from(answers)
      .where(and(eq(answers.studentId, studentId), eq(answers.questionId, questionId)))
      .get();
    return row?.seconds;
  };

  it("stores answerSeconds and makes fast series master faster than slow ones", async () => {
    // fast student: easy correct ×2 at 3s → 0.6 then round(0.6 + 0.15×1.25) = 0.79
    const f1 = await submitMcq(api, fast, corpus.questionA1Id, 0, 3);
    expect(f1.json().mastery.score).toBe(0.6); // first attempt neutral
    const f2 = await submitMcq(api, fast, corpus.questionA2Id, 0, 3);
    expect(f2.json().mastery.score).toBe(0.79);

    // slow student: easy correct ×2 at 500s → 0.6 then round(0.6 + 0.15×0.75) = 0.71
    const s1 = await submitMcq(api, slow, corpus.questionA1Id, 0, 500);
    expect(s1.json().mastery.score).toBe(0.6);
    const s2 = await submitMcq(api, slow, corpus.questionA2Id, 0, 500);
    expect(s2.json().mastery.score).toBe(0.71);

    // quick confidence is a STRONGER signal: fast > slow at equal correctness.
    expect(f2.json().mastery.score).toBeGreaterThan(s2.json().mastery.score);

    expect(await answerSecondsOf(fast.studentId!, corpus.questionA1Id)).toBe(3);
    expect(await answerSecondsOf(fast.studentId!, corpus.questionA2Id)).toBe(3);
    expect(await answerSecondsOf(slow.studentId!, corpus.questionA1Id)).toBe(500);
    expect(await answerSecondsOf(slow.studentId!, corpus.questionA2Id)).toBe(500);
  });

  it("keeps the first attempt neutral whatever the speed", async () => {
    // brisk start (1s) on a fresh concept → still exactly 0.6
    const w = await submitMcq(api, weird, corpus.questionB1Id, 0, 1);
    expect(w.json().mastery.score).toBe(0.6);
    // hesitant start (600s) on another fresh hard concept → still exactly 0.6
    const f = await submitMcq(api, fast, corpus.questionC1Id, 0, 600);
    expect(f.json().mastery.score).toBe(0.6);
  });

  it("drops malformed and out-of-range times (unit multiplier)", async () => {
    const a = await submitMcq(api, weird, corpus.questionA1Id, 0, "3"); // non-number
    expect(a.statusCode).toBe(200);
    expect(a.json().mastery.score).toBe(0.6);
    expect(await answerSecondsOf(weird.studentId!, corpus.questionA1Id)).toBeNull();

    const b = await submitMcq(api, weird, corpus.questionA2Id, 0, 601); // > 600
    expect(b.json().mastery.score).toBe(0.75); // 0.6 + 0.15 (unit multiplier)
    expect(await answerSecondsOf(weird.studentId!, corpus.questionA2Id)).toBeNull();

    const c = await submitMcq(api, weird, corpus.questionA1Id, 0, 2.5); // non-integer
    expect(c.statusCode).toBe(200);
    expect(await answerSecondsOf(weird.studentId!, corpus.questionA1Id)).toBeNull();
  });

  it("open answers never record answer time", async () => {
    const gen = await api.app.inject({
      method: "POST",
      url: "/api/practice/generate",
      headers: csrfHeaders(open),
      payload: { conceptId: corpus.conceptBId, kind: "open" },
    });
    expect(gen.statusCode).toBe(200);
    const row = (await api.db.db
      .select()
      .from(questions)
      .where(and(eq(questions.type, "open"), eq(questions.conceptId, corpus.conceptBId)))
      .get())!;

    const res = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${row.id}/submit`,
      headers: csrfHeaders(open),
      payload: { answer: row.answerKey!, timeTakenSeconds: 3 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().correct).toBe(true);
    expect(await answerSecondsOf(open.studentId!, row.id)).toBeNull();

    // grading is complete and mastery still moved at the unit band (first = neutral).
    const prog = await api.db.db
      .select({ mastery: studentProgress.mastery })
      .from(studentProgress)
      .where(and(eq(studentProgress.studentId, open.studentId!), eq(studentProgress.conceptId, corpus.conceptBId)))
      .get();
    expect(prog?.mastery).toBe(0.6);
  });
});