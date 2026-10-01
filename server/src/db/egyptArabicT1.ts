// PHASE 61 — official Egypt Grade-6 Arabic language, first term («كتاب الوزارة»).
//
// The curriculum tree for the Egypt `eg-g6-arabic` curriculum is rebuilt from the
// Ministry textbook `Arabic_Primary6_T1.pdf` (2026/2027 MoE edition, 154 scanned
// pages). This module is the single source of truth for its structure: the three
// units, their four «دروس» each, and — one layer deeper, exactly as the book's
// فهرس prints it — every «مكوّن» of every lesson (الاستماع / القراءة / القواعد
// النحوية / القواعد الإملائية / التحدث / الكتابة / النص الشعري), each with the
// printed page it starts on.
//
// THE APP MIRRORS ALL THREE PRINTED LAYERS
// The books already imported print their index down to a different depth: maths
// and science stop at «مفهوم» (so their app lessons are concepts), social studies
// stops at «درس» (its concepts come from the curriculum map). This book's فهرس
// prints three layers — وحدة → درس → مكوّن — so the app uses all three:
// Unit = وحدة, Lesson = درس, Concept = مكوّن. That is the maximum fidelity the
// book offers, and no printed layer is dropped.
//
// Page mapping (verified against the scan's printed footers, and against the page
// each component starts on):
//   pdfPage = bookPage + BOOK_TO_PDF_OFFSET   (book page 7 = PDF page 8)
// 119 of the 130 content pages whose last line is a bare numeral print their own
// number, which fixes the offset at 1; see FOOTER_OCR_MISREADS for the eight the
// OCR misread (re-reading them at 3000px did not fix a digit).
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND UNIT ASSESSMENT
// Each unit opens with a «صدر» page and closes with «تقييم الوحدة» + «قصة
// التوعية» + «عودة للقراءة مع الأسرة». None is a lesson, so — exactly as the
// maths and social books do with a unit's trailing pages — the opener rides with
// the unit's first lesson and the assessment with its last. A lesson's own start
// page (`concepts[0].bookFrom`) is still stored; the range it owns is derived as
// "from the unit opener (first lesson) down to the page before the next lesson
// starts, bounded by the unit".
//
// THE BOOK'S LISTENING PASSAGES LIVE IN A BOOK-WIDE APPENDIX
// The listening lessons (1-1, 2-1, 3-1) print their exercises but deliberately not
// the passage; the passages are printed in the back matter «نصوص استماع الوحدات»
// (book pages 145–149). Each listening lesson therefore also owns its own passage
// page through `extraBookPages`, so the tutor scoped to that lesson can quote the
// very passage the book points it to («نص الاستماع في آخر الكتاب»). The appendix
// is not a lesson: it stays outside the tiled unit ranges.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.7 = PDF p.8). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_ARABIC_T1_BOOK_START = 6;

/**
 * Last printed content page of unit 3 («عودة للقراءة مع الأسرة», المشهد الثالث).
 * Book pages 145–149 are the book-wide listening/dictation appendix, not a unit.
 */
export const EGYPT_ARABIC_T1_BOOK_END = 144;

/** The book-wide back matter: «نصوص استماع الوحدات» + «نصوص الاستماع والإملاء». */
export const EGYPT_ARABIC_T1_APPENDIX = { from: 145, to: 149 } as const;

/** One component («مكوّن») of a lesson — becomes one concept in the app tree. */
export interface ArabicT1Concept {
  /** Printed book page where this component starts (from the فهرس). */
  bookFrom: number;
  /** The printed component label, e.g. "القواعد النحوية" or "القراءة". */
  kind: string;
  /** The printed component title, e.g. "الاسم النكرة والاسم المعرفة". */
  title: string;
}

/** One lesson («درس») of the textbook — becomes one lesson in the app tree. */
export interface ArabicT1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** The lesson's opening component type, e.g. "القراءة" or "النص الشعري". */
  type: string;
  /** Lesson title as printed in the فهرس (the opening component's title). */
  title: string;
  /** The book's printed components, in order, with their printed start pages. */
  concepts: ArabicT1Concept[];
  /**
   * Book-wide appendix pages this lesson points to (the listening passages). Kept
   * outside the tiled unit ranges but included in the lesson's RAG document.
   */
  extraBookPages?: number[];
}

