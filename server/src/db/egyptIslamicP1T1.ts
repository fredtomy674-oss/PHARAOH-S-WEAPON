// PHASE 82 — official Egypt Preparatory-1 (Grade 7) Islamic Religious Education,
// first term («كتاب الوزارة»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g7-islamic-education` is rebuilt from the Ministry textbook
// (96 PDF pages, born-digital PDF whose text layer scrambles Arabic reading
// order — the OCR backfill regenerates it in full, same as the other born-digital
// books). This module is the single source of truth for its structure: the three
// units and their twenty-one lessons, exactly as the book's المحتويات (book page
// 4) prints them, and the «أهداف الدرس» the book prints at the head of every lesson.
//
// Page mapping (verified against the book's running feet):
//   bookPage = pdfPage  (offset 0 — every content page prints its own number in
//   the running foot, wrapped with «كتاب الطالب …» or «الصف الأول الإعدادي …»,
//   which is what fixes the offset and proves the mapping page by page).
// The unit opener pages (5, 33, 63) print no footer, like the other books' openers.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس», NOT A «مفهوم»
// The book's printed index stops at the lesson; each of its five «مجالات» is a
// numbered lesson (العقيدة، القرآن والتفسير، التجويد، العبادات، السير، القيم),
// so where the index lists two sub-items under «القرآن والتفسير» (the سورة and
// the tajwīd rule) or under «السير والشخصيات» (two stories), the book prints
// them as separate lessons and so does the app — exactly as the Grade-9 Islamic
// book does. Each lesson's concepts are the printed «أهداف الدرس» it puts at its
// head (a list every lesson prints).
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND UNIT REVIEW
// Each unit opens with a one-page opener (title + «أهداف الوحدة» + «دروس
// الوحدة») and closes with «مراجعة على الوحدة»; the last unit also carries the
// final «مراجعة عامة على الفصل الدراسي الأول» (books 94–95). Neither is a
// lesson, so — as in the other Ministry books — the opener rides with the unit's
// first lesson and the review with its last. A lesson's own `bookFrom` is still
// stored; the range it owns is derived as "from the unit's first page, down to
// the page before the next lesson starts, bounded by the unit".
//
// Unit 2 title note: the المحتويات and the opener scramble that title's last word
// into «الوظيفة» (text-layer noise); the running heads on books 34/50/54 print
// «الحفاظ على البيئة والنظافة» — the running head is authoritative, as with the
// Grade-9 book's unit titles.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.5 = PDF p.5). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_ISLAMIC_P1_T1_BOOK_START = 5;

/**
 * Last printed content page — the final «مراجعة عامة على الفصل الدراسي الأول»
 * (books 94–95). The closing بيانات/حقوق page (96) is back matter, not taught.
 */
export const EGYPT_ISLAMIC_P1_T1_BOOK_END = 95;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface IslamicP1T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed at the head of the lesson (without the ordinal). */
  title: string;
  /**
   * First printed book page of the lesson itself. The range the lesson *owns*
   * also includes its unit's opener when it is the unit's first lesson, which is
   * why ownership is derived by `lessonBookRange` rather than stored here.
   */
  bookFrom: number;
  /** The book's printed «أهداف الدرس» for this lesson. */
  concepts: string[];
}

export interface IslamicP1T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "الوحدة الثانية: الحفاظ على البيئة والنظافة". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: IslamicP1T1Lesson[];
}

/**
 * The three units of the first term with their twenty-one lessons: unit/lesson
 * starts from the book's محتويات (page 4) and the unit openers (5, 33, 63);
 * objectives from each lesson's opener page. Verified against every printed page
 * by `assertTreeMatchesTheBook`.
 */
