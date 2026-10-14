// Primary 1 (الصف الأول الابتدائي) Discover («اكتشف»), first term,
// Ministry 2025/2026 edition (cover prints «٢٠٢٦-٢٠٢٥»).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g1-discovery`, subject `discovery` (name "Discovery", nameAr "اكتشف"),
// lesson prefix `l-g1-dis-`.
//
// The curriculum tree for the Egypt `eg-g1-discovery` curriculum is rebuilt from
// the Ministry textbook `اكتشف` (74 scanned pages, Term 1 = the book's own
// «الفصل الدراسي الأول»). This module is the single source of truth for its
// structure: the seven printed فصول of the first term (three under المحور
// الأول «من أكون؟», four under المحور الثاني «العالم من حولي»), their numbered
// printed دروس, and, for every lesson, the book's own printed activity heads,
// verbatim and with the printed page they start on. The self-checks at the
// bottom prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS FIVE — book page = scan page − 5
// Every numbered content page prints its own folio as a bare numeral on its
// last line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted
// here: scan 14 prints «۹» (book 9), scan 23 prints «18» (book 18), scan 31
// prints «٢٦» (book 26), scan 41 prints «٣٦» (book 36), scan 55 prints «٥٠»
// (book 50) and scan 69 prints «٦٤» (book 64). The book's own «المحتويات»
// (scan 5) independently confirms it: it lists «الفصل الأول: اعرفنى ١»
// (scan 6), «شجرة العائلة ١٣» (scan 18), «مجتمعنا ١٧» (scan 22), «بيئتنا ٢١»
// (scan 26), «تجول فى البيئة ٢٥» (scan 30), «زراعة الغذاء … ٣١» (scan 36) and
// «الاحتفالات … ٣٥» (scan 40) — every chapter divider sits exactly where the
// contents says it does.
//
// TERM = THE BOOK'S OWN FIRST TERM (books 1–40)
// Scan pages 1–5 are before the term: the covers (1–2), the print-specs/rights
// page (3), the «مقدمة الكتاب المدرسي» (4) and the year-wide «المحتويات» (5).
// The term runs from the Term-1 divider (book 1 = scan 6) to the last lesson of
// «الاحتفالات في العالم من حولنا» (book 40 = scan 45):
// `EGYPT_DISCOVERY_G1_T1_BOOK_START` / `_END` are exactly those two pages, and
// the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 40 − 1 + 1 = 40. Scan pages 46–74 are after
// the term: the Term-2 divider (scan 46, «الفصل الدراسي الثاني»), the Term-2
// lessons (المحور الثالث والرابع, books 41–68) and the print matter (scan 74).
//
// FOURTEEN TERM PAGES PRINT NO FOLIO — EACH HAS A NAMED ANCHOR
// The seven chapter dividers (books 1, 13, 17, 21, 25, 31, 35) print their
// chapter head but no page number; the «أنا مصري» intro (book 2), the four
// hieroglyph pages (books 4–7), the book-8 lesson page (whose folio OCR read as
// the stray letter «A») and the book-12 lesson page print no parseable folio
// either. Rather than weaken the page-number check, all fourteen are exempt
// from it and anchored on a string the page itself prints, named in
// `FOLIO_LESS_ANCHORS`. Every other term page proves its number from its last
// line, which must be a bare numeral equal to its own book number.
//
// ONE TERM PAGE HAS NO READABLE TEXT AT ALL
// Book 3 (scan 8) is a full-page illustration: the OCR provider answers it with
// «لا يوجد نص مقروء في هذه الصورة.» (normalised to "" by the loader, exactly
// as the Nahw spec treats such pages). It is owned by lesson 1-1 like its
// neighbours, is counted in `pagesChecked` and in the tiling, but is exempt
// from the has-text and folio rules via the single documented entry in
// `TEXTLESS_PAGES`. This is the only such page in the term.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every numbered درس is one activity page (three pages print two titled
// activities: book 16 «مراحل حياة الإنسان» + «دورة حياة نبات», book 18
// «حقوقنا» + «الالتزام بالقواعد», book 30 «وسائل المواصلات في مصر» + «هل تسبب
// التلوث؟» — both heads share the lesson, as in the Nahw spec). Lesson 1-3
// prints no nominal title, so its printed instruction («ارسم خطوطا …») is its
// head. The unnumbered intro pages (books 2–7: «أنا مصري..» and the hieroglyph
// spread) ride with the chapter's first lesson, and their printed heads are
// that lesson's leading concepts. Nothing is invented: every concept title
// below is a string the book itself prints on the page its `bookFrom` names.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// درس numbers mix Arabic-Indic («٣»), Extended («۳», «۹») and Latin («1»,
// «18», «11») digits; scan 17 prints «ه» for «٥» and scan 13's folio came out
// as «A». Scans 27, 31, 38 and 45 lost their «الدرس» number (sequence fixes
// them as ١, ١, ٢, ٥); scan 38's running head misreads «الفصل الثالث» as
// «الدرس الثالث». Scan 9 splits «الهيروغليفية» with a stray space («الهيروغل
// يفية», stored joined) and scan 11 prints it with a Farsi yeh («هیروغليفية»,
// folded by `normalize`).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 5 (verified: book p.40 = scan p.45). */
export const BOOK_TO_PDF_OFFSET = 5;

