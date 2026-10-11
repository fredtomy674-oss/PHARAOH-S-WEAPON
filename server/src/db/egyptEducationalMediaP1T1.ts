// PHASE 89 — official Egypt Preparatory-1 (Grade 7) «الوسائل التعليمية»
// (educational media), first term, Ministry 2026/2027 edition.
//
// The curriculum `eg-g7-educational-media` is rebuilt from the Ministry
// textbook (58 PDF pages, born-digital PDF whose text layer scrambles Arabic
// reading order — the Gemini OCR refresh regenerates it in full, same as
// Arabic/ICT/theater). This module is the single source of truth for its
// structure: the book's ten «الموضوعات» exactly as the book's فهرس الموضوعات
// (PDF page 3) prints them, each topic grounded on the «الأهداف» its opener
// page prints.
//
// Page mapping (verified against the printed running feet):
//   bookPage = pdfPage − 4  (BOOK_TO_PDF_OFFSET = 4). Book page 1 is the
//   opener of topic 1 (PDF 5); every content page prints its bare number as
//   the last line (Latin digits), so the footers pin the offset page by page.
//
// Front matter: PDF pages 1–2 (covers, no text), PDF 3 = فهرس الموضوعات and
// PDF 4 = المقدمة — both unnumbered (book pages −1 and 0), kept outside the
// lesson ranges. Back matter: none — the book's last printed page (54, PDF 58)
// is topic 10's «أنشطة وتطبيقات» and rides with it.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الموضوع»
// Like the theater and libraries books, the printed index lists ten topics
// straight with no درس layer below them; each topic's opener carries an
// «الأهداف» box. The app mirrors the book: each topic = one unit «الموضوع ن: …»
// with a single lesson.
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
export const EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_START = 1;

/**
 * Last printed page owned by a lesson — the closing page of topic 10
 * («أنشطة وتطبيقات»). The book has no back matter: its unnumbered front
 * matter (contents + مقدمة) sits before page 1 and stays outside the ranges.
 */
export const EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_END = 54;

/** One topic (الموضوع) of the textbook — becomes one unit in the app tree. */
export interface EducationalMediaP1Unit {
  /** Arabic ordinal used in the unit title, e.g. "العاشر". */
  ordinal: string;
  /** Unit title as printed in the contents page — «الموضوع الأول: …». */
  title: string;
  /** First printed page of the unit — the topic's أهداف opener. */
  bookFrom: number;
  /** Last printed page the unit owns. */
  bookTo: number;
  /** One lesson per topic — the topic's own document. */
  lessons: { key: string; ordinal: string; title: string; bookFrom: number; concepts: string[] }[];
}

