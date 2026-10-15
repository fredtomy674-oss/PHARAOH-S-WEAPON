// Kindergarten 1 (رياض أطفال 1, المستوى الأول) Discover («اكتشف»), first term
// («الفصل الدراسي الأول»), Ministry 2025/2026 edition (cover imprint prints
// «٢٠٢٥ - ٢٠٢٦ م», reviewed by الإدارة المركزية لتطوير المناهج).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-kg1-discovery`, subject `discovery` (name "Discovery", nameAr "اكتشف"),
// lesson prefix `l-kg1-dis-`, grade `grade-kg1` (name "KG 1", nameAr
// "رياض أطفال 1").
//
// The curriculum tree for the Egypt `eg-kg1-discovery` curriculum is rebuilt
// from the Arabic-medium Ministry textbook (88 scanned pages, Term 1 = the
// book's own «الفصل الدراسي الأول» as listed in its printed «المحتويات»,
// scan 4). This module is the single source of truth for its structure: the
// six printed فصول of the first term (three under المحور الأول «من أكون؟»,
// three under المحور الثاني «العالم من حولي») plus the Term-1 «كراس
// الرياضيات», the printed activity on every page, and, for every lesson, the
// book's own printed heads, verbatim in Arabic and with the printed page they
// start on. The self-checks at the bottom prove that mapping against the OCR
// itself, page by page.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every numbered content page prints its own folio as a bare numeral on its
// last line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted
// here: scan 6 prints «٢» (book 2), scan 13 prints «٩» (book 9), scan 14 prints «۱۰» (book 10), scan 21 prints «١٧»
// (book 17), scan 30 prints «٢٦» (book 26), scan 37 prints «٣٣» (book 33) and
// scan 39 prints «٣٥» (book 35). The book's own «المحتويات» (scan 4)
// independently confirms the skeleton: it lists, under «الفصل الدراسي
// الأول», المحور الأول «من أكون؟» (الفصل الأول «صورتي الشخصية», الفصل
// الثاني «الأمهات والآباء», الفصل الثالث «مدرستي») and المحور الثاني «العالم
// من حولي» (الفصل الأول «صغار الكائنات», الفصل الثاني «كيف أعتني؟», الفصل
// الثالث «أين نجد الماء؟») plus «كراس الرياضيات» — every divider sits in
// exactly that order in the scans (the contents prints no page numbers, so
// the divider scans themselves fix the starts: 1, 7, 11, 16, 20, 27,
// journal 32).
//
// TERM = THE BOOK'S OWN FIRST TERM (books 1–35)
// Scan pages 1–4 are before the term: the cover (1), the absent scan 2 (a
// fully blank verso — never produced, documented here and not listed in
// `MISSING_SCANS`, exactly as the English-KG1 spec documents its absent
// front-matter scan), the «مقدمة الكتاب المدرسي» (3) and the year-wide
// «المحتويات» with the NAME slip (4). The term runs from the Term-1 divider
// (book 1 = scan 5) to the last كراس الرياضيات page of Term 1 (book 35 =
// scan 39): `EGYPT_DISCOVERY_KG1_T1_BOOK_START` / `_END` are exactly those
// two pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` therefore equals 35 − 1 + 1 = 35. Scan pages
// 40–88 are after the term: the Term-2 divider (scan 40, «الفصل الدراسي
// الثاني»), the Term-2 lessons (المحور الأول «كيف يعمل العالم؟» والمحور
// الثاني «التواصل»), the Term-2 كراس الرياضيات, an empty blank verso (scan
// 85, a 0-byte file with no text layer) and the print matter (scans 84,
// 86–88).
//
// NO TERM SCAN IS ABSENT — `MISSING_SCANS` IS EMPTY
// Every book page of [1, 35] has its scan (scans 5–39) with a real text
// layer, so no term page is skipped and `pagesChecked` is the full term
// range. Kept as an empty list so the module shares the shape of the other
// Egyptian specs.
//
// TEN TERM PAGES PRINT NO PARSEABLE FOLIO — EACH HAS A NAMED ANCHOR
// The seven chapter/journal dividers (books 1, 7, 11, 16, 20, 27, 32) print
// their head but no page number; two activity pages print no folio either
// (book 5 «الأشكال الهندسية التي أراها» and book 6 «أشيائي المفضلة», whose
// last lines are body instructions); and one activity page lost its folio to
// the OCR (book 8 «الأطفال والكبار», whose last line reads «A» instead of
// «٨»), exactly as the G3 Discover spec anchors its «V» page. Rather than
// weaken the page-number check, all ten are exempt from it and anchored on a
// string the page itself prints, named in `FOLIO_LESS_ANCHORS`. Every other
// term page proves its number from a bare numeral standing alone on its last
// line — including the three journal pages (books 33–35 print the book folios
// «٣٣», «٣٤», «٣٥», unlike the KG2/EN-KG1 journals which print their own
// refoliation). Every term page carries real text: there is no
// textless-picture exemption.
//
// EACH LESSON IS ONE PRINTED ACTIVITY PAGE
// KG books are activity-driven: every activity page prints one head
// («حواسي الخمس», «أعمال منزلية», «خريطة مصر» …) and that head is the
// lesson. Three pages print two titled heads and both share the lesson, as in
// the EN-KG1 Discover sibling: book 2 («الفواكه والخضراوات» + «صورتي
// الشخصية»), book 10 («الحيوانات الصغيرة والحيوانات الكبيرة» + «هيا .....
// نعد») and book 14 («مهن ... وأدوات» + «مهنتي في المستقبل»). The chapter
// dividers print navigation only (محور + فصل), so — unlike content-bearing
// intro pages — they contribute no concepts; the divider head is checked as
// the unit's `printedHead`. The journal section holds three lessons, one per
// journal page (books 33–35); their concepts are each page's printed «الدرس»
// heads («الدرس 5»–«الدرس 8», «الدرس ٣١»–«الدرس ٣٩», «الدرس 40»/«الدرس
// 41»/«الدرس ٤٢»/«الدرس ٥٧»–«الدرس ٥٩»). Nothing is invented: every concept
// title below is a string the book itself prints on the page its `bookFrom`
// names.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// درس numbers mix Latin («الدرس 5», «الدرس 40», «الدرس 41») and Arabic-Indic
// («الدرس ٣١», «الدرس ٤٢», «الدرس ٥٧») digits across the three journal pages.
// Folios mix Arabic-Indic («٢», «٩», «٣٣») and Extended («۱۰», «۱۲», «۲۸»)
// digits; `toLatinDigits` folds both. The running head spells the chapter-5
// head «كيف أعتني؟» on some pages and «كيف أعتنى؟» on others (divider scan
// 24 prints «كيف أعتنى ؟»); each stored string below is verbatim from the
// page its check runs against, and `normalize` folds the difference anyway.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.35 = scan p.39). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the Term-1 divider (scan 5). */
export const EGYPT_DISCOVERY_KG1_T1_BOOK_START = 1;

