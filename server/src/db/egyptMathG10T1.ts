// Secondary 1 (Grade 10, الصف الأول الثانوي) Mathematics, Arabic-medium
// (الرياضيات — الصف الأول الثانوي — الفصل الدراسي الأول), first term.
//
// Reserved ids (header only — this module wires nothing): curriculum
// `eg-g10-math`, subject `math` (name "Mathematics", nameAr
// "الرياضيات"), lesson prefix `l-g10-math-`.
//
// The curriculum tree is rebuilt from the Ministry textbook (121 scanned
// pages). This module is the single source of truth for its structure: the
// four printed وحدات of the first term, their seventeen printed دروس,
// and, for every lesson, the book's own printed heads — the lesson head, the
// «سوف تتعلم» objectives and the activity-flow heads the lesson prints
// (فكر وناقش, عمل تعاوني, تعلم, مثال, حاول أن تحل, تحقق من فهمك,
// تمارين, تعريف, مسلمة, نظرية, نتيجة, حقيقة, ملاحظة, تذكر, …) — verbatim
// and with the printed page each starts on. The self-checks at the bottom
// prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS −2 — book page N = scan page N + 2
// Every numbered content page prints its own folio, so `BOOK_TO_PDF_OFFSET`
// is fixed by the scan itself and quoted here: scan 6 prints «٤» (book 4),
// scan 12 prints «١٠» (book 10), scan 34 prints «٣٢» (book 32), scan 64
// prints «٦٢» (book 62), scan 92 prints «٩٠» (book 90), scan 118 prints
// «١١٦» (book 116) and scan 121 prints «١١٩» (book 119). The book's own
// «المحتويات» (scan 3) independently confirms it: it lists «١ - ١ … ٤»,
// «٢ - ١ … ١٠», «٣ - ١ … ١٤», «٤ - ١ … ٢٠», «٥ - ١ … ٢٧», «١ - ٢ … ٣٢»,
// «٢ - ٢ … ٣٦», «٣ - ٢ … ٤٥», «٤ - ٢ … ٥٣», «١ - ٣ … ٦٢», «٢ - ٣ … ٧٢»,
// «١ - ٤ … ٨٢», «٢ - ٤ … ٩٠», «٣ - ٤ … ٩٥», «٤ - ٤ … ١٠٣», «٥ - ٤ … ١١٢»
// and «٦ - ٤ … ١١٦» — every lesson opener sits exactly where the contents
// says it does.
//
// TERM = REAL CONTENT ONLY (books 2–119)
// Scan pages 1–3 are before the term: the cover (1), the «المقدمة» (2) and
// the «المحتويات» (3). The term runs from the الوحدة 1 intro page
// (book 2 = scan 4) to the last page of lesson 4-6 (book 119 = scan 121):
// `EGYPT_MATH_G10_T1_BOOK_START` / `_END` are exactly those two pages,
// and the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 119 − 2 + 1 = 118. There is no back
// matter: the term runs to the last scan, so `EGYPT_MATH_G10_T1_BACK_MATTER`
// is an explicitly empty range.
//
// TEN TERM PAGES PRINT NO PARSEABLE FOLIO — EACH HAS A NAMED ANCHOR
// Each وحدة opens with two unnumbered intro pages (objectives, «دروس
// الوحدة», material, history, organigramme): books 2–3 (الوحدة 1), 30–31
// (الوحدة 2), 60–61 (الوحدة 3) and 80–81 (الوحدة 4). Two further pages lost
// their folio in the OCR: book 8 prints «A» for «٨», and book 42 (a page
// that ends mid-proof) prints no folio line at all. Rather than weaken the
// page-number check, all ten are exempt from it and anchored on a string
// the page itself prints, named in `FOLIO_LESS_ANCHORS`. Every other term
// page proves its number from its last three lines: the folio stands bare
// («١٠», «۲۷», «۱۱۳» — Extended Arabic-Indic digits included) or glued to
// the running foot («الرياضيات - الصف الأول الثانوى ٦», «٣٤ الرياضيات -
// الصف الأول الثانوي», «كتاب الطالب - الفصل الدراسي الأول ١٣»). Body
// numerals can therefore never hide a missing folio: the check demands the
// page's OWN number among the candidates.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every lesson contributes its head line (title exactly as the opener prints
// it), each «سوف تتعلم» objective bullet verbatim (wrapped lines joined),
// and each activity-flow head at its first start page in the lesson
// (فكر وناقش, عمل تعاوني, تعلم, مثال, حاول أن تحل, تحقق من فهمك,
// تمارين, تعريف, مسلمة, نظرية, نتيجة, حقيقة, ملاحظة, تذكر, المميز,
// مجموع الجذرين وحاصل ضربهما, دائرة الوحدة, …). Nothing is invented: every
// concept below is a string the book itself prints on the page its
// `bookFrom` names. Repeated occurrences of the same head inside one lesson
// are recorded once, at the first page. Inline solution lines («الحل»,
// «خطوة») and the «تفكير ناقد» margin prompts are not heads and carry no
// concept — their pages still belong to their lesson's range.
//
// OCR QUIRKS RECORDED, NOT WORKED AROUND
// «فكر وناقش» prints with spaces («فكر و ناقش») on books 27 and 62 and
// without them everywhere else; each concept keeps the spelling of its own
// page. Lesson 3-2's opener prints «منصفا الزاوية» while later pages print
// «منصف الزاوية» (stored per page). The related-angles heads mix «لأي»/
// «لأى» and «قياسيهما»/«قياسهما» (stored per page). Book 27 prints «سوف
// نتعلم» where every other opener prints «سوف تتعلم». Book 25 prints
// «تمارين ( 4 - 1 )» in Latin digits. Book 68 prints «Talis' Theorem»
// without the h. Math symbols (θ α β π ∈ √ ± °) are transcribed exactly as
// the OCR reads them. None of these changes what any page prints: the
// checks below verify every head against the OCR text itself.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 2 (verified: book p.4 = scan p.6). */
export const BOOK_TO_PDF_OFFSET = -2;

