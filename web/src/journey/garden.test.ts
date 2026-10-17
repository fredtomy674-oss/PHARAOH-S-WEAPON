import { describe, expect, it } from "vitest";
import { GARDEN_MAX_PLANTS, growGarden, plantKindOf, type GardenConceptInput } from "./garden.js";

/**
 * PHASE 161 (W6) — the garden's contract: growth is a pure function of mastery.
 * Same mastery ⇒ same garden (element-for-element), for any input order.
 */

const concept = (over: Partial<GardenConceptInput> & { conceptId: string }): GardenConceptInput => ({
  title: `مفهوم ${over.conceptId}`,
  level: "developing",
  mastery: 0.4,
  ...over,
});

describe("growGarden — PHASE 161 (W6)", () => {
  it("is 100% deterministic — same mastery, same garden, even re-ordered", () => {
    const input: GardenConceptInput[] = [
      concept({ conceptId: "c1", level: "mastered", mastery: 0.92 }),
      concept({ conceptId: "c2", level: "advanced", mastery: 0.71 }),
      concept({ conceptId: "c3", level: "needs_review", mastery: 0.18 }),
      concept({ conceptId: "c4", level: "untested", mastery: 0 }),
      concept({ conceptId: "c5", level: "developing", mastery: 0.44 }),
    ];
    const first = growGarden(input);
    const again = growGarden(input);
    const shuffled = growGarden([input[3]!, input[1]!, input[4]!, input[0]!, input[2]!]);
    expect(again).toEqual(first);
    expect(shuffled).toEqual(first);
  });

  it("maps every level to its plant and puts the strongest in the first slot", () => {
    const garden = growGarden([
      concept({ conceptId: "weak", level: "developing", mastery: 0.2 }),
      concept({ conceptId: "strong", level: "mastered", mastery: 0.95 }),
      concept({ conceptId: "mid", level: "advanced", mastery: 0.6 }),
    ]);
    expect(garden.plants.map((p) => p.conceptId)).toEqual(["strong", "mid", "weak"]);
    expect(garden.plants.map((p) => p.kind)).toEqual(["palm", "papyrus", "lotus"]);
    expect(garden.mastered).toBe(1);
    // Slots spread deterministically across the bank, never on the edges.
    expect(garden.plants[0]!.x).toBeCloseTo(1 / 4);
    expect(garden.plants[2]!.x).toBeCloseTo(3 / 4);
  });

  it("types every level, including an untested concept", () => {
    expect(plantKindOf("mastered")).toBe("palm");
    expect(plantKindOf("advanced")).toBe("papyrus");
    expect(plantKindOf("developing")).toBe("lotus");
    expect(plantKindOf("needs_review")).toBe("sprout");
    expect(plantKindOf("untested")).toBe("bud");
  });

  it("reads water and birds off the whole picture — and stays honest when empty", () => {
    const full = growGarden([concept({ conceptId: "a", level: "mastered", mastery: 1 }), concept({ conceptId: "b", level: "mastered", mastery: 1 })]);
    expect(full.river).toBe(3);
    expect(full.birds).toBe(2);

    const dry = growGarden([concept({ conceptId: "a", level: "needs_review", mastery: 0 })]);
    expect(dry.river).toBe(0);
    expect(dry.birds).toBe(0);

    const empty = growGarden([]);
    expect(empty).toEqual({ plants: [], mastered: 0, river: 0, birds: 0 });
  });

  it("caps the bank at twelve plants and bounds the scale", () => {
    const many: GardenConceptInput[] = Array.from({ length: GARDEN_MAX_PLANTS + 6 }, (_, i) =>
      concept({ conceptId: `c${String(i).padStart(2, "0")}`, mastery: i / (GARDEN_MAX_PLANTS + 6) }),
    );
    const garden = growGarden(many);
    expect(garden.plants).toHaveLength(GARDEN_MAX_PLANTS);
    for (const p of garden.plants) {
      expect(p.scale).toBeGreaterThanOrEqual(0.8);
      expect(p.scale).toBeLessThanOrEqual(1.15);
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(1);
    }
  });
});
