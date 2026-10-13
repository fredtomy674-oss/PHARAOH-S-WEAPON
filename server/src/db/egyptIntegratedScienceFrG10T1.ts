// PHASE 114 — official Egypt Secondary-1 (Grade 10) Integrated Science,
// French edition (`SCIENCES INTÉGRÉES — PREMIÈRE ANNÉE SECONDAIRE`),
// first term, Ministry 2026/2027 edition.
//
// The curriculum tree for the Egypt `eg-g10-integrated-science-fr` curriculum
// is rebuilt from the Ministry textbook `SCIENCES INTÉGRÉES - PREMIÈRE ANNÉE
// SECONDAIRE` (114 scanned pages, Gemini vision OCR). This module is the single
// source of truth for its structure: the two units of the first term, their
// fourteen printed lessons and, for every lesson, the book's own printed
// heads — the unit `acquis`/`résultats` and its `Problématiques abordées` and
// each lesson's printed topical and `Exercice`/`Exercices` heads — verbatim
// and with the printed page they start on. The self-checks at the bottom prove
// that mapping against the OCR text itself, page by page.
//
// This is the French twin of `egyptIntegratedScienceEnG10T1.ts` (the same book
// in English, same 114 scans, same pagination). It mirrors that module's
// shape and API exactly; only the wording — and the four documented
// French-specific folio exceptions — differ.
//
// THE OFFSET IS FIVE — book page = scan page − 5
// Every content page except four prints its own folio, so `BOOK_TO_PDF_OFFSET`
// is fixed by the OCR itself and quoted here: scan 10 prints `Première
// secondaire 5` (book 5), scan 13 prints `... 8 Sciences intégrées` (book 8),
// scan 94 prints `Première secondaire 89` (book 89), scan 103 prints `... 98
// Sciences intégrées` (book 98) and scan 113 prints `... 108 Sciences
// intégrées` (book 108). The book's own `Table des matières` (scan 5)
// independently confirms it: it lists every lesson with the very book page its
// head prints on (1-1 → 5, 1-2 → 8, 1-3 → 16, … 2-4 → 98).
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–7 are before the term: the cover (1), the contributors masthead
// (2), the `Introduction` (3), the `objectifs généraux` (4), the printed
// `Table des matières` (5), the first-term divider (6) and one fully blank
// page (7, answered by the OCR provider with `لا يوجد نص`). Scan page 114 is
// the back cover. The term runs from the unit 1 opener (book 3 = scan 8) to
// the last `Exercices` (book 108 = scan 113):
// `EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_START` / `_END` are exactly those
// two pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` therefore equals 108 − 3 + 1 = 106.
//
// FOUR PAGES PRINT NO FOLIO (DOCUMENTED, NOT LOOSENED)
// The two unit openers (books 3 and 67) print their unit head but no folio;
// book 9 (a mid-lesson continuation) prints neither head nor folio; book 85
// prints `Première secondaire` with the number itself missing. Rather than
// weaken the page-number check, these four pages are exempt from it and
// anchored on the book's own words printed on the page (unit head, running
// foot, owning lesson head or the page's own concept head). See
// `FOLIO_LESS_PAGES` and step 1 of `assertTreeMatchesTheBook`.
//
// FOLIO SHAPES
// Odd scans close with `<n> Sciences intégrées`; even scans close with
// `Première secondaire <n>`, sometimes split over two lines (books 13, 63,
// 65) and once printed mid-page above trailing figure captions (book 20).
// `footerCandidates` accepts exactly those shapes and nothing else.
//
// THE UNIT OPENER AND THE UNIT INTRO RIDE WITH THE UNIT'S FIRST LESSON
// Each unit opens with a one-page opener (the unit title, its learning
// outcomes and its `Problématiques abordées`) followed by an intro page and
// then the unit's first numbered lesson. Neither the opener nor the intro is a
// lesson, so — as in the other Ministry books — both ride with the unit's
// first lesson, whose range therefore starts at the unit opener.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// This book prints no per-lesson objectives; its only printed objectives are
// the unit's outcomes (`Les acquis de l'apprentissage` in unit 1,
// `Les résultats de l'apprentissage` in unit 2) and its `Problématiques
// abordées` on the opener page. Those objective lines are carried, verbatim,
// as the concepts of the unit's first lesson, and every lesson additionally
// carries its own printed topical heads and its closing `Exercices` head.
// Every concept title below is a string the book itself prints on the page its
// `bookFrom` names; nothing is invented. In particular the French heads are
// taken from the French pages even where they differ from the English twin:
// outcome 1-4 speaks of `la photosynthèse` (English: transpiration), lesson
// 1-7 is headed `L'impact des gaz atmosphériques sur les environnements
// aquatiques` (the contents page writes it differently), and the `Le
// rayonnement` head stands on book 86 (the English twin files `Radiation`
// under 85).
//
// HEAD / CONTENTS WORDING GAPS (FRENCH BOOK)
// Several lesson heads print a wording that differs from the `Table des
// matières`: 1-1 (`L'hydrosphère…` vs `La couverture aquatique…`), 1-6
// (`organismes vivants…environnement…` vs `êtres vivants…milieu…`), 1-7, 1-8
// (`Effet…` without `L'`), 1-9 (`pression hydrostatique` vs `pression de
// l'eau`), 2-3 (`Facteurs physiques et leur effet…` vs `Les facteurs
// physiques et leurs effets…`). The table below always follows the head
// printed on the lesson's own first page.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 5 (verified: book p.8 = scan p.13). */
export const BOOK_TO_PDF_OFFSET = 5;

