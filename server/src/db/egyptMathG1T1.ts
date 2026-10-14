// Primary 1 (الصف الأول الابتدائي) Mathematics (الرياضيات), first term,
// Ministry 2025/2026 edition (cover prints the ٢٠٢٥ / ٢٠٢٦ school year).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g1-math`, subject `math` (name "Mathematics", nameAr "الرياضيات"),
// lesson prefix `l-g1-math-`.
//
// The curriculum tree for the Egypt `eg-g1-math` curriculum is rebuilt from
// the Ministry textbook `الرياضيات — الصف الأول الابتدائي — الفصل الدراسي
// الأول` (96 scanned pages). This module is the single source of truth for
// its structure: the nine printed فصول of the first term, their numbered
// printed دروس (forty lessons), and, for every lesson, the book's own
// printed heads — the درس head plus the activity-flow heads the lesson
// prints (نشير ونتعلم / نلاحظ / استعدوا يا أصدقائي / طريقة الحل /
// وقت المحاولة / هيا نتدرب سويًا) — verbatim and with the printed page
// they start on. The self-checks at the bottom prove that mapping against
// the OCR itself, page by page.
//
// THE OFFSET IS ZERO — book page = scan page
// Every content page prints its own folio as a bare numeral on its last
// line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted
// here: scan 6 prints «٦» (book 6), scan 14 prints «١٤» (book 14), scan 32
// prints «٣٢» (book 32), scan 44 prints «٤٤» (book 44), scan 54 prints
// «٥٤» (book 54), scan 68 prints «٦٨» (book 68), scan 80 prints «٨٠»
// (book 80) and scan 93 prints «۹۳» (book 93). The book's own «المحتويات»
// (scan 5) independently confirms it: it lists «الفصل 1 … ٦», «الفصل 2 …
// ٣٢», «الفصل 3 … ٣٦», «الفصل 4 … ٤٤», «الفصل 5 … ٥٤», «الفصل 6 … ٦٠»,
// «الفصل 7 … ٧٢», «الفصل 8 … ٨٦» and «الفصل 9 … ٨٨» — every chapter opener
// sits exactly where the contents says it does.
//
// TERM = REAL CONTENT ONLY (books 6–93)
// Scan pages 1–5 are before the term: the cover (1), the team credits (2),
// the «مقدمة» (3), the «هيا نتعلم معًا!» characters page (4) and the
// year-wide «المحتويات» (5). The term runs from the chapter 1 opener
// (book 6 = scan 6) to the last practice page of lesson 9-3 (book 93 =
// scan 93): `EGYPT_MATH_G1_T1_BOOK_START` / `_END` are exactly those two
// pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` therefore equals 93 − 6 + 1 = 88. Scan pages
// 94–96 are after the term: two «ملاحظات» pages (94–95) and the back cover
// with the print specs (96).
//
// THIRTEEN TERM PAGES PRINT NO PARSEABLE FOLIO — EACH HAS A NAMED ANCHOR
// The vision OCR lost the folio of thirteen pages: books 7 and 17 print
// «٧»/«١٧» but the OCR read them as the Latin letters «V»/«IV»; books 71
// and 78 the same («٧١»→«VI», «٧٨»→«VA»); books 42 and 72 print their
// folio but the OCR duplicated a neighbour's («٤٣» on both 42 and 43, «٧٣»
// on both 72 and 73); book 60 prints «٦٠» but the OCR kept only «٦»; book
// 34 prints its folio «٣٤» at the top of the page instead of the foot; and
// books 50, 57, 74, 84 and 89 print no folio line at all in the OCR.
// Rather than weaken the page-number check, all thirteen are exempt from
// it and anchored on a string the page itself prints, named in
// `FOLIO_LESS_ANCHORS`. Every other term page proves its number from its
// last line, which must be a bare numeral equal to its own book number —
// so body numbers (exercise counts, chart labels) can never be mistaken
// for a folio.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every numbered درس contributes its head line (number + title, exactly as
// the opener prints it) plus the activity-flow heads the lesson prints:
// the lead («نشير ونتعلم» / «نلاحظ!» / «لاحظ!») where the opener has one,
// «استعدوا يا أصدقائي», «طريقة الحل» where the opener has one,
// «وقت المحاولة» on the lesson's second page and «هيا نتدرب سويًا» on the
// page its practice starts on. Nothing is invented: every concept title
// below is a string the book itself prints on the page its `bookFrom`
// names (vocalisation of «هيا نتدرب سويًا» varies هيّا/هيَّا/سويا/سويًّا from
// page to page; `normalize` folds it, as it folds the tatweel the book
// spreads through «نشير ونتعلـم». The practice pages that merely continue
// colouring (books 63, 67, 71, 79) print no head of their own, so they
// carry no concept — they are still owned by their lesson's range).
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// Lesson numbers mix Arabic-Indic («١-٢»), Extended («۳۱») and Latin («1-1»,
// «1-9», «65») digits; the opener of 1-3 prints «٣-١» (scan 10) while its
// second page prints «١-٣» (scan 11); the same bidi flip hits the openers
// of 5-3 («3-5», scan 58), 8-1 («١-٨», scan 86) and 9-3 («٣-٩», scan 92),
// and both pages of 7-5 print «٥-٧» (scans 82–83) — sequence fixes them as
// 1-3, 5-3, 8-1, 9-3 and 7-5, and the heads are stored exactly as each
// opener prints them. The two-digit numbers of lessons 1-10 («١-١», scans
// 24–25), 1-11 («١-١», scans 26–27), 1-12 («١-١», scan 28) and 1-13 («١-٣»،
// scan 30) are truncated in the OCR; the continuation of 1-13 (scan 31)
// prints «١-١٣» in full. Scan 68 prints «هيا نققارن النتائج» with a doubled
// قاف (stored verbatim); scans 69–71 print it single. Scan 58 prints
// «للاحظ!» with a doubled لام (stored verbatim). Scan 34 prints its folio
// at the top of the page. Scan 59 writes «کم» with a Farsi kaf. None of
// these changes what any page prints: the checks below verify every head
// against the OCR text itself.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 0 (verified: book p.93 = scan p.93). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the term — the chapter 1 opener (scan 6). */
export const EGYPT_MATH_G1_T1_BOOK_START = 6;

