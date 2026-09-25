import { beforeAll, describe, expect, it } from "vitest";
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
import { curriculumEnrollments } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

let emailSeq = 0;
const nth = (n: number) => `plan-${n}@test.local`;

interface PlanRow {
  conceptId: string;
  code: string;
  title: string;
  lessonId: string | null;
  lessonTitle: string | null;
  mastery: number;
  decayedMastery: number;
  level: string;
  labelAr: string;
  trend: string;
  attempts: number;
  correct: number;
  daysSinceLastPractice: number;
  availableQuestions: number;
}

/**
 * PHASE 25 — the practice plan endpoint: every tracked concept ranked
 * weakest-first (decayed mastery, then staleness), decorated with its lesson
 * and the number of practice questions available in the student's enrolled
 * curricula. Read-only, student-scoped, never leaks the answer key.
 */
describe("practice plan (GET /api/practice/plan) — PHASE 25", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let student!: AuthSession; // enrolled in the corpus curriculum
  let notEnrolled!: AuthSession; // tracks a concept but is NOT enrolled (count scope)
  let parent!: AuthSession;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    student = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    notEnrolled = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);
    parent = await registerParent(api.app, nth(++emailSeq));
    await api.db.db.insert(curriculumEnrollments).values({
      id: newId("enr"),
      studentId: student.studentId!,
      curriculumId: corpus.curriculumId,
      isActive: true,
      createdAt: new Date(),
    });
  });

  it("returns an empty plan for a student with no tracked concepts yet", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/practice/plan", headers: csrfHeaders(student) });
    expect(res.statusCode).toBe(200);
    expect((res.json() as { plan: PlanRow[] }).plan).toEqual([]);
  });

  it("ranks a tracked weak concept first with lesson + available questions", async () => {
    // First attempt, wrong → mastery 0.1 (needs review).
    await api.memory.recordAssessment({ studentId: student.studentId!, conceptId: corpus.conceptAId, correct: false, type: "exercise" });

    const res = await api.app.inject({ method: "GET", url: "/api/practice/plan", headers: csrfHeaders(student) });
    expect(res.statusCode).toBe(200);
    const { plan } = res.json() as { plan: PlanRow[] };
    expect(plan).toHaveLength(1);
    expect(plan[0]!.conceptId).toBe(corpus.conceptAId);
    expect(plan[0]!.level).toBe("needs_review");
    expect(plan[0]!.labelAr).toBeTruthy();
    expect(plan[0]!.lessonId).toBe(corpus.lessonA);
    expect(plan[0]!.lessonTitle).toBe("الجمع ضمن الأعداد حتى 999");
    expect(plan[0]!.availableQuestions).toBe(2); // questionA1 + questionA2
    expect(plan[0]!.attempts).toBe(1);
    expect(plan[0]!.correct).toBe(0);
    expect(plan[0]!.decayedMastery).toBeLessThanOrEqual(plan[0]!.mastery);
    // The plan is metadata-only — never leaks options or the key.
    expect(JSON.stringify(plan)).not.toContain("correctIndex");
    expect(JSON.stringify(plan)).not.toContain("answerKey");
    expect(JSON.stringify(plan)).not.toContain("options");
  });

  it("orders the weakest concept first when several are tracked", async () => {
    // Raise conceptA (0.1 → 0.55) with three correct exercises, then weaken conceptB (0.1).
    for (let i = 0; i < 3; i += 1) {
      await api.memory.recordAssessment({ studentId: student.studentId!, conceptId: corpus.conceptAId, correct: true, type: "exercise" });
    }
    await api.memory.recordAssessment({ studentId: student.studentId!, conceptId: corpus.conceptBId, correct: false, type: "exercise" });

    const res = await api.app.inject({ method: "GET", url: "/api/practice/plan", headers: csrfHeaders(student) });
    const { plan } = res.json() as { plan: PlanRow[] };
    expect(plan).toHaveLength(2);
    expect(plan[0]!.conceptId).toBe(corpus.conceptBId); // 0.1 < 0.55
    expect(plan[1]!.conceptId).toBe(corpus.conceptAId);
    expect(plan[0]!.availableQuestions).toBe(1); // questionB1
  });

  it("counts available questions only within enrolled curricula (0 when not enrolled)", async () => {
    await api.memory.recordAssessment({ studentId: notEnrolled.studentId!, conceptId: corpus.conceptAId, correct: true, type: "exercise" });
    const res = await api.app.inject({ method: "GET", url: "/api/practice/plan", headers: csrfHeaders(notEnrolled) });
    expect(res.statusCode).toBe(200);
    const { plan } = res.json() as { plan: PlanRow[] };
    expect(plan).toHaveLength(1);
    expect(plan[0]!.conceptId).toBe(corpus.conceptAId);
    expect(plan[0]!.availableQuestions).toBe(0); // tracked, but no enrollment → nothing counts
  });

  it("blocks parents from the plan endpoint", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/practice/plan", headers: csrfHeaders(parent) });
    expect(res.statusCode).toBe(403);
  });
});