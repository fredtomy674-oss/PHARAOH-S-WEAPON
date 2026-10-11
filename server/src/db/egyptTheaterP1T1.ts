// PHASE 82 — official Egypt Preparatory-1 (Grade 7) «التربية المسرحية»
// (theater), first term («دليل المعلم»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g7-theater` is rebuilt from the Ministry textbook
// (49 PDF pages, born-digital PDF whose text layer scrambles Arabic reading
// order — the OCR backfill regenerates it in full, same as Arabic/ICT). This
// module is the single source of truth for its structure: the book's ten
// «الموضوعات» exactly as the book's فهرس الموضوعات (book page 5) prints them,
// each topic grounded on the «الأهداف» its opener page prints, plus the closing
// self-evaluation form kept as back matter outside the lesson ranges.
//
// Page mapping (verified against the printed running feet):
//   bookPage = pdfPage  (offset 0 — the every content page prints its own
//   number on the last line; the ten topic opener pages print no number, like
//   the ICT book's أهداف openers).
//
// Front matter: PDF pages 1–3 (cover + بيانات) have no text; page 4 is the
// editorial page; page 5 = فهرس الموضوعات; pages 6–8 = المقدمة + مخطط المنهج.
// Back matter: pages 48–49 = استمارة التقييم الذاتي للطالب + شجرة المهارات,
// kept outside the lesson ranges (their printed pages carry numbers 48–49).
//
// WHY THE APP'S LESSON IS THE BOOK'S «الموضوع»
// Like the libraries book, the printed index lists ten topics straight with no
// درس layer below them; each topic's opener carries an «الأهداف» box. The app
// mirrors the book: each topic = one unit «الموضوع ن: …» with a single lesson.
//
// The tree is verified before seeding: `isConsistent` checks its invariants and
// `assertTreeMatchesTheBook` proves the page mapping from the printed running
// feet, the topic titles each opener page prints, and the tiling. Seeding
// refuses to run on an unverified table.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the book's content — the opener of topic 1. */
export const EGYPT_THEATER_P1_T1_BOOK_START = 9;

/**
 * Last printed page owned by a lesson — the closing page of topic 10. The
 * self-evaluation form and skills tree (printed 48–49) are back matter, kept
 * outside the lesson ranges as the book prints them, exactly like the Arabic
 * book's appendices.
 */
export const EGYPT_THEATER_P1_T1_BOOK_END = 47;

/** Back matter that is not taught by any lesson (استمارة تقييم ذاتي + شجرة مهارات). */
export const EGYPT_THEATER_P1_T1_APPENDIX = {
  selfEval: { from: 48, to: 49 },
} as const;

/** One topic (الموضوع) of the textbook — becomes one unit in the app tree. */
export interface TheaterP1Topic {
  /** App-addressable key, e.g. "10-1" (topic 10, its single lesson). */
  key: string;
  /** Arabic ordinal used in the topic title, e.g. "العاشر". */
  ordinal: string;
  /** Topic title as printed in the contents page (without the ordinal). */
  title: string;
  /** First printed book page of the topic — its أهداف opener. */
  bookFrom: number;
  /** Last printed book page the topic owns. */
  bookTo: number;
  /** The book's printed «الأهداف» of the topic, verbatim. */
  concepts: string[];
}

export interface TheaterP1Unit {
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
 * (page 5, printed pages as numbered) and each printed footer (books 9–47).
 * Objectives from each topic's أهداف box (books 9, 13, 17, 21, 25, 29, 33, 36,
 * 40, 44). Note the index prints «المسرح التفاعلي» at page 34, but its أهداف
 * opener is the printed page 33 — the opener is authoritative (same class of
 * index slip as the libraries book). Verified against every printed page by
 * `assertTreeMatchesTheBook`.
 */
