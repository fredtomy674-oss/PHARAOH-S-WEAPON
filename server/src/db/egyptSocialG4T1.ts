// PHASE — official Egypt Primary-4 (Grade 4) Social Studies
// («الدراسات الاجتماعية — الصف الرابع الابتدائي: مصر في قلب العالم»),
// first term, 2025/2026 edition (مؤسسة سلاح التلميذ).
//
// The curriculum tree for the Egypt `eg-g4-social` curriculum is rebuilt from
// the textbook (114 scanned pages). This module is the single source of truth
// for the FIRST term: the three units of the first term plus the book-wide
// general review, their printed lessons (exactly as the book's own
// «المحتويات» on scan 4 lists them: 10، 20، 25، 31، 36، 40، 46، 52، 58،
// 62، 68، 72، 78، 84، 90، 98، 106، 108) and, for every lesson, the book's own
// printed «أهداف الدرس» — verbatim, as on the lesson's first page («في نهاية
// هذا الدرس، سأكون قادرًا على أن: …»). The self-checks at the bottom prove
// that mapping against the OCR itself, page by page.
//
// THE OFFSET IS +1 — book page N = scan page N + 1
// Every content page that carries a folio prints it in its running head, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here: scan 11
// prints «10» (book 10), scan 21 prints «20» (book 20), scan 41 prints «40»
// (book 40), scan 63 prints «62» (book 62), scan 91 prints «90» (book 90) and
// scan 111 prints «1 1 0» (book 110). The book's own «المحتويات» (scan 4)
// independently confirms it: it lists the fourteen first-term lessons with the
// very book pages their heads print on — each head sits exactly on scan
// (page + 1).
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–8 are before the term: the cover (1), the title page (2), the
// author address (3), the printed «المحتويات» (4), the curriculum map (5–6),
// the explorer-robot page (7) and the symbols / «ما معنى الدراسات الاجتماعية؟»
// page (8). Scan pages 112–114 are after the term: the «المراجع» page (112),
// the publisher data page (113) and the back cover with the national anthem
// (114). The term runs from the unit-1 «الفكرة الرئيسية» opener (book 8 =
// scan 9) to the last general-review page (book 110 = scan 111):
// `EGYPT_SOCIAL_G4_T1_BOOK_START` / `_END` are exactly those two pages, and
// the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 110 − 8 + 1 = 103.
//
// FOUR TERM PAGES PRINT NO FOLIO — EACH IS AN OPENER BY DESIGN
// Books 8 and 70 are the «الفكرة الرئيسية» unit openers and books 9 and 71
// are the «دروس الوحدة» pages; none prints a page number. Rather than weaken
// the page-number check, these four are anchored on the head each page itself
// prints, named in `FOLIO_LESS_ANCHORS`. Every other term page proves its own
// number from the running head (top or bottom of the page), so
// `FOOTER_OCR_MISREADS` is empty.
//
// THE FOLIO CHECK READS THE RUNNING HEAD, TOP OR BOTTOM
// Most pages print «N الوحدة …» / «N الدرس …» as their first line; some print
// it as their last line (books 91–94، 96) or at the end of the first line
// («تدريبات الدرس 57»، «تقييم الوحدة الثانية 68»، «تقييم الوحدة الثالثة
// 1 0 6»). From book 100 on the folio is letter-spaced («1 0 0» … «1 1 0»).
// `footerCandidates` therefore reads the first four and the last four lines
// and accepts leading/trailing numerals there (joining spaced digits).
// Exercise numerals join the candidate set harmlessly: the page's own number
// proves the mapping when present.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// Every numbered lesson prints its «أهداف الدرس» items on its first page
// (three to five items); every item is carried byte-verbatim as a concept of
// that lesson, with the text layer's own quirks kept honest rather than
// reconstructed: RTL-segment scrambling («ِز بين االتجاهات األصلية والفرعية.
// ي • أم» for «• أميز بين …») and the voweled «َعََلَم» spelling are stored as
// printed, each with `bookFrom` set to that first page. Lesson 3-5's head
// itself is scrambled in the layer («ِم التاريخية في مصر ل ال َمََعَا» for
// «المعالم التاريخية في مصر»); its title and printed head keep that exact
// rendering so the page-proves-the-head check compares the transcription
// against the very text it was taken from.
//
// THE UNIT ASSESSMENTS AND THE GENERAL REVIEW ARE LESSONS
// The «تقييم الوحدة» pages (books 36–37، 68–69، 106–107) and the «مراجعة
// عامة على الفصل الدراسي الأول» pages (books 108–110) print no «أهداف
// الدرس» — they are question banks plus each unit's «النشاط الختامي للوحدة»,
// so their concepts are the question instructions the pages print («السؤال
// الأول: …» … «النشاط الختامي للوحدة»), exactly as the Grade-8 social book
// keeps its review's question instructions. The general review covers the
// whole term, so — as in the Grade-8 book — it stands as its own section.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 1 (verified: book p.110 = scan p.111). */
export const BOOK_TO_PDF_OFFSET = 1;

