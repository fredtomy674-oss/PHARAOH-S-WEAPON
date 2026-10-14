// Primary 2 (الصف الثاني الابتدائي) Mathematics, English-medium, first term,
// Ministry of Education and Technical Education 2025/2026 edition (the cover
// imprint prints «2025 - 2026» and the back matter the copyright line).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g2-math-en`, subject `math-en` (name "Mathematics"), lesson prefix
// `l-g2-math-en-`, grade `grade-2` (name "Primary 2").
//
// The curriculum tree for the Egypt `eg-g2-math-en` curriculum is rebuilt from
// the Ministry textbook `MATHEMATICS — Primary 2 — Term 1` (96 scanned pages,
// of which scans 010, 011, 012, 014, 016, 024, 025, 042, 043, 060, 074, 076,
// 077 and 079 never made it into the OCR corpus). This module is the single
// source of truth for its structure: the six printed chapters of the first
// term, every numbered lesson inside them (60 in all), and, for every lesson,
// the book's own printed heads — the lesson head plus the activity bands the
// pages print (APPLY / Reflect, and a single CHALLENGE) — verbatim and with
// the printed page they start on. The self-checks at the bottom prove that
// mapping against the OCR itself, page by page.
//
// THE OFFSET IS ZERO — book page = scan page
// Every content page prints a running footer of the form
// `PRIMARY 2 - TERM 1 <folio>` (or `<folio> PRIMARY 2 - TERM 1`).
// `BOOK_TO_PDF_OFFSET` is fixed by the scans and quoted here: scan 5 prints
// «PRIMARY 2 - TERM 1 5» (book 5, the Chapter-1 opener), scan 6 prints
// «6 PRIMARY 2 - TERM 1» (book 6), scan 41 prints «… 41» (book 41, the
// Chapter-4 opener), scan 73 prints «… 73» (book 73, the Chapter-6 opener)
// and scan 91 prints «… 91» (book 91, the term's closing Reflect). The book's
// own Contents (scan 4) independently confirms the lesson starts: it lists
// «Lesson 1: Reading Data 5» … «Lesson 10: More Applications on Time 90» —
// every surviving head below sits exactly where the Contents says it does,
// with the two Chapter-3 exceptions noted below.
//
// TERM = THE TYPED BOOK PAGES (books 5–91)
// Scan pages 1–4 are before the term: the cover (1), a blank verso (2, the OCR
// answers «لا يوجد نص في الصورة المرفقة»), the «FOREWORD» (3) and the printed
// «Contents» (4). Scan pages 92–96 are after the term: a blank verso (92), the
// reviewers / copyright page (93), a blank verso (94), the print-specs page
// (95) and the back-cover credits (96). The term runs from the Chapter-1
// opener (book 5 = scan 5) to the closing Reflect on time (book 91 = scan
// 91): `EGYPT_MATH_EN_G2_T1_BOOK_START` / `_BOOK_END` are exactly those two
// pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` is therefore 87 − 14 = 73: the 87 typed pages
// minus the 14 scans the corpus never captured.
//
// FOURTEEN HOLED SCANS, DOCUMENTED IN MISSING_SCANS
// Absent scans (as scan = book numbers, the offset being zero): 010, 011,
// 012, 014, 016, 024, 025, 042, 043, 060, 074, 076, 077, 079. A
// genuinely-missing page inside a lesson's range stays owned by that lesson,
// so the ranges still tile [5, 91] exactly; the step-1 page proof skips those
// scans, and every head / title / activity proof scoped to a page the corpus
// never captured is skipped the same way (the Contents page, scan 4, is the
// surviving provenance for those heads). Six lessons lose their whole range
// to the holes (1-5, 1-7, 2-5, 2-6, 4-2, 5-2) and three more lose the head
// page while keeping a Reflect or problem tail that never carries a lesson
// title (1-6 keeps 13, 6-3 keeps 78, 6-4 keeps 80–81); for exactly those nine
// lessons the title-print check is satisfied through the Contents instead of
// the missing head page. Nothing else is exempt: every present page proves
// its own number, every surviving head is checked, and no present scan is
// listed as missing.
//
// NO FOLIO-LESS PRESENT PAGE AND NO MISREAD FOLIO
// Every one of the 73 present term pages carries a running footer whose
// number is its own book number, so `FOOTER_OCR_MISREADS` and
// `FOLIO_LESS_ANCHORS` are both empty. Two footers are split across lines —
// book 45 prints «PRIMARY 2 - TERM 1» with «45» on the following line, book
// 68 prints «68» on the line before «PRIMARY 2 - TERM 1» — and
// `footerCandidates` pairs those explicitly; a bare numeral anywhere else is
// never read as a folio, so body numbers (chart cells, Tens/Ones boxes,
// answers) can never be mistaken for one.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every numbered lesson contributes its head line (number + title, exactly as
// the opener prints it) plus the activity bands printed inside the pages the
// lesson owns, in page order: «APPLY» on the work page, «Reflect» where the
// lesson prints its reflection box (on the head page itself when the lesson
// keeps company with it, otherwise on the closing page), and the single
// «CHALLENGE:» band of lesson 2-3 (read as CHALLENGE, as the chambers of the
// other specs read suffixed bands). The practice tails that merely continue
// exercises (books 10, 23, 45, 47, 50, 58, 65, 70, 80, 81, 88) print no head
// of their own, so they carry no concept — they are still owned by their
// lesson's range. Nothing is invented: every concept title below is a string
// the book itself prints on the page its `bookFrom` names, except the ten
// head concepts on pages the corpus never captured, whose wording the
// Contents (scan 4) proves and the book's uniform «LESSON n: …» caps style
// fixes.
//
// THREE GENUINE CONTENTS ANOMALIES (the pages rule in each case)
//  1. The Contents lists lesson 3-6 «Writing Numbers in Different Forms» at
//     book 36, but the head is printed on book 35 (book 34 still prints the
//     lesson-5 head); the spec follows the page that prints the head.
//  2. The Contents entry for lesson 3-7 «Comparing Numbers» carries a
//     garbled page number («??»); the head is printed on book 36.
//  3. Book 59 prints «LESSON 1: ATTRIBUTED OF 2-DIMENSIONAL SHAPES» (the
//     book's own double-T misspelling); the Contents spells it «Attributed».
//     The spec stores the page's own spelling.
//
// THE CHAPTER OPENER RIDES WITH THE FIRST LESSON
// Each chapter's first lesson starts on the chapter's own opener page (which
// prints «CHAPTER N» and then the lesson head), so `lessonBookRange` starts a
// chapter's first lesson at the section head, exactly as the other Egyptian
// Mathematics specs do.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N (verified: book p.91 = scan p.91). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the term — the Chapter-1 opener (scan 5). */
export const EGYPT_MATH_EN_G2_T1_BOOK_START = 5;

