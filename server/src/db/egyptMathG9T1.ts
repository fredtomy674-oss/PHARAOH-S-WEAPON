// PHASE 83 — official Egypt Preparatory-3 (Grade 9) Mathematics, first term
// («كتاب الوزارة»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g9-math` is rebuilt from the Ministry textbook
// `Math_Ar_prep3_t1.pdf` (114 scan pages, all OCR'd). This module is the single
// source of truth for its structure: the four units and their fifteen lessons,
// exactly as the book's المحتويات (book page iv) prints them, and the «نواتج
// التعلم» the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 5   (book page 14 = PDF page 19)
// Every content page carries its own number in the running foot — sometimes
// alone («14»), sometimes wrapped with the unit title («14 الوحدة الثانية الجبر …»)
// or with «الفصل الدراسي الأول» — which is what fixes the offset at 5 and proves
// the mapping page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس», NOT A «مفهوم»
// Unlike the Grade-6 maths book, whose index is a «مفهوم» layer, this book's
// contents page lists «دروس الوحدة»: four units of two, five, seven and one
// numbered «الدرس» (1-1 … 4-1), each with its printed «نواتج التعلم». The app
// lesson is that printed lesson, and its concepts are those printed outcomes.
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND ASSESSMENTS
// Each unit opens with a one-page opener (title + «دروس الوحدة» + «القضايا
// والمهارات» + «القيم») and closes with «تقييم الوحدة» (one or two pages); the
// last unit also carries the final «تقييم نهائى». Neither is a lesson, so — as in
// the other Ministry books — the opener rides with the unit's first lesson and
// the assessment with its last.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.14 = PDF p.19). */
export const BOOK_TO_PDF_OFFSET = 5;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_MATH_G9_T1_BOOK_START = 1;

/** Last printed content page — the final «تقييم نهائى». */
export const EGYPT_MATH_G9_T1_BOOK_END = 107;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface MathG9T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed at the head of the lesson (without the ordinal). */
  title: string;
  /**
   * First printed book page of the lesson itself. The range the lesson *owns*
   * also includes its unit's opener when it is the unit's first lesson, which is
   * why ownership is derived by `lessonBookRange` rather than stored here.
   */
  bookFrom: number;
  /** The book's printed «نواتج التعلم» for this lesson. */
  concepts: string[];
}

export interface MathG9T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "الوحدة الثانية: الجبر". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: MathG9T1Lesson[];
}

/**
 * The four units of the first term with their fifteen lessons: unit/lesson
 * starts from the book's contents page (iv), outcomes from each lesson's first
 * page (2, 7, 14, …). Verified against every printed page by
 * `assertTreeMatchesTheBook`.
 */