/** First printed page of the term — the unit 1 opener (scan 8). */
export const EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_START = 3;

/** Last printed page of the term — the last lesson's `Exercices` (scan 113). */
export const EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_END = 108;

/** The scanned pages before the term: cover, masthead, introduction, general aims, contents, divider, blank. */
export const EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_FRONT_MATTER = { from: 1, to: 7 } as const;

/** The scanned page after the term: the back cover. */
export const EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BACK_MATTER = { from: 114, to: 114 } as const;

/** One printed component of a lesson — becomes one concept in the app tree. */
export interface IntegratedScienceFrG10T1Concept {
  /** Printed book page where this component starts. */
  bookFrom: number;
  /** The printed component kind: the book's own outcome/issues wording, `Composant` or `Exercice`. */
  kind: string;
  /** The printed head of this component, verbatim. */
  title: string;
}

/** One lesson of the textbook — becomes one lesson in the app tree. */
export interface IntegratedScienceFrG10T1Lesson {
  /** App-addressable key, e.g. "1-2" (unit 1, lesson 2). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثاني". */
  ordinal: string;
  /** The lesson's opening component type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson (without the number prefix). */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: IntegratedScienceFrG10T1Concept[];
}

/** One printed section of the book — one of the two units of the first term. */
export interface IntegratedScienceFrG10T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"2". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "Unité 1 : Le système écologique aquatique". */
  title: string;
  /** The unit head the opener page prints. */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: IntegratedScienceFrG10T1Lesson[];
}

/**
 * The two units of the first term with their fourteen lessons and every
 * printed head, transcribed from the pages the book prints them on and checked
 * by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from the book's `Table des matières` (scan 5); the
 * unit openers' outcomes and `Problématiques abordées` are the first lessons'
 * leading concepts, and each lesson's topical and `Exercices` heads follow,
 * all verbatim.
 */
