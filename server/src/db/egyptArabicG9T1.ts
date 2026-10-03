// PHASE 86 — official Egypt Preparatory-3 (Grade 9) Arabic language, first term
// («كتاب الوزارة»).
//
// The curriculum tree for the Egypt `eg-g9-arabic` curriculum is rebuilt from the
// Ministry textbook `Arabic_language_prep3_t1.pdf` (2026/2027 MoE edition, 162
// scanned pages). This module is the single source of truth for its structure:
// the «مراجعة عامة» that opens the book, the three units, their four «دروس» each,
// and — one layer deeper, exactly as the book's فهرس (book pages 5–6) prints it —
// every «مكوّن» of every lesson (الاستماع / القراءة / القواعد النحوية / القواعد
// الإملائية / التحدث / التعبير الكتابي / النص الشعري), each with the printed page
// it starts on.
//
// THE APP MIRRORS ALL THREE PRINTED LAYERS
// Unit = وحدة, Lesson = درس, Concept = مكوّن — the maximum fidelity the book
// offers, and no printed layer is dropped. The book's فهرس prints «مراجعة عامة»
// as a top-level item before unit 1, so the app keeps it as its own leading
// section rather than hiding or mis-attaching it.
//
// Page mapping (verified against the scan's printed running feet, and against the
// page each component starts on):
//   pdfPage = bookPage + BOOK_TO_PDF_OFFSET   (book page 7 = PDF page 8)
// Unlike the Grade-6 book, whose feet are bare numerals, this book's foot carries
// the unit or lesson name beside the number («١٦  الوحدة الأولى : …» /
// «الدرس الأول | ١٧»); `printedFooter` reads the single numeral the foot prints.
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND UNIT ASSESSMENT
// Each unit opens with a «صدر» page and closes with «تقييم الوحدة» + «حصاد
// الوحدة». Neither is a lesson, so the opener rides with the unit's first lesson
// and the assessment with its last. The review section owns its own pages 7–13.
//
// THE BOOK'S LISTENING PASSAGES LIVE IN A BOOK-WIDE APPENDIX
// The listening lessons (1-1, 2-1, 3-1) print their exercises but deliberately not
// the passage; the passages are printed in the back matter «نصوص الاستماع» (book
// pages 148–154). Each listening lesson therefore also owns its own passage pages
// through `extraBookPages`, so the tutor scoped to that lesson can quote the very
// passage the book points it to. The appendix is not a lesson: it stays outside
// the tiled unit ranges.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.7 = PDF p.8). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the book's content — the «مراجعة عامة» opener. */
export const EGYPT_ARABIC_G9_T1_BOOK_START = 7;

/**
 * Last printed content page of unit 3 («حصاد الوحدة»). Book pages 148–154 are the
 * book-wide listening appendix «نصوص الاستماع», not a unit.
 */
export const EGYPT_ARABIC_G9_T1_BOOK_END = 147;

/**
 * The book-wide back matter: «نصوص الاستماع».
 *   • book 148 — the back-matter index;
 *   • book 149–154 — the three listening lessons' full passages (unit 1 on
 *     149–150, unit 2 on 151–152, unit 3 on 153–154);
 *   • book 155–156 — the listening texts the unit assessments («تقييم الوحدة»)
 *     tell the student to hear (unit 1 & 2 on 155, unit 3 on 156).
 */
export const EGYPT_ARABIC_G9_T1_APPENDIX = { from: 148, to: 156 } as const;

/** One component («مكوّن») of a lesson — becomes one concept in the app tree. */
export interface ArabicG9Concept {
  /** Printed book page where this component starts (from the فهرس). */
  bookFrom: number;
  /** The printed component label, e.g. "القواعد النحوية" or "القراءة". */
  kind: string;
  /** The printed component title, e.g. "اسم الفاعل". */
  title: string;
}

