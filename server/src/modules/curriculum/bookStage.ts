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
  BOOK_TO_PDF_OFFSET as MATH_G9_OFFSET,
  EGYPT_MATH_G9_T1_BOOK_END,
  allLessonRanges as mathG9LessonRanges,
  loadBookPage as loadMathG9Page,
} from "../../db/egyptMathG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as SCIENCE_G9_OFFSET,
  EGYPT_SCIENCE_G9_T1_BOOK_END,
  allLessonRanges as scienceG9LessonRanges,
  loadBookPage as loadScienceG9Page,
} from "../../db/egyptScienceG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as ENGLISH_G9_OFFSET,
  EGYPT_ENGLISH_G9_T1_BOOK_END,
  allLessonRanges as englishG9LessonRanges,
  allLessonExtras as englishG9LessonExtras,
  loadBookPage as loadEnglishG9Page,
} from "../../db/egyptEnglishG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as ENGLISH_G8_OFFSET,
  EGYPT_ENGLISH_G8_T1_BOOK_END,
  allLessonRanges as englishG8LessonRanges,
  allLessonExtras as englishG8LessonExtras,
  loadBookPage as loadEnglishG8Page,
} from "../../db/egyptEnglishG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as ENGLISH_P1_OFFSET,
  EGYPT_ENGLISH_P1_T1_BOOK_END,
  allLessonRanges as englishP1LessonRanges,
  allLessonExtras as englishP1LessonExtras,
  loadBookPage as loadEnglishP1Page,
} from "../../db/egyptEnglishP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as SOCIAL_G8_OFFSET,
  EGYPT_SOCIAL_G8_T1_BOOK_END,
  allLessonRanges as socialG8LessonRanges,
  loadBookPage as loadSocialG8Page,
} from "../../db/egyptSocialG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as SCIENCE_G8_OFFSET,
  EGYPT_SCIENCE_G8_T1_BOOK_END,
  allLessonRanges as scienceG8LessonRanges,
  loadBookPage as loadScienceG8Page,
} from "../../db/egyptScienceG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as SCIENCE_G8_EN_OFFSET,
  EGYPT_SCIENCE_G8_EN_T1_BOOK_END,
  allLessonRanges as scienceG8EnLessonRanges,
  loadBookPage as loadScienceG8EnPage,
} from "../../db/egyptScienceG8EnT1.js";
import {
  BOOK_TO_PDF_OFFSET as SCIENCE_EN_P1_OFFSET,
  EGYPT_SCIENCE_EN_P1_T1_BOOK_END,
  allLessonRanges as scienceEnP1LessonRanges,
  loadBookPage as loadScienceEnP1Page,
} from "../../db/egyptScienceEnP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_G8_OFFSET,
  EGYPT_MATH_G8_T1_BOOK_END,
  allLessonRanges as mathG8LessonRanges,
  loadBookPage as loadMathG8Page,
} from "../../db/egyptMathG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_G8_EN_OFFSET,
  EGYPT_MATH_G8_EN_T1_BOOK_END,
  allLessonRanges as mathG8EnLessonRanges,
  loadBookPage as loadMathG8EnPage,
} from "../../db/egyptMathG8EnT1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_G8_FR_OFFSET,
  EGYPT_MATH_G8_FR_T1_BOOK_END,
  allLessonRanges as mathG8FrLessonRanges,
  loadBookPage as loadMathG8FrPage,
} from "../../db/egyptMathG8FrT1.js";
import {
  BOOK_TO_PDF_OFFSET as MATH_P1_OFFSET,
  EGYPT_MATH_P1_T1_BOOK_END,
  allLessonRanges as mathP1LessonRanges,
  loadBookPage as loadMathP1Page,
} from "../../db/egyptMathP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as ARABIC_G9_OFFSET,
  EGYPT_ARABIC_G9_T1_BOOK_END,
  allLessonRanges as arabicG9LessonRanges,
  allLessonExtras as arabicG9LessonExtras,
  loadBookPage as loadArabicG9Page,
} from "../../db/egyptArabicG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as ARABIC_G8_OFFSET,
  EGYPT_ARABIC_G8_T1_BOOK_END,
  allLessonRanges as arabicG8LessonRanges,
  allLessonExtras as arabicG8LessonExtras,
  loadBookPage as loadArabicG8Page,
} from "../../db/egyptArabicG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as ARABIC_G7_OFFSET,
  EGYPT_ARABIC_P1_T1_BOOK_END,
  allLessonRanges as arabicP1LessonRanges,
  allLessonExtras as arabicP1LessonExtras,
  loadBookPage as loadArabicP1Page,
} from "../../db/egyptArabicP1T1.js";
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
  allLessonExtras as arabicLessonExtras,
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
  BOOK_TO_PDF_OFFSET as ISLAMIC_G9_OFFSET,
  EGYPT_ISLAMIC_G9_T1_BOOK_END,
  allLessonRanges as islamicG9LessonRanges,
  loadBookPage as loadIslamicG9Page,
} from "../../db/egyptIslamicG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as ISLAMIC_G8_OFFSET,
  EGYPT_ISLAMIC_G8_T1_BOOK_END,
  allLessonRanges as islamicG8LessonRanges,
  loadBookPage as loadIslamicG8Page,
} from "../../db/egyptIslamicG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as ISLAMIC_P1_OFFSET,
  EGYPT_ISLAMIC_P1_T1_BOOK_END,
  allLessonRanges as islamicP1LessonRanges,
  loadBookPage as loadIslamicP1Page,
} from "../../db/egyptIslamicP1T1.js";
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
import {
  BOOK_TO_PDF_OFFSET as ICT_G9_OFFSET,
  EGYPT_ICT_G9_T1_BOOK_END,
  allLessonRanges as ictG9LessonRanges,
  loadBookPage as loadIctG9Page,
} from "../../db/egyptIctG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as ICT_P1_OFFSET,
  EGYPT_ICT_P1_T1_BOOK_END,
  allLessonRanges as ictP1LessonRanges,
  loadBookPage as loadIctP1Page,
} from "../../db/egyptIctP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as LIBRARIES_P1_OFFSET,
  EGYPT_LIBRARIES_P1_T1_BOOK_END,
  allLessonRanges as librariesP1LessonRanges,
  loadBookPage as loadLibrariesP1Page,
} from "../../db/egyptLibrariesP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as THEATER_P1_OFFSET,
  EGYPT_THEATER_P1_T1_BOOK_END,
  allLessonRanges as theaterP1LessonRanges,
  loadBookPage as loadTheaterP1Page,
} from "../../db/egyptTheaterP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as EDUCATIONAL_MEDIA_P1_OFFSET,
  EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_END,
  allLessonRanges as educationalMediaP1LessonRanges,
  loadBookPage as loadEducationalMediaP1Page,
} from "../../db/egyptEducationalMediaP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as ICT_G8_OFFSET,
  EGYPT_ICT_G8_T1_BOOK_END,
  allLessonRanges as ictG8LessonRanges,
  loadBookPage as loadIctG8Page,
} from "../../db/egyptIctG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as ICT_G8_EN_OFFSET,
  EGYPT_ICT_G8_EN_T1_BOOK_END,
  allLessonRanges as ictG8EnLessonRanges,
  loadBookPage as loadIctG8EnPage,
} from "../../db/egyptIctG8EnT1.js";
import {
  BOOK_TO_PDF_OFFSET as CHRISTIAN_G9_OFFSET,
  EGYPT_CHRISTIAN_G9_T1_BOOK_END,
  allLessonRanges as christianG9LessonRanges,
  loadBookPage as loadChristianG9Page,
} from "../../db/egyptChristianG9T1.js";
import {
  BOOK_TO_PDF_OFFSET as CHRISTIAN_G8_OFFSET,
  EGYPT_CHRISTIAN_G8_T1_BOOK_END,
  allLessonRanges as christianG8LessonRanges,
  loadBookPage as loadChristianG8Page,
} from "../../db/egyptChristianG8T1.js";
import {
  BOOK_TO_PDF_OFFSET as CHRISTIAN_P1_OFFSET,
  EGYPT_CHRISTIAN_P1_T1_BOOK_END,
  allLessonRanges as christianP1LessonRanges,
  loadBookPage as loadChristianP1Page,
} from "../../db/egyptChristianP1T1.js";
import {
  BOOK_TO_PDF_OFFSET as SOCIAL_G9_OFFSET,
  EGYPT_SOCIAL_G9_T1_BOOK_END,
  allLessonRanges as socialG9LessonRanges,
  loadBookPage as loadSocialG9Page,
} from "../../db/egyptSocialG9T1.js";

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
  /**
   * PHASE 75 — highest page that can ever appear in a stage for this book: its
   * own content end, or an appendix page a lesson points to (the Arabic listening
   * passages reach page 148). Image/text lookup is bounded by this, while
   * `bookEnd` keeps naming the book's own last unit page.
   */
  maxPage: number;
  ranges: Map<string, { from: number; to: number }>;
  /**
   * PHASE 75 — book-wide pages a lesson points to but does not own (the Arabic
   * listening passages in the back matter), keyed by lesson code. They join the
   * lesson's stage so the student can read the very page the tutor quotes.
   */
  extras: Map<string, number[]>;
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
  /** PHASE 75 — appendix pages per printed lesson key (`1-1` → `[146]`). */
  extras?: Map<string, number[]>;
}): StageBook {
  const ranges = new Map<string, { from: number; to: number }>();
  for (const r of opts.ranges) {
    const key = opts.keyToCode ? opts.keyToCode(r.key) : r.key;
    ranges.set(opts.prefix + key, { from: r.from, to: r.to });
  }
  const extras = new Map<string, number[]>();
  for (const [key, pages] of opts.extras ?? []) {
    const code = opts.keyToCode ? opts.keyToCode(key) : key;
    extras.set(opts.prefix + code, [...pages]);
  }
  const maxPage = Math.max(opts.bookEnd, ...[...extras.values()].flat(), 0);
  return {
    code: opts.code,
    prefix: opts.prefix,
    offset: opts.offset,
    bookEnd: opts.bookEnd,
    maxPage,
    ranges,
    extras,
    loadPage: opts.loadPage,
  };
}

