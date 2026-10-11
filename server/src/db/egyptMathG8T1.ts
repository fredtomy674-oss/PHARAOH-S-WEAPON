// PHASE G8-math — official Egypt Preparatory-2 (Grade 8) Mathematics, first term
// («كتاب الوزارة»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g8-math` is rebuilt from the Ministry textbook
// `Math_Ar_prep2_t1.pdf` (130 scan pages, all OCR'd). This module is the single
// source of truth for its structure: the four units and their seventeen
// lessons, exactly as the book's المحتويات (book page iv) prints them, and the
// «نواتج التعلم» the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 5   (book page 3 = PDF page 8)
// Every content page carries its own number in the running foot — sometimes
// alone («3»), sometimes wrapped with the unit title («14 الوحدة الأولى …») or
// the running title («… للصف الثاني الإعدادي») — which is what fixes the offset
// at 5 and proves the mapping page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس», NOT A «مفهوم»
// This book's contents page lists «دروس الوحدة»: four units of five, four, six
// and two numbered «الدرس» (1-1 … 4-2), each with its printed «نواتج التعلم».
// The app lesson is that printed lesson, and its concepts are those outcomes.
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND ASSESSMENTS
// Each unit opens with a one-page opener (title + «دروس الوحدة») and closes
// with «تقييم الوحدة»; the book then finishes with «تقييم نهائى». Neither is a
// lesson, so — as in the other Ministry books — the opener rides with the
// unit's first lesson and the assessment with its last.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.3 = PDF p.8). */
export const BOOK_TO_PDF_OFFSET = 5;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_MATH_G8_T1_BOOK_START = 1;

/** Last printed content page — the final «تقييم نهائى» (books 123-125 are back matter). */
export const EGYPT_MATH_G8_T1_BOOK_END = 122;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface MathG8T1Lesson {
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

export interface MathG8T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "الوحدة الثانية: الجبر". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: MathG8T1Lesson[];
}

