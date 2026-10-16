// PHASE 149 — official Egypt Grade-1 Christian Religious Education
// («التربية الدينية المسيحية — الصف الأول الابتدائي»), first term.
//
// The curriculum tree for the Egypt `eg-g1-christian-education` curriculum is
// rebuilt from the Ministry textbook (88 scanned pages, first term only). This
// module is the single source of truth for the FIRST term: the three printed
// units (الله الخالق الغافر، الأسرة، الله يحبني), the six printed lessons of each
// — exactly as each unit's own index page lists them («الدرس الأول: العقيدة:
// الله الخالق» …) — and, for every lesson, the book's own printed «أهداف الدرس:
// بنهاية الدرس، يتوقع من التلميذ أن: …» list, verbatim. The self-checks at the
// bottom prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS 0 — book page N = scan page N
// Every content page that carries a folio prints its own number on its last
// line («٦» on scan 6, «٥٨» on scan 58, «٨٧» on scan 87): 80 pages prove it one
// by one. The three exception pages are named in `FOLIO_ANCHORS` below; nothing
// is loosened — a page with a folio on its last line must print its own number
// or the seeder refuses to run.
//
// THE THREE UNIT OPENERS ARE THE ONLY FOLIO EXCEPTIONS
// Scans 5, 31 and 57 print the unit's name («الوحدة الأولى / الله الخالق الغافر»)
// as a full-page title with no running number in the text the scan carries (its
// folio is drawn inside the decorative badge at the foot of the page, which the
// OCR did not transcribe). Each is therefore anchored on the unit name it prints
// verbatim, and each is verified to carry it.
//
// A LESSON'S TITLE IS THE BOOK'S OWN INDEX ENTRY
// Every unit opener repeats the unit's six lessons as the book's own index
// entries (٣/١ صفحة: «الدرس الأول: العقيدة: الله الخالق»). That printed entry is
// what this module stores as the lesson `title`, and `assertTreeMatchesTheBook`
// checks it is printed on the unit's opener page — so the six lessons of a unit
// cannot drift from the book's own list. `printedHead` holds the lines the
// lesson's own head page prints (its «الدرس …» line, its مجال, its title and any
// printed reference), and the head page must carry them.
//
// WHY A LESSON'S RANGE INCLUDES ITS REVIEW PAGE
// Every unit closes with «مراجعة على الوحدة …» (books 30, 56, 84) and the term
// closes with «اختبارات على الفصل الدراسي الأول» (books 85–87) — printed
// exercises with no «أهداف الدرس» of their own, so they are not lessons: they
// ride with the unit's last lesson, whose range therefore ends where the unit
// ends. A lesson's own `bookFrom` is still stored; the range it owns is derived
// as "from the unit's first page, down to the page before the next lesson
// starts, bounded by the unit".

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book page 6 = PDF 6). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the term — the opener of unit 1. */
export const EGYPT_CHRISTIAN_G1_T1_BOOK_START = 5;

/** Last printed page of the term — the third term-assessment page. */
export const EGYPT_CHRISTIAN_G1_T1_BOOK_END = 87;

/** The scanned pages before the term: cover, blank, مقدمة, محتويات الكتاب. */
export const EGYPT_CHRISTIAN_G1_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/** The scanned pages after the term: the credits page. */
export const EGYPT_CHRISTIAN_G1_T1_BACK_MATTER = { from: 88, to: 88 } as const;

/** One printed objective of a lesson — becomes one concept in the app tree. */
export interface ChristianG1T1Concept {
  /** Printed book page that carries this objective (the lesson's head page). */
  bookFrom: number;
  /** The printed component kind: «هدف». */
  kind: string;
  /** The printed objective, verbatim. */
  title: string;
}

