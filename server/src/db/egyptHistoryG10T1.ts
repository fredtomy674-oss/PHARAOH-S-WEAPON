// PHASE — official Egypt Secondary-1 (Grade 10) History, first term
// («مصر الحضارة» — حضارة مصر والعالم القديم، الصف الأول الثانوي).
//
// The curriculum tree for the Egypt `eg-g10-history` curriculum (global subject
// `social`, lesson prefix `l-g10-his-`) is rebuilt from the Ministry textbook
// `history-g10-t1` (171 scanned pages). This module is the single source of
// truth for its structure: the four units of the first term, their printed
// lessons (exactly as the book's own printed «محتويات الكتاب» lists them) and,
// for every lesson, the book's own printed heads, verbatim and with the printed
// page they start on. The self-checks at the bottom prove that mapping against
// the OCR itself, page by page.
//
// THE OFFSET IS NINE — book page = scan page − 9
// Every content page prints its own folio, so `BOOK_TO_PDF_OFFSET` is fixed by
// the scan itself and quoted here: scan 11 prints «٢» (book 2), scan 13 prints
// «٤» (book 4), scan 21 prints «١٢» (book 12), scan 29 prints «٢٠» (book 20),
// scan 77 prints «٦٨» (book 68), scan 95 prints «٨٦» (book 86), scan 123 prints
// «١١٤» (book 114) and scan 133 prints «١٢٤» (book 124). The book's own
// «محتويات الكتاب» (scans 7–8) independently confirms it for every lesson
// start except the last one (see below).
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–9 are before the term: the cover (1), the authors masthead (2),
// the review committees (3), a student-data page (4), the «تقديم» (5), «مصر
// تتحدث عن نفسها» (6), the printed «محتويات الكتاب» (7–8) and an unnumbered
// full-page map plate (9) carrying no folio. Scan pages 134–171 are after the
// term: a separate «الأنشطة والتدريبات» activities booklet with its own
// pagination (cover on 134, its own محتويات on 136, pages 137–170), one stray
// foreign page bound inside it (135: a Syrian mathematics coversheet, «الرياضيات
// للصف الثالث الثانوي العلمي»), and the printer's specification sheet (171).
// The term runs from the timeline plate (book 1 = scan 10) to the end of the
// printed «مراجع الكتاب» (book 124 = scan 133): `EGYPT_HISTORY_G10_T1_BOOK_START`
// / `_END` are exactly those two pages, and the tiling assertion proves nothing
// in between is left unreachable. `pagesChecked` therefore equals 124 − 1 + 1
// = 124.
//
// THE UNIT 1 OPENER IS A BOOK-LEVEL TIMELINE PLATE
// Book 1 is a full-page graphic («انتقال الحضارة… إلى أين ستتجه الحضارة مرة
// أخرى؟») that the lesson itself cites («من خلال الخريطة السابقة ص (١)» on
// book 5), so it is term content and rides with unit 1's first lesson — but it
// prints no unit head. The unit head («مدخل لدراسة حضارة مصر والعالم القديم»)
// is printed on the مجالات opener page, book 2. The opener check therefore
// searches the opener span (unit.bookFrom through the first lesson's head page)
// rather than the first page alone; the same uniform rule proves units 2–4,
// whose heads print on their first pages (books 18, 66, 84).
//
// ONLY FOUR TERM PAGES LOST THEIR FOLIO IN THE OCR
// Book 1 is a full-page graphic timeline («انتقال الحضارة… إلى أين ستتجه
// الحضارة مرة أخرى؟») that prints no folio at all. Books 7 and 9 print the
// running foot «المطابع الأميرية» but the OCR kept no number beside it. Book
// 122 («مصطلحات الكتاب», a three-line glossary page) prints neither a folio
// nor the running foot. Rather than weaken the page-number check, all four are
// exempt from it and anchored on a book-specific string that page prints: the
// timeline question for book 1, the running foot for books 7 and 9, and the
// page's own head «مصطلحات الكتاب» for book 122.
//
// TWO OF THE BOOK'S OWN CONTENTS NUMBERS DO NOT MATCH ITS FOLIOS
// The printed «محتويات الكتاب» lists «مصطلحات الكتاب | ١٣٤» and «مراجع الكتاب
// | ١٣٥», but the pages themselves print folios ١٢٢–١٢٤ (scans 131–133), and it
// lists «الدرس الرابع | مصر تحت حكم الرومان | ١١٤» while that lesson's head
// («الدرس الرابع / مصر تحت حكم الرومان / (30 ق.م - 641 م)») is printed on book
// 113 (scan 122, foot «المطابع الأميرية 113»). The table below follows the
// printed heads on their pages, not the misprinted contents numbers: lesson
// 4-4 starts on book 113, and books 121–124 («مفاهيم الوحدة الرابعة»,
// «مصطلحات الكتاب», «مراجع الكتاب») ride with it as the tail of unit 4.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every lesson opens with «في نهاية الدرس يتوقع أن يكون الطالب قادراً على أن:»
// and its outcomes; that line is carried as a concept on the lesson's first
// page. The remaining concepts are the lesson's structural heads («أولاً /
// ثانياً / …» and its numbered topical heads such as «١. الزراعة:» or «٢.
// معركة مجدو: ١٤٧٩ ق.م»), each on the page it starts on, plus the closing
// «مفاهيم الوحدة» head for each unit's last lesson. Three heads whose printed
// numeral the OCR dropped are carried without it («العصور الحديثة» on book 7,
// «الطب والتحنيط» on book 60, «الكيمياء» on book 61). Nothing is invented:
// every concept title below is a string the book itself prints on the page its
// `bookFrom` names.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 9 (verified: book p.124 = scan p.133). */
export const BOOK_TO_PDF_OFFSET = 9;

