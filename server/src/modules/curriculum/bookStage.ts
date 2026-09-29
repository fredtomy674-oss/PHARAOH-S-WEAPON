// PHASE 48 — «مسرح الكتاب»: the official textbook pages as the stage a lesson
// is taught on.
//
// PHASE 47 made the Ministry book the tutor's *grounding* (its OCR text is the
// RAG corpus). It is not yet the tutor's *stage*: the student reads a wall of
// text while the book he owns sits closed next to him. This module turns a
// lesson into the exact pages it occupies, so the session can show the real page
// and point at it instead of describing it.
//
// The page images are a derived artifact of the source PDF (see
// server/scripts/pdf-resolve.mjs) and are therefore runtime data, not source:
// a deployment without the PDF simply has no stage, and every caller degrades
// to the text-only room rather than failing.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../../config/env.js";
import { BOOK_TO_PDF_OFFSET, EGYPT_T1_BOOK_END, EGYPT_T1_UNITS, conceptBookRange } from "../../db/egyptT1.js";

/** The only curriculum that currently ships rasterized textbook pages. */
export const EGYPT_G6_MATH_CURRICULUM = "eg-g6-math";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * Directory holding `pages-NNN.jpg` (NNN = scan/PDF page, 1-based).
 *
 * The default is resolved relative to this module, not the process CWD, so the
 * stage works the same whether the server is started from the repo root, from
 * `server/`, or from a compiled `dist/` — the same reason the OCR corpus is
 * resolved this way.
 */
export function pagesDir(): string {
  const configured = config.CURRICULUM_PAGES_DIR?.trim();
  if (configured) return path.resolve(configured);
  return path.join(MODULE_DIR, "..", "..", "..", "data", "curriculum-pages");
}

/** Scan/PDF page that holds a printed book page (verified: book 1 = PDF 10). */
export function bookPageToPdfPage(bookPage: number): number {
  return bookPage + BOOK_TO_PDF_OFFSET;
}

function pageFileName(bookPage: number): string {
  return `pages-${String(bookPageToPdfPage(bookPage)).padStart(3, "0")}.jpg`;
}

/** Absolute path of one page image, or null when it was never extracted. */
export function pageImagePath(bookPage: number): string | null {
  if (!Number.isInteger(bookPage) || bookPage < 0 || bookPage > EGYPT_T1_BOOK_END) return null;
  const file = path.join(pagesDir(), pageFileName(bookPage));
  // Defence in depth: the name is generated, but the resolved path must still
  // stay inside the pages directory before anything is read from it.
  const root = path.resolve(pagesDir());
  if (path.resolve(file) !== path.join(root, path.basename(file))) return null;
  return existsSync(file) ? file : null;
}

/** Reads one page image, or null when the pages are not installed. */
export function readPageImage(bookPage: number): Buffer | null {
  const file = pageImagePath(bookPage);
  if (!file) return null;
  try {
    return readFileSync(file);
  } catch {
    return null;
  }
}

export interface StagePage {
  /** Printed page number as the student sees it in the book. */
  bookPage: number;
  /** Scan/PDF page the image came from. */
  pdfPage: number;
  /** True when the image exists on this deployment. */
  present: boolean;
}

export interface LessonStage {
  curriculumId: string;
  /** Lesson code in the curriculum tree, e.g. "l-con-1-1". */
  lessonCode: string;
  /** Concept key as printed in the book's TOC, e.g. "1-1". */
  conceptKey: string;
  fromBookPage: number;
  toBookPage: number;
  pages: StagePage[];
  /**
   * False when no page image was found for this lesson. The room must treat
   * this as "text-only session", never as an error: a deployment without the
   * source PDF is a supported configuration, not a broken one.
   */
  hasImages: boolean;
}

/** Locate a concept by its printed TOC key ("1-2"), if the book has one. */
function findConcept(conceptKey: string): { unitIndex: number; conceptIndex: number } | null {
  for (let unitIndex = 0; unitIndex < EGYPT_T1_UNITS.length; unitIndex += 1) {
    const concepts = EGYPT_T1_UNITS[unitIndex]!.concepts;
    for (let conceptIndex = 0; conceptIndex < concepts.length; conceptIndex += 1) {
      if (concepts[conceptIndex]!.key === conceptKey) return { unitIndex, conceptIndex };
    }
  }
  return null;
}

/**
 * The pages one lesson occupies, or null when the lesson is not a page of the
 * Egypt Grade-6 first-term book (Saudi/English trees, or a future curriculum
 * that ships no rasterized pages).
 */
export function stageForLesson(curriculumId: string, lessonCode: string): LessonStage | null {
  if (curriculumId !== EGYPT_G6_MATH_CURRICULUM) return null;
  const match = /^l-con-(\d+-\d+)$/.exec(lessonCode);
  if (!match) return null;
  const conceptKey = match[1]!;
  const found = findConcept(conceptKey);
  if (!found) return null;

  const { from, to } = conceptBookRange(found.unitIndex, found.conceptIndex);
  const pages: StagePage[] = [];
  for (let bookPage = from; bookPage <= to; bookPage += 1) {
    pages.push({
      bookPage,
      pdfPage: bookPageToPdfPage(bookPage),
      present: pageImagePath(bookPage) !== null,
    });
  }
  return {
    curriculumId,
    lessonCode,
    conceptKey,
    fromBookPage: from,
    toBookPage: to,
    pages,
    hasImages: pages.some((p) => p.present),
  };
}
