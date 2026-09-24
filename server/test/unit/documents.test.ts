import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ALLOWED_DOCUMENT_MIMES,
  extractDocumentText,
  parseDocumentDataUrl,
} from "../../src/modules/sessions/documents.js";

const fixturesDir = new URL("../../../e2e/fixtures/", import.meta.url);
const readFixture = (name: string): Buffer => readFileSync(fileURLToPath(new URL(name, fixturesDir)));

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

describe("document text extraction (مسار الطالب في الدردشة)", () => {
  it("extracts text from a real PDF fixture", async () => {
    const { text, truncated } = await extractDocumentText(readFixture("question.pdf"), PDF_MIME, 20_000);
    expect(text).toContain("TutorFixturePDF 123");
    expect(truncated).toBe(false);
  });

  it("extracts text from a real DOCX fixture (OOXML zip)", async () => {
    const { text, truncated } = await extractDocumentText(readFixture("question.docx"), DOCX_MIME, 20_000);
    expect(text).toContain("TutorFixtureDOCX 456");
    expect(truncated).toBe(false);
  });

  it("decodes UTF-8 text files and strips the BOM (plain + markdown)", async () => {
    const plain = await extractDocumentText(Buffer.from("\uFEFFمرحبا بك في الدرس", "utf8"), "text/plain", 100);
    expect(plain.text).toBe("مرحبا بك في الدرس");
    const md = await extractDocumentText(Buffer.from("# عنوان", "utf8"), "text/markdown", 100);
    expect(md.text).toBe("# عنوان");
  });

  it("truncates long documents to the chars budget and flags it", async () => {
    const { text, truncated } = await extractDocumentText(Buffer.from("كلمة ".repeat(100), "utf8"), "text/plain", 20);
    expect(truncated).toBe(true);
    expect(text.length).toBeLessThanOrEqual(21);
    expect(text.endsWith("…")).toBe(true);
  });

  it("returns empty text for corrupt PDF bytes instead of throwing", async () => {
    const { text, truncated } = await extractDocumentText(Buffer.from("this is not a pdf at all", "utf8"), PDF_MIME, 100);
    expect(text).toBe("");
    expect(truncated).toBe(false);
  });

  it("returns empty text for a scanned (no-text-layer) PDF — the OCR fallback (PHASE 19) takes over upstream", async () => {
    const { text, truncated } = await extractDocumentText(readFixture("scanned.pdf"), PDF_MIME, 20_000);
    expect(text).toBe("");
    expect(truncated).toBe(false);
  });

  it("parseDocumentDataUrl validates mime whitelist and computes sha256/size", async () => {
    expect(ALLOWED_DOCUMENT_MIMES.has("text/markdown")).toBe(true);
    const bytes = readFixture("question.pdf");
    const parsed = await parseDocumentDataUrl(
      `data:${PDF_MIME};base64,${bytes.toString("base64")}`,
      { maxBytes: 10_000, maxChars: 20_000, fileName: "question.pdf" },
    );
    expect(parsed.mimeType).toBe(PDF_MIME);
    expect(parsed.fileName).toBe("question.pdf");
    expect(parsed.sizeBytes).toBe(bytes.length);
    expect(parsed.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(parsed.text).toContain("TutorFixturePDF 123");
  });
});