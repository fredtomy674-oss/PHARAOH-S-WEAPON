// PHASE 66 — official Egypt Grade-6 Mathematics, first term, **English-medium**
// edition («كتاب الوزارة»).
//
// The curriculum tree for the Egypt `eg-g6-math-en` curriculum is rebuilt from
// the Ministry textbook `Math_Primary6_T1_EN.pdf` (Primary 6 Mathematics
// Techbook™, 2026/2027 MoE edition). This is the English-language edition of the
// same book as `egyptT1.ts` (Arabic medium): it prints the same seven units and
// the same page numbers, so the tree mirrors `egyptT1.ts` unit-by-unit while
// taking its titles and its OCR transcript from the English scan.
//
// LAYERS: THE BOOK PRINTS THREE, THE APP MODELS TWO
// The maths book's printed index is unit → concept → lesson. The app's schema is
// country/system/grade/subject/curriculum/term/unit/lesson (there is no concept
// table), so — exactly as the Arabic maths curriculum (`eg-g6-math`) and Science
// already do — the app lesson is the printed **concept**, and the concept's
// printed lessons live inside its document. Each concept's app `concepts` list is
// the printed «Learning Target» bullets of its lessons, verbatim.
//
// Page mapping (verified against the scan's footers):
//   pdfPage = bookPage + 9   (book page 1 = PDF page 10)
// The unit opener pages (the «Unit Opener»/Video/Key Vocabulary spread) precede
// each unit's first concept: PDFs 9, 23, 43, 67, 77, 89, 107, i.e. book pages 0,
// 14, 34, 58, 68, 80, 98. Unit 1's opener is unnumbered, so its book page is 0.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.1 = PDF p.10). */
export const BOOK_TO_PDF_OFFSET = 9;

/** First page of the term — the (unnumbered) opener of unit 1. */
export const EGYPT_MATH_EN_T1_BOOK_START = 0;

/**
 * Last numbered content page (the final page of unit 7's concept 7.1, whose foot
 * is «111»). The back matter (colophon, back cover) follows on PDFs 121–122.
 */
export const EGYPT_MATH_EN_T1_BOOK_END = 111;

/** One concept (المفهوم) of the textbook — becomes one lesson in the app tree. */
export interface MathEnT1Concept {
  /** Printed concept label, e.g. "1.1". */
  key: string;
  /** Concept title as printed, English then its Arabic counterpart. */
  title: string;
  /** Book pages where the concept's lessons start (printed lesson numbers). */
  lessonStarts: number[];
  /** The lessons' printed «Learning Target» bullets, verbatim (book order). */
  concepts: string[];
}

export interface MathEnT1Unit {
  /** Unit title as printed, English then its Arabic counterpart. */
  title: string;
  concepts: MathEnT1Concept[];
}

/**
 * The seven units of the first term, straight from the book's printed Table of
 * Contents (PDF 5–6), with every concept's page starts and each lesson's printed
 * Learning Targets read from the lesson pages themselves.
 */
