// PHASE 80 — official Egypt Preparatory-1 (Grade 7) ICT, first term
// («كتاب الوزارة»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g7-ict` is rebuilt from the Ministry textbook
// `ICT_ARABIC_Prp1_TR1.pdf` (109 printed pages, born-digital PDF with a real
// text layer; a few scan pages embedded in it get an OCR backfill). This module
// is the single source of truth for its structure: the book's only chapter,
// «الفصل الأول: البرامج والتطبيقات الرقمية», and its ten lessons exactly as
// the book's قائمة المحتويات (book page 3) prints them, each lesson grounded
// on the «فى نهاية الدرس، سأكون قادر على أن…» objectives the book puts at its
// head.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage   (book page 5 = PDF page 5)
// Every content page prints its own book number alone on the last line of its
// running foot, which fixes the offset at 0.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس»
// The book's printed index lists ten lessons straight under its single chapter;
// it has no «وحدة» or «مفهوم» layer. So the app mirrors the book: one unit
// (the chapter) → ten lessons. Each lesson's RAG document is the OCR text of
// exactly the pages the book prints for it, stamped `[صفحة الكتاب N]`.
//
// The tree is verified before seeding: `isConsistent` checks its invariants and
// `assertTreeMatchesTheBook` proves the page mapping from the printed running
// feet, the lesson titles each divider page prints, and the tiling. Seeding
// refuses to run on an unverified table.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the book's content — the opener of lesson 1. */
export const EGYPT_ICT_P1_T1_BOOK_START = 5;

/** Last printed content page — the closing self-assessment of lesson 10. */
export const EGYPT_ICT_P1_T1_BOOK_END = 109;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface IctP1T1Lesson {
  /** App-addressable key, e.g. "1-10" (unit 1, lesson 10). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثامن". */
  ordinal: string;
  /** Lesson title as printed in the contents page (without the ordinal). */
  title: string;
  /**
   * First printed book page of the lesson itself (its divider page). The range
   * the lesson *owns* also includes the chapter's opener when it is the first
   * lesson, which is why ownership is derived by `lessonBookRange`.
   */
  bookFrom: number;
  /** The book's printed «أهداف الدرس» for this lesson, verbatim. */
  concepts: string[];
}

export interface IctP1T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الأول". */
  ordinal: string;
  /**
   * Unit title as printed — the book's own word for its top-level section,
   * «الفصل الأول: البرامج والتطبيقات الرقمية».
   */
  title: string;
  /** First printed page of the unit — the first lesson's opener. */
  bookFrom: number;
  /** Last printed page of the unit (the book's last content page). */
  bookTo: number;
  lessons: IctP1T1Lesson[];
}

