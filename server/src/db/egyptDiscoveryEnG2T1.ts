// Primary 2 (الصف الثاني الابتدائي) Discover, English-medium («DISCOVER»),
// first term, Ministry of Education and Technical Education 2025/2026 edition
// (the cover imprint prints «PRIMARY 2 / DISCOVER / 2025/ 2026»).
//
// Reserved ids (header only — this module wires nothing): the English-medium
// Discover curriculum for Primary 2 is `eg-g2-discovery-en`, subject
// `discovery-en` (name "Discovery (English)", nameAr "اكتشف (بالإنجليزية)"),
// lesson prefix `l-g2-dis-en-`, grade `grade-2` (name "Grade 2", nameAr
// "الصف الثاني الابتدائي").
//
// WHAT THE 88 SCANS PROVE — THE WHOLE FIRST TERM, CHAPTER BY CHAPTER
// The corpus holds 88 contiguous scans (`pages-001` … `pages-088`) of this
// book. The book's own «CONTENTS» (scan 4) lists the year-wide chapter skeleton
// with printed page numbers: Theme 1 «Who Am I?» — Chapter 1 «A Day in My Life
// 1», Chapter 2 «Taking Care of Me 15», Chapter 3 «When I Grow Up 23» — and
// Theme 2 «The World Around Me» — Chapter 1 «What Is in the Night Sky? 31»,
// Chapter 2 «Helping My Habitat 35», Chapter 3 «Monumental Designs 39» — then
// the second term («Theme 3: How The World Works» from 45, «Theme 4:
// Communication» from 63). The first term is therefore printed book pages 1–44:
// the Chapter-1 divider (scan 5) down to the «TICKET TO VISIT A MONUMENT» page
// (scan 48). This spec describes exactly those pages.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every numbered content page prints its own folio in its page furniture, bare
// («8», «10», «14», «22», «34») or glued to the running head («9 PRIMARY 2»,
// «16 PRIMARY 2», «40 PRIMARY 2», «PRIMARY 2 41», «44 PRIMARY 2»). Matching
// folios to scans: scan 6 prints «2» (book 2), scan 10 prints «6» (book 6),
// scan 12 prints «8» (book 8), scan 20 prints «16 PRIMARY 2» (book 16), scan 28
// prints «24» (book 24), scan 36 prints «32» (book 32) and scan 44 prints
// «40 PRIMARY 2» (book 40) — always scan = book + 4. The book's own
// «CONTENTS» independently confirms it: every chapter divider sits exactly
// where the contents says it does (scans 5, 19, 27, 35, 39, 43 for books 1,
// 15, 23, 31, 35, 39).
//
// FRONT MATTER IS SCANS 1–4; BACK MATTER IS SCANS 49–88
// Scans 1–4 are before book page 1: the cover (scan 1), a blank back page
// (scan 2, empty file), the «FOREWORD» (scan 3) and the year-wide «CONTENTS»
// with the NAME slip (scan 4). Scans 49–88 are after the term: the Term-2
// divider and lessons (books 45–81), two empty scans (86–87) and the print
// matter (scan 88). There is no appendix in these scans, so
// `allLessonExtras()` returns nothing.
//
// FOUR TERM PAGES PRINT NO FOLIO — EACH IS A CHAPTER DIVIDER WITH A NAMED ANCHOR
// Books 1, 15, 23 and 39 are the dividers of Chapters 1, 2, 3 and 6; they print
// the chapter head and no page number. (The Theme-2 dividers of books 31 and 35
// DO print their folio — «31» and «35» stand on their first line — so they need
// no anchor.) Rather than weaken the page-number check the four folio-less
// dividers are exempt from it in `assertTreeMatchesTheBook` and anchored on a
// string the page itself prints, named in `FOLIO_LESS_ANCHORS`. Every other
// term page proves its book number from the folio in its furniture.
//
// EVERY TERM PAGE CARRIES REAL TEXT
// All 44 term pages carry text (book 3 prints nothing but its own folio «3»,
// which still counts as text). No scan is absent, so `MISSING_SCANS` is empty
// and `pagesChecked` equals the full term range, 44 − 1 + 1 = 44.
//
// EACH CHAPTER'S LESSONS ARE ITS NUMBERED «Lesson N» PAGES
// Lesson numbers restart in every chapter and are read from the pages: Chapter
// 1 holds Lessons 1–5 (books 8, 9, 11, 12, 14), Chapter 2 Lessons 1–6 (books
// 16–22), Chapter 3 Lessons 1–3 (books 24, 27, 28), Chapter 4 Lessons 1–3
// (books 32–34), Chapter 5 Lessons 1–3 (books 36–38) and Chapter 6 Lessons 1–4
// (books 40–43). A lesson's title is the activity head its opening page prints
// («MEET NOUR'S FAMILY», «CLEANING VEGETABLES», «OUR WORLD», …). Where one page
// prints two heads both ride with the lesson as its concepts (book 9 «GOOD
// MORNING NOUR» + «PROBLEMS AND SOLUTIONS» + «MY PROBLEM AND SOLUTION»; book 27
// «AGRICULTURAL» + «INDUSTRIAL»; book 43 «NOUR AND HOSSAM VISIT A MONUMENT» +
// «MONUMENTS OF EGYPT»). Chapter 1's unnumbered intro pages (books 2–7: «I am
// Egyptian» and the hieroglyphic-writing spread) are owned by lesson 1-1 exactly
// as the Grade 1 English Discover book attaches its «I AM AN EGYPTIAN» and
// hieroglyph pages to lesson 1-1, and their printed heads are that lesson's
// leading concepts. Book 3 prints only its folio and book 6 only its table, so
// neither contributes a head. Nothing is invented: every title below is a
// string the page its `bookFrom` names prints.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// The apostrophe prints as U+2019 («NOUR'S», «BIRD'S», «BABY'S», «ORION'S»)
// and is folded by `normalize`. The book-37 running head misprints its chapter
// («CHAPTER 1 HELPING MY HABITAT» on a Chapter 2 page); the lesson head below
// it («WHAT IS IN A HABITAT?») is unaffected. Body typos («recoreded»,
// «acheivements», «behavoirs», «Wedensday», «bottels»-style slips) sit outside
// every head and are not transcribed.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.40 = scan p.44). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the Chapter-1 divider (scan 5). */
export const EGYPT_DISCOVERY_EN_G2_T1_BOOK_START = 1;

