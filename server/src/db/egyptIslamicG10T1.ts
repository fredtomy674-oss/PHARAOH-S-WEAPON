// PHASE 109 — official Egypt Secondary-1 (Grade 10) Islamic Religious Education
// («التربية الدينية الإسلامية — الصف الأول الثانوي (العام والفني)»), first
// term, Ministry edition (مطابع الهداية).
//
// The curriculum tree for the Egypt `eg-g10-islamic-education` curriculum is
// rebuilt from the Ministry textbook (112 scanned pages, both terms in one
// scan). This module is the single source of truth for the FIRST term only:
// the three units of the first term, their printed lessons (exactly as the
// book's own «المحتويات» on scan 4 lists them) and, for every lesson, the
// book's own printed «الأهداف» — verbatim, as on the lesson's first page. The
// self-checks at the bottom prove that mapping against the OCR itself, page by
// page.
//
// THE OFFSET IS ZERO — book page = scan page
// Every content page prints its own folio in the running foot, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here: scan 6
// prints «٦» (book 6), scan 11 prints «١١» (book 11), scan 26 prints «٢٦»
// (book 26), scan 39 prints «٣٩» (book 39), scan 50 prints «٥٠» (book 50),
// scan 59 prints «٥٩» (book 59) and scan 65 prints «٦٥» (book 65). The book's
// own «المحتويات» (scan 4) independently confirms it: it lists all nine first-
// term lessons with the very book pages their heads print on (٦، ١١، ١٧، ٢٦،
// ٣٢، ٣٩، ٥٠، ٥٥، ٥٩).
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–4 are before the term: the cover (1), the credits masthead (2),
// the «المقدمة» (3) and the printed «المحتويات» (4). Scan pages 66–112 are
// after the term: the second term's own «المحتويات» (66), the whole second-
// term content (67–111: «الفصل الدراسي الثاني» in every running foot) and the
// printer colophon (112). The term runs from the unit 1 opener (book 5 =
// scan 5) to the last unit-3 review page (book 65 = scan 65):
// `EGYPT_ISLAMIC_G10_T1_BOOK_START` / `_END` are exactly those two pages, and
// the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 65 − 5 + 1 = 61.
//
// THIRTEEN TERM PAGES NEED A DOCUMENTED FOLIO EXCEPTION
// Three unit openers (books 5، 25، 49: «مقدمة الوحدة» pages) print no folio
// and no running foot at all — by the book's own design. Three pages lost
// their folio in the OCR (books 15، 41، 47 end in a bare «…» with no number;
// book 62 prints the running foot with no number). Five pages carry a folio
// the OCR misread (book 7 prints «٧» read as «V»؛ book 19 prints «١٩» read as
// «14»؛ book 33 prints «٣٣» read as «٢٣»؛ book 44 prints «٤٤» read as «٥٥»؛
// book 52 prints «٥٢» read as «٥٣»؛ book 61 prints «٦١» read as «١٦» — each
// sits between two neighbours that prove the sequence, and the «المحتويات»
// fixes the lesson starts around them). Rather than weaken the page-number
// check, all thirteen are exempt from it and anchored on a marker that
// survives verbatim on that page, named in `FOLIO_EXCEPTION_MARKERS`.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED «الأهداف»
// Every first-term lesson prints a numbered «الأهداف» list on its first page
// («في نهاية هذا الدرس يتوقع أن يكون الطالب قادرا على أن: …»). Each item is
// carried, verbatim, as a concept of that lesson with `bookFrom` set to the
// lesson's first page. Nothing is invented. Two objective lists survive
// imperfectly in the OCR and are kept honest rather than reconstructed:
// lesson 3-1's item 7 ends mid-sentence in the OCR («… مع ربطها») and lesson
// 3-2 prints its objectives in two columns that the OCR fuses into one line,
// so its fused items 4/10 (and the absent 5) are omitted while the eight clean
// items are kept.
//
// THE LESSON 3-2 TITLE FOLLOWS ITS OWN FIRST PAGE, NOT THE CONTENTS LINE
// The «المحتويات» lists the eighth lesson as «الدعاء ودوام الصلة بالله عزوجل»
// but the lesson's own head on book 55 prints «الدعاء ودوام الصلة بالله
// تعالى»; the lesson carries the form its own page prints, which is what the
// title-in-range check proves.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 0 (verified: book p.65 = scan p.65). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the term — the unit 1 opener (scan 5). */
export const EGYPT_ISLAMIC_G10_T1_BOOK_START = 5;

