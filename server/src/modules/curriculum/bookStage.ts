// PHASE 48 — «مسرح الكتاب»: the official textbook pages as the stage a lesson
// is taught on.
//
// PHASE 47 made the Ministry book the tutor's *grounding* (its OCR text is the
// RAG corpus). It is not yet the tutor's *stage*: the student reads a wall of
// text while the book he owns sits closed next to him. This module turns a
// lesson into the exact pages it occupies, so the session can show the real page
// and point at it instead of describing it.
//
// PHASE 74 — every Egypt Grade-6 book, not only maths. Each tree already knows
// its printed page offset and its lesson→page ranges (`conceptBookRange` /
// `lessonBookRange`), so the stage is a small registry over those trees instead
// of a maths-only special case. A book whose pages were never rasterized still
// returns a stage with `hasImages: false`, which the room treats as text-only.
//
// The page images are a derived artifact of the source PDF (see
// server/scripts/render-book.mjs) and are therefore runtime data, not source:
// a deployment without the PDF simply has no stage, and every caller degrades
// to the text-only room rather than failing.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../../config/env.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_AR_OFFSET,
  EGYPT_T1_BOOK_END,
  allConceptRanges as mathArConceptRanges,
  loadBookPage as loadMathArPage,
} from "../../db/egyptT1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_EN_OFFSET,
  EGYPT_MATH_EN_T1_BOOK_END,
  allConceptRanges as mathEnConceptRanges,
  loadBookPage as loadMathEnPage,
} from "../../db/egyptMathEnT1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_FR_OFFSET,
  EGYPT_MATH_FR_T1_BOOK_END,
  allConceptRanges as mathFrConceptRanges,
  loadBookPage as loadMathFrPage,
} from "../../db/egyptMathFrT1.js";
import {
  BOOK_TO_PDF_OFFSET as SCIENCE_OFFSET,
  EGYPT_SCIENCE_T1_BOOK_END,
  allConceptRanges as scienceConceptRanges,
  loadBookPage as loadSciencePage,
} from "../../db/egyptScienceT1.js";
import {
  BOOK_TO_PDF_OFFSET as SOCIAL_OFFSET,
  EGYPT_SOCIAL_T1_BOOK_END,
  allLessonRanges as socialLessonRanges,
  loadBookPage as loadSocialPage,
} from "../../db/egyptSocialT1.js";
import {
  BOOK_TO_PDF_OFFSET as ARABIC_OFFSET,
  EGYPT_ARABIC_T1_BOOK_END,
  allLessonRanges as arabicLessonRanges,
  loadBookPage as loadArabicPage,
} from "../../db/egyptArabicT1.js";
import {
  BOOK_TO_PDF_OFFSET as ISLAMIC_OFFSET,
  EGYPT_ISLAMIC_T1_BOOK_END,
  allLessonRanges as islamicLessonRanges,
  loadBookPage as loadIslamicPage,
} from "../../db/egyptIslamicT1.js";
import {
  BOOK_TO_PDF_OFFSET as CHRISTIAN_OFFSET,
  EGYPT_CHRISTIAN_T1_BOOK_END,
  allLessonRanges as christianLessonRanges,
  loadBookPage as loadChristianPage,
} from "../../db/egyptChristianT1.js";
import {
  BOOK_TO_PDF_OFFSET as ICT_OFFSET,
  EGYPT_ICT_T1_BOOK_END,
  allLessonRanges as ictLessonRanges,
  loadBookPage as loadIctPage,
} from "../../db/egyptIctT1.js";

/** The book whose pages shipped first; still the reference offset for maths. */
export const EGYPT_G6_MATH_CURRICULUM = "eg-g6-math";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * Directory holding one book's `pages-NNN.jpg` (NNN = scan/PDF page, 1-based).
 *
 * Every book gets its own subdirectory named after its curriculum code, because
 * two books can both have a `pages-010.jpg` that mean different pages. The base
 * is resolved relative to this module, not the process CWD, so the stage works
 * the same whether the server is started from the repo root, from `server/`, or
 * from a compiled `dist/` — the same reason the OCR corpus is resolved this way.
 */
export function pagesDir(curriculumCode?: string): string {
  const configured = config.CURRICULUM_PAGES_DIR?.trim();
  const base = configured
    ? path.resolve(configured)
    : path.join(MODULE_DIR, "..", "..", "..", "data", "curriculum-pages");
  return curriculumCode ? path.join(base, curriculumCode) : base;
}

// ---------------------------------------------------------------------------
// The registry: one entry per book whose lessons map to printed pages.
// ---------------------------------------------------------------------------