const STAGE_BOOKS: StageBook[] = [
  buildBook({ code: EGYPT_G6_MATH_CURRICULUM, prefix: "l-con-", offset: MATH_AR_OFFSET, bookEnd: EGYPT_T1_BOOK_END, ranges: mathArConceptRanges(), loadPage: loadMathArPage }),
  buildBook({ code: "eg-g6-math-en", prefix: "l-men-", offset: MATH_EN_OFFSET, bookEnd: EGYPT_MATH_EN_T1_BOOK_END, ranges: mathEnConceptRanges(), loadPage: loadMathEnPage, keyToCode: (k) => k.replace(".", "-") }),
  buildBook({ code: "eg-g6-math-fr", prefix: "l-mfr-", offset: MATH_FR_OFFSET, bookEnd: EGYPT_MATH_FR_T1_BOOK_END, ranges: mathFrConceptRanges(), loadPage: loadMathFrPage, keyToCode: (k) => k.replace(".", "-") }),
  buildBook({ code: "eg-g6-science", prefix: "l-sci-con-", offset: SCIENCE_OFFSET, bookEnd: EGYPT_SCIENCE_T1_BOOK_END, ranges: scienceConceptRanges(), loadPage: loadSciencePage }),
  buildBook({ code: "eg-g6-social", prefix: "l-soc-", offset: SOCIAL_OFFSET, bookEnd: EGYPT_SOCIAL_T1_BOOK_END, ranges: socialLessonRanges(), loadPage: loadSocialPage }),
  buildBook({ code: "eg-g6-arabic", prefix: "l-ara-", offset: ARABIC_OFFSET, bookEnd: EGYPT_ARABIC_T1_BOOK_END, ranges: arabicLessonRanges(), loadPage: loadArabicPage, extras: arabicLessonExtras() }),
  buildBook({ code: "eg-g6-islamic-education", prefix: "l-isl-", offset: ISLAMIC_OFFSET, bookEnd: EGYPT_ISLAMIC_T1_BOOK_END, ranges: islamicLessonRanges(), loadPage: loadIslamicPage }),
  buildBook({ code: "eg-g6-christian-education", prefix: "l-chr-", offset: CHRISTIAN_OFFSET, bookEnd: EGYPT_CHRISTIAN_T1_BOOK_END, ranges: christianLessonRanges(), loadPage: loadChristianPage }),
  buildBook({ code: "eg-g6-ict", prefix: "l-ict-", offset: ICT_OFFSET, bookEnd: EGYPT_ICT_T1_BOOK_END, ranges: ictLessonRanges(), loadPage: loadIctPage }),
  buildBook({ code: "eg-g9-ict", prefix: "l-g9-ict-", offset: ICT_G9_OFFSET, bookEnd: EGYPT_ICT_G9_T1_BOOK_END, ranges: ictG9LessonRanges(), loadPage: loadIctG9Page }),
  buildBook({ code: "eg-g7-ict", prefix: "l-g7-ict-", offset: ICT_P1_OFFSET, bookEnd: EGYPT_ICT_P1_T1_BOOK_END, ranges: ictP1LessonRanges(), loadPage: loadIctP1Page }),
  buildBook({ code: "eg-g7-libraries", prefix: "l-g7-lib-", offset: LIBRARIES_P1_OFFSET, bookEnd: EGYPT_LIBRARIES_P1_T1_BOOK_END, ranges: librariesP1LessonRanges(), loadPage: loadLibrariesP1Page }),
  buildBook({ code: "eg-g7-theater", prefix: "l-g7-the-", offset: THEATER_P1_OFFSET, bookEnd: EGYPT_THEATER_P1_T1_BOOK_END, ranges: theaterP1LessonRanges(), loadPage: loadTheaterP1Page }),
  buildBook({ code: "eg-g7-educational-media", prefix: "l-g7-edm-", offset: EDUCATIONAL_MEDIA_P1_OFFSET, bookEnd: EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_END, ranges: educationalMediaP1LessonRanges(), loadPage: loadEducationalMediaP1Page }),
  buildBook({ code: "eg-g8-ict", prefix: "l-g8-ict-", offset: ICT_G8_OFFSET, bookEnd: EGYPT_ICT_G8_T1_BOOK_END, ranges: ictG8LessonRanges(), loadPage: loadIctG8Page }),
  buildBook({ code: "eg-g8-ict-en", prefix: "l-g8-ict-en-", offset: ICT_G8_EN_OFFSET, bookEnd: EGYPT_ICT_G8_EN_T1_BOOK_END, ranges: ictG8EnLessonRanges(), loadPage: loadIctG8EnPage }),
  buildBook({ code: "eg-g9-christian-education", prefix: "l-g9-chr-", offset: CHRISTIAN_G9_OFFSET, bookEnd: EGYPT_CHRISTIAN_G9_T1_BOOK_END, ranges: christianG9LessonRanges(), loadPage: loadChristianG9Page }),
  buildBook({ code: "eg-g8-christian-education", prefix: "l-g8-chr-", offset: CHRISTIAN_G8_OFFSET, bookEnd: EGYPT_CHRISTIAN_G8_T1_BOOK_END, ranges: christianG8LessonRanges(), loadPage: loadChristianG8Page }),
  buildBook({ code: "eg-g7-christian-education", prefix: "l-g7-chr-", offset: CHRISTIAN_P1_OFFSET, bookEnd: EGYPT_CHRISTIAN_P1_T1_BOOK_END, ranges: christianP1LessonRanges(), loadPage: loadChristianP1Page }),
  buildBook({ code: "eg-g9-social", prefix: "l-g9-soc-", offset: SOCIAL_G9_OFFSET, bookEnd: EGYPT_SOCIAL_G9_T1_BOOK_END, ranges: socialG9LessonRanges(), loadPage: loadSocialG9Page }),
  buildBook({ code: "eg-g9-islamic-education", prefix: "l-g9-isl-", offset: ISLAMIC_G9_OFFSET, bookEnd: EGYPT_ISLAMIC_G9_T1_BOOK_END, ranges: islamicG9LessonRanges(), loadPage: loadIslamicG9Page }),
  buildBook({ code: "eg-g7-islamic-education", prefix: "l-g7-isl-", offset: ISLAMIC_P1_OFFSET, bookEnd: EGYPT_ISLAMIC_P1_T1_BOOK_END, ranges: islamicP1LessonRanges(), loadPage: loadIslamicP1Page }),
  buildBook({ code: "eg-g8-islamic-education", prefix: "l-g8-isl-", offset: ISLAMIC_G8_OFFSET, bookEnd: EGYPT_ISLAMIC_G8_T1_BOOK_END, ranges: islamicG8LessonRanges(), loadPage: loadIslamicG8Page }),
  buildBook({ code: "eg-g9-math", prefix: "l-g9-math-", offset: MATH_G9_OFFSET, bookEnd: EGYPT_MATH_G9_T1_BOOK_END, ranges: mathG9LessonRanges(), loadPage: loadMathG9Page }),
  buildBook({ code: "eg-g9-science", prefix: "l-g9-sci-", offset: SCIENCE_G9_OFFSET, bookEnd: EGYPT_SCIENCE_G9_T1_BOOK_END, ranges: scienceG9LessonRanges(), loadPage: loadScienceG9Page }),
  buildBook({ code: "eg-g9-english", prefix: "l-g9-eng-", offset: ENGLISH_G9_OFFSET, bookEnd: EGYPT_ENGLISH_G9_T1_BOOK_END, ranges: englishG9LessonRanges(), loadPage: loadEnglishG9Page, extras: englishG9LessonExtras() }),
  buildBook({ code: "eg-g9-arabic", prefix: "l-g9-ara-", offset: ARABIC_G9_OFFSET, bookEnd: EGYPT_ARABIC_G9_T1_BOOK_END, ranges: arabicG9LessonRanges(), loadPage: loadArabicG9Page, extras: arabicG9LessonExtras() }),
  buildBook({ code: "eg-g8-arabic", prefix: "l-g8-ara-", offset: ARABIC_G8_OFFSET, bookEnd: EGYPT_ARABIC_G8_T1_BOOK_END, ranges: arabicG8LessonRanges(), loadPage: loadArabicG8Page, extras: arabicG8LessonExtras() }),
  buildBook({ code: "eg-g7-arabic", prefix: "l-g7-ara-", offset: ARABIC_G7_OFFSET, bookEnd: EGYPT_ARABIC_P1_T1_BOOK_END, ranges: arabicP1LessonRanges(), loadPage: loadArabicP1Page, extras: arabicP1LessonExtras() }),
  buildBook({ code: "eg-g8-english", prefix: "l-g8-eng-", offset: ENGLISH_G8_OFFSET, bookEnd: EGYPT_ENGLISH_G8_T1_BOOK_END, ranges: englishG8LessonRanges(), loadPage: loadEnglishG8Page, extras: englishG8LessonExtras() }),
  buildBook({ code: "eg-g7-english", prefix: "l-g7-eng-", offset: ENGLISH_P1_OFFSET, bookEnd: EGYPT_ENGLISH_P1_T1_BOOK_END, ranges: englishP1LessonRanges(), loadPage: loadEnglishP1Page, extras: englishP1LessonExtras() }),
  buildBook({ code: "eg-g8-social", prefix: "l-g8-soc-", offset: SOCIAL_G8_OFFSET, bookEnd: EGYPT_SOCIAL_G8_T1_BOOK_END, ranges: socialG8LessonRanges(), loadPage: loadSocialG8Page }),
  buildBook({ code: "eg-g8-science", prefix: "l-g8-sci-", offset: SCIENCE_G8_OFFSET, bookEnd: EGYPT_SCIENCE_G8_T1_BOOK_END, ranges: scienceG8LessonRanges(), loadPage: loadScienceG8Page }),
  buildBook({ code: "eg-g8-science-en", prefix: "l-g8-sci-en-", offset: SCIENCE_G8_EN_OFFSET, bookEnd: EGYPT_SCIENCE_G8_EN_T1_BOOK_END, ranges: scienceG8EnLessonRanges(), loadPage: loadScienceG8EnPage }),
  buildBook({ code: "eg-g7-science-en", prefix: "l-g7-sci-en-", offset: SCIENCE_EN_P1_OFFSET, bookEnd: EGYPT_SCIENCE_EN_P1_T1_BOOK_END, ranges: scienceEnP1LessonRanges(), loadPage: loadScienceEnP1Page }),
  buildBook({ code: "eg-g8-math", prefix: "l-g8-math-", offset: MATH_G8_OFFSET, bookEnd: EGYPT_MATH_G8_T1_BOOK_END, ranges: mathG8LessonRanges(), loadPage: loadMathG8Page }),
  buildBook({ code: "eg-g8-math-en", prefix: "l-g8-math-en-", offset: MATH_G8_EN_OFFSET, bookEnd: EGYPT_MATH_G8_EN_T1_BOOK_END, ranges: mathG8EnLessonRanges(), loadPage: loadMathG8EnPage }),
  buildBook({ code: "eg-g8-math-fr", prefix: "l-g8-math-fr-", offset: MATH_G8_FR_OFFSET, bookEnd: EGYPT_MATH_G8_FR_T1_BOOK_END, ranges: mathG8FrLessonRanges(), loadPage: loadMathG8FrPage }),
  buildBook({ code: "eg-g7-math", prefix: "l-g7-math-", offset: MATH_P1_OFFSET, bookEnd: EGYPT_MATH_P1_T1_BOOK_END, ranges: mathP1LessonRanges(), loadPage: loadMathP1Page }),
];