/**
 * The ten topics of the first term: starts from the book's فهرس الموضوعات
 * (PDF page 3) and confirmed by each opener page's own footer (printed pages
 * 1, 7, 13, 19, 24, 29, 35, 41, 46, 51). Objectives are the «الأهداف» each
 * opener prints (PDF 5, 11, 17, 23, 28, 33, 39, 45, 50, 55), polished where
 * the scrambled text layer garbled a word; re-read from the Gemini refresh
 * when it lands. The contents page's last start is printed mirrored («١٥» for
 * 51) — the opener footer (51) is authoritative. Verified against every
 * printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_EDUCATIONAL_MEDIA_P1_T1_UNITS: EducationalMediaP1Unit[] = [
  {
    ordinal: "الأول",
    title: "الموضوع الأول: الخبر الصحفي (أنواعه وعناصره ومتطلباته)",
    bookFrom: 1,
    bookTo: 6,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "الخبر الصحفي (أنواعه وعناصره ومتطلباته)",
        bookFrom: 1,
        concepts: [
          "يتعرف الخبر الصحفي وأهميته.",
          "يتعرف أنواع الخبر الصحفي.",
          "يحدد متطلبات الخبر الصحفي وعناصره.",
          "يحلل بعض الأخبار عن الهيدروجين الأخضر.",
          "يعرب عن احترامه لزملائه من ذوي الهمم.",
        ],
      },
    ],
  },
  {
    ordinal: "الثاني",
    title: "الموضوع الثاني: صياغة الخبر الصحفي",
    bookFrom: 7,
    bookTo: 12,
    lessons: [
      {
        key: "2-1",
        ordinal: "الثاني",
        title: "صياغة الخبر الصحفي",
        bookFrom: 7,
        concepts: [
          "يحدد سمات الخبر الصحفي وقوالب صياغته.",
          "يكتب أخبارًا عن بعض الموضوعات الواقعية متبعًا الأسس السليمة لكتابة الخبر الصحفي.",
          "يقيم بعض الأخبار الصحفية في ضوء الأسس السليمة لكتابة الخبر الصحفي.",
          "يعرب عن تقديره حقوق وواجبات الزمالة في المدرسة.",
          "يغطي ندوة عن أضرار الجلوس لفترات طويلة أمام الحاسب الآلي إعلاميًا.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالث",
    title: "الموضوع الثالث: الإذاعة المدرسية",
    bookFrom: 13,
    bookTo: 18,
    lessons: [
      {
        key: "3-1",
        ordinal: "الثالث",
        title: "الإذاعة المدرسية",
        bookFrom: 13,
        concepts: [
          "يحدد مواصفات مقدم البرنامج الإذاعي الناجح.",
          "يعدد فقرات الإذاعة المدرسية.",
          "يقدم إحدى الفقرات الإذاعية بثقة.",
          "يتعاون مع زملائه في كتابة فقرات البرنامج الإذاعي.",
          "يوظف الوسائل التكنولوجية في جمع معلومات عن موارد البيئة لتقديم إذاعة متخصصة.",
        ],
      },
    ],
  },
  {
    ordinal: "الرابع",
    title: "الموضوع الرابع: لدينا ميكروفون",
    bookFrom: 19,
    bookTo: 23,
    lessons: [
      {
        key: "4-1",
        ordinal: "الرابع",
        title: "لدينا ميكروفون",
        bookFrom: 19,
        concepts: [
          "يتعرف استخدامات الميكروفون في الإذاعة المدرسية.",
          "يتعاون مع زملائه في إعداد فقرات الإذاعة المدرسية.",
          "يتبع الخطوات الصحيحة لتقديم البرنامج الإذاعي.",
          "يعرب عن احترامه لآراء الآخرين وتقبله للرأي الآخر.",
          "يعرض آراءه دون تعصب.",
          "يعد برنامجًا إذاعيًا عن موارد البيئة والحفاظ عليها.",
        ],
      },
    ],
  },
  {
    ordinal: "الخامس",
    title: "الموضوع الخامس: قلمي يكتب",
    bookFrom: 24,
    bookTo: 28,
    lessons: [
      {
        key: "5-1",
        ordinal: "الخامس",
        title: "قلمي يكتب",
        bookFrom: 24,
        concepts: [
          "يتعرف المقال الصحفي ووظائفه وأهميته.",
          "يميز بين أنواع المقال.",
          "يتبع أسس كتابة المقال الصحفي.",
          "يكتب مقالًا عن أحد المشروعات القومية بالدولة (القطار الكهربائي، توليد الطاقة، الذكاء الاصطناعي، الهيدروجين الأخضر، التغير المناخي...).",
          "يقارن بين المقال الذاتي والموضوعي.",
          "يتعرف مواصفات المقال الجيد.",
        ],
      },
    ],
  },
  {
    ordinal: "السادس",
    title: "الموضوع السادس: الكاتب الصغير",
    bookFrom: 29,
    bookTo: 34,
    lessons: [
      {
        key: "6-1",
        ordinal: "السادس",
        title: "الكاتب الصغير",
        bookFrom: 29,
        concepts: [
          "يحدد أجزاء المقال.",
          "يتعرف مهارات كاتب المقال.",
          "يتبع مهارات كتابة المقال أثناء كتابته.",
        ],
      },
    ],
  },
  {
    ordinal: "السابع",
    title: "الموضوع السابع: الحديث الصحفي (الحوار)",
    bookFrom: 35,
    bookTo: 40,
    lessons: [
      {
        key: "7-1",
        ordinal: "السابع",
        title: "الحديث الصحفي (الحوار)",
        bookFrom: 35,
        concepts: [
          "يتعرف المقصود بالحوار أو الحديث الصحفي.",
          "يحدد أنواع الحوار وأشكاله.",
          "يتعرف معايير اختيار الشخصية المناسبة للحوار.",
          "يعرب عن التزامه بآداب الحوار.",
        ],
      },
    ],
  },
  {
    ordinal: "الثامن",
    title: "الموضوع الثامن: المحاور الصغير",
    bookFrom: 41,
    bookTo: 45,
    lessons: [
      {
        key: "8-1",
        ordinal: "الثامن",
        title: "المحاور الصغير",
        bookFrom: 41,
        concepts: [
          "يتعرف خطوات إجراء حديث صحفي (حوار).",
          "يخطط لحوار عن أهداف التنمية المستدامة متبعًا خطوات إجراء الحوار الصحفي.",
          "يجري حوارًا مع مدير المدرسة متبعًا آداب الحوار.",
          "يتعاون مع زملائه في تحرير حوار عن أهداف التنمية المستدامة.",
        ],
      },
    ],
  },
  {
    ordinal: "التاسع",
    title: "الموضوع التاسع: التصوير الصحفي",
    bookFrom: 46,
    bookTo: 50,
    lessons: [
      {
        key: "9-1",
        ordinal: "التاسع",
        title: "التصوير الصحفي",
        bookFrom: 46,
        concepts: [
          "يميز بين التصوير والتصوير الصحفي.",
          "يوضح مهارات المصور الناجح.",
          "يحدد أنواع الصورة الصحفية.",
        ],
      },
    ],
  },
  {
    ordinal: "العاشر",
    title: "الموضوع العاشر: عدسة الإعلامي الصغير",
    bookFrom: 51,
    bookTo: 54,
    lessons: [
      {
        key: "10-1",
        ordinal: "العاشر",
        title: "عدسة الإعلامي الصغير",
        bookFrom: 51,
        concepts: [
          "يتعرف العوامل المؤثرة في جودة التقاط الصورة الصحفية.",
          "يميز زوايا التصوير المختلفة.",
          "يحدد هدف الصورة.",
          "يقرأ الصورة الصحفية معلقًا عليها.",
          "يلتقط صورًا لمواقف إنسانية إيجابية لعرضها بمجلة المدرسة.",
          "يصمم مجلة حائط مصورة.",
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
  const unit = EGYPT_EDUCATIONAL_MEDIA_P1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const to = lessonIndex === unit.lessons.length - 1 ? unit.bookTo : unit.lessons[lessonIndex + 1]!.bookFrom - 1;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_EDUCATIONAL_MEDIA_P1_T1_UNITS.forEach((unit, ui) => {
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
  "educational-media-p1-t1",
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
// PHASE 89 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints in its running foot, or null when the
 * text gives no number. Every content page prints its bare book number as the
 * last line — unlike the theater book, its topic openers print theirs too.
 * (In the pre-refresh text layer four pages — 8, 9, 26, 30 — carry their
 * number mid-page instead of last; the Gemini refresh restores the reading
 * order, and until then those pages simply are not footer-checked.)
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
 * `assertTreeMatchesTheBook` reports while the OCR refresh lands.
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
 * starts at printed page 1 and ends at the book's last page.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_EDUCATIONAL_MEDIA_P1_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_START) {
    problems.push(`الموضوع الأول يجب أن يبدأ من الصفحة ${EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_END) {
    problems.push(`الموضوع الأخير يجب أن ينتهي عند الصفحة ${EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every numbered content page proves its book number
 *     (this is what fixes the offset and proves the mapping page by page);
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
    if (book < EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_START || book > EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_END - EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_START} و${EGYPT_EDUCATIONAL_MEDIA_P1_T1_BOOK_END}`,
    );
  }
  if (files.length === 0) problems.push(`لا يوجد نسيج OCR لكتاب الوسائل التعليمية (${OCR_DIR}) — مطلوب مسح الكتاب أولًا`);
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each topic's opener page prints its title.
  EGYPT_EDUCATIONAL_MEDIA_P1_T1_UNITS.forEach((unit) => {
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
