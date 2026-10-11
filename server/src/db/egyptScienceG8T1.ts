// PHASE — official Egypt Grade-8 (Preparatory-2) Science, first term
// («كتاب الوزارة»), Ministry 2026/2027 edition, «اكتشف و تعلم».
//
// The curriculum `eg-g8-science` is rebuilt from the Ministry textbook
// `Science_Ar_prep2_t1.pdf` (106 scan pages, 105 OCR'd — pdf 4 is a blank
// front-matter leaf outside the taught range). This module is the single
// source of truth for its structure: the four units and their eleven lessons,
// exactly as the book's «محتويات الكتاب» (book pages iv–v) prints them, and the
// «أهداف الدرس» the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 7   (book page 2 = PDF page 9)
// Every content page carries its own number in the running foot, alone («4»),
// wrapped with the lesson title («الدرس الأول: حالات المادة 3») or the unit
// title («4 الوحدة الأولى: المادة والطاقة») — which is what fixes the offset
// at 7 and proves the mapping page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس», NOT A «مفهوم»
// The contents page lists four units whose lessons are numbered «الدرس»
// (4, 3, 2 and 2 of them). There is no «مفهوم» layer: the lesson head itself
// prints «مصطلحات الدرس» then «أهداف الدرس», and every content page's foot
// names that lesson — so the app lesson is the printed «الدرس».
// Unit openers (books 1, 39, 64, 82) carry no footer and no «أهداف»; each
// rides with its unit's first lesson, exactly as in the Grade-9 book. Books
// 98–99 are the credits and back cover: outside the taught range, so
// `BOOK_END` is 97 (the last lesson's own «أسئلة تقييم»).
//
// Document content per lesson is assembled from the committed OCR text under
// server/data/curriculum-ocr/science-p2-t1/ — i.e. the tutor's grounding is
// literally the Ministry book, page by page.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.2 = PDF p.9). */
export const BOOK_TO_PDF_OFFSET = 7;

/** First page of the taught book: the unit-1 opener. Front matter is 0 and below. */
export const EGYPT_SCIENCE_G8_T1_BOOK_START = 1;

/** Last taught page: unit 4's last lesson ends on its own «أسئلة تقييم». */
export const EGYPT_SCIENCE_G8_T1_BOOK_END = 97;

/** The «أهداف الدرس» the book prints at the head of each lesson, verbatim. */
export interface ScienceG8T1Lesson {
  /** Position inside the unit, as printed («1-1» … «4-2»); also the code suffix. */
  key: string;
  /** Printed lesson ordinal («الأول» …), used to build the lesson title. */
  ordinal: string;
  /** Printed lesson title — the same string its own first page prints. */
  title: string;
  /** Book page the lesson starts on (its head page). */
  bookFrom: number;
  /** Verbatim «أهداف الدرس» objectives — the tutor's grounding for the lesson. */
  concepts: string[];
}

