// PHASE G8-math-fr — official Egypt Preparatory-2 (Grade 8) Mathematics,
// **French-medium** edition («كتاب الوزارة»), first term, Ministry 2026/2027.
//
// The curriculum `eg-g8-math-fr` is rebuilt from the Ministry textbook
// `Math_FR_Prp2_T1.pdf` (128 scan pages, all OCR'd). It is the French edition of
// the same book as `egyptMathG8T1.ts` (Arabic medium): it prints the same four
// units, the same seventeen «الدرس», and the same page boundaries, so this
// module mirrors that one unit-by-unit while taking its titles and its OCR
// transcript from the French scan.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 4   (book page 3 = PDF page 7)
// The French edition prints its numbers one page earlier than the Arabic and
// English ones (the lesson head of 1-1 is book page 2 = PDF 6), so the offset
// is 4 here, not 5. Every content page carries its own number in the running
// foot — sometimes alone («3»), sometimes wrapped with the unit title («4 Unité
// 1: … Mathématiques»), sometimes with the running title («Premier semestre
// Leçon 1: Les nombres réels 5») — which is what fixes the offset at 4 and
// proves the mapping page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس», NOT A «مفهوم»
// This book's contents page lists «دروس الوحدة»: four units of five, four, six
// and two numbered lessons (1-1 … 4-2), each with its printed «Résultats
// d'apprentissage». The app lesson is that printed lesson, and its concepts
// are those outcomes.
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND ASSESSMENTS
// Each unit opens with a one-page opener (title + «Leçons de l'unité») and
// closes with «Évaluation de l'unité N»; the book then finishes with
// «Évaluation finale». Neither is a lesson, so — as in the other Ministry books
// — the opener rides with the unit's first lesson and the assessment with its
// last.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.3 = PDF p.7). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_MATH_G8_FR_T1_BOOK_START = 1;

/** Last printed content page — the closing «Évaluation finale» (books 123-128 are back matter). */
export const EGYPT_MATH_G8_FR_T1_BOOK_END = 122;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface MathG8FrT1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed at the head of the lesson, French then its Arabic counterpart. */
  title: string;
  /**
   * First printed book page of the lesson itself. The range the lesson *owns*
   * also includes its unit's opener when it is the unit's first lesson, which is
   * why ownership is derived by `lessonBookRange` rather than stored here.
   */
  bookFrom: number;
  /** The book's printed «Résultats d'apprentissage» for this lesson. */
  concepts: string[];
}

export interface MathG8FrT1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, French then its Arabic counterpart. */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: MathG8FrT1Lesson[];
}

