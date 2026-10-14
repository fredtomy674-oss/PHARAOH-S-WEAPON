// Primary 1 (الصف الأول الابتدائي) Mathematics, French-medium, first term,
// Ministry 2025/2026 edition (the cover prints the 2025 - 2026 school year).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g1-math-fr`, subject `math-fr` (name "Mathematics"), lesson prefix
// `l-g1-math-fr-`.
//
// The curriculum tree for the Egypt `eg-g1-math-fr` curriculum is rebuilt from
// the Ministry textbook `MATHÉMATIQUES — 1ère primaire — 1er semestre`
// (96 scanned pages). This module is the single source of truth for its
// structure: the nine printed chapitres of the first term, their numbered
// printed leçons (forty lessons), and, for every lesson, the book's own
// printed heads — the lesson head plus the activity-flow heads the lesson
// prints ("Exemple" / "Comment résoudre") — verbatim and with the printed
// page they start on. The self-checks at the bottom prove that mapping
// against the text layer itself, page by page.
//
// THE OFFSET IS ZERO — book page = scan page
// Every content page prints its own folio as a bare numeral on its FIRST
// line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here:
// scan 6 prints «6» (book 6), scan 14 prints «14» (book 14), scan 32 prints
// «32» (book 32), scan 44 prints «44» (book 44), scan 54 prints «54»
// (book 54), scan 68 prints «68» (book 68), scan 80 prints «80» (book 80)
// and scan 93 prints «93» (book 93). The book's own contents (scan 5,
// «Tableau des contenus») independently confirms it: it lists
// «Chapitre 1 … 6», «Chapitre 2 … 32», «Chapitre 3 … 36»,
// «Chapitre 4 … 44», «Chapitre 5 … 54», «Chapitre 6 … 60»,
// «Chapitre 7 … 72», «Chapitre 8 … 86» and «Chapitre 9 … 88» — every chapter
// opener sits exactly where the contents says it does. This matches the
// English twin of this same book (`egyptMathEnG1T1.ts`) page for page.
//
// TERM = REAL CONTENT ONLY (books 6–93)
// Scan pages 1–5 are before the term: the cover (1), the credits/copyright (2),
// the «Introduction» (3), the «Apprenons ensemble!» characters page (4) and
// the year-wide contents (5). The term runs from the chapter 1 opener (book 6
// = scan 6) to the last practice page of lesson 9-3 (book 93 = scan 93):
// `EGYPT_MATH_FR_G1_T1_BOOK_START` / `_END` are exactly those two pages, and
// the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 93 − 6 + 1 = 88. Scan pages 94–96 are after
// the term: two «Notes» pages (94–95) and the print-specs page (96).
//
// NO FOLIO-LESS TERM PAGE — the general rule is never weakened
// Like the English twin, the French text layer kept every folio: all 88 term
// pages print their number as the first line, so `FOLIO_LESS_ANCHORS` is empty
// and every content page proves its number from that line, which must be a
// bare numeral equal to its own book number — body numbers (exercise counts,
// chart labels, clock faces) can never be mistaken for a folio.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every numbered lesson contributes its head line (number + title, exactly as
// the opener prints it — the openers of 1-3 … 1-13 print the title at the top
// with the lesson number on a separate line at the foot, as do the openers of
// 2-2, 3-2, 3-3, 5-2 and 6-3, so the head is stored exactly as each opener
// prints it and the key follows the sequence) plus the activity-flow heads
// the opener prints: «Exemple» (with its sentence where the book prints it
// on the same line) and «Comment résoudre». Nothing is invented: every
// concept title below is a string the book itself prints on the page its
// `bookFrom` names. Lessons 1-1, 1-2, 1-5, 3-4 and 4-5 print no
// «Exemple»/«Comment résoudre» on their openers, so they carry only their
// lesson head. The «Pointe!», «Mise en train», «Essaie» and «Exercice»
// banners are printed on every lesson but carry no lesson-specific head, so
// — exactly as the English twin treats them — they contribute no concept;
// the practice pages print no head of their own beyond the repeated lesson
// head, so they carry no concept of their own either — they are still owned
// by their lesson's range.
//
// TEXT-LAYER QUIRKS RECORDED, NOT WORKED AROUND
// `normalize` is case-insensitive and drops every non-letter/digit, so
// spacing and punctuation can never break a match. Apostrophes are the
// book's own ’ (U+2019) in «jusqu’à»/«Qu’est-ce»/«l’image»; subtraction
// signs are the book's own – (U+2013); the two worked examples of lesson
// 7-4 end with the book's own • (U+2022); the zero lessons quote «zéro»
// with the book's own “ ” (U+201C/U+201D) — all stored verbatim. Two
// «Exemple» heads share their OCR line with the start of their sentence and
// the line breaks mid-sentence («Exemple Comparons la longueur du crayon
// vert et du crayon», 5-1, «rouge.» continuing on the next line;
// «Exemple 2 La petite aiguille est entre 8 et 9 et la grande aiguille
// est», 8-1, «sur 6.» continuing on the next line); both are transcribed
// exactly as the text layer reads them. The running heads of pages 24–30
// misspell «nombers» («Chapitre 1 Les nombers jusqu’à 10»); the chapter head
// is stored from the opener (page 6), which spells it correctly. Lesson
// numbers are spaced «1 - 1» on pages 6 and 8, «6 - 2» on page 64,
// «9 - 2» on page 90 and «9 - 3» on page 92, but unspaced («2-1», «7-1»,
// «8-1») elsewhere — each stored exactly as its opener prints it. The
// horloge heads space their apostrophe («Chapitre 8 Lire l ’ horloge»,
// «Lire l ’ heure sur une horloge 8-1»); «Comptons ! (de 1 à 5)» spaces its
// exclamation mark while «Comptons! (de 6 à 10)» does not — each stored as
// printed.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 0 (verified: book p.93 = scan p.93). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the term — the chapter 1 opener (scan 6). */
export const EGYPT_MATH_FR_G1_T1_BOOK_START = 6;

