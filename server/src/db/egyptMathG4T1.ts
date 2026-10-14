// Primary 4 (الصف الرابع الابتدائي) Mathematics (الرياضيات), first term,
// Ministry of Education and Technical Education / Discovery Techbook edition
// (cover imprint «2025 - 2026», 136 scanned pages).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g4-math`, subject `math` (name "Mathematics"), lesson prefix
// `l-g4-math-`, grade `grade-4` (name "Primary 4").
//
// The curriculum tree for the Egypt `eg-g4-math` curriculum is rebuilt from
// the Ministry textbook `الرياضيات — الصف الرابع الابتدائي — الفصل الدراسي
// الأول`. This module is the single source of truth for its structure: the
// eight printed وحدات of the first term, every numbered درس inside them (50
// in all), and, for every lesson, the book's own printed heads — the lesson
// head plus the lesson-flow bands every lesson prints (أهداف التعلم / هدف
// التعلم, استكشف, تعلم, فكر, تحقق من فهمك, and, in four lessons, نشاط عملي)
// — verbatim and with the printed page they start on. The self-checks at the
// bottom prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS EIGHT — book page = scan page − 8
// Every content page prints its own folio, so `BOOK_TO_PDF_OFFSET` is fixed
// by the scans and quoted here: scan 11 prints «الدرس الأول - الأعداد
// الكبيرة | 3» (book 3), scan 13 prints «الدرس الثاني - تغيير القيم المكانية
// | 5» (book 5), scan 111 prints «الدرس الثاني: خاصية التوزيع | 103» (book
// 103) and scan 135 prints «الدرس الثاني: ترتيب العمليات والمسائل الكلامية |
// 127» (book 127, the term's last page). The book's own «المحتويات» (scans
// 4–6) independently confirms the skeleton: it lists the same fifty lessons
// at exactly the pages their heads print on (unlike the French-medium twin,
// whose contents trails the heads by two pages in units 1–4).
//
// TERM = THE NUMBERED PAGES (books 3–127)
// Scan pages 1–10 are before the term: the cover (1), a blank verso (2,
// folio «ii»), the Discovery copyright page (3, folio «iii»), the printed
// «المحتويات» (4–6, folios «iv»–«vi»; the «v» on scan 5 reads as «7»), the
// preface «مقدمة الكتاب المدرسي» (7, folio «vii»), the «ولي الأمر/المعلم»
// letter (8–9, folios «viii»–«ix», which also states the lesson flow:
// استكشف / تعلم / فكر) and the Unit-1 video page (10). The term runs from
// the lesson 1-1 opener (book 3 = scan 11) to the last page of lesson 8-2
// (book 127 = scan 135): `EGYPT_MATH_G4_T1_BOOK_START` / `_BOOK_END` are
// exactly those two pages, and the tiling assertion proves nothing in
// between is left unreachable. `pagesChecked` is therefore 127 − 3 + 1 = 125
// (no scan of the term is missing). Scan page 136 is after the term (the
// technical-specs / EGYPT VISION page).
//
// FIVE TERM PAGES PRINT NO PARSEABLE FOLIO — EACH HAS A NAMED ANCHOR
// Books 23, 39, 58 and 70 are the video openers of units 2–5; none prints a
// page number (the numerals they carry are the quick codes 2004050, 2004027,
// 2004083 and 2004061). Book 42, the second page of lesson 3-1, lost its
// folio and its closing box to a truncated OCR capture (the text ends mid-
// activity with «…»). Rather than weaken the page-number check, all five are
// exempt from it and anchored on a string the page itself prints, named in
// `FOLIO_LESS_ANCHORS` (the four video titles plus «بيت النمل»). The unit 6,
// 7 and 8 openers DO print folios (bare «85» on book 85, «الوحدة السابعة:
// … | 99» on book 99, «الوحدة الثامنة: ترتيب العمليات | 123» on book 123),
// so they need no anchor. Every other term page proves its number from the
// last line alone — the folio is always the last non-empty line — so
// `FOOTER_OCR_MISREADS` is empty.
//
// THE FOLIO IS ALWAYS THE LAST LINE
// Odd pages print «الدرس <ordinal> [-:] <title> | N» (books 7 and 33 print
// the number with no pipe: «… الأعداد 7», «… والمسائل الكلامية 33»); even
// pages print a bare «N», sometimes with a stray pipe («24 |», «| 30»).
// Exercise answers and table counts on earlier lines (e.g. «516» on book 29,
// «4 | 897» on book 117) can therefore never be mistaken for a folio:
// `footerCandidates` reads the last line only, which keeps the check exact
// instead of statistical.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED BANDS
// Every lesson contributes its «الدرس <ordinal>» head plus, in page order,
// «أهداف التعلم» (plural) or «هدف التعلم» (singular, in lessons 1-3, 1-4,
// 1-5, 2-1, 2-3, 4-3, 5-3, 5-7, 6-5, 7-3, 7-7, 7-8, 7-9 and 8-1),
// «استكشف», «تعلم» (printed «تعلّم» on books 28, 30, 64, 71, 74, 94, 96 and
// 115 and «تعلَّم» on books 51, 62, 67 and 84, kept verbatim), «نشاط عملي»
// with its activity title (lessons 1-1, 4-4, 5-1 and 5-4 only), «فكر»
// (printed «فَكِّر» on books 6, 49 and 118 and «فكّر» on books 74, 94, 96
// and 115, kept verbatim) and «تحقق من فهمك». The «الكتابة عن الرياضيات»
// writing prompts inside the فكر sections are activity text, like the French
// twin's game and revision boxes, and contribute no concept. Nothing is
// invented: every concept title below is a string the book itself prints on
// the page its `bookFrom` names.
//
// TWO LESSONS PRINT NO PROVABLE تحقق HEAD
// Lesson 3-1's closer (book 42) is the truncated capture named above, and
// lesson 7-5's closer (book 110) prints the تحقق body line («اتبع إرشادات
// المعلم لإكمال هذا النشاط.») without its «تحقق من فهمك» head. Neither page
// proves a تحقق band, so both lessons carry five concepts instead of six —
// exactly what the OCR shows, matching the French twin everywhere else.
//
// THE UNIT OPENER RIDES WITH THE FIRST LESSON
// Each unit's first lesson starts at the unit's own opener page (which
// prints «الوحدة N» and the video), so `lessonBookRange` starts a unit's
// first lesson at the section head, exactly as the other Egyptian
// Mathematics specs do. (Unit 1's opener is scan 10, i.e. front matter, so
// lesson 1-1 starts at its own head page.) The book prints no appendix:
// every page of the term belongs to exactly one lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 8 (verified: book p.127 = scan p.135). */
export const BOOK_TO_PDF_OFFSET = 8;

