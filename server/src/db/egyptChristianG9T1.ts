// PHASE 80 — official Egypt Preparatory-3 (Grade 9) Christian Religious
// Education, first term («كتاب الوزارة»), Ministry 2026/2027 edition, reviewed by
// the Coptic Orthodox Church.
//
// The curriculum `eg-g9-christian-education` is rebuilt from the Ministry
// textbook `Christian_Education_Prep3_T1.pdf` (82 scan pages, all OCR'd). This
// module is the single source of truth for its structure: the three units
// («دعوة الله لنا»، «دستور إيماننا»، «الإيمان المسيحي والمسؤولية») and their six
// lessons each, exactly as the book's unit openers print their «قائمة دروس
// الوحدة», and the «أهداف الدرس» the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 1   (book page 7 = PDF page 8)
// Every content page prints its own book number in the running foot — either
// «الوحدة الأولى - الدرس الأول ٧» or «١٠ الصف الثالث الإعدادي - الفصل الدراسي
// الأول» — which is what fixes the offset at 1. Three unit openers and one
// continuation page print no footer; the other 70 content pages prove the
// mapping page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس»
// The book's printed index stops at the lesson (three units × six lessons); it
// has no «مفهوم» layer. So the app mirrors the book: unit → lesson. Each
// lesson's RAG document is the whole lesson (its pages, including the
// «الأنشطة والممارسات» block the book places at the end of it).
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND UNIT REVIEW
// Each unit opens with an opener page (title + «قائمة دروس الوحدة») and closes
// with «مراجعة على الوحدة»; the last unit also carries the «مراجعة عامة» on the
// first term. None of these is a lesson, so — exactly as the primary-6 books do
// — the opener rides with the unit's first lesson and the review with its last.
// A lesson's own `bookFrom` is still stored; the range it owns is derived as
// "from the unit's first page, down to the page before the next lesson starts,
// bounded by the unit".
//
// WHY THE LESSON TITLE CHECK LOOKS AFTER THE FIRST COLON
// A Prep-3 lesson page prints its title in two or three separate blocks — the
// category (e.g. «العقيدة»), then «الدرس N», then the topic — instead of the one
// full «category: topic» line the older books print. So the title stored here is
// the full «category: topic» the unit opener's index shows, while verification
// compares only the topic after the first colon against the page.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book page 7 = PDF 8). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_CHRISTIAN_G9_T1_BOOK_START = 6;

/** Last printed content page — the «مراجعة عامة» (book page 79). */
export const EGYPT_CHRISTIAN_G9_T1_BOOK_END = 79;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface ChristianG9T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /**
   * Lesson title as the unit opener's index prints it, `category: topic`. The
   * lesson's own page prints the category and the topic as separate blocks, so
   * verification compares the topic after the first colon, not the whole title.
   */
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

export interface ChristianG9T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "الوحدة الأولى: دعوة الله لنا". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: ChristianG9T1Lesson[];
}

