import { describe, expect, it } from "vitest";
import { groupMistakes, MISTAKE_LIMIT, type MistakeRow } from "../../src/modules/progress/mistakes.js";

/**
 * PHASE 161 (W6) — «دفتر أخطائي»: the pure grouping behind the journey's
 * mistakes notebook. One entry per question, counts, latest wrong pick, newest
 * first — 100% deterministic (the API test pins the real wiring).
 */

const at = (minute: number) => new Date(Date.UTC(2026, 9, 17, 8, minute));

function row(over: Partial<MistakeRow> & { questionId: string }): MistakeRow {
  return {
    question: "ما القاسم المشترك الأكبر للعددين 12 و18؟",
    chosen: "3",
    createdAt: at(0),
    conceptId: "con-1",
    conceptTitle: "تحليل العدد إلى عوامل أولية",
    lessonId: "les-1",
    lessonTitle: "المفهوم 1-1",
    ...over,
  };
}

describe("groupMistakes — PHASE 161 (W6)", () => {
  it("groups per question with the miss count and the latest wrong pick", () => {
    const items = groupMistakes([
      row({ questionId: "q1", chosen: "9", createdAt: at(5) }),
      row({ questionId: "q1", chosen: "3", createdAt: at(1) }),
      row({ questionId: "q1", chosen: "2", createdAt: at(3) }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]!.questionId).toBe("q1");
    expect(items[0]!.count).toBe(3);
    // The most recent wrong pick (minute 5) is the one the notebook shows.
    expect(items[0]!.chosen).toBe("9");
    expect(items[0]!.lastAt).toBe(at(5).toISOString());
  });

  it("orders by the most recent miss, newest first — ties break by question id", () => {
    const items = groupMistakes([
      row({ questionId: "qB", createdAt: at(2) }),
      row({ questionId: "qA", createdAt: at(9) }),
      row({ questionId: "qC", createdAt: at(9) }),
      row({ questionId: "qD", createdAt: at(4) }),
    ]);
    expect(items.map((i) => i.questionId)).toEqual(["qA", "qC", "qD", "qB"]);
  });

  it("caps the notebook at the limit and tolerates an empty history", () => {
    const rows: MistakeRow[] = [];
    for (let i = 0; i < MISTAKE_LIMIT + 5; i += 1) rows.push(row({ questionId: `q${i}`, createdAt: at(i) }));
    expect(groupMistakes(rows)).toHaveLength(MISTAKE_LIMIT);
    expect(groupMistakes([])).toEqual([]);
    expect(groupMistakes(rows, 0)).toEqual([]);
  });

  it("keeps the concept and lesson names of the question when the row has them", () => {
    const items = groupMistakes([row({ questionId: "q1" })]);
    expect(items[0]!.conceptId).toBe("con-1");
    expect(items[0]!.conceptTitle).toBe("تحليل العدد إلى عوامل أولية");
    expect(items[0]!.lessonTitle).toBe("المفهوم 1-1");
  });
});
