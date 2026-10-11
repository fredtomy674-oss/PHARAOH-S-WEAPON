// PHASE 98 — official Egypt Preparatory-1 (Grade 7) **Science, French-medium**,
// first term, Ministry 2026/2027 edition.
//
// The curriculum `eg-g7-science-fr` is rebuilt from the Ministry textbook
// `Science_FR_Prp1_TR1.pdf` (101 scan pages, all OCR'd) under
// server/data/curriculum-ocr/science-fr-p1-t1/. It is the French edition of the
// same book as `egyptScienceEnP1T1.ts` (English medium): it prints the same four
// units, the same twelve lessons, and the same printed page numbers, so this
// module mirrors that one unit-by-unit while taking its titles and its OCR
// transcript from the French scan.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 6   (book page 2 = PDF page 8, book page 88 = PDF page 94)
// Front matter is pdf 1–6 (cover, then roman ii–vi); content runs book 1–93 and
// pdf 100–101 is the printer's colophon / back cover, outside the taught range.
//
// The running foot is never a bare numeral: it names the lesson («LEÇON UN : La
// structure de l'atome 3») or the unit («4 UNITÉ UN : La matière»), with its
// single number at the line's end or start respectively; the four unit openers
// carry no foot at all. That shape is what proves the offset page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «Leçon»
// The contents («Contenu du livre», book pages iv–v) lists four units of four,
// three, three and two numbered Lessons («Leçon Un … Leçon Quatre»), each with
// its printed «Objectifs de la leçon». The app lesson is that printed lesson, and
// its concepts are those printed objectives. A unit's opener rides with its first
// lesson and its «Évaluation de l'unité» with its last, exactly as in the
// English edition.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.2 = PDF p.8). */
export const BOOK_TO_PDF_OFFSET = 6;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_SCIENCE_FR_P1_T1_BOOK_START = 1;

/** Last printed content page — the book's unit-4 assessment. */
export const EGYPT_SCIENCE_FR_P1_T1_BOOK_END = 93;

/** One lesson of the textbook — becomes one lesson in the app tree. */
export interface ScienceFrP1T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the app lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed at the head of the lesson, French then its Arabic counterpart. */
  title: string;
  /**
   * First printed book page of the lesson itself. The range the lesson *owns*
   * also includes its unit's opener when it is the unit's first lesson, which is
   * why ownership is derived by `lessonBookRange` rather than stored here.
   */
  bookFrom: number;
  /** The book's printed «Objectifs de la leçon» for this lesson. */
  concepts: string[];
}

export interface ScienceFrP1T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, French then its Arabic counterpart. */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: ScienceFrP1T1Lesson[];
}

