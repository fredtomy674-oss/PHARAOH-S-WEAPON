// Secondary 1 (Grade 10, الصف الأول الثانوي) Mathematics, French-medium
// (Mathématiques — Première secondaire — Premier semestre), first term.
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g10-math-fr`, subject `math-fr` (name "Mathematics", nameAr
// "الرياضيات"), lesson prefix `l-g10-math-fr-`.
//
// The curriculum tree is rebuilt from the Ministry textbook (129 scanned
// pages). This module is the single source of truth for its structure: the
// four printed Unités of the first term, their seventeen printed Leçons,
// and, for every lesson, the book's own printed heads — the lesson head, the
// «A apprendre» objectives and the activity-flow heads the lesson prints
// (Réfléchis et discute, Travail collectif/coopératif, Exemple,
// Essai/Essaie/Essuie/Essaire de résoudre, Test de compréhension,
// Exercices, Théorème, Corollaire, Axiome, Définition, …) — verbatim and
// with the printed page each starts on. The self-checks at the bottom prove
// that mapping against the OCR itself, page by page.
//
// THE OFFSET IS −5 — book page N = scan page N + 5
// Every numbered content page prints its own folio, so `BOOK_TO_PDF_OFFSET`
// is fixed by the scan itself and quoted here: scan 9 prints «4» (book 4),
// scan 16 prints «11» (book 11), scan 39 prints «34» (book 34), scan 71
// prints «66» (book 66), scan 91 prints «86» (book 86), scan 111 prints
// «106» (book 106) and scan 127 prints «122» (book 122). The book's own
// «Sommaire» (scans 5–6) independently confirms it: it lists «1-1 … 4»,
// «1-2 … 11», «1-3 … 16», «1-4 … 22», «1-5 … 29», «2-1 … 34», «2-2 … 38»,
// «2-3 … 48», «2-4 … 56», «3-1 … 66», «3-2 … 76», «4-1 … 86», «4-2 … 94»,
// «4-3 … 98», «4-4 … 106», «4-5 … 115» and «4-6 … 119» — every lesson
// opener sits exactly where the contents says it does.
//
// TERM = REAL CONTENT ONLY (books 2–122)
// Scan pages 1–6 are before the term: the cover (1), the Pont Al Salam page
// (2), the credits (3), the «INTRODUCTION» (4) and the two-page «Sommaire»
// (5–6). The term runs from the Unité 1 intro page (book 2 = scan 7) to the
// last page of lesson 4-6 (book 122 = scan 127):
// `EGYPT_MATH_FR_G10_T1_BOOK_START` / `_END` are exactly those two pages,
// and the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 122 − 2 + 1 = 121. Scan pages 128–129 are
// after the term: two quotation pages (the second announces the «deuxième
// semestre» book).
//
// EIGHT TERM PAGES PRINT NO PARSEABLE FOLIO — EACH HAS A NAMED ANCHOR
// Each Unité opens with two unnumbered intro pages (objectives, «Leçons de
// l'unité», material, history, organigramme): books 2–3 (Unité 1), 32–33
// (Unité 2), 64–65 (Unité 3) and 84–85 (Unité 4). Rather than weaken the
// page-number check, all eight are exempt from it and anchored on a string
// the page itself prints, named in `FOLIO_LESS_ANCHORS`. Every other term
// page proves its number: the page counts as proving book N when N appears
// on it as a bare numeral line («37», «66») or glued to the running foot
// («8 Mathématiques – Première secondaire», «44 \ \ \ …» after a figure).
// Body numerals (exercise numbers, figure labels, measurement values) can
// therefore never hide a missing folio: the check demands the page's OWN
// number among the candidates, and the thirteen body-heavy pages (books 18,
// 23–24, 37, 41, 44, 48, 51, 58, 61–62, 66, 115) all carry it.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every lesson contributes its head line (title exactly as the opener prints
// it), each «A apprendre» objective bullet verbatim (wrapped lines joined),
// and each activity-flow head at its first start page in the lesson
// (Réfléchis et discute, Travail collectif/coopératif, Exemple, the
// Essai/Essaie/Essuie/Essaire de résoudre variants, Test de compréhension,
// Exercices, Théorème, Corollaire, Axiome, Définition, Résultats
// importants, Problème type, Modélisation, A retenir, Remarques
// importantes, Position standard…, Mesure en radians, Angle orienté,
// Le discriminant, …). Nothing is invented: every concept below is a string
// the book itself prints on the page its `bookFrom` names. Repeated
// occurrences of the same head inside one lesson are recorded once, at the
// first page. Inline prompts (Solution, Conclusion, Hypothèses,
// Démonstration, Remarque, Réflexion critique, Expression orale) and the
// «Expressions de base» / «Matériel et moyens» vocabularies are not heads
// and carry no concept — their pages still belong to their lesson's range.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// The «Essaie de résoudre» rubric changes spelling from page to page
// («Essai de résoudre», «Essaie de résoudre», «Essaié de résoudre»,
// «Essuie de résoudre», «Essaire de résoudre»); each concept keeps the
// spelling of its own page. Lesson 2-3's opener prints «Réflechis et
// discute» without the first accent (stored verbatim); every other lesson
// prints «Réfléchis et discute». Lesson 2-1's objective prints «polybones
// semblable» (stored verbatim). The in-4-4 objectives keep the OCR's math
// («$\\theta$», «$180^\\circ \\pm \\theta$»). Lesson-number formats vary
// («1 - 1», «1-4», «3-2», «4-4»); heads are stored title-only so number
// placement (before or after the title) cannot break a match. None of these
// changes what any page prints: the checks below verify every head against
// the OCR text itself.
//
// TITLE DISCREPANCIES RESOLVED IN FAVOUR OF THE LESSON PAGE
// The Sommaire and the «Leçons de l'unité» list print «Application de la
// similitude dans le cercle» (singular) but the lesson's own opener (book
// 56) prints «Applications de la similitude dans le cercle» — stored as the
// opener prints it. Lesson 4-6 is titled three ways («… à partir d'une
// rapport trigonométrique» in the Sommaire, «… à partir d'une fonction
// trigonométrique» in the unit list, «Trouver la mesure d'un angle en
// connaissant l'un de ses rapports trigonométriques» on its opener, book
// 119) — stored as the opener prints it. Lesson 1-5's opener head is the
// short «Inéquation du second degré» while the Sommaire, the unit list and
// the opener's own subtitle use the full «Inéquation du second degré à une
// inconnue» — the full form is the lesson title, the short form its
// printedHead. Page 116 prints «Propriétés de la fonction sinus» above a
// paragraph about the cosine function (kept verbatim; the book's own words
// rule).

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 5 (verified: book p.4 = scan p.9). */
export const BOOK_TO_PDF_OFFSET = -5;

/** First printed page of the term — the Unité 1 intro page (scan 7). */
export const EGYPT_MATH_FR_G10_T1_BOOK_START = 2;

/** Last printed page of the term — lesson 4-6's last page (scan 127). */
export const EGYPT_MATH_FR_G10_T1_BOOK_END = 122;

/** The scanned pages before the term: cover, photo, credits, intro, Sommaire. */
export const EGYPT_MATH_FR_G10_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The scanned pages after the term: two quotation pages. */
export const EGYPT_MATH_FR_G10_T1_BACK_MATTER = { from: 128, to: 129 } as const;

/** One printed head of a lesson — becomes one concept in the app tree. */
export interface MathFrG10T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «leçon», «À apprendre» or «activité». */
  kind: string;
  /** The printed head, verbatim. */
  title: string;
}

/** One printed lesson («Leçon» = one numbered lesson of a unit). */
export interface MathFrG10T1Lesson {
  /** App-addressable key, e.g. "4-3" (unit 4, lesson 3). */
  key: string;
  /** The lesson's opening head type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson. */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: MathFrG10T1Concept[];
}

/** One printed unit of the book — one of the four Unités of the first term. */
export interface MathFrG10T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"4", in book order. */
  key: string;
  /** Section title as printed on the unit intro page and in the Sommaire. */
  title: string;
  /** The section's title as the book prints it (same string, kept for parity). */
  footerTitle: string;
  /** First printed page of the section (its unnumbered intro spread). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next intro spread). */
  bookTo: number;
  lessons: MathFrG10T1Lesson[];
}

const HEAD = "leçon";
const APP = "À apprendre";
const ACT = "activité";

function concept(bookFrom: number, kind: string, title: string): MathFrG10T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The four units of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and checked
 * by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit starts are the unnumbered intro spreads (books 2, 32, 64, 84); lesson
 * starts and unit titles come from the book's «Sommaire» (scans 5–6) and are
 * confirmed by every lesson opener. A lesson's range runs from the unit's
 * first page (for its first lesson — the intro spread rides with it) or its
 * own head page, down to the page before the next lesson starts, bounded by
 * the unit — so every «Exercices» closing page stays inside the lesson it
 * closes.
 */
export const EGYPT_MATH_FR_G10_T1_UNITS: MathFrG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    title: "Algèbre, relations et fonctions",
    footerTitle: "Algèbre, relations et fonctions",
    bookFrom: 2,
    bookTo: 31,
    lessons: [
      {
        key: "1-1",
        type: HEAD,
        title: "Introduction aux nombres complexes",
        printedHead: "Introduction aux nombres complexes",
        bookFrom: 4,
        concepts: [
          concept(4, HEAD, "Introduction aux nombres complexes"),
          concept(4, APP, "La notion du nombre imaginaire."),
          concept(4, APP, "Les puissances de i."),
          concept(4, APP, "La notion d’un nombre complexe."),
          concept(4, APP, "Égalité de deux nombres complexes."),
          concept(4, APP, "Opérations sur les nombres complexes."),
          concept(4, ACT, "Réfléchis et discute"),
          concept(5, ACT, "Exemple"),
          concept(5, ACT, "Essai de résoudre"),
          concept(8, ACT, "Essaie de résoudre"),
          concept(9, ACT, "Test de compréhension"),
          concept(10, ACT, "Exercices 1-1"),
        ],
      },
      {
        key: "1-2",
        type: HEAD,
        title: "Détermination de la nature des racines d'une équation du second degré",
        printedHead: "Détermination de la nature des racines d'une équation du second degré",
        bookFrom: 11,
        concepts: [
          concept(11, HEAD, "Détermination de la nature des racines d'une équation du second degré"),
          concept(11, ACT, "Réfléchis et discute"),
          concept(11, APP, "Comment déterminer les racines d'une équation du second degré à une inconnue."),
          concept(11, APP, "Le discriminant"),
          concept(11, ACT, "Exemple"),
          concept(14, ACT, "Exercices 1-2"),
        ],
      },
      {
        key: "1-3",
        type: HEAD,
        title: "Relation entre les racines d'une équation du second degré et les coefficients de ses termes",
        printedHead: "Relation entre les racines d'une équation du second degré et les coefficients de ses termes",
        bookFrom: 16,
        concepts: [
          concept(
            16,
            HEAD,
            "Relation entre les racines d'une équation du second degré et les coefficients de ses termes",
          ),
          concept(16, APP, "Comment calculer la somme des deux racines d'une équation du second degré."),
          concept(16, APP, "Comment calculer le produit des deux racines d'une équation du second degré."),
          concept(16, APP, "Trouver une équation du second degré à partir d'une autre du second degré."),
          concept(16, ACT, "Réfléchis et discute"),
          concept(16, APP, "La somme et le produit des deux racines"),
          concept(16, ACT, "Exemple"),
          concept(18, APP, "Former une équation du second degré en connaissant ses deux racines"),
          concept(19, ACT, "Essaie de résoudre"),
          concept(19, ACT, "Test de compréhension"),
          concept(20, ACT, "Exercices 1-3"),
        ],
      },
      {
        key: "1-4",
        type: HEAD,
        title: "Signe d'une fonction",
        printedHead: "Signe d'une fonction",
        bookFrom: 22,
        concepts: [
          concept(22, HEAD, "Signe d'une fonction"),
          concept(22, APP, "Etude du signe d'une fonction: constante - du premier degré - du second degré"),
          concept(22, ACT, "Réfléchis et discute"),
          concept(22, ACT, "(1) Signe d'une fonction constante"),
          concept(22, ACT, "Exemple"),
          concept(23, ACT, "Essaié de résoudre"),
          concept(23, ACT, "(2) Signe d'une fonction du premier degré (fonction affine) :"),
          concept(24, ACT, "Essaie de résoudre"),
          concept(24, ACT, "(3) Signe d'une fonction du second degré :"),
          concept(25, ACT, "Essai de résoudre"),
          concept(26, ACT, "Test de compréhension"),
          concept(27, ACT, "Exercices 1-4"),
        ],
      },
      {
        key: "1-5",
        type: HEAD,
        title: "Inéquation du second degré à une inconnue",
        printedHead: "Inéquation du second degré",
        bookFrom: 29,
        concepts: [
          concept(29, HEAD, "Inéquation du second degré à une inconnue"),
          concept(29, ACT, "Réfléchis et discute"),
          concept(29, APP, "Résolution d'une inéquation du second degré à une inconnue"),
          concept(29, ACT, "Exemple"),
          concept(30, ACT, "Essuie de résoudre"),
          concept(31, ACT, "Exercices 1-5"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    title: "Similitude",
    footerTitle: "Similitude",
    bookFrom: 32,
    bookTo: 63,
    lessons: [
      {
        key: "2-1",
        type: HEAD,
        title: "Similitude des polygones",
        printedHead: "Similitude des polygones",
        bookFrom: 34,
        concepts: [
          concept(34, HEAD, "Similitude des polygones"),
          concept(34, APP, "Notion de la similitude."),
          concept(34, APP, "Similitude des polygones."),
          concept(
            34,
            APP,
            "La relation entre le périmètre de deux polybones semblable et le rapport de similitude.",
          ),
          concept(34, ACT, "Réfléchis et discute"),
          concept(34, ACT, "Définition"),
          concept(35, ACT, "Exemple"),
          concept(37, ACT, "Exercices 2-1"),
        ],
      },
      {
        key: "2-2",
        type: HEAD,
        title: "Similitude des triangles",
        printedHead: "Similitude des triangles",
        bookFrom: 38,
        concepts: [
          concept(38, HEAD, "Similitude des triangles"),
          concept(38, APP, "Cas de similitude de triangles."),
          concept(
            38,
            APP,
            "Propriétés de la perpendiculaire abaissée du sommet de l'angle droit dans un triangle rectangle",
          ),
          concept(38, ACT, "Réfléchis et discute"),
          concept(38, ACT, "Travail coopératif"),
          concept(39, ACT, "Axiome"),
          concept(39, ACT, "Exemple"),
          concept(40, ACT, "Résultats importants"),
          concept(40, ACT, "Corollaire 1"),
          concept(40, ACT, "Essaie de résoudre"),
          concept(40, ACT, "Corollaire 2"),
          concept(42, ACT, "Théorème 1"),
          concept(42, ACT, "A retenir"),
          concept(44, ACT, "Théorème 2"),
          concept(46, ACT, "Exercices 2-2"),
        ],
      },
      {
        key: "2-3",
        type: HEAD,
        title: "Relation entre les aires de deux polygones semblables",
        printedHead: "Relation entre les aires de deux polygones semblables",
        bookFrom: 48,
        concepts: [
          concept(48, HEAD, "Relation entre les aires de deux polygones semblables"),
          concept(48, APP, "Relation entre les périmètres de deux polygones semblables et rapport de similitude."),
          concept(48, APP, "Relation entre les aires de deux polygones semblables et rapport de similitude."),
          concept(48, ACT, "Réflechis et discute"),
          concept(48, ACT, "Théorème 3"),
          concept(50, ACT, "Exemple"),
          concept(50, ACT, "Essaie de résoudre"),
          concept(
            51,
            ACT,
            "Corollaire: Deux polygones semblables peuvent être partagés en un même nombre de triangles deux à deux semblables.",
          ),
          concept(51, ACT, "Théorème 4"),
          concept(53, ACT, "Essai de résoudre"),
          concept(54, ACT, "Exercices 2-3"),
        ],
      },
      {
        key: "2-4",
        type: HEAD,
        title: "Applications de la similitude dans le cercle",
        printedHead: "Applications de la similitude dans le cercle",
        bookFrom: 56,
        concepts: [
          concept(56, HEAD, "Applications de la similitude dans le cercle"),
          concept(56, APP, "Relation entre deux cordes sécantes d'un cercle."),
          concept(56, APP, "Relation entre deux sécantes d'un cercle d'un point extérieur au cercle."),
          concept(
            56,
            APP,
            "Relation entre la longueur d'une tangente à un cercle et les longueurs des deux parties d'une sécante tracées d'un point à l'extérieur du cercle.",
          ),
          concept(
            56,
            APP,
            "Modélisation, résolution de problèmes et application à la vie quotidienne utilisant la similitude des polygones dans un cercle.",
          ),
          concept(56, ACT, "Réfléchis et discute"),
          concept(56, ACT, "Problème type"),
          concept(57, ACT, "Exemple"),
          concept(57, ACT, "Essai de résoudre"),
          concept(58, ACT, "Corollaire"),
          concept(59, ACT, "Essaie de résoudre"),
          concept(59, ACT, "Corollaire 2"),
          concept(60, ACT, "Essaire de résoudre"),
          concept(61, ACT, "Exercices 2-4"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    title: "Théorèmes de la proportion dans un triangle",
    footerTitle: "Théorèmes de la proportion dans un triangle",
    bookFrom: 64,
    bookTo: 83,
    lessons: [
      {
        key: "3-1",
        type: HEAD,
        title: "Droites parallèles et parties proportionnelles",
        printedHead: "Droites parallèles et parties proportionnelles",
        bookFrom: 66,
        concepts: [
          concept(66, HEAD, "Droites parallèles et parties proportionnelles"),
          concept(66, APP, "Propriétés d'une droite parallèle à l'un des côtés d'un triangle."),
          concept(
            66,
            APP,
            "Utilisation de la proportionnalité pour calculer des longueurs de segments déterminés par des droites parallèles et des sécantes.",
          ),
          concept(
            66,
            APP,
            "Modélisation et résolution de problèmes de la vie quotidienne incluant des droites parallèles et leurs sécantes.",
          ),
          concept(66, ACT, "Réfléchis et discute"),
          concept(66, ACT, "Théorème 1"),
          concept(67, ACT, "Exemple"),
          concept(67, ACT, "Essai de résoudre"),
          concept(67, ACT, "Corollaire"),
          concept(70, ACT, "Essaie de résoudre"),
          concept(71, ACT, "Modélisation"),
          concept(71, ACT, "Théorème de Thalès"),
          concept(
            71,
            ACT,
            "Théorème Des droites parallèles découpent sur deux droites sécantes des segments homologues de longueurs proportionnelles. (La démonstration n'est pas sujet à l'examen)",
          ),
          concept(74, ACT, "Exercices 3-1"),
        ],
      },
      {
        key: "3-2",
        type: HEAD,
        title: "Bissectrice d'un angle et parties proportionnelles",
        printedHead: "Bissectrice d'un angle et parties proportionnelles",
        bookFrom: 76,
        concepts: [
          concept(76, HEAD, "Bissectrice d'un angle et parties proportionnelles"),
          concept(76, ACT, "Travail collectif"),
          concept(76, APP, "Propriétés des bissectrices des angles d'un triangle."),
          concept(
            76,
            APP,
            "Utilisation de la proportionnalité pour calculer les longueurs des segments issus de la bisection des angles.",
          ),
          concept(
            76,
            APP,
            "Modélisation et résolution de problèmes de la vie quotidienne incluant des bissectrices d'angle d'un triangle.",
          ),
          concept(76, ACT, "Théorème 3"),
          concept(77, ACT, "Exemple"),
          concept(77, ACT, "Essai de résoudre"),
          concept(78, ACT, "Essaie de résoudre"),
          concept(78, ACT, "Remarques importantes"),
          concept(81, ACT, "Corollaire : Les bissectrices des angles d'un triangle sont concourantes."),
          concept(82, ACT, "Exercices 3-2"),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    title: "Trigonométrie",
    footerTitle: "Trigonométrie",
    bookFrom: 84,
    bookTo: 122,
    lessons: [
      {
        key: "4-1",
        type: HEAD,
        title: "L'angle orienté",
        printedHead: "L'angle orienté",
        bookFrom: 86,
        concepts: [
          concept(86, HEAD, "L'angle orienté"),
          concept(86, APP, "Notion de l'angle orienté."),
          concept(86, APP, "Position standard d'un angle orienté."),
          concept(86, APP, "Mesure positive et mesure négative d'un angle orienté."),
          concept(86, APP, "Position d'un angle orienté dans un repère orthogonal."),
          concept(86, APP, "Notion des angles équivalents."),
          concept(86, ACT, "Réfléchis et discute"),
          concept(86, APP, "Angle orienté"),
          concept(87, ACT, "Définition"),
          concept(87, ACT, "Position standard d'un angle orienté"),
          concept(87, ACT, "Essaie de résoudre"),
          concept(88, ACT, "Exemple"),
          concept(88, ACT, "Essai de résoudre"),
          concept(91, ACT, "Test de compréhension"),
          concept(92, ACT, "Exercices 4-1"),
        ],
      },
      {
        key: "4-2",
        type: HEAD,
        title: "Mesure en radians et mesure en degrés",
        printedHead: "Mesure en radians et mesure en degrés",
        bookFrom: 94,
        concepts: [
          concept(94, HEAD, "Mesure en radians et mesure en degrés"),
          concept(94, APP, "La notion de mesure en degrés."),
          concept(94, APP, "Relation entre la mesure en degrés et la mesure en radians."),
          concept(94, APP, "Calcul de la longueur d'un arc d'un cercle."),
          concept(94, ACT, "Réfléchis et discute"),
          concept(94, ACT, "Travail collectif"),
          concept(94, ACT, "Mesure en radians"),
          concept(94, ACT, "Définition"),
          concept(95, ACT, "Exemple"),
          concept(95, ACT, "Essaie de résoudre"),
          concept(96, ACT, "Exercices 4-2"),
        ],
      },
      {
        key: "4-3",
        type: HEAD,
        title: "Fonctions trigonométriques",
        printedHead: "Fonctions trigonométriques",
        bookFrom: 98,
        concepts: [
          concept(98, HEAD, "Fonctions trigonométriques"),
          concept(98, APP, "Cercle d'unité."),
          concept(98, APP, "Fonctions trigonométriques de base."),
          concept(98, APP, "Fonctions trigonométriques inverses."),
          concept(98, APP, "Signe des fonctions trigonométriques."),
          concept(98, APP, "Fonctions trigonométriques de certains angles particuliers"),
          concept(98, ACT, "Réfléchis et discute"),
          concept(99, ACT, "Théorème de Pythagore"),
          concept(100, ACT, "Exemple"),
          concept(102, ACT, "Essai de résoudre"),
          concept(103, ACT, "Essuie de résoudre"),
          concept(103, ACT, "Test de compréhension"),
          concept(104, ACT, "Exercices 4-3"),
        ],
      },
      {
        key: "4-4",
        type: HEAD,
        title: "Angles associés",
        printedHead: "Angles associés",
        bookFrom: 106,
        concepts: [
          concept(106, HEAD, "Angles associés"),
          concept(
            106,
            APP,
            "Relation entre les fonctions trigonométriques des deux angles $\\theta$ et $180^\\circ \\pm \\theta$",
          ),
          concept(
            106,
            APP,
            "Relation entre les fonctions trigonométriques des deux angles $\\theta$ et $360^\\circ - \\theta$",
          ),
          concept(
            106,
            APP,
            "Relation entre les fonctions trigonométriques des deux angles $\\theta$ et $90^\\circ \\pm \\theta$",
          ),
          concept(
            106,
            APP,
            "Relation entre les fonctions trigonométriques des deux angles $\\theta$ et $270^\\circ \\pm \\theta$",
          ),
          concept(106, APP, "Solution générale des équations trigonométriques de la forme :"),
          concept(106, ACT, "Réfléchis et discute"),
          concept(106, ACT, "Essai de résoudre"),
          concept(106, ACT, "Définition"),
          concept(108, ACT, "Exemple"),
          concept(108, ACT, "Essaie de résoudre"),
          concept(111, ACT, "Solution générale d'une équation trigonométrique de la forme"),
          concept(112, ACT, "Test de compréhension"),
          concept(113, ACT, "Exercices 4-4"),
        ],
      },
      {
        key: "4-5",
        type: HEAD,
        title: "Représentation graphique des fonctions trigonométriques",
        printedHead: "Représentation graphique des fonctions trigonométriques",
        bookFrom: 115,
        concepts: [
          concept(115, HEAD, "Représentation graphique des fonctions trigonométriques"),
          concept(115, APP, "Représentation de la fonction sinus et déduction de ses propriétés."),
          concept(115, APP, "Représentation de la fonction cosinus et déduction de ses propriétés"),
          concept(115, ACT, "Réfléchis et discute"),
          concept(115, ACT, "Travail collectif"),
          concept(116, APP, "Propriétés de la fonction sinus"),
          concept(116, ACT, "Représentation graphique de la fonction cosinus"),
          concept(117, ACT, "Exemple"),
          concept(117, ACT, "Essaie de résoudre"),
          concept(117, ACT, "Test de compréhension"),
          concept(118, ACT, "Exercices 4-5"),
        ],
      },
      {
        key: "4-6",
        type: HEAD,
        title: "Trouver la mesure d'un angle en connaissant l'un de ses rapports trigonométriques",
        printedHead: "Trouver la mesure d'un angle en connaissant l'un de ses rapports trigonométriques",
        bookFrom: 119,
        concepts: [
          concept(119, HEAD, "Trouver la mesure d'un angle en connaissant l'un de ses rapports trigonométriques"),
          concept(119, ACT, "Réfléchis et discute"),
          concept(119, APP, "Si $y = \\sin \\theta$, alors $\\theta = \\sin^{-1}y$"),
          concept(119, ACT, "Exemple"),
          concept(119, ACT, "You will Learn"),
          concept(119, ACT, "Key - Terms"),
          concept(119, ACT, "Learning tools"),
          concept(120, ACT, "Essuie de résoudre"),
          concept(120, ACT, "Test de compréhension"),
          concept(121, ACT, "Exercices 4-6"),
        ],
      },
    ],
  },
];

/**
 * Book-page span a lesson owns: from the section's first page (for its first
 * lesson — the unit intro spread) or its own start page, up to the page before
 * the next lesson starts, or the section's last page for its last lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_MATH_FR_G10_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const ranges: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_FR_G10_T1_UNITS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      ranges.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return ranges;
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
  "math-fr-g10-t1",
);

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  const pdf = book - BOOK_TO_PDF_OFFSET;
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

/** Whether `page` prints `needle`, ignoring OCR spacing and punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).toLowerCase().includes(normalize(needle).toLowerCase());
}

/**
 * Page-number candidates a content page prints. This book carries no running
 * head — only the folio, at the foot of the page (bare, or glued to the
 * footer's book line: «8 Mathématiques – Première secondaire») — but the
 * two-column layout sometimes leaves the folio mid-page, and a figure caption
 * can glue it to OCR backslash runs («44 \ \ \ …»). We therefore scan every
 * line for both shapes and collect the numbers. Exercise numbers and figure
 * labels also match the bare shape, which is harmless: `printedFooter`
 * below only asks whether the page's OWN number is among them.
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
    const glued = line.match(/^(\d{1,3})\s+(Mathématiques|Livre|\\)/);
    if (glued) candidates.add(Number(glued[1]));
  }
  return [...candidates].sort((a, b) => a - b);
}

/**
 * The book number a content page prints, or null. Every content page that
 * carries a folio prints its own number among the candidates, which is what
 * fixes the offset; the eight pages named in `FOLIO_LESS_ANCHORS` carry no
 * parseable folio and are handled there instead. A mismatch returns the
 * largest candidate so the caller can see the difference.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * The eight term pages that print no parseable folio in the OCR — the two
 * unnumbered intro pages of each unit — each with the anchor the check
 * accepts in place of a page number.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  2: "Objectifs de l'unité",
  3: "Leçons de l'unité",
  32: "Objectifs de l'unité",
  33: "Leçons de l'unité",
  64: "Théorèmes de la proportion",
  65: "Leçons de l'unité",
  84: "Objectifs de l'unité",
  85: "Leçons de l'unité",
};

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_FR_G10_T1_UNITS;
  const keys = new Set<string>();

  units.forEach((unit, ui) => {
    if (!unit.title.trim()) problems.push(`القسم ${unit.key}: بلا عنوان`);
    if (!unit.footerTitle.trim()) problems.push(`القسم ${unit.key}: بلا عنوان مطبوع`);
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
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
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
  if (first && first.bookFrom !== EGYPT_MATH_FR_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_MATH_FR_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_FR_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_MATH_FR_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from
 *     its printed folio, or, on the eight unnumbered intro pages, from the
 *     anchor named in `FOLIO_LESS_ANCHORS`;
 *  2. every unit intro spread prints the unit title and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title is printed somewhere in the pages it owns, and
 *     every activity's printed head is on its own page;
 *  4. every printed page in [2, 122] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of
 *     the term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_MATH_FR_G10_T1_UNITS;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) + BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_FR_G10_T1_BOOK_START || book > EGYPT_MATH_FR_G10_T1_BOOK_END) continue;
    const text = loadBookPage(book);
    pagesChecked += 1;
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    printedPages.add(book);

    const anchor = FOLIO_LESS_ANCHORS[book];
    if (anchor !== undefined) {
      if (!normalize(text).toLowerCase().includes(normalize(anchor).toLowerCase())) {
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

  if (printedPages.size !== EGYPT_MATH_FR_G10_T1_BOOK_END - EGYPT_MATH_FR_G10_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_MATH_FR_G10_T1_BOOK_START} و${EGYPT_MATH_FR_G10_T1_BOOK_END}`,
    );
  }

  // 2 + 3a. every unit intro spread prints the unit title, every lesson's first
  // page its head, and every lesson's title is printed somewhere in the pages
  // it owns.
  units.forEach((unit, ui) => {
    if (!pagePrints(unit.bookFrom, unit.title)) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} لا تطبع «${unit.title}»`);
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
  for (let p = EGYPT_MATH_FR_G10_T1_BOOK_START; p <= EGYPT_MATH_FR_G10_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
