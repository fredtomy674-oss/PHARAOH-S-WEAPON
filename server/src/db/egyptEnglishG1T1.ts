// Egypt Primary 1 (Grade 1) English, first term — OFFICIAL curriculum.
//
// The first term IS the Ministry textbook (Primary 1 English, Term 1,
// 2025/2026 Ministry of Education and Technical Education edition, 128 scan
// pages, all with a born-digital English text layer). This file is the book's
// table: the six units of its Scope and Sequence plus the two reviews bound
// between/after them, each with its printed lesson heads and the exact book
// pages they occupy. It is the single source of truth the seeder and the
// stage both read; the self-checks at the bottom prove the page mapping
// against the scan, page by page.
//
// THE OFFSET IS ZERO — book page = scan page
// Every numbered page prints its own folio as a bare numeral, glued to the
// page furniture: scan 7 prints «7», scan 42 prints «42», scan 65 prints
// «65», scan 120 prints «1 2 0» (letter-spaced), scan 127 prints «127». A
// book page N is therefore scan page N (`BOOK_TO_PDF_OFFSET = 0`). The book
// counts its cover as page 1: scans 1–4 (cover, name/class page, two
// scope-and-sequence pages) print no folio, then the Ministry message prints
// «5» and «My First Day of School» prints «6», so the content that follows is
// already on its own numbers — no shift is needed or applied.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–6 are the cover, the ownership (name/class/school) page, the
// two-page Scope and Sequence, the Ministry message and «My First Day of
// School». Scan pages 126–128 are the two-page Glossary and the copyright
// page. None of them is a lesson. The term runs from the Unit 1 opener
// (scan 7) to the end of «Review 2» (scan 125):
// `EGYPT_ENGLISH_G1_T1_BOOK_START`/`_END` are exactly those two pages, and
// the tiling assertion proves nothing in between is left unreachable.
//
// ONE UNIT = ONE SECTION, ONE PRINTED «LESSON n» = ONE LESSON
// The book prints four lessons per unit — Lesson 1 (dialog + vocabulary),
// Lesson 2 (phonics, first letter group), Lesson 3 (topic: classroom, colors,
// numbers, senses, farm counting, pets) and Lesson 4 (phonics, second letter
// group) — plus a «Review 1» after Unit 3 and a «Review 2» after Unit 6. A
// lesson's `bookFrom` is the page that prints its head (its «Lesson n:
// …» footer line); the range it owns runs from the section opener (for its
// first lesson) or its own start page to the page before the next lesson
// starts (or to the section's last page), so the ranges tile each section
// and the sections tile the term exactly.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S PRINTED «LEARNING OUTCOMES»
// Every unit opener prints a «Learning Outcomes» box; every review prints
// numbered exercise instructions. Each `concepts` entry below is one of
// those strings transcribed verbatim from the opener (or review) page —
// including the book's own typo «actvities» (Unit 1) and its inconsistent
// «sound and words» (Unit 5) vs «sound, and words» (elsewhere). Nothing is
// invented; each lesson carries the outcomes its pages teach (both phonics
// lessons share their unit's letter outcomes; the two number lessons share
// the counting outcomes). Review concepts are the reviews' own printed
// exercise instructions, words verbatim (exercise numerals omitted).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N (verified: scan 65 prints «65»). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed content page of the term — the Unit 1 opener. */
export const EGYPT_ENGLISH_G1_T1_BOOK_START = 7;

/** Last printed content page — the closing page of «Review 2». */
export const EGYPT_ENGLISH_G1_T1_BOOK_END = 125;

/** The scan pages before the term: cover, ownership page, scope, message, first day. */
export const EGYPT_ENGLISH_G1_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The scan pages after the term: glossary (126–127) and copyright (128). */
export const EGYPT_ENGLISH_G1_T1_BACK_MATTER = { from: 126, to: 128 } as const;

