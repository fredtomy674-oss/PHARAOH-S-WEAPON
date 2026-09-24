import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { messageAttachments } from "../../src/db/schema.js";
import { makeApp, seedMiniCorpus, registerStudent, csrfHeaders, type AuthSession, type MiniCorpus, type TestApi } from "../helpers.js";
import { DOCUMENT_READ_MARKER, OCR_TEXT_MARKER } from "../../src/modules/ai/providers/mock.js";

const fixturesDir = new URL("../../../e2e/fixtures/", import.meta.url);
const readFixture = (name: string): Buffer => readFileSync(fileURLToPath(new URL(name, fixturesDir)));
const toDataUrl = (bytes: Buffer, mime: string): string => `data:${mime};base64,${bytes.toString("base64")}`;

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const nth = (n: number) => `doc-${n}@test.local`;

interface TurnShape {
  userMessage: { id: string; content: string; attachments: Array<{ id: string; mimeType: string; fileName: string | null; textChars?: number; truncated?: boolean; ocr?: boolean }> };
  tutorMessage: { content: string };
  contextChunkCount: number;
  safetyTripwire: boolean;
  ocrUsed?: boolean;
}

describe("document upload (ملف سؤال في الدردشة) — API", () => {
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

  it("attaches a PDF, extracts its text, keeps RAG grounding, and the tutor acknowledges it", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: {
        content: "حل السؤال الموجود في الملف المرفق",
        document: { dataUrl: toDataUrl(readFixture("question.pdf"), PDF_MIME), fileName: "question.pdf" },
      },
    });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as TurnShape;
    expect(turn.userMessage.attachments).toHaveLength(1);
    const att = turn.userMessage.attachments[0]!;
    expect(att.mimeType).toBe(PDF_MIME);
    expect(att.fileName).toBe("question.pdf");
    expect(att.textChars).toBeGreaterThan(0);
    // The extractor output travels to the model (deterministic echo)…
    expect(turn.tutorMessage.content).toContain(DOCUMENT_READ_MARKER);
    expect(turn.tutorMessage.content).toContain("TutorFixturePDF 123");
    // …while RAG stays grounded in the lesson curriculum.
    expect(turn.tutorMessage.content).toContain("وفقًا لمحتوى الدرس");
    expect(turn.contextChunkCount).toBeGreaterThan(0);

    // Persisted with the extracted text for audit/history.
    const row = api.db.db.select().from(messageAttachments).where(eq(messageAttachments.messageId, turn.userMessage.id)).get();
    expect(row?.extractedText).toContain("TutorFixturePDF 123");
  });

  it("accepts a document-only turn (no typed text) and still grounds the reply", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { document: { dataUrl: toDataUrl(readFixture("question.docx"), DOCX_MIME), fileName: "questions.docx" } },
    });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as TurnShape;
    expect(turn.userMessage.content).toBe("");
    expect(turn.tutorMessage.content).toContain(DOCUMENT_READ_MARKER);
    expect(turn.tutorMessage.content).toContain("TutorFixtureDOCX 456");
    expect(turn.tutorMessage.content).toContain("وفقًا لمحتوى الدرس");
    expect(turn.contextChunkCount).toBeGreaterThan(0);
    expect(turn.userMessage.attachments[0]!.textChars).toBeGreaterThan(0);
  });

  it("rejects attaching an image and a document together", async () => {
    const tinyPng =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "سؤال", image: { dataUrl: tinyPng }, document: { dataUrl: toDataUrl(readFixture("question.pdf"), PDF_MIME) } },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("MULTIPLE_ATTACHMENTS");
  });

  it("rejects unsupported document mime types with a clear error", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "اقرأ هذا", document: { dataUrl: `data:application/zip;base64,${Buffer.from("x").toString("base64")}`, fileName: "x.zip" } },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("UNSUPPORTED_DOCUMENT_TYPE");
  });

  it("rejects files above the configured size cap", async () => {
    // vitest env caps MAX_FILE_KB at 4 (see vitest.config.ts).
    const big = Buffer.from("كلمة ".repeat(1200), "utf8"); // > 4 KB decoded
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "اقرأ هذا", document: { dataUrl: toDataUrl(big, "text/plain"), fileName: "big.txt" } },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("DOCUMENT_TOO_LARGE");
  });

  it("blocks prompt injection embedded in an attached file — safe refusal, no model call", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: {
        content: "اشرح لي درس اليوم",
        document: { dataUrl: toDataUrl(readFixture("injection.txt"), "text/plain"), fileName: "injection.txt" },
      },
    });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as TurnShape;
    expect(turn.safetyTripwire).toBe(true);
    // A file must never change the system's rules or produce a model-grounded reply.
    expect(turn.tutorMessage.content).toContain("أنا هنا لمساعدتك في درسنا فقط");
    expect(turn.tutorMessage.content).not.toContain(DOCUMENT_READ_MARKER);
    expect(turn.contextChunkCount).toBe(0);
  });

  it("PHASE 19 — OCR: a scanned PDF (no text layer) is recognized and its text reaches the tutor", async () => {
    // A REAL PDF header (so MAGIC sniffing passes) but no extractable text —
    // exactly what an image-only scan looks like. The AI OCR fallback kicks in.
    const scannedPdf = Buffer.from("%PDF-1.4\n% minimal no-text\n%%EOF", "utf8");
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: {
        content: "اقرأ الملف إن أمكن",
        document: { dataUrl: toDataUrl(scannedPdf, PDF_MIME), fileName: "scanned.pdf" },
      },
    });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as TurnShape;
    expect(turn.ocrUsed).toBe(true);
    const att = turn.userMessage.attachments[0]!;
    expect(att.textChars).toBeGreaterThan(0);
    expect(att.ocr).toBe(true);
    // The tutor reads the recognized text like any document — proof the OCR
    // result reached the model turn (and is echo-tagged as recognized text).
    expect(turn.tutorMessage.content).toContain(DOCUMENT_READ_MARKER);
    expect(turn.tutorMessage.content).toContain(OCR_TEXT_MARKER);
    expect(turn.tutorMessage.content).toContain("وفقًا لمحتوى الدرس");

    // The recognized text is persisted on the attachment (like extracted text).
    const row = await api.db.db.select().from(messageAttachments).where(eq(messageAttachments.id, att.id)).get();
    expect(row?.ocrApplied).toBe(true);
    expect(row?.extractedText).toContain(OCR_TEXT_MARKER);
  });

  it("rejects a spoofed PDF: text bytes declared as application/pdf (MAGIC-byte mismatch)", async () => {
    const spoofed = Buffer.from("هذا ملف نصي عادي أُعيدت تسميته ليبدو PDF", "utf8");
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: {
        content: "اقرأ الملف",
        document: { dataUrl: toDataUrl(spoofed, PDF_MIME), fileName: "fake.pdf" },
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("FILE_TYPE_MISMATCH");
  });

  it("serves the document bytes to its owner with viewer-safe headers", async () => {
    const send = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { document: { dataUrl: toDataUrl(readFixture("question.pdf"), PDF_MIME), fileName: "question.pdf" } },
    });
    const attId = (send.json() as TurnShape).userMessage.attachments[0]!.id;

    const res = await api.app.inject({
      method: "GET",
      url: `/api/sessions/${sessionId}/attachments/${attId}`,
      headers: { cookie: s.cookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe(PDF_MIME);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["content-security-policy"]).toContain("sandbox");
    expect(res.rawPayload.length).toBeGreaterThan(0);
  });

  it("does not leak documents across students", async () => {
    const send = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { document: { dataUrl: toDataUrl(readFixture("question.pdf"), PDF_MIME), fileName: "question.pdf" } },
    });
    const attId = (send.json() as TurnShape).userMessage.attachments[0]!.id;

    const other = await registerStudent(api.app, nth(2));
    const res = await api.app.inject({
      method: "GET",
      url: `/api/sessions/${sessionId}/attachments/${attId}`,
      headers: { cookie: other.cookie },
    });
    expect([403, 404]).toContain(res.statusCode);
  });
});