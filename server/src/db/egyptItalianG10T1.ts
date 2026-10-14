// Egypt Secondary-1 (Grade 10) Italian, first term — «Progetto italiano
// Junior 1 Plus», the six Unità of the main course book.
//
// The first term IS the Ministry textbook: the six units of its printed
// «Indice» (book pages 5–6) and the pages they occupy (book pages 7–46). This
// file is the book's table — one section per Unità, one lesson per printed
// lesson letter (A/B/C/D) plus the culture+review page-block that closes a unit
// — and a set of helpers so the seeder and the stage share the same page map.
// The self-checks at the bottom prove the mapping against the OCR itself.
//
// THE OFFSET IS ZERO — book page = scan page
// Every content page prints its own number (scan page 7 prints «7», scan 45
// prints «45» glued to its source line, «45 Fonte: Top girl»), so a book page N
// is scan page N (`BOOK_TO_PDF_OFFSET = 0`).
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Pages 1–6 are the cover and the printed «Indice» (Contents); pages 47–112 are
// the Minitest, the exercises, the grammar appendix, the glossary and the
// solutions. None of them is a lesson. The term runs from the Unit 1 opener
// (page 7) to the last page of Unit 6's culture+review block (page 46):
// `EGYPT_ITALIAN_G10_T1_BOOK_START` / `_END` are exactly those two pages, and
// the tiling assertion proves nothing in between is left unreachable.
//
// THE UNIT TITLES LIVE ONLY IN THE CONTENTS
// The opener pages of Unità 1, 3 and 5 print «Per cominciare...», not the unit
// name; the unit titles (`Benvenuti!`, `A scuola`, …) are printed only on the
// Contents pages 5–6. The tree therefore records them in the section `title`,
// but the book itself never repeats them on a lesson page.
//
// EACH LESSON'S CONCEPTS ARE THE CONTENTS' OWN WORDS
// The book prints no per-lesson objectives; its «Elementi comunicativi e
// lessicali» / «Elementi grammaticali» sit in the Indice next to each lesson
// letter. Every lesson below carries those lines verbatim, so the tutor's
// roadmap is exactly what the student's own Contents prints.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** One lesson of the book — becomes one lesson in the app tree. */
export interface ItalianG10T1Lesson {
  /** App-addressable key, e.g. "1-1" (Unità 1, lesson 1). */
  key: string;
  /** Full app-facing lesson title, e.g. "Parole e lettere". */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`): its title for a normal lesson, the culture
   * heading for a «Conosciamo l'Italia» block, or «Per cominciare...» when the
   * first page is the unit opener.
   */
  printedHead: string;
  /** First printed book page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed «Indice» lines for this lesson, verbatim. */
  concepts: string[];
}

/** One printed section of the book — one of the six Unità. */
export interface ItalianG10T1Section {
  /** Internal key: "1"…"6". */
  key: string;
  kind: "unit";
  /** Section title as printed in the Indice (never repeated on the pages). */
  title: string;
  /** The section's title as the Indice prints it (see the interface note). */
  footerTitle: string;
  /** First printed page of the section (the unit opener). */
  bookFrom: number;
  /** Last printed page of the section. */
  bookTo: number;
  lessons: ItalianG10T1Lesson[];
}

// ---------------------------------------------------------------------------
// THE OFFSET AND THE TERM'S BOUNDS
// ---------------------------------------------------------------------------

/** Book page = scan page (every content page prints its own number). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the term — the Unità 1 opener. */
export const EGYPT_ITALIAN_G10_T1_BOOK_START = 7;

/** Last printed page of the term — the end of Unità 6's culture+review block. */
export const EGYPT_ITALIAN_G10_T1_BOOK_END = 46;

// ---------------------------------------------------------------------------
// THE SIX UNITÀ
// ---------------------------------------------------------------------------

/**
 * The six Unità of the main book, in order. Each unit tiles its own page range
 * with no gap; a lesson's range runs from its `bookFrom` to the page before the
 * next lesson (the section's `bookTo` for the last one), with the unit opener
 * riding with the unit's first lesson. The culture+review block that closes
 * Unità 2, 4 and 6 is recorded as one lesson carrying the culture pages and the
 * «Che cosa ricordate…?» review page.
 */
export const EGYPT_ITALIAN_G10_T1_SECTIONS: ItalianG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    title: "Benvenuti!",
    footerTitle: "Benvenuti!",
    bookFrom: 7,
    bookTo: 12,
    lessons: [
      {
        key: "1-1",
        title: "Parole e lettere",
        printedHead: "Parole e lettere",
        bookFrom: 7,
        concepts: [
          "Presentazione di alcune parole italiane conosciute anche all'estero",
          "Computazione delle parole",
          "Alfabeto",
          "Pronuncia (c-g)",
        ],
      },
      {
        key: "1-2",
        title: "Italiano o italiana?",
        printedHead: "Italiano o italiana?",
        bookFrom: 9,
        concepts: ["Sostantivi e aggettivi (genere e numero)", "Accordo sostantivi e aggettivi"],
      },
      {
        key: "1-3",
        title: "Ciao, io sono Gianna...",
        printedHead: "Ciao, io sono Gianna...",
        bookFrom: 10,
        concepts: [
          "Presentarsi, presentare qualcuno",
          "Salutare / Rispondere a un saluto",
          "Nazionalità",
          "Chiedere e dire la nazionalità",
          "Pronomi personali soggetto",
          "Indicativo presente di essere",
          "Pronuncia (s-ss-sc)",
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    title: "Il ragazzo o la ragazza?",
    footerTitle: "Il ragazzo o la ragazza?",
    bookFrom: 13,
    bookTo: 18,
    lessons: [
      {
        key: "2-1",
        title: "Il ragazzo o la ragazza?",
        printedHead: "Il ragazzo o la ragazza?",
        bookFrom: 13,
        concepts: [
          "Costruire le prime frasi complete",
          "Numeri cardinali (1-10)",
          "Articolo determinativo",
          "Pronuncia (gn-gl-z)",
        ],
      },
      {
        key: "2-2",
        title: "Chi è?",
        printedHead: "Chi è?",
        bookFrom: 15,
        concepts: [
          "Chiedere e dire il nome",
          "Chiedere e dire l'età",
          "Numeri cardinali (11-30)",
          "Indicativo presente di avere",
          "Indicativo presente di chiamarsi (io, tu, lui/lei)",
          "Pronuncia (doppie consonanti)",
        ],
      },
      {
        key: "2-3",
        title: "In classe",
        printedHead: "In classe",
        bookFrom: 17,
        concepts: ["Brevi frasi di uso comune in classe"],
      },
      {
        key: "2-4",
        title: "Conosciamo l'Italia",
        printedHead: "Città italiane",
        bookFrom: 18,
        concepts: [
          "Immagini di alcuni importanti monumenti storici di varie città italiane",
          "Che cosa ricordate delle unità 1 e 2?",
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    title: "A scuola",
    footerTitle: "A scuola",
    bookFrom: 19,
    bookTo: 24,
    lessons: [
      {
        key: "3-1",
        title: "Sei nuova, no?",
        printedHead: "Per cominciare...",
        bookFrom: 19,
        concepts: [
          "Fare conoscenza",
          "Le tre coniugazioni dei verbi (-are, -ere, -ire)",
          "Indicativo presente: verbi regolari",
        ],
      },
      {
        key: "3-2",
        title: "Una giornata importante!",
        printedHead: "Una giornata importante!",
        bookFrom: 23,
        concepts: [
          "Tenere un blog, un diario",
          "Parlare degli amici / Descrivere gli amici",
          "Articolo indeterminativo",
        ],
      },
      {
        key: "3-3",
        title: "Ciao Maria!",
        printedHead: "Ciao Maria!",
        bookFrom: 24,
        concepts: ["Salutare (formale e informale)", "Rispondere a un saluto"],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    title: "Di dove sei?",
    footerTitle: "Di dove sei?",
    bookFrom: 25,
    bookTo: 32,
    lessons: [
      {
        key: "4-1",
        title: "Di dove sei?",
        printedHead: "Di dove sei?",
        bookFrom: 25,
        concepts: [
          "Chiedere e dare informazioni su di sé e gli altri",
          "Indicativo presente dei verbi in -ire che prendono -isc (preferire, spedire ecc.)",
        ],
      },
      {
        key: "4-2",
        title: "E Lei, come si chiama?",
        printedHead: "E Lei, come si chiama?",
        bookFrom: 26,
        concepts: [
          "Rivolgersi a qualcuno dando del Lei",
          "Chiedere come sta una persona",
          "Forma di cortesia",
        ],
      },
      {
        key: "4-3",
        title: "Com'è?",
        printedHead: "Com'è?",
        bookFrom: 27,
        concepts: [
          "Descrivere l'aspetto fisico e il carattere",
          "Le parti del viso e del corpo umano",
          "Aggettivi in -e",
        ],
      },
      {
        key: "4-4",
        title: "Conosciamo l'Italia",
        printedHead: "La scuola in Italia",
        bookFrom: 30,
        concepts: [
          "La scuola in Italia. Informazioni sull'ordinamento, le materie e altre curiosità sulla scuola italiana",
          "Che cosa ricordate delle unità 1, 2, 3 e 4?",
        ],
      },
    ],
  },
  {
    key: "5",
    kind: "unit",
    title: "Tempo libero",
    footerTitle: "Tempo libero",
    bookFrom: 33,
    bookTo: 38,
    lessons: [
      {
        key: "5-1",
        title: "Dove andate di solito?",
        printedHead: "Per cominciare...",
        bookFrom: 33,
        concepts: [
          "Attività più comuni del tempo libero",
          "Discutere del tempo libero",
          "Indicativo presente: verbi irregolari (andare, venire, fare, uscire ecc.)",
        ],
      },
      {
        key: "5-2",
        title: "Vieni con noi?",
        printedHead: "Vieni con noi?",
        bookFrom: 37,
        concepts: ["Invitare", "Accettare o rifiutare un invito", "I giorni della settimana"],
      },
    ],
  },
  {
    key: "6",
    kind: "unit",
    title: "Perché non venite a casa mia?",
    footerTitle: "Perché non venite a casa mia?",
    bookFrom: 39,
    bookTo: 46,
    lessons: [
      {
        key: "6-1",
        title: "Perché non venite a casa mia?",
        printedHead: "Perché non venite a casa mia?",
        bookFrom: 39,
        concepts: [
          "Prendere accordi per un appuntamento",
          "Chiedere / Dare l'indirizzo",
          "Indicativo presente dei verbi modali: potere, volere e dovere",
        ],
      },
      {
        key: "6-2",
        title: "Un appartamento al quarto piano",
        printedHead: "Un appartamento al quarto piano",
        bookFrom: 40,
        concepts: ["Descrivere l'abitazione, le stanze dell'appartamento", "Numeri ordinali (1°-12°)"],
      },
      {
        key: "6-3",
        title: "Che fai nel tempo libero?",
        printedHead: "Che fai nel tempo libero?",
        bookFrom: 41,
        concepts: [
          "Reimpiego dei contenuti attraverso alcune abilità (ascoltare, parlare, scrivere)",
          "Le preposizioni",
        ],
      },
      {
        key: "6-4",
        title: "Che ora è? / Che ore sono?",
        printedHead: "Che ora è? / Che ore sono?",
        bookFrom: 42,
        concepts: ["Numeri cardinali (30-100)", "Chiedere / Dire l'ora"],
      },
      {
        key: "6-5",
        title: "Conosciamo l'Italia",
        printedHead: "I mezzi di trasporto urbano",
        bookFrom: 44,
        concepts: [
          "I mezzi di trasporto urbano",
          "Il tempo libero dei ragazzi italiani",
          "Cosa ricordate delle unità 3, 4, 5 e 6?",
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
 * lesson — the unit opener) or its own start page, up to the page before the next
 * lesson starts, or the section's last page for its last lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_ITALIAN_G10_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const ranges: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ITALIAN_G10_T1_SECTIONS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      ranges.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return ranges;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This book has
 * no separate listening/audio appendix bound into the term: the whole term is
 * pages 7–46 and every page belongs to exactly one lesson. Kept as a function
 * so the seeder and the stage share one shape across all the books.
 */
export function allLessonExtras(): Map<string, number[]> {
  return new Map<string, number[]>();
}

// ---------------------------------------------------------------------------
// OCR loading
// ---------------------------------------------------------------------------

const OCR_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "curriculum-ocr",
  "italian-g10-t1",
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

/** One page of a lesson's document, with a stable printed-page marker. */
function pageBlock(book: number, text: string): string {
  return `### صفحة ${book}\n${text}`;
}

