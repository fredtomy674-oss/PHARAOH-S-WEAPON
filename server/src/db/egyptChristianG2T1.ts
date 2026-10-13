// PHASE 111 — official Egypt Primary-2 (Grade 2) Christian Religious Education
// («التربية الدينية المسيحية — الصف الثاني الابتدائي»), first term.
//
// The curriculum tree for the Egypt `eg-g2-christian-education` curriculum is
// rebuilt from the Ministry textbook (90 scanned pages, first term only).
// This module is the single source of truth for the FIRST term: the three
// units of the first term, their printed lessons (exactly as the book's own
// «محتويات الكتاب» on scan 5 lists them) and, for every lesson, the book's
// own printed «أهداف التلميذ» — verbatim, as on the lesson's first page
// («بنهاية الدرس، يتوقع من التلميذ أن : …»). The self-checks at the bottom
// prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS +1 — book page N = scan page N + 1
// Every content page prints its own folio as its FIRST line, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here: scan 7
// prints «6» (book 6), scan 11 prints «10» (book 10), scan 25 prints «24»
// (book 24), scan 32 prints «31» (book 31), scan 52 prints «51» (book 51),
// scan 59 prints «58» (book 58), scan 66 prints «65» (book 65), scan 80
// prints «79» (book 79), scan 86 prints «85» (book 85) and scan 88 prints
// «87» (book 87). The book's own «محتويات الكتاب» (scan 5) independently
// confirms it: it lists the eighteen first-term lessons with the very book
// pages their heads print on (٦، ١٠، ١٢، ١٦، ٢٠، ٢٤، ٣١، ٣٥، ٣٧، ٤٣، ٤٧،
// ٥١، ٥٨، ٦٢، ٦٥، ٦٩، ٧٥، ٧٩) — each head sits exactly on scan (page + 1).
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–5 are before the term: the cover (1, no text layer), the
// reviewer masthead (2), a blank page (3), the «المقدمة» (4) and the printed
// «محتويات الكتاب» (5). Scan pages 89–90 are after the term: the
// technical-specs table (89, naming «الصف الثاني الابتدائي» and «الفصل
// الدراسي الأول») and the blank back cover (90). This scan holds the first
// term only — there is no second-term content. The term runs from the unit 1
// opener (book 5 = scan 6) to the third term-exam page (book 87 = scan 88):
// `EGYPT_CHRISTIAN_G2_T1_BOOK_START` / `_END` are exactly those two pages,
// and the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 87 − 5 + 1 = 83.
//
// THREE TERM PAGES NEED A DOCUMENTED FOLIO EXCEPTION
// The three unit openers (books 5، 30، 57) print no folio at all — by the
// book's own design each opener lists its unit's six lessons instead. Rather
// than weaken the page-number check, these three are exempt from it and
// anchored on a marker that survives verbatim on that page, named in
// `FOLIO_EXCEPTION_MARKERS`.
//
// THE FOLIO CHECK READS THE FIRST LINE, NOT THE FOOT
// Unlike the G10 book (folio in the running foot), this book prints its folio
// as the very first line of every content page. `footerCandidates` therefore
// reads the first non-empty line and accepts it only when it is a bare
// number; verified mechanically so every other term page yields exactly its
// own single number.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED «أهداف التلميذ»
// Every first-term lesson prints four «بنهاية الدرس، يتوقع من التلميذ أن»
// items on its first page. Each item is carried, byte-verbatim (including the
// text layer's own quirks quoted below), as a concept of that lesson with
// `bookFrom` set to the lesson's first page. Nothing is invented. The layer
// quirks kept honest rather than reconstructed: the body pages print «اهلل»
// for «الله» (the three opener pages print «الله» correctly); doubled-alef
// forms («األولى»، «األنبا»، «األمانة»، «األأحداث») are kept; lesson 3-3 prints
// «امللك» for «الملك»; lesson 3-5 (and the contents, and the unit 3 opener)
// print «الفالية الفرعونية»; two title lines are stored in visual RTL order
// with mirrored parens (lessons 1-4 and 3-4, kept as stored); «�»
// (U+FFFD) replacement characters inside words are kept verbatim —
// `normalize` strips them on both sides, so they cannot break a match; and
// the objective lines themselves are stored in visual RTL fragments (verb
// first, e.g. «ا يتعرف» trailing), transcribed exactly as stored.
//
// LESSON SLOTS REPEAT EVERY UNIT
// Each unit holds the same six component slots in order: العقيدة (الدرس
// الأول)، المحفوظات (الدرس الثاني)، العبادة (الدرس الثالث)، شخصيات كتابية
// (الدرس الرابع)، شخصيات تاريخية (الدرس الخامس)، القيم والأخلاق (الدرس
// السادس). The «مراجعة على الوحدة» and «مشروع جماعي» pages (books 29، 56،
// 84) and the three «اختبارات على الفصل الدراسي الأول» pages (books 85–87)
// are not lessons — the contents lists them with • bullets — and stay inside
// the owning unit's last lesson range, exactly as the G10 spec keeps its exam
// pages inside its last lesson.
//
// FOUR LESSON TITLES FOLLOW THEIR OWN FIRST PAGE, NOT THE CONTENTS LINE
// The «محتويات الكتاب» lists lesson 1-4 as «حياة إبراهيم - (١) دعوة الله
// لإبراهيم» but its head on book 16 stores «دعوة اهلل إلبراهيم ) حياة إبراهيم
// - (١)»; lesson 3-4 as «حياة ابراهيم - (٣) زواج إسحاق» but its head on book
// 69 stores «زواج إسحاق ) ٣ حياة إبراهيم (»; lesson 3-3 as «الملك الصغير ــ
// كلام الله» but its head on book 65 prints «امللك الصغير ــ كالم اهلل»; and
// lesson 2-3 as «الصوم – أستير» but its head on book 37 prints «الصوم -
// أسْتِير» (kept here without the diacritics, which `normalize` strips
// anyway). Each lesson carries the form its own page prints, which is what
// the title-in-range check proves.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 1 (verified: book p.87 = scan p.88). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the term — the unit 1 opener (scan 6). */
export const EGYPT_CHRISTIAN_G2_T1_BOOK_START = 5;

