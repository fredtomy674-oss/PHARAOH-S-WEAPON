// Official Egypt Primary-5 (Grade 5) Science, French-medium, first term —
// Ministry of Education and Technical Education edition prepared with
// Discovery Education (cover imprint «2025/2026», Science Techbook programme).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g5-science-fr`, subject `science-fr` (name "Sciences (Français)"),
// lesson prefix `l-g5-sci-fr-`, grade `grade-5` (name "Primary 5").
//
// The curriculum tree for the Egypt `eg-g5-science-fr` curriculum is rebuilt
// from the Ministry textbook `Sciences — 5ème Primaire — 1er Semestre` (130
// scanned pages). This module is the single source of truth for its structure:
// the two printed unités of the first term (Unité 1 : Interactions des
// organismes, Unité 2 : Particules en mouvement), every numbered leçon inside
// them (27 lessons — the book's own «Table des matières» on scans 9–10 plus
// the «Leçon» bands the pages themselves print), and, for every lesson, the
// book's own printed heads — the «Leçon N» head plus the «Activité M … comme
// un scientifique» activity heads the pages print — verbatim and with the
// printed page they start on. The self-checks at the bottom prove that mapping
// against the OCR itself, page by page.
//
// This is the French edition of the same book as `egyptScienceG5T1.ts`
// (Arabic medium): it prints the same two units, the same running order and
// the same printed page numbers, so this module mirrors that one in shape
// while taking its titles and its transcript from the French scans. Two
// lesson boundaries genuinely differ from the Arabic edition, and both are
// proven by the French pages themselves (see below): the Concept-2.1 «Leçon»
// bands number the Partager spread books 77–79 «Leçon 5» (the French contents
// extraction drops that line), and the Concept-2.2 «Leçon 4» opener sits on
// book 92 (the French contents says 92; the Arabic twin opens a page
// earlier).
//
// THE OFFSET IS ELEVEN — book page = scan page − 11
// Every content page that carries a folio prints its own number in Western
// digits in its footer («Unité 1 : Interactions des organismes | 1»,
// «Concept 1.1: Les besoins d'une plante | 7», bare «68», «110 |»),
// so `BOOK_TO_PDF_OFFSET` is fixed by the scans and quoted here: scan 12
// prints «… | 1» (book 1, the Unit-1 «Commencer» opener), scan 16 prints the
// «Leçon 1 / Activité 1» opener with its «Concept 1.1 … / 5» foot (book 5),
// scan 72 prints «… | 61» (book 61, the Unit-2 «Commencer» opener) and scan
// 128 prints «… / 117» (book 117, the term's last page). The book's own Table
// des matières (scans 9–10) independently confirms the Unit-1 lesson starts
// (5, 8, 12, 16, 20, 25, 28, 31, 34, 37, 41, 44, 46) and the Unit-2 starts
// (65, 67, 71, 74, 81, 84, 86, 92, 95, 98, 102, 107, 111); its Concept-2.1
// block drops the «Leçon 5 … 77» line in extraction (a blank line where the
// entry should be), but the bands on books 77, 78 and 79 each print
// «Leçon 5», so lesson 2-5 starts on book 77 exactly as in the Arabic twin.
// (The Concept-2.3 block prints its «Leçon 4 … 107» entry twice — a duplicated
// line in the table, not a second lesson.)
//
// TERM = THE NUMBERED BOOK PAGES (books 1–117)
// Scan pages 1–11 are before the term: the cover (1), the «Cinquième
// primaire» title leaf (2), the «Nom et Prénom» page (3), the copyright page
// (4, folio «iii»), a roman-folio leaf (5, «iv |»), the minister's address
// (6, folio «V»), the parent letter with the unit/concept overview (7, folio
// «vi»), the Science-team letter (8, folio «vii»), the printed «Table des
// matières» (9–10, folios «viii» and «ix») and the Unité-1 divider (11, no
// folio). Scan pages 129–130 are after the term: the print-specification page
// (129, Arabic) and the back cover (130). The term runs from the Unit-1
// «Commencer» opener (book 1 = scan 12) to the «Évaluer ton apprentissage»
// closing page (book 117 = scan 128):
// `EGYPT_SCIENCE_FR_G5_T1_BOOK_START` / `_BOOK_END` are exactly those two
// pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` is therefore 117 − 1 + 1 − 0 = 117 (no scan
// of the term is missing).
//
// ONE TERM PAGE PRINTS NO FOLIO — THE UNITÉ-2 DIVIDER
// Book 60 is the «Thème 2 | Matière et énergie / Unité 2 / Particules en
// mouvement» divider: it prints the ministry slug and no number by design.
// Rather than weaken the page-number check, it is anchored on the unit head
// the page itself prints («Particules en mouvement»), named in
// `FOLIO_LESS_ANCHORS`. Every other term page proves its own number from its
// footer, so `FOOTER_OCR_MISREADS` is empty and no folio the OCR could parse
// mismatches its page.
//
// THE FOLIO CHECK READS THE FOOTER PLUS THE LEADING HEAD
// Folios ride at the foot: «… | N», bare «N», «N |», or the running head with
// a trailing number («Concept 1.2 : Flux d'énergie dans les écosystèmes 25»,
// «Unité 1: Interactions des organismes 57»). `footerCandidates` therefore
// reads bare numerals from the first six and the last four lines and the
// leading head number from every line. The last-four window matters: book 110
// prints its «110 |» four lines up, above a table head («Changement /
// physique ou chimique / Évidence»). Band lesson numbers («Leçon 1» → «1»)
// join the candidate set harmlessly: the page's own number proves the mapping
// when present. One measured band quirk stays strict: book 68's band reads
// «Leçon 1» where books 67, 69 and 70 all read «Leçon 2» (an OCR misread of
// the band digit on a continuation page — the folio «68» is exact, and bands
// on non-opener pages are never asserted).
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every lesson contributes its «Leçon N» head (number, exactly as the opener
// prints it — the text layer splits it across two lines, «Leçon» / «N»,
// which `normalize` rejoins) plus one concept per printed activity:
// «Activité M» glued to the Comme-un-scientifique phrase on the very next
// line («Activité 4 Analyser comme un scientifique»), transcribed verbatim
// from the page it starts on. Nothing is invented: every concept title below
// is a string the book itself prints on the page its `bookFrom` names. The
// Discutons-ensemble prompts, Compétence-de-vie lines, Pratique material
// lists and figure captions carry no activity number of their own, so they
// contribute no concept of their own. The activity's topic line («Parties
// d'une plante», «Des modèles», …) is the lesson's title, not part of the
// activity head.
//
// TWO OPENER HEADS QUOTE THE VARIANT HEAD SEAM-TO-SEAM
// Books 84 and 92 (the Concept-2.2 «Leçon 2» and «Leçon 4» openers) print the
// head as «Leçon 2.2 Apprendre» with the lesson number on the next line,
// exactly as the Arabic twin's books 84 and 98 print «الدرس 2.2 …». Those two
// lesson-head concepts are quoted seam-to-seam («Leçon 2.2 Apprendre 2»,
// «Leçon 2.2 Apprendre 4»), which `normalize` rejoins — same approach as the
// twin.
//
// LESSON TITLES ARE THE OPENER'S OWN TOPIC HEAD
// Each lesson's `title` (and its `printedHead`) is the distinctive head its
// opener prints: the investigation topic («Parties d'une plante»,
// «Enquête pratique : Dispersion des graines», «Chaîne alimentaire»,
// «Usages de la matière», «Fusion de la matière», …). The six pure-intro
// openers (books 5, 25, 37, 65, 81, 95) print no topic of their own, so those
// lessons keep the head the opener does print («Peux-tu expliquer ?»).
//
// TEXT-LAYER QUIRKS RECORDED, NOT WORKED AROUND
// `normalize` drops case, spacing and punctuation, so the wrapped heads
// («Poser des questions comme un / scientifique», «La relation entre le
// degré de température et l'état / de la matière»,
// «Enquête pratique : Mélanger les matières et / calculer la masse.»)
// still match their single-line transcription. Stored byte-verbatim are the
// book's own spellings: «Enquête comme un scientifique» (no «-er», book 8
// only — every other enquête lesson prints «Enquêter»), «Enregistre des
// preuves comme un scientifique» (no «-r», book 46 only), the accent-less
// «Activite 4» (book 41), «Activite 7» (book 73) and «Activite 12»
// (book 23) heads, «Comment les faucons obtiennent-t-ils de l’énergie ?»
// (with «-t-» and U+2019 apostrophes, book 34), «États de l’eau» (U+2019,
// book 77), «Un toit pour tous type de climat» (no «s», book 82 — not a
// lesson title) and «Qu'est ce que la matière ? Les Changements d'états»
// (as printed, book 100 — not a lesson title).
//
// CONCEPT OPENERS RIDE WITH THE LESSONS THEY TOUCH
// Each unit's first lesson starts on the unit's own «Commencer» page
// (books 1 and 61 print no lesson head of their own), so `lessonBookRange`
// starts a unit's first lesson at the section head, exactly as the other
// Egyptian specs do. The mid-unit «CONCEPT» openers land where the tiling
// puts them: book 4 opens lesson 1-1's range, book 24 closes lesson 1-5,
// book 36 closes lesson 1-9, book 64 opens lesson 2-1's range, book 80
// closes lesson 2-5 and book 94 closes lesson 2-9. The Unit Projects, the
// Interdisciplinary Project («Ne pas gaspiller, c'est vouloir !», books
// 50–57) and the «Évaluer ton apprentissage» pages (books 58–59 and 116–117)
// close their unit's last lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 11 (verified: book p.117 = scan p.128). */
export const BOOK_TO_PDF_OFFSET = 11;

/** First printed page of the term — the Unit-1 «Commencer» opener (scan 12). */
export const EGYPT_SCIENCE_FR_G5_T1_BOOK_START = 1;

/** Last printed page of the term — the «Évaluer ton apprentissage» closing page (scan 128). */
export const EGYPT_SCIENCE_FR_G5_T1_BOOK_END = 117;

/** The scanned pages before the term: cover, title leaf, Nom page, copyright, roman leaf, minister address, parent letter, team letter, contents, Unité-1 divider. */
export const EGYPT_SCIENCE_FR_G5_T1_FRONT_MATTER = { from: 1, to: 11 } as const;

/** The scanned pages after the term: the print-specification page (129) and the back cover (130). */
export const EGYPT_SCIENCE_FR_G5_T1_BACK_MATTER = { from: 129, to: 130 } as const;

/**
 * The term pages the OCR never produced, in book pages. All 130 scans are
 * present and every term scan carries a text layer, so there are none; the
 * constant is kept so this module shares the shape of the other Egyptian
 * specs (and so the checker's expected page count subtracts it).
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of the textbook — becomes one concept in the app tree. */
export interface ScienceFrG5T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The head's own printed label: "Leçon" or "Activité". */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson of the book — becomes one lesson in the app tree. */
export interface ScienceFrG5T1Lesson {
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
   * `assertTreeMatchesTheBook`): the topic head — or, for the six pure-intro
   * openers, the «Peux-tu expliquer ?» head the opener does print.
   */
  printedHead: string;
  /** First printed book page of the lesson itself (its contents page). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: ScienceFrG5T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed unit of the term. */
export interface ScienceFrG5T1Unit {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"2", in book order. */
  key: string;
  /** Arabic ordinal of the unit as used in the app tree, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "Unité 1 : Interactions des organismes". */
  title: string;
  /** The unit head its opener prints, verbatim. */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next opener). */
  bookTo: number;
  lessons: ScienceFrG5T1Lesson[];
}