/** Last printed page of the term — «TICKET TO VISIT A MONUMENT» (scan 48). */
export const EGYPT_DISCOVERY_EN_G2_T1_BOOK_END = 44;

/**
 * The scans before book 1: the cover (1), a blank back page (2, empty file),
 * the foreword (3) and the year-wide contents with the NAME slip (4).
 */
export const EGYPT_DISCOVERY_EN_G2_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/**
 * The scans after the term: the Term-2 divider and lessons (books 45–81), two
 * empty scans (86–87) and the print matter (scan 88).
 */
export const EGYPT_DISCOVERY_EN_G2_T1_BACK_MATTER = { from: 49, to: 88 } as const;

/**
 * The term pages the OCR never produced, as book pages. No scan is absent and
 * every term page carries text, so this list is empty; kept so the module
 * shares the shape of the other Egyptian specs.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface DiscoveryEnG2T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «Activity». */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one numbered «Lesson N» page of a chapter). */
export interface DiscoveryEnG2T1Lesson {
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
  concepts: DiscoveryEnG2T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed chapter of the term. Terms print no separate theme page here. */
export interface DiscoveryEnG2T1Section {
  /** This book's sections are its chapters. */
  kind: "chapter";
  /** Internal key: "1"…"6", in book order. */
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
  lessons: DiscoveryEnG2T1Lesson[];
}

const TYPE = "Activity";

function concept(bookFrom: number, title: string): DiscoveryEnG2T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The six chapters of the first term, with their numbered lessons and every
 * printed head, transcribed from the page the book prints it on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter ranges come from the book's «CONTENTS» (scan 4) and the dividers the
 * pages print: 1–14 (divider scan 5), 15–22 (scan 19), 23–30 (scan 27), 31–34
 * (scan 35), 35–38 (scan 39) and 39–44 (scan 43). Lesson numbers restart in
 * every chapter and are read from the «Lesson N» markers on the pages.
 */
export const EGYPT_DISCOVERY_EN_G2_T1_SECTIONS: DiscoveryEnG2T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "Theme 1: Who Am I? - Chapter 1: A Day in My Life",
    printedHead: "A DAY IN MY LIFE",
    bookFrom: 1,
    bookTo: 14,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "MEET NOUR’S FAMILY",
        printedHead: "MEET NOUR’S FAMILY",
        bookFrom: 8,
        concepts: [
          concept(2, "I am Egyptian"),
          concept(4, "Some hieroglyphic signs:"),
          concept(4, "Hieroglyphic Writing"),
          concept(5, "Hieroglyphic Words"),
          concept(7, "Birth certificate:"),
          concept(8, "MEET NOUR’S FAMILY"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "GOOD MORNING NOUR",
        printedHead: "GOOD MORNING NOUR",
        bookFrom: 9,
        concepts: [
          concept(9, "GOOD MORNING NOUR"),
          concept(9, "PROBLEMS AND SOLUTIONS"),
          concept(9, "MY PROBLEM AND SOLUTION"),
          concept(10, "I CAN COOPERATE AT SCHOOL"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "NOUR SHOWS GOOD CITIZENSHIP",
        printedHead: "NOUR SHOWS GOOD CITIZENSHIP",
        bookFrom: 11,
        concepts: [concept(11, "NOUR SHOWS GOOD CITIZENSHIP")],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "NOUR’S DAILY ROUTINE",
        printedHead: "NOUR’S DAILY ROUTINE",
        bookFrom: 12,
        concepts: [
          concept(12, "NOUR’S DAILY ROUTINE"),
          concept(13, "PRIORITIES"),
          concept(13, "TIME TO TRY SOMETHING NEW"),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "STRATEGIES FOR PEACE",
        printedHead: "STRATEGIES FOR PEACE",
        bookFrom: 14,
        concepts: [concept(14, "STRATEGIES FOR PEACE")],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "الثاني",
    title: "Theme 1: Who Am I? - Chapter 2: Taking Care of Me",
    printedHead: "TAKING CARE OF ME",
    bookFrom: 15,
    bookTo: 22,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "NOUR’S GROWING FAMILY",
        printedHead: "NOUR’S GROWING FAMILY",
        bookFrom: 16,
        concepts: [concept(16, "NOUR’S GROWING FAMILY"), concept(16, "THE BABY’S LIFE STAGES")],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "A BIRD’S LIFE CYCLE",
        printedHead: "A BIRD’S LIFE CYCLE",
        bookFrom: 17,
        concepts: [concept(17, "A BIRD’S LIFE CYCLE"), concept(17, "BABY BIRDS")],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "FEEDING BABY BIRDS",
        printedHead: "FEEDING BABY BIRDS",
        bookFrom: 18,
        concepts: [
          concept(18, "FEEDING BABY BIRDS"),
          concept(19, "THE BIRD’S BODY"),
          concept(19, "I CAN EAT"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "HOW HEALTHY FOODS HELP US",
        printedHead: "HOW HEALTHY FOODS HELP US",
        bookFrom: 20,
        concepts: [concept(20, "FOOD GROUP"), concept(20, "HOW HEALTHY FOODS HELP US")],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "MAKING CHOICES",
        printedHead: "MAKING CHOICES",
        bookFrom: 21,
        concepts: [concept(21, "MAKING CHOICES"), concept(21, "SOLVING PROBLEMS")],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: TYPE,
        title: "CLEANING VEGETABLES",
        printedHead: "CLEANING VEGETABLES",
        bookFrom: 22,
        concepts: [concept(22, "CLEANING VEGETABLES")],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "الثالث",
    title: "Theme 1: Who Am I? - Chapter 3: When I Grow Up",
    printedHead: "WHEN I GROW UP",
    bookFrom: 23,
    bookTo: 30,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "NOUR’S PARENTS",
        printedHead: "NOUR’S PARENTS",
        bookFrom: 24,
        concepts: [
          concept(24, "NOUR’S PARENTS"),
          concept(25, "PERSONAL INTEREST SURVEY"),
          concept(26, "ANALYZING OUR SURVEY"),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "AGRICULTURAL",
        printedHead: "AGRICULTURAL",
        bookFrom: 27,
        concepts: [concept(27, "AGRICULTURAL"), concept(27, "INDUSTRIAL")],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "VISITING MY AUNT AND UNCLE",
        printedHead: "VISITING MY AUNT AND UNCLE",
        bookFrom: 28,
        concepts: [
          concept(28, "VISITING MY AUNT AND UNCLE"),
          concept(29, "I WORK IN A HOTEL"),
          concept(30, "JOB RESEARCH"),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "الرابع",
    title: "Theme 2: The World Around Me - Chapter 1: What Is in the Night Sky?",
    printedHead: "WHAT IS IN THE NIGHT SKY ?",
    bookFrom: 31,
    bookTo: 34,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "NOUR AND HOSSAM",
        printedHead: "NOUR AND HOSSAM",
        bookFrom: 32,
        concepts: [concept(32, "NOUR AND HOSSAM")],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "OBSERVING A PATTERN",
        printedHead: "OBSERVING A PATTERN",
        bookFrom: 33,
        concepts: [concept(33, "OBSERVING A PATTERN"), concept(33, "NIGHT SKY ORION’S RISE TIME")],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "HOW BIG IS SOMETHING FAR AWAY?",
        printedHead: "HOW BIG IS SOMETHING FAR AWAY?",
        bookFrom: 34,
        concepts: [concept(34, "HOW BIG IS SOMETHING FAR AWAY?"), concept(34, "HOW BIG IS IT REALLY?")],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "الخامس",
    title: "Theme 2: The World Around Me - Chapter 2: Helping My Habitat",
    printedHead: "HELPING MY HABITAT",
    bookFrom: 35,
    bookTo: 38,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: TYPE,
        title: "OUR EGYPTIAN ENVIRONMENTS",
        printedHead: "OUR EGYPTIAN ENVIRONMENTS",
        bookFrom: 36,
        concepts: [concept(36, "OUR EGYPTIAN ENVIRONMENTS")],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "WHAT IS IN A HABITAT?",
        printedHead: "WHAT IS IN A HABITAT?",
        bookFrom: 37,
        concepts: [concept(37, "WHAT IS IN A HABITAT?")],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "BIRDS OF EGYPT",
        printedHead: "BIRDS OF EGYPT",
        bookFrom: 38,
        concepts: [concept(38, "BIRDS OF EGYPT")],
      },
    ],
  },
  {
    key: "6",
    kind: "chapter",
    ordinal: "السادس",
    title: "Theme 2: The World Around Me - Chapter 3: Monumental Designs",
    printedHead: "MONUMENTAL DESIGNS",
    bookFrom: 39,
    bookTo: 44,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: TYPE,
        title: "OUR WORLD",
        printedHead: "OUR WORLD",
        bookFrom: 40,
        concepts: [concept(40, "OUR WORLD")],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "WATER: SOLID, LIQUID, AND GAS",
        printedHead: "WATER: SOLID, LIQUID, AND GAS",
        bookFrom: 41,
        concepts: [concept(41, "WATER: SOLID, LIQUID, AND GAS")],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "FRESH WATER",
        printedHead: "FRESH WATER",
        bookFrom: 42,
        concepts: [concept(42, "FRESH WATER")],
      },
      {
        key: "6-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "NOUR AND HOSSAM VISIT A MONUMENT",
        printedHead: "NOUR AND HOSSAM VISIT A MONUMENT",
        bookFrom: 43,
        concepts: [
          concept(43, "NOUR AND HOSSAM VISIT A MONUMENT"),
          concept(43, "MONUMENTS OF EGYPT"),
          concept(44, "TICKET TO VISIT A MONUMENT"),
        ],
      },
    ],
  },
];

/**
 * The book-page span a lesson owns: from the chapter divider (its first lesson)
 * or its own head page, down to the page before the next lesson starts, bounded
 * by the chapter — so the divider stays inside the chapter it belongs to. When
 * the book prints two heads on one page they share a lesson, so distinct
 * lessons always start on distinct pages and the ranges tile the chapter
 * exactly.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_DISCOVERY_EN_G2_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_DISCOVERY_EN_G2_T1_SECTIONS.forEach((section, si) => {
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
  "discovery-en-g2-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (No term page of this book needs it — every term page carries
 * text — but the guard is kept so the loader shares one shape across books.)
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

/** The document a lesson grounds the tutor in: its own page range, in order. */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(sectionIndex, lessonIndex);
  return loadBookRange(from, to);
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/** Folds text for comparison: lowercases and removes letters' spacing/punctuation. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Whether `page` prints `needle`, ignoring case, spacing and punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints. This book's folio rides in the
 * page furniture at the top or the foot, bare («8», «14», «22», «34») or glued
 * to the running head («9 PRIMARY 2», «40 PRIMARY 2», «PRIMARY 2 41»), so the
 * top and bottom furniture lines each contribute both their space-stripped
 * whole and every whitespace-separated digit token. «Lesson N» numerals and
 * exercise numbers near the foot join the candidate set harmlessly: the page's
 * own number proves the mapping when present, via `printedFooter`.
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
 * mismatch). The four folio-less chapter dividers (1, 15, 23, 39) print only
 * their chapter head, never a folio, and are exempted via
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
 * The term pages that print no folio in the checked furniture, each with the
 * anchor the check accepts in place of a page number: the four folio-less
 * chapter dividers (books 1, 15, 23, 39), anchored on the chapter head the page
 * itself prints.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  1: "A DAY IN MY LIFE",
  15: "TAKING CARE OF ME",
  23: "WHEN I GROW UP",
  39: "MONUMENTAL DESIGNS",
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
  const units = EGYPT_DISCOVERY_EN_G2_T1_SECTIONS;
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
  if (first && first.bookFrom !== EGYPT_DISCOVERY_EN_G2_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_DISCOVERY_EN_G2_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_DISCOVERY_EN_G2_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_DISCOVERY_EN_G2_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real text and proves its book number — from the
 *     folio in its furniture, or, on the four chapter dividers named in
 *     `FOLIO_LESS_ANCHORS`, from the anchor the page itself prints;
 *  2. every chapter divider prints the chapter head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title and every activity's head is printed on the pages
 *     the lesson owns (the activity on its own page);
 *  4. every page in [1, 44] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of
 *     the term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_DISCOVERY_EN_G2_T1_SECTIONS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term is accounted for and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_DISCOVERY_EN_G2_T1_BOOK_START || book > EGYPT_DISCOVERY_EN_G2_T1_BOOK_END) continue;
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
        problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_DISCOVERY_EN_G2_T1_BOOK_END - EGYPT_DISCOVERY_EN_G2_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_DISCOVERY_EN_G2_T1_BOOK_START} و${EGYPT_DISCOVERY_EN_G2_T1_BOOK_END}`,
    );
  }

  // 2 + 3a. every chapter divider prints the chapter head, every lesson's first
  // page its head, and every lesson's title is printed somewhere in the pages
  // it owns.
  units.forEach((unit, ui) => {
    if (!pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} لا تطبع «${unit.printedHead}»`);
    }

    unit.lessons.forEach((lesson, li) => {
      if (!pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع «${lesson.printedHead}»`);
      }
      const { from, to } = lessonBookRange(ui, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      if (!titlePrinted) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
    });
  });

  // 3b. every activity's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (!pagePrints(c.bookFrom, c.title)) {
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
  for (let p = EGYPT_DISCOVERY_EN_G2_T1_BOOK_START; p <= EGYPT_DISCOVERY_EN_G2_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
