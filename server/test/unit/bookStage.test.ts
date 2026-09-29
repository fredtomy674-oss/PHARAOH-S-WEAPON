// PHASE 48 — book stage mapping tests.
//
// The room shows a page and cites it as `[صفحة الكتاب N]`. That only works if
// the stage's page numbers are the numbers printed on the paper, so these
// tests pin the concept→page-range mapping and the book→scan page arithmetic.
import { describe, expect, it } from "vitest";
import {
  EGYPT_G6_MATH_CURRICULUM,
  bookPageText,
  bookPageToPdfPage,
  bookPagesInText,
  pageImagePath,
  stageForLesson,
} from "../../src/modules/curriculum/bookStage.js";
import { BOOK_TO_PDF_OFFSET, EGYPT_T1_BOOK_END } from "../../src/db/egyptT1.js";

describe("book page arithmetic", () => {
  it("maps a printed page to its scan page by the verified offset", () => {
    // book page 1 is scan page 10 (verified against the scan during PHASE 47).
    expect(bookPageToPdfPage(1)).toBe(1 + BOOK_TO_PDF_OFFSET);
    expect(bookPageToPdfPage(1)).toBe(10);
  });

  it("refuses pages outside the book and non-integers", () => {
    expect(pageImagePath(-1)).toBeNull();
    expect(pageImagePath(EGYPT_T1_BOOK_END + 1)).toBeNull();
    expect(pageImagePath(1.5)).toBeNull();
    expect(pageImagePath(Number.NaN)).toBeNull();
  });

  it("resolves an installed page image, or null when pages are absent", () => {
    // The pages are runtime data (derived from the source PDF), so this test
    // asserts the *contract* — a path or nothing, never a crash or a traversal.
    const resolved = pageImagePath(1);
    expect(resolved === null || resolved.endsWith("pages-010.jpg")).toBe(true);
  });
});

describe("lesson stage", () => {
  it("returns null for curricula that ship no pages", () => {
    expect(stageForLesson("sa-1-math", "l-con-1-1")).toBeNull();
  });

  it("returns null for a lesson code that is not a concept of the book", () => {
    expect(stageForLesson(EGYPT_G6_MATH_CURRICULUM, "l-con-9-9")).toBeNull();
    expect(stageForLesson(EGYPT_G6_MATH_CURRICULUM, "not-a-concept")).toBeNull();
  });

  it("maps the first concept to the unit opener page through the next boundary", () => {
    const stage = stageForLesson(EGYPT_G6_MATH_CURRICULUM, "l-con-1-1");
    expect(stage).not.toBeNull();
    expect(stage!.conceptKey).toBe("1-1");
    // Concept 1-1 starts on book page 1, but its unit has an unnumbered opener
    // page 0 (الفيديو + المفردات) that belongs to the same lesson.
    expect(stage!.fromBookPage).toBe(0);
    // The next unit's opener (book page 14) belongs to unit 2, not to 1-1.
    expect(stage!.toBookPage).toBe(13);
    expect(stage!.pages.map((p) => p.bookPage)).toEqual(
      Array.from({ length: 14 }, (_, i) => i),
    );
  });

  it("gives a unit's first concept its opener page and runs to the next concept", () => {
    // Concept 1-2 is the first concept of unit 2, so it also owns that unit's
    // opener page (book 14: الفيديو + المفردات) — and it covers ALL of its
    // lessons, which run until the page before the next concept starts (2-2
    // begins on book 23).
    const stage = stageForLesson(EGYPT_G6_MATH_CURRICULUM, "l-con-1-2");
    expect(stage!.fromBookPage).toBe(14);
    expect(stage!.toBookPage).toBe(22);
  });

  it("starts a following concept on its own first page", () => {
    // A concept that is not its unit's first has no opener to claim.
    const stage = stageForLesson(EGYPT_G6_MATH_CURRICULUM, "l-con-2-2");
    expect(stage!.fromBookPage).toBe(23);
    expect(stage!.toBookPage).toBe(27);
  });

  it("lets the last concept run to the end of the book", () => {
    const stage = stageForLesson(EGYPT_G6_MATH_CURRICULUM, "l-con-1-7");
    expect(stage!.toBookPage).toBe(EGYPT_T1_BOOK_END);
  });

  it("covers every concept of the book exactly once, with no gaps or overlaps", () => {
    const keys = ["1-1", "1-2", "2-2", "3-2", "1-3", "2-3", "1-4", "1-5", "1-6", "1-7"];
    const seen = new Map<number, string>();
    for (const key of keys) {
      const stage = stageForLesson(EGYPT_G6_MATH_CURRICULUM, `l-con-${key}`)!;
      for (const page of stage.pages) {
        expect(seen.has(page.bookPage), `page ${page.bookPage} claimed by two concepts`).toBe(false);
        seen.set(page.bookPage, key);
      }
    }
    // Every printed page of the book is taught by exactly one lesson.
    expect(Math.max(...seen.keys())).toBe(EGYPT_T1_BOOK_END);
    expect(seen.size).toBe(EGYPT_T1_BOOK_END + 1);
  });

  it("reports hasImages only when a page was actually extracted", () => {
    const stage = stageForLesson(EGYPT_G6_MATH_CURRICULUM, "l-con-1-1")!;
    const anyPresent = stage.pages.some((p) => p.present);
    expect(stage.hasImages).toBe(anyPresent);
  });
});