/** Last printed page of the term — كراس الرياضيات p.35 of Term 1 (scan 39). */
export const EGYPT_DISCOVERY_KG1_T1_BOOK_END = 35;

/** The scanned pages before the term: cover, blank (absent), مقدمة, محتويات. */
export const EGYPT_DISCOVERY_KG1_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/**
 * The scanned pages after the term: the Term-2 divider (scan 40), the Term-2
 * lessons (المحور الأول «كيف يعمل العالم؟» والمحور الثاني «التواصل»), the
 * Term-2 كراس الرياضيات, a blank verso (scan 85, empty) and the print matter
 * (scans 84, 86–88).
 */
export const EGYPT_DISCOVERY_KG1_T1_BACK_MATTER = { from: 40, to: 88 } as const;

/**
 * The term pages the OCR never produced, as book pages. Every book page of
 * [1, 35] has its scan (scans 5–39) with a real text layer, so this list is
 * empty; kept so the module shares the shape of the other Egyptian specs.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface DiscoveryKg1T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «نشاط». */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (= one activity page of a chapter, or one journal page). */
export interface DiscoveryKg1T1Lesson {
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
  concepts: DiscoveryKg1T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — a فصل, or the maths journal. */
export interface DiscoveryKg1T1Section {
  /** This book's sections are its فصول, plus the closing journal. */
  kind: "chapter" | "journal";
  /** Internal key: "1"…"7", in book order. */
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
  lessons: DiscoveryKg1T1Lesson[];
}

const TYPE = "نشاط";

function concept(bookFrom: number, title: string): DiscoveryKg1T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The six فصول of the first term plus its closing «كراس الرياضيات», with
 * their printed activities and every printed head, transcribed from the pages
 * the book prints them on and checked by `assertTreeMatchesTheBook` before
 * seeding.
 *
 * Chapter starts come from the book's «المحتويات» (scan 4) in scan order,
 * fixed by the divider scans themselves: 1, 7, 11, 16, 20, 27, journal 32.
 * Each activity page is one lesson, in book order.
 */
export const EGYPT_DISCOVERY_KG1_T1_UNITS: DiscoveryKg1T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "المحور الأول: من أكون؟ - الفصل الأول: صورتي الشخصية",
    printedHead: "الفصل الأول: صورتي الشخصية",
    bookFrom: 1,
    bookTo: 6,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الفواكه والخضراوات",
        printedHead: "الفواكه والخضراوات",
        bookFrom: 2,
        concepts: [concept(2, "الفواكه والخضراوات"), concept(2, "صورتي الشخصية")],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "حواسي الخمس",
        printedHead: "حواسي الخمس",
        bookFrom: 3,
        concepts: [concept(3, "حواسي الخمس")],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "نحن متشابهون",
        printedHead: "نحن متشابهون",
        bookFrom: 4,
        concepts: [concept(4, "نحن متشابهون")],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "الأشكال الهندسية التي أراها",
        printedHead: "الأشكال الهندسية التي أراها",
        bookFrom: 5,
        concepts: [concept(5, "الأشكال الهندسية التي أراها")],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "أشيائي المفضلة",
        printedHead: "أشيائي المفضلة",
        bookFrom: 6,
        concepts: [concept(6, "أشيائي المفضلة")],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "الثاني",
    title: "المحور الأول: من أكون؟ - الفصل الثاني: الأمهات والآباء",
    printedHead: "الفصل الثاني: الأمهات والآباء",
    bookFrom: 7,
    bookTo: 10,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الأطفال والكبار",
        printedHead: "الأطفال والكبار",
        bookFrom: 8,
        concepts: [concept(8, "الأطفال والكبار")],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "أعمال منزلية",
        printedHead: "أعمال منزلية",
        bookFrom: 9,
        concepts: [concept(9, "أعمال منزلية")],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الحيوانات الصغيرة والحيوانات الكبيرة",
        printedHead: "الحيوانات الصغيرة والحيوانات الكبيرة",
        bookFrom: 10,
        concepts: [concept(10, "الحيوانات الصغيرة والحيوانات الكبيرة"), concept(10, "هيا ..... نعد")],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "الثالث",
    title: "المحور الأول: من أكون؟ - الفصل الثالث: مدرستي",
    printedHead: "الفصل الثالث: مدرستي",
    bookFrom: 11,
    bookTo: 15,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "تصنيف الأشكال",
        printedHead: "تصنيف الأشكال",
        bookFrom: 12,
        concepts: [concept(12, "تصنيف الأشكال")],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "أشياء في القاعة وخارجها",
        printedHead: "أشياء في القاعة وخارجها",
        bookFrom: 13,
        concepts: [concept(13, "أشياء في القاعة وخارجها")],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "مهن ... وأدوات",
        printedHead: "مهن ... وأدوات",
        bookFrom: 14,
        concepts: [concept(14, "مهن ... وأدوات"), concept(14, "مهنتي في المستقبل")],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "بصمة الشكل",
        printedHead: "بصمة الشكل",
        bookFrom: 15,
        concepts: [concept(15, "بصمة الشكل")],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "الأول",
    title: "المحور الثاني: العالم من حولي - الفصل الأول: صغار الكائنات",
    printedHead: "الفصل الأول: صغار الكائنات",
    bookFrom: 16,
    bookTo: 19,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "ماذا أفعل كل يوم؟",
        printedHead: "ماذا أفعل كل يوم؟",
        bookFrom: 17,
        concepts: [concept(17, "ماذا أفعل كل يوم؟")],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "لاحظ الحيوانات",
        printedHead: "لاحظ الحيوانات",
        bookFrom: 18,
        concepts: [concept(18, "لاحظ الحيوانات")],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "حيوانات حول العالم",
        printedHead: "حيوانات حول العالم",
        bookFrom: 19,
        concepts: [concept(19, "حيوانات حول العالم")],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "الثاني",
    title: "المحور الثاني: العالم من حولي - الفصل الثاني: كيف أعتني؟",
    printedHead: "الفصل الثاني: كيف أعتنى؟",
    bookFrom: 20,
    bookTo: 26,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: TYPE,
        title: "حي أم غير حي؟",
        printedHead: "حي أم غير حي؟",
        bookFrom: 21,
        concepts: [concept(21, "حي أم غير حي؟")],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "خريطة أم صورة؟",
        printedHead: "خريطة أم صورة؟",
        bookFrom: 22,
        concepts: [concept(22, "خريطة أم صورة؟")],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "فصول السنة والملابس المناسبة",
        printedHead: "فصول السنة والملابس المناسبة",
        bookFrom: 23,
        concepts: [concept(23, "فصول السنة والملابس المناسبة")],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "مراحل الحياة",
        printedHead: "مراحل الحياة",
        bookFrom: 24,
        concepts: [concept(24, "مراحل الحياة")],
      },
      {
        key: "5-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "حافظ على نظافتك",
        printedHead: "حافظ على نظافتك",
        bookFrom: 25,
        concepts: [concept(25, "حافظ على نظافتك")],
      },
      {
        key: "5-6",
        ordinal: "السادس",
        type: TYPE,
        title: "طبق السلطة",
        printedHead: "طبق السلطة",
        bookFrom: 26,
        concepts: [concept(26, "طبق السلطة")],
      },
    ],
  },
  {
    key: "6",
    kind: "chapter",
    ordinal: "الثالث",
    title: "المحور الثاني: العالم من حولي - الفصل الثالث: أين نجد الماء؟",
    printedHead: "الفصل الثالث: أين نجد الماء؟",
    bookFrom: 27,
    bookTo: 31,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الأمطار ... الأمطار تتساقط.",
        printedHead: "الأمطار ... الأمطار تتساقط.",
        bookFrom: 28,
        concepts: [concept(28, "الأمطار ... الأمطار تتساقط.")],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "تصنيف استخدامات الماء",
        printedHead: "تصنيف استخدامات الماء",
        bookFrom: 29,
        concepts: [concept(29, "تصنيف استخدامات الماء")],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "خريطة مصر",
        printedHead: "خريطة مصر",
        bookFrom: 30,
        concepts: [concept(30, "خريطة مصر")],
      },
      {
        key: "6-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "زجاجات في النهر",
        printedHead: "زجاجات في النهر",
        bookFrom: 31,
        concepts: [concept(31, "زجاجات في النهر")],
      },
    ],
  },
  {
    key: "7",
    kind: "journal",
    ordinal: "السابع",
    title: "كراس الرياضيات",
    printedHead: "كراس الرياضيات",
    bookFrom: 32,
    bookTo: 35,
    lessons: [
      {
        key: "7-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الدرس 5",
        printedHead: "الدرس 5",
        bookFrom: 33,
        concepts: [
          concept(33, "الدرس 5"),
          concept(33, "الدرس 6"),
          concept(33, "الدرس 7"),
          concept(33, "الدرس 8"),
        ],
      },
      {
        key: "7-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الدرس ٣١",
        printedHead: "الدرس ٣١",
        bookFrom: 34,
        concepts: [
          concept(34, "الدرس ٣١"),
          concept(34, "الدرس ٣٢"),
          concept(34, "الدرس ٣٣"),
          concept(34, "الدرس ٣٤"),
          concept(34, "الدرس ٣٥"),
          concept(34, "الدرس ٣٦"),
          concept(34, "الدرس ٣٧"),
          concept(34, "الدرس ٣٨"),
          concept(34, "الدرس ٣٩"),
        ],
      },
      {
        key: "7-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الدرس 40",
        printedHead: "الدرس 40",
        bookFrom: 35,
        concepts: [
          concept(35, "الدرس 40"),
          concept(35, "الدرس 41"),
          concept(35, "الدرس ٤٢"),
          concept(35, "الدرس ٥٧"),
          concept(35, "الدرس ٥٨"),
          concept(35, "الدرس ٥٩"),
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
  const unit = EGYPT_DISCOVERY_KG1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_DISCOVERY_KG1_T1_UNITS.forEach((unit, ui) => {
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
  const out = new Map<string, number[]>();
  for (const unit of EGYPT_DISCOVERY_KG1_T1_UNITS) {
    for (const lesson of unit.lessons) {
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
  "discovery-kg1-t1",
);

/**
 * The OCR provider answers a truly blank page with an empty file instead of
 * prose (scan 85 is a 0-byte file). It means "no text", not content. The
 * loader returns "" for it — as for any scan the OCR never produced — so a
 * future page map cannot mistake a blank for content. (Both blank versos of
 * this corpus, scans 2 and 85, sit outside the term; the guard mirrors the
 * KG2 spec.)
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
 * The document a lesson grounds the tutor in: its own page range in order,
 * plus any appendix pages it points to. This book has no appendix, so the
 * extra loop is a no-op kept for a shared shape.
 */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(unitIndex, lessonIndex);
  const lesson = EGYPT_DISCOVERY_KG1_T1_UNITS[unitIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(from, to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
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
 * is a bare numeral standing alone on the last line («٢», «١٧», «٣٥», and the
 * Extended «۱۰», «۲۸»); the last non-empty line is read and every other line
 * is ignored, so body numbers (counts, «الدرس N» blocks, map labels) can
 * never be mistaken for a folio.
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
 * carry no parseable folio and are handled there instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * Folios whose OCR printed a different, still parseable number. Every
 * parseable folio in this book came out right, so the map is empty and the
 * folio check stays exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no parseable folio in the OCR, each with the
 * anchor the check accepts in place of a page number: the seven
 * chapter/journal dividers (books 1, 7, 11, 16, 20, 27, 32, anchored on
 * their head), the two activity pages whose last line is a body instruction
 * (books 5 and 6), and the activity page whose folio the OCR read as the
 * stray letter «A» (book 8 «الأطفال والكبار»).
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  1: "صورتي الشخصية",
  5: "الأشكال الهندسية التي أراها",
  6: "أشيائي المفضلة",
  7: "الأمهات والآباء",
  8: "الأطفال والكبار",
  11: "مدرستي",
  16: "صغار الكائنات",
  20: "كيف أعتنى؟",
  27: "أين نجد الماء؟",
  32: "كراس الرياضيات",
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
  const units = EGYPT_DISCOVERY_KG1_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_DISCOVERY_KG1_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_DISCOVERY_KG1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_DISCOVERY_KG1_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_DISCOVERY_KG1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     the folio in its furniture, or, on the ten pages named in
 *     `FOLIO_LESS_ANCHORS`, from the anchor the page itself prints. The scans
 *     in `MISSING_SCANS` (none this term) carry no text to prove anything with
 *     and are not iterated (they stay owned by their lesson ranges below);
 *  2. every section opener prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title and every activity's head is printed on the pages
 *     the lesson owns (the activity on its own page);
 *  4. every page in [1, 35] is owned by exactly one lesson — no page falls
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
  const units = EGYPT_DISCOVERY_KG1_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_DISCOVERY_KG1_T1_BOOK_START || book > EGYPT_DISCOVERY_KG1_T1_BOOK_END) continue;
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
  // page its head, and every lesson's title is printed somewhere in the pages
  // it owns.
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
  for (let p = EGYPT_DISCOVERY_KG1_T1_BOOK_START; p <= EGYPT_DISCOVERY_KG1_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_DISCOVERY_KG1_T1_BOOK_END - EGYPT_DISCOVERY_KG1_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_DISCOVERY_KG1_T1_BOOK_START} و${EGYPT_DISCOVERY_KG1_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
