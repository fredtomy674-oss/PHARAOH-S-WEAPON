// PHASE 81 — official Egypt Preparatory-3 (Grade 9) Social Studies, first term
// («كتاب الوزارة»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g9-social` is rebuilt from the Ministry textbook
// `Social_Studies_Prep3_T1.pdf` (113 scan pages, 113 OCR'd). This module is the
// single source of truth for its structure: the four units and their eleven
// lessons, exactly as the book's المحتويات (book page 5–6) prints them, and the
// «أهداف الدرس» the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 1   (book page 10 = PDF page 11)
// Every content page prints its own book number as a bare numeral in the
// running foot («10» or «١١»), which is what fixes the offset at 1 and proves
// the mapping page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس», NOT A «مفهوم»
// The book's printed index stops at the lesson (four units, eleven lessons); the
// «خريطة المنهج» (book pages 7–8) is a curriculum map, not a finer index, and it
// leaves its «المفاهيم الرئيسية» column blank for four lessons. So — exactly as
// the Grade-9 ICT and Christian books do — the app mirrors the index: unit →
// lesson, and each lesson's concepts are the printed «أهداف الدرس» it puts at
// its head (a list every lesson in this book actually prints).
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND UNIT ASSESSMENT
// Each unit opens with a two-page opener (title + «دروس الوحدة», then the
// «المفاهيم/القيم/المهارات/القضايا» page) and closes with «تقييم ختامي على
// الوحدة» plus its «أنشطة الوحدة». Neither is a lesson, so — exactly as the
// Grade-6 social book does — the opener rides with the unit's first lesson and
// the assessment with its last. A lesson's own `bookFrom` is still stored; the
// range it owns is derived as "from the unit opener (first lesson) down to the
// page before the next lesson starts, bounded by the unit". The last unit's last
// lesson also owns the final «المراجعة العامة على الفصل الدراسي الأول».

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.10 = PDF p.11). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_SOCIAL_G9_T1_BOOK_START = 8;

/**
 * Last printed content page before the colophon (PDF 113) and back cover (PDF
 * 114). The final «المراجعة العامة على الفصل الدراسي الأول» runs through it.
 */
export const EGYPT_SOCIAL_G9_T1_BOOK_END = 111;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface SocialG9T1Lesson {
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
  /** The book's printed «أهداف الدرس» for this lesson. */
  concepts: string[];
}

export interface SocialG9T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Full unit title as printed, e.g. "الوحدة الثانية: …". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: SocialG9T1Lesson[];
}

