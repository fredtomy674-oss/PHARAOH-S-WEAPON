// Official Egypt Primary-6 (Grade 6) Science, English-medium, first term — the
// Ministry of Education and Technical Education edition prepared with Discovery
// Education (Science Techbook programme), 97 scanned pages.
//
// The ids this module reserves: curriculum `eg-g6-science-en`, subject
// `science-en` (name "Science (English)"), lesson prefix `l-g6-sci-en-`, grade
// `grade-6` (name «الصف السادس الابتدائي»).
//
// The curriculum tree of `eg-g6-science-en` is rebuilt from the Ministry
// textbook `Science — Primary 6 — Term 1` (86 content pages OCR'd). This module
// is the single source of truth for its structure: the ten chapters as printed
// in the book's CONTENTS page (scan 6) and, inside them, the twenty-two concepts
// with the printed page ranges they occupy.
//
// Page mapping (verified against the printed footer of every scanned page):
//   pdfPage = bookPage + BOOK_TO_PDF_OFFSET   (book page 6 = PDF page 7)
// Every page of the term (6–91) prints its book number as the last line, which
// is what fixes the offset at 1.
//
// The English edition is the same book as the Arabic twin (`egyptScienceT1.ts`)
// with the same pagination: all 22 concepts open on the same book pages in both
// editions (6, 8, 12, 18, 20, 24, 26, 30, 34, 38, 40, 46, 50, 54, 56, 62, 64,
// 68, 74, 76, 82, 84). Each opener prints its own «N-M» label above its title,
// the running head prints «Chapter N ..... Title», and the «Point!» band carries
// the printed learning topic that becomes the app lesson's `concepts`.
//
// The book's own quirks, recorded here instead of papered over:
//   - Concept 2-1 is really printed in lowercase («how does respiration
//     occur?») and concept 3-3 prints with no question mark; both titles stay
//     verbatim, because the self-check proves them against the page text.
//   - The CONTENTS page prints «Chapter 8 Food Chain in Egypt» while the
//     chapter's own pages print «Food Chains in Egypt»; the contents form is
//     kept for the chapter title.
//   - Scans 93–96 (book pages 92–95) are blank ruled pages and scan 97 is the
//     back cover, so the term ends at book page 91; all of them lie outside the
//     tree.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** One printed concept — the unit of an app lesson. */
export interface ScienceEnG6Concept {
  /** Printed «N-M» label, e.g. "1-1". */
  key: string;
  /** The concept title as printed on its opener page. */
  title: string;
  /** Book page the concept opens on. */
  bookFrom: number;
  /** Printed learning topics (the «Point!» band) — the app lesson's `concepts`. */
  concepts: string[];
}

/** One printed chapter of the term. */
export interface ScienceEnG6Chapter {
  /** English ordinal, for humans reading the table. */
  ordinal: string;
  /** The chapter title as printed in the book's CONTENTS page. */
  title: string;
  bookFrom: number;
  bookTo: number;
  concepts: ScienceEnG6Concept[];
}

/**
 * The ten chapters of the first term, exactly as the book prints them. The
 * concept found by OCR at each opener page («N-M» label + title) fixes
 * `bookFrom`; the arithmetic in `conceptBookRange` derives the end.
 */
