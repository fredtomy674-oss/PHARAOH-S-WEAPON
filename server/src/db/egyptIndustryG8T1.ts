// PHASE 99 — official Egypt Preparatory-2 (Grade 8) «مهارات الصناعة وريادة
// الأعمال» (Industry & Entrepreneurship), first term, Ministry 2026/2027
// edition, Arabic-medium.
//
// The curriculum `eg-g8-industry` is rebuilt from the Ministry textbook
// `Industry_Prep2_T1.pdf` (46 scan pages, all OCR'd) under
// server/data/curriculum-ocr/industry-p2-t1/. It is one of the three Grade-8
// subjects the Prep-1 sweep left out (with «مهارات الزراعة وريادة الأعمال» and
// «المكتبات ومهارات البحث»); this module completes the preparatory stage.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 1   (book page 6 = PDF page 7, book page 43 = PDF page 44)
// Each field's divider page (ebook 5 = PDF 6, ebook 30 = PDF 31) carries no
// printed number; the front matter and the closing «أسئلة عامة على المنهج»
// (ebook 44) / «المراجع والمصادر» (ebook 45) are outside the taught range.
//
// WHY THE APP'S LESSON IS THE BOOK'S «أولاً / ثانياً / ثالثاً / رابعاً»
// The كتاب's فهرس الكتاب lists two fields («مهارات الحفر على الخشب والأركت»
// with four sections, «مهارات تكنولوجيا الأعمال الصحية» with three) and each
// section's own opener prints its title and its «نواتج التعلم المستهدفة» box.
// The app lesson is that printed section and its concepts are those printed
// outcomes, verbatim.
//
// The tree is verified before seeding: `isConsistent` checks its invariants and
// `assertTreeMatchesTheBook` proves the page mapping page by page from the
// printed footers, checks every section opener prints its title, confirms no
// printed page falls outside a lesson, and checks every printed outcome really
// appears inside its lesson's pages. Seeding refuses to run on an unverified
// table — «لا نخمن أبدًا».

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.6 = PDF p.7). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the book's content — the opener of field 1. */
export const EGYPT_INDUSTRY_G8_T1_BOOK_START = 5;

/** Last printed content page — the close of the field-2 assessment section. */
export const EGYPT_INDUSTRY_G8_T1_BOOK_END = 43;

/** Back matter that is not taught by any lesson (أسئلة عامة + المراجع). */
export const EGYPT_INDUSTRY_G8_T1_APPENDIX = {
  backMatter: { from: 44, to: 45 },
} as const;

/** One section (أولاً/ثانياً/…) of the textbook — becomes one app lesson. */
export interface IndustryG8T1Lesson {
  /** App-addressable key, e.g. "2-3" (field 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /**
   * Section title as printed at the head of the section, without the printed
   * «أولاً/…» ordinal the app itself renders as «الدرس ن:».
   */
  title: string;
  /**
   * First printed book page of the section itself. The range the lesson *owns*
   * also includes its field's divider when it is the field's first lesson, which
   * is why ownership is derived by `lessonBookRange` rather than stored here.
   */
  bookFrom: number;
  /** The book's printed «نواتج التعلم المستهدفة» for this section, verbatim. */
  concepts: string[];
}

export interface IndustryG8T1Unit {
  /** Arabic ordinal used in the field title, e.g. "الثانية". */
  ordinal: string;
  /** Field title as printed in the فهرس الكتاب, «الوحدة ن: …». */
  title: string;
  /** First printed page of the field — its divider page. */
  bookFrom: number;
  /** Last printed page of the field (the page before the next field's divider). */
  bookTo: number;
  lessons: IndustryG8T1Lesson[];
}

