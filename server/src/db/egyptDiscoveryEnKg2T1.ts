// Kindergarten 2 (رياض أطفال 2) Discover English («DISCOVER»), first term,
// Ministry of Education and Technical Education 2025/2026 edition (the cover
// imprint prints «MINISTRY OF EDUCATION AND TECHNICAL EDUCATION /
// KINDERGARTEN II / DISCOVER / 2025/2026»).
//
// Reserved ids (header only — this module wires nothing): the English-medium
// Discover curriculum for Kindergarten 2 is `eg-kg2-discovery-en`, subject
// `discovery-en` (name "Discovery (English)", nameAr "اكتشف (بالإنجليزية)"),
// lesson prefix `l-kg2-dis-en-`, grade `grade-kg2` (name "KG 2", nameAr
// "رياض أطفال 2").
//
// WHAT THE 76 SCANS PROVE — THE WHOLE FIRST TERM, CHAPTER BY CHAPTER
// The corpus holds 76 of the book's 80 scans (`pages-001`, `pages-003`,
// `pages-005` … `pages-080`): scans 2, 4, 44 and 79 were never produced.
// All four are fully blank pages proven by eye — scan 2 the blank back of the
// cover, scan 4 the blank verso facing the «CONTENTS», scan 44 the blank
// verso of the «TERM 2» divider, scan 79 a blank verso inside Term 2 — so no
// retry can produce a text layer. All four sit outside the first term (see
// `MISSING_SCANS`), exactly the holed-corpus case the English-G5 and
// English-G1-Discovery specs already ship with. The book's own «CONTENTS»
// (scan 5) lists the year-wide chapter skeleton with printed page numbers:
// Term 1 — Theme 1 «Who Am I?» — Chapter 1 «All About Me 1», Chapter 2
// «Class Portarit 5» (sic — the divider on scan 10 spells it «CLASS
// PORTRAIT»), Chapter 3 «Two Feet, Four Paws 11» — and Theme 2 «The World
// Around Me» — Chapter 1 «Our Natural World 18», Chapter 2 «Man-Made World
// 26» — then the Term-1 «Math Journal 34» and Term 2 («Theme 3: How The
// World Works» from 39, «Theme 4: Communication» from 56). The first term is
// therefore printed book pages 1–37: the Chapter-1 divider (scan 6) down to
// the third Math Journal page (scan 42), with the «TERM 2» divider on scan
// 43. This spec describes exactly those pages.
//
// THE OFFSET IS FIVE — book page = scan page − 5
// Every numbered content page prints its own folio as a bare numeral on its
// last line. Matching folios to scans: scan 6 prints «1» (book 1), scan 7
// prints «2» (book 2), scan 10 prints «5» (book 5), scan 16 prints «11»
// (book 11), scan 23 prints «18» (book 18), scan 31 prints «26» (book 26)
// and scan 38 prints «33» (book 33) — always scan = book + 5. The book's own
// «CONTENTS» independently confirms it: every chapter divider sits exactly
// where the contents says it does (scans 6, 10, 16, 23, 31 for books 1, 5,
// 11, 18, 26) and the «MATH JOURNAL» divider sits on scan 39 (book 34).
//
// FRONT MATTER IS SCANS 1–5; BACK MATTER IS SCANS 43–80
// Scans 1–5 are before book page 1: the cover (scan 1), a blank back page
// (scan 2, absent from the corpus), the «FOREWORD» (scan 3), a blank verso
// (scan 4, absent) and the year-wide «CONTENTS» with the NAME slip (scan 5,
// folio «V»). Scans 43–80 are after the term: the «TERM 2» divider (scan 43)
// with its blank verso (scan 44, absent), the Term-2 lessons (books 39–68),
// a blank verso (scan 79, absent) and the print matter (scan 80). There is
// no appendix in these scans, so `allLessonExtras()` returns nothing.
//
// NOTE FOR A FUTURE TERM-2 AUTHOR — THE OFFSET SHIFTS AFTER SCAN 44
// The unnumbered blank scan 44 consumes no book number, so Term-2 folios run
// at offset six (scan = book + 6): scan 46 prints «40» (book 40), scan 51
// prints «45» (book 45, the contents' Chapter-2 start), and the Term-2
// dividers on scans 45, 55, 62, 66, 69 and 75 sit exactly on the contents'
// 39, 49, 56, 60, 63 and 69. That shift lives wholly inside back matter and
// never enters this spec's checks.
//
// NO FIRST-TERM SCAN IS ABSENT — `MISSING_SCANS` STAYS EMPTY
// Every one of the 37 term scans carries text. The 4 absent scans are all
// outside [1, 37] and are skipped silently by the checker, which only
// iterates in-range files; listing them here would corrupt the folio
// arithmetic, so they are documented in prose above instead. `pagesChecked`
// therefore equals the full term range, 37 − 1 + 1 = 37.
//
// FOUR TERM PAGES PRINT NO PROVABLE FOLIO — EACH HAS A NAMED ANCHOR
// Unlike its G1/G2/G3 siblings, this book numbers its chapter dividers
// (books 1, 5, 11, 18, 26 all print their folio), so only the Math Journal
// is folio-less: its divider (book 34, «MATH JOURNAL» with no number) and
// its three pages (books 35–37), which print the journal's own refoliation
// («1», «2», «3») instead of their book numbers. Rather than weaken the
// page-number check these four pages are exempt from it in
// `assertTreeMatchesTheBook` and anchored on a string the page itself
// prints, named in `FOLIO_LESS_ANCHORS`. Every other term page proves its
// book number from the bare-numeral folio on its last line.
//
// EACH LESSON IS ONE PRINTED ACTIVITY PAGE
// KG books are activity-driven: every activity page prints one head
// («ABOUT ME», «MY FAMILY», «COMPUTERS» …) and that head is the lesson.
// Two pages print two titled heads and both share the lesson: book 13 («THE
// GOLDEN EAGLE» + «THE GAZELLE») and book 21 («CELERY» + the «Sarah's
// Plant» story). The Math Journal's heads are its printed «Lesson N»
// markers (thirteen markers «Lesson 7»–«Lesson 29» on book 35, eleven
// «Lesson 31»–«Lesson 47» on book 36, twelve «Lesson 48»–«Lesson 60» on
// book 37). Nothing is invented: every concept title below is a string the
// book itself prints on the page its `bookFrom` names.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// The contents misspells the chapter («Class Portarit»); the divider and
// every running head spell it «PORTRAIT», which the table uses. Divider
// colons differ («CHAPTER 1:» versus «CHAPTER 2 :» and «CHAPTER 2 :» with a
// trailing space on book 26); «TOOLS AND TECHNOLOGY OF AGRICULTURE» wraps
// across two lines on book 29. The «NATIONAL ANTHEM» page (book 10) carries
// the Arabic chorus lyrics; the apostrophe in «Sarah's Plant» is straight
// ASCII U+0027. `normalize` folds case, spacing and punctuation, so none of
// this breaks a match.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 5 (verified: book p.33 = scan p.38). */
export const BOOK_TO_PDF_OFFSET = 5;

