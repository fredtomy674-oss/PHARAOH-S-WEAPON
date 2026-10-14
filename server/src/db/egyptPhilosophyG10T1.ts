// PHASE 107 — official Egypt Secondary-1 (Grade 10) Philosophy and Logic
// («الفلسفة والمنطق»), first term, Ministry edition.
//
// The curriculum tree for the Egypt `eg-g10-philosophy` curriculum is rebuilt
// from the Ministry textbook `الفلسفة والمنطق - الصف الأول الثانوي` (111 scanned
// pages). This module is the single source of truth for its structure: the two
// units of the first term, their four printed «فصول» and, for every lesson, the
// book's own printed heads — the chapter's «أهداف الموضوع»/«القضايا المتضمنة
// بالفصل»/«المهارات المتضمنة بالفصل», each numbered topical head («١- …» …
// «٨- …»), the chapter's closing «أسئلة عامة علي الفصل» and (where the book
// prints one) its «أنشطة الفصل …» — verbatim and with the printed page each head
// starts on. The self-checks at the bottom prove that mapping against the OCR
// itself, page by page.
//
// THE OFFSET IS TWO-SEGMENT — the book has one unnumbered inserted leaf
// Book page N ↔ scan page N + 6 for book 1…46 (scan 7…52), and N + 7 for book
// 47…102 (scan 54…109). Both runs are proven from the pages' own folios: scan 9
// prints «الفلسفة والمنطق للصف الأول الثانوى ٣» (book 3), scan 52 prints the
// bare «٤٦» (book 46), then — after one unnumbered leaf — scan 55 prints «٤٨»
// (book 48), scan 86 prints the Western-digit «79» (book 79) and scan 109 prints
// «١٠٢ الفلسفة والمنطق للصف الأول الثانوى» (book 102). The book's own
// «المحتويات» (scan 5) independently agrees: it starts the four chapters at
// printed pages 1, 21, 47 and 81 and «قائمة المراجع» at 103.
//
// WHY TWO SEGMENTS: an unnumbered unit divider breaks the run
// The book prints a full-page divider before each unit («الوحدة الأولى / الفلسفة»
// = scan 6, before book 1, and «الوحدة الثانية / المنطق» = scan 53, bound between
// printed 46 and 47). Neither divider prints a folio and neither is listed in
// «المحتويات», so one physical leaf sits between printed 46 and 47 and shifts the
// folio run by one. Scan 53 is the only page between the two runs; `pdfToBook`
// returns null for it so it can never masquerade as a content page. Both dividers
// are before/outside the tiled term (they are not numbered), so the unit's
// «أهداف الوحدة» are recorded only in this prose: nothing is invented to hide
// them, and the checks prove the unit head survives on each divider page.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scans 1–6 are before the term: the cover (1), the review committee masthead (2),
// the «مقدمة» (3), the first-term divider «الفصل الدراسي الأول» (4), the printed
// «المحتويات» (5) and the unit 1 divider (6). Scans 110–111 are the back matter
// «المراجع و المصادر» (book 103–104). The term runs from the first chapter's
// opener (book 1 = scan 7) to the last chapter's «أنشطة الفصل» (book 102 = scan
// 109): `EGYPT_PHILOSOPHY_G10_T1_BOOK_START` / `_END` are exactly those two pages,
// `pagesChecked` therefore equals 102 − 1 + 1 = 102, and the tiling assertion
// proves nothing in between is left unreachable.
//
// EIGHT TERM PAGES LOST THEIR FOLIO IN THE OCR
// The four chapter openers (book 1, 21, 47, 81) print their aims/issues/skills
// and a closing quotation instead of a folio, and four continuation pages (book
// 2, 10, 30, 78) end on the running foot «الفلسفة والمنطق …» with no number. They
// are the only term pages without a folio. Rather than weaken the page-number
// check, they are exempt from it and each is anchored on the book's own running
// head — the chapter head printed at the top of every page of its chapter, which
// is exactly the lesson's `printedHead`. See `FOLIO_LESS_PAGES` and step 1 of
// `assertTreeMatchesTheBook`.
//
// THE UNIT'S OWNER AND THE CHAPTER'S OPENER RIDE WITH THE LESSON
// Each unit opens with a divider (not numbered, excluded above) and then its
// first chapter's opener page (the chapter title, its «أهداف الموضوع», its
// «القضايا المتضمنة بالفصل», its «المهارات المتضمنة بالفصل» and a quotation).
// The opener is not a lesson of its own — it belongs to the chapter that follows
// it — so the section's first lesson starts at the opener and its printed heads
// are that lesson's leading concepts.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every concept title below is a string the book itself prints on the page its
// `bookFrom` names; nothing is invented. The chapter openers' aims/issues/skills
// are carried verbatim as the leading concepts of each chapter's single lesson,
// followed by the chapter's numbered topical heads, its closing «أسئلة عامة علي
// الفصل» and, for chapters 2–4, its «أنشطة الفصل …» head. Chapter 1 prints no
// closing activities page.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Book page number N ↔ scan page index N + 6 for the first run (book 1…46,
 * scan 7…52). The second run — after the unnumbered unit 2 divider bound between
 * printed 46 and 47 — uses `_SECOND`. Verified: book 3 = scan 9, book 46 = scan 52.
 */