/**
 * One book's stage data: how a printed page becomes a scan page (`offset`) and
 * which book pages each app lesson owns (`ranges`, keyed by the lesson code the
 * seeder wrote, e.g. `l-con-1-1`). `loadPage` reads that book's OCR text, so the
 * tutor's "the page in front of the student" is the right book's text too.
 */
interface StageBook {
  code: string;
  /** App lesson-code prefix; the remainder is the printed key (`1-1`). */
  prefix: string;
  offset: number;
  bookEnd: number;
  ranges: Map<string, { from: number; to: number }>;
  loadPage: (bookPage: number) => string;
}

function buildBook(opts: {
  code: string;
  prefix: string;
  offset: number;
  bookEnd: number;
  ranges: { key: string; from: number; to: number }[];
  loadPage: (bookPage: number) => string;
  /** Some books print their key with a dot (`1.1`); the seeder writes `1-1`. */
  keyToCode?: (key: string) => string;
}): StageBook {
  const ranges = new Map<string, { from: number; to: number }>();
  for (const r of opts.ranges) {
    const key = opts.keyToCode ? opts.keyToCode(r.key) : r.key;
    ranges.set(opts.prefix + key, { from: r.from, to: r.to });
  }
  return { code: opts.code, prefix: opts.prefix, offset: opts.offset, bookEnd: opts.bookEnd, ranges, loadPage: opts.loadPage };
}

const STAGE_BOOKS: StageBook[] = [
  buildBook({ code: EGYPT_G6_MATH_CURRICULUM, prefix: "l-con-", offset: MATH_AR_OFFSET, bookEnd: EGYPT_T1_BOOK_END, ranges: mathArConceptRanges(), loadPage: loadMathArPage }),
  buildBook({ code: "eg-g6-math-en", prefix: "l-men-", offset: MATH_EN_OFFSET, bookEnd: EGYPT_MATH_EN_T1_BOOK_END, ranges: mathEnConceptRanges(), loadPage: loadMathEnPage, keyToCode: (k) => k.replace(".", "-") }),
  buildBook({ code: "eg-g6-math-fr", prefix: "l-mfr-", offset: MATH_FR_OFFSET, bookEnd: EGYPT_MATH_FR_T1_BOOK_END, ranges: mathFrConceptRanges(), loadPage: loadMathFrPage, keyToCode: (k) => k.replace(".", "-") }),
  buildBook({ code: "eg-g6-science", prefix: "l-sci-con-", offset: SCIENCE_OFFSET, bookEnd: EGYPT_SCIENCE_T1_BOOK_END, ranges: scienceConceptRanges(), loadPage: loadSciencePage }),
  buildBook({ code: "eg-g6-social", prefix: "l-soc-", offset: SOCIAL_OFFSET, bookEnd: EGYPT_SOCIAL_T1_BOOK_END, ranges: socialLessonRanges(), loadPage: loadSocialPage }),
  buildBook({ code: "eg-g6-arabic", prefix: "l-ara-", offset: ARABIC_OFFSET, bookEnd: EGYPT_ARABIC_T1_BOOK_END, ranges: arabicLessonRanges(), loadPage: loadArabicPage }),
  buildBook({ code: "eg-g6-islamic-education", prefix: "l-isl-", offset: ISLAMIC_OFFSET, bookEnd: EGYPT_ISLAMIC_T1_BOOK_END, ranges: islamicLessonRanges(), loadPage: loadIslamicPage }),
  buildBook({ code: "eg-g6-christian-education", prefix: "l-chr-", offset: CHRISTIAN_OFFSET, bookEnd: EGYPT_CHRISTIAN_T1_BOOK_END, ranges: christianLessonRanges(), loadPage: loadChristianPage }),
  buildBook({ code: "eg-g6-ict", prefix: "l-ict-", offset: ICT_OFFSET, bookEnd: EGYPT_ICT_T1_BOOK_END, ranges: ictLessonRanges(), loadPage: loadIctPage }),
];

const STAGE_BOOK_BY_CODE = new Map(STAGE_BOOKS.map((b) => [b.code, b]));

/** Highest printed page any lesson owns — the sanity bound for citations. */
export const MAX_BOOK_PAGE = Math.max(...STAGE_BOOKS.map((b) => b.bookEnd));

/** Scan/PDF page that holds a printed book page for this book. */
export function bookPageToPdfPage(curriculumCode: string, bookPage: number): number {
  const book = STAGE_BOOK_BY_CODE.get(curriculumCode);
  return bookPage + (book?.offset ?? 0);
}

