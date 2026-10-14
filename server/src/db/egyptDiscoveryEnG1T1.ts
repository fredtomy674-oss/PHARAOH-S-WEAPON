// Primary 1 (الصف الأول الابتدائي) Discover, English-medium («DISCOVER»),
// first term, Ministry of Education and Technical Education 2025/2026 edition
// (the cover imprint prints «MINISTRY OF EDUCATION AND TECHNICAL EDUCATION /
// PRIMARY 1 / DISCOVER / 2025-2026»).
//
// Reserved ids (header only — this module wires nothing): the English-medium
// Discover curriculum for Primary 1 is `eg-g1-discovery-en`, subject
// `discovery-en` (name "Discovery (English)", nameAr "اكتشف (بالإنجليزية)"),
// lesson prefix `l-g1-dis-en-`, grade `grade-1` (name "Grade 1", nameAr
// "الصف الأول الابتدائي").
//
// WHAT THE 73 SCANS PROVE — THE WHOLE FIRST TERM, CHAPTER BY CHAPTER
// The corpus holds 66 of the book's 73 scans (`pages-001` … `pages-073`);
// the 7 absent scans (49, 54, 65, 66, 68, 69, 72 — books 45, 50, 61, 62, 64,
// 65, 68) are all Term-2 pages after the term, so no first-term page is
// missing. The book's own «CONTENTS» (scan 4) lists the year-wide chapter
// skeleton with printed page numbers: Term 1 — Theme 1 «Who Am I?» —
// Chapter 1 «All About Me 1», Chapter 2 «Family Tree 13», Chapter 3 «Our
// Community 17» — and Theme 2 «The World Around Me» — Chapter 1 «Our
// Environment 21», Chapter 2 «Moving Around Our Environment 25», Chapter 3
// «Growing Food In The World Around Us 31», Chapter 4 «Celebrating The World
// Around Us 35» — then Term 2 («Theme 3: How The World Works?» from 41,
// «Theme 4: Communication» from 59). The first term is therefore printed
// book pages 1–40: the Chapter-1 divider (scan 5) down to the «RESPECTING
// EGYPTIAN MONUMENTS» page (scan 44), with the Term-2 divider on scan 45.
// Unlike the French G1 sibling this book prints no Term-1 maths journal.
// This spec describes exactly those pages.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every numbered content page prints its own folio as a bare numeral on its
// last line (book 3, an illustration-only page, prints nothing but its own
// «3»). Matching folios to scans: scan 6 prints «2» (book 2), scan 8 prints
// «4» (book 4), scan 12 prints «8» (book 8), scan 16 prints «12» (book 12),
// scan 20 prints «16» (book 16), scan 26 prints «22» (book 22), scan 34
// prints «30» (book 30) and scan 44 prints «40» (book 40) — always scan =
// book + 4. The book's own «CONTENTS» independently confirms it: every
// chapter divider sits exactly where the contents says it does (scans 5, 17,
// 21, 25, 29, 35, 39 for books 1, 13, 17, 21, 25, 31, 35).
//
// FRONT MATTER IS SCANS 1–4; BACK MATTER IS SCANS 45–73
// Scans 1–4 are before book page 1: the cover (scan 1), a blank back page
// (scan 2, the provider's «no text» sentence), the «FOREWORD» (scan 3) and
// the year-wide «CONTENTS» with the NAME slip (scan 4). Scans 45–73 are
// after the term: the Term-2 divider and lessons (books 41–69, with the 7
// absent scans named above) and the print matter (scan 73). There is no
// appendix in these scans, so `allLessonExtras()` returns nothing.
//
// NO FIRST-TERM SCAN IS ABSENT — `MISSING_SCANS` STAYS EMPTY
// Every one of the 40 term scans carries text (book 3 holds just its folio
// «3», which still counts as text). The 7 absent scans are all Term-2 pages
// outside [1, 40] and are skipped silently by the checker, which only
// iterates in-range files; listing them here would corrupt the folio
// arithmetic, so they are documented in prose above instead. `pagesChecked`
// therefore equals the full term range, 40 − 1 + 1 = 40.
//
// SEVEN TERM PAGES PRINT NO FOLIO — EACH HAS A NAMED ANCHOR
// Books 1, 13, 17, 21, 25, 31 and 35 are the chapter dividers; they print
// the chapter head and no page number. Rather than weaken the page-number
// check they are exempt from it in `assertTreeMatchesTheBook` and anchored
// on a string the page itself prints, named in `FOLIO_LESS_ANCHORS`. Every
// other term page proves its book number from the folio on its last line.
//
// EACH CHAPTER'S LESSONS ARE ITS NUMBERED «Lesson N» PAGES
// Lesson numbers restart in every chapter and are read from the pages:
// Chapter 1 holds Lessons 1–5 (books 8–12), Chapter 2 Lessons 1–3 (books
// 14–16), Chapter 3 Lessons 1–3 (books 18–20), Chapter 4 Lessons 1–3 (books
// 22–24), Chapter 5 Lessons 1–5 (books 26–30), Chapter 6 Lessons 1–3 (books
// 32–34) and Chapter 7 Lessons 1–4 (books 36–39) plus the closing
// «RESPECTING EGYPTIAN MONUMENTS» page (book 40), which prints its head
// with no «Lesson» numeral and is the chapter's fifth lesson by position.
// A lesson's title is the activity head its opening page prints. Where one
// page prints two heads both ride with the lesson as its concepts (book 8
// «PICTURE OF ME AND MY SENSES» + «A FAMILY AT THE PARK»; book 11
// «SIMILARITIES AND DIFFERENCES» + «BUST OF NEFERTITI» + «DR. MAGDI
// YACOUB»; book 16 «LIFE STAGES OF A HUMAN» + «LIFE CYCLE OF A PLANT»;
// book 18 «OUR RIGHTS» + «RULES»; book 30 «TRANSPORTATION IN EGYPT» +
// «DOES IT CAUSE POLLUTION?»). Chapter 1's unnumbered intro pages (books
// 2–7: «I AM AN EGYPTIAN» and the hieroglyphic-writing spread) are owned by
// lesson 1-1 exactly as the G2 English Discover book attaches its own intro
// pages to lesson 1-1, and their printed heads are that lesson's leading
// concepts. Book 3 prints only its folio and book 5 only its table, so
// neither contributes a head. Nothing is invented: every title below is a
// string the page its `bookFrom` names prints.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// The divider colons differ («CHAPTER 1:» versus «CHAPTER 2 :», and
// «CHAPTER3 :» without a space on books 18–20); book 27 prints its «Lesson
// 2» caption below its head; book 30's running head misspells the chapter
// («ENVIRONEMENT») while the divider and the lesson head below spell it
// right — all transcribed as printed. `normalize` folds case, spacing and
// punctuation, so none of this breaks a match.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.40 = scan p.44). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the Chapter-1 divider (scan 5). */
export const EGYPT_DISCOVERY_EN_G1_T1_BOOK_START = 1;

