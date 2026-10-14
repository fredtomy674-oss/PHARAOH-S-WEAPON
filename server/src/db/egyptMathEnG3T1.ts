// Primary 3 (الصف الثالث الابتدائي) Mathematics, English-medium, first term,
// Ministry of Education and Technical Education 2025/2026 edition (the cover
// imprint prints «2025 - 2026» and the back matter the copyright line).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g3-math-en`, subject `math-en` (name "Mathematics"), lesson prefix
// `l-g3-math-en-`, grade `grade-g3` (name "Primary 3").
//
// The curriculum tree for the Egypt `eg-g3-math-en` curriculum is rebuilt from
// the Ministry textbook `MATHEMATICS — Primary 3 — Term 1` (112 scanned pages).
// This module is the single source of truth for its structure: the six printed
// chapters of the first term, every numbered lesson inside them (47 in all), and,
// for every lesson, the book's own printed heads — the lesson head plus the
// activity bands the pages print (CONNECT / APPLY / CHALLENGE / REFLECT / KEY /
// PARTNER PRACTICE / PRACTICE) — verbatim and with the printed page they start
// on. The self-checks at the bottom prove that mapping against the OCR itself,
// page by page.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every content page prints a running header of the form
// `PRIMARY 3 - TERM 1 <folio>`. `BOOK_TO_PDF_OFFSET` is fixed by the scans and
// quoted here: scan 6 prints «PRIMARY 3 - TERM 1 2» (book 2, the Chapter-1
// opener), scan 30 prints «… 26» (book 26, the Chapter-3 opener), scan 66 prints
// «… 62» (book 62, the Chapter-5 opener) and scan 111 prints «… 107» (book 107,
// the term's last page). The book's own contents (scan 5, whose own folio reads
// the roman «V») independently confirms it: it lists «Chapter 1 … Lesson 1 …
// 2», «Lesson 10 … 42», «Lesson 8 : Multiplying by Multiples of 10 80», «Lesson 9 :
// Reading Capacity 104» — every lesson sits exactly where the contents says it
// does, with the single exception noted below (lesson 6-7).
//
// TERM = THE TYPED BOOK PAGES (books 2–107)
// Scan pages 1–5 are before the term: the cover (1), a blank verso (2), the
// «FOREWORD» (3), a blank verso (4) and the printed «Contents» (5, folio «V»).
// Scan page 112 is after the term (the copyright/credits page). The term runs
// from the Chapter-1 opener (book 2 = scan 6) to the last page of Chapter 6
// (book 107 = scan 111): `EGYPT_MATH_EN_G3_T1_BOOK_START` / `_BOOK_END` are
// exactly those two pages, and the tiling assertion proves nothing in between is
// left unreachable. `pagesChecked` is therefore 106 = 107 - 2 + 1 (no scan of the
// term is missing).
//
// NO FOLIO-LESS TERM PAGE AND NO MISSING SCAN
// Every one of the 106 term pages carries a running header whose number is a bare
// Western numeral equal to its own book number; the folio check therefore stays
// exact, `FOOTER_OCR_MISREADS` and `FOLIO_LESS_ANCHORS` are both empty, and
// `MISSING_SCANS` is empty. The header is normally the first line, but on five
// scans the text layer placed it lower (books 34, 49, 63, 73 and 94), so
// `footerCandidates` reads every line: a line only counts when it is exactly the
// header, so body numbers (chart cells, place-value rows, answers) can never be
// mistaken for a folio.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every numbered lesson contributes its head line (number + title, exactly as the
// opener prints it) plus the activity bands printed inside the pages the lesson
// owns, in page order and de-duplicated: a band that recurs (e.g. «APPLY, continued»
// on the next page) is the same concept. The band kinds are the book's own words:
// CONNECT, APPLY, CHALLENGE, REFLECT, KEY, PARTNER PRACTICE and PRACTICE (the book
// also prints «Practice Round:» and «Practice:», both read as PRACTICE). Nothing
// is invented: every concept title below is a string the book itself prints on the
// page its `bookFrom` names.
//
// TEXT-LAYER QUIRKS RECORDED, NOT WORKED AROUND
// The head lines keep the OCR's own spacing and capitalisation: «LESSON 1 :
// THOUSANDS» (space before the colon), «LESSON4: NUMBERS IN DIFFERENT FORMS» (no
// space after the number), «LESSON 6: MEASURING LENGHTHS IN MILLIMETER» (the
// book's own misspelling) and «Lesson 7: Commutative Property in Multiplication»
// (mixed case). Two heads are truncated where the printed line ends and continue
// on the following line — «LESSON 10: THE RELATION BETWEEN MULTIPLICATION»
// (continues «AND DIVISION») and «LESSON 4: COMPARING AND ORDERING NUMBERS IN»
// (continues «DIFFERENT FORMS») — and are stored exactly as each opener prints
// them; `normalize` drops line breaks, so the title check still matches.
//
// TWO GENUINE ANOMALIES
//  1. Lesson 3-7's opener (book 35) prints only «LESSON 7:» — no title follows it
//     in the text layer, though the book's own contents calls the lesson
//     «Applications on Time». Since that string is not printed on the page, the
//     spec stores the printed head itself («LESSON 7:») as both `printedHead` and
//     `title`, so the title-print check passes against the page without weakening
//     the checker.
//  2. The Contents lists Lesson 7 «Applications on Addition and Subtraction» at
//     book 98, but the head is actually printed on book 99 (book 98 continues
//     lesson 6's subtraction problems and its CHALLENGE). The spec follows the
//     page that prints the head — book 99 — which is what
//     `assertTreeMatchesTheBook` proves.
//
// THE CHAPTER-6 OPENER RIDES WITH THE FIRST LESSON
// Each chapter's first lesson starts on the chapter's own opener page (which
// prints «CHAPTER N» and then the lesson head), so `lessonBookRange` starts a
// chapter's first lesson at the section head, exactly as the other Egyptian
// Mathematics specs do.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.107 = scan p.111). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the Chapter-1 opener (scan 6). */
export const EGYPT_MATH_EN_G3_T1_BOOK_START = 2;

