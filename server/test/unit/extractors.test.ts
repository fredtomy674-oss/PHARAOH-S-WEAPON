import { describe, expect, it } from "vitest";
import { cleanText, contentHash, extractText } from "../../src/modules/rag/extractors.js";
import { UnsupportedSourceError } from "../../src/utils/errors.js";

describe("extractText", () => {
  it("passes raw text through", () => {
    expect(extractText("text", "محتوى").text).toBe("محتوى");
  });

  it("shapes CSV rows with their header line", () => {
    const out = extractText("csv", "مصطلح,تعريف\nالقسمة,عملية توزيع");
    expect(out.text).toContain("مصطلح,تعريف");
    expect(out.text).toContain("القسمة");
  });

  it("treats structured content as text", () => {
    expect(extractText("structured", "نص").text).toBe("نص");
  });

  it("rejects unsupported sources with a clear error (PDF/DOCX/image — MVP)", () => {
    for (const kind of ["pdf", "docx", "image"] as const) {
      expect(() => extractText(kind, "x")).toThrow(UnsupportedSourceError);
    }
  });
});

describe("cleanText", () => {
  it("normalizes newlines and collapses long blank runs", () => {
    const cleaned = cleanText("  أ\n\r\n\n\n\n  ب  ");
    expect(cleaned).not.toMatch(/\n{3,}/);
    expect(cleaned).toBe("أ\n\nب");
  });
});

describe("contentHash", () => {
  it("produces a stable 64-char hex digest", () => {
    const h1 = contentHash("نفس النص");
    const h2 = contentHash("نفس النص");
    const h3 = contentHash("نص مختلف");
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
  });
});