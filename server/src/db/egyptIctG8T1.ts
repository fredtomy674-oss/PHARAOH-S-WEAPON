// PHASE G8-ict — official Egypt Preparatory-2 (Grade 8) ICT, first term
// («كتاب الوزارة»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g8-ict` is rebuilt from the Ministry textbook
// `ICT_Arabic_Prp2_T1.pdf` (93 scan pages, all OCR'd). This module is the single
// source of truth for its structure: the two units and their four lessons each,
// exactly as the book's قائمة المحتويات (book page 3) prints them, and the
// lesson objectives («الأهداف») the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage   (offset 0: book page 6 = PDF page 6)
// Every content page prints its own book number in the running foot as a bare
// Arabic-Indic numeral («٦»، «١٢»، «٧٩»), which is what fixes the mapping page
// by page. The book prints no running title with its numerals.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس», NOT A «مفهوم»
// The book's printed index stops at the lesson (two units × four lessons); it
// has no «مفهوم» layer. So the app mirrors the book: unit → lesson. Each
// lesson's RAG document is the whole lesson (its pages, including the «أسئلة
// وتدريبات» exercise block the book places at the end of it).
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND ITS TITLE PAGE
// Unit 1 opens on book page 4 and unit 2 on book page 43, before their first
// lesson's numbered page (6 and 45). Each lesson also prints a one-page opener
// («الدرس الأول: …») on the page before its numbered content — book page 5 for
// lesson 1-1, 22 for 1-2, 29 for 1-3, 36 for 1-4, 44 for 2-1, 58 for 2-2, 67
// for 2-3 and 78 for 2-4. Neither the unit opener nor these lesson front pages
// are separate lessons, so — exactly as the other Ministry books do — the unit
// opener rides with the unit's first lesson and every lesson's numbered pages
// ride with their own lesson. A lesson's `bookFrom` is its numbered first page
// (the page the contents page points at); the range it owns is derived to start
// on the opener (first lesson of a unit) or the lesson's front page, and ends
// on the page before the next lesson's front page.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book page 6 = PDF 6). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_ICT_G8_T1_BOOK_START = 4;

/** Last printed content page — the second page of unit 2 lesson 4 exercises. */
export const EGYPT_ICT_G8_T1_BOOK_END = 93;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface IctG8T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed in the contents page (without the ordinal). */
  title: string;
  /**
   * First *numbered* book page of the lesson — the page the contents page
   * points at. The range the lesson *owns* starts one page earlier (its front
   * page, «الدرس الأول: …») — or on the unit's opener for the unit's first
   * lesson — which is why ownership is derived by `lessonBookRange` rather than
   * stored here.
   */
  bookFrom: number;
  /**
   * The book's printed «الأهداف» for this lesson (the only per-lesson list the
   * book prints; there is no «مفهوم»/«مكوّن» layer in this book).
   */
  concepts: string[];
}

export interface IctG8T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "الوحدة الأولى: الذكاء الاصطناعي وحماية بياناتنا الرقمية". */
  title: string;
  /** First printed book page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed book page of the unit. */
  bookTo: number;
  lessons: IctG8T1Lesson[];
}

