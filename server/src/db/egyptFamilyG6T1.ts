// ---------------------------------------------------------------------------
// Egypt — «مهارات إدارة الأسرة» — Grade 6, term 1.
// ---------------------------------------------------------------------------
// Source: the MoE student book PDF «Family_management_Prim6_TR1.pdf» — 52
// pages, downloaded from studentbooks.moe.gov.eg and rendered + OCR'd into
// data/curriculum-ocr/family-g6-t1/ (one pages-NNN.txt per PDF page). The
// book's text layer is unusable (InDesign ligature transposition), so the OCR
// corpus is the single source of truth for every check here.
//
// PAGE MODEL — this book maps to its scans piecewise, exactly like the same
// series' Grade-5 book:
//   * PDF pages 1–23 print folios 1–23 (offset 0): the unit-1 opener is page 5
//     (no folio, as openers never print one) and lesson 1-1's title page is
//     page 6; page 7's chip is printed as «V» (for ٧) — the same OCR misread
//     the Grade-4 and Grade-5 books of this series needed folded;
//   * printed page 24 is the blank leaf that precedes the unit-2 opener — the
//     MoE PDF never carried it (MISSING_PRINT_PAGES). So PDF 24 is the unit-2
//     opener (no folio printed at all) and every PDF page after it shifts by
//     one: PDF 25 opens lesson 2-1 on folio 26;
//   * the book's own contents page agrees where a check is possible: it pairs
//     lessons 1-1…2-3 with pages 6, 10, 16, 26, 32, 38 — the exact pages this
//     table claims — المراجع with 44 (PDF 43) and إرشادات فنية/تدريسية with
//     45/50 (PDF 44/49). Its two unit rows are typeset from an earlier draft
//     (the unit-2 row opens at 26, one page after the real opener 25, and the
//     الدامج row lands on 52 while the page prints 53), so the folios the
//     pages themselves carry win, as always;
//   * the unit-2 opener keeps unit 1's title wordmark — it really prints
//     «الوحدة الثانية / بيئتي مسئوليتي», a MoE production error (the book's
//     TOC and every unit-2 running head print «تراث مجتمعنا», the name this
//     table uses);
//   * the curriculum owns printed pages 5–43; pages 44–53 are back matter
//     (المراجع + إرشادات مهنية).
//
// Every claim above is re-proved by assertTreeMatchesTheBook() before the
// seeder will touch this book.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** First page the curriculum owns: the unit-1 opener. */
export const EGYPT_FAMILY_G6_T1_BOOK_START = 5;

/** Last page of the last lesson (printed 44–53 are back matter). */
export const EGYPT_FAMILY_G6_T1_BOOK_END = 43;

/** المراجع + إرشادات مهنية — printed pages the book continues with after BOOK_END. */
export const EGYPT_FAMILY_G6_T1_BACK_MATTER = { from: 44, to: 53 } as const;

/**
 * Printed page with no scan in the MoE PDF: the blank leaf 24 that precedes the
 * unit-2 opener (see the page-model note above). Its scan is simply absent.
 */
export const EGYPT_FAMILY_G6_T1_MISSING_PRINT_PAGES = [24] as const;

/** Scan number that can never exist, for the printed page the PDF lacks. */
const NO_SCAN = 1000;

/**
 * Scan page that carries a printed page. Piecewise because the printed folios
 * skip 24 (see above); the missing page maps past the end of the PDF so
 * `pageImagePath` reports "no image" instead of a neighbouring scan.
 */
export function bookToPdfPage(book: number): number {
  if ((EGYPT_FAMILY_G6_T1_MISSING_PRINT_PAGES as readonly number[]).includes(book)) return book + NO_SCAN;
  if (book <= 23) return book;
  return book - 1;
}

/** Printed page a scan carries, or null when the scan is not a book content page. */
export function pdfPageToBookPage(pdf: number): number | null {
  if (pdf >= 1 && pdf <= 23) return pdf;
  if (pdf >= 24 && pdf <= 52) return pdf + 1;
  return null;
}

