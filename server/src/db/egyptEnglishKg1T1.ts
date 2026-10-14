// Kindergarten 1 (KG 1) English, first term — OFFICIAL curriculum.
//
// The first term IS the Ministry textbook (KG 1 English, Term 1, 2025/2026
// Ministry of Education and Technical Education edition, 100 scan pages; 99
// OCR'd — scan 2 is absent from the corpus, see below). This file is the
// book's table: the «Getting Ready» pencil page, the four units of its Scope
// and Sequence (Meet and Greet! / I Can Find it at School! / My Body, My Care!
// / My Family Picnic!) plus the closing Review of units 1–4, each with its
// printed activity heads and the exact book pages they occupy. It is the
// single source of truth the seeder and the stage both read; the self-checks
// at the bottom prove the page mapping against the scan, page by page.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every numbered content page prints its own folio as a bare numeral in its
// page furniture, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and
// quoted here: scan 5 prints «1» (book 1, the pencil page), scan 6 prints «2»
// (book 2, the Unit 1 opener), scan 22 prints «18» (book 18, the Unit 2
// opener), scan 41 prints «37» (book 37, the Unit 3 opener), scan 67 prints
// «63» (book 63, the Unit 4 opener) and scan 98 prints «94» (book 94, the
// closing craft page) — always scan = book + 4. The book's own Scope and
// Sequence (scans 3–4) independently confirms the skeleton: units 1–4 plus a
// Review of units 1–4 with its «My Classroom» project.
//
// FRONT MATTER IS SCANS 1–4; BACK MATTER IS SCANS 99–100
// Scans 1–4 are before book page 1: the cover (scan 1), the absent scan 2
// (never produced — documented here, not listed in `MISSING_SCANS`, exactly
// as the Discover G1 spec documents its absent front-matter scans 3–4), and
// the two-page Scope and Sequence (scans 3–4). Scans 99–100 are after the
// term: a blank page (scan 99, no text layer) and the credits page (scan 100).
// The term runs from the pencil page (book 1 = scan 5) to the «My Classroom
// Craft!» project (book 94 = scan 98): `EGYPT_ENGLISH_KG1_T1_BOOK_START` /
// `_END` are exactly those two pages, and the tiling assertion proves nothing
// in between is left unreachable. `pagesChecked` therefore equals 94 − 1 + 1
// = 94.
//
// NO TERM SCAN IS ABSENT — `MISSING_SCANS` IS EMPTY
// Every book page of [1, 94] has its scan (scans 5–98) with a real text layer,
// so no term page is skipped and `pagesChecked` is the full term range. Kept
// as an empty list so the module shares the shape of the other Egyptian specs.
//
// EVERY TERM PAGE PROVES ITS FOLIO — NO ANCHORS, NO MISREADS
// Every content page prints its own number as a bare numeral in the top/bottom
// furniture — mid-page where the layout puts it there («18» on the Unit 2
// opener, «64» between «sister» and «brother», «76» above «Color the heart
// with green.») — so `footerCandidates` reads the first and last four furniture
// lines and `printedFooter` matches the page's own number among them. Body
// numerals (trace targets «1 2 3 4 5», counts «1 train», «2 chairs», «4 | 2»)
// join the candidate set harmlessly: the page's own number proves the mapping
// when present, and the probe over all 94 term pages shows it always is —
// including book 1 (trace «1 2 3 4 5» plus folio «1») and the count pages
// (book 42's «1», «2» plus folio «42»). `FOLIO_LESS_ANCHORS` and
// `FOOTER_OCR_MISREADS` are therefore both empty.
//
// EACH LESSON IS ONE PRINTED ACTIVITY PAGE
// The book prints no per-unit «Lesson n» heads: every activity page carries
// its own printed head («Friends», «The sound of letter: Tt», «Count and
// Say:», «Trace number 1:», «Story: Ibrahim and Talia's Day!», «School Bag»,
// «Review …») and that head is the lesson — exactly as the KG Discover specs
// model each activity page as its own lesson. The pencil page (book 1) is the
// book's «Getting Ready» intro section; each unit opener (books 2, 18, 37,
// 63) is its unit's first lesson; the Review (books 89–94) is its own section
// whose opener prints «Trace the letters:». Where one page prints two parallel
// instructions both ride with the lesson as its concepts (the five «Trace
// number N:» + «Color N balloon(s):» pages, the three-instruction hygiene/food
// review on book 91, and the build instruction + «My Classroom Craft!» on book
// 94). Nothing is invented: every title below is a string the page its
// `bookFrom` names prints.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// The trace-letter heads differ per letter («Let's trace letter Tt:» but
// «Let's trace letter: Pp», «Let's trace letter Cc:») and are transcribed each
// verbatim; «Count and say:» (book 81) keeps its lowercase «s» against the
// other «Count and Say:» pages; «Story : Look Around the Classroom!» (book 34)
// keeps its space before the colon against the other «Story:» heads; «Look and
// Match :» (book 5) likewise. The band head is «It's Practice Time!» with a
// straight apostrophe on most pages but «It’s» (curly) on books 59 and 89 —
// practice lessons are therefore titled by their specific instruction, not the
// band head.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.94 = scan p.98). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed content page of the term — the pencil-holding page (scan 5). */
export const EGYPT_ENGLISH_KG1_T1_BOOK_START = 1;

