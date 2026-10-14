// Official Egypt Primary-5 (Grade 5) Science, Arabic-medium, first term —
// Ministry of Education and Technical Education edition prepared with
// Discovery Education (cover imprint «2025 - 2026», Science Techbook programme).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g5-science`, subject `science` (name "العلوم"),
// lesson prefix `l-g5-sci-`, grade `grade-5` (name "الصف الخامس الابتدائي").
//
// The curriculum tree for the Egypt `eg-g5-science` curriculum is rebuilt
// from the Ministry textbook `العلوم — الصف الخامس الابتدائي — الفصل الدراسي
// الأول` (129 scanned pages, all OCR'd). This module is the single source of
// truth for its structure: the two printed units of the first term (الوحدة
// الأولى: العلاقات الغذائية بين الكائنات الحية, الوحدة الثانية: حركة
// الجسيمات), every numbered lesson inside them (27 lessons — exactly as the
// book's own «قائمة المحتوى» on scan 8 lists the 13 of Unit 1, with Unit 2
// following the same pagination from its own «الدرس» openers), and, for every
// lesson, the book's own printed heads — the «الدرس» head plus the «نشاط»
// activity heads the pages print — verbatim and with the printed page they
// start on. The self-checks at the bottom prove that mapping against the OCR
// itself, page by page.
//
// THE OFFSET IS TEN — book page = scan page − 10
// Every content page that carries a folio prints its own number in Western
// digits in its footer («الوحدة الأولى: العلاقات الغذائية بين الكائنات الحية
// | 1», «المفهوم 1.1 : احتياجات النبات 5», «32», bare «100», «117 | …»), so
// `BOOK_TO_PDF_OFFSET` is fixed by the scans and quoted here: scan 11 prints
// «… | 1» (book 1, the Unit-1 «ابدأ» opener), scan 15 prints «… 5» (book 5),
// scan 71 prints «… | 61» (book 61, the Unit-2 «ابدأ» opener) and scan 127
// prints «… | 117» (book 117, the term's last page). The book's own «قائمة
// المحتوى» (scan 8) independently confirms the Unit-1 lesson starts: every
// «الدرس» sits exactly where the contents says it does (5, 8, 12, 16, 20,
// 25, 28, 31, 34, 37, 41, 44, 46); the Unit-2 contents page (scan 9) lost its
// entries in extraction — it keeps only the «نظرة عامة على الوحدة» head
// followed by its dot leaders — so the Unit-2 starts (65, 67, 71, 74, 77,
// 81, 84, 86, 91, 95, 98, 102, 107, 111) are taken from the «الدرس» openers
// the scans themselves print, which continue the same per-concept pagination
// as Unit 1.
//
// TERM = THE NUMBERED BOOK PAGES (books 1–117)
// Scan pages 1–10 are before the term: the cover (1), a blank page (2, the
// provider's «لا يوجد نص» sentence), the credits masthead (3, folio «iii»),
// a second blank (4, folio «iv»), the «مقدمة الكتاب المدرسي» (5–6), the
// parent/teacher letter (7, folio «vii»), the printed «قائمة المحتوى» (8–9,
// folio «viii» on the first) and the Unit-1 divider (10, no folio). Scan
// pages 128–129 are after the term: the print-specification page (128) and
// the back cover (129). The term runs from the Unit-1 «ابدأ» opener (book 1
// = scan 11) to the «قيم تعلمك» closing page (book 117 = scan 127):
// `EGYPT_SCIENCE_G5_T1_BOOK_START` / `_BOOK_END` are exactly those two
// pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` is therefore 117 − 1 + 1 − 0 = 117: every scan
// exists with a text layer, so `MISSING_SCANS` is empty.
//
// THREE TERM PAGES PRINT NO FOLIO — EACH IS ANCHORED ON A HEAD IT PRINTS
// Book 8 (the «الدرس الثاني» البحث العملي opener «هل تحتاج النباتات إلى
// تربة؟», whose foot holds only the «التوقع الخاص بي» ruled lines), book 39
// (the «نشاط 3 قيّم كعالم» table page, whose foot holds only the table's dot
// leaders) and book 60 (the Unit-2 divider, which prints no number by
// design). None prints any digit at its foot, so each is anchored on a head
// its own page prints, named in `FOLIO_LESS_ANCHORS`. Every other term page
// proves its own number from the last two text lines, so
// `FOOTER_OCR_MISREADS` is empty and no folio the OCR could parse mismatches
// its page. (Book 117 prints a «3» from its exercise figures on the last two
// lines beside its own «117» — which is why the check prefers the page's own
// number among the candidates.)
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every lesson contributes its «الدرس» head (ordinal word, exactly as the
// opener prints it — split openers print it across two lines, «الدرس» /
// «الأول», which `normalize` rejoins) plus one concept per printed activity:
// «نشاط N» glued to the Like-a-Scientist subtitle on the very next line
// («نشاط 4 ابحث كعالم»), transcribed verbatim from the page it starts on —
// including the book's own spelling shifts («تساءل كعالم» on book 38 against
// «تساؤل كعالم» elsewhere, «قيّم» against «قيم», «حلّل» against «حلل»,
// «سجّل» against «سجل»). Nothing is invented: every concept title below is a
// string the book itself prints on the page its `bookFrom` names. (Two openers
// — books 84 and 98 — print the running head with the concept number before
// the ordinal, «الدرس 2.2 تعلّم … ؟» / «الثاني» and «الدرس 3.2 | تعلّم» /
// «الثاني»; those two heads are quoted seam-to-seam exactly as the lines
// print, which `normalize` rejoins.)
//
// LESSON TITLES ARE THE OPENER'S OWN TOPIC HEAD
// Each lesson's `title` (and its `printedHead`) is the distinctive head its
// opener prints: the investigation topic («هل تحتاج النباتات إلى تربة؟»,
// «أجزاء النبات», «مقارنة أجهزة جسم الإنسان والنبات», «البحث العملي: انتشار
// البذور», «الغذاء كمصدر للطاقة», «السلسلة الغذائية», «كيف تحصل الصقور على
// الطاقة؟», «البحث العملي: نموذج انتقال الطاقة», «فقدان المواطن الطبيعية»,
// «حماية الأنظمة البيئية», «البحث العملي: ملاحظة المادة», «جسيمات المادة»,
// «النماذج», «حالات الماء», «البحث العملي لغز المطبخ», «خصائص المادة»,
// «الخصائص المفيدة للمادة», «العلاقة بين درجة الحرارة وحالة المادة»,
// «المخاليط», «التغيرات الفيزيائية في حياتنا», «انصهار المادة», …). The six
// pure-intro openers (books 5, 25, 37, 65, 81, 95) print no other topic, so
// those lessons keep the head the opener does print: «هل تستطيع الشرح؟».
//
// CONCEPT OPENERS RIDE WITH THE LESSONS THEY TOUCH
// Each unit's first lesson starts on the unit's own «ابدأ» page (books 1 and
// 61 print no lesson head of their own), so `lessonBookRange` starts a
// unit's first lesson at the section head, exactly as the other Egyptian
// specs do. The mid-unit divider (book 60) closes lesson 1-13. The Unit
// Projects, the Interdisciplinary Project («لا للإهدار.. عالج المخلفات»,
// books 50–57) and the «قيم تعلمك» pages (books 58–59 and 116–117) close
// their unit's last lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 10 (verified: book p.117 = scan p.127). */
export const BOOK_TO_PDF_OFFSET = 10;

/** First printed page of the term — the Unit-1 «ابدأ» opener (scan 11). */
export const EGYPT_SCIENCE_G5_T1_BOOK_START = 1;

/** Last printed page of the term — the «قيم تعلمك» closing page (scan 127). */
export const EGYPT_SCIENCE_G5_T1_BOOK_END = 117;

/** The scanned pages before the term: cover, blank, credits, blank, foreword, parent letter, contents, unit divider. */
export const EGYPT_SCIENCE_G5_T1_FRONT_MATTER = { from: 1, to: 10 } as const;

/** The scanned pages after the term: the print-specification page and the back cover. */
export const EGYPT_SCIENCE_G5_T1_BACK_MATTER = { from: 128, to: 129 } as const;

/**
 * The term pages the OCR never produced, in book pages. Every one of the 129
 * scans exists with a text layer (scan 2 is the provider's blank-page sentence
 * in the front matter, normalised to "" by the loader), so no term page is
 * missing and the strong check proves all 117 of them.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of the textbook — becomes one concept in the app tree. */
export interface ScienceG5T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The head's own printed label: "الدرس" or "نشاط". */
  kind: string;
  /** The printed head, verbatim. */
  title: string;
}

