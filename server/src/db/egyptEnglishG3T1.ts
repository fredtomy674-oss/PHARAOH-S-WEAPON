// Egypt Primary 3 (Grade 3) English, first term — OFFICIAL curriculum.
//
// The first term IS the Ministry textbook (Primary 3 English, Term 1,
// 2025/2026 Ministry of Education and Technical Education edition; 120 scan
// pages, all with a born-digital English text layer). This file is the book's
// table: the six units of its Scope and Sequence plus the two reviews bound
// after Unit 3 and after Unit 6, each with its printed lesson heads and the
// exact book pages they occupy. It is the single source of truth the seeder
// and the stage both read; the self-checks at the bottom prove the page
// mapping against the scan, page by page.
//
// THE OFFSET IS ZERO — book page = scan page
// Every numbered content page prints its own folio, always in the running head
// at the TOP of the page, glued to the page furniture: scan 6 opens «Lesson 1
// 6», scan 7 «UNIT UNIT 1 1 7», scan 27 «UNIT UNIT 2 2 27», scan 63 «63 Review
// 1 R e v i e w 1», scan 83 «83 Lesson 1», scan 104 «Lesson 104», scan 117
// «117 Review 2 R e v i e w 2». A book page N is therefore scan page N
// (`BOOK_TO_PDF_OFFSET = 0`). The book counts its cover as page 1: scans 1–4
// (cover, Ministry dedication, Ministry message, Scope and Sequence) print no
// folio of their own.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–4 are the cover, the dedication page, the Ministry message and
// the Scope and Sequence. Scan pages 118–119 are the Glossary and scan 120 is
// the copyright/credits page. None of them is a lesson. The term runs from the
// Unit 1 Learning Outcomes (scan 5) to the end of «Review 2» (scan 117):
// `EGYPT_ENGLISH_G3_T1_BOOK_START`/`_END` are exactly those two pages, and the
// tiling assertion proves nothing in between is left unreachable.
//
// ONE UNIT = ONE SECTION, ONE PRINTED «LESSON n» = ONE LESSON
// The book prints four lessons per unit — each opened by a «Lesson n» head
// with its own topic subtitle (Greetings and Introductions, Classroom Rules,
// …) — plus a «Let's Review Units 1, 2, and 3» after Unit 3 and a «Let's
// Review Units 4, 5, and 6» after Unit 6. Unit 4 prints only three lessons
// (How We Feel, A Helping Hand, A Big Win): its «Lesson 4» never appears in the
// scans, and nothing is invented to fill it. A lesson's `bookFrom` is the page
// that prints its head; the range it owns runs from the section opener (for its
// first lesson — the Learning Outcomes page) or its own start page to the page
// before the next lesson starts (or to the section's last page), so the ranges
// tile each section and the sections tile the term exactly.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S PRINTED BAND HEADS
// Every unit opens with a «Learning Outcomes» page; the pages inside a lesson
// carry the book's own printed band heads — «Vocabulary», «Listening and
// Speaking», «Reading and Writing», «Language in Use», «Reading for
// Understanding», «Language Focus», «Punctuation Tips», «Self-Assessment»,
// the grammar heads («Present Simple Tense for Descriptions/Routines»,
// «Past Simple Tense», «Present Continuous Tense», «Action Verbs») and the
// phonics heads («Phonics Focus: …»). Each `concepts` entry below is one of
// those strings transcribed verbatim from the page it starts on — including
// the book's own doubled colons («Phonics Focus: : Hard "c"= /k/ sound») and
// its curly quotation marks («Phonics Focus: Digraph “wh“»). The `kind` is the
// head's own label («Phonics Focus» for the phonics heads, otherwise the head
// itself). Review concepts are the reviews' own printed exercise instructions,
// words verbatim (exercise numerals omitted). Nothing is invented; every title
// below is a string the page its `bookFrom` names prints.
//
// FIVE TERM PAGES PRINT NO FOLIO — EACH IS A UNIT OPENER
// Books 5, 43, 67, 82 and 99 are the unit «Learning Outcomes» pages; each
// prints the unit number in its head but no page folio. Rather than weaken the
// page-number check they are exempt from it in `assertTreeMatchesTheBook` and
// anchored on a string the page itself prints, named in `FOLIO_LESS_ANCHORS`.
// The Unit 2 opener (book 27) is the exception: it prints «UNIT UNIT 2 2 27»
// and so proves its own number. Every other term page proves its book number
// from the folio in its running head.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N (verified: scan 117 prints «117»). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed content page of the term — the Unit 1 Learning Outcomes. */
export const EGYPT_ENGLISH_G3_T1_BOOK_START = 5;

