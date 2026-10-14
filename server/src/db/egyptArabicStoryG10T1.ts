// PHASE 106 — official Egypt Secondary-1 (Grade 10) Arabic story / literature,
// first term: «أبو الفوارس عنترة بن شداد» (للصف الأول الثانوي).
//
// The curriculum tree for the Egypt `eg-g10-arabic-story` curriculum is rebuilt
// from the Ministry reading book `أبو الفوارس عنترة بن شداد` (2026/2027 MoE
// edition, 124 scanned pages). This module is the single source of truth for its
// structure: the novel's sixteen printed chapters («فصول»), the narrative each
// one prints, and — for the first fourteen — the printed «أسئلة الفصل» that
// follows it, each with the printed page it starts on. The self-checks at the
// bottom prove that mapping against the OCR itself, page by page.
//
// THE BOOK IS ONE HISTORICAL NOVEL, NOT AN ANTHOLOGY
// Unlike the language books of this grade (whose فهارس print units → lessons →
// components), this book prints a single continuous novel by محمد فريد أبو حديد,
// divided into sixteen chapters. The book names its own parts «فصل» (in the
// heading of every questions section, «أسئلة الفصل الأول» … «أسئلة الفصل الرابع
// عشر»), so the app mirrors exactly that: Section = فصل, Lesson = the chapter's
// printed parts (the narrative and its questions), Concept = the printed head of
// each part. No printed layer is dropped and none is invented.
//
// THE OFFSET IS ZERO — book page = scan page
// Every content page that carries a folio prints its own number as a bare
// Arabic-Indic numeral on a line of its own at the foot (scan page 9 prints «٩»,
// scan page 12 «١٢», scan page 118 «١١٨»); the book's running foot is the
// separate constant line «أبو الفوارس - ١ ثانوي» (the «١» is the grade, not the
// page). 102 of the 113 term pages print a folio and every one of them prints
// its own number, which fixes `BOOK_TO_PDF_OFFSET = 0`. The other eleven lost
// their folio in the OCR; see `FOLIO_LESS_PAGES` below.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–5 are the cover (1), the «تحرير وإخراج» masthead (2), the
// «تقديم يجب أن يقرأ» preface (3–4) and the «بين يدي القصة» character
// introduction (5). Scan pages 119–123 are near-blank leaves that print only a
// folio and the running foot (≈33–59 bytes each) and page 124 is entirely empty;
// the novel itself ends mid-sentence on page 118 (see the caveat below), so no
// «تعقيب» follows in this scan. The term runs from the first chapter's opener
// (page 6) to page 118:
// `EGYPT_ARABIC_STORY_G10_T1_BOOK_START` / `_END` are exactly those two pages,
// and the tiling assertion proves nothing in between is left unreachable.
//
// ELEVEN TERM PAGES LOST THEIR FOLIO IN THE OCR
// Pages 6, 7, 8, 11, 21, 33, 69, 71, 83, 99 and 100 print no standalone folio in
// the OCR (their last line is the running foot or the print-shop imprint, neither
// of which carries the page number). They are the only term pages whose folio the
// OCR did not capture. Rather than weaken the page-number check, they are exempt
// from it and each is anchored on the book's running foot «أبو الفوارس», which
// every content page prints — the only book-specific marker that survives on
// those pages. See `FOLIO_LESS_PAGES` and step 1 of `assertTreeMatchesTheBook`.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// This book prints no per-chapter objectives. What it does print at the head of
// each part is the chapter title («مغنى القافلة», «البطل الثائر», …) and, where it
// has questions, «أسئلة الفصل N». Each lesson below carries exactly those heads,
// verbatim, as its concepts; nothing is invented.
//
// THE SCAN'S ENDING IS INCOMPLETE
// The narrative stops in the middle of a sentence on page 118 (ch. 16 «خاتمة
// سعيدة») and the pages after it are blank leaves, so the novel's closing scenes
// and its «تعقيب» are absent from this scan. The tree mirrors the book as it is:
// chapter 16 is a real, printed chapter and owns its printed pages.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + OFFSET (verified: book p.9 = scan 9). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the book's content — chapter 1's opener. */
export const EGYPT_ARABIC_STORY_G10_T1_BOOK_START = 6;

