// PHASE — official Egypt Primary-4 (Grade 4) Christian Religious Education
// («التربية الدينية المسيحية — الصف الرابع الابتدائي»), first term.
//
// The curriculum tree for the Egypt `eg-g4-christian-education` curriculum is
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
// prints «7» (book 7), scan 12 prints «11» (book 11), scan 36 prints «35»
// (book 35), scan 66 prints «65» (book 65), scan 86 prints «85» (book 85) and
// scan 93 prints «92» (book 92). The book's own «محتويات الكتاب» (scan 6)
// independently confirms it: it lists the eighteen first-term lessons with the
// very book pages their heads print on (٧، ١١، ١٥، ١٩، ٢٣، ٢٨، ٣٥، ٤٠، ٤٤،
// ٤٩، ٥٤، ٥٩، ٦٥، ٧٠، ٧٢، ٧٦، ٨٠، ٨٥) — each head sits exactly on scan
// (page + 1).
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–6 are before the term: the cover (1, no text layer), the
// reviewer masthead (2), a blank page (3), the «المقدمة» (4), the
// «اختصارات أسفار الكتاب المقدس» table (5) and the printed «محتويات الكتاب»
// (6). Scan pages 94–98 are after the term: three «مذكــرات» notes pages
// (94–96), the reviewer credit page (97) and the blank back cover (98). This
// scan holds the first term only — there is no second-term content. The term
// runs from the unit 1 opener (book 6 = scan 7) to the third term-exam page
// (book 92 = scan 93): `EGYPT_CHRISTIAN_G4_T1_BOOK_START` / `_END` are
// exactly those two pages, and the tiling assertion proves nothing in between
// is left unreachable. `pagesChecked` therefore equals 92 − 6 + 1 = 87.
//
// THREE TERM PAGES NEED A DOCUMENTED FOLIO EXCEPTION
// The three unit openers (books 6، 34، 64) print no folio at all — by the
// book's own design each opener lists its unit's six lessons and the unit head
// instead. Rather than weaken the page-number check, these three are exempt
// from it and anchored on the unit head that survives verbatim on that page,
// named in `FOLIO_LESS_ANCHORS`. Every other term page's first line is its own
// bare folio, verified mechanically, so `FOOTER_OCR_MISREADS` is empty.
//
// THE FOLIO CHECK READS THE FIRST LINE, NOT THE FOOT
// Like the Grade-2/3 books of the same series (and unlike the G10 book, whose
// folio sits in the running foot), this book prints its folio as the very
// first line of every content page. `footerCandidates` therefore reads the
// first non-empty line and accepts it only when it is a bare number; verified
// mechanically so every other term page yields exactly its own single number.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED «أهداف الدرس»
// Every first-term lesson prints four «بنهاية الدرس، يكون التلميذ قادرًا على
// أن» items on its first page, except lesson 2-5, which prints five. Every item
// is carried byte-verbatim as a concept
// of that lesson, with the layer quirks kept honest rather than reconstructed:
// the body pages print «اهلل» for «الله» and a decomposed lam-alef ligature
// («املالك»، «املسيح»، «االعتماد»); lesson 3-3 keeps the text layer's Persian
// yeh spelling («یتعرف»، «یسوع»، «الشیطان»); lesson 2-2 keeps the visual-order
// Scripture reference at its head («.) ٣٢ - ٢٥ : ٢ يصف … (لو»); and lesson
// 1-5's fourth objective wraps onto a second printed line and is stored
// joined. Three lesson titles follow their own first page rather than the
// contents line (lesson 2-1 «طفولة السيد املسيح»، lesson 2-6 «زَكَّا العشار -
// االعتماد على النفس» and lesson 3-1 «يوحنا يمهد الطريق للسيد املسيح»).
//
// LESSON SLOTS REPEAT EVERY UNIT
// Each unit holds the same six component slots in order: العقيدة (الدرس
// الأول)، المحفوظات (الدرس الثاني)، العبادة (الدرس الثالث)، شخصيات كتابية
// (الدرس الرابع)، شخصيات تاريخية (الدرس الخامس)، القيم والأخلاق (الدرس
// السادس). The «مراجعة على الوحدة» pages (books 33، 63، 89) and the three
// «اختبارات على الفصل الدراسي الأول» pages (books 90–92) are not lessons —
// the contents lists them with • bullets — and stay inside the owning unit's
// last lesson range, exactly as the G10 spec keeps its exam pages inside its
// last lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 1 (verified: book p.86 = scan p.87). */
export const BOOK_TO_PDF_OFFSET = 1;

/** Scans absent from the corpus. All 98 scans are present, so this is empty. */
export const MISSING_SCANS: readonly number[] = [];

