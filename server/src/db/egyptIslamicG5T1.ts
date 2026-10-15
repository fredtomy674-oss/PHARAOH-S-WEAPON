// Egyptian Ministry Grade-5 Islamic Religious Education
// («التربية الدينية الإسلامية — الصف الخامس الابتدائي»), first term.
//
// The curriculum tree for the Egypt `eg-g5-islamic-education` curriculum is
// rebuilt from the Ministry textbook (96 scanned pages, first term only).
// This module is the single source of truth for the FIRST term: the three
// printed units of the first term (الْإِيمَانُ وَالسَّلَامُ، طَرِيقُ الْإِيمَانِ،
// الدِّينُ وَالتَّوَاضُعُ), every printed lesson inside them (exactly as the
// book's own contents on scans 4–5 lists them, with each unit's السير slot
// split into its two printed biography lessons) and, for every lesson, the
// book's own printed «الأهداف» — verbatim, as on the lesson's first page
// («في نهاية هذا الدرس يتوقع من التلميذ أن: …»). The self-checks at the
// bottom prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS +0 — book page N = scan page N + 0
// Every content page that carries a folio prints it as a bare numeral on its
// last line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted
// here: scan 7 prints «٧» (book 7), scan 11 prints «١١» (book 11), scan 20
// prints «٢٠» (book 20), scan 39 prints «٣٩» (book 39), scan 64 prints «64»
// (book 64, Western digits), scan 93 prints «٩٣» (book 93) and scan 95 prints
// «٩٥» (book 95). The folios form one unbroken scan − 0 sequence across the
// whole term, which is what fixes the offset — not the contents numbers.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–5 are before the term: the authorship credits (1), the
// «مُقَدِّمَةٌ» (2–3) and the two contents pages (4–5). Scan page 96 is after
// the term: the publisher data page (which states the book has 96 pages).
// The term runs from the unit 1 opener (book 6 = scan 6) to the second
// final-assessment page (book 95 = scan 95): `EGYPT_ISLAMIC_G5_T1_BOOK_START`
// / `_BOOK_END` are exactly those two pages, and the tiling assertion proves
// nothing in between is left unreachable. `pagesChecked` therefore equals
// 95 − 6 + 1 = 90.
//
// NINE TERM PAGES NEED A DOCUMENTED FOLIO EXCEPTION
// The three unit openers (books 6، 38، 68) list their unit's lessons and
// objectives and print no folio by design (the last line is a unit
// objective). The surah-text page (book 12), the hadith-close page (book 8),
// the tajweed-table page (book 17: الإقلاب table), the neighbour-rights body
// page (book 33), the Zayd-ibn-Thabit continuation (book 59) and the
// fasting-manners body page (book 79) carry no bare folio in the OCR.
// Rather than weaken the page-number check, these nine are exempt from it
// and anchored on a string the page itself prints, named in
// `FOLIO_LESS_ANCHORS`. Every other term page's last line is its own bare
// folio, verified mechanically, so `FOOTER_OCR_MISREADS` is empty. (Book 64
// prints its folio in Western digits «64», which the folio reader accepts.)
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED «الأهداف»
// Every teaching lesson prints a bulleted «الأهداف» list on its first page.
// Each item is carried verbatim as a concept of that lesson (kind «هدف»),
// with `bookFrom` set to the lesson's first page — exactly as the Islamic
// G3/G4 siblings do. Two lists keep the text layer's own quirks honest
// rather than reconstructed: lessons 1-5 and 2-4 print «.» instead of «•»,
// and lesson 1-5 keeps the book's undiacritized wording.
//
// THE MAKHARIJ LESSON IS A LESSON; THE NUN-SAKINAH PAGES ARE NOT
// The contents (scans 4–5) lists «أَحْكَامُ النُّونِ السَّاكِنَةِ وَالتَّنْوِينِ»
// at ١٦ and «مَخَارِجُ الْحُرُوفِ» at ٤٨. Only the second prints an
// «الأهداف» block on its first page (book 48), so only it is a teaching
// lesson (2-3, books 48–50) — neither unit opener's «دُرُوسُ الوَحْدَةِ»
// names it, but the printed objectives decide, exactly as the Islamic G4
// spec treats its review-shaped teaching lesson. The أحكام النون pages
// (books 16–19: الإظهار through الإخفاء plus their أنشطة on book 19) print
// no «الأهداف» at all, so they stay inside lesson 1-2's range (books
// 11–19), which the tiling check proves.
//
// REVIEWS RIDE WITH THE LAST LESSON
// The «مُرَاجَعَةٌ عَلَى الْوَحْدَةِ» pages (books 37، 66–67، 93) and the
// «تَقْيِيمَاتٌ (التَّقْيِيمُ النِّهَائِيُّ)» pages (books 94–95) print
// exercises but no «الأهداف», so they are not lessons — the contents lists
// them with • bullets — and stay inside the owning unit's last lesson
// range, exactly as the Islamic G3/G4 specs keep their review and exam
// pages inside their last lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 0 (verified: book p.95 = scan p.95). */
export const BOOK_TO_PDF_OFFSET = 0;

