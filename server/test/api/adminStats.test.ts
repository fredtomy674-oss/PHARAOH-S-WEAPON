import { beforeAll, describe, expect, it } from "vitest";
import {
  csrfHeaders,
  makeAdmin,
  makeApp,
  registerStudent,
  seedMiniCorpus,
  type AuthSession,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";

let emailSeq = 0;
const nth = (n: number) => `stats-${n}@test.local`;

/**
 * PHASE 17 — admin analytics (GET /api/admin/stats): pure aggregations over
 * existing tables, admin-only. Counts must reflect real seeded + created data.
 */
describe("admin analytics (GET /api/admin/stats) — PHASE 17", () => {
  let api!: TestApi;
  let admin!: AuthSession;
  let student!: AuthSession;
  let corpus!: MiniCorpus;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    admin = await makeAdmin(api.app, api.db);
    student = await registerStudent(api.app, nth(++emailSeq));
  });

  it("refuses students (403 FORBIDDEN) — admin-only endpoint", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/admin/stats", headers: csrfHeaders(student) });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("FORBIDDEN");
  });

  it("returns aggregated counts matching the seeded corpus and created activity", async () => {
    // 1) One active→ended session with two tutor turns (user+tutor = 4 messages).
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(student),
      payload: { curriculumId: corpus.curriculumId, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId: corpus.lessonA },
    });
    expect(start.statusCode).toBe(201);
    const sessionId = (start.json() as { session: { id: string } }).session.id;

    for (const content of ["ما ناتج جمع 487 و 358؟", "اشرح لي خطوة الاستلاف بمثال"]) {
      const turn = await api.app.inject({
        method: "POST",
        url: `/api/sessions/${sessionId}/messages`,
        headers: csrfHeaders(student),
        payload: { content },
      });
      expect(turn.statusCode).toBe(200);
    }
    const ended = await api.app.inject({ method: "POST", url: `/api/sessions/${sessionId}/end`, headers: csrfHeaders(student) });
    expect(ended.statusCode).toBe(200);

    // 2) Stats must reflect: 1 admin + 1 student, 1 session (ended), 4+ messages,
    //    the mini corpus documents (ready) with their chunks, 1 curriculum, 2 lessons.
    const res = await api.app.inject({ method: "GET", url: "/api/admin/stats", headers: csrfHeaders(admin) });
    expect(res.statusCode).toBe(200);
    const stats = (res.json() as { stats: { users: { total: number; students: number }; sessions: { total: number; active: number; ended: number }; messages: { total: number; user: number; tutor: number }; documents: { total: number; ready: number }; chunks: number; curricula: number; lessons: number } }).stats;

    expect(stats.users.total).toBe(2);
    expect(stats.users.students).toBe(1);
    expect(stats.sessions.total).toBe(1);
    expect(stats.sessions.active).toBe(0);
    expect(stats.sessions.ended).toBe(1);
    expect(stats.messages.total).toBeGreaterThanOrEqual(4);
    expect(stats.messages.user).toBe(2);
    expect(stats.messages.tutor).toBe(2);
    expect(stats.documents.total).toBe(2);
    expect(stats.documents.ready).toBe(2);
    expect(stats.chunks).toBeGreaterThan(0);
    expect(stats.curricula).toBe(1);
    expect(stats.lessons).toBe(2);
  });
});