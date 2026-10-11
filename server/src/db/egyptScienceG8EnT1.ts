// PHASE — official Egypt Grade-8 (Preparatory-2) **Science, English-medium**,
// first term, Ministry 2026/2027 edition.
//
// The curriculum `eg-g8-science-en` is rebuilt from the Ministry textbook
// `Science_EN_Pep2_T1.pdf` (104 scan pages, all OCR'd) under
// server/data/curriculum-ocr/science-en-p2-t1/. This module is the single
// source of truth for its structure: the four units and their eleven lessons,
// exactly as the book's «Contents» (book pages iv–v) prints them, and the
// «Lesson Objectives» the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 6   (book page 2 = PDF page 8)
// Front matter is pdf 1–6 (cover, then roman ii–vi); content runs book 1–97 and
// pdf 104 is the printer's colophon, outside the taught range.
//
// The running foot, unlike the maths English book, is never a bare numeral: it
// always names the lesson («Lesson Four : METHODS OF HEAT TRANSFER 31») or the
// unit («32 Unit One : MATTER AND ENERGY»), with its single number at the line's
// end or start respectively. That shape is what proves the offset page by page —
// and it is why `printedFooter` scans backwards: on book 32 OCR floats the
// figure captions past the foot, leaving it at line 27 of 41.
//
// WHY THE APP'S LESSON IS THE BOOK'S «Lesson», NOT A CONCEPT
// The contents page lists four units whose lessons are numbered one…four
// (4, 3, 2 and 2 of them), and each lesson head prints «Lesson Terminology»,
// «Lesson Objectives» and «Lesson Preparation». There is no concept layer, so
// the app lesson is the printed Lesson — the same decision the Arabic edition
// (`egyptScienceG8T1.ts`) takes for the same four units.
// Unit openers (books 1, 39, 64, 82) and lesson heads (2, 10, 21, 30, 40, 49,
// 57, 65, 75, 83, 91) print no foot: 15 pages, leaving 82 that carry one.
//
// Titles are bilingual «English — Arabic», following `egyptMathEnT1.ts`: the
// English half is what the scan prints and what the book check compares, while
// the Arabic half keeps the UI readable for a tutor that answers in Arabic.
// Every objective below is transcribed from the scan's own «Lesson Objectives»
// block, verbatim — including the book's own spellings («Distinguishe»,
// «mitocondria»), which are the Ministry's, not ours to correct.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.2 = PDF p.8). */
export const BOOK_TO_PDF_OFFSET = 6;

/** First page of the taught book: the unit-1 opener. Front matter is 0 and below. */
export const EGYPT_SCIENCE_G8_EN_T1_BOOK_START = 1;

/** Last taught page: unit 4's last lesson ends on its own evaluation questions. */
export const EGYPT_SCIENCE_G8_EN_T1_BOOK_END = 97;

/** The «Lesson Objectives» the book prints at the head of each lesson, verbatim. */
export interface ScienceG8EnLesson {
  /** Position inside the unit, as printed («1-1» … «4-2»); also the code suffix. */
  key: string;
  /** Printed lesson ordinal in the UI's own language, used to build the title. */
  ordinal: string;
  /** Printed lesson title — English half is what its own first page prints. */
  title: string;
  /** Book page the lesson starts on (its head page). */
  bookFrom: number;
  /** Verbatim «Lesson Objectives» — the tutor's grounding for the lesson. */
  concepts: string[];
}