/** Last printed page of the term — lesson 9-3's practice page (scan 93). */
export const EGYPT_MATH_FR_G1_T1_BOOK_END = 93;

/** The scanned pages before the term: cover, credits, Introduction, characters, contents. */
export const EGYPT_MATH_FR_G1_T1_FRONT_MATTER = { from: 1, to: 5 } as const;

/** The scanned pages after the term: two Notes pages and the print-specs page. */
export const EGYPT_MATH_FR_G1_T1_BACK_MATTER = { from: 94, to: 96 } as const;

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface MathFrG1T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: "Leçon", "Exemple" or "Comment résoudre". */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one numbered lesson of a chapter). */
export interface MathFrG1T1Lesson {
  /** App-addressable key, e.g. "5-3" (chapter 5, lesson 3). */
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
  concepts: MathFrG1T1Concept[];
}

/** One printed chapter of the book — one of the nine chapters of the first term. */
export interface MathFrG1T1Section {
  /** This book's sections are its chapters. */
  kind: "chapter";
  /** Internal key: "1"…"9", in book order. */
  key: string;
  /** French ordinal of the chapter as the app prints it, e.g. "Deuxième". */
  ordinal: string;
  /** Full app-facing section title, e.g. "Chapitre 1 : Les nombres jusqu’à 10". */
  title: string;
  /** The chapter head the opener page prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next opener). */
  bookTo: number;
  lessons: MathFrG1T1Lesson[];
}

const LECON = "Leçon";
const EXEMPLE = "Exemple";
const COMMENT_RESoudre = "Comment résoudre";

function concept(bookFrom: number, kind: string, title: string): MathFrG1T1Concept {
  return { bookFrom, kind, title };
}

