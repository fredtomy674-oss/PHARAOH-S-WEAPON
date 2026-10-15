// Kindergarten 1 (رياض أطفال 1, «Moyenne Section») Discover, French-medium,
// first term («1er Semestre»), Ministry 2025/2026 edition (cover prints
// «MOYENNE SECTION / PARTONS A LA DÉCOUVERTE», revised by the general
// administration for curriculum planning; print matter prints «2025/2026»
// and 88 pages).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-kg1-discovery-fr`, subject `discovery-fr` (name "Discovery (French)",
// nameAr "اكتشف (بالفرنسية)"), lesson prefix `l-kg1-dis-fr-`, grade
// `grade-kg1` (name "KG 1", nameAr "رياض أطفال 1").
//
// The curriculum tree for the Egypt `eg-kg1-discovery-fr` curriculum is rebuilt
// from the French-medium Ministry textbook `Partons à la Découverte`
// (84 scanned pages, Term 1 = the book's own «1er Semestre» as listed in its
// printed «SOMMAIRE», scan 4). This module is the single source of truth for
// its structure: the six printed chapitres of the first term (three under
// Thème 1 «Qui suis-je ?», three under Thème 2 «Le monde autour de moi»)
// plus the Term-1 «Le journal des Mathématiques», the printed activity on
// every page, and, for every lesson, the book's own printed heads, verbatim
// and with the printed page they start on. The self-checks at the bottom
// prove that mapping against the text layer itself, page by page.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every numbered content page prints its own folio as a bare numeral on its
// last line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted
// here: scan 6 prints «2» (book 2), scan 14 prints «10» (book 10), scan 21
// prints «17» (book 17), scan 26 prints «22» (book 22), scan 30 prints «26»
// (book 26) and scan 35 prints «31» (book 31). The Term-2 pages keep the same
// offset after the term (scan 43 prints «39», scan 48 prints «44»). The
// book's own «SOMMAIRE» (scan 4, folio «IV») lists the six chapitres and the
// journal but prints no page numbers, so the divider scans themselves fix the
// starts: 1, 7, 11, 16, 20, 27, journal 32.
//
// TERM = THE BOOK'S OWN FIRST SEMESTER (books 1–35)
// Scan pages 1–4 are before the term: the cover (1), the print matter (2),
// the «INTRODUCTION AU MANUEL» (3) and the year-wide «SOMMAIRE» with the NAME
// slip (4, folio «IV»). The term runs from the Thème-1 / Chapitre-1 divider
// (book 1 = scan 5) to the last page of «Le journal des Mathématiques»
// (book 35 = scan 39): `EGYPT_DISCOVERY_FR_KG1_T1_BOOK_START` / `_END` are
// exactly those two pages, and the tiling assertion proves nothing in
// between is left unreachable. `pagesChecked` therefore equals 35 − 1 + 1 =
// 35. Scan pages 40–84 are after the term: a fully blank page (scan 40, never
// produced — documented below, not listed in `MISSING_SCANS`), the
// «SECOND SEMESTRE» divider (scan 41), the Term-2 lessons (Thèmes 3–4, books
// 39–67), the Term-2 journal (books 1–12 of the journal refoliation) and no
// trailing print matter (scan 84 is the last journal page).
//
// NO TERM SCAN IS ABSENT — `MISSING_SCANS` IS EMPTY
// Every book page of [1, 35] has its scan (scans 5–39) with a real text
// layer, so no term page is skipped and `pagesChecked` is the full term
// range. The absent scan 40 sits outside the term (between the last journal
// page and the «SECOND SEMESTRE» divider) and is a fully blank page proven
// by eye — no text layer is possible, so it is documented here and not
// retried, exactly as the Arabic-KG1 spec documents its absent front-matter
// scan. Kept as an empty list so the module shares the shape of the other
// Egyptian specs.
//
// TEN TERM PAGES PRINT NO PROVABLE FOLIO — EACH HAS A NAMED ANCHOR
// The six chapitre dividers (books 1, 7, 11, 16, 20, 27) print their head but
// no page number; the journal divider (book 32) prints no folio either; and
// the three journal pages print the journal's own refoliation («1», «2» on
// books 33–34) or nothing at all (book 35 ends on body text). Rather than
// weaken the page-number check, all ten are exempt from it and anchored on a
// string the page itself prints, named in `FOLIO_LESS_ANCHORS`. Every other
// term page proves its number from the folio in its furniture (see
// `footerCandidates`). Every term page carries real text: there is no
// textless-picture exemption.
//
// EACH LESSON IS ONE PRINTED ACTIVITY PAGE
// KG books are activity-driven: every activity page prints one head
// («MES CINQ SENS», «PLAN OU IMAGE?», «LA CARTE DE L'ÉGYPTE» …) and that head
// is the lesson. Three pages print two titled heads and both share the
// lesson, as in the EN-KG1 Discover sibling: book 2 («AUTOPORTRAIT» +
// «FRUITS ET LÉGUMES»), book 10 («LES ANIMAUX ET LEURS PETITS» + «À TOI DE
// COMPTER») and book 14 («EMPLOIS ET OUTILS» + «MON TRAVAIL QUAND JE SERAI
// ADULTE»). The chapitre dividers print navigation only (thème + chapitre),
// so — as in the KG2/G1 French specs — they contribute no concepts; the
// divider head is checked as the section's `printedHead`. The journal section
// holds three lessons, one per journal page (books 33–35); their concepts are
// each page's printed «Leçon» heads («Leçon 5»–«Leçon 8»,
// «Leçon 31»–«Leçon 39», «Leçon 40»/«Leçon 41»/«Leçon 42»/«Leçon 57»–
// «Leçon 59»). Nothing is invented: every concept title below is a string the
// book itself prints on the page its `bookFrom` names.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// The born-digital French layer uses straight ASCII apostrophes throughout
// («D'UN», «L'UTILISATION», «L'ÉGYPTE», «DE L'EAU?», «l'ouïe»); `normalize`
// deletes every non-letter/non-digit, so heads are transcribed byte-verbatim
// regardless. Book 6 heads «CE QUE JE PRÉFÉRE» (final E acute, as the layer
// renders it). Count boxes («5 4 3 2 1»), table labels («2 PATTES»,
// «4 PATTES», «Classroom 1/2/3») and the «CHAPITRE 2» running heads join the
// folio candidates harmlessly: the page's own number proves the mapping when
// present (see `footerCandidates`).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.31 = scan p.35). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the Thème-1 / Chapitre-1 divider (scan 5). */
export const EGYPT_DISCOVERY_FR_KG1_T1_BOOK_START = 1;

