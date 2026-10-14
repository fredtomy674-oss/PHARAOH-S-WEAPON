// PHASE 60 — official Egypt Grade-6 Social Studies, first term («كتاب الوزارة»).
//
// The curriculum tree for the Egypt `eg-g6-social` curriculum is rebuilt from the
// Ministry textbook `Social_Studies_Primary6_T1.pdf` (2026/2027 MoE edition,
// 114 scanned pages, 104 content pages OCR'd). This module is the single source
// of truth for its structure: the three units and their four lessons each, as
// printed in the book's contents page, with the concepts the book prints for
// every lesson.
//
// Page mapping (verified against the scan's printed footers):
//   pdfPage = bookPage + BOOK_TO_PDF_OFFSET   (book page 8 = PDF page 9)
// Every content page prints its own book number on the last line, which is what
// fixes the offset at 1 and proves the page mapping page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس», NOT A «مفهوم»
// The books already imported (maths, science) print their index down to the
// concept, so their app lessons are concepts. This book's contents page stops at
// the lesson; its concepts are printed one layer deeper, in the «المفاهيم»
// column of the «خريطة المنهج» (book pages 6–7). So the app mirrors all three
// printed layers: unit → lesson → concept. A lesson's RAG document is the whole
// lesson, its concepts are the book's own key-concept list.
//
// THE BOOK LEAVES «المفاهيم» BLANK FOR TWO LESSONS
// The curriculum map prints nothing in that column for unit 2 lesson 4
// («الدولة الإسلامية: الأمويون - العباسيون») and unit 3 lesson 4 («النشاط
// السياحي»), and those two lessons carry no «مفاهيم أتعلمها» box either —
// re-OCR'd at 2600px to be sure. For them the concepts are the same row's
// «المعارف» (the book's own topic list), because inventing concepts would be
// worse than reporting what the book actually prints.
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND UNIT ASSESSMENT
// Each unit opens with a two-page opener (title + «دروس الوحدة», then a full-page
// image) and closes with «تقييم الوحدة» plus «النشاط الختامي للوحدة». Neither is a
// lesson, so — exactly as the maths book does with a unit's trailing pages — the
// opener rides with the unit's first lesson and the assessment with its last. A
// lesson's own `bookFrom` is still stored; the range it owns is derived as "from
// the unit opener (first lesson) down to the page before the next lesson starts,
// bounded by the unit".

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.8 = PDF p.9). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_SOCIAL_T1_BOOK_START = 6;

/**
 * Last printed content page before the colophon (PDF 113) and back cover
 * (PDF 114). The final «مراجعة عامة» runs through it.
 */
export const EGYPT_SOCIAL_T1_BOOK_END = 111;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface SocialT1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed in the contents page (without the ordinal). */
  title: string;
  /**
   * First printed book page of the lesson itself. The range the lesson *owns*
   * also includes its unit's opener when it is the unit's first lesson, which is
   * why ownership is derived by `lessonBookRange` rather than stored here.
   */
  bookFrom: number;
  /** The book's printed concepts for this lesson (see the note above). */
  concepts: string[];
}

export interface SocialT1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Full unit title as printed, e.g. "الوحدة الثانية: …". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: SocialT1Lesson[];
}

/**
 * The three units of the first term with their twelve lessons: unit/lesson
 * starts from the book's contents page, concepts from the «خريطة المنهج»
 * (book pages 6–7). Verified against every printed page by
 * `assertTreeMatchesTheBook`.
 */