/** Last printed content page of the term — the last page of chapter 16. */
export const EGYPT_ARABIC_STORY_G10_T1_BOOK_END = 118;

/** The scan pages before the term: cover, masthead, preface, «بين يدي القصة». */
export const EGYPT_ARABIC_STORY_G10_T1_FRONT_MATTER = { from: 1, to: 5 } as const;

/**
 * The scan pages after the term: five near-blank leaves that print only a folio
 * and the running foot (119–123) and one fully empty page (124).
 */
export const EGYPT_ARABIC_STORY_G10_T1_BACK_MATTER = { from: 119, to: 124 } as const;

/** One component of a chapter lesson — becomes one concept in the app tree. */
export interface ArabicStoryG10T1Concept {
  /** Printed book page where this component starts. */
  bookFrom: number;
  /** The printed component label: «النص» (narrative) or «الأسئلة» (questions). */
  kind: string;
  /** The printed head of this part, verbatim. */
  title: string;
}

/** One lesson of the book — a chapter's narrative or its printed questions. */
export interface ArabicStoryG10T1Lesson {
  /** App-addressable key, e.g. "3-1" (chapter 3, its narrative) or "3-2" (its questions). */
  key: string;
  /** Arabic ordinal of the chapter, e.g. "الثالث". */
  ordinal: string;
  /** The lesson's opening component type, "النص" or "الأسئلة". */
  type: string;
  /** Lesson title as printed at the head of the lesson. */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: ArabicStoryG10T1Concept[];
}

/** One printed section of the book — one of the sixteen chapters. */
export interface ArabicStoryG10T1Section {
  /** This book's sections are its chapters. */
  kind: "unit";
  /** Internal key: "1"…"16". */
  key: string;
  /** Arabic ordinal of the chapter, e.g. "الأول"…"السادس عشر". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الفصل الأول: مغنى القافلة". */
  title: string;
  /** The chapter title the opener page prints, e.g. "مغنى القافلة". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next chapter). */
  bookTo: number;
  lessons: ArabicStoryG10T1Lesson[];
}

/**
 * The novel's sixteen chapters, their narratives and (for the first fourteen)
 * their printed «أسئلة الفصل», all transcribed from the pages the book prints
 * them on and checked by `assertTreeMatchesTheBook` before seeding.
 *
 * A chapter with questions is two lessons — the narrative («النص») from the
 * chapter's opener down to the page before the questions, then the questions
 * («الأسئلة») to the chapter's end. Chapters 15 and 16 print no questions, so
 * each is a single narrative lesson. The chapter titles, the ordinals and the
 * questions heads are transcribed verbatim from the pages that print them.
 */
