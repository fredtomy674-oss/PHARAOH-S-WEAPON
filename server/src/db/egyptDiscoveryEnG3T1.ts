// Primary 3 (الصف الثالث الابتدائي) Discover, English-medium («DISCOVER»),
// first term, Ministry of Education and Technical Education 2025/2026 edition
// (the cover imprint prints «PRIMARY 3 / DISCOVER / 2025-2026»).
//
// Reserved ids (header only — this module wires nothing): the English-medium
// Discover curriculum for Primary 3 is `eg-g3-discovery-en`, subject
// `discovery-en` (name "Discovery (English)", nameAr "اكتشف (بالإنجليزية)"),
// lesson prefix `l-g3-dis-en-`, grade `grade-3` (name "Grade 3", nameAr
// "الصف الثالث الابتدائي").
//
// WHAT THE 96 SCANS PROVE — THE WHOLE FIRST TERM, CHAPTER BY CHAPTER
// The corpus holds 96 of the book's 97 scans (`pages-001`, `pages-003` …
// `pages-097`): scan 2 — the blank back of the cover — was never produced and
// is front matter, outside the term. The book's own «Contents» (scan 4) lists
// the year-wide chapter skeleton with printed page numbers: Theme 1 «WHO AM
// I? - LIVING HEALTHY» — Chapter 1 «Making a Stronger Me 1», Chapter 2
// «Making a Healthy Body 11», Chapter 3 «Get Fit with Healthy Eating 19» —
// and Theme 2 «THE WORLD AROUND ME - TAKING CARE OF OUR WORLD» — Chapter 1
// «When Habitats Change 25», Chapter 2 «Water, Water Everywhere 31»,
// Chapter 3 «How Can I Help? 37» — then the second term («Theme 3: HOW THE
// WORLD WORKS» from 45, «Theme 4: COMMUNICATION» from 69). The first term is
// therefore printed book pages 1–44: the Chapter-1 divider (scan 5) down to
// the «ADVANTAGES AND DISADVANTAGES» page (scan 48). This spec describes
// exactly those pages.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every numbered content page prints its own folio in its page furniture, bare
// («4», «10», «14», «22», «34») or glued to the running head («8 PRIMARY 3»,
// «PRIMARY 3 9», «40 PRIMARY 3», «44 PRIMARY 3»). Matching folios to scans:
// scan 8 prints «4 PRIMARY 3» (book 4), scan 12 prints «8 PRIMARY 3»
// (book 8), scan 14 prints «10 PRIMARY 3» (book 10), scan 16 prints
// «12 PRIMARY 3» (book 12), scan 24 prints «20 PRIMARY 3» (book 20), scan 36
// prints «32 PRIMARY 3» (book 32) and scan 48 prints «44 PRIMARY 3»
// (book 44) — always scan = book + 4. The book's own «Contents» independently
// confirms it: every chapter divider sits exactly where the contents says it
// does (scans 5, 15, 23, 29, 35, 41 for books 1, 11, 19, 25, 31, 37).
//
// FRONT MATTER IS SCANS 1–4; BACK MATTER IS SCANS 49–97
// Scans 1–4 are before book page 1: the cover (scan 1), the blank back page
// (scan 2, absent from the corpus — an empty file was never produced), the
// «FOREWORD» (scan 3) and the year-wide «Contents» with the NAME slip
// (scan 4). Scans 49–97 are after the term: the Term-2 divider and lessons
// (books 45–92), the print matter (scan 96) and one empty scan (97). There is
// no appendix in these scans, so `allLessonExtras()` returns nothing.
//
// EIGHT TERM PAGES PRINT NO FOLIO — EACH IS ANCHORED ON A PRINTED HEAD
// The six chapter dividers (books 1, 11, 19, 25, 31, 37) print their chapter
// head and no page number, and the two «I'm Egyptian» intro pages (books 2–3)
// print no folio either. Rather than weaken the page-number check these eight
// pages are exempt from it in `assertTreeMatchesTheBook` and anchored on a
// string the page itself prints, named in `FOLIO_LESS_ANCHORS`. Every other
// term page proves its book number from the folio in its furniture.
//
// EVERY TERM PAGE CARRIES REAL TEXT
// All 44 term pages carry text (their 44 scans are all present in the corpus).
// No scan is absent inside the term, so `MISSING_SCANS` is empty and
// `pagesChecked` equals the full term range, 44 − 1 + 1 = 44. The one absent
// scan of the corpus (scan 2) is front matter and never enters the check.
//
// EACH CHAPTER'S LESSONS ARE ITS NUMBERED «Lesson N» PAGES
// Lesson numbers restart in every chapter and are read from the pages:
// Chapter 1 Lessons 1–2 (books 8, 9), Chapter 2 Lessons 1–5 (books 12, 14,
// 16, 17, 18), Chapter 3 Lessons 1–5 (books 20–24), Chapter 4 Lessons 1–5
// (books 26–30), Chapter 5 Lessons 1–4 (books 32, 34, 35, 36) and Chapter 6
// Lessons 1–6 (books 38, 40, 41, 42, 43, 44). A lesson's title is the
// activity head its opening page prints («LIFE SKILLS», «MY HEART»,
// «FLOOD PREVENTION», …). Where one page prints two heads both ride with the
// lesson as its concepts (book 10 «WHAT WOULD YOU DO?» + «OUR CLASS PLEDGE»;
// book 38 «ALEXANDRIA HEAVY RAINS» + «IDENTIFYING IMPACTS»). The chapter-2
// reading spread prints its section heads with the follow-up questions, so
// book 15 contributes «Get Enough Sleep», «Stay Positive and Calm»,
// «Eat Healthy» and «Stay Active» to lesson 2-2, exactly as the Arabic-medium
// twin book models its four «عادات صحية» sub-heads; the chapter-3 water
// reading likewise contributes «What does water do for your body?» and «Why
// do we need to drink water?» to lesson 3-4, the two sections the book-24
// journal table summarises. Chapter 1's unnumbered intro pages (books 2–7:
// «I'm Egyptian...» and the hieroglyphic-writing spread) are owned by lesson
// 1-1 exactly as the Grade 2 English Discover book attaches its «I am
// Egyptian» and hieroglyph pages to lesson 1-1, and their printed heads are
// that lesson's leading concepts. Nothing is invented: every title below is a
// string the page its `bookFrom` names prints.
//
// BOOK 27 PRINTS NO LESSON NUMBER — IT IS CHAPTER 4'S LESSON 2
// Book 27 («IS THIS THE BEST HABITAT?») prints the chapter running head and
// its activity head but no «Lesson N» marker, while book 28 prints
// «Lesson 3». A chapter numbered 1, 3, 4, 5 with no second lesson is not
// credible; the Arabic-medium twin of this same book numbers its fifth
// chapter-4 lesson starts 26, 27, 28, 29, 30 («احتياجات الكائنات الحية»,
// «ملاءمة البيئات الطبيعية», …), and «IS THIS THE BEST HABITAT?» is that
// second lesson's topic. The «Lesson 2» marker sat in page furniture the OCR
// did not capture, so book 27 stands alone as lesson 4-2 with ordinal
// «الثاني». Two spreads print the same lesson number on both pages and are
// one lesson each: books 32–33 («RASHAD AND ZEINA VISIT THE MUSEUM», both
// print Lesson 1) and books 38–39 («ALEXANDRIA HEAVY RAINS» / «HEAVY RAINS
// IN 2015», both print Lesson 1), exactly as the Arabic twin models them.
// Book 13 («HEALTHY OR UNHEALTHY», prints Lesson 1) rides with the Yasmeen
// story of lesson 2-1, and book 10 («WHAT WOULD YOU DO?», prints Lesson 2)
// with lesson 1-2.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// The apostrophe prints as straight ASCII U+0027 («I'm», «YASMEEN'S»,
// «EGYPT'S») and is transcribed byte-verbatim. Body typos («importnce»,
// doubled table heads) sit outside every head and are not transcribed. Inline
// exercise matter (diagram labels such as «Bones / Skin / Muscle» on book 16,
// the «Heart / Stomach / Veins» word bank on book 18, «Diet:» / «Nutrient:»
// definitions, map labels on book 36, the trait word list on book 42 and
// bold vocabulary inside stories such as «shadoof» on book 43) is not
// modelled: only standalone activity heads become concepts.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.44 = scan p.48). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the Chapter-1 divider (scan 5). */
export const EGYPT_DISCOVERY_EN_G3_T1_BOOK_START = 1;