/**
 * The four units of the first term with their twelve lessons: unit/lesson starts
 * from the book's contents page (iv), objectives from each lesson's first page
 * (2, 10, 18, 26 / 33, 41, 47 / 56, 64, 72 / 80, 88). Verified against every
 * printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_SCIENCE_FR_P1_T1_UNITS: ScienceFrP1T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "Unité 1 : La matière — الوحدة الأولى: المادة",
    bookFrom: 1,
    bookTo: 31,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "La structure de l'atome — تركيب الذرة",
        bookFrom: 2,
        concepts: [
          "Déduire que l'atome est l'unité de construction de toute matière.",
          "Montrer le rôle du scientifique Ernest Rutherford dans la découverte de la structure de l'atome.",
          "Identifier les composants subatomiques de l'atome.",
          "Reconnaître les charges et les masses des composants de l'atome.",
          "Déterminer la position des composants subatomiques dans l'atome.",
          "Reconnaître que les électrons tournent sous différentes formes dans les niveaux d'énergie.",
          "Reconnaître les symboles chimiques de certains éléments.",
          "Déduire le nombre d'électrons qui occupent les niveaux d'énergie.",
          "Déterminer la relation entre le nombre de particules subatomiques constituant l'atome.",
          "Reconnaître les isotopes.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "Le tableau périodique de classification des éléments — الجدول الدوري لتصنيف العناصر",
        bookFrom: 10,
        concepts: [
          "Expliquer le rôle du scientifique Dmitri Mendeleïev dans l'arrangement des éléments par ordre croissant de leurs masses atomiques.",
          "Réaliser que le tableau périodique moderne reflète la structure électronique et les propriétés des atomes.",
          "Établir un lien entre le numéro atomique des éléments de groupes A et leur position dans le tableau périodique moderne.",
          "Identifier la structure électronique des atomes des éléments à la lumière du tableau périodique moderne.",
          "Montrer que les propriétés chimiques se répètent dans certains groupes du tableau périodique moderne.",
          "Déduire la relation entre la position d'un élément dans le tableau périodique et son activité chimique.",
          "Apprécier le rôle des scientifiques dans l'évolution des tentatives de classification des éléments.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "La matière et ses propriétés — المادة وخصائصها",
        bookFrom: 18,
        concepts: [
          "Analyser des données montrant qu'une substance pure est composée d'un seul type d'atomes ou de molécules.",
          "Expliquer la différence entre les molécules des éléments et les molécules des composés.",
          "Analyser les données sur la composition de différentes substances.",
          "Explorer le fait que le nombre d'atomes dans les molécules des composés peut varier de deux à plusieurs milliers.",
          "Distinguer les substances par leurs propriétés physiques et chimiques.",
          "Prédire les utilisations des substances en fonction de leurs propriétés.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "Les liaisons chimiques — الروابط الكيميائية",
        bookFrom: 26,
        concepts: [
          "Distinguer entre la liaison ionique et la liaison covalente.",
          "Représenter la liaison covalente à l'aide des électrons de valence non-appariés.",
          "Établir un lien entre la structure atomique du carbone et ses propriétés distinctives dans la formation des composés organiques.",
          "Expliquer la liaison présente dans la molécule de méthane en tant que composé organique le plus simple.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "Unité 2 : Les champs de forces — الوحدة الثانية: مجالات القوى",
    bookFrom: 32,
    bookTo: 54,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "La force électrique — القوى الكهربية",
        bookFrom: 33,
        concepts: [
          "Réaliser des activités illustrant le concept d'électricité statique.",
          "Expliquer comment charger des objets avec des charges statiques.",
          "Fournir une preuve de la présence d'un champ électrique entre des corps qui ne sont pas en contact.",
          "Reconnaître le champ électrique.",
          "Décrire les propriétés des lignes de force électrique.",
          "Énumérer les utilisations d'un électroscope.",
          "Concevoir un modèle montrant que la force électrique agit à distance.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "La force magnétique — القوى المغناطيسية",
        bookFrom: 41,
        concepts: [
          "Reconnaître les formes des aimants.",
          "Distinguer les matériaux magnétiques des matériaux non magnétiques.",
          "Découvrir les propriétés des aimants.",
          "Déduire la loi d'attraction et de répulsion.",
          "Identifier le champ magnétique.",
          "Dessiner les lignes du champ magnétique d'un aimant.",
          "Dessiner les lignes du champ magnétique des pôles opposés de deux aimants.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "La force gravitationnelle — قوى الجاذبية",
        bookFrom: 47,
        concepts: [
          "Reconnaître le champ gravitationnel.",
          "Fournir une preuve de l'existence de la gravitation entre des corps qui ne sont pas en contact.",
          "Distinguer les forces de contact des forces de champ.",
          "Identifier les facteurs influençant les forces de gravité.",
          "Fournir une preuve que les forces gravitationnelles sont toujours attractives.",
          "Fournir une preuve que les forces gravitationnelles sont très faibles entre deux corps de petites masses.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title:
      "Unité 3 : Les organismes vivants : leur structure et leurs fonctions — الوحدة الثالثة: الكائنات الحية تركيبها وعملياتها",
    bookFrom: 55,
    bookTo: 78,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "Les cellules et la vie — الخلايا والحياة",
        bookFrom: 56,
        concepts: [
          "Fournir une preuve que tous les organismes vivants sont constitués de cellules comme unité de structure et de fonction.",
          "Classifier les organismes vivants en procaryotes et eucaryotes.",
          "Classifier les organismes vivants en organismes unicellulaires et pluricellulaires.",
          "Comparer entre les procaryotes et les eucaryotes.",
          "Reconnaître le rôle des cellules souches dans la différenciation des tissus et des organes chez les organismes pluricellulaires.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "Les caractéristiques générales des organismes vivants. — الصفات العامة للكائنات الحية",
        bookFrom: 64,
        concepts: [
          "Énumérer les caractéristiques générales des organismes vivants.",
          "Relier les caractéristiques générales de la vie aux fonctions de la cellule chez les procaryotes.",
          "Relier les caractéristiques générales de la vie aux fonctions de la cellule chez les eucaryotes.",
          "Montrer l'intégration entre le processus de photosynthèse et le processus de respiration cellulaire.",
          "Reconnaître la caractéristique du transport chez les animaux et les plantes.",
          "Comparer les moyens de mouvement chez certains organismes unicellulaires.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "Les microbes — الميكروبات",
        bookFrom: 72,
        concepts: [
          "Classifier les microbes en procaryotes et eucaryotes.",
          "Énumérer les types des microbes.",
          "Décrire des exemples des microbes utiles.",
          "Énumérer les avantages des microbes pour l'homme.",
          "Décrire des exemples des microbes nuisibles.",
          "Identifier les maladies causées par la contamination des aliments.",
          "Apprécier les efforts des scientifiques dans la découverte des maladies et leurs traitements.",
        ],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "Unité 4 : Le système (Terre - Soleil - Lune) — الوحدة الرابعة: نظام (الأرض - الشمس - القمر)",
    bookFrom: 79,
    bookTo: 93,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "La Terre et le système solaire — الأرض والنظام الشمسي",
        bookFrom: 80,
        concepts: [
          "Déduire les similarités et les différences entre les planètes du système solaire.",
          "Reconnaître certaines conséquences de l'inclinaison de l'axe de la Terre.",
          "Déduire la relation entre le mouvement apparent du Soleil et les longueurs des ombres projetées par les objets.",
          "Déduire la relation entre l'inclinaison de l'axe de la Terre, sa révolution autour du Soleil, et la succession des saisons.",
          "Déduire la relation entre la durée du jour et de la nuit au cours des quatre saisons.",
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        title: "L'éclipse de la Lune — خسوف القمر",
        bookFrom: 88,
        concepts: [
          "Distinguer les phases de la Lune.",
          "Identifier la phase de la pleine Lune.",
          "Vérifier la formation de l'ombre et de la pénombre pour les objets opaques.",
          "Expliquer le phénomène de l'éclipse lunaire.",
          "Rédiger un rapport sur l'éclipse solaire.",
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
 * belong to — and lands the unit assessment on the last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_SCIENCE_FR_P1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SCIENCE_FR_P1_T1_UNITS.forEach((unit, ui) => {
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
  "science-fr-p1-t1",
);

/**
 * The OCR provider answers a truly blank page with one of these sentences (the
 * wording varies between calls) instead of an empty string. They mean "no text",
 * not content, so verification treats them as missing while `loadBookPage` still
 * returns them verbatim.
 */