const LECON = "Leçon";
const ACTIVITE = "Activité";

function concept(bookFrom: number, kind: string, title: string): ScienceFrG5T1Concept {
  return { bookFrom, kind, title };
}

function lessonHead(bookFrom: number, title: string): ScienceFrG5T1Concept {
  return concept(bookFrom, LECON, title);
}

function activity(bookFrom: number, title: string): ScienceFrG5T1Concept {
  return concept(bookFrom, ACTIVITE, title);
}

/**
 * The two units of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit ranges come from the pages' own openers: 1–60 (the Unit-2 divider on
 * book 60 closes Unit 1) and 61–117. Lesson starts come from the «Leçon»
 * openers and match the book's Table des matières exactly (5, 8, 12, 16, 20,
 * 25, 28, 31, 34, 37, 41, 44, 46, 65, 67, 71, 74, 81, 84, 86, 92, 95, 98,
 * 102, 107, 111) plus the «Leçon 5» bands on books 77–79, whose contents
 * entry the extraction drops.
 */
export const EGYPT_SCIENCE_FR_G5_T1_UNITS: ScienceFrG5T1Unit[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "Unité 1 : Interactions des organismes",
    printedHead: "Unité 1 : Interactions des organismes",
    bookFrom: 1,
    bookTo: 60,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: LECON,
        title: "Peux-tu expliquer ?",
        printedHead: "Peux-tu expliquer ?",
        bookFrom: 5,
        concepts: [
          lessonHead(5, "Leçon 1"),
          activity(5, "Activité 1 Peux-tu expliquer ?"),
          activity(6, "Activité 2 Poser des questions comme un scientifique"),
          activity(7, "Activité 3 Évaluer comme un scientifique"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: LECON,
        title: "Enquête pratique : Les plantes ont-elles besoin de sol ?",
        printedHead: "Enquête pratique : Les plantes ont-elles besoin de sol ?",
        bookFrom: 8,
        concepts: [
          lessonHead(8, "Leçon 2"),
          activity(8, "Activité 4 Enquête comme un scientifique"),
          activity(10, "Activité 5 Enquêter comme un scientifique"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: LECON,
        title: "Parties d'une plante",
        printedHead: "Parties d'une plante",
        bookFrom: 12,
        concepts: [
          lessonHead(12, "Leçon 3"),
          activity(12, "Activité 6 Analyser comme un scientifique"),
          activity(14, "Activité 7 Enquêter comme un scientifique"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: LECON,
        title: "Comparer les systèmes végétaux et humains",
        printedHead: "Comparer les systèmes végétaux et humains",
        bookFrom: 16,
        concepts: [
          lessonHead(16, "Leçon 4"),
          activity(16, "Activité 8 Analyser comme un scientifique"),
          activity(18, "Activité 9 Analyser comme un scientifique"),
          activity(19, "Activité 10 Observer comme un scientifique"),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: LECON,
        title: "Enquête pratique : Dispersion des graines",
        printedHead: "Enquête pratique : Dispersion des graines",
        bookFrom: 20,
        concepts: [
          lessonHead(20, "Leçon 5"),
          activity(20, "Activité 11 Enquêter comme un scientifique"),
          activity(23, "Activite 12 Enregistrer des preuves comme un scientifique"),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: LECON,
        title: "Peux-tu expliquer ?",
        printedHead: "Peux-tu expliquer ?",
        bookFrom: 25,
        concepts: [
          lessonHead(25, "Leçon 1"),
          activity(25, "Activité 1 Peux-tu expliquer ?"),
          activity(26, "Activité 2 Poser des questions comme un scientifique"),
          activity(27, "Activité 3 Évaluer comme un scientifique"),
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        type: LECON,
        title: "La nourriture c'est de l'énergie",
        printedHead: "La nourriture c'est de l'énergie",
        bookFrom: 28,
        concepts: [
          lessonHead(28, "Leçon 2"),
          activity(28, "Activité 4 Analyser comme un scientifique"),
          activity(29, "Activité 5 Observer comme un scientifique"),
          activity(30, "Activité 6 Analyser comme un scientifique"),
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        type: LECON,
        title: "Chaîne alimentaire",
        printedHead: "Chaîne alimentaire",
        bookFrom: 31,
        concepts: [
          lessonHead(31, "Leçon 3"),
          activity(31, "Activité 7 Évaluer comme un scientifique"),
          activity(32, "Activité 8 Analyser comme un scientifique"),
          activity(33, "Activité 9 Évaluer comme un scientifique"),
        ],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        type: LECON,
        title: "Comment les faucons obtiennent-t-ils de l’énergie ?",
        printedHead: "Comment les faucons obtiennent-t-ils de l’énergie ?",
        bookFrom: 34,
        concepts: [
          lessonHead(34, "Leçon 4"),
          activity(34, "Activité 10 Enregistrer des preuves comme un scientifique"),
          activity(35, "Activité 11 Analyser comme un scientifique"),
        ],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        type: LECON,
        title: "Peux-tu expliquer ?",
        printedHead: "Peux-tu expliquer ?",
        bookFrom: 37,
        concepts: [
          lessonHead(37, "Leçon 1"),
          activity(37, "Activité 1 Peux-tu expliquer ?"),
          activity(38, "Activité 2 Poser des questions comme un scientifique"),
          activity(39, "Activité 3 Évaluer comme un scientifique"),
        ],
      },
      {
        key: "1-11",
        ordinal: "الحادي عشر",
        type: LECON,
        title: "Enquête pratique : Modèle de flux d'énergie",
        printedHead: "Enquête pratique : Modèle de flux d'énergie",
        bookFrom: 41,
        concepts: [
          lessonHead(41, "Leçon 2"),
          activity(41, "Activite 4 Enquêter comme un scientifique"),
          activity(42, "Activité 5 Observer comme un scientifique"),
          activity(43, "Activité 6 Observer comme un scientifique"),
        ],
      },
      {
        key: "1-12",
        ordinal: "الثاني عشر",
        type: LECON,
        title: "La perte d'habitat",
        printedHead: "La perte d'habitat",
        bookFrom: 44,
        concepts: [
          lessonHead(44, "Leçon 3"),
          activity(44, "Activité 7 Analyser comme un scientifique"),
          activity(45, "Activité 8 Analyser comme un scientifique"),
        ],
      },
      {
        key: "1-13",
        ordinal: "الثالث عشر",
        type: LECON,
        title: "Protéger les écosystèmes",
        printedHead: "Protéger les écosystèmes",
        bookFrom: 46,
        concepts: [
          lessonHead(46, "Leçon 4"),
          activity(46, "Activité 9 Enregistre des preuves comme un scientifique"),
          activity(48, "Activité 10 Analyser comme un scientifique"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "Unité 2 : Particules en mouvement",
    printedHead: "Unité 2 : Particules en mouvement",
    bookFrom: 61,
    bookTo: 117,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: LECON,
        title: "Peux-tu expliquer ?",
        printedHead: "Peux-tu expliquer ?",
        bookFrom: 65,
        concepts: [
          lessonHead(65, "Leçon 1"),
          activity(65, "Activité 1 Peux-tu expliquer ?"),
          activity(66, "Activité 2 Poser des questions comme un scientifique"),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: LECON,
        title: "Enquête pratique : Observer la matière",
        printedHead: "Enquête pratique : Observer la matière",
        bookFrom: 67,
        concepts: [
          lessonHead(67, "Leçon 2"),
          activity(67, "Activité 3 Enquêter comme un scientifique"),
          activity(69, "Activité 4 Analyser comme un scientifique"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: LECON,
        title: "Les particules de la matière",
        printedHead: "Les particules de la matière",
        bookFrom: 71,
        concepts: [
          lessonHead(71, "Leçon 3"),
          activity(71, "Activité 5 Analyser comme un scientifique"),
          activity(72, "Activité 6 Évaluer comme un scientifique"),
          activity(73, "Activite 7 Analyser comme un scientifique"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: LECON,
        title: "Des modèles",
        printedHead: "Des modèles",
        bookFrom: 74,
        concepts: [
          lessonHead(74, "Leçon 4"),
          activity(74, "Activité 8 Observer comme un scientifique"),
          activity(75, "Activité 9 Observer comme un scientifique"),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: LECON,
        title: "États de l’eau",
        printedHead: "États de l’eau",
        bookFrom: 77,
        concepts: [
          lessonHead(77, "Leçon 5"),
          activity(77, "Activité 10 Enregistrer des preuves comme un scientifique"),
          activity(78, "Activité 11 Analyser comme un scientifique"),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: LECON,
        title: "Peux-tu expliquer ?",
        printedHead: "Peux-tu expliquer ?",
        bookFrom: 81,
        concepts: [
          lessonHead(81, "Leçon 1"),
          activity(81, "Activité 1 Peux-tu expliquer ?"),
          activity(82, "Activité 2 Poser des questions comme un scientifique"),
          activity(83, "Activité 3 Évaluer comme un scientifique"),
        ],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        type: LECON,
        title: "Enquête pratique : Le mystère de la cuisine",
        printedHead: "Enquête pratique : Le mystère de la cuisine",
        bookFrom: 84,
        concepts: [
          lessonHead(84, "Leçon 2.2 Apprendre 2"),
          activity(84, "Activité 4 Enquêter comme un scientifique"),
        ],
      },
      {
        key: "2-8",
        ordinal: "الثامن",
        type: LECON,
        title: "Propriétés de la matière",
        printedHead: "Propriétés de la matière",
        bookFrom: 86,
        concepts: [
          lessonHead(86, "Leçon 3"),
          activity(86, "Activité 5 Analyser comme un scientifique"),
          activity(88, "Activité 6 Enquêter comme un scientifique"),
          activity(90, "Activité 7 Évaluer comme un scientifique"),
          activity(91, "Activité 8 Analyser comme un scientifique"),
        ],
      },
      {
        key: "2-9",
        ordinal: "التاسع",
        type: LECON,
        title: "Usages de la matière",
        printedHead: "Usages de la matière",
        bookFrom: 92,
        concepts: [
          lessonHead(92, "Leçon 2.2 Apprendre 4"),
          activity(92, "Activité 9 Évaluer comme un scientifique"),
          activity(93, "Activité 10 Enregistrer des preuves comme un scientifique"),
        ],
      },
      {
        key: "2-10",
        ordinal: "العاشر",
        type: LECON,
        title: "Peux-tu expliquer ?",
        printedHead: "Peux-tu expliquer ?",
        bookFrom: 95,
        concepts: [
          lessonHead(95, "Leçon 1"),
          activity(95, "Activité 1 Peux-tu expliquer ?"),
          activity(96, "Activité 2 Poser des questions comme un scientifique"),
          activity(97, "Activité 3 Analyser comme un scientifique"),
        ],
      },
      {
        key: "2-11",
        ordinal: "الحادي عشر",
        type: LECON,
        title: "La relation entre le degré de température et l'état de la matière",
        printedHead: "La relation entre le degré de température et l'état de la matière",
        bookFrom: 98,
        concepts: [
          lessonHead(98, "Leçon 2"),
          activity(98, "Activité 4 Analyser comme un scientifique"),
          activity(100, "Activité 5 Observer comme un scientifique"),
        ],
      },
      {
        key: "2-12",
        ordinal: "الثاني عشر",
        type: LECON,
        title: "Mélanges",
        printedHead: "Mélanges",
        bookFrom: 102,
        concepts: [
          lessonHead(102, "Leçon 3"),
          activity(102, "Activité 6 Analyser comme un scientifique"),
          activity(104, "Activité 7 Enquêter comme un scientifique"),
        ],
      },
      {
        key: "2-13",
        ordinal: "الثالث عشر",
        type: LECON,
        title: "Changements physiques dans nos vies",
        printedHead: "Changements physiques dans nos vies",
        bookFrom: 107,
        concepts: [
          lessonHead(107, "Leçon 4"),
          activity(107, "Activité 8 Observer comme un scientifique"),
          activity(109, "Activité 9 Analyser comme un scientifique"),
          activity(110, "Activité 10 Évaluer comme un scientifique"),
        ],
      },
      {
        key: "2-14",
        ordinal: "الرابع عشر",
        type: LECON,
        title: "Fusion de la matière",
        printedHead: "Fusion de la matière",
        bookFrom: 111,
        concepts: [
          lessonHead(111, "Leçon 5"),
          activity(111, "Activité 11 Enregistrer des preuves comme un scientifique"),
          activity(112, "Activité 12 Analyser comme un scientifique"),
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
  const section = EGYPT_SCIENCE_FR_G5_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SCIENCE_FR_G5_T1_UNITS.forEach((section, si) => {
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
  for (const section of EGYPT_SCIENCE_FR_G5_T1_UNITS) {
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
  "science-fr-g5-t1",
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
  const lesson = EGYPT_SCIENCE_FR_G5_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
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
 * Page-number candidates a content page prints. The folio rides in the footer
 * at the foot of the page: a bare numeral («68», «110 |», «50 |», «| 23») or
 * the running head with a trailing number («Concept 1.2 : Flux d'énergie dans
 * les écosystèmes 25», «Unité 1: Interactions des organismes 57»). The first
 * six and the last four lines therefore contribute every whitespace-separated
 * digit token, and every line contributes a leading head number. Band lesson
 * numbers («Leçon 2» → «2») join the candidate set harmlessly: the page's own
 * number proves the mapping when present. Book 110 prints its «110 |» four
 * lines up, above a table head — which is why the window keeps four trailing
 * lines instead of two. (The «N.N …» section markers such as «2.1 Se
 * demander» never match the head pattern, which requires whitespace after the
 * number.)
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
 * mismatch). The Unité-2 divider (book 60) prints no folio at all, so that
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
 * accepts in place of a page number: the «Thème 2 | Matière et énergie /
 * Unité 2 / Particules en mouvement» divider (book 60), which carries no
 * number by design. The anchor is the unit head the page itself prints.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  60: "Particules en mouvement",
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
  const sections = EGYPT_SCIENCE_FR_G5_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_SCIENCE_FR_G5_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_SCIENCE_FR_G5_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SCIENCE_FR_G5_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_SCIENCE_FR_G5_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     the folio in its footer, or, on the page named in
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
  const sections = EGYPT_SCIENCE_FR_G5_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SCIENCE_FR_G5_T1_BOOK_START || book > EGYPT_SCIENCE_FR_G5_T1_BOOK_END) continue;
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
  for (let p = EGYPT_SCIENCE_FR_G5_T1_BOOK_START; p <= EGYPT_SCIENCE_FR_G5_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_SCIENCE_FR_G5_T1_BOOK_END - EGYPT_SCIENCE_FR_G5_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_SCIENCE_FR_G5_T1_BOOK_START} و${EGYPT_SCIENCE_FR_G5_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
