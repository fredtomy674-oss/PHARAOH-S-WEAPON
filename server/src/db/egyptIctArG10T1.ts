// PHASE G10-ict-ar — official Egypt Secondary-1 (Grade 10) ICT (Arabic-medium
// edition), first term («كتاب الوزارة»).
//
// The curriculum `eg-g10-ict` is rebuilt from the Arabic-medium textbook
// «البرمجة والذكاء الاصطناعي — مقدمة في تكنولوجيا المعلومات والاتصالات —
// للصف الأول الثانوي» (218 OCR pages; the cover, scan 1, prints exactly this
// title). This module is the single source of truth for its structure: the
// thirteen printed units (الوحدة الأولى … الوحدة الثالثة عشر) of the first
// term, the sixty-two lessons its unit dividers list (الدرس 1 …), and, for
// every lesson, the book's own printed heads. The self-checks at the bottom
// prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS ZERO — book page = OCR page index
// Every content page carries its own folio next to the running foot «الفهرس»,
// in Latin digits: OCR `pages-008` ends «8 / الفهرس», `pages-017` ends
// «17 / الفهرس», `pages-068` ends «68 / الفهرس», `pages-125` ends
// «125 / الفهرس», `pages-191` ends «191 / الفهرس», `pages-217` ends
// «217 / الفهرس». So `BOOK_TO_PDF_OFFSET` is 0 and `loadBookPage(book)` reads
// `pages-{book}`. Unlike the English twin (whose folio is glued to the first
// line), here the folio is a standalone line beside the running foot —
// `printedFooter` requires BOTH that line and the «الفهرس» foot.
//
// FRONT AND BACK MATTER ARE NOT THE TERM
// OCR pages 1–6 are before the term: the cover (1) and the printed «الفهرس»
// (2–6; the vision OCR captured only fragments such as «7…», «44 …», «79 …»,
// «119 …», «161 …»). OCR page 218 is after the term: a divider printing only
// «EDUCATION SPRINGS NEW LIFE / SPRIX / رؤية / 20 30 / VISION OF EGYPT». The
// term runs from OCR page 7 (the unit 1 divider) to OCR page 217 (unit 13,
// lesson 13-12), so `EGYPT_ICT_G10_AR_T1_BOOK_START = 7` and
// `..._BOOK_END = 217`; the checks prove the whole term is tiled with no gaps,
// so nothing is unreachable. `pagesChecked` therefore equals 217 − 7 + 1 = 211.
//
// SIXTEEN TERM PAGES PRINT NO FOLIO IN THE OCR
// The thirteen unit-divider spreads (7, 16, 29, 48, 53, 61, 96, 107, 124,
// 135, 153, 167, 190) are unnumbered by design: they print the unit ordinal,
// the unit title and the lesson list, but no folio and no running foot. Three
// further pages lost their footer in the OCR: 140 is a printed worksheet
// figure (a mean computation, captured as two figure lines with no words at
// all), and 163–164 are full-page activity spreads (a «جرب بنفسك» simulation
// sheet and a «تمرين» exercise sheet). Rather than weaken the page-number
// check, all sixteen are exempt from it and anchored on a book-specific string
// that survives on that page (`FOLIO_LESS_ANCHORS`): the unit ordinal for the
// dividers, the figure's data line for 140, and each activity sheet's own
// simulation head for 163–164.
//
// ONE UNIT = ONE CHAPTER, ONE PRINTED «الدرس N» ENTRY = ONE LESSON
// The book's dividers stop at their «الدرس N» entries, so the app mirrors the
// book: unit → lesson. A lesson's `bookFrom` is the page that prints its
// numbered heading (e.g. «1-1 المعلومات والوسائط» on page 8); the range it
// owns runs to the page before the next lesson starts (or to the unit's last
// page), so the ranges tile each unit and the units tile the term exactly.
// The first lesson of each unit owns from the unit divider (`unit.bookFrom`),
// so every divider stays inside the unit it belongs to. The vision OCR often
// swaps the two digits of a lesson number («2-1» for 2-1, «5-3» for 3-5) or
// flattens a parenthetical part number («4» for (1) on page 41); the numbers
// are therefore never asserted — only the title words are, and they are
// unambiguous on all 62 openers.
//
// WHY A LESSON'S CONCEPTS ARE ITS PRINTED HEADS
// This book prints no per-lesson «Objectives» list; its lesson layer is the
// printed section headings (the «أ./ب.» heads, the «1./2.» heads, and the
// same distinction the English twin's `concepts` carry). Every `concepts`
// entry below is a string the book itself prints — enumerators («أ.»,
// «(1)») dropped exactly as the twin drops them — transcribed in Arabic and
// mirroring the twin's concept-for-concept granularity so the two editions
// stay parallel. Nothing is invented.
//
// HEAD-vs-DIVIDER WORDING (heads win; each is documented here so no choice
// below is a guess):
// • 3-2/3-3 print the same head «التهديدات والتدابير المضادة في أمن المعلومات»
//   (the divider lists 3-2 under 3-1's variant «تهديدات وإجراءات مواجهة أمن
//   المعلومات (2)»); the book tells them apart by lesson number, so both
//   lessons carry the head-verbatim title.
// • 3-4 prints «تقنيات المعلومات للسلامة» with its «(1)» OCR'd as «4», so the
//   garbled digit is omitted; 3-5 prints «تكنولوجيا المعلومات للسلامة (2)»
//   (the divider writes «تقنيات» for both — the heads, in large print, disagree
//   and are followed here).
// • 6-5 prints «العمليات الحسابية [1]» and 6-6 «العمليات الحسابية العددية [2]»
//   (the divider writes «الحسابات» for both — never repeated anywhere else).
// • 8-3 prints «بروتوكول الاتصال» (divider: the plural «بروتوكولات الاتصال»).
// • 9-2 prints «قواعد بيانات [2]» without «ال» (divider and body: «قواعد
//   البيانات»; the head is followed verbatim).
// • 6-3 prints «النظام السادس عشر» with «ال» (divider: «نظام السادس عشر»).
// • Units 10–12 print their part numbers as «[N]» on the lesson heads while
//   the dividers write «(N)»; the heads are followed.
// • 13-9 prints no «1» anywhere in its range (divider: «… القوالب 1»); the
//   head-verbatim title stands without it, unlike 13-10's printed «2».
// • Unit ordinals 11–13 print the masculine «عشر» («الحادية عشر»، «الثانية
//   عشر»، «الثالثة عشر»), kept verbatim.
// • Unit 7's title prints as «الكمبيوترات», kept verbatim.
// • Unit 13's divider prints «الذكاء الاصطناعي التوليدي» in the chapter-title
//   position (duplicating lesson 13-1's title); «برمجة الذكاء الاصطناعي»
//   appears nowhere in the Arabic book, so the printed title stands even
//   though the English twin calls the chapter «AI Programming».
// • 12-4 prints a stray line «معالجة الأخطاء» once on its opener with no
//   elaboration anywhere in its range (a figure caption, absent from the twin
//   edition's parallel page); it is not a head and is not a concept.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ OCR page index N + 0 (verified: book p.8 = OCR 8). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First page of the term — the unit 1 divider (OCR page 7). */
export const EGYPT_ICT_G10_AR_T1_BOOK_START = 7;

