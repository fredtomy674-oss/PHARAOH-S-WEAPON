// Kindergarten 1 (رياض أطفال 1) Discover English («Discovery»), first term,
// Ministry 2025/2026 edition (cover imprint prints «2025-2026», reviewed by the
// Central Administration for Curriculum Development; foreword credits Discovery
// Education).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-kg1-discovery-en`, subject `discovery-en` (name "Discovery (English)",
// nameAr "اكتشف (بالإنجليزية)"), lesson prefix `l-kg1-dis-en-`, grade
// `grade-kg1` (name "KG 1", nameAr "رياض أطفال 1").
//
// The curriculum tree for the Egypt `eg-kg1-discovery-en` curriculum is rebuilt
// from the English-medium Ministry textbook (84 scanned pages, Term 1 = the
// book's own «Term 1» as listed in its printed «CONTENTS», scan 3). This module
// is the single source of truth for its structure: the six printed chapters of
// the first term (three under «Theme 1: Who Am I?», three under «Theme 2: The
// World Around Me») plus the Term-1 «Math Journal», the printed activity on
// every page, and, for every lesson, the book's own printed heads, verbatim in
// English and with the printed page they start on. The self-checks at the
// bottom prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every numbered content page prints its own folio as a bare numeral on its
// first line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted
// here: scan 5 prints «1» (book 1), scan 14 prints «10» (book 10), scan 19
// prints «15» (book 15), scan 23 prints «19» (book 19) and scan 30 prints «26»
// (book 26). The book's own «CONTENTS» (scan 3) independently confirms it: it
// lists «Chapter 1: Geometric Self-Portrait 1» (scan 5), «Chapter 2: Mommy's
// And Daddy's 7» (scan 11), «Chapter 3: My School 11» (scan 15), «Chapter 1:
// Animal Babies 16» (scan 20), «Chapter 2: How To Care 20» (scan 24),
// «Chapter 3: Where Do We Find Water? 27» (scan 31) and «Math Journal 32»
// (scan 36) — every first activity page sits exactly where the contents says
// it does.
//
// TERM = THE BOOK'S OWN FIRST TERM (books 0–34)
// Scan pages 1–3 are before the term: the cover (1), the «FOREWORD» (2) and the
// year-wide «CONTENTS» (3). The term runs from the Theme-1 divider (book 0 =
// scan 4, which prints the roman folio «IV») to the last Math Journal page of
// Term 1 (book 34 = scan 38): `EGYPT_DISCOVERY_EN_KG1_T1_BOOK_START` / `_END`
// are exactly those two pages, and the tiling assertion proves nothing in
// between is left unreachable. `pagesChecked` therefore equals 34 − 0 + 1 =
// 35. Scan pages 39–84 are after the term: the Term-1 colophon (scan 39,
// «2025-2026»), a blank (scan 40), the full Term-2 book («Theme 3: How the
// World Works» and «Theme 4: Communication» with its Term-2 Math Journal,
// scans 41–83) and a trailing blank (scan 84).
//
// FIVE TERM PAGES PRINT NO PROVABLE FOLIO — EACH HAS A NAMED ANCHOR
// The Theme-1 divider (book 0) prints the roman folio «IV», not a book number;
// the «MATH JOURNAL» divider (book 31) prints no folio at all; and the three
// Math Journal pages (books 32–34) print the journal's own refoliation («1»,
// «2», «3») instead of their book numbers. Rather than weaken the page-number
// check, all five are exempt from it and anchored on a string the page itself
// prints, named in `FOLIO_LESS_ANCHORS`. Every other term page proves its
// number from a bare numeral standing alone on its first line — except book 23
// («LIFE STAGES»), which prints its folio «23» on its last line — so
// `footerCandidates` accepts a bare numeral on the first or the last line.
// No term page prints bare numerals on both, so the rule stays unambiguous.
// Every term page carries real text: there is no textless-picture exemption.
//
// EACH LESSON IS ONE PRINTED ACTIVITY PAGE
// KG books are activity-driven: every activity page prints one ALL-CAPS head
// («MY FIVE SENSES», «TASKS», «MAP OF EGYPT» …) and that head is the lesson.
// Three pages print two titled heads and both share the lesson, as in the G1
// Discover spec: book 1 («FRUITS AND VEGETABLES» + «SELF-PORTRAIT»), book 9
// («BABY AND ADULT ANIMALS» + «LET'S COUNT») and book 13 («JOBS AND TOOLS» +
// «MY GROWN-UP JOB»). The Math Journal's heads are its printed «Lesson N»
// markers (one lesson per journal page: «Lesson 5»–«Lesson 8» on book 32,
// «Lesson 31»–«Lesson 39» on book 33, «Lesson 40»–«Lesson 42» plus «Lesson 57»–
// «Lesson 59» on book 34). Nothing is invented: every concept title below is a
// string the book itself prints on the page its `bookFrom` names.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// The apostrophe prints as U+2019 («MOMMY'S», «LET'S», «GROWN-UP» is a plain
// hyphen) and is folded by `normalize`. Scan 5 spaces its hyphen («SELF -
// PORTRAIT», stored joined) and scan 31 drops the space after its commas
// («RAIN,RAIN,FALLING DOWN», stored spaced). Scan 34 misspells «bottles» as
// «bottels» in the body (not in any head).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.26 = scan p.30). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the Theme-1 divider (scan 4, folio «IV»). */
export const EGYPT_DISCOVERY_EN_KG1_T1_BOOK_START = 0;

