// PHASE 108 — official Egypt Secondary-1 (Grade 10) Arabic grammar
// («القواعد الأساسية للنحو والصرف» — للمرحلة الثانوية وما في مستواها), first
// term, Ministry 2026/2027 edition.
//
// The curriculum tree for the Egypt `eg-g10-nahw` curriculum is rebuilt from the
// Ministry textbook `القواعد الأساسية للنحو والصرف` (184 scanned pages). This
// module is the single source of truth for its structure: the thirteen units of
// the first term, their printed lessons (the book's own «أولاً/ثانياً» sections,
// as its printed «المحتويات» lists them) and, for every lesson, the book's own
// printed heads, verbatim and with the printed page they start on. The
// self-checks at the bottom prove that mapping against the OCR itself, page by
// page.
//
// THE OFFSET IS SIX — book page = scan page − 6
// Every content page prints its own folio, so `BOOK_TO_PDF_OFFSET` is fixed by
// the scan itself and quoted here: scan 7 prints the bare «١» (book 1), scan 31
// prints «٢٥» (book 25), scan 63 prints «٥٧» (book 57), scan 109 prints «١٠٣»
// (book 103), scan 141 prints «١٣٥» (book 135), scan 177 prints «١٧١» (book 171)
// and scan 180 prints «١٧٤» (book 174). The book's own «المحتويات» (scans
// 181–184) independently confirms it: it lists every unit and every lesson with
// the very book page its head prints on.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–6 are before the term: the cover (1), the contributors masthead
// (2), the «مقدمة» (3–5) and an exam-instructions «تنبيه» page (6). Scan pages
// 181–184 are after the term: the printed «المحتويات» (فهرس), four pages ending
// with the line «المراجع». The term runs from the unit 1 opener (book 1 = scan 7)
// to the last lesson (book 174 = scan 180): `EGYPT_NAHW_G10_T1_BOOK_START` /
// `_END` are exactly those two pages, and the tiling assertion proves nothing in
// between is left unreachable. `pagesChecked` therefore equals 174 − 1 + 1 = 174.
//
// ONLY TWO TERM PAGES LOST THEIR FOLIO IN THE OCR
// Book pages 2 and 4 print no standalone folio in the OCR. Book 2's last line is
// the running foot «القواعد الأساسية للنحو والصرف … أم القرى للطباعة», which
// carries no page number; book 4 is a stray «تنبيه» page (an exam-instructions
// page whose text is a copy of the same page in the front matter, scan 6) printed
// between unit 1 and unit 2. Rather than weaken the page-number check, both are
// exempt from it and anchored on the only book-specific marker that survives on
// that page: the running foot for book 2 and the page's own head «تنبيه» for
// book 4. Because book 4 sits inside the term and after unit 1, it is owned by
// unit 1's last lesson (unit 1 therefore spans books 1–4).
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// The book prints no per-lesson «أهداف»; its lesson layer is the «أولاً/ثانياً»
// section headings its «المحتويات» lists. Every such heading is carried, verbatim,
// as a concept of the lesson whose page it starts on. Nothing is invented: every
// concept title below is a string the book itself prints on the page its
// `bookFrom` names.
//
// WHEN THE BOOK PRINTS TWO HEADS ON ONE PAGE THEY SHARE A LESSON
// The book sometimes starts two of its sections on the same page (unit 1 prints
// «علامات الاسم» and «علامات الفعل» on book 2; unit 6 prints «المفعول لأجله»,
// «المفعول معه» and «ظرفا الزمان والمكان» on book 84; unit 11 prints «المشتقات
// وعملها» and «اسم الفاعل» on book 161). A lesson here is therefore one page of
// heads: its `bookFrom` is that page and all those headings are its concepts, so
// the page is reachable exactly once and the ranges tile the whole term.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 6 (verified: book p.174 = scan p.180). */
export const BOOK_TO_PDF_OFFSET = 6;

/** First printed page of the term — the unit 1 opener (scan 7). */
export const EGYPT_NAHW_G10_T1_BOOK_START = 1;

/** Last printed page of the term — unit 13's last head (scan 180). */
export const EGYPT_NAHW_G10_T1_BOOK_END = 174;

