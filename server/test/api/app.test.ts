import { afterEach, describe, expect, it } from "vitest";
import { registerStudent, login, csrfHeaders, headers, makeApp, seedMiniCorpus, type TestApi, type AuthSession, type MiniCorpus } from "../helpers.js";

let currentApi: TestApi | null = null;
afterEach(async () => {
  if (currentApi) {
    await currentApi.app.close();
    currentApi.db.sqlite.close();
    currentApi = null;
  }
});

let emailCounter = 0;
const uniq = () => `student${++emailCounter}@test.local`;

describe("auth API", () => {
  it("registers a student, sets the cookie and returns a CSRF token", async () => {
    const api = await makeApp();
    currentApi = api;
    const res = await api.app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: uniq(), password: "password-123", displayName: "أحمد" },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as { user: { email: string; student: { displayName: string } }; csrfToken: string };
    expect(body.user.email).toBeTruthy();
    expect(body.user.student.displayName).toBe("أحمد");
    expect(body.csrfToken).toMatch(/^[0-9a-f]{32}$/);
    expect(res.headers["set-cookie"]).toContain("alfarouq_session=");
    expect(res.headers["set-cookie"]).toContain("HttpOnly");
  });

  it("rejects duplicate emails with 409", async () => {
    const api = await makeApp();
    currentApi = api;
    const email = uniq();
    await api.app.inject({ method: "POST", url: "/api/auth/register", payload: { email, password: "password-123", displayName: "أحمد" } });
    const res2 = await api.app.inject({ method: "POST", url: "/api/auth/register", payload: { email, password: "password-123", displayName: "أحمد" } });
    expect(res2.statusCode).toBe(409);
  });

  it("rejects weak passwords with 400", async () => {
    const api = await makeApp();
    currentApi = api;
    const res = await api.app.inject({ method: "POST", url: "/api/auth/register", payload: { email: uniq(), password: "short", displayName: "أحمد" } });
    expect(res.statusCode).toBe(400);
  });

  it("logs in and returns the CSRF token; wrong password → 401", async () => {
    const api = await makeApp();
    currentApi = api;
    const email = uniq();
    await registerStudent(api.app, email);
    const ok = await login(api.app, email, "password-123");
    expect(ok.csrfToken).toMatch(/^[0-9a-f]{32}$/);
    const bad = await api.app.inject({ method: "POST", url: "/api/auth/login", payload: { email, password: "wrong-wrong" } });
    expect(bad.statusCode).toBe(401);
  });

  it("GET /api/auth/me works with a cookie and 401s without one", async () => {
    const api = await makeApp();
    currentApi = api;
    const s = await registerStudent(api.app, uniq());
    const me = await api.app.inject({ method: "GET", url: "/api/auth/me", headers: headers(s) });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBeTruthy();
    const anon = await api.app.inject({ method: "GET", url: "/api/auth/me" });
    expect(anon.statusCode).toBe(401);
  });
});

describe("curriculum API (public)", () => {
  it("serves the catalog shapes and validates query params", async () => {
    const api = await makeApp();
    currentApi = api;
    const countries = await api.app.inject({ method: "GET", url: "/api/curriculum/countries" });
    expect(countries.statusCode).toBe(200);
    expect(Array.isArray(countries.json().countries)).toBe(true);

    const missing = await api.app.inject({ method: "GET", url: "/api/curriculum/grades" });
    expect(missing.statusCode).toBe(400);
    expect(missing.json().error).toBeTruthy();
  });
});

describe("learning session vertical slice", () => {
  it("starts a session, chats with the tutor, and exposes progress", async () => {
    const api = await makeApp();
    currentApi = api;
    const corpus: MiniCorpus = await seedMiniCorpus(api);
    const s: AuthSession = await registerStudent(api.app, uniq());

    // 1) Start a session on lesson A.
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(s),
      payload: { curriculumId: corpus.curriculumId, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId: corpus.lessonA },
    });
    expect(start.statusCode).toBe(201);
    const session = start.json().session as { id: string; lessonId: string; status: string };
    expect(session.status).toBe("active");
    expect(session.lessonId).toBe(corpus.lessonA);

    // 2) Ask a curriculum question → tutor replies with RAG context.
    const msg = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${session.id}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "اشرح لي الجمع مع إعادة التجميع" },
    });
    expect(msg.statusCode).toBe(200);
    const turn = msg.json() as {
      userMessage: { role: string; content: string };
      tutorMessage: { role: string; content: string; kind: string };
      contextChunkCount: number;
      remainingBudget: number;
      safetyTripwire: boolean;
    };
    expect(turn.userMessage.role).toBe("user");
    expect(turn.tutorMessage.role).toBe("tutor");
    expect(turn.tutorMessage.content.length).toBeGreaterThan(0);
    expect(turn.contextChunkCount).toBeGreaterThan(0);
    expect(turn.remainingBudget).toBeGreaterThanOrEqual(0);
    expect(turn.safetyTripwire).toBe(false);

    // 3) Session history includes both messages.
    const history = await api.app.inject({ method: "GET", url: `/api/sessions/${session.id}`, headers: headers(s) });
    expect(history.statusCode).toBe(200);
    expect(history.json().messages.length).toBe(2);

    // 4) Progress endpoint reflects activity (usage counter exists).
    const progress = await api.app.inject({ method: "GET", url: "/api/progress/me", headers: headers(s) });
    expect(progress.statusCode).toBe(200);
    expect(typeof progress.json().tutorUsageToday).toBe("number");

    // 5) Ending the session.
    const end = await api.app.inject({ method: "POST", url: `/api/sessions/${session.id}/end`, headers: csrfHeaders(s) });
    expect(end.statusCode).toBe(200);

    // 6) A message on an ended session is rejected.
    const afterEnd = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${session.id}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "سؤال بعد النهاية" },
    });
    expect(afterEnd.statusCode).toBe(400);
  });
});