// PHASE 112 — official Egypt Primary-3 (Grade 3) Christian Religious Education
// («التربية الدينية المسيحية — الصف الثالث الابتدائي»), first term.
//
// The curriculum tree for the Egypt `eg-g3-christian-education` curriculum is
// rebuilt from the Ministry textbook (90 scanned pages, first term only).
// This module is the single source of truth for the FIRST term: the three
// units of the first term, their printed lessons (exactly as the book's own
// «محتويات الكتاب» on scan 5 lists them) and, for every lesson, the book's
// own printed «أهداف الدرس» — verbatim, as on the lesson's first page
// («أهداف الدرس: بنهاية الدرس، يكون التلميذ قادرًا على أن: …»). The
// self-checks at the bottom prove that mapping against the OCR itself, page by
// page.
//
// THE OFFSET IS +1 — book page N = scan page N + 1
// Every content page prints its own folio as its FIRST line, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here: scan 7
// prints «6» (book 6), scan 11 prints «10» (book 10), scan 23 prints «22»
// (book 22), scan 34 prints «33» (book 33), scan 50 prints «49» (book 49),
// scan 61 prints «60» (book 60), scan 76 prints «75» (book 75), scan 80
// prints «79» (book 79) and scan 87 prints «86» (book 86). The book's own
// «محتويات الكتاب» (scan 5) independently confirms it: it lists the eighteen
// first-term lessons with the very book pages their heads print on (٦، ١٠،
// ١٣، ١٧، ٢٢، ٢٧، ٣٣، ٣٧، ٤٠، ٤٤، ٤٩، ٥٤، ٦٠، ٦٤، ٦٦، ٧٠، ٧٥، ٧٩) — each
// head sits exactly on scan (page + 1).
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–5 are before the term: the cover (1, no text layer), the
// reviewer masthead (2), a blank page (3), the «المقدمة» (4) and the printed
// «محتويات الكتاب» (5). Scan pages 88–90 are after the term: a «مذكــرات»
// notes page (88), the technical-specs table (89, naming «الصف الثالث
// الابتدائي» and «الفصل الدراسي الأول»، «2026 م / 2025») and the blank back
// cover (90). This scan holds the first term only — there is no second-term
// content. The term runs from the unit 1 opener (book 5 = scan 6) to the
// third term-exam page (book 86 = scan 87): `EGYPT_CHRISTIAN_G3_T1_BOOK_START`
// / `_END` are exactly those two pages, and the tiling assertion proves
// nothing in between is left unreachable. `pagesChecked` therefore equals
// 86 − 5 + 1 = 82.
//
// SIX TERM PAGES NEED A DOCUMENTED FOLIO EXCEPTION
// Three of them are the unit openers (books 5، 32، 59): by the book's own
// design each opener lists its unit's six lessons and prints no folio at all.
// The other three (books 7، 50، 51) do print a folio as their first line, but
// the OCR attached a stray vowel mark to the digits («7 ِ»، «50 َ»، «51 ٍ»),
// so the bare-number test in `footerCandidates` cannot read it. Rather than
// loosen that test, all six are exempt from it and anchored on a marker that
// survives verbatim on the page, named in `FOLIO_LESS_ANCHORS`.
// `FOOTER_OCR_MISREADS` stays empty: no folio was read as a *different*
// number, and every other term page yields exactly its own single number.
//
// THE FOLIO CHECK READS THE FIRST LINE, NOT THE FOOT
// Unlike the G10 book (folio in the running foot), this book prints its folio
// as the very first line of every content page. `footerCandidates` therefore
// reads the first non-empty line and accepts it only when it is a bare
// number; verified mechanically so every other term page yields exactly its
// own single number.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED «أهداف الدرس»
// Every first-term lesson prints four «بنهاية الدرس، يكون التلميذ قادرًا على
// أن» items. On nearly every lesson they sit at the head of its first page; on
// lesson 3-2 the four sit at the foot of book 64 as «•» bullets. Each item is
// carried, byte-verbatim (including the text layer's own quirks quoted below),
// as a concept of that lesson with `bookFrom` set to the lesson's first page.
// Nothing is invented. The layer quirks kept honest rather than reconstructed:
// the body pages print «اهلل» for «الله»; the lam-alef ligature comes back
// decomposed («واملجوس»، «باهلل»، «األسود»، «األمراض»، «املقدسة»، «املحبة»،
// «املوت»، «املسيح»); two title lines are stored in visual RTL order with
// mirrored parens (lessons 1-4 and 3-4, kept as stored); and where the layer
// splits the ligature into «ل ا» that spacing is kept too. `normalize` folds
// diacritics, spacing and the alef/ya/ta variants on both sides, so none of
// these quirks can break a match.
//
// LESSON SLOTS REPEAT EVERY UNIT
// Each unit holds the same six component slots in order: العقيدة (الدرس
// الأول)، المحفوظات (الدرس الثاني)، العبادة (الدرس الثالث)، شخصيات كتابية
// (الدرس الرابع)، شخصيات تاريخية (الدرس الخامس)، القيم والأخلاق (الدرس
// السادس). The «مراجعة على الوحدة» and «مشروع جماعي» pages (books 31، 58،
// 83) and the three «اختبارات على الفصل الدراسي الأول» pages (books 84–86)
// are not lessons — the contents lists them with • bullets — and stay inside
// the owning unit's last lesson range, exactly as the G10 spec keeps its exam
// pages inside its last lesson.
//
// FOUR LESSON TITLES FOLLOW THEIR OWN FIRST PAGE, NOT THE CONTENTS LINE
// The «محتويات الكتاب» lists lesson 1-4 as «حياة يوسف الصّديق (1) -
// (الطفولة)» but its head on book 17 stores the visual-order «) - (الطفولة) 1
// حياة يوسف الصّديق (»; lesson 1-5 as «الرعاة والمجوس» but its head on book
// 22 stores «الرعاة واملجوس»; lesson 3-5 as «القديس باخوميوس - الجندي الذي
// أحب المسيح» but its head on book 75 stores «الجندي الذي أحب املسيح»; and
// lesson 3-4 as «حياة يوسف الصّديق (3) - (في قصر فرعون)» but its head on book
// 70 stores the visual-order «فرعون) قصر (في - )3( الصّديق يوسف حياة»). Each
// lesson carries the stored form its own page prints, which is what the
// title-in-range check proves.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 1 (verified: book p.86 = scan p.87). */
export const BOOK_TO_PDF_OFFSET = 1;

