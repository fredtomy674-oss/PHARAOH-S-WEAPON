import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, count, eq } from "drizzle-orm";
import { aiUsageLogs, chunks, messageAttachments } from "../../src/db/schema.js";
import { makeAdmin, makeApp, registerStudent, seedMiniCorpus, csrfHeaders, type AuthSession, type MiniCorpus, type TestApi } from "../helpers.js";
import { DOCUMENT_READ_MARKER, OCR_TEXT_MARKER } from "../../src/modules/ai/providers/mock.js";

const fixturesDir = new URL("../../../e2e/fixtures/", import.meta.url);
const readFixture = (name: string): Buffer => readFileSync(fileURLToPath(new URL(name, fixturesDir)));
const toDataUrl = (bytes: Buffer, mime: string): string => `data:${mime};base64,${bytes.toString("base64")}`;

const PDF_MIME = "application/pdf";
const nth = (n: number) => `ocr-${n}@test.local`;

interface TurnShape {
  userMessage: { id: string; content: string; attachments: Array<{ id: string; mimeType: string; textChars?: number; ocr?: boolean }> };
  tutorMessage: { content: string };
  ocrUsed?: boolean;
}

const countOcrUsage = (db: TestApi["db"], userId: string): number =>
  db.db
    .select({ n: count() })
    .from(aiUsageLogs)
    .where(and(eq(aiUsageLogs.userId, userId), eq(aiUsageLogs.operation, "ocr")))
    .get()?.n ?? 0;

/**
 * OCR (PHASE 19) API coverage — scanned files whose text layer is empty are
 * read through the AI OCR provider in BOTH paths:
 *   Path A: a student attaches the scanned `scanned.pdf` → the OCR text reaches
 *           the tutor turn, is persisted on the attachment, and is cost-tracked.
 *   Path B: an admin imports the same scanned PDF → its OCR text joins the
 *           knowledge base chunks (content, not instructions).
 * Guard rails: text-layered PDFs never trigger OCR; too-short TXT stays a hard
 * EMPTY_DOCUMENT error (OCR is only for scanned-capable document MIME types).
 */
