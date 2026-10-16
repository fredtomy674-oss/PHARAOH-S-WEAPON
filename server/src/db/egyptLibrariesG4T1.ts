// ---------------------------------------------------------------------------
// Egypt — «المكتبات ومهارات البحث» — Grade 4, term 1 (the real book).
// ---------------------------------------------------------------------------
// Source: the MoE student book PDF «Libraries_prim4_t1.pdf» — 40 pages,
// downloaded from studentbooks.moe.gov.eg and rendered + OCR'd into
// data/curriculum-ocr/libraries-g4-t1/ (one pages-NNN.txt per PDF page). The
// book's text layer is unusable (InDesign ligature transposition), so the OCR
// corpus is the single source of truth for every check here.
//
// PAGE MODEL — verified page by page against the printed footers:
//   * PDF page N carries the printed folio N for every content page, so book
//     page == PDF page (offset 0). The footer comes in two merged shapes —
//     «الفصل الدراسي الاول ٥» and «... الصف الرابع الابتدائي | ٢٨» — and a few
//     pages carry no readable number at all (page 6 is one); `printedFooter`
//     reads the number only when exactly one candidate survives on the page.
//   * Page 4 (فهرس الموضوعات) is front matter: it prints NO page numbers next
//     to the twelve lessons (a print defect), so the lesson starts in this
//     table were read from the lessons' own title pages (5, 8, 11, 14, 17,
//     20, 22, 25, 28, 31, 34, 37), each of which prints its number.
//   * Pages 1–3 are front matter; page 5 (the first lesson's title page) is
//     BOOK_START; page 39 is the last content page; page 40 is a decorative
//     end page with no text at all — it is not part of the curriculum.
//
// TREE — taken from the book itself, never invented:
//   * this book has NO units. The printed syllabus is a flat list of twelve
//     «دروس», so the app stores one container unit titled with the book's own
//     name («المكتبات ومهارات البحث») and the twelve lessons inside it. The
//     container claims no page of its own: lesson 1 opens on the unit's first
//     page. Inventing unit splits the book does not print would be worse than
//     an honest container.
//   * lesson titles are the strings the title pages print, and each lesson's
//     concepts are its printed «الأهداف» bullets, verbatim.
//
// Every claim above is re-proved by assertTreeMatchesTheBook() before the
// seeder will touch this book.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** PDF page = printed page in this book — the printed folios prove it page by page. */
export const BOOK_TO_PDF_OFFSET = 0;

/** First page the curriculum owns: the first lesson's title page. */
export const EGYPT_LIBRARIES_G4_T1_BOOK_START = 5;

/** Last content page (page 40 is the decorative end page, not content). */
export const EGYPT_LIBRARIES_G4_T1_BOOK_END = 39;

/** The container unit's title: the book's own name, since the book prints no unit names. */
export const EGYPT_LIBRARIES_G4_T1_SPINE_TITLE = "المكتبات ومهارات البحث";

export interface EgyptLibrariesG4T1Lesson {
  /** Lesson key as the seeder namespaces it: «1-«lesson»» inside the one unit. */
  key: string;
  /** Printed ordinal, e.g. «الثاني عشر». */
  ordinal: string;
  /** Lesson title exactly as the lesson's title page prints it. */
  title: string;
  /** The page that prints this lesson's title and objectives. */
  bookFrom: number;
  /** The lesson's printed «الأهداف» bullets, verbatim. */
  concepts: string[];
}

export interface EgyptLibrariesG4T1Unit {
  /** Unit key as the seeder namespaces it: «1». */
  key: string;
  ordinal: string;
  title: string;
  /** The unit's first page — the first lesson's title page. */
  bookFrom: number;
  bookTo: number;
  lessons: EgyptLibrariesG4T1Lesson[];
}

