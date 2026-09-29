// PHASE 47 — official Egypt Grade-6 Math, first term («كتاب الوزارة»).
//
// The curriculum tree for the Egypt `eg-g6-math` curriculum is rebuilt from the
// Ministry textbook `Math_Primary6_T1.pdf` (Math Techbook™, 2026 edition). This
// module is the single source of truth for its structure: the units/concepts as
// printed in the book's TOC (page 5-6 of the scan), with each concept's lessons
// and the exact page ranges those lessons occupy.
//
// Page mapping (verified against the scan + OCR):
//   pdfPage = bookPage + BOOK_TO_PDF_OFFSET   (book page 1 = PDF page 10)
//   Unit opener pages (الفيديو/المفردات) precede the unit's first concept.
//
// Document content per concept is assembled from the committed OCR text under
// server/data/curriculum-ocr/ — i.e. the tutor's grounding is literally the
// Ministry book, page by page.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.1 = PDF p.10). */
export const BOOK_TO_PDF_OFFSET = 9;

/**
 * Last numbered content page of the book (the final page of concept 1-7's last
 * lesson). Verified from the OCR review of the scan's tail pages — the back
 * cover is PDF 122, so this must stay below book 113.
 */
export const EGYPT_T1_BOOK_END = 111;

/** One concept (المفهوم) of the textbook — becomes one lesson in the app tree. */
export interface T1Concept {
  /** TOC concept label, e.g. "1-2" (المفهوم 1-2). */
  key: string;
  /** Concept title as printed in the TOC (after the colon). */
  title: string;
  /** Book pages where the concept's lessons start (printed TOC numbers). */
  lessonStarts: number[];
}

export interface T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الأولى". */
  ordinal: string;
  /** Full unit title, e.g. "الوحدة الأولى: قابلية القسمة والعوامل والمضاعفات". */
  title: string;
  concepts: T1Concept[];
}

/**
 * The 7 units of the first term, straight from the book's printed TOC
 * (scan pages 5-6, OCR-verified).
 */
export const EGYPT_T1_UNITS: T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: قابلية القسمة والعوامل والمضاعفات",
    concepts: [
      {
        key: "1-1",
        title: "قابلية القسمة والعامل المشترك الأكبر والمضاعف المشترك الأصغر",
        lessonStarts: [1, 3, 5, 8],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: الأعداد النسبية",
    concepts: [
      { key: "1-2", title: "استكشاف خط الأعداد", lessonStarts: [15, 19] },
      { key: "2-2", title: "استكشاف الأعداد النسبية", lessonStarts: [23, 26] },
      { key: "3-2", title: "تفسير القيمة المطلقة واستخدامها", lessonStarts: [28, 31] },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: المقادير الجبرية",
    concepts: [
      { key: "1-3", title: "استخدام التعبيرات الرياضية وتحليلها", lessonStarts: [35, 39, 43] },
      { key: "2-3", title: "المقادير الجبرية والأسس", lessonStarts: [47, 50, 52, 55] },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "الوحدة الرابعة: المعادلات والمتباينات",
    concepts: [
      { key: "1-4", title: "كتابة المعادلات والمتباينات واستراتيجيات حلها", lessonStarts: [59, 61, 64] },
    ],
  },
  {
    ordinal: "الخامسة",
    title: "الوحدة الخامسة: المتغيرات التابعة والمستقلة",
    concepts: [
      { key: "1-5", title: "استكشاف العلاقة بين متغيرين", lessonStarts: [69, 72, 74, 76] },
    ],
  },
  {
    ordinal: "السادسة",
    title: "الوحدة السادسة: توزيع البيانات",
    concepts: [
      { key: "1-6", title: "جمع البيانات وتمثيلها وتطبيقات عليها", lessonStarts: [81, 85, 88, 90, 94] },
    ],
  },
  {
    ordinal: "السابعة",
    title: "الوحدة السابعة: مقاييس النزعة المركزية والانتشار",
    concepts: [
      { key: "1-7", title: "استكشاف مقاييس النزعة المركزية والانتشار", lessonStarts: [99, 102, 105, 109] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Lesson page ranges & OCR text loading
// ---------------------------------------------------------------------------

/**
 * The unit's opener page (الفيديو + المفردات الأساسية) sits on the book page
 * right before the unit's first concept — OCR-verified at PDFs 9, 23, 43, 67,
 * 77, 89 and 107 (i.e. book pages 0, 14, 34, 58, 68, 80, 98). Unit 1's opener
 * is unnumbered, so we model its book page as 0.
 */
function unitOpenerBookPage(unitIndex: number): number {
  return EGYPT_T1_UNITS[unitIndex]!.concepts[0]!.lessonStarts[0]! - 1;
}

/**
 * Book-page span of one concept: from its unit's opener (first concept) or its
 * first lesson, up to just before the next lesson/unit boundary — the next
 * unit's opener page belongs to that unit, not to the previous concept.
 */
export function conceptBookRange(unitIndex: number, conceptIndex: number): { from: number; to: number } {
  const unit = EGYPT_T1_UNITS[unitIndex]!;
  const concept = unit.concepts[conceptIndex]!;
  const from = conceptIndex === 0 ? unitOpenerBookPage(unitIndex) : concept.lessonStarts[0]!;
  let to: number;
  if (conceptIndex + 1 < unit.concepts.length) {
    to = unit.concepts[conceptIndex + 1]!.lessonStarts[0]! - 1;
  } else if (unitIndex + 1 < EGYPT_T1_UNITS.length) {
    to = unitOpenerBookPage(unitIndex + 1) - 1;
  } else {
    to = EGYPT_T1_BOOK_END;
  }
  return { from, to };
}

const OCR_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "curriculum-ocr");

/** Loads + joins the OCR text of a book-page range into one lesson document. */
export function loadBookRange(fromBook: number, toBook: number): string {
  const parts: string[] = [];
  for (let book = fromBook; book <= toBook; book++) {
    const pdf = book + BOOK_TO_PDF_OFFSET;
    const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
    let text = "";
    try {
      text = readFileSync(file, "utf8").trim();
    } catch {
      // Missing page (should not happen after a full batch) — skip defensively.
      continue;
    }
    if (!text) continue;
    parts.push(`[صفحة الكتاب ${book}]`);
    parts.push(text);
  }
  return parts.join("\n\n");
}

/** Convenience: the full document payload for one concept lesson. */
export function conceptDocument(unitIndex: number, conceptIndex: number): string {
  const range = conceptBookRange(unitIndex, conceptIndex);
  return loadBookRange(range.from, range.to);
}