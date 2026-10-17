import { describe, expect, it } from "vitest";
import {
  BOARD_LINE_MAX_CHARS,
  BOARD_MAX_LINES,
  BOARD_TITLE_MAX_CHARS,
  boardForWire,
  parseStoredBoard,
  sanitizeBoard,
} from "../../src/modules/tutor/board.js";
import { parseTutorResponse } from "../../src/modules/tutor/responseProcessor.js";

/**
 * PHASE 166 — the board a reply may write is MODEL output, so it is treated the
 * way widgets are: validated and capped on the way in, never trusted. The tests
 * below pin the two guarantees the room relies on: a usable board survives
 * intact, and a malformed one degrades (trimmed, dropped, or ignored) without
 * ever failing the reply that carries it.
 */
describe("sanitizeBoard", () => {
  it("keeps a well-formed board: title + typed lines in order", () => {
    const board = sanitizeBoard({
      title: "خلاصة الدرس",
      lines: [
        { kind: "point", text: "نبدأ بالمثال المحلول" },
        { kind: "step", text: "ثم نحل خطوة بخطوة" },
        { kind: "answer", text: "النتيجة 42" },
      ],
    });
    expect(board).toEqual({
      title: "خلاصة الدرس",
      lines: [
        { kind: "point", text: "نبدأ بالمثال المحلول" },
        { kind: "step", text: "ثم نحل خطوة بخطوة" },
        { kind: "answer", text: "النتيجة 42" },
      ],
    });
  });

  it("accepts plain strings as point lines (a model that skipped the shape)", () => {
    const board = sanitizeBoard({ title: "عنوان", lines: ["سطر أول", "سطر ثان"] });
    expect(board?.lines).toEqual([
      { kind: "point", text: "سطر أول" },
      { kind: "point", text: "سطر ثان" },
    ]);
  });

  it("degrades an unknown kind to «point» instead of dropping the line", () => {
    const board = sanitizeBoard({ lines: [{ kind: "bullet", text: "سطر" }] });
    expect(board?.lines).toEqual([{ kind: "point", text: "سطر" }]);
  });

  it("caps the number of lines: the board has a fixed size", () => {
    const lines = Array.from({ length: 12 }, (_, i) => ({ kind: "point", text: `سطر ${i + 1}` }));
    const board = sanitizeBoard({ lines });
    expect(board?.lines).toHaveLength(BOARD_MAX_LINES);
    expect(board?.lines[0]!.text).toBe("سطر 1");
  });

  it("trims an over-long line to the cap, preferring a word boundary", () => {
    const longWord = "ك".repeat(BOARD_LINE_MAX_CHARS + 10);
    const board = sanitizeBoard({ lines: [{ kind: "point", text: longWord }] });
    expect(board?.lines[0]!.text.length).toBeLessThanOrEqual(BOARD_LINE_MAX_CHARS);

    const manyWords = Array.from({ length: 40 }, (_, i) => `كلمة${i}`).join(" ");
    const trimmed = sanitizeBoard({ lines: [{ kind: "point", text: manyWords }] });
    expect(trimmed?.lines[0]!.text.length).toBeLessThanOrEqual(BOARD_LINE_MAX_CHARS);
    // No half-words: the cut lands between two tokens.
    expect(trimmed?.lines[0]!.text.endsWith("كلمة")).toBe(false);
    expect(trimmed?.lines[0]!.text).toMatch(/كلمة\d+$/);
  });

  it("caps the title and collapses whitespace", () => {
    const board = sanitizeBoard({ title: `  عنوان   طويل ${"ن".repeat(60)}  `, lines: ["سطر"] });
    expect(board!.title!.length).toBeLessThanOrEqual(BOARD_TITLE_MAX_CHARS);
    expect(board!.title).not.toContain("  ");
    expect(board!.title!.startsWith("عنوان طويل")).toBe(true);
  });

  it("drops empty lines and returns null when nothing drawable remains", () => {
    expect(sanitizeBoard({ title: "  ", lines: ["   ", { kind: "point", text: "" }, 42] })).toBeNull();
    expect(sanitizeBoard({ lines: [] })).toBeNull();
    expect(sanitizeBoard(null)).toBeNull();
    expect(sanitizeBoard("board")).toBeNull();
    expect(sanitizeBoard({ lines: "not an array" })).toBeNull();
  });

  it("keeps a title-only board (a heading is still a write-up)", () => {
    expect(sanitizeBoard({ title: "تمارين اليوم" })).toEqual({ title: "تمارين اليوم", lines: [] });
  });
});

describe("parseStoredBoard / boardForWire", () => {
  it("round-trips a stored board and returns null for a legacy or broken cell", () => {
    const stored = JSON.stringify({ title: "عنوان", lines: [{ kind: "step", text: "خطوة" }] });
    expect(parseStoredBoard(stored)).toEqual({ title: "عنوان", lines: [{ kind: "step", text: "خطوة" }] });
    expect(parseStoredBoard(null)).toBeNull();
    expect(parseStoredBoard(undefined)).toBeNull();
    expect(parseStoredBoard("")).toBeNull();
    expect(parseStoredBoard("{not json")).toBeNull();
  });

  it("maps a null board to an absent wire field and re-sanitizes what travels", () => {
    expect(boardForWire(null)).toBeUndefined();
    expect(boardForWire({ title: "عنوان", lines: [{ kind: "note", text: "ملاحظة" }] })).toEqual({
      title: "عنوان",
      lines: [{ kind: "note", text: "ملاحظة" }],
    });
  });
});

describe("the zap through parseTutorResponse", () => {
  it("carries the board beside the reply", () => {
    const raw = JSON.stringify({
      content: "شرح",
      parts: [{ type: "text", text: "شرح" }],
      board: { title: "خلاصة", lines: [{ kind: "point", text: "فكرة" }] },
      assessment: { conceptsTouched: [], confidence: 0.5 },
    });
    const parsed = parseTutorResponse(raw);
    expect(sanitizeBoard(parsed.board)).toEqual({ title: "خلاصة", lines: [{ kind: "point", text: "فكرة" }] });
  });

  it("never lets a malformed board kill the reply that carries it", () => {
    const raw = JSON.stringify({
      content: "شرح سليم",
      parts: [{ type: "text", text: "شرح سليم" }],
      board: "لقد نسيت الشكل",
      assessment: { conceptsTouched: [], confidence: 0.5 },
    });
    const parsed = parseTutorResponse(raw);
    expect(parsed.content).toBe("شرح سليم");
    expect(sanitizeBoard(parsed.board)).toBeNull();
  });
});
