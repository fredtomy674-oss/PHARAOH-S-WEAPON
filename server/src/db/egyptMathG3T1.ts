// Primary 3 (الصف الثالث الابتدائي) Mathematics (الرياضيات), first term,
// Ministry of Education and Technical Education 2025/2026 edition (the cover
// imprint prints «2025 - 2026» and the back matter the print specs).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g3-math`, subject `math` (name "Mathematics"), lesson prefix
// `l-g3-math-`, grade `grade-3` (name "Primary 3").
//
// The curriculum tree for the Egypt `eg-g3-math` curriculum is rebuilt from
// the Ministry textbook `الرياضيات — الصف الثالث الابتدائي — الفصل الدراسي
// الأول` (113 scanned pages). This module is the single source of truth for
// its structure: the six printed فصول of the first term, every numbered
// printed درس inside them (47 in all), and, for every lesson, the book's own
// printed heads — the درس head plus the activity-flow bands the pages print
// (اربط / التطبيق / التحدي / تأمل / المفتاح / تدريب / تدريب جماعي / تدريب
// ثنائي) — verbatim and with the printed page they start on. The self-checks
// at the bottom prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every content page that carries a folio prints it on the footer line
// carrying «الصف الثالث الابتدائي - الفصل الدراسي الأول» (the number stands
// before or after the words, in Arabic-Indic digits), so `BOOK_TO_PDF_OFFSET`
// is fixed by the scans and quoted here: scan 6 prints «… الأول ٢» (book 2,
// the chapter-1 opener), scan 10 prints «… الأول ٦» (book 6), scan 15 prints
// «… الأول ١١» (book 11, the chapter-2 opener), scan 48 prints «٤٤ …» (book
// 44) and scan 111 prints «… ١٠٧» (book 107, the term's last page). The book's
// own «المحتويات» (scan 5) independently confirms the lesson starts: it lists
// «الدرس ١: الأنماط ٢» … «الدرس ٩: قراءة السعة ١٠٤» — every head below sits
// exactly where the contents says it does, with the single exception noted
// below (lesson 6-7).
//
// TERM = THE TYPED BOOK PAGES (books 2–107)
// Scan pages 1–5 are before the term: the cover (1), the supervision credits
// «اشراف» (2), the foreword (3), a blank verso (4, the OCR answers «لا يوجد
// نص في الصورة المرفقة») and the printed «المحتويات» (5). Scan pages 112–113
// are after the term (the technical-specs / copyright page and the back
// cover). The term runs from the chapter-1 opener (book 2 = scan 6) to the
// chapter-6 closing تأمل (book 107 = scan 111): `EGYPT_MATH_G3_T1_BOOK_START`
// / `_BOOK_END` are exactly those two pages, and the tiling assertion proves
// nothing in between is left unreachable. `pagesChecked` is therefore
// 107 − 2 + 1 = 106 (no scan of the term is missing).
//
// SEVEN TERM PAGES PRINT NO PARSEABLE FOLIO — EACH HAS A NAMED ANCHOR
// The vision OCR lost the folio of seven pages: book 5 prints the footer with
// a Latin «0» where «٥» belongs; book 17 prints «IV» where «١٧» belongs; book
// 29 (a multiples worksheet) prints no footer at all; book 55 prints «00»
// where «٥٥» belongs; book 70 prints «V.» where «٧٠» belongs; book 71 prints
// «VI» where «٧١» belongs; and book 97 (an addition-strategies worksheet)
// prints no footer at all. Rather than weaken the page-number check, all
// seven are exempt from it and anchored on a string the page itself prints,
// named in `FOLIO_LESS_ANCHORS`. Books 95 and 96 print a parseable but
// misread folio (bare «90» for 95, bare «97» for 96, the folio split onto its
// own line); both stay numeric and are recorded in `FOOTER_OCR_MISREADS`.
// Every other term page proves its number from its footer — the number on the
// «الصف الثالث الابتدائي» line when it carries one, else a bare numeral in
// the last three lines (split footers) — so body numbers (shape labels,
// gauge marks, exercise answers) can never be mistaken for a folio.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every numbered درس contributes its head line (number + title, exactly as
// the opener prints it, including the OCR's own variants: «الدرس 5 : …» with
// a Latin 5 on books 33 and 54, «الدرس 5: …» on book 95, «الدرس ٦ : …» with a
// space before the colon on books 10 and 34 and 97, and «الدرس ۷: …» with an
// Extended Arabic-Indic seven on book 35) plus the activity-flow bands the
// lesson prints, in page order: «اربط» (book 54 prints it «أربط», kept
// verbatim), «التطبيق», «التحدي», «تأمل», «المفتاح» (book 5 only), «تدريب»
// (printed «تدريب:», books 26 and 99), «تدريب جماعي:» and «تدريب ثنائي:»
// (book 34 only). A band that recurs on a later page under a continuation
// head («تابع التطبيق» / «تابع: التطبيق») or a part label («التطبيق، الجزء
// الأول» / «التطبيق، تابع الجزء الأول» / «التطبيق، الجزء الثاني», books
// 23–25) is the same concept, stored once under the bare band word — exactly
// as the Grade-2 Mathematics spec folds «التطبيق (١)» / «التطبيق (٢)». Worked
// «مثال:» / «مثال للتدريب:» labels and «المقارنة» table headers are example
// and table furniture, not activity bands, so they carry no concept — the
// pages that print them still belong to their lesson's range. Nothing is
// invented: every concept title below is a string the book itself prints on
// the page its `bookFrom` names.
//
// ONE GENUINE CONTENTS ANOMALY
// The contents lists lesson 6-7 «تطبيقات حياتية على الجمع والطرح» at book
// 98, but the head is actually printed on book 99 (book 98 continues lesson
// 6-6's subtraction problems under «تابع: التطبيق»). The spec follows the
// page that prints the head — book 99 — which is what
// `assertTreeMatchesTheBook` proves. (The English-medium sibling prints the
// same book with the same mismatch.)
//
// THE CHAPTER OPENER RIDES WITH THE FIRST LESSON
// Each chapter's first lesson starts on the chapter's own opener page (which
// prints «الفصل N» and then the lesson head), so `lessonBookRange` starts a
// chapter's first lesson at the section head, exactly as the other Egyptian
// Mathematics specs do. The book prints no appendix: every page of the term
// belongs to exactly one lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.107 = scan p.111). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the chapter-1 opener (scan 6). */
export const EGYPT_MATH_G3_T1_BOOK_START = 2;

