import { describe, expect, it } from "vitest";
import { MockOcrProvider, OCR_TEXT_MARKER } from "../../src/modules/ai/providers/mock.js";
import { OcrService, OCR_ELIGIBLE_MIMES } from "../../src/modules/ocr/service.js";
import type { OcrResponse } from "../../src/modules/ai/types.js";

describe("OCR provider (mock) — PHASE 19", () => {
  it("returns deterministic curriculum-shaped text with the OCR marker", async () => {
    const provider = new MockOcrProvider();
    const res = await provider.ocr({ mimeType: "application/pdf", base64: "AAAA", fileName: "scan.pdf" });
    expect(provider.id).toBe("mock");
    expect(res.model).toBe("mock-ocr");
    expect(res.text).toContain(OCR_TEXT_MARKER);
    expect(res.text.length).toBeGreaterThan(40); // long enough to pass Path B's minimum
  });

  it("derives a stable per-file token: same bytes → same text, distinct bytes → distinct text", async () => {
    const provider = new MockOcrProvider();
    const a = await provider.ocr({ mimeType: "application/pdf", base64: "AAAA" });
    const a2 = await provider.ocr({ mimeType: "application/pdf", base64: "AAAA" });
    const b = await provider.ocr({ mimeType: "application/pdf", base64: "BBBB" });
    expect(a.text).toBe(a2.text);
    expect(a.text).not.toBe(b.text);
  });

  it("recognizes only scanned-capable document MIME types (PDF/DOCX)", () => {
    expect(OCR_ELIGIBLE_MIMES.has("application/pdf")).toBe(true);
    expect(OCR_ELIGIBLE_MIMES.has("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(true);
    expect(OCR_ELIGIBLE_MIMES.has("text/plain")).toBe(false);
    expect(OCR_ELIGIBLE_MIMES.has("text/markdown")).toBe(false);
  });
});

describe("OcrService", () => {
  const stubAi = (impl: (req: { mimeType: string; base64: string }) => Promise<OcrResponse>) => ({ ocr: impl });

  it("recognizes an eligible PDF through the AI provider", async () => {
    const service = new OcrService(
      stubAi(async () => ({ text: "نص الصفحة الممسوحة — محتوى الدرس", model: "test-ocr", inputTokens: 1, outputTokens: 2, latencyMs: 0 })),
    );
    const out = await service.recognize({ mimeType: "application/pdf", base64: "ZGF0YQ==", maxChars: 100 });
    expect(out.text).toContain("نص الصفحة الممسوحة");
    expect(out.truncated).toBe(false);
  });

  it("skips ineligible MIME types without ever calling the provider", async () => {
    let called = false;
    const service = new OcrService({
      ocr: async () => {
        called = true;
        throw new Error("should not be called");
      },
    });
    const out = await service.recognize({ mimeType: "text/plain", base64: "ZGF0YQ==", maxChars: 100 });
    expect(called).toBe(false);
    expect(out.text).toBe("");
    expect(out.truncated).toBe(false);
  });

  it("truncates to the maxChars budget and flags it", async () => {
    const service = new OcrService(stubAi(async () => ({ text: "كلمة ".repeat(50), model: "t", inputTokens: 1, outputTokens: 1, latencyMs: 0 })));
    const out = await service.recognize({ mimeType: "application/pdf", base64: "QQ==", maxChars: 20 });
    expect(out.truncated).toBe(true);
    expect(out.text.length).toBeLessThanOrEqual(21);
    expect(out.text.endsWith("…")).toBe(true);
  });

  it("degrades to empty text when the provider throws (never crashes the turn/import)", async () => {
    const service = new OcrService(stubAi(async () => { throw new Error("provider down"); }));
    const out = await service.recognize({ mimeType: "application/pdf", base64: "QQ==", maxChars: 100 });
    expect(out.text).toBe("");
    expect(out.truncated).toBe(false);
  });
});