export const EGYPT_ISLAMIC_P1_T1_UNITS: IslamicP1T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: الإسلام دين الرحمة والسلام",
    bookFrom: 5,
    bookTo: 32,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "من أسماء الله الحسنى (المغيث)",
        bookFrom: 6,
        concepts: [
          "يتعرف اسم الله (المغيث) ومعناه.",
          "يذكر الأدلة من القرآن والسنة على اسم الله (المغيث).",
          "يعدّد مظاهر إغاثة الله لخلقه في الحياة.",
          "يطبق مبدأ الاستغاثة بالله في حياته اليومية.",
          "يجيب دعوة الملهوف من خلال أقواله وأفعاله، ويظهر ثقته بأن الله قريب.",
          "يغيث الآخرين متحليًا بخلق الرحمة والإحسان.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "سورة التحريم (الآيات من 1-5) تلاوة وحفظ وتفسير",
        bookFrom: 9,
        concepts: [
          "يتعرف سبب نزول الآيات (1-5) من سورة (التحريم).",
          "يفسّر الكلمات والمفردات الصعبة في الآيات.",
          "يستنتج الدروس المستفادة من هذه الآيات.",
          "يطبق مفهوم عدم تحريم الحلال دون دليل شرعي في حياته.",
          "يظهر شعوره بعظمة رحمة الله بعباده وعفوه عن أخطائهم.",
          "يقتدي بالنبي ﷺ في الرفق والاعتدال في التصرفات.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "علم التجويد وأهميته",
        bookFrom: 12,
        concepts: [
          "يستنتج العلاقة بين التجويد وحسن تلاوة القرآن الكريم.",
          "يطبق الطالب بعض أحكام التجويد في أثناء التلاوة.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "صلاة الجنازة",
        bookFrom: 16,
        concepts: [
          "يتعرف كيفية صلاة الجنازة ومشروعيتها.",
          "يصف صلاة الجنازة وعدد تكبيراتها.",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "قصة الرسول ﷺ مع الوحي",
        bookFrom: 20,
        concepts: [
          "يوضح كيفية نزول الوحي على النبي ﷺ.",
          "يستنتج الحكمة من نزول الوحي على النبي ﷺ بطرق مختلفة.",
          "يتأمل في رحمة الله بإرسال الأنبياء لهداية البشرية.",
          "يظهر تقديره للجهد الذي بذله النبي ﷺ في تبليغ الرسالة رغم المشقة.",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "قصة نبي الله يوسف (عليه السلام) في قصر العزيز",
        bookFrom: 23,
        concepts: [
          "يتعرف حياة نبي الله يوسف في قصر العزيز.",
          "يوضح الابتلاءات التي واجهها يوسف في هذه المرحلة.",
          "يستنتج القيم التربوية والأخلاقية من القصة.",
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        title: "الإسلام دين الرحمة والسلام",
        bookFrom: 27,
        concepts: [
          "يوضح معنى الرحمة والسلام في الإسلام.",
          "يتعرف نماذج من رحمة النبي ﷺ وسعة الإسلام.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: الحفاظ على البيئة والنظافة",
    bookFrom: 33,
    bookTo: 62,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "من أسماء الله الحسنى (الكريم)",
        bookFrom: 34,
        concepts: [
          "يتعرف فوائد التخلق بالكرم.",
          "يتعرف معنى اسم الله «الكريم»، ومظاهر كرمه «عز وجل» على خلقه.",
          "يستنتج العلاقة بين كرم الله وقدرته في تدبير الكون.",
          "يدلل من القرآن الكريم والسنة النبوية على كرم الله (تعالى).",
          "يحلل بعض المواقف الحياتية التي تُظهر كرم الله.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "سورة التحريم (الآيات 6-12) تلاوة وحفظ وتفسير",
        bookFrom: 39,
        concepts: [
          "يحدد معاني الكلمات الواردة في الآيات (6-12).",
          "يستخلص الدروس والعبر والقيم المستفادة من الآيات.",
          "يحلل سبب ضرب الله أمثلةً بالنساء في هذه الآيات.",
          "يربط بين مضمون الآيات وسلوكياته في الحياة اليومية.",
          "يستنتج مكانة المرأة في الإسلام من خلال النموذج المذكور في الآيات.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "الحروف الحلقية",
        bookFrom: 43,
        concepts: [
          "يتعرف مفهوم مخارج الحروف.",
          "يتعرف مخارج الحروف (ء – هـ – ع – ح – غ – خ).",
          "يخرج الحروف (ء – هـ – ع – ح – غ – خ) من مخارجها الصحيحة.",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "رخص الإسلام في الطهارة",
        bookFrom: 45,
        concepts: [
          "يتعرف كيفية التيمم وحكمه وشروطه.",
          "يتعرف كيفية المسح على الخفين وأحكامه.",
          "يميز بين حالات استخدام التيمم والمسح على الخفين.",
          "يطبق التيمم والمسح على الخفين عمليًا.",
          "يستنتج رحمة الإسلام وتيسيره في العبادات.",
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        title: "بيعتا العقبة الأولى والثانية",
        bookFrom: 50,
        concepts: [
          "يتعرف مفهوم البيعة في الإسلام.",
          "يتعرف أحداث بيعتي العقبة الأولى والثانية.",
          "يقارن بين بيعتي العقبة الأولى والثانية.",
          "يستنتج أهمية البيعة في تأسيس الدولة الإسلامية.",
          "يتحلى بروح النصرة والوفاء بالعهد.",
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        title: "نبي الله أيوب",
        bookFrom: 54,
        concepts: [
          "يتعرف قصة نبي الله أيوب.",
          "يستخلص الدروس المستفادة من صبر أيوب.",
          "يتحلى بالصبر عند الشدائد.",
        ],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        title: "منهج الإسلام في الحفاظ على البيئة",
        bookFrom: 57,
        concepts: [
          "يتعرف مفهوم البيئة في الإسلام.",
          "يستنتج أهمية الحفاظ على الموارد الطبيعية، خاصة الماء.",
          "يدلل على حث الإسلام على عدم الإسراف في الماء.",
          "يلتزم بسلوكيات ترشيد الاستهلاك.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: من الآداب الإسلامية",
    bookFrom: 63,
    bookTo: 95,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "من أسماء الله الحسنى (الحكيم)",
        bookFrom: 64,
        concepts: [
          "يتعرف معنى اسم الله (الحكيم).",
          "يستنتج العلاقة بين حكمة الله وقدرته في تدبير الكون.",
          "يوضح كيف تتجلى حكمة الله في تصريف أمور الحياة.",
          "يربط بين الإيمان بحكمة الله والصبر على الأقدار.",
          "يذكر بعض الأمثلة من القرآن الكريم والسنة النبوية التي تدل على حكمة الله.",
          "يسلك سلوكيات تؤكد يقينه بعدل الله ورحمته.",
          "يلتزم بالصبر والتوكل على الله في جميع أمور حياته.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "سورة الطلاق (الآيات من 1-7) تلاوة وحفظ وتفسير",
        bookFrom: 68,
        concepts: [
          "يوضح المعنى العام للآيات (1-7) من سورة (الطلاق).",
          "يربط بين السلوك الإسلامي والاستقرار الأسري.",
          "يستنتج الحكمة من التشريعات الإسلامية الخاصة بالطلاق.",
          "يبين أثر التقوى في تيسير أمور الحياة.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "مخارج الحروف من اللسان",
        bookFrom: 73,
        concepts: [
          "يتعرف الحروف التي تخرج من مخرج اللسان.",
          "يحدد أجزاء اللسان التي تخرج منها الحروف.",
          "يخرج الحروف من مخرج اللسان من مخارجها الصحيحة.",
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        title: "من أحكام الصلاة",
        bookFrom: 75,
        concepts: [
          "يتعرف شروط وجوب الصلاة وأركانها وسننها ومبطلاتها.",
          "يميز بين شروط وجوب الصلاة وأركانها وسننها.",
          "يعرف بقيمة الصلاة لجلب الطمأنينة والسكينة للقلب.",
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        title: "منهج الرسول ﷺ في بناء الدولة الإسلامية",
        bookFrom: 78,
        concepts: [
          "يتعرف أهم الأسس التي وضعها الرسول ﷺ لبناء الدولة الإسلامية.",
          "يستنتج دعائم بناء المجتمع.",
          "يدرك أهمية المؤاخاة بين المهاجرين والأنصار كأحد دعائم المجتمع الإسلامي.",
          "يتعرف دور ميثاق المدينة في تنظيم العلاقات بين فئات المجتمع.",
          "يحلل أسباب نجاح النبي ﷺ في تأسيس دولة قوية.",
          "يقارن بين مبادئ بناء الدولة في الإسلام والمبادئ الحديثة.",
          "يستخرج القيم المستفادة من تجربة النبي ﷺ في بناء المجتمع الإسلامي.",
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        title: "قصة أصحاب الكهف",
        bookFrom: 82,
        concepts: [
          "يتعرف قصة أصحاب الكهف كما وردت في القرآن الكريم.",
          "يقارن بين مواقف مشابهة من التاريخ أو الواقع لقصة أصحاب الكهف.",
          "يدرك حكمة الله في حفظ الفتية وإعجاز بقائهم نائمين لسنوات طويلة.",
          "يتعلم كيف واجه الفتية الطغيان بالإيمان والثبات على الحق.",
          "يقدر نعمة الإيمان بالله والثقة بحكمته في تدبير الأمور.",
        ],
      },
      {
        key: "3-7",
        ordinal: "السابع",
        title: "من الآداب الإسلامية",
        bookFrom: 87,
        concepts: [
          "يوضح أهمية آداب المجالس في الإسلام.",
          "يتعرف دعاء كفارة المجلس ومعناه.",
          "يطبق آداب الجوار في مواقف الحياة اليومية.",
          "يتعامل مع جاره بلطف وإحسان كما أوصى الإسلام.",
          "يعدّد صفات الصديق الصالح، ويعرف تأثير الصحبة الصالحة في حياة الإنسان.",
          "يتحلى بحسن الخلق في المجالس.",
          "يستنتج أثر آداب المجالس على العلاقات الاجتماعية.",
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
 * belong to — and lands the unit review / final assessment on the last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ISLAMIC_P1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ISLAMIC_P1_T1_UNITS.forEach((unit, ui) => {
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
  "islamic-p1-t1",
);

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
// PHASE 82 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"; // U+0660..U+0669
const EXT_AR_DIGITS = "۰۱۲۳۴۵۶۷۸۹"; // U+06F0..U+06F9

/**
 * Arabic-Indic digits → Latin. The book mixes Eastern (٠–٩) and Extended
 * Arabic-Indic (۰–۹) digits from page to page, so both ranges are mapped.
 */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints in its running foot, or null when the
 * page prints no footer (the unit openers 5/33/63). The foot wraps the number
 * with the school title («…كتاب الطالب ٦») or the class title («٩٥ الصف الأول
 * الإعدادي - الفصل الدراسي الأول») flip-flopped, so the last line is accepted
 * only when it carries the number next to one of those labels — a content line
 * that merely ends in a number is not mistaken for the foot.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  const latin = toLatinDigits(last.normalize("NFKC"));

  const tail = latin.match(/(الطالب|التلميذ)\s*-?\s*(\d+)\s*$/);
  if (tail) return Number(tail[2]);

  const head = latin.match(/^\s*(\d+)\s*-?\s*(الصف|الوحدة)/);
  if (head) return Number(head[1]);

  const dashTail = latin.match(/-\s*(\d+)\s*$/);
  if (dashTail && /الطالب|التلميذ|الصف|الوحدة/.test(latin)) return Number(dashTail[1]);

  return null;
}

/**
 * OCR noise the reading of a footer can slip into (book page → printed number
 * read). Empty for the current corpus; filled from any repeated findings
 * `assertTreeMatchesTheBook` reports while the OCR backfill lands.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * Strips everything but letters and digits, so OCR spacing cannot break a match.
 * NFKC first: the text-layer corpus carries Arabic presentation forms, and it is
 * a no-op on the backfilled Gemini output. The ي/ى fold lets a clean title match
 * the glyphs the book actually prints. The «ﷺ» honorific ligature is dropped so
 * a title like «قصة الرسول ﷺ مع الوحي» and the head that prints the symbol
 * between the words still match.
 */
function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/\uFDFA/g, "")
    // The book prints Arabic-Indic digits (١–٥) in titles; fold them to Latin so a
    // title like «سورة التحريم (الآيات من 1-5)» matches the printed head.
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[ي]/g, "ى")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ISLAMIC_P1_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_ISLAMIC_P1_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_ISLAMIC_P1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ISLAMIC_P1_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_ISLAMIC_P1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the offset and proves the mapping page by page;
 *  2. every content page carries real OCR text;
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

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ISLAMIC_P1_T1_BOOK_START || book > EGYPT_ISLAMIC_P1_T1_BOOK_END) continue;
    printedPages.add(book);
    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    const footer = printedFooter(book);
    if (footer !== null) {
      footersChecked++;
      const misread = FOOTER_OCR_MISREADS[book];
      if (footer !== book && footer !== misread) {
        problems.push(`صفحة الكتاب ${book}: الفوتر المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_ISLAMIC_P1_T1_BOOK_END - EGYPT_ISLAMIC_P1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ISLAMIC_P1_T1_BOOK_START} و${EGYPT_ISLAMIC_P1_T1_BOOK_END}`,
    );
  }
  if (files.length === 0) problems.push(`لا يوجد نسيج OCR لكتاب التربية الدينية الإسلامية (${OCR_DIR}) — مطلوب مسح الكتاب أولًا`);
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title.
  EGYPT_ISLAMIC_P1_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      if (!normalize(opener).includes(normalize(lesson.title))) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع عنوانه «${lesson.title}»`);
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