export const BOOK_TO_PDF_OFFSET = 6;

/**
 * Book page number N ↔ scan page index N + 7 for the second run (book 47…102,
 * scan 54…109). Verified: book 48 = scan 55, book 102 = scan 109.
 */
export const BOOK_TO_PDF_OFFSET_SECOND = 7;

/** The unnumbered unit 2 divider (scan 53) bound between printed pages 46 and 47. */
export const EGYPT_PHILOSOPHY_G10_T1_INSERTED_LEAF = 53;

/** First printed page of the term — the chapter 1 opener (scan 7). */
export const EGYPT_PHILOSOPHY_G10_T1_BOOK_START = 1;

/** Last printed page of the term — the chapter 4 «أنشطة الفصل» (scan 109). */
export const EGYPT_PHILOSOPHY_G10_T1_BOOK_END = 102;

/** The scanned pages before the term: cover, masthead, مقدمة, divider, المحتويات, unit 1 divider. */
export const EGYPT_PHILOSOPHY_G10_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The scanned pages after the term: «المراجع و المصادر» (references). */
export const EGYPT_PHILOSOPHY_G10_T1_BACK_MATTER = { from: 110, to: 111 } as const;

/** One printed component of a lesson — becomes one concept in the app tree. */
export interface PhilosophyG10T1Concept {
  /** Printed book page where this component starts. */
  bookFrom: number;
  /** The printed component kind: «أهداف الموضوع», «أهداف الفصل», «القضايا المتضمنة», «المهارات المتضمنة», «مكوّن», «أسئلة» or «أنشطة». */
  kind: string;
  /** The printed head of this component, verbatim. */
  title: string;
}

/** One lesson («فصل») of the textbook — becomes one lesson in the app tree. */
export interface PhilosophyG10T1Lesson {
  /** App-addressable key, e.g. "2-1" (unit 2, lesson 1). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثاني". */
  ordinal: string;
  /** The lesson's opening component type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the chapter (without the «الفصل» prefix). */
  title: string;
  /** The chapter head the lesson's own first page prints (and every page's running head). */
  printedHead: string;
  /** First printed page of the lesson itself (the chapter opener that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: PhilosophyG10T1Concept[];
}

/** One printed section of the book — one of the two units of the first term. */
export interface PhilosophyG10T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"2". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: الفلسفة". */
  title: string;
  /** The unit head the divider page prints, e.g. "الفلسفة". */
  printedHead: string;
  /** First printed page of the section (its first chapter's opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's first chapter). */
  bookTo: number;
  lessons: PhilosophyG10T1Lesson[];
}

/**
 * The two units of the first term with their four chapters and every printed
 * head, transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from the book's «المحتويات» (scan 5); each chapter
 * opener's «أهداف الموضوع»/«القضايا المتضمنة بالفصل»/«المهارات المتضمنة بالفصل»
 * are that lesson's leading concepts, and its numbered topical and closing heads
 * follow, all verbatim.
 */
