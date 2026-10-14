// PHASE 98 — official Egypt Preparatory-1 (Grade 7) **Science, Arabic-medium**,
// first term, Ministry 2026/2027 edition.
//
// The curriculum `eg-g7-science` is rebuilt from the Ministry textbook
// `Science_Prep1_T1.pdf` (102 scan pages, all OCR'd) under
// server/data/curriculum-ocr/science-p1-t1/. It is the Arabic original of the
// same book as `egyptScienceEnP1T1.ts` and `egyptScienceFrP1T1.ts`: it prints the
// same four units, the same twelve lessons, and the same printed page numbers, so
// this module mirrors the English one unit-by-unit while taking its titles and
// its OCR transcript from the Arabic scan.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 7   (book page 2 = PDF page 9, book page 88 = PDF page 95)
// Front matter is pdf 1–7 (cover, then roman ii–vii); content runs book 1–93 and
// pdf 101–102 is the printer's colophon / back cover, outside the taught range.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس»
// The contents («محتويات الكتاب», book pages iv–v) lists four units of four,
// three, three and two numbered Lessons («الدرس الأول … الدرس الرابع»), each with
// its printed «أهداف الدرس». The app lesson is that printed lesson, and its
// concepts are those printed objectives. A unit's opener rides with its first
// lesson and its «تقييم الوحدة» with its last, exactly as in the English edition.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.2 = PDF p.9). */
export const BOOK_TO_PDF_OFFSET = 7;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_SCIENCE_P1_T1_BOOK_START = 1;

/** Last printed content page — the book's unit-4 assessment. */
export const EGYPT_SCIENCE_P1_T1_BOOK_END = 93;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface ScienceP1T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed at the head of the lesson. */
  title: string;
  /**
   * First printed book page of the lesson itself. The range the lesson *owns*
   * also includes its unit's opener when it is the unit's first lesson, which is
   * why ownership is derived by `lessonBookRange` rather than stored here.
   */
  bookFrom: number;
  /** The book's printed «أهداف الدرس» for this lesson. */
  concepts: string[];
}

export interface ScienceP1T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed. */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: ScienceP1T1Lesson[];
}

