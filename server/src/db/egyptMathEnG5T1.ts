// Primary 5 (الصف الخامس الابتدائي) Mathematics, English-medium, first term,
// Ministry of Education and Technical Education / Discovery Techbook edition
// (cover imprint «2025-2026», 140 scanned pages).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g5-math-en`, subject `math-en` (name "Mathematics"), lesson prefix
// `l-g5-math-en-`, grade `grade-5` (name "Primary 5").
//
// The curriculum tree for the Egypt `eg-g5-math-en` curriculum is rebuilt from
// the Ministry textbook `MATHEMATICS — Primary 5 — Term 1`. This module is
// the single source of truth for its structure: the six printed UNITs of
// the first term, every numbered LESSON inside them (46 in all), and, for
// every lesson, the book's own printed heads — the lesson head plus the
// lesson-flow bands every lesson prints (Learning Targets / Learning Target,
// ACCESS, BUILD, CONNECT, Check Your Understanding, and, in three lessons, a
// HANDS-ON ACTIVITY band with its activity title) — verbatim and with the
// printed page they start on. The self-checks at the bottom prove that
// mapping against the OCR itself, page by page.
//
// This is the English twin of the Arabic `MATHEMATICS — Primary 5 — Term 1`
// (`egyptMathG5T1.ts`): the same six units, the same forty-six lessons, the
// same pagination shifted by the front matter (English offset 8, books 2–131;
// Arabic offset 11, books 2–130). The parent letter (scan 9) states the flow
// itself: «Each lesson has three main sections: ACCESS, BUILD, and CONNECT»,
// with «WRAP-UP, PRACTICE, and CHECK YOUR UNDERSTANDING features».
//
// THE OFFSET IS EIGHT — book page = scan page − 8
// Every content page prints its own folio on its last line, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scans and quoted here: scan 11 prints
// «Lesson 1: Decimals to the Thousandths Place 3» (book 3), scan 15 prints
// «Lesson 2: Place Value Shuffle 7» (book 7), scan 100 prints the bare «92»
// (book 92) and scan 139 prints «Lesson 4: Identifying Numerical Patterns
// 131» (book 131, the term's last page). The readable Contents entries
// (scans 2–3 and 5) list every lesson of units 1–3 and 6 plus unit 5's
// Concept 5.2 at exactly the page its head prints on (3, 7, 11, 15, 17, 20,
// 22, 29, 34, 37, 40, 44, 47, 49, 51, 54, 56, 59, 62, 65, 68, 72, 75, 78,
// 112, 114, 116, 118, 121, 123, 126, 128); scan 4 survived as dot leaders
// only, so the unit-4 lessons and unit-5 lessons 1–9 below are proven from
// their printed «LESSON n» openers instead — see below.
//
// TERM = THE NUMBERED PAGES (books 2–131)
// Scan pages 1–9 are before the term: the cover (1), the printed «Table of
// Contents» (2–5, folios «ii»…«v»), the «FOREWORD» (6, folio «vi») and the
// «Dear Parent/Guardian» letter (7–9, folios «vii»–«ix», which also states
// the lesson flow: ACCESS / BUILD / CONNECT). The term runs from the unit-1
// opener (book 2 = scan 10) to the last page of lesson 6-4 (book 131 =
// scan 135 … scan 139):
// `EGYPT_MATH_EN_G5_T1_BOOK_START` / `_BOOK_END` are exactly those two
// pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` is therefore 131 − 2 + 1 = 130 (no scan of the
// term is missing). Scan page 140 is after the term (the copyright /
// acknowledgments page).
//
// SIX TERM PAGES PRINT NO PARSEABLE FOLIO — EACH HAS A NAMED ANCHOR
// Books 2, 43, 64, 80, 91 and 120 are the video openers of the six units;
// none prints a page number (each ends with the ministry line). Rather than
// weaken the page-number check, all six are exempt from it and anchored on
// the opener video title each page itself prints, named in
// `FOLIO_LESS_ANCHORS` («Place Value Planning», «Grand Egyptian Multiples»,
// «Multiplying Books», «Mastering Division», «Measuring Up», «Calculating
// Meals»). Every other term page proves its number from the last line
// alone — odd pages print «Lesson <n>: <title> | N» (here without the pipe:
// «Lesson 1: Decimals to the Thousandths Place 3»), even pages print a bare
// «N», sometimes with a stray pipe («4 |», «12 |») — so
// `FOOTER_OCR_MISREADS` is empty.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED BANDS
// Every lesson contributes its «LESSON n» head (which carries no colon, so
// heads are stored space-joined, e.g. «LESSON 1 Decimals to the Thousandths
// Place») plus, in page order, «Learning Targets» (plural) or «Learning
// Target» (singular — plural only in lessons 1-1, 1-10, 2-1, 2-3, 2-5, 2-6,
// 2-7, 2-8, 3-4, 4-4, 5-3, 5-5, 5-6, 5-7, 5-12, 6-2 and 6-4), «ACCESS»,
// «BUILD», «CONNECT» and «Check Your Understanding». Three lessons
// additionally print a «HANDS-ON ACTIVITY» band with its activity title
// (4-2 «Winner Takes All», 4-4 «Keep the Leftovers», 5-2 «Make the Greatest
// Product»), kept as one concept at the page where the band first prints;
// its continuation table on the following page (lesson 5-2, book 96) is the
// same activity, not a second concept. «Writing About Math» prompts ride
// with the CONNECT section that prints them and contribute no concept.
// Nothing is invented: every concept title below is a string the book
// itself prints on the page its `bookFrom` names.
//
// TEXT-LAYER QUIRKS RECORDED, NOT WORKED AROUND
// The head lines keep the book's own capitalisation: «Multiplying by a
// 2-digit number using the algorithm», «Using the division algorithm», «The
// relation between division and multiplication», «Multiply decimals using the
// area model» (lowercase as printed). Several heads wrap across two printed
// lines — «Decimals to the Thousandths / Place», «Using the Area Model to /
// Multiply», «Multiplying Decimals through / the Hundredths Place» — and are
// stored single-line; `normalize` drops line breaks, so the title check
// still matches. Book 30 prints its band numbered («4. BUILD»); it is stored
// as «BUILD», which `normalize` still matches.
//
// THE UNIT OPENER RIDES WITH THE FIRST LESSON
// Each unit's first lesson starts at the unit's own opener page (which
// prints «UNIT N» and the video), so `lessonBookRange` starts a unit's
// first lesson at the section head, exactly as the other Egyptian
// Mathematics specs do. The book prints no appendix: every page of the term
// belongs to exactly one lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 8 (verified: book p.131 = scan p.139). */
export const BOOK_TO_PDF_OFFSET = 8;