/** Scans absent from the corpus. All 90 scans are present, so this is empty. */
export const MISSING_SCANS: readonly number[] = [];

/** First printed page of the term — the unit 1 opener (scan 6). */
export const EGYPT_CHRISTIAN_G3_T1_BOOK_START = 5;

/** Last printed page of the term — the third term-exam page (scan 87). */
export const EGYPT_CHRISTIAN_G3_T1_BOOK_END = 86;

/** The scanned pages before the term: cover, reviewers, blank, مقدمة and محتويات. */
export const EGYPT_CHRISTIAN_G3_T1_FRONT_MATTER = { from: 1, to: 5 } as const;

/** The scanned pages after the term: the مذكرات page, the specs table and the back cover. */
export const EGYPT_CHRISTIAN_G3_T1_BACK_MATTER = { from: 88, to: 90 } as const;

/** One printed objective of a lesson — becomes one concept in the app tree. */
export interface ChristianG3T1Concept {
  /** Printed book page where this objective starts (the lesson's first page). */
  bookFrom: number;
  /** The printed component kind: «هدف». */
  kind: string;
  /** The printed objective, verbatim. */
  title: string;
}

/** One lesson («درس») of the first term, as the «محتويات الكتاب» lists it. */
export interface ChristianG3T1Lesson {
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
  concepts: ChristianG3T1Concept[];
}

/** One printed section of the book — one of the three units of the first term. */
export interface ChristianG3T1Section {
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
  lessons: ChristianG3T1Lesson[];
}

const TYPE = "هدف";

