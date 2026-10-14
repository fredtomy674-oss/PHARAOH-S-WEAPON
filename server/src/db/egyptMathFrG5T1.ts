// Primary 5 (Cinquième Primaire) Mathematics, French-medium, first term,
// Ministry of Education and Technical Education 2025/2026 edition (the cover
// imprint prints «2025 - 2026» and the back matter the Discovery copyright).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g5-math-fr`, subject `math-fr` (name "Mathematics"), lesson prefix
// `l-g5-math-fr-`, grade `grade-5` (name "Primary 5").
//
// The curriculum tree for the Egypt `eg-g5-math-fr` curriculum is rebuilt from
// the Ministry textbook `MATHÉMATIQUES — 5e primaire — 1er semestre`
// (140 scanned pages). This module is the single source of truth for its
// structure: the six printed unités of the first term, every numbered leçon
// inside them (46 in all, exactly as the book's own «Table des matières» on
// scans 2–4 lists them), and, for every lesson, the book's own printed heads —
// the lesson head plus the three activity sections every lesson prints
// (ACCÈS / CONSTRUIS TES CONNAISSANCES / FAIS LES LIENS) — verbatim and with
// the printed page they start on. The self-checks at the bottom prove that
// mapping against the OCR itself, page by page.
//
// THE OFFSET IS EIGHT — book page = scan page − 8
// Every content page that carries a folio prints it in its running head, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scans and quoted here: scan 11 prints
// «3» (book 3, the Leçon 1-1 opener), scan 18 prints «10 Leçon 2 … 10»
// (book 10), scan 52 prints «44 Leçon 1 … 44» (book 44, the Unité-2 first
// lesson), scan 100 prints «92 Leçon 1 … 92» (book 92, the Unité-5 first
// lesson) and scan 139 prints «Concept : 131 Leçon 4 … 131» (book 131, the
// term's last page). The book's own contents (scans 2–4) independently
// confirms the lesson starts: every «Leçon» sits exactly where the contents
// says it does, with the U6 exceptions noted below.
//
// TERM = THE TYPED BOOK PAGES (books 2–131)
// Scan pages 1–9 are before the term: the cover (1), the printed «Table des
// matières» (2–4) and the «PREFACE» / parent letters (5–9, folios «v»…«ix»).
// Scan page 140 is after the term (the Discovery copyright / print-specs
// page). The term runs from the Unité-1 opener (book 2 = scan 10) to the last
// page of Unité 6 (book 131 = scan 139): `EGYPT_MATH_FR_G5_T1_BOOK_START` /
// `_BOOK_END` are exactly those two pages, and the tiling assertion proves
// nothing in between is left unreachable. `pagesChecked` is therefore
// 131 − 2 + 1 = 130 (no scan of the term is missing).
//
// FOUR TERM PAGES PRINT NO FOLIO — EACH IS A UNIT OPENER BY DESIGN
// Books 2, 64, 80 and 120 are the «Unité» openers of unités 1, 3, 4 and 6;
// none prints a page number (the openers of unités 2 and 5 do print one:
// book 43 prints «43», book 91 prints «91 91 91»). Rather than weaken the
// page-number check, these four are anchored on the unit head each page
// itself prints, named in `FOLIO_LESS_ANCHORS`. Every other term page proves
// its own number from the running head, so `FOOTER_OCR_MISREADS` is empty
// and `MISSING_SCANS` is empty.
//
// THE FOLIO CHECK READS THE RUNNING HEAD'S FIRST LINES
// Even pages print «N Leçon … N» (folio at both ends), odd pages print
// «Leçon … N» (folio at the end), openers print a bare «N», U5 lessons print
// «Concept Video: Video N Leçon … N» and the U5 concept dividers print
// «Concept : N». Three pages split the head across two lines (books 70, 76
// and 78 print «Leçon …» on the first line and the bare folio on the second),
// so `footerCandidates` reads the first six non-empty lines and returns every
// numeral there; `printedFooter` returns the page's own number when present,
// otherwise the largest candidate (so a wrong page still reports a number).
// Lesson numbers (1–13), unit numbers and concept numbers join the candidate
// set harmlessly: the page's own number proves the mapping when present.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// The avant-propos (scan 9) states the pedagogy itself: «Chaque leçon a trois
// principaux sections : ACCÈS, CONSTRUIS TES CONNAISSANCES et FAIS LES
// LIENS». Every one of the 46 lessons contributes its head line (number +
// title, exactly as the opener prints it) plus those three section heads, in
// page order, each with the first page of the lesson's range that prints it.
// Nothing is invented: every concept title below is a string the book itself
// prints on the page its `bookFrom` names. The «Objectif(s)
// d'apprentissage» bullets and the closing «Vérifie ton acquisition» line
// carry no lesson-specific head of their own — they ride with the section
// that prints them — so they contribute no concept of their own.
//
// TEXT-LAYER QUIRKS RECORDED, NOT WORKED AROUND
// `normalize` is case-insensitive and drops every non-letter/digit, so
// spacing, punctuation, colons and apostrophes can never break a match — the
// running heads' missing spaces («décimauxjusqu’aux», «valeurde»,
// «décomposerdes», «régularitésnumériques», «l’airedu», «desdixièmes») match
// the clean titles stored below. One opener is damaged in the layer:
// book 72 (U3-3) prints «LE«ON 3» and «ACC»S» (angle quotes for Ç/È), so its
// lesson head is stored as the title alone (which the page prints correctly)
// and its ACCÈS concept keeps the verbatim «ACC»S». Book 72's folio is a
// bare «72» and book 81's (U4-1) head has no running «Leçon 1:» line, so both
// store the title alone as `printedHead`, exactly as the Grade-1 French book
// stores openers that print the title without its number.
//
// THREE GENUINE CONTENTS ANOMALIES
//  1. U2-8: the contents lists «Facteurs ou multiples» (p. 62) but the head
//     printed on book 62 reads «Facteurs et multiples» — the spec follows
//     the printed page.
//  2. U3-3: the contents lists «la multiplication des nombres compose de 2
//     chiffres …» (p. 72) but the head printed on book 72 reads «La
//     multiplication des nombres compose de deux chiffres en utilisant
//     l'algorithme standard» — the spec follows the printed page.
//  3. Unité 6: the contents lists «Leçon 1 Expressions numériques» (p. 121)
//     and «Leçon 4 Identifier les les modèles numériques» (p. 128), but the
//     heads printed on books 121 and 128 read «l'ordre des opérations
//     mathématiques» and «Identifier les régularités numériques» — the spec
//     follows the printed pages.
//
// THE UNIT OPENER RIDES WITH THE FIRST LESSON
// Each unit's first lesson starts on the unit's own opener page range (which
// prints «UNITÉ N» and then the lesson head on the next page), so
// `lessonBookRange` starts a unit's first lesson at the section head,
// exactly as the other Egyptian Mathematics specs do.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 8 (verified: book p.131 = scan p.139). */
export const BOOK_TO_PDF_OFFSET = 8;