/** Last printed page of the term — the closing Reflect on time (scan 91). */
export const EGYPT_MATH_EN_G2_T1_BOOK_END = 91;

/** The scanned pages before the term: cover, a blank, FOREWORD, Contents. */
export const EGYPT_MATH_EN_G2_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/** The scans after the term: blank, reviewers/copyright, blank, specs, back. */
export const EGYPT_MATH_EN_G2_T1_BACK_MATTER = { from: 92, to: 96 } as const;

/**
 * The term pages the OCR never produced, as scan pages (= book pages, the
 * offset being zero): 010, 011, 012, 014, 016, 024, 025, 042, 043, 060, 074,
 * 076, 077, 079. Each stays owned by its lesson's range; the checker skips
 * absent scans silently, so `pagesChecked` is 87 − 14 = 73.
 */
export const MISSING_SCANS: readonly number[] = [
  10, 11, 12, 14, 16, 24, 25, 42, 43, 60, 74, 76, 77, 79,
];

/** One printed head of a lesson — becomes one concept in the app tree. */
export interface MathEnG2T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: "Lesson" or one of the activity band words. */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one numbered lesson of a chapter). */
export interface MathEnG2T1Lesson {
  /** App-addressable key, e.g. "3-7" (chapter 3, lesson 7). */
  key: string;
  /** English ordinal of the lesson number, e.g. "Seventh". */
  ordinal: string;
  /** The lesson's opening head type — its first concept's kind ("Lesson"). */
  type: string;
  /** Lesson title as printed at the head of the lesson (without the number prefix). */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: MathEnG2T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a chapter — so no lesson below uses it; the
   * field is kept so this module shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed chapter of the term. */
export interface MathEnG2T1Section {
  /** This book's sections are its chapters. */
  kind: "chapter";
  /** Internal key: "1"…"6", in book order. */
  key: string;
  /** English ordinal of the chapter as used in the app tree, e.g. "Third". */
  ordinal: string;
  /** Full app-facing section title, e.g. "Chapter 3". */
  title: string;
  /** The chapter head its opener prints, verbatim, e.g. "CHAPTER 3". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next opener). */
  bookTo: number;
  lessons: MathEnG2T1Lesson[];
}

const LESSON = "Lesson";
const APPLY = "APPLY";
const REFLECT = "Reflect";
const CHALLENGE = "CHALLENGE";

function concept(bookFrom: number, kind: string, title: string): MathEnG2T1Concept {
  return { bookFrom, kind, title };
}

function lessonHead(bookFrom: number, title: string): MathEnG2T1Concept {
  return concept(bookFrom, LESSON, title);
}

/** One printed activity band. The band word is both the concept's kind and title. */
function band(bookFrom: number, kind: string): MathEnG2T1Concept {
  return concept(bookFrom, kind, kind);
}

/**
 * The six chapters of the first term with their printed lessons and every printed
 * head, transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter ranges come from the pages' own «CHAPTER N» bands and the Contents
 * (scan 4): 5–18, 19–29, 30–40, 41–58, 59–72 and 73–91. Lesson starts come from
 * the «LESSON n:» openers and match the Contents, except lesson 3-6 (the
 * Contents says 36, the head is printed on 35 — see the header note).
 */
export const EGYPT_MATH_EN_G2_T1_UNITS: MathEnG2T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "First",
    title: "Chapter 1",
    printedHead: "CHAPTER 1",
    bookFrom: 5,
    bookTo: 18,
    lessons: [
      {
        key: "1-1",
        ordinal: "First",
        type: LESSON,
        title: "READING DATA",
        printedHead: "LESSON 1: READING DATA",
        bookFrom: 5,
        concepts: [lessonHead(5, "LESSON 1: READING DATA"), band(5, APPLY)],
      },
      {
        key: "1-2",
        ordinal: "Second",
        type: LESSON,
        title: "COLLECTING AND REPRESENTING DATA",
        printedHead: "LESSON 2: COLLECTING AND REPRESENTING DATA",
        bookFrom: 6,
        concepts: [
          lessonHead(6, "LESSON 2: COLLECTING AND REPRESENTING DATA"),
          band(6, APPLY),
          band(7, REFLECT),
        ],
      },
      {
        key: "1-3",
        ordinal: "Third",
        type: LESSON,
        title: "COMPARING DATA",
        printedHead: "LESSON 3: COMPARING DATA",
        bookFrom: 8,
        concepts: [lessonHead(8, "LESSON 3: COMPARING DATA"), band(8, APPLY)],
      },
      {
        key: "1-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "REPRESENTING AND INTERPRETING DATA",
        printedHead: "LESSON 4: REPRESENTING AND INTERPRETING DATA",
        bookFrom: 9,
        concepts: [
          lessonHead(9, "LESSON 4: REPRESENTING AND INTERPRETING DATA"),
          band(9, APPLY),
        ],
      },
      {
        key: "1-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "REPRESENTING DATA WITH A SCALE OF 1",
        printedHead: "LESSON 5: REPRESENTING DATA WITH A SCALE OF 1",
        bookFrom: 11,
        concepts: [lessonHead(11, "LESSON 5: REPRESENTING DATA WITH A SCALE OF 1")],
      },
      {
        key: "1-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "REPRESENTING DATA WITH A SCALE OF 2",
        printedHead: "LESSON 6: REPRESENTING DATA WITH A SCALE OF 2",
        bookFrom: 12,
        concepts: [
          lessonHead(12, "LESSON 6: REPRESENTING DATA WITH A SCALE OF 2"),
          band(13, REFLECT),
        ],
      },
      {
        key: "1-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "REPRESENTING DATA WITH A SCALE OF 10",
        printedHead: "LESSON 7: REPRESENTING DATA WITH A SCALE OF 10",
        bookFrom: 14,
        concepts: [lessonHead(14, "LESSON 7: REPRESENTING DATA WITH A SCALE OF 10")],
      },
      {
        key: "1-8",
        ordinal: "Eighth",
        type: LESSON,
        title: "BAR GRAPH",
        printedHead: "LESSON 8: BAR GRAPH",
        bookFrom: 15,
        concepts: [lessonHead(15, "LESSON 8: BAR GRAPH"), band(15, APPLY)],
      },
      {
        key: "1-9",
        ordinal: "Ninth",
        type: LESSON,
        title: "PICTOGRAPH",
        printedHead: "LESSON 9: PICTOGRAPH",
        bookFrom: 16,
        concepts: [lessonHead(16, "LESSON 9: PICTOGRAPH"), band(17, REFLECT)],
      },
      {
        key: "1-10",
        ordinal: "Tenth",
        type: LESSON,
        title: "GRAPH ELEMENTS",
        printedHead: "LESSON 10: GRAPH ELEMENTS",
        bookFrom: 18,
        concepts: [lessonHead(18, "LESSON 10: GRAPH ELEMENTS"), band(18, APPLY)],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "Second",
    title: "Chapter 2",
    printedHead: "CHAPTER 2",
    bookFrom: 19,
    bookTo: 29,
    lessons: [
      {
        key: "2-1",
        ordinal: "First",
        type: LESSON,
        title: "ADDING DOUBLES",
        printedHead: "LESSON 1: ADDING DOUBLES",
        bookFrom: 19,
        concepts: [lessonHead(19, "LESSON 1: ADDING DOUBLES"), band(19, APPLY)],
      },
      {
        key: "2-2",
        ordinal: "Second",
        type: LESSON,
        title: "ADDING OR SUBTRACTING BY COUNTING",
        printedHead: "LESSON 2: ADDING OR SUBTRACTING BY COUNTING",
        bookFrom: 20,
        concepts: [
          lessonHead(20, "LESSON 2: ADDING OR SUBTRACTING BY COUNTING"),
          band(20, APPLY),
          band(20, REFLECT),
        ],
      },
      {
        key: "2-3",
        ordinal: "Third",
        type: LESSON,
        title: "ADDING OR SUBTRACTING THE NUMBER 10",
        printedHead: "LESSON 3: ADDING OR SUBTRACTING THE NUMBER 10",
        bookFrom: 21,
        concepts: [
          lessonHead(21, "LESSON 3: ADDING OR SUBTRACTING THE NUMBER 10"),
          band(21, APPLY),
          band(21, CHALLENGE),
        ],
      },
      {
        key: "2-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "ADDING OR SUBTRACTING BY MAKING TENS",
        printedHead: "LESSON 4: ADDING OR SUBTRACTING BY MAKING TENS",
        bookFrom: 22,
        concepts: [
          lessonHead(22, "LESSON 4: ADDING OR SUBTRACTING BY MAKING TENS"),
          band(22, APPLY),
          band(23, REFLECT),
        ],
      },
      {
        key: "2-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "STORY PROBLEMS ON ADDING",
        printedHead: "LESSON 5: STORY PROBLEMS ON ADDING",
        bookFrom: 24,
        concepts: [lessonHead(24, "LESSON 5: STORY PROBLEMS ON ADDING")],
      },
      {
        key: "2-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "STORY PROBLEMS ON SUBTRACTING",
        printedHead: "LESSON 6: STORY PROBLEMS ON SUBTRACTING",
        bookFrom: 25,
        concepts: [lessonHead(25, "LESSON 6: STORY PROBLEMS ON SUBTRACTING")],
      },
      {
        key: "2-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "MENTAL APPLICATIONS ON ADDING",
        printedHead: "LESSON 7: MENTAL APPLICATIONS ON ADDING",
        bookFrom: 26,
        concepts: [
          lessonHead(26, "LESSON 7: MENTAL APPLICATIONS ON ADDING"),
          band(26, APPLY),
          band(26, REFLECT),
        ],
      },
      {
        key: "2-8",
        ordinal: "Eighth",
        type: LESSON,
        title: "MENTAL APPLICATIONS ON SUBTRACTING",
        printedHead: "LESSON 8: MENTAL APPLICATIONS ON SUBTRACTING",
        bookFrom: 27,
        concepts: [
          lessonHead(27, "LESSON 8: MENTAL APPLICATIONS ON SUBTRACTING"),
          band(27, APPLY),
        ],
      },
      {
        key: "2-9",
        ordinal: "Ninth",
        type: LESSON,
        title: "MENTAL APPLICATIONS ON ADDING AND SUBTRACTING",
        printedHead: "LESSON 9: MENTAL APPLICATIONS ON ADDING",
        bookFrom: 28,
        concepts: [
          lessonHead(28, "LESSON 9: MENTAL APPLICATIONS ON ADDING"),
          band(28, APPLY),
          band(28, REFLECT),
        ],
      },
      {
        key: "2-10",
        ordinal: "Tenth",
        type: LESSON,
        title: "ADDING USING THE 120 CHART",
        printedHead: "LESSON 10: ADDING USING THE 120 CHART",
        bookFrom: 29,
        concepts: [lessonHead(29, "LESSON 10: ADDING USING THE 120 CHART"), band(29, APPLY)],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "Third",
    title: "Chapter 3",
    printedHead: "CHAPTER 3",
    bookFrom: 30,
    bookTo: 40,
    lessons: [
      {
        key: "3-1",
        ordinal: "First",
        type: LESSON,
        title: "3-DIGITS NUMBERS",
        printedHead: "LESSON 1: 3-DIGITS NUMBERS",
        bookFrom: 30,
        concepts: [lessonHead(30, "LESSON 1: 3-DIGITS NUMBERS"), band(30, APPLY)],
      },
      {
        key: "3-2",
        ordinal: "Second",
        type: LESSON,
        title: "MORE OF 3-DIGITS NUMBERS",
        printedHead: "LESSON 2: MORE OF 3-DIGITS NUMBERS",
        bookFrom: 31,
        concepts: [
          lessonHead(31, "LESSON 2: MORE OF 3-DIGITS NUMBERS"),
          band(31, APPLY),
          band(31, REFLECT),
        ],
      },
      {
        key: "3-3",
        ordinal: "Third",
        type: LESSON,
        title: "STANDARD FORM AND EXPANDED FORM",
        printedHead: "LESSON 3: STANDARD FORM AND EXPANDED FORM",
        bookFrom: 32,
        concepts: [
          lessonHead(32, "LESSON 3: STANDARD FORM AND EXPANDED FORM"),
          band(32, APPLY),
          band(32, REFLECT),
        ],
      },
      {
        key: "3-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "NUMBERS IN WORD FORM",
        printedHead: "LESSON 4: NUMBERS IN WORD FORM",
        bookFrom: 33,
        concepts: [
          lessonHead(33, "LESSON 4: NUMBERS IN WORD FORM"),
          band(33, APPLY),
          band(33, REFLECT),
        ],
      },
      {
        key: "3-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "MORE NUMBERS IN WORD FORM",
        printedHead: "LESSON 5: MORE NUMBERS IN WORD FORM",
        bookFrom: 34,
        concepts: [
          lessonHead(34, "LESSON 5: MORE NUMBERS IN WORD FORM"),
          band(34, APPLY),
        ],
      },
      {
        key: "3-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "WRITING NUMBERS IN DIFFERENT FORMS",
        printedHead: "LESSON 6: WRITING NUMBERS IN DIFFERENT FORMS",
        bookFrom: 35,
        concepts: [
          lessonHead(35, "LESSON 6: WRITING NUMBERS IN DIFFERENT FORMS"),
          band(35, REFLECT),
        ],
      },
      {
        key: "3-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "COMPARING NUMBERS",
        printedHead: "LESSON 7: COMPARING NUMBERS",
        bookFrom: 36,
        concepts: [lessonHead(36, "LESSON 7: COMPARING NUMBERS"), band(36, APPLY)],
      },
      {
        key: "3-8",
        ordinal: "Eighth",
        type: LESSON,
        title: "MORE OF COMPARING NUMBERS",
        printedHead: "LESSON 8: MORE OF COMPARING NUMBERS",
        bookFrom: 37,
        concepts: [
          lessonHead(37, "LESSON 8: MORE OF COMPARING NUMBERS"),
          band(37, APPLY),
          band(38, REFLECT),
        ],
      },
      {
        key: "3-9",
        ordinal: "Ninth",
        type: LESSON,
        title: "ORDERING NUMBERS",
        printedHead: "LESSON 9: ORDERING NUMBERS",
        bookFrom: 39,
        concepts: [lessonHead(39, "LESSON 9: ORDERING NUMBERS"), band(39, APPLY)],
      },
      {
        key: "3-10",
        ordinal: "Tenth",
        type: LESSON,
        title: "MORE OF ORDERING NUMBERS",
        printedHead: "LESSON 10: MORE OF ORDERING NUMBERS",
        bookFrom: 40,
        concepts: [
          lessonHead(40, "LESSON 10: MORE OF ORDERING NUMBERS"),
          band(40, APPLY),
          band(40, REFLECT),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "Fourth",
    title: "Chapter 4",
    printedHead: "CHAPTER 4",
    bookFrom: 41,
    bookTo: 58,
    lessons: [
      {
        key: "4-1",
        ordinal: "First",
        type: LESSON,
        title: "COMMUTATIVE PROPERTY IN ADDITION",
        printedHead: "LESSON 1: COMMUTATIVE PROPERTY IN ADDITION",
        bookFrom: 41,
        concepts: [
          lessonHead(41, "LESSON 1: COMMUTATIVE PROPERTY IN ADDITION"),
          band(41, APPLY),
        ],
      },
      {
        key: "4-2",
        ordinal: "Second",
        type: LESSON,
        title: "MORE OF MENTAL APPLICATIONS ON ADDING AND SUBTRACTING",
        printedHead: "LESSON 2: MORE OF MENTAL APPLICATIONS ON ADDING AND SUBTRACTING",
        bookFrom: 42,
        concepts: [
          lessonHead(42, "LESSON 2: MORE OF MENTAL APPLICATIONS ON ADDING AND SUBTRACTING"),
        ],
      },
      {
        key: "4-3",
        ordinal: "Third",
        type: LESSON,
        title: "DECOMPOSING NUMBERS INTO ONES AND TENS",
        printedHead: "LESSON 3: DECOMPOSING NUMBERS INTO ONES AND",
        bookFrom: 44,
        concepts: [
          lessonHead(44, "LESSON 3: DECOMPOSING NUMBERS INTO ONES AND"),
          band(44, APPLY),
        ],
      },
      {
        key: "4-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "ADDING WITHOUT REGROUPING",
        printedHead: "LESSON 4: ADDING WITHOUT REGROUPING",
        bookFrom: 46,
        concepts: [
          lessonHead(46, "LESSON 4: ADDING WITHOUT REGROUPING"),
          band(46, APPLY),
          band(48, REFLECT),
        ],
      },
      {
        key: "4-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "SUBTRACTING WITHOUT REGROUPING",
        printedHead: "LESSON 5: SUBTRACTING WITHOUT REGROUPING",
        bookFrom: 49,
        concepts: [
          lessonHead(49, "LESSON 5: SUBTRACTING WITHOUT REGROUPING"),
          band(49, APPLY),
          band(51, REFLECT),
        ],
      },
      {
        key: "4-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "ESTIMATING THE SUM AND THE DIFFERENCE",
        printedHead: "LESSON 6: ESTIMATING THE SUM AND THE DIFFERENCE",
        bookFrom: 52,
        concepts: [
          lessonHead(52, "LESSON 6: ESTIMATING THE SUM AND THE DIFFERENCE"),
          band(52, APPLY),
        ],
      },
      {
        key: "4-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "COMPARING THE SUM AND THE ESTIMATION",
        printedHead: "LESSON 7: COMPARING THE SUM AND THE ESTIMATION",
        bookFrom: 53,
        concepts: [
          lessonHead(53, "LESSON 7: COMPARING THE SUM AND THE ESTIMATION"),
          band(53, APPLY),
        ],
      },
      {
        key: "4-8",
        ordinal: "Eighth",
        type: LESSON,
        title: "ADDING BY REGROUPING ONES",
        printedHead: "LESSON 8: ADDING BY REGROUPING ONES",
        bookFrom: 54,
        concepts: [
          lessonHead(54, "LESSON 8: ADDING BY REGROUPING ONES"),
          band(54, APPLY),
          band(55, REFLECT),
        ],
      },
      {
        key: "4-9",
        ordinal: "Ninth",
        type: LESSON,
        title: "MORE OF ADDING BY REGROUPING ONES",
        printedHead: "LESSON 9: MORE OF ADDING BY REGROUPING ONES",
        bookFrom: 56,
        concepts: [
          lessonHead(56, "LESSON 9: MORE OF ADDING BY REGROUPING ONES"),
          band(56, APPLY),
        ],
      },
      {
        key: "4-10",
        ordinal: "Tenth",
        type: LESSON,
        title: "ADDING MORE THAN TWO NUMBERS BY REGROUPING ONES",
        printedHead: "LESSON 10: ADDING MORE THAN TWO NUMBERS BY",
        bookFrom: 57,
        concepts: [
          lessonHead(57, "LESSON 10: ADDING MORE THAN TWO NUMBERS BY"),
          band(57, APPLY),
        ],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "Fifth",
    title: "Chapter 5",
    printedHead: "CHAPTER 5",
    bookFrom: 59,
    bookTo: 72,
    lessons: [
      {
        key: "5-1",
        ordinal: "First",
        type: LESSON,
        title: "ATTRIBUTED OF 2-DIMENSIONAL SHAPES",
        printedHead: "LESSON 1: ATTRIBUTED OF 2-DIMENSIONAL SHAPES",
        bookFrom: 59,
        concepts: [
          lessonHead(59, "LESSON 1: ATTRIBUTED OF 2-DIMENSIONAL SHAPES"),
          band(59, APPLY),
        ],
      },
      {
        key: "5-2",
        ordinal: "Second",
        type: LESSON,
        title: "SORTING 2-DIMENSIONAL SHAPES",
        printedHead: "LESSON 2: SORTING 2-DIMENSIONAL SHAPES",
        bookFrom: 60,
        concepts: [lessonHead(60, "LESSON 2: SORTING 2-DIMENSIONAL SHAPES")],
      },
      {
        key: "5-3",
        ordinal: "Third",
        type: LESSON,
        title: "DRAWING GEOMETRIC SHAPES",
        printedHead: "LESSON 3: DRAWING GEOMETRIC SHAPES",
        bookFrom: 61,
        concepts: [
          lessonHead(61, "LESSON 3: DRAWING GEOMETRIC SHAPES"),
          band(61, APPLY),
          band(62, REFLECT),
        ],
      },
      {
        key: "5-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "CREATING A PICTURE USING 2-DIMENSIONAL SHAPES",
        printedHead: "LESSON 4: CREATING A PICTURE USING 2-DIMENSIONAL",
        bookFrom: 63,
        concepts: [
          lessonHead(63, "LESSON 4: CREATING A PICTURE USING 2-DIMENSIONAL"),
          band(63, APPLY),
        ],
      },
      {
        key: "5-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "MEASURING THE LENGTH IN CENTIMETERS",
        printedHead: "LESSON 5: MEASURING THE LENGTH IN CENTIMETERS",
        bookFrom: 64,
        concepts: [
          lessonHead(64, "LESSON 5: MEASURING THE LENGTH IN CENTIMETERS"),
          band(64, APPLY),
        ],
      },
      {
        key: "5-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "ESTIMATING THE LENGTH",
        printedHead: "LESSON 6: ESTIMATING THE LENGTH",
        bookFrom: 66,
        concepts: [
          lessonHead(66, "LESSON 6: ESTIMATING THE LENGTH"),
          band(66, APPLY),
          band(66, REFLECT),
        ],
      },
      {
        key: "5-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "MEASURING THE SIDE LENGTH OF A GEOMETRIC SHAPE",
        printedHead: "LESSON 7: MEASURING THE SIDE LENGTH OF",
        bookFrom: 67,
        concepts: [
          lessonHead(67, "LESSON 7: MEASURING THE SIDE LENGTH OF"),
          band(67, APPLY),
        ],
      },
      {
        key: "5-8",
        ordinal: "Eighth",
        type: LESSON,
        title: "ATTRIBUTES OF 3-DIMENSIONAL SHAPES",
        printedHead: "LESSON 8: ATTRIBUTES OF 3-DIMENSIONAL SHAPES",
        bookFrom: 68,
        concepts: [
          lessonHead(68, "LESSON 8: ATTRIBUTES OF 3-DIMENSIONAL SHAPES"),
          band(68, APPLY),
          band(68, REFLECT),
        ],
      },
      {
        key: "5-9",
        ordinal: "Ninth",
        type: LESSON,
        title: "SORTING 3-DIMENSIONAL SHAPES",
        printedHead: "LESSON 9: SORTING 3-DIMENSIONAL SHAPES",
        bookFrom: 69,
        concepts: [
          lessonHead(69, "LESSON 9: SORTING 3-DIMENSIONAL SHAPES"),
          band(69, APPLY),
          band(71, REFLECT),
        ],
      },
      {
        key: "5-10",
        ordinal: "Tenth",
        type: LESSON,
        title: "CREATING 3-DIMENSIONAL SHAPES",
        printedHead: "LESSON 10: CREATING 3-DIMENSIONAL SHAPES",
        bookFrom: 72,
        concepts: [
          lessonHead(72, "LESSON 10: CREATING 3-DIMENSIONAL SHAPES"),
          band(72, APPLY),
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "chapter",
    ordinal: "Sixth",
    title: "Chapter 6",
    printedHead: "CHAPTER 6",
    bookFrom: 73,
    bookTo: 91,
    lessons: [
      {
        key: "6-1",
        ordinal: "First",
        type: LESSON,
        title: "MEASURING MASS",
        printedHead: "LESSON 1: MEASURING MASS",
        bookFrom: 73,
        concepts: [lessonHead(73, "LESSON 1: MEASURING MASS"), band(73, APPLY)],
      },
      {
        key: "6-2",
        ordinal: "Second",
        type: LESSON,
        title: "UNITS OF MEASURING MASS",
        printedHead: "LESSON 2: UNITS OF MEASURING MASS",
        bookFrom: 75,
        concepts: [lessonHead(75, "LESSON 2: UNITS OF MEASURING MASS"), band(75, APPLY)],
      },
      {
        key: "6-3",
        ordinal: "Third",
        type: LESSON,
        title: "APPLICATIONS ON MEASURING MASS",
        printedHead: "LESSON 3: APPLICATIONS ON MEASURING MASS",
        bookFrom: 76,
        concepts: [
          lessonHead(76, "LESSON 3: APPLICATIONS ON MEASURING MASS"),
          band(78, REFLECT),
        ],
      },
      {
        key: "6-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "MORE APPLICATIONS ON MEASURING MASS",
        printedHead: "LESSON 4: MORE APPLICATIONS ON MEASURING MASS",
        bookFrom: 79,
        concepts: [lessonHead(79, "LESSON 4: MORE APPLICATIONS ON MEASURING MASS")],
      },
      {
        key: "6-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "TIME A.M. OR P.M.",
        printedHead: "LESSON 5: TIME A.M. OR P.M.",
        bookFrom: 82,
        concepts: [
          lessonHead(82, "LESSON 5: TIME A.M. OR P.M."),
          band(82, APPLY),
          band(83, REFLECT),
        ],
      },
      {
        key: "6-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "CREATING AN ANALOG CLOCK",
        printedHead: "LESSON 6: CREATING AN ANALOG CLOCK",
        bookFrom: 84,
        concepts: [
          lessonHead(84, "LESSON 6: CREATING AN ANALOG CLOCK"),
          band(84, APPLY),
        ],
      },
      {
        key: "6-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "READING TIME WITH HALVES",
        printedHead: "LESSON 7: READING TIME WITH HALVES",
        bookFrom: 85,
        concepts: [
          lessonHead(85, "LESSON 7: READING TIME WITH HALVES"),
          band(85, REFLECT),
        ],
      },
      {
        key: "6-8",
        ordinal: "Eighth",
        type: LESSON,
        title: "APPLICATIONS ON TIME",
        printedHead: "LESSON 8: APPLICATIONS ON TIME",
        bookFrom: 86,
        concepts: [lessonHead(86, "LESSON 8: APPLICATIONS ON TIME"), band(86, APPLY)],
      },
      {
        key: "6-9",
        ordinal: "Ninth",
        type: LESSON,
        title: "READING TIME IN MINUTES",
        printedHead: "LESSON 9: READING TIME IN MINUTES",
        bookFrom: 87,
        concepts: [
          lessonHead(87, "LESSON 9: READING TIME IN MINUTES"),
          band(87, APPLY),
          band(89, REFLECT),
        ],
      },
      {
        key: "6-10",
        ordinal: "Tenth",
        type: LESSON,
        title: "MORE APPLICATIONS ON TIME",
        printedHead: "LESSON 10: MORE APPLICATIONS ON TIME",
        bookFrom: 90,
        concepts: [
          lessonHead(90, "LESSON 10: MORE APPLICATIONS ON TIME"),
          band(90, APPLY),
          band(91, REFLECT),
        ],
      },
    ],
  },
];

/**
 * The book-page span a lesson owns: from the chapter opener (its first lesson)
 * or its own head page, down to the page before the next lesson starts, bounded
 * by the chapter. A band that recurs on the following page belongs to this
 * lesson, so the ranges tile [5, 91] exactly and no reachable content sits
 * outside a lesson — including the pages the holes swallowed, which stay owned
 * by their lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_MATH_EN_G2_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_EN_G2_T1_UNITS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This term has no
 * appendix: every page of the term belongs to a chapter. Kept as a function so
 * the seeder and the stage share one shape across all the books.
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
  "math-en-g2-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (Only the out-of-term versos need it — every present term page
 * carries text — but the guard is kept so the loader shares one shape across
 * the books.)
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
  return `### Page ${book}\n${text}`;
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
 * The document a lesson grounds the tutor in: its own page range, in order,
 * followed by any appendix pages it points to (none in this book).
 */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(sectionIndex, lessonIndex);
  const lesson = EGYPT_MATH_EN_G2_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(from, to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/** Folds text for comparison: lowercases and removes every non-letter/digit. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring case, spacing and punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints. This book's folio is the number
 * carried by its running footer — `PRIMARY 2 - TERM 1 <n>` or
 * `<n> PRIMARY 2 - TERM 1` — which stands alone on a line. Two footers are
 * split across lines (book 45 prints the words with «45» on the next line,
 * book 68 prints «68» on the line before the words), so a bare digit-less
 * footer line also accepts the bare numeral on the neighbouring line. Every
 * other line is ignored, so body numbers (chart cells, Tens/Ones boxes,
 * answers) can never be mistaken for a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: number[] = [];
  const push = (n: number): void => {
    if (n > 0 && !out.includes(n)) out.push(n);
  };
  lines.forEach((line, i) => {
    let match = line.match(/^PRIMARY\s+2\s*-\s*TERM\s+1\s+(\d+)$/);
    if (match) {
      push(Number(match[1]));
      return;
    }
    match = line.match(/^(\d+)\s+PRIMARY\s+2\s*-\s*TERM\s+1$/);
    if (match) {
      push(Number(match[1]));
      return;
    }
    if (/^PRIMARY\s+2\s*-\s*TERM\s+1$/.test(line)) {
      for (const j of [i - 1, i + 1]) {
        const neighbour = lines[j];
        if (neighbour !== undefined && /^\d+$/.test(neighbour)) push(Number(neighbour));
      }
    }
  });
  return out;
}

/**
 * The book number a content page prints in its running footer, or null. Every
 * present content page carries a footer whose number is exactly its own, which
 * is what fixes the offset; the pages the holes swallowed are listed in
 * `MISSING_SCANS` and never reach this check.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * Folios whose OCR printed a different, still parseable number. This book has
 * none (every surviving folio came out right), so the map is empty and the
 * folio check stays exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * Term pages that print no parseable folio in the text layer, each with the
 * anchor the check accepts in place of a page number. This edition has none:
 * every present term page proves its number from its running footer (split
 * across lines on books 45 and 68, paired explicitly in `footerCandidates`).
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {};

/** Every head kind the table may use: the lesson-head kind plus the band kinds. */
const KNOWN_KINDS = new Set([LESSON, APPLY, REFLECT, CHALLENGE]);

/**
 * Table invariants: lesson keys are unique and follow (chapter-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term with no gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_EN_G2_T1_UNITS;
  const keys = new Set<string>();

  units.forEach((unit, ui) => {
    if (!unit.title.trim()) problems.push(`Section ${unit.key}: no title`);
    if (!unit.printedHead.trim()) problems.push(`Section ${unit.key}: no printed head`);
    if (unit.lessons.length === 0) problems.push(`Section ${unit.title}: no lessons`);

    unit.lessons.forEach((lesson, li) => {
      if (keys.has(lesson.key)) problems.push(`Duplicate lesson key: "${lesson.key}"`);
      keys.add(lesson.key);
      const expectedKey = `${unit.key}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`Section ${unit.key} lesson ${li + 1}: key "${lesson.key}" instead of "${expectedKey}"`);
      }
      if (!lesson.title.trim()) problems.push(`Lesson ${lesson.key}: no title`);
      if (!lesson.printedHead.trim()) problems.push(`Lesson ${lesson.key}: no printed head`);
      if (lesson.concepts.length === 0) problems.push(`Lesson ${lesson.key}: no activities`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`Lesson ${lesson.key}: type "${lesson.type}" does not match first activity`);
      }

      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > unit.bookTo) {
        problems.push(`Lesson ${lesson.key}: start ${lesson.bookFrom} outside section ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((c, ci) => {
        if (!c.title.trim()) problems.push(`Lesson ${lesson.key} activity ${ci + 1}: no title`);
        if (!KNOWN_KINDS.has(c.kind)) {
          problems.push(`Lesson ${lesson.key} activity ${ci + 1}: unknown kind "${c.kind}"`);
        }
        if (c.bookFrom < unit.bookFrom || c.bookFrom > unit.bookTo) {
          problems.push(`Lesson ${lesson.key} activity ${ci + 1}: page ${c.bookFrom} outside section`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && c.bookFrom < prev.bookFrom) {
          problems.push(`Lesson ${lesson.key}: activity pages descend (${prev.bookFrom} then ${c.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`Lesson ${lesson.key}: inverted page range (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`Lesson ${lesson.key}: range ${from}–${to} outside section ${unit.bookFrom}–${unit.bookTo}`);
      }
      const last = lesson.concepts.at(-1)!;
      if (last.bookFrom < from || last.bookFrom > to) {
        problems.push(`Lesson ${lesson.key}: last activity ${last.bookFrom} outside range ${from}–${to}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`Lesson ${lesson.key} overlaps ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`Lesson ${lesson.key}: first lesson must start at section head ${unit.bookFrom}, found ${from}`);
      }
    });

    const nextUnit = units[ui + 1];
    if (nextUnit && unit.bookTo >= nextUnit.bookFrom) {
      problems.push(`Section ${unit.title} overlaps ${nextUnit.title}`);
    } else if (nextUnit && unit.bookTo !== nextUnit.bookFrom - 1) {
      problems.push(`Page gap between ${unit.title} and ${nextUnit.title}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`);
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_MATH_EN_G2_T1_BOOK_START) {
    problems.push(`First section must start at page ${EGYPT_MATH_EN_G2_T1_BOOK_START}, found ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_EN_G2_T1_BOOK_END) {
    problems.push(`Last section must end at page ${EGYPT_MATH_EN_G2_T1_BOOK_END}, found ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every present term page carries real OCR text and proves its book number
 *     from its running footer (the split footers of books 45 and 68 pair
 *     explicitly); the pages in `MISSING_SCANS` carry no text layer at all and
 *     are skipped silently here;
 *  2. every chapter opener prints the chapter head and every surviving
 *     lesson's first page prints that lesson's head (a head on a swallowed
 *     page is proven by the Contents instead and skipped here);
 *  3. every lesson's title and every activity's head is printed on the pages
 *     the lesson owns (the activity on its own page) — except the nine
 *     lessons whose head page the holes swallowed (1-5, 1-6, 1-7, 2-5, 2-6,
 *     4-2, 5-2, 6-3, 6-4), whose titles the Contents proves and whose
 *     surviving Reflect/problem tails never carry lesson titles;
 *  4. every printed page in [5, 91] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR'd
 *     page of the term, i.e. `_BOOK_END - _BOOK_START + 1` minus
 *     `MISSING_SCANS`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_MATH_EN_G2_T1_UNITS;
  const missing = new Set<number>(MISSING_SCANS);

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_EN_G2_T1_BOOK_START || book > EGYPT_MATH_EN_G2_T1_BOOK_END) continue;
    if (missing.has(book)) continue;
    const text = loadBookPage(book);
    pagesChecked += 1;
    if (!text) {
      problems.push(`Book page ${book}: no OCR text`);
      continue;
    }
    printedPages.add(book);

    const anchor = FOLIO_LESS_ANCHORS[book];
    if (anchor !== undefined) {
      if (!normalize(text).includes(normalize(anchor))) {
        problems.push(`Book page ${book}: no printed number and missing anchor "${anchor}"`);
      }
    } else {
      const footer = printedFooter(book);
      if (footer === null) {
        problems.push(`Book page ${book}: no printed number`);
      } else if (footer !== book && FOOTER_OCR_MISREADS[book] !== footer) {
        problems.push(`Book page ${book}: printed number ${footer} does not match`);
      }
    }
  }

  const expectedPages =
    EGYPT_MATH_EN_G2_T1_BOOK_END - EGYPT_MATH_EN_G2_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `Book fabric: ${printedPages.size} pages read between ${EGYPT_MATH_EN_G2_T1_BOOK_START} and ${EGYPT_MATH_EN_G2_T1_BOOK_END}, expected ${expectedPages}`,
    );
  }

  // 2 + 3a. every chapter opener prints the chapter head, every surviving
  // lesson's first page its head, and every lesson's title is printed
  // somewhere in the pages it owns — unless the holes swallowed the head page
  // that carries it, in which case the Contents (scan 4) is its provenance.
  units.forEach((unit, ui) => {
    if (loadBookPage(unit.bookFrom) && !pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`Section ${unit.title}: opener page ${unit.bookFrom} does not print "${unit.printedHead}"`);
    }

    unit.lessons.forEach((lesson, li) => {
      if (loadBookPage(lesson.bookFrom) && !pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`Lesson ${lesson.key}: first page ${lesson.bookFrom} does not print "${lesson.printedHead}"`);
      }
      const { from, to } = lessonBookRange(ui, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.printedHead);
      if (!titlePrinted && !missing.has(lesson.bookFrom)) {
        problems.push(`Lesson ${lesson.key}: title "${lesson.title}" not printed in range ${from}–${to}`);
      }
    });
  });

  // 3b. every surviving activity's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (loadBookPage(c.bookFrom) && !pagePrints(c.bookFrom, c.title)) {
          problems.push(`Lesson ${lesson.key}: activity page ${c.bookFrom} does not print "${c.title}"`);
        }
      });
    });
  });

  // 4. every printed content page is owned by exactly one lesson.
  const owner = new Map<number, string>();
  for (const { key, from, to } of allLessonRanges()) {
    for (let p = from; p <= to; p++) {
      const prev = owner.get(p);
      if (prev) problems.push(`Page ${p} owned by two lessons: ${prev} and ${key}`);
      owner.set(p, key);
    }
  }
  for (let p = EGYPT_MATH_EN_G2_T1_BOOK_START; p <= EGYPT_MATH_EN_G2_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`Page ${p} owned by no lesson`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
