// Kindergarten 2 (KG 2) English, first term — OFFICIAL curriculum.
//
// The first term IS the Ministry textbook (KG 2 English, Term 1, 2025/2026
// Ministry of Education and Technical Education edition, 124 scan pages; 123
// OCR'd — scan 2 is absent from the corpus, see below). This file is the
// book's table: the six «Remember With Me!» opening pages, the four units of
// its Scope and Sequence (Little Bodies, Big Moves! / Let's Get Dressed! /
// My Week! / My Busy Day!) plus the closing Review of units 1–4, each with
// its printed lesson heads and the exact book pages they occupy. It is the
// single source of truth the seeder and the stage both read; the self-checks
// at the bottom prove the page mapping against the scan, page by page.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every numbered content page prints its own folio as a bare numeral in its
// page furniture, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and
// quoted here: scan 5 prints «1» (book 1, the Remember With Me! page), scan 6
// prints «2» (book 2, Greetings), scan 11 prints «7» (book 7, the Unit 1
// opener), scan 35 prints «31» (book 31, the Unit 2 opener), scan 61 prints
// «57» (book 57, the Unit 3 opener), scan 87 prints «83» (book 83, the Unit 4
// opener), scan 111 prints «107» (book 107, the closing Review) and scan 122
// prints «118» (book 118, the dice template) — always scan = book + 4. The
// book's own Scope and Sequence (scans 3–4) independently confirms the
// skeleton: units 1–4 plus a Review of units 1–4 (letters Jj–Uu, numbers
// 1–10).
//
// FRONT MATTER IS SCANS 1–4; BACK MATTER IS SCANS 117–124
// Scans 1–4 are before book page 1: the cover (scan 1), the absent scan 2
// (never produced — documented here, not listed in `MISSING_SCANS`, exactly
// as the KG 1 English spec documents its absent front-matter scan 2), and the
// two-page Scope and Sequence (scans 3–4). Scans 117–124 are after the term:
// the six-page «Cut, Paste, and Create!» craft appendix (scans 117–122, book
// 113–118: the donkey, kite, flower and cat posters, the cut-out pictures
// for page 100 and the dice template for page 76) and the credits/values
// pages (scans 123–124). The term runs from the Remember With Me! page
// (book 1 = scan 5) to the last Review page (book 112 = scan 116):
// `EGYPT_ENGLISH_KG2_T1_BOOK_START` / `_END` are exactly those two pages,
// and the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 112 − 1 + 1 = 112.
//
// NO TERM SCAN IS ABSENT — `MISSING_SCANS` IS EMPTY
// Every book page of [1, 112] has its scan (scans 5–116) with a real text
// layer, so no term page is skipped and `pagesChecked` is the full term
// range. Kept as an empty list so the module shares the shape of the other
// Egyptian specs.
//
// TWO REVIEW PAGES PROVE THEIR FOLIO MID-PAGE — TWO ANCHORS, NO MISREADS
// Every other term page prints its folio in the top/bottom furniture, so
// `footerCandidates` reads the first and last four furniture lines and
// `printedFooter` matches the page's own number among them. Body numerals
// (counts «1 head», «2 eyes», exercise options «2 / 1», trace targets, and
// the cross-page pointers «Refer to page 114 …») join the candidate set
// harmlessly: the page's own number proves the mapping when present. Two
// unit-review pages print their folio mid-page outside the checked
// furniture — book 30 («30» between «J j» and «Circle what you can do:»)
// and book 82 («82» between «L l» and «Color the days of the week
// rocket:») — so both are exempted via `FOLIO_LESS_ANCHORS` on the review
// head each page prints, exactly as the G5 English spec anchors its
// mid-folio page. The probe over all 112 term pages shows every other page
// proves its number, so `FOOTER_OCR_MISREADS` is empty.
//
// LESSONS FOLLOW THE BOOK'S PRINTED «Lesson n» HEADS
// Unlike the KG 1 book (one activity per page), this book prints explicit
// «Lesson 1:» / «Lesson 2:» / «Lesson 3:» heads inside every unit, so each
// lesson below IS one printed lesson block: the unit opener pages, Lesson 1
// (vocabulary and structures), Lesson 2 (letters, sounds and numbers),
// Lesson 3 (life skills and values), the two-page story («Let's Learn With
// a Story!»), the song («Sing and Chant with Me!») and the unit review.
// Unit 4 prints no «Lesson 2:» head — its letters-and-numbers block
// (books 88–100) is titled by the band it does print, «Letters and
// Sounds:»; nothing is invented. The intro (books 1–6) and the closing
// Review (books 107–112) have no lesson numbers, so each of their pages is
// its own lesson, exactly as the KG 1 spec models activity pages. Every
// title below is a string the page its `bookFrom` names prints.
//
// THE CRAFT PAGES ARE AN APPENDIX, REACHED THROUGH `extraBookPages`
// Books 113–118 stay outside the tiled term (they are cut-out resources,
// not lessons), but six lesson pages print an explicit pointer to them, so
// the owning Lesson 2 of each unit also owns its appendix page the way the
// Arabic specs own their listening texts: book 18 → 114 (kite), book 40 →
// 113 (donkey poster), book 74 → 115 (flower poster), book 76 → 118 (dice),
// book 91 → 116 (cat poster), book 100 → 117 (pictures). The appendix pages
// all carry real text, so each pointed-to page joins its lesson's document.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// The practice band is «It's Practice Time!» with a straight apostrophe on
// most pages but «It’s» (curly) on books 17 and 41 — practice lessons are
// therefore titled by their specific instruction, not the band head. The
// story band is «Let's Learn With a Story!» (straight) except on book 53,
// which prints «Let’s» (curly) — the Unit 2 story keeps its curly head
// verbatim. The song names keep their space before the colon («Action
// Verbs Song :», «Getting Dressed Song :», «Days of the Week Song :», «My
// Day Song :»). «Numbers Are Fun!» carries «!» on book 21 but «Numbers Are
// Fun» stands bare on books 43 and 93; book 45 prints «Count then circle
// the number:» (no «and») against the «Count and circle» pages; book 51
// discusses «with your teacher and peers:» against the «friends:» of book
// 25; book 80 thinks back to the «dialog:» against the «story:» pages. The
// check-marks differ per page («✓»/«✗» on book 36, «✔» on books 28, 49
// and 80) and are transcribed each verbatim.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.112 = scan p.116). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed content page of the term — the Remember With Me! page (scan 5). */
export const EGYPT_ENGLISH_KG2_T1_BOOK_START = 1;