/** First printed page of the term — the Term-1 divider (scan 6). */
export const EGYPT_DISCOVERY_G1_T1_BOOK_START = 1;

/** Last printed page of the term — «احترام الآثار المصرية» (scan 45). */
export const EGYPT_DISCOVERY_G1_T1_BOOK_END = 40;

/** The scanned pages before the term: covers, specs/rights, مقدمة, محتويات. */
export const EGYPT_DISCOVERY_G1_T1_FRONT_MATTER = { from: 1, to: 5 } as const;

/**
 * The scanned pages after the term: the Term-2 divider (scan 46), the Term-2
 * lessons (books 41–68) and the print matter (scan 74).
 */
export const EGYPT_DISCOVERY_G1_T1_BACK_MATTER = { from: 46, to: 74 } as const;

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface DiscoveryG1T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «نشاط». */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson («درس» = one numbered lesson page of a chapter). */
export interface DiscoveryG1T1Lesson {
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
  concepts: DiscoveryG1T1Concept[];
}

/** One printed chapter of the book — one of the seven فصول of the first term. */
export interface DiscoveryG1T1Section {
  /** This book's sections are its chapters (فصول). */
  kind: "chapter";
  /** Internal key: "1"…"7", in book order. */
  key: string;
  /** Arabic ordinal of the chapter as the book prints it, e.g. "الثاني". */
  ordinal: string;
  /** Full app-facing section title, with the محور for context. */
  title: string;
  /** The chapter head the divider page prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its divider). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next divider). */
  bookTo: number;
  lessons: DiscoveryG1T1Lesson[];
}

const TYPE = "نشاط";