/** One lesson («درس») of the textbook — becomes one lesson in the app tree. */
export interface ArabicG9Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3); "rev-1" for the review. */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث"; "" for the review. */
  ordinal: string;
  /** The lesson's opening component type, e.g. "القراءة" or "النص الشعري". */
  type: string;
  /** Full display title, e.g. "الدرس الأول (الاستماع): آداب التعامل مع الوالدين". */
  title: string;
  /** The book's printed components, in order, with their printed start pages. */
  concepts: ArabicG9Concept[];
  /**
   * Book-wide appendix pages this lesson points to (the listening passages). Kept
   * outside the tiled unit ranges but included in the lesson's RAG document.
   */
  extraBookPages?: number[];
}

export interface ArabicG9Unit {
  /** Whether this is a numbered unit or the book's leading «مراجعة عامة». */
  kind: "unit" | "review";
  /** Arabic ordinal used in the unit title, e.g. "الثانية"; "" for the review. */
  ordinal: string;
  /** Full unit title as printed, e.g. "الوحدة الثانية: نحو تفكير سليم". */
  title: string;
  /** First printed page of the section — its opener page. */
  bookFrom: number;
  /** Last printed page of the section (the page before the next section's opener). */
  bookTo: number;
  lessons: ArabicG9Lesson[];
}

/**
 * The book's leading «مراجعة عامة» (its own section), the three units of the first
 * term, their twelve lessons and every printed component. Unit/lesson/component
 * starts are transcribed from the book's فهرس (book pages 5–6); the running pages
 * are checked by `assertTreeMatchesTheBook` before seeding.
 */
