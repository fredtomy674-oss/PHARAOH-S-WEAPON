// PHASE G8-ict-en — official Egypt Preparatory-2 (Grade 8) ICT (English-medium
// edition), first term («كتاب الوزارة»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g8-ict-en` is rebuilt from the English-medium Ministry
// textbook `ICT_English_Prp2_T1.pdf` (89 scan pages, all OCR'd). This module is
// the single source of truth for its structure: the two units and their four
// lessons each, exactly as the book's Contents (book page 3) prints them, and
// the lesson objectives («Objectives») the book prints at the head of every
// lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage   (offset 0: book page 6 = PDF page 6)
// Every content page prints its own book number in the running foot as a bare
// numeral («6», «22», «79»), which is what fixes the mapping page by page. The
// book prints no running title with its numerals.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس», NOT A «مفهوم»
// The book's printed index stops at the lesson (two units × four lessons); it
// has no «مفهوم» layer. So the app mirrors the book: unit → lesson. Each
// lesson's RAG document is the whole lesson (its pages, including the «Learn
// by doing» exercise block the book places at the end of it).
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND ITS FRONT PAGE
// Unit 1 opens on book page 4 and unit 2 on book page 40, before their first
// lesson's numbered page (6 and 42). Each lesson also prints a one-page front
// («Lesson 1 …») on the page before its numbered content — book page 5 for
// lesson 1-1, 21 for 1-2, 28 for 1-3, 34 for 1-4, 41 for 2-1, 55 for 2-2, 63
// for 2-3 and 73 for 2-4. Neither the unit opener nor these lesson front pages
// are separate lessons, so — exactly as the other Ministry books do — the unit
// opener rides with the unit's first lesson and every lesson's numbered pages
// ride with their own lesson. A lesson's `bookFrom` is its numbered first page
// (lesson 2-4 prints its numbered content from page 74 — the Contents page
// points at its front page 73 instead); the range it owns is derived to start
// on the opener (first lesson of a unit) or the lesson's front page, and ends
// on the page before the next lesson's front page.
//
// TITLES ARE BILINGUAL
// The English edition prints the same 8 lessons as the Arabic book, so each
// lesson (and unit) title joins the printed English with its Arabic
// counterpart («Lesson … — الدرس …»). The book-verification reads the English
// half; the app lesson title reads «الدرس الأول: <English — Arabic>».

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book page 6 = PDF 6). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_ICT_G8_EN_T1_BOOK_START = 4;

/** Last printed content page — the last page of unit 2 lesson 4. */
export const EGYPT_ICT_G8_EN_T1_BOOK_END = 89;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface IctG8EnT1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /**
   * Lesson title as printed — bilingual «English — Arabic» (the English half
   * is the title the book prints at the head of the lesson).
   */
  title: string;
  /**
   * First *numbered* book page of the lesson. The range the lesson *owns*
   * starts one page earlier (its front page, «Lesson N: …») — or on the unit's
   * opener for the unit's first lesson — which is why ownership is derived by
   * `lessonBookRange` rather than stored here.
   */
  bookFrom: number;
  /**
   * The book's printed «Objectives» for this lesson (the only per-lesson list
   * the book prints; there is no «مفهوم»/«مكوّن» layer in this book).
   */
  concepts: string[];
}

export interface IctG8EnT1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed — bilingual «English — Arabic». */
  title: string;
  /** First printed book page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed book page of the unit. */
  bookTo: number;
  lessons: IctG8EnT1Lesson[];
}