export const EGYPT_MATH_EN_T1_UNITS: MathEnT1Unit[] = [
  {
    title: "Unit 1: Divisibility, Factors, and Multiples — الوحدة الأولى: قابلية القسمة والعوامل والمضاعفات",
    concepts: [
      {
        key: "1.1",
        title: "Divisibility, GCF and LCM — قابلية القسمة والعامل المشترك الأكبر والمضاعف المشترك الأصغر",
        lessonStarts: [1, 3, 5, 8],
        concepts: [
          "I can deduce divisibility by 2, 3, 4, 5, 6 and 10",
          "I can utilize prime factorization in finding GCF and LCM.",
          "I can write and analyze expressions involving the GCF.",
          "I can visualize how an expression that represents two whole numbers as a multiple of a sum of two whole numbers can represent a real-world situation.",
          "I can analyze and evaluate addition and subtraction of fractions.",
          "I can use the least common multiple to create a common denominator.",
        ],
      },
    ],
  },
  {
    title: "Unit 2: Rational Numbers — الوحدة الثانية: الأعداد النسبية",
    concepts: [
      {
        key: "2.1",
        title: "Explore the Number Line — استكشاف خط الأعداد",
        lessonStarts: [15, 19],
        concepts: [
          "I can recognize the number line to include negative numbers in order to utilize them to model real-world situations.",
          "I can plot points representing positive and negative numbers.",
          "I can discuss the relative positions by plotting points that represent positive and negative numbers on a number line.",
          "I can utilize the interactive to discover opposites of numbers.",
        ],
      },
      {
        key: "2.2",
        title: "Investigate Rational Numbers — استكشاف الأعداد النسبية",
        lessonStarts: [23, 26],
        concepts: [
          "I can utilize the visual of a Venn diagram to help students conceptualize the number system.",
          "I can investigate the symmetry of the number line and the use of opposites through a real-world context of tug-of-war.",
          "I can practice representing real-world situations as rational numbers, and then order the values from least to greatest.",
        ],
      },
      {
        key: "2.3",
        title: "Interpret and Use Absolute Value — تفسير القيمة المطلقة واستخدامها",
        lessonStarts: [28, 31],
        concepts: [
          "I can represent distance for real-world situations involving jumping fish and meeting friends at a fishpond.",
          "I can understand absolute value on a number line.",
          "I can compare absolute values using symbols.",
          "I can interpret the use of absolute value through real-world situations involving money and temperature.",
        ],
      },
    ],
  },
  {
    title: "Unit 3: Algebraic Expressions — الوحدة الثالثة: المقادير الجبرية",
    concepts: [
      {
        key: "3.1",
        title: "Use and Analyze Expressions — استخدام التعبيرات الرياضية وتحليلها",
        lessonStarts: [35, 39, 43],
        concepts: [
          "I can use a variable in a mathematical expression to communicate multiple pieces of data.",
          "I can define the elements of algebraic expressions such as term, like terms, constants, and coefficients.",
          "I can use a life-size number line to act out numeric and algebraic expressions.",
          "I can write verbal expressions that represent numeric expressions and algebraic expressions that represent real-world scenarios.",
        ],
      },
      {
        key: "3.2",
        title: "Algebraic Expressions and Exponents — المقادير الجبرية والأسس",
        lessonStarts: [47, 50, 52, 55],
        concepts: [
          "I can review the basic order of operations.",
          "I can simplify numeric expressions that contain exponents.",
          "I can use substitution to evaluate algebraic expressions related to real-world situations.",
          "I can evaluate expressions involving exponents and parentheses.",
          "I can explore whether two expressions are equivalent using a balance scale as a concrete model.",
        ],
      },
    ],
  },
  {
    title: "Unit 4: Equations and Inequalities — الوحدة الرابعة: المعادلات والمتباينات",
    concepts: [
      {
        key: "4.1",
        title: "Write and Solve Equations and Inequalities — كتابة المعادلات والمتباينات واستراتيجيات حلها",
        lessonStarts: [59, 61, 64],
        concepts: [
          "I can use a pan balance to model and solve algebraic equations.",
          "I can explore signs that indicate a restriction such as a speed limit, a sale markdown, a weight limit, or a capacity limit.",
          "I can analyze these scenarios and determine how they differ from equation scenarios.",
          "I can use a number line to represent inequalities.",
        ],
      },
    ],
  },
  {
    title: "Unit 5: Dependent and Independent Variables — الوحدة الخامسة: المتغيرات التابعة والمستقلة",
    concepts: [
      {
        key: "5.1",
        title: "Explore Relationship between Two Variables — استكشاف العلاقة بين متغيرين",
        lessonStarts: [69, 72, 74, 76],
        concepts: [
          "I can explore and apply formal definitions of independent variables and dependent variables.",
          "I can examine and create algebraic equations to model real-life situations.",
          "I can discover how to use independent and dependent variables when writing equations.",
          "I can connect representations of dependent and independent variables in tables, equations, and graphs.",
          "I can represent dependent and independent variables on a coordinate plane.",
        ],
      },
    ],
  },
  {
    title: "Unit 6: Data Distributions — الوحدة السادسة: توزيع البيانات",
    concepts: [
      {
        key: "6.1",
        title: "Applications on Collecting and Representing Data — جمع البيانات وتمثيلها وتطبيقات عليها",
        lessonStarts: [81, 85, 88, 90, 94],
        concepts: [
          "I can explore statistical questions and data.",
          "I can compare and contrast statistical and non-statistical questions.",
          "I can explore and discover characteristics of histograms.",
          "I can create a histogram for a given set of data.",
          "I can collect data using number cubes and create a histogram for that data.",
          "I can calculate the median and 5-point summary of a data set and describe how these values are represented on a box plot.",
          "I can analyze data displays to determine which is most appropriate when answering statistical questions.",
        ],
      },
    ],
  },
  {
    title: "Unit 7: Measures of Central Tendency and Spread — الوحدة السابعة: مقاييس النزعة المركزية والانتشار",
    concepts: [
      {
        key: "7.1",
        title: "Exploring Measures of Central Tendency and Spread — استكشاف مقاييس النزعة المركزية والانتشار",
        lessonStarts: [99, 102, 105, 109],
        concepts: [
          "I can summarize the data in a data set using a single number.",
          "I can explore mean as a fair share.",
          "I can determine an algorithm for calculating the mean of a data set.",
          "I can determine how outliers and shape of a graph can help to determine whether mean or median is a better measure of central tendency.",
          "I can define and compute the range of data sets as an introduction to the importance of measures of variability.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/** The unit's opener page sits one page before its first concept's first lesson. */
export function unitOpenerBookPage(unitIndex: number): number {
  return EGYPT_MATH_EN_T1_UNITS[unitIndex]!.concepts[0]!.lessonStarts[0]! - 1;
}

/**
 * Book-page span of one concept: from its unit's opener (first concept) or its
 * first lesson, up to just before the next lesson/unit boundary — the next
 * unit's opener page belongs to that unit, not to the previous concept.
 */
export function conceptBookRange(unitIndex: number, conceptIndex: number): { from: number; to: number } {
  const unit = EGYPT_MATH_EN_T1_UNITS[unitIndex]!;
  const concept = unit.concepts[conceptIndex]!;
  const from = conceptIndex === 0 ? unitOpenerBookPage(unitIndex) : concept.lessonStarts[0]!;
  let to: number;
  if (conceptIndex + 1 < unit.concepts.length) {
    to = unit.concepts[conceptIndex + 1]!.lessonStarts[0]! - 1;
  } else if (unitIndex + 1 < EGYPT_MATH_EN_T1_UNITS.length) {
    to = unitOpenerBookPage(unitIndex + 1) - 1;
  } else {
    to = EGYPT_MATH_EN_T1_BOOK_END;
  }
  return { from, to };
}

/** Every concept's derived range, flattened — used by the tests and the audit. */
export function allConceptRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_EN_T1_UNITS.forEach((unit, ui) => {
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
  "math-en-t1",
);

/**
 * Pages that are full-page pictures with no machine-readable text. Verified two
 * ways: the PDF has no text layer on them (Node pdf.js returns 0 characters),
 * and the scan either rendered them as photographs. The OCR provider answered
 * book 13/67/79 with «no text» and hallucinated foreign words on book 97, so the
 * reader blanks all four rather than inject invented text into the tutor.
 */
const IMAGE_ONLY_BOOK_PAGES: ReadonlySet<number> = new Set([13, 67, 79, 97]);

/** OCR text of one printed book page, or "" when it has none. */
export function loadBookPage(book: number): string {
  if (IMAGE_ONLY_BOOK_PAGES.has(book)) return "";
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

/**
 * The OCR provider answers a truly blank page with one of these sentences (the
 * wording varies between calls) instead of an empty string. They mean «no text»,
 * not content, so verification treats them as missing.
 */
const NO_TEXT_MARKERS = ["لا يوجد نص مكتوب في الصورة المرفقة", "لا توجد نصوص في الصورة المرفقة", "لا توجد نصوص في هذه الصورة"];

/** True when a content page carries real text (not a blank-page placeholder). */
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

/** Convenience: the full document payload for one concept lesson. */
export function conceptDocument(unitIndex: number, conceptIndex: number): string {
  const range = conceptBookRange(unitIndex, conceptIndex);
  return loadBookRange(range.from, range.to);
}

// ---------------------------------------------------------------------------
// PHASE 66 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"; // U+0660..U+0669
const EXT_AR_DIGITS = "۰۱۲۳۴۵۶۷۸۹"; // U+06F0..U+06F9

/** Arabic-Indic digits → Latin, so a footer compares by value, not by glyph. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * The book number a page prints in its running foot, or null when the last line
 * is not a bare numeral. The maths foot is either the number alone or the lesson
 * caption followed by "| N" («Lesson 4 • Exploring The Range | 111»).
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  const latin = toLatinDigits(last);
  const bare = /^\d{1,3}$/.exec(latin);
  if (bare) return Number(bare[0]);
  const piped = /\|\s*(\d{1,3})$/.exec(latin);
  if (piped) return Number(piped[1]);
  return null;
}

/** Lowercase alphanumerics only — lets a title match across the book's layout. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Table invariants: every range sits inside its unit, units tile the book without
 * gaps or overlaps, and the table starts/ends where the book does. A content
 * mistake here would quietly ground the tutor on the wrong pages.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_EN_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.concepts.length === 0) problems.push(`الوحدة ${ui + 1}: بلا مفاهيم`);
    const unitFrom = unitOpenerBookPage(ui);
    const unitTo =
      ui + 1 < units.length ? unitOpenerBookPage(ui + 1) - 1 : EGYPT_MATH_EN_T1_BOOK_END;
    unit.concepts.forEach((concept, ci) => {
      if (concept.concepts.length === 0) problems.push(`المفهوم ${concept.key}: بلا أهداف`);
      if (concept.lessonStarts.length === 0) problems.push(`المفهوم ${concept.key}: بلا دروس`);
      const { from, to } = conceptBookRange(ui, ci);
      if (from > to) problems.push(`المفهوم ${concept.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unitFrom || to > unitTo) {
        problems.push(`المفهوم ${concept.key}: نطاقه ${from}–${to} خارج نطاق الوحدة ${unitFrom}–${unitTo}`);
      }
      const next = unit.concepts[ci + 1];
      if (next && to >= next.lessonStarts[0]!) problems.push(`المفهوم ${concept.key} يتداخل مع ${next.key}`);
    });
    const nextUnit = units[ui + 1];
    if (nextUnit && unitTo >= unitOpenerBookPage(ui + 1)) {
      problems.push(`الوحدة ${ui + 1} تتداخل مع الوحدة التالية`);
    } else if (nextUnit && unitTo !== unitOpenerBookPage(ui + 1) - 1) {
      problems.push(`فجوة صفحات بعد الوحدة ${ui + 1}`);
    }
  });

  if (unitOpenerBookPage(0) !== EGYPT_MATH_EN_T1_BOOK_START) {
    problems.push(`بداية المنهج يجب أن تكون الصفحة ${EGYPT_MATH_EN_T1_BOOK_START}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number;
 *  2. every content page carries real OCR text (the four picture-only pages are
 *     documented and excluded);
 *  3. every concept's first page prints that concept's title;
 *  4. every printed page is owned by exactly one concept.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const ranges = allConceptRanges();
  let footersChecked = 0;

  for (let book = EGYPT_MATH_EN_T1_BOOK_START; book <= EGYPT_MATH_EN_T1_BOOK_END; book++) {
    if (IMAGE_ONLY_BOOK_PAGES.has(book)) continue;
    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    if (!pageHasText(book)) {
      problems.push(`صفحة الكتاب ${book}: بلا نص حقيقي (صفحة فارغة أو فشل مسح)`);
      continue;
    }
    const footer = printedFooter(book);
    if (footer !== null) {
      footersChecked++;
      if (footer !== book) {
        problems.push(`صفحة الكتاب ${book}: الفوتر المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each concept's first page prints its concept title.
  EGYPT_MATH_EN_T1_UNITS.forEach((unit) => {
    unit.concepts.forEach((concept) => {
      const opener = loadBookPage(concept.lessonStarts[0]!);
      if (!opener) {
        problems.push(`المفهوم ${concept.key}: صفحته الأولى ${concept.lessonStarts[0]} بلا نص OCR`);
        return;
      }
      // The printed concept title is the English half of our bilingual title.
      const english = concept.title.split(" — ")[0]!;
      if (!normalize(opener).includes(normalize(english))) {
        problems.push(`المفهوم ${concept.key}: صفحته الأولى ${concept.lessonStarts[0]} لا تطبع عنوانه «${english}»`);
      }
    });
  });

  // 4. every printed page is owned by exactly one concept.
  for (let book = EGYPT_MATH_EN_T1_BOOK_START; book <= EGYPT_MATH_EN_T1_BOOK_END; book++) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} مفهومًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
