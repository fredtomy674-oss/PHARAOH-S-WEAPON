import type { MasteryLevel } from "../api.js";

/**
 * PHASE 161 (W6) — «حديقتي على النيل»: a calm, deterministic garden.
 *
 * The garden grows from mastery data alone: every mastered concept becomes a
 * palm, every advanced concept a papyrus head, and so on down the levels. The
 * same mastery always yields the same plants, in the same slots, at the same
 * heights — no randomness anywhere (the unit tests pin exactly this), so the
 * garden never flickers between visits and can be cached or compared.
 */

export type PlantKind = "palm" | "papyrus" | "lotus" | "sprout" | "bud";

export interface GardenConceptInput {
  conceptId: string;
  title: string;
  level: MasteryLevel | "untested";
  /** Decayed mastery 0..1 (the number the level badge shows). */
  mastery: number;
}

export interface GardenPlant {
  conceptId: string;
  title: string;
  kind: PlantKind;
  /** 0..1 position along the bank — a deterministic slot from the sorted order. */
  x: number;
  /** 0.8..1.15 — taller with more mastery. */
  scale: number;
}

export interface Garden {
  plants: GardenPlant[];
  /** Palms — the concepts at «متقن». */
  mastered: number;
  /** 0..3 — how full the river reads (rounded average mastery). */
  river: number;
  /** Birds in the sky — one per mastered concept, capped at three. */
  birds: number;
}

/** The bank holds twelve slots; the strongest twelve concepts grow. */
export const GARDEN_MAX_PLANTS = 12;

const KIND_BY_LEVEL: Record<MasteryLevel | "untested", PlantKind> = {
  mastered: "palm",
  advanced: "papyrus",
  developing: "lotus",
  needs_review: "sprout",
  untested: "bud",
};

export function plantKindOf(level: MasteryLevel | "untested"): PlantKind {
  return KIND_BY_LEVEL[level];
}

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(Math.max(n, 0), 1) : 0);

/**
 * Grows the garden: strongest concept in the first slot, the rest following by
 * mastery (ties break by concept id, so a re-ordered input yields the same
 * garden). Water and birds read the whole picture — the river fills with the
 * average mastery, the sky gets a bird per palm (max three).
 */
export function growGarden(concepts: GardenConceptInput[]): Garden {
  const sorted = [...concepts]
    .sort((a, b) => b.mastery - a.mastery || (a.conceptId < b.conceptId ? -1 : 1))
    .slice(0, GARDEN_MAX_PLANTS);
  const n = sorted.length;
  const plants: GardenPlant[] = sorted.map((c, i) => ({
    conceptId: c.conceptId,
    title: c.title,
    kind: plantKindOf(c.level),
    x: (i + 1) / (n + 1),
    scale: 0.8 + clamp01(c.mastery) * 0.35,
  }));
  const mastered = plants.filter((p) => p.kind === "palm").length;
  const avg = n === 0 ? 0 : sorted.reduce((sum, c) => sum + clamp01(c.mastery), 0) / n;
  return { plants, mastered, river: Math.round(avg * 3), birds: Math.min(3, mastered) };
}