/**
 * The two units of the first term with their eight lessons: unit/lesson
 * numbered starts from the book's Contents (3), objectives from each lesson's
 * numbered first page (6, 22, 29, 35 / 42, 56, 64, 74). Verified against every
 * printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_ICT_G8_EN_T1_UNITS: IctG8EnT1Unit[] = [
  {
    ordinal: "الأولى",
    title: "Unit One: Artificial Intelligence and Protecting Our Digital Data — الوحدة الأولى: الذكاء الاصطناعي وحماية بياناتنا الرقمية",
    bookFrom: 4,
    bookTo: 39,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "Intelligent Systems and Their Impact on Climate Change — الأنظمة الذكية وتأثيرها على التغيرات المناخية",
        bookFrom: 6,
        concepts: [
          "Explain the concept of intelligent interconnected systems (the Internet of Things, artificial intelligence, and robotics).",
          "Conclude the impact of intelligent interconnected systems on facing environmental problems (air pollution and drought).",
          "Suggest as many ideas as possible for employing intelligent systems to help protect the environment and reduce the effects of climate change.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "Advanced Cyber Threats — التهديدات السيبرانية المتقدمة",
        bookFrom: 22,
        concepts: [
          "Explain advanced fraudulent threats.",
          "Mention several ideas for countering advanced cyber threats.",
          "Propose a plan to counter distributed denial-of-service attacks.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "Big Data — البيانات الضخمة",
        bookFrom: 29,
        concepts: [
          "Explain the characteristics of big data.",
          "Discuss secure big data sources.",
          "Infer the types of big data.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "Big Data and Its Relationship to Artificial Intelligence — البيانات الضخمة وعلاقتها بالذكاء الاصطناعي",
        bookFrom: 35,
        concepts: [
          "Discuss the stages of big data processing.",
          "Explain the uses of big data.",
          "Cite as many examples as possible of how artificial intelligence relies on big data.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "Unit Two: Website Design and Creation — الوحدة الثانية: تصميم وإنشاء مواقع الويب",
    bookFrom: 40,
    bookTo: 89,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "Principles of Designing Attractive, Professional Website Interfaces — مبادئ تصميم واجهات احترافية شيقة للمواقع الإلكترونية",
        bookFrom: 42,
        concepts: [
          "Explain some concepts related to website design (user interface design - user experience).",
          "List as many ideas as possible for websites with good UX/UI design.",
          "Employ some basic UX/UI principles in simple classroom activities.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "Web page Format — تنسيق صفحات الويب",
        bookFrom: 56,
        concepts: [
          "Discuss web page layout (CSS).",
          "Write the basic structure of CSS correctly.",
          "List the benefits of the CSS language:",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "My Digital Project for My School — مشروعي الرقمي لمدرستي",
        bookFrom: 64,
        concepts: [
          "Explain the concept of my digital project using HTML.",
          "Write my project code correctly.",
          "Design my school's page in an attractive way.",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "Create your website with the help of Artificial Intelligence — إنشاء موقعك الإلكتروني بمساعدة الذكاء الاصطناعي",
        bookFrom: 74,
        concepts: [
          "Design my website.",
          "Practice the steps of creating simple websites using a free artificial intelligence tool.",
          "Develop my website.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: its front page («Lesson N: …») plus its
 * numbered pages — or, for the unit's first lesson, the unit's opener and down
 * to the page before the next lesson's front page. Every lesson prints its
 * front page on the page before its numbered first page, so the derivation
 * starts there; the unit opener rides with the unit's first lesson; the unit's
 * last lesson owns the unit's closing pages (the «Learn by doing» of this book
 * close each lesson, and there is no explicit unit assessment).
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ICT_G8_EN_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom - 1;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 2 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ICT_G8_EN_T1_UNITS.forEach((unit, ui) => {
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
  "ict-en-p2-t1",
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

/**
 * Strips everything but letters and digits (and unifies the ى/ي the scan mixes
 * in for a purely cosmetic reason), so OCR spacing cannot break a match.
 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[ى]/g, "ي").replace(/[^a-z0-9\u0600-\u06FF]+/g, "");
}

/**
 * The book number a content page prints in its running foot, or null when the
 * page prints no number. The foot is a bare numeral («6», «22», «79»), a line
 * of digits and nothing else. This book prints no running title with its
 * numbers; the unit openers (4, 40) and the lesson front pages (5, 21, 28, 34,
 * 41, 55, 63, 73) print the unit/lesson title instead. A line is accepted only
 * when the whole line is a numeral, so a content line that merely ends in a
 * number is not mistaken for the foot.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const tail = lines.slice(-3);
  for (let i = tail.length - 1; i >= 0; i--) {
    if (!/^[\d\s]+$/.test(tail[i]!)) continue;
    const runs = tail[i]!.match(/\d{1,3}/g) ?? [];
    if (runs.length !== 1) continue;
    return Number(runs[0]);
  }
  return null;
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the Contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ICT_G8_EN_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_ICT_G8_EN_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_ICT_G8_EN_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ICT_G8_EN_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_ICT_G8_EN_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the mapping page by page;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every lesson's numbered first page prints that lesson's English title;
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
    if (book < EGYPT_ICT_G8_EN_T1_BOOK_START || book > EGYPT_ICT_G8_EN_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_ICT_G8_EN_T1_BOOK_END - EGYPT_ICT_G8_EN_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ICT_G8_EN_T1_BOOK_START} و${EGYPT_ICT_G8_EN_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's numbered first page prints its (English) title.
  EGYPT_ICT_G8_EN_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const english = lesson.title.split(" — ")[0]!;
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
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