const STAGE_BOOK_BY_CODE = new Map(STAGE_BOOKS.map((b) => [b.code, b]));

/** Highest printed page any lesson owns (its range or an appendix page). */
export const MAX_BOOK_PAGE = Math.max(...STAGE_BOOKS.map((b) => b.maxPage));

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
  if (!Number.isInteger(bookPage) || bookPage < 0 || bookPage > book.maxPage) return null;
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
   * PHASE 75 — book-wide appendix pages this lesson points to but does not own
   * (the Arabic listening passages). They are already part of `pages`; this is
   * the same set named explicitly, so a caller can label them without inferring
   * from the page numbers.
   */
  appendixPages: number[];
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

  // The lesson's own printed range, plus any appendix page it points to (the
  // Arabic listening passages). The union is kept ascending so the room's page
  // strip reads left-to-right like the book; the appendix page stays outside
  // `fromBookPage`/`toBookPage`, which keep naming the lesson's own range.
  const appendixPages = (book.extras.get(lessonCode) ?? []).filter(
    (p) => Number.isInteger(p) && p >= 0 && p <= book.maxPage && (p < range.from || p > range.to),
  );
  const owned: number[] = [];
  for (let bookPage = range.from; bookPage <= range.to; bookPage += 1) owned.push(bookPage);
  const allPages = [...owned, ...appendixPages].sort((a, b) => a - b);

  const pages: StagePage[] = allPages.map((bookPage) => ({
    bookPage,
    pdfPage: bookPageToPdfPage(curriculumCode, bookPage),
    present: pageImagePath(curriculumCode, bookPage) !== null,
  }));
  return {
    curriculumId: curriculumCode,
    lessonCode,
    conceptKey: lessonCode.slice(book.prefix.length),
    fromBookPage: range.from,
    toBookPage: range.to,
    pages,
    appendixPages,
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

/**
 * The printed pages a retrieved passage was taken from (sorted, unique).
 *
 * PHASE 75 — `allowedPages`, when given, is the lesson's own page set: a marker
 * for a page the lesson does not own (a neighbouring lesson's page, or the
 * Arabic appendix when the lesson does not point to it) is dropped. That is the
 * alignment guarantee: every page the tutor's answer stands on is a page the
 * student can turn to in the stage.
 */
export function bookPagesInText(text: string, allowedPages?: ReadonlySet<number>): number[] {
  const found = new Set<number>();
  for (const match of text.matchAll(/\[صفحة الكتاب (\d+)\]/g)) {
    const n = Number(match[1]);
    if (!Number.isInteger(n) || n < 0 || n > MAX_BOOK_PAGE) continue;
    if (allowedPages && !allowedPages.has(n)) continue;
    found.add(n);
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
  if (!Number.isInteger(bookPage) || bookPage < 0 || bookPage > book.maxPage) return "";
  return book.loadPage(bookPage).trim();
}

/**
 * PHASE 78 — the lesson's whole printed text, marker-prefixed page by page
 * exactly like the seeded lesson document (`[صفحة الكتاب N]` ahead of each
 * page). The tutor receives this in full *beside* the retrieved chunks, so a
 * printed worked example or printed تمرين can never be missing from the prompt
 * just because retrieval kept a different five chunks: with the whole lesson on
 * the table, «المعلم يعطي ما في صفحة الكتاب» becomes achievable instead of a
 * lottery.
 *
 * The bound is a defence, not a rounding: when the pages exceed `maxChars` the
 * whole injection is dropped ("" — retrieval keeps grounding the turn). A
 * truncated lesson-pointer could drop the very page that holds its أسئلة الدرس,
 * so we never ship a partial lesson pretending to be the full one. Pages whose
 * OCR is empty (blank/placeholder) are skipped; a book with no stage returns "".
 */
export function loadLessonBookText(
  curriculumCode: string,
  lessonPages: readonly number[] | undefined,
  maxChars: number,
): string {
  if (!lessonPages || lessonPages.length === 0 || maxChars <= 0) return "";
  const book = STAGE_BOOK_BY_CODE.get(curriculumCode);
  if (!book) return "";
  const parts: string[] = [];
  let total = 0;
  const pages = [...new Set(lessonPages)]
    .filter((p) => Number.isInteger(p) && p >= 0 && p <= book.maxPage)
    .sort((a, b) => a - b);
  for (const page of pages) {
    const text = book.loadPage(page).trim();
    if (!text) continue;
    const part = `[صفحة الكتاب ${page}]\n${text}`;
    parts.push(part);
    total += part.length;
  }
  // The "\n\n" separator between pages is part of the final text's length.
  if (parts.length > 1) total += (parts.length - 1) * 2;
  if (total > maxChars) return "";
  return parts.join("\n\n");
}
