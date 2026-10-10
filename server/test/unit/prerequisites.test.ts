import { describe, expect, it } from "vitest";
import {
  buildPrerequisiteGraph,
  conceptIndexFor,
  nextConceptAfter,
  normalizeConcept,
  prerequisiteOf,
  type ConceptRef,
} from "../../src/modules/progress/prerequisites.js";

/**
 * PHASE 95 — the prerequisite graph is derived from the *stored* concept order
 * (concepts.code / printed order) plus real mastery. No invented relations.
 */

const chain: ConceptRef[] = [
  { id: "c1", title: "الأعداد الطبيعية" },
  { id: "c2", title: "الأعداد العشرية" },
  { id: "c3", title: "جمع الكسور" },
];

describe("normalizeConcept", () => {
  it("unifies hamza/yaa/taa-marbuta and strips diacritics", () => {
    expect(normalizeConcept("الأعدادُ العَشريّة")).toBe(normalizeConcept("الاعداد العشريه"));
    expect(normalizeConcept("  جَمْع   الكسور ")).toBe("جمع الكسور");
  });
});

describe("buildPrerequisiteGraph", () => {
  it("chains consecutive concepts in printed order", () => {
    const g = buildPrerequisiteGraph(chain, {});
    expect(g.nodes.map((n) => n.conceptId)).toEqual(["c1", "c2", "c3"]);
    expect(g.edges).toEqual([
      { from: "c1", to: "c2" },
      { from: "c2", to: "c3" },
    ]);
  });

  it("attaches real mastery as percent + band, and leaves untracked nodes null", () => {
    const g = buildPrerequisiteGraph(chain, { c2: 0.83 });
    const [n1, n2, n3] = g.nodes;
    expect(n1).toMatchObject({ mastery: null, percent: null, level: null, labelAr: null });
    expect(n2).toMatchObject({ mastery: 0.83, percent: 83, level: "mastered", labelAr: "متقن" });
    expect(n3).toMatchObject({ mastery: null });
  });

  it("clamps out-of-range mastery and never fabricates a 0 for untracked", () => {
    const g = buildPrerequisiteGraph(chain, { c1: 1.7, c2: -0.2 });
    expect(g.nodes[0]!.mastery).toBe(1);
    expect(g.nodes[0]!.percent).toBe(100);
    expect(g.nodes[1]!.mastery).toBe(0);
    expect(g.nodes[1]!.percent).toBe(0);
    expect(g.nodes[2]!.mastery).toBeNull();
  });

  it("picks the weakest *tracked* node, ignoring untracked ones", () => {
    const g = buildPrerequisiteGraph(chain, { c1: 0.9, c2: 0.3 });
    expect(g.weakest?.conceptId).toBe("c2");
    // No tracked node → no weakest (never a fake one).
    expect(buildPrerequisiteGraph(chain, {}).weakest).toBeNull();
  });

  it("handles a single-concept lesson (no edges)", () => {
    const g = buildPrerequisiteGraph([chain[0]!], { c1: 0.5 });
    expect(g.edges).toEqual([]);
    expect(g.nodes).toHaveLength(1);
  });

  it("handles an empty lesson", () => {
    const g = buildPrerequisiteGraph([], {});
    expect(g.nodes).toEqual([]);
    expect(g.edges).toEqual([]);
    expect(g.weakest).toBeNull();
  });
});

describe("conceptIndexFor", () => {
  it("finds the concept named in the student's question", () => {
    expect(conceptIndexFor(chain, ["اشرح لي الأعداد العشرية"])).toBe(1);
  });

  it("prefers the longest (least ambiguous) title match", () => {
    // «الأعداد» is a prefix of both c1 and c2; the full c2 title must win.
    expect(conceptIndexFor(chain, ["الأعداد العشرية"])).toBe(1);
  });

  it("falls back to the tutor's last message when the question is a bare answer", () => {
    expect(conceptIndexFor(chain, ["٩", "سنحسب جمع الكسور الآن"])).toBe(2);
  });

  it("returns -1 when nothing matches (never guesses)", () => {
    expect(conceptIndexFor(chain, ["مش فاهم", undefined])).toBe(-1);
    expect(conceptIndexFor(chain, [])).toBe(-1);
    expect(conceptIndexFor([], ["الأعداد"])).toBe(-1);
  });

  it("ignores very short titles that would match by accident", () => {
    const short: ConceptRef[] = [{ id: "x", title: "٩" }];
    expect(conceptIndexFor(short, ["٩"])).toBe(-1);
  });
});

describe("prerequisiteOf / nextConceptAfter", () => {
  it("gives the previous concept as the prerequisite and the following as next", () => {
    const g = buildPrerequisiteGraph(chain, { c1: 0.4 });
    expect(prerequisiteOf(g, 1)).toEqual({ title: "الأعداد الطبيعية", mastery: 0.4 });
    expect(prerequisiteOf(g, 0)).toBeNull();
    expect(prerequisiteOf(g, -1)).toBeNull();
    expect(prerequisiteOf(g, 99)).toBeNull();
    expect(nextConceptAfter(chain, 1)).toBe("جمع الكسور");
    expect(nextConceptAfter(chain, 2)).toBeNull();
    expect(nextConceptAfter(chain, -1)).toBeNull();
  });
});
