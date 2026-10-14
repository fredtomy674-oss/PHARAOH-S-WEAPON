// Official Egypt Primary-4 (Grade 4) Science, French-medium, first term —
// Ministry of Education and Technical Education edition prepared with
// Discovery Education (cover imprint «2025-2026», Science Techbook programme).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g4-science-fr`, subject `science-fr` (name "Sciences (Français)"),
// lesson prefix `l-g4-sci-fr-`, grade `grade-4` (name "Primary 4").
//
// The curriculum tree for the Egypt `eg-g4-science-fr` curriculum is rebuilt
// from the Ministry textbook `Sciences — 4ème Primaire — 1er Semestre` (128
// scanned pages). This module is the single source of truth for its structure:
// the two printed unités of the first term (Unité 1 : Systèmes vivants,
// Unité 2 : Mouvement), every numbered leçon inside them (25 lessons —
// exactly as the book's own «Table des matières» on scans 8–9 lists them),
// and, for every lesson, the book's own printed heads — the «Leçon N» head
// plus the «Activité M … comme un scientifique» activity heads the pages
// print — verbatim and with the printed page they start on. The self-checks
// at the bottom prove that mapping against the OCR itself, page by page.
//
// This is the French edition of the same book as `egyptScienceEnG4T1.ts`
// (English medium): it prints the same two units, the same six concepts and
// the same printed page numbers, so this module mirrors that one
// lesson-by-lesson while taking its titles and its transcript from the
// French scans. Unlike its twin, every term scan of this corpus carries a
// text layer, so all 25 contents lessons are recorded (the twin merges the
// English void spread at books 88–89 into its lesson 2-5).
//
// THE OFFSET IS TEN — book page = scan page − 10
// Every content page that carries a folio prints its own number in its
// running head, so `BOOK_TO_PDF_OFFSET` is fixed by the scans and quoted
// here: scan 11 prints «1 Unité 1: Systèmes vivants» (book 1, the Unité-1
// opener), scan 15 prints «5 Concept 1.1: Adaptation et survie» (book 5),
// scan 77 prints «67 Unité 2 : Mouvement» (book 67, the Unité-2 opener),
// scan 121 prints «111 Concept 2.3: Énergie et collision» (book 111) and
// scan 127 prints «117» (book 117, the term's last page). The book's own
// Table des matières (scans 8–9) independently confirms the lesson starts:
// every «Leçon» sits exactly where the contents says it does (5, 8, 14, 21,
// 23, 27, 30, 33, 36, 41, 46, 50, 52, 71, 74, 77, 81, 85, 88, 90, 94, 97,
// 101, 105, 107).
//
// TERM = THE NUMBERED BOOK PAGES (books 1–117)
// Scan pages 1–10 are before the term: the cover (1), the «Nom» page (2),
// the copyright page (3), the «PRÉFACE» (4), the minister's address (5), the
// parent letter (6–7) and the printed «Table des matières» (8–9) plus the
// Unité-1 video page (10). Scan page 128 is after the term (the back cover,
// a 0-byte file). The term runs from the Unité-1 «Commencer» opener (book 1
// = scan 11) to the second Safety page (book 117 = scan 127):
// `EGYPT_SCIENCE_FR_G4_T1_BOOK_START` / `_BOOK_END` are exactly those two
// pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` is therefore 117 − 1 + 1 − 0 = 117 (no scan
// of the term is missing).
//
// ONE TERM PAGE PRINTS NO FOLIO — IT IS THE UNITÉ-2 ART OPENER
// Book 66 is the «Unité 2 : Mouvement» full-page art opener: its text layer
// holds only the theme/unit header and the printer's slug («…indd 134…»,
// an imposition number, not a folio). Rather than weaken the page-number
// check, it is anchored on the unit head the page itself prints, named in
// `FOLIO_LESS_ANCHORS`. Every other term page proves its own number from
// its running head, so `FOOTER_OCR_MISREADS` is empty and no folio the OCR
// could parse mismatches its page.
//
// THE FOLIO CHECK READS HEAD FURNITURE PLUS THE DISPLACED HEAD
// Odd pages print «N Concept …» / «N Unité …» leading (books 5, 19, 23, 27,
// 33, 41, 45, 51, 53, 67, 69, 71, 73, 75, 77, 79, 81, 85, 87, 89, 95, 99,
// 101, 103, 105, 109, 111, 113, 115); even pages print a bare «N» on the
// first line, sometimes doubled («6 6», «30 30», «76 76», «96 96»); the
// band-led pages carry the bare folio a few lines down («8», «14» … and,
// after their «Leçon N» head, «46», «50», «52»). `footerCandidates`
// therefore reads bare numerals from the first six and the last four lines
// and the leading head number from every line. Lesson numbers («Leçon 2»
// → «2») and the printer slugs («…indd 30…» → «30») join the candidate set
// harmlessly: the page's own number proves the mapping when present. Two
// measured oddities stay strict: book 107 opens with a floated book-7
// fragment («7 Concept 1.1 … Activité 3 …») before its own head («107
// Concept 2.3 …» thirty lines down) — both numbers are candidates and the
// page's own wins; book 58 embeds one floated book-34 fragment mid-page,
// outside every window.
// (This book prints no letter-spaced folios, so no digit-run joining is
// needed; the «N.n …» band openers such as «2.1 Se demander …» never match
// the head pattern, which requires whitespace after the number.)
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every lesson contributes its «Leçon N» head (number + word, exactly as the
// opener prints it — the text layer splits it across two lines, «Leçon» /
// «N», which `normalize` rejoins) plus one concept per printed activity:
// «Activité M» glued to the Comme-un-scientifique phrase on the very next
// line («Activité 4 Analyser comme un scientifique»), transcribed verbatim
// from the page it starts on. Nothing is invented: every concept title below
// is a string the book itself prints on the page its `bookFrom` names. The
// Discutons-ensemble prompts, Compétences-de-vie lines, Pratique-Enquête
// material lists and figure captions carry no activity number of their own,
// so they contribute no concept of their own — same as the English twin's
// marginal boxes. The activity's topic line («Lézard du désert»,
// «Principes de base de l'énergie» …) is the lesson's title, not part of
// the activity head.
//
// LESSON TITLES ARE THE OPENER'S OWN TOPIC HEAD
// Each lesson's `title` (and, except lesson 2-10, its `printedHead`) is the
// distinctive head its opener prints: the figure or investigation topic
// («Lézard du désert», «Comment les poissons respirent-ils ?»,
// «Enquête pratique : Réflexion de la lumière», …). The three pure-intro
// openers (books 41, 71, 85, 97) print no topic of their own, so those
// lessons keep the Activité 1 head the opener does print («Peux-tu
// expliquer ?»). Lesson 2-10 (book 101) prints its «Leçon 2» head and its
// Activité 4 head but no topic of its own; it keeps «Leçon 2» as
// `printedHead` and the in-range continuation head («vitesse, suite»,
// book 102) as its title — exactly as the twin keeps the void opener's
// lesson head.
//
// TEXT-LAYER QUIRKS RECORDED, NOT WORKED AROUND
// `normalize` drops case, spacing and punctuation, so the wrapped heads
// («La façon des animaux en utilisant les systèmes de / communication»,
// «Enregistrer les preuves comme un / scientifique»,
// «Enquête pratique: / Vitesse et collision») still match their
// single-line transcription. Stored byte-verbatim are the book's own
// spellings: «La mongouste égyptienne» (with «ou», book 27), «Evaluer
// comme un scientifique» (no accent, book 87 only — every other lesson
// prints «Évaluer»), «Enregistrer des preuves comme un scientifique»
// (with «des», book 50 — the other record-evidence lessons print «les»)
// and «Penser comme un scientifique» (book 14 prints a trailing colon,
// dropped as in the twin).
//
// CONCEPT OPENERS RIDE WITH THE LESSONS THEY TOUCH
// Each unit's first lesson starts on the unit's own «Commencer» page
// (books 1 and 67 print no lesson head of their own), so `lessonBookRange`
// starts a unit's first lesson at the section head, exactly as the other
// Egyptian specs do. The mid-unit «CONCEPT» openers land where the tiling
// puts them: book 26 closes lesson 1-5, book 40 closes lesson 1-9, book 70
// opens lesson 2-1, book 84 closes lesson 2-4 and book 96 closes lesson
// 2-7. The Unit Projects, the Interdisciplinary Project, the «Évaluer ton
// apprentissage» pages and the two Safety pages close their unit's last
// lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 10 (verified: book p.117 = scan p.127). */
export const BOOK_TO_PDF_OFFSET = 10;

/** First printed page of the term — the Unité-1 «Commencer» opener (scan 11). */
export const EGYPT_SCIENCE_FR_G4_T1_BOOK_START = 1;

/** Last printed page of the term — the second Safety page (scan 127). */
export const EGYPT_SCIENCE_FR_G4_T1_BOOK_END = 117;

/** The scanned pages before the term: cover, Nom, copyright, préface, minister address, parent letter, contents, Unité-1 video. */
export const EGYPT_SCIENCE_FR_G4_T1_FRONT_MATTER = { from: 1, to: 10 } as const;

/** The scanned pages after the term: the back cover (scan 128, no text layer). */
export const EGYPT_SCIENCE_FR_G4_T1_BACK_MATTER = { from: 128, to: 128 } as const;

/**
 * The term pages the OCR never produced, in book pages. All 128 scans are
 * present and every term scan carries a text layer, so there are none; the
 * constant is kept so this module shares the shape of the other Egyptian
 * specs (and so the checker's expected page count subtracts it).
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of the textbook — becomes one concept in the app tree. */
export interface ScienceFrG4T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The head's own printed label: "Leçon" or "Activité". */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson of the book — becomes one lesson in the app tree. */
export interface ScienceFrG4T1Lesson {
  /** App-addressable key, e.g. "1-3" (unit 1, lesson 3). */
  key: string;
  /** Arabic ordinal of the lesson number within its unit, e.g. "الثالث". */
  ordinal: string;
  /** The lesson's opening head type — its first concept's kind ("Leçon"). */
  type: string;
  /** Lesson title: the opener's own topic head (see the header note). */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`): the topic head — or, for lesson 2-10
   * (book 101, which prints no topic of its own), the «Leçon 2» head the
   * opener does print.
   */
  printedHead: string;
  /** First printed book page of the lesson itself (its contents page). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: ScienceFrG4T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed unit of the term. */
export interface ScienceFrG4T1Unit {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"2", in book order. */
  key: string;
  /** Arabic ordinal of the unit as used in the app tree, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "Unité 1 : Systèmes vivants". */
  title: string;
  /** The unit head its opener prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next opener). */
  bookTo: number;
  lessons: ScienceFrG4T1Lesson[];
}

const LECON = "Leçon";
const ACTIVITE = "Activité";

function concept(bookFrom: number, kind: string, title: string): ScienceFrG4T1Concept {
  return { bookFrom, kind, title };
}

function lessonHead(bookFrom: number, title: string): ScienceFrG4T1Concept {
  return concept(bookFrom, LECON, title);
}

function activity(bookFrom: number, title: string): ScienceFrG4T1Concept {
  return concept(bookFrom, ACTIVITE, title);
}

/**
 * The two units of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit ranges come from the pages' own «Unité N» openers: 1–66 and 67–117.
 * Lesson starts come from the «Leçon N» openers and match the book's Table
 * des matières exactly (5, 8, 14, 21, 23, 27, 30, 33, 36, 41, 46, 50, 52,
 * 71, 74, 77, 81, 85, 88, 90, 94, 97, 101, 105, 107).
 */
export const EGYPT_SCIENCE_FR_G4_T1_UNITS: ScienceFrG4T1Unit[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "Unité 1 : Systèmes vivants",
    printedHead: "Unité 1: Systèmes vivants",
    bookFrom: 1,
    bookTo: 66,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: LECON,
        title: "Lézard du désert",
        printedHead: "Lézard du désert",
        bookFrom: 5,
        concepts: [
          lessonHead(5, "Leçon 1"),
          activity(5, "Activité 1 Peux-tu expliquer ?"),
          activity(6, "Activité 2 Poser des questions comme un scientifique"),
          activity(7, "Activité 3 Observer comme un scientifique"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: LECON,
        title: "Types d’adaptations",
        printedHead: "Types d’adaptations",
        bookFrom: 8,
        concepts: [
          lessonHead(8, "Leçon 2"),
          activity(8, "Activité 4 Analyser comme un scientifique"),
          activity(10, "Activité 5 Observer comme un scientifique"),
          activity(12, "Activité 6 Analyser comme un scientifique"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: LECON,
        title: "Un Phytologue",
        printedHead: "Un Phytologue",
        bookFrom: 14,
        concepts: [
          lessonHead(14, "Leçon 3"),
          activity(14, "Activité 7 Penser comme un scientifique"),
          activity(16, "Activité 8 Observer comme un scientifique"),
          activity(19, "Activité 9 Observer comme un scientifique"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: LECON,
        title: "Comment les poissons respirent-ils ?",
        printedHead: "Comment les poissons respirent-ils ?",
        bookFrom: 21,
        concepts: [
          lessonHead(21, "Leçon 4"),
          activity(21, "Activité 10 Observer comme un scientifique"),
          activity(22, "Activité 11 Analyser comme un scientifique"),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: LECON,
        title: "Le pingouin",
        printedHead: "Le pingouin",
        bookFrom: 23,
        concepts: [
          lessonHead(23, "Leçon 5"),
          activity(23, "Activité 12 Enregistrer les preuves comme un scientifique"),
          activity(24, "Activité 13 Analyser comme un scientifique"),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: LECON,
        title: "La mongouste égyptienne",
        printedHead: "La mongouste égyptienne",
        bookFrom: 27,
        concepts: [
          lessonHead(27, "Leçon 1"),
          activity(27, "Activité 1 Peux-tu expliquer ?"),
          activity(28, "Activité 2 Poser des questions comme un scientifique"),
          activity(29, "Activité 3 Évaluer comme un scientifique"),
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        type: LECON,
        title: "Les sens pour la nuit",
        printedHead: "Les sens pour la nuit",
        bookFrom: 30,
        concepts: [
          lessonHead(30, "Leçon 2"),
          activity(30, "Activité 4 Observer comme un scientifique"),
          activity(31, "Activité 5 Analyser comme un scientifique"),
          activity(32, "Activité 6 Évaluer comme un scientifique"),
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        type: LECON,
        title: "Comment fonctionne le système nerveux ?",
        printedHead: "Comment fonctionne le système nerveux ?",
        bookFrom: 33,
        concepts: [
          lessonHead(33, "Leçon 3"),
          activity(33, "Activité 7 Observer comme un scientifique"),
          activity(34, "Activité 8 Évaluer comme un scientifique"),
        ],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        type: LECON,
        title: "La façon des animaux en utilisant les systèmes de communication",
        printedHead: "La façon des animaux en utilisant les systèmes de communication",
        bookFrom: 36,
        concepts: [
          lessonHead(36, "Leçon 4"),
          activity(36, "Activité 9 Observer comme un scientifique"),
          activity(38, "Activité 10 Analyser comme un scientifique"),
        ],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        type: LECON,
        title: "Peux-tu expliquer ?",
        printedHead: "Peux-tu expliquer ?",
        bookFrom: 41,
        concepts: [
          lessonHead(41, "Leçon 1"),
          activity(41, "Activité 1 Peux-tu expliquer ?"),
          activity(42, "Activité 2 Poser des questions comme un scientifique"),
          activity(44, "Activité 3 Évaluer comme un scientifique"),
        ],
      },
      {
        key: "1-11",
        ordinal: "الحادي عشر",
        type: LECON,
        title: "Enquête pratique : Réflexion de la lumière",
        printedHead: "Enquête pratique : Réflexion de la lumière",
        bookFrom: 46,
        concepts: [
          lessonHead(46, "Leçon 2"),
          activity(46, "Activité 4 Enquêter comme un scientifique"),
          activity(48, "Activité 5 Analyser comme un scientifique"),
        ],
      },
      {
        key: "1-12",
        ordinal: "الثاني عشر",
        type: LECON,
        title: "Spectacle de luciole lumineux",
        printedHead: "Spectacle de luciole lumineux",
        bookFrom: 50,
        concepts: [
          lessonHead(50, "Leçon 3"),
          activity(50, "Activité 6 Enregistrer des preuves comme un scientifique"),
          activity(51, "Activité 7 Évaluer comme un scientifique"),
        ],
      },
      {
        key: "1-13",
        ordinal: "الثالث عشر",
        type: LECON,
        title: "Transfert d’informations",
        printedHead: "Transfert d’informations",
        bookFrom: 52,
        concepts: [
          lessonHead(52, "Leçon 4"),
          activity(52, "Activité 8 Analyser comme un scientifique"),
          activity(53, "Activité 9 Évaluer comme un scientifique"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "Unité 2 : Mouvement",
    printedHead: "Unité 2 : Mouvement",
    bookFrom: 67,
    bookTo: 117,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: LECON,
        title: "Peux-tu expliquer ?",
        printedHead: "Peux-tu expliquer ?",
        bookFrom: 71,
        concepts: [
          lessonHead(71, "Leçon 1"),
          activity(71, "Activité 1 Peux-tu expliquer ?"),
          activity(72, "Activité 2 Poser des questions comme un scientifique"),
          activity(73, "Activité 3 Observer comme un scientifique"),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: LECON,
        title: "Que sais-tu déjà sur le sujet de démarrage et d’arrêt ?",
        printedHead: "Que sais-tu déjà sur le sujet de démarrage et d’arrêt ?",
        bookFrom: 74,
        concepts: [
          lessonHead(74, "Leçon 2"),
          activity(74, "Activité 4 Observer comme un scientifique"),
          activity(75, "Activité 5 Analyser comme un scientifique"),
          activity(76, "Activité 6 Observer comme un scientifique"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: LECON,
        title: "Arrêt du mouvement",
        printedHead: "Arrêt du mouvement",
        bookFrom: 77,
        concepts: [
          lessonHead(77, "Leçon 3"),
          activity(77, "Activité 7 Analyser comme un scientifique"),
          activity(79, "Activité 8 Enquêter comme un scientifique"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: LECON,
        title: "Énergie, Travail et Force",
        printedHead: "Énergie, Travail et Force",
        bookFrom: 81,
        concepts: [
          lessonHead(81, "Leçon 4"),
          activity(81, "Activité 9 Observer comme un scientifique"),
          activity(82, "Activité 10 Enregistrer les preuves comme un scientifique"),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: LECON,
        title: "Peux-tu expliquer ?",
        printedHead: "Peux-tu expliquer ?",
        bookFrom: 85,
        concepts: [
          lessonHead(85, "Leçon 1"),
          activity(85, "Activité 1 Peux-tu expliquer ?"),
          activity(86, "Activité 2 Poser des questions comme un scientifique"),
          activity(87, "Activité 3 Evaluer comme un scientifique"),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: LECON,
        title: "Principes de base de l’énergie",
        printedHead: "Principes de base de l’énergie",
        bookFrom: 88,
        concepts: [
          lessonHead(88, "Leçon 2"),
          activity(88, "Activité 4 Observer comme un scientifique"),
          activity(89, "Activité 5 Analyser comme un scientifique"),
        ],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        type: LECON,
        title: "Quelles sont les différentes formes d’énergie potentielle et cinétique ?",
        printedHead: "Quelles sont les différentes formes d’énergie potentielle et cinétique ?",
        bookFrom: 90,
        concepts: [
          lessonHead(90, "Leçon 3"),
          activity(90, "Activité 6 Analyser comme un scientifique"),
          activity(92, "Activité 7 Observer comme un scientifique"),
        ],
      },
      {
        key: "2-8",
        ordinal: "الثامن",
        type: LECON,
        title: "Outil de vie facile",
        printedHead: "Outil de vie facile",
        bookFrom: 94,
        concepts: [
          lessonHead(94, "Leçon 4"),
          activity(94, "Activité 8 Évaluer comme un scientifique"),
          activity(95, "Activité 9 Enregistrer les preuves comme un scientifique"),
        ],
      },
      {
        key: "2-9",
        ordinal: "التاسع",
        type: LECON,
        title: "Peux-tu expliquer ?",
        printedHead: "Peux-tu expliquer ?",
        bookFrom: 97,
        concepts: [
          lessonHead(97, "Leçon 1"),
          activity(97, "Activité 1 Peux-tu expliquer ?"),
          activity(98, "Activité 2 Poser des questions comme un scientifique"),
          activity(99, "Activité 3 Observer comme un scientifique"),
        ],
      },
      {
        key: "2-10",
        ordinal: "العاشر",
        type: LECON,
        title: "vitesse, suite",
        printedHead: "Leçon 2",
        bookFrom: 101,
        concepts: [
          lessonHead(101, "Leçon 2"),
          activity(101, "Activité 4 Analyser comme un scientifique"),
          activity(103, "Activité 5 Enquêter comme un scientifique"),
        ],
      },
      {
        key: "2-11",
        ordinal: "الحادي عشر",
        type: LECON,
        title: "Qu’observons-nous lorsque des objets entrent en collision ?",
        printedHead: "Qu’observons-nous lorsque des objets entrent en collision ?",
        bookFrom: 105,
        concepts: [
          lessonHead(105, "Leçon 3"),
          activity(105, "Activité 6 Analyser comme un scientifique"),
          activity(106, "Activité 7 Analyser comme un scientifique"),
        ],
      },
      {
        key: "2-12",
        ordinal: "الثاني عشر",
        type: LECON,
        title: "Enquête pratique: Vitesse et collision",
        printedHead: "Enquête pratique: Vitesse et collision",
        bookFrom: 107,
        concepts: [
          lessonHead(107, "Leçon 4"),
          activity(107, "Activité 8 Enquêter comme un scientifique"),
          activity(109, "Activité 9 Analyser comme un scientifique"),
          activity(111, "Activité 10 Analyser comme un scientifique"),
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
 * lesson — the «Commencer» opener) or its own start page, up to the
 * page before the next lesson starts, or the section's last page for its last
 * lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_SCIENCE_FR_G4_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SCIENCE_FR_G4_T1_UNITS.forEach((section, si) => {
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
  for (const section of EGYPT_SCIENCE_FR_G4_T1_UNITS) {
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
  "science-fr-g4-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (No term page of this book needs it — every term scan carries a
 * text layer — but the guard keeps the loader the same shape across the
 * books.)
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
  const lesson = EGYPT_SCIENCE_FR_G4_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
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
 * Page-number candidates a content page prints. The folio rides in the
 * running head at the top of the page: a bare numeral on even pages («108»,
 * «6 6», «30 30») and the number leading the head («27 Concept 1.2 …»,
 * «67 Unité 2 : Mouvement», «113 Unit é 2 …») on odd pages; the band-led
 * pages carry the bare folio a few lines down («8», «14», and — after their
 * «Leçon N» head — «46», «50», «52»). The first six and the last four lines
 * therefore contribute every whitespace-separated digit token, and every
 * line contributes a leading head number. Lesson numbers («Leçon 2» → «2»),
 * concept numbers («1.1» never matches — the head pattern needs whitespace
 * after the digits) and the printer slugs («…indd 30…» → «30») join the
 * candidate set harmlessly: the page's own number proves the mapping when
 * present. Book 107's own head («107 Concept 2.3 …») sits thirty lines down
 * behind a floated book-7 fragment, which is why the head pattern walks
 * every line instead of only the furniture.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const numbers = new Set<number>();
  const push = (n: number): void => {
    if (n > 0) numbers.add(n);
  };
  for (const line of [...lines.slice(0, 6), ...lines.slice(-4)]) {
    for (const token of line.split(/\s+/)) {
      if (/^\d{1,3}$/.test(token)) push(Number(token));
    }
  }
  for (const line of lines) {
    const match = line.match(/^(\d{1,3})\s+(Concept|Unit[ée]?|Th[èe]me)\b/);
    if (match) push(Number(match[1]));
  }
  return [...numbers].sort((a, b) => a - b);
}

/**
 * The book number a content page prints, or null when it prints none. Returns
 * the page's own number when it is among the candidates, otherwise the largest
 * candidate (so a wrong page still reports a number and the caller can see the
 * mismatch). The Unité-2 art opener (book 66) prints no folio at all, so that
 * page is exempted via `FOLIO_LESS_ANCHORS`.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * Folios whose OCR printed a different, still parseable number. Every folio in
 * this book came out right, so the map is empty and the folio check stays
 * exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no folio at all, each with the anchor the check
 * accepts in place of a page number: the «Unité 2 : Mouvement» art opener
 * (book 66), whose text layer holds only the theme/unit header and the
 * printer's slug. The anchor is the unit head the page itself prints.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  66: "Unité 2 : Mouvement",
};

/** Every head kind the table may use. */
const KNOWN_KINDS = new Set([LECON, ACTIVITE]);

/**
 * Table invariants: lesson keys are unique and follow (section-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_SCIENCE_FR_G4_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_SCIENCE_FR_G4_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_SCIENCE_FR_G4_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SCIENCE_FR_G4_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_SCIENCE_FR_G4_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     the folio in its running head, or, on the page named in
 *     `FOLIO_LESS_ANCHORS`, from the anchor the page itself prints. No term
 *     scan is missing (`MISSING_SCANS` is empty);
 *  2. every section opener prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title (or its printed head) and every activity's head is
 *     printed on the pages the lesson owns (the activity on its own page);
 *  4. every page in [1, 117] is owned by exactly one lesson — no page falls
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
  const sections = EGYPT_SCIENCE_FR_G4_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SCIENCE_FR_G4_T1_BOOK_START || book > EGYPT_SCIENCE_FR_G4_T1_BOOK_END) continue;
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
  for (let p = EGYPT_SCIENCE_FR_G4_T1_BOOK_START; p <= EGYPT_SCIENCE_FR_G4_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_SCIENCE_FR_G4_T1_BOOK_END - EGYPT_SCIENCE_FR_G4_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_SCIENCE_FR_G4_T1_BOOK_START} و${EGYPT_SCIENCE_FR_G4_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
