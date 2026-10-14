// PHASE 107 — official Egypt Secondary-1 (Grade 10) Integrated Science
// («العلوم المتكاملة»), first term, Ministry 2026/2027 edition.
//
// The curriculum tree for the Egypt `eg-g10-integrated-science` curriculum is
// rebuilt from the Ministry textbook `العلوم المتكاملة - الصف الأول الثانوي`
// (114 scanned pages). This module is the single source of truth for its
// structure: the two units of the first term, their fourteen printed lessons
// and, for every lesson, the book's own printed heads — the unit
// «نواتج التعلم»/«القضايا المتضمنة» and each lesson's printed topical and
// «تدريبات» heads — verbatim and with the printed page they start on. The
// self-checks at the bottom prove that mapping against the OCR itself, page by
// page.
//
// THE OFFSET IS FIVE — book page = scan page − 5
// Every content page prints its own folio, so `BOOK_TO_PDF_OFFSET` is fixed by
// the scan itself and quoted here: scan 13 prints «العلوم المتكاملة - الصف الأول
// الثانوي ٨» (book 8), scan 94 prints the bare «۸۹» (book 89), scan 99 prints
// «94 العلوم المتكاملة - الصف الأول الثانوى» (book 94), scan 103 prints
// «العلوم المتكاملة - الصف الأول الثانوي (98)» (book 98) and scan 113 prints
// «العلوم المتكاملة - الصف الأول الثانوي ١٠٨» (book 108). The book's own
// «المحتويات» (scan 5) independently confirms it: it lists every lesson with the
// very book page its head prints on (1-1 → 5, 1-2 → 8, 1-3 → 16, … 4-2 → 98).
// 96 of the 106 term pages print a folio and every one of them prints its own
// number; the other ten lost their folio in the OCR (see `FOLIO_LESS_PAGES`).
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–7 are before the term: the cover (1), the contributors masthead
// (2), the «مقدمة» (3), the «الأهداف العامة لمنهج العلوم المتكاملة» (4), the
// printed «المحتويات» (5), the first-term divider «الفصل الدراسي الأول» (6) and
// one fully blank page (7). Scan page 114 is the back cover. The term runs from
// the unit 1 opener (book 3 = scan 8) to the last «تدريبات» (book 108 = scan
// 113): `EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_START` / `_END` are exactly those
// two pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` therefore equals 108 − 3 + 1 = 106.
//
// TEN TERM PAGES LOST THEIR FOLIO IN THE OCR
// The nine content pages 4, 5, 7, 9, 20, 71, 90, 92 and the unit 2 opener page
// 67 print no standalone folio in the OCR (their last line is the running foot
// «العلوم المتكاملة …», which carries no page number, or the unit opener's
// issue list). Together with the unit 1 opener (book 3, whose last line is an
// issue) they are the only term pages without a folio. Rather than weaken the
// page-number check, they are exempt from it and each is anchored on the only
// book-specific marker that survives on that page: the running foot
// «العلوم المتكاملة» for the eight content pages, or the page's own unit head
// for the two unit openers (book 3 «النظام البيئي المائي», book 67 «الغلاف
// الجوي»). See `FOLIO_LESS_PAGES` and step 1 of `assertTreeMatchesTheBook`.
//
// THE UNIT OPENER AND THE UNIT INTRO RIDE WITH THE UNIT'S FIRST LESSON
// Each unit opens with a one-page opener (the unit title, its «نواتج التعلم» and
// its «القضايا المتضمنة») followed by a «مقدمة الوحدة» page and then the unit's
// first numbered lesson. Neither the opener nor the intro is a lesson, so — as in
// the other Ministry books — both ride with the unit's first lesson, whose range
// therefore starts at the unit opener.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// This book prints no per-lesson «أهداف الدرس»; its only printed objectives are
// the unit's «نواتج التعلم» (and its «القضايا المتضمنة» issues) on the opener
// page. Those objective lines are carried, verbatim, as the concepts of the
// unit's first lesson, and every lesson additionally carries its own printed
// topical heads and its closing «تدريبات» head. Every concept title below is a
// string the book itself prints on the page its `bookFrom` names; nothing is
// invented.
//
// THE BOOK NUMBERS ITS LESSONS INCONSISTENTLY
// The «المحتويات» writes the unit's lessons as (unit-lesson) — «1 - 1», «1 - 2»
// … — but the lesson heads themselves mostly print the reverse order
// («٢-١», «4-1», «1 - 2», «3 - 2»), and lessons 3, 8 and 9 differ again
// («1 - 3», «1-8», «1-9»). The app ignores the book's own numbering and keys every
// lesson by its position (unit then lesson: «1-1» … «2-4»), while each lesson's
// `printedHead` keeps the head exactly as the OCR reads it on the page.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 5 (verified: book p.8 = scan p.13). */
export const BOOK_TO_PDF_OFFSET = 5;

