import { describe, expect, it } from "vitest";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { DOCUMENT_READ_MARKER, IMAGE_READ_MARKER } from "../../src/modules/ai/providers/mock.js";

describe("mock AI provider: documents (ملف سؤال)", () => {
  it("acknowledges an attached document and echoes its extracted text (structured JSON)", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const res = await ai.complete({
      operation: "tutor",
      messages: [{ role: "user", content: "حل السؤال الموجود في الملف" }],
      documents: [{ fileName: "question.pdf", mimeType: "application/pdf", text: "TutorFixturePDF 123" }],
      json: true,
    });
    const parsed = JSON.parse(res.content) as { content: string; parts: Array<{ type: string; text: string }> };
    expect(parsed.content).toContain(DOCUMENT_READ_MARKER);
    expect(parsed.content).toContain("question.pdf");
    // The deterministic snippet proves the real extracted text travels to the model + tests.
    expect(parsed.content).toContain("TutorFixturePDF 123");
    expect(parsed.parts[0]!.text).toContain(DOCUMENT_READ_MARKER);
    expect(res.model).toBe("mock-tutor");
    db.sqlite.close();
  });

  it("should not emit the image marker for a document-only turn (markers are distinct)", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const res = await ai.complete({
      operation: "tutor",
      messages: [{ role: "user", content: "اقرأ الملف" }],
      documents: [{ fileName: "notes.txt", mimeType: "text/plain", text: "محتوى الملف المرفق" }],
      json: true,
    });
    const content = (JSON.parse(res.content) as { content: string }).content;
    expect(content).toContain(DOCUMENT_READ_MARKER);
    expect(content).not.toContain(IMAGE_READ_MARKER);
    db.sqlite.close();
  });

  it("still answers normally when no document is attached", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const res = await ai.complete({
      operation: "tutor",
      messages: [{ role: "user", content: "اشرح الجمع" }],
      json: true,
    });
    expect((JSON.parse(res.content) as { content: string }).content).not.toContain(DOCUMENT_READ_MARKER);
    db.sqlite.close();
  });
});