/**
 * The three units of the first term with their eighteen lessons: unit/lesson
 * starts from each unit's opener page (6, 30, 52), objectives from each lesson's
 * first page. Verified against every printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_CHRISTIAN_G9_T1_UNITS: ChristianG9T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: دعوة الله لنا",
    bookFrom: 6,
    bookTo: 29,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "العقيدة: وجود الله",
        bookFrom: 7,
        concepts: [
          "يتعرف البراهين الدالة على وجود الله.",
          "يشرح برهان السببية ووجود الكون.",
          "يوضح دقة النظام في الكون وعلاقتها بوجود الله.",
          "يذكر أمثلة على التصميم الدقيق في الكائنات الحية.",
          "يفسر دور الضمير والقانون الأخلاقي في معرفة الله.",
          "يعبر عن إيمانه بالله من خلال حياته اليومية",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "المحفوظات: قانون الإيمان - وبعض الآيات الذهبية",
        bookFrom: 10,
        concepts: [
          "يردد بفهم قانون الإيمان وبعض آيات من الكتاب المقدس.",
          "يدلل من قانون الإيمان على وحدانية الله، وعقيدة الثالوث المقدس و لاهوت الابن.",
          "يكتب من قانون الإيمان ما يدل على عقيدة قيامة الأموات، والحياة الأخرى والمجيء الثاني للمسيح.",
          "يحلل قانون الإيمان وفق الأفعال المرتبطة بكل أقنوم (الآب والابن والروح القدس).",
          "يوضح معنى مفردات قانون الإيمان وبعض الآيات الذهبية.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "العبادة: الوحي الإلهي - كلمة الله",
        bookFrom: 13,
        concepts: [
          "يتعرّف معنى الوحي الإلهي.",
          "يوضّح أن الكتاب المقدس هو كلمة الله الموحى بها.",
          "يشرح عمل الروح القدس في كتاب الكتاب المقدس.",
          "يميّز بين الوحي الإلهي والإملاء الحرفي.",
          "يوضّح كيف أعلن الله نفسه للبشر عبر التاريخ.",
          "يستنتج أن السيد المسيح هو كمال إعلان الله للبشر.",
          "يشرح دور الكنيسة والآباء في تفسير الكتاب المقدس.",
          "يسرد مواقف حياتية دالة على تطبيق تعاليم كلمة الله في حياته اليومية",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "شخصيات كتابية: رجال غيّروا العالم - تلاميذ السيد المسيح (١)",
        bookFrom: 18,
        concepts: [
          "يذكر دعوة السيد المسيح للتلاميذ وكيف تركوا كل شيء وتبعوه.",
          "يوضح كيف تغيّرت حياة التلاميذ البسطاء بعد اتباع السيد المسيح.",
          "يشرح بعض مواقف التلاميذ مع السيد المسيح.",
          "يوضح أثر الروح القدس في شجاعة التلاميذ وخدمتهم.",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "شخصيات تاريخية: البابا أثناسيوس الرسولي ودوره في مجمع نيقية",
        bookFrom: 22,
        concepts: [
          "يشرح كيف نشأت بدعة أريوس وخطورتها على الإيمان المسيحي.",
          "يذكر دور البابا أثناسيوس الرسولي في الدفاع عن ألوهية السيد المسيح.",
          "يوضح أهمية مجمع نيقية في حفظ العقيدة المسيحية.",
          "يدلل على تحلي البابا أثناسيوس بكل من: الشجاعة، الثبات، الحكمة، والتمسك بالإيمان.",
          "يقتدي بثبات أثناسيوس في الدفاع عن الحق والإيمان المستقيم.",
          "يعبر عن دور الكتاب المقدس وتعاليم الكنيسة في حماية الإنسان من الأفكار الخاطئة.",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "القيم والأخلاق: الطاعة",
        bookFrom: 25,
        concepts: [
          "يشرح معنى الطاعة الحقيقية كما يعلّمها الكتاب المقدس.",
          "يذكر أمثلة كتابية وشخصيات كنسية عاشت الطاعة والثبات.",
          "يدلل على ضرورة طاعة الله أكثر من الناس.",
          "يرفض أية إغراءات عالمية مستندًا بقوة الله.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: دستور إيماننا",
    bookFrom: 30,
    bookTo: 51,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "العقيدة: الثالوث وتعليم الآباء",
        bookFrom: 31,
        concepts: [
          "يشرح معنى الإيمان بإله واحد مثلث الأقانيم.",
          "يميز بين وحدانية الله وتمايز الأقانيم دون انقسام.",
          "يردّ على بعض المفاهيم الخاطئة الخاصة بعقيدة الثالوث.",
          "يذكر أدلة كتابية على لاهوت السيد المسيح وأزلية الابن.",
          "يتعرّف على دور آباء الكنيسة مثل أثناسيوس الرسولى والبابا كيرلس الكبير في شرح العقيدة والدفاع عنها.",
          "يعبر عن أهمية التمسك بالإيمان الرسولى الصحيح كما تسلّمته الكنيسة.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "المحفوظات: تسبحة الثالوث - بعض الآيات الذهبية",
        bookFrom: 35,
        concepts: [
          "يردد بفهم تسبحة الثالوث وبعض آيات من الكتاب المقدس.",
          "يعدد الطلبات التي نطلبها في تسبحة الثالوث.",
          "يشرح تسبحة الثالوث بمفرداته الخاصة.",
          "يوضح معنى مفردات تسبحة الثالوث وبعض الآيات الذهبية.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "العبادة: قانون الإيمان النيقاوي",
        bookFrom: 37,
        concepts: [
          "يوضح المقصود بمفهوم \" قانون الإيمان النيقاوي \".",
          "يشرح أسباب وضع الكنيسة لقانون الإيمان.",
          "يدلل على أن الكتاب المقدس هو المصدر الأساسي لعبارات قانون الإيمان.",
          "يستنتج أن الكنيسة حافظت على الإيمان الرسولي عبر الأجيال.",
          "يعبر عن أهمية دور الآباء، خاصة أثناسيوس الرسولي، في الدفاع عن الإيمان المسيحي.",
          "يدلل من حياته الشخصية على أن \" قانون الإيمان ليس كلمات تُقال فقط، بل حياة تُعاش \".",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "شخصيات كتابية: رجال غيّروا العالم - الاثنا عشر تلميذًا",
        bookFrom: 41,
        concepts: [
          "يذكر أسماء بعض تلاميذ السيد المسيح الاثني عشر.",
          "يشرح كيف دعا الرب يسوع تلاميذه ليتبعوه.",
          "يوضح دور التلاميذ في نشر الكرازة بعد القيامة.",
          "يستنتج كيف غيّر السيد المسيح حياة التلاميذ.",
          "يتعرف على بعض أماكن كرازة واستشهاد الرسل.",
          "يقتدي بأمانة ومحبة وشجاعة تلاميذ السيد المسيح.",
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        title: "شخصيات تاريخية: البابا تيموثاوس الأول ومجمع القسطنطينية",
        bookFrom: 44,
        concepts: [
          "يتعرف مجمع القسطنطينية الأول ويذكر سبب انعقاده.",
          "يوضح دور البابا تيموثاوس الأول في الدفاع عن ألوهية الروح القدس.",
          "يشرح معنى أن الروح القدس «الرب المحيي» كما ورد في قانون الإيمان.",
          "يميز بين التعليم الأرثوذكسي الصحيح وتعليم مقدونيوس الخاطئ.",
          "يحدد العبارات التي أضيفت إلى قانون الإيمان في مجمع القسطنطينية.",
          "يقدر أهمية الثبات على الإيمان الصحيح والدفاع عنه بمحبة وحكمة.",
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        title: "القيم والأخلاق: الثقة بالله",
        bookFrom: 47,
        concepts: [
          "يشرح مفهوم الثقة بالله في حياة المؤمن.",
          "يذكر أحداث سجن بولس وسيلا في مدينة فيلبي.",
          "يستنتج كيف حوّل الله السجن إلى باب خلاص بسبب الإيمان والثقة به.",
          "يتعرف على شخصية بنتينوس ودوره في مدرسة الإسكندرية.",
          "يطبق قيمة الثقة بالله في حياته اليومية وقت الخوف أو التجارب.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الإيمان المسيحي والمسؤولية",
    bookFrom: 52,
    bookTo: 79,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "العقيدة: لاهوت السيد المسيح",
        bookFrom: 53,
        concepts: [
          "يذكر بعض الأدلة الكتابية على ألوهية السيد المسيح.",
          "يستنتج أن السيد المسيح هو الخالق وليس جزءًا من الخليقة.",
          "يوضح سلطان السيد المسيح على الطبيعة والمادة والمرض والموت.",
          "يستنتج أن مغفرة الخطايا من صفات الله وحده.",
          "يذكر شهادات بعض الأشخاص عن ألوهية السيد المسيح.",
          "يربط بين معجزات السيد المسيح ولاهوته.",
          "يعبّر عن إيمانه بأن الرب يسوع المسيح هو الله الظاهر في الجسد.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "المحفوظات: مقدمة قانون الإيمان - بعض الآيات الذهبية",
        bookFrom: 57,
        concepts: [
          "يردد بفهم مقدمة قانون الإيمان وبعض آيات من الكتاب المقدس.",
          "يستنتج ألقاب الرب يسوع وألقاب القديسة مريم العذراء من مقدمة قانون الإيمان.",
          "يشرح مقدمة قانون الإيمان بمفرداته الخاصة.",
          "يوضح معنى بعض مفردات قانون الإيمان وبعض الآيات الذهبية.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "العبادة: الصلاة المقبولة",
        bookFrom: 59,
        concepts: [
          "يشرح أهمية الصلاة النابعة من القلب.",
          "يبين أهمية الإيمان والثقة في استجابة الله.",
          "يستنتج كيف تساعد الصلاة على الاتحاد بالله.",
          "يقتدي بأمثلة كتابية وروحية في حياته اليومية.",
          "يطبق برنامجًا بسيطًا للمواظبة على الصلاة.",
          "يعبر عن رغبته في تنمية حياته الروحية من خلال الصلاة.",
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        title: "شخصيات كتابية: القديسة مريم العذراء",
        bookFrom: 62,
        concepts: [
          "أن يعرف السيرة الكتابية للسيدة العذراء مريم كما وردت في الأناجيل.",
          "أن يحدد أهم الأحداث في حياة القديسة مريم العذراء (البشارة، الزيارة، الميلاد، الصليب، القيامة).",
          "أن يوضح معنى طاعة مريم الكاملة لله من خلال قولها: «ليكن لي كقولك».",
          "أن يربط بين أحداث العهد الجديد و إعلان محبة الله للبشر.",
          "أن يعبّر عن الدروس المستفادة (الإيمان، الطاعة، الاتضاع، الصبر).",
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        title: "شخصيات تاريخية: البابا كيرلس الأول (عمود الدين) ومجمع أفسس",
        bookFrom: 66,
        concepts: [
          "يتعرّف شخصية البابا كيرلس الأول ودوره في الدفاع عن الإيمان في مجمع أفسس.",
          "يوضح خطورة تعليم نسطور على العقيدة المسيحية ووحدة طبيعة السيد المسيح.",
          "يستنتج معنى لقب \"والدة الإله\" وأهميته في الإيمان الكنسي.",
          "يشرح دور المجامع المسكونية في حفظ الإيمان المستقيم.",
          "يكتسب قيمة الثبات في الحق والدفاع عن العقيدة.",
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        title: "القيم والأخلاق: المسؤولية - البابا بطرس خاتم الشهداء",
        bookFrom: 70,
        concepts: [
          "يذكر أهم الأحداث في حياة البابا بطرس خاتم الشهداء.",
          "يشرح كيف تحمل البابا بطرس مسؤوليته في قيادة الكنيسة وقت الاضطهاد.",
          "يبين موقف البابا بطرس من تعليم أريوس الخاطئ.",
          "يستنتج معنى المسؤولية من مواقف البابا بطرس العملية.",
          "يقدر قيمة التضحية من أجل الآخرين.",
          "يقتدي بالبابا بطرس في الأمانة والثبات والدفاع عن الحق.",
          "يطبق قيمة المسؤولية في حياته اليومية داخل الأسرة والمدرسة والكنيسة.",
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
 * belong to — and lands the unit review on the last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_CHRISTIAN_G9_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_CHRISTIAN_G9_T1_UNITS.forEach((unit, ui) => {
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
  "christian-p3-t1",
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
// PHASE 80 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * Removes Arabic combining marks (fatha, damma, shadda, …). OCR sometimes
 * returns a fully vocalised running foot («الْوَحْدَةُ الثَّانِيَة - الدَّرْسُ
 * السَّادِسُ ٤٧»), which would otherwise defeat the footer-label test.
 */
