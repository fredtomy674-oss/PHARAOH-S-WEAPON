// Primary 4 (الصف الرابع الابتدائي) Mathematics, French-medium, first term,
// Ministry of Education and Technical Education / Discovery Techbook edition
// («4ème Primaire — Maths — 1er semestre», cover imprint «2025 - 2026»,
// 136 scanned pages).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g4-math-fr`, subject `math-fr` (name "Mathématiques"), lesson prefix
// `l-g4-math-fr-`, grade `grade-4` (name "Primary 4").
//
// The curriculum tree for the Egypt `eg-g4-math-fr` curriculum is rebuilt from
// the Ministry textbook `MATHÉMATIQUES — 4ème primaire — 1er semestre`. This
// module is the single source of truth for its structure: the eight printed
// UNITÉs of the first term, every numbered LEÇON inside them (50 in all),
// and, for every lesson, the book's own printed heads — the lesson head plus
// the lesson-flow bands every lesson prints (Objectifs d'apprentissage,
// ACCÈS, CONSTRUIS TES CONNAISSANCES, Vérifie ton acquisition / Vérifie ta
// compréhensio, FAIS LES LIENS) — verbatim and with the printed page they
// start on. The self-checks at the bottom prove that mapping against the OCR
// itself, page by page.
//
// THE OFFSET IS TEN — book page = scan page − 10
// Every content page prints its own folio in its running head, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scans and quoted here: scan 13 prints
// «3 Leçon 2: Changer les valeurs de position 3» (book 3), scan 21 prints
// «11 Leçon 5: La comparaison de grands nombres» (book 11), scan 85 prints
// «Leçon 4: Propriété commutative de multiplication 75 …» (book 75), scan 119
// prints «Leçon 6: Explorer les restes 109» (book 109) and scan 135 prints
// «125 Ordre des Opérations» (book 125, the term's last page). The book's own
// contents (scans 2–4, «Table des matières») independently confirms the
// skeleton: eight unités, sixteen Concept X.Y groupings and fifty leçons in
// the page order the heads print on (see the ToC divergences below).
//
// TERM = THE NUMBERED PAGES (books 1–125)
// Scan pages 1–10 are before the term: the cover (1), the «Table des
// matières» (2–4, folios ii–iv), the «PREFACE» (5, folio v), a blank verso
// (6, folio vi), the «Cher parent / tuteur» letter (7–9, folios vii–viii)
// and the Unité-1 video page (10). The term runs from the Leçon 1-1 opener
// (book 1 = scan 11) to the last page of Leçon 8-2 (book 125 = scan 135):
// `EGYPT_MATH_FR_G4_T1_BOOK_START` / `_BOOK_END` are exactly those two pages,
// and the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` is therefore 125 = 125 − 1 + 1 (no scan of the term is
// missing). Scan page 136 is after the term (the Arabic distribution page).
//
// SEVEN FOLIO-LESS TERM PAGES — EACH IS A UNIT OPENER BY DESIGN
// Books 21, 37, 56, 68, 83, 97 and 121 are the «UNITÉ 2» … «UNITÉ 8» video
// openers; none prints a page number (the numerals they carry are the unit
// and theme numbers). Rather than weaken the page-number check, these seven
// are anchored on the video title each page itself prints, named in
// `FOLIO_LESS_ANCHORS`. (Unité 1's opener is scan 10, i.e. front matter, so
// the term needs no anchor for it.) Every other term page proves its own
// number from its running head, so `FOOTER_OCR_MISREADS` is empty.
//
// THE FOLIO CHECK READS HEAD AND FOOT, FIRST LINE AND LAST LINES
// Even pages print the folio at the start of the first line («2 UNITÉ»,
// «6», «22 22 Utilisation …», «100 Multiplication …», «122 Photo
// Credit: …»); the four «Mesure du temps» even pages (48, 50, 52, 54) print
// it instead at the end of their header block («CONCEPT 2 48» …). Odd pages
// print it before «Leçon» («23 Leçon 1: …»), after the lesson title
// («Leçon 4: Composer et décomposer 7», «… 47», «… 109») or both («3 Leçon
// 2: … 3»); book 1 prints it mid-page («1 Leçon 1: Les grands nombres»,
// with the «1 CONCEPT 1» footer). `footerCandidates` therefore reads the
// first line, the header block and the last lines with folio-specific
// patterns only — a bare numeral counts on the first line alone, so unit
// numbers («UNITÉ» / «3»), clock faces and exercise counts can never be
// mistaken for a folio. One header line is a genuine printer oddity, not a
// folio: book 69 prints «CONCEPT 1 Leçon 1: … multiplication 71» (the 71 is
// the next lesson's page, mid-page, never a candidate).
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED BANDS
// The parent letter (scan 9) states the flow itself: «Chaque leçon a trois
// principaux sections : ACCÈS, CONSTRUIS TES CONNAISSANCES et FAIS LES
// LIENS», opened by «Objectifs d'apprentissage» and closed by the «Vérifie»
// box. Every lesson therefore contributes its «LEÇON N» head plus, in page
// order, «Objectifs d'apprentissage», «ACCÈS», «CONSTRUIS TES
// CONNAISSANCES», the «Vérifie» box it prints («Vérifie ton acquisition» in
// 34 lessons, «Vérifie ta compréhensio» in 16) and «FAIS LES LIENS». Leçon
// 1-1 additionally prints the band «Activités pratiques : Créer de vrais
// grands nombres .» on its second page, kept as its seventh concept. The
// game and revision box titles inside exercises («Bataille des nombres»,
// «Jeu des Facteurs et des Multiples», «Jeu de tableau de division»,
// «Révision terminologique», «Révision de l'aire») are exercise-level, like
// the G1 French twin's «Pointe!»/«Essaie» banners, and contribute no
// concept. Nothing is invented: every concept title below is a string the
// book itself prints on the page its `bookFrom` names.
//
// TEXT-LAYER QUIRKS RECORDED, NOT WORKED AROUND
// `normalize` drops case, spacing and punctuation, so the spaced bands
// («ACC È S» on books 1 and 3, «A CCÈS» on book 25) still match «ACCÈS»,
// and straight/curly apostrophes («Objectifs d'apprentissage» on the Unité
// 5–7 openers vs «Objectifs d’apprentissage» elsewhere) match each other.
// Stored byte-verbatim are: «LEÇO N 3» (book 27 prints the head spaced),
// «Leçon5:» (books 33, 35 print no space), «Leçon 7 :» (book 55 spaces its
// colon), «La stratégie de modéle de l'aire» (the book's own «modéle»,
// U7L1), «Multiplication à un chiffre» (big head; the running header drops
// the e: «chiffr»), «Multiplication à deux chiffres de 10» (big head; the
// running header truncates to «de 1»), «Identification des facteurs des
// Nombres entiers» (big head; the running header prints «des Nombres
// entier»), «Objectifs d’apprentissages» (books 62 and 124 print the extra
// s) and «Vérifie ta compréhensio» (all 16 lessons print the band without
// its final n). Lesson titles keep the big head's wording even where the
// contents lists another («Comparaison des nombres en utilisant la
// multiplication» not «Comparaison multiplicative»; «Propriété commutative
// de multiplication» not «de la multiplication»; «Application de modèles
// dans la Multiplication» not «des modèles»; «Le Plus Grand Commun
// Diviseur (P.G.C.D)» not «Le grand facteur commun (G.F.C)»; «L’ordre des
// opérations et Problèmes» not «… et les problèmes de l’histoire»;
// «Nombres croissants et décroissants» not «décroissants et croissants»).
// The contents also trails the heads by about two pages throughout Unités
// 1–4 (it lists Leçon 1-1 at 3, 2-1 at 24, 3-1 at 40, 4-1 at 59); the spec
// follows the pages that print the heads.
//
// EVEN-PAGE OPENERS RIDE WITH THEIR LESSON
// Most lessons open on odd pages, but eight open on even pages (U1L5 at 10,
// U1L6 at 12, U3L4 at 46, U3L5 at 48, U3L7 at 54, U4L4 at 64, U8L1 at 122,
// U8L2 at 124), each printing its full head plus Objectifs/ACCÈS there.
// `lessonBookRange` starts every non-first lesson at its own head page, and
// each unit's first lesson at the folio-less unit opener, so the ranges
// tile [1, 125] exactly.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 10 (verified: book p.125 = scan p.135). */
export const BOOK_TO_PDF_OFFSET = 10;