export const EGYPT_SOCIAL_T1_UNITS: SocialT1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: وطننا العربي (خصائص وتحديات)",
    bookFrom: 6,
    bookTo: 39,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "وطننا العربي (الموقع - الأهمية)",
        bookFrom: 8,
        concepts: ["الوطن العربي", "الموقع الفلكي"],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "تضاريس وطننا العربي",
        bookFrom: 16,
        concepts: ["التعرية المائية", "التعرية الهوائية", "الأودية الجافة"],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "وطننا العربي (المناخ - النبات الطبيعي)",
        bookFrom: 24,
        concepts: ["المناخ", "النبات الطبيعي", "الإقليم المناخي"],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "التحديات البيئية في وطننا العربي",
        bookFrom: 30,
        concepts: ["الجفاف", "السيول", "التغير المناخي", "التصحر"],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: الدولة الإسلامية من النشأة إلى العالمية",
    bookFrom: 40,
    bookTo: 73,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "شبه الجزيرة العربية (قبل وبعد ظهور الإسلام)",
        bookFrom: 42,
        concepts: ["القبيلة", "النظام القبلي"],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "الهجرة وعالمية الدعوة",
        bookFrom: 50,
        concepts: ["المهاجرون", "الأنصار", "صحيفة المدينة"],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "إنجازات الخلفاء الراشدين (رضي الله عنهم)",
        bookFrom: 56,
        concepts: ["الخلفاء", "المرتدون", "الدواوين"],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "الدولة الإسلامية (الأمويون - العباسيون)",
        bookFrom: 64,
        // The book's «المفاهيم» column is blank for this lesson; these are its
        // printed «المعارف» (see the module note).
        concepts: ["عصر الدولة الأموية", "عصر الدولة العباسية"],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: وطننا العربي والتنمية الاقتصادية",
    bookFrom: 74,
    bookTo: 111,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "النشاط الزراعي في وطننا العربي",
        bookFrom: 76,
        concepts: ["مقومات الزراعة"],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "الثروة الحيوانية والسمكية في وطننا العربي",
        bookFrom: 84,
        concepts: ["المراعي", "المصايد البحرية", "المزارع السمكية"],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "المعادن ومصادر الطاقة في وطننا العربي",
        bookFrom: 92,
        concepts: ["الطاقة المتجددة", "الطاقة غير المتجددة"],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        title: "النشاط السياحي في وطننا العربي",
        bookFrom: 100,
        // «المفاهيم» blank in the book; concepts are its printed «المعارف».
        concepts: ["مقومات السياحة", "أنواع السياحة", "أهمية السياحة", "تنمية السياحة"],
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
 * the unit opener and the unit assessment inside the unit they belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_SOCIAL_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SOCIAL_T1_UNITS.forEach((unit, ui) => {
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
  "social-t1",
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
// PHASE 60 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints on its last line, or null when the last
 * line is not a bare numeral (unit opener pages and full-page image pages print
 * no footer). Re-OCR of the two blank «المفاهيم» cells was done at 2600px; this
 * footer proves the page mapping exactly, page by page, without trusting a title.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  if (!last || last.length > 6 || /\p{L}/u.test(last)) return null;
  const digits = toLatinDigits(last).replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

/** Strips everything but letters and digits, so OCR spacing cannot break a match. */
function normalize(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_SOCIAL_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا مفاهيم`);
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
  if (first && first.bookFrom !== EGYPT_SOCIAL_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_SOCIAL_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SOCIAL_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_SOCIAL_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the offset and proves the mapping page by page;
 *  2. every lesson's own first page prints that lesson's title;
 *  3. every printed page in the book is owned by exactly one lesson — no page
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
    if (book < EGYPT_SOCIAL_T1_BOOK_START || book > EGYPT_SOCIAL_T1_BOOK_END) continue;
    printedPages.add(book);
    const text = loadBookPage(book);
    if (!text) continue;
    const footer = printedFooter(book);
    if (footer !== null) {
      footersChecked++;
      if (footer !== book) {
        problems.push(`صفحة الكتاب ${book}: الفوتر المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_SOCIAL_T1_BOOK_END - EGYPT_SOCIAL_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_SOCIAL_T1_BOOK_START} و${EGYPT_SOCIAL_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 2. each lesson's own first page prints its title.
  EGYPT_SOCIAL_T1_UNITS.forEach((unit) => {
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

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
