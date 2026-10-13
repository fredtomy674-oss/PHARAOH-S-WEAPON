// Egypt Primary 2 (Grade 2) English, first term — OFFICIAL curriculum.
//
// The first term IS the Ministry textbook (Primary 2 English, Term 1,
// 2025/2026 Ministry of Education and Technical Education edition, 104 scan
// pages, all with a born-digital English text layer). This file is the book's
// table: the six units of its Scope and Sequence plus the two reviews bound
// between/after them, each with its printed lesson heads and the exact book
// pages they occupy. It is the single source of truth the seeder and the
// stage both read; the self-checks at the bottom prove the page mapping
// against the scan, page by page.
//
// THE OFFSET IS ZERO — book page = scan page
// Every numbered page prints its own folio as a bare numeral, glued to the
// page furniture: scan 7 prints «UNIT 1 1 7», scan 44 prints «Review 44»,
// scan 65 prints «Lesson 1 65», scan 93 prints «Review 93» with a second
// bare «93» at the foot, scan 101 prints «Review 101». A book page N is
// therefore scan page N (`BOOK_TO_PDF_OFFSET = 0`). The book counts its
// cover as page 1: scans 1–4 (cover, Ministry dedication, Ministry message,
// Scope and Sequence) print no folio of their own, and the Unit 1 Learning
// Outcomes page follows immediately — no shift is needed or applied.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–4 are the cover, the dedication page, the Ministry message
// and the Scope and Sequence. Scan pages 102–103 are the Glossary and scan
// 104 is the copyright/credits page. None of them is a lesson. The term runs
// from the Unit 1 Learning Outcomes (scan 5) to the end of «Review 2»
// (scan 101): `EGYPT_ENGLISH_G2_T1_BOOK_START`/`_END` are exactly those two
// pages, and the tiling assertion proves nothing in between is left
// unreachable.
//
// ONE UNIT = ONE SECTION, ONE PRINTED «LESSON n» = ONE LESSON
// The book prints four lessons per unit — each opened by a «Lesson n» head
// with its own topic subtitle (Classroom Greetings, Around the Classroom,
// …) — plus a «Let's Review Units 1, 2, and 3» after Unit 3 and a
// «Let's Review Units 4, 5, and 6» after Unit 6. A lesson's `bookFrom` is
// the page that prints its head (head at the foot of the page counts — e.g.
// Lesson 3 of Unit 1 opens at the foot of page 11); the range it owns runs
// from the section opener (for its first lesson — the Learning Outcomes
// page) or its own start page to the page before the next lesson starts (or
// to the section's last page), so the ranges tile each section and the
// sections tile the term exactly.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S PRINTED «LEARNING OUTCOMES»
// Every unit opens with a «Learning Outcomes» page (Speaking / Listening /
// Reading / Writing bullets); each review prints numbered exercise
// instructions. Each `concepts` entry below is one of those strings
// transcribed verbatim from the opener (or review) page — including the
// book's own «group dialog» (Unit 3), «about room» (Unit 6), «My life at
// Home» (Unit 4, lowercase l) and «Actions At Home» (Unit 5, capital A).
// The text layer garbles the quotation marks around single phonics letters
// («?oa?o» for 'a'), which are transcribed as plain double-quoted letters.
// Nothing is invented; each lesson carries the outcomes its pages teach.
// Review concepts are the reviews' own printed exercise instructions, words
// verbatim (exercise numerals omitted).
//
// PAGE FURNITURE ALTERNATES «LESSON» / «UNIT n»
// Unlike the Primary 1 book (every page carries «Unit N»), this book
// alternates: practice pages print «UNIT N» with the folio, lesson pages
// print «Lesson» with the folio and the lesson number (sometimes glued as
// «Lesson 8 2», sometimes letter-spaced «L e s s o n»). A non-opener unit
// page therefore proves its section by printing «Lesson» or its own
// «UNIT N»; the Learning Outcomes openers print theirs scrambled (Unit 2's
// head reads «… Outcomes Unit Colors, Shapes, and Numbers 2») or not at
// all, so openers are exempt. The per-page folio remains the strong proof.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N (verified: scan 65 prints «65»). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed content page of the term — the Unit 1 Learning Outcomes. */
export const EGYPT_ENGLISH_G2_T1_BOOK_START = 5;

