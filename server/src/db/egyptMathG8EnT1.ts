// PHASE G8-math-en — official Egypt Preparatory-2 (Grade 8) Mathematics,
// **English-medium** edition («كتاب الوزارة»), first term, Ministry 2026/2027.
//
// The curriculum `eg-g8-math-en` is rebuilt from the Ministry textbook
// `Math_EN_Prp2_T1.pdf` (130 scan pages, all OCR'd). It is the English edition
// of the same book as `egyptMathG8T1.ts` (Arabic medium): it prints the same
// four units, the same seventeen «الدرس», and the same page boundaries, so this
// module mirrors that one unit-by-unit while taking its titles and its OCR
// transcript from the English scan.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 5   (book page 3 = PDF page 8)
// Every content page carries its own number in the running foot — sometimes
// alone («3»), sometimes wrapped with the unit title («114 Unit Four: Statistics
// …»), sometimes with the running title («First Term Lesson One: Real Numbers 7»)
// — which is what fixes the offset at 5 and proves the mapping page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس», NOT A «مفهوم»
// This book's contents page lists «دروس الوحدة»: four units of five, four, six
// and two numbered lessons (1-1 … 4-2), each with its printed «Learning
// Outcomes». The app lesson is that printed lesson, and its concepts are those
// outcomes.
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND ASSESSMENTS
// Each unit opens with a one-page opener (title + «Unit Lessons») and closes
// with «Unit N Assessment»; the book then finishes with «Final Assessment».
// Neither is a lesson, so — as in the other Ministry books — the opener rides
// with the unit's first lesson and the assessment with its last.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.3 = PDF p.8). */
export const BOOK_TO_PDF_OFFSET = 5;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_MATH_G8_EN_T1_BOOK_START = 1;

/** Last printed content page — the closing «Final Assessment» (books 123-125 are back matter). */
export const EGYPT_MATH_G8_EN_T1_BOOK_END = 122;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface MathG8EnT1Lesson {
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

export interface MathG8EnT1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, English then its Arabic counterpart. */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: MathG8EnT1Lesson[];
}

