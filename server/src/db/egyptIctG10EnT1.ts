// PHASE G10-ict-en — official Egypt Secondary-1 (Grade 10) ICT (English-medium
// edition), first term («كتاب الوزارة»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g10-ict-en` is rebuilt from the English-medium textbook
// «Programming and Artificial Intelligence — An Introduction to Information and
// Communication Technology, For First Year of Secondary School» (202 OCR pages).
// This module is the single source of truth for its structure: the thirteen
// printed chapters of the first term, the sixty-two lessons its printed
// «CONTENTS» lists (the book's own «N-M» sections), and, for every lesson, the
// book's own printed heads. The self-checks at the bottom prove that mapping
// against the OCR itself, page by page.
//
// THE OFFSET IS ZERO — book page = OCR page index
// Every content page prints its own folio in the running head, glued to the
// first line: OCR `pages-004` prints «4Information Study», `pages-073` prints
// «73Information Study», `pages-174` prints «174». So `BOOK_TO_PDF_OFFSET` is 0
// and `loadBookPage(book)` reads `pages-{book}`. The book's own «CONTENTS»
// (OCR pages 2–3) independently confirms the lesson starts.
//
// A BORN-DIGITAL TEXT-LAYER SHIFT AT OCR PAGE 175
// From OCR page 175 onward the text layer prints the folio one greater than the
// page index: `pages-175` prints «176», `pages-201` prints «202». This is an OCR
// page that lost its own heading, not a book page in between — the book prints
// no folio «175» at all (chapter 13 opens directly on printed page 176, and
// printed 202 is the last lesson, `13-12`). `printedFooter` therefore returns
// the folio the page actually prints, and `expectedPrintedFolio` names the
// number each page index is expected to print (index for 4–174, index + 1 from
// 175 on). Everything else in this module works in page indices.
//
// FRONT AND BACK MATTER ARE NOT THE TERM
// OCR pages 1–3 are before the term: the cover (1) and the two-page printed
// «CONTENTS» (2–3). OCR page 202 is after the term: a divider page printing
// only «EDUCATION SPRINGS NEW LIFE». The term runs from OCR page 4 (chapter 1,
// lesson 1-1) to OCR page 201 (chapter 13, lesson 13-12), so
// `EGYPT_ICT_G10_EN_T1_BOOK_START = 4` and `..._BOOK_END = 201`; the checks
// prove the whole term is tiled with no gaps, so nothing is unreachable.
//
// ONE CHAPTER = ONE UNIT, ONE PRINTED «N-M» SECTION = ONE LESSON
// The book's index stops at its «N-M» sections, so the app mirrors the book:
// chapter → lesson. A lesson's `bookFrom` is the page that prints its title (its
// numbered heading, e.g. «6-8 Digitization of Images», which for 6-8 sits at the
// foot of page 73); the range it owns runs to the page before the next lesson
// starts (or to the chapter's last page), so the ranges tile each chapter and
// the chapters tile the term exactly.
//
// WHY A LESSON'S CONCEPTS ARE ITS PRINTED HEADS
// This book prints no per-lesson «Objectives» list; its lesson layer is the
// printed section headings («Data, Information, Knowledge», «Passwords and
// Authentication», …). Every `concepts` entry below is a string the book
// itself prints on the page its `bookFrom` names. Nothing is invented. (Unlike
// `assertTreeMatchesTheBook`, `isConsistent` does not re-read them, but they are
// transcribed from the same pages the check reads.)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ OCR page index N + 0 (verified: book p.4 = OCR 4). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the term — chapter 1, lesson 1-1 (OCR page 4). */
export const EGYPT_ICT_G10_EN_T1_BOOK_START = 4;

/** Last printed page of the term — chapter 13, lesson 13-12 (OCR page 201). */
export const EGYPT_ICT_G10_EN_T1_BOOK_END = 201;

/**
 * First OCR page index whose printed folio is one greater than the index (the
 * text layer shifts by one from here to the end of the term).
 */
