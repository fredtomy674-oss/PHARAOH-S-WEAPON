// Grade 2 (الصف الثاني الابتدائي) Discover, French-medium, first term
// («1er semestre»), Ministry 2025/2026 edition (cover prints «PARTONS À LA
// DÉCOUVERTE / GRANDE SECTION / 2025/2026» — the G2 French Discovery book).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g2-discovery-fr`, subject `discovery-fr` (name "Discovery (French)",
// nameAr "اكتشف (بالفرنسية)"), lesson prefix `l-g2-dis-fr-`, grade
// `grade-2` (name "Grade 2", nameAr "الصف الثاني الابتدائي").
//
// The curriculum tree for the Egypt `eg-g2-discovery-fr` curriculum is rebuilt
// from the French-medium Ministry textbook `Partons à la Découverte`
// (79 scanned pages, Term 1 = the book's own «1er Semestre» as listed in its
// printed «SOMMAIRE», scan 4). This module is the single source of truth for
// its structure: the five printed chapitres of the first term (three under
// Thème 1 «Qui suis-je ?», two under Thème 2 «Le monde autour de moi»), the
// «Le Journal des Mathématiques» section that closes the semester, and, for
// every lesson, the book's own printed activity heads, verbatim and with the
// printed page they start on. The self-checks at the bottom prove that mapping
// against the text layer itself, page by page.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every numbered content page prints its own folio as a bare numeral on its
// last line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted
// here: scan 6 prints «2» (book 2), scan 9 prints «5» (book 5), scan 16 prints
// «12» (book 12), scan 23 prints «19» (book 19), scan 31 prints «27»
// (book 27) and scan 37 prints «33» (book 33). The book's own «SOMMAIRE»
// (scan 4) independently confirms it: it lists «Chapitre 1 : Tout sur moi 1»
// (scan 5), «Chapitre 2 : La présentation de ma classe 5» (scan 9),
// «Chapitre 3 : Deux pieds, Quatre pattes 11» (scan 15), «Chapitre 1 : Le
// monde de la nature 18» (scan 22), «Chapitre 2 : Le monde créé par l'homme
// 26» (scan 30) and «Le Journal des Mathématiques 34» (scan 38) — every
// divider sits exactly where the contents says it does. Past the term the
// offset shifts by one (scan 45 prints «40», scan 51 prints «46»): the blank
// verso scan 43 carries no folio, so Term-2 pages follow book = scan − 5;
// that shift lives wholly inside the back matter and never touches the term.
//
// TERM = THE BOOK'S OWN FIRST SEMESTER (books 1–37)
// Scan pages 1–4 are before the term: the cover (1), the «INTRODUCTION AU
// MANUEL» (2) and the year-wide «SOMMAIRE» with the NAME slip (4); scan 3 is
// a fully blank page (no text layer possible). The term runs from the
// Thème-1 / Chapitre-1 divider (book 1 = scan 5) to the last page of «Le
// Journal des Mathématiques» (book 37 = scan 41):
// `EGYPT_DISCOVERY_FR_G2_T1_BOOK_START` / `_END` are exactly those two pages,
// and the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 37 − 1 + 1 = 37. Scan pages 42–79 are after
// the term: the Term-2 divider (scan 42), the Term-2 lessons
// (Thèmes 3–4, books 39–68), the Term-2 journal (books 69–71) and the print
// matter (scans 78–79); scan 43 is a fully blank page (no text layer
// possible). Both blank versos sit outside the term, so `MISSING_SCANS` stays
// empty and every one of the 37 term scans carries a text layer.
//
// EIGHT TERM PAGES PRINT NO BOOK FOLIO — EACH HAS A NAMED ANCHOR
// The four chapitre dividers that print no number (books 1, 11, 18, 26),
// the journal divider (book 34) and the three journal pages (books 35–37)
// print no book folio: the journal pages number themselves 1, 2, 3 in the
// journal's own series instead. (The Chapitre-2 divider of book 5 DOES print
// its folio «5», so it needs no anchor.) Rather than weaken the page-number
// check, all eight are exempt from it and anchored on a string the page
// itself prints, named in `FOLIO_LESS_ANCHORS`. Every other term page proves
// its number from the folio in its furniture (see `footerCandidates`).
//
// EACH ACTIVITY PAGE IS ONE LESSON — CONCEPTS ARE ITS PRINTED HEADS
// Unlike the G1 book (whose chapitres print numbered «Leçon N» markers),
// this book's chapitres print bare activity titles («MA FAMILLE», «L'AIGLE»,
// «CÉLERI», …) with no lesson numbers at all, so each activity page is one
// lesson and its title is the head the page prints. The one page that prints
// two titled heads shares one lesson: book 13 («L'AIGLE» + «LA GAZELLE»);
// food names, table headers, word lists and diagram labels (books 15, 16, 20,
// 33) are inline exercise matter, not standalone heads, and contribute no
// concepts. The chapitre dividers print navigation only (thème + chapitre),
// so — as in the G1 and KG specs — they contribute no concepts; the divider
// head is checked as the section's `printedHead`, and each divider stays
// inside its section's first lesson. The journal section is one lesson owning
// books 34–37; its concepts are the divider head plus each journal page's
// opening «Leçon» («Leçon 7», «Leçon 31», «Leçon 48»), since a journal page
// prints a dozen «Leçon N» blocks and naming each would model mathematics,
// not heads. Nothing is invented: every concept title below is a string the
// book itself prints on the page its `bookFrom` names. The book numbers no
// lesson, so every lesson's `ordinal` is "" exactly as the G1 spec leaves its
// unnumbered intro lesson.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// Heads use the ASCII apostrophe («L'AIGLE», «L'HYMNE NATIONAL»,
// «L'ÊTRE HUMAIN», «L'ÉCOLE», «L'AGRICULTURE», «L'HOMME»); `normalize`
// deletes every non-letter/non-digit, so spacing, case and punctuation can
// never break a match and heads are transcribed byte-verbatim. The running
// head of book 19 still prints «THÈME 1 QUI SUIS-JE?» although the page
// belongs to the Thème-2 chapitre «LE MONDE DE LA NATURE» (a book misprint in
// the same family as the G2 English twin's mislabelled running head); the
// lesson head below it («LA COUR DE L'ÉCOLE») is unaffected. «LEMONDE»
// (no space) on the Thème-2 running heads and «1ère» on book 20 fold away in
// `normalize` and never disturb the folio tokens.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.33 = scan p.37). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the Thème-1 / Chapitre-1 divider (scan 5). */
export const EGYPT_DISCOVERY_FR_G2_T1_BOOK_START = 1;

