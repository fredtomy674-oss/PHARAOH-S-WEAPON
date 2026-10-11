// PHASE 99 — official Egypt Preparatory-2 (Grade 8) «مهارات الزراعة وريادة
// الأعمال» (Agriculture & Entrepreneurship), first term, Ministry 2026/2027
// edition, Arabic-medium.
//
// The curriculum `eg-g8-agriculture` is rebuilt from the Ministry textbook
// `Agriculture_2_Preparatory_TR1.pdf` (56 scan pages, all OCR'd) under
// server/data/curriculum-ocr/agriculture-p2-t1/. It is the last of the three
// Grade-8 subjects the Prep-1 sweep left out (with «مهارات الصناعة وريادة
// الأعمال» and «المكتبات ومهارات البحث»); the other Prep-2 books were already
// ported (PHASE 97), so this module completes the preparatory stage.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 3   (book page 2 = PDF page 5, book page 52 = PDF page 55)
// Book page 1 is the book's preface («مقدمة الكتاب») and PDF page 56 is the
// printed «قائمة المراجع العلمية», both outside the taught range.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس»
// The contents page lists two fields («مجال»): نباتات الزينة والمشاتل الإنتاجية
// with six numbered Lessons (الأشجار، الشجيرات، نباتات الأسوار (الأسيجة)، أزهار
// القطف، المسطحات الخضراء، اللاندسكيب) and مجال الألبان with three (اللبن
// الزبادي، الزبادي اليوناني، المثلجات اللبنية). Each lesson's opener prints its
// «الأهداف» box («في نهاية الموضوع يكون الطالب قادراً علي أن :»); the app lesson
// is that printed lesson and its concepts are those printed objectives, verbatim.
//
// The tree is verified before seeding: `isConsistent` checks its invariants and
// `assertTreeMatchesTheBook` proves the page mapping page by page from the
// printed footers, checks every lesson opener prints its title, confirms no
// printed page falls outside a lesson, and checks every printed objective really
// appears inside its lesson's pages. Seeding refuses to run on an unverified
// table — «لا نخمن أبدًا».

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.2 = PDF p.5). */
export const BOOK_TO_PDF_OFFSET = 3;

/** First printed page of the book's content — the opener of field 1. */
export const EGYPT_AGRICULTURE_G8_T1_BOOK_START = 2;

/**
 * Last printed content page owned by a lesson — the closing page of «المثلجات
 * اللبنية». The printed «قائمة المراجع العلمية» (book page 53) is back matter,
 * kept outside the lesson ranges as the book prints it.
 */
export const EGYPT_AGRICULTURE_G8_T1_BOOK_END = 52;

/** Back matter that is not taught by any lesson (قائمة المراجع العلمية). */
export const EGYPT_AGRICULTURE_G8_T1_APPENDIX = {
  references: { from: 53, to: 53 },
} as const;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface AgricultureG8T1Lesson {
  /** App-addressable key, e.g. "2-3" (field 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed at the head of the lesson. */
  title: string;
  /**
   * First printed book page of the lesson itself. The range the lesson *owns*
   * also includes its field's opener when it is the field's first lesson, which
   * is why ownership is derived by `lessonBookRange` rather than stored here.
   */
  bookFrom: number;
  /** The book's printed «الأهداف» for this lesson, verbatim. */
  concepts: string[];
}

export interface AgricultureG8T1Unit {
  /** Arabic ordinal used in the field title, e.g. "الثانية". */
  ordinal: string;
  /** Field title as printed at the head of the unit, «الوحدة ن: مجال …». */
  title: string;
  /** First printed page of the field — its opener page. */
  bookFrom: number;
  /** Last printed page of the field (the page before the next field's opener). */
  bookTo: number;
  lessons: AgricultureG8T1Lesson[];
}

