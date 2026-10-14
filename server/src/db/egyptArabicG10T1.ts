// PHASE 105 — official Egypt Secondary-1 (Grade 10) Arabic language, first term
// («اللغة العربية - الصف الأول الثانوي», 2026/2027 MoE edition, 152 scanned pages).
//
// The curriculum tree for the Egypt `eg-g10-arabic` curriculum is rebuilt from the
// Ministry textbook `اللغة العربية` (first term). This module is the single source
// of truth for its structure: the three units of the first term, their printed
// lessons (the book's own «الدَّرْسُ الأَوَّلُ / الثَّانِي / الثَّالِثُ» heads, as its
// printed «المحتويات» lists them) and, for every lesson, the book's own printed
// heads — the reading / poetry / prose / Qur'anic text, the «القواعد النحوية»
// section and the «لمحة بلاغية» / «لمحة أدبية» boxes — verbatim, with the printed
// page they start on. The self-checks at the bottom prove that mapping against the
// OCR itself, page by page.
//
// THE OFFSET IS SIX — book page = scan page − 6
// Every content page that carries a folio prints its own number as a bare
// Arabic-Indic numeral on a line of its own at the foot (scan 12 prints «٦»,
// scan 22 prints «١٦», scan 63 prints «٥٧», scan 85 prints «٧٩»), and every one of
// them prints its own number, which fixes `BOOK_TO_PDF_OFFSET = 6`: book 1 = scan 7
// (the unit 1 opener). The book's own «المحتويات» (scan 5) prints the same start
// pages for the units and lessons, so the two agree.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–6 are the cover (1), the contributors masthead (2), the «مقدمة»
// (3–4), the printed «المحتويات» فهرس (5) and a «تنبيه» exam-instructions page (6).
// Scan pages 86–152 are everything after the term: a «تنبيه» page (86), the
// glossary «ملحق المعجم اللغوي» (87–90), «المراجع» (91), another «تنبيه» (92) and
// then the separate «كتاب الأنشطة والتدريبات» (93–152) with its own numbering. The
// term runs from the first unit's opener (book 1) to the last content page
// (book 79): `EGYPT_ARABIC_G10_T1_BOOK_START` / `_END` are exactly those two pages,
// and the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 79 − 1 + 1 = 79.
//
// ONLY THREE TERM PAGES LOST THEIR FOLIO IN THE OCR
// Book pages 1, 27 and 53 — the three unit openers — print no standalone folio in
// the OCR; their last lines are the unit's own lesson list (which carries no page
// number). Rather than weaken the page-number check, they are exempt from it and
// anchored on the unit head each opener prints — the only book-specific marker
// that survives on that page. See `FOLIO_LESS_ANCHORS`.
//
// THREE FOOTERS THE OCR MISREAD
// Book pages 30, 34 and 35 print a folio whose leading «٣» the OCR read as «٢»
// («٢٠», «٢٤», «٢٥» instead of «٣٠», «٣٤», «٣٥»). Those three measured misreads
// are accepted in `FOOTER_OCR_MISREADS`; every other term page's footer prints its
// own number exactly.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// This book prints no per-lesson objectives. What it does print at the head of
// each part is the lesson title and, inside the lesson, the activity heads
// («القواعد النحوية …», «لمحة بلاغية: …», «لمحة أدبية …»). Each lesson below
// carries exactly those printed heads, verbatim, as its concepts — the lesson's
// own opening head first, then the grammar / rhetoric / literary heads in the
// order they are printed; nothing is invented. Where the book prints a head's
// topic on the following line (the «لمحة أدبية» boxes), the two printed lines are
// joined in `title`, so every token still comes from the page.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 6 (verified: book p.79 = scan p.85). */
export const BOOK_TO_PDF_OFFSET = 6;

/** First printed page of the term — the unit 1 opener (scan 7). */
export const EGYPT_ARABIC_G10_T1_BOOK_START = 1;

/** Last printed page of the term — unit 3's last head (scan 85). */
export const EGYPT_ARABIC_G10_T1_BOOK_END = 79;

/** The scanned pages before the term: cover, masthead, مقدمة, المحتويات and تنبيه. */
export const EGYPT_ARABIC_G10_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/**
 * The scanned pages after the term: the لغوي glossary appendix, «المراجع», a
 * «تنبيه» page and the separate «كتاب الأنشطة والتدريبات».
 */
export const EGYPT_ARABIC_G10_T1_BACK_MATTER = { from: 86, to: 152 } as const;

/** One printed component of a lesson — becomes one concept in the app tree. */
export interface ArabicG10T1Concept {
  /** Printed book page where this component starts. */
  bookFrom: number;
  /** The printed component kind, e.g. "قراءة" or "قواعد نحوية". */
  kind: string;
  /** The printed head of this component, verbatim. */
  title: string;
}