/** Scans absent from the corpus. All 114 scans are present, so this is empty. */
export const MISSING_SCANS: readonly number[] = [];

/** First printed page of the term — the unit 1 «الفكرة الرئيسية» opener (scan 9). */
export const EGYPT_SOCIAL_G4_T1_BOOK_START = 8;

/** Last printed page of the term — the last general-review page (scan 111). */
export const EGYPT_SOCIAL_G4_T1_BOOK_END = 110;

/** The scanned pages before the term: cover, title, address, محتويات, map, robot, symbols. */
export const EGYPT_SOCIAL_G4_T1_FRONT_MATTER = { from: 1, to: 8 } as const;

/** The scanned pages after the term: المراجع, publisher data, back cover. */
export const EGYPT_SOCIAL_G4_T1_BACK_MATTER = { from: 112, to: 114 } as const;

/** One printed head of the textbook — becomes one concept in the app tree. */
export interface SocialG4T1Concept {
  /** Printed book page where this head appears. */
  bookFrom: number;
  /** The printed component kind: «هدف», «تقييم» or «مراجعة». */
  kind: string;
  /** The printed head, verbatim. */
  title: string;
}

/** One lesson of the first term, as the «المحتويات» lists it. */
export interface SocialG4T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson head, e.g. "الثالث". "" where the book numbers nothing. */
  ordinal: string;
  /** The lesson's opening component type — its first concept's kind. */
  type: string;
  /** Lesson title as printed (without the lesson-head wording). */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order. */
  concepts: SocialG4T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has none: every
   * lesson's document is exactly its own range. Kept so the seeder and the
   * stage share one shape across all the books.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — one of the three units, or the general review. */
export interface SocialG4T1Unit {
  /** This book's sections are its units (plus the general review). */
  kind: "unit";
  /** Internal key: "1"…"4". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". "" for the general review. */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: اتجاهاتنا ترسم خطواتنا". */
  title: string;
  /** The section head the opener page prints, e.g. "اتجاهاتنا ترسم خطواتنا". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next section's opener). */
  bookTo: number;
  lessons: SocialG4T1Lesson[];
}

const GOAL = "هدف";
const QUIZ = "تقييم";
const REVIEW = "مراجعة";

function concept(bookFrom: number, kind: string, title: string): SocialG4T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The three units of the first term plus the general review, with their
 * printed lessons and every printed head, transcribed from the pages the book
 * prints them on and checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from the book's «المحتويات» (scan 4); each numbered
 * lesson's concepts are the «أهداف الدرس» lines the book prints on the page
 * the lesson starts on, kept byte-verbatim; each assessment/review lesson's
 * concepts are the question instructions its pages print.
 */
