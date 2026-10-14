// Primary 5 (الصف الخامس الابتدائي) Mathematics (الرياضيات), first term,
// Ministry of Education and Technical Education 2025/2026 edition (the cover
// imprint prints «2025 - 2026» and the back cover the ISBN / CACD credits).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g5-math`, subject `math` (name "Mathematics"), lesson prefix
// `l-g5-math-`, grade `grade-5` (name "Primary 5").
//
// The curriculum tree for the Egypt `eg-g5-math` curriculum is rebuilt from
// the Ministry textbook `الرياضيات — الصف الخامس الابتدائي — الفصل الدراسي
// الأول` (142 scanned pages). This module is the single source of truth for
// its structure: the six printed وحدات of the first term, every numbered
// printed درس inside them (46 in all), and, for every lesson, the book's own
// printed heads — the درس head plus the three activity sections every lesson
// prints (استكشف / تعلم / فكر) — verbatim and with the printed page they
// start on. The self-checks at the bottom prove that mapping against the OCR
// itself, page by page.
//
// THE OFFSET IS ELEVEN — book page = scan page − 11
// Every content page that carries a folio prints it at the foot of the page,
// either in the lesson footer («الدرس …: … | N», one page prints it reversed
// as «N | الدرس …: …», book 92) or as a bare numeral on its own line («12»,
// «70 |», «| 16»), so `BOOK_TO_PDF_OFFSET` is fixed by the scans and quoted
// here: scan 14 prints «الدرس الأول: الكسور العشرية حتى جزء من الألف | 3»
// (book 3, the first lesson), scan 25 prints the bare «14» (book 14), scan 76
// prints «الدرس الأول: استخدام نموذج مساحة المستطيل في عملية الضرب | 65»
// (book 65, the unit-3 first lesson), scan 103 prints «92 | الدرس الأول:
// الضرب في قوى العدد 10» (book 92, the unit-5 first lesson) and scan 141
// prints the bare «130» (book 130, the term's last page). The book's own
// contents (scans 5–7) independently confirms the lesson starts of units 2–6:
// it lists «الدرس الأول: التعبيرات الرياضية والمعادلات والمتغيرات ... 44» …
// «الدرس الرابع: تحديد الأنماط العددية ... 127» — every head below sits
// exactly where the contents says it does. (The contents opening page, scan 4,
// survived in the OCR as dot leaders only, so the eleven unit-1 lessons are
// proven from their printed «الدرس n» openers instead — see below.)
//
// TERM = THE TYPED BOOK PAGES (books 2–130)
// Scan pages 1–12 are before the term: the covers (1–2), the copyright /
// print-specs page (3), the printed «المحتويات» (4–7, folios «iv»…«vi»), the
// «مقدمة الكتاب المدرسي» (8–9, folios «vii»…«viii») and the parent/teacher
// letters (10–12, folios «ix»…«xi»). Scan page 142 is after the term (the
// back cover with the ISBN and the CACD / Discovery credits): book 131 does
// not exist — the term runs from the unit-1 opener (book 2 = scan 13) to the
// unit-6 closing فكر page (book 130 = scan 141): `EGYPT_MATH_G5_T1_BOOK_START`
// / `_BOOK_END` are exactly those two pages, and the tiling assertion proves
// nothing in between is left unreachable. `pagesChecked` is therefore
// 130 − 2 + 1 = 129 (no scan of the term is missing).
//
// SIX TERM PAGES PRINT NO FOLIO — EACH IS A UNIT OPENER BY DESIGN
// Books 2, 43, 64, 80, 91 and 120 are the «الوحدة» openers of the six units;
// none prints a page number (each ends with the ministry line or a photo
// credit). Rather than weaken the page-number check, all six are exempt from
// it and anchored on the «ماذا اكتشف التلاميذ …؟» question each page itself
// prints, named in `FOLIO_LESS_ANCHORS`. Every other term page proves its own
// number from its foot, so `FOOTER_OCR_MISREADS` is empty and `MISSING_SCANS`
// is empty.
//
// THE FOLIO CHECK READS THE LAST FOUR LINES
// The folio is the last number-ish line of the page: the trailing numeral of
// the «الدرس» footer (or its leading numeral on book 92), a bare numeral line
// («12», «70 |», «| 16»), or a leading numeral glued to the photo credit
// («24 | Photo Credit …», books 10, 24, 76). Table numerals («20 600 140»,
// «| 3 | 10 |»), decimals («56.284», «0.774»), exercise numbers («43)1,376»)
// and clock readings («6:00 صباحاً …») never qualify, so body numbers can
// never be mistaken for a folio; `printedFooter` prefers the page's own
// number among the candidates exactly as the French-medium sibling does.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every numbered درس contributes its head («الدرس n» plus its title on the
// next line, exactly as the opener prints it) plus the three activity sections
// the parent letter itself names («يحتوي كل درس على ثلاثة أجزاء رئيسة:
// استكشف، وتعلم، وفكر», scan 12): «استكشف» on the opener, «تعلم» on the work
// page and «فكر» on the closing page, in page order, each stored under the
// spelling its own page prints — «تعلَّم» (books 4, 12, 23, 52, 55, 57, 66,
// 104, 106), «تعلّم» (books 41, 45, 128) and «فَكِّر» (books 6, 10, 14, 16,
// 19, 28, 42, 46, 55, 63, 67, 77, 79, 82, 90, 94, 98, 104, 109, 111, 119) —
// kept verbatim under the normalized kinds «تعلم» / «فكر», exactly as the
// Grade-3 Mathematics spec keeps «أربط» under «اربط». The closing «تحقق من
// فهمك» line, the «أهداف التعلم» bullets and the «الكتابة عن الرياضيات» prompts
// ride with the section that prints them — as in the French-medium sibling,
// where «Vérifie ton acquisition» carries no concept — so they contribute no
// concept of their own. Nothing is invented: every concept title below is a
// string the book itself prints on the page its `bookFrom` names. (The
// «مفهوم» running heads group the lessons but are not lesson heads, so they
// carry no concept either: unit 1 prints «الكسور العشرية حتى جزء من الألف»
// and «جمع وطرح الكسور العشرية», unit 2 «التعبيرات الرياضية والمعادلات والعالم
// من حولنا» and «العوامل والمضاعفات», unit 3 «الضرب في عدد مكون من رقمين»
// — opener running heads spell it «مكوّن» — unit 4 «استخدام النماذج في عملية
// القسمة» and «القسمة على عدد مكون من رقمين», unit 5 «ضرب الكسور العشرية»
// and «قسمة الكسور العشرية», unit 6 «إيجاد قيمة التعبيرات العددية وتحليل
// الأنماط».)
//
// THE UNIT OPENER RIDES WITH THE FIRST LESSON
// Each unit's first lesson is owned from the unit's own opener page (which
// prints «الوحدة N» and the video questions), so `lessonBookRange` starts a
// unit's first lesson at the section head, exactly as the other Egyptian
// Mathematics specs do. The book prints no appendix: every page of the term
// belongs to exactly one lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 11 (verified: book p.130 = scan p.141). */
export const BOOK_TO_PDF_OFFSET = 11;