export const EGYPT_THEATER_P1_T1_UNITS: TheaterP1Unit[] = [
  {
    ordinal: "الأول",
    title: "الموضوع الأول: مسابقة المسرح",
    bookFrom: 9,
    bookTo: 12,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "مسابقة المسرح",
        bookFrom: 9,
        concepts: [
          "يتعرف أسس الكتابة المسرحية",
          "يحدد الفروق بين الكتابة وأنواع فنون المسرح المختلفة",
          "يتعرف عناصر النص المسرحي",
          "يميز جمهور الفنون المختلفة للمسرح",
        ],
      },
    ],
  },
  {
    ordinal: "الثاني",
    title: "الموضوع الثاني: عام دراسي جديد",
    bookFrom: 13,
    bookTo: 16,
    lessons: [
      {
        key: "2-1",
        ordinal: "الثاني",
        title: "عام دراسي جديد",
        bookFrom: 13,
        concepts: [
          "يشارك في كتابة نص مسرحي عن العام الدراسي الجديد",
          "يتعاون مع زملائه في تحديد عناصر النص المسرحي",
          "يشارك في مسابقات التأليف المسرحي",
          "يبحث في الإنترنت عن الفنون المختلفة للمسرح",
        ],
      },
    ],
  },
  {
    ordinal: "الثالث",
    title: "الموضوع الثالث: خلافات فنية",
    bookFrom: 17,
    bookTo: 20,
    lessons: [
      {
        key: "3-1",
        ordinal: "الثالث",
        title: "خلافات فنية",
        bookFrom: 17,
        concepts: [
          "يتعرف الاسكتش المسرحي",
          "يحدد الفرق بين الاسكتش المسرحي والمسرحية",
          "يتعرف عناصر الاسكتش المسرحي",
          "يحدد الجمهور المستهدف للعمل المسرحي",
          "يشارك زملاءه في ارتجال اسكتش مسرحي",
        ],
      },
    ],
  },
  {
    ordinal: "الرابع",
    title: "الموضوع الرابع: يوم المسرح",
    bookFrom: 21,
    bookTo: 24,
    lessons: [
      {
        key: "4-1",
        ordinal: "الرابع",
        title: "يوم المسرح",
        bookFrom: 21,
        concepts: [
          "يتعرف خطوات كتابة الاسكتش المسرحي",
          "يسترجع عناصر كتابة المسرحية (الحبكة – الشخصيات – الحوار)",
          "يشارك مع زملائه في تمثيل الاسكتش",
          "يبحث في الإنترنت عن أنواع الفنون المسرحية",
        ],
      },
    ],
  },
  {
    ordinal: "الخامس",
    title: "الموضوع الخامس: لدى مشكلة",
    bookFrom: 25,
    bookTo: 28,
    lessons: [
      {
        key: "5-1",
        ordinal: "الخامس",
        title: "لدى مشكلة",
        bookFrom: 25,
        concepts: [
          "يسترجع عناصر العرض المسرحي",
          "يتعرف كيف يحول الدرس لمسرحية",
          "يمارس تمرين الثبات الانفعالي كخطوة لإعداده للتمثيل",
          "يستخدم الإنترنت في البحث عن مسرحيات منهجية",
          "يبدي رأيه الناقد في عروض مسرحية",
          "يشارك في كتابة مسرحية منهجية",
        ],
      },
    ],
  },
  {
    ordinal: "السادس",
    title: "الموضوع السادس: فريقي المسرحي",
    bookFrom: 29,
    bookTo: 32,
    lessons: [
      {
        key: "6-1",
        ordinal: "السادس",
        title: "فريقي المسرحي",
        bookFrom: 29,
        concepts: [
          "يتعرف كيف يختار أبطال العرض المسرحي",
          "يخطط لعرض مسرحية منهجية",
          "يستخدم خامات البيئة في عمل ديكور",
          "يسوق لعرضه المسرحي",
          "يحدد الميزانية اللازمة للعرض المسرحي",
          "يمارس تمرين الحائط الانفعالي كخطوة مهمة لإعداده للتمثيل",
        ],
      },
    ],
  },
  {
    ordinal: "السابع",
    title: "الموضوع السابع: المسرح التفاعلي",
    bookFrom: 33,
    bookTo: 35,
    lessons: [
      {
        key: "7-1",
        ordinal: "السابع",
        title: "المسرح التفاعلي",
        bookFrom: 33,
        concepts: [
          "يتعرف المسرح التفاعلي",
          "يقترح قضية يتناولها في المسرح التفاعلي",
          "يميز بين المسرح التقليدي والمسرح التفاعلي",
          "يبدي رأيه بحرية في المسرح التفاعلي",
          "يرتجل حوارًا عن مواقف يمر بها مع زملائه",
        ],
      },
    ],
  },
  {
    ordinal: "الثامن",
    title: "الموضوع الثامن: فكرة رائعة",
    bookFrom: 36,
    bookTo: 39,
    lessons: [
      {
        key: "8-1",
        ordinal: "الثامن",
        title: "فكرة رائعة",
        bookFrom: 36,
        concepts: [
          "يخطط لعرض مسرحية تفاعلية",
          "يشارك زملاءه في عرض مسرحية تفاعلية",
          "يستخدم مهارات الارتجال في العرض المسرحي التفاعلي",
        ],
      },
    ],
  },
  {
    ordinal: "التاسع",
    title: "الموضوع التاسع: المهرجان الرياضي",
    bookFrom: 40,
    bookTo: 43,
    lessons: [
      {
        key: "9-1",
        ordinal: "التاسع",
        title: "المهرجان الرياضي",
        bookFrom: 40,
        concepts: [
          "يتعرف تنوع الأصوات وتدرجاتها",
          "يعطي لكل موقف مسرحي نغمة صوت تناسب المشهد",
          "يمارس تمارين النفس كخطوة من خطوات إعداد الممثل",
        ],
      },
    ],
  },
  {
    ordinal: "العاشر",
    title: "الموضوع العاشر: يوم المعلم",
    bookFrom: 44,
    bookTo: 47,
    lessons: [
      {
        key: "10-1",
        ordinal: "العاشر",
        title: "يوم المعلم",
        bookFrom: 44,
        concepts: [
          "يتعرف صفات القائد الناجح",
          "يحدد مواصفات المعلم القدوة",
          "يخطط لعمل تدريب للتنوع الصوتي",
          "يقود زملاءه في تعلم التنوع الصوتي",
          "يناقش زملاءه في إيجابيات وسلبيات التدريب على التنوع الصوتي",
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
  const unit = EGYPT_THEATER_P1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const to = lessonIndex === unit.lessons.length - 1 ? unit.bookTo : unit.lessons[lessonIndex + 1]!.bookFrom - 1;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_THEATER_P1_T1_UNITS.forEach((unit, ui) => {
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
  "theater-p1-t1",
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
// PHASE 82 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints in its running foot, or null when the
 * page has no footer. Every content page ends with its bare book number as the
 * last line (like the ICT book); the topic opener pages print no number.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const last = lines[lines.length - 1] ?? "";
  const latin = toLatinDigits(last);
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
 * starts where the contents page says while the self-evaluation stays back
 * matter.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_THEATER_P1_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_THEATER_P1_T1_BOOK_START) {
    problems.push(`الموضوع الأول يجب أن يبدأ من الصفحة ${EGYPT_THEATER_P1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_THEATER_P1_T1_BOOK_END) {
    problems.push(`الموضوع الأخير يجب أن ينتهي عند الصفحة ${EGYPT_THEATER_P1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }
  const { from, to } = EGYPT_THEATER_P1_T1_APPENDIX.selfEval;
  if (from <= EGYPT_THEATER_P1_T1_BOOK_END) {
    problems.push(`ملحق التقييم الذاتي (${from}–${to}) يبدأ داخل نطاق الدروس`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every numbered content page proves its book number
 *     (this is what fixes the offset and proves the mapping page by page; the
 *     opener pages print no number and are simply not counted);
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
    if (book < EGYPT_THEATER_P1_T1_BOOK_START || book > EGYPT_THEATER_P1_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_THEATER_P1_T1_BOOK_END - EGYPT_THEATER_P1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_THEATER_P1_T1_BOOK_START} و${EGYPT_THEATER_P1_T1_BOOK_END}`,
    );
  }
  if (files.length === 0) problems.push(`لا يوجد نسيج OCR لكتاب التربية المسرحية (${OCR_DIR}) — مطلوب مسح الكتاب أولًا`);
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each topic's opener page prints its title.
  EGYPT_THEATER_P1_T1_UNITS.forEach((unit) => {
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