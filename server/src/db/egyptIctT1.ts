// PHASE 62 — official Egypt Grade-6 ICT, first term («كتاب الوزارة»).
//
// The curriculum tree for the Egypt `eg-g6-ict` curriculum is rebuilt from the
// Ministry textbook `ICT_Arabic_Primary6_T1.pdf` (2026/2027 MoE edition, 57
// pages, all OCR'd). This module is the single source of truth for its
// structure: the two units and their six lessons each, exactly as the book's
// قائمة المحتويات (book page 5) prints them, and the lesson objectives the book
// prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage   (book page 8 = PDF page 8)
// Every content page prints its own book number in the running foot
// («تكنولوجيا المعلومات والاتصالات - الصف السادس الابتدائي ٨» or
// «٥٦ تكنولوجيا المعلومات والاتصالات...»), which is what fixes the offset at 0.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس»
// The book's printed index stops at the lesson (two units × six lessons); it has
// no «مفهوم» layer. So the app mirrors the book: unit → lesson. Each lesson's RAG
// document is the whole lesson (its pages, including the «الأسئلة وتدريبات»
// exercise block the book places at the end of it).
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER
// Unit 1 opens on book page 7 (title + «دور تكنولوجيا المعلومات في حياتنا») and
// unit 2 on book page 28, before their first lesson's own page (8 and 29). The
// opener is not a lesson, so — exactly as the social/maths books do — it rides
// with the unit's first lesson. A lesson's own `bookFrom` is still stored; the
// range it owns is derived as "from the unit's first page, down to the page
// before the next lesson starts, bounded by the unit".

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book page 8 = PDF 8). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_ICT_T1_BOOK_START = 7;

/** Last printed content page — the second page of unit 2 lesson 6 exercises. */
export const EGYPT_ICT_T1_BOOK_END = 57;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface IctT1Lesson {
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
  /**
   * The book's printed «أهداف الدرس» for this lesson (the only per-lesson list
   * the book prints; there is no «مفهوم»/«مكوّن» layer in this book).
   */
  concepts: string[];
}

export interface IctT1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "الوحدة الأولى: دور تكنولوجيا المعلومات في حياتنا". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: IctT1Lesson[];
}

