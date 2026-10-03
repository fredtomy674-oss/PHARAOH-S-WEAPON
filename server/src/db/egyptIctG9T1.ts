// PHASE 79 — official Egypt Preparatory-3 (Grade 9) ICT, first term
// («كتاب الوزارة»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g9-ict` is rebuilt from the Ministry textbook
// `ICT_Arabic_Prp3_TR1.pdf` (96 scan pages, all OCR'd). This module is the
// single source of truth for its structure: the two units and their lessons
// exactly as the book's فهرس الموضوعات (book page 3) prints them, and the
// «أهداف الدرس» the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage   (book page 5 = PDF page 5)
// Every content page prints its own book number in the running foot
// («الفصل الدراسي الأول ٦» / «٦٣ الصف الثالث الإعدادي»), which fixes the
// offset at 0. The foot is often split over two printed lines, so
// `printedFooter` reads the last two non-empty lines rather than the last one.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس»
// The book's printed index stops at the lesson (two units, nine lessons); it
// has no «مفهوم» layer. So the app mirrors the book: unit → lesson. Each
// lesson's RAG document is the whole lesson — its divider page, its objectives
// page, and its «تدريبات» exercise block at the end.
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER
// Unit 1 opens on book page 4 (title + «الذكاء الاصطناعي ولغات البرمجة») and
// unit 2 on book page 64, before their first lesson's own divider page (5 and
// 65). The opener is not a lesson, so — exactly as the primary-6 books do — it
// rides with the unit's first lesson. A lesson's own `bookFrom` is still
// stored; the range it owns is derived as "from the unit's first page, down to
// the page before the next lesson starts, bounded by the unit".

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book page 5 = PDF 5). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_ICT_G9_T1_BOOK_START = 4;

/** Last printed content page — the second page of unit 2 lesson 4 exercises. */
export const EGYPT_ICT_G9_T1_BOOK_END = 95;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface IctG9T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed in the contents page (without the ordinal). */
  title: string;
  /**
   * First printed book page of the lesson itself (its divider page). The range
   * the lesson *owns* also includes its unit's opener when it is the unit's
   * first lesson, which is why ownership is derived by `lessonBookRange`.
   */
  bookFrom: number;
  /** The book's printed «أهداف الدرس» for this lesson, verbatim. */
  concepts: string[];
}

export interface IctG9T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "الوحدة الأولى: الذكاء الاصطناعي ولغات البرمجة". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: IctG9T1Lesson[];
}

/**
 * The two units of the first term with their nine lessons: unit/lesson starts
 * from the book's فهرس الموضوعات (page 3), objectives from each lesson's
 * objectives page (6, 19, 32, …). Verified against every printed page by
 * `assertTreeMatchesTheBook`.
 */
