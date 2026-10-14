// PHASE 59 — official Egypt Grade-6 Science, first term («كتاب الوزارة»).
//
// The curriculum tree for the Egypt `eg-g6-science` curriculum is rebuilt from
// the Ministry textbook `Science_Primary6_T1.pdf` (2026/2027 MoE edition,
// 98 scanned pages, 92 content pages OCR'd). This module is the single source of
// truth for its structure: the 10 chapters as printed in the book's contents
// page, and inside them the concepts with the printed page ranges they occupy.
//
// Page mapping (verified against the scan's printed footers):
//   pdfPage = bookPage + BOOK_TO_PDF_OFFSET   (book page 6 = PDF page 7)
// Every chapter start printed in the contents page was confirmed to land on the
// printed footer of the scanned page, which is what fixes the offset at 1.
//
// WHY CHAPTERS COME FROM THE CONTENTS PAGE, NOT FROM THE CONCEPT LABELS
// The concept labels printed in the book cannot be used to build the tree: the
// first concept of chapter 6 prints as «1-7», and chapter 10 restarts at «١-١».
// A label-driven tree would invent chapter-6 concepts 3..7 and merge chapter
// 10's first concept into chapter 1's. The contents page is printed
// consistently, so chapters come from there; concept identity is the concept
// *title* printed in its running head.
//
// WHY A CONCEPT'S END PAGE IS DERIVED, NOT TYPED
// A concept's running head is repeated on every one of its pages, but its
// exercises («حاول», «تدرَّب», «هيا نتوسّع») put the head on the *second* line,
// under the chapter marker. A tree that ends a concept where its title changes
// therefore drops those exercise pages, and a student asking about «سؤال ٣ في
// صفحة ١٠» gets nothing. So only a concept's *start* is data here; its end is
// derived as "the page before the next concept starts", bounded by its chapter.
// `assertTreeMatchesTheBook` below proves that rule against the OCR corpus: every
// page that prints a concept head must fall inside that concept's derived range.
//
// A chapter's own back matter (مراجعة الفصل, أنشطة الفصل, glossary) carries no
// concept head, so it rides with the chapter's last concept — the same choice
// the maths book already makes for a unit's trailing pages.
//
// Document content per concept is assembled from the committed OCR text under
// server/data/curriculum-ocr/science-t1/ — i.e. the tutor's grounding is
// literally the Ministry book, page by page.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.6 = PDF p.7). */
export const BOOK_TO_PDF_OFFSET = 1;

/**
 * Last numbered page of the book (the back cover). The book's last chapter ends
 * before it, so this is the upper bound used when deriving a final range.
 */
export const EGYPT_SCIENCE_T1_BOOK_END = 97;

/** First printed content page — where chapter 1 starts in the contents page. */
export const EGYPT_SCIENCE_T1_BOOK_START = 6;

/** One concept (المفهوم) of the textbook — becomes one lesson in the app tree. */
export interface ScienceT1Concept {
  /** Concept key as the app addresses it, e.g. "6-1" (chapter 6, concept 1). */
  key: string;
  /** Concept title as printed in its running head. */
  title: string;
  /**
   * First printed book page of the concept — the only page this module treats
   * as data; its end page is derived (see the note above).
   */
  bookFrom: number;
  /**
   * The concept's printed «تعلّم …» learning topic(s), verbatim — the science
   * book prints no objectives list, so this is the concept's own printed «what
   * you will learn» heading (one per concept).
   */
  concepts: string[];
}

export interface ScienceT1Unit {
  /** Arabic ordinal used in the chapter title, e.g. "الأولى". */
  ordinal: string;
  /** Full chapter title as printed, e.g. "الفصل الأول: شروط الاحتراق". */
  title: string;
  /**
   * First printed book page of the chapter, from the book's contents page. Also
   * the start page of the chapter's first concept, so the two must agree.
   */
  bookFrom: number;
  /** Last printed book page of the chapter (the page before the next chapter). */
  bookTo: number;
  concepts: ScienceT1Concept[];
}