/** First printed page of the term — the Chapter-1 divider (scan 6). */
export const EGYPT_DISCOVERY_EN_KG2_T1_BOOK_START = 1;

/** Last printed page of the term — Math Journal p.3 of Term 1 (scan 42). */
export const EGYPT_DISCOVERY_EN_KG2_T1_BOOK_END = 37;

/**
 * The scanned pages before the term: the cover (1), a blank back page (2,
 * absent from the corpus), the foreword (3), a blank verso (4, absent) and
 * the year-wide contents with the NAME slip (5).
 */
export const EGYPT_DISCOVERY_EN_KG2_T1_FRONT_MATTER = { from: 1, to: 5 } as const;

/**
 * The scanned pages after the term: the «TERM 2» divider (43) with its blank
 * verso (44, absent), the Term-2 lessons (books 39–68, at offset 6), a blank
 * verso (79, absent) and the print matter (80).
 */
export const EGYPT_DISCOVERY_EN_KG2_T1_BACK_MATTER = { from: 43, to: 80 } as const;

/**
 * The term pages the OCR never produced, in book pages. Every one of the 37
 * term scans carries text, so the list is empty; the 4 absent scans (2, 4,
 * 44, 79) are all blank versos outside the term and are documented in the
 * header instead. Kept so the loader, the checks and the seeders share one
 * shape across the books.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface DiscoveryEnKg2T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «Activity». */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one activity page, or one Math Journal page). */