/** Last printed page of the term — the chapter-6 closing تأمل (scan 111). */
export const EGYPT_MATH_G3_T1_BOOK_END = 107;

/** The scanned pages before the term: cover, supervision credits, foreword, blank verso, contents. */
export const EGYPT_MATH_G3_T1_FRONT_MATTER = { from: 1, to: 5 } as const;

/** The scans after the term: the technical-specs / copyright page (112) and the back cover (113). */
export const EGYPT_MATH_G3_T1_BACK_MATTER = { from: 112, to: 113 } as const;

/**
 * The term pages the OCR never produced, as scan pages. All 113 scans are
 * present and every one of the 106 term pages carries text, so there are
 * none; the constant is kept so this module shares the shape of the other
 * Egyptian specs (and so the checker's expected page count subtracts it).
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of a lesson — becomes one concept in the app tree. */
export interface MathG3T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: "الدرس" or one of the activity band words. */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one numbered درس of a chapter). */
export interface MathG3T1Lesson {
  /** App-addressable key, e.g. "3-7" (chapter 3, lesson 7). */
  key: string;
  /** Arabic ordinal of the lesson number, e.g. "الثالث". */
  ordinal: string;
  /** The lesson’s opening head type — its first concept’s kind ("الدرس"). */
  type: string;
  /** Lesson title as printed at the head of the lesson (without the number prefix). */
  title: string;
  /** The string the lesson’s own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book’s printed heads for this lesson, in order, with their start pages. */
  concepts: MathG3T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a chapter — so no lesson below uses it; the
   * field is kept so this module shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed chapter of the term (one of the six فصول). */
export interface MathG3T1Unit {
  /** This book’s units are its chapters (فصول). */
  kind: "chapter";
  /** Internal key: "1"…"6", in book order. */
  key: string;
  /** Arabic ordinal of the chapter, e.g. "الثالث". */
  ordinal: string;
  /** Full app-facing unit title, e.g. "الفصل الثالث". */
  title: string;
  /** The chapter head its opener prints, verbatim, e.g. "الفصل الثالث". */
  printedHead: string;
  /** First printed page of the unit (its opener). */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next opener). */
  bookTo: number;
  lessons: MathG3T1Lesson[];
}

const LESSON = "الدرس";
const CONNECT = "اربط";
const APPLY = "التطبيق";
const CHALLENGE = "التحدي";
const REFLECT = "تأمل";
const KEY = "المفتاح";
const PRACTICE = "تدريب";
const GROUP_PRACTICE = "تدريب جماعي";
const PAIR_PRACTICE = "تدريب ثنائي";

