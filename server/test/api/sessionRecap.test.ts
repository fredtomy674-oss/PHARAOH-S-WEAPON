import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  csrfHeaders,
  headers,
  makeAdmin,
  makeApp,
  registerParent,
  registerStudent,
  seedMiniCorpus,
  type AuthSession,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";

const nth = (n: number) => `recap-${n}@test.local`;

interface RecapShape {
  headline: string;
  focus: string;
  lessonTitle: string | null;
  durationMinutes: number;
  userMessages: number;
  tutorMessages: number;
  attachmentCount: number;
  safetyFlagged: number;
  concepts: Array<{ title: string; attempts: number; correct: number }>;
  strengths: string[];
  suggestions: string[];
  fallback: boolean;
}

/** Distinctive body that must NEVER appear in any recap (readability check). */
const SECRET_MESSAGE = "المفتاح السري ٧٧٧٧٧ سبعة لا يظهر في الملخص أبدًا إطلاقًا";

/**
 * PHASE 29 (D-027) — safe session recap API: ownership-isolated (404 for other
 * students, 403 for non-students), deterministic with mock providers, null for
 * empty sessions, and verbatim-free against the real message bodies. Parents
 * get the same safe recap through their gated endpoint.
 */
describe("session recap (GET /api/sessions/:id/recap) — PHASE 29", () => {
  let api!: TestApi;
  let student!: AuthSession;
  let other!: AuthSession;
  let admin!: AuthSession;
  let corpus!: MiniCorpus;
  let sessionId = "";
  let emptySessionId = "";

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    student = await registerStudent(api.app, nth(1));
    other = await registerStudent(api.app, nth(2));
    admin = await makeAdmin(api.app, api.db);

    const begin = async (session: AuthSession): Promise<string> => {
      const res = await api.app.inject({
        method: "POST",
        url: "/api/sessions",
        headers: csrfHeaders(session),
        payload: { curriculumId: corpus.curriculumId, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId: corpus.lessonA },
      });
      expect(res.statusCode).toBe(201);
      return (res.json() as { session: { id: string } }).session.id;
    };

    sessionId = await begin(student);
    emptySessionId = await begin(student);

    // Two real tutor turns with a distinctive first message.
    for (const content of [SECRET_MESSAGE, "هل ناتج 487 زائد 358 يساوي 845 مباشرة؟"]) {
      const turn = await api.app.inject({
        method: "POST",
        url: `/api/sessions/${sessionId}/messages`,
        headers: csrfHeaders(student),
        payload: { content },
      });
      expect(turn.statusCode).toBe(200);
    }

    for (const id of [sessionId, emptySessionId]) {
      const end = await api.app.inject({ method: "POST", url: `/api/sessions/${id}/end`, headers: csrfHeaders(student) });
      expect(end.statusCode).toBe(200);
    }
  });

  afterAll(async () => {
    await api.app.close();
  });

  it("returns a deterministic, lesson-grounded recap for a student's own ended session", async () => {
    const res = await api.app.inject({ method: "GET", url: `/api/sessions/${sessionId}/recap`, headers: headers(student) });
    expect(res.statusCode).toBe(200);
    const { recap } = res.json() as { recap: RecapShape };

    expect(recap).not.toBeNull();
    expect(recap.lessonTitle).toBe("الجمع ضمن الأعداد حتى 999");
    expect(recap.headline).toContain("الجمع ضمن الأعداد حتى 999");
    expect(recap.userMessages).toBe(2);
    expect(recap.tutorMessages).toBe(2);
    expect(recap.attachmentCount).toBe(0);
    expect(recap.safetyFlagged).toBe(0);
    expect(recap.fallback).toBe(false);
    expect(recap.strengths.length).toBeGreaterThan(0);
    expect(recap.suggestions.length).toBeGreaterThan(0);

    // Deterministic with the mock provider: same session → identical recap.
    const again = await api.app.inject({ method: "GET", url: `/api/sessions/${sessionId}/recap`, headers: headers(student) });
    expect((again.json() as { recap: RecapShape }).recap).toEqual(recap);
  });

  it("never exposes any message content (no-verbatim guarantee)", async () => {
    const res = await api.app.inject({ method: "GET", url: `/api/sessions/${sessionId}/recap`, headers: headers(student) });
    const { recap } = res.json() as { recap: RecapShape };
    const rendered = [recap.headline, recap.focus, ...recap.strengths, ...recap.suggestions].join(" ");
    expect(rendered).not.toContain(SECRET_MESSAGE);
    expect(rendered).not.toContain("٧٧٧٧٧");
    expect(rendered).not.toContain(SECRET_MESSAGE.split(" ").slice(0, 3).join(" "));
  });

  it("returns null for a session with no messages", async () => {
    const res = await api.app.inject({ method: "GET", url: `/api/sessions/${emptySessionId}/recap`, headers: headers(student) });
    expect(res.statusCode).toBe(200);
    expect((res.json() as { recap: unknown }).recap).toBeNull();
  });

  it("isolates students: a different student gets 403 (session ownership)", async () => {
    const res = await api.app.inject({ method: "GET", url: `/api/sessions/${sessionId}/recap`, headers: headers(other) });
    expect(res.statusCode).toBe(403);
  });

  it("blocks non-students (admin) with 403", async () => {
    const res = await api.app.inject({
      method: "GET",
      url: `/api/sessions/${sessionId}/recap`,
      headers: headers({ cookie: admin.cookie, csrfToken: admin.csrfToken, userId: admin.userId } as AuthSession),
    });
    expect(res.statusCode).toBe(403);
    expect((res.json() as { error: { code: string } }).error.code).toBe("FORBIDDEN");
  });
});

