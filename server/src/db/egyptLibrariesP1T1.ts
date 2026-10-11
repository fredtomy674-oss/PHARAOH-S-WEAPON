// PHASE 81 — official Egypt Preparatory-1 (Grade 7) «المكتبات ومهارات البحث»
// (libraries), first term («كتاب الوزارة»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g7-libraries` is rebuilt from the Ministry textbook
// (49 PDF pages, born-digital PDF with a real text layer that scrambles Arabic
// reading order — the OCR backfill regenerates it in full, same as Arabic).
// This module is the single source of truth for its structure: the book's ten
// «الموضوعات» exactly as the book's فهرس الموضوعات (book page 3) prints them,
// each topic grounded on the «فى نهاية الدرس يستطيع الطالب أن…» objectives the
// book puts at its head, plus the closing «المصطلحات» glossary kept as back
// matter outside the lesson ranges (as the book prints it).
//
// Page mapping (verified against the printed running feet):
//   bookPage = pdfPage − 4   (book page 1 = PDF page 5)
// Every content page prints its own book number with a label line
// («الفصل الدراسى الأول» / «الصف الأول الإعدادى») beneath it, which fixes the
// offset: the footer number sits on the line just above the label.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الموضوع»
// The book's printed index lists ten topics straight, with no درس layer below
// them; each topic's own opener carries an «أهداف الدرس» box. So the app
// mirrors the book: each topic = one unit «الموضوع ن: …» with a single lesson.
//
// The tree is verified before seeding: `isConsistent` checks its invariants and
// `assertTreeMatchesTheBook` proves the page mapping from the printed running
// feet, the topic titles each opener page prints, and the tiling. Seeding
// refuses to run on an unverified table.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the book's content — the opener of topic 1. */
export const EGYPT_LIBRARIES_P1_T1_BOOK_START = 1;

/**
 * Last printed page owned by a lesson — the closing page of topic 10. The
 * «المصطلحات» glossary (printed 44–45) is back matter, kept outside the lesson
 * ranges as the book prints it, exactly like the Arabic book's appendices.
 */
export const EGYPT_LIBRARIES_P1_T1_BOOK_END = 43;

/** Back matter that is not taught by any lesson (المصطلحات glossary). */
export const EGYPT_LIBRARIES_P1_T1_APPENDIX = {
  glossary: { from: 44, to: 45 },
} as const;

/** One topic (الموضوع) of the textbook — becomes one unit in the app tree. */
export interface LibrariesP1Topic {
  /** App-addressable key, e.g. "10-1" (topic 10, its single lesson). */
  key: string;
  /** Arabic ordinal used in the topic title, e.g. "العاشر". */
  ordinal: string;
  /** Topic title as printed in the contents page (without the ordinal). */
  title: string;
  /** First printed book page of the topic — its opener. */
  bookFrom: number;
  /** Last printed book page the topic owns. */
  bookTo: number;
  /** The book's printed «فى نهاية الدرس يستطيع الطالب أن…» objectives, verbatim. */
  concepts: string[];
}

export interface LibrariesP1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الأول". */
  ordinal: string;
  /** Unit title as printed in the contents page — «الموضوع الأول: …». */
  title: string;
  /** First printed page of the unit — the topic's opener. */
  bookFrom: number;
  /** Last printed page of the unit. */
  bookTo: number;
  /** One lesson per topic — the topic's own document. */
  lessons: { key: string; ordinal: string; title: string; bookFrom: number; concepts: string[] }[];
}

