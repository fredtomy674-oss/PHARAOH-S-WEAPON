// Official Egypt Primary-4 (Grade 4) Science, Arabic-medium, first term —
// Ministry of Education and Technical Education edition prepared with
// Discovery Education (cover imprint «2025 - 2026», Science Techbook programme).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g4-science`, subject `science` (name "العلوم"),
// lesson prefix `l-g4-sci-`, grade `grade-4` (name "الصف الرابع الابتدائي").
//
// The curriculum tree for the Egypt `eg-g4-science` curriculum is rebuilt
// from the Ministry textbook `العلوم — الصف الرابع الابتدائي — الفصل الدراسي
// الأول` (128 scanned pages, all OCR'd). This module is the single source of
// truth for its structure: the two printed units of the first term (الوحدة
// الأولى: الأنظمة الحية, الوحدة الثانية: الحركة), every numbered lesson inside
// them (25 lessons — exactly as the book's own «قائمة المحتوى» on scan 7 lists
// the 13 of Unit 1, with Unit 2 following the same pagination as the
// English-medium sibling), and, for every lesson, the book's own printed
// heads — the «الدرس» head plus the «نشاط» activity heads the pages print —
// verbatim and with the printed page they start on. The self-checks at the
// bottom prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS NINE — book page = scan page − 9
// Every content page that carries a folio prints its own number in Western
// digits in its footer («الوحدة الأولى: الأنظمة الحية | 1», «2 | أولاد كمال …»,
// «47 | المفهوم 3.1 …», bare «95», «99», «103», «111»), so `BOOK_TO_PDF_OFFSET`
// is fixed by the scans and quoted here: scan 10 prints «… | 1» (book 1, the
// Unit-1 «ابدأ» opener), scan 17 prints «8 | …» (book 8), scan 76 prints
// «… | 67» (book 67, the Unit-2 «ابدأ» opener) and scan 126 prints «117 | …»
// (book 117, the term's last page). The book's own «قائمة المحتوى» (scan 7)
// independently confirms the Unit-1 lesson starts: every «الدرس» sits exactly
// where the contents says it does (5, 8, 14, 21, 23, 27, 30, 33, 36, 41, 46,
// 50, 52); the Unit-2 contents page (scan 8) lost its entries in extraction —
// it keeps only the «نظرة عامة على الوحدة» head followed by its dot leaders —
// so the Unit-2 starts (71, 74, 77, 81, 85, 88, 90, 94, 97, 101, 105, 107) are
// taken from the «الدرس» openers the scans themselves print, which continue the
// same pagination as the English-medium sibling page for page.
//
// TERM = THE NUMBERED BOOK PAGES (books 1–117)
// Scan pages 1–9 are before the term: the cover (1), the credits masthead (2,
// folio «iii»), a blank page (3, the provider's «لا يوجد نص» sentence), the
// «مقدمة الكتاب المدرسي» (4, folio «v»), the parent/teacher letter (5–6,
// folios «vi»–«vii»), the printed «قائمة المحتوى» (7–8, folio «viii» on the
// first) and the Unit-1 divider (9, no folio). Scan pages 127–128 are after
// the term: the review-board page (127) and the back cover (128). The term runs
// from the Unit-1 «ابدأ» opener (book 1 = scan 10) to the second Safety page
// (book 117 = scan 126): `EGYPT_SCIENCE_G4_T1_BOOK_START` / `_BOOK_END` are
// exactly those two pages, and the tiling assertion proves nothing in between
// is left unreachable. `pagesChecked` is therefore 117 − 1 + 1 − 0 = 117: every
// scan exists with a text layer, so `MISSING_SCANS` is empty.
//
// FIFTEEN TERM PAGES PRINT NO FOLIO — EACH IS ANCHORED ON A HEAD IT PRINTS
// Books 4, 26, 40, 70, 84 and 96 are the six «المفهوم» openers (objectives +
// key vocabulary); book 66 is the Unit-2 divider; the other eight (5, 27, 41,
// 71, 85, 97 — the six «نشاط 1 هل تستطيع الشرح؟» lesson openers — plus 74 and
// 88) are lesson openers whose footer carries only the publisher imprint.
// None prints any digit at its foot, so each is anchored on a head its own
// page prints, named in `FOLIO_LESS_ANCHORS`. Every other term page proves its
// own number from the last two text lines, so `FOOTER_OCR_MISREADS` is empty
// and no folio the OCR could parse mismatches its page. (Books 98 and 100
// print the folio as a bare number on the second-to-last line, above the
// publisher imprint — which is why the check reads the last two lines.)
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every lesson contributes its «الدرس» head (ordinal word, exactly as the
// opener prints it — spread openers split it across two lines, «الدرس» /
// «الأول», which `normalize` rejoins) plus one concept per printed activity:
// «نشاط N» glued to the Like-a-Scientist subtitle on the very next line
// («نشاط 2 تساؤل كعالم»), transcribed verbatim from the page it starts on —
// including the book's own spelling shifts («تساءل كعالم» on books 50 and 98
// against «تساؤل كعالم» elsewhere, «قيّم» against «قيم», «حلّل» against
// «حلل», «سجّل» against «سجل»). Nothing is invented: every concept title below
// is a string the book itself prints on the page its `bookFrom` names.
//
// LESSON TITLES ARE THE OPENER'S OWN TOPIC HEAD
// Each lesson's `title` (and its `printedHead`) is the distinctive head its
// opener prints: the figure or investigation topic («سحلية الصحراء», «أنواع
// وطرق التكيف», «كيف تتنفس الأسماك؟», «البطريق», «السرعة», «أداة لحياة أسهل»,
// «البحث العملي: السرعة والتصادم», …). The six pure-intro openers (books 27,
// 41, 71, 85, 97 — plus book 5 whose topic line «سحلية الصحراء» it does print,
// so lesson 1-1 keeps that) keep the head the opener does print; lessons whose
// opener prints «نشاط 1 هل تستطيع الشرح؟» keep «هل تستطيع الشرح؟».
//
// CONCEPT OPENERS RIDE WITH THE LESSONS THEY TOUCH
// Each unit's first lesson starts on the unit's own «ابدأ» page (books 1 and
// 67 print no lesson head of their own), so `lessonBookRange` starts a unit's
// first lesson at the section head, exactly as the other Egyptian specs do.
// The mid-unit «المفهوم» openers land where the tiling puts them: book 4 opens
// lesson 1-1, book 26 closes lesson 1-5, book 40 closes lesson 1-9, book 66
// (the Unit-2 divider) closes lesson 1-13, book 70 opens lesson 2-1, book 84
// closes lesson 2-4 and book 96 closes lesson 2-8. The Unit Projects, the
// Interdisciplinary Project, the «قيم تعلمك» pages and the two Safety pages
// close their unit's last lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 9 (verified: book p.117 = scan p.126). */
export const BOOK_TO_PDF_OFFSET = 9;

/** First printed page of the term — the Unit-1 «ابدأ» opener (scan 10). */
export const EGYPT_SCIENCE_G4_T1_BOOK_START = 1;

/** Last printed page of the term — the second Safety page (scan 126). */
export const EGYPT_SCIENCE_G4_T1_BOOK_END = 117;

/** The scanned pages before the term: cover, credits, blank, foreword, parent letter, contents, unit divider. */
export const EGYPT_SCIENCE_G4_T1_FRONT_MATTER = { from: 1, to: 9 } as const;

/** The scanned pages after the term: the review-board page and the back cover. */
export const EGYPT_SCIENCE_G4_T1_BACK_MATTER = { from: 127, to: 128 } as const;

/**
 * The term pages the OCR never produced, in book pages. Every one of the 128
 * scans exists with a text layer (scan 3 is the provider's blank-page sentence
 * in the front matter, normalised to "" by the loader), so no term page is
 * missing and the strong check proves all 117 of them.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of the textbook — becomes one concept in the app tree. */
export interface ScienceG4T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The head's own printed label: "الدرس" or "نشاط". */
  kind: string;
  /** The printed head, verbatim. */
  title: string;
}