/**
 * The two fields of the first term with their nine lessons: field/lesson starts
 * from the book's contents page and each opener's printed footer (2, 3, 9, 14,
 * 19, 24, 29 / 34, 35, 40, 46); objectives from each lesson's opener. Verified
 * against every printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_AGRICULTURE_G8_T1_UNITS: AgricultureG8T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: مجال نباتات الزينة والمشاتل الإنتاجية",
    bookFrom: 2,
    bookTo: 33,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "الأشجار",
        bookFrom: 3,
        concepts: [
          "يتعرف أهمية التشجير في تحسين وتجميل البيئة.",
          "يتعرف طرق إكثار الأشجار.",
          "يتعرف طرق زراعة الأشجار وخدمة ورعاية الأشجار.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "الشجيرات",
        bookFrom: 9,
        concepts: [
          "يتعرف الشجيرات ويفرق بينهما.",
          "يتعرف أهمية الشجيرات في تجميل الحديقة والبيئة.",
          "يتعرف علي أنواع الشجيرات.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "نباتات الأسوار (الأسيجة)",
        bookFrom: 14,
        concepts: [
          "يتعرف نباتات الأسوار (الأسيجة).",
          "يتعرف زراعة ورعاية نباتات الأسوار (الأسيجة).",
          "يشترك في قص وتشكيل نباتات الأسوار (الأسيجة).",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "أزهار القطف",
        bookFrom: 19,
        concepts: [
          "يتعرف علي الأهمية البيئية لأزهار القطف.",
          "يتعرف أزهار القطف والأنواع الصالحة للقطف.",
          "يقوم بزراعة أزهار القطف ورعاية الأزهار بعد القطف.",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "المسطحات الخضراء",
        bookFrom: 24,
        concepts: [
          "يتعرف علي المسطحات الخضراء.",
          "يتعرف أهمية المسطحات الخضراء.",
          "يتعرف أنواع المسطحات الخضراء.",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "اللاندسكيب",
        bookFrom: 29,
        concepts: [
          "يتعرف علي اللاندسكيب.",
          "يتعرف أهمية اللاندسكيب.",
          "يقوم بوضع تصميم لاندسكيب.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: مجال الألبان",
    bookFrom: 34,
    bookTo: 52,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "اللبن الزبادي",
        bookFrom: 35,
        concepts: [
          "يتعرف علي اللبن الزبادي.",
          "يدرك أهمية اللبن الزبادي لصحة الإنسان.",
          "يتعرف علي صناعة الزبادي المدعم بالفواكه.",
          "يتعرف العيوب التي قد تظهر بالزبادي وطرق تلافيها.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "الزبادي اليوناني",
        bookFrom: 40,
        concepts: [
          "يتعرف الزبادي اليوناني.",
          "يتعرف الأنواع الحديثة في صناعة اللبن الزبادي.",
          "يقوم بتصنيع الزبادي اليوناني.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "المثلجات اللبنية",
        bookFrom: 46,
        concepts: [
          "يتعرف علي الأهمية الغذائية للمثلجات اللبنية.",
          "يدرك تقسيم المثلجات اللبنية.",
          "يتعرف علي مكونات المثلجات اللبنية.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: its field's opener when it is the first lesson,
 * otherwise its own first page, up to the page before the next lesson — or the
 * field's last page. This keeps the field opener and each lesson's activity block
 * inside the lesson they belong to, and lands the field assessment on its last
 * lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_AGRICULTURE_G8_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_AGRICULTURE_G8_T1_UNITS.forEach((unit, ui) => {
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
  "agriculture-p2-t1",
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

/** Arabic-Indic digits → Latin. The book prints either range depending on the plate. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/** A footer line that is *only* a page number, optionally wrapped in (…) / {…}. */
function bareNumber(line: string): number | null {
  const m = toLatinDigits(line).trim().match(/^[({[]?\s*(\d{1,3})\s*[)}\]]?$/);
  return m ? Number(m[1]) : null;
}