export const EGYPT_PHILOSOPHY_G10_T1_UNITS: PhilosophyG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: الفلسفة",
    printedHead: "الوحدة الأولى: الفلسفة",
    bookFrom: 1,
    bookTo: 46,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "أهداف الموضوع",
        title: "التفكير الإنساني",
        printedHead: "الفصل الأول : التفكير الإنساني",
        bookFrom: 1,
        concepts: [
          { bookFrom: 1, kind: "أهداف الموضوع", title: "أهداف الموضوع" },
          { bookFrom: 1, kind: "القضايا المتضمنة", title: "القضايا المتضمنة بالفصل" },
          { bookFrom: 1, kind: "المهارات المتضمنة", title: "المهارات المتضمنة بالفصل" },
          { bookFrom: 2, kind: "مكوّن", title: "١- معنى التفكير الإنساني وتطبيقاته" },
          { bookFrom: 3, kind: "مكوّن", title: "أهمية التفكير الإنساني:" },
          { bookFrom: 5, kind: "مكوّن", title: "٢- أساليب التفكير الإنساني" },
          { bookFrom: 8, kind: "مكوّن", title: "٣. الفلسفة و الدين و العلم" },
          { bookFrom: 13, kind: "مكوّن", title: "٤- التفكير الناقد والتفكير الإبداعي" },
          { bookFrom: 16, kind: "أسئلة", title: "أسئلة عامة علي الفصل" },
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: "أهداف الفصل",
        title: "الفلسفة وطبيعة الموقف الفلسفي",
        printedHead: "الفصل الثاني : الفلسفة وطبيعة الموقف الفلسفي",
        bookFrom: 21,
        concepts: [
          { bookFrom: 21, kind: "أهداف الفصل", title: "أهداف الفصل" },
          { bookFrom: 21, kind: "القضايا المتضمنة", title: "القضايا المتضمنة بالفصل" },
          { bookFrom: 21, kind: "المهارات المتضمنة", title: "المهارات المتضمنة بالفصل" },
          { bookFrom: 22, kind: "مكوّن", title: "١- نشأة الفلسفة" },
          { bookFrom: 23, kind: "مكوّن", title: "٢- تعريفات الفلسفة" },
          { bookFrom: 25, kind: "مكوّن", title: "٣. مباحث الفلسفة ومشكلاتها الأساسية" },
          { bookFrom: 28, kind: "مكوّن", title: "٤. أهمية الفلسفة للإنسان والمجتمع" },
          { bookFrom: 32, kind: "مكوّن", title: "٥. الموقف الفلسفي" },
          { bookFrom: 33, kind: "مكوّن", title: "٦. خصائص الموقف الفلسفي" },
          { bookFrom: 34, kind: "مكوّن", title: "٧. تحديات الموقف الفلسفي" },
          { bookFrom: 37, kind: "مكوّن", title: "٨- مهارات التفكير الفلسفي" },
          { bookFrom: 42, kind: "أسئلة", title: "أسئلة عامة علي الفصل" },
          { bookFrom: 46, kind: "أنشطة", title: "أنشطة الفصل الثاني : الفلسفة وطبيعة الموقف الفلسفي" },
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: المنطق",
    printedHead: "المنطق",
    bookFrom: 47,
    bookTo: 102,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: "أهداف الموضوع",
        title: "مبادئ المنطق (الحدود - القضايا)",
        printedHead: "الفصل الأول : مبادئ المنطق (الحدود - القضايا)",
        bookFrom: 47,
        concepts: [
          { bookFrom: 47, kind: "أهداف الموضوع", title: "أهداف الموضوع" },
          { bookFrom: 47, kind: "القضايا المتضمنة", title: "القضايا المتضمنة بالفصل" },
          { bookFrom: 47, kind: "المهارات المتضمنة", title: "المهارات المتضمنة بالفصل" },
          { bookFrom: 48, kind: "مكوّن", title: "١- تعريف المنطق" },
          { bookFrom: 48, kind: "مكوّن", title: "٢- المنطق في حياتنا اليومية" },
          { bookFrom: 48, kind: "مكوّن", title: "٣- أهمية المنطق" },
          { bookFrom: 50, kind: "مكوّن", title: "٤- عوامل الوقوع في أخطاء التفكير" },
          { bookFrom: 52, kind: "مكوّن", title: "٥- المنطق واللغة" },
          { bookFrom: 53, kind: "مكوّن", title: "٦- الحدود المنطقية" },
          { bookFrom: 56, kind: "مكوّن", title: "٧. المفهوم والماصدق" },
          { bookFrom: 59, kind: "مكوّن", title: "الكليات الخمس" },
          { bookFrom: 62, kind: "مكوّن", title: "٨- القضايا المنطقية" },
          { bookFrom: 70, kind: "أسئلة", title: "أسئلة عامة علي الفصل" },
          { bookFrom: 78, kind: "أنشطة", title: "أنشطة الفصل الأول : مبادئ المنطق" },
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "أهداف الموضوع",
        title: "الاستدلال (تعريفه - أنواعه)",
        printedHead: "الفصل الثاني : الاستدلال (تعريفه - أنواعه)",
        bookFrom: 81,
        concepts: [
          { bookFrom: 81, kind: "أهداف الموضوع", title: "أهداف الموضوع" },
          { bookFrom: 81, kind: "القضايا المتضمنة", title: "القضايا المتضمنة بالفصل" },
          { bookFrom: 81, kind: "المهارات المتضمنة", title: "المهارات المتضمنة بالفصل" },
          { bookFrom: 82, kind: "مكوّن", title: "١- تعريف الاستدلال" },
          { bookFrom: 82, kind: "مكوّن", title: "٢- الاستدلال المباشر" },
          { bookFrom: 83, kind: "مكوّن", title: "أنواع التقابل بين القضايا" },
          { bookFrom: 89, kind: "مكوّن", title: "٣- الاستدلال غير المباشر (القياس)" },
          { bookFrom: 93, kind: "مكوّن", title: "الشكل الأول للقياس:" },
          { bookFrom: 95, kind: "أسئلة", title: "أسئلة عامة علي الفصل" },
          { bookFrom: 102, kind: "أنشطة", title: "أنشطة الفصل الثاني : الاستدلال" },
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from its own chapter opener (or the unit's first
 * chapter opener) down to the page before the next lesson starts, bounded by the
 * unit — so each unit's divider/first opener stays inside the unit it belongs to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_PHILOSOPHY_G10_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_PHILOSOPHY_G10_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This book has no
 * appendix and no back matter that any lesson quotes: every term page belongs to
 * a unit. Kept as a function so the seeder and the stage share one shape across
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
  "philosophy-g10-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content; the loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (No term page is blank; only the check's shape needs it.)
 */
const NO_TEXT = /لا يوجد نص/;

/** Book page number N → the scan page index that holds it, across the inserted leaf. */
function bookToPdf(book: number): number {
  return book <= 46 ? book + BOOK_TO_PDF_OFFSET : book + BOOK_TO_PDF_OFFSET_SECOND;
}

/** OCR text of one scanned page, or "" when the page was not OCR'd. */
function readScan(pdf: number): string {
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    const text = readFileSync(file, "utf8").trim();
    return NO_TEXT.test(text) ? "" : text;
  } catch {
    return "";
  }
}

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  return readScan(bookToPdf(book));
}

/** The scan page that the book page `book` maps to. */
export function bookToPdfPage(book: number): number {
  return bookToPdf(book);
}

/**
 * The book page the scan page prints, or null for a page outside the tiled term
 * (front matter, the unnumbered inserted leaf, the back matter).
 */
function pdfToBook(pdf: number): number | null {
  if (pdf === EGYPT_PHILOSOPHY_G10_T1_INSERTED_LEAF) return null;
  if (pdf >= EGYPT_PHILOSOPHY_G10_T1_BOOK_START + BOOK_TO_PDF_OFFSET && pdf <= 46 + BOOK_TO_PDF_OFFSET) {
    return pdf - BOOK_TO_PDF_OFFSET;
  }
  if (pdf >= 47 + BOOK_TO_PDF_OFFSET_SECOND && pdf <= EGYPT_PHILOSOPHY_G10_T1_BOOK_END + BOOK_TO_PDF_OFFSET_SECOND) {
    return pdf - BOOK_TO_PDF_OFFSET_SECOND;
  }
  return null;
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

/** The book's running foot, printed at the bottom of every non-opener page. */
const RUNNING_FOOT = "الفلسفة والمنطق للصف الأول الثانوي";

/** Whether a whole line is just a bare folio numeral. */
function isBareNumber(line: string): boolean {
  return /^[0-9]+$/.test(toLatinDigits(line).trim());
}

/** The numbers a line carries (Western digits after folding the Arabic ones). */
function numbersIn(line: string): number[] {
  return (toLatinDigits(line).match(/[0-9]+/g) ?? []).map(Number);
}

/** Whether a line is the book's running foot («الفلسفة والمنطق للصف الأول الثانوي»). */
function isRunningFoot(line: string): boolean {
  return normalize(line).includes(normalize(RUNNING_FOOT));
}

/**
 * Page-number candidates a content page prints at its foot. This book's foot is
 * one of four layouts, all of which the OCR preserved:
 *   • a bare numeral standing alone on the last line («٤٦»);
 *   • the running foot with the folio beside it on the same line («… الثانوى ٣»
 *     or «١٦   … الثانوى»);
 *   • the running foot alone on the last line, with the folio on its own line
 *     just above it («٤»، then the running foot).
 * A page that lost its folio ends on the running foot with no number and no
 * numeral line above it, or on content; it yields no candidates.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const last = lines.at(-1) ?? "";
  const prev = lines.at(-2) ?? "";

  if (isBareNumber(last)) return numbersIn(last);
  if (isRunningFoot(last)) {
    const nums = numbersIn(last);
    if (nums.length > 0) return nums;
    return isBareNumber(prev) ? numbersIn(prev) : [];
  }
  return [];
}

/**
 * The book number a content page prints at its foot, or null. Every content page
 * that carries a folio prints exactly one number there and it is its own, which is
 * what fixes the two-segment offset; a page whose foot carries no folio returns
 * null and must be anchored another way.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The eight term pages whose printed folio the OCR did not capture. Four are the
 * chapter openers (book 1, 21, 47, 81: their last line is the opening quotation,
 * not a folio) and four are continuation pages (book 2, 10, 30, 78: their last
 * line is the running foot with no number). They are the only term pages without
 * a folio. Rather than weaken the page-number check, they are exempt from it and
 * anchored on the book's own running head — the chapter head printed at the top
 * of every page of that chapter.
 */
const FOLIO_LESS_PAGES: ReadonlySet<number> = new Set([1, 2, 10, 21, 30, 47, 78, 81]);

/** The lesson whose range owns a term page, or undefined. */
function lessonForPage(book: number): PhilosophyG10T1Lesson | undefined {
  for (let ui = 0; ui < EGYPT_PHILOSOPHY_G10_T1_UNITS.length; ui++) {
    const unit = EGYPT_PHILOSOPHY_G10_T1_UNITS[ui]!;
    for (let li = 0; li < unit.lessons.length; li++) {
      const { from, to } = lessonBookRange(ui, li);
      if (book >= from && book <= to) return unit.lessons[li];
    }
  }
  return undefined;
}

/**
 * Table invariants: lesson keys match their position, every range sits inside its
 * section, component pages rise inside their lesson, the sections tile the book
 * with no gaps or overlaps, and the first/last sections hit the book's own bounds.
 * A content mistake here would quietly ground the tutor on the wrong pages, so it
 * fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_PHILOSOPHY_G10_T1_UNITS;
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
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول مكوّن «${lesson.concepts[0]!.kind}»`);
      }

      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((concept, ci) => {
        if (!concept.title.trim()) problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: بلا عنوان`);
        if (concept.bookFrom < unit.bookFrom || concept.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: صفحته ${concept.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && concept.bookFrom < prev.bookFrom) {
          problems.push(`الدرس ${lesson.key}: صفحات المكوّنات تنازلية (${prev.bookFrom} ثم ${concept.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }
      const lastConcept = lesson.concepts.at(-1)!;
      if (lastConcept.bookFrom < from || lastConcept.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: مكوّنه الأخير ${lastConcept.bookFrom} خارج نطاقه ${from}–${to}`);
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
  if (first && first.bookFrom !== EGYPT_PHILOSOPHY_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_PHILOSOPHY_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_PHILOSOPHY_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_PHILOSOPHY_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio, or, on the eight OCR-missed pages, from the book's own
 *     running head (the chapter head printed at the top of the page);
 *  2. each unit's divider page prints the unit head and every lesson's first page
 *     prints that lesson's head;
 *  3. every lesson's title and every concept's head is printed on its own page;
 *  4. every printed page in [1, 102] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1` (the unnumbered unit 2
 *     divider, scan 53, is not a book page and is never counted).
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_PHILOSOPHY_G10_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const pdf = Number(file.slice(6, 9));
    const book = pdfToBook(pdf);
    if (book === null) continue;
    if (book < EGYPT_PHILOSOPHY_G10_T1_BOOK_START || book > EGYPT_PHILOSOPHY_G10_T1_BOOK_END) continue;
    printedPages.add(book);
    pagesChecked += 1;

    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }

    if (FOLIO_LESS_PAGES.has(book)) {
      // The folio was lost in the OCR: anchor the page on the book's own running
      // head — the chapter head printed at the top of the page.
      const lesson = lessonForPage(book);
      if (!lesson || !pagePrints(book, lesson.printedHead)) {
        problems.push(`صفحة الكتاب ${book}: بلا ترقيم، ولا تطبع رأس الفصل «${lesson?.printedHead ?? "?"}»`);
      }
      continue;
    }

    const footer = printedFooter(book);
    if (footer === null) {
      problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع ولا مرساة`);
    } else if (footer !== book) {
      problems.push(`صفحة الكتاب ${book}: رقمه المطبوع ${footer} لا يطابق رقمه`);
    }
  }

  if (printedPages.size !== EGYPT_PHILOSOPHY_G10_T1_BOOK_END - EGYPT_PHILOSOPHY_G10_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_PHILOSOPHY_G10_T1_BOOK_START} و${EGYPT_PHILOSOPHY_G10_T1_BOOK_END}`,
    );
  }

  // 2. each unit's divider page prints the unit head, and every lesson's first
  // page prints that lesson's head.
  units.forEach((unit) => {
    const dividerPdf = bookToPdf(unit.bookFrom) - 1;
    if (!normalize(readScan(dividerPdf)).includes(normalize(unit.printedHead))) {
      problems.push(`القسم ${unit.title}: صفحة فاصله ${dividerPdf} لا تطبع «${unit.printedHead}»`);
    }

    unit.lessons.forEach((lesson) => {
      if (!pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع «${lesson.printedHead}»`);
      }
    });
  });

  // 3a. every lesson's title is printed somewhere in the pages it owns.
  units.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
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
      lesson.concepts.forEach((concept) => {
        if (!pagePrints(concept.bookFrom, concept.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة المكوّن ${concept.bookFrom} لا تطبع «${concept.title}»`);
        }
      });
    });
  });

  // 4. every printed content page is owned by exactly one lesson.
  const owners = new Map<number, string[]>();
  for (const range of allLessonRanges()) {
    for (let p = range.from; p <= range.to; p++) {
      const list = owners.get(p) ?? [];
      list.push(range.key);
      owners.set(p, list);
    }
  }
  for (let book = EGYPT_PHILOSOPHY_G10_T1_BOOK_START; book <= EGYPT_PHILOSOPHY_G10_T1_BOOK_END; book++) {
    const list = owners.get(book) ?? [];
    if (list.length !== 1) {
      problems.push(
        `صفحة الكتاب ${book}: ${list.length === 0 ? "لا يملكها أي درس" : `يملكها أكثر من درس (${list.join("، ")})`}`,
      );
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