/** First printed page of the term — the unit-1 opener (scan 13). */
export const EGYPT_MATH_G5_T1_BOOK_START = 2;

/** Last printed page of the term — the unit-6 closing فكر page (scan 141). */
export const EGYPT_MATH_G5_T1_BOOK_END = 130;

/** The scanned pages before the term: covers, copyright, contents, foreword, letters. */
export const EGYPT_MATH_G5_T1_FRONT_MATTER = { from: 1, to: 12 } as const;

/** The scan after the term: the back cover with the ISBN and CACD / Discovery credits. */
export const EGYPT_MATH_G5_T1_BACK_MATTER = { from: 142, to: 142 } as const;

/**
 * The term pages the OCR never produced, as scan pages. All 142 scans are
 * present and every one of the 129 term pages carries text, so there are
 * none; the constant is kept so this module shares the shape of the other
 * Egyptian specs (and so the checker's expected page count subtracts it).
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of a lesson — becomes one concept in the app tree. */
export interface MathG5T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: "الدرس" or one of the activity section words. */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one numbered درس of a unit). */
export interface MathG5T1Lesson {
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
  concepts: MathG5T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a unit — so no lesson below uses it; the
   * field is kept so this module shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed unit of the term (one of the six وحدات). */
export interface MathG5T1Unit {
  /** This book’s units are its وحدات. */
  kind: "unit";
  /** Internal key: "1"…"6", in book order. */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الثالثة". */
  ordinal: string;
  /** Full app-facing unit title, e.g. "الوحدة الثالثة: ضرب الأعداد الصحيحة". */
  title: string;
  /** The unit head its opener prints, verbatim, e.g. "الوحدة الثالثة". */
  printedHead: string;
  /** First printed page of the unit (its opener). */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next opener). */
  bookTo: number;
  lessons: MathG5T1Lesson[];
}

const LESSON = "الدرس";
const EXPLORE = "استكشف";
const LEARN = "تعلم";
const THINK = "فكر";

function concept(bookFrom: number, kind: string, title: string): MathG5T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The six units of the first term with their printed lessons and every printed
 * head, transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Unit ranges come from the pages’ own «الوحدة N» openers: 2–42, 43–63,
 * 64–79, 80–90, 91–119 and 120–130. Lesson starts come from the «الدرس n»
 * openers and match the contents (scans 5–7) exactly.
 */