/** Last printed page of the term — lesson 9-3's practice page (scan 93). */
export const EGYPT_MATH_G1_T1_BOOK_END = 93;

/** The scanned pages before the term: cover, credits, مقدمة, characters, محتويات. */
export const EGYPT_MATH_G1_T1_FRONT_MATTER = { from: 1, to: 5 } as const;

/** The scanned pages after the term: two ملاحظات pages and the back cover. */
export const EGYPT_MATH_G1_T1_BACK_MATTER = { from: 94, to: 96 } as const;

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface MathG1T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «نشاط». */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson («درس» = one numbered lesson of a chapter). */
export interface MathG1T1Lesson {
  /** App-addressable key, e.g. "5-3" (chapter 5, lesson 3). */
  key: string;
  /** Arabic ordinal of the lesson number, e.g. "الثالث". */
  ordinal: string;
  /** The lesson's opening head type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson (without the number prefix). */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: MathG1T1Concept[];
}

/** One printed chapter of the book — one of the nine فصول of the first term. */
export interface MathG1T1Section {
  /** This book's sections are its chapters (فصول). */
  kind: "chapter";
  /** Internal key: "1"…"9", in book order. */
  key: string;
  /** Arabic ordinal of the chapter as the book prints it, e.g. "الثاني". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الفصل الأول: الأعداد حتى 10". */
  title: string;
  /** The chapter head the opener page prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next opener). */
  bookTo: number;
  lessons: MathG1T1Lesson[];
}

const TYPE = "نشاط";

