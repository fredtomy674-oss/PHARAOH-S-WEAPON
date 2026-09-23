import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { chunks, documentVersions, documents, ragVectors } from "../../src/db/schema.js";
import { makeApp, seedMiniCorpus, type MiniCorpus, type TestApi } from "../helpers.js";
import { extractDocumentText } from "../../src/modules/sessions/documents.js";

const fixturesDir = new URL("../../../e2e/fixtures/", import.meta.url);
const readFixture = (name: string): Buffer => readFileSync(fileURLToPath(new URL(name, fixturesDir)));
const sha256Of = (bytes: Buffer): string => createHash("sha256").update(bytes).digest("hex");

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

describe("KnowledgeService.ingestFile (Path B — curriculum file import)", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let scopeA!: Parameters<typeof api.knowledge.ingestFile>[0]["scope"];

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    scopeA = {
      countryId: corpus.countryId,
      educationSystemId: corpus.systemId,
      gradeId: corpus.gradeId,
      subjectId: corpus.subjectId,
      curriculumId: corpus.curriculumId,
      termId: corpus.termId,
      unitId: corpus.unitId,
      lessonId: corpus.lessonA,
    };
  });

  afterAll(async () => {
    api.app.close();
  });

  it("ingests a PDF: kind/status, raw sha256+size stored on the version, raw bytes in `data`, chunks + vectors", async () => {
    const bytes = readFixture("curriculum.pdf");
    const { text } = await extractDocumentText(bytes, PDF_MIME, 200_000);
    expect(text).toContain("TutorFixturePDF 123");

    const res = await api.knowledge.ingestFile({
      fileName: "curriculum.pdf",
      mimeType: PDF_MIME,
      bytes,
      text,
      title: "ملف منهج تجريبي",
      source: "test",
      scope: scopeA,
    });
    expect(res.chunkCount).toBeGreaterThan(0);

    const doc = api.db.db.select().from(documents).where(eq(documents.id, res.documentId)).get();
    expect(doc?.kind).toBe("pdf");
    expect(doc?.status).toBe("ready");
    expect(doc?.title).toBe("ملف منهج تجريبي");

    const ver = api.db.db.select().from(documentVersions).where(eq(documentVersions.id, res.versionId)).get();
    expect(ver?.sha256).toBe(sha256Of(bytes));
    expect(ver?.sizeBytes).toBe(bytes.length);
    expect(Buffer.compare(ver?.data as Buffer, bytes)).toBe(0);
    expect(ver?.status).toBe("processed");

    const chunkRows = api.db.db.select().from(chunks).where(eq(chunks.documentId, res.documentId)).all();
    expect(chunkRows.length).toBe(res.chunkCount);
    expect(chunkRows[0]!.lessonId).toBe(corpus.lessonA);
    expect(api.db.db.select().from(ragVectors).where(eq(ragVectors.chunkId, chunkRows[0]!.id)).get()).toBeTruthy();
  });

  it("ingests a DOCX file with kind=docx and its extracted text reachable in chunks", async () => {
    const bytes = readFixture("curriculum.docx");
    const { text } = await extractDocumentText(bytes, DOCX_MIME, 200_000);
    expect(text).toContain("TutorFixtureDOCX 456");

    const res = await api.knowledge.ingestFile({
      fileName: "curriculum.docx",
      mimeType: DOCX_MIME,
      bytes,
      text,
      scope: scopeA,
    });
    expect(res.chunkCount).toBeGreaterThan(0);
    const doc = api.db.db.select().from(documents).where(eq(documents.id, res.documentId)).get();
    expect(doc?.kind).toBe("docx");
    const chunkRows = api.db.db.select().from(chunks).where(eq(chunks.documentId, res.documentId)).all();
    expect(chunkRows.some((c) => c.content.includes("TutorFixtureDOCX 456"))).toBe(true);
  });

  it("accepts a first import then rejects a byte-identical file for the same curriculum", async () => {
    const bytes = readFixture("injection.txt");
    const { text } = await extractDocumentText(bytes, "text/plain", 200_000);
    const input = { fileName: "rules.txt", mimeType: "text/plain", bytes, text, scope: scopeA };
    const first = await api.knowledge.ingestFile(input);
    expect(first.chunkCount).toBeGreaterThan(0);
    await expect(api.knowledge.ingestFile(input)).rejects.toMatchObject({ code: "DOCUMENT_ALREADY_INGESTED" });
  });

  it("rejects a file with no extractable text (scanned — OCR deferred) as EMPTY_DOCUMENT", async () => {
    const bytes = Buffer.from("this PDF has no readable text %PDF fake", "utf8");
    await expect(
      api.knowledge.ingestFile({
        fileName: "scanned.pdf",
        mimeType: PDF_MIME,
        bytes,
        text: "",
        scope: scopeA,
      }),
    ).rejects.toMatchObject({ code: "EMPTY_DOCUMENT" });
  });

  it("keeps chunk dedup lesson-scoped: identical TEXT content is ingested into two different lessons", async () => {
    const content = "محتوى متطابق تمامًا يُدرج في درسين مختلفين للتأكد من أن إزالة التكرار مرتبطة بالدرس وليست عامة على كل قاعدة المعرفة.";
    const a = await api.knowledge.ingestText({ title: "مشترك أ", content, kind: "text", scope: scopeA });
    const b = await api.knowledge.ingestText({
      title: "مشترك ب",
      content,
      kind: "text",
      scope: { ...scopeA, lessonId: corpus.lessonB },
    });
    expect(a.chunkCount).toBeGreaterThan(0);
    expect(b.chunkCount).toBeGreaterThan(0); // would silently be 0 under the old global unique
    const lessonBChunks = api.db.db.select().from(chunks).where(eq(chunks.lessonId, corpus.lessonB)).all();
    expect(lessonBChunks.length).toBeGreaterThan(0);
  });
});