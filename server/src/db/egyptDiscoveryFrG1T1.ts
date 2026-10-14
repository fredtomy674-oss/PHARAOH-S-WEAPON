// Grade 1 (الصف الأول الابتدائي) Discover, French-medium, first term
// («1er semestre»), Ministry 2025/2026 edition (cover prints «PARTONS À LA
// DÉCOUVERTE / 1ÈRE PRIMAIRE / 2025 - 2026»).
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g1-discovery-fr`, subject `discovery-fr` (name "Discovery (French)",
// nameAr "اكتشف (بالفرنسية)"), lesson prefix `l-g1-dis-fr-`, grade
// `grade-1` (name "Grade 1", nameAr "الصف الأول الابتدائي").
//
// The curriculum tree for the Egypt `eg-g1-discovery-fr` curriculum is rebuilt
// from the French-medium Ministry textbook `Partons à la Découverte`
// (88 scanned pages, Term 1 = the book's own «1er semestre» as listed in its
// printed «SOMMAIRE», scan 4). This module is the single source of truth for
// its structure: the seven printed chapitres of the first term (three under
// Thème 1 «Qui suis-je ?», four under Thème 2 «Le monde autour de moi»), the
// «Le Journal des Mathématiques» section that closes the semester, and, for
// every lesson, the book's own printed activity heads, verbatim and with the
// printed page they start on. The self-checks at the bottom prove that mapping
// against the text layer itself, page by page.
//
// THE OFFSET IS FOUR — book page = scan page − 4
// Every numbered content page prints its own folio as a bare numeral on its
// last line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted
// here: scan 6 prints «2» (book 2), scan 8 prints «4» (book 4), scan 16 prints
// «12» (book 12), scan 26 prints «22» (book 22), scan 30 prints «26»
// (book 26), scan 40 prints «36» (book 36) and scan 49 prints «45»
// (book 45). The book's own «SOMMAIRE» (scan 4) independently confirms it: it
// lists «Chapitre 1 : Tout sur moi 1» (scan 5), «Chapitre 2 : L’arbre
// généalogique 13» (scan 17), «Chapitre 3 : Notre vie en société 17»
// (scan 21), «Chapitre 1 : Notre environnement 21» (scan 25), «Chapitre 2 : Se
// déplacer dans notre environnement 25» (scan 29), «Chapitre 3 : Notre
// Nourriture 31» (scan 35), «Chapitre 4 : Fêtes et traditions 35» (scan 39)
// and «Le Journal des Mathématiques 41» (scan 45) — every divider sits exactly
// where the contents says it does, and the Term-2 entries («47» on scan 51,
// «55» on scan 59, «61» on scan 65, «65» on scan 69, «69» on scan 73,
// journal «75» on scan 79) keep the same offset after the term.
//
// TERM = THE BOOK'S OWN FIRST SEMESTER (books 1–45)
// Scan pages 1–4 are before the term: the cover (1), an empty scan (2), the
// «PARTONS À LA DÉCOUVERTE» introduction (3) and the year-wide «SOMMAIRE»
// with the NAME slip (4). The term runs from the Thème-1 divider (book 1 =
// scan 5) to the last page of «Le Journal des Mathématiques» (book 45 =
// scan 49): `EGYPT_DISCOVERY_FR_G1_T1_BOOK_START` / `_END` are exactly those
// two pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` therefore equals 45 − 1 + 1 = 45. Scan pages
// 50–88 are after the term: an empty scan (50), the Term-2 divider
// (scan 51), the Term-2 lessons (Thèmes 3–4, books 47–74), the Term-2 journal
// (books 75–83) and the print matter (scan 88).
//
// EIGHT TERM PAGES PRINT NO FOLIO — EACH HAS A NAMED ANCHOR
// The seven chapitre dividers (books 1, 13, 17, 21, 25, 31, 35) and the
// journal divider (book 41) print their head but no page number. Rather than
// weaken the page-number check, all eight are exempt from it and anchored on
// a string the page itself prints, named in `FOLIO_LESS_ANCHORS`. Every other
// term page proves its number from the folio in its furniture (see
// `footerCandidates`).
//
// EVERY TERM PAGE CARRIES REAL TEXT
// Book 3 (scan 7) is an illustration-only page whose text layer holds just its
// folio «3» — still non-empty text plus a provable folio, so no exemption is
// needed and `MISSING_SCANS` stays empty. All other term pages carry full
// born-digital French text.
//
// EACH NUMBERED «LEÇON» IS ONE LESSON — CONCEPTS ARE ITS PRINTED HEADS
// Unlike the KG book (whose Discovery chapters print no numbered leçons),
// this book numbers its activities: each chapitre prints «Leçon 1» …
// («Leçon 1»–«Leçon 5» in chapitre 1, «Leçon 1»–«Leçon 3» in chapitre 2, …).
// Each such Leçon page is one lesson and its title is the activity head the
// page prints («MON PORTRAIT», «NOS CINQ SENS», «SE PRÉSENTER», …). Pages
// that print two titled heads share one lesson: book 8 («MON PORTRAIT» +
// «MA FAMILLE DANS UN PARC»), book 16 («LE CYCLE DE VIE D’UNE PLANTE» +
// «LE CYCLE DE VIE DE L’ÊTRE HUMAIN»), book 18 («NOS DROITS» +
// «LES RÈGLES») and book 30 («LES TRANSPORTS EN ÉGYPTE» + «EST-CE QUE C’EST
// UNE CAUSE DE POLLUTION?»); book 11 prints three («SIMILARITÉS ET
// DIFFÉRENCES», «LE BUSTE DE NEFERTITI», «DR. MAGDI YACOUB»). Inline exercise
// matter (trace-words, table headers, word lists, story labels such as the
// feast names on book 36) is not modelled: only standalone activity heads
// become concepts. The chapitre dividers print navigation only (thème +
// chapitre), so — as in the KG specs — they contribute no concepts; the
// divider head is checked as the section's `printedHead`. The intro pages
// (books 2–7, Pharaonic identity and hiéroglyphes) sit between the chapitre-1
// divider and «Leçon 1» and print no «Leçon» number, so they form their own
// lesson («JE SUIS ÉGYPTIEN», ordinal "") owning books 1–7, with the divider
// staying inside its range exactly as the KG specs keep each divider inside
// its first lesson. The journal section is one lesson owning books 41–45;
// its concepts are the divider head plus each journal page's opening «Leçon»
// («Leçon 1», «Leçon 2», «Leçon 6», «Leçon 2»), since a journal page prints a
// dozen «Leçon N» blocks and naming each would model mathematics, not heads.
// Nothing is invented: every concept title below is a string the book itself
// prints on the page its `bookFrom` names.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// The born-digital French layer prints the U+2019 apostrophe in heads
// («L’ARBRE», «D’UNE», «C’EST», «L’ANNÉE», «L’ÉGYPTE») with a few straight
// ASCII apostrophes in body text («l'un»); `normalize` deletes every
// non-letter/non-digit, so both forms match regardless and heads are
// transcribed byte-verbatim. Doubled folios («19 19» on book 19, «42 42» on
// book 42, «43 43» on book 43) and the stray running «2» on the first line of
// every «Leçon» page join the folio candidates harmlessly: the page's own
// number proves the mapping when present (see `footerCandidates`).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.45 = scan p.49). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the Thème-1 / Chapitre-1 divider (scan 5). */
export const EGYPT_DISCOVERY_FR_G1_T1_BOOK_START = 1;