/** Last printed page of the term — the last page of Chapter 6 (scan 111). */
export const EGYPT_MATH_EN_G3_T1_BOOK_END = 107;

/** The scanned pages before the term: cover, a blank, FOREWORD, a blank, Contents. */
export const EGYPT_MATH_EN_G3_T1_FRONT_MATTER = { from: 1, to: 5 } as const;

/** The scan after the term: the copyright / credits page (scan 112). */
export const EGYPT_MATH_EN_G3_T1_BACK_MATTER = { from: 112, to: 112 } as const;

/**
 * The term pages the OCR never produced, as book pages. All 106 term pages were
 * captured, so there are none; the constant is kept so this module shares the
 * shape of the other Egyptian specs (and so the checker's expected page count
 * subtracts it).
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of a lesson — becomes one concept in the app tree. */
export interface MathEnG3T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: "Lesson" or one of the activity band words. */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one numbered lesson of a chapter). */
export interface MathEnG3T1Lesson {
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
  concepts: MathEnG3T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a chapter — so no lesson below uses it; the
   * field is kept so this module shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed chapter of the term. */
export interface MathEnG3T1Section {
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
  lessons: MathEnG3T1Lesson[];
}

const LESSON = "Lesson";

function concept(bookFrom: number, kind: string, title: string): MathEnG3T1Concept {
  return { bookFrom, kind, title };
}

function lessonHead(bookFrom: number, title: string): MathEnG3T1Concept {
  return concept(bookFrom, LESSON, title);
}

/** One printed activity band. The band word is both the concept's kind and title. */
function band(bookFrom: number, kind: string): MathEnG3T1Concept {
  return concept(bookFrom, kind, kind);
}

/**
 * The six chapters of the first term with their printed lessons and every printed
 * head, transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter ranges come from the pages' own «CHAPTER N» bands: 2–10, 11–25, 26–43,
 * 44–61, 62–82 and 83–107. Lesson starts come from the «LESSON n:» openers and
 * match the book's contents, except lesson 6-7 (contents says 98, the head is
 * printed on 99 — see the header note).
 */
export const EGYPT_MATH_EN_G3_T1_UNITS: MathEnG3T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "First",
    title: "Chapter 1",
    printedHead: "CHAPTER 1",
    bookFrom: 2,
    bookTo: 10,
    lessons: [
      {
        key: "1-1",
        ordinal: "First",
        type: LESSON,
        title: "PATTERNS",
        printedHead: "LESSON 1: PATTERNS",
        bookFrom: 2,
        concepts: [
          lessonHead(2, "LESSON 1: PATTERNS"),
          band(2, "CONNECT"),
          band(3, "APPLY"),
          band(3, "CHALLENGE"),
        ],
      },
      {
        key: "1-2",
        ordinal: "Second",
        type: LESSON,
        title: "MORE OF BAR GRAPHS",
        printedHead: "LESSON 2: MORE OF BAR GRAPHS",
        bookFrom: 4,
        concepts: [
          lessonHead(4, "LESSON 2: MORE OF BAR GRAPHS"),
          band(4, "APPLY"),
          band(4, "CHALLENGE"),
          band(4, "REFLECT"),
        ],
      },
      {
        key: "1-3",
        ordinal: "Third",
        type: LESSON,
        title: "LINE PLOT",
        printedHead: "LESSON 3: LINE PLOT",
        bookFrom: 5,
        concepts: [
          lessonHead(5, "LESSON 3: LINE PLOT"),
          band(5, "CHALLENGE"),
          band(5, "KEY"),
          band(5, "REFLECT"),
          band(5, "APPLY"),
        ],
      },
      {
        key: "1-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "MEASURING LENGTHS IN CENTIMETER",
        printedHead: "LESSON 4: MEASURING LENGTHS IN CENTIMETER",
        bookFrom: 6,
        concepts: [
          lessonHead(6, "LESSON 4: MEASURING LENGTHS IN CENTIMETER"),
          band(6, "CONNECT"),
          band(7, "APPLY"),
          band(7, "REFLECT"),
        ],
      },
      {
        key: "1-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "MEASURING LENGTHS IN METER",
        printedHead: "LESSON 5: MEASURING LENGTHS IN METER",
        bookFrom: 8,
        concepts: [
          lessonHead(8, "LESSON 5: MEASURING LENGTHS IN METER"),
          band(8, "APPLY"),
          band(9, "CHALLENGE"),
          band(9, "REFLECT"),
        ],
      },
      {
        key: "1-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "MEASURING LENGHTHS IN MILLIMETER",
        printedHead: "LESSON 6: MEASURING LENGHTHS IN MILLIMETER",
        bookFrom: 10,
        concepts: [
          lessonHead(10, "LESSON 6: MEASURING LENGHTHS IN MILLIMETER"),
          band(10, "APPLY"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "Second",
    title: "Chapter 2",
    printedHead: "CHAPTER 2",
    bookFrom: 11,
    bookTo: 25,
    lessons: [
      {
        key: "2-1",
        ordinal: "First",
        type: LESSON,
        title: "THOUSANDS",
        printedHead: "LESSON 1 : THOUSANDS",
        bookFrom: 11,
        concepts: [
          lessonHead(11, "LESSON 1 : THOUSANDS"),
          band(11, "PRACTICE"),
          band(11, "APPLY"),
          band(12, "REFLECT"),
        ],
      },
      {
        key: "2-2",
        ordinal: "Second",
        type: LESSON,
        title: "MORE OF THOUSANDS",
        printedHead: "LESSON 2: MORE OF THOUSANDS",
        bookFrom: 13,
        concepts: [
          lessonHead(13, "LESSON 2: MORE OF THOUSANDS"),
          band(13, "APPLY"),
          band(14, "CHALLENGE"),
        ],
      },
      {
        key: "2-3",
        ordinal: "Third",
        type: LESSON,
        title: "TEN THOUSANDS - HUNDRED THOUSANDS",
        printedHead: "LESSON 3: TEN THOUSANDS - HUNDRED THOUSANDS",
        bookFrom: 15,
        concepts: [
          lessonHead(15, "LESSON 3: TEN THOUSANDS - HUNDRED THOUSANDS"),
          band(15, "APPLY"),
          band(16, "REFLECT"),
        ],
      },
      {
        key: "2-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "NUMBERS IN DIFFERENT FORMS",
        printedHead: "LESSON4: NUMBERS IN DIFFERENT FORMS",
        bookFrom: 17,
        concepts: [
          lessonHead(17, "LESSON4: NUMBERS IN DIFFERENT FORMS"),
          band(17, "APPLY"),
        ],
      },
      {
        key: "2-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "ARRAYS",
        printedHead: "LESSON 5: ARRAYS",
        bookFrom: 18,
        concepts: [
          lessonHead(18, "LESSON 5: ARRAYS"),
          band(18, "APPLY"),
          band(20, "REFLECT"),
        ],
      },
      {
        key: "2-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "MULTIPLICATION",
        printedHead: "LESSON 6: MULTIPLICATION",
        bookFrom: 21,
        concepts: [
          lessonHead(21, "LESSON 6: MULTIPLICATION"),
          band(21, "APPLY"),
          band(22, "CHALLENGE"),
        ],
      },
      {
        key: "2-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "Commutative Property in Multiplication",
        printedHead: "Lesson 7: Commutative Property in Multiplication",
        bookFrom: 23,
        concepts: [
          lessonHead(23, "Lesson 7: Commutative Property in Multiplication"),
          band(23, "APPLY"),
          band(25, "REFLECT"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "Third",
    title: "Chapter 3",
    printedHead: "CHAPTER 3",
    bookFrom: 26,
    bookTo: 43,
    lessons: [
      {
        key: "3-1",
        ordinal: "First",
        type: LESSON,
        title: "WORD PROBLEMS ON MULTIPLICATION",
        printedHead: "LESSON 1 : WORD PROBLEMS ON MULTIPLICATION",
        bookFrom: 26,
        concepts: [
          lessonHead(26, "LESSON 1 : WORD PROBLEMS ON MULTIPLICATION"),
          band(26, "APPLY"),
          band(26, "PRACTICE"),
          band(27, "CHALLENGE"),
        ],
      },
      {
        key: "3-2",
        ordinal: "Second",
        type: LESSON,
        title: "APPLICATIONS ON MULTIPLICATION",
        printedHead: "LESSON 2: APPLICATIONS ON MULTIPLICATION",
        bookFrom: 28,
        concepts: [
          lessonHead(28, "LESSON 2: APPLICATIONS ON MULTIPLICATION"),
          band(28, "REFLECT"),
          band(28, "APPLY"),
        ],
      },
      {
        key: "3-3",
        ordinal: "Third",
        type: LESSON,
        title: "MULTIPLES OF 2 & 3",
        printedHead: "LESSON 3: MULTIPLES OF 2 & 3",
        bookFrom: 29,
        concepts: [
          lessonHead(29, "LESSON 3: MULTIPLES OF 2 & 3"),
          band(29, "APPLY"),
          band(30, "REFLECT"),
        ],
      },
      {
        key: "3-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "MULTIPLES OF 5 & 10",
        printedHead: "LESSON 4: MULTIPLES OF 5 & 10",
        bookFrom: 31,
        concepts: [
          lessonHead(31, "LESSON 4: MULTIPLES OF 5 & 10"),
          band(31, "APPLY"),
        ],
      },
      {
        key: "3-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "FACTORS OF A NUMBER USING ARRAYS",
        printedHead: "LESSON 5: FACTORS OF A NUMBER USING ARRAYS",
        bookFrom: 33,
        concepts: [
          lessonHead(33, "LESSON 5: FACTORS OF A NUMBER USING ARRAYS"),
          band(33, "REFLECT"),
        ],
      },
      {
        key: "3-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "TIME",
        printedHead: "LESSON 6: TIME",
        bookFrom: 34,
        concepts: [
          lessonHead(34, "LESSON 6: TIME"),
          band(34, "PARTNER PRACTICE"),
          band(34, "APPLY"),
        ],
      },
      {
        key: "3-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "LESSON 7:",
        printedHead: "LESSON 7:",
        bookFrom: 35,
        concepts: [
          lessonHead(35, "LESSON 7:"),
          band(35, "CHALLENGE"),
          band(35, "APPLY"),
          band(36, "REFLECT"),
        ],
      },
      {
        key: "3-8",
        ordinal: "Eighth",
        type: LESSON,
        title: "DIVISION",
        printedHead: "LESSON 8: DIVISION",
        bookFrom: 37,
        concepts: [
          lessonHead(37, "LESSON 8: DIVISION"),
          band(37, "APPLY"),
          band(39, "REFLECT"),
        ],
      },
      {
        key: "3-9",
        ordinal: "Ninth",
        type: LESSON,
        title: "APPLICATIONS ON DIVISION",
        printedHead: "LESSON 9: APPLICATIONS ON DIVISION",
        bookFrom: 40,
        concepts: [
          lessonHead(40, "LESSON 9: APPLICATIONS ON DIVISION"),
          band(40, "APPLY"),
        ],
      },
      {
        key: "3-10",
        ordinal: "Tenth",
        type: LESSON,
        title: "THE RELATION BETWEEN MULTIPLICATION",
        printedHead: "LESSON 10: THE RELATION BETWEEN MULTIPLICATION",
        bookFrom: 42,
        concepts: [
          lessonHead(42, "LESSON 10: THE RELATION BETWEEN MULTIPLICATION"),
          band(42, "APPLY"),
          band(43, "CHALLENGE"),
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
    bookFrom: 44,
    bookTo: 61,
    lessons: [
      {
        key: "4-1",
        ordinal: "First",
        type: LESSON,
        title: "POLYGONS",
        printedHead: "LESSON 1 : POLYGONS",
        bookFrom: 44,
        concepts: [
          lessonHead(44, "LESSON 1 : POLYGONS"),
          band(44, "APPLY"),
          band(45, "CHALLENGE"),
          band(45, "REFLECT"),
        ],
      },
      {
        key: "4-2",
        ordinal: "Second",
        type: LESSON,
        title: "PROPERTIES OF QUADRILATERALS",
        printedHead: "LESSON 2: PROPERTIES OF QUADRILATERALS",
        bookFrom: 46,
        concepts: [
          lessonHead(46, "LESSON 2: PROPERTIES OF QUADRILATERALS"),
          band(46, "CONNECT"),
          band(47, "APPLY"),
          band(48, "REFLECT"),
        ],
      },
      {
        key: "4-3",
        ordinal: "Third",
        type: LESSON,
        title: "AREA",
        printedHead: "LESSON 3: AREA",
        bookFrom: 49,
        concepts: [
          lessonHead(49, "LESSON 3: AREA"),
          band(49, "CONNECT"),
          band(49, "APPLY"),
          band(50, "CHALLENGE"),
        ],
      },
      {
        key: "4-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "RECTANGLES WITH EQUAL AREA",
        printedHead: "LESSON 4: RECTANGLES WITH EQUAL AREA",
        bookFrom: 51,
        concepts: [
          lessonHead(51, "LESSON 4: RECTANGLES WITH EQUAL AREA"),
          band(51, "CONNECT"),
          band(51, "APPLY"),
          band(52, "CHALLENGE"),
          band(53, "REFLECT"),
        ],
      },
      {
        key: "4-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "AREA USING MODELS",
        printedHead: "LESSON 5: AREA USING MODELS",
        bookFrom: 54,
        concepts: [
          lessonHead(54, "LESSON 5: AREA USING MODELS"),
          band(54, "CONNECT"),
          band(54, "APPLY"),
          band(56, "CHALLENGE"),
          band(57, "REFLECT"),
        ],
      },
      {
        key: "4-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "AREA BY SPLITTING ARRAYS",
        printedHead: "LESSON 6: AREA BY SPLITTING ARRAYS",
        bookFrom: 58,
        concepts: [
          lessonHead(58, "LESSON 6: AREA BY SPLITTING ARRAYS"),
          band(58, "APPLY"),
        ],
      },
      {
        key: "4-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "DISTRIBUTIVE PROPERTY ON MULTIPLICATION",
        printedHead: "LESSON 7: DISTRIBUTIVE PROPERTY ON MULTIPLICATION",
        bookFrom: 59,
        concepts: [
          lessonHead(59, "LESSON 7: DISTRIBUTIVE PROPERTY ON MULTIPLICATION"),
          band(59, "CONNECT"),
          band(59, "APPLY"),
          band(61, "REFLECT"),
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
    bookFrom: 62,
    bookTo: 82,
    lessons: [
      {
        key: "5-1",
        ordinal: "First",
        type: LESSON,
        title: "PERIMETER OF POLYGONS",
        printedHead: "LESSON 1 : PERIMETER OF POLYGONS",
        bookFrom: 62,
        concepts: [
          lessonHead(62, "LESSON 1 : PERIMETER OF POLYGONS"),
          band(62, "APPLY"),
          band(63, "REFLECT"),
        ],
      },
      {
        key: "5-2",
        ordinal: "Second",
        type: LESSON,
        title: "PERIMETER AND AREA",
        printedHead: "LESSON 2: PERIMETER AND AREA",
        bookFrom: 64,
        concepts: [
          lessonHead(64, "LESSON 2: PERIMETER AND AREA"),
          band(64, "APPLY"),
          band(65, "CHALLENGE"),
          band(66, "REFLECT"),
        ],
      },
      {
        key: "5-3",
        ordinal: "Third",
        type: LESSON,
        title: "AREA USING THE DIMENSIONS",
        printedHead: "LESSON 3: AREA USING THE DIMENSIONS",
        bookFrom: 67,
        concepts: [
          lessonHead(67, "LESSON 3: AREA USING THE DIMENSIONS"),
          band(67, "APPLY"),
          band(68, "CHALLENGE"),
        ],
      },
      {
        key: "5-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "AREA USING DIFFERENT STRATEGIES",
        printedHead: "LESSON 4: AREA USING DIFFERENT STRATEGIES",
        bookFrom: 69,
        concepts: [
          lessonHead(69, "LESSON 4: AREA USING DIFFERENT STRATEGIES"),
          band(69, "CONNECT"),
          band(69, "APPLY"),
        ],
      },
      {
        key: "5-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "DIFFERENT PERIMETERS FOR THE SAME AREA",
        printedHead: "LESSON 5: DIFFERENT PERIMETERS FOR THE SAME AREA",
        bookFrom: 72,
        concepts: [
          lessonHead(72, "LESSON 5: DIFFERENT PERIMETERS FOR THE SAME AREA"),
          band(72, "CONNECT"),
          band(73, "APPLY"),
          band(74, "CHALLENGE"),
        ],
      },
      {
        key: "5-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "DIFFERENT AREAS FOR THE SAME PERIMETER",
        printedHead: "LESSON 6: DIFFERENT AREAS FOR THE SAME PERIMETER",
        bookFrom: 75,
        concepts: [
          lessonHead(75, "LESSON 6: DIFFERENT AREAS FOR THE SAME PERIMETER"),
          band(75, "APPLY"),
          band(76, "CHALLENGE"),
          band(76, "REFLECT"),
        ],
      },
      {
        key: "5-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "APPLICATIONS ON PERIMETER AND AREA",
        printedHead: "LESSON 7: APPLICATIONS ON PERIMETER AND AREA",
        bookFrom: 77,
        concepts: [
          lessonHead(77, "LESSON 7: APPLICATIONS ON PERIMETER AND AREA"),
          band(77, "APPLY"),
          band(77, "CONNECT"),
        ],
      },
      {
        key: "5-8",
        ordinal: "Eighth",
        type: LESSON,
        title: "MULTIPLYING BY MULTIPLES OF 10",
        printedHead: "LESSON 8: MULTIPLYING BY MULTIPLES OF 10",
        bookFrom: 80,
        concepts: [
          lessonHead(80, "LESSON 8: MULTIPLYING BY MULTIPLES OF 10"),
          band(82, "CHALLENGE"),
          band(82, "REFLECT"),
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
    bookFrom: 83,
    bookTo: 107,
    lessons: [
      {
        key: "6-1",
        ordinal: "First",
        type: LESSON,
        title: "PATTERNS OF MULTIPLYING BY MULTIPLES OF 10",
        printedHead: "LESSON 1 : PATTERNS OF MULTIPLYING BY MULTIPLES OF 10",
        bookFrom: 83,
        concepts: [
          lessonHead(83, "LESSON 1 : PATTERNS OF MULTIPLYING BY MULTIPLES OF 10"),
          band(83, "CONNECT"),
          band(84, "APPLY"),
          band(85, "REFLECT"),
          band(85, "CHALLENGE"),
        ],
      },
      {
        key: "6-2",
        ordinal: "Second",
        type: LESSON,
        title: "STRATEGIES OF MULTIPLYING BY 9",
        printedHead: "LESSON 2: STRATEGIES OF MULTIPLYING BY 9",
        bookFrom: 86,
        concepts: [
          lessonHead(86, "LESSON 2: STRATEGIES OF MULTIPLYING BY 9"),
          band(86, "CHALLENGE"),
          band(86, "APPLY"),
        ],
      },
      {
        key: "6-3",
        ordinal: "Third",
        type: LESSON,
        title: "FACTS ON MULTIPLICATION AND ADDITION",
        printedHead: "LESSON 3: FACTS ON MULTIPLICATION AND ADDITION",
        bookFrom: 90,
        concepts: [
          lessonHead(90, "LESSON 3: FACTS ON MULTIPLICATION AND ADDITION"),
          band(90, "CONNECT"),
          band(91, "APPLY"),
        ],
      },
      {
        key: "6-4",
        ordinal: "Fourth",
        type: LESSON,
        title: "COMPARING AND ORDERING NUMBERS IN",
        printedHead: "LESSON 4: COMPARING AND ORDERING NUMBERS IN",
        bookFrom: 93,
        concepts: [
          lessonHead(93, "LESSON 4: COMPARING AND ORDERING NUMBERS IN"),
          band(93, "APPLY"),
          band(94, "CHALLENGE"),
        ],
      },
      {
        key: "6-5",
        ordinal: "Fifth",
        type: LESSON,
        title: "ADDITION STRATEGIES",
        printedHead: "LESSON 5: ADDITION STRATEGIES",
        bookFrom: 95,
        concepts: [
          lessonHead(95, "LESSON 5: ADDITION STRATEGIES"),
          band(95, "APPLY"),
          band(96, "CHALLENGE"),
          band(96, "REFLECT"),
        ],
      },
      {
        key: "6-6",
        ordinal: "Sixth",
        type: LESSON,
        title: "SUBTRACTION STRATEGIES",
        printedHead: "LESSON 6: SUBTRACTION STRATEGIES",
        bookFrom: 97,
        concepts: [
          lessonHead(97, "LESSON 6: SUBTRACTION STRATEGIES"),
          band(97, "APPLY"),
          band(98, "CHALLENGE"),
        ],
      },
      {
        key: "6-7",
        ordinal: "Seventh",
        type: LESSON,
        title: "APPLICATIONS ON ADDITION AND SUBTRACTION",
        printedHead: "LESSON 7: APPLICATIONS ON ADDITION AND SUBTRACTION",
        bookFrom: 99,
        concepts: [
          lessonHead(99, "LESSON 7: APPLICATIONS ON ADDITION AND SUBTRACTION"),
          band(99, "APPLY"),
          band(99, "PRACTICE"),
          band(99, "CONNECT"),
          band(101, "REFLECT"),
        ],
      },
      {
        key: "6-8",
        ordinal: "Eighth",
        type: LESSON,
        title: "CAPACITY",
        printedHead: "LESSON 8: CAPACITY",
        bookFrom: 102,
        concepts: [
          lessonHead(102, "LESSON 8: CAPACITY"),
          band(102, "APPLY"),
        ],
      },
      {
        key: "6-9",
        ordinal: "Ninth",
        type: LESSON,
        title: "READING THE CAPACITY",
        printedHead: "LESSON 9: READING THE CAPACITY",
        bookFrom: 104,
        concepts: [
          lessonHead(104, "LESSON 9: READING THE CAPACITY"),
          band(104, "CONNECT"),
          band(105, "APPLY"),
          band(107, "REFLECT"),
        ],
      },
    ],
  },
];

/**
 * The book-page span a lesson owns: from the chapter opener (its first lesson)
 * or its own head page, down to the page before the next lesson starts, bounded
 * by the chapter. A band that recurs on the following page belongs to this
 * lesson, so the ranges tile [2, 107] exactly and no reachable content sits
 * outside a lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_MATH_EN_G3_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_EN_G3_T1_UNITS.forEach((section, si) => {
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
  "math-en-g3-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (No term page of this book needs it — every present term page carries
 * text — but the guard is kept so the loader shares one shape across the books.)
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
  const lesson = EGYPT_MATH_EN_G3_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
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
 * carried by its running header — `PRIMARY 3 - TERM 1 <n>` — which stands alone
 * on a line (usually the first, but on five scans further down). Every line is
 * read; a line only counts when it is exactly that header, so body numbers
 * (chart cells, place-value rows, answers) can never be mistaken for a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const out: number[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const match = raw.trim().match(/^PRIMARY\s+3\s+-\s+TERM\s+1\s+(\d+)$/);
    if (!match) continue;
    const n = Number(match[1]);
    if (n > 0 && !out.includes(n)) out.push(n);
  }
  return out;
}

/**
 * The book number a content page prints in its running header, or null. Every
 * content page carries a header whose number is exactly its own, which is what
 * fixes the offset; the pages named in `FOLIO_LESS_ANCHORS` (none here) would be
 * handled there instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * Folios whose OCR printed a different, still parseable number. This book has
 * none (every folio came out right), so the map is empty and the folio check
 * stays exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * Term pages that print no parseable folio in the text layer, each with the
 * anchor the check accepts in place of a page number. This edition has none:
 * every term page prints its running-header folio.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {};

/**
 * Table invariants: lesson keys are unique and follow (chapter-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term with no gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_EN_G3_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_MATH_EN_G3_T1_BOOK_START) {
    problems.push(`First section must start at page ${EGYPT_MATH_EN_G3_T1_BOOK_START}, found ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_EN_G3_T1_BOOK_END) {
    problems.push(`Last section must end at page ${EGYPT_MATH_EN_G3_T1_BOOK_END}, found ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number from its
 *     running-header folio (or, on OCR-damaged pages, from the anchor named in
 *     `FOLIO_LESS_ANCHORS` — this edition has none);
 *  2. every chapter opener prints the chapter head and every lesson's first page
 *     prints that lesson's head;
 *  3. every lesson's title and every activity's head is printed on the pages the
 *     lesson owns (the activity on its own page);
 *  4. every printed page in [2, 107] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of
 *     the term the scans prove, i.e. `_BOOK_END - _BOOK_START + 1` minus
 *     `MISSING_SCANS`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_MATH_EN_G3_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_EN_G3_T1_BOOK_START || book > EGYPT_MATH_EN_G3_T1_BOOK_END) continue;
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
    EGYPT_MATH_EN_G3_T1_BOOK_END - EGYPT_MATH_EN_G3_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `Book fabric: ${printedPages.size} pages read between ${EGYPT_MATH_EN_G3_T1_BOOK_START} and ${EGYPT_MATH_EN_G3_T1_BOOK_END}, expected ${expectedPages}`,
    );
  }

  // 2 + 3a. every chapter opener prints the chapter head, every lesson's first
  // page its head, and every lesson's title is printed somewhere in the pages it
  // owns.
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

  // 3b. every activity's printed head is on its own page.
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
  for (let p = EGYPT_MATH_EN_G3_T1_BOOK_START; p <= EGYPT_MATH_EN_G3_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`Page ${p} owned by no lesson`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
