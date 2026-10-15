// Kindergarten 2 (رياض أطفال 2, المستوى الثاني) Discover («اكتشف»), first term
// («الفصل الدراسي الأول»), Ministry 2025/2026 edition (cover imprint prints
// «٢٠٢٥ - ٢٠٢٦ م», reviewed by الإدارة العامة لتخطيط وصياغة المناهج; foreword
// credits Discovery Education / مؤسسة دسكفري).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-kg2-discovery`, subject `discovery` (name "Discovery", nameAr "اكتشف"),
// lesson prefix `l-kg2-dis-`, grade `grade-kg2` (name "KG 2", nameAr
// "رياض أطفال 2").
//
// The curriculum tree for the Egypt `eg-kg2-discovery` curriculum is rebuilt
// from the Arabic-medium Ministry textbook (76 scanned pages, Term 1 = the
// book's own «الفصل الدراسي الأول» as listed in its printed «المحتويات»,
// scan 4). This module is the single source of truth for its structure: the
// five printed فصول of the first term (three under المحور الأول «من أكون؟»,
// two under المحور الثاني «العالم من حولى») plus the Term-1 «كراس
// الرياضيات», the printed activity on every page, and, for every lesson, the
// book's own printed heads, verbatim in Arabic and with the printed page they
// start on. The self-checks at the bottom prove that mapping against the OCR
// itself, page by page.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every numbered content page prints its own folio as a bare Western numeral
// on its last line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and
// quoted here: scan 6 prints «2» (book 2), scan 10 prints «6» (book 6),
// scan 14 prints «10» (book 10), scan 23 prints «19» (book 19), scan 31
// prints «27» (book 27) and scan 37 prints «33» (book 33). The book's own
// «المحتويات» (scan 4) independently confirms it: it lists «اعرفنى ١»
// (scan 5), «لوحة الفصل ٥» (scan 9), «قدمان وأربعة مخالب ۱۱» (scan 15),
// «عالمنا الطبيعي ۱۸» (scan 22), «عالم من صنع الإنسان ٢٦» (scan 30) and
// «كراس الرياضيات ٣٤» (scan 38) — every divider sits exactly where the
// contents says it does.
//
// TERM = THE BOOK'S OWN FIRST TERM (books 1–37)
// Scan pages 1–4 are before the term: the cover (1), a blank back page
// (2, «لا يوجد نص في الصورة المرفقة.»), the «مقدمة الكتاب المدرسي» (3) and
// the year-wide «المحتويات» with the NAME slip (4). The term runs from the
// Term-1 divider (book 1 = scan 5) to the last كراس الرياضيات page of Term 1
// (book 37 = scan 41): `EGYPT_DISCOVERY_KG2_T1_BOOK_START` / `_END` are
// exactly those two pages, and the tiling assertion proves nothing in between
// is left unreachable. `pagesChecked` therefore equals 37 − 1 + 1 = 37. Scan
// pages 42–76 are after the term: the Term-2 divider (scan 42, «الفصل
// الدراسي الثاني»), the Term-2 lessons (المحور الثالث «كيف يعمل العالم؟»
// والمحور الرابع «التواصل»), the Term-2 كراس الرياضيات and the print matter
// (scan 76, «المواصفات الفنية» and the ٢٠٢٥-٢٠٢٦ rights block).
//
// NINE TERM PAGES PRINT NO FOLIO — EACH HAS A NAMED ANCHOR
// The six chapter/journal dividers (books 1, 5, 11, 18, 26, 34) print their
// head but no page number, and the three كراس الرياضيات pages (books 35–37)
// print the journal's own refoliation («١», «٢», «٣») instead of their book
// numbers. Rather than weaken the page-number check, all nine are exempt from
// it and anchored on a string the page itself prints, named in
// `FOLIO_LESS_ANCHORS`. Every other term page proves its number from a bare
// numeral standing alone on its last line. Every term page carries real text:
// there is no textless-picture exemption.
//
// EACH LESSON IS ONE PRINTED ACTIVITY PAGE
// KG books are activity-driven: every activity page prints one head
// («أشياء عني:», «اعرف المهن», «فناء المدرسة» …) and that head is the
// lesson. Two pages print two titled heads and both share the lesson, as in
// the G1 Discover spec: book 13 («النسر الذهبي» + «الغزال») and book 21
// («الكرفس» + «نبات سارة»). The chapter dividers print navigation only
// (محور + فصل), so — unlike the content-bearing G1 intro pages — they
// contribute no concepts; the divider head is checked as the unit's
// `printedHead`. The journal section is one lesson owning books 34–37; its
// concepts are the divider head plus each journal page's opening «الدرس»
// («الدرس 7», «الدرس ٣١», «الدرس ٤٨»), since a journal page prints a dozen
// «الدرس N» blocks and naming each would model mathematics, not heads.
// Nothing is invented: every concept title below is a string the book itself
// prints on the page its `bookFrom` names.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// درس numbers mix Latin («الدرس 7», «الدرس 35») and Arabic-Indic («الدرس ٣١»,
// «الدرس ٤٨») digits across the three journal pages. Scan 11 prints the book
// head with a doubled syllable («التكنولوجولوجيا تساعدنا», stored verbatim).
// Scan 6 prints «صورةي» for «صورتي» in the body (not in any head).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.33 = scan p.37). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the Term-1 divider (scan 5). */
export const EGYPT_DISCOVERY_KG2_T1_BOOK_START = 1;

