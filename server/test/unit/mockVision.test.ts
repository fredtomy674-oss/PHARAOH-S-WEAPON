import { describe, expect, it } from "vitest";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { IMAGE_READ_MARKER } from "../../src/modules/ai/providers/mock.js";

describe("mock AI provider: vision (سؤال مصور)", () => {
  it("acknowledges an attached image in the tutor reply (structured JSON)", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const res = await ai.complete({
      operation: "tutor",
      messages: [
        { role: "system", content: "أنت معلم عربي. <context>محتوى عن الجمع مع إعادة التجميع</context>" },
        { role: "user", content: "حل السؤال اللي في الصورة" },
      ],
      images: [{ mimeType: "image/png", base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" }],
      json: true,
    });
    const parsed = JSON.parse(res.content) as { content: string; parts: Array<{ type: string; text: string }> };
    expect(parsed.content).toContain(IMAGE_READ_MARKER);
    expect(parsed.parts[0]!.text).toContain(IMAGE_READ_MARKER);
    expect(res.model).toBe("mock-tutor");
    db.sqlite.close();
  });

  it("still answers normally when no image is attached", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const res = await ai.complete({
      operation: "tutor",
      messages: [{ role: "user", content: "اشرح الجمع" }],
      json: true,
    });
    expect(JSON.parse(res.content).content).not.toContain(IMAGE_READ_MARKER);
    db.sqlite.close();
  });
});