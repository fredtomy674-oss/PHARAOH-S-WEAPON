import { describe, expect, it } from "vitest";
import { dayKey, previousDay, streakForDates } from "../../src/modules/progress/streak.js";

/**
 * PHASE 32 — the daily-activity streak engine (D-020/D-035 deferred item
 * «تتابع أسبوعي»): pure UTC calendar-day arithmetic. No I/O.
 */
describe("daily activity streak (PHASE 32)", () => {
  const NOW = "2026-09-26";

  describe("dayKey / previousDay", () => {
    it("renders the UTC calendar day of a timestamp", () => {
      expect(dayKey(new Date("2026-09-26T00:00:00Z"))).toBe("2026-09-26");
      expect(dayKey(new Date("2026-09-26T23:59:59Z"))).toBe("2026-09-26");
      // a UTC day boundary is preserved regardless of local timezone
      expect(dayKey(new Date("2026-01-10T12:00:00Z"))).toBe("2026-01-10");
    });

    it("steps whole calendar days backwards and handles month/year boundaries", () => {
      expect(previousDay("2026-09-26")).toBe("2026-09-25");
      expect(previousDay("2026-03-01", 1)).toBe("2026-02-28");
      expect(previousDay("2026-01-01", 3)).toBe("2025-12-29");
    });
  });

  describe("streakForDates", () => {
    it("is zero for empty or invalid input", () => {
      expect(streakForDates([], NOW)).toBe(0);
      expect(streakForDates(["nonsense", "2026-9-1"], NOW)).toBe(0);
    });

    it("counts a single active day (today)", () => {
      expect(streakForDates([NOW], NOW)).toBe(1);
    });

    it("keeps a streak that ended yesterday while today is still empty", () => {
      // grace: an unfinished day never breaks the run
      expect(streakForDates(["2026-09-25"], NOW)).toBe(1);
      expect(streakForDates(["2026-09-24", "2026-09-25"], NOW)).toBe(2);
    });

    it("counts consecutive days ending today", () => {
      expect(streakForDates(["2026-09-24", "2026-09-25", "2026-09-26"], NOW)).toBe(3);
    });

    it("collapses duplicates and accepts unsorted input", () => {
      const days = ["2026-09-26", "2026-09-25", "2026-09-26", "2026-09-24"];
      expect(streakForDates(days, NOW)).toBe(3);
    });

    it("resets the run on a gap (a missed day breaks the chain)", () => {
      // missing 2026-09-25 → only today counts
      expect(streakForDates(["2026-09-23", "2026-09-24", "2026-09-26"], NOW)).toBe(1);
      // missing 2026-09-24 → today + 25 only
      expect(streakForDates(["2026-09-23", "2026-09-25", "2026-09-26"], NOW)).toBe(2);
    });

    it("ignores future days (they cannot start a run)", () => {
      expect(streakForDates([NOW, "2026-09-27", "2026-09-28"], NOW)).toBe(1);
    });

    it("a full week of continuity reaches 7", () => {
      const days = ["2026-09-20", "2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26"];
      expect(streakForDates(days, NOW)).toBe(7);
    });
  });
});