/** First printed page of the term — the lesson 1-1 opener (scan 11). */
export const EGYPT_MATH_G4_T1_BOOK_START = 3;

/** Last printed page of the term — the last page of lesson 8-2 (scan 135). */
export const EGYPT_MATH_G4_T1_BOOK_END = 127;

/** The scanned pages before the term: cover, blank verso, copyright, contents, preface, parent letter, Unit-1 video. */
export const EGYPT_MATH_G4_T1_FRONT_MATTER = { from: 1, to: 10 } as const;

/** The scans after the term: the technical-specs / EGYPT VISION page (scan 136). */
export const EGYPT_MATH_G4_T1_BACK_MATTER = { from: 136, to: 136 } as const;

/**
 * The term pages the OCR never produced, as scan pages. All 136 scans are
 * present and every one of the 125 term pages carries text, so there are
 * none; the constant is kept so this module shares the shape of the other
 * Egyptian specs (and so the checker's expected page count subtracts it).
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of a lesson — becomes one concept in the app tree. */
export interface MathG4T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: "الدرس" or one of the lesson-flow band words. */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one numbered درس of a unit). */
export interface MathG4T1Lesson {
  /** App-addressable key, e.g. "5-3" (unit 5, lesson 3). */
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
  concepts: MathG4T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a unit — so no lesson below uses it; the
   * field is kept so this module shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed unit of the term (one of the eight وحدات). */
export interface MathG4T1Unit {
  /** This book’s units are its وحدات. */
  kind: "unit";
  /** Internal key: "1"…"8", in book order. */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الثالثة". */
  ordinal: string;
  /** Full app-facing unit title, e.g. "الوحدة الثالثة: مفاهيم القياس". */
  title: string;
  /** The unit head its opener prints, verbatim, e.g. "الوحدة الثالثة". */
  printedHead: string;
  /** First printed page of the unit (its opener). */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next opener). */
  bookTo: number;
  lessons: MathG4T1Lesson[];
}

const DARS = "الدرس";
const AHDAF = "أهداف التعلم";
const ISTIKSHAF = "استكشف";
const TAALLUM = "تعلم";
const NASHAT = "نشاط عملي";
const FIKR = "فكر";
const TAHAQQUQ = "تحقق من فهمك";

const T_AHDAF = "أهداف التعلم";
const T_AHDAF_S = "هدف التعلم";
const T_ISTIKSHAF = "استكشف";
const T_TAALLUM = "تعلم";
const T_TAALLUM_D1 = "تعلّم";
const T_TAALLUM_D2 = "تعلَّم";
const T_FIKR = "فكر";
const T_FIKR_D1 = "فَكِّر";
const T_FIKR_D2 = "فكّر";
const T_TAHAQQUQ = "تحقق من فهمك";

function concept(bookFrom: number, kind: string, title: string): MathG4T1Concept {
  return { bookFrom, kind, title };
}

function dars(bookFrom: number, title: string): MathG4T1Concept {
  return concept(bookFrom, DARS, title);
}

function ahdaf(bookFrom: number, title: string = T_AHDAF): MathG4T1Concept {
  return concept(bookFrom, AHDAF, title);
}

function istikshaf(bookFrom: number): MathG4T1Concept {
  return concept(bookFrom, ISTIKSHAF, T_ISTIKSHAF);
}

function taallum(bookFrom: number, title: string = T_TAALLUM): MathG4T1Concept {
  return concept(bookFrom, TAALLUM, title);
}

function nashat(bookFrom: number, title: string): MathG4T1Concept {
  return concept(bookFrom, NASHAT, title);
}

function fikr(bookFrom: number, title: string = T_FIKR): MathG4T1Concept {
  return concept(bookFrom, FIKR, title);
}