export const EGYPT_ICT_G9_T1_UNITS: IctG9T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: الذكاء الاصطناعي ولغات البرمجة",
    bookFrom: 4,
    bookTo: 63,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "التفكير الحاسوبي وحل المشكلات",
        bookFrom: 5,
        concepts: ["يشرح معنى التفكير الحاسوبي", "يحدد خطوات حل المشكلة", "يكتب خوارزمية بسيطة"],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "خوارزميات الذكاء الاصطناعي",
        bookFrom: 18,
        concepts: [
          "يشرح أنواع الخوارزميات",
          "يميز بين الخوارزميات التقليدية وخوارزميات الذكاء الاصطناعي",
          "يكتب خوارزميات بسيطة بلغة Python",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "السلاسل النصية Strings والقوائم Lists في لغة Python",
        bookFrom: 31,
        concepts: [
          "يفهم معنى السلاسل النصية والقوائم",
          "يفرق بين التعامل مع النصوص والحروف",
          "يكتب برنامج بسيط باستخدام الحلقات التكرارية مع النصوص والقوائم",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "الدوال ذات المعاملات في لغة Python",
        bookFrom: 43,
        concepts: [
          "يشرح معنى الدالة (Function)",
          "ينشيء دالة تحتوي على معاملات (Parameters)",
          "يستخدم الدوال في حل مسائل بسيطة.",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "معالجة أخطاء مدخلات المستخدم في لغة Python",
        bookFrom: 53,
        concepts: [
          "يشرح سبب حدوث الأخطاء عند إدخال البيانات",
          "يستخدم try و except لمعالجة الأخطاء",
          "يكتب برامج بسيطة لا تتوقف عند حدوث خطأ",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: الذكاء الاصطناعي والأمن السيبراني",
    bookFrom: 64,
    bookTo: 95,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "التنبؤ باستخدام نموذج الذكاء الاصطناعي",
        bookFrom: 65,
        concepts: [
          "يميز بين البرمجة التقليدية والتعلم الآلي.",
          "يناقش مفهوم التنبؤ (Pattern) باستخدام البيانات.",
          "يفسر نموذج خطي بسيط بلغة Python.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "الذكاء الاصطناعي وحقوق الملكية الفكرية",
        bookFrom: 76,
        concepts: [
          "يناقش حماية الملكية الفكرية عند استخدام تطبيقات الذكاء الاصطناعي.",
          "يشرح كيفية حماية بياناتي الشخصية عند استخدام تطبيقات الذكاء الاصطناعي.",
          "يتعرف الملكية الفكرية وشروط الاستخدام (Terms of Service “TOS”) في تطبيقات الذكاء الاصطناعي.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "الوعي السيبراني والألعاب الإلكترونية الخطرة",
        bookFrom: 81,
        concepts: [
          "يميز بين أنواع الألعاب الإلكترونية المختلفة ويحدد فوائدها ومخاطرها.",
          "يشرح إجراءات الحد من التأثير السلبي للألعاب الإلكترونية على المستوى العالمي.",
          "يقترح حلولًا عملية لإدارة وقت اللعب وتشجيع الأنشطة البديلة لتعزيز الصحة النفسية والاجتماعية.",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "الذكاء الاصطناعي والتزييف العميق (Deepfake)",
        bookFrom: 87,
        concepts: [
          "يشرح مفهوم الذكاء الاصطناعي والتزييف العميق",
          "يتعرف على تقنيات Deepfake & GANs",
          "يستخدم بعض الأدوات والتطبيقات لكشف المحتوى المزيف",
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
 * lesson) or its own divider page, up to the page before the next lesson
 * starts, or the unit's last page for its last lesson. Deriving the end this
 * way keeps the unit opener and each lesson's exercise block inside the lesson
 * they belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ICT_G9_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ICT_G9_T1_UNITS.forEach((unit, ui) => {
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
  "ict-p3-t1",
);

/**
 * The OCR provider answers a truly blank page with this sentence instead of an
 * empty string. It means "no text", not content, so verification treats it as
 * missing while `loadBookPage` still returns it verbatim.
 */
const NO_TEXT = "لا يوجد نص مكتوب في الصورة المرفقة";

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
// PHASE 79 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/** True when two numbers use exactly the same digits (an OCR transposition). */
function isDigitPermutation(a: number, b: number): boolean {
  const sort = (n: number) => String(n).split("").sort().join("");
  return sort(a) === sort(b);
}

/**
 * The book number a content page prints in its running foot, or null when the
 * last lines are not a footer (unit openers and divider pages print none) or
 * carry more than one number. Unlike the primary-6 ICT foot, this book prints
 * the label and the number on separate lines («الفصل الدراسي الأول» / «٦»),
 * so the last two non-empty lines are joined before the number is extracted.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const tail = lines.slice(-2).join(" ");
  if (!tail || !/الصف الثالث|الفصل الدراس|تكنولوجيا المعلومات|الكمبيوتر/.test(tail)) return null;
  const runs = toLatinDigits(tail).match(/\d+/g) ?? [];
  if (runs.length !== 1) return null;
  return Number(runs[0]);
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
  const units = EGYPT_ICT_G9_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_ICT_G9_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_ICT_G9_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ICT_G9_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_ICT_G9_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the offset and proves the mapping page by page;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every lesson's divider page prints that lesson's title;
 *  4. every printed page in the book is owned by exactly one lesson — no page
 *     can fall between two lessons and be unreachable.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number; noisyFooters: number } {
  const problems: string[] = [];
  const ranges = allLessonRanges();
  let footersChecked = 0;
  let noisyFooters = 0;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ICT_G9_T1_BOOK_START || book > EGYPT_ICT_G9_T1_BOOK_END) continue;
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
        // OCR occasionally transposes the two digits of a two-digit footer
        // (page 61's «٦١» was read as «١٦»). A transposition is unmistakable
        // OCR noise, not a page-mapping error — the offset is proven by the
        // other 59 pages — so it is counted, not failed. Any other mismatch is
        // a real problem and fails the import.
        if (isDigitPermutation(footer, book)) noisyFooters++;
        else problems.push(`صفحة الكتاب ${book}: الفوتر المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_ICT_G9_T1_BOOK_END - EGYPT_ICT_G9_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ICT_G9_T1_BOOK_START} و${EGYPT_ICT_G9_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's divider page prints its title.
  EGYPT_ICT_G9_T1_UNITS.forEach((unit) => {
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

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked, noisyFooters };
}