export const EGYPT_ARABIC_G9_T1_UNITS: ArabicG9Unit[] = [
  {
    kind: "review",
    ordinal: "",
    title: "مراجعة عامة",
    bookFrom: 7,
    bookTo: 13,
    lessons: [
      {
        key: "rev-1",
        ordinal: "",
        type: "مراجعة",
        title: "مراجعة عامة",
        concepts: [
          { bookFrom: 7, kind: "مراجعة", title: "أولًا: مفاهيم التذوق الجمالي" },
          { bookFrom: 8, kind: "مراجعة", title: "ثانيًا: القواعد الإملائية" },
          { bookFrom: 9, kind: "مراجعة", title: "ثالثًا: القواعد النحوية" },
        ],
      },
    ],
  },
  {
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: قيم تحمي شبابنا",
    bookFrom: 14,
    bookTo: 58,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "الدرس الأول (الاستماع): آداب التعامل مع الوالدين",
        concepts: [{ bookFrom: 15, kind: "الاستماع", title: "آداب التعامل مع الوالدين" }],
        extraBookPages: [149, 150],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "الدرس الثاني (القراءة): أغلى من الذهب",
        concepts: [
          { bookFrom: 20, kind: "القراءة", title: "أغلى من الذهب" },
          { bookFrom: 27, kind: "القواعد النحوية", title: "اسم الفاعل" },
          { bookFrom: 29, kind: "القواعد الإملائية", title: "الألف اللينة في الأسماء والأفعال والحروف" },
          { bookFrom: 31, kind: "التحدث", title: "موضوعات وقضايا مرتبطة بموضوع الدرس" },
          { bookFrom: 32, kind: "الكتابة", title: "كتابة نص إقناعي" },
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "الدرس الثالث (القراءة): الصداقة",
        concepts: [
          { bookFrom: 36, kind: "القراءة", title: "الصداقة" },
          { bookFrom: 42, kind: "القواعد النحوية", title: "اسم المفعول" },
          { bookFrom: 44, kind: "القواعد الإملائية", title: "تطبيقات على الألف اللينة في الأسماء والأفعال والحروف" },
          { bookFrom: 45, kind: "التحدث", title: "موضوعات وقضايا مرتبطة بموضوع الدرس" },
          { bookFrom: 46, kind: "الكتابة", title: "تطبيقات على كتابة نص إقناعي" },
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: "النص الشعري",
        title: "الدرس الرابع (النص الشعري): تحية للشباب",
        concepts: [{ bookFrom: 49, kind: "النص الشعري", title: "تحية للشباب" }],
        // The unit assessment that closes unit 1 tells the student to hear a text;
        // that text lives in the back matter (book 155). Own it here so the tutor
        // teaching the assessment can show it.
        extraBookPages: [155],
      },
    ],
  },
  {
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: نحو تفكير سليم",
    bookFrom: 59,
    bookTo: 104,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "الدرس الأول (الاستماع): ثمرة القراءة",
        concepts: [{ bookFrom: 60, kind: "الاستماع", title: "ثمرة القراءة" }],
        extraBookPages: [151, 152],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "الدرس الثاني (القراءة): أفضل النعم",
        concepts: [
          { bookFrom: 63, kind: "القراءة", title: "أفضل النعم" },
          { bookFrom: 70, kind: "القواعد النحوية", title: "صيغ المبالغة" },
          { bookFrom: 72, kind: "القواعد الإملائية", title: "كتابة الهمزة في بداية الكلمة ووسطها" },
          { bookFrom: 74, kind: "التحدث", title: "موضوعات وقضايا مرتبطة بموضوع الدرس" },
          { bookFrom: 75, kind: "الكتابة", title: "كتابة تقرير صحفي" },
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "الدرس الثالث (القراءة): خير جليس",
        concepts: [
          { bookFrom: 80, kind: "القراءة", title: "خير جليس" },
          { bookFrom: 86, kind: "القواعد النحوية", title: "اسم المكان" },
          { bookFrom: 89, kind: "القواعد الإملائية", title: "تطبيقات على كتابة الهمزة في بداية الكلمة ووسطها" },
          { bookFrom: 90, kind: "التحدث", title: "موضوعات وقضايا مرتبطة بموضوع الدرس" },
          { bookFrom: 91, kind: "الكتابة", title: "تطبيقات على كتابة تقرير صحفي" },
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: "النص الشعري",
        title: "الدرس الرابع (النص الشعري): تاج الفضائل",
        concepts: [{ bookFrom: 95, kind: "النص الشعري", title: "تاج الفضائل" }],
        // Unit 2's assessment listening text (back matter, book 155).
        extraBookPages: [155],
      },
    ],
  },
  {
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: أنا والمستقبل",
    bookFrom: 105,
    bookTo: 147,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "الدرس الأول (الاستماع): بناء المستقبل في عصر الآلة",
        concepts: [{ bookFrom: 106, kind: "الاستماع", title: "بناء المستقبل في عصر الآلة" }],
        extraBookPages: [153, 154],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "الدرس الثاني (القراءة): حرفتك بين يديك",
        concepts: [
          { bookFrom: 110, kind: "القراءة", title: "حرفتك بين يديك" },
          { bookFrom: 116, kind: "القواعد النحوية", title: "اسم الزمان" },
          { bookFrom: 119, kind: "القواعد الإملائية", title: "كتابة الهمزة المتطرفة" },
          { bookFrom: 121, kind: "التحدث", title: "موضوعات وقضايا مرتبطة بموضوع الدرس" },
          { bookFrom: 122, kind: "الكتابة", title: "تطبيقات على كتابة نص إقناعي" },
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "الدرس الثالث (القراءة): مستقبل مصر في الزراعة",
        concepts: [
          { bookFrom: 125, kind: "القراءة", title: "مستقبل مصر في الزراعة" },
          { bookFrom: 131, kind: "القواعد النحوية", title: "اسم الآلة" },
          { bookFrom: 133, kind: "القواعد الإملائية", title: "تطبيقات على كتابة الهمزة المتطرفة" },
          { bookFrom: 134, kind: "التحدث", title: "موضوعات وقضايا مرتبطة بموضوع الدرس" },
          { bookFrom: 135, kind: "الكتابة", title: "تطبيقات على كتابة تقرير صحفي" },
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: "النص الشعري",
        title: "الدرس الرابع (النص الشعري): اصنع بيدك مجدك",
        concepts: [{ bookFrom: 138, kind: "النص الشعري", title: "اصنع بيدك مجدك" }],
        // Unit 3's assessment listening text (back matter, book 156).
        extraBookPages: [156],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * first component, down to the page before the next lesson starts, bounded by the
 * unit — so the unit opener and the unit assessment stay inside the unit they
 * belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ARABIC_G9_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.concepts[0]!.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.concepts[0]!.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ARABIC_G9_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * PHASE 86 — the appendix page(s) each listening lesson points to, keyed by the
 * lesson key (`1-1` → `[149, 150]`). The listening lessons print their exercises but
 * not the passage; the passage lives in the back matter. The stage appends these
 * pages so the student reads the very page the tutor quotes from.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const unit of EGYPT_ARABIC_G9_T1_UNITS) {
    for (const lesson of unit.lessons) {
      if (lesson.extraBookPages?.length) out.set(lesson.key, [...lesson.extraBookPages]);
    }
  }
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
  "arabic-p3-t1",
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
  const lesson = EGYPT_ARABIC_G9_T1_UNITS[unitIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(range.from, range.to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// PHASE 86 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * Folds text for comparison: drops tatweel and diacritics, unifies the alef/ya/ta
 * forms the book prints inconsistently, and removes every non-letter/digit, so OCR
 * spacing and vowel marks cannot break a match.
 */
function normalize(text: string): string {
  return text
    .replace(/\u0640/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * The phrase a component's start page prints for its type. This book prints the
 * «نصّ استماع / نصّ قراءة / نصّ شعري» label on the reading-style pages and the
 * activity head («القواعد النحوية»، «القواعد الإملائية»، «التحدث»، «التعبير
 * الكتابي») elsewhere, so the marker is the measure of what the book actually
 * prints, not the فهرس label.
 */
const KIND_MARKER: Record<string, string> = {
  الاستماع: "استماع",
  القراءة: "قراءة",
  "النص الشعري": "شعر",
  "القواعد النحوية": "القواعد النحوية",
  "القواعد الإملائية": "القواعد الإملائية",
  التحدث: "التحدث",
  الكتابة: "التعبير الكتابي",
};

/**
 * The book number a content page prints on its last line, or null when the last
 * line carries no page number (section openers and full-page images). This book's
 * foot is a running foot that carries the section name beside the number
 * («١٦  الوحدة الأولى : …» / «الدرس الأول | ١٧»), so the single numeral on the
 * last line is the page number.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  if (!last || last.length > 80) return null;
  const runs = last.match(/[٠-٩0-9]+/g);
  if (!runs || runs.length !== 1) return null;
  const digits = toLatinDigits(runs[0]!).replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return n > 0 ? n : null;
}

/**
 * The content pages whose printed footer the OCR misread, and the value it printed
 * instead — measured, not guessed (see PHASE 86). Every other parseable footer
 * matches its page number exactly, which is what fixes the offset. Listing the
 * exceptions keeps the check strict instead of statistical.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * Table invariants: lesson keys are unique, every range sits inside its section,
 * component pages rise strictly inside their lesson, the sections tile the book
 * without gaps or overlaps, and the first/last sections hit the book's own bounds.
 * A content mistake here would quietly ground the tutor on the wrong pages, so it
 * fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ARABIC_G9_T1_UNITS;
  const keys = new Set<string>();

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`القسم ${unit.title}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      if (keys.has(lesson.key)) problems.push(`مفتاح درس مكرر: «${lesson.key}»`);
      keys.add(lesson.key);
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا مكوّنات`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول مكوّن «${lesson.concepts[0]!.kind}»`);
      }

      const lessonStart = lesson.concepts[0]!.bookFrom;
      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lessonStart < minStart || lessonStart > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lessonStart} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((concept, ci) => {
        if (!KIND_MARKER[concept.kind] && concept.kind !== "مراجعة") {
          problems.push(`الدرس ${lesson.key}: نوع مكوّن غير معروف «${concept.kind}»`);
        }
        if (concept.bookFrom < unit.bookFrom || concept.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: صفحته ${concept.bookFrom} خارج نطاق القسم`);
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
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }
      const lastConcept = lesson.concepts.at(-1)!;
      if (lastConcept.bookFrom < from || lastConcept.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: مكوّنه الأخير ${lastConcept.bookFrom} خارج نطاقه ${from}–${to}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.concepts[0]!.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر القسم ${unit.bookFrom}، وجدنا ${from}`);
      }
      for (const page of lesson.extraBookPages ?? []) {
        if (page < EGYPT_ARABIC_G9_T1_APPENDIX.from || page > EGYPT_ARABIC_G9_T1_APPENDIX.to) {
          problems.push(
            `الدرس ${lesson.key}: صفحة ملحقة ${page} خارج ملحق الكتاب ${EGYPT_ARABIC_G9_T1_APPENDIX.from}–${EGYPT_ARABIC_G9_T1_APPENDIX.to}`,
          );
        }
      }
    });

    const nextUnit = units[ui + 1];
    if (nextUnit && unit.bookTo >= nextUnit.bookFrom) {
      problems.push(`القسم ${unit.title} يتداخل مع ${nextUnit.title}`);
    } else if (nextUnit && unit.bookTo !== nextUnit.bookFrom - 1) {
      problems.push(`فجوة صفحات بين ${unit.title} و${nextUnit.title}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`);
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_ARABIC_G9_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ARABIC_G9_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ARABIC_G9_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ARABIC_G9_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number (allowing
 *     the measured OCR misreads) — this fixes the offset page by page;
 *  2. every section opener prints the section's title, every lesson opener prints
 *     its «الدرس …» label, and every component's start page prints its type;
 *  3. every listening lesson's appendix page prints that lesson's title;
 *  4. every printed page in [7, 147] is owned by exactly one lesson.
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
    if (book < EGYPT_ARABIC_G9_T1_BOOK_START || book > EGYPT_ARABIC_G9_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_ARABIC_G9_T1_BOOK_END - EGYPT_ARABIC_G9_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ARABIC_G9_T1_BOOK_START} و${EGYPT_ARABIC_G9_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  EGYPT_ARABIC_G9_T1_UNITS.forEach((unit) => {
    const unitOpener = loadBookPage(unit.bookFrom);
    if (!unitOpener) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} بلا نص OCR`);
    } else if (!normalize(unitOpener).includes(normalize(unit.title))) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} لا تطبع عنوانه`);
    }

    unit.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.concepts[0]!.bookFrom);
      const head = unit.kind === "review" ? "مراجعة عامة" : `الدرس ${lesson.ordinal}`;
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.concepts[0]!.bookFrom} بلا نص OCR`);
      } else if (!normalize(opener).includes(normalize(head))) {
        problems.push(
          `الدرس ${lesson.key}: صفحته الأولى ${lesson.concepts[0]!.bookFrom} لا تطبع «${head}»`,
        );
      }

      if (unit.kind !== "review") {
        lesson.concepts.forEach((concept) => {
          const marker = KIND_MARKER[concept.kind] ?? "";
          const page = loadBookPage(concept.bookFrom);
          if (!page) {
            problems.push(`الدرس ${lesson.key}: مكوّن «${concept.title}» صفحته ${concept.bookFrom} بلا نص OCR`);
          } else if (marker && !normalize(page).includes(normalize(marker))) {
            problems.push(
              `الدرس ${lesson.key}: صفحة المكوّن ${concept.bookFrom} لا تطبع «${marker}»`,
            );
          }
        });
      }

      const extras = lesson.extraBookPages ?? [];
      if (extras.length) {
        const texts = extras.map((page) => loadBookPage(page));
        extras.forEach((page, i) => {
          if (!texts[i]) problems.push(`الدرس ${lesson.key}: صفحة الملحق ${page} بلا نص OCR`);
        });
        // A listening lesson's extras are its passage, which must print the lesson
        // title. A last lesson's extras are the unit-assessment text, which the book
        // prints untitled under «نصوص الاستماع في تقييم الوحدات» — presence is enough.
        if (lesson.type === "الاستماع") {
          const passageTitle = lesson.title.replace(/^الدرس \S+ \([^)]+\):\s*/, "");
          if (!normalize(texts.join("\n")).includes(normalize(passageTitle))) {
            problems.push(`الدرس ${lesson.key}: صفحات الملحق ${extras.join(",")} لا تطبع عنوان الدرس`);
          }
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
