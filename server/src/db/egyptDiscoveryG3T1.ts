// Primary 3 (الصف الثالث الابتدائي) Discover («اكتشف»), first term,
// Ministry 2025/2026 edition (cover prints «٢٠٢٥ - ٢٠٢٦»).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g3-discovery`, subject `discovery` (name "Discovery", nameAr "اكتشف"),
// lesson prefix `l-g3-dis-`, grade `grade-3` (name "Grade 3", nameAr
// "الصف الثالث الابتدائي").
//
// The curriculum tree for the Egypt `eg-g3-discovery` curriculum is rebuilt from
// the Ministry textbook `اكتشف` (97 scanned pages, Term 1 = the book's own
// «الفصل الدراسي الأول» as listed in its printed «المحتويات», scan 4). This
// module is the single source of truth for its structure: the six printed فصول
// of the first term (three under المحور الأول «من أكون؟ (حياة صحية)», three
// under المحور الثاني «العالم من حولي (الاهتمام بعالمنا)»), their numbered
// printed دروس, and, for every lesson, the book's own printed activity heads,
// verbatim and with the printed page they start on. The self-checks at the
// bottom prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every numbered content page prints its own folio as a bare numeral on its
// last line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted
// here: scan 13 prints «۹» (book 9), scan 14 prints «۱۰» (book 10), scan 16
// prints «۱۲» (book 12), scan 21 prints «۱۷» (book 17), scan 27 prints «٢٣»
// (book 23) and scan 48 prints «٤٤» (book 44). The book's own «المحتويات»
// (scan 4) independently confirms it: it lists «الفصل الأول: تنمية مهاراتي ١»
// (scan 5), «الفصل الثاني: الحفاظ على صحة الجسم ١١» (scan 15), «الفصل الثالث:
// الجسم السليم والطعام الصحي ١٩» (scan 23), «الفصل الأول: التغيرات البيئية
// ٢٥» (scan 29), «الفصل الثاني: المياه على كوكبنا ٣١» (scan 35) and «الفصل
// الثالث: مساهمتي نحو بيئتي ٣٧» (scan 41) — every chapter divider sits exactly
// where the contents says it does.
//
// TERM = THE BOOK'S OWN FIRST TERM (books 1–44)
// Scan pages 1–4 are before the term: the cover (1), the print-specs/rights
// page (2), the «مقدمة الكتاب المدرسي» (3) and the year-wide «المحتويات» with
// the NAME slip (4). The term runs from the Term-1 divider (book 1 = scan 5)
// to the last lesson of «مساهمتي نحو بيئتي» (book 44 = scan 48):
// `EGYPT_DISCOVERY_G3_T1_BOOK_START` / `_END` are exactly those two pages, and
// the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 44 − 1 + 1 = 44. Scan pages 49–97 are after
// the term: the Term-2 divider (scan 49, «الفصل الدراسي الثاني»), the Term-2
// lessons (المحور الثالث والرابع, books 45–92) and the print matter (scan 97).
//
// SIXTEEN TERM PAGES PRINT NO PARSEABLE FOLIO — EACH HAS A NAMED ANCHOR
// The six chapter dividers (books 1, 11, 19, 25, 31, 37) print their chapter
// head but no page number; the «أنا مصري» intro (book 2), the «مصر أرض
// السلام» illustration page (book 3), the three hieroglyph pages (books 4–6),
// the «عملة مصرية» page (book 7) and the book-8 lesson page (whose folio the
// OCR read as the stray letter «V») print no parseable folio either; and three
// lesson pages print their folio above the last line, so the last-line rule
// cannot read it (book 16, folio «١٦» before the running head; book 26, folio
// «٢٦» before the image captions; book 36, folio «٣٦» before the running
// head). Rather than weaken the page-number check, all sixteen are exempt
// from it and anchored on a string the page itself prints, named in
// `FOLIO_LESS_ANCHORS`. Every other term page proves its number from its last
// line, which must be a bare numeral equal to its own book number.
//
// EVERY TERM PAGE CARRIES REAL TEXT
// Even the illustration-only page (book 3, «مصر أرض السلام والأمان») carries
// its title in the text layer, so no textless-page exemption is needed and
// `MISSING_SCANS` stays empty: all 97 scans were produced, and every one of
// the 44 term scans carries text.
//
// EACH NUMBERED «الدرس» IS ONE LESSON — CONCEPTS ARE ITS PRINTED HEADS
// Lesson numbers restart in every chapter (١–٣, ١–٥, ١–٦ …) exactly as the
// book prints «الدرس N» on each lesson page. Two spreads print the same lesson
// number on both pages and are one lesson each: books 32–33 («رشاد وزينة في
// زيارة للمتحف», both print الدرس ١) and books 38–39 («أمطار غزيرة في
// الإسكندرية» / «الأمطار الغزيرة عام ٢٠١٥», both print الدرس 1). One page lost
// its lesson number (book 13, «صحي أم غير صحي», no number) and rides with the
// lesson it continues — the ياسمين story of lesson 2-1 — exactly as the G1
// Discover spec attaches its unnumbered pages. Pages that print two titled
// heads share one lesson: book 10 («ماذا تفعل إذا ...» + «ميثاق الفصل») and
// book 38 («أمطار غزيرة في الإسكندرية» + «تعرف تأثير الأمطار الغزيرة»). The
// unnumbered intro pages (books 2–7: «أنا مصري..», the السلام illustration,
// the hieroglyph spread and «عملة مصرية») ride with the chapter's first
// lesson, and their printed heads are that lesson's leading concepts. Inline
// exercise matter (table headers, word banks, map labels such as القلب/المعدة
// on book 18, trait lists such as هادئ/شجاع on book 42) is not modelled: only
// standalone activity heads become concepts. Nothing is invented: every concept
// title below is a string the book itself prints on the page its `bookFrom`
// names.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// درس numbers mix Arabic-Indic («١»), Extended («۱», «۹», «۱۰») and Latin
// («1») digits; scan 22 prints «ه» for «٥» and scan 34 prints «0» for «٥»
// (sequence fixes both as the fifth lesson, exactly as the G1 spec's scan 17
// prints «ه» for «٥»). The المحور الثاني running head misprints its محور as
// «المحور الثاني: الحياة الصحية (الاهتمام بعالمنا)» on every Term-1 lesson
// page of chapters 4–6 (the dividers and the contents print «العالم من
// حولي»); the الفصل الثالث running head prints «الطعام السليم» where the
// divider and the contents print «الطعام الصحي». The lesson-1 title of chapter
// 3 prints «مصفف المدرسة» while the story body on the same page prints
// «مقصف»; both are transcribed byte-verbatim.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.44 = scan p.48). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the Term-1 divider (scan 5). */
export const EGYPT_DISCOVERY_G3_T1_BOOK_START = 1;