/**
 * The four units of the first term with their seventeen lessons: unit/lesson
 * starts from the book's contents page (iv), outcomes from each lesson's first
 * page (2, 8, 14, 20, 25 / 33, 39, 46, 53 / 62, 70, 78, 83, 89, 97 / 106, 112).
 * Verified against every printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_MATH_G8_FR_T1_UNITS: MathG8FrT1Unit[] = [
  {
    ordinal: "الأولى",
    title: "Unité 1 : Les nombres et les opérations sur les nombres — الوحدة الأولى: الأعداد والعمليات عليها",
    bookFrom: 1,
    bookTo: 31,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "Les nombres réels — الأعداد الحقيقية",
        bookFrom: 2,
        concepts: [
          "Définir la notion de nombre irrationnel.",
          "Estimer la valeur approximativement d'un nombre irrationnel et la représenter sur une droite numérique.",
          "Reconnaître l'ensemble de nombres réels.",
          "Classer un ensemble de nombres réels par ordre décroissant ou croissant.",
          "Résoudre des équations dans l'ensemble de nombres réels.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "Les intervalles et les opérations sur les intervalles — الفترات والعمليات عليها",
        bookFrom: 8,
        concepts: [
          "Définir la notion d'intervalle comme un sous-ensemble de l'ensemble des nombres réels.",
          "Représenter un intervalle sur la droite numérique.",
          "Effectuer les opérations d'intersection, d'union, de différence et de complémentaire sur les intervalles.",
          "Utiliser le concept des intervalles pour résoudre des problèmes de la vie.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "Les opérations sur les nombres réels — العمليات على الأعداد الحقيقية",
        bookFrom: 14,
        concepts: [
          "Effectuer des opérations arithmétiques (l'addition, la soustraction, la multiplication et la division) sur les nombres réels.",
          "Connaître les propriétés de l'addition et de la multiplication des nombres réels.",
          "Résoudre certains problèmes de la vie en utilisant les opérations arithmétiques sur les nombres réels.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "Les lois des racines carrées et cubiques — قوانين الجذور التربيعية والتكعيبية",
        bookFrom: 20,
        concepts: [
          "Connaître les lois de la multiplication et de la division des racines carrées.",
          "Connaître les lois de la multiplication et de la division des racines cubiques.",
          "Utiliser les lois des racines carrées et cubiques pour simplifier les nombres.",
          "Utiliser les lois des racines pour résoudre les problèmes de la vie.",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "Les lois des exposants dans les nombres réels — قوانين الأسس في الأعداد الحقيقية",
        bookFrom: 25,
        concepts: [
          "Connaître la multiplication répétée dans l'ensemble des nombres réels.",
          "Connaître les lois des exposants dans les nombres réels.",
          "Utiliser les lois des exposants pour simplifier des expressions mathématiques.",
          "Utiliser les lois des exposants pour résoudre des problèmes de la vie.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "Unité 2 : L'algèbre — الوحدة الثانية: الجبر",
    bookFrom: 32,
    bookTo: 60,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "La factorisation en extrayant le plus grand commun diviseur — التحليل بإخراج العامل المشترك الأكبر",
        bookFrom: 33,
        concepts: [
          "Connaître le concept de la factorisation en extrayant le plus grand commun diviseur.",
          "Factoriser un polynôme en extrayant le plus grand commun diviseur.",
          "Utiliser la factorisation en extrayant le plus grand commun diviseur pour résoudre des problèmes.",
          "Résoudre des équations en utilisant la factorisation en extrayant le plus grand commun diviseur.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "La factorisation d'un trinôme — تحليل ثلاثية الحدود",
        bookFrom: 39,
        concepts: [
          "Factoriser un trinôme de la forme: X² + b X + c",
          "Factoriser un trinôme de la forme: a X² + b X + c (où a ≠ ± 1).",
          "Utiliser la factorisation pour résoudre des équations quadratiques.",
          "Utiliser la factorisation pour résoudre des problèmes de la vie.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "La factorisation des cas particuliers — تحليل الحالات الخاصة",
        bookFrom: 46,
        concepts: [
          "Factoriser le trinôme qui représente un carré parfait",
          "Factoriser la différence de deux carrés.",
          "Factoriser la différence de deux cubes.",
          "Factoriser la somme de deux cubes",
          "Utiliser la factorisation pour faciliter d'effectuer les opérations mathématiques.",
          "Utiliser la factorisation pour résoudre certains problèmes de la vie.",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "La factorisation par partition — التحليل بالتقسيم",
        bookFrom: 53,
        concepts: [
          "Factoriser un polynôme à travers la partition.",
          "Savoir la complétion d'un carré.",
          "Utiliser la complétion d'un carré dans la factorisation et la résolution d'équations.",
          "Utiliser la factorisation par partition pour résoudre des problèmes de la vie.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "Unité 3 : La géométrie — الوحدة الثالثة: الهندسة",
    bookFrom: 61,
    bookTo: 104,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "La congruence — التطابق",
        bookFrom: 62,
        concepts: [
          "Connaître le concept de la congruence des figures géométriques planes.",
          "Connaître les conditions de congruence de deux polygones.",
          "Connaître les cas de congruence de deux triangles.",
          "Utiliser la congruence pour trouver les mesures des angles et les longueures des côtés.",
          "Démontrer la congruence de deux triangles.",
          "Utiliser la congruence des figures géométriques planes pour résoudre les problèmes de la vie.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "Le théorème de Pythagore et sa réciproque — نظرية فيثاغورس وعكسها",
        bookFrom: 70,
        concepts: [
          "Connaître la relation entre les longueurs des côtés du triangle rectangle.",
          "Trouver la longueur de l'un des deux côtés de l'angle droit dans un triangle rectangle si la longueur de l'hypoténuse et la longueur de l'autre côté sont connues.",
          "Trouver la longueur de l'hypoténuse dans un triangle rectangle si les longueurs des deux côtés de l'angle droit sont connues.",
          "Prouver que le triangle est un triangle rectangle si les longueurs de ses trois côtés sont connues.",
          "Déterminer le type du triangle en fonction de ses angles si les longueurs de ses côtés sont connues.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "Les applications du parallélisme — تطبيقات التوازي",
        bookFrom: 78,
        concepts: [
          "Connaître la relation entre les longueurs des parties des sécantes comprises entre des droites parallèles.",
          "Utiliser la demi-droite tracée à partir du milieu de l'un des côtés d'un triangle parallèle à l'un des deux autres côtés.",
          "Connaître le segment moyen d'un triangle.",
          "Connaître la relation entre le segment moyen d'un triangle et le côté qui lui est opposé.",
          "Utiliser le parallélisme dans la résolution de problèmes en géométrie.",
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        title: "Les médianes du triangle — متوسطات المثلث",
        bookFrom: 83,
        concepts: [
          "Connaître le concept de la médiane du triangle.",
          "Connaître le point d'intersection des médianes du triangle.",
          "Connaître la relation entre la longueur de la médiane tracé à partir du sommet de l'angle droit et la longueur de l'hypoténuse dans le triangle rectangle.",
          "Utiliser les médianes du triangle pour résoudre des problèmes de la vie.",
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        title: "Le triangle isocèle — المثلث المتساوى الساقين",
        bookFrom: 89,
        concepts: [
          "Connaître les propriétés du triangle isocèle.",
          "Connaître les propriétés du triangle équilatéral.",
          "Connaître la symétrie dans le triangle.",
          "Connaître la relation entre les longueurs des côtés du triangle trente-soixante.",
          "Utiliser les propriétés du triangle isocèle et du triangle équilatéral dans la résolution des problèmes de la vie.",
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        title: "Les angles intérieurs et extérieurs des polygones — الزوايا الداخلة والخارجة للمضلعات",
        bookFrom: 97,
        concepts: [
          "Connaître la formule mathématique pour calculer la somme des mesures des angles intérieurs d'un polygone convexe.",
          "Connaître la somme des mesures des angles extérieurs d'un polygone convexe.",
          "Connaître la formule mathématique pour calculer la mesure de l'angle intérieur d'un polygone régulier.",
          "Connaître la formule mathématique pour calculer le nombre de diagonales du polygone convexe.",
        ],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "Unité 4 : Les statistiques — الوحدة الرابعة: الإحصاء",
    bookFrom: 105,
    bookTo: 122,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "Le tableau des effectifs cumulés croissants et sa représentation graphique — الجدول التكراري المتجمع الصاعد وتمثيله بيانيًا",
        bookFrom: 106,
        concepts: [
          "Dresser un tableau des effectifs cumulés croissants pour un tableau des données par intervalles.",
          "Tracer la courbe des effectifs cumulés croissants.",
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        title: "Les mesures de la tendance centrale du tableau des données par intervalles — مقاييس النزعة المركزية للجدول التكراري ذي المجموعات",
        bookFrom: 112,
        concepts: [
          "Déterminer la moyenne arithmétique du tableau des données par intervalles.",
          "Déterminer la médiane du tableau des données par intervalles.",
          "Déterminer le mode du tableau des données par intervalles.",
          "Lire et interpréter des tableaux et des graphiques d'effectifs d'une population.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the unit's opener (for the unit's first
 * lesson) or its own start page, up to the page before the next lesson starts,
 * or the unit's last page for its last lesson. Deriving the end this way keeps
 * the unit opener and each lesson's activity block inside the lesson they
 * belong to — and lands the unit assessment (and the final assessment for the
 * last unit) on the last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_MATH_G8_FR_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_G8_FR_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
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
  "math-fr-p2-t1",
);

/**
 * The OCR provider answers a truly blank page with one of these sentences
 * (the wording varies between calls) instead of an empty string. They mean
 * "no text", not content, so verification treats them as missing while
 * `loadBookPage` still returns them verbatim.
 */
