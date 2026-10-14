// KG 2 (رياض أطفال 2, «Grande Section») Discover, French-medium, first term
// («1er Semestre»), Ministry 2025/202… edition (cover prints «PARTONS À LA
// DÉCOUVERTE / GRANDE SECTION / 2025/202»).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-kg2-discovery-fr`, subject `discovery-fr` (NEW: name
// "Discovery (French)", nameAr "اكتشف (بالفرنسية)"), lesson prefix
// `l-kg2-dis-fr-`, grade `grade-kg2` (NEW: name "KG 2", nameAr
// "رياض أطفال 2").
//
// The curriculum tree for the Egypt `eg-kg2-discovery-fr` curriculum is rebuilt
// from the French-medium Ministry textbook `Partons à la Découverte`
// (79 scanned pages, Term 1 = the book's own «1er Semestre»). This module is
// the single source of truth for its structure: the five printed chapitres of
// the first term (three under Thème 1 «Qui suis-je ?», two under Thème 2
// «Le monde autour de moi»), the «Le Journal des Mathématiques» section that
// closes the semester, and, for every lesson, the book's own printed activity
// heads, verbatim and with the printed page they start on. The self-checks at
// the bottom prove that mapping against the text layer itself, page by page.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every numbered content page prints its own folio as a bare numeral on its
// last line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted
// here: scan 6 prints «2» (book 2), scan 14 prints «10» (book 10), scan 23
// prints «19» (book 19), scan 31 prints «27» (book 27) and scan 37 prints
// «33» (book 33). The book's own «SOMMAIRE» (scan 4) independently confirms
// it: it lists «Chapitre 1 : Tout sur moi 1» (scan 5), «Chapitre 2 : La
// présentation de ma classe 5» (scan 9), «Chapitre 3 : Deux pieds, Quatre
// pattes 11» (scan 15), «Chapitre 1 : Le monde de la nature 18» (scan 22),
// «Chapitre 2 : Le monde créé par l'homme 26» (scan 30) and «Le Journal des
// Mathématiques 34» (scan 38) — every divider sits exactly where the contents
// says it does.
//
// TERM = THE BOOK'S OWN FIRST SEMESTER (books 1–37)
// Scan pages 1–4 are before the term: the cover (1), the «INTRODUCTION AU
// MANUEL» (2), a blank back page (3, empty file) and the «SOMMAIRE» with the
// NAME slip (4). The term runs from the Term-1 divider (book 1 = scan 5) to
// the last page of «Le Journal des Mathématiques» (book 37 = scan 41):
// `EGYPT_DISCOVERY_FR_KG2_T1_BOOK_START` / `_END` are exactly those two
// pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` therefore equals 37 − 1 + 1 = 37. Scan pages
// 42–79 are after the term: two empty scans (42–43), the Term-2 divider and
// lessons (Thèmes 3–4, books 39–68), the Term-2 journal (book 69 on) and the
// print matter (scans 78–79).
//
// ONE UNNUMBERED PAGE HIDES BETWEEN THE TERMS
// Term-2 folios prove the offset shifts by one after the term: scan 45 prints
// «40», scan 51 prints «46», scan 55 prints «50» and scan 69 prints «64», and
// the Term-2 divider (scan 44) sits on printed page 39 exactly as the
// «SOMMAIRE» lists («BIENVENUE DANS NOTRE QUARTIER 39», «JOUER AVEC DE
// NOUVEAUX AMIS 45», «AU MARCHÉ 49», «LA MUSIQUE ET SES SONS 56»,
// «L'ART NOUS PERMET DE RACONTER DES HISTOIRES 60», «L'AMITIÉ 63», journal
// «69» — every one lands on scan − 5). So exactly one of the two empty scans
// 42–43 is an unnumbered blank and the other is printed page 38 (the blank
// back of the journal sheet). Neither belongs to the term, and Term 1 itself
// keeps the single offset 4 throughout.
//
// EIGHT TERM PAGES PRINT NO LAST-LINE FOLIO — EACH HAS A NAMED ANCHOR
// The five chapter/journal dividers (books 1, 11, 18, 26, 34) print their
// head but no page number. The three journal content pages (books 35–37)
// print the journal's own internal folio («1», «2», «3») glued to the FIRST
// line instead, so the last-line rule honestly finds nothing there. Rather
// than weaken the page-number check, all eight are exempt from it and
// anchored on a string the page itself prints, named in
// `FOLIO_LESS_ANCHORS`. Every other term page proves its number from its last
// line, which must be a bare numeral equal to its own book number.
//
// EVERY TERM PAGE CARRIES REAL TEXT
// Unlike the G1 Discover book (whose book 3 is an illustration-only page),
// all 37 term pages of this book carry a born-digital French text layer, so
// `TEXTLESS_PAGES` is empty and every term page is checked for text, folio
// (or anchor) and ownership.
//
// EACH LESSON IS ONE PRINTED ACTIVITY — CONCEPTS ARE ITS PRINTED HEADS
// The KG book prints no numbered «leçons» in the Discovery chapters: each
// activity page is one lesson and its title is the head the page prints
// («Mon autoportrait», «MA FAMILLE», …). Two pages print two titled heads and
// both ride with the lesson, as in the G1 spec: book 13 «L'AIGLE» +
// «LA GAZELLE», book 21 «La plante de Sara» + «CÉLERI». The chapter dividers
// print navigation only (thème + chapitre), so — unlike the content-bearing
// G1 intro pages — they contribute no concepts; the divider head is checked
// as the unit's `printedHead`. The journal section is one lesson owning books
// 34–37; its concepts are the divider head plus each journal page's opening
// «Leçon» («Leçon 7», «Leçon 31», «Leçon 48»), since a journal page prints a
// dozen «Leçon N» blocks and naming each would model mathematics, not heads.
// Nothing is invented: every concept title below is a string the book itself
// prints on the page its `bookFrom` names.
//
// NO SYSTEMATIC FONT ISSUE IN THE LAYER
// The born-digital French layer is clean: diacritics (É, È, Ê, À, Ç, Œ),
// the U+2019 apostrophe («L’AIGLE», «l’histoire») and Arabic anthem lines all
// extract correctly. (A console mis-decoding during the survey first rendered
// «É» as «A%»; the files themselves are proper UTF-8 French.) Two straight
// ASCII apostrophes slip into the layer («Carré'autour», «l'aide»,
// «d'histoire»); `normalize` deletes every non-letter/non-digit, so both
// apostrophe forms match regardless and heads are transcribed byte-verbatim.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.33 = scan p.37). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the Term-1 divider (scan 5). */
export const EGYPT_DISCOVERY_FR_KG2_T1_BOOK_START = 1;

