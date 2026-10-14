// PHASE G7-chr — official Egypt Preparatory-1 (Grade 7) Christian Religious
// Education, first term («كتاب التلميذ»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g7-christian-education` is rebuilt from the Ministry
// textbook `Christian_Education_Prep1_T1.pdf` (98 scan pages, all OCR'd). This
// module is the single source of truth for its structure: the three units
// («الكتاب المقدس ورحلة الخلاص»، «بعض ملامح الإيمان المسيحي»، «التواضع والفداء»)
// and their six lessons each, exactly as the book's unit openers print their
// lesson index («الدرس الأول…السادس»), and the «أهداف الدرس» the book prints at
// the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 1   (book page 7 = PDF page 8)
// Every content page prints its own book number bare in the running foot — in
// Arabic-Indic («١٦»), Extended Arabic-Indic («۸۷») or Latin («11») digits —
// which fixes the offset at 1. The three unit openers print no footer (their
// last line is the unit's lesson index); every other content page proves the
// mapping page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس»
// The book's printed index stops at the lesson (three units × six lessons); it
// has no «مفهوم» layer. So the app mirrors the book: unit → lesson. Each
// lesson's RAG document is the whole lesson (its pages, including the
// «الأنشطة والممارسات» and «أسئلة الدرس» blocks the book places at the end of it).
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND UNIT REVIEW
// Each unit opens with an opener page (title + lesson index) and closes with
// «مراجعة على الوحدة»; the last unit also carries the «مراجعة عامة» of the
// first term (books 92–95) and closes before the book's colophon (book 96).
// None of these is a lesson, so — exactly as the Preparatory-2 and Preparatory-3
// books do — the opener rides with the unit's first lesson and the review with
// its last. A lesson's own `bookFrom` is still stored; the range it owns is
// derived as "from the unit's first page, down to the page before the next
// lesson starts, bounded by the unit".
//
// WHY THE LESSON TITLE CHECK LOOKS AT THE LESSON'S PAGES, NOT ONLY ITS HEAD
// A Prep-1 lesson page prints its title in separate blocks — the category
// (e.g. «العقيدة»), then «الدرس N», then the topic. The title stored here is the
// full «category: topic» the unit opener's index shows; verification compares
// the topic after the first colon against the lesson's own pages (its head page
// normally carries it, and the scan sometimes reorders a head's two words, so
// the check spans the lesson rather than the single head line).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book page 7 = PDF 8). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_CHRISTIAN_P1_T1_BOOK_START = 6;

/** Last printed content page — the closing page of the term's «مراجعة عامة». */
export const EGYPT_CHRISTIAN_P1_T1_BOOK_END = 95;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface ChristianP1T1Lesson {
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

export interface ChristianP1T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "الوحدة الأولى: الكتاب المقدس ورحلة الخلاص". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (including its «مراجعة على الوحدة»). */
  bookTo: number;
  lessons: ChristianP1T1Lesson[];
}

