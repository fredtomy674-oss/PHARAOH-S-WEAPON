import { describe, expect, it } from "vitest";
import { countsByDay, lastNDayKeys, usageByDay, windowStart } from "../../src/modules/admin/trends.js";

/**
 * PHASE 34 — pure day-bucketing for the admin time-analytics section
 * (D-021 tail: «مؤشرات زمنية (جلسات/يوم)» + D-031 tail: time-partitioned usage).
 * No I/O: the contract is the UTC calendar day, shared with the streak engine.
 */
describe("admin trends (PHASE 34)", () => {
  const NOW = new Date("2026-03-15T12:00:00.000Z");

  describe("lastNDayKeys", () => {
    it("returns the window ending today, ascending, with no gaps", () => {
      expect(lastNDayKeys(3, NOW)).toEqual(["2026-03-13", "2026-03-14", "2026-03-15"]);
    });

    it("crosses month and year boundaries", () => {
      expect(lastNDayKeys(3, new Date("2026-01-01T00:00:00.000Z"))).toEqual(["2025-12-30", "2025-12-31", "2026-01-01"]);
    });

    it("handles a leap day", () => {
      expect(lastNDayKeys(2, new Date("2028-03-01T00:00:00.000Z"))).toEqual(["2028-02-29", "2028-03-01"]);
    });

    it("returns a single-key window for days=1", () => {
      expect(lastNDayKeys(1, NOW)).toEqual(["2026-03-15"]);
    });
  });

  describe("windowStart", () => {
    it("is midnight UTC of the oldest day in the window", () => {
      expect(windowStart(3, NOW).toISOString()).toBe("2026-03-13T00:00:00.000Z");
    });

    it("is today-midnight for a single-day window", () => {
      expect(windowStart(1, NOW).toISOString()).toBe("2026-03-15T00:00:00.000Z");
    });

    it("matches the first bucket key so SQL filters and JS buckets agree", () => {
      expect(windowStart(14, NOW).toISOString().slice(0, 10)).toBe(lastNDayKeys(14, NOW)[0]);
    });
  });

  describe("countsByDay", () => {
    it("zero-fills every day of the window so the chart has no holes", () => {
      const series = countsByDay(3, [], NOW);
      expect(series).toEqual([
        { day: "2026-03-13", count: 0 },
        { day: "2026-03-14", count: 0 },
        { day: "2026-03-15", count: 0 },
      ]);
    });

    it("buckets timestamps by their UTC day", () => {
      const series = countsByDay(
        3,
        [new Date("2026-03-13T00:00:00Z"), new Date("2026-03-13T23:59:59Z"), new Date("2026-03-15T08:00:00Z")],
        NOW,
      );
      expect(series.map((d) => d.count)).toEqual([2, 0, 1]);
    });

    it("ignores timestamps older than the window", () => {
      const series = countsByDay(2, [new Date("2026-01-01T00:00:00Z"), new Date("2026-03-15T00:00:00Z")], NOW);
      expect(series.map((d) => d.count)).toEqual([0, 1]);
    });

    it("counts a timestamp sitting exactly on the oldest window edge", () => {
      const series = countsByDay(2, [new Date("2026-03-14T00:00:00Z")], NOW);
      expect(series.map((d) => d.count)).toEqual([1, 0]);
    });

    it("treats 23:59 and 00:00 as different days (UTC boundary, not local)", () => {
      const series = countsByDay(
        2,
        [new Date("2026-03-14T23:59:59.999Z"), new Date("2026-03-15T00:00:00.000Z")],
        NOW,
      );
      expect(series.map((d) => d.count)).toEqual([1, 1]);
    });
  });

  describe("usageByDay", () => {
    const log = (createdAt: string, input: number, output: number, cost: number) => ({
      createdAt: new Date(createdAt),
      inputTokens: input,
      outputTokens: output,
      costUsd: cost,
    });

    it("sums calls, tokens, and cost per day", () => {
      const series = usageByDay(
        2,
        [
          log("2026-03-14T10:00:00Z", 100, 50, 0.001),
          log("2026-03-14T11:00:00Z", 10, 5, 0.0002),
          log("2026-03-15T09:00:00Z", 7, 3, 0.5),
        ],
        NOW,
      );
      expect(series).toEqual([
        { day: "2026-03-14", calls: 2, tokens: 165, costUsd: 0.0012 },
        { day: "2026-03-15", calls: 1, tokens: 10, costUsd: 0.5 },
      ]);
    });

    it("zero-fills an empty window", () => {
      expect(usageByDay(2, [], NOW)).toEqual([
        { day: "2026-03-14", calls: 0, tokens: 0, costUsd: 0 },
        { day: "2026-03-15", calls: 0, tokens: 0, costUsd: 0 },
      ]);
    });

    it("ignores rows outside the window", () => {
      const series = usageByDay(1, [log("2026-02-01T00:00:00Z", 999, 999, 9)], NOW);
      expect(series).toEqual([{ day: "2026-03-15", calls: 0, tokens: 0, costUsd: 0 }]);
    });

    it("rounds cost to 4 decimals so float noise never reaches the UI", () => {
      const series = usageByDay(1, [log("2026-03-15T00:00:00Z", 0, 0, 0.000123456)], NOW);
      expect(series[0]!.costUsd).toBe(0.0001);
    });
  });
});