const NO_TEXT_MARKERS = [
  "لا يوجد نص مكتوب في الصورة المرفقة",
  "لا يوجد نص في الصورة المرفقة",
  "لا توجد نصوص في الصورة المرفقة",
  "[صفحة فارغة]",
];

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

/** Arabic-Indic digits → Latin. The cover is Arabic and may print either range. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * Is this line shaped like the book's running foot? It must name the lesson
 * («LEÇON UN …») or the unit («… UNITÉ UN …»), carry a colon, and hold exactly
 * one number at the very start or the very end of the line — never in the middle,
 * which is what keeps a content line («Leçon Un : La structure de l'atome», no
 * number) or a unit heading («UNITÉ 1», no colon) from being read as a page
 * number.
 */
function footNumber(line: string): number | null {
  if (!/le[çc]on|unit[ée]/i.test(line)) return null;
  if (!line.includes(":")) return null;
  const latin = toLatinDigits(line);
  const runs = latin.match(/\d{1,3}/g) ?? [];
  if (runs.length !== 1) return null;
  const at = latin.indexOf(runs[0]!);
  const endsLine = at + runs[0]!.length === line.length;
  if (!endsLine && at !== 0) return null;
  return Number(runs[0]);
}

/**
 * The book number a content page prints in its running foot, or null when the
 * page prints none. The foot is never bare here: it is the lesson caption
 * carrying the number at its end («LEÇON UN : La structure de l'atome 3») or the
 * number leading the unit caption («4 UNITÉ UN : La matière»). The lines are
 * walked backwards rather than only the last one because OCR floats a page's
 * figure captions past its foot, while the four unit openers carry no foot.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    const n = footNumber(lines[i]!);
    if (n !== null) return n;
  }
  return null;
}

/**
 * Lowercase alphanumerics only (accents are dropped on both sides of a match),
 * so OCR spacing and the book's accentuation cannot break a title comparison.
 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_SCIENCE_FR_P1_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
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
  if (first && first.bookFrom !== EGYPT_SCIENCE_FR_P1_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_SCIENCE_FR_P1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SCIENCE_FR_P1_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_SCIENCE_FR_P1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number;
 *  2. every content page carries real OCR text;
 *  3. every lesson's own first page prints that lesson's title;
 *  4. every printed page is owned by exactly one lesson — no page can fall
 *     between two lessons and be unreachable.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const ranges = allLessonRanges();
  let footersChecked = 0;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SCIENCE_FR_P1_T1_BOOK_START || book > EGYPT_SCIENCE_FR_P1_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_SCIENCE_FR_P1_T1_BOOK_END - EGYPT_SCIENCE_FR_P1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_SCIENCE_FR_P1_T1_BOOK_START} و${EGYPT_SCIENCE_FR_P1_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title. The stored title is
  // bilingual; the scan only prints the French half, so that is what compares.
  EGYPT_SCIENCE_FR_P1_T1_UNITS.forEach((unit) => {
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