describe("OCR of scanned files (المساران A وB) — API", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let admin!: AuthSession;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    admin = await makeAdmin(api.app, api.db);
  });

  afterAll(async () => {
    api.app.close();
  });

  const startSession = async (s: AuthSession, lessonId: string): Promise<string> => {
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(s),
      payload: { curriculumId: corpus.curriculumId, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId },
    });
    expect(start.statusCode).toBe(201);
    return start.json().session.id as string;
  };

  it("Path A — a scanned PDF (no text layer) is OCR'd and its text reaches the tutor", async () => {
    const s = await registerStudent(api.app, nth(1));
    const sessionId = await startSession(s, corpus.lessonA);
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: {
        content: "اقرأ الملف المرفق",
        document: { dataUrl: toDataUrl(readFixture("scanned.pdf"), PDF_MIME), fileName: "scanned.pdf" },
      },
    });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as TurnShape;
    expect(turn.ocrUsed).toBe(true);
    const att = turn.userMessage.attachments[0]!;
    expect(att.textChars).toBeGreaterThan(0);
    expect(att.ocr).toBe(true);
    expect(turn.tutorMessage.content).toContain(DOCUMENT_READ_MARKER);
    expect(turn.tutorMessage.content).toContain(OCR_TEXT_MARKER);

    // Persisted like extracted text + the OCR badge flag survives reloads.
    const row = api.db.db.select().from(messageAttachments).where(eq(messageAttachments.id, att.id)).get();
    expect(row?.ocrApplied).toBe(true);
    expect(row?.extractedText).toContain(OCR_TEXT_MARKER);
    // Cost transparency: the OCR call is usage-tracked for this student.
    expect(countOcrUsage(api.db, s.userId)).toBeGreaterThan(0);
  });

  it("Path A — a PDF with a text layer skips OCR entirely", async () => {
    const s = await registerStudent(api.app, nth(2));
    const sessionId = await startSession(s, corpus.lessonA);
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: {
        content: "اقرأ الملف المرفق",
        document: { dataUrl: toDataUrl(readFixture("question.pdf"), PDF_MIME), fileName: "question.pdf" },
      },
    });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as TurnShape;
    expect(turn.ocrUsed).toBe(false);
    const att = turn.userMessage.attachments[0]!;
    expect(att.ocr).toBeUndefined();
    expect(att.textChars).toBeGreaterThan(0);
    expect(turn.tutorMessage.content).toContain("TutorFixturePDF 123");
    expect(turn.tutorMessage.content).toContain(DOCUMENT_READ_MARKER);
    // No OCR cost for this student — extraction did the job.
    expect(countOcrUsage(api.db, s.userId)).toBe(0);
  });

  it("Path B — an admin imports a scanned PDF; OCR text joins the knowledge base + dedup on re-import", async () => {
    const bytes = readFixture("scanned.pdf");
    const scope = {
      countryId: corpus.countryId,
      educationSystemId: corpus.systemId,
      gradeId: corpus.gradeId,
      subjectId: corpus.subjectId,
      curriculumId: corpus.curriculumId,
      termId: corpus.termId,
      unitId: corpus.unitId,
      lessonId: corpus.lessonB,
    };
    // OCR is cost-tracked per unique bytes: the count either grows by one (this
    // import is the first recognition in-process) or stays flat (PHASE 22 — the
    // identical scanned.pdf bytes were already recognized for the Path A student
    // in this shared app, so the import serves from the OCR cache), never more.
    const usageBefore = countOcrUsage(api.db, admin.userId);
    const first = await api.app.inject({
      method: "POST",
      url: "/api/admin/documents/ingest-file",
      headers: csrfHeaders(admin),
      payload: { fileName: "scanned.pdf", dataUrl: toDataUrl(bytes, PDF_MIME), title: "درس ممسوح — OCR", scope },
    });
    expect(first.statusCode).toBe(201);
    const body = first.json() as { document: { documentId: string; chunkCount: number } };
    expect(body.document.chunkCount).toBeGreaterThan(0);
    const chunk = api.db.db.select().from(chunks).where(eq(chunks.documentId, body.document.documentId)).get();
    expect(chunk?.content).toContain(OCR_TEXT_MARKER);
    const usageAfter = countOcrUsage(api.db, admin.userId);
    expect(usageAfter).toBeGreaterThanOrEqual(usageBefore);
    expect(usageAfter).toBeLessThanOrEqual(usageBefore + 1);

    // Byte-identical re-import stays deduped (file-level, same as any doc).
    const second = await api.app.inject({
      method: "POST",
      url: "/api/admin/documents/ingest-file",
      headers: csrfHeaders(admin),
      payload: { fileName: "scanned-copy.pdf", dataUrl: toDataUrl(bytes, PDF_MIME), scope },
    });
    expect(second.statusCode).toBe(409);
    expect(second.json().error.code).toBe("DOCUMENT_ALREADY_INGESTED");
  });

  it("Path B — a too-short TXT stays EMPTY_DOCUMENT and never triggers OCR", async () => {
    const before = countOcrUsage(api.db, admin.userId);
    const scope = {
      countryId: corpus.countryId,
      educationSystemId: corpus.systemId,
      gradeId: corpus.gradeId,
      subjectId: corpus.subjectId,
      curriculumId: corpus.curriculumId,
      termId: corpus.termId,
      unitId: corpus.unitId,
      lessonId: corpus.lessonB,
    };
    const res = await api.app.inject({
      method: "POST",
      url: "/api/admin/documents/ingest-file",
      headers: csrfHeaders(admin),
      payload: { fileName: "short.txt", dataUrl: toDataUrl(Buffer.from("محتوى قصير جدا", "utf8"), "text/plain"), scope },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("EMPTY_DOCUMENT");
    // OCR is only for scanned-capable MIME types — plain text never OCR'd.
    expect(countOcrUsage(api.db, admin.userId)).toBe(before);
  });
});