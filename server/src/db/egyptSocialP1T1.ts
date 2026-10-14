// PHASE 98 — official Egypt Preparatory-1 (Grade 7) **Social Studies**, first
// term («كتاب الوزارة»), Ministry 2026/2027 edition:
// «الملامح الطبيعية لقارة إفريقيا وحضاراتها القديمة».
//
// The curriculum `eg-g7-social` is rebuilt from the Ministry textbook
// `Social_Studies_Prep1_T1.pdf` (110 scan pages, all OCR'd) under
// server/data/curriculum-ocr/social-p1-t1/. This module is the single source of
// truth for its structure: the four units and the general review printed in the
// book's المحتويات (book page 3), and the «أهداف الدرس» the book prints at the
// head of every lesson.
//
// Page mapping (verified against the scan's printed footers):
//   bookPage = pdfPage − 1   (book page 8 = PDF page 9)
// Every content page prints its own number as a bare numeral in the running
// foot («٨» or «8»), which is what fixes the offset at 1 and proves the mapping
// page by page.
//
// WHAT THE BOOK PRINTS AND WHAT THIS TABLE MIRRORS
// The printed index stops at the lesson: 4 units, 11 lessons, plus a general
// review (with the term exams and the reference list). Each unit opens on a
// two-page «الفكرة الرئيسية / نواتج تعلم الوحدة» opener and closes on a two-page
// «تقييم ختامي»; each lesson opens on a page that prints its title and its
// «أهداف الدرس». So — exactly as the Grade-8 Social book does — the app mirrors
// the index: unit → lesson, and each lesson's co-owned pages are the unit opener
// (with the first lesson) and the unit assessment (with the last lesson), which
// is why `bookFrom` is stored for the lesson but the owned range is derived by
// `lessonBookRange`.
//
// WHY THE GENERAL REVIEW IS ITS OWN SECTION
// «المراجعة العامة على الفصل الدراسي الأول» (book pages 96–107) is not part of
// unit 4: it carries its own running head, and it is a different kind of page —
// a bank of review questions, the two term exams and the reference list. Folding
// it into unit 4's last lesson would hand the tutor twelve pages that jump from
// the Islamic conquests to exam questions under one lesson heading, so it stands
// as its own section with a single lesson, and its `concepts` are the question
// instructions the pages actually print.
//
// Book pages 0–5 (cover, title page, contents, curriculum map) and 108–109
// (credits, back cover) are front/back matter, not taught pages: they sit
// outside the tiled ranges, exactly as they do for the other Ministry books.

import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.8 = PDF p.9). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First taught page — the unit-1 opener (front matter ends at book page 5). */
export const EGYPT_SOCIAL_P1_T1_BOOK_START = 6;

/** Last taught page — the closing page of the general review (the reference list). */
export const EGYPT_SOCIAL_P1_T1_BOOK_END = 107;

export interface SocialP1T1Lesson {
  /** Internal key, e.g. "1-1" (unit 1, lesson 1) or "5-1" (the general review). */
  key: string;
  /** Printed ordinal — "الأول" … "الثالث". Empty for the review, which prints ordinals only per question. */
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

export interface SocialP1T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Full section title as printed, e.g. "الوحدة الثانية: …". */
  title: string;
  /** First printed page of the section — its opener page (96 for the review). */
  bookFrom: number;
  /** Last printed page (the page before the next section starts). */
  bookTo: number;
  lessons: SocialP1T1Lesson[];
}

/**
 * The four units plus the general review, with their eleven lessons and one
 * review lesson: section/lesson starts from the book's contents page (book
 * page 3), concepts from each lesson's printed «أهداف الدرس». Verified against
 * every printed page by `assertTreeMatchesTheBook`.
 *
 * Unit 1's opener is book pages 6–7; its lessons run 8, 14 and 20, its
 * assessment 26–27. Each later unit opens on the two pages before its first
 * lesson (28–29, 50–51, 78–79) and closes on its two-page «تقييم ختامي»
 * (48–49, 76–77, 94–95). The tiling assertion proves the result covers book
 * pages 6–107 exactly once.
 */