export interface DiscoveryEnKg2T1Lesson {
  /** App-addressable key, e.g. "4-3" (chapter 4, lesson 3). */
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
  concepts: DiscoveryEnKg2T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — a chapter, or the Math Journal. */
export interface DiscoveryEnKg2T1Section {
  /** This book's sections are its chapters, plus the Math Journal appendix. */
  kind: "chapter" | "journal";
  /** Internal key: "1"…"6", in book order. */
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
  lessons: DiscoveryEnKg2T1Lesson[];
}

const TYPE = "Activity";

function concept(bookFrom: number, title: string): DiscoveryEnKg2T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The five chapters of the first term plus its Math Journal, with their
 * printed activities and every printed head, transcribed from the page the
 * book prints it on and checked by `assertTreeMatchesTheBook` before
 * seeding.
 *
 * Chapter ranges come from the book's «CONTENTS» (scan 5) and the dividers
 * the pages print: 1–4 (divider scan 6), 5–10 (scan 10), 11–17 (scan 16),
 * 18–25 (scan 23) and 26–33 (scan 31). The Math Journal divider sits at 34
 * with its three pages at 35–37.
 */
export const EGYPT_DISCOVERY_EN_KG2_T1_UNITS: DiscoveryEnKg2T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "Theme 1: Who Am I? - Chapter 1: All About Me",
    printedHead: "CHAPTER 1: ALL ABOUT ME",
    bookFrom: 1,
    bookTo: 4,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "ABOUT ME",
        printedHead: "ABOUT ME",
        bookFrom: 2,
        concepts: [concept(2, "ABOUT ME")],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "EXPLORING COLORS",
        printedHead: "EXPLORING COLORS",
        bookFrom: 3,
        concepts: [concept(3, "EXPLORING COLORS")],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "NOHA AND ADEL",
        printedHead: "NOHA AND ADEL",
        bookFrom: 4,
        concepts: [concept(4, "NOHA AND ADEL")],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "الثاني",
    title: "Theme 1: Who Am I? - Chapter 2: Class Portrait",
    printedHead: "CHAPTER 2 : CLASS PORTRAIT",
    bookFrom: 5,
    bookTo: 10,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "MY FAMILY",
        printedHead: "MY FAMILY",
        bookFrom: 6,
        concepts: [concept(6, "MY FAMILY")],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "ALL ABOUT JOBS",
        printedHead: "ALL ABOUT JOBS",
        bookFrom: 7,
        concepts: [concept(7, "ALL ABOUT JOBS")],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "FAVORITE JOBS BAR GRAPH",
        printedHead: "FAVORITE JOBS BAR GRAPH",
        bookFrom: 8,
        concepts: [concept(8, "FAVORITE JOBS BAR GRAPH")],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "MY COMMUNITIES",
        printedHead: "MY COMMUNITIES",
        bookFrom: 9,
        concepts: [concept(9, "MY COMMUNITIES")],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "NATIONAL ANTHEM",
        printedHead: "NATIONAL ANTHEM",
        bookFrom: 10,
        concepts: [concept(10, "NATIONAL ANTHEM")],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "الثالث",
    title: "Theme 1: Who Am I? - Chapter 3: Two Feet, Four Paws",
    printedHead: "CHAPTER 3: TWO FEET, FOUR PAWS",
    bookFrom: 11,
    bookTo: 17,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "TWO FEET, FOUR PAWS",
        printedHead: "TWO FEET, FOUR PAWS",
        bookFrom: 12,
        concepts: [concept(12, "TWO FEET, FOUR PAWS")],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "THE GOLDEN EAGLE",
        printedHead: "THE GOLDEN EAGLE",
        bookFrom: 13,
        concepts: [concept(13, "THE GOLDEN EAGLE"), concept(13, "THE GAZELLE")],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "THE HUMAN",
        printedHead: "THE HUMAN",
        bookFrom: 14,
        concepts: [concept(14, "THE HUMAN")],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "FOODS WE EAT",
        printedHead: "FOODS WE EAT",
        bookFrom: 15,
        concepts: [concept(15, "FOODS WE EAT")],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "COMPARING CREATURES",
        printedHead: "COMPARING CREATURES",
        bookFrom: 16,
        concepts: [concept(16, "COMPARING CREATURES")],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: TYPE,
        title: "OUR FLAG",
        printedHead: "OUR FLAG",
        bookFrom: 17,
        concepts: [concept(17, "OUR FLAG")],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "الأول",
    title: "Theme 2: The World Around Me - Chapter 1: Our Natural World",
    printedHead: "CHAPTER 1: OUR NATURAL WORLD",
    bookFrom: 18,
    bookTo: 25,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "SCHOOL YARD",
        printedHead: "SCHOOL YARD",
        bookFrom: 19,
        concepts: [concept(19, "SCHOOL YARD")],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "TRACE PLANT PARTS",
        printedHead: "TRACE PLANT PARTS",
        bookFrom: 20,
        concepts: [concept(20, "TRACE PLANT PARTS")],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "CELERY",
        printedHead: "CELERY",
        bookFrom: 21,
        concepts: [concept(21, "CELERY"), concept(21, "Sarah's Plant")],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "PLANT FEATURES",
        printedHead: "PLANT FEATURES",
        bookFrom: 22,
        concepts: [concept(22, "PLANT FEATURES")],
      },
      {
        key: "4-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "ANIMAL FEATURES",
        printedHead: "ANIMAL FEATURES",
        bookFrom: 23,
        concepts: [concept(23, "ANIMAL FEATURES")],
      },
      {
        key: "4-6",
        ordinal: "السادس",
        type: TYPE,
        title: "FEATURE CATEGORIES",
        printedHead: "FEATURE CATEGORIES",
        bookFrom: 24,
        concepts: [concept(24, "FEATURE CATEGORIES")],
      },
      {
        key: "4-7",
        ordinal: "السابع",
        type: TYPE,
        title: "INVESTIGATING THE NIGHT SKY",
        printedHead: "INVESTIGATING THE NIGHT SKY",
        bookFrom: 25,
        concepts: [concept(25, "INVESTIGATING THE NIGHT SKY")],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "الثاني",
    title: "Theme 2: The World Around Me - Chapter 2: Man-Made World",
    printedHead: "CHAPTER 2 : MAN-MADE WORLD",
    bookFrom: 26,
    bookTo: 33,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: TYPE,
        title: "TECHNOLOGY HELPS!",
        printedHead: "TECHNOLOGY HELPS!",
        bookFrom: 27,
        concepts: [concept(27, "TECHNOLOGY HELPS!")],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "TENDING A GARDEN: JOBS AND TOOLS",
        printedHead: "TENDING A GARDEN: JOBS AND TOOLS",
        bookFrom: 28,
        concepts: [concept(28, "TENDING A GARDEN: JOBS AND TOOLS")],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "TOOLS AND TECHNOLOGY OF AGRICULTURE",
        printedHead: "TOOLS AND TECHNOLOGY OF AGRICULTURE",
        bookFrom: 29,
        concepts: [concept(29, "TOOLS AND TECHNOLOGY OF AGRICULTURE")],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "WHERE DO WE TRAVEL?",
        printedHead: "WHERE DO WE TRAVEL?",
        bookFrom: 30,
        concepts: [concept(30, "WHERE DO WE TRAVEL?")],
      },
      {
        key: "5-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "IMPROVING AN INTERSECTION",
        printedHead: "IMPROVING AN INTERSECTION",
        bookFrom: 31,
        concepts: [concept(31, "IMPROVING AN INTERSECTION")],
      },
      {
        key: "5-6",
        ordinal: "السادس",
        type: TYPE,
        title: "NATIONAL CELEBRATIONS",
        printedHead: "NATIONAL CELEBRATIONS",
        bookFrom: 32,
        concepts: [concept(32, "NATIONAL CELEBRATIONS")],
      },
      {
        key: "5-7",
        ordinal: "السابع",
        type: TYPE,
        title: "COMPUTERS",
        printedHead: "COMPUTERS",
        bookFrom: 33,
        concepts: [concept(33, "COMPUTERS")],
      },
    ],
  },
  {
    key: "6",
    kind: "journal",
    ordinal: "السادس",
    title: "Math Journal",
    printedHead: "MATH JOURNAL",
    bookFrom: 34,
    bookTo: 37,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: TYPE,
        title: "Lesson 7",
        printedHead: "Lesson 7",
        bookFrom: 35,
        concepts: [
          concept(35, "Lesson 7"),
          concept(35, "Lesson 8"),
          concept(35, "Lesson 9"),
          concept(35, "Lesson 10"),
          concept(35, "Lesson 11"),
          concept(35, "Lesson 12"),
          concept(35, "Lesson 13"),
          concept(35, "Lesson 17"),
          concept(35, "Lesson 24"),
          concept(35, "Lesson 25"),
          concept(35, "Lesson 26"),
          concept(35, "Lesson 27"),
          concept(35, "Lesson 29"),
        ],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "Lesson 31",
        printedHead: "Lesson 31",
        bookFrom: 36,
        concepts: [
          concept(36, "Lesson 31"),
          concept(36, "Lesson 32"),
          concept(36, "Lesson 34"),
          concept(36, "Lesson 35"),
          concept(36, "Lesson 37"),
          concept(36, "Lesson 38"),
          concept(36, "Lesson 41"),
          concept(36, "Lesson 42"),
          concept(36, "Lesson 45"),
          concept(36, "Lesson 46"),
          concept(36, "Lesson 47"),
        ],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "Lesson 48",
        printedHead: "Lesson 48",
        bookFrom: 37,
        concepts: [
          concept(37, "Lesson 48"),
          concept(37, "Lesson 49"),
          concept(37, "Lesson 51"),
          concept(37, "Lesson 52"),
          concept(37, "Lesson 53"),
          concept(37, "Lesson 54"),
          concept(37, "Lesson 55"),
          concept(37, "Lesson 56"),
          concept(37, "Lesson 57"),
          concept(37, "Lesson 58"),
          concept(37, "Lesson 59"),
          concept(37, "Lesson 60"),
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the section's first page (for its first
 * lesson — the divider opener) or its own start page, up to the page before
 * the next lesson starts, or the section's last page for its last lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_DISCOVERY_EN_KG2_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_DISCOVERY_EN_KG2_T1_UNITS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. The scans
 * show no appendix, so this is empty; kept as a function so the seeder and
 * the stage share one shape across all the books.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const section of EGYPT_DISCOVERY_EN_KG2_T1_UNITS) {
    for (const lesson of section.lessons) {
      if (lesson.extraBookPages?.length) out.set(lesson.key, [...lesson.extraBookPages]);
    }
  }
  return out;
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
  "discovery-en-kg2-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (No term page of this book needs it — every term scan carries
 * text — but the guard keeps the loader the same shape across books.)
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