function stripArabicMarks(text: string): string {
  return text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
}

/** The running-foot labels this book prints next to the page number. */
const FOOTER_LABEL = /الصف|الوحدة|الدرس|مراجعة|الفصل الدراس/;

/**
 * The book number a content page prints in its running foot, or null when the
 * last line is not a footer (unit openers and one continuation page print none,
 * and an activity line such as «دائمًا (٢). [ ] أحيانًا (١)...» carries several
 * numbers). The foot prints exactly one number on its own last line, so a line
 * with a footer label and a single number run is the footer.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const last = stripArabicMarks(lines[lines.length - 1] ?? "");
  if (!FOOTER_LABEL.test(last)) return null;
  const runs = toLatinDigits(last).match(/\d+/g) ?? [];
  if (runs.length !== 1) return null;
  return Number(runs[0]);
}

/**
 * Strips everything but letters and digits, then folds the letter variants OCR
 * and typography introduce (hamza forms → ا, alef maqsura → ي, ta marbuta → ه),
 * so spacing, vocalisation or a spelling variant cannot break a title match.
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
 * The topic half of a lesson's `category: topic` title — what a Prep-3 lesson
 * page actually prints. A title with no colon is returned whole.
 */
export function lessonTopic(title: string): string {
  const colon = title.indexOf(":");
  return (colon >= 0 ? title.slice(colon + 1) : title).trim();
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_CHRISTIAN_G9_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_CHRISTIAN_G9_T1_BOOK_START) {
    problems.push(
      `الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_CHRISTIAN_G9_T1_BOOK_START}، وجدنا ${first.bookFrom}`,
    );
  }
  if (last && last.bookTo !== EGYPT_CHRISTIAN_G9_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_CHRISTIAN_G9_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the offset and proves the mapping page by page;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every lesson's own first page prints that lesson's topic (the half after
 *     the first colon of its `category: topic` title);
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
    if (book < EGYPT_CHRISTIAN_G9_T1_BOOK_START || book > EGYPT_CHRISTIAN_G9_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_CHRISTIAN_G9_T1_BOOK_END - EGYPT_CHRISTIAN_G9_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_CHRISTIAN_G9_T1_BOOK_START} و${EGYPT_CHRISTIAN_G9_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints that lesson's topic.
  EGYPT_CHRISTIAN_G9_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      const topic = lessonTopic(lesson.title);
      if (!normalize(opener).includes(normalize(topic))) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع عنوانه «${topic}»`);
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
