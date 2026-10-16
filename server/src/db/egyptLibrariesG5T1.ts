// ---------------------------------------------------------------------------
// Egypt — «المكتبات» — Grade 5, term 1 (the real book).
// ---------------------------------------------------------------------------
// Source: the MoE student book PDF «Libraries_prim5_t1.pdf» — 21 pages, whose
// pages are SPREAD SCANS: page 1 is the cover, every page after it carries a
// two-book-page spread (pp. 2|3, 4|5, … 40|41 — visually confirmed on the
// renders, e.g. pages-003.jpg shows the lesson-1 title page beside the books
// own فهرس). The scans were OCR'd into data/curriculum-ocr/libraries-g5-t1/
// (one pages-NNN.txt per scan); the book's text layer is unusable (InDesign
// ligature transposition), so that corpus is the single source of truth for
// every check here.
//
// PAGE MODEL — a spread scan carries both facing pages, so one scan maps to
// two book pages: printed page p (p ≥ 2) lives on scan ⌊p/2⌋+1, and a scan
// 2 ≤ n ≤ 21 carries book pages {2n−2, 2n−1}. The running foots prove it:
// every folio the OCR can read on a spread — standalone chips like «١٦ ١٧»
// on pages-009.jpg, or numbers riding after «الصف الخامس الابتدائي ١٤» /
// «الفصل الدراسي الأول ١٥» on pages-008.jpg — belongs to that spread's two
// pages, which assertTreeMatchesTheBook() re-checks scan by scan.
//
// The curriculum owns printed pages 5–40: page 5 opens lesson 1 (its head
// shares scan 3 with the فهرس on page 4), and page 40 — the last page of
// lesson 12 — shares scan 21 with its facing half (page 41, beyond BOOK_END).
//
// TREE — taken from the book itself, never invented:
//   * lesson titles are the strings the lesson title pages print («الدرس
//     الأول : في كتب الحقائق العامة» … «الدرس الثاني عشر : سفير المكتبة»);
//   * each lesson's concepts are its printed «الأهداف» bullets, verbatim;
//   * the lessons are numbered continuously «الأول»…«الثاني عشر», and the book
//     has no unit openers — the single container unit is the app's own shell,
//     titled with the book's cover name, so lesson 1 may start ON its first
//     page;
//   * the book's own فهرس pairs every lesson title with its first page (5, 8,
//     11, … 38) — the app's table must agree with it row by row.
//
// Every claim above is re-proved by assertTreeMatchesTheBook() before the
// seeder will touch this book.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** First page the curriculum owns: the lesson-1 title page. */
export const EGYPT_LIBRARIES_G5_T1_BOOK_START = 5;

/** Last page of lesson 12 (its facing half, page 41, lies beyond the book). */
export const EGYPT_LIBRARIES_G5_T1_BOOK_END = 40;

/** The book's own name — what its cover prints; the container unit takes it. */
export const EGYPT_LIBRARIES_G5_T1_SPINE_TITLE = "المكتبات";

/** Number of spread scans the PDF carries (cover + 20 spreads). */
export const EGYPT_LIBRARIES_G5_T1_SCANS = 21;

/**
 * Scan that carries a printed page. The cover is its own scan (1); every page
 * from 2 on shares a spread scan with its facing page.
 */
export function bookToPdfPage(book: number): number {
  if (book <= 1) return 1;
  return Math.floor(book / 2) + 1;
}

/** The two printed pages a non-cover scan carries, or null outside the PDF. */
export function pdfPageToBookPages(pdf: number): { from: number; to: number } | null {
  if (pdf === 1) return { from: 1, to: 1 };
  if (pdf >= 2 && pdf <= EGYPT_LIBRARIES_G5_T1_SCANS) {
    return { from: 2 * pdf - 2, to: 2 * pdf - 1 };
  }
  return null;
}

export interface EgyptLibrariesG5T1Lesson {
  /** Lesson key as the seeder namespaces it: «unit-lesson» in Latin digits. */
  key: string;
  /** Printed ordinal, e.g. «الحادي عشر» — printed sequence, not per-unit. */
  ordinal: string;
  /** Lesson title exactly as the lesson's title page prints it. */
  title: string;
  /** The page that prints this lesson's title and objectives. */
  bookFrom: number;
  /** The lesson's printed «الأهداف» bullets, verbatim. */
  concepts: string[];
}