/** One unit of the printed book: its opener, its lessons and its page span. */
export interface ScienceG8EnUnit {
  /** Printed unit ordinal in the UI's own language, used in consistency messages. */
  ordinal: string;
  /** Printed unit title, exactly as the contents page writes it, plus its Arabic. */
  title: string;
  /** Book page of the unit opener (the unit's lesson list page). */
  bookFrom: number;
  /** Last book page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: ScienceG8EnLesson[];
}

/**
 * The book's printed «Contents» (book pages iv–v), transcribed verbatim:
 * four units of 4, 3, 2 and 2 lessons, starting at book pages 1, 39, 64 and 82.
 */
export const EGYPT_SCIENCE_G8_EN_T1_UNITS: ScienceG8EnUnit[] = [
  {
    ordinal: "الأولى",
    title: "Unit 1: Matter and Energy — الوحدة الأولى: المادة والطاقة",
    bookFrom: 1,
    bookTo: 38,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "States of Matter — حالات المادة",
        bookFrom: 2,
        concepts: [
          "Classify materials into solids, liquids and gases.",
          "Compare the physical properties of matter in its fundamental states.",
          "Use particle theory to describe the behavior of matter in its solid, liquid and gaseous states.",
          "Explain some physical properties of matter in different states in terms of particle theory.",
          "Appreciate the role of scientists in discovering the plasma state and its applications.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "Changes in the States of Matter — تغير حالات المادة",
        bookFrom: 10,
        concepts: [
          "Conclude the effect of heat on the change in the physical state of matter.",
          "Draw a graph showing the relationship between temperature and the states of matter.",
          "Identify the factors that affect the melting and boiling points of a substance.",
          "Explain that the conversions in the states of matter are reversible processes.",
          "Distinguishe between boiling, evaporation and sublimation.",
          "Identify the factors affecting the rate of evaporation.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "Internal Energy and Temperature — الطاقة الداخلية ودرجة الحرارة",
        bookFrom: 21,
        concepts: [
          "Understand the concept of systems and their types.",
          "Understand the concept of temperature.",
          "Identify the factors that affect the quantity of change in temperature of a substance.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "Methods of Heat Transfer — طرق انتقال الحرارة",
        bookFrom: 30,
        concepts: [
          "Practically identify the methods of heat transfer (conduction, convection, and radiation) from or to an object.",
          "Describe the applications of conduction, convection, and radiation in heating and cooling processes using common examples.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "Unit 2: Matter and Chemical Reactions — الوحدة الثانية: المادة والتفاعلات الكيميائية",
    bookFrom: 39,
    bookTo: 63,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "Chemical Reactions — التفاعلات الكيميائية",
        bookFrom: 40,
        concepts: [
          "Understand the concept of chemical reactions.",
          "Understand the mechanism of chemical reactions.",
          "Conclude evidence of chemical reactions.",
          "Explain the properties of substances before and after a chemical reaction.",
          "Give real-life examples of chemical reactions.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "Chemical Equations — المعادلة الكيميائية",
        bookFrom: 49,
        concepts: [
          "Recognize the concept of chemical equations.",
          "Deduce the law of conservation of mass (conservation of matter).",
          "Determine the relation between the law of conservation of mass and balancing of a chemical equation.",
          "List the steps for balancing a chemical equation.",
          "Balance chemical equations.",
          "Design models at the molecular level for some molecules during a chemical reaction.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "Nutritional Chemistry — كيمياء التغذية",
        bookFrom: 57,
        concepts: [
          "Identify the composition of carbohydrates, fats and proteins.",
          "Practically detect the presence of carbohydrates, fats and proteins in food.",
          "Identify the importance of carbohydrates, fats and proteins in nutrition and industry.",
          "Explain the relation between carbohydrates and fats.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title:
      "Unit 3: Energy Flow in Photosynthesis and Cellular Respiration — الوحدة الثالثة: تدفق الطاقة في عمليتي البناء الضوئي والتنفس الخلوي",
    bookFrom: 64,
    bookTo: 81,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "Photosynthesis — عملية البناء الضوئي",
        bookFrom: 65,
        concepts: [
          "Identify the results of Van Helmont's experiment.",
          "Identify the structure of the green plastids (chloroplasts).",
          "Discover the role of chlorophyll in light absorption.",
          "Recognize the mechanism of photosynthesis.",
          "Distinguish between light dependent reactions and light independent reactions in photosynthesis.",
          "Discover the formation of starch in photosynthesis.",
          "Identify the factors that affect photosynthesis.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "Cellular Respiration — عملية التنفس الخلوي",
        bookFrom: 75,
        concepts: [
          "Distinguish between gas exchange and cellular respiration in living organisms.",
          "Identify the structure of the mitocondria.",
          "Recognize the mechanism of cellular respiration.",
          "Distinguish between anabolic and catabolic processes in metabolism.",
        ],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "Unit 4: Geological Processes — الوحدة الرابعة: العمليات الجيولوجية",
    bookFrom: 82,
    bookTo: 97,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "Changes in Earth's surface — تغير سطح الأرض",
        bookFrom: 83,
        concepts: [
          "Identify Wegener's hypothesis of continental drift.",
          "Understand the theory of tectonic plates.",
          "Distinguish between the types of tectonic plates' movements.",
          "Recognize the role of earthquakes, volcanoes and meteorites in changing Earth's surface.",
          "Conclude the catastrophic risks of earthquakes and volcanoes.",
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        title: "Formation of Minerals and Soil — تكوين المعادن والتربة",
        bookFrom: 91,
        concepts: [
          "Identify the properties of minerals.",
          "Understand how minerals are formed.",
          "Understand how soil is formed.",
          "Conclude that non-renewable resources are limited.",
          "Identify the role of human activity in the unequal distribution or depletion of resources.",
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
  const unit = EGYPT_SCIENCE_G8_EN_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SCIENCE_G8_EN_T1_UNITS.forEach((unit, ui) => {
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
  "science-en-p2-t1",
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

/** Arabic-Indic digits → Latin. The cover is Arabic and may print either range. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * Is this line shaped like the book's running foot? It must name the lesson or
 * the unit, carry the caption's colon, and hold exactly one number at the very
 * start or the very end of the line — never in the middle, which is what keeps
 * a content line («Heat is transferred by three methods: 1 Conduction. 2 …»)
 * or a unit heading («UNIT 1», no colon) from being read as a page number.
 */
function footNumber(line: string): number | null {
  if (!/lesson|unit/i.test(line)) return null;
  if (!line.includes(" : ")) return null;
  const runs = toLatinDigits(line).match(/\d{1,3}/g) ?? [];
  if (runs.length !== 1) return null;
  const at = toLatinDigits(line).indexOf(runs[0]!);
  const endsLine = at + runs[0]!.length === line.length;
  if (!endsLine && at !== 0) return null;
  return Number(runs[0]);
}

/**
 * The book number a content page prints in its running foot, or null when the
 * page prints none. The foot is never bare here: it is the lesson caption
 * carrying the number at its end («Lesson Four : METHODS OF HEAT TRANSFER 31»)
 * or the number leading the unit caption («32 Unit One : MATTER AND ENERGY»).
 *
 * The lines are walked backwards rather than only the last one because OCR
 * floats a page's figure captions past its foot — book 32 prints its foot at
 * line 27 of 41 — while the 15 opener pages carry no foot anywhere at all.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    const n = footNumber(lines[i]!);
    if (n !== null) return n;
  }
  return null;
}

/** Lowercase alphanumerics only — lets a title match across the book's layout. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_SCIENCE_G8_EN_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_SCIENCE_G8_EN_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_SCIENCE_G8_EN_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SCIENCE_G8_EN_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_SCIENCE_G8_EN_T1_BOOK_END}، وجدنا ${last.bookTo}`);
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
    if (book < EGYPT_SCIENCE_G8_EN_T1_BOOK_START || book > EGYPT_SCIENCE_G8_EN_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_SCIENCE_G8_EN_T1_BOOK_END - EGYPT_SCIENCE_G8_EN_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_SCIENCE_G8_EN_T1_BOOK_START} و${EGYPT_SCIENCE_G8_EN_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title. The stored title is
  // bilingual; the scan only prints the English half, so that is what compares.
  EGYPT_SCIENCE_G8_EN_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      const english = lesson.title.split(" — ")[0]!;
      if (!normalize(opener).includes(normalize(english))) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع عنوانه «${english}»`);
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
