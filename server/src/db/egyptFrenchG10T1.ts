// Egypt Secondary-1 (Grade 10) French, first term — «Nouveau Champion 1 —
// Méthode de français, Première année secondaire, Première Langue (LV1), Livre
// de l'élève» (Aliette Ricoul, Nicole Grifi, Luc Tellier, Clé International –
// DENH, édition 2026-2027), the student's book.
//
// The first term IS the Ministry textbook: the four Unités of its printed
// «Tableau des contenus» (book pages 4–5) and the pages they occupy (book pages
// 8–157). This file is the book's table — one section per Unité, one lesson per
// printed component of the Unité (its four Leçons, its two-page «Point culture»,
// its one-page «Projet final» and its one-page «Grille d'évaluation») — plus a
// set of helpers so the seeder and the stage share the same page map. The
// self-checks at the bottom prove the mapping against the OCR itself, page by
// page.
//
// THE OFFSET IS ONE — book page = scan page − 1
// Every content page prints its own number as a bare folio (scan 009 prints «8»,
// scan 047 prints «46», scan 079 prints «78», scan 157 prints «156»), so the
// printed book page N is scan page N + 1 and `BOOK_TO_PDF_OFFSET = 1`. The
// Tableau des contenus itself carries no folio, so the offset is proven from the
// content pages, not from the contents.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–8 are the cover, the imprint/copyright (scan 2–3), the
// «Avant-propos» (scan 4), the printed «Tableau des contenus» (scan 5–6) and two
// blank leaves (scan 7–8). Scan pages 159–170 are the «DELF B1 – test blanc»
// (scan 159–163), the «Guide référentiel» (scan 163–168) and two blank cover
// leaves (scan 169–170). None of them is a Leçon. The term runs from the Unité 1
// opener (book page 8) to the Grille d'évaluation that closes Unité 4 (book page
// 157): `EGYPT_FRENCH_G10_T1_BOOK_START` / `_END` are exactly those two pages.
//
// THE UNITS ARE SEPARATED BY BLANK LEAVES
// Three printed double leaves are genuinely blank and sit between the units
// (book pages 44–45, 82–83 and 120–121; their OCR files are empty). They belong
// to no Leçon: the term's real content is the 144 pages left after them, and both
// `isConsistent` and `assertTreeMatchesTheBook` allow exactly that documented
// blank gap rather than treating it as an unowned page.
//
// THE BOOK PRINTS NO PER-UNIT RUNNING HEAD
// Unlike the German and Spanish books of this series, the French pages carry no
// unit running head — only the rubric headings («Je découvre», «Je comprends»,
// «Boîtes à outils», «J'applique», «Point de culture», «NOTRE PROJET FINAL»,
// «Grille d'évaluation») and the folio. `assertTreeMatchesTheBook` therefore does
// not check a running head; it pins each content page to the book by its own
// printed folio instead.
//
// EACH LEÇON'S CONCEPTS ARE ITS «Je serai capable de» OBJECTIVES
// Every Leçon opens on a double page whose right-hand page prints «À la fin de
// cette leçon, je serai capable de :» followed by the lesson's objective lines.
// Each lesson below carries those lines verbatim. The «Point culture»,
// «Projet final» and «Grille d'évaluation» lessons carry instead the lines the
// book prints for them (the Tableau des contenus' culture theme, the project's
// printed «Mission» line, the grid's criteria part names), always from the page
// the lesson is grounded in.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** One lesson of the book — becomes one lesson in the app tree. */
export interface FrenchG10T1Lesson {
  /** App-addressable key, e.g. "1-1" (Unité 1, lesson 1). */
  key: string;
  /** Full app-facing lesson title — the heading its own page prints. */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`): the Leçon title on a Leçon opener («Voyager
   * autrement, comment ?»), «Point de culture» on the culture spread, «NOTRE
   * PROJET FINAL» on the project page and «Grille d'évaluation» on the grid.
   */
  printedHead: string;
  /** First printed book page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed objectives/headings for this lesson, verbatim. */
  concepts: string[];
}

/** One printed section of the book — one of the four Unités. */
export interface FrenchG10T1Section {
  /** Internal key: "1"…"4". */
  key: string;
  kind: "unit";
  /** Section title as printed in the «Tableau des contenus». */
  title: string;
  /**
   * The section's title as the «Tableau des contenus» spells it. The pages never
   * repeat it (the book prints no unit running head), so it is recorded here but
   * never checked against a page.
   */
  footerTitle: string;
  /** First printed page of the section (the Unité's Leçon 1 opener). */
  bookFrom: number;
  /** Last printed page of the section (the Unité's Grille d'évaluation). */
  bookTo: number;
  lessons: FrenchG10T1Lesson[];
}

// ---------------------------------------------------------------------------
// THE OFFSET AND THE TERM'S BOUNDS
// ---------------------------------------------------------------------------

/** Scan page = book page + 1 (every content page prints its own number). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the term — the Unité 1, Leçon 1 opener. */
export const EGYPT_FRENCH_G10_T1_BOOK_START = 8;

/** Last printed page of the term — the Grille d'évaluation that closes Unité 4. */
export const EGYPT_FRENCH_G10_T1_BOOK_END = 157;

// ---------------------------------------------------------------------------
// THE FOUR UNITÉS
// ---------------------------------------------------------------------------

/**
 * The four Unités of the book, in order. Each Unité tiles its own page range
 * with no gap: four eight-page Leçons, the two-page «Point culture», the
 * one-page «Projet final» and the one-page «Grille d'évaluation». Every lesson
 * starts on the page that prints its head and the ranges tile the whole term,
 * leaving only the documented blank leaves between the units.
 */
export const EGYPT_FRENCH_G10_T1_SECTIONS: FrenchG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    title: "Voyager autrement",
    footerTitle: "Voyager autrement",
    bookFrom: 8,
    bookTo: 43,
    lessons: [
      {
        key: "1-1",
        title: "Voyager autrement, comment ?",
        printedHead: "Voyager autrement, comment ?",
        bookFrom: 8,
        concepts: [
          "comparer différents types de voyages (tourisme de masse, voyage immersif, voyage virtuel).",
          "comprendre les motivations et les sentiments de voyageurs dans un forum.",
          "utiliser le passé composé et l’imparfait pour raconter un souvenir",
          "créer un carnet de voyage numérique avec photos",
        ],
      },
      {
        key: "1-2",
        title: "Le tourisme : chance ou danger ?",
        printedHead: "Le tourisme : chance ou danger ?",
        bookFrom: 16,
        concepts: [
          "expliquer deux problèmes causés par le tourisme.",
          "exprimer la cause avec parce que et à cause de.",
          "exprimer la conséquence avec donc et alors.",
          "écrire un paragraphe explicatif sur les effets du tourisme.",
        ],
      },
      {
        key: "1-3",
        title: "Voyager sans détruire : est-ce possible ?",
        printedHead: "Voyager sans détruire : est-ce possible ?",
        bookFrom: 24,
        concepts: [
          "expliquer ce qu’est l’écotourisme.",
          "distinguer un comportement responsable d’un comportement irresponsable.",
          "exprimer l’obligation avec il faut, on doit et devoir.",
          "exprimer l’interdiction avec il ne faut pas et on ne doit pas.",
          "rédiger une liste de conseils pour voyager de manière responsable.",
        ],
      },
      {
        key: "1-4",
        title: "Le voyage de demain !",
        printedHead: "Le voyage de demain !",
        bookFrom: 32,
        concepts: [
          "imaginer des solutions innovantes pour réduire la pollution liée aux voyages.",
          "utiliser le futur simple pour parler des voyages de demain.",
          "exprimer le but avec pour et afin de.",
          "participer à la création du guide « Voyage écoresponsable ».",
        ],
      },
      {
        key: "1-5",
        title: "Point de culture",
        printedHead: "Point de culture",
        bookFrom: 40,
        concepts: [
          "Écrivains d’hier et d’aujourd’hui — Voyage et découverte du monde",
          "Découvrir Ibn Battouta et Sylvain Tesson, deux visions du voyage",
          "Comparer une vision historique et une vision contemporaine du voyage",
        ],
      },
      {
        key: "1-6",
        title: "Le Guide Voyage Éco-responsable 2050",
        printedHead: "NOTRE PROJET FINAL",
        bookFrom: 42,
        concepts: [
          "Informer, convaincre et imaginer le tourisme de demain",
          "1. Le stand",
          "2. La préparation",
          "3. Le forum",
        ],
      },
      {
        key: "1-7",
        title: "Grille d’évaluation",
        printedHead: "Grille d’évaluation",
        bookFrom: 43,
        concepts: [
          "1. Le dossier de presse",
          "2. Le pitch oral",
          "3. Créativité & équipe",
          "Et maintenant…",
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    title: "Sport et alimentation",
    footerTitle: "Sport et alimentation",
    bookFrom: 46,
    bookTo: 81,
    lessons: [
      {
        key: "2-1",
        title: "Pratiquer un sport",
        printedHead: "Pratiquer un sport",
        bookFrom: 46,
        concepts: [
          "présenter différents sports, leurs bienfaits et leurs contraintes.",
          "utiliser le superlatif pour classer des activités selon un critère.",
          "comparer des sports à l’aide du comparatif.",
          "rédiger une courte présentation d’un sport et justifier une recommandation.",
        ],
      },
      {
        key: "2-2",
        title: "Alimentation et santé",
        printedHead: "Alimentation et santé",
        bookFrom: 54,
        concepts: [
          "décrire et évaluer mes habitudes alimentaires.",
          "utiliser les articles partitifs, l’article indéfini pluriel et les quantificateurs.",
          "exprimer la quantité à la forme affirmative et à la forme négative.",
          "rédiger un texte sur mon alimentation et proposer des améliorations réalistes.",
        ],
      },
      {
        key: "2-3",
        title: "Sport et performance",
        printedHead: "Sport et performance",
        bookFrom: 62,
        concepts: [
          "expliquer comment l’alimentation, l’hydratation et la récupération accompagnent la pratique sportive.",
          "utiliser les pronoms compléments COD et COI pour éviter les répétitions.",
          "employer les pronoms en et y dans des situations courantes.",
          "rédiger un texte de conseils organisé autour des moments avant, pendant et après l’effort.",
        ],
      },
      {
        key: "2-4",
        title: "Équilibre de vie",
        printedHead: "Équilibre de vie",
        bookFrom: 70,
        concepts: [
          "décrire une routine équilibrée et l’adapter à des contraintes personnelles.",
          "formuler un but, un conseil ou une hypothèse pour parler du bien-être.",
          "utiliser deux pronoms compléments dans la même phrase et respecter leur ordre.",
          "présenter un programme personnel de bien-être réaliste et progressif.",
        ],
      },
      {
        key: "2-5",
        title: "Point de culture",
        printedHead: "Point de culture",
        bookFrom: 78,
        concepts: [
          "Écrivains d’hier et d’aujourd’hui — Corps, santé et mode de vie",
          "Découvrir Colette et Maylis de Kerangal, deux regards sur le corps",
          "Comparer une vision libre et sensorielle du corps et une vision médicalisée",
        ],
      },
      {
        key: "2-6",
        title: "Mon Programme Vie Saine – Défi 30 jours",
        printedHead: "NOTRE PROJET FINAL",
        bookFrom: 80,
        concepts: [
          "Conseiller, motiver et convaincre pour un mode de vie sain",
          "1. Le stand",
          "2. La préparation",
          "3. Le forum",
        ],
      },
      {
        key: "2-7",
        title: "Grille d’évaluation",
        printedHead: "Grille d’évaluation",
        bookFrom: 81,
        concepts: [
          "1. Le dossier coach",
          "2. Le pitch oral et le débat",
          "3. Le support visuel / la créativité",
          "Et maintenant…",
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    title: "Mode, identité et consommation",
    footerTitle: "Mode, identité et consommation",
    bookFrom: 84,
    bookTo: 119,
    lessons: [
      {
        key: "3-1",
        title: "Mode et image de soi",
        printedHead: "Mode et image de soi",
        bookFrom: 84,
        concepts: [
          "décrire un style vestimentaire, une tenue et une apparence avec précision.",
          "accorder les adjectifs et les placer correctement par rapport au nom.",
          "utiliser les pronoms possessifs pour éviter les répétitions.",
          "présenter mon style et expliquer ce qu’il peut exprimer de mes goûts ou de mon identité.",
        ],
      },
      {
        key: "3-2",
        title: "Consommation et argent",
        printedHead: "Consommation et argent",
        bookFrom: 92,
        concepts: [
          "parler d’un budget, de mes priorités et de mes habitudes d’achat.",
          "comprendre comment une publicité peut influencer une décision.",
          "utiliser les pronoms relatifs simples qui, que, où et dont pour relier des informations.",
          "rédiger une analyse de publicité ou présenter un budget personnel raisonné.",
        ],
      },
      {
        key: "3-3",
        title: "Consommer autrement",
        printedHead: "Consommer autrement",
        bookFrom: 100,
        concepts: [
          "expliquer les principes de la mode durable.",
          "présenter des alternatives à la fast fashion : seconde main, réparation, échange et surcyclage.",
          "exprimer l’opposition ou la concession avec mais, pourtant, cependant, en revanche et même si.",
          "rédiger un texte argumenté proposant des façons concrètes de consommer autrement.",
        ],
      },
      {
        key: "3-4",
        title: "Choisir son mode de vie",
        printedHead: "Choisir son mode de vie",
        bookFrom: 108,
        concepts: [
          "exprimer et nuancer mon opinion sur un mode de vie.",
          "rapporter au présent les paroles ou les idées d’une autre personne.",
          "défendre un mode de vie responsable, simple ou équilibré sans l’imposer aux autres.",
          "rédiger un texte argumenté qui présente mes valeurs et rapporte d’autres points de vue.",
        ],
      },
      {
        key: "3-5",
        title: "Point de culture",
        printedHead: "Point de culture",
        bookFrom: 116,
        concepts: [
          "Écrivains d’hier et d’aujourd’hui — Identité, consommation et mode de vie",
          "Découvrir Balzac et Annie Ernaux, deux regards sur l’argent et la consommation",
          "Comparer une société de l’apparence et une société de consommation",
        ],
      },
      {
        key: "3-6",
        title: "Campagne Consommer autrement",
        printedHead: "NOTRE PROJET FINAL",
        bookFrom: 118,
        concepts: [
          "Sensibiliser, argumenter et nuancer son opinion sur la consommation",
          "1. Le stand",
          "2. La préparation",
          "3. Le festival",
        ],
      },
      {
        key: "3-7",
        title: "Grille d’évaluation",
        printedHead: "Grille d’évaluation",
        bookFrom: 119,
        concepts: [
          "1. Le dossier de campagne",
          "2. Le pitch oral",
          "3. Créativité & équipe",
          "Et maintenant…",
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    title: "Art moderne, cinéma et théâtre",
    footerTitle: "Art moderne, cinéma et théâtre",
    bookFrom: 122,
    bookTo: 157,
    lessons: [
      {
        key: "4-1",
        title: "L’art moderne et contemporain",
        printedHead: "L’art moderne et contemporain",
        bookFrom: 122,
        concepts: [
          "distinguer l’art moderne de l’art contemporain à partir de quelques caractéristiques.",
          "présenter un mouvement, un artiste ou une œuvre de manière claire et structurée.",
          "utiliser correctement les pronoms relatifs qui, que, où et dont.",
          "rédiger une présentation personnelle et nuancée d’une œuvre ou d’un mouvement.",
        ],
      },
      {
        key: "4-2",
        title: "Le cinéma",
        printedHead: "Le cinéma",
        bookFrom: 130,
        concepts: [
          "repérer les principaux choix de mise en scène dans une scène ou une critique de film.",
          "employer avec précision le lexique du cinéma : plan, cadrage, montage, séquence, rythme…",
          "organiser une analyse à l’aide de connecteurs chronologiques et logiques.",
          "rédiger une analyse structurée et nuancée d’une scène ou d’un film.",
        ],
      },
      {
        key: "4-3",
        title: "Le théâtre",
        printedHead: "Le théâtre",
        bookFrom: 138,
        concepts: [
          "décrire les principaux éléments d’une mise en scène et le jeu d’un personnage.",
          "exprimer avec précision des émotions, des sensations et une réaction de spectateur.",
          "utiliser les verbes et expressions de perception : avoir l’air, sembler, paraître, se sentir, ressentir.",
          "rédiger une description vivante et structurée d’une scène ou d’un personnage.",
        ],
      },
      {
        key: "4-4",
        title: "Créer et diffuser son art",
        printedHead: "Créer et diffuser son art",
        bookFrom: 146,
        concepts: [
          "présenter les étapes d’un projet de création artistique et son public visé.",
          "utiliser les structures de projet : compter, avoir l’intention de, envisager de, se promettre de.",
          "exprimer le but avec pour, afin de et dans le but de.",
          "rédiger un projet de création et de diffusion réaliste, responsable et structuré.",
        ],
      },
      {
        key: "4-5",
        title: "Point de culture",
        printedHead: "Point de culture",
        bookFrom: 154,
        concepts: [
          "Écrivains d’hier et d’aujourd’hui — Théâtre et expression artistique",
          "Découvrir Molière et Yasmina Reza, deux regards sur le théâtre",
          "Comparer une comédie classique et un théâtre contemporain",
        ],
      },
      {
        key: "4-6",
        title: "Mini-exposition ou court-métrage : Art & Expression",
        printedHead: "NOTRE PROJET FINAL",
        bookFrom: 156,
        concepts: [
          "Décrire, interpréter et exprimer une intention artistique",
          "1. Le format",
          "2. La préparation",
          "3. Le salon",
        ],
      },
      {
        key: "4-7",
        title: "Grille d’évaluation",
        printedHead: "Grille d’évaluation",
        bookFrom: 157,
        concepts: [
          "1. Le dossier artistique",
          "2. Le débat oral",
          "3. L’interaction / la nuance",
          "Et maintenant…",
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
 * lesson — the Leçon 1 opener) or its own start page, up to the page before the
 * next lesson starts, or the section's last page for its last lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_FRENCH_G10_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const ranges: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_FRENCH_G10_T1_SECTIONS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      ranges.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return ranges;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. The Livre de
 * l'élève has no appendix bound into the term: every page of the term belongs to
 * exactly one Unité (the «DELF B1 – test blanc» and the «Guide référentiel» are
 * back matter after page 157 and are not part of this file). Kept as a function
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
  "french-g10-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The blank leaves
 * between the units are normalised to "" so the page map can never mistake a
 * blank for content.
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
 * Page-number candidates a content page prints. The book carries no running head,
 * only the bare folio, and the OCR puts it sometimes on the page's first line and
 * sometimes on its last, so the position cannot be relied on: every line is
 * scanned for a number standing alone on its own line. The activity numbers that
 * share a line with text never match this shape, and the few page-ornament digits
 * that do («2», «3», «4» on the project pages) are ignored because
 * `printedFooter` returns the page's own number whenever it is among them.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const candidates = new Set<number>();
  for (const line of lines) {
    const alone = line.match(/^(\d{1,3})$/);
    if (alone) candidates.add(Number(alone[1]));
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
 * The three printed double leaves that are genuinely blank and separate the
 * units (book pages 44–45, 82–83 and 120–121). They belong to no Leçon and are
 * the term's only unowned pages.
 */
const BLANK_PAGES = new Set([44, 45, 82, 83, 120, 121]);

/** Whether every book page strictly between two units is a documented blank leaf. */
function gapIsBlankOnly(afterBookTo: number, beforeBookFrom: number): boolean {
  for (let p = afterBookTo + 1; p < beforeBookFrom; p++) {
    if (!BLANK_PAGES.has(p)) return false;
  }
  return true;
}

/**
 * Table invariants: lesson keys match their position, every range sits inside its
 * section, sections tile the book with no gap other than the documented blank
 * leaves, and the first section starts where the Tableau des contenus says. A
 * content mistake here would quietly ground the tutor on the wrong pages, so it
 * fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_FRENCH_G10_T1_SECTIONS;

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
  if (first.bookFrom !== EGYPT_FRENCH_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من ${EGYPT_FRENCH_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last.bookTo !== EGYPT_FRENCH_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند ${EGYPT_FRENCH_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page is accounted for: the documented blank leaves carry no
 *     text and every other page carries real OCR text and its own printed folio;
 *  2. every lesson's own first page prints that lesson's head;
 *  3. every lesson's title is printed somewhere in its page range;
 *  4. every non-blank content page is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable — and the blank leaves are owned by
 *     none;
 *  5. the 144 real content pages tile the term [START, END] with nothing missing.
 *     `pagesChecked` counts exactly those 144 pages.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const sections = EGYPT_FRENCH_G10_T1_SECTIONS;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const contentPages = new Set<number>();

  // 1. every term page: the blank leaves are empty, the content pages carry text
  //    and their own folio.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_FRENCH_G10_T1_BOOK_START || book > EGYPT_FRENCH_G10_T1_BOOK_END) continue;

    const text = loadBookPage(book);
    if (BLANK_PAGES.has(book)) {
      if (text) problems.push(`الصفحة الفاصلة ${book}: يجب أن تكون بيضاء لكنها تحمل نصًا`);
      continue;
    }

    contentPages.add(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }

    const footer = printedFooter(book);
    if (footer === null) {
      problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع`);
    } else if (footer !== book) {
      problems.push(`صفحة الكتاب ${book}: رقمها المطبوع لا يطابقها (وجدنا ${footer})`);
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

  // 4. every non-blank content page is owned by exactly one lesson, and the
  //    blank leaves by none.
  const owners = new Map<number, string[]>();
  for (const range of allLessonRanges()) {
    for (let p = range.from; p <= range.to; p++) {
      const list = owners.get(p) ?? [];
      list.push(range.key);
      owners.set(p, list);
    }
  }
  for (let book = EGYPT_FRENCH_G10_T1_BOOK_START; book <= EGYPT_FRENCH_G10_T1_BOOK_END; book++) {
    const list = owners.get(book) ?? [];
    if (BLANK_PAGES.has(book)) {
      if (list.length !== 0) problems.push(`الصفحة الفاصلة ${book}: يجب ألا يملكها أي درس (وجدنا ${list.join("، ")})`);
      continue;
    }
    if (list.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: ${list.length === 0 ? "لا يملكها أي درس" : `يملكها أكثر من درس (${list.join("، ")})`}`);
    }
  }

  // 5. the real content tiles the term exactly. pagesChecked counts every
  //    non-blank term page.
  const termLength = EGYPT_FRENCH_G10_T1_BOOK_END - EGYPT_FRENCH_G10_T1_BOOK_START + 1;
  const pagesChecked = termLength - BLANK_PAGES.size;
  if (contentPages.size !== pagesChecked) {
    problems.push(`عدد صفحات المحتوى ${contentPages.size} بينما المتوقع ${pagesChecked} (${termLength} صفحة ناقص ${BLANK_PAGES.size} صفحات بيضاء)`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