/** Last printed page of the term — the third term-exam page (scan 88). */
export const EGYPT_CHRISTIAN_G2_T1_BOOK_END = 87;

/** The scanned pages before the term: cover, reviewers, blank, مقدمة and محتويات. */
export const EGYPT_CHRISTIAN_G2_T1_FRONT_MATTER = { from: 1, to: 5 } as const;

/** The scanned pages after the term: the specs table and the back cover. */
export const EGYPT_CHRISTIAN_G2_T1_BACK_MATTER = { from: 89, to: 90 } as const;

/** One printed objective of a lesson — becomes one concept in the app tree. */
export interface ChristianG2T1Concept {
  /** Printed book page where this objective starts (the lesson's first page). */
  bookFrom: number;
  /** The printed component kind: «هدف». */
  kind: string;
  /** The printed objective, verbatim. */
  title: string;
}

/** One lesson («درس») of the first term, as the «محتويات الكتاب» lists it. */
export interface ChristianG2T1Lesson {
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
  /** The book's printed «أهداف التلميذ» for this lesson, in order. */
  concepts: ChristianG2T1Concept[];
}

/** One printed section of the book — one of the three units of the first term. */
export interface ChristianG2T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"3". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: تدبير الله لنا". */
  title: string;
  /** The unit head the opener page prints, e.g. "الوحدة الأولى". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: ChristianG2T1Lesson[];
}

const TYPE = "هدف";

function concept(bookFrom: number, title: string): ChristianG2T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The three units of the first term with their printed lessons and every
 * printed «أهداف التلميذ» item, transcribed from the first page of each
 * lesson and checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from the book's «محتويات الكتاب» (scan 5); each
 * lesson's concepts are the four objective lines the book prints on the page
 * the lesson starts on, kept byte-verbatim — including the text layer's own
 * quirks («اهلل» for «الله», doubled-alef forms, «امللك», «الفالية», mirrored
 * visual-order title lines and «�» replacements) quoted in the header
 * comment.
 */
