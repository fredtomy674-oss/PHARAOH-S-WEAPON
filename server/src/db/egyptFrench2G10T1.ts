// ---------------------------------------------------------------------------
// Egyptian G10, second foreign language, term 1 — the French textbook
// «Club@dos plus 1» (Livre de l’élève), Difusión / Santillana, ISBN
// 978-84-16347-60-5.
//
// This is the SECOND G10 French curriculum (the first is `egyptFrenchG10T1.ts`,
// a different series). Like the first, it is seeded from the book’s own printed
// «Tableau des contenus», one section per Unité and one lesson per printed
// component, and every mapping below is checked against the OCR page by page.
//
// THE BOOK PRINTS NO SCHOOL GRADE
// The cover and the imprint carry the title, the publisher and the ISBN only —
// no «الصف الأول الثانوي» or grade line. The curriculum is registered as G10
// French 2 by explicit product decision, not because the book prints it.
//
// THE OFFSET IS ONE — book page = scan page − 1
// Every content page prints its own folio, usually as the number glued to its
// French word («7sept», «12 douze», «11onze», «53cinquante-trois», and even
// «cinquante34 trente-quatre» where a word bleeds in from the facing folio), so
// the printed book page N is scan page N + 1 and `BOOK_TO_PDF_OFFSET = 1`. The
// offset is proven from these folios, not from the contents page.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–6 are the cover (1–2), the imprint (3), the «Avant-propos» (4)
// and the printed «Tableau des contenus» (5–6). Scan pages 71–126 are the
// back matter the contents page announces: the «Précis grammatical» (p. 70–73),
// the «Cahier d’exercices» (p. 74–106), «En route du DELF» (p. 107–111), the
// «Transcriptions» (p. 112–117), the «Glossaire» (p. 118–119), the «Tests»
// (p. 120–121) and the «Cartes» (p. 122–123). None of them is a reading of the
// term. The term runs from the Unité 1 opener (book page 6) to the second
// «Aide-Mémoire» that closes Unité 4 (book page 69): `_BOOK_START` / `_BOOK_END`
// are exactly those two pages, and the term is `_END − _START + 1 = 64` pages.
//
// THE FOUR UNITÉS AND THEIR AIDE-MÉMOIRE
// The contents page gives Unité 1 p. 6–19, Unité 2 p. 20–35, «Aide-Mémoire»
// p. 36–37, Unité 3 p. 38–51, Unité 4 p. 52–67 and a second «Aide-Mémoire»
// p. 68–69. Each Aide-Mémoire is a combined revision spread: p. 36–37 revises
// Unité 1 and 2, p. 68–69 revises Unité 3 and 4. To keep the four Unité
// boundaries the contents page prints — and to make the sections tile the term
// with no gap — the first Aide-Mémoire is modelled as the last lesson of Unité 2
// and the second as the last lesson of Unité 4. This is a modelling choice: the
// book groups the two Aide-Mémoire separately, the tree folds each into the unit
// it revises most closely.
//
// THE BOOK PRINTS NUMBERED LEÇONS
// Each Unité prints three numbered Leçons («Leçon 1 | Se présenter», «Leçon 2 |
// Présenter et identifier ses copains», …), followed by «Le coin de la
// grammaire» and «Le coin du lexique». Unités 2 and 4 add a full-bleed «A lire /
// Magazine@dos.plus» spread. Every one of those printed components becomes one
// lesson below, so a Unité is five to eight lessons long and its first lesson
// also carries the Unité opener (the title page and the discovery dialogue that
// precede the first numbered Leçon).
//
// TWO DOCUMENTED PAGE FEATURES
//  • Pages 66–67 are the «A lire / Magazine@dos.plus» spread that closes Unité 4.
//    Their OCR files are empty: they are full-bleed image pages that print no
//    running text at all. They belong to the lesson before them and are exempt
//    from the text and folio checks (`BLANK_PAGES`).
//  • The four Unité opener pages (6, 20, 38, 52) print large cover art and the
//    unit title but no folio, and pdf page 10 repeats pdf page 9’s text so book
//    page 8 has no scan of its own. Those five pages are the only term pages that
//    do not prove their own number from OCR, so they are the documented
//    `FOLIO_EXEMPT_PAGES`; book 8 is additionally pinned to book 9 by an explicit
//    equality check, and the four openers still have to carry real OCR text.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** One lesson of the book — becomes one lesson in the app tree. */
export interface French2G10T1Lesson {
  /** App-addressable key, e.g. "1-1" (Unité 1, lesson 1). */
  key: string;
  /** Full app-facing lesson title — the heading its own page prints. */
  title: string;
  /**
   * The string the lesson’s own first page must print (checked by
   * `assertTreeMatchesTheBook`): the Leçon title on a Leçon page, «Le coin de la
   * grammaire» / «Le coin du lexique» on those pages, «A lire» on the magazine
   * spread and the Unité title on the opener.
   */
  printedHead: string;
  /** First printed book page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book’s printed objectives/headings for this lesson, verbatim. */
  concepts: string[];
}