/**
 * The four units of the first term with their seventeen lessons: unit/lesson
 * starts from the book's contents page (iv), outcomes from each lesson's first
 * page (2, 8, 14, 20, 25 / 33, 39, 46, 53 / 62, 70, 78, 83, 89, 97 / 106, 112).
 * Verified against every printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_MATH_G8_T1_UNITS: MathG8T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: الأعداد والعمليات عليها",
    bookFrom: 1,
    bookTo: 31,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "الأعداد الحقيقية",
        bookFrom: 2,
        concepts: [
          "تعرف مفهوم العدد غير النسبي.",
          "تقدر قيمة تقريبية للعدد غير النسبي وتمثلها على خط الأعداد.",
          "تعرف مجموعة الأعداد الحقيقية.",
          "ترتب مجموعة من الأعداد الحقيقية تنازليًا أو تصاعديًا.",
          "تحل معادلات في مجموعة الأعداد الحقيقية.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "الفترات والعمليات عليها",
        bookFrom: 8,
        concepts: [
          "تعرف مفهوم الفترة كمجموعة جزئية من مجموعة الأعداد الحقيقية.",
          "تمثل فترة على خط الأعداد.",
          "تجرى عمليات التقاطع والاتحاد والفرق والمكملة على الفترات.",
          "توظف مفهوم الفترات في حل مشكلات حياتية.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "العمليات على الأعداد الحقيقية",
        bookFrom: 14,
        concepts: [
          "تجرى العمليات الحسابية (الجمع والطرح والضرب والقسمة) على الأعداد الحقيقية.",
          "تعرف خواص جمع وضرب الأعداد الحقيقية.",
          "تحل بعض المشكلات الحياتية مستخدمًا العمليات الحسابية على الأعداد الحقيقية.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "قوانين الجذور التربيعية والتكعيبية",
        bookFrom: 20,
        concepts: [
          "تعرف قوانين ضرب وقسمة الجذور التربيعية.",
          "تعرف قوانين ضرب وقسمة الجذور التكعيبية.",
          "تستخدم قوانين الجذور التربيعية والتكعيبية في تبسيط الأعداد.",
          "تستخدم قوانين الجذور في حل المشكلات الحياتية.",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "قوانين الأسس في الأعداد الحقيقية",
        bookFrom: 25,
        concepts: [
          "تعرف الضرب المتكرر في مجموعة الأعداد الحقيقية.",
          "تعرف قوانين الأسس في الأعداد الحقيقية.",
          "تستخدم قوانين الأسس في تبسيط تعبيرات رياضية.",
          "تستخدم قوانين الأسس في حل مشكلات حياتية.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: الجبر",
    bookFrom: 32,
    bookTo: 60,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "التحليل بإخراج العامل المشترك الأكبر",
        bookFrom: 33,
        concepts: [
          "تعرف مفهوم التحليل بإخراج العامل المشترك الأكبر.",
          "تحلل كثيرة حدود بإخراج العامل المشترك الأكبر.",
          "تستخدم التحليل بإخراج العامل المشترك الأكبر في حل المشكلات.",
          "تحل المعادلات باستخدام التحليل بإخراج العامل المشترك الأكبر.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "تحليل ثلاثية الحدود",
        bookFrom: 39,
        concepts: [
          "تحلل ثلاثية الحدود على الصورة: x² + bx + c",
          "تحلل ثلاثية الحدود على الصورة: ax² + bx + c (حيث a ≠ 1)",
          "تستخدم التحليل في حل معادلات تربيعية.",
          "تستخدم التحليل في حل مشكلات حياتية.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "تحليل الحالات الخاصة",
        bookFrom: 46,
        concepts: [
          "تحلل ثلاثية الحدود التي تمثل مربعًا كاملًا.",
          "تحلل الفرق بين مربعين.",
          "تحلل الفرق بين مكعبين.",
          "تحلل مجموع مكعبين.",
          "تستخدم التحليل لتسهيل إجراء العمليات الحسابية.",
          "تستخدم التحليل لحل بعض المشكلات الحياتية.",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "التحليل بالتقسيم",
        bookFrom: 53,
        concepts: [
          "تحلل كثيرة حدود عن طريق التقسيم.",
          "تعرف إكمال المربع.",
          "تستخدم إكمال المربع في التحليل، وحل المعادلات.",
          "تستخدم التحليل بالتقسيم في حل مشكلات حياتية.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الهندسة",
    bookFrom: 61,
    bookTo: 104,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "التطابق",
        bookFrom: 62,
        concepts: [
          "تعرف مفهوم تطابق الأشكال الهندسية المستوية.",
          "تعرف شروط تطابق مضلعين.",
          "تعرف حالات تطابق مثلثين.",
          "تستخدم التطابق في إيجاد قياسات الزوايا وأطوال الأضلاع.",
          "تثبت تطابق مثلثين.",
          "تستخدم تطابق الأشكال الهندسية المستوية في حل المشكلات الحياتية.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "نظرية فيثاغورس وعكسها",
        bookFrom: 70,
        concepts: [
          "تعرف العلاقة بين أطوال أضلاع المثلث القائم الزاوية.",
          "توجد طول أحد ضلعي القائمة في مثلث قائم الزاوية إذا عُلم طول الوتر وطول ضلع القائمة الآخر.",
          "توجد طول الوتر في مثلث قائم الزاوية إذا عُلم طولا ضلعي القائمة.",
          "تثبت أن المثلث قائم الزاوية إذا علمت أطوال أضلاع الثلاثة.",
          "تحدد نوع المثلث بالنسبة لزواياه إذا عُلم أطوال أضلاعه.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "تطبيقات التوازي",
        bookFrom: 78,
        concepts: [
          "تعرف العلاقة بين أطوال أجزاء القواطع المحصورة بين المستقيمات المتوازية.",
          "تستخدم الشعاع المرسوم من منتصف أحد أضلاع مثلث موازيًا أحد الضلعين الآخرين.",
          "تعرف القطعة المتوسطة في المثلث.",
          "تعرف العلاقة بين القطعة المتوسطة في المثلث والضلع المقابل لها.",
          "تستخدم التوازي في حل المسائل في الهندسة.",
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        title: "متوسطات المثلث",
        bookFrom: 83,
        concepts: [
          "تعرف مفهوم متوسط المثلث.",
          "تعرف نقطة تلاقى متوسطات المثلث.",
          "تعرف العلاقة بين طول المتوسط الخارج من رأس القائمة وطول الوتر في المثلث القائم الزاوية.",
          "تستخدم متوسطات المثلث في حل مشكلات حياتية.",
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        title: "المثلث المتساوى الساقين",
        bookFrom: 89,
        concepts: [
          "تعرف خواص المثلث المتساوى الساقين.",
          "تعرف خواص المثلث المتساوى الأضلاع.",
          "تعرف التماثل في المثلث.",
          "تعرف العلاقة بين أطوال أضلاع المثلث الثلاثيني الستيني.",
          "تستخدم خواص المثلث المتساوى الساقين والمثلث المتساوى الأضلاع في حل مشكلات حياتية.",
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        title: "الزوايا الداخلة والخارجة للمضلعات",
        bookFrom: 97,
        concepts: [
          "تعرف الصيغة الرياضية لحساب مجموع قياسات زوايا المضلع المحدب.",
          "تعرف مجموع قياسات الزوايا الخارجة للمضلع المحدب.",
          "تعرف الصيغة الرياضية لحساب قياس الزاوية الداخلة للمضلع المنتظم.",
          "تعرف الصيغة الرياضية لحساب عدد أقطار المضلع المحدب.",
        ],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "الوحدة الرابعة: الإحصاء",
    bookFrom: 105,
    bookTo: 122,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "الجدول التكراري المتجمع الصاعد وتمثيله بيانيًا",
        bookFrom: 106,
        concepts: [
          "تكون جدولاً تكراريًا متجمعًا صاعدًا لجدول تكراري ذي مجموعات.",
          "ترسم المنحنى التكراري المتجمع الصاعد.",
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        title: "مقاييس النزعة المركزية للجدول التكراري ذي المجموعات",
        bookFrom: 112,
        concepts: [
          "تقدّر الوسط الحسابي للجدول التكراري ذي المجموعات.",
          "تقدّر الوسيط للجدول التكراري ذي المجموعات.",
          "تقدّر المنوال للجدول التكراري ذي المجموعات.",
          "تقرأ وتفسر جداول وأشكالاً بيانية تكرارية لمجتمع ما.",
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
  const unit = EGYPT_MATH_G8_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_G8_T1_UNITS.forEach((unit, ui) => {
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
  "math-p2-t1",
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
 * («14 الوحدة الأولى الأعداد والعمليات عليها …»), or wrapped with the running
 * title («… الرياضيات للصف الثاني الإعدادي»); the unit openers print a values
 * banner instead («- الوعي بالأمن الغذائي»), and two content pages (74, 85)
 * print no number at all. A line is accepted only when it looks like one of
 * these — a lone numeral or a line carrying «الوحدة»/«الفصل»/«الصف»/«للصف» —
 * so a content line that merely ends in a number is not mistaken for the foot.
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
    const looksLikeFoot = /^[\d\s]+$/.test(latin) || /الوحدة|الفصل|الصف|للصف/.test(tail[i]!);
    if (!looksLikeFoot) continue;
    return Number(runs[0]);
  }
  return null;
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
  const units = EGYPT_MATH_G8_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_MATH_G8_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_MATH_G8_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_G8_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_MATH_G8_T1_BOOK_END}، وجدنا ${last.bookTo}`);
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
    if (book < EGYPT_MATH_G8_T1_BOOK_START || book > EGYPT_MATH_G8_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_MATH_G8_T1_BOOK_END - EGYPT_MATH_G8_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_MATH_G8_T1_BOOK_START} و${EGYPT_MATH_G8_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title.
  EGYPT_MATH_G8_T1_UNITS.forEach((unit) => {
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