function concept(bookFrom: number, title: string): MathG1T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The nine chapters of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and checked
 * by `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter starts come from the book's «المحتويات» (scan 5): 6, 32, 36, 44,
 * 54, 60, 72, 86, 88. Lesson numbers restart in every chapter (١-١ … ١-١٣،
 * ٢-١ …) exactly as the book prints them on each lesson opener; where the
 * OCR truncated or flipped a number (see header notes) the head is stored
 * exactly as the opener prints it and the key follows the sequence.
 */
export const EGYPT_MATH_G1_T1_UNITS: MathG1T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "الفصل الأول: الأعداد حتى 10",
    printedHead: "الفصل الأول الأعداد حتى 10",
    bookFrom: 6,
    bookTo: 31,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "كم العدد ؟",
        printedHead: "1-1 كم العدد ؟",
        bookFrom: 6,
        concepts: [
          concept(6, "1-1 كم العدد ؟"),
          concept(6, "استعدوا يا أصدقائي"),
          concept(7, "وقت المحاولة"),
          concept(7, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الأعداد من ١ إلى ٥",
        printedHead: "١-٢ الأعداد من ١ إلى ٥",
        bookFrom: 8,
        concepts: [
          concept(8, "١-٢ الأعداد من ١ إلى ٥"),
          concept(8, "نشير ونتعلم"),
          concept(8, "استعدوا يا أصدقائي"),
          concept(9, "وقت المحاولة"),
          concept(9, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "هيا نعد (من ١ إلى ٥)",
        printedHead: "٣-١ هيا نعد (من ١ إلى ٥)",
        bookFrom: 10,
        concepts: [
          concept(10, "٣-١ هيا نعد (من ١ إلى ٥)"),
          concept(10, "نشير ونتعلم"),
          concept(10, "استعدوا يا أصدقائي"),
          concept(10, "طريقة الحل"),
          concept(11, "وقت المحاولة"),
          concept(11, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "ما مكونات العدد ٥؟",
        printedHead: "١-٤ ما مكونات العدد ٥؟",
        bookFrom: 12,
        concepts: [
          concept(12, "١-٤ ما مكونات العدد ٥؟"),
          concept(12, "نشير ونتعلم"),
          concept(12, "استعدوا يا أصدقائي"),
          concept(12, "طريقة الحل"),
          concept(13, "وقت المحاولة"),
          concept(13, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "الأعداد من ٦ إلى ١٠",
        printedHead: "١-٥ الأعداد من ٦ إلى ١٠",
        bookFrom: 14,
        concepts: [
          concept(14, "١-٥ الأعداد من ٦ إلى ١٠"),
          concept(14, "نشير ونتعلم"),
          concept(14, "استعدوا يا أصدقائي"),
          concept(15, "وقت المحاولة"),
          concept(15, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: TYPE,
        title: "هيا نعد! (من ٦ إلى ١٠)",
        printedHead: "١-٦ هيا نعد! (من ٦ إلى ١٠)",
        bookFrom: 16,
        concepts: [
          concept(16, "١-٦ هيا نعد! (من ٦ إلى ١٠)"),
          concept(16, "نشير ونتعلم"),
          concept(16, "استعدوا يا أصدقائي"),
          concept(16, "طريقة الحل"),
          concept(17, "وقت المحاولة"),
          concept(17, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        type: TYPE,
        title: "ما مكونات العدد ٦؟",
        printedHead: "١-٧ ما مكونات العدد ٦؟",
        bookFrom: 18,
        concepts: [
          concept(18, "١-٧ ما مكونات العدد ٦؟"),
          concept(18, "نشير ونتعلم"),
          concept(18, "استعدوا يا أصدقائي"),
          concept(18, "طريقة الحل"),
          concept(19, "وقت المحاولة"),
          concept(19, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        type: TYPE,
        title: "ما مكونات العدد ٧؟",
        printedHead: "١-٨ ما مكونات العدد ٧؟",
        bookFrom: 20,
        concepts: [
          concept(20, "١-٨ ما مكونات العدد ٧؟"),
          concept(20, "نشير ونتعلم"),
          concept(20, "استعدوا يا أصدقائي"),
          concept(20, "طريقة الحل"),
          concept(21, "وقت المحاولة"),
          concept(21, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        type: TYPE,
        title: "ما مكونات العدد ٨؟",
        printedHead: "١-٩ ما مكونات العدد ٨؟",
        bookFrom: 22,
        concepts: [
          concept(22, "١-٩ ما مكونات العدد ٨؟"),
          concept(22, "نشير ونتعلم"),
          concept(22, "استعدوا يا أصدقائي"),
          concept(22, "طريقة الحل"),
          concept(23, "وقت المحاولة"),
          concept(23, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        type: TYPE,
        title: "ما مكونات العدد 9؟",
        printedHead: "١-١ ما مكونات العدد 9؟",
        bookFrom: 24,
        concepts: [
          concept(24, "١-١ ما مكونات العدد 9؟"),
          concept(24, "نشير ونتعلم"),
          concept(24, "استعدوا يا أصدقائي"),
          concept(24, "طريقة الحل"),
          concept(25, "وقت المحاولة"),
          concept(25, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "1-11",
        ordinal: "الحادي عشر",
        type: TYPE,
        title: "ما مكونات العدد ١٠؟",
        printedHead: "١-١ ما مكونات العدد ١٠؟",
        bookFrom: 26,
        concepts: [
          concept(26, "١-١ ما مكونات العدد ١٠؟"),
          concept(26, "نشير ونتعلم"),
          concept(26, "استعدوا يا أصدقائي"),
          concept(26, "طريقة الحل"),
          concept(27, "وقت المحاولة"),
          concept(27, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "1-12",
        ordinal: "الثاني عشر",
        type: TYPE,
        title: "هيا نقارن الأعداد",
        printedHead: "١-١ هيا نقارن الأعداد",
        bookFrom: 28,
        concepts: [
          concept(28, "١-١ هيا نقارن الأعداد"),
          concept(28, "نشير ونتعلم"),
          concept(28, "استعدوا يا أصدقائي"),
          concept(28, "طريقة الحل"),
          concept(29, "وقت المحاولة"),
          concept(29, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "1-13",
        ordinal: "الثالث عشر",
        type: TYPE,
        title: "العدد صفر",
        printedHead: "١-٣ العدد صفر",
        bookFrom: 30,
        concepts: [
          concept(30, "١-٣ العدد صفر"),
          concept(30, "نشير ونتعلم"),
          concept(30, "استعدوا يا أصدقائي"),
          concept(30, "طريقة الحل"),
          concept(31, "وقت المحاولة"),
          concept(31, "هيا نتدرب سويًا"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "الثاني",
    title: "الفصل الثاني: ما هو الموقع؟",
    printedHead: "الفصل الثاني ما هو الموقع؟",
    bookFrom: 32,
    bookTo: 35,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "حدد الموقع",
        printedHead: "٢-١ حدد الموقع",
        bookFrom: 32,
        concepts: [
          concept(32, "٢-١ حدد الموقع"),
          concept(32, "نشير ونتعلم"),
          concept(32, "استعدوا يا أصدقائي"),
          concept(32, "طريقة الحل"),
          concept(33, "وقت المحاولة"),
          concept(33, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "أين هو؟",
        printedHead: "أين هو؟ ٢-٢",
        bookFrom: 34,
        concepts: [
          concept(34, "أين هو؟ ٢-٢"),
          concept(34, "نشير ونتعلم"),
          concept(34, "استعدوا يا أصدقائي"),
          concept(34, "طريقة الحل"),
          concept(35, "وقت المحاولة"),
          concept(35, "هيا نتدرب سويًا"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "الثالث",
    title: "الفصل الثالث: الجمع",
    printedHead: "الفصل الثالث الجمع",
    bookFrom: 36,
    bookTo: 43,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الجمع (الجزء الأول)",
        printedHead: "٣-١ الجمع (الجزء الأول)",
        bookFrom: 36,
        concepts: [
          concept(36, "٣-١ الجمع (الجزء الأول)"),
          concept(36, "نلاحظ!"),
          concept(36, "استعدوا يا أصدقائي"),
          concept(36, "طريقة الحل"),
          concept(37, "وقت المحاولة"),
          concept(37, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الجمع (الجزء الثاني)",
        printedHead: "٣-٢ الجمع (الجزء الثاني)",
        bookFrom: 38,
        concepts: [
          concept(38, "٣-٢ الجمع (الجزء الثاني)"),
          concept(38, "نلاحظ!"),
          concept(38, "استعدوا يا أصدقائي"),
          concept(38, "طريقة الحل"),
          concept(39, "وقت المحاولة"),
          concept(39, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: 'الجمع مع العدد صفر "٠"',
        printedHead: '٣-٣ الجمع مع العدد صفر "٠"',
        bookFrom: 40,
        concepts: [
          concept(40, '٣-٣ الجمع مع العدد صفر "٠"'),
          concept(40, "نلاحظ!"),
          concept(40, "استعدوا يا أصدقائي"),
          concept(40, "طريقة الحل"),
          concept(41, "وقت المحاولة"),
          concept(41, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "قصص الجمع",
        printedHead: "٣-٤ قصص الجمع",
        bookFrom: 42,
        concepts: [
          concept(42, "٣-٤ قصص الجمع"),
          concept(42, "استعدوا يا أصدقائي"),
          concept(43, "وقت المحاولة"),
          concept(43, "هيا نتدرب سويًا"),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "الرابع",
    title: "الفصل الرابع: الطرح",
    printedHead: "الفصل الرابع الطرح",
    bookFrom: 44,
    bookTo: 53,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الطرح (الجزء الأول)",
        printedHead: "٤-١ الطرح (الجزء الأول)",
        bookFrom: 44,
        concepts: [
          concept(44, "٤-١ الطرح (الجزء الأول)"),
          concept(44, "نلاحظ!"),
          concept(44, "استعدوا يا أصدقائي"),
          concept(44, "طريقة الحل"),
          concept(45, "وقت المحاولة"),
          concept(45, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الطرح (الجزء الثاني)",
        printedHead: "٤-٢ الطرح (الجزء الثاني)",
        bookFrom: 46,
        concepts: [
          concept(46, "٤-٢ الطرح (الجزء الثاني)"),
          concept(46, "نلاحظ!"),
          concept(46, "استعدوا يا أصدقائي"),
          concept(46, "طريقة الحل"),
          concept(47, "وقت المحاولة"),
          concept(47, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: 'الطرح مع العدد صفر "٠"',
        printedHead: '٤-٣ الطرح مع العدد صفر "٠"',
        bookFrom: 48,
        concepts: [
          concept(48, '٤-٣ الطرح مع العدد صفر "٠"'),
          concept(48, "نلاحظ!"),
          concept(48, "استعدوا يا أصدقائي"),
          concept(48, "طريقة الحل"),
          concept(49, "وقت المحاولة"),
          concept(49, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "ما الفرق؟",
        printedHead: "٤-٤ ما الفرق؟",
        bookFrom: 50,
        concepts: [
          concept(50, "٤-٤ ما الفرق؟"),
          concept(50, "نلاحظ!"),
          concept(50, "استعدوا يا أصدقائي"),
          concept(50, "طريقة الحل"),
          concept(51, "وقت المحاولة"),
          concept(51, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "4-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "قصص الطرح",
        printedHead: "٤-٥ قصص الطرح",
        bookFrom: 52,
        concepts: [
          concept(52, "٤-٥ قصص الطرح"),
          concept(52, "استعدوا يا أصدقائي"),
          concept(53, "وقت المحاولة"),
          concept(53, "هيا نتدرب سويًا"),
        ],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "الخامس",
    title: "الفصل الخامس: مقارنة الأطوال",
    printedHead: "الفصل الخامس مقارنة الأطوال",
    bookFrom: 54,
    bookTo: 59,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: TYPE,
        title: "أيهما أطول؟",
        printedHead: "٥-١ أيهما أطول؟",
        bookFrom: 54,
        concepts: [
          concept(54, "٥-١ أيهما أطول؟"),
          concept(54, "لاحظ!"),
          concept(54, "استعدوا يا أصدقائي"),
          concept(54, "طريقة الحل"),
          concept(55, "وقت المحاولة"),
          concept(55, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "كيف يمكننا القياس؟",
        printedHead: "٥-٢ كيف يمكننا القياس؟",
        bookFrom: 56,
        concepts: [
          concept(56, "٥-٢ كيف يمكننا القياس؟"),
          concept(56, "لاحظ!"),
          concept(56, "استعدوا يا أصدقائي"),
          concept(56, "طريقة الحل"),
          concept(57, "وقت المحاولة"),
          concept(57, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "هيا نقارن الأطوال",
        printedHead: "3-5 هيا نقارن الأطوال",
        bookFrom: 58,
        concepts: [
          concept(58, "3-5 هيا نقارن الأطوال"),
          concept(58, "للاحظ!"),
          concept(58, "استعدوا يا أصدقائي"),
          concept(58, "طريقة الحل"),
          concept(59, "وقت المحاولة"),
          concept(59, "هيا نتدرب سويًا"),
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "chapter",
    ordinal: "السادس",
    title: "الفصل السادس: تمثيل البيانات",
    printedHead: "الفصل السادس تمثيل البيانات",
    bookFrom: 60,
    bookTo: 71,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: TYPE,
        title: "تمثيل البيانات بالصور",
        printedHead: "٦-١ تمثيل البيانات بالصور",
        bookFrom: 60,
        concepts: [
          concept(60, "٦-١ تمثيل البيانات بالصور"),
          concept(60, "نلاحظ!"),
          concept(60, "استعدوا يا أصدقائي"),
          concept(60, "طريقة الحل"),
          concept(61, "وقت المحاولة"),
          concept(62, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "ما نتعلمه من النتائج",
        printedHead: "٦-٢ ما نتعلمه من النتائج",
        bookFrom: 64,
        concepts: [
          concept(64, "٦-٢ ما نتعلمه من النتائج"),
          concept(64, "لاحظ!"),
          concept(64, "استعدوا يا أصدقائي"),
          concept(64, "طريقة الحل"),
          concept(65, "وقت المحاولة"),
          concept(66, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "هيا نققارن النتائج",
        printedHead: "٦- ٣ هيا نققارن النتائج",
        bookFrom: 68,
        concepts: [
          concept(68, "٦- ٣ هيا نققارن النتائج"),
          concept(68, "نلاحظ!"),
          concept(68, "استعدوا يا أصدقائي"),
          concept(68, "طريقة الحل"),
          concept(69, "وقت المحاولة"),
          concept(70, "هيا نتدرب سويًا"),
        ],
      },
    ],
  },
  {
    key: "7",
    kind: "chapter",
    ordinal: "السابع",
    title: "الفصل السابع: الأعداد الأكبر من ١٠",
    printedHead: "الفصل السابع الأعداد الأكبر من ١٠",
    bookFrom: 72,
    bookTo: 85,
    lessons: [
      {
        key: "7-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الأعداد حتى ٢٠",
        printedHead: "٧-١ الأعداد حتى ٢٠",
        bookFrom: 72,
        concepts: [
          concept(72, "٧-١ الأعداد حتى ٢٠"),
          concept(72, "نشير ونتعلم"),
          concept(72, "استعدوا يا أصدقائي"),
          concept(72, "طريقة الحل"),
          concept(73, "وقت المحاولة"),
          concept(73, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "7-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "عشرة وعدد ما (من 1 إلى 10)",
        printedHead: "٧-٢ عشرة وعدد ما (من 1 إلى 10)",
        bookFrom: 74,
        concepts: [
          concept(74, "٧-٢ عشرة وعدد ما (من 1 إلى 10)"),
          concept(74, "نلاحظ!"),
          concept(74, "استعدوا يا أصدقائي"),
          concept(74, "طريقة الحل"),
          concept(75, "وقت المحاولة"),
          concept(75, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "7-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "خط الأعداد",
        printedHead: "٧-٣ خط الأعداد",
        bookFrom: 76,
        concepts: [
          concept(76, "٧-٣ خط الأعداد"),
          concept(76, "نلاحظ!"),
          concept(76, "استعدوا يا أصدقائي"),
          concept(76, "طريقة الحل"),
          concept(77, "وقت المحاولة"),
          concept(78, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "7-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "جمع وطرح الأعداد (الجزء الأول)",
        printedHead: "٧-٤ جمع وطرح الأعداد (الجزء الأول)",
        bookFrom: 80,
        concepts: [
          concept(80, "٧-٤ جمع وطرح الأعداد (الجزء الأول)"),
          concept(80, "نلاحظ!"),
          concept(80, "استعدوا يا أصدقائي"),
          concept(80, "طريقة الحل"),
          concept(81, "وقت المحاولة"),
          concept(81, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "7-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "جمع وطرح الأعداد (الجزء الثاني)",
        printedHead: "جمع وطرح الأعداد (الجزء الثاني)",
        bookFrom: 82,
        concepts: [
          concept(82, "جمع وطرح الأعداد (الجزء الثاني)"),
          concept(82, "لاحظ!"),
          concept(82, "استعدوا يا أصدقائي"),
          concept(82, "طريقة الحل"),
          concept(83, "وقت المحاولة"),
          concept(83, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "7-6",
        ordinal: "السادس",
        type: TYPE,
        title: "الأعداد الأكبر من ٢٠",
        printedHead: "٧-٦ الأعداد الأكبر من ٢٠",
        bookFrom: 84,
        concepts: [
          concept(84, "٧-٦ الأعداد الأكبر من ٢٠"),
          concept(84, "نلاحظ!"),
          concept(84, "استعدوا يا أصدقائي"),
          concept(84, "طريقة الحل"),
          concept(85, "وقت المحاولة"),
          concept(85, "هيا نتدرب سويًا"),
        ],
      },
    ],
  },
  {
    key: "8",
    kind: "chapter",
    ordinal: "الثامن",
    title: "الفصل الثامن: قراءة الساعة",
    printedHead: "الفصل الثامن قراءة الساعة",
    bookFrom: 86,
    bookTo: 87,
    lessons: [
      {
        key: "8-1",
        ordinal: "الأول",
        type: TYPE,
        title: "قراءة الوقت على الساعة",
        printedHead: "١-٨ قراءة الوقت على الساعة",
        bookFrom: 86,
        concepts: [
          concept(86, "١-٨ قراءة الوقت على الساعة"),
          concept(86, "لاحظ!"),
          concept(86, "استعدوا يا أصدقائي"),
          concept(86, "طريقة الحل"),
          concept(87, "وقت المحاولة"),
          concept(87, "هيا نتدرب سويًا"),
        ],
      },
    ],
  },
  {
    key: "9",
    kind: "chapter",
    ordinal: "التاسع",
    title: "الفصل التاسع: العمليات التي تتضمن ٣ أعداد",
    printedHead: "الفصل التاسع العمليات التي تتضمن ٣ أعداد",
    bookFrom: 88,
    bookTo: 93,
    lessons: [
      {
        key: "9-1",
        ordinal: "الأول",
        type: TYPE,
        title: "جمع ثلاثة أعداد",
        printedHead: "1-9 جمع ثلاثة أعداد",
        bookFrom: 88,
        concepts: [
          concept(88, "1-9 جمع ثلاثة أعداد"),
          concept(88, "نلاحظ!"),
          concept(88, "استعدوا يا أصدقائي"),
          concept(88, "طريقة الحل"),
          concept(89, "وقت المحاولة"),
          concept(89, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "9-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "طرح ثلاثة أعداد",
        printedHead: "٩-٢ طرح ثلاثة أعداد",
        bookFrom: 90,
        concepts: [
          concept(90, "٩-٢ طرح ثلاثة أعداد"),
          concept(90, "نلاحظ!"),
          concept(90, "استعدوا يا أصدقائي"),
          concept(90, "طريقة الحل"),
          concept(91, "وقت المحاولة"),
          concept(91, "هيا نتدرب سويًا"),
        ],
      },
      {
        key: "9-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الحساب باستخدام ثلاثة أعداد",
        printedHead: "٣-٩ الحساب باستخدام ثلاثة أعداد",
        bookFrom: 92,
        concepts: [
          concept(92, "٣-٩ الحساب باستخدام ثلاثة أعداد"),
          concept(92, "نلاحظ!"),
          concept(92, "استعدوا يا أصدقائي"),
          concept(92, "طريقة الحل"),
          concept(93, "وقت المحاولة"),
          concept(93, "هيا نتدرب سويًا"),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the chapter opener (its first lesson) or its
 * own head page, down to the page before the next lesson starts, bounded by
 * the chapter — so the opener stays inside the chapter it belongs to. The
 * practice pages that merely continue an activity (books 63, 67, 71, 79)
 * print no head of their own; they ride with the lesson that started them,
 * so distinct lessons always start on distinct pages and the ranges tile
 * the chapter exactly.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_MATH_G1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_G1_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This term has
 * no appendix: every page of the term belongs to a chapter. Kept as a function
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
  "math-g1-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content.
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

/** The document a lesson grounds the tutor in: its own page range, in order. */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(unitIndex, lessonIndex);
  const parts: string[] = [];
  for (let p = from; p <= to; p++) {
    const text = loadBookPage(p);
    if (text) parts.push(pageBlock(p, text));
  }
  return parts.join("\n\n");
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
 * Folds text for comparison: drops tatweel and diacritics, unifies the alef/ya/ta
 * forms the book prints inconsistently, and removes every non-letter/digit, so OCR
 * spacing and vowel marks cannot break a match. This folds the «نشير ونتعلـم»
 * tatweel, the «هيا نتدرب سويًا» vocalisation drift (هيّا/هيَّا، سويا/سويًّا) and
 * the «نلاحظ !»/«لاحظ !» spacing — but never the doubled letters of «للاحظ!»
 * or «نققارن», which are stored verbatim.
 */
function normalize(text: string): string {
  return text
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
 * is a bare numeral standing alone on the last line («٦»، «۳۱», «65»); the
 * last non-empty line is read and every other line is ignored, so body numbers
 * (exercise counts, chart labels) can never be mistaken for a folio.
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
 * which is what fixes the offset; the thirteen pages named in
 * `FOLIO_LESS_ANCHORS` carry no parseable folio and are handled there instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The thirteen term pages that print no parseable folio in the OCR, each with
 * the anchor the check accepts in place of a page number: the four pages whose
 * folio the OCR read as Latin letters (books 7 «V», 17 «IV», 71 «VI», 78 «VA»),
 * the two whose folio it read as a neighbour's number (book 42 «٤٣», book 72
 * «٧٣»), the truncated folio (book 60 «٦»), the folio-at-top page (book 34,
 * anchored on its lesson head), and the four pages with no folio line at all
 * (books 50, 57, 74, 84, 89).
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  7: "نلون نفس العدد من الأشياء",
  17: "نكتب عدد الأشياء التي نراها",
  34: "أين هو؟",
  42: "قصص الجمع",
  50: "ما الفرق؟",
  57: "هيا نستخدم شريطًا لقياس",
  60: "تمثيل البيانات بالصور",
  71: "البطاقة الفائزة",
  72: "حوط كل عشرة بدائرة",
  74: "عشرة وعدد ما",
  78: "عند أي عدد توقف القط",
  84: "الأعداد الأكبر من ٢٠",
  89: "جمع ثلاثة أعداد",
};

/**
 * Table invariants: lesson keys are unique and follow (chapter-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_G1_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_MATH_G1_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_MATH_G1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_G1_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_MATH_G1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio, or, on the thirteen OCR-damaged pages, from the anchor named
 *     in `FOLIO_LESS_ANCHORS`;
 *  2. every chapter opener prints the chapter head and every lesson's first page
 *     prints that lesson's head;
 *  3. every lesson's title and every activity's head is printed on the pages the
 *     lesson owns (the activity on its own page);
 *  4. every printed page in [6, 93] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_MATH_G1_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_G1_T1_BOOK_START || book > EGYPT_MATH_G1_T1_BOOK_END) continue;
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
      } else if (footer !== book) {
        problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_MATH_G1_T1_BOOK_END - EGYPT_MATH_G1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_MATH_G1_T1_BOOK_START} و${EGYPT_MATH_G1_T1_BOOK_END}`,
    );
  }

  // 2 + 3a. every chapter opener prints the chapter head, every lesson's first
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
  for (let p = EGYPT_MATH_G1_T1_BOOK_START; p <= EGYPT_MATH_G1_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