/** Last printed page of the term — unit 13, lesson 13-12 (OCR page 217). */
export const EGYPT_ICT_G10_AR_T1_BOOK_END = 217;

/** The OCR pages before the term: the cover and the printed «الفهرس». */
export const EGYPT_ICT_G10_AR_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The OCR pages after the term: the «EDUCATION SPRINGS NEW LIFE» divider. */
export const EGYPT_ICT_G10_AR_T1_BACK_MATTER = { from: 218, to: 218 } as const;

/** One lesson (one printed «الدرس N» entry) of the textbook. */
export interface IctG10ArT1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed at the head of the lesson, verbatim (Arabic). */
  title: string;
  /** First printed page of the lesson — the page that prints its title. */
  bookFrom: number;
  /**
   * The book's printed heads for this lesson, transcribed verbatim from the
   * page its `bookFrom` names (there is no «Objectives» list in this book).
   */
  concepts: string[];
}

/** One printed section of the book — one of the thirteen units of term 1. */
export interface IctG10ArT1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed on the unit divider, verbatim (Arabic). */
  title: string;
  /** First printed book page of the unit — its divider page. */
  bookFrom: number;
  /** Last printed book page of the unit — the page before the next divider. */
  bookTo: number;
  lessons: IctG10ArT1Lesson[];
}

