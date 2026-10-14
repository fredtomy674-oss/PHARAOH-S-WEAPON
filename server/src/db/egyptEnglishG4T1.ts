// Egypt Primary 4 (Grade 4) English, first term — OFFICIAL curriculum.
//
// The first term IS the Ministry textbook (Primary 4 English, Term 1,
// 2025/2026 Ministry of Education and Technical Education edition, 120 scan
// pages, all with a born-digital English text layer). This file is the book's
// table: the six units of its Scope and Sequence plus the two reviews bound
// after Unit 3 and after Unit 6, each with its printed lesson heads and the
// exact book pages they occupy. It is the single source of truth the seeder
// and the stage both read; the self-checks at the bottom prove the page
// mapping against the scan, page by page.
//
// THE OFFSET IS ZERO — book page = scan page
// Every numbered content page prints its own folio, almost always glued to the
// page furniture at the top of the page: scan 8 opens «8 8», scan 9 «9 9»,
// scan 20 «2 0 20», scan 83 «83 83 Unit 5», scan 100 «1 0 0 100», scan 109
// «1 0 9 109 Review 2». A book page N is therefore scan page N
// (`BOOK_TO_PDF_OFFSET = 0`). The book counts its cover as page 1: scans 1–6
// (cover, Ministry dedication, two-page Scope and Sequence, Ministry message)
// print no folio of their own.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–6 are the cover, the dedication page, the two-page Scope and
// Sequence and the Ministry message. Scan pages 114–116 are the three-page
// Glossary, 117–119 are ruled «Notes» pages and 120 is the copyright/credits
// page. None of them is a lesson. The term runs from the Unit 1 Learning
// Outcomes opener (scan 7) to the closing page of «Review 2» (scan 113):
// `EGYPT_ENGLISH_G4_T1_BOOK_START`/`_END` are exactly those two pages, and the
// tiling assertion proves nothing in between is left unreachable.
//
// ONE UNIT = ONE SECTION, ONE PRINTED «LESSON n» = ONE LESSON
// Units 1–5 print five lessons each — every one opened by a «Lesson n» head
// with its own topic subtitle (What are the Five Senses?, Healthy Habits,
// Story Time, Writing, Think and Create) — plus a «Review 1» after Unit 3 and
// a «Review 2» after Unit 6. Unit 6 («The Hundred Dresses») prints no «Lesson»
// head at all: it is one continuous reader, so it is modelled as a single
// lesson whose head is the running head the story pages carry («Story»).
// Nothing is invented to fill a lesson the book does not print. A lesson's
// `bookFrom` is the page that prints its head (head at the foot of the page
// counts — e.g. Lesson 2 of Unit 1 opens at the foot of page 11, Lesson 1 at
// the foot of page 8); the range it owns runs from the section opener (for its
// first lesson — the Learning Outcomes page) or its own start page to the page
// before the next lesson starts (or to the section's last page), so the ranges
// tile each section and the sections tile the term exactly.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S PRINTED «LEARNING OUTCOMES»
// Every unit opens with a «Learning Outcomes» page (Speaking / Listening /
// Reading / Writing bullets); each review prints numbered exercise
// instructions. Each `concepts` entry below is one of those strings
// transcribed verbatim from the opener (or review) page — including the book's
// own curly apostrophe («animals’ habits», Unit 3) and its straight one
// («community's history», Unit 2; «story's events», Unit 6), and the phonics
// headers quoted inside the bullets («as in "pen" and "feed"», «silent 'e'»).
// Nothing is invented; each lesson carries the outcomes its pages teach.
// Review concepts are the reviews' own printed exercise instructions, words
// verbatim (exercise numerals omitted).
//
// FIVE TERM PAGES PRINT NO FOLIO — EACH IS A UNIT OPENER
// Books 7, 39, 61, 79 and 95 are the unit «Learning Outcomes» pages; each
// prints its unit number in its head but no page folio. Rather than weaken the
// page-number check they are anchored on the unit head the page itself prints,
// named in `FOLIO_LESS_ANCHORS`. The Unit 2 opener (book 23) is the exception:
// it prints «23 23» and so proves its own number. Every other term page proves
// its book number from the folio in its page furniture.
//
// HEAD RULE: THE RUNNING HEAD ALTERNATES
// Unit pages carry either a «Lesson» head or the unit number; Unit 6's reader
// pages carry «Story» (its running head) or «Unit 6»; review pages carry
// «Review 1» / «Review 2». A non-opener page therefore proves its section by
// printing its own unit number, a «Lesson» head, or its section's printed
// running head (`footerTitle`); section openers are exempt. The per-page folio
// remains the strong proof.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N (verified: scan 100 prints «1 0 0 100»). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed content page of the term — the Unit 1 Learning Outcomes opener. */
export const EGYPT_ENGLISH_G4_T1_BOOK_START = 7;