/**
 * The two units of the first term with their twelve lessons: unit/lesson starts
 * from the book's contents page (5), objectives from each lesson's first page
 * (8, 11, …). Verified against every printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_ICT_T1_UNITS: IctT1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: دور تكنولوجيا المعلومات في حياتنا",
    bookFrom: 7,
    bookTo: 27,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "شبكات الكمبيوتر",
        bookFrom: 8,
        concepts: [
          "يصف عناصر (مكوّنات) شبكة الكمبيوتر",
          "يصف كيفية عمل أجهزة الشبكة",
          "يناقش بعض مشكلات الاتصال بشبكة الإنترنت، وكيفية التعامل معها",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "التكنولوجيا المستقبلية",
        bookFrom: 11,
        concepts: [
          "يشرح المصطلحات التالية: الواقع الافتراضي، والواقع المعزز، والذكاء الاصطناعي",
          "يذكر أكبر عدد من الأمثلة لتطبيقات الواقع الافتراضي، والواقع المعزز، والذكاء الاصطناعي في حياتنا",
          "يناقش كيفية توظيف التكنولوجيا المتقدمة في حياتنا",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "التكنولوجيا المتطورة لذوي الاحتياجات الخاصة",
        bookFrom: 14,
        concepts: [
          "يناقش تجربة مُستخدمي التكنولوجيا المتطورة",
          "يشارك أفكاره لتطوير منتج تكنولوجي مساعد",
          "يقيم أحد أجهزة التكنولوجيا المتقدمة",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "أدوات البحث الرقمي",
        bookFrom: 17,
        concepts: [
          "يفرق بين الاستخدام التعليمي وغير التعليمي للتطبيقات الرقمية",
          "يستخدم اختصارات لوحة المفاتيح، مثل النسخ والقص واللصق في معالجة النصوص",
          "يفرق بين عمليات البحث في (قاعدة البيانات، مكتبة، وعبر الإنترنت)",
          "يحدد أداة البحث فعالية لإنجاز مهامه",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "كيف تعمل أنظمة تشغيل الأجهزة",
        bookFrom: 20,
        concepts: [
          "يشرح ماهية نظام التشغيل",
          "يقارن بين أنظمة تشغيل أجهزة الكمبيوتر وأنظمة تشغيل الهواتف المحمولة الأكثر شيوعًا",
          "يحدد أنظمة تشغيل أجهزته",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "أنا مصمم مواقع إنترنت",
        bookFrom: 24,
        concepts: [
          "يكتب كود بسيط بلغة ترميز النص التشعبي HTML لأجزاء أساسية من صفحة ويب",
          "يحدد بعض مكونات لغة ترميز النص التشعبي HTML الخاصة بصفحات الويب",
          "يبتكر فكرة ويخطط لإنشاء موقع إلكتروني يروج لمنتج متطور",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: احتياطات الأمن والسلامة الرقمية",
    bookFrom: 28,
    bookTo: 57,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "عالم الألعاب الإلكترونية: متعة وأمان",
        bookFrom: 29,
        concepts: [
          "يناقش مخاطر الألعاب الإلكترونية",
          "يشرح سبل تجنب مخاطر الألعاب الإلكترونية",
          "يحدد تأثير الألعاب الإلكترونية على صحته، ويشرح سبل التعامل مع ذلك من خلال الرعاية الأسرية",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "حماية بياناتي الرقمية",
        bookFrom: 34,
        concepts: [
          "يميز بين الروابط والمواقع الآمنة وغير الآمنة",
          "يحدد الخصائص المختلفة التي يمكنه استخدامها لحماية بياناته",
          "يناقش مسئوليته الشخصية لحماية الأجهزة الرقمية الخاصة به",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "كن بطل الأمن السيبراني",
        bookFrom: 38,
        concepts: [
          "يتعرف مفهوم الأمن السيبراني",
          "يبتكر خطة للتعامل الآمن مع شبكة الإنترنت",
          "يناقش قضايا الأمن السيبراني",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "التداول المالي",
        bookFrom: 43,
        concepts: [
          "يشرح ماهيّة حقوق الطبع والنشر وسبب أهميتها",
          "يناقش مفهوم التداول المالي الإلكتروني",
          "يحدد سُبل الحفاظ على السلامة أثناء استخدام تطبيقات التداول المالي الإلكتروني",
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        title: "الحوسبة السحابية",
        bookFrom: 48,
        concepts: [
          "يشرح مفهوم الحوسبة السحابية",
          "يحدد إيجابيات استخدام الحوسبة السحابية وسلبياتها",
          "يناقش دور الحوسبة السحابية في تخزين الملفات",
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        title: "تطبيقات التخزين السحابي",
        bookFrom: 53,
        concepts: [
          "يناقش أمثلة حول تطبيقات الحوسبة السحابية",
          "يشرح مزايا التخزين السحابي بالمقارنة مع التخزين التقليدي",
          "يحدد كيفية رفع الملفّات أو المجلّدات على OneDrive",
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
 * the unit opener and each lesson's exercise block inside the lesson they belong
 * to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ICT_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ICT_T1_UNITS.forEach((unit, ui) => {
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
  "ict-t1",
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
// PHASE 62 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints in its running foot, or null when the
 * last line is not a footer (unit openers and full-page images print no footer)
 * or carries more than one number. Unlike the science/social books, the ICT foot
 * is a sentence with the number embedded, sometimes leading and sometimes
 * trailing, so the number is extracted rather than assumed bare.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  if (!last || !/الصف السادس|الفصل الدراس|تكنولوجيا المعلومات/.test(last)) return null;
  const runs = toLatinDigits(last).match(/\d+/g) ?? [];
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
  const units = EGYPT_ICT_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_ICT_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_ICT_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ICT_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_ICT_T1_BOOK_END}، وجدنا ${last.bookTo}`);
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

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ICT_T1_BOOK_START || book > EGYPT_ICT_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_ICT_T1_BOOK_END - EGYPT_ICT_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ICT_T1_BOOK_START} و${EGYPT_ICT_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title.
  EGYPT_ICT_T1_UNITS.forEach((unit) => {
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