/**
 * The four units of the first term with their twelve lessons: unit/lesson starts
 * from the book's contents page (iv), objectives from each lesson's first page
 * (2, 10, 18, 26 / 33, 41, 47 / 56, 64, 72 / 80, 88). Verified against every
 * printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_SCIENCE_P1_T1_UNITS: ScienceP1T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: المادة",
    bookFrom: 1,
    bookTo: 31,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "تركيب الذرة",
        bookFrom: 2,
        concepts: [
          "يستنتج أن الذرة وحدة بناء جميع المواد.",
          "يوضح دور العالم أرنست رذرفورد في اكتشاف بنية الذرة.",
          "يحدد مكونات الذرة دون الذرية.",
          "يتعرف شحنات وكتل مكونات الذرة.",
          "يحدد مواقع المكونات دون الذرية بالذرة.",
          "يتعرف أن الإلكترونات تدور بأشكال مختلفة في مستويات الطاقة.",
          "يتعرف الرموز الكيميائية لبعض العناصر.",
          "يستنتج عدد الإلكترونات التي تشغل مستويات الطاقة.",
          "يحدد العلاقة بين أعداد الجسيمات دون الذرية المكونة للذرة.",
          "يتعرف النظائر.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "الجدول الدوري لتصنيف العناصر",
        bookFrom: 10,
        concepts: [
          "يوضح دور العالم ديمترى مندليف في ترتيب العناصر تصاعديًا حسب كتلتها الذرية.",
          "يتحقق أن الجدول الدوري الحديث يعكس التوزيع الإلكتروني وخواص الذرات.",
          "يربط بين العدد الذري لعناصر المجموعات A وموقعها بالجدول الدوري الحديث.",
          "يتعرف التوزيع الإلكتروني لذرات العناصر في ضوء الجدول الدوري الحديث.",
          "يوضح أن الخواص الكيميائية تتكرر في بعض مجموعات الجدول الدوري الحديث.",
          "يستنتج العلاقة بين موقع العنصر في الجدول الدوري ونشاطه الكيميائي.",
          "يقدر دور العلماء في تطور محاولات تصنيف العناصر.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "المادة وخصائصها",
        bookFrom: 18,
        concepts: [
          "يحلل بيانات توضح أن المادة النقية تتكون من نوع واحد من الذرات أو الجزيئات.",
          "يفسر الفرق بين جزيئات العناصر وجزيئات المركبات.",
          "يحلل البيانات عن تركيب المواد المختلفة.",
          "يستكشف أن جزيئات المركبات يتراوح عدد ذراتها من اثنين إلى عدة آلاف.",
          "يميز بين المواد عن طريق خواصها الفيزيائية والكيميائية.",
          "يتنبأ باستخدامات المواد من خواصها.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "الروابط الكيميائية",
        bookFrom: 26,
        concepts: [
          "يميز بين الترابط الأيوني والترابط التساهمي.",
          "يعبر عن الترابط التساهمي بإلكترونات التكافؤ المفردة.",
          "يربط بين التركيب الذري للكربون وخواصه المميزة في تكوين المواد العضوية.",
          "يوضح الترابط الحادث في جزيء الميثان كأبسط مركب عضوي.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: مجالات القوى",
    bookFrom: 32,
    bookTo: 54,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "القوى الكهربية",
        bookFrom: 33,
        concepts: [
          "يُجرى أنشطة توضح مفهوم الكهربية الساكنة.",
          "يفسر كيفية شحن الأجسام بشحنات ساكنة.",
          "يُقدم دليلًا على وجود مجال كهربي بين أجسام غير متلامسة.",
          "يتعرف على المجال الكهربي.",
          "يصف خواص خطوط القوى الكهربية.",
          "يُحدد استخدامات جهاز الإلكتروسكوب.",
          "يصمم نموذج يوضح أن القوى الكهربية تؤثر عن بُعد.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "القوى المغناطيسية",
        bookFrom: 41,
        concepts: [
          "يتعرف أشكال المغناطيسات.",
          "يُميز بين المواد المغناطيسية وغير المغناطيسية.",
          "يكتشف خواص المغناطيسات.",
          "يستنتج قانون التجاذب والتنافر.",
          "يتعرف المجال المغناطيسي.",
          "يرسم خطوط المجال المغناطيسي لمغناطيس.",
          "يرسم خطوط المجال المغناطيسي للأقطاب المتقابلة لمغناطيسين.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "قوى الجاذبية",
        bookFrom: 47,
        concepts: [
          "يتعرف مجال الجاذبية.",
          "يقدم دليلًا على وجود جاذبية بين أجسام غير متلامسة.",
          "يميز بين قوى التلامس وقوى المجال.",
          "يحدد العوامل المؤثرة في قوى الجاذبية.",
          "يقدم دليلًا على أن قوى الجاذبية تكون جاذبة دائمًا.",
          "يقدم دليلًا على أن قوى الجاذبية تكون ضعيفة جدًا بين أي جسمين كتلتهما صغيرة.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الكائنات الحية تركيبها وعملياتها",
    bookFrom: 55,
    bookTo: 78,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "الخلايا والحياة",
        bookFrom: 56,
        concepts: [
          "يقدم دليلًا على أن جميع الكائنات الحية تتكون من خلايا كوحدة بناء ووظيفة.",
          "يصنف الكائنات الحية إلى أوليات النواة وحقيقيات النواة.",
          "يصنف الكائنات الحية إلى كائنات وحيدة الخلية وكائنات عديدة الخلايا.",
          "يقارن بين أوليات النواة وحقيقيات النواة.",
          "يتعرف دور الخلايا الجذعية في تمايز الأنسجة والأعضاء في الكائنات عديدة الخلايا.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "الصفات العامة للكائنات الحية",
        bookFrom: 64,
        concepts: [
          "يُعدد الصفات العامة للكائنات الحية.",
          "يربط الصفات العامة للحياة بوظائف الخلية في أوليات النواة.",
          "يربط الصفات العامة للحياة بوظائف الخلية في حقيقيات النواة.",
          "يوضح التكامل بين عملية البناء الضوئي وعملية التنفس الخلوي.",
          "يتعرف صفة النقل في الحيوانات والنباتات.",
          "يقارن بين وسيلة الحركة في بعض الكائنات وحيدة الخلية.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "الميكروبات",
        bookFrom: 72,
        concepts: [
          "يصنف الميكروبات إلى أوليات النواة وحقيقيات النواة.",
          "يُعدد أنواع الميكروبات.",
          "يصف أمثلة من أنواع الميكروبات النافعة.",
          "يُعدد فوائد الميكروبات للإنسان.",
          "يصف أمثلة من أنواع الميكروبات الضارة.",
          "يتعرف الأمراض الناتجة عن تلوث الغذاء.",
          "يُقدر جهود العلماء في اكتشاف الأمراض وطرق علاجها.",
        ],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "الوحدة الرابعة: نظام (الأرض - الشمس - القمر)",
    bookFrom: 79,
    bookTo: 93,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "الأرض والنظام الشمسي",
        bookFrom: 80,
        concepts: [
          "يستنتج أوجه التشابه والاختلاف بين كواكب المجموعة الشمسية.",
          "يتعرف بعض النتائج المترتبة على ميل محور الأرض.",
          "يستنتج العلاقة بين الحركة الظاهرية للشمس وأطوال الظلال المتكونة للأجسام.",
          "يستنتج العلاقة بين ميل محور الأرض ودورانها حول الشمس وتعاقب فصول السنة.",
          "يستنتج العلاقة بين طول النهار والليل في فصول السنة الأربعة.",
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        title: "خسوف القمر",
        bookFrom: 88,
        concepts: [
          "يميز بين أطوار القمر.",
          "يتعرف طور البدر.",
          "يتحقق من تكوين الظل وشبه الظل للأجسام المعتمة.",
          "يفسر ظاهرة خسوف القمر.",
          "يكتب تقريرًا عن كسوف الشمس.",
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
  const unit = EGYPT_SCIENCE_P1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SCIENCE_P1_T1_UNITS.forEach((unit, ui) => {
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
  "science-p1-t1",
);

/**
 * The OCR provider answers a truly blank page with one of these sentences (the
 * wording varies between calls) instead of an empty string. They mean "no text",
 * not content, so verification treats them as missing while `loadBookPage` still
 * returns them verbatim.
 */