/** One printed section of the book — one of the four Unités. */
export interface French2G10T1Section {
  /** Internal key: "1"…"4". */
  key: string;
  kind: "unit";
  /** Section title as printed in the «Tableau des contenus». */
  title: string;
  /**
   * The section’s title as the pages spell it. The Unité opener prints it, so it
   * is recorded here and checked on the opener page of the section’s first
   * lesson.
   */
  footerTitle: string;
  /** First printed page of the section (the Unité’s opener). */
  bookFrom: number;
  /** Last printed page of the section (its Aide-Mémoire when it has one). */
  bookTo: number;
  lessons: French2G10T1Lesson[];
}

// ---------------------------------------------------------------------------
// THE OFFSET AND THE TERM’S BOUNDS
// ---------------------------------------------------------------------------

/** Scan page = book page + 1 (every content page prints its own number). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the term — the Unité 1 opener. */
export const EGYPT_FRENCH2_G10_T1_BOOK_START = 6;

/** Last printed page of the term — the Aide-Mémoire that closes Unité 4. */
export const EGYPT_FRENCH2_G10_T1_BOOK_END = 69;

// ---------------------------------------------------------------------------
// THE FOUR UNITÉS
// ---------------------------------------------------------------------------

/**
 * The four Unités of the book, in order. Each Unité tiles its own page range
 * with no gap: the opener, its three numbered Leçons, its «Le coin de la
 * grammaire» and «Le coin du lexique», the «A lire / Magazine@dos.plus» spread
 * where the book has one, and the Aide-Mémoire the contents page binds to it.
 * Every lesson starts on the page that prints its head and the ranges tile the
 * whole term.
 */