function concept(bookFrom: number, title: string): ChristianG3T1Concept {
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
 * quirks («اهلل» for «الله», decomposed lam-alef forms such as «واملجوس»,
 * «األمراض» and «املحبة», and the two title lines kept in visual RTL order
 * with mirrored parens) quoted in the header comment.
 */
export const EGYPT_CHRISTIAN_G3_T1_UNITS: ChristianG3T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: تدبير الله لنا",
    printedHead: "الوحدة األولى",
    bookFrom: 5,
    bookTo: 31,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "آدم وحواء",
        printedHead: "آدم وحواء",
        bookFrom: 6,
        concepts: [
          concept(6, "يحدد ما يميز آدم وحواء عن باقي المخلوقات."),
          concept(6, "يستنتج أن الطاعة لله مهمة وتجعلنا سعداء."),
          concept(6, "يؤيد أن الخطيّة تفصلنا عن الله."),
          concept(6, "يذكر وعد الله لآدم بمجيء مخلِّص العالم."),
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
          concept(10, "يدلِّل على محبة الله للإنسان."),
          concept(10, "يردد بفهم الآيات الذهبية ويتأمل في معانيها."),
          concept(10, "يذكر آية عن السلام وأخرى عن محبة الله للبشرية."),
          concept(10, "يعبِّر عن حماية الله لنا."),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "التناول - خميس العهد",
        printedHead: "التناول - خميس العهد",
        bookFrom: 13,
        concepts: [
          concept(13, "يسرد أحداث العشاء الأخير، في خميس العهد."),
          concept(13, "يشرح معنى العهد الجديد بين الله والإنسان، من خلال التناول."),
          concept(13, "يعبر عن شكره للرب يسوع الذي قدَّم جسده ودمه؛ من أجل مغفرة خطايانا."),
          concept(13, "يمارس التناول في كنيسته بانتظام."),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: ") - (الطفولة) 1 حياة يوسف الصّديق (",
        printedHead: "حياة يوسف الصّديق",
        bookFrom: 17,
        concepts: [
          concept(17, "يدلل على أن يوسف كان محبوبًا من والده."),
          concept(17, "يذكر الحلمين اللذين رآهما يوسف."),
          concept(17, "يشرح خطة الله لحياة يوسف منذ طفولته."),
          concept(17, "يُعبر عن محبته لجميع أفراد أسرته."),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "الرعاة واملجوس",
        printedHead: "الرعاة واملجوس",
        bookFrom: 22,
        concepts: [
          concept(22, "يستنتج أن الطفل يسوع وُلد في مزود بسيط؛ ليعلّمنا التواضع."),
          concept(22, "يصف مشاعر فرح الرعاة والمجوس بميلاد الطفل يسوع."),
          concept(22, "يردد بفرح وفهم بشارة الملائكة للرعاة."),
          concept(22, "يصف رد فعل مريم وكيف حفظت الأمور في قلبها."),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: TYPE,
        title: "الثقة باهلل - دانيال في جب األسود",
        printedHead: "الثقة باهلل - دانيال في جب األسود",
        bookFrom: 27,
        concepts: [
          concept(27, "يتعرف الأحداث الرئيسة في قصة دانيال النبي."),
          concept(27, "يستنبط قوة الله وحمايته لأولاده."),
          concept(27, "يربط بين أهمية الصلاة اليومية والتواصل مع الله."),
          concept(27, "يثق بالله في كل وقت وخاصة الظروف الصعبة."),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: الرب يسوع على أرضنا",
    printedHead: "الوحدة الثانية",
    bookFrom: 32,
    bookTo: 58,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "سلطان الرب يسوع على األمراض - شفاء مريض بيت حسدا",
        printedHead: "سلطان الرب يسوع على األمراض - شفاء مريض بيت حسدا",
        bookFrom: 33,
        concepts: [
          concept(33, "يسرد أحداث معجزة مريض بِركة بيت حسدا."),
          concept(33, "يتعرف أن الرب يسوع هو الطبيب الشافي."),
          concept(33, "يستنتج أن المريض شُفي بكلمة من الرب يسوع."),
          concept(33, "يطلب معونة الله وقت الشدة وخاصة في المرض."),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "بعض اآليات الذهبية",
        printedHead: "بعض اآليات الذهبية",
        bookFrom: 37,
        concepts: [
          concept(37, "يستنتج قدرة يسوع على شفاء المرضى وإحداث تغيير في حياتهم."),
          concept(37, "يعبر عن أهمية الأمانة والالتزام حتى في الظروف الصعبة."),
          concept(37, "يطبق المحبة الحقيقية غير الأنانية."),
          concept(37, "يردد بفهم الآيات الذهبية بالدرس."),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الصوم - دانيال والفتية الثالثة",
        printedHead: "الصوم - دانيال والفتية الثالثة",
        bookFrom: 40,
        concepts: [
          concept(40, "يتعرف أحداث قصة دانيال وأصدقائه الثلاثة في قصر الملك."),
          concept(40, "يعبر عن أهمية الطاعة لوصايا الله حتى لو كانت صعبة."),
          concept(40, "يقتدي بدانيال وأصدقائه في الثبات على الحق."),
          concept(40, "يتدرب على الصوم والامتناع عن بعض الأشياء ."),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "حياة يوسف الصّديق (2) - (في السجن)",
        printedHead: "حياة يوسف الصّديق (2) - (في السجن)",
        bookFrom: 44,
        concepts: [
          concept(44, "يتعرف أن الله كان مع يوسف في كل ظروفه."),
          concept(44, "يعبر عن أهمية الأمانة والطهارة حتى لو واجه صعوبات."),
          concept(44, "يلخص أحداث حياة يوسف بدءا من دخوله السجن حتى اصبح مديرا على أرض مصر."),
          concept(44, "يقتدي بشجاعة يوسف في مقاومة الخطية والتمسك بالحق."),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "العائلة املقدسة في مصر",
        printedHead: "العائلة املقدسة في مصر",
        bookFrom: 49,
        concepts: [
          concept(49, "يتعرف الأماكن التي باركتها العائلة المقدسة في مصر."),
          concept(49, "يذكر أن مصر بلد مبارك زاره الرب يسوع بنفسه."),
          concept(49, "يربط بين آيات الكتاب المقدس وأحداث حدثت في مصر."),
          concept(49, "يفتخر بأن أرضه احتضنت العائلة المقدسة."),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: TYPE,
        title: "املحبة - عنقود العنب",
        printedHead: "املحبة - عنقود العنب",
        bookFrom: 54,
        concepts: [
          concept(54, "يشرح معنى المحبة كما علّمنا الرب يسوع."),
          concept(54, "يقدّر أهمية العطاء والتفكير في الغير."),
          concept(54, "يستنتج الدروس المستفادة من قصة (عنقود العنب)."),
          concept(54, "يسرد موقف حياتي يدلل على التصرف بمحبة مع الآخرين."),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: المحبة والعطاء",
    printedHead: "الوحدة الثالثة",
    bookFrom: 59,
    bookTo: 86,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "سلطان الرب يسوع على املوت",
        printedHead: "سلطان الرب يسوع على املوت",
        bookFrom: 60,
        concepts: [
          concept(60, "يتعرف أحداث معجزة « إقامة ابن أرملة نايين »."),
          concept(60, "يدلل على أن الرب يسوع له سلطان على الموت."),
          concept(60, "يعبر عن ثقته بأن الرب يسوع يغيّر الحزن إلى فرح."),
          concept(60, "يسرد موقف يوضح مشاركته آلام الآخرين وأحزانهم."),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "بعض اآليات الذهبية",
        printedHead: "بعض اآليات الذهبية",
        bookFrom: 64,
        concepts: [
          concept(64, "يذكر مفردات كلمات الآيات الذهبية."),
          concept(64, "يردد بفهم الآيات الذهبية."),
          concept(64, "يحدد ما يجب فعله تجاه الصديق والعدو."),
          concept(64, "يعبر عن تحنن الرب يسوع."),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "محبة اهلل والقريب - السامري الصالح",
        printedHead: "محبة اهلل والقريب - السامري الصالح",
        bookFrom: 66,
        concepts: [
          concept(66, "يتعرف الأشخاص والأحداث الرئيسة في قصة السامري الصالح ."),
          concept(66, "يعبر عن معنى الرحمة الحقيقية تجاه الآخرين."),
          concept(66, "يثمن موقف السامري الصالح تجاه عدوه."),
          concept(66, "يخطط لنشاط يُظهر الرحمة تجاه الآخرين دون تمييز."),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "فرعون) قصر (في - )3( الصّديق يوسف حياة",
        printedHead: "فرعون) قصر (في - )3( الصّديق يوسف حياة",
        bookFrom: 70,
        concepts: [
          concept(70, "يذكر كيف أصبح يوسف حاكمًا في مصر."),
          concept(70, "يقيم تصرف يوسف تجاه إخوته الذين ظلموه."),
          concept(70, "يدلل على أن كل الأشياء تعمل معًا للخير للذين يحبون الله."),
          concept(70, "يعبر عن مشاعره تجاه موقف يوسف مع إخوته."),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "القديس باخوميوس - الجندي الذي أحب املسيح",
        printedHead: "القديس باخوميوس - الجندي الذي أحب املسيح",
        bookFrom: 75,
        concepts: [
          concept(75, "يتعرّف سيرة القديس باخوميوس ومكان ولادته ونشأته."),
          concept(75, "يستنتج كيف أثّرت المحبة المسيحية في قلب باخوميوس."),
          concept(75, "يؤيد سلوك المحبة والعطاء دون انتظار مقابل."),
          concept(75, "يطبّق مبدأ «أحب الجميع» في مواقف حياته اليومية."),
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: TYPE,
        title: "الصداقة - داود ويوناثان",
        printedHead: "الصداقة - داود ويوناثان",
        bookFrom: 79,
        concepts: [
          concept(79, "يميز بين الغيرة والمحبة في العلاقات الإنسانية."),
          concept(79, "يتعرف أحداث قصة صداقة داود ويوناثان."),
          concept(79, "يقتدي بيوناثان في مساعدة أصدقائه وقت الضيق."),
          concept(79, "يعبر عن قيمة الصداقة الحقيقية المبنية على المحبة والوفاء في كل وقت."),
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
  const unit = EGYPT_CHRISTIAN_G3_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_CHRISTIAN_G3_T1_UNITS.forEach((unit, ui) => {
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
  "christian-g3-t1",
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
 * its folio as the very first line of every content page («6»، «10»، …
 * «86»)، so the first non-empty line is read and accepted only when it is a
 * bare number. Verified mechanically to leave every term page outside the
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
 * The content pages whose printed header the OCR misread as a *different*
 * number, and the value it printed instead — measured, not guessed. This book
 * has none: every parseable header matches its page number exactly, and the
 * six pages that carry no parseable number at all live in `FOLIO_LESS_ANCHORS`.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no parseable folio in the OCR, each with a printed
 * string the check accepts in its place. Books 5/32/59 are the three unit
 * openers («الوحدة األولى/الثانية/الثالثة»); they list their unit's lessons and
 * print no folio by design. Books 7/50/51 do print their folio, but the layer
 * attached a stray vowel mark to it («7 ِ»، «50 َ»، «51 ٍ»), so the bare-number
 * test cannot read it; each is anchored to the first line it actually prints.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  5: "الوحدة األولى",
  7: "قال الله لآدم",
  32: "الوحدة الثانية",
  50: "أنا روماني، من المطرية",
  51: "اسمي إيمانويل، من المعادي",
  59: "الوحدة الثالثة",
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
  const units = EGYPT_CHRISTIAN_G3_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_CHRISTIAN_G3_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_CHRISTIAN_G3_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_CHRISTIAN_G3_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_CHRISTIAN_G3_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio (the first line), or, on the six pages named in
 *     `FOLIO_LESS_ANCHORS`, from the printed string quoted there;
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
  const units = EGYPT_CHRISTIAN_G3_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_CHRISTIAN_G3_T1_BOOK_START || book > EGYPT_CHRISTIAN_G3_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_CHRISTIAN_G3_T1_BOOK_END - EGYPT_CHRISTIAN_G3_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_CHRISTIAN_G3_T1_BOOK_START} و${EGYPT_CHRISTIAN_G3_T1_BOOK_END}`,
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
  for (let p = EGYPT_CHRISTIAN_G3_T1_BOOK_START; p <= EGYPT_CHRISTIAN_G3_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