/** One printed lesson of the book — becomes one lesson in the app tree. */
export interface ScienceG4T1Lesson {
  /** App-addressable key, e.g. "1-3" (unit 1, lesson 3). */
  key: string;
  /** Arabic ordinal of the lesson number within its unit, e.g. "الثالث". */
  ordinal: string;
  /** The lesson's opening head type — its first concept's kind ("الدرس"). */
  type: string;
  /** Lesson title: the opener's own topic head (see the header note). */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`): the opener's topic head, which every opener
   * below prints on its first page.
   */
  printedHead: string;
  /** First printed book page of the lesson itself (its contents page). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: ScienceG4T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed unit of the term. */
export interface ScienceG4T1Unit {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"2", in book order. */
  key: string;
  /** Arabic ordinal of the unit as used in the app tree, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: الأنظمة الحية". */
  title: string;
  /** The unit head its opener prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next opener). */
  bookTo: number;
  lessons: ScienceG4T1Lesson[];
}

const LESSON = "الدرس";
const ACTIVITY = "نشاط";

function concept(bookFrom: number, kind: string, title: string): ScienceG4T1Concept {
  return { bookFrom, kind, title };
}

function lessonHead(bookFrom: number, title: string): ScienceG4T1Concept {
  return concept(bookFrom, LESSON, title);
}

function activity(bookFrom: number, title: string): ScienceG4T1Concept {
  return concept(bookFrom, ACTIVITY, title);
}

/**
 * The two units of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit ranges come from the pages' own openers: 1–66 and 67–117 (the Unit-2
 * divider on book 66 closes Unit 1, exactly as in the English-medium sibling).
 * Lesson starts come from the «الدرس» openers and match the book's «قائمة
 * المحتوى» for Unit 1; Unit 2 continues the same pagination.
 */
export const EGYPT_SCIENCE_G4_T1_UNITS: ScienceG4T1Unit[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: الأنظمة الحية",
    printedHead: "الوحدة الأولى: الأنظمة الحية",
    bookFrom: 1,
    bookTo: 66,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: LESSON,
        title: "سحلية الصحراء",
        printedHead: "سحلية الصحراء",
        bookFrom: 5,
        concepts: [
          lessonHead(5, "الدرس الأول"),
          activity(5, "نشاط 1 هل تستطيع الشرح؟"),
          activity(6, "نشاط 2 تساؤل كعالم"),
          activity(7, "نشاط 3 لاحظ كعالم"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "أنواع وطرق التكيف",
        printedHead: "أنواع وطرق التكيف",
        bookFrom: 8,
        concepts: [
          lessonHead(8, "الدرس الثاني"),
          activity(8, "نشاط 4 حلل كعالم"),
          activity(10, "نشاط 5 لاحظ كعالم"),
          activity(12, "نشاط 6 حلل كعالم"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "عالم النبات",
        printedHead: "عالم النبات",
        bookFrom: 14,
        concepts: [
          lessonHead(14, "الدرس الثالث"),
          activity(14, "نشاط 7 فكر كعالم"),
          activity(16, "نشاط 8 لاحظ كعالم"),
          activity(19, "نشاط 9 لاحظ كعالم"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "كيف تتنفس الأسماك؟",
        printedHead: "كيف تتنفس الأسماك؟",
        bookFrom: 21,
        concepts: [
          lessonHead(21, "الدرس الرابع"),
          activity(21, "نشاط 10 لاحظ كعالم"),
          activity(22, "نشاط 11 حلل كعالم"),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "البطريق",
        printedHead: "البطريق",
        bookFrom: 23,
        concepts: [
          lessonHead(23, "الدرس الخامس"),
          activity(23, "نشاط 12 سجّل أدلة كعالم"),
          activity(24, "نشاط 13 حلل كعالم"),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: LESSON,
        title: "هل تستطيع الشرح؟",
        printedHead: "هل تستطيع الشرح؟",
        bookFrom: 27,
        concepts: [
          lessonHead(27, "الدرس الأول"),
          activity(27, "نشاط 1 هل تستطيع الشرح؟"),
          activity(28, "نشاط 2 تساؤل كعالم"),
          activity(29, "نشاط 3 قيم كعالم"),
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        type: LESSON,
        title: "الأعضاء الحسية للحيوانات الليلية",
        printedHead: "الأعضاء الحسية للحيوانات الليلية",
        bookFrom: 30,
        concepts: [
          lessonHead(30, "الدرس الثاني"),
          activity(30, "نشاط 4 لاحظ كعالم"),
          activity(31, "نشاط 5 حلل كعالم"),
          activity(32, "نشاط 6 قيّم كعالم"),
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "كيف يعمل الجهاز العصبي",
        printedHead: "كيف يعمل الجهاز العصبي",
        bookFrom: 33,
        concepts: [
          lessonHead(33, "الدرس الثالث"),
          activity(33, "نشاط 7 لاحظ كعالم"),
          activity(34, "نشاط 8 قيّم كعالم"),
        ],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "طريقة الحيوانات في استخدام أنظمة التواصل",
        printedHead: "طريقة الحيوانات في استخدام أنظمة التواصل",
        bookFrom: 36,
        concepts: [
          lessonHead(36, "الدرس الرابع"),
          activity(36, "نشاط 9 لاحظ كعالم"),
          activity(38, "نشاط 10 حلل كعالم"),
        ],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        type: LESSON,
        title: "هل تستطيع الشرح؟",
        printedHead: "هل تستطيع الشرح؟",
        bookFrom: 41,
        concepts: [
          lessonHead(41, "الدرس الأول"),
          activity(41, "نشاط 1 هل تستطيع الشرح؟"),
          activity(42, "نشاط 2 تساؤل كعالم"),
          activity(44, "نشاط 3 قيّم كعالم"),
        ],
      },
      {
        key: "1-11",
        ordinal: "الحادي عشر",
        type: LESSON,
        title: "ماذا يحدث عند سقوط الضوء على المواد المختلفة؟",
        printedHead: "ماذا يحدث عند سقوط الضوء على المواد المختلفة؟",
        bookFrom: 46,
        concepts: [
          lessonHead(46, "الدرس الثاني"),
          activity(46, "نشاط 4 ابحث كعالم"),
          activity(48, "نشاط 5 حلل كعالم"),
        ],
      },
      {
        key: "1-12",
        ordinal: "الثاني عشر",
        type: LESSON,
        title: "عرض الخنافس المضيئة",
        printedHead: "عرض الخنافس المضيئة",
        bookFrom: 50,
        concepts: [
          lessonHead(50, "الدرس الثالث"),
          activity(50, "نشاط 6 تساءل كعالم"),
          activity(51, "نشاط 7 قيم كعالم"),
        ],
      },
      {
        key: "1-13",
        ordinal: "الثالث عشر",
        type: LESSON,
        title: "كيف ننقل المعلومات؟",
        printedHead: "كيف ننقل المعلومات؟",
        bookFrom: 52,
        concepts: [
          lessonHead(52, "الدرس الرابع"),
          activity(52, "نشاط 8 حلّل كعالم"),
          activity(53, "نشاط 9 قيّم كعالم"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: الحركة",
    printedHead: "الوحدة الثانية: الحركة",
    bookFrom: 67,
    bookTo: 117,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: LESSON,
        title: "هل تستطيع الشرح؟",
        printedHead: "هل تستطيع الشرح؟",
        bookFrom: 71,
        concepts: [
          lessonHead(71, "الدرس الأول"),
          activity(71, "نشاط 1 هل تستطيع الشرح؟"),
          activity(72, "نشاط 2 تساؤل كعالم"),
          activity(73, "نشاط 3 لاحظ كعالم"),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "ما الذي تعرفه عن الحركة والتوقف؟",
        printedHead: "ما الذي تعرفه عن الحركة والتوقف؟",
        bookFrom: 74,
        concepts: [
          lessonHead(74, "الدرس الثاني"),
          activity(74, "نشاط 4 لاحظ كعالم"),
          activity(75, "نشاط 5 حلل كعالم"),
          activity(76, "نشاط 6 لاحظ كعالم"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "ما أسباب توقف الأجسام عن الحركة؟",
        printedHead: "ما أسباب توقف الأجسام عن الحركة؟",
        bookFrom: 77,
        concepts: [
          lessonHead(77, "الدرس الثالث"),
          activity(77, "نشاط 7 حلل كعالم"),
          activity(79, "نشاط 8 ابحث كعالم"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "الطاقة، والشغل، والقوة",
        printedHead: "الطاقة، والشغل، والقوة",
        bookFrom: 81,
        concepts: [
          lessonHead(81, "الدرس الرابع"),
          activity(81, "نشاط 9 لاحظ كعالم"),
          activity(82, "نشاط 10 سجل أدلة كعالم"),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "هل تستطيع الشرح؟",
        printedHead: "هل تستطيع الشرح؟",
        bookFrom: 85,
        concepts: [
          lessonHead(85, "الدرس الأول"),
          activity(85, "نشاط 1 هل تستطيع الشرح ؟"),
          activity(86, "نشاط 2 تساؤل كعالم"),
          activity(87, "نشاط 3 قيم كعالم"),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: LESSON,
        title: "الطاقة",
        printedHead: "الطاقة",
        bookFrom: 88,
        concepts: [
          lessonHead(88, "الدرس الثاني"),
          activity(88, "نشاط 4 لاحظ كعالم"),
          activity(89, "نشاط 5 حلل كعالم"),
        ],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        type: LESSON,
        title: "ما الصور المختلفة لطاقة الوضع وطاقة الحركة؟",
        printedHead: "ما الصور المختلفة لطاقة الوضع وطاقة الحركة؟",
        bookFrom: 90,
        concepts: [
          lessonHead(90, "الدرس الثالث"),
          activity(90, "نشاط 6 حلل كعالم"),
          activity(92, "نشاط 7 لاحظ كعالم"),
        ],
      },
      {
        key: "2-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "أداة لحياة أسهل",
        printedHead: "أداة لحياة أسهل",
        bookFrom: 94,
        concepts: [
          lessonHead(94, "الدرس الرابع"),
          activity(94, "نشاط 8 قيم كعالم"),
          activity(95, "نشاط 9 سجّل أدلة كعالم"),
        ],
      },
      {
        key: "2-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "هل تستطيع الشرح؟",
        printedHead: "هل تستطيع الشرح؟",
        bookFrom: 97,
        concepts: [
          lessonHead(97, "الدرس الأول"),
          activity(97, "نشاط 1 هل تستطيع الشرح؟"),
          activity(98, "نشاط 2 تساءل كعالم"),
          activity(99, "نشاط 3 لاحظ كعالم"),
        ],
      },
      {
        key: "2-10",
        ordinal: "العاشر",
        type: LESSON,
        title: "السرعة",
        printedHead: "السرعة",
        bookFrom: 101,
        concepts: [
          lessonHead(101, "الدرس الثاني"),
          activity(101, "نشاط 4 لاحظ كعالم"),
          activity(103, "نشاط 5 ابحث كعالم"),
        ],
      },
      {
        key: "2-11",
        ordinal: "الحادي عشر",
        type: LESSON,
        title: "ماذا تلاحظ عند تصادم جسمين؟",
        printedHead: "ماذا تلاحظ عند تصادم جسمين؟",
        bookFrom: 105,
        concepts: [
          lessonHead(105, "الدرس الثالث"),
          activity(105, "نشاط 6 حلّل كعالم"),
          activity(106, "نشاط 7 حلل كعالم"),
        ],
      },
      {
        key: "2-12",
        ordinal: "الثاني عشر",
        type: LESSON,
        title: "البحث العملي: السرعة والتصادم",
        printedHead: "البحث العملي: السرعة والتصادم",
        bookFrom: 107,
        concepts: [
          lessonHead(107, "الدرس الرابع"),
          activity(107, "نشاط 8 ابحث كعالم"),
          activity(109, "نشاط 9 حلل كعالم"),
          activity(111, "نشاط 10 حلل كعالم"),
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
 * lesson — the «ابدأ» opener) or its own start page, up to the
 * page before the next lesson starts, or the section's last page for its last
 * lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_SCIENCE_G4_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SCIENCE_G4_T1_UNITS.forEach((section, si) => {
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
  for (const section of EGYPT_SCIENCE_G4_T1_UNITS) {
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
  "science-g4-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (Only scan 3, a front-matter blank, needs it — but the guard keeps
 * the loader the same shape across the books.)
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

/** Loads + joins the OCR text of a book-page range into one document. */
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

/**
 * Full document payload for one lesson: its owned range plus the appendix pages
 * it points to. This book has no appendix, so the extra loop is a no-op kept
 * for a shared shape.
 */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const range = lessonBookRange(sectionIndex, lessonIndex);
  const lesson = EGYPT_SCIENCE_G4_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(range.from, range.to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/**
 * Folds text for comparison: drops tatweel and diacritics, unifies the alef/ya/ta
 * forms the book prints inconsistently, and removes every non-letter/digit, so OCR
 * spacing and vowel marks cannot break a match.
 */
function normalize(text: string): string {
  return text
    .replace(/ـ/g, "")
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring OCR spacing and vowel marks. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints. This book's folio always rides
 * in the footer at the foot of the page («الوحدة الأولى: الأنظمة الحية | 1»,
 * «2 | أولاد كمال …», «47 | المفهوم 3.1 …», bare «95»), so the last two lines
 * each contribute every whitespace-separated digit token — the publisher
 * imprint some pages carry on the very last line pushes the bare folio of
 * books 98 and 100 one line up. Lesson, concept and activity numbers join the
 * candidate set harmlessly: the page's own number proves the mapping when
 * present.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const region = lines.slice(-2);
  const numbers = new Set<number>();
  for (const line of region) {
    const tokens = line.split(/\s+/);
    for (const token of tokens) {
      if (/^\d{1,3}$/.test(token)) numbers.add(Number(token));
    }
  }
  return [...numbers].sort((a, b) => a - b);
}

/**
 * The book number a content page prints, or null when it prints none. Returns
 * the page's own number when it is among the candidates, otherwise the largest
 * candidate (so a wrong page still reports a number and the caller can see the
 * mismatch). The fifteen pages named in `FOLIO_LESS_ANCHORS` print no digit at
 * their foot at all and are exempted via their anchor instead.
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
 * The term pages that print no folio at all, each with the anchor the check
 * accepts in place of a page number. Books 4, 26, 40, 70, 84 and 96 are the
 * six «المفهوم» openers; book 66 is the Unit-2 divider; books 5, 27, 41, 71,
 * 85 and 97 are the six «نشاط 1 هل تستطيع الشرح؟» lesson openers; books 74
 * and 88 open their lessons with no more than the publisher imprint at the
 * foot. Each anchor is a head its own page prints.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  4: "1.1 التكيف والبقاء",
  5: "سحلية الصحراء",
  26: "2.1 كيف تعمل الحواس؟",
  27: "هل تستطيع الشرح؟",
  40: "3.1 الضوء وحاسة البصر",
  41: "هل تستطيع الشرح؟",
  66: "الوحدة الثانية: الحركة",
  70: "1.2 الحركة والتوقف",
  71: "هل تستطيع الشرح؟",
  74: "ما الذي تعرفه عن الحركة والتوقف؟",
  84: "2.2 الطاقة والحركة",
  85: "هل تستطيع الشرح؟",
  88: "كيف تحصل الأجسام المتحركة على الطاقة؟",
  96: "3.2 الطاقة والتصادم",
  97: "هل تستطيع الشرح؟",
};

/** Every head kind the table may use. */
const KNOWN_KINDS = new Set([LESSON, ACTIVITY]);

/**
 * Table invariants: lesson keys are unique and follow (section-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_SCIENCE_G4_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_SCIENCE_G4_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_SCIENCE_G4_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SCIENCE_G4_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_SCIENCE_G4_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     the folio in its footer, or, on the fifteen pages named in
 *     `FOLIO_LESS_ANCHORS`, from the anchor the page itself prints;
 *  2. every section opener prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title (or its printed head) and every activity's head is
 *     printed on the pages the lesson owns (the activity on its own page);
 *  4. every page in [1, 117] is owned by exactly one lesson — no page falls
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
  const sections = EGYPT_SCIENCE_G4_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SCIENCE_G4_T1_BOOK_START || book > EGYPT_SCIENCE_G4_T1_BOOK_END) continue;
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
  for (let p = EGYPT_SCIENCE_G4_T1_BOOK_START; p <= EGYPT_SCIENCE_G4_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_SCIENCE_G4_T1_BOOK_END - EGYPT_SCIENCE_G4_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_SCIENCE_G4_T1_BOOK_START} و${EGYPT_SCIENCE_G4_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