/** Last printed page of the term — Math Journal p.3 of Term 1 (scan 38). */
export const EGYPT_DISCOVERY_EN_KG1_T1_BOOK_END = 34;

/** The scanned pages before the term: cover, foreword, contents. */
export const EGYPT_DISCOVERY_EN_KG1_T1_FRONT_MATTER = { from: 1, to: 3 } as const;

/**
 * The scanned pages after the term: the Term-1 colophon (scan 39), a blank
 * (scan 40), the full Term-2 book (scans 41–83) and a trailing blank (84).
 */
export const EGYPT_DISCOVERY_EN_KG1_T1_BACK_MATTER = { from: 39, to: 84 } as const;

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface DiscoveryEnKg1T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «Activity». */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one activity page, or one Math Journal page). */
export interface DiscoveryEnKg1T1Lesson {
  /** App-addressable key, e.g. "5-3" (chapter 5, lesson 3). */
  key: string;
  /** Arabic ordinal of the lesson number, e.g. "الثالث". */
  ordinal: string;
  /** The lesson's opening head type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson. */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: DiscoveryEnKg1T1Concept[];
}

/** One printed section of the book — a chapter, or the Math Journal. */
export interface DiscoveryEnKg1T1Section {
  /** This book's sections are its chapters, plus the Math Journal appendix. */
  kind: "chapter" | "journal";
  /** Internal key: "1"…"7", in book order. */
  key: string;
  /** Arabic ordinal of the section as used in the app tree, e.g. "الثاني". */
  ordinal: string;
  /** Full app-facing section title, with the theme for context. */
  title: string;
  /** The section head the divider page prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its divider). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next divider). */
  bookTo: number;
  lessons: DiscoveryEnKg1T1Lesson[];
}

const TYPE = "Activity";

function concept(bookFrom: number, title: string): DiscoveryEnKg1T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The six chapters of the first term plus its Math Journal, with their printed
 * activities and every printed head, transcribed from the pages the book prints
 * them on and checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter starts come from the book's «CONTENTS» (scan 3): 1, 7, 11, 16, 20,
 * 27 (first activity pages; the dividers sit one page earlier at 0, 6, 10, 15,
 * 19, 26). The Math Journal divider sits at 31 with its three pages at 32–34.
 */