/**
 * The three units of the first term with their eighteen lessons: unit/lesson
 * starts from the unit openers (6, 36, 65) and the printed lesson index of
 * each, objectives from each lesson's first page. Verified against every
 * printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_CHRISTIAN_P1_T1_UNITS: ChristianP1T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: الكتاب المقدس ورحلة الخلاص",
    bookFrom: 6,
    bookTo: 35,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "العقيدة: الكتاب المقدس من التكوين إلى الرؤيا قصة واحدة",
        bookFrom: 7,
        concepts: [
          "يتعرف أن الكتاب المقدس كله يحكي قصة الفداء.",
          "يربط بين العهد القديم والذبيحة الكاملة في العهد الجديد (الرب يسوع).",
          "يشرح رموز الخروف والذبح والفداء من سفر التكوين إلى سفر الرؤيا.",
          "يعبر عن قيمة الكتاب المقدس كوحي إلهي يحوي خطة الله لخلاص البشر.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "المحفوظات: (متى ٦: ١٤-١٨) - بعض الآيات الذهبية",
        bookFrom: 12,
        concepts: [
          "يتعرف معنى الغفران الحقيقي الذي يطلبه الله من أولاده.",
          "يربط بين غفراننا للآخرين وغفران الله لنا.",
          "يميز بين الصوم الحقيقي والصوم الريائي.",
          "يردد بفهم الآيات ويستعين بها في حياته اليومية.",
          "يستخرج بعض القيم الروحية من الآيات الذهبية مطبقًا إياها في مواقف حياتية.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "العبادة: الصوم في حياة رجال الله",
        bookFrom: 16,
        concepts: [
          "يفسر الصوم بأنه ليس مجرد امتناع عن الطعام.",
          "يلخص أحداث صوم كل من موسى، إيليا، دانيال، إستير، نحميا.",
          "يستنتج دور الصوم في الظروف المختلفة وقت الخوف، التوبة، طلب المعونة.",
          "يتعرف أن الصوم وسيلة للانتصار الروحي.",
          "يربط بين الصوم والصلاة والعمل.",
          "يطبق الصوم في حياته اليومية ويُقدّس وقته بالصلاة وقراءة الكتاب المقدس.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "شخصيات كتابية: آدم وأولاده - الخليقة والسقوط",
        bookFrom: 20,
        concepts: [
          "يلخص أيام الخليقة الستة في شكل تخطيطي.",
          "يقر أن الله هو خالق كل شيء بقوة كلمته.",
          "يدلل من الكتاب المقدس على أن الإنسان خُلق على صورة الله ومثاله.",
          "يستنتج أن وصية الله لآدم وحواء كانت تعبيرًا عن محبته.",
          "يتعرف وعد الله بالخلاص من خلال نسل المرأة (يسوع المسيح) الذي يسحق رأس الحية.",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "شخصيات تاريخية: تلاميذ السيد المسيح - نشأة كنيسة العهد الجديد",
        bookFrom: 25,
        concepts: [
          "يتعرف أن الرب يسوع أوصى تلاميذه بالانتظار في أورشليم إلى أن ينالوا قوة الروح القدس.",
          "يستنتج أن التلاميذ يصلون معًا في علية مارمرقس.",
          "يتعرف أحداث يوم حلول الروح القدس.",
          "يشرح أن الروح القدس منح التلاميذ الشجاعة ليكرزوا بالإنجيل أمام الشعوب.",
          "يسرد موقفًا يدل أنه يشهد للرب في حياته اليومية.",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "القيم والأخلاق: الرحمة (لو ٧: ٤٩)",
        bookFrom: 31,
        concepts: [
          "يدلل أن الله ينظر إلى القلب، لا إلى المظهر.",
          "يستنتج أن الرحمة تعني القبول والغفران دون شروط.",
          "يفرق بين التدين الظاهري والمحبة الصادقة.",
          "يعبر عن قيمة التوبة الصادقة وأثرها في الحصول على الغفران والسلام.",
          "يسرد موقفًا حياتيًا يوضح اقتدائه بمحبة المسيح وغفرانه.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: بعض ملامح الإيمان المسيحي",
    bookFrom: 36,
    bookTo: 64,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "العقيدة: الثالوث في الكتاب المقدس",
        bookFrom: 37,
        concepts: [
          "يتعرف أن الله واحد مثلث الأقانيم: الآب، والابن، والروح القدس.",
          "يستنتج أن الأقانيم الثلاثة متساوون في الجوهر ومتمايزون في الأدوار.",
          "يشرح كيف يشترك الآب والابن والروح القدس في كل الأعمال.",
          "يحدد دور الثالوث في الخليقة والعماد والخلاص.",
          "يدلل بآيات من الكتاب المقدس على أن الله واحد مثلث الأقانيم.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "المحفوظات: (متى ٦: ١٩-٢١) - بعض الآيات الذهبية",
        bookFrom: 42,
        concepts: [
          "يتعرف معنى الكنز الحقيقي الذي لا يفنى.",
          "يميز بين كنوز الأرض الزائلة وكنوز السماء الباقية.",
          "يستنتج العلاقة بين التعلق بالماديات والحياة الروحية.",
          "يحفظ الآيات بفهم ليطبقها عمليًا في حياته اليومية.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "العبادة: التوبة - الأنبا موسى الأسود",
        bookFrom: 46,
        concepts: [
          "يتعرف أن التوبة قادرة على تغيير حياة الإنسان.",
          "يستنتج أن البحث الجاد عن الله يقود إلى معرفته واختبار محبته.",
          "يذكر أهمية دور الأب الروحي في إرشاد التائبين ومساندتهم.",
          "يدلل على أن الجهاد الروحي ينتصر على حروب الشيطان.",
          "يستنتج أن محبة الله هي التي تجعل الإنسان مستعدًا لاحتمال الآلام.",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "شخصيات كتابية: نوح وأولاده - الطوفان والبرج",
        bookFrom: 51,
        concepts: [
          "يتعرف نتائج خطية قايين.",
          "يقارن بين نسل قايين ونسل شيث وعلاقتهم بالله.",
          "يربط بين سير أخنوخ مع الله وبين فكرة الحياة الأبدية.",
          "يستنتج أن طاعة نوح لوصايا الله كانت سبب نجاته من الطوفان.",
          "يكتشف خطورة الكبرياء في قصة برج بابل وأثره في تفريق الناس.",
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        title: "شخصيات تاريخية: استفانوس وعصر الرسل",
        bookFrom: 55,
        concepts: [
          "يتعرف أهم أحداث حياة استفانوس كأول شماس وشهيد في تاريخ الكنيسة.",
          "يثمن شجاعة استفانوس في الشهادة للحق حتى الموت.",
          "يدلل على فضيلة الغفران من حياة استفانوس.",
          "يستنتج أن الاضطهاد يزيد الكرازة قوة وانتشارًا.",
          "يربط بين استشهاد استفانوس وبداية خدمة بولس الرسول.",
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        title: "القيم والأخلاق: المروءة والإيثار",
        bookFrom: 59,
        concepts: [
          "يتعرف مفهوم المروءة من خلال مواقف عملية في الكتاب المقدس وتاريخ الكنيسة.",
          "يشرح معنى الإيثار وأهميته في العلاقات الإنسانية.",
          "يذكر أحداث قصة داود والماء من بئر بيت لحم بدقة.",
          "يصف موقف القديس بوليكاربوس مع الجنود ويستنتج القيم منه.",
          "يلتزم بوصية السيد المسيح في محبة الأعداء والإحسان إلى الآخرين.",
          "يسرد موقفًا حياتيًا يوضح المروءة والإيثار في حياته اليومية.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: التواضع والفداء",
    bookFrom: 65,
    bookTo: 95,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "العقيدة: الرب يسوع الفادي المخلص",
        bookFrom: 66,
        concepts: [
          "يتعرف أن الله خلق الإنسان على صورته ومثاله ليعيش في شركة حب معه.",
          "يستنتج خطورة الخطية التي أدخلت الموت إلى العالم.",
          "يشرح كيف أن الله لم يترك الإنسان بل وعده بالفادي الذي يسحق رأس الحية.",
          "يفسر شروط الفادي: إنسان بلا خطية، يقبل أن يموت عنا، أقوى من الموت، خالق، وغير محدود.",
          "يستنتج أن شروط الفادي لم تنطبق إلا على الرب يسوع المسيح الفادي والمخلص.",
          "يطبق الفداء في حياته اليومية من خلال الشركة مع الله.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "المحفوظات: (متى ٦: ٢٢-٢٤) - بعض الآيات الذهبية",
        bookFrom: 70,
        concepts: [
          "يردد بفهم بعض آيات من الكتاب المقدس.",
          "يستنتج أن العين البسيطة تعني القلب النقي.",
          "يميز بين خدمة الله وخدمة المال مقررًا أنه لا يمكن أن يجمع بين الاثنين.",
          "يعبر عن اعتماده على الله في كل احتياجاته اليومية.",
          "يطبق ما حفظه من الآيات في حياته اليومية.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "العبادة: الكنيسة بيت الله",
        bookFrom: 74,
        concepts: [
          "يتعرف مكان بناء الهيكل (جبل المريا في أورشليم) وأهمية هذا المكان.",
          "يصف مشهد فرح الشعب عند اكتمال بناء الهيكل وامتلائه بمجد الله.",
          "يشرح دور الصلاة في تكريس بيت الرب كما فعل سليمان.",
          "يستنتج أن الله يسكن وسط شعبه دائمًا.",
          "يعبر عن شكره لله الذي يدعونا للوجود في حضرته باستمرار.",
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        title: "شخصيات كتابية: أيوب البار",
        bookFrom: 78,
        concepts: [
          "يتعرف أن البرّ الحقيقي هو محبة الله من القلب وليس من أجل المكاسب المادية.",
          "يدلل من حياة أيوب على أن الشيطان قد يجرب الإنسان لكن بحدود يضعها الله.",
          "يستنتج أن الله عظيم وحكمته تفوق فهم الإنسان.",
          "يعبر عن ثقته أن الله يرد كل خسارة ويعوض بركات أعظم.",
          "يسرد موقفًا حياتيًا يدلل على حياة الإيمان والرجاء مهما كانت الظروف.",
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        title: "شخصيات تاريخية: مجمع أورشليم",
        bookFrom: 82,
        concepts: [
          "يتعرف مجمع أورشليم وأهميته كأول مجمع في تاريخ الكنيسة.",
          "يستنتج أن الخلاص بالإيمان بالرب يسوع المسيح وليس بأعمال الناموس.",
          "يعبر عن أهمية المشورة والرجوع إلى قادة الكنيسة عند مواجهة مشكلة.",
          "يدلل على أن الروح القدس هو القائد الحقيقي للكنيسة.",
          "يعبر عن فرحه بأن الإنجيل رسالة خلاص لجميع الناس.",
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        title: "القيم والأخلاق: التواضع في حياة السيد المسيح",
        bookFrom: 87,
        concepts: [
          "يتعرف أن السيد المسيح تنازل من مجده السماوي ليعيش بيننا.",
          "يدرك أن التواضع يبدأ من البساطة، مثل ميلاد المسيح في مزود حقير.",
          "يستنتج أن الحياة اليومية البسيطة (كالعمل والرضا) جزء من التواضع.",
          "يقتنع أن الخدمة الحقيقية هي أن نضع الآخرين قبل أنفسنا.",
          "يتأمل في الصليب كأعلى مثال للتواضع الذي قاد إلى المجد.",
          "يقتدي بالسيد المسيح في حياته اليومية.",
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
  const unit = EGYPT_CHRISTIAN_P1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_CHRISTIAN_P1_T1_UNITS.forEach((unit, ui) => {
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
  "christian-p1-t1",
);

/**
 * The OCR provider answers a truly blank page with this sentence instead of an
 * empty string. It means "no text", not content, so verification treats it as
 * missing while `loadBookPage` still returns it verbatim.
 */