export const EGYPT_SOCIAL_G4_T1_UNITS: SocialG4T1Unit[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: اتجاهاتنا ترسم خطواتنا",
    printedHead: "اتجاهاتنا ترسم خطواتنا",
    bookFrom: 8,
    bookTo: 37,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: GOAL,
        title: "األماكن واالتجاهات من حولنا.",
        printedHead: "األماكن واالتجاهات من حولنا",
        bookFrom: 10,
        concepts: [
          concept(10, GOAL, "• أصف العالقة بين األماكن على المخططات (المنزل، المدرسة)."),
          concept(10, GOAL, "ِز بين االتجاهات األصلية والفرعية. ي • أم"),
          concept(10, GOAL, "ِد االتجاهات األصلية باستخدام الشمس والبوصلة. د • أح"),
          concept(10, GOAL, "• أعبر عن تقديري لبراعة المصريين القدماء في علم الفلك."),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: GOAL,
        title: "الخريطة في حياتنا.",
        printedHead: "الخريطة في حياتنا",
        bookFrom: 20,
        concepts: [
          concept(20, GOAL, "فهوَمَي المخطط والخريطة. َم ِز بين َمي أ"),
          concept(20, GOAL, "أعِّدِد بعض العناصر األساسية للخريطة."),
          concept(20, GOAL, "قياس الرسم على الخريطة لحساب المسافات في الواقع. َم م ِّد أستخ"),
          concept(20, GOAL, "لول األلوان على الخريطة. َمِّد ِّدِد أح"),
          concept(20, GOAL, "ية. َم ام الخريطة في حياتنا اليو ِّد أفسر أهمية استخ"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: GOAL,
        title: "تطور الخريطة.",
        printedHead: "تطور الخريطة",
        bookFrom: 25,
        concepts: [
          concept(25, GOAL, "أحدد دور المصريين القدماء والعلماء العرب في تطوير رسم الخرائط."),
          concept(25, GOAL, "أعبر عن تقديري إلسهامات مريم اإلسطرالبي في مجال علم الفلك."),
          concept(25, GOAL, "أوضح دور التكنولوجيا في رسم الخرائط الرقمية الدقيقة."),
          concept(25, GOAL, ") في تحديد المواقع. GPS أستخدم تطبيق نظام تحديد المواقع العالمي ("),
          concept(25, GOAL, "أقارن بين الصور الجوية والصور الفضائية."),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: GOAL,
        title: "مصادر جمع المعلومات.",
        printedHead: "مصادر جمع المعلومات",
        bookFrom: 31,
        concepts: [
          concept(31, GOAL, "أميز بين المصادر األولية والثانوية لجمع المعلومات."),
          concept(31, GOAL, "أفسر أهمية جمع المعلومات من مصادر متعددة وموثوقة."),
          concept(31, GOAL, "أوضح الفرق بين الحقائق واآلراء والشائعات."),
          concept(31, GOAL, "ِر عن تقديري لدور الدولة في مواجهة األخبار الزائفة. ب أع"),
        ],
      },
      {
        key: "1-5",
        ordinal: "",
        type: QUIZ,
        title: "تقييم الوحدة األولى.",
        printedHead: "تقييم الوحدة األولى",
        bookFrom: 36,
        concepts: [
          concept(36, QUIZ, "الحظ الخريطة المقابلة، ثم أجب: السؤال األول:"),
          concept(36, QUIZ, "اكتب كلمة (صواب) أمام العبارة الصحيحة، وكلمة (خطأ) أمام العبارة غير السؤال الثاني:"),
          concept(36, QUIZ, "أكمل العبارات التالية بكلمة مناسبة: السؤال الثالث:"),
          concept(36, QUIZ, "اختر اإلجابة الصحيحة مما بين القوسين: السؤال الرابع:"),
          concept(37, QUIZ, "صنف مصادر المعلومات التالية إلى (مصادر أولية) أو (مصادر ثانوية): السؤال الخامس:"),
          concept(37, QUIZ, "اكتب ما تشير إليه العبارة: السؤال السادس:"),
          concept(37, QUIZ, "أجب عما يلي: السؤال السابع:"),
          concept(37, QUIZ, "النشاط الختامي للوحدة"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: مدينتنا وحياتنا اليومية",
    printedHead: "مدينتنا وحياتنا اليومية",
    bookFrom: 38,
    bookTo: 69,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: GOAL,
        title: "كيف تبدو مدينتنا؟",
        printedHead: "كيف تبدو مدينتنا؟",
        bookFrom: 40,
        concepts: [
          concept(40, GOAL, "• أوضح المقصود بمفهومي المدينة والقرية."),
          concept(40, GOAL, "• أعدد أنواع المدن المختلفة في مصر وفق موقعها."),
          concept(40, GOAL, "ِز بين استخدامات األراضي المختلفة في مدينتنا / قريتنا. ي • أم"),
          concept(40, GOAL, "• أشرح أهمية المناطق المختلفة داخل وحول مدينتنا / قريتنا."),
          concept(40, GOAL, "• أعبر عن تقديري لدور المصريين القدماء في بناء القرى والمدن."),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: GOAL,
        title: "تطور مدينتنا.",
        printedHead: "تطور مدينتنا",
        bookFrom: 46,
        concepts: [
          concept(46, GOAL, "• أصف تطور المساكن والخدمات في مدينتنا / قريتنا."),
          concept(46, GOAL, "• أوضح مالمح التطور في وسائل المواصالت."),
          concept(46, GOAL, "• أتعرف مظاهر تطور األجهزة واألدوات المستخدمة في حياتنا اليومية."),
          concept(46, GOAL, "• أعبر عن تقديري لجهود الدولة في تطوير المدن والقرى وتحسين حياة الناس فيها."),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: GOAL,
        title: "األماكن الخدمية في مدينتنا.",
        printedHead: "األماكن الخدمية في مدينتنا",
        bookFrom: 52,
        concepts: [
          concept(52, GOAL, "ِز بين أنواع الخدمات المختلفة التي تقدمها الدولة. ي • أم"),
          concept(52, GOAL, "• أحدد أهمية األماكن الخدمية المختلفة."),
          concept(52, GOAL, "• التزم بأدواري كمواطن مسئول تجاه األماكن الخدمية."),
          concept(52, GOAL, "• أعبر عن تقديري لجهود الدولة في تطوير األماكن الخدمية المختلفة."),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: GOAL,
        title: "مدينتنا في المستقبل.",
        printedHead: "مدينتنا في المستقبل",
        bookFrom: 58,
        concepts: [
          concept(58, GOAL, "• أدلل على براعة المصريين القدماء في تخطيط المدن."),
          concept(58, GOAL, "• أفسر أهمية التخطيط لبناء مدينتنا في المستقبل."),
          concept(58, GOAL, "• أتوقع أهم مالمح مدينتنا في المستقبل."),
          concept(58, GOAL, "• أعبر عن دوري تجاه مدينتنا في المستقبل."),
          concept(58, GOAL, "• أوضح القيم التي يجب أن نتمسك بها في المستقبل."),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: GOAL,
        title: "أين تقع محافظتي؟",
        printedHead: "أين تقع محافظتي؟",
        bookFrom: 62,
        concepts: [
          concept(62, GOAL, "• أتعرف التقسيم اإلداري لمصر."),
          concept(62, GOAL, "• أحدد موقع محافظتي على خريطة مصر."),
          concept(62, GOAL, "• أستنتج أهمية وجود عاصمة لكل دولة."),
          concept(62, GOAL, "• أحلل الرموز التي يتضمنها شعار محافظتي ودالالتها."),
          concept(62, GOAL, "• أعبر عن احترامي للتنوع بين المحافظات المصرية."),
        ],
      },
      {
        key: "2-6",
        ordinal: "",
        type: QUIZ,
        title: "تقييم الوحدة الثانية.",
        printedHead: "تقييم الوحدة الثانية",
        bookFrom: 68,
        concepts: [
          concept(68, QUIZ, "ة الصحيحـة، وكلمـة (خطـأ) أمـام ًر اكتـب كلمـة (صـواب) أمـام العبـا السـؤال األول:"),
          concept(68, QUIZ, "اختر اإلجابة الصحيحة مما بين القوسين: السؤال الثاني:"),
          concept(68, QUIZ, "ات التالية بما يناسبها: ًر أكمل العبا السؤال الثالث:"),
          concept(69, QUIZ, "بم تفسر...؟ السؤال الرابع:"),
          concept(69, QUIZ, "ما النتائج المترتبة على...؟ السؤال الخامس:"),
          concept(69, QUIZ, "أجب عما يأتي: السؤال السادس:"),
          concept(69, QUIZ, "ما المقصود بكل من ...؟ السؤال السابع:"),
          concept(69, QUIZ, "النشاط الختامي للوحدة"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: مصر وطننا",
    printedHead: "مصر وطننا",
    bookFrom: 70,
    bookTo: 107,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: GOAL,
        title: "َعََلَم وطننا مصر.",
        printedHead: "َعََلَم وطننا مصر",
        bookFrom: 72,
        concepts: [
          concept(72, GOAL, "• أصف َعََلَم وطني مصر وداللة ألوانه."),
          concept(72, GOAL, "ََلَم المصري. ع • أتعرف مراحل تطور ال"),
          concept(72, GOAL, "وكيات التعامل مع َعََلَم وطني مصر. َل ِّدِد س َع • أ"),
          concept(72, GOAL, "ِ وطني مصر. م ََلَ ع تزازي ب َع ن ا َع ِر َعب • أ"),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: GOAL,
        title: "مصر على خريطة العالم.",
        printedHead: "مصر على خريطة العالم",
        bookFrom: 78,
        concepts: [
          concept(78, GOAL, "أتعرف القارات والمحيطات على خريطة العالم."),
          concept(78, GOAL, "أحِّدِد موقع مصر بالنسبة لقارة إفريقيا والعالم."),
          concept(78, GOAL, "أفسر أهمية موقع مصر الجغرافي."),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: GOAL,
        title: "تضاريس أرضنا الجميلة.",
        printedHead: "تضاريس أرضنا الجميلة",
        bookFrom: 84,
        concepts: [
          concept(84, GOAL, "ِز بين بعض أشكال التضاريس المختلفة. ي • أم"),
          concept(84, GOAL, "• أحِّدِد بعض التضاريس على خريطة مصر."),
          concept(84, GOAL, "• أربط بين تنوع التضاريس وتنوع األنشطة البشرية في مصر."),
          concept(84, GOAL, "في تنوع أشكال سطح األرض. يري لعظمة الله ِّد ِر عن تق ب • أع"),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: GOAL,
        title: "ثروات مصر الطبيعية والبشرية.",
        printedHead: "ثروات مصر الطبيعية والبشرية",
        bookFrom: 90,
        concepts: [
          concept(90, GOAL, "ِز بين أنواع الموارد المتجددة وغير المتجددة. ي • أم"),
          concept(90, GOAL, "• أشرح العالقة بين الحفاظ على الموارد الطبيعية والحياة المستدامة."),
          concept(90, GOAL, "ِد المشكالت التي تتعرض لها بعض الموارد الطبيعية. د • أح"),
          concept(90, GOAL, "ِد أهمية الموارد الطبيعية بالنسبة لإلنسان. د • أح"),
          concept(90, GOAL, "ِفة من المصريين. ر ِر عن تقديري ألدوار النماذج المش ب • أع"),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: GOAL,
        title: "ِم التاريخية في مصر ل ال َمََعَا.",
        printedHead: "ِم التاريخية في مصر ل ال َمََعَا",
        bookFrom: 98,
        concepts: [
          concept(98, GOAL, "ِم التاريخية في مصر. ل ض ال َمََعَا َع رف ب َع • أت"),
          concept(98, GOAL, "ية هويتنا الوطنية. َم ِم التاريخية في تن ل ية ال َمََعَا َم • أوضح أه"),
          concept(98, GOAL, "َم. ل ا َع صرية على مستوى ال َم ة الحضارة ال َم ِّبِر عن تقديري لقي • أع"),
          concept(98, GOAL, "ِم التاريخية. ل لية للحفاظ على ال َمََعَا َم ًقًا ع ترح طر ًق • أ"),
        ],
      },
      {
        key: "3-6",
        ordinal: "",
        type: QUIZ,
        title: "تقييم الوحدة الثالثة.",
        printedHead: "تقييم الوحدة الثالثة",
        bookFrom: 106,
        concepts: [
          concept(106, QUIZ, "ة غير ًر با ْع ة (خطأ) أمام ال َم ة الصحيحة، وكل ًر با ْع ة (صواب) أمام ال َم اكتب كل السؤال األول:"),
          concept(106, QUIZ, "ا يناسبها: َم ات اآلتية ب ًر با ْع ل ال َم أك السؤال الثاني:"),
          concept(106, QUIZ, "ا بين القوسين: َم اختر اإلجابة الصحيحة م السؤال الثالث:"),
          concept(107, QUIZ, "بم تفسر...؟ السؤال الرابع:"),
          concept(107, QUIZ, "ترتبة على...؟ َم ما النتائج ال السؤال الخامس:"),
          concept(107, QUIZ, "ا يأتي: َم أجب ع السؤال السادس:"),
          concept(107, QUIZ, "النشاط الختامي للوحدة"),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "",
    title: "مراجعة عامة على الفصل الدراسي الأول",
    printedHead: "مراجعة عامة على الفصل الدراسي األول",
    bookFrom: 108,
    bookTo: 110,
    lessons: [
      {
        key: "4-1",
        ordinal: "",
        type: REVIEW,
        title: "مراجعة عامة على الفصل الدراسي األول.",
        printedHead: "مراجعة عامة على الفصل الدراسي األول",
        bookFrom: 108,
        concepts: [
          concept(108, REVIEW, "الحظ خريطة مصر المقابلة ثم حدد مدلول األرقام الموقعة عليها: السؤال األول:"),
          concept(108, REVIEW, "اكتـب كلمـة (صـواب) أمـام العبـارة الصحيحـة، وكلمة (خطـأ) أمـام العبارة السؤال الثاني:"),
          concept(109, REVIEW, "اختر اإلجابة الصحيحة مما بين القوسين: السؤال الثالث:"),
          concept(109, REVIEW, "ما المقصود بكل مما يلي...؟ السؤال الرابع:"),
          concept(110, REVIEW, "ًا لكل مما يلي: د ًا واح ر اكتب تفسي السؤال الخامس:"),
          concept(110, REVIEW, "ما النتائج المترتبة على كل مما يلي...؟ السؤال السادس:"),
          concept(110, REVIEW, "دلل على صحة كل عبارة مما يلي: السؤال السابع:"),
          concept(110, REVIEW, "أجب عما يلي: السؤال الثامن:"),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the
 * unit — so the unit opener, the «دروس الوحدة» page, the unit assessment and
 * (in the review section) every review page stay inside the section they
 * belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_SOCIAL_G4_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SOCIAL_G4_T1_UNITS.forEach((unit, ui) => {
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
 * term belongs to a section. Kept as a function so the seeder and the stage
 * share one shape across all the books.
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
  "social-g4-t1",
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

/** The document a lesson grounds the tutor in: its own page range, in order. */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(unitIndex, lessonIndex);
  return loadBookRange(from, to);
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
 * Numerals one OCR line contributes: a leading run of digit tokens (the folio
 * is glued to the running head: «10 الوحدة …», «52 …») or a trailing run
 * («… الدرس 57»، «… الثانية 68»), joining letter-spaced digits («1 0 8» →
 * 108). Runs longer than three digits (map scales like «0 100 200») are not
 * folios and contribute nothing.
 */
function lineNumbers(line: string): number[] {
  const latin = toLatinDigits(line).trim();
  if (!latin) return [];
  const out: number[] = [];
  if (!/\p{L}/u.test(latin)) {
    const joined = latin.replace(/\s+/g, "");
    if (/^\d{1,3}$/.test(joined)) return [Number(joined)];
  }
  const tokens = latin.split(/\s+/);
  const lead: string[] = [];
  for (const t of tokens) {
    if (/^\d+$/.test(t)) lead.push(t);
    else break;
  }
  if (lead.length > 0) {
    const joined = lead.join("");
    if (joined.length <= 3 && Number(joined) > 0) out.push(Number(joined));
  }
  const tail: string[] = [];
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i]!;
    if (/^\d+$/.test(t)) tail.unshift(t);
    else break;
  }
  if (tail.length > 0) {
    const joined = tail.join("");
    if (joined.length <= 3 && Number(joined) > 0 && !out.includes(Number(joined))) {
      out.push(Number(joined));
    }
  }
  return out;
}

/**
 * Page-number candidates a content page prints in its running head. This book
 * prints the head at the top («10 الوحدة الأولى …») or at the bottom («91
 * الدرس الرابع …», «1 0 8»), so the first four and the last four non-empty
 * lines are read; every numeral on a head-looking line is a candidate. The
 * page's own number proves the mapping when present.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const region = [...lines.slice(0, 4), ...lines.slice(-4)];
  const numbers = new Set<number>();
  for (const line of region) {
    for (const n of lineNumbers(line)) numbers.add(n);
  }
  return [...numbers].sort((a, b) => a - b);
}

/**
 * The book number a content page prints, or null when it prints none. Returns
 * the page's own number when it is among the candidates, otherwise the largest
 * candidate (so a wrong page still reports a number and the caller can see the
 * mismatch). The four opener pages (8، 9، 70، 71) print no folio at all, so
 * those pages are anchored through `FOLIO_LESS_ANCHORS`.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
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
 * string the check accepts in its place. Books 8 and 70 are the «الفكرة
 * الرئيسية» unit openers and books 9 and 71 are the «دروس الوحدة» pages; by
 * the book's own design none carries a page number.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  8: "اتجاهاتنا ترسم خطواتنا",
  9: "دروس الوحدة األولى",
  70: "الفكرة الرئيسية",
  71: "دروس الوحدة الثالثة",
};

/** Every head kind the table may use: the lesson-head kinds. */
const KNOWN_KINDS = new Set([GOAL, QUIZ, REVIEW]);

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every range
 * sits inside its section, concept pages rise inside their lesson, the sections
 * tile the term without gaps or overlaps, and the first/last sections hit the
 * book's own bounds. A content mistake here would quietly ground the tutor on the
 * wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_SOCIAL_G4_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_SOCIAL_G4_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_SOCIAL_G4_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SOCIAL_G4_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_SOCIAL_G4_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed running head, or, on the four pages named in
 *     `FOLIO_LESS_ANCHORS`, from the printed string quoted there;
 *  2. every unit's opener prints the unit head and every lesson's first page prints
 *     that lesson's head;
 *  3. every lesson's title and every head is printed on the pages the
 *     lesson owns (each head on its own page);
 *  4. every printed page in [8, 110] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_SOCIAL_G4_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SOCIAL_G4_T1_BOOK_START || book > EGYPT_SOCIAL_G4_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_SOCIAL_G4_T1_BOOK_END - EGYPT_SOCIAL_G4_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_SOCIAL_G4_T1_BOOK_START} و${EGYPT_SOCIAL_G4_T1_BOOK_END}`,
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

  // 3b. every head is printed on its own page.
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
  for (let p = EGYPT_SOCIAL_G4_T1_BOOK_START; p <= EGYPT_SOCIAL_G4_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
