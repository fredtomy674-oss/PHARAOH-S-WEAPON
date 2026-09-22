import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { makeApp, seedMiniCorpus, registerStudent, csrfHeaders, type AuthSession, type MiniCorpus, type TestApi } from "../helpers.js";
import { IMAGE_READ_MARKER } from "../../src/modules/ai/providers/mock.js";

/** 1x1 transparent PNG (≈120 bytes base64, well under the 1 KB test cap). */
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const nth = (n: number) => `vision-${n}@test.local`;

describe("vision upload (سؤال مصور) — API", () => {
  let api!: TestApi;
  let s!: AuthSession;
  let corpus!: MiniCorpus;
  let sessionId!: string;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    s = await registerStudent(api.app, nth(1));
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(s),
      payload: { curriculumId: corpus.curriculumId, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId: corpus.lessonA },
    });
    expect(start.statusCode).toBe(201);
    sessionId = start.json().session.id as string;
  });

  afterAll(async () => {
    api.app.close();
  });

  it("attaches a photo, keeps RAG grounding, and the tutor acknowledges it", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "حل السؤال الموجود في الصورة", image: { dataUrl: TINY_PNG, fileName: "question.png" } },
    });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as {
      userMessage: { attachments: Array<{ id: string; mimeType: string; fileName: string | null; sizeBytes: number }> };
      tutorMessage: { content: string };
      contextChunkCount: number;
    };
    expect(turn.userMessage.attachments).toHaveLength(1);
    const att = turn.userMessage.attachments[0]!;
    expect(att.mimeType).toBe("image/png");
    expect(att.fileName).toBe("question.png");
    expect(att.sizeBytes).toBeGreaterThan(0);
    expect(turn.tutorMessage.content).toContain(IMAGE_READ_MARKER);
    // Grounding is preserved: the text question still drives retrieval.
    expect(turn.contextChunkCount).toBeGreaterThan(0);
  });

  it("accepts a photo-only message (no text) and still retrieves lesson context", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { image: { dataUrl: TINY_PNG } },
    });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as { tutorMessage: { content: string }; contextChunkCount: number };
    expect(turn.tutorMessage.content).toContain(IMAGE_READ_MARKER);
    expect(turn.contextChunkCount).toBeGreaterThan(0);
  });

  it("rejects empty messages with no image", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("BAD_REQUEST");
  });

  it("rejects unsupported image types with a clear error", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "اقرأ هذا", image: { dataUrl: "data:application/pdf;base64,JVBERi0xLjQK" } },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("UNSUPPORTED_IMAGE_TYPE");
  });

  it("rejects images above the configured size cap", async () => {
    // ~1500 decoded bytes > the 1 KB cap set for tests.
    const big = `data:image/png;base64,${"A".repeat(2200)}`;
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "اقرأ هذا", image: { dataUrl: big } },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("IMAGE_TOO_LARGE");
  });

  it("serves the attachment to its owner with viewer-safe headers", async () => {
    const history = await api.app.inject({ method: "GET", url: `/api/sessions/${sessionId}`, headers: { cookie: s.cookie } });
    const withAtt = (history.json().messages as Array<{ attachments: Array<{ id: string }> }>).find((m) => m.attachments.length > 0);
    expect(withAtt).toBeDefined();
    const attId = withAtt!.attachments[0]!.id;

    const res = await api.app.inject({
      method: "GET",
      url: `/api/sessions/${sessionId}/attachments/${attId}`,
      headers: { cookie: s.cookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["content-security-policy"]).toContain("sandbox");
    expect(res.rawPayload.length).toBeGreaterThan(0);
  });

  it("does not leak attachments across students", async () => {
    const history = await api.app.inject({ method: "GET", url: `/api/sessions/${sessionId}`, headers: { cookie: s.cookie } });
    const withAtt = (history.json().messages as Array<{ attachments: Array<{ id: string }> }>).find((m) => m.attachments.length > 0);
    const attId = withAtt!.attachments[0]!.id;

    const other = await registerStudent(api.app, nth(2));
    const res = await api.app.inject({
      method: "GET",
      url: `/api/sessions/${sessionId}/attachments/${attId}`,
      headers: { cookie: other.cookie },
    });
    expect([403, 404]).toContain(res.statusCode);
  });
});