/** First printed page of the term — the unit-1 opener (scan 10). */
export const EGYPT_MATH_EN_G5_T1_BOOK_START = 2;

/** Last printed page of the term — the last page of lesson 6-4 (scan 139). */
export const EGYPT_MATH_EN_G5_T1_BOOK_END = 131;

/** The scanned pages before the term: cover, contents, foreword, parent letter. */
export const EGYPT_MATH_EN_G5_T1_FRONT_MATTER = { from: 1, to: 9 } as const;

/** The scan after the term: the copyright / acknowledgments page (scan 140). */
export const EGYPT_MATH_EN_G5_T1_BACK_MATTER = { from: 140, to: 140 } as const;

/**
 * The term pages the OCR never produced, as scan pages. All 140 scans are
 * present and every one of the 130 term pages carries text, so there are
 * none; the constant is kept so this module shares the shape of the other
 * Egyptian specs (and so the checker's expected page count subtracts it).
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of a lesson — becomes one concept in the app tree. */
export interface MathEnG5T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: "Lesson" or one of the lesson-flow band words. */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one numbered lesson of a unit). */
export interface MathEnG5T1Lesson {
  /** App-addressable key, e.g. "5-3" (unit 5, lesson 3). */
  key: string;
  /** English ordinal of the lesson number, e.g. "Third". */
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
  concepts: MathEnG5T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a unit — so no lesson below uses it; the
   * field is kept so this module shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed unit of the term (one of the six UNITs). */
export interface MathEnG5T1Unit {
  /** This book's units are its UNITs. */
  kind: "unit";
  /** Internal key: "1"…"6", in book order. */
  key: string;
  /** English ordinal of the unit, e.g. "Third". */
  ordinal: string;
  /** Full app-facing unit title, e.g. "Unit 3: Multiplication with Whole Numbers". */
  title: string;
  /** The unit head its opener prints, verbatim, e.g. "UNIT 3". */
  printedHead: string;
  /** First printed page of the unit (its opener). */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next opener). */
  bookTo: number;
  lessons: MathEnG5T1Lesson[];
}

const LESSON = "Lesson";
const TARGETS = "Learning Targets";
const ACCESS = "ACCESS";
const BUILD = "BUILD";
const HANDS_ON = "HANDS-ON ACTIVITY";
const CONNECT = "CONNECT";
const CHECK = "Check Your Understanding";

const T_TARGETS = "Learning Targets";
const T_TARGET_S = "Learning Target";
const T_ACCESS = "ACCESS";
const T_BUILD = "BUILD";
const T_CONNECT = "CONNECT";
const T_CHECK = "Check Your Understanding";

function concept(bookFrom: number, kind: string, title: string): MathEnG5T1Concept {
  return { bookFrom, kind, title };
}

