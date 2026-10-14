// Official Egypt Primary-4 (Grade 4) Science, English-medium, first term —
// Ministry of Education and Technical Education edition prepared with
// Discovery Education (cover imprint «2025», Science Techbook programme).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g4-science-en`, subject `science-en` (name "Science (English)"),
// lesson prefix `l-g4-sci-en-`, grade `grade-4` (name "Primary 4").
//
// The curriculum tree for the Egypt `eg-g4-science-en` curriculum is rebuilt
// from the Ministry textbook `Science — Primary 4 — Term 1` (130 scanned
// pages). This module is the single source of truth for its structure: the
// two printed units of the first term (Unit 1: Living Systems, Unit 2:
// Motion), every numbered lesson inside them (24 recorded lessons — see the
// void-spread note below — exactly as the book's own «Table of Contents» on
// scans 9–10 lists them), and, for every lesson, the book's own printed
// heads — the «Lesson N» head plus the «Activity M … Like a Scientist»
// activity heads the pages print — verbatim and with the printed page they
// start on. The self-checks at the bottom prove that mapping against the OCR
// itself, page by page.
//
// THE OFFSET IS ELEVEN — book page = scan page − 11
// Every content page that carries a folio prints its own number in its
// running head, so `BOOK_TO_PDF_OFFSET` is fixed by the scans and quoted
// here: scan 12 prints «1 Unit 1: Living Systems 1» (book 1, the Unit-1
// opener), scan 32 prints «21 Concept 1.1 … 21» (book 21), scan 78 prints
// «67 Unit 2: Motion 67» (book 67, the Unit-2 opener), scan 113 prints
// «1 02 102 102» (book 102) and scan 128 prints «1 17 Unit 2: Motion»
// (book 117, the term's last page). The book's own Table of Contents (scans
// 9–10) independently confirms the lesson starts: every «Lesson» sits
// exactly where the contents says it does (5, 8, 14, 21, 23, 27, 30, 33,
// 36, 41, 46, 50, 52, 71, 74, 77, 81, 85, 88, 90, 94, 97, 101, 105, 107).
//
// TERM = THE NUMBERED BOOK PAGES (books 1–117)
// Scan pages 1–11 are before the term: the cover (1–2, no text layer), the
// «Name» page (3, folio «ii»), the copyright page (4, folio «iii»), the
// review page (5, folio «iv»), the «FOREWORD» (6, folio «v»), the parent
// letter (7–8, folios «vi»–«vii») and the printed «Table of Contents»
// (9–10, folios «viii»–«ix») plus a blank verso (11, no text layer). Scan
// pages 129–130 are after the term: the print-specification page (129) and
// the back cover (130, no text layer). The term runs from the Unit-1
// «Get Started» opener (book 1 = scan 12) to the second Safety page (book
// 117 = scan 128): `EGYPT_SCIENCE_EN_G4_T1_BOOK_START` / `_BOOK_END` are
// exactly those two pages, and the tiling assertion proves nothing in
// between is left unreachable. `pagesChecked` is therefore
// 117 − 1 + 1 − 6 = 111 (six void scans, see below).
//
// SIX TERM SCANS HAVE NO TEXT LAYER — ALL ARE DOCUMENTED, NONE IS SKIPPED
// Scans 30, 44, 77, 99, 100 and 112 are present as 0-byte files: the
// extractor produced no text for them (books 19, 33, 66, 88, 89 and 101).
// They are listed in `MISSING_SCANS` (as book pages, as in the Grade-5
// English spec), stay owned by exactly one lesson each (the tiling check
// still requires it), and are skipped only where the book itself cannot be
// quoted — the folio and text proof — exactly as absent scans are.
// Books 19, 33, 66 and 101 sit inside lessons whose other pages carry text;
// books 88–89 are a whole void spread (see the next note).
//
// THE VOID SPREAD AT BOOKS 88–89 (CONCEPT 2.2 «LESSON 2»)
// The contents lists Concept 2.2 Lesson 2 at book 88, but scans 99–100
// (books 88–89) yielded no text at all, so the lesson's head cannot be
// quoted verbatim from its mapped scans and no tree node is invented for
// it. Exactly as the Grade-1 Discovery spec keeps its missing pages inside
// their owning lesson, both void pages are owned by the lesson before them
// — Concept 2.2 Lesson 1 (lesson 2-5, range 85–89). Unit 2 therefore
// records 11 lessons instead of the contents' 12; nothing else is merged
// or renamed, and every recorded lesson keeps its contents page.
// (The neighbouring void openers — book 33, Concept 1.2 Lesson 3, and book
// 101, Concept 2.3 Lesson 2 — are different: their ranges carry text on
// books 34–35 and 102–104, so both lessons are recorded with `bookFrom`
// at the contents page and their heads quoted from the surviving pages.)
//
// TWO CONCEPT OPENERS PRINT NO FOLIO — EACH CARRIES A QR CODE INSTEAD
// Books 40 and 84 are the «CONCEPT 1.3» and «CONCEPT 2.2» openers (Student
// Objectives + Key Vocabulary). Neither prints a page number: the folio's
// place holds the book's QR-code digit dump («4 4 4 … 0 0 0» /
// «8 8 8 … 4 4 4»). Rather than weaken the page-number check, both are
// anchored on the concept head each page itself prints, named in
// `FOLIO_LESS_ANCHORS`. Every other OCR'd term page proves its own number
// from the running head, so `FOOTER_OCR_MISREADS` is empty and no folio the
// OCR could parse mismatches its page.
//
// THE FOLIO CHECK READS THE RUNNING HEAD'S FIRST AND LAST LINES
// Even pages print «N … N» (folio at both ends, sometimes glued «8 8»),
// odd pages print «N Concept …» (folio leading), and late Unit-2 pages
// letter-space it («1 02 102 102», «1 03», «10 8 10 8 10 8», «11 2» … «1 17»).
// `footerCandidates` therefore reads the first four and the last four lines
// and accepts bare numerals there — joining a leading run of digit tokens
// so a spaced folio («1 03» → 103) still proves its page. Lesson, concept
// and activity numbers join the candidate set harmlessly: the page's own
// number proves the mapping when present.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every recorded lesson contributes its «Lesson N» head (number + word,
// exactly as the opener prints it — the text layer splits it across two
// lines, «Lesson» / «N», which `normalize` rejoins) plus one concept per
// printed activity: «Activity M» glued to the Like-a-Scientist title on the
// very next line («Activity 4 Analyze Like a Scientist»), transcribed
// verbatim from the page it starts on. Nothing is invented: every concept
// title below is a string the book itself prints on the page its `bookFrom`
// names. The Talk-Together prompts, Life-Skills lines, Hands-On sub-heads
// and figure captions carry no activity number of their own, so they
// contribute no concept of their own — same as the Grade-5 English spec's
// marginal boxes.
//
// LESSON TITLES ARE THE OPENER'S OWN TOPIC HEAD
// Each lesson's `title` (and, except on the two void openers, its
// `printedHead`) is the distinctive head its opener prints: the figure or
// investigation topic («Desert Lizard», «Types of Adaptations»,
// «What Happens When Light Strikes Matter?», …). The three pure-intro
// openers (books 41, 71, 97) print no topic of their own, so those lessons
// keep the Activity 1 head the opener does print («Can You Explain?»).
// The two void openers (books 33, 101) keep the lesson head their ranges
// do print («Lesson 3», «Lesson 2») as `printedHead`.
//
// CONCEPT OPENERS RIDE WITH THE LESSONS THEY TOUCH
// Each unit's first lesson starts on the unit's own «Get Started» page
// (books 1 and 67 print no lesson head of their own), so `lessonBookRange`
// starts a unit's first lesson at the section head, exactly as the other
// Egyptian specs do. The mid-unit «CONCEPT» openers land where the tiling
// puts them: book 26 closes lesson 1-5, book 40 closes lesson 1-9, book 70
// opens lesson 2-1, book 84 closes lesson 2-4 and book 96 closes lesson
// 2-7. The Unit Projects, the Interdisciplinary Project, the «Assess your
// learning» pages and the two Safety pages close their unit's last lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 11 (verified: book p.117 = scan p.128). */
export const BOOK_TO_PDF_OFFSET = 11;