export const EGYPT_CHRISTIAN_G2_T1_UNITS: ChristianG2T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: تدبير الله لنا",
    printedHead: "الوحدة األولى",
    bookFrom: 5,
    bookTo: 29,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "اهلل خلق العالم من أجلي",
        printedHead: "اهلل خلق العالم من أجلي",
        bookFrom: 6,
        concepts: [
          concept(6, "أن اهلل خالق الكون، وكل ما فيه. ا يتعرف"),
          concept(6, "أيام الخليقة. ا أحداث كل يوم من ا رد ص ي�"),
          concept(6, "إرادة اهلل. ا يربط بين الظواهر الطبيعية، و"),
          concept(6, "كر اهلل على نعمه، وقدرته في خلق الكون. ص ي�"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "بعض اآليات الذهبية",
        printedHead: "بعض اآليات الذهبية",
        bookFrom: 10,
        concepts: [
          concept(10, "عبه. ص يدلِّل على قدرة اهلل في العناية ب�"),
          concept(10, "أمل في معانيها. ا آيات الذهبية ويت أل يردِّد بفهم ا"),
          concept(10, "أمثلة على قدرة اهلل على تحقيق الوعود. ا يعطي"),
          concept(10, "أمله في كلمة اهلل. ا يعبِّر عن ت"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الصالة : إشباع الجموع",
        printedHead: "الصالة : إشباع الجموع",
        bookFrom: 12,
        concepts: [
          concept(12, "باع الجموع. ص إ� ا أحداث ق�صة ا رد ص ي�"),
          concept(12, "وع يهتم بكل احتياجاتنا. ص أن الرب ي� ا ؤيِّد و ي"),
          concept(12, "أن يبارك القليل. ا تطيع ص أن اهلل ي� ا يدلِّل على"),
          concept(12, "ي�صلِّي قبل وبعد تناول الطعام."),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "دعوة اهلل إلبراهيم ) حياة إبراهيم - (١",
        printedHead: "حياة إبراهيم",
        bookFrom: 16,
        concepts: [
          concept(16, "إبراهيم هلل. ا يثمِّن طاعة"),
          concept(16, "تحيلة. ص يعبِّر عن ثقته فى وعود اهلل لنا حتي لو بدت م�"),
          concept(16, "ان هلل. ص إن� أل يعد بركات طاعة ا"),
          concept(16, "إبراهيم. ا الحوار الذى دار بين اهلل و س يلخ�"),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "موسى النبي - طفل في سلة",
        printedHead: "موسى النبي - طفل في سلة",
        bookFrom: 20,
        concepts: [
          concept(20, "ى بالترتيب. ص أحداث ق�صة الطفل مو� ا رد ص ي�"),
          concept(20, "ى في حماية اهلل لطفلها. ص أم مو� ا يعبِّر عن ثقة"),
          concept(20, "ى. ص يقيِّم دور ابنة فرعون مع الطفل مو�"),
          concept(20, "خيها. أل جاعة مريم ورعايتها ص يثمِّن �"),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: TYPE,
        title: "التوكل على اهلل ــ داود وجليات",
        printedHead: "التوكل على اهلل",
        bookFrom: 24,
        concepts: [
          concept(24, "ة في الق�صة. ص خ�صيات الرئي� ص يتعرف على ال�"),
          concept(24, "تنتج كيف انت�صر داود على جليات. ص ي�"),
          concept(24, "رورة التوكل على اهلل في مواجهة التحديات. ص يعبر عن �"),
          concept(24, "تفادة من ق�صة داود وجليات. ص تنتج الدرو�س الم� ص ي�"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: العطاء والأمانة",
    printedHead: "الوحدة الثانية",
    bookFrom: 30,
    bookTo: 56,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "يسوع في الهيكل",
        printedHead: "يسوع في الهيكل",
        bookFrom: 31,
        concepts: [
          concept(31, "وع لوالديه. ص ي�صف طاعة الرب ي�"),
          concept(31, "وع منذ �صغره. ص يدلِّل على حكمة الرب ي�"),
          concept(31, "رته. ص عى للحياة مع اهلل والوجود في ح� ص ي�"),
          concept(31, "ح الطاعة هلل ولوالديه. ص رد مواقف تو� ص ي�"),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "بعض اآليات الذهبية",
        printedHead: "بعض اآليات الذهبية",
        bookFrom: 35,
        concepts: [
          concept(35, "أن اهلل قادر على �صنع المعجزات. ا يدلِّل على"),
          concept(35, "ار. ص أعظم خبر � ا وع هو ص أن ميالد الرب ي� ا تنتج ص ي�"),
          concept(35, "ر المحبة. ص إلى ن� ا يحية تدعو ص أن الم� ا رح ص ي�"),
          concept(35, "آيات المحفوظات. ا يردِّد بفهم"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الصوم - أستير",
        printedHead: "الصوم - أستير",
        bookFrom: 37,
        concepts: [
          concept(37, "عبها. ص إنقاذ � ا تير في ص أ� ا يتعرَّف دور"),
          concept(37, "ؤمنين. و أهمية ال�صوم في حياة الم ا رح ص ي�"),
          concept(37, "ريرة. ص خ�صيات الطيبة وال� ص يميّز بين ال�"),
          concept(37, "إيمانها باهلل. ا تير و ص أ� ا جاعة ص يقتدي ب�"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "حياة إبراهيم(٢) وعد اهلل بإسحاق",
        printedHead: "وعد اهلل بإسحاق",
        bookFrom: 43,
        concepts: [
          concept(43, "حاق. ص إ� ا إنجاب ا إبراهيم ب ا يتعرَّف وعد اهلل ألأبينا"),
          concept(43, "إبراهيم. ا أهم األأحداث في وعد اهلل ألأبينا ا يرتّب"),
          concept(43, "إبراهيم وطاعته هلل. ا إيمان ا يربط بين"),
          concept(43, "يء. ص أن اهلل قادر على كل � ا يعبِّر عن ثقته ب"),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "األنبا أبرام - رجل العطاء",
        printedHead: "األنبا أبرام - رجل العطاء",
        bookFrom: 47,
        concepts: [
          concept(47, "أبرام. ا ة لق�صة األأنبا ص يتعرَّف األأحداث الرئي�"),
          concept(47, "عتماد على اهلل في كل األأمور. أل ح ا ص رد موقف يو� ص ي�"),
          concept(47, "يئة تجاه الفقراء. ص يميّز بين الت�صرفات الجيدة وال�"),
          concept(47, "أبرام. ا يعدِّد القيم التى تحلى بها األأنبا"),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: TYPE,
        title: "األمانة - يوسف الصديق",
        printedHead: "األمانة - يوسف الصديق",
        bookFrom: 51,
        concepts: [
          concept(51, "ف بقيمة األأمانة. ص يدلِّل على تحلى يو�"),
          concept(51, "آخرين. أل أهمية األأمانة في العالقات مع ا ا عر ب ص ي�"),
          concept(51, "أ. ا الخط س ف في رف� ص يقتدي بيو�"),
          concept(51, "ة والبيت. ص رد موقف عن األأمانة في المدر� ص ي�"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الله يستجيب",
    printedHead: "الوحدة الثالثة",
    bookFrom: 57,
    bookTo: 87,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الرب يسوع يقبل الكل",
        printedHead: "الرب يسوع يقبل الكل",
        bookFrom: 58,
        concepts: [
          concept(58, "وع يحب األأطفال ويهتم بهم. ص أن الرب ي� ا يتعرّف"),
          concept(58, "وع يحب الجميع دون تمييز. ص أن الرب ي� ا تنتج ص ي�"),
          concept(58, "وع يقبل الجميع باختالفاتهم. ص أن الرب ي� ا ؤيّد و ّ ي"),
          concept(58, "أن له مكانة خا�صة عند اهلل. ا ح ب ص رد موقف يو� ص ي�"),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "بعض اآليات الذهبية",
        printedHead: "بعض اآليات الذهبية",
        bookFrom: 62,
        concepts: [
          concept(62, "آيات الذهبية. أل يردّد بفهم ا"),
          concept(62, "آيات الذهبية. أل يذكر مفردات كلمات ا"),
          concept(62, "يعبّر عن الراحة والثقة عند قراءة كلمة اهلل."),
          concept(62, "تخدام كلمة اهلل في حياته اليومية. ص طة تُظهر كيف يمكنه ا� ص أن� ا ارك في ص ي�"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "امللك الصغير ــ كالم اهلل",
        printedHead: "كالم اهلل",
        bookFrom: 65,
        concepts: [
          concept(65, "يا ملكًا �صالحًا. ص ّح كيف كان يو� ص يو�"),
          concept(65, "ريعة. ص فر ال� ص إلى العثور على � ا أدت ا رد األأحداث التي ص ي�"),
          concept(65, "أهمية قراءة كلمة اهلل في حياته. ا يدلّل على"),
          concept(65, "إلى اهلل. ا يعبّر عن تقديره لدور التوبة في العودة"),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "زواج إسحاق ) ٣ حياة إبراهيم (",
        printedHead: "زواج إسحاق",
        bookFrom: 69,
        concepts: [
          concept(69, "إبراهيم. ا حاق بن ص إ� ا أحداث زواج ا أهم ا رد ص ي�"),
          concept(69, "أن اهلل يقودنا في اختياراتنا. ا تنبط ص ي�"),
          concept(69, "اد اهلل. ص إر� ا أهمية ال�صالة وطلب ا رح ص ي�"),
          concept(69, "أمين في وعوده معنا. ا أن اهلل ا ح ص رد موقف حياتي يو� ص ي�"),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "القديسة فيرينا - صاحبة الفالية الفرعونية",
        printedHead: "القديسة فيرينا",
        bookFrom: 75,
        concepts: [
          concept(75, "ة فيرينا. ص ة لق�صة القدي� ص يتعرّف األأحداث الرئي�"),
          concept(75, "آخرين وخدمتهم. أل أهمية محبة ا ا رح ص ي�"),
          concept(75, "خ�صية. ص أهمية النظافة ال� ا يتعلّم"),
          concept(75, "را. ص وي� ص ة فيرينا على � ص ل القدّي� ص يقدّر ف�"),
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: TYPE,
        title: "الشكر - شفاء عشرة رجال برص",
        printedHead: "شفاء عشرة رجال برص",
        bookFrom: 79,
        concepts: [
          concept(79, "وع. ص فاهم الرب ي� ص يذكر عدد الرجال الذين �"),
          concept(79, ". وع ص رة ألأمر الرب ي� ص تجاب الرجال الع� ص ّح كيف ا� ص يو�"),
          concept(79, "امري. ص عة رجال وموقف ال� ص يميّز بين موقف الت�"),
          concept(79, "وع ورحمته تجاه الجميع دون تمييز. ص يعبّر عن محبة الرب ي�"),
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
  const unit = EGYPT_CHRISTIAN_G2_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_CHRISTIAN_G2_T1_UNITS.forEach((unit, ui) => {
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
  "christian-g2-t1",
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
 * its folio as the very first line of every content page («6»، «10»، …
 * «87»)، so the first non-empty line is read and accepted only when it is a
 * bare number. Verified mechanically to leave every term page outside the
 * three opener exceptions yielding exactly its own single number.
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
 * which is what fixes the offset; the pages named in `FOLIO_EXCEPTION_MARKERS`
 * are handled separately instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The three term pages exempt from the folio check, each with the marker
 * the check accepts in place of a page number: books 5 and 30 and 57 are the
 * unit openers («الوحدة الأولى/الثانية/الثالثة» pages) — all three list their
 * unit's lessons and print no folio by design.
 */
const FOLIO_EXCEPTION_MARKERS: Readonly<Record<number, string>> = {
  5: "الوحدة األولى",
  30: "الوحدة الثانية",
  57: "الوحدة الثالثة",
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
  const units = EGYPT_CHRISTIAN_G2_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_CHRISTIAN_G2_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_CHRISTIAN_G2_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_CHRISTIAN_G2_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_CHRISTIAN_G2_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio (the first line), or, on the three pages named in
 *     `FOLIO_EXCEPTION_MARKERS`, from the marker quoted there;
 *  2. every unit's opener prints the unit head and every lesson's first page prints
 *     that lesson's head;
 *  3. every lesson's title and every objective is printed on the pages the
 *     lesson owns (each objective on its own first page);
 *  4. every printed page in [5, 87] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_CHRISTIAN_G2_T1_UNITS;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_CHRISTIAN_G2_T1_BOOK_START || book > EGYPT_CHRISTIAN_G2_T1_BOOK_END) continue;
    const text = loadBookPage(book);
    pagesChecked += 1;
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    printedPages.add(book);

    const marker = FOLIO_EXCEPTION_MARKERS[book];
    if (marker !== undefined) {
      if (!normalize(text).includes(normalize(marker))) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع ولا تطبع المرساة «${marker}»`);
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

  if (printedPages.size !== EGYPT_CHRISTIAN_G2_T1_BOOK_END - EGYPT_CHRISTIAN_G2_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_CHRISTIAN_G2_T1_BOOK_START} و${EGYPT_CHRISTIAN_G2_T1_BOOK_END}`,
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
  for (let p = EGYPT_CHRISTIAN_G2_T1_BOOK_START; p <= EGYPT_CHRISTIAN_G2_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