/** The scanned pages before the term: cover, masthead, مقدمة and a تنبيه page. */
export const EGYPT_NAHW_G10_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The scanned pages after the term: the printed «المحتويات». */
export const EGYPT_NAHW_G10_T1_BACK_MATTER = { from: 181, to: 184 } as const;

/** One printed component of a lesson — becomes one concept in the app tree. */
export interface NahwG10T1Concept {
  /** Printed book page where this component starts. */
  bookFrom: number;
  /** The printed component kind: «مكوّن». */
  kind: string;
  /** The printed head of this component, verbatim. */
  title: string;
}

/** One lesson («درس» = one of the book's printed «أولاً/ثانياً» sections). */
export interface NahwG10T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** The lesson's opening component type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson (without the number prefix). */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: NahwG10T1Concept[];
}

/** One printed section of the book — one of the thirteen units of the first term. */
export interface NahwG10T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"13". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: الكلام المفيد - وأجزاؤه - وأقسام الكلمة". */
  title: string;
  /** The unit head the opener page prints, e.g. "الكلام المفيد - وأجزاؤه - وأقسام الكلمة". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: NahwG10T1Lesson[];
}

const TYPE = "مكوّن";

function concept(bookFrom: number, title: string): NahwG10T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The thirteen units of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from the book's «المحتويات» (scans 181–184); each
 * lesson's leading concept is the very heading the book prints on the page the
 * lesson starts on, and the book's own numbering of those headings («أولاً»،
 * «(١)»، «١-») is kept verbatim in `title`/`printedHead` even where it disagrees
 * from unit to unit.
 */
