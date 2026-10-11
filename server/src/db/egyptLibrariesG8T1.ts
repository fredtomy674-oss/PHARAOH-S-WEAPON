// PHASE 99 — official Egypt Preparatory-2 (Grade 8) «المكتبات ومهارات البحث»
// (Library & research skills), first term, Ministry 2026/2027 edition.
//
// The curriculum `eg-g8-libraries` is rebuilt from the Ministry textbook
// `Libraries_2prep_tr1.pdf` (64 scan pages, all OCR'd) under
// server/data/curriculum-ocr/libraries-p2-t1/. It is one of the three Grade-8
// subjects the Prep-1 sweep left out (with «مهارات الزراعة وريادة الأعمال» and
// «مهارات الصناعة وريادة الأعمال»); this module completes the preparatory
// stage. It mirrors the Grade-7 library book (`egyptLibrariesP1T1.ts`): the same
// «الموضوع» = one unit with one lesson shape, the same opener objectives box.
//
// Page mapping (verified against the printed running feet):
//   bookPage = pdfPage − 4   (book page 1 = PDF page 5, book page 55 = PDF page 59)
// Every content page prints its own book number with a caption line («الفصل
// الدراسي الأول» / «الصف الثاني الإعدادي») beside it. The closing «قائمة
// المصطلحات» glossary (book 56–60) is back matter, kept outside the lesson
// ranges as the book prints it.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الموضوع»
// The book's contents page lists ten topics straight, with no درس layer below
// them; each topic's own opener carries an «الأهداف» box («في نهاية الدرس يستطيع
// الطالب أن:»). So the app mirrors the book: each topic = one unit «الموضوع ن:
// …» with a single lesson whose concepts are those printed objectives, verbatim.
//
// The tree is verified before seeding: `isConsistent` checks its invariants and
// `assertTreeMatchesTheBook` proves the page mapping from the printed running
// feet, the topic titles each opener page prints, the tiling, and that every
// printed objective really appears inside its topic's pages. Seeding refuses to
// run on an unverified table — «لا نخمن أبدًا».

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the book's content — the opener of topic 1. */
export const EGYPT_LIBRARIES_G8_T1_BOOK_START = 1;

/**
 * Last printed page owned by a lesson — the closing page of topic 10. The
 * «قائمة المصطلحات» glossary (printed 56–60) is back matter, kept outside the
 * lesson ranges as the book prints it.
 */
export const EGYPT_LIBRARIES_G8_T1_BOOK_END = 55;

/** Back matter that is not taught by any lesson (قائمة المصطلحات glossary). */
export const EGYPT_LIBRARIES_G8_T1_APPENDIX = {
  glossary: { from: 56, to: 60 },
} as const;

/** One topic (الموضوع) of the textbook — becomes one unit in the app tree. */
export interface LibrariesG8Topic {
  /** App-addressable key, e.g. "10-1" (topic 10, its single lesson). */
  key: string;
  /** Arabic ordinal used in the topic title, e.g. "العاشر". */
  ordinal: string;
  /** Topic title as printed at the head of the topic (without the ordinal). */
  title: string;
  /** First printed book page of the topic — its opener. */
  bookFrom: number;
  /** Last printed book page the topic owns. */
  bookTo: number;
  /** The book's printed «في نهاية الدرس يستطيع الطالب أن:» objectives, verbatim. */
  concepts: string[];
}

export interface LibrariesG8Unit {
  /** Arabic ordinal used in the unit title, e.g. "الأول". */
  ordinal: string;
  /** Unit title as printed — «الموضوع الأول: …». */
  title: string;
  /** First printed page of the unit — the topic's opener. */
  bookFrom: number;
  /** Last printed page of the unit. */
  bookTo: number;
  /** One lesson per topic — the topic's own document. */
  lessons: { key: string; ordinal: string; title: string; bookFrom: number; concepts: string[] }[];
}