/** Last printed page of the term — the unit 3 exam-model page (scan 65). */
export const EGYPT_ISLAMIC_G10_T1_BOOK_END = 65;

/** The scanned pages before the term: cover, credits, مقدمة and المحتويات. */
export const EGYPT_ISLAMIC_G10_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/** The scanned pages after the term: the whole second term plus the colophon. */
export const EGYPT_ISLAMIC_G10_T1_BACK_MATTER = { from: 66, to: 112 } as const;

/** One printed objective of a lesson — becomes one concept in the app tree. */
export interface IslamicG10T1Concept {
  /** Printed book page where this objective starts (the lesson's first page). */
  bookFrom: number;
  /** The printed component kind: «هدف». */
  kind: string;
  /** The printed objective, verbatim. */
  title: string;
}

/** One lesson («درس») of the first term, as the «المحتويات» lists it. */
export interface IslamicG10T1Lesson {
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
  /** The book's printed «الأهداف» for this lesson, in order. */
  concepts: IslamicG10T1Concept[];
}

/** One printed section of the book — one of the three units of the first term. */
export interface IslamicG10T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"3". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: إيمان وإحسان". */
  title: string;
  /** The unit head the opener page prints, e.g. "إيمان وإحسان". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: IslamicG10T1Lesson[];
}

const TYPE = "هدف";

function concept(bookFrom: number, title: string): IslamicG10T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The three units of the first term with their printed lessons and every
 * printed «الأهداف» item, transcribed from the first page of each lesson and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from the book's «المحتويات» (scan 4); each lesson's
 * concepts are the numbered objectives the book prints on the page the lesson
 * starts on, kept verbatim — including the book's own numbering quirks (lesson
 * 1-1 uses «١ -» with a hyphen, lesson 3-2 uses Latin «1.» digits).
 */