function lessonHead(bookFrom: number, title: string): MathFrG1T1Concept {
  return concept(bookFrom, LECON, title);
}

function example(bookFrom: number, title = EXEMPLE): MathFrG1T1Concept {
  return concept(bookFrom, EXEMPLE, title);
}

function commentResoudre(bookFrom: number): MathFrG1T1Concept {
  return concept(bookFrom, COMMENT_RESoudre, COMMENT_RESoudre);
}

/**
 * The nine chapters of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and checked
 * by `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter starts come from the book's contents (scan 5): 6, 32, 36, 44, 54,
 * 60, 72, 86, 88 — identical to the English twin. Lesson numbers restart in
 * every chapter (1-1 … 1-13, 2-1 …) exactly as the book prints them on each
 * lesson opener; where the opener prints the title without its number (see
 * header notes) the head is stored exactly as the opener prints it and the key
 * follows the sequence.
 */
export const EGYPT_MATH_FR_G1_T1_UNITS: MathFrG1T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "Premier",
    title: "Chapitre 1 : Les nombres jusqu’à 10",
    printedHead: "Chapitre 1 Les nombres jusqu’à 10",
    bookFrom: 6,
    bookTo: 31,
    lessons: [
      {
        key: "1-1",
        ordinal: "Première",
        type: LECON,
        title: "Combien?",
        printedHead: "Combien? 1 - 1",
        bookFrom: 6,
        concepts: [lessonHead(6, "Combien? 1 - 1")],
      },
      {
        key: "1-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Les nombres de 1 à 5",
        printedHead: "Les nombres de 1 à 5 1 - 2",
        bookFrom: 8,
        concepts: [lessonHead(8, "Les nombres de 1 à 5 1 - 2")],
      },
      {
        key: "1-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Comptons ! (de 1 à 5)",
        printedHead: "Comptons ! (de 1 à 5)",
        bookFrom: 10,
        concepts: [
          lessonHead(10, "Comptons ! (de 1 à 5)"),
          example(10),
          commentResoudre(10),
        ],
      },
      {
        key: "1-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Qu’est-ce qui fait 5?",
        printedHead: "Qu’est-ce qui fait 5?",
        bookFrom: 12,
        concepts: [lessonHead(12, "Qu’est-ce qui fait 5?"), commentResoudre(12)],
      },
      {
        key: "1-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "Les nombres de 6 à 10",
        printedHead: "Les nombres de 6 à 10",
        bookFrom: 14,
        concepts: [lessonHead(14, "Les nombres de 6 à 10")],
      },
      {
        key: "1-6",
        ordinal: "Sixième",
        type: LECON,
        title: "Comptons! (de 6 à 10)",
        printedHead: "Comptons! (de 6 à 10)",
        bookFrom: 16,
        concepts: [
          lessonHead(16, "Comptons! (de 6 à 10)"),
          example(16),
          commentResoudre(16),
        ],
      },
      {
        key: "1-7",
        ordinal: "Septième",
        type: LECON,
        title: "Qu’est-ce qui fait 6?",
        printedHead: "Qu’est-ce qui fait 6?",
        bookFrom: 18,
        concepts: [lessonHead(18, "Qu’est-ce qui fait 6?"), commentResoudre(18)],
      },
      {
        key: "1-8",
        ordinal: "Huitième",
        type: LECON,
        title: "Qu’est-ce qui fait 7?",
        printedHead: "Qu’est-ce qui fait 7?",
        bookFrom: 20,
        concepts: [lessonHead(20, "Qu’est-ce qui fait 7?"), commentResoudre(20)],
      },
      {
        key: "1-9",
        ordinal: "Neuvième",
        type: LECON,
        title: "Qu’est-ce qui fait 8?",
        printedHead: "Qu’est-ce qui fait 8?",
        bookFrom: 22,
        concepts: [lessonHead(22, "Qu’est-ce qui fait 8?"), commentResoudre(22)],
      },
      {
        key: "1-10",
        ordinal: "Dixième",
        type: LECON,
        title: "Qu’est-ce qui fait 9?",
        printedHead: "Qu’est-ce qui fait 9?",
        bookFrom: 24,
        concepts: [lessonHead(24, "Qu’est-ce qui fait 9?"), commentResoudre(24)],
      },
      {
        key: "1-11",
        ordinal: "Onzième",
        type: LECON,
        title: "Qu’est-ce qui fait 10?",
        printedHead: "Qu’est-ce qui fait 10?",
        bookFrom: 26,
        concepts: [lessonHead(26, "Qu’est-ce qui fait 10?"), commentResoudre(26)],
      },
      {
        key: "1-12",
        ordinal: "Douzième",
        type: LECON,
        title: "Comparons les nombres",
        printedHead: "Comparons les nombres",
        bookFrom: 28,
        concepts: [lessonHead(28, "Comparons les nombres"), commentResoudre(28)],
      },
      {
        key: "1-13",
        ordinal: "Treizième",
        type: LECON,
        title: "Le nombre zéro",
        printedHead: "Le nombre zéro",
        bookFrom: 30,
        concepts: [lessonHead(30, "Le nombre zéro"), commentResoudre(30)],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "Deuxième",
    title: "Chapitre 2 : Quelle est la position?",
    printedHead: "Chapitre 2 Quelle est la position?",
    bookFrom: 32,
    bookTo: 35,
    lessons: [
      {
        key: "2-1",
        ordinal: "Première",
        type: LECON,
        title: "Quelle est la position?",
        printedHead: "Quelle est la position? 2-1",
        bookFrom: 32,
        concepts: [lessonHead(32, "Quelle est la position? 2-1"), commentResoudre(32)],
      },
      {
        key: "2-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Où est-ce?",
        printedHead: "Où est-ce?",
        bookFrom: 34,
        concepts: [lessonHead(34, "Où est-ce?"), commentResoudre(34)],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "Troisième",
    title: "Chapitre 3 : Addition",
    printedHead: "Chapitre 3 Addition",
    bookFrom: 36,
    bookTo: 43,
    lessons: [
      {
        key: "3-1",
        ordinal: "Première",
        type: LECON,
        title: "Addition (Partie 1)",
        printedHead: "3-1 Addition (Partie 1)",
        bookFrom: 36,
        concepts: [lessonHead(36, "3-1 Addition (Partie 1)"), commentResoudre(36)],
      },
      {
        key: "3-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Addition (Partie 2)",
        printedHead: "Addition (Partie 2)",
        bookFrom: 38,
        concepts: [
          lessonHead(38, "Addition (Partie 2)"),
          example(38),
          commentResoudre(38),
        ],
      },
      {
        key: "3-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Addition avec zéro “0”",
        printedHead: "Addition avec zéro “0”",
        bookFrom: 40,
        concepts: [
          lessonHead(40, "Addition avec zéro “0”"),
          example(40, "Exemple 2 + 0 = 2"),
          commentResoudre(40),
        ],
      },
      {
        key: "3-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Créer des histoires d ’ addition",
        printedHead: "Créer des histoires d ’ addition 3-4",
        bookFrom: 42,
        concepts: [lessonHead(42, "Créer des histoires d ’ addition 3-4")],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "Quatrième",
    title: "Chapitre 4 : Soustraction",
    printedHead: "Chapitre 4 Soustraction",
    bookFrom: 44,
    bookTo: 53,
    lessons: [
      {
        key: "4-1",
        ordinal: "Première",
        type: LECON,
        title: "Soustraction (Partie 1)",
        printedHead: "Soustraction (Partie 1) 4-1",
        bookFrom: 44,
        concepts: [lessonHead(44, "Soustraction (Partie 1) 4-1"), commentResoudre(44)],
      },
      {
        key: "4-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Soustraction (Partie 2)",
        printedHead: "Soustraction (Partie 2) 4-2",
        bookFrom: 46,
        concepts: [
          lessonHead(46, "Soustraction (Partie 2) 4-2"),
          example(46),
          commentResoudre(46),
        ],
      },
      {
        key: "4-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Soustraction avec zéro “ 0 ”",
        printedHead: "Soustraction avec zéro “ 0 ” 4-3",
        bookFrom: 48,
        concepts: [
          lessonHead(48, "Soustraction avec zéro “ 0 ” 4-3"),
          example(48, "Exemple 2 – 0 = 2"),
          example(48, "Exemple 2 – 2 = 0"),
          commentResoudre(48),
        ],
      },
      {
        key: "4-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Quelle est la différence ?",
        printedHead: "Quelle est la différence ? 4-4",
        bookFrom: 50,
        concepts: [
          lessonHead(50, "Quelle est la différence ? 4-4"),
          example(50),
          commentResoudre(50),
        ],
      },
      {
        key: "4-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "Créer des histoires de soustraction",
        printedHead: "Créer des histoires de soustraction 4-5",
        bookFrom: 52,
        concepts: [lessonHead(52, "Créer des histoires de soustraction 4-5")],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "Cinquième",
    title: "Chapitre 5 : Comparer les longueurs",
    printedHead: "Chapitre 5 Comparer les longueurs",
    bookFrom: 54,
    bookTo: 59,
    lessons: [
      {
        key: "5-1",
        ordinal: "Première",
        type: LECON,
        title: "Lequel est le plus long?",
        printedHead: "Lequel est le plus long? 5-1",
        bookFrom: 54,
        concepts: [
          lessonHead(54, "Lequel est le plus long? 5-1"),
          example(54, "Exemple Comparons la longueur du crayon vert et du crayon"),
          commentResoudre(54),
        ],
      },
      {
        key: "5-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Comment pouvons-nous mesurer?",
        printedHead: "Comment pouvons-nous mesurer?",
        bookFrom: 56,
        concepts: [
          lessonHead(56, "Comment pouvons-nous mesurer?"),
          example(56, "(1) Exemple"),
          example(56, "(2) Exemple"),
          commentResoudre(56),
        ],
      },
      {
        key: "5-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Comparons les longueurs",
        printedHead: "Comparons les longueurs 5-3",
        bookFrom: 58,
        concepts: [
          lessonHead(58, "Comparons les longueurs 5-3"),
          example(58),
          commentResoudre(58),
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "chapter",
    ordinal: "Sixième",
    title: "Chapitre 6 : Représenter les données",
    printedHead: "Chapitre 6 Représenter les données",
    bookFrom: 60,
    bookTo: 71,
    lessons: [
      {
        key: "6-1",
        ordinal: "Première",
        type: LECON,
        title: "Représenter les données avec des images",
        printedHead: "Représenter les données avec des images 6-1",
        bookFrom: 60,
        concepts: [
          lessonHead(60, "Représenter les données avec des images 6-1"),
          commentResoudre(60),
        ],
      },
      {
        key: "6-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Ce que nous apprenons des résultats",
        printedHead: "Ce que nous apprenons des résultats 6 - 2",
        bookFrom: 64,
        concepts: [
          lessonHead(64, "Ce que nous apprenons des résultats 6 - 2"),
          commentResoudre(64),
        ],
      },
      {
        key: "6-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Comparons les résultats",
        printedHead: "Comparons les résultats",
        bookFrom: 68,
        concepts: [lessonHead(68, "Comparons les résultats"), commentResoudre(68)],
      },
    ],
  },
  {
    key: "7",
    kind: "chapter",
    ordinal: "Septième",
    title: "Chapitre 7 : Nombres supérieurs à 10",
    printedHead: "Chapitre 7 Nombres supérieurs à 10",
    bookFrom: 72,
    bookTo: 85,
    lessons: [
      {
        key: "7-1",
        ordinal: "Première",
        type: LECON,
        title: "Les nombres jusqu’à 20",
        printedHead: "Les nombres jusqu’à 20 7-1",
        bookFrom: 72,
        concepts: [lessonHead(72, "Les nombres jusqu’à 20 7-1"), commentResoudre(72)],
      },
      {
        key: "7-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Dix et un certain nombre (de 1 à 10)",
        printedHead: "Dix et un certain nombre (de 1 à 10) 7-2",
        bookFrom: 74,
        concepts: [
          lessonHead(74, "Dix et un certain nombre (de 1 à 10) 7-2"),
          commentResoudre(74),
        ],
      },
      {
        key: "7-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Droite numérique",
        printedHead: "Droite numérique 7-3",
        bookFrom: 76,
        concepts: [lessonHead(76, "Droite numérique 7-3"), commentResoudre(76)],
      },
      {
        key: "7-4",
        ordinal: "Quatrième",
        type: LECON,
        title: "Addition et soustraction des nombres (partie 1)",
        printedHead: "Addition et soustraction des nombres (partie 1) 7-4",
        bookFrom: 80,
        concepts: [
          lessonHead(80, "Addition et soustraction des nombres (partie 1) 7-4"),
          example(80, "Exemple 10 et 3 font 13 •"),
          example(80, "Exemple 13 moins 3 fait 10 •"),
          commentResoudre(80),
        ],
      },
      {
        key: "7-5",
        ordinal: "Cinquième",
        type: LECON,
        title: "Addition et soustraction des nombres (partie 2)",
        printedHead: "Addition et soustraction des nombres (partie 2) 7-5",
        bookFrom: 82,
        concepts: [
          lessonHead(82, "Addition et soustraction des nombres (partie 2) 7-5"),
          example(82, "Exemple 11 + 4 = 15"),
          example(82, "Exemple 15 – 4 = 11"),
          commentResoudre(82),
        ],
      },
      {
        key: "7-6",
        ordinal: "Sixième",
        type: LECON,
        title: "Nombres supérieurs à 20",
        printedHead: "Nombres supérieurs à 20 7-6",
        bookFrom: 84,
        concepts: [
          lessonHead(84, "Nombres supérieurs à 20 7-6"),
          example(84),
          commentResoudre(84),
        ],
      },
    ],
  },
  {
    key: "8",
    kind: "chapter",
    ordinal: "Huitième",
    title: "Chapitre 8 : Lire l ’ horloge",
    printedHead: "Chapitre 8 Lire l ’ horloge",
    bookFrom: 86,
    bookTo: 87,
    lessons: [
      {
        key: "8-1",
        ordinal: "Première",
        type: LECON,
        title: "Lire l ’ heure sur une horloge",
        printedHead: "Lire l ’ heure sur une horloge 8-1",
        bookFrom: 86,
        concepts: [
          lessonHead(86, "Lire l ’ heure sur une horloge 8-1"),
          example(86, "Exemple 1 La petite aiguille est sur 8 et la grande aiguille est sur 12."),
          example(86, "Exemple 2 La petite aiguille est entre 8 et 9 et la grande aiguille est"),
          commentResoudre(86),
        ],
      },
    ],
  },
  {
    key: "9",
    kind: "chapter",
    ordinal: "Neuvième",
    title: "Chapitre 9 : Opérations avec 3 nombres",
    printedHead: "Chapitre 9 Opérations avec 3 nombres",
    bookFrom: 88,
    bookTo: 93,
    lessons: [
      {
        key: "9-1",
        ordinal: "Première",
        type: LECON,
        title: "Addition de trois nombres",
        printedHead: "Addition de trois nombres 9-1",
        bookFrom: 88,
        concepts: [
          lessonHead(88, "Addition de trois nombres 9-1"),
          example(88, "Exemple 3 + 4 + 1 = 8"),
          commentResoudre(88),
        ],
      },
      {
        key: "9-2",
        ordinal: "Deuxième",
        type: LECON,
        title: "Soustraction de trois nombres",
        printedHead: "Soustraction de trois nombres 9 - 2",
        bookFrom: 90,
        concepts: [
          lessonHead(90, "Soustraction de trois nombres 9 - 2"),
          example(90, "Exemple 8 – 1 – 2 = 5"),
          commentResoudre(90),
        ],
      },
      {
        key: "9-3",
        ordinal: "Troisième",
        type: LECON,
        title: "Calcul avec trois nombres",
        printedHead: "Calcul avec trois nombres 9 - 3",
        bookFrom: 92,
        concepts: [
          lessonHead(92, "Calcul avec trois nombres 9 - 3"),
          example(92, "Exemple 8 – 3 + 2 = 7"),
          commentResoudre(92),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the chapter opener (its first lesson) or its
 * own head page, down to the page before the next lesson starts, bounded by
 * the chapter — so the opener stays inside the chapter it belongs to. The
 * practice pages that print no head of their own ride with the lesson that
 * started them, so distinct lessons always start on distinct pages and the
 * ranges tile the chapter exactly.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_MATH_FR_G1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_FR_G1_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
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
  "math-fr-g1-t1",
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

/**
 * Folds text for comparison: lowercases and removes every non-letter/digit, so
 * punctuation, apostrophes and dashes can never break a match.
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
 * Page-number candidates a content page prints at its head. This book's folio
 * is a bare numeral standing alone on the first line («6», «10»); the
 * first non-empty line is read and every other line is ignored, so body
 * numbers (exercise counts, chart labels, clock faces) can never be mistaken
 * for a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const first =
    text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .at(0) ?? "";
  if (!/^[\d\s]+$/.test(first)) return [];
  const n = Number(first.replace(/\s+/g, ""));
  return n > 0 ? [n] : [];
}

/**
 * The book number a content page prints at its head, or null. Every content
 * page carries a folio that is exactly its own number, which is what fixes the
 * offset; the pages named in `FOLIO_LESS_ANCHORS` carry no parseable folio and
 * are handled there instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * Term pages that print no parseable folio in the text layer, each with the
 * anchor the check accepts in place of a page number. This French edition has
 * none: all 88 term pages print their folio on the first line.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {};

/**
 * Table invariants: lesson keys are unique and follow (chapter-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_FR_G1_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_MATH_FR_G1_T1_BOOK_START) {
    problems.push(`First section must start at page ${EGYPT_MATH_FR_G1_T1_BOOK_START}, found ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_FR_G1_T1_BOOK_END) {
    problems.push(`Last section must end at page ${EGYPT_MATH_FR_G1_T1_BOOK_END}, found ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio, or, on OCR-damaged pages, from the anchor named in
 *     `FOLIO_LESS_ANCHORS` (this edition has none);
 *  2. every chapter opener prints the chapter head and every lesson's first page
 *     prints that lesson's head;
 *  3. every lesson's title and every activity's head is printed on the pages the
 *     lesson owns (the activity on its own page);
 *  4. every printed page in [6, 93] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_MATH_FR_G1_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_FR_G1_T1_BOOK_START || book > EGYPT_MATH_FR_G1_T1_BOOK_END) continue;
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
      } else if (footer !== book) {
        problems.push(`Book page ${book}: printed number ${footer} does not match`);
      }
    }
  }

  if (printedPages.size !== EGYPT_MATH_FR_G1_T1_BOOK_END - EGYPT_MATH_FR_G1_T1_BOOK_START + 1) {
    problems.push(
      `Book fabric incomplete: ${printedPages.size} pages between ${EGYPT_MATH_FR_G1_T1_BOOK_START} and ${EGYPT_MATH_FR_G1_T1_BOOK_END}`,
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
  for (let p = EGYPT_MATH_FR_G1_T1_BOOK_START; p <= EGYPT_MATH_FR_G1_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`Page ${p} owned by no lesson`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
