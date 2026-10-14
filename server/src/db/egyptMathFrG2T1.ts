// Primary 2 (2ème Primaire) Mathematics, French-medium, first term,
// Ministry of Education and Technical Education 2025/2026 edition (the cover
// imprint prints «2025-2026» and the back matter the print specs).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g2-math-fr`, subject `math-fr` (name "Mathématiques"), lesson prefix
// `l-g2-math-fr-`, grade `grade-2` (name "Primary 2").
//
// The curriculum tree for the Egypt `eg-g2-math-fr` curriculum is rebuilt from
// the Ministry textbook `MATHÉMATIQUES — 2ème primaire — 1er semestre`
// (96 scanned pages). This module is the single source of truth for its
// structure: the six printed CHAPITREs of the first term, every numbered
// LEÇON inside them (60 in all, exactly as the book's own «CONTENTU» on
// scan 4 lists them), and, for every lesson, the book's own printed heads —
// the lesson head plus the activity-flow bands the lesson prints
// (APPLICATION / Réfléchis) — verbatim and with the printed page they start
// on. The self-checks at the bottom prove that mapping against the OCR
// itself, page by page.
//
// THE OFFSET IS ZERO — book page = scan page
// Every content page prints its own folio in its footer («N 2ème Primaire»
// or «2ème Primaire N», spaced «2 ème» on some pages), so `BOOK_TO_PDF_OFFSET`
// is fixed by the scans and quoted here: scan 5 prints «2 ème Primaire 5»
// (book 5, the Leçon 1-1 opener), scan 6 prints «6 2ème Primaire» (book 6),
// scan 90 prints «90 2 ème Primaire» (book 90, the Leçon 6-10 opener) and
// scan 91 prints «2ème Primaire 91» (book 91, the term's last page). The
// book's own «CONTENTU» (scan 4) independently confirms the lesson starts:
// it lists «Leçon 1 … 5» … «Leçon 10 … 90» — every head below sits exactly
// where the contents says it does, with the wording divergences noted below.
//
// TERM = THE NUMBERED PAGES (books 5–91)
// Scan pages 1–4 are before the term: the cover (1), a blank verso (2, the
// OCR answers «لا يوجد نص في الصورة المرفقة»), the «PREFACE» (3) and the
// printed «CONTENTU» (4). Scan pages 92–96 are after the term: a blank verso
// (92), the credits / copyright page (93), a blank (94) and the print-specs
// pages (95–96). The term runs from the Leçon 1-1 opener (book 5 = scan 5)
// to the closing Réfléchis page of Leçon 6-10 (book 91 = scan 91):
// `EGYPT_MATH_FR_G2_T1_BOOK_START` / `_BOOK_END` are exactly those two pages,
// and the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` is therefore 91 − 5 + 1 = 87 (no scan of the term is
// missing).
//
// THE FOLIO CHECK READS THE FOOTER'S LAST LINE, PLUS SPLIT FOOTERS
// Ordinary pages print the folio on their last line («6 2ème Primaire»,
// «2ème Primaire 45»); the ordinal «2ème»/«2 ème» is stripped before reading,
// so the 2 of «2ème» can never be mistaken for a folio, and body numbers
// (chart scales, ruler marks, clock faces, exercise counts) sit above the
// last line and are never read. Three pages split the footer across lines:
// book 8 prints a bare «8» above «2 ème Primaire»; book 58 prints a bare
// «58» above a LaTeX-garbled footer («$2^{\\text{ème}}\\text{ Primaire}$»,
// the maths segment is deleted before reading); book 66 prints a bare «66»
// above «2»/«ème»/«Primaire» on three lines. `footerCandidates` therefore
// reads the last line first and, only when it yields no number, walks upward
// through footer-fragment lines («2», «ème», «Primaire», maths) to the bare
// numeral above — bounded to five lines so body numbers stay out of reach.
// Every folio so read equals its own book number, so `FOOTER_OCR_MISREADS`
// is empty and no page needs a `FOLIO_LESS_ANCHORS` entry.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED BANDS
// Every numbered leçon contributes its head line (number + title, exactly as
// the opener prints it) plus the activity-flow bands it prints: «APPLICATION»
// on the lesson's work page and «Réfléchis» where the lesson prints its
// reflection box (on the head page itself when the lesson owns a single page,
// otherwise on a following page — including six Réfléchis-only pages that
// print no other head: books 7, 13, 17, 38, 43 and 48 print «Réfléchis» with
// the chapter band only). Five lessons print no «APPLICATION» at all
// (3-6, 4-10, 5-7, 6-5, 6-7 — verified against the full text layer), so they
// carry only their lesson head (plus «Réfléchis» where printed); Leçon 4-2
// prints its work in two numbered parts, kept as «APPLICATION (1)» on book
// 42 and «APPLICATION (2)» on book 43. The inline «Exemple :»/«Exemples :»
// labels (books 22, 30, 46, 49, 54, 57) and the «DÉFI» box (book 21) are
// exercise-level, like the Grade-4 French twin's game boxes, and contribute
// no concept. Nothing is invented: every concept title below is a string the
// book itself prints on the page its `bookFrom` names.
//
// TEXT-LAYER QUIRKS RECORDED, NOT WORKED AROUND
// `normalize` lowercases and drops every non-letter/digit, so spacing,
// colons, apostrophes (straight ' everywhere except book 63's ’ U+2019 in
// «L’UTILISATION») and the hyphen of the line-split «FI-/GURES» (book 63)
// can never break a match. Stored byte-verbatim are the book's own forms:
// «LEÇON1:» (book 5 prints no space), «Leçon 9 :» (book 39 prints the head in
// lowercase), «LEÇON 4:»/«LEÇON 10:»/«LEÇON 2:»/«LEÇON 6:»/«LEÇON 7:» (books
// 63, 72, 75, 84, 85 print no space after the colon), «PAR COMPTENT» (the
// book's own typo, U2L2), «FORMES» (books 30–31 print «FORMES DE 3 CHIFFRES»),
// «ETENDUE» (book 32 prints no accent), «réfélchis:» (book 33 prints the band
// with f/l swapped), «VERBALE» (book 34 prints the singular), «L' ÉCRITURE»
// (book 35 spaces its apostrophe), «CENTIMETÈRS» (book 64), «LONGUREUR»
// (book 67), «CLASSIFICATION LES FIGURES QUI ONT 3 DIMENSIONS.» (book 69,
// with trailing period) and «( LE MATIN LE EN SOIR )» (book 82).
//
// SIX GENUINE CONTENTS DIVERGENCES (the spec follows the printed page)
//  1. U2-4: the contents lists «Addition ou soustraction par formes des
//     dizaines» (p. 22) but the head printed on book 22 reads «ADDITION OU
//     SOUSTRACTION DES DIZAINES».
//  2. U3-1/U3-2: the contents lists «les nombres formés de 3 chiffres» but
//     the heads printed on books 30–31 read «LES NOMBRES FORMES DE 3
//     CHIFFRES» / «PLUS DE NOMBRES FORMES DE 3 CHIFFRES».
//  3. U3-5: the contents lists «Plus de formes verbales des nombres» (p. 34)
//     but the head printed on book 34 reads «PLUS DE FORMES VERBALE DES
//     NOMBRES».
//  4. U5-9: the contents lists «classification les figures gui ont 3
//     .dimensions» (p. 69) but the head printed on book 69 reads
//     «CLASSIFICATION LES FIGURES QUI ONT 3 DIMENSIONS.»
//  5. U6-5: the contents lists «Le temps (le matin et le soir)» (p. 82) but
//     the head printed on book 82 reads «LE TEMPS ( LE MATIN LE EN SOIR )».
//  6. U6-8: the contents lists «Les Applications sur le temps» (p. 86) but
//     the head printed on book 86 reads «LES APPLICATIONS SUR L'HEURE».
//
// THE CHAPTER OPENER RIDES WITH THE FIRST LESSON
// Each chapter's first lesson starts on the chapter's own opener page (which
// prints «CHAPITRE N» and then the lesson head), so `lessonBookRange` starts
// a chapter's first lesson at the section head, exactly as the other Egyptian
// Mathematics specs do. The book prints no chapter subtitles and no appendix:
// every page of the term belongs to exactly one lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 0 (verified: book p.91 = scan p.91). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the term — the Leçon 1-1 opener (scan 5). */
export const EGYPT_MATH_FR_G2_T1_BOOK_START = 5;

