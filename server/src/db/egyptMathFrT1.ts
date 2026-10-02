// PHASE 67 — official Egypt Grade-6 Mathematics, first term, **French-medium**
// edition («كتاب الوزارة»).
//
// The curriculum tree for the Egypt `eg-g6-math-fr` curriculum is rebuilt from
// the Ministry textbook `Math_Primary6_T1_FR.pdf` («Maths 1er Terme», 2026/2027
// MoE edition). This is the French-language edition of the same book as
// `egyptT1.ts` (Arabic medium) and `egyptMathEnT1.ts` (English medium): it prints
// the same seven units, the same concepts and the same page numbers, so the tree
// mirrors them unit-by-unit while taking its titles and its OCR transcript from
// the French scan.
//
// LAYERS: THE BOOK PRINTS THREE, THE APP MODELS TWO
// The maths book's printed index is unit → concept → lesson. The app's schema is
// country/system/grade/subject/curriculum/term/unit/lesson (there is no concept
// table), so — exactly as the Arabic (`eg-g6-math`) and English (`eg-g6-math-en`)
// maths curricula already do — the app lesson is the printed **concept**, and the
// concept's printed lessons live inside its document. Each concept's app
// `concepts` list is the printed «Objectif(s) d'apprentissage» bullets of its
// lessons, verbatim.
//
// Page mapping (verified against the scan's footers):
//   pdfPage = bookPage + 8   (book page 1 = PDF page 9)
// The unit opener pages (the «Unit Opener»/Video/Key Vocabulary spread) precede
// each unit's first concept: PDFs 8, 22, 42, 66, 76, 88, 106, i.e. book pages 0,
// 14, 34, 58, 68, 80, 98. Unit 1's opener is unnumbered, so its book page is 0.
// The French edition is two PDF pages shorter than the English one (the front
// matter differs), which is why its offset is 8 rather than 9.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.1 = PDF p.9). */
export const BOOK_TO_PDF_OFFSET = 8;

/** First page of the term — the (unnumbered) opener of unit 1. */
export const EGYPT_MATH_FR_T1_BOOK_START = 0;

/**
 * Last numbered content page (the final page of unit 7's concept 7.1, whose foot
 * is «111»). The back matter follows on PDF 120.
 */
export const EGYPT_MATH_FR_T1_BOOK_END = 111;

/** One concept (المفهوم) of the textbook — becomes one lesson in the app tree. */
export interface MathFrT1Concept {
  /** Printed concept label, e.g. "1.1". */
  key: string;
  /** Concept title as printed, French then its Arabic counterpart. */
  title: string;
  /** Book pages where the concept's lessons start (printed lesson numbers). */
  lessonStarts: number[];
  /** The lessons' printed «Objectif(s) d'apprentissage» bullets, verbatim. */
  concepts: string[];
}

export interface MathFrT1Unit {
  /** Unit title as printed, French then its Arabic counterpart. */
  title: string;
  concepts: MathFrT1Concept[];
}

/**
 * The seven units of the first term, straight from the book's printed Table of
 * Contents (PDF 4–5), with every concept's page starts and each lesson's printed
 * learning objectives read from the lesson pages themselves.
 */
