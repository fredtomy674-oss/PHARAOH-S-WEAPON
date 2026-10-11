// PHASE 98 — official Egypt Preparatory-1 (Grade 7) Mathematics,
// **English-medium** edition («كتاب الوزارة»), first term, Ministry 2026/2027.
//
// The curriculum `eg-g7-math-en` is rebuilt from the Ministry textbook
// `Math_EN_Prp1_T1.pdf` (122 scan pages, all OCR'd) under
// server/data/curriculum-ocr/math-en-p1-t1/. It is the English edition of the
// same book as `egyptMathP1T1.ts` (Arabic medium): it prints the same four
// units, the same sixteen «الدرس», and the same page boundaries, so this module
// mirrors that one unit-by-unit while taking its titles and its OCR transcript
// from the English scan.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 7   (book page 2 = PDF page 9, book page 104 = PDF page 111)
// Every content page carries its own number in the running foot — sometimes
// alone («7»), sometimes wrapped with the unit title («14 Unit One: Numbers and
// Their Operations …»), sometimes with the running title («Mathematics - First
// Preparatory») — which is what fixes the offset at 7 and proves the mapping
// page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس», NOT A «مفهوم»
// This book's contents page lists «Unit Lessons»: four units of five, two, three
// and six numbered lessons (1-1 … 4-6), each with its printed «Learning
// Outcomes». The app lesson is that printed lesson, and its concepts are those
// outcomes.
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND ASSESSMENTS
// Each unit opens with a one-page opener (title + «Unit Lessons») and closes
// with «Unit N Assessment»; the book then finishes with «Final Assessment».
// Neither is a lesson, so — as in the other Ministry books — the opener rides
// with the unit's first lesson and the assessment with its last. Books 114–115
// (the credits and the back cover) are back matter outside the taught ranges.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.2 = PDF p.9). */
export const BOOK_TO_PDF_OFFSET = 7;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_MATH_EN_P1_T1_BOOK_START = 1;

/** Last printed content page — the closing «Final Assessment» (books 114–115 are back matter). */
export const EGYPT_MATH_EN_P1_T1_BOOK_END = 113;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface MathEnP1T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed at the head of the lesson, English then its Arabic counterpart. */
  title: string;
  /**
   * First printed book page of the lesson itself. The range the lesson *owns*
   * also includes its unit's opener when it is the unit's first lesson, which is
   * why ownership is derived by `lessonBookRange` rather than stored here.
   */
  bookFrom: number;
  /** The book's printed «Learning Outcomes» for this lesson. */
  concepts: string[];
}

export interface MathEnP1T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, English then its Arabic counterpart. */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: MathEnP1T1Lesson[];
}