/** First printed page of the term — the Unit-1 «Get Started» opener (scan 12). */
export const EGYPT_SCIENCE_EN_G4_T1_BOOK_START = 1;

/** Last printed page of the term — the second Safety page (scan 128). */
export const EGYPT_SCIENCE_EN_G4_T1_BOOK_END = 117;

/** The scanned pages before the term: cover, Name, copyright, review, foreword, parent letter, contents, blank verso. */
export const EGYPT_SCIENCE_EN_G4_T1_FRONT_MATTER = { from: 1, to: 11 } as const;

/** The scanned pages after the term: the print-specification page and the back cover. */
export const EGYPT_SCIENCE_EN_G4_T1_BACK_MATTER = { from: 129, to: 130 } as const;

/**
 * The term pages the OCR never produced, in book pages. Scans 30, 44, 77,
 * 99, 100 and 112 exist as 0-byte files — each still owned by exactly one
 * lesson (its `lessonBookRange`), but with no text to check; the strong
 * check skips their folio/text proof and `pagesChecked` is the full term
 * range minus these six. Books 88–89 are the whole of the contents'
 * Concept 2.2 Lesson 2 (see the header note); the other four sit inside
 * lessons whose surviving pages prove them.
 */
export const MISSING_SCANS: readonly number[] = [19, 33, 66, 88, 89, 101];