export const EGYPT_SOCIAL_P1_T1_UNITS: SocialP1T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: الملامح الطبيعية لقارة إفريقيا وحضاراتها القديمة",
    bookFrom: 6,
    bookTo: 27,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "قارة إفريقيا (الموقع والكشوف الجغرافية).",
        bookFrom: 8,
        concepts: [
          "أستخدم أدوات التمثيل الجغرافي في تحديد الموقع الجغرافي والفلكي لقارة إفريقيا.",
          "أشرح أهمية موقع قارة إفريقيا.",
          "أتعرف الخريطة السياسية لإفريقيا، وموقع مصر من القارة.",
          "أتتبع مراحل استكشاف قارة إفريقيا.",
          "أدلل على أن قارة إفريقيا كانت مطمعًا للمستعمرين.",
          "أعبر عن اعتزازي بالانتماء لقارة إفريقيا.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "مظاهر سطح قارة إفريقيا.",
        bookFrom: 14,
        concepts: [
          "أحدد أهم مظاهر السطح في قارة إفريقيا.",
          "أوضح الأهمية الاقتصادية لبعض مظاهر سطح قارة إفريقيا.",
          "أوظف مهارات التفكير المكاني باستخدام الأدوات الجغرافية مثل (Google Earth) لتحديد مواقع بعض مظاهر السطح في مصر وإفريقيا.",
          "أُعبر عن تقديري لعظمة الله (تعالى) في تنوع مظاهر سطح قارة إفريقيا.",
          "أحترم حقوق الملكية الفكرية عند استخدامي لمصادر المعلومات والبيانات.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "نهر النيل والحضارات القديمة في إفريقيا.",
        bookFrom: 20,
        concepts: [
          "أميز بين منابع نهر النيل الموسمية والدائمة.",
          "أتعرف تجمع الأندوجو من حيث النشأة والأهداف.",
          "أحلل نصوص مواد القانون الدولي الخاصة بتنظيم استغلال مياه الأنهار الدولية مثل نهر النيل.",
          "أدلل على دور مصر في التنمية المستدامة لمائية حوض النيل.",
          "أفسر أهمية ترشيد الاستهلاك وتطبيق مفهوم الاقتصاد الأخضر في قارة إفريقيا تحقيقًا لمبدأ استدامة الموارد.",
          "أستنتج تأثير نهر النيل في نشأة الحضارة المصرية القديمة، والتواصل الحضاري مع حضارات إفريقيا القديمة.",
          "أقارن بين الحضارات القديمة في قارة إفريقيا من حيث الموقع والملامح العامة.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: الحضارة المصرية القديمة وعلاقتها بحضارات إفريقيا",
    bookFrom: 28,
    bookTo: 49,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "عصر الدولة القديمة (عصر بناة الأهرام).",
        bookFrom: 30,
        concepts: [
          "أعدد خصائص كل من العصر العتيق وعصر الدولة القديمة.",
          "أميز أعمال بعض ملوك عصر الدولة القديمة.",
          "أستنتج ملامح الحياة المصرية القديمة في عصر الاضمحلال الأول.",
          "أدلل على علاقة مصر بقارة إفريقيا خلال عصر الدولة القديمة.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "عصر الدولة الوسطى (عصر الرخاء الاقتصادي).",
        bookFrom: 36,
        concepts: [
          "أُعدد الخصائص المميزة لعصر الدولة الوسطى.",
          "أُميِّز أعمال بعض ملوك الدولة الوسطى.",
          "أُعبّر عن تقديري للدور الذي قامت به المرأة المصرية في عصر الدولة الوسطى.",
          "أُحلّل أسباب سقوط الدولة الوسطى.",
          "أُدلّل على أهمية دور ملوك طيبة في التخلص من الهكسوس.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "عصر الدولة الحديثة (عصر المجد الحربي).",
        bookFrom: 42,
        concepts: [
          "أعدد خصائص عصر الدولة الحديثة.",
          "أميز أعمال بعض ملوك عصر الدولة الحديثة.",
          "أحلل نتائج بعض المعارك الفاصلة في عصر الدولة الحديثة.",
          "أعبر عن تقديري للدور الذي قامت به المرأة المصرية في عصر الدولة الحديثة.",
          "أدلل بأمثلة على علاقات مصر بإفريقيا في عصر الدولة الحديثة.",
          "أستنتج قيمة التفاوض والحوار لمواجهة بعض المشكلات والأزمات السياسية.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: النظم البيئية في قارة إفريقيا",
    bookFrom: 50,
    bookTo: 77,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "نظم الغابات في إفريقيا (الغابات المدارية المطيرة وغابات البحر المتوسط).",
        bookFrom: 52,
        concepts: [
          "أحدد المقصود بكل من النظام البيئي، التوازن البيئي، المدى الحراري، الرطوبة النسبية.",
          "أميز بين أنواع النظم البيئية.",
          "أحدد الموقع الفلكي والجغرافي لنظام الغابات المدارية المطيرة وغابات البحر المتوسط في إفريقيا.",
          "أقارن بين الخصائص المناخية والحيوية للغابات المدارية المطيرة وغابات البحر المتوسط في إفريقيا.",
          "أشرح أهمية الغابات في قارة إفريقيا.",
          "أوضح الأخطار التي تتعرض لها نظم الغابات في إفريقيا.",
          "أحلل أثر التغيرات المناخية على الغابات في قارة إفريقيا.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "نظم الحشائش (الحارة والمعتدلة) والصحاري الحارة في إفريقيا.",
        bookFrom: 60,
        concepts: [
          "أحدد الموقع الفلكي والجغرافي لنظُم الحشائش (الحارة والمعتدلة) والصحاري الحارة في قارة إفريقيا.",
          "أقارن بين الخصائص المناخية لنظُم الحشائش (الحارة والمعتدلة) والصحاري الحارة في قارة إفريقيا.",
          "أستنتج تأثير اختلاف الخصائص المناخية على الحياة النباتية والحيوانية لنظم الحشائش (الحارة والمعتدلة) والصحاري الحارة.",
          "أشرح الأخطار التي تتعرض لها نظم الحشائش (الحارة والمعتدلة) والصحاري الحارة في قارة إفريقيا.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "النظم البيئية المائية في إفريقيا.",
        bookFrom: 68,
        concepts: [
          "أحدد المقصود بالنظم البيئية المائية.",
          "أوظف البيانات الجغرافية المكانية والخرائط لتحديد النظم البيئية المائية في قارة إفريقيا.",
          "أميز خصائص النظم البيئية المائية (العذبة - المالحة) في قارة إفريقيا.",
          "أستنتج الأخطار التي تتعرض لها النظم البيئية المائية في قارة إفريقيا.",
          "أعبر عن تقديري لجهود مصر والدول الإفريقية في الحفاظ على التنوع البيولوجي والنظم البيئية (الأرضية والمائية).",
        ],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "الوحدة الرابعة: علاقة مصر بإفريقيا خلال العصور الوسطى",
    bookFrom: 78,
    bookTo: 95,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "انتشار الإسلام في إفريقيا.",
        bookFrom: 80,
        concepts: [
          "أحدد معابر انتقال الإسلام إلى قارة إفريقيا.",
          "أستنتج أساليب انتشار الإسلام في قارة إفريقيا.",
          "ألخص أهم الفتوحات الإسلامية في قارة إفريقيا.",
          "أوضح التأثير الحضاري للإسلام على شعوب قارة إفريقيا.",
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        title: "دور مصر الحضاري في قارة إفريقيا.",
        bookFrom: 88,
        concepts: [
          "أقدم أمثلة للعلاقات بين مصر والدول الإفريقية في العصور الوسطى.",
          "أشرح دور الجامع الأزهر الشريف في نشر الإسلام بدول إفريقيا.",
          "أعبر عن اعتزازي بدور مصر السياسي والثقافي والاقتصادي في دول إفريقيا.",
          "أميز بين الرأي والحقيقة، والادعاءات والمغالطات عند دراسة العلاقات بين مصر وإفريقيا.",
        ],
      },
    ],
  },
  {
    ordinal: "",
    title: "المراجعة العامة على الفصل الدراسي الأول",
    bookFrom: 96,
    bookTo: 107,
    lessons: [
      {
        key: "5-1",
        ordinal: "",
        title: "المراجعة العامة على الفصل الدراسي الأول",
        bookFrom: 96,
        // The review prints no «أهداف الدرس» — it is a question bank plus the
        // term exams and the reference list, so its concepts are the
        // instructions the pages print.
        concepts: [
          "السؤال الأول: لاحظ خريطة إفريقيا، ثم اكتب مدلول الأرقام الموقعة عليها.",
          "السؤال الثاني: اكتب كلمة (صواب) أمام العبارة الصحيحة، وكلمة (خطأ) أمام العبارة غير الصحيحة مع تصويب الخطأ.",
          "السؤال الثالث: اختر الإجابة الصحيحة مما بين القوسين.",
          "السؤال الرابع: أكمل العبارات التالية بما يناسبها من كلمات.",
          "السؤال الخامس: اكتب ما تشير إليه العبارات التالية.",
          "السؤال السادس: لمن تنسب الأعمال التاريخية التالية...؟",
          "السؤال السابع: بم تفسر...؟",
          "السؤال الثامن: ما النتائج المترتبة على...؟",
          "السؤال التاسع: ما العلاقة بين كل مما يلي...؟",
          "السؤال الحادي عشر: أجب عن الأسئلة التالية.",
          "الاختبار الأول على الفصل الدراسي الأول.",
          "الاختبار الثاني على الفصل الدراسي الأول.",
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
  const unit = EGYPT_SOCIAL_P1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SOCIAL_P1_T1_UNITS.forEach((unit, ui) => {
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
  "social-p1-t1",
);

/**
 * Printed content pages that carry no readable text in the book itself — a
 * full-page figure (here, book page 55, the vegetation-zones map between the
 * two halves of lesson 3-1). Confirmed by the pushy re-OCR prompt
 * (scripts/.ocr-fix-dir.mjs), which answers «NONE» for genuinely textless
 * pages: every other page in the book OCRs to real Arabic.
 */
const TEXTLESS_PAGES = new Set<number>([55]);

/**
 * The OCR provider answers a truly blank page with a short sentence instead of
 * an empty string. It means "no text", not content.
 */
const NO_TEXT = /لا يوجد نص|صفحة فارغة/;

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
const EXT_AR_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints on its last line, or null when the last
 * line is not a bare numeral (the unit-opener pages print no footer, and a few
 * content pages end on an image caption). This footer proves the page mapping
 * exactly, page by page, without trusting a title.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .at(-1) ?? "";
  if (!last || last.length > 6 || /\p{L}/u.test(last)) return null;
  const digits = toLatinDigits(last).replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

/**
 * Arabic-folded, punctuation-free text: lets a printed title match across the
 * OCR's inconsistent hamza/ya/ta-marbuta and its optional tashkeel, so a title
 * taken from the contents page still matches the lesson head.
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
 * its section, sections tile the book without gaps or overlaps, and the first
 * section starts where the contents page says. A content mistake here would
 * quietly ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_SOCIAL_P1_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_SOCIAL_P1_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_SOCIAL_P1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SOCIAL_P1_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_SOCIAL_P1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
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

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SOCIAL_P1_T1_BOOK_START || book > EGYPT_SOCIAL_P1_T1_BOOK_END) continue;
    printedPages.add(book);
    const text = loadBookPage(book);
    if (!text) {
      if (TEXTLESS_PAGES.has(book)) continue; // full-page figure, nothing to OCR
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    if (!pageHasText(book)) {
      if (TEXTLESS_PAGES.has(book)) continue;
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

  if (printedPages.size !== EGYPT_SOCIAL_P1_T1_BOOK_END - EGYPT_SOCIAL_P1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_SOCIAL_P1_T1_BOOK_START} و${EGYPT_SOCIAL_P1_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title.
  EGYPT_SOCIAL_P1_T1_UNITS.forEach((unit) => {
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