/** Last printed page of the term — «RESPECTING EGYPTIAN MONUMENTS» (scan 44). */
export const EGYPT_DISCOVERY_EN_G1_T1_BOOK_END = 40;

/** The scanned pages before the term: cover, blank scan, foreword, contents. */
export const EGYPT_DISCOVERY_EN_G1_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/**
 * The scanned pages after the term: the Term-2 divider and lessons (books
 * 41–69, of which scans 49, 54, 65, 66, 68, 69, 72 are absent) and the print
 * matter (scan 73).
 */
export const EGYPT_DISCOVERY_EN_G1_T1_BACK_MATTER = { from: 45, to: 73 } as const;

/**
 * The term pages the OCR never produced, in book pages. Every one of the 40
 * term scans carries text (book 3 holds just its folio «3»), so the list is
 * empty; the 7 absent scans are all Term-2 pages outside the term and are
 * documented in the header instead. Kept so the loader, the checks and the
 * seeders share one shape across the books.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface DiscoveryEnG1T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «Activity». */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one numbered «Lesson N» page, or the closing monuments page). */
export interface DiscoveryEnG1T1Lesson {
  /** App-addressable key, e.g. "1-4" (chapter 1, lesson 4). */
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
  concepts: DiscoveryEnG1T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed chapter of the term. Terms print no separate theme page here. */
export interface DiscoveryEnG1T1Section {
  /** This book's sections are its chapters. */
  kind: "chapter";
  /** Internal key: "1"…"7", in book order. */
  key: string;
  /** Arabic ordinal of the chapter as used in the app tree, e.g. "الثاني". */
  ordinal: string;
  /** Full app-facing section title, with the theme for context. */
  title: string;
  /** The chapter head the divider page prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its divider). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next divider). */
  bookTo: number;
  lessons: DiscoveryEnG1T1Lesson[];
}

const TYPE = "Activity";

function concept(bookFrom: number, title: string): DiscoveryEnG1T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The seven chapters of the first term, with their numbered lessons and every
 * printed head, transcribed from the page the book prints it on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter ranges come from the book's «CONTENTS» (scan 4) and the dividers the
 * pages print: 1–12 (divider scan 5), 13–16 (scan 17), 17–20 (scan 21), 21–24
 * (scan 25), 25–30 (scan 29), 31–34 (scan 35) and 35–40 (scan 39). Lesson
 * numbers restart in every chapter and are read from the «Lesson N» markers
 * on the pages; the closing monuments page (book 40) prints no numeral and is
 * the seventh chapter's fifth lesson by position.
 */
export const EGYPT_DISCOVERY_EN_G1_T1_UNITS: DiscoveryEnG1T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "Theme 1: Who Am I? - Chapter 1: All About Me",
    printedHead: "CHAPTER 1: ALL ABOUT ME",
    bookFrom: 1,
    bookTo: 12,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "PICTURE OF ME AND MY SENSES",
        printedHead: "PICTURE OF ME AND MY SENSES",
        bookFrom: 8,
        concepts: [
          concept(2, "I AM AN EGYPTIAN"),
          concept(4, "Hieroglyphic Writing"),
          concept(6, "Hieroglyphic Writing"),
          concept(7, "Determinative:"),
          concept(8, "PICTURE OF ME AND MY SENSES"),
          concept(8, "A FAMILY AT THE PARK"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "EXTENDED FAMILY",
        printedHead: "EXTENDED FAMILY",
        bookFrom: 9,
        concepts: [concept(9, "EXTENDED FAMILY")],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "OUR FIVE SENSES",
        printedHead: "OUR FIVE SENSES",
        bookFrom: 10,
        concepts: [concept(10, "OUR FIVE SENSES")],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "SIMILARITIES AND DIFFERENCES",
        printedHead: "SIMILARITIES AND DIFFERENCES",
        bookFrom: 11,
        concepts: [
          concept(11, "SIMILARITIES AND DIFFERENCES"),
          concept(11, "BUST OF NEFERTITI"),
          concept(11, "DR. MAGDI YACOUB"),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "MY PICTURE",
        printedHead: "MY PICTURE",
        bookFrom: 12,
        concepts: [concept(12, "MY PICTURE")],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "الثاني",
    title: "Theme 1: Who Am I? - Chapter 2: Family Tree",
    printedHead: "CHAPTER 2 : FAMILY TREE",
    bookFrom: 13,
    bookTo: 16,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "MIXED-UP ROUTINE",
        printedHead: "MIXED-UP ROUTINE",
        bookFrom: 14,
        concepts: [concept(14, "MIXED-UP ROUTINE")],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "ADULTS AND BABIES",
        printedHead: "ADULTS AND BABIES",
        bookFrom: 15,
        concepts: [concept(15, "ADULTS AND BABIES")],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "LIFE STAGES OF A HUMAN",
        printedHead: "LIFE STAGES OF A HUMAN",
        bookFrom: 16,
        concepts: [concept(16, "LIFE STAGES OF A HUMAN"), concept(16, "LIFE CYCLE OF A PLANT")],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "الثالث",
    title: "Theme 1: Who Am I? - Chapter 3: Our Community",
    printedHead: "CHAPTER 3 : OUR COMMUNITY",
    bookFrom: 17,
    bookTo: 20,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "OUR RIGHTS",
        printedHead: "OUR RIGHTS",
        bookFrom: 18,
        concepts: [concept(18, "OUR RIGHTS"), concept(18, "RULES")],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "COMMUNITY HELPERS",
        printedHead: "COMMUNITY HELPERS",
        bookFrom: 19,
        concepts: [concept(19, "COMMUNITY HELPERS")],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "WORKERS TOOLS",
        printedHead: "WORKERS TOOLS",
        bookFrom: 20,
        concepts: [concept(20, "WORKERS TOOLS")],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "الرابع",
    title: "Theme 2: The World Around Me - Chapter 1: Our Environment",
    printedHead: "CHAPTER 1: OUR ENVIRONMENT",
    bookFrom: 21,
    bookTo: 24,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "IS IT LIVING?",
        printedHead: "IS IT LIVING?",
        bookFrom: 22,
        concepts: [concept(22, "IS IT LIVING?")],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "DESERT AND DELTA",
        printedHead: "DESERT AND DELTA",
        bookFrom: 23,
        concepts: [concept(23, "DESERT AND DELTA")],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "TAKE CARE OF THE ENVIRONMENT",
        printedHead: "TAKE CARE OF THE ENVIRONMENT",
        bookFrom: 24,
        concepts: [concept(24, "TAKE CARE OF THE ENVIRONMENT")],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "الخامس",
    title: "Theme 2: The World Around Me - Chapter 2: Moving Around Our Environment",
    printedHead: "CHAPTER 2 : MOVING AROUND OUR ENVIRONMENT",
    bookFrom: 25,
    bookTo: 30,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: TYPE,
        title: "PLANT DIAGRAM",
        printedHead: "PLANT DIAGRAM",
        bookFrom: 26,
        concepts: [concept(26, "PLANT DIAGRAM")],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "ANIMAL DIAGRAMS",
        printedHead: "ANIMAL DIAGRAMS",
        bookFrom: 27,
        concepts: [concept(27, "ANIMAL DIAGRAMS")],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "HOW ANIMALS MOVE?",
        printedHead: "HOW ANIMALS MOVE?",
        bookFrom: 28,
        concepts: [concept(28, "HOW ANIMALS MOVE?")],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "HOW OBJECTS MOVE INVESTIGATION?",
        printedHead: "HOW OBJECTS MOVE INVESTIGATION?",
        bookFrom: 29,
        concepts: [concept(29, "HOW OBJECTS MOVE INVESTIGATION?")],
      },
      {
        key: "5-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "TRANSPORTATION IN EGYPT",
        printedHead: "TRANSPORTATION IN EGYPT",
        bookFrom: 30,
        concepts: [concept(30, "TRANSPORTATION IN EGYPT"), concept(30, "DOES IT CAUSE POLLUTION?")],
      },
    ],
  },
  {
    key: "6",
    kind: "chapter",
    ordinal: "السادس",
    title: "Theme 2: The World Around Me - Chapter 3: Growing Food In The World Around Us",
    printedHead: "CHAPTER 3 : GROWING FOOD IN THE WORLD AROUND US",
    bookFrom: 31,
    bookTo: 34,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: TYPE,
        title: "THE SUN IN THE SKY",
        printedHead: "THE SUN IN THE SKY",
        bookFrom: 32,
        concepts: [concept(32, "THE SUN IN THE SKY")],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "SEASONS OF THE YEAR",
        printedHead: "SEASONS OF THE YEAR",
        bookFrom: 33,
        concepts: [concept(33, "SEASONS OF THE YEAR")],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "HEALTHY FOOD CHOICES",
        printedHead: "HEALTHY FOOD CHOICES",
        bookFrom: 34,
        concepts: [concept(34, "HEALTHY FOOD CHOICES")],
      },
    ],
  },
  {
    key: "7",
    kind: "chapter",
    ordinal: "السابع",
    title: "Theme 2: The World Around Me - Chapter 4: Celebrating The World Around Us",
    printedHead: "CHAPTER 4 : CELEBRATING THE WORLD AROUND US",
    bookFrom: 35,
    bookTo: 40,
    lessons: [
      {
        key: "7-1",
        ordinal: "الأول",
        type: TYPE,
        title: "EGYPTIAN FEASTS",
        printedHead: "EGYPTIAN FEASTS",
        bookFrom: 36,
        concepts: [concept(36, "EGYPTIAN FEASTS")],
      },
      {
        key: "7-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "EGYPTIAN TRADITIONS",
        printedHead: "EGYPTIAN TRADITIONS",
        bookFrom: 37,
        concepts: [concept(37, "EGYPTIAN TRADITIONS")],
      },
      {
        key: "7-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "EGYPTIAN MONUMENTS",
        printedHead: "EGYPTIAN MONUMENTS",
        bookFrom: 38,
        concepts: [concept(38, "EGYPTIAN MONUMENTS")],
      },
      {
        key: "7-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "TRAVELING TO EGYPTIAN MONUMENTS",
        printedHead: "TRAVELING TO EGYPTIAN MONUMENTS",
        bookFrom: 39,
        concepts: [concept(39, "TRAVELING TO EGYPTIAN MONUMENTS")],
      },
      {
        key: "7-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "RESPECTING EGYPTIAN MONUMENTS",
        printedHead: "RESPECTING EGYPTIAN MONUMENTS",
        bookFrom: 40,
        concepts: [concept(40, "RESPECTING EGYPTIAN MONUMENTS")],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the section's first page (for its first
 * lesson — the divider opener) or its own start page, up to the page before
 * the next lesson starts, or the section's last page for its last lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_DISCOVERY_EN_G1_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_DISCOVERY_EN_G1_T1_UNITS.forEach((section, si) => {
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
  for (const section of EGYPT_DISCOVERY_EN_G1_T1_UNITS) {
    for (const lesson of section.lessons) {
      if (lesson.extraBookPages?.length) out.set(lesson.key, [...lesson.extraBookPages]);
    }
  }
  return out;
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
  "discovery-en-g1-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (No term page of this book needs it — every term scan carries
 * text — but the guard keeps the loader the same shape across books.)
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
  const lesson = EGYPT_DISCOVERY_EN_G1_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
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
 * Page-number candidates a content page prints. This book's folio is a bare
 * numeral standing alone on its last line («14», «22», «30»); book 3 prints
 * nothing but its own «3», so its first and last line coincide. Both outer
 * lines are read and every other line is ignored, so body numbers (table
 * rows, directions) can never be mistaken for a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const first = lines[0] ?? "";
  const last = lines[lines.length - 1] ?? "";
  const out: number[] = [];
  for (const line of [first, last]) {
    if (/^[0-9]+$/.test(line)) {
      const n = Number(line);
      if (n > 0 && !out.includes(n)) out.push(n);
    }
  }
  return out;
}

