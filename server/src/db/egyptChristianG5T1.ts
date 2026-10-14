// PHASE — official Egypt Primary-5 (Grade 5) Christian Religious Education
// («التربية الدينية المسيحية — الصف الخامس الابتدائي»), first term.
//
// The curriculum tree for the Egypt `eg-g5-christian-education` curriculum is
// rebuilt from the Ministry textbook (98 scanned pages, first term only).
// This module is the single source of truth for the FIRST term: the three
// units of the first term, their printed lessons (exactly as the book's own
// «محتويات الكتاب» on scan 6 lists them) and, for every lesson, the book's own
// printed «أهداف الدرس» — verbatim, as on the lesson's first page («أهداف
// الدرس: بنهاية الدرس، يكون التلميذ قادرًا على أن: …»). The self-checks at
// the bottom prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS +1 — book page N = scan page N + 1
// Every content page that carries a folio prints it as its FIRST line, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here: scan 8
// prints «7» (book 7), scan 13 prints «12» (book 12), scan 24 prints «23»
// (book 23), scan 38 prints «37» (book 37), scan 66 prints «65» (book 65),
// scan 88 prints «87» (book 87) and scan 93 prints «92» (book 92). The book's
// own «محتويات الكتاب» (scan 6) independently confirms it: it lists the
// eighteen first-term lessons with the very book pages their heads print on
// (٧، ١٢، ١٨، ٢٣، ٢٧، ٣١، ٣٧، ٤٢، ٤٦، ٥٠، ٥٤، ٥٨، ٦٥، ٧٠، ٧٤، ٧٩، ٨٣، ٨٧)
// — each head sits exactly on scan (page + 1).
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–6 are before the term: the cover (1, no text layer), the
// reviewer masthead (2), a blank page (3, no text layer), the «المقدمة» (4),
// the «اختصارات أسفار الكتاب المقدس» table (5) and the printed «محتويات
// الكتاب» (6). Scan pages 96–98 are after the term: two «مذكــرات» notes
// pages (96), the specs table (97) and the blank back cover (98, no text
// layer). This scan holds the first term only — there is no second-term
// content. The term runs from the unit 1 opener (book 6 = scan 7) to the
// first term-exam page (book 94 = scan 95): `EGYPT_CHRISTIAN_G5_T1_BOOK_START`
// / `_END` are exactly those two pages, and the tiling assertion proves
// nothing in between is left unreachable. `pagesChecked` therefore equals
// 94 − 6 + 1 = 89.
//
// SIX TERM PAGES NEED A DOCUMENTED FOLIO EXCEPTION
// The three unit openers (books 6، 36، 64) print no folio at all — by the
// book's own design each opener lists its unit's six lessons and the unit head
// instead. Three further pages (books 56، 66، 73) print their folio with a
// stray vowel mark glued to it («56 ُ»، «66 ً»، «73 ٌ»), so the strict
// bare-number read finds no parseable folio there either. Rather than weaken
// the page-number check, all six are exempt from it and anchored on a printed
// string that survives verbatim on that page, named in `FOLIO_LESS_ANCHORS`.
// Every other term page's first line is its own bare folio, verified
// mechanically, so `FOOTER_OCR_MISREADS` is empty.
//
// THE FOLIO CHECK READS THE FIRST LINE, NOT THE FOOT
// Like the Grade-2/3/4 books of the same series, this book prints its folio
// as the very first line of every content page. `footerCandidates` therefore
// reads the first non-empty line and accepts it only when it is a bare
// number; verified mechanically so every other term page yields exactly its
// own single number.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED «أهداف الدرس»
// Every first-term lesson prints its «بنهاية الدرس، يكون التلميذ قادرًا على
// أن» items on its first page — four items (lessons 1-1، 1-2، 1-3، 1-6، 2-1،
// 2-2، 2-3، 2-4، 2-5، 2-6، 3-1، 3-2، 3-3، 3-4) or five (lessons 1-4، 1-5،
// 3-5، 3-6). Every item is carried byte-verbatim as a concept of that lesson,
// with the layer quirks kept honest rather than reconstructed: the heads
// print «املالئكة» for «الملائكة»، «االجتماع» for «الاجتماع»، «املحارب» for
// «المحارب» and «امللك» for «الملك» (lesson 3-4 keeps its whole visual-order
// head «امللك ) - داود 3 داود ( حياة»); unit 2 prints «الصالة ومشيئة اهلل»;
// and four objectives wrap onto a second printed line (lessons 1-4، 1-5،
// 3-5، and two in 3-6) and are stored joined.
//
// LESSON SLOTS REPEAT EVERY UNIT
// Each unit holds the same six component slots in order: العقيدة (الدرس
// الأول)، المحفوظات (الدرس الثاني)، العبادة (الدرس الثالث)، شخصيات كتابية
// (الدرس الرابع)، شخصيات تاريخية (الدرس الخامس)، القيم والأخلاق (الدرس
// السادس). The «مراجعة على الوحدة» pages (books 35، 63، 91) and the three
// «اختبارات على الفصل الدراسي الأول» pages (books 92–94) are not lessons —
// the contents lists them with • bullets — and stay inside the owning unit's
// last lesson range, exactly as the Grade-4 spec keeps its exam pages inside
// its last lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 1 (verified: book p.87 = scan p.88). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the term — the unit 1 opener (scan 7). */
export const EGYPT_CHRISTIAN_G5_T1_BOOK_START = 6;