/** Last printed page of the term — the closing Réfléchis of Leçon 6-10 (scan 91). */
export const EGYPT_MATH_FR_G2_T1_BOOK_END = 91;

/** The scanned pages before the term: cover, blank verso, PREFACE, CONTENTU. */
export const EGYPT_MATH_FR_G2_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/** The scanned pages after the term: blank verso, credits/copyright, blank, print specs. */
export const EGYPT_MATH_FR_G2_T1_BACK_MATTER = { from: 92, to: 96 } as const;

/**
 * The term pages the OCR never produced, as scan pages. All 96 scans are
 * present and every one of the 87 term pages carries text, so there are
 * none; the constant is kept so this module shares the shape of the other
 * Egyptian specs (and so the checker's expected page count subtracts it).
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed band of a lesson — becomes one concept in the app tree. */
export interface MathFrG2T1Concept {
  /** Printed book page where this band starts. */
  bookFrom: number;
  /** The printed band kind: "Leçon", "Application" or "Réfléchis". */
  kind: string;
  /** The printed band head, verbatim. */
  title: string;
}

/** One printed lesson (one numbered leçon of a chapter). */
export interface MathFrG2T1Lesson {
  /** App-addressable key, e.g. "5-3" (chapter 5, lesson 3). */
  key: string;
  /** French ordinal of the lesson number, e.g. "Troisième". */
  ordinal: string;
  /** The lesson's opening band type — its first concept's kind ("Leçon"). */
  type: string;
  /** Lesson title as printed at the head of the lesson (without the number prefix). */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed bands for this lesson, in order, with their start pages. */
  concepts: MathFrG2T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a chapter — so no lesson below uses it; the
   * field is kept so this module shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed chapter of the book — one of the six chapitres of the first term. */
export interface MathFrG2T1Section {
  /** This book's sections are its chapitres. */
  kind: "chapter";
  /** Internal key: "1"…"6", in book order. */
  key: string;
  /** French ordinal of the chapter as the app prints it, e.g. "Deuxième". */
  ordinal: string;
  /** Full app-facing section title, e.g. "Chapitre 1". */
  title: string;
  /** The chapter head the opener page prints, verbatim, e.g. "CHAPITRE 1". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next opener). */
  bookTo: number;
  lessons: MathFrG2T1Lesson[];
}

const LECON = "Leçon";
const APPLICATION = "Application";
const REFLECHIS = "Réfléchis";

const T_APPLICATION = "APPLICATION";
const T_REFLECHIS = "Réfléchis";

function concept(bookFrom: number, kind: string, title: string): MathFrG2T1Concept {
  return { bookFrom, kind, title };
}

function lessonHead(bookFrom: number, title: string): MathFrG2T1Concept {
  return concept(bookFrom, LECON, title);
}

function application(bookFrom: number, title: string = T_APPLICATION): MathFrG2T1Concept {
  return concept(bookFrom, APPLICATION, title);
}

function reflechis(bookFrom: number, title: string = T_REFLECHIS): MathFrG2T1Concept {
  return concept(bookFrom, REFLECHIS, title);
}

/**
 * The six chapitres of the first term with their printed lessons and every
 * printed band, transcribed from the pages the book prints them on and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter ranges come from the pages' own «CHAPITRE N» openers and the
 * contents (scan 4): 5–18, 19–29, 30–40, 41–58, 59–72 and 73–91. Lesson
 * starts come from the «LEÇON n» openers and match the contents exactly; the
 * six heads noted above follow the printed page rather than the contents.
 */
export const EGYPT_MATH_FR_G2_T1_UNITS: MathFrG2T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "Premier",
    title: "Chapitre 1",
    printedHead: "CHAPITRE 1",
    bookFrom: 5,
    bookTo: 18,
    lessons: [
      {
        key: "1-1",
        ordinal: "Première",
        type: LECON,
        title: "LA LECTURE DES DONNÉES",
        printedHead: "LEÇON1:LA LECTURE DES DONNÉES",
        bookFrom: 5,
        concepts: [lessonHead(5, "LEÇON1:LA LECTURE DES DONNÉES"), application(5)],
      },
      {
        key: "1-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "L'ADDITION ET LA PRÉSENTATION DES DONNÉES .",
        printedHead: "LEÇON 2 : L'ADDITION ET LA PRÉSENTATION DES DONNÉES .",
        bookFrom: 6,
        concepts: [
          lessonHead(6, "LEÇON 2 : L'ADDITION ET LA PRÉSENTATION DES DONNÉES ."),
          application(6),
          reflechis(7),
        ],
      },
      {
        key: "1-3",
        ordinal: "Troisième",
        type: LECON,
        title: "LA COMPARAISON DES DONNÉES",
        printedHead: "LEÇON 3 : LA COMPARAISON DES DONNÉES",
        bookFrom: 8,
        concepts: [lessonHead(8, "LEÇON 3 : LA COMPARAISON DES DONNÉES"), application(8)],
      },
      {
        key: "1-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "LA REPRESENTATION ET L'APPLICATION DES DONNÉES",
        printedHead: "LEÇON 4 : LA REPRESENTATION ET L'APPLICATION DES DONNÉES",
        bookFrom: 9,
        concepts: [
          lessonHead(9, "LEÇON 4 : LA REPRESENTATION ET L'APPLICATION DES DONNÉES"),
          application(9),
          reflechis(10),
        ],
      },
      {
        key: "1-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "REPRÉSENTER LE GRAPHIQUE 1",
        printedHead: "LEÇON 5 : REPRÉSENTER LE GRAPHIQUE 1",
        bookFrom: 11,
        concepts: [lessonHead(11, "LEÇON 5 : REPRÉSENTER LE GRAPHIQUE 1"), application(11)],
      },
      {
        key: "1-6",
        ordinal: "Sixième",
        type: LECON,
        title: "REPRÉSENTER LA GRAPHIQUE 2",
        printedHead: "LEÇON 6 : REPRÉSENTER LA GRAPHIQUE 2",
        bookFrom: 12,
        concepts: [
          lessonHead(12, "LEÇON 6 : REPRÉSENTER LA GRAPHIQUE 2"),
          application(12),
          reflechis(13),
        ],
      },
      {
        key: "1-7",
        ordinal: "Septième",
        type: LECON,
        title: "REPRÉSENTER LE GRAPHIQUE 10",
        printedHead: "LEÇON 7 : REPRÉSENTER LE GRAPHIQUE 10",
        bookFrom: 14,
        concepts: [lessonHead(14, "LEÇON 7 : REPRÉSENTER LE GRAPHIQUE 10"), application(14)],
      },
      {
        key: "1-8",
        ordinal: "Huitième",
        type: LECON,
        title: "LE GRAPHIQUE EN COLONNES",
        printedHead: "LEÇON 8 : LE GRAPHIQUE EN COLONNES",
        bookFrom: 15,
        concepts: [lessonHead(15, "LEÇON 8 : LE GRAPHIQUE EN COLONNES"), application(15)],
      },
      {
        key: "1-9",
        ordinal: "Neuvième",
        type: LECON,
        title: "LE PICTOGRAMME",
        printedHead: "LEÇON 9 : LE PICTOGRAMME",
        bookFrom: 16,
        concepts: [
          lessonHead(16, "LEÇON 9 : LE PICTOGRAMME"),
          application(16),
          reflechis(17),
        ],
      },
      {
        key: "1-10",
        ordinal: "Dixième",
        type: LECON,
        title: "LES ÉLÈMENTS DU PICTOGRAMME",
        printedHead: "LEÇON 10 : LES ÉLÈMENTS DU PICTOGRAMME",
        bookFrom: 18,
        concepts: [lessonHead(18, "LEÇON 10 : LES ÉLÈMENTS DU PICTOGRAMME"), application(18)],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "Deuxième",
    title: "Chapitre 2",
    printedHead: "CHAPITRE 2",
    bookFrom: 19,
    bookTo: 29,
    lessons: [
      {
        key: "2-1",
        ordinal: "Première",
        type: LECON,
        title: "ADDITION EN MULTIPLANT",
        printedHead: "LEÇON 1 : ADDITION EN MULTIPLANT",
        bookFrom: 19,
        concepts: [lessonHead(19, "LEÇON 1 : ADDITION EN MULTIPLANT"), application(19)],
      },
      {
        key: "2-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "ADDITION ET SOUSTRACTION PAR COMPTENT",
        printedHead: "LEÇON 2 : ADDITION ET SOUSTRACTION PAR COMPTENT",
        bookFrom: 20,
        concepts: [
          lessonHead(20, "LEÇON 2 : ADDITION ET SOUSTRACTION PAR COMPTENT"),
          application(20),
          reflechis(20),
        ],
      },
      {
        key: "2-3",
        ordinal: "Troisième",
        type: LECON,
        title: "ADDITION OU SOUSTRACTION DE NOMBRE 10",
        printedHead: "LEÇON 3 : ADDITION OU SOUSTRACTION DE NOMBRE 10",
        bookFrom: 21,
        concepts: [lessonHead(21, "LEÇON 3 : ADDITION OU SOUSTRACTION DE NOMBRE 10"), application(21)],
      },
      {
        key: "2-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "ADDITION OU SOUSTRACTION DES DIZAINES",
        printedHead: "LEÇON 4 : ADDITION OU SOUSTRACTION DES DIZAINES",
        bookFrom: 22,
        concepts: [
          lessonHead(22, "LEÇON 4 : ADDITION OU SOUSTRACTION DES DIZAINES"),
          application(22),
          reflechis(23),
        ],
      },
      {
        key: "2-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "PROBLÈMES SUR L'ADDITION",
        printedHead: "LEÇON 5 : PROBLÈMES SUR L'ADDITION",
        bookFrom: 24,
        concepts: [
          lessonHead(24, "LEÇON 5 : PROBLÈMES SUR L'ADDITION"),
          application(24),
          reflechis(24),
        ],
      },
      {
        key: "2-6",
        ordinal: "Sixième",
        type: LECON,
        title: "PROBLÈMES SUR LA SOUSTRACTION",
        printedHead: "LEÇON 6 : PROBLÈMES SUR LA SOUSTRACTION",
        bookFrom: 25,
        concepts: [
          lessonHead(25, "LEÇON 6 : PROBLÈMES SUR LA SOUSTRACTION"),
          application(25),
          reflechis(25),
        ],
      },
      {
        key: "2-7",
        ordinal: "Septième",
        type: LECON,
        title: "APPLICATIONS MENTALES SUR L'ADDITION",
        printedHead: "LEÇON 7 : APPLICATIONS MENTALES SUR L'ADDITION",
        bookFrom: 26,
        concepts: [
          lessonHead(26, "LEÇON 7 : APPLICATIONS MENTALES SUR L'ADDITION"),
          application(26),
          reflechis(26),
        ],
      },
      {
        key: "2-8",
        ordinal: "Huitième",
        type: LECON,
        title: "APPLICATIONS MENTALES SUR LA SOUSTRACTION",
        printedHead: "LEÇON 8 : APPLICATIONS MENTALES SUR LA SOUSTRACTION",
        bookFrom: 27,
        concepts: [
          lessonHead(27, "LEÇON 8 : APPLICATIONS MENTALES SUR LA SOUSTRACTION"),
          application(27),
        ],
      },
      {
        key: "2-9",
        ordinal: "Neuvième",
        type: LECON,
        title: "APPLICATIONS MENTALES SUR L'ADDITION ET LA SOUSTRACTION",
        printedHead: "LEÇON 9 : APPLICATIONS MENTALES SUR L'ADDITION ET LA SOUSTRACTION",
        bookFrom: 28,
        concepts: [
          lessonHead(28, "LEÇON 9 : APPLICATIONS MENTALES SUR L'ADDITION ET LA SOUSTRACTION"),
          application(28),
          reflechis(28),
        ],
      },
      {
        key: "2-10",
        ordinal: "Dixième",
        type: LECON,
        title: "L'ADDITION AVEC L'UTILISATION DU DIAGRAMME 120",
        printedHead: "LEÇON 10 : L'ADDITION AVEC L'UTILISATION DU DIAGRAMME 120",
        bookFrom: 29,
        concepts: [
          lessonHead(29, "LEÇON 10 : L'ADDITION AVEC L'UTILISATION DU DIAGRAMME 120"),
          application(29),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "Troisième",
    title: "Chapitre 3",
    printedHead: "CHAPITRE 3",
    bookFrom: 30,
    bookTo: 40,
    lessons: [
      {
        key: "3-1",
        ordinal: "Première",
        type: LECON,
        title: "LES NOMBRES FORMES DE 3 CHIFFRES",
        printedHead: "LEÇON 1 : LES NOMBRES FORMES DE 3 CHIFFRES",
        bookFrom: 30,
        concepts: [lessonHead(30, "LEÇON 1 : LES NOMBRES FORMES DE 3 CHIFFRES"), application(30)],
      },
      {
        key: "3-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "PLUS DE NOMBRES FORMES DE 3 CHIFFRES",
        printedHead: "LEÇON 2 : PLUS DE NOMBRES FORMES DE 3 CHIFFRES",
        bookFrom: 31,
        concepts: [
          lessonHead(31, "LEÇON 2 : PLUS DE NOMBRES FORMES DE 3 CHIFFRES"),
          application(31),
          reflechis(31),
        ],
      },
      {
        key: "3-3",
        ordinal: "Troisième",
        type: LECON,
        title: "FORME SYMBOLIQUE ET ETENDUE",
        printedHead: "LEÇON 3 : FORME SYMBOLIQUE ET ETENDUE",
        bookFrom: 32,
        concepts: [
          lessonHead(32, "LEÇON 3 : FORME SYMBOLIQUE ET ETENDUE"),
          application(32),
          reflechis(32),
        ],
      },
      {
        key: "3-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "LA FORME VERBALE DES NOMBRES",
        printedHead: "LEÇON 4 : LA FORME VERBALE DES NOMBRES",
        bookFrom: 33,
        concepts: [
          lessonHead(33, "LEÇON 4 : LA FORME VERBALE DES NOMBRES"),
          application(33),
          reflechis(33, "réfélchis:"),
        ],
      },
      {
        key: "3-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "PLUS DE FORMES VERBALE DES NOMBRES",
        printedHead: "LEÇON 5 : PLUS DE FORMES VERBALE DES NOMBRES",
        bookFrom: 34,
        concepts: [lessonHead(34, "LEÇON 5 : PLUS DE FORMES VERBALE DES NOMBRES"), application(34)],
      },
      {
        key: "3-6",
        ordinal: "Sixième",
        type: LECON,
        title: "L' ÉCRITURE DES NOMBRES AVEC DES FORMES DIFFÉRENTES",
        printedHead: "LEÇON 6 : L' ÉCRITURE DES NOMBRES AVEC DES FORMES DIFFÉRENTES",
        bookFrom: 35,
        concepts: [
          lessonHead(35, "LEÇON 6 : L' ÉCRITURE DES NOMBRES AVEC DES FORMES DIFFÉRENTES"),
          reflechis(35),
        ],
      },
      {
        key: "3-7",
        ordinal: "Septième",
        type: LECON,
        title: "LA COMPARAISON DES NOMBRES",
        printedHead: "LEÇON 7 : LA COMPARAISON DES NOMBRES",
        bookFrom: 36,
        concepts: [lessonHead(36, "LEÇON 7 : LA COMPARAISON DES NOMBRES"), application(36)],
      },
      {
        key: "3-8",
        ordinal: "Huitième",
        type: LECON,
        title: "PLUS DE COMPARAISON DES NOMBRES",
        printedHead: "LEÇON 8 : PLUS DE COMPARAISON DES NOMBRES",
        bookFrom: 37,
        concepts: [
          lessonHead(37, "LEÇON 8 : PLUS DE COMPARAISON DES NOMBRES"),
          application(37),
          reflechis(38),
        ],
      },
      {
        key: "3-9",
        ordinal: "Neuvième",
        type: LECON,
        title: "L'ordre des nombres",
        printedHead: "Leçon 9 : L'ordre des nombres",
        bookFrom: 39,
        concepts: [lessonHead(39, "Leçon 9 : L'ordre des nombres"), application(39)],
      },
      {
        key: "3-10",
        ordinal: "Dixième",
        type: LECON,
        title: "PLUS DE L'ORDRE DES NOMBRES",
        printedHead: "LEÇON 10 : PLUS DE L'ORDRE DES NOMBRES",
        bookFrom: 40,
        concepts: [
          lessonHead(40, "LEÇON 10 : PLUS DE L'ORDRE DES NOMBRES"),
          application(40),
          reflechis(40),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "Quatrième",
    title: "Chapitre 4",
    printedHead: "CHAPITRE 4",
    bookFrom: 41,
    bookTo: 58,
    lessons: [
      {
        key: "4-1",
        ordinal: "Première",
        type: LECON,
        title: "LA PROPRIÉTÉ DE COMMUTATIVITÉ DANS L'ADDITION",
        printedHead: "LEÇON 1 : LA PROPRIÉTÉ DE COMMUTATIVITÉ DANS L'ADDITION",
        bookFrom: 41,
        concepts: [
          lessonHead(41, "LEÇON 1 : LA PROPRIÉTÉ DE COMMUTATIVITÉ DANS L'ADDITION"),
          application(41),
        ],
      },
      {
        key: "4-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "PLUS D'APPLICATIONS MENTALES SUR L'ADDITION ET LA SOUSTRACTION",
        printedHead: "LEÇON 2 : PLUS D'APPLICATIONS MENTALES SUR L'ADDITION ET LA SOUSTRACTION",
        bookFrom: 42,
        concepts: [
          lessonHead(42, "LEÇON 2 : PLUS D'APPLICATIONS MENTALES SUR L'ADDITION ET LA SOUSTRACTION"),
          application(42, "APPLICATION (1)"),
          application(43, "APPLICATION (2)"),
          reflechis(43),
        ],
      },
      {
        key: "4-3",
        ordinal: "Troisième",
        type: LECON,
        title: "DÉCOMPOSER LES NOMBRES AUX UNITÉS ET DIZAINES",
        printedHead: "LEÇON 3 : DÉCOMPOSER LES NOMBRES AUX UNITÉS ET DIZAINES",
        bookFrom: 44,
        concepts: [
          lessonHead(44, "LEÇON 3 : DÉCOMPOSER LES NOMBRES AUX UNITÉS ET DIZAINES"),
          application(44),
        ],
      },
      {
        key: "4-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "L'ADDITION SANS RÉPÉTER",
        printedHead: "LEÇON 4 : L'ADDITION SANS RÉPÉTER",
        bookFrom: 46,
        concepts: [
          lessonHead(46, "LEÇON 4 : L'ADDITION SANS RÉPÉTER"),
          application(46),
          reflechis(48),
        ],
      },
      {
        key: "4-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "LA SOUSTRACTION SANS RÉPÉTER L'ADDITION",
        printedHead: "LEÇON 5 : LA SOUSTRACTION SANS RÉPÉTER L'ADDITION",
        bookFrom: 49,
        concepts: [
          lessonHead(49, "LEÇON 5 : LA SOUSTRACTION SANS RÉPÉTER L'ADDITION"),
          application(49),
          reflechis(51),
        ],
      },
      {
        key: "4-6",
        ordinal: "Sixième",
        type: LECON,
        title: "ESTIMER LES RÉSULTATS DE L'ADDITION ET LA SOUSTRACTION",
        printedHead: "LEÇON 6 : ESTIMER LES RÉSULTATS DE L'ADDITION ET LA SOUSTRACTION",
        bookFrom: 52,
        concepts: [
          lessonHead(52, "LEÇON 6 : ESTIMER LES RÉSULTATS DE L'ADDITION ET LA SOUSTRACTION"),
          application(52),
        ],
      },
      {
        key: "4-7",
        ordinal: "Septième",
        type: LECON,
        title: "LA COMPARAISON ENTRE LA SOMME ET L'ESTIMATION",
        printedHead: "LEÇON 7 : LA COMPARAISON ENTRE LA SOMME ET L'ESTIMATION",
        bookFrom: 53,
        concepts: [
          lessonHead(53, "LEÇON 7 : LA COMPARAISON ENTRE LA SOMME ET L'ESTIMATION"),
          application(53),
        ],
      },
      {
        key: "4-8",
        ordinal: "Huitième",
        type: LECON,
        title: "L'ADDITION PAR REGROUPEMENT LES UNITÉS",
        printedHead: "LEÇON 8 : L'ADDITION PAR REGROUPEMENT LES UNITÉS",
        bookFrom: 54,
        concepts: [
          lessonHead(54, "LEÇON 8 : L'ADDITION PAR REGROUPEMENT LES UNITÉS"),
          application(54),
          reflechis(55),
        ],
      },
      {
        key: "4-9",
        ordinal: "Neuvième",
        type: LECON,
        title: "PLUS D'ADDITION PAR REGROUPEMENT LES UNITÉS",
        printedHead: "LEÇON 9 : PLUS D'ADDITION PAR REGROUPEMENT LES UNITÉS",
        bookFrom: 56,
        concepts: [
          lessonHead(56, "LEÇON 9 : PLUS D'ADDITION PAR REGROUPEMENT LES UNITÉS"),
          application(56),
        ],
      },
      {
        key: "4-10",
        ordinal: "Dixième",
        type: LECON,
        title: "L'ADDITION DE PLUS DE 2 NOMBRES PAR REGROUPEMENT LES UNITÉS",
        printedHead: "LEÇON 10 : L'ADDITION DE PLUS DE 2 NOMBRES PAR REGROUPEMENT LES UNITÉS",
        bookFrom: 57,
        concepts: [
          lessonHead(57, "LEÇON 10 : L'ADDITION DE PLUS DE 2 NOMBRES PAR REGROUPEMENT LES UNITÉS"),
        ],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "Cinquième",
    title: "Chapitre 5",
    printedHead: "CHAPITRE 5",
    bookFrom: 59,
    bookTo: 72,
    lessons: [
      {
        key: "5-1",
        ordinal: "Première",
        type: LECON,
        title: "LES PROPRIÉTÉS DES FIGURES GÉOMÉTRIQUES",
        printedHead: "LEÇON 1 : LES PROPRIÉTÉS DES FIGURES GÉOMÉTRIQUES",
        bookFrom: 59,
        concepts: [
          lessonHead(59, "LEÇON 1 : LES PROPRIÉTÉS DES FIGURES GÉOMÉTRIQUES"),
          application(59),
        ],
      },
      {
        key: "5-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "LE CLASSEMENT DES FIGURES GÉOMÉTRIQUES",
        printedHead: "LEÇON 2 : LE CLASSEMENT DES FIGURES GÉOMÉTRIQUES",
        bookFrom: 60,
        concepts: [
          lessonHead(60, "LEÇON 2 : LE CLASSEMENT DES FIGURES GÉOMÉTRIQUES"),
          application(60),
          reflechis(60),
        ],
      },
      {
        key: "5-3",
        ordinal: "Troisième",
        type: LECON,
        title: "LE DESSIN DES FIGURES GÉOMÉTRIQUES",
        printedHead: "LEÇON 3 : LE DESSIN DES FIGURES GÉOMÉTRIQUES",
        bookFrom: 61,
        concepts: [
          lessonHead(61, "LEÇON 3 : LE DESSIN DES FIGURES GÉOMÉTRIQUES"),
          application(61),
          reflechis(62),
        ],
      },
      {
        key: "5-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "LA FORMATION DES IMAGES AVEC L’UTILISATION DES FIGURES GÉOMÉTRIQUES :",
        printedHead: "LEÇON 4: LA FORMATION DES IMAGES AVEC L’UTILISATION DES FIGURES GÉOMÉTRIQUES :",
        bookFrom: 63,
        concepts: [
          lessonHead(63, "LEÇON 4: LA FORMATION DES IMAGES AVEC L’UTILISATION DES FIGURES GÉOMÉTRIQUES :"),
          application(63),
        ],
      },
      {
        key: "5-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "LA MESURE DES LONGUEURS PAR CENTIMETÈRS",
        printedHead: "LEÇON 5 : LA MESURE DES LONGUEURS PAR CENTIMETÈRS",
        bookFrom: 64,
        concepts: [
          lessonHead(64, "LEÇON 5 : LA MESURE DES LONGUEURS PAR CENTIMETÈRS"),
          application(64),
        ],
      },
      {
        key: "5-6",
        ordinal: "Sixième",
        type: LECON,
        title: "L'ESTIMATION DES LONGUEURS",
        printedHead: "LEÇON 6 : L'ESTIMATION DES LONGUEURS",
        bookFrom: 66,
        concepts: [
          lessonHead(66, "LEÇON 6 : L'ESTIMATION DES LONGUEURS"),
          application(66),
          reflechis(66),
        ],
      },
      {
        key: "5-7",
        ordinal: "Septième",
        type: LECON,
        title: "LA MESURE DU LONGUREUR DE L'ARÊTE DE LA FIGURE GÉOMÉTRIQUE",
        printedHead: "LEÇON 7 : LA MESURE DU LONGUREUR DE L'ARÊTE DE LA FIGURE GÉOMÉTRIQUE",
        bookFrom: 67,
        concepts: [
          lessonHead(67, "LEÇON 7 : LA MESURE DU LONGUREUR DE L'ARÊTE DE LA FIGURE GÉOMÉTRIQUE"),
        ],
      },
      {
        key: "5-8",
        ordinal: "Huitième",
        type: LECON,
        title: "LES CARACTÉRISTIQUES DES FIGURES À 3 DIMENSIONS",
        printedHead: "LEÇON 8 : LES CARACTÉRISTIQUES DES FIGURES À 3 DIMENSIONS",
        bookFrom: 68,
        concepts: [
          lessonHead(68, "LEÇON 8 : LES CARACTÉRISTIQUES DES FIGURES À 3 DIMENSIONS"),
          application(68),
          reflechis(68),
        ],
      },
      {
        key: "5-9",
        ordinal: "Neuvième",
        type: LECON,
        title: "CLASSIFICATION LES FIGURES QUI ONT 3 DIMENSIONS.",
        printedHead: "LEÇON 9 : CLASSIFICATION LES FIGURES QUI ONT 3 DIMENSIONS.",
        bookFrom: 69,
        concepts: [
          lessonHead(69, "LEÇON 9 : CLASSIFICATION LES FIGURES QUI ONT 3 DIMENSIONS."),
          application(69),
          reflechis(71),
        ],
      },
      {
        key: "5-10",
        ordinal: "Dixième",
        type: LECON,
        title: "LA FORMATION DES FIGURES À 3 DIMENSIONS",
        printedHead: "LEÇON 10:LA FORMATION DES FIGURES À 3 DIMENSIONS",
        bookFrom: 72,
        concepts: [
          lessonHead(72, "LEÇON 10:LA FORMATION DES FIGURES À 3 DIMENSIONS"),
          application(72),
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "chapter",
    ordinal: "Sixième",
    title: "Chapitre 6",
    printedHead: "CHAPITRE 6",
    bookFrom: 73,
    bookTo: 91,
    lessons: [
      {
        key: "6-1",
        ordinal: "Première",
        type: LECON,
        title: "MESURER LA MASSE",
        printedHead: "LEÇON 1 : MESURER LA MASSE",
        bookFrom: 73,
        concepts: [
          lessonHead(73, "LEÇON 1 : MESURER LA MASSE"),
          application(73),
          reflechis(74),
        ],
      },
      {
        key: "6-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "UNITÉ DE MESURE DE LA MASSE",
        printedHead: "LEÇON 2:UNITÉ DE MESURE DE LA MASSE",
        bookFrom: 75,
        concepts: [lessonHead(75, "LEÇON 2:UNITÉ DE MESURE DE LA MASSE"), application(75)],
      },
      {
        key: "6-3",
        ordinal: "Troisième",
        type: LECON,
        title: "DES APPLICATIONS POUR MESURER LA MASSE",
        printedHead: "LEÇON 3 : DES APPLICATIONS POUR MESURER LA MASSE",
        bookFrom: 76,
        concepts: [
          lessonHead(76, "LEÇON 3 : DES APPLICATIONS POUR MESURER LA MASSE"),
          application(76),
          reflechis(78),
        ],
      },
      {
        key: "6-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "PLUS D'APPLICATION POUR MESURER LA MASSE",
        printedHead: "LEÇON 4 : PLUS D'APPLICATION POUR MESURER LA MASSE",
        bookFrom: 79,
        concepts: [
          lessonHead(79, "LEÇON 4 : PLUS D'APPLICATION POUR MESURER LA MASSE"),
          application(79),
        ],
      },
      {
        key: "6-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "LE TEMPS ( LE MATIN LE EN SOIR )",
        printedHead: "LEÇON 5 : LE TEMPS ( LE MATIN LE EN SOIR )",
        bookFrom: 82,
        concepts: [
          lessonHead(82, "LEÇON 5 : LE TEMPS ( LE MATIN LE EN SOIR )"),
          reflechis(83),
        ],
      },
      {
        key: "6-6",
        ordinal: "Sixième",
        type: LECON,
        title: "CRÉER UNE HORLOGE",
        printedHead: "LEÇON 6:CRÉER UNE HORLOGE",
        bookFrom: 84,
        concepts: [lessonHead(84, "LEÇON 6:CRÉER UNE HORLOGE"), application(84)],
      },
      {
        key: "6-7",
        ordinal: "Septième",
        type: LECON,
        title: "LE TEMPS AVEC UNE DEMI-HEURE",
        printedHead: "LEÇON 7: LE TEMPS AVEC UNE DEMI-HEURE",
        bookFrom: 85,
        concepts: [
          lessonHead(85, "LEÇON 7: LE TEMPS AVEC UNE DEMI-HEURE"),
          reflechis(85),
        ],
      },
      {
        key: "6-8",
        ordinal: "Huitième",
        type: LECON,
        title: "LES APPLICATIONS SUR L'HEURE",
        printedHead: "LEÇON 8 : LES APPLICATIONS SUR L'HEURE",
        bookFrom: 86,
        concepts: [
          lessonHead(86, "LEÇON 8 : LES APPLICATIONS SUR L'HEURE"),
          application(86),
        ],
      },
      {
        key: "6-9",
        ordinal: "Neuvième",
        type: LECON,
        title: "LE TEMPS PAR MINUTES",
        printedHead: "LEÇON 9 : LE TEMPS PAR MINUTES",
        bookFrom: 87,
        concepts: [
          lessonHead(87, "LEÇON 9 : LE TEMPS PAR MINUTES"),
          application(87),
          reflechis(89),
        ],
      },
      {
        key: "6-10",
        ordinal: "Dixième",
        type: LECON,
        title: "PLUS D'APPLICATION SUR LE TEMPS",
        printedHead: "LEÇON 10 : PLUS D'APPLICATION SUR LE TEMPS",
        bookFrom: 90,
        concepts: [
          lessonHead(90, "LEÇON 10 : PLUS D'APPLICATION SUR LE TEMPS"),
          application(90),
          reflechis(91),
        ],
      },
    ],
  },
];

/**
 * The book-page span a lesson owns: from the chapter opener (its first lesson)
 * or its own head page, down to the page before the next lesson starts,
 * bounded by the chapter. The Réfléchis-only pages (7, 13, 17, 38, 43, 48)
 * and the practice continuations therefore ride with the lesson that started
 * them, so the ranges tile [5, 91] exactly.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_MATH_FR_G2_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_FR_G2_T1_UNITS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This term has
 * no appendix: every page of the term belongs to a chapter. Kept as a function
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
  "math-fr-g2-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (Only scans 2, 92 and 94 — blank versos outside the term — need it,
 * but the guard is kept so the loader shares one shape across the books.)
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
  return `### Page ${book}\n${text}`;
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
 * The document a lesson grounds the tutor in: its own page range, in order,
 * followed by any appendix pages it points to (none in this book).
 */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(sectionIndex, lessonIndex);
  const lesson = EGYPT_MATH_FR_G2_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(from, to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/**
 * Folds text for comparison: lowercases and removes every non-letter/digit, so
 * punctuation, apostrophes, spacing and line breaks can never break a match
 * (this is what lets the line-split heads on books 42, 57 and 63 match their
 * single-line transcription).
 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring case and OCR spacing/punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/** Numerals a footer line carries once the ordinal and the unit word are gone. */
function footerNumbers(line: string): number[] {
  const clean = line
    .replace(/\$[^$]*\$/g, " ")
    .replace(/2\s*ème/gi, " ")
    .replace(/primaire/gi, " ");
  const found = clean.match(/\d+/g);
  if (!found) return [];
  return [...new Set(found.map(Number))].filter((n) => n > 0);
}

/**
 * Whether a line is a fragment of a split footer («2», «ème», «Primaire» or
 * a maths-garbled footer segment) rather than body content.
 */
function isFooterFragment(line: string): boolean {
  const stripped = line
    .replace(/\$[^$]*\$/g, " ")
    .replace(/[^\p{L}\p{N}]/gu, " ")
    .toLowerCase();
  const tokens = stripped.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every((t) => t === "2" || t === "ème" || t === "eme" || t === "primaire");
}

/**
 * Page-number candidates a content page prints. Ordinary pages print the folio
 * on their last line («N 2ème Primaire» or «2ème Primaire N»); three pages
 * split the footer across lines (book 8 prints a bare «8» above «2 ème
 * Primaire», book 58 a bare «58» above a maths-garbled footer, book 66 a bare
 * «66» above «2»/«ème»/«Primaire»), so when the last line yields no number the
 * walk continues upward through footer-fragment lines to the bare numeral —
 * bounded to five lines so exercise counts and chart numbers stay out of
 * reach. Only the footer is ever read, so body numbers can never be mistaken
 * for a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const direct = footerNumbers(lines[lines.length - 1]!);
  if (direct.length > 0) return direct;
  let i = lines.length - 1;
  let steps = 0;
  while (i >= 0 && steps < 5 && isFooterFragment(lines[i]!)) {
    i -= 1;
    steps += 1;
  }
  if (i >= 0 && /^\d+$/.test(lines[i]!)) return [Number(lines[i])];
  return [];
}

/**
 * The book number a content page prints in its footer, or null. Every content
 * page carries a folio that is exactly its own number, which is what fixes the
 * offset; the pages named in `FOLIO_LESS_ANCHORS` carry no parseable folio and
 * are handled there instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * Folios whose OCR printed a different, still parseable number. Every folio
 * the checker reads matches its page number exactly in this book, so the map
 * is empty and the folio check stays exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * Term pages that print no parseable folio in the text layer, each with the
 * anchor the check accepts in place of a page number. This book has none: all
 * 87 term pages print their folio, including the three split-footer pages
 * (books 8, 58, 66) that `footerCandidates` reads from the bare numeral above
 * the split footer.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {};

/** Every band kind this book prints. */
const KNOWN_KINDS = new Set([LECON, APPLICATION, REFLECHIS]);

/**
 * Table invariants: lesson keys are unique and follow (chapter-lesson), every
 * range sits inside its section, concept kinds are known, concept pages rise
 * inside their lesson, the sections tile the term without gaps or overlaps, and
 * the first/last sections hit the book's own bounds. A content mistake here
 * would quietly ground the tutor on the wrong pages, so it fails loudly
 * instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_FR_G2_T1_UNITS;
  const keys = new Set<string>();

  units.forEach((unit, ui) => {
    if (!unit.title.trim()) problems.push(`Section ${unit.key}: no title`);
    if (!unit.printedHead.trim()) problems.push(`Section ${unit.key}: no printed head`);
    if (unit.lessons.length === 0) problems.push(`Section ${unit.title}: no lessons`);

    unit.lessons.forEach((lesson, li) => {
      if (keys.has(lesson.key)) problems.push(`Duplicate lesson key: "${lesson.key}"`);
      keys.add(lesson.key);
      const expectedKey = `${unit.key}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`Section ${unit.key} lesson ${li + 1}: key "${lesson.key}" instead of "${expectedKey}"`);
      }
      if (!lesson.title.trim()) problems.push(`Lesson ${lesson.key}: no title`);
      if (!lesson.printedHead.trim()) problems.push(`Lesson ${lesson.key}: no printed head`);
      if (lesson.concepts.length === 0) problems.push(`Lesson ${lesson.key}: no activities`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`Lesson ${lesson.key}: type "${lesson.type}" does not match first activity`);
      }

      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > unit.bookTo) {
        problems.push(
          `Lesson ${lesson.key}: start ${lesson.bookFrom} outside section range ${unit.bookFrom}–${unit.bookTo}`,
        );
      }

      lesson.concepts.forEach((c, ci) => {
        if (!c.title.trim()) problems.push(`Lesson ${lesson.key} activity ${ci + 1}: no title`);
        if (!KNOWN_KINDS.has(c.kind)) {
          problems.push(`Lesson ${lesson.key} activity ${ci + 1}: unknown kind "${c.kind}"`);
        }
        if (c.bookFrom < unit.bookFrom || c.bookFrom > unit.bookTo) {
          problems.push(`Lesson ${lesson.key} activity ${ci + 1}: page ${c.bookFrom} outside section`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && c.bookFrom < prev.bookFrom) {
          problems.push(`Lesson ${lesson.key}: activity pages decrease (${prev.bookFrom} then ${c.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`Lesson ${lesson.key}: inverted page range (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`Lesson ${lesson.key}: range ${from}–${to} outside section ${unit.bookFrom}–${unit.bookTo}`);
      }
      const last = lesson.concepts.at(-1)!;
      if (last.bookFrom < from || last.bookFrom > to) {
        problems.push(`Lesson ${lesson.key}: last activity ${last.bookFrom} outside range ${from}–${to}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`Lesson ${lesson.key} overlaps ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`Lesson ${lesson.key}: first lesson must start at section head ${unit.bookFrom}, found ${from}`);
      }
    });

    const nextUnit = units[ui + 1];
    if (nextUnit && unit.bookTo >= nextUnit.bookFrom) {
      problems.push(`Section ${unit.title} overlaps ${nextUnit.title}`);
    } else if (nextUnit && unit.bookTo !== nextUnit.bookFrom - 1) {
      problems.push(`Page gap between ${unit.title} and ${nextUnit.title}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`);
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_MATH_FR_G2_T1_BOOK_START) {
    problems.push(`First section must start at page ${EGYPT_MATH_FR_G2_T1_BOOK_START}, found ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_FR_G2_T1_BOOK_END) {
    problems.push(`Last section must end at page ${EGYPT_MATH_FR_G2_T1_BOOK_END}, found ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from
 *     its printed folio (allowing the measured OCR misreads), or, on pages
 *     named in `FOLIO_LESS_ANCHORS`, from the anchor the page itself prints
 *     (this book needs none). The pages in `MISSING_SCANS` carry no text layer
 *     at all and are skipped silently;
 *  2. every chapter opener prints the chapter head and every lesson's first page
 *     prints that lesson's head;
 *  3. every lesson's title and every band's head is printed on the pages the
 *     lesson owns (the band on its own page);
 *  4. every printed page in [5, 91] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR'd
 *     page of the term, i.e. `_BOOK_END - _BOOK_START + 1` minus
 *     `MISSING_SCANS`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_MATH_FR_G2_T1_UNITS;
  const missing = new Set<number>(MISSING_SCANS);

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_FR_G2_T1_BOOK_START || book > EGYPT_MATH_FR_G2_T1_BOOK_END) continue;
    if (missing.has(book)) continue;
    const text = loadBookPage(book);
    pagesChecked += 1;
    if (!text) {
      problems.push(`Book page ${book}: no OCR text`);
      continue;
    }
    printedPages.add(book);

    const anchor = FOLIO_LESS_ANCHORS[book];
    if (anchor !== undefined) {
      if (!normalize(text).includes(normalize(anchor))) {
        problems.push(`Book page ${book}: no printed number and missing anchor "${anchor}"`);
      }
    } else {
      const footer = printedFooter(book);
      if (footer === null) {
        problems.push(`Book page ${book}: no printed number`);
      } else if (footer !== book && FOOTER_OCR_MISREADS[book] !== footer) {
        problems.push(`Book page ${book}: printed number ${footer} does not match`);
      }
    }
  }

  const expectedPages =
    EGYPT_MATH_FR_G2_T1_BOOK_END - EGYPT_MATH_FR_G2_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `Book fabric: ${printedPages.size} pages read between ${EGYPT_MATH_FR_G2_T1_BOOK_START} and ${EGYPT_MATH_FR_G2_T1_BOOK_END}, expected ${expectedPages}`,
    );
  }

  // 2 + 3a. every chapter opener prints the chapter head, every lesson's first
  // page its head, and every lesson's title is printed somewhere in the pages
  // it owns.
  units.forEach((unit, ui) => {
    if (!pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`Section ${unit.title}: opener page ${unit.bookFrom} does not print "${unit.printedHead}"`);
    }

    unit.lessons.forEach((lesson, li) => {
      if (!pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`Lesson ${lesson.key}: first page ${lesson.bookFrom} does not print "${lesson.printedHead}"`);
      }
      const { from, to } = lessonBookRange(ui, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      if (!titlePrinted) {
        problems.push(`Lesson ${lesson.key}: title "${lesson.title}" not printed in range ${from}–${to}`);
      }
    });
  });

  // 3b. every band's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (!pagePrints(c.bookFrom, c.title)) {
          problems.push(`Lesson ${lesson.key}: activity page ${c.bookFrom} does not print "${c.title}"`);
        }
      });
    });
  });

  // 4. every printed content page is owned by exactly one lesson.
  const owner = new Map<number, string>();
  for (const { key, from, to } of allLessonRanges()) {
    for (let p = from; p <= to; p++) {
      const prev = owner.get(p);
      if (prev) problems.push(`Page ${p} owned by two lessons: ${prev} and ${key}`);
      owner.set(p, key);
    }
  }
  for (let p = EGYPT_MATH_FR_G2_T1_BOOK_START; p <= EGYPT_MATH_FR_G2_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`Page ${p} owned by no lesson`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