/**
 * The four units of the first term with their sixteen lessons: unit/lesson
 * starts from the book's contents page (iv), outcomes from each lesson's first
 * page (2, 7, 14, 19, 24 / 32, 39 / 47, 55, 60 / 69, 77, 84, 90, 98, 104).
 * Verified against every printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_MATH_EN_P1_T1_UNITS: MathEnP1T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "Unit 1: Numbers and Their Operations — الوحدة الأولى: الأعداد والعمليات عليها",
    bookFrom: 1,
    bookTo: 30,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "Proportion — التناسب",
        bookFrom: 2,
        concepts: [
          "Learn the concept of proportion.",
          "Write a proportional relationship.",
          "Identify proportional and non-proportional relationships.",
          "Solve proportions using cross multiplication.",
          "Represent proportional relationships graphically.",
          "Employ proportion in solving real-life problems.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "Applications of Ratio and Proportion — تطبيقات النسبة والتناسب",
        bookFrom: 7,
        concepts: [
          "Learn the scale drawings.",
          "Calculate the scale drawings.",
          "Calculate the real length.",
          "Calculate the length in the drawing.",
          "Solve problems involving scale drawings.",
          "Learn the concept of proportional division.",
          "Apply ratio and proportion to solve real-life problems, including scale drawings, proportional division, sales, and purchases.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "Sets and Their Operations — المجموعات والعمليات عليها",
        bookFrom: 14,
        concepts: [
          "Learn the concept of sets.",
          "Express sets using the listing method.",
          "Express sets using the set-builder method.",
          "Represent sets using Venn diagrams.",
          'Learn the "belongs to" and "subset" symbols.',
          'Learn the "intersection" and "union" symbols.',
          "Find the union or intersection of two sets.",
          "Represent the operations of union and intersection of two sets using Venn diagrams.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "Operations on Integers — العمليات على الأعداد الصحيحة",
        bookFrom: 19,
        concepts: [
          "Find the sum or difference of two integers.",
          "Apply the properties of addition and subtraction to solve problems involving integers.",
          "Find the product of two integers.",
          "Find the quotient of two integers (if possible).",
          "Learn the properties of multiplication and division of integers.",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "Operations on Rational Numbers — العمليات على الأعداد النسبية",
        bookFrom: 24,
        concepts: [
          "Learn different forms of a rational number.",
          "Find the sum or difference of two rational numbers.",
          "Apply addition and subtraction properties to solve rational numbers problems.",
          "Find the product of two rational numbers.",
          "Find the quotient of two rational numbers (if possible).",
          "Learn multiplication and division properties of the rational numbers.",
          "Utilize mathematical operations properties to solve problems involving rational numbers.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "Unit 2: Algebra — الوحدة الثانية: الجبر",
    bookFrom: 31,
    bookTo: 45,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "Mathematical Expressions and Formulas — التعبيرات والصيغ الرياضية",
        bookFrom: 32,
        concepts: [
          "Represent variables using symbols.",
          "Learn algebraic term and algebraic expression.",
          "Learn mathematical expression and mathematical formula.",
          "Differentiate between mathematical expression and mathematical formula.",
          "Learn equation and inequality.",
          "Simplify and evaluate algebraic expression at a specific value.",
          "Learn about temperature measuring units (Celsius and Fahrenheit) and the relationship between them.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "Linear Equations — المعادلات الخطية",
        bookFrom: 39,
        concepts: [
          "Form a linear equation in one variable.",
          "Recognize the relationship between the substitution set and the solution set.",
          "Solve a linear equation in one variable within the sets of natural numbers, integers, and rational numbers.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "Unit 3: Statistics — الوحدة الثالثة: الإحصاء",
    bookFrom: 46,
    bookTo: 67,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "Organizing Data — تنظيم البيانات",
        bookFrom: 47,
        concepts: [
          "Recall the different methods of organizing data.",
          "Learn how to create a frequency table with intervals.",
          "Learn how to represent data using a stem-and-leaf plot.",
          "Distinguish between misleading and non-misleading graphs.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "Arithmetic Mean — الوسط الحسابي",
        bookFrom: 55,
        concepts: [
          "Learn the measures of central tendency.",
          "Learn how to calculate the arithmetic mean of a set of values.",
          "Learn how to calculate the arithmetic mean of a frequency table.",
          "Understand what is meant by misleading statistics.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "Pie Charts — القطاعات الدائرية",
        bookFrom: 60,
        concepts: [
          "Learn the concept of pie charts.",
          "Learn how to represent data using pie charts.",
        ],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "Unit 4: Geometry & Measurement — الوحدة الرابعة: الهندسة والقياس",
    bookFrom: 68,
    bookTo: 113,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "Types of Angles and Relations between Angles — أنواع الزوايا والعلاقات بين الزوايا",
        bookFrom: 69,
        concepts: [
          "Learn the concept of angles and their units of measurement.",
          "Identify and differentiate between various types of angles.",
          "Learn the adjacent angles.",
          "Learn the complementary angles.",
          "Learn the supplementary angles.",
          "Learn the vertically opposite angles.",
          "Learn about the accumulative angles at a point.",
          "Identify angles pairs in geometric shapes and the relationships between each pair.",
          "Apply the relationships between angles pairs to solve problems.",
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        title: "Parallelism — التوازي",
        bookFrom: 77,
        concepts: [
          "Learn the concept of parallelism.",
          "Identify the angles formed when a straight line intersects two other straight lines.",
          "Learn about the corresponding angles.",
          "Learn about the alternating angles.",
          "Learn about the interior angles on the same side of a transversal.",
          "Identify the relationship between angles formed when a straight line intersects two parallel straight lines.",
          "Prove that two straight lines are parallel.",
          "Learn how to write a geometric proof.",
        ],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        title: "Triangle — المثلث",
        bookFrom: 84,
        concepts: [
          "Deduce the sum of the measures of the interior angles of a triangle.",
          "Learn the concept of the exterior angle of a triangle.",
          "Deduce the relationship between the exterior angle of a triangle and its interior angles.",
          "Learn the concept of the triangle inequality.",
        ],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        title: "Quadrilaterals — الأشكال الرباعية",
        bookFrom: 90,
        concepts: [
          "Learn the concept of quadrilaterals.",
          "Deduce the sum of measures of the interior angles of a quadrilateral.",
          "Distinguish between the special quadrilaterals.",
          "Identify the relationships among the quadrilaterals in the quadrilateral family tree.",
        ],
      },
      {
        key: "4-5",
        ordinal: "الخامس",
        title: "Polygons — المضلعات",
        bookFrom: 98,
        concepts: [
          "Learn the concept of polygon.",
          "Distinguish between convex and concave polygons.",
          "Deduce the sum of the measures of the interior angles of a polygon.",
          "Learn the regular polygon.",
          "Learn the concept of the axis of symmetry.",
          "Determine the axes of symmetry in polygons.",
        ],
      },
      {
        key: "4-6",
        ordinal: "السادس",
        title: "Coordinates — الإحداثيات",
        bookFrom: 104,
        concepts: [
          "Represent the coordinates of a point in a coordinate plane.",
          "Determine the quadrant in which a point is located in a coordinate plane.",
          "Determine the projection of a point on the coordinate axes.",
          "Determine the projection of a line segment on the coordinate axes.",
          "Determine the coordinates of the midpoint of a line segment.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the unit's opener (for the unit's first
 * lesson) or its own start page, up to the page before the next lesson starts,
 * or the unit's last page for its last lesson. Deriving the end this way keeps
 * the unit opener and each lesson's activity block inside the lesson they
 * belong to — and lands the unit assessment (and the final assessment for the
 * last unit) on the last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_MATH_EN_P1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_EN_P1_T1_UNITS.forEach((unit, ui) => {
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
  "math-en-p1-t1",
);

/**
 * Printed content pages that carry no readable text in the book itself — a
 * full-page figure. Confirmed by the pushy re-OCR prompt
 * (scripts/.ocr-fix-dir.mjs), which answers «NONE» for genuinely textless
 * pages: book page 48 (inside lesson 3-1, Organizing Data) is a full-page
 * figure with no readable text.
 */
