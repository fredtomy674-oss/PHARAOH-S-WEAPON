// PHASE 64 — official Egypt Grade-6 Islamic Religious Education, first term
// («كتاب الوزارة»).
//
// The curriculum tree for the Egypt `eg-g6-islamic-education` curriculum is
// rebuilt from the Ministry textbook `Islamic_Education_Primary6_T1.pdf`
// (2026/2027 MoE edition, 98 pages, all OCR'd). This module is the single source
// of truth for its structure: the three units («الرحمة والرفق»، «الأخوة في
// الدين»، «التقوى والعمل الصالح») and their lessons, exactly as the book's
// قائمة المحتويات (book page 5–6) prints them, and the «الأهداف» the book prints
// at the head of every teaching lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 1   (book page 17 = PDF page 18)
// Every content page prints its own book number as a bare numeral in the running
// foot («۱۷» or «۸۹»), sometimes in Eastern and sometimes in Extended Arabic-Indic
// digits, which is what fixes the offset at 1.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس»
// The book's printed index stops at the lesson (three units); it has no
// «مفهوم» layer. So the app mirrors the book: unit → lesson. Each lesson's RAG
// document is the whole lesson (its pages, including the «الأنشطة والتدريبات»
// block and «شارك أسرتك» the book places at the end of it).
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND UNIT REVIEW
// Each unit opens with an opener page (title + «دروس الوحدة» + «أهداف الوحدة»)
// and closes with «مراجعة على الوحدة»; the last unit also carries the final
// «تقييمات (التقييم النهائي)». None of these is a lesson, so — exactly as the
// social/ICT books do — the opener rides with the unit's first lesson and the
// review/assessment with its last. A lesson's own `bookFrom` is still stored;
// the range it owns is derived as "from the unit's first page, down to the page
// before the next lesson starts, bounded by the unit".

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book page 17 = PDF 18). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_ISLAMIC_T1_BOOK_START = 6;

/** Last printed content page — the second page of the final «التقييم النهائي». */
export const EGYPT_ISLAMIC_T1_BOOK_END = 95;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface IslamicT1Lesson {
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
  /**
   * The book's printed «الأهداف» for this lesson (the only per-lesson list the
   * book prints; there is no «مفهوم»/«مكوّن» layer in this book).
   */
  concepts: string[];
}

export interface IslamicT1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "الوحدة الأولى: الرحمة والرفق". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: IslamicT1Lesson[];
}

/**
 * The three units of the first term with their twenty lessons: unit/lesson
 * starts from the book's contents pages (5–6), objectives from each lesson's
 * first page (7, 11, …). Verified against every printed page by
 * `assertTreeMatchesTheBook`.
 */