/**
 * The two units of the first term with their eight lessons: unit/lesson
 * numbered starts from the book's contents page (3), objectives from each
 * lesson's numbered first page (6, 23, 30, 37 / 45, 59, 68, 79). Verified
 * against every printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_ICT_G8_T1_UNITS: IctG8T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: الذكاء الاصطناعي وحماية بياناتنا الرقمية",
    bookFrom: 4,
    bookTo: 42,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "الأنظمة الذكية وتأثيرها على التغيرات المناخية",
        bookFrom: 6,
        concepts: [
          "أشرح مفهوم الأنظمة الذكية المترابطة (إنترنت الأشياء، الذكاء الاصطناعي والروبوتات)",
          "استنتج تأثير الأنظمة الذكية المترابطة في مواجهة المشكلات البيئية (تلوث الهواء والجفاف...)",
          "اقترح أكبر عدد من الأفكار لتوظيف الأنظمة الذكية للمساعدة في حماية البيئة وتقليل آثار التغيرات المناخية.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "التهديدات السيبرانية المتقدمة",
        bookFrom: 23,
        concepts: [
          "أشرح التهديدات الاحتيالية المتقدمة.",
          "أذكر أكبر عدد من الأفكار لمواجهة التهديدات السيبرانية المتقدمة.",
          "أقترح خطة لمواجهة هجمات الحرمان من الخدمة الموزعة.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "البيانات الضخمة",
        bookFrom: 30,
        concepts: [
          "أشرح خصائص البيانات الضخمة.",
          "أناقش مصادر البيانات الضخمة الآمنة.",
          "أستنتج أنواع البيانات الضخمة.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "البيانات الضخمة وعلاقتها بالذكاء الاصطناعي",
        bookFrom: 37,
        concepts: [
          "أناقش مراحل معالجة البيانات الضخمة.",
          "أشرح استخدامات البيانات الضخمة.",
          "أذكر أكبر عدد من الأمثلة لاعتماد الذكاء الاصطناعي على البيانات الضخمة.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: تصميم وإنشاء مواقع الويب",
    bookFrom: 43,
    bookTo: 93,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "مبادئ تصميم واجهات احترافية شيقة للمواقع الإلكترونية",
        bookFrom: 45,
        concepts: [
          "أشرح بعض المفاهيم المرتبطة بتصميم المواقع (تصميم واجهة المستخدم – تجربة المستخدم).",
          "أذكر أكبر عدد من الأفكار لمواقع ويب ذات تصميم (UI/UX) جيد",
          "أوظف بعض مبادئ UI/UX الأساسية في أنشطة بسيطة داخل الفصل.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "تنسيق صفحات الويب",
        bookFrom: 59,
        concepts: [
          "أناقش تنسيق صفحات الويب (CSS).",
          "أكتب البنية الأساسية ل CSS بشكل صحيح.",
          "أعدد فوائد لغة: CSS",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "مشروعي الرقمي لمدرستي",
        bookFrom: 68,
        concepts: [
          "أشرح فكرة عمل مشروعي الرقمي باستخدام لغة الترميز HTML.",
          "أكتب أكواد مشروعي بشكل صحيح",
          "أصمم صفحة مدرستي بطريقة جذابة.",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "إنشاء موقعك الإلكتروني بمساعدة الذكاء الاصطناعي",
        bookFrom: 79,
        concepts: [
          "أصمم صفحتى على شبكة الإنترنت",
          "أمارس خطوات إنشاء المواقع البسيطة بأداة الذكاء الاصطناعي المجانية.",
          "أطور صفحتى على شبكة الإنترنت.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: its front page («الدرس الأول: …») plus its
 * numbered pages — or, for the unit's first lesson, the unit's opener and down
 * to the page before the next lesson's front page. Every lesson prints its
 * front page on the page before its numbered first page, so the derivation
 * starts there; the unit opener rides with the unit's first lesson; the unit's
 * last lesson owns the unit's closing pages (the «أسئلة وتدريبات» of this book
 * close each lesson, and there is no explicit unit assessment).
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ICT_G8_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom - 1;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 2 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ICT_G8_T1_UNITS.forEach((unit, ui) => {
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
  "ict-p2-t1",
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
 * page prints no number. The foot is a bare Arabic-Indic numeral («٦»، «٧٩»), a
 * line of digits and nothing else. This book prints no running title with its
 * numbers; the unit openers (4, 43) and the lesson front pages (5, 22, 29, 36,
 * 44, 58, 67, 78) print the unit/lesson title instead, and a few content pages
 * print none at all («المحدد», «VV», «مدونة علمية للمشاريع والتجارب»). A line
 * is accepted only when the whole line is a numeral, so a content line that
 * merely ends in a number is not mistaken for the foot.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const tail = lines.slice(-3);
  for (let i = tail.length - 1; i >= 0; i--) {
    const latin = toLatinDigits(tail[i]!);
    if (!/^[\d\s]+$/.test(latin)) continue;
    const runs = latin.match(/\d{1,3}/g) ?? [];
    if (runs.length !== 1) continue;
    return Number(runs[0]);
  }
  return null;
}

/**
 * Strips everything but letters and digits (and unifies the ى/ي the scan mixes
 * in for a purely cosmetic reason), so OCR spacing cannot break a match.
 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[ى]/g, "ي").replace(/[^a-z0-9\u0600-\u06FF]+/g, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ICT_G8_T1_UNITS;

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
      if (li > 0 && from !== lesson.bookFrom - 1) {
        problems.push(`الدرس ${lesson.key}: يجب أن يبدأ نطاقه من صفحته التمهيدية ${lesson.bookFrom - 1}، وجدنا ${from}`);
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
  if (first && first.bookFrom !== EGYPT_ICT_G8_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_ICT_G8_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ICT_G8_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_ICT_G8_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the mapping page by page;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every lesson's numbered first page prints that lesson's title;
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
    if (book < EGYPT_ICT_G8_T1_BOOK_START || book > EGYPT_ICT_G8_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_ICT_G8_T1_BOOK_END - EGYPT_ICT_G8_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ICT_G8_T1_BOOK_START} و${EGYPT_ICT_G8_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's numbered first page prints its title.
  EGYPT_ICT_G8_T1_UNITS.forEach((unit) => {
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

  // 4. every printed page is owned by exactly one lesson.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}