/** First printed page of the term — the unit 1 opener (scan 8). */
export const EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_START = 3;

/** Last printed page of the term — the last lesson's «تدريبات» (scan 113). */
export const EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_END = 108;

/** The scanned pages before the term: cover, masthead, مقدمة, general aims, المحتويات, divider, blank. */
export const EGYPT_INTEGRATED_SCIENCE_G10_T1_FRONT_MATTER = { from: 1, to: 7 } as const;

/** The scanned page after the term: the back cover. */
export const EGYPT_INTEGRATED_SCIENCE_G10_T1_BACK_MATTER = { from: 114, to: 114 } as const;

/** One printed component of a lesson — becomes one concept in the app tree. */
export interface IntegratedScienceG10T1Concept {
  /** Printed book page where this component starts. */
  bookFrom: number;
  /** The printed component kind: «نواتج التعلم», «القضايا المتضمنة», «مكوّن» or «تدريبات». */
  kind: string;
  /** The printed head of this component, verbatim. */
  title: string;
}

/** One lesson («درس») of the textbook — becomes one lesson in the app tree. */
export interface IntegratedScienceG10T1Lesson {
  /** App-addressable key, e.g. "1-2" (unit 1, lesson 2). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثاني". */
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
  concepts: IntegratedScienceG10T1Concept[];
}

/** One printed section of the book — one of the two units of the first term. */
export interface IntegratedScienceG10T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"2". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: النظام البيئي المائي". */
  title: string;
  /** The unit head the opener page prints, e.g. "النظام البيئي المائي". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: IntegratedScienceG10T1Lesson[];
}

/**
 * The two units of the first term with their fourteen lessons and every printed
 * head, transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from the book's «المحتويات» (scan 5); the unit openers'
 * «نواتج التعلم» and «القضايا المتضمنة» are the first lessons' leading concepts,
 * and each lesson's topical and «تدريبات» heads follow, all verbatim.
 */
