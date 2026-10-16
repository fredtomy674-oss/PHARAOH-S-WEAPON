// PHASE 149 — official Egypt Grade-4 ICT, first term («كتاب الوزارة»).
//
// The curriculum tree for the Egypt `eg-g4-ict` curriculum is rebuilt from the
// Ministry textbook `ICT_ARABIC_Prim4_TR1.pdf` (2026/2027 MoE edition, 55 PDF
// pages: 50 content pages, one blank, one back cover). This module is the single
// source of truth for its structure: the two units and their six lessons each,
// exactly as the book's قائمة المحتويات (book page 3) prints them, and the
// «أهداف الدرس» the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage   (book page 8 = PDF page 8)
// 34 of the 50 content pages print their own book number in the running foot
// («٦ تكنولوجيا المعلومات والإتصالات - الصف الرابع الابتدائي», a bare «٨», or
// «الفصل الدراسي الأول ٢٣» / «٣٩ الفصل الدراسي الأول»), which fixes the offset at
// 0. The pages that print no readable number are the unit openers (4 and 29), the
// twelve lesson title pages (5, 9, 13, 17, 21, 25, 30, 34, 38, 42, 46, 50) and
// three misreads of the scanner: 7 («الفصل الدراسي الأول V»), 38 («WWW», a printed
// diagram label) and 43 (the number was dropped). The contents page itself
// misprints unit-2 lesson 3 as ٢٨; that lesson's own four pages print ٣٨–٤١.
//
// HOW A LESSON IS LAID OUT (unlike the Grade-6 book)
// Every lesson of this book occupies four printed pages: a title page (which
// prints only «الدرس الأول» + the lesson title + a decorative diagram), then the
// objectives page («أهداف الدرس» + the introduction + the first content block),
// then one content page, then the «الأسئلة وتدريبات» block. `bookFrom` is that
// title page (the page the contents list points at); the objectives are on
// `objectivesPage` = bookFrom + 1.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس»
// The book's printed index stops at the lesson (two units × six lessons); it has
// no «مفهوم» layer. So the app mirrors the book: unit → lesson. Each lesson's RAG
// document is the whole lesson (its four pages).
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER
// Unit 1 opens on book page 4 («الوحدة الأولى: دور تكنولوجيا المعلومات في حياتنا»)
// and unit 2 on book page 29, before their first lesson's own page (5 and 30). The
// opener is not a lesson, so — exactly as the Grade-6 book does — it rides with
// the unit's first lesson. A lesson's own `bookFrom` is still stored; the range it
// owns is derived as "from the unit's first page, down to the page before the next
// lesson starts, bounded by the unit".

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book page 8 = PDF 8). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_ICT_G4_T1_BOOK_START = 4;

/** Last printed content page — the exercise block of unit 2 lesson 6. */
export const EGYPT_ICT_G4_T1_BOOK_END = 53;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface IctG4T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed on the lesson's own title page (no ordinal). */
  title: string;
  /**
   * First printed book page of the lesson itself — its title page. The range the
   * lesson *owns* also includes its unit's opener when it is the unit's first
   * lesson, which is why ownership is derived by `lessonBookRange`.
   */
  bookFrom: number;
  /** The page that prints this lesson's «أهداف الدرس» list (bookFrom + 1). */
  objectivesPage: number;
  /** The book's printed «أهداف الدرس» for this lesson, verbatim. */
  concepts: string[];
}

export interface IctG4T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "الوحدة الأولى: دور تكنولوجيا المعلومات في حياتنا". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: IctG4T1Lesson[];
}

/**
 * The two units of the first term with their twelve lessons: unit/lesson starts
 * from the book's contents page (3), objectives from each lesson's objectives
 * page (6, 10, …). Verified against every printed page by
 * `assertTreeMatchesTheBook`.
 */