/** Last printed content page — «My Classroom Craft!» (scan 98). */
export const EGYPT_ENGLISH_KG1_T1_BOOK_END = 94;

/** The scan pages before the term: cover (1), absent scan 2, scope (3–4). */
export const EGYPT_ENGLISH_KG1_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/** The scan pages after the term: a blank (99) and the credits page (100). */
export const EGYPT_ENGLISH_KG1_T1_BACK_MATTER = { from: 99, to: 100 } as const;

/**
 * The term pages the OCR never produced, in book pages. Every book page of
 * [1, 94] has its scan with a text layer, so this list is empty; the only
 * absent scan of the corpus (scan 2) sits in the front matter and is
 * documented above. Kept so the module shares the shape of the other
 * Egyptian specs.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface EnglishKg1T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «Activity». */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one activity page of the book). */
export interface EnglishKg1T1Lesson {
  /** App-addressable key, e.g. "1-4" (unit 1, lesson 4) or "review-2". */
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
  concepts: EnglishKg1T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — the intro, a unit, or the review. */
export interface EnglishKg1T1Section {
  /** Whether this is the intro page, a numbered unit, or the review. */
  kind: "intro" | "unit" | "review";
  /** Internal key: "intro", "1"…"4", "review", in book order. */
  key: string;
  /** Arabic ordinal of the unit as used in the app tree, e.g. "الثانية"; "" elsewhere. */
  ordinal: string;
  /** Full app-facing section title, e.g. "Unit 1: Meet and Greet!". */
  title: string;
  /** The section head its opener page prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next section's opener). */
  bookTo: number;
  lessons: EnglishKg1T1Lesson[];
}

const TYPE = "Activity";

function concept(bookFrom: number, title: string): EnglishKg1T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The intro page, the four units and the review of the first term, with every
 * printed activity head, transcribed from the page the book prints it on and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Section ranges come from the Scope and Sequence (scans 3–4) and the unit
 * openers the pages print: 1 (pencil page), 2–17 (Unit 1), 18–36 (Unit 2),
 * 37–62 (Unit 3), 63–88 (Unit 4), 89–94 (Review).
 */
export const EGYPT_ENGLISH_KG1_T1_SECTIONS: EnglishKg1T1Section[] = [
  {
    key: "intro",
    kind: "intro",
    ordinal: "",
    title: "Getting Ready",
    printedHead: "Let's learn how to hold a pencil correctly:",
    bookFrom: 1,
    bookTo: 1,
    lessons: [
      {
        key: "intro-1",
        ordinal: "الأول",
        type: TYPE,
        title: "Let's learn how to hold a pencil correctly:",
        printedHead: "Let's learn how to hold a pencil correctly:",
        bookFrom: 1,
        concepts: [concept(1, "Let's learn how to hold a pencil correctly:")],
      },
    ],
  },
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "Unit 1: Meet and Greet!",
    printedHead: "Meet and Greet!",
    bookFrom: 2,
    bookTo: 17,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "Meet and Greet!",
        printedHead: "Meet and Greet!",
        bookFrom: 2,
        concepts: [concept(2, "Meet and Greet!")],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "Friends",
        printedHead: "Friends",
        bookFrom: 3,
        concepts: [concept(3, "Friends")],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "Good morning.",
        printedHead: "Good morning.",
        bookFrom: 4,
        concepts: [concept(4, "Good morning.")],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "Look and Match :",
        printedHead: "Look and Match :",
        bookFrom: 5,
        concepts: [concept(5, "Look and Match :")],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "A boy or a girl?",
        printedHead: "A boy or a girl?",
        bookFrom: 6,
        concepts: [concept(6, "A boy or a girl?")],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: TYPE,
        title: "How are you feeling today?",
        printedHead: "How are you feeling today?",
        bookFrom: 7,
        concepts: [concept(7, "How are you feeling today?")],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        type: TYPE,
        title: "The sound of letter: Tt",
        printedHead: "The sound of letter: Tt",
        bookFrom: 8,
        concepts: [concept(8, "The sound of letter: Tt")],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        type: TYPE,
        title: "Let's trace letter Tt:",
        printedHead: "Let's trace letter Tt:",
        bookFrom: 9,
        concepts: [concept(9, "Let's trace letter Tt:")],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        type: TYPE,
        title: "Count and Say:",
        printedHead: "Count and Say:",
        bookFrom: 10,
        concepts: [concept(10, "Count and Say:")],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        type: TYPE,
        title: "Trace number 1:",
        printedHead: "Trace number 1:",
        bookFrom: 11,
        concepts: [concept(11, "Trace number 1:"), concept(11, "Color 1 balloon:")],
      },
      {
        key: "1-11",
        ordinal: "الحادي عشر",
        type: TYPE,
        title: "Colors and shapes:",
        printedHead: "Colors and shapes:",
        bookFrom: 12,
        concepts: [concept(12, "Colors and shapes:")],
      },
      {
        key: "1-12",
        ordinal: "الثاني عشر",
        type: TYPE,
        title: "The sound of letter: Ii",
        printedHead: "The sound of letter: Ii",
        bookFrom: 13,
        concepts: [concept(13, "The sound of letter: Ii")],
      },
      {
        key: "1-13",
        ordinal: "الثالث عشر",
        type: TYPE,
        title: "Let's trace letter Ii:",
        printedHead: "Let's trace letter Ii:",
        bookFrom: 14,
        concepts: [concept(14, "Let's trace letter Ii:")],
      },
      {
        key: "1-14",
        ordinal: "الرابع عشر",
        type: TYPE,
        title: "Circle the beginning letter:",
        printedHead: "Circle the beginning letter:",
        bookFrom: 15,
        concepts: [concept(15, "Circle the beginning letter:")],
      },
      {
        key: "1-15",
        ordinal: "الخامس عشر",
        type: TYPE,
        title: "Color:",
        printedHead: "Color:",
        bookFrom: 16,
        concepts: [concept(16, "Color:")],
      },
      {
        key: "1-16",
        ordinal: "السادس عشر",
        type: TYPE,
        title: "Story: Ibrahim and Talia's Day!",
        printedHead: "Story: Ibrahim and Talia's Day!",
        bookFrom: 17,
        concepts: [concept(17, "Story: Ibrahim and Talia's Day!")],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "Unit 2: I Can Find it at School!",
    printedHead: "I Can Find it at School!",
    bookFrom: 18,
    bookTo: 36,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "I Can Find it at School!",
        printedHead: "I Can Find it at School!",
        bookFrom: 18,
        concepts: [concept(18, "I Can Find it at School!")],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "Classroom",
        printedHead: "Classroom",
        bookFrom: 19,
        concepts: [concept(19, "Classroom")],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "playground",
        printedHead: "playground",
        bookFrom: 20,
        concepts: [concept(20, "playground")],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "What can you see at the playground?",
        printedHead: "What can you see at the playground?",
        bookFrom: 21,
        concepts: [concept(21, "What can you see at the playground?")],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "What can you see in your classroom?",
        printedHead: "What can you see in your classroom?",
        bookFrom: 22,
        concepts: [concept(22, "What can you see in your classroom?")],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: TYPE,
        title: "The sound of letter: Ss",
        printedHead: "The sound of letter: Ss",
        bookFrom: 23,
        concepts: [concept(23, "The sound of letter: Ss")],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        type: TYPE,
        title: "Let's trace letter Ss:",
        printedHead: "Let's trace letter Ss:",
        bookFrom: 24,
        concepts: [concept(24, "Let's trace letter Ss:")],
      },
      {
        key: "2-8",
        ordinal: "الثامن",
        type: TYPE,
        title: "Count and Say:",
        printedHead: "Count and Say:",
        bookFrom: 25,
        concepts: [concept(25, "Count and Say:")],
      },
      {
        key: "2-9",
        ordinal: "التاسع",
        type: TYPE,
        title: "Trace number 2:",
        printedHead: "Trace number 2:",
        bookFrom: 26,
        concepts: [concept(26, "Trace number 2:"), concept(26, "Color 2 balloons:")],
      },
      {
        key: "2-10",
        ordinal: "العاشر",
        type: TYPE,
        title: "Colors and shapes:",
        printedHead: "Colors and shapes:",
        bookFrom: 27,
        concepts: [concept(27, "Colors and shapes:")],
      },
      {
        key: "2-11",
        ordinal: "الحادي عشر",
        type: TYPE,
        title: "The sound of letter: Aa",
        printedHead: "The sound of letter: Aa",
        bookFrom: 28,
        concepts: [concept(28, "The sound of letter: Aa")],
      },
      {
        key: "2-12",
        ordinal: "الثاني عشر",
        type: TYPE,
        title: "Let's trace letter Aa:",
        printedHead: "Let's trace letter Aa:",
        bookFrom: 29,
        concepts: [concept(29, "Let's trace letter Aa:")],
      },
      {
        key: "2-13",
        ordinal: "الثالث عشر",
        type: TYPE,
        title: "The sound of letter: Nn",
        printedHead: "The sound of letter: Nn",
        bookFrom: 30,
        concepts: [concept(30, "The sound of letter: Nn")],
      },
      {
        key: "2-14",
        ordinal: "الرابع عشر",
        type: TYPE,
        title: "Let's trace letter Nn:",
        printedHead: "Let's trace letter Nn:",
        bookFrom: 31,
        concepts: [concept(31, "Let's trace letter Nn:")],
      },
      {
        key: "2-15",
        ordinal: "الخامس عشر",
        type: TYPE,
        title: "Circle the picture that matches the letter:",
        printedHead: "Circle the picture that matches the letter:",
        bookFrom: 32,
        concepts: [concept(32, "Circle the picture that matches the letter:")],
      },
      {
        key: "2-16",
        ordinal: "السادس عشر",
        type: TYPE,
        title: "Color the classroom objects:",
        printedHead: "Color the classroom objects:",
        bookFrom: 33,
        concepts: [concept(33, "Color the classroom objects:")],
      },
      {
        key: "2-17",
        ordinal: "السابع عشر",
        type: TYPE,
        title: "Story : Look Around the Classroom!",
        printedHead: "Story : Look Around the Classroom!",
        bookFrom: 34,
        concepts: [concept(34, "Story : Look Around the Classroom!")],
      },
      {
        key: "2-18",
        ordinal: "الثامن عشر",
        type: TYPE,
        title: "School Bag",
        printedHead: "School Bag",
        bookFrom: 35,
        concepts: [concept(35, "School Bag")],
      },
      {
        key: "2-19",
        ordinal: "التاسع عشر",
        type: TYPE,
        title: "Show and Tell",
        printedHead: "Show and Tell",
        bookFrom: 36,
        concepts: [concept(36, "Show and Tell")],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "Unit 3: My Body, My Care!",
    printedHead: "My Body, My Care!",
    bookFrom: 37,
    bookTo: 62,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "My Body, My Care!",
        printedHead: "My Body, My Care!",
        bookFrom: 37,
        concepts: [concept(37, "My Body, My Care!")],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "My body parts:",
        printedHead: "My body parts:",
        bookFrom: 38,
        concepts: [concept(38, "My body parts:")],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "My face parts:",
        printedHead: "My face parts:",
        bookFrom: 39,
        concepts: [concept(39, "My face parts:")],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "My face parts:",
        printedHead: "My face parts:",
        bookFrom: 40,
        concepts: [concept(40, "My face parts:")],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "My face parts:",
        printedHead: "My face parts:",
        bookFrom: 41,
        concepts: [concept(41, "My face parts:")],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: TYPE,
        title: "How Many? Match the Body Parts:",
        printedHead: "How Many? Match the Body Parts:",
        bookFrom: 42,
        concepts: [concept(42, "How Many? Match the Body Parts:")],
      },
      {
        key: "3-7",
        ordinal: "السابع",
        type: TYPE,
        title: "Hygiene Actions:",
        printedHead: "Hygiene Actions:",
        bookFrom: 43,
        concepts: [concept(43, "Hygiene Actions:")],
      },
      {
        key: "3-8",
        ordinal: "الثامن",
        type: TYPE,
        title: "Hygiene Actions:",
        printedHead: "Hygiene Actions:",
        bookFrom: 44,
        concepts: [concept(44, "Hygiene Actions:")],
      },
      {
        key: "3-9",
        ordinal: "التاسع",
        type: TYPE,
        title: "Hygiene Actions:",
        printedHead: "Hygiene Actions:",
        bookFrom: 45,
        concepts: [concept(45, "Hygiene Actions:")],
      },
      {
        key: "3-10",
        ordinal: "العاشر",
        type: TYPE,
        title: "Color the correct action:",
        printedHead: "Color the correct action:",
        bookFrom: 46,
        concepts: [concept(46, "Color the correct action:")],
      },
      {
        key: "3-11",
        ordinal: "الحادي عشر",
        type: TYPE,
        title: "The sound of letter: Pp",
        printedHead: "The sound of letter: Pp",
        bookFrom: 47,
        concepts: [concept(47, "The sound of letter: Pp")],
      },
      {
        key: "3-12",
        ordinal: "الثاني عشر",
        type: TYPE,
        title: "Let's trace letter: Pp",
        printedHead: "Let's trace letter: Pp",
        bookFrom: 48,
        concepts: [concept(48, "Let's trace letter: Pp")],
      },
      {
        key: "3-13",
        ordinal: "الثالث عشر",
        type: TYPE,
        title: "The sound of letter: Hh",
        printedHead: "The sound of letter: Hh",
        bookFrom: 49,
        concepts: [concept(49, "The sound of letter: Hh")],
      },
      {
        key: "3-14",
        ordinal: "الرابع عشر",
        type: TYPE,
        title: "Let's trace letter: Hh",
        printedHead: "Let's trace letter: Hh",
        bookFrom: 50,
        concepts: [concept(50, "Let's trace letter: Hh")],
      },
      {
        key: "3-15",
        ordinal: "الخامس عشر",
        type: TYPE,
        title: "Count and Say:",
        printedHead: "Count and Say:",
        bookFrom: 51,
        concepts: [concept(51, "Count and Say:")],
      },
      {
        key: "3-16",
        ordinal: "السادس عشر",
        type: TYPE,
        title: "Trace number 3:",
        printedHead: "Trace number 3:",
        bookFrom: 52,
        concepts: [concept(52, "Trace number 3:"), concept(52, "Color 3 balloons:")],
      },
      {
        key: "3-17",
        ordinal: "السابع عشر",
        type: TYPE,
        title: "Colors and shapes:",
        printedHead: "Colors and shapes:",
        bookFrom: 53,
        concepts: [concept(53, "Colors and shapes:")],
      },
      {
        key: "3-18",
        ordinal: "الثامن عشر",
        type: TYPE,
        title: "The sound of letter: Dd",
        printedHead: "The sound of letter: Dd",
        bookFrom: 54,
        concepts: [concept(54, "The sound of letter: Dd")],
      },
      {
        key: "3-19",
        ordinal: "التاسع عشر",
        type: TYPE,
        title: "Let's trace letter: Dd",
        printedHead: "Let's trace letter: Dd",
        bookFrom: 55,
        concepts: [concept(55, "Let's trace letter: Dd")],
      },
      {
        key: "3-20",
        ordinal: "العشرون",
        type: TYPE,
        title: "The sound of letter: Rr",
        printedHead: "The sound of letter: Rr",
        bookFrom: 56,
        concepts: [concept(56, "The sound of letter: Rr")],
      },
      {
        key: "3-21",
        ordinal: "الحادي والعشرون",
        type: TYPE,
        title: "Let's trace letter: Rr",
        printedHead: "Let's trace letter: Rr",
        bookFrom: 57,
        concepts: [concept(57, "Let's trace letter: Rr")],
      },
      {
        key: "3-22",
        ordinal: "الثاني والعشرون",
        type: TYPE,
        title: "Match the picture with the beginning letter:",
        printedHead: "Match the picture with the beginning letter:",
        bookFrom: 58,
        concepts: [concept(58, "Match the picture with the beginning letter:")],
      },
      {
        key: "3-23",
        ordinal: "الثالث والعشرون",
        type: TYPE,
        title: "Circle the body parts:",
        printedHead: "Circle the body parts:",
        bookFrom: 59,
        concepts: [concept(59, "Circle the body parts:")],
      },
      {
        key: "3-24",
        ordinal: "الرابع والعشرون",
        type: TYPE,
        title: "Story: All About Me and My Day!",
        printedHead: "Story: All About Me and My Day!",
        bookFrom: 60,
        concepts: [concept(60, "Story: All About Me and My Day!")],
      },
      {
        key: "3-25",
        ordinal: "الخامس والعشرون",
        type: TYPE,
        title: "My Face",
        printedHead: "My Face",
        bookFrom: 61,
        concepts: [concept(61, "My Face")],
      },
      {
        key: "3-26",
        ordinal: "السادس والعشرون",
        type: TYPE,
        title: "Show and Tell",
        printedHead: "Show and Tell",
        bookFrom: 62,
        concepts: [concept(62, "Show and Tell")],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "الرابعة",
    title: "Unit 4: My Family Picnic!",
    printedHead: "My Family Picnic!",
    bookFrom: 63,
    bookTo: 88,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "My Family Picnic!",
        printedHead: "My Family Picnic!",
        bookFrom: 63,
        concepts: [concept(63, "My Family Picnic!")],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "My Family",
        printedHead: "My Family",
        bookFrom: 64,
        concepts: [concept(64, "My Family")],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "My Family",
        printedHead: "My Family",
        bookFrom: 65,
        concepts: [concept(65, "My Family")],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "Garden",
        printedHead: "Garden",
        bookFrom: 66,
        concepts: [concept(66, "Garden")],
      },
      {
        key: "4-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "Draw what you can see in the garden:",
        printedHead: "Draw what you can see in the garden:",
        bookFrom: 67,
        concepts: [concept(67, "Draw what you can see in the garden:")],
      },
      {
        key: "4-6",
        ordinal: "السادس",
        type: TYPE,
        title: "What's in My Picnic Basket?",
        printedHead: "What's in My Picnic Basket?",
        bookFrom: 68,
        concepts: [concept(68, "What's in My Picnic Basket?")],
      },
      {
        key: "4-7",
        ordinal: "السابع",
        type: TYPE,
        title: "Match the healthy and unhealthy food:",
        printedHead: "Match the healthy and unhealthy food:",
        bookFrom: 69,
        concepts: [concept(69, "Match the healthy and unhealthy food:")],
      },
      {
        key: "4-8",
        ordinal: "الثامن",
        type: TYPE,
        title: "The sound of letter: Ee",
        printedHead: "The sound of letter: Ee",
        bookFrom: 70,
        concepts: [concept(70, "The sound of letter: Ee")],
      },
      {
        key: "4-9",
        ordinal: "التاسع",
        type: TYPE,
        title: "Let's trace letter Ee:",
        printedHead: "Let's trace letter Ee:",
        bookFrom: 71,
        concepts: [concept(71, "Let's trace letter Ee:")],
      },
      {
        key: "4-10",
        ordinal: "العاشر",
        type: TYPE,
        title: "The sound of letter: Cc",
        printedHead: "The sound of letter: Cc",
        bookFrom: 72,
        concepts: [concept(72, "The sound of letter: Cc")],
      },
      {
        key: "4-11",
        ordinal: "الحادي عشر",
        type: TYPE,
        title: "Let's trace letter Cc:",
        printedHead: "Let's trace letter Cc:",
        bookFrom: 73,
        concepts: [concept(73, "Let's trace letter Cc:")],
      },
      {
        key: "4-12",
        ordinal: "الثاني عشر",
        type: TYPE,
        title: "Count and Say:",
        printedHead: "Count and Say:",
        bookFrom: 74,
        concepts: [concept(74, "Count and Say:")],
      },
      {
        key: "4-13",
        ordinal: "الثالث عشر",
        type: TYPE,
        title: "Trace number 4:",
        printedHead: "Trace number 4:",
        bookFrom: 75,
        concepts: [concept(75, "Trace number 4:"), concept(75, "Color 4 balloons:")],
      },
      {
        key: "4-14",
        ordinal: "الرابع عشر",
        type: TYPE,
        title: "Colors and shapes:",
        printedHead: "Colors and shapes:",
        bookFrom: 76,
        concepts: [concept(76, "Colors and shapes:")],
      },
      {
        key: "4-15",
        ordinal: "الخامس عشر",
        type: TYPE,
        title: "The sound of letter: Kk",
        printedHead: "The sound of letter: Kk",
        bookFrom: 77,
        concepts: [concept(77, "The sound of letter: Kk")],
      },
      {
        key: "4-16",
        ordinal: "السادس عشر",
        type: TYPE,
        title: "Let's trace letter Kk:",
        printedHead: "Let's trace letter Kk:",
        bookFrom: 78,
        concepts: [concept(78, "Let's trace letter Kk:")],
      },
      {
        key: "4-17",
        ordinal: "السابع عشر",
        type: TYPE,
        title: "The sound of letter: Mm",
        printedHead: "The sound of letter: Mm",
        bookFrom: 79,
        concepts: [concept(79, "The sound of letter: Mm")],
      },
      {
        key: "4-18",
        ordinal: "الثامن عشر",
        type: TYPE,
        title: "Let's trace letter Mm:",
        printedHead: "Let's trace letter Mm:",
        bookFrom: 80,
        concepts: [concept(80, "Let's trace letter Mm:")],
      },
      {
        key: "4-19",
        ordinal: "التاسع عشر",
        type: TYPE,
        title: "Count and say:",
        printedHead: "Count and say:",
        bookFrom: 81,
        concepts: [concept(81, "Count and say:")],
      },
      {
        key: "4-20",
        ordinal: "العشرون",
        type: TYPE,
        title: "Trace number 5:",
        printedHead: "Trace number 5:",
        bookFrom: 82,
        concepts: [concept(82, "Trace number 5:"), concept(82, "Color 5 balloons:")],
      },
      {
        key: "4-21",
        ordinal: "الحادي والعشرون",
        type: TYPE,
        title: "Colors and shapes:",
        printedHead: "Colors and shapes:",
        bookFrom: 83,
        concepts: [concept(83, "Colors and shapes:")],
      },
      {
        key: "4-22",
        ordinal: "الثاني والعشرون",
        type: TYPE,
        title: "Match the picture with the beginning letter:",
        printedHead: "Match the picture with the beginning letter:",
        bookFrom: 84,
        concepts: [concept(84, "Match the picture with the beginning letter:")],
      },
      {
        key: "4-23",
        ordinal: "الثالث والعشرون",
        type: TYPE,
        title: "Match the picture with its shadow:",
        printedHead: "Match the picture with its shadow:",
        bookFrom: 85,
        concepts: [concept(85, "Match the picture with its shadow:")],
      },
      {
        key: "4-24",
        ordinal: "الرابع والعشرون",
        type: TYPE,
        title: "Story: Family Fun on the Grass",
        printedHead: "Story: Family Fun on the Grass",
        bookFrom: 86,
        concepts: [concept(86, "Story: Family Fun on the Grass")],
      },
      {
        key: "4-25",
        ordinal: "الخامس والعشرون",
        type: TYPE,
        title: "Family Tree",
        printedHead: "Family Tree",
        bookFrom: 87,
        concepts: [concept(87, "Family Tree")],
      },
      {
        key: "4-26",
        ordinal: "السادس والعشرون",
        type: TYPE,
        title: "Show and Tell",
        printedHead: "Show and Tell",
        bookFrom: 88,
        concepts: [concept(88, "Show and Tell")],
      },
    ],
  },
  {
    key: "review",
    kind: "review",
    ordinal: "",
    title: "Review",
    printedHead: "Trace the letters:",
    bookFrom: 89,
    bookTo: 94,
    lessons: [
      {
        key: "review-1",
        ordinal: "الأول",
        type: TYPE,
        title: "Trace the letters:",
        printedHead: "Trace the letters:",
        bookFrom: 89,
        concepts: [concept(89, "Trace the letters:")],
      },
      {
        key: "review-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "Match the picture with the correct letter then trace:",
        printedHead: "Match the picture with the correct letter then trace:",
        bookFrom: 90,
        concepts: [concept(90, "Match the picture with the correct letter then trace:")],
      },
      {
        key: "review-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "Circle the good hygiene action:",
        printedHead: "Circle the good hygiene action:",
        bookFrom: 91,
        concepts: [
          concept(91, "Circle the good hygiene action:"),
          concept(91, "Draw a happy face and a sad face:"),
          concept(91, "Circle the healthy food:"),
        ],
      },
      {
        key: "review-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "Circle the correct letter then trace:",
        printedHead: "Circle the correct letter then trace:",
        bookFrom: 92,
        concepts: [concept(92, "Circle the correct letter then trace:")],
      },
      {
        key: "review-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "Count and circle the number:",
        printedHead: "Count and circle the number:",
        bookFrom: 93,
        concepts: [concept(93, "Count and circle the number:")],
      },
      {
        key: "review-6",
        ordinal: "السادس",
        type: TYPE,
        title: "My Classroom Craft!",
        printedHead: "My Classroom Craft!",
        bookFrom: 94,
        concepts: [
          concept(94, "Color, cut, and glue the picture to build your classroom scene:"),
          concept(94, "My Classroom Craft!"),
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
 * lesson — the section opener) or its own start page, up to the page before
 * the next lesson starts, or the section's last page for its last lesson.
 * Every lesson of this book starts on its own page, so each range is exactly
 * that page.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_ENGLISH_KG1_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ENGLISH_KG1_T1_SECTIONS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. The scans show
 * no appendix, so this is empty; kept as a function so the seeder and the stage
 * share one shape across all the books.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const section of EGYPT_ENGLISH_KG1_T1_SECTIONS) {
    for (const lesson of section.lessons) {
      if (lesson.extraBookPages?.length) out.set(lesson.key, [...lesson.extraBookPages]);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Text-layer loading
// ---------------------------------------------------------------------------

const OCR_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "curriculum-ocr",
  "english-kg1-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (Only the back-matter blank, scan 99, needs it — every term page
 * carries real text — but the guard keeps the loader the same shape across
 * the books.)
 */
const NO_TEXT = /لا يوجد نص/;

/** Text-layer text of one printed book page, or "" when the page was not extracted. */
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
 * The document a lesson grounds the tutor in: its own page range in order, plus
 * any appendix pages it points to. This book has no appendix, so the extra loop
 * is a no-op kept for a shared shape.
 */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(sectionIndex, lessonIndex);
  const lesson = EGYPT_ENGLISH_KG1_T1_SECTIONS[sectionIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(from, to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/** Folds text for comparison: lowercases and removes letters' spacing/punctuation. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring OCR spacing and punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints. The folio rides in the page
 * furniture at the top or the foot — bare on its own line («3», «42», «94»),
 * sometimes mid-page where the layout puts it («18» on the Unit 2 opener,
 * «64» between «sister» and «brother», «76» above its instruction) — so the
 * top and bottom furniture lines each contribute both their space-stripped
 * whole and every whitespace-separated digit token. Body numerals (trace
 * targets, counts, exercise numbers) join the candidate set harmlessly: the
 * page's own number proves the mapping when present, via `printedFooter`.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const region = [...lines.slice(0, 4), ...lines.slice(-4)];
  const numbers = new Set<number>();
  for (const line of region) {
    const joined = line.replace(/ /g, "");
    if (/^\d{1,3}$/.test(joined)) numbers.add(Number(joined));
    for (const token of line.split(/\s+/)) {
      if (/^\d{1,3}$/.test(token)) numbers.add(Number(token));
    }
  }
  return [...numbers].sort((a, b) => a - b);
}

/**
 * The book number a content page prints, or null when it prints none. Returns
 * the page's own number when it is among the candidates, otherwise the largest
 * candidate (so a wrong page still reports a number and the caller can see the
 * mismatch). Every OCR'd term page of this book proves its number, so no page
 * is exempted via `FOLIO_LESS_ANCHORS`.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * Folios whose OCR printed a different, still parseable number. Every folio in
 * this book came out right, so the map is empty and the folio check stays
 * exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * Term pages that print no folio in the checked furniture, each with the
 * anchor the check accepts in place of a page number. Every term page of this
 * book prints its folio, so the map is empty; kept so the module shares the
 * shape of the other Egyptian specs.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {};

/** Every head kind the table may use. */
const KNOWN_KINDS = new Set(["Activity"]);

/**
 * Table invariants: lesson keys follow (section-lesson), every range sits
 * inside its section, concept pages rise inside their lesson, the sections
 * tile the term without gaps or overlaps, and the first/last sections hit the
 * book's own bounds. A content mistake here would quietly ground the tutor on
 * the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_ENGLISH_KG1_T1_SECTIONS;

  sections.forEach((section, si) => {
    if (!section.title.trim()) problems.push(`القسم ${section.key}: بلا عنوان`);
    if (!section.printedHead.trim()) problems.push(`القسم ${section.key}: بلا عنوان مطبوع`);
    if (section.lessons.length === 0) problems.push(`القسم ${section.title}: بلا دروس`);

    section.lessons.forEach((lesson, li) => {
      const expectedKey = `${section.key}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`القسم ${section.key} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (!lesson.title.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان`);
      if (!lesson.printedHead.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان مطبوع`);
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا مكوّنات`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول مكوّن`);
      }

      const minStart = li === 0 ? section.bookFrom : section.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > section.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${section.bookFrom}–${section.bookTo}`);
      }

      lesson.concepts.forEach((c, ci) => {
        if (!c.title.trim()) problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: بلا عنوان`);
        if (!KNOWN_KINDS.has(c.kind)) {
          problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: نوع غير معروف «${c.kind}»`);
        }
        if (c.bookFrom < section.bookFrom || c.bookFrom > section.bookTo) {
          problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: صفحته ${c.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && c.bookFrom < prev.bookFrom) {
          problems.push(`الدرس ${lesson.key}: صفحات المكوّنات تنازلية (${prev.bookFrom} ثم ${c.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(si, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < section.bookFrom || to > section.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${section.bookFrom}–${section.bookTo}`);
      }
      const last = lesson.concepts.at(-1)!;
      if (last.bookFrom < from || last.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: مكوّنه الأخير ${last.bookFrom} خارج نطاقه ${from}–${to}`);
      }
      const next = section.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== section.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر القسم ${section.bookFrom}، وجدنا ${from}`);
      }
    });

    const nextSection = sections[si + 1];
    if (nextSection && section.bookTo >= nextSection.bookFrom) {
      problems.push(`القسم ${section.title} يتداخل مع ${nextSection.title}`);
    } else if (nextSection && section.bookTo !== nextSection.bookFrom - 1) {
      problems.push(`فجوة صفحات بين ${section.title} و${nextSection.title}: ${section.bookTo + 1}–${nextSection.bookFrom - 1}`);
    }
  });

  const first = sections[0];
  const last = sections[sections.length - 1];
  if (first && first.bookFrom !== EGYPT_ENGLISH_KG1_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ENGLISH_KG1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ENGLISH_KG1_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ENGLISH_KG1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number from
 *     the folio in its furniture (`FOLIO_LESS_ANCHORS` is empty: every term
 *     page proves its number; `MISSING_SCANS` is empty: no term scan is
 *     absent);
 *  2. every section opener prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title (or its printed head) and every activity's head is
 *     printed on the pages the lesson owns (the activity on its own page);
 *  4. every page in [1, 94] is owned by exactly one lesson — no page falls
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
  const sections = EGYPT_ENGLISH_KG1_T1_SECTIONS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ENGLISH_KG1_T1_BOOK_START || book > EGYPT_ENGLISH_KG1_T1_BOOK_END) continue;
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
  sections.forEach((section, si) => {
    if (loadBookPage(section.bookFrom) && !pagePrints(section.bookFrom, section.printedHead)) {
      problems.push(`القسم ${section.title}: صفحة صدوره ${section.bookFrom} لا تطبع «${section.printedHead}»`);
    }

    section.lessons.forEach((lesson, li) => {
      if (loadBookPage(lesson.bookFrom) && !pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع «${lesson.printedHead}»`);
      }
      const { from, to } = lessonBookRange(si, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.printedHead);
      if (!titlePrinted) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
    });
  });

  // 3b. every activity's printed head is on its own page.
  sections.forEach((section) => {
    section.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (loadBookPage(c.bookFrom) && !pagePrints(c.bookFrom, c.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة المكوّن ${c.bookFrom} لا تطبع «${c.title}»`);
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
  for (let p = EGYPT_ENGLISH_KG1_T1_BOOK_START; p <= EGYPT_ENGLISH_KG1_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_ENGLISH_KG1_T1_BOOK_END - EGYPT_ENGLISH_KG1_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_ENGLISH_KG1_T1_BOOK_START} و${EGYPT_ENGLISH_KG1_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
