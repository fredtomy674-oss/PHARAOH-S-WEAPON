// PHASE 65 — official Egypt Grade-6 Christian Religious Education, first term
// («كتاب الوزارة»).
//
// The curriculum tree for the Egypt `eg-g6-christian-education` curriculum is
// rebuilt from the Ministry textbook `Christian_Education_Primary6_T1.pdf`
// (2026/2027 MoE edition, reviewed by the Coptic Orthodox Church, 98 pages). This
// module is the single source of truth for its structure: the three units («الله
// في حياة قديسيه»، «الصبر والاجتهاد»، «سلطان الرب يسوع») and their six lessons
// each, exactly as the book's محتويات الكتاب (book page 5) prints them, and the
// «أهداف الدرس» the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 1   (book page 7 = PDF page 8)
// Every content page prints its own book number as a bare numeral in the running
// foot («٧» or «12»), sometimes in Latin, sometimes in Eastern or Extended
// Arabic-Indic digits, which is what fixes the offset at 1.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس»
// The book's printed index stops at the lesson (three units × six lessons); it has
// no «مفهوم» layer. So the app mirrors the book: unit → lesson. Each lesson's RAG
// document is the whole lesson (its pages, including the «الأنشطة والممارسات»
// block and «شارك أسرتك» the book places at the end of it).
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND REVIEW
// Each unit opens with an opener page (title + «قائمة دروس الوحدة») and closes
// with «مراجعة على الوحدة»; the last unit also carries «اختبارات على الفصل
// الدراسي الأول». None of these is a lesson, so — exactly as the social/ICT/
// Islamic books do — the opener rides with the unit's first lesson and the
// review/assessments with its last. A lesson's own `bookFrom` is still stored;
// the range it owns is derived as "from the unit's first page, down to the page
// before the next lesson starts, bounded by the unit".

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book page 7 = PDF 8). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_CHRISTIAN_T1_BOOK_START = 6;

/** Last printed content page — the third and last «اختبار على الفصل الدراسي الأول». */
export const EGYPT_CHRISTIAN_T1_BOOK_END = 92;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface ChristianT1Lesson {
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
  /**
   * The book's printed «أهداف الدرس» for this lesson (the only per-lesson list
   * the book prints; there is no «مفهوم»/«مكوّن» layer in this book).
   */
  concepts: string[];
}

export interface ChristianT1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "الوحدة الأولى: الله في حياة قديسيه". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: ChristianT1Lesson[];
}

/**
 * The three units of the first term with their eighteen lessons: unit/lesson
 * starts from the book's contents page (5), objectives from each lesson's first
 * page (8, 12, …). Verified against every printed page by
 * `assertTreeMatchesTheBook`.
 */