/** The document a lesson grounds the tutor in: its own page range, in order. */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(sectionIndex, lessonIndex);
  const parts: string[] = [];
  for (let p = from; p <= to; p++) {
    const text = loadBookPage(p);
    if (text) parts.push(pageBlock(p, text));
  }
  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/** Strips everything but letters and digits, so OCR spacing cannot break a match. */
function normalize(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Page-number candidates a content page prints. This book carries no running
 * head — only the bare page number, sometimes at the top and sometimes at the
 * foot — so the number cannot be found by position. Every page prints it either
 * alone on its own line («7», «26») or glued to a running-text line
 * («45 Fonte: Top girl»), so we scan every line for both shapes and collect the
 * numbers, excluding the activity numbers (which carry a trailing dot and never
 * match the glued shape).
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const candidates = new Set<number>();
  for (const line of lines) {
    const alone = line.match(/^(\d{1,3})$/);
    if (alone) {
      candidates.add(Number(alone[1]));
      continue;
    }
    const glued = line.match(/^(\d{1,3})\s+\p{L}/u);
    if (glued) candidates.add(Number(glued[1]));
  }
  return [...candidates].sort((a, b) => a - b);
}

/**
 * The book number a content page prints, or null. Every content page prints its
 * own number, so a page that carries it returns itself; a mismatch returns the
 * largest candidate so the caller can see the difference.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * Lessons whose title is NOT printed on their pages. A «Conosciamo l'Italia»
 * block prints its culture headings («Città italiane», «La scuola in Italia»,
 * «I mezzi di trasporto urbano», «Il tempo libero dei ragazzi italiani») and the
 * «Che cosa ricordate…?» review, never the words «Conosciamo l'Italia», so the
 * title check skips these lessons and the culture anchors below stand in.
 */