const TEXTLESS_PAGES = new Set<number>([48]);

/**
 * The OCR provider answers a truly blank page with one of these sentences (the
 * wording varies between calls) instead of an empty string. They mean "no text",
 * not content, so verification treats them as missing while `loadBookPage` still
 * returns them verbatim.
 */
const NO_TEXT_MARKERS = [
  "لا يوجد نص مكتوب في الصورة المرفقة",
  "لا يوجد نص في الصورة المرفقة",
  "لا توجد نصوص في الصورة المرفقة",
  "[صفحة فارغة]",
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

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"; // U+0660..U+0669
const EXT_AR_DIGITS = "۰۱۲۳۴۵۶۷۸۹"; // U+06F0..U+06F9

/**
 * Arabic-Indic digits → Latin. The scan mixes Eastern (٠–٩) and Extended
 * Arabic-Indic (۰–۹) digits from page to page, so both ranges are mapped; a
 * footer would otherwise compare unequal for a purely cosmetic reason.
 */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints in its running foot, or null when the
 * page prints no number. The foot spans up to three lines near the bottom and
 * the number sits on one of them — alone («7»), wrapped with the unit title
 * («14 Unit One: Numbers and Their Operations …»), or wrapped with the running
 * title («Mathematics - First Preparatory»); the unit openers print a values
 * banner instead. A line is accepted only when it looks like one of these — a
 * lone numeral or a line carrying «Unit One..Four»/«First Term»/«Final
 * Assessment»/«First Preparatory»/«Mathematics» — so a content line that merely
 * ends in a number is not mistaken for the foot.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const tail = lines.slice(-3);
  for (let i = tail.length - 1; i >= 0; i--) {
    const latin = toLatinDigits(tail[i]!);
    const runs = latin.match(/\d{1,3}/g) ?? [];
    if (runs.length !== 1) continue;
    const looksLikeFoot =
      /^[\d\s]+$/.test(latin) ||
      /Unit (One|Two|Three|Four)|First Term|Final Assessment|First Preparatory|Mathematics/.test(tail[i]!);
    if (!looksLikeFoot) continue;
    return Number(runs[0]);
  }
  return null;
}

/**
 * Strips everything but letters and digits (and spells the superscripts the
 * scan mixes in), so OCR spacing cannot break a match.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_EN_P1_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا نواتج تعلم`);
      if (lesson.bookFrom <= unit.bookFrom || lesson.bookFrom > unit.bookTo) {
        problems.push(
          `الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق الوحدة ${unit.bookFrom + 1}–${unit.bookTo}`,
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
  if (first && first.bookFrom !== EGYPT_MATH_EN_P1_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_MATH_EN_P1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_EN_P1_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_MATH_EN_P1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the offset and proves the mapping page by page;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every lesson's own first page prints that lesson's title;
 *  4. every printed page in the book is owned by exactly one lesson — no page
 *     can fall between two lessons and be unreachable.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const ranges = allLessonRanges();
  let footersChecked = 0;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_EN_P1_T1_BOOK_START || book > EGYPT_MATH_EN_P1_T1_BOOK_END) continue;
    printedPages.add(book);
    const text = loadBookPage(book);
    if (!text) {
      if (TEXTLESS_PAGES.has(book)) continue; // full-page figure, nothing to OCR
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    if (!pageHasText(book)) {
      if (TEXTLESS_PAGES.has(book)) continue;
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

  if (printedPages.size !== EGYPT_MATH_EN_P1_T1_BOOK_END - EGYPT_MATH_EN_P1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_MATH_EN_P1_T1_BOOK_START} و${EGYPT_MATH_EN_P1_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title (the English half of our
  // bilingual title).
  EGYPT_MATH_EN_P1_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      const english = lesson.title.split(" — ")[0]!;
      if (!normalize(opener).includes(normalize(english))) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع عنوانه «${english}»`);
      }
    });
  });

  // 4. every printed page is owned by exactly one lesson.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