/** First printed page of the term — the unit 1 opener (scan 7). */
export const EGYPT_CHRISTIAN_G4_T1_BOOK_START = 6;

/** Last printed page of the term — the third term-exam page (scan 93). */
export const EGYPT_CHRISTIAN_G4_T1_BOOK_END = 92;

/** The scanned pages before the term: cover, reviewers, blank, مقدمة and محتويات. */
export const EGYPT_CHRISTIAN_G4_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The scanned pages after the term: three مذكرات pages, the specs table and the (empty) back cover. */
export const EGYPT_CHRISTIAN_G4_T1_BACK_MATTER = { from: 94, to: 98 } as const;

/** One printed objective of a lesson — becomes one concept in the app tree. */
export interface ChristianG4T1Concept {
  /** Printed book page where this objective starts (the lesson's first page). */
  bookFrom: number;
  /** The printed component kind: «هدف». */
  kind: string;
  /** The printed objective, verbatim. */
  title: string;
}

/** One lesson («درس») of the first term, as the «محتويات الكتاب» lists it. */
export interface ChristianG4T1Lesson {
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
  concepts: ChristianG4T1Concept[];
}

/** One printed section of the book — one of the three units of the first term. */
export interface ChristianG4T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"3". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: محبة الآخرين". */
  title: string;
  /** The unit head the opener page prints, e.g. "الوحدة الأولى". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: ChristianG4T1Lesson[];
}

const TYPE = "هدف";

function concept(bookFrom: number, title: string): ChristianG4T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The three units of the first term with their printed lessons and every
 * printed «أهداف الدرس» item, transcribed from the first page of each lesson
 * and checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from the book's «محتويات الكتاب» (scan 6); each
 * lesson's concepts are the four objective lines the book prints on the page
 * the lesson starts on, kept byte-verbatim (see the header comment for the
 * text layer's own quirks), each with `bookFrom` set to that first page.
 */