/** Last printed page of the term — journal page «Leçon 59» (scan 39). */
export const EGYPT_DISCOVERY_FR_KG1_T1_BOOK_END = 35;

/** The scanned pages before the term: cover, print matter, introduction, sommaire. */
export const EGYPT_DISCOVERY_FR_KG1_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/**
 * The scanned pages after the term: a fully blank page (scan 40, never
 * produced), the «SECOND SEMESTRE» divider (41), the Term-2 lessons (books
 * 39–67) and the Term-2 journal (scans 73–84).
 */
export const EGYPT_DISCOVERY_FR_KG1_T1_BACK_MATTER = { from: 40, to: 84 } as const;

/**
 * The term pages the OCR never produced, in book pages. Every one of the 35
 * term scans carries a text layer, so the list is empty; kept so the loader,
 * the checks and the seeders share one shape across the books.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface DiscoveryFrKg1T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «activité». */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one activity page, or one journal page). */
export interface DiscoveryFrKg1T1Lesson {
  /** App-addressable key, e.g. "5-3" (chapter 5, lesson 3). */
  key: string;
  /** Arabic ordinal of the lesson number, e.g. "الثالث". */
  ordinal: string;
  /** The lesson's opening head type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson. */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: DiscoveryFrKg1T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — a chapitre, or the maths journal. */
export interface DiscoveryFrKg1T1Section {
  /** This book's sections are its chapitres, plus the closing journal. */
  kind: "chapter" | "journal";
  /** Internal key: "1"…"7", in book order. */
  key: string;
  /** Arabic ordinal of the section as used in the app tree, e.g. "الثاني". */
  ordinal: string;
  /** Full app-facing section title, with the thème for context. */
  title: string;
  /** The section head the divider page prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its divider). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next divider). */
  bookTo: number;
  lessons: DiscoveryFrKg1T1Lesson[];
}

const TYPE = "activité";

function concept(bookFrom: number, title: string): DiscoveryFrKg1T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The six chapitres of the first term plus its closing «Le journal des
 * Mathématiques», with their printed activities and every printed head,
 * transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter starts come from the divider scans themselves (the «SOMMAIRE»,
 * scan 4, prints no page numbers): 1, 7, 11, 16, 20, 27, journal 32. Each
 * activity page is one lesson, in book order.
 */
export const EGYPT_DISCOVERY_FR_KG1_T1_UNITS: DiscoveryFrKg1T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "Thème 1 : Qui suis-je ? — Chapitre 1 : Autoportrait géométrique",
    printedHead: "AUTOPORTRAIT GÉOMÉTRIQUE",
    bookFrom: 1,
    bookTo: 6,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "AUTOPORTRAIT",
        printedHead: "AUTOPORTRAIT",
        bookFrom: 2,
        concepts: [concept(2, "AUTOPORTRAIT"), concept(2, "FRUITS ET LÉGUMES")],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "MES CINQ SENS",
        printedHead: "MES CINQ SENS",
        bookFrom: 3,
        concepts: [concept(3, "MES CINQ SENS")],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "NOUS SOMMES SEMBLABLES",
        printedHead: "NOUS SOMMES SEMBLABLES",
        bookFrom: 4,
        concepts: [concept(4, "NOUS SOMMES SEMBLABLES")],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "JE RECONNAIS DES FORMES GÉOMÉTRIQUES",
        printedHead: "JE RECONNAIS DES FORMES GÉOMÉTRIQUES",
        bookFrom: 5,
        concepts: [concept(5, "JE RECONNAIS DES FORMES GÉOMÉTRIQUES")],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "CE QUE JE PRÉFÉRE",
        printedHead: "CE QUE JE PRÉFÉRE",
        bookFrom: 6,
        concepts: [concept(6, "CE QUE JE PRÉFÉRE")],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "الثاني",
    title: "Thème 1 : Qui suis-je ? — Chapitre 2 : Les mamans et les papas",
    printedHead: "LES MAMANS ET LES PAPAS",
    bookFrom: 7,
    bookTo: 10,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "ENFANTS ET ADULTES",
        printedHead: "ENFANTS ET ADULTES",
        bookFrom: 8,
        concepts: [concept(8, "ENFANTS ET ADULTES")],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "LES TÂCHES DE LA VIE QUOTIDIENNE",
        printedHead: "LES TÂCHES DE LA VIE QUOTIDIENNE",
        bookFrom: 9,
        concepts: [concept(9, "LES TÂCHES DE LA VIE QUOTIDIENNE")],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "LES ANIMAUX ET LEURS PETITS",
        printedHead: "LES ANIMAUX ET LEURS PETITS",
        bookFrom: 10,
        concepts: [concept(10, "LES ANIMAUX ET LEURS PETITS"), concept(10, "À TOI DE COMPTER")],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "الثالث",
    title: "Thème 1 : Qui suis-je ? — Chapitre 3 : Mon école",
    printedHead: "MON ÉCOLE",
    bookFrom: 11,
    bookTo: 15,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "REGROUPE LES FORMES",
        printedHead: "REGROUPE LES FORMES",
        bookFrom: 12,
        concepts: [concept(12, "REGROUPE LES FORMES")],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "LES FORMES GÉOMÉTRIQUES DANS MA CLASSE ET HORS DE MA CLASSE",
        printedHead: "LES FORMES GÉOMÉTRIQUES DANS MA CLASSE ET HORS DE MA CLASSE",
        bookFrom: 13,
        concepts: [concept(13, "LES FORMES GÉOMÉTRIQUES DANS MA CLASSE ET HORS DE MA CLASSE")],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "EMPLOIS ET OUTILS",
        printedHead: "EMPLOIS ET OUTILS",
        bookFrom: 14,
        concepts: [concept(14, "EMPLOIS ET OUTILS"), concept(14, "MON TRAVAIL QUAND JE SERAI ADULTE")],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "DÉCOUVRIR LA TEXTURE D'UN OBJET",
        printedHead: "DÉCOUVRIR LA TEXTURE D'UN OBJET",
        bookFrom: 15,
        concepts: [concept(15, "DÉCOUVRIR LA TEXTURE D'UN OBJET")],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "الأول",
    title: "Thème 2 : Le monde autour de moi — Chapitre 1 : Les petits des êtres vivants",
    printedHead: "LES PETITS DES ÊTRES VIVANTS",
    bookFrom: 16,
    bookTo: 19,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "MES HABITUDES DE LA JOURNÉE",
        printedHead: "MES HABITUDES DE LA JOURNÉE",
        bookFrom: 17,
        concepts: [concept(17, "MES HABITUDES DE LA JOURNÉE")],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "OBSERVE LES ANIMAUX",
        printedHead: "OBSERVE LES ANIMAUX",
        bookFrom: 18,
        concepts: [concept(18, "OBSERVE LES ANIMAUX")],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "LES ANIMAUX À TRAVERS LE MONDE",
        printedHead: "LES ANIMAUX À TRAVERS LE MONDE",
        bookFrom: 19,
        concepts: [concept(19, "LES ANIMAUX À TRAVERS LE MONDE")],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "الثاني",
    title: "Thème 2 : Le monde autour de moi — Chapitre 2 : Comment prendre soin ?",
    printedHead: "COMMENT PRENDRE SOIN?",
    bookFrom: 20,
    bookTo: 26,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: TYPE,
        title: "VIVANT OU NON-VIVANT?",
        printedHead: "VIVANT OU NON-VIVANT?",
        bookFrom: 21,
        concepts: [concept(21, "VIVANT OU NON-VIVANT?")],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "PLAN OU IMAGE?",
        printedHead: "PLAN OU IMAGE?",
        bookFrom: 22,
        concepts: [concept(22, "PLAN OU IMAGE?")],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "LES QUATRE SAISONS ET LES VÊTEMENTS CONVENABLES",
        printedHead: "LES QUATRE SAISONS ET LES VÊTEMENTS CONVENABLES",
        bookFrom: 23,
        concepts: [concept(23, "LES QUATRE SAISONS ET LES VÊTEMENTS CONVENABLES")],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "LES ÉTAPES DE LA VIE",
        printedHead: "LES ÉTAPES DE LA VIE",
        bookFrom: 24,
        concepts: [concept(24, "LES ÉTAPES DE LA VIE")],
      },
      {
        key: "5-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "LA PROPRETÉ",
        printedHead: "LA PROPRETÉ",
        bookFrom: 25,
        concepts: [concept(25, "LA PROPRETÉ")],
      },
      {
        key: "5-6",
        ordinal: "السادس",
        type: TYPE,
        title: "MA SALADE",
        printedHead: "MA SALADE",
        bookFrom: 26,
        concepts: [concept(26, "MA SALADE")],
      },
    ],
  },
  {
    key: "6",
    kind: "chapter",
    ordinal: "الثالث",
    title: "Thème 2 : Le monde autour de moi — Chapitre 3 : Où trouvons-nous de l'eau ?",
    printedHead: "OÙ TROUVONS-NOUS DE L'EAU?",
    bookFrom: 27,
    bookTo: 31,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: TYPE,
        title: "LA PLUIE, LA PLUIE QUI TOMBE",
        printedHead: "LA PLUIE, LA PLUIE QUI TOMBE",
        bookFrom: 28,
        concepts: [concept(28, "LA PLUIE, LA PLUIE QUI TOMBE")],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "L'UTILISATION DE L'EAU",
        printedHead: "L'UTILISATION DE L'EAU",
        bookFrom: 29,
        concepts: [concept(29, "L'UTILISATION DE L'EAU")],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "LA CARTE DE L'ÉGYPTE",
        printedHead: "LA CARTE DE L'ÉGYPTE",
        bookFrom: 30,
        concepts: [concept(30, "LA CARTE DE L'ÉGYPTE")],
      },
      {
        key: "6-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "DES BOUTEILLES DANS LE FLEUVE",
        printedHead: "DES BOUTEILLES DANS LE FLEUVE",
        bookFrom: 31,
        concepts: [concept(31, "DES BOUTEILLES DANS LE FLEUVE")],
      },
    ],
  },
  {
    key: "7",
    kind: "journal",
    ordinal: "السابع",
    title: "Le Journal des Mathématiques",
    printedHead: "LE JOURNAL DES MATHÉMATIQUES",
    bookFrom: 32,
    bookTo: 35,
    lessons: [
      {
        key: "7-1",
        ordinal: "الأول",
        type: TYPE,
        title: "Leçon 5",
        printedHead: "Leçon 5",
        bookFrom: 33,
        concepts: [
          concept(33, "Leçon 5"),
          concept(33, "Leçon 6"),
          concept(33, "Leçon 7"),
          concept(33, "Leçon 8"),
        ],
      },
      {
        key: "7-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "Leçon 31",
        printedHead: "Leçon 31",
        bookFrom: 34,
        concepts: [
          concept(34, "Leçon 31"),
          concept(34, "Leçon 32"),
          concept(34, "Leçon 33"),
          concept(34, "Leçon 34"),
          concept(34, "Leçon 35"),
          concept(34, "Leçon 36"),
          concept(34, "Leçon 37"),
          concept(34, "Leçon 38"),
          concept(34, "Leçon 39"),
        ],
      },
      {
        key: "7-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "Leçon 40",
        printedHead: "Leçon 40",
        bookFrom: 35,
        concepts: [
          concept(35, "Leçon 40"),
          concept(35, "Leçon 41"),
          concept(35, "Leçon 42"),
          concept(35, "Leçon 57"),
          concept(35, "Leçon 58"),
          concept(35, "Leçon 59"),
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
 * lesson — the divider opener) or its own start page, up to the page before
 * the next lesson starts, or the section's last page for its last lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_DISCOVERY_FR_KG1_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_DISCOVERY_FR_KG1_T1_UNITS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. The scans show
 * no appendix, so this is empty; kept as a function so the seeder and the stage
 * share one shape across all the books.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const section of EGYPT_DISCOVERY_FR_KG1_T1_UNITS) {
    for (const lesson of section.lessons) {
      if (lesson.extraBookPages?.length) out.set(lesson.key, [...lesson.extraBookPages]);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Text-layer loading
// ---------------------------------------------------------------------------

const OCR_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "curriculum-ocr",
  "discovery-fr-kg1-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (No term page of this book needs it — every term scan carries a
 * text layer — but the guard keeps the loader the same shape across books.)
 */
const NO_TEXT = /لا يوجد نص/;

/** Text-layer text of one printed book page, or "" when the page was not extracted. */
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

/** Loads and joins the text of a book-page range, page by page. */
export function loadBookRange(fromBook: number, toBook: number): string {
  const parts: string[] = [];
  for (let book = fromBook; book <= toBook; book++) {
    const text = loadBookPage(book);
    if (text) parts.push(pageBlock(book, text));
  }
  return parts.join("\n\n");
}

/**
 * The document a lesson grounds the tutor in: its own page range in order, plus
 * any appendix pages it points to. This book has no appendix, so the extra loop
 * is a no-op kept for a shared shape.
 */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(sectionIndex, lessonIndex);
  const lesson = EGYPT_DISCOVERY_FR_KG1_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(from, to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/** Folds text for comparison: lowercases and removes letters' spacing/punctuation. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring OCR spacing and punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints. This book's folio always rides
 * in the page furniture at the foot («2», «10», «22»), but body matter can
 * print bare numerals too (count boxes «5 4 3 2 1» on book 8, table labels
 * «2 PATTES / 4 PATTES» on book 18, «Classroom 1/2/3» on book 22) and the
 * running «CHAPITRE 2» head can join the top lines, so the top and bottom
 * furniture lines each contribute both their space-stripped whole and every
 * whitespace-separated digit token. Leçon numerals and exercise numerals join
 * the candidate set harmlessly: the page's own number proves the mapping when
 * present.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const region = [...lines.slice(0, 4), ...lines.slice(-4)];
  const numbers = new Set<number>();
  for (const line of region) {
    const joined = line.replace(/ /g, "");
    if (/^\d{1,3}$/.test(joined)) numbers.add(Number(joined));
    for (const token of line.split(/\s+/)) {
      if (/^\d{1,3}$/.test(token)) numbers.add(Number(token));
    }
  }
  return [...numbers].sort((a, b) => a - b);
}

/**
 * The book number a content page prints, or null when it prints none. Returns
 * the page's own number when it is among the candidates, otherwise the largest
 * candidate (so a wrong page still reports a number and the caller can see the
 * mismatch). The six chapitre dividers (1, 7, 11, 16, 20, 27), the journal
 * divider (32) and the three journal pages (33–35, which print the journal's
 * own refoliation or nothing) never prove their book number and are exempted
 * via `FOLIO_LESS_ANCHORS`.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * Folios whose OCR printed a different, still parseable number. Every folio in
 * this born-digital book came out right, so the map is empty and the folio
 * check stays exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no provable folio in the checked furniture, each
 * with the anchor the check accepts in place of a page number: the six
 * chapitre dividers plus the journal divider, each anchored on the head its
 * own page prints, and the three journal pages, each anchored on its opening
 * «Leçon».
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  1: "AUTOPORTRAIT GÉOMÉTRIQUE",
  7: "LES MAMANS ET LES PAPAS",
  11: "MON ÉCOLE",
  16: "LES PETITS DES ÊTRES VIVANTS",
  20: "COMMENT PRENDRE SOIN?",
  27: "OÙ TROUVONS-NOUS DE L'EAU?",
  32: "LE JOURNAL DES MATHÉMATIQUES",
  33: "Leçon 5",
  34: "Leçon 31",
  35: "Leçon 40",
};

/** Every head kind the table may use. */
const KNOWN_KINDS = new Set(["activité"]);

/**
 * Table invariants: lesson keys are unique and follow (section-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_DISCOVERY_FR_KG1_T1_UNITS;

  sections.forEach((section, si) => {
    if (!section.title.trim()) problems.push(`القسم ${section.key}: بلا عنوان`);
    if (!section.printedHead.trim()) problems.push(`القسم ${section.key}: بلا عنوان مطبوع`);
    if (section.lessons.length === 0) problems.push(`القسم ${section.title}: بلا دروس`);

    section.lessons.forEach((lesson, li) => {
      const expectedKey = `${section.key}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`القسم ${section.key} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (!lesson.title.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان`);
      if (!lesson.printedHead.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان مطبوع`);
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا مكوّنات`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول مكوّن`);
      }

      const minStart = li === 0 ? section.bookFrom : section.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > section.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${section.bookFrom}–${section.bookTo}`);
      }

      lesson.concepts.forEach((c, ci) => {
        if (!c.title.trim()) problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: بلا عنوان`);
        if (!KNOWN_KINDS.has(c.kind)) {
          problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: نوع غير معروف «${c.kind}»`);
        }
        if (c.bookFrom < section.bookFrom || c.bookFrom > section.bookTo) {
          problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: صفحته ${c.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && c.bookFrom < prev.bookFrom) {
          problems.push(`الدرس ${lesson.key}: صفحات المكوّنات تنازلية (${prev.bookFrom} ثم ${c.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(si, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < section.bookFrom || to > section.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${section.bookFrom}–${section.bookTo}`);
      }
      const last = lesson.concepts.at(-1)!;
      if (last.bookFrom < from || last.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: مكوّنه الأخير ${last.bookFrom} خارج نطاقه ${from}–${to}`);
      }
      const next = section.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== section.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر القسم ${section.bookFrom}، وجدنا ${from}`);
      }
    });

    const nextSection = sections[si + 1];
    if (nextSection && section.bookTo >= nextSection.bookFrom) {
      problems.push(`القسم ${section.title} يتداخل مع ${nextSection.title}`);
    } else if (nextSection && section.bookTo !== nextSection.bookFrom - 1) {
      problems.push(`فجوة صفحات بين ${section.title} و${nextSection.title}: ${section.bookTo + 1}–${nextSection.bookFrom - 1}`);
    }
  });

  const first = sections[0];
  const last = sections[sections.length - 1];
  if (first && first.bookFrom !== EGYPT_DISCOVERY_FR_KG1_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_DISCOVERY_FR_KG1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_DISCOVERY_FR_KG1_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_DISCOVERY_FR_KG1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     the folio in its furniture, or, on the ten pages named in
 *     `FOLIO_LESS_ANCHORS`, from the anchor the page itself prints. The scans
 *     in `MISSING_SCANS` (none this term) carry no text to prove anything with
 *     and are not iterated (they stay owned by their lesson ranges below);
 *  2. every section opener prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title (or its printed head) and every activity's head is
 *     printed on the pages the lesson owns (the activity on its own page);
 *  4. every page in [1, 35] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR'd
 *     page of the term, i.e. `_BOOK_END - _BOOK_START + 1` minus
 *     `MISSING_SCANS`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const sections = EGYPT_DISCOVERY_FR_KG1_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_DISCOVERY_FR_KG1_T1_BOOK_START || book > EGYPT_DISCOVERY_FR_KG1_T1_BOOK_END) continue;
    if (MISSING_SCANS.includes(book)) continue;
    const text = loadBookPage(book);
    pagesChecked += 1;
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    printedPages.add(book);

    const anchor = FOLIO_LESS_ANCHORS[book];
    if (anchor !== undefined) {
      if (!normalize(text).includes(normalize(anchor))) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع ولا تطبع المرساة «${anchor}»`);
      }
    } else {
      const footer = printedFooter(book);
      if (footer === null) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع`);
      } else if (footer !== book && FOOTER_OCR_MISREADS[book] !== footer) {
        problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق صفحته`);
      }
    }
  }

  // 2 + 3a. every section opener prints the section head, every lesson's first
  // page its head, and every lesson's title (or printed head) is printed
  // somewhere in the pages it owns.
  sections.forEach((section, si) => {
    if (loadBookPage(section.bookFrom) && !pagePrints(section.bookFrom, section.printedHead)) {
      problems.push(`القسم ${section.title}: صفحة صدوره ${section.bookFrom} لا تطبع «${section.printedHead}»`);
    }

    section.lessons.forEach((lesson, li) => {
      if (loadBookPage(lesson.bookFrom) && !pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع «${lesson.printedHead}»`);
      }
      const { from, to } = lessonBookRange(si, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.printedHead);
      if (!titlePrinted) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
    });
  });

  // 3b. every activity's printed head is on its own page.
  sections.forEach((section) => {
    section.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (loadBookPage(c.bookFrom) && !pagePrints(c.bookFrom, c.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة المكوّن ${c.bookFrom} لا تطبع «${c.title}»`);
        }
      });
    });
  });

  // 4. every printed content page is owned by exactly one lesson.
  const owner = new Map<number, string>();
  for (const { key, from, to } of allLessonRanges()) {
    for (let p = from; p <= to; p++) {
      const prev = owner.get(p);
      if (prev) problems.push(`الصفحة ${p} يملكها درسان: ${prev} و${key}`);
      owner.set(p, key);
    }
  }
  for (let p = EGYPT_DISCOVERY_FR_KG1_T1_BOOK_START; p <= EGYPT_DISCOVERY_FR_KG1_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_DISCOVERY_FR_KG1_T1_BOOK_END - EGYPT_DISCOVERY_FR_KG1_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_DISCOVERY_FR_KG1_T1_BOOK_START} و${EGYPT_DISCOVERY_FR_KG1_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