/**
 * The 10 chapters of the first term with their 22 concepts: chapter starts from
 * the book's printed contents page, concept starts from the running head of the
 * page the concept opens on. Produced by `server/scripts/.science-tree.mjs` and
 * verified against every printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_SCIENCE_T1_UNITS: ScienceT1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الفصل الأول: شروط الاحتراق",
    bookFrom: 6,
    bookTo: 17,
    concepts: [
      { key: "1-1", title: "الهواء واحتراق الأشياء", bookFrom: 6, concepts: ["الهواء والاحتراق"] },
      { key: "1-2", title: "دور الأكسجين", bookFrom: 8, concepts: ["الغاز الذي يساعد على الاحتراق"] },
      {
        key: "1-3",
        title: "الهواء بعد الاحتراق",
        bookFrom: 12,
        concepts: ["التغير في تركيب الهواء بعد الاحتراق"],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الفصل الثاني: التنفس",
    bookFrom: 18,
    bookTo: 23,
    concepts: [
      { key: "2-1", title: "كيف يحدث التنفس؟", bookFrom: 18, concepts: ["التنفس وكيفية حدوثه"] },
      { key: "2-2", title: "كيف تعمل الرئتان؟", bookFrom: 20, concepts: ["الرئتان هما مكان تبادل الغازات"] },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الفصل الثالث: الهضم",
    bookFrom: 24,
    bookTo: 33,
    concepts: [
      { key: "3-1", title: "أين يذهب الطعام؟", bookFrom: 24, concepts: ["الهضم وكيفية حدوثه"] },
      { key: "3-2", title: "وظيفة اللعاب", bookFrom: 26, concepts: ["وظيفة اللعاب"] },
      {
        key: "3-3",
        title: "كيف يتم الامتصاص؟",
        bookFrom: 30,
        concepts: ["تركيب الأمعاء الدقيقة وامتصاص العناصر الغذائية"],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "الفصل الرابع: الدورة الدموية والإخراج",
    bookFrom: 34,
    bookTo: 45,
    concepts: [
      { key: "4-1", title: "القلب والدم", bookFrom: 34, concepts: ["الدورة الدموية وكيفية عمل القلب"] },
      { key: "4-2", title: "كيف تعمل الكليتان؟", bookFrom: 38, concepts: ["التخلص من الفضلات"] },
      { key: "4-3", title: "أعضاء مختلفة", bookFrom: 40, concepts: ["ترتيب الأعضاء وتكامل عملها"] },
    ],
  },
  {
    ordinal: "الخامسة",
    title: "الفصل الخامس: البناء الضوئي",
    bookFrom: 46,
    bookTo: 53,
    concepts: [
      { key: "5-1", title: "ضوء الشمس والنشا", bookFrom: 46, concepts: ["النباتات والعناصر الغذائية"] },
      { key: "5-2", title: "تبادل الغازات", bookFrom: 50, concepts: ["العلاقة بين النباتات والهواء"] },
    ],
  },
  {
    ordinal: "السادسة",
    title: "الفصل السادس: انتقال الماء في النبات",
    bookFrom: 54,
    bookTo: 61,
    concepts: [
      { key: "6-1", title: "النتح", bookFrom: 54, concepts: ["النباتات والماء"] },
      { key: "6-2", title: "مسار الماء", bookFrom: 56, concepts: ["العلاقة بين النباتات والماء"] },
    ],
  },
  {
    ordinal: "السابعة",
    title: "الفصل السابع: السلسلة الغذائية",
    bookFrom: 62,
    bookTo: 67,
    concepts: [
      { key: "7-1", title: "السلسلة الغذائية", bookFrom: 62, concepts: ["كيف تعمل السلسلة الغذائية؟"] },
      {
        key: "7-2",
        title: "الكائنات الحية والماء والهواء",
        bookFrom: 64,
        concepts: ["دوران الهواء والماء"],
      },
    ],
  },
  {
    ordinal: "الثامنة",
    title: "الفصل الثامن: السلاسل الغذائية في مصر",
    bookFrom: 68,
    bookTo: 73,
    concepts: [
      {
        key: "8-1",
        title: "السلاسل الغذائية في الصحراء ونهر النيل",
        bookFrom: 68,
        concepts: ["الأنظمة البيئية في مصر"],
      },
    ],
  },
  {
    ordinal: "التاسعة",
    title: "الفصل التاسع: خصائص المحاليل",
    bookFrom: 74,
    bookTo: 81,
    concepts: [
      {
        key: "9-1",
        title: "تصنيف المحاليل",
        bookFrom: 74,
        concepts: ["المحاليل الحمضية، المتعادلة، والقلوية"],
      },
      { key: "9-2", title: "ما الذي يذوب في المحاليل؟", bookFrom: 76, concepts: ["تحديد المواد الذائبة"] },
    ],
  },
  {
    ordinal: "العاشرة",
    title: "الفصل العاشر: تفاعل المحاليل مع الفلزات",
    bookFrom: 82,
    bookTo: 97,
    concepts: [
      {
        key: "10-1",
        title: "المحاليل المائية والفلزات",
        bookFrom: 82,
        concepts: ["تأثير المحاليل المائية على الفلزات"],
      },
      { key: "10-2", title: "ماذا يتبقى بعد التبخير؟", bookFrom: 84, concepts: ["التغيرات في الفلزات"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span of one concept: its own start page up to the page before the
 * next concept starts, capped by its own chapter's last page. Deriving the end
 * this way is what keeps a concept's exercise pages («حاول» / «تدرَّب» /
 * «هيا نتوسّع») inside the concept they belong to.
 */