/** Last printed page of the term — «الإيجابيات والسلبيات» (scan 48). */
export const EGYPT_DISCOVERY_G3_T1_BOOK_END = 44;

/** The scanned pages before the term: cover, specs/rights, مقدمة, محتويات. */
export const EGYPT_DISCOVERY_G3_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/**
 * The scanned pages after the term: the Term-2 divider (scan 49), the Term-2
 * lessons (books 45–92) and the print matter (scan 97).
 */
export const EGYPT_DISCOVERY_G3_T1_BACK_MATTER = { from: 49, to: 97 } as const;

/**
 * The term pages the OCR never produced, as book pages. All 97 scans were
 * produced and every one of the 44 term scans carries text, so this list is
 * empty; kept so the module shares the shape of the other Egyptian specs.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface DiscoveryG3T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «نشاط». */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson («درس» = one numbered lesson of a chapter). */
export interface DiscoveryG3T1Lesson {
  /** App-addressable key, e.g. "5-3" (chapter 5, lesson 3). */
  key: string;
  /** Arabic ordinal of the lesson number, e.g. "الثالث". */
  ordinal: string;
  /** The lesson's opening head type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson. */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: DiscoveryG3T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed chapter of the book — one of the six فصول of the first term. */
export interface DiscoveryG3T1Section {
  /** This book's sections are its chapters (فصول). */
  kind: "chapter";
  /** Internal key: "1"…"6", in book order. */
  key: string;
  /** Arabic ordinal of the chapter as used in the app tree, e.g. "الثاني". */
  ordinal: string;
  /** Full app-facing section title, with the محور for context. */
  title: string;
  /** The chapter head the divider page prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its divider). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next divider). */
  bookTo: number;
  lessons: DiscoveryG3T1Lesson[];
}

const TYPE = "نشاط";

function concept(bookFrom: number, title: string): DiscoveryG3T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The six chapters of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and checked
 * by `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter starts come from the book's «المحتويات» (scan 4): 1, 11, 19, 25,
 * 31, 37. Lesson numbers restart in every chapter exactly as the book prints
 * «الدرس N» on each lesson page (books 32–33 and 38–39 repeat the number 1 on
 * a two-page spread and form one lesson each; book 13 lost its number and
 * continues lesson 2-1).
 */
export const EGYPT_DISCOVERY_G3_T1_UNITS: DiscoveryG3T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "المحور الأول: من أكون؟ (حياة صحية) - الفصل الأول: تنمية مهاراتي",
    printedHead: "تنمية مهاراتي",
    bookFrom: 1,
    bookTo: 10,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "المهارات الحياتية",
        printedHead: "المهارات الحياتية",
        bookFrom: 8,
        concepts: [
          concept(2, "أنا مصري.."),
          concept(3, "مصر أرض السلام والأمان"),
          concept(4, "الكتابة الهيروغليفية"),
          concept(5, "كلمات هيروغليفية"),
          concept(7, "عملة مصرية"),
          concept(8, "المهارات الحياتية"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "استخدام مهارات التفكير الناقد",
        printedHead: "استخدام مهارات التفكير الناقد",
        bookFrom: 9,
        concepts: [concept(9, "استخدام مهارات التفكير الناقد")],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "ماذا تفعل إذا ...",
        printedHead: "ماذا تفعل إذا ...",
        bookFrom: 10,
        concepts: [concept(10, "ماذا تفعل إذا ..."), concept(10, "ميثاق الفصل")],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "الثاني",
    title: "المحور الأول: من أكون؟ (حياة صحية) - الفصل الثاني: الحفاظ على صحة الجسم",
    printedHead: "الحفاظ على صحة الجسم",
    bookFrom: 11,
    bookTo: 18,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "اختيارات ياسمين",
        printedHead: "اختيارات ياسمين",
        bookFrom: 12,
        concepts: [concept(12, "اختيارات ياسمين"), concept(13, "صحي أم غير صحي")],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "عادات صحية",
        printedHead: "عادات صحية",
        bookFrom: 14,
        concepts: [
          concept(14, "عادات صحية"),
          concept(15, "الحصول على قسط كاف من النوم"),
          concept(15, "التحلي بسلوك إيجابي وهادئ"),
          concept(15, "تناول الأطعمة الصحية"),
          concept(15, "التمتع بجسم نشيط"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الجلد والقلب",
        printedHead: "الجلد والقلب",
        bookFrom: 16,
        concepts: [concept(16, "الجلد والقلب")],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "ماذا يحدث للطعام الذي تتناوله ؟",
        printedHead: "ماذا يحدث للطعام الذي تتناوله ؟",
        bookFrom: 17,
        concepts: [concept(17, "ماذا يحدث للطعام الذي تتناوله ؟")],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "قلبي",
        printedHead: "قلبي",
        bookFrom: 18,
        concepts: [concept(18, "قلبي")],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "الثالث",
    title: "المحور الأول: من أكون؟ (حياة صحية) - الفصل الثالث: الجسم السليم والطعام الصحي",
    printedHead: "الجسم السليم والطعام الصحي",
    bookFrom: 19,
    bookTo: 24,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "مصفف المدرسة",
        printedHead: "مصفف المدرسة",
        bookFrom: 20,
        concepts: [concept(20, "مصفف المدرسة")],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "نظامي الغذائي",
        printedHead: "نظامي الغذائي",
        bookFrom: 21,
        concepts: [concept(21, "نظامي الغذائي")],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الفيتامينات والمعادن",
        printedHead: "الفيتامينات والمعادن",
        bookFrom: 22,
        concepts: [concept(22, "الفيتامينات والمعادن")],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "أهمية الماء",
        printedHead: "أهمية الماء",
        bookFrom: 23,
        concepts: [concept(23, "أهمية الماء")],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "سجل المعلومات والآراء",
        printedHead: "سجل المعلومات والآراء",
        bookFrom: 24,
        concepts: [concept(24, "سجل المعلومات والآراء")],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "الأول",
    title: "المحور الثاني: العالم من حولي (الاهتمام بعالمنا) - الفصل الأول: آثار التغيرات البيئية",
    printedHead: "آثار التغيرات البيئية",
    bookFrom: 25,
    bookTo: 30,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "احتياجات الكائنات الحية",
        printedHead: "احتياجات الكائنات الحية",
        bookFrom: 26,
        concepts: [concept(26, "احتياجات الكائنات الحية")],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "ملاءمة البيئات الطبيعية",
        printedHead: "ملاءمة البيئات الطبيعية",
        bookFrom: 27,
        concepts: [concept(27, "ملاءمة البيئات الطبيعية")],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "التغيرات البيئية",
        printedHead: "التغيرات البيئية",
        bookFrom: 28,
        concepts: [concept(28, "التغيرات البيئية")],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "دور النباتات والحيوانات في التغير البيئي",
        printedHead: "دور النباتات والحيوانات في التغير البيئي",
        bookFrom: 29,
        concepts: [concept(29, "دور النباتات والحيوانات في التغير البيئي")],
      },
      {
        key: "4-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "البحث",
        printedHead: "البحث",
        bookFrom: 30,
        concepts: [concept(30, "البحث")],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "الثاني",
    title: "المحور الثاني: العالم من حولي (الاهتمام بعالمنا) - الفصل الثاني: المياه على كوكبنا",
    printedHead: "المياه على كوكبنا",
    bookFrom: 31,
    bookTo: 36,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: TYPE,
        title: "رشاد وزينة في زيارة للمتحف",
        printedHead: "رشاد وزينة في زيارة للمتحف",
        bookFrom: 32,
        concepts: [concept(32, "رشاد وزينة في زيارة للمتحف")],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "دورة الماء في الطبيعة",
        printedHead: "دورة الماء في الطبيعة",
        bookFrom: 34,
        concepts: [concept(34, "دورة الماء في الطبيعة")],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "تنوع المناخ في مصر",
        printedHead: "تنوع المناخ في مصر",
        bookFrom: 35,
        concepts: [concept(35, "تنوع المناخ في مصر")],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "قارة أفريقيا",
        printedHead: "قارة أفريقيا",
        bookFrom: 36,
        concepts: [concept(36, "قارة أفريقيا")],
      },
    ],
  },
  {
    key: "6",
    kind: "chapter",
    ordinal: "الثالث",
    title: "المحور الثاني: العالم من حولي (الاهتمام بعالمنا) - الفصل الثالث: مساهمتي نحو بيئتي",
    printedHead: "مساهمتي نحو بيئتي",
    bookFrom: 37,
    bookTo: 44,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: TYPE,
        title: "أمطار غزيرة في الإسكندرية",
        printedHead: "أمطار غزيرة في الإسكندرية",
        bookFrom: 38,
        concepts: [
          concept(38, "أمطار غزيرة في الإسكندرية"),
          concept(38, "تعرف تأثير الأمطار الغزيرة"),
          concept(39, "الأمطار الغزيرة عام ٢٠١٥"),
        ],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "صفات المواطن الصالح",
        printedHead: "صفات المواطن الصالح",
        bookFrom: 40,
        concepts: [concept(40, "صفات المواطن الصالح")],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الوقاية من الفيضانات",
        printedHead: "الوقاية من الفيضانات",
        bookFrom: 41,
        concepts: [concept(41, "الوقاية من الفيضانات")],
      },
      {
        key: "6-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "كيف أكون قائدًا عظيمًا ؟",
        printedHead: "كيف أكون قائدًا عظيمًا ؟",
        bookFrom: 42,
        concepts: [concept(42, "كيف أكون قائدًا عظيمًا ؟")],
      },
      {
        key: "6-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "مشكلة الموارد المائية في الواحة",
        printedHead: "مشكلة الموارد المائية في الواحة",
        bookFrom: 43,
        concepts: [concept(43, "مشكلة الموارد المائية في الواحة")],
      },
      {
        key: "6-6",
        ordinal: "السادس",
        type: TYPE,
        title: "الإيجابيات والسلبيات",
        printedHead: "الإيجابيات والسلبيات",
        bookFrom: 44,
        concepts: [concept(44, "الإيجابيات والسلبيات")],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the chapter divider (its first lesson) or its
 * own head page, down to the page before the next lesson starts, bounded by
 * the chapter — so the divider and the unnumbered intro pages stay inside the
 * chapter they belong to. When the book prints two heads on one page they
 * share a lesson, so distinct lessons always start on distinct pages and the
 * ranges tile the chapter exactly.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_DISCOVERY_G3_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_DISCOVERY_G3_T1_UNITS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
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
  const out = new Map<string, number[]>();
  for (const section of EGYPT_DISCOVERY_G3_T1_UNITS) {
    for (const lesson of section.lessons) {
      if (lesson.extraBookPages?.length) out.set(lesson.key, [...lesson.extraBookPages]);
    }
  }
  return out;
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
  "discovery-g3-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (No term page of this book needs it — every term scan carries a
 * text layer — but the guard keeps the loader the same shape across books.)
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
 * The document a lesson grounds the tutor in: its own page range in order, plus
 * any appendix pages it points to. This book has no appendix, so the extra loop
 * is a no-op kept for a shared shape.
 */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(sectionIndex, lessonIndex);
  const lesson = EGYPT_DISCOVERY_G3_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(from, to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

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
 * forms the book prints inconsistently, and removes every non-letter/digit, so
 * OCR spacing and vowel marks cannot break a match.
 */
function normalize(text: string): string {
  return toLatinDigits(text)
    .replace(/ـ/g, "")
    .replace(/[ً-ٰٟ]/g, "")
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
 * is a bare numeral standing alone on the last line («٣٦», «۳۸», «44»); the
 * last non-empty line is read and every other line is ignored, so body numbers
 * (prices, dates, counts, table data) can never be mistaken for a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const last =
    text
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
 * which is what fixes the offset; the pages named in `FOLIO_LESS_ANCHORS`
 * carry no parseable folio and are handled there instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * Folios whose OCR printed a different, still parseable number. Every folio in
 * this book came out right, so the map is empty and the folio check stays
 * exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no parseable folio in the OCR, each with the
 * anchor the check accepts in place of a page number: the six chapter dividers
 * (books 1, 11, 19, 25, 31, 37, anchored on their chapter head), the «أنا
 * مصري» intro (book 2), the «مصر أرض السلام» illustration page (book 3), the
 * three hieroglyph pages (books 4–6) and the «عملة مصرية» page (book 7), the
 * book-8 lesson page whose folio the OCR read as the stray letter «V», and
 * the three lesson pages whose folio stands above the last line (book 16
 * before the running head, book 26 before the image captions, book 36 before
 * the running head).
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  1: "تنمية مهاراتي",
  2: "أنا مصري",
  3: "مصر أرض السلام",
  4: "الكتابة الهيروغليفية",
  5: "كلمات هيروغليفية",
  6: "المعنى النطق الكلمة",
  7: "عملة مصرية",
  8: "المهارات الحياتية",
  11: "الحفاظ على صحة الجسم",
  16: "الجلد والقلب",
  19: "الجسم السليم والطعام الصحي",
  25: "آثار التغيرات البيئية",
  26: "احتياجات الكائنات الحية",
  31: "المياه على كوكبنا",
  36: "قارة أفريقيا",
  37: "مساهمتي نحو بيئتي",
};

/** Every head kind the table may use. */
const KNOWN_KINDS = new Set(["نشاط"]);

/**
 * Table invariants: lesson keys are unique and follow (chapter-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_DISCOVERY_G3_T1_UNITS;
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
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_DISCOVERY_G3_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_DISCOVERY_G3_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_DISCOVERY_G3_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_DISCOVERY_G3_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     the folio in its furniture, or, on the sixteen pages named in
 *     `FOLIO_LESS_ANCHORS`, from the anchor the page itself prints. The scans
 *     in `MISSING_SCANS` (none this term) carry no text to prove anything with
 *     and are not iterated (they stay owned by their lesson ranges below);
 *  2. every section opener prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title and every activity's head is printed on the pages
 *     the lesson owns (the activity on its own page);
 *  4. every page in [1, 44] is owned by exactly one lesson — no page falls
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
  const units = EGYPT_DISCOVERY_G3_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_DISCOVERY_G3_T1_BOOK_START || book > EGYPT_DISCOVERY_G3_T1_BOOK_END) continue;
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
  // page its head, and every lesson's title is printed somewhere in the pages
  // it owns.
  units.forEach((unit, ui) => {
    if (loadBookPage(unit.bookFrom) && !pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} لا تطبع «${unit.printedHead}»`);
    }

    unit.lessons.forEach((lesson, li) => {
      if (loadBookPage(lesson.bookFrom) && !pagePrints(lesson.bookFrom, lesson.printedHead)) {
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
  for (let p = EGYPT_DISCOVERY_G3_T1_BOOK_START; p <= EGYPT_DISCOVERY_G3_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_DISCOVERY_G3_T1_BOOK_END - EGYPT_DISCOVERY_G3_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_DISCOVERY_G3_T1_BOOK_START} و${EGYPT_DISCOVERY_G3_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