/** One lesson («درس» = one of the book's printed «الدرس الأول/الثاني/الثالث» sections). */
export interface ArabicG10T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** The lesson's opening component type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson (without the number prefix). */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: ArabicG10T1Concept[];
}

/** One printed section of the book — one of the three units of the first term. */
export interface ArabicG10T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"3". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: قيم عربية". */
  title: string;
  /** The unit head the opener page prints, e.g. "قيم عربية". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: ArabicG10T1Lesson[];
}

function concept(bookFrom: number, kind: string, title: string): ArabicG10T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The three units of the first term with their printed lessons and every printed
 * head, transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from the book's «المحتويات» (scan 5); each lesson's
 * leading concept is the very heading the book prints on the page the lesson
 * starts on, and the book's own wording of those headings is kept verbatim in
 * `title`/`printedHead`.
 */
export const EGYPT_ARABIC_G10_T1_UNITS: ArabicG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: قيم عربية",
    printedHead: "قيم عربية",
    bookFrom: 1,
    bookTo: 26,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "قراءة",
        title: "مكارم الأخلاق وحاتم الطائي",
        printedHead: "الدَّرْسُ الأَوَّلُ مَكَارِمُ الأَخْلَاقِ وَحَاتِمُ الطَّائِيُّ",
        bookFrom: 3,
        concepts: [
          concept(3, "قراءة", "الدَّرْسُ الأَوَّلُ مَكَارِمُ الأَخْلَاقِ وَحَاتِمُ الطَّائِيُّ"),
          concept(6, "قواعد نحوية", "القواعد النحوية: أولا: الأفعال الناقصة والتامة"),
          concept(8, "قواعد نحوية", "ثانياً: أفعال المقاربة والرجاء والشروع"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: "شعر",
        title: "شباب تسامى للعلا وكهول للسموأل",
        printedHead: "الدَّرْسُ الثَّانِي شَبَابٌ تَسَامَى لِلْعُلَا وَكُهُولٌ لِلسَّمَوْأَلِ",
        bookFrom: 10,
        concepts: [
          concept(10, "شعر", "الدَّرْسُ الثَّانِي شَبَابٌ تَسَامَى لِلْعُلَا وَكُهُولٌ لِلسَّمَوْأَلِ"),
          concept(13, "لمحة بلاغية", "لمحة بلاغية: (الحقيقة والمجاز)"),
          concept(15, "لمحة أدبية", "خامسًا: لمحة أدبية: (الشعر في العصر الجاهلي)"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: "نثر",
        title: "قيم الحياة الزوجية",
        printedHead: "الدَّرْسُ الثَّالِثُ قِيمُ الحَيَاةِ الزَّوْجِيَّةِ لأمامة بنت الحارث",
        bookFrom: 19,
        concepts: [
          concept(19, "نثر", "الدَّرْسُ الثَّالِثُ قِيمُ الحَيَاةِ الزَّوْجِيَّةِ لأمامة بنت الحارث"),
          concept(21, "لمحة بلاغية", "لمحة بلاغية: (التشبيه)"),
          concept(24, "لمحة أدبية", "سادساً: لمحة أدبية"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: التسامح والسلام",
    printedHead: "التسامح والسلام",
    bookFrom: 27,
    bookTo: 52,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: "قراءة",
        title: "قيم اجتماعية",
        printedHead: "الدَّرْسُ الأَوَّلُ قِيَمٌ اجْتِمَاعِيَّةٌ",
        bookFrom: 29,
        concepts: [
          concept(29, "قراءة", "الدَّرْسُ الأَوَّلُ قِيَمٌ اجْتِمَاعِيَّةٌ"),
          concept(33, "قواعد نحوية", "القواعد النحوية: أولا: إعمال اسم الفاعل"),
          concept(35, "قواعد نحوية", "ثانياً: إعمال صيغ المبالغة"),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "شعر",
        title: "العفو مأمول",
        printedHead: "الدَّرْسُ الثَّانِي الْعَفْوُ مَأْمُولٌ",
        bookFrom: 37,
        concepts: [
          concept(37, "شعر", "الدَّرْسُ الثَّانِي الْعَفْوُ مَأْمُولٌ"),
          concept(39, "لمحة بلاغية", "لمحة بلاغية: الاستعارة المكنية"),
          concept(42, "لمحة أدبية", "لمحة أدبية: عصر صدر الإسلام"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: "نص قرآني",
        title: "من أجل حياة كريمة",
        printedHead: "الدَّرْسُ الثَّالِثُ مِنْ أَجْلِ حَيَاةٍ كَرِيمَةٍ",
        bookFrom: 45,
        concepts: [
          concept(45, "نص قرآني", "الدَّرْسُ الثَّالِثُ مِنْ أَجْلِ حَيَاةٍ كَرِيمَةٍ"),
          concept(47, "لمحة بلاغية", "لمحة بلاغية: الاستعارة التصريحية"),
          concept(50, "لمحة أدبية", "خامسًا: لمحة أدبية"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: العلم والأخلاق",
    printedHead: "العلم والأخلاق",
    bookFrom: 53,
    bookTo: 79,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: "قراءة",
        title: "تكنولوجيا المعلومات",
        printedHead: "الدَّرْسُ الأَوَّلُ تِكْنُولُوجْيَا الْمَعْلُومَاتِ",
        bookFrom: 55,
        concepts: [
          concept(55, "قراءة", "الدَّرْسُ الأَوَّلُ تِكْنُولُوجْيَا الْمَعْلُومَاتِ"),
          concept(60, "قواعد نحوية", "القواعد النحوية: إعمال اسم المفعول"),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: "شعر",
        title: "ابدأ بنفسك",
        printedHead: "الدَّرْسُ الثَّانِي ابْدَأْ بِنَفْسِكَ",
        bookFrom: 62,
        concepts: [
          concept(62, "شعر", "الدَّرْسُ الثَّانِي ابْدَأْ بِنَفْسِكَ"),
          concept(66, "لمحة أدبية", "لمحة أدبية: الشعر في العصر الأموي"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: "نثر",
        title: "آداب صناعة الكتاب",
        printedHead: "الدَّرْسُ الثَّالِثُ آدَابُ صِنَاعَةِ الْكُتَّابِ",
        bookFrom: 71,
        concepts: [
          concept(71, "نثر", "الدَّرْسُ الثَّالِثُ آدَابُ صِنَاعَةِ الْكُتَّابِ"),
          concept(76, "لمحة أدبية", "لمحة أدبية: النثر في العصر الأموي"),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the unit —
 * so the unit opener stays inside the unit it belongs to and the ranges tile the
 * whole term.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ARABIC_G10_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ARABIC_G10_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This book's one
 * appendix, the «ملحق المعجم اللغوي», is back matter that no lesson quotes by
 * page: every page of the term belongs to a unit. Kept as a function so the
 * seeder and the stage share one shape across all the books.
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
  "arabic-g10-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content.
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
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(unitIndex, lessonIndex);
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

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EXT_AR_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Arabic-Indic and Extended Arabic-Indic digits → Latin, so a folio can be read. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * Folds text for comparison: drops tatweel and diacritics, unifies the alef/ya/ta
 * forms the book prints inconsistently, and removes every non-letter/digit, so OCR
 * spacing and vowel marks cannot break a match.
 */
function normalize(text: string): string {
  return text
    .replace(/\u0640/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring OCR spacing and vowel marks. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints at its foot. This book's running
 * foot is the diacritised line «الفَصْلُ الدِّرَاسِيُّ الأَوَّلُ ٣٠ اللغة العربية … أم
 * القرى للطباعة», which the Nahw-style regex would miss; so the last three
 * non-empty lines are scanned and a line qualifies as a foot when it is a bare
 * numeral (optionally bracketed) or, after tatweel/diacritics are stripped, it
 * carries the book's running-foot markers «الفصل الدراسي | اللغة العربية | أم
 * القرى». Every number on such a line is a candidate.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const tail = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(-3);
  const nums: number[] = [];
  for (const line of tail) {
    const bare = line.replace(/\u0640/g, "").replace(/[\u064B-\u065F\u0670]/g, "");
    const looksLikeFoot =
      /^[\[\(]?[0-9٠-٩۰-۹]+[\]\)]?$/.test(bare) || /الفصل الدراسي|اللغة العربية|أم القرى|ام القرى/.test(bare);
    if (!looksLikeFoot) continue;
    const latin = toLatinDigits(line).replace(/[^0-9]/g, " ").replace(/\s+/g, " ").trim();
    for (const tok of latin.split(" ")) {
      if (tok) nums.push(Number(tok));
    }
  }
  return nums;
}

/**
 * The book number a content page prints at its foot, or null when the foot prints
 * no number (the three unit openers) or more than one. This book's foot carries
 * the running head and the folio on the same line, so a single candidate is the
 * page number.
 */
export function printedFooter(book: number): number | null {
  const nums = footerCandidates(book);
  const unique = [...new Set(nums)];
  return unique.length === 1 ? unique[0]! : null;
}

/**
 * The three term pages whose folio the OCR did not capture — the unit openers on
 * books 1, 27 and 53, whose last line lists the unit's lessons and carries no
 * number. Rather than weaken the page-number check for every page, they are
 * exempt from it and anchored on the unit head the page prints:
 *   • book 1  prints «قيم عربية»;
 *   • book 27 prints «التسامح والسلام»;
 *   • book 53 prints «العلم والأخلاق».
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  1: "قيم عربية",
  27: "التسامح والسلام",
  53: "العلم والأخلاق",
};

/**
 * The three footers the OCR misread: on books 30, 34 and 35 the leading «٣» was
 * read as «٢», so the OCR foot prints «٢٠», «٢٤», «٢٥». Every other term page's
 * foot prints its own number exactly, which fixes the offset page by page; these
 * measured misreads are accepted rather than weakening the check.
 */
const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {
  30: 20,
  34: 24,
  35: 25,
};

/** The component kinds the book actually prints. */
const COMPONENT_KINDS: ReadonlySet<string> = new Set([
  "قراءة",
  "نص قرآني",
  "شعر",
  "نثر",
  "قواعد نحوية",
  "لمحة بلاغية",
  "لمحة أدبية",
]);

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every range
 * sits inside its section, concept pages rise inside their lesson, every concept
 * kind is one the book prints, the sections tile the term without gaps or
 * overlaps, and the first/last sections hit the book's own bounds. A content
 * mistake here would quietly ground the tutor on the wrong pages, so it fails
 * loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ARABIC_G10_T1_UNITS;
  const keys = new Set<string>();
  const kinds = new Set<string>();

  units.forEach((unit, ui) => {
    if (!unit.title.trim()) problems.push(`القسم ${unit.key}: بلا عنوان`);
    if (!unit.printedHead.trim()) problems.push(`القسم ${unit.key}: بلا عنوان مطبوع`);
    if (unit.lessons.length === 0) problems.push(`القسم ${unit.title}: بلا دروس`);

    unit.lessons.forEach((lesson, li) => {
      if (keys.has(lesson.key)) problems.push(`مفتاح درس مكرر: «${lesson.key}»`);
      keys.add(lesson.key);
      const expectedKey = `${unit.key}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`القسم ${unit.key} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (!lesson.title.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان`);
      if (!lesson.printedHead.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان مطبوع`);
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا مكوّنات`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول مكوّن`);
      }

      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((c, ci) => {
        kinds.add(c.kind);
        if (!c.title.trim()) problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: بلا عنوان`);
        if (c.bookFrom < unit.bookFrom || c.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: صفحته ${c.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && c.bookFrom < prev.bookFrom) {
          problems.push(`الدرس ${lesson.key}: صفحات المكوّنات تنازلية (${prev.bookFrom} ثم ${c.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }
      const last = lesson.concepts.at(-1)!;
      if (last.bookFrom < from || last.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: مكوّنه الأخير ${last.bookFrom} خارج نطاقه ${from}–${to}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر القسم ${unit.bookFrom}، وجدنا ${from}`);
      }
    });

    const nextUnit = units[ui + 1];
    if (nextUnit && unit.bookTo >= nextUnit.bookFrom) {
      problems.push(`القسم ${unit.title} يتداخل مع ${nextUnit.title}`);
    } else if (nextUnit && unit.bookTo !== nextUnit.bookFrom - 1) {
      problems.push(`فجوة صفحات بين ${unit.title} و${nextUnit.title}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`);
    }
  });

  for (const kind of kinds) {
    if (!COMPONENT_KINDS.has(kind)) problems.push(`نوع مكوّن غير معروف «${kind}»`);
  }

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_ARABIC_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ARABIC_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ARABIC_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ARABIC_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every page of the term carries text and proves its own number — by its
 *     printed foot (allowing the three measured OCR misreads) or, for the three
 *     unit openers that print no folio, by the unit head they anchor;
 *  2. every unit opener prints the unit head, and every lesson's first page its
 *     own printed head;
 *  3. every lesson's title is printed somewhere in the pages it owns, and every
 *     concept's printed head is on its own page;
 *  4. every printed page in [1, 79] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_ARABIC_G10_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ARABIC_G10_T1_BOOK_START || book > EGYPT_ARABIC_G10_T1_BOOK_END) continue;
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
      } else if (footer !== book && footer !== FOOTER_OCR_MISREADS[book]) {
        problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_ARABIC_G10_T1_BOOK_END - EGYPT_ARABIC_G10_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ARABIC_G10_T1_BOOK_START} و${EGYPT_ARABIC_G10_T1_BOOK_END}`,
    );
  }

  // 2 + 3a. every unit opener prints the unit head, every lesson's first page its
  // head, and every lesson's title is printed somewhere in the pages it owns.
  units.forEach((unit, ui) => {
    if (!pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} لا تطبع «${unit.printedHead}»`);
    }

    unit.lessons.forEach((lesson, li) => {
      if (!pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع «${lesson.printedHead}»`);
      }
      const { from, to } = lessonBookRange(ui, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      if (!titlePrinted) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
    });
  });

  // 3b. every concept's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (!pagePrints(c.bookFrom, c.title)) {
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
  for (let p = EGYPT_ARABIC_G10_T1_BOOK_START; p <= EGYPT_ARABIC_G10_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