export function conceptBookRange(unitIndex: number, conceptIndex: number): { from: number; to: number } {
  const unit = EGYPT_SCIENCE_T1_UNITS[unitIndex]!;
  const concept = unit.concepts[conceptIndex]!;
  const next = unit.concepts[conceptIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from: concept.bookFrom, to };
}

/** Every concept's derived range, flattened — used by the tests and the audit. */
export function allConceptRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SCIENCE_T1_UNITS.forEach((unit, ui) => {
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
  "science-t1",
);

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

/** Convenience: the full document payload for one concept lesson. */
export function conceptDocument(unitIndex: number, conceptIndex: number): string {
  const range = conceptBookRange(unitIndex, conceptIndex);
  return loadBookRange(range.from, range.to);
}

// ---------------------------------------------------------------------------
// PHASE 59 — self-checks
// ---------------------------------------------------------------------------

/**
 * Arabic-folded, punctuation-free text: lets a printed «تعلّم …» topic match
 * across the OCR's inconsistent hamza/ya/ta-marbuta and its optional tashkeel.
 */
function normalize(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0624/g, "\u0648")
    .replace(/\u0626/g, "\u064A")
    .replace(/[^\u0621-\u064A0-9]/g, "");
}

/**
 * Table invariants: every concept's key matches its position, every range is
 * inside its chapter, chapters tile the book without gaps or overlaps, and the
 * first chapter starts where the contents page says. A content mistake here
 * would quietly ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_SCIENCE_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.concepts.length === 0) problems.push(`الفصل ${unit.ordinal}: بلا مفاهيم`);
    unit.concepts.forEach((concept, ci) => {
      const expectedKey = `${ui + 1}-${ci + 1}`;
      if (concept.key !== expectedKey) {
        problems.push(`الفصل ${ui + 1} المفهوم ${ci + 1}: المفتاح «${concept.key}» بدل «${expectedKey}»`);
      }
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
  if (first && first.bookFrom !== EGYPT_SCIENCE_T1_BOOK_START) {
    problems.push(`الفصل الأول يجب أن يبدأ من الصفحة ${EGYPT_SCIENCE_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SCIENCE_T1_BOOK_END) {
    problems.push(`الفصل الأخير يجب أن ينتهي عند الصفحة ${EGYPT_SCIENCE_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check: read every printed page of the committed OCR corpus and
 * confirm the concept head it prints falls inside that concept's derived range.
 *
 * This is what catches a wrong page range even when the table looks internally
 * tidy — a range that ends one page early, or starts one page late, is
 * arithmetically fine but would hide book content from the tutor. It also
 * confirms every concept's start page has OCR text, so a lesson document is
 * never silently empty.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const ranges = allConceptRanges();
  const byTitle = new Map(ranges.map((r) => [r.title, r]));
  const titles = new Set(ranges.map((r) => r.title));

  let pagesChecked = 0;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SCIENCE_T1_BOOK_START || book > EGYPT_SCIENCE_T1_BOOK_END) continue;
    pagesChecked++;
    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: لا يوجد نص OCR`);
      continue;
    }
    // The head sits on line 1 on the lesson pages and on line 2 on the exercise
    // pages, where line 1 is the chapter marker («الفصل ١٠»).
    const head = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map((line) => {
        const cut = line.search(/الفصل\s/);
        const trimmed = cut >= 0 ? line.slice(0, cut).trim() : line;
        return trimmed.replace(/^[٠-٩0-9]+\s*[-–—]\s*[٠-٩0-9]+\s*/, "").trim();
      })
      .find((t) => titles.has(t));
    if (!head) continue;
    const range = byTitle.get(head)!;
    if (book < range.from || book > range.to) {
      problems.push(`صفحة الكتاب ${book} تطبع رأس المفهوم «${head}» خارج نطاقه ${range.from}–${range.to}`);
    }
  }

  if (pagesChecked === 0) problems.push("لم يُعثر على أي صفحة OCR — المسار غير صحيح؟");

  // The reverse direction: every concept in the table must actually be printed
  // somewhere in the book. A concept the OCR never sees is a table mistake (a
  // wrong title, or a page range pointing at the wrong sheet), not book content.
  const seen = new Set<string>();
  for (const [title] of byTitle) {
    const range = byTitle.get(title)!;
    for (let book = range.from; book <= range.to; book++) {
      const text = loadBookPage(book);
      if (text && text.includes(title)) {
        seen.add(title);
        break;
      }
    }
  }
  for (const r of ranges) {
    if (!seen.has(r.title)) problems.push(`المفهوم ${r.key}: لم يظهر عنوانه «${r.title}» في صفحاته ${r.from}–${r.to}`);
  }

  for (const r of ranges) {
    for (let book = r.from; book <= r.to; book++) {
      if (!loadBookPage(book)) problems.push(`المفهوم ${r.key}: صفحة ${book} بلا نص OCR`);
    }
  }

  // The printed «تعلّم …» learning topic of every concept must appear inside the
  // concept's own pages: that heading is the app's `concepts` list, so it may not
  // drift from the book.
  EGYPT_SCIENCE_T1_UNITS.forEach((unit, ui) => {
    unit.concepts.forEach((concept, ci) => {
      if (concept.concepts.length === 0) {
        problems.push(`المفهوم ${concept.key}: بلا عنوان تعلّم مطبوع`);
        return;
      }
      const { from, to } = conceptBookRange(ui, ci);
      let text = "";
      for (let book = from; book <= to; book++) text += " " + loadBookPage(book);
      const haystack = normalize(text);
      for (const topic of concept.concepts) {
        const fingerprint = normalize(topic).slice(0, 15);
        if (fingerprint.length < 8) continue;
        if (!haystack.includes(fingerprint)) {
          problems.push(`المفهوم ${concept.key}: عنوان تعلمه «${topic}» غير مطبوع في صفحاته ${from}–${to}`);
        }
      }
    });
  });

  return { ok: problems.length === 0, problems, pagesChecked };
}