/** First printed page of the term — the الوحدة 1 intro page (scan 4). */
export const EGYPT_MATH_G10_T1_BOOK_START = 2;

/** Last printed page of the term — lesson 4-6's last page (scan 121). */
export const EGYPT_MATH_G10_T1_BOOK_END = 119;

/** The scanned pages before the term: cover, مقدمة, محتويات. */
export const EGYPT_MATH_G10_T1_FRONT_MATTER = { from: 1, to: 3 } as const;

/**
 * The scanned pages after the term. There are none: the term runs to the
 * last scan (121), so this is an explicitly empty range.
 */
export const EGYPT_MATH_G10_T1_BACK_MATTER = { from: 122, to: 121 } as const;

/** One printed head of a lesson — becomes one concept in the app tree. */
export interface MathG10T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: «درس», «سوف تتعلم» or «نشاط». */
  kind: string;
  /** The printed head, verbatim. */
  title: string;
}

/** One printed lesson («درس» = one numbered lesson of a unit). */
export interface MathG10T1Lesson {
  /** App-addressable key, e.g. "4-3" (unit 4, lesson 3). */
  key: string;
  /** The lesson's opening head type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson. */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: MathG10T1Concept[];
}

/** One printed unit of the book — one of the four وحدات of the first term. */
export interface MathG10T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"4", in book order. */
  key: string;
  /** Section title as printed on the unit intro page and in the محتويات. */
  title: string;
  /** The section's title as the book prints it (same string, kept for parity). */
  footerTitle: string;
  /** First printed page of the section (its unnumbered intro spread). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next intro spread). */
  bookTo: number;
  lessons: MathG10T1Lesson[];
}

const HEAD = "درس";
const LEARN = "سوف تتعلم";
const ACT = "نشاط";

function concept(bookFrom: number, kind: string, title: string): MathG10T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The four units of the first term with their printed lessons and every
 * printed head, transcribed from the pages the book prints them on and checked
 * by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit starts are the unnumbered intro spreads (books 2, 30, 60, 80); lesson
 * starts and unit titles come from the book's «المحتويات» (scan 3) and are
 * confirmed by every lesson opener. A lesson's range runs from the unit's
 * first page (for its first lesson — the intro spread rides with it) or its
 * own head page, down to the page before the next lesson starts, bounded by
 * the unit — so every «تمارين» closing page stays inside the lesson it
 * closes.
 */