const NO_TEXT_MARKERS = ["لا يوجد نص مكتوب في الصورة المرفقة", "لا يوجد نص في الصورة المرفقة", "لا توجد نصوص في الصورة المرفقة"];

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

/** True when a content page carries real text (not the blank-page placeholder). */
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

/** Convenience: the full document payload for one lesson. */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const range = lessonBookRange(unitIndex, lessonIndex);
  return loadBookRange(range.from, range.to);
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"; // U+0660..U+0669
const EXT_AR_DIGITS = "۰۱۲۳۴۵۶۷۸۹"; // U+06F0..U+06F9

/**
 * Arabic-Indic digits → Latin. The scan mixes Eastern (٠–٩) and Extended
 * Arabic-Indic (۰–۹) digits from page to page, so both ranges are mapped; a
 * footer would otherwise compare unequal for a purely cosmetic reason.
 */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints in its running foot, or null when the
 * page prints no number. The foot spans up to three lines near the bottom and
 * the number sits on one of them — alone («3»), wrapped with the unit title
 * («4 Unité 1: Les nombres …»), or wrapped with the running title («Premier
 * semestre Leçon 1: Les nombres réels 5»). Unlike the Arabic and English feet,
 * the French ones spell the lesson/unit ordinal as a DIGIT («Leçon 1: …»,
 * «Unité 1: …»), so that label's run is stripped before counting — otherwise a
 * real foot would look like it carries two numbers. The unit openers print a
 * values banner instead («- La conscience alimentaire»), and the lesson head
 * pages print only the running title («Mathématiques - deuxième préparatoire»).
 * A line is accepted only when it looks like one of these — a lone numeral or
 * a line carrying «Unité/Leçon/Évaluation/Mathématiques/Premier semestre» — so
 * a content line that merely ends in a number is not mistaken for the foot.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const tail = lines.slice(-3);
  for (let i = tail.length - 1; i >= 0; i--) {
    const raw = toLatinDigits(tail[i]!);
    const latin = raw.replace(/(Unité|Leçon)\s*\d{1,2}/g, "");
    const runs = latin.match(/\d{1,3}/g) ?? [];
    if (runs.length !== 1) continue;
    // The running title wraps across two lines in this edition («Premier
    // semestre Leçon 2: …» then «du tableau des données par intervalles 115»),
    // so the marker may sit on the line above the one carrying the number.
    const markedLine = tail[i]! + (i > 0 ? tail[i - 1]! : "");
    const looksLikeFoot =
      /^[\d\s]+$/.test(latin) || /Unité|Leçon|Évaluation|Mathématiques|Premier semestre/.test(markedLine);
    if (!looksLikeFoot) continue;
    return Number(runs[0]);
  }
  return null;
}