export const EGYPT_ISLAMIC_T1_UNITS: IslamicT1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: الرحمة والرفق",
    bookFrom: 6,
    bookTo: 38,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "الإيمان باليوم الآخر",
        bookFrom: 7,
        concepts: [
          "يوضح مفهوم الإيمان باليوم الآخر، وأهميته في العقيدة الإسلامية.",
          "يتعرف مراحل اليوم الآخر؛ من البعث إلى الحساب والجنة والنار.",
          "يعدل سلوكه اليومي متأثرًا بإيمانه باليوم الآخر.",
          "يستدل بآيات قرآنية وأحاديث نبوية تتحدث عن اليوم الآخر.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "سورة المعارج (تلاوة وحفظ وتفسير)",
        bookFrom: 11,
        concepts: [
          "يتعرَّف اسم السورة، وعدد آياتها، ومكان نزولها.",
          "يتلو سورة المعارج تلاوة صحيحة.",
          "يوضِّح الموضوعات الأساسية التي تناولتها سورة المعارج.",
          "يتعرَّف بعض المفردات الواردة في سورة المعارج.",
          "يستنتج الدروس المستفادة من آيات سورة المعارج.",
          "يطبّق ما ترشد إليه سورة المعارج في حياته اليومية.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "ورتل القرآن ترتيلًا: أحكام الاستعاذة والبسملة",
        bookFrom: 17,
        concepts: [
          "يتعرّف أحكام الاستعاذة والبسملة.",
          "يتعرّف أحكام قراءة الاستعاذة والبسملة.",
          "يطبّق ما تعلّمه في الدرس على سور القرآن الكريم.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "الحج",
        bookFrom: 20,
        concepts: [
          "يُوضّح مفهوم الحج وأهميته في الإسلام.",
          "يتعرّف مكانة الحج كركن من أركان الإسلام.",
          "يُعدّد بعض المناسك الأساسية للحج.",
          "يستنتج الدروس المستفادة من أداء الحج.",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "غزوة حنين",
        bookFrom: 23,
        concepts: [
          "يعلل سبب وقوع غزوة حنين وأحداثها.",
          "يوضح أهم نتائج الغزوة والدروس المستفادة منها.",
          "يستنتج أثر الإيمان والتوكل على الله في تحقيق النصر.",
          "يستخلص القيم الإسلامية من مواقف النبي ﷺ والصحابة في الغزوة.",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "الصحابي الجليل أبو هريرة",
        bookFrom: 28,
        concepts: [
          "يتعرّف اسم أبي هريرة رضي الله عنه ونسبه.",
          "يُعدّد أبرز صفات أبي هريرة رضي الله عنه وأهم مواقفه في الإسلام.",
          "يشرح دور أبي هريرة رضي الله عنه في رواية الحديث الشريف وخدمته للسنة النبوية.",
          "يستخلص القيم والصفات الحسنة من سيرة أبي هريرة رضي الله عنه.",
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        title: "الرفق بالحيوان",
        bookFrom: 33,
        concepts: [
          "يتعرف مفهوم الرفق بالحيوان في الإسلام.",
          "يوضح أهمية الرحمة بالحيوانات ومعاملتها معاملة حسنة.",
          "يذكر بعض الآيات والأحاديث التي تحث على العناية بالحيوانات.",
          "يستنتج العواقب المترتبة على إيذاء الحيوانات وأثر الرحمة بها.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: الأخوة في الدين",
    bookFrom: 39,
    bookTo: 68,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "الإيمان بالبعث والنشور",
        bookFrom: 40,
        concepts: [
          "يتعرّف المقصود بالبعث والنشور.",
          "يستنتج أهمية الإيمان بالبعث والنشور في حياة المسلم.",
          "يدلّل من القرآن الكريم والسنة النبوية على البعث والنشور.",
          "يستنتج أثر الإيمان بالبعث والنشور في سلوك المسلم وأخلاقه.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "سورة الحاقة (تلاوة وحفظ وتفسير)",
        bookFrom: 44,
        concepts: [
          "يتعرَّف سبب تسمية السورة، وعدد آياتها، ومكان نزولها.",
          "يستنتج الموضوعات الأساسية التي تناولتها السورة.",
          "يستنتج معاني بعض المفردات الواردة في السورة.",
          "يستخلص العِبَر والدروس المستفادة من آيات السورة.",
          "يُعَزِّز الإيمان بيوم القيامة وعاقبة الأعمال الصالحة والسيئة.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "ورتل القرآن ترتيلًا: أحكام الميم الساكنة",
        bookFrom: 50,
        concepts: [
          "يتعرف شكل الميم الساكنة عند قراءة القرآن الكريم.",
          "يحدد أحكام الميم الساكنة.",
          "يتدرب على أحكام الميم الساكنة.",
          "ينطق الميم الساكنة بجميع صورها عند تلاوة القرآن الكريم بشكل صحيح.",
          "يطبق جميع أحكام الميم الساكنة بشكل صحيح.",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "أركان الحج",
        bookFrom: 53,
        concepts: [
          "يتعرف أركان الحج، ومعناها في الإسلام.",
          "يستنتج أهمية كل ركن من أركان الحج في أداء هذه العبادة.",
          "يدلّل على أركان الحج من القرآن الكريم والحديث الشريف.",
          "يستنتج أثر أداء الحج الصحيح على حياة المسلم.",
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        title: "حصار الطائف",
        bookFrom: 57,
        concepts: [
          "يتعرّف سبب وقوع حصار الطائف وأحداثه الرئيسة.",
          "يُبيّن دور النبي ﷺ والصحابة في الغزوة.",
          "يستخلص الدروس والعِبَر المستفادة من الغزوة.",
          "يُبيّن موقف أهل الطائف من دعوة الإسلام، وكيف تعامل النبي ﷺ معهم.",
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        title: "الإمام أبو حنيفة النعمان",
        bookFrom: 61,
        concepts: [
          "يتعرف شخصية الإمام أبي حنيفة النعمان، وحياته.",
          "يُوضّح أهم أعماله في خدمة الإسلام والفقه الإسلامي.",
          "يستنتج الدروس المستفادة من سيرته.",
          "يُعبّر عن دور العلماء في نشر العلوم الشرعية.",
        ],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        title: "الاجتهاد في العلم",
        bookFrom: 64,
        concepts: [
          "يتعرّف المقصود بالاجتهاد في طلب العلم، وأهميته في الإسلام.",
          "يدلّل من القرآن والسنة على حث الإسلام على طلب العلم.",
          "يستنتج أثر الاجتهاد في العلم على حياة الفرد والمجتمع.",
          "يقتدي بسِيَر العلماء في المثابرة على التعلّم.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: التقوى والعمل الصالح",
    bookFrom: 69,
    bookTo: 95,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "الإيمان بالحساب والجزاء",
        bookFrom: 70,
        concepts: [
          "يوضح معنى الحساب والجزاء في الإسلام.",
          "يتعرف أهمية الإيمان بالحساب والجزاء في حياة المسلم.",
          "يُدلل من القرآن الكريم والسنة النبوية على الحساب والجزاء.",
          "يستنتج أثر الإيمان بالحساب والجزاء في تصرفات الإنسان.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "سورة القلم (تلاوة وحفظ وتفسير)",
        bookFrom: 74,
        concepts: [
          "يتعرّف اسم السورة، وعدد آياتها، ومكان نزولها.",
          "يستنتج الموضوعات الأساسية التي تناولتها سورة القلم.",
          "يفهم معاني بعض المفردات الواردة في سورة القلم.",
          "يستخلص العِبَر والدروس المستفادة من آيات السورة.",
          "يدرك أهمية الأخلاق الحسنة والتمسك بالحق.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "آداب الحج",
        bookFrom: 80,
        concepts: [
          "يُوضّح مفهوم آداب الحجّ، وأهميتها.",
          "يذكر بعض الآداب التي ينبغي على الحاج التحلي بها.",
          "يستنتج أثر الالتزام بآداب الحج على الحاج والمجتمع.",
          "يُظهر سلوكيات تؤكد تطبيقه لبعض آداب الحج.",
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        title: "غزوة تبوك",
        bookFrom: 83,
        concepts: [
          "يتعرَّف سبب وقوع غزوة تبوك وأحداثها الرئيسة.",
          "يستنتج الدروس والعِبَرَ المستفادة من الغزوة.",
          "يُعَبّر عن دور الصحابة في نصرة الإسلام خلال الغزوة.",
          "يُوضّح أهمية الإخلاص والتضحية في سبيل الله.",
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        title: "الإمام مالك بن أنس",
        bookFrom: 86,
        concepts: [
          "يتعرّف سيرة الإمام مالك بن أنس، ونشأته.",
          "يعدّد أبرز أعمال الإمام مالك ومؤلفاته.",
          "يستنتج الصفات التي تميز بها الإمام مالك.",
          "يوضّح أثر الإمام مالك في الفقه الإسلامي.",
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        title: "التقوى",
        bookFrom: 89,
        concepts: [
          "يتعرف معنى التقوى في الإسلام.",
          "يستنتج أهمية التقوى في حياة المسلم.",
          "يستدل بآيات قرآنية وأحاديث نبوية على الحث على التقوى.",
          "يحدد بعض ثمار التقوى في الدنيا والآخرة.",
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
 * belong to — and lands the unit review / final assessment on the last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ISLAMIC_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ISLAMIC_T1_UNITS.forEach((unit, ui) => {
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
  "islamic-t1",
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
// PHASE 64 — self-checks
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
 * last line is not a bare numeral (unit openers print no footer). Unlike the
 * ICT foot (a sentence with the number embedded), the Islamic foot is the number
 * alone, so a page whose last line is exactly one numeral is the footer.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  const latin = toLatinDigits(last);
  if (!/^\d{1,3}$/.test(latin)) return null;
  return Number(latin);
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
  const units = EGYPT_ISLAMIC_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_ISLAMIC_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_ISLAMIC_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ISLAMIC_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_ISLAMIC_T1_BOOK_END}، وجدنا ${last.bookTo}`);
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
    if (book < EGYPT_ISLAMIC_T1_BOOK_START || book > EGYPT_ISLAMIC_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_ISLAMIC_T1_BOOK_END - EGYPT_ISLAMIC_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ISLAMIC_T1_BOOK_START} و${EGYPT_ISLAMIC_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title.
  EGYPT_ISLAMIC_T1_UNITS.forEach((unit) => {
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