export const EGYPT_ARABIC_STORY_G10_T1_UNITS: ArabicStoryG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأول",
    title: "الفصل الأول: مغنى القافلة",
    printedHead: "مغنى القافلة",
    bookFrom: 6,
    bookTo: 11,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "النص",
        title: "مغنى القافلة",
        printedHead: "مغنى القافلة",
        bookFrom: 6,
        concepts: [{ bookFrom: 6, kind: "النص", title: "مغنى القافلة" }],
      },
      {
        key: "1-2",
        ordinal: "الأول",
        type: "الأسئلة",
        title: "أسئلة الفصل الأول",
        printedHead: "أسئلة الفصل الأول",
        bookFrom: 11,
        concepts: [{ bookFrom: 11, kind: "الأسئلة", title: "أسئلة الفصل الأول" }],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثاني",
    title: "الفصل الثاني: البطل الثائر",
    printedHead: "البطل الثائر",
    bookFrom: 12,
    bookTo: 18,
    lessons: [
      {
        key: "2-1",
        ordinal: "الثاني",
        type: "النص",
        title: "البطل الثائر",
        printedHead: "البطل الثائر",
        bookFrom: 12,
        concepts: [{ bookFrom: 12, kind: "النص", title: "البطل الثائر" }],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "الأسئلة",
        title: "أسئلة الفصل الثانى",
        printedHead: "أسئلة الفصل الثانى",
        bookFrom: 18,
        concepts: [{ bookFrom: 18, kind: "الأسئلة", title: "أسئلة الفصل الثانى" }],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالث",
    title: "الفصل الثالث: الطريق إلى الحقيقة",
    printedHead: "الطريق إلى الحقيقة",
    bookFrom: 19,
    bookTo: 23,
    lessons: [
      {
        key: "3-1",
        ordinal: "الثالث",
        type: "النص",
        title: "الطريق إلى الحقيقة",
        printedHead: "الطريق إلى الحقيقة",
        bookFrom: 19,
        concepts: [{ bookFrom: 19, kind: "النص", title: "الطريق إلى الحقيقة" }],
      },
      {
        key: "3-2",
        ordinal: "الثالث",
        type: "الأسئلة",
        title: "أسئلة الفصل الثالث",
        printedHead: "أسئلة الفصل الثالث",
        bookFrom: 23,
        concepts: [{ bookFrom: 23, kind: "الأسئلة", title: "أسئلة الفصل الثالث" }],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "الرابع",
    title: "الفصل الرابع: حوار ساخن",
    printedHead: "حوار ساخن",
    bookFrom: 24,
    bookTo: 36,
    lessons: [
      {
        key: "4-1",
        ordinal: "الرابع",
        type: "النص",
        title: "حوار ساخن",
        printedHead: "حوار ساخن",
        bookFrom: 24,
        concepts: [{ bookFrom: 24, kind: "النص", title: "حوار ساخن" }],
      },
      {
        key: "4-2",
        ordinal: "الرابع",
        type: "الأسئلة",
        title: "أسئلة الفصل الرابع",
        printedHead: "أسئلة الفصل الرابع",
        bookFrom: 35,
        concepts: [{ bookFrom: 35, kind: "الأسئلة", title: "أسئلة الفصل الرابع" }],
      },
    ],
  },
  {
    key: "5",
    kind: "unit",
    ordinal: "الخامس",
    title: "الفصل الخامس: خطبة عبلة",
    printedHead: "خطبة عبلة",
    bookFrom: 37,
    bookTo: 44,
    lessons: [
      {
        key: "5-1",
        ordinal: "الخامس",
        type: "النص",
        title: "خطبة عبلة",
        printedHead: "خطبة عبلة",
        bookFrom: 37,
        concepts: [{ bookFrom: 37, kind: "النص", title: "خطبة عبلة" }],
      },
      {
        key: "5-2",
        ordinal: "الخامس",
        type: "الأسئلة",
        title: "أسئلة الفصل الخامس",
        printedHead: "أسئلة الفصل الخامس",
        bookFrom: 44,
        concepts: [{ bookFrom: 44, kind: "الأسئلة", title: "أسئلة الفصل الخامس" }],
      },
    ],
  },
  {
    key: "6",
    kind: "unit",
    ordinal: "السادس",
    title: "الفصل السادس: البطل الحر",
    printedHead: "البطل الحر",
    bookFrom: 45,
    bookTo: 53,
    lessons: [
      {
        key: "6-1",
        ordinal: "السادس",
        type: "النص",
        title: "البطل الحر",
        printedHead: "البطل الحر",
        bookFrom: 45,
        concepts: [{ bookFrom: 45, kind: "النص", title: "البطل الحر" }],
      },
      {
        key: "6-2",
        ordinal: "السادس",
        type: "الأسئلة",
        title: "أسئلة الفصل السادس",
        printedHead: "أسئلة الفصل السادس",
        bookFrom: 52,
        concepts: [{ bookFrom: 52, kind: "الأسئلة", title: "أسئلة الفصل السادس" }],
      },
    ],
  },
  {
    key: "7",
    kind: "unit",
    ordinal: "السابع",
    title: "الفصل السابع: انتصار",
    printedHead: "انتصار",
    bookFrom: 54,
    bookTo: 60,
    lessons: [
      {
        key: "7-1",
        ordinal: "السابع",
        type: "النص",
        title: "انتصار",
        printedHead: "انتصار",
        bookFrom: 54,
        concepts: [{ bookFrom: 54, kind: "النص", title: "انتصار" }],
      },
      {
        key: "7-2",
        ordinal: "السابع",
        type: "الأسئلة",
        title: "أسئلة الفصل السابع",
        printedHead: "أسئلة الفصل السابع",
        bookFrom: 60,
        concepts: [{ bookFrom: 60, kind: "الأسئلة", title: "أسئلة الفصل السابع" }],
      },
    ],
  },
  {
    key: "8",
    kind: "unit",
    ordinal: "الثامن",
    title: "الفصل الثامن: علاقة قلقة",
    printedHead: "علاقة قلقة",
    bookFrom: 61,
    bookTo: 69,
    lessons: [
      {
        key: "8-1",
        ordinal: "الثامن",
        type: "النص",
        title: "علاقة قلقة",
        printedHead: "علاقة قلقة",
        bookFrom: 61,
        concepts: [{ bookFrom: 61, kind: "النص", title: "علاقة قلقة" }],
      },
      {
        key: "8-2",
        ordinal: "الثامن",
        type: "الأسئلة",
        title: "أسئلة الفصل الثامن",
        printedHead: "أسئلة الفصل الثامن",
        bookFrom: 68,
        concepts: [{ bookFrom: 68, kind: "الأسئلة", title: "أسئلة الفصل الثامن" }],
      },
    ],
  },
  {
    key: "9",
    kind: "unit",
    ordinal: "التاسع",
    title: "الفصل التاسع: رحيل عبلة",
    printedHead: "رحيل عبلة",
    bookFrom: 70,
    bookTo: 76,
    lessons: [
      {
        key: "9-1",
        ordinal: "التاسع",
        type: "النص",
        title: "رحيل عبلة",
        printedHead: "رحيل عبلة",
        bookFrom: 70,
        concepts: [{ bookFrom: 70, kind: "النص", title: "رحيل عبلة" }],
      },
      {
        key: "9-2",
        ordinal: "التاسع",
        type: "الأسئلة",
        title: "أسئلة الفصل التاسع",
        printedHead: "أسئلة الفصل التاسع",
        bookFrom: 76,
        concepts: [{ bookFrom: 76, kind: "الأسئلة", title: "أسئلة الفصل التاسع" }],
      },
    ],
  },
  {
    key: "10",
    kind: "unit",
    ordinal: "العاشر",
    title: "الفصل العاشر: حياة الغرباء",
    printedHead: "حياة الغرباء",
    bookFrom: 77,
    bookTo: 84,
    lessons: [
      {
        key: "10-1",
        ordinal: "العاشر",
        type: "النص",
        title: "حياة الغرباء",
        printedHead: "حياة الغرباء",
        bookFrom: 77,
        concepts: [{ bookFrom: 77, kind: "النص", title: "حياة الغرباء" }],
      },
      {
        key: "10-2",
        ordinal: "العاشر",
        type: "الأسئلة",
        title: "أسئلة الفصل العاشر",
        printedHead: "أسئلة الفصل العاشر",
        bookFrom: 84,
        concepts: [{ bookFrom: 84, kind: "الأسئلة", title: "أسئلة الفصل العاشر" }],
      },
    ],
  },
  {
    key: "11",
    kind: "unit",
    ordinal: "الحادي عشر",
    title: "الفصل الحادي عشر: الفارس النبيل",
    printedHead: "الفارس النبيل",
    bookFrom: 85,
    bookTo: 90,
    lessons: [
      {
        key: "11-1",
        ordinal: "الحادي عشر",
        type: "النص",
        title: "الفارس النبيل",
        printedHead: "الفارس النبيل",
        bookFrom: 85,
        concepts: [{ bookFrom: 85, kind: "النص", title: "الفارس النبيل" }],
      },
      {
        key: "11-2",
        ordinal: "الحادي عشر",
        type: "الأسئلة",
        title: "أسئلة الفصل الحادي عشر",
        printedHead: "أسئلة الفصل الحادي عشر",
        bookFrom: 89,
        concepts: [{ bookFrom: 89, kind: "الأسئلة", title: "أسئلة الفصل الحادي عشر" }],
      },
    ],
  },
  {
    key: "12",
    kind: "unit",
    ordinal: "الثاني عشر",
    title: "الفصل الثاني عشر: المهر الغالى",
    printedHead: "المهر الغالى",
    bookFrom: 91,
    bookTo: 94,
    lessons: [
      {
        key: "12-1",
        ordinal: "الثاني عشر",
        type: "النص",
        title: "المهر الغالى",
        printedHead: "المهر الغالى",
        bookFrom: 91,
        concepts: [{ bookFrom: 91, kind: "النص", title: "المهر الغالى" }],
      },
      {
        key: "12-2",
        ordinal: "الثاني عشر",
        type: "الأسئلة",
        title: "أسئلة الفصل الثاني عشر",
        printedHead: "أسئلة الفصل الثاني عشر",
        bookFrom: 94,
        concepts: [{ bookFrom: 94, kind: "الأسئلة", title: "أسئلة الفصل الثاني عشر" }],
      },
    ],
  },
  {
    key: "13",
    kind: "unit",
    ordinal: "الثالث عشر",
    title: "الفصل الثالث عشر: رحلة المخاطر",
    printedHead: "رحلة المخاطر",
    bookFrom: 95,
    bookTo: 104,
    lessons: [
      {
        key: "13-1",
        ordinal: "الثالث عشر",
        type: "النص",
        title: "رحلة المخاطر",
        printedHead: "رحلة المخاطر",
        bookFrom: 95,
        concepts: [{ bookFrom: 95, kind: "النص", title: "رحلة المخاطر" }],
      },
      {
        key: "13-2",
        ordinal: "الثالث عشر",
        type: "الأسئلة",
        title: "أسئلة الفصل الثالث عشر",
        printedHead: "أسئلة الفصل الثالث عشر",
        bookFrom: 104,
        concepts: [{ bookFrom: 104, kind: "الأسئلة", title: "أسئلة الفصل الثالث عشر" }],
      },
    ],
  },
  {
    key: "14",
    kind: "unit",
    ordinal: "الرابع عشر",
    title: "الفصل الرابع عشر: إقامة كريمة",
    printedHead: "إقامة كريمة",
    bookFrom: 105,
    bookTo: 107,
    lessons: [
      {
        key: "14-1",
        ordinal: "الرابع عشر",
        type: "النص",
        title: "إقامة كريمة",
        printedHead: "إقامة كريمة",
        bookFrom: 105,
        concepts: [{ bookFrom: 105, kind: "النص", title: "إقامة كريمة" }],
      },
      {
        key: "14-2",
        ordinal: "الرابع عشر",
        type: "الأسئلة",
        title: "أسئلة الفصل الرابع عشر",
        printedHead: "أسئلة الفصل الرابع عشر",
        bookFrom: 107,
        concepts: [{ bookFrom: 107, kind: "الأسئلة", title: "أسئلة الفصل الرابع عشر" }],
      },
    ],
  },
  {
    key: "15",
    kind: "unit",
    ordinal: "الخامس عشر",
    title: "الفصل الخامس عشر: عودة إلى الديار",
    printedHead: "عودة إلى الديار",
    bookFrom: 108,
    bookTo: 116,
    lessons: [
      {
        key: "15-1",
        ordinal: "الخامس عشر",
        type: "النص",
        title: "عودة إلى الديار",
        printedHead: "عودة إلى الديار",
        bookFrom: 108,
        concepts: [{ bookFrom: 108, kind: "النص", title: "عودة إلى الديار" }],
      },
    ],
  },
  {
    key: "16",
    kind: "unit",
    ordinal: "السادس عشر",
    title: "الفصل السادس عشر: خاتمة سعيدة",
    printedHead: "خاتمة سعيدة",
    bookFrom: 117,
    bookTo: 118,
    lessons: [
      {
        key: "16-1",
        ordinal: "السادس عشر",
        type: "النص",
        title: "خاتمة سعيدة",
        printedHead: "خاتمة سعيدة",
        bookFrom: 117,
        concepts: [{ bookFrom: 117, kind: "النص", title: "خاتمة سعيدة" }],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the chapter opener (its first lesson) or its own
 * first component, down to the page before the next lesson starts, bounded by the
 * chapter. The chapter's narrative therefore keeps its opener and the questions
 * lesson keeps everything from its head to the chapter's last page.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ARABIC_STORY_G10_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.concepts[0]!.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.concepts[0]!.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ARABIC_STORY_G10_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This novel has
 * no appendix and no back matter that any lesson quotes: every page of the term
 * belongs to a chapter. Kept as a function so the seeder and the stage share one
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
  "arabic-story-g10-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. No term page is
 * blank (the blank leaves are all after page 118), but the loader normalises them
 * to "" so a future page map cannot mistake a blank for content.
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
const EXT_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Arabic-Indic and Extended Arabic-Indic digits → Latin, so a folio can be read. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EXT_DIGITS.indexOf(d)));
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

/** How many trailing non-empty lines are scanned for a folio (avoids body numbers). */
const FOLIO_TAIL_LINES = 8;

/**
 * Page-number candidates a content page prints at its foot: the folio is a bare
 * numeral standing alone on its own line, so only such a line is a candidate.
 * Only the last `FOLIO_TAIL_LINES` non-empty lines are scanned so numbers inside
 * the narrative or the questions do not masquerade as a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(-FOLIO_TAIL_LINES);
  const candidates = new Set<number>();
  for (const line of lines) {
    if (!/^[٠-٩۰-۹0-9]+$/.test(line)) continue;
    const digits = toLatinDigits(line).replace(/\D/g, "");
    if (!digits) continue;
    const n = Number(digits);
    if (n > 0) candidates.add(n);
  }
  return [...candidates].sort((a, b) => a - b);
}

/**
 * The book number a content page prints at its foot, or null. Every content page
 * that carries a folio prints its own number, so a page that carries it returns
 * itself; a mismatch returns the largest candidate so the caller can see the
 * difference.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * The eleven term pages whose printed folio the OCR did not capture (their last
 * line is the running foot or the print-shop imprint, neither of which carries a
 * page number). They are the only term pages without a folio. Rather than weaken
 * the page-number check, they are exempt from it and anchored on the book's
 * running foot, which every content page prints.
 */
const FOLIO_LESS_PAGES: ReadonlySet<number> = new Set([6, 7, 8, 11, 21, 33, 69, 71, 83, 99, 100]);

/** The running foot every content page of this book prints. */
const RUNNING_FOOT = "أبو الفوارس";

/** The section that owns a term page, or undefined. */
function sectionForPage(book: number): ArabicStoryG10T1Section | undefined {
  return EGYPT_ARABIC_STORY_G10_T1_UNITS.find((s) => book >= s.bookFrom && book <= s.bookTo);
}

/**
 * Table invariants: lesson keys match their position, every range sits inside its
 * section, the sections tile the book with no gaps or overlaps, and the first/last
 * sections hit the book's own bounds. A content mistake here would quietly ground
 * the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ARABIC_STORY_G10_T1_UNITS;
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
        if (prev && concept.bookFrom <= prev.bookFrom) {
          problems.push(
            `الدرس ${lesson.key}: صفحات المكوّنات غير تصاعدية (${prev.bookFrom} ثم ${concept.bookFrom})`,
          );
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
      if (next && to >= next.concepts[0]!.bookFrom) {
        problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      }
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر القسم ${unit.bookFrom}، وجدنا ${from}`);
      }
    });

    const next = units[ui + 1];
    if (next && unit.bookTo >= next.bookFrom) {
      problems.push(`القسم ${unit.title} يتداخل مع ${next.title}`);
    } else if (next && unit.bookTo !== next.bookFrom - 1) {
      problems.push(`فجوة صفحات بين ${unit.title} و${next.title}: ${unit.bookTo + 1}–${next.bookFrom - 1}`);
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_ARABIC_STORY_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ARABIC_STORY_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ARABIC_STORY_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ARABIC_STORY_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio, or, on the eleven OCR-missed pages, from the book's running
 *     foot «أبو الفوارس»;
 *  2. every chapter's opener page prints the chapter title, and every lesson's
 *     first page prints that lesson's head;
 *  3. every lesson's concepts and title are printed on the pages the lesson owns;
 *  4. every printed page in [6, 118] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_ARABIC_STORY_G10_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ARABIC_STORY_G10_T1_BOOK_START || book > EGYPT_ARABIC_STORY_G10_T1_BOOK_END) continue;
    printedPages.add(book);
    pagesChecked += 1;

    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }

    if (FOLIO_LESS_PAGES.has(book)) {
      // The folio was lost in the OCR: anchor the page on the running foot it
      // prints instead of weakening the page-number check for every page.
      if (!normalize(text).includes(normalize(RUNNING_FOOT))) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع ولا تطبع ترويسة الكتاب «${RUNNING_FOOT}»`);
      }
    } else {
      const footer = printedFooter(book);
      if (footer === null) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع`);
      } else if (footer !== book) {
        problems.push(`صفحة الكتاب ${book}: رقمها المطبوع لا يطابقها (وجدنا ${footer})`);
      }
    }

    if (!sectionForPage(book)) problems.push(`صفحة الكتاب ${book}: لا تنتمي إلى أي فصل`);
  }

  if (printedPages.size !== EGYPT_ARABIC_STORY_G10_T1_BOOK_END - EGYPT_ARABIC_STORY_G10_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ARABIC_STORY_G10_T1_BOOK_START} و${EGYPT_ARABIC_STORY_G10_T1_BOOK_END}`,
    );
  }

  // 2 + 3. the printed heads, against the pages that print them.
  units.forEach((unit) => {
    const opener = loadBookPage(unit.bookFrom);
    if (!opener) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} بلا نص OCR`);
    } else if (!pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} لا تطبع عنوانه «${unit.printedHead}»`);
    }

    unit.lessons.forEach((lesson) => {
      const first = loadBookPage(lesson.bookFrom);
      if (!first) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
      } else if (!pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع «${lesson.printedHead}»`);
      }

      lesson.concepts.forEach((concept) => {
        const text = loadBookPage(concept.bookFrom);
        if (!text) {
          problems.push(`الدرس ${lesson.key}: مكوّن «${concept.title}» صفحته ${concept.bookFrom} بلا نص OCR`);
        } else if (!pagePrints(concept.bookFrom, concept.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة المكوّن ${concept.bookFrom} لا تطبع «${concept.title}»`);
        }
      });
    });
  });

  // 3b. every lesson's title is printed somewhere in the pages it owns.
  units.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      let printed = false;
      for (let p = from; p <= to && !printed; p++) {
        printed = pagePrints(p, lesson.title);
      }
      if (!printed) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
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
  for (let book = EGYPT_ARABIC_STORY_G10_T1_BOOK_START; book <= EGYPT_ARABIC_STORY_G10_T1_BOOK_END; book++) {
    const list = owners.get(book) ?? [];
    if (list.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: ${list.length === 0 ? "لا يملكها أي درس" : `يملكها أكثر من درس (${list.join("، ")})`}`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
