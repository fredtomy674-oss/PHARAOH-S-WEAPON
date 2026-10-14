// Egypt Secondary-1 (Grade 10) Spanish, first term — «¡VALE! Manual de
// español para la enseñanza secundaria egipcia. Volumen 1», coordinated by the
// Instituto Cervantes de El Cairo.
//
// The first term IS the Ministry textbook: the six Unidades of its printed
// «CONTENIDOS VOLUMEN 1» (book page 9) and the pages they occupy (book pages
// 10–80). This file is the book's table — one section per Unidad, and, inside
// each Unidad, one lesson per printed component: the unit opener that carries
// the title and its «Contenidos» (functional / lexical / grammatical), the
// «PARA PRACTICAR» exercise block, and the «PARA ESTUDIAR Y REPASAR» summary
// page — plus a set of helpers so the seeder and the stage share the same page
// map. The self-checks at the bottom prove the mapping against the OCR itself,
// page by page.
//
// THE OFFSET IS ZERO — book page = scan page
// Every content page prints its own number at its foot, glued either to the
// Spanish running head («¡HOLA! 11», «MI CLASE 25») or to the Arabic imprint of
// the print shop («مطابع دار الجيل للطباعة 23»), so a book page N is scan page N
// (`BOOK_TO_PDF_OFFSET = 0`). The Contents page itself prints «9», proving the
// offset before the term even begins.
//
// FRONT MATTER IS NOT THE TERM; THERE IS NO BACK MATTER IN THE SCAN
// Scan pages 1–9 are the cover (1), the imprint/copyright (2), the title+cover
// (3), two pages absent from the OCR (4–5), the prologue (6), the «PARA
// ENTENDER» classroom glossary (7), a blank page (8) and the printed
// «CONTENIDOS VOLUMEN 1» (9). The scan ends at book page 80, so the back matter
// (Unit 7 onward, the appendices and the glossary, all announced «Volumen 2»)
// is simply not part of this file. The term runs from the Unidad 1 opener
// (page 10) to the last page of Unidad 6's «PARA ESTUDIAR Y REPASAR» (page 80):
// `EGYPT_SPANISH_G10_T1_BOOK_START` / `_END` are exactly those two pages, and
// the tiling assertion proves nothing in between is left unreachable.
//
// THE RUNNING HEAD IS PER UNIDAD
// Every content page prints its unit's Spanish running head at its foot
// («¡HOLA!» … «MI FAMILIA»), so `assertTreeMatchesTheBook` checks the section's
// running head on every one of its content pages, which pins each page to its
// Unidad independently of the page range.
//
// A FEW OCR PAGES LACK THEIR FOLIO OR THEIR RUNNING HEAD
// On eight term pages the OCR did not capture the printed folio (10, 16, 18, 20,
// 22, 35, 43), or mis-read it (17 reads «19», 21 reads «1», 39 reads «31»); on
// eight pages it did not capture the running head (16, 27, 43, 51, 52, 53, 55,
// 65). Rather than weaken the checks, those pages are exempted and anchored on a
// printed string of their own page (see `FOLIO_EXEMPT` / `HEAD_EXEMPT`): the
// unit head, «¡A CONTAR!», «PARA PRACTICAR», «La clase de español», etc.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN WORDS
// The book prints no per-lesson objectives; its «Contenidos» are the unit
// opener's only outcome list, its exercise blocks only their instructions, and
// its summary pages only their grammar/vocabulary headings. Each lesson below
// carries those printed lines verbatim, so the source of every objective is the
// page the lesson is grounded in.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** One lesson of the book — becomes one lesson in the app tree. */
export interface SpanishG10T1Lesson {
  /** App-addressable key, e.g. "1-1" (Unidad 1, lesson 1). */
  key: string;
  /** Full app-facing lesson title — the heading its own page prints. */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`): the Unidad title on the opener, «PARA
   * PRACTICAR» on the exercise block, and «PARA ESTUDIAR Y REPASAR» on the
   * summary page.
   */
  printedHead: string;
  /** First printed book page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed outcome/instruction/heading lines for this lesson, verbatim. */
  concepts: string[];
}

/** One printed section of the book — one of the six Unidades. */
export interface SpanishG10T1Section {
  /** Internal key: "1"…"6". */
  key: string;
  kind: "unit";
  /** Section title as printed in the «CONTENIDOS VOLUMEN 1» (and on the opener). */
  title: string;
  /** The section's running head as its content pages print it. */
  footerTitle: string;
  /** First printed page of the section (the unit opener). */
  bookFrom: number;
  /** Last printed page of the section. */
  bookTo: number;
  lessons: SpanishG10T1Lesson[];
}

// ---------------------------------------------------------------------------
// THE OFFSET AND THE TERM'S BOUNDS
// ---------------------------------------------------------------------------

/** Book page = scan page (every content page prints its own number). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the term — the Unidad 1 opener. */
export const EGYPT_SPANISH_G10_T1_BOOK_START = 10;

/** Last printed page of the term — the end of Unidad 6's «PARA ESTUDIAR Y REPASAR». */
export const EGYPT_SPANISH_G10_T1_BOOK_END = 80;

// ---------------------------------------------------------------------------
// THE SIX UNIDADES
// ---------------------------------------------------------------------------

/**
 * The six Unidades of the book, in order. Each Unidad tiles its own page range
 * with no gap: the unit opener plus its activity body, the «PARA PRACTICAR»
 * exercise block, and the «PARA ESTUDIAR Y REPASAR» summary page. The opener
 * rides with the unit's first lesson; every lesson starts on the page that
 * prints its head and the ranges tile the whole term with no gap.
 *
 * The `title` of a Unidad is the name the Contents prints; the activity body has
 * no heading of its own, so it folds into the opener's lesson.
 */
export const EGYPT_SPANISH_G10_T1_SECTIONS: SpanishG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    title: "¡Hola!",
    footerTitle: "¡HOLA!",
    bookFrom: 10,
    bookTo: 22,
    lessons: [
      {
        key: "1-1",
        title: "¡Hola!",
        printedHead: "¡HOLA!",
        bookFrom: 10,
        concepts: [
          "Saludar y responder al saludo.",
          "Identificarse y presentar a alguien.",
          "Pedir y dar información sobre alguien.",
          "Lenguaje de aula.",
          "Origen y nacionalidad.",
          "Nombres propios y gentilicios.",
          "Numerales cardinales.",
          "Pronombre sujeto (tú y yo).",
          "Interrogativos dónde, cómo.",
          "Presente. Formas regulares.",
          "Verbos irregulares: ser.",
        ],
      },
      {
        key: "1-2",
        title: "Para practicar",
        printedHead: "PARA PRACTICAR",
        bookFrom: 19,
        concepts: [
          "1. Ordena las letras y encuentra la palabra.",
          "2. Escribe las vocales y completa las palabras.",
          "3. Separa las palabras y escribe las frases.",
          "4. a. Ordena las palabras de las frases siguientes.",
          "4. b. Responde a las preguntas del ejercicio anterior.",
          "5. Ahora tú. Completa la información de las frases siguientes.",
          "6. Completa las frases.",
          "7. Completa la tabla como en el ejemplo.",
          "8. Completa con R o RR. El profesor lee y te ayuda.",
          "9. Escribe el saludo para cada hora.",
          "10. Busca las palabras en la Unidad.",
        ],
      },
      {
        key: "1-3",
        title: "Para estudiar y repasar",
        printedHead: "PARA ESTUDIAR Y REPASAR",
        bookFrom: 21,
        concepts: ["LETRAS", "VERBOS", "LLAMARSE", "TENER", "SER", "VIVIR"],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    title: "Mi clase",
    footerTitle: "MI CLASE",
    bookFrom: 23,
    bookTo: 34,
    lessons: [
      {
        key: "2-1",
        title: "Mi clase",
        printedHead: "MI CLASE",
        bookFrom: 23,
        concepts: [
          "Expresar existencia.",
          "Saludar y responder al saludo: Despedidas.",
          "Dar y pedir información sobre cosas y cantidades.",
          "Objetos de la clase.",
          "Palabras de la clase.",
          "El género y el número de los sustantivos.",
          "El alfabeto (2).",
          "El presente: singular de los verbos regulares.",
        ],
      },
      {
        key: "2-2",
        title: "Para practicar",
        printedHead: "PARA PRACTICAR",
        bookFrom: 32,
        concepts: [
          "1. Es el primer día de clase. Responde a las preguntas de tu nuevo compañero.",
          "2. ¿Recuerdas las figuras y los colores de los verbos en español? Completa el siguiente texto con las formas correspondientes.",
          "4. Completa las frases con un, una, unos, unas.",
          "5. a. Completa con el o la.",
          "5. b. Ahora escribe el plural de las palabras del ejercicio anterior.",
          "6. Lee los números y después escribe el número contrario, como en el ejemplo.",
          "7. Completa estas palabras con g, j o gu.",
          "8. Completa los trabalenguas con z, c o qu.",
        ],
      },
      {
        key: "2-3",
        title: "Para estudiar y repasar",
        printedHead: "PARA ESTUDIAR Y REPASAR",
        bookFrom: 34,
        concepts: [
          "PALABRAS DE LA CLASE",
          "DESPEDIRSE",
          "EXPRESAR EXISTENCIA",
          "VERBOS REGULARES EN SINGULAR",
          "EL PLURAL DE LOS NOMBRES",
          "PRONUNCIACIÓN",
          "LOS NÚMEROS",
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    title: "Mis compañeros",
    footerTitle: "MIS COMPAÑEROS",
    bookFrom: 35,
    bookTo: 44,
    lessons: [
      {
        key: "3-1",
        title: "Mis compañeros",
        printedHead: "MIS COMPAÑEROS",
        bookFrom: 35,
        concepts: [
          "Describir el físico y el carácter.",
          "Adjetivos de descripción física y de carácter.",
          "La ropa.",
          "Los colores.",
          "El género y el número de los adjetivos.",
          "Verbos: ser, tener y llevar.",
          "Los demostrativos.",
        ],
      },
      {
        key: "3-2",
        title: "Para practicar",
        printedHead: "PARA PRACTICAR",
        bookFrom: 42,
        concepts: [
          "1. a. Estas son las siluetas de dos chicos de la escuela.",
          "1. b. ¿Cómo es el chico y qué lleva?",
          "1. c. ¿Cómo es la chica y qué lleva?",
          "2. Said habla de sus amigos y profesores. Completa las frases.",
          "3. Completa estas descripciones.",
          "5. a. Clasifica estos adjetivos de carácter en positivos y negativos.",
          "5. b. ¿Qué cualidades son importantes para ti en un amigo?",
        ],
      },
      {
        key: "3-3",
        title: "Para estudiar y repasar",
        printedHead: "PARA ESTUDIAR Y REPASAR",
        bookFrom: 44,
        concepts: [
          "Los verbos que utilizamos para las descripciones son: SER, TENER y LLEVAR.",
          "Género y número de los adjetivos.",
          "Los demostrativos.",
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    title: "Mi escuela",
    footerTitle: "MI ESCUELA",
    bookFrom: 45,
    bookTo: 58,
    lessons: [
      {
        key: "4-1",
        title: "Mi escuela",
        printedHead: "MI ESCUELA",
        bookFrom: 45,
        concepts: [
          "Describir edificios.",
          "Expresar gustos e intereses.",
          "Decir y preguntar la hora.",
          "Pedir y dar información: causa.",
          "Las partes de la escuela.",
          "Asignaturas.",
          "Verbos gustar y preferir.",
          "Números ordinales.",
          "Frases coordinadas.",
        ],
      },
      {
        key: "4-2",
        title: "Para practicar",
        printedHead: "PARA PRACTICAR",
        bookFrom: 56,
        concepts: [
          "1. a. Escribe las vocales en las palabras y después las buscas en la sopa de letras.",
          "1. b. Ahora las escribes en la tabla. Escribe también otras palabras de la lección.",
          "2. ¿Es o está? Tarek habla de su escuela. Busca los errores y corrige.",
          "3. Completa las frases con es, tiene o está.",
          "4. Forma frases con los elementos de las tres columnas.",
          "5. ¿Gusta o gustan?",
          "6. Ordena estas palabras para formar frases.",
          "7. Completa estos diálogos con a la / a las o con la / las.",
          "8. ¿Qué es más importante para aprender español? Elige y explica por qué.",
        ],
      },
      {
        key: "4-3",
        title: "Para estudiar y repasar",
        printedHead: "PARA ESTUDIAR Y REPASAR",
        bookFrom: 58,
        concepts: [
          "PARA EXPRESAR GUSTOS E INTERESES",
          "PARA UNIR FRASES",
          "PARA EXPRESAR CAUSA",
          "PARA DECIR LA HORA",
          "NÚMEROS ORDINALES",
        ],
      },
    ],
  },
  {
    key: "5",
    kind: "unit",
    title: "El recreo",
    footerTitle: "EL RECREO",
    bookFrom: 59,
    bookTo: 71,
    lessons: [
      {
        key: "5-1",
        title: "El recreo",
        printedHead: "EL RECREO",
        bookFrom: 59,
        concepts: [
          "Expresar hábitos.",
          "Expresar frecuencia.",
          "Ocio, deportes y actividades de tiempo libre.",
          "Expresiones coloquiales juveniles.",
          "Verbos regulares e irregulares en presente.",
          "Adverbios de frecuencia.",
        ],
      },
      {
        key: "5-2",
        title: "Para practicar",
        printedHead: "PARA PRACTICAR",
        bookFrom: 69,
        concepts: [
          "1. Ordena y escribe las frases.",
          "2. Une las columnas con las preposiciones adecuadas.",
          "3. Vuelve a escribir las frases añadiendo la palabra nunca.",
          "4. Escribe correctamente las preguntas y después contéstalas con las expresiones de frecuencia.",
          "5. ¿Te gustan / no te gustan? ¿Por qué?",
          "6. Coloca cada verbo en la columna correspondiente.",
          "7. Escribe sobre la vida normal de un amigo o familiar.",
          "8. Busca en la lección.",
        ],
      },
      {
        key: "5-3",
        title: "Para estudiar y repasar",
        printedHead: "PARA ESTUDIAR Y REPASAR",
        bookFrom: 71,
        concepts: [
          "PARA EXPRESAR HÁBITOS: Presente de Indicativo",
          "VERBOS REGULARES",
          "VERBOS IRREGULARES",
          "PARA EXPRESAR FRECUENCIA",
        ],
      },
    ],
  },
  {
    key: "6",
    kind: "unit",
    title: "Mi familia",
    footerTitle: "MI FAMILIA",
    bookFrom: 72,
    bookTo: 80,
    lessons: [
      {
        key: "6-1",
        title: "Mi familia",
        printedHead: "MI FAMILIA",
        bookFrom: 72,
        concepts: [
          "Dar y pedir información sobre personas.",
          "Relaciones familiares.",
          "Estado civil.",
          "Profesiones.",
          "Género de los sustantivos.",
          "Los posesivos.",
          "Verbos reflexivos.",
        ],
      },
      {
        key: "6-2",
        title: "Para practicar",
        printedHead: "PARA PRACTICAR",
        bookFrom: 78,
        concepts: [
          "1. Relaciona una palabra de cada columna.",
          "2. a. Lee este correo electrónico. Ali describe a su familia.",
          "2. b. Dibuja el árbol de familia de Ali.",
          "2. c. Ahora completa la siguiente tabla.",
          "3. Ahmed estudia español y no conoce los posesivos. ¿Puedes ayudarle?",
          "4. Escribe los verbos de la lista en el texto. Fíjate en la persona.",
          "5. Completa con la forma correcta del verbo estar. Añade también las letras que faltan.",
          "6. ¿Puedes escribir sobre tu familia (descripción física, edad, estado civil, profesión y lugar de trabajo)?",
          "7. a. Lee las siguientes frases. ¿Sabes quién es?",
          "7. b. Ahora escribe sobre tu cantante favorito.",
        ],
      },
      {
        key: "6-3",
        title: "Para estudiar y repasar",
        printedHead: "PARA ESTUDIAR Y REPASAR",
        bookFrom: 80,
        concepts: [
          "LOS ADJETIVOS POSESIVOS",
          "LOS VERBOS, Reflexivos y No Reflexivos",
          "EXPRESAR ESTADO CIVIL",
          "VOCABULARIO",
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
 * lesson — the unit opener) or its own start page, up to the page before the next
 * lesson starts, or the section's last page for its last lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_SPANISH_G10_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const ranges: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SPANISH_G10_T1_SECTIONS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      ranges.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return ranges;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This printed
 * volume's first term has no appendix: every page of the textbook belongs to a
 * Unidad. The appendices and the glossary the book announces are in «Volumen 2»
 * and are not part of this scan. Kept as a function so the seeder and the stage
 * share one shape across all the books.
 */
export function allLessonExtras(): Map<string, number[]> {
  return new Map<string, number[]>();
}

// ---------------------------------------------------------------------------
// OCR loading
// ---------------------------------------------------------------------------

const OCR_DIR = path.join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "curriculum-ocr", "spanish-g10-t1");

/** The blank-page marker the OCR emits for a page it found empty. */
const NO_TEXT = /لا يوجد نص/;

/**
 * The OCR text of a printed book page, or "" when the scan has no such page or
 * the page is the book's one blank page. The offset is zero, but the helper keeps
 * the mapping in one place.
 */
export function loadBookPage(book: number): string {
  const file = path.join(OCR_DIR, `pages-${String(book + BOOK_TO_PDF_OFFSET).padStart(3, "0")}.txt`);
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
  return text.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
}

/** Whether `page` prints `needle`, ignoring OCR spacing and case. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * How many trailing non-empty lines are scanned for a folio. The folio sits at
 * the foot, glued either to the Spanish running head or to the Arabic imprint,
 * so a small tail window is enough and avoids the numbers inside the exercises.
 */
const FOLIO_TAIL_LINES = 6;

/**
 * Page-number candidates a content page prints at its foot. The folio is either
 * a bare number standing alone («11») or glued, at the start of a line
 * («11 ¡HOLA!») or at its end («مطابع دار الجيل للطباعة 23»). Only the last
 * `FOLIO_TAIL_LINES` lines are scanned so that numbers inside the exercises do
 * not masquerade as a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(-FOLIO_TAIL_LINES);
  const candidates = new Set<number>();
  for (const line of lines) {
    const alone = line.match(/^(\d{1,3})$/);
    if (alone) {
      candidates.add(Number(alone[1]));
      continue;
    }
    const gluedStart = line.match(/^(\d{1,3})\s+\p{L}/u);
    if (gluedStart) {
      candidates.add(Number(gluedStart[1]));
      continue;
    }
    const gluedEnd = line.match(/\p{L}[^\p{L}\p{N}]*(\d{1,3})\s*$/u);
    if (gluedEnd) candidates.add(Number(gluedEnd[1]));
  }
  return [...candidates].sort((a, b) => a - b);
}

/**
 * The book number a content page prints, or null. Every content page prints its
 * own number, so a page that carries it returns itself; a mismatch returns the
 * largest candidate so the caller can see the difference.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * Pages whose printed folio the OCR did not capture, or mis-read, mapped to a
 * string that page definitely prints. The folio check is skipped for them and
 * the anchor is checked instead.
 */
const FOLIO_EXEMPT: Record<number, string> = {
  10: "¡ HOLA !",
  16: "¡ A CONTAR!",
  17: "¡HOLA!",
  18: "¡HOLA!",
  20: "¡ HOLA !",
  21: "¡HOLA!",
  22: "¡HOLA!",
  35: "MIS COMPAÑEROS",
  39: "MIS COMPAÑEROS",
  43: "PARA PRACTICAR",
};

/**
 * Pages whose unit running head the OCR did not capture. They are exempt from the
 * running-head check and anchored on a title printed elsewhere on their own page.
 */
const HEAD_EXEMPT: Record<number, string> = {
  16: "¡ A CONTAR!",
  27: "Pregunta a tu compañero",
  43: "PARA PRACTICAR",
  51: "La clase de español",
  52: "Lee el siguiente diálogo",
  53: "¡RECUERDA!",
  55: "Escucha la conversación entre Said y Nura",
  65: "completa con tu compañero este cuadro",
};

/** The section that owns a term page, or undefined. */
function sectionForPage(book: number): SpanishG10T1Section | undefined {
  return EGYPT_SPANISH_G10_T1_SECTIONS.find((s) => book >= s.bookFrom && book <= s.bookTo);
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its section, sections tile the book with no gaps or overlaps, and the first
 * section starts where the Contents says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_SPANISH_G10_T1_SECTIONS;

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
  if (first.bookFrom !== EGYPT_SPANISH_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من ${EGYPT_SPANISH_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last.bookTo !== EGYPT_SPANISH_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند ${EGYPT_SPANISH_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every page of the term carries real OCR text; every content page prints its
 *     own book number and its Unidad's running head — except the few pages whose
 *     folio or head the OCR missed, which are anchored on a printed string of
 *     their own page instead (see `FOLIO_EXEMPT` / `HEAD_EXEMPT`);
 *  2. every lesson's own first page prints that lesson's head;
 *  3. every lesson's title is printed somewhere in its page range;
 *  4. every printed page is owned by exactly one lesson — no page falls between
 *     two lessons and is unreachable;
 *  5. the pages tile the term [START, END] with no gap. `pagesChecked` counts
 *     every page of the term, so it equals `_BOOK_END - _BOOK_START + 1`.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const sections = EGYPT_SPANISH_G10_T1_SECTIONS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text, its own folio and its Unidad's head.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SPANISH_G10_T1_BOOK_START || book > EGYPT_SPANISH_G10_T1_BOOK_END) continue;
    printedPages.add(book);
    pagesChecked += 1;

    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }

    // 1a. the folio — or, on the OCR-missed pages, their printed anchor.
    const folioAnchor = FOLIO_EXEMPT[book];
    if (folioAnchor !== undefined) {
      if (!normalize(text).includes(normalize(folioAnchor))) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع ولا تطبع مرساها «${folioAnchor}»`);
      }
    } else {
      const footer = printedFooter(book);
      if (footer === null) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع`);
      } else if (footer !== book) {
        problems.push(`صفحة الكتاب ${book}: رقمها المطبوع لا يطابقها (وجدنا ${footer})`);
      }
    }

    // 1b. the Unidad running head — or, on the OCR-missed pages, their anchor.
    const headAnchor = HEAD_EXEMPT[book];
    const section = sectionForPage(book);
    if (headAnchor !== undefined) {
      if (!normalize(text).includes(normalize(headAnchor))) {
        problems.push(`صفحة الكتاب ${book}: لا تحمل ترويسة القسم ولا تطبع مرساها «${headAnchor}»`);
      }
    } else if (!section) {
      problems.push(`صفحة الكتاب ${book}: لا تنتمي إلى أي قسم`);
    } else if (!normalize(text).includes(normalize(section.footerTitle))) {
      problems.push(`صفحة الكتاب ${book}: لا تحمل ترويسة القسم «${section.footerTitle}»`);
    }
  }

  // 2. every lesson's own first page prints that lesson's head.
  for (const section of sections) {
    for (const lesson of section.lessons) {
      if (!pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`الدرس ${lesson.key}: صفحة ${lesson.bookFrom} لا تطبع عنوانه «${lesson.printedHead}»`);
      }
    }
  }

  // 3. every lesson's title is printed somewhere in its page range.
  for (const [sectionIndex, section] of sections.entries()) {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(sectionIndex, li);
      let printed = false;
      for (let p = from; p <= to && !printed; p++) printed = pagePrints(p, lesson.title);
      if (!printed) {
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
  for (let book = EGYPT_SPANISH_G10_T1_BOOK_START; book <= EGYPT_SPANISH_G10_T1_BOOK_END; book++) {
    const list = owners.get(book) ?? [];
    if (list.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${list.length} دروس (${list.join(", ") || "لا أحد"})`);
    }
  }

  // 5. the pages tile the term [START, END] with no gap.
  const expected = EGYPT_SPANISH_G10_T1_BOOK_END - EGYPT_SPANISH_G10_T1_BOOK_START + 1;
  if (printedPages.size !== expected) {
    problems.push(`عدد صفحات المحصود ${printedPages.size} بينما المتوقع ${expected} (${EGYPT_SPANISH_G10_T1_BOOK_START}–${EGYPT_SPANISH_G10_T1_BOOK_END})`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