export const EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_UNITS: IntegratedScienceFrG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "Unité 1 : Le système écologique aquatique",
    printedHead: "Unité 1 : Le système écologique aquatique",
    bookFrom: 3,
    bookTo: 66,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "Acquis de l'apprentissage",
        title: "L'hydrosphère sur la planète Terre",
        printedHead: "1-1 L'hydrosphère sur la planète Terre",
        bookFrom: 5,
        concepts: [
          { bookFrom: 3, kind: "Acquis de l'apprentissage", title: "Identifier l'enveloppe aquatique et sa relation avec les autres enveloppes de la Terre." },
          { bookFrom: 3, kind: "Acquis de l'apprentissage", title: "Expliquer le rôle du cycle de l'eau dans la nature et son implication dans les différents changements environnementaux." },
          {
            bookFrom: 3,
            kind: "Acquis de l'apprentissage",
            title:
              "Expliquer les réactions chimiques dans l'écosystème aquatique et leur impact sur la qualité de l'eau et la durabilité de la vie marine.",
          },
          { bookFrom: 3, kind: "Acquis de l'apprentissage", title: "Déduire le rôle de la photosynthèse dans le cycle de l'eau dans la nature et sa relation avec la durabilité de l'écosystème." },
          {
            bookFrom: 3,
            kind: "Acquis de l'apprentissage",
            title:
              "Illustrer l'effet des propriétés physiques de l'eau comme la chaleur spécifique, ainsi que des facteurs physiques environnants comme la température et la pression sur la répartition des êtres vivants et la durabilité de l'écosystème aquatique.",
          },
          { bookFrom: 3, kind: "Acquis de l'apprentissage", title: "Identifier l'importance biologique de l'eau et son rôle dans la préservation de la structure et des fonctions cellulaires." },
          { bookFrom: 3, kind: "Acquis de l'apprentissage", title: "Expliquer les adaptations biologiques des êtres vivants aux milieux aquatiques et leur rôle dans la durabilité de l'écosystème." },
          { bookFrom: 3, kind: "Problématique abordée", title: "La pollution de l'eau" },
          { bookFrom: 3, kind: "Problématique abordée", title: "Les changements climatiques" },
          { bookFrom: 3, kind: "Problématique abordée", title: "La durabilité des ressources del' eau" },
          { bookFrom: 3, kind: "Problématique abordée", title: "La préservation de la biodiversité" },
          { bookFrom: 3, kind: "Problématique abordée", title: "La gestion des ressources de l'eau" },
          { bookFrom: 3, kind: "Problématique abordée", title: "Les défis de la durabilité face à la croissance démographique" },
          { bookFrom: 4, kind: "Composant", title: "Introduction de l'unité" },
          { bookFrom: 4, kind: "Composant", title: "Prépare-toi!" },
          { bookFrom: 5, kind: "Composant", title: "Premièrement : L'hydrosphère" },
          { bookFrom: 5, kind: "Composant", title: "Le cycle de l'eau dans la nature" },
          { bookFrom: 7, kind: "Exercice", title: "Exercices" },
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: "Composant",
        title: "Les propriétés chimiques de l'eau",
        printedHead: "1-2 Les propriétés chimiques de l'eau",
        bookFrom: 8,
        concepts: [
          { bookFrom: 8, kind: "Composant", title: "La composition chimique de l'eau" },
          { bookFrom: 8, kind: "Composant", title: "Polarité de l'eau" },
          { bookFrom: 9, kind: "Composant", title: "L'eau est un solvant universel" },
          { bookFrom: 10, kind: "Composant", title: "Dissociation du sel de table (NaCl) dans l'eau" },
          { bookFrom: 10, kind: "Composant", title: "L'équilibre ionique de l'eau" },
          { bookFrom: 11, kind: "Composant", title: "Hydrolyse des sels (l'hydratation)" },
          { bookFrom: 11, kind: "Composant", title: "Les sels acides" },
          { bookFrom: 11, kind: "Composant", title: "Les sels basiques" },
          { bookFrom: 11, kind: "Composant", title: "Les sels neutres" },
          { bookFrom: 12, kind: "Composant", title: "Le pH (potentiel hydrogène)" },
          { bookFrom: 12, kind: "Composant", title: "Activité : Mesurer la variation du pH dans différentes échantillons d'eau" },
          { bookFrom: 13, kind: "Composant", title: "Procédure de l'expérience" },
          { bookFrom: 13, kind: "Composant", title: "Mesure à l'aide de bandelettes de test" },
          { bookFrom: 14, kind: "Exercice", title: "Exercices" },
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: "Composant",
        title: "Les propriétés physiques de l'eau",
        printedHead: "1-3 Les propriétés physiques de l'eau",
        bookFrom: 16,
        concepts: [
          { bookFrom: 16, kind: "Composant", title: "La densité" },
          { bookFrom: 16, kind: "Composant", title: "L'Hydromètre (instrument de mesure de la densité des liquides)" },
          { bookFrom: 17, kind: "Composant", title: "Activité : La mesure de la densité de différents échantillons de l'eau" },
          { bookFrom: 18, kind: "Composant", title: "La densité de l'eau dans les océans" },
          { bookFrom: 18, kind: "Composant", title: "La pression dans l'eau" },
          { bookFrom: 18, kind: "Composant", title: "La quantité de sels dissous dans l'eau" },
          { bookFrom: 18, kind: "Composant", title: "La température de l'eau" },
          { bookFrom: 19, kind: "Composant", title: "La densité de l'eau et la température dans les régions polaires" },
          { bookFrom: 20, kind: "Composant", title: "La quantité de chaleur et la température" },
          { bookFrom: 21, kind: "Composant", title: "La chaleur spécifique (c)" },
          { bookFrom: 23, kind: "Composant", title: "La chaleur latente de vaporisation" },
          { bookFrom: 23, kind: "Composant", title: "Effet de la chaleur et de la température sur les organismes marins" },
          { bookFrom: 25, kind: "Exercice", title: "Exercices" },
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: "Composant",
        title: "Les solutions aqueuses et leurs propriétés",
        printedHead: "1-4 Les solutions aqueuses et leurs propriétés",
        bookFrom: 28,
        concepts: [
          { bookFrom: 28, kind: "Composant", title: "Les propriétés colligatives des solutions" },
          { bookFrom: 28, kind: "Composant", title: "La diminution de la pression de vapeur du liquide" },
          { bookFrom: 29, kind: "Composant", title: "L'élévation du point d'ébullition" },
          { bookFrom: 30, kind: "Composant", title: "L'abaissement du point de congélation de l'eau – point de fusion de la glace" },
          { bookFrom: 30, kind: "Composant", title: "L'osmose et la pression osmotique" },
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: "Composant",
        title: "L'importance biologique de l'eau",
        printedHead: "1-5 L'importance biologique de l'eau",
        bookFrom: 31,
        concepts: [
          { bookFrom: 31, kind: "Composant", title: "L'eau dans la cellule vivante" },
          { bookFrom: 34, kind: "Composant", title: "L'importance de l'eau pour les êtres vivants" },
          { bookFrom: 34, kind: "Composant", title: "L'eau et le métabolisme" },
          { bookFrom: 36, kind: "Exercice", title: "Exercices" },
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: "Composant",
        title: "Les adaptations biologiques des organismes vivants dans l'environnement aquatique",
        printedHead: "1-6 Les adaptations biologiques des organismes vivants dans l'environnement aquatique",
        bookFrom: 37,
        concepts: [
          { bookFrom: 37, kind: "Composant", title: "Premièrement : Les adaptations structurelles" },
          { bookFrom: 38, kind: "Composant", title: "Deuxièmement : les adaptations comportementales" },
          { bookFrom: 38, kind: "Composant", title: "Troisièmement : les adaptations physiologiques (fonctionnelles)" },
          { bookFrom: 39, kind: "Composant", title: "Adaptation physiologique des organismes e d'eau douce au faible pression osmotique" },
          { bookFrom: 40, kind: "Composant", title: "Adaptation physiologique des organismes marins à la pression osmotique élevée" },
          { bookFrom: 41, kind: "Exercice", title: "Exercices" },
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        type: "Composant",
        title: "L'impact des gaz atmosphériques sur les environnements aquatiques",
        printedHead: "1-7 L'impact des gaz atmosphériques sur les environnements aquatiques",
        bookFrom: 43,
        concepts: [
          { bookFrom: 43, kind: "Composant", title: "L'oxygène et le dioxyde de carbone dans l'environnement aquatique" },
          { bookFrom: 43, kind: "Composant", title: "Sources d'oxygène dans l'environnement aquatique" },
          { bookFrom: 43, kind: "Composant", title: "Sources de dioxyde de carbone dans le milieu aquatique" },
          { bookFrom: 44, kind: "Composant", title: "Solubilité des deux gaz dans l'eau" },
          { bookFrom: 45, kind: "Composant", title: "Effet de l'augmentation du taux de gaz oxygène dissous dans l'eau" },
          { bookFrom: 46, kind: "Composant", title: "Effet de l'augmentation du taux de dioxyde de carbone dans l'eau sur les organismes aquatiques" },
          { bookFrom: 46, kind: "Composant", title: "Acidification" },
          { bookFrom: 46, kind: "Composant", title: "Affaiblissement de la respiration" },
          { bookFrom: 46, kind: "Composant", title: "Affaiblissement du soutien structurel" },
          { bookFrom: 47, kind: "Composant", title: "Effets de la diminution de la concentration de dioxyde de carbone dans l'eau sur les organismes aquatiques" },
          { bookFrom: 48, kind: "Exercice", title: "Exercices" },
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        type: "Composant",
        title: "Effet de la lumière et du rayonnement solaire sur les milieux aquatiques",
        printedHead: "1-8 Effet de la lumière et du rayonnement solaire sur les milieux aquatiques",
        bookFrom: 50,
        concepts: [
          { bookFrom: 51, kind: "Composant", title: "Le rayonnement solaire dans l'eau" },
          { bookFrom: 52, kind: "Composant", title: "Absorption du rayonnement solaire dans l'eau" },
          { bookFrom: 52, kind: "Composant", title: "Rayonnement solaire et distribution des organismes marins" },
          { bookFrom: 53, kind: "Composant", title: "Effet du rayonnement solaire sur les températures de l'eau" },
          { bookFrom: 53, kind: "Composant", title: "Effet des variations de l'intensité du rayonnement solaire" },
          { bookFrom: 53, kind: "Composant", title: "Effet du rayonnement solaire sur les courants océaniques" },
          { bookFrom: 54, kind: "Exercice", title: "Exercices" },
        ],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        type: "Composant",
        title: "L'effet de la pression hydrostatique sur les êtres vivants",
        printedHead: "1-9 L'effet de la pression hydrostatique sur les êtres vivants",
        bookFrom: 56,
        concepts: [
          { bookFrom: 56, kind: "Composant", title: "La pression en un point à l'intérieur d'un liquide au repos" },
          { bookFrom: 56, kind: "Composant", title: "La pression hydrostatique (pression de l'eau)" },
          { bookFrom: 57, kind: "Composant", title: "L'effet de la pression sur les adaptations biologiques des organismes marins" },
          { bookFrom: 57, kind: "Composant", title: "La vessie natatoire (sac de flottabilité)" },
          { bookFrom: 58, kind: "Composant", title: "Le squelette osseux et cartilagineux" },
          { bookFrom: 59, kind: "Exercice", title: "Exercices" },
        ],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        type: "Composant",
        title: "L'équilibre écologique et le rôle de l'être humain dans la durabilité de la vie aquatique",
        printedHead: "1-10 L'équilibre écologique et le rôle de l'être humain dans la durabilité de la vie aquatique",
        bookFrom: 60,
        concepts: [
          { bookFrom: 60, kind: "Composant", title: "Comment les activités humaines peuvent-elles affecter les écosystèmes aquatiques ?" },
          { bookFrom: 60, kind: "Composant", title: "Importance de l'équilibre écologique dans les écosystèmes aquatiques" },
          { bookFrom: 60, kind: "Composant", title: "L'équilibre des éléments nutritifs" },
          { bookFrom: 60, kind: "Composant", title: "L'équilibre entre les organismes vivants" },
          { bookFrom: 60, kind: "Composant", title: "Le flux d'énergie à travers le réseau alimentaire" },
          { bookFrom: 61, kind: "Composant", title: "Exemple de l'équilibre écologique dans les écosystèmes aquatiques" },
          { bookFrom: 61, kind: "Composant", title: "Les récifs coralliens et l'écosystème marin" },
          { bookFrom: 61, kind: "Composant", title: "L'impact des activités humaines sur la vie aquatique" },
          { bookFrom: 61, kind: "Composant", title: "Le rôle de l'être humain dans la préservation de l'équilibre écologique" },
          { bookFrom: 62, kind: "Composant", title: "La préservation des ressources naturelles" },
          { bookFrom: 63, kind: "Composant", title: "Questions pour t'aider dans ta recherche" },
          { bookFrom: 64, kind: "Exercice", title: "Exercices" },
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "Unité 2 : L'atmosphère",
    printedHead: "Unité 2 : L'atmosphère",
    bookFrom: 67,
    bookTo: 108,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: "Résultat de l'apprentissage",
        title: "Les composants et les couches de l'atmosphère",
        printedHead: "2.1 Les composants et les couches de l'atmosphère",
        bookFrom: 68,
        concepts: [
          { bookFrom: 67, kind: "Résultat de l'apprentissage", title: "Expliquer la structure de l'atmosphère, identifier les principaux constituants et analyser son influence sur la surface terrestre." },
          { bookFrom: 67, kind: "Résultat de l'apprentissage", title: "Distinguer les différentes couches de l'atmosphère et décrire les caractéristiques de chaque couche." },
          {
            bookFrom: 67,
            kind: "Résultat de l'apprentissage",
            title: "Analyser l'effet des facteurs physiques de l'atmosphère, tels que la température, la pression, l'humidité, le rayonnement solaire et la vitesse du vent, sur les êtres vivants.",
          },
          { bookFrom: 67, kind: "Résultat de l'apprentissage", title: "Analyser l'impact des modifications de la couche d'ozone sur la santé humaine et le fonctionnement des organes vitaux." },
          { bookFrom: 67, kind: "Résultat de l'apprentissage", title: "Expliquer l'influence des variations de la pression atmosphérique sur les êtres vivants" },
          { bookFrom: 67, kind: "Résultat de l'apprentissage", title: "Expliquer les stratégies des êtres vivants pour s'adapter aux environnements à climat extrême." },
          { bookFrom: 67, kind: "Résultat de l'apprentissage", title: "Comparer les différents types de tissus végétaux simples en fonction de leur structure et de leur rôle dans le soutien de la plante." },
          { bookFrom: 67, kind: "Résultat de l'apprentissage", title: "Comparer l'influence des divers facteurs physiques de l'atmosphère sur le climat." },
          { bookFrom: 67, kind: "Résultat de l'apprentissage", title: "Expliquer comment les réactions chimiques dans l'atmosphère affectent la qualité de l'air et les changements climatiques." },
          { bookFrom: 67, kind: "Résultat de l'apprentissage", title: "Interpréter chimiquement la formation des pluies acides à partir des oxydes d'azote et de soufre, et analyser leurs effets sur l'être humain et les plantes." },
          { bookFrom: 67, kind: "Résultat de l'apprentissage", title: "Évaluer le rôle des polluants gazeux dans la menace pesant sur la durabilité de l'atmosphère." },
          { bookFrom: 67, kind: "Résultat de l'apprentissage", title: "Montrer comment la science et la technologie ont contribué à réduire la pollution et à protéger l'atmosphère." },
          { bookFrom: 67, kind: "Résultat de l'apprentissage", title: "Proposer des solutions pratiques aux problèmes de pollution de l'air et de changements climatiques, à partir des connaissances acquises." },
          { bookFrom: 67, kind: "Problématique abordée", title: "Pollution de l'air." },
          { bookFrom: 67, kind: "Problématique abordée", title: "Changements climatiques." },
          { bookFrom: 67, kind: "Problématique abordée", title: "Durabilité des ressources." },
          { bookFrom: 67, kind: "Problématique abordée", title: "Préservation de la biodiversité." },
          { bookFrom: 68, kind: "Composant", title: "Les composants et les couches de l'atmosphère" },
          { bookFrom: 68, kind: "Composant", title: "La dynamique de l'atmosphère" },
          { bookFrom: 69, kind: "Composant", title: "L'importance de l'atmosphère" },
          { bookFrom: 69, kind: "Composant", title: "Les principaux composants chimiques de l'atmosphère" },
          { bookFrom: 70, kind: "Composant", title: "Les couches de l'atmosphère" },
          { bookFrom: 71, kind: "Composant", title: "La tropopause" },
          { bookFrom: 71, kind: "Composant", title: "La biodiversité dans la troposphère" },
          { bookFrom: 71, kind: "Composant", title: "La stratosphère" },
          { bookFrom: 72, kind: "Composant", title: "La couche d'ozone" },
          { bookFrom: 72, kind: "Composant", title: "La mésosphère" },
          { bookFrom: 72, kind: "Composant", title: "La thermosphère" },
          { bookFrom: 72, kind: "Composant", title: "L'ionosphère" },
          { bookFrom: 73, kind: "Composant", title: "L'aurore polaire" },
          { bookFrom: 73, kind: "Composant", title: "L'exosphère" },
          { bookFrom: 74, kind: "Composant", title: "Vitesse de libération" },
          { bookFrom: 75, kind: "Composant", title: "Activité : Modèle des couches de l'atmosphère" },
          { bookFrom: 76, kind: "Exercice", title: "Exercices" },
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "Composant",
        title: "Les réactions chimiques dans l'atmosphère",
        printedHead: "2-2 : Les réactions chimiques dans l'atmosphère",
        bookFrom: 78,
        concepts: [
          { bookFrom: 78, kind: "Composant", title: "Les rayons ultraviolets" },
          { bookFrom: 79, kind: "Composant", title: "Formation de l'ozone" },
          { bookFrom: 79, kind: "Composant", title: "La destruction de la couche d'ozone" },
          { bookFrom: 80, kind: "Composant", title: "Les effets de la destruction de la couche d'ozone sur la santé humaine" },
          { bookFrom: 81, kind: "Composant", title: "La réduction de la destruction de l'ozone" },
          { bookFrom: 81, kind: "Composant", title: "L'ozone dans la troposphère" },
          { bookFrom: 82, kind: "Exercice", title: "Exercices" },
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: "Composant",
        title: "Facteurs physiques et leur effet sur l'atmosphère",
        printedHead: "2-3 Facteurs physiques et leur effet sur l'atmosphère",
        bookFrom: 84,
        concepts: [
          { bookFrom: 84, kind: "Composant", title: "Premièrement : la chaleur" },
          { bookFrom: 84, kind: "Composant", title: "Mesurer la température de l'air" },
          { bookFrom: 84, kind: "Composant", title: "La relation entre les échelles de température" },
          { bookFrom: 85, kind: "Composant", title: "Mécanismes de transfert de chaleur" },
          { bookFrom: 86, kind: "Composant", title: "Le rayonnement" },
          { bookFrom: 86, kind: "Composant", title: "Adaptation des organismes aux changements naturels de température" },
          { bookFrom: 86, kind: "Composant", title: "Adaptation au gel (froid intense)" },
          { bookFrom: 87, kind: "Composant", title: "Le poisson des glaces" },
          { bookFrom: 87, kind: "Composant", title: "Adaptation à la chaleur élevée" },
          { bookFrom: 87, kind: "Composant", title: "Les lézards du désert" },
          { bookFrom: 88, kind: "Composant", title: "Deuxièmement : la pression atmosphérique (pression de l'air)" },
          { bookFrom: 88, kind: "Composant", title: "Pression atmosphérique normale" },
          { bookFrom: 89, kind: "Composant", title: "La pression atmosphérique et les êtres vivants" },
          { bookFrom: 89, kind: "Composant", title: "Composants du sang" },
          { bookFrom: 90, kind: "Composant", title: "Troisièmement : le vent" },
          { bookFrom: 91, kind: "Composant", title: "Vitesse du vent" },
          { bookFrom: 91, kind: "Composant", title: "Le rôle des tissus végétaux dans la résistance au vent" },
          { bookFrom: 91, kind: "Composant", title: "Tissu parenchyme" },
          { bookFrom: 91, kind: "Composant", title: "Tissu collenchyme" },
          { bookFrom: 92, kind: "Composant", title: "Tissu sclérenchyme" },
          { bookFrom: 92, kind: "Composant", title: "Quatrièmement : L'humidité" },
          { bookFrom: 92, kind: "Composant", title: "Effet de l'humidité sur l'homme" },
          { bookFrom: 93, kind: "Composant", title: "L'osmorégulation" },
          { bookFrom: 94, kind: "Composant", title: "Effet de l'humidité sur les êtres vivants" },
          { bookFrom: 94, kind: "Composant", title: "Mesurer l'effet des facteurs physiques" },
          { bookFrom: 95, kind: "Composant", title: "Analyse des données météorologiques" },
          { bookFrom: 96, kind: "Exercice", title: "Exercices" },
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: "Composant",
        title: "L'atmosphère et le rôle de la science dans sa durabilité",
        printedHead: "2-4: L'atmosphère et le rôle de la science dans sa durabilité",
        bookFrom: 98,
        concepts: [
          { bookFrom: 98, kind: "Composant", title: "Comprendre l'atmosphère et la protéger" },
          { bookFrom: 98, kind: "Composant", title: "Le réchauffement climatique et le changement climatique" },
          { bookFrom: 99, kind: "Composant", title: "Les effets négatifs du réchauffement climatique" },
          { bookFrom: 99, kind: "Composant", title: "Fonte des glaces" },
          { bookFrom: 99, kind: "Composant", title: "Quelques stratégies pour réduire le réchauffement climatique" },
          { bookFrom: 100, kind: "Composant", title: "La pollution de l'air et son impact sur la durabilité de l'atmosphère" },
          { bookFrom: 101, kind: "Composant", title: "Le monoxyde de carbone (CO)" },
          { bookFrom: 101, kind: "Composant", title: "Les oxydes de soufre et les oxydes d'azotes" },
          { bookFrom: 102, kind: "Composant", title: "Formation des pluies acides" },
          { bookFrom: 102, kind: "Composant", title: "La formation de l'acide sulfurique" },
          { bookFrom: 102, kind: "Composant", title: "La formation de l'acide nitrique" },
          { bookFrom: 102, kind: "Composant", title: "Les effets néfastes résultants" },
          { bookFrom: 103, kind: "Composant", title: "Le rôle de la science et de la technologie dans la protection et la guérison" },
          { bookFrom: 103, kind: "Composant", title: "La surveillance et la prévision" },
          { bookFrom: 104, kind: "Composant", title: "Les satellites et la télédétection" },
          { bookFrom: 104, kind: "Composant", title: "Les stations météorologiques" },
          { bookFrom: 105, kind: "Composant", title: "Les modèles climatiques" },
          { bookFrom: 105, kind: "Composant", title: "L'importance biologique des prévisions" },
          { bookFrom: 107, kind: "Composant", title: "Activités scientifiques variées" },
          { bookFrom: 107, kind: "Composant", title: "Développer des projets ou des modèles pour des solutions environnementales" },
          { bookFrom: 107, kind: "Composant", title: "Discussion d'études de cas réels" },
          { bookFrom: 107, kind: "Composant", title: "Intégration des sciences (technologie et sciences de l'environnement)" },
          { bookFrom: 108, kind: "Exercice", title: "Exercices" },
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the unit
 * — so the unit opener and its intro page stay inside the unit they belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This book has no
 * appendix and no back matter that any lesson quotes: every page of the term
 * belongs to a unit. Kept as a function so the seeder and the stage share one
 * shape across all the books.
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
  "integrated-science-fr-g10-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. Only the front
 * matter (scan 7) is blank; the loader normalises such pages to "" so a future
 * page map cannot mistake a blank for content.
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

/**
 * Folds text for comparison: lowercases and removes every non-letter or digit,
 * so OCR spacing, punctuation and apostrophe shapes cannot break a match.
 * French diacritics are letters and survive on both sides, and both sides go
 * through the same fold, so `l'air` matches `l›air` and `L' Hydromètre`
 * matches `L'Hydromètre`.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring OCR spacing and punctuation. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints in its running foot. Odd scans
 * close with `<n> Sciences intégrées`; even scans close with `Première
 * secondaire <n>`, sometimes split over two lines (books 13, 63, 65) and once
 * printed mid-page above trailing figure captions (book 20). A number is a
 * candidate only when it stands beside one of those two wordings, so body
 * numbers (pH scales, temperatures, exercise numbering) can never qualify.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  const out: number[] = [];
  for (const m of text.matchAll(/(\d{1,3})\s+Sciences\s+intégrées/gi)) out.push(Number(m[1]));
  for (const m of text.matchAll(/Première\s+secondaire\s+(\d{1,3})/gi)) out.push(Number(m[1]));
  return out;
}

/**
 * The book number a content page prints in its running foot, or null. Every
 * content page that carries a folio prints exactly one number there and it is
 * its own, which is what fixes `BOOK_TO_PDF_OFFSET = 5`; a page whose foot
 * carries no folio returns null and must be anchored another way.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The four term pages whose printed folio the OCR did not capture: the two
 * unit openers (books 3 and 67, which print no folio at all), book 9 (a
 * mid-lesson continuation with neither head nor foot) and book 85 (which
 * prints `Première secondaire` with the number itself missing). Rather than
 * weaken the page-number check, they are exempt from it and anchored on the
 * book's own words printed on the page instead.
 */
const FOLIO_LESS_PAGES: ReadonlySet<number> = new Set([3, 9, 67, 85]);

/** Running-foot wordings a folio-less page may print instead of its number. */
const RUNNING_FEET = ["Sciences intégrées", "Première secondaire"];

/** The section that owns a term page, or undefined. */
function sectionForPage(book: number): IntegratedScienceFrG10T1Section | undefined {
  return EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_UNITS.find((s) => book >= s.bookFrom && book <= s.bookTo);
}

/** The lesson range that owns a term page, or undefined. */
function rangeForPage(book: number): { key: string; title: string; from: number; to: number } | undefined {
  return allLessonRanges().find((r) => book >= r.from && book <= r.to);
}

/**
 * Table invariants: lesson keys match their position, every range sits inside its
 * section, component pages rise inside their lesson, the sections tile the book
 * with no gaps or overlaps, and the first/last sections hit the book's own bounds.
 * A content mistake here would quietly ground the tutor on the wrong pages, so it
 * fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_UNITS;
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
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا مكوّنات`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول مكوّن «${lesson.concepts[0]!.kind}»`);
      }

      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((concept, ci) => {
        if (!concept.title.trim()) problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: بلا عنوان`);
        if (concept.bookFrom < unit.bookFrom || concept.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: صفحته ${concept.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && concept.bookFrom < prev.bookFrom) {
          problems.push(`الدرس ${lesson.key}: صفحات المكوّنات تنازلية (${prev.bookFrom} ثم ${concept.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }
      const lastConcept = lesson.concepts.at(-1)!;
      if (lastConcept.bookFrom < from || lastConcept.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: مكوّنه الأخير ${lastConcept.bookFrom} خارج نطاقه ${from}–${to}`);
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
  if (first && first.bookFrom !== EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio, or, on the four folio-less pages, from the book's own words
 *     on the page (the running foot, the unit head, the owning lesson's head or
 *     the page's own concept head);
 *  2. every unit's opener prints the unit head and every lesson's first page prints
 *     that lesson's head;
 *  3. every lesson's title and every concept's head is printed on the pages the
 *     lesson owns (the concept on its own page);
 *  4. every printed page in [3, 108] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_UNITS;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // Concepts by page, for anchoring folio-less pages on the head they print.
  const conceptsByPage = new Map<number, string[]>();
  for (const unit of units) {
    for (const lesson of unit.lessons) {
      for (const concept of lesson.concepts) {
        const list = conceptsByPage.get(concept.bookFrom) ?? [];
        list.push(concept.title);
        conceptsByPage.set(concept.bookFrom, list);
      }
    }
  }

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_START || book > EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_END) {
      continue;
    }
    printedPages.add(book);
    pagesChecked += 1;

    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }

    if (FOLIO_LESS_PAGES.has(book)) {
      // No usable folio in the OCR: anchor the page on the book's own words —
      // the running foot, its unit head, its owning lesson's head/title, or a
      // concept head assigned to that very page — instead of weakening the
      // page-number check for every page.
      const section = sectionForPage(book);
      const range = rangeForPage(book);
      const ownerLesson = units.flatMap((u) => u.lessons).find((l) => l.key === range?.key);
      const anchored =
        RUNNING_FEET.some((foot) => normalize(text).includes(normalize(foot))) ||
        (section !== undefined && normalize(text).includes(normalize(section.printedHead))) ||
        (ownerLesson !== undefined &&
          (normalize(text).includes(normalize(ownerLesson.printedHead)) ||
            normalize(text).includes(normalize(ownerLesson.title)))) ||
        (conceptsByPage.get(book) ?? []).some((title) => normalize(text).includes(normalize(title)));
      if (!anchored) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع ولا مرساة من كلمات الكتاب نفسه`);
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

  if (printedPages.size !== EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_END - EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_START} و${EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_END}`,
    );
  }

  // 2 + 3a. every unit opener prints the unit head, every lesson's first page its
  // head, and every lesson's title is printed somewhere in the pages it owns.
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

  // 3b. every concept's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((concept) => {
        if (!pagePrints(concept.bookFrom, concept.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة المكوّن ${concept.bookFrom} لا تطبع «${concept.title}»`);
        }
      });
    });
  });

  // 4. every printed content page is owned by exactly one lesson.
  const owners = new Map<number, string[]>();
  for (const range of allLessonRanges()) {
    for (let p = range.from; p <= range.to; p++) {
      const list = owners.get(p) ?? [];
      list.push(range.key);
      owners.set(p, list);
    }
  }
  for (let book = EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_START; book <= EGYPT_INTEGRATED_SCIENCE_FR_G10_T1_BOOK_END; book++) {
    const list = owners.get(book) ?? [];
    if (list.length !== 1) {
      problems.push(
        `صفحة الكتاب ${book}: ${list.length === 0 ? "لا يملكها أي درس" : `يملكها أكثر من درس (${list.join("، ")})`}`,
      );
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
