// Primary 2 (الصف الثاني الابتدائي) Mathematics (الرياضيات), first term,
// Ministry of Education and Technical Education 2025/2026 edition (the cover
// imprint prints «2025 - 2026» and the back matter the print specs).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g2-math`, subject `math` (name "Mathematics"), lesson prefix
// `l-g2-math-`, grade `grade-2` (name "Primary 2").
//
// The curriculum tree for the Egypt `eg-g2-math` curriculum is rebuilt from
// the Ministry textbook `الرياضيات — الصف الثاني الابتدائي — الفصل الدراسي
// الأول` (92 scanned pages). This module is the single source of truth for
// its structure: the six printed فصول of the first term, every numbered
// printed درس inside them (60 in all), and, for every lesson, the book's own
// printed heads — the درس head plus the activity-flow heads the pages print
// (التطبيق / تأمل) — verbatim and with the printed page they start on. The
// self-checks at the bottom prove that mapping against the OCR itself, page
// by page.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every content page that carries a folio prints its own number on the footer
// line carrying «الصف الثاني الابتدائي», so `BOOK_TO_PDF_OFFSET` is fixed by
// the scans and quoted here: scan 6 prints «٢ الصف الثاني الابتدائي» (book 2,
// the chapter-1 opener), scan 20 prints «١٦ الصف الثاني الابتدائي» (book 16,
// the chapter-2 opener), scan 44 prints «٤٠ …» (book 40), scan 59 prints
// «… | 00» for book 55 (a measured misread, anchored below), scan 65 prints
// «١٦» alone for book 61 (the digits transposed — recorded in
// `FOOTER_OCR_MISREADS`), scan 90 prints «… ٨٦» (book 86) and scan 91 prints
// the bare «٨٧» (book 87, the chapter-6 closing تأمل). The book's own
// «المحتويات» (scan 5) independently confirms the lesson starts: it lists
// «الدرس ١: قراءة البيانات ٢» … «الدرس ١٠: مزيد من التطبيقات على الوقت ٨٦» —
// every head below sits exactly where the contents says it does.
//
// TERM = THE TYPED BOOK PAGES (books 2–87)
// Scan pages 1–5 are before the term: the cover (1), a blank verso (2, the
// OCR answers «لا يوجد نص في الصورة المرفقة»), the «مقدمة» (3), the credits
// «مراجعة» (4) and the printed «المحتويات» (5). Scan page 92 is after the
// term (the copyright / print-specs page). The term runs from the chapter-1
// opener (book 2 = scan 6) to the chapter-6 closing تأمل (book 87 = scan 91):
// `EGYPT_MATH_G2_T1_BOOK_START` / `_BOOK_END` are exactly those two pages,
// and the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` is therefore 87 − 2 + 1 = 86 (no scan of the term is
// missing).
//
// SIX TERM PAGES PRINT NO PARSEABLE FOLIO — EACH HAS A NAMED ANCHOR
// The vision OCR lost the folio of six pages: book 4 prints the footer line
// with no number (a stray «ع» sits where «٤» belongs); books 7 and 17 print
// «٧»/«١٧» but the OCR read them as the Latin letters «V»/«IV»; book 26 is
// the مخطط-١٢٠ chart whose footer line carries no number; book 55 prints
// «٥٥» but the OCR kept only «00»; and book 71 prints «٧١» but the OCR read
// it as the Latin «VI». Rather than weaken the page-number check, all six
// are exempt from it and anchored on a string the page itself prints, named
// in `FOLIO_LESS_ANCHORS`. Book 61 prints a parseable but transposed folio
// («١٦» for 61); it stays numeric and is recorded in `FOOTER_OCR_MISREADS`.
// Every other term page proves its number from its footer — either the
// number on the «الصف الثاني الابتدائي» line or a bare numeral in the last
// three lines (split footers) — so body numbers (chart cells, ruler marks,
// exercise counts) can never be mistaken for a folio.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every numbered درس contributes its head line (number + title, exactly as
// the opener prints it, including the OCR's own variants: «الدرس 5: … 1» and
// «الدرس 1: …» with Latin digits, «درس ٣: …» / «درس ٤: …» without the leading
// ال, and «الدرس ٣ : …» / «الدرس ٦ : …» / «الدرس ٥ : …» / «الدرس 4 : …» with a
// space before the colon) plus the activity-flow heads the lesson prints:
// «التطبيق» on the lesson's work page (books 38–39 print it numbered
// «التطبيق (١)» / «التطبيق (٢)» — stored as the single band «التطبيق») and
// «تأمل» where the lesson prints its reflection box (on the head page itself
// when the lesson owns a single page, otherwise on the closing page). The
// practice pages that merely continue exercises (books 41, 43, 46, 54, 61,
// 66, 73, 76, 77, 84) print no head of their own, so they carry no concept —
// they are still owned by their lesson's range. Nothing is invented: every
// concept title below is a string the book itself prints on the page its
// `bookFrom` names.
//
// THE CHAPTER OPENER RIDES WITH THE FIRST LESSON
// Each chapter's first lesson starts on the chapter's own opener page (which
// prints «الفصل N» and then the lesson head), so `lessonBookRange` starts a
// chapter's first lesson at the section head, exactly as the other Egyptian
// Mathematics specs do. The book prints no chapter subtitles and no appendix:
// every page of the term belongs to exactly one lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.87 = scan p.91). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the chapter-1 opener (scan 6). */
export const EGYPT_MATH_G2_T1_BOOK_START = 2;