export const EGYPT_LIBRARIES_G4_T1_UNITS: EgyptLibrariesG4T1Unit[] = [
  {
    key: "1",
    ordinal: "الأولى",
    title: EGYPT_LIBRARIES_G4_T1_SPINE_TITLE,
    bookFrom: 5,
    bookTo: 39,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "من النقش إلى القلم",
        bookFrom: 5,
        concepts: [
          "يتعرف التلميذ على الاشكال البدائية للكتابة.",
          "يقارن التلميذ بين المواد التي استخدمت والمواد والأجهزة المستخدمة في العصر الحالي.",
          "يستخلص التلميذ معلومات مبسطة حول تاريخ الكتابة.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "بيوت الكتب .. كيف بدأت؟",
        bookFrom: 8,
        concepts: [
          "يتعرف على نشأة المكتبات",
          "يدرك أهمية المكتبات في حفظ المعرفة",
          "يقدر دور المكتبة في المجتمع",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "أشهر المكتبات قديماً وحديثاً",
        bookFrom: 11,
        concepts: [
          "يتعرف على مفهوم المكتبات الشهيرة عبر التاريخ.",
          "يذكر أمثلة لمكتبات قديمة وحديثة.",
          "يقدر دور المكتبات في خدمة المجتمع ونشر الثقافة",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "الهدوء والنظام: أسرار القارئ المثالي",
        bookFrom: 14,
        concepts: [
          "يتعرف على آداب المكتبة",
          "يقدر أهمية احترام الآخرين أثناء القراءة",
          "يلتزم بقواعد الهدوء والنظام",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "صديقي الكتاب",
        bookFrom: 17,
        concepts: [
          "يتعرف أهمية الكتاب في حياتنا.",
          "يتعرف على قواعد التعامل السليم مع الكتاب",
          "يطبق أساليب المحافظة على الكتاب المدرسي وكتب المكتبة.",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "اسرار المكتبة من الرفوف الى الاجهزة",
        bookFrom: 20,
        concepts: [
          "يتعرف على مكونات المكتبة المختلفة",
          "يحدد وظيفة كل جزء من أجزاء المكتبة",
          "يميز بين مصادر المعلومات الورقية والإلكترونية",
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        title: "لغة الالوان في عالم المكتبات",
        bookFrom: 22,
        concepts: [
          "يعرف معنى تصنيف الكتب بالألوان",
          "يتعرف على الالوان الخاصة بالتصنيف واهميتها",
          "يقدر أهمية النظام في تسهيل الوصول إلى المعلومات.",
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        title: "كيف اختار كتابي من الرف",
        bookFrom: 25,
        concepts: [
          "يختار الكتاب المناسب",
          "يحدد المعايير التي تساعده في اختيار كتاب جيد",
          "يميز بين الكتب المناسبة لعمره واهتماماته",
        ],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        title: "من المكتبة إلى بيتي",
        bookFrom: 28,
        concepts: [
          "يتعرف على مفهوم استعارة الكتب",
          "يوضح أهمية نظام الاستعارة في المكتبة.",
          "يلتزم بقواعد استعارة الكتب وإعادتها في الموعد المحدد.",
        ],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        title: "عالم مصادر المعلومات",
        bookFrom: 31,
        concepts: [
          "يتعرف على مفهوم مصادر المعلومات.",
          "يحدد المصدر المناسب للحصول على معلومة معينة.",
          "يستخدم مصادر المعلومات بطريقة صحيحة.",
        ],
      },
      {
        key: "1-11",
        ordinal: "الحادي عشر",
        title: "مثلث المعرفة داخل المكتبة",
        bookFrom: 34,
        concepts: [
          "يتعرف على مفهوم مثلث المعرفة داخل المكتبة.",
          "يميز بين الكتاب والمراجع والدورية (المجلات والصحف )",
          "يحدد استخدام كل نوع من مصادر المعرفة.",
        ],
      },
      {
        key: "1-12",
        ordinal: "الثاني عشر",
        title: "من الرف إلى الإنجاز",
        bookFrom: 37,
        concepts: [
          "يستخدم محتويات المكتبة في تنفيذ نشاط أو مهمة بسيطة.",
          "يختار مصدر المعلومات المناسب للمهمة المطلوبة.",
          "يجمع معلومات من أكثر من مصدر داخل المكتبة",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the unit's first page (for the first
 * lesson — this book's unit has no opener of its own) or its own title page, up
 * to the page before the next lesson starts, or the unit's last page for its
 * last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_LIBRARIES_G4_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_LIBRARIES_G4_T1_UNITS.forEach((unit, ui) => {
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
  "libraries-g4-t1",
);

/**
 * The OCR provider answers a truly blank page with a sentence instead of an
 * empty string. It means "no text", not content, so verification treats it as
 * missing while `loadBookPage` still returns it verbatim.
 */
const NO_TEXT = "لا يوجد نص";

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  const file = path.join(OCR_DIR, `pages-${String(book).padStart(3, "0")}.txt`);
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
// Self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    // The scanner also emits the extended (Persian) digit forms for some chips.
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/**
 * The book number a content page prints in its running foot, or null when no
 * single number can be read.
 *
 * The foot rides at the end of the running line in two shapes —
 * «... الفصل الدراسي الاول ٥» (odd pages) and «... الصف الرابع الابتدائي | ٢٨»
 * (even pages) — so only numbers printed after the running phrase count, and
 * only when the page offers exactly one candidate.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const candidates = new Set<number>();
  for (const line of lines) {
    const latin = toLatinDigits(line);
    if (/^\d{1,3}$/.test(latin)) candidates.add(Number(latin));
    const marker = latin.search(/الصف الرابع الابتدائي|الفصل الدراسي (الاول|الأول)/);
    if (marker < 0) continue;
    for (const run of latin.slice(marker).match(/\d{1,3}/g) ?? []) candidates.add(Number(run));
  }
  const values = [...candidates].filter((n) => n >= 1 && n <= 99);
  return values.length === 1 ? values[0]! : null;
}

/** Strips everything but letters and digits, so OCR spacing cannot break a match. */
function normalize(text: string): string {
  return text
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * the unit, and the unit tiles the book without gaps or overlaps. Unlike the
 * multi-unit books, this book's single container unit has no opener page of
 * its own, so its first lesson may start ON the unit's first page — never
 * before it.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_LIBRARIES_G4_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (lesson.bookFrom < unit.bookFrom || lesson.bookFrom > unit.bookTo) {
        problems.push(
          `الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق الوحدة ${unit.bookFrom}–${unit.bookTo}`,
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
  if (first && first.bookFrom !== EGYPT_LIBRARIES_G4_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_LIBRARIES_G4_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_LIBRARIES_G4_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_LIBRARIES_G4_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed folio of every content page proves its book number;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every lesson's title page prints that lesson's title;
 *  4. the same page prints each of the lesson's concepts verbatim — the
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
    const book = Number(file.slice(6, 9));
    if (book < EGYPT_LIBRARIES_G4_T1_BOOK_START || book > EGYPT_LIBRARIES_G4_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_LIBRARIES_G4_T1_BOOK_END - EGYPT_LIBRARIES_G4_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_LIBRARIES_G4_T1_BOOK_START} و${EGYPT_LIBRARIES_G4_T1_BOOK_END}`,
    );
  }
  if (footersChecked < 25) {
    problems.push(`أرقام الفوتر قليلة (${footersChecked}) — المسار أو القاعدة غير صحيحة`);
  }

  // 3 + 4. each lesson's title page prints its title and its concepts.
  EGYPT_LIBRARIES_G4_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحة عنوانه ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      const flat = normalize(opener);
      if (!flat.includes(normalize(lesson.title))) {
        problems.push(`الدرس ${lesson.key}: صفحة عنوانه ${lesson.bookFrom} لا تطبع عنوانه «${lesson.title}»`);
      }
      for (const concept of lesson.concepts) {
        if (!flat.includes(normalize(concept))) {
          problems.push(`الدرس ${lesson.key}: هدف «${concept}» غير مطبوع في صفحة العنوان ${lesson.bookFrom}`);
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