/**
 * The four units of the first term with their eleven lessons: unit/lesson starts
 * from the book's contents page, concepts from each lesson's printed «أهداف
 * الدرس». Verified against every printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_SOCIAL_G9_T1_UNITS: SocialG9T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: الملامح الطبيعية والحضارية لقارات العالم الجديد",
    bookFrom: 8,
    bookTo: 35,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "موقع ومظاهر سطح قارات العالم الجديد",
        bookFrom: 10,
        concepts: [
          "أقارن بين الموقع الجغرافي والفلكي لقارات العالم الجديد.",
          "أفسر أهمية الموقع الجغرافي والفلكي لقارات العالم الجديد.",
          "أوظف الأدوات الجغرافية في وصف مظاهر سطح قارات العالم الجديد؛ من حيث الموقع والخصائص.",
          "أشرح الأهمية الاقتصادية لبعض مظاهر سطح قارات العالم الجديد.",
          "أعبر عن تقديري لعظمة الله ﷺ في تنوع مظاهر سطح قارات العالم الجديد.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "الحضارات القديمة في الأمريكتين",
        bookFrom: 20,
        concepts: [
          "أحدد على الخريطة مواقع بعض الحضارات القديمة في الأمريكتين.",
          "أصف أبرز ملامح الحياة السياسية، والاقتصادية، والدينية لبعض حضارات الأمريكتين.",
          "أحدد أوجه التشابه والاختلاف بين الحضارات القديمة في الأمريكتين والحضارة المصرية القديمة.",
          "أعبر عن تقديري لأهمية الحفاظ على التراث الثقافي للشعوب.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "الكشوف الجغرافية لقارات العالم الجديد",
        bookFrom: 26,
        concepts: [
          "أشرح دوافع الدول الأوروبية للقيام بالكشوف الجغرافية.",
          "أميز بين النتائج الإيجابية والسلبية للكشوف الجغرافية للعالم الجديد.",
          "ألخص دور بعض المستكشفين والرحالة في الكشوف الجغرافية للعالم الجديد.",
          "أعبر عن تقديري لدور العلماء المسلمين في الكشوف الجغرافية للعالم الجديد.",
          "أحلل تأثير الكشوف الجغرافية على السكان الأصليين لقارات العالم الجديد.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: مصر في عصر «محمد علي» وخلفائه",
    bookFrom: 36,
    bookTo: 61,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "تولية «محمد علي» حكم مصر وتثبيت دعائم حكمه",
        bookFrom: 38,
        concepts: [
          "ألخص أحوال مصر بعد خروج الحملة الفرنسية.",
          "أشرح دور الشعب المصري في تولية «محمد علي» حكم مصر.",
          "أحلل التحديات التي واجهت «محمد علي» بعد توليه الحكم.",
          "أعبر عن رأيي في السياسة التي اتبعها «محمد علي» لمواجهة التحديات بعد توليه حكم مصر.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "«محمد علي» وبناء الدولة الحديثة في مصر",
        bookFrom: 44,
        concepts: [
          "أحلل أثر الإصلاحات الداخلية التي قام بها «محمد علي» في مصر.",
          "أستنتج أسباب حروب «محمد علي».",
          "أقيم تأثير سياسة «محمد علي» الخارجية على مصر.",
          "ألخص بنود معاهدة لندن ١٨٤٠ م ونتائجها.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "مصر في عصر خلفاء «محمد علي»",
        bookFrom: 52,
        concepts: [
          "أوضح ملامح السياسة الداخلية والخارجية لمصر في عصر خلفاء «محمد علي».",
          "أفسر أسباب أزمة الديون في عصر الخديو إسماعيل.",
          "أحلل مظاهر التدخل الأجنبي في شئون مصر خلال القرن التاسع عشر.",
          "أقيم أثر بعض قرارات خلفاء «محمد علي» على المجتمع المصري.",
          "أشرح دور الحركة الوطنية في مواجهة التدخل الأجنبي.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: النُّظُم البيئية في قارات العالم الجديد",
    bookFrom: 62,
    bookTo: 89,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "نُظُم الغابات والحشائش في قارات العالم الجديد",
        bookFrom: 64,
        concepts: [
          "أحدد الموقع الجغرافي لنُظُم الغابات والحشائش في قارات العالم الجديد.",
          "أقارن بين أهم الخصائص المناخية لنُظُم الغابات والحشائش بقارات العالم الجديد.",
          "أميز بين الخصائص الحيوية لبعض نُظُم الغابات والحشائش بقارات العالم الجديد.",
          "أستنتج دور نُظُم الغابات والحشائش في الحفاظ على التوازن البيئي.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "النُّظُم البيئية الصحراوية والمائية في قارات العالم الجديد",
        bookFrom: 72,
        concepts: [
          "أحدد على الخريطة مناطق التوزيع الجغرافي لبعض النُّظُم البيئية الصحراوية في قارات العالم الجديد.",
          "أستنتج الخصائص الحيوية للنُّظُم الصحراوية في قارات العالم الجديد.",
          "أميز بين النُّظُم البيئية المائية في قارات العالم الجديد؛ من حيث الموقع والخصائص.",
          "أستنتج المخاطر التي تتعرض لها النُّظُم الصحراوية والمائية في قارات العالم الجديد.",
          "أعبر عن تقديري لعظمة الله ﷺ في تنوُّع النُّظُم البيئية بقارات العالم الجديد.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "التغير المناخي وتأثيره على النُّظُم البيئية",
        bookFrom: 80,
        concepts: [
          "أصنّف العوامل الرئيسية للتغير المناخي في العالم.",
          "ألخّص تأثيرات التغير المناخي على النُّظُم البيئية والأنشطة البشرية.",
          "أعبّر عن تقديري للجهود الدولية للحد من التغير المناخي وتعزيز التوازن البيئي.",
          "ألخّص دوري بصفتي مواطنًا مصريًا في الحد من أثر التغير المناخي.",
        ],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "الوحدة الرابعة: الحركة الوطنية في مواجهة الاحتلال البريطاني",
    bookFrom: 90,
    bookTo: 111,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "الثورة العرابية وبداية الاحتلال البريطاني لمصر",
        bookFrom: 92,
        concepts: [
          "أشرح أحوال مصر في ظل حكم الخديو توفيق.",
          "أحلل أسباب قيام الثورة العرابية.",
          "أقيم نتائج الثورة العرابية وتأثيرها على تاريخ مصر.",
          "أشرح السياسة التي اتبعها الاحتلال البريطاني في مصر.",
          "أعبر عن تقديري لدور الجيش والشعب المصري في الدفاع عن مصر ضد التدخل الأجنبي.",
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        title: "كفاح الحركة الوطنية وبناء الوعي الوطني (مصطفى كامل ومحمد فريد)",
        bookFrom: 100,
        concepts: [
          "أُقيّم موقف الخديو عباس حلمي الثاني من الحركة الوطنية.",
          "أشرح دور بعض الزعماء الوطنيين في إيقاظ الروح الوطنية لدى المصريين.",
          "أقارن بين أساليب الكفاح الوطني لكل من مصطفى كامل ومحمد فريد.",
          "أحلل أثر حادثة دنشواي على السياسة البريطانية والحركة الوطنية.",
          "أعبر عن تقديري لجهود مصطفى كامل ومحمد فريد في المطالبة بحرية الوطن واستقلاله.",
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
 * the unit opener and the unit assessment inside the unit they belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_SOCIAL_G9_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SOCIAL_G9_T1_UNITS.forEach((unit, ui) => {
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
  "social-p3-t1",
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
 * The book number a content page prints on its last line, or null when the last
 * line is not a bare numeral (the eight unit-opener pages print no footer).
 * This footer proves the page mapping exactly, page by page, without trusting a
 * title.
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
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_SOCIAL_G9_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_SOCIAL_G9_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_SOCIAL_G9_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SOCIAL_G9_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_SOCIAL_G9_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the offset and proves the mapping page by page;
 *  2. every lesson's own first page prints that lesson's title;
 *  3. every printed page in the book is owned by exactly one lesson — no page
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
    if (book < EGYPT_SOCIAL_G9_T1_BOOK_START || book > EGYPT_SOCIAL_G9_T1_BOOK_END) continue;
    printedPages.add(book);
    const text = loadBookPage(book);
    if (!text) continue;
    const footer = printedFooter(book);
    if (footer !== null) {
      footersChecked++;
      if (footer !== book) {
        problems.push(`صفحة الكتاب ${book}: الفوتر المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_SOCIAL_G9_T1_BOOK_END - EGYPT_SOCIAL_G9_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_SOCIAL_G9_T1_BOOK_START} و${EGYPT_SOCIAL_G9_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 2. each lesson's own first page prints its title.
  EGYPT_SOCIAL_G9_T1_UNITS.forEach((unit) => {
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

  // 3. every printed page is owned by exactly one lesson.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