export const EGYPT_INTEGRATED_SCIENCE_G10_T1_UNITS: IntegratedScienceG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: النظام البيئي المائي",
    printedHead: "النظام البيئي المائي",
    bookFrom: 3,
    bookTo: 66,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "نواتج التعلم",
        title: "الغلاف المائي على كوكب الأرض",
        printedHead: "1-1 الغلاف المائي على كوكب الأرض",
        bookFrom: 5,
        concepts: [
          { bookFrom: 3, kind: "نواتج التعلم", title: "يتعرف الغلاف المائي وعلاقته بالأغلفة الأخرى على كوكب الأرض." },
          { bookFrom: 3, kind: "نواتج التعلم", title: "يفسر دور دورة الماء في الطبيعة في إحداث التغيرات البيئية المختلفة." },
          {
            bookFrom: 3,
            kind: "نواتج التعلم",
            title: "يشرح التفاعلات الكيميائية في النظام البيئي المائي وتأثيرها على جودة المياه واستدامة الحياة البحرية.",
          },
          { bookFrom: 3, kind: "نواتج التعلم", title: "يفسر دور عملية النتح في دورة الماء في الطبيعة وعلاقته باستدامة النظام البيئي." },
          {
            bookFrom: 3,
            kind: "نواتج التعلم",
            title:
              "يوضح تأثير الخصائص الفيزيائية للماء كالحرارة النوعية، والعوامل الفيزيائية المحيطة مثل درجة الحرارة والضغط على توزيع الكائنات الحية واستدامة النظام البيئي المائي.",
          },
          { bookFrom: 3, kind: "نواتج التعلم", title: "يوضح الأهمية البيولوجية للماء ودوره في الحفاظ على التركيب والوظائف الخلوية." },
          { bookFrom: 3, kind: "نواتج التعلم", title: "يقيّم التكيفات البيولوجية للكائنات الحية في البيئة المائية ودورها في استدامة النظام البيئي." },
          { bookFrom: 3, kind: "القضايا المتضمنة", title: "التلوث المائي" },
          { bookFrom: 3, kind: "القضايا المتضمنة", title: "التغيرات المناخية" },
          { bookFrom: 3, kind: "القضايا المتضمنة", title: "استدامة الموارد المائية" },
          { bookFrom: 3, kind: "القضايا المتضمنة", title: "الحفاظ على التنوع البيولوجي" },
          { bookFrom: 3, kind: "القضايا المتضمنة", title: "ادارة الموارد المائية" },
          { bookFrom: 3, kind: "القضايا المتضمنة", title: "تحديات الاستدامة في ظل النمو السكاني." },
          { bookFrom: 4, kind: "مكوّن", title: "مقدمة الوحدة" },
          { bookFrom: 5, kind: "مكوّن", title: "أولاً: الغلاف المائي" },
          { bookFrom: 5, kind: "مكوّن", title: "دورة الماء في الطبيعة" },
          { bookFrom: 7, kind: "تدريبات", title: "تدريبات" },
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: "مكوّن",
        title: "الخواص الكيميائية للماء",
        printedHead: "٢-١ الخواص الكيميائية للماء",
        bookFrom: 8,
        concepts: [
          { bookFrom: 8, kind: "مكوّن", title: "التركيب الكيميائي للماء" },
          { bookFrom: 8, kind: "مكوّن", title: "قطبية الماء" },
          { bookFrom: 9, kind: "مكوّن", title: "الماء مذيب عام" },
          { bookFrom: 10, kind: "مكوّن", title: "الاتزان الأيوني للماء" },
          { bookFrom: 12, kind: "مكوّن", title: "الرقم (الأس) الهيدروجيني (pH)" },
          { bookFrom: 14, kind: "تدريبات", title: "تدريبات" },
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: "مكوّن",
        title: "الخواص الفيزيائية للماء",
        printedHead: "1 - 3 الخواص الفيزيائية للماء",
        bookFrom: 16,
        concepts: [
          { bookFrom: 16, kind: "مكوّن", title: "الكثافة Density" },
          { bookFrom: 16, kind: "مكوّن", title: "الهيدروميتر (مقياس كثافة السوائل) Hydrometer" },
          { bookFrom: 18, kind: "مكوّن", title: "كثافة المياه في المحيطات" },
          { bookFrom: 20, kind: "مكوّن", title: "كمية الحرارة ودرجة الحرارة Heat energy and Temperature" },
          { bookFrom: 21, kind: "مكوّن", title: "الحرارة النوعية (Specific heat (c))" },
          { bookFrom: 23, kind: "مكوّن", title: "الحرارة الكامنة للتصعيد" },
          { bookFrom: 23, kind: "مكوّن", title: "تأثير الحرارة ودرجة الحرارة على الكائنات البحرية" },
          { bookFrom: 25, kind: "تدريبات", title: "تدريبات" },
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: "مكوّن",
        title: "المحاليل المائية وخواصها",
        printedHead: "4-1 المحاليل المائية وخواصها",
        bookFrom: 28,
        concepts: [
          { bookFrom: 28, kind: "مكوّن", title: "الخواص الجمعية للمحاليل" },
          { bookFrom: 28, kind: "مكوّن", title: "الانخفاض في ضغط بخار السائل" },
          { bookFrom: 29, kind: "مكوّن", title: "الارتفاع في درجة الغليان" },
          { bookFrom: 30, kind: "مكوّن", title: "الإسموزية والضغط الإسموزي" },
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: "مكوّن",
        title: "الأهمية البيولوجية للماء",
        printedHead: "5-1 الأهمية البيولوجية للماء",
        bookFrom: 31,
        concepts: [
          { bookFrom: 31, kind: "مكوّن", title: "الماء في الخلية الحية" },
          { bookFrom: 34, kind: "مكوّن", title: "أهمية الماء للكائن الحي" },
          { bookFrom: 36, kind: "تدريبات", title: "تدريبات" },
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: "مكوّن",
        title: "التكيفات البيولوجية للكائنات الحية في البيئة المائية",
        printedHead: "6-1 التكيفات البيولوجية للكائنات الحية في البيئة المائية",
        bookFrom: 37,
        concepts: [
          { bookFrom: 37, kind: "مكوّن", title: "أولا: التكيفات التركيبية" },
          { bookFrom: 38, kind: "مكوّن", title: "ثانيا: التكيفات السلوكية" },
          { bookFrom: 38, kind: "مكوّن", title: "ثالثا: التكيفات الفسيولوجية" },
          { bookFrom: 41, kind: "تدريبات", title: "تدريبات" },
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        type: "مكوّن",
        title: "تأثير غازات الهواء الجوي على البيئات المائية",
        printedHead: "7-1 تأثير غازات الهواء الجوي على البيئات المائية",
        bookFrom: 43,
        concepts: [
          { bookFrom: 43, kind: "مكوّن", title: "الأكسجين وثاني أكسيد الكربون في البيئة المائية" },
          { bookFrom: 44, kind: "مكوّن", title: "ذوبانية الغازين في الماء" },
          { bookFrom: 45, kind: "مكوّن", title: "تأثير زيادة نسبة غاز الأكسجين المذاب في الماء" },
          { bookFrom: 48, kind: "تدريبات", title: "تدريبات" },
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        type: "مكوّن",
        title: "تأثير الضوء والإشعاع الشمسي على البيئات المائية",
        printedHead: "1-8 تأثير الضوء والإشعاع الشمسي على البيئات المائية",
        bookFrom: 50,
        concepts: [
          { bookFrom: 51, kind: "مكوّن", title: "الإشعاع الشمسي خلال الماء" },
          { bookFrom: 52, kind: "مكوّن", title: "امتصاص الاشعاع الشمسي" },
          { bookFrom: 54, kind: "تدريبات", title: "تدريبات" },
        ],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        type: "مكوّن",
        title: "تأثير الضغط المائي على الكائنات الحية",
        printedHead: "1-9 تأثير الضغط المائي على الكائنات الحية",
        bookFrom: 56,
        concepts: [
          { bookFrom: 56, kind: "مكوّن", title: "الضغط المائي" },
          { bookFrom: 57, kind: "مكوّن", title: "تأثير الضغط على التكيفات البيولوجية للكائنات البحرية" },
          { bookFrom: 57, kind: "مكوّن", title: "أولاً: المثانة الهوائية (كيس العوم)" },
          { bookFrom: 58, kind: "مكوّن", title: "ثانياً : الهيكل العظمي والغضروفي" },
          { bookFrom: 59, kind: "تدريبات", title: "تدريبات" },
        ],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        type: "مكوّن",
        title: "التوازن البيئي ودور الإنسان في استدامة الحياة المائية",
        printedHead: "10-1 التوازن البيئي ودور الإنسان في استدامة الحياة المائية",
        bookFrom: 60,
        concepts: [
          { bookFrom: 60, kind: "مكوّن", title: "أهمية التوازن البيئي في النظم المائية" },
          { bookFrom: 61, kind: "مكوّن", title: "مثال على التوازن البيئي في النظم المائية" },
          { bookFrom: 61, kind: "مكوّن", title: "الشعاب المرجانية والنظام البيئي البحري" },
          { bookFrom: 61, kind: "مكوّن", title: "تأثير الأنشطة البشرية على الحياة المائية" },
          { bookFrom: 61, kind: "مكوّن", title: "دور الانسان في المحافظة على التوازن البيئي" },
          { bookFrom: 62, kind: "مكوّن", title: "بحث واستقصاء (الأنشطة)" },
          { bookFrom: 64, kind: "تدريبات", title: "تدريبات" },
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية : الغلاف الجوي",
    printedHead: "الغلاف الجوي",
    bookFrom: 67,
    bookTo: 108,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: "نواتج التعلم",
        title: "مكونات وطبقات الغلاف الجوي",
        printedHead: "1-2 : مكونات وطبقات الغلاف الجوي",
        bookFrom: 68,
        concepts: [
          { bookFrom: 67, kind: "نواتج التعلم", title: "يشرح تركيب الغلاف الجوي، ويحدد مكوناته الرئيسة وتأثيره على سطح الأرض." },
          { bookFrom: 67, kind: "نواتج التعلم", title: "يميز بين طبقات الغلاف الجوي المختلفة، ويصف خصائص كل طبقة." },
          {
            bookFrom: 67,
            kind: "نواتج التعلم",
            title: "يحلل تأثير العوامل الفيزيائية في الغلاف الجوي، مثل: الحرارة والضغط والرطوبة والاشعاع الشمسي وسرعة الرياح، على الكائنات الحية.",
          },
          { bookFrom: 67, kind: "نواتج التعلم", title: "يحلل أثر التغيرات في طبقة الأوزون على صحة الإنسان ووظائف أعضائه الحيوية." },
          { bookFrom: 67, kind: "نواتج التعلم", title: "يفسر تأثير اختلاف الضغط الجوي على الكائنات الحية." },
          { bookFrom: 67, kind: "نواتج التعلم", title: "يشرح استراتيجيات الكائنات الحية للتكيف مع البيئات ذات المناخ القاسي." },
          { bookFrom: 67, kind: "نواتج التعلم", title: "يقارن بين أنواع الأنسجة النباتية البسيطة من حيث تركيبها ودورها في دعم النبات." },
          { bookFrom: 67, kind: "نواتج التعلم", title: "يقارن بين تأثير العوامل الفيزيائية المختلفة في الغلاف الجوي على المناخ." },
          { bookFrom: 67, kind: "نواتج التعلم", title: "يشرح كيف تؤثر التفاعلات الكيميائية في الغلاف الجوي على جودة الهواء والتغيرات المناخية." },
          { bookFrom: 67, kind: "نواتج التعلم", title: "يفسر كيميائيا تكوين الأمطار الحمضية من أكاسيد النيتروجين والكبريت ويحلل أثرها على الإنسان والنباتات." },
          { bookFrom: 67, kind: "نواتج التعلم", title: "يقيم دور الملوثات الغازية في تهديد استدامة الغلاف الجوي." },
          { bookFrom: 67, kind: "نواتج التعلم", title: "يوضح كيف ساعد العلم والتكنولوجيا في الحد من التلوث وحماية الغلاف الجوي." },
          { bookFrom: 67, kind: "نواتج التعلم", title: "يقترح حلولا عملية لمشاكل تلوث الهواء وتغير المناخ بناء على ما تعلمه." },
          { bookFrom: 67, kind: "القضايا المتضمنة", title: "تلوث الهواء." },
          { bookFrom: 67, kind: "القضايا المتضمنة", title: "التغيرات المناخية." },
          { bookFrom: 67, kind: "القضايا المتضمنة", title: "استدامة الموارد ." },
          { bookFrom: 67, kind: "القضايا المتضمنة", title: "الحفاظ على التنوع البيولوجي" },
          { bookFrom: 68, kind: "مكوّن", title: "ديناميكية الغلاف الجوي" },
          { bookFrom: 69, kind: "مكوّن", title: "أهمية الغلاف الجوي" },
          { bookFrom: 70, kind: "مكوّن", title: "طبقات الغلاف الجوي" },
          { bookFrom: 76, kind: "تدريبات", title: "تدريبات" },
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "مكوّن",
        title: "التفاعلات الكيميائية في الغلاف الجوي",
        printedHead: "2 - 2 : التفاعلات الكيميائية في الغلاف الجوي",
        bookFrom: 78,
        concepts: [
          { bookFrom: 78, kind: "مكوّن", title: "الأشعة فوق البنفسجية" },
          { bookFrom: 81, kind: "مكوّن", title: "الأوزون في طبقة التروبوسفير" },
          { bookFrom: 82, kind: "تدريبات", title: "تدريبات" },
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: "مكوّن",
        title: "العوامل الفيزيائية وتأثيرها في الغلاف الجوي",
        printedHead: "3 - 2 : العوامل الفيزيائية وتأثيرها في الغلاف الجوي",
        bookFrom: 84,
        concepts: [
          { bookFrom: 84, kind: "مكوّن", title: "أولاً: الحرارة Heat" },
          { bookFrom: 84, kind: "مكوّن", title: "قياس درجة حرارة الهواء" },
          { bookFrom: 85, kind: "مكوّن", title: "آليات انتقال الحرارة" },
          { bookFrom: 89, kind: "مكوّن", title: "الضغط الجوى والكائنات الحية" },
          { bookFrom: 90, kind: "مكوّن", title: "ثالثاً: الرياح (Wind)" },
          { bookFrom: 94, kind: "مكوّن", title: "تأثير الرطوبة على الكائنات الحية" },
          { bookFrom: 96, kind: "تدريبات", title: "تدريبات" },
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: "مكوّن",
        title: "الغلاف الجوي ودور العلم في استدامته",
        printedHead: "4 - 2 : الغلاف الجوي ودور العلم في استدامته",
        bookFrom: 98,
        concepts: [
          { bookFrom: 98, kind: "مكوّن", title: "الاحتباس الحراري وتغير المناخ" },
          { bookFrom: 100, kind: "مكوّن", title: "تلوث الهواء وأثره على استدامة الغلاف الجوي" },
          { bookFrom: 102, kind: "مكوّن", title: "تكوّن الأمطار الحمضية" },
          { bookFrom: 103, kind: "مكوّن", title: "دور العلم والتكنولوجيا في الحماية والتعافي" },
          { bookFrom: 104, kind: "مكوّن", title: "الأقمار الصناعية والاستشعار عن بُعد" },
          { bookFrom: 107, kind: "مكوّن", title: "أنشطة علمية متنوعة" },
          { bookFrom: 108, kind: "تدريبات", title: "تدريبات" },
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the unit
 * — so the unit opener and its «مقدمة الوحدة» stay inside the unit they belong to.
 * A lesson's own head page can print only the opening paragraph (lesson 1-8), so
 * the range keys off `bookFrom`, not off the first component.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_INTEGRATED_SCIENCE_G10_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_INTEGRATED_SCIENCE_G10_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This book has no
 * appendix and no back matter that any lesson quotes: every page of the term
 * belongs to a unit. Kept as a function so the seeder and the stage share one
 * shape across all the books.
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
  "integrated-science-g10-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. Only the front
 * matter (scan 7) is blank; the loader normalises such pages to "" so a future
 * page map cannot mistake a blank for content.
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
 * Page-number candidates a content page prints at its foot. This book's foot is
 * either a bare numeral standing alone on the last line («۸۹») or a running foot
 * that carries the number beside the grade («… الصف الأول الثانوي ٨», «94 …
// الصف الأول الثانوى», «… (98)»), so the last line is accepted only when it looks
 * like one of those — a lone numeral or a line carrying «الوحدة»/«الدرس»/«الصف»/
 * «الفصل» — and then every number on it is a candidate.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  const latin = toLatinDigits(last);
  const looksLikeFoot = /^[\d\s]+$/.test(latin) || /الوحدة|الدرس|الصف|الفصل/.test(last);
  if (!looksLikeFoot) return [];
  const runs = latin.match(/\d{1,3}/g) ?? [];
  return [...new Set(runs.map((r) => Number(r)))].filter((n) => n > 0);
}

/**
 * The book number a content page prints at its foot, or null. Every content page
 * that carries a folio prints exactly one number there and it is its own, which is
 * what fixes `BOOK_TO_PDF_OFFSET = 5`; a page whose last line carries no folio
 * returns null and must be anchored another way.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The ten term pages whose printed folio the OCR did not capture (their last line
 * is the running foot «العلوم المتكاملة …», which carries no page number, or the
 * unit opener's issue list). They are the only term pages without a folio. Rather
 * than weaken the page-number check, they are exempt from it and anchored on the
 * page's own unit head or on the book's running foot — the only book-specific
 * marker that survives on those pages.
 */
const FOLIO_LESS_PAGES: ReadonlySet<number> = new Set([3, 4, 5, 7, 9, 20, 67, 71, 90, 92]);

/** The running foot every non-opener content page of this book prints. */
const RUNNING_FOOT = "العلوم المتكاملة";

/** The section that owns a term page, or undefined. */
function sectionForPage(book: number): IntegratedScienceG10T1Section | undefined {
  return EGYPT_INTEGRATED_SCIENCE_G10_T1_UNITS.find((s) => book >= s.bookFrom && book <= s.bookTo);
}

/**
 * Table invariants: lesson keys match their position, every range sits inside its
 * section, component pages rise inside their lesson, the sections tile the book
 * with no gaps or overlaps, and the first/last sections hit the book's own bounds.
 * A content mistake here would quietly ground the tutor on the wrong pages, so it
 * fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_INTEGRATED_SCIENCE_G10_T1_UNITS;
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
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا مكوّنات`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول مكوّن «${lesson.concepts[0]!.kind}»`);
      }

      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((concept, ci) => {
        if (!concept.title.trim()) problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: بلا عنوان`);
        if (concept.bookFrom < unit.bookFrom || concept.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: صفحته ${concept.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && concept.bookFrom < prev.bookFrom) {
          problems.push(`الدرس ${lesson.key}: صفحات المكوّنات تنازلية (${prev.bookFrom} ثم ${concept.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }
      const lastConcept = lesson.concepts.at(-1)!;
      if (lastConcept.bookFrom < from || lastConcept.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: مكوّنه الأخير ${lastConcept.bookFrom} خارج نطاقه ${from}–${to}`);
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
  if (first && first.bookFrom !== EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio, or, on the ten OCR-missed pages, from the page's own unit
 *     head (the two openers) or the book's running foot «العلوم المتكاملة»;
 *  2. every unit's opener prints the unit head and every lesson's first page prints
 *     that lesson's head;
 *  3. every lesson's title and every concept's head is printed on the pages the
 *     lesson owns (the concept on its own page);
 *  4. every printed page in [3, 108] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_INTEGRATED_SCIENCE_G10_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_START || book > EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_END) {
      continue;
    }
    printedPages.add(book);
    pagesChecked += 1;

    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }

    if (FOLIO_LESS_PAGES.has(book)) {
      // The folio was lost in the OCR: anchor the page on its unit head (the two
      // openers) or the book's running foot, instead of weakening the page-number
      // check for every page.
      const section = sectionForPage(book);
      const anchored =
        normalize(text).includes(normalize(RUNNING_FOOT)) ||
        (section !== undefined && normalize(text).includes(normalize(section.printedHead)));
      if (!anchored) {
        problems.push(
          `صفحة الكتاب ${book}: بلا رقم مطبوع ولا تطبع ترويسة الكتاب «${RUNNING_FOOT}» ولا عنوان وحدتها`,
        );
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

  if (printedPages.size !== EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_END - EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_START} و${EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_END}`,
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
      lesson.concepts.forEach((concept) => {
        if (!pagePrints(concept.bookFrom, concept.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة المكوّن ${concept.bookFrom} لا تطبع «${concept.title}»`);
        }
      });
    });
  });

  // 4. every printed content page is owned by exactly one lesson.
  const owners = new Map<number, string[]>();
  for (const range of allLessonRanges()) {
    for (let p = range.from; p <= range.to; p++) {
      const list = owners.get(p) ?? [];
      list.push(range.key);
      owners.set(p, list);
    }
  }
  for (let book = EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_START; book <= EGYPT_INTEGRATED_SCIENCE_G10_T1_BOOK_END; book++) {
    const list = owners.get(book) ?? [];
    if (list.length !== 1) {
      problems.push(
        `صفحة الكتاب ${book}: ${list.length === 0 ? "لا يملكها أي درس" : `يملكها أكثر من درس (${list.join("، ")})`}`,
      );
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