/** Last printed page of the term — «ADVANTAGES AND DISADVANTAGES» (scan 48). */
export const EGYPT_DISCOVERY_EN_G3_T1_BOOK_END = 44;

/**
 * The scans before book 1: the cover (1), a blank back page (2, absent from
 * the corpus), the foreword (3) and the year-wide contents with the NAME slip
 * (4).
 */
export const EGYPT_DISCOVERY_EN_G3_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/**
 * The scans after the term: the Term-2 divider and lessons (books 45–92),
 * the print matter (scan 96) and one empty scan (97).
 */
export const EGYPT_DISCOVERY_EN_G3_T1_BACK_MATTER = { from: 49, to: 97 } as const;

/**
 * The term pages the OCR never produced, as book pages. No scan is absent
 * inside the term — every one of the 44 term scans carries text — so this
 * list is empty; the corpus's one absent scan (scan 2, the blank back of the
 * cover) is front matter and never enters the check. Kept so the module
 * shares the shape of the other Egyptian specs.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface DiscoveryEnG3T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «Activity». */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one numbered «Lesson N» page of a chapter). */
export interface DiscoveryEnG3T1Lesson {
  /** App-addressable key, e.g. "1-2" (chapter 1, lesson 2). */
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
  concepts: DiscoveryEnG3T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed chapter of the term. Terms print no separate theme page here. */
export interface DiscoveryEnG3T1Section {
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
  lessons: DiscoveryEnG3T1Lesson[];
}

const TYPE = "Activity";

function concept(bookFrom: number, title: string): DiscoveryEnG3T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The six chapters of the first term, with their numbered lessons and every
 * printed head, transcribed from the page the book prints it on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter ranges come from the book's «Contents» (scan 4) and the dividers the
 * pages print: 1–10 (divider scan 5), 11–18 (scan 15), 19–24 (scan 23),
 * 25–30 (scan 29), 31–36 (scan 35) and 37–44 (scan 41). Lesson numbers
 * restart in every chapter and are read from the «Lesson N» markers on the
 * pages; book 27 prints no marker (see the header note) and stands as
 * chapter 4's Lesson 2.
 */
export const EGYPT_DISCOVERY_EN_G3_T1_SECTIONS: DiscoveryEnG3T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "Theme 1: Who Am I? - Chapter 1: Making a Stronger Me",
    printedHead: "MAKING A STRONGER ME",
    bookFrom: 1,
    bookTo: 10,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "LIFE SKILLS",
        printedHead: "LIFE SKILLS",
        bookFrom: 8,
        concepts: [
          concept(2, "I'm Egyptian..."),
          concept(3, "Egypt is the Land of Peace and Safety"),
          concept(4, "Hieroglyphic writing"),
          concept(4, "Some hieroglyphic signs:"),
          concept(5, "The hieroglyphic word"),
          concept(6, "The hieroglyphic word"),
          concept(7, "Names of Egypt :"),
          concept(8, "LIFE SKILLS"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "USING CRITICAL THINKING SKILLS",
        printedHead: "USING CRITICAL THINKING SKILLS",
        bookFrom: 9,
        concepts: [
          concept(9, "USING CRITICAL THINKING SKILLS"),
          concept(10, "WHAT WOULD YOU DO?"),
          concept(10, "OUR CLASS PLEDGE"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "الثاني",
    title: "Theme 1: Who Am I? - Chapter 2: Making a Healthy Body",
    printedHead: "MAKING A HEALTHY BODY",
    bookFrom: 11,
    bookTo: 18,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "YASMEEN'S CHOICES",
        printedHead: "YASMEEN'S CHOICES",
        bookFrom: 12,
        concepts: [concept(12, "YASMEEN'S CHOICES"), concept(13, "HEALTHY OR UNHEALTHY")],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "HEALTHY HABITS",
        printedHead: "HEALTHY HABITS",
        bookFrom: 14,
        concepts: [
          concept(14, "HEALTHY HABITS"),
          concept(15, "Get Enough Sleep"),
          concept(15, "Stay Positive and Calm"),
          concept(15, "Eat Healthy"),
          concept(15, "Stay Active"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "SKIN AND HEART",
        printedHead: "SKIN AND HEART",
        bookFrom: 16,
        concepts: [concept(16, "SKIN AND HEART")],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "WHAT HAPPENS TO THE FOOD YOU EAT?",
        printedHead: "WHAT HAPPENS TO THE FOOD YOU EAT?",
        bookFrom: 17,
        concepts: [concept(17, "WHAT HAPPENS TO THE FOOD YOU EAT?")],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "MY HEART",
        printedHead: "MY HEART",
        bookFrom: 18,
        concepts: [concept(18, "MY HEART")],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "الثالث",
    title: "Theme 1: Who Am I? - Chapter 3: Get Fit with Healthy Eating",
    printedHead: "GET FIT WITH HEALTHY EATING",
    bookFrom: 19,
    bookTo: 24,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "A CANTEEN AT SCHOOL",
        printedHead: "A CANTEEN AT SCHOOL",
        bookFrom: 20,
        concepts: [concept(20, "A CANTEEN AT SCHOOL")],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "MY DIET",
        printedHead: "MY DIET",
        bookFrom: 21,
        concepts: [concept(21, "MY DIET")],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "VITAMINS AND MINERALS",
        printedHead: "VITAMINS AND MINERALS",
        bookFrom: 22,
        concepts: [concept(22, "VITAMINS AND MINERALS")],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "WHY WATER MATTERS",
        printedHead: "WHY WATER MATTERS",
        bookFrom: 23,
        concepts: [
          concept(23, "WHY WATER MATTERS"),
          concept(23, "What does water do for your body?"),
          concept(23, "Why do we need to drink water?"),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "DOUBLE ENTRY JOURNAL",
        printedHead: "DOUBLE ENTRY JOURNAL",
        bookFrom: 24,
        concepts: [concept(24, "DOUBLE ENTRY JOURNAL")],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "الرابع",
    title: "Theme 2: The World Around Me - Chapter 1: When Habitats Change",
    printedHead: "WHEN HABITATS CHANGE",
    bookFrom: 25,
    bookTo: 30,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "NEEDS OF LIVING ORGANISMS",
        printedHead: "NEEDS OF LIVING ORGANISMS",
        bookFrom: 26,
        concepts: [concept(26, "NEEDS OF LIVING ORGANISMS")],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "IS THIS THE BEST HABITAT?",
        printedHead: "IS THIS THE BEST HABITAT?",
        bookFrom: 27,
        concepts: [concept(27, "IS THIS THE BEST HABITAT?")],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "CHANGES IN THE ENVIRONMENT",
        printedHead: "CHANGES IN THE ENVIRONMENT",
        bookFrom: 28,
        concepts: [concept(28, "CHANGES IN THE ENVIRONMENT")],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "PLANTS AND ANIMALS CAN CAUSE CHANGE",
        printedHead: "PLANTS AND ANIMALS CAN CAUSE CHANGE",
        bookFrom: 29,
        concepts: [concept(29, "PLANTS AND ANIMALS CAN CAUSE CHANGE")],
      },
      {
        key: "4-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "RESEARCH",
        printedHead: "RESEARCH",
        bookFrom: 30,
        concepts: [concept(30, "RESEARCH")],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "الخامس",
    title: "Theme 2: The World Around Me - Chapter 2: Water, Water Everywhere",
    printedHead: "WATER, WATER EVERYWHERE",
    bookFrom: 31,
    bookTo: 36,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: TYPE,
        title: "RASHAD AND ZEINA VISIT THE MUSEUM",
        printedHead: "RASHAD AND ZEINA VISIT THE MUSEUM",
        bookFrom: 32,
        concepts: [concept(32, "RASHAD AND ZEINA VISIT THE MUSEUM")],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "THE WATER CYCLE IN NATURE",
        printedHead: "THE WATER CYCLE IN NATURE",
        bookFrom: 34,
        concepts: [concept(34, "THE WATER CYCLE IN NATURE")],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "COMPARING EGYPT'S CLIMATES",
        printedHead: "COMPARING EGYPT'S CLIMATES",
        bookFrom: 35,
        concepts: [concept(35, "COMPARING EGYPT'S CLIMATES")],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "AFRICA",
        printedHead: "AFRICA",
        bookFrom: 36,
        concepts: [concept(36, "AFRICA")],
      },
    ],
  },
  {
    key: "6",
    kind: "chapter",
    ordinal: "السادس",
    title: "Theme 2: The World Around Me - Chapter 3: How Can I Help?",
    printedHead: "HOW CAN I HELP?",
    bookFrom: 37,
    bookTo: 44,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: TYPE,
        title: "ALEXANDRIA HEAVY RAINS",
        printedHead: "ALEXANDRIA HEAVY RAINS",
        bookFrom: 38,
        concepts: [
          concept(38, "ALEXANDRIA HEAVY RAINS"),
          concept(38, "IDENTIFYING IMPACTS"),
          concept(39, "HEAVY RAINS IN 2015"),
        ],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "BEING A GOOD CITIZEN",
        printedHead: "BEING A GOOD CITIZEN",
        bookFrom: 40,
        concepts: [concept(40, "BEING A GOOD CITIZEN")],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "FLOOD PREVENTION",
        printedHead: "FLOOD PREVENTION",
        bookFrom: 41,
        concepts: [concept(41, "FLOOD PREVENTION")],
      },
      {
        key: "6-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "WHAT MAKES A GOOD LEADER?",
        printedHead: "WHAT MAKES A GOOD LEADER?",
        bookFrom: 42,
        concepts: [concept(42, "WHAT MAKES A GOOD LEADER?")],
      },
      {
        key: "6-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "A PROBLEM AT THE OASIS",
        printedHead: "A PROBLEM AT THE OASIS",
        bookFrom: 43,
        concepts: [concept(43, "A PROBLEM AT THE OASIS")],
      },
      {
        key: "6-6",
        ordinal: "السادس",
        type: TYPE,
        title: "ADVANTAGES AND DISADVANTAGES",
        printedHead: "ADVANTAGES AND DISADVANTAGES",
        bookFrom: 44,
        concepts: [concept(44, "ADVANTAGES AND DISADVANTAGES")],
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
  const section = EGYPT_DISCOVERY_EN_G3_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_DISCOVERY_EN_G3_T1_SECTIONS.forEach((section, si) => {
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
  "discovery-en-g3-t1",
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
 * to the running head («8 PRIMARY 3», «40 PRIMARY 3», «PRIMARY 3 41»), so the
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
 * mismatch). The eight folio-less pages (1, 2, 3, 11, 19, 25, 31, 37) print
 * only their head, never a folio, and are exempted via
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
 * anchor the check accepts in place of a page number: the six chapter
 * dividers (books 1, 11, 19, 25, 31, 37, anchored on their chapter head) and
 * the two «I'm Egyptian» intro pages (books 2–3, anchored on the head each
 * page prints).
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  1: "MAKING A STRONGER ME",
  2: "I'm Egyptian",
  3: "Egypt is the Land of Peace and Safety",
  11: "MAKING A HEALTHY BODY",
  19: "GET FIT WITH HEALTHY EATING",
  25: "WHEN HABITATS CHANGE",
  31: "WATER, WATER EVERYWHERE",
  37: "HOW CAN I HELP?",
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
  const units = EGYPT_DISCOVERY_EN_G3_T1_SECTIONS;
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
  if (first && first.bookFrom !== EGYPT_DISCOVERY_EN_G3_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_DISCOVERY_EN_G3_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_DISCOVERY_EN_G3_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_DISCOVERY_EN_G3_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real text and proves its book number — from the
 *     folio in its furniture, or, on the eight pages named in
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
  const units = EGYPT_DISCOVERY_EN_G3_T1_SECTIONS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term is accounted for and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_DISCOVERY_EN_G3_T1_BOOK_START || book > EGYPT_DISCOVERY_EN_G3_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_DISCOVERY_EN_G3_T1_BOOK_END - EGYPT_DISCOVERY_EN_G3_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_DISCOVERY_EN_G3_T1_BOOK_START} و${EGYPT_DISCOVERY_EN_G3_T1_BOOK_END}`,
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
  for (let p = EGYPT_DISCOVERY_EN_G3_T1_BOOK_START; p <= EGYPT_DISCOVERY_EN_G3_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
