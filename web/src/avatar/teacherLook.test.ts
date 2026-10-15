import { describe, expect, it } from "vitest";
import { buildDrape, buildHood } from "./teacherLook.js";

describe("teacher look geometry", () => {
  it("builds a hood with an actual face opening", () => {
    const rings = 48;
    const seg = 72;
    const full = rings * seg * 6; // triangles if the hood were closed
    const hood = buildHood(0.14, 0.145, 0.14, 0.1, 0.11);
    const pos = hood.getAttribute("position");
    const index = hood.getIndex();
    expect(pos.count).toBe((rings + 1) * (seg + 1));
    expect(index!.count).toBeGreaterThan(0);
    // The oval window must remove real faces, but not everything.
    expect(index!.count).toBeLessThan(full);
    expect(index!.count).toBeGreaterThan(full * 0.5);
    const array = pos.array as ArrayLike<number>;
    for (let i = 0; i < array.length; i++) expect(Number.isFinite(array[i]!)).toBe(true);
  });

  it("builds a hem-rolled shoulder cape with a closed-out edge", () => {
    const rings = 14;
    const seg = 72;
    const drape = buildDrape(0.09, 0.09, 0.16, 0.14, 0.14, rings);
    const pos = drape.getAttribute("position");
    expect(pos.count).toBe((rings + 1) * (seg + 1));
    expect(drape.getIndex()!.count).toBe(rings * seg * 6);
    // Rolled hem: the last ring is narrower than the widest ring.
    const array = pos.array as ArrayLike<number>;
    const rowRadius = (r: number) => {
      let max = 0;
      for (let j = 0; j <= seg; j++) {
        const i = (r * (seg + 1) + j) * 3;
        max = Math.max(max, Math.hypot(array[i]!, array[i + 2]!));
      }
      return max;
    };
    expect(rowRadius(rings)).toBeLessThan(rowRadius(rings - 1));
    for (let i = 0; i < array.length; i++) expect(Number.isFinite(array[i]!)).toBe(true);
  });
});