/** First printed page of the term — the Leçon 1-1 opener (scan 11). */
export const EGYPT_MATH_FR_G4_T1_BOOK_START = 1;

/** Last printed page of the term — the last page of Leçon 8-2 (scan 135). */
export const EGYPT_MATH_FR_G4_T1_BOOK_END = 125;

/** The scanned pages before the term: cover, contents, preface, parent letter, Unité-1 video. */
export const EGYPT_MATH_FR_G4_T1_FRONT_MATTER = { from: 1, to: 10 } as const;

/** The scanned pages after the term: the Arabic distribution page (scan 136). */
export const EGYPT_MATH_FR_G4_T1_BACK_MATTER = { from: 136, to: 136 } as const;

/**
 * The term pages the OCR never produced, as scan pages. All 136 scans are
 * present and contiguous (pages-001 … pages-136), so there are none; the
 * constant is kept so this module shares the shape of the other Egyptian
 * specs (and so the checker's expected page count subtracts it).
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed band of a lesson — becomes one concept in the app tree. */
export interface MathFrG4T1Concept {
  /** Printed book page where this band starts. */
  bookFrom: number;
  /** The printed band kind: "Leçon", "Objectifs", "Accès", "Construis", "Vérifie", "Liens" or "Pratique". */
  kind: string;
  /** The printed band head, verbatim. */
  title: string;
}

/** One printed lesson (one numbered leçon of a unit). */
export interface MathFrG4T1Lesson {
  /** App-addressable key, e.g. "5-3" (unit 5, lesson 3). */
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
  concepts: MathFrG4T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a unit — so no lesson below uses it; the
   * field is kept so this module shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed unit of the book — one of the eight unités of the first term. */
export interface MathFrG4T1Unit {
  /** This book's sections are its unités. */
  kind: "unit";
  /** Internal key: "1"…"8", in book order. */
  key: string;
  /** French ordinal of the unit as the app prints it, e.g. "Troisième". */
  ordinal: string;
  /** Full app-facing unit title, e.g. "Unité 3 : Concepts de mesure". */
  title: string;
  /** The unit head the opener page prints, verbatim, e.g. "UNITÉ 3". */
  printedHead: string;
  /** First printed page of the unit (its opener). */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next opener). */
  bookTo: number;
  lessons: MathFrG4T1Lesson[];
}

const LECON = "Leçon";
const OBJECTIFS = "Objectifs";
const ACCES = "Accès";
const CONSTRUIS = "Construis";
const VERIFIE = "Vérifie";
const LIENS = "Liens";
const PRATIQUE = "Pratique";