export const EGYPT_FRENCH2_G10_T1_SECTIONS: French2G10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    title: "Le Club de ma classe",
    footerTitle: "Le Club de ma classe",
    bookFrom: 6,
    bookTo: 19,
    lessons: [
      {
        key: "1-1",
        title: "Le Club de ma classe",
        printedHead: "Le Club de ma classe",
        bookFrom: 6,
        concepts: [
          "Saluer.",
          "Me présenter.",
          "Présenter et identifier mes copains.",
          "Parler du caractère.",
        ],
      },
      {
        key: "1-2",
        title: "Se présenter",
        printedHead: "Se présenter",
        bookFrom: 10,
        concepts: [
          "Les nombres.",
          "Les couleurs.",
          "Le son [r].",
          "Comment tu t’appelles ?",
        ],
      },
      {
        key: "1-3",
        title: "Présenter et identifier ses copains",
        printedHead: "Présenter et identifier ses copains",
        bookFrom: 12,
        concepts: [
          "Présenter et identifier les personnes.",
          "Les salutations.",
          "Les articles indéfinis.",
        ],
      },
      {
        key: "1-4",
        title: "Parler du caractère",
        printedHead: "Parler du caractère",
        bookFrom: 14,
        concepts: [
          "Le verbe être.",
          "Les adjectifs (le caractère).",
          "L’adjectif qualificatif.",
        ],
      },
      {
        key: "1-5",
        title: "Le coin de la grammaire",
        printedHead: "Le coin de la grammaire",
        bookFrom: 16,
        concepts: [
          "Se présenter.",
          "Les articles indéfinis.",
          "Le verbe s’appeler.",
          "Le verbe être.",
          "La formation des adjectifs qualificatifs (le caractère).",
        ],
      },
      {
        key: "1-6",
        title: "Le coin du lexique",
        printedHead: "Le coin du lexique",
        bookFrom: 18,
        concepts: [
          "L’alphabet français.",
          "Les couleurs.",
          "Les nombres.",
          "Les adjectifs qualificatifs.",
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    title: "Le Club des artistes",
    footerTitle: "Le Club des artistes",
    bookFrom: 20,
    bookTo: 37,
    lessons: [
      {
        key: "2-1",
        title: "Le Club des artistes",
        printedHead: "Le Club des artistes",
        bookFrom: 20,
        concepts: [
          "Identifier et décrire des objets.",
          "Demander et dire l’âge et la date d’anniversaire.",
          "Exprimer mes goûts.",
        ],
      },
      {
        key: "2-2",
        title: "Identifier et décrire des objets",
        printedHead: "Identifier et décrire des objets",
        bookFrom: 24,
        concepts: [
          "Les fournitures scolaires.",
          "Les articles définis.",
          "Qu’est-ce que c’est ?",
          "Le pluriel des adjectifs qualificatifs.",
        ],
      },
      {
        key: "2-3",
        title: "Demander et dire l’âge et la date d’anniversaire",
        printedHead: "Demander et dire l’âge et la date d’anniversaire",
        bookFrom: 26,
        concepts: [
          "Les nombres de 50 à 100.",
          "Les mois de l’année.",
          "Le verbe avoir.",
          "La liaison.",
        ],
      },
      {
        key: "2-4",
        title: "Exprimer ses goûts",
        printedHead: "Exprimer ses goûts",
        bookFrom: 28,
        concepts: [
          "Regarder.",
          "Les verbes en -er.",
          "La forme négative.",
        ],
      },
      {
        key: "2-5",
        title: "Le coin de la grammaire",
        printedHead: "Le coin de la grammaire",
        bookFrom: 30,
        concepts: [
          "Identifier des objets.",
          "Le pluriel des adjectifs qualificatifs.",
          "Le verbe avoir.",
          "Les verbes en -er.",
          "La forme négative.",
        ],
      },
      {
        key: "2-6",
        title: "Le coin du lexique",
        printedHead: "Le coin du lexique",
        bookFrom: 32,
        concepts: [
          "Les fournitures scolaires.",
          "Les mois de l’année.",
          "Les nombres de 50 à 100.",
        ],
      },
      {
        key: "2-7",
        title: "A lire",
        printedHead: "A lire",
        bookFrom: 34,
        concepts: [
          "A lire.",
          "Le Magazine@dos.plus : les loisirs et activités des adolescents.",
        ],
      },
      {
        key: "2-8",
        title: "Aide-mémoire",
        printedHead: "Aide-mémoire",
        bookFrom: 36,
        concepts: [
          "Aide-mémoire.",
          "Communication.",
          "Grammaire.",
          "Phonétique.",
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    title: "Le Club des lecteurs",
    footerTitle: "Le Club des lecteurs",
    bookFrom: 38,
    bookTo: 51,
    lessons: [
      {
        key: "3-1",
        title: "Le Club des lecteurs",
        printedHead: "Le Club des lecteurs",
        bookFrom: 38,
        concepts: [
          "Décrire mon lycée.",
          "Identifier les objets de la classe.",
          "Demander et dire l’heure.",
          "Parler de mon emploi du temps.",
          "Utiliser les adjectifs possessifs pour parler de mes affaires.",
        ],
      },
      {
        key: "3-2",
        title: "Décrire mon lycée et identifier les objets de la classe",
        printedHead: "Décrire mon lycée et identifier les objets de la classe",
        bookFrom: 42,
        concepts: [
          "Les objets de la classe.",
          "Combien de/d’ ?",
        ],
      },
      {
        key: "3-3",
        title: "Demander et dire l’heure, parler de son emploi du temps",
        printedHead: "Demander et dire l’heure, parler de son emploi du temps",
        bookFrom: 44,
        concepts: [
          "Les matières scolaires.",
          "Les jours de la semaine.",
          "Quel, Quels, Quelle, Quelles ?",
          "Demander et dire l’heure.",
        ],
      },
      {
        key: "3-4",
        title: "Utiliser les adjectifs possessifs pour parler de ses affaires",
        printedHead: "Utiliser les adjectifs possessifs pour parler de ses affaires",
        bookFrom: 46,
        concepts: [
          "La possession.",
          "Les adjectifs possessifs.",
          "Le CDI.",
          "Le son [ʒ].",
        ],
      },
      {
        key: "3-5",
        title: "Le coin de la grammaire",
        printedHead: "Le coin de la grammaire",
        bookFrom: 48,
        concepts: [
          "Il y a.",
          "Combien de/d’ ?",
          "Quel, Quels, Quelle, Quelles ?",
          "Exprimer la possession.",
        ],
      },
      {
        key: "3-6",
        title: "Le coin du lexique",
        printedHead: "Le coin du lexique",
        bookFrom: 50,
        concepts: [
          "Les espaces du lycée.",
          "Les objets de la classe.",
          "Les matières scolaires.",
          "Les heures.",
          "Les objets du CDI.",
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    title: "Le Club des athlètes",
    footerTitle: "Le Club des athlètes",
    bookFrom: 52,
    bookTo: 69,
    lessons: [
      {
        key: "4-1",
        title: "Le Club des athlètes",
        printedHead: "Le Club des athlètes",
        bookFrom: 52,
        concepts: [
          "Décrire des personnes.",
          "Présenter et identifier ma famille.",
          "Parler de mes activités et de mes loisirs.",
        ],
      },
      {
        key: "4-2",
        title: "Décrire des personnes",
        printedHead: "Décrire des personnes",
        bookFrom: 56,
        concepts: [
          "L’adjectif qualificatif (le physique).",
          "Le féminin des adjectifs.",
          "Le pluriel des adjectifs.",
          "Les parties du corps.",
        ],
      },
      {
        key: "4-3",
        title: "Présenter et identifier sa famille",
        printedHead: "Présenter et identifier sa famille",
        bookFrom: 58,
        concepts: [
          "La famille.",
          "Le son [ɑ̃].",
          "La négation ne… pas.",
        ],
      },
      {
        key: "4-4",
        title: "Parler de ses activités et de ses loisirs",
        printedHead: "Parler de ses activités et de ses loisirs",
        bookFrom: 60,
        concepts: [
          "On = Nous.",
          "Le verbe aller.",
          "Les articles contractés.",
          "Les pronoms toniques.",
        ],
      },
      {
        key: "4-5",
        title: "Le coin de la grammaire",
        printedHead: "Le coin de la grammaire",
        bookFrom: 62,
        concepts: [
          "On = Nous.",
          "La formation de l’adjectif qualificatif (le physique).",
          "Les pronoms toniques.",
        ],
      },
      {
        key: "4-6",
        title: "Le coin du lexique",
        printedHead: "Le coin du lexique",
        bookFrom: 64,
        concepts: [
          "Le coin du lexique.",
          "Les parties du corps (1).",
        ],
      },
      {
        key: "4-7",
        title: "Aide-mémoire",
        printedHead: "Aide-mémoire",
        bookFrom: 68,
        concepts: [
          "Les adjectifs possessifs.",
          "Les adjectifs interrogatifs quel, quels, quelle, quelles.",
          "Combien de / d’ ?",
          "Le verbe aller.",
          "On = Nous.",
          "Les articles contractés (1).",
          "Les pronoms toniques.",
          "Les parties du corps.",
          "Les membres de la famille.",
        ],
      },
    ],
  },
];

/**
 * Alias so both `_SECTIONS` (the name `egyptFrenchG10T1.ts` uses) and `_UNITS`
 * (the name the Arabic and Math books of this series use) resolve to the four
 * Unités. The tree shape is identical.
 */
export const EGYPT_FRENCH2_G10_T1_UNITS = EGYPT_FRENCH2_G10_T1_SECTIONS;

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the section’s first page (for its first
 * lesson — the Unité opener) or its own start page, up to the page before the
 * next lesson starts, or the section’s last page for its last lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_FRENCH2_G10_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson’s derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const ranges: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_FRENCH2_G10_T1_SECTIONS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      ranges.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return ranges;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This book has no
 * appendix bound into the term: the «Précis grammatical», the «Cahier
 * d’exercices», the DELF pages, the transcriptions, the glossary, the tests and
 * the maps are all back matter after page 69 and are not part of this file. Kept
 * as a function so the seeder and the stage share one shape across the books.
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
  "french2-g10-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. Normalised to ""
 * so the page map can never mistake a blank for content.
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

/** One page of a lesson’s document, with a stable printed-page marker. */
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

// ---------------------------------------------------------------------------
// The book’s folio: a number and its French word
// ---------------------------------------------------------------------------

/** French cardinals 0–16, the atoms of every folio word this book uses. */
const FRENCH_UNITS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
] as const;

/** The tens whose word is a single word (17–19 and 70–99 are built specially). */
const FRENCH_TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"] as const;

/** The French word for a cardinal 0–126, the way this book prints it. */
function frenchNumberWord(n: number): string {
  if (n < 17) return FRENCH_UNITS[n]!;
  if (n < 20) return `dix-${FRENCH_UNITS[n - 10]!}`;
  if (n < 70) {
    const tens = FRENCH_TENS[Math.floor(n / 10)]!;
    const unit = n % 10;
    if (unit === 0) return tens;
    if (unit === 1) return `${tens} et un`;
    return `${tens}-${FRENCH_UNITS[unit]!}`;
  }
  if (n < 80) return n === 71 ? "soixante et onze" : `soixante-${FRENCH_UNITS[n - 60]!}`;
  if (n === 80) return "quatre-vingts";
  if (n < 100) {
    const unit = n - 80;
    if (unit === 0) return "quatre-vingts";
    if (unit === 1) return "quatre-vingt-un";
    return `quatre-vingt-${FRENCH_UNITS[unit]!}`;
  }
  if (n === 100) return "cent";
  if (n < 200) return `cent ${frenchNumberWord(n - 100)}`;
  return "";
}

/** Fold a folio fragment: drop the spaces, hyphens and apostrophes the OCR scatters. */
function foldFolio(text: string): string {
  return text.replace(/[\s'’\u2019-]/g, "").toLowerCase();
}

/** Every French number word a folio can print, folded. Built once. */
const FOLIO_WORDS = new Set<string>();
for (let n = 0; n <= 126; n++) FOLIO_WORDS.add(foldFolio(frenchNumberWord(n)));
// Variant without the plural -s, which appears on some printings/OCR passes.
FOLIO_WORDS.add(foldFolio("quatre-vingt"));

/**
 * Page-number candidates a content page prints. This book prints its folio at the
 * foot as the number together with its French word («7sept», «12 douze»,
 * «11onze», «53cinquante-trois», «cinquante34 trente-quatre»). The OCR glues the
 * two, splits them, or drags a word from the facing folio, so a line is a folio
 * when it folds to a single run of digits whose neighbouring letters — if any —
 * are a French number word. A bare number also counts.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const candidates = new Set<number>();
  for (const line of text.split(/\r?\n/)) {
    const folded = foldFolio(line);
    const match = /^([a-zà-ÿœ]*)(\d{1,3})([a-zà-ÿœ]*)$/iu.exec(folded);
    if (!match) continue;
    const left = (match[1] ?? "").toLowerCase();
    const right = (match[3] ?? "").toLowerCase();
    if (!left && !right) {
      candidates.add(Number(match[2]));
      continue;
    }
    if ((right && FOLIO_WORDS.has(right)) || (left && FOLIO_WORDS.has(left))) {
      candidates.add(Number(match[2]));
    }
  }
  return [...candidates].sort((a, b) => a - b);
}

/**
 * The book number a content page prints, or null. Every content page that carries
 * a folio carries its own, so a page that prints it returns itself; a mismatch
 * returns the largest candidate so the caller can see the difference.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * The two «A lire / Magazine@dos.plus» pages that close Unité 4 (book pages 66
 * and 67). Their OCR files are empty — full-bleed image pages with no running
 * text. They still belong to the lesson that owns the spread (book 64–67), so
 * they are counted in the term but are exempt from the text and folio checks.
 */
const BLANK_PAGES = new Set([66, 67]);

/**
 * The five term pages whose number the OCR does not carry:
 *  • 6, 20, 38, 52 — the four Unité openers, which print large cover art and the
 *    unit title but no folio;
 *  • 8 — pdf page 10 repeats pdf page 9, so book page 8 has no scan of its own.
 * They must still carry OCR text and be owned by a lesson, and book 8 is pinned
 * to book 9 by the explicit equality check below.
 */
const FOLIO_EXEMPT_PAGES = new Set([6, 8, 20, 38, 52]);

/**
 * Whether every book page strictly between two sections is a documented blank
 * leaf. The four Unités are contiguous here (19→20, 37→38, 51→52), so no gap is
 * ever expected; the helper mirrors the first French book’s API.
 */
function gapIsBlankOnly(afterBookTo: number, beforeBookFrom: number): boolean {
  for (let p = afterBookTo + 1; p < beforeBookFrom; p++) {
    if (!BLANK_PAGES.has(p)) return false;
  }
  return true;
}

/**
 * Table invariants: lesson keys match their position, every range sits inside its
 * section, sections tile the book with no gap, and the first section starts where
 * the Tableau des contenus says. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_FRENCH2_G10_T1_SECTIONS;

  sections.forEach((section, si) => {
    if (section.lessons.length === 0) problems.push(`القسم ${section.key}: بلا دروس`);
    if (!section.title.trim()) problems.push(`القسم ${section.key}: بلا عنوان`);
    if (!section.footerTitle.trim()) problems.push(`القسم ${section.key}: بلا ترويسة`);
    section.lessons.forEach((lesson, li) => {
      const expectedKey = `${section.key}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`القسم ${section.key} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (!lesson.title.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان`);
      if (!lesson.printedHead.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان مطبوع`);
      if (lesson.bookFrom < section.bookFrom || lesson.bookFrom > section.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${section.bookFrom}–${section.bookTo}`);
      }
      const { from, to } = lessonBookRange(si, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < section.bookFrom || to > section.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${section.bookFrom}–${section.bookTo}`);
      }
      const next = section.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== section.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر القسم ${section.bookFrom}، وجدنا ${from}`);
      }
    });
    const nextSection = sections[si + 1];
    if (nextSection && section.bookTo >= nextSection.bookFrom) {
      problems.push(`القسم ${section.key} يتداخل مع القسم ${nextSection.key}`);
    }
    if (nextSection && section.bookTo + 1 !== nextSection.bookFrom && !gapIsBlankOnly(section.bookTo, nextSection.bookFrom)) {
      problems.push(`فجوة بين القسم ${section.key} (حتى ${section.bookTo}) والقسم ${nextSection.key} (من ${nextSection.bookFrom})`);
    }
  });

  const first = sections[0]!;
  const last = sections[sections.length - 1]!;
  if (first.bookFrom !== EGYPT_FRENCH2_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من ${EGYPT_FRENCH2_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last.bookTo !== EGYPT_FRENCH2_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند ${EGYPT_FRENCH2_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  0. pdf page 10 repeats pdf page 9, so book page 8 must equal book page 9
 *     exactly (its scan is the duplicate);
 *  1. every term page is accounted for: the documented blank spread (66–67)
 *     carries no text, every other page carries real OCR text, and every page not
 *     in `FOLIO_EXEMPT_PAGES` prints its own folio;
 *  2. every lesson’s own first page prints that lesson’s head;
 *  3. every lesson’s title is printed somewhere in its page range;
 *  4. every term page is owned by exactly one lesson — no page falls between two
 *     lessons and is unreachable, and the blank spread is owned like any other;
 *  5. the 64 term pages tile [START, END] with nothing missing. `pagesChecked`
 *     counts exactly those pages, blank spread included.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const sections = EGYPT_FRENCH2_G10_T1_SECTIONS;

  // 0. the duplicate scan: book 8 has no page of its own, so it must be byte-equal
  //    to book 9 (pdf page 10 repeats pdf page 9).
  if (loadBookPage(8) !== loadBookPage(9)) {
    problems.push(`صفحة الكتاب 8: لا تطابق الصفحة 9 رغم أن الماسح كرّر الصفحة 9`);
  }

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const termPages = new Set<number>();

  // 1. every term page: the blank spread is empty, the others carry text and
  //    (unless documented otherwise) their own folio.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_FRENCH2_G10_T1_BOOK_START || book > EGYPT_FRENCH2_G10_T1_BOOK_END) continue;
    termPages.add(book);

    const text = loadBookPage(book);
    if (BLANK_PAGES.has(book)) {
      if (text) problems.push(`الصفحة البيضاء ${book}: يجب أن تكون بيضاء لكنها تحمل نصًا`);
      continue;
    }
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    if (FOLIO_EXEMPT_PAGES.has(book)) continue;

    const footer = printedFooter(book);
    if (footer === null) {
      problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع`);
    } else if (footer !== book) {
      problems.push(`صفحة الكتاب ${book}: رقمها المطبوع لا يطابقها (وجدنا ${footer})`);
    }
  }

  // 2. every lesson’s own first page prints that lesson’s head.
  for (const section of sections) {
    for (const lesson of section.lessons) {
      const page = loadBookPage(lesson.bookFrom);
      if (!page) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        continue;
      }
      if (!normalize(page).toLowerCase().includes(normalize(lesson.printedHead).toLowerCase())) {
        problems.push(`الدرس ${lesson.key}: صفحة ${lesson.bookFrom} لا تطبع عنوانه «${lesson.printedHead}»`);
      }
    }
  }

  // 3. every lesson’s title is printed somewhere in its page range.
  for (const [sectionIndex, section] of sections.entries()) {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(sectionIndex, li);
      let page = "";
      for (let p = from; p <= to; p++) page += `\n${loadBookPage(p)}`;
      if (!normalize(page).toLowerCase().includes(normalize(lesson.title).toLowerCase())) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
    });
  }

  // 4. every term page is owned by exactly one lesson.
  const owners = new Map<number, string[]>();
  for (const range of allLessonRanges()) {
    for (let p = range.from; p <= range.to; p++) {
      const list = owners.get(p) ?? [];
      list.push(range.key);
      owners.set(p, list);
    }
  }
  for (let book = EGYPT_FRENCH2_G10_T1_BOOK_START; book <= EGYPT_FRENCH2_G10_T1_BOOK_END; book++) {
    const list = owners.get(book) ?? [];
    if (list.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: ${list.length === 0 ? "لا يملكها أي درس" : `يملكها أكثر من درس (${list.join("، ")})`}`);
    }
  }

  // 5. the term tiles exactly. pagesChecked counts every term page, the blank
  //    spread included.
  const pagesChecked = EGYPT_FRENCH2_G10_T1_BOOK_END - EGYPT_FRENCH2_G10_T1_BOOK_START + 1;
  if (termPages.size !== pagesChecked) {
    problems.push(`عدد صفحات المحتوى ${termPages.size} بينما المتوقع ${pagesChecked} (${EGYPT_FRENCH2_G10_T1_BOOK_START}–${EGYPT_FRENCH2_G10_T1_BOOK_END})`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