export const EGYPT_MATH_G10_T1_UNITS: MathG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    title: "الجبر والعلاقات والدوال",
    footerTitle: "الجبر والعلاقات والدوال",
    bookFrom: 2,
    bookTo: 29,
    lessons: [
      {
        key: "1-1",
        type: HEAD,
        title: "مقدمة عن الأعداد المركبة",
        printedHead: "مقدمة عن الأعداد المركبة",
        bookFrom: 4,
        concepts: [
          concept(4, HEAD, "مقدمة عن الأعداد المركبة"),
          concept(4, LEARN, "مفهوم العدد التخيلى."),
          concept(4, LEARN, "قوى ت الصحيحة."),
          concept(4, LEARN, "مفهوم العدد المركب."),
          concept(4, LEARN, "تساوى عددين مركبين."),
          concept(4, LEARN, "العمليات على الأعداد المركبة."),
          concept(4, ACT, "فكر وناقش"),
          concept(4, ACT, "تعلم"),
          concept(4, ACT, "العدد التخيلى"),
          concept(5, ACT, "قوى ت الصحيحة"),
          concept(5, ACT, "مثال"),
          concept(5, ACT, "حاول أن تحل"),
          concept(5, ACT, "العدد المركب"),
          concept(6, ACT, "تساوى عددين مركبين"),
          concept(7, ACT, "العمليات على الأعداد المركبة"),
          concept(7, ACT, "العددان المترافقان"),
          concept(8, ACT, "تحقق من فهمك"),
          concept(9, ACT, "تمارين (١ - ١)"),
        ],
      },
      {
        key: "1-2",
        type: HEAD,
        title: "تحديد نوع جذري المعادلة التربيعية",
        printedHead: "تحديد نوع جذري المعادلة التربيعية",
        bookFrom: 10,
        concepts: [
          concept(10, HEAD, "تحديد نوع جذري المعادلة التربيعية"),
          concept(10, LEARN, "كيفية تحديد نوع جذري المعادلة التربيعية"),
          concept(10, ACT, "فكر وناقش"),
          concept(10, ACT, "تعلم"),
          concept(10, ACT, "المميز"),
          concept(10, ACT, "مثال"),
          concept(11, ACT, "لاحظ أن"),
          concept(11, ACT, "حاول أن تحل"),
          concept(12, ACT, "تمارين (١ - ٢)"),
        ],
      },
      {
        key: "1-3",
        type: HEAD,
        title: "العلاقة بين جذري معادلة الدرجة الثانية ومعاملات حدودها",
        printedHead: "العلاقة بين جذري معادلة الدرجة الثانية ومعاملات حدودها",
        bookFrom: 14,
        concepts: [
          concept(14, HEAD, "العلاقة بين جذري معادلة الدرجة الثانية ومعاملات حدودها"),
          concept(14, LEARN, "كيفية إيجاد مجموع الجذرين لمعادلة تربيعية معطاة."),
          concept(14, LEARN, "كيفية إيجاد حاصل ضرب الجذرين"),
          concept(14, LEARN, "إيجاد معادلة تربيعية بمعلومية معادلة تربيعية أخرى."),
          concept(14, ACT, "فكر وناقش"),
          concept(14, ACT, "تعلم"),
          concept(14, ACT, "مجموع الجذرين وحاصل ضربهما"),
          concept(14, ACT, "تعبير شفهي"),
          concept(14, ACT, "مثال"),
          concept(15, ACT, "حاول أن تحل"),
          concept(16, ACT, "تكوين المعادلة التربيعية متى عُلم جذراها"),
          concept(17, ACT, "تكوين معادلة تربيعية بمعلومية معادلة تربيعية أخرى"),
          concept(17, ACT, "لاحظ أن"),
          concept(17, ACT, "تحقق من فهمك"),
          concept(18, ACT, "تمارين (١ - ٣)"),
        ],
      },
      {
        key: "1-4",
        type: HEAD,
        title: "إشارة الدالة",
        printedHead: "إشارة الدالة",
        bookFrom: 20,
        concepts: [
          concept(20, HEAD, "إشارة الدالة"),
          concept(
            20,
            LEARN,
            "بحث إشارة كل من: الدالة الثابتة - دالة الدرجة الأولى - دالة الدرجة الثانية.",
          ),
          concept(20, ACT, "فكر وناقش"),
          concept(20, ACT, "تعلم"),
          concept(20, ACT, "أولا: إشارة الدالة الثابتة"),
          concept(20, ACT, "مثال"),
          concept(21, ACT, "حاول أن تحل"),
          concept(21, ACT, "ثانيًا: إشارة دالة الدرجة الأولى (الدالة الخطية)"),
          concept(22, ACT, "ثالثا: إشارة الدالة التربيعية"),
          concept(24, ACT, "تحقق من فهمك"),
          concept(25, ACT, "تمارين ( 4 - 1 )"),
        ],
      },
      {
        key: "1-5",
        type: HEAD,
        title: "متباينات الدرجة الثانية في مجهول واحد",
        printedHead: "متباينات الدرجة الثانية في مجهول واحد",
        bookFrom: 27,
        concepts: [
          concept(27, HEAD, "متباينات الدرجة الثانية في مجهول واحد"),
          concept(27, LEARN, "حل المتباينة التربيعية في متغير واحد."),
          concept(27, ACT, "المتباينات التربيعية:"),
          concept(27, ACT, "فكر و ناقش"),
          concept(27, ACT, "تعلم"),
          concept(27, ACT, "حل المتباينة التربيعية"),
          concept(27, ACT, "مثال"),
          concept(28, ACT, "حاول أن تحل"),
          concept(29, ACT, "تمارين (١ - ٥)"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    title: "التشابه",
    footerTitle: "التشابه",
    bookFrom: 30,
    bookTo: 59,
    lessons: [
      {
        key: "2-1",
        type: HEAD,
        title: "تشابه المضلعات",
        printedHead: "تشابه المضلعات",
        bookFrom: 32,
        concepts: [
          concept(32, HEAD, "تشابه المضلعات"),
          concept(32, LEARN, "مفهوم التشابه."),
          concept(32, LEARN, "تشابه المضلعات."),
          concept(32, LEARN, "العلاقة بين محيطي مضلعين متشابهين ومعامل (نسبة) التشابه."),
          concept(32, ACT, "فكر وناقش"),
          concept(32, ACT, "المضلعان المتشابهان"),
          concept(32, ACT, "تعريف"),
          concept(32, ACT, "لاحظ أن:"),
          concept(33, ACT, "مثال"),
          concept(33, ACT, "فكر"),
          concept(34, ACT, "معامل التشابه لمضلعين:"),
          concept(35, ACT, "تمارين ٢ - ١"),
        ],
      },
      {
        key: "2-2",
        type: HEAD,
        title: "تشابه المثلثات",
        printedHead: "تشابه المثلثات",
        bookFrom: 36,
        concepts: [
          concept(36, HEAD, "تشابه المثلثات"),
          concept(36, LEARN, "حالات تشابه المثلثات."),
          concept(36, LEARN, "خصائص العمود المرسوم من رأس القائمة على الوتر في المثلث القائم الزاوية."),
          concept(36, ACT, "فكر وناقش"),
          concept(36, ACT, "عمل تعاوني"),
          concept(37, ACT, "مسلمة"),
          concept(37, ACT, "لاحظ أن"),
          concept(37, ACT, "مثال"),
          concept(38, ACT, "نتائج هامة"),
          concept(38, ACT, "نتيجة ١"),
          concept(38, ACT, "حاول أن تحل"),
          concept(39, ACT, "نتيجة ٢"),
          concept(40, ACT, "أضف إلى معلوماتك"),
          concept(40, ACT, "نظرية"),
          concept(42, ACT, "نظرية ٢"),
          concept(43, ACT, "تمارين ٢ - ٢"),
        ],
      },
      {
        key: "2-3",
        type: HEAD,
        title: "العلاقة بين مساحتي سطحي مضلعين متشابهين",
        printedHead: "العلاقة بين مساحتي سطحي مضلعين متشابهين",
        bookFrom: 45,
        concepts: [
          concept(45, HEAD, "العلاقة بين مساحتي سطحي مضلعين متشابهين"),
          concept(45, LEARN, "العلاقة بين مساحتي مثلثين متشابهين ومعامل (نسبة) التشابه."),
          concept(45, LEARN, "مقياس الرسم"),
          concept(45, LEARN, "العلاقة بين مساحتي سطحي مضلعين متشابهين ومعامل (نسبة) التشابه."),
          concept(45, ACT, "فكر وناقش"),
          concept(45, ACT, "أولاً: النسبة بين مساحتي سطحي مثلثين متشابهين:"),
          concept(46, ACT, "لاحظ"),
          concept(47, ACT, "مثال"),
          concept(47, ACT, "حاول أن تحل"),
          concept(48, ACT, "ثانيًا النسبة بين مساحتى سطحى مضلعين متشابهين"),
          concept(48, ACT, "حقيقة:"),
          concept(49, ACT, "نظرية ٤:"),
          concept(49, ACT, "ملاحظة:"),
          concept(50, ACT, "لاحظ أن"),
          concept(52, ACT, "تمارين ٢ - ٣"),
        ],
      },
      {
        key: "2-4",
        type: HEAD,
        title: "تطبيقات التشابه في الدائرة",
        printedHead: "تطبيقات التشابه في الدائرة",
        bookFrom: 53,
        concepts: [
          concept(53, HEAD, "تطبيقات التشابه في الدائرة"),
          concept(53, LEARN, "العلاقة بين وترين متقاطعين في دائرة."),
          concept(53, LEARN, "العلاقة بين قاطعين لدائرة من نقطة خارجها."),
          concept(53, LEARN, "العلاقة بين طول مماس وطولي جزأي قاطع لدائرة مرسومين من نقطة خارجها."),
          concept(53, LEARN, "نمذجة وحل مشكلات وتطبيقات حياتية باستخدام تشابه المضلعات في الدائرة."),
          concept(53, ACT, "فكر وناقش"),
          concept(53, ACT, "تمرين مشهور"),
          concept(54, ACT, "مثال"),
          concept(54, ACT, "حاول أن تحل"),
          concept(55, ACT, "نتيجة"),
          concept(56, ACT, "عكس تمرين مشهور"),
          concept(56, ACT, "لاحظ أن:"),
          concept(58, ACT, "تمارين ٢ - ٤"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    title: "نظريات التناسب في المثلث",
    footerTitle: "نظريات التناسب في المثلث",
    bookFrom: 60,
    bookTo: 79,
    lessons: [
      {
        key: "3-1",
        type: HEAD,
        title: "المستقيمات المتوازية والأجزاء المتناسبة",
        printedHead: "المستقيمات المتوازية والأجزاء المتناسبة",
        bookFrom: 62,
        concepts: [
          concept(62, HEAD, "المستقيمات المتوازية والأجزاء المتناسبة"),
          concept(62, LEARN, "خصائص المستقيم الموازى لأى ضلع من أضلاع مثلث."),
          concept(62, LEARN, "استخدام التناسب فى حساب أطوال وبرهنة علاقات لقطع مستقيمة ناتجة عن قواطع لمستقيمات متوازية."),
          concept(62, LEARN, "نمذجة وحل مشكلات حياتية تتضمن المستقيمات المتوازية وقواطعها."),
          concept(62, ACT, "فكر و ناقش"),
          concept(63, ACT, "مثال"),
          concept(63, ACT, "حاول أن تحل"),
          concept(64, ACT, "نتيجة:"),
          concept(65, ACT, "عكس"),
          concept(65, ACT, "نظرية"),
          concept(65, ACT, "تفكير منطقي:"),
          concept(67, ACT, "نمذجة"),
          concept(68, ACT, "نظرية تاليس العامة"),
          concept(69, ACT, "حالات خاصة"),
          concept(70, ACT, "تمارين ٣ - ١"),
        ],
      },
      {
        key: "3-2",
        type: HEAD,
        title: "منصفا الزاوية والأجزاء المتناسبة",
        printedHead: "منصفا الزاوية والأجزاء المتناسبة",
        bookFrom: 72,
        concepts: [
          concept(72, HEAD, "منصفا الزاوية والأجزاء المتناسبة"),
          concept(72, LEARN, "خصائص منصفات زوايا المثلث."),
          concept(72, LEARN, "استخدام التناسب في حساب أطوال القطع المستقيمة الناتجة عن تنصيف زاوية في مثلث."),
          concept(72, LEARN, "نمذجة وحل مشكلات حياتية تتضمن منصفات زوايا المثلث."),
          concept(72, ACT, "عمل تعاوني"),
          concept(72, ACT, "منصف زاوية مثلث"),
          concept(72, ACT, "نظرية ٣:"),
          concept(73, ACT, "مثال"),
          concept(73, ACT, "حاول أن تحل"),
          concept(74, ACT, "ملاحظة هامة"),
          concept(75, ACT, "إيجاد طول المنصف الداخلي والمنصف الخارجي لزاوية رأس مثلث."),
          concept(75, ACT, "تمرين مشهور"),
          concept(75, ACT, "تذكر"),
          concept(76, ACT, "لاحظ أن:"),
          concept(77, ACT, "حالات خاصة"),
          concept(77, ACT, "حقيقة:"),
          concept(78, ACT, "تمارين ٣ - ٢"),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    title: "حساب المثلثات",
    footerTitle: "حساب المثلثات",
    bookFrom: 80,
    bookTo: 119,
    lessons: [
      {
        key: "4-1",
        type: HEAD,
        title: "الزاوية الموجهة",
        printedHead: "الزاوية الموجهة",
        bookFrom: 82,
        concepts: [
          concept(82, HEAD, "الزاوية الموجهة"),
          concept(82, LEARN, "مفهوم الزاوية الموجهة."),
          concept(82, LEARN, "الوضع القياسي للزاوية الموجهة."),
          concept(82, LEARN, "القياس الموجب والقياس السالب للزاوية الموجهة."),
          concept(82, LEARN, "موقع الزاوية الموجهة في المستوى الإحداثي المتعامد."),
          concept(82, LEARN, "مفهوم الزوايا المتكافئة."),
          concept(82, ACT, "فكر وناقش"),
          concept(82, ACT, "القياس الستيني للزاوية"),
          concept(82, ACT, "تعلم"),
          concept(82, ACT, "الزاوية الموجهة"),
          concept(83, ACT, "تعريف:"),
          concept(83, ACT, "الوضع القياسي للزاوية الموجهة"),
          concept(83, ACT, "تعبير شفهي"),
          concept(83, ACT, "حاول أن تحل"),
          concept(84, ACT, "القياس الموجب والقياس السالب للزاوية الموجهة:"),
          concept(84, ACT, "مثال"),
          concept(84, ACT, "موقع الزاوية في المستوى الإحداثي المتعامد:"),
          concept(85, ACT, "ملاحظة:"),
          concept(86, ACT, "أضف إلى معلوماتك"),
          concept(86, ACT, "الزوايا المتكافئة"),
          concept(87, ACT, "تحقق من فهمك"),
          concept(88, ACT, "تمارين ٤ - ١"),
        ],
      },
      {
        key: "4-2",
        type: HEAD,
        title: "القياس الستيني والقياس الدائري لزاوية",
        printedHead: "القياس الستيني والقياس الدائري لزاوية",
        bookFrom: 90,
        concepts: [
          concept(90, HEAD, "القياس الستيني والقياس الدائري لزاوية"),
          concept(90, LEARN, "مفهوم القياس الدائري للزاوية."),
          concept(90, LEARN, "العلاقة بين القياس الستيني والقياس الدائري."),
          concept(90, LEARN, "كيفية إيجاد طول قوس في دائرة."),
          concept(90, ACT, "فكر وناقش"),
          concept(90, ACT, "القياس الدائري"),
          concept(90, ACT, "عمل تعاوني"),
          concept(90, ACT, "تعريف"),
          concept(91, ACT, "مثال"),
          concept(91, ACT, "حاول أن تحل"),
          concept(91, ACT, "العلاقة بين القياس الستيني والقياس الدائري لزاوية:"),
          concept(92, ACT, "أضف إلى معلوماتك"),
          concept(93, ACT, "تمارين ٤ - ٢"),
        ],
      },
      {
        key: "4-3",
        type: HEAD,
        title: "الدوال المثلثية",
        printedHead: "الدوال المثلثية",
        bookFrom: 95,
        concepts: [
          concept(95, HEAD, "الدوال المثلثية"),
          concept(95, LEARN, "دائرة الوحدة."),
          concept(95, LEARN, "الدوال المثلثية الأساسية."),
          concept(95, LEARN, "مقلوبات الدوال المثلثية الأساسية."),
          concept(95, LEARN, "إشارات الدوال المثلثية."),
          concept(95, LEARN, "الدوال المثلثية لبعض الزوايا الخاصة."),
          concept(95, ACT, "فكر وناقش"),
          concept(95, ACT, "لاحظ أن:"),
          concept(96, ACT, "دائرة الوحدة"),
          concept(96, ACT, "الدوال المثلثية الأساسية للزاوية"),
          concept(96, ACT, "مقلوبات الدوال الأساسية"),
          concept(97, ACT, "إشارات الدوال المثلثية"),
          concept(97, ACT, "مثال"),
          concept(98, ACT, "حاول أن تحل"),
          concept(99, ACT, "الدوال المثلثية لبعض الزوايا الخاصة"),
          concept(100, ACT, "تحقق من فهمك"),
          concept(101, ACT, "تمارين ٤ - ٣"),
        ],
      },
      {
        key: "4-4",
        type: HEAD,
        title: "الزوايا المنتسبة",
        printedHead: "الزوايا المنتسبة",
        bookFrom: 103,
        concepts: [
          concept(103, HEAD, "الزوايا المنتسبة"),
          concept(103, LEARN, "العلاقة بين الدوال المثلثية للزاويتين θ، ١٨٠° ± θ"),
          concept(103, LEARN, "العلاقة بين الدوال المثلثية للزاويتين θ، ٣٦٠° - θ"),
          concept(103, LEARN, "العلاقة بين الدوال المثلثية للزاويتين θ، ٩٠° ± θ"),
          concept(103, LEARN, "العلاقة بين الدوال المثلثية للزاويتين θ، ٢٧٠° ± θ"),
          concept(103, LEARN, "الحل العام للمعادلات المثلثية على الصورة:"),
          concept(103, LEARN, "جا α = جتا β"),
          concept(103, LEARN, "قا α = قتا β"),
          concept(103, LEARN, "ظا α = ظتا β"),
          concept(103, ACT, "فكر وناقش"),
          concept(103, ACT, "١ - الدوال المثلثية لأي زاويتين قياسيهما θ، (١٨٠° - θ)"),
          concept(103, ACT, "حاول أن تحل"),
          concept(103, ACT, "تعريف:"),
          concept(104, ACT, "٢- الدوال المثلثية لأى زاويتين قياسيهما θ ، (١٨٠° + θ)"),
          concept(104, ACT, "٣- الدوال المثلثية لأى زاويتين قياسيهما θ ، (٣٦٠° - θ)"),
          concept(104, ACT, "لاحظ أن"),
          concept(105, ACT, "مثال"),
          concept(105, ACT, "٤ - الدوال المثلثية لأى زاويتين قياسيهما θ ، (٩٠° - θ)"),
          concept(106, ACT, "٥ - الدوال المثلثية لأى زاويتين قياسيهما θ ، (٩٠° + θ)"),
          concept(107, ACT, "٦- الدوال المثلثية لأي زاويتين قياسهما θ ، (٢٧٠° - θ)"),
          concept(107, ACT, "٧- الدوال المثلثية لأي زاويتين قياسهما θ ، (٢٧٠° + θ)"),
          concept(
            108,
            ACT,
            "الحل العام للمعادلات المثلثية التي على الصورة: (جا α = جتا β ، قا α = قتا β ، ظا α = ظتا β)",
          ),
          concept(108, ACT, "تعلم"),
          concept(109, ACT, "تحقق من فهمك"),
          concept(110, ACT, "تمارين ٤ - ٤"),
        ],
      },
      {
        key: "4-5",
        type: HEAD,
        title: "التمثيل البياني للدوال المثلثية",
        printedHead: "التمثيل البياني للدوال المثلثية",
        bookFrom: 112,
        concepts: [
          concept(112, HEAD, "التمثيل البياني للدوال المثلثية"),
          concept(112, LEARN, "رسم دالة الجيب واستنتاج خواصها."),
          concept(112, LEARN, "رسم دالة جيب التمام واستنتاج خواصها."),
          concept(112, ACT, "فكر وناقش"),
          concept(112, ACT, "التمثيل البياني لدالة الجيب"),
          concept(112, ACT, "عمل تعاوني"),
          concept(113, ACT, "تعلم"),
          concept(113, ACT, "خواص دالة الجيب"),
          concept(113, ACT, "التمثيل البياني لدالة جيب التمام"),
          concept(113, ACT, "خواص دالة جيب التمام"),
          concept(114, ACT, "مثال"),
          concept(114, ACT, "حاول أن تحل"),
          concept(114, ACT, "تحقق من فهمك"),
          concept(115, ACT, "تمارين ٤ - ٥"),
        ],
      },
      {
        key: "4-6",
        type: HEAD,
        title: "إيجاد قياس زاوية بمعلومية إحدى نسبها المثلثية",
        printedHead: "إيجاد قياس زاوية بمعلومية إحدى نسبها المثلثية",
        bookFrom: 116,
        concepts: [
          concept(116, HEAD, "إيجاد قياس زاوية بمعلومية إحدى نسبها المثلثية"),
          concept(116, LEARN, "إيجاد قياس زاوية بمعلومية دالة مثلثية."),
          concept(116, ACT, "فكر وناقش"),
          concept(116, ACT, "تعلم"),
          concept(116, ACT, "مثال"),
          concept(117, ACT, "حاول أن تحل"),
          concept(117, ACT, "تحقق من فهمك"),
          concept(118, ACT, "تمارين ٤ - ٦"),
        ],
      },
    ],
  },
];

/**
 * Book-page span a lesson owns: from the section's first page (for its first
 * lesson — the unit intro spread) or its own start page, up to the page before
 * the next lesson starts, or the section's last page for its last lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_MATH_G10_T1_UNITS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const ranges: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_MATH_G10_T1_UNITS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      ranges.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return ranges;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This term has
 * no appendix: every page of the term belongs to a unit. Kept as a function
 * so the seeder and the stage share one shape across all the books.
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
  "math-g10-t1",
);

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  const pdf = book - BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

/** One page of a lesson's document, with a stable printed-page marker. */
function pageBlock(book: number, text: string): string {
  return `### صفحة ${book}\n${text}`;
}

/** The document a lesson grounds the tutor in: its own page range, in order. */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(sectionIndex, lessonIndex);
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
    .replace(/ی/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Whether `page` prints `needle`, ignoring OCR spacing and vowel marks. */
function pagePrints(page: number, needle: string): boolean {
  return normalize(loadBookPage(page)).includes(normalize(needle));
}

/**
 * Page-number candidates a content page prints at its foot. The folio stands
 * bare on its own line («١٠», «۲۷», «۱۱۳») or glued to the running foot —
 * after it («الرياضيات - الصف الأول الثانوى ٦», «كتاب الطالب - الفصل
 * الدراسي الأول ١٣») or before it («٣٤ الرياضيات - الصف الأول الثانوي»).
 * Only the last three lines are read and only bare-numeral or running-foot
 * lines count, so body numbers (exercise counts, page-internal fractions)
 * can never be mistaken for a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const tail = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(-3);
  const candidates = new Set<number>();
  for (const line of tail) {
    const looksLikeFoot = /^[0-9٠-٩۰-۹]+$/.test(line) || /الرياضيات|كتاب الطالب/.test(line);
    if (!looksLikeFoot) continue;
    const latin = toLatinDigits(line)
      .replace(/[^0-9]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    for (const tok of latin.split(" ")) {
      if (tok) candidates.add(Number(tok));
    }
  }
  return [...candidates].filter((n) => n > 0).sort((a, b) => a - b);
}

/**
 * The book number a content page prints, or null. Every content page that
 * carries a folio prints its own number among the candidates, which is what
 * fixes the offset; the ten pages named in `FOLIO_LESS_ANCHORS` carry no
 * parseable folio and are handled there instead. A mismatch returns the
 * largest candidate so the caller can see the difference.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * The ten term pages that print no parseable folio in the OCR — the two
 * unnumbered intro pages of each unit (books 2–3, 30–31, 60–61, 80–81),
 * the page whose folio the OCR read as the Latin letter «A» (book 8), and
 * the page that ends mid-proof with no folio line at all (book 42) — each
 * with the anchor the check accepts in place of a page number.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  2: "أهداف الوحدة",
  3: "دروس الوحدة",
  8: "تحقق من فهمك",
  30: "أهداف الوحدة",
  31: "دروس الوحدة",
  42: "نظرية ٢",
  60: "أهداف الوحدة",
  61: "دروس الوحدة",
  80: "أهداف الوحدة",
  81: "دروس الوحدة",
};

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, and the first/last sections
 * hit the book's own bounds. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_MATH_G10_T1_UNITS;
  const keys = new Set<string>();

  units.forEach((unit, ui) => {
    if (!unit.title.trim()) problems.push(`القسم ${unit.key}: بلا عنوان`);
    if (!unit.footerTitle.trim()) problems.push(`القسم ${unit.key}: بلا عنوان مطبوع`);
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
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول نشاط`);
      }

      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((c, ci) => {
        if (!c.title.trim()) problems.push(`الدرس ${lesson.key} النشاط ${ci + 1}: بلا عنوان`);
        if (c.bookFrom < unit.bookFrom || c.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} النشاط ${ci + 1}: صفحته ${c.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && c.bookFrom < prev.bookFrom) {
          problems.push(`الدرس ${lesson.key}: صفحات الأنشطة تنازلية (${prev.bookFrom} ثم ${c.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }
      const last = lesson.concepts.at(-1)!;
      if (last.bookFrom < from || last.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: نشاطه الأخير ${last.bookFrom} خارج نطاقه ${from}–${to}`);
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
  if (first && first.bookFrom !== EGYPT_MATH_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_MATH_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_MATH_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_MATH_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from
 *     its printed folio, or, on the ten unnumbered or OCR-damaged pages, from
 *     the anchor named in `FOLIO_LESS_ANCHORS`;
 *  2. every unit intro spread prints the unit title and every lesson's first
 *     page prints that lesson's head;
 *  3. every lesson's title is printed somewhere in the pages it owns, and
 *     every activity's printed head is on its own page;
 *  4. every printed page in [2, 119] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of
 *     the term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from
 * the tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_MATH_G10_T1_UNITS;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) + BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_MATH_G10_T1_BOOK_START || book > EGYPT_MATH_G10_T1_BOOK_END) continue;
    const text = loadBookPage(book);
    pagesChecked += 1;
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    printedPages.add(book);

    const anchor = FOLIO_LESS_ANCHORS[book];
    if (anchor !== undefined) {
      if (!normalize(text).toLowerCase().includes(normalize(anchor).toLowerCase())) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع ولا تطبع المرساة «${anchor}»`);
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

  if (printedPages.size !== EGYPT_MATH_G10_T1_BOOK_END - EGYPT_MATH_G10_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_MATH_G10_T1_BOOK_START} و${EGYPT_MATH_G10_T1_BOOK_END}`,
    );
  }

  // 2 + 3a. every unit intro spread prints the unit title, every lesson's first
  // page its head, and every lesson's title is printed somewhere in the pages
  // it owns.
  units.forEach((unit, ui) => {
    if (!pagePrints(unit.bookFrom, unit.title)) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} لا تطبع «${unit.title}»`);
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

  // 3b. every activity's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (!pagePrints(c.bookFrom, c.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة النشاط ${c.bookFrom} لا تطبع «${c.title}»`);
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
  for (let p = EGYPT_MATH_G10_T1_BOOK_START; p <= EGYPT_MATH_G10_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
