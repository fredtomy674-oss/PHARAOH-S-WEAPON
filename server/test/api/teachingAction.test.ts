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
import { studentProgress } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";
import type { TeachingAction } from "../../src/modules/tutor/teachingActions.js";
import type { PrerequisiteGraph } from "../../src/modules/progress/prerequisites.js";

/**
 * PHASE 93/95 — the adaptive teaching action, end to end.
 *
 * What is protected here:
 *  • The ENGINE (not the model) chooses the typed action, and its `concept` /
 *    prerequisite are derived from the lesson's *stored* concept order + the
 *    student's *real* mastery — never guessed.
 *  • The action is persisted with the tutor message and survives a reload.
 *  • The prerequisite graph endpoint returns the real order and real percentages,
 *    and is locked to the session's own student.
 */
describe("adaptive teaching action + prerequisite graph — API", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let s!: AuthSession;
  let sessionId!: string;

  const ask = (payload: Record<string, unknown>) =>
    api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload,
    });

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    s = await registerStudent(api.app, "teaching-action@test.local");
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(s),
      payload: {
        curriculumId: corpus.curriculumId,
        gradeId: corpus.gradeId,
        subjectId: corpus.subjectId,
        lessonId: corpus.lessonA,
      },
    });
    expect(start.statusCode).toBe(201);
    sessionId = (start.json() as { session: { id: string } }).session.id;

    // Real evidence: the student's grasp of lesson A's FIRST concept is weak.
    await api.db.db.insert(studentProgress).values({
      id: newId("prog"),
      studentId: s.studentId!,
      conceptId: corpus.conceptAId,
      mastery: 0.2,
      attempts: 3,
      correct: 1,
      lastSeenAt: new Date(),
      lastPracticedAt: new Date(),
    });
  });

  it("names the concept in focus from the lesson order (engine, not model)", async () => {
    const res = await ask({ content: "اشرح لي الجمع مع التجميع" });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as { tutorMessage: { teachingAction?: TeachingAction } };
    const action = turn.tutorMessage.teachingAction;
    expect(action).toBeTruthy();
    expect(action!.type).toBe("explain");
    expect(action!.concept).toBe("الجمع مع التجميع");
  });

  it("drops to the weak prerequisite when the NEXT concept's foundation is weak", async () => {
    // Confusion about the SECOND concept (c-a2) whose prerequisite (c-a1) is weak.
    const res = await ask({ content: "مش فاهم في الجمع مع إعادة التجميع" });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as { tutorMessage: { teachingAction?: TeachingAction } };
    const action = turn.tutorMessage.teachingAction;
    expect(action).toMatchObject({
      type: "review_prerequisite",
      concept: "الجمع مع إعادة التجميع",
      prerequisite: "الجمع مع التجميع",
      mastery: 0.2,
    });
  });

  it("persists the action with the message and re-reads it on reload", async () => {
    const history = await api.app.inject({
      method: "GET",
      url: `/api/sessions/${sessionId}`,
      headers: { cookie: s.cookie },
    });
    expect(history.statusCode).toBe(200);
    const messages = history.json().messages as Array<{ role: string; teachingAction?: TeachingAction }>;
    const actions = messages.filter((m) => m.role === "tutor" && m.teachingAction).map((m) => m.teachingAction!);
    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions.some((a) => a.type === "review_prerequisite")).toBe(true);
  });

  it("returns the real prerequisite graph with real mastery percentages", async () => {
    const res = await api.app.inject({
      method: "GET",
      url: `/api/progress/prerequisites/${corpus.lessonA}`,
      headers: { cookie: s.cookie },
    });
    expect(res.statusCode).toBe(200);
    const graph = (res.json() as { graph: PrerequisiteGraph }).graph;
    expect(graph.nodes.map((n) => n.title)).toEqual(["الجمع مع التجميع", "الجمع مع إعادة التجميع"]);
    expect(graph.edges).toEqual([{ from: corpus.conceptAId, to: corpus.conceptCId }]);
    const first = graph.nodes[0]!;
    expect(first).toMatchObject({ mastery: 0.2, percent: 20, level: "needs_review", labelAr: "يحتاج مراجعة" });
    // The second concept was never attempted — no fabricated 0.
    expect(graph.nodes[1]!.mastery).toBeNull();
    expect(graph.weakest?.conceptId).toBe(corpus.conceptAId);
  });

  it("locks the graph to the session's own student (a parent cannot read it)", async () => {
    const parent = await registerParent(api.app, "teaching-action-parent@test.local");
    const res = await api.app.inject({
      method: "GET",
      url: `/api/progress/prerequisites/${corpus.lessonA}`,
      headers: { cookie: parent.cookie },
    });
    expect(res.statusCode).toBe(403);
  });
});