export const EGYPT_ICT_G10_EN_T1_FOLIO_SHIFT_FROM = 175;

/** The OCR pages before the term: the cover and the printed «CONTENTS». */
export const EGYPT_ICT_G10_EN_T1_FRONT_MATTER = { from: 1, to: 3 } as const;

/** The OCR pages after the term: the divider printing «EDUCATION SPRINGS NEW LIFE». */
export const EGYPT_ICT_G10_EN_T1_BACK_MATTER = { from: 202, to: 202 } as const;

/** One lesson (one printed «N-M» section) of the textbook. */
export interface IctG10EnT1Lesson {
  /** App-addressable key, e.g. "2-3" (chapter 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed at the head of the lesson, verbatim (English). */
  title: string;
  /** First printed page of the lesson — the page that prints its title. */
  bookFrom: number;
  /**
   * The book's printed heads for this lesson, transcribed verbatim from the
   * page its `bookFrom` names (there is no «Objectives» list in this book).
   */
  concepts: string[];
}

/** One printed section of the book — one of the thirteen chapters of term 1. */
export interface IctG10EnT1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Chapter title as printed in the book's «CONTENTS», verbatim (English). */
  title: string;
  /** First printed book page of the chapter — its first lesson's page. */
  bookFrom: number;
  /** Last printed book page of the chapter — the page before the next chapter. */
  bookTo: number;
  lessons: IctG10EnT1Lesson[];
}

/**
 * The thirteen chapters of the first term with their sixty-two printed
 * lessons: chapter/lesson starts from the book's «CONTENTS» (OCR pages 2–3),
 * heads from each lesson's first page. Verified against every printed page by
 * `assertTreeMatchesTheBook`.
 */