// PHASE 48 (part 2) — the two halves of "the teacher sees the page": the pages a
// retrieved passage came from (citations) and the text of the page on screen.
describe("book page references", () => {
  it("reads the pages out of retrieved passages, unique and sorted", () => {
    // The exact shape the seeder writes into a lesson document.
    const text = [
      "[صفحة الكتاب 5]\nالقواسم: 1 و 2",
      "[صفحة الكتاب 2]\nالمفهوم: قابلية القسمة",
      "[صفحة الكتاب 5]\nالأعداد 102 و 225",
    ].join("\n\n");
    expect(bookPagesInText(text)).toEqual([2, 5]);
  });

  it("finds nothing in text with no page marker", () => {
    expect(bookPagesInText("نص بلا أي إشارة إلى صفحة")).toEqual([]);
    expect(bookPagesInText("")).toEqual([]);
  });

  it("ignores a page number outside the book instead of trusting it", () => {
    // A hallucinated «[صفحة الكتاب 9999]» must never become a stage jump.
    expect(bookPagesInText("[صفحة الكتاب 9999]\n...")).toEqual([]);
    expect(bookPagesInText(`[صفحة الكتاب ${EGYPT_T1_BOOK_END + 1}]`)).toEqual([]);
    // The unnumbered opener is page 0 and is a real page of the first lesson.
    expect(bookPagesInText("[صفحة الكتاب 0]")).toEqual([0]);
  });

  it("keeps the opener page: it is a place the tutor may point at", () => {
    expect(bookPagesInText("[صفحة الكتاب 0]\n[صفحة الكتاب 1]")).toEqual([0, 1]);
  });
});

describe("the page in front of the student", () => {
  it("returns the page's own text, without the marker that framed it", () => {
    const text = bookPageText(1);
    if (text.length === 0) {
      // A deployment without the OCR corpus has no text — a supported mode.
      expect(bookPageText(EGYPT_T1_BOOK_END + 1)).toBe("");
      return;
    }
    expect(text).not.toContain("[صفحة الكتاب");
    // The text must be the page's, not a neighbour's: the corpus is per page.
    expect(bookPageText(2)).not.toBe(text);
  });

  it("returns nothing for a page outside the book or a non-integer", () => {
    expect(bookPageText(-1)).toBe("");
    expect(bookPageText(EGYPT_T1_BOOK_END + 1)).toBe("");
    expect(bookPageText(1.5)).toBe("");
    expect(bookPageText(Number.NaN)).toBe("");
  });
});