import { beforeAll, describe, expect, it } from "vitest";
import {
  csrfHeaders,
  headers,
  makeApp,
  registerParent,
  registerStudent,
  seedMiniCorpus,
  type AuthSession,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";

/**
 * PHASE 49 — the live turn.
 *
 * The contract worth protecting is not "text arrives early" (that is a
 * performance property nobody can assert offline) but the one that makes early
 * text safe to show: **the streamed words are the stored words.** A preview that
 * drifts from the record is worse than no preview, because the student reads the
 * preview, believes it, and the room then quietly changes it.
 */
describe("streamed tutor turn (PHASE 49)", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let s!: AuthSession;
  let sessionId!: string;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    s = await registerStudent(api.app, "stream-turn@test.local", undefined, undefined, corpus.gradeId);
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
  });

  interface StreamEvent {
    type: string;
    [k: string]: unknown;
  }

  /** Reads an NDJSON body into its events (the way the browser's reader does). */
  const events = (body: string): StreamEvent[] =>
    body
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as StreamEvent);

  const ask = async (content: string, extra: Record<string, unknown> = {}) => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages/stream`,
      headers: csrfHeaders(s),
      payload: { content, ...extra },
    });
    return res;
  };

  it("answers with a line-delimited stream whose preview equals the stored reply", async () => {
    const res = await ask("اشرح لي معنى الكسر البسيط");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("application/x-ndjson");

    const list = events(res.body);
    const types = list.map((e) => e.type);
    // The order is the whole point: the student is acknowledged first, then the
    // tutor writes, then the turn closes.
    expect(types[0]).toBe("user");
    expect(types).toContain("delta");
    expect(types[types.length - 1]).toBe("done");
    expect(list.some((e) => e.type === "error")).toBe(false);

    const preview = list
      .filter((e) => e.type === "delta")
      .map((e) => e.text as string)
      .join("");
    const done = list[list.length - 1]!;
    const stored = done.tutorMessage as { content: string };
    expect(preview.length).toBeGreaterThan(0);
    // Same text, in the same order, not merely a similar answer.
    expect(preview).toBe(stored.content);
  });

  it("stores exactly the pair it announced, and re-reading shows the same reply", async () => {
    const res = await ask("وماذا عن الكسر المركب؟");
    const list = events(res.body);
    const done = list[list.length - 1]!;
    const announcedUser = done.userMessage as { id: string; content: string };
    const announcedTutor = done.tutorMessage as { id: string; content: string };

    const reread = await api.app.inject({
      method: "GET",
      url: `/api/sessions/${sessionId}`,
      headers: csrfHeaders(s),
    });
    expect(reread.statusCode).toBe(200);
    const messages = (reread.json() as { messages: Array<{ id: string; role: string; content: string }> }).messages;
    const storedIds = messages.map((m) => m.id);
    // A streamed turn that stored its messages twice would show up here first.
    expect(new Set(storedIds).size).toBe(storedIds.length);
    const byId = new Map(messages.map((m) => [m.id, m]));
    expect(byId.get(announcedUser.id)?.content).toBe(announcedUser.content);
    expect(byId.get(announcedTutor.id)?.content).toBe(announcedTutor.content);
  });

  it("acknowledges the student before the tutor has said anything", async () => {
    const res = await ask("سؤال ثالث");
    const list = events(res.body);
    // The wait belongs to the tutor: the student's own words are already saved,
    // so there is no reason to keep them waiting for it.
    const first = list[0]!;
    expect(first.type).toBe("user");
    expect((first.message as { content: string }).content).toBe("سؤال ثالث");
  });

  it("refuses a non-student, before the stream starts", async () => {
    const parent = await registerParent(api.app, "stream-parent@test.local");
    // The route checks the role itself; a parent gets a normal JSON error, not
    // an empty stream they would have to read to discover.
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages/stream`,
      headers: headers(parent),
      payload: { content: "مرحبا" },
    });
    expect([401, 403]).toContain(res.statusCode);
  });

  it("reports an impossible turn in-band instead of pretending it worked", async () => {
    // An empty message is rejected by the turn itself. The response has already
    // begun by then, so the failure has to travel as an event — and the student
    // must not be left with a stream that simply stops.
    const res = await ask("   ");
    const list = events(res.body);
    expect(list.some((e) => e.type === "done")).toBe(false);
    const failure = list.find((e) => e.type === "error");
    expect(failure).toBeTruthy();
    expect(failure!.message).toBeTruthy();
  });
});
