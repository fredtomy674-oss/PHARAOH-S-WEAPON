// PHASE 82 — official Egypt Preparatory-3 (Grade 9) Islamic Religious Education,
// first term («كتاب الوزارة»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g9-islamic-education` is rebuilt from the Ministry textbook
// `Islamic_Education_Prep3_T1.pdf` (82 scan pages, all OCR'd). This module is the
// single source of truth for its structure: the three units and their twenty-one
// lessons, exactly as the book's المحتويات (book page 5) prints them, and the
// «أهداف الدرس» the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 1   (book page 10 = PDF page 11)
// Every content page carries its own number in the running foot — mostly wrapped
// with the unit title («٣٤ الوحدة الثانية: الإسلام دين وحياة») or the school
// title («الصف الثالث الإعدادي - الفصل الدراسي الأول ٩»), sometimes alone — which
// is what fixes the offset at 1 and proves the mapping page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس», NOT A «مفهوم»
// The book's printed index stops at the lesson; each of its five «مجالات» is a
// numbered lesson (العقيدة، القرآن والتفسير، التجويد، العبادات، السير، القيم),
// so where the index lists two sub-items under «القرآن والتفسير» (the سورة and
// the tajwīd rule) or under «السير والشخصيات», the book prints them as separate
// lessons and so does the app — exactly as the Grade-6 Islamic book does. Each
// lesson's concepts are the printed «أهداف الدرس» it puts at its head (a list
// every lesson prints).
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND UNIT REVIEW
// Each unit opens with a one-page opener (title + «أهداف الوحدة» + «دروس
// الوحدة») and closes with «مراجعة على الوحدة»; the last unit also carries the
// final «مراجعة عامة على الفصل الدراسي الأول». Neither is a lesson, so — as in
// the other Ministry books — the opener rides with the unit's first lesson and
// the review with its last. A lesson's own `bookFrom` is still stored; the range
// it owns is derived as "from the unit's first page, down to the page before the
// next lesson starts, bounded by the unit".

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.10 = PDF p.11). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_ISLAMIC_G9_T1_BOOK_START = 5;

/** Last printed content page — the final «مراجعة عامة على الفصل الدراسي الأول». */
export const EGYPT_ISLAMIC_G9_T1_BOOK_END = 79;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface IslamicG9T1Lesson {
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

export interface IslamicG9T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "الوحدة الثانية: الإسلام دين وحياة". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: IslamicG9T1Lesson[];
}

/**
 * The three units of the first term with their twenty-one lessons: unit/lesson
 * starts from the book's contents page (5), objectives from each lesson's first
 * page (6, 10, …). Verified against every printed page by
 * `assertTreeMatchesTheBook`.
 */