/** Last printed content page — the closing page of «Review 2». */
export const EGYPT_ENGLISH_G2_T1_BOOK_END = 101;

/** The scan pages before the term: cover, dedication, message, scope. */
export const EGYPT_ENGLISH_G2_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/** The scan pages after the term: glossary (102–103) and copyright (104). */
export const EGYPT_ENGLISH_G2_T1_BACK_MATTER = { from: 102, to: 104 } as const;

/** One lesson of the book — becomes one lesson in the app tree. */
export interface EnglishG2T1Lesson {
  /** App-addressable key, e.g. "1-1" (unit 1, lesson 1) or "review1-1". */
  key: string;
  /** Full app-facing lesson title, e.g. "Lesson 1: Classroom Greetings". */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`): the lesson's topic subtitle (or the
   * review's «Let's Review …» head), e.g. "Classroom Greetings".
   */
  printedHead: string;
  /** First printed book page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed outcomes for the skill(s) this lesson teaches. */
  concepts: string[];
}

/** One printed section of the book — a unit or a review. */
export interface EnglishG2T1Section {
  /** Internal key: "1"…"6", "review1", "review2". */
  key: string;
  kind: "unit" | "review";
  /** Section title as printed in the Scope and Sequence. */
  title: string;
  /**
   * The section's running head, as the pages print it ("Unit N" /
   * "Review"). Each non-opener content page must carry it or a «Lesson»
   * head (`assertTreeMatchesTheBook`); section openers print theirs
   * scrambled or not at all, so they are exempt.
   */
  footerTitle: string;
  /** First printed page of the section. */
  bookFrom: number;
  /** Last printed page of the section. */
  bookTo: number;
  lessons: EnglishG2T1Lesson[];
}

// ---------------------------------------------------------------------------
// The printed «Learning Outcomes» of each unit, verbatim from its opener.
// ---------------------------------------------------------------------------

/** Unit 1 — Let's Get Started! (opener: book page 5). */
const U1 = {
  greetings: [
    "Use basic greetings and respond appropriately.",
    "Respond to simple greetings when spoken by the teacher or in short audio recordings.",
    "Recognize and read common greeting words.",
  ],
  classroom: [
    "Name at least 5-7 classroom objects correctly when shown pictures or real items.",
    "Ask and answer simple questions about classroom objects.",
    "Identify vocabulary related to classroom objects.",
    "Match written words to pictures of classroom objects.",
    "Follow simple classroom instructions during listening activities.",
  ],
  phonics: ["Recognize and repeat phonics sounds for short vowels a, e, i in familiar words."],
  writing: [
    "Recognize simple sentences describing classroom objects.",
    "Write the names of classroom objects next to pictures.",
    "Complete simple sentences using classroom vocabulary.",
    "Reorder words to make correct sentences.",
  ],
};

/** Unit 2 — Colors, Shapes, and Numbers (opener: book page 17). */
const U2 = {
  colors: [
    "Name and describe colors, numbers, and shapes using simple sentences.",
    "Match written words to corresponding colored shapes.",
    "Write color, number, and shape words accurately.",
  ],
  talk: [
    "Ask and answer questions about colors, numbers, and shapes.",
    "Identify color, number, and shape names when heard in simple instructions or descriptions.",
    "Respond to simple questions appropriately.",
  ],
  numbers: ["Identify numbers from 1 to 10 and count by tens.", "Differentiate between singular and plural nouns."],
  phonics: ["Recognize and repeat phonics sounds for short o, short u, and long a."],
  writing: [
    "Reorder words to form correct sentences.",
    "Develop basic spelling skills by reordering letters to make words.",
    "Label drawings using accurate color and shape words.",
  ],
};

/** Unit 3 — Classroom Actions & Routines (opener: book page 31; keeps the book's «group dialog»). */
const U3 = {
  actions: [
    "Use simple present tense to talk about classroom activities.",
    "Ask and answer basic questions about classroom routines.",
    "Use action verbs correctly in short pair or group dialog.",
    "Identify related classroom vocabulary in short spoken sentences.",
    "Recognize classroom action words.",
    "Read simple sentences describing routines.",
  ],
  routines: [
    "Follow simple classroom instructions given by the teacher.",
    "Recognize short classroom instructions in written form.",
    "Reorder words to form correct instructions or statements.",
  ],
  phonics: ["Recognize and repeat initial consonant sounds in classroom action words."],
  writing: [
    "Label pictures showing classroom actions and routines.",
    "Write simple descriptive sentences about their own classroom routines.",
  ],
};

/** Unit 4 — Everyday Life (opener: book page 49). */
const U4 = {
  family: [
    "Use simple present tense sentences to describe family members and routines.",
    "Understand when someone introduces family members.",
    "Recognize family vocabulary words.",
    "Label family members in diagrams.",
    "Write family words and simple routine sentences accurately.",
    "Write short descriptive sentences about family members.",
  ],
  possessive: ["Use possessive adjectives correctly in speech."],
  daily: ["Follow simple descriptions about daily activities.", "Read simple sentences describing family routines."],
  phonicsLong: ['Recognize and repeat phonics sounds in long "o" and "u".'],
  phonicsTh: ['Recognize and repeat phonics sounds for words with the "th" letter sound.'],
};

/** Unit 5 — My Home (opener: book page 64). */
const U5 = {
  home: [
    "Use simple sentences to describe rooms and furniture.",
    "Recognize household items and their locations.",
    "Recognize vocabulary for home items and rooms.",
    "Match sentences or words to pictures of household items and rooms.",
    "Identify information about home arrangements in simple sentences.",
    "Label pictures of rooms and objects.",
  ],
  place: [
    'Use "there is" and "there are" correctly to describe items at home.',
    "Answer and ask questions about location.",
    "Recognize prepositions of place in context.",
    "Follow simple questions and answers about home.",
  ],
  phonics: ['Recognize and repeat phonics sounds for "sh" and "th" words clearly in context.'],
  writing: [
    "Reorder words or sentences describing home items.",
    "Write short descriptive sentences about their favorite room or items in their house.",
  ],
};

/** Unit 6 — Rooms at Home (opener: book page 82; keeps the book's «about room»). */
const U6 = {
  rooms: [
    "Use simple sentences to describe rooms and their functions.",
    "Identify related vocabulary when someone talks about different rooms and what they do there.",
    "Recognize vocabulary for rooms and home-related words.",
    "Read simple sentences describing objects and activities in each room.",
    "Write words for rooms and furniture correctly.",
  ],
  ask: ["Answer and ask simple questions about room.", "Follow simple questions about location."],
  phonics: ['Recognize and repeat phonics sound: "ch" words.'],
  writing: [
    "Reorder sentences describing rooms and their contents.",
    "Write short descriptive sentences about favorite rooms.",
  ],
};

/** Review 1 (book pages 44–48) — the review's own printed exercise instructions, words verbatim. */
const REVIEW1_CONCEPTS = [
  "Listen, repeat, and practice.",
  "Find the big yellow pencil.",
  "Complete the sentences.",
  "Reorder the letters to make a word.",
  "Trace the words.",
  "Fill in the blanks using the words below.",
  "Reorder the words to form a sentence.",
  "Draw and color objects and shapes.",
  "Write two sentences to describe your drawings.",
  "Match the words to the pictures.",
  "Color the shapes.",
  "Write 3 sentences from what you learned.",
];

/** Review 2 (book pages 93–101) — the review's own printed exercise instructions, words verbatim. */
const REVIEW2_CONCEPTS = [
  "Describe and Guess Game.",
  "Match the Room or Family Member.",
  "Choose the correct answer.",
  "Reorder the letters to make a word.",
  "Use the words to complete sentences.",
  "Fill in the missing letter to complete the word.",
  "Write 2 sentences describing your home and family.",
];

/**
 * The book in printed order: Units 1–3 (5–43), Review 1 (44–48), Units 4–6
 * (49–92), Review 2 (93–101). Unit/lesson starts come from each printed
 * «Lesson n» head; the outcomes come from each unit opener. Every page is
 * checked against the book by `assertTreeMatchesTheBook`.
 */
export const EGYPT_ENGLISH_G2_T1_SECTIONS: EnglishG2T1Section[] = [
  {
    key: "1",
    kind: "unit",
    title: "Unit 1: Let's Get Started!",
    footerTitle: "Unit 1",
    bookFrom: 5,
    bookTo: 16,
    lessons: [
      { key: "1-1", title: "Lesson 1: Classroom Greetings", printedHead: "Classroom Greetings", bookFrom: 6, concepts: [...U1.greetings, ...U1.classroom] },
      { key: "1-2", title: "Lesson 2: Around the Classroom", printedHead: "Around the Classroom", bookFrom: 8, concepts: [...U1.phonics, ...U1.classroom, ...U1.writing] },
      { key: "1-3", title: "Lesson 3: Our Classroom Objects", printedHead: "Our Classroom Objects", bookFrom: 11, concepts: [...U1.classroom, ...U1.phonics, ...U1.writing] },
      { key: "1-4", title: "Lesson 4: Let's Write Together!", printedHead: "Let's Write Together!", bookFrom: 14, concepts: [...U1.writing, ...U1.phonics] },
    ],
  },
  {
    key: "2",
    kind: "unit",
    title: "Unit 2: Colors, Shapes, and Numbers",
    footerTitle: "Unit 2",
    bookFrom: 17,
    bookTo: 30,
    lessons: [
      { key: "2-1", title: "Lesson 1: Colors and Shapes", printedHead: "Colors and Shapes", bookFrom: 18, concepts: [...U2.colors, ...U2.talk] },
      { key: "2-2", title: "Lesson 2: Shapes and Colors Around Us", printedHead: "Shapes and Colors Around Us", bookFrom: 21, concepts: [...U2.phonics, ...U2.writing] },
      { key: "2-3", title: "Lesson 3: Numbers and Counting", printedHead: "Numbers and Counting", bookFrom: 24, concepts: [...U2.numbers, ...U2.talk] },
      { key: "2-4", title: "Lesson 4: Let's Count Together", printedHead: "Let's Count Together", bookFrom: 27, concepts: [...U2.numbers, ...U2.phonics, ...U2.writing] },
    ],
  },
  {
    key: "3",
    kind: "unit",
    title: "Unit 3: Classroom Actions & Routines",
    footerTitle: "Unit 3",
    bookFrom: 31,
    bookTo: 43,
    lessons: [
      { key: "3-1", title: "Lesson 1: Classroom Actions", printedHead: "Classroom Actions", bookFrom: 32, concepts: [...U3.actions, ...U3.writing] },
      { key: "3-2", title: "Lesson 2: Let's Talk about Class Routines", printedHead: "Let's Talk about Class Routines", bookFrom: 35, concepts: [...U3.routines, ...U3.phonics, ...U3.writing] },
      { key: "3-3", title: "Lesson 3: All About Our Classroom", printedHead: "All About Our Classroom", bookFrom: 39, concepts: [...U3.actions, ...U3.writing] },
      { key: "3-4", title: "Lesson 4: Writing About Our Class", printedHead: "Writing About Our Class", bookFrom: 41, concepts: [...U3.writing, ...U3.routines, ...U3.phonics] },
    ],
  },
  {
    key: "review1",
    kind: "review",
    title: "Review 1",
    footerTitle: "Review",
    bookFrom: 44,
    bookTo: 48,
    lessons: [
      {
        key: "review1-1",
        title: "Review 1",
        printedHead: "Let's Review Units 1, 2, and 3",
        bookFrom: 44,
        concepts: [...REVIEW1_CONCEPTS],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    title: "Unit 4: Everyday Life",
    footerTitle: "Unit 4",
    bookFrom: 49,
    bookTo: 63,
    lessons: [
      { key: "4-1", title: "Lesson 1: My Family", printedHead: "My Family", bookFrom: 50, concepts: [...U4.family, ...U4.possessive] },
      { key: "4-2", title: "Lesson 2: All About Home", printedHead: "All About Home", bookFrom: 53, concepts: [...U4.possessive, ...U4.family, ...U4.phonicsLong] },
      { key: "4-3", title: "Lesson 3: My life at Home", printedHead: "My life at Home", bookFrom: 57, concepts: [...U4.family, ...U4.daily] },
      { key: "4-4", title: "Lesson 4: Me and My Family", printedHead: "Me and My Family", bookFrom: 60, concepts: [...U4.family, ...U4.daily, ...U4.phonicsTh] },
    ],
  },
  {
    key: "5",
    kind: "unit",
    title: "Unit 5: My Home",
    footerTitle: "Unit 5",
    bookFrom: 64,
    bookTo: 81,
    lessons: [
      { key: "5-1", title: "Lesson 1: Inside My Home", printedHead: "Inside My Home", bookFrom: 65, concepts: [...U5.home, ...U5.place] },
      { key: "5-2", title: "Lesson 2: What's in My Home", printedHead: "What's in My Home", bookFrom: 69, concepts: [...U5.home, ...U5.place] },
      { key: "5-3", title: "Lesson 3: My Favorite Room", printedHead: "My Favorite Room", bookFrom: 71, concepts: [...U5.writing, ...U5.home, ...U5.phonics] },
      { key: "5-4", title: "Lesson 4: Actions At Home", printedHead: "Actions At Home", bookFrom: 74, concepts: [...U5.place, ...U5.writing, ...U5.phonics] },
    ],
  },
  {
    key: "6",
    kind: "unit",
    title: "Unit 6: Rooms at Home",
    footerTitle: "Unit 6",
    bookFrom: 82,
    bookTo: 92,
    lessons: [
      { key: "6-1", title: "Lesson 1: My Home", printedHead: "My Home", bookFrom: 83, concepts: [...U6.rooms] },
      { key: "6-2", title: "Lesson 2: Let's Talk About Our Home!", printedHead: "Let's Talk About Our Home!", bookFrom: 86, concepts: [...U6.ask, ...U6.rooms] },
      { key: "6-3", title: "Lesson 3: Where Things Are in My House!", printedHead: "Where Things Are in My House!", bookFrom: 88, concepts: [...U6.rooms, ...U6.writing, ...U6.phonics] },
      { key: "6-4", title: "Lesson 4: I Can Read and Write About My Home!", printedHead: "I Can Read and Write About My Home!", bookFrom: 90, concepts: [...U6.writing, ...U6.rooms] },
    ],
  },
  {
    key: "review2",
    kind: "review",
    title: "Review 2",
    footerTitle: "Review",
    bookFrom: 93,
    bookTo: 101,
    lessons: [
      {
        key: "review2-1",
        title: "Review 2",
        printedHead: "Let's Review Units 4, 5, and 6",
        bookFrom: 93,
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
  const section = EGYPT_ENGLISH_G2_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ENGLISH_G2_T1_SECTIONS.forEach((section, si) => {
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
  "english-g2-t1",
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
 * Page-number candidates a content page prints. This book prints its folio as
 * a bare numeral in the page furniture — either glued («65», «101»),
 * letter-spaced («1 2 0»-style heads like «L e s s o n»), or sharing its
 * line with exercise residue (page 29's number line «10 … 100 105», page 99's
 * reorder drills) — so each furniture line contributes both its
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
 * can see the mismatch). The five pure Learning Outcomes openers (5, 17, 31,
 * 49, 82) print no folio at all in the text layer — only their unit numeral
 * (page 17 even scrambles it: «… Outcomes Unit Colors, Shapes, and Numbers
 * 2») — so those pages return null-ish values the caller exempts. The Unit 5
 * opener (64) shares its page with a «Lesson 1» running head and prints its
 * folio, so it is checked.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * Content pages whose folio the text layer drops: the five pure Learning
 * Outcomes openers print only their unit numeral (5→«1», 17→«2», 31→«3»,
 * 49→«4», 82→«6») and no bare folio anywhere in the page furniture. They
 * are still checked for text, running head exemption aside, and ownership;
 * only the folio proof is waived.
 */
const FOLIO_EXEMPT = new Set<number>([5, 17, 31, 49, 82]);

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its section, sections tile the book without gaps or overlaps, and the first
 * section starts where the Scope and Sequence says. A content mistake here
 * would quietly ground the tutor on the wrong pages, so it fails loudly
 * instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_ENGLISH_G2_T1_SECTIONS;

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
  if (first.bookFrom !== EGYPT_ENGLISH_G2_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من ${EGYPT_ENGLISH_G2_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last.bookTo !== EGYPT_ENGLISH_G2_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند ${EGYPT_ENGLISH_G2_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every content page carries real text and prints its own book number in
 *     its furniture (the five pure Learning Outcomes openers print no folio
 *     in the text layer — only their unit numeral — so those five pages are
 *     folio-exempt; the Unit 5 opener prints its folio and is checked);
 *  2. every content page carries its section's running head — «UNIT N» or a
 *     «Lesson» head for units (the furniture alternates), «Review» for
 *     reviews — openers exempt (their layout scrambles it);
 *  3. every lesson's own first page prints that lesson's head (its topic
 *     subtitle, plus a «Lesson» head for unit lessons);
 *  4. every printed page is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term [START, END] with no gap.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const sections = EGYPT_ENGLISH_G2_T1_SECTIONS;

  /** Openers print no reliable folio/running head in the text layer. */
  const openers = new Set(sections.map((s) => s.bookFrom));
  const sectionByPage = new Map<number, EnglishG2T1Section>();
  for (const section of sections) {
    for (let p = section.bookFrom; p <= section.bookTo; p++) sectionByPage.set(p, section);
  }

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ENGLISH_G2_T1_BOOK_START || book > EGYPT_ENGLISH_G2_T1_BOOK_END) continue;
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
      if (section.kind === "review") {
        if (!reviewHeadPresent(text)) {
          problems.push(`صفحة الكتاب ${book}: لا تحمل عنوان قسمها «${section.footerTitle}»`);
        }
      } else {
        const unitNumber = Number(section.key);
        if (!lessonHeadPresent(text) && !unitHeadPresent(text, unitNumber)) {
          problems.push(`صفحة الكتاب ${book}: لا تحمل عنوان قسمها «${section.footerTitle}»`);
        }
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
      if (section.kind === "unit" && !lessonHeadPresent(opener)) {
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

  const expected = EGYPT_ENGLISH_G2_T1_BOOK_END - EGYPT_ENGLISH_G2_T1_BOOK_START + 1;
  if (printedPages.size !== expected) {
    problems.push(`عدد صفحات المحصود ${printedPages.size} بينما المتوقع ${expected} (${EGYPT_ENGLISH_G2_T1_BOOK_START}–${EGYPT_ENGLISH_G2_T1_BOOK_END})`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