/** One printed head of the textbook — becomes one concept in the app tree. */
export interface ScienceEnG4T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The head's own printed label: "Lesson" or "Activity". */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson of the book — becomes one lesson in the app tree. */
export interface ScienceEnG4T1Lesson {
  /** App-addressable key, e.g. "1-3" (unit 1, lesson 3). */
  key: string;
  /** Arabic ordinal of the lesson number within its unit, e.g. "الثالث". */
  ordinal: string;
  /** The lesson's opening head type — its first concept's kind ("Lesson"). */
  type: string;
  /** Lesson title: the opener's own topic head (see the header note). */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`): the topic head, or — on the two void
   * openers (books 33, 101) — the lesson head the range prints.
   */
  printedHead: string;
  /** First printed book page of the lesson itself (its contents page). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: ScienceEnG4T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed unit of the term. */
export interface ScienceEnG4T1Unit {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"2", in book order. */
  key: string;
  /** Arabic ordinal of the unit as used in the app tree, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "Unit 1: Living Systems". */
  title: string;
  /** The unit head its opener prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next opener). */
  bookTo: number;
  lessons: ScienceEnG4T1Lesson[];
}

const LESSON = "Lesson";
const ACTIVITY = "Activity";

function concept(bookFrom: number, kind: string, title: string): ScienceEnG4T1Concept {
  return { bookFrom, kind, title };
}

function lessonHead(bookFrom: number, title: string): ScienceEnG4T1Concept {
  return concept(bookFrom, LESSON, title);
}

function activity(bookFrom: number, title: string): ScienceEnG4T1Concept {
  return concept(bookFrom, ACTIVITY, title);
}

/**
 * The two units of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit ranges come from the pages' own «Unit N» openers: 1–66 and 67–117.
 * Lesson starts come from the «Lesson N» openers and match the book's Table
 * of Contents, except that the contents' Concept 2.2 Lesson 2 (books 88–89,
 * a void spread) is owned by lesson 2-5 — see the header note.
 */
export const EGYPT_SCIENCE_EN_G4_T1_UNITS: ScienceEnG4T1Unit[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "Unit 1: Living Systems",
    printedHead: "Unit 1: Living Systems",
    bookFrom: 1,
    bookTo: 66,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: LESSON,
        title: "Desert Lizard",
        printedHead: "Desert Lizard",
        bookFrom: 5,
        concepts: [
          lessonHead(5, "Lesson 1"),
          activity(5, "Activity 1 Can You Explain?"),
          activity(6, "Activity 2 Ask Questions Like a Scientist"),
          activity(7, "Activity 3 Observe Like a Scientist"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "Types of Adaptations",
        printedHead: "Types of Adaptations",
        bookFrom: 8,
        concepts: [
          lessonHead(8, "Lesson 2"),
          activity(8, "Activity 4 Analyze Like a Scientist"),
          activity(10, "Activity 5 Observe Like a Scientist"),
          activity(12, "Activity 6 Analyze Like a Scientist"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "Plant Scientist",
        printedHead: "Plant Scientist",
        bookFrom: 14,
        concepts: [
          lessonHead(14, "Lesson 3"),
          activity(14, "Activity 7 Think Like a Scientist"),
          activity(16, "Activity 8 Observe Like a Scientist"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "How Fish Breathe",
        printedHead: "How Fish Breathe",
        bookFrom: 21,
        concepts: [lessonHead(21, "Lesson 4"), activity(21, "Activity 10 Observe Like a Scientist")],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "Penguin",
        printedHead: "Penguin",
        bookFrom: 23,
        concepts: [
          lessonHead(23, "Lesson 5"),
          activity(23, "Activity 12 Record Evidence Like a Scientist"),
          activity(24, "Activity 13 Analyze Like a Scientist"),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: LESSON,
        title: "Egyptian mongoose",
        printedHead: "Egyptian mongoose",
        bookFrom: 27,
        concepts: [
          lessonHead(27, "Lesson 1"),
          activity(27, "Activity 1 Can You Explain?"),
          activity(28, "Activity 2 Ask Questions Like a Scientist"),
          activity(29, "Activity 3 Evaluate Like a Scientist"),
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        type: LESSON,
        title: "Senses for nocturnal",
        printedHead: "Senses for nocturnal",
        bookFrom: 30,
        concepts: [
          lessonHead(30, "Lesson 2"),
          activity(30, "Activity 4 Observe Like a Scientist"),
          activity(31, "Activity 5 Analyze Like a Scientist"),
          activity(32, "Activity 6 Evaluate Like a Scientist"),
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "Describing the Nervous System",
        printedHead: "Lesson 3",
        bookFrom: 33,
        concepts: [lessonHead(34, "Lesson 3"), activity(34, "Activity 8 Evaluate Like a Scientist")],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "How Animals Use Communication Systems",
        printedHead: "How Animals Use Communication Systems",
        bookFrom: 36,
        concepts: [
          lessonHead(36, "Lesson 4"),
          activity(36, "Activity 9 Observe Like a Scientist"),
          activity(38, "Activity 10 Analyze Like a Scientist"),
        ],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        type: LESSON,
        title: "Can You Explain?",
        printedHead: "Can You Explain?",
        bookFrom: 41,
        concepts: [
          lessonHead(41, "Lesson 1"),
          activity(41, "Activity 1 Can You Explain?"),
          activity(42, "Activity 2 Ask Questions Like a Scientist"),
          activity(44, "Activity 3 Evaluate Like a Scientist"),
        ],
      },
      {
        key: "1-11",
        ordinal: "الحادي عشر",
        type: LESSON,
        title: "What Happens When Light Strikes Matter?",
        printedHead: "What Happens When Light Strikes Matter?",
        bookFrom: 46,
        concepts: [
          lessonHead(46, "Lesson 2"),
          activity(46, "Activity 4 Investigate Like a Scientist"),
          activity(48, "Activity 5 Analyze Like a Scientist"),
        ],
      },
      {
        key: "1-12",
        ordinal: "الثاني عشر",
        type: LESSON,
        title: "Firefly Light Show",
        printedHead: "Firefly Light Show",
        bookFrom: 50,
        concepts: [
          lessonHead(50, "Lesson 3"),
          activity(50, "Activity 6 Record Evidence Like a Scientist"),
          activity(51, "Activity 7 Evaluate Like a Scientist"),
        ],
      },
      {
        key: "1-13",
        ordinal: "الثالث عشر",
        type: LESSON,
        title: "How Do We Transfer Information?",
        printedHead: "How Do We Transfer Information?",
        bookFrom: 52,
        concepts: [
          lessonHead(52, "Lesson 4"),
          activity(52, "Activity 8 Analyze Like a Scientist"),
          activity(53, "Activity 9 Evaluate Like a Scientist"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "Unit 2: Motion",
    printedHead: "Unit 2: Motion",
    bookFrom: 67,
    bookTo: 117,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: LESSON,
        title: "Can You Explain?",
        printedHead: "Can You Explain?",
        bookFrom: 71,
        concepts: [
          lessonHead(71, "Lesson 1"),
          activity(71, "Activity 1 Can You Explain?"),
          activity(72, "Activity 2 Ask Questions Like a Scientist"),
          activity(73, "Activity 3 Observe Like a Scientist"),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "What Do You Already Know About Starting and Stopping?",
        printedHead: "What Do You Already Know About Starting and Stopping?",
        bookFrom: 74,
        concepts: [
          lessonHead(74, "Lesson 2"),
          activity(74, "Activity 4 Observe Like a Scientist"),
          activity(75, "Activity 5 Analyze Like a Scientist"),
          activity(76, "Activity 6 Observe Like a Scientist"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "What Makes Moving Objects stop?",
        printedHead: "What Makes Moving Objects stop?",
        bookFrom: 77,
        concepts: [
          lessonHead(77, "Lesson 3"),
          activity(77, "Activity 7 Analyze Like a Scientist"),
          activity(79, "Activity 8 Investigate Like a Scientist"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "Energy, Work, and Force",
        printedHead: "Energy, Work, and Force",
        bookFrom: 81,
        concepts: [
          lessonHead(81, "Lesson 4"),
          activity(81, "Activity 9 Observe Like a Scientist"),
          activity(82, "Activity 10 Record Evidence Like a Scientist"),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "Can You Explain?",
        printedHead: "Can You Explain?",
        bookFrom: 85,
        concepts: [
          lessonHead(85, "Lesson 1"),
          activity(85, "Activity 1 Can You Explain?"),
          activity(86, "Activity 2 Ask Questions Like a Scientist"),
          activity(87, "Activity 3 Evaluate Like a Scientist"),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: LESSON,
        title: "What Are the Different Forms of Potential and Kinetic Energy?",
        printedHead: "What Are the Different Forms of Potential and Kinetic Energy?",
        bookFrom: 90,
        concepts: [
          lessonHead(90, "Lesson 3"),
          activity(90, "Activity 6 Analyze Like a Scientist"),
          activity(92, "Activity 7 Observe Like a Scientist"),
        ],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        type: LESSON,
        title: "Easy Life Tool",
        printedHead: "Easy Life Tool",
        bookFrom: 94,
        concepts: [
          lessonHead(94, "Lesson 4"),
          activity(94, "Activity 8 Evaluate Like a Scientist"),
          activity(95, "Activity 9 Record Evidence Like a Scientist"),
        ],
      },
      {
        key: "2-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "Can You Explain?",
        printedHead: "Can You Explain?",
        bookFrom: 97,
        concepts: [
          lessonHead(97, "Lesson 1"),
          activity(97, "Activity 1 Can You Explain?"),
          activity(98, "Activity 2 Ask Questions Like a Scientist"),
          activity(99, "Activity 3 Observe Like a Scientist"),
        ],
      },
      {
        key: "2-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "Basics of Speed, continued",
        printedHead: "Lesson 2",
        bookFrom: 101,
        concepts: [lessonHead(102, "Lesson 2"), activity(103, "Activity 5 Investigate Like a Scientist")],
      },
      {
        key: "2-10",
        ordinal: "العاشر",
        type: LESSON,
        title: "What do we observe when objects collide?",
        printedHead: "What do we observe when objects collide?",
        bookFrom: 105,
        concepts: [
          lessonHead(105, "Lesson 3"),
          activity(105, "Activity 6 Analyze Like a Scientist"),
          activity(106, "Activity 7 Analyze Like a Scientist"),
        ],
      },
      {
        key: "2-11",
        ordinal: "الحادي عشر",
        type: LESSON,
        title: "Hands-On Investigation: Speed and Collisions",
        printedHead: "Hands-On Investigation: Speed and Collisions",
        bookFrom: 107,
        concepts: [
          lessonHead(107, "Lesson 4"),
          activity(107, "Activity 8 Investigate Like a Scientist"),
          activity(109, "Activity 9 Analyze Like a Scientist"),
          activity(111, "Activity 10 Analyze Like a Scientist"),
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
 * lesson — the «Get Started» opener) or its own start page, up to the
 * page before the next lesson starts, or the section's last page for its last
 * lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_SCIENCE_EN_G4_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SCIENCE_EN_G4_T1_UNITS.forEach((section, si) => {
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
  for (const section of EGYPT_SCIENCE_EN_G4_T1_UNITS) {
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
  "science-en-g4-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (No OCR'd term page of this book needs it — the six textless scans
 * are 0-byte files listed in `MISSING_SCANS` — but the guard keeps the loader
 * the same shape across the books.)
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
  const lesson = EGYPT_SCIENCE_EN_G4_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
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
 * Page-number candidates a content page prints. This book's folio always rides
 * in the running head at the top of the page («8 8», «21 Concept 1.1 … 21»,
 * «1 02 102 102», «10 8 10 8 10 8», «1 17»), glued or letter-spaced, so the
 * top and bottom furniture lines each contribute both their space-stripped
 * whole and every whitespace-separated digit token — plus a leading run of
 * digit tokens joined («1 03» → 103), which is the only shape the
 * letter-spaced folios take. Lesson, concept and activity numbers join the
 * candidate set harmlessly: the page's own number proves the mapping when
 * present.
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
    const tokens = line.split(/\s+/);
    for (const token of tokens) {
      if (/^\d{1,3}$/.test(token)) numbers.add(Number(token));
    }
    const run: string[] = [];
    for (const token of tokens) {
      if (/^\d{1,3}$/.test(token)) run.push(token);
      else break;
    }
    for (let k = 2; k <= run.length; k++) {
      const glued = run.slice(0, k).join("");
      if (/^\d{1,3}$/.test(glued) && Number(glued) > 0) numbers.add(Number(glued));
    }
  }
  return [...numbers].sort((a, b) => a - b);
}

/**
 * The book number a content page prints, or null when it prints none. Returns
 * the page's own number when it is among the candidates, otherwise the largest
 * candidate (so a wrong page still reports a number and the caller can see the
 * mismatch). The two «CONCEPT» openers (books 40 and 84) print a QR-code
 * digit dump instead of any folio, so those pages are exempted via
 * `FOLIO_LESS_ANCHORS`.
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
 * The term pages that print no folio at all, each with the anchor the check
 * accepts in place of a page number: the «CONCEPT 1.3» opener (book 40) and
 * the «CONCEPT 2.2» opener (book 84), whose folio place holds the QR-code
 * digit dump. Each anchor is the concept head its own page prints.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  40: "CONCEPT 1.3",
  84: "CONCEPT 2.2",
};

/** Every head kind the table may use. */
const KNOWN_KINDS = new Set([LESSON, ACTIVITY]);

/**
 * Table invariants: lesson keys are unique and follow (section-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_SCIENCE_EN_G4_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_SCIENCE_EN_G4_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_SCIENCE_EN_G4_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SCIENCE_EN_G4_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_SCIENCE_EN_G4_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     the folio in its running head, or, on the two pages named in
 *     `FOLIO_LESS_ANCHORS`, from the anchor the page itself prints. The six
 *     0-byte scans in `MISSING_SCANS` carry no text to prove anything with and
 *     are not iterated (they stay owned by their lesson ranges below);
 *  2. every section opener prints the section head and every lesson's first
 *     page prints that lesson's head (void openers carry no text and are
 *     exempt from the head proof, exactly as textless first pages are);
 *  3. every lesson's title (or its printed head) and every activity's head is
 *     printed on the pages the lesson owns (the activity on its own page);
 *  4. every page in [1, 117] is owned by exactly one lesson — no page falls
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
  const sections = EGYPT_SCIENCE_EN_G4_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SCIENCE_EN_G4_T1_BOOK_START || book > EGYPT_SCIENCE_EN_G4_T1_BOOK_END) continue;
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
  for (let p = EGYPT_SCIENCE_EN_G4_T1_BOOK_START; p <= EGYPT_SCIENCE_EN_G4_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_SCIENCE_EN_G4_T1_BOOK_END - EGYPT_SCIENCE_EN_G4_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_SCIENCE_EN_G4_T1_BOOK_START} و${EGYPT_SCIENCE_EN_G4_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