/** Last printed page of the term — journal page «Leçon 9» (scan 49). */
export const EGYPT_DISCOVERY_FR_G1_T1_BOOK_END = 45;

/** The scanned pages before the term: cover, empty scan, introduction, sommaire. */
export const EGYPT_DISCOVERY_FR_G1_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/**
 * The scanned pages after the term: an empty scan (50), the Term-2 divider
 * (51), the Term-2 lessons (books 47–74), the Term-2 journal (books 75–83)
 * and the print matter (scan 88).
 */
export const EGYPT_DISCOVERY_FR_G1_T1_BACK_MATTER = { from: 50, to: 88 } as const;

/**
 * The term pages the OCR never produced, in book pages. Every one of the 45
 * term scans carries a text layer (book 3 holds just its folio «3»), so the
 * list is empty; kept so the loader, the checks and the seeders share one
 * shape across the books.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed activity head of a lesson — becomes one concept in the app tree. */
export interface DiscoveryFrG1T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «leçon». */
  kind: string;
  /** The printed head of this activity, verbatim. */
  title: string;
}

/** One printed lesson (one numbered «Leçon», the intro, or the journal). */
export interface DiscoveryFrG1T1Lesson {
  /** App-addressable key, e.g. "5-3" (chapter 5, lesson 3). */
  key: string;
  /** Arabic ordinal of the lesson number; "" where the book numbers nothing. */
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
  concepts: DiscoveryFrG1T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix
   * in the scans, so no lesson below uses it; the field is kept so this module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — a chapitre, or the maths journal. */
export interface DiscoveryFrG1T1Section {
  /** This book's sections are its chapitres, plus the closing journal. */
  kind: "chapter" | "journal";
  /** Internal key: "1"…"8", in book order. */
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
  lessons: DiscoveryFrG1T1Lesson[];
}

const TYPE = "leçon";

function concept(bookFrom: number, title: string): DiscoveryFrG1T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The seven chapitres of the first term plus its closing «Journal des
 * Mathématiques», with their printed leçons and every printed head,
 * transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Chapter starts come from the book's «SOMMAIRE» (scan 4): 1, 13, 17, 21, 25,
 * 31, 35, journal 41. Each numbered «Leçon» page is one lesson, in book order;
 * the unnumbered intro (books 2–7) is the first lesson of chapitre 1.
 */
export const EGYPT_DISCOVERY_FR_G1_T1_UNITS: DiscoveryFrG1T1Section[] = [
  {
    key: "1",
    kind: "chapter",
    ordinal: "الأول",
    title: "Thème 1 : Qui suis-je ? — Chapitre 1 : Tout sur moi",
    printedHead: "CHAPITRE 1 : TOUT SUR MOI",
    bookFrom: 1,
    bookTo: 12,
    lessons: [
      {
        key: "1-1",
        ordinal: "",
        type: TYPE,
        title: "JE SUIS ÉGYPTIEN",
        printedHead: "JE SUIS ÉGYPTIEN",
        bookFrom: 2,
        concepts: [
          concept(2, "JE SUIS ÉGYPTIEN"),
          concept(4, "L’écriture hiéroglyphique"),
          concept(6, "L’écriture hiéroglyphique"),
          concept(7, "Déterminatif"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الأول",
        type: TYPE,
        title: "MON PORTRAIT",
        printedHead: "MON PORTRAIT",
        bookFrom: 8,
        concepts: [concept(8, "MON PORTRAIT"), concept(8, "MA FAMILLE DANS UN PARC")],
      },
      {
        key: "1-3",
        ordinal: "الثاني",
        type: TYPE,
        title: "LA FAMILLE",
        printedHead: "LA FAMILLE",
        bookFrom: 9,
        concepts: [concept(9, "LA FAMILLE")],
      },
      {
        key: "1-4",
        ordinal: "الثالث",
        type: TYPE,
        title: "NOS CINQ SENS",
        printedHead: "NOS CINQ SENS",
        bookFrom: 10,
        concepts: [concept(10, "NOS CINQ SENS")],
      },
      {
        key: "1-5",
        ordinal: "الرابع",
        type: TYPE,
        title: "SIMILARITÉS ET DIFFÉRENCES",
        printedHead: "SIMILARITÉS ET DIFFÉRENCES",
        bookFrom: 11,
        concepts: [
          concept(11, "SIMILARITÉS ET DIFFÉRENCES"),
          concept(11, "LE BUSTE DE NEFERTITI"),
          concept(11, "DR. MAGDI YACOUB"),
        ],
      },
      {
        key: "1-6",
        ordinal: "الخامس",
        type: TYPE,
        title: "SE PRÉSENTER",
        printedHead: "SE PRÉSENTER",
        bookFrom: 12,
        concepts: [concept(12, "SE PRÉSENTER")],
      },
    ],
  },
  {
    key: "2",
    kind: "chapter",
    ordinal: "الثاني",
    title: "Thème 1 : Qui suis-je ? — Chapitre 2 : L’arbre généalogique",
    printedHead: "CHAPITRE 2 : L’ARBRE GÉNÉALOGIQUE",
    bookFrom: 13,
    bookTo: 16,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "MA ROUTINE QUOTIDIENNE EN ORDRE",
        printedHead: "MA ROUTINE QUOTIDIENNE EN ORDRE",
        bookFrom: 14,
        concepts: [concept(14, "MA ROUTINE QUOTIDIENNE EN ORDRE")],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "LES ADULTES ET LEURS PETITS",
        printedHead: "LES ADULTES ET LEURS PETITS",
        bookFrom: 15,
        concepts: [concept(15, "LES ADULTES ET LEURS PETITS")],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "LE CYCLE DE VIE D’UNE PLANTE",
        printedHead: "LE CYCLE DE VIE D’UNE PLANTE",
        bookFrom: 16,
        concepts: [
          concept(16, "LE CYCLE DE VIE D’UNE PLANTE"),
          concept(16, "LE CYCLE DE VIE DE L’ÊTRE HUMAIN"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "chapter",
    ordinal: "الثالث",
    title: "Thème 1 : Qui suis-je ? — Chapitre 3 : Notre vie en société",
    printedHead: "CHAPITRE 3: NOTRE VIE EN SOCIÉTÉ",
    bookFrom: 17,
    bookTo: 20,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "NOS DROITS",
        printedHead: "NOS DROITS",
        bookFrom: 18,
        concepts: [concept(18, "NOS DROITS"), concept(18, "LES RÈGLES")],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "LES PERSONNES QUI APPORTENT LEUR AIDE DANS LA SOCIÉTÉ",
        printedHead: "LES PERSONNES QUI APPORTENT LEUR AIDE DANS LA SOCIÉTÉ",
        bookFrom: 19,
        concepts: [concept(19, "LES PERSONNES QUI APPORTENT LEUR AIDE DANS LA SOCIÉTÉ")],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "LES OUTILS PROFESSIONNELS",
        printedHead: "LES OUTILS PROFESSIONNELS",
        bookFrom: 20,
        concepts: [concept(20, "LES OUTILS PROFESSIONNELS")],
      },
    ],
  },
  {
    key: "4",
    kind: "chapter",
    ordinal: "الرابع",
    title: "Thème 2 : Le monde autour de moi — Chapitre 1 : Notre environnement",
    printedHead: "CHAPITRE 1 : NOTRE ENVIRONNEMENT",
    bookFrom: 21,
    bookTo: 24,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        type: TYPE,
        title: "EST-CE QUE C’EST VIVANT?",
        printedHead: "EST-CE QUE C’EST VIVANT?",
        bookFrom: 22,
        concepts: [concept(22, "EST-CE QUE C’EST VIVANT?")],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "LE DÉSERT ET LE DELTA",
        printedHead: "LE DÉSERT ET LE DELTA",
        bookFrom: 23,
        concepts: [concept(23, "LE DÉSERT ET LE DELTA")],
      },
      {
        key: "4-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "PRENDRE SOIN DE L’ENVIRONNEMENT",
        printedHead: "PRENDRE SOIN DE L’ENVIRONNEMENT",
        bookFrom: 24,
        concepts: [concept(24, "PRENDRE SOIN DE L’ENVIRONNEMENT")],
      },
    ],
  },
  {
    key: "5",
    kind: "chapter",
    ordinal: "الخامس",
    title: "Thème 2 : Le monde autour de moi — Chapitre 2 : Se déplacer dans notre environnement",
    printedHead: "CHAPITRE 2 : SE DÉPLACER DANS NOTRE ENVIRONNEMENT",
    bookFrom: 25,
    bookTo: 30,
    lessons: [
      {
        key: "5-1",
        ordinal: "الأول",
        type: TYPE,
        title: "LA DESCRIPTION D’UNE PLANTE",
        printedHead: "LA DESCRIPTION D’UNE PLANTE",
        bookFrom: 26,
        concepts: [concept(26, "LA DESCRIPTION D’UNE PLANTE")],
      },
      {
        key: "5-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "LA DESCRIPTION DES ANIMAUX",
        printedHead: "LA DESCRIPTION DES ANIMAUX",
        bookFrom: 27,
        concepts: [concept(27, "LA DESCRIPTION DES ANIMAUX")],
      },
      {
        key: "5-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "COMMENT SE DÉPLACENT LES ANIMAUX ?",
        printedHead: "COMMENT SE DÉPLACENT LES ANIMAUX ?",
        bookFrom: 28,
        concepts: [concept(28, "COMMENT SE DÉPLACENT LES ANIMAUX ?")],
      },
      {
        key: "5-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "COMMENT TROUVER DES OBJETS QUI BOUGENT ?",
        printedHead: "COMMENT TROUVER DES OBJETS QUI BOUGENT ?",
        bookFrom: 29,
        concepts: [concept(29, "COMMENT TROUVER DES OBJETS QUI BOUGENT ?")],
      },
      {
        key: "5-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "LES TRANSPORTS EN ÉGYPTE",
        printedHead: "LES TRANSPORTS EN ÉGYPTE",
        bookFrom: 30,
        concepts: [
          concept(30, "LES TRANSPORTS EN ÉGYPTE"),
          concept(30, "EST-CE QUE C’EST UNE CAUSE DE POLLUTION?"),
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "chapter",
    ordinal: "السادس",
    title: "Thème 2 : Le monde autour de moi — Chapitre 3 : Notre nourriture",
    printedHead: "CHAPITRE 3 : NOTRE NOURRITURE",
    bookFrom: 31,
    bookTo: 34,
    lessons: [
      {
        key: "6-1",
        ordinal: "الأول",
        type: TYPE,
        title: "LE SOLEIL AU CIEL",
        printedHead: "LE SOLEIL AU CIEL",
        bookFrom: 32,
        concepts: [concept(32, "LE SOLEIL AU CIEL")],
      },
      {
        key: "6-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "LES SAISONS DE L’ANNÉE",
        printedHead: "LES SAISONS DE L’ANNÉE",
        bookFrom: 33,
        concepts: [concept(33, "LES SAISONS DE L’ANNÉE")],
      },
      {
        key: "6-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "LE CHOIX DES ALIMENTS QUI SONT BONS POUR LA SANTÉ",
        printedHead: "LE CHOIX DES ALIMENTS QUI SONT BONS POUR LA SANTÉ",
        bookFrom: 34,
        concepts: [concept(34, "LE CHOIX DES ALIMENTS QUI SONT BONS POUR LA SANTÉ")],
      },
    ],
  },
  {
    key: "7",
    kind: "chapter",
    ordinal: "السابع",
    title: "Thème 2 : Le monde autour de moi — Chapitre 4 : Fêtes et traditions",
    printedHead: "CHAPITRE 4 : FÊTES ET TRADITIONS",
    bookFrom: 35,
    bookTo: 40,
    lessons: [
      {
        key: "7-1",
        ordinal: "الأول",
        type: TYPE,
        title: "LES FÊTES ÉGYPTIENNES",
        printedHead: "LES FÊTES ÉGYPTIENNES",
        bookFrom: 36,
        concepts: [concept(36, "LES FÊTES ÉGYPTIENNES")],
      },
      {
        key: "7-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "LES TRADITIONS ÉGYPTIENNES",
        printedHead: "LES TRADITIONS ÉGYPTIENNES",
        bookFrom: 37,
        concepts: [concept(37, "LES TRADITIONS ÉGYPTIENNES")],
      },
      {
        key: "7-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "LES MONUMENTS ÉGYPTIENS",
        printedHead: "LES MONUMENTS ÉGYPTIENS",
        bookFrom: 38,
        concepts: [concept(38, "LES MONUMENTS ÉGYPTIENS")],
      },
      {
        key: "7-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "VOYAGER À TRAVERS L’ÉGYPTE ET SES MONUMENTS",
        printedHead: "VOYAGER À TRAVERS L’ÉGYPTE ET SES MONUMENTS",
        bookFrom: 39,
        concepts: [concept(39, "VOYAGER À TRAVERS L’ÉGYPTE ET SES MONUMENTS")],
      },
      {
        key: "7-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "LE RESPECT DES MONUMENTS ÉGYPTIENS",
        printedHead: "LE RESPECT DES MONUMENTS ÉGYPTIENS",
        bookFrom: 40,
        concepts: [concept(40, "LE RESPECT DES MONUMENTS ÉGYPTIENS")],
      },
    ],
  },
  {
    key: "8",
    kind: "journal",
    ordinal: "الثامن",
    title: "Le Journal des Mathématiques",
    printedHead: "LE JOURNAL DES MATHÉMATIQUES",
    bookFrom: 41,
    bookTo: 45,
    lessons: [
      {
        key: "8-1",
        ordinal: "الأول",
        type: TYPE,
        title: "LE JOURNAL DES MATHÉMATIQUES",
        printedHead: "LE JOURNAL DES MATHÉMATIQUES",
        bookFrom: 41,
        concepts: [
          concept(41, "LE JOURNAL DES MATHÉMATIQUES"),
          concept(42, "Leçon 1"),
          concept(43, "Leçon 2"),
          concept(44, "Leçon 6"),
          concept(45, "Leçon 2"),
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
 * lesson — the divider opener) or its own start page, up to the page before
 * the next lesson starts, or the section's last page for its last lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_DISCOVERY_FR_G1_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_DISCOVERY_FR_G1_T1_UNITS.forEach((section, si) => {
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
  for (const section of EGYPT_DISCOVERY_FR_G1_T1_UNITS) {
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
  "discovery-fr-g1-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (No term page of this book needs it — every term scan carries a
 * text layer — but the guard keeps the loader the same shape across books.)
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
  const lesson = EGYPT_DISCOVERY_FR_G1_T1_UNITS[sectionIndex]!.lessons[lessonIndex]!;
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
 * Page-number candidates a content page prints. This book's folio always rides
 * in the page furniture at the top or foot («8», «19 19», «42 42»), sometimes
 * doubled and sometimes joined by the stray running «2» on the first line of
 * every «Leçon» page, so the top and bottom furniture lines each contribute
 * both their space-stripped whole and every whitespace-separated digit token.
 * Leçon numerals and exercise numerals join the candidate set harmlessly: the
 * page's own number proves the mapping when present.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const region = [...lines.slice(0, 4), ...lines.slice(-4)];
  const numbers = new Set<number>();
  for (const line of region) {
    const joined = line.replace(/ /g, "");
    if (/^\d{1,3}$/.test(joined)) numbers.add(Number(joined));
    for (const token of line.split(/\s+/)) {
      if (/^\d{1,3}$/.test(token)) numbers.add(Number(token));
    }
  }
  return [...numbers].sort((a, b) => a - b);
}

/**
 * The book number a content page prints, or null when it prints none. Returns
 * the page's own number when it is among the candidates, otherwise the largest
 * candidate (so a wrong page still reports a number and the caller can see the
 * mismatch). The eight dividers (1, 13, 17, 21, 25, 31, 35, 41) print their
 * head but never a folio and are exempted via `FOLIO_LESS_ANCHORS`.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * Folios whose OCR printed a different, still parseable number. Every folio in
 * this born-digital book came out right, so the map is empty and the folio
 * check stays exact.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no folio in the checked furniture, each with the
 * anchor the check accepts in place of a page number: the seven chapitre
 * dividers plus the journal divider, each anchored on the head its own page
 * prints.
 */
const FOLIO_LESS_ANCHORS: Record<number, string> = {
  1: "CHAPITRE 1 : TOUT SUR MOI",
  13: "CHAPITRE 2 : L’ARBRE GÉNÉALOGIQUE",
  17: "CHAPITRE 3: NOTRE VIE EN SOCIÉTÉ",
  21: "CHAPITRE 1 : NOTRE ENVIRONNEMENT",
  25: "SE DÉPLACER DANS NOTRE ENVIRONNEMENT",
  31: "CHAPITRE 3 : NOTRE NOURRITURE",
  35: "CHAPITRE 4 : FÊTES ET TRADITIONS",
  41: "LE JOURNAL DES MATHÉMATIQUES",
};

/** Every head kind the table may use. */
const KNOWN_KINDS = new Set(["leçon"]);

/**
 * Table invariants: lesson keys are unique and follow (section-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_DISCOVERY_FR_G1_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_DISCOVERY_FR_G1_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_DISCOVERY_FR_G1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_DISCOVERY_FR_G1_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_DISCOVERY_FR_G1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     the folio in its furniture, or, on the eight pages named in
 *     `FOLIO_LESS_ANCHORS`, from the anchor the page itself prints. The scans
 *     in `MISSING_SCANS` (none this term) carry no text to prove anything with
 *     and are not iterated (they stay owned by their lesson ranges below);
 *  2. every section opener prints the section head and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title (or its printed head) and every activity's head is
 *     printed on the pages the lesson owns (the activity on its own page);
 *  4. every page in [1, 45] is owned by exactly one lesson — no page falls
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
  const sections = EGYPT_DISCOVERY_FR_G1_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_DISCOVERY_FR_G1_T1_BOOK_START || book > EGYPT_DISCOVERY_FR_G1_T1_BOOK_END) continue;
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
  for (let p = EGYPT_DISCOVERY_FR_G1_T1_BOOK_START; p <= EGYPT_DISCOVERY_FR_G1_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  const expectedPages = EGYPT_DISCOVERY_FR_G1_T1_BOOK_END - EGYPT_DISCOVERY_FR_G1_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب: ${printedPages.size} صفحة مقروءة بين ${EGYPT_DISCOVERY_FR_G1_T1_BOOK_START} و${EGYPT_DISCOVERY_FR_G1_T1_BOOK_END}، المتوقع ${expectedPages}`,
    );
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
