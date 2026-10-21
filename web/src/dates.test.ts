import { describe, expect, it } from "vitest";
import { addDaysISO, daysBetweenISO, dueLabel, localISODate, parseISODate } from "./dates.js";

describe("calendar dates for the weekly planner (PHASE 182)", () => {
  it("uses local calendar days, not UTC shifts", () => {
    expect(localISODate(new Date(2026, 0, 2, 23, 55))).toBe("2026-01-02");
    expect(addDaysISO("2026-01-31", 1)).toBe("2026-02-01");
    expect(daysBetweenISO("2026-10-19", "2026-10-22")).toBe(3);
  });

  it("parses at local noon so DST boundaries cannot move a task", () => {
    expect(parseISODate("2026-03-29").getHours()).toBe(12);
  });

  it("labels due dates in the child's language", () => {
    expect(dueLabel("2026-10-19", "2026-10-19")).toBe("اليوم");
    expect(dueLabel("2026-10-20", "2026-10-19")).toBe("غدًا");
    expect(dueLabel("2026-10-22", "2026-10-19")).toBe("بعد 3 أيام");
    expect(dueLabel("2026-10-17", "2026-10-19")).toContain("متأخر");
  });
});