/** Last printed page of the term — the first term-exam page (scan 95). */
export const EGYPT_CHRISTIAN_G5_T1_BOOK_END = 94;

/** The scanned pages before the term: cover, reviewers, blank, مقدمة, abbreviations and محتويات. */
export const EGYPT_CHRISTIAN_G5_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The scanned pages after the term: two مذكرات pages, the specs table and the (empty) back cover. */
export const EGYPT_CHRISTIAN_G5_T1_BACK_MATTER = { from: 96, to: 98 } as const;

/** Scans absent from the corpus. All 98 scans are present, so this is empty. */
export const MISSING_SCANS: readonly number[] = [];

/** One printed objective of a lesson — becomes one concept in the app tree. */
export interface ChristianG5T1Concept {
  /** Printed book page where this objective starts (the lesson's first page). */
  bookFrom: number;
  /** The printed component kind: «هدف». */
  kind: string;
  /** The printed objective, verbatim. */
  title: string;
}

/** One lesson («درس») of the first term, as the «محتويات الكتاب» lists it. */
export interface ChristianG5T1Lesson {
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
  /** The book's printed «أهداف الدرس» for this lesson, in order. */
  concepts: ChristianG5T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix:
   * every page of the term belongs to a unit. Kept so the module shares the
   * shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — one of the three units of the first term. */
export interface ChristianG5T1Unit {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"3". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: الطاعة والبركة". */
  title: string;
  /** The unit head the opener page prints, e.g. "الوحدة األولى". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: ChristianG5T1Lesson[];
}

const TYPE = "هدف";

function concept(bookFrom: number, kind: string, title: string): ChristianG5T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The three units of the first term with their printed lessons and every
 * printed «أهداف الدرس» item, transcribed from the first page of each lesson
 * and checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from the book's «محتويات الكتاب» (scan 6); each
 * lesson's concepts are the objective lines the book prints on the page the
 * lesson starts on, kept byte-verbatim (see the header comment for the text
 * layer's own quirks), each with `bookFrom` set to that first page.
 */
export const EGYPT_CHRISTIAN_G5_T1_UNITS: ChristianG5T1Unit[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: الطاعة والبركة",
    printedHead: "الوحدة األولى",
    bookFrom: 6,
    bookTo: 35,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "املالئكة",
        printedHead: "املالئكة",
        bookFrom: 7,
        concepts: [
          concept(7, TYPE, "يَتعَرف َ دور الملائكة في رفع صلواتنا إلى الله."),
          concept(7, TYPE, "يُعدد أدوار الملائكة ِ في خدمة الأنسان."),
          concept(7, TYPE, "يَسرَد َ قصصًا من الكتاب المقدس عن خدمة الملائكة."),
          concept(7, TYPE, "يُفرّق بين طبيعة الإنسان ِ والملائكةِ."),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "بعض اآليات الذهبية",
        printedHead: "بعض اآليات الذهبية",
        bookFrom: 12,
        concepts: [
          concept(12, TYPE, "يُردد َ بفهم بعض النصوص ِ الكتابيةِ."),
          concept(12, TYPE, "يذكر َ معاني كلماِت النصوص ِ الكتابيةِ."),
          concept(12, TYPE, "يتعرف أن السعادة الحقيقية هي من محبة ِ اللهِ."),
          concept(12, TYPE, "يسلك بالتواضع ِ والوداعِة مع الآخريَن."),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الكنيسة ُ في العهد ِ القديم ِ : فلك نوح",
        printedHead: "الكنيسة ُ في العهد ِ القديم ِ : فلك نوح",
        bookFrom: 18,
        concepts: [
          concept(18, TYPE, "يتعرف أن نوح كان بارًا وأطاع الله وسط عالم مليء بالشر."),
          concept(18, TYPE, "يدلل على أن الطاعة الكاملة لله تحفظ ُ الإنسان َ من كل خطر."),
          concept(18, TYPE, "يَقتدَي بثبات نوح في دعوة الآخرين للتوبة."),
          concept(18, TYPE, "يستنتج أوجه التشابه بين فلك نوح و الكنيسة."),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "الراعي الصغير ) 1 ( داود",
        printedHead: "الراعي الصغير",
        bookFrom: 23,
        concepts: [
          concept(23, TYPE, "يَتعَرف َ نشأة داود ومحبته لله."),
          concept(23, TYPE, "يدلل بآية من الكتاب المقدس على أَن الله ينظر إلى القلب وليس المظهر الخارجي."),
          concept(23, TYPE, "يعبر عن تقديره لشجاعة داود وثقته بالله في مواجهة جليات."),
          concept(23, TYPE, "يَستَنَتج أَن اللَه يستخدُم الأشخاص َ البسطاء َ في أعمال عظيمة."),
          concept(23, TYPE, "يَقتَدي بداود في الإيمان، الطاعة، والشجاعة."),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "السامرية - لقاء عند البئر",
        printedHead: "السامرية - لقاء عند البئر",
        bookFrom: 27,
        concepts: [
          concept(27, TYPE, "يتعرف أن الرب َ يسوع َ يحب ُ الجميع َ دون تمييزٍ."),
          concept(27, TYPE, "يُميز ِ بين «الماء العادي» و «الماء الحي»."),
          concept(27, TYPE, "يُثمن كيف عامل الرب يسوع المرأة باحترام."),
          concept(27, TYPE, "يرفض َ الحكم على الآخرين بسبب ماضيهم أو اختلافهم."),
          concept(27, TYPE, "يسرد مواقف يومية يُظهر فيها احترامه للآخرين بالرغم من الاختلاف."),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: TYPE,
        title: "حق الجار - إيليا واألرملة",
        printedHead: "حق الجار - إيليا واألرملة",
        bookFrom: 31,
        concepts: [
          concept(31, TYPE, "يَكتشف َ بركة مشاركة ما لديه مع الآخرين حتى لو كان قليلًا."),
          concept(31, TYPE, "يُعبر عن ثقته في وعود الله مثل إيليا والأرملة."),
          concept(31, TYPE, "يَتدرب َ على محبة الجار ومساعدته كما علمنا الرب يسوع."),
          concept(31, TYPE, "يُطبَق َ مفهوم «حق الجار» في حياته اليومية."),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: الصالة ومشيئة اهلل",
    printedHead: "الوحدة الثانية",
    bookFrom: 36,
    bookTo: 63,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "التجـــلي",
        printedHead: "التجـــلي",
        bookFrom: 37,
        concepts: [
          concept(37, TYPE, "يتعرف َ أن الرب يسوع هو كلمة الله المتجسد."),
          concept(37, TYPE, "يشرح َ معنى التجلي ومكان حدوثه."),
          concept(37, TYPE, "يحدد َ الشخصين اللذين ظهرا مع السيد المسيح."),
          concept(37, TYPE, "يربط َ بين التجلي وإعلان مجد لاهوت السيد المسيح."),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "بعض اآليات الذهبية",
        printedHead: "بعض اآليات الذهبية",
        bookFrom: 42,
        concepts: [
          concept(42, TYPE, "يُردد َ المحفوظات بوعي وفهم."),
          concept(42, TYPE, "يُميّز َ بين من يعمل بالوصايا، ومن ينقضها."),
          concept(42, TYPE, "يُعبّر َ عن رغبته في طاعة وصايا الله."),
          concept(42, TYPE, "يَلتزم َ بتطبيق الوصايا التي تعلمها في حياته اليومية."),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الكنيسة في العهد القديم - خيمة االجتماع",
        printedHead: "خيمة االجتماع",
        bookFrom: 46,
        concepts: [
          concept(46, TYPE, "يَتعرف َ سبب بناء خيمة الاجتماع."),
          concept(46, TYPE, "يَشرح َ أقسام الخيمة ومحتوياتها."),
          concept(46, TYPE, "يرَبط َ بين محتويات خيمة الاجتماع والسيد المسيح."),
          concept(46, TYPE, "يؤيد َ أن الكنيسة اليوم هي امتداد لخيمة الاجتماع."),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "داود (2) - : املحارب",
        printedHead: "داود (2) - : املحارب",
        bookFrom: 50,
        concepts: [
          concept(50, TYPE, "يَسرَد َ بعض المواقف التي توضح تسامح داود مع أعدائه."),
          concept(50, TYPE, "يُعبر َ عن أهمية الصلاة والتسبيح وقت الضيق."),
          concept(50, TYPE, "يَستَنتج َ أن الله ينظر لقلب الإنسان."),
          concept(50, TYPE, "يَشرَح َ قيمة الصداقة بين داود ويوناثان."),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "يوحنا الحبيب",
        printedHead: "يوحنا الحبيب",
        bookFrom: 54,
        concepts: [
          concept(54, TYPE, "يَتعَرف َ أهم أحداث حياة يوحنا الحبيب."),
          concept(54, TYPE, "يِستَنتج َ أهمية الرعاية والاهتمام بالآخرين."),
          concept(54, TYPE, "يِثَق َ أن التوبة ممكنة في كل الأوقات."),
          concept(54, TYPE, "يَسرِد َ موقفًا يوضح اقتدائه بمحبة يوحنا وحرصه على كل نفس."),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: TYPE,
        title: "السعي في طلب العلم - الدكتور مجدي يعقوب",
        printedHead: "السعي في طلب العلم",
        bookFrom: 58,
        concepts: [
          concept(58, TYPE, "يَتعَرف َ أحداث قصة مجدي يعقوب للسعي في طلب العلم."),
          concept(58, TYPE, "يُعبر َ عن أهمية السعي في طلب العلم."),
          concept(58, TYPE, "يُثمن قيمة العلم كوسيلة لخدمة الآخرين."),
          concept(58, TYPE, "يَسرَد َ مواقف تؤكد على أن الرحمة ل ا تفرّق بين الناس."),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: التواضع والتوبة",
    printedHead: "الوحدة الثالثة",
    bookFrom: 64,
    bookTo: 94,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "رموز العذراء مريم في العهد القديم",
        printedHead: "رموز العذراء مريم في العهد القديم",
        bookFrom: 65,
        concepts: [
          concept(65, TYPE, "يَتعَرّف َ بعض الرموز التي أشار بها العهد القديم إلى العذراء مريم."),
          concept(65, TYPE, "يَستَنتَج َ كيف يُمهّد العهد القديم لتجسد الرب يسوع من العذراء."),
          concept(65, TYPE, "يُؤيد َ أن الكتاب المقدس مترابط بعهديه القديم والجديد."),
          concept(65, TYPE, "يَستخَدَم َ الرموز لفهم المعاني الروحية."),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "بعض اآليات الذهبية",
        printedHead: "بعض اآليات الذهبية",
        bookFrom: 70,
        concepts: [
          concept(70, TYPE, "يُردَد َ بفهم الآيات الذهبية بالدرس."),
          concept(70, TYPE, "يَقتَدي بتواضع المسيح في حياته اليومية."),
          concept(70, TYPE, "يُعبَر عن أهمية الاحترام في تعامله مع أسرته وأصدقائه."),
          concept(70, TYPE, "يَسَرد َ موقفًا يعكس روح التسامح."),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "التوبة - االبن الضال",
        printedHead: "التوبة - االبن الضال",
        bookFrom: 74,
        concepts: [
          concept(74, TYPE, "يَتعَرف َ المقصود بالتوبة."),
          concept(74, TYPE, "يُؤكد َ أن الله ينتظر التائبين بمحبة وفرح."),
          concept(74, TYPE, "يَستَنتج َ أن الاعتراف بالخطأ هو بداية الطريق الصحيح."),
          concept(74, TYPE, "يُعَبر َ عن فرحته برجوع البعيدين إلى الله."),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "امللك ) - داود 3 داود ( حياة",
        printedHead: "امللك ) - داود 3 داود ( حياة",
        bookFrom: 79,
        concepts: [
          concept(79, TYPE, "يَتَعرَف حكمة داود في قيادة الشعب بعد أن صار ملكًا."),
          concept(79, TYPE, "يُؤكَد َ أن الفرح الحقيقي هو في التسبيح لله."),
          concept(79, TYPE, "يُثمن َ أمانة داود في خدمته لله وشعبه."),
          concept(79, TYPE, "يُعَبر َ عن ثقته فى أن الله يغفر لمن يتوب بإخلاص."),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "األنبا هيدرا",
        printedHead: "األنبا هيدرا",
        bookFrom: 83,
        concepts: [
          concept(83, TYPE, "يَتَعرف َ معنى التوبة والابتعاد عن العالم الزائل."),
          concept(83, TYPE, "يَتَعرف َ أهمية الصلاة في اتخاذ القرارات."),
          concept(83, TYPE, "يَستَنتج َ اهمية طاعة الله ووصاياه."),
          concept(83, TYPE, "يُثمّن َ دور الأنبا هيدرا في الاهتمام بالفقراء والمحتاجين."),
          concept(83, TYPE, "يَسرَد َ موقفًا من حياته الشخصية يدلّل على مساعدة الآخرين والاهتمام بالفقراء والمحتاجين."),
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: TYPE,
        title: "التواضع - غسل األرجل",
        printedHead: "التواضع - غسل األرجل",
        bookFrom: 87,
        concepts: [
          concept(87, TYPE, "يُحدَد َ زمن ومكان اجتماع الرب يسوع مع تلاميذه لغسل الأرجل."),
          concept(87, TYPE, "يُوضَح َ كيف عبّر الرب يسوع عن محبته لتلاميذه من خلال غسل الأرجل."),
          concept(87, TYPE, "يُدلَّل َ بآية من الكتاب المقدس عن أن خدمة الآخرين بمحبة وتواضع هي من صفات أولاد الله."),
          concept(87, TYPE, "يُميَّز َ الفرق بين العظمة في العالم والعظمة في ملكوت الله."),
          concept(87, TYPE, "يَسرَد َ موقفًا حياتيا يوضح قيمة التواضع."),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the
 * unit — so the unit opener, the unit review pages and (in unit 3) the term
 * exams stay inside the unit they belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_CHRISTIAN_G5_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_CHRISTIAN_G5_T1_UNITS.forEach((unit, ui) => {
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
  "christian-g5-t1",
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

/** Loads + joins the OCR text of a book-page range into one document. */
export function loadBookRange(fromBook: number, toBook: number): string {
  const parts: string[] = [];
  for (let book = fromBook; book <= toBook; book++) {
    const text = loadBookPage(book);
    if (text) parts.push(pageBlock(book, text));
  }
  return parts.join("\n\n");
}

/**
 * Full document payload for one lesson: its owned range plus any appendix
 * pages it points to. The lesson's own pages come first. (No lesson of this
 * book points outside its range; the loop is kept so the loader shares one
 * shape across the books.)
 */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const range = lessonBookRange(unitIndex, lessonIndex);
  const lesson = EGYPT_CHRISTIAN_G5_T1_UNITS[unitIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(range.from, range.to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
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
 * Page-number candidates a content page prints at its head. This book prints
 * its folio as the very first line of the page (scan 8 prints «7», scan 93
 * prints «92»), so the first non-empty line is read and accepted only when it
 * is a bare number. Verified mechanically to leave every term page outside the
 * six pages listed in `FOLIO_LESS_ANCHORS` yielding exactly its own single
 * number.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const first = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)[0];
  if (!first) return [];
  const latin = toLatinDigits(first).trim();
  if (!/^[0-9]+$/.test(latin)) return [];
  const n = Number(latin);
  return n > 0 ? [n] : [];
}

/**
 * The book number a content page prints at its head, or null. Every content
 * page that carries a folio prints exactly one number there and it is its own,
 * which is what fixes the offset; the pages named in `FOLIO_LESS_ANCHORS`
 * are handled separately instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The content pages whose printed footer the OCR misread, and the value it
 * printed instead — measured, not guessed. Every parseable folio matches its
 * page number exactly in this book, so there are none; listing the exceptions
 * keeps the check strict instead of statistical.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no parseable folio in the OCR, each with a printed
 * string the check accepts in its place. The three unit openers (books 6، 36،
 * 64) list their unit's lessons and print no folio by design; books 56، 66،
 * 73 print their folio with a stray vowel mark glued to it («56 ُ»، «66 ً»،
 * «73 ٌ») so the strict bare-number read finds nothing parseable. Each is
 * anchored to a head the page itself really prints.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  6: "الوحدة األولى",
  36: "الوحدة الثانية",
  56: "األنشطة والممارسات",
  64: "الوحدة الثالثة",
  66: "ظهر الله بلهيب نار",
  73: "األنشطة والممارسات",
};

/** Every head kind the table may use: lesson objectives. */
const KNOWN_KINDS = new Set(["هدف"]);

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every range
 * sits inside its section, concept pages rise inside their lesson, the sections
 * tile the term without gaps or overlaps, and the first/last sections hit the
 * book's own bounds. A content mistake here would quietly ground the tutor on the
 * wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_CHRISTIAN_G5_T1_UNITS;
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
        if (!KNOWN_KINDS.has(c.kind)) {
          problems.push(`الدرس ${lesson.key} الهدف ${ci + 1}: نوع غير معروف «${c.kind}»`);
        }
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
  if (first && first.bookFrom !== EGYPT_CHRISTIAN_G5_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_CHRISTIAN_G5_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_CHRISTIAN_G5_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_CHRISTIAN_G5_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     its printed folio (allowing the measured OCR misreads), or, on the six
 *     pages named in `FOLIO_LESS_ANCHORS`, from the anchor the page itself
 *     prints. The pages in `MISSING_SCANS` carry no text layer at all and are
 *     not iterated for this proof;
 *  2. every unit opener prints the unit head and every lesson's first page prints
 *     that lesson's head;
 *  3. every lesson's title and every objective is printed on the pages the
 *     lesson owns (each objective on its own first page);
 *  4. every printed page in [6, 94] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR'd
 *     page of the term, i.e. `_BOOK_END - _BOOK_START + 1` minus `MISSING_SCANS`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_CHRISTIAN_G5_T1_UNITS;
  const missing = new Set<number>(MISSING_SCANS);

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_CHRISTIAN_G5_T1_BOOK_START || book > EGYPT_CHRISTIAN_G5_T1_BOOK_END) continue;
    if (missing.has(book)) continue;
    const text = loadBookPage(book);
    pagesChecked += 1;
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    printedPages.add(book);

    const anchor = FOLIO_LESS_ANCHORS[book];
    if (anchor !== undefined) {
      if (!normalize(text).includes(normalize(anchor))) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع ولا تطبع المرساة «${anchor}»`);
      }
    } else {
      const footer = printedFooter(book);
      if (footer === null) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع`);
      } else if (footer !== book && FOOTER_OCR_MISREADS[book] !== footer) {
        problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  const expectedPages = EGYPT_CHRISTIAN_G5_T1_BOOK_END - EGYPT_CHRISTIAN_G5_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_CHRISTIAN_G5_T1_BOOK_START} و${EGYPT_CHRISTIAN_G5_T1_BOOK_END}، المتوقع ${expectedPages}`,
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
  for (let p = EGYPT_CHRISTIAN_G5_T1_BOOK_START; p <= EGYPT_CHRISTIAN_G5_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