/** Last printed page of the term — كراس الرياضيات p.3 of Term 1 (scan 41). */
export const EGYPT_DISCOVERY_KG2_T1_BOOK_END = 37;

/** The scanned pages before the term: cover, blank, مقدمة, محتويات. */
export const EGYPT_DISCOVERY_KG2_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/**
 * The scanned pages after the term: the Term-2 divider (scan 42), the Term-2
 * lessons (المحور الثالث والرابع), the Term-2 كراس الرياضيات and the print
 * matter (scan 76).
 */
export const EGYPT_DISCOVERY_KG2_T1_BACK_MATTER = { from: 42, to: 76 } as const;

/**
 * The term pages the OCR never produced, as scan pages. No scan is absent
 * (all 76 files are present) and every term page carries text, so this list
 * is empty; kept so the module shares the shape of the other Egyptian specs.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface DiscoveryKg2T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «نشاط». */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (= one activity page of a chapter, or the journal). */
export interface DiscoveryKg2T1Lesson {
  /** App-addressable key, e.g. "5-3" (chapter 5, lesson 3). */
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
  concepts: DiscoveryKg2T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — a فصل, or the maths journal. */
export interface DiscoveryKg2T1Section {
  /** This book's sections are its فصول, plus the closing journal. */
  kind: "chapter" | "journal";
  /** Internal key: "1"…"6", in book order. */
  key: string;
  /** Arabic ordinal of the section as used in the app tree, e.g. "الثاني". */
  ordinal: string;
  /** Full app-facing section title, with the محور for context. */
  title: string;
  /** The section head the divider page prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its divider). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next divider). */
  bookTo: number;
  lessons: DiscoveryKg2T1Lesson[];
}

const TYPE = "نشاط";

function concept(bookFrom: number, title: string): DiscoveryKg2T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The five فصول of the first term plus its closing «كراس الرياضيات», with
 * their printed activities and every printed head, transcribed from the pages
 * the book prints them on and checked by `assertTreeMatchesTheBook` before
 * seeding.
 *
 * Chapter starts come from the book's «المحتويات» (scan 4): 1, 5, 11, 18,
 * 26, journal 34. Each activity page is one lesson, in book order.
 */
export const EGYPT_DISCOVERY_KG2_T1_UNITS: DiscoveryKg2T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "المحور الأول: من أكون؟ - الفصل الأول: اعرفنى",
    printedHead: "الفصل الأول: اعرفنى",
    bookFrom: 1,
    bookTo: 4,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "أشياء عني:",
        printedHead: "أشياء عني:",
        bookFrom: 2,
        concepts: [concept(2, "أشياء عني:")],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "استكشاف الألوان",
        printedHead: "استكشاف الألوان",
        bookFrom: 3,
        concepts: [concept(3, "استكشاف الألوان")],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "نهى وعادل",
        printedHead: "نهى وعادل",
        bookFrom: 4,
        concepts: [concept(4, "نهى وعادل")],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "الثاني",
    title: "المحور الأول: من أكون؟ - الفصل الثاني: لوحة الفصل",
    printedHead: "الفصل الثاني: لوحة الفصل",
    bookFrom: 5,
    bookTo: 10,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "أسرتي وعائلتي",
        printedHead: "أسرتي وعائلتي",
        bookFrom: 6,
        concepts: [concept(6, "أسرتي وعائلتي")],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "اعرف المهن",
        printedHead: "اعرف المهن",
        bookFrom: 7,
        concepts: [concept(7, "اعرف المهن")],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "تمثيل بياني للمهن التي نفضلها",
        printedHead: "تمثيل بياني للمهن التي نفضلها",
        bookFrom: 8,
        concepts: [concept(8, "تمثيل بياني للمهن التي نفضلها")],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "نحن جزء من مجتمعات عديدة",
        printedHead: "نحن جزء من مجتمعات عديدة",
        bookFrom: 9,
        concepts: [concept(9, "نحن جزء من مجتمعات عديدة")],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "النشيد الوطني",
        printedHead: "النشيد الوطني",
        bookFrom: 10,
        concepts: [concept(10, "النشيد الوطني")],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "الثالث",
    title: "المحور الأول: من أكون؟ - الفصل الثالث: قدمان، وأربعة مخالب",
    printedHead: "الفصل الثالث: قدمان، وأربعة مخالب",
    bookFrom: 11,
    bookTo: 17,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "قدمان وأربعة مخالب",
        printedHead: "قدمان وأربعة مخالب",
        bookFrom: 12,
        concepts: [concept(12, "قدمان وأربعة مخالب")],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "النسر الذهبي",
        printedHead: "النسر الذهبي",
        bookFrom: 13,
        concepts: [concept(13, "النسر الذهبي"), concept(13, "الغزال")],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الإنسان",
        printedHead: "الإنسان",
        bookFrom: 14,
        concepts: [concept(14, "الإنسان")],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "الأطعمة التي نأكلها",
        printedHead: "الأطعمة التي نأكلها",
        bookFrom: 15,
        concepts: [concept(15, "الأطعمة التي نأكلها")],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "مقارنة الكائنات",
        printedHead: "مقارنة الكائنات",
        bookFrom: 16,
        concepts: [concept(16, "مقارنة الكائنات")],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: TYPE,
        title: "علم مصر",
        printedHead: "علم مصر",
        bookFrom: 17,
        concepts: [concept(17, "علم مصر")],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "الرابع",
    title: "المحور الثاني: العالم من حولي - الفصل الأول: عالمنا الطبيعي",
    printedHead: "الفصل الأول: عالمنا الطبيعي",
    bookFrom: 18,
    bookTo: 25,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "فناء المدرسة",
        printedHead: "فناء المدرسة",
        bookFrom: 19,
        concepts: [concept(19, "فناء المدرسة")],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "تتبع أجزاء النبات",
        printedHead: "تتبع أجزاء النبات",
        bookFrom: 20,
        concepts: [concept(20, "تتبع أجزاء النبات")],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الكرفس",
        printedHead: "الكرفس",
        bookFrom: 21,
        concepts: [concept(21, "الكرفس"), concept(21, "نبات سارة")],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "أجزاء النبات",
        printedHead: "أجزاء النبات",
        bookFrom: 22,
        concepts: [concept(22, "أجزاء النبات")],
      },
      {
        key: "4-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "خصائص الحيوانات",
        printedHead: "خصائص الحيوانات",
        bookFrom: 23,
        concepts: [concept(23, "خصائص الحيوانات")],
      },
      {
        key: "4-6",
        ordinal: "السادس",
        type: TYPE,
        title: "تصنيف خصائص الحيوانات",
        printedHead: "تصنيف خصائص الحيوانات",
        bookFrom: 24,
        concepts: [concept(24, "تصنيف خصائص الحيوانات")],
      },
      {
        key: "4-7",
        ordinal: "السابع",
        type: TYPE,
        title: "استكشف السماء ليلاً",
        printedHead: "استكشف السماء ليلاً",
        bookFrom: 25,
        concepts: [concept(25, "استكشف السماء ليلاً")],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "الخامس",
    title: "المحور الثاني: العالم من حولي - الفصل الثاني: عالم من صنع الإنسان",
    printedHead: "الفصل الثاني: عالم من صنع الإنسان",
    bookFrom: 26,
    bookTo: 33,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: TYPE,
        title: "التكنولوجولوجيا تساعدنا",
        printedHead: "التكنولوجولوجيا تساعدنا",
        bookFrom: 27,
        concepts: [concept(27, "التكنولوجولوجيا تساعدنا")],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "العمل في الحديقة : المهن والأدوات",
        printedHead: "العمل في الحديقة : المهن والأدوات",
        bookFrom: 28,
        concepts: [concept(28, "العمل في الحديقة : المهن والأدوات")],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الأدوات والتكنولوجيا الزراعية",
        printedHead: "الأدوات والتكنولوجيا الزراعية",
        bookFrom: 29,
        concepts: [concept(29, "الأدوات والتكنولوجيا الزراعية")],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "إلى أين نسافر؟",
        printedHead: "إلى أين نسافر؟",
        bookFrom: 30,
        concepts: [concept(30, "إلى أين نسافر؟")],
      },
      {
        key: "5-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "تحسين المرور في تقاطع الطريق",
        printedHead: "تحسين المرور في تقاطع الطريق",
        bookFrom: 31,
        concepts: [concept(31, "تحسين المرور في تقاطع الطريق")],
      },
      {
        key: "5-6",
        ordinal: "السادس",
        type: TYPE,
        title: "الاحتفالات الوطنية",
        printedHead: "الاحتفالات الوطنية",
        bookFrom: 32,
        concepts: [concept(32, "الاحتفالات الوطنية")],
      },
      {
        key: "5-7",
        ordinal: "السابع",
        type: TYPE,
        title: "أجهزة الكمبيوتر",
        printedHead: "أجهزة الكمبيوتر",
        bookFrom: 33,
        concepts: [concept(33, "أجهزة الكمبيوتر")],
      },
    ],
  },
  {
    key: "6",
    kind: "journal",
    ordinal: "السادس",
    title: "كراس الرياضيات",
    printedHead: "كراس الرياضيات",
    bookFrom: 34,
    bookTo: 37,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: TYPE,
        title: "كراس الرياضيات",
        printedHead: "كراس الرياضيات",
        bookFrom: 34,
        concepts: [
          concept(34, "كراس الرياضيات"),
          concept(35, "الدرس 7"),
          concept(36, "الدرس ٣١"),
          concept(37, "الدرس ٤٨"),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the chapter divider (its first lesson) or its
 * own head page, down to the page before the next lesson starts, bounded by
 * the chapter — so the divider stays inside the chapter it belongs to. When
 * the book prints two heads on one page they share a lesson, so distinct
 * lessons always start on distinct pages and the ranges tile the chapter
 * exactly.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_DISCOVERY_KG2_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_DISCOVERY_KG2_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This term has
 * no appendix: every page of the term belongs to a chapter or the journal.
 * Kept as a function so the seeder and the stage share one shape across all
 * the books.
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
  "discovery-kg2-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (The one such scan here — scan 2 — is front matter, outside the
 * term; the guard mirrors the G1 spec.)
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
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(unitIndex, lessonIndex);
  return loadBookRange(from, to);
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EXT_AR_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Arabic-Indic and Extended Arabic-Indic digits → Latin, so a folio can be read. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * Folds text for comparison: drops tatweel and diacritics, unifies the
 * alef/ya/ta forms the book prints inconsistently, and removes every
 * non-letter/digit, so OCR spacing and vowel marks cannot break a match.
 */
function normalize(text: string): string {
  return toLatinDigits(text)
    .replace(/\u0640/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ی/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring OCR spacing and vowel marks. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints at its foot. This book's folio
 * is a bare numeral standing alone on the last line («2», «19», «33», and the
 * journal's own «١», «٢», «٣»); the last non-empty line is read and every
 * other line is ignored, so body numbers (ages, counts, «الدرس N» blocks)
 * can never be mistaken for a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const last = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .at(-1) ?? "";
  if (!/^[0-9٠-٩۰-۹]+$/.test(last)) return [];
  const n = Number(toLatinDigits(last).replace(/\D/g, ""));
  return n > 0 ? [n] : [];
}

/**
 * The book number a content page prints at its foot, or null. Every content
 * page that carries a folio prints exactly one number there and it is its own,
 * which is what fixes the offset; the pages named in `FOLIO_LESS_ANCHORS`
 * carry no provable folio and are handled there instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * Folios whose OCR printed a different, still parseable number. Every folio
 * in this book came out right, so the map is empty and the folio check stays
 * exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no provable folio in the OCR, each with the
 * anchor the check accepts in place of a page number: the six chapter/journal
 * dividers (books 1, 5, 11, 18, 26, 34, anchored on their head) and the three
 * journal content pages (books 35–37, which print the journal's own internal
 * folio «١»/«٢»/«٣» instead, anchored on each page's opening «الدرس»).
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  1: "الفصل الأول: اعرفنى",
  5: "الفصل الثاني: لوحة الفصل",
  11: "الفصل الثالث: قدمان، وأربعة مخالب",
  18: "الفصل الأول: عالمنا الطبيعي",
  26: "الفصل الثاني: عالم من صنع الإنسان",
  34: "كراس الرياضيات",
  35: "الدرس 7",
  36: "الدرس ٣١",
  37: "الدرس ٤٨",
};

/** Every head kind the table may use. */
const KNOWN_KINDS = new Set(["نشاط"]);

/**
 * Table invariants: lesson keys are unique and follow (section-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_DISCOVERY_KG2_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_DISCOVERY_KG2_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_DISCOVERY_KG2_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_DISCOVERY_KG2_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_DISCOVERY_KG2_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real text and proves its book number — from its
 *     printed folio (allowing the measured OCR misreads), or, on the pages
 *     named in `FOLIO_LESS_ANCHORS`, from the anchor that page prints;
 *  2. every section divider prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title and every activity's head is printed on the pages
 *     the lesson owns (the activity on its own page);
 *  4. every page in [1, 37] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of
 *     the term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_DISCOVERY_KG2_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term is accounted for and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_DISCOVERY_KG2_T1_BOOK_START || book > EGYPT_DISCOVERY_KG2_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_DISCOVERY_KG2_T1_BOOK_END - EGYPT_DISCOVERY_KG2_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_DISCOVERY_KG2_T1_BOOK_START} و${EGYPT_DISCOVERY_KG2_T1_BOOK_END}`,
    );
  }

  // 2 + 3a. every section divider prints the section head, every lesson's first
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
  for (let p = EGYPT_DISCOVERY_KG2_T1_BOOK_START; p <= EGYPT_DISCOVERY_KG2_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
