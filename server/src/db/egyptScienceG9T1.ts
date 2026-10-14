// PHASE 84 — official Egypt Preparatory-3 (Grade 9) Science, first term
// («كتاب الوزارة»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g9-science` is rebuilt from the Ministry textbook
// `Science_AR_Prp3_Tr1.pdf` (114 scan pages, all OCR'd). This module is the
// single source of truth for its structure: the four units and their ten
// lessons, exactly as the book's المحتويات (book page iv) prints them, and the
// «أهداف الدرس» the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 7   (book page 2 = PDF page 9)
// Every content page carries its own number in the running foot — sometimes
// alone («33»), sometimes wrapped with the lesson title («الدرس الأول : أنواع
// التفاعلات الكيميائية | 3») or the unit title («4 | الوحدة الأولى …») — which
// is what fixes the offset at 7 and proves the mapping page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس», NOT A «مفهوم»
// This book's contents page lists «دروس الوحدة»: four units of three, three,
// two and two numbered «الدرس». There is no «مفهوم» layer (unlike the Grade-6
// science book); each lesson carries its printed «أهداف الدرس», and those are
// the app's concepts.
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER
// Each unit opens with a one-page opener (title + «دروس الوحدة» + unit
// «نواتج التعلم»). It is not a lesson, so — as in the other Ministry books — it
// rides with the unit's first lesson. There is no unit-level «مراجعة»: every
// unit ends on the last lesson's own «أسئلة تقييم الدرس».

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.2 = PDF p.9). */
export const BOOK_TO_PDF_OFFSET = 7;

/** First printed page of the content — the opener of unit 1. */
export const EGYPT_SCIENCE_G9_T1_BOOK_START = 1;

/** Last printed content page — the assessment of the last lesson. */
export const EGYPT_SCIENCE_G9_T1_BOOK_END = 102;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface ScienceG9T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed at the head of the lesson. */
  title: string;
  /** First printed book page of the lesson itself. */
  bookFrom: number;
  /** The book's printed «أهداف الدرس» for this lesson. */
  concepts: string[];
}

export interface ScienceG9T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "الوحدة الثانية: الكهربية والمغناطيسية". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit. */
  bookTo: number;
  lessons: ScienceG9T1Lesson[];
}

/**
 * The four units of the first term with their ten lessons: unit/lesson starts
 * from the book's contents page (iv), objectives from each lesson's first page
 * (2, 15, 25, 35, …). Verified against every printed page by
 * `assertTreeMatchesTheBook`.
 */