export const EGYPT_ICT_G4_T1_UNITS: IctG4T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: دور تكنولوجيا المعلومات في حياتنا",
    bookFrom: 4,
    bookTo: 28,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "أدوات الاستكشافات العلمية",
        bookFrom: 5,
        objectivesPage: 6,
        concepts: [
          "يتعرف بعض الأدوات التكنولوجية المستخدمة في الاكتشافات العلمية",
          "يشرح المفاهيم المتعلقة بالتكنولوجيا",
          "يصف كيف يمكن استخدام التكنولوجيا في عمليات الاكتشافات العلمية",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "أجهزة الحاسب ومكوناتها",
        bookFrom: 9,
        objectivesPage: 10,
        concepts: [
          "يفرق بين وحدات الادخال والاخراج",
          "يفرق بين مفهوم البيانات والمعلومات",
          "يصنف أنواع أجهزة الكمبيوتر المختلفة",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "أنظمة التشغيل",
        bookFrom: 13,
        objectivesPage: 14,
        concepts: [
          "يشرح العمليات الرئيسة الخاصة بأنظمة التشغيل والبرمجيات",
          "يفرق بين الأجهزة والبرمجيات",
          "يستنتج أنواع الأجهزة",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "التكنولوجيا المساعدة",
        bookFrom: 17,
        objectivesPage: 18,
        concepts: [
          "يشرح تعريف التكنولوجيا المساعدة",
          "يناقش أهمية التكنولوجيا في حياة الأشخاص ذوي الاحتياجات الخاصة",
          "يقترح وسيلة تكنولوجية يمكنها أن تساهم في تحسين حياة الآخرين",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "المشكلات التكنولوجية الشائعة وحلولها",
        bookFrom: 21,
        objectivesPage: 22,
        concepts: [
          "يحدد بعض المشكلات التكنولوجية التي يمكن أن يواجهها عند استخدام الأجهزة",
          "يناقش المشكلات التي قد يواجهها الآخرون أثناء استخدامهم الوسائل التكنولوجية",
          "يقترح بعض الحلول لمعالجة اجهزة تكنولوجيا المعلومات والاتصالات",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "مصادر جمع البيانات وتحليلها",
        bookFrom: 25,
        objectivesPage: 26,
        concepts: [
          "يحدد الوسائل الرقمية التي يمكن استخدامها لتنظيم المعلومات",
          "يمارس عمليات جمع البيانات من المصادر الرقمية الآمنة",
          "يقترح بعض المصادر الرقمية التي يمكن أن يستخدمها",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: احتياطات الأمن والسلامة الرقمية",
    bookFrom: 29,
    bookTo: 53,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "الحماية من مخاطر شبكة الإنترنت",
        bookFrom: 30,
        objectivesPage: 31,
        concepts: [
          "يصف المخاطر والأضرار المرتبطة بشبكة الإنترنت",
          "يفسر أهمية الحفاظ على خصوصية المعلومات الشخصية",
          "يناقش طرق المحافظة على إجراءات الأمان أثناء استخدام شبكة الإنترنت",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        // The contents page writes «الأخلاقى» (with ى); the lesson's own title
        // page prints «الأخلاقي» — the lesson page is what the check uses.
        title: "الاستخدام الصحيح والأخلاقي لتكنولوجيا المعلومات",
        bookFrom: 34,
        objectivesPage: 35,
        concepts: [
          "يشرح مفهوم الاستخدام الصحيح والأخلاقي لتكنولوجيا المعلومات",
          "يستخدم أدوات تكنولوجيا المعلومات والاتصالات بطريقة مسئولة",
          "يشرح دور احترام القانون والقواعد الأخلاقية في تنظيم المحتوى الرقمي",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "عمليات البحث على شبكة الإنترنت",
        bookFrom: 38,
        objectivesPage: 39,
        concepts: [
          "يشرح كيفية استخدام متصفحات الإنترنت على شبكة الإنترنت بطريقة آمنة وصحيحة",
          "يناقش طريقة اختيار الكلمات المفتاحية لاستخدامها في البحث على شبكة الإنترنت",
          "يُعد خطة يومية للأوقات المناسبة لاستخدام البرامج والأدوات التكنولوجية",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "الجهات المسئولة عن حل مشكلات الإنترنت",
        bookFrom: 42,
        objectivesPage: 43,
        concepts: [
          "يشرح بعض المشكلات الشائعة عند استخدام شبكة الإنترنت",
          "يحدد الأشخاص أو الجهات التي يمكن أن تساعده على حل مشكلات استخدام شبكة الإنترنت",
          "يصف دور إدارة مكافحة جرائم الإنترنت",
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        title: "الأمان الرقمي",
        bookFrom: 46,
        objectivesPage: 47,
        concepts: [
          // The book prints «صف أهمية الأمان الرقمي» (the leading ي is missing in
          // the printed objective itself); carried verbatim so the proof holds.
          "صف أهمية الأمان الرقمي",
          "يشرح أهمية برامج مكافحة الفيروسات",
          "يشرح طرق حماية الأجهزة من المخاطر المحتملة لشبكة الإنترنت",
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        title: "مشروع تطبيقي",
        bookFrom: 50,
        objectivesPage: 51,
        concepts: [
          "يناقش زملائه في الموضوعات التي يريد إجراء الأبحاث عنها",
          "يختار أحد الموضوعات المهمة لتوعية الآخرين",
          "يختار أداة مناسبة لعرض المعلومات",
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
 * lesson) or its own title page, up to the page before the next lesson starts,
 * or the unit's last page for its last lesson. Deriving the end this way keeps
 * the unit opener and each lesson's exercise block inside the lesson they belong
 * to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ICT_G4_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ICT_G4_T1_UNITS.forEach((unit, ui) => {
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
  "ict-g4-t1",
);

/**
 * The OCR provider answers a truly blank page with this sentence instead of an
 * empty string. It means "no text", not content, so verification treats it as
 * missing while `loadBookPage` still returns it verbatim.
 */
const NO_TEXT = "لا يوجد نص مكتوب في الصورة المرفقة";

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
// PHASE 149 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints in its running foot, or null when the
 * last line carries no number at all (unit openers and lesson title pages print
 * none, and the scanner misread three of them) or carries more than one.
 *
 * Unlike the science/social books the foot comes in two shapes — a bare number
 * («٨») or a sentence with the number embedded, sometimes leading and sometimes
 * trailing («٦ تكنولوجيا المعلومات والإتصالات - الصف الرابع الابتدائي»,
 * «٤٧ الفصل الدراسي الأول») — so both are accepted, and only the number is kept.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  if (!last) return null;
  const latin = toLatinDigits(last);
  const bare = /^\d+$/.test(latin);
  if (!bare && !/الصف الرابع|الفصل الدراس|تكنولوجيا المعلومات/.test(last)) return null;
  const runs = latin.match(/\d+/g) ?? [];
  if (runs.length !== 1) return null;
  return Number(runs[0]);
}

/** Strips everything but letters and digits, so OCR spacing cannot break a match. */
function normalize(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents describe it. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ICT_G4_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (lesson.objectivesPage !== lesson.bookFrom + 1) {
        problems.push(`الدرس ${lesson.key}: صفحة الأهداف ${lesson.objectivesPage} يجب أن تكون ${lesson.bookFrom + 1}`);
      }
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
  if (first && first.bookFrom !== EGYPT_ICT_G4_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_ICT_G4_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ICT_G4_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_ICT_G4_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the offset and proves the mapping page by page;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every lesson's own title page prints that lesson's title;
 *  4. every lesson's objectives page prints each of its printed «أهداف الدرس»
 *     verbatim — the objectives the app ships are the book's own words;
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
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ICT_G4_T1_BOOK_START || book > EGYPT_ICT_G4_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_ICT_G4_T1_BOOK_END - EGYPT_ICT_G4_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ICT_G4_T1_BOOK_START} و${EGYPT_ICT_G4_T1_BOOK_END}`,
    );
  }
  if (footersChecked < 30) {
    problems.push(`أرقام الفوتر قليلة (${footersChecked}) — المسار أو القاعدة غير صحيحة`);
  }

  // 3 + 4. each lesson's title page prints its title, its objectives page its objectives.
  EGYPT_ICT_G4_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحة عنوانه ${lesson.bookFrom} بلا نص OCR`);
      } else if (!normalize(opener).includes(normalize(lesson.title))) {
        problems.push(`الدرس ${lesson.key}: صفحة عنوانه ${lesson.bookFrom} لا تطبع عنوانه «${lesson.title}»`);
      }
      const goals = loadBookPage(lesson.objectivesPage);
      if (!goals) {
        problems.push(`الدرس ${lesson.key}: صفحة أهدافه ${lesson.objectivesPage} بلا نص OCR`);
        return;
      }
      const flat = normalize(goals);
      for (const concept of lesson.concepts) {
        if (!flat.includes(normalize(concept))) {
          problems.push(`الدرس ${lesson.key}: هدف «${concept}» غير مطبوع في صفحة الأهداف ${lesson.objectivesPage}`);
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