/**
 * The book number a content page prints in its running foot, or null when the
 * page prints none. Every content page ends with a caption line («مهارات الزراعة
 * وريادة الأعمال - الصف الثاني الإعدادي» / «الفصل الدراسي الأول») beside a
 * standalone number line, which may sit before or after the caption, so the last
 * few lines are walked backwards for a lone number once a caption has been seen.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const tail = lines.slice(Math.max(0, lines.length - 5));
  if (!tail.some((l) => /الفصل الدراسي|مهارات الزراعة|الصف الثاني الإعدادي/.test(l))) return null;
  for (let i = tail.length - 1; i >= 0; i--) {
    const n = bareNumber(tail[i]!);
    if (n !== null) return n;
  }
  return null;
}

/**
 * OCR noise the reading of a footer can slip into (book page → printed number
 * read). Empty for the current corpus; filled from any repeated findings
 * `assertTreeMatchesTheBook` reports while the OCR backfill lands.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * Arabic-folded, punctuation-free text: lets a printed title or objective match
 * across the OCR's inconsistent hamza/ya/ta-marbuta and its optional tashkeel.
 * Mirrors `egyptScienceP1T1.ts` / `egyptScienceT1.ts`.
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
 * Table invariants: lesson keys match their position, every range sits inside
 * its field, fields tile the book without gaps or overlaps, and the content
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_AGRICULTURE_G8_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
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
  if (first && first.bookFrom !== EGYPT_AGRICULTURE_G8_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_AGRICULTURE_G8_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_AGRICULTURE_G8_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_AGRICULTURE_G8_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }
  const { from, to } = EGYPT_AGRICULTURE_G8_T1_APPENDIX.references;
  if (from <= EGYPT_AGRICULTURE_G8_T1_BOOK_END) {
    problems.push(`ملحق المراجع (${from}–${to}) يبدأ داخل نطاق الدروس`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number;
 *  2. every lesson's own first page prints that lesson's title;
 *  3. every printed page is owned by exactly one lesson — no page can fall
 *     between two lessons and be unreachable;
 *  4. every printed objective really appears inside its lesson's pages.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const ranges = allLessonRanges();
  let footersChecked = 0;

  const files = existsSync(OCR_DIR)
    ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort()
    : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_AGRICULTURE_G8_T1_BOOK_START || book > EGYPT_AGRICULTURE_G8_T1_BOOK_END) continue;
    printedPages.add(book);
    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    const footer = printedFooter(book);
    if (footer !== null) {
      footersChecked++;
      const misread = FOOTER_OCR_MISREADS[book];
      if (footer !== book && footer !== misread) {
        problems.push(`صفحة الكتاب ${book}: الفوتر المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_AGRICULTURE_G8_T1_BOOK_END - EGYPT_AGRICULTURE_G8_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_AGRICULTURE_G8_T1_BOOK_START} و${EGYPT_AGRICULTURE_G8_T1_BOOK_END}`,
    );
  }
  if (files.length === 0) problems.push(`لا يوجد نسيج OCR لكتاب الزراعة (${OCR_DIR}) — مطلوب مسح الكتاب أولًا`);
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 2. each lesson's own first page prints its title.
  EGYPT_AGRICULTURE_G8_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      if (!normalize(opener).includes(normalize(lesson.title))) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع عنوانه «${lesson.title}»`);
      }
    });
  });

  // 3. every printed page is owned by exactly one lesson.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  // 4. every printed objective appears inside its lesson's pages.
  EGYPT_AGRICULTURE_G8_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      let text = "";
      for (let book = from; book <= to; book++) text += " " + loadBookPage(book);
      const haystack = normalize(text);
      for (const objective of lesson.concepts) {
        const fingerprint = normalize(objective).slice(0, 15);
        if (fingerprint.length < 8) continue;
        if (!haystack.includes(fingerprint)) {
          problems.push(`الدرس ${lesson.key}: هدفه «${objective}» غير مطبوع في صفحاته ${from}–${to}`);
        }
      }
    });
  });

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