/** One unit of the printed book: its opener, its lessons and its page span. */
export interface ScienceG8T1Unit {
  /** Printed unit ordinal («الأولى» …), used in consistency messages. */
  ordinal: string;
  /** Printed unit title, exactly as the contents page writes it. */
  title: string;
  /** Book page of the unit opener (the «دروس الوحدة / نواتج التعلم» page). */
  bookFrom: number;
  /** Last book page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: ScienceG8T1Lesson[];
}

/**
 * The book's printed «محتويات الكتاب» (book pages iv–v), transcribed verbatim:
 * four units of 4, 3, 2 and 2 lessons, starting at book pages 2, 40, 65 and 83.
 */
export const EGYPT_SCIENCE_G8_T1_UNITS: ScienceG8T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: المادة والطاقة",
    bookFrom: 1,
    bookTo: 38,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "حالات المادة",
        bookFrom: 2,
        concepts: [
          "يُصنف المواد إلى مواد صلبة وسائلة وغازية.",
          "يُقارن الخصائص الفيزيائية للمادة في حالاتها الأساسية.",
          "يستخدم نظرية الجسيمات لوصف سلوك المواد في الحالة الصلبة والسائلة والغازية.",
          "يُفسر بعض الخصائص الفيزيائية لحالات المادة في ضوء نظرية الجسيمات.",
          "يُقدر دور العلماء في اكتشاف حالة البلازما، وتطبيقاتها.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "تغير حالات المادة",
        bookFrom: 10,
        concepts: [
          "يستنتج تأثير الحرارة على تغير الحالة الفيزيائية للمادة.",
          "يرسم منحنى بياني يوضح العلاقة بين درجات الحرارة وحالات المادة.",
          "يتعرف العوامل المؤثرة على درجتي انصهار وغليان المادة.",
          "يُفسر أن تحولات المادة عمليات انعكاسية.",
          "يُفرق بين عمليات الغليان والتبخر والتسامي.",
          "يتعرف العوامل المؤثرة على معدل التبخر.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "الطاقة الداخلية ودرجة الحرارة",
        bookFrom: 21,
        concepts: [
          "يتعرف مفهوم النظام وأنواعه.",
          "يتعرف مفهوم درجة الحرارة.",
          "يكتشف العوامل المؤثرة في مقدار التغير في درجة حرارة المادة.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "طرق انتقال الحرارة",
        bookFrom: 30,
        concepts: [
          "يتعرف عمليًا طرق انتقال الحرارة (التوصيل والحمل والإشعاع) من أو إلى جسم ما.",
          "يصف تطبيقات التوصيل والحمل والإشعاع في عمليات التسخين والتبريد من خلال أمثلة شائعة.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: المادة والتفاعلات الكيميائية",
    bookFrom: 39,
    bookTo: 63,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "التفاعلات الكيميائية",
        bookFrom: 40,
        concepts: [
          "يتعرف مفهوم التفاعل الكيميائي.",
          "يتعرف ميكانيكية حدوث التفاعل الكيميائي.",
          "يستنتج دلائل حدوث التفاعل الكيميائي.",
          "يُفسر خصائص المواد قبل وبعد التفاعل الكيميائي.",
          "يذكر أمثلة حياتية للتفاعلات الكيميائية.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "المعادلة الكيميائية",
        bookFrom: 49,
        concepts: [
          "يتعرف مفهوم المعادلة الكيميائية.",
          "يستنتج قانون بقاء الكتلة (بقاء المادة).",
          "يحدد العلاقة بين قانون بقاء الكتلة و وزن المعادلة الكيميائية.",
          "يذكر خطوات وزن المعادلة الكيميائية.",
          "يزن المعادلات الكيميائية.",
          "يُصمم نماذج على المستوى الجزيئي لبعض الجزيئات أثناء حدوث التفاعل الكيميائي.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "كيمياء التغذية",
        bookFrom: 57,
        concepts: [
          "يتعرف تركيب كل من الكربوهيدرات والدهون والبروتينات.",
          "يكشف عمليًا عن كل من الكربوهيدرات والدهون والبروتينات في المواد الغذائية.",
          "يُحدد أهمية كل من الكربوهيدرات والدهون والبروتينات في التغذية والصناعة.",
          "يُفسر العلاقة بين الكربوهيدرات والدهون.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: تدفق الطاقة في عمليتي البناء الضوئي والتنفس الخلوي",
    bookFrom: 64,
    bookTo: 81,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "عملية البناء الضوئي",
        bookFrom: 65,
        concepts: [
          "يتعرف نتائج تجربة فان هيلمونت.",
          "يحدد تركيب البلاستيدة الخضراء.",
          "يكتشف دور الكلوروفيل في امتصاص الضوء.",
          "يتعرف آلية حدوث عملية البناء الضوئي.",
          "يميز بين التفاعلات الضوئية واللاضوئية في عملية البناء الضوئي.",
          "يكتشف تكوين النشا في عملية البناء الضوئي.",
          "يحدد العوامل المؤثرة في عملية البناء الضوئي.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "عملية التنفس الخلوي",
        bookFrom: 75,
        concepts: [
          "يُفرق بين عملية التبادل الغازي وعملية التنفس الخلوي في الكائنات الحية.",
          "يتعرف تركيب الميتوكوندريا.",
          "يتعرف مراحل عملية التنفس الخلوي.",
          "يُميز بين عمليات البناء والهدم في التمثيل الغذائي.",
        ],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "الوحدة الرابعة: العمليات الجيولوجية",
    bookFrom: 82,
    bookTo: 97,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "تغير سطح الأرض",
        bookFrom: 83,
        concepts: [
          "يتعرف فرضية الانجراف القاري للعالم فيجنر.",
          "يتعرف نظرية الصفائح التكتونية.",
          "يُميز بين أنواع حركة الصفائح التكتونية.",
          "يتعرف دور الزلازل والبراكين والنيازك في تغيير سطح الأرض.",
          "يستنتج المخاطر الكارثية للزلازل والبراكين.",
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        title: "تكوين المعادن والتربة",
        bookFrom: 91,
        concepts: [
          "يحدد خواص المعادن.",
          "يتعرف كيفية نشأة المعادن.",
          "يتعرف كيفية نشأة التربة.",
          "يستنتج محدودية الموارد غير المتجددة.",
          "يحدد دور النشاط البشرى في التوزيع غير العادل للموارد أو نضوبها.",
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
 * or the unit's last page for its last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_SCIENCE_G8_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SCIENCE_G8_T1_UNITS.forEach((unit, ui) => {
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
  "science-p2-t1",
);

/**
 * The OCR provider answers a truly blank page with this sentence instead of an
 * empty string. It means "no text", not content.
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
// Self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"; // U+0660..U+0669
const EXT_AR_DIGITS = "۰۱۲۳۴۵۶۷۸۹"; // U+06F0..U+06F9

/** Arabic-Indic digits → Latin. The scan mixes both ranges from page to page. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints in its running foot, or null when the
 * last line is not a running foot. The foot is one number alone («4»), or
 * wrapped with the lesson title («الدرس الأول: حالات المادة 3») or the unit
 * title («4 الوحدة الأولى: المادة والطاقة»). The last line is accepted only
 * when it looks like one of those — a lone numeral or a line carrying
 * «الوحدة»/«الدرس»/«الصف»/«الفصل» — so a content line or a unit opener line
 * that merely ends in a number is not mistaken for the foot.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  const latin = toLatinDigits(last);
  const runs = latin.match(/\d{1,3}/g) ?? [];
  if (runs.length !== 1) return null;
  const looksLikeFoot = /^[\d\s]+$/.test(latin) || /الوحدة|الدرس|الصف|الفصل/.test(last);
  if (!looksLikeFoot) return null;
  return Number(runs[0]);
}

/**
 * Strips everything but letters and digits, unifying the orthographic variants
 * OCR and the book's own running heads disagree on — diacritics, tatweel, the
 * alif/hamza forms, final ya (ى/ي) and ta-marbuta/ha (ة/ه) — so a head wrapped
 * across lines still matches the title printed on the contents page.
 */
function normalize(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_SCIENCE_G8_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_SCIENCE_G8_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_SCIENCE_G8_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SCIENCE_G8_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_SCIENCE_G8_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number;
 *  2. every content page carries real OCR text;
 *  3. every lesson's own first page prints that lesson's title;
 *  4. every printed page is owned by exactly one lesson — no page can fall
 *     between two lessons and be unreachable.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const ranges = allLessonRanges();
  let footersChecked = 0;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SCIENCE_G8_T1_BOOK_START || book > EGYPT_SCIENCE_G8_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_SCIENCE_G8_T1_BOOK_END - EGYPT_SCIENCE_G8_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_SCIENCE_G8_T1_BOOK_START} و${EGYPT_SCIENCE_G8_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title.
  EGYPT_SCIENCE_G8_T1_UNITS.forEach((unit) => {
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