/** Scans absent from the corpus. All 96 scans are present, so this is empty. */
export const MISSING_SCANS: readonly number[] = [];

/** First printed page of the term — the unit 1 opener (scan 6). */
export const EGYPT_ISLAMIC_G5_T1_BOOK_START = 6;

/** Last printed page of the term — the second final-assessment page (scan 95). */
export const EGYPT_ISLAMIC_G5_T1_BOOK_END = 95;

/** The scanned pages before the term: credits, مقدمة and contents. */
export const EGYPT_ISLAMIC_G5_T1_FRONT_MATTER = { from: 1, to: 5 } as const;

/** The scanned pages after the term: the publisher data page. */
export const EGYPT_ISLAMIC_G5_T1_BACK_MATTER = { from: 96, to: 96 } as const;

/** One printed objective of a lesson — becomes one concept in the app tree. */
export interface IslamicG5T1Concept {
  /** Printed book page where this objective starts (the lesson's first page). */
  bookFrom: number;
  /** The printed component kind: «هدف». */
  kind: string;
  /** The printed objective, verbatim. */
  title: string;
}

/** One lesson of the first term, as the contents lists it. */
export interface IslamicG5T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Positional Arabic ordinal, e.g. "الثالث" (the book numbers no lessons). */
  ordinal: string;
  /** The lesson's opening component type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson. */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed «الأهداف» for this lesson, in order. */
  concepts: IslamicG5T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book prints no
   * appendix: every page of the term belongs to a unit. Kept so the module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — one of the three units of the first term. */
export interface IslamicG5T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"3". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: الْإِيمَانُ وَالسَّلَامُ". */
  title: string;
  /** The unit head the opener page prints, e.g. "الْوَحْدَةُ الْأُولَى". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: IslamicG5T1Lesson[];
}

const TYPE = "هدف";

function concept(bookFrom: number, title: string): IslamicG5T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The three units of the first term with their printed lessons and every
 * printed «الأهداف» item, transcribed from the first page of each lesson
 * and checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Lesson starts come from the book's contents (scans 4–5); each lesson's
 * concepts are the bulleted objectives the book prints on the page the
 * lesson starts on, kept verbatim.
 */
