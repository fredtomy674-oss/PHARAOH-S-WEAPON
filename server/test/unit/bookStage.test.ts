// PHASE 48 — book stage mapping tests.
//
// The room shows a page and cites it as `[صفحة الكتاب N]`. That only works if
// the stage's page numbers are the numbers printed on the paper, so these
// tests pin the concept→page-range mapping and the book→scan page arithmetic.
//
// PHASE 74 — the stage covers every Egypt Grade-6 book, not only maths, so the
// registry test below checks each book's code prefix, its own page offset and
// its own lesson→range map.
import { describe, expect, it } from "vitest";
import {
  EGYPT_G6_MATH_CURRICULUM,
  MAX_BOOK_PAGE,
  bookPageText,
  bookPageToPdfPage,
  bookPagesInText,
  pageImagePath,
  stageForLesson,
} from "../../src/modules/curriculum/bookStage.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_T1_BOOK_END,
  allConceptRanges as mathArRanges,
} from "../../src/db/egyptT1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_EN_OFFSET,
  allConceptRanges as mathEnRanges,
} from "../../src/db/egyptMathEnT1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_FR_OFFSET,
  allConceptRanges as mathFrRanges,
} from "../../src/db/egyptMathFrT1.js";
import {
  BOOK_TO_PDF_OFFSET as SCIENCE_OFFSET,
  allConceptRanges as scienceRanges,
} from "../../src/db/egyptScienceT1.js";
import {
  BOOK_TO_PDF_OFFSET as SOCIAL_OFFSET,
  allLessonRanges as socialRanges,
} from "../../src/db/egyptSocialT1.js";
import {
  BOOK_TO_PDF_OFFSET as ARABIC_OFFSET,
  allLessonRanges as arabicRanges,
} from "../../src/db/egyptArabicT1.js";
import {
  BOOK_TO_PDF_OFFSET as ISLAMIC_OFFSET,
  allLessonRanges as islamicRanges,
} from "../../src/db/egyptIslamicT1.js";
import {
  BOOK_TO_PDF_OFFSET as CHRISTIAN_OFFSET,
  allLessonRanges as christianRanges,
} from "../../src/db/egyptChristianT1.js";
import {
  BOOK_TO_PDF_OFFSET as ICT_OFFSET,
  allLessonRanges as ictRanges,
} from "../../src/db/egyptIctT1.js";
import {
  BOOK_TO_PDF_OFFSET as ICT_G9_OFFSET,
  allLessonRanges as ictG9Ranges,
} from "../../src/db/egyptIctG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as CHRISTIAN_G9_OFFSET,
  allLessonRanges as christianG9Ranges,
} from "../../src/db/egyptChristianG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as SOCIAL_G9_OFFSET,
  allLessonRanges as socialG9Ranges,
} from "../../src/db/egyptSocialG9T1.js";

describe("book page arithmetic", () => {
  it("maps a printed page to its scan page by the book's verified offset", () => {
    // maths: book page 1 is scan page 10 (verified against the scan in PHASE 47).
    expect(bookPageToPdfPage(EGYPT_G6_MATH_CURRICULUM, 1)).toBe(1 + BOOK_TO_PDF_OFFSET);
    expect(bookPageToPdfPage(EGYPT_G6_MATH_CURRICULUM, 1)).toBe(10);
  });

  it("refuses pages outside the book and non-integers", () => {
    expect(pageImagePath(EGYPT_G6_MATH_CURRICULUM, -1)).toBeNull();
    expect(pageImagePath(EGYPT_G6_MATH_CURRICULUM, EGYPT_T1_BOOK_END + 1)).toBeNull();
    expect(pageImagePath(EGYPT_G6_MATH_CURRICULUM, 1.5)).toBeNull();
    expect(pageImagePath(EGYPT_G6_MATH_CURRICULUM, Number.NaN)).toBeNull();
  });

  it("resolves an installed page image, or null when pages are absent", () => {
    // The pages are runtime data (derived from the source PDF), so this test
    // asserts the *contract* — a path or nothing, never a crash or a traversal.
    const resolved = pageImagePath(EGYPT_G6_MATH_CURRICULUM, 1);
    expect(resolved === null || resolved.endsWith("pages-010.jpg")).toBe(true);
  });

  it("keeps each book's pages in its own directory", () => {
    // The path must carry the curriculum code: two books both have pages-010.jpg.
    const resolved = pageImagePath(EGYPT_G6_MATH_CURRICULUM, 1);
    if (resolved !== null) expect(resolved).toContain(EGYPT_G6_MATH_CURRICULUM);
  });
});

