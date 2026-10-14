// Egypt Secondary-1 (Grade 10) French story, first term — «Deux ans de
// vacances» de Jules Verne, adapté en français facile par Brigitte
// Faucard-Martinez (Lectures CLE en français facile, CLE International –
// DENH, Première année secondaire, Première Langue).
//
// The first term IS the story book: its seven printed «CHAPITRE»s, its
// «ÉPILOGUE» and the two printed study sections that close the volume, the
// «VOCABULAIRE» (book pages 59–60) and the «QUESTIONS POUR COMPRENDRE»
// (book pages 61–64). This file is the book's table — one section for the
// novel, one lesson per printed chapter or study section — plus a set of
// helpers so the seeder and the stage share the same page map. The
// self-checks at the bottom prove the mapping against the OCR itself, page by
// page.
//
// THE OFFSET IS ONE — book page = scan page − 1
// Every content page that carries a folio prints its own number (scan 006
// prints «- 5 -», scan 009 «- 8 -», scan 018 «— 17 —», scan 034 «- 33 -»,
// scan 058 «- 57 -», scan 062 «— 61 —»), so the printed book page N is scan
// page N + 1 and `BOOK_TO_PDF_OFFSET = 1`. The imprint confirms it from both
// ends: the portrait credit on the last scan page names «J. Verne (p. 3)» for
// the biography on scan 4, and the back cover counts «Pages 64» for a book
// whose last numbered page is scan 65.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–5 are the cover (scan 1), the title page (scan 2, book page
// 1), the ISBN/imprint (scan 3, book page 2), the Jules Verne biography
// (scan 4, book page 3) and the presentation with the vocabulary note (scan
// 5, book page 4 with folio «- 4 -»). Scan page 66 is the back cover
// (publisher blurb, reading levels, barcode). The term runs from the
// «CHAPITRE I» opener (book page 5) to the last «QUESTIONS POUR
// COMPRENDRE» page (book page 64):
// `EGYPT_FRENCH_STORY_G10_T1_BOOK_START` / `_END` are exactly those pages.
//
// THE BOOK HAS NO BLANK LEAVES AND NO RUNNING HEAD
// Every one of the 60 term pages carries real text — the ten full-page
// illustrations (book pages 9, 13, 17, 19, 21, 33, 39, 43, 49 and 58) print
// their caption and their folio like any other page. The pages carry no
// running head, only the folio, so `assertTreeMatchesTheBook` pins each
// content page to the book by its own printed folio instead.
//
// FOLIOS WEAR DASH ORNAMENTS
// The folio is a 1–2 digit number standing alone on the page's last line,
// wrapped in dashes: «- 5 -», «– 22 –» (en dash) or «— 17 —» (em dash).
// Footnote lines («1. Munitions : …») always carry letters and the carved
// date «1807» on book page 24 is four digits, so a line holding nothing but
// a short number and non-letter ornaments can only be the folio.
//
// BOOK PAGE 64 LOST ITS FOLIO IN THE OCR
// The last term page (scan 65) ends with the credits block («N° de projet :
// 10038349…») and the OCR captured no folio line for it. Rather than weaken
// the page-number check, page 64 alone is exempt from it and anchored on the
// «Chapitre VII» questions head it prints. See `FOLIO_LESS_PAGES`.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// The story chapters print no objectives and no sub-heads: each chapter
// lesson carries its printed head («CHAPITRE I», …, «ÉPILOGUE»). The
// «VOCABULAIRE» lesson carries its printed heads — «VOCABULAIRE», the field
// head «La mer et la navigation» and its thirty-one headwords — and the
// «QUESTIONS POUR COMPRENDRE» lesson carries its eight printed group heads
// («Chapitre I» … «Chapitre VII», «Épilogue»), always as the pages spell
// them.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** One lesson of the book — becomes one lesson in the app tree. */
export interface FrenchStoryG10T1Lesson {
  /** App-addressable key, e.g. "1-3" (the novel's third lesson, CHAPITRE III). */
  key: string;
  /** Full app-facing lesson title — the heading its own page prints. */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`): «CHAPITRE I» … «CHAPITRE VII» on the chapter
   * openers, «ÉPILOGUE», «VOCABULAIRE» and «QUESTIONS POUR COMPRENDRE» on the
   * closing sections.
   */
  printedHead: string;
  /** First printed book page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, verbatim. */
  concepts: string[];
}

/** One printed section of the book — here, the novel itself. */
export interface FrenchStoryG10T1Section {
  /** Internal key: "1". */
  key: string;
  kind: "unit";
  /** Section title as printed on the cover and title page. */
  title: string;
  /**
   * The section's title as the cover spells it. The story pages never repeat
   * it (the book prints no running head), so it is recorded here but never
   * checked against a page.
   */
  footerTitle: string;
  /** First printed page of the section (the «CHAPITRE I» opener). */
  bookFrom: number;
  /** Last printed page of the section (the last «QUESTIONS» page). */
  bookTo: number;
  lessons: FrenchStoryG10T1Lesson[];
}

// ---------------------------------------------------------------------------
// THE OFFSET AND THE TERM'S BOUNDS
// ---------------------------------------------------------------------------

/** Scan page = book page + 1 (every content page prints its own number). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the term — the «CHAPITRE I» opener. */
export const EGYPT_FRENCH_STORY_G10_T1_BOOK_START = 5;

/** Last printed page of the term — the last «QUESTIONS POUR COMPRENDRE» page. */
export const EGYPT_FRENCH_STORY_G10_T1_BOOK_END = 64;

// ---------------------------------------------------------------------------
// THE NOVEL AND ITS STUDY SECTIONS
// ---------------------------------------------------------------------------

/**
 * The novel «Deux ans de vacances» and its two printed study sections, in
 * order. The ten lessons tile the whole term with no gap: the seven
 * chapitres, the épilogue, the vocabulaire and the questions. Every lesson
 * starts on the page that prints its head.
 */
export const EGYPT_FRENCH_STORY_G10_T1_SECTIONS: FrenchStoryG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    title: "Deux ans de vacances",
    footerTitle: "Deux ans de vacances",
    bookFrom: 5,
    bookTo: 64,
    lessons: [
      {
        key: "1-1",
        title: "CHAPITRE I",
        printedHead: "CHAPITRE I",
        bookFrom: 5,
        concepts: ["CHAPITRE I"],
      },
      {
        key: "1-2",
        title: "CHAPITRE II",
        printedHead: "CHAPITRE II",
        bookFrom: 11,
        concepts: ["CHAPITRE II"],
      },
      {
        key: "1-3",
        title: "CHAPITRE III",
        printedHead: "CHAPITRE III",
        bookFrom: 15,
        concepts: ["CHAPITRE III"],
      },
      {
        key: "1-4",
        title: "CHAPITRE IV",
        printedHead: "CHAPITRE IV",
        bookFrom: 27,
        concepts: ["CHAPITRE IV"],
      },
      {
        key: "1-5",
        title: "CHAPITRE V",
        printedHead: "CHAPITRE V",
        bookFrom: 31,
        concepts: ["CHAPITRE V"],
      },
      {
        key: "1-6",
        title: "CHAPITRE VI",
        printedHead: "CHAPITRE VI",
        bookFrom: 37,
        concepts: ["CHAPITRE VI"],
      },
      {
        key: "1-7",
        title: "CHAPITRE VII",
        printedHead: "CHAPITRE VII",
        bookFrom: 45,
        concepts: ["CHAPITRE VII"],
      },
      {
        key: "1-8",
        title: "ÉPILOGUE",
        printedHead: "ÉPILOGUE",
        bookFrom: 57,
        concepts: ["ÉPILOGUE"],
      },
      {
        key: "1-9",
        title: "VOCABULAIRE",
        printedHead: "VOCABULAIRE",
        bookFrom: 59,
        concepts: [
          "VOCABULAIRE",
          "La mer et la navigation",
          "Amarre",
          "Archipel",
          "Bâbord",
          "Barre",
          "Capitaine",
          "Capot",
          "Chaloupe",
          "Chavirer",
          "Côte",
          "Débarquer",
          "Dérive (bateau en dérive)",
          "Échouage",
          "Échouer",
          "Embardée",
          "Embarquer",
          "Falaise",
          "Golfe",
          "Gouvernail",
          "Lame",
          "Lever l'ancre",
          "Marin",
          "Mousse",
          "Naufragé",
          "Pont (d'un bateau)",
          "Quai",
          "Radeau",
          "Récif",
          "Tribord",
          "Voile",
          "Yacht",
          "Yole",
        ],
      },
      {
        key: "1-10",
        title: "QUESTIONS POUR COMPRENDRE",
        printedHead: "QUESTIONS POUR COMPRENDRE",
        bookFrom: 61,
        concepts: [
          "Chapitre I",
          "Chapitre II",
          "Chapitre III",
          "Chapitre IV",
          "Chapitre V",
          "Chapitre VI",
          "Chapitre VII",
          "Épilogue",
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
 * lesson — the «CHAPITRE I» opener) or its own start page, up to the page before the
 * next lesson starts, or the section's last page for its last lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_FRENCH_STORY_G10_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const ranges: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_FRENCH_STORY_G10_T1_SECTIONS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      ranges.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return ranges;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. The story
 * volume has no appendix bound into the term: every page of the term belongs
 * to the novel's single section (the cover and the back cover are not part of
 * this file). Kept as a function so the seeder and the stage share one shape
 * across all the books.
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
  "french-story-g10-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. No term page
 * is blank, but the loader normalises such an answer to "" so the page map
 * can never mistake a blank for content.
 */
const NO_TEXT = /لا يوجد نص/;

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    const text = readFileSync(file, "utf8").trim();
    return NO_TEXT.test(text) ? "" : text;
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
 * Page-number candidates a content page prints. The book carries no running
 * head, only the folio on the page's last line, wrapped in dashes («- 5 -»,
 * «– 22 –», «— 17 —»). A line holding nothing but a short number and
 * non-letter ornaments is therefore the folio: footnote lines always carry
 * letters («1. Munitions : …») and never match, and the carved date «1807»
 * on book page 24 is four digits and never matches either.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const candidates = new Set<number>();
  for (const line of lines) {
    const alone = line.match(/^[^\p{L}\p{N}]*(\d{1,3})[^\p{L}\p{N}]*$/u);
    if (alone) candidates.add(Number(alone[1]));
  }
  return [...candidates].sort((a, b) => a - b);
}

/**
 * The book number a content page prints, or null. Every content page but one
 * prints its own number, so a page that carries it returns itself; a mismatch
 * returns the largest candidate so the caller can see the difference.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * The one term page whose printed folio the OCR did not capture: book page 64
 * (scan 65) ends with the credits block and carries no folio line in the OCR.
 * It is the only term page without a folio. Rather than weaken the
 * page-number check, it is exempt from it and anchored on the «Chapitre VII»
 * questions head it prints.
 */
const FOLIO_LESS_PAGES: ReadonlySet<number> = new Set([64]);

/** The printed head the folio-less page must carry to prove it belongs. */
const FOLIO_LESS_ANCHOR = "Chapitre VII";

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its section, sections tile the book with no gap or overlap, and the first
 * section starts where the term starts. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_FRENCH_STORY_G10_T1_SECTIONS;

  sections.forEach((section, si) => {
    if (section.lessons.length === 0) problems.push(`القسم ${section.key}: بلا دروس`);
    if (!section.title.trim()) problems.push(`القسم ${section.key}: بلا عنوان`);
    if (!section.footerTitle.trim()) problems.push(`القسم ${section.key}: بلا ترويسة`);
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
  if (first.bookFrom !== EGYPT_FRENCH_STORY_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من ${EGYPT_FRENCH_STORY_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last.bookTo !== EGYPT_FRENCH_STORY_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند ${EGYPT_FRENCH_STORY_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from
 *     its printed folio, or, on the single OCR-missed page 64, from the
 *     «Chapitre VII» head it prints;
 *  2. every lesson's own first page prints that lesson's head;
 *  3. every lesson's title is printed somewhere in its page range;
 *  4. every content page is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the 60 content pages tile the term [START, END] with nothing missing.
 *     `pagesChecked` counts exactly those 60 pages.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const sections = EGYPT_FRENCH_STORY_G10_T1_SECTIONS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const contentPages = new Set<number>();

  // 1. every term page: real text and its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_FRENCH_STORY_G10_T1_BOOK_START || book > EGYPT_FRENCH_STORY_G10_T1_BOOK_END) continue;

    const text = loadBookPage(book);
    contentPages.add(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }

    if (FOLIO_LESS_PAGES.has(book)) {
      // The folio was lost in the OCR: anchor the page on the questions head
      // it prints instead of weakening the page-number check for every page.
      if (!normalize(text).toLowerCase().includes(normalize(FOLIO_LESS_ANCHOR).toLowerCase())) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع ولا تطبع «${FOLIO_LESS_ANCHOR}»`);
      }
      continue;
    }

    const footer = printedFooter(book);
    if (footer === null) {
      problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع`);
    } else if (footer !== book) {
      problems.push(`صفحة الكتاب ${book}: رقمها المطبوع لا يطابقها (وجدنا ${footer})`);
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

  // 3. every lesson's title is printed somewhere in its page range.
  for (const [sectionIndex, section] of sections.entries()) {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(sectionIndex, li);
      let page = "";
      for (let p = from; p <= to; p++) page += `\n${loadBookPage(p)}`;
      if (!normalize(page).toLowerCase().includes(normalize(lesson.title).toLowerCase())) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
    });
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
  for (let book = EGYPT_FRENCH_STORY_G10_T1_BOOK_START; book <= EGYPT_FRENCH_STORY_G10_T1_BOOK_END; book++) {
    const list = owners.get(book) ?? [];
    if (list.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: ${list.length === 0 ? "لا يملكها أي درس" : `يملكها أكثر من درس (${list.join("، ")})`}`);
    }
  }

  // 5. the content tiles the term exactly. pagesChecked counts every term page.
  const termLength = EGYPT_FRENCH_STORY_G10_T1_BOOK_END - EGYPT_FRENCH_STORY_G10_T1_BOOK_START + 1;
  const pagesChecked = termLength;
  if (contentPages.size !== pagesChecked) {
    problems.push(`عدد صفحات المحتوى ${contentPages.size} بينما المتوقع ${pagesChecked}`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