export const EGYPT_MATH_G9_T1_UNITS: MathG9T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: الأعداد والعمليات عليها",
    bookFrom: 1,
    bookTo: 12,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "قوى القوى",
        bookFrom: 2,
        concepts: [
          "تعرف مفهوم قوة القوة.",
          "توجد قوة القوة لعدد حقيقي.",
          "تستخدم قانون قوة القوة في تبسيط تعبيرات رياضية.",
          "تستخدم قانون قوة حاصل ضرب قوتين / خارج قسمة قوتين في حل مشكلات حياتية.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "المعادلات الأسية",
        bookFrom: 7,
        concepts: [
          "تحل المعادلات الأسية مستخدمًا قوانين الأسس.",
          "تستخدم المعادلات الأسية في حل مشكلات حياتية.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: الجبر",
    bookFrom: 13,
    bookTo: 46,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "الدالة التربيعية",
        bookFrom: 14,
        concepts: [
          "تعرف الصيغة القياسية للدالة التربيعية.",
          "تعرف صيغة الرأس للدالة التربيعية.",
          "تحدد رأس المنحنى ومحور تماثل الدالة التربيعية.",
          "تمثل الدالة التربيعية بيانيًا.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "مجموعة الأصفار الحقيقية لدوال كثيرات الحدود",
        bookFrom: 22,
        concepts: [
          "توجد مجموعة الأصفار الحقيقية لدوال كثيرات الحدود جبريًا.",
          "توجد مجموعة الأصفار الحقيقية لدوال كثيرات الحدود مرسومة بيانيًا.",
          "تستخدم الأصفار الحقيقية لدوال كثيرات الحدود لحل بعض المشكلات الحياتية.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "دوال الكسور الجبرية النسبية",
        bookFrom: 27,
        concepts: [
          "تعرف مفهوم دالة الكسر الجبري النسبي.",
          "تعرف مجال دالة الكسر الجبري النسبي.",
          "تبسط الكسر الجبري النسبي لأبسط صورة.",
          "تعرف مجموعة أصفار دالة الكسر الجبري النسبي.",
          "تستخدم دوال الكسور الجبرية النسبية لحل بعض المشكلات الحياتية.",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "المجال المشترك وتساوى دوال الكسور الجبرية النسبية",
        bookFrom: 33,
        concepts: [
          "توجد المجال المشترك لدالتين أو أكثر من دوال الكسور الجبرية النسبية.",
          "تعرف شروط تساوى دوال الكسور الجبرية النسبية.",
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        title: "العمليات على الكسور الجبرية النسبية",
        bookFrom: 38,
        concepts: [
          "تجرى العمليات على الكسور الجبرية النسبية.",
          "تعرف مفهوم المعكوس الجمعى، والمعكوس الضربي للكسر الجبرى النسبى.",
          "تعرف خواص العمليات على الكسور الجبرية النسبية.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الهندسة",
    bookFrom: 47,
    bookTo: 94,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "تشابه المضلعات",
        bookFrom: 48,
        concepts: [
          "تعرف شروط تشابه مضلعين.",
          "تعرف نسبة التشابه.",
          "تستخدم خواص التشابه في حل بعض المشكلات الحياتية.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "تشابه المثلثات",
        bookFrom: 55,
        concepts: [
          "تعرف شروط تشابه مثلثين.",
          "تستخدم تشابه المثلثين في إيجاد قياسات الزوايا وأطوال الأضلاع.",
          "تثبت تشابه مثلثين.",
          "تستخدم تشابه المثلثين في حل بعض المشكلات الحياتية.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "التمدد",
        bookFrom: 62,
        concepts: [
          "تعرف مفهوم التمدد.",
          "تعرف التمدد الموجب.",
          "تستخدم الإحداثيات في تكبير أو تصغير شكل معلوم.",
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        title: "النسب المثلثية للزاوية الحادة",
        bookFrom: 68,
        concepts: [
          "تعرف النسب المثلثية للزاوية الحادة في المثلث القائم الزاوية.",
          "تعين جيب الزاوية (sin).",
          "تعين جيب تمام الزاوية (cos).",
          "تعين ظل الزاوية (tan).",
          "تستخدم النسب المثلثية للزاوية الحادة في تعيين أطوال أضلاع المثلث القائم الزاوية.",
          "تستخدم النسب المثلثية للزاوية الحادة في حل بعض المشكلات الحياتية.",
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        title: "النسب المثلثية لبعض الزوايا الخاصة",
        bookFrom: 74,
        concepts: [
          "تعرف النسب المثلثية للزوايا الخاصة (45°، 60°، 30°).",
          "تستخدم الآلة الحاسبة لإيجاد النسب المثلثية لزاوية معلوم قياسها.",
          "توجد قياس الزاوية إذا علمت إحدى نسبها المثلثية باستخدام الآلة الحاسبة.",
          "تستخدم النسب المثلثية في حل مشكلات حياتية.",
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        title: "العلاقة بين ميلي المستقيمين المتوازيين والمتعامدين",
        bookFrom: 80,
        concepts: [
          "تستنتج ميل الخط المستقيم من خلال ظل زاوية ميله.",
          "تعرف العلاقة بين ميلي المستقيمين المتوازيين.",
          "تعرف العلاقة بين ميلي المستقيمين المتعامدين.",
          "تحل مسائل حياتية باستخدام ميل الخط المستقيم.",
        ],
      },
      {
        key: "3-7",
        ordinal: "السابع",
        title: "معادلة الخط المستقيم",
        bookFrom: 86,
        concepts: [
          "توجد معادلة الخط المستقيم بدلالة الميل والمقطع y.",
          "توجد معادلة الخط المستقيم بدلالة الميل ونقطة.",
          "تعرف الصورة القياسية لمعادلة الخط المستقيم.",
          "تستخدم ميل الخط المستقيم والمقطع y في تمثيل الخط المستقيم بيانيًا.",
          "تستخدم معادلة الخط المستقيم في حل بعض المشكلات الحياتية.",
        ],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "الوحدة الرابعة: الإحصاء",
    bookFrom: 95,
    bookTo: 107,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "مقاييس التشتت",
        bookFrom: 96,
        concepts: [
          "تعرف مفهوم التشتت.",
          "تعرف مقاييس التشتت لمجموعة من القيم.",
          "تعرف مفهوم المدى.",
          "تعرف مفهوم المدى الربيعى.",
          "تعرف مفهوم الانحراف المعيارى.",
          "توجد المدى والمدى الربيعى لمجموعة من البيانات معروضة بأشكال مختلفة.",
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
 * belong to — and lands the unit assessment on the last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_MATH_G9_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_G9_T1_UNITS.forEach((unit, ui) => {
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
  "math-p3-t1",
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
// PHASE 83 — self-checks
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
 * last line is not a running foot (unit openers print no footer). The foot is
 * one number alone («14») or wrapped with the unit title («14 الوحدة الثانية
 * الجبر …») or with «الفصل الدراسي الأول <n>»; the last line is accepted only
 * when it looks like one of those — a lone numeral or a line carrying
 * «الوحدة»/«الصف»/«الفصل» — so a running head («الدرس 1 - 1») or a content line
 * that merely ends in a number is not mistaken for the foot.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  const latin = toLatinDigits(last);
  const runs = latin.match(/\d{1,3}/g) ?? [];
  if (runs.length !== 1) return null;
  const looksLikeFoot = /^[\d\s]+$/.test(latin) || /الوحدة|الصف|الفصل/.test(last);
  if (!looksLikeFoot) return null;
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
  const units = EGYPT_MATH_G9_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_MATH_G9_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_MATH_G9_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_G9_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_MATH_G9_T1_BOOK_END}، وجدنا ${last.bookTo}`);
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
    if (book < EGYPT_MATH_G9_T1_BOOK_START || book > EGYPT_MATH_G9_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_MATH_G9_T1_BOOK_END - EGYPT_MATH_G9_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_MATH_G9_T1_BOOK_START} و${EGYPT_MATH_G9_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title.
  EGYPT_MATH_G9_T1_UNITS.forEach((unit) => {
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