describe("parent session recap (GET /api/parent/children/:id/sessions/:sid/recap) — PHASE 29", () => {
  let api!: TestApi;
  let student!: AuthSession;
  let parent!: AuthSession;
  let stranger!: AuthSession;
  let corpus!: MiniCorpus;
  let sessionId = "";

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    student = await registerStudent(api.app, nth(11));
    parent = await registerParent(api.app, nth(12));
    stranger = await registerParent(api.app, nth(13));

    const me = await api.app.inject({ method: "GET", url: "/api/auth/me", headers: headers(student) });
    const linkCode = (me.json() as { user: { linkCode: string } }).user.linkCode!;
    const link = await api.app.inject({
      method: "POST",
      url: "/api/parent/link",
      headers: csrfHeaders(parent),
      payload: { code: linkCode },
    });
    expect(link.statusCode).toBe(200);

    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(student),
      payload: { curriculumId: corpus.curriculumId, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId: corpus.lessonA },
    });
    sessionId = (start.json() as { session: { id: string } }).session.id;
    await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(student),
      payload: { content: SECRET_MESSAGE },
    });
    await api.app.inject({ method: "POST", url: `/api/sessions/${sessionId}/end`, headers: csrfHeaders(student) });
  });

  afterAll(async () => {
    await api.app.close();
  });

  it("a linked parent reads the same safe recap (metadata only)", async () => {
    const res = await api.app.inject({
      method: "GET",
      url: `/api/parent/children/${student.studentId!}/sessions/${sessionId}/recap`,
      headers: headers(parent),
    });
    expect(res.statusCode).toBe(200);
    const { recap } = res.json() as { recap: RecapShape };
    expect(recap.lessonTitle).toBe("الجمع ضمن الأعداد حتى 999");
    expect(recap.headline).toContain("الجمع ضمن الأعداد حتى 999");
    expect(recap.fallback).toBe(false);
    expect([recap.headline, recap.focus, ...recap.strengths, ...recap.suggestions].join(" ")).not.toContain(SECRET_MESSAGE);
  });

  it("an unlinked parent gets 404 (link gate before any read)", async () => {
    const res = await api.app.inject({
      method: "GET",
      url: `/api/parent/children/${student.studentId!}/sessions/${sessionId}/recap`,
      headers: headers(stranger),
    });
    expect(res.statusCode).toBe(404);
  });

  it("a parent cannot hit the student-endpoint recap directly (403)", async () => {
    const res = await api.app.inject({ method: "GET", url: `/api/sessions/${sessionId}/recap`, headers: headers(parent) });
    expect(res.statusCode).toBe(403);
  });
});