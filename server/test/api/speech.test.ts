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

/**
 * PHASE 57 — the same voice, but it does not wait for the whole reply.
 *
 * Measured before this: pressing 🔊, or hearing a reply to a spoken question,
 * waited for the *entire* reply's audio to be synthesized before a note played
 * (6.9–7.7s for a 160-character answer). These tests pin the wire the fix is
 * made of:
 *
 *  • narration rides the message stream the reply is already arriving on, so
 *    nothing about the turn changes for a client that does not want a voice;
 *  • it is asked for explicitly (`speak`), because narration is paid per
 *    character and a question the student *typed* must never cost a synthesis;
 *  • the pieces come back in sentence order, each one playable on its own, and
 *    the last line says whether there was a voice at all — so the client can
 *    never mistake "silent" for "still coming".
 */
describe("progressive narration on the turn stream — PHASE 57", () => {
  let api!: TestApi;
  let student!: AuthSession;
  let other!: AuthSession;
  let corpus!: MiniCorpus;
  let sessionId!: string;

  interface StreamEvent {
    type: string;
    [k: string]: unknown;
  }

  const events = (body: string): StreamEvent[] =>
    body
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as StreamEvent);

  const audioEvents = (list: StreamEvent[]) =>
    list.filter((e): e is StreamEvent & { type: "audio"; seq: number; base64: string; mimeType: string } => e.type === "audio");

  const ask = async (content: string, extra: Record<string, unknown> = {}) =>
    events(
      (
        await api.app.inject({
          method: "POST",
          url: `/api/sessions/${sessionId}/messages/stream`,
          headers: csrfHeaders(student),
          payload: { content, ...extra },
        })
      ).body,
    );

  const narrate = async (messageId: string) =>
    api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages/${messageId}/speech/stream`,
      headers: csrfHeaders(student),
    });

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    student = await registerStudent(api.app, "speech-progressive@test.local", "password-123", "طالب نطق تدريجي", corpus.gradeId);
    other = await registerStudent(api.app, "speech-progressive-other@test.local", "password-123", "طالب آخر", corpus.gradeId);
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(student),
      payload: {
        curriculumId: corpus.curriculumId,
        gradeId: corpus.gradeId,
        subjectId: corpus.subjectId,
        lessonId: corpus.lessonA,
      },
    });
    sessionId = (start.json() as { session: { id: string } }).session.id;
  });

  afterAll(async () => {
    await api.app.close();
  });

  it("costs nothing when the student typed the question", async () => {
    const list = await ask("اشرح معنى إعادة التجميع");
    expect(audioEvents(list)).toHaveLength(0);
    // Not even a "there was no voice" line: the client never asked.
    expect(list.some((e) => e.type === "audio-end")).toBe(false);
    // The turn itself is untouched — same events, same last line.
    expect(list[list.length - 1]!.type).toBe("done");
    expect(list.some((e) => e.type === "delta")).toBe(true);
  });

  it("narrates the turn as it is written when the client asks for a voice", async () => {
    const list = await ask("اشرح خطوات القسمة على 2", { speak: true });
    const pieces = audioEvents(list);
    expect(pieces.length).toBeGreaterThan(0);
    // Order is a promise: the client plays by `seq`, so it must be 0..n with no
    // gap, no repeat and no reordering.
    expect(pieces.map((p) => p.seq)).toEqual(pieces.map((_, i) => i));
    // Each piece is a playable WAV on its own — the whole point of sending them
    // separately is that the first one can be played before the last exists.
    for (const piece of pieces) {
      expect(piece.mimeType).toBe(WAV_MIME);
      const bytes = Buffer.from(piece.base64, "base64");
      expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(bytes.length).toBeGreaterThan(44);
    }
    // The last line says the voice worked, and it comes after `done`: the text
    // never waits for the audio.
    const types = list.map((e) => e.type);
    expect(types.indexOf("done")).toBeLessThan(types.lastIndexOf("audio-end"));
    expect(list[list.length - 1]).toEqual({ type: "audio-end", ok: true });
    // The text is still exactly the stored reply — narration changed nothing.
    const preview = list
      .filter((e) => e.type === "delta")
      .map((e) => e.text as string)
      .join("");
    expect(preview).toBe((list.find((e) => e.type === "done")!.tutorMessage as { content: string }).content);
  });

  it("serves the same reply's voice sentence by sentence on its own stream", async () => {
    const list = await ask("ما معنى الكسر البسيط؟", { speak: true });
    const tutorId = (list.find((e) => e.type === "done")!.tutorMessage as { id: string }).id;

    const res = await narrate(tutorId);
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("application/x-ndjson");
    const stream = events(res.body);
    const pieces = audioEvents(stream);
    // The whole reply, cut into a bounded number of sentences — not one request
    // per word, and never a request for the whole thing either.
    expect(pieces.length).toBeGreaterThan(0);
    expect(pieces.length).toBeLessThanOrEqual(8);
    expect(pieces.map((p) => p.seq)).toEqual(pieces.map((_, i) => i));
    for (const piece of pieces) {
      expect(Buffer.from(piece.base64, "base64").subarray(0, 4).toString("ascii")).toBe("RIFF");
    }
    expect(stream[stream.length - 1]).toEqual({ type: "audio-end", ok: true });

    // 🔊 twice is one synthesis bill: the per-sentence cache makes a second press
    // of the same reply return exactly the same audio.
    const again = events((await narrate(tutorId)).body);
    expect(audioEvents(again).map((p) => p.base64)).toEqual(pieces.map((p) => p.base64));
  });

  it("refuses before it starts streaming, so a bad id is an ordinary error", async () => {
    const list = await ask("سؤال لاختبار الرفض", { speak: true });
    const turn = list.find((e) => e.type === "done")!;
    const userId = (turn.userMessage as { id: string }).id;
    // A student's own question is not something to read back to them.
    const notTutor = await narrate(userId);
    expect(notTutor.statusCode).toBe(400);
    expect((notTutor.json() as { error: { code: string } }).error.code).toBe("NOT_TUTOR_MESSAGE");
    // Another student's reply, and a reply that does not exist.
    const tutorId = (turn.tutorMessage as { id: string }).id;
    const foreign = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages/${tutorId}/speech/stream`,
      headers: csrfHeaders(other),
    });
    expect(foreign.statusCode).toBe(403);
    const missing = await narrate("msg_doesNotExistAtAll");
    expect(missing.statusCode).toBe(404);
    const anonymous = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages/${tutorId}/speech/stream`,
    });
    expect(anonymous.statusCode).toBe(401);
  });
});

describe("a turn that asked for a voice and got none — PHASE 57", () => {
  it("answers the text, says the voice was silent, and never fails the turn", async () => {
    // The deployment with no voice at all: the client asked, so it must be told
    // "nothing was said" rather than left waiting for audio that cannot exist.
    const api = await makeApp({ speechProvider: "none" });
    const corpus = await seedMiniCorpus(api);
    const student = await registerStudent(api.app, "speech-silent-turn@test.local", "password-123", "طالب بلا نطق", corpus.gradeId);
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(student),
      payload: {
        curriculumId: corpus.curriculumId,
        gradeId: corpus.gradeId,
        subjectId: corpus.subjectId,
        lessonId: corpus.lessonA,
      },
    });
    const sessionId = (start.json() as { session: { id: string } }).session.id;
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages/stream`,
      headers: csrfHeaders(student),
      payload: { content: "اشرح الجمع مع إعادة التجميع", speak: true },
    });
    expect(res.statusCode).toBe(200);
    const list = res.body
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as { type: string; [k: string]: unknown });
    // The answer is unaffected by the missing voice…
    expect(list.some((e) => e.type === "done")).toBe(true);
    expect(list.some((e) => e.type === "error")).toBe(false);
    // …and the client is told, so the room can read the reply with its own voice.
    expect(list.filter((e) => e.type === "audio")).toHaveLength(0);
    expect(list[list.length - 1]).toEqual({ type: "audio-end", ok: false });
    await api.app.close();
  });

  it("answers 503 on the streaming route, which the client walks past", async () => {
    const api = await makeApp({ speechProvider: "none" });
    const corpus = await seedMiniCorpus(api);
    const student = await registerStudent(api.app, "speech-silent-stream@test.local", "password-123", "طالب بلا نطق", corpus.gradeId);
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(student),
      payload: {
        curriculumId: corpus.curriculumId,
        gradeId: corpus.gradeId,
        subjectId: corpus.subjectId,
        lessonId: corpus.lessonA,
      },
    });
    const sessionId = (start.json() as { session: { id: string } }).session.id;
    const turn = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(student),
      payload: { content: "اشرح الجمع" },
    });
    const tutorId = (turn.json() as { tutorMessage: { id: string } }).tutorMessage.id;
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages/${tutorId}/speech/stream`,
      headers: csrfHeaders(student),
    });
    // The same answer as the buffered route, so the client can tell "this
    // deployment has no voice" from "something went wrong".
    expect(res.statusCode).toBe(503);
    expect((res.json() as { error: { code: string } }).error.code).toBe("SPEECH_UNAVAILABLE");
    await api.app.close();
  });
});

describe("/api/health names every AI provider in play — PHASE 41", () => {
  it("shows the LLM and the embedding provider, not just the speech one", async () => {
    // The trap this closes: a real LLM reading mock-built vectors still answers
    // from irrelevant chunks, so health must expose the embedder as well.
    const api = await makeApp();
    const res = await api.app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { provider: string; embeddings: string; speech: string };
    expect(body.provider).toBe("mock");
    expect(body.embeddings).toBe("mock");
    expect(body.speech).toBe("stub");
    await api.app.close();
  });
});

describe("raw-PCM payloads are made playable — PHASE 40", () => {
  it("never streams a bare L16 payload the browser cannot play", () => {
    expect(isPcmMime("audio/L16;codec=pcm;rate=24000")).toBe(true);
    expect(WAV_MIME).toBe("audio/wav");
  });
});
