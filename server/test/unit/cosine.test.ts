import { describe, expect, it } from "vitest";
import { cosine } from "../../src/modules/rag/vectorStore.js";

describe("cosine", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 6);
  });

  it("returns a negative value for opposing vectors", () => {
    expect(cosine([1, 0], [-1, 0])).toBeCloseTo(-1, 6);
  });

  it("returns 0 for a zero vector", () => {
    expect(cosine([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it("is scale-invariant", () => {
    const a = cosine([2, 4], [1, 2]);
    const b = cosine([1, 2], [1, 2]);
    expect(a).toBeCloseTo(b, 6);
  });
});