/**
 * The book number a content page prints, or null. Every content page that
 * carries a folio prints exactly one number there and it is its own, which is
 * what fixes the offset; the chapter dividers named in `FOLIO_LESS_ANCHORS`
 * carry no number and are handled there instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * Folios whose OCR printed a different, still parseable number. Every folio in
 * this book came out right, so the map is empty and the folio check stays
 * exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no folio in the checked furniture, each with the
 * anchor the check accepts in place of a page number: the seven chapter
 * dividers, each anchored on the head its own page prints.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  1: "CHAPTER 1: ALL ABOUT ME",
  13: "CHAPTER 2 : FAMILY TREE",
  17: "CHAPTER 3 : OUR COMMUNITY",
  21: "CHAPTER 1: OUR ENVIRONMENT",
  25: "CHAPTER 2 : MOVING AROUND OUR ENVIRONMENT",
  31: "CHAPTER 3 : GROWING FOOD IN THE WORLD AROUND US",
  35: "CHAPTER 4 : CELEBRATING THE WORLD AROUND US",
};

/** Every head kind the table may use. */
const KNOWN_KINDS = new Set(["Activity"]);

/**
 * Table invariants: lesson keys are unique and follow (section-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_DISCOVERY_EN_G1_T1_UNITS;
  const keys = new Set<string>();

  units.forEach((unit, ui) => {
    if (!unit.title.trim()) problems.push(`القسم ${unit.key}: بلا عنوان`);
    if (!unit.printedHead.trim()) problems.push(`القسم ${unit.key}: بلا عنوان مطبوع`);
    if (unit.lessons.length === 0) problems.push(`القسم ${unit.title}: بلا دروس`);

    unit.lessons.forEach((lesson, li) => {
      if (keys.has(lesson.key)) problems.push(`مفتاح درس مكرر: «${lesson.key}»`);
      keys.add(lesson.key);
      const expectedKey = `${unit.key}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`القسم ${unit.key} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (!lesson.title.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان`);
      if (!lesson.printedHead.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان مطبوع`);
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أنشطة`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول نشاط`);
      }

      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((c, ci) => {
        if (!c.title.trim()) problems.push(`الدرس ${lesson.key} النشاط ${ci + 1}: بلا عنوان`);
        if (!KNOWN_KINDS.has(c.kind)) {
          problems.push(`الدرس ${lesson.key} النشاط ${ci + 1}: نوع غير معروف «${c.kind}»`);
        }
        if (c.bookFrom < unit.bookFrom || c.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} النشاط ${ci + 1}: صفحته ${c.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && c.bookFrom < prev.bookFrom) {
          problems.push(`الدرس ${lesson.key}: صفحات الأنشطة تنازلية (${prev.bookFrom} ثم ${c.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }
      const last = lesson.concepts.at(-1)!;
      if (last.bookFrom < from || last.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: نشاطه الأخير ${last.bookFrom} خارج نطاقه ${from}–${to}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر القسم ${unit.bookFrom}، وجدنا ${from}`);
      }
    });

    const nextUnit = units[ui + 1];
    if (nextUnit && unit.bookTo >= nextUnit.bookFrom) {
      problems.push(`القسم ${unit.title} يتداخل مع ${nextUnit.title}`);
    } else if (nextUnit && unit.bookTo !== nextUnit.bookFrom - 1) {
      problems.push(`فجوة صفحات بين ${unit.title} و${nextUnit.title}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`);
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_DISCOVERY_EN_G1_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_DISCOVERY_EN_G1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_DISCOVERY_EN_G1_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_DISCOVERY_EN_G1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     the folio on its last line, or, on the seven pages named in
 *     `FOLIO_LESS_ANCHORS`, from the anchor the page itself prints. The scans
 *     in `MISSING_SCANS` (none this term) carry no text to prove anything with
 *     and are not iterated (they stay owned by their lesson ranges below);
 *  2. every section opener prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title (or its printed head) and every activity's head is
 *     printed on the pages the lesson owns (the activity on its own page);
 *  4. every page in [1, 40] is owned by exactly one lesson — no page falls
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
  const units = EGYPT_DISCOVERY_EN_G1_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_DISCOVERY_EN_G1_T1_BOOK_START || book > EGYPT_DISCOVERY_EN_G1_T1_BOOK_END) continue;
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
  units.forEach((unit, ui) => {
    if (loadBookPage(unit.bookFrom) && !pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} لا تطبع «${unit.printedHead}»`);
    }

    unit.lessons.forEach((lesson, li) => {
      if (loadBookPage(lesson.bookFrom) && !pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع «${lesson.printedHead}»`);
      }
      const { from, to } = lessonBookRange(ui, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.printedHead);
      if (!titlePrinted) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
    });
  });

  // 3b. every activity's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (loadBookPage(c.bookFrom) && !pagePrints(c.bookFrom, c.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة النشاط ${c.bookFrom} لا تطبع «${c.title}»`);
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
  for (let p = EGYPT_DISCOVERY_EN_G1_T1_BOOK_START; p <= EGYPT_DISCOVERY_EN_G1_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_DISCOVERY_EN_G1_T1_BOOK_END - EGYPT_DISCOVERY_EN_G1_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_DISCOVERY_EN_G1_T1_BOOK_START} و${EGYPT_DISCOVERY_EN_G1_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