/** One printed lesson of the book — becomes one lesson in the app tree. */
export interface ScienceG5T1Lesson {
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
  concepts: ScienceG5T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed unit of the term. */
export interface ScienceG5T1Unit {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"2", in book order. */
  key: string;
  /** Arabic ordinal of the unit as used in the app tree, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: العلاقات الغذائية بين الكائنات الحية". */
  title: string;
  /** The unit head its opener prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next opener). */
  bookTo: number;
  lessons: ScienceG5T1Lesson[];
}

const LESSON = "الدرس";
const ACTIVITY = "نشاط";

function concept(bookFrom: number, kind: string, title: string): ScienceG5T1Concept {
  return { bookFrom, kind, title };
}

function lessonHead(bookFrom: number, title: string): ScienceG5T1Concept {
  return concept(bookFrom, LESSON, title);
}

function activity(bookFrom: number, title: string): ScienceG5T1Concept {
  return concept(bookFrom, ACTIVITY, title);
}

/**
 * The two units of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit ranges come from the pages' own openers: 1–60 and 61–117 (the Unit-2
 * divider on book 60 closes Unit 1). Lesson starts come from the «الدرس»
 * openers and match the book's «قائمة المحتوى» for Unit 1; Unit 2 continues
 * the same per-concept pagination.
 */
export const EGYPT_SCIENCE_G5_T1_UNITS: ScienceG5T1Unit[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: العلاقات الغذائية بين الكائنات الحية",
    printedHead: "الوحدة الأولى: العلاقات الغذائية بين الكائنات الحية",
    bookFrom: 1,
    bookTo: 60,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: LESSON,
        title: "هل تستطيع الشرح؟",
        printedHead: "هل تستطيع الشرح؟",
        bookFrom: 5,
        concepts: [
          lessonHead(5, "الدرس الأول"),
          activity(5, "نشاط 1 هل تستطيع الشرح؟"),
          activity(6, "نشاط 2 تساؤل كعالم"),
          activity(7, "نشاط 3 قيم كعالم"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "هل تحتاج النباتات إلى تربة؟",
        printedHead: "هل تحتاج النباتات إلى تربة؟",
        bookFrom: 8,
        concepts: [
          lessonHead(8, "الدرس الثاني"),
          activity(8, "نشاط 4 ابحث كعالم"),
          activity(10, "نشاط 5 ابحث كعالم"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "أجزاء النبات",
        printedHead: "أجزاء النبات",
        bookFrom: 12,
        concepts: [
          lessonHead(12, "الدرس الثالث"),
          activity(12, "نشاط 6 لاحظ كعالم"),
          activity(14, "نشاط 7 ابحث كعالم"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "مقارنة أجهزة جسم الإنسان والنبات",
        printedHead: "مقارنة أجهزة جسم الإنسان والنبات",
        bookFrom: 16,
        concepts: [
          lessonHead(16, "الدرس الرابع"),
          activity(16, "نشاط 8 حلل كعالم"),
          activity(18, "نشاط 9 حلل كعالم"),
          activity(19, "نشاط 10 لاحظ كعالم"),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "البحث العملي: انتشار البذور",
        printedHead: "البحث العملي: انتشار البذور",
        bookFrom: 20,
        concepts: [
          lessonHead(20, "الدرس الخامس"),
          activity(20, "نشاط 11 ابحث كعالم"),
          activity(23, "نشاط 12 سجل أدلة كعالم"),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: LESSON,
        title: "هل تستطيع الشرح؟",
        printedHead: "هل تستطيع الشرح؟",
        bookFrom: 25,
        concepts: [
          lessonHead(25, "الدرس الأول"),
          activity(25, "نشاط 1 هل تستطيع الشرح؟"),
          activity(26, "نشاط 2 تساؤل كعالم"),
          activity(27, "نشاط 3 قيم كعالم"),
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        type: LESSON,
        title: "الغذاء كمصدر للطاقة",
        printedHead: "الغذاء كمصدر للطاقة",
        bookFrom: 28,
        concepts: [
          lessonHead(28, "الدرس الثاني"),
          activity(28, "نشاط 4 حلّل كعالم"),
          activity(29, "نشاط 5 لاحظ كعالم"),
          activity(30, "نشاط 6 حلّل كعالم"),
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "السلسلة الغذائية",
        printedHead: "السلسلة الغذائية",
        bookFrom: 31,
        concepts: [
          lessonHead(31, "الدرس الثالث"),
          activity(31, "نشاط 7 قيم كعالم"),
          activity(32, "نشاط 8 حلّل كعالم"),
          activity(33, "نشاط 9 قيّم كعالم"),
        ],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "كيف تحصل الصقور على الطاقة؟",
        printedHead: "كيف تحصل الصقور على الطاقة؟",
        bookFrom: 34,
        concepts: [
          lessonHead(34, "الدرس الرابع"),
          activity(34, "نشاط 10 سجل أدلة كعالم"),
          activity(35, "نشاط 11 حلل كعالم"),
        ],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        type: LESSON,
        title: "هل تستطيع الشرح؟",
        printedHead: "هل تستطيع الشرح؟",
        bookFrom: 37,
        concepts: [
          lessonHead(37, "الدرس الأول"),
          activity(37, "نشاط 1 هل تستطيع الشرح؟"),
          activity(38, "نشاط 2 تساءل كعالم"),
          activity(39, "نشاط 3 قيّم كعالم"),
        ],
      },
      {
        key: "1-11",
        ordinal: "الحادي عشر",
        type: LESSON,
        title: "البحث العملي: نموذج انتقال الطاقة",
        printedHead: "البحث العملي: نموذج انتقال الطاقة",
        bookFrom: 41,
        concepts: [
          lessonHead(41, "الدرس الثاني"),
          activity(41, "نشاط 4 ابحث كعالم"),
          activity(42, "نشاط 5 لاحظ كعالم"),
          activity(43, "نشاط 6 لاحظ كعالم"),
        ],
      },
      {
        key: "1-12",
        ordinal: "الثاني عشر",
        type: LESSON,
        title: "فقدان المواطن الطبيعية",
        printedHead: "فقدان المواطن الطبيعية",
        bookFrom: 44,
        concepts: [
          lessonHead(44, "الدرس الثالث"),
          activity(44, "نشاط 7 حلّل كعالم"),
          activity(45, "نشاط 8 حلل كعالم"),
        ],
      },
      {
        key: "1-13",
        ordinal: "الثالث عشر",
        type: LESSON,
        title: "حماية الأنظمة البيئية",
        printedHead: "حماية الأنظمة البيئية",
        bookFrom: 46,
        concepts: [
          lessonHead(46, "الدرس الرابع"),
          activity(46, "نشاط 9 سجل أدلة كعالم"),
          activity(48, "نشاط 10 حلل كعالم"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: حركة الجسيمات",
    printedHead: "الوحدة الثانية: حركة الجسيمات",
    bookFrom: 61,
    bookTo: 117,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: LESSON,
        title: "هل تستطيع الشرح؟",
        printedHead: "هل تستطيع الشرح؟",
        bookFrom: 65,
        concepts: [
          lessonHead(65, "الدرس الأول"),
          activity(65, "نشاط 1 هل تستطيع الشرح؟"),
          activity(66, "نشاط 2 تساؤل كعالم"),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: LESSON,
        title: "البحث العملي: ملاحظة المادة",
        printedHead: "البحث العملي: ملاحظة المادة",
        bookFrom: 67,
        concepts: [
          lessonHead(67, "الدرس الثاني"),
          activity(67, "نشاط 3 ابحث كعالم"),
          activity(69, "نشاط 4 حلّل كعالم"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: LESSON,
        title: "جسيمات المادة",
        printedHead: "جسيمات المادة",
        bookFrom: 71,
        concepts: [
          lessonHead(71, "الدرس الثالث"),
          activity(71, "نشاط 5 حلل كعالم"),
          activity(72, "نشاط 6 قيّم كعالم"),
          activity(73, "نشاط 7 حلل كعالم"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: LESSON,
        title: "النماذج",
        printedHead: "النماذج",
        bookFrom: 74,
        concepts: [
          lessonHead(74, "الدرس الرابع"),
          activity(74, "نشاط 8 لاحظ كعالم"),
          activity(75, "نشاط 9 ابحث كعالم"),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: LESSON,
        title: "حالات الماء",
        printedHead: "حالات الماء",
        bookFrom: 77,
        concepts: [
          lessonHead(77, "الدرس الخامس"),
          activity(77, "نشاط 10 سجّل أدلة كعالم"),
          activity(78, "نشاط 11 حلّل كعالم"),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: LESSON,
        title: "هل تستطيع الشرح؟",
        printedHead: "هل تستطيع الشرح؟",
        bookFrom: 81,
        concepts: [
          lessonHead(81, "الدرس الأول"),
          activity(81, "نشاط 1 هل تستطيع الشرح؟"),
          activity(82, "نشاط 2 تساؤل كعالم"),
          activity(83, "نشاط 3 قيم كعالم"),
        ],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        type: LESSON,
        title: "البحث العملي لغز المطبخ",
        printedHead: "البحث العملي لغز المطبخ",
        bookFrom: 84,
        concepts: [
          lessonHead(84, "الدرس 2.2 تعلّم ما المقصود بالمادة وما طرق قياسها ؟ الثاني"),
          activity(84, "نشاط 4 ابحث كعالم"),
        ],
      },
      {
        key: "2-8",
        ordinal: "الثامن",
        type: LESSON,
        title: "خصائص المادة",
        printedHead: "خصائص المادة",
        bookFrom: 86,
        concepts: [
          lessonHead(86, "الدرس الثالث"),
          activity(86, "نشاط 5 حلل كعالم"),
          activity(88, "نشاط 6 ابحث كعالم"),
          activity(90, "نشاط 7 قيم كعالم"),
        ],
      },
      {
        key: "2-9",
        ordinal: "التاسع",
        type: LESSON,
        title: "الخصائص المفيدة للمادة",
        printedHead: "الخصائص المفيدة للمادة",
        bookFrom: 91,
        concepts: [
          lessonHead(91, "الدرس الرابع"),
          activity(91, "نشاط 8 حلل كعالم"),
          activity(92, "نشاط 9 قيم كعالم"),
          activity(93, "نشاط 10 سجل أدلة كعالم"),
        ],
      },
      {
        key: "2-10",
        ordinal: "العاشر",
        type: LESSON,
        title: "هل تستطيع الشرح؟",
        printedHead: "هل تستطيع الشرح؟",
        bookFrom: 95,
        concepts: [
          lessonHead(95, "الدرس الأول"),
          activity(95, "نشاط 1 هل تستطيع الشرح؟"),
          activity(96, "نشاط 2 تساؤل كعالم"),
          activity(97, "نشاط 3 حلل كعالم"),
        ],
      },
      {
        key: "2-11",
        ordinal: "الحادي عشر",
        type: LESSON,
        title: "العلاقة بين درجة الحرارة وحالة المادة",
        printedHead: "العلاقة بين درجة الحرارة وحالة المادة",
        bookFrom: 98,
        concepts: [
          lessonHead(98, "الدرس 3.2 | تعلّم الثاني"),
          activity(98, "نشاط 4 حلّل كعالم"),
          activity(100, "نشاط 5 لاحظ كعالم"),
        ],
      },
      {
        key: "2-12",
        ordinal: "الثاني عشر",
        type: LESSON,
        title: "المخاليط",
        printedHead: "المخاليط",
        bookFrom: 102,
        concepts: [
          lessonHead(102, "الدرس الثالث"),
          activity(102, "نشاط 6 حلل كعالم"),
          activity(104, "نشاط 7 ابحث كعالم"),
        ],
      },
      {
        key: "2-13",
        ordinal: "الثالث عشر",
        type: LESSON,
        title: "التغيرات الفيزيائية في حياتنا",
        printedHead: "التغيرات الفيزيائية في حياتنا",
        bookFrom: 107,
        concepts: [
          lessonHead(107, "الدرس الرابع"),
          activity(107, "نشاط 8 لاحظ كعالم"),
          activity(109, "نشاط 9 حلل كعالم"),
          activity(110, "نشاط 10 قيم كعالم"),
        ],
      },
      {
        key: "2-14",
        ordinal: "الرابع عشر",
        type: LESSON,
        title: "انصهار المادة",
        printedHead: "انصهار المادة",
        bookFrom: 111,
        concepts: [
          lessonHead(111, "الدرس الخامس"),
          activity(111, "نشاط 11 سجل أدلة كعالم"),
          activity(112, "نشاط 12 حلّل كعالم"),
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
  const section = EGYPT_SCIENCE_G5_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SCIENCE_G5_T1_UNITS.forEach((section, si) => {
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
  for (const section of EGYPT_SCIENCE_G5_T1_UNITS) {
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
  "science-g5-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (Only scan 2, a front-matter blank, needs it — but the guard keeps
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
  const lesson = EGYPT_SCIENCE_G5_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
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
 * in the footer at the foot of the page («الوحدة الأولى: العلاقات الغذائية
 * بين الكائنات الحية | 1», «المفهوم 1.1 : احتياجات النبات 5», bare «100»),
 * so the last two lines each contribute every whitespace-separated digit
 * token. Lesson, concept and activity numbers join the candidate set
 * harmlessly: the page's own number proves the mapping when present.
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
 * mismatch). The three pages named in `FOLIO_LESS_ANCHORS` print no digit at
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
 * accepts in place of a page number. Book 8 is the «الدرس الثاني» البحث
 * العملي opener «هل تحتاج النباتات إلى تربة؟» (its foot holds only the ruled
 * «التوقع الخاص بي» lines); book 39 is the «نشاط 3 قيّم كعالم» table page
 * (its foot holds only the table's dot leaders); book 60 is the Unit-2
 * divider, which carries no number by design. Each anchor is a head its own
 * page prints.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  8: "هل تحتاج النباتات إلى تربة؟",
  39: "ما الذي تعرفه عن كيفية تغير شبكات الغذاء؟",
  60: "حركة الجسيمات",
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
  const sections = EGYPT_SCIENCE_G5_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_SCIENCE_G5_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_SCIENCE_G5_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SCIENCE_G5_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_SCIENCE_G5_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     the folio in its footer, or, on the three pages named in
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
  const sections = EGYPT_SCIENCE_G5_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SCIENCE_G5_T1_BOOK_START || book > EGYPT_SCIENCE_G5_T1_BOOK_END) continue;
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
  for (let p = EGYPT_SCIENCE_G5_T1_BOOK_START; p <= EGYPT_SCIENCE_G5_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_SCIENCE_G5_T1_BOOK_END - EGYPT_SCIENCE_G5_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_SCIENCE_G5_T1_BOOK_START} و${EGYPT_SCIENCE_G5_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