export interface EgyptLibrariesG5T1Unit {
  /** Unit key as the seeder namespaces it: «1». */
  key: string;
  ordinal: string;
  title: string;
  /** The unit's first page — the first lesson's title page. */
  bookFrom: number;
  bookTo: number;
  lessons: EgyptLibrariesG5T1Lesson[];
}

export const EGYPT_LIBRARIES_G5_T1_UNITS: EgyptLibrariesG5T1Unit[] = [
  {
    key: "1",
    ordinal: "الأولى",
    title: EGYPT_LIBRARIES_G5_T1_SPINE_TITLE,
    bookFrom: 5,
    bookTo: 40,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "في كتب الحقائق العامة",
        bookFrom: 5,
        concepts: [
          "يعرف مفهوم كتب الحقائق العامة .",
          "يستخرج كتب الحقائق العامة من بين ارفف المكتبة بسهولة ويسر .",
          "يعرف ان كتب المسرح والصحافة والمكتبات ودوائر المعارف ضمن كتب الحقائق العامة .",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "كنز الاخلاق",
        bookFrom: 8,
        concepts: [
          "يعرف مفهوم كتب الحقائق والقصص السلوكية .",
          "يستخرج كتب الحقائق السلوكية من بين ارفف المكتبة بسهولة ويسر .",
          "يعرف ان كتب السلوك والافكار ضمن كتب الحقائق والقصص السلوكي.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "حكايات من نور",
        bookFrom: 11,
        concepts: [
          "يعرف مفهوم كتب الحقائق اوالقصص الدينية.",
          "يستخرج كتب الحقائق الدينية من ارفف المكتبة بسهولة ويسر .",
          "يعرف ان كتب الدين والسيرة النبوية ر ضمن كتب الحقائق الدينية .",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "نتعلم عن مجتمعنا",
        bookFrom: 14,
        concepts: [
          "يعرف مفهوم كتب الحقائق اوالقصص الاجتماعي .",
          "يستخرج كتب الحقائق الاجتماعية من بين ارفف المكتبة بسهولة ويسر .",
          "يعرف ان كتب تلوث البيئة و الادمان ضمن كتب الحقائق الاجتماعية .",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "اكتشف اللغات",
        bookFrom: 17,
        concepts: [
          "يعرف مفهوم كتب وقصص اللغات.",
          "يستخرج كتب الحقائق اللغوية من بين ارفف المكتبة بسهولة ويسر .",
          "يعرف ان كتب تعلم اللغات من قواميس ومعاجم ضمن كتب الحقائق.",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "عجائب الحقائق العلمية",
        bookFrom: 20,
        concepts: [
          "يعرف مفهوم كتب وقصص الحقائق العلمية .",
          "يستخرج كتب الحقائق العلمية من بين ارفف المكتبة بسهولة ويسر .",
          "يعرف ان كتب الحقائق العلمية من اسرار الكون والرياضيات ضمن كتب الحقائق.",
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        title: "عالم الاختراعات",
        bookFrom: 23,
        concepts: [
          "يعرف مفهوم كتب وقصص حقائق الاختراعات والصناعات .",
          "يستخرج كتب الحقائق العلمية من بين ارفف المكتبة بسهولة ويسر .",
          "يعرف ان كتب حقائق الاختراعات والصناعات مثل صناعة الدواء والصناعات الحديثة والذكاء الاصطناعي ضمن هذا القسم.",
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        title: "انا فنان",
        bookFrom: 26,
        concepts: [
          "يعرف مفهوم كتب وقصص حقائق الفنون الجميلة .",
          "يستخرج كتب وقصص حقائق الفنون الجميلة من بين ارفف المكتبة بسهولة ويسر .",
          "يعرف ان كتب حقائق الفنون الجميلة مثل الطهي والرسم والموسيقى والالعاب الرياضية ضمن هذا القسم.",
        ],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        title: "عالم القصص",
        bookFrom: 29,
        concepts: [
          "يعرف مفهوم كتب وقصص حقائق الأدبية .",
          "يستخرج كتب وقصص الحقائق الأدبية من بين ارفف المكتبة بسهولة ويسر .",
          "يعرف ان كتب حقائق الأدبية مثل الشعر والمسرحيات والقصص العالمي ضمن هذا القسم.",
        ],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        title: "رحلة عبر الزمان والمكان",
        bookFrom: 32,
        concepts: [
          "يعرف مفهوم كتب وقصص حقائق الجغرافية والأدبية .",
          "يستخرج كتب وقصص الحقائق الجغرافية والأدبية من بين ارفف المكتبة بسهولة ويسر .",
          "يعرف ان كتب الحقائق الجغرافية والتاريخية مثل الخرائط الخاصة بالدول والتاريخ القديم والحديث والسيرة الذاتية ضمن هذا القسم .",
        ],
      },
      {
        key: "1-11",
        ordinal: "الحادي عشر",
        title: "اصدقاء المعرفة",
        bookFrom: 35,
        concepts: [
          "يتعرف على مفهوم اصدقاء المكتبة .",
          "يتعرف على مهام اصدقاء المكتبة .",
          "يتعرف على حقوق وواجبات اصدقاء المكتبة .",
        ],
      },
      {
        key: "1-12",
        ordinal: "الثاني عشر",
        title: "سفير المكتبة",
        bookFrom: 38,
        concepts: [
          "ان يعرف اهمية نشر الثقافة والقراءة بين التلاميذ .",
          "ان يعرض معلومات بشكل شفهي .",
          "ان يلخص معلومات بسيطة من كتاب اوقصة.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the unit's first page (for the first
 * lesson — this book's unit has no opener of its own) or its own title page, up
 * to the page before the next lesson starts, or the unit's last page for its
 * last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_LIBRARIES_G5_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_LIBRARIES_G5_T1_UNITS.forEach((unit, ui) => {
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
  "libraries-g5-t1",
);

/**
 * The OCR provider answers a truly blank page with a sentence instead of an
 * empty string. It means "no text", not content, so verification treats it as
 * missing while `loadBookPage` still returns it verbatim.
 */
const NO_TEXT = "لا يوجد نص";

/** OCR text of one scan, or "" when the scan was not OCR'd. */
function loadScan(pdf: number): string {
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

/**
 * OCR text of one printed book page. A spread scan carries both facing pages,
 * so both of them answer with that scan's text — that is what the student
 * actually sees in the stage image, too.
 */
export function loadBookPage(book: number): string {
  const pdf = bookToPdfPage(book);
  if (pdf < 1 || pdf > EGYPT_LIBRARIES_G5_T1_SCANS) return "";
  return loadScan(pdf);
}

/** True when a content page carries real text (not the blank-page placeholder). */
function pageHasText(book: number): boolean {
  const text = loadBookPage(book);
  return text.length > 0 && !text.includes(NO_TEXT);
}

/**
 * Loads + joins the OCR text of a book-page range into one lesson document.
 * A spread's text is stamped once — under the first of its pages the range
 * owns — so each scanned page contributes its content exactly once even when
 * the range starts or ends mid-spread.
 */
export function loadBookRange(fromBook: number, toBook: number): string {
  const parts: string[] = [];
  let lastPdf = -1;
  for (let book = fromBook; book <= toBook; book++) {
    const pdf = bookToPdfPage(book);
    if (pdf === lastPdf) continue;
    lastPdf = pdf;
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
 * Every number a spread scan prints as a folio: standalone chips («١٦ ١٧») and
 * numbers riding at the end of the running lines («... الصف الخامس الابتدائي
 * ١٤», «... الفصل الدراسي الأول ١٥»). Sorted ascending, deduplicated.
 *
 * The scan shows TWO facing pages, so its candidates must all belong to the two
 * pages pdfPageToBookPages() names — the check reports any intruder instead of
 * guessing which page it numbers.
 */
export function folioCandidates(pdf: number): number[] {
  const text = loadScan(pdf);
  if (!text) return [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const candidates = new Set<number>();
  for (const line of lines) {
    const latin = toLatinDigits(line);
    if (/^\d{1,3}$/.test(latin)) candidates.add(Number(latin));
    const marker = latin.search(/الصف الخامس الابتدائي|الفصل الدراسي (الاول|الأول)/);
    if (marker < 0) continue;
    for (const run of latin.slice(marker).match(/\d{1,3}/g) ?? []) candidates.add(Number(run));
  }
  return [...candidates].filter((n) => n >= 1 && n <= 99).sort((a, b) => a - b);
}

/**
 * The book number a content page prints in its running foot, or null when no
 * single readable folio on its spread names it. The spread must not carry a
 * number outside its own two pages for this to answer at all.
 */
export function printedFooter(book: number): number | null {
  const pdf = bookToPdfPage(book);
  const spread = pdfPageToBookPages(pdf);
  if (!spread) return null;
  const candidates = folioCandidates(pdf);
  if (candidates.some((n) => n !== spread.from && n !== spread.to)) return null;
  return candidates.includes(book) ? book : null;
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
 * the unit, and the unit tiles the book without gaps or overlaps. Unlike the
 * multi-unit books, this book's single container unit has no opener page of
 * its own, so its first lesson may start ON the unit's first page — never
 * before it.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_LIBRARIES_G5_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (lesson.bookFrom < unit.bookFrom || lesson.bookFrom > unit.bookTo) {
        problems.push(
          `الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق الوحدة ${unit.bookFrom}–${unit.bookTo}`,
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
  if (first && first.bookFrom !== EGYPT_LIBRARIES_G5_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_LIBRARIES_G5_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_LIBRARIES_G5_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_LIBRARIES_G5_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every folio readable on a spread scan belongs to that spread's two pages
 *     (a stray number would mean the mapping is wrong);
 *  2. the folios prove the book numbers of the pages that print them;
 *  3. every content page carries real OCR text (not the blank-page placeholder);
 *  4. every lesson's title page prints that lesson's title, and the same page
 *     prints each of the lesson's concepts verbatim — the objectives the app
 *     ships are the book's own words;
 *  5. the book's own فهرس pairs every lesson title with the same first page the
 *     table claims;
 *  6. every printed page in the book is owned by exactly one lesson — no page
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
    const pdf = Number(file.slice(6, 9));
    const spread = pdfPageToBookPages(pdf);
    if (!spread) continue;
    const candidates = folioCandidates(pdf);
    for (const n of candidates) {
      if (n !== spread.from && n !== spread.to) {
        problems.push(`الملزمة ${pdf}: رقم ${n} لا ينتمي إلى صفحتيها ${spread.from}–${spread.to}`);
      }
    }
    for (let book = spread.from; book <= spread.to; book++) {
      if (book < EGYPT_LIBRARIES_G5_T1_BOOK_START || book > EGYPT_LIBRARIES_G5_T1_BOOK_END) continue;
      printedPages.add(book);
      const text = loadBookPage(book);
      if (!text) {
        problems.push(`صفحة الكتاب ${book}: بلا نص OCR (الملزمة ${pdf})`);
        continue;
      }
      if (!pageHasText(book)) {
        problems.push(`صفحة الكتاب ${book}: بلا نص حقيقي (صفحة فارغة أو فشل مسح)`);
        continue;
      }
      if (candidates.includes(book)) footersChecked++;
    }
  }

  if (printedPages.size !== EGYPT_LIBRARIES_G5_T1_BOOK_END - EGYPT_LIBRARIES_G5_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_LIBRARIES_G5_T1_BOOK_START} و${EGYPT_LIBRARIES_G5_T1_BOOK_END}`,
    );
  }
  if (footersChecked < 15) {
    problems.push(`أرقام الفوتر قليلة (${footersChecked}) — المسار أو القاعدة غير صحيحة`);
  }

  // 4. each lesson's title page prints its title and its concepts.
  EGYPT_LIBRARIES_G5_T1_UNITS.forEach((unit) => {
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

  // 5. the book's own فهرس pairs each lesson with its first page.
  const contents = new Map<string, number>();
  const contentsText = loadBookPage(4);
  for (const raw of contentsText.split(/\r?\n/)) {
    const parts = raw.split("|").map((s) => s.trim());
    if (parts.length < 3 || !/^الدرس\s/.test(parts[0]!)) continue;
    const page = Number(toLatinDigits(parts[2]!).replace(/[^\d]/g, ""));
    if (!Number.isFinite(page) || page < 1 || page > 99) continue;
    contents.set(normalize(parts[1]!), page);
  }
  if (contents.size < 12) {
    problems.push(`فهرس الكتاب ناقص: ${contents.size} صفًا (المتوقع ١٢)`);
  }
  EGYPT_LIBRARIES_G5_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const got = contents.get(normalize(lesson.title));
      if (got === undefined) {
        problems.push(`فهرس الكتاب لا يسرد الدرس «${lesson.title}»`);
      } else if (got !== lesson.bookFrom) {
        problems.push(`فهرس الكتاب يضع «${lesson.title}» في الصفحة ${got} بدل ${lesson.bookFrom}`);
      }
    });
  });

  // 6. every printed page is owned by exactly one lesson.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