export const EGYPT_SCIENCE_EN_G6_T1_UNITS: ScienceEnG6Chapter[] = [
  {
    ordinal: "First",
    title: "Chapter 1: Conditions for Burning",
    bookFrom: 6,
    bookTo: 17,
    concepts: [
      { key: "1-1", title: "How Things Burn and Air", bookFrom: 6, concepts: ["Air Passages and Burning"] },
      { key: "1-2", title: "The Role of Oxygen", bookFrom: 8, concepts: ["Gases That Help Things Burn"] },
      {
        key: "1-3",
        title: "Air After Burning",
        bookFrom: 12,
        concepts: ["Changes in Air Composition After Burning"],
      },
    ],
  },
  {
    ordinal: "Second",
    title: "Chapter 2: Respiration",
    bookFrom: 18,
    bookTo: 23,
    concepts: [
      { key: "2-1", title: "how does respiration occur?", bookFrom: 18, concepts: ["Breathing and How it Works"] },
      { key: "2-2", title: "How Lungs Work", bookFrom: 20, concepts: ["The lungs are the site of gas exchange"] },
    ],
  },
  {
    ordinal: "Third",
    title: "Chapter 3: Digestion",
    bookFrom: 24,
    bookTo: 33,
    concepts: [
      { key: "3-1", title: "Where Food Goes", bookFrom: 24, concepts: ["Digestion and How it Works"] },
      { key: "3-2", title: "The function of saliva", bookFrom: 26, concepts: ["The Function of Saliva"] },
      {
        key: "3-3",
        title: "How does absorption occur",
        bookFrom: 30,
        concepts: ["The Structure of the Small Intestine and Absorption of Nutrients"],
      },
    ],
  },
  {
    ordinal: "Fourth",
    title: "Chapter 4: Blood Circulation and Excretion",
    bookFrom: 34,
    bookTo: 45,
    concepts: [
      {
        key: "4-1",
        title: "Heart and Blood",
        bookFrom: 34,
        concepts: ["Blood Circulation and How the Heart Works"],
      },
      { key: "4-2", title: "How the Kidneys Work", bookFrom: 38, concepts: ["Discharging Waste Products"] },
      { key: "4-3", title: "Various Organs", bookFrom: 40, concepts: ["Arrangement and Teamwork of Organs"] },
    ],
  },
  {
    ordinal: "Fifth",
    title: "Chapter 5: Photosynthesis",
    bookFrom: 46,
    bookTo: 53,
    concepts: [
      { key: "5-1", title: "Sunlight and Starch", bookFrom: 46, concepts: ["Plants and Nutrients"] },
      { key: "5-2", title: "Gas Exchange", bookFrom: 50, concepts: ["The Relationship between Plants and Air"] },
    ],
  },
  {
    ordinal: "Sixth",
    title: "Chapter 6: Transportation of Water in Plants",
    bookFrom: 54,
    bookTo: 61,
    concepts: [
      { key: "6-1", title: "Transpiration", bookFrom: 54, concepts: ["Plants and Water"] },
      {
        key: "6-2",
        title: "The Path of Water",
        bookFrom: 56,
        concepts: ["The Relationship between Plants and Water"],
      },
    ],
  },
  {
    ordinal: "Seventh",
    title: "Chapter 7: Food Chain",
    bookFrom: 62,
    bookTo: 67,
    concepts: [
      { key: "7-1", title: "Food Chain", bookFrom: 62, concepts: ["How the Food Chain Works"] },
      {
        key: "7-2",
        title: "Living Organisms, Air, and Water",
        bookFrom: 64,
        concepts: ["Circulation of Air and Water"],
      },
    ],
  },
  {
    ordinal: "Eighth",
    title: "Chapter 8: Food Chain in Egypt",
    bookFrom: 68,
    bookTo: 73,
    concepts: [
      { key: "8-1", title: "Desert and Nile Food Chains", bookFrom: 68, concepts: ["Ecosystems in Egypt"] },
    ],
  },
  {
    ordinal: "Ninth",
    title: "Chapter 9: Properties of Solutions",
    bookFrom: 74,
    bookTo: 81,
    concepts: [
      {
        key: "9-1",
        title: "Grouping Solutions",
        bookFrom: 74,
        concepts: ["Acidic, Neutral, and Alkaline solutions"],
      },
      {
        key: "9-2",
        title: "What is dissolved in solutions",
        bookFrom: 76,
        concepts: ["The Identity of Dissolved Substances"],
      },
    ],
  },
  {
    ordinal: "Tenth",
    title: "Chapter 10: Reaction between Solutions and Metals",
    bookFrom: 82,
    bookTo: 91,
    concepts: [
      {
        key: "10-1",
        title: "Aqueous Solutions and Metals",
        bookFrom: 82,
        concepts: ["Properties that React with Metals"],
      },
      {
        key: "10-2",
        title: "What is Left After Evaporation",
        bookFrom: 84,
        concepts: ["Changes in Metals"],
      },
    ],
  },
];

/** Book page number N ↔ PDF page index N + 1 (verified: book page 6 = PDF 7). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the term: the Chapter-1 opener. */
export const EGYPT_SCIENCE_EN_G6_T1_BOOK_START = 6;