export const EGYPT_CHRISTIAN_G4_T1_UNITS: ChristianG4T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: محبة الآخرين",
    printedHead: "الوحدة األولى",
    bookFrom: 6,
    bookTo: 33,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "تدبير الخالص - بشارة املالك لزكريا",
        printedHead: "تدبير الخالص - بشارة املالك لزكريا",
        bookFrom: 7,
        concepts: [
          concept(7, "يتعرف أهم أحداث بشارة الملاك لزكريا الكاهن."),
          concept(7, "يدلل على أن ل ا شيء مستحيل عند الله من حياة زكريا الكاهن."),
          concept(7, "يعبر عن فرحته لتحقيق وعد الله لزكريا الكاهن."),
          concept(7, "يسرد موقف من حياته يدل على طاعة وصايا الله."),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "بعض اآليات الذهبية ُ",
        printedHead: "بعض اآليات الذهبية ُ",
        bookFrom: 11,
        concepts: [
          concept(11, "يلخص تسبيحة القديسة العذراء مريم لله."),
          concept(11, "يحفظ جزءًا من تسبحة العذراء."),
          concept(11, "يردد الآيات الذهبية بفهم ويتدرب على تطبيقها."),
          concept(11, "يميّز مواقف التواضع والفرح والمحبة من خلال الآيات."),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "يارب علمنا أن نصلي",
        printedHead: "يارب علمنا أن نصلي",
        bookFrom: 15,
        concepts: [
          concept(15, "يتعرّف الصلاة في حياة الرب يسوع."),
          concept(15, "يقدر طلب مشيئة الله في الحياة اليومية."),
          concept(15, "يسرد موقفًا قدم فيه غفران كما يغفر له الله."),
          concept(15, "يطلب حماية الله من التجارب والشر."),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "يشــــوع بن نون",
        printedHead: "يشــــوع بن نون",
        bookFrom: 19,
        concepts: [
          concept(19, "يستنتج الأفكار الرئيسية لقصة يشوع."),
          concept(19, "يدلل على أن الطاعة والثقة في الله تجلب النجاح."),
          concept(19, "يحدد مواطن التواضع والاتكال على الرب فى حياة يشوع."),
          concept(19, "يعبر عن ثقته فى أن الرب معه في كل مكان يذهب إليه."),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "العذراء وأليصابات - زيارة سماوية",
        printedHead: "العذراء وأليصابات - زيارة سماوية",
        bookFrom: 23,
        concepts: [
          concept(23, "يتعرّف أهم أحداث زيارة القديسةالعذراء مريم لأليصابات."),
          concept(23, "يتعرف أهمية الطاعة لكلمة الله."),
          concept(23, "يربط بين المشاركة والخدمة والمحبة الحقيقية."),
          concept(23, "يسرد موقف من حياته الشخصية، يوضح المساعدة لمن يحتاج، كما فعلت العذراء."),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: TYPE,
        title: "ضيافة الغرباء - أليشع واملرأة الشونمية",
        printedHead: "ضيافة الغرباء - أليشع واملرأة الشونمية",
        bookFrom: 28,
        concepts: [
          concept(28, "يذكر أحداث قصة أليشع النبي والمرأة الشونمية."),
          concept(28, "يشرح حسن ضيافة المرأة الشونمية لرجل الله."),
          concept(28, ". يدلل على أن الله ل ا ينسى تعب المحبة"),
          concept(28, "يعبّر عن رغبته في مساعدة الآخرين كما فعلت المرأة الشونمية."),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: الصلاة ومشيئة الله",
    printedHead: "الوحدة الثانية",
    bookFrom: 34,
    bookTo: 63,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "طفولة السيد املسيح",
        printedHead: "طفولة السيد املسيح",
        bookFrom: 35,
        concepts: [
          concept(35, "يرتب أهم أحداث قصة طفولة الرب يسوع منذ ميلاده."),
          concept(35, "يربط بين قيمة تواضع الرب يسوع ومكان ميلاده."),
          concept(35, "يدلل على طاعة يوسف ومريم لمشيئة الله."),
          concept(35, "يسرد موقفًا من حياته عن مساعدة الأسرة مقتديًا بالرب يسوع."),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "بعض اآليات الذهبية",
        printedHead: "بعض اآليات الذهبية",
        bookFrom: 40,
        concepts: [
          concept(40, ".) ٣٢ - ٢٥ : ٢ يصف سمعان الشيخ كما جاءت بالآيات (لو"),
          concept(40, "يسرد كيف استقبل سمعان الشيخ بالطفل يسوع."),
          concept(40, "يعبّر عن أهمية الثقة في وعود الله."),
          concept(40, "يردد الآيات الذهبية بفهم."),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "قوة الصالة - إيليا واملطر",
        printedHead: "قوة الصالة - إيليا واملطر",
        bookFrom: 44,
        concepts: [
          concept(44, "يدلل أن الله يسمع ويستجيب الصلاة."),
          concept(44, "يربط بين قوة الإيمان والثقة في الله."),
          concept(44, "يميّز بين عبادة الله وعبادة الأوثان."),
          concept(44, "يدلل على شجاعة إيليا في قول الحق."),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "دبورة وباراق",
        printedHead: "دبورة وباراق",
        bookFrom: 49,
        concepts: [
          concept(49, "يدلل على تعاون دبورة وباراق وطاعتهما لله."),
          concept(49, "يدلل على أهمية طاعة الله في الأمور الصعبة."),
          concept(49, "يستنتج أن الصلاة قوة تُرافق الطاعة."),
          concept(49, "يميز الفرق بين الاتكال على الله والاتكال على القوة البشرية."),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "القديس أبانوب",
        printedHead: "القديس أبانوب",
        bookFrom: 54,
        concepts: [
          concept(54, "يتعرف أهم أحداث حياة القديس أبانوب ."),
          concept(54, "يستنتج معنى الثبات على الإيمان بالله."),
          concept(54, "يستنتج الفضائل التي تحلى بها القديس أبانوب."),
          concept(54, "يدلل على أن الله يُعين المؤمنين في الشدائد."),
          concept(54, "يؤكد ضرورة الشهادة للسيد المسيح في كل تصرفاتنا."),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: TYPE,
        title: "زَكَّا العشار - االعتماد على النفس",
        printedHead: "زَكَّا العشار - االعتماد على النفس",
        bookFrom: 59,
        concepts: [
          concept(59, "يتعرف سمات شخصية زَكَّا وأحداث لقائه بالرب يسوع."),
          concept(59, "يستنتج معنى الاعتماد على النفس بطريقة إيجابية."),
          concept(59, "يحدد الصعوبات التي واجهت زكا العشار للقاء الرب يسوع."),
          concept(59, "يستنتج أهمية التوبة واتخاذ القرارات التي ترضي الله."),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الشجاعة والسخاء",
    printedHead: "الوحدة الثالثة",
    bookFrom: 64,
    bookTo: 92,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "يوحنا يمهد الطريق للسيد املسيح",
        printedHead: "يوحنا يمهد الطريق للسيد املسيح",
        bookFrom: 65,
        concepts: [
          concept(65, "يتعرّف شخصية ودور يوحنا المعمدان."),
          concept(65, "يستنتج معنى التوبة وأهميتها في حياته الروحية."),
          concept(65, "يتعرف أن الرب يسوع هو «حمل الله» الذي يرفع خطية العالم."),
          concept(65, "يُميّز أن يوحنا جاء ليشهد فقط للنور الحقيقي."),
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
          concept(70, "يردد بفهم بعض الآيات الذهبية."),
          concept(70, "يعترف بأن كلمة الله سلاح قوي في مواجهة التجربة."),
          concept(70, "يميز الفرق بين طاعة الله وطاعة الشر."),
          concept(70, "يثق أن الله يعينه وقت التجربة."),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الصوم : التجربة على الجبل",
        printedHead: "الصوم : التجربة على الجبل",
        bookFrom: 72,
        concepts: [
          concept(72, "یتعرف أن الرب یسوع انتصر على الشیطان في البریة."),
          concept(72, "یستنتج أن الصوم والصلاة سلاح قوي في التجارب."),
          concept(72, "یؤكد أن الانتصار على الشر بطاعة كلام الله."),
          concept(72, "يدلل على محبة الله الذي یساعدنا في كل تجربة."),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "جدعـــون",
        printedHead: "جدعـــون",
        bookFrom: 76,
        concepts: [
          concept(76, "يتعرف شخصية جدعون كقائد شجاع اختاره الله."),
          concept(76, "يدلل على أهمية الثقة في الله في أصعب الظروف بحياة جدعون."),
          concept(76, "يستنتج أن الانتصار الحقيقي ل ا يكون بالقوة بل بالإيمان."),
          concept(76, "يتدرب على أن يكون شجاعًا ومبادرًا في المواقف الحياتية."),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "أمير الشهداء - مارجرجس",
        printedHead: "أمير الشهداء - مارجرجس",
        bookFrom: 80,
        concepts: [
          concept(80, "يتعرف سيرة مارجرجس وأمانته للرب يسوع."),
          concept(80, "يدرك معنى الشجاعة الحقيقية المبنية على الإيمان."),
          concept(80, "يقتدي بمحبة القديس للسيد المسيح منذ صغره."),
          concept(80, "يستنتج أن الشهادة للسيد المسيح أعظم من أي مكافأة أرضية."),
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: TYPE,
        title: "السخاء-األرملة والفلسين",
        printedHead: "السخاء-األرملة والفلسين",
        bookFrom: 85,
        concepts: [
          concept(85, "يروي قصة الأرملة التي أعطت فلسين."),
          concept(85, "يميز بين العطاء من القلب والعطاء لمجرد المظاهر."),
          concept(85, "يستنتج أن الله يرى القلب وليس حجم العطية."),
          concept(85, "يقتدي بتواضع ومحبة الأرملة الفقيرة."),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the
 * unit — so the unit opener, the unit review/project pages and (in unit 3)
 * the term exams stay inside the unit they belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_CHRISTIAN_G4_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_CHRISTIAN_G4_T1_UNITS.forEach((unit, ui) => {
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
  "christian-g4-t1",
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
 * Page-number candidates a content page prints at its head. This book prints
 * its folio as the very first line of the page (scan 8 prints «7», scan 93
 * prints «92»), so the first non-empty line is read and accepted only when it
 * is a bare number. Verified mechanically to leave every term page outside the
 * three pages listed in `FOLIO_LESS_ANCHORS` yielding exactly its own single
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
 * string the check accepts in its place. The three unit openers («الوحدة
 * األولى/الثانية/الثالثة», books 6/34/64) list their unit's lessons and print
 * no folio by design; each is anchored to the unit head it really prints.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  6: "الوحدة األولى",
  34: "الوحدة الثانية",
  64: "الوحدة الثالثة",
};

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every range
 * sits inside its section, concept pages rise inside their lesson, the sections
 * tile the term without gaps or overlaps, and the first/last sections hit the
 * book's own bounds. A content mistake here would quietly ground the tutor on the
 * wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_CHRISTIAN_G4_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_CHRISTIAN_G4_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_CHRISTIAN_G4_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_CHRISTIAN_G4_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_CHRISTIAN_G4_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio (the first line), or, on the three pages named in
 *     `FOLIO_LESS_ANCHORS`, from the printed string quoted there;
 *  2. every unit's opener prints the unit head and every lesson's first page prints
 *     that lesson's head;
 *  3. every lesson's title and every objective is printed on the pages the
 *     lesson owns (each objective on its own first page);
 *  4. every printed page in [6, 92] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_CHRISTIAN_G4_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_CHRISTIAN_G4_T1_BOOK_START || book > EGYPT_CHRISTIAN_G4_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_CHRISTIAN_G4_T1_BOOK_END - EGYPT_CHRISTIAN_G4_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_CHRISTIAN_G4_T1_BOOK_START} و${EGYPT_CHRISTIAN_G4_T1_BOOK_END}`,
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
  for (let p = EGYPT_CHRISTIAN_G4_T1_BOOK_START; p <= EGYPT_CHRISTIAN_G4_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