export const EGYPT_CHRISTIAN_T1_UNITS: ChristianT1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: الله في حياة قديسيه",
    bookFrom: 6,
    bookTo: 31,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "العقيدة: الله واحد مثلث الأقانيم",
        bookFrom: 7,
        concepts: [
          "يتعرف مفهوم الاقنوم.",
          "يحدد العلاقة بين الأقانيم الثلاثة (الآب والابن والروح القدس).",
          "يستنبط أن كل أقنوم له دور مميز دون انفصال عن الآخر.",
          "يدلل على أن الله واحد في الجوهر، مثلث الأقانيم بآيات من الكتاب المقدس.",
          "يعبر عن تقديره للأنبا أثناسيوس الرسولى تجاه دفاعه عن الحق.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "المحفوظات: (متى ٥ : ٤٢ - ٤٨) - بعض الآيات الذهبية",
        bookFrom: 11,
        concepts: [
          "يردد مجموعة من الآيات الذهبية، ويذكر معاني كلمات النصوص الكتابية.",
          "يشرح معاني الآيات وتطبيقها في الحياة اليومية.",
          "يتعرف على شخصيات وأحداث كتابية مرتبطة بالآيات.",
          "يتمكن من تنمية مهارات العمل الجماعي والتعاون.",
          "يستخدم الآيات في الصلاة والتأمل.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "العبادة: قوة الصلاة والصوم",
        bookFrom: 15,
        concepts: [
          "يتَعَرّف أهمية الصلاة والصوم كوسيلة للنمو الروحي.",
          "يحدد اوجه التشابه والاختلاف بين التجارب التي واجهت موسى النبي ويونان النبي والملكة أستير.",
          "يدلل على تأثير الصلاة والصوم في حياة أبطال الإيمان مثال الأنبا أنطونيوس والقديسة دميانة.",
          "يسرد موقفًا حياتيًا يوضح مواجهة تجارب الحياة بالصلاة والصوم.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "شخصيات كتابية: حياة اليشع النبي",
        bookFrom: 19,
        concepts: [
          "يتعرّف دعوة أليشع النبي وطاعته لله.",
          "يثق أن الله يعمل المعجزات من خلال أولاده الأمناء.",
          "يستنبط أن الله يستخدم من يثق به، مهما كانت امكانياته.",
          "يطلب عون الله في كل وقت وخاصة الأزمات.",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "شخصيات تاريخية: القديس مارمرقس الرسول (كاروز الديار المصرية)",
        bookFrom: 23,
        concepts: [
          "يتعرف أهم أحداث حياة القديس مارمرقس (كاروز الديار المصرية).",
          "يدلل على شجاعة مارمرقس في الكرازة رغم المخاطر والاضطهاد.",
          "يدلل على محبة مارمرقس للصلاة والتعليم ونشر كلمة الله.",
          "يعبر عن اعتزازه بالانتماء إلى الكنيسة المصرية التي أسسها القديس مارمرقس.",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "القيم والأخلاق: الرفق بالحيوان - حمار بلعام",
        bookFrom: 27,
        concepts: [
          "يتعرّف بعض الحيوانات المذكورة في الكتاب المقدس وقصصها.",
          "يذكر رموز بعض الحيوانات ودلالتها الروحية.",
          "يُدرك أن الله يهتم بالحيوانات ويعلّمنا العناية بها.",
          "يميز بين التصرفات الصحيحة وغير الصحيحة في التعامل مع الحيوانات.",
          "يطبّق سلوك الرفق بالحيوان في حياته اليومية.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: الصبر والاجتهاد",
    bookFrom: 32,
    bookTo: 60,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "العقيدة: وحدة الكتاب المقدس",
        bookFrom: 33,
        concepts: [
          "يؤكد أن أسفار الكتاب المقدس مسوقة من الروح القدس.",
          "يعدد تنوع الكتاب واختلاف أماكن وزمان كتابة الأسفار.",
          "يذكر أن العهدين القديم والجديد يتممان بعضهما البعض.",
          "يشرح كيف أن محور الكتاب المقدس هو الرب يسوع المسيح.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "المحفوظات: (مت 6: 1 - 4) - (مت 6: 5 - 8) - بعض الآيات الذهبية",
        bookFrom: 39,
        concepts: [
          "يردد بفهم نصوصًا من الكتاب المقدس.",
          "يرفض الممارسات الشكلية في العبادة.",
          "يثمن مفهوم العبادة في الخفاء.",
          "يؤكد على عدل الله في الجزاء والمكافأة.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "العبادة: كيف نطلب في صلاتنا - عرس قانا الجليل",
        bookFrom: 44,
        concepts: [
          "يسرد أهم أحداث عرس قانا الجليل.",
          "يعبر عن ثقته بأن الله يسمع الصلاة، حتى إن لم يستجب فورًا.",
          "يسرد مواقف تؤكد طاعته لوصايا الله بالكتاب المقدس.",
          "يُميِّز الفرق بين العظمة في العالم والعظمة في ملكوت الله.",
          "يكتب طلباته لله بثقة وتسليم.",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "شخصيات كتابية: حياة إرميا النبي",
        bookFrom: 48,
        concepts: [
          "يتعرف أهم أحداث حياة إرميا النبي.",
          "يعبر عن قيمة صلاة ودموع إرميا النبي من أجل خلاص الآخرين.",
          "يستنتج الدروس المستفادة والقيم الروحية من حياة إرميا النبي.",
          "يدلل على أن كلمة الله لا تُقيَّد مهما واجهت من مقاومة في ضوء حياة إرميا.",
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        title: "شخصيات تاريخية: سمعان الشيخ",
        bookFrom: 52,
        concepts: [
          "يتعرف أن الله أمين في تحقيق وعوده من خلال قصة حياة سمعان الشيخ.",
          "يدلل على صبر وإيمان سمعان الشيخ وانتظاره الطويل.",
          "يربط بين بعض النبوات في العهد القديم وتحقيقها في العهد الجديد.",
          "يعبر عن فرحه بوجود الرب يسوع كمخلص لكل الأمم.",
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        title: "القيم والأخلاق: الاجتهاد في العلم - القديس ديديموس",
        bookFrom: 56,
        concepts: [
          "يتعرف أهم أحداث حياة القديس ديديموس ودوره في الكنيسة.",
          "يعبر عن تقديره لقيمة العلم والاجتهاد حتى في أصعب الظروف.",
          "يدلل على قوة عزيمة ديديموس في تحصيل العلم.",
          "يستنتج أن الله يعطي مواهب خاصة لكل إنسان.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: سلطان الرب يسوع",
    bookFrom: 61,
    bookTo: 92,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "العقيدة: سلطان الرب يسوع في الخلق - المولود اعمي",
        bookFrom: 62,
        concepts: [
          "يتعرف سلطان الرب يسوع في الخلق.",
          "يدلل على أن الرب يسوع يهتم بالمتألمين.",
          "يستنتج أن الألم ليس دائمًا عقابًا من الله.",
          "يسرد موقفًا حياتيًا يدلل على طاعته للرب يسوع مثل طاعة المولود أعمى.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "المحفوظات: بعض الآيات الذهبية",
        bookFrom: 67,
        concepts: [
          "يردد بفهم الآيات الذهبية بالدرس.",
          "يستنتج أن محبة الله هي التي تُغيّر الإنسان.",
          "يعبر عن ثقته في قدرة الله على صنع المعجزات المستحيلة.",
          "يحدد صفات الرب يسوع كما جاءت في (إش ٦: ٩).",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "العبادة: التوبة - أنسيمس",
        bookFrom: 71,
        concepts: [
          "يتعرّف الخلفية التاريخية والاجتماعية لشخصية أنسيمُس.",
          "يستنتج دور الرسول بولس في قيادة أنسيمُس إلى التوبة والإيمان.",
          "يستنتج تأثير النعمة الإلهية في تغيير حياة الإنسان.",
          "يمارس التوبة الحقيقية كرجوع إلى الله.",
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        title: "شخصيات كتابية: إشعياء النبي",
        bookFrom: 75,
        concepts: [
          "يتعرّف شخصية النبي إشعياء وظروف دعوته.",
          "يدلل على ثبات النبي إشعياء رغم الرفض والسخرية.",
          "يعبر عن ثقته في مواعيد الله حتى إن لم تتحقق فورًا.",
          "يستنتج أهمية النبوات في فهم خطة الله لخلاص البشر.",
          "يتتبع نبوات إشعياء النبي وكيف تحققت في الرب يسوع.",
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        title: "شخصيات تاريخية: الأخوة - لعازر و مريم ومرثا",
        bookFrom: 79,
        concepts: [
          "يتعرف شخصيات لعازر ومريم ومرثا.",
          "يشرح سلطان الرب يسوع على الموت.",
          "يتعرف محبة الرب يسوع وتأثره بآلام أحبائه.",
          "يعبر عن ثقته أن الرب لا يتأخر، بل يتدخل في الوقت المناسب.",
          "يدلل بآيات من الكتاب المقدس بأن الرب هو القيامة والحياة.",
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        title: "القيم والأخلاق: التقوي - الأنبا بيشوي",
        bookFrom: 84,
        concepts: [
          "يتعرف أهم أحداث حياة الأنبا بيشوي.",
          "يعبر عن أهمية الصلاة اليومية في حياة المؤمن.",
          "يدلل على تواضع القديس الأنبا بيشوي.",
          "يستنتج أن لقاء الرب لا يكون بالعيون فقط بل بالقلب المحب الخادم.",
          "يثق أن الله يرى تعبنا ويكافئنا بحسب أمانتنا في الحياة الروحية.",
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
 * belong to — and lands the unit review / final assessments on the last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_CHRISTIAN_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_CHRISTIAN_T1_UNITS.forEach((unit, ui) => {
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
  "christian-t1",
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
// PHASE 65 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"; // U+0660..U+0669
const EXT_AR_DIGITS = "۰۱۲۳۴۵۶۷۸۹"; // U+06F0..U+06F9

/**
 * Arabic-Indic digits → Latin. The scan mixes Latin, Eastern (٠–٩) and Extended
 * Arabic-Indic (۰–۹) digits from page to page, so all three are mapped; a footer
 * would otherwise compare unequal for a purely cosmetic reason.
 */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints in its running foot, or null when the
 * last line is not a bare numeral (unit openers print no footer). Unlike the
 * ICT foot (a sentence with the number embedded), the Christian foot is the
 * number alone, so a page whose last line is exactly one numeral is the footer.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  const latin = toLatinDigits(last);
  if (!/^\d{1,3}$/.test(latin)) return null;
  return Number(latin);
}

/**
 * Pages whose printed foot the OCR misread, with the numeral it produced. Page
 * 76's foot «٧٦» came out as «٢٦» (the ٧ read as ٢); the page's own text and the
 * pages around it fix its number unambiguously, so the check accepts this one
 * documented misread rather than weakening the rule for every page.
 */
const OCR_FOOTER_MISREADS: ReadonlyMap<number, number> = new Map([[76, 26]]);

/**
 * Strips everything but letters and digits, then folds the letter variants OCR
 * and typography introduce (hamza forms → ا, alef maqsura → ي, ta marbuta → ه),
 * so spacing or a spelling variant cannot break a title match.
 */
function normalize(text: string): string {
  return text
    .replace(/[\u0622\u0623\u0625\u0627\u0671]/g, "\u0627")
    .replace(/[\u0649\u06CC]/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0640/g, "")
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
  const units = EGYPT_CHRISTIAN_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_CHRISTIAN_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_CHRISTIAN_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_CHRISTIAN_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_CHRISTIAN_T1_BOOK_END}، وجدنا ${last.bookTo}`);
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
    if (book < EGYPT_CHRISTIAN_T1_BOOK_START || book > EGYPT_CHRISTIAN_T1_BOOK_END) continue;
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
      if (footer !== book && OCR_FOOTER_MISREADS.get(book) !== footer) {
        problems.push(`صفحة الكتاب ${book}: الفوتر المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_CHRISTIAN_T1_BOOK_END - EGYPT_CHRISTIAN_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_CHRISTIAN_T1_BOOK_START} و${EGYPT_CHRISTIAN_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title.
  EGYPT_CHRISTIAN_T1_UNITS.forEach((unit) => {
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