export interface EgyptFamilyG6T1Lesson {
  /** Lesson key as the seeder namespaces it: «unit-lesson» — per-unit numbering. */
  key: string;
  /** Printed ordinal within its unit, e.g. «الأول» (the book restarts per unit). */
  ordinal: string;
  /** Lesson title exactly as the lesson's title page prints it. */
  title: string;
  /** The page that prints this lesson's title and objectives. */
  bookFrom: number;
  /** The lesson's printed «أهداف الدرس» bullets, verbatim. */
  concepts: string[];
}

export interface EgyptFamilyG6T1Unit {
  /** Unit key as the seeder namespaces it: «1»… */
  key: string;
  ordinal: string;
  title: string;
  /** The unit's opener page — where the unit opens in the book. */
  bookFrom: number;
  bookTo: number;
  lessons: EgyptFamilyG6T1Lesson[];
}

export const EGYPT_FAMILY_G6_T1_UNITS: EgyptFamilyG6T1Unit[] = [
  {
    key: "1",
    ordinal: "الأولى",
    title: "بيئتي مسئوليتي",
    bookFrom: 5,
    bookTo: 24,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "التوفير",
        bookFrom: 6,
        concepts: [
          "يعدد أهمية التوفير وترشيد الاستهلاك.",
          "يحقق التوفير من خلال إعادة الاستخدام مع مراعاة احتياطات السلامة والأمان.",
          "يحرص إعادة الاستخدام للأشياء التي يمكنه إصلاحها.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "في مطبخي",
        bookFrom: 10,
        concepts: [
          "يحدد بعض أغذية مجموعة الوقاية وفوائدها.",
          "ينفذ أفكاراً لمطبخ بلا نفايات للمحافظة على الموارد.",
          "يعزز أهمية الاستثمار الأخضر لحماية البيئة من التلوث.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "أنا مسئول",
        bookFrom: 16,
        concepts: [
          "يوضح بعض الإرشادات للحفاظ على سلامتنا عند استخدام الأدوات والأجهزة المنزلية في المطبخ.",
          "يطبق قواعد الأمن والسلامة أثناء القيام بالأعمال المنزلية.",
          "يحرص اتباع قواعد الأمن والسلامة في تعاملاته.",
        ],
      },
    ],
  },
  {
    key: "2",
    ordinal: "الثانية",
    title: "تراث مجتمعنا",
    bookFrom: 25,
    bookTo: 43,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "عاداتي وتقاليدي",
        bookFrom: 26,
        concepts: [
          "يشرح مفهوم العادات والتقاليد، وأهميتها لترابط المجتمع.",
          "ينفذ تابلوه بالأبليك يعبر عن الموروثات الثقافية.",
          "يعزز قيم الولاء والانتماء من خلال تمسكه بعاداته وتقاليده.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "استثمر وقتك",
        bookFrom: 32,
        concepts: [
          "يحدد معنى إدارة الوقت.",
          "يصف كيف يمكنه إدارة وقته بكفاءة.",
          "يمارس مهارات إدارة الوقت أثناء القيام بمهمة ما.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "الرائد الصغير",
        bookFrom: 38,
        concepts: [
          "يشرح مفهوم المهارات الشخصية والمهارات الفنية لإدارة مهاراته.",
          "يحدد أهمية إدارة المهارات لتحقيق النجاح.",
          "يقدر أهمية تنمية المهارات لمستقبل أفضل.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the unit's opener page (for the first
 * lesson) or its own title page, up to the page before the next lesson starts,
 * or the unit's last page for its last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_FAMILY_G6_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_FAMILY_G6_T1_UNITS.forEach((unit, ui) => {
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
  "family-g6-t1",
);

/**
 * The OCR provider answers a truly blank page with a sentence instead of an
 * empty string. It means "no text", not content, so verification treats it as
 * missing while `loadBookPage` still returns it verbatim.
 */
const NO_TEXT = "لا يوجد نص";

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  const pdf = bookToPdfPage(book);
  if (pdf > 999) return "";
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
  return text.length > 0 && !text.includes(NO_TEXT);
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

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    // The scanner also emits the extended (Persian) digit forms for some chips.
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/**
 * The book number a content page prints in its foot, or null when no single
 * number can be read — unit openers print none, and an ambiguous line is safer
 * left unchecked.
 *
 * The OCR model misread one chip in this book exactly as it did in the same
 * series' Grade-4 and Grade-5 books: page 7's chip as «V» (for ٧). Only that
 * known reading (and the bare «ه» the series' books occasionally print for ٥)
 * is folded; anything else must match the book number.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const candidates = new Set<number>();
  for (const line of lines) {
    const latin = toLatinDigits(line);
    if (/^\d{1,3}$/.test(latin)) candidates.add(Number(latin));
    if (/^[هVv]$/.test(line)) {
      candidates.add(/ه/.test(line) ? 5 : 7);
      continue;
    }
    const footerish = /الصف السادس|الفصل الدراس/.test(line);
    if (!footerish) continue;
    if (/(^|[\s|])[هVv]([\s|]|$)/.test(line)) candidates.add(/ه/.test(line) ? 5 : 7);
    for (const run of latin.match(/\d{1,3}/g) ?? []) candidates.add(Number(run));
  }
  const values = [...candidates].filter((n) => n >= 1 && n <= 99);
  return values.length === 1 ? values[0]! : null;
}

/** Strips everything but letters and digits, so OCR spacing cannot break a match. */
function normalize(text: string): string {
  return text
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first/last
 * units hit the book's own bounds (the back matter lies beyond BOOK_END). A
 * content mistake here would quietly ground the tutor on the wrong pages, so
 * it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_FAMILY_G6_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_FAMILY_G6_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_FAMILY_G6_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_FAMILY_G6_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_FAMILY_G6_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed folio of every content page proves its book number — with
 *     the piecewise mapping above, this is what pins the folio skip down;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every lesson's title page prints that lesson's title;
 *  4. the same page prints each of the lesson's concepts verbatim — the
 *     objectives the app ships are the book's own words;
 *  5. every printed page in the book is owned by exactly one lesson, and the
 *     printed page the PDF lacks is owned too — no page can fall between two
 *     lessons and be unreachable.
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
    const pdf = Number(file.slice(6, 9));
    const book = pdfPageToBookPage(pdf);
    if (book === null || book < EGYPT_FAMILY_G6_T1_BOOK_START || book > EGYPT_FAMILY_G6_T1_BOOK_END) continue;
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

  const expectedPages =
    EGYPT_FAMILY_G6_T1_BOOK_END -
    EGYPT_FAMILY_G6_T1_BOOK_START +
    1 -
    EGYPT_FAMILY_G6_T1_MISSING_PRINT_PAGES.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_FAMILY_G6_T1_BOOK_START} و${EGYPT_FAMILY_G6_T1_BOOK_END} (المتوقع ${expectedPages})`,
    );
  }
  if (footersChecked < 32) {
    problems.push(`أرقام الفوتر قليلة (${footersChecked}) — المسار أو القاعدة غير صحيحة`);
  }

  // 3 + 4. each lesson's title page prints its title and its concepts.
  EGYPT_FAMILY_G6_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحة عنوانه ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      const flat = normalize(opener);
      if (!flat.includes(normalize(lesson.title))) {
        problems.push(`الدرس ${lesson.key}: صفحة عنوانه ${lesson.bookFrom} لا تطبع عنوانه «${lesson.title}»`);
      }
      for (const concept of lesson.concepts) {
        if (!flat.includes(normalize(concept))) {
          problems.push(`الدرس ${lesson.key}: هدف «${concept}» غير مطبوع في صفحة العنوان ${lesson.bookFrom}`);
        }
      }
    });
  });

  // 5. every printed page — including the one the PDF lacks — is owned by
  // exactly one lesson.
  const owned = [...printedPages, ...EGYPT_FAMILY_G6_T1_MISSING_PRINT_PAGES];
  for (const book of owned) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
