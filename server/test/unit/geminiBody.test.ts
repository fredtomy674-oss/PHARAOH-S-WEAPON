import { describe, expect, it } from "vitest";
import { GeminiLLMProvider } from "../../src/modules/ai/providers/gemini.js";

/**
 * The vision payload: images ride on the LAST user turn's parts. A previous
 * revision compared the filtered-turn index against the full array length, so
 * with any system message present (every real tutor turn) the index never
 * matched and every image was silently dropped — the model answered staged
 * pages and attached photos from OCR text alone.
 */
describe("Gemini request body — vision", () => {
  const provider = new GeminiLLMProvider();
  const bodyOf = (request: unknown) =>
    (
      provider as unknown as {
        buildBody: (r: unknown) => { contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> };
      }
    ).buildBody(request);

  const img = { mimeType: "image/jpeg", base64: "AAA=" };

  it("attaches images to the last user turn when a system message exists", () => {
    const body = bodyOf({
      messages: [
        { role: "system", content: "rules" },
        { role: "user", content: "hello" },
      ],
      images: [img],
    });
    const last = body.contents[body.contents.length - 1]!;
    expect(last.parts.some((p) => (p["inlineData"] as { data?: string } | undefined)?.data === "AAA=")).toBe(true);
  });

  it("attaches nothing when no images are passed", () => {
    const body = bodyOf({
      messages: [
        { role: "system", content: "rules" },
        { role: "user", content: "hello" },
      ],
    });
    const last = body.contents[body.contents.length - 1]!;
    expect(last.parts.some((p) => p["inlineData"] !== undefined)).toBe(false);
  });

  it("still lands on the last user turn after history turns", () => {
    const body = bodyOf({
      messages: [
        { role: "system", content: "rules" },
        { role: "user", content: "old q" },
        { role: "assistant", content: "old a" },
        { role: "user", content: "new q" },
      ],
      images: [img],
    });
    expect(body.contents).toHaveLength(3);
    expect(
      body.contents[2]!.parts.some((p) => (p["inlineData"] as { data?: string } | undefined)?.data === "AAA="),
    ).toBe(true);
    expect(body.contents[0]!.parts.some((p) => p["inlineData"] !== undefined)).toBe(false);
  });
});
