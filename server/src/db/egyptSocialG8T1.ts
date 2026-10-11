// Egypt Preparatory-2 (Grade 8) Social Studies, first term («كتاب الوزارة»),
// Ministry 2026/2027 edition: «مصر وعلاقتها بآسيا وأوروبا — الأرض والحضارة
// والتنمية».
//
// The curriculum `eg-g8-social` is rebuilt from the Ministry textbook
// `Social_studies_prep2_t1.pdf` (106 scan pages, all OCR'd). This module is the
// single source of truth for its structure: the four units and the general
// review printed in the book's المحتويات (book page 3), and the «أهداف الدرس»
// the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's printed footers):
//   bookPage = pdfPage − 1   (book page 8 = PDF page 9)
// Every content page prints its own number as a bare numeral in the running
// foot («٨» or «8»), which is what fixes the offset at 1 and proves the mapping
// page by page: 87 of the 98 pages carry a readable footer and every one of
// them equals its own book number.
//
// WHAT THE BOOK PRINTS AND WHAT THIS TABLE MIRRORS
// The printed index stops at the lesson: 4 units, 11 lessons, plus a general
// review. Each unit opens on a two-page «الفكرة الرئيسية / نواتج تعلم الوحدة»
// opener and closes on a two-page «تقييم ختامي»; each lesson opens on a page
// that prints its title and its «أهداف الدرس». So — exactly as the Grade-9
// Social, ICT and Christian books do — the app mirrors the index: unit →
// lesson, and each lesson's co-owned pages are the unit opener (with the first
// lesson) and the unit assessment (with the last lesson), which is why
// `bookFrom` is stored for the lesson but the owned range is derived by
// `lessonBookRange`.
//
// WHY THE GENERAL REVIEW IS ITS OWN SECTION
// «المراجعة العامة على الفصل الدراسي الأول» (book pages 96–103) is not part of
// unit 4: it carries its own running head, and it is a different kind of page —
// a bank of review questions plus the term «اختبار». Folding it into unit 4's
// last lesson would hand the tutor 16 pages that jump from Roman Greece to
// exam questions under one lesson heading, so it stands as its own section with
// a single lesson, and its `concepts` are the question instructions the pages
// actually print.
//
// Book pages 0–5 (cover, title page, introduction, contents, curriculum map) and
// 104–105 (credits, back cover) are front/back matter, not taught pages: they
// sit outside the tiled ranges, exactly as they do for the other Ministry books.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.8 = PDF p.9). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First taught page — the unit-1 opener (front matter ends at book page 5). */
export const EGYPT_SOCIAL_G8_T1_BOOK_START = 6;

/** Last taught page — the closing page of the general review. */
export const EGYPT_SOCIAL_G8_T1_BOOK_END = 103;

export interface SocialG8T1Lesson {
  /** Internal key, e.g. "1-1" (unit 1, lesson 1) or "5-1" (the general review). */
  key: string;
  /** Printed ordinal — "الأول" … "الرابع". Empty for the review, which prints no ordinal. */
  ordinal: string;
  /** The lesson title exactly as the contents page prints it (keeps its «.»). */
  title: string;
  /**
   * First printed page of the lesson itself — the page that carries its head
   * and its «أهداف الدرس». Owned pages are derived, not stored:
   * why ownership is derived by `lessonBookRange` rather than stored here.
   */
  bookFrom: number;
  /** The book's printed «أهداف الدرس» (or, for the review, its question instructions). */
  concepts: string[];
}

export interface SocialG8T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Full section title as printed, e.g. "الوحدة الثانية: …". */
  title: string;
  /** First printed page of the section — its opener page (96 for the review). */
  bookFrom: number;
  /** Last printed page (the page before the next section starts). */
  bookTo: number;
  lessons: SocialG8T1Lesson[];
}

