import { describe, expect, it } from "vitest";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_T1_BOOK_END,
  EGYPT_T1_BOOK_START,
  EGYPT_T1_UNITS,
  assertTreeMatchesTheBook,
  conceptBookRange,
  conceptDocument,
  isConsistent,
  loadBookPage,
} from "../../src/db/egyptT1.js";

/**
 * PHASE 69 — Egypt Grade-6 Mathematics, Arabic-medium official Ministry book.
 *
 * The app lesson is the printed concept (المفهوم); each lesson's `concepts` are
 * the printed «أهداف التعلم» bullets of that concept's lessons, verbatim. These
 * tests pin that alignment and the book-matching verifier: every objective must
 * still be printed in its concept's own OCR range, and every lesson start page
 * must print the objective header.
 */

const arFold = (text: string) =>
  text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0624/g, "\u0648")
    .replace(/\u0626/g, "\u064A")
    .replace(/[^\u0621-\u064A0-9]/g, "");

const allRanges = () => {
  const out: { key: string; from: number; to: number }[] = [];
  EGYPT_T1_UNITS.forEach((unit, ui) =>
    unit.concepts.forEach((concept, ci) => out.push({ key: concept.key, ...conceptBookRange(ui, ci) })),
  );
  return out;
};

describe("PHASE 69 — Egypt Grade-6 Mathematics (Arabic) printed-objective alignment", () => {
  it("has a table whose invariants hold: unit bounds and gap-free tiling", () => {
    const { ok, problems } = isConsistent();
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
  });

  it("matches the book: every content page is mapped and every objective is printed in range", () => {
    const result = assertTreeMatchesTheBook();
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
    // The picture-only pages are the only ones without text.
    expect(result.pagesChecked).toBe(EGYPT_T1_BOOK_END - EGYPT_T1_BOOK_START + 1 - 4);
  });

  it("reads the book at its own page offset", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(9);
    expect(loadBookPage(1)).toContain("قابلية القسمة");
  });

  it("carries the printed «هدف التعلم» header on every lesson start page", () => {
    let starts = 0;
    EGYPT_T1_UNITS.forEach((unit) =>
      unit.concepts.forEach((concept) =>
        concept.lessonStarts.forEach((start) => {
          expect(loadBookPage(start), `${concept.key} lesson @${start}`).toMatch(/(?:أهداف|هدف)\s*التعلم/);
          starts++;
        }),
      ),
    );
    expect(starts).toBe(33);
  });

  it("gives every app lesson the printed «أهداف التعلم» bullets of its lessons", () => {
    let bullets = 0;
    EGYPT_T1_UNITS.forEach((unit) =>
      unit.concepts.forEach((concept) => {
        expect(concept.concepts.length).toBeGreaterThan(0);
        for (const target of concept.concepts) {
          // The app lesson's own title is not one of its concepts.
          expect(target).not.toBe(concept.title);
          bullets++;
        }
      }),
    );
    expect(bullets).toBe(47);
  });

  it("keeps every objective's wording in step with the OCR of its own pages", () => {
    let checked = 0;
    EGYPT_T1_UNITS.forEach((unit, ui) => {
      unit.concepts.forEach((concept, ci) => {
        const { from, to } = conceptBookRange(ui, ci);
        let text = "";
        for (let book = from; book <= to; book++) text += " " + loadBookPage(book);
        const haystack = arFold(text);
        for (const target of concept.concepts) {
          const fingerprint = arFold(target).slice(0, 15);
          if (fingerprint.length < 8) continue;
          expect(haystack, `${concept.key}: ${target}`).toContain(fingerprint);
          checked++;
        }
      });
    });
    expect(checked).toBe(47);
  });

  it("tiles printed pages 0–111 once each and keeps each unit opener with its first concept", () => {
    const ranges = allRanges();
    expect(ranges.length).toBe(10);
    expect(ranges[0]!.from).toBe(EGYPT_T1_BOOK_START);
    expect(ranges[ranges.length - 1]!.to).toBe(EGYPT_T1_BOOK_END);
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
    // Unit opener pages (OCR-verified at PDFs 9, 23, 43, 67, 77, 89, 107).
    expect(EGYPT_T1_UNITS.map((_, ui) => conceptBookRange(ui, 0).from)).toEqual([0, 14, 34, 58, 68, 80, 98]);
  });

  it("documents the picture-only pages and gives each concept a book-grounded document", () => {
    for (const book of [13, 67, 79, 97]) expect(loadBookPage(book)).toBe("");
    EGYPT_T1_UNITS.forEach((unit, ui) => {
      unit.concepts.forEach((concept, ci) => {
        const { from, to } = conceptBookRange(ui, ci);
        const doc = conceptDocument(ui, ci);
        expect(doc.length).toBeGreaterThan(0);
        for (let book = from; book <= to; book++) {
          if (loadBookPage(book)) expect(doc).toContain(`[صفحة الكتاب ${book}]`);
        }
      });
    });
  });
});