const NO_TEXT = /لا يوجد نص/;

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
  return text.length > 0 && !NO_TEXT.test(text);
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
// PHASE G7-chr — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EXT_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/**
 * Arabic-Indic («١٦») and Extended Arabic-Indic («۸۷») digits → Latin, so a
 * printed footer can be compared to a number. The OCR mixes both digit systems —
 * scans of some pages render «۸۷», «۳۱», «۹۱» — so a reader must accept either.
 */
function toLatinDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EXT_DIGITS.indexOf(d)));
}

/**
 * Removes Arabic combining marks (fatha, damma, shadda, …). OCR sometimes
 * returns a fully vocalised line («الرَّبُّ يَسُوعُ الفَادِي المُخْلِص»), which
 * would otherwise defeat the footer and title tests.
 */
function stripArabicMarks(text: string): string {
  return text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
}

/**
 * The book number a content page prints in its running foot, or null when the
 * last line is not a footer. This book's foot is the page number alone, bare in
 * either digit system («١٦» or «11»), so a last line of pure digits is a footer.
 * The three unit openers print none (their last line is the unit's lesson
 * index); the book's colophon (book 96) and blank back cover sit outside the
 * content range.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const last = stripArabicMarks(lines[lines.length - 1] ?? "");
  const latin = toLatinDigits(last);
  if (!/^\d+$/.test(latin)) return null;
  return Number(latin);
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
 * The topic half of a lesson's `category: topic` title — what a Prep-1 lesson
 * page actually prints. A title with no colon is returned whole.
 */