/**
 * Last printed page of the term. The book's content ends at 91 (Lab Safety);
 * the four blank ruled pages 92–95 and the back cover 96 are not part of the
 * term, so unlike the Arabic twin (whose book ends at 97) the last chapter
 * stops here.
 */
export const EGYPT_SCIENCE_EN_G6_T1_BOOK_END = 91;

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span of one concept: its own start page up to the page before the
 * next concept starts, capped by its own chapter's last page. Deriving the end
 * this way is what keeps a concept's own exercise pages («Try» / «Practice»),
 * its «Let's Expand!» page and its «Enrichment Corner» inside the concept they
 * belong to.
 */
export function conceptBookRange(unitIndex: number, conceptIndex: number): { from: number; to: number } {
  const unit = EGYPT_SCIENCE_EN_G6_T1_UNITS[unitIndex]!;
  const concept = unit.concepts[conceptIndex]!;
  const next = unit.concepts[conceptIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from: concept.bookFrom, to };
}

/** Every concept's derived range, flattened — used by the tests, the stage and the audit. */
export function allConceptRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SCIENCE_EN_G6_T1_UNITS.forEach((unit, ui) => {
    unit.concepts.forEach((concept, ci) => {
      const { from, to } = conceptBookRange(ui, ci);
      out.push({ key: concept.key, title: concept.title, from, to });
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
  "science-en-g6-t1",
);

/** The placeholder an unread page carries in the corpus; treated as "no text". */
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

/** One page of a concept's document, with a stable printed-page marker. */
function pageBlock(book: number, text: string): string {
  return `### صفحة ${book}\n${text}`;
}

/** Loads and joins the OCR text of a book-page range, page by page. */
export function loadBookRange(fromBook: number, toBook: number): string {
  const parts: string[] = [];
  for (let book = fromBook; book <= toBook; book++) {
    const text = loadBookPage(book);
    if (text) parts.push(pageBlock(book, text));
  }
  return parts.join("\n\n");
}

/** Convenience: the full document payload for one concept lesson. */
export function conceptDocument(unitIndex: number, conceptIndex: number): string {
  const range = conceptBookRange(unitIndex, conceptIndex);
  return loadBookRange(range.from, range.to);
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/**
 * Folded, punctuation-free text: lets a printed head or learning topic match
 * across the OCR's inconsistent capitalisation and accent spelling («Le Cœur»
 * vs «le coeur», «Élimination» vs «Elimination»).
 */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0153/gi, "oe")
    .replace(/\u00e6/gi, "ae")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring OCR spacing, punctuation and case. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * The book number a content page prints as its own footer, or null when the
 * last line carries no number. Unlike the Grade-4 book's letter-spaced folios,
 * this edition prints a plain number as the last line of every page of the
 * term, so the proof against the offset stays exact.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  const glued = last.replace(/ /g, "");
  return /^\d{1,3}$/.test(glued) ? Number(glued) : null;
}

/**
 * Table invariants: every concept's key matches its position, every range is
 * inside its chapter, chapters tile the book without gaps or overlaps, and the
 * first chapter starts where the contents page says. A content mistake here
 * would quietly ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_SCIENCE_EN_G6_T1_UNITS;

  units.forEach((unit, ui) => {
    if (!unit.title.trim()) problems.push(`الفصل ${ui + 1}: بلا عنوان`);
    if (unit.concepts.length === 0) problems.push(`الفصل ${unit.title}: بلا مفاهيم`);
    unit.concepts.forEach((concept, ci) => {
      const expectedKey = `${ui + 1}-${ci + 1}`;
      if (concept.key !== expectedKey) {
        problems.push(`الفصل ${ui + 1} المفهوم ${ci + 1}: المفتاح «${concept.key}» بدل «${expectedKey}»`);
      }
      if (!concept.title.trim()) problems.push(`المفهوم ${concept.key}: بلا عنوان`);
      if (concept.concepts.length === 0) problems.push(`المفهوم ${concept.key}: بلا عنوان تعلّم مطبوع`);
      const { from, to } = conceptBookRange(ui, ci);
      if (from > to) problems.push(`المفهوم ${concept.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`المفهوم ${concept.key}: نطاقه ${from}–${to} خارج نطاق الفصل ${unit.bookFrom}–${unit.bookTo}`);
      }
      const next = unit.concepts[ci + 1];
      if (next && to >= next.bookFrom) problems.push(`المفهوم ${concept.key} يتداخل مع ${next.key}`);
    });
    if (unit.concepts[0] && unit.concepts[0].bookFrom !== unit.bookFrom) {
      problems.push(
        `الفصل ${unit.ordinal}: أول مفهوم يبدأ من ${unit.concepts[0].bookFrom} والفصل من ${unit.bookFrom}`,
      );
    }
    const nextUnit = units[ui + 1];
    if (nextUnit && unit.bookTo >= nextUnit.bookFrom) {
      problems.push(`الفصل ${unit.ordinal} يتداخل مع ${nextUnit.ordinal}`);
    } else if (nextUnit && unit.bookTo !== nextUnit.bookFrom - 1) {
      problems.push(
        `فجوة صفحات بين ${unit.ordinal} و${nextUnit.ordinal}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`,
      );
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_SCIENCE_EN_G6_T1_BOOK_START) {
    problems.push(`الفصل الأول يجب أن يبدأ من الصفحة ${EGYPT_SCIENCE_EN_G6_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SCIENCE_EN_G6_T1_BOOK_END) {
    problems.push(`الفصل الأخير يجب أن ينتهي عند الصفحة ${EGYPT_SCIENCE_EN_G6_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd page of the term carries real text and prints its own number
 *     as a footer — the proof that `pdfPage = bookPage + 1` holds end to end;
 *  2. every concept's opener page prints its own printed title, so a range can
 *     never start on the wrong sheet;
 *  3. every concept's title and its printed learning topics are printed inside
 *     the pages the concept owns, so a range can never end early and hide book
 *     content from the tutor;
 *  4. every page in [6, 91] is owned by exactly one concept — nothing between
 *     two concepts is unreachable.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_SCIENCE_EN_G6_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SCIENCE_EN_G6_T1_BOOK_START || book > EGYPT_SCIENCE_EN_G6_T1_BOOK_END) continue;
    pagesChecked += 1;
    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    printedPages.add(book);
    const footer = printedFooter(book);
    if (footer === null) {
      problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع`);
    } else if (footer !== book) {
      problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق صفحته`);
    }
  }

  if (printedPages.size === 0) problems.push("لم يُعثر على أي صفحة OCR — المسار غير صحيح؟");

  // 2 + 3. opener heads and the proof that titles and learning topics are
  // printed inside the pages their concept owns.
  units.forEach((unit, ui) => {
    unit.concepts.forEach((concept, ci) => {
      if (loadBookPage(concept.bookFrom) && !pagePrints(concept.bookFrom, concept.title)) {
        problems.push(`المفهوم ${concept.key}: صفحة افتتاحه ${concept.bookFrom} لا تطبع «${concept.title}»`);
      }
      const { from, to } = conceptBookRange(ui, ci);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, concept.title);
      if (!titlePrinted) {
        problems.push(`المفهوم ${concept.key}: لا يطبع عنوانه «${concept.title}» في نطاقه ${from}–${to}`);
      }
      for (const topic of concept.concepts) {
        const fingerprint = normalize(topic).slice(0, 15);
        if (fingerprint.length < 8) continue;
        let printed = false;
        for (let p = from; p <= to && !printed; p++) printed = normalize(loadBookPage(p)).includes(fingerprint);
        if (!printed) {
          problems.push(`المفهوم ${concept.key}: عنوان تعلمه «${topic}» غير مطبوع في صفحاته ${from}–${to}`);
        }
      }
    });
  });

  // 4. every page of the term is owned by exactly one concept.
  const owner = new Map<number, string>();
  for (const { key, from, to } of allConceptRanges()) {
    for (let p = from; p <= to; p++) {
      const prev = owner.get(p);
      if (prev) problems.push(`الصفحة ${p} يملكها مفهومان: ${prev} و${key}`);
      owner.set(p, key);
    }
  }
  for (let p = EGYPT_SCIENCE_EN_G6_T1_BOOK_START; p <= EGYPT_SCIENCE_EN_G6_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي مفهوم`);
  }

  const expectedPages = EGYPT_SCIENCE_EN_G6_T1_BOOK_END - EGYPT_SCIENCE_EN_G6_T1_BOOK_START + 1;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_SCIENCE_EN_G6_T1_BOOK_START} و${EGYPT_SCIENCE_EN_G6_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
