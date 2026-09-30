import { describe, expect, it } from "vitest";
import {
  parseNumberLineWidget,
  parseStoredWidgets,
  snapToStep,
  splitReplyWidgets,
  widgetsForWire,
} from "../../src/modules/tutor/widgets.js";

/**
 * PHASE 51 — «خط الأعداد»: the numbers the model sends must draw, the key must
 * never reach the browser, and a broken line must degrade to words.
 */
describe("number-line widgets (PHASE 51)", () => {
  const good = {
    kind: "numberline",
    from: 0,
    to: 10,
    step: 1,
    markers: [{ value: 3, label: "ثلاثة" }],
    question: "أين يقع العدد 7؟",
    answer: 7,
  };

  it("accepts a drawable line with its key", () => {
    const w = parseNumberLineWidget(good);
    expect(w).toMatchObject({ from: 0, to: 10, step: 1, answer: 7 });
    expect(w!.markers).toHaveLength(1);
  });

  it("rejects a reversed range", () => {
    expect(parseNumberLineWidget({ ...good, from: 10, to: 0 })).toBeNull();
  });

  it("rejects a step that would paint a thousand ticks", () => {
    expect(parseNumberLineWidget({ ...good, from: 0, to: 100, step: 0.001 })).toBeNull();
  });

  it("rejects markers off the line and keys outside it", () => {
    expect(parseNumberLineWidget({ ...good, markers: [{ value: 99 }] })).toBeNull();
    expect(parseNumberLineWidget({ ...good, answer: 99 })).toBeNull();
  });

  it("rejects non-numbers and absurd spans", () => {
    expect(parseNumberLineWidget({ ...good, from: "a lot" })).toBeNull();
    expect(parseNumberLineWidget({ ...good, to: 100000 })).toBeNull();
    expect(parseNumberLineWidget({ ...good, step: 0 })).toBeNull();
  });

  it("strips the answer key on the wire, keeps the question", () => {
    const views = widgetsForWire([parseNumberLineWidget(good)!]);
    expect(views).toHaveLength(1);
    expect(views![0]).not.toHaveProperty("answer");
    expect(views![0]).toMatchObject({ from: 0, to: 10, question: "أين يقع العدد 7؟" });
  });

  it("reads stored rows tolerantly", () => {
    expect(parseStoredWidgets(null)).toBeUndefined();
    expect(parseStoredWidgets("not json")).toBeUndefined();
    expect(parseStoredWidgets(JSON.stringify([good]))).toHaveLength(1);
    // A corrupt entry degrades to "no widgets", never a 500.
    expect(parseStoredWidgets(JSON.stringify([{ kind: "numberline", from: 5, to: 1, step: 1 }]))).toBeUndefined();
  });

  it("demotes a broken widget to its text fallback", () => {
    const { parts, widgets } = splitReplyWidgets([
      { type: "text", text: "شرح" },
      { type: "widget", text: "خط بديل", widget: { kind: "numberline", from: 9, to: 1, step: 1 } },
      { type: "widget", text: "", widget: good },
    ]);
    expect(widgets).toHaveLength(1);
    expect(widgets[0]!.answer).toBe(7);
    // The student still reads both texts; the broken line leaves no hole.
    expect(parts.map((p) => p.text)).toEqual(["شرح", "خط بديل"]);
  });

  it("snaps pins to the line's own step", () => {
    expect(snapToStep(0.76, 0, 0.25)).toBe(0.75);
    expect(snapToStep(7.4, 0, 1)).toBe(7);
    // No binary dust: 0.1-steps print cleanly.
    expect(snapToStep(0.30000000000000004, 0, 0.1)).toBe(0.3);
  });
});