/**
 * The four units plus the general review, with their eleven lessons and one
 * review lesson: section/lesson starts from the book's contents page (book
 * page 3), concepts from each lesson's printed «أهداف الدرس». Verified against
 * every printed page by `assertTreeMatchesTheBook`.
 *
 * The ranges below are what the scan prints, not a pattern: unit 1's two
 * lessons run 8 and 8 pages, unit 2's run 8/6/6/6, unit 4's 6/6. The tiling
 * assertion proves the result covers book pages 6–103 exactly once.
 */
export const EGYPT_SOCIAL_G8_T1_UNITS: SocialG8T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: الملامح الطبيعية لقارتي آسيا وأوروبا",
    bookFrom: 6,
    bookTo: 25,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "موقع ومظاهر سطح قارتي آسيا وأوروبا.",
        bookFrom: 8,
        concepts: [
          "أقارن بين الموقع الجغرافي لقارتي آسيا وأوروبا.",
          "أحدد الموقع الفلكي لقارتي آسيا وأوروبا على الخريطة.",
          "أفسر الأهمية الاقتصادية والإستراتيجية والحضارية لموقع قارتي آسيا وأوروبا.",
          "أصف أهم مظاهر السطح في قارتي آسيا وأوروبا.",
          "أعبر عن تقديري لعظمة الله (عز وجل) في تنوع مظاهر سطح قارتي آسيا وأوروبا.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "المعادن ومصادر الطاقة في قارتي آسيا وأوروبا.",
        bookFrom: 16,
        concepts: [
          "أوزع أهم المعادن على خريطة قارتي آسيا وأوروبا.",
          "أستنتج أهمية كل من المعادن ومصادر الطاقة بالنسبة لسكان قارتي آسيا وأوروبا.",
          "أقارن بين مصادر الطاقة الأحفورية ومصادر الطاقة المتجددة في قارتي آسيا وأوروبا.",
          "أفسر أسباب توجه الدول نحو استخدام مصادر الطاقة النظيفة.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: الحضارات القديمة في قارة آسيا وعلاقتها بمصر",
    bookFrom: 26,
    bookTo: 55,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "نماذج للحضارات القديمة بالشرق الأدنى.",
        bookFrom: 28,
        concepts: [
          "أحدد على الخريطة مواقع بعض الحضارات القديمة في قارة آسيا.",
          "أستنتج العوامل التي ساعدت على قيام الحضارات في قارة آسيا.",
          "أقارن بين الملامح الحضارية لكل من بلاد العراق القديم وفينيقيا.",
          "أستخلص مظاهر التواصل بين الحضارة المصرية القديمة وحضارات بلاد العراق القديم وفينيقيا.",
          "أعبر عن تقديري لإسهامات حضارات بلاد العراق القديم وفينيقيا في بناء الحضارة الإنسانية.",
          "أميز بين الحقائق التاريخية والادعاءات المتعلقة بالإنجازات الحضارية لحضارات بلاد العراق القديم وفينيقيا.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "نماذج لحضارات بلاد اليمن القديم.",
        bookFrom: 36,
        concepts: [
          "أحدد أهم الحضارات التي قامت في بلاد اليمن القديم.",
          "أتعرف عوامل نشأة الحضارات في بلاد اليمن القديم.",
          "ألخص الملامح الحضارية لحضارات بلاد اليمن القديم.",
          "أستنتج دور المرأة ومكانتها في المجتمع اليمني القديم.",
          "أدلل على وجود علاقات تاريخية بين حضارات اليمن والحضارة المصرية القديمة.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "نماذج للحضارات القديمة بالشرق الأقصى.",
        bookFrom: 42,
        concepts: [
          "أحدد موقع حضارات الشرق الأقصى القديم على خريطة قارة آسيا.",
          "أستنتج علاقات التأثير والتأثر بين حضارات الشرق الأقصى القديم.",
          "أقارن بين الملامح الحضارية لبعض حضارات الشرق الأقصى القديم.",
          "أعبر عن تقديري لإنجازات حضارات الشرق الأقصى القديم.",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "الحضارة الإسلامية.",
        bookFrom: 48,
        concepts: [
          "أشرح عوامل ازدهار الحضارة الإسلامية.",
          "أحدد على خط زمني مراحل الخلافة الإسلامية.",
          "أستنتج أبرز ملامح الحضارة الإسلامية.",
          "أعبر عن تقديري لدور العلماء المسلمين في تطور المعرفة الإنسانية.",
          "أدلل على تفاعل الحضارة الإسلامية مع الحضارات الأخرى.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: النُّظم البيئية في قارتي آسيا وأوروبا",
    bookFrom: 56,
    bookTo: 79,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "نُظم الغابات في قارتي آسيا وأوروبا.",
        bookFrom: 58,
        concepts: [
          "أحدد الموقع الفلكي والجغرافي لنُظم الغابات في قارتي آسيا وأوروبا.",
          "أقارن بين الخصائص المناخية لنُظم الغابات بقارتي آسيا وأوروبا.",
          "أميز بين الخصائص الحيوية لنُظم الغابات بقارتي آسيا وأوروبا.",
          "أوضح أهمية نُظم الغابات في قارتي آسيا وأوروبا.",
          "أستنتج المخاطر التي تتعرض لها نُظم الغابات في قارتي آسيا وأوروبا.",
          "أعبر عن تقديري لعظمة الله (عز وجل) في خلق نُظم بيئية متنوعة بآسيا وأوروبا.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "نُظم الحشائش ونُظم الصحاري في قارتي آسيا وأوروبا.",
        bookFrom: 64,
        concepts: [
          "أحدد على الخريطة مواقع نُظُم الحشائش في قارتي آسيا وأوروبا.",
          "أقارن بين الخصائص المناخية والحيوية لنُظُم الصحاري في قارتي آسيا وأوروبا.",
          "أفسر تأثير المناخ على الخصائص الحيوية لكل من نُظُم الحشائش والصحاري في قارتي آسيا وأوروبا.",
          "أستنتج المخاطر التي تتعرض لها كل من نُظُم الحشائش والصحاري في قارتي آسيا وأوروبا.",
          "أعبر عن تقديري لعظمة الله (عز وجل) في تنوع نُظُم الحشائش والصحاري في قارتي آسيا وأوروبا.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "النظم البيئية المائية في قارتي آسيا وأوروبا.",
        bookFrom: 70,
        concepts: [
          "أحدد على الخريطة مناطق التوزيع الجغرافي للنظم البيئية المائية في قارتي آسيا وأوروبا.",
          "ألخص خصائص النظم البيئية المائية في قارتي آسيا وأوروبا.",
          "أحلل تأثير الأنشطة البشرية على النظم البيئية المائية في قارتي آسيا وأوروبا.",
          "أستنتج الأخطار التي تتعرض لها النظم البيئية المائية في قارتي آسيا وأوروبا.",
          "أعدد الجهود التي بذلت في قارتي آسيا وأوروبا لحماية النظم البيئية والتنوع البيولوجي.",
        ],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "الوحدة الرابعة: الحضارات القديمة في قارة أوروبا وعلاقتها بمصر",
    bookFrom: 80,
    bookTo: 95,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "الحضارة اليونانية.",
        bookFrom: 82,
        concepts: [
          "أحدد على الخريطة موقع بلاد اليونان.",
          "أقدم نماذج للحضارات القديمة في بلاد اليونان.",
          "ألخص ملامح الحضارات اليونانية القديمة.",
          "أستنتج أحوال مصر أثناء حكم اليونانيين والبطالمة.",
          "أدلل على وجود علاقات قديمة بين الحضارة المصرية وحضارات اليونان.",
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        title: "الحضارة الرومانية.",
        bookFrom: 88,
        concepts: [
          "أحدد على الخريطة موقع الإمبراطورية الرومانية.",
          "ألخص ملامح الحضارة الرومانية.",
          "أدلل على وجود علاقات بين الإمبراطورية الرومانية ومصر.",
          "أستنتج أحوال مصر في ظل حكم الرومان.",
          "أوضح كيفية انتشار المسيحية في مصر وموقف الرومان منها.",
        ],
      },
    ],
  },
  {
    ordinal: "",
    title: "المراجعة العامة على الفصل الدراسي الأول",
    bookFrom: 96,
    bookTo: 103,
    lessons: [
      {
        key: "5-1",
        ordinal: "",
        title: "المراجعة العامة على الفصل الدراسي الأول",
        bookFrom: 96,
        // The review prints no «أهداف الدرس» — it is a question bank plus the
        // term test, so its concepts are the instructions the pages print.
        concepts: [
          "لاحظ الخريطة التالية، ثم اكتب مدلول الأرقام الموقعة عليها",
          "اكتب كلمة (صواب) أمام العبارة الصحيحة، وكلمة (خطأ) أمام العبارة غير الصحيحة مع تصويب الخطأ",
          "اكتب ما تشير إليه كل من العبارات التالية",
          "بم تفسر...؟",
          "ما النتائج المترتبة على...؟",
          "دلل على صحة العبارات التالية",
          "اختبار على الفصل الدراسي الأول",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the section's first page (for its first
 * lesson — the unit opener, or the review's own heading page) or its own start
 * page, up to the page before the next lesson starts, or the section's last page
 * for its last lesson. The unit's «تقييم ختامي» therefore rides with its last
 * lesson, and the general review is a section of its own.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_SOCIAL_G8_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SOCIAL_G8_T1_UNITS.forEach((unit, ui) => {
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
  "social-p2-t1",
);

/**
 * The OCR provider answers a truly blank page with a short sentence instead of
 * an empty string. It means "no text", not content.
 */
const NO_TEXT = /لا يوجد نص/;

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
  return text.length > 0 && !NO_TEXT.test(text);
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

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints on its last line, or null when the last
 * line is not a bare numeral (the eight unit-opener pages print no footer, and
 * three content pages end on an image caption). This footer proves the page
 * mapping exactly, page by page, without trusting a title.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  if (!last || last.length > 6 || /\p{L}/u.test(last)) return null;
  const digits = toLatinDigits(last).replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

/** Strips everything but letters and digits, so OCR spacing cannot break a match. */
function normalize(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its section, sections tile the book without gaps or overlaps, and the first
 * section starts where the contents page says. A content mistake here would
 * quietly ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_SOCIAL_G8_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal || unit.title}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      // `<` rather than `<=`: the unit opener is a page the section owns, not a
      // lesson page, so a lesson starting exactly at `unit.bookFrom` is the
      // review — a printed section with no opener. A lesson wrongly placed on a
      // unit's opener page is still caught, by the title check in
      // `assertTreeMatchesTheBook`.
      if (lesson.bookFrom < unit.bookFrom || lesson.bookFrom > unit.bookTo) {
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
      problems.push(`الوحدة ${unit.ordinal || unit.title} تتداخل مع ${nextUnit.ordinal || nextUnit.title}`);
    } else if (nextUnit && unit.bookTo !== nextUnit.bookFrom - 1) {
      problems.push(
        `فجوة صفحات بين ${unit.ordinal || unit.title} و${nextUnit.ordinal || nextUnit.title}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`,
      );
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_SOCIAL_G8_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_SOCIAL_G8_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SOCIAL_G8_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_SOCIAL_G8_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the offset and proves the mapping page by page;
 *  2. every content page carries real OCR text;
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
    if (book < EGYPT_SOCIAL_G8_T1_BOOK_START || book > EGYPT_SOCIAL_G8_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_SOCIAL_G8_T1_BOOK_END - EGYPT_SOCIAL_G8_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_SOCIAL_G8_T1_BOOK_START} و${EGYPT_SOCIAL_G8_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title.
  EGYPT_SOCIAL_G8_T1_UNITS.forEach((unit) => {
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
