// PHASE 97 — official Egypt Preparatory-1 (Grade 7) **Science, English-medium**,
// first term, Ministry 2026/2027 edition.
//
// The curriculum `eg-g7-science-en` is rebuilt from the Ministry textbook
// `Science_Prep1_T1_EN.pdf` (102 scan pages, all OCR'd) under
// server/data/curriculum-ocr/science-en-p1-t1/. This module is the single source
// of truth for its structure: the four units and their twelve lessons, exactly as
// the book's «Contents» (book pages iv–v) prints them, and the «Lesson
// Objectives» the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 7   (book page 2 = PDF page 9, book page 93 = PDF page 100)
// Front matter is pdf 1–7 (cover, then roman ii–vi); content runs book 1–93 and
// pdf 101–102 is the printer's colophon / back cover, outside the taught range.
//
// The running foot is never a bare numeral: it always names the lesson
// («LESSON ONE : Structure of the Atom 3») or the unit («4 UNIT ONE : The
// Matter»), with its single number at the line's end or start respectively; the
// four unit openers carry no foot at all. That shape is what proves the offset
// page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «Lesson»
// The contents lists four units of four, three, three and two numbered Lessons
// («Lesson one … Lesson four»), each with its printed «Lesson Objectives». The
// app lesson is that printed Lesson, and its concepts are those printed
// objectives. A unit's opener rides with its first lesson and its «Unit
// Assessment» with its last, exactly as in the Arabic edition.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.3 = PDF p.10). */
export const BOOK_TO_PDF_OFFSET = 7;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_SCIENCE_EN_P1_T1_BOOK_START = 1;

/** Last printed content page — the book's unit-4 assessment. */
export const EGYPT_SCIENCE_EN_P1_T1_BOOK_END = 93;

/** One lesson of the textbook — becomes one lesson in the app tree. */
export interface ScienceEnP1T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the app lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed at the head of the lesson, bilingual «English — Arabic». */
  title: string;
  /**
   * First printed book page of the lesson itself. The range the lesson *owns*
   * also includes its unit's opener when it is the unit's first lesson, which is
   * why ownership is derived by `lessonBookRange` rather than stored here.
   */
  bookFrom: number;
  /** The book's printed «Lesson Objectives» for this lesson. */
  concepts: string[];
}

export interface ScienceEnP1T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "Unit 2: Force Fields — الوحدة الثانية: مجالات القوى". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: ScienceEnP1T1Lesson[];
}

/**
 * The four units of the first term with their twelve lessons: unit/lesson starts
 * from the book's contents page (iv), objectives from each lesson's first page
 * (2, 10, 18, …). Verified against every printed page by
 * `assertTreeMatchesTheBook`.
 */