function tahaqquq(bookFrom: number): MathG4T1Concept {
  return concept(bookFrom, TAHAQQUQ, T_TAHAQQUQ);
}

/**
 * The eight units of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Lesson starts come from the «الدرس <ordinal>» openers and match the
 * contents (scans 4–6) exactly; the bookTo of each unit is the page before
 * the next unit's video opener.
 */
export const EGYPT_MATH_G4_T1_UNITS: MathG4T1Unit[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: القيمة المكانية",
    printedHead: "الوحدة الأولى",
    bookFrom: 3,
    bookTo: 22,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: DARS,
        title: "الأعداد الكبيرة",
        printedHead: "الدرس الأول: الأعداد الكبيرة",
        bookFrom: 3,
        concepts: [
          dars(3, "الدرس الأول: الأعداد الكبيرة"),
          ahdaf(3),
          istikshaf(3),
          taallum(3),
          nashat(4, "نشاط عملي: تكوين الأعداد الكبيرة"),
          fikr(4),
          tahaqquq(4),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: DARS,
        title: "تغيير القيم المكانية",
        printedHead: "الدرس الثاني: تغيير القيم المكانية",
        bookFrom: 5,
        concepts: [
          dars(5, "الدرس الثاني: تغيير القيم المكانية"),
          ahdaf(5),
          istikshaf(5),
          taallum(5),
          fikr(6, T_FIKR_D1),
          tahaqquq(6),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: DARS,
        title: "صيغ متنوعة لكتابة الأعداد",
        printedHead: "الدرس الثالث: صيغ متنوعة لكتابة الأعداد",
        bookFrom: 7,
        concepts: [
          dars(7, "الدرس الثالث: صيغ متنوعة لكتابة الأعداد"),
          ahdaf(7, T_AHDAF_S),
          istikshaf(7),
          taallum(7),
          fikr(8),
          tahaqquq(8),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: DARS,
        title: "تكوين الأعداد وتحليلها",
        printedHead: "الدرس الرابع: تكوين الأعداد وتحليلها",
        bookFrom: 9,
        concepts: [
          dars(9, "الدرس الرابع: تكوين الأعداد وتحليلها"),
          ahdaf(9, T_AHDAF_S),
          istikshaf(9),
          taallum(9),
          fikr(11),
          tahaqquq(11),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: DARS,
        title: "مقارنة الأعداد الكبيرة",
        printedHead: "الدرس الخامس: مقارنة الأعداد الكبيرة",
        bookFrom: 12,
        concepts: [
          dars(12, "الدرس الخامس: مقارنة الأعداد الكبيرة"),
          ahdaf(12, T_AHDAF_S),
          istikshaf(12),
          taallum(12),
          fikr(13),
          tahaqquq(13),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: DARS,
        title: "مقارنة الأعداد في صيغ مختلفة",
        printedHead: "الدرس السادس: مقارنة الأعداد في صيغ مختلفة",
        bookFrom: 14,
        concepts: [
          dars(14, "الدرس السادس: مقارنة الأعداد في صيغ مختلفة"),
          ahdaf(14),
          istikshaf(14),
          taallum(14),
          fikr(16),
          tahaqquq(16),
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        type: DARS,
        title: "ترتيب الأعداد تنازليًا وتصاعديًا",
        printedHead: "الدرس السابع: ترتيب الأعداد تنازليًا وتصاعديًا",
        bookFrom: 17,
        concepts: [
          dars(17, "الدرس السابع: ترتيب الأعداد تنازليًا وتصاعديًا"),
          ahdaf(17),
          istikshaf(17),
          taallum(17),
          fikr(19),
          tahaqquq(19),
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        type: DARS,
        title: "قواعد التقريب",
        printedHead: "الدرس الثامن: قواعد التقريب",
        bookFrom: 20,
        concepts: [
          dars(20, "الدرس الثامن: قواعد التقريب"),
          ahdaf(20),
          istikshaf(20),
          taallum(20),
          fikr(22),
          tahaqquq(22),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: إستراتيجيات عمليتي الجمع والطرح",
    printedHead: "الوحدة الثانية",
    bookFrom: 23,
    bookTo: 38,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: DARS,
        title: "خواص عملية الجمع",
        printedHead: "الدرس الأول: خواص عملية الجمع",
        bookFrom: 24,
        concepts: [
          dars(24, "الدرس الأول: خواص عملية الجمع"),
          ahdaf(24, T_AHDAF_S),
          istikshaf(24),
          taallum(24),
          fikr(26),
          tahaqquq(26),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: DARS,
        title: "الجمع مع إعادة التسمية",
        printedHead: "الدرس الثاني: الجمع مع إعادة التسمية",
        bookFrom: 27,
        concepts: [
          dars(27, "الدرس الثاني: الجمع مع إعادة التسمية"),
          ahdaf(27),
          istikshaf(27),
          taallum(28, T_TAALLUM_D1),
          fikr(28),
          tahaqquq(28),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: DARS,
        title: "الطرح مع إعادة التسمية",
        printedHead: "الدرس الثالث: الطرح مع إعادة التسمية",
        bookFrom: 29,
        concepts: [
          dars(29, "الدرس الثالث: الطرح مع إعادة التسمية"),
          ahdaf(29, T_AHDAF_S),
          istikshaf(29),
          taallum(30, T_TAALLUM_D1),
          fikr(31),
          tahaqquq(31),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: DARS,
        title: "النماذج الشريطية والمتغيرات والمسائل الكلامية",
        printedHead: "الدرس الرابع: النماذج الشريطية والمتغيرات والمسائل الكلامية",
        bookFrom: 32,
        concepts: [
          dars(32, "الدرس الرابع: النماذج الشريطية والمتغيرات والمسائل الكلامية"),
          ahdaf(32),
          istikshaf(32),
          taallum(32),
          fikr(34),
          tahaqquq(34),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: DARS,
        title: "حل مسائل كلامية متعددة الخطوات باستخدام الجمع والطرح",
        printedHead: "الدرس الخامس: حل مسائل كلامية متعددة الخطوات باستخدام الجمع والطرح",
        bookFrom: 35,
        concepts: [
          dars(35, "الدرس الخامس: حل مسائل كلامية متعددة الخطوات باستخدام الجمع والطرح"),
          ahdaf(35),
          istikshaf(35),
          taallum(35),
          fikr(38),
          tahaqquq(38),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: مفاهيم القياس",
    printedHead: "الوحدة الثالثة",
    bookFrom: 39,
    bookTo: 57,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: DARS,
        title: "قياس الطول",
        printedHead: "الدرس الأول: قياس الطول",
        bookFrom: 40,
        concepts: [
          dars(40, "الدرس الأول: قياس الطول"),
          ahdaf(40),
          istikshaf(40),
          taallum(40),
          fikr(42),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: DARS,
        title: "قياس الكتلة",
        printedHead: "الدرس الثاني: قياس الكتلة",
        bookFrom: 43,
        concepts: [
          dars(43, "الدرس الثاني: قياس الكتلة"),
          ahdaf(43),
          istikshaf(43),
          taallum(43),
          fikr(44),
          tahaqquq(44),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: DARS,
        title: "وحدات قياس السعة",
        printedHead: "الدرس الثالث: وحدات قياس السعة",
        bookFrom: 45,
        concepts: [
          dars(45, "الدرس الثالث: وحدات قياس السعة"),
          ahdaf(45),
          istikshaf(45),
          taallum(45),
          fikr(47),
          tahaqquq(47),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: DARS,
        title: "وحدات قياس الوقت",
        printedHead: "الدرس الرابع: وحدات قياس الوقت",
        bookFrom: 48,
        concepts: [
          dars(48, "الدرس الرابع: وحدات قياس الوقت"),
          ahdaf(48),
          istikshaf(48),
          taallum(48),
          fikr(49, T_FIKR_D1),
          tahaqquq(49),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: DARS,
        title: "الوقت المنقضي",
        printedHead: "الدرس الخامس: الوقت المنقضي",
        bookFrom: 50,
        concepts: [
          dars(50, "الدرس الخامس: الوقت المنقضي"),
          ahdaf(50),
          istikshaf(50),
          taallum(51, T_TAALLUM_D2),
          fikr(52),
          tahaqquq(52),
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: DARS,
        title: "تطبيقات القياس 1",
        printedHead: "الدرس السادس: تطبيقات القياس 1",
        bookFrom: 53,
        concepts: [
          dars(53, "الدرس السادس: تطبيقات القياس 1"),
          ahdaf(53),
          istikshaf(53),
          taallum(53),
          fikr(55),
          tahaqquq(55),
        ],
      },
      {
        key: "3-7",
        ordinal: "السابع",
        type: DARS,
        title: "تطبيقات القياس 2",
        printedHead: "الدرس السابع: تطبيقات القياس 2",
        bookFrom: 56,
        concepts: [
          dars(56, "الدرس السابع: تطبيقات القياس 2"),
          ahdaf(56),
          istikshaf(56),
          taallum(56),
          fikr(57),
          tahaqquq(57),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "الرابعة",
    title: "الوحدة الرابعة: المساحة والمحيط",
    printedHead: "الوحدة الرابعة",
    bookFrom: 58,
    bookTo: 69,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: DARS,
        title: "إيجاد المحيط",
        printedHead: "الدرس الأول: إيجاد المحيط",
        bookFrom: 59,
        concepts: [
          dars(59, "الدرس الأول: إيجاد المحيط"),
          ahdaf(59),
          istikshaf(59),
          taallum(59),
          fikr(61),
          tahaqquq(61),
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: DARS,
        title: "إيجاد المساحة",
        printedHead: "الدرس الثاني: إيجاد المساحة",
        bookFrom: 62,
        concepts: [
          dars(62, "الدرس الثاني: إيجاد المساحة"),
          ahdaf(62),
          istikshaf(62),
          taallum(62, T_TAALLUM_D2),
          fikr(63),
          tahaqquq(63),
        ],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: DARS,
        title: "أبعاد مجهولة",
        printedHead: "الدرس الثالث: أبعاد مجهولة",
        bookFrom: 64,
        concepts: [
          dars(64, "الدرس الثالث: أبعاد مجهولة"),
          ahdaf(64, T_AHDAF_S),
          istikshaf(64),
          taallum(64, T_TAALLUM_D1),
          fikr(65),
          tahaqquq(65),
        ],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        type: DARS,
        title: "الأشكال الهندسية المركبة",
        printedHead: "الدرس الرابع: الأشكال الهندسية المركبة",
        bookFrom: 66,
        concepts: [
          dars(66, "الدرس الرابع: الأشكال الهندسية المركبة"),
          ahdaf(66),
          istikshaf(66),
          nashat(66, "نشاط عملي: أشكال جديدة ومختلفة"),
          taallum(67, T_TAALLUM_D2),
          fikr(69),
          tahaqquq(69),
        ],
      },
    ],
  },
  {
    key: "5",
    kind: "unit",
    ordinal: "الخامسة",
    title: "الوحدة الخامسة: عملية الضرب كعلاقة",
    printedHead: "الوحدة الخامسة",
    bookFrom: 70,
    bookTo: 84,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: DARS,
        title: "مقارنة الأعداد باستخدام عملية الضرب",
        printedHead: "الدرس الأول: مقارنة الأعداد باستخدام عملية الضرب",
        bookFrom: 71,
        concepts: [
          dars(71, "الدرس الأول: مقارنة الأعداد باستخدام عملية الضرب"),
          ahdaf(71),
          istikshaf(71),
          taallum(71, T_TAALLUM_D1),
          nashat(71, "نشاط عملي: نمذجة المقارنة باستخدام عملية الضرب"),
          fikr(72),
          tahaqquq(72),
        ],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: DARS,
        title: "تكوين معادلات للمقارنة باستخدام عملية الضرب",
        printedHead: "الدرس الثاني: تكوين معادلات للمقارنة باستخدام عملية الضرب",
        bookFrom: 73,
        concepts: [
          dars(73, "الدرس الثاني: تكوين معادلات للمقارنة باستخدام عملية الضرب"),
          ahdaf(73),
          istikshaf(73),
          taallum(74, T_TAALLUM_D1),
          fikr(74, T_FIKR_D2),
          tahaqquq(74),
        ],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: DARS,
        title: "حل معادلات للمقارنة باستخدام عملية الضرب",
        printedHead: "الدرس الثالث: حل معادلات للمقارنة باستخدام عملية الضرب",
        bookFrom: 75,
        concepts: [
          dars(75, "الدرس الثالث: حل معادلات للمقارنة باستخدام عملية الضرب"),
          ahdaf(75, T_AHDAF_S),
          istikshaf(75),
          taallum(75),
          fikr(76),
          tahaqquq(76),
        ],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: DARS,
        title: "خاصية الإبدال في عملية الضرب",
        printedHead: "الدرس الرابع: خاصية الإبدال في عملية الضرب",
        bookFrom: 77,
        concepts: [
          dars(77, "الدرس الرابع: خاصية الإبدال في عملية الضرب"),
          ahdaf(77),
          istikshaf(77),
          taallum(77),
          nashat(77, "نشاط عملي: المصفوفات وخاصية الإبدال"),
          fikr(78),
          tahaqquq(78),
        ],
      },
      {
        key: "5-5",
        ordinal: "الخامس",
        type: DARS,
        title: "خاصية العنصر المحايد والضرب في صفر",
        printedHead: "الدرس الخامس: خاصية العنصر المحايد والضرب في صفر",
        bookFrom: 79,
        concepts: [
          dars(79, "الدرس الخامس: خاصية العنصر المحايد والضرب في صفر"),
          ahdaf(79),
          istikshaf(79),
          taallum(79),
          fikr(80),
          tahaqquq(80),
        ],
      },
      {
        key: "5-6",
        ordinal: "السادس",
        type: DARS,
        title: "خاصية الدمج في عملية الضرب",
        printedHead: "الدرس السادس: خاصية الدمج في عملية الضرب",
        bookFrom: 81,
        concepts: [
          dars(81, "الدرس السادس: خاصية الدمج في عملية الضرب"),
          ahdaf(81),
          istikshaf(81),
          taallum(81),
          fikr(82),
          tahaqquq(82),
        ],
      },
      {
        key: "5-7",
        ordinal: "السابع",
        type: DARS,
        title: "تطبيق الأنماط في عملية الضرب",
        printedHead: "الدرس السابع: تطبيق الأنماط في عملية الضرب",
        bookFrom: 83,
        concepts: [
          dars(83, "الدرس السابع: تطبيق الأنماط في عملية الضرب"),
          ahdaf(83, T_AHDAF_S),
          istikshaf(83),
          taallum(84, T_TAALLUM_D2),
          fikr(84),
          tahaqquq(84),
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "unit",
    ordinal: "السادسة",
    title: "الوحدة السادسة: العوامل والمضاعفات",
    printedHead: "الوحدة السادسة",
    bookFrom: 85,
    bookTo: 98,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: DARS,
        title: "تحديد عوامل الأعداد الصحيحة",
        printedHead: "الدرس الأول: تحديد عوامل الأعداد الصحيحة",
        bookFrom: 86,
        concepts: [
          dars(86, "الدرس الأول: تحديد عوامل الأعداد الصحيحة"),
          ahdaf(86),
          istikshaf(86),
          taallum(86),
          fikr(87),
          tahaqquq(87),
        ],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: DARS,
        title: "الأعداد الأولية والأعداد متعددة العوامل",
        printedHead: "الدرس الثاني: الأعداد الأولية والأعداد متعددة العوامل",
        bookFrom: 88,
        concepts: [
          dars(88, "الدرس الثاني: الأعداد الأولية والأعداد متعددة العوامل"),
          ahdaf(88),
          istikshaf(88),
          taallum(88),
          fikr(90),
          tahaqquq(90),
        ],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: DARS,
        title: "العامل المشترك الأكبر (ع.م.أ)",
        printedHead: "الدرس الثالث: العامل المشترك الأكبر (ع.م.أ)",
        bookFrom: 91,
        concepts: [
          dars(91, "الدرس الثالث: العامل المشترك الأكبر (ع.م.أ)"),
          ahdaf(91),
          istikshaf(91),
          taallum(91),
          fikr(92),
          tahaqquq(92),
        ],
      },
      {
        key: "6-4",
        ordinal: "الرابع",
        type: DARS,
        title: "تحديد مضاعفات الأعداد الصحيحة",
        printedHead: "الدرس الرابع: تحديد مضاعفات الأعداد الصحيحة",
        bookFrom: 93,
        concepts: [
          dars(93, "الدرس الرابع: تحديد مضاعفات الأعداد الصحيحة"),
          ahdaf(93),
          istikshaf(93),
          taallum(94, T_TAALLUM_D1),
          fikr(94, T_FIKR_D2),
          tahaqquq(94),
        ],
      },
      {
        key: "6-5",
        ordinal: "الخامس",
        type: DARS,
        title: "المضاعفات المشتركة",
        printedHead: "الدرس الخامس: المضاعفات المشتركة",
        bookFrom: 95,
        concepts: [
          dars(95, "الدرس الخامس: المضاعفات المشتركة"),
          ahdaf(95, T_AHDAF_S),
          istikshaf(95),
          taallum(96, T_TAALLUM_D1),
          fikr(96, T_FIKR_D2),
          tahaqquq(96),
        ],
      },
      {
        key: "6-6",
        ordinal: "السادس",
        type: DARS,
        title: "العلاقات بين العوامل والمضاعفات",
        printedHead: "الدرس السادس: العلاقات بين العوامل والمضاعفات",
        bookFrom: 97,
        concepts: [
          dars(97, "الدرس السادس: العلاقات بين العوامل والمضاعفات"),
          ahdaf(97),
          istikshaf(97),
          taallum(97),
          fikr(98),
          tahaqquq(98),
        ],
      },
    ],
  },
  {
    key: "7",
    kind: "unit",
    ordinal: "السابعة",
    title: "الوحدة السابعة: عمليتا الضرب والقسمة: الحساب والعلاقات",
    printedHead: "الوحدة السابعة",
    bookFrom: 99,
    bookTo: 122,
    lessons: [
      {
        key: "7-1",
        ordinal: "الأول",
        type: DARS,
        title: "إستراتيجية نموذج مساحة المستطيل",
        printedHead: "الدرس الأول: إستراتيجية نموذج مساحة المستطيل",
        bookFrom: 100,
        concepts: [
          dars(100, "الدرس الأول: إستراتيجية نموذج مساحة المستطيل"),
          ahdaf(100),
          istikshaf(100),
          taallum(100),
          fikr(101),
          tahaqquq(101),
        ],
      },
      {
        key: "7-2",
        ordinal: "الثاني",
        type: DARS,
        title: "خاصية التوزيع",
        printedHead: "الدرس الثاني: خاصية التوزيع",
        bookFrom: 102,
        concepts: [
          dars(102, "الدرس الثاني: خاصية التوزيع"),
          ahdaf(102),
          istikshaf(102),
          taallum(102),
          fikr(103),
          tahaqquq(103),
        ],
      },
      {
        key: "7-3",
        ordinal: "الثالث",
        type: DARS,
        title: "خوارزمية عملية الضرب بالتجزئة",
        printedHead: "الدرس الثالث: خوارزمية عملية الضرب بالتجزئة",
        bookFrom: 104,
        concepts: [
          dars(104, "الدرس الثالث: خوارزمية عملية الضرب بالتجزئة"),
          ahdaf(104, T_AHDAF_S),
          istikshaf(104),
          taallum(104),
          fikr(106),
          tahaqquq(106),
        ],
      },
      {
        key: "7-4",
        ordinal: "الرابع",
        type: DARS,
        title: "الضرب في عدد مكون من رقم واحد",
        printedHead: "الدرس الرابع: الضرب في عدد مكون من رقم واحد",
        bookFrom: 107,
        concepts: [
          dars(107, "الدرس الرابع: الضرب في عدد مكون من رقم واحد"),
          ahdaf(107),
          istikshaf(107),
          taallum(107),
          fikr(108),
          tahaqquq(108),
        ],
      },
      {
        key: "7-5",
        ordinal: "الخامس",
        type: DARS,
        title: "ضرب عدد مكون من رقمين في مضاعفات العدد 10",
        printedHead: "الدرس الخامس: ضرب عدد مكون من رقمين في مضاعفات العدد 10",
        bookFrom: 109,
        concepts: [
          dars(109, "الدرس الخامس: ضرب عدد مكون من رقمين في مضاعفات العدد 10"),
          ahdaf(109),
          istikshaf(109),
          taallum(109),
          fikr(110),
        ],
      },
      {
        key: "7-6",
        ordinal: "السادس",
        type: DARS,
        title: "استكشاف باقي القسمة",
        printedHead: "الدرس السادس: استكشاف باقي القسمة",
        bookFrom: 111,
        concepts: [
          dars(111, "الدرس السادس: استكشاف باقي القسمة"),
          ahdaf(111),
          istikshaf(111),
          taallum(111),
          fikr(112),
          tahaqquq(112),
        ],
      },
      {
        key: "7-7",
        ordinal: "السابع",
        type: DARS,
        title: "الأنماط في عملية القسمة",
        printedHead: "الدرس السابع: الأنماط في عملية القسمة",
        bookFrom: 113,
        concepts: [
          dars(113, "الدرس السابع: الأنماط في عملية القسمة"),
          ahdaf(113, T_AHDAF_S),
          istikshaf(113),
          taallum(115, T_TAALLUM_D1),
          fikr(115, T_FIKR_D2),
          tahaqquq(115),
        ],
      },
      {
        key: "7-8",
        ordinal: "الثامن",
        type: DARS,
        title: "القسمة باستخدام نموذج مساحة المستطيل",
        printedHead: "الدرس الثامن: القسمة باستخدام نموذج مساحة المستطيل",
        bookFrom: 116,
        concepts: [
          dars(116, "الدرس الثامن: القسمة باستخدام نموذج مساحة المستطيل"),
          ahdaf(116, T_AHDAF_S),
          istikshaf(116),
          taallum(116),
          fikr(116),
          tahaqquq(116),
        ],
      },
      {
        key: "7-9",
        ordinal: "التاسع",
        type: DARS,
        title: "خوارزمية خارج القسمة بالتجزئة",
        printedHead: "الدرس التاسع: خوارزمية خارج القسمة بالتجزئة",
        bookFrom: 117,
        concepts: [
          dars(117, "الدرس التاسع: خوارزمية خارج القسمة بالتجزئة"),
          ahdaf(117, T_AHDAF_S),
          istikshaf(117),
          taallum(117),
          fikr(118, T_FIKR_D1),
          tahaqquq(118),
        ],
      },
      {
        key: "7-10",
        ordinal: "العاشر",
        type: DARS,
        title: "خوارزمية القسمة المعيارية",
        printedHead: "الدرس العاشر: خوارزمية القسمة المعيارية",
        bookFrom: 119,
        concepts: [
          dars(119, "الدرس العاشر: خوارزمية القسمة المعيارية"),
          ahdaf(119),
          istikshaf(119),
          taallum(119),
          fikr(120),
          tahaqquq(120),
        ],
      },
      {
        key: "7-11",
        ordinal: "الحادي عشر",
        type: DARS,
        title: "القسمة والضرب",
        printedHead: "الدرس الحادي عشر: القسمة والضرب",
        bookFrom: 121,
        concepts: [
          dars(121, "الدرس الحادي عشر: القسمة والضرب"),
          ahdaf(121),
          istikshaf(121),
          taallum(121),
          fikr(122),
          tahaqquq(122),
        ],
      },
    ],
  },
  {
    key: "8",
    kind: "unit",
    ordinal: "الثامنة",
    title: "الوحدة الثامنة: ترتيب العمليات",
    printedHead: "الوحدة الثامنة",
    bookFrom: 123,
    bookTo: 127,
    lessons: [
      {
        key: "8-1",
        ordinal: "الأول",
        type: DARS,
        title: "ترتيب إجراء العمليات الحسابية",
        printedHead: "الدرس الأول: ترتيب إجراء العمليات الحسابية",
        bookFrom: 124,
        concepts: [
          dars(124, "الدرس الأول: ترتيب إجراء العمليات الحسابية"),
          ahdaf(124, T_AHDAF_S),
          istikshaf(124),
          taallum(124),
          fikr(125),
          tahaqquq(125),
        ],
      },
      {
        key: "8-2",
        ordinal: "الثاني",
        type: DARS,
        title: "ترتيب العمليات والمسائل الكلامية",
        printedHead: "الدرس الثاني: ترتيب العمليات والمسائل الكلامية",
        bookFrom: 126,
        concepts: [
          dars(126, "الدرس الثاني: ترتيب العمليات والمسائل الكلامية"),
          ahdaf(126),
          istikshaf(126),
          taallum(126),
          fikr(127),
          tahaqquq(127),
        ],
      },
    ],
  },
];

/**
 * The book-page span a lesson owns: from the unit opener (its first lesson)
 * or its own head page, down to the page before the next lesson starts,
 * bounded by the unit. The folio-less unit openers (books 23, 39, 58, 70)
 * and the folio-bearing ones (books 85, 99, 123) therefore ride with their
 * unit's first lesson, exactly as the other Egyptian Mathematics specs keep
 * openers inside the owning lesson's range.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_MATH_G4_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_G4_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This term has
 * no appendix: every page of the term belongs to a unit. Kept as a function
 * so the seeder and the stage share one shape across all the books.
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
  "math-g4-t1",
);

/** OCR text of one printed book page, or "" when the page was not OCR’d. */
export function loadBookPage(book: number): string {
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    return readFileSync(file, "utf8").trim();
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
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(unitIndex, lessonIndex);
  const lesson = EGYPT_MATH_G4_T1_UNITS[unitIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(from, to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/**
 * Folds text for comparison: drops tatweel and diacritics, unifies the
 * alef/ya/ta forms the book prints inconsistently, and removes every
 * non-letter/digit, so OCR spacing, vowel marks and line wraps can never
 * break a match (this is what lets «تعلّم»/«تعلَّم» match «تعلم» and wrapped
 * heads match their single-line transcription).
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
 * Page-number candidates a content page prints. The folio is always the last
 * non-empty line of the page: odd pages print «الدرس <ordinal> [-:] <title>
 * | N» (books 7 and 33 print the number with no pipe), even pages print a
 * bare «N» (sometimes with a stray pipe: «24 |», «| 30»), and the unit 6–8
 * openers print «85», «الوحدة السابعة: … | 99» and «الوحدة الثامنة: ترتيب
 * العمليات | 123». Only the last line is read, so exercise answers and
 * table counts on earlier lines (e.g. «516» on book 29, «4 | 897» on book
 * 117, the hundred-charts on books 86–95) can never be mistaken for a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const out: number[] = [];
  const push = (n: number): void => {
    if (Number.isInteger(n) && n > 0 && !out.includes(n)) out.push(n);
  };

  const last = lines[lines.length - 1]!;
  const bare = last.match(/^\|?\s*(\d+)\s*\|?$/);
  if (bare !== null) {
    push(Number(bare[1]));
    return out;
  }
  if (last.includes("درس") || (last.includes("الوحدة") && last.includes("|"))) {
    const tail = last.split("|").pop()!;
    const piped = tail.match(/(\d+)\s*$/);
    if (piped !== null) push(Number(piped[1]));
    else {
      const trailing = last.match(/(\d+)\s*$/);
      if (trailing !== null) push(Number(trailing[1]));
    }
  }
  return out;
}

/**
 * The book number a content page prints in its footer, or null. Every
 * content page carries a folio that is exactly its own number, which is what
 * fixes the offset; the pages named in `FOLIO_LESS_ANCHORS` carry no
 * parseable folio and are handled there instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * Folios whose OCR printed a different, still parseable number. This book
 * has none: every last-line folio the checker reads came out right, so the
 * map is empty and the folio check stays exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * Term pages that print no parseable folio in the text layer, each with the
 * anchor the check accepts in place of a page number: the four folio-less
 * unit video openers (books 23, 39, 58, 70), each anchored on its video
 * title, plus book 42, whose capture ends mid-activity with «…», anchored on
 * «بيت النمل», a string the page itself prints.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  23: "جمع أعداد النمل وطرحها",
  39: "تحويل القياسات",
  42: "بيت النمل",
  58: "تل النمل",
  70: "كيفية المقارنة باستخدام عملية الضرب",
};

/** Every band kind this book prints. */
const KNOWN_KINDS = new Set([DARS, AHDAF, ISTIKSHAF, TAALLUM, NASHAT, FIKR, TAHAQQUQ]);

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every
 * range sits inside its unit, concept kinds are known, concept pages rise
 * inside their lesson, the units tile the term without gaps or overlaps, and
 * the first/last units hit the book’s own bounds. A content mistake here
 * would quietly ground the tutor on the wrong pages, so it fails loudly
 * instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_G4_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_MATH_G4_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_MATH_G4_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (lastUnit && lastUnit.bookTo !== EGYPT_MATH_G4_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_MATH_G4_T1_BOOK_END}، وجدنا ${lastUnit.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR’d term page carries real text and proves its book number —
 *     from its printed folio (the last line), or, on the five pages that
 *     print no parseable folio, from the anchor named in
 *     `FOLIO_LESS_ANCHORS`;
 *  2. every unit opener prints the unit head and every lesson’s first page
 *     prints that lesson’s head;
 *  3. every lesson’s title and every band’s head is printed on the pages the
 *     lesson owns (the band on its own page);
 *  4. every printed page in [3, 127] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR’d
 *     page of the term.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_MATH_G4_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_G4_T1_BOOK_START || book > EGYPT_MATH_G4_T1_BOOK_END) continue;
    pagesChecked += 1;
    const text = loadBookPage(book);
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
    EGYPT_MATH_G4_T1_BOOK_END - EGYPT_MATH_G4_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: قرأنا ${printedPages.size} صفحات بين ${EGYPT_MATH_G4_T1_BOOK_START} و${EGYPT_MATH_G4_T1_BOOK_END}، والمتوقع ${expectedPages}`,
    );
  }

  // 2 + 3a. every unit opener prints the unit head, every lesson's first
  // page its head, and every lesson's title is printed somewhere in the
  // pages it owns.
  units.forEach((unit, ui) => {
    if (!pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`القسم ${unit.title}: صفحته الأولى ${unit.bookFrom} لا تطبع «${unit.printedHead}»`);
    }

    unit.lessons.forEach((lesson, li) => {
      if (!pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع «${lesson.printedHead}»`);
      }
      const { from, to } = lessonBookRange(ui, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      if (!titlePrinted) {
        problems.push(`الدرس ${lesson.key}: عنوانه «${lesson.title}» غير مطبوع في نطاقه ${from}–${to}`);
      }
    });
  });

  // 3b. every band's printed head is on its own page.
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
  for (let p = EGYPT_MATH_G4_T1_BOOK_START; p <= EGYPT_MATH_G4_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
