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
const nth = (n: number) => `badge-${n}@test.local`;

interface AchievementView {
  code: string;
  title: string;
  awardedAt: string | null;
}

/**
 * PHASE 26 — the mastery engine now feeds achievements (D-028 deferred item):
 * «انطلاقة التمرين» on the first practice answer and «أول إتقان» on the first
 * concept reaching the «متقن» display level. Awarding is idempotent and
 * student-scoped — a classmate's activity never triggers someone else's badge.
 */
describe("practice + mastery achievements (PHASE 26)", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let student!: AuthSession; // actively practicing
  let bystander!: AuthSession; // never practices — isolation check

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    student = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    bystander = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    await api.db.db.insert(curriculumEnrollments).values({
      id: newId("enr"),
      studentId: student.studentId!,
      curriculumId: corpus.curriculumId,
      isActive: true,
      createdAt: new Date(),
    });
  });

  async function states(session: AuthSession): Promise<Record<string, boolean>> {
    const res = await api.app.inject({ method: "GET", url: "/api/achievements/me", headers: csrfHeaders(session) });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { achievements: AchievementView[] };
    const out: Record<string, boolean> = {};
    for (const a of body.achievements) {
      if (a.code === "practice_starter" || a.code === "mastery_first") out[a.code] = a.awardedAt !== null;
    }
    return out;
  }

  async function submit(questionId: string, optionIndex: number): Promise<void> {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${encodeURIComponent(questionId)}/submit`,
      payload: { optionIndex },
      headers: csrfHeaders(student),
    });
    expect(res.statusCode).toBe(200);
  }

  it("both new badges are listed but locked before any practice", async () => {
    const s = await states(student);
    expect(s).toEqual({ practice_starter: false, mastery_first: false });
  });

  it("the first practice answer earns «انطلاقة التمرين» (outcome ignored)", async () => {
    await submit(corpus.questionA1Id, 1); // wrong — but any attempt counts
    const s = await states(student);
    expect(s.practice_starter).toBe(true);
    expect(s.mastery_first).toBe(false);
  });

  it("«أول إتقان» is earned only when a concept reaches متقن (≥0.8)", async () => {
    // questionA1 wrong → 0.1; now raise it: 0.25 → 0.4 → ... need four more
    // CORRECT answers (easy +0.15 each): 0.25, 0.4, 0.55, 0.7, 0.85 → mastered.
    for (let i = 0; i < 5; i += 1) {
      await submit(corpus.questionA2Id, 0);
      const mid = await states(student);
      if (i < 4) expect(mid.mastery_first).toBe(false); // still not mastered
    }
    const s = await states(student);
    expect(s.mastery_first).toBe(true);
  });

  it("a classmate with no practice activity keeps both badges locked", async () => {
    const s = await states(bystander);
    expect(s).toEqual({ practice_starter: false, mastery_first: false });
  });
});