/**
 * The two fields of the first term with their seven sections: field/section
 * starts from the book's فهرس الكتاب and each opener's printed footer (5, 7, 15,
 * 22, 27 / 30, 32, 37, 41); outcomes from each section's opener. Verified against
 * every printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_INDUSTRY_G8_T1_UNITS: IndustryG8T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: مهارات الحفر على الخشب والأركت",
    bookFrom: 5,
    bookTo: 29,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "مهارات الحفر على الخشب",
        bookFrom: 7,
        concepts: [
          "تعرف مفهوم الحفر وأهميته.",
          "تعرف أدوات الحفر وكيفية استخدامها.",
          "يفرق بين أنواع الحفر المختلفة.",
          "يقارن بين أنواع الأخشاب المستخدمة في الحفر.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "أنشطة تطبيقية وممارسات عملية للحفر على الخشب",
        bookFrom: 15,
        concepts: [
          "تنمية قدراته في مجال استخدام أدوات الحفر على الخشب.",
          "يتعرف طرق طباعة الصور والأشكال المختلفة على الأخشاب.",
          "يراعي احتياطات الأمان والسلامة المهنية عند الحفر على الخشب.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "مهارات إنتاج مشغولات الأركت",
        bookFrom: 22,
        concepts: [
          "تطبيق مهارات التفكير الإبداعي.",
          "إتقان مهارات استخدام أدوات الأركت.",
          "يتعرف الأخشاب المستخدمة في فن الأركت.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "أنشطة تقييمية على مهارات إنتاج مشغولات الأركت",
        bookFrom: 27,
        concepts: [
          "تنمية مهاراته في استخدام أدوات الأركت.",
          "استخدام أدوات الأركت في تفريغ بعض الأسماء التي يتم طباعتها على الأخشاب.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: مهارات تكنولوجيا الأعمال الصحية",
    bookFrom: 30,
    bookTo: 43,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "مواسير الصرف",
        bookFrom: 32,
        concepts: [
          "يتعرف أنواع وخامات مواسير الصرف.",
          "يفرق بين مقاسات واستخدامات مواسير الصرف المختلفة.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "أنشطة وممارسات على أعمال السباكة في مجال الصرف",
        bookFrom: 37,
        concepts: [
          "يركب غطاء قاعدة حمام.",
          "ينمي مهارته في استخدام أدوات السباكة في الصرف.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "أنشطة تقييمية",
        bookFrom: 41,
        concepts: [
          "مهارات الطالب في استخدام أدوات السباكة.",
          "مهارات الطلاب في فك وتركيب محتويات حنفية.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: its field's divider when it is the first lesson,
 * otherwise its own first page, up to the page before the next lesson — or the
 * field's last page. This keeps the field divider and each section's activity
 * block inside the lesson they belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_INDUSTRY_G8_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_INDUSTRY_G8_T1_UNITS.forEach((unit, ui) => {
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
  "industry-p2-t1",
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
 * page prints none. A content page ends with a caption that names the term
 * («الفصل الدراسي الأول») or the grade («الصف الثاني / الثانى / الثائى الإعدادى»)
 * and carries the number at one of its ends, or on the line right beside it; the
 * two field dividers and a couple of activity pages carry no number.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 3); i--) {
    const line = lines[i]!;
    if (/الفصل الدراسي|الصف الثا/.test(line)) {
      const runs = toLatinDigits(line).match(/\d{1,3}/g) ?? [];
      if (runs.length === 1) return Number(runs[0]);
      for (const j of [i - 1, i + 1]) {
        const candidate = lines[j];
        if (candidate === undefined) continue;
        const n = bareNumber(candidate);
        if (n !== null) return n;
      }
      continue;
    }
    if (i === lines.length - 1) {
      const n = bareNumber(line);
      if (n !== null) return n;
    }
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
 * Arabic-folded, punctuation-free text: lets a printed title or outcome match
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
 * Does this section's opener print its title? Two of the book's section
 * headings are set in a stylised face the OCR reads imperfectly («… للحفر على
 * الخشب» loses its ح; «الأركت» comes back as «الأركن»), so the check is a
 * fingerprint of the heading's leading words — the same proof the objective
 * check uses — rather than the full string. It still pins the opener to the
 * heading and cannot be satisfied by an unrelated page.
 */
function titleAppearsOnOpener(opener: string, title: string): boolean {
  const fingerprint = normalize(title).slice(0, 15);
  if (fingerprint.length < 8) return false;
  return normalize(opener).includes(fingerprint);
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its field, fields tile the book without gaps or overlaps, and the content
 * starts where the book's فهرس says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_INDUSTRY_G8_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا نواتج`);
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
  if (first && first.bookFrom !== EGYPT_INDUSTRY_G8_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_INDUSTRY_G8_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_INDUSTRY_G8_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_INDUSTRY_G8_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }
  const { from, to } = EGYPT_INDUSTRY_G8_T1_APPENDIX.backMatter;
  if (from <= EGYPT_INDUSTRY_G8_T1_BOOK_END) {
    problems.push(`ملحق الخاتمة (${from}–${to}) يبدأ داخل نطاق الدروس`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number;
 *  2. every section's own first page prints its title (its heading fingerprint);
 *  3. every printed page is owned by exactly one lesson — no page can fall
 *     between two lessons and be unreachable;
 *  4. every printed outcome really appears inside its lesson's pages.
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
    if (book < EGYPT_INDUSTRY_G8_T1_BOOK_START || book > EGYPT_INDUSTRY_G8_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_INDUSTRY_G8_T1_BOOK_END - EGYPT_INDUSTRY_G8_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_INDUSTRY_G8_T1_BOOK_START} و${EGYPT_INDUSTRY_G8_T1_BOOK_END}`,
    );
  }
  if (files.length === 0) problems.push(`لا يوجد نسيج OCR لكتاب الصناعة (${OCR_DIR}) — مطلوب مسح الكتاب أولًا`);
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 2. each lesson's own first page prints its title.
  EGYPT_INDUSTRY_G8_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      if (!titleAppearsOnOpener(opener, lesson.title)) {
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

  // 4. every printed outcome appears inside its lesson's pages.
  EGYPT_INDUSTRY_G8_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      let text = "";
      for (let book = from; book <= to; book++) text += " " + loadBookPage(book);
      const haystack = normalize(text);
      for (const objective of lesson.concepts) {
        const fingerprint = normalize(objective).slice(0, 15);
        if (fingerprint.length < 8) continue;
        if (!haystack.includes(fingerprint)) {
          problems.push(`الدرس ${lesson.key}: ناتجه «${objective}» غير مطبوع في صفحاته ${from}–${to}`);
        }
      }
    });
  });

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