/** First printed page of the term — the timeline plate (scan 10). */
export const EGYPT_HISTORY_G10_T1_BOOK_START = 1;

/** Last printed page of the term — the end of «مراجع الكتاب» (scan 133). */
export const EGYPT_HISTORY_G10_T1_BOOK_END = 124;

/** The scanned pages before the term: cover, mastheads, تقديم, محتويات, map plate. */
export const EGYPT_HISTORY_G10_T1_FRONT_MATTER = { from: 1, to: 9 } as const;

/** The scanned pages after the term: activities booklet, stray page, print specs. */
export const EGYPT_HISTORY_G10_T1_BACK_MATTER = { from: 134, to: 171 } as const;

/** One printed head of a lesson — becomes one concept in the app tree. */
export interface HistoryG10T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «درس». */
  kind: string;
  /** The printed head, verbatim. */
  title: string;
}

/** One lesson («درس» = one of the book's printed محتويات entries). */
export interface HistoryG10T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
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
  concepts: HistoryG10T1Concept[];
}

/** One printed section of the book — one of the four units of the first term. */
export interface HistoryG10T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"4". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: مدخل لدراسة حضارة مصر والعالم القديم". */
  title: string;
  /** The unit head the opener page prints, e.g. "حضارة مصر القديمة (الفرعونية)". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: HistoryG10T1Lesson[];
}

const TYPE = "درس";

function concept(bookFrom: number, title: string): HistoryG10T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The four units of the first term with their printed lessons and every printed
 * head, transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from the book's «محتويات الكتاب» (scans 7–8) except
 * lesson 4-4, whose head the book prints on page 113 although the contents
 * list ١١٤; each lesson's leading concept is the very heading the book prints
 * on the page the lesson starts on.
 */
