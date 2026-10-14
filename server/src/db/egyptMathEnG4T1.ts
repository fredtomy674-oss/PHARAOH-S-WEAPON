// Primary 4 (الصف الرابع الابتدائي) Mathematics, English-medium, first term,
// Ministry of Education and Technical Education / Discovery Techbook edition
// (cover imprint «2025 - 2026», 137 scanned pages).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g4-math-en`, subject `math-en` (name "Mathematics"), lesson prefix
// `l-g4-math-en-`, grade `grade-4` (name "Primary 4").
//
// The curriculum tree for the Egypt `eg-g4-math-en` curriculum is rebuilt from
// the Ministry textbook `MATHEMATICS — Primary 4 — Term 1`. This module is
// the single source of truth for its structure: the eight printed UNITs of
// the first term, every numbered LESSON inside them (50 in all), and, for
// every lesson, the book's own printed heads — the lesson head plus the
// lesson-flow bands every lesson prints (Learning Targets / Learning Target,
// ACCESS, BUILD, CONNECT, Check Your Understanding, and, in seven lessons, a
// HANDS-ON ACTIVITY band with its activity title) — verbatim and with the
// printed page they start on. The self-checks at the bottom prove that
// mapping against the OCR itself, page by page.
//
// This is the English twin of the Arabic `MATHEMATICS — Primary 4 — Term 1`
// (`egyptMathG4T1.ts`) and the French `MATHÉMATIQUES — 4ème primaire`
// (`egyptMathFrG4T1.ts`): the same eight units, the same fifty lessons, the
// same pagination. The parent letter (scan 9) states the flow itself: «Each
// lesson has three main sections: ACCESS, BUILD, and CONNECT», opened by
// «Learning Targets» and closed by the «Check Your Understanding» box.
//
// THE OFFSET IS EIGHT — book page = scan page − 8
// Every content page prints its own folio on its last line, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scans and quoted here: scan 11 prints
// «Lesson 1: Big Numbers | 3» (book 3), scan 13 prints «Lesson 2: Changing
// Place Values | 5» (book 5), scan 119 prints «Lesson 6: Exploring
// Remainders | 111» (book 111) and scan 135 prints «Lesson 2: The Order of
// Operations and Story Problems | 127» (book 127, the term's last page). The
// readable Contents entries (scan 5: Units 6–8) list every lesson at exactly
// the page its head prints on (86, 88, 91, 93, 95, 97, 100, 102, 104, 107,
// 109, 111, 113, 116, 117, 119, 121, 124, 126); scans 3–4 captured only dot
// leaders, so the heads below rule everywhere.
//
// TERM = THE NUMBERED PAGES (books 3–127)
// Scan pages 1–10 are before the term: the cover (1), the copyright page (2,
// folio «ii»), the printed «Table of Contents» (3–5, folio «v» on scan 5),
// a blank verso (6, folio «vi»), the «FOREWORD» (7, folio «vii»), the
// «Dear Parent/Guardian» letter (8–9, folios «viii»–«ix», which also states
// the lesson flow: ACCESS / BUILD / CONNECT) and the Unit-1 video page (10).
// The term runs from the lesson 1-1 opener (book 3 = scan 11) to the last
// page of lesson 8-2 (book 127 = scan 135):
// `EGYPT_MATH_EN_G4_T1_BOOK_START` / `_BOOK_END` are exactly those two
// pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` is therefore 127 − 3 + 1 = 125 (no scan of the
// term is missing). Scan pages 136–137 are after the term (the print-specs
// table and the back cover).
//
// SIX TERM PAGES PRINT NO PARSEABLE FOLIO — EACH HAS A NAMED ANCHOR
// Books 23, 39, 58, 70 and 123 are the video openers of units 2, 3, 4, 5
// and 8; none prints a page number (the numerals they carry are quick codes
// such as egm4050 and theme numbers). Book 53, the lesson 3-6 opener, lost
// its footer to a truncated OCR capture (the text ends mid-BUILD with «…»
// and the digits «53» appear nowhere on the page). Rather than weaken the
// page-number check, all six are exempt from it and anchored on a string the
// page itself prints, named in `FOLIO_LESS_ANCHORS` (the five video titles
// plus «So Many Strategies»). The unit 6 and 7 openers DO print folios
// («Unit 6: Factors and Multiples | 85» on book 85, «Unit 7: Multiplication
// and Division: Computation and Relationships | 99» on book 99), so they need
// no anchor. Every other term page proves its number from the last line
// alone — odd pages print «Lesson <n>: <title> | N» (book 51 prints the
// number with no pipe: «Lesson 5: Elapsed Time 51»), even pages print a
// bare «N», sometimes with a stray pipe («24 |», «| 30» is never printed;
// the bare forms seen are «N» and «N |») — so `FOOTER_OCR_MISREADS` is
// empty.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED BANDS
// Every lesson contributes its «LESSON n» head (which carries no colon, so
// heads are stored space-joined, e.g. «LESSON 1 Big Numbers») plus, in page
// order, «Learning Targets» (plural) or «Learning Target» (singular, in
// lessons 1-3, 1-4, 1-5, 2-1, 2-3, 4-3, 5-3, 5-7, 6-5, 7-3, 7-7, 7-8, 7-9
// and 8-1 — the same fourteen lessons that print the singular in the Arabic
// twin), «ACCESS», «BUILD», «CONNECT» and «Check Your Understanding».
// Seven lessons additionally print a «HANDS-ON ACTIVITY» band with its
// activity title (1-1 «Creating Big Numbers», 1-3 «Creating the Greatest»,
// 1-6 «Number Battle», 4-4 «Making Crazy Shapes», 5-1 «Visualizing
// Multiplicative Comparison with Diagrams», 5-4 «Arrays and the Commutative
// Property», 7-7 «Division Array Game»), kept as one concept at the page
// where the band first prints; its continuation table on the following page
// (lessons 1-6, 5-4, 7-7) is the same activity, not a second concept.
// Mentions of practice inside exercise text («Area Practice», «practice
// reading large numbers») are body text, not bands, and contribute no
// concept. Nothing is invented: every concept title below is a string the
// book itself prints on the page its `bookFrom` names.
//
// TEXT-LAYER QUIRKS RECORDED, NOT WORKED AROUND
// The head lines keep the book's own capitalisation: «Finding perimeter»,
// «Finding area», «Measuring length», «Applications of measurement 1/2»,
// «Multiply by a one-Digit Number», «Relationships between Factors and
// Multiples» (lowercase as printed). Three heads wrap across two printed
// lines — «Comparing Numbers in / Multiple Forms», «Solving Multistep Story
// Problems / with Addition and Subtraction», «Creating/Solving
// Multiplicative / Comparison Equations», «Commutative Property / of
// Multiplication», «Identifying Multiples of Whole / Numbers»,
// «Multiply a Two-Digit Number by a / Multiple of 10» — and are stored
// single-line; `normalize` drops line breaks, so the title check still
// matches. Scan 17 renders the BUILD band lowercase («build»); it is stored
// as «BUILD», which `normalize` still matches.
//
// THE UNIT OPENER RIDES WITH THE FIRST LESSON
// Each unit's first lesson starts at the unit's own opener page (which
// prints «UNIT N» and the video), so `lessonBookRange` starts a unit's
// first lesson at the section head, exactly as the other Egyptian
// Mathematics specs do. (Unit 1's opener is scan 10, i.e. front matter, so
// lesson 1-1 starts at its own head page.) The book prints no appendix:
// every page of the term belongs to exactly one lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 8 (verified: book p.127 = scan p.135). */
export const BOOK_TO_PDF_OFFSET = 8;