/** One lesson of the book — becomes one lesson in the app tree. */
export interface EnglishG1T1Lesson {
  /** App-addressable key, e.g. "1-1" (unit 1, lesson 1) or "review1-1". */
  key: string;
  /** Full app-facing lesson title, e.g. "Lesson 1: Greetings". */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`), e.g. "Lesson 1: Greetings" or "Review 1".
   */
  printedHead: string;
  /** First printed book page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed outcomes for the skill(s) this lesson teaches. */
  concepts: string[];
}

/** One printed section of the book — a unit or a review. */
export interface EnglishG1T1Section {
  /** Internal key: "1"…"6", "review1", "review2". */
  key: string;
  kind: "unit" | "review";
  /** Section title as printed on its opener / in the Scope and Sequence. */
  title: string;
  /**
   * The section's running head, as the pages print it ("Unit N" / "Review N").
   * Each content page must carry it (`assertTreeMatchesTheBook`); section
   * openers print theirs scrambled or not at all, so they are exempt.
   */
  footerTitle: string;
  /** First printed page of the section. */
  bookFrom: number;
  /** Last printed page of the section. */
  bookTo: number;
  lessons: EnglishG1T1Lesson[];
}

// ---------------------------------------------------------------------------
// The printed «Learning Outcomes» of each unit, verbatim from its opener.
// ---------------------------------------------------------------------------

/** Unit 1 — Welcome to My School (opener: book page 7; keeps the book's «actvities» typo). */
const U1 = {
  greetings: ["Recognize and respond to greetings in simple conversations."],
  classroom: ["Follow basic classroom instructions."],
  phonics: ["Identify the formation, sound, and words that begin with the letters Tt and Ii."],
  speaking: [
    "Introduce oneself using complete sentences in structured speaking actvities.",
    "Use simple expressions to interact with peers in guided classroom conversations.",
  ],
};

/** Unit 2 — The Garden of Colors and Shapes (opener: book page 25). */
const U2 = {
  garden: [
    "Respond to simple questions using appropriate vocabulary.",
    "Use short phrases to describe nearby objects.",
    "Recognize and name colors through familiar objects.",
  ],
  shapes: ["Recognize and name colors through familiar objects.", "Identify and name basic 2D shapes."],
  phonics: ["Identify the formation, sound, and words that begin with the letters Ss and Aa."],
  trace: ["Trace letters Ss and Aa in their uppercase and lowercase forms."],
};

/** Unit 3 — I Love My Family (opener: book page 42). */
const U3 = {
  family: [
    "Introduce family members using complete sentences.",
    "Ask and answer number-related questions about people and objects.",
  ],
  numbers: [
    "Recognize numbers 1 to 5 and match them with their correct values.",
    "Ask and answer number-related questions about people and objects.",
  ],
  phonics: ["Identify the formation, sound, and words that begin with the letters Nn, Pp, Hh, and Dd."],
  trace: ["Trace letters Nn, Pp, Hh, and Dd in their uppercase and lowercase forms."],
};

/** Unit 4 — My Body and My Senses (opener: book page 65). */
const U4 = {
  body: ["Identify basic body parts.", "Name and count body parts using complete sentences."],
  senses: ["Identify the five senses.", "Describe each sense and its related body part."],
  phonics: ["Identify the formation, sound, and words that begin with the letters Rr, Ee, Cc, and Kk."],
  trace: ["Trace and write letters Rr, Ee, Cc, and Kk in their uppercase and lowercase forms."],
};

/** Unit 5 — On the Farm (opener: book page 84; keeps the book's «sound and words» without comma). */
const U5 = {
  farm: [
    "Name farm animals and the food they give using complete sentences.",
    "Answer simple questions related to counting and describing animals.",
    "Describe animal sizes using opposite words.",
  ],
  numbers: [
    "Answer simple questions related to counting and describing animals.",
    "Recognize the formation of numbers 6 to 10 and match them with their correct values.",
  ],
  phonics: ["Identify the formation, sound and words that begin with the letters Mm, Gg, Oo, and Ff."],
  trace: ["Trace and write letters Mm, Gg, Oo, and Ff in their uppercase and lowercase forms."],
};

/** Unit 6 — Animals Around Me (opener: book page 103). */
const U6 = {
  jungle: [
    "Identify animal names and habitats of pets and jungle animals.",
    "Describe jungle animals using counting-related sentences.",
  ],
  pets: [
    "Identify animal names and habitats of pets and jungle animals.",
    "Follow simple instructions using prepositions.",
    "Understand simple positional sentences.",
  ],
  phonics: ["Identify the formation, sound, and words that begin with the letters Bb, Ll, Uu, and Jj."],
  trace: ["Trace and write letters Bb, Ll, Uu, and Jj in their uppercase and lowercase forms."],
};

/** Review 1 (book pages 61–64) — the review's own printed exercise instructions, words verbatim. */
const REVIEW1_CONCEPTS = [
  "Match the picture with the correct word.",
  "Put ✔ or ✘.",
  "Count and match.",
  "Match the picture with the shape.",
  "Look at the picture, name it, then circle the beginning letter.",
  "Circle the pictures that start with the given letter.",
  "Find the odd one out, then circle it.",
  "Draw a picture of your family.",
  "Color the items that you can see in a garden.",
];

/** Review 2 (book pages 122–125) — the review's own printed exercise instructions, words verbatim. */
const REVIEW2_CONCEPTS = [
  "Check ✔ the correct beginning letter.",
  "Look at the picture, name it, then write its beginning letter.",
  "Match each sense to its body part.",
  "Color the squares red if it's a jungle animal and green if it's a pet.",
  "Circle what we get from these farm animals.",
  "Count the fruits and match it to the correct number.",
  "Count and circle the correct number.",
  "Match the picture to its beginning letter.",
  "Write the beginning letter.",
];

/**
 * The book in printed order: Units 1–3 (7–60), Review 1 (61–64), Units 4–6
 * (65–121), Review 2 (122–125). Unit/lesson starts come from each printed
 * «Lesson n» head; the outcomes come from each unit opener. Every page is
 * checked against the book by `assertTreeMatchesTheBook`.
 */
export const EGYPT_ENGLISH_G1_T1_SECTIONS: EnglishG1T1Section[] = [
  {
    key: "1",
    kind: "unit",
    title: "Unit 1: Welcome to My School",
    footerTitle: "Unit 1",
    bookFrom: 7,
    bookTo: 24,
    lessons: [
      { key: "1-1", title: "Lesson 1: Greetings", printedHead: "Lesson 1: Greetings", bookFrom: 8, concepts: [...U1.greetings, ...U1.speaking] },
      { key: "1-2", title: "Lesson 2: Phonics", printedHead: "Lesson 2: Phonics", bookFrom: 12, concepts: [...U1.phonics] },
      { key: "1-3", title: "Lesson 3: Around My Classroom", printedHead: "Lesson 3: Around My Classroom", bookFrom: 17, concepts: [...U1.classroom] },
      { key: "1-4", title: "Lesson 4: Phonics", printedHead: "Lesson 4: Phonics", bookFrom: 21, concepts: [...U1.phonics] },
    ],
  },
  {
    key: "2",
    kind: "unit",
    title: "Unit 2: The Garden of Colors and Shapes",
    footerTitle: "Unit 2",
    bookFrom: 25,
    bookTo: 41,
    lessons: [
      { key: "2-1", title: "Lesson 1: In the Garden", printedHead: "Lesson 1: In the Garden", bookFrom: 26, concepts: [...U2.garden] },
      { key: "2-2", title: "Lesson 2: Phonics", printedHead: "Lesson 2: Phonics", bookFrom: 30, concepts: [...U2.phonics, ...U2.trace] },
      { key: "2-3", title: "Lesson 3: Shapes and Colors", printedHead: "Lesson 3: Shapes and Colors", bookFrom: 34, concepts: [...U2.shapes] },
      { key: "2-4", title: "Lesson 4: Phonics", printedHead: "Lesson 4: Phonics", bookFrom: 38, concepts: [...U2.phonics, ...U2.trace] },
    ],
  },
  {
    key: "3",
    kind: "unit",
    title: "Unit 3: I Love My Family",
    footerTitle: "Unit 3",
    bookFrom: 42,
    bookTo: 60,
    lessons: [
      { key: "3-1", title: "Lesson 1: Who's in My Family?", printedHead: "Lesson 1: Who's in My Family?", bookFrom: 43, concepts: [...U3.family] },
      { key: "3-2", title: "Lesson 2: Phonics", printedHead: "Lesson 2: Phonics", bookFrom: 47, concepts: [...U3.phonics, ...U3.trace] },
      { key: "3-3", title: "Lesson 3: Numbers from 1 to 5", printedHead: "Lesson 3: Numbers from 1 to 5", bookFrom: 52, concepts: [...U3.numbers] },
      { key: "3-4", title: "Lesson 4: Phonics", printedHead: "Lesson 4: Phonics", bookFrom: 56, concepts: [...U3.phonics, ...U3.trace] },
    ],
  },
  {
    key: "review1",
    kind: "review",
    title: "Review 1",
    footerTitle: "Review 1",
    bookFrom: 61,
    bookTo: 64,
    lessons: [
      {
        key: "review1-1",
        title: "Review 1",
        printedHead: "Review 1",
        bookFrom: 61,
        concepts: [...REVIEW1_CONCEPTS],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    title: "Unit 4: My Body and My Senses",
    footerTitle: "Unit 4",
    bookFrom: 65,
    bookTo: 83,
    lessons: [
      { key: "4-1", title: "Lesson 1: Head to Toe", printedHead: "Lesson 1: Head to Toe", bookFrom: 66, concepts: [...U4.body] },
      { key: "4-2", title: "Lesson 2: Phonics", printedHead: "Lesson 2: Phonics", bookFrom: 70, concepts: [...U4.phonics, ...U4.trace] },
      { key: "4-3", title: "Lesson 3: My 5 senses", printedHead: "Lesson 3: My 5 senses", bookFrom: 75, concepts: [...U4.senses] },
      { key: "4-4", title: "Lesson 4: Phonics", printedHead: "Lesson 4: Phonics", bookFrom: 79, concepts: [...U4.phonics, ...U4.trace] },
    ],
  },
  {
    key: "5",
    kind: "unit",
    title: "Unit 5: On the Farm",
    footerTitle: "Unit 5",
    bookFrom: 84,
    bookTo: 102,
    lessons: [
      { key: "5-1", title: "Lesson 1: Welcome to the Farm", printedHead: "Lesson 1: Welcome to the Farm", bookFrom: 85, concepts: [...U5.farm] },
      { key: "5-2", title: "Lesson 2: Phonics", printedHead: "Lesson 2: Phonics", bookFrom: 89, concepts: [...U5.phonics, ...U5.trace] },
      { key: "5-3", title: "Lesson 3: Numbers From 6 to 10", printedHead: "Lesson 3: Numbers From 6 to 10", bookFrom: 94, concepts: [...U5.numbers] },
      { key: "5-4", title: "Lesson 4: Phonics", printedHead: "Lesson 4: Phonics", bookFrom: 98, concepts: [...U5.phonics, ...U5.trace] },
    ],
  },
  {
    key: "6",
    kind: "unit",
    title: "Unit 6: Animals Around Me",
    footerTitle: "Unit 6",
    bookFrom: 103,
    bookTo: 121,
    lessons: [
      { key: "6-1", title: "Lesson 1: Welcome to the Jungle", printedHead: "Lesson 1: Welcome to the Jungle", bookFrom: 104, concepts: [...U6.jungle] },
      { key: "6-2", title: "Lesson 2: Phonics", printedHead: "Lesson 2: Phonics", bookFrom: 108, concepts: [...U6.phonics, ...U6.trace] },
      { key: "6-3", title: "Lesson 3: My Pets", printedHead: "Lesson 3: My Pets", bookFrom: 113, concepts: [...U6.pets] },
      { key: "6-4", title: "Lesson 4: Phonics", printedHead: "Lesson 4: Phonics", bookFrom: 117, concepts: [...U6.phonics, ...U6.trace] },
    ],
  },
  {
    key: "review2",
    kind: "review",
    title: "Review 2",
    footerTitle: "Review 2",
    bookFrom: 122,
    bookTo: 125,
    lessons: [
      {
        key: "review2-1",
        title: "Review 2",
        printedHead: "Review 2",
        bookFrom: 122,
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
 * lesson — the unit opener) or its own start page, up to the page before the
 * next lesson starts, or the section's last page for its last lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_ENGLISH_G1_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ENGLISH_G1_T1_SECTIONS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This book has
 * none: every lesson's document is exactly its own range (the Glossary stays
 * outside the tiled term as back matter). Kept as a function so the seeder
 * and the stage share one shape across all the books.
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
  "english-g1-t1",
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

/** True when a content page carries real text (every term page does — no blanks). */
function pageHasText(book: number): boolean {
  return loadBookPage(book).length > 0;
}

/** Loads + joins the text of a book-page range into one lesson document. */
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

/**
 * Page-number candidates a content page prints. This book prints its folio as
 * a bare numeral in the page furniture — either glued («65», «126»),
 * letter-spaced («1 2 0» = 120), or sharing its line with exercise residue
 * (page 87: «87 8 8 8 … 7 7 7») — so each furniture line contributes both its
 * space-stripped whole and every whitespace-separated digit token. Exercise
 * numerals («1 Listen …») join the candidate set harmlessly: the page's own
 * number proves the mapping when present.
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
 * the page's own number when it is among the candidates, otherwise the
 * largest candidate (so a wrong page still reports a number and the caller
 * can see the mismatch). The Unit 2/5/6 openers (25, 84, 103) print no folio
 * at all in the text layer — only their unit numeral — and page 105 (a
 * picture-vocabulary page) drops its folio too, so those pages return
 * null-ish values the caller exempts.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * Content pages whose folio the text layer drops (no bare «N» anywhere in
 * the page furniture): the Unit 2/5/6 openers print only their unit numeral,
 * and page 105 — a picture-vocabulary page («tiger monkey snake … lion
 * elephant giraffe») — prints no folio at all. They are still checked for
 * text, running head and ownership; only the folio proof is waived.
 */
const FOLIO_EXEMPT = new Set<number>([25, 84, 103, 105]);

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its section, sections tile the book without gaps or overlaps, and the first
 * section starts where the Scope and Sequence says. A content mistake here
 * would quietly ground the tutor on the wrong pages, so it fails loudly
 * instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_ENGLISH_G1_T1_SECTIONS;

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
  if (first.bookFrom !== EGYPT_ENGLISH_G1_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من ${EGYPT_ENGLISH_G1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last.bookTo !== EGYPT_ENGLISH_G1_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند ${EGYPT_ENGLISH_G1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every content page carries real text and prints its own book number in
 *     its furniture (the Unit 2/5/6 openers print no folio in the text layer
 *     — only their unit numeral — and the picture-vocabulary page 105 drops
 *     its folio too, so those four pages are folio-exempt; the other three
 *     openers print theirs and are checked);
 *  2. every content page carries its section's running head («Unit N» /
 *     «Review N», openers exempt — their layout scrambles it);
 *  3. every lesson's own first page prints that lesson's head;
 *  4. every printed page is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term [START, END] with no gap.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const sections = EGYPT_ENGLISH_G1_T1_SECTIONS;

  /** Openers print no reliable folio/running head in the text layer. */
  const openers = new Set(sections.map((s) => s.bookFrom));
  const sectionByPage = new Map<number, EnglishG1T1Section>();
  for (const section of sections) {
    for (let p = section.bookFrom; p <= section.bookTo; p++) sectionByPage.set(p, section);
  }

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ENGLISH_G1_T1_BOOK_START || book > EGYPT_ENGLISH_G1_T1_BOOK_END) continue;
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

    if (!FOLIO_EXEMPT.has(book)) {
      const footer = printedFooter(book);
      if (footer === null) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم صفحة مطبوع`);
      } else if (footer !== book) {
        problems.push(`صفحة الكتاب ${book}: رقمها المطبوع لا يطابقها (وجدنا ${footer})`);
      }
    }

    const section = sectionByPage.get(book);
    if (!section) {
      problems.push(`صفحة الكتاب ${book}: لا تنتمي لأي قسم`);
      continue;
    }
    if (!openers.has(book)) {
      const head = normalize(section.footerTitle);
      if (!normalize(loadBookPage(book)).includes(head)) {
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

  const expected = EGYPT_ENGLISH_G1_T1_BOOK_END - EGYPT_ENGLISH_G1_T1_BOOK_START + 1;
  if (printedPages.size !== expected) {
    problems.push(`عدد صفحات المحصود ${printedPages.size} بينما المتوقع ${expected} (${EGYPT_ENGLISH_G1_T1_BOOK_START}–${EGYPT_ENGLISH_G1_T1_BOOK_END})`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