/** Last printed content page — the last Review page (scan 116). */
export const EGYPT_ENGLISH_KG2_T1_BOOK_END = 112;

/** The scan pages before the term: cover (1), absent scan 2, scope (3–4). */
export const EGYPT_ENGLISH_KG2_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/** The scan pages after the term: the craft appendix (117–122) and credits (123–124). */
export const EGYPT_ENGLISH_KG2_T1_BACK_MATTER = { from: 117, to: 124 } as const;

/**
 * The term pages the OCR never produced, in book pages. Every book page of
 * [1, 112] has its scan with a text layer, so this list is empty; the only
 * absent scan of the corpus (scan 2) sits in the front matter and is
 * documented above. Kept so the module shares the shape of the other
 * Egyptian specs.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of the textbook — becomes one concept in the app tree. */
export interface EnglishKg2T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The head's own printed topic, e.g. "On the Move!" or "Review". */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson of the book — becomes one lesson in the app tree. */
export interface EnglishKg2T1Lesson {
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
  concepts: EnglishKg2T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to (its craft or cut-out
   * page). Only the four Lesson 2 blocks use it; every other lesson leaves
   * it unset.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — the intro, a unit, or the review. */
export interface EnglishKg2T1Section {
  /** Whether this is the opening pages, a numbered unit, or the review. */
  kind: "intro" | "unit" | "review";
  /** Internal key: "intro", "1"…"4", "review", in book order. */
  key: string;
  /** Arabic ordinal of the unit as used in the app tree, e.g. "الثانية"; "" elsewhere. */
  ordinal: string;
  /** Full app-facing section title, e.g. "Unit 1: Little Bodies, Big Moves!". */
  title: string;
  /** The section head its opener page prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next section's opener). */
  bookTo: number;
  lessons: EnglishKg2T1Lesson[];
}

function concept(bookFrom: number, kind: string, title: string): EnglishKg2T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The opening pages, the four units and the review of the first term, with
 * every printed lesson head, transcribed from the page the book prints it on
 * and checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Section ranges come from the Scope and Sequence (scans 3–4) and the unit
 * openers the pages print: 1–6 (Remember With Me!), 7–30 (Unit 1), 31–56
 * (Unit 2), 57–82 (Unit 3), 83–106 (Unit 4), 107–112 (Review).
 */
export const EGYPT_ENGLISH_KG2_T1_SECTIONS: EnglishKg2T1Section[] = [
  {
    key: "intro",
    kind: "intro",
    ordinal: "",
    title: "Remember With Me!",
    printedHead: "Remember With Me!",
    bookFrom: 1,
    bookTo: 6,
    lessons: [
      {
        key: "intro-1",
        ordinal: "الأول",
        type: "Remember With Me!",
        title: "Remember With Me!",
        printedHead: "Remember With Me!",
        bookFrom: 1,
        concepts: [
          concept(1, "Remember With Me!", "Trace the following lines:"),
          concept(1, "Remember With Me!", "Trace the following shapes:"),
        ],
      },
      {
        key: "intro-2",
        ordinal: "الثاني",
        type: "Greetings",
        title: "Greetings",
        printedHead: "Greetings",
        bookFrom: 2,
        concepts: [concept(2, "Greetings", "Listen, repeat, and act out:")],
      },
      {
        key: "intro-3",
        ordinal: "الثالث",
        type: "My School, My Classroom",
        title: "My School, My Classroom",
        printedHead: "My School, My Classroom",
        bookFrom: 3,
        concepts: [concept(3, "My School, My Classroom", "Point, say, then color:")],
      },
      {
        key: "intro-4",
        ordinal: "الرابع",
        type: "My School Bag!",
        title: "My School Bag!",
        printedHead: "My School Bag!",
        bookFrom: 4,
        concepts: [concept(4, "My School Bag!", "Match the objects that belong in your school bag:")],
      },
      {
        key: "intro-5",
        ordinal: "الخامس",
        type: "My Family",
        title: "My Family",
        printedHead: "My Family",
        bookFrom: 5,
        concepts: [concept(5, "My Family", "Listen, point, and circle the picture:")],
      },
      {
        key: "intro-6",
        ordinal: "السادس",
        type: "My Body Parts",
        title: "My Body Parts",
        printedHead: "My Body Parts",
        bookFrom: 6,
        concepts: [concept(6, "My Body Parts", "Listen, point, and repeat:")],
      },
    ],
  },
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "Unit 1: Little Bodies, Big Moves!",
    printedHead: "Little Bodies, Big Moves!",
    bookFrom: 7,
    bookTo: 30,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "Little Bodies, Big Moves!",
        title: "Little Bodies, Big Moves!",
        printedHead: "Little Bodies, Big Moves!",
        bookFrom: 7,
        concepts: [concept(7, "Little Bodies, Big Moves!", "Look, listen, and point:")],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: "Look, listen, and point:",
        title: "Look, listen, and point:",
        printedHead: "Look, listen, and point:",
        bookFrom: 8,
        concepts: [concept(8, "Look, listen, and point:", "Look, listen, and point:")],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: "Look, listen, and point:",
        title: "Look, listen, and point:",
        printedHead: "Look, listen, and point:",
        bookFrom: 9,
        concepts: [concept(9, "Look, listen, and point:", "Look, listen, and point:")],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: "On the Move!",
        title: "Lesson 1: On the Move!",
        printedHead: "On the Move!",
        bookFrom: 10,
        concepts: [
          concept(10, "On the Move!", "Look, listen, and say:"),
          concept(11, "On the Move!", "Look, listen, and say:"),
          concept(12, "On the Move!", "Circle the picture that matches the action:"),
          concept(13, "On the Move!", "Match the same actions:"),
          concept(14, "On the Move!", "What Can You Do?"),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: "Letters and Sounds:",
        title: "Lesson 2: Letters and Sounds:",
        printedHead: "Letters and Sounds:",
        bookFrom: 15,
        concepts: [
          concept(15, "Letters and Sounds:", "Look and say:"),
          concept(16, "Letters and Sounds:", "Follow the Arrows, Make the letters!"),
          concept(17, "Letters and Sounds:", "Trace letter Jj in its upper and lowercase forms:"),
          concept(17, "Letters and Sounds:", "Circle the pictures that start with the letter Jj:"),
          concept(18, "Letters and Sounds:", "Trace letter Kk in its upper and lowercase forms:"),
          concept(18, "Letters and Sounds:", "Match the pictures with their beginning letter:"),
          concept(19, "Letters and Sounds:", "Scavenger Kite-Hunt"),
          concept(19, "Letters and Sounds:", "Can You Catch the Kk Kites?"),
          concept(20, "Letters and Sounds:", "Count with me:"),
          concept(21, "Letters and Sounds:", "Look, count, and say:"),
          concept(22, "Letters and Sounds:", "Point, count, then trace:"),
          concept(22, "Letters and Sounds:", "Follow the Arrows, Make the numbers!"),
          concept(23, "Letters and Sounds:", "Count and circle the number:"),
          concept(24, "Letters and Sounds:", "Count and match:"),
        ],
        extraBookPages: [114],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: "Listen, Learn, and Sing!",
        title: "Lesson 3: Listen, Learn, and Sing!",
        printedHead: "Listen, Learn, and Sing!",
        bookFrom: 25,
        concepts: [
          concept(25, "Listen, Learn, and Sing!", "Listen, repeat, and discuss with your teacher and friends:"),
          concept(26, "Listen, Learn, and Sing!", "Circle the smiley face for the good actions:"),
          concept(26, "Listen, Learn, and Sing!", "Color the smiley faces if you did the following:"),
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        type: "Let's Learn With a Story!",
        title: "Let's Learn With a Story!",
        printedHead: "Let's Learn With a Story!",
        bookFrom: 27,
        concepts: [
          concept(27, "Let's Learn With a Story!", "Listen and act out the dialog with a friend:"),
          concept(28, "Let's Learn With a Story!", "Think back to the story:"),
          concept(28, "Let's Learn With a Story!", "Listen and put (✔) or (x):"),
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        type: "Sing and Chant with Me!",
        title: "Sing and Chant with Me!",
        printedHead: "Sing and Chant with Me!",
        bookFrom: 29,
        concepts: [concept(29, "Sing and Chant with Me!", "Action Verbs Song :")],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        type: "Unit 1 Review",
        title: "Unit 1 Review",
        printedHead: "Unit 1 Review",
        bookFrom: 30,
        concepts: [
          concept(30, "Unit 1 Review", "Trace, match, and color:"),
          concept(30, "Unit 1 Review", "Circle what you can do:"),
          concept(30, "Unit 1 Review", "Color number 1 with red and number 2 with blue:"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "Unit 2: Let's Get Dressed!",
    printedHead: "Let's Get Dressed!",
    bookFrom: 31,
    bookTo: 56,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: "Let's Get Dressed!",
        title: "Let's Get Dressed!",
        printedHead: "Let's Get Dressed!",
        bookFrom: 31,
        concepts: [concept(31, "Let's Get Dressed!", "Look, say, and point:")],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "Look, listen, and point:",
        title: "Look, listen, and point:",
        printedHead: "Look, listen, and point:",
        bookFrom: 32,
        concepts: [concept(32, "Look, listen, and point:", "Look, listen, and point:")],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: "Clothing Items",
        title: "Lesson 1: Clothing Items",
        printedHead: "Clothing Items",
        bookFrom: 34,
        concepts: [
          concept(34, "Clothing Items", "Listen, point, and say:"),
          concept(35, "Clothing Items", "Say, trace, then color:"),
          concept(36, "Clothing Items", "Listen, look at the picture, then put a ✓ if it matches, or a ✗ if it doesn't:"),
          concept(37, "Clothing Items", "Your Color, Your Creation!"),
          concept(37, "Clothing Items", "Now it’s your turn to use your favorite color:"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: "Letters and Sounds:",
        title: "Lesson 2: Letters and Sounds:",
        printedHead: "Letters and Sounds:",
        bookFrom: 38,
        concepts: [
          concept(38, "Letters and Sounds:", "Look and say:"),
          concept(39, "Letters and Sounds:", "Follow the Arrows, Make the letters!"),
          concept(40, "Letters and Sounds:", "Trace letter Dd in its upper and lowercase forms:"),
          concept(40, "Letters and Sounds:", "Look and say, then circle the beginning letter."),
          concept(41, "Letters and Sounds:", "Trace letter Mm in its upper and lowercase forms:"),
          concept(41, "Letters and Sounds:", "Match the pictures that begin with Mm:"),
          concept(42, "Letters and Sounds:", "Read and say."),
          concept(43, "Letters and Sounds:", "Look, count, and say:"),
          concept(44, "Letters and Sounds:", "Point, count, then trace:"),
          concept(44, "Letters and Sounds:", "Follow the Arrows, Make the numbers!"),
          concept(45, "Letters and Sounds:", "Count then circle the number:"),
          concept(46, "Letters and Sounds:", "Color only 3 mugs:"),
          concept(46, "Letters and Sounds:", "Color only 4 mugs:"),
          concept(47, "Letters and Sounds:", "Look and say:"),
          concept(48, "Letters and Sounds:", "Follow the Arrows, Make the letters!"),
          concept(49, "Letters and Sounds:", "Trace letter Gg in its upper and lowercase forms:"),
          concept(49, "Letters and Sounds:", "Look at the picture, say the word, then put a ✔ for the correct beginning letter:"),
          concept(50, "Letters and Sounds:", "Letters and Pictures"),
          concept(50, "Letters and Sounds:", "Color the pictures that start with the letter:"),
        ],
        extraBookPages: [113],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: "Listen, Learn, and Sing!",
        title: "Lesson 3: Listen, Learn, and Sing!",
        printedHead: "Listen, Learn, and Sing!",
        bookFrom: 51,
        concepts: [
          concept(51, "Listen, Learn, and Sing!", "Listen, repeat, and discuss with your teacher and peers:"),
          concept(52, "Listen, Learn, and Sing!", "Circle the smiley face for the good actions:"),
          concept(52, "Listen, Learn, and Sing!", "Draw a picture of yourself wearing your favorite clothes, then color it:"),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: "Let’s Learn With a Story!",
        title: "Let’s Learn With a Story!",
        printedHead: "Let’s Learn With a Story!",
        bookFrom: 53,
        concepts: [
          concept(53, "Let’s Learn With a Story!", "Listen, count, and act out with a friend:"),
          concept(54, "Let’s Learn With a Story!", "Think back to the story:"),
          concept(54, "Let’s Learn With a Story!", "Listen and circle the correct answer:"),
        ],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        type: "Sing and Chant with Me!",
        title: "Sing and Chant with Me!",
        printedHead: "Sing and Chant with Me!",
        bookFrom: 55,
        concepts: [concept(55, "Sing and Chant with Me!", "Getting Dressed Song :")],
      },
      {
        key: "2-8",
        ordinal: "الثامن",
        type: "Unit 2 Review",
        title: "Unit 2 Review",
        printedHead: "Unit 2 Review",
        bookFrom: 56,
        concepts: [
          concept(56, "Unit 2 Review", "Trace, match, and color:"),
          concept(56, "Unit 2 Review", "Circle the clothing items:"),
          concept(56, "Unit 2 Review", "Count, match, and trace:"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "Unit 3: My Week!",
    printedHead: "My Week!",
    bookFrom: 57,
    bookTo: 82,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: "My Week!",
        title: "My Week!",
        printedHead: "My Week!",
        bookFrom: 57,
        concepts: [concept(57, "My Week!", "Look, listen, and point:")],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: "What day is it?",
        title: "Lesson 1: What day is it?",
        printedHead: "What day is it?",
        bookFrom: 58,
        concepts: [
          concept(58, "What day is it?", "Listen and repeat:"),
          concept(59, "What day is it?", "Listen and repeat:"),
          concept(60, "What day is it?", "Look, listen, and repeat:"),
          concept(61, "What day is it?", "Listen and circle what day comes tomorrow:"),
          concept(61, "What day is it?", "Circle the correct picture:"),
          concept(62, "What day is it?", "Listen and circle what day was yesterday:"),
          concept(63, "What day is it?", "My Colorful Week!"),
          concept(63, "What day is it?", "Now it's your turn to express:"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: "Letters and Sounds:",
        title: "Lesson 2: Letters and Sounds:",
        printedHead: "Letters and Sounds:",
        bookFrom: 64,
        concepts: [
          concept(64, "Letters and Sounds:", "Look and say:"),
          concept(65, "Letters and Sounds:", "Follow the Arrows, Make the letters!"),
          concept(66, "Letters and Sounds:", "Trace letter Oo in its upper and lowercase forms:"),
          concept(66, "Letters and Sounds:", "Look and say, then circle the beginning letter."),
          concept(67, "Letters and Sounds:", "Trace letter Bb in its upper and lowercase forms:"),
          concept(67, "Letters and Sounds:", "Trace, color, and match the beginning letter:"),
          concept(68, "Letters and Sounds:", "Look, listen, and repeat:"),
          concept(69, "Letters and Sounds:", "Look, count, and say:"),
          concept(70, "Letters and Sounds:", "Count and trace:"),
          concept(70, "Letters and Sounds:", "Follow the Arrows, Make the numbers!"),
          concept(71, "Letters and Sounds:", "Count and match:"),
          concept(72, "Letters and Sounds:", "Look and say:"),
          concept(73, "Letters and Sounds:", "Follow the Arrows, Make the letters!"),
          concept(74, "Letters and Sounds:", "Trace letter Ff in its upper and lowercase forms:"),
          concept(74, "Letters and Sounds:", "Look and say, then circle the beginning letter."),
          concept(75, "Letters and Sounds:", "Trace letter Ll in its upper and lowercase forms:"),
          concept(75, "Letters and Sounds:", "Look, find, and color the pictures that start with letter Ll:"),
          concept(76, "Letters and Sounds:", "What words can you think of?"),
          concept(76, "Letters and Sounds:", "Roll the dice, look at the letter, and say two words that begin with that letter:"),
        ],
        extraBookPages: [115, 118],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: "Listen, Learn, and Sing!",
        title: "Lesson 3: Listen, Learn, and Sing!",
        printedHead: "Listen, Learn, and Sing!",
        bookFrom: 77,
        concepts: [
          concept(77, "Listen, Learn, and Sing!", "Be responsible."),
          concept(77, "Listen, Learn, and Sing!", "Use time wisely."),
          concept(77, "Listen, Learn, and Sing!", "Follow your weekly routine."),
          concept(78, "Listen, Learn, and Sing!", "Circle the smiley face for the good actions:"),
          concept(78, "Listen, Learn, and Sing!", "Color the smiley faces if you did the following:"),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: "Let's Learn With a Story!",
        title: "Let's Learn With a Story!",
        printedHead: "Let's Learn With a Story!",
        bookFrom: 79,
        concepts: [
          concept(79, "Let's Learn With a Story!", "Listen and act out the dialog with a friend:"),
          concept(80, "Let's Learn With a Story!", "Think back to the dialog:"),
          concept(80, "Let's Learn With a Story!", "Listen and put (✔) or (x):"),
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: "Sing and Chant with Me!",
        title: "Sing and Chant with Me!",
        printedHead: "Sing and Chant with Me!",
        bookFrom: 81,
        concepts: [concept(81, "Sing and Chant with Me!", "Days of the Week Song :")],
      },
      {
        key: "3-7",
        ordinal: "السابع",
        type: "Unit 3 Review",
        title: "Unit 3 Review",
        printedHead: "Unit 3 Review",
        bookFrom: 82,
        concepts: [
          concept(82, "Unit 3 Review", "Trace, match, and color:"),
          concept(82, "Unit 3 Review", "Color the days of the week rocket:"),
          concept(82, "Unit 3 Review", "Count and circle the correct number:"),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "الرابعة",
    title: "Unit 4: My Busy Day!",
    printedHead: "My Busy Day!",
    bookFrom: 83,
    bookTo: 106,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: "My Busy Day!",
        title: "My Busy Day!",
        printedHead: "My Busy Day!",
        bookFrom: 83,
        concepts: [concept(83, "My Busy Day!", "Look, say, and point:")],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: "Look, listen, and point:",
        title: "Look, listen, and point:",
        printedHead: "Look, listen, and point:",
        bookFrom: 84,
        concepts: [concept(84, "Look, listen, and point:", "Look, listen, and point:")],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: "My Daily Routine.",
        title: "Lesson 1: My Daily Routine.",
        printedHead: "My Daily Routine.",
        bookFrom: 85,
        concepts: [
          concept(85, "My Daily Routine.", "Listen, point, and say:"),
          concept(86, "My Daily Routine.", "Listen, point, and circle:"),
          concept(86, "My Daily Routine.", "Point and match:"),
          concept(87, "My Daily Routine.", "My Day in Pictures"),
          concept(87, "My Daily Routine.", "Now it's your turn to express:"),
        ],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        type: "Letters and Sounds:",
        title: "Letters and Sounds:",
        printedHead: "Letters and Sounds:",
        bookFrom: 88,
        concepts: [
          concept(88, "Letters and Sounds:", "Look and say:"),
          concept(89, "Letters and Sounds:", "Follow the Arrows, Make the letters!"),
          concept(90, "Letters and Sounds:", "Trace letter Ww in its upper and lowercase forms:"),
          concept(90, "Letters and Sounds:", "Match the pictures that begin with Ww:"),
          concept(91, "Letters and Sounds:", "Trace letter Cc in its upper and lowercase forms:"),
          concept(91, "Letters and Sounds:", "Color the beginning letter:"),
          concept(92, "Letters and Sounds:", "Listen, point, and repeat:"),
          concept(93, "Letters and Sounds:", "Look, count, and say:"),
          concept(94, "Letters and Sounds:", "Point, count, then trace:"),
          concept(94, "Letters and Sounds:", "Follow the Arrows, Make the numbers!"),
          concept(95, "Letters and Sounds:", "Point, count, and match:"),
          concept(96, "Letters and Sounds:", "Look and say:"),
          concept(97, "Letters and Sounds:", "Follow the Arrows, Make the letters!"),
          concept(98, "Letters and Sounds:", "Trace letter Rr in its upper and lowercase forms:"),
          concept(98, "Letters and Sounds:", "Help the pictures find their letter:"),
          concept(99, "Letters and Sounds:", "Trace letter Uu in its upper and lowercase forms:"),
          concept(99, "Letters and Sounds:", "Circle the pictures that start with the same letter:"),
          concept(100, "Letters and Sounds:", "My Day in Pictures"),
          concept(100, "Letters and Sounds:", "Take a picture out, say its name, then put it in the box of the beginning letter."),
        ],
        extraBookPages: [116, 117],
      },
      {
        key: "4-5",
        ordinal: "الخامس",
        type: "Listen, Learn, and Sing!",
        title: "Lesson 3: Listen, Learn, and Sing!",
        printedHead: "Listen, Learn, and Sing!",
        bookFrom: 101,
        concepts: [
          concept(101, "Listen, Learn, and Sing!", "Take care of your personal hygiene."),
          concept(101, "Listen, Learn, and Sing!", "Be neat."),
          concept(101, "Listen, Learn, and Sing!", "Eat healthy food."),
          concept(102, "Listen, Learn, and Sing!", "Circle the smiley face for the good actions:"),
          concept(102, "Listen, Learn, and Sing!", "Color the smiley faces if you did the following:"),
        ],
      },
      {
        key: "4-6",
        ordinal: "السادس",
        type: "Let's Learn With a Story!",
        title: "Let's Learn With a Story!",
        printedHead: "Let's Learn With a Story!",
        bookFrom: 103,
        concepts: [
          concept(103, "Let's Learn With a Story!", "Listen and talk about your daily routine:"),
          concept(104, "Let's Learn With a Story!", "Think back to the story:"),
          concept(104, "Let's Learn With a Story!", "Listen and circle the correct answer:"),
        ],
      },
      {
        key: "4-7",
        ordinal: "السابع",
        type: "Unit 4 Review",
        title: "Unit 4 Review",
        printedHead: "Unit 4 Review",
        bookFrom: 105,
        concepts: [
          concept(105, "Unit 4 Review", "Trace, match, and color:"),
          concept(105, "Unit 4 Review", "Arrange the daily routine actions by matching:"),
          concept(105, "Unit 4 Review", "Count, match, and trace:"),
        ],
      },
      {
        key: "4-8",
        ordinal: "الثامن",
        type: "Sing and Chant with Me!",
        title: "Sing and Chant with Me!",
        printedHead: "Sing and Chant with Me!",
        bookFrom: 106,
        concepts: [concept(106, "Sing and Chant with Me!", "My Day Song :")],
      },
    ],
  },
  {
    key: "review",
    kind: "review",
    ordinal: "",
    title: "Review",
    printedHead: "Review",
    bookFrom: 107,
    bookTo: 112,
    lessons: [
      {
        key: "review-1",
        ordinal: "الأول",
        type: "Review",
        title: "Use the right color for each picture:",
        printedHead: "Use the right color for each picture:",
        bookFrom: 107,
        concepts: [
          concept(107, "Review", "Use the right color for each picture:"),
          concept(107, "Review", "Match the meal to the time:"),
        ],
      },
      {
        key: "review-2",
        ordinal: "الثاني",
        type: "Review",
        title: "Circle the correct beginning letter:",
        printedHead: "Circle the correct beginning letter:",
        bookFrom: 108,
        concepts: [concept(108, "Review", "Circle the correct beginning letter:")],
      },
      {
        key: "review-3",
        ordinal: "الثالث",
        type: "Review",
        title: "Match each picture to its beginning letter:",
        printedHead: "Match each picture to its beginning letter:",
        bookFrom: 109,
        concepts: [
          concept(109, "Review", "Match each picture to its beginning letter:"),
          concept(109, "Review", "Circle the picture that matches the letter:"),
        ],
      },
      {
        key: "review-4",
        ordinal: "الرابع",
        type: "Review",
        title: "Count and circle the correct number:",
        printedHead: "Count and circle the correct number:",
        bookFrom: 110,
        concepts: [
          concept(110, "Review", "Count and circle the correct number:"),
          concept(110, "Review", "Draw 2 circles:"),
          concept(110, "Review", "Draw 4 circles:"),
        ],
      },
      {
        key: "review-5",
        ordinal: "الخامس",
        type: "Review",
        title: "Count and match:",
        printedHead: "Count and match:",
        bookFrom: 111,
        concepts: [
          concept(111, "Review", "Count and match:"),
          concept(111, "Review", "Color 7 clouds:"),
          concept(111, "Review", "Color 10 clouds:"),
        ],
      },
      {
        key: "review-6",
        ordinal: "السادس",
        type: "Review",
        title: "Look at the picture and circle:",
        printedHead: "Look at the picture and circle:",
        bookFrom: 112,
        concepts: [
          concept(112, "Review", "Look at the picture and circle:"),
          concept(112, "Review", "Match the clothing item to the body part:"),
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
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_ENGLISH_KG2_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ENGLISH_KG2_T1_SECTIONS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * The appendix page(s) each lesson points to, keyed by the lesson key: the
 * Unit 1 Lesson 2 kite page (114), the Unit 2 Lesson 2 donkey-poster page
 * (113), the Unit 3 Lesson 2 flower-poster (115) and dice (118) pages, and
 * the Unit 4 Lesson 2 cat-poster (116) and pictures (117) pages.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const section of EGYPT_ENGLISH_KG2_T1_SECTIONS) {
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
  "english-kg2-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (No term page of this book needs it — every page of [1, 112]
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
 * The document a lesson grounds the tutor in: its own page range in order,
 * plus any appendix pages it points to (the craft pages for the four
 * Lesson 2 blocks).
 */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(sectionIndex, lessonIndex);
  const lesson = EGYPT_ENGLISH_KG2_T1_SECTIONS[sectionIndex]!.lessons[lessonIndex]!;
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
 * furniture at the top or the foot — bare on its own line («3», «42»,
 * «112»), sometimes mid-page where the layout puts it («4» between
 * «pencil» and «books», «10» between the action words, «101» after the
 * song) — so the top and bottom furniture lines each contribute both their
 * space-stripped whole and every whitespace-separated digit token. Body
 * numerals (counts «1 head», options «2 / 1», trace targets, and the
 * cross-page pointers «Refer to page 114 …») join the candidate set
 * harmlessly: the page's own number proves the mapping when present, via
 * `printedFooter`.
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
 * mismatch). The two unit-review pages (30, 82) print their folio mid-page
 * outside the checked furniture and are exempted via `FOLIO_LESS_ANCHORS`.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * Folios whose OCR printed a different, still parseable number. Every folio
 * in this born-digital book came out right, so the map is empty and the folio
 * check stays exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no folio in the checked furniture, each with the
 * anchor the check accepts in place of a page number: the Unit 1 review
 * (book 30, whose «30» sits between «J j» and «Circle what you can do:»)
 * and the Unit 3 review (book 82, whose «82» sits between «L l» and «Color
 * the days of the week rocket:»), each anchored on the review head the page
 * itself prints.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  30: "Unit 1 Review",
  82: "Unit 3 Review",
};

/** Every head kind the table may use. */
const KNOWN_KINDS = new Set([
  "Remember With Me!",
  "Greetings",
  "My School, My Classroom",
  "My School Bag!",
  "My Family",
  "My Body Parts",
  "Little Bodies, Big Moves!",
  "Look, listen, and point:",
  "On the Move!",
  "Letters and Sounds:",
  "Listen, Learn, and Sing!",
  "Let's Learn With a Story!",
  "Let’s Learn With a Story!",
  "Sing and Chant with Me!",
  "Unit 1 Review",
  "Let's Get Dressed!",
  "Clothing Items",
  "Unit 2 Review",
  "My Week!",
  "What day is it?",
  "Unit 3 Review",
  "My Busy Day!",
  "My Daily Routine.",
  "Unit 4 Review",
  "Review",
]);

/**
 * Table invariants: lesson keys follow (section-lesson), every range sits
 * inside its section, concept pages rise inside their lesson, the sections
 * tile the term without gaps or overlaps, and the first/last sections hit the
 * book's own bounds. A content mistake here would quietly ground the tutor on
 * the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_ENGLISH_KG2_T1_SECTIONS;

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
  if (first && first.bookFrom !== EGYPT_ENGLISH_KG2_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ENGLISH_KG2_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ENGLISH_KG2_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ENGLISH_KG2_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number from
 *     the folio in its furniture (`FOLIO_LESS_ANCHORS` names the two review
 *     pages whose folio sits mid-page; `MISSING_SCANS` is empty: no term scan
 *     is absent);
 *  2. every section opener prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title (or its printed head) and every activity's head is
 *     printed on the pages the lesson owns (the activity on its own page);
 *  4. every page in [1, 112] is owned by exactly one lesson — no page falls
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
  const sections = EGYPT_ENGLISH_KG2_T1_SECTIONS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ENGLISH_KG2_T1_BOOK_START || book > EGYPT_ENGLISH_KG2_T1_BOOK_END) continue;
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
  for (let p = EGYPT_ENGLISH_KG2_T1_BOOK_START; p <= EGYPT_ENGLISH_KG2_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_ENGLISH_KG2_T1_BOOK_END - EGYPT_ENGLISH_KG2_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_ENGLISH_KG2_T1_BOOK_START} و${EGYPT_ENGLISH_KG2_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
