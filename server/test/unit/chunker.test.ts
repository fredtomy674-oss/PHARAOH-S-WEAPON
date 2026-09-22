import { describe, expect, it } from "vitest";
import { chunkText } from "../../src/modules/rag/chunker.js";

describe("chunkText", () => {
  it("splits long content into ordered, non-empty pieces", () => {
    const text = Array.from({ length: 40 }, (_, i) => `فقرة رقم ${i + 1}: نصوص تعليمية عن الرياضيات للمرحلة الابتدائية.`).join("\n\n");
    const chunks = chunkText(text, { targetChars: 200, overlapChars: 20 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.content.trim().length).toBeGreaterThan(0);
      expect(c.position).toBeGreaterThanOrEqual(0);
    }
    const positions = chunks.map((c) => c.position);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("returns a single chunk for short text", () => {
    const chunks = chunkText("نص قصير جداً مبسط.");
    expect(chunks.length).toBe(1);
    expect(chunks[0]!.content).toContain("نص قصير");
  });

  it("drops empty input", () => {
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  it("produces overlapping pieces for oversized paragraphs", () => {
    const big = "ك".repeat(500);
    const chunks = chunkText(big, { targetChars: 150, overlapChars: 30 });
    expect(chunks.length).toBeGreaterThan(2);
    // Overlapping windows share text.
    expect(chunks[0]!.content).toContain("ك".repeat(30));
  });
});