/** Last printed page of the term — journal page 3, «Leçon 48 … Leçon 60» (scan 41). */
export const EGYPT_DISCOVERY_FR_KG2_T1_BOOK_END = 37;

/** The scanned pages before the term: cover, introduction, blank, sommaire. */
export const EGYPT_DISCOVERY_FR_KG2_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/**
 * The scanned pages after the term: two empty scans (one unnumbered blank),
 * the Term-2 divider and lessons (books 39–68), the Term-2 journal and the
 * print matter (scans 78–79).
 */
export const EGYPT_DISCOVERY_FR_KG2_T1_BACK_MATTER = { from: 42, to: 79 } as const;

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface DiscoveryFrKg2T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «activité». */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (= one activity page of a chapter, or the journal). */
export interface DiscoveryFrKg2T1Lesson {
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
  concepts: DiscoveryFrKg2T1Concept[];
}

/** One printed section of the book — a chapitre, or the maths journal. */
export interface DiscoveryFrKg2T1Section {
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
  lessons: DiscoveryFrKg2T1Lesson[];
}

const TYPE = "activité";

function concept(bookFrom: number, title: string): DiscoveryFrKg2T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The five chapitres of the first term plus its closing «Journal des
 * Mathématiques», with their printed activities and every printed head,
 * transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter starts come from the book's «SOMMAIRE» (scan 4): 1, 5, 11, 18, 26,
 * journal 34. Each activity page is one lesson, in book order.
 */