function lessonHead(bookFrom: number, title: string): MathEnG5T1Concept {
  return concept(bookFrom, LESSON, title);
}

function targets(bookFrom: number, title: string = T_TARGETS): MathEnG5T1Concept {
  return concept(bookFrom, TARGETS, title);
}

function access(bookFrom: number): MathEnG5T1Concept {
  return concept(bookFrom, ACCESS, T_ACCESS);
}

function build(bookFrom: number): MathEnG5T1Concept {
  return concept(bookFrom, BUILD, T_BUILD);
}

function handsOn(bookFrom: number, title: string): MathEnG5T1Concept {
  return concept(bookFrom, HANDS_ON, title);
}

function connect(bookFrom: number): MathEnG5T1Concept {
  return concept(bookFrom, CONNECT, T_CONNECT);
}

function checkUnderstanding(bookFrom: number): MathEnG5T1Concept {
  return concept(bookFrom, CHECK, T_CHECK);
}

/**
 * The six units of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Lesson starts come from the «LESSON n» openers; unit bookTo values are the
 * page before the next unit's video opener.
 */
export const EGYPT_MATH_EN_G5_T1_UNITS: MathEnG5T1Unit[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "First",
    title: "Unit 1: Decimal Place Value and Computation",
    printedHead: "UNIT 1",
    bookFrom: 2,
    bookTo: 42,
    lessons: [
      {
        key: "1-1",
        ordinal: "First",
        type: LESSON,
        title: "Decimals to the Thousandths Place",
        printedHead: "LESSON 1 Decimals to the Thousandths Place",
        bookFrom: 3,
        concepts: [
          lessonHead(3, "LESSON 1 Decimals to the Thousandths Place"),
          targets(3),
          access(3),
          build(4),
          connect(6),
          checkUnderstanding(6),
        ],
      },
      {
        key: "1-2",
        ordinal: "Second",
        type: LESSON,
        title: "Place Value Shuffle",
        printedHead: "LESSON 2 Place Value Shuffle",
        bookFrom: 7,
        concepts: [
          lessonHead(7, "LESSON 2 Place Value Shuffle"),
          targets(7, T_TARGET_S),
          access(7),
          build(7),
          connect(10),
          checkUnderstanding(10),
        ],
      },
      {
        key: "1-3",
        ordinal: "Third",
        type: LESSON,
        title: "Composing and Decomposing Decimals",
        printedHead: "LESSON 3 Composing and Decomposing Decimals",
        bookFrom: 11,
        concepts: [
          lessonHead(11, "LESSON 3 Composing and Decomposing Decimals"),
          targets(11, T_TARGET_S),
          access(11),
          build(12),
          connect(14),
          checkUnderstanding(14),
        ],
      },
      {
        key: "1-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "Comparing Decimals",
        printedHead: "LESSON 4 Comparing Decimals",
        bookFrom: 15,
        concepts: [
          lessonHead(15, "LESSON 4 Comparing Decimals"),
          targets(15, T_TARGET_S),
          access(15),
          build(15),
          connect(16),
          checkUnderstanding(16),
        ],
      },
      {
        key: "1-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "Rounding Decimals",
        printedHead: "LESSON 5 Rounding Decimals",
        bookFrom: 17,
        concepts: [
          lessonHead(17, "LESSON 5 Rounding Decimals"),
          targets(17, T_TARGET_S),
          access(17),
          build(17),
          connect(19),
          checkUnderstanding(19),
        ],
      },
      {
        key: "1-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "Estimating Decimal Sums",
        printedHead: "LESSON 6 Estimating Decimal Sums",
        bookFrom: 20,
        concepts: [
          lessonHead(20, "LESSON 6 Estimating Decimal Sums"),
          targets(20, T_TARGET_S),
          access(20),
          build(20),
          connect(21),
          checkUnderstanding(21),
        ],
      },
      {
        key: "1-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "Modeling Decimal Addition",
        printedHead: "LESSON 7 Modeling Decimal Addition",
        bookFrom: 22,
        concepts: [
          lessonHead(22, "LESSON 7 Modeling Decimal Addition"),
          targets(22, T_TARGET_S),
          access(22),
          build(23),
          connect(28),
          checkUnderstanding(28),
        ],
      },
      {
        key: "1-8",
        ordinal: "Eighth",
        type: LESSON,
        title: "Modeling Decimals Subtraction",
        printedHead: "LESSON 8 Modeling Decimals Subtraction",
        bookFrom: 29,
        concepts: [
          lessonHead(29, "LESSON 8 Modeling Decimals Subtraction"),
          targets(29, T_TARGET_S),
          access(29),
          build(30),
          connect(33),
          checkUnderstanding(33),
        ],
      },
      {
        key: "1-9",
        ordinal: "Ninth",
        type: LESSON,
        title: "Estimating Decimal Differences",
        printedHead: "LESSON 9 Estimating Decimal Differences",
        bookFrom: 34,
        concepts: [
          lessonHead(34, "LESSON 9 Estimating Decimal Differences"),
          targets(34, T_TARGET_S),
          access(34),
          build(34),
          connect(36),
          checkUnderstanding(36),
        ],
      },
      {
        key: "1-10",
        ordinal: "Tenth",
        type: LESSON,
        title: "Subtracting to the Thousandths Place",
        printedHead: "LESSON 10 Subtracting to the Thousandths Place",
        bookFrom: 37,
        concepts: [
          lessonHead(37, "LESSON 10 Subtracting to the Thousandths Place"),
          targets(37),
          access(37),
          build(37),
          connect(39),
          checkUnderstanding(39),
        ],
      },
      {
        key: "1-11",
        ordinal: "Eleventh",
        type: LESSON,
        title: "Decimal Story Problems",
        printedHead: "LESSON 11 Decimal Story Problems",
        bookFrom: 40,
        concepts: [
          lessonHead(40, "LESSON 11 Decimal Story Problems"),
          targets(40, T_TARGET_S),
          access(40),
          build(41),
          connect(42),
          checkUnderstanding(42),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "Second",
    title: "Unit 2: Number Relationships",
    printedHead: "UNIT 2",
    bookFrom: 43,
    bookTo: 63,
    lessons: [
      {
        key: "2-1",
        ordinal: "First",
        type: LESSON,
        title: "Expressions, Equations, and Variables",
        printedHead: "LESSON 1 Expressions, Equations, and Variables",
        bookFrom: 44,
        concepts: [
          lessonHead(44, "LESSON 1 Expressions, Equations, and Variables"),
          targets(44),
          access(44),
          build(45),
          connect(46),
          checkUnderstanding(46),
        ],
      },
      {
        key: "2-2",
        ordinal: "Second",
        type: LESSON,
        title: "Variables in Equations",
        printedHead: "LESSON 2 Variables in Equations",
        bookFrom: 47,
        concepts: [
          lessonHead(47, "LESSON 2 Variables in Equations"),
          targets(47, T_TARGET_S),
          access(47),
          build(47),
          connect(48),
          checkUnderstanding(48),
        ],
      },
      {
        key: "2-3",
        ordinal: "Third",
        type: LESSON,
        title: "Telling Stories with Numbers",
        printedHead: "LESSON 3 Telling Stories with Numbers",
        bookFrom: 49,
        concepts: [
          lessonHead(49, "LESSON 3 Telling Stories with Numbers"),
          targets(49),
          access(49),
          build(49),
          connect(50),
          checkUnderstanding(50),
        ],
      },
      {
        key: "2-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "Prime Factorization",
        printedHead: "LESSON 4 Prime Factorization",
        bookFrom: 51,
        concepts: [
          lessonHead(51, "LESSON 4 Prime Factorization"),
          targets(51, T_TARGET_S),
          access(51),
          build(52),
          connect(53),
          checkUnderstanding(53),
        ],
      },
      {
        key: "2-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "Greatest Common Factors (G.C.F)",
        printedHead: "LESSON 5 Greatest Common Factors (G.C.F)",
        bookFrom: 54,
        concepts: [
          lessonHead(54, "LESSON 5 Greatest Common Factors (G.C.F)"),
          targets(54),
          access(54),
          build(55),
          connect(55),
          checkUnderstanding(55),
        ],
      },
      {
        key: "2-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "Identifying Multiples",
        printedHead: "LESSON 6 Identifying Multiples",
        bookFrom: 56,
        concepts: [
          lessonHead(56, "LESSON 6 Identifying Multiples"),
          targets(56),
          access(56),
          build(57),
          connect(58),
          checkUnderstanding(58),
        ],
      },
      {
        key: "2-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "Least Common Multiple (L.C.M)",
        printedHead: "LESSON 7 Least Common Multiple (L.C.M)",
        bookFrom: 59,
        concepts: [
          lessonHead(59, "LESSON 7 Least Common Multiple (L.C.M)"),
          targets(59),
          access(59),
          build(59),
          connect(61),
          checkUnderstanding(61),
        ],
      },
      {
        key: "2-8",
        ordinal: "Eighth",
        type: LESSON,
        title: "Factors or Multiples?",
        printedHead: "LESSON 8 Factors or Multiples?",
        bookFrom: 62,
        concepts: [
          lessonHead(62, "LESSON 8 Factors or Multiples?"),
          targets(62),
          access(62),
          build(62),
          connect(63),
          checkUnderstanding(63),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "Third",
    title: "Unit 3: Multiplication with Whole Numbers",
    printedHead: "UNIT 3",
    bookFrom: 64,
    bookTo: 79,
    lessons: [
      {
        key: "3-1",
        ordinal: "First",
        type: LESSON,
        title: "Using the Area Model to Multiply",
        printedHead: "LESSON 1 Using the Area Model to Multiply",
        bookFrom: 65,
        concepts: [
          lessonHead(65, "LESSON 1 Using the Area Model to Multiply"),
          targets(65, T_TARGET_S),
          access(65),
          build(66),
          connect(67),
          checkUnderstanding(67),
        ],
      },
      {
        key: "3-2",
        ordinal: "Second",
        type: LESSON,
        title: "The Distributive Property of Multiplication",
        printedHead: "LESSON 2 The Distributive Property of Multiplication",
        bookFrom: 68,
        concepts: [
          lessonHead(68, "LESSON 2 The Distributive Property of Multiplication"),
          targets(68, T_TARGET_S),
          access(68),
          build(68),
          connect(71),
          checkUnderstanding(71),
        ],
      },
      {
        key: "3-3",
        ordinal: "Third",
        type: LESSON,
        title: "Multiplying by a 2-digit number using the algorithm",
        printedHead: "LESSON 3 Multiplying by a 2-digit number using the algorithm",
        bookFrom: 72,
        concepts: [
          lessonHead(72, "LESSON 3 Multiplying by a 2-digit number using the algorithm"),
          targets(72, T_TARGET_S),
          access(72),
          build(72),
          connect(74),
          checkUnderstanding(74),
        ],
      },
      {
        key: "3-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "Multiplying Multi-Digit Numbers",
        printedHead: "LESSON 4 Multiplying Multi-Digit Numbers",
        bookFrom: 75,
        concepts: [
          lessonHead(75, "LESSON 4 Multiplying Multi-Digit Numbers"),
          targets(75),
          access(75),
          build(75),
          connect(77),
          checkUnderstanding(77),
        ],
      },
      {
        key: "3-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "Multiplication Problems in the Real World",
        printedHead: "LESSON 5 Multiplication Problems in the Real World",
        bookFrom: 78,
        concepts: [
          lessonHead(78, "LESSON 5 Multiplication Problems in the Real World"),
          targets(78, T_TARGET_S),
          access(78),
          build(78),
          connect(79),
          checkUnderstanding(79),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "Fourth",
    title: "Unit 4: Division with Whole Numbers",
    printedHead: "UNIT 4",
    bookFrom: 80,
    bookTo: 90,
    lessons: [
      {
        key: "4-1",
        ordinal: "First",
        type: LESSON,
        title: "Dividing Using Area Model",
        printedHead: "LESSON 1 Dividing Using Area Model",
        bookFrom: 81,
        concepts: [
          lessonHead(81, "LESSON 1 Dividing Using Area Model"),
          targets(81, T_TARGET_S),
          access(81),
          build(81),
          connect(82),
          checkUnderstanding(82),
        ],
      },
      {
        key: "4-2",
        ordinal: "Second",
        type: LESSON,
        title: "Estimating Quotients",
        printedHead: "LESSON 2 Estimating Quotients",
        bookFrom: 83,
        concepts: [
          lessonHead(83, "LESSON 2 Estimating Quotients"),
          targets(83, T_TARGET_S),
          access(83),
          build(83),
          handsOn(84, "HANDS-ON ACTIVITY: Winner Takes All"),
          connect(84),
          checkUnderstanding(84),
        ],
      },
      {
        key: "4-3",
        ordinal: "Third",
        type: LESSON,
        title: "Using the division algorithm",
        printedHead: "LESSON 3 Using the division algorithm",
        bookFrom: 85,
        concepts: [
          lessonHead(85, "LESSON 3 Using the division algorithm"),
          targets(85, T_TARGET_S),
          access(85),
          build(85),
          connect(86),
          checkUnderstanding(86),
        ],
      },
      {
        key: "4-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "The relation between division and multiplication",
        printedHead: "LESSON 4 The relation between division and multiplication",
        bookFrom: 87,
        concepts: [
          lessonHead(87, "LESSON 4 The relation between division and multiplication"),
          targets(87),
          access(87),
          build(87),
          handsOn(88, "HANDS-ON ACTIVITY: Keep the Leftovers"),
          connect(88),
          checkUnderstanding(88),
        ],
      },
      {
        key: "4-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "Multistep Story Problems",
        printedHead: "LESSON 5 Multistep Story Problems",
        bookFrom: 89,
        concepts: [
          lessonHead(89, "LESSON 5 Multistep Story Problems"),
          targets(89, T_TARGET_S),
          access(89),
          build(89),
          connect(90),
          checkUnderstanding(90),
        ],
      },
    ],
  },
  {
    key: "5",
    kind: "unit",
    ordinal: "Fifth",
    title: "Unit 5: Multiplication and Division with Decimals",
    printedHead: "UNIT 5",
    bookFrom: 91,
    bookTo: 119,
    lessons: [
      {
        key: "5-1",
        ordinal: "First",
        type: LESSON,
        title: "Multiplying by Powers of Ten",
        printedHead: "LESSON 1 Multiplying by Powers of Ten",
        bookFrom: 92,
        concepts: [
          lessonHead(92, "LESSON 1 Multiplying by Powers of Ten"),
          targets(92, T_TARGET_S),
          access(92),
          build(92),
          connect(94),
          checkUnderstanding(94),
        ],
      },
      {
        key: "5-2",
        ordinal: "Second",
        type: LESSON,
        title: "Multiplying Decimals by Whole Numbers",
        printedHead: "LESSON 2 Multiplying Decimals by Whole Numbers",
        bookFrom: 95,
        concepts: [
          lessonHead(95, "LESSON 2 Multiplying Decimals by Whole Numbers"),
          targets(95, T_TARGET_S),
          access(95),
          build(95),
          handsOn(95, "HANDS-ON ACTIVITY: Make the Greatest Product"),
          connect(96),
          checkUnderstanding(96),
        ],
      },
      {
        key: "5-3",
        ordinal: "Third",
        type: LESSON,
        title: "Multiplying Tenths by Tenths",
        printedHead: "LESSON 3 Multiplying Tenths by Tenths",
        bookFrom: 97,
        concepts: [
          lessonHead(97, "LESSON 3 Multiplying Tenths by Tenths"),
          targets(97),
          access(97),
          build(97),
          connect(98),
          checkUnderstanding(98),
        ],
      },
      {
        key: "5-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "Multiply decimals using the area model",
        printedHead: "LESSON 4 Multiply decimals using the area model",
        bookFrom: 99,
        concepts: [
          lessonHead(99, "LESSON 4 Multiply decimals using the area model"),
          targets(99, T_TARGET_S),
          access(99),
          build(99),
          connect(100),
          checkUnderstanding(100),
        ],
      },
      {
        key: "5-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "Multiplying Decimals through the Hundredths Place",
        printedHead: "LESSON 5 Multiplying Decimals through the Hundredths Place",
        bookFrom: 101,
        concepts: [
          lessonHead(101, "LESSON 5 Multiplying Decimals through the Hundredths Place"),
          targets(101),
          access(101),
          build(101),
          connect(102),
          checkUnderstanding(102),
        ],
      },
      {
        key: "5-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "Multiplying Decimals through the Thousandths Place",
        printedHead: "LESSON 6 Multiplying Decimals through the Thousandths Place",
        bookFrom: 103,
        concepts: [
          lessonHead(103, "LESSON 6 Multiplying Decimals through the Thousandths Place"),
          targets(103),
          access(103),
          build(104),
          connect(104),
          checkUnderstanding(104),
        ],
      },
      {
        key: "5-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "Decimals and the Metric System",
        printedHead: "LESSON 7 Decimals and the Metric System",
        bookFrom: 105,
        concepts: [
          lessonHead(105, "LESSON 7 Decimals and the Metric System"),
          targets(105),
          access(105),
          build(105),
          connect(107),
          checkUnderstanding(107),
        ],
      },
      {
        key: "5-8",
        ordinal: "Eighth",
        type: LESSON,
        title: "Measurement, Decimals, and Powers of Ten",
        printedHead: "LESSON 8 Measurement, Decimals, and Powers of Ten",
        bookFrom: 108,
        concepts: [
          lessonHead(108, "LESSON 8 Measurement, Decimals, and Powers of Ten"),
          targets(108, T_TARGET_S),
          access(108),
          build(108),
          connect(109),
          checkUnderstanding(109),
        ],
      },
      {
        key: "5-9",
        ordinal: "Ninth",
        type: LESSON,
        title: "Solving Multistep Story Problems",
        printedHead: "LESSON 9 Solving Multistep Story Problems",
        bookFrom: 110,
        concepts: [
          lessonHead(110, "LESSON 9 Solving Multistep Story Problems"),
          targets(110, T_TARGET_S),
          access(110),
          build(110),
          connect(111),
          checkUnderstanding(111),
        ],
      },
      {
        key: "5-10",
        ordinal: "Tenth",
        type: LESSON,
        title: "Dividing by Powers of Ten",
        printedHead: "LESSON 10 Dividing by Powers of Ten",
        bookFrom: 112,
        concepts: [
          lessonHead(112, "LESSON 10 Dividing by Powers of Ten"),
          targets(112, T_TARGET_S),
          access(112),
          build(112),
          connect(113),
          checkUnderstanding(113),
        ],
      },
      {
        key: "5-11",
        ordinal: "Eleventh",
        type: LESSON,
        title: "Patterns and Relationships in Powers of Ten",
        printedHead: "LESSON 11 Patterns and Relationships in Powers of Ten",
        bookFrom: 114,
        concepts: [
          lessonHead(114, "LESSON 11 Patterns and Relationships in Powers of Ten"),
          targets(114, T_TARGET_S),
          access(114),
          build(114),
          connect(115),
          checkUnderstanding(115),
        ],
      },
      {
        key: "5-12",
        ordinal: "Twelfth",
        type: LESSON,
        title: "Dividing Decimals by Whole Numbers",
        printedHead: "LESSON 12 Dividing Decimals by Whole Numbers",
        bookFrom: 116,
        concepts: [
          lessonHead(116, "LESSON 12 Dividing Decimals by Whole Numbers"),
          targets(116),
          access(116),
          build(116),
          connect(117),
          checkUnderstanding(117),
        ],
      },
      {
        key: "5-13",
        ordinal: "Thirteenth",
        type: LESSON,
        title: "Dividing Decimals by Decimals",
        printedHead: "LESSON 13 Dividing Decimals by Decimals",
        bookFrom: 118,
        concepts: [
          lessonHead(118, "LESSON 13 Dividing Decimals by Decimals"),
          targets(118, T_TARGET_S),
          access(118),
          build(118),
          connect(119),
          checkUnderstanding(119),
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "unit",
    ordinal: "Sixth",
    title: "Unit 6: Numerical Expressions and Patterns",
    printedHead: "UNIT 6",
    bookFrom: 120,
    bookTo: 131,
    lessons: [
      {
        key: "6-1",
        ordinal: "First",
        type: LESSON,
        title: "Ordering of Mathematical Operations",
        printedHead: "LESSON 1 Ordering of Mathematical Operations",
        bookFrom: 121,
        concepts: [
          lessonHead(121, "LESSON 1 Ordering of Mathematical Operations"),
          targets(121, T_TARGET_S),
          access(121),
          build(121),
          connect(122),
          checkUnderstanding(122),
        ],
      },
      {
        key: "6-2",
        ordinal: "Second",
        type: LESSON,
        title: "Numerical Expressions with Parentheses",
        printedHead: "LESSON 2 Numerical Expressions with Parentheses",
        bookFrom: 123,
        concepts: [
          lessonHead(123, "LESSON 2 Numerical Expressions with Parentheses"),
          targets(123),
          access(123),
          build(123),
          connect(125),
          checkUnderstanding(125),
        ],
      },
      {
        key: "6-3",
        ordinal: "Third",
        type: LESSON,
        title: "Writing Expressions to Represent Scenarios",
        printedHead: "LESSON 3 Writing Expressions to Represent Scenarios",
        bookFrom: 126,
        concepts: [
          lessonHead(126, "LESSON 3 Writing Expressions to Represent Scenarios"),
          targets(126, T_TARGET_S),
          access(126),
          build(126),
          connect(127),
          checkUnderstanding(127),
        ],
      },
      {
        key: "6-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "Identifying Numerical Patterns",
        printedHead: "LESSON 4 Identifying Numerical Patterns",
        bookFrom: 128,
        concepts: [
          lessonHead(128, "LESSON 4 Identifying Numerical Patterns"),
          targets(128),
          access(128),
          build(129),
          connect(131),
          checkUnderstanding(131),
        ],
      },
    ],
  },
];

/**
 * The book-page span a lesson owns: from the unit opener (its first lesson)
 * or its own head page, down to the page before the next lesson starts,
 * bounded by the unit. The folio-less unit openers (books 2, 43, 64, 80, 91
 * and 120) therefore ride with their unit's first lesson, exactly as the
 * other Egyptian Mathematics specs keep openers inside the owning lesson's
 * range.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_MATH_EN_G5_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_EN_G5_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This term has
 * no appendix: every page of the term belongs to a unit. Kept as a function
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
  "math-en-g5-t1",
);

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    return readFileSync(file, "utf8").trim();
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
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(unitIndex, lessonIndex);
  const lesson = EGYPT_MATH_EN_G5_T1_UNITS[unitIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(from, to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/**
 * Folds text for comparison: lowercases and removes every non-letter/digit,
 * so punctuation, spacing and line breaks can never break a match (this is
 * what lets the wrapped heads match their single-line transcription and the
 * numbered «4. BUILD» on book 30 match «BUILD»).
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring case and OCR spacing/punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints. The folio is always the last
 * non-empty line of the page: odd pages print «Lesson <n>: <title> N» (with
 * no pipe in this book), even pages print a bare «N» (sometimes with a
 * trailing pipe: «4 |»), and the six unit openers print no folio at all.
 * Only the last line is read, so exercise answers and table counts on
 * earlier lines can never be mistaken for a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const out: number[] = [];
  const push = (n: number): void => {
    if (Number.isInteger(n) && n > 0 && !out.includes(n)) out.push(n);
  };

  const last = lines[lines.length - 1]!;
  const bare = last.match(/^\|?\s*(\d+)\s*\|?$/);
  if (bare !== null) {
    push(Number(bare[1]));
    return out;
  }
  if (last.includes("Lesson") || (last.includes("Unit") && last.includes("|"))) {
    const trailing = last.match(/(\d+)\s*$/);
    if (trailing !== null) push(Number(trailing[1]));
  }
  return out;
}

/**
 * The book number a content page prints in its footer, or null. Every
 * content page carries a folio that is exactly its own number, which is what
 * fixes the offset; the pages named in `FOLIO_LESS_ANCHORS` carry no
 * parseable folio and are handled there instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * Folios whose OCR printed a different, still parseable number. This book
 * has none: every last-line folio the checker reads came out right, so the
 * map is empty and the folio check stays exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * Term pages that print no parseable folio in the text layer, each with the
 * anchor the check accepts in place of a page number: the six folio-less
 * unit video openers (books 2, 43, 64, 80, 91 and 120), each anchored on its
 * opener video title.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  2: "Place Value Planning",
  43: "Grand Egyptian Multiples",
  64: "Multiplying Books",
  80: "Mastering Division",
  91: "Measuring Up",
  120: "Calculating Meals",
};

/** Every band kind this book prints. */
const KNOWN_KINDS = new Set([LESSON, TARGETS, ACCESS, BUILD, HANDS_ON, CONNECT, CHECK]);

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every
 * range sits inside its unit, concept kinds are known, concept pages rise
 * inside their lesson, the units tile the term without gaps or overlaps, and
 * the first/last units hit the book's own bounds. A content mistake here
 * would quietly ground the tutor on the wrong pages, so it fails loudly
 * instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_EN_G5_T1_UNITS;
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
        problems.push(
          `Lesson ${lesson.key}: start ${lesson.bookFrom} outside section range ${unit.bookFrom}–${unit.bookTo}`,
        );
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
          problems.push(`Lesson ${lesson.key}: activity pages decrease (${prev.bookFrom} then ${c.bookFrom})`);
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
  if (first && first.bookFrom !== EGYPT_MATH_EN_G5_T1_BOOK_START) {
    problems.push(`First section must start at page ${EGYPT_MATH_EN_G5_T1_BOOK_START}, found ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_EN_G5_T1_BOOK_END) {
    problems.push(`Last section must end at page ${EGYPT_MATH_EN_G5_T1_BOOK_END}, found ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from
 *     its printed folio, or, on the six folio-less pages, from the anchor
 *     named in `FOLIO_LESS_ANCHORS`;
 *  2. every unit opener prints the unit head and every lesson's first page
 *     prints that lesson's head;
 *  3. every lesson's title and every band's head is printed on the pages the
 *     lesson owns (the band on its own page);
 *  4. every printed page in [2, 131] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page
 *     of the term the scans prove, i.e. `_BOOK_END - _BOOK_START + 1` minus
 *     `MISSING_SCANS`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_MATH_EN_G5_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_EN_G5_T1_BOOK_START || book > EGYPT_MATH_EN_G5_T1_BOOK_END) continue;
    pagesChecked += 1;
    const text = loadBookPage(book);
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
    EGYPT_MATH_EN_G5_T1_BOOK_END - EGYPT_MATH_EN_G5_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `Book fabric: ${printedPages.size} pages read between ${EGYPT_MATH_EN_G5_T1_BOOK_START} and ${EGYPT_MATH_EN_G5_T1_BOOK_END}, expected ${expectedPages}`,
    );
  }

  // 2 + 3a. every unit opener prints the unit head, every lesson's first
  // page its head, and every lesson's title is printed somewhere in the
  // pages it owns.
  units.forEach((unit, ui) => {
    if (!pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`Section ${unit.title}: opener page ${unit.bookFrom} does not print "${unit.printedHead}"`);
    }

    unit.lessons.forEach((lesson, li) => {
      if (!pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`Lesson ${lesson.key}: first page ${lesson.bookFrom} does not print "${lesson.printedHead}"`);
      }
      const { from, to } = lessonBookRange(ui, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      if (!titlePrinted) {
        problems.push(`Lesson ${lesson.key}: title "${lesson.title}" not printed in range ${from}–${to}`);
      }
    });
  });

  // 3b. every band's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (!pagePrints(c.bookFrom, c.title)) {
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
  for (let p = EGYPT_MATH_EN_G5_T1_BOOK_START; p <= EGYPT_MATH_EN_G5_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`Page ${p} owned by no lesson`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