export interface ArabicT1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Full unit title as printed, e.g. "الوحدة الثانية: …". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: ArabicT1Lesson[];
}

/**
 * The three units of the first term with their twelve lessons and their printed
 * components. Unit/lesson/component starts are transcribed from the book's فهرس
 * (book pages 4–5); the running pages of every component are checked by
 * `assertTreeMatchesTheBook` before seeding.
 */
export const EGYPT_ARABIC_T1_UNITS: ArabicT1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: أطور ذاتي",
    bookFrom: 6,
    bookTo: 51,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "سمر تطور نفسها",
        concepts: [{ bookFrom: 7, kind: "الاستماع", title: "سمر تطور نفسها" }],
        extraBookPages: [146],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "كنز لا يقدر بثمن",
        concepts: [
          { bookFrom: 9, kind: "القراءة", title: "كنز لا يقدر بثمن" },
          { bookFrom: 15, kind: "القواعد النحوية", title: "الاسم النكرة والاسم المعرفة" },
          { bookFrom: 17, kind: "القواعد الإملائية", title: "الهمزة المتوسطة على الألف" },
          { bookFrom: 18, kind: "التحدث", title: "الوقت من ذهب" },
          { bookFrom: 19, kind: "الكتابة", title: "نص معلوماتي" },
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "اصنع قرارك",
        concepts: [
          { bookFrom: 24, kind: "القراءة", title: "اصنع قرارك" },
          { bookFrom: 30, kind: "القواعد النحوية", title: "أنواع المعارف" },
          {
            bookFrom: 32,
            kind: "القواعد الإملائية",
            title: "تطبيقات على الهمزة المتوسطة على الألف",
          },
          { bookFrom: 33, kind: "التحدث", title: "اصنع قرارك" },
          { bookFrom: 34, kind: "الكتابة", title: "تطبيقات على كتابة نص معلوماتي" },
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: "النص الشعري",
        title: "إلى الشباب",
        concepts: [{ bookFrom: 39, kind: "النص الشعري", title: "إلى الشباب" }],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: أنا مسئول",
    bookFrom: 52,
    bookTo: 98,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "من هم الناجحون؟",
        concepts: [{ bookFrom: 53, kind: "الاستماع", title: "من هم الناجحون؟" }],
        extraBookPages: [147],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "قوة الكلمات",
        concepts: [
          { bookFrom: 55, kind: "القراءة", title: "قوة الكلمات" },
          { bookFrom: 61, kind: "القواعد النحوية", title: "الأسماء الخمسة وعلاماتها الإعرابية" },
          {
            bookFrom: 63,
            kind: "القواعد الإملائية",
            title: "الهمزة المتوسطة على الياء (النبرة)",
          },
          { bookFrom: 64, kind: "التحدث", title: "أثر الكلمة" },
          { bookFrom: 65, kind: "الكتابة", title: "التقرير" },
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "سر القوة والنجاح",
        concepts: [
          { bookFrom: 70, kind: "القراءة", title: "سر القوة والنجاح" },
          { bookFrom: 76, kind: "القواعد النحوية", title: "أنواع الخبر" },
          {
            bookFrom: 79,
            kind: "القواعد الإملائية",
            title: "تطبيقات على الهمزة المتوسطة على الياء (النبرة)",
          },
          { bookFrom: 80, kind: "التحدث", title: "كن مسئولًا" },
          { bookFrom: 81, kind: "الكتابة", title: "تطبيقات على كتابة التقرير" },
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: "النص الشعري",
        title: "بناة المجد",
        concepts: [{ bookFrom: 86, kind: "النص الشعري", title: "بناة المجد" }],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: العلم والخيال والمستقبل",
    bookFrom: 99,
    bookTo: 144,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "من الخيال إلى الواقع",
        concepts: [{ bookFrom: 100, kind: "الاستماع", title: "من الخيال إلى الواقع" }],
        extraBookPages: [148],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "مَن وراء الكاميرا؟",
        concepts: [
          { bookFrom: 102, kind: "القراءة", title: "مَن وراء الكاميرا؟" },
          { bookFrom: 108, kind: "القواعد النحوية", title: "كان وأخواتها" },
          { bookFrom: 111, kind: "القواعد الإملائية", title: "الهمزة المتوسطة على واو" },
          { bookFrom: 112, kind: "التحدث", title: "التكنولوجيا في حياتي" },
          { bookFrom: 113, kind: "الكتابة", title: "تطبيقات على كتابة نص معلوماتي" },
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "رحلة إلى المستقبل",
        concepts: [
          { bookFrom: 117, kind: "القراءة", title: "رحلة إلى المستقبل" },
          { bookFrom: 123, kind: "القواعد النحوية", title: "إن وأخواتها" },
          { bookFrom: 126, kind: "القواعد الإملائية", title: "تطبيقات على الهمزة المتوسطة على الواو" },
          { bookFrom: 127, kind: "التحدث", title: "حلم يصنع مستقبل" },
          { bookFrom: 128, kind: "الكتابة", title: "تطبيقات على كتابة التقرير" },
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: "النص الشعري",
        title: "سعادة الأوطان",
        concepts: [{ bookFrom: 132, kind: "النص الشعري", title: "سعادة الأوطان" }],
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
  const unit = EGYPT_ARABIC_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.concepts[0]!.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.concepts[0]!.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ARABIC_T1_UNITS.forEach((unit, ui) => {
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
  "arabic-t1",
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

/** Loads + joins the OCR text of a book-page range into one document. */
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

/**
 * Full document payload for one lesson: its owned range plus the appendix pages
 * it points to (the listening passages). The lesson's own pages come first.
 */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const range = lessonBookRange(unitIndex, lessonIndex);
  const lesson = EGYPT_ARABIC_T1_UNITS[unitIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(range.from, range.to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// PHASE 61 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/** Strips everything but letters and digits, so OCR spacing cannot break a match. */
function normalize(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * The phrase a component's start page prints for its type. Reading/listening and
 * poetry pages print the type itself; the «التحدث»/«الكتابة» pages print their
 * activity title instead («أتحدث بطلاقة»، «هيا نكتب ونبدع»), so the marker is the
 * measure of what the book actually prints, not the فهرس label.
 */
const KIND_MARKER: Record<string, string> = {
  الاستماع: "الاستماع",
  القراءة: "القراءة",
  "النص الشعري": "النص الشعري",
  "القواعد النحوية": "القواعد النحوية",
  "القواعد الإملائية": "القواعد الإملائية",
  التحدث: "أتحدث بطلاقة",
  الكتابة: "هيا نكتب ونبدع",
};

/**
 * The book number a content page prints on its last line, or null when the last
 * line is not a bare numeral (unit opener pages and full-page image pages print
 * no footer).
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  if (!last || last.length > 6 || /\p{L}/u.test(last)) return null;
  const digits = toLatinDigits(last).replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

/**
 * The eight content pages whose printed footer the OCR misread, and the value it
 * printed instead — measured, not guessed: re-reading them at 3000px did not fix
 * a single digit (a ٢ read as ٣, a leading ١ dropped, a ٠ read as ٥ …). Every
 * other parseable footer matches its page number exactly, which is what fixes the
 * offset. Listing the exceptions keeps the check strict instead of statistical.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {
  95: 90,
  112: 113,
  122: 132,
  124: 134,
  126: 136,
  127: 327,
  135: 35,
  137: 37,
};

/**
 * Table invariants: lesson keys match their position, every range sits inside its
 * unit, component pages rise strictly inside their lesson, units tile the book
 * without gaps or overlaps, and the first/last units hit the book's own bounds. A
 * content mistake here would quietly ground the tutor on the wrong pages, so it
 * fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ARABIC_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا مكوّنات`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول مكوّن «${lesson.concepts[0]!.kind}»`);
      }

      const lessonStart = lesson.concepts[0]!.bookFrom;
      if (lessonStart <= unit.bookFrom || lessonStart > unit.bookTo) {
        problems.push(
          `الدرس ${lesson.key}: بدايته ${lessonStart} خارج نطاق الوحدة ${unit.bookFrom + 1}–${unit.bookTo}`,
        );
      }

      lesson.concepts.forEach((concept, ci) => {
        if (!KIND_MARKER[concept.kind]) problems.push(`الدرس ${lesson.key}: نوع مكوّن غير معروف «${concept.kind}»`);
        if (concept.bookFrom <= unit.bookFrom || concept.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: صفحته ${concept.bookFrom} خارج نطاق الوحدة`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && concept.bookFrom <= prev.bookFrom) {
          problems.push(
            `الدرس ${lesson.key}: صفحات المكوّنات غير تصاعدية (${prev.bookFrom} ثم ${concept.bookFrom})`,
          );
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق الوحدة ${unit.bookFrom}–${unit.bookTo}`);
      }
      const lastConcept = lesson.concepts.at(-1)!;
      if (lastConcept.bookFrom < from || lastConcept.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: مكوّنه الأخير ${lastConcept.bookFrom} خارج نطاقه ${from}–${to}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.concepts[0]!.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر الوحدة ${unit.bookFrom}، وجدنا ${from}`);
      }
      for (const page of lesson.extraBookPages ?? []) {
        if (page < EGYPT_ARABIC_T1_APPENDIX.from || page > EGYPT_ARABIC_T1_APPENDIX.to) {
          problems.push(`الدرس ${lesson.key}: صفحة ملحقة ${page} خارج ملحق الكتاب ${EGYPT_ARABIC_T1_APPENDIX.from}–${EGYPT_ARABIC_T1_APPENDIX.to}`);
        }
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
  if (first && first.bookFrom !== EGYPT_ARABIC_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_ARABIC_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ARABIC_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_ARABIC_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number (allowing
 *     the eight measured OCR misreads) — this fixes the offset page by page;
 *  2. every unit opener prints the unit's title, every lesson opener prints its
 *     «الدرس …» label, and every component's start page prints its type's marker;
 *  3. every listening lesson's appendix page prints that lesson's title;
 *  4. every printed page in [6, 144] is owned by exactly one lesson — no page can
 *     fall between two lessons and be unreachable.
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
    if (book < EGYPT_ARABIC_T1_BOOK_START || book > EGYPT_ARABIC_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_ARABIC_T1_BOOK_END - EGYPT_ARABIC_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ARABIC_T1_BOOK_START} و${EGYPT_ARABIC_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  EGYPT_ARABIC_T1_UNITS.forEach((unit) => {
    const unitOpener = loadBookPage(unit.bookFrom);
    if (!unitOpener) {
      problems.push(`الوحدة ${unit.ordinal}: صفحة صدورها ${unit.bookFrom} بلا نص OCR`);
    } else if (!normalize(unitOpener).includes(normalize(unit.title))) {
      problems.push(`الوحدة ${unit.ordinal}: صفحة صدورها ${unit.bookFrom} لا تطبع عنوانها «${unit.title}»`);
    }

    unit.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.concepts[0]!.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.concepts[0]!.bookFrom} بلا نص OCR`);
      } else if (!normalize(opener).includes(normalize(`الدرس ${lesson.ordinal}`))) {
        problems.push(
          `الدرس ${lesson.key}: صفحته الأولى ${lesson.concepts[0]!.bookFrom} لا تطبع «الدرس ${lesson.ordinal}»`,
        );
      }

      lesson.concepts.forEach((concept) => {
        const marker = KIND_MARKER[concept.kind] ?? "";
        const page = loadBookPage(concept.bookFrom);
        if (!page) {
          problems.push(`الدرس ${lesson.key}: مكوّن «${concept.title}» صفحته ${concept.bookFrom} بلا نص OCR`);
        } else if (marker && !normalize(page).includes(normalize(marker))) {
          problems.push(
            `الدرس ${lesson.key}: صفحة المكوّن ${concept.bookFrom} لا تطبع «${marker}» (${concept.bookFrom})`,
          );
        }
      });

      for (const page of lesson.extraBookPages ?? []) {
        const text = loadBookPage(page);
        if (!text) {
          problems.push(`الدرس ${lesson.key}: صفحة الملحق ${page} بلا نص OCR`);
        } else if (!normalize(text).includes(normalize(lesson.title))) {
          problems.push(`الدرس ${lesson.key}: صفحة الملحق ${page} لا تطبع عنوان الدرس «${lesson.title}»`);
        }
      }
    });
  });

  // every printed content page is owned by exactly one lesson.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