export const EGYPT_ICT_G10_EN_T1_UNITS: IctG10EnT1Unit[] = [
  {
    ordinal: "الأولى",
    title: "Chapter 1 What is Information?",
    bookFrom: 4,
    bookTo: 11,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "Information and Media",
        bookFrom: 4,
        concepts: ["Data, Information, Knowledge", "Media"],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "Information Ethics",
        bookFrom: 8,
        concepts: ["Information Ethics", "Problems that occur with smartphones and social media"],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "Chapter 2 Regulations and Rights in the Information Society",
    bookFrom: 12,
    bookTo: 23,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "Personal Information",
        bookFrom: 12,
        concepts: ["Personal Information"],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "Intellectual Property Rights",
        bookFrom: 16,
        concepts: ["Intellectual Property Rights"],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "Utilization and Disclosure of Information",
        bookFrom: 20,
        concepts: ["Utilization and Disclosure of Information", "Purpose of Copyright"],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "Chapter 3 Information Security",
    bookFrom: 24,
    bookTo: 41,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "Threats and Countermeasures in Information Security [1]",
        bookFrom: 24,
        concepts: ["Information Security", "The three essential elements of information security"],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "Threats and Countermeasures in Information Security [2]",
        bookFrom: 28,
        concepts: ["Passwords and Authentication"],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "Threats and Countermeasures in Information Security [3]",
        bookFrom: 32,
        concepts: ["Fraudulent Billing"],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        title: "Information Technology for Safety [1]",
        bookFrom: 35,
        concepts: ["Encryption"],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        title: "Information Technology for Safety [2]",
        bookFrom: 38,
        concepts: ["Digital Signature", "Hash function"],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "Chapter 4 Information Technology and Society",
    bookFrom: 42,
    bookTo: 45,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "Development of Information Technology",
        bookFrom: 42,
        concepts: ["Advancements in Information Technology and Future Society", "Flow of Societal Development"],
      },
    ],
  },
  {
    ordinal: "الخامسة",
    title: "Chapter 5 Communication",
    bookFrom: 46,
    bookTo: 52,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        title: "Development of Communication Methods",
        bookFrom: 46,
        concepts: ["Media and Its Evolution", "Communication and Its Development"],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        title: "Communication and Its Forms",
        bookFrom: 48,
        concepts: ["Communication and Its Forms", "Classification of Communication"],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        title: "Internet and Communication",
        bookFrom: 50,
        concepts: ["Internet Communication"],
      },
    ],
  },
  {
    ordinal: "السادسة",
    title: "Chapter 6 Information Design",
    bookFrom: 53,
    bookTo: 84,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        title: "Analog and Digital",
        bookFrom: 53,
        concepts: ["Analog and Digital"],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        title: "Binary and Amount of Information",
        bookFrom: 55,
        concepts: ["Bits and Bytes"],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        title: "Hexadecimal",
        bookFrom: 59,
        concepts: ["Hexadecimal"],
      },
      {
        key: "6-4",
        ordinal: "الرابع",
        title: "Digital Representation of Characters",
        bookFrom: 61,
        concepts: ["Digital Representation of Characters", "Character code", "Character code system"],
      },
      {
        key: "6-5",
        ordinal: "الخامس",
        title: "Numerical Calculations [1]",
        bookFrom: 65,
        concepts: ["Addition and Subtraction of Binary Numbers"],
      },
      {
        key: "6-6",
        ordinal: "السادس",
        title: "Numerical Calculations [2]",
        bookFrom: 67,
        concepts: ["Representation of Negative Numbers Using Complements"],
      },
      {
        key: "6-7",
        ordinal: "السابع",
        title: "Digitalization of Sound",
        bookFrom: 69,
        concepts: ["Sound", "Digitalization of Sound"],
      },
      {
        key: "6-8",
        ordinal: "الثامن",
        title: "Digitization of Images",
        bookFrom: 73,
        concepts: ["Digitization of Images"],
      },
      {
        key: "6-9",
        ordinal: "التاسع",
        title: "Digital Representation and Compression Technology for Videos",
        bookFrom: 77,
        concepts: ["Mechanism of Videos", "Data Compression"],
      },
      {
        key: "6-10",
        ordinal: "العاشر",
        title: "Information Design",
        bookFrom: 81,
        concepts: ["Information Design", "Design Techniques for Ease of Understanding"],
      },
    ],
  },
  {
    ordinal: "السابعة",
    title: "Chapter 7 Computers",
    bookFrom: 85,
    bookTo: 94,
    lessons: [
      {
        key: "7-1",
        ordinal: "الأول",
        title: "Computer Configuration",
        bookFrom: 85,
        concepts: ["The Five Major Components of a Computer"],
      },
      {
        key: "7-2",
        ordinal: "الثاني",
        title: "Computer Software",
        bookFrom: 89,
        concepts: ["Hardware and Software"],
      },
      {
        key: "7-3",
        ordinal: "الثالث",
        title: "Logic Circuits",
        bookFrom: 91,
        concepts: ["Logic Circuits"],
      },
    ],
  },
  {
    ordinal: "الثامنة",
    title: "Chapter 8 Networks",
    bookFrom: 95,
    bookTo: 110,
    lessons: [
      {
        key: "8-1",
        ordinal: "الأول",
        title: "Computer Networks",
        bookFrom: 95,
        concepts: ["Information and Communication Networks"],
      },
      {
        key: "8-2",
        ordinal: "الثاني",
        title: "IP Addresses and Domain Names",
        bookFrom: 99,
        concepts: ["IP Addresses and Domain Names"],
      },
      {
        key: "8-3",
        ordinal: "الثالث",
        title: "Communication Protocol",
        bookFrom: 101,
        concepts: ["Communication Protocol"],
      },
      {
        key: "8-4",
        ordinal: "الرابع",
        title: "Mechanism of Web Pages and Emails",
        bookFrom: 105,
        concepts: ["Mechanism of the Internet"],
      },
      {
        key: "8-5",
        ordinal: "الخامس",
        title: "Network Transfer Speed",
        bookFrom: 109,
        concepts: ["Network Transfer Speed"],
      },
    ],
  },
  {
    ordinal: "التاسعة",
    title: "Chapter 9 Databases",
    bookFrom: 111,
    bookTo: 122,
    lessons: [
      {
        key: "9-1",
        ordinal: "الأول",
        title: "Database [1]",
        bookFrom: 111,
        concepts: ["Database Management System"],
      },
      {
        key: "9-2",
        ordinal: "الثاني",
        title: "Database [2]",
        bookFrom: 115,
        concepts: ["Relational Database"],
      },
      {
        key: "9-3",
        ordinal: "الثالث",
        title: "Various Information Systems",
        bookFrom: 119,
        concepts: ["Information Systems"],
      },
    ],
  },
  {
    ordinal: "العاشرة",
    title: "Chapter 10 Data Analysis",
    bookFrom: 123,
    bookTo: 141,
    lessons: [
      {
        key: "10-1",
        ordinal: "الأول",
        title: "Types of Data and Analysis",
        bookFrom: 123,
        concepts: ["Types of Data"],
      },
      {
        key: "10-2",
        ordinal: "الثاني",
        title: "Data Analysis [1]",
        bookFrom: 127,
        concepts: ["Data Organization"],
      },
      {
        key: "10-3",
        ordinal: "الثالث",
        title: "Data Analysis [2]",
        bookFrom: 131,
        concepts: ["Quartiles"],
      },
      {
        key: "10-4",
        ordinal: "الرابع",
        title: "Data Analysis [3]",
        bookFrom: 134,
        concepts: ["Variance and Standard Deviation"],
      },
      {
        key: "10-5",
        ordinal: "الخامس",
        title: "Data Analysis [4]",
        bookFrom: 136,
        concepts: ["Scatter Plots, Correlations, and Cross Tabulation"],
      },
      {
        key: "10-6",
        ordinal: "السادس",
        title: "Data Analysis [5]",
        bookFrom: 140,
        concepts: ["Regression Analysis"],
      },
    ],
  },
  {
    ordinal: "الحادية عشرة",
    title: "Chapter 11 Simulations",
    bookFrom: 142,
    bookTo: 154,
    lessons: [
      {
        key: "11-1",
        ordinal: "الأول",
        title: "Modeling",
        bookFrom: 142,
        concepts: ["Modeling"],
      },
      {
        key: "11-2",
        ordinal: "الثاني",
        title: "Simulations [1]",
        bookFrom: 145,
        concepts: ["Methods of Referencing in Spreadsheet Software"],
      },
      {
        key: "11-3",
        ordinal: "الثالث",
        title: "Simulations [2]",
        bookFrom: 149,
        concepts: ["Using Functions in Spreadsheet Software"],
      },
      {
        key: "11-4",
        ordinal: "الرابع",
        title: "Queues",
        bookFrom: 153,
        concepts: ["Queues"],
      },
    ],
  },
  {
    ordinal: "الثانية عشرة",
    title: "Chapter 12 Programming (Python)",
    bookFrom: 155,
    bookTo: 174,
    lessons: [
      {
        key: "12-1",
        ordinal: "الأول",
        title: "Algorithm",
        bookFrom: 155,
        concepts: ["Algorithm", "Flowcharts and activity diagrams"],
      },
      {
        key: "12-2",
        ordinal: "الثاني",
        title: "Programming Basics [1] (Python)",
        bookFrom: 159,
        concepts: ["Variables and Sequential Structure"],
      },
      {
        key: "12-3",
        ordinal: "الثالث",
        title: "Programming Basics [2] (Python)",
        bookFrom: 163,
        concepts: ["Loop Structure"],
      },
      {
        key: "12-4",
        ordinal: "الرابع",
        title: "Application of Programming [1] (Python)",
        bookFrom: 168,
        concepts: ["(List)"],
      },
      {
        key: "12-5",
        ordinal: "الخامس",
        title: "Application of Programming [2] (Python)",
        bookFrom: 172,
        concepts: ["Functions"],
      },
    ],
  },
  {
    ordinal: "الثالثة عشرة",
    title: "Chapter 13 AI Programming",
    bookFrom: 175,
    bookTo: 201,
    lessons: [
      {
        key: "13-1",
        ordinal: "الأول",
        title: "About Generative AI",
        bookFrom: 175,
        concepts: ["About Generative AI"],
      },
      {
        key: "13-2",
        ordinal: "الثاني",
        title: "HTML, CSS",
        bookFrom: 177,
        concepts: ["HTML, CSS"],
      },
      {
        key: "13-3",
        ordinal: "الثالث",
        title: "HTML, JS",
        bookFrom: 180,
        concepts: ["HTML, JS"],
      },
      {
        key: "13-4",
        ordinal: "الرابع",
        title: "Creating Static Web Pages",
        bookFrom: 185,
        concepts: ["Creating Static Web Pages"],
      },
      {
        key: "13-5",
        ordinal: "الخامس",
        title: "Creating Dynamic Web Pages",
        bookFrom: 189,
        concepts: ["Creating Dynamic Web Pages"],
      },
      {
        key: "13-6",
        ordinal: "السادس",
        title: "Presenting Your Website",
        bookFrom: 191,
        concepts: ["Presenting Your Website"],
      },
      {
        key: "13-7",
        ordinal: "السابع",
        title: "Developing a Quiz App",
        bookFrom: 192,
        concepts: ["Developing a Quiz App"],
      },
      {
        key: "13-8",
        ordinal: "الثامن",
        title: "Quiz App Review",
        bookFrom: 194,
        concepts: ["Quiz App Review"],
      },
      {
        key: "13-9",
        ordinal: "التاسع",
        title: "Developing a Block Breaker Game 1",
        bookFrom: 195,
        concepts: ["Developing a Block Breaker Game 1"],
      },
      {
        key: "13-10",
        ordinal: "العاشر",
        title: "Developing a Block Breaker Game 2",
        bookFrom: 197,
        concepts: ["Developing a Block Breaker Game 2"],
      },
      {
        key: "13-11",
        ordinal: "الحادي عشر",
        title: "Block Breaker Summary",
        bookFrom: 199,
        concepts: ["Block Breaker Summary"],
      },
      {
        key: "13-12",
        ordinal: "الثاني عشر",
        title: "Block Breaker Development Presentation",
        bookFrom: 201,
        concepts: ["Block Breaker Development Presentation"],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the chapter's first page (its first
 * lesson) or the lesson's own title page, down to the page before the next
 * lesson starts, bounded by the chapter — so the ranges tile each chapter and
 * the chapters tile the term with no gaps or overlaps.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ICT_G10_EN_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ICT_G10_EN_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

// ---------------------------------------------------------------------------
// OCR text loading
// ---------------------------------------------------------------------------

const OCR_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "curriculum-ocr",
  "ict-en-g10-t1",
);

/**
 * The OCR provider answers a truly blank page with one of these sentences (the
 * wording varies between calls) instead of an empty string. They mean "no
 * text", not content, so verification treats them as missing while
 * `loadBookPage` still returns them verbatim.
 */
const NO_TEXT_MARKERS = [
  "لا يوجد نص مكتوب في الصورة المرفقة",
  "لا يوجد نص في الصورة المرفقة",
  "لا توجد نصوص في الصورة المرفقة",
];

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

/** True when a content page carries real text (not the blank-page placeholder). */
function pageHasText(book: number): boolean {
  const text = loadBookPage(book);
  return text.length > 0 && !NO_TEXT_MARKERS.some((m) => text.includes(m));
}

/** Loads + joins the OCR text of a book-page range into one lesson document. */
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

/** Convenience: the full document payload for one lesson. */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const range = lessonBookRange(unitIndex, lessonIndex);
  return loadBookRange(range.from, range.to);
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/**
 * Strips everything but letters and digits (and unifies the ى/ي the scan mixes
 * in for a purely cosmetic reason), so OCR spacing cannot break a match.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ى]/g, "ي")
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "");
}

/**
 * The number a content page prints in its running head, or null when the page
 * prints none. This book glues its folio to the first line («4Information
 * Study», «73Information Study»), so the leading numeral of the first non-empty
 * line is the folio. It is what fixes the mapping page by page.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const first = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!first) return null;
  const match = first.match(/^(\d{1,3})/);
  return match ? Number(match[1]) : null;
}

/**
 * The folio a page index is expected to print: the index itself for 4–174, and
 * the index + 1 from 175 on (the born-digital text layer shifts by one at OCR
 * page 175; the book prints no folio 175 at all).
 */
export function expectedPrintedFolio(book: number): number {
  return book < EGYPT_ICT_G10_EN_T1_FOLIO_SHIFT_FROM ? book : book + 1;
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its chapter, the chapters tile the term without gaps or overlaps, and the
 * first/last chapters hit the term's own bounds. A content mistake here would
 * quietly ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ICT_G10_EN_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (lesson.bookFrom < unit.bookFrom || lesson.bookFrom > unit.bookTo) {
        problems.push(
          `الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق الوحدة ${unit.bookFrom}–${unit.bookTo}`,
        );
      }
      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق الوحدة ${unit.bookFrom}–${unit.bookTo}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر الوحدة ${unit.bookFrom}، وجدنا ${from}`);
      }
      if (li > 0 && from !== lesson.bookFrom) {
        problems.push(`الدرس ${lesson.key}: يجب أن يبدأ نطاقه من صفحته ${lesson.bookFrom}، وجدنا ${from}`);
      }
    });
    const nextUnit = units[ui + 1];
    if (nextUnit && unit.bookTo >= nextUnit.bookFrom) {
      problems.push(`الوحدة ${unit.ordinal} تتداخل مع ${nextUnit.ordinal}`);
    } else if (nextUnit && unit.bookTo !== nextUnit.bookFrom - 1) {
      problems.push(`فجوة صفحات بين ${unit.ordinal} و${nextUnit.ordinal}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`);
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_ICT_G10_EN_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_ICT_G10_EN_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ICT_G10_EN_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_ICT_G10_EN_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the running-head folio of every content page proves its book number —
 *     this is what fixes the mapping page by page (index 4–174 print their
 *     index, 175–201 print index + 1);
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every lesson's title page prints that lesson's title;
 *  4. every printed page in the term is owned by exactly one lesson — no page
 *     can fall between two lessons and be unreachable.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const ranges = allLessonRanges();
  let pagesChecked = 0;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ICT_G10_EN_T1_BOOK_START || book > EGYPT_ICT_G10_EN_T1_BOOK_END) continue;
    printedPages.add(book);
    pagesChecked += 1;
    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    if (!pageHasText(book)) {
      problems.push(`صفحة الكتاب ${book}: بلا نص حقيقي (صفحة فارغة أو فشل مسح)`);
      continue;
    }
    const footer = printedFooter(book);
    if (footer === null) {
      problems.push(`صفحة الكتاب ${book}: بلا رقم صفحة مطبوع`);
    } else if (footer !== expectedPrintedFolio(book)) {
      problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق المتوقع ${expectedPrintedFolio(book)}`);
    }
  }

  if (printedPages.size !== EGYPT_ICT_G10_EN_T1_BOOK_END - EGYPT_ICT_G10_EN_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ICT_G10_EN_T1_BOOK_START} و${EGYPT_ICT_G10_EN_T1_BOOK_END}`,
    );
  }

  // 3. each lesson's title page prints its title.
  EGYPT_ICT_G10_EN_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const english = lesson.title.split(" — ")[0]!;
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      if (!normalize(opener).includes(normalize(english))) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع عنوانه «${english}»`);
      }
    });
  });

  // 4. every printed page is owned by exactly one lesson.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
