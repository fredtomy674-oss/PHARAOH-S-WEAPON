// PHASE 149 — official Egypt Grade-5 ICT, first term («كتاب الوزارة»).
//
// The curriculum tree for the Egypt `eg-g5-ict` curriculum is rebuilt from the
// Ministry textbook `ICT_ARABIC_Prim5_TR1.pdf` (2026/2027 MoE edition, 46 PDF
// pages: 39 content pages, two blank pages, a cover and a back cover). This
// module is the single source of truth for its structure: the two units and their
// six lessons each, exactly as the book's فهرس الموضوعات (book page 5) prints
// them, and the «نواتج التعلم» the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage   (book page 7 = PDF page 7)
// Every content page from 7 to 44 prints its own book number as the last line of
// the scan («٧», «٨», … «٤٤»), which fixes the offset at 0 — 38 pages prove it.
// The two unit openers (6, 26) print no number, and the front/back matter sits
// outside the content range.
//
// HOW A LESSON IS LAID OUT
// Every lesson of this book starts on a single page that prints «الدرس الأول» +
// the lesson title + «نواتج التعلم» + the introduction, then one or two content
// pages, then its «الأسئلة والتدريبات» block. So `bookFrom` is both the lesson's
// title page and its objectives page (`objectivesPage`), unlike the Grade-4 book
// where the title page and the objectives page are two separate pages.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس»
// The book's printed index stops at the lesson (two units × six lessons); it has
// no «مفهوم» layer. So the app mirrors the book: unit → lesson. Each lesson's RAG
// document is the whole lesson (its pages, including its exercise block).
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER
// Unit 1 opens on book page 6 («الوحدة الأولى: دور تكنولوجيا المعلومات في حياتنا»)
// and unit 2 on book page 26, before their first lesson's own page (7 and 27). The
// opener is not a lesson, so — exactly as the Grade-6 book does — it rides with
// the unit's first lesson. A lesson's own `bookFrom` is still stored; the range it
// owns is derived as "from the unit's first page, down to the page before the next
// lesson starts, bounded by the unit".

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book page 7 = PDF 7). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_ICT_G5_T1_BOOK_START = 6;

/** Last printed content page — the exercise block of unit 2 lesson 6. */
export const EGYPT_ICT_G5_T1_BOOK_END = 44;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface IctG5T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed on the lesson's own head page (no ordinal). */
  title: string;
  /**
   * First printed book page of the lesson itself. The range the lesson *owns*
   * also includes its unit's opener when it is the unit's first lesson, which is
   * why ownership is derived by `lessonBookRange` rather than stored here.
   */
  bookFrom: number;
  /** The page that prints this lesson's «نواتج التعلم» list (same head page). */
  objectivesPage: number;
  /** The book's printed «نواتج التعلم» for this lesson, verbatim. */
  concepts: string[];
}

export interface IctG5T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "الوحدة الأولى: دور تكنولوجيا المعلومات في حياتنا". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: IctG5T1Lesson[];
}