describe("lesson stage", () => {
  it("returns null for curricula that ship no pages", () => {
    expect(stageForLesson("sa-1-math", "l-con-1-1")).toBeNull();
    expect(stageForLesson("not-a-book", "l-con-1-1")).toBeNull();
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

  it("registers every Egypt book with its own prefix, ranges and page offset", () => {
    // Each book's flattened ranges are the source of truth the seeder used, so
    // the stage must agree with them code-for-code and page-for-page.
    const books: { code: string; prefix: string; offset: number; keyToCode?: (k: string) => string; ranges: { key: string; from: number; to: number }[] }[] = [
      { code: EGYPT_G6_MATH_CURRICULUM, prefix: "l-con-", offset: BOOK_TO_PDF_OFFSET, ranges: mathArRanges() },
      { code: "eg-g6-math-en", prefix: "l-men-", offset: MATH_EN_OFFSET, keyToCode: (k) => k.replace(".", "-"), ranges: mathEnRanges() },
      { code: "eg-g6-math-fr", prefix: "l-mfr-", offset: MATH_FR_OFFSET, keyToCode: (k) => k.replace(".", "-"), ranges: mathFrRanges() },
      { code: "eg-g6-science", prefix: "l-sci-con-", offset: SCIENCE_OFFSET, ranges: scienceRanges() },
      { code: "eg-g6-social", prefix: "l-soc-", offset: SOCIAL_OFFSET, ranges: socialRanges() },
      { code: "eg-g6-arabic", prefix: "l-ara-", offset: ARABIC_OFFSET, ranges: arabicRanges() },
      { code: "eg-g6-islamic-education", prefix: "l-isl-", offset: ISLAMIC_OFFSET, ranges: islamicRanges() },
      { code: "eg-g6-christian-education", prefix: "l-chr-", offset: CHRISTIAN_OFFSET, ranges: christianRanges() },
      { code: "eg-g6-ict", prefix: "l-ict-", offset: ICT_OFFSET, ranges: ictRanges() },
      { code: "eg-g9-ict", prefix: "l-g9-ict-", offset: ICT_G9_OFFSET, ranges: ictG9Ranges() },
      { code: "eg-g9-christian-education", prefix: "l-g9-chr-", offset: CHRISTIAN_G9_OFFSET, ranges: christianG9Ranges() },
      { code: "eg-g9-social", prefix: "l-g9-soc-", offset: SOCIAL_G9_OFFSET, ranges: socialG9Ranges() },
    ];
    for (const book of books) {
      expect(book.ranges.length, `${book.code} has no ranges`).toBeGreaterThan(0);
      for (const range of book.ranges) {
        const lessonCode = book.prefix + (book.keyToCode ? book.keyToCode(range.key) : range.key);
        const stage = stageForLesson(book.code, lessonCode);
        expect(stage, `${book.code} / ${lessonCode} has no stage`).not.toBeNull();
        expect(stage!.fromBookPage).toBe(range.from);
        expect(stage!.toBookPage).toBe(range.to);
        expect(stage!.conceptKey).toBe(book.keyToCode ? book.keyToCode(range.key) : range.key);
        expect(bookPageToPdfPage(book.code, range.from)).toBe(range.from + book.offset);
      }
    }
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

  it("ignores a page number outside any book instead of trusting it", () => {
    // A hallucinated «[صفحة الكتاب 9999]» must never become a stage jump.
    expect(bookPagesInText("[صفحة الكتاب 9999]\n...")).toEqual([]);
    expect(bookPagesInText(`[صفحة الكتاب ${MAX_BOOK_PAGE + 1}]`)).toEqual([]);
    // The unnumbered opener is page 0 and is a real page of the first lesson.
    expect(bookPagesInText("[صفحة الكتاب 0]")).toEqual([0]);
  });

  it("keeps the opener page: it is a place the tutor may point at", () => {
    expect(bookPagesInText("[صفحة الكتاب 0]\n[صفحة الكتاب 1]")).toEqual([0, 1]);
  });
});

describe("the page in front of the student", () => {
  it("returns the page's own text, without the marker that framed it", () => {
    const text = bookPageText(EGYPT_G6_MATH_CURRICULUM, 1);
    if (text.length === 0) {
      // A deployment without the OCR corpus has no text — a supported mode.
      expect(bookPageText(EGYPT_G6_MATH_CURRICULUM, EGYPT_T1_BOOK_END + 1)).toBe("");
      return;
    }
    expect(text).not.toContain("[صفحة الكتاب");
    // The text must be the page's, not a neighbour's: the corpus is per page.
    expect(bookPageText(EGYPT_G6_MATH_CURRICULUM, 2)).not.toBe(text);
  });

  it("returns nothing for a page outside the book or a non-integer", () => {
    expect(bookPageText(EGYPT_G6_MATH_CURRICULUM, -1)).toBe("");
    expect(bookPageText(EGYPT_G6_MATH_CURRICULUM, EGYPT_T1_BOOK_END + 1)).toBe("");
    expect(bookPageText(EGYPT_G6_MATH_CURRICULUM, 1.5)).toBe("");
    expect(bookPageText(EGYPT_G6_MATH_CURRICULUM, Number.NaN)).toBe("");
  });

  it("reads the right book's text for a non-maths curriculum", () => {
    // A science page must never return a maths page's text just because the
    // page number matches: the text is looked up through the book's own loader.
    const science = bookPageText("eg-g6-science", 6);
    const maths = bookPageText(EGYPT_G6_MATH_CURRICULUM, 6);
    expect(science.length > 0 || maths.length === 0).toBe(true);
    if (science.length > 0 && maths.length > 0) expect(science).not.toBe(maths);
  });
});

// PHASE 75 — a lesson is *the pages of the book it is taught from*, for every
// curriculum. For the Arabic listening lessons that set also includes the
// back-matter passage page; for every lesson the citations the tutor offers must
// stay inside that set, so the teacher and the student never drift apart.
describe("the lesson's own page set (PHASE 75)", () => {
  it("carries the Arabic listening passage into the lesson's stage", () => {
    const stage = stageForLesson("eg-g6-arabic", "l-ara-1-1");
    expect(stage).not.toBeNull();
    // The lesson's own printed range is unchanged…
    expect(stage!.fromBookPage).toBe(6);
    expect(stage!.toBookPage).toBe(8);
    // …and the passage page is a real stage page, named as an appendix page.
    expect(stage!.pages.map((p) => p.bookPage)).toContain(146);
    expect(stage!.appendixPages).toEqual([146]);
  });

  it("keeps an ordinary lesson's stage exactly its printed range", () => {
    const stage = stageForLesson(EGYPT_G6_MATH_CURRICULUM, "l-con-1-2")!;
    expect(stage.appendixPages).toEqual([]);
    expect(stage.pages.map((p) => p.bookPage)).toEqual(
      Array.from({ length: stage.toBookPage - stage.fromBookPage + 1 }, (_, i) => stage.fromBookPage + i),
    );
  });

  it("lets an appendix page be read like any owned page, and still refuses a page beyond every lesson", () => {
    // The page bound now reaches the appendix (book page 146 → scan page 147).
    const resolved = pageImagePath("eg-g6-arabic", 146);
    expect(resolved === null || resolved.endsWith("pages-147.jpg")).toBe(true);
    expect(pageImagePath("eg-g6-arabic", MAX_BOOK_PAGE + 1)).toBeNull();
  });

  it("drops a cited page the lesson does not have, keeping the ones it does", () => {
    const text = "[صفحة الكتاب 5]\nالمثال\n\n[صفحة الكتاب 50]\nدرس آخر";
    // Without a lesson set the global bound decides (both are real book pages).
    expect(bookPagesInText(text)).toEqual([5, 50]);
    // With the lesson's own set, only its pages survive.
    expect(bookPagesInText(text, new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]))).toEqual([5]);
    expect(bookPagesInText(text, new Set([50]))).toEqual([50]);
    expect(bookPagesInText(text, new Set())).toEqual([]);
  });
});