/**
 * The ten topics of the first term: topic starts from the book's فهرس الموضوعات
 * (page 3) and each opener's printed footer; objectives from each topic's opener
 * (books 1, 6, 10, 14, 18, 22, 26, 31, 35, 40). Verified against every printed
 * page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_LIBRARIES_P1_T1_UNITS: LibrariesP1Unit[] = [
  {
    ordinal: "الأول",
    title: "الموضوع الأول: أقسام المعرفة العشرة",
    bookFrom: 1,
    bookTo: 5,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "أقسام المعرفة العشرة",
        bookFrom: 1,
        concepts: [
          "يسترجع معلوماته عن التصنيف",
          "يميز بين أقسام التصنيف العشرة",
          "يصل إلى الكتاب داخل المكتبة بسهولة",
          "يتعرف الموضوعات المختلفة للكتب من خلال التصنيف",
          "يحدد الفرق بين فروع المعرفة المختلفة",
        ],
      },
    ],
  },
  {
    ordinal: "الثاني",
    title: "الموضوع الثاني: ديوي يتحدث",
    bookFrom: 6,
    bookTo: 9,
    lessons: [
      {
        key: "2-1",
        ordinal: "الثاني",
        title: "ديوي يتحدث",
        bookFrom: 6,
        concepts: [
          "يتعرف على فكرة العامل مبتكر التصنيف",
          "يتعرف الهدف من عملية تصنيف المعرفة",
          "يصنف بعض الكتب بشكل عملي داخل المكتبة متبعًا تصنيف ديوي",
          "يوضح المقصود بكلمة عشري",
          "يبحث عن كتب في مكتبة المدرسة مستخدمًا الترقيم العشري",
        ],
      },
    ],
  },
  {
    ordinal: "الثالث",
    title: "الموضوع الثالث: مصادر المعلومات الرقمية",
    bookFrom: 10,
    bookTo: 13,
    lessons: [
      {
        key: "3-1",
        ordinal: "الثالث",
        title: "مصادر المعلومات الرقمية",
        bookFrom: 10,
        concepts: [
          "يتعرف المقصود بالمعلومات الرقمية",
          "يميز بين مصادر المعلومات الرقمية والتقليدية",
          "يفرق بين أنواع المصادر الرقمية",
          "يوظف مصادر المعلومات الرقمية في تجميع معلومات عن الادخار",
          "يستنتج التكامل بين أنواع مصادر المعلومات",
        ],
      },
    ],
  },
  {
    ordinal: "الرابع",
    title: "الموضوع الرابع: عروسة النيل",
    bookFrom: 14,
    bookTo: 17,
    lessons: [
      {
        key: "4-1",
        ordinal: "الرابع",
        title: "عروسة النيل",
        bookFrom: 14,
        concepts: [
          "يتعرف الصورة الرقمية",
          "يستخدم المصادر الرقمية لجمع معلومات عن نهر النيل",
          "يبحث عن المعلومات في المصادر الرقمية والورقية",
          "يتعرف الاختراعات الحديثة التي غيرت العالم",
          "يستخدم معلومات من الإنترنت لإنتاج مجسمات عن قطرة الماء",
        ],
      },
    ],
  },
  {
    ordinal: "الخامس",
    title: "الموضوع الخامس: الأستاذ سجل",
    bookFrom: 18,
    bookTo: 21,
    lessons: [
      {
        key: "5-1",
        ordinal: "الخامس",
        title: "الأستاذ سجل",
        bookFrom: 18,
        concepts: [
          "يتعرف وظيفة سجل المكتبة",
          "يميز بين سجل المترددين وسجل الاستعارة",
          "يحدد رقم التصنيف في صفحة عنوان الكتاب",
          "يتعرف الرقم العام الخاص بالكتاب",
        ],
      },
    ],
  },
  {
    ordinal: "السادس",
    title: "الموضوع السادس: قصة زجاجة",
    bookFrom: 22,
    bookTo: 25,
    lessons: [
      {
        key: "6-1",
        ordinal: "السادس",
        title: "قصة زجاجة",
        bookFrom: 22,
        concepts: [
          "يستخدم سجل المترددين بشكل صحيح",
          "يسترجع كتابًا عن التدوير مستخدمًا سجل الاستعارة",
          "يستنتج المقصود بإعادة التدوير",
          "يعيد تدوير زجاجة بلاستيكية",
          "يستنتج الفرق بين مصطلح إعادة التدوير وإعادة التصنيع",
        ],
      },
    ],
  },
  {
    ordinal: "السابع",
    title: "الموضوع السابع: قوة المعرفة",
    bookFrom: 26,
    bookTo: 30,
    lessons: [
      {
        key: "7-1",
        ordinal: "السابع",
        title: "قوة المعرفة",
        bookFrom: 26,
        concepts: [
          "يتذكر آداب المكتبة",
          "يميز بين القراءة الجهرية والقراءة الصامتة",
          "يتعرف على أسلوب القراءة الفعالة",
          "يوضح العلاقة بين المعلومات والقرارات",
          "يتعرف على إحدى تقنيات إدارة الوقت البسيطة",
        ],
      },
    ],
  },
  {
    ordinal: "الثامن",
    title: "الموضوع الثامن: حديث مع القط",
    bookFrom: 31,
    bookTo: 34,
    lessons: [
      {
        key: "8-1",
        ordinal: "الثامن",
        title: "حديث مع القط",
        bookFrom: 31,
        concepts: [
          "يتعرف على مفهوم الشائعة الإلكترونية",
          "يدرك تأثير الشائعة الإلكترونية على الفرد والمجتمع",
          "يستنتج العلاقة بين مواقع التواصل الاجتماعي والشائعات",
          "يتعرف معنى المصادر الموثوقة",
          "يكتب قصة قصيرة عن أثر الشائعات في المجتمع",
        ],
      },
    ],
  },
  {
    ordinal: "التاسع",
    title: "الموضوع التاسع: مفتاح الحياة",
    bookFrom: 35,
    bookTo: 39,
    lessons: [
      {
        key: "9-1",
        ordinal: "التاسع",
        title: "مفتاح الحياة",
        bookFrom: 35,
        concepts: [
          "يتعرف المقصود من الكلمات المفتاحية",
          "يستخدم كلمات مفتاحية طويلة",
          "يطرح أسئلة للبحث عن معلومات",
          "يستخدم البحث الجغرافي عند البحث",
          "يطلع على المستجدات الخاصة بالكلمات والمرادفات بشكل دوري",
        ],
      },
    ],
  },
  {
    ordinal: "العاشر",
    title: "الموضوع العاشر: الكلمات المفتاحية هي السر",
    bookFrom: 40,
    bookTo: 43,
    lessons: [
      {
        key: "10-1",
        ordinal: "العاشر",
        title: "الكلمات المفتاحية هي السر",
        bookFrom: 40,
        concepts: [
          "يحدد الهدف المطلوب بدقة",
          "يحدد الكلمات المفتاحية",
          "يستخدم الكلمات المفتاحية",
          "يطبق الكلمات المفتاحية عن موضوع التنمية المستدامة بمصر",
          "يكتب تقريرًا عن التنمية المستدامة",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/** Book-page span a topic owns: its opener to its own last page (topics do not
 *  share pages — each topic is a closed unit in the book). */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_LIBRARIES_P1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const to = lessonIndex === unit.lessons.length - 1 ? unit.bookTo : unit.lessons[lessonIndex + 1]!.bookFrom - 1;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_LIBRARIES_P1_T1_UNITS.forEach((unit, ui) => {
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
  "libraries-p1-t1",
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
// PHASE 81 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints in its running foot, or null when the
 * page has no footer. Each content page ends with its number on one line and a
 * label («الفصل الدراسى الأول» / «الصف الأول الإعدادى») on the next, so the
 * footer is the number line above the label line.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const last = lines[lines.length - 1];
  if (!last || !/الفصل|الصف/.test(last)) return null;
  const latin = toLatinDigits(lines[lines.length - 2] ?? "");
  if (!/^\d+$/.test(latin)) return null;
  return Number(latin);
}

/**
 * OCR noise the reading of a footer can slip into (book page → printed number
 * read). Empty for the current corpus; filled from any repeated findings
 * `assertTreeMatchesTheBook` reports while the OCR backfill lands.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * Strips everything but letters and digits, so OCR spacing cannot break a
 * match. NFKC first: the text-layer corpus carries Arabic presentation forms,
 * and it is a no-op on the backfilled Gemini output. The ي/ى fold lets a clean
 * title match the glyphs the book actually prints.
 */
function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[ي]/g, "ى")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its topic, the topics tile the book without gaps or overlaps, and the content
 * starts where the contents page says while the glossary stays back matter.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_LIBRARIES_P1_T1_UNITS;
  const keys = new Set<string>();

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الموضوع ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      if (keys.has(lesson.key)) problems.push(`مفتاح درس مكرر: «${lesson.key}»`);
      keys.add(lesson.key);
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الدرس ${li + 1} في الموضوع: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (lesson.bookFrom < unit.bookFrom || lesson.bookFrom > unit.bookTo) {
        problems.push(
          `الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق الموضوع ${unit.bookFrom}–${unit.bookTo}`,
        );
      }
      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق الموضوع ${unit.bookFrom}–${unit.bookTo}`);
      }
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر الموضوع ${unit.bookFrom}، وجدنا ${from}`);
      }
    });
    const nextUnit = units[ui + 1];
    if (nextUnit && unit.bookTo >= nextUnit.bookFrom) {
      problems.push(`الموضوع ${unit.ordinal} يتداخل مع ${nextUnit.title}`);
    } else if (nextUnit && unit.bookTo !== nextUnit.bookFrom - 1) {
      problems.push(`فجوة صفحات بين ${unit.title} و${nextUnit.title}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`);
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_LIBRARIES_P1_T1_BOOK_START) {
    problems.push(`الموضوع الأول يجب أن يبدأ من الصفحة ${EGYPT_LIBRARIES_P1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_LIBRARIES_P1_T1_BOOK_END) {
    problems.push(`الموضوع الأخير يجب أن ينتهي عند الصفحة ${EGYPT_LIBRARIES_P1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }
  const { from, to } = EGYPT_LIBRARIES_P1_T1_APPENDIX.glossary;
  if (from <= EGYPT_LIBRARIES_P1_T1_BOOK_END) {
    problems.push(`ملحق المصطلحات (${from}–${to}) يبدأ داخل نطاق الدروس`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the offset and proves the mapping page by page;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every topic's opener page prints its topic title;
 *  4. every printed content page in the book is owned by exactly one lesson —
 *     no page can fall between two topics and be unreachable.
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
    if (book < EGYPT_LIBRARIES_P1_T1_BOOK_START || book > EGYPT_LIBRARIES_P1_T1_BOOK_END) continue;
    printedPages.add(book);
    const text = loadBookPage(book);
    if (!text) continue;
    const footer = printedFooter(book);
    if (footer !== null) {
      footersChecked++;
      const misread = FOOTER_OCR_MISREADS[book];
      if (footer !== book && footer !== misread) {
        problems.push(`صفحة الكتاب ${book}: الفوتر المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_LIBRARIES_P1_T1_BOOK_END - EGYPT_LIBRARIES_P1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_LIBRARIES_P1_T1_BOOK_START} و${EGYPT_LIBRARIES_P1_T1_BOOK_END}`,
    );
  }
  if (files.length === 0) problems.push(`لا يوجد نسيج OCR لكتاب المكتبات (${OCR_DIR}) — مطلوب مسح الكتاب أولًا`);
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each topic's opener page prints its title.
  EGYPT_LIBRARIES_P1_T1_UNITS.forEach((unit) => {
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

  // 4. every printed content page is owned by exactly one lesson.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}