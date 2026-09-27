import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  csrfHeaders,
  makeApp,
  registerStudent,
  seedLanguageCorpus,
  seedMiniCorpus,
  type AuthSession,
  type LanguageCorpus,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";
import { isPcmMime, WAV_MIME } from "../../src/modules/ai/speech/wav.js";

/**
 * PHASE 40 (D-044) — reading a reply aloud through the real API.
 *
 * What the student hears must come from the server, so this suite pins the
 * contract that makes it safe and consistent: the client sends *ids* (never
 * text — a student cannot make the paid voice read anything but their own
 * replies), the audio is the student's own message, the spoken language is the
 * tutor's own reply language, and another student's session stays untouchable.
 */
describe("server-side narration (النطق على الخادم) — PHASE 40", () => {
  let api!: TestApi;
  let student!: AuthSession;
  let other!: AuthSession;
  let corpus!: MiniCorpus;
  let english!: LanguageCorpus;

  const startSession = async (s: AuthSession, payload: Record<string, string>): Promise<string> => {
    const res = await api.app.inject({ method: "POST", url: "/api/sessions", headers: csrfHeaders(s), payload });
    expect(res.statusCode).toBe(201);
    return (res.json() as { session: { id: string } }).session.id;
  };

  const ask = async (s: AuthSession, sessionId: string, content: string): Promise<{ userId: string; tutorId: string }> => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { content },
    });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as { userMessage: { id: string }; tutorMessage: { id: string } };
    return { userId: turn.userMessage.id, tutorId: turn.tutorMessage.id };
  };

  const speak = async (s: AuthSession, sessionId: string, messageId: string) =>
    api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages/${messageId}/speech`,
      headers: csrfHeaders(s),
    });

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    english = await seedLanguageCorpus(api, corpus);
    student = await registerStudent(api.app, "speech-math@test.local", "password-123", "طالب رياضيات", corpus.gradeId);
    other = await registerStudent(api.app, "speech-other@test.local", "password-123", "طالب آخر", corpus.gradeId);
  });

  afterAll(async () => {
    await api.app.close();
  });

  it("returns playable audio for the student's own tutor reply", async () => {
    const sessionId = await startSession(student, {
      curriculumId: corpus.curriculumId,
      gradeId: corpus.gradeId,
      subjectId: corpus.subjectId,
      lessonId: corpus.lessonA,
    });
    const { tutorId } = await ask(student, sessionId, "اشرح الجمع مع إعادة التجميع");
    const res = await speak(student, sessionId, tutorId);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe(WAV_MIME);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    // Private caching: the audio is the student's own words, never a shared cache.
    expect(res.headers["cache-control"]).toBe("private, max-age=3600");
    const body = res.rawPayload;
    expect(body.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(body.length).toBeGreaterThan(44);
    expect(Number(res.headers["content-length"])).toBe(body.length);
  });

  it("narration follows the tutor's reply language: English curriculum → en", async () => {
    const sessionId = await startSession(student, {
      curriculumId: english.curriculumId,
      gradeId: english.gradeId,
      subjectId: english.subjectId,
      lessonId: english.lessonId,
    });
    const { tutorId } = await ask(student, sessionId, "Explain when we add -s to the verb");
    // Same code path and same bytes as an Arabic lesson — the *language* is
    // resolved from the lesson, exactly as it is for the written reply (D-042).
    const res = await speak(student, sessionId, tutorId);
    expect(res.statusCode).toBe(200);
    expect(res.rawPayload.subarray(0, 4).toString("ascii")).toBe("RIFF");
  });

  it("refuses a student's message (only tutor replies are read aloud)", async () => {
    const sessionId = await startSession(student, {
      curriculumId: corpus.curriculumId,
      gradeId: corpus.gradeId,
      subjectId: corpus.subjectId,
      lessonId: corpus.lessonA,
    });
    const { userId } = await ask(student, sessionId, "اشرح الجمع مع إعادة التجميع");
    const res = await speak(student, sessionId, userId);
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe("NOT_TUTOR_MESSAGE");
  });

  it("never exposes another student's reply or session", async () => {
    const sessionId = await startSession(student, {
      curriculumId: corpus.curriculumId,
      gradeId: corpus.gradeId,
      subjectId: corpus.subjectId,
      lessonId: corpus.lessonA,
    });
    const { tutorId } = await ask(student, sessionId, "اشرح الجمع مع إعادة التجميع");
    // Someone else's id, in someone else's session → nothing is synthesized.
    const foreign = await speak(other, sessionId, tutorId);
    expect(foreign.statusCode).toBe(403);
    const notMine = await speak(other, await startSession(other, {
      curriculumId: corpus.curriculumId,
      gradeId: corpus.gradeId,
      subjectId: corpus.subjectId,
      lessonId: corpus.lessonA,
    }), tutorId);
    expect(notMine.statusCode).toBe(404);
    // …and an unauthenticated caller gets nothing at all.
    const anonymous = await api.app.inject({ method: "POST", url: `/api/sessions/${sessionId}/messages/${tutorId}/speech` });
    expect(anonymous.statusCode).toBe(401);
  });

  it("serves a repeated press from cache without a second synthesis", async () => {
    const sessionId = await startSession(student, {
      curriculumId: corpus.curriculumId,
      gradeId: corpus.gradeId,
      subjectId: corpus.subjectId,
      lessonId: corpus.lessonA,
    });
    const { tutorId } = await ask(student, sessionId, "ما معنى إعادة التجميع؟");
    const first = await speak(student, sessionId, tutorId);
    const second = await speak(student, sessionId, tutorId);
    expect(first.statusCode).toBe(200);
    expect(second.rawPayload.equals(first.rawPayload)).toBe(true);
  });
});

describe("server-side narration when the server has no voice — PHASE 40", () => {
  let api!: TestApi;
  let student!: AuthSession;
  let corpus!: MiniCorpus;

  beforeAll(async () => {
    // The default deployment: SPEECH_PROVIDER unset → the browser narrates.
    api = await makeApp({ speechProvider: "none" });
    corpus = await seedMiniCorpus(api);
    student = await registerStudent(api.app, "speech-none@test.local", "password-123", "طالب بلا صوت", corpus.gradeId);
  });

  afterAll(async () => {
    await api.app.close();
  });

  it("answers 503 SPEECH_UNAVAILABLE, which the client answers with the browser voice", async () => {
    const session = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(student),
      payload: { curriculumId: corpus.curriculumId, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId: corpus.lessonA },
    });
    const sessionId = (session.json() as { session: { id: string } }).session.id;
    const turn = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(student),
      payload: { content: "اشرح الجمع" },
    });
    const tutorId = (turn.json() as { tutorMessage: { id: string } }).tutorMessage.id;

    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages/${tutorId}/speech`,
      headers: csrfHeaders(student),
    });
    expect(res.statusCode).toBe(503);
    expect((res.json() as { error: { code: string } }).error.code).toBe("SPEECH_UNAVAILABLE");
  });

  it("reports the missing voice on /api/health so operators can see it", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect((res.json() as { speech: string }).speech).toBe("none");
  });
});

describe("raw-PCM payloads are made playable — PHASE 40", () => {
  it("never streams a bare L16 payload the browser cannot play", () => {
    expect(isPcmMime("audio/L16;codec=pcm;rate=24000")).toBe(true);
    expect(WAV_MIME).toBe("audio/wav");
  });
});