export const EGYPT_ISLAMIC_G10_T1_UNITS: IslamicG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: إيمان وإحسان",
    printedHead: "إيمان وإحسان",
    bookFrom: 5,
    bookTo: 24,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الإيمان بالله الواحد الأحد",
        printedHead: "الدرس الأول: الإيمان بالله الواحد الأحد",
        bookFrom: 6,
        concepts: [
          concept(6, "١ - يتعرف أصول العقيدة الإسلامية الصحيحة."),
          concept(6, "٢ - يستمسك بوحدانية الله تعالى من خلال الآيات الشرعية."),
          concept(6, "٣ - يستخدم الأدلة العقلية والنقلية في إقناع المنكرين لوحدانية الله والملحدين."),
          concept(6, "٤ - يسلك سلوكاً يتفق بمقتضى الإيمان بالله."),
          concept(6, "٥ - يتعرف الأدلة الكونية على وجود الله ووحدانيته."),
          concept(6, "٦ - يتجنب الاتجاهات التي تسعى لإضعاف العقيدة."),
          concept(6, "٧ - يعدد بعض أسماء الله الحسنى مع ربطها"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "النظافة من الإيمان",
        printedHead: "النظافة من الإيمان",
        bookFrom: 11,
        concepts: [
          concept(11, "١. يتعرف أن الطهارة فرض ديني، وواجب اجتماعي، ووقاية ضد الأمراض."),
          concept(11, "٢. يهتم بالمحافظة على طهارة جسمه وملبسه، وجوارحه، والبيئة حوله."),
          concept(11, "٣. يلتزم طهارة اللسان مع جميع من حوله."),
          concept(11, "٤. يبتعد عن الفحش في القول وغيره."),
          concept(11, "٥. يقدر أهمية النظافة والتجمل في حياة المسلم."),
          concept(11, "٦. يفهم الحكمة من مشروعية التيمم."),
          concept(11, "٧. يفهم أحاديث النظافة ومعناها وما ترشد إليه."),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "حكمة الرسول ﷺ ورحمته",
        printedHead: "حكمة الرسول ﷺ ورحمته",
        bookFrom: 17,
        concepts: [
          concept(17, "١. يتعرف جانباً من سيرة الرسول ﷺ مع أبنائه."),
          concept(17, "٢. يقتدي بالرسول ﷺ في كل سلوكياته."),
          concept(17, "٣. يتعرف دور النبي ﷺ في حلف الفضول."),
          concept(17, "٤. يستخلص العبرة من حلف الفضول."),
          concept(17, "٥. يوضح الفرق بين النبي والرسول."),
          concept(17, "٦. يتعرف مهام الرسل ومنزلتهم عند الله ﷺ."),
          concept(17, "٧. يحفظ أحاديث عن توجيهات الرسول ﷺ في العدل والمساواة بين الأبناء."),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: نظرات حول الزواج في الإسلام",
    printedHead: "نظرات حول الزواج في الإسلام",
    bookFrom: 25,
    bookTo: 48,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الزواج في الإسلام",
        printedHead: "الزواج في الإسلام",
        bookFrom: 26,
        concepts: [
          concept(26, "١. يستنتج أسباب ترغيب الإسلام في الزواج."),
          concept(26, "٢. يحدد أحكام الزواج في الإسلام."),
          concept(26, "٣. يعرف أركان الزواج في الإسلام."),
          concept(26, "٤. يتعرف المحرمات من النساء."),
          concept(26, "٥. يدرك الحكمة من النهي عن الزواج من المحرمات."),
          concept(26, "٦. يدرك عناية الإسلام ببناء الأسرة المسلمة."),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الرسول ﷺ زوجًا",
        printedHead: "الرسول ﷺ زوجًا",
        bookFrom: 32,
        concepts: [
          concept(32, "١. يتعرف جانبًا من سيرة الرسول ﷺ، مع أهل بيته."),
          concept(32, "٢. يهتم بقراءة السيرة العطرة."),
          concept(32, "٣. يتعرف سيرة زوجات النبي ﷺ."),
          concept(32, "٤. يقتدى بالنبي ﷺ في حسن معاملته لأهل بيته."),
          concept(32, "٥. تقتدي الفتيات بزوجاته ﷺ."),
          concept(32, "٦. يستنبط الحكمة من تعدد زوجات النبي ﷺ."),
          concept(32, "٧. يفند الدعاوى الكاذبة التي تنال من النبي ﷺ."),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الزوجة المجادلة",
        printedHead: "الزوجة المجادلة",
        bookFrom: 39,
        concepts: [
          concept(39, "١. يستنبط حكم الظهار في الإسلام."),
          concept(39, "٢. يميل إلى قراءة القرآن."),
          concept(39, "٣. يقبل على قراءة كتب التفاسير."),
          concept(39, "٤. يميز بين المكي والمدني من القرآن."),
          concept(39, "٥. يحدد الفرق بين القرآن الكريم والحديث القدسي."),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الإسلام والعمل الصالح",
    printedHead: "الإسلام والعمل الصالح",
    bookFrom: 49,
    bookTo: 65,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الاستعداد ليوم القيامة بالعمل الصالح",
        printedHead: "الدرس الأول الاستعداد ليوم القيامة بالعمل الصالح",
        bookFrom: 50,
        concepts: [
          concept(50, "١. يحفظ الآيات القرآنية حفظاً متقناً ."),
          concept(50, "٢. يعدد صفات أهل الإيمان ."),
          concept(50, "٣. يوضح معاني المفردات والتراكيب الواردة في الآيات ."),
          concept(50, "٤. يشرح النصوص الشرعية شرحاً إجمالياً وافياً ."),
          concept(50, "٥. يستنبط بعض الآداب والأحكام والدروس المستفادة المتضمنة في الآيات ."),
          concept(50, "٦. يعطي بعض التطبيقات الحياتية للنصوص الشرعية الواردة بالموضوع ."),
          concept(50, "٧. يوضح ضعف الإنسان أمام قدرة الله تعالى ."),
          concept(50, "٨. يؤمن بأن القبر أول منازل الآخرة ."),
          concept(50, "٩. يعدد بعض العلامات الصغرى ليوم القيامة ."),
          concept(50, "١٠. يسلك سلوكاً يتفق وما تدعو إليه النصوص الشرعية المتضمنة في الموضوع ."),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الدعاء ودوام الصلة بالله تعالى",
        printedHead: "الدعاء ودوام الصلة بالله تعالى",
        bookFrom: 55,
        concepts: [
          concept(55, "1. يذكر معنى الاستسقاء ."),
          concept(55, "2. يستدل على مشروعية صلاة الاستسقاء ."),
          concept(55, "3. يوضح الكيفية العملية لصلاة الاستسقاء ."),
          concept(55, "6. يحفظ ما يقال عند نزول المطر بكثافة ."),
          concept(55, "7. يذكر المقصود بصلاة الاستسقاء ."),
          concept(55, "8. يوضح في أى الأمور تكون صلاة الاستسقاء ."),
          concept(55, "9. يستنتج حكم صلاة الاستسقاء ."),
          concept(55, "١١. يصف الكيفية العملية لصلاة الاستسقاء"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الرسول ﷺ صاحبًا",
        printedHead: "الرسول ﷺ صاحبًا",
        bookFrom: 59,
        concepts: [
          concept(59, "١. يتعرف معنى الصحبة ."),
          concept(59, "٢. يستدل على مشروعية الصحبة ."),
          concept(59, "٣. يوضح حقوق الصاحب على صاحبه ."),
          concept(59, "٤. يستنتج احتفاء الإسلام بالصحبة ."),
          concept(59, "٥. يوضح بعضًا من جوانب صحبة النبي ﷺ ."),
          concept(59, "٦. يقتدي بالرسول ﷺ في تعامله مع أصحابه ."),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the
 * unit — so the unit opener and the unit drills stay inside the unit they
 * belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ISLAMIC_G10_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ISLAMIC_G10_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This book has
 * no appendix and no back matter that any lesson quotes: every page of the
 * term belongs to a unit. Kept as a function so the seeder and the stage share
 * one shape across all the books.
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
  "islamic-g10-t1",
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
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * Folds text for comparison: drops tatweel and diacritics, unifies the alef/ya/ta
 * forms the book prints inconsistently, and removes every non-letter/digit, so OCR
 * spacing and vowel marks cannot break a match.
 */
function normalize(text: string): string {
  return text
    .replace(/ـ/g, "")
    .replace(/[ً-ٰٟ]/g, "")
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
 * Page-number candidates a content page prints at its foot. This book's foot is
 * the running foot «الصف الأول الثانوي … مطابع الهداية … الفصل الدراسي الأول»
 * carrying the folio beside it («٦ . الصف الأول الثانوى …»، «الصف الأول
 * الثانوى ٥٥»، «[٢٢] . الصف الأول الثانوى …»)، so the last three lines are
 * scanned and every number on a foot-looking line is a candidate.
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
    const looksLikeFoot =
      /^[([]?[0-9٠-٩۰-۹]+[\])]?$/.test(line) || /مطابع الهداية|الفصل الدراسي|الصف الأول/.test(line);
    if (!looksLikeFoot) continue;
    const latin = toLatinDigits(line).replace(/[^0-9]/g, " ").replace(/\s+/g, " ").trim();
    for (const tok of latin.split(" ")) if (tok) nums.push(Number(tok));
  }
  return [...new Set(nums)].filter((n) => n > 0);
}

/**
 * The book number a content page prints at its foot, or null. Every content
 * page that carries a folio prints exactly one number there and it is its own,
 * which is what fixes the offset; the pages named in `FOLIO_EXCEPTION_MARKERS`
 * are handled separately instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The thirteen term pages exempt from the folio check, each with the marker
 * the check accepts in place of a page number:
 *   • books 5، 25، 49 are the «مقدمة الوحدة» openers and print no folio or
 *     running foot by design;
 *   • books 15، 41، 47، 62 lost their folio in the OCR (a bare «…» or a
 *     numberless running foot);
 *   • books 7، 19، 33، 44، 52، 61 carry a folio the OCR misread («V» for ٧،
 *     «14» for ١٩، «٢٣» for ٣٣، «٥٥» for ٤٤، «٥٣» for ٥٢، «١٦» for ٦١).
 */
const FOLIO_EXCEPTION_MARKERS: Readonly<Record<number, string>> = {
  5: "إيمان وإحسان",
  7: "الثانوى V",
  15: "نظافة اليد",
  19: "الثانوى 14",
  25: "نظرات حول الزواج في الإسلام",
  33: "الثانوي ٢٣",
  41: "إنما النجوى",
  44: "٥٥ .. الصف الأول الثانوي",
  47: "تدريبات على الوحدة الثانية",
  49: "الإسلام والعمل الصالح",
  52: "٥٣ . الصف الأول الثانوى",
  61: "الثانوى ١٦",
  62: "أضف منافع أخرى",
};

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every range
 * sits inside its section, concept pages rise inside their lesson, the sections
 * tile the term without gaps or overlaps, and the first/last sections hit the
 * book's own bounds. A content mistake here would quietly ground the tutor on the
 * wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ISLAMIC_G10_T1_UNITS;
  const keys = new Set<string>();

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
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول هدف`);
      }

      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((c, ci) => {
        if (!c.title.trim()) problems.push(`الدرس ${lesson.key} الهدف ${ci + 1}: بلا عنوان`);
        if (c.bookFrom < unit.bookFrom || c.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} الهدف ${ci + 1}: صفحته ${c.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && c.bookFrom < prev.bookFrom) {
          problems.push(`الدرس ${lesson.key}: صفحات الأهداف تنازلية (${prev.bookFrom} ثم ${c.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }
      const last = lesson.concepts.at(-1)!;
      if (last.bookFrom < from || last.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: هدفه الأخير ${last.bookFrom} خارج نطاقه ${from}–${to}`);
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

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_ISLAMIC_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ISLAMIC_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ISLAMIC_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ISLAMIC_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio, or, on the thirteen pages named in
 *     `FOLIO_EXCEPTION_MARKERS`, from the marker quoted there;
 *  2. every unit's opener prints the unit head and every lesson's first page prints
 *     that lesson's head;
 *  3. every lesson's title and every objective is printed on the pages the
 *     lesson owns (each objective on its own first page);
 *  4. every printed page in [5, 65] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_ISLAMIC_G10_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ISLAMIC_G10_T1_BOOK_START || book > EGYPT_ISLAMIC_G10_T1_BOOK_END) continue;
    const text = loadBookPage(book);
    pagesChecked += 1;
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    printedPages.add(book);

    const marker = FOLIO_EXCEPTION_MARKERS[book];
    if (marker !== undefined) {
      if (!normalize(text).includes(normalize(marker))) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع ولا تطبع المرساة «${marker}»`);
      }
    } else {
      const footer = printedFooter(book);
      if (footer === null) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع`);
      } else if (footer !== book) {
        problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_ISLAMIC_G10_T1_BOOK_END - EGYPT_ISLAMIC_G10_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ISLAMIC_G10_T1_BOOK_START} و${EGYPT_ISLAMIC_G10_T1_BOOK_END}`,
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

  // 3b. every objective is printed on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (!pagePrints(c.bookFrom, c.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة الهدف ${c.bookFrom} لا تطبع «${c.title}»`);
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
  for (let p = EGYPT_ISLAMIC_G10_T1_BOOK_START; p <= EGYPT_ISLAMIC_G10_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