/** First printed page of the term — the lesson 1-1 opener (scan 11). */
export const EGYPT_MATH_EN_G4_T1_BOOK_START = 3;

/** Last printed page of the term — the last page of lesson 8-2 (scan 135). */
export const EGYPT_MATH_EN_G4_T1_BOOK_END = 127;

/** The scanned pages before the term: cover, copyright, contents, blank, foreword, parent letter, Unit-1 video. */
export const EGYPT_MATH_EN_G4_T1_FRONT_MATTER = { from: 1, to: 10 } as const;

/** The scans after the term: the print-specs table (scan 136) and the back cover (scan 137). */
export const EGYPT_MATH_EN_G4_T1_BACK_MATTER = { from: 136, to: 137 } as const;

/**
 * The term pages the OCR never produced, as scan pages. All 137 scans are
 * present and every one of the 125 term pages carries text, so there are
 * none; the constant is kept so this module shares the shape of the other
 * Egyptian specs (and so the checker's expected page count subtracts it).
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of a lesson — becomes one concept in the app tree. */
export interface MathEnG4T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: "Lesson" or one of the lesson-flow band words. */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one numbered lesson of a unit). */
export interface MathEnG4T1Lesson {
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
  concepts: MathEnG4T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a unit — so no lesson below uses it; the
   * field is kept so this module shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed unit of the term (one of the eight UNITs). */
export interface MathEnG4T1Unit {
  /** This book's units are its UNITs. */
  kind: "unit";
  /** Internal key: "1"…"8", in book order. */
  key: string;
  /** English ordinal of the unit, e.g. "Third". */
  ordinal: string;
  /** Full app-facing unit title, e.g. "Unit 3: Concepts of Measurement". */
  title: string;
  /** The unit head its opener prints, verbatim, e.g. "UNIT 3". */
  printedHead: string;
  /** First printed page of the unit (its opener). */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next opener). */
  bookTo: number;
  lessons: MathEnG4T1Lesson[];
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

function concept(bookFrom: number, kind: string, title: string): MathEnG4T1Concept {
  return { bookFrom, kind, title };
}

function lessonHead(bookFrom: number, title: string): MathEnG4T1Concept {
  return concept(bookFrom, LESSON, title);
}

function targets(bookFrom: number, title: string = T_TARGETS): MathEnG4T1Concept {
  return concept(bookFrom, TARGETS, title);
}

function access(bookFrom: number): MathEnG4T1Concept {
  return concept(bookFrom, ACCESS, T_ACCESS);
}

function build(bookFrom: number): MathEnG4T1Concept {
  return concept(bookFrom, BUILD, T_BUILD);
}

function handsOn(bookFrom: number, title: string): MathEnG4T1Concept {
  return concept(bookFrom, HANDS_ON, title);
}

function connect(bookFrom: number): MathEnG4T1Concept {
  return concept(bookFrom, CONNECT, T_CONNECT);
}

function checkUnderstanding(bookFrom: number): MathEnG4T1Concept {
  return concept(bookFrom, CHECK, T_CHECK);
}

/**
 * The eight units of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Lesson starts come from the «LESSON n» openers; unit bookTo values are the
 * page before the next unit's video opener.
 */
export const EGYPT_MATH_EN_G4_T1_UNITS: MathEnG4T1Unit[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "First",
    title: "Unit 1: Place Value",
    printedHead: "UNIT 1",
    bookFrom: 3,
    bookTo: 22,
    lessons: [
      {
        key: "1-1",
        ordinal: "First",
        type: LESSON,
        title: "Big Numbers",
        printedHead: "LESSON 1 Big Numbers",
        bookFrom: 3,
        concepts: [
          lessonHead(3, "LESSON 1 Big Numbers"),
          targets(3),
          access(3),
          build(3),
          handsOn(4, "HANDS-ON ACTIVITY: Creating Big Numbers"),
          connect(4),
          checkUnderstanding(4),
        ],
      },
      {
        key: "1-2",
        ordinal: "Second",
        type: LESSON,
        title: "Changing Place Values",
        printedHead: "LESSON 2 Changing Place Values",
        bookFrom: 5,
        concepts: [
          lessonHead(5, "LESSON 2 Changing Place Values"),
          targets(5),
          access(5),
          build(5),
          connect(6),
          checkUnderstanding(6),
        ],
      },
      {
        key: "1-3",
        ordinal: "Third",
        type: LESSON,
        title: "Many Forms to Write Numbers",
        printedHead: "LESSON 3 Many Forms to Write Numbers",
        bookFrom: 7,
        concepts: [
          lessonHead(7, "LESSON 3 Many Forms to Write Numbers"),
          targets(7, T_TARGET_S),
          access(7),
          build(7),
          handsOn(8, "HANDS-ON ACTIVITY: Creating the Greatest"),
          connect(8),
          checkUnderstanding(8),
        ],
      },
      {
        key: "1-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "Composing and Decomposing",
        printedHead: "LESSON 4 Composing and Decomposing",
        bookFrom: 9,
        concepts: [
          lessonHead(9, "LESSON 4 Composing and Decomposing"),
          targets(9, T_TARGET_S),
          access(9),
          build(9),
          connect(11),
          checkUnderstanding(11),
        ],
      },
      {
        key: "1-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "Comparing Big Numbers",
        printedHead: "LESSON 5 Comparing Big Numbers",
        bookFrom: 12,
        concepts: [
          lessonHead(12, "LESSON 5 Comparing Big Numbers"),
          targets(12, T_TARGET_S),
          access(12),
          build(12),
          connect(13),
          checkUnderstanding(13),
        ],
      },
      {
        key: "1-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "Comparing Numbers in Multiple Forms",
        printedHead: "LESSON 6 Comparing Numbers in Multiple Forms",
        bookFrom: 14,
        concepts: [
          lessonHead(14, "LESSON 6 Comparing Numbers in Multiple Forms"),
          targets(14),
          access(14),
          build(14),
          handsOn(15, "HANDS-ON ACTIVITY: Number Battle"),
          connect(16),
          checkUnderstanding(16),
        ],
      },
      {
        key: "1-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "Descending and Ascending Numbers",
        printedHead: "LESSON 7 Descending and Ascending Numbers",
        bookFrom: 17,
        concepts: [
          lessonHead(17, "LESSON 7 Descending and Ascending Numbers"),
          targets(17),
          access(17),
          build(17),
          connect(19),
          checkUnderstanding(19),
        ],
      },
      {
        key: "1-8",
        ordinal: "Eighth",
        type: LESSON,
        title: "Rounding Rules",
        printedHead: "LESSON 8 Rounding Rules",
        bookFrom: 20,
        concepts: [
          lessonHead(20, "LESSON 8 Rounding Rules"),
          targets(20),
          access(20),
          build(20),
          connect(22),
          checkUnderstanding(22),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "Second",
    title: "Unit 2: Addition and Subtraction Strategies",
    printedHead: "UNIT 2",
    bookFrom: 23,
    bookTo: 38,
    lessons: [
      {
        key: "2-1",
        ordinal: "First",
        type: LESSON,
        title: "Properties of Addition",
        printedHead: "LESSON 1 Properties of Addition",
        bookFrom: 24,
        concepts: [
          lessonHead(24, "LESSON 1 Properties of Addition"),
          targets(24, T_TARGET_S),
          access(24),
          build(24),
          connect(26),
          checkUnderstanding(26),
        ],
      },
      {
        key: "2-2",
        ordinal: "Second",
        type: LESSON,
        title: "Addition with Regrouping",
        printedHead: "LESSON 2 Addition with Regrouping",
        bookFrom: 27,
        concepts: [
          lessonHead(27, "LESSON 2 Addition with Regrouping"),
          targets(27),
          access(27),
          build(28),
          connect(28),
          checkUnderstanding(28),
        ],
      },
      {
        key: "2-3",
        ordinal: "Third",
        type: LESSON,
        title: "Subtraction with Regrouping",
        printedHead: "LESSON 3 Subtraction with Regrouping",
        bookFrom: 29,
        concepts: [
          lessonHead(29, "LESSON 3 Subtraction with Regrouping"),
          targets(29, T_TARGET_S),
          access(29),
          build(30),
          connect(31),
          checkUnderstanding(31),
        ],
      },
      {
        key: "2-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "Bar Models, Variables, and Story Problems",
        printedHead: "LESSON 4 Bar Models, Variables, and Story Problems",
        bookFrom: 32,
        concepts: [
          lessonHead(32, "LESSON 4 Bar Models, Variables, and Story Problems"),
          targets(32),
          access(32),
          build(32),
          connect(34),
          checkUnderstanding(34),
        ],
      },
      {
        key: "2-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "Solving Multistep Story Problems with Addition and Subtraction",
        printedHead: "LESSON 5 Solving Multistep Story Problems with Addition and Subtraction",
        bookFrom: 35,
        concepts: [
          lessonHead(35, "LESSON 5 Solving Multistep Story Problems with Addition and Subtraction"),
          targets(35),
          access(35),
          build(35),
          connect(38),
          checkUnderstanding(38),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "Third",
    title: "Unit 3: Concepts of Measurement",
    printedHead: "UNIT 3",
    bookFrom: 39,
    bookTo: 57,
    lessons: [
      {
        key: "3-1",
        ordinal: "First",
        type: LESSON,
        title: "Measuring length",
        printedHead: "LESSON 1 Measuring length",
        bookFrom: 40,
        concepts: [
          lessonHead(40, "LESSON 1 Measuring length"),
          targets(40),
          access(40),
          build(40),
          connect(42),
          checkUnderstanding(42),
        ],
      },
      {
        key: "3-2",
        ordinal: "Second",
        type: LESSON,
        title: "Measuring Mass",
        printedHead: "LESSON 2 Measuring Mass",
        bookFrom: 43,
        concepts: [
          lessonHead(43, "LESSON 2 Measuring Mass"),
          targets(43),
          access(43),
          build(43),
          connect(44),
          checkUnderstanding(44),
        ],
      },
      {
        key: "3-3",
        ordinal: "Third",
        type: LESSON,
        title: "Units of Capacity",
        printedHead: "LESSON 3 Units of Capacity",
        bookFrom: 45,
        concepts: [
          lessonHead(45, "LESSON 3 Units of Capacity"),
          targets(45),
          access(45),
          build(45),
          connect(47),
          checkUnderstanding(47),
        ],
      },
      {
        key: "3-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "Units of Measuring Time",
        printedHead: "LESSON 4 Units of Measuring Time",
        bookFrom: 48,
        concepts: [
          lessonHead(48, "LESSON 4 Units of Measuring Time"),
          targets(48),
          access(48),
          build(48),
          connect(49),
          checkUnderstanding(49),
        ],
      },
      {
        key: "3-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "Elapsed Time",
        printedHead: "LESSON 5 Elapsed Time",
        bookFrom: 50,
        concepts: [
          lessonHead(50, "LESSON 5 Elapsed Time"),
          targets(50),
          access(50),
          build(51),
          connect(52),
          checkUnderstanding(52),
        ],
      },
      {
        key: "3-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "Applications of measurement 1",
        printedHead: "LESSON 6 Applications of measurement 1",
        bookFrom: 53,
        concepts: [
          lessonHead(53, "LESSON 6 Applications of measurement 1"),
          targets(53),
          access(53),
          build(53),
          connect(55),
          checkUnderstanding(55),
        ],
      },
      {
        key: "3-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "Applications of measurement 2",
        printedHead: "LESSON 7 Applications of measurement 2",
        bookFrom: 56,
        concepts: [
          lessonHead(56, "LESSON 7 Applications of measurement 2"),
          targets(56),
          access(56),
          build(56),
          connect(57),
          checkUnderstanding(57),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "Fourth",
    title: "Unit 4: Area and Perimeter",
    printedHead: "UNIT 4",
    bookFrom: 58,
    bookTo: 69,
    lessons: [
      {
        key: "4-1",
        ordinal: "First",
        type: LESSON,
        title: "Finding perimeter",
        printedHead: "LESSON 1 Finding perimeter",
        bookFrom: 59,
        concepts: [
          lessonHead(59, "LESSON 1 Finding perimeter"),
          targets(59),
          access(59),
          build(59),
          connect(61),
          checkUnderstanding(61),
        ],
      },
      {
        key: "4-2",
        ordinal: "Second",
        type: LESSON,
        title: "Finding area",
        printedHead: "LESSON 2 Finding area",
        bookFrom: 62,
        concepts: [
          lessonHead(62, "LESSON 2 Finding area"),
          targets(62),
          access(62),
          build(62),
          connect(63),
          checkUnderstanding(63),
        ],
      },
      {
        key: "4-3",
        ordinal: "Third",
        type: LESSON,
        title: "Unknown Dimensions",
        printedHead: "LESSON 3 Unknown Dimensions",
        bookFrom: 64,
        concepts: [
          lessonHead(64, "LESSON 3 Unknown Dimensions"),
          targets(64, T_TARGET_S),
          access(64),
          build(64),
          connect(65),
          checkUnderstanding(65),
        ],
      },
      {
        key: "4-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "Complex Shapes",
        printedHead: "LESSON 4 Complex Shapes",
        bookFrom: 66,
        concepts: [
          lessonHead(66, "LESSON 4 Complex Shapes"),
          targets(66),
          access(66),
          handsOn(66, "HANDS-ON ACTIVITY: Making Crazy Shapes"),
          build(67),
          connect(69),
          checkUnderstanding(69),
        ],
      },
    ],
  },
  {
    key: "5",
    kind: "unit",
    ordinal: "Fifth",
    title: "Unit 5: Multiplication as a Relationship",
    printedHead: "UNIT 5",
    bookFrom: 70,
    bookTo: 84,
    lessons: [
      {
        key: "5-1",
        ordinal: "First",
        type: LESSON,
        title: "Multiplicative Comparison",
        printedHead: "LESSON 1 Multiplicative Comparison",
        bookFrom: 71,
        concepts: [
          lessonHead(71, "LESSON 1 Multiplicative Comparison"),
          targets(71),
          access(71),
          build(71),
          handsOn(71, "HANDS-ON ACTIVITY: Visualizing Multiplicative Comparison with Diagrams"),
          connect(72),
          checkUnderstanding(72),
        ],
      },
      {
        key: "5-2",
        ordinal: "Second",
        type: LESSON,
        title: "Creating Multiplicative Comparison Equations",
        printedHead: "LESSON 2 Creating Multiplicative Comparison Equations",
        bookFrom: 73,
        concepts: [
          lessonHead(73, "LESSON 2 Creating Multiplicative Comparison Equations"),
          targets(73),
          access(73),
          build(74),
          connect(74),
          checkUnderstanding(74),
        ],
      },
      {
        key: "5-3",
        ordinal: "Third",
        type: LESSON,
        title: "Solving Multiplicative Comparison Equations",
        printedHead: "LESSON 3 Solving Multiplicative Comparison Equations",
        bookFrom: 75,
        concepts: [
          lessonHead(75, "LESSON 3 Solving Multiplicative Comparison Equations"),
          targets(75, T_TARGET_S),
          access(75),
          build(75),
          connect(76),
          checkUnderstanding(76),
        ],
      },
      {
        key: "5-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "Commutative Property of Multiplication",
        printedHead: "LESSON 4 Commutative Property of Multiplication",
        bookFrom: 77,
        concepts: [
          lessonHead(77, "LESSON 4 Commutative Property of Multiplication"),
          targets(77),
          access(77),
          build(77),
          handsOn(77, "HANDS-ON ACTIVITY: Arrays and the Commutative Property"),
          connect(78),
          checkUnderstanding(78),
        ],
      },
      {
        key: "5-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "Identity Property and the Zero Property",
        printedHead: "LESSON 5 Identity Property and the Zero Property",
        bookFrom: 79,
        concepts: [
          lessonHead(79, "LESSON 5 Identity Property and the Zero Property"),
          targets(79),
          access(79),
          build(79),
          connect(80),
          checkUnderstanding(80),
        ],
      },
      {
        key: "5-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "Associative Property of Multiplication",
        printedHead: "LESSON 6 Associative Property of Multiplication",
        bookFrom: 81,
        concepts: [
          lessonHead(81, "LESSON 6 Associative Property of Multiplication"),
          targets(81),
          access(81),
          build(81),
          connect(82),
          checkUnderstanding(82),
        ],
      },
      {
        key: "5-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "Applying Patterns in Multiplication",
        printedHead: "LESSON 7 Applying Patterns in Multiplication",
        bookFrom: 83,
        concepts: [
          lessonHead(83, "LESSON 7 Applying Patterns in Multiplication"),
          targets(83, T_TARGET_S),
          access(83),
          build(83),
          connect(84),
          checkUnderstanding(84),
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "unit",
    ordinal: "Sixth",
    title: "Unit 6: Factors and Multiples",
    printedHead: "UNIT 6",
    bookFrom: 85,
    bookTo: 98,
    lessons: [
      {
        key: "6-1",
        ordinal: "First",
        type: LESSON,
        title: "Identifying Factors of Whole Numbers",
        printedHead: "LESSON 1 Identifying Factors of Whole Numbers",
        bookFrom: 86,
        concepts: [
          lessonHead(86, "LESSON 1 Identifying Factors of Whole Numbers"),
          targets(86),
          access(86),
          build(86),
          connect(87),
          checkUnderstanding(87),
        ],
      },
      {
        key: "6-2",
        ordinal: "Second",
        type: LESSON,
        title: "Prime and Composite Numbers",
        printedHead: "LESSON 2 Prime and Composite Numbers",
        bookFrom: 88,
        concepts: [
          lessonHead(88, "LESSON 2 Prime and Composite Numbers"),
          targets(88),
          access(88),
          build(88),
          connect(90),
          checkUnderstanding(90),
        ],
      },
      {
        key: "6-3",
        ordinal: "Third",
        type: LESSON,
        title: "Greatest Common Factor G.C.F",
        printedHead: "LESSON 3 Greatest Common Factor G.C.F",
        bookFrom: 91,
        concepts: [
          lessonHead(91, "LESSON 3 Greatest Common Factor G.C.F"),
          targets(91),
          access(91),
          build(91),
          connect(92),
          checkUnderstanding(92),
        ],
      },
      {
        key: "6-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "Identifying Multiples of Whole Numbers",
        printedHead: "LESSON 4 Identifying Multiples of Whole Numbers",
        bookFrom: 93,
        concepts: [
          lessonHead(93, "LESSON 4 Identifying Multiples of Whole Numbers"),
          targets(93),
          access(93),
          build(94),
          connect(94),
          checkUnderstanding(94),
        ],
      },
      {
        key: "6-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "Common Multiples",
        printedHead: "LESSON 5 Common Multiples",
        bookFrom: 95,
        concepts: [
          lessonHead(95, "LESSON 5 Common Multiples"),
          targets(95, T_TARGET_S),
          access(95),
          build(95),
          connect(96),
          checkUnderstanding(96),
        ],
      },
      {
        key: "6-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "Relationships between Factors and Multiples",
        printedHead: "LESSON 6 Relationships between Factors and Multiples",
        bookFrom: 97,
        concepts: [
          lessonHead(97, "LESSON 6 Relationships between Factors and Multiples"),
          targets(97),
          access(97),
          build(97),
          connect(98),
          checkUnderstanding(98),
        ],
      },
    ],
  },
  {
    key: "7",
    kind: "unit",
    ordinal: "Seventh",
    title: "Unit 7: Multiplication and Division: Computation and Relationships",
    printedHead: "UNIT 7",
    bookFrom: 99,
    bookTo: 122,
    lessons: [
      {
        key: "7-1",
        ordinal: "First",
        type: LESSON,
        title: "The Area Model Strategy",
        printedHead: "LESSON 1 The Area Model Strategy",
        bookFrom: 100,
        concepts: [
          lessonHead(100, "LESSON 1 The Area Model Strategy"),
          targets(100),
          access(100),
          build(100),
          connect(101),
          checkUnderstanding(101),
        ],
      },
      {
        key: "7-2",
        ordinal: "Second",
        type: LESSON,
        title: "The Distributive Property",
        printedHead: "LESSON 2 The Distributive Property",
        bookFrom: 102,
        concepts: [
          lessonHead(102, "LESSON 2 The Distributive Property"),
          targets(102),
          access(102),
          build(102),
          connect(103),
          checkUnderstanding(103),
        ],
      },
      {
        key: "7-3",
        ordinal: "Third",
        type: LESSON,
        title: "The Partial Products Algorithm",
        printedHead: "LESSON 3 The Partial Products Algorithm",
        bookFrom: 104,
        concepts: [
          lessonHead(104, "LESSON 3 The Partial Products Algorithm"),
          targets(104, T_TARGET_S),
          access(104),
          build(104),
          connect(106),
          checkUnderstanding(106),
        ],
      },
      {
        key: "7-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "Multiply by a one-Digit Number",
        printedHead: "LESSON 4 Multiply by a one-Digit Number",
        bookFrom: 107,
        concepts: [
          lessonHead(107, "LESSON 4 Multiply by a one-Digit Number"),
          targets(107),
          access(107),
          build(107),
          connect(108),
          checkUnderstanding(108),
        ],
      },
      {
        key: "7-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "Multiply a Two-Digit Number by a Multiple of 10",
        printedHead: "LESSON 5 Multiply a Two-Digit Number by a Multiple of 10",
        bookFrom: 109,
        concepts: [
          lessonHead(109, "LESSON 5 Multiply a Two-Digit Number by a Multiple of 10"),
          targets(109),
          access(109),
          build(109),
          connect(110),
          checkUnderstanding(110),
        ],
      },
      {
        key: "7-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "Exploring Remainders",
        printedHead: "LESSON 6 Exploring Remainders",
        bookFrom: 111,
        concepts: [
          lessonHead(111, "LESSON 6 Exploring Remainders"),
          targets(111),
          access(111),
          build(111),
          connect(112),
          checkUnderstanding(112),
        ],
      },
      {
        key: "7-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "Patterns in Division",
        printedHead: "LESSON 7 Patterns in Division",
        bookFrom: 113,
        concepts: [
          lessonHead(113, "LESSON 7 Patterns in Division"),
          targets(113, T_TARGET_S),
          access(113),
          handsOn(113, "HANDS-ON ACTIVITY: Division Array Game"),
          build(114),
          connect(115),
          checkUnderstanding(115),
        ],
      },
      {
        key: "7-8",
        ordinal: "Eighth",
        type: LESSON,
        title: "The Area Model and Division",
        printedHead: "LESSON 8 The Area Model and Division",
        bookFrom: 116,
        concepts: [
          lessonHead(116, "LESSON 8 The Area Model and Division"),
          targets(116, T_TARGET_S),
          access(116),
          build(116),
          connect(116),
          checkUnderstanding(116),
        ],
      },
      {
        key: "7-9",
        ordinal: "Ninth",
        type: LESSON,
        title: "The Partial Quotients Algorithm",
        printedHead: "LESSON 9 The Partial Quotients Algorithm",
        bookFrom: 117,
        concepts: [
          lessonHead(117, "LESSON 9 The Partial Quotients Algorithm"),
          targets(117, T_TARGET_S),
          access(117),
          build(117),
          connect(118),
          checkUnderstanding(118),
        ],
      },
      {
        key: "7-10",
        ordinal: "Tenth",
        type: LESSON,
        title: "The Standard Division Algorithm",
        printedHead: "LESSON 10 The Standard Division Algorithm",
        bookFrom: 119,
        concepts: [
          lessonHead(119, "LESSON 10 The Standard Division Algorithm"),
          targets(119),
          access(119),
          build(119),
          connect(120),
          checkUnderstanding(120),
        ],
      },
      {
        key: "7-11",
        ordinal: "Eleventh",
        type: LESSON,
        title: "Division and Multiplication",
        printedHead: "LESSON 11 Division and Multiplication",
        bookFrom: 121,
        concepts: [
          lessonHead(121, "LESSON 11 Division and Multiplication"),
          targets(121),
          access(121),
          build(121),
          connect(122),
          checkUnderstanding(122),
        ],
      },
    ],
  },
  {
    key: "8",
    kind: "unit",
    ordinal: "Eighth",
    title: "Unit 8: Order of Operations",
    printedHead: "UNIT 8",
    bookFrom: 123,
    bookTo: 127,
    lessons: [
      {
        key: "8-1",
        ordinal: "First",
        type: LESSON,
        title: "Order of Operations",
        printedHead: "LESSON 1 Order of Operations",
        bookFrom: 124,
        concepts: [
          lessonHead(124, "LESSON 1 Order of Operations"),
          targets(124, T_TARGET_S),
          access(124),
          build(124),
          connect(125),
          checkUnderstanding(125),
        ],
      },
      {
        key: "8-2",
        ordinal: "Second",
        type: LESSON,
        title: "The Order of Operations and Story Problems",
        printedHead: "LESSON 2 The Order of Operations and Story Problems",
        bookFrom: 126,
        concepts: [
          lessonHead(126, "LESSON 2 The Order of Operations and Story Problems"),
          targets(126),
          access(126),
          build(126),
          connect(127),
          checkUnderstanding(127),
        ],
      },
    ],
  },
];

/**
 * The book-page span a lesson owns: from the unit opener (its first lesson)
 * or its own head page, down to the page before the next lesson starts,
 * bounded by the unit. The folio-less unit openers (books 23, 39, 58, 70,
 * 123) therefore ride with their unit's first lesson, exactly as the other
 * Egyptian Mathematics specs keep openers inside the owning lesson's range.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_MATH_EN_G4_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_EN_G4_T1_UNITS.forEach((unit, ui) => {
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
  "math-en-g4-t1",
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
  const lesson = EGYPT_MATH_EN_G4_T1_UNITS[unitIndex]!.lessons[lessonIndex]!;
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
 * lowercase «build» on book 9 match «BUILD»).
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
 * non-empty line of the page: odd pages print «Lesson <n>: <title> | N»
 * (book 51 prints the number with no pipe: «Lesson 5: Elapsed Time 51»),
 * even pages print a bare «N» (sometimes with a trailing pipe: «24 |»), and
 * the unit 6–7 openers print «Unit 6: … | 85» and «Unit 7: … | 99». Only the
 * last line is read, so exercise answers and table counts on earlier lines
 * can never be mistaken for a folio.
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
 * anchor the check accepts in place of a page number: the five folio-less
 * unit video openers (books 23, 39, 58, 70 and 123), each anchored on its
 * video title or, for unit 8, on its opening question, plus book 53, whose
 * capture ends mid-BUILD with «…» and never prints its number, anchored on
 * «So Many Strategies», a string the page itself prints.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  23: "Calculation Ants",
  39: "It's an Ant's Life",
  53: "So Many Strategies",
  58: "Hungry Ants",
  70: "Multiplication Moments",
  123: "What has an order in your school or home?",
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
  const units = EGYPT_MATH_EN_G4_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_MATH_EN_G4_T1_BOOK_START) {
    problems.push(`First section must start at page ${EGYPT_MATH_EN_G4_T1_BOOK_START}, found ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_EN_G4_T1_BOOK_END) {
    problems.push(`Last section must end at page ${EGYPT_MATH_EN_G4_T1_BOOK_END}, found ${last.bookTo}`);
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
 *  4. every printed page in [3, 127] is owned by exactly one lesson — no page
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
  const units = EGYPT_MATH_EN_G4_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_EN_G4_T1_BOOK_START || book > EGYPT_MATH_EN_G4_T1_BOOK_END) continue;
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
    EGYPT_MATH_EN_G4_T1_BOOK_END - EGYPT_MATH_EN_G4_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `Book fabric: ${printedPages.size} pages read between ${EGYPT_MATH_EN_G4_T1_BOOK_START} and ${EGYPT_MATH_EN_G4_T1_BOOK_END}, expected ${expectedPages}`,
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
  for (let p = EGYPT_MATH_EN_G4_T1_BOOK_START; p <= EGYPT_MATH_EN_G4_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`Page ${p} owned by no lesson`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