export const EGYPT_ISLAMIC_G5_T1_UNITS: IslamicG5T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: الْإِيمَانُ وَالسَّلَامُ",
    printedHead: "الْوَحْدَةُ الْأُولَى",
    bookFrom: 6,
    bookTo: 37,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الْإِيمَانُ بِالْكُتُبِ السَّمَاوِيَّةِ",
        printedHead: "الْإِيمَانُ بِالْكُتُبِ السَّمَاوِيَّةِ",
        bookFrom: 7,
        concepts: [
          concept(7, "يعدد الكتب السماوية المذكورة في القرآن الكريم."),
          concept(7, "يُظهر إيماناً بالكتب السماوية المذكورة في القرآن الكريم."),
          concept(7, "يُميز بين الكتب السماوية السابقة والقرآن الكريم."),
          concept(7, "يستشعر أثر الإيمان بالكتب السماوية على سلوكه."),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "سُورَةُ الْإِنْسَانِ",
        printedHead: "سُورَةُ الْإِنْسَانِ",
        bookFrom: 11,
        concepts: [
          concept(11, "يَتْلُوَ سُورَةَ الْإِنْسَانِ تِلَاوَةً صَحِيحَةً مُرَاعِيًا أَحْكَامَ التِّلَاوَةِ."),
          concept(11, "يَتَعَرَّفَ مَعَانِيَ الْمُفْرَدَاتِ الْوَارِدَةِ فِي السُّورَةِ."),
          concept(11, "يَسْتَخْلِصَ الدُّرُوسَ وَالْعِبَرَ الْمُسْتَفَادَةَ مِنَ السُّورَةِ."),
          concept(11, "يُطَبِّقَ قِيمَةَ الْإِحْسَانِ فِي مَوَاقِفِ حَيَاتِهِ."),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "رَمَضَانُ شَهْرُ الصِّيَامِ",
        printedHead: "رَمَضَانُ شَهْرُ الصِّيَامِ",
        bookFrom: 20,
        concepts: [
          concept(20, "يتعرَّف قيمة شهر رمضان، مبيناً مكانته في الإسلام."),
          concept(20, "يُعدِّد فضائل شهر رمضان وخصائصه."),
          concept(20, "يُدلِّل على فضائل شهر رمضان من القرآن الكريم والسنة النبوية المطهرة."),
          concept(20, "يتعرَّف الأعمال الصالحة المرتبطة بشهر رمضان."),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "صُلْحُ الْحُدَيْبِيَةِ",
        printedHead: "صُلْحُ الْحُدَيْبِيَةِ",
        bookFrom: 24,
        concepts: [
          concept(24, "يتعرَّف أحداث صلح الحديبية، وأسباب وقوعه."),
          concept(24, "يُوضِّح بنود الصلح، وأثرها على المسلمين."),
          concept(24, "يستنتج الحكمة من صلح الحديبية."),
          concept(24, "يستخلص الدروس والعبر من موقف النَّبي ﷺ وأصحابه في الصُّلْح."),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "أَبُو ذَرٍّ الْغِفَارِيُّ رَضِيَ اللهُ عَنْهُ",
        printedHead: "أَبُو ذَرٍّ الْغِفَارِيُّ",
        bookFrom: 28,
        concepts: [
          concept(28, "يتعرَّف سيرة الصحابي الجليل أبي ذر الغفاري رضي الله عنه."),
          concept(28, "يُظهر وعيًا لدور الصحابي الجليل أبي ذر الغفاري رضي الله عنه في نشر الإسلام."),
          concept(28, "يستنتج الصفات المميزة لأبي ذر الغفاري رضي الله عنه."),
          concept(28, "يستخلص الدروس والعبر من مواقفه وسيرته."),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: TYPE,
        title: "حَقُّ الْجَارِ",
        printedHead: "حَقُّ الْجَارِ",
        bookFrom: 32,
        concepts: [
          concept(32, "يتعرّف مفهوم الجار، وأهمية الجوار في الإسلام."),
          concept(32, "يُدلّل على حقوق الجار بما ورد في القرآن الكريم والسنة النبوية."),
          concept(32, "يُظهر وعيًا بأثر الإحسان إلى الجار في بناء مجتمع متماسك."),
          concept(32, "يؤدي حقوق الجار عليه في حياته اليومية."),
          concept(32, "يشارك في أنشطة تفاعلية تعزّز استيعاب القيم الإسلامية."),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: طَرِيقُ الْإِيمَانِ",
    printedHead: "الوحدة الثانية",
    bookFrom: 38,
    bookTo: 67,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الْقُرْآنُ الْكَرِيمُ (آخِرُ الْكُتُبِ السَّمَاوِيَّةِ)",
        printedHead: "الْقُرْآنُ الْكَرِيمُ",
        bookFrom: 39,
        concepts: [
          concept(39, "يتعرّف الحكمة من إنزال الكتب السماوية عامة والقرآن الكريم خاصة."),
          concept(39, "يستنتج خصائص القرآن الكريم التي تُميزه عن غيره من الكتب السماوية."),
          concept(39, "يشارك في أنشطة تفاعلية تعزز وعيه بقيمة القرآن الكريم."),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "سُورَةُ الْقِيَامَةِ",
        printedHead: "سُورَةُ الْقِيَامَةِ",
        bookFrom: 43,
        concepts: [
          concept(43, "يَتْلُوَ سُورَةَ الْقِيَامَةِ تِلَاوَةً صَحِيحَةً مُطَبِّقًا أَحْكَامَ التَّجْوِيدِ."),
          concept(43, "يَتَعَرَّفَ مَعَانِيَ الْمُفْرَدَاتِ الْوَارِدَةِ فِي السُّورَةِ."),
          concept(43, "يَسْتَنْتِجَ الدُّرُوسَ وَالْعِبَرَ الْمُسْتَفَادَةَ مِنَ السُّورَةِ."),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "مَخَارِجُ الْحُرُوفِ",
        printedHead: "مَخَارِجُ الْحُرُوفِ",
        bookFrom: 48,
        concepts: [
          concept(48, "يتعرّف معنى مخارج الحروف."),
          concept(48, "يستنتج أهمية معرفة مخارج الحروف."),
          concept(48, "يطبّق ما درسه عن مخارج الحروف في أثناء التلاوة."),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "مَعْنَى الصَّوْمِ",
        printedHead: "مَعْنَى الصَّوْمِ",
        bookFrom: 51,
        concepts: [
          concept(51, "يتعرّف مفهوم الصوم."),
          concept(51, "يستنتج الحكمة من فرض الصوم على المسلمين."),
          concept(51, "يتعرّف شروط وأركان الصوم."),
          concept(51, "يستنتج فضائل الصوم وآثاره الروحية والاجتماعية."),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "رَسَائِلُ النَّبِيِّ ﷺ إِلَى الْمُلُوكِ",
        printedHead: "رَسَائِلُ النَّبِيِّ ﷺ إِلَى الْمُلُوكِ",
        bookFrom: 55,
        concepts: [
          concept(55, "يتعرّف الحكمة من إرسال النبي ﷺ الرُّسل إلى الملوك."),
          concept(55, "يتعرّف كيفية انتشار رسالة الإسلام خارج الجزيرة العربية."),
          concept(55, "يستنتج صفات النبي ﷺ في الدعوة إلى الله (تعالى) بالحكمة والموعظة الحسنة."),
          concept(55, "يقارن بين ردود أفعال الملوك المختلفة تجاه رسائل النبي ﷺ."),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: TYPE,
        title: "زَيْدُ بْنُ ثَابِتٍ رَضِيَ اللهُ عَنْهُ",
        printedHead: "زَيْدُ بْنُ ثَابِتٍ",
        bookFrom: 58,
        concepts: [
          concept(58, "يتعرّف شخصية زيد بن ثابت رضي الله عنه ودوره في الإسلام."),
          concept(58, "يُظهر وعيًا بأهمية العلم في حياة الصحابي زيد بن ثابت رضي الله عنه، ودوره في جمع القرآن الكريم."),
          concept(58, "يستنتج الصفات التي تميز بها زيد بن ثابت."),
          concept(58, "يتعرّف دور العلماء في خدمة الإسلام."),
        ],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        type: TYPE,
        title: "طَلَبُ الْعِلْمِ",
        printedHead: "طَلَبُ الْعِلْمِ",
        bookFrom: 62,
        concepts: [
          concept(62, "يتعرّف مكانة العلم في الإسلام وأهميته في حياة المسلم."),
          concept(62, "يدلل على تشجيع القرآن الكريم والسنة النبوية على طلب العلم."),
          concept(62, "يستنتج فوائد طلب العلم للفرد والمجتمع."),
          concept(62, "يطبّق سلوكيات طلب العلم في حياته اليومية."),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الدِّينُ وَالتَّوَاضُعُ",
    printedHead: "الْوَحْدَةُ الثَّالِثَةُ",
    bookFrom: 68,
    bookTo: 95,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "نُزُولُ الْقُرْآنِ الْكَرِيمِ",
        printedHead: "نُزُولُ الْقُرْآنِ الْكَرِيمِ",
        bookFrom: 69,
        concepts: [
          concept(69, "يتعرّف مفهوم نزول القرآن الكريم وسبب نزوله."),
          concept(69, "يحدّد مراحل نزول القرآن الكريم."),
          concept(69, "يتعرّف كيفية نزول الوحي على النبي ﷺ."),
          concept(69, "يستنتج الحكمة من نزول القرآن الكريم مُفَرَّقًا."),
          concept(69, "يُظهر تقديره لنعمة القرآن الكريم، وضرورة التمسك بتعاليمه."),
          concept(69, "يشارك في أنشطة ترسّخ وعيه بأثر القرآن الكريم على حياة المسلمين."),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "سُورَةُ الْمُدَّثِّرِ",
        printedHead: "سُورَةُ الْمُدَّثِّرِ",
        bookFrom: 73,
        concepts: [
          concept(73, "يتلو سورة المدثر تلاوة صحيحة، مع مراعاة أحكام التجويد."),
          concept(73, "يرتل سورة المدثر من الذاكرة."),
          concept(73, "يتعرَّف المفردات الواردة في السورة."),
          concept(73, "يستنتج العِبَر والدروس المستفادة من الآيات."),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "شُرُوطُ الصَّوْمِ وَآدَابُهُ",
        printedHead: "شُرُوطُ الصَّوْمِ وَآدَابُهُ",
        bookFrom: 78,
        concepts: [
          concept(78, "يتعرَّف شروط الصيام."),
          concept(78, "يتعرَّف آداب الصوم والسلوكيات التي ينبغي للمسلم التحلي بها في أثناء الصيام."),
          concept(78, "يُحدد الشروط التي تجعل الصيام صحيحًا."),
          concept(78, "يمارس بعض آداب الصوم في الحياة اليومية."),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "غَزْوَةُ خَيْبَرَ",
        printedHead: "غَزْوَةُ خَيْبَرَ",
        bookFrom: 82,
        concepts: [
          concept(82, "يتعرّف أسباب غزوة خيبر."),
          concept(82, "يصف أحداث الغزوة."),
          concept(82, "يستخلص الدروس والعِبَر المستفادة من الغزوة."),
          concept(82, "يحلّل مواقف الصحابة في الغزوة مبيّنًا دلالتها."),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "سَعْدُ بْنُ أَبِي وَقَّاصٍ رَضِيَ اللهُ عَنْهُ",
        printedHead: "سَعْدُ بْنُ أَبِي وَقَّاصٍ",
        bookFrom: 86,
        concepts: [
          concept(86, "يتعرَّف شخصية الصحابي الجليل سعد بن أبي وقاص رضي الله عنه."),
          concept(86, "يشرح دور سعد بن أبي وقاص رضي الله عنه في نشر الإسلام والفتوحات الإسلامية."),
          concept(86, "يستخلص الدروس والعبر من حياة سعد بن أبي وقاص رضي الله عنه."),
          concept(86, "يُعَبِّر عن اعتزازه بشخصية سعد بن أبي وقاص رضي الله عنه."),
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: TYPE,
        title: "التَّوَاضُعُ خُلُقُ الْمُسْلِمِ",
        printedHead: "التَّوَاضُعُ",
        bookFrom: 89,
        concepts: [
          concept(89, "يتعرف مفهوم التواضع وأهميته في حياة المسلم."),
          concept(89, "يستنتج الدروس والعبر من تواضع النبي ﷺ والصحابة الكرام."),
          concept(89, "يطبق سلوك التواضع في الحياة اليومية."),
          concept(89, "يعبر عن أثر التعامل برفق مع الآخرين."),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the
 * unit — so the unit opener, the unit reviews and (in unit 3) the final
 * evaluations stay inside the unit they belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ISLAMIC_G5_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ISLAMIC_G5_T1_UNITS.forEach((unit, ui) => {
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
  "islamic-g5-t1",
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
 * Page-number candidates a content page prints at its foot. This book's foot
 * is a bare numeral on its own last line («٧»، «٢٠»، «٩٥», book 64 in Western
 * digits «64»), so the last non-empty line is scanned and every number on a
 * foot-looking line is a candidate.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const last = lines[lines.length - 1];
  if (!last) return [];
  const looksLikeFoot =
    /^[([]?[0-9٠-٩۰-۹]+[\])]?$/.test(last) || /^[0-9٠-٩۰-۹]+[\s•.·\-–—]/.test(last);
  if (!looksLikeFoot) return [];
  const latin = toLatinDigits(last).replace(/[^0-9]/g, " ").replace(/\s+/g, " ").trim();
  const nums: number[] = [];
  for (const tok of latin.split(" ")) if (tok) nums.push(Number(tok));
  return [...new Set(nums)].filter((n) => n > 0);
}

/**
 * The book number a content page prints at its foot, or null. Every content
 * page that carries a folio prints exactly one number there and it is its own,
 * which is what fixes the offset; the pages listed in `FOLIO_LESS_ANCHORS`
 * print no parseable number and are handled by their anchor instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The content pages whose printed footer the OCR misread, and the value it
 * printed instead — measured, not guessed. Every other parseable footer matches
 * its page number exactly, which is what fixes the offset. Listing the
 * exceptions keeps the check strict instead of statistical.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no parseable folio in the OCR, each with the anchor
 * the check accepts in place of a page number. Every anchor is a string the
 * page itself prints: the three unit openers (6/38/68), the hadith-close page
 * (8), the surah-text page (12), the tajweed-table page (17), the
 * neighbour-rights body page (33), the Zayd-ibn-Thabit continuation (59) and
 * the fasting-manners body page (79).
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  6: "الْإِيمَانُ وَالسَّلَامُ",
  8: "تَقَدَّمَ الْجَمِيعُ بِالشُّكْرِ",
  12: "عَيْنًا يَشْرَبُ بِهَا عِبَادُ اللَّهِ يُفَجِّرُونَهَا تَفْجِيرًا",
  17: "الْإِقْلَابُ",
  33: "بَوَائِقَهُ",
  38: "طَرِيقُ الْإِيمَانِ",
  59: "وَقَضَى زَيْدُ بْنُ ثَابِتٍ",
  68: "الدِّينُ وَالتَّوَاضُعُ",
  79: "حَانَ وَقْتُ صَلَاةِ الظُّهْرِ",
};

/** Every head kind the table may use: this book's lessons carry objectives only. */
const KNOWN_KINDS = new Set(["هدف"]);

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every range
 * sits inside its section, concept pages rise inside their lesson, every concept
 * kind is known with the lesson type matching its first concept, the sections
 * tile the term without gaps or overlaps, and the first/last sections hit the
 * book's own bounds. A content mistake here would quietly ground the tutor on the
 * wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ISLAMIC_G5_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_ISLAMIC_G5_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ISLAMIC_G5_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ISLAMIC_G5_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ISLAMIC_G5_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     its printed folio, or, on the nine pages named in
 *     `FOLIO_LESS_ANCHORS`, from the anchor quoted there;
 *  2. every unit opener prints the unit head and every lesson's first page prints
 *     that lesson's head;
 *  3. every lesson's title and every objective is printed on the pages the
 *     lesson owns (each objective on its own first page);
 *  4. every printed page in [6, 95] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR'd
 *     page of the term.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_ISLAMIC_G5_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ISLAMIC_G5_T1_BOOK_START || book > EGYPT_ISLAMIC_G5_T1_BOOK_END) continue;
    const text = loadBookPage(book);
    pagesChecked += 1;
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }

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
        problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق صفحته`);
      }
    }
  }

  // 2. every unit opener prints the unit head and every lesson's first page
  //    prints that lesson's head.
  units.forEach((unit, ui) => {
    if (loadBookPage(unit.bookFrom) && !pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`القسم ${unit.key}: صفحته الأولى ${unit.bookFrom} لا تطبع «${unit.printedHead}»`);
    }
    unit.lessons.forEach((lesson, li) => {
      if (loadBookPage(lesson.bookFrom) && !pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع «${lesson.printedHead}»`);
      }
      const { from, to } = lessonBookRange(ui, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.printedHead);
      if (!titlePrinted) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
    });
  });

  // 3. every objective's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (loadBookPage(c.bookFrom) && !pagePrints(c.bookFrom, c.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة المكوّن ${c.bookFrom} لا تطبع «${c.title}»`);
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
  for (let p = EGYPT_ISLAMIC_G5_T1_BOOK_START; p <= EGYPT_ISLAMIC_G5_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
