// Egypt Secondary-1 (Grade 10) German, first term — «Schritte international
// (Schulbuchausgabe Ägypten) 1», Kursbuch + Arbeitsbuch, Hueber.
//
// The first term IS the Ministry textbook: the four Lektionen of its printed
// «Inhalt Kursbuch» (book page 5) and the pages they occupy (book pages 8–47).
// This file is the book's table — one section per Lektion, one lesson per printed
// component of that Lektion (the Einstiegsdoppelseite that carries the Lektion
// title and «Lernziele», the five Lernschritte A–E, the «Grammatik» overview, and
// the two-page Zwischenspiel) — plus a set of helpers so the seeder and the stage
// share the same page map. The self-checks at the bottom prove the mapping against
// the OCR itself, page by page.
//
// THE OFFSET IS ZERO — book page = scan page
// Every content page prints its own number glued to the running head at its foot
// («acht 8 LEKTION 1», «zwanzig 20 LEKTION 2»), so a book page N is scan page N
// (`BOOK_TO_PDF_OFFSET = 0`). The Contents page itself prints «5» and the Vorwort
// prints «6», proving the offset before the term even begins.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–7 are the cover (1), the imprint (2), the «Aufbau» legend (3), a
// blank page (4), the printed «Inhalt Kursbuch» (5), the «Vorwort» (6) and the
// one-page character introduction «Die erste Stunde im Kurs» (7). Scan pages
// 48–112 are the «ARBEITSBUCH» divider (49), the «Inhalt Arbeitsbuch» (51), the
// integrated workbook's exercises (52–93), the glossaries (95–108), the
// «Quellenverzeichnis» (109) and the back cover (110–112), with a few blank
// leaves (48, 50, 94, 96) between them. None of them is a Kursbuch lesson. The
// term runs from the Lektion 1 opener (page 8) to the last page of Lektion 4's
// Zwischenspiel (page 47): `EGYPT_GERMAN_G10_T1_BOOK_START` / `_END` are exactly
// those two pages, and the tiling assertion proves nothing in between is left
// unreachable.
//
// THE RUNNING HEAD IS PER LEKTION
// Unlike the Italian and English books of this series, every Kursbuch content
// page prints the unit's running head at its foot («LEKTION 1» … «LEKTION 4»).
// `assertTreeMatchesTheBook` therefore checks the section's running head on every
// one of its content pages, which pins each page to its Lektion independently of
// the page range.
//
// THE ZWISCHENSPIEL PAGES PRINT NO FOLIO IN THE OCR
// The eight Zwischenspiel pages (16–17, 26–27, 36–37, 46–47) are full-bleed map
// and photo double pages: the OCR captured their content but not their printed
// page number or the «LEKTION n» head. They are the only term pages without a
// folio. Rather than weaken the page-number check, they are exempted from it and
// anchored instead: each must print either the word «ZWISCHENSPIEL» (the right-hand
// page) or its own Zwischenspiel title (the left-hand page). See
// `ZWISCHENSPIEL_PAGES` and step 1 of `assertTreeMatchesTheBook`.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S «LERNZIELE»
// The Vorwort says every Lektion opens with an «Einstieg» that «benennt die
// Lernziele». Those five objective lines (A–E) are printed on the Einstieg's
// second page; the Contents repeats them per Schritt. Each Schritt lesson below
// carries its own verbatim «Lernziele» line, the Einstieg carries all five, the
// «Grammatik» overview carries the Contents' own grammar bullets, and each
// Zwischenspiel carries its printed activity instructions. The lesson `title` is
// the heading the page itself prints (the Contents labels its Schritte with the
// objective instead; that objective becomes the lesson's `concepts`).

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** One lesson of the book — becomes one lesson in the app tree. */
export interface GermanG10T1Lesson {
  /** App-addressable key, e.g. "1-1" (Lektion 1, lesson 1). */
  key: string;
  /** Full app-facing lesson title — the heading its own page prints. */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`): the Lektion title on the Einstieg, the Schritt
   * heading on a Lernschritt page, «Grammatik» on the overview, and the
   * Zwischenspiel title on the culture spread.
   */
  printedHead: string;
  /** First printed book page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's own printed objectives/overview lines for this lesson, verbatim. */
  concepts: string[];
}

/** One printed section of the book — one of the four Lektionen. */
export interface GermanG10T1Section {
  /** Internal key: "1"…"4". */
  key: string;
  kind: "unit";
  /** Section title as printed in the Contents. */
  title: string;
  /** The section's running head — «LEKTION 1» … «LEKTION 4». */
  footerTitle: string;
  /** First printed page of the section (the Lektion 1 Einstieg). */
  bookFrom: number;
  /** Last printed page of the section (the Zwischenspiel's second page). */
  bookTo: number;
  lessons: GermanG10T1Lesson[];
}

// ---------------------------------------------------------------------------
// THE OFFSET AND THE TERM'S BOUNDS
// ---------------------------------------------------------------------------

/** Book page = scan page (every content page prints its own number). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the term — the Lektion 1 opener. */
export const EGYPT_GERMAN_G10_T1_BOOK_START = 8;

/** Last printed page of the term — the end of Lektion 4's Zwischenspiel. */
export const EGYPT_GERMAN_G10_T1_BOOK_END = 47;

// ---------------------------------------------------------------------------
// THE FOUR LEKTIONEN
// ---------------------------------------------------------------------------

/**
 * The four Lektionen of the Kursbuch, in order. Each Lektion tiles its own page
 * range of ten pages with no gap: the Einstiegsdoppelseite (2 pages), the five
 * Lernschritte A–E (1 page each), the «Grammatik» overview (1 page) and the
 * Zwischenspiel (2 pages). The Einstieg rides with the Lektion title; the
 * Zwischenspiel is the last lesson and owns the two culture pages.
 *
 * The `title` on every Lernschritt is the heading the page prints (the book's
 * Contents names each Schritt by its objective instead — that objective is the
 * lesson's `concepts`).
 */
export const EGYPT_GERMAN_G10_T1_SECTIONS: GermanG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    title: "Guten Tag. Mein Name ist ...",
    footerTitle: "LEKTION 1",
    bookFrom: 8,
    bookTo: 17,
    lessons: [
      {
        key: "1-1",
        title: "Guten Tag. Mein Name ist ...",
        printedHead: "Guten Tag. Mein Name ist ...",
        bookFrom: 8,
        concepts: [
          "A jemanden begrüßen (Hallo.) und sich verabschieden (Tschüs.)",
          "B jemanden nach dem Namen fragen und sich vorstellen: Wie heißen Sie? Ich heiße ...",
          "C das Herkunftsland nennen: Ich komme aus...; über Sprachkenntnisse Auskunft geben: Ich spreche Deutsch.",
          "D etwas buchstabieren: Ich buchstabiere: ...; am Telefon nach jemandem fragen: Ist Frau ... da, bitte?",
          "E eine Visitenkarte lesen; ein Anmeldeformular ausfüllen",
        ],
      },
      {
        key: "1-2",
        title: "Guten Tag. - Hallo!",
        printedHead: "Guten Tag. - Hallo!",
        bookFrom: 10,
        concepts: ["A jemanden begrüßen (Hallo.) und sich verabschieden (Tschüs.)"],
      },
      {
        key: "1-3",
        title: "Ich heiße Timo.",
        printedHead: "Ich heiße Timo.",
        bookFrom: 11,
        concepts: [
          "B jemanden nach dem Namen fragen und sich vorstellen: Wie heißen Sie? Ich heiße ...",
        ],
      },
      {
        key: "1-4",
        title: "Ich komme aus Finnland.",
        printedHead: "Ich komme aus Finnland.",
        bookFrom: 12,
        concepts: [
          "C das Herkunftsland nennen: Ich komme aus...; über Sprachkenntnisse Auskunft geben: Ich spreche Deutsch.",
        ],
      },
      {
        key: "1-5",
        title: "Buchstaben",
        printedHead: "Buchstaben",
        bookFrom: 13,
        concepts: [
          "D etwas buchstabieren: Ich buchstabiere: ...; am Telefon nach jemandem fragen: Ist Frau ... da, bitte?",
        ],
      },
      {
        key: "1-6",
        title: "Visitenkarten",
        printedHead: "Visitenkarten",
        bookFrom: 14,
        concepts: ["E eine Visitenkarte lesen; ein Anmeldeformular ausfüllen"],
      },
      {
        key: "1-7",
        title: "Grammatik",
        printedHead: "Grammatik",
        bookFrom: 15,
        concepts: [
          "Wichtige Wendungen",
          "W-Frage: Wie heißen Sie?",
          "Aussage: Ich heiße / Ich bin ...",
          "Personalpronomen ich, Sie, du",
          "Verbkonjugation (ich, Sie, du): heißen, kommen, sprechen, sein",
          "Präposition aus: Ich komme aus Finnland.",
        ],
      },
      {
        key: "1-8",
        title: "Grüezi! Guten Tag! Grüß Gott!",
        printedHead: "Grüezi! Guten Tag! Grüß Gott!",
        bookFrom: 16,
        concepts: [
          "1 Hören Sie das Lied. Woher kommen die Leute?",
          "2 Singen Sie das Lied mit.",
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    title: "Familie und Freunde",
    footerTitle: "LEKTION 2",
    bookFrom: 18,
    bookTo: 27,
    lessons: [
      {
        key: "2-1",
        title: "Familie und Freunde",
        printedHead: "Familie und Freunde",
        bookFrom: 18,
        concepts: [
          "A jemanden nach dem Befinden fragen und sein eigenes Befinden ausdrücken: Wie geht es Ihnen? – Gut, danke.",
          "B seine Familie und Freunde vorstellen: Das ist mein Bruder.",
          "C den Wohnort und die Adresse nennen: Sie wohnt in München, in der Baaderstraße.",
          "D bis 20 zählen; ein Formular ausfüllen",
          "E sich und andere vorstellen: Ich bin ... Das ist ...",
        ],
      },
      {
        key: "2-2",
        title: "Wie geht's? – Danke, sehr gut.",
        printedHead: "Wie geht's? – Danke, sehr gut.",
        bookFrom: 20,
        concepts: [
          "A jemanden nach dem Befinden fragen und sein eigenes Befinden ausdrücken: Wie geht es Ihnen? – Gut, danke.",
        ],
      },
      {
        key: "2-3",
        title: "Das ist mein Freund Timo.",
        printedHead: "Das ist mein Freund Timo.",
        bookFrom: 21,
        concepts: ["B seine Familie und Freunde vorstellen: Das ist mein Bruder."],
      },
      {
        key: "2-4",
        title: "Sie wohnt in der Baaderstraße.",
        printedHead: "Sie wohnt in der Baaderstraße.",
        bookFrom: 22,
        concepts: [
          "C den Wohnort und die Adresse nennen: Sie wohnt in München, in der Baaderstraße.",
        ],
      },
      {
        key: "2-5",
        title: "Zahlen und Personalien",
        printedHead: "Zahlen und Personalien",
        bookFrom: 23,
        concepts: ["D bis 20 zählen; ein Formular ausfüllen"],
      },
      {
        key: "2-6",
        title: "Sich vorstellen",
        printedHead: "Sich vorstellen",
        bookFrom: 24,
        concepts: ["E sich und andere vorstellen: Ich bin ... Das ist ..."],
      },
      {
        key: "2-7",
        title: "Grammatik",
        printedHead: "Grammatik",
        bookFrom: 25,
        concepts: [
          "Wichtige Wendungen",
          "Possessivartikel mein/meine",
          "Personalpronomen er/sie, wir, ihr, sie",
          "Verbkonjugation: leben, haben, ...",
          "Präposition in: Sie leben in Helsinki.",
        ],
      },
      {
        key: "2-8",
        title: "Wer? Wo? Was?",
        printedHead: "Wer? Wo? Was?",
        bookFrom: 26,
        concepts: [
          "1 Lesen Sie die Texte und beantworten Sie die Fragen.",
          "2 Suchen Sie die Städte auf der Landkarte und ergänzen Sie die Buchstaben.",
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    title: "Essen und Trinken",
    footerTitle: "LEKTION 3",
    bookFrom: 28,
    bookTo: 37,
    lessons: [
      {
        key: "3-1",
        title: "Essen und Trinken",
        printedHead: "Essen und Trinken",
        bookFrom: 28,
        concepts: [
          "A Lebensmittel benennen: Das ist ein Apfel.; Vermutungen äußern: Ich glaube, das ist eine Tomate.",
          "B Mengen benennen (zwei Kilo Äpfel)",
          "C ein Einkaufsgespräch führen: Haben Sie Äpfel? Ich brauche Äpfel.",
          "D nach Preisen fragen und Preise nennen: Was kostet ...? Das kostet ...; Gewichts- und Maßangaben machen (eine Flasche Saft)",
          "E Vorlieben ausdrücken: Mein Lieblingsessen ist ...",
        ],
      },
      {
        key: "3-2",
        title: "Das ist doch kein Apfel, oder?",
        printedHead: "Das ist doch kein Apfel, oder?",
        bookFrom: 30,
        concepts: [
          "A Lebensmittel benennen: Das ist ein Apfel.; Vermutungen äußern: Ich glaube, das ist eine Tomate.",
        ],
      },
      {
        key: "3-3",
        title: "Zwei Kilo Kartoffeln",
        printedHead: "Zwei Kilo Kartoffeln",
        bookFrom: 31,
        concepts: ["B Mengen benennen (zwei Kilo Äpfel)"],
      },
      {
        key: "3-4",
        title: "Haben Sie Äpfel?",
        printedHead: "Haben Sie Äpfel?",
        bookFrom: 32,
        concepts: ["C ein Einkaufsgespräch führen: Haben Sie Äpfel? Ich brauche Äpfel."],
      },
      {
        key: "3-5",
        title: "Gewichte und Maßeinheiten",
        printedHead: "Gewichte und Maßeinheiten",
        bookFrom: 33,
        concepts: [
          "D nach Preisen fragen und Preise nennen: Was kostet ...? Das kostet ...; Gewichts- und Maßangaben machen (eine Flasche Saft)",
        ],
      },
      {
        key: "3-6",
        title: "Mein Lieblingsessen",
        printedHead: "Mein Lieblingsessen",
        bookFrom: 34,
        concepts: ["E Vorlieben ausdrücken: Mein Lieblingsessen ist ..."],
      },
      {
        key: "3-7",
        title: "Grammatik",
        printedHead: "Grammatik",
        bookFrom: 35,
        concepts: [
          "Wichtige Wendungen",
          "Ja-/Nein-Frage: Kennen Sie ...?",
          "Nullartikel: Haben Sie Äpfel?",
          "indefiniter Artikel ein/eine",
          "Negativartikel kein/keine",
          "Plural der Nomen: Tomaten, Eier",
          "Verbkonjugation: essen",
        ],
      },
      {
        key: "3-8",
        title: "Brotzeit, Vesper, Jause ... Wir machen (k)eine Pause.",
        printedHead: "Brotzeit, Vesper, Jause ... Wir machen (k)eine Pause.",
        bookFrom: 36,
        concepts: [
          "Sie möchten Kartoffelsalat machen. Was brauchen Sie? Hören Sie und ergänzen Sie die Liste.",
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    title: "Meine Wohnung",
    footerTitle: "LEKTION 4",
    bookFrom: 38,
    bookTo: 47,
    lessons: [
      {
        key: "4-1",
        title: "Meine Wohnung",
        printedHead: "Meine Wohnung",
        bookFrom: 38,
        concepts: [
          "A eine Wohnung beschreiben: Das ist die Küche.",
          "B Gefallen und Missfallen ausdrücken: Die Wohnung gefällt mir sehr gut.",
          "C Möbel und Elektrogeräte benennen und beschreiben: Die Stühle sind gelb und breit.; Gefallen und Missfallen ausdrücken: Die Stühle gefallen mir gut.",
          "D Wohnungsanzeigen verstehen",
          "E einen Zeitungsartikel lesen und über Wohnstile sprechen: Meine Wohnung ist sehr modern.",
        ],
      },
      {
        key: "4-2",
        title: "Das ist das Wohnzimmer.",
        printedHead: "Das ist das Wohnzimmer.",
        bookFrom: 40,
        concepts: ["A eine Wohnung beschreiben: Das ist die Küche."],
      },
      {
        key: "4-3",
        title: "Die Wohnung gefällt mir sehr gut.",
        printedHead: "Die Wohnung gefällt mir sehr gut.",
        bookFrom: 41,
        concepts: ["B Gefallen und Missfallen ausdrücken: Die Wohnung gefällt mir sehr gut."],
      },
      {
        key: "4-4",
        title: "Du hast aber schöne Möbel!",
        printedHead: "Du hast aber schöne Möbel!",
        bookFrom: 42,
        concepts: [
          "C Möbel und Elektrogeräte benennen und beschreiben: Die Stühle sind gelb und breit.; Gefallen und Missfallen ausdrücken: Die Stühle gefallen mir gut.",
        ],
      },
      {
        key: "4-5",
        title: "Wohnungsanzeigen",
        printedHead: "Wohnungsanzeigen",
        bookFrom: 43,
        concepts: ["D Wohnungsanzeigen verstehen"],
      },
      {
        key: "4-6",
        title: "Wohnstile",
        printedHead: "Wohnstile",
        bookFrom: 44,
        concepts: ["E einen Zeitungsartikel lesen und über Wohnstile sprechen: Meine Wohnung ist sehr modern."],
      },
      {
        key: "4-7",
        title: "Grammatik",
        printedHead: "Grammatik",
        bookFrom: 45,
        concepts: [
          "Wichtige Wendungen",
          "definiter Artikel der/das/die",
          "lokale Adverbien hier/dort",
          "prädikatives Adjektiv: Sie ist schön.",
          "Personalpronomen er/es/sie",
          "Negation nicht: Das Bad ist nicht klein.",
          "Verbkonjugation: gefallen",
        ],
      },
      {
        key: "4-8",
        title: "Die Adresse ist ...",
        printedHead: "Die Adresse ist ...",
        bookFrom: 46,
        concepts: [
          "1 Lesen Sie die Texte und hören Sie die Nachricht.",
          "2 Was passt? Kreuzen Sie an.",
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
 * lesson — the Einstieg) or its own start page, up to the page before the next
 * lesson starts, or the section's last page for the last lesson. Every lesson
 * below starts on the page that prints its head and the ranges tile the whole
 * term with no gap.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_GERMAN_G10_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const ranges: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_GERMAN_G10_T1_SECTIONS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      ranges.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return ranges;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. The Kursbuch
 * lessons ground the tutor in the Kursbuch pages alone: the integrated workbook
 * (scan pages 52–93) and the glossaries (95–108) are a separate, back-matter
 * component of the same printed volume and are not referenced from a Kursbuch
 * lesson. Kept as a function so the seeder and the stage share one shape across
 * all the books.
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
  "german-g10-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. No term page is
 * blank (the blank leaves are all in the front/back matter), but the loader
 * normalises them to "" so a future page map cannot mistake a blank for content.
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

/**
 * Page-number candidates a content page prints at its foot. Every Kursbuch
 * content page prints its folio glued to the running head, laid out as
 * «<Zahlwort> <n> LEKTION <k>» («acht 8 LEKTION 1»); the workbook pages use
 * «... ARBEITSBUCH» and the glossary pages a bare number or «Kursbuch <n>». So we
 * scan every line for the head/foot shapes and otherwise accept a bare number
 * standing alone on its line. The eight Zwischenspiel pages print none, so they
 * return no candidates.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const candidates = new Set<number>();
  for (const line of lines) {
    const withHead = line.match(/^.*?(\d{1,3})\s+(?:LEKTION|ARBEITSBUCH)\s*\d*\s*$/i);
    if (withHead) {
      candidates.add(Number(withHead[1]));
      continue;
    }
    const withBook = line.match(/^(?:Kursbuch|Arbeitsbuch)\s+(\d{1,3})$/i) ?? line.match(/^(\d{1,3})\s+(?:Kursbuch|Arbeitsbuch)$/i);
    if (withBook) {
      candidates.add(Number(withBook[1]));
      continue;
    }
    const alone = line.match(/^(\d{1,3})$/);
    if (alone) candidates.add(Number(alone[1]));
  }
  return [...candidates].sort((a, b) => a - b);
}

/**
 * The book number a content page prints at its foot, or null. Every content page
 * prints its own number, so a page that carries it returns itself; a mismatch
 * returns the largest candidate so the caller can see the difference.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * The eight Zwischenspiel pages — the full-bleed culture double pages that close
 * each Lektion. The OCR captured their content but neither their printed folio nor
 * the «LEKTION n» running head, so they are exempt from the page-number and
 * running-head checks and anchored on their own printed word/title instead.
 */
const ZWISCHENSPIEL_PAGES = new Set([16, 17, 26, 27, 36, 37, 46, 47]);

/** The printed word that marks a Zwischenspiel page. */
const ZWISCHENSPIEL_HEAD = "ZWISCHENSPIEL";

/** The section that owns a term page, or undefined. */
function sectionForPage(book: number): GermanG10T1Section | undefined {
  return EGYPT_GERMAN_G10_T1_SECTIONS.find((s) => book >= s.bookFrom && book <= s.bookTo);
}

/**
 * Table invariants: lesson keys match their position, every range sits inside its
 * section, sections tile the book with no gaps or overlaps, and the first section
 * starts where the Contents says. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_GERMAN_G10_T1_SECTIONS;

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
    if (nextSection && section.bookTo + 1 !== nextSection.bookFrom) {
      problems.push(`فجوة بين القسم ${section.key} (حتى ${section.bookTo}) والقسم ${nextSection.key} (من ${nextSection.bookFrom})`);
    }
  });

  const first = sections[0]!;
  const last = sections[sections.length - 1]!;
  if (first.bookFrom !== EGYPT_GERMAN_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من ${EGYPT_GERMAN_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last.bookTo !== EGYPT_GERMAN_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند ${EGYPT_GERMAN_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every page of the term carries real OCR text; every content page prints its
 *     own book number and its Lektion's running head («LEKTION n»), except the
 *     eight Zwischenspiel pages, which print neither and are anchored on their own
 *     printed word/title instead;
 *  2. every lesson's own first page prints that lesson's head;
 *  3. every lesson's title is printed somewhere in its page range;
 *  4. every printed page is owned by exactly one lesson — no page falls between
 *     two lessons and is unreachable;
 *  5. the pages tile the term [START, END] with no gap. `pagesChecked` counts every
 *     page of the term, so it equals `_BOOK_END - _BOOK_START + 1`.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const sections = EGYPT_GERMAN_G10_T1_SECTIONS;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  let footersChecked = 0;

  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_GERMAN_G10_T1_BOOK_START || book > EGYPT_GERMAN_G10_T1_BOOK_END) continue;
    printedPages.add(book);

    // 1a. every term page carries real OCR text.
    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }

    // The Zwischenspiel pages have no folio or running head in the OCR: anchor
    // them on their own printed word/title instead of weakening the checks.
    if (ZWISCHENSPIEL_PAGES.has(book)) {
      const zw = sectionForPage(book)?.lessons.at(-1);
      const anchor = zw ? normalize(zw.title).toLowerCase() : "";
      const text2 = normalize(text).toLowerCase();
      if (!text2.includes(normalize(ZWISCHENSPIEL_HEAD).toLowerCase()) && !(anchor && text2.includes(anchor))) {
        problems.push(`صفحة الزويتشنشبيل ${book}: لا تطبع «${ZWISCHENSPIEL_HEAD}» ولا عنوانها «${zw?.title ?? "?"}»`);
      }
      continue;
    }

    // 1b. every content page prints its own folio and its Lektion's running head.
    footersChecked += 1;
    const footer = printedFooter(book);
    if (footer === null) {
      problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع`);
    } else if (footer !== book) {
      problems.push(`صفحة الكتاب ${book}: رقمها المطبوع لا يطابقها (وجدنا ${footer})`);
    }

    const section = sectionForPage(book);
    if (!section) {
      problems.push(`صفحة الكتاب ${book}: لا تنتمي إلى أي قسم`);
    } else if (!normalize(text).includes(normalize(section.footerTitle))) {
      problems.push(`صفحة الكتاب ${book}: لا تحمل ترويسة القسم «${section.footerTitle}»`);
    }
  }

  // 2. every lesson's own first page prints that lesson's head.
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

  // 3. every lesson's title is printed somewhere in its page range.
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

  // 4. every content page is owned by exactly one lesson.
  const owners = new Map<number, string[]>();
  for (const range of allLessonRanges()) {
    for (let p = range.from; p <= range.to; p++) {
      const list = owners.get(p) ?? [];
      list.push(range.key);
      owners.set(p, list);
    }
  }
  for (let book = EGYPT_GERMAN_G10_T1_BOOK_START; book <= EGYPT_GERMAN_G10_T1_BOOK_END; book++) {
    const list = owners.get(book) ?? [];
    if (list.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: ${list.length === 0 ? "لا يملكها أي درس" : `يملكها أكثر من درس (${list.join("، ")})`}`);
    }
  }

  // 5. the pages tile the term exactly. pagesChecked counts every term page.
  const expected = EGYPT_GERMAN_G10_T1_BOOK_END - EGYPT_GERMAN_G10_T1_BOOK_START + 1;
  const printedPagesChecked = EGYPT_GERMAN_G10_T1_BOOK_END - EGYPT_GERMAN_G10_T1_BOOK_START + 1;
  if (printedPages.size !== expected) {
    problems.push(`عدد صفحات المحصود ${printedPages.size} بينما المتوقع ${expected} (${EGYPT_GERMAN_G10_T1_BOOK_START}–${EGYPT_GERMAN_G10_T1_BOOK_END})`);
  }

  void footersChecked;
  return { ok: problems.length === 0, problems, pagesChecked: printedPagesChecked };
}