/**
 * The thirteen units of the first term with their sixty-two printed lessons:
 * unit/lesson starts from the book's own dividers (OCR pages 7, 16, 29, 48,
 * 53, 61, 96, 107, 124, 135, 153, 167, 190), titles and heads from each
 * lesson's first page. Verified against every printed page by
 * `assertTreeMatchesTheBook`.
 */
export const EGYPT_ICT_G10_AR_T1_UNITS: IctG10ArT1Unit[] = [
  {
    ordinal: "الأولى",
    title: "ما هي المعلومات؟",
    bookFrom: 7,
    bookTo: 15,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "المعلومات والوسائط",
        bookFrom: 8,
        concepts: ["البيانات، المعلومات، المعرفة", "الوسائط (Media)"],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "أخلاقيات المعلومات",
        bookFrom: 12,
        concepts: ["أخلاقيات المعلومات", "المشاكل التي تحدث مع الهواتف الذكية ووسائل التواصل الاجتماعي"],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "القوانين والحقوق في مجتمع المعلومات",
    bookFrom: 16,
    bookTo: 28,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "البيانات الشخصية",
        bookFrom: 17,
        concepts: ["البيانات الشخصية"],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "حقوق الملكية الفكرية",
        bookFrom: 21,
        concepts: ["حقوق الملكية الفكرية"],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "استخدام المعلومات والكشف عنها",
        bookFrom: 25,
        concepts: ["استخدام وكشف المعلومات", "الغرض من حقوق المؤلف"],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "أمن المعلومات",
    bookFrom: 29,
    bookTo: 47,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "تهديدات وإجراءات مواجهة أمن المعلومات (1)",
        bookFrom: 30,
        concepts: ["أمن المعلومات", "العناصر الأساسية الثلاثة لأمن المعلومات"],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "التهديدات والتدابير المضادة في أمن المعلومات",
        bookFrom: 34,
        concepts: ["كلمات المرور والمصادقة"],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "التهديدات والتدابير المضادة في أمن المعلومات",
        bookFrom: 38,
        concepts: ["الاحتيال بالفواتير"],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        title: "تقنيات المعلومات للسلامة",
        bookFrom: 41,
        concepts: ["التشفير (Encryption)"],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        title: "تكنولوجيا المعلومات للسلامة (2)",
        bookFrom: 44,
        concepts: ["التوقيع الرقمي (Digital Signature)", "دالة التجزئة (Hash function)"],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "تكنولوجيا المعلومات والمجتمع",
    bookFrom: 48,
    bookTo: 52,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "تطور تكنولوجيا المعلومات",
        bookFrom: 49,
        concepts: ["التقدم في تكنولوجيا المعلومات والمجتمع المستقبلي", "تدفق التطور المجتمعي"],
      },
    ],
  },
  {
    ordinal: "الخامسة",
    title: "الاتصالات",
    bookFrom: 53,
    bookTo: 60,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        title: "تطوير وسائل الاتصال",
        bookFrom: 54,
        concepts: ["تطوير وسائل الاتصال", "الاتصال وتطوره"],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        title: "الاتصال وأشكاله",
        bookFrom: 56,
        concepts: ["الاتصال وأشكاله", "تصنيف الاتصال"],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        title: "الإنترنت والاتصالات",
        bookFrom: 58,
        concepts: ["الاتصال عبر الإنترنت"],
      },
    ],
  },
  {
    ordinal: "السادسة",
    title: "تصميم المعلومات",
    bookFrom: 61,
    bookTo: 95,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        title: "التناظري والرقمي",
        bookFrom: 62,
        concepts: ["التناظرية والرقمية"],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        title: "النظام الثنائي وكمية البيانات",
        bookFrom: 64,
        concepts: ["bits & Bytes"],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        title: "النظام السادس عشر (Hexadecimal)",
        bookFrom: 68,
        concepts: ["النظام السادس عشر"],
      },
      {
        key: "6-4",
        ordinal: "الرابع",
        title: "التمثيل الرقمي للأحرف",
        bookFrom: 70,
        concepts: ["التمثيل الرقمي للأحرف", "رمز الحرف (Character code)", "نظام رموز الأحرف (Character code system)"],
      },
      {
        key: "6-5",
        ordinal: "الخامس",
        title: "العمليات الحسابية [1]",
        bookFrom: 74,
        concepts: ["جمع وطرح الأرقام الثنائية"],
      },
      {
        key: "6-6",
        ordinal: "السادس",
        title: "العمليات الحسابية العددية [2]",
        bookFrom: 76,
        concepts: ["تمثيل الأرقام السالبة باستخدام المتممات"],
      },
      {
        key: "6-7",
        ordinal: "السابع",
        title: "رقمنة الصوت",
        bookFrom: 79,
        concepts: ["الصوت", "رقمنة الصوت"],
      },
      {
        key: "6-8",
        ordinal: "الثامن",
        title: "رقمنة الصور",
        bookFrom: 83,
        concepts: ["رقمنة الصور"],
      },
      {
        key: "6-9",
        ordinal: "التاسع",
        title: "التمثيل الرقمي وضغط الفيديو",
        bookFrom: 87,
        concepts: ["آلية الفيديو", "ضغط البيانات"],
      },
      {
        key: "6-10",
        ordinal: "العاشر",
        title: "تصميم البيانات",
        bookFrom: 92,
        concepts: ["تصميم البيانات", "تقنيات التصميم لسهولة الفهم"],
      },
    ],
  },
  {
    ordinal: "السابعة",
    title: "الكمبيوترات",
    bookFrom: 96,
    bookTo: 106,
    lessons: [
      {
        key: "7-1",
        ordinal: "الأول",
        title: "بنية الكمبيوتر",
        bookFrom: 97,
        concepts: ["المكونات الخمسة الرئيسية للحاسوب"],
      },
      {
        key: "7-2",
        ordinal: "الثاني",
        title: "برامج الكمبيوتر",
        bookFrom: 101,
        concepts: ["الأجهزة والبرمجيات"],
      },
      {
        key: "7-3",
        ordinal: "الثالث",
        title: "الدوائر المنطقية",
        bookFrom: 103,
        concepts: ["الدوائر المنطقية"],
      },
    ],
  },
  {
    ordinal: "الثامنة",
    title: "الشبكات",
    bookFrom: 107,
    bookTo: 123,
    lessons: [
      {
        key: "8-1",
        ordinal: "الأول",
        title: "شبكات الكمبيوتر",
        bookFrom: 108,
        concepts: ["شبكات المعلومات والاتصالات"],
      },
      {
        key: "8-2",
        ordinal: "الثاني",
        title: "عناوين IP وأسماء النطاقات",
        bookFrom: 112,
        concepts: ["عناوين IP وأسماء النطاقات"],
      },
      {
        key: "8-3",
        ordinal: "الثالث",
        title: "بروتوكول الاتصال",
        bookFrom: 114,
        concepts: ["بروتوكول الاتصال"],
      },
      {
        key: "8-4",
        ordinal: "الرابع",
        title: "آلية عمل صفحات الويب والبريد الإلكتروني",
        bookFrom: 118,
        concepts: ["آلية الإنترنت"],
      },
      {
        key: "8-5",
        ordinal: "الخامس",
        title: "سرعة نقل البيانات على الشبكات",
        bookFrom: 122,
        concepts: ["سرعة نقل الشبكة"],
      },
    ],
  },
  {
    ordinal: "التاسعة",
    title: "قواعد البيانات",
    bookFrom: 124,
    bookTo: 134,
    lessons: [
      {
        key: "9-1",
        ordinal: "الأول",
        title: "قواعد البيانات [1]",
        bookFrom: 125,
        concepts: ["نظام إدارة قواعد البيانات"],
      },
      {
        key: "9-2",
        ordinal: "الثاني",
        title: "قواعد بيانات [2]",
        bookFrom: 129,
        concepts: ["قاعدة بيانات علائقية"],
      },
      {
        key: "9-3",
        ordinal: "الثالث",
        title: "نظم المعلومات المختلفة",
        bookFrom: 133,
        concepts: ["أنظمة المعلومات"],
      },
    ],
  },
  {
    ordinal: "العاشرة",
    title: "تحليل البيانات",
    bookFrom: 135,
    bookTo: 152,
    lessons: [
      {
        key: "10-1",
        ordinal: "الأول",
        title: "أنواع البيانات والتحليل",
        bookFrom: 136,
        concepts: ["أنواع البيانات"],
      },
      {
        key: "10-2",
        ordinal: "الثاني",
        title: "تحليل البيانات [1]",
        bookFrom: 138,
        concepts: ["جمع البيانات"],
      },
      {
        key: "10-3",
        ordinal: "الثالث",
        title: "تحليل البيانات [2]",
        bookFrom: 142,
        concepts: ["الرباعي (Quartile)"],
      },
      {
        key: "10-4",
        ordinal: "الرابع",
        title: "تحليل البيانات [3]",
        bookFrom: 145,
        concepts: ["التباين والانحراف المعياري"],
      },
      {
        key: "10-5",
        ordinal: "الخامس",
        title: "تحليل البيانات [4]",
        bookFrom: 147,
        concepts: ["المخططات المبعثرة والارتباطات والجدولة المتقاطعة"],
      },
      {
        key: "10-6",
        ordinal: "السادس",
        title: "تحليل البيانات [5]",
        bookFrom: 151,
        concepts: ["تحليل الانحدار (Regression Analysis)"],
      },
    ],
  },
  {
    ordinal: "الحادية عشر",
    title: "المحاكاة",
    bookFrom: 153,
    bookTo: 166,
    lessons: [
      {
        key: "11-1",
        ordinal: "الأول",
        title: "النمذجة",
        bookFrom: 154,
        concepts: ["النمذجة"],
      },
      {
        key: "11-2",
        ordinal: "الثاني",
        title: "المحاكاة [1]",
        bookFrom: 157,
        concepts: ["طرق الرجوع في برامج جداول البيانات"],
      },
      {
        key: "11-3",
        ordinal: "الثالث",
        title: "المحاكاة [2]",
        bookFrom: 161,
        concepts: ["استخدام الوظائف في برامج جداول البيانات"],
      },
      {
        key: "11-4",
        ordinal: "الرابع",
        title: "Queues",
        bookFrom: 165,
        concepts: ["قوائم الانتظار"],
      },
    ],
  },
  {
    ordinal: "الثانية عشر",
    title: "البرمجة",
    bookFrom: 167,
    bookTo: 189,
    lessons: [
      {
        key: "12-1",
        ordinal: "الأول",
        title: "الخوارزميات",
        bookFrom: 168,
        concepts: ["الخوارزمية (Algorithm)", "المخططات الانسيابية ومخططات النشاط"],
      },
      {
        key: "12-2",
        ordinal: "الثاني",
        title: "أساسيات البرمجة [1]",
        bookFrom: 172,
        concepts: ["المتغيرات والبنية التسلسلية"],
      },
      {
        key: "12-3",
        ordinal: "الثالث",
        title: "أساسيات البرمجة [2]",
        bookFrom: 176,
        concepts: ["هيكل الحلقة"],
      },
      {
        key: "12-4",
        ordinal: "الرابع",
        title: "البرمجة التطبيقية [1]",
        bookFrom: 182,
        concepts: ["القائمة (قائمة)"],
      },
      {
        key: "12-5",
        ordinal: "الخامس",
        title: "البرمجة التطبيقية [2]",
        bookFrom: 186,
        concepts: ["(الدالة - Function)"],
      },
    ],
  },
  {
    ordinal: "الثالثة عشر",
    title: "الذكاء الاصطناعي التوليدي",
    bookFrom: 190,
    bookTo: 217,
    lessons: [
      {
        key: "13-1",
        ordinal: "الأول",
        title: "الذكاء الاصطناعي التوليدي",
        bookFrom: 191,
        concepts: ["ماهية الذكاء الاصطناعي التوليدي (Generative AI)"],
      },
      {
        key: "13-2",
        ordinal: "الثاني",
        title: "HTML, CSS",
        bookFrom: 193,
        concepts: ["HTML, CSS"],
      },
      {
        key: "13-3",
        ordinal: "الثالث",
        title: "HTML, JS",
        bookFrom: 196,
        concepts: ["HTML, JS"],
      },
      {
        key: "13-4",
        ordinal: "الرابع",
        title: "إنشاء صفحة ويب ثابتة",
        bookFrom: 201,
        concepts: ["إنشاء صفحة ويب ثابتة"],
      },
      {
        key: "13-5",
        ordinal: "الخامس",
        title: "إنشاء صفحات ويب تفاعلية",
        bookFrom: 205,
        concepts: ["إنشاء صفحات ويب تفاعلية"],
      },
      {
        key: "13-6",
        ordinal: "السادس",
        title: "عرض تقديمي لموقع الويب",
        bookFrom: 207,
        concepts: ["عرض تقديمي لموقع الويب"],
      },
      {
        key: "13-7",
        ordinal: "السابع",
        title: "تطوير تطبيق اختبارات",
        bookFrom: 208,
        concepts: ["تطوير تطبيق اختبارات"],
      },
      {
        key: "13-8",
        ordinal: "الثامن",
        title: "مراجعة تطبيق الاختبارات",
        bookFrom: 210,
        concepts: ["مراجعة تطبيق الاختبارات"],
      },
      {
        key: "13-9",
        ordinal: "التاسع",
        title: "تطوير لعبة تكسير القوالب",
        bookFrom: 211,
        concepts: ["تطوير لعبة تكسير القوالب"],
      },
      {
        key: "13-10",
        ordinal: "العاشر",
        title: "تطوير لعبة تكسير القوالب 2",
        bookFrom: 213,
        concepts: ["تطوير لعبة تكسير القوالب 2"],
      },
      {
        key: "13-11",
        ordinal: "الحادي عشر",
        title: "ملخص لعبة تكسير القوالب",
        bookFrom: 215,
        concepts: ["ملخص لعبة تكسير القوالب"],
      },
      {
        key: "13-12",
        ordinal: "الثاني عشر",
        title: "عرض تقديمي للعبة تكسير القوالب المطورة",
        bookFrom: 217,
        concepts: ["عرض تقديمي للعبة تكسير القوالب المطورة"],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the unit's divider (its first lesson) or
 * the lesson's own title page, down to the page before the next lesson starts,
 * bounded by the unit — so the ranges tile each unit and the units tile the
 * term with no gaps or overlaps.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ICT_G10_AR_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ICT_G10_AR_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

// ---------------------------------------------------------------------------
// OCR text loading
// ---------------------------------------------------------------------------

const OCR_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "curriculum-ocr",
  "ict-ar-g10-t1",
);

/**
 * Placeholder sentences a vision OCR provider may emit for a truly blank page
 * instead of an empty string. They mean "no text", not content, so
 * verification treats them as missing while `loadBookPage` still returns them
 * verbatim. (No term page of this book currently matches one; the guard stays
 * so a future re-OCR cannot silently pass a blank.)
 */
const NO_TEXT_MARKERS = [
  "لا يوجد نص مكتوب في الصورة المرفقة",
  "لا يوجد نص في الصورة المرفقة",
  "لا توجد نصوص في الصورة المرفقة",
];

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

/** True when a content page carries real text (not the blank-page placeholder). */
function pageHasText(book: number): boolean {
  const text = loadBookPage(book);
  return text.length > 0 && !NO_TEXT_MARKERS.some((m) => text.includes(m));
}

/** Loads + joins the OCR text of a book-page range into one lesson document. */
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

/** Convenience: the full document payload for one lesson. */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const range = lessonBookRange(unitIndex, lessonIndex);
  return loadBookRange(range.from, range.to);
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/**
 * Folds text for comparison: drops tatweel and diacritics, unifies the
 * alef/ya/ta forms the book prints inconsistently, lowercases Latin, and
 * removes every non-letter/digit, so OCR spacing and vowel marks cannot break
 * a match. Normalization only deletes characters, so a verbatim substring
 * stays a substring after folding.
 */
function normalize(text: string): string {
  return text
    .replace(/\u0640/g, "")
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring OCR spacing and vowel marks. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * The folio a content page prints beside its running foot «الفهرس», or null
 * when the page prints none. The foot is a standalone Latin number line with
 * «الفهرس» on the page (e.g. page 8 ends «8 / الفهرس»); both halves are
 * required, which is what fixes the mapping page by page. The sixteen pages
 * of `FOLIO_LESS_ANCHORS` print no folio in the OCR and are handled there
 * instead.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text || !text.includes("الفهرس")) return null;
  for (const line of text.split(/\r?\n/)) {
    if (/^\d{1,3}$/.test(line.trim()) && Number(line.trim()) === book) return book;
  }
  return null;
}

/**
 * The folio a page index is expected to print: the index itself — the book
 * numbers every content page with its own scan index (offset 0, no shift).
 */
export function expectedPrintedFolio(book: number): number {
  return book;
}

/**
 * The only term pages that print no folio in the OCR, each with the anchor the
 * check accepts in place of a page number: the thirteen unnumbered unit
 * dividers (anchored by the unit ordinal each prints), page 140 (a printed
 * worksheet figure whose OCR is only its two figure lines — anchored by the
 * figure's data line), and pages 163–164 (full-page activity spreads that lost
 * their footer — each anchored by its own simulation/exercise head).
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  7: "الوحدة الأولى",
  16: "الوحدة الثانية",
  29: "الوحدة الثالثة",
  48: "الوحدة الرابعة",
  53: "الوحدة الخامسة",
  61: "الوحدة السادسة",
  96: "الوحدة السابعة",
  107: "الوحدة الثامنة",
  124: "الوحدة التاسعة",
  135: "الوحدة العاشرة",
  153: "الوحدة الحادية عشر",
  167: "الوحدة الثانية عشر",
  190: "الوحدة الثالثة عشر",
  140: "84 6 + 7 + 10 + 8 + 3 + 4 + 12 + 10 + 6 + 3 + 9 + 6",
  163: "محاكاة الحساب التقريبي لقيمة pi",
  164: "محاكاة الحساب التقريبي لنفسه pi",
};

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, the units tile the term without gaps or overlaps, and the
 * first/last units hit the term's own bounds. A content mistake here would
 * quietly ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ICT_G10_AR_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (lesson.bookFrom < unit.bookFrom || lesson.bookFrom > unit.bookTo) {
        problems.push(
          `الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق الوحدة ${unit.bookFrom}–${unit.bookTo}`,
        );
      }
      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق الوحدة ${unit.bookFrom}–${unit.bookTo}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر الوحدة ${unit.bookFrom}، وجدنا ${from}`);
      }
      if (li > 0 && from !== lesson.bookFrom) {
        problems.push(`الدرس ${lesson.key}: يجب أن يبدأ نطاقه من صفحته ${lesson.bookFrom}، وجدنا ${from}`);
      }
    });
    const nextUnit = units[ui + 1];
    if (nextUnit && unit.bookTo >= nextUnit.bookFrom) {
      problems.push(`الوحدة ${unit.ordinal} تتداخل مع ${nextUnit.ordinal}`);
    } else if (nextUnit && unit.bookTo !== nextUnit.bookFrom - 1) {
      problems.push(`فجوة صفحات بين ${unit.ordinal} و${nextUnit.ordinal}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`);
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_ICT_G10_AR_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_ICT_G10_AR_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ICT_G10_AR_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_ICT_G10_AR_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from
 *     its printed folio beside the running foot «الفهرس», or, on the sixteen
 *     OCR-missed pages, from the anchor named in `FOLIO_LESS_ANCHORS`;
 *  2. every unit's divider prints the unit title and every lesson's first page
 *     prints that lesson's title;
 *  3. every lesson's title and every concept's head is printed somewhere in
 *     the pages the lesson owns (the title on its own first page);
 *  4. every printed page in the term is owned by exactly one lesson — no page
 *     can fall between two lessons and be unreachable.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const ranges = allLessonRanges();
  let pagesChecked = 0;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ICT_G10_AR_T1_BOOK_START || book > EGYPT_ICT_G10_AR_T1_BOOK_END) continue;
    printedPages.add(book);
    pagesChecked += 1;
    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    if (!pageHasText(book)) {
      problems.push(`صفحة الكتاب ${book}: بلا نص حقيقي (صفحة فارغة أو فشل مسح)`);
      continue;
    }
    const anchor = FOLIO_LESS_ANCHORS[book];
    if (anchor !== undefined) {
      if (!normalize(text).includes(normalize(anchor))) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع ولا تطبع المرساة «${anchor}»`);
      }
    } else {
      const footer = printedFooter(book);
      if (footer === null) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم صفحة مطبوع`);
      } else if (footer !== expectedPrintedFolio(book)) {
        problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق المتوقع ${expectedPrintedFolio(book)}`);
      }
    }
  }

  if (printedPages.size !== EGYPT_ICT_G10_AR_T1_BOOK_END - EGYPT_ICT_G10_AR_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ICT_G10_AR_T1_BOOK_START} و${EGYPT_ICT_G10_AR_T1_BOOK_END}`,
    );
  }

  // 2 + 3. each unit divider prints its title; each lesson's title page prints
  // its title, each title lives in its range, and each concept head too.
  EGYPT_ICT_G10_AR_T1_UNITS.forEach((unit, ui) => {
    if (!pagePrints(unit.bookFrom, unit.title)) {
      problems.push(`الوحدة ${unit.title}: صفحة صدرها ${unit.bookFrom} لا تطبع عنوانها`);
    }
    unit.lessons.forEach((lesson, li) => {
      if (!pagePrints(lesson.bookFrom, lesson.title)) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع عنوانه «${lesson.title}»`);
      }
      const { from, to } = lessonBookRange(ui, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      if (!titlePrinted) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
      lesson.concepts.forEach((concept) => {
        let conceptPrinted = false;
        for (let p = from; p <= to && !conceptPrinted; p++) conceptPrinted = pagePrints(p, concept);
        if (!conceptPrinted) {
          problems.push(`الدرس ${lesson.key}: لا يطبع رأسه «${concept}» في نطاقه ${from}–${to}`);
        }
      });
    });
  });

  // 4. every printed page is owned by exactly one lesson.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