export const EGYPT_DISCOVERY_FR_KG2_T1_UNITS: DiscoveryFrKg2T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "Thème 1 : Qui suis-je ? — Chapitre 1 : Tout sur moi",
    printedHead: "CHAPITRE 1 : TOUT SUR MOI",
    bookFrom: 1,
    bookTo: 4,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "Mon autoportrait",
        printedHead: "Mon autoportrait",
        bookFrom: 2,
        concepts: [concept(2, "Mon autoportrait")],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "DÉCOUVERTE DES COULEURS",
        printedHead: "DÉCOUVERTE DES COULEURS",
        bookFrom: 3,
        concepts: [concept(3, "DÉCOUVERTE DES COULEURS")],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "NOHA ET ADEL",
        printedHead: "NOHA ET ADEL",
        bookFrom: 4,
        concepts: [concept(4, "NOHA ET ADEL")],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "الثاني",
    title: "Thème 1 : Qui suis-je ? — Chapitre 2 : La présentation de ma classe",
    printedHead: "CHAPITRE 2 : LA PRÉSENTATION DE MA CLASSE",
    bookFrom: 5,
    bookTo: 10,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "MA FAMILLE",
        printedHead: "MA FAMILLE",
        bookFrom: 6,
        concepts: [concept(6, "MA FAMILLE")],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "TOUT SUR LES MÉTIERS",
        printedHead: "TOUT SUR LES MÉTIERS",
        bookFrom: 7,
        concepts: [concept(7, "TOUT SUR LES MÉTIERS")],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "LE TABLEAU DES MÉTIERS PRÉFÉRÉS",
        printedHead: "LE TABLEAU DES MÉTIERS PRÉFÉRÉS",
        bookFrom: 8,
        concepts: [concept(8, "LE TABLEAU DES MÉTIERS PRÉFÉRÉS")],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "MES COMMUNAUTÉS",
        printedHead: "MES COMMUNAUTÉS",
        bookFrom: 9,
        concepts: [concept(9, "MES COMMUNAUTÉS")],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "L’HYMNE NATIONAL",
        printedHead: "L’HYMNE NATIONAL",
        bookFrom: 10,
        concepts: [concept(10, "L’HYMNE NATIONAL")],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "الثالث",
    title: "Thème 1 : Qui suis-je ? — Chapitre 3 : Deux pieds, Quatre pattes",
    printedHead: "CHAPITRE 3 : DEUX PIEDS, QUATRE PATTES",
    bookFrom: 11,
    bookTo: 17,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "DEUX PIEDS, QUATRE PATTES",
        printedHead: "DEUX PIEDS, QUATRE PATTES",
        bookFrom: 12,
        concepts: [concept(12, "DEUX PIEDS, QUATRE PATTES")],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "L’AIGLE",
        printedHead: "L’AIGLE",
        bookFrom: 13,
        concepts: [concept(13, "L’AIGLE"), concept(13, "LA GAZELLE")],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "L’ÊTRE HUMAIN",
        printedHead: "L’ÊTRE HUMAIN",
        bookFrom: 14,
        concepts: [concept(14, "L’ÊTRE HUMAIN")],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "LES ALIMENTS QUE NOUS MANGEONS",
        printedHead: "LES ALIMENTS QUE NOUS MANGEONS",
        bookFrom: 15,
        concepts: [concept(15, "LES ALIMENTS QUE NOUS MANGEONS")],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "COMPARAISON ENTRE LES êtres vivants",
        printedHead: "COMPARAISON ENTRE LES êtres vivants",
        bookFrom: 16,
        concepts: [concept(16, "COMPARAISON ENTRE LES êtres vivants")],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: TYPE,
        title: "NOTRE DRAPEAU",
        printedHead: "NOTRE DRAPEAU",
        bookFrom: 17,
        concepts: [concept(17, "NOTRE DRAPEAU")],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "الرابع",
    title: "Thème 2 : Le monde autour de moi — Chapitre 1 : Le monde de la nature",
    printedHead: "CHAPITRE 1 : LE MONDE DE LA NATURE",
    bookFrom: 18,
    bookTo: 25,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "LA COUR DE L’ÉCOLE",
        printedHead: "LA COUR DE L’ÉCOLE",
        bookFrom: 19,
        concepts: [concept(19, "LA COUR DE L’ÉCOLE")],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "DESSINE LES DIFFÉRENTES PARTIES DE LA PLANTE",
        printedHead: "DESSINE LES DIFFÉRENTES PARTIES DE LA PLANTE",
        bookFrom: 20,
        concepts: [concept(20, "DESSINE LES DIFFÉRENTES PARTIES DE LA PLANTE")],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "La plante de Sara",
        printedHead: "La plante de Sara",
        bookFrom: 21,
        concepts: [concept(21, "La plante de Sara"), concept(21, "CÉLERI")],
      },
      {
        key: "4-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "LA DESCRIPTION DE LA PLANTE",
        printedHead: "LA DESCRIPTION DE LA PLANTE",
        bookFrom: 22,
        concepts: [concept(22, "LA DESCRIPTION DE LA PLANTE")],
      },
      {
        key: "4-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "LES CARACTÉRISTIQUES DES ANIMAUX",
        printedHead: "LES CARACTÉRISTIQUES DES ANIMAUX",
        bookFrom: 23,
        concepts: [concept(23, "LES CARACTÉRISTIQUES DES ANIMAUX")],
      },
      {
        key: "4-6",
        ordinal: "السادس",
        type: TYPE,
        title: "LA CLASSIFICATION DES ANIMAUX",
        printedHead: "LA CLASSIFICATION DES ANIMAUX",
        bookFrom: 24,
        concepts: [concept(24, "LA CLASSIFICATION DES ANIMAUX")],
      },
      {
        key: "4-7",
        ordinal: "السابع",
        type: TYPE,
        title: "OBSERVE LE CIEL LA NUIT",
        printedHead: "OBSERVE LE CIEL LA NUIT",
        bookFrom: 25,
        concepts: [concept(25, "OBSERVE LE CIEL LA NUIT")],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "الخامس",
    title: "Thème 2 : Le monde autour de moi — Chapitre 2 : Le monde créé par l’homme",
    printedHead: "CHAPITRE 2 : LE MONDE CRÉÉ PAR L’HOMME",
    bookFrom: 26,
    bookTo: 33,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: TYPE,
        title: "LA TECHNOLOGIE NOUS AIDE !",
        printedHead: "LA TECHNOLOGIE NOUS AIDE !",
        bookFrom: 27,
        concepts: [concept(27, "LA TECHNOLOGIE NOUS AIDE !")],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "ENTRETENIR UN JARDIN: TRAVAUX ET OUTILS",
        printedHead: "ENTRETENIR UN JARDIN: TRAVAUX ET OUTILS",
        bookFrom: 28,
        concepts: [concept(28, "ENTRETENIR UN JARDIN: TRAVAUX ET OUTILS")],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "LES OUTILS DE L’AGRICULTURE",
        printedHead: "LES OUTILS DE L’AGRICULTURE",
        bookFrom: 29,
        concepts: [concept(29, "LES OUTILS DE L’AGRICULTURE")],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "OÙ ALLONS-NOUS VOYAGER?",
        printedHead: "OÙ ALLONS-NOUS VOYAGER?",
        bookFrom: 30,
        concepts: [concept(30, "OÙ ALLONS-NOUS VOYAGER?")],
      },
      {
        key: "5-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "AMÉLIORER LA CIRCULATION",
        printedHead: "AMÉLIORER LA CIRCULATION",
        bookFrom: 31,
        concepts: [concept(31, "AMÉLIORER LA CIRCULATION")],
      },
      {
        key: "5-6",
        ordinal: "السادس",
        type: TYPE,
        title: "LES FÊTES NATIONALES",
        printedHead: "LES FÊTES NATIONALES",
        bookFrom: 32,
        concepts: [concept(32, "LES FÊTES NATIONALES")],
      },
      {
        key: "5-7",
        ordinal: "السابع",
        type: TYPE,
        title: "LES ORDINATEURS",
        printedHead: "LES ORDINATEURS",
        bookFrom: 33,
        concepts: [concept(33, "LES ORDINATEURS")],
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
        ordinal: "الأول",
        type: TYPE,
        title: "LE JOURNAL DES MATHÉMATIQUES",
        printedHead: "LE JOURNAL",
        bookFrom: 34,
        concepts: [
          concept(34, "LE JOURNAL DES MATHÉMATIQUES"),
          concept(35, "Leçon 7"),
          concept(36, "Leçon 31"),
          concept(37, "Leçon 48"),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the chapter divider (its first lesson) or its
 * own head page, down to the page before the next lesson starts, bounded by
 * the chapter — so the divider stays inside the chapter it belongs to. When
 * the book prints two heads on one page they share a lesson, so distinct
 * lessons always start on distinct pages and the ranges tile the chapter
 * exactly.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_DISCOVERY_FR_KG2_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_DISCOVERY_FR_KG2_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This term has
 * no appendix: every page of the term belongs to a chapter or the journal.
 * Kept as a function so the seeder and the stage share one shape across all
 * the books.
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
  "discovery-fr-kg2-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (This term has no such page; the guard mirrors the G1 spec.)
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
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(unitIndex, lessonIndex);
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

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EXT_AR_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Arabic-Indic and Extended Arabic-Indic digits → Latin, so a folio can be read. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * Folds text for comparison: lowercases it and removes every non-letter and
 * non-digit, so spacing, punctuation and the book's two apostrophe forms
 * (U+2019 «’» and ASCII «'») cannot break a match. Diacritics are kept
 * verbatim on both sides — the text layer prints clean French, so no
 * accent folding is needed and none is applied.
 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring spacing, case and punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints at its foot. This book's folio
 * is a bare numeral standing alone on the last line («14», «27»); the last
 * non-empty line is read and every other line is ignored, so body numbers
 * (ages, prices, counts) can never be mistaken for a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const last = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .at(-1) ?? "";
  if (!/^[0-9٠-٩۰-۹]+$/.test(last)) return [];
  const n = Number(toLatinDigits(last).replace(/\D/g, ""));
  return n > 0 ? [n] : [];
}

/**
 * The book number a content page prints at its foot, or null. Every content
 * page that carries a folio prints exactly one number there and it is its own,
 * which is what fixes the offset; the pages named in `FOLIO_LESS_ANCHORS`
 * carry no last-line folio and are handled there instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The term pages that print no last-line folio in the text layer, each with
 * the anchor the check accepts in place of a page number: the five
 * chapter/journal dividers (books 1, 11, 18, 26, 34, anchored on their head)
 * and the three journal content pages (books 35–37, which print the journal's
 * own internal folio «1»/«2»/«3» on the first line instead, anchored on each
 * page's opening «Leçon»).
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  1: "CHAPITRE 1 : TOUT SUR MOI",
  11: "DEUX PIEDS, QUATRE PATTES",
  18: "LE MONDE DE LA NATURE",
  26: "LE MONDE CRÉÉ PAR L’HOMME",
  34: "LE JOURNAL DES MATHÉMATIQUES",
  35: "Leçon 7",
  36: "Leçon 31",
  37: "Leçon 48",
};

/**
 * Term pages with no readable text at all. This term has none: every one of
 * the 37 term pages carries a born-digital French text layer. Kept (empty) so
 * the loader, the checks and the seeders share one shape across the books.
 */
const TEXTLESS_PAGES: Readonly<Record<number, string>> = {};

/**
 * Table invariants: lesson keys are unique and follow (chapter-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_DISCOVERY_FR_KG2_T1_UNITS;
  const keys = new Set<string>();

  units.forEach((unit, ui) => {
    if (!unit.title.trim()) problems.push(`القسم ${unit.key}: بلا عنوان`);
    if (!unit.printedHead.trim()) problems.push(`القسم ${unit.key}: بلا عنوان مطبوع`);
    if (unit.lessons.length === 0) problems.push(`القسم ${unit.title}: بلا دروس`);

    unit.lessons.forEach((lesson, li) => {
      if (keys.has(lesson.key)) problems.push(`مفتاح درس مكرر: «${lesson.key}»`);
      keys.add(lesson.key);
      const expectedKey = `${unit.key}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`القسم ${unit.key} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (!lesson.title.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان`);
      if (!lesson.printedHead.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان مطبوع`);
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أنشطة`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول نشاط`);
      }

      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((c, ci) => {
        if (!c.title.trim()) problems.push(`الدرس ${lesson.key} النشاط ${ci + 1}: بلا عنوان`);
        if (c.bookFrom < unit.bookFrom || c.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} النشاط ${ci + 1}: صفحته ${c.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && c.bookFrom < prev.bookFrom) {
          problems.push(`الدرس ${lesson.key}: صفحات الأنشطة تنازلية (${prev.bookFrom} ثم ${c.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }
      const last = lesson.concepts.at(-1)!;
      if (last.bookFrom < from || last.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: نشاطه الأخير ${last.bookFrom} خارج نطاقه ${from}–${to}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر القسم ${unit.bookFrom}، وجدنا ${from}`);
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
  if (first && first.bookFrom !== EGYPT_DISCOVERY_FR_KG2_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_DISCOVERY_FR_KG2_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_DISCOVERY_FR_KG2_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_DISCOVERY_FR_KG2_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page is accounted for — a text page proves its book number
 *     from its printed folio, or, on the pages named in `FOLIO_LESS_ANCHORS`,
 *     from the anchor that page prints; pages named in `TEXTLESS_PAGES`
 *     (none this term) are exempt from both but still counted and owned;
 *  2. every section divider prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title and every activity's head is printed on the pages
 *     the lesson owns (the activity on its own page);
 *  4. every printed page in [1, 37] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of
 *     the term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_DISCOVERY_FR_KG2_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term is accounted for and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_DISCOVERY_FR_KG2_T1_BOOK_START || book > EGYPT_DISCOVERY_FR_KG2_T1_BOOK_END) continue;
    const text = loadBookPage(book);
    pagesChecked += 1;
    if (!text) {
      if (TEXTLESS_PAGES[book] === undefined) {
        problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      }
      printedPages.add(book);
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
      } else if (footer !== book) {
        problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_DISCOVERY_FR_KG2_T1_BOOK_END - EGYPT_DISCOVERY_FR_KG2_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_DISCOVERY_FR_KG2_T1_BOOK_START} و${EGYPT_DISCOVERY_FR_KG2_T1_BOOK_END}`,
    );
  }

  // 2 + 3a. every section divider prints the section head, every lesson's first
  // page its head, and every lesson's title is printed somewhere in the pages
  // it owns.
  units.forEach((unit, ui) => {
    if (!pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} لا تطبع «${unit.printedHead}»`);
    }

    unit.lessons.forEach((lesson, li) => {
      if (!pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع «${lesson.printedHead}»`);
      }
      const { from, to } = lessonBookRange(ui, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      if (!titlePrinted) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
    });
  });

  // 3b. every activity's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (!pagePrints(c.bookFrom, c.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة النشاط ${c.bookFrom} لا تطبع «${c.title}»`);
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
  for (let p = EGYPT_DISCOVERY_FR_KG2_T1_BOOK_START; p <= EGYPT_DISCOVERY_FR_KG2_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