export const EGYPT_NAHW_G10_T1_UNITS: NahwG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: الكلام المفيد - وأجزاؤه - وأقسام الكلمة",
    printedHead: "الكلام المفيد - وأجزاؤه - وأقسام الكلمة",
    bookFrom: 1,
    bookTo: 4,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الكلام المفيد وأجزاؤه وأقسام الكلمة",
        printedHead: "أولاً: الكلام المفيد - وأجزاؤه - وأقسام الكلمة",
        bookFrom: 1,
        concepts: [concept(1, "أولاً: الكلام المفيد - وأجزاؤه - وأقسام الكلمة")],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "علامات الاسم",
        printedHead: "ثانياً : علامات الاسم",
        bookFrom: 2,
        concepts: [concept(2, "ثانياً : علامات الاسم"), concept(2, "ثالثاً : علامات الفعل")],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "علامة الحرف",
        printedHead: "رابعاً : علامةُ الحرفِ",
        bookFrom: 3,
        concepts: [concept(3, "رابعاً : علامةُ الحرفِ")],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: الاسم وأقسامه",
    printedHead: "الاسم وأقسامه",
    bookFrom: 5,
    bookTo: 24,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الاسم من حيث النوع",
        printedHead: "أولاً: الاسم من حيث النوع",
        bookFrom: 5,
        concepts: [concept(5, "أولاً: الاسم من حيث النوع")],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الاسم من حيث العدد",
        printedHead: "ثانيًا : الاسمُ من حيثُ العدد",
        bookFrom: 7,
        concepts: [concept(7, "ثانيًا : الاسمُ من حيثُ العدد")],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الاسم من حيث التعيين",
        printedHead: "ثالثاً : الاسمُ من حيثُ التعيين",
        bookFrom: 10,
        concepts: [concept(10, "ثالثاً : الاسمُ من حيثُ التعيين")],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "مقصور، منقوص، ممدود",
        printedHead: "رابعًا: الاسمُ: مقصورٌ، منقوصٌ، ممدودٌ",
        bookFrom: 22,
        concepts: [concept(22, "رابعًا: الاسمُ: مقصورٌ، منقوصٌ، ممدودٌ")],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الفعل وأقسامه",
    printedHead: "الفعل وأقسامه",
    bookFrom: 25,
    bookTo: 32,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "أقسام الفعل من حيث الزمن",
        printedHead: "أولًا - أقسام الفعل من حيث الزمن الماضي - المضارع - الأمر :",
        bookFrom: 25,
        concepts: [concept(25, "أولًا - أقسام الفعل من حيث الزمن الماضي - المضارع - الأمر :")],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "أقسام الفعل من حيث بنيته",
        printedHead: "ثانيًا - أقسامُ الفعلِ من حيثُ بنيتِهِ (معتلٌ وصحيحٌ) :",
        bookFrom: 26,
        concepts: [
          concept(26, "ثانيًا - أقسامُ الفعلِ من حيثُ بنيتِهِ (معتلٌ وصحيحٌ) :"),
          concept(26, "ثالثًا - أقسامُ الفعلِ من حيثُ تصرُّفِهِ (جامدٌ ومتصرِّفٌ) :"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "أقسام الفعل من حيث معموله",
        printedHead: "رابعًا - أقسامُ الفعلِ من حيثُ معمولِهِ :",
        bookFrom: 27,
        concepts: [concept(27, "رابعًا - أقسامُ الفعلِ من حيثُ معمولِهِ :")],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "أقسام الفعل من حيث تركيبه",
        printedHead: "خامسًا - أقسام الفعل من حيث تركيبه :",
        bookFrom: 29,
        concepts: [concept(29, "خامسًا - أقسام الفعل من حيث تركيبه :")],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "اسم الفعل",
        printedHead: "اسم الفعل",
        bookFrom: 31,
        concepts: [concept(31, "اسم الفعل")],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "الرابعة",
    title: "الوحدة الرابعة: المعرب والمبنى من الأسماء والأفعال",
    printedHead: "المعرب والمبنى من الأسماء والأفعال",
    bookFrom: 33,
    bookTo: 56,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "المعرب والمبنى من الأسماء",
        printedHead: "أولاً - المعرب والمبنى من الأسماء :",
        bookFrom: 33,
        concepts: [concept(33, "أولاً - المعرب والمبنى من الأسماء :")],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الأسماء الخمسة وإعرابها",
        printedHead: "الأسماءُ الخمسةُ وإعرابُها",
        bookFrom: 45,
        concepts: [concept(45, "الأسماءُ الخمسةُ وإعرابُها")],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الممنوع من الصرف",
        printedHead: "الممنوعُ من الصرفِ:",
        bookFrom: 46,
        concepts: [concept(46, "الممنوعُ من الصرفِ:")],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "المعرب والمبنى من الأفعال",
        printedHead: "ثانيًا - المعرب والمبنى من الأفعال",
        bookFrom: 50,
        concepts: [concept(50, "ثانيًا - المعرب والمبنى من الأفعال")],
      },
      {
        key: "4-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "علامات جزم الفعل المضارع",
        printedHead: "علاماتُ جزمِ الفعلِ المضارعِ",
        bookFrom: 53,
        concepts: [
          concept(53, "علاماتُ جزمِ الفعلِ المضارعِ"),
          concept(53, "ثالثا : المَبْنَى من الأفعالِ ، وأحوالُ بنائِها"),
        ],
      },
      {
        key: "4-6",
        ordinal: "السادس",
        type: TYPE,
        title: "الأفعال الخمسة وإعرابها",
        printedHead: "رابعًا : الأفعالُ الخمسةُ وإعرابُها",
        bookFrom: 56,
        concepts: [concept(56, "رابعًا : الأفعالُ الخمسةُ وإعرابُها")],
      },
    ],
  },
  {
    key: "5",
    kind: "unit",
    ordinal: "الخامسة",
    title: "الوحدة الخامسة: مرفوعات الأسماء",
    printedHead: "مرفوعات الأسماء",
    bookFrom: 57,
    bookTo: 80,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: TYPE,
        title: "المبتدأ والخبر",
        printedHead: "(١) المبتدأ والخبر",
        bookFrom: 57,
        concepts: [concept(57, "(١) المبتدأ والخبر")],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "كان وأخواتها",
        printedHead: "( ٢ ) كان وأخواتها",
        bookFrom: 64,
        concepts: [concept(64, "( ٢ ) كان وأخواتها")],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "أفعال المقاربة والرجاء والشروع",
        printedHead: "(٣) أفعال المقاربة والرجاء والشروع",
        bookFrom: 66,
        concepts: [concept(66, "(٣) أفعال المقاربة والرجاء والشروع")],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "إن وأخواتها",
        printedHead: "( ٤ ) إِنَّ وَأَخَوَاتُهَا",
        bookFrom: 70,
        concepts: [concept(70, "( ٤ ) إِنَّ وَأَخَوَاتُهَا")],
      },
      {
        key: "5-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "لا النافية للجنس",
        printedHead: "(٥) لا : النافية للجنس",
        bookFrom: 73,
        concepts: [concept(73, "(٥) لا : النافية للجنس")],
      },
      {
        key: "5-6",
        ordinal: "السادس",
        type: TYPE,
        title: "الفاعل",
        printedHead: "( ٦ ) الفاعلُ",
        bookFrom: 77,
        concepts: [concept(77, "( ٦ ) الفاعلُ")],
      },
      {
        key: "5-7",
        ordinal: "السابع",
        type: TYPE,
        title: "نائب الفاعل",
        printedHead: "(٧) نائبُ الفاعلِ - وتغييراتُ الفعلِ معهُ",
        bookFrom: 78,
        concepts: [concept(78, "(٧) نائبُ الفاعلِ - وتغييراتُ الفعلِ معهُ")],
      },
    ],
  },
  {
    key: "6",
    kind: "unit",
    ordinal: "السادسة",
    title: "الوحدة السادسة: منصوبات الأسماء",
    printedHead: "منصوبات الأسماء",
    bookFrom: 81,
    bookTo: 102,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: TYPE,
        title: "المفعول به",
        printedHead: "(١) المفعول به",
        bookFrom: 81,
        concepts: [concept(81, "(١) المفعول به")],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "المفعول المطلق",
        printedHead: "( ٢ ) المفعولُ المطلقُ",
        bookFrom: 83,
        concepts: [concept(83, "( ٢ ) المفعولُ المطلقُ")],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "المفعول لأجله",
        printedHead: "( ٣ ) المفعولُ لأجلِهِ",
        bookFrom: 84,
        concepts: [
          concept(84, "( ٣ ) المفعولُ لأجلِهِ"),
          concept(84, "(٤) المفعولُ مَعَه"),
          concept(84, "( ٥ ) ظرفا الزمانِ والمكانِ"),
        ],
      },
      {
        key: "6-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "الحال وأنواعها",
        printedHead: "( ٦ ) الحالُ وأنواعُها : ( مُفردة - جُملة - شِبه جُملة )",
        bookFrom: 88,
        concepts: [concept(88, "( ٦ ) الحالُ وأنواعُها : ( مُفردة - جُملة - شِبه جُملة )")],
      },
      {
        key: "6-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "الاستثناء وأدواته",
        printedHead: "(٧) الاستثناء وأدواته",
        bookFrom: 90,
        concepts: [concept(90, "(٧) الاستثناء وأدواته")],
      },
      {
        key: "6-6",
        ordinal: "السادس",
        type: TYPE,
        title: "المنادى",
        printedHead: "(۸) المُنادَى",
        bookFrom: 93,
        concepts: [concept(93, "(۸) المُنادَى")],
      },
      {
        key: "6-7",
        ordinal: "السابع",
        type: TYPE,
        title: "التمييز",
        printedHead: "( 9 ) التمييزُ",
        bookFrom: 96,
        concepts: [concept(96, "( 9 ) التمييزُ")],
      },
    ],
  },
  {
    key: "7",
    kind: "unit",
    ordinal: "السابعة",
    title: "الوحدة السابعة: مجرورات الأسماء",
    printedHead: "مجرورات الأسماء",
    bookFrom: 103,
    bookTo: 108,
    lessons: [
      {
        key: "7-1",
        ordinal: "الأول",
        type: TYPE,
        title: "المجرور بحرف الجر",
        printedHead: "(1) المجرور بحرف الجر",
        bookFrom: 103,
        concepts: [concept(103, "(1) المجرور بحرف الجر")],
      },
      {
        key: "7-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "المجرور بالإضافة",
        printedHead: "(۲) المجرورُ بالإضافة (المضافُ إليه)",
        bookFrom: 107,
        concepts: [concept(107, "(۲) المجرورُ بالإضافة (المضافُ إليه)")],
      },
    ],
  },
  {
    key: "8",
    kind: "unit",
    ordinal: "الثامنة",
    title: "الوحدة الثامنة: التوابع",
    printedHead: "التوابع",
    bookFrom: 109,
    bookTo: 118,
    lessons: [
      {
        key: "8-1",
        ordinal: "الأول",
        type: TYPE,
        title: "النعت",
        printedHead: "(1) النعتُ",
        bookFrom: 109,
        concepts: [concept(109, "(1) النعتُ")],
      },
      {
        key: "8-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "العطف",
        printedHead: "( ۲ ) العَطْفُ",
        bookFrom: 112,
        concepts: [concept(112, "( ۲ ) العَطْفُ")],
      },
      {
        key: "8-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "التوكيد",
        printedHead: "(۳) التوكيدُ",
        bookFrom: 115,
        concepts: [concept(115, "(۳) التوكيدُ")],
      },
      {
        key: "8-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "البدل",
        printedHead: "(٤) البدلُ - أنواعُه",
        bookFrom: 118,
        concepts: [concept(118, "(٤) البدلُ - أنواعُه")],
      },
    ],
  },
  {
    key: "9",
    kind: "unit",
    ordinal: "التاسعة",
    title: "الوحدة التاسعة: الأساليب",
    printedHead: "الأساليب",
    bookFrom: 119,
    bookTo: 134,
    lessons: [
      {
        key: "9-1",
        ordinal: "الأول",
        type: TYPE,
        title: "أسلوب الشرط",
        printedHead: "(1) أُسلوبُ الشَّرْطِ",
        bookFrom: 119,
        concepts: [concept(119, "(1) أُسلوبُ الشَّرْطِ")],
      },
      {
        key: "9-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "أسلوب القسم",
        printedHead: "(٢) أسلوبُ القَسَمِ",
        bookFrom: 123,
        concepts: [concept(123, "(٢) أسلوبُ القَسَمِ")],
      },
      {
        key: "9-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "أسلوب المدح والذم",
        printedHead: "(۳) أسلوب المدح والذم",
        bookFrom: 125,
        concepts: [concept(125, "(۳) أسلوب المدح والذم")],
      },
      {
        key: "9-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "أسلوب التعجب",
        printedHead: "(٤) أسلوبُ التعجُّبِ",
        bookFrom: 126,
        concepts: [concept(126, "(٤) أسلوبُ التعجُّبِ")],
      },
      {
        key: "9-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "أسلوب الإغراء والتحذير",
        printedHead: "(٥) أسلوبُ الإغراءِ والتحذيرِ",
        bookFrom: 128,
        concepts: [concept(128, "(٥) أسلوبُ الإغراءِ والتحذيرِ")],
      },
      {
        key: "9-6",
        ordinal: "السادس",
        type: TYPE,
        title: "أسلوب الاختصاص",
        printedHead: "(٦) أُسْلوبُ الِاخْتِصَاصِ",
        bookFrom: 131,
        concepts: [concept(131, "(٦) أُسْلوبُ الِاخْتِصَاصِ")],
      },
      {
        key: "9-7",
        ordinal: "السابع",
        type: TYPE,
        title: "أسلوب الاستفهام",
        printedHead: "(۷) أسلوبُ الاستفهام وأدواته",
        bookFrom: 133,
        concepts: [concept(133, "(۷) أسلوبُ الاستفهام وأدواته")],
      },
    ],
  },
  {
    key: "10",
    kind: "unit",
    ordinal: "العاشرة",
    title: "الوحدة العاشرة: الجمل التي لها محل من الإعراب والتي ليس لها محل من الإعراب",
    printedHead: "الجمل التي لها محل من الإعراب والتي ليس لها محل من الإعراب",
    bookFrom: 135,
    bookTo: 144,
    lessons: [
      {
        key: "10-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الجمل التي لها محل من الإعراب",
        printedHead: "١- الجملُ التى لها محلّ من الإعراب",
        bookFrom: 135,
        concepts: [concept(135, "١- الجملُ التى لها محلّ من الإعراب")],
      },
      {
        key: "10-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الجمل التي لا محل لها من الإعراب",
        printedHead: "1 - الجملُ التي لا محل لها من الإعراب",
        bookFrom: 140,
        concepts: [concept(140, "1 - الجملُ التي لا محل لها من الإعراب")],
      },
    ],
  },
  {
    key: "11",
    kind: "unit",
    ordinal: "الحادية عشرة",
    title: "الوحدة الحادية عشرة: الميزان الصرفي والمشتقات",
    printedHead: "الميزان الصرفي والمشتقات",
    bookFrom: 145,
    bookTo: 170,
    lessons: [
      {
        key: "11-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الميزان الصرفي",
        printedHead: "١- الميزان الصرفي",
        bookFrom: 145,
        concepts: [concept(145, "١- الميزان الصرفي")],
      },
      {
        key: "11-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الكشف في المعجم",
        printedHead: "٢- الكشف في المعجم",
        bookFrom: 147,
        concepts: [concept(147, "٢- الكشف في المعجم")],
      },
      {
        key: "11-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "إسناد الأفعال إلى الضمائر",
        printedHead: "٣- إسنادُ الأفعالِ إلى الضمائرِ",
        bookFrom: 149,
        concepts: [concept(149, "٣- إسنادُ الأفعالِ إلى الضمائرِ")],
      },
      {
        key: "11-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "المصدر وصوغه",
        printedHead: "٤ - المَصْدَرُ وصَوْغُهُ",
        bookFrom: 155,
        concepts: [concept(155, "٤ - المَصْدَرُ وصَوْغُهُ")],
      },
      {
        key: "11-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "المشتقات وعملها",
        printedHead: "٥- المشتقات وعملها",
        bookFrom: 161,
        concepts: [concept(161, "٥- المشتقات وعملها"), concept(161, "أولاً : اسم الفاعل")],
      },
      {
        key: "11-6",
        ordinal: "السادس",
        type: TYPE,
        title: "صيغ المبالغة",
        printedHead: "ثانيًا: صيغُ المبالغَةِ",
        bookFrom: 162,
        concepts: [concept(162, "ثانيًا: صيغُ المبالغَةِ")],
      },
      {
        key: "11-7",
        ordinal: "السابع",
        type: TYPE,
        title: "اسم المفعول",
        printedHead: "ثالثًا : اسمُ المفعولِ",
        bookFrom: 163,
        concepts: [concept(163, "ثالثًا : اسمُ المفعولِ")],
      },
      {
        key: "11-8",
        ordinal: "الثامن",
        type: TYPE,
        title: "الصفة المشبهة",
        printedHead: "رابعاً: الصَّفَةُ المشبهةُ",
        bookFrom: 165,
        concepts: [concept(165, "رابعاً: الصَّفَةُ المشبهةُ")],
      },
      {
        key: "11-9",
        ordinal: "التاسع",
        type: TYPE,
        title: "اسم التفضيل",
        printedHead: "خامساً : اسمُ التَّفْضيل",
        bookFrom: 166,
        concepts: [concept(166, "خامساً : اسمُ التَّفْضيل")],
      },
      {
        key: "11-10",
        ordinal: "العاشر",
        type: TYPE,
        title: "اسم الزمان واسم المكان",
        printedHead: "سادسًا : اسمُ الزَّمانِ واسمُ المكانِ",
        bookFrom: 168,
        concepts: [concept(168, "سادسًا : اسمُ الزَّمانِ واسمُ المكانِ")],
      },
      {
        key: "11-11",
        ordinal: "الحادي عشر",
        type: TYPE,
        title: "اسم الآلة",
        printedHead: "سابعاً : اسمُ الآلةِ",
        bookFrom: 170,
        concepts: [concept(170, "سابعاً : اسمُ الآلةِ")],
      },
    ],
  },
  {
    key: "12",
    kind: "unit",
    ordinal: "الثانية عشرة",
    title: "الوحدة الثانية عشرة: همزتا الوصل والقطع",
    printedHead: "همزتا الوصل والقطع",
    bookFrom: 171,
    bookTo: 172,
    lessons: [
      {
        key: "12-1",
        ordinal: "الأول",
        type: TYPE,
        title: "همزتا الوصل والقطع",
        printedHead: "همزتا الوصل والقطع",
        bookFrom: 171,
        concepts: [concept(171, "همزتا الوصل والقطع")],
      },
    ],
  },
  {
    key: "13",
    kind: "unit",
    ordinal: "الثالثة عشرة",
    title: "الوحدة الثالثة عشرة: علامات الترقيم",
    printedHead: "علامات الترقيم",
    bookFrom: 173,
    bookTo: 174,
    lessons: [
      {
        key: "13-1",
        ordinal: "الأول",
        type: TYPE,
        title: "علامات الترقيم",
        printedHead: "علامات الترقيم",
        bookFrom: 173,
        concepts: [concept(173, "علامات الترقيم")],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the unit
 * — so the unit opener stays inside the unit it belongs to. When the book prints
 * two heads on one page they share a lesson, so distinct lessons always start on
 * distinct pages and the ranges tile the unit exactly.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_NAHW_G10_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_NAHW_G10_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This book has no
 * appendix and no back matter that any lesson quotes: every page of the term
 * belongs to a unit. Kept as a function so the seeder and the stage share one
 * shape across all the books.
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
  "nahw-g10-t1",
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
 * either a bare numeral standing alone on one of the last lines («١٠٣»، «١٧٤») or
 * the running foot «القواعد الأساسية للنحو والصرف … أم القرى للطباعة», which
 * carries the number beside it («٥٤ القواعد الأساسية للنحو والصرف»), so the last
 * three lines are scanned and every number on a foot-looking line is a candidate.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const tail = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(-3);
  const nums: number[] = [];
  for (const line of tail) {
    const looksLikeFoot =
      /^[\[\(]?[0-9٠-٩۰-۹]+[\]\)]?$/.test(line) || /القواعد الأساسية|أم القرى|ام القرى/.test(line);
    if (!looksLikeFoot) continue;
    const latin = toLatinDigits(line).replace(/[^0-9]/g, " ").replace(/\s+/g, " ").trim();
    for (const tok of latin.split(" ")) if (tok) nums.push(Number(tok));
  }
  return [...new Set(nums)].filter((n) => n > 0);
}

/**
 * The book number a content page prints at its foot, or null. Every content page
 * that carries a folio prints exactly one number there and it is its own, which is
 * what fixes the offset; pages 2 and 4 lost their folio in the OCR and are handled
 * by `FOLIO_LESS_ANCHORS` instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The only two term pages that print no folio in the OCR, each with the anchor the
 * check accepts in place of a page number:
 *   • book 2 prints the running foot «القواعد الأساسية للنحو والصرف … أم القرى
 *     للطباعة» but no number;
 *   • book 4 is a stray «تنبيه» page printed between unit 1 and unit 2 and prints
 *     neither a folio nor the running foot.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  2: "القواعد الأساسية للنحو والصرف",
  4: "تنبيه",
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
  const units = EGYPT_NAHW_G10_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_NAHW_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_NAHW_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_NAHW_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_NAHW_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio, or, on the two OCR-missed pages, from the anchor named in
 *     `FOLIO_LESS_ANCHORS`;
 *  2. every unit's opener prints the unit head and every lesson's first page prints
 *     that lesson's head;
 *  3. every lesson's title and every concept's head is printed on the pages the
 *     lesson owns (the concept on its own page);
 *  4. every printed page in [1, 174] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_NAHW_G10_T1_UNITS;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_NAHW_G10_T1_BOOK_START || book > EGYPT_NAHW_G10_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_NAHW_G10_T1_BOOK_END - EGYPT_NAHW_G10_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_NAHW_G10_T1_BOOK_START} و${EGYPT_NAHW_G10_T1_BOOK_END}`,
    );
  }

  // 2 + 3a. every unit opener prints the unit head, every lesson's first page its
  // head, and every lesson's title is printed somewhere in the pages it owns.
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
  for (let p = EGYPT_NAHW_G10_T1_BOOK_START; p <= EGYPT_NAHW_G10_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