/** One lesson («الدرس …») of the first term, as each unit's index page lists it. */
export interface ChristianG1T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal of the lesson, e.g. "الثالث". The book prints it («الدرس الثالث»). */
  ordinal: string;
  /** The lesson's opening component type — its first concept's kind. */
  type: string;
  /** The book's own printed index entry for this lesson (verified on the unit opener). */
  title: string;
  /** The lines the lesson's own head page prints (each must be found there). */
  printedHead: string[];
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed «أهداف الدرس» for this lesson, in order. */
  concepts: ChristianG1T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a unit — so no lesson below uses it; the
   * field is kept so this module shares the shape of the sibling Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — one of the three units of the first term. */
export interface ChristianG1T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"3". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: الله الخالق الغافر". */
  title: string;
  /** The lines the unit's opener page prints (each must be found there). */
  printedHead: string[];
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: ChristianG1T1Lesson[];
}

const TYPE = "هدف";

function concept(bookFrom: number, title: string): ChristianG1T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The three units of the first term with their printed lessons and every printed
 * «أهداف الدرس» item, transcribed from the head page of each lesson and checked
 * by `assertTreeMatchesTheBook` before seeding.
 *
 * Lesson titles are the index entries each unit's opener prints; each lesson's
 * concepts are the objective lines its head page prints, kept verbatim.
 */