const CULTURE_LESSONS = new Set(["2-4", "4-4", "6-5"]);

/**
 * Culture-page titles and the printed page each starts on, checked in place of
 * the «Conosciamo l'Italia» lesson titles.
 */
const CULTURE_ANCHORS: { title: string; page: number }[] = [
  { title: "Città italiane", page: 18 },
  { title: "La scuola in Italia", page: 30 },
  { title: "I mezzi di trasporto urbano", page: 44 },
  { title: "Il tempo libero dei ragazzi italiani", page: 45 },
];

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its section, sections tile the book with no gaps or overlaps, and the first
 * section starts where the Contents says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_ITALIAN_G10_T1_SECTIONS;

  sections.forEach((section, si) => {
    if (section.lessons.length === 0) problems.push(`القسم ${section.key}: بلا دروس`);
    if (!section.footerTitle.trim()) problems.push(`القسم ${section.key}: بلا عنوان`);
    section.lessons.forEach((lesson, li) => {
      const expectedKey = `${section.key}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`القسم ${section.key} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (!lesson.title.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان`);
      if (!lesson.printedHead.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان مطبوع`);
      if (lesson.bookFrom < section.bookFrom || lesson.bookFrom > section.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${section.bookFrom}–${section.bookTo}`);
      }
      const { from, to } = lessonBookRange(si, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < section.bookFrom || to > section.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${section.bookFrom}–${section.bookTo}`);
      }
      const next = section.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== section.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر القسم ${section.bookFrom}، وجدنا ${from}`);
      }
    });
    const nextSection = sections[si + 1];
    if (nextSection && section.bookTo >= nextSection.bookFrom) {
      problems.push(`القسم ${section.key} يتداخل مع القسم ${nextSection.key}`);
    }
    if (nextSection && section.bookTo + 1 !== nextSection.bookFrom) {
      problems.push(`فجوة بين القسم ${section.key} (حتى ${section.bookTo}) والقسم ${nextSection.key} (من ${nextSection.bookFrom})`);
    }
  });

  const first = sections[0]!;
  const last = sections[sections.length - 1]!;
  if (first.bookFrom !== EGYPT_ITALIAN_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من ${EGYPT_ITALIAN_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last.bookTo !== EGYPT_ITALIAN_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند ${EGYPT_ITALIAN_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every page of the term carries real OCR text and prints its own book
 *     number in its head or foot;
 *  2. every lesson's own first page prints that lesson's head (its title, its
 *     culture heading, or the unit opener's «Per cominciare...»);
 *  3. every lesson's title is printed somewhere in its page range — except the
 *     «Conosciamo l'Italia» lessons, whose pages print the culture titles
 *     instead (those are checked as anchors);
 *  4. every printed page is owned by exactly one lesson — no page falls between
 *     two lessons and is unreachable;
 *  5. the pages tile the term [START, END] with no gap.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const sections = EGYPT_ITALIAN_G10_T1_SECTIONS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let footersChecked = 0;

  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ITALIAN_G10_T1_BOOK_START || book > EGYPT_ITALIAN_G10_T1_BOOK_END) continue;
    printedPages.add(book);

    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }

    const footer = printedFooter(book);
    if (footer === null) {
      problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع`);
    } else {
      footersChecked += 1;
      if (footer !== book) problems.push(`صفحة الكتاب ${book}: رقمها المطبوع لا يطابقها (وجدنا ${footer})`);
    }
  }

  // 2. every lesson's own first page prints that lesson's head.
  for (const section of sections) {
    for (const lesson of section.lessons) {
      const page = loadBookPage(lesson.bookFrom);
      if (!page) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        continue;
      }
      if (!normalize(page).toLowerCase().includes(normalize(lesson.printedHead).toLowerCase())) {
        problems.push(`الدرس ${lesson.key}: صفحة ${lesson.bookFrom} لا تطبع عنوانه «${lesson.printedHead}»`);
      }
    }
  }

  // 3. every lesson's title is printed somewhere in its page range (the
  //    «Conosciamo l'Italia» lessons print their culture titles instead, which
  //    the anchors below check in their place).
  for (const [sectionIndex, section] of sections.entries()) {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(sectionIndex, li);
      if (CULTURE_LESSONS.has(lesson.key)) return;
      let page = "";
      for (let p = from; p <= to; p++) page += `\n${loadBookPage(p)}`;
      if (!normalize(page).toLowerCase().includes(normalize(lesson.title).toLowerCase())) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
    });
  }

  // 3b. the culture titles the «Conosciamo l'Italia» lessons stand on.
  for (const anchor of CULTURE_ANCHORS) {
    const page = loadBookPage(anchor.page);
    if (!normalize(page).toLowerCase().includes(normalize(anchor.title).toLowerCase())) {
      problems.push(`صفحة الكتاب ${anchor.page}: لا تطبع عنوان الثقافة «${anchor.title}»`);
    }
  }

  // 4. every content page is owned by exactly one lesson.
  const owners = new Map<number, string[]>();
  for (const range of allLessonRanges()) {
    for (let p = range.from; p <= range.to; p++) {
      const list = owners.get(p) ?? [];
      list.push(range.key);
      owners.set(p, list);
    }
  }
  for (let book = EGYPT_ITALIAN_G10_T1_BOOK_START; book <= EGYPT_ITALIAN_G10_T1_BOOK_END; book++) {
    const list = owners.get(book) ?? [];
    if (list.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${list.length} دروس (${list.join(", ") || "لا أحد"})`);
    }
  }

  // 5. the pages tile the term [START, END] with no gap.
  const expected = EGYPT_ITALIAN_G10_T1_BOOK_END - EGYPT_ITALIAN_G10_T1_BOOK_START + 1;
  if (printedPages.size !== expected) {
    problems.push(`عدد صفحات المحصود ${printedPages.size} بينما المتوقع ${expected} (${EGYPT_ITALIAN_G10_T1_BOOK_START}–${EGYPT_ITALIAN_G10_T1_BOOK_END})`);
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
