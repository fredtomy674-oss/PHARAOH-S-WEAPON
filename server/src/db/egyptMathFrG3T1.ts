// Primary 3 (3ème Primaire) Mathematics, French-medium, first term,
// Ministry of Education and Technical Education 2025/2026 edition (the cover
// imprint prints «2025 - 2026»).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g3-math-fr`, subject `math-fr` (name "Mathématiques"), lesson prefix
// `l-g3-math-fr-`, grade `grade-3` (name "Primary 3").
//
// The curriculum tree for the Egypt `eg-g3-math-fr` curriculum is rebuilt from
// the Ministry textbook `MATHÉMATIQUES — 3ème primaire — 1er semestre`
// (112 scanned pages). This module is the single source of truth for its
// structure: the six printed chapitres of the first term, every numbered
// LEÇON inside them (47 in all, exactly as the book's own contents on scan 4
// lists them), and, for every lesson, the book's own printed heads — the
// lesson head plus the activity-flow bands the lesson prints (LIEN LOGIQUE /
// APPLICATION / LE DÉFI / RÉFLÉCHIS, with the one-off bands CLÉ, PRACTIQUE:,
// PRATIQUE:, the two EXERCICE heads and the VÉRIFICATION head) — verbatim
// and with the printed page they start on. The self-checks at the bottom
// prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every content page prints its own folio in its footer («N 3ème PRIMAIRE»
// or «3ème PRIMAIRE N»), so `BOOK_TO_PDF_OFFSET` is fixed by the scans and
// quoted here: scan 5 prints «3ème PRIMAIRE 1» (book 1, the Leçon 1-1
// opener), scan 14 prints «10 3ème PRIMAIRE» (book 10, the Leçon 2-1
// opener), scan 47 prints «3ème PRIMAIRE 43» (book 43, the Leçon 4-1
// opener), scan 86 prints «82 3ème PRIMAIRE» (book 82, the Leçon 6-1
// opener) and scan 110 prints «106 3ème PRIMAIRE» (book 106, the term's
// last page). The book's own contents (scan 4) independently confirms the
// lesson starts: every «Leçon» sits exactly where the contents says it
// does, with the single one-page divergence noted below (Leçon 5-8).
//
// TERM = THE NUMBERED PAGES (books 1–106)
// Scan pages 1–4 are before the term: the cover (1), a blank verso (2, the
// OCR answers «لا يوجد نص في الصورة المرفقة»), the «PREFACE» (3) and the
// printed contents (4, folio «IV»). Scan pages 111–112 are after the term:
// a blank verso (111) and the «Révisé par» credits page (112). The term runs
// from the Leçon 1-1 opener (book 1 = scan 5) to the closing RÉFLÉCHIS page
// of Leçon 6-9 (book 106 = scan 110):
// `EGYPT_MATH_FR_G3_T1_BOOK_START` / `_BOOK_END` are exactly those two
// pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` is therefore 106 − 1 + 1 = 106 (no scan of
// the term is missing).
//
// THE FOLIO CHECK READS THE FOOTER'S LAST LINE, PLUS SPLIT FOOTERS
// Ordinary pages print the folio on their last line («N 3ème PRIMAIRE»,
// «3ème PRIMAIRE N»); the ordinal «3ème» is stripped before reading, so the
// 3 of «3ème» can never be mistaken for a folio, and body numbers (chart
// scales, ruler marks, clock faces, exercise counts) sit above the last line
// and are never read. Four pages split the footer across lines (books 15,
// 79, 95 and 99 print «3ème PRIMAIRE» with the bare folio on the next
// line) and book 84 prints a maths-garbled footer («84
// $3^{\text{\`{e}me}}$ PRIMAIRE», the maths segment is deleted before
// reading); `footerCandidates` therefore reads the last line first and, only
// when it yields no number, walks upward through footer-fragment lines to
// the bare numeral above — bounded to five lines so body numbers stay out of
// reach. Every folio so read equals its own book number, so
// `FOOTER_OCR_MISREADS` is empty and no page needs a `FOLIO_LESS_ANCHORS`
// entry.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED BANDS
// Every numbered leçon contributes its head line (number + title, exactly as
// the opener prints it) plus the activity-flow bands it prints, in page
// order: «LIEN LOGIQUE» where the lesson opens with one, «APPLICATION» on
// the lesson's work page (folding the «(suite)» continuations and the
// «1ÈRE PARTIE» / «1ère Partie» part labels, which print no new head of
// their own), «LE DÉFI» where the lesson prints its challenge box and
// «RÉFLÉCHIS» where it prints its reflection box. Five lessons print no
// «APPLICATION» at all (3-5, 3-6, 5-3, 6-3, 6-4 print their work under other
// bands — verified against the full text layer), so they carry only their
// lesson head plus the bands they do print. The one-off printed heads are
// kept verbatim on their own page: «CLÉ» (Leçon 1-3, the dot-plot key),
// «PRACTIQUE:» (Leçon 3-1, the book's own English spelling),
// «Exercice collectif» and «EXERICE EN BINÔME» (Leçon 3-6, the book's own
// missing-C spelling), «VÉRIFICATION AVEC UTILISATION D'UNE NOUVELLE
// STRATÉGIE» (Leçon 6-5) and «PRATIQUE:» (Leçon 6-7). The inline
// «GUIDAGE:»/«Guidage:» instructions, «Exemple» labels, «1ère/2ème Partie»
// and «1er–4ème Groupe» part labels are exercise furniture and contribute no
// concept. Nothing is invented: every concept title below is a string the
// book itself prints on the page its `bookFrom` names.
//
// TEXT-LAYER QUIRKS RECORDED, NOT WORKED AROUND
// `normalize` lowercases and drops every non-letter/digit, so spacing,
// colons, apostrophes and line breaks can never break a match (this is what
// lets the line-split head of Leçon 6-4 match its single-line
// transcription). Stored byte-verbatim are the book's own forms: «LEÇON1:»
// (book 10 prints no space), «LEÇON 5 :»/«LEÇON 7 :»/«LEÇON 1 :» (books 7,
// 22, 82 space the colon), «La propriété DU COMMUTATIVE DE LA
// MULTIPLICATION» (book 22 prints the title in mixed case), «DES PROBLÈME»
// (book 25 prints the singular), «LES FORMES DIFFERENTS» (book 16 prints no
// accent), «LES PROPRIETES» (book 45 prints no accent), «L' AIRE» (book 53
// spaces its apostrophe), «LA MULTICATION» (book 41 drops the LI),
// «LES MODÉLES» (book 82 prints one L), «LES STATÉGIES» (book 85 drops the
// R), «VARIES» (book 68 prints no accent), «DIFFÉRENTES PÉRIMÈTRES» (book
// 71, the book's own agreement), «APPICATION» (books 57, 61 and 96 drop the
// L) and «EXERICE EN BINÔME» (book 33 drops the C).
//
// ONE GENUINE CONTENTS DIVERGENCE (the spec follows the printed page)
// Leçon 5-8: the contents lists «La Multiplication Par les multiples de 10»
// at p. 78, but book 78 continues Leçon 5-7 («2ème Partie») and the head is
// printed on book 79 — the spec follows the page that prints the head. The
// contents also prints «Les Multiptiples de Deux Nombres 2et 3» (p. 28) for
// a head the page prints as «LES MULTIPLES DE DEUX NOMBRES 2 ET 3».
//
// THE CHAPTER OPENER RIDES WITH THE FIRST LESSON
// Each chapter's first lesson starts on the chapter's own opener page (which
// prints «Chapitre N» and then the lesson head), so `lessonBookRange` starts
// a chapter's first lesson at the section head, exactly as the other Egyptian
// Mathematics specs do. The book prints no appendix: every page of the term
// belongs to exactly one lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.106 = scan p.110). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the Leçon 1-1 opener (scan 5). */
export const EGYPT_MATH_FR_G3_T1_BOOK_START = 1;