/**
 * The single chapter of the first term with its ten lessons: lesson starts
 * from the book's فهرس الموضوعات (page 3) and each opener's printed footer;
 * objectives from each lesson's opener (5, 11, 19, 27, 42, 56, 66, 75, 87, 99).
 * Verified against every printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_ICT_P1_T1_UNITS: IctP1T1Unit[] = [
  {
    ordinal: "الأول",
    title: "الفصل الأول: البرامج والتطبيقات الرقمية",
    bookFrom: 5,
    bookTo: 109,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "التكنولوجيا الخضراء",
        bookFrom: 5,
        concepts: [
          "أشرح مفهوم التكنولوجيا الخضراء",
          "أستنتج فكرة عمل أجهزة الاستشعار ودورها في حياتنا",
          "أقترح أكبر عدد من استخدامات التكنولوجيا الخضراء في حياتنا",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "التحول الرقمى وأهميته في حياتنا اليومية",
        bookFrom: 11,
        concepts: [
          "أناقش الخدمات الرقمية المتنوعة التي توفرها الدولة المصرية",
          "أشرح أدوات التحول الرقمي",
          "أستخدم أحد الخدمات الرقمية في تلبية احتياجاتي",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "أنظمة التشغيل",
        bookFrom: 19,
        concepts: [
          "أعدد أنواع أنظمة التشغيل (الكمبيوتر، الهواتف النقالة)",
          "أفرق بين واجهات أنظمة التشغيل",
          "أستخدم أحد أنظمة التشغيل على جهازي",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "تثبيت وإزالة البرامج والأجهزة الرقمية الملحقة",
        bookFrom: 27,
        concepts: [
          "أمارس خطوات تثبيت وإزالة برنامج على جهازي",
          "أوصل الأجهزة الملحقة بالكمبيوتر الخاص بي",
          "أشرح خطوات تنزيل الملفات المضغوطة على جهازي",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "البريد الإلكتروني",
        bookFrom: 42,
        concepts: [
          "أشرح عناصر البريد الإلكتروني",
          "أمارس خطوات إنشاء بريد إلكتروني",
          "أناقش الخدمات التي يقدمها البريد الإلكتروني في التعامل مع مواقع الإنترنت",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "الحوسبة السحابية",
        bookFrom: 56,
        concepts: [
          "أشرح أهمية الحوسبة السحابية في إنجاز مهامي",
          "أستنتج مجالات استخدام الحوسبة السحابية في حياتنا",
          "أمارس رفع ملفاتي على الحوسبة السحابية ومشاركتها مع زملائي",
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        title: "جوجل ميت وإدارة مشروعك",
        bookFrom: 66,
        concepts: [
          "أجري اجتماعًا مع زملائي عبر جوجل ميت",
          "أتبع الإجراءات الصحيحة للتواصل الرقمي مع زملائي",
          "أشارك الملفات مع زملائي عبر تطبيق جوجل ميت",
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        title: "تصميم قواعد البيانات",
        bookFrom: 75,
        concepts: [
          "أشرح مفهوم البيانات الضخمة",
          "أحدد الفرق بين إنشاء جدول عن طريق برامج (Word - Excel - Access)",
          "أنشئ جدول بيانات بسيط على برنامج Access",
        ],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        title: "النماذج والاستعلامات",
        bookFrom: 87,
        concepts: [
          "أشرح خطوات تنفيذ نموذج في قواعد البيانات",
          "أجري استعلامًا في قواعد البيانات التي قمت بتنفيذها",
          "أستخدم عمليات إضافة حقل وإخفاء حقل من نتيجة الاستعلام لقاعدة البيانات",
        ],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        title: "مشروعك الرقمى",
        bookFrom: 99,
        concepts: [
          "أشرح مراحل تصميم مشروعي البحثي",
          "أصمم أحد المشروعات التي أتطلع إليها",
          "أذكر مصادر المعلومات عند استخدامها",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the chapter's opener (for the first
 * lesson) or its own divider page, up to the page before the next lesson
 * starts, or the chapter's last page for its last lesson. Deriving the end this
 * way keeps the opener and each lesson's exercise block inside the lesson they
 * belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ICT_P1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ICT_P1_T1_UNITS.forEach((unit, ui) => {
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
  "ict-p1-t1",
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
// PHASE 80 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints in its running foot, or null when the
 * last line is not a footer. This book prints the bare number alone on the last
 * line of every content page (the closed form «٥», «١١», …), so the last
 * non-empty line is the footer iff it is exactly one number.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const last = lines[lines.length - 1];
  if (!last) return null;
  const latin = toLatinDigits(last);
  if (!/^\d+$/.test(latin)) return null;
  return Number(latin);
}

/**
 * OCR noise the reading of a footer can slip into (book page → printed number
 * read). Empty for the text layer's clean feet; filled from any repeated
 * findings `assertTreeMatchesTheBook` reports while the OCR backfill lands.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * Strips everything but letters and digits, so OCR spacing cannot break a
 * match. NFKC first: the text-layer corpus carries Arabic presentation forms,
 * and it is a no-op on the backfilled Gemini output. The ي/ى fold lets a clean
 * title match the glyphs the book actually prints (الرقمى / الرقمية).
 */
function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[ي]/g, "ى")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * the unit, the unit tiles the book without gaps or overlaps, and it starts
 * where the contents page says. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ICT_P1_T1_UNITS;
  const keys = new Set<string>();

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الفصل ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      if (keys.has(lesson.key)) problems.push(`مفتاح درس مكرر: «${lesson.key}»`);
      keys.add(lesson.key);
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الدرس ${li + 1} في الفصل: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (lesson.bookFrom < unit.bookFrom || lesson.bookFrom > unit.bookTo) {
        problems.push(
          `الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق الفصل ${unit.bookFrom}–${unit.bookTo}`,
        );
      }
      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق الفصل ${unit.bookFrom}–${unit.bookTo}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر الفصل ${unit.bookFrom}، وجدنا ${from}`);
      }
    });
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_ICT_P1_T1_BOOK_START) {
    problems.push(`الفصل الأول يجب أن يبدأ من الصفحة ${EGYPT_ICT_P1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ICT_P1_T1_BOOK_END) {
    problems.push(`الفصل الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ICT_P1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
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
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const ranges = allLessonRanges();
  let footersChecked = 0;

  const files = existsSync(OCR_DIR)
    ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort()
    : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ICT_P1_T1_BOOK_START || book > EGYPT_ICT_P1_T1_BOOK_END) continue;
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
      const misread = FOOTER_OCR_MISREADS[book];
      if (footer !== book && footer !== misread) {
        problems.push(`صفحة الكتاب ${book}: الفوتر المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_ICT_P1_T1_BOOK_END - EGYPT_ICT_P1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ICT_P1_T1_BOOK_START} و${EGYPT_ICT_P1_T1_BOOK_END}`,
    );
  }
  if (files.length === 0) problems.push(`لا يوجد نسيج OCR لكتاب تكنولوجيا المعلومات (${OCR_DIR}) — مطلوب مسح الكتاب أولًا`);
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's divider page prints its title.
  EGYPT_ICT_P1_T1_UNITS.forEach((unit) => {
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