export const EGYPT_SCIENCE_G9_T1_UNITS: ScienceG9T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: التفاعلات الكيميائية وآثارها البيئية",
    bookFrom: 1,
    bookTo: 33,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "أنواع التفاعلات الكيميائية",
        bookFrom: 2,
        concepts: [
          "يحدد أنواع التفاعلات الكيميائية الرئيسية.",
          "يقارن بين الفلزات في تفاعلها مع كل من الماء، والأحماض، والأكسجين.",
          "يستنتج ترتيب الفلزات وفقًا لدرجة نشاطها الكيميائي.",
          "يستخدم متسلسلة النشاط الكيميائي في التنبؤ بحدوث التفاعلات الكيميائية.",
          "يميز بين تفاعل الإحلال البسيط وتفاعل الإحلال المزدوج باستخدام أمثلة.",
          "يتعرف مفاهيم الأكسدة والاختزال والعامل المؤكسد والعامل المختزل، في ضوء انتقال الإلكترونات.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "تفاعلات الاحتراق والتلوث البيئي",
        bookFrom: 15,
        concepts: [
          "يفسر علميًا قابلية اشتعال المواد.",
          "يقارن بين نواتج الاحتراق التام والاحتراق غير التام لبعض المواد.",
          "يستنتج خواص نواتج الاحتراق وتأثيرها على البيئة.",
          "يصمم حلولًا للحد من التلوث الناتج عن تفاعلات الاحتراق.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "التدخين ومخاطره",
        bookFrom: 25,
        concepts: [
          "يُعدد بعض المواد الكيميائية المكونة للتبغ.",
          "يحدد المواد الكيميائية الناتجة عن احتراق التبغ.",
          "يميز بين أنواع التدخين (التدخين المباشر - التدخين السلبي - التدخين التقليدى - التدخين الإلكتروني).",
          "يقيم أضرار التدخين بكل أنواعه على المدخنين والمحيطين بهم.",
          "يقيم أضرار التدخين على البيئة.",
          "يساهم فى إعداد مواد إعلامية (ورقية أو إلكترونية) للتوعية ضد عادة التدخين.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: الكهربية والمغناطيسية",
    bookFrom: 34,
    bookTo: 63,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "التيار الكهربي",
        bookFrom: 35,
        concepts: [
          "يعرف مفهومي التيار الكهربي وشدته.",
          "يستنتج مفهومى فرق الجهد الكهربى والقوة الدافعة الكهربية.",
          "يقارن بين طريقتي توصيل الأعمدة الكهربية على التوالي وعلى التوازى.",
          "يحدد أنواع المقاومة الكهربية.",
          "يستنتج العوامل المؤثرة على المقاومة الكهربية لموصل.",
          "يقدر دور العلماء فى اختراع وتطوير أجهزة كهربائية لخدمة الإنسان.",
          "يصمم دائرة كهربية بسيطة مستخدمًا الرموز الدولية.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "الدوائر الكهربية",
        bookFrom: 46,
        concepts: [
          "يحقق قانون أوم عمليًا، مع تمثيل العلاقة بين شدة التيار وفرق الجهد بيانيًا.",
          "يقارن بين طريقتي توصيل المقاومات، على التوالى وعلى التوازى.",
          "يحسب المقاومة المكافئة لعدة مقاومات متماثلة متصلة على التوالى أو على التوازى.",
          "يعرف مفهوم القدرة الكهربية.",
          "يحسب تكلفة الطاقة الكهربية المستهلكة فى منزله.",
          "يقدر أهمية إجراءات الأمن والسلامة عند التعامل مع الكهرباء.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "القوى الكهربية والمغناطيسية",
        bookFrom: 54,
        concepts: [
          "يستنتج التأثير المغناطيسي للتيار الكهربى.",
          "يشرح تركيب المغناطيس الكهربى، وآلية عمله، وبعض تطبيقاته.",
          "يستنتج العوامل المؤثرة على قوة جذب المغناطيس الكهربى.",
          "يفسر القوة المغناطيسية المؤثرة على سلك يمر به تيار كهربي.",
          "يصف تركيب المحرك الكهربى، وآلية عمله، وبعض تطبيقاته.",
          "يستنتج العوامل التي تؤثر على عزم دوران المحرك.",
          "يصف تركيب المولد الكهربى، وآلية عمله، وبعض تطبيقاته.",
          "يستنتج العوامل المؤثرة على القوة الدافعة الكهربية المتولدة من المولد الكهربي.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: تنوع الصفات في الكائنات الحية",
    bookFrom: 64,
    bookTo: 83,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "الوراثة وتنوع الصفات",
        bookFrom: 65,
        concepts: [
          "يشرح دور الأليل السائد والأليل المتنحي في انتقال الصفات الوراثية من الآباء إلى الأبناء.",
          "يفسر دور اختلاف الأليلات وتباين توزيعها بين الأفراد في حدوث التنوع الوراثي داخل النوع الواحد.",
          "يطبق مربع بانيت للتنبؤ باحتمالات ظهور الصفات الوراثية في الأبناء.",
          "يربط بين قوانين مندل في الوراثة وانتقال الصفات الوراثية بين الأجيال.",
          "يفسر ظهور بعض الصفات الوراثية المختلفة في الإنسان على أساس اختلاف الأليلات.",
          "يطبق المفاهيم الوراثية على أمثلة لأمراض وراثية.",
          "يستنتج العلاقة بين زواج الأقارب وزيادة احتمال ظهور بعض الأمراض الوراثية.",
          "يقدر أهمية الوعى الصحى والفحص الوراثي للحد من انتشار الأمراض الوراثية.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "الانتخاب الطبيعي والانتخاب الصناعي",
        bookFrom: 75,
        concepts: [
          "يفسر تأثير العوامل البيئية والوراثية على نمو الجماعات الحيوية في الإنسان والحيوان.",
          "يستخدم تمثيلات رياضية مبسطة لتفسير دور الانتخاب الطبيعي في زيادة أو نقص صفات محددة داخل الجماعات الحيوية.",
          "يصمم مخططا وصفيا يفسر كيف يؤدى الانتخاب الطبيعي إلى زيادة فرص انتقال الجينات التي تجعل الكائنات الحية أكثر تكيفا مع تغيرات البيئة والتطور عبر الزمن.",
          "يقارن بين الانتخاب الطبيعي والانتخاب الصناعي في تأثيرهما على تغير الصفات في الجماعات الحيوية.",
          "يقارن بين التقنيات التقليدية والتقنيات الحديثة للحفاظ على الصفات الوراثية المرغوبة في الكائنات الحية.",
        ],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "الوحدة الرابعة: تاريخ كوكب الأرض",
    bookFrom: 84,
    bookTo: 102,
    lessons: [
      {
        key: "4-1",
        ordinal: "الأول",
        title: "السجل الحفري",
        bookFrom: 85,
        concepts: [
          "يشرح مفهوم الحفريات، وكيفية تكوّنها.",
          "يميز بين أنواع الحفريات المختلفة، مع ذكر مثال لكل نوع.",
          "يشرح مفهوم السجل الحفرى، ودوره فى توثيق تاريخ الحياة على الأرض.",
          "يفسر أسباب انقراض بعض أنواع الكائنات الحية وتغير أشكال الحياة عبر الزمن الجيولوجي.",
          "يفسر أسباب ظهور أنواع جديدة من الكائنات الحية عبر العصور الجيولوجية.",
          "يستنتج العلاقات التطورية بين الكائنات المنقرضة والحديثة من خلال المقارنة التشريحية وتحديد أوجه التشابه والاختلاف بينها.",
        ],
      },
      {
        key: "4-2",
        ordinal: "الثاني",
        title: "الأزمنة الجيولوجية",
        bookFrom: 95,
        concepts: [
          "يشرح مفهوم مقياس الزمن الجيولوجى والغرض من استخدامه.",
          "يرتب وحدات الزمن الجيولوجى من الأكبر إلى الأصغر (دهور، حقب، عصور، أزمنة).",
          "يصمم خطًا زمنيًا لاستعراض الأزمنة الجيولوجية على الأرض.",
          "يحلل بيانات من الطبقات الصخرية والحفريات لاستنتاج تسلسل الأحداث الجيولوجية.",
          "يشرح الطرق التي يستخدمها العلماء لتحديد العُمر النسبي للصخور والحفريات.",
          "يشرح كيفية تحديد العلماء للعُمر المطلق للصخور باستخدام النشاط الإشعاعي.",
          "يقارن بين طرق تقدير العُمر النسبي والعُمر المطلق للصخور.",
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
 * or the unit's last page for its last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_SCIENCE_G9_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SCIENCE_G9_T1_UNITS.forEach((unit, ui) => {
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
  "science-p3-t1",
);

/**
 * The OCR provider answers a truly blank page with this sentence instead of an
 * empty string. It means "no text", not content.
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
// PHASE 84 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"; // U+0660..U+0669
const EXT_AR_DIGITS = "۰۱۲۳۴۵۶۷۸۹"; // U+06F0..U+06F9

/** Arabic-Indic digits → Latin. The scan mixes both ranges from page to page. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints in its running foot, or null when the
 * last line is not a running foot. The foot is one number alone («33»), or
 * wrapped with the lesson title («الدرس الأول : أنواع التفاعلات الكيميائية | 3»)
 * or the unit title («4 | الوحدة الأولى …»). The last line is accepted only
 * when it looks like one of those — a lone numeral or a line carrying
 * «الوحدة»/«الدرس»/«الصف»/«الفصل» — so a content line or a unit opener line
 * that merely ends in a number is not mistaken for the foot.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  const latin = toLatinDigits(last);
  const runs = latin.match(/\d{1,3}/g) ?? [];
  if (runs.length !== 1) return null;
  const looksLikeFoot = /^[\d\s]+$/.test(latin) || /الوحدة|الدرس|الصف|الفصل/.test(last);
  if (!looksLikeFoot) return null;
  return Number(runs[0]);
}

/**
 * Strips everything but letters and digits, unifying the orthographic variants
 * OCR and the book's own running heads disagree on — diacritics, tatweel, the
 * alif/hamza forms, final ya (ى/ي) and ta-marbuta/ha (ة/ه) — so e.g. the head
 * «السجل الحفرى» still matches the title «السجل الحفري».
 */
function normalize(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
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
  const units = EGYPT_SCIENCE_G9_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_SCIENCE_G9_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_SCIENCE_G9_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SCIENCE_G9_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_SCIENCE_G9_T1_BOOK_END}، وجدنا ${last.bookTo}`);
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

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SCIENCE_G9_T1_BOOK_START || book > EGYPT_SCIENCE_G9_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_SCIENCE_G9_T1_BOOK_END - EGYPT_SCIENCE_G9_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_SCIENCE_G9_T1_BOOK_START} و${EGYPT_SCIENCE_G9_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title.
  EGYPT_SCIENCE_G9_T1_UNITS.forEach((unit) => {
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