const NO_TEXT_MARKERS = [
  "لا يوجد نص مكتوب في الصورة المرفقة",
  "لا يوجد نص في الصورة المرفقة",
  "لا توجد نصوص في الصورة المرفقة",
  "[صفحة فارغة]",
];

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

/** Arabic-Indic digits → Latin. The book prints either range depending on the plate. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * Is this line shaped like the book's running foot? It must name the lesson
 * («الدرس الأول …») or the unit («… الوحدة الأولى …») and hold exactly one number
 * at the very start or the very end of the line — never in the middle, which is
 * what keeps a content line or a unit heading («الوحدة الأولى», no number) from
 * being read as a page number.
 */
function footNumber(line: string): number | null {
  if (!/الدرس|الوحدة/.test(line)) return null;
  if (!line.includes(":")) return null; // a real foot always has the «… : …» caption
  const latin = toLatinDigits(line);
  const runs = latin.match(/\d{1,3}/g) ?? [];
  if (runs.length !== 1) return null;
  const at = latin.indexOf(runs[0]!);
  const endsLine = at + runs[0]!.length === line.length;
  if (!endsLine && at !== 0) return null;
  return Number(runs[0]);
}

/**
 * The book number a content page prints in its running foot, or null when the
 * page prints none. The foot is the lesson caption carrying the number at its end
 * («الدرس الأول : تركيب الذرة 3») or the number leading the unit caption
 * («4 الوحدة الأولى: المادة»). The lines are walked backwards rather than only
 * the last one because OCR floats a page's figure captions past its foot, while
 * the four unit openers carry no foot.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    const n = footNumber(lines[i]!);
    if (n !== null) return n;
  }
  return null;
}

/**
 * Arabic-folded, punctuation-free text: lets a printed «…» title or objective
 * match across the OCR's inconsistent hamza/ya/ta-marbuta and its optional
 * tashkeel. Mirrors `egyptScienceT1.ts`.
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
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_SCIENCE_P1_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_SCIENCE_P1_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_SCIENCE_P1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SCIENCE_P1_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_SCIENCE_P1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number;
 *  2. every content page carries real OCR text;
 *  3. every lesson's own first page prints that lesson's title;
 *  4. every printed page is owned by exactly one lesson — no page can fall
 *     between two lessons and be unreachable;
 *  5. every printed objective really appears inside its lesson's pages.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const ranges = allLessonRanges();
  let footersChecked = 0;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SCIENCE_P1_T1_BOOK_START || book > EGYPT_SCIENCE_P1_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_SCIENCE_P1_T1_BOOK_END - EGYPT_SCIENCE_P1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_SCIENCE_P1_T1_BOOK_START} و${EGYPT_SCIENCE_P1_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title.
  EGYPT_SCIENCE_P1_T1_UNITS.forEach((unit) => {
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

  // 5. every printed objective appears inside its lesson's pages.
  EGYPT_SCIENCE_P1_T1_UNITS.forEach((unit, ui) => {
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