/**
 * The two units of the first term with their twelve lessons: unit/lesson starts
 * from the book's contents page (5), objectives from each lesson's head page
 * (7, 10, …). Verified against every printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_ICT_G5_T1_UNITS: IctG5T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: دور تكنولوجيا المعلومات في حياتنا",
    bookFrom: 6,
    bookTo: 25,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "الأجهزة الملحقة بالحاسب الآلي",
        bookFrom: 7,
        objectivesPage: 7,
        concepts: [
          "يوضح المفاهيم الأساسية للأدوات الملحقة بالحاسب الآلي",
          "يصف مشكلات الحاسب الآلي الشائعة",
          "يشرح كيفية حل بعض مشكلات الحاسب الآلي الشائعة",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "الشبكات وأنواعها",
        bookFrom: 10,
        objectivesPage: 10,
        concepts: [
          "يشرح ماهية الشبكة",
          "يصف أنواع الشبكات المختلفة",
          "يذكر أكبر عدد من الأمثلة على أنواع الشبكات في حياته اليومية",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "أنظمة التواصل الذكية",
        bookFrom: 13,
        objectivesPage: 13,
        concepts: [
          "يصف طرق التواصل الذكي",
          "يشرح فكرة عمل",
          "يشرح الخدمات التي تقدمها الأنظمة الذكية في حياتنا",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "مشكلات الاتصال بالإنترنت وخطوات حلها",
        bookFrom: 16,
        objectivesPage: 16,
        concepts: [
          "يصف المشكلات الشائعة في مجال تكنولوجيا المعلومات والاتصالات",
          "يضع حلولا لمشكلات تكنولوجيا المعلومات والاتصالات الشائعة",
          "يشرح كيف يساعده اتباع خطوات محددة على اكتشاف المشكلات وإصلاحها",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "الملفات الرقمية وكيفية التعامل معها",
        bookFrom: 19,
        objectivesPage: 19,
        concepts: [
          "يصف أنواعًا مختلفة من ملحقات الأجهزة الإلكترونية",
          "يصف ماهية إدارة الملفات",
          "يتجنب استخدام وسائط تخزين مجهولة",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "مشاركة المعلومات: متى وأين وكيف؟",
        bookFrom: 23,
        objectivesPage: 23,
        concepts: [
          "يناقش متى يمكن أن يقرر نشر المعلومات على شبكة داخلية",
          "يناقش متى يمكن أن يقرر المعلومات على شبكة الإنترنت",
          "يشرح كيفية مشاركة المعلومات باستخدام جداول البيانات",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: احتياطات الأمن والسلامة الرقمية",
    bookFrom: 26,
    bookTo: 44,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "أساليب حماية البيانات والمعلومات",
        bookFrom: 27,
        objectivesPage: 27,
        concepts: [
          "يصف أهمية حماية المعلومات الشخصية",
          "وضح أهمية النسخ الاحتياطي للبيانات",
          "يشرح طرق حماية المعلومات والبيانات الشخصية",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        // The lesson head prints «إدارة كلمات المرور.» with a trailing full stop;
        // the title is stored without it (the printed contents drops it too).
        title: "إدارة كلمات المرور",
        bookFrom: 30,
        objectivesPage: 30,
        concepts: [
          "يفهم أهمية حماية كلمة المرور",
          "يشرح الغرض من برنامج إدارة كلمات المرور",
          "يناقش كيفية استخدام المصادقة متعددة العوامل لحماية البيانات والحسابات",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "طرق التعامل مع المواقع الإلكترونية الاحتيالية",
        bookFrom: 33,
        objectivesPage: 33,
        concepts: [
          "يوضح أساليب خداع المستخدمين",
          "يشرح كيفية تجنب المواقع الإلكترونية الاحتيالية",
          "يحدد الأشخاص أو المؤسسات الذين يمكن إبلاغهم عن المشكلات المتعلقة بالمواقع الإلكترونية",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "حقوق النشر",
        bookFrom: 36,
        objectivesPage: 36,
        concepts: [
          "يشرح مفهوم حقوق النشر",
          "يحترم القانون عند استخدام المعلومات والأجهزة والشبكات",
          "يحدد متى أحتاج إلى إسناد العمل إلى صاحبه",
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        title: "الأمن الوقائي وانتقاء المصادر الرقمية",
        bookFrom: 39,
        objectivesPage: 39,
        concepts: [
          "يشرح مفهوم الأمن الوقائي",
          "يستخدم أدوات تكنولوجيا المعلومات والاتصالات ومصادرها لدعم عمليات صنع القرار",
          "يتجنب إدخال بياناته في صفحات غير آمنة",
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        title: "توثيق المعلومات",
        bookFrom: 42,
        objectivesPage: 42,
        concepts: [
          "يشرح كيفية تدوين الملاحظات وإعادة صياغة المحتوى المتاح عبر الإنترنت",
          "يحدد أسباب الاقتباس من المحتوى المتاح عبر الإنترنت وكيفية تنفيذ ذلك",
          "يوضح كيفية الاستشهاد بالمصادر المتاحة عبر الإنترنت",
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
 * lesson) or its own head page, up to the page before the next lesson starts, or
 * the unit's last page for its last lesson. Deriving the end this way keeps the
 * unit opener and each lesson's exercise block inside the lesson they belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ICT_G5_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ICT_G5_T1_UNITS.forEach((unit, ui) => {
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
  "ict-g5-t1",
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
// PHASE 149 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints in its running foot, or null when the
 * last line is not a footer (the two unit openers print none) or carries more
 * than one number. This book's foot is a bare number — «٧», «٢٤» — so a bare
 * number is accepted as-is, and the sentence form the sibling books use is
 * accepted too in case a page prints it.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  if (!last) return null;
  const latin = toLatinDigits(last);
  if (!/^\d+$/.test(latin) && !/الصف الخامس|الفصل الدراس|تكنولوجيا المعلومات/.test(last)) return null;
  const runs = latin.match(/\d+/g) ?? [];
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
 * starts where the contents describe it. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ICT_G5_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (lesson.objectivesPage !== lesson.bookFrom) {
        problems.push(
          `الدرس ${lesson.key}: في هذا الكتاب تُطبع الأهداف في صفحة الدرس نفسها (${lesson.bookFrom})، وجدنا ${lesson.objectivesPage}`,
        );
      }
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
  if (first && first.bookFrom !== EGYPT_ICT_G5_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_ICT_G5_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ICT_G5_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_ICT_G5_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the offset and proves the mapping page by page;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every lesson's head page prints that lesson's title;
 *  4. that same page prints each of the lesson's «نواتج التعلم» verbatim — the
 *     objectives the app ships are the book's own words;
 *  5. every printed page in the book is owned by exactly one lesson — no page
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
    if (book < EGYPT_ICT_G5_T1_BOOK_START || book > EGYPT_ICT_G5_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_ICT_G5_T1_BOOK_END - EGYPT_ICT_G5_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ICT_G5_T1_BOOK_START} و${EGYPT_ICT_G5_T1_BOOK_END}`,
    );
  }
  if (footersChecked < 36) {
    problems.push(`أرقام الفوتر قليلة (${footersChecked}) — المسار أو القاعدة غير صحيحة`);
  }

  // 3 + 4. each lesson's head page prints its title and its objectives.
  EGYPT_ICT_G5_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const head = loadBookPage(lesson.bookFrom);
      if (!head) {
        problems.push(`الدرس ${lesson.key}: صفحته ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      const flat = normalize(head);
      if (!flat.includes(normalize(lesson.title))) {
        problems.push(`الدرس ${lesson.key}: صفحته ${lesson.bookFrom} لا تطبع عنوانه «${lesson.title}»`);
      }
      for (const concept of lesson.concepts) {
        if (!flat.includes(normalize(concept))) {
          problems.push(`الدرس ${lesson.key}: هدف «${concept}» غير مطبوع في صفحته ${lesson.bookFrom}`);
        }
      }
    });
  });

  // 5. every printed page is owned by exactly one lesson.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