export const EGYPT_MATH_G5_T1_UNITS: MathG5T1Unit[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: القيمة المكانية للأعداد العشرية وحسابها",
    printedHead: "الوحدة الأولى",
    bookFrom: 2,
    bookTo: 42,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: LESSON,
        title: "الكسور العشرية حتى جزء من الألف",
        printedHead: "الدرس الأول: الكسور العشرية حتى جزء من الألف",
        bookFrom: 3,
        concepts: [
          concept(3, LESSON, "الدرس الأول: الكسور العشرية حتى جزء من الألف"),
          concept(3, EXPLORE, "استكشف"),
          concept(4, LEARN, "تعلَّم"),
          concept(6, THINK, "فَكِّر"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "تغيير القيم المكانية",
        printedHead: "الدرس الثاني: تغيير القيم المكانية",
        bookFrom: 7,
        concepts: [
          concept(7, LESSON, "الدرس الثاني: تغيير القيم المكانية"),
          concept(7, EXPLORE, "استكشف"),
          concept(7, LEARN, "تعلم"),
          concept(10, THINK, "فَكِّر"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "تكوين الكسور العشرية وتحليلها",
        printedHead: "الدرس الثالث: تكوين الكسور العشرية وتحليلها",
        bookFrom: 11,
        concepts: [
          concept(11, LESSON, "الدرس الثالث: تكوين الكسور العشرية وتحليلها"),
          concept(11, EXPLORE, "استكشف"),
          concept(12, LEARN, "تعلَّم"),
          concept(14, THINK, "فَكِّر"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "مقارنة الكسور العشرية",
        printedHead: "الدرس الرابع: مقارنة الكسور العشرية",
        bookFrom: 15,
        concepts: [
          concept(15, LESSON, "الدرس الرابع: مقارنة الكسور العشرية"),
          concept(15, EXPLORE, "استكشف"),
          concept(15, LEARN, "تعلم"),
          concept(16, THINK, "فَكِّر"),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "تقريب الكسور العشرية",
        printedHead: "الدرس الخامس: تقريب الكسور العشرية",
        bookFrom: 17,
        concepts: [
          concept(17, LESSON, "الدرس الخامس: تقريب الكسور العشرية"),
          concept(17, EXPLORE, "استكشف"),
          concept(17, LEARN, "تعلم"),
          concept(19, THINK, "فَكِّر"),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: LESSON,
        title: "تقدير مجموع الأعداد العشرية",
        printedHead: "الدرس السادس: تقدير مجموع الأعداد العشرية",
        bookFrom: 20,
        concepts: [
          concept(20, LESSON, "الدرس السادس: تقدير مجموع الأعداد العشرية"),
          concept(20, EXPLORE, "استكشف"),
          concept(20, LEARN, "تعلم"),
          concept(21, THINK, "فكر"),
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        type: LESSON,
        title: "نمذجة جمع الكسور العشرية",
        printedHead: "الدرس السابع: نمذجة جمع الكسور العشرية",
        bookFrom: 22,
        concepts: [
          concept(22, LESSON, "الدرس السابع: نمذجة جمع الكسور العشرية"),
          concept(22, EXPLORE, "استكشف"),
          concept(23, LEARN, "تعلَّم"),
          concept(28, THINK, "فَكِّر"),
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "نمذجة طرح الكسور العشرية",
        printedHead: "الدرس الثامن: نمذجة طرح الكسور العشرية",
        bookFrom: 29,
        concepts: [
          concept(29, LESSON, "الدرس الثامن: نمذجة طرح الكسور العشرية"),
          concept(29, EXPLORE, "استكشف"),
          concept(30, LEARN, "تعلم"),
          concept(33, THINK, "فكر"),
        ],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "تقدير الفرق بين عددين عشريين",
        printedHead: "الدرس التاسع: تقدير الفرق بين عددين عشريين",
        bookFrom: 34,
        concepts: [
          concept(34, LESSON, "الدرس التاسع: تقدير الفرق بين عددين عشريين"),
          concept(34, EXPLORE, "استكشف"),
          concept(34, LEARN, "تعلم"),
          concept(36, THINK, "فكر"),
        ],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        type: LESSON,
        title: "طرح الكسور العشرية حتى جزء من الألف",
        printedHead: "الدرس العاشر: طرح الكسور العشرية حتى جزء من الألف",
        bookFrom: 37,
        concepts: [
          concept(37, LESSON, "الدرس العاشر: طرح الكسور العشرية حتى جزء من الألف"),
          concept(37, EXPLORE, "استكشف"),
          concept(37, LEARN, "تعلم"),
          concept(39, THINK, "فكر"),
        ],
      },
      {
        key: "1-11",
        ordinal: "الحادي عشر",
        type: LESSON,
        title: "مسائل كلامية على الكسور العشرية",
        printedHead: "الدرس الحادي عشر: مسائل كلامية على الكسور العشرية",
        bookFrom: 40,
        concepts: [
          concept(40, LESSON, "الدرس الحادي عشر: مسائل كلامية على الكسور العشرية"),
          concept(40, EXPLORE, "استكشف"),
          concept(41, LEARN, "تعلّم"),
          concept(42, THINK, "فَكِّر"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: العلاقات بين الأعداد",
    printedHead: "الوحدة الثانية",
    bookFrom: 43,
    bookTo: 63,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: LESSON,
        title: "التعبيرات الرياضية والمعادلات والمتغيرات",
        printedHead: "الدرس الأول: التعبيرات الرياضية والمعادلات والمتغيرات",
        bookFrom: 44,
        concepts: [
          concept(44, LESSON, "الدرس الأول: التعبيرات الرياضية والمعادلات والمتغيرات"),
          concept(44, EXPLORE, "استكشف"),
          concept(45, LEARN, "تعلّم"),
          concept(46, THINK, "فَكِّر"),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "المتغيرات في المعادلات",
        printedHead: "الدرس الثاني: المتغيرات في المعادلات",
        bookFrom: 47,
        concepts: [
          concept(47, LESSON, "الدرس الثاني: المتغيرات في المعادلات"),
          concept(47, EXPLORE, "استكشف"),
          concept(47, LEARN, "تعلم"),
          concept(48, THINK, "فكر"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "القصص والأعداد",
        printedHead: "الدرس الثالث: القصص والأعداد",
        bookFrom: 49,
        concepts: [
          concept(49, LESSON, "الدرس الثالث: القصص والأعداد"),
          concept(49, EXPLORE, "استكشف"),
          concept(49, LEARN, "تعلم"),
          concept(50, THINK, "فكر"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "تحليل العدد إلى عوامل أولية",
        printedHead: "الدرس الرابع: تحليل العدد إلى عوامل أولية",
        bookFrom: 51,
        concepts: [
          concept(51, LESSON, "الدرس الرابع: تحليل العدد إلى عوامل أولية"),
          concept(51, EXPLORE, "استكشف"),
          concept(52, LEARN, "تعلَّم"),
          concept(53, THINK, "فكر"),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "العامل المشترك الأكبر (ع.م.أ)",
        printedHead: "الدرس الخامس: العامل المشترك الأكبر (ع.م.أ)",
        bookFrom: 54,
        concepts: [
          concept(54, LESSON, "الدرس الخامس: العامل المشترك الأكبر (ع.م.أ)"),
          concept(54, EXPLORE, "استكشف"),
          concept(55, LEARN, "تعلَّم"),
          concept(55, THINK, "فَكِّر"),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: LESSON,
        title: "تحديد المضاعفات",
        printedHead: "الدرس السادس: تحديد المضاعفات",
        bookFrom: 56,
        concepts: [
          concept(56, LESSON, "الدرس السادس: تحديد المضاعفات"),
          concept(56, EXPLORE, "استكشف"),
          concept(57, LEARN, "تعلَّم"),
          concept(58, THINK, "فكر"),
        ],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        type: LESSON,
        title: "المضاعف المشترك الأصغر (م.م.أ)",
        printedHead: "الدرس السابع: المضاعف المشترك الأصغر (م.م.أ)",
        bookFrom: 59,
        concepts: [
          concept(59, LESSON, "الدرس السابع: المضاعف المشترك الأصغر (م.م.أ)"),
          concept(59, EXPLORE, "استكشف"),
          concept(59, LEARN, "تعلم"),
          concept(61, THINK, "فكر"),
        ],
      },
      {
        key: "2-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "عوامل أم مضاعفات؟",
        printedHead: "الدرس الثامن: عوامل أم مضاعفات؟",
        bookFrom: 62,
        concepts: [
          concept(62, LESSON, "الدرس الثامن: عوامل أم مضاعفات؟"),
          concept(62, EXPLORE, "استكشف"),
          concept(62, LEARN, "تعلم"),
          concept(63, THINK, "فَكِّر"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: ضرب الأعداد الصحيحة",
    printedHead: "الوحدة الثالثة",
    bookFrom: 64,
    bookTo: 79,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: LESSON,
        title: "استخدام نموذج مساحة المستطيل في عملية الضرب",
        printedHead: "الدرس الأول: استخدام نموذج مساحة المستطيل في عملية الضرب",
        bookFrom: 65,
        concepts: [
          concept(65, LESSON, "الدرس الأول: استخدام نموذج مساحة المستطيل في عملية الضرب"),
          concept(65, EXPLORE, "استكشف"),
          concept(66, LEARN, "تعلَّم"),
          concept(67, THINK, "فَكِّر"),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "خاصية التوزيع في عملية الضرب",
        printedHead: "الدرس الثاني: خاصية التوزيع في عملية الضرب",
        bookFrom: 68,
        concepts: [
          concept(68, LESSON, "الدرس الثاني: خاصية التوزيع في عملية الضرب"),
          concept(68, EXPLORE, "استكشف"),
          concept(68, LEARN, "تعلم"),
          concept(71, THINK, "فكر"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "الضرب في عدد مكون من رقمين باستخدام الخوارزمية المعيارية",
        printedHead: "الدرس الثالث: الضرب في عدد مكون من رقمين باستخدام الخوارزمية المعيارية",
        bookFrom: 72,
        concepts: [
          concept(72, LESSON, "الدرس الثالث: الضرب في عدد مكون من رقمين باستخدام الخوارزمية المعيارية"),
          concept(72, EXPLORE, "استكشف"),
          concept(72, LEARN, "تعلم"),
          concept(74, THINK, "فكر"),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "ضرب الأعداد متعددة الأرقام",
        printedHead: "الدرس الرابع: ضرب الأعداد متعددة الأرقام",
        bookFrom: 75,
        concepts: [
          concept(75, LESSON, "الدرس الرابع: ضرب الأعداد متعددة الأرقام"),
          concept(75, EXPLORE, "استكشف"),
          concept(75, LEARN, "تعلم"),
          concept(77, THINK, "فَكِّر"),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "مسائل كلامية على الضرب",
        printedHead: "الدرس الخامس: مسائل كلامية على الضرب",
        bookFrom: 78,
        concepts: [
          concept(78, LESSON, "الدرس الخامس: مسائل كلامية على الضرب"),
          concept(78, EXPLORE, "استكشف"),
          concept(78, LEARN, "تعلم"),
          concept(79, THINK, "فَكِّر"),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "الرابعة",
    title: "الوحدة الرابعة: القسمة على أعداد صحيحة",
    printedHead: "الوحدة الرابعة",
    bookFrom: 80,
    bookTo: 90,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: LESSON,
        title: "القسمة باستخدام نموذج مساحة المستطيل",
        printedHead: "الدرس الأول: القسمة باستخدام نموذج مساحة المستطيل",
        bookFrom: 81,
        concepts: [
          concept(81, LESSON, "الدرس الأول: القسمة باستخدام نموذج مساحة المستطيل"),
          concept(81, EXPLORE, "استكشف"),
          concept(81, LEARN, "تعلم"),
          concept(82, THINK, "فَكِّر"),
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "تقدير خارج القسمة",
        printedHead: "الدرس الثاني: تقدير خارج القسمة",
        bookFrom: 83,
        concepts: [
          concept(83, LESSON, "الدرس الثاني: تقدير خارج القسمة"),
          concept(83, EXPLORE, "استكشف"),
          concept(83, LEARN, "تعلم"),
          concept(84, THINK, "فكر"),
        ],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "استخدام خوارزمية القسمة",
        printedHead: "الدرس الثالث: استخدام خوارزمية القسمة",
        bookFrom: 85,
        concepts: [
          concept(85, LESSON, "الدرس الثالث: استخدام خوارزمية القسمة"),
          concept(85, EXPLORE, "استكشف"),
          concept(85, LEARN, "تعلم"),
          concept(86, THINK, "فكر"),
        ],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "علاقة القسمة بالضرب",
        printedHead: "الدرس الرابع: علاقة القسمة بالضرب",
        bookFrom: 87,
        concepts: [
          concept(87, LESSON, "الدرس الرابع: علاقة القسمة بالضرب"),
          concept(87, EXPLORE, "استكشف"),
          concept(87, LEARN, "تعلم"),
          concept(88, THINK, "فكر"),
        ],
      },
      {
        key: "4-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "مسائل كلامية متعددة الخطوات",
        printedHead: "الدرس الخامس: مسائل كلامية متعددة الخطوات",
        bookFrom: 89,
        concepts: [
          concept(89, LESSON, "الدرس الخامس: مسائل كلامية متعددة الخطوات"),
          concept(89, EXPLORE, "استكشف"),
          concept(89, LEARN, "تعلم"),
          concept(90, THINK, "فَكِّر"),
        ],
      },
    ],
  },
  {
    key: "5",
    kind: "unit",
    ordinal: "الخامسة",
    title: "الوحدة الخامسة: عمليتا الضرب والقسمة مع الكسور العشرية",
    printedHead: "الوحدة الخامسة",
    bookFrom: 91,
    bookTo: 119,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: LESSON,
        title: "الضرب في قوى العدد 10",
        printedHead: "الدرس الأول: الضرب في قوى العدد 10",
        bookFrom: 92,
        concepts: [
          concept(92, LESSON, "الدرس الأول: الضرب في قوى العدد 10"),
          concept(92, EXPLORE, "استكشف"),
          concept(92, LEARN, "تعلم"),
          concept(94, THINK, "فَكِّر"),
        ],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "ضرب الكسور العشرية في أعداد صحيحة",
        printedHead: "الدرس الثاني: ضرب الكسور العشرية في أعداد صحيحة",
        bookFrom: 95,
        concepts: [
          concept(95, LESSON, "الدرس الثاني: ضرب الكسور العشرية في أعداد صحيحة"),
          concept(95, EXPLORE, "استكشف"),
          concept(95, LEARN, "تعلم"),
          concept(96, THINK, "فكر"),
        ],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "ضرب الأجزاء من عشرة في أجزاء من عشرة",
        printedHead: "الدرس الثالث: ضرب الأجزاء من عشرة في أجزاء من عشرة",
        bookFrom: 97,
        concepts: [
          concept(97, LESSON, "الدرس الثالث: ضرب الأجزاء من عشرة في أجزاء من عشرة"),
          concept(97, EXPLORE, "استكشف"),
          concept(97, LEARN, "تعلم"),
          concept(98, THINK, "فَكِّر"),
        ],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "ضرب الكسور العشرية باستخدام نموذج مساحة المستطيل",
        printedHead: "الدرس الرابع: ضرب الكسور العشرية باستخدام نموذج مساحة المستطيل",
        bookFrom: 99,
        concepts: [
          concept(99, LESSON, "الدرس الرابع: ضرب الكسور العشرية باستخدام نموذج مساحة المستطيل"),
          concept(99, EXPLORE, "استكشف"),
          concept(99, LEARN, "تعلم"),
          concept(100, THINK, "فكر"),
        ],
      },
      {
        key: "5-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "ضرب الكسور العشرية حتى جزء من مائة",
        printedHead: "الدرس الخامس: ضرب الكسور العشرية حتى جزء من مائة",
        bookFrom: 101,
        concepts: [
          concept(101, LESSON, "الدرس الخامس: ضرب الكسور العشرية حتى جزء من مائة"),
          concept(101, EXPLORE, "استكشف"),
          concept(101, LEARN, "تعلم"),
          concept(102, THINK, "فكر"),
        ],
      },
      {
        key: "5-6",
        ordinal: "السادس",
        type: LESSON,
        title: "ضرب الكسور العشرية حتى جزء من الألف",
        printedHead: "الدرس السادس: ضرب الكسور العشرية حتى جزء من الألف",
        bookFrom: 103,
        concepts: [
          concept(103, LESSON, "الدرس السادس: ضرب الكسور العشرية حتى جزء من الألف"),
          concept(103, EXPLORE, "استكشف"),
          concept(104, LEARN, "تعلَّم"),
          concept(104, THINK, "فَكِّر"),
        ],
      },
      {
        key: "5-7",
        ordinal: "السابع",
        type: LESSON,
        title: "الكسور العشرية والنظام المتري",
        printedHead: "الدرس السابع: الكسور العشرية والنظام المتري",
        bookFrom: 105,
        concepts: [
          concept(105, LESSON, "الدرس السابع: الكسور العشرية والنظام المتري"),
          concept(105, EXPLORE, "استكشف"),
          concept(106, LEARN, "تعلَّم"),
          concept(107, THINK, "فكر"),
        ],
      },
      {
        key: "5-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "القياس والكسور العشرية وقوى العدد 10",
        printedHead: "الدرس الثامن: القياس والكسور العشرية وقوى العدد 10",
        bookFrom: 108,
        concepts: [
          concept(108, LESSON, "الدرس الثامن: القياس والكسور العشرية وقوى العدد 10"),
          concept(108, EXPLORE, "استكشف"),
          concept(108, LEARN, "تعلم"),
          concept(109, THINK, "فَكِّر"),
        ],
      },
      {
        key: "5-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "حل مسائل كلامية متعددة الخطوات",
        printedHead: "الدرس التاسع: حل مسائل كلامية متعددة الخطوات",
        bookFrom: 110,
        concepts: [
          concept(110, LESSON, "الدرس التاسع: حل مسائل كلامية متعددة الخطوات"),
          concept(110, EXPLORE, "استكشف"),
          concept(110, LEARN, "تعلم"),
          concept(111, THINK, "فَكِّر"),
        ],
      },
      {
        key: "5-10",
        ordinal: "العاشر",
        type: LESSON,
        title: "القسمة على قوى العدد 10",
        printedHead: "الدرس العاشر: القسمة على قوى العدد 10",
        bookFrom: 112,
        concepts: [
          concept(112, LESSON, "الدرس العاشر: القسمة على قوى العدد 10"),
          concept(112, EXPLORE, "استكشف"),
          concept(112, LEARN, "تعلم"),
          concept(113, THINK, "فكر"),
        ],
      },
      {
        key: "5-11",
        ordinal: "الحادي عشر",
        type: LESSON,
        title: "الأنماط والعلاقات في قوى العدد 10",
        printedHead: "الدرس الحادي عشر: الأنماط والعلاقات في قوى العدد 10",
        bookFrom: 114,
        concepts: [
          concept(114, LESSON, "الدرس الحادي عشر: الأنماط والعلاقات في قوى العدد 10"),
          concept(114, EXPLORE, "استكشف"),
          concept(114, LEARN, "تعلم"),
          concept(115, THINK, "فكر"),
        ],
      },
      {
        key: "5-12",
        ordinal: "الثاني عشر",
        type: LESSON,
        title: "قسمة كسور عشرية على أعداد صحيحة",
        printedHead: "الدرس الثاني عشر: قسمة كسور عشرية على أعداد صحيحة",
        bookFrom: 116,
        concepts: [
          concept(116, LESSON, "الدرس الثاني عشر: قسمة كسور عشرية على أعداد صحيحة"),
          concept(116, EXPLORE, "استكشف"),
          concept(116, LEARN, "تعلم"),
          concept(117, THINK, "فكر"),
        ],
      },
      {
        key: "5-13",
        ordinal: "الثالث عشر",
        type: LESSON,
        title: "قسمة كسور عشرية على كسور عشرية",
        printedHead: "الدرس الثالث عشر: قسمة كسور عشرية على كسور عشرية",
        bookFrom: 118,
        concepts: [
          concept(118, LESSON, "الدرس الثالث عشر: قسمة كسور عشرية على كسور عشرية"),
          concept(118, EXPLORE, "استكشف"),
          concept(118, LEARN, "تعلم"),
          concept(119, THINK, "فَكِّر"),
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "unit",
    ordinal: "السادسة",
    title: "الوحدة السادسة: التعبيرات العددية والأنماط",
    printedHead: "الوحدة السادسة",
    bookFrom: 120,
    bookTo: 130,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: LESSON,
        title: "ترتيب إجراء العمليات الحسابية",
        printedHead: "الدرس الأول: ترتيب إجراء العمليات الحسابية",
        bookFrom: 121,
        concepts: [
          concept(121, LESSON, "الدرس الأول: ترتيب إجراء العمليات الحسابية"),
          concept(121, EXPLORE, "استكشف"),
          concept(121, LEARN, "تعلم"),
          concept(122, THINK, "فكر"),
        ],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "تعبيرات عددية تتضمن أقواسًا",
        printedHead: "الدرس الثاني: تعبيرات عددية تتضمن أقواسًا",
        bookFrom: 123,
        concepts: [
          concept(123, LESSON, "الدرس الثاني: تعبيرات عددية تتضمن أقواسًا"),
          concept(123, EXPLORE, "استكشف"),
          concept(123, LEARN, "تعلم"),
          concept(124, THINK, "فكر"),
        ],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "كتابة تعبير عددي لتمثيل موقف ما",
        printedHead: "الدرس الثالث: كتابة تعبير عددي لتمثيل موقف ما",
        bookFrom: 125,
        concepts: [
          concept(125, LESSON, "الدرس الثالث: كتابة تعبير عددي لتمثيل موقف ما"),
          concept(125, EXPLORE, "استكشف"),
          concept(125, LEARN, "تعلم"),
          concept(126, THINK, "فكر"),
        ],
      },
      {
        key: "6-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "تحديد الأنماط العددية",
        printedHead: "الدرس الرابع: تحديد الأنماط العددية",
        bookFrom: 127,
        concepts: [
          concept(127, LESSON, "الدرس الرابع: تحديد الأنماط العددية"),
          concept(127, EXPLORE, "استكشف"),
          concept(128, LEARN, "تعلّم"),
          concept(130, THINK, "فكر"),
        ],
      },
    ],
  },
];

/**
 * The book-page span a lesson owns: from the unit opener (its first lesson)
 * or its own head page, down to the page before the next lesson starts, bounded
 * by the unit — so the unit opener stays inside the unit it belongs to.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_MATH_G5_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_G5_T1_UNITS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This term has no
 * appendix: every page of the term belongs to a unit. Kept as a function so
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
  "math-g5-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (No term page of this book needs it — every present term page
 * carries text — but the guard is kept so the loader shares one shape across
 * the books.)
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
  const lesson = EGYPT_MATH_G5_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
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
 * Page-number candidates a content page prints at its foot. This book's folio is
 * the last number-ish line of the page: the trailing numeral of the «الدرس»
 * footer (book 92 prints it reversed, «92 | الدرس …: …»), a bare numeral on its
 * own line («12», «70 |», «| 16»), or a leading numeral glued to the photo
 * credit («24 | Photo Credit …»). Multi-numeral table lines («20 600 140»,
 * «| 3 | 10 |»), decimals («56.284»), exercise labels («43)1,376») and clock
 * readings («6:00 صباحاً …») never qualify, so body numbers can never be
 * mistaken for a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const tail = lines.slice(-4);
  const out = new Set<number>();
  for (const line of tail) {
    if (line.includes("الدرس")) {
      const lead = line.match(/^\s*([0-9٠-٩۰-۹]+)\s*\|/);
      if (lead) {
        out.add(Number(toLatinDigits(lead[1]!).replace(/\D/g, "")));
        continue;
      }
      const m = line.match(/\|\s*([0-9٠-٩۰-۹]+)\s*$/);
      if (m) out.add(Number(toLatinDigits(m[1]!).replace(/\D/g, "")));
      continue;
    }
    const parts = line.split(/\s*\|\s*/).filter((p) => p.length > 0);
    if (parts.length === 1 && /^[0-9٠-٩۰-۹]+$/.test(parts[0]!)) {
      out.add(Number(toLatinDigits(parts[0]!).replace(/\D/g, "")));
    } else if (
      parts.length === 2 &&
      /^[0-9٠-٩۰-۹]+$/.test(parts[0]!) &&
      /\p{L}/u.test(parts[1]!)
    ) {
      // A leading folio glued to trailing text («24 | Photo Credit …»).
      out.add(Number(toLatinDigits(parts[0]!).replace(/\D/g, "")));
    }
  }
  return [...out].sort((a, b) => a - b);
}

/**
 * The book number a content page prints at its foot, or null when it prints
 * none. Returns the page's own number when it is among the candidates,
 * otherwise the largest candidate (so a wrong page still reports a number and
 * the caller can see the mismatch). The six unit openers (books 2, 43, 64, 80,
 * 91, 120) print no folio at all, so those pages are anchored through
 * `FOLIO_LESS_ANCHORS`.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * The content pages whose printed footer the OCR misread, and the value it
 * printed instead — measured, not guessed. Every parseable folio matches its
 * page number exactly in this book, so there are none; the constant is kept so
 * the check stays strict instead of statistical.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no folio in the OCR, each with the anchor the check
 * accepts in place of a page number. Books 2, 43, 64, 80, 91 and 120 are the
 * «الوحدة» openers of the six units; by the book's own design none carries a
 * page number, and each is anchored to the «ماذا اكتشف التلاميذ …؟» question it
 * prints.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  2: "ماذا اكتشف التلاميذ عن الكسور العشرية والقيمة المكانية",
  43: "ماذا اكتشف التلاميذ عن العوامل والمضاعفات",
  64: "ماذا اكتشف التلاميذ عن عملية الضرب والقيمة المكانية",
  80: "ماذا اكتشف التلاميذ عن استخدام الأنماط لحل مسائل القسمة",
  91: "ماذا اكتشف التلاميذ عن ضرب الكسور العشرية وقسمتها",
  120: "ماذا اكتشف التلاميذ عن التعبيرات العددية",
};

/** Every head kind the table may use: the lesson-head kind plus the section kinds. */
const KNOWN_KINDS = new Set([
  "الدرس",
  "استكشف",
  "تعلم",
  "فكر",
]);

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book’s own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_G5_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_MATH_G5_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_MATH_G5_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (lastUnit && lastUnit.bookTo !== EGYPT_MATH_G5_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_MATH_G5_T1_BOOK_END}، وجدنا ${lastUnit.bookTo}`);
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
 *  4. every printed page in [2, 130] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR’d
 *     page of the term.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_MATH_G5_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_G5_T1_BOOK_START || book > EGYPT_MATH_G5_T1_BOOK_END) continue;
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
    EGYPT_MATH_G5_T1_BOOK_END - EGYPT_MATH_G5_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: قرأنا ${printedPages.size} صفحات بين ${EGYPT_MATH_G5_T1_BOOK_START} و${EGYPT_MATH_G5_T1_BOOK_END}، والمتوقع ${expectedPages}`,
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
  for (let p = EGYPT_MATH_G5_T1_BOOK_START; p <= EGYPT_MATH_G5_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