function concept(bookFrom: number, title: string): DiscoveryG1T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The seven chapters of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and checked
 * by `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter starts come from the book's «المحتويات» (scan 5): 1, 13, 17, 21,
 * 25, 31, 35. Lesson numbers restart in every chapter (١–٥, ١–٣ …) exactly as
 * the book prints «الدرس N» on each lesson page.
 */
export const EGYPT_DISCOVERY_G1_T1_UNITS: DiscoveryG1T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "المحور الأول: من أكون؟ - الفصل الأول: اعرفني",
    printedHead: "الفصل الأول: اعرفني",
    bookFrom: 1,
    bookTo: 12,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "صورتي",
        printedHead: "صورتي",
        bookFrom: 8,
        concepts: [
          concept(2, "أنا مصري.."),
          concept(4, "الكتابة الهيروغليفية"),
          concept(6, "كلمات هيروغليفية"),
          concept(7, "المخصص"),
          concept(8, "صورتي"),
          concept(8, "أسرتي في الحديقة"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "العائلة",
        printedHead: "العائلة",
        bookFrom: 9,
        concepts: [concept(9, "العائلة")],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "ارسم خطوطا لتوصيل كل حاسة بعضو الجسم المسئول عنها.",
        printedHead: "ارسم خطوطا لتوصيل كل حاسة بعضو الجسم المسئول عنها.",
        bookFrom: 10,
        concepts: [concept(10, "ارسم خطوطا لتوصيل كل حاسة بعضو الجسم المسئول عنها.")],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "التشابه والاختلاف",
        printedHead: "التشابه والاختلاف",
        bookFrom: 11,
        concepts: [concept(11, "التشابه والاختلاف")],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "صورتي",
        printedHead: "صورتي",
        bookFrom: 12,
        concepts: [concept(12, "صورتي")],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "الثاني",
    title: "المحور الأول: من أكون؟ - الفصل الثاني: شجرة العائلة",
    printedHead: "الفصل الثاني: شجرة العائلة",
    bookFrom: 13,
    bookTo: 16,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "رتب النظام اليومى",
        printedHead: "رتب النظام اليومى",
        bookFrom: 14,
        concepts: [concept(14, "رتب النظام اليومى")],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الكبار والصغار",
        printedHead: "الكبار والصغار",
        bookFrom: 15,
        concepts: [concept(15, "الكبار والصغار")],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "مراحل حياة الإنسان",
        printedHead: "مراحل حياة الإنسان",
        bookFrom: 16,
        concepts: [concept(16, "مراحل حياة الإنسان"), concept(16, "دورة حياة نبات")],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "الثالث",
    title: "المحور الأول: من أكون؟ - الفصل الثالث: مجتمعنا",
    printedHead: "الفصل الثالث: مجتمعنا",
    bookFrom: 17,
    bookTo: 20,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "حقوقنا",
        printedHead: "حقوقنا",
        bookFrom: 18,
        concepts: [concept(18, "حقوقنا"), concept(18, "الالتزام بالقواعد")],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "أصحاب المهن",
        printedHead: "أصحاب المهن",
        bookFrom: 19,
        concepts: [concept(19, "أصحاب المهن")],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "أدوات العمال",
        printedHead: "أدوات العمال",
        bookFrom: 20,
        concepts: [concept(20, "أدوات العمال")],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "الأول",
    title: "المحور الثاني: العالم من حولي - الفصل الأول: بيئتنا",
    printedHead: "الفصل الأول: بيئتنا",
    bookFrom: 21,
    bookTo: 24,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "هل هذا كائن حيّ؟",
        printedHead: "هل هذا كائن حيّ؟",
        bookFrom: 22,
        concepts: [concept(22, "هل هذا كائن حيّ؟")],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الصحراء والدلتا",
        printedHead: "الصحراء والدلتا",
        bookFrom: 23,
        concepts: [concept(23, "الصحراء والدلتا")],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الاهتمام بالبيئة",
        printedHead: "الاهتمام بالبيئة",
        bookFrom: 24,
        concepts: [concept(24, "الاهتمام بالبيئة")],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "الثاني",
    title: "المحور الثاني: العالم من حولي - الفصل الثاني: تجول في البيئة",
    printedHead: "الفصل الثاني: تجول فى البيئة",
    bookFrom: 25,
    bookTo: 30,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: TYPE,
        title: "أجزاء النبات",
        printedHead: "أجزاء النبات",
        bookFrom: 26,
        concepts: [concept(26, "أجزاء النبات")],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "أجزاء الحيوانات",
        printedHead: "أجزاء الحيوانات",
        bookFrom: 27,
        concepts: [concept(27, "أجزاء الحيوانات")],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "كيف تتحرك الحيوانات؟",
        printedHead: "كيف تتحرك الحيوانات؟",
        bookFrom: 28,
        concepts: [concept(28, "كيف تتحرك الحيوانات؟")],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "استكشاف حركة الأشياء",
        printedHead: "استكشاف حركة الأشياء",
        bookFrom: 29,
        concepts: [concept(29, "استكشاف حركة الأشياء")],
      },
      {
        key: "5-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "وسائل المواصلات في مصر",
        printedHead: "وسائل المواصلات في مصر",
        bookFrom: 30,
        concepts: [concept(30, "وسائل المواصلات في مصر"), concept(30, "هل تسبب التلوث؟")],
      },
    ],
  },
  {
    key: "6",
    kind: "chapter",
    ordinal: "الثالث",
    title: "المحور الثاني: العالم من حولي - الفصل الثالث: زراعة الغذاء في العالم من حولنا",
    printedHead: "الفصل الثالث: زراعة الغذاء في العالم من حولنا",
    bookFrom: 31,
    bookTo: 34,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الشمس في السماء",
        printedHead: "الشمس في السماء",
        bookFrom: 32,
        concepts: [concept(32, "الشمس في السماء")],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "فصول السنة",
        printedHead: "فصول السنة",
        bookFrom: 33,
        concepts: [concept(33, "فصول السنة")],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الطعام الصحي",
        printedHead: "الطعام الصحي",
        bookFrom: 34,
        concepts: [concept(34, "الطعام الصحي")],
      },
    ],
  },
  {
    key: "7",
    kind: "chapter",
    ordinal: "الرابع",
    title: "المحور الثاني: العالم من حولي - الفصل الرابع: الاحتفالات في العالم من حولنا",
    printedHead: "الفصل الرابع: الاحتفالات في العالم من حولنا",
    bookFrom: 35,
    bookTo: 40,
    lessons: [
      {
        key: "7-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الأعياد المصرية",
        printedHead: "الأعياد المصرية",
        bookFrom: 36,
        concepts: [concept(36, "الأعياد المصرية")],
      },
      {
        key: "7-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "التقاليد المصرية",
        printedHead: "التقاليد المصرية",
        bookFrom: 37,
        concepts: [concept(37, "التقاليد المصرية")],
      },
      {
        key: "7-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الآثار المصرية",
        printedHead: "الآثار المصرية",
        bookFrom: 38,
        concepts: [concept(38, "الآثار المصرية")],
      },
      {
        key: "7-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "السفر لمشاهدة الآثار المصرية",
        printedHead: "السفر لمشاهدة الآثار المصرية",
        bookFrom: 39,
        concepts: [concept(39, "السفر لمشاهدة الآثار المصرية")],
      },
      {
        key: "7-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "احترام الآثار المصرية",
        printedHead: "احترام الآثار المصرية",
        bookFrom: 40,
        concepts: [concept(40, "احترام الآثار المصرية")],
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
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_DISCOVERY_G1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_DISCOVERY_G1_T1_UNITS.forEach((unit, ui) => {
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
  "discovery-g1-t1",
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
 * forms the book prints inconsistently (including the Farsi yeh this book's OCR
 * mixes in on scan 11), and removes every non-letter/digit, so OCR spacing and
 * vowel marks cannot break a match.
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
 * is a bare numeral standing alone on the last line («٣٦», «۳۸», «18»); the
 * last non-empty line is read and every other line is ignored, so body numbers
 * (prices, dates, counts) can never be mistaken for a folio.
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
 * which is what fixes the offset; the pages named in `FOLIO_LESS_ANCHORS` and
 * `TEXTLESS_PAGES` carry no parseable folio and are handled there instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The term pages that print no parseable folio in the OCR, each with the
 * anchor the check accepts in place of a page number: the seven chapter
 * dividers (books 1, 13, 17, 21, 25, 31, 35, anchored on their chapter head),
 * the «أنا مصري» intro (book 2), the four hieroglyph pages (books 4–7) and the
 * two lesson pages whose folio the OCR lost (book 8, read as the stray letter
 * «A»; book 12, no folio line at all).
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  1: "الفصل الأول: اعرفني",
  2: "أنا مصري",
  4: "الهيروغليفية",
  5: "بحيرة",
  6: "كلمات هيروغليفية",
  7: "المخصص",
  8: "أسرتي في الحديقة",
  12: "الآن حانت الفرصة",
  13: "الفصل الثاني: شجرة العائلة",
  17: "الفصل الثالث: مجتمعنا",
  21: "الفصل الأول: بيئتنا",
  25: "تجول في البيئة",
  31: "زراعة الغذاء",
  35: "الاحتفالات",
};

/**
 * The only term page with no readable text at all: book 3 (scan 8) is a
 * full-page illustration and the OCR provider confirms it («لا يوجد نص مقروء
 * في هذه الصورة.»). It is owned by lesson 1-1 and counted in the tiling, but
 * exempt from the has-text and folio rules.
 */
const TEXTLESS_PAGES: Readonly<Record<number, string>> = {
  3: "لوحة مصورة بلا نص مقروء (أنا مصري)",
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
  const units = EGYPT_DISCOVERY_G1_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_DISCOVERY_G1_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_DISCOVERY_G1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_DISCOVERY_G1_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_DISCOVERY_G1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page is accounted for — a text page proves its book number
 *     from its printed folio, or, on the pages named in `FOLIO_LESS_ANCHORS`,
 *     from the anchor that page prints; the single illustration-only page in
 *     `TEXTLESS_PAGES` is exempt from both but still counted and owned;
 *  2. every chapter divider prints the chapter head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title and every activity's head is printed on the pages
 *     the lesson owns (the activity on its own page);
 *  4. every printed page in [1, 40] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of
 *     the term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_DISCOVERY_G1_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term is accounted for and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_DISCOVERY_G1_T1_BOOK_START || book > EGYPT_DISCOVERY_G1_T1_BOOK_END) continue;
    const text = loadBookPage(book);
    pagesChecked += 1;
    if (!text) {
      if (TEXTLESS_PAGES[book] === undefined) {
        problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      }
      printedPages.add(book);
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

  if (printedPages.size !== EGYPT_DISCOVERY_G1_T1_BOOK_END - EGYPT_DISCOVERY_G1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_DISCOVERY_G1_T1_BOOK_START} و${EGYPT_DISCOVERY_G1_T1_BOOK_END}`,
    );
  }

  // 2 + 3a. every chapter divider prints the chapter head, every lesson's first
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
  for (let p = EGYPT_DISCOVERY_G1_T1_BOOK_START; p <= EGYPT_DISCOVERY_G1_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