/** First printed page of the term — the Unité-1 opener (scan 10). */
export const EGYPT_MATH_FR_G5_T1_BOOK_START = 2;

/** Last printed page of the term — the last page of Unité 6 (scan 139). */
export const EGYPT_MATH_FR_G5_T1_BOOK_END = 131;

/** The scanned pages before the term: cover, Table des matières, PREFACE, parent letters. */
export const EGYPT_MATH_FR_G5_T1_FRONT_MATTER = { from: 1, to: 9 } as const;

/** The scanned pages after the term: the Discovery copyright / print-specs page. */
export const EGYPT_MATH_FR_G5_T1_BACK_MATTER = { from: 140, to: 140 } as const;

/**
 * The term pages the OCR never produced, as book pages. All 130 term pages
 * were captured, so there are none; the constant is kept so this module
 * shares the shape of the other Egyptian specs (and so the checker's
 * expected page count subtracts it).
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of a lesson — becomes one concept in the app tree. */
export interface MathFrG5T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: "Leçon", "ACCÈS", "CONSTRUIS TES CONNAISSANCES" or "FAIS LES LIENS". */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one numbered lesson of a unit). */
export interface MathFrG5T1Lesson {
  /** App-addressable key, e.g. "5-3" (unit 5, lesson 3). */
  key: string;
  /** French ordinal of the lesson number, e.g. "Troisième". */
  ordinal: string;
  /** The lesson's opening head type — its first concept's kind ("Leçon"). */
  type: string;
  /** Lesson title as printed at the head of the lesson (without the number prefix). */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: MathFrG5T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a unit — so no lesson below uses it; the
   * field is kept so this module shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed unit of the term. */
export interface MathFrG5T1Unit {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"6", in book order. */
  key: string;
  /** French ordinal of the unit as used in the app tree, e.g. "Troisième". */
  ordinal: string;
  /** Full app-facing section title, e.g. "Unité 3 : Multiplication avec des nombres entiers". */
  title: string;
  /** The unit head its opener prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next opener). */
  bookTo: number;
  lessons: MathFrG5T1Lesson[];
}

const LECON = "Leçon";
const ACCES = "ACCÈS";
const CONSTRUIS = "CONSTRUIS TES CONNAISSANCES";
const FAIS = "FAIS LES LIENS";

function concept(bookFrom: number, kind: string, title: string): MathFrG5T1Concept {
  return { bookFrom, kind, title };
}

function lessonHead(bookFrom: number, title: string): MathFrG5T1Concept {
  return concept(bookFrom, LECON, title);
}

/** One printed activity section. The section name is both the concept's kind and title. */
function band(bookFrom: number, kind: string): MathFrG5T1Concept {
  return concept(bookFrom, kind, kind);
}

/**
 * The six units of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit ranges come from the pages' own «UNITÉ N» openers: 2–42, 43–63,
 * 64–79, 80–90, 91–119 and 120–131. Lesson starts come from the «LEÇON n»
 * openers and match the book's Table des matières, except the three heads
 * noted above (U2-8, U3-3, U6-1/U6-4) where the spec follows the printed
 * page rather than the contents.
 */
export const EGYPT_MATH_FR_G5_T1_UNITS: MathFrG5T1Unit[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "Première",
    title: "Unité 1 : La Valeur de position de nombres décimaux et calcul",
    printedHead: "La Valeur de position de nombres décimaux et calcul",
    bookFrom: 2,
    bookTo: 42,
    lessons: [
      {
        key: "1-1",
        ordinal: "Première",
        type: LECON,
        title: "Les nombres décimaux jusqu’aux millièmes",
        printedHead: "Leçon 1 : Les nombres décimaux jusqu’aux millièmes",
        bookFrom: 3,
        concepts: [
          lessonHead(3, "Leçon 1 : Les nombres décimaux jusqu’aux millièmes"),
          band(3, ACCES),
          band(4, CONSTRUIS),
          band(6, FAIS),
        ],
      },
      {
        key: "1-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Changement de la valeur de position",
        printedHead: "Leçon 2 : Changement de la valeur de position",
        bookFrom: 7,
        concepts: [
          lessonHead(7, "Leçon 2 : Changement de la valeur de position"),
          band(7, ACCES),
          band(7, CONSTRUIS),
          band(10, FAIS),
        ],
      },
      {
        key: "1-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Composer et décomposer des nombres décimaux",
        printedHead: "Leçon 3 : Composer et décomposer des nombres décimaux",
        bookFrom: 11,
        concepts: [
          lessonHead(11, "Leçon 3 : Composer et décomposer des nombres décimaux"),
          band(11, ACCES),
          band(12, CONSTRUIS),
          band(14, FAIS),
        ],
      },
      {
        key: "1-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Comparer des nombres décimaux",
        printedHead: "Leçon 4 : Comparer des nombres décimaux",
        bookFrom: 15,
        concepts: [
          lessonHead(15, "Leçon 4 : Comparer des nombres décimaux"),
          band(15, ACCES),
          band(15, CONSTRUIS),
          band(16, FAIS),
        ],
      },
      {
        key: "1-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "Arrondir les décimaux",
        printedHead: "Leçon 5 : Arrondir les décimaux",
        bookFrom: 17,
        concepts: [
          lessonHead(17, "Leçon 5 : Arrondir les décimaux"),
          band(17, ACCES),
          band(17, CONSTRUIS),
          band(19, FAIS),
        ],
      },
      {
        key: "1-6",
        ordinal: "Sixième",
        type: LECON,
        title: "Estimer la somme des décimaux",
        printedHead: "Leçon 6 : Estimer la somme des décimaux",
        bookFrom: 20,
        concepts: [
          lessonHead(20, "Leçon 6 : Estimer la somme des décimaux"),
          band(20, ACCES),
          band(20, CONSTRUIS),
          band(21, FAIS),
        ],
      },
      {
        key: "1-7",
        ordinal: "Septième",
        type: LECON,
        title: "Modéliser l’addition décimale",
        printedHead: "Leçon 7 : Modéliser l’addition décimale",
        bookFrom: 22,
        concepts: [
          lessonHead(22, "Leçon 7 : Modéliser l’addition décimale"),
          band(22, ACCES),
          band(23, CONSTRUIS),
          band(28, FAIS),
        ],
      },
      {
        key: "1-8",
        ordinal: "Huitième",
        type: LECON,
        title: "Soustraire des nombres décimaux",
        printedHead: "Leçon 8 : Soustraire des nombres décimaux",
        bookFrom: 29,
        concepts: [
          lessonHead(29, "Leçon 8 : Soustraire des nombres décimaux"),
          band(29, ACCES),
          band(30, CONSTRUIS),
          band(33, FAIS),
        ],
      },
      {
        key: "1-9",
        ordinal: "Neuvième",
        type: LECON,
        title: "Estimer la différence des décimaux",
        printedHead: "Leçon 9 : Estimer la différence des décimaux",
        bookFrom: 34,
        concepts: [
          lessonHead(34, "Leçon 9 : Estimer la différence des décimaux"),
          band(34, ACCES),
          band(34, CONSTRUIS),
          band(36, FAIS),
        ],
      },
      {
        key: "1-10",
        ordinal: "Dixième",
        type: LECON,
        title: "Soustraire jusqu’aux millièmes",
        printedHead: "Leçon 10 : Soustraire jusqu’aux millièmes",
        bookFrom: 37,
        concepts: [
          lessonHead(37, "Leçon 10 : Soustraire jusqu’aux millièmes"),
          band(37, ACCES),
          band(37, CONSTRUIS),
          band(39, FAIS),
        ],
      },
      {
        key: "1-11",
        ordinal: "Onzième",
        type: LECON,
        title: "Problèmes sur les décimaux",
        printedHead: "Leçon 11 : Problèmes sur les décimaux",
        bookFrom: 40,
        concepts: [
          lessonHead(40, "Leçon 11 : Problèmes sur les décimaux"),
          band(40, ACCES),
          band(41, CONSTRUIS),
          band(42, FAIS),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "Deuxième",
    title: "Unité 2 : Relations entre les nombres",
    printedHead: "Relations entre les nombres",
    bookFrom: 43,
    bookTo: 63,
    lessons: [
      {
        key: "2-1",
        ordinal: "Première",
        type: LECON,
        title: "Expressions, Équations et Variables",
        printedHead: "Leçon 1 : Expressions, Équations et Variables",
        bookFrom: 44,
        concepts: [
          lessonHead(44, "Leçon 1 : Expressions, Équations et Variables"),
          band(44, ACCES),
          band(45, CONSTRUIS),
          band(46, FAIS),
        ],
      },
      {
        key: "2-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Variables dans les équations",
        printedHead: "Leçon 2 : Variables dans les équations",
        bookFrom: 47,
        concepts: [
          lessonHead(47, "Leçon 2 : Variables dans les équations"),
          band(47, ACCES),
          band(47, CONSTRUIS),
          band(48, FAIS),
        ],
      },
      {
        key: "2-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Raconter des histoires au moyen des nombres",
        printedHead: "Leçon 3 : Raconter des histoires au moyen des nombres",
        bookFrom: 49,
        concepts: [
          lessonHead(49, "Leçon 3 : Raconter des histoires au moyen des nombres"),
          band(49, ACCES),
          band(49, CONSTRUIS),
          band(50, FAIS),
        ],
      },
      {
        key: "2-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Décomposer en facteurs premiers",
        printedHead: "Leçon 4 : Décomposer en facteurs premiers",
        bookFrom: 51,
        concepts: [
          lessonHead(51, "Leçon 4 : Décomposer en facteurs premiers"),
          band(51, ACCES),
          band(52, CONSTRUIS),
          band(53, FAIS),
        ],
      },
      {
        key: "2-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "Le grand facteur commun (P.G.C.D)",
        printedHead: "Leçon 5 : Le grand facteur commun (P.G.C.D)",
        bookFrom: 54,
        concepts: [
          lessonHead(54, "Leçon 5 : Le grand facteur commun (P.G.C.D)"),
          band(54, ACCES),
          band(55, CONSTRUIS),
          band(55, FAIS),
        ],
      },
      {
        key: "2-6",
        ordinal: "Sixième",
        type: LECON,
        title: "Identifier les multiples",
        printedHead: "Leçon 6 : Identifier les multiples",
        bookFrom: 56,
        concepts: [
          lessonHead(56, "Leçon 6 : Identifier les multiples"),
          band(56, ACCES),
          band(57, CONSTRUIS),
          band(58, FAIS),
        ],
      },
      {
        key: "2-7",
        ordinal: "Septième",
        type: LECON,
        title: "Plus petit commun multiple (P.P.C.M)",
        printedHead: "Leçon 7 : Plus petit commun multiple (P.P.C.M)",
        bookFrom: 59,
        concepts: [
          lessonHead(59, "Leçon 7 : Plus petit commun multiple (P.P.C.M)"),
          band(59, ACCES),
          band(59, CONSTRUIS),
          band(61, FAIS),
        ],
      },
      {
        key: "2-8",
        ordinal: "Huitième",
        type: LECON,
        title: "Facteurs et multiples",
        printedHead: "Leçon 8 : Facteurs et multiples",
        bookFrom: 62,
        concepts: [
          lessonHead(62, "Leçon 8 : Facteurs et multiples"),
          band(62, ACCES),
          band(62, CONSTRUIS),
          band(63, FAIS),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "Troisième",
    title: "Unité 3 : Multiplication avec des nombres entiers",
    printedHead: "Multiplication avec des nombres entiers",
    bookFrom: 64,
    bookTo: 79,
    lessons: [
      {
        key: "3-1",
        ordinal: "Première",
        type: LECON,
        title: "Utiliser le modèle de l’aire du rectangle pour multiplier",
        printedHead: "Leçon 1 : Utiliser le modèle de l’aire du rectangle pour multiplier",
        bookFrom: 65,
        concepts: [
          lessonHead(65, "Leçon 1 : Utiliser le modèle de l’aire du rectangle pour multiplier"),
          band(65, ACCES),
          band(66, CONSTRUIS),
          band(67, FAIS),
        ],
      },
      {
        key: "3-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "La propriété de distributivité de la multiplication",
        printedHead: "Leçon 2 : La propriété de distributivité de la multiplication",
        bookFrom: 68,
        concepts: [
          lessonHead(68, "Leçon 2 : La propriété de distributivité de la multiplication"),
          band(68, ACCES),
          band(68, CONSTRUIS),
          band(71, FAIS),
        ],
      },
      {
        key: "3-3",
        ordinal: "Troisième",
        type: LECON,
        title: "La multiplication des nombres compose de deux chiffres en utilisant l’algorithme standard",
        printedHead: "La multiplication des nombres compose de deux chiffres en utilisant l’algorithme standard",
        bookFrom: 72,
        concepts: [
          lessonHead(72, "La multiplication des nombres compose de deux chiffres en utilisant l’algorithme standard"),
          concept(72, ACCES, "ACC»S"),
          band(72, CONSTRUIS),
          band(74, FAIS),
        ],
      },
      {
        key: "3-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Multiplication de nombres à plusieurs chiffres",
        printedHead: "Leçon 4 : Multiplication de nombres à plusieurs chiffres",
        bookFrom: 75,
        concepts: [
          lessonHead(75, "Leçon 4 : Multiplication de nombres à plusieurs chiffres"),
          band(75, ACCES),
          band(75, CONSTRUIS),
          band(77, FAIS),
        ],
      },
      {
        key: "3-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "Problèmes de multiplication dans le monde réel",
        printedHead: "Leçon 5 : Problèmes de multiplication dans le monde réel",
        bookFrom: 78,
        concepts: [
          lessonHead(78, "Leçon 5 : Problèmes de multiplication dans le monde réel"),
          band(78, ACCES),
          band(78, CONSTRUIS),
          band(79, FAIS),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "Quatrième",
    title: "Unité 4 : Division avec des nombres entiers",
    printedHead: "Division avec des nombres entiers",
    bookFrom: 80,
    bookTo: 90,
    lessons: [
      {
        key: "4-1",
        ordinal: "Première",
        type: LECON,
        title: "Utiliser le modèle de l’aire du rectangle pour diviser",
        printedHead: "Utiliser le modèle de l’aire du rectangle pour diviser",
        bookFrom: 81,
        concepts: [
          lessonHead(81, "Utiliser le modèle de l’aire du rectangle pour diviser"),
          band(81, ACCES),
          band(81, CONSTRUIS),
          band(82, FAIS),
        ],
      },
      {
        key: "4-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Estimer des quotients",
        printedHead: "Leçon 2 : Estimer des quotients",
        bookFrom: 83,
        concepts: [
          lessonHead(83, "Leçon 2 : Estimer des quotients"),
          band(83, ACCES),
          band(83, CONSTRUIS),
          band(84, FAIS),
        ],
      },
      {
        key: "4-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Utiliser l’algorithme standard pour diviser",
        printedHead: "Leçon 3 : Utiliser l’algorithme standard pour diviser",
        bookFrom: 85,
        concepts: [
          lessonHead(85, "Leçon 3 : Utiliser l’algorithme standard pour diviser"),
          band(85, ACCES),
          band(85, CONSTRUIS),
          band(86, FAIS),
        ],
      },
      {
        key: "4-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "La relation entre la division et la multiplication",
        printedHead: "Leçon 4 : La relation entre la division et la multiplication",
        bookFrom: 87,
        concepts: [
          lessonHead(87, "Leçon 4 : La relation entre la division et la multiplication"),
          band(87, ACCES),
          band(87, CONSTRUIS),
          band(88, FAIS),
        ],
      },
      {
        key: "4-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "Des situations-problèmes à plusieurs étapes",
        printedHead: "Leçon 5 : Des situations-problèmes à plusieurs étapes",
        bookFrom: 89,
        concepts: [
          lessonHead(89, "Leçon 5 : Des situations-problèmes à plusieurs étapes"),
          band(89, ACCES),
          band(89, CONSTRUIS),
          band(90, FAIS),
        ],
      },
    ],
  },
  {
    key: "5",
    kind: "unit",
    ordinal: "Cinquième",
    title: "Unité 5 : Multiplication et division avec des décimaux",
    printedHead: "Multiplication et division avec des décimaux",
    bookFrom: 91,
    bookTo: 119,
    lessons: [
      {
        key: "5-1",
        ordinal: "Première",
        type: LECON,
        title: "Multiplication par des puissances de dix",
        printedHead: "Leçon 1 : Multiplication par des puissances de dix",
        bookFrom: 92,
        concepts: [
          lessonHead(92, "Leçon 1 : Multiplication par des puissances de dix"),
          band(92, ACCES),
          band(92, CONSTRUIS),
          band(94, FAIS),
        ],
      },
      {
        key: "5-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Multiplier des nombres décimaux par des nombres entiers",
        printedHead: "Leçon 2 : Multiplier des nombres décimaux par des nombres entiers",
        bookFrom: 95,
        concepts: [
          lessonHead(95, "Leçon 2 : Multiplier des nombres décimaux par des nombres entiers"),
          band(95, ACCES),
          band(95, CONSTRUIS),
          band(96, FAIS),
        ],
      },
      {
        key: "5-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Multiplier des dixièmes par des dixièmes",
        printedHead: "Leçon 3 : Multiplier des dixièmes par des dixièmes",
        bookFrom: 97,
        concepts: [
          lessonHead(97, "Leçon 3 : Multiplier des dixièmes par des dixièmes"),
          band(97, ACCES),
          band(97, CONSTRUIS),
          band(98, FAIS),
        ],
      },
      {
        key: "5-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Utiliser le modèle de l’aire du rectangle pour multiplier des nombres décimaux",
        printedHead: "Leçon 4 : Utiliser le modèle de l’aire du rectangle pour multiplier des nombres décimaux",
        bookFrom: 99,
        concepts: [
          lessonHead(99, "Leçon 4 : Utiliser le modèle de l’aire du rectangle pour multiplier des nombres décimaux"),
          band(99, ACCES),
          band(99, CONSTRUIS),
          band(100, FAIS),
        ],
      },
      {
        key: "5-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "Multiplier des nombres décimaux jusqu’aux centièmes près",
        printedHead: "Leçon 5 : Multiplier des nombres décimaux jusqu’aux centièmes près",
        bookFrom: 101,
        concepts: [
          lessonHead(101, "Leçon 5 : Multiplier des nombres décimaux jusqu’aux centièmes près"),
          band(101, ACCES),
          band(101, CONSTRUIS),
          band(102, FAIS),
        ],
      },
      {
        key: "5-6",
        ordinal: "Sixième",
        type: LECON,
        title: "Multiplier des nombres décimaux jusqu’aux millièmes près",
        printedHead: "Leçon 6 : Multiplier des nombres décimaux jusqu’aux millièmes près",
        bookFrom: 103,
        concepts: [
          lessonHead(103, "Leçon 6 : Multiplier des nombres décimaux jusqu’aux millièmes près"),
          band(103, ACCES),
          band(104, CONSTRUIS),
          band(104, FAIS),
        ],
      },
      {
        key: "5-7",
        ordinal: "Septième",
        type: LECON,
        title: "Les nombres décimaux et le système métrique",
        printedHead: "Leçon 7 : Les nombres décimaux et le système métrique",
        bookFrom: 105,
        concepts: [
          lessonHead(105, "Leçon 7 : Les nombres décimaux et le système métrique"),
          band(105, ACCES),
          band(105, CONSTRUIS),
          band(107, FAIS),
        ],
      },
      {
        key: "5-8",
        ordinal: "Huitième",
        type: LECON,
        title: "Mesure, nombres décimaux et puissances de dix",
        printedHead: "Leçon 8 : Mesure, nombres décimaux et puissances de dix",
        bookFrom: 108,
        concepts: [
          lessonHead(108, "Leçon 8 : Mesure, nombres décimaux et puissances de dix"),
          band(108, ACCES),
          band(108, CONSTRUIS),
          band(109, FAIS),
        ],
      },
      {
        key: "5-9",
        ordinal: "Neuvième",
        type: LECON,
        title: "Résoudre des situations-problèmes à plusieurs étapes",
        printedHead: "Leçon 9 : Résoudre des situations-problèmes à plusieurs étapes",
        bookFrom: 110,
        concepts: [
          lessonHead(110, "Leçon 9 : Résoudre des situations-problèmes à plusieurs étapes"),
          band(110, ACCES),
          band(110, CONSTRUIS),
          band(111, FAIS),
        ],
      },
      {
        key: "5-10",
        ordinal: "Dixième",
        type: LECON,
        title: "Diviser par puissances de dix",
        printedHead: "Leçon 10 : Diviser par puissances de dix",
        bookFrom: 112,
        concepts: [
          lessonHead(112, "Leçon 10 : Diviser par puissances de dix"),
          band(112, ACCES),
          band(112, CONSTRUIS),
          band(113, FAIS),
        ],
      },
      {
        key: "5-11",
        ordinal: "Onzième",
        type: LECON,
        title: "Modèles et relations avec des puissances de dix",
        printedHead: "Leçon 11 : Modèles et relations avec des puissances de dix",
        bookFrom: 114,
        concepts: [
          lessonHead(114, "Leçon 11 : Modèles et relations avec des puissances de dix"),
          band(114, ACCES),
          band(114, CONSTRUIS),
          band(115, FAIS),
        ],
      },
      {
        key: "5-12",
        ordinal: "Douzième",
        type: LECON,
        title: "Diviser des nombres décimaux par des nombres entiers",
        printedHead: "Leçon 12 : Diviser des nombres décimaux par des nombres entiers",
        bookFrom: 116,
        concepts: [
          lessonHead(116, "Leçon 12 : Diviser des nombres décimaux par des nombres entiers"),
          band(116, ACCES),
          band(116, CONSTRUIS),
          band(117, FAIS),
        ],
      },
      {
        key: "5-13",
        ordinal: "Treizième",
        type: LECON,
        title: "Diviser deux nombres décimaux",
        printedHead: "Leçon 13 : Diviser deux nombres décimaux",
        bookFrom: 118,
        concepts: [
          lessonHead(118, "Leçon 13 : Diviser deux nombres décimaux"),
          band(118, ACCES),
          band(118, CONSTRUIS),
          band(119, FAIS),
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "unit",
    ordinal: "Sixième",
    title: "Unité 6 : Expressions numériques et modèles",
    printedHead: "Expressions numériques et modèles",
    bookFrom: 120,
    bookTo: 131,
    lessons: [
      {
        key: "6-1",
        ordinal: "Première",
        type: LECON,
        title: "l’ordre des opérations mathématiques",
        printedHead: "Leçon 1 : l’ordre des opérations mathématiques",
        bookFrom: 121,
        concepts: [
          lessonHead(121, "Leçon 1 : l’ordre des opérations mathématiques"),
          band(121, ACCES),
          band(121, CONSTRUIS),
          band(122, FAIS),
        ],
      },
      {
        key: "6-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Expressions numériques avec des symboles de regroupement",
        printedHead: "Leçon 2 : Expressions numériques avec des symboles de regroupement",
        bookFrom: 123,
        concepts: [
          lessonHead(123, "Leçon 2 : Expressions numériques avec des symboles de regroupement"),
          band(123, ACCES),
          band(123, CONSTRUIS),
          band(125, FAIS),
        ],
      },
      {
        key: "6-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Écrire des expressions pour représenter des scénarios",
        printedHead: "Leçon 3 : Écrire des expressions pour représenter des scénarios",
        bookFrom: 126,
        concepts: [
          lessonHead(126, "Leçon 3 : Écrire des expressions pour représenter des scénarios"),
          band(126, ACCES),
          band(126, CONSTRUIS),
          band(127, FAIS),
        ],
      },
      {
        key: "6-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Identifier les régularités numériques",
        printedHead: "Leçon 4 : Identifier les régularités numériques",
        bookFrom: 128,
        concepts: [
          lessonHead(128, "Leçon 4 : Identifier les régularités numériques"),
          band(128, ACCES),
          band(129, CONSTRUIS),
          band(131, FAIS),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the
 * unit — so the unit opener stays inside the unit it belongs to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_MATH_FR_G5_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_FR_G5_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This book has
 * no appendix and no back matter that any lesson quotes: every page of the
 * term belongs to a unit. Kept as a function so the seeder and the stage share
 * one shape across all the books.
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
  "math-fr-g5-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (No term page of this book needs it — every present term page
 * carries text — but the guard is kept so the loader shares one shape across
 * the books.)
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

/** Loads + joins the OCR text of a book-page range into one document. */
export function loadBookRange(fromBook: number, toBook: number): string {
  const parts: string[] = [];
  for (let book = fromBook; book <= toBook; book++) {
    const text = loadBookPage(book);
    if (text) parts.push(pageBlock(book, text));
  }
  return parts.join("\n\n");
}

/**
 * Full document payload for one lesson: its owned range plus any appendix
 * pages it points to. The lesson's own pages come first. (No lesson of this
 * book points outside its range; the loop is kept so the loader shares one
 * shape across the books.)
 */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const range = lessonBookRange(unitIndex, lessonIndex);
  const lesson = EGYPT_MATH_FR_G5_T1_UNITS[unitIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(range.from, range.to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/**
 * Folds text for comparison: lowercases and removes every non-letter/digit, so
 * punctuation, apostrophes, colons and spacing can never break a match.
 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring case and OCR spacing/punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints in its running head. Even pages
 * print «N Leçon … N», odd pages «Leçon … N», openers a bare «N», U5 lessons
 * «Concept Video: Video N Leçon … N» and the U5 dividers «Concept : N»; three
 * pages (books 70, 76, 78) split the head across two lines. The first six
 * non-empty lines are read and every numeral there is a candidate; the page's
 * own number proves the mapping when present.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const region = lines.slice(0, 6);
  const numbers = new Set<number>();
  for (const line of region) {
    const found = line.match(/\d+/g);
    if (found) for (const tok of found) numbers.add(Number(tok));
  }
  return [...numbers].sort((a, b) => a - b);
}

/**
 * The book number a content page prints, or null when it prints none. Returns
 * the page's own number when it is among the candidates, otherwise the largest
 * candidate (so a wrong page still reports a number and the caller can see the
 * mismatch). The four unit openers (books 2, 64, 80, 120) print no folio at
 * all, so those pages are anchored through `FOLIO_LESS_ANCHORS`.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * The content pages whose printed footer the OCR misread, and the value it
 * printed instead — measured, not guessed. Every parseable folio matches its
 * page number exactly in this book, so there are none; listing the exceptions
 * keeps the check strict instead of statistical.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no parseable folio in the OCR, each with a printed
 * string the check accepts in its place. Books 2, 64, 80 and 120 are the
 * «Unité» openers of unités 1, 3, 4 and 6; by the book's own design none
 * carries a page number, and each is anchored to the unit head it prints.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  2: "La Valeur de position de nombres décimaux et calcul",
  64: "Multiplication avec des nombres entiers",
  80: "Division avec des nombres entiers",
  120: "Expressions numériques et modèles",
};

/** Every head kind the table may use: the lesson head plus the three section heads. */
const KNOWN_KINDS = new Set([LECON, ACCES, CONSTRUIS, FAIS]);

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_FR_G5_T1_UNITS;
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
        problems.push(`Lesson ${lesson.key}: start ${lesson.bookFrom} outside section ${unit.bookFrom}–${unit.bookTo}`);
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
          problems.push(`Lesson ${lesson.key}: activity pages descend (${prev.bookFrom} then ${c.bookFrom})`);
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
  if (first && first.bookFrom !== EGYPT_MATH_FR_G5_T1_BOOK_START) {
    problems.push(`First section must start at page ${EGYPT_MATH_FR_G5_T1_BOOK_START}, found ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_FR_G5_T1_BOOK_END) {
    problems.push(`Last section must end at page ${EGYPT_MATH_FR_G5_T1_BOOK_END}, found ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from
 *     its printed folio (allowing the measured OCR misreads), or, on the four
 *     pages named in `FOLIO_LESS_ANCHORS`, from the anchor the page itself
 *     prints. The pages in `MISSING_SCANS` carry no text layer at all and are
 *     not iterated for this proof;
 *  2. every unit opener prints the unit head and every lesson's first page
 *     prints that lesson's head;
 *  3. every lesson's title and every activity's head is printed on the pages
 *     the lesson owns (each activity on its own page);
 *  4. every printed page in [2, 131] is owned by exactly one lesson — no page
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
  const units = EGYPT_MATH_FR_G5_T1_UNITS;
  const missing = new Set<number>(MISSING_SCANS);

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_FR_G5_T1_BOOK_START || book > EGYPT_MATH_FR_G5_T1_BOOK_END) continue;
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
    EGYPT_MATH_FR_G5_T1_BOOK_END - EGYPT_MATH_FR_G5_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `Book fabric: ${printedPages.size} pages read between ${EGYPT_MATH_FR_G5_T1_BOOK_START} and ${EGYPT_MATH_FR_G5_T1_BOOK_END}, expected ${expectedPages}`,
    );
  }

  // 2 + 3a. every unit opener prints the unit head, every lesson's first page
  // its head, and every lesson's title is printed somewhere in the pages it
  // owns.
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

  // 3b. every activity's printed head is on its own page.
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
  for (let p = EGYPT_MATH_FR_G5_T1_BOOK_START; p <= EGYPT_MATH_FR_G5_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`Page ${p} owned by no lesson`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