export const EGYPT_CHRISTIAN_G1_T1_UNITS: ChristianG1T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: الله الخالق الغافر",
    printedHead: ["الوحدة الأولى", "الله الخالق الغافر"],
    bookFrom: 5,
    bookTo: 30,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الدرس الأول: العقيدة: الله الخالق",
        printedHead: ["الدرس الأول", "العقيدة", "الله الخالق"],
        bookFrom: 6,
        concepts: [
          concept(6, "يتعرف أن العالم من حوله هو من صنع الله."),
          concept(6, "يعبر عن إعجابه لتنوع الأشياء في العالم الذي خلقه الله."),
          concept(6, "يستنتج أن الله أحب الإنسان وخلقه وخلق الكون من أجله."),
          concept(6, "يشكر الله على كل الأشياء التي خلقها من أجله."),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الدرس الثاني: المحفوظات: (متى ٦: ٩-١٣) - (بعض الآيات الذهبية)",
        printedHead: ["الدرس الثاني", "المحفوظات (متى ٦: ٩-١٣)", "بعض الآيات الذهبية"],
        bookFrom: 10,
        concepts: [
          concept(10, "يتعرف مفردات الصلاة الربانية."),
          concept(10, "يردد بفهم الصلاة الربانية."),
          concept(10, "يردد بفهم كلمات الملاك للسيدة العذراء عند البشارة."),
          concept(10, "يعبر عن فرحته ببشارة الملاك للسيدة العذراء بميلاد الرب يسوع."),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الدرس الثالث: العبادة: أنا أحب بيت الله - حزقيا وتجديد الهيكل",
        printedHead: ["الدرس الثالث", "العبادة أنا أحب بيت الله (حزقيا وتجديد الهيكل)"],
        bookFrom: 14,
        concepts: [
          concept(14, "يؤيد أن بيت الله مكان جميل نحبه."),
          concept(14, "يساعد في الحفاظ على نظافة بيت الله."),
          concept(14, "يدلل على حب حزقيا الملك لبيت الله."),
          concept(14, "يخطط لبعض الأنشطة التطوعية لخدمة بيت الله."),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "الدرس الرابع: شخصيات كتابية: الطفلة القديسة مريم في الهيكل",
        printedHead: ["الدرس الرابع", "شخصيات كتابية", "الطفلة القديسة مريم في الهيكل"],
        bookFrom: 18,
        concepts: [
          concept(18, "يفسر سبب صلاة يواقيم وحنة."),
          concept(18, "يدلل على أن مريم بنت يواقيم كانت مطيعة لوالديها."),
          concept(18, "يعدد الصفات الجميلة في الطفلة مريم بنت يواقيم."),
          concept(18, "يقيم نفسه في ضوء الصفات الجميلة للطفلة مريم بنت يواقيم."),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "الدرس الخامس: شخصيات تاريخية: بشارة الملاك للقديسة العذراء مريم",
        printedHead: ["الدرس الخامس", "شخصيات تاريخية", "بشارة الملاك للقديسة العذراء مريم"],
        bookFrom: 22,
        concepts: [
          concept(22, "يشرح ما قاله الملاك للقديسة العذراء مريم."),
          concept(22, "يوضح رسالة الملاك للعذراء."),
          concept(22, "يصف فرحة العذراء ببشارة الملاك."),
          concept(22, "يردد بفهم «الله يحبني وأحب أن يكون معي وأنا معه»."),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: TYPE,
        // The unit's closing review (book 30) rides with this lesson.
        title: "الدرس السادس: القيم والأخلاق: قصة السلام - مريم ومرثا",
        printedHead: ["الدرس السادس", "القيم والأخلاق قصة السلام - مريم ومرثا"],
        bookFrom: 26,
        concepts: [
          concept(26, "يصف بيت مريم ومرثا."),
          concept(26, "يستنبط صداقة الرب يسوع بمريم ومرثا."),
          concept(26, "يعبر عن سعادة مريم ومرثا بزيارة الرب يسوع لبيتهما."),
          concept(26, "يقترح سلوكيات تعبر عن صداقته بالرب يسوع."),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: الأسرة",
    printedHead: ["الوحدة الثانية", "الأسرة"],
    bookFrom: 31,
    bookTo: 56,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الدرس الأول: العقيدة: أسرة سعيدة في جنة عدن",
        printedHead: ["الدرس الأول", "العقيدة أسرة سعيدة في جنة عدن"],
        bookFrom: 32,
        concepts: [
          concept(32, "يستنتج أن أجمل ما في الجنة، هو وجود الله مع آدم وحواء."),
          concept(32, "يصف سعادة آدم وحواء في الجنة، التي خلقها الله لهما."),
          concept(32, "يذكر بعض الأسماء التي أعطاها آدم للحيوانات، في جنة عدن."),
          concept(32, "يقترح طرقا؛ للعناية بمخلوقات الله."),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الدرس الثاني: المحفوظات: (لوقا ١: ٣٥) ( بعض الآيات الذهبية)",
        printedHead: ["الدرس الثاني", "المحفوظات", "(لوقا ١ : ٣٥)", "بعض الآيات الذهبية"],
        bookFrom: 36,
        concepts: [
          concept(36, "يتعرف حديث الملاك إلى السيدة العذراء مريم."),
          concept(36, "يردد بفهم كلمات الملاك للسيدة العذراء مريم."),
          concept(36, "يعبر عن فرحه بحديث الملاك للسيدة العذراء مريم."),
          concept(36, "يستنتج أن العذراء مريم هي أم الله."),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الدرس الثالث: العبادة: أنا أصلي كل يوم- دانيال",
        printedHead: ["الدرس الثالث", "العبادة", "أنا أصلي كل يوم (دانيال في جب الأسود)", "(دانيال ٦)"],
        bookFrom: 40,
        concepts: [
          concept(40, "يتعرف الشخصيات الرئيسة في القصة."),
          concept(40, "يستنتج أهمية الصلاة."),
          concept(40, "يؤيد أن الصلاة أنقذت دانيال من جب الأسود."),
          concept(40, "يصلي إلى الله كل يوم."),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "الدرس الرابع: شخصيات كتابية: ميلاد الرب يسوع",
        printedHead: ["الدرس الرابع", "شخصيات كتابية", "ميلاد الرب يسوع"],
        bookFrom: 44,
        concepts: [
          concept(44, "يتعرف أين ولد الطفل يسوع."),
          concept(44, "يشرح رسالة الملاك للرعاة."),
          concept(44, "يردد أنشودة الملائكة: \"المجد لله في الأعالي\"."),
          concept(44, "يصف فرحة الرعاة بالطفل يسوع."),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "الدرس الخامس: شخصيات تاريخية: زيارة المجوس",
        printedHead: ["الدرس الخامس", "شخصيات تاريخية", "زيارة المجوس", "(متى ٢)"],
        bookFrom: 48,
        concepts: [
          concept(48, "يصف النجم الذي ظهر للمجوس."),
          concept(48, "يشرح كيف قاد النجم المجوس للطفل يسوع."),
          concept(48, "يتعرف أن العطاء وسيلة للتعبير عن حبنا لله."),
          concept(48, "يعدد هدايا المجوس للطفل يسوع."),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: TYPE,
        // The unit's closing review (book 56) rides with this lesson.
        title: "الدرس السادس: القيم والأخلاق: قصة إتقان العمل - سفينة نوح",
        printedHead: ["الدرس السادس", "القيم والأخلاق قصة إتقان العمل: سفينة نوح", "(تكوين ٦)"],
        bookFrom: 52,
        concepts: [
          concept(52, "يذكر أن نوح رجل بار، أحب الله وأطاعه."),
          concept(52, "يستنتج أن نوح بنى السفينة بإتقان وعناية."),
          concept(52, "يوافق على أن العمل الجيد يحتاج إلى صبر."),
          concept(52, "يعبر عن عمل قام به بإتقان."),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الله يحبني",
    printedHead: ["الوحدة الثالثة", "الله يحبني"],
    bookFrom: 57,
    bookTo: 87,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الدرس الأول: العقيدة: الله يخلق جسدي وحواسي.",
        printedHead: ["الدرس الأول", "العقيدة", "الله يخلق جسدي وحواسي"],
        bookFrom: 58,
        concepts: [
          concept(58, "يذكر أن الله خلق له جسد وحواس."),
          concept(58, "يتعرف العالم الذي خلقه الله من خلال حواسه."),
          concept(58, "يميز بين الأصوات المختلفة في العالم."),
          concept(58, "يشكر الله الذي خلق له الحواس."),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الدرس الثاني: المحفوظات: ( لوقا ٢: ٤٦- ٤٧) ( بعض الآيات الذهبية).",
        printedHead: ["الدرس الثاني", "المحفوظات", "( لوقا ٢: ٤٦ - ٤٧)", "بعض الآيات الذهبية"],
        bookFrom: 63,
        concepts: [
          concept(63, "يردد بفهم آيات. (لوقا ٢: ٤٦ - ٤٧)."),
          concept(63, "يفسر معاني مفردات الآيات الذهبية."),
          concept(63, "يردد بفهم الآيات الذهبية."),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الدرس الثالث: العبادة: فيلبس الرسول يقرأ الإنجيل مع صديق.",
        printedHead: ["الدرس الثالث", "العبادة", "فيلبس الرسول يقرأ الإنجيل مع صديق", "(أعمال الرسل 8)"],
        bookFrom: 68,
        concepts: [
          concept(68, "يذكر طلب الملاك من فيلبس الرسول."),
          concept(68, "يتعرف أن الكتاب المقدس به قصص شيقة."),
          concept(68, "يفسر سر فرح فيلبس الرسول."),
          concept(68, "يطلب من أحد أفراد أسرتك أن يقرأ معك الكتاب المقدس."),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "الدرس الرابع: شخصيات كتابية: الرب يسوع يحب الأطفال.",
        printedHead: ["الدرس الرابع", "شخصيات كتابية", "الرب يسوع يحب الأطفال", "(لوقا ١٨)"],
        bookFrom: 72,
        concepts: [
          concept(72, "يشرح كيف كان الرب يسوع يعلم الناس في كل مكان."),
          concept(72, "يدلل أن الرب يسوع يهتم بالأطفال مثلما يهتم بالكبار."),
          concept(72, "يؤيد أنه يمكنه التحدث إلى الرب يسوع من خلال الصلاة."),
          concept(72, "يؤكد أن الرب يسوع لا يرفض الأطفال."),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "الدرس الخامس: شخصيات تاريخية: بولس الرسول يخبر ليديا بالإنجيل.",
        printedHead: ["الدرس الخامس", "شخصيات تاريخية", "بولس الرسول يخبر ليديا بالإنجيل", "(أعمال الرسل ١٦)"],
        bookFrom: 76,
        concepts: [
          concept(76, "يحلل ما فعله بولس الرسول في مدينة فيلبي."),
          concept(76, "يفسر لماذا طلبت ليديا أن تتبع تعاليم الرب يسوع."),
          concept(76, "يشرح لماذا صار بيت ليديا كنيسة."),
          concept(76, "يتحدث عن الرب يسوع مع أسرته."),
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: TYPE,
        // The unit's closing review (book 84) and the term assessment
        // (books 85–87) ride with this lesson.
        title: "الدرس السادس: القيم والأخلاق: قصة الصدق - السامرية.",
        printedHead: ["الدرس السادس", "القيم والاخلاق قصة الصدق - السامرية"],
        bookFrom: 80,
        concepts: [
          concept(80, "يتعرف أن الرب يسوع يحب الجميع بدون تمييز."),
          concept(80, "يتفق على أن الرب يسوع يحبنا رغم أخطائنا."),
          concept(80, "يستنتج أن الصدق يجعل قلبنا نظيفا وقريبا من الرب."),
          concept(80, "يتدرب علي الصدق في معاملاته اليومية."),
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/** Printed page span a lesson owns (see the header: the review rides on the last). */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_CHRISTIAN_G1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_CHRISTIAN_G1_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/** The printed-page span of a unit, taken from the table itself. */
export function unitBookRange(unitIndex: number): { from: number; to: number } {
  const unit = EGYPT_CHRISTIAN_G1_T1_UNITS[unitIndex]!;
  return { from: unit.bookFrom, to: unit.bookTo };
}

/**
 * PHASE 75 — appendix pages per printed lesson key. This book has no appendix,
 * so the map is empty; the function exists so the lesson-page stager can treat
 * every book the same way.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const unit of EGYPT_CHRISTIAN_G1_T1_UNITS) {
    for (const lesson of unit.lessons) {
      if (lesson.extraBookPages && lesson.extraBookPages.length > 0) {
        out.set(lesson.key, [...lesson.extraBookPages]);
      }
    }
  }
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
  "christian-g1-t1",
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
// PHASE 149 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed folio can be compared to a number. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * Strips everything but letters and digits: harakat, punctuation, spacing and
 * line breaks all drop out, so a printed line can be compared to the string the
 * book prints without depending on how the scanner ordered the marks.
 */
function normalize(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

function lastLine(text: string): string {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
}

/**
 * The book number a content page prints in its running foot, or null when its
 * last line is not a bare number. This book prints the folio as a plain number
 * («٦», «٥٨», «٨٧»), so anything else on the last line means "no folio here" and
 * the page must be one of the documented exceptions.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = toLatinDigits(lastLine(text)).trim();
  if (!/^\d+$/.test(last)) return null;
  return Number(last);
}

/** True when the page's own number is printed somewhere in the OCR text. */
function pagePrintsNumber(book: number): boolean {
  const text = toLatinDigits(loadBookPage(book));
  return new RegExp(`(^|\\D)${book}(\\D|$)`).test(text);
}

/**
 * Head pages whose folio the OCR read above the objectives box instead of on the
 * last line. This book has none — every content page but the three unit openers
 * prints its folio as the last line — so the list is empty and kept for the shape
 * shared with the sibling Egyptian specs.
 */
export const FOLIO_MID_PAGE: readonly number[] = [];

/**
 * The pages that print no number in the text the scan carries, each anchored on
 * a marker that survives verbatim on the page: the three unit openers (books 5,
 * 31, 57), whose folio is drawn inside the decorative badge at the foot of the
 * page and was not transcribed. Each anchor is the unit name the opener prints.
 */
export const FOLIO_ANCHORS: Readonly<Record<number, string>> = {
  5: "الله الخالق الغافر",
  31: "الأسرة",
  57: "الله يحبني",
};

/** True when a content page carries real text (not the blank-page placeholder). */
function pageHasText(book: number): boolean {
  const text = loadBookPage(book);
  return text.length > 0 && !text.includes("لا يوجد نص");
}

/**
 * Table invariants: lesson keys match their position, every lesson sits inside
 * its unit, units tile the book without gaps or overlaps, every lesson has at
 * least one printed objective and each objective is printed inside its unit, and
 * the first unit starts and the last one ends exactly where the term does. A
 * content mistake here would quietly ground the tutor on the wrong pages, so it
 * fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_CHRISTIAN_G1_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    if (unit.printedHead.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا ترويسة مطبوعة`);
    if (unit.bookFrom >= unit.bookTo) problems.push(`الوحدة ${unit.ordinal}: نطاق معكوس ${unit.bookFrom}–${unit.bookTo}`);

    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.printedHead.length === 0) problems.push(`الدرس ${lesson.key}: بلا ترويسة مطبوعة`);
      if (!lesson.title.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان`);
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف مطبوعة`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول هدف`);
      }
      if (lesson.bookFrom <= unit.bookFrom || lesson.bookFrom > unit.bookTo) {
        problems.push(
          `الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق الوحدة ${unit.bookFrom + 1}–${unit.bookTo}`,
        );
      }
      for (const [ci, c] of lesson.concepts.entries()) {
        if (!c.title.trim()) problems.push(`الدرس ${lesson.key} هدف ${ci + 1}: بلا نص`);
        if (c.kind !== TYPE) problems.push(`الدرس ${lesson.key} هدف ${ci + 1}: نوعه «${c.kind}» بدل «${TYPE}»`);
        if (c.bookFrom < unit.bookFrom || c.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} هدف ${ci + 1}: صفحته ${c.bookFrom} خارج نطاق الوحدة`);
        }
      }
      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق الوحدة ${unit.bookFrom}–${unit.bookTo}`);
      }
      if (lesson.bookFrom < from || lesson.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: صفحة ترويسته ${lesson.bookFrom} خارج نطاقه ${from}–${to}`);
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
      problems.push(
        `فجوة صفحات بين ${unit.ordinal} و${nextUnit.ordinal}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`,
      );
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_CHRISTIAN_G1_T1_BOOK_START) {
    problems.push(
      `الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_CHRISTIAN_G1_T1_BOOK_START}، وجدنا ${first.bookFrom}`,
    );
  }
  if (last && last.bookTo !== EGYPT_CHRISTIAN_G1_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_CHRISTIAN_G1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed folio of every content page proves its book number — 80 pages
 *     print it on their last line and the 3 unit openers whose folio the scan
 *     does not carry are named in `FOLIO_ANCHORS` and verified against the unit
 *     name printed on them;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every unit's opener page prints the unit's own printed head *and* the unit's
 *     six printed lesson index entries — the tree cannot drift from the book's
 *     own table of lessons;
 *  4. every lesson's head page prints that lesson's printed head and the printed
 *     «أهداف الدرس» marker its objectives live under;
 *  5. every lesson's printed objectives are on the page that carries them,
 *     verbatim — the objectives the app ships are the book's own words;
 *  6. every printed page in the book is owned by exactly one lesson — no page can
 *     fall between two lessons and be unreachable.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  let folioProven = 0;
  let anchored = 0;

  const files = existsSync(OCR_DIR)
    ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort()
    : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_CHRISTIAN_G1_T1_BOOK_START || book > EGYPT_CHRISTIAN_G1_T1_BOOK_END) continue;
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
      folioProven++;
      if (footer !== book) problems.push(`صفحة الكتاب ${book}: الفوتر المطبوع ${footer} لا يطابق رقمها`);
      continue;
    }
    if (FOLIO_MID_PAGE.includes(book)) {
      folioProven++;
      if (!pagePrintsNumber(book)) {
        problems.push(`صفحة الكتاب ${book}: موثّقة كذات فوتر في وسط الصفحة، ولا يظهر رقمها في نصّها`);
      }
      continue;
    }
    const anchor = FOLIO_ANCHORS[book];
    if (!anchor) {
      problems.push(`صفحة الكتاب ${book}: بلا فوتر في آخر سطر وليست في الاستثناءات الموثقة`);
      continue;
    }
    anchored++;
    if (!normalize(text).includes(normalize(anchor))) {
      problems.push(`صفحة الكتاب ${book}: بلا فوتر وفيها استثناء، لكن علامتها «${anchor}» غير مطبوعة عليها`);
    }
  }

  if (printedPages.size !== EGYPT_CHRISTIAN_G1_T1_BOOK_END - EGYPT_CHRISTIAN_G1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_CHRISTIAN_G1_T1_BOOK_START} و${EGYPT_CHRISTIAN_G1_T1_BOOK_END}`,
    );
  }
  if (folioProven < 78) {
    problems.push(`أرقام الفوتر قليلة (${folioProven}) — المسار أو القاعدة غير صحيحة`);
  }
  if (anchored !== Object.keys(FOLIO_ANCHORS).length) {
    problems.push(`الاستثناءات الموثقة ${Object.keys(FOLIO_ANCHORS).length} لكن المفحوص منها ${anchored}`);
  }

  // 3 + 4 + 5.
  EGYPT_CHRISTIAN_G1_T1_UNITS.forEach((unit) => {
    const opener = loadBookPage(unit.bookFrom);
    if (!opener) {
      problems.push(`الوحدة ${unit.ordinal}: صفحة صدرها ${unit.bookFrom} بلا نص OCR`);
    } else {
      for (const line of unit.printedHead) {
        if (!normalize(opener).includes(normalize(line))) {
          problems.push(`الوحدة ${unit.ordinal}: صدرها ${unit.bookFrom} لا يطبع «${line}»`);
        }
      }
      for (const lesson of unit.lessons) {
        if (!normalize(opener).includes(normalize(lesson.title))) {
          problems.push(`الوحدة ${unit.ordinal}: صدرها ${unit.bookFrom} لا يطبع عنوان الدرس «${lesson.title}»`);
        }
      }
    }
    unit.lessons.forEach((lesson) => {
      const head = loadBookPage(lesson.bookFrom);
      if (!head) {
        problems.push(`الدرس ${lesson.key}: صفحة ترويسته ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      for (const line of lesson.printedHead) {
        if (!normalize(head).includes(normalize(line))) {
          problems.push(`الدرس ${lesson.key}: صفحته ${lesson.bookFrom} لا تطبع «${line}»`);
        }
      }
      if (!normalize(head).includes(normalize("أهداف الدرس"))) {
        problems.push(`الدرس ${lesson.key}: صفحته ${lesson.bookFrom} لا تطبع «أهداف الدرس»`);
      }
      for (const c of lesson.concepts) {
        const page = loadBookPage(c.bookFrom);
        if (!page) {
          problems.push(`الدرس ${lesson.key}: صفحة الأهداف ${c.bookFrom} بلا نص OCR`);
        } else if (!normalize(page).includes(normalize(c.title))) {
          problems.push(`الدرس ${lesson.key}: هدف «${c.title}» غير مطبوع في صفحة الكتاب ${c.bookFrom}`);
        }
      }
    });
  });

  // 6. every printed page is owned by exactly one lesson.
  const ranges = allLessonRanges();
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: folioProven };
}