export const EGYPT_MATH_FR_T1_UNITS: MathFrT1Unit[] = [
  {
    title: "Unité 1 : La divisibilité, les facteurs et les multiples — الوحدة الأولى: قابلية القسمة والعوامل والمضاعفات",
    concepts: [
      {
        key: "1.1",
        title:
          "Algorithme de division, P.G.C.D et P.P.C.M — خوارزمية القسمة والعامل المشترك الأكبر والمضاعف المشترك الأصغر",
        lessonStarts: [1, 3, 5, 8],
        concepts: [
          "Je peux déduire la divisibilité par 4; 3; 2; 6; 5 et 10.",
          "Je peux utiliser factorisation un nombre en ses facteurs premiers pour trouver P.G.C.D et P.P.C.M",
          "Je peux écrire et analyser des expressions impliquants le P.G.C.D",
          "Je peux visualiser comment une expression qui représente deux nombres entiers comme multiple d'une somme de deux nombres entiers peut représenter une situation du monde réel.",
          "Je peux analyser et évaluer l'addition et la soustraction de fractions.",
          "Je peux utiliser le plus petit commun multiple pour créer un dénominateur commun..",
        ],
      },
    ],
  },
  {
    title: "Unité 2 : Les nombres rationnels — الوحدة الثانية: الأعداد النسبية",
    concepts: [
      {
        key: "2.1",
        title: "Explorer la droite numérique — استكشاف خط الأعداد",
        lessonStarts: [15, 19],
        concepts: [
          // Book p.15 prints this objective twice in its target box (a layout
          // overlay duplicates the same text element); only the distinct bullets
          // are kept, so the tutor is not handed a repeated concept.
          "Je peux reconnaître la droite numérique inclure des nombres négatifs afin de les utiliser pour modéliser des situations du monde réel.",
          "Je peux discuter des positions relatives en traçant des points qui représentent des nombres positifs et négatifs sur une droite numérique.",
          "Je peux utiliser l'interactivité pour découvrir l'opposé de chiffres.",
        ],
      },
      {
        key: "2.2",
        title: "Enquêter sur les nombres rationnels — استكشاف الأعداد النسبية",
        lessonStarts: [23, 26],
        concepts: [
          "Je peux utiliser le visuel d'un diagramme de Venn pour aider les élèves à conceptualiser le système numérique.",
          "Je peux étudier la symétrie de la droite numérique et l'utilisation des opposés dans un contexte réel de tir à la corde",
          "Je peux m'entraîner à représenter des situations du monde réel sous forme de nombres rationnels, puis classer les valeurs de la plus petite à la plus grande.",
        ],
      },
      {
        key: "2.3",
        title: "Interpréter et utiliser la valeur absolue — تفسير القيمة المطلقة واستخدامها",
        lessonStarts: [28, 31],
        concepts: [
          "Je peux représenter la distance dans des situations réelles impliquant des sauts de poissons et des rencontres entre amis dans un étang à poissons.",
          "Je peux comprendre la valeur absolue sur une droite numérique..",
          "Je peux comparer des valeurs absolues à l'aide de symboles.",
          "Je peux interpréter l'utilisation de la valeur absolue à travers des situations réelles impliquant l'argent et la température..",
        ],
      },
    ],
  },
  {
    title: "Unité 3 : Les expressions algébriques — الوحدة الثالثة: المقادير الجبرية",
    concepts: [
      {
        key: "3.1",
        title: "Utiliser et analyser des expressions — استخدام التعبيرات الرياضية وتحليلها",
        lessonStarts: [35, 39, 43],
        concepts: [
          "Je peux utiliser un variable pour un domaine mathématique expression pour communiquer plusieurs données.",
          "Je peux définir les éléments des expressions algébriques tel que le terme, termes semblables, constantes, et coefficients",
          "Je peux définir les éléments d'expressions algébriques tels que les termes, les constantes et les coefficients.",
          "Je peux utiliser une droite numérique grandeur nature pour mimer des expressions numériques et algébriques.",
          "Je peux écrire des expressions verbales qui représentent des expressions numériques et des expressions algébriques qui représentent des scénarios du monde réel..",
        ],
      },
      {
        key: "3.2",
        title: "Expressions algébriques et exposants — المقادير الجبرية والأسس",
        lessonStarts: [47, 50, 52, 55],
        concepts: [
          "Je peux revoir l'ordre de base des opérations.",
          "Je peux simplifier des expressions numériques contenant des exposants.",
          "Je peux utiliser la substitution pour évaluer des expressions algébriques liées à des situations du monde réel..",
          "Je peux évaluer des expressions impliquant des exposants et des parenthèses.",
          "Je peux explorer si deux expressions sont équivalentes en utilisant une balance comme modèle concret.",
        ],
      },
    ],
  },
  {
    title: "Unité 4 : Équations et inégalités — الوحدة الرابعة: المعادلات والمتباينات",
    concepts: [
      {
        key: "4.1",
        title: "Écrire et résoudre des équations et des inégalités — كتابة المعادلات والمتباينات وحلّها",
        lessonStarts: [59, 61, 64],
        concepts: [
          "Je peux utiliser une balance de casserole pour modéliser et résoudre des équations algébriques",
          "Je peux explorer les signes qui indiquent une restriction comme une limite de vitesse, une réduction de vente, une limite de poids ou une limite de capacité.",
          "Je peux analyser ces scénarios et déterminer en quoi ils diffèrent des scénarios d'équations",
          "Je peux utiliser une droite numérique pour représenter inégalités.",
        ],
      },
    ],
  },
  {
    title: "Unité 5 : Variables indépendantes et dépendantes — الوحدة الخامسة: المتغيرات التابعة والمستقلة",
    concepts: [
      {
        key: "5.1",
        title: "Explorer la relation entre deux variables — استكشاف العلاقة بين متغيرين",
        lessonStarts: [69, 72, 74, 76],
        concepts: [
          "Je peux explorer et appliquer les définitions formelles des variables indépendantes et variables dépendantes.",
          "Je peux examiner et créer des équations algébriques pour modéliser des situations réelles.",
          "Je peux découvrir comment utiliser les variables indépendantes et dépendantes lors de l'écriture d'équations.",
          "Je peux connecter des représentations de variables dépendantes et indépendantes dans des tableaux, des équations et des graphiques.",
          "Je peux représenter des variables dépendantes et indépendantes sur un plan de coordonnées.",
        ],
      },
    ],
  },
  {
    title: "Unité 6 : Distribution des données — الوحدة السادسة: توزيع البيانات",
    concepts: [
      {
        key: "6.1",
        title:
          "Applications sur la collecte et la représentation de données — جمع البيانات وتمثيلها وتطبيقات عليها",
        lessonStarts: [81, 85, 88, 90, 94],
        concepts: [
          "Je peux explorer des questions et des données statistiques.",
          "Je peux comparer et opposer des questions statistiques et non statistiques.",
          "Je peux explorer et découvrir les caractéristiques de Histogrammes.",
          "Je peux créer un histogramme pour un ensemble de données.",
          "Je peux collecter des données à l'aide de cubes numériques et créer un histogramme pour ces données",
          "Je peux calculer la médiane par résumé des 5 points d'un ensemble de données et décrire comment ces valeurs sont Représentées sur une boite à moustaches.",
          "Je peux analyser les représentations des données pour déterminer lequel est le plus approprié à répondre aux questions de statistique.",
        ],
      },
    ],
  },
  {
    title: "Unité 7 : Mesures de tendance centrale et de propagation — الوحدة السابعة: مقاييس النزعة المركزية والانتشار",
    concepts: [
      {
        key: "7.1",
        title:
          "Explorer les mesures de la tendance centrale et de la propagation — استكشاف مقاييس النزعة المركزية والانتشار",
        lessonStarts: [99, 102, 105, 109],
        concepts: [
          "Je peux résumer les données d'un ensemble de données en utilisant un seul nombre.",
          "Je peux explorer la moyenne arithmétique comme part égale.",
          "Je peux déterminer un algorithme pour calculer la moyenne d'un ensemble de données.",
          "Je peux déterminer comment les valeurs aberrantes et la forme d'un graphique peuvent aider à déterminer si la moyenne arithmétique ou médiane est une meilleure mesure de la tendance centrale.",
          "Je peux définir et calculer l'étendue d'ensembles de données comme introduction à l'importance de mesures de variabilité.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/** The unit's opener page sits one page before its first concept's first lesson. */
export function unitOpenerBookPage(unitIndex: number): number {
  return EGYPT_MATH_FR_T1_UNITS[unitIndex]!.concepts[0]!.lessonStarts[0]! - 1;
}

/**
 * Book-page span of one concept: from its unit's opener (first concept) or its
 * first lesson, up to just before the next lesson/unit boundary — the next
 * unit's opener page belongs to that unit, not to the previous concept.
 */
export function conceptBookRange(unitIndex: number, conceptIndex: number): { from: number; to: number } {
  const unit = EGYPT_MATH_FR_T1_UNITS[unitIndex]!;
  const concept = unit.concepts[conceptIndex]!;
  const from = conceptIndex === 0 ? unitOpenerBookPage(unitIndex) : concept.lessonStarts[0]!;
  let to: number;
  if (conceptIndex + 1 < unit.concepts.length) {
    to = unit.concepts[conceptIndex + 1]!.lessonStarts[0]! - 1;
  } else if (unitIndex + 1 < EGYPT_MATH_FR_T1_UNITS.length) {
    to = unitOpenerBookPage(unitIndex + 1) - 1;
  } else {
    to = EGYPT_MATH_FR_T1_BOOK_END;
  }
  return { from, to };
}

/** Every concept's derived range, flattened — used by the tests and the audit. */
export function allConceptRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_FR_T1_UNITS.forEach((unit, ui) => {
    unit.concepts.forEach((concept, ci) => {
      const { from, to } = conceptBookRange(ui, ci);
      out.push({ key: concept.key, title: concept.title, from, to });
    });
  });
  return out;
}

// ---------------------------------------------------------------------------
// OCR text loading
// ---------------------------------------------------------------------------

const OCR_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "curriculum-ocr",
  "math-fr-t1",
);

const pad = (n: number) => String(n).padStart(3, "0");

function readTextFile(file: string): string {
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

/**
 * Pages that are full-page pictures with no machine-readable text. Verified two
 * ways: the PDF has no real text layer on book 13 (Node pdf.js returns only the
 * bare footer digit «13»), and the scan renders it as a photograph. Note the
 * French edition *does* carry a photo credit on books 67 and 79 (the English
 * edition did not), so those pages are left as they were scanned rather than
 * blanked. The reader blanks only the truly text-free page.
 */
const IMAGE_ONLY_BOOK_PAGES: ReadonlySet<number> = new Set([13]);

/**
 * OCR text of book page N. The whole book was OCR'd in one resumable batch, so
 * there is a single source: the scan's OCR under `data/curriculum-ocr/math-fr-t1`.
 */
export function loadBookPage(book: number): string {
  if (IMAGE_ONLY_BOOK_PAGES.has(book)) return "";
  return readTextFile(path.join(OCR_DIR, `pages-${pad(book + BOOK_TO_PDF_OFFSET)}.txt`));
}

/**
 * The OCR provider answers a truly blank page with one of these sentences (the
 * wording varies between calls) instead of an empty string. They mean «no text»,
 * not content, so verification treats them as missing.
 */
const NO_TEXT_MARKERS = ["لا يوجد نص مكتوب في الصورة المرفقة", "لا توجد نصوص في الصورة المرفقة", "لا توجد نصوص في هذه الصورة"];

/** True when a content page carries real text (not a blank-page placeholder). */
function pageHasText(book: number): boolean {
  const text = loadBookPage(book);
  return text.length > 0 && !NO_TEXT_MARKERS.some((m) => text.includes(m));
}

/** Loads + joins the OCR text of a book-page range into one lesson document. */
export function loadBookRange(fromBook: number, toBook: number): string {
  const parts: string[] = [];
  for (let book = fromBook; book <= toBook; book++) {
    const text = loadBookPage(book);
    if (!text) continue;
    parts.push(`[صفحة الكتاب ${book}]`);
    parts.push(text);
  }
  return parts.join("\n\n");
}

/** Convenience: the full document payload for one concept lesson. */
export function conceptDocument(unitIndex: number, conceptIndex: number): string {
  const range = conceptBookRange(unitIndex, conceptIndex);
  return loadBookRange(range.from, range.to);
}

// ---------------------------------------------------------------------------
// PHASE 67 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"; // U+0660..U+0669
const EXT_AR_DIGITS = "۰۱۲۳۴۵۶۷۸۹"; // U+06F0..U+06F9

/** Arabic-Indic digits → Latin, so a footer compares by value, not by glyph. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * The book number a page prints in its running foot, or null when the last line
 * is not a bare numeral. The maths foot is either the number alone or the lesson
 * caption followed by "| N" («Leçon 4 • Explorer l'étendue | 111»).
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  const latin = toLatinDigits(last);
  const bare = /^\d{1,3}$/.exec(latin);
  if (bare) return Number(bare[0]);
  const piped = /\|\s*(\d{1,3})$/.exec(latin);
  if (piped) return Number(piped[1]);
  return null;
}

/**
 * Accent- and case-folded, punctuation-free text: lets a title match across the
 * book's layout and across the OCR's inconsistent accents (the French edition
 * prints «numerique» and «numérique» in different places, and the scan drops or
 * swaps accents on a few words).
 */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Table invariants: every range sits inside its unit, units tile the book without
 * gaps or overlaps, and the table starts/ends where the book does. A content
 * mistake here would quietly ground the tutor on the wrong pages.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_FR_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.concepts.length === 0) problems.push(`الوحدة ${ui + 1}: بلا مفاهيم`);
    const unitFrom = unitOpenerBookPage(ui);
    const unitTo =
      ui + 1 < units.length ? unitOpenerBookPage(ui + 1) - 1 : EGYPT_MATH_FR_T1_BOOK_END;
    unit.concepts.forEach((concept, ci) => {
      if (concept.concepts.length === 0) problems.push(`المفهوم ${concept.key}: بلا أهداف`);
      if (concept.lessonStarts.length === 0) problems.push(`المفهوم ${concept.key}: بلا دروس`);
      const { from, to } = conceptBookRange(ui, ci);
      if (from > to) problems.push(`المفهوم ${concept.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unitFrom || to > unitTo) {
        problems.push(`المفهوم ${concept.key}: نطاقه ${from}–${to} خارج نطاق الوحدة ${unitFrom}–${unitTo}`);
      }
      const next = unit.concepts[ci + 1];
      if (next && to >= next.lessonStarts[0]!) problems.push(`المفهوم ${concept.key} يتداخل مع ${next.key}`);
    });
    const nextUnit = units[ui + 1];
    if (nextUnit && unitTo >= unitOpenerBookPage(ui + 1)) {
      problems.push(`الوحدة ${ui + 1} تتداخل مع الوحدة التالية`);
    } else if (nextUnit && unitTo !== unitOpenerBookPage(ui + 1) - 1) {
      problems.push(`فجوة صفحات بعد الوحدة ${ui + 1}`);
    }
  });

  if (unitOpenerBookPage(0) !== EGYPT_MATH_FR_T1_BOOK_START) {
    problems.push(`بداية المنهج يجب أن تكون الصفحة ${EGYPT_MATH_FR_T1_BOOK_START}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every page proves its book number when the book
 *     prints one (a few pages print the number in the running head instead, so
 *     their number is proven by the pages around them and by the tiling);
 *  2. every content page carries real text (the picture-only page is documented
 *     and excluded);
 *  3. every concept's title is printed inside the concept's own page range;
 *  4. every printed page is owned by exactly one concept.
 */
export function assertTreeMatchesTheBook(): {
  ok: boolean;
  problems: string[];
  pagesChecked: number;
} {
  const problems: string[] = [];
  const ranges = allConceptRanges();
  let footersChecked = 0;

  for (let book = EGYPT_MATH_FR_T1_BOOK_START; book <= EGYPT_MATH_FR_T1_BOOK_END; book++) {
    if (IMAGE_ONLY_BOOK_PAGES.has(book)) continue;
    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص مسح`);
      continue;
    }
    if (!pageHasText(book)) {
      problems.push(`صفحة الكتاب ${book}: بلا نص حقيقي (صفحة فارغة أو فشل مسح)`);
      continue;
    }
    const footer = printedFooter(book);
    if (footer !== null) {
      footersChecked++;
      if (footer !== book) {
        problems.push(`صفحة الكتاب ${book}: الفوتر المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each concept's title is printed inside its own page range. The French
  // edition does not always put the concept header on the first lesson page (it
  // can sit on the «Construire et connecter» page that follows it), and the
  // translation sometimes prints a variant (P.G.CM for P.G.C.D), so the check
  // looks for a fingerprint — the first 20 letters of the French title — anywhere
  // in the concept's own pages.
  EGYPT_MATH_FR_T1_UNITS.forEach((unit, ui) => {
    unit.concepts.forEach((concept, ci) => {
      const { from, to } = conceptBookRange(ui, ci);
      let text = "";
      for (let book = from; book <= to; book++) text += " " + loadBookPage(book);
      const french = concept.title.split(" — ")[0]!;
      const fingerprint = normalize(french).slice(0, 20);
      if (!normalize(text).includes(fingerprint)) {
        problems.push(
          `المفهوم ${concept.key}: صفحاته ${from}–${to} لا تطبع عنوانه «${french}»`,
        );
      }
    });
  });

  // 4. every printed page is owned by exactly one concept.
  for (let book = EGYPT_MATH_FR_T1_BOOK_START; book <= EGYPT_MATH_FR_T1_BOOK_END; book++) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} مفهومًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