function pageFileName(pdfPage: number): string {
  return `pages-${String(pdfPage).padStart(3, "0")}.jpg`;
}

/** Absolute path of one page image, or null when it was never extracted. */
export function pageImagePath(curriculumCode: string, bookPage: number): string | null {
  const book = STAGE_BOOK_BY_CODE.get(curriculumCode);
  if (!book) return null;
  if (!Number.isInteger(bookPage) || bookPage < 0 || bookPage > book.bookEnd) return null;
  const root = path.resolve(pagesDir(curriculumCode));
  const file = path.join(root, pageFileName(bookPageToPdfPage(curriculumCode, bookPage)));
  // Defence in depth: the name is generated, but the resolved path must still
  // stay inside the pages directory before anything is read from it.
  if (path.resolve(file) !== path.join(root, path.basename(file))) return null;
  return existsSync(file) ? file : null;
}

/** Reads one page image, or null when the pages are not installed. */
export function readPageImage(curriculumCode: string, bookPage: number): Buffer | null {
  const file = pageImagePath(curriculumCode, bookPage);
  if (!file) return null;
  try {
    return readFileSync(file);
  } catch {
    return null;
  }
}

export interface StagePage {
  /** Printed page number as the student sees it in the book. */
  bookPage: number;
  /** Scan/PDF page the image came from. */
  pdfPage: number;
  /** True when the image exists on this deployment. */
  present: boolean;
}

export interface LessonStage {
  curriculumId: string;
  /** Lesson code in the curriculum tree, e.g. "l-con-1-1". */
  lessonCode: string;
  /** Concept/lesson key as printed in the book's TOC, e.g. "1-1". */
  conceptKey: string;
  fromBookPage: number;
  toBookPage: number;
  pages: StagePage[];
  /**
   * False when no page image was found for this lesson. The room must treat
   * this as "text-only session", never as an error: a deployment without the
   * source PDF is a supported configuration, not a broken one.
   */
  hasImages: boolean;
}

/**
 * The printed pages a lesson occupies, or null when the lesson is not a page of
 * a rasterized book (Saudi/English trees, or a book whose pages never shipped).
 */
export function stageForLesson(curriculumCode: string, lessonCode: string): LessonStage | null {
  const book = STAGE_BOOK_BY_CODE.get(curriculumCode);
  if (!book) return null;
  const range = book.ranges.get(lessonCode);
  if (!range) return null;

  const pages: StagePage[] = [];
  for (let bookPage = range.from; bookPage <= range.to; bookPage += 1) {
    pages.push({
      bookPage,
      pdfPage: bookPageToPdfPage(curriculumCode, bookPage),
      present: pageImagePath(curriculumCode, bookPage) !== null,
    });
  }
  return {
    curriculumId: curriculumCode,
    lessonCode,
    conceptKey: lessonCode.slice(book.prefix.length),
    fromBookPage: range.from,
    toBookPage: range.to,
    pages,
    hasImages: pages.some((p) => p.present),
  };
}

// ---------------------------------------------------------------------------
// PHASE 48 (part 2) — the book as a shared surface: what the tutor *sees*.
// ---------------------------------------------------------------------------

/**
 * The marker the seeder writes in front of every page's OCR text when it builds
 * the lesson document (`loadBookRange`). Because the marker lives *inside* the
 * retrieved chunk, a citation never has to be guessed by the model: the page a
 * fact came from is a fact about the retrieval, not a guess.
 */
export const BOOK_PAGE_MARKER = /\[صفحة الكتاب (\d+)\]/;

/** The printed pages a retrieved passage was taken from (sorted, unique). */
export function bookPagesInText(text: string): number[] {
  const found = new Set<number>();
  for (const match of text.matchAll(/\[صفحة الكتاب (\d+)\]/g)) {
    const n = Number(match[1]);
    if (Number.isInteger(n) && n >= 0 && n <= MAX_BOOK_PAGE) found.add(n);
  }
  return [...found].sort((a, b) => a - b);
}

/**
 * The OCR text of one printed page of a given book — literally what the student
 * is looking at right now. Returns "" when the book has no stage or the corpus
 * has no text for that page, so a caller can treat "no page" and "no text" the
 * same way.
 */
export function bookPageText(curriculumCode: string, bookPage: number): string {
  const book = STAGE_BOOK_BY_CODE.get(curriculumCode);
  if (!book) return "";
  if (!Number.isInteger(bookPage) || bookPage < 0 || bookPage > book.bookEnd) return "";
  return book.loadPage(bookPage).trim();
}