/**
 * Strips everything but letters and digits (and spells the superscripts the
 * scan mixes in, and the «²»/«³» the book prints), so OCR spacing cannot break
 * a match.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_G8_FR_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا نواتج تعلم`);
      if (lesson.bookFrom <= unit.bookFrom || lesson.bookFrom > unit.bookTo) {
        problems.push(
          `الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق الوحدة ${unit.bookFrom + 1}–${unit.bookTo}`,
        );
      }
      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق الوحدة ${unit.bookFrom}–${unit.bookTo}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر الوحدة ${unit.bookFrom}، وجدنا ${from}`);
      }
    });
    const nextUnit = units[ui + 1];
    if (nextUnit && unit.bookTo >= nextUnit.bookFrom) {
      problems.push(`الوحدة ${unit.ordinal} تتداخل مع ${nextUnit.ordinal}`);
    } else if (nextUnit && unit.bookTo !== nextUnit.bookFrom - 1) {
      problems.push(`فجوة صفحات بين ${unit.ordinal} و${nextUnit.ordinal}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`);
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_MATH_G8_FR_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_MATH_G8_FR_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_G8_FR_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_MATH_G8_FR_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the offset and proves the mapping page by page;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every lesson's own first page prints that lesson's title;
 *  4. every printed page in the book is owned by exactly one lesson — no page
 *     can fall between two lessons and be unreachable.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const ranges = allLessonRanges();
  let footersChecked = 0;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_G8_FR_T1_BOOK_START || book > EGYPT_MATH_G8_FR_T1_BOOK_END) continue;
    printedPages.add(book);
    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
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

  if (printedPages.size !== EGYPT_MATH_G8_FR_T1_BOOK_END - EGYPT_MATH_G8_FR_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_MATH_G8_FR_T1_BOOK_START} و${EGYPT_MATH_G8_FR_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title (the French half of our
  // bilingual title).
  EGYPT_MATH_G8_FR_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      const french = lesson.title.split(" — ")[0]!;
      if (!normalize(opener).includes(normalize(french))) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع عنوانه «${french}»`);
      }
    });
  });

  // 4. every printed page is owned by exactly one lesson.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}