export const EGYPT_ISLAMIC_G9_T1_UNITS: IslamicG9T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: قيم الإسلام في بناء الفرد والمجتمع",
    bookFrom: 5,
    bookTo: 28,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "من أسماء الله الحسنى: الغفور",
        bookFrom: 6,
        concepts: [
          "يتعرف اسم الله (الغفور) وفهم معناه من خلال الآيات والأحاديث.",
          "يدرك سعة مغفرة الله لعباده.",
          "يربط اسم الله (الغفور) بالقيم العملية في حياة المسلم، مثل: التسامح، ستر العيوب، نصح المخطئ برفق.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "سورة الحشر الآيات (١-١٠)",
        bookFrom: 10,
        concepts: [
          "يفسر مظاهر تسبيح الكون لله الواردة في الآية الأولى، مدركًا عظمة الله في خلقه وتدبيره.",
          "يذكر الأسباب التي أدت إلى إجلاء يهود بني النضير، مستنتجًا سنن الله في نصرة المؤمنين وخذلان الظالمين.",
          "يظهر فهمه إلى أن قوة الظالمين لا تحميهم من عقاب الله (تعالى).",
          "يستنتج الحكمة من توزيع الفيء في الإسلام، ودوره في تحقيق العدالة الاجتماعية وتقوية أواصر المجتمع.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "المد المنفصل بسبب الهمزة",
        bookFrom: 14,
        concepts: [
          "يشرح مفهوم المد المنفصل وأهمية تطبيقه في تلاوة القرآن الكريم.",
          "يتعرف القواعد المتعلقة بالمد المنفصل وتمييزه عن غيره من أنواع المد.",
          "يطبق المد المنفصل في تلاوة الآيات القرآنية تطبيقًا سليمًا.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "الغسل",
        bookFrom: 16,
        concepts: [
          "يعرف الغسل تعريفًا صحيحًا.",
          "يميز بين الغسل والوضوء من حيث السبب والطريقة.",
          "يعدد موجبات الغسل الواردة في النص.",
          "يتعرف سنن الغسل.",
          "يوضح الأمور التي يحرم على الجنب القيام بها قبل الغسل.",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "التخطيط والأخذ بالأسباب في حياة الرسول",
        bookFrom: 19,
        concepts: [
          "يستنتج من سيرة النبي أهمية التخطيط والإعداد المسبق في جميع شئون الحياة.",
          "يتعرف مفهوم التوكل على الله والأخذ بالأسباب تعريفًا صحيحًا.",
          "يذكر مواقف من حياة الرسول تُظهر الجمع بين التوكل والتخطيط، مثل الهجرة وغزوة بدر.",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "الإمام أبو حنيفة",
        bookFrom: 22,
        concepts: [
          "يتعرف سيرة أحد أئمة الإسلام الكبار، الإمام أبي حنيفة النعمان.",
          "يعد فضائل الإمام أبي حنيفة في خدمة الشريعة الإسلامية.",
          "يعرض ملامح شخصية الإمام أبي حنيفة العلمية والأخلاقية.",
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        title: "المسلم مثابر على الطاعات",
        bookFrom: 25,
        concepts: [
          "يظهر -من خلال أقواله وأفعاله- قيمة المثابرة في العبادة والطاعة.",
          "يتعرف أن الاستمرار على الطاعات -وإن كانت قليلة- أحب إلى الله من الانقطاع بعد النشاط.",
          "يدرك أن الثبات على الطاعات طريق للجنة، وأن المسلم لا يفرط فيها مهما تغيرت ظروفه.",
          "يربط بين المثابرة وحب الله ورضوانه.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: الإسلام دين وحياة",
    bookFrom: 29,
    bookTo: 55,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "أقوال لا تنسجم مع أخلاق المؤمن",
        bookFrom: 30,
        concepts: [
          "يتعرف خطورة بعض الأقوال التي قد تجري على ألسنة الناس دون وعي، لكنها لا تليق بالمؤمن ولا تنسجم مع أخلاقه.",
          "يوضح خطورة الكلام في الدين بغير علم وآثاره على الفرد والمجتمع.",
          "يتخير الكلام الطيب الذي يرضي الله.",
          "يظهر مراقبته الله في أقواله.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "سورة الحشر الآيات من (11-24)",
        bookFrom: 35,
        concepts: [
          "يتعرف معاني مفردات الآيات (11 - 24) في سورة الحشر.",
          "يفهم المعاني الأساسية لهذه الآيات وتطبيقاتها في الحياة اليومية.",
          "يستنبط الدروس المستفادة من الآيات.",
          "يتلو الآيات (11 - 24) تلاوة صحيحة.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "المد العارض للسكون",
        bookFrom: 39,
        concepts: [
          "يتعرف مفهوم المد العارض للسكون.",
          "يميز المد الطبيعي من المد العارض للسكون.",
          "يطبق المد العارض للسكون تطبيقًا صحيحًا عند التلاوة.",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "الأوقات المنهي عن الصلاة فيها",
        bookFrom: 41,
        concepts: [
          "يتعرف الأوقات التي نهى الشرع عن أداء الصلاة فيها.",
          "يميز الأوقات المنهي عن الصلاة فيها عن غيرها من الأوقات المشروعة.",
          "يظهر وعيه بأن النهي ليس عبثًا، بل لحكمة يعلمها الله ويبينها رسوله.",
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        title: "الشورى منهج حياة وبناء أمة",
        bookFrom: 44,
        concepts: [
          "يتعرف معنى الشورى ومظاهرها في سيرة النبي.",
          "يستنتج علاقة الشورى بقيم الإسلام العليا؛ كالحكمة والتواضع وتحقيق المصلحة العامة.",
          "يقدر دور الشورى في الدلالة على عظمة القيادة النبوية.",
          "يطبق مهارات التفكير الجماعي في نقاشه مع زملائه.",
          "يمارس سلوكيات تظهر وعيه بأهمية الاستماع للرأي الآخر، واحترام التنوع في وجهات النظر.",
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        title: "إمام دار الهجرة مالك بن أنس",
        bookFrom: 47,
        concepts: [
          "يتعرف جانبًا من حياة الإمام مالك بن أنس، بوصفه أبرز أعلام الفقه الإسلامي ومؤسس المذهب المالكي.",
          "يتعرف سيرة الإمام مالك العلمية والعملية.",
          "يشرح دور الإمام مالك في تشكيل الفقه الإسلامي في عصور الخلافة الإسلامية.",
          "يمارس سلوكيات تظهر اقتداءه بالإمام مالك في الاجتهاد، والتواضع، والتمسك بطلب العلم.",
        ],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        title: "الثقة بالله طريق النجاح",
        bookFrom: 51,
        concepts: [
          "يتعرف مفهوم (الثقة بالله).",
          "يمارس سلوكيات تظهر التزامه الثقة بالله في حياته اليومية.",
          "يوضح كيف أن الله يفتح أبواب الرزق والفرج لمن يثق به.",
          "يبين أن الثقة بالله تعني أيضًا الأخذ بالأسباب والعمل الجاد في سبيل تحقيق الأهداف.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: تحمل المسئولية في الإسلام",
    bookFrom: 56,
    bookTo: 79,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "الظواهر الكونية وتقوية الإيمان بالله",
        bookFrom: 57,
        concepts: [
          "يستنتج عظمة الله في خلقه وأن الكون يسير بأمره وليس عشوائيًا.",
          "يمارس سلوكيات تظهر خوفه من عذاب الله ورجاءه في رحمته.",
          "يتعرف الظواهر الكونية الكبرى كالزلازل والبراكين والأعاصير، وعلاقتها بقدرة الله وحكمته.",
          "يلتزم أدب التأمل والخشوع والتوبة عند مشاهدة هذه الأحداث.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "سورة المجادلة الآيات (١-١٠)",
        bookFrom: 60,
        concepts: [
          "يتعرف مضمون سورة المجادلة.",
          "يوضح معاني المفردات في السورة وأثرها على حياة المسلم.",
          "يتعرف الدروس المستفادة من الآيات وسبل تطبيقها في الحياة.",
          "يشرح كيفية التعامل مع الخلافات والشكاوى في ضوء تعاليم الإسلام.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "المد اللازم",
        bookFrom: 64,
        concepts: [
          "يتعرف المد اللازم، مبينًا شرطه الأساسي ومقداره.",
          "يميز بين المد اللازم والمد العارض للسكون.",
          "يتعرف نوعي المد اللازم (الكلمي) و(الحرفي).",
          "يطبق حكم المد اللازم بأنواعه عند تلاوة الآيات القرآنية التي تحتويه.",
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        title: "من فضائل الصيام وفوائده",
        bookFrom: 66,
        concepts: [
          "يتعرف بعض الشبهات المثارة حول الصيام، والرد عليها.",
          "يعدد الفوائد الطبية والروحية للصيام.",
          "يشرح فضل العشر الأواخر من رمضان، وأهمية الاجتهاد في العبادة فيها.",
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        title: "وصية الرسول للجيوش",
        bookFrom: 69,
        concepts: [
          "يفهم التوجيهات النبوية في الشجاعة، والعدل، والمساواة، والرحمة في أثناء الحروب والمعارك.",
          "يتعرف كيف أن الإسلام قد أرسى قواعد أخلاقية وإنسانية عظيمة في التعامل مع الأعداء والأسرى في وقت الحرب.",
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        title: "الإمام الشافعي",
        bookFrom: 72,
        concepts: [
          "يتعرف الإمام الشافعي: اسمه ونسبه وطلبه للعلم.",
          "يحدد أبرز إسهامات الإمام الشافعي العلمية.",
          "يبين أهمية كتاب (الرسالة) ودوره في تأسيس علم أصول الفقه.",
          "يعد بعض جوانب موسوعية الإمام الشافعي وتنوع مواهبه.",
          "يستنتج أبرز صفات الإمام الشافعي الأخلاقية والشخصية من خلال سيرته.",
        ],
      },
      {
        key: "3-7",
        ordinal: "السابع",
        title: "المسئولية في الإسلام",
        bookFrom: 75,
        concepts: [
          "يتعرف مفهوم المسئولية في الإسلام.",
          "يتعرف واجباته نحو نفسه وأسرته ومجتمعه.",
          "يتعرف كيفية الالتزام بمسئولياته الشخصية والاجتماعية، وكيفية تحمل تبعات أفعاله والاعتراف بها.",
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
  const unit = EGYPT_ISLAMIC_G9_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ISLAMIC_G9_T1_UNITS.forEach((unit, ui) => {
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
  "islamic-p3-t1",
);

/**
 * The OCR provider answers a truly blank page with this sentence instead of an
 * empty string. It means "no text", not content, so verification treats it as
 * missing while `loadBookPage` still returns it verbatim.
 */
const NO_TEXT = "لا يوجد نص مكتوب في الصورة المرفقة";

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
  return text.length > 0 && !text.includes(NO_TEXT);
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
 * last line is not a running foot (unit openers print no footer). The foot is
 * one number wrapped with either the unit title («٣٤ الوحدة الثانية: …») or the
 * school title («الصف الثالث الإعدادي - الفصل الدراسي الأول ٩»), or the number
 * alone; the last line is accepted only when it looks like one of those — a lone
 * numeral or a line carrying «الوحدة»/«الصف» — so a content line that merely ends
 * in a number is not mistaken for the foot.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  const latin = toLatinDigits(last);
  const runs = latin.match(/\d{1,3}/g) ?? [];
  if (runs.length !== 1) return null;
  const looksLikeFoot = /^[\d\s]+$/.test(latin) || /الوحدة|الصف/.test(last);
  if (!looksLikeFoot) return null;
  return Number(runs[0]);
}

/**
 * Strips everything but letters and digits, so OCR spacing cannot break a match.
 * The «ﷺ» honorific ligature is dropped too, so a title like «وصية الرسول ﷺ
 * للجيوش» and the head that prints the symbol between the two words still match.
 */
function normalize(text: string): string {
  return text.replace(/\uFDFA/g, "").replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ISLAMIC_G9_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_ISLAMIC_G9_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_ISLAMIC_G9_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ISLAMIC_G9_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_ISLAMIC_G9_T1_BOOK_END}، وجدنا ${last.bookTo}`);
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
    if (book < EGYPT_ISLAMIC_G9_T1_BOOK_START || book > EGYPT_ISLAMIC_G9_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_ISLAMIC_G9_T1_BOOK_END - EGYPT_ISLAMIC_G9_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ISLAMIC_G9_T1_BOOK_START} و${EGYPT_ISLAMIC_G9_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title.
  EGYPT_ISLAMIC_G9_T1_UNITS.forEach((unit) => {
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