const T_ACCES = "ACCÈS";
const T_CONSTRUIS = "CONSTRUIS TES CONNAISSANCES";
const T_VERIFIE_TON = "Vérifie ton acquisition";
const T_VERIFIE_TA = "Vérifie ta compréhensio";
const T_LIENS = "FAIS LES LIENS";
const T_OBJECTIFS = "Objectifs d’apprentissage";
const T_OBJECTIFS_S = "Objectifs d'apprentissage";
const T_OBJECTIFS_P = "Objectifs d’apprentissages";
const T_PRATIQUE_U1L1 = "Activités pratiques : Créer de vrais grands nombres";

function concept(bookFrom: number, kind: string, title: string): MathFrG4T1Concept {
  return { bookFrom, kind, title };
}

function lessonHead(bookFrom: number, title: string): MathFrG4T1Concept {
  return concept(bookFrom, LECON, title);
}

function objectifs(bookFrom: number, title: string = T_OBJECTIFS): MathFrG4T1Concept {
  return concept(bookFrom, OBJECTIFS, title);
}

function acces(bookFrom: number): MathFrG4T1Concept {
  return concept(bookFrom, ACCES, T_ACCES);
}

function construis(bookFrom: number): MathFrG4T1Concept {
  return concept(bookFrom, CONSTRUIS, T_CONSTRUIS);
}

function verifie(bookFrom: number, title: string): MathFrG4T1Concept {
  return concept(bookFrom, VERIFIE, title);
}

function liens(bookFrom: number): MathFrG4T1Concept {
  return concept(bookFrom, LIENS, T_LIENS);
}

/**
 * The eight unités of the first term with their printed lessons and every
 * printed band, transcribed from the pages the book prints them on and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Lesson starts come from the «LEÇON N» openers (even-page openers at books
 * 10, 12, 46, 48, 54, 64, 122 and 124); the book's contents (scans 2–4)
 * lists the same fifty lessons about two pages later throughout Unités 1–4
 * and under older titles in Unités 5–8 (see the header note) — the spec
 * follows the pages that print the heads.
 */