/** Last printed page of the term — the chapter-6 closing تأمل (scan 91). */
export const EGYPT_MATH_G2_T1_BOOK_END = 87;

/** The scanned pages before the term: cover, blank verso, مقدمة, مراجعة, محتويات. */
export const EGYPT_MATH_G2_T1_FRONT_MATTER = { from: 1, to: 5 } as const;

/** The scan after the term: the copyright / print-specs page (scan 92). */
export const EGYPT_MATH_G2_T1_BACK_MATTER = { from: 92, to: 92 } as const;

/**
 * The term pages the OCR never produced, as scan pages. All 92 scans are
 * present and every one of the 86 term pages carries text, so there are
 * none; the constant is kept so this module shares the shape of the other
 * Egyptian specs (and so the checker's expected page count subtracts it).
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of a lesson — becomes one concept in the app tree. */
export interface MathG2T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: "الدرس" or one of the activity band words. */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one numbered درس of a chapter). */
export interface MathG2T1Lesson {
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
  concepts: MathG2T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a chapter — so no lesson below uses it; the
   * field is kept so this module shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed chapter of the term (one of the six فصول). */
export interface MathG2T1Unit {
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
  lessons: MathG2T1Lesson[];
}

const LESSON = "الدرس";
const APPLY = "التطبيق";
const REFLECT = "تأمل";

function concept(bookFrom: number, kind: string, title: string): MathG2T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The six chapters of the first term with their printed lessons and every printed
 * head, transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter ranges come from the pages’ own «الفصل N» bands and the contents
 * (scan 5): 2–15, 16–26, 27–36, 37–54, 55–68 and 69–87. Lesson starts come from
 * the «الدرس n:» openers and match the contents exactly.
 */
export const EGYPT_MATH_G2_T1_UNITS: MathG2T1Unit[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "الفصل الأول",
    printedHead: "الفصل الأول",
    bookFrom: 2,
    bookTo: 15,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: LESSON,
        title: "قراءة البيانات",
        printedHead: "الدرس ١: قراءة البيانات",
        bookFrom: 2,
        concepts: [
          concept(2, LESSON, "الدرس ١: قراءة البيانات"),
          concept(2, APPLY, "التطبيق"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "جمع وتمثيل البيانات",
        printedHead: "الدرس ٢: جمع وتمثيل البيانات",
        bookFrom: 3,
        concepts: [
          concept(3, LESSON, "الدرس ٢: جمع وتمثيل البيانات"),
          concept(3, APPLY, "التطبيق"),
          concept(4, REFLECT, "تأمل"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "مقارنة البيانات",
        printedHead: "الدرس ٣ : مقارنة البيانات",
        bookFrom: 5,
        concepts: [
          concept(5, LESSON, "الدرس ٣ : مقارنة البيانات"),
          concept(5, APPLY, "التطبيق"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "تمثيل وتفسير البيانات",
        printedHead: "الدرس ٤: تمثيل وتفسير البيانات",
        bookFrom: 6,
        concepts: [
          concept(6, LESSON, "الدرس ٤: تمثيل وتفسير البيانات"),
          concept(6, APPLY, "التطبيق"),
          concept(7, REFLECT, "تأمل"),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "تمثيل البيانات بمقياس 1",
        printedHead: "الدرس 5: تمثيل البيانات بمقياس 1",
        bookFrom: 8,
        concepts: [
          concept(8, LESSON, "الدرس 5: تمثيل البيانات بمقياس 1"),
          concept(8, APPLY, "التطبيق"),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: LESSON,
        title: "تمثيل البيانات بمقياس ٢",
        printedHead: "الدرس ٦: تمثيل البيانات بمقياس ٢",
        bookFrom: 9,
        concepts: [
          concept(9, LESSON, "الدرس ٦: تمثيل البيانات بمقياس ٢"),
          concept(9, APPLY, "التطبيق"),
          concept(10, REFLECT, "تأمل"),
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        type: LESSON,
        title: "تمثيل البيانات بمقياس ١٠",
        printedHead: "الدرس ٧: تمثيل البيانات بمقياس ١٠",
        bookFrom: 11,
        concepts: [
          concept(11, LESSON, "الدرس ٧: تمثيل البيانات بمقياس ١٠"),
          concept(11, APPLY, "التطبيق"),
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "التمثيل البياني بالأعمدة",
        printedHead: "الدرس ٨: التمثيل البياني بالأعمدة",
        bookFrom: 12,
        concepts: [
          concept(12, LESSON, "الدرس ٨: التمثيل البياني بالأعمدة"),
          concept(12, APPLY, "التطبيق"),
        ],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "التمثيل البياني بالصور",
        printedHead: "الدرس ٩: التمثيل البياني بالصور",
        bookFrom: 13,
        concepts: [
          concept(13, LESSON, "الدرس ٩: التمثيل البياني بالصور"),
          concept(13, APPLY, "التطبيق"),
          concept(14, REFLECT, "تأمل"),
        ],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        type: LESSON,
        title: "عناصر التمثيل البياني",
        printedHead: "الدرس ١: عناصر التمثيل البياني",
        bookFrom: 15,
        concepts: [
          concept(15, LESSON, "الدرس ١: عناصر التمثيل البياني"),
          concept(15, APPLY, "التطبيق"),
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
    bookFrom: 16,
    bookTo: 26,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: LESSON,
        title: "الجمع بالمضاعفة",
        printedHead: "الدرس ١: الجمع بالمضاعفة",
        bookFrom: 16,
        concepts: [
          concept(16, LESSON, "الدرس ١: الجمع بالمضاعفة"),
          concept(16, APPLY, "التطبيق"),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "الجمع أو الطرح بالعد",
        printedHead: "الدرس ٢: الجمع أو الطرح بالعد",
        bookFrom: 17,
        concepts: [
          concept(17, LESSON, "الدرس ٢: الجمع أو الطرح بالعد"),
          concept(17, APPLY, "التطبيق"),
          concept(17, REFLECT, "تأمل"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "جمع أو طرح العدد ١٠",
        printedHead: "الدرس ٣: جمع أو طرح العدد ١٠",
        bookFrom: 18,
        concepts: [
          concept(18, LESSON, "الدرس ٣: جمع أو طرح العدد ١٠"),
          concept(18, APPLY, "التطبيق"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "الجمع أو الطرح بتكوين عشرات",
        printedHead: "الدرس ٤: الجمع أو الطرح بتكوين عشرات",
        bookFrom: 19,
        concepts: [
          concept(19, LESSON, "الدرس ٤: الجمع أو الطرح بتكوين عشرات"),
          concept(19, APPLY, "التطبيق"),
          concept(20, REFLECT, "تأمل"),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "مسائل كلامية على الجمع",
        printedHead: "الدرس ٥: مسائل كلامية على الجمع",
        bookFrom: 21,
        concepts: [
          concept(21, LESSON, "الدرس ٥: مسائل كلامية على الجمع"),
          concept(21, APPLY, "التطبيق"),
          concept(21, REFLECT, "تأمل"),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: LESSON,
        title: "مسائل كلامية على الطرح",
        printedHead: "الدرس ٦: مسائل كلامية على الطرح",
        bookFrom: 22,
        concepts: [
          concept(22, LESSON, "الدرس ٦: مسائل كلامية على الطرح"),
          concept(22, APPLY, "التطبيق"),
          concept(22, REFLECT, "تأمل"),
        ],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        type: LESSON,
        title: "تطبيقات ذهنية على الجمع",
        printedHead: "الدرس ٧: تطبيقات ذهنية على الجمع",
        bookFrom: 23,
        concepts: [
          concept(23, LESSON, "الدرس ٧: تطبيقات ذهنية على الجمع"),
          concept(23, APPLY, "التطبيق"),
          concept(23, REFLECT, "تأمل"),
        ],
      },
      {
        key: "2-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "تطبيقات ذهنية على الطرح",
        printedHead: "الدرس ٨: تطبيقات ذهنية على الطرح",
        bookFrom: 24,
        concepts: [
          concept(24, LESSON, "الدرس ٨: تطبيقات ذهنية على الطرح"),
          concept(24, APPLY, "التطبيق"),
        ],
      },
      {
        key: "2-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "تطبيقات ذهنية على الجمع والطرح",
        printedHead: "الدرس ٩: تطبيقات ذهنية على الجمع والطرح",
        bookFrom: 25,
        concepts: [
          concept(25, LESSON, "الدرس ٩: تطبيقات ذهنية على الجمع والطرح"),
          concept(25, APPLY, "التطبيق"),
          concept(25, REFLECT, "تأمل"),
        ],
      },
      {
        key: "2-10",
        ordinal: "العاشر",
        type: LESSON,
        title: "الجمع باستخدام مخطط ١٢٠",
        printedHead: "الدرس ١٠: الجمع باستخدام مخطط ١٢٠",
        bookFrom: 26,
        concepts: [
          concept(26, LESSON, "الدرس ١٠: الجمع باستخدام مخطط ١٢٠"),
          concept(26, APPLY, "التطبيق"),
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
    bookFrom: 27,
    bookTo: 36,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: LESSON,
        title: "الأعداد المكوّنة من ٣ أرقام",
        printedHead: "الدرس ١: الأعداد المكوّنة من ٣ أرقام",
        bookFrom: 27,
        concepts: [
          concept(27, LESSON, "الدرس ١: الأعداد المكوّنة من ٣ أرقام"),
          concept(27, APPLY, "التطبيق"),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "مزيد من الأعداد المكونة من ٣ أرقام",
        printedHead: "الدرس ٢: مزيد من الأعداد المكونة من ٣ أرقام",
        bookFrom: 28,
        concepts: [
          concept(28, LESSON, "الدرس ٢: مزيد من الأعداد المكونة من ٣ أرقام"),
          concept(28, APPLY, "التطبيق"),
          concept(28, REFLECT, "تأمل"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "الصيغة الرمزية والصيغة الممتدة",
        printedHead: "الدرس ٣: الصيغة الرمزية والصيغة الممتدة",
        bookFrom: 29,
        concepts: [
          concept(29, LESSON, "الدرس ٣: الصيغة الرمزية والصيغة الممتدة"),
          concept(29, APPLY, "التطبيق"),
          concept(29, REFLECT, "تأمل"),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "الصيغة الكلامية للأعداد",
        printedHead: "الدرس ٤: الصيغة الكلامية للأعداد",
        bookFrom: 30,
        concepts: [
          concept(30, LESSON, "الدرس ٤: الصيغة الكلامية للأعداد"),
          concept(30, APPLY, "التطبيق"),
          concept(30, REFLECT, "تأمل"),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "مزيد من الصيغة الكلامية للأعداد",
        printedHead: "الدرس ٥: مزيد من الصيغة الكلامية للأعداد",
        bookFrom: 31,
        concepts: [
          concept(31, LESSON, "الدرس ٥: مزيد من الصيغة الكلامية للأعداد"),
          concept(31, APPLY, "التطبيق"),
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: LESSON,
        title: "كتابة الأعداد بصيغ مختلفة",
        printedHead: "الدرس ٦ : كتابة الأعداد بصيغ مختلفة",
        bookFrom: 32,
        concepts: [
          concept(32, LESSON, "الدرس ٦ : كتابة الأعداد بصيغ مختلفة"),
          concept(32, REFLECT, "تأمل"),
        ],
      },
      {
        key: "3-7",
        ordinal: "السابع",
        type: LESSON,
        title: "مقارنة الأعداد",
        printedHead: "الدرس ٧: مقارنة الأعداد",
        bookFrom: 33,
        concepts: [
          concept(33, LESSON, "الدرس ٧: مقارنة الأعداد"),
          concept(33, APPLY, "التطبيق"),
        ],
      },
      {
        key: "3-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "مزيد من مقارنة الأعداد",
        printedHead: "الدرس ٨: مزيد من مقارنة الأعداد",
        bookFrom: 34,
        concepts: [
          concept(34, LESSON, "الدرس ٨: مزيد من مقارنة الأعداد"),
          concept(34, APPLY, "التطبيق"),
          concept(34, REFLECT, "تأمل"),
        ],
      },
      {
        key: "3-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "ترتيب الأعداد",
        printedHead: "الدرس ٩: ترتيب الأعداد",
        bookFrom: 35,
        concepts: [
          concept(35, LESSON, "الدرس ٩: ترتيب الأعداد"),
          concept(35, APPLY, "التطبيق"),
        ],
      },
      {
        key: "3-10",
        ordinal: "العاشر",
        type: LESSON,
        title: "مزيد من ترتيب الأعداد",
        printedHead: "الدرس ١٠: مزيد من ترتيب الأعداد",
        bookFrom: 36,
        concepts: [
          concept(36, LESSON, "الدرس ١٠: مزيد من ترتيب الأعداد"),
          concept(36, APPLY, "التطبيق"),
          concept(36, REFLECT, "تأمل"),
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
    bookFrom: 37,
    bookTo: 54,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: LESSON,
        title: "خاصية الإبدال في عملية الجمع",
        printedHead: "الدرس ١: خاصية الإبدال في عملية الجمع",
        bookFrom: 37,
        concepts: [
          concept(37, LESSON, "الدرس ١: خاصية الإبدال في عملية الجمع"),
          concept(37, APPLY, "التطبيق"),
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "مزيد من التطبيقات الذهنية على الجمع والطرح",
        printedHead: "الدرس ٢: مزيد من التطبيقات الذهنية على الجمع والطرح",
        bookFrom: 38,
        concepts: [
          concept(38, LESSON, "الدرس ٢: مزيد من التطبيقات الذهنية على الجمع والطرح"),
          concept(38, APPLY, "التطبيق"),
          concept(39, REFLECT, "تأمل"),
        ],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "تحليل الأعداد إلى آحاد وعشرات",
        printedHead: "الدرس ٣: تحليل الأعداد إلى آحاد وعشرات",
        bookFrom: 40,
        concepts: [
          concept(40, LESSON, "الدرس ٣: تحليل الأعداد إلى آحاد وعشرات"),
          concept(40, APPLY, "التطبيق"),
        ],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "الجمع بدون إعادة التجميع",
        printedHead: "الدرس 4 : الجمع بدون إعادة التجميع",
        bookFrom: 42,
        concepts: [
          concept(42, LESSON, "الدرس 4 : الجمع بدون إعادة التجميع"),
          concept(42, APPLY, "التطبيق"),
          concept(44, REFLECT, "تأمل"),
        ],
      },
      {
        key: "4-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "الطرح بدون إعادة التجميع",
        printedHead: "الدرس ٥ : الطرح بدون إعادة التجميع",
        bookFrom: 45,
        concepts: [
          concept(45, LESSON, "الدرس ٥ : الطرح بدون إعادة التجميع"),
          concept(45, APPLY, "التطبيق"),
          concept(47, REFLECT, "تأمل"),
        ],
      },
      {
        key: "4-6",
        ordinal: "السادس",
        type: LESSON,
        title: "تقدير نواتج الجمع والطرح",
        printedHead: "الدرس ٦: تقدير نواتج الجمع والطرح",
        bookFrom: 48,
        concepts: [
          concept(48, LESSON, "الدرس ٦: تقدير نواتج الجمع والطرح"),
          concept(48, APPLY, "التطبيق"),
        ],
      },
      {
        key: "4-7",
        ordinal: "السابع",
        type: LESSON,
        title: "مقارنة المجموع والتقدير",
        printedHead: "الدرس ٧: مقارنة المجموع والتقدير",
        bookFrom: 49,
        concepts: [
          concept(49, LESSON, "الدرس ٧: مقارنة المجموع والتقدير"),
          concept(49, APPLY, "التطبيق"),
        ],
      },
      {
        key: "4-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "الجمع بإعادة تجميع الآحاد",
        printedHead: "الدرس ٨: الجمع بإعادة تجميع الآحاد",
        bookFrom: 50,
        concepts: [
          concept(50, LESSON, "الدرس ٨: الجمع بإعادة تجميع الآحاد"),
          concept(50, APPLY, "التطبيق"),
          concept(51, REFLECT, "تأمل"),
        ],
      },
      {
        key: "4-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "مزيد من الجمع بإعادة تجميع الآحاد",
        printedHead: "الدرس ٩: مزيد من الجمع بإعادة تجميع الآحاد",
        bookFrom: 52,
        concepts: [
          concept(52, LESSON, "الدرس ٩: مزيد من الجمع بإعادة تجميع الآحاد"),
          concept(52, APPLY, "التطبيق"),
        ],
      },
      {
        key: "4-10",
        ordinal: "العاشر",
        type: LESSON,
        title: "جمع أكثر من عددين بإعادة تجميع الآحاد",
        printedHead: "الدرس ١٠: جمع أكثر من عددين بإعادة تجميع الآحاد",
        bookFrom: 53,
        concepts: [
          concept(53, LESSON, "الدرس ١٠: جمع أكثر من عددين بإعادة تجميع الآحاد"),
          concept(53, APPLY, "التطبيق"),
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
    bookFrom: 55,
    bookTo: 68,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: LESSON,
        title: "خواص الأشكال الهندسية",
        printedHead: "الدرس 1: خواص الأشكال الهندسية",
        bookFrom: 55,
        concepts: [
          concept(55, LESSON, "الدرس 1: خواص الأشكال الهندسية"),
          concept(55, APPLY, "التطبيق"),
        ],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "تصنيف الأشكال الهندسية",
        printedHead: "الدرس ٢: تصنيف الأشكال الهندسية",
        bookFrom: 56,
        concepts: [
          concept(56, LESSON, "الدرس ٢: تصنيف الأشكال الهندسية"),
          concept(56, APPLY, "التطبيق"),
          concept(56, REFLECT, "تأمل"),
        ],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "رسم الأشكال الهندسية",
        printedHead: "درس ٣: رسم الأشكال الهندسية",
        bookFrom: 57,
        concepts: [
          concept(57, LESSON, "درس ٣: رسم الأشكال الهندسية"),
          concept(57, APPLY, "التطبيق"),
          concept(58, REFLECT, "تأمل"),
        ],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "تكوين صورة باستخدام أشكال هندسية",
        printedHead: "درس ٤: تكوين صورة باستخدام أشكال هندسية",
        bookFrom: 59,
        concepts: [
          concept(59, LESSON, "درس ٤: تكوين صورة باستخدام أشكال هندسية"),
          concept(59, APPLY, "التطبيق"),
        ],
      },
      {
        key: "5-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "قياس الأطوال بالسنتيمترات الكاملة",
        printedHead: "الدرس ٥: قياس الأطوال بالسنتيمترات الكاملة",
        bookFrom: 60,
        concepts: [
          concept(60, LESSON, "الدرس ٥: قياس الأطوال بالسنتيمترات الكاملة"),
          concept(60, APPLY, "التطبيق"),
        ],
      },
      {
        key: "5-6",
        ordinal: "السادس",
        type: LESSON,
        title: "تقدير الأطوال",
        printedHead: "الدرس ٦: تقدير الأطوال",
        bookFrom: 62,
        concepts: [
          concept(62, LESSON, "الدرس ٦: تقدير الأطوال"),
          concept(62, APPLY, "التطبيق"),
          concept(62, REFLECT, "تأمل"),
        ],
      },
      {
        key: "5-7",
        ordinal: "السابع",
        type: LESSON,
        title: "قياس طول ضلع الشكل الهندسي",
        printedHead: "الدرس ٧: قياس طول ضلع الشكل الهندسي",
        bookFrom: 63,
        concepts: [
          concept(63, LESSON, "الدرس ٧: قياس طول ضلع الشكل الهندسي"),
          concept(63, APPLY, "التطبيق"),
        ],
      },
      {
        key: "5-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "خواص الأشكال ثلاثية الأبعاد",
        printedHead: "الدرس ٨: خواص الأشكال ثلاثية الأبعاد",
        bookFrom: 64,
        concepts: [
          concept(64, LESSON, "الدرس ٨: خواص الأشكال ثلاثية الأبعاد"),
          concept(64, APPLY, "التطبيق"),
          concept(64, REFLECT, "تأمل"),
        ],
      },
      {
        key: "5-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "تصنيف الأشكال ثلاثية الأبعاد",
        printedHead: "الدرس ٩: تصنيف الأشكال ثلاثية الأبعاد",
        bookFrom: 65,
        concepts: [
          concept(65, LESSON, "الدرس ٩: تصنيف الأشكال ثلاثية الأبعاد"),
          concept(65, APPLY, "التطبيق"),
          concept(67, REFLECT, "تأمل"),
        ],
      },
      {
        key: "5-10",
        ordinal: "العاشر",
        type: LESSON,
        title: "تكوين أشكال ثلاثية الأبعاد",
        printedHead: "الدرس ١٠: تكوين أشكال ثلاثية الأبعاد",
        bookFrom: 68,
        concepts: [
          concept(68, LESSON, "الدرس ١٠: تكوين أشكال ثلاثية الأبعاد"),
          concept(68, APPLY, "التطبيق"),
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
    bookFrom: 69,
    bookTo: 87,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: LESSON,
        title: "قياس الكتلة",
        printedHead: "الدرس ١: قياس الكتلة",
        bookFrom: 69,
        concepts: [
          concept(69, LESSON, "الدرس ١: قياس الكتلة"),
          concept(69, APPLY, "التطبيق"),
          concept(70, REFLECT, "تأمل"),
        ],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "وحدات قياس الكتلة",
        printedHead: "الدرس ٢: وحدات قياس الكتلة",
        bookFrom: 71,
        concepts: [
          concept(71, LESSON, "الدرس ٢: وحدات قياس الكتلة"),
          concept(71, APPLY, "التطبيق"),
        ],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "تطبيقات على قياس الكتلة",
        printedHead: "الدرس ٣: تطبيقات على قياس الكتلة",
        bookFrom: 72,
        concepts: [
          concept(72, LESSON, "الدرس ٣: تطبيقات على قياس الكتلة"),
          concept(72, APPLY, "التطبيق"),
          concept(74, REFLECT, "تأمل"),
        ],
      },
      {
        key: "6-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "مزيد من التطبيقات على قياس الكتلة",
        printedHead: "الدرس ٤: مزيد من التطبيقات على قياس الكتلة",
        bookFrom: 75,
        concepts: [
          concept(75, LESSON, "الدرس ٤: مزيد من التطبيقات على قياس الكتلة"),
          concept(75, APPLY, "التطبيق"),
        ],
      },
      {
        key: "6-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "الوقت صباحًا ومساءً",
        printedHead: "الدرس ٥: الوقت صباحًا ومساءً",
        bookFrom: 78,
        concepts: [
          concept(78, LESSON, "الدرس ٥: الوقت صباحًا ومساءً"),
          concept(78, APPLY, "التطبيق"),
          concept(79, REFLECT, "تأمل"),
        ],
      },
      {
        key: "6-6",
        ordinal: "السادس",
        type: LESSON,
        title: "إنشاء ساعة حائط",
        printedHead: "الدرس ٦: إنشاء ساعة حائط",
        bookFrom: 80,
        concepts: [
          concept(80, LESSON, "الدرس ٦: إنشاء ساعة حائط"),
          concept(80, APPLY, "التطبيق"),
        ],
      },
      {
        key: "6-7",
        ordinal: "السابع",
        type: LESSON,
        title: "الوقت بنصف الساعة",
        printedHead: "الدرس ٧: الوقت بنصف الساعة",
        bookFrom: 81,
        concepts: [
          concept(81, LESSON, "الدرس ٧: الوقت بنصف الساعة"),
          concept(81, REFLECT, "تأمل"),
        ],
      },
      {
        key: "6-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "تطبيقات على الوقت",
        printedHead: "الدرس ٨: تطبيقات على الوقت",
        bookFrom: 82,
        concepts: [
          concept(82, LESSON, "الدرس ٨: تطبيقات على الوقت"),
          concept(82, APPLY, "التطبيق"),
        ],
      },
      {
        key: "6-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "الوقت بالدقائق",
        printedHead: "الدرس ٩: الوقت بالدقائق",
        bookFrom: 83,
        concepts: [
          concept(83, LESSON, "الدرس ٩: الوقت بالدقائق"),
          concept(83, APPLY, "التطبيق"),
          concept(85, REFLECT, "تأمل"),
        ],
      },
      {
        key: "6-10",
        ordinal: "العاشر",
        type: LESSON,
        title: "مزيد من التطبيقات على الوقت",
        printedHead: "الدرس ١٠: مزيد من التطبيقات على الوقت",
        bookFrom: 86,
        concepts: [
          concept(86, LESSON, "الدرس ١٠: مزيد من التطبيقات على الوقت"),
          concept(86, APPLY, "التطبيق"),
          concept(87, REFLECT, "تأمل"),
        ],
      },
    ],
  },
];

/**
 * The book-page span a lesson owns: from the chapter opener (its first lesson)
 * or its own head page, down to the page before the next lesson starts, bounded
 * by the chapter. A band that recurs on the following page belongs to this
 * lesson, so the ranges tile [2, 87] exactly and no reachable content sits
 * outside a lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_MATH_G2_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_G2_T1_UNITS.forEach((section, si) => {
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
  "math-g2-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (Only scan 2 — a blank verso outside the term — needs it, but the
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
  const lesson = EGYPT_MATH_G2_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
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
 * the footer line carrying «الصف الثاني الابتدائي» (the number stands before or
 * after the words, in Arabic-Indic or Latin digits), or — where the footer was
 * split across lines — as a bare numeral in the last three lines. Every
 * foot-looking line is read; body numbers (chart cells, ruler marks, answers)
 * never stand on such a line, so they can never be mistaken for a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const tail = lines.slice(-3);
  const out = new Set<number>();
  for (const line of tail) {
    if (/^[0-9٠-٩۰-۹]+$/.test(line)) {
      const n = Number(toLatinDigits(line).replace(/\D/g, ""));
      if (n > 0) out.add(n);
      continue;
    }
    if (line.includes("الصف الثاني")) {
      const latin = toLatinDigits(line)
        .replace(/[^0-9]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      for (const tok of latin.split(" ")) {
        if (!tok) continue;
        const n = Number(tok);
        if (n > 0) out.add(n);
      }
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
 * printed instead — measured, not guessed. Book 61 prints «٦١» but the text
 * layer transposed it to «١٦» (a bare numeral in the last three lines); every
 * other parseable footer matches its page number exactly, which is what fixes
 * the offset. Listing the exception keeps the check strict instead of
 * statistical.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {
  61: 16,
};

/**
 * The term pages that print no parseable folio in the OCR, each with the anchor
 * the check accepts in place of a page number. Every anchor is a head the page
 * itself prints: book 4 (the تأمل page whose footer line carries no number),
 * books 7 and 17 (folios read as the Latin «V»/«IV»), book 26 (the مخطط-١٢٠
 * chart whose footer line carries no number), book 55 (folio read as «00») and
 * book 71 (folio read as the Latin «VI»).
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  4: "اكتب أو ارسم ٣ أشياء لاحظتها",
  7: "سجل بيانات الفصل",
  17: "استخدم إستراتيجية الرياضيات الذهنية",
  26: "الجمع باستخدام مخطط ١٢٠",
  55: "خواص الأشكال الهندسية",
  71: "وحدات قياس الكتلة",
};

/** Every head kind the table may use: the lesson-head kind plus the band kinds. */
const KNOWN_KINDS = new Set([
  "الدرس",
  "التطبيق",
  "تأمل",
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
  const units = EGYPT_MATH_G2_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_MATH_G2_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_MATH_G2_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (lastUnit && lastUnit.bookTo !== EGYPT_MATH_G2_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_MATH_G2_T1_BOOK_END}، وجدنا ${lastUnit.bookTo}`);
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
 *  4. every printed page in [2, 87] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR’d
 *     page of the term.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_MATH_G2_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_G2_T1_BOOK_START || book > EGYPT_MATH_G2_T1_BOOK_END) continue;
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
  for (let p = EGYPT_MATH_G2_T1_BOOK_START; p <= EGYPT_MATH_G2_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