/** Last printed page of the term — journal page «Leçon 48…Leçon 60» (scan 41). */
export const EGYPT_DISCOVERY_FR_G2_T1_BOOK_END = 37;

/** The scanned pages before the term: cover, introduction, sommaire (scan 3 is blank). */
export const EGYPT_DISCOVERY_FR_G2_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/**
 * The scanned pages after the term: the Term-2 divider (42), the Term-2
 * lessons (books 39–68), the Term-2 journal (books 69–71) and the print
 * matter (scans 78–79); scan 43 is a fully blank page.
 */
export const EGYPT_DISCOVERY_FR_G2_T1_BACK_MATTER = { from: 42, to: 79 } as const;

/**
 * The term pages the OCR never produced, in book pages. Both absent scans
 * (003 and 043) are fully blank pages outside the term range, and every one
 * of the 37 term scans carries a text layer, so the list is empty; kept so
 * the loader, the checks and the seeders share one shape across the books.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface DiscoveryFrG2T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «Activité» or «Leçon». */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one activity page, or the journal). */
export interface DiscoveryFrG2T1Lesson {
  /** App-addressable key, e.g. "5-3" (chapter 5, lesson 3). */
  key: string;
  /** Arabic ordinal of the lesson number; "" where the book numbers nothing. */
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
  concepts: DiscoveryFrG2T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — a chapitre, or the maths journal. */
export interface DiscoveryFrG2T1Section {
  /** This book's sections are its chapitres, plus the closing journal. */
  kind: "chapter" | "journal";
  /** Internal key: "1"…"6", in book order. */
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
  lessons: DiscoveryFrG2T1Lesson[];
}

const ACT = "Activité";
const LECON = "Leçon";

function act(bookFrom: number, title: string): DiscoveryFrG2T1Concept {
  return { bookFrom, kind: ACT, title };
}

function lec(bookFrom: number, title: string): DiscoveryFrG2T1Concept {
  return { bookFrom, kind: LECON, title };
}

/**
 * The five chapitres of the first term plus its closing «Journal des
 * Mathématiques», with their activity pages and every printed head,
 * transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter starts come from the book's «SOMMAIRE» (scan 4): 1, 5, 11, 18, 26,
 * journal 34. Each activity page is one lesson, in book order; the divider
 * stays inside its section's first lesson.
 */
export const EGYPT_DISCOVERY_FR_G2_T1_UNITS: DiscoveryFrG2T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "Thème 1 : Qui suis-je ? — Chapitre 1 : Tout sur moi",
    printedHead: "CHAPITRE 1: TOUT SUR MOI",
    bookFrom: 1,
    bookTo: 4,
    lessons: [
      {
        key: "1-1",
        ordinal: "",
        type: ACT,
        title: "TOUT SUR MOI",
        printedHead: "TOUT SUR MOI",
        bookFrom: 2,
        concepts: [act(2, "TOUT SUR MOI")],
      },
      {
        key: "1-2",
        ordinal: "",
        type: ACT,
        title: "DÉCOUVERTE DES COULEURS",
        printedHead: "DÉCOUVERTE DES COULEURS",
        bookFrom: 3,
        concepts: [act(3, "DÉCOUVERTE DES COULEURS")],
      },
      {
        key: "1-3",
        ordinal: "",
        type: ACT,
        title: "NOHA ET ADEL",
        printedHead: "NOHA ET ADEL",
        bookFrom: 4,
        concepts: [act(4, "NOHA ET ADEL")],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "الثاني",
    title: "Thème 1 : Qui suis-je ? — Chapitre 2 : La présentation de ma classe",
    printedHead: "CHAPITRE 2: LA PRÉSENTATION DE MA CLASSE",
    bookFrom: 5,
    bookTo: 10,
    lessons: [
      {
        key: "2-1",
        ordinal: "",
        type: ACT,
        title: "MA FAMILLE",
        printedHead: "MA FAMILLE",
        bookFrom: 6,
        concepts: [act(6, "MA FAMILLE")],
      },
      {
        key: "2-2",
        ordinal: "",
        type: ACT,
        title: "TOUT SUR LES MÉTIERS",
        printedHead: "TOUT SUR LES MÉTIERS",
        bookFrom: 7,
        concepts: [act(7, "TOUT SUR LES MÉTIERS")],
      },
      {
        key: "2-3",
        ordinal: "",
        type: ACT,
        title: "LE TABLEAU DES MÉTIERS PRÉFÉRÉS",
        printedHead: "LE TABLEAU DES MÉTIERS PRÉFÉRÉS",
        bookFrom: 8,
        concepts: [act(8, "LE TABLEAU DES MÉTIERS PRÉFÉRÉS")],
      },
      {
        key: "2-4",
        ordinal: "",
        type: ACT,
        title: "MES COMMUNAUTÉS",
        printedHead: "MES COMMUNAUTÉS",
        bookFrom: 9,
        concepts: [act(9, "MES COMMUNAUTÉS")],
      },
      {
        key: "2-5",
        ordinal: "",
        type: ACT,
        title: "L'HYMNE NATIONAL",
        printedHead: "L'HYMNE NATIONAL",
        bookFrom: 10,
        concepts: [act(10, "L'HYMNE NATIONAL")],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "الثالث",
    title: "Thème 1 : Qui suis-je ? — Chapitre 3 : Deux pieds, quatre pattes",
    printedHead: "CHAPITRE 3 : DEUX PIEDS, QUATRE PATTES",
    bookFrom: 11,
    bookTo: 17,
    lessons: [
      {
        key: "3-1",
        ordinal: "",
        type: ACT,
        title: "DEUX PIEDS, QUATRE PATTES",
        printedHead: "DEUX PIEDS, QUATRE PATTES",
        bookFrom: 12,
        concepts: [act(12, "DEUX PIEDS, QUATRE PATTES")],
      },
      {
        key: "3-2",
        ordinal: "",
        type: ACT,
        title: "L'AIGLE",
        printedHead: "L'AIGLE",
        bookFrom: 13,
        concepts: [act(13, "L'AIGLE"), act(13, "LA GAZELLE")],
      },
      {
        key: "3-3",
        ordinal: "",
        type: ACT,
        title: "L'ÊTRE HUMAIN",
        printedHead: "L'ÊTRE HUMAIN",
        bookFrom: 14,
        concepts: [act(14, "L'ÊTRE HUMAIN")],
      },
      {
        key: "3-4",
        ordinal: "",
        type: ACT,
        title: "LES ALIMENTS QUE NOUS MANGEONS",
        printedHead: "LES ALIMENTS QUE NOUS MANGEONS",
        bookFrom: 15,
        concepts: [act(15, "LES ALIMENTS QUE NOUS MANGEONS")],
      },
      {
        key: "3-5",
        ordinal: "",
        type: ACT,
        title: "COMPARAISON ENTRE LES êtres vivants",
        printedHead: "COMPARAISON ENTRE LES êtres vivants",
        bookFrom: 16,
        concepts: [act(16, "COMPARAISON ENTRE LES êtres vivants")],
      },
      {
        key: "3-6",
        ordinal: "",
        type: ACT,
        title: "NOTRE DRAPEAU",
        printedHead: "NOTRE DRAPEAU",
        bookFrom: 17,
        concepts: [act(17, "NOTRE DRAPEAU")],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "الرابع",
    title: "Thème 2 : Le monde autour de moi — Chapitre 1 : Le monde de la nature",
    printedHead: "CHAPITRE 1: LE MONDE DE LA NATURE",
    bookFrom: 18,
    bookTo: 25,
    lessons: [
      {
        key: "4-1",
        ordinal: "",
        type: ACT,
        title: "LA COUR DE L'ÉCOLE",
        printedHead: "LA COUR DE L'ÉCOLE",
        bookFrom: 19,
        concepts: [act(19, "LA COUR DE L'ÉCOLE")],
      },
      {
        key: "4-2",
        ordinal: "",
        type: ACT,
        title: "DESSINE LES DIFFÉRENTES PARTIES DE LA PLANTE",
        printedHead: "DESSINE LES DIFFÉRENTES PARTIES DE LA PLANTE",
        bookFrom: 20,
        concepts: [act(20, "DESSINE LES DIFFÉRENTES PARTIES DE LA PLANTE")],
      },
      {
        key: "4-3",
        ordinal: "",
        type: ACT,
        title: "CÉLERI",
        printedHead: "CÉLERI",
        bookFrom: 21,
        concepts: [act(21, "CÉLERI")],
      },
      {
        key: "4-4",
        ordinal: "",
        type: ACT,
        title: "LA DESCRIPTION DE LA PLANTE",
        printedHead: "LA DESCRIPTION DE LA PLANTE",
        bookFrom: 22,
        concepts: [act(22, "LA DESCRIPTION DE LA PLANTE")],
      },
      {
        key: "4-5",
        ordinal: "",
        type: ACT,
        title: "LES CARACTÉRISTIQUES DES ANIMAUX",
        printedHead: "LES CARACTÉRISTIQUES DES ANIMAUX",
        bookFrom: 23,
        concepts: [act(23, "LES CARACTÉRISTIQUES DES ANIMAUX")],
      },
      {
        key: "4-6",
        ordinal: "",
        type: ACT,
        title: "LA CLASSIFICATION DES ANIMAUX",
        printedHead: "LA CLASSIFICATION DES ANIMAUX",
        bookFrom: 24,
        concepts: [act(24, "LA CLASSIFICATION DES ANIMAUX")],
      },
      {
        key: "4-7",
        ordinal: "",
        type: ACT,
        title: "OBSERVE LE CIEL LA NUIT",
        printedHead: "OBSERVE LE CIEL LA NUIT",
        bookFrom: 25,
        concepts: [act(25, "OBSERVE LE CIEL LA NUIT")],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "الخامس",
    title: "Thème 2 : Le monde autour de moi — Chapitre 2 : Le monde créé par l'homme",
    printedHead: "CHAPITRE 2 : LE MONDE CRÉÉ PAR L'HOMME",
    bookFrom: 26,
    bookTo: 33,
    lessons: [
      {
        key: "5-1",
        ordinal: "",
        type: ACT,
        title: "LA TECHNOLOGIE NOUS AIDE !",
        printedHead: "LA TECHNOLOGIE NOUS AIDE !",
        bookFrom: 27,
        concepts: [act(27, "LA TECHNOLOGIE NOUS AIDE !")],
      },
      {
        key: "5-2",
        ordinal: "",
        type: ACT,
        title: "ENTRETENIR UN JARDIN: TRAVAUX ET OUTILS",
        printedHead: "ENTRETENIR UN JARDIN: TRAVAUX ET OUTILS",
        bookFrom: 28,
        concepts: [act(28, "ENTRETENIR UN JARDIN: TRAVAUX ET OUTILS")],
      },
      {
        key: "5-3",
        ordinal: "",
        type: ACT,
        title: "LES OUTILS DE L'AGRICULTURE",
        printedHead: "LES OUTILS DE L'AGRICULTURE",
        bookFrom: 29,
        concepts: [act(29, "LES OUTILS DE L'AGRICULTURE")],
      },
      {
        key: "5-4",
        ordinal: "",
        type: ACT,
        title: "OÙ ALLONS-NOUS VOYAGER?",
        printedHead: "OÙ ALLONS-NOUS VOYAGER?",
        bookFrom: 30,
        concepts: [act(30, "OÙ ALLONS-NOUS VOYAGER?")],
      },
      {
        key: "5-5",
        ordinal: "",
        type: ACT,
        title: "AMÉLIORER LA CIRCULATION",
        printedHead: "AMÉLIORER LA CIRCULATION",
        bookFrom: 31,
        concepts: [act(31, "AMÉLIORER LA CIRCULATION")],
      },
      {
        key: "5-6",
        ordinal: "",
        type: ACT,
        title: "LES FÊTES NATIONALES",
        printedHead: "LES FÊTES NATIONALES",
        bookFrom: 32,
        concepts: [act(32, "LES FÊTES NATIONALES")],
      },
      {
        key: "5-7",
        ordinal: "",
        type: ACT,
        title: "LES ORDINATEURS",
        printedHead: "LES ORDINATEURS",
        bookFrom: 33,
        concepts: [act(33, "LES ORDINATEURS")],
      },
    ],
  },
  {
    key: "6",
    kind: "journal",
    ordinal: "السادس",
    title: "Le Journal des Mathématiques",
    printedHead: "LE JOURNAL DES MATHÉMATIQUES",
    bookFrom: 34,
    bookTo: 37,
    lessons: [
      {
        key: "6-1",
        ordinal: "",
        type: LECON,
        title: "LE JOURNAL DES MATHÉMATIQUES",
        printedHead: "LE JOURNAL DES MATHÉMATIQUES",
        bookFrom: 34,
        concepts: [
          lec(34, "LE JOURNAL DES MATHÉMATIQUES"),
          lec(35, "Leçon 7"),
          lec(36, "Leçon 31"),
          lec(37, "Leçon 48"),
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
  const section = EGYPT_DISCOVERY_FR_G2_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_DISCOVERY_FR_G2_T1_UNITS.forEach((section, si) => {
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
  for (const section of EGYPT_DISCOVERY_FR_G2_T1_UNITS) {
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
  "discovery-fr-g2-t1",
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
  const lesson = EGYPT_DISCOVERY_FR_G2_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
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
 * on the page's last line as a bare numeral («2», «5», «27», «33»), so the
 * top and bottom furniture lines each contribute both their space-stripped
 * whole and every whitespace-separated digit token. Exercise numerals in the
 * body («5 ans» on book 4, «1ère» on book 20) join the candidate set
 * harmlessly: the page's own number proves the mapping when present (see
 * `printedFooter`).
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
 * mismatch). The four folio-less chapitre dividers (1, 11, 18, 26), the
 * journal divider (34) and the three journal pages (35, 36, 37 — numbered 1,
 * 2, 3 in the journal's own series) print no book folio and are exempted via
 * `FOLIO_LESS_ANCHORS`.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * Folios whose OCR printed a different, still parseable number. Every book
 * folio in this born-digital book came out right, so the map is empty and the
 * folio check stays exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no book folio in the checked furniture, each with
 * the anchor the check accepts in place of a page number: the four folio-less
 * chapitre dividers (books 1, 11, 18, 26) anchored on their chapitre head, the
 * journal divider (book 34) on its head, and the three journal pages (books
 * 35–37) on the opening «Leçon» each prints, since they number themselves in
 * the journal's own series (1, 2, 3) instead of the book's.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  1: "CHAPITRE 1: TOUT SUR MOI",
  11: "DEUX PIEDS, QUATRE PATTES",
  18: "LE MONDE DE LA NATURE",
  26: "LE MONDE CRÉÉ PAR L'HOMME",
  34: "LE JOURNAL DES MATHÉMATIQUES",
  35: "Leçon 7",
  36: "Leçon 31",
  37: "Leçon 48",
};

/** Every head kind the table may use. */
const KNOWN_KINDS = new Set(["Activité", "Leçon"]);

/**
 * Table invariants: lesson keys are unique and follow (section-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_DISCOVERY_FR_G2_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_DISCOVERY_FR_G2_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_DISCOVERY_FR_G2_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_DISCOVERY_FR_G2_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_DISCOVERY_FR_G2_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     the folio in its furniture, or, on the eight pages named in
 *     `FOLIO_LESS_ANCHORS`, from the anchor the page itself prints. The scans
 *     in `MISSING_SCANS` (none this term) carry no text to prove anything with
 *     and are not iterated (they stay owned by their lesson ranges below);
 *  2. every section opener prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title (or its printed head) and every activity's head is
 *     printed on the pages the lesson owns (the activity on its own page);
 *  4. every page in [1, 37] is owned by exactly one lesson — no page falls
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
  const sections = EGYPT_DISCOVERY_FR_G2_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_DISCOVERY_FR_G2_T1_BOOK_START || book > EGYPT_DISCOVERY_FR_G2_T1_BOOK_END) continue;
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
  for (let p = EGYPT_DISCOVERY_FR_G2_T1_BOOK_START; p <= EGYPT_DISCOVERY_FR_G2_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_DISCOVERY_FR_G2_T1_BOOK_END - EGYPT_DISCOVERY_FR_G2_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_DISCOVERY_FR_G2_T1_BOOK_START} و${EGYPT_DISCOVERY_FR_G2_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