export const EGYPT_MATH_FR_G4_T1_UNITS: MathFrG4T1Unit[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "Première",
    title: "Unité 1 : La Valeur de position",
    printedHead: "UNITÉ 1",
    bookFrom: 1,
    bookTo: 20,
    lessons: [
      {
        key: "1-1",
        ordinal: "Première",
        type: LECON,
        title: "Les grands nombres",
        printedHead: "LEÇON 1 Les grands nombres",
        bookFrom: 1,
        concepts: [
          lessonHead(1, "LEÇON 1 Les grands nombres"),
          objectifs(1),
          acces(1),
          construis(1),
          verifie(2, T_VERIFIE_TON),
          liens(2),
          concept(2, PRATIQUE, T_PRATIQUE_U1L1),
        ],
      },
      {
        key: "1-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Changer les valeurs de position",
        printedHead: "LEÇON 2 Changer les valeurs de position",
        bookFrom: 3,
        concepts: [
          lessonHead(3, "LEÇON 2 Changer les valeurs de position"),
          objectifs(3),
          acces(3),
          construis(3),
          verifie(4, T_VERIFIE_TON),
          liens(4),
        ],
      },
      {
        key: "1-3",
        ordinal: "Troisième",
        type: LECON,
        title: "De nombreuses façons d’écrire les nombres",
        printedHead: "LEÇON 3 De nombreuses façons d’écrire les nombres",
        bookFrom: 5,
        concepts: [
          lessonHead(5, "LEÇON 3 De nombreuses façons d’écrire les nombres"),
          objectifs(5),
          acces(5),
          construis(5),
          verifie(6, T_VERIFIE_TON),
          liens(6),
        ],
      },
      {
        key: "1-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Composer et décomposer",
        printedHead: "LEÇON 4 Composer et décomposer",
        bookFrom: 7,
        concepts: [
          lessonHead(7, "LEÇON 4 Composer et décomposer"),
          objectifs(7),
          acces(7),
          construis(7),
          verifie(9, T_VERIFIE_TON),
          liens(9),
        ],
      },
      {
        key: "1-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "La comparaison de grands nombres",
        printedHead: "LEÇON 5 La comparaison de grands nombres",
        bookFrom: 10,
        concepts: [
          lessonHead(10, "LEÇON 5 La comparaison de grands nombres"),
          objectifs(10),
          acces(10),
          construis(10),
          verifie(11, T_VERIFIE_TON),
          liens(11),
        ],
      },
      {
        key: "1-6",
        ordinal: "Sixième",
        type: LECON,
        title: "Comparer des nombres sous plusieurs formes",
        printedHead: "LEÇON 6 Comparer des nombres sous plusieurs formes",
        bookFrom: 12,
        concepts: [
          lessonHead(12, "LEÇON 6 Comparer des nombres sous plusieurs formes"),
          objectifs(12),
          acces(12),
          construis(12),
          verifie(14, T_VERIFIE_TA),
          liens(14),
        ],
      },
      {
        key: "1-7",
        ordinal: "Septième",
        type: LECON,
        title: "Nombres croissants et décroissants",
        printedHead: "LEÇON 7 Nombres croissants et décroissants",
        bookFrom: 15,
        concepts: [
          lessonHead(15, "LEÇON 7 Nombres croissants et décroissants"),
          objectifs(15),
          acces(15),
          construis(15),
          verifie(17, T_VERIFIE_TA),
          liens(17),
        ],
      },
      {
        key: "1-8",
        ordinal: "Huitième",
        type: LECON,
        title: "Règles de Faire une approximation des nombres",
        printedHead: "LEÇON 8 Règles de Faire une approximation des nombres",
        bookFrom: 18,
        concepts: [
          lessonHead(18, "LEÇON 8 Règles de Faire une approximation des nombres"),
          objectifs(18),
          acces(18),
          construis(18),
          verifie(20, T_VERIFIE_TA),
          liens(20),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "Deuxième",
    title: "Unité 2 : Stratégies d’Addition et de Soustraction",
    printedHead: "UNITÉ 2",
    bookFrom: 21,
    bookTo: 36,
    lessons: [
      {
        key: "2-1",
        ordinal: "Première",
        type: LECON,
        title: "Propriétés de l’addition",
        printedHead: "LEÇON 1 Propriétés de l’addition",
        bookFrom: 22,
        concepts: [
          lessonHead(22, "LEÇON 1 Propriétés de l’addition"),
          objectifs(22),
          acces(22),
          construis(22),
          verifie(24, T_VERIFIE_TON),
          liens(24),
        ],
      },
      {
        key: "2-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Addition avec regroupement",
        printedHead: "LEÇON 2 Addition avec regroupement",
        bookFrom: 25,
        concepts: [
          lessonHead(25, "LEÇON 2 Addition avec regroupement"),
          objectifs(25),
          acces(25),
          construis(26),
          verifie(26, T_VERIFIE_TA),
          liens(26),
        ],
      },
      {
        key: "2-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Soustraction avec regroupement",
        printedHead: "LEÇO N 3 Soustraction avec regroupement",
        bookFrom: 27,
        concepts: [
          lessonHead(27, "LEÇO N 3 Soustraction avec regroupement"),
          objectifs(27),
          acces(27),
          construis(28),
          verifie(29, T_VERIFIE_TA),
          liens(29),
        ],
      },
      {
        key: "2-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Modèles de barres, variables et Problèmes d’histoire",
        printedHead: "LEÇON 4 Modèles de barres, variables et Problèmes d’histoire",
        bookFrom: 30,
        concepts: [
          lessonHead(30, "LEÇON 4 Modèles de barres, variables et Problèmes d’histoire"),
          objectifs(30),
          acces(30),
          construis(30),
          verifie(32, T_VERIFIE_TON),
          liens(32),
        ],
      },
      {
        key: "2-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "Résoudre les problèmes en plusieurs étapes avec addition et soustraction",
        printedHead: "LEÇON 5 Résoudre les problèmes en plusieurs étapes avec addition et soustraction",
        bookFrom: 33,
        concepts: [
          lessonHead(33, "LEÇON 5 Résoudre les problèmes en plusieurs étapes avec addition et soustraction"),
          objectifs(33),
          acces(33),
          construis(33),
          verifie(36, T_VERIFIE_TON),
          liens(36),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "Troisième",
    title: "Unité 3 : Concepts de mesure",
    printedHead: "UNITÉ 3",
    bookFrom: 37,
    bookTo: 55,
    lessons: [
      {
        key: "3-1",
        ordinal: "Première",
        type: LECON,
        title: "Mesurer la longueur",
        printedHead: "LEÇON 1 Mesurer la longueur",
        bookFrom: 38,
        concepts: [
          lessonHead(38, "LEÇON 1 Mesurer la longueur"),
          objectifs(38),
          acces(38),
          construis(38),
          verifie(40, T_VERIFIE_TON),
          liens(40),
        ],
      },
      {
        key: "3-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Mesure de masse",
        printedHead: "LEÇON 2 Mesure de masse",
        bookFrom: 41,
        concepts: [
          lessonHead(41, "LEÇON 2 Mesure de masse"),
          objectifs(41),
          acces(41),
          construis(41),
          verifie(42, T_VERIFIE_TA),
          liens(42),
        ],
      },
      {
        key: "3-3",
        ordinal: "Troisième",
        type: LECON,
        title: "unités de mesure la capacité",
        printedHead: "LEÇON 3 unités de mesure la capacité",
        bookFrom: 43,
        concepts: [
          lessonHead(43, "LEÇON 3 unités de mesure la capacité"),
          objectifs(43),
          acces(43),
          construis(43),
          verifie(45, T_VERIFIE_TA),
          liens(45),
        ],
      },
      {
        key: "3-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Les unités de temps",
        printedHead: "LEÇON 4 Les unités de temps",
        bookFrom: 46,
        concepts: [
          lessonHead(46, "LEÇON 4 Les unités de temps"),
          objectifs(46),
          acces(46),
          construis(46),
          verifie(47, T_VERIFIE_TON),
          liens(47),
        ],
      },
      {
        key: "3-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "Le temps passé",
        printedHead: "LEÇON 5 Le temps passé",
        bookFrom: 48,
        concepts: [
          lessonHead(48, "LEÇON 5 Le temps passé"),
          objectifs(48),
          acces(48),
          construis(49),
          verifie(50, T_VERIFIE_TA),
          liens(50),
        ],
      },
      {
        key: "3-6",
        ordinal: "Sixième",
        type: LECON,
        title: "Application de la mesure 1",
        printedHead: "LEÇON 6 Application de la mesure 1",
        bookFrom: 51,
        concepts: [
          lessonHead(51, "LEÇON 6 Application de la mesure 1"),
          objectifs(51),
          acces(51),
          construis(51),
          verifie(53, T_VERIFIE_TA),
          liens(53),
        ],
      },
      {
        key: "3-7",
        ordinal: "Septième",
        type: LECON,
        title: "Application de la mesure 2",
        printedHead: "LEÇON 7 Application de la mesure 2",
        bookFrom: 54,
        concepts: [
          lessonHead(54, "LEÇON 7 Application de la mesure 2"),
          objectifs(54),
          acces(54),
          construis(54),
          verifie(55, T_VERIFIE_TON),
          liens(55),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "Quatrième",
    title: "Unité 4 : Aire et périmètre",
    printedHead: "UNITÉ 4",
    bookFrom: 56,
    bookTo: 67,
    lessons: [
      {
        key: "4-1",
        ordinal: "Première",
        type: LECON,
        title: "Trouver le périmètre",
        printedHead: "LEÇON 1 Trouver le périmètre",
        bookFrom: 57,
        concepts: [
          lessonHead(57, "LEÇON 1 Trouver le périmètre"),
          objectifs(57),
          acces(57),
          construis(57),
          verifie(59, T_VERIFIE_TON),
          liens(59),
        ],
      },
      {
        key: "4-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Trouver l’aire",
        printedHead: "LEÇON 2 Trouver l’aire",
        bookFrom: 60,
        concepts: [
          lessonHead(60, "LEÇON 2 Trouver l’aire"),
          objectifs(60),
          acces(60),
          construis(60),
          verifie(61, T_VERIFIE_TON),
          liens(61),
        ],
      },
      {
        key: "4-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Dimensions inconnues",
        printedHead: "LEÇON 3 Dimensions inconnues",
        bookFrom: 62,
        concepts: [
          lessonHead(62, "LEÇON 3 Dimensions inconnues"),
          objectifs(62, T_OBJECTIFS_P),
          acces(62),
          construis(62),
          verifie(63, T_VERIFIE_TON),
          liens(63),
        ],
      },
      {
        key: "4-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Formes complexes",
        printedHead: "LEÇON 4 Formes complexes",
        bookFrom: 64,
        concepts: [
          lessonHead(64, "LEÇON 4 Formes complexes"),
          objectifs(64),
          acces(64),
          construis(65),
          verifie(67, T_VERIFIE_TON),
          liens(67),
        ],
      },
    ],
  },
  {
    key: "5",
    kind: "unit",
    ordinal: "Cinquième",
    title: "Unité 5 : Multiplication en tant que relation",
    printedHead: "UNITÉ 5",
    bookFrom: 68,
    bookTo: 82,
    lessons: [
      {
        key: "5-1",
        ordinal: "Première",
        type: LECON,
        title: "Comparaison des nombres en utilisant la multiplication",
        printedHead: "LEÇON 1 Comparaison des nombres en utilisant la multiplication",
        bookFrom: 69,
        concepts: [
          lessonHead(69, "LEÇON 1 Comparaison des nombres en utilisant la multiplication"),
          objectifs(69, T_OBJECTIFS_S),
          acces(69),
          construis(69),
          verifie(70, T_VERIFIE_TA),
          liens(70),
        ],
      },
      {
        key: "5-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Création d'équation de comparaison multiplicative",
        printedHead: "LEÇON 2 Création d'équation de comparaison multiplicative",
        bookFrom: 71,
        concepts: [
          lessonHead(71, "LEÇON 2 Création d'équation de comparaison multiplicative"),
          objectifs(71, T_OBJECTIFS_S),
          acces(71),
          construis(72),
          verifie(72, T_VERIFIE_TON),
          liens(72),
        ],
      },
      {
        key: "5-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Résolution d’équation de comparaison multiplicative",
        printedHead: "LEÇON 3 Résolution d’équation de comparaison multiplicative",
        bookFrom: 73,
        concepts: [
          lessonHead(73, "LEÇON 3 Résolution d’équation de comparaison multiplicative"),
          objectifs(73),
          acces(73),
          construis(73),
          verifie(74, T_VERIFIE_TA),
          liens(74),
        ],
      },
      {
        key: "5-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Propriété commutative de multiplication",
        printedHead: "LEÇON 4 Propriété commutative de multiplication",
        bookFrom: 75,
        concepts: [
          lessonHead(75, "LEÇON 4 Propriété commutative de multiplication"),
          objectifs(75, T_OBJECTIFS_S),
          acces(75),
          construis(75),
          verifie(76, T_VERIFIE_TA),
          liens(76),
        ],
      },
      {
        key: "5-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "la propriété d'identité et la propriété de zéro de Multiplication",
        printedHead: "LEÇON 5 la propriété d'identité et la propriété de zéro de Multiplication",
        bookFrom: 77,
        concepts: [
          lessonHead(77, "LEÇON 5 la propriété d'identité et la propriété de zéro de Multiplication"),
          objectifs(77, T_OBJECTIFS_S),
          acces(77),
          construis(77),
          verifie(78, T_VERIFIE_TA),
          liens(78),
        ],
      },
      {
        key: "5-6",
        ordinal: "Sixième",
        type: LECON,
        title: "propriété associative de la multiplication",
        printedHead: "LEÇON 6 propriété associative de la multiplication",
        bookFrom: 79,
        concepts: [
          lessonHead(79, "LEÇON 6 propriété associative de la multiplication"),
          objectifs(79, T_OBJECTIFS_S),
          acces(79),
          construis(79),
          verifie(80, T_VERIFIE_TON),
          liens(80),
        ],
      },
      {
        key: "5-7",
        ordinal: "Septième",
        type: LECON,
        title: "Application de modèles dans la Multiplication",
        printedHead: "LEÇON 7 Application de modèles dans la Multiplication",
        bookFrom: 81,
        concepts: [
          lessonHead(81, "LEÇON 7 Application de modèles dans la Multiplication"),
          objectifs(81),
          acces(81),
          construis(81),
          verifie(82, T_VERIFIE_TA),
          liens(82),
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "unit",
    ordinal: "Sixième",
    title: "Unité 6 : Facteurs et Multiples",
    printedHead: "UNITÉ 6",
    bookFrom: 83,
    bookTo: 96,
    lessons: [
      {
        key: "6-1",
        ordinal: "Première",
        type: LECON,
        title: "Identification des facteurs des Nombres entiers",
        printedHead: "LEÇON 1 Identification des facteurs des Nombres entiers",
        bookFrom: 84,
        concepts: [
          lessonHead(84, "LEÇON 1 Identification des facteurs des Nombres entiers"),
          objectifs(84, T_OBJECTIFS_S),
          acces(84),
          construis(84),
          verifie(85, T_VERIFIE_TON),
          liens(85),
        ],
      },
      {
        key: "6-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Nombres premiers et composés",
        printedHead: "LEÇON 2 Nombres premiers et composés",
        bookFrom: 86,
        concepts: [
          lessonHead(86, "LEÇON 2 Nombres premiers et composés"),
          objectifs(86, T_OBJECTIFS_S),
          acces(86),
          construis(86),
          verifie(88, T_VERIFIE_TON),
          liens(88),
        ],
      },
      {
        key: "6-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Le Plus Grand Commun Diviseur (P.G.C.D)",
        printedHead: "LEÇON 3 Le Plus Grand Commun Diviseur (P.G.C.D)",
        bookFrom: 89,
        concepts: [
          lessonHead(89, "LEÇON 3 Le Plus Grand Commun Diviseur (P.G.C.D)"),
          objectifs(89, T_OBJECTIFS_S),
          acces(89),
          construis(89),
          verifie(90, T_VERIFIE_TON),
          liens(90),
        ],
      },
      {
        key: "6-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Identification des multiples de nombres entiers",
        printedHead: "LEÇON 4 Identification des multiples de nombres entiers",
        bookFrom: 91,
        concepts: [
          lessonHead(91, "LEÇON 4 Identification des multiples de nombres entiers"),
          objectifs(91),
          acces(91),
          construis(92),
          verifie(92, T_VERIFIE_TA),
          liens(92),
        ],
      },
      {
        key: "6-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "Multiples communs",
        printedHead: "LEÇON 5 Multiples communs",
        bookFrom: 93,
        concepts: [
          lessonHead(93, "LEÇON 5 Multiples communs"),
          objectifs(93),
          acces(93),
          construis(93),
          verifie(94, T_VERIFIE_TON),
          liens(94),
        ],
      },
      {
        key: "6-6",
        ordinal: "Sixième",
        type: LECON,
        title: "Relations entre les facteurs et les multiples",
        printedHead: "LEÇON 6 Relations entre les facteurs et les multiples",
        bookFrom: 95,
        concepts: [
          lessonHead(95, "LEÇON 6 Relations entre les facteurs et les multiples"),
          objectifs(95, T_OBJECTIFS_S),
          acces(95),
          construis(95),
          verifie(96, T_VERIFIE_TON),
          liens(96),
        ],
      },
    ],
  },
  {
    key: "7",
    kind: "unit",
    ordinal: "Septième",
    title: "Unité 7 : Multiplication et division : Calcul et relations",
    printedHead: "UNITÉ 7",
    bookFrom: 97,
    bookTo: 120,
    lessons: [
      {
        key: "7-1",
        ordinal: "Première",
        type: LECON,
        title: "La stratégie de modéle de l'aire",
        printedHead: "LEÇON 1 La stratégie de modéle de l'aire",
        bookFrom: 98,
        concepts: [
          lessonHead(98, "LEÇON 1 La stratégie de modéle de l'aire"),
          objectifs(98, T_OBJECTIFS_S),
          acces(98),
          construis(98),
          verifie(99, T_VERIFIE_TA),
          liens(99),
        ],
      },
      {
        key: "7-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "La propriété distributive",
        printedHead: "LEÇON 2 La propriété distributive",
        bookFrom: 100,
        concepts: [
          lessonHead(100, "LEÇON 2 La propriété distributive"),
          objectifs(100, T_OBJECTIFS_S),
          acces(100),
          construis(100),
          verifie(101, T_VERIFIE_TON),
          liens(101),
        ],
      },
      {
        key: "7-3",
        ordinal: "Troisième",
        type: LECON,
        title: "L'algorithme des produits partiels",
        printedHead: "LEÇON 3 L'algorithme des produits partiels",
        bookFrom: 102,
        concepts: [
          lessonHead(102, "LEÇON 3 L'algorithme des produits partiels"),
          objectifs(102),
          acces(102),
          construis(102),
          verifie(104, T_VERIFIE_TON),
          liens(104),
        ],
      },
      {
        key: "7-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Multiplication à un chiffre",
        printedHead: "LEÇON 4 Multiplication à un chiffre",
        bookFrom: 105,
        concepts: [
          lessonHead(105, "LEÇON 4 Multiplication à un chiffre"),
          objectifs(105, T_OBJECTIFS_S),
          acces(105),
          construis(105),
          verifie(106, T_VERIFIE_TON),
          liens(106),
        ],
      },
      {
        key: "7-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "Multiplication à deux chiffres de 10",
        printedHead: "LEÇON 5 Multiplication à deux chiffres de 10",
        bookFrom: 107,
        concepts: [
          lessonHead(107, "LEÇON 5 Multiplication à deux chiffres de 10"),
          objectifs(107, T_OBJECTIFS_S),
          acces(107),
          construis(107),
          verifie(108, T_VERIFIE_TON),
          liens(108),
        ],
      },
      {
        key: "7-6",
        ordinal: "Sixième",
        type: LECON,
        title: "Explorer les restes",
        printedHead: "LEÇON 6 Explorer les restes",
        bookFrom: 109,
        concepts: [
          lessonHead(109, "LEÇON 6 Explorer les restes"),
          objectifs(109),
          acces(109),
          construis(109),
          verifie(110, T_VERIFIE_TON),
          liens(110),
        ],
      },
      {
        key: "7-7",
        ordinal: "Septième",
        type: LECON,
        title: "Modèle de la division",
        printedHead: "LEÇON 7 Modèle de la division",
        bookFrom: 111,
        concepts: [
          lessonHead(111, "LEÇON 7 Modèle de la division"),
          objectifs(111),
          acces(111),
          construis(112),
          verifie(113, T_VERIFIE_TON),
          liens(113),
        ],
      },
      {
        key: "7-8",
        ordinal: "Huitième",
        type: LECON,
        title: "Modèle de l’aire et la division",
        printedHead: "LEÇON 8 Modèle de l’aire et la division",
        bookFrom: 114,
        concepts: [
          lessonHead(114, "LEÇON 8 Modèle de l’aire et la division"),
          objectifs(114),
          acces(114),
          construis(114),
          verifie(114, T_VERIFIE_TON),
          liens(114),
        ],
      },
      {
        key: "7-9",
        ordinal: "Neuvième",
        type: LECON,
        title: "L’algorithme des quotients partiels",
        printedHead: "LEÇON 9 L’algorithme des quotients partiels",
        bookFrom: 115,
        concepts: [
          lessonHead(115, "LEÇON 9 L’algorithme des quotients partiels"),
          objectifs(115),
          acces(115),
          construis(115),
          verifie(116, T_VERIFIE_TON),
          liens(116),
        ],
      },
      {
        key: "7-10",
        ordinal: "Dixième",
        type: LECON,
        title: "L’algorithme de division standard",
        printedHead: "LEÇON 10 L’algorithme de division standard",
        bookFrom: 117,
        concepts: [
          lessonHead(117, "LEÇON 10 L’algorithme de division standard"),
          objectifs(117),
          acces(117),
          construis(117),
          verifie(118, T_VERIFIE_TON),
          liens(118),
        ],
      },
      {
        key: "7-11",
        ordinal: "Onzième",
        type: LECON,
        title: "Division et multiplication",
        printedHead: "LEÇON 11 Division et multiplication",
        bookFrom: 119,
        concepts: [
          lessonHead(119, "LEÇON 11 Division et multiplication"),
          objectifs(119),
          acces(119),
          construis(119),
          verifie(120, T_VERIFIE_TON),
          liens(120),
        ],
      },
    ],
  },
  {
    key: "8",
    kind: "unit",
    ordinal: "Huitième",
    title: "Unité 8 : Ordre des Opérations",
    printedHead: "UNITÉ 8",
    bookFrom: 121,
    bookTo: 125,
    lessons: [
      {
        key: "8-1",
        ordinal: "Première",
        type: LECON,
        title: "Ordre des opérations",
        printedHead: "LEÇON 1 Ordre des opérations",
        bookFrom: 122,
        concepts: [
          lessonHead(122, "LEÇON 1 Ordre des opérations"),
          objectifs(122),
          acces(122),
          construis(122),
          verifie(123, T_VERIFIE_TON),
          liens(123),
        ],
      },
      {
        key: "8-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "L’ordre des opérations et Problèmes",
        printedHead: "LEÇON 2 L’ordre des opérations et Problèmes",
        bookFrom: 124,
        concepts: [
          lessonHead(124, "LEÇON 2 L’ordre des opérations et Problèmes"),
          objectifs(124, T_OBJECTIFS_P),
          acces(124),
          construis(124),
          verifie(125, T_VERIFIE_TON),
          liens(125),
        ],
      },
    ],
  },
];

/**
 * The book-page span a lesson owns: from the unit opener (its first lesson)
 * or its own head page, down to the page before the next lesson starts,
 * bounded by the unit. The folio-less unit openers (books 21, 37, 56, 68,
 * 83, 97, 121) therefore ride with their unit's first lesson, exactly as
 * the other Egyptian Mathematics specs keep openers inside the owning
 * lesson's range.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_MATH_FR_G4_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_FR_G4_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This term has
 * no appendix: every page of the term belongs to a unit. Kept as a function
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
  "math-fr-g4-t1",
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
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(unitIndex, lessonIndex);
  const lesson = EGYPT_MATH_FR_G4_T1_UNITS[unitIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(from, to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/**
 * Folds text for comparison: lowercases and removes every non-letter/digit,
 * so punctuation, apostrophes, spacing and line breaks can never break a
 * match (this is what lets «ACC È S»/«A CCÈS» match «ACCÈS» and wrapped
 * heads match their single-line transcription).
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring case and OCR spacing/punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints. Even pages print the folio at
 * the start of the first line («2 UNITÉ», «6», «22 22 Utilisation …», «100
 * Multiplication …», «122 Photo Credit: …»); the four «Mesure du temps»
 * even pages (48, 50, 52, 54) print it instead at the end of their header
 * block («CONCEPT 2 48» …). Odd pages print it before «Leçon» («23 Leçon
 * 1: …», «Concept : 31 Leçon 4: …») or after the lesson title («Leçon 4:
 * Composer et décomposer 7», «L eçon 3: … 27 Photo Credit: …»); book 1
 * prints it mid-page with the same wording plus a «1 CONCEPT 1» footer, and
 * book 75 doubles its head («Leçon 4: … 75 Leçon 4: …»), whose folio reads
 * from the digits before the second «Leçon».
 * Only folio-specific patterns count, on the first line, the header block
 * and the last lines: bare numerals elsewhere are unit numbers, clock faces
 * and exercise counts. The big «LEÇON N» heads carry no colon, so the
 * trailing pattern (which requires one) can never mistake a head number for
 * a folio — and the mid-page «CONCEPT 1 Leçon 1: … 71» printer oddity on
 * book 69 stays outside every window.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const out: number[] = [];
  const push = (n: number): void => {
    if (n > 0 && !out.includes(n)) out.push(n);
  };

  const EVEN_HEAD =
    /^(\d+)\s+(\d+\s+)?(UNITÉ|Utilisation|Mesure|Explorer|Comparaisons|Propriétés|Comprendre|Multiplication|Division|Résolution|Ordre|Photo)(?=\s|$)/;
  const LEAD_LECON = /^(\d+)\s+L\s*eçon\b/;
  const LEAD_CONCEPT_LECON = /^Concept\s*:\s*(\d+)\s+L\s*eçon\b/;
  const SANDWICH = /(\d+)\s+L\s*eçon/;
  const TRAIL_LECON = /L\s*eçon\s*\d*\s*:[^\n]*?(\d+)\s*(Photo Credit[^\n]*|Crédit photo[^\n]*|©[^\n]*)?$/;
  const CONCEPT_FOLIO = /CONCEPT\s+[12]\s+(\d{2,3})/;
  const UNIT_FOOTER = /^(\d+)\s+CONCEPT\s+[12]\s*$/;

  const first = lines[0]!;
  let match: RegExpMatchArray | null;
  if (/^\d+\s*$/.test(first) || /^\d+\s+\d+\s*$/.test(first)) {
    push(Number(first.split(/\s+/)[0]));
  } else if ((match = first.match(EVEN_HEAD)) !== null) {
    push(Number(match[1]));
  }
  const leadFirst = first.match(LEAD_LECON);
  if (leadFirst !== null) push(Number(leadFirst[1]));
  if ((match = first.match(LEAD_CONCEPT_LECON)) !== null) push(Number(match[1]));
  if ((match = first.match(SANDWICH)) !== null) push(Number(match[1]));
  // A line that opens with its own folio needs no second opinion: reading the
  // trailing number as well would mistake title-internal numerals for folios
  // (book 107's head ends «… chiffres de 1 Crédit photo : …»).
  if (leadFirst === null && (match = first.match(TRAIL_LECON)) !== null) push(Number(match[1]));

  for (const line of lines.slice(1, 6)) {
    if ((match = line.match(CONCEPT_FOLIO)) !== null) push(Number(match[1]));
  }

  for (const line of lines.slice(-5)) {
    const lead = line.match(LEAD_LECON);
    if (lead !== null) push(Number(lead[1]));
    if ((match = line.match(LEAD_CONCEPT_LECON)) !== null) push(Number(match[1]));
    if (lead === null && (match = line.match(TRAIL_LECON)) !== null) push(Number(match[1]));
    if ((match = line.match(UNIT_FOOTER)) !== null) push(Number(match[1]));
  }

  return out;
}

/**
 * The book number a content page prints in its running head, or null. Every
 * content page carries a folio that is exactly its own number, which is what
 * fixes the offset; the pages named in `FOLIO_LESS_ANCHORS` carry no
 * parseable folio and are handled there instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * Folios whose OCR printed a different, still parseable number. This book
 * has none: every folio line the checker reads came out right, so the map is
 * empty and the folio check stays exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * Term pages that print no parseable folio in the text layer, each with the
 * anchor the check accepts in place of a page number: the seven folio-less
 * UNITÉ video openers, each anchored on its video title.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  21: "Calcul des fourmis",
  37: "C’est la vie d’une fourmi",
  56: "Fourmis affamée",
  68: "Moments de multiplication",
  83: "Facteurs d'autoroute",
  97: "Port à conteneurs",
  121: "Commander",
};

/** Every band kind this book prints. */
const KNOWN_KINDS = new Set([LECON, OBJECTIFS, ACCES, CONSTRUIS, VERIFIE, LIENS, PRATIQUE]);

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every
 * range sits inside its unit, concept kinds are known, concept pages rise
 * inside their lesson, the units tile the term without gaps or overlaps, and
 * the first/last units hit the book's own bounds. A content mistake here
 * would quietly ground the tutor on the wrong pages, so it fails loudly
 * instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_FR_G4_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_MATH_FR_G4_T1_BOOK_START) {
    problems.push(`First section must start at page ${EGYPT_MATH_FR_G4_T1_BOOK_START}, found ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_FR_G4_T1_BOOK_END) {
    problems.push(`Last section must end at page ${EGYPT_MATH_FR_G4_T1_BOOK_END}, found ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from
 *     its printed folio, or, on the seven folio-less unit openers, from the
 *     anchor named in `FOLIO_LESS_ANCHORS`;
 *  2. every unit opener prints the unit head and every lesson's first page
 *     prints that lesson's head;
 *  3. every lesson's title and every band's head is printed on the pages the
 *     lesson owns (the band on its own page);
 *  4. every printed page in [1, 125] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page
 *     of the term the scans prove, i.e. `_BOOK_END - _BOOK_START + 1` minus
 *     `MISSING_SCANS`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_MATH_FR_G4_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_FR_G4_T1_BOOK_START || book > EGYPT_MATH_FR_G4_T1_BOOK_END) continue;
    pagesChecked += 1;
    const text = loadBookPage(book);
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
    EGYPT_MATH_FR_G4_T1_BOOK_END - EGYPT_MATH_FR_G4_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `Book fabric: ${printedPages.size} pages read between ${EGYPT_MATH_FR_G4_T1_BOOK_START} and ${EGYPT_MATH_FR_G4_T1_BOOK_END}, expected ${expectedPages}`,
    );
  }

  // 2 + 3a. every unit opener prints the unit head, every lesson's first
  // page its head, and every lesson's title is printed somewhere in the
  // pages it owns.
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
  for (let p = EGYPT_MATH_FR_G4_T1_BOOK_START; p <= EGYPT_MATH_FR_G4_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`Page ${p} owned by no lesson`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