/**
 * The ten topics of the first term: topic starts from the book's contents page
 * and each opener's printed footer (books 1, 7, 12, 19, 24, 30, 35, 41, 46, 51);
 * objectives from each topic's opener. Verified against every printed page by
 * `assertTreeMatchesTheBook`.
 */
export const EGYPT_LIBRARIES_G8_T1_UNITS: LibrariesG8Unit[] = [
  {
    ordinal: "الأول",
    title: "الموضوع الأول: اكتشف مصادر المعرفة: «المراجع»",
    bookFrom: 1,
    bookTo: 6,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "اكتشف مصادر المعرفة: «المراجع»",
        bookFrom: 1,
        concepts: [
          "يُعرّف مفهوم المراجع.",
          "يميز بين أنواع المراجع المختلفة.",
          "يستخدم خطوات محددة للبحث في مرجع مناسب.",
          "يقارن بين مرجعين من حيث نوع المعلومات وأسلوب العرض.",
        ],
      },
    ],
  },
  {
    ordinal: "الثاني",
    title: "الموضوع الثاني: هيا نبحث عن الحقيقة",
    bookFrom: 7,
    bookTo: 11,
    lessons: [
      {
        key: "2-1",
        ordinal: "الثاني",
        title: "هيا نبحث عن الحقيقة",
        bookFrom: 7,
        concepts: [
          "يُفسّر أهمية البحث في مصادر متنوعة.",
          "يُقيّم مدى موثوقية ودقة المصادر المختلفة.",
          "يُوثّق المعلومات باستخدام أساليب علمية صحيحة.",
          "يُشارك في نقاش جماعي بطريقة فعّالة ومحترمة.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالث",
    title: "الموضوع الثالث: أنواع المكتبات",
    bookFrom: 12,
    bookTo: 18,
    lessons: [
      {
        key: "3-1",
        ordinal: "الثالث",
        title: "أنواع المكتبات",
        bookFrom: 12,
        concepts: [
          "يُعرّف الأنواع المختلفة للمكتبات.",
          "يميز بين خصائص ووظائف كل نوع من أنواع المكتبات.",
          "يُفسّر أهمية المكتبات في تنمية الثقافة ودعم التعليم.",
          "يُحلّل دور المكتبات الرقمية في تسهيل الوصول إلى المعرفة في عصر التكنولوجيا.",
        ],
      },
    ],
  },
  {
    ordinal: "الرابع",
    title: "الموضوع الرابع: فكرة بين الرفوف",
    bookFrom: 19,
    bookTo: 23,
    lessons: [
      {
        key: "4-1",
        ordinal: "الرابع",
        title: "فكرة بين الرفوف",
        bookFrom: 19,
        concepts: [
          "يميز بين المصادر الورقية والرقمية وفقًا لطبيعة الحاجة إليها.",
          "يُطبق مهارات البحث في كل من المكتبة المدرسية والمكتبة الرقمية.",
          "يُنتج عرضًا مبتكرًا حول مفهوم ريادة الأعمال.",
          "يُفسر مفهوم ريادة الأعمال ويوضح أهميته.",
          "يُحلل دور التعلم الذاتي في تنمية المهارات.",
        ],
      },
    ],
  },
  {
    ordinal: "الخامس",
    title: "الموضوع الخامس: رحلة في عالم البحث الرقمي",
    bookFrom: 24,
    bookTo: 29,
    lessons: [
      {
        key: "5-1",
        ordinal: "الخامس",
        title: "رحلة في عالم البحث الرقمي",
        bookFrom: 24,
        concepts: [
          "يُعرّف محركات البحث ودورها في الوصول إلى المعلومات.",
          "يُفسّر أهمية محركات البحث في الحياة اليومية.",
          "يُميّز بين أنواع محركات البحث المختلفة.",
          "يستخدم محركات البحث في جمع المعلومات.",
          "يُحلّل واجهات محركات البحث ويُقارن بينها.",
        ],
      },
    ],
  },
  {
    ordinal: "السادس",
    title: "الموضوع السادس: تطبيقات جوجل",
    bookFrom: 30,
    bookTo: 34,
    lessons: [
      {
        key: "6-1",
        ordinal: "السادس",
        title: "تطبيقات جوجل",
        bookFrom: 30,
        concepts: [
          "يتعرّف على بعض تطبيقات Google الأساسية.",
          "يميز بين استخدامات كل تطبيق وأهميته.",
          "يطبّق استخدام التطبيقات الرقمية في تنفيذ المهام الدراسية، وتنظيم الملفات، والتواصل مع المعلمين.",
          "يحلّل دور الأدوات الرقمية في تحسين التعلم الذاتي وتنظيم الوقت والجهد.",
        ],
      },
    ],
  },
  {
    ordinal: "السابع",
    title: "الموضوع السابع: مواقع المعلومات",
    bookFrom: 35,
    bookTo: 40,
    lessons: [
      {
        key: "7-1",
        ordinal: "السابع",
        title: "مواقع المعلومات",
        bookFrom: 35,
        concepts: [
          "يُعرّف مفهوم مواقع المعلومات العامة والموسوعات الإلكترونية.",
          "يفهم أهمية مواقع المعلومات المتخصصة.",
          "يُميّز بين المواقع العامة والمتخصصة.",
          "يختار الموقع المناسب للحصول على المعلومات.",
          "يُقيّم موثوقية مصادر المعلومات وتحديثها.",
        ],
      },
    ],
  },
  {
    ordinal: "الثامن",
    title: "الموضوع الثامن: عام ومتخصص",
    bookFrom: 41,
    bookTo: 45,
    lessons: [
      {
        key: "8-1",
        ordinal: "الثامن",
        title: "عام ومتخصص",
        bookFrom: 41,
        concepts: [
          "يُميّز بين مواقع المعلومات العامة والمتخصصة.",
          "يستخدم مصادر مختلفة لجمع معلومات عن موضوع معين.",
          "يُحلّل أهمية مصدر المعلومات في فهم القضايا البيئية.",
          "يُقيّم مدى موثوقية المعلومات حول الاحتباس الحراري.",
          "يقترح فكرة أو إجراء للحد من الاحتباس الحراري.",
        ],
      },
    ],
  },
  {
    ordinal: "التاسع",
    title: "الموضوع التاسع: البحث بأمان وأمانة",
    bookFrom: 46,
    bookTo: 50,
    lessons: [
      {
        key: "9-1",
        ordinal: "التاسع",
        title: "البحث بأمان وأمانة",
        bookFrom: 46,
        concepts: [
          "يتعرف الطالب إلى طرق البحث الفعال عن المعلومات.",
          "يقيّم الطالب مصادر المعلومات من حيث الموثوقية.",
          "يُنظّم الطالب المعلومات بطريقة تسهل الاستفادة منها.",
          "يلتزم الطالب بأسس أمن المعلومات وحماية الخصوصية عند استخدام المصادر الرقمية.",
        ],
      },
    ],
  },
  {
    ordinal: "العاشر",
    title: "الموضوع العاشر: استخدام المعلومات وتنظيمها",
    bookFrom: 51,
    bookTo: 55,
    lessons: [
      {
        key: "10-1",
        ordinal: "العاشر",
        title: "استخدام المعلومات وتنظيمها",
        bookFrom: 51,
        concepts: [
          "يتعرّف على مفهوم تنظيم وتصنيف المعلومات.",
          "يُطبّق أساليب التنظيم في كتابة موضوع متكامل.",
          "يُقدّر قيمة تقبّل الآخر في المجتمع.",
          "يُحلّل المعلومات ويُنظّمها باستخدام مهارات التفكير النقدي.",
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
  const unit = EGYPT_LIBRARIES_G8_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const to = lessonIndex === unit.lessons.length - 1 ? unit.bookTo : unit.lessons[lessonIndex + 1]!.bookFrom - 1;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_LIBRARIES_G8_T1_UNITS.forEach((unit, ui) => {
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
  "libraries-p2-t1",
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

/** A lone page number, optionally wrapped in (…) / {…}. */
function bareNumber(line: string): number | null {
  const m = toLatinDigits(line).trim().match(/^[({[]?\s*(\d{1,3})\s*[)}\]]?$/);
  return m ? Number(m[1]) : null;
}

/**
 * The book number a content page prints in its running foot, or null when the
 * page has no footer. A content page ends with a caption («الفصل الدراسي الأول» /
 * «الصف الثاني الإعدادي») that either carries the number at one of its ends or
 * sits directly beside a lone number line, so the last few lines are scanned for
 * a definite footer.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const n = lines.length;
  for (let i = n - 1; i >= Math.max(0, n - 3); i--) {
    const line = lines[i]!;
    if (/الفصل|الصف/.test(line)) {
      const runs = toLatinDigits(line).match(/\d{1,3}/g) ?? [];
      if (runs.length === 1) return Number(runs[0]);
      for (const j of [i - 1, i + 1]) {
        const candidate = lines[j];
        if (candidate === undefined) continue;
        const b = bareNumber(candidate);
        if (b !== null) return b;
      }
      continue;
    }
    if (i === n - 1) {
      const b = bareNumber(line);
      if (b !== null) return b;
    }
  }
  return null;
}

/**
 * OCR noise the reading of a footer can slip into (book page → printed number
 * read). Book page 55's foot is set in a plate the OCR reads as «00» (for «٥٥»).
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = { 55: 0 };

/**
 * Arabic-folded, punctuation-free text: lets a printed title or objective match
 * across the OCR's inconsistent hamza/ya/ta-marbuta and its optional tashkeel.
 * Mirrors `egyptScienceP1T1.ts` / `egyptScienceT1.ts`.
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
 * its topic, the topics tile the book without gaps or overlaps, and the content
 * starts where the contents page says while the glossary stays back matter.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_LIBRARIES_G8_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الموضوع ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الموضوع ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
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
  if (first && first.bookFrom !== EGYPT_LIBRARIES_G8_T1_BOOK_START) {
    problems.push(`الموضوع الأول يجب أن يبدأ من الصفحة ${EGYPT_LIBRARIES_G8_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_LIBRARIES_G8_T1_BOOK_END) {
    problems.push(`الموضوع الأخير يجب أن ينتهي عند الصفحة ${EGYPT_LIBRARIES_G8_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }
  const { from, to } = EGYPT_LIBRARIES_G8_T1_APPENDIX.glossary;
  if (from <= EGYPT_LIBRARIES_G8_T1_BOOK_END) {
    problems.push(`ملحق المصطلحات (${from}–${to}) يبدأ داخل نطاق الدروس`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the offset and proves the mapping page by page;
 *  2. every topic's opener page prints its topic title;
 *  3. every printed content page in the book is owned by exactly one lesson —
 *     no page can fall between two topics and be unreachable;
 *  4. every printed objective really appears inside its topic's pages.
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
    if (book < EGYPT_LIBRARIES_G8_T1_BOOK_START || book > EGYPT_LIBRARIES_G8_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_LIBRARIES_G8_T1_BOOK_END - EGYPT_LIBRARIES_G8_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_LIBRARIES_G8_T1_BOOK_START} و${EGYPT_LIBRARIES_G8_T1_BOOK_END}`,
    );
  }
  if (files.length === 0) problems.push(`لا يوجد نسيج OCR لكتاب المكتبات (${OCR_DIR}) — مطلوب مسح الكتاب أولًا`);
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 2. each topic's opener page prints its title.
  EGYPT_LIBRARIES_G8_T1_UNITS.forEach((unit) => {
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

  // 4. every printed objective appears inside its topic's pages.
  EGYPT_LIBRARIES_G8_T1_UNITS.forEach((unit, ui) => {
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