function concept(bookFrom: number, kind: string, title: string): MathG3T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The six chapters of the first term with their printed lessons and every printed
 * head, transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter ranges come from the pages’ own «الفصل N» bands and the contents
 * (scan 5): 2–10, 11–25, 26–43, 44–61, 62–82 and 83–107. Lesson starts come from
 * the «الدرس n:» openers and match the contents exactly, except lesson 6-7
 * (contents says 98, the head is printed on 99 — see the header note).
 */
export const EGYPT_MATH_G3_T1_UNITS: MathG3T1Unit[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "الفصل الأول",
    printedHead: "الفصل الأول",
    bookFrom: 2,
    bookTo: 10,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: LESSON,
        title: "الأنماط",
        printedHead: "الدرس ١: الأنماط",
        bookFrom: 2,
        concepts: [
          concept(2, LESSON, "الدرس ١: الأنماط"),
          concept(2, CONNECT, "اربط"),
          concept(3, APPLY, "التطبيق"),
          concept(3, CHALLENGE, "التحدي"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "مزيد من التمثيل البياني بالأعمدة",
        printedHead: "الدرس ٢: مزيد من التمثيل البياني بالأعمدة",
        bookFrom: 4,
        concepts: [
          concept(4, LESSON, "الدرس ٢: مزيد من التمثيل البياني بالأعمدة"),
          concept(4, APPLY, "التطبيق"),
          concept(4, CHALLENGE, "التحدي"),
          concept(4, REFLECT, "تأمل"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "التمثيل البياني بالنقاط",
        printedHead: "الدرس ٣: التمثيل البياني بالنقاط",
        bookFrom: 5,
        concepts: [
          concept(5, LESSON, "الدرس ٣: التمثيل البياني بالنقاط"),
          concept(5, APPLY, "التطبيق"),
          concept(5, KEY, "المفتاح"),
          concept(5, CHALLENGE, "التحدي"),
          concept(5, REFLECT, "تأمل"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "قياس الأطوال بالسنتيمتر",
        printedHead: "الدرس ٤: قياس الأطوال بالسنتيمتر",
        bookFrom: 6,
        concepts: [
          concept(6, LESSON, "الدرس ٤: قياس الأطوال بالسنتيمتر"),
          concept(6, CONNECT, "اربط"),
          concept(7, APPLY, "التطبيق"),
          concept(7, REFLECT, "تأمل"),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "قياس الأطوال بالمتر",
        printedHead: "الدرس ٥: قياس الأطوال بالمتر",
        bookFrom: 8,
        concepts: [
          concept(8, LESSON, "الدرس ٥: قياس الأطوال بالمتر"),
          concept(8, APPLY, "التطبيق"),
          concept(9, CHALLENGE, "التحدي"),
          concept(9, REFLECT, "تأمل"),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: LESSON,
        title: "قياس الأطول بالملليمتر",
        printedHead: "الدرس ٦ : قياس الأطول بالملليمتر",
        bookFrom: 10,
        concepts: [
          concept(10, LESSON, "الدرس ٦ : قياس الأطول بالملليمتر"),
          concept(10, APPLY, "التطبيق"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "الثاني",
    title: "الفصل الثاني",
    printedHead: "الفصل الثاني",
    bookFrom: 11,
    bookTo: 25,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: LESSON,
        title: "الآلاف",
        printedHead: "الدرس ١: الآلاف",
        bookFrom: 11,
        concepts: [
          concept(11, LESSON, "الدرس ١: الآلاف"),
          concept(11, APPLY, "التطبيق"),
          concept(12, REFLECT, "تأمل"),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "مزيد من الآلاف",
        printedHead: "الدرس ٢: مزيد من الآلاف",
        bookFrom: 13,
        concepts: [
          concept(13, LESSON, "الدرس ٢: مزيد من الآلاف"),
          concept(13, APPLY, "التطبيق"),
          concept(14, CHALLENGE, "التحدي"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "عشرات الآلاف - مئات الآلاف",
        printedHead: "الدرس ٣: عشرات الآلاف - مئات الآلاف",
        bookFrom: 15,
        concepts: [
          concept(15, LESSON, "الدرس ٣: عشرات الآلاف - مئات الآلاف"),
          concept(15, APPLY, "التطبيق"),
          concept(16, REFLECT, "تأمل"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "صيغ مختلفة لكتابة الأعداد",
        printedHead: "الدرس ٤: صيغ مختلفة لكتابة الأعداد",
        bookFrom: 17,
        concepts: [
          concept(17, LESSON, "الدرس ٤: صيغ مختلفة لكتابة الأعداد"),
          concept(17, APPLY, "التطبيق"),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "المصفوفات",
        printedHead: "الدرس ٥: المصفوفات",
        bookFrom: 18,
        concepts: [
          concept(18, LESSON, "الدرس ٥: المصفوفات"),
          concept(18, APPLY, "التطبيق"),
          concept(20, REFLECT, "تأمل"),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: LESSON,
        title: "مفهوم الضرب",
        printedHead: "الدرس ٦: مفهوم الضرب",
        bookFrom: 21,
        concepts: [
          concept(21, LESSON, "الدرس ٦: مفهوم الضرب"),
          concept(21, APPLY, "التطبيق"),
          concept(22, CHALLENGE, "التحدي"),
        ],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        type: LESSON,
        title: "خاصية الابدال في الضرب",
        printedHead: "الدرس ٧: خاصية الابدال في الضرب",
        bookFrom: 23,
        concepts: [
          concept(23, LESSON, "الدرس ٧: خاصية الابدال في الضرب"),
          concept(23, APPLY, "التطبيق"),
          concept(25, REFLECT, "تأمل"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "الثالث",
    title: "الفصل الثالث",
    printedHead: "الفصل الثالث",
    bookFrom: 26,
    bookTo: 43,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: LESSON,
        title: "مسائل كلامية على الضرب",
        printedHead: "الدرس ١: مسائل كلامية على الضرب",
        bookFrom: 26,
        concepts: [
          concept(26, LESSON, "الدرس ١: مسائل كلامية على الضرب"),
          concept(26, APPLY, "التطبيق"),
          concept(26, PRACTICE, "تدريب"),
          concept(27, CHALLENGE, "التحدي"),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "تطبيقات حياتية على الضرب",
        printedHead: "الدرس ٢: تطبيقات حياتية على الضرب",
        bookFrom: 28,
        concepts: [
          concept(28, LESSON, "الدرس ٢: تطبيقات حياتية على الضرب"),
          concept(28, APPLY, "التطبيق"),
          concept(28, REFLECT, "تأمل"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "مضاعفات العددين ٢، ٣",
        printedHead: "الدرس ٣: مضاعفات العددين ٢، ٣",
        bookFrom: 29,
        concepts: [
          concept(29, LESSON, "الدرس ٣: مضاعفات العددين ٢، ٣"),
          concept(29, APPLY, "التطبيق"),
          concept(30, REFLECT, "تأمل"),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "مضاعفات العددين ٥ ، ١٠",
        printedHead: "الدرس ٤: مضاعفات العددين ٥ ، ١٠",
        bookFrom: 31,
        concepts: [
          concept(31, LESSON, "الدرس ٤: مضاعفات العددين ٥ ، ١٠"),
          concept(31, APPLY, "التطبيق"),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "عوامل العدد باستخدام المصفوفات",
        printedHead: "الدرس 5 : عوامل العدد باستخدام المصفوفات",
        bookFrom: 33,
        concepts: [
          concept(33, LESSON, "الدرس 5 : عوامل العدد باستخدام المصفوفات"),
          concept(33, REFLECT, "تأمل"),
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: LESSON,
        title: "الوقت",
        printedHead: "الدرس ٦ : الوقت",
        bookFrom: 34,
        concepts: [
          concept(34, LESSON, "الدرس ٦ : الوقت"),
          concept(34, APPLY, "التطبيق"),
          concept(34, GROUP_PRACTICE, "تدريب جماعي"),
          concept(34, PAIR_PRACTICE, "تدريب ثنائي"),
        ],
      },
      {
        key: "3-7",
        ordinal: "السابع",
        type: LESSON,
        title: "تطبيقات حياتية على الوقت",
        printedHead: "الدرس ۷: تطبيقات حياتية على الوقت",
        bookFrom: 35,
        concepts: [
          concept(35, LESSON, "الدرس ۷: تطبيقات حياتية على الوقت"),
          concept(35, APPLY, "التطبيق"),
          concept(35, CHALLENGE, "التحدي"),
          concept(36, REFLECT, "تأمل"),
        ],
      },
      {
        key: "3-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "مفهوم القسمة",
        printedHead: "الدرس ٨: مفهوم القسمة",
        bookFrom: 37,
        concepts: [
          concept(37, LESSON, "الدرس ٨: مفهوم القسمة"),
          concept(37, APPLY, "التطبيق"),
          concept(39, REFLECT, "تأمل"),
        ],
      },
      {
        key: "3-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "تطبيقات حياتية على القسمة",
        printedHead: "الدرس ٩: تطبيقات حياتية على القسمة",
        bookFrom: 40,
        concepts: [
          concept(40, LESSON, "الدرس ٩: تطبيقات حياتية على القسمة"),
          concept(40, APPLY, "التطبيق"),
        ],
      },
      {
        key: "3-10",
        ordinal: "العاشر",
        type: LESSON,
        title: "العلاقة بين الضرب والقسمة",
        printedHead: "الدرس ١٠: العلاقة بين الضرب والقسمة",
        bookFrom: 42,
        concepts: [
          concept(42, LESSON, "الدرس ١٠: العلاقة بين الضرب والقسمة"),
          concept(42, APPLY, "التطبيق"),
          concept(43, CHALLENGE, "التحدي"),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "الرابع",
    title: "الفصل الرابع",
    printedHead: "الفصل الرابع",
    bookFrom: 44,
    bookTo: 61,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: LESSON,
        title: "المضلعات",
        printedHead: "الدرس ١: المضلعات",
        bookFrom: 44,
        concepts: [
          concept(44, LESSON, "الدرس ١: المضلعات"),
          concept(44, APPLY, "التطبيق"),
          concept(45, CHALLENGE, "التحدي"),
          concept(45, REFLECT, "تأمل"),
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "خواص الأشكال الرباعية",
        printedHead: "الدرس ٢: خواص الأشكال الرباعية",
        bookFrom: 46,
        concepts: [
          concept(46, LESSON, "الدرس ٢: خواص الأشكال الرباعية"),
          concept(46, CONNECT, "اربط"),
          concept(47, APPLY, "التطبيق"),
          concept(48, REFLECT, "تأمل"),
        ],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "المساحة",
        printedHead: "الدرس ٣: المساحة",
        bookFrom: 49,
        concepts: [
          concept(49, LESSON, "الدرس ٣: المساحة"),
          concept(49, CONNECT, "اربط"),
          concept(49, APPLY, "التطبيق"),
          concept(50, CHALLENGE, "التحدي"),
        ],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "مستطيلات متساوية المساحة",
        printedHead: "الدرس ٤: مستطيلات متساوية المساحة",
        bookFrom: 51,
        concepts: [
          concept(51, LESSON, "الدرس ٤: مستطيلات متساوية المساحة"),
          concept(51, CONNECT, "اربط"),
          concept(51, APPLY, "التطبيق"),
          concept(52, CHALLENGE, "التحدي"),
          concept(53, REFLECT, "تأمل"),
        ],
      },
      {
        key: "4-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "المساحة باستخدام النماذج",
        printedHead: "الدرس 5 : المساحة باستخدام النماذج",
        bookFrom: 54,
        concepts: [
          concept(54, LESSON, "الدرس 5 : المساحة باستخدام النماذج"),
          concept(54, CONNECT, "أربط"),
          concept(54, APPLY, "التطبيق"),
          concept(56, CHALLENGE, "التحدي"),
          concept(57, REFLECT, "تأمل"),
        ],
      },
      {
        key: "4-6",
        ordinal: "السادس",
        type: LESSON,
        title: "المساحة بتقسيم المصفوفات",
        printedHead: "الدرس ٦: المساحة بتقسيم المصفوفات",
        bookFrom: 58,
        concepts: [
          concept(58, LESSON, "الدرس ٦: المساحة بتقسيم المصفوفات"),
          concept(58, APPLY, "التطبيق"),
        ],
      },
      {
        key: "4-7",
        ordinal: "السابع",
        type: LESSON,
        title: "خاصية التوزيع في الضرب",
        printedHead: "الدرس ٧: خاصية التوزيع في الضرب",
        bookFrom: 59,
        concepts: [
          concept(59, LESSON, "الدرس ٧: خاصية التوزيع في الضرب"),
          concept(59, CONNECT, "اربط"),
          concept(59, APPLY, "التطبيق"),
          concept(61, REFLECT, "تأمل"),
        ],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "الخامس",
    title: "الفصل الخامس",
    printedHead: "الفصل الخامس",
    bookFrom: 62,
    bookTo: 82,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: LESSON,
        title: "محيط المضلعات",
        printedHead: "الدرس ١: محيط المضلعات",
        bookFrom: 62,
        concepts: [
          concept(62, LESSON, "الدرس ١: محيط المضلعات"),
          concept(62, APPLY, "التطبيق"),
          concept(63, REFLECT, "تأمل"),
        ],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "المحيط والمساحة",
        printedHead: "الدرس ٢: المحيط والمساحة",
        bookFrom: 64,
        concepts: [
          concept(64, LESSON, "الدرس ٢: المحيط والمساحة"),
          concept(64, APPLY, "التطبيق"),
          concept(65, CHALLENGE, "التحدي"),
          concept(66, REFLECT, "تأمل"),
        ],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "المساحة باستخدام الأبعاد",
        printedHead: "الدرس ٣: المساحة باستخدام الأبعاد",
        bookFrom: 67,
        concepts: [
          concept(67, LESSON, "الدرس ٣: المساحة باستخدام الأبعاد"),
          concept(67, APPLY, "التطبيق"),
          concept(68, CHALLENGE, "التحدي"),
        ],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "المساحة باستراتيجيات متنوعة",
        printedHead: "الدرس ٤: المساحة باستراتيجيات متنوعة",
        bookFrom: 69,
        concepts: [
          concept(69, LESSON, "الدرس ٤: المساحة باستراتيجيات متنوعة"),
          concept(69, CONNECT, "اربط"),
          concept(69, APPLY, "التطبيق"),
        ],
      },
      {
        key: "5-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "محيطات مختلفة لنفس المساحة",
        printedHead: "الدرس ٥: محيطات مختلفة لنفس المساحة",
        bookFrom: 72,
        concepts: [
          concept(72, LESSON, "الدرس ٥: محيطات مختلفة لنفس المساحة"),
          concept(72, CONNECT, "اربط"),
          concept(73, APPLY, "التطبيق"),
          concept(74, CHALLENGE, "التحدي"),
        ],
      },
      {
        key: "5-6",
        ordinal: "السادس",
        type: LESSON,
        title: "مساحات مختلفة لنفس المحيط",
        printedHead: "الدرس ٦: مساحات مختلفة لنفس المحيط",
        bookFrom: 75,
        concepts: [
          concept(75, LESSON, "الدرس ٦: مساحات مختلفة لنفس المحيط"),
          concept(75, CONNECT, "اربط"),
          concept(75, APPLY, "التطبيق"),
          concept(76, CHALLENGE, "التحدي"),
          concept(76, REFLECT, "تأمل"),
        ],
      },
      {
        key: "5-7",
        ordinal: "السابع",
        type: LESSON,
        title: "تطبيقات حياتية على المحيط والمساحة",
        printedHead: "الدرس ٧: تطبيقات حياتية على المحيط والمساحة",
        bookFrom: 77,
        concepts: [
          concept(77, LESSON, "الدرس ٧: تطبيقات حياتية على المحيط والمساحة"),
          concept(77, CONNECT, "اربط"),
          concept(77, APPLY, "التطبيق"),
        ],
      },
      {
        key: "5-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "الضرب في مضاعفات العدد ١٠",
        printedHead: "الدرس ٨: الضرب في مضاعفات العدد ١٠",
        bookFrom: 80,
        concepts: [
          concept(80, LESSON, "الدرس ٨: الضرب في مضاعفات العدد ١٠"),
          concept(80, APPLY, "التطبيق"),
          concept(82, CHALLENGE, "التحدي"),
          concept(82, REFLECT, "تأمل"),
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "chapter",
    ordinal: "السادس",
    title: "الفصل السادس",
    printedHead: "الفصل السادس",
    bookFrom: 83,
    bookTo: 107,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: LESSON,
        title: "أنماط الضرب في مضاعفات العدد ١٠",
        printedHead: "الدرس ١: أنماط الضرب في مضاعفات العدد ١٠",
        bookFrom: 83,
        concepts: [
          concept(83, LESSON, "الدرس ١: أنماط الضرب في مضاعفات العدد ١٠"),
          concept(83, CONNECT, "اربط"),
          concept(84, APPLY, "التطبيق"),
          concept(85, CHALLENGE, "التحدي"),
          concept(85, REFLECT, "تأمل"),
        ],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "استراتيجيات الضرب في العدد ٩",
        printedHead: "الدرس ٢: استراتيجيات الضرب في العدد ٩",
        bookFrom: 86,
        concepts: [
          concept(86, LESSON, "الدرس ٢: استراتيجيات الضرب في العدد ٩"),
          concept(86, APPLY, "التطبيق"),
          concept(86, CHALLENGE, "التحدي"),
        ],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "حقائق الضرب والجمع",
        printedHead: "الدرس ٣: حقائق الضرب والجمع",
        bookFrom: 90,
        concepts: [
          concept(90, LESSON, "الدرس ٣: حقائق الضرب والجمع"),
          concept(90, CONNECT, "اربط"),
          concept(91, APPLY, "التطبيق"),
        ],
      },
      {
        key: "6-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "مقارنة وترتيب الأعداد بصيغ متنوعة",
        printedHead: "الدرس ٤: مقارنة وترتيب الأعداد بصيغ متنوعة",
        bookFrom: 93,
        concepts: [
          concept(93, LESSON, "الدرس ٤: مقارنة وترتيب الأعداد بصيغ متنوعة"),
          concept(93, APPLY, "التطبيق"),
          concept(94, CHALLENGE, "التحدي"),
        ],
      },
      {
        key: "6-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "استراتيجيات الجمع",
        printedHead: "الدرس 5: استراتيجيات الجمع",
        bookFrom: 95,
        concepts: [
          concept(95, LESSON, "الدرس 5: استراتيجيات الجمع"),
          concept(95, APPLY, "التطبيق"),
          concept(96, CHALLENGE, "التحدي"),
          concept(96, REFLECT, "تأمل"),
        ],
      },
      {
        key: "6-6",
        ordinal: "السادس",
        type: LESSON,
        title: "استراتيجيات الطرح",
        printedHead: "الدرس ٦ : استراتيجيات الطرح",
        bookFrom: 97,
        concepts: [
          concept(97, LESSON, "الدرس ٦ : استراتيجيات الطرح"),
          concept(97, APPLY, "التطبيق"),
          concept(98, CHALLENGE, "التحدي"),
        ],
      },
      {
        key: "6-7",
        ordinal: "السابع",
        type: LESSON,
        title: "تطبيقات حياتية على الجمع والطرح",
        printedHead: "الدرس ٧: تطبيقات حياتية على الجمع والطرح",
        bookFrom: 99,
        concepts: [
          concept(99, LESSON, "الدرس ٧: تطبيقات حياتية على الجمع والطرح"),
          concept(99, CONNECT, "اربط"),
          concept(99, APPLY, "التطبيق"),
          concept(99, PRACTICE, "تدريب"),
          concept(101, REFLECT, "تأمل"),
        ],
      },
      {
        key: "6-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "السعة",
        printedHead: "الدرس ٨: السعة",
        bookFrom: 102,
        concepts: [
          concept(102, LESSON, "الدرس ٨: السعة"),
          concept(102, APPLY, "التطبيق"),
        ],
      },
      {
        key: "6-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "قراءة السعة",
        printedHead: "الدرس ٩: قراءة السعة",
        bookFrom: 104,
        concepts: [
          concept(104, LESSON, "الدرس ٩: قراءة السعة"),
          concept(104, CONNECT, "اربط"),
          concept(105, APPLY, "التطبيق"),
          concept(107, REFLECT, "تأمل"),
        ],
      },
    ],
  },
];

/**
 * The book-page span a lesson owns: from the chapter opener (its first lesson)
 * or its own head page, down to the page before the next lesson starts, bounded
 * by the chapter. A band that recurs on the following page belongs to this
 * lesson, so the ranges tile [2, 107] exactly and no reachable content sits
 * outside a lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_MATH_G3_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_G3_T1_UNITS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This term has no
 * appendix: every page of the term belongs to a chapter. Kept as a function so
 * the seeder and the stage share one shape across all the books.
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
  "math-g3-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (Only scan 4 — a blank verso outside the term — needs it, but the
 * guard is kept so the loader shares one shape across the books.)
 */
const NO_TEXT = /لا يوجد نص/;

/** OCR text of one printed book page, or "" when the page was not OCR’d. */
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
  return `### Page ${book}\n${text}`;
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
 * The document a lesson grounds the tutor in: its own page range, in order,
 * followed by any appendix pages it points to (none in this book).
 */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(sectionIndex, lessonIndex);
  const lesson = EGYPT_MATH_G3_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(from, to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/** Arabic-Indic and Extended Arabic-Indic digits → Latin, so a folio can be read. */
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EXT_AR_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Arabic-Indic and Extended Arabic-Indic digits → Latin, so a folio can be read. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

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
 * Page-number candidates a content page prints. This book’s folio lives on
 * the footer line carrying «الصف الثالث الابتدائي» (the number stands before or
 * after the words, in Arabic-Indic digits) — the last such line is read, since
 * body text can mention the grade too («تلاميذ الصف الثالث الابتدائي», book
 * 6), and only when it carries no digits does a bare numeral in the last three
 * lines count (split footers, e.g. books 33–34). Reading the footer line first
 * keeps body numbers (shape labels on book 44, exercise answers on book 73,
 * gauge marks on book 104) from ever being mistaken for a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const footerLine = [...lines].reverse().find((l) => l.includes("الصف الثالث"));
  if (footerLine) {
    const latin = toLatinDigits(footerLine)
      .replace(/[^0-9]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const out = new Set<number>();
    for (const tok of latin.split(" ")) {
      if (!tok) continue;
      const n = Number(tok);
      if (n > 0) out.add(n);
    }
    if (out.size > 0) return [...out].sort((a, b) => a - b);
  }
  const tail = lines.slice(-3);
  const out = new Set<number>();
  for (const line of tail) {
    if (/^[0-9٠-٩۰-۹]+$/.test(line)) {
      const n = Number(toLatinDigits(line).replace(/\D/g, ""));
      if (n > 0) out.add(n);
    }
  }
  return [...out].sort((a, b) => a - b);
}

/**
 * The book number a content page prints in its footer, or null. Every content
 * page that carries a folio prints exactly one number there and it is its own,
 * which is what fixes the offset; the pages named in `FOLIO_LESS_ANCHORS` print
 * no parseable number and are handled by their anchor instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The content pages whose printed footer the OCR misread, and the value it
 * printed instead — measured, not guessed. Book 95 prints «٩٥» but the text
 * layer kept only the Latin «90» on its own line under a digit-less footer;
 * book 96 prints «٩٦» but the text layer kept «97». Every other parseable
 * footer matches its page number exactly, which is what fixes the offset.
 * Listing the exceptions keeps the check strict instead of statistical.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {
  95: 90,
  96: 97,
};

/**
 * The term pages that print no parseable folio in the OCR, each with the anchor
 * the check accepts in place of a page number. Every anchor is a string the page
 * itself prints: book 5 (folio read as the Latin «0») and book 29 (no footer at
 * all) print their own lesson heads; book 17 (folio read as the Latin «IV»)
 * prints its lesson head; book 55 (folio read as «00») prints its rectangle
 * labels; book 70 (folio read as the Latin «V.») prints its measuring
 * exercise; book 71 (folio read as the Latin «VI») prints its continuation
 * band; and book 97 (no footer at all) prints its own lesson head.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  5: "الدرس ٣: التمثيل البياني بالنقاط",
  17: "الدرس ٤: صيغ مختلفة لكتابة الأعداد",
  29: "الدرس ٣: مضاعفات العددين ٢، ٣",
  55: "المستطيل 3:",
  70: "قم بقياس أضلاع هذا الشكل",
  71: "تابع التطبيق",
  97: "الدرس ٦ : استراتيجيات الطرح",
};

/** Every head kind the table may use: the lesson-head kind plus the band kinds. */
const KNOWN_KINDS = new Set([
  "الدرس",
  "اربط",
  "التطبيق",
  "التحدي",
  "تأمل",
  "المفتاح",
  "تدريب",
  "تدريب جماعي",
  "تدريب ثنائي",
]);

/**
 * Table invariants: lesson keys are unique and follow (chapter-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book’s own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_G3_T1_UNITS;
  const keys = new Set<string>();

  units.forEach((unit, ui) => {
    if (!unit.title.trim()) problems.push(`القسم ${unit.key}: بلا عنوان`);
    if (!unit.printedHead.trim()) problems.push(`القسم ${unit.key}: بلا عنوان مطبوع`);
    if (unit.lessons.length === 0) problems.push(`القسم ${unit.title}: بلا دروس`);

    unit.lessons.forEach((lesson, li) => {
      if (keys.has(lesson.key)) problems.push(`مفتاح درس مكرر: "${lesson.key}"`);
      keys.add(lesson.key);
      const expectedKey = `${unit.key}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`القسم ${unit.key} الدرس ${li + 1}: المفتاح "${lesson.key}" بدل "${expectedKey}"`);
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
  const lastUnit = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_MATH_G3_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_MATH_G3_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (lastUnit && lastUnit.bookTo !== EGYPT_MATH_G3_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_MATH_G3_T1_BOOK_END}، وجدنا ${lastUnit.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR’d term page carries real text and proves its book number — from
 *     its printed folio (allowing the measured OCR misread), or, on the pages
 *     that print no parseable folio, from the anchor named in
 *     `FOLIO_LESS_ANCHORS`;
 *  2. every section opener prints the section head and every lesson’s first page
 *     prints that lesson’s head;
 *  3. every lesson’s title and every concept’s head is printed on the pages the
 *     lesson owns (the concept on its own page);
 *  4. every printed page in [2, 107] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR’d
 *     page of the term.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_MATH_G3_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_G3_T1_BOOK_START || book > EGYPT_MATH_G3_T1_BOOK_END) continue;
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

  const expectedPages =
    EGYPT_MATH_G3_T1_BOOK_END - EGYPT_MATH_G3_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: قرأنا ${printedPages.size} صفحات بين ${EGYPT_MATH_G3_T1_BOOK_START} و${EGYPT_MATH_G3_T1_BOOK_END}، والمتوقع ${expectedPages}`,
    );
  }

  // 2. every section opener prints the section head and every lesson's first page
  //    prints that lesson's head.
  units.forEach((unit, ui) => {
    if (loadBookPage(unit.bookFrom) && !pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`القسم ${unit.key}: صفحته الأولى ${unit.bookFrom} لا تطبع «${unit.printedHead}»`);
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

  // 3. every concept's printed head is on its own page.
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
  for (let p = EGYPT_MATH_G3_T1_BOOK_START; p <= EGYPT_MATH_G3_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