/** Last printed page of the term — the closing RÉFLÉCHIS of Leçon 6-9 (scan 110). */
export const EGYPT_MATH_FR_G3_T1_BOOK_END = 106;

/** The scanned pages before the term: cover, blank verso, PREFACE, contents. */
export const EGYPT_MATH_FR_G3_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/** The scanned pages after the term: blank verso, Révisé-par credits page. */
export const EGYPT_MATH_FR_G3_T1_BACK_MATTER = { from: 111, to: 112 } as const;

/**
 * The term pages the OCR never produced, as scan pages. All 112 scans are
 * present and every one of the 106 term pages carries text, so there are
 * none; the constant is kept so this module shares the shape of the other
 * Egyptian specs (and so the checker's expected page count subtracts it).
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed band of a lesson — becomes one concept in the app tree. */
export interface MathFrG3T1Concept {
  /** Printed book page where this band starts. */
  bookFrom: number;
  /** The printed band kind: "Leçon", "Lien", "Application", "Défi", "Réfléchis", "Clé", "Pratique", "Exercice" or "Vérification". */
  kind: string;
  /** The printed band head, verbatim. */
  title: string;
}

/** One printed lesson (one numbered leçon of a chapter). */
export interface MathFrG3T1Lesson {
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
  concepts: MathFrG3T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a chapter — so no lesson below uses it; the
   * field is kept so this module shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed chapter of the book — one of the six chapitres of the first term. */
export interface MathFrG3T1Section {
  /** This book's sections are its chapitres. */
  kind: "chapter";
  /** Internal key: "1"…"6", in book order. */
  key: string;
  /** French ordinal of the chapter as the app prints it, e.g. "Deuxième". */
  ordinal: string;
  /** Full app-facing section title, e.g. "Chapitre 1". */
  title: string;
  /** The chapter head the opener page prints, verbatim, e.g. "Chapitre 1". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next opener). */
  bookTo: number;
  lessons: MathFrG3T1Lesson[];
}

const LECON = "Leçon";
const LIEN = "Lien";
const APPLICATION = "Application";
const DEFI = "Défi";
const REFLECHIS = "Réfléchis";
const CLE = "Clé";
const PRATIQUE = "Pratique";
const EXERCICE = "Exercice";
const VERIFICATION = "Vérification";

const T_LIEN = "LIEN LOGIQUE";
const T_APPLICATION = "APPLICATION";
const T_APPICATION = "APPICATION";
const T_DEFI = "LE DÉFI";
const T_REFLECHIS = "RÉFLÉCHIS";
const T_CLE = "CLÉ";
const T_VERIFICATION = "VÉRIFICATION AVEC UTILISATION D'UNE NOUVELLE STRATÉGIE";

function concept(bookFrom: number, kind: string, title: string): MathFrG3T1Concept {
  return { bookFrom, kind, title };
}

function lessonHead(bookFrom: number, title: string): MathFrG3T1Concept {
  return concept(bookFrom, LECON, title);
}

function lien(bookFrom: number): MathFrG3T1Concept {
  return concept(bookFrom, LIEN, T_LIEN);
}

function application(bookFrom: number, title: string = T_APPLICATION): MathFrG3T1Concept {
  return concept(bookFrom, APPLICATION, title);
}

function defi(bookFrom: number): MathFrG3T1Concept {
  return concept(bookFrom, DEFI, T_DEFI);
}

function reflechis(bookFrom: number): MathFrG3T1Concept {
  return concept(bookFrom, REFLECHIS, T_REFLECHIS);
}

/**
 * The six chapitres of the first term with their printed lessons and every
 * printed band, transcribed from the pages the book prints them on and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter ranges come from the pages' own «Chapitre N» openers and the
 * contents (scan 4): 1–9, 10–24, 25–42, 43–60, 61–81 and 82–106. Lesson
 * starts come from the «LEÇON n» openers and match the contents exactly,
 * except Leçon 5-8 (contents p. 78, head printed on book 79) where the spec
 * follows the printed page.
 */
export const EGYPT_MATH_FR_G3_T1_UNITS: MathFrG3T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "Premier",
    title: "Chapitre 1",
    printedHead: "Chapitre 1",
    bookFrom: 1,
    bookTo: 9,
    lessons: [
      {
        key: "1-1",
        ordinal: "Première",
        type: LECON,
        title: "LES MODÈLES",
        printedHead: "LEÇON 1: LES MODÈLES",
        bookFrom: 1,
        concepts: [lessonHead(1, "LEÇON 1: LES MODÈLES"), lien(1), application(2), defi(2)],
      },
      {
        key: "1-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "PLUS DE REPRÉSENTATIONS GRAPHIQUE PAR COLONNES",
        printedHead: "LEÇON 2: PLUS DE REPRÉSENTATIONS GRAPHIQUE PAR COLONNES",
        bookFrom: 3,
        concepts: [
          lessonHead(3, "LEÇON 2: PLUS DE REPRÉSENTATIONS GRAPHIQUE PAR COLONNES"),
          application(3),
          defi(3),
          reflechis(3),
        ],
      },
      {
        key: "1-3",
        ordinal: "Troisième",
        type: LECON,
        title: "LA REPRÉSENTATION GRAPHIQUE PAR DES POINTS",
        printedHead: "LEÇON 3: LA REPRÉSENTATION GRAPHIQUE PAR DES POINTS",
        bookFrom: 4,
        concepts: [
          lessonHead(4, "LEÇON 3: LA REPRÉSENTATION GRAPHIQUE PAR DES POINTS"),
          application(4),
          concept(4, CLE, T_CLE),
          defi(4),
          reflechis(4),
        ],
      },
      {
        key: "1-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "LA MESURE DES LONGUEURS PAR CENTIMÈTRES",
        printedHead: "LEÇON 4: LA MESURE DES LONGUEURS PAR CENTIMÈTRES",
        bookFrom: 5,
        concepts: [
          lessonHead(5, "LEÇON 4: LA MESURE DES LONGUEURS PAR CENTIMÈTRES"),
          lien(5),
          application(6),
          reflechis(6),
        ],
      },
      {
        key: "1-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "LA MESURE DE LONGUEURS PAR MÈTRE",
        printedHead: "LEÇON 5 : LA MESURE DE LONGUEURS PAR MÈTRE",
        bookFrom: 7,
        concepts: [
          lessonHead(7, "LEÇON 5 : LA MESURE DE LONGUEURS PAR MÈTRE"),
          application(7),
          defi(8),
          reflechis(8),
        ],
      },
      {
        key: "1-6",
        ordinal: "Sixième",
        type: LECON,
        title: "LA MESURE DE LONGUEURS PAR MILLIMÈTRE",
        printedHead: "LEÇON 6: LA MESURE DE LONGUEURS PAR MILLIMÈTRE",
        bookFrom: 9,
        concepts: [lessonHead(9, "LEÇON 6: LA MESURE DE LONGUEURS PAR MILLIMÈTRE"), application(9)],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "Deuxième",
    title: "Chapitre 2",
    printedHead: "Chapitre 2",
    bookFrom: 10,
    bookTo: 24,
    lessons: [
      {
        key: "2-1",
        ordinal: "Première",
        type: LECON,
        title: "LES MILLIERS",
        printedHead: "LEÇON1: LES MILLIERS",
        bookFrom: 10,
        concepts: [lessonHead(10, "LEÇON1: LES MILLIERS"), application(10), reflechis(11)],
      },
      {
        key: "2-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "PLUS DE MILLIERS",
        printedHead: "LEÇON 2: PLUS DE MILLIERS",
        bookFrom: 12,
        concepts: [lessonHead(12, "LEÇON 2: PLUS DE MILLIERS"), application(12), defi(13)],
      },
      {
        key: "2-3",
        ordinal: "Troisième",
        type: LECON,
        title: "DIZAINES DE MILLIERS - CENTAINES DE MILLIERS",
        printedHead: "LEÇON 3: DIZAINES DE MILLIERS - CENTAINES DE MILLIERS",
        bookFrom: 14,
        concepts: [
          lessonHead(14, "LEÇON 3: DIZAINES DE MILLIERS - CENTAINES DE MILLIERS"),
          application(14),
          reflechis(15),
        ],
      },
      {
        key: "2-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "LES FORMES DIFFERENTS POUR ÉCRIRE LES NOMBRES",
        printedHead: "LEÇON 4: LES FORMES DIFFERENTS POUR ÉCRIRE LES NOMBRES",
        bookFrom: 16,
        concepts: [
          lessonHead(16, "LEÇON 4: LES FORMES DIFFERENTS POUR ÉCRIRE LES NOMBRES"),
          application(16),
        ],
      },
      {
        key: "2-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "LES MATRICES",
        printedHead: "LEÇON 5: LES MATRICES",
        bookFrom: 17,
        concepts: [lessonHead(17, "LEÇON 5: LES MATRICES"), application(17), reflechis(19)],
      },
      {
        key: "2-6",
        ordinal: "Sixième",
        type: LECON,
        title: "LA MULTIPLICATION",
        printedHead: "LEÇON 6: LA MULTIPLICATION",
        bookFrom: 20,
        concepts: [lessonHead(20, "LEÇON 6: LA MULTIPLICATION"), application(20), defi(21)],
      },
      {
        key: "2-7",
        ordinal: "Septième",
        type: LECON,
        title: "La propriété DU COMMUTATIVE DE LA MULTIPLICATION",
        printedHead: "LEÇON 7 : La propriété DU COMMUTATIVE DE LA MULTIPLICATION",
        bookFrom: 22,
        concepts: [
          lessonHead(22, "LEÇON 7 : La propriété DU COMMUTATIVE DE LA MULTIPLICATION"),
          application(22),
          reflechis(24),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "Troisième",
    title: "Chapitre 3",
    printedHead: "Chapitre 3",
    bookFrom: 25,
    bookTo: 42,
    lessons: [
      {
        key: "3-1",
        ordinal: "Première",
        type: LECON,
        title: "DES PROBLÈME DE LA MULTIPLICATION",
        printedHead: "LEÇON 1: DES PROBLÈME DE LA MULTIPLICATION",
        bookFrom: 25,
        concepts: [
          lessonHead(25, "LEÇON 1: DES PROBLÈME DE LA MULTIPLICATION"),
          application(25),
          concept(25, PRATIQUE, "PRACTIQUE:"),
          defi(26),
        ],
      },
      {
        key: "3-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "APPLICATION SUR LA MULTIPLICATION",
        printedHead: "LEÇON 2 : APPLICATION SUR LA MULTIPLICATION",
        bookFrom: 27,
        concepts: [
          lessonHead(27, "LEÇON 2 : APPLICATION SUR LA MULTIPLICATION"),
          application(27),
          reflechis(27),
        ],
      },
      {
        key: "3-3",
        ordinal: "Troisième",
        type: LECON,
        title: "LES MULTIPLES DE DEUX NOMBRES 2 ET 3",
        printedHead: "LEÇON 3 : LES MULTIPLES DE DEUX NOMBRES 2 ET 3",
        bookFrom: 28,
        concepts: [
          lessonHead(28, "LEÇON 3 : LES MULTIPLES DE DEUX NOMBRES 2 ET 3"),
          application(28),
          reflechis(29),
        ],
      },
      {
        key: "3-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "LES MULTIPLES DE DEUX NOMBRES 5 ET 10",
        printedHead: "LEÇON 4 : LES MULTIPLES DE DEUX NOMBRES 5 ET 10",
        bookFrom: 30,
        concepts: [
          lessonHead(30, "LEÇON 4 : LES MULTIPLES DE DEUX NOMBRES 5 ET 10"),
          application(30),
        ],
      },
      {
        key: "3-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "LES FACTEURS DES NOMBRES EN UTILISANT LA MATRICE",
        printedHead: "LEÇON 5: LES FACTEURS DES NOMBRES EN UTILISANT LA MATRICE",
        bookFrom: 32,
        concepts: [
          lessonHead(32, "LEÇON 5: LES FACTEURS DES NOMBRES EN UTILISANT LA MATRICE"),
          reflechis(32),
        ],
      },
      {
        key: "3-6",
        ordinal: "Sixième",
        type: LECON,
        title: "LE TEMPS",
        printedHead: "LEÇON 6 : LE TEMPS",
        bookFrom: 33,
        concepts: [
          lessonHead(33, "LEÇON 6 : LE TEMPS"),
          application(33),
          concept(33, EXERCICE, "Exercice collectif"),
          concept(33, EXERCICE, "EXERICE EN BINÔME"),
        ],
      },
      {
        key: "3-7",
        ordinal: "Septième",
        type: LECON,
        title: "APPLICATION SUR LE TEMPS",
        printedHead: "LEÇON 7 : APPLICATION SUR LE TEMPS",
        bookFrom: 34,
        concepts: [
          lessonHead(34, "LEÇON 7 : APPLICATION SUR LE TEMPS"),
          application(34),
          defi(34),
          reflechis(35),
        ],
      },
      {
        key: "3-8",
        ordinal: "Huitième",
        type: LECON,
        title: "LA DIVISION",
        printedHead: "LEÇON 8: LA DIVISION",
        bookFrom: 36,
        concepts: [lessonHead(36, "LEÇON 8: LA DIVISION"), application(36), reflechis(38)],
      },
      {
        key: "3-9",
        ordinal: "Neuvième",
        type: LECON,
        title: "APPLICATION SUR LA DIVISION",
        printedHead: "LEÇON 9 : APPLICATION SUR LA DIVISION",
        bookFrom: 39,
        concepts: [
          lessonHead(39, "LEÇON 9 : APPLICATION SUR LA DIVISION"),
          application(39),
        ],
      },
      {
        key: "3-10",
        ordinal: "Dixième",
        type: LECON,
        title: "LA RELATION ENTRE LA MULTICATION ET LA DIVISION",
        printedHead: "LEÇON 10 : LA RELATION ENTRE LA MULTICATION ET LA DIVISION",
        bookFrom: 41,
        concepts: [
          lessonHead(41, "LEÇON 10 : LA RELATION ENTRE LA MULTICATION ET LA DIVISION"),
          application(41),
          defi(42),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "Quatrième",
    title: "Chapitre 4",
    printedHead: "Chapitre 4",
    bookFrom: 43,
    bookTo: 60,
    lessons: [
      {
        key: "4-1",
        ordinal: "Première",
        type: LECON,
        title: "LES POLYGONES",
        printedHead: "LEÇON 1: LES POLYGONES",
        bookFrom: 43,
        concepts: [
          lessonHead(43, "LEÇON 1: LES POLYGONES"),
          application(43),
          defi(44),
          reflechis(44),
        ],
      },
      {
        key: "4-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "LES PROPRIETES DE QUADRILATÈRES",
        printedHead: "LEÇON 2: LES PROPRIETES DE QUADRILATÈRES",
        bookFrom: 45,
        concepts: [
          lessonHead(45, "LEÇON 2: LES PROPRIETES DE QUADRILATÈRES"),
          lien(45),
          application(46),
          reflechis(47),
        ],
      },
      {
        key: "4-3",
        ordinal: "Troisième",
        type: LECON,
        title: "L'AIRE",
        printedHead: "LEÇON 3: L'AIRE",
        bookFrom: 48,
        concepts: [lessonHead(48, "LEÇON 3: L'AIRE"), lien(48), application(48), defi(49)],
      },
      {
        key: "4-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "DES RECTANGLES ONT LA MÊME AIRE",
        printedHead: "LEÇON 4: DES RECTANGLES ONT LA MÊME AIRE",
        bookFrom: 50,
        concepts: [
          lessonHead(50, "LEÇON 4: DES RECTANGLES ONT LA MÊME AIRE"),
          lien(50),
          application(50),
          defi(51),
          reflechis(52),
        ],
      },
      {
        key: "4-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "L' AIRE EN UTILISANT LES MODÈLES",
        printedHead: "LEÇON 5: L' AIRE EN UTILISANT LES MODÈLES",
        bookFrom: 53,
        concepts: [
          lessonHead(53, "LEÇON 5: L' AIRE EN UTILISANT LES MODÈLES"),
          lien(53),
          application(53),
          defi(55),
          reflechis(56),
        ],
      },
      {
        key: "4-6",
        ordinal: "Sixième",
        type: LECON,
        title: "L'AIRE EN DIVISANT LES MATRICES",
        printedHead: "LEÇON 6 : L'AIRE EN DIVISANT LES MATRICES",
        bookFrom: 57,
        concepts: [
          lessonHead(57, "LEÇON 6 : L'AIRE EN DIVISANT LES MATRICES"),
          application(57, T_APPICATION),
        ],
      },
      {
        key: "4-7",
        ordinal: "Septième",
        type: LECON,
        title: "LA PROPRIÉTÉ DE LA DISTRIBUTIVITÉ EN MULTIPLICATION",
        printedHead: "LEÇON 7: LA PROPRIÉTÉ DE LA DISTRIBUTIVITÉ EN MULTIPLICATION",
        bookFrom: 58,
        concepts: [
          lessonHead(58, "LEÇON 7: LA PROPRIÉTÉ DE LA DISTRIBUTIVITÉ EN MULTIPLICATION"),
          lien(58),
          application(58),
          reflechis(60),
        ],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "Cinquième",
    title: "Chapitre 5",
    printedHead: "Chapitre 5",
    bookFrom: 61,
    bookTo: 81,
    lessons: [
      {
        key: "5-1",
        ordinal: "Première",
        type: LECON,
        title: "PÉRIMÈTRE DE POLYGONES",
        printedHead: "LEÇON 1: PÉRIMÈTRE DE POLYGONES",
        bookFrom: 61,
        concepts: [
          lessonHead(61, "LEÇON 1: PÉRIMÈTRE DE POLYGONES"),
          application(61, T_APPICATION),
          reflechis(62),
        ],
      },
      {
        key: "5-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "LE PÉRIMÈTRE ET L'AIRE",
        printedHead: "LEÇON 2: LE PÉRIMÈTRE ET L'AIRE",
        bookFrom: 63,
        concepts: [
          lessonHead(63, "LEÇON 2: LE PÉRIMÈTRE ET L'AIRE"),
          application(63),
          defi(64),
          reflechis(65),
        ],
      },
      {
        key: "5-3",
        ordinal: "Troisième",
        type: LECON,
        title: "L'AIRE EN UTILISANT LES DIMENSIONS",
        printedHead: "LEÇON 3: L'AIRE EN UTILISANT LES DIMENSIONS",
        bookFrom: 66,
        concepts: [lessonHead(66, "LEÇON 3: L'AIRE EN UTILISANT LES DIMENSIONS"), defi(67)],
      },
      {
        key: "5-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "L'AIRE PAR DES STRATÉGIES VARIES",
        printedHead: "LEÇON 4: L'AIRE PAR DES STRATÉGIES VARIES",
        bookFrom: 68,
        concepts: [
          lessonHead(68, "LEÇON 4: L'AIRE PAR DES STRATÉGIES VARIES"),
          lien(68),
          application(68),
        ],
      },
      {
        key: "5-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "DIFFÉRENTES PÉRIMÈTRES DE LA MÊME AIRE",
        printedHead: "LEÇON 5: DIFFÉRENTES PÉRIMÈTRES DE LA MÊME AIRE",
        bookFrom: 71,
        concepts: [
          lessonHead(71, "LEÇON 5: DIFFÉRENTES PÉRIMÈTRES DE LA MÊME AIRE"),
          lien(71),
          application(72),
          defi(73),
        ],
      },
      {
        key: "5-6",
        ordinal: "Sixième",
        type: LECON,
        title: "DIFFÉRENTES AIRES POUR LE MÊME PÉRIMÈTRE",
        printedHead: "LEÇON 6: DIFFÉRENTES AIRES POUR LE MÊME PÉRIMÈTRE",
        bookFrom: 74,
        concepts: [
          lessonHead(74, "LEÇON 6: DIFFÉRENTES AIRES POUR LE MÊME PÉRIMÈTRE"),
          lien(74),
          application(74),
          defi(75),
          reflechis(75),
        ],
      },
      {
        key: "5-7",
        ordinal: "Septième",
        type: LECON,
        title: "DES APPLICATIONS SUR LE PÉRIMÈTRE ET L'AIRE",
        printedHead: "LEÇON 7: DES APPLICATIONS SUR LE PÉRIMÈTRE ET L'AIRE",
        bookFrom: 76,
        concepts: [
          lessonHead(76, "LEÇON 7: DES APPLICATIONS SUR LE PÉRIMÈTRE ET L'AIRE"),
          lien(76),
          application(76),
        ],
      },
      {
        key: "5-8",
        ordinal: "Huitième",
        type: LECON,
        title: "LA MULTIPLICATION PAR LES MULTIPLES DE 10",
        printedHead: "LEÇON 8: LA MULTIPLICATION PAR LES MULTIPLES DE 10",
        bookFrom: 79,
        concepts: [
          lessonHead(79, "LEÇON 8: LA MULTIPLICATION PAR LES MULTIPLES DE 10"),
          application(79),
          defi(81),
          reflechis(81),
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "chapter",
    ordinal: "Sixième",
    title: "Chapitre 6",
    printedHead: "Chapitre 6",
    bookFrom: 82,
    bookTo: 106,
    lessons: [
      {
        key: "6-1",
        ordinal: "Première",
        type: LECON,
        title: "LES MODÉLES DE LA MULTIPLICATION DE 10",
        printedHead: "LEÇON 1 : LES MODÉLES DE LA MULTIPLICATION DE 10",
        bookFrom: 82,
        concepts: [
          lessonHead(82, "LEÇON 1 : LES MODÉLES DE LA MULTIPLICATION DE 10"),
          lien(82),
          application(83),
          defi(84),
          reflechis(84),
        ],
      },
      {
        key: "6-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "LES STATÉGIES DE LA MULTIPLICATION DE 9",
        printedHead: "LEÇON 2: LES STATÉGIES DE LA MULTIPLICATION DE 9",
        bookFrom: 85,
        concepts: [
          lessonHead(85, "LEÇON 2: LES STATÉGIES DE LA MULTIPLICATION DE 9"),
          application(85),
          defi(85),
        ],
      },
      {
        key: "6-3",
        ordinal: "Troisième",
        type: LECON,
        title: "LES FAITS DE LA MULTIPLICATION ET L'ADDITION",
        printedHead: "LEÇON 3: LES FAITS DE LA MULTIPLICATION ET L'ADDITION",
        bookFrom: 89,
        concepts: [
          lessonHead(89, "LEÇON 3: LES FAITS DE LA MULTIPLICATION ET L'ADDITION"),
          lien(89),
          application(90),
        ],
      },
      {
        key: "6-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "LA COMPARAISON ET L'ORDRE DE NOMBRES AVEC DES FORMES DIFFÉRENTES",
        printedHead: "LEÇON 4: LA COMPARAISON ET L'ORDRE DE NOMBRES AVEC DES FORMES DIFFÉRENTES",
        bookFrom: 92,
        concepts: [
          lessonHead(92, "LEÇON 4: LA COMPARAISON ET L'ORDRE DE NOMBRES AVEC DES FORMES DIFFÉRENTES"),
          application(92),
          defi(93),
        ],
      },
      {
        key: "6-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "LES STRATÉGIES DE L'ADDITION",
        printedHead: "LEÇON 5: LES STRATÉGIES DE L'ADDITION",
        bookFrom: 94,
        concepts: [
          lessonHead(94, "LEÇON 5: LES STRATÉGIES DE L'ADDITION"),
          application(94),
          concept(95, VERIFICATION, T_VERIFICATION),
          defi(95),
          reflechis(95),
        ],
      },
      {
        key: "6-6",
        ordinal: "Sixième",
        type: LECON,
        title: "LES STRATÉGIES DE LA SOUSTRACTION",
        printedHead: "LEÇON 6: LES STRATÉGIES DE LA SOUSTRACTION",
        bookFrom: 96,
        concepts: [
          lessonHead(96, "LEÇON 6: LES STRATÉGIES DE LA SOUSTRACTION"),
          application(96, T_APPICATION),
          defi(97),
        ],
      },
      {
        key: "6-7",
        ordinal: "Septième",
        type: LECON,
        title: "APPLICATIONS SUR L'ADDITION ET LA SOUSTRACTION",
        printedHead: "LEÇON 7: APPLICATIONS SUR L'ADDITION ET LA SOUSTRACTION",
        bookFrom: 98,
        concepts: [
          lessonHead(98, "LEÇON 7: APPLICATIONS SUR L'ADDITION ET LA SOUSTRACTION"),
          lien(98),
          application(98),
          concept(98, PRATIQUE, "PRATIQUE:"),
          reflechis(100),
        ],
      },
      {
        key: "6-8",
        ordinal: "Huitième",
        type: LECON,
        title: "LA CAPACITÉ",
        printedHead: "LEÇON 8: LA CAPACITÉ",
        bookFrom: 101,
        concepts: [lessonHead(101, "LEÇON 8: LA CAPACITÉ"), application(101)],
      },
      {
        key: "6-9",
        ordinal: "Neuvième",
        type: LECON,
        title: "LA LECTURE DE LA CAPACITÉ",
        printedHead: "LEÇON 9: LA LECTURE DE LA CAPACITÉ",
        bookFrom: 103,
        concepts: [
          lessonHead(103, "LEÇON 9: LA LECTURE DE LA CAPACITÉ"),
          lien(103),
          application(104),
          reflechis(106),
        ],
      },
    ],
  },
];

/**
 * The book-page span a lesson owns: from the chapter opener (its first lesson)
 * or its own head page, down to the page before the next lesson starts,
 * bounded by the chapter. A band that recurs on the following page belongs to
 * this lesson, so the ranges tile [1, 106] exactly and no reachable content
 * sits outside a lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_MATH_FR_G3_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_FR_G3_T1_UNITS.forEach((section, si) => {
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
  "math-fr-g3-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (Only scans 2 and 111 — blank versos outside the term — need it,
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
  const lesson = EGYPT_MATH_FR_G3_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
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
 * (this is what lets the line-split head of Leçon 6-4 match its single-line
 * transcription).
 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring case and OCR spacing/punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/** Numerals a footer line carries once the ordinal and the grade word are gone. */
function footerNumbers(line: string): number[] {
  const clean = line
    .replace(/\$[^$]*\$/g, " ")
    .replace(/3\s*ème/gi, " ")
    .replace(/primaire/gi, " ");
  const found = clean.match(/\d+/g);
  if (!found) return [];
  return [...new Set(found.map(Number))].filter((n) => n > 0);
}

/**
 * Whether a line is a fragment of a split footer («3», «3ème», «ème»,
 * «Primaire» or a maths-garbled footer segment) rather than body content.
 */
function isFooterFragment(line: string): boolean {
  const stripped = line
    .replace(/\$[^$]*\$/g, " ")
    .replace(/[^\p{L}\p{N}]/gu, " ")
    .toLowerCase();
  const tokens = stripped.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every(
    (t) => t === "3" || t === "3ème" || t === "3eme" || t === "ème" || t === "eme" || t === "primaire",
  );
}

/**
 * Page-number candidates a content page prints. Ordinary pages print the folio
 * on their last line («N 3ème PRIMAIRE» or «3ème PRIMAIRE N»); four pages
 * split the footer across lines (books 15, 79, 95 and 99 print a bare «N»
 * above «3ème PRIMAIRE») and book 84 prints a maths-garbled footer, so when
 * the last line yields no number the walk continues upward through
 * footer-fragment lines to the bare numeral — bounded to five lines so
 * exercise counts and chart numbers stay out of reach. Only the footer is
 * ever read, so body numbers can never be mistaken for a folio.
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
 * 106 term pages print their folio, including the four split-footer pages
 * (books 15, 79, 95, 99) and the maths-garbled footer of book 84 that
 * `footerCandidates` reads through.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {};

/** Every band kind this book prints. */
const KNOWN_KINDS = new Set([LECON, LIEN, APPLICATION, DEFI, REFLECHIS, CLE, PRATIQUE, EXERCICE, VERIFICATION]);

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
  const units = EGYPT_MATH_FR_G3_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_MATH_FR_G3_T1_BOOK_START) {
    problems.push(`First section must start at page ${EGYPT_MATH_FR_G3_T1_BOOK_START}, found ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_FR_G3_T1_BOOK_END) {
    problems.push(`Last section must end at page ${EGYPT_MATH_FR_G3_T1_BOOK_END}, found ${last.bookTo}`);
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
 *  4. every printed page in [1, 106] is owned by exactly one lesson — no page
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
  const units = EGYPT_MATH_FR_G3_T1_UNITS;
  const missing = new Set<number>(MISSING_SCANS);

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_FR_G3_T1_BOOK_START || book > EGYPT_MATH_FR_G3_T1_BOOK_END) continue;
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
    EGYPT_MATH_FR_G3_T1_BOOK_END - EGYPT_MATH_FR_G3_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `Book fabric: ${printedPages.size} pages read between ${EGYPT_MATH_FR_G3_T1_BOOK_START} and ${EGYPT_MATH_FR_G3_T1_BOOK_END}, expected ${expectedPages}`,
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
  for (let p = EGYPT_MATH_FR_G3_T1_BOOK_START; p <= EGYPT_MATH_FR_G3_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`Page ${p} owned by no lesson`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