export function lessonTopic(title: string): string {
  const colon = title.indexOf(":");
  return (colon >= 0 ? title.slice(colon + 1) : title).trim();
}

/** Normalized word tokens of a text: marks stripped, letter variants folded. */
function words(text: string): string[] {
  return stripArabicMarks(text)
    .split(/[^\p{L}\p{N}]+/u)
    .map((w) => normalize(w))
    .filter(Boolean);
}

/**
 * OCR-tolerant word equality: identical, or the page simply dropped one letter
 * of the printed word. Anything more different is a real mismatch.
 */
function fuzzyEqual(a: string, b: string): boolean {
  if (a === b) return true;
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  if (long.length !== short.length + 1) return false;
  let j = 0;
  for (let i = 0; i < long.length && j < short.length; i++) {
    if (long[i] === short[j]) j++;
  }
  return j === short.length;
}

/**
 * True when the topic's words appear in order inside the page text. This is the
 * fallback for a contiguous-match miss: the OCR occasionally reorders a head's
 * two stacked words («شخصيات كتابية») or embeds badges into a flowing line,
 * which would otherwise defeat a single-string comparison.
 */
export function topicWordsInOrder(topic: string, pageText: string): boolean {
  const tw = words(topic);
  const pw = words(pageText);
  let j = 0;
  for (let i = 0; i < pw.length && j < tw.length; i++) {
    const pageWord = pw[i];
    const topicWord = tw[j];
    if (pageWord && topicWord && fuzzyEqual(pageWord, topicWord)) j++;
  }
  return j === tw.length;
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_CHRISTIAN_P1_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_CHRISTIAN_P1_T1_BOOK_START) {
    problems.push(
      `الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_CHRISTIAN_P1_T1_BOOK_START}، وجدنا ${first.bookFrom}`,
    );
  }
  if (last && last.bookTo !== EGYPT_CHRISTIAN_P1_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_CHRISTIAN_P1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the offset and proves the mapping page by page;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every lesson's own pages print that lesson's topic (the half after the
 *     first colon of its `category: topic` title); the head page normally
 *     carries it, and its body always does, so the whole lesson span is checked;
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
    if (book < EGYPT_CHRISTIAN_P1_T1_BOOK_START || book > EGYPT_CHRISTIAN_P1_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_CHRISTIAN_P1_T1_BOOK_END - EGYPT_CHRISTIAN_P1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_CHRISTIAN_P1_T1_BOOK_START} و${EGYPT_CHRISTIAN_P1_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own pages print that lesson's topic.
  EGYPT_CHRISTIAN_P1_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { to } = lessonBookRange(ui, li);
      const ownPages = loadBookRange(lesson.bookFrom, to);
      if (!ownPages) {
        problems.push(`الدرس ${lesson.key}: صفحاته ${lesson.bookFrom}–${to} بلا نص OCR`);
        return;
      }
      const topic = lessonTopic(lesson.title);
      const printed =
        normalize(ownPages).includes(normalize(topic)) || topicWordsInOrder(topic, ownPages);
      if (!printed) {
        problems.push(`الدرس ${lesson.key}: صفحاته ${lesson.bookFrom}–${to} لا تطبع عنوانه «${topic}»`);
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