/** Last printed content page — the closing page of «Review 2». */
export const EGYPT_ENGLISH_G3_T1_BOOK_END = 117;

/** The scan pages before the term: cover, dedication, message, scope. */
export const EGYPT_ENGLISH_G3_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/** The scan pages after the term: glossary (118–119) and copyright (120). */
export const EGYPT_ENGLISH_G3_T1_BACK_MATTER = { from: 118, to: 120 } as const;

/**
 * The term pages the OCR never produced, in book pages. The corpus holds every
 * scan of the term (5–117), so there is no gap: the checker iterates all of
 * them and `pagesChecked` is the full `_BOOK_END - _BOOK_START + 1`.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of the textbook — becomes one concept in the app tree. */
export interface EnglishG3T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The head's own printed label, e.g. "Vocabulary" or "Phonics Focus". */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson of the book — becomes one lesson in the app tree. */
export interface EnglishG3T1Lesson {
  /** App-addressable key, e.g. "1-1" (unit 1, lesson 1) or "review1-1". */
  key: string;
  /** Arabic ordinal used in the lesson head; "" where the book numbers nothing. */
  ordinal: string;
  /** The lesson's opening head type — its first concept's kind. */
  type: string;
  /** Full app-facing lesson title, e.g. "Lesson 1: Greetings and Introductions". */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`): the lesson's topic subtitle (or the review's
   * «Let's Review …» head), e.g. "Greetings and Introductions".
   */
  printedHead: string;
  /** First printed book page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: EnglishG3T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — a unit or a review. */
export interface EnglishG3T1Section {
  /** Internal key: "1"…"6", "review1", "review2". */
  key: string;
  kind: "unit" | "review";
  /** Arabic ordinal of the unit; "" for the reviews, which the book does not number. */
  ordinal: string;
  /** Full app-facing section title, e.g. "Unit 1: Let’s Learn Together!". */
  title: string;
  /** The section head its opener page prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next section's opener). */
  bookTo: number;
  lessons: EnglishG3T1Lesson[];
}

function concept(bookFrom: number, kind: string, title: string): EnglishG3T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The book in printed order: Units 1–3 (5–62), Review 1 (63–66), Units 4–6
 * (67–113), Review 2 (114–117). Unit/lesson starts come from each printed
 * «Lesson n» head; the band heads come from the pages themselves. Every page
 * is checked against the book by `assertTreeMatchesTheBook`.
 */
export const EGYPT_ENGLISH_G3_T1_SECTIONS: EnglishG3T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "Unit 1: Let’s Learn Together!",
    printedHead: "Let’s Learn Together!",
    bookFrom: 5,
    bookTo: 26,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "Vocabulary",
        title: "Lesson 1: Greetings and Introductions",
        printedHead: "Greetings and Introductions",
        bookFrom: 6,
        concepts: [concept(6, "Vocabulary", "Vocabulary")],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: "Listening and Speaking",
        title: "Lesson 2: Classroom Rules",
        printedHead: "Classroom Rules",
        bookFrom: 10,
        concepts: [
          concept(10, "Listening and Speaking", "Listening and Speaking"),
          concept(12, "Phonics Focus", "Phonics Focus: Digraph “wh“"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: "Vocabulary",
        title: "Lesson 3: Describing People",
        printedHead: "Describing People",
        bookFrom: 13,
        concepts: [
          concept(13, "Vocabulary", "Vocabulary"),
          concept(13, "Listening and Speaking", "Listening and Speaking"),
          concept(16, "Present Simple Tense for Descriptions", "Present Simple Tense for Descriptions"),
          concept(16, "Language in Use", "Language in Use"),
          concept(17, "Reading for Understanding", "Reading for Understanding"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: "Vocabulary",
        title: "Lesson 4: Daily Routines",
        printedHead: "Daily Routines",
        bookFrom: 19,
        concepts: [
          concept(19, "Vocabulary", "Vocabulary"),
          concept(22, "Reading and Writing", "Reading and Writing"),
          concept(23, "Present Simple Tense for Routines", "Present Simple Tense for Routines"),
          concept(23, "Language Focus", "Language Focus"),
          concept(25, "Listening and Speaking", "Listening and Speaking"),
          concept(25, "Reading and Writing", "Reading and Writing"),
          concept(26, "Self-Assessment", "Self-Assessment"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "Unit 2: My Family and I",
    printedHead: "My Family and I",
    bookFrom: 27,
    bookTo: 42,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: "Vocabulary",
        title: "Lesson 1: Meet My Family",
        printedHead: "Meet My Family",
        bookFrom: 28,
        concepts: [
          concept(28, "Vocabulary", "Vocabulary"),
          concept(30, "Language in Use", "Language in Use"),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "Vocabulary",
        title: "Lesson 2: Family Traditions and Celebrations",
        printedHead: "Family Traditions and Celebrations",
        bookFrom: 32,
        concepts: [
          concept(32, "Vocabulary", "Vocabulary"),
          concept(35, "Phonics Focus", 'Phonics Focus: Letter "x" = /gz/ sound'),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: "Vocabulary",
        title: "Lesson 3: My Family Helps Me Grow",
        printedHead: "My Family Helps Me Grow",
        bookFrom: 36,
        concepts: [
          concept(36, "Vocabulary", "Vocabulary"),
          concept(38, "Phonics Focus", 'Phonics Focus: Digraph "ph" : /f/ Sound'),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: "Vocabulary",
        title: "Lesson 4: Jobs in My Family",
        printedHead: "Jobs in My Family",
        bookFrom: 39,
        concepts: [
          concept(39, "Vocabulary", "Vocabulary"),
          concept(42, "Self-Assessment", "Self-Assessment"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "Unit 3: New Adventures",
    printedHead: "New Adventures",
    bookFrom: 43,
    bookTo: 62,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: "Vocabulary",
        title: "Lesson 1: Places Around Me",
        printedHead: "Places Around Me",
        bookFrom: 44,
        concepts: [
          concept(44, "Vocabulary", "Vocabulary"),
          concept(47, "Reading and Writing", "Reading and Writing"),
          concept(49, "Phonics Focus", "Phonics Focus: Double Consonant Endings"),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: "Listening and Speaking",
        title: "Lesson 2: Egypt's Landmarks",
        printedHead: "Egypt's Landmarks",
        bookFrom: 50,
        concepts: [
          concept(50, "Listening and Speaking", "Listening and Speaking"),
          concept(51, "Reading and Writing", "Reading and Writing"),
          concept(53, "Phonics Focus", 'Phonics Focus: Digraph "ck"=/k/ Sound'),
          concept(54, "Punctuation Tips", "Punctuation Tips"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: "Language in Use",
        title: "Lesson 3: Map It Out",
        printedHead: "Map It Out",
        bookFrom: 55,
        concepts: [concept(55, "Language in Use", "Language in Use")],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: "Past Simple Tense",
        title: "Lesson 4: A School Trip to the Zoo",
        printedHead: "A School Trip to the Zoo",
        bookFrom: 58,
        concepts: [
          concept(60, "Past Simple Tense", "Past Simple Tense"),
          concept(60, "Language in Use", "Language in Use"),
          concept(62, "Self-Assessment", "Self-Assessment"),
        ],
      },
    ],
  },
  {
    key: "review1",
    kind: "review",
    ordinal: "",
    title: "Review 1: Let's Review Units 1, 2, and 3",
    printedHead: "Let's Review Units 1, 2, and 3",
    bookFrom: 63,
    bookTo: 66,
    lessons: [
      {
        key: "review1-1",
        ordinal: "",
        type: "Review",
        title: "Let's Review Units 1, 2, and 3",
        printedHead: "Let's Review Units 1, 2, and 3",
        bookFrom: 63,
        concepts: [
          concept(63, "Review", "Complete the following sentences"),
          concept(63, "Review", "Circle the odd one"),
          concept(63, "Review", "Complete the sentences"),
          concept(64, "Review", "Choose the correct sentence"),
          concept(64, "Review", "Rearrange the letters to form a word"),
          concept(64, "Review", "Fill in the missing letters"),
          concept(65, "Review", "Fill in the blanks"),
          concept(65, "Review", "Circle the correct preposition"),
          concept(65, "Review", "Write 3-4 sentences about a landmark you visited in Egypt"),
          concept(66, "Review", "Let's practice sentences"),
          concept(66, "Review", "Choose the correct word"),
          concept(66, "Review", "Match the word to the action"),
          concept(66, "Review", "Complete the sentences"),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "الرابعة",
    title: "Unit 4: Let's Tell Stories!",
    printedHead: "Let's Tell Stories!",
    bookFrom: 67,
    bookTo: 81,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: "Vocabulary",
        title: "Lesson 1: How We Feel",
        printedHead: "How We Feel",
        bookFrom: 68,
        concepts: [
          concept(68, "Vocabulary", "Vocabulary"),
          concept(71, "Past Simple Tense", "Past Simple Tense"),
          concept(71, "Language in Use", "Language in Use"),
          concept(73, "Phonics Focus", 'Phonics Focus: : Hard "c"= /k/ sound'),
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: "Reading and Writing",
        title: "Lesson 2: A Helping Hand",
        printedHead: "A Helping Hand",
        bookFrom: 74,
        concepts: [
          concept(74, "Reading and Writing", "Reading and Writing"),
          concept(76, "Phonics Focus", 'Phonics Focus: : Soft "c" = /s/ sound'),
        ],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: "My Feelings",
        title: "Lesson 3: A Big Win",
        printedHead: "A Big Win",
        bookFrom: 78,
        concepts: [
          concept(80, "My Feelings", "My Feelings"),
          concept(81, "Self-Assessment", "Self-Assessment"),
        ],
      },
    ],
  },
  {
    key: "5",
    kind: "unit",
    ordinal: "الخامسة",
    title: "Unit 5: Together Is Better",
    printedHead: "Together Is Better",
    bookFrom: 82,
    bookTo: 98,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: "Vocabulary",
        title: "Lesson 1: Teamwork & Chores",
        printedHead: "Teamwork & Chores",
        bookFrom: 83,
        concepts: [
          concept(83, "Vocabulary", "Vocabulary"),
          concept(85, "Listening and Speaking", "Listening and Speaking"),
        ],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: "Listening and Speaking",
        title: "Lesson 2: Teamwork at School",
        printedHead: "Teamwork at School",
        bookFrom: 87,
        concepts: [
          concept(87, "Listening and Speaking", "Listening and Speaking"),
          concept(87, "Phonics Focus", 'Phonics Focus: : Hard "g" = /g/ sound'),
          concept(88, "Reading and Writing", "Reading and Writing"),
          concept(89, "Action Verbs", "Action Verbs"),
        ],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: "Phonics Focus",
        title: "Lesson 3: Teamwork in Sports",
        printedHead: "Teamwork in Sports",
        bookFrom: 91,
        concepts: [concept(93, "Phonics Focus", 'Phonics Focus: : Soft "g" = /d / sound')],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: "Listening and Speaking",
        title: "Lesson 4: I Help My Community!",
        printedHead: "I Help My Community!",
        bookFrom: 94,
        concepts: [
          concept(94, "Listening and Speaking", "Listening and Speaking"),
          concept(96, "Reading and Writing", "Reading and Writing"),
          concept(96, "Vocabulary", "Vocabulary"),
          concept(98, "Self-Assessment", "Self-Assessment"),
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "unit",
    ordinal: "السادسة",
    title: "Unit 6: Dare to Dream",
    printedHead: "Dare to Dream",
    bookFrom: 99,
    bookTo: 113,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: "Vocabulary",
        title: "Lesson 1: My Goal, My Dream",
        printedHead: "My Goal, My Dream",
        bookFrom: 100,
        concepts: [
          concept(100, "Vocabulary", "Vocabulary"),
          concept(103, "Present Continuous Tense", "Present Continuous Tense"),
          concept(103, "Language in Use", "Language in Use"),
        ],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: "Phonics Focus",
        title: "Lesson 2: A Day To Remember",
        printedHead: "A Day To Remember",
        bookFrom: 104,
        concepts: [
          concept(105, "Phonics Focus", "Phonics Focus: Three-Consonant Clusters"),
          concept(106, "Reading and Writing", "Reading and Writing"),
        ],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: "Reading and Writing",
        title: "Lesson 3: I Did It!",
        printedHead: "I Did It!",
        bookFrom: 108,
        concepts: [concept(108, "Reading and Writing", "Reading and Writing")],
      },
      {
        key: "6-4",
        ordinal: "الرابع",
        type: "Reading and Writing",
        title: "Lesson 4: Helping Others Succeed",
        printedHead: "Helping Others Succeed",
        bookFrom: 110,
        concepts: [
          concept(110, "Reading and Writing", "Reading and Writing"),
          concept(113, "Self-Assessment", "Self-Assessment"),
        ],
      },
    ],
  },
  {
    key: "review2",
    kind: "review",
    ordinal: "",
    title: "Review 2: Let's Review Units 4, 5, and 6",
    printedHead: "Let's Review Units 4, 5, and 6",
    bookFrom: 114,
    bookTo: 117,
    lessons: [
      {
        key: "review2-1",
        ordinal: "",
        type: "Review",
        title: "Let's Review Units 4, 5, and 6",
        printedHead: "Let's Review Units 4, 5, and 6",
        bookFrom: 114,
        concepts: [
          concept(114, "Review", "Match the words to their meanings"),
          concept(115, "Review", "Sound sort"),
          concept(115, "Review", "Fill in the missing letters"),
          concept(115, "Review", "Rearrange the letters to form words from the phonics review"),
          concept(116, "Review", "Choose the correct feeling word for each sentence"),
          concept(116, "Review", "Choose the correct verb in the present continuous"),
          concept(116, "Review", "Underline the linking word that shows the order or reason in the sentence"),
          concept(117, "Review", "Fix the sentences (capitalization - periods - question marks)"),
          concept(117, "Review", "Choose the correct verb in the past simple or present continuous"),
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
 * lesson — the Learning Outcomes opener) or its own start page, up to the
 * page before the next lesson starts, or the section's last page for its last
 * lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_ENGLISH_G3_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ENGLISH_G3_T1_SECTIONS.forEach((section, si) => {
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
  for (const section of EGYPT_ENGLISH_G3_T1_SECTIONS) {
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
  "english-g3-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (No term page of this book needs it — the book has a born-digital
 * English text layer — but the guard keeps the loader the same shape across the
 * books.)
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
  const lesson = EGYPT_ENGLISH_G3_T1_SECTIONS[sectionIndex]!.lessons[lessonIndex]!;
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
 * Page-number candidates a content page prints. This book's folio always rides
 * in the page's running head at the top («Lesson 1 6», «UNIT UNIT 1 1 7»,
 * «63 Review 1 R e v i e w 1», «83 Lesson 1»), sometimes glued and sometimes
 * followed by the lesson number, so the top and bottom furniture lines each
 * contribute both their space-stripped whole and every whitespace-separated
 * digit token. Exercise numerals near the foot join the candidate set
 * harmlessly: the page's own number proves the mapping when present.
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
 * mismatch). The five pure Learning Outcomes openers (5, 43, 67, 82, 99) print
 * only their unit numeral, never a folio, and are exempted via
 * `FOLIO_LESS_ANCHORS`.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * Folios whose OCR printed a different, still parseable number. Every folio in
 * this born-digital book came out right, so the map is empty and the folio
 * check stays exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no folio, each with the anchor the check accepts in
 * place of a page number: the five unit «Learning Outcomes» openers, anchored
 * on the unit head the page itself prints. (The Unit 2 opener, book 27, prints
 * «UNIT UNIT 2 2 27» and is checked like any other page.)
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  5: "Let’s Learn Together!",
  43: "New Adventures",
  67: "Let's Tell Stories!",
  82: "Together Is Better",
  99: "Dare to Dream",
};

/** Every head kind the table may use. */
const KNOWN_KINDS = new Set([
  "Vocabulary",
  "Listening and Speaking",
  "Reading and Writing",
  "Reading for Understanding",
  "Language in Use",
  "Language Focus",
  "Punctuation Tips",
  "Self-Assessment",
  "Action Verbs",
  "My Feelings",
  "Past Simple Tense",
  "Present Simple Tense for Descriptions",
  "Present Simple Tense for Routines",
  "Present Continuous Tense",
  "Phonics Focus",
  "Review",
]);

/**
 * Table invariants: lesson keys are unique and follow (section-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_ENGLISH_G3_T1_SECTIONS;

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
  if (first && first.bookFrom !== EGYPT_ENGLISH_G3_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ENGLISH_G3_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ENGLISH_G3_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ENGLISH_G3_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     the folio in its running head, or, on the five unit openers named in
 *     `FOLIO_LESS_ANCHORS`, from the anchor the page itself prints. No page is
 *     in `MISSING_SCANS`, so every page of [5, 117] is iterated;
 *  2. every section opener prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title (or its printed head) and every activity's head is
 *     printed on the pages the lesson owns (the activity on its own page);
 *  4. every page in [5, 117] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of
 *     the term the scans prove, i.e. `_BOOK_END - _BOOK_START + 1` minus
 *     `MISSING_SCANS`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const sections = EGYPT_ENGLISH_G3_T1_SECTIONS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ENGLISH_G3_T1_BOOK_START || book > EGYPT_ENGLISH_G3_T1_BOOK_END) continue;
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
  for (let p = EGYPT_ENGLISH_G3_T1_BOOK_START; p <= EGYPT_ENGLISH_G3_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_ENGLISH_G3_T1_BOOK_END - EGYPT_ENGLISH_G3_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_ENGLISH_G3_T1_BOOK_START} و${EGYPT_ENGLISH_G3_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