export const EGYPT_HISTORY_G10_T1_UNITS: HistoryG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: مدخل لدراسة حضارة مصر والعالم القديم",
    printedHead: "مدخل لدراسة حضارة مصر والعالم القديم",
    bookFrom: 1,
    bookTo: 17,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الحضارة والتاريخ",
        printedHead: "الدرس الأول الحضارة والتاريخ",
        bookFrom: 4,
        concepts: [
          concept(4, "الدرس الأول الحضارة والتاريخ"),
          concept(4, "في نهاية الدرس يتوقع أن يكون الطالب قادراً على أن:"),
          concept(5, "أولاً: مفهوم الحضارة..."),
          concept(6, "ثانياً: مفهوم التاريخ وأهميته"),
          concept(6, "١. العصور القديمة:"),
          concept(7, "٢. العصور الوسطى:"),
          concept(7, "العصور الحديثة"),
          concept(7, "٤. التاريخ المعاصر:"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "مصادر دراسة الحضارات",
        printedHead: "الدرس الثاني مصادر دراسة الحضارات",
        bookFrom: 8,
        concepts: [
          concept(8, "الدرس الثاني مصادر دراسة الحضارات"),
          concept(8, "في نهاية الدرس يتوقع أن يكون الطالب قادراً على أن:"),
          concept(9, "أولا - المصادر الأولية:"),
          concept(9, "1. الآثار:"),
          concept(9, "2. النقوش:"),
          concept(10, "٣. البرديات:"),
          concept(10, "٤. الأوستراكا:"),
          concept(10, "٥. النقود والمسكوكات:"),
          concept(11, "٦. كتابات المؤرخين القدماء: ومنهم:"),
          concept(11, "ثانياً: المصادر الثانوية (المراجع)"),
          concept(11, "١. كتابات الفلاسفة:"),
          concept(11, "٢. كتابات الشعراء:"),
          concept(11, "٣. الأساطير:"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "عوامل قيام الحضارات",
        printedHead: "الدرس الثالث عوامل قيام الحضارات",
        bookFrom: 12,
        concepts: [
          concept(12, "الدرس الثالث عوامل قيام الحضارات"),
          concept(12, "في نهاية الدرس يتوقع أن يكون الطالب قادرًا على أن:"),
          concept(14, "أولاً: العوامل الطبيعية:"),
          concept(14, "١. نهر النيل العظيم:"),
          concept(14, "٢. الموقع الجغرافي المتميز:"),
          concept(15, "٣. الثروات المعدنية (الصخور والمعادن):"),
          concept(16, "٤. الحدود الطبيعية:"),
          concept(16, "٥. المناخ المعتدل:"),
          concept(16, "ثانيًا: العوامل البشرية:"),
          concept(17, "مفاهيم الوحدة الأولى"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: حضارة مصر القديمة (الفرعونية)",
    printedHead: "حضارة مصر القديمة (الفرعونية)",
    bookFrom: 18,
    bookTo: 65,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "ملامح من تاريخ مصر القديمة (الفرعونية)",
        printedHead: "الدرس الأول ملامح من تاريخ مصر القديمة (الفرعونية)",
        bookFrom: 20,
        concepts: [
          concept(20, "الدرس الأول ملامح من تاريخ مصر القديمة (الفرعونية)"),
          concept(20, "في نهاية الدرس يتوقع أن يكون الطالب قادراً على أن:"),
          concept(21, "العصر العتيق (عصر بداية الأسرات)"),
          concept(21, "عصر الدولة القديمة (الأسرات ٣ - ٦)"),
          concept(22, "عصر الانتقال الأول (الأسرات ٧ - ١٠)"),
          concept(22, "عصر الدولة الوسطى (الأسرات ١١ - ١٢)"),
          concept(23, "عصر الانتقال الثاني"),
          concept(23, "عصر الدولة الحديثة (الأسرات ١٨ - ٢٠)"),
          concept(24, "العصر المتأخر"),
          concept(24, "خصائص الحضارة المصرية القديمة"),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الحياة الاقتصادية",
        printedHead: "الدرس الثاني الحياة الاقتصادية",
        bookFrom: 25,
        concepts: [
          concept(25, "الدرس الثاني الحياة الاقتصادية"),
          concept(25, "في نهاية الدرس يتوقع أن يكون الطالب قادراً على أن:"),
          concept(26, "أولاً: الزراعة"),
          concept(27, "١. المحاصيل الزراعية:"),
          concept(27, "٢. الملكية الزراعية:"),
          concept(27, "٣. تربية الحيوان والصيد:"),
          concept(28, "٤. دور الدولة في التنمية الزراعية:"),
          concept(29, "ثانيًا: الصناعة"),
          concept(29, "١. الصانع المصري"),
          concept(30, "٢. أهم الصناعات المصرية القديمة:"),
          concept(30, "٣. دور الدولة في تنمية الصناعة:"),
          concept(31, "ثالثاً: التجارة:"),
          concept(31, "١. التجارة الداخلية:"),
          concept(32, "٢. التجارة الخارجية:"),
          concept(32, "٣. وسائل النقل:"),
          concept(33, "٤. دور الدولة في تنمية التجارة:"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الحياة السياسية والإدارية",
        printedHead: "الدرس الثالث الحياة السياسية والإدارية",
        bookFrom: 34,
        concepts: [
          concept(34, "الدرس الثالث الحياة السياسية والإدارية"),
          concept(34, "في نهاية الدرس يتوقع أن يكون الطالب قادراً على أن:"),
          concept(35, "أولاً: الوحدة السياسية:"),
          concept(36, "ثانياً عناصر الحكم:"),
          concept(36, "أولاً: الملك"),
          concept(36, "ثانياً: الوزير"),
          concept(37, "ثالثا: الإدارة المركزية"),
          concept(38, "رابعًا: الإدارة المحلية \"حكام الأقاليم\""),
          concept(38, "العلاقة بين الحكام والشعب"),
          concept(39, "الثورة الاجتماعية (ثورة الشعب)"),
          concept(39, "أسباب الثورة:"),
          concept(39, "أحداث الثورة"),
          concept(39, "نتائج الثورة الإيجابية:"),
          concept(40, "خامسًا: القضاء"),
          concept(41, "سادسا: الجيش"),
          concept(41, "١. معركة التحرير: ١٥٧١ ق.م:"),
          concept(42, "٢. معركة مجدو: ١٤٧٩ ق.م"),
          concept(43, "التواصل الحضاري بين مصر وإفريقيا:"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "الحياة الاجتماعية",
        printedHead: "الدرس الرابع الحياة الاجتماعية",
        bookFrom: 44,
        concepts: [
          concept(44, "الدرس الرابع الحياة الاجتماعية"),
          concept(44, "في نهاية الدرس يتوقع أن يكون الطالب قادراً على أن:"),
          concept(45, "أولاً: طبقات المجتمع"),
          concept(45, "ثانياً: القوانين والعدالة الاجتماعية"),
          concept(46, "ثالثاً: مظاهر الحياة الاجتماعية في مصر القديمة"),
          concept(46, "١. الأسرة:"),
          concept(47, "٢. تربية الأبناء:"),
          concept(47, "٣. المرأة :"),
          concept(48, "رابعًا: المسكن والأثاث"),
          concept(48, "خامسًا: الملابس وأدوات الزينة"),
          concept(49, "سادساً: الألعاب الترفيهية والاحتفالات"),
          concept(49, "١. رياضة الصيد:"),
          concept(49, "٢. الألعاب الرياضية:"),
          concept(50, "٣. الغناء والموسيقى:"),
          concept(50, "٤. الأعياد:"),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "الحياة الدينية",
        printedHead: "الدرس الخامس الحياة الدينية",
        bookFrom: 51,
        concepts: [
          concept(51, "الدرس الخامس الحياة الدينية"),
          concept(51, "في نهاية الدرس يتوقع أن يكون الطالب قادراً على أن:"),
          concept(52, "أولاً: تعدد المعبودات:"),
          concept(52, "ثانياً: الإيمان بالبعث والخلود:"),
          concept(53, "ثالثًا: الإيمان بالحساب بعد الموت"),
          concept(53, "رابعًا: السمو إلى التوحيد"),
          concept(53, "العبادة الآتونية:"),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: TYPE,
        title: "الحياة الثقافية والفكرية",
        printedHead: "الدرس السادس الحياة الثقافية والفكرية",
        bookFrom: 55,
        concepts: [
          concept(55, "الدرس السادس الحياة الثقافية والفكرية"),
          concept(55, "في نهاية الدرس يتوقع أن يكون الطالب قادراً على أن:"),
          concept(56, "أولاً: الكتابة المصرية القديمة"),
          concept(57, "ثانيًا: مراكز العلم في مصر القديمة"),
          concept(57, "١. المدارس:"),
          concept(57, "٢. مراكز البحث العلمي:"),
          concept(57, "٣. المكتبات:"),
          concept(58, "ثالثًا: الأدب:"),
          concept(58, "١. الأدب الديني:"),
          concept(58, "٢. أدب القصة والرواية:"),
          concept(58, "٣. أدب الحكمة والنصيحة:"),
          concept(59, "٤. الأدب السياسي:"),
          concept(59, "رابعًا: العلوم"),
          concept(60, "١. الحساب:"),
          concept(60, "٢. الهندسة:"),
          concept(60, "٣. الفلك:"),
          concept(60, "الطب والتحنيط"),
          concept(61, "الكيمياء"),
          concept(61, "خامساً العمارة :"),
          concept(62, "٣. المعابد:"),
          concept(63, "سادساً: الفنون"),
          concept(63, "١. النحت:"),
          concept(63, "٢. الرسم والنقش:"),
          concept(64, "٣. التواصل الثقافي والفني مع أفريقيا:"),
          concept(65, "مفاهيم الوحدة الثانية"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: حضارة بلاد العراق القديم وحضارة فينيقيا",
    printedHead: "حضارة بلاد العراق القديم وحضارة فينيقيا",
    bookFrom: 66,
    bookTo: 83,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "حضارة بلاد العراق القديم",
        printedHead: "الدرس الأول حضارة بلاد العراق القديم",
        bookFrom: 68,
        concepts: [
          concept(68, "الدرس الأول حضارة بلاد العراق القديم"),
          concept(68, "في نهاية الدرس يتوقع أن يكون الطالب قادراً على أن:"),
          concept(69, "أولاً: التاريخ القديم لبلاد العراق القديم (بلاد ما بين النهرين)"),
          concept(70, "١. الدويلات السومرية:"),
          concept(70, "٢. الدولة الأكادية:"),
          concept(70, "٣. الدولة البابلية القديمة:"),
          concept(71, "٤. الدولة الآشورية:"),
          concept(71, "٥. الدولة البابلية الحديثة:"),
          concept(72, "ثانياً: حضارة بلاد العراق القديم"),
          concept(72, "١. الحياة الاقتصادية:"),
          concept(73, "٢. الحياة السياسية والعسكرية:"),
          concept(73, "٣. الحياة الاجتماعية:"),
          concept(73, "٤. الحياة الدينية:"),
          concept(74, "٥. الحياة الفكرية:"),
          concept(75, "٦. الحياة الفنية: تمثلت الحياة الفنية في:"),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "حضارة فينيقيا",
        printedHead: "الدرس الثاني حضارة فينيقيا",
        bookFrom: 76,
        concepts: [
          concept(76, "الدرس الثاني حضارة فينيقيا"),
          concept(76, "في نهاية الدرس يتوقع أن يكون الطالب قادراً على أن:"),
          concept(79, "أولاً الحياة السياسية:"),
          concept(79, "التواصل السياسي والعسكري:"),
          concept(80, "ثانيًا: الحياة الاقتصادية"),
          concept(80, "الزراعة وتربية الحيوان:"),
          concept(80, "الصناعة:"),
          concept(80, "التجارة:"),
          concept(81, "التواصل الاقتصادي:"),
          concept(81, "ثالثاً: الحياة الدينية"),
          concept(82, "رابعًا: الحياة الاجتماعية"),
          concept(82, "خامسًا: الحياة الثقافية"),
          concept(82, "سادسًا: الحياة الفنية"),
          concept(82, "١. العمارة:"),
          concept(83, "٢. الفنون:"),
          concept(83, "مفاهيم الوحدة الثالثة"),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "الرابعة",
    title: "الوحدة الرابعة: حضارة اليونان وحضارة الرومان",
    printedHead: "حضارة اليونان وحضارة الرومان",
    bookFrom: 84,
    bookTo: 124,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الحضارة اليونانية «الإغريقية» رائدة الفكر والثقافة الغربية",
        printedHead: "الدرس الأول الحضارة اليونانية",
        bookFrom: 86,
        concepts: [
          concept(86, "الدرس الأول الحضارة اليونانية \"الإغريقية\""),
          concept(86, "في نهاية الدرس يتوقع أن يكون الطالب قادراً على أن:"),
          concept(87, "١. حضارة جزيرة كريت:"),
          concept(87, "٢. حضارة مدينة إسبرطة:"),
          concept(88, "٣. حضارة مدينة أثينا:"),
          concept(88, "أولاً: الحياة الاقتصادية في بلاد اليونان"),
          concept(89, "ثانيًا: الحياة السياسية في بلاد اليونان"),
          concept(89, "١. إسبرطة:"),
          concept(90, "٢. أثينا:"),
          concept(91, "ثالثًا: الحياة الدينية فى بلاد اليونان"),
          concept(91, "رابعًا: الحياة الفكرية في بلاد اليونان:"),
          concept(92, "١. الفلسفة:"),
          concept(92, "٢. التاريخ:"),
          concept(92, "٣. الأدب:"),
          concept(92, "٤. العلوم:"),
          concept(93, "خامسًا: الحياة الفنية والرياضية في بلاد اليونان"),
          concept(93, "١. العمارة:"),
          concept(93, "٢. النحت:"),
          concept(94, "٣. الألعاب الأوليمبية:"),
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "مصر تحت حكم البطالمة",
        printedHead: "الدرس الثاني مصر تحت حكم البطالمة",
        bookFrom: 95,
        concepts: [
          concept(95, "الدرس الثاني مصر تحت حكم البطالمة"),
          concept(95, "في نهاية الدرس يتوقع أن يكون الطالب قادراً على أن:"),
          concept(97, "أولاً: الحياة الاقتصادية:"),
          concept(98, "١. الزراعة:"),
          concept(98, "٢. الصناعة:"),
          concept(99, "٣. التجارة:"),
          concept(99, "ثانيًا: الحياة السياسية"),
          concept(99, "نظام الحكم:"),
          concept(100, "٢. المراحل التاريخية لدولة البطالمة في مصر (٣٢٣ ق.م - ٣٠ ق.م)"),
          concept(101, "٣. كليوباترا السابعة:"),
          concept(101, "ثالثًا: الحياة الاجتماعية"),
          concept(101, "١. المقدونيون واليونانيون:"),
          concept(101, "٢. يهود الإسكندرية:"),
          concept(102, "٣. المصريون:"),
          concept(102, "رابعًا: الحياة الدينية"),
          concept(102, "خامسًا: الحياة الثقافية والعلمية:"),
        ],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الحضارة الرومانية",
        printedHead: "الدرس الثالث الحضارة الرومانية",
        bookFrom: 104,
        concepts: [
          concept(104, "الدرس الثالث الحضارة الرومانية"),
          concept(104, "في نهاية الدرس يتوقع أن يكون الطالب قادرًا على أن:"),
          concept(106, "أولاً: ملامح الحياة الاقتصادية"),
          concept(106, "١. الزراعة:"),
          concept(106, "٢. الصناعة:"),
          concept(107, "٣. التجارة:"),
          concept(107, "ثانيًا: الحياة السياسية"),
          concept(107, "١. النظام الملكي (٧٥٣ - ٥١٠ ق.م)"),
          concept(108, "٢. النظام الجمهوري (٥١٠ - ٢٧ ق.م)"),
          concept(109, "٣. النظام الإمبراطوري (٢٧ ق.م):"),
          concept(109, "ثالثاً: الحياة الاجتماعية:"),
          concept(110, "رابعًا: الحياة الدينية"),
          concept(110, "١. معبودات الرومان:"),
          concept(110, "٢. الكهنة:"),
          concept(110, "خامسًا: الحياة الثقافية والعلمية:"),
          concept(111, "سادساً: الحياة الفنية:"),
          concept(111, "١. العمارة:"),
          concept(111, "٢. النحت:"),
          concept(112, "٣. التصوير الروماني:"),
        ],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "مصر تحت حكم الرومان",
        printedHead: "الدرس الرابع مصر تحت حكم الرومان",
        bookFrom: 113,
        concepts: [
          concept(113, "الدرس الرابع مصر تحت حكم الرومان"),
          concept(113, "في نهاية الدرس يتوقع أن يكون الطالب قادرًا على أن:"),
          concept(114, "أولاً: الحياة الاقتصادية"),
          concept(116, "ثانيًا: الحياة السياسية"),
          concept(116, "ثالثًا: الحياة الاجتماعية"),
          concept(116, "١. طبقة الرومان:"),
          concept(116, "٢. إغريق المدن الأربع:"),
          concept(117, "٣. الإغريق في الريف المصري:"),
          concept(117, "٤. اليهود:"),
          concept(117, "٥. المصريون:"),
          concept(117, "رابعًا: الحياة الدينية"),
          concept(118, "الاضطهاد الروماني للمسيحيين:"),
          concept(119, "خامسًا: الحياة الثقافية"),
          concept(119, "سادسًا: الحياة الفنية"),
          concept(121, "مفاهيم الوحدة الرابعة"),
          concept(122, "مصطلحات الكتاب"),
          concept(123, "مراجع الكتاب"),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the
 * unit — so the unit opener stays inside the unit it belongs to. Distinct
 * lessons always start on distinct pages, so the ranges tile the unit exactly.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_HISTORY_G10_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_HISTORY_G10_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This book has
 * no appendix that any lesson quotes: every page of the term belongs to a
 * unit. Kept as a function so the seeder and the stage share one shape across
 * all the books.
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
  "history-g10-t1",
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
 * spacing and vowel marks cannot break a match.
 */
function normalize(text: string): string {
  return text
    .replace(/\u0640/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
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
 * Page-number candidates a content page prints at its foot. This book's foot is
 * either the running foot «N التاريخ - الصف الأول الثانوى» (sometimes with the
 * number leading, sometimes trailing) or «المطابع الأميرية N», so a foot-looking
 * line is a bare numeral or a line carrying one of those two markers beside a
 * number. Content lines that merely mention years («عام ١٤٥٨م») or list numbers
 * («٤. التاريخ المعاصر:») never match, and trailing sidebar boxes reorder after
 * the foot in the OCR, so the last fifteen lines are scanned rather than three.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const tail = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(-15);
  const nums: number[] = [];
  for (const line of tail) {
    const looksLikeFoot =
      /^[\[\(]?[0-9٠-٩۰-۹]+[\]\)]?$/.test(line) ||
      (/الصف الأول الثانو|المطابع/.test(line) && /[0-9٠-٩۰-۹]/.test(line));
    if (!looksLikeFoot) continue;
    const latin = toLatinDigits(line).replace(/[^0-9]/g, " ").replace(/\s+/g, " ").trim();
    for (const tok of latin.split(" ")) if (tok) nums.push(Number(tok));
  }
  return [...new Set(nums)].filter((n) => n > 0);
}

/**
 * The book number a content page prints at its foot, or null. Every content
 * page that carries a folio prints exactly one number there and it is its own,
 * which is what fixes the offset; the four pages named in
 * `FOLIO_LESS_ANCHORS` lost their folio in the OCR and are handled there
 * instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The only four term pages that print no folio in the OCR, each with the anchor
 * the check accepts in place of a page number:
 *   • book 1 is a full-page graphic timeline with no foot at all;
 *   • books 7 and 9 print the running foot «المطابع الأميرية» but no number;
 *   • book 122 («مصطلحات الكتاب») is a three-line glossary page printing
 *     neither a folio nor the running foot.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  1: "إلى أين ستتجه الحضارة مرة أخرى",
  7: "المطابع الأميرية",
  9: "المطابع الأميرية",
  122: "مصطلحات الكتاب",
};

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every range
 * sits inside its section, concept pages rise inside their lesson, the sections
 * tile the term without gaps or overlaps, and the first/last sections hit the
 * book's own bounds. A content mistake here would quietly ground the tutor on the
 * wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_HISTORY_G10_T1_UNITS;
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
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا مكوّنات`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول مكوّن`);
      }

      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((c, ci) => {
        if (!c.title.trim()) problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: بلا عنوان`);
        if (c.bookFrom < unit.bookFrom || c.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: صفحته ${c.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && c.bookFrom < prev.bookFrom) {
          problems.push(`الدرس ${lesson.key}: صفحات المكوّنات تنازلية (${prev.bookFrom} ثم ${c.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }
      const last = lesson.concepts.at(-1)!;
      if (last.bookFrom < from || last.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: مكوّنه الأخير ${last.bookFrom} خارج نطاقه ${from}–${to}`);
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
  if (first && first.bookFrom !== EGYPT_HISTORY_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_HISTORY_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_HISTORY_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_HISTORY_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio, or, on the four OCR-missed pages, from the anchor named in
 *     `FOLIO_LESS_ANCHORS`;
 *  2. every unit's opener span prints the unit head and every lesson's first page prints
 *     that lesson's head;
 *  3. every lesson's title and every concept's head is printed on the pages the
 *     lesson owns (the concept on its own page);
 *  4. every printed page in [1, 124] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_HISTORY_G10_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_HISTORY_G10_T1_BOOK_START || book > EGYPT_HISTORY_G10_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_HISTORY_G10_T1_BOOK_END - EGYPT_HISTORY_G10_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_HISTORY_G10_T1_BOOK_START} و${EGYPT_HISTORY_G10_T1_BOOK_END}`,
    );
  }

  // 2 + 3a. every unit's opener span prints the unit head, every lesson's first
  // page its head, and every lesson's title is printed somewhere in the pages
  // it owns. The opener span runs from the unit's first page through its first
  // lesson's head page: unit 1 opens with the graphic timeline plate (book 1)
  // and prints its head on the مجالات page (book 2), while units 2–4 print
  // theirs on their first pages.
  units.forEach((unit, ui) => {
    const openerEnd = unit.lessons[0]!.bookFrom;
    let headPrinted = false;
    for (let p = unit.bookFrom; p <= openerEnd && !headPrinted; p++) {
      headPrinted = pagePrints(p, unit.printedHead);
    }
    if (!headPrinted) {
      problems.push(`القسم ${unit.title}: صدره ${unit.bookFrom}–${openerEnd} لا يطبع «${unit.printedHead}»`);
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

  // 3b. every concept's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (!pagePrints(c.bookFrom, c.title)) {
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
  for (let p = EGYPT_HISTORY_G10_T1_BOOK_START; p <= EGYPT_HISTORY_G10_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
