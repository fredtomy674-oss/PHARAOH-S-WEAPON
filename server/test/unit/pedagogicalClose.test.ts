import { describe, expect, it } from "vitest";
import {
  PEDAGOGICAL_CLOSE_LABELS,
  ensurePedagogicalClose,
  hasPedagogicalClose,
  pedagogicalCloseFor,
} from "../../src/modules/tutor/pedagogicalClose.js";
import { TEACHING_ACTION_TYPES } from "../../src/modules/tutor/teachingActions.js";

/**
 * PHASE 188 — the close is a contract, not a suggestion. Every action must end
 * with a student move and a teacher follow-up, the model's own close must never
 * be duplicated, and a foreign-language lesson must receive the same contract
 * in its own language.
 */
describe("PHASE 188 — pedagogical close", () => {
  it("names both a student action and a teacher follow-up for every teaching action", () => {
    for (const action of TEACHING_ACTION_TYPES) {
      const close = pedagogicalCloseFor(action, "ar");
      expect(close).toContain(`${PEDAGOGICAL_CLOSE_LABELS.ar}:`);
      expect(close).toContain("وأنا سأ");
      expect(close.length).toBeGreaterThan(30);
    }
  });

  it("appends one deterministic close when the model forgot it", () => {
    const text = "الفلزات مواد لها بريق ولمعان.";
    const closed = ensurePedagogicalClose(text, "practice", "ar");
    expect(closed.startsWith(text)).toBe(true);
    expect(closed).toContain("الخطوة القادمة:");
    expect(closed).toContain("حل السؤال");
    expect(closed).toContain("وأنا سأصححها");
    expect(hasPedagogicalClose(closed, "ar")).toBe(true);
  });

  it("does not duplicate a close the model already wrote", () => {
    const modelClose = "الخطوة القادمة: **اكتب المثال** في دفترك، وأنا سأراجع معك الخطوة الأولى.";
    const closed = ensurePedagogicalClose(`اشرح الفكرة.\n\n${modelClose}`, "explain", "ar");
    expect(closed.match(/الخطوة القادمة:/g)).toHaveLength(1);
    expect(closed).toBe(`اشرح الفكرة.\n\n${modelClose}`);
  });

  it("keeps the contract in the language the lesson is taught in", () => {
    expect(ensurePedagogicalClose("Explain.", "practice", "en")).toContain("Next step:");
    expect(ensurePedagogicalClose("Explique.", "practice", "fr")).toContain("Étape suivante :");
    expect(ensurePedagogicalClose("Erkläre.", "practice", "de")).toContain("Nächster Schritt:");
  });

  it("uses the action-specific move rather than one generic sentence", () => {
    expect(pedagogicalCloseFor("diagnose", "ar")).toContain("أجب عن السؤال");
    expect(pedagogicalCloseFor("hint", "ar")).toContain("جرّب الخطوة الأولى");
    expect(pedagogicalCloseFor("continue_learning", "ar")).toContain("الفكرة التالية");
  });
});