/**
 * The four units of the first term with their seventeen lessons: unit/lesson
 * starts from the book's contents page (iv), outcomes from each lesson's first
 * page (2, 8, 14, 20, 25 / 33, 39, 46, 53 / 62, 70, 78, 83, 89, 97 / 106, 112).
 * Verified against every printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_MATH_G8_EN_T1_UNITS: MathG8EnT1Unit[] = [
  {
    ordinal: "الأولى",
    title: "Unit 1: Numbers and Their Operations — الوحدة الأولى: الأعداد والعمليات عليها",
    bookFrom: 1,
    bookTo: 31,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "Real Numbers — الأعداد الحقيقية",
        bookFrom: 2,
        concepts: [
          "Learn the concept of irrational number.",
          "Estimate the approximate value of irrational number and represent it on a number line.",
          "Learn the set of real numbers.",
          "Arrange a set of real numbers in descending or ascending order.",
          "Solve equations in the set of real numbers.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "Intervals and Their Operations — الفترات والعمليات عليها",
        bookFrom: 8,
        concepts: [
          "Learn the concept of interval as a subset of the set of real numbers.",
          "Represent an interval on the number line.",
          "Perform intersection, union, difference, and complement operations on intervals.",
          "Use the concept of intervals to solve real-life problems.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "Operations on Real Numbers — العمليات على الأعداد الحقيقية",
        bookFrom: 14,
        concepts: [
          "Perform mathematical operations (addition, subtraction, multiplication, and division) on real numbers.",
          "Learn the properties of addition and multiplication of real numbers.",
          "Solve some real-life problems using mathematical operations on real numbers.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "Laws of Square and Cube Roots — قوانين الجذور التربيعية والتكعيبية",
        bookFrom: 20,
        concepts: [
          "Learn the laws of multiplication and division of square roots.",
          "Learn the laws of multiplication and division of cube roots.",
          "Use the laws of square and cube roots to simplify numbers.",
          "Use the laws of roots to solve real-life problems.",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "Laws of Exponents in Real Numbers — قوانين الأسس في الأعداد الحقيقية",
        bookFrom: 25,
        concepts: [
          "Learn repeated multiplication in the set of real numbers.",
          "Learn the laws of exponents in real numbers.",
          "Use the laws of exponents to simplify mathematical expressions.",
          "Use the laws of exponents to solve real-life problems.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "Unit 2: Algebra — الوحدة الثانية: الجبر",
    bookFrom: 32,
    bookTo: 60,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "Factorizing by Taking Out Greatest Common Factor GCF — التحليل بإخراج العامل المشترك الأكبر",
        bookFrom: 33,
        concepts: [
          "Learn the concept of factorization by taking out the greatest common factor.",
          "Factorization a polynomial by taking out the greatest common factor.",
          "Use factorize by taking out the greatest common factor to solve problems.",
          "Solve equations using factorization by taking out the greatest common factor.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "Factorizing Trinomial — تحليل ثلاثية الحدود",
        bookFrom: 39,
        concepts: [
          "Factorize the trinomial in the form: X² + bX + c",
          "Factorize the trinomial in the form: aX² + bX + c (where a ≠ ± 1).",
          "Use factorization to solve quadratic equations.",
          "Use factorization to solve real-life problems.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "Factorizing Special Cases — تحليل الحالات الخاصة",
        bookFrom: 46,
        concepts: [
          "Factorize a trinomial that represents a perfect square.",
          "Factorize the difference between two squares.",
          "Factorize the difference between two cubes.",
          "Factorize the sum of two cubes.",
          "Use factorization to facilitate mathematical operations.",
          "Use factorization to solve some real-life problems.",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "Factorizing by Grouping — التحليل بالتقسيم",
        bookFrom: 53,
        concepts: [
          "Factorize a polynomial by grouping.",
          "Learn how to complete the square.",
          "Use completing the square to factorize and solve equations.",
          "Use factorization by grouping to solve real-life problems.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "Unit 3: Geometry — الوحدة الثالثة: الهندسة",
    bookFrom: 61,
    bookTo: 104,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "Congruence — التطابق",
        bookFrom: 62,
        concepts: [
          "Learn the concept of congruence in plane geometric shapes.",
          "Learn the conditions for two polygons to be congruent.",
          "Learn the cases of two triangles to be congruent.",
          "Use congruence to find the measures of angles and lengths of sides.",
          "Prove the congruence of two triangles.",
          "Use congruence of geometric shapes to solve real-life problems.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "Pythagoras' Theorem and Its Converse — نظرية فيثاغورس وعكسها",
        bookFrom: 70,
        concepts: [
          "Learn the relationship among the lengths of the sides of a right-angled triangle.",
          "Find the length of one of the sides of a right-angled triangle if the length of the hypotenuse and the length of the other side are known.",
          "Find the length of the hypotenuse of a right-angled triangle if the lengths of the other two sides are known.",
          "Prove that a triangle is right-angled if the lengths of its three sides are known.",
          "Determine the type of a triangle according to its angles if the lengths of its sides are known.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "Applications of Parallelism — تطبيقات التوازي",
        bookFrom: 78,
        concepts: [
          "Learn the relationship between the lengths of line segments enclosed between parallel lines.",
          "Use the ray drawn from the midpoint of one side of a triangle parallel to another side.",
          "Learn the midsegment of a triangle.",
          "Learn the relationship between the midsegment of a triangle and its opposite side.",
          "Use parallelism to solve problems in geometry.",
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        title: "Medians of the Triangle — متوسطات المثلث",
        bookFrom: 83,
        concepts: [
          "Learn the concept of the median of a triangle.",
          "Learn the point of intersection of the medians of a triangle.",
          "Learn the relationship between the length of the median drawn from the right vertex and the length of the hypotenuse in a right-angled triangle.",
          "Use the medians of a triangle to solve real-life problems.",
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        title: "Isosceles Triangle — المثلث المتساوى الساقين",
        bookFrom: 89,
        concepts: [
          "Learn the properties of an isosceles triangle.",
          "Learn the properties of an equilateral triangle.",
          "Learn the symmetry in a triangle.",
          "Learn the relationship among the lengths of the sides of a 30°-60°-90° triangle.",
          "Use the properties of isosceles triangles and equilateral triangles to solve real-life problems.",
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        title: "Interior and Exterior Angles of Polygons — الزوايا الداخلة والخارجة للمضلعات",
        bookFrom: 97,
        concepts: [
          "Learn the mathematical formula for calculating the sum of the measures of the interior angles of a convex polygon.",
          "Learn the sum of the measures of the exterior angles of a convex polygon.",
          "Learn the mathematical formula for calculating the measure of an interior angle of a regular polygon.",
          "Learn the mathematical formula for calculating the number of diagonals of a convex polygon.",
        ],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "Unit 4: Statistics — الوحدة الرابعة: الإحصاء",
    bookFrom: 105,
    bookTo: 122,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "Ascending Cumulative Frequency Table and Its Graphical Representation — الجدول التكراري المتجمع الصاعد وتمثيله بيانيًا",
        bookFrom: 106,
        concepts: [
          "Form an ascending cumulative frequency table for a frequency table with intervals.",
          "Draw the ascending cumulative frequency curve.",
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        title: "Measurements of Central Tendency of the Frequency Table with Intervals — مقاييس النزعة المركزية للجدول التكراري ذي المجموعات",
        bookFrom: 112,
        concepts: [
          "Estimate the arithmetic mean of the frequency table with intervals.",
          "Estimate the median of the frequency table with intervals.",
          "Estimate the mode of the frequency table with intervals.",
          "Read and interpret frequency tables and graphs for a given society.",
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
  const unit = EGYPT_MATH_G8_EN_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_G8_EN_T1_UNITS.forEach((unit, ui) => {
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
  "math-en-p2-t1",
);

/**
 * The OCR provider answers a truly blank page with one of these sentences
 * (the wording varies between calls) instead of an empty string. They mean
 * "no text", not content, so verification treats them as missing while
 * `loadBookPage` still returns them verbatim.
 */
