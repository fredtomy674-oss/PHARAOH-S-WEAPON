// Egypt Primary 5 (Grade 5) English, first term — OFFICIAL curriculum.
//
// The first term IS the Ministry textbook (Primary 5 English, Term 1,
// 2025/2026 Ministry of Education and Technical Education edition, 112 scan
// pages, all but six with a born-digital English text layer). This file is the
// book's table: the six units of its Scope and Sequence plus the two reviews
// bound after Unit 3 and after Unit 6, each with its printed lesson heads and
// the exact book pages they occupy. It is the single source of truth the
// seeder and the stage both read; the self-checks at the bottom prove the page
// mapping against the scan, page by page.
//
// THE OFFSET IS ZERO — book page = scan page
// Every numbered content page prints its own folio in the page furniture,
// glued («8 8»), split («2 0 20») or letter-spaced («1 0 0 100»,
// «1 0 6 106»): scan 8 opens «Unit 1 8 8», scan 20 «Unit 1 2 0 20», scan 100
// «Story 1 0 0 100», scan 106 «1 0 6 106 Review 2». A book page N is therefore
// scan page N (`BOOK_TO_PDF_OFFSET = 0`). The book counts its cover as page 1:
// scans 1–6 (cover, Ministry dedication, three-page Scope and Sequence, Ministry
// message) print no folio of their own.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–6 are the cover, the dedication page, the Scope and Sequence
// (3–5) and the Ministry message. Scan pages 109–111 are the three-page
// Glossary and 112 is the credits page. None of them is a lesson. The term runs
// from the Unit 1 Learning Outcomes opener (scan 7) to the closing page of
// «Review 2» (scan 108): `EGYPT_ENGLISH_G5_T1_BOOK_START`/`_END` are exactly
// those two pages, and the tiling assertion proves nothing in between is left
// unreachable.
//
// ONE UNIT = ONE SECTION, ONE PRINTED «LESSON n» = ONE LESSON
// Units 1–3 and 5 print five lessons each — every one opened by a «Lesson n»
// head with its own topic subtitle (Life Along The Nile, Food in the Hot
// Desert, Story Time, Let's Make a Recipe!, Let's Make a Flyer!, …) — plus a
// «Review 1» after Unit 3 and a «Review 2» after Unit 6. Unit 4 prints only
// four lessons (Places in Our Community, Egyptian Villages, Multiply It with
// Words!, The New Administrative Capital): its «Lesson 5» never appears in the
// scans, and nothing is invented to fill it. Unit 6 («The Talking Earth»)
// prints no «Lesson» head at all: it is one continuous reader, so it is
// modelled as a single lesson whose head is the running head the story pages
// carry («Story»). Unit 3's Lesson 3 prints no topic subtitle either — its
// story opens directly on page 49 under a bare «Lesson 3» head — so its title
// is the head the page prints («Lesson 3»), not a reconstructed story title.
// A lesson's `bookFrom` is the page that prints its head (head at the foot of
// the page counts — e.g. Lesson 2 of Unit 1 opens at the foot of page 11,
// Lesson 1 of Unit 2 at the foot of page 26); the range it owns runs from the
// section opener (for its first lesson — the Learning Outcomes page) or its own
// start page to the page before the next lesson starts (or to the section's
// last page), so the ranges tile each section and the sections tile the term
// exactly.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S PRINTED BAND HEADS
// The pages inside a lesson carry the book's own printed heads — the passage
// and story titles («Where Life Flows», «The Giving Tree», «Treasures of
// Egypt», «"Just Watch!"—a Story by the Little Digger»), the grammar boxes
// («Adverbs of Frequency», «Past Simple», «Prepositions of Time»,
// «Comparative Adjectives», «Using a / an / some/ any»), the «Pronunciation»
// boxes, the writing-workshop heads («Let's Make a Recipe!»,
// «Learn! Writing Object-Perspective Narratives», «Art Time!»,
// «Let's Draw !», «A Flyer», «A Poster», «A Collage», «Ask a Friend»),
// «Think» and the «Quick Review» / «Self - Assessment» closers. Each
// `concepts` entry below is one of those strings transcribed verbatim from the
// page it starts on — including the book's own spacing («Let's Go Out !»,
// «My Restaurant Flyer !», «Self - Assessment») and its straight apostrophes
// («Adam's Journey to a Healthier Life», «Egypt's New City»). The `kind` is
// the head's own label. Review concepts are the reviews' own printed exercise
// instructions, words verbatim (exercise numerals omitted). The marginal
// «Tip!» boxes are not concepts: they repeat on many pages as teaching hints,
// never as the lesson's heads. Nothing is invented; every title below is a
// string the page its `bookFrom` names prints.
//
// SIX TERM SCANS HAVE NO TEXT LAYER — ALL ARE DOCUMENTED, NONE IS SKIPPED
// Scans 18, 32, 48, 74, 86 and 103 are present as 0-byte files: the extractor
// produced no text for them (all six sit inside lessons — an illustration or
// drawing spread each: 18 inside Unit 1 Lesson 4, 32 inside Unit 2 Lesson 3,
// 48 inside Unit 3 Lesson 2, 74 inside Unit 4 Lesson 4, 86 inside Unit 5
// Lesson 3, 103 inside Unit 6). They are listed in `MISSING_SCANS`, stay owned
// by exactly one lesson each (the tiling check still requires it), and are
// skipped only where the book itself cannot be quoted — the folio and text
// proof — exactly as absent scans are. `pagesChecked` is therefore the full
// term range minus these six.
//
// SEVEN TERM PAGES PRINT NO FOLIO IN THE CHECKED FURNITURE
// Books 7, 25, 41, 61, 77 and 92 are the unit «Learning Outcomes» openers;
// each prints its unit head but no page folio. Book 19 is the «My Favorite
// Food» writing frame: its «19 19» folio sits mid-page, outside the top/bottom
// furniture the folio check reads. Rather than weaken the page-number check
// all seven are anchored on a head the page itself prints, named in
// `FOLIO_LESS_ANCHORS`. Every other OCR'd term page proves its book number
// from the folio in its furniture.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N (verified: scan 100 prints «1 0 0 100»). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed content page of the term — the Unit 1 Learning Outcomes opener. */
export const EGYPT_ENGLISH_G5_T1_BOOK_START = 7;

/** Last printed content page — the closing page of «Review 2». */
export const EGYPT_ENGLISH_G5_T1_BOOK_END = 108;

/** The scan pages before the term: cover, dedication, scope (3–5), message. */
export const EGYPT_ENGLISH_G5_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The scan pages after the term: glossary (109–111) and credits (112). */
export const EGYPT_ENGLISH_G5_T1_BACK_MATTER = { from: 109, to: 112 } as const;

/**
 * The term pages the OCR never produced, in book pages (= scan pages: the
 * offset is zero). Scans 18, 32, 48, 74, 86 and 103 exist as 0-byte files —
 * illustration/drawing spreads with no text layer — each still owned by
 * exactly one lesson (its `lessonBookRange`), but with no text to check; the
 * strong check skips their folio/text proof and `pagesChecked` is the full
 * term range minus these six.
 */
export const MISSING_SCANS: readonly number[] = [18, 32, 48, 74, 86, 103];

/** One printed head of the textbook — becomes one concept in the app tree. */
export interface EnglishG5T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The head's own printed label, e.g. "Pronunciation" or "Past Simple". */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson of the book — becomes one lesson in the app tree. */
export interface EnglishG5T1Lesson {
  /** App-addressable key, e.g. "1-1" (unit 1, lesson 1) or "review1-1". */
  key: string;
  /** Arabic ordinal used in the lesson head; "" where the book numbers nothing. */
  ordinal: string;
  /** The lesson's opening head type — its first concept's kind. */
  type: string;
  /** Full app-facing lesson title, e.g. "Lesson 1: Life Along The Nile". */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`): the lesson's topic subtitle (or the review's
   * «Review n» head, or Unit 6's «Story» running head), e.g. "Food in the Hot Desert".
   */
  printedHead: string;
  /** First printed book page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: EnglishG5T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — a unit or a review. */
export interface EnglishG5T1Section {
  /** Internal key: "1"…"6", "review1", "review2". */
  key: string;
  kind: "unit" | "review";
  /** Arabic ordinal of the unit; "" for the reviews, which the book does not number. */
  ordinal: string;
  /** Full app-facing section title, e.g. "Unit 1: Food, Nature, and Culture". */
  title: string;
  /** The section head its opener page prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next section's opener). */
  bookTo: number;
  lessons: EnglishG5T1Lesson[];
}

function concept(bookFrom: number, kind: string, title: string): EnglishG5T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The book in printed order: Units 1–3 (7–56), Review 1 (57–60), Units 4–5
 * (61–91), Unit 6 (92–105), Review 2 (106–108). Unit/lesson starts come from
 * each printed «Lesson n» head (head at the foot of the page counts); the band
 * heads come from the pages themselves. Unit 4 holds four lessons and Unit 3's
 * Lesson 3 keeps its bare printed head — the scans print no more, and nothing
 * is invented. Every page is checked against the book by
 * `assertTreeMatchesTheBook`.
 */
export const EGYPT_ENGLISH_G5_T1_SECTIONS: EnglishG5T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "Unit 1: Food, Nature, and Culture",
    printedHead: "Food, Nature, and Culture",
    bookFrom: 7,
    bookTo: 24,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "Where Life Flows",
        title: "Lesson 1: Life Along The Nile",
        printedHead: "Life Along The Nile",
        bookFrom: 8,
        concepts: [
          concept(9, "Where Life Flows", "Where Life Flows"),
          concept(10, "Think", "Think"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: "Animals in the Desert",
        title: "Lesson 2: Food in the Hot Desert",
        printedHead: "Food in the Hot Desert",
        bookFrom: 11,
        concepts: [
          concept(11, "Animals in the Desert", "Animals in the Desert"),
          concept(12, "Adverbs of Frequency", "Adverbs of Frequency"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: "The Giving Tree",
        title: "Lesson 3: Story Time",
        printedHead: "Story Time",
        bookFrom: 13,
        concepts: [
          concept(13, "The Giving Tree", "The Giving Tree"),
          concept(16, "Pronunciation", "Pronunciation"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: "Let's Make a Recipe!",
        title: "Lesson 4: Let's Make a Recipe!",
        printedHead: "Let's Make a Recipe!",
        bookFrom: 17,
        concepts: [
          concept(17, "Let's Make a Recipe!", "Let's Make a Recipe!"),
          concept(17, "My Favorite Egyptian Food", "My Favorite Egyptian Food"),
          concept(19, "My Favorite Food", "My Favorite Food"),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: "A Flyer",
        title: "Lesson 5: Let's Make a Flyer!",
        printedHead: "Think and Create",
        bookFrom: 20,
        concepts: [
          concept(20, "A Flyer", "A Flyer"),
          concept(21, "Let's Make a Flyer!", "Let's Make a Flyer!"),
          concept(22, "My Restaurant Flyer !", "My Restaurant Flyer !"),
          concept(23, "Quick Review", "Quick Review"),
          concept(24, "Self - Assessment", "Self - Assessment"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "Unit 2: My Healthy Body",
    printedHead: "My Healthy Body",
    bookFrom: 25,
    bookTo: 40,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: "Fit, Fast, and Feeling Good",
        title: "Lesson 1: Sports for Better Health",
        printedHead: "Sports for Better Health",
        bookFrom: 26,
        concepts: [concept(26, "Fit, Fast, and Feeling Good", '"Fit, Fast, and Feeling Good"')],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "Adam's Journey to a Healthier Life",
        title: "Lesson 2: My Habits: Then and Now",
        printedHead: "My Habits: Then and Now",
        bookFrom: 28,
        concepts: [
          concept(28, "Adam's Journey to a Healthier Life", "Adam's Journey to a Healthier Life"),
          concept(30, "Using a / an / some/ any", "Using a / an / some/ any"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: "Our Body's Super Pump!",
        title: "Lesson 3: Heart and Blood",
        printedHead: "Heart and Blood",
        bookFrom: 31,
        concepts: [
          concept(31, "Our Body's Super Pump!", "Our Body's Super Pump!"),
          concept(33, "Pronunciation", "Pronunciation"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: "Healthcare Heroes",
        title: "Lesson 4: Life Savers in Action",
        printedHead: "Life Savers in Action",
        bookFrom: 34,
        concepts: [concept(34, "Healthcare Heroes", "Healthcare Heroes")],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: "A Poster",
        title: "Lesson 5: A Poster",
        printedHead: "Think and Create",
        bookFrom: 38,
        concepts: [
          concept(38, "A Poster", "A Poster"),
          concept(39, "Quick Review", "Quick Review"),
          concept(40, "Self - Assessment", "Self - Assessment"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "Unit 3: When Nature Changes",
    printedHead: "When Nature Changes",
    bookFrom: 41,
    bookTo: 56,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: "When Nature Strikes!",
        title: "Lesson 1: Weather Wonders and Warnings!",
        printedHead: "Weather Wonders and Warnings!",
        bookFrom: 42,
        concepts: [concept(43, "When Nature Strikes!", "When Nature Strikes!")],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: "The Weather in Ancient Egypt",
        title: "Lesson 2: Extreme Weather in Ancient Egypt",
        printedHead: "Extreme Weather in Ancient Egypt",
        bookFrom: 45,
        concepts: [
          concept(45, "The Weather in Ancient Egypt", "The Weather in Ancient Egypt"),
          concept(47, "Past Simple", "Past Simple"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: "Pronunciation",
        title: "Lesson 3",
        printedHead: "Lesson 3",
        bookFrom: 49,
        concepts: [concept(51, "Pronunciation", "Pronunciation")],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: "Fiction",
        title: "Lesson 4: Once Upon My Imagination",
        printedHead: "Once Upon My Imagination",
        bookFrom: 52,
        concepts: [
          concept(52, "Fiction", "Fiction"),
          concept(52, "Plot", "Plot"),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: "A Collage",
        title: "Lesson 5: A Collage",
        printedHead: "Think and Create",
        bookFrom: 54,
        concepts: [
          concept(54, "A Collage", "A Collage"),
          concept(54, "Ask a Friend", "Ask a Friend"),
          concept(55, "Quick Review", "Quick Review"),
          concept(56, "Self - Assessment", "Self - Assessment"),
        ],
      },
    ],
  },
  {
    key: "review1",
    kind: "review",
    ordinal: "",
    title: "Review 1",
    printedHead: "Review 1",
    bookFrom: 57,
    bookTo: 60,
    lessons: [
      {
        key: "review1-1",
        ordinal: "",
        type: "Review",
        title: "Review 1",
        printedHead: "Review 1",
        bookFrom: 57,
        concepts: [
          concept(57, "Review", "Read and sort the words below into their categories."),
          concept(57, "Review", "Choose the correct answer from a, b, c or d."),
          concept(57, "Review", "Listen and fill in the missing letters."),
          concept(58, "Review", "Read and write the correct form of the word(s) between brackets."),
          concept(58, "Review", "Re-write the sentences using the instructions between brackets."),
          concept(58, "Review", "Read the text and answer the questions."),
          concept(59, "Review", "Choose the correct answer from a, b, c or d:"),
          concept(59, "Review", "Answer the following questions:"),
          concept(59, "Review", "Write a fiction story of about (30-40) words about an impossible thing."),
          concept(60, "Review", "Self - Assessment"),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "الرابعة",
    title: "Unit 4: My Community",
    printedHead: "My Community",
    bookFrom: 61,
    bookTo: 76,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: "Let's Go Out !",
        title: "Lesson 1: Places in Our Community",
        printedHead: "Places in Our Community",
        bookFrom: 62,
        concepts: [
          concept(63, "Let's Go Out !", "Let's Go Out !"),
          concept(64, "Places for Play", "Places for Play"),
          concept(64, "Places for Food and Drink", "Places for Food and Drink"),
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: "Life in My Village",
        title: "Lesson 2: Egyptian Villages",
        printedHead: "Egyptian Villages",
        bookFrom: 65,
        concepts: [
          concept(65, "Life in My Village", "Life in My Village"),
          concept(67, "Prepositions of Time", "Prepositions of Time"),
        ],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: "Pronunciation",
        title: "Lesson 3: Multiply It with Words!",
        printedHead: "Multiply It with Words!",
        bookFrom: 68,
        concepts: [concept(69, "Pronunciation", "Pronunciation")],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        type: "Egypt's New City",
        title: "Lesson 4: The New Administrative Capital",
        printedHead: "The New Administrative Capital",
        bookFrom: 70,
        concepts: [
          concept(70, "Egypt's New City", "Egypt's New City"),
          concept(73, "Let's Draw !", "Let's Draw !"),
          concept(75, "Quick Review", "Quick Review"),
          concept(76, "Self - Assessment", "Self - Assessment"),
        ],
      },
    ],
  },
  {
    key: "5",
    kind: "unit",
    ordinal: "الخامسة",
    title: "Unit 5: Our World, Our Resources",
    printedHead: "Our World, Our Resources",
    bookFrom: 77,
    bookTo: 91,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: "Treasures of Egypt",
        title: "Lesson 1: The Gifts of Nature",
        printedHead: "The Gifts of Nature",
        bookFrom: 78,
        concepts: [concept(79, "Treasures of Egypt", "Treasures of Egypt")],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: "Hidden Treasures",
        title: "Lesson 2: Metals and Minerals in Our World",
        printedHead: "Metals and Minerals in Our World",
        bookFrom: 81,
        concepts: [
          concept(81, "Hidden Treasures", "Hidden Treasures"),
          concept(83, "Comparative Adjectives", "Comparative Adjectives"),
        ],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: '"Just Watch!"—a Story by the Little Digger',
        title: "Lesson 3: Story Time",
        printedHead: "Story Time",
        bookFrom: 84,
        concepts: [
          concept(84, '"Just Watch!"—a Story by the Little Digger', '"Just Watch!"—a Story by the Little Digger'),
        ],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: "I Am Water",
        title: "Lesson 4: Who Am I?",
        printedHead: "Who Am I?",
        bookFrom: 87,
        concepts: [
          concept(87, "I Am Water", "I Am Water"),
          concept(88, "Learn!", "Learn! Writing Object-Perspective Narratives"),
        ],
      },
      {
        key: "5-5",
        ordinal: "الخامس",
        type: "Art Time!",
        title: "Lesson 5: My Gold",
        printedHead: "Think and Create",
        bookFrom: 89,
        concepts: [
          concept(89, "Art Time!", "Art Time!"),
          concept(89, 'Make a Poster: "My Gold"', 'Make a Poster: "My Gold"'),
          concept(90, "Quick Review", "Quick Review"),
          concept(91, "Self - Assessment", "Self - Assessment"),
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "unit",
    ordinal: "السادسة",
    title: "Unit 6: The Talking Earth",
    printedHead: "The Talking Earth",
    bookFrom: 92,
    bookTo: 105,
    lessons: [
      {
        key: "6-1",
        ordinal: "",
        type: "Story Vocabulary",
        title: "The Talking Earth",
        printedHead: "Story",
        bookFrom: 93,
        concepts: [
          concept(93, "Story Vocabulary", "Story Vocabulary"),
          concept(94, "Definitions", "Definitions"),
          concept(94, "Characters", "Characters"),
          concept(100, "Characters", "Characters"),
          concept(101, "Vocabulary", "Vocabulary"),
          concept(102, "Events", "Events"),
          concept(105, "Quick Review", "Quick Review"),
        ],
      },
    ],
  },
  {
    key: "review2",
    kind: "review",
    ordinal: "",
    title: "Review 2",
    printedHead: "Review 2",
    bookFrom: 106,
    bookTo: 108,
    lessons: [
      {
        key: "review2-1",
        ordinal: "",
        type: "Review",
        title: "Review 2",
        printedHead: "Review 2",
        bookFrom: 106,
        concepts: [
          concept(106, "Review", "Choose the correct answer from a, b, c, or d."),
          concept(106, "Review", "Read and write the correct form of the word(s) between brackets."),
          concept(106, "Review", "Look and write using the word between brackets."),
          concept(106, "Review", "Look and answer the questions."),
          concept(107, "Review", "Read the text and answer the questions."),
          concept(107, "Review", "Choose the correct answer from a, b, c or d."),
          concept(107, "Review", "Answer the following questions:"),
          concept(107, "Review", "Write a paragraph of (40-60) words about places in your neighborhood."),
          concept(108, "Review", "Look and complete the mind map."),
          concept(108, "Review", "Write a new ending for the story."),
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
  const section = EGYPT_ENGLISH_G5_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ENGLISH_G5_T1_SECTIONS.forEach((section, si) => {
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
  for (const section of EGYPT_ENGLISH_G5_T1_SECTIONS) {
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
  "english-g5-t1",
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
  const lesson = EGYPT_ENGLISH_G5_T1_SECTIONS[sectionIndex]!.lessons[lessonIndex]!;
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
 * in the page furniture at the top or foot («8 8», «2 0 20», «1 0 0 100»,
 * «6 0 60»), sometimes glued and sometimes followed by the lesson number, so
 * the top and bottom furniture lines each contribute both their space-stripped
 * whole and every whitespace-separated digit token. Exercise numerals near the
 * foot join the candidate set harmlessly: the page's own number proves the
 * mapping when present.
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
 * mismatch). The six unit «Learning Outcomes» openers (7, 25, 41, 61, 77, 92)
 * print only their unit head, never a folio, and page 19 prints its folio
 * mid-page outside the checked furniture — all seven are exempted via
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
 * The term pages that print no folio in the checked furniture, each with the
 * anchor the check accepts in place of a page number: the six unit
 * «Learning Outcomes» openers, anchored on the unit head the page itself
 * prints, plus page 19 («My Favorite Food» writing frame), whose «19 19»
 * folio sits mid-page outside the top/bottom furniture.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  7: "Food, Nature, and Culture",
  19: "My Favorite Food",
  25: "My Healthy Body",
  41: "When Nature Changes",
  61: "My Community",
  77: "Our World, Our Resources",
  92: "The Talking Earth",
};

/** Every head kind the table may use. */
const KNOWN_KINDS = new Set([
  "Where Life Flows",
  "Think",
  "Animals in the Desert",
  "Adverbs of Frequency",
  "The Giving Tree",
  "Pronunciation",
  "Let's Make a Recipe!",
  "My Favorite Egyptian Food",
  "My Favorite Food",
  "A Flyer",
  "Let's Make a Flyer!",
  "My Restaurant Flyer !",
  "Quick Review",
  "Self - Assessment",
  "Fit, Fast, and Feeling Good",
  "Adam's Journey to a Healthier Life",
  "Using a / an / some/ any",
  "Our Body's Super Pump!",
  "Healthcare Heroes",
  "A Poster",
  "When Nature Strikes!",
  "The Weather in Ancient Egypt",
  "Past Simple",
  "Fiction",
  "Plot",
  "A Collage",
  "Ask a Friend",
  "Review",
  "Let's Go Out !",
  "Places for Play",
  "Places for Food and Drink",
  "Life in My Village",
  "Prepositions of Time",
  "Egypt's New City",
  "Let's Draw !",
  "Treasures of Egypt",
  "Hidden Treasures",
  "Comparative Adjectives",
  '"Just Watch!"—a Story by the Little Digger',
  "I Am Water",
  "Learn!",
  "Art Time!",
  'Make a Poster: "My Gold"',
  "Story Vocabulary",
  "Definitions",
  "Characters",
  "Vocabulary",
  "Events",
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
  const sections = EGYPT_ENGLISH_G5_T1_SECTIONS;

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
  if (first && first.bookFrom !== EGYPT_ENGLISH_G5_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ENGLISH_G5_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ENGLISH_G5_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ENGLISH_G5_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     the folio in its furniture, or, on the seven pages named in
 *     `FOLIO_LESS_ANCHORS`, from the anchor the page itself prints. The six
 *     0-byte scans in `MISSING_SCANS` carry no text to prove anything with and
 *     are not iterated (they stay owned by their lesson ranges below);
 *  2. every section opener prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title (or its printed head) and every activity's head is
 *     printed on the pages the lesson owns (the activity on its own page);
 *  4. every page in [7, 108] is owned by exactly one lesson — no page falls
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
  const sections = EGYPT_ENGLISH_G5_T1_SECTIONS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ENGLISH_G5_T1_BOOK_START || book > EGYPT_ENGLISH_G5_T1_BOOK_END) continue;
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
  for (let p = EGYPT_ENGLISH_G5_T1_BOOK_START; p <= EGYPT_ENGLISH_G5_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_ENGLISH_G5_T1_BOOK_END - EGYPT_ENGLISH_G5_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_ENGLISH_G5_T1_BOOK_START} و${EGYPT_ENGLISH_G5_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