/** Loads and joins the text of a book-page range, page by page. */
export function loadBookRange(fromBook: number, toBook: number): string {
  const parts: string[] = [];
  for (let book = fromBook; book <= toBook; book++) {
    const text = loadBookPage(book);
    if (text) parts.push(pageBlock(book, text));
  }
  return parts.join("\n\n");
}

/**
 * The document a lesson grounds the tutor in: its own page range in order,
 * plus any appendix pages it points to. This book has no appendix, so the
 * extra loop is a no-op kept for a shared shape.
 */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(sectionIndex, lessonIndex);
  const lesson = EGYPT_DISCOVERY_EN_KG2_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(from, to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/** Folds text for comparison: lowercases and removes letters' spacing/punctuation. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring OCR spacing and punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints. This book's folio is a bare
 * numeral standing alone on its last line («14», «22», «33»). Both outer
 * lines are read and every other line is ignored, so body numbers (bar-graph
 * counts, table cells, directions) can never be mistaken for a folio. No
 * term page prints bare numerals on both outer lines, so the rule stays
 * unambiguous.
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
 * carries a folio prints exactly one number there and it is its own, which
 * is what fixes the offset; the Math Journal pages named in
 * `FOLIO_LESS_ANCHORS` carry no provable folio (no number, or the journal's
 * own refoliation) and are handled there instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * Folios whose OCR printed a different, still parseable number. Every folio
 * in this book came out right, so the map is empty and the folio check stays
 * exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no provable folio in the OCR, each with the
 * anchor the check accepts in place of a page number: the «MATH JOURNAL»
 * divider (book 34, no folio) and the three journal pages (books 35–37,
 * which print the journal refoliation «1», «2», «3»), each anchored on the
 * head its own page prints.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  34: "MATH JOURNAL",
  35: "Lesson 7",
  36: "Lesson 31",
  37: "Lesson 48",
};

/** Every head kind the table may use. */
const KNOWN_KINDS = new Set(["Activity"]);

/**
 * Table invariants: lesson keys are unique and follow (section-lesson),
 * every range sits inside its section, concept pages rise inside their
 * lesson, the sections tile the term without gaps or overlaps, and the
 * first/last sections hit the book's own bounds. A content mistake here
 * would quietly ground the tutor on the wrong pages, so it fails loudly
 * instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_DISCOVERY_EN_KG2_T1_UNITS;
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
        if (!KNOWN_KINDS.has(c.kind)) {
          problems.push(`الدرس ${lesson.key} النشاط ${ci + 1}: نوع غير معروف «${c.kind}»`);
        }
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
  if (first && first.bookFrom !== EGYPT_DISCOVERY_EN_KG2_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_DISCOVERY_EN_KG2_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_DISCOVERY_EN_KG2_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_DISCOVERY_EN_KG2_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number —
 *     from the folio on its last line, or, on the four journal pages named in
 *     `FOLIO_LESS_ANCHORS`, from the anchor the page itself prints. The scans
 *     in `MISSING_SCANS` (none this term) carry no text to prove anything
 *     with and are not iterated (they stay owned by their lesson ranges
 *     below);
 *  2. every section opener prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title (or its printed head) and every activity's head is
 *     printed on the pages the lesson owns (the activity on its own page);
 *  4. every page in [1, 37] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR'd
 *     page of the term, i.e. `_BOOK_END - _BOOK_START + 1` minus
 *     `MISSING_SCANS`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_DISCOVERY_EN_KG2_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_DISCOVERY_EN_KG2_T1_BOOK_START || book > EGYPT_DISCOVERY_EN_KG2_T1_BOOK_END) continue;
    if (MISSING_SCANS.includes(book)) continue;
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
      } else if (footer !== book && FOOTER_OCR_MISREADS[book] !== footer) {
        problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق صفحته`);
      }
    }
  }

  // 2 + 3a. every section opener prints the section head, every lesson's first
  // page its head, and every lesson's title (or printed head) is printed
  // somewhere in the pages it owns.
  units.forEach((unit, ui) => {
    if (loadBookPage(unit.bookFrom) && !pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} لا تطبع «${unit.printedHead}»`);
    }

    unit.lessons.forEach((lesson, li) => {
      if (loadBookPage(lesson.bookFrom) && !pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع «${lesson.printedHead}»`);
      }
      const { from, to } = lessonBookRange(ui, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.printedHead);
      if (!titlePrinted) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
    });
  });

  // 3b. every activity's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (loadBookPage(c.bookFrom) && !pagePrints(c.bookFrom, c.title)) {
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
  for (let p = EGYPT_DISCOVERY_EN_KG2_T1_BOOK_START; p <= EGYPT_DISCOVERY_EN_KG2_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_DISCOVERY_EN_KG2_T1_BOOK_END - EGYPT_DISCOVERY_EN_KG2_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_DISCOVERY_EN_KG2_T1_BOOK_START} و${EGYPT_DISCOVERY_EN_KG2_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