export const EGYPT_SCIENCE_EN_P1_T1_UNITS: ScienceEnP1T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "Unit 1: The Matter — الوحدة الأولى: المادة",
    bookFrom: 1,
    bookTo: 31,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "Structure of the Atom — تركيب الذرة",
        bookFrom: 2,
        concepts: [
          "Conclude that the atom is the building unit of all matter.",
          "Find out the role of the scientist Ernest Rutherford in discovering the atomic structure.",
          "Identify the subatomic components of the atom.",
          "Recognize the charges and masses of the atomic components.",
          "Determine the locations of subatomic components within the atom.",
          "Recognize that electrons orbit in different shapes at different energy levels.",
          "Explain the chemical symbols of some elements.",
          "Conclude the number of electrons that occupy energy levels.",
          "Determine the relationship between the number of subatomic particles that form the atom.",
          "Identify isotopes.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "The Periodic Table of Elements — الجدول الدوري لتصنيف العناصر",
        bookFrom: 10,
        concepts: [
          "Explain the role of the scientist Dmitri Mendeleev in arranging the elements in an ascending order regarding their atomic masses.",
          "Confirm that the modern periodic table reflects the electron configurations and properties of atoms.",
          "Relate the atomic numbers of group A elements to their locations in the modern periodic table.",
          "Identify the electron configurations of the atoms of the elements according to the modern periodic table.",
          "Show that chemical properties are similar in some groups of the modern periodic table.",
          "Conclude the relation between an element location in the periodic table and its chemical activity.",
          "Appreciate the role of the scientists in the evolution of the elements classification attempts.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "Matter and Its Properties — المادة وخصائصها",
        bookFrom: 18,
        concepts: [
          "Analyze data showing that a pure substance consists of one type of atoms or molecules.",
          "Explain the difference between the molecules of elements and compounds.",
          "Analyze data about the composition of different substances.",
          "Explore that the number of the atoms that compose the molecules of compounds ranges between two atoms to several thousands.",
          "Differentiate between substances based on their physical and chemical properties.",
          "Predict the uses of materials based on their properties.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "Chemical Bonds — الروابط الكيميائية",
        bookFrom: 26,
        concepts: [
          "Differentiate between ionic and covalent bonding.",
          "Express covalent bonding with single valence electrons.",
          "Relate the atomic structure of carbon to its distinctive properties in forming organic materials.",
          "Explain the bonding in a methane molecule as the simplest organic compound.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "Unit 2: Force Fields — الوحدة الثانية: مجالات القوى",
    bookFrom: 32,
    bookTo: 54,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "Electric Forces — القوى الكهربية",
        bookFrom: 33,
        concepts: [
          "Conduct activities that illustrate the concept of static electricity.",
          "Explain how objects acquire static charges.",
          "Provide evidence of the existence of an electric field between non-contact objects.",
          "Recognize the electric field.",
          "Describe the properties of electric field lines.",
          "List the uses of an electroscope.",
          "Design a model showing that electric forces act at a distance.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "Magnetic Forces — القوى المغناطيسية",
        bookFrom: 41,
        concepts: [
          "Recognize the shapes of magnets.",
          "Differentiate between magnetic and non-magnetic materials.",
          "Explore the properties of magnets.",
          "Conclude the law of attraction and repulsion.",
          "Recognize the magnetic field.",
          "Draw magnetic field lines for a magnet.",
          "Draw magnetic field lines for the opposite poles of two magnets.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "Gravitational Forces — قوى الجاذبية",
        bookFrom: 47,
        concepts: [
          "Recognize the gravitational field.",
          "Provide evidence of the existence of gravity between non-contacting objects.",
          "Distinguish between contact forces and field forces.",
          "Identify the factors that affect the gravitational forces.",
          "Provide evidence that gravitational forces are always attractive.",
          "Provide evidence that gravitational forces are very weak between any two objects whose masses are small.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title:
      "Unit 3: Living Organisms, Their Structure and Processes — الوحدة الثالثة: الكائنات الحية تركيبها وعملياتها",
    bookFrom: 55,
    bookTo: 78,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "Cells and Life — الخلايا والحياة",
        bookFrom: 56,
        concepts: [
          "Provide evidence that all living organisms are composed of cells as the basic unit of structure and function.",
          "Classify living organisms into prokaryotes and eukaryotes.",
          "Classify living organisms into unicellular and multicellular organisms.",
          "Compare between prokaryotes and eukaryotes.",
          "Recognize the role of stem cells in the differentiation of tissues and organs in multicellular organisms.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "General Characteristics of Living Organisms — الصفات العامة للكائنات الحية",
        bookFrom: 64,
        concepts: [
          "List the general characteristics of living organisms.",
          "Relate the general characteristics of life to the cell functions in prokaryotes.",
          "Relate the general characteristics of life to the cell functions in eukaryotes.",
          "Explain the combination between the photosynthesis process and the cellular respiration.",
          "Recognize about the transport in each of animals and plants.",
          "Compare between the means of movement in some unicellular organisms.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "Microbes — الميكروبات",
        bookFrom: 72,
        concepts: [
          "Classify microbes into prokaryotes and eukaryotes.",
          "List types of microbes.",
          "Describe examples of beneficial types of microbes.",
          "List the benefits of microbes to humans.",
          "Describe examples of harmful types of microbes.",
          "Identify diseases resulting from food contamination.",
          "Appreciate the efforts of the scientists in discovering diseases and the methods for their treatment.",
        ],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "Unit 4: The (Earth - Sun - Moon) System — الوحدة الرابعة: نظام (الأرض - الشمس - القمر)",
    bookFrom: 79,
    bookTo: 93,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "The Earth and the Solar System — الأرض والنظام الشمسي",
        bookFrom: 80,
        concepts: [
          "Conclude the similarities and differences among the planets in the solar system.",
          "Recognize some of the consequences of Earth's axis tilt.",
          "Conclude the relation between the apparent motion of the sun and the lengths of shadows cast by objects.",
          "Conclude the relation between the tilt of Earth's axis and its orbiting around the sun with changing seasons.",
          "Conclude the relation between the number of the daylight hours and the four seasons.",
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        title: "Lunar Eclipse — خسوف القمر",
        bookFrom: 88,
        concepts: [
          "Distinguish between the phases of the moon.",
          "Identify the full moon phase.",
          "Understand the formation of shadows and penumbra for dark objects.",
          "Explain the phenomenon of lunar eclipse.",
          "Write a report on solar eclipse.",
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
 * the unit opener and each lesson's activity block inside the lesson they
 * belong to — and lands the unit assessment on the last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_SCIENCE_EN_P1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SCIENCE_EN_P1_T1_UNITS.forEach((unit, ui) => {
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
  "science-en-p1-t1",
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
 * carrying the number at its end («LESSON ONE : Structure of the Atom 3») or the
 * number leading the unit caption («4 UNIT ONE : The Matter»). The lines are
 * walked backwards rather than only the last one because OCR floats a page's
 * figure captions past its foot, while the four unit openers carry no foot.
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
  const units = EGYPT_SCIENCE_EN_P1_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_SCIENCE_EN_P1_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_SCIENCE_EN_P1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SCIENCE_EN_P1_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_SCIENCE_EN_P1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
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

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SCIENCE_EN_P1_T1_BOOK_START || book > EGYPT_SCIENCE_EN_P1_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_SCIENCE_EN_P1_T1_BOOK_END - EGYPT_SCIENCE_EN_P1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_SCIENCE_EN_P1_T1_BOOK_START} و${EGYPT_SCIENCE_EN_P1_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title. The stored title is
  // bilingual; the scan only prints the English half, so that is what compares.
  EGYPT_SCIENCE_EN_P1_T1_UNITS.forEach((unit) => {
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