const NO_TEXT_MARKERS = ["لا يوجد نص مكتوب في الصورة المرفقة", "لا يوجد نص في الصورة المرفقة", "لا توجد نصوص في الصورة المرفقة"];

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
 * the number sits on one of them — alone («3»), wrapped with the unit title
 * («114 Unit Four: Statistics …»), or wrapped with the running title («First
 * Term Lesson One: Real Numbers 7»); the unit openers print a values banner
 * instead («- Environmental Awareness»), and page 42's scan lost its running
 * foot while page 74's own layout ends on a worked proof with no foot. A line
 * is accepted only when it looks like one of these — a lone numeral or a line
 * carrying «Unit One..Four»/«First Term»/«Final Assessment»/«Second
 * Preparatory»/«Mathematics» — so a content line that merely ends in a number
 * is not mistaken for the foot.
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
      /Unit (One|Two|Three|Four)|First Term|Final Assessment|Second Preparatory|Mathematics/.test(tail[i]!);
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
  const units = EGYPT_MATH_G8_EN_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_MATH_G8_EN_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_MATH_G8_EN_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_G8_EN_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_MATH_G8_EN_T1_BOOK_END}، وجدنا ${last.bookTo}`);
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

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_G8_EN_T1_BOOK_START || book > EGYPT_MATH_G8_EN_T1_BOOK_END) continue;
    printedPages.add(book);
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

  if (printedPages.size !== EGYPT_MATH_G8_EN_T1_BOOK_END - EGYPT_MATH_G8_EN_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_MATH_G8_EN_T1_BOOK_START} و${EGYPT_MATH_G8_EN_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title (the English half of our
  // bilingual title).
  EGYPT_MATH_G8_EN_T1_UNITS.forEach((unit) => {
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