export const EGYPT_DISCOVERY_EN_KG1_T1_UNITS: DiscoveryEnKg1T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "Theme 1: Who Am I? - Chapter 1: Geometric Self-Portrait",
    printedHead: "Geometric Self-Portrait",
    bookFrom: 0,
    bookTo: 5,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "FRUITS AND VEGETABLES",
        printedHead: "FRUITS AND VEGETABLES",
        bookFrom: 1,
        concepts: [concept(1, "FRUITS AND VEGETABLES"), concept(1, "SELF-PORTRAIT")],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "MY FIVE SENSES",
        printedHead: "MY FIVE SENSES",
        bookFrom: 2,
        concepts: [concept(2, "MY FIVE SENSES")],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "WE ARE SIMILAR",
        printedHead: "WE ARE SIMILAR",
        bookFrom: 3,
        concepts: [concept(3, "WE ARE SIMILAR")],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "I SEE GEOMETRIC SHAPES",
        printedHead: "I SEE GEOMETRIC SHAPES",
        bookFrom: 4,
        concepts: [concept(4, "I SEE GEOMETRIC SHAPES")],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "MY FAVORITE THINGS",
        printedHead: "MY FAVORITE THINGS",
        bookFrom: 5,
        concepts: [concept(5, "MY FAVORITE THINGS")],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "الثاني",
    title: "Theme 1: Who Am I? - Chapter 2: Mommy's And Daddy's",
    printedHead: "Mommy's And Daddy's",
    bookFrom: 6,
    bookTo: 9,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "CHILDREN AND ADULTS",
        printedHead: "CHILDREN AND ADULTS",
        bookFrom: 7,
        concepts: [concept(7, "CHILDREN AND ADULTS")],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "TASKS",
        printedHead: "TASKS",
        bookFrom: 8,
        concepts: [concept(8, "TASKS")],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "BABY AND ADULT ANIMALS",
        printedHead: "BABY AND ADULT ANIMALS",
        bookFrom: 9,
        concepts: [concept(9, "BABY AND ADULT ANIMALS"), concept(9, "LET'S COUNT")],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "الثالث",
    title: "Theme 1: Who Am I? - Chapter 3: My School",
    printedHead: "My School",
    bookFrom: 10,
    bookTo: 14,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "SHAPE SORT",
        printedHead: "SHAPE SORT",
        bookFrom: 11,
        concepts: [concept(11, "SHAPE SORT")],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "SHAPES IN AND OUTSIDE MY ROOM",
        printedHead: "SHAPES IN AND OUTSIDE MY ROOM",
        bookFrom: 12,
        concepts: [concept(12, "SHAPES IN AND OUTSIDE MY ROOM")],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "JOBS AND TOOLS",
        printedHead: "JOBS AND TOOLS",
        bookFrom: 13,
        concepts: [concept(13, "JOBS AND TOOLS"), concept(13, "MY GROWN-UP JOB")],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "TEXTURE RUBBING",
        printedHead: "TEXTURE RUBBING",
        bookFrom: 14,
        concepts: [concept(14, "TEXTURE RUBBING")],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "الأول",
    title: "Theme 2: The World Around Me - Chapter 1: Animal Babies",
    printedHead: "Animal Babies",
    bookFrom: 15,
    bookTo: 18,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "MY DAILY ROUTINE",
        printedHead: "MY DAILY ROUTINE",
        bookFrom: 16,
        concepts: [concept(16, "MY DAILY ROUTINE")],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "OBSERVING ANIMALS",
        printedHead: "OBSERVING ANIMALS",
        bookFrom: 17,
        concepts: [concept(17, "OBSERVING ANIMALS")],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "ANIMALS AROUND THE WORLD",
        printedHead: "ANIMALS AROUND THE WORLD",
        bookFrom: 18,
        concepts: [concept(18, "ANIMALS AROUND THE WORLD")],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "الثاني",
    title: "Theme 2: The World Around Me - Chapter 2: How To Care",
    printedHead: "How To Care",
    bookFrom: 19,
    bookTo: 25,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: TYPE,
        title: "LIVING OR NOT?",
        printedHead: "LIVING OR NOT?",
        bookFrom: 20,
        concepts: [concept(20, "LIVING OR NOT?")],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "MAP OR PICTURE?",
        printedHead: "MAP OR PICTURE?",
        bookFrom: 21,
        concepts: [concept(21, "MAP OR PICTURE?")],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "SEASONS AND APPROPRIATE CLOTHES",
        printedHead: "SEASONS AND APPROPRIATE CLOTHES",
        bookFrom: 22,
        concepts: [concept(22, "SEASONS AND APPROPRIATE CLOTHES")],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "LIFE STAGES",
        printedHead: "LIFE STAGES",
        bookFrom: 23,
        concepts: [concept(23, "LIFE STAGES")],
      },
      {
        key: "5-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "KEEPING CLEAN",
        printedHead: "KEEPING CLEAN",
        bookFrom: 24,
        concepts: [concept(24, "KEEPING CLEAN")],
      },
      {
        key: "5-6",
        ordinal: "السادس",
        type: TYPE,
        title: "MY SALAD",
        printedHead: "MY SALAD",
        bookFrom: 25,
        concepts: [concept(25, "MY SALAD")],
      },
    ],
  },
  {
    key: "6",
    kind: "chapter",
    ordinal: "الثالث",
    title: "Theme 2: The World Around Me - Chapter 3: Where Do We Find Water?",
    printedHead: "Where Do We Find Water?",
    bookFrom: 26,
    bookTo: 30,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: TYPE,
        title: "RAIN, RAIN, FALLING DOWN",
        printedHead: "RAIN, RAIN, FALLING DOWN",
        bookFrom: 27,
        concepts: [concept(27, "RAIN, RAIN, FALLING DOWN")],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "WATER USE SORTING",
        printedHead: "WATER USE SORTING",
        bookFrom: 28,
        concepts: [concept(28, "WATER USE SORTING")],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "MAP OF EGYPT",
        printedHead: "MAP OF EGYPT",
        bookFrom: 29,
        concepts: [concept(29, "MAP OF EGYPT")],
      },
      {
        key: "6-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "BOTTLES IN THE RIVER",
        printedHead: "BOTTLES IN THE RIVER",
        bookFrom: 30,
        concepts: [concept(30, "BOTTLES IN THE RIVER")],
      },
    ],
  },
  {
    key: "7",
    kind: "journal",
    ordinal: "السابع",
    title: "Math Journal",
    printedHead: "Math Journal",
    bookFrom: 31,
    bookTo: 34,
    lessons: [
      {
        key: "7-1",
        ordinal: "الأول",
        type: TYPE,
        title: "Lesson 5",
        printedHead: "Lesson 5",
        bookFrom: 32,
        concepts: [
          concept(32, "Lesson 5"),
          concept(32, "Lesson 6"),
          concept(32, "Lesson 7"),
          concept(32, "Lesson 8"),
        ],
      },
      {
        key: "7-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "Lesson 31",
        printedHead: "Lesson 31",
        bookFrom: 33,
        concepts: [
          concept(33, "Lesson 31"),
          concept(33, "Lesson 32"),
          concept(33, "Lesson 33"),
          concept(33, "Lesson 34"),
          concept(33, "Lesson 35"),
          concept(33, "Lesson 36"),
          concept(33, "Lesson 37"),
          concept(33, "Lesson 38"),
          concept(33, "Lesson 39"),
        ],
      },
      {
        key: "7-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "Lesson 40",
        printedHead: "Lesson 40",
        bookFrom: 34,
        concepts: [
          concept(34, "Lesson 40"),
          concept(34, "Lesson 41"),
          concept(34, "Lesson 42"),
          concept(34, "Lesson 57"),
          concept(34, "Lesson 58"),
          concept(34, "Lesson 59"),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the section divider (its first lesson) or its
 * own head page, down to the page before the next lesson starts, bounded by
 * the section — so the divider stays inside the section it belongs to. When
 * the book prints two heads on one page they share a lesson, so distinct
 * lessons always start on distinct pages and the ranges tile the section
 * exactly.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_DISCOVERY_EN_KG1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_DISCOVERY_EN_KG1_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This term has
 * no appendix: every page of the term belongs to a section. Kept as a function
 * so the seeder and the stage share one shape across all the books.
 */
export function allLessonExtras(): Map<string, number[]> {
  return new Map<string, number[]>();
}

// ---------------------------------------------------------------------------
// OCR loading
// ---------------------------------------------------------------------------

const OCR_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "curriculum-ocr",
  "discovery-en-kg1-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (No term page of this book needs it — every term page carries real
 * text — but the guard is kept so the loader shares one shape across books.)
 */
const NO_TEXT = /لا يوجد نص/;

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    const text = readFileSync(file, "utf8").trim();
    return NO_TEXT.test(text) ? "" : text;
  } catch {
    return "";
  }
}

/** One page of a lesson's document, with a stable printed-page marker. */
function pageBlock(book: number, text: string): string {
  return `### صفحة ${book}\n${text}`;
}

/** The document a lesson grounds the tutor in: its own page range, in order. */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(unitIndex, lessonIndex);
  const parts: string[] = [];
  for (let p = from; p <= to; p++) {
    const text = loadBookPage(p);
    if (text) parts.push(pageBlock(p, text));
  }
  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/**
 * Folds text for comparison: lowercases and removes every non-letter/digit, so
 * the curly apostrophe (U+2019) this book prints, hyphen spacing («SELF -
 * PORTRAIT»), comma spacing («RAIN,RAIN») and any OCR letter-spacing cannot
 * break a match.
 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Whether `page` prints `needle`, ignoring case, spacing and punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints. This book's folio is a bare
 * numeral standing alone on the first line («10», «19», «30»); the one
 * exception is book 23 («LIFE STAGES»), which prints its folio «23» on its
 * last line. Both lines are read and every other line is ignored, so body
 * numbers (counts, lesson numbers, prices) can never be mistaken for a folio.
 * No term page prints bare numerals on both lines, so the rule is unambiguous.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const first = lines[0] ?? "";
  const last = lines[lines.length - 1] ?? "";
  const out: number[] = [];
  for (const line of [first, last]) {
    if (/^[0-9]+$/.test(line)) {
      const n = Number(line);
      if (n > 0 && !out.includes(n)) out.push(n);
    }
  }
  return out;
}

/**
 * The book number a content page prints, or null. Every content page that
 * carries a folio prints exactly one number there and it is its own, which is
 * what fixes the offset; the pages named in `FOLIO_LESS_ANCHORS` carry no
 * provable folio (roman «IV», no folio, or the journal's own refoliation) and
 * are handled there instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The term pages that print no provable folio in the OCR, each with the anchor
 * the check accepts in place of a page number: the Theme-1 divider (book 0,
 * folio «IV»), the Math Journal divider (book 31, no folio) and the three
 * Math Journal pages (books 32–34, which print the journal refoliation «1»,
 * «2», «3»), each anchored on the head its own page prints.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  0: "Geometric Self-Portrait",
  31: "Math Journal",
  32: "Lesson 5",
  33: "Lesson 31",
  34: "Lesson 40",
};

/**
 * Table invariants: lesson keys are unique and follow (section-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_DISCOVERY_EN_KG1_T1_UNITS;
  const keys = new Set<string>();

  units.forEach((unit, ui) => {
    if (!unit.title.trim()) problems.push(`القسم ${unit.key}: بلا عنوان`);
    if (!unit.printedHead.trim()) problems.push(`القسم ${unit.key}: بلا عنوان مطبوع`);
    if (unit.lessons.length === 0) problems.push(`القسم ${unit.title}: بلا دروس`);

    unit.lessons.forEach((lesson, li) => {
      if (keys.has(lesson.key)) problems.push(`مفتاح درس مكرر: «${lesson.key}»`);
      keys.add(lesson.key);
      const expectedKey = `${unit.key}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`القسم ${unit.key} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (!lesson.title.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان`);
      if (!lesson.printedHead.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان مطبوع`);
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أنشطة`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول نشاط`);
      }

      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((c, ci) => {
        if (!c.title.trim()) problems.push(`الدرس ${lesson.key} النشاط ${ci + 1}: بلا عنوان`);
        if (c.bookFrom < unit.bookFrom || c.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} النشاط ${ci + 1}: صفحته ${c.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && c.bookFrom < prev.bookFrom) {
          problems.push(`الدرس ${lesson.key}: صفحات الأنشطة تنازلية (${prev.bookFrom} ثم ${c.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }
      const last = lesson.concepts.at(-1)!;
      if (last.bookFrom < from || last.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: نشاطه الأخير ${last.bookFrom} خارج نطاقه ${from}–${to}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر القسم ${unit.bookFrom}، وجدنا ${from}`);
      }
    });

    const nextUnit = units[ui + 1];
    if (nextUnit && unit.bookTo >= nextUnit.bookFrom) {
      problems.push(`القسم ${unit.title} يتداخل مع ${nextUnit.title}`);
    } else if (nextUnit && unit.bookTo !== nextUnit.bookFrom - 1) {
      problems.push(`فجوة صفحات بين ${unit.title} و${nextUnit.title}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`);
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_DISCOVERY_EN_KG1_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_DISCOVERY_EN_KG1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_DISCOVERY_EN_KG1_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_DISCOVERY_EN_KG1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real text and proves its book number from its
 *     printed folio, or, on the pages named in `FOLIO_LESS_ANCHORS`, from the
 *     anchor that page prints;
 *  2. every section divider prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title and every activity's head is printed on the pages
 *     the lesson owns (the activity on its own page);
 *  4. every printed page in [0, 34] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of
 *     the term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_DISCOVERY_EN_KG1_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term is accounted for and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_DISCOVERY_EN_KG1_T1_BOOK_START || book > EGYPT_DISCOVERY_EN_KG1_T1_BOOK_END) continue;
    const text = loadBookPage(book);
    pagesChecked += 1;
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    printedPages.add(book);

    const anchor = FOLIO_LESS_ANCHORS[book];
    if (anchor !== undefined) {
      if (!normalize(text).includes(normalize(anchor))) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع ولا تطبع المرساة «${anchor}»`);
      }
    } else {
      const footer = printedFooter(book);
      if (footer === null) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع`);
      } else if (footer !== book) {
        problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_DISCOVERY_EN_KG1_T1_BOOK_END - EGYPT_DISCOVERY_EN_KG1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_DISCOVERY_EN_KG1_T1_BOOK_START} و${EGYPT_DISCOVERY_EN_KG1_T1_BOOK_END}`,
    );
  }

  // 2 + 3a. every section divider prints the section head, every lesson's first
  // page its head, and every lesson's title is printed somewhere in the pages
  // it owns.
  units.forEach((unit, ui) => {
    if (!pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} لا تطبع «${unit.printedHead}»`);
    }

    unit.lessons.forEach((lesson, li) => {
      if (!pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع «${lesson.printedHead}»`);
      }
      const { from, to } = lessonBookRange(ui, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      if (!titlePrinted) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
    });
  });

  // 3b. every activity's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (!pagePrints(c.bookFrom, c.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة النشاط ${c.bookFrom} لا تطبع «${c.title}»`);
        }
      });
    });
  });

  // 4. every printed content page is owned by exactly one lesson.
  const owner = new Map<number, string>();
  for (const { key, from, to } of allLessonRanges()) {
    for (let p = from; p <= to; p++) {
      const prev = owner.get(p);
      if (prev) problems.push(`الصفحة ${p} يملكها درسان: ${prev} و${key}`);
      owner.set(p, key);
    }
  }
  for (let p = EGYPT_DISCOVERY_EN_KG1_T1_BOOK_START; p <= EGYPT_DISCOVERY_EN_KG1_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