/** Last printed content page — the closing page of «Review 2». */
export const EGYPT_ENGLISH_G4_T1_BOOK_END = 113;

/** The scan pages before the term: cover, dedication, scope (3–5), message. */
export const EGYPT_ENGLISH_G4_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The scan pages after the term: glossary (114–116), notes (117–119), copyright (120). */
export const EGYPT_ENGLISH_G4_T1_BACK_MATTER = { from: 114, to: 120 } as const;

/**
 * The term pages the OCR never produced, in book pages. The corpus holds every
 * scan of the term (7–113), so there is no gap: the checker iterates all of
 * them and `pagesChecked` is the full `_BOOK_END - _BOOK_START + 1`.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One lesson of the book — becomes one lesson in the app tree. */
export interface EnglishG4T1Lesson {
  /** App-addressable key, e.g. "1-1" (unit 1, lesson 1) or "review1-1". */
  key: string;
  /** Full app-facing lesson title, e.g. "Lesson 1: What are the Five Senses?". */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`): the lesson's topic subtitle (or the review's
   * «Review n» head, or Unit 6's «Story» running head), e.g. "Healthy Habits".
   */
  printedHead: string;
  /** First printed book page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed outcomes for the skill(s) this lesson teaches. */
  concepts: string[];
}

/** One printed section of the book — a unit or a review. */
export interface EnglishG4T1Section {
  /** Internal key: "1"…"6", "review1", "review2". */
  key: string;
  kind: "unit" | "review";
  /** Section title as printed in the Scope and Sequence. */
  title: string;
  /**
   * The section's running head, as the pages print it ("Unit N" / "Review n",
   * and "Story" for Unit 6's reader). A non-opener content page must carry it,
   * a «Lesson» head, or its unit number (`assertTreeMatchesTheBook`); section
   * openers print theirs (or none), so they are exempt.
   */
  footerTitle: string;
  /** First printed page of the section. */
  bookFrom: number;
  /** Last printed page of the section. */
  bookTo: number;
  lessons: EnglishG4T1Lesson[];
}

// ---------------------------------------------------------------------------
// The printed «Learning Outcomes» of each unit, verbatim from its opener.
// ---------------------------------------------------------------------------

/** Unit 1 — The Five Senses (opener: book page 7). */
const U1 = {
  speaking: [
    "Ask and answer questions about the importance of senses",
    "Talk about health habits in pairs",
    "Deliver a presentation on healthy eating habits",
  ],
  listening: [
    "Identify vocabulary related to the five senses",
    "Answer comprehension questions in a listening dialog",
    'Recognize short and long vowels as in "pen" and "feed"',
  ],
  reading: [
    "Answer questions about healthy habits",
    "Identify the setting and characters",
    "Order daily events using sequence words",
  ],
  writing: [
    "Use the present simple tense to write meaningful sentences",
    "Write a daily routine using sequence words",
    "Plan a presentation on healthy eating habits",
  ],
};

/** Unit 2 — My Community (opener: book page 23). */
const U2 = {
  speaking: [
    "Discuss in pairs ways you can do to help your community",
    "Share stories about your community's history and traditions",
  ],
  listening: [
    "Identify solutions to community problems",
    "Discriminate the /f/ and /v/ sounds in words",
  ],
  reading: [
    "Answer questions about how people help their community based on the information provided in the text",
    "Suggest solutions to problems in the community",
    "Share the information about the traditions and festivals of the Delta region and Upper Egypt",
  ],
  writing: [
    "Write sentences about how you help your community",
    "Write a diary entry about your community's history",
    "Create a poster about a community problem and its solution",
  ],
};

/** Unit 3 — Animals In Our World (opener: book page 39; keeps the book's «animals’ habits»). */
const U3 = {
  speaking: [
    "Describe animals and their daily habits",
    "Use comparative adjectives to compare different animals",
  ],
  listening: [
    "Understand basic conversations about animals",
    "Discriminate between the consonant blends /fr/ /dr/ /pl/",
  ],
  reading: [
    "Identify animals’ habits in a simple text",
    "Identify a short story with a moral lesson to get the main idea",
    "Discuss the moral lessons in a short story",
  ],
  writing: [
    "Draft a basic report about endangered animals",
    "Plan a research project about a forest animal",
  ],
};

/** Unit 4 — Egypt-My Homeland (opener: book page 61). */
const U4 = {
  speaking: [
    "Discuss in groups famous places in Egypt",
    "Use prepositions of places to talk about different locations",
  ],
  listening: [
    "Identify key information about a tourist attraction in a conversation",
    "Discriminate between the pronunciation of the /p/ and /b/ sounds",
  ],
  reading: [
    "Recognize descriptions of famous places",
    "Extract key information from travel leaflets",
    "Read numbers up to a billion",
  ],
  writing: [
    "Design a basic travel leaflet",
    "Complete sentences using prepositions of place",
    "Write a blog post about a famous place in Egypt",
    "Use prepositions of place to complete sentences",
  ],
};

/** Unit 5 — A Day at Work (opener: book page 79; keeps the book's «silent 'e'»). */
const U5 = {
  speaking: [
    "Discuss significance of different jobs/uniforms",
    "Use superlative adjectives in sentences",
  ],
  listening: [
    "Identify the roles of different jobs in a conversation",
    "Produce long vowel sounds with silent 'e'",
  ],
  reading: [
    "Answer comprehension questions about different jobs according to the information in a reading text",
    "Identify main ideas in a story setting",
  ],
  writing: [
    "Write non-fiction texts to reflect the components of a paragraph about jobs",
    "Provide a different ending to a story",
  ],
};

/** Unit 6 — The Hundred Dresses (opener: book page 95; keeps the book's «story's events»). */
const U6 = {
  speaking: [
    "Express their favorite character in the story",
    "Discuss the moral lessons of a story",
  ],
  listening: ["Understand the sequence of events in a narrated story"],
  reading: [
    "Answer questions about the story setting, character and events",
    "Identify the elements of a story",
    "Answer critical questions based on the story's events",
  ],
  writing: ["Write a letter based on the story's events"],
};

/** Review 1 (book pages 57–60) — the review's own printed exercise instructions, words verbatim. */
const REVIEW1_CONCEPTS = [
  "Read, sort, and write.",
  "Choose the correct answer from a, b, c or d.",
  "Listen, look, and write the missing letters.",
  "Read and write the correct form of the word(s) between brackets.",
  "Look and write using the comparative form of the adjectives between brackets.",
  "Read and follow the instructions between brackets.",
  "Read the text and answer the questions.",
  "Write a diary entry about a day helping your community.",
];

/** Review 2 (book pages 109–113) — the review's own printed exercise instructions, words verbatim. */
const REVIEW2_CONCEPTS = [
  "Read and sort.",
  "Choose the correct answer from a, b, c or d.",
  "Listen, look, and fill in the missing letters.",
  "Read and correct the word(s) between brackets.",
  "Look and complete using superlative adjectives.",
  "Look and answer the questions.",
  "Read the text and answer the questions.",
  "Write a non-fiction text about a family member's job.",
  "Look and complete the mind map.",
  "Write a new ending for the story.",
];

/**
 * The book in printed order: Units 1–3 (7–56), Review 1 (57–60), Units 4–6
 * (61–108), Review 2 (109–113). Unit/lesson starts come from each printed
 * «Lesson n» head (Unit 6's reader starts at its «Story» running head); the
 * outcomes come from each unit opener. Every page is checked against the book
 * by `assertTreeMatchesTheBook`.
 */
export const EGYPT_ENGLISH_G4_T1_SECTIONS: EnglishG4T1Section[] = [
  {
    key: "1",
    kind: "unit",
    title: "Unit 1: The Five Senses",
    footerTitle: "Unit 1",
    bookFrom: 7,
    bookTo: 22,
    lessons: [
      { key: "1-1", title: "Lesson 1: What are the Five Senses?", printedHead: "What are the Five Senses?", bookFrom: 8, concepts: [...U1.speaking, ...U1.listening] },
      { key: "1-2", title: "Lesson 2: Healthy Habits", printedHead: "Healthy Habits", bookFrom: 11, concepts: [...U1.listening, ...U1.reading] },
      { key: "1-3", title: "Lesson 3: Story Time", printedHead: "Story Time", bookFrom: 14, concepts: [...U1.reading] },
      { key: "1-4", title: "Lesson 4: Writing", printedHead: "Writing", bookFrom: 18, concepts: [...U1.writing] },
      { key: "1-5", title: "Lesson 5: Think and Create", printedHead: "Think and Create", bookFrom: 20, concepts: [...U1.speaking, ...U1.writing] },
    ],
  },
  {
    key: "2",
    kind: "unit",
    title: "Unit 2: My Community",
    footerTitle: "Unit 2",
    bookFrom: 23,
    bookTo: 38,
    lessons: [
      { key: "2-1", title: "Lesson 1: Helping the Community", printedHead: "Helping the Community", bookFrom: 24, concepts: [...U2.speaking, ...U2.listening] },
      { key: "2-2", title: "Lesson 2: Community", printedHead: "Community", bookFrom: 27, concepts: [...U2.listening, ...U2.reading] },
      { key: "2-3", title: "Lesson 3: Egypt", printedHead: "Egypt", bookFrom: 30, concepts: [...U2.reading] },
      { key: "2-4", title: "Lesson 4: Writing", printedHead: "Writing", bookFrom: 34, concepts: [...U2.writing] },
      { key: "2-5", title: "Lesson 5: Think and Create", printedHead: "Think and Create", bookFrom: 36, concepts: [...U2.speaking, ...U2.writing] },
    ],
  },
  {
    key: "3",
    kind: "unit",
    title: "Unit 3: Animals In Our World",
    footerTitle: "Unit 3",
    bookFrom: 39,
    bookTo: 56,
    lessons: [
      { key: "3-1", title: "Lesson 1: Let's Meet the Animals!", printedHead: "Let's Meet the Animals!", bookFrom: 40, concepts: [...U3.speaking, ...U3.listening] },
      { key: "3-2", title: "Lesson 2: Taking Care of Animals", printedHead: "Taking Care of Animals", bookFrom: 43, concepts: [...U3.listening, ...U3.reading] },
      { key: "3-3", title: "Lesson 3: Story Time", printedHead: "Story Time", bookFrom: 46, concepts: [...U3.reading] },
      { key: "3-4", title: "Lesson 4: Writing", printedHead: "Writing", bookFrom: 50, concepts: [...U3.writing] },
      { key: "3-5", title: "Lesson 5: Think and Create", printedHead: "Think and Create", bookFrom: 54, concepts: [...U3.speaking, ...U3.writing] },
    ],
  },
  {
    key: "review1",
    kind: "review",
    title: "Review 1",
    footerTitle: "Review 1",
    bookFrom: 57,
    bookTo: 60,
    lessons: [
      {
        key: "review1-1",
        title: "Review 1",
        printedHead: "Review 1",
        bookFrom: 57,
        concepts: [...REVIEW1_CONCEPTS],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    title: "Unit 4: Egypt-My Homeland",
    footerTitle: "Unit 4",
    bookFrom: 61,
    bookTo: 78,
    lessons: [
      { key: "4-1", title: "Lesson 1: Places in Egypt", printedHead: "Places in Egypt", bookFrom: 62, concepts: [...U4.speaking, ...U4.listening] },
      { key: "4-2", title: "Lesson 2: My City", printedHead: "My City", bookFrom: 65, concepts: [...U4.listening, ...U4.reading] },
      { key: "4-3", title: "Lesson 3: The World of Big Numbers", printedHead: "The World of Big Numbers", bookFrom: 68, concepts: [...U4.reading] },
      { key: "4-4", title: "Lesson 4: Writing", printedHead: "Writing", bookFrom: 70, concepts: [...U4.writing] },
      { key: "4-5", title: "Lesson 5: Think and Create", printedHead: "Think and Create", bookFrom: 74, concepts: [...U4.speaking, ...U4.writing] },
    ],
  },
  {
    key: "5",
    kind: "unit",
    title: "Unit 5: A Day at Work",
    footerTitle: "Unit 5",
    bookFrom: 79,
    bookTo: 94,
    lessons: [
      { key: "5-1", title: "Lesson 1: Different Jobs", printedHead: "Different Jobs", bookFrom: 80, concepts: [...U5.speaking, ...U5.listening] },
      { key: "5-2", title: "Lesson 2: Jobs I Love!", printedHead: "Jobs I Love!", bookFrom: 83, concepts: [...U5.listening, ...U5.reading] },
      { key: "5-3", title: "Lesson 3: Story Time", printedHead: "Story Time", bookFrom: 86, concepts: [...U5.reading] },
      { key: "5-4", title: "Lesson 4: Writing", printedHead: "Writing", bookFrom: 90, concepts: [...U5.writing] },
      { key: "5-5", title: "Lesson 5: Think and Create", printedHead: "Think and Create", bookFrom: 92, concepts: [...U5.speaking, ...U5.writing] },
    ],
  },
  {
    key: "6",
    kind: "unit",
    title: "Unit 6: The Hundred Dresses",
    footerTitle: "Story",
    bookFrom: 95,
    bookTo: 108,
    lessons: [
      {
        key: "6-1",
        title: "The Hundred Dresses",
        printedHead: "Story",
        bookFrom: 96,
        concepts: [...U6.speaking, ...U6.listening, ...U6.reading, ...U6.writing],
      },
    ],
  },
  {
    key: "review2",
    kind: "review",
    title: "Review 2",
    footerTitle: "Review 2",
    bookFrom: 109,
    bookTo: 113,
    lessons: [
      {
        key: "review2-1",
        title: "Review 2",
        printedHead: "Review 2",
        bookFrom: 109,
        concepts: [...REVIEW2_CONCEPTS],
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
  const section = EGYPT_ENGLISH_G4_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ENGLISH_G4_T1_SECTIONS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This book has
 * none: every lesson's document is exactly its own range (the Glossary and the
 * Notes pages stay outside the tiled term as back matter). Kept as a function
 * so the seeder and the stage share one shape across all the books.
 */
export function allLessonExtras(): Map<string, number[]> {
  return new Map<string, number[]>();
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
  "english-g4-t1",
);

/** Text-layer text of one printed book page, or "" when the page was not extracted. */
export function loadBookPage(book: number): string {
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

/** True when the page carries any text at all. */
function pageHasText(book: number): boolean {
  return loadBookPage(book).length > 0;
}

/** Loads and joins the text of a book-page range, page by page. */
export function loadBookRange(fromBook: number, toBook: number): string {
  const parts: string[] = [];
  for (let book = fromBook; book <= toBook; book++) {
    const text = loadBookPage(book);
    if (!text) continue;
    parts.push(`[صفحة الكتاب ${book}]`);
    parts.push(text);
  }
  return parts.join("\n\n");
}

/** Full document payload for one lesson: its owned printed range. */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const range = lessonBookRange(sectionIndex, lessonIndex);
  return loadBookRange(range.from, range.to);
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/** Strips everything but letters and digits (case-insensitive), so letter-spacing cannot break a match. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/** True when the raw page text prints a «Lesson» head (letter-spacing tolerant). */
function lessonHeadPresent(text: string): boolean {
  return /l\s*e\s*s\s*s\s*o\s*n/i.test(text);
}

/** True when the raw page text prints the «UNIT N» running head (letter-spacing tolerant). */
function unitHeadPresent(text: string, unit: number): boolean {
  return new RegExp(`u\\s*n\\s*i\\s*t\\s*${unit}(?!\\d)`, "i").test(text);
}

/** True when the raw page text prints a «Review» head (letter-spacing tolerant). */
function reviewHeadPresent(text: string): boolean {
  return /r\s*e\s*v\s*i\s*e\s*w/i.test(text);
}

/**
 * Page-number candidates a content page prints. This book prints its folio in
 * the page furniture — glued («8 8», «11 11»), letter-spaced («2 0 20»,
 * «1 0 0 100») or sharing its line with the running head («83 83 Unit 5»,
 * «1 0 9 109 Review 2») — so each furniture line contributes both its
 * space-stripped whole and every whitespace-separated digit token. Exercise
 * numerals join the candidate set harmlessly: the page's own number proves the
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
 * mismatch). The five pure Learning Outcomes openers (7, 39, 61, 79, 95) print
 * no folio at all in the text layer — only their unit numeral — so those pages
 * are anchored through `FOLIO_LESS_ANCHORS`. The Unit 2 opener (23) prints its
 * folio and is checked.
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
 * The term pages whose folio the text layer drops, each with the anchor the
 * check accepts in place of a page number: the five unit «Learning Outcomes»
 * openers, anchored on the unit head the page itself prints. (The Unit 2
 * opener, book 23, prints «23 23» and is checked like any other page.)
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  7: "Unit 1",
  39: "Unit 3",
  61: "Unit 4",
  79: "Unit 5",
  95: "Unit 6",
};

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its section, sections tile the book without gaps or overlaps, and the first
 * section starts where the Scope and Sequence says. A content mistake here
 * would quietly ground the tutor on the wrong pages, so it fails loudly
 * instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_ENGLISH_G4_T1_SECTIONS;

  sections.forEach((section, si) => {
    if (section.lessons.length === 0) problems.push(`القسم ${section.key}: بلا دروس`);
    if (!section.footerTitle.trim()) problems.push(`القسم ${section.key}: بلا عنوان فوتر`);
    section.lessons.forEach((lesson, li) => {
      const expectedKey = `${section.key}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`القسم ${section.key} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (!lesson.title.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان`);
      if (!lesson.printedHead.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان مطبوع`);
      if (lesson.bookFrom < section.bookFrom || lesson.bookFrom > section.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${section.bookFrom}–${section.bookTo}`);
      }
      const { from, to } = lessonBookRange(si, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < section.bookFrom || to > section.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${section.bookFrom}–${section.bookTo}`);
      }
      const next = section.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== section.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر القسم ${section.bookFrom}، وجدنا ${from}`);
      }
    });
    const nextSection = sections[si + 1];
    if (nextSection && section.bookTo >= nextSection.bookFrom) {
      problems.push(`القسم ${section.key} يتداخل مع القسم ${nextSection.key}`);
    }
    if (nextSection && section.bookTo + 1 !== nextSection.bookFrom) {
      problems.push(`فجوة بين القسم ${section.key} (حتى ${section.bookTo}) والقسم ${nextSection.key} (من ${nextSection.bookFrom})`);
    }
  });

  const first = sections[0]!;
  const last = sections[sections.length - 1]!;
  if (first.bookFrom !== EGYPT_ENGLISH_G4_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من ${EGYPT_ENGLISH_G4_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last.bookTo !== EGYPT_ENGLISH_G4_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند ${EGYPT_ENGLISH_G4_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every content page carries real text and proves its own book number —
 *     from the folio in its page furniture, or from the anchor the page itself
 *     prints (`FOLIO_LESS_ANCHORS`) for the five pure Learning Outcomes
 *     openers; the Unit 2 opener (23) prints its folio and is checked;
 *  2. every non-opener content page carries its section's head — its unit
 *     number, a «Lesson» head, or its printed running head (`footerTitle`,
 *     which is «Story» for Unit 6's reader) / a «Review n» head — openers
 *     exempt (their layout scrambles it);
 *  3. every lesson's own first page prints that lesson's head (its topic
 *     subtitle, plus a «Lesson» head for unit lessons — Unit 6's reader proves
 *     its head with the «Story» running head instead);
 *  4. every printed page is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term [START, END] with no gap.
 *  `pagesChecked` is the full term range minus `MISSING_SCANS`.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const sections = EGYPT_ENGLISH_G4_T1_SECTIONS;

  /** Openers print no reliable folio/running head in the text layer. */
  const openers = new Set(sections.map((s) => s.bookFrom));
  const sectionByPage = new Map<number, EnglishG4T1Section>();
  for (const section of sections) {
    for (let p = section.bookFrom; p <= section.bookTo; p++) sectionByPage.set(p, section);
  }

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ENGLISH_G4_T1_BOOK_START || book > EGYPT_ENGLISH_G4_T1_BOOK_END) continue;
    printedPages.add(book);
    pagesChecked += 1;

    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    if (!pageHasText(book)) {
      problems.push(`صفحة الكتاب ${book}: صفحة فارغة بلا نص`);
      continue;
    }

    const anchor = FOLIO_LESS_ANCHORS[book];
    if (anchor !== undefined) {
      if (!normalize(text).includes(normalize(anchor))) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع ولا تطبع المرساة «${anchor}»`);
      }
    } else {
      const footer = printedFooter(book);
      if (footer === null) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم صفحة مطبوع`);
      } else if (footer !== book && FOOTER_OCR_MISREADS[book] !== footer) {
        problems.push(`صفحة الكتاب ${book}: رقمها المطبوع لا يطابقها (وجدنا ${footer})`);
      }
    }

    const section = sectionByPage.get(book);
    if (!section) {
      problems.push(`صفحة الكتاب ${book}: لا تنتمي لأي قسم`);
      continue;
    }
    if (!openers.has(book)) {
      const printed = normalize(text);
      const carriesSectionHead =
        section.kind === "review"
          ? reviewHeadPresent(text) || printed.includes(normalize(section.footerTitle))
          : lessonHeadPresent(text) ||
            unitHeadPresent(text, Number(section.key)) ||
            printed.includes(normalize(section.footerTitle));
      if (!carriesSectionHead) {
        problems.push(`صفحة الكتاب ${book}: لا تحمل عنوان قسمها «${section.footerTitle}»`);
      }
    }
  }

  // 3. each lesson's own first page prints its head.
  for (const section of sections) {
    for (const lesson of section.lessons) {
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        continue;
      }
      if (!normalize(opener).includes(normalize(lesson.printedHead))) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع عنوانه «${lesson.printedHead}»`);
      }
      if (
        section.kind === "unit" &&
        !lessonHeadPresent(opener) &&
        !normalize(opener).includes(normalize(section.footerTitle))
      ) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع رأس «Lesson»`);
      }
    }
  }

  // 4. every printed page is owned by exactly one lesson.
  const ownerPages = new Map<number, string[]>();
  for (const { key, from, to } of allLessonRanges()) {
    for (let p = from; p <= to; p++) {
      const list = ownerPages.get(p) ?? [];
      list.push(key);
      ownerPages.set(p, list);
    }
  }
  for (const book of printedPages) {
    const owners = ownerPages.get(book) ?? [];
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: ${owners.length === 0 ? "لا يملكها أي درس" : `يملكها أكثر من درس (${owners.join(", ")})`}`);
    }
  }

  const expected = EGYPT_ENGLISH_G4_T1_BOOK_END - EGYPT_ENGLISH_G4_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expected) {
    problems.push(`عدد صفحات المحصود ${printedPages.size} بينما المتوقع ${expected} (${EGYPT_ENGLISH_G4_T1_BOOK_START}–${EGYPT_ENGLISH_G4_T1_BOOK_END})`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
