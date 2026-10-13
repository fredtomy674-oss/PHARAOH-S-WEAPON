// PHASE 109 — official Egypt Primary-1 (Grade 1) Arabic language
// («اللغة العربية» — الصف الأول الابتدائي، الفصل الدراسي الأول)، 2025/2026
// edition.
//
// The curriculum tree for the Egypt `eg-g1-arabic` curriculum is rebuilt from the
// Ministry textbook (154 scanned pages). This module is the single source of truth
// for its structure: the two intro sections («آداب الفصل» and «التهيئة»), the four
// printed units of the first term (أسرتي، حيواناتي، أجزاء جسمي، مدرستي), every
// printed lesson inside them (تدريبات قصة الاستماع، النشيد، one lesson per حرف,
// قصة القارئ الصغير، التقييم، and — in units 2 and 4 — قصة القراءة مع الأسرة),
// and, for every lesson, the book's own printed heads, verbatim and with the
// printed page they start on. The self-checks at the bottom prove that mapping
// against the OCR itself, page by page.
//
// THE OFFSET IS ONE — book page = scan page − 1
// Every content page that carries a folio prints its own number, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here: scan 7 prints
// «٦» (book 6), scan 15 prints «١٤» (book 14, the unit 1 opener), scan 46 prints
// «٤٥» (book 45, the unit 2 opener), scan 83 prints «٨٢» (book 82, the unit 3
// opener), scan 119 prints «118» (book 118), scan 141 prints «١٤٠» (book 140) and
// scan 149 prints «١٤٨» (book 148, the «قصص الحروف» appendix). The book's own
// «المحتويات» (scan 5) independently confirms it: it lists every lesson with the
// very book page its head prints on (تدريبات الوحدة الأولى ١٥، حرف الألف ١٧،
// تقييم الوحدة الثانية ٧٨، حرف الغين ١٣٥، تقييم الوحدة الرابعة ١٤٠، قصص
// الاستماع ١٤٤، قصص الحروف ١٤٨).
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–5 are before the term: the cover (1), the credits masthead (2),
// the «مقدمة» (3), the robot-guide «من المهم أن تقرأ لطفلك» page (4) and the
// printed «المحتويات» (5). Scan pages 145–154 are after the term: the book-wide
// «قصص الاستماع» appendix (books 144–147 = scans 145–148), the book-wide «قصص
// الحروف» appendix (books 148–151 = scans 149–152), the publisher data page
// (153) and the back cover (154). The term runs from «آداب الفصل» (book 5 =
// scan 6) to the unit 4 family story «السلحفاة الحكيمة» (books 142–143 = scans
// 143–144): `EGYPT_ARABIC_G1_T1_BOOK_START` / `_END` are exactly those two pages,
// and the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 143 − 5 + 1 = 139.
//
// EIGHTEEN TERM PAGES PRINT NO PARSEABLE FOLIO IN THE OCR
// Books 5, 7, 10 (آداب الفصل and two التهيئة activity pages), book 8 (its «٨»
// misread as «A»), book 17 (its «١٧» misread as «IV»), books 26, 50, 55, 70, 71,
// 76, 77, 78 (its «٧٨» misread as «VA»), 81, 84, 88, 117 (its «١١٧» misread as
// «IIW»), 142 and 143 (the two unnumbered family-story pages) carry no machine-
// readable number. Rather than weaken the page-number check, each is exempt from
// it and anchored on a printed head that only that page carries (see
// `FOLIO_LESS_ANCHORS`). Fifteen further pages print a folio the OCR misread as a
// different number («١٥» as «10», «٤٢» as «٤٣», «١٢٦» as «١١» …); those measured
// values live in `FOOTER_OCR_MISREADS` so the check stays strict instead of
// statistical.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// The book prints no per-lesson «أهداف»; its lesson layer is the المحتويات items
// (تدريبات، نشيد، حرف، قصة، تقييم) and its activity layer is the band heads it
// prints on the pages themselves (أدمج واقرأ، تحدث وعبر، اقرأ وحلل، لعبة
// الحروف، هيا نلعب، انطق ولاحظ، لاحظ واكتب، أنا تعلمت …). Every concept below is
// one such head, transcribed verbatim from the OCR of the page its `bookFrom`
// names — including the OCR's own misreads of the نشاط numbers («نشاط v» for
// «نشاط ٧») and of the band vocalisation («اقرأ ووحن» for «اقرأ وحلل») — so the
// page-proves-the-head check compares the transcription against the very text it
// was taken from.
//
// THE UNIT-LEVEL «تَعَلَّمْتُ فِي هَذِهِ الْوَحْدَةِ» PAGE RIDES WITH THE LAST
// LETTER LESSON
// Each unit closes its letters with a one-page «تعلمت في هذه الوحدة» self-review
// (books 41, 76, 113, 138) that the المحتويات does not list as its own lesson.
// It is owned by the unit's last حرف lesson, whose range therefore runs one page
// past the letter pages; the unit opener likewise rides with the unit's first
// (تدريبات) lesson, exactly as the Grade-9 book's صدر pages do.
//
// THE LISTENING AND LETTER STORIES LIVE IN BOOK-WIDE APPENDICES
// The تدريبات lessons print their exercises but deliberately not the story; the
// four stories are printed in the back-matter «قصص الاستماع» (books 144–147, one
// page per unit). Each letter lesson likewise points at its «قصة حرف» in «قصص
// الحروف» (book 148 for أ ب م ح ج د خ، 149 for ت ل س ن ر ف ك، 150 for ق ي ع ش
// و ه ذ، 151 for ظ ز ط ص ض ث غ). Each such lesson therefore also owns its
// appendix page through `extraBookPages`, so the tutor scoped to that lesson can
// quote the very story the book points it to. The appendices are not lessons:
// they stay outside the tiled unit ranges.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 1 (verified: book p.148 = scan p.149). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the term — «آداب الفصل» (scan 6). */
export const EGYPT_ARABIC_G1_T1_BOOK_START = 5;

/** Last printed page of the term — «السلحفاة الحكيمة» p.2 (scan 144). */
export const EGYPT_ARABIC_G1_T1_BOOK_END = 143;

/** The scanned pages before the term: cover, credits, مقدمة, robot guide, محتويات. */
export const EGYPT_ARABIC_G1_T1_FRONT_MATTER = { from: 1, to: 5 } as const;

/** The scanned pages after the term: the two story appendices + publisher/back cover. */
export const EGYPT_ARABIC_G1_T1_BACK_MATTER = { from: 145, to: 154 } as const;

/**
 * The book-wide story appendices, in book pages: «قصص الاستماع» (one listening
 * story per unit) and «قصص الحروف» (one «قصة حرف» per taught letter).
 */
export const EGYPT_ARABIC_G1_T1_APPENDIX = { from: 144, to: 151 } as const;

/** One printed head of a lesson — becomes one concept in the app tree. */
export interface ArabicG1T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: lesson-head kind or «نشاط» for activity/band heads. */
  kind: string;
  /** The printed head, verbatim from the book's OCR. */
  title: string;
}

/** One printed lesson of the textbook — becomes one lesson in the app tree. */
export interface ArabicG1T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3); "tah-1" for التهيئة. */
  key: string;
  /** Arabic ordinal used in the lesson title; "" where the book numbers nothing. */
  ordinal: string;
  /** The lesson's opening head type — its first concept's kind. */
  type: string;
  /** Lesson title as printed (without the المحتويات-only wording). */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: ArabicG1T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to (its listening/letter story).
   * Kept outside the tiled unit ranges but included in the lesson's RAG document.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — an intro section or one of the four units. */
export interface ArabicG1T1Section {
  /** Whether this is a numbered unit or a leading intro section. */
  kind: "unit" | "intro";
  /** Internal key: "1"…"4" for units, "adab"/"tah" for the intro sections. */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى"; "" for intro sections. */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: أسرتي". */
  title: string;
  /** The section head the opener page prints, e.g. "أسرتي". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next section's opener). */
  bookTo: number;
  lessons: ArabicG1T1Lesson[];
}

function concept(bookFrom: number, kind: string, title: string): ArabicG1T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The two intro sections and the four units of the first term with their printed
 * lessons and every printed head, transcribed from the pages the book prints them
 * on and checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Lesson starts come from the book's «المحتويات» (scan 5); each lesson's leading
 * concept is the very heading the book prints on the page the lesson starts on,
 * and the book's own vocalisation of those headings is kept verbatim in
 * `title`/`printedHead`/`concepts` even where it disagrees from page to page.
 */
export const EGYPT_ARABIC_G1_T1_UNITS: ArabicG1T1Section[] = [
  {
    key: "adab",
    kind: "intro",
    ordinal: "",
    title: "آداب الفصل",
    printedHead: "آداب الفصل",
    bookFrom: 5,
    bookTo: 5,
    lessons: [
      {
        key: "adab-1",
        ordinal: "",
        type: "آداب",
        title: "آداب الفصل",
        printedHead: "آداب الفصل",
        bookFrom: 5,
        concepts: [concept(5, "آداب", "آداب الفصل")],
      },
    ],
  },
  {
    key: "tah",
    kind: "intro",
    ordinal: "",
    title: "التهيئة",
    printedHead: "التهيئة",
    bookFrom: 6,
    bookTo: 13,
    lessons: [
      {
        key: "tah-1",
        ordinal: "",
        type: "تهيئة",
        title: "التهيئة",
        printedHead: "التهيئة",
        bookFrom: 6,
        concepts: [
          concept(6, "تهيئة", "أَوَّلًا: الْوَعْيُ الْبَصَرِيُّ"),
          concept(8, "تهيئة", "ثانِيًّا: الوَعْيُ الصَّوْتِيّ"),
          concept(10, "تهيئة", "ثَالِثًا: التَّمْهِيدُ لِلْكِتَابَةِ"),
          concept(12, "تهيئة", "رَابِعًا : مَهَارَاتُ الْإِدْرَاكِ"),
          concept(13, "تهيئة", "خامسًا: التَّعْبِيرُ الشَّفَوِيُّ"),
        ],
      },
    ],
  },
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: أسرتي",
    printedHead: "أسرتي",
    bookFrom: 14,
    bookTo: 44,
    lessons: [
      {
        key: "1-1",
        ordinal: "",
        type: "تدريبات",
        title: "تدريبات أميرة وأسرتها السعيدة",
        printedHead: "تدريبات أميرة وأسرتها السعيدة",
        bookFrom: 15,
        concepts: [
          concept(15, "تدريبات", "تدريبات أَميرةُ وأسرتُها السعيدةُ"),
          concept(15, "نشاط", "لاحظ الكلمات الشائعة"),
        ],
        extraBookPages: [144],
      },
      {
        key: "1-2",
        ordinal: "",
        type: "نشيد",
        title: "أسرتي",
        printedHead: "أُسْرَتِي",
        bookFrom: 16,
        concepts: [
          concept(16, "نشيد", "أُسْرَتِي"),
          concept(16, "نشاط", "(اسْتَمِعْ إِلَى النَّشِيدِ)"),
        ],
      },
      {
        key: "1-3",
        ordinal: "",
        type: "حرف",
        title: "حرف الألف",
        printedHead: "حَرْفُ الأَلِفِ",
        bookFrom: 17,
        concepts: [
          concept(17, "حرف", "حَرْفُ الأَلِفِ"),
          concept(18, "نشاط", "نشاط ( ٤ ) أَنْطِقُ صَوْتَ (أ)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(19, "نشاط", "نشاط ٧ أَنْطِقُ، وَأَكْتُبُ حَرْفَ (أ) مَضْبُوطًا بِالشَّكْلِ كَالْمِثَالِ:"),
          concept(19, "نشاط", "تَحَدَّثْ وَعَبِّرْ"),
          concept(19, "نشاط", "أنا تعلمت"),
        ],
        extraBookPages: [148],
      },
      {
        key: "1-4",
        ordinal: "",
        type: "حرف",
        title: "حرف الباء",
        printedHead: "حَرْفُ البَاءِ",
        bookFrom: 20,
        concepts: [
          concept(20, "حرف", "حَرْفُ البَاءِ"),
          concept(21, "نشاط", "نشاط ٤ أَنْطِقُ صَوْتَ (ب)، وَأُلاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(22, "نشاط", "نشاط ٧ أَنْطِقُ، وَأَكْتُبُ حَرْفَ (ب) مَضْبُوطًا بِالشَّكْلِ كَالْمِثَالِ:"),
          concept(22, "نشاط", "أدمج واقرأ"),
          concept(22, "نشاط", "تَحَدَّثُ وَعَبِّرْ"),
          concept(22, "نشاط", "أنا تعلمت"),
        ],
        extraBookPages: [148],
      },
      {
        key: "1-5",
        ordinal: "",
        type: "حرف",
        title: "حرف الميم",
        printedHead: "حَرْفُ الميمِ",
        bookFrom: 23,
        concepts: [
          concept(23, "حرف", "حَرْفُ الميمِ"),
          concept(24, "نشاط", "نشاط ٤ أَنْطِقُ صَوْتَ (م)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(25, "نشاط", "نشاط ٧ أَنْطِقُ، وَأَكْتُبُ حَرْفَ (م) مَضْبُوطًا بِالشَّكْلِ:"),
          concept(25, "نشاط", "أَدْمِجْ وَاقْرَأْ"),
          concept(25, "نشاط", "تَحَدَّثْ وَعَبِّرْ"),
          concept(25, "نشاط", "أَنَا تَعَلَّمْتُ"),
        ],
        extraBookPages: [148],
      },
      {
        key: "1-6",
        ordinal: "",
        type: "حرف",
        title: "حرف الحاء",
        printedHead: "حَرْفُ الحَاءِ",
        bookFrom: 26,
        concepts: [
          concept(26, "حرف", "حَرْفُ الحَاءِ"),
          concept(27, "نشاط", "نشاط (٤) أَنْطِقُ صَوْتَ (ح)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(28, "نشاط", "نشاط ٧ أَنْطِقُ، وَأَكْتُبُ حَرْفَ (ح) مَضْبُوطًا بِالشَّكْلِ كَالْمِثَالِ:"),
          concept(28, "نشاط", "أدمج وأقرأ"),
          concept(28, "نشاط", "تحدث وعبر"),
          concept(28, "نشاط", "أنا تعلمت"),
        ],
        extraBookPages: [148],
      },
      {
        key: "1-7",
        ordinal: "",
        type: "حرف",
        title: "حرف الجيم",
        printedHead: "حَرْفُ الجِيمِ",
        bookFrom: 29,
        concepts: [
          concept(29, "حرف", "حَرْفُ الجِيمِ"),
          concept(30, "نشاط", "نشاط ٤ أَنْطِقُ صَوْتَ (ج)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(31, "نشاط", "نشاط v أَنْطِقُ، وَأَكْتُبُ حَرْفَ (ج) مَضْبُوطًا بِالشَّكْلِ كَالْمِثَالِ:"),
          concept(31, "نشاط", "تَحَدَّثْ وعَبِّرْ"),
          concept(31, "نشاط", "أَنَا تعلمت"),
        ],
        extraBookPages: [148],
      },
      {
        key: "1-8",
        ordinal: "",
        type: "حرف",
        title: "حرف الدال",
        printedHead: "حَرْفُ الدَّالِ",
        bookFrom: 32,
        concepts: [
          concept(32, "حرف", "حَرْفُ الدَّالِ"),
          concept(33, "نشاط", "نشاط ٤ أَنْطِقُ صَوْتَ (د)، وَأُلاَحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(34, "نشاط", "نشاط V أَنْطِقُ، وَأَكْتُبُ حَرْفَ (د) مَضْبُوطًا بِالشَّكْلِ كَالْمِثَالِ:"),
          concept(34, "نشاط", "أدْمِجْ واقرأ"),
          concept(34, "نشاط", "تحدث وعَبِّر"),
          concept(34, "نشاط", "أنا تعلمت"),
        ],
        extraBookPages: [148],
      },
      {
        key: "1-9",
        ordinal: "",
        type: "حرف",
        title: "حرف الخاء",
        printedHead: "حَرْفِ الخَاءِ",
        bookFrom: 35,
        concepts: [
          concept(35, "حرف", "حَرْفِ الخَاءِ"),
          concept(36, "نشاط", "نشاط (٤) أَنْطِقُ صَوْتَ (خ)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(36, "نشاط", "لاحظ واكتب"),
          concept(37, "نشاط", "نشاط 8 أَنْطِقُ، وَأَكْتُبُ حَرْفَ (خ) مَضْبُوطًا بِالشَّكْلِ كَالْمِثَالِ:"),
          concept(37, "نشاط", "أدمج وأقرأ"),
          concept(37, "نشاط", "تَحَدَّثْ وَعَبِّرْ"),
          concept(37, "نشاط", "أنا تعلمت"),
        ],
        extraBookPages: [148],
      },
      {
        key: "1-10",
        ordinal: "",
        type: "حرف",
        title: "حرف التاء",
        printedHead: "حرف التاء",
        bookFrom: 38,
        concepts: [
          concept(38, "حرف", "حرف التاء"),
          concept(39, "نشاط", "نشاط 4 أَنْطِقُ صَوْتَ (ت)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(40, "نشاط", "نشاط (٧) أَنْطِقُ، وَأَكْتُبُ حَرْفَ (ت) مَضْبُوطًا بِالشَّكْلِ كَالْمِثَالِ:"),
          concept(40, "نشاط", "أدمج واقرأ"),
          concept(40, "نشاط", "تَحَدَّثْ وَعَبِّرْ"),
          concept(40, "نشاط", "أنا تعلمت"),
          concept(41, "نشاط", "تَعَلَّمْتُ فِي هَذِهِ الْوَحْدَةِ"),
        ],
        extraBookPages: [149],
      },
      {
        key: "1-11",
        ordinal: "",
        type: "قصة",
        title: "القارئ الصغير",
        printedHead: "الْقَارِئُ الصَّغِيرُ",
        bookFrom: 42,
        concepts: [
          concept(42, "قصة", "الْقَارِئُ الصَّغِيرُ"),
          concept(42, "نشاط", "هَيَّا نَقْرَأُ وَنَسْتَخْدِمُ:"),
          concept(42, "قصة", "أُحِبُّ أُسْرَتِي"),
        ],
      },
      {
        key: "1-12",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الأولى",
        printedHead: "تَقْيِيمُ الْوَحْدَةِ الْأُولَى",
        bookFrom: 43,
        concepts: [
          concept(43, "تقييم", "تَقْيِيمُ الْوَحْدَةِ الْأُولَى"),
          concept(43, "نشاط", "هَيَّا نُرَاجِعُ"),
          concept(44, "نشاط", "كَمْ نَجْمَةً تُعْطِيهَا لِنَفْسِكَ؟"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: حيواناتي",
    printedHead: "حيواناتي",
    bookFrom: 45,
    bookTo: 81,
    lessons: [
      {
        key: "2-1",
        ordinal: "",
        type: "تدريبات",
        title: "تدريبات عالم الحيوان",
        printedHead: "عَالَمُ الْحَيَوَانِ",
        bookFrom: 46,
        concepts: [
          concept(46, "تدريبات", "تدريبات عالم الحيوان"),
          concept(46, "نشاط", "لَاحِظِ الْكَلِمَاتِ الشَّائِعَةَ"),
        ],
        extraBookPages: [145],
      },
      {
        key: "2-2",
        ordinal: "",
        type: "نشيد",
        title: "لوحتي الجديدة",
        printedHead: "لَوْحَتِي الْجَدِيدَةُ",
        bookFrom: 47,
        concepts: [
          concept(47, "نشيد", "لَوْحَتِي الْجَدِيدَةُ"),
          concept(47, "نشاط", "(اسْتَمِعْ إِلَى النَّشِيدِ)"),
        ],
      },
      {
        key: "2-3",
        ordinal: "",
        type: "حرف",
        title: "حرف اللام",
        printedHead: "حرف اللام",
        bookFrom: 48,
        concepts: [
          concept(48, "حرف", "حرف اللام"),
          concept(49, "نشاط", "نشاط 4 أَنْطِقُ صَوْتَ (ل)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(49, "نشاط", "هيّا نلعب"),
          concept(50, "نشاط", "نشاط ٧ أَتَتَبَّعُ النُّقَطَ، ثُمَّ أَكْتُبُ حَرْفَ (ل):"),
          concept(50, "نشاط", "اقرأ و وحلل"),
          concept(51, "نشاط", "لعبة الحروف"),
          concept(51, "نشاط", "تحدث وعبر"),
          concept(51, "نشاط", "أنا تعلمت"),
        ],
        extraBookPages: [149],
      },
      {
        key: "2-4",
        ordinal: "",
        type: "حرف",
        title: "حرف السين",
        printedHead: "حرف السين",
        bookFrom: 52,
        concepts: [
          concept(52, "حرف", "حرف السين"),
          concept(53, "نشاط", "نشاط ٤ أَنْطِقُ صَوْتَ (س) ، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(53, "نشاط", "هيا نلعب"),
          concept(54, "نشاط", "نشاط V أَتَتَبَّعُ النُّقَطَ، ثُمَّ أَكْتُبُ حَرْفَ (س):"),
          concept(54, "نشاط", "اقْرَأ وحدِّل"),
          concept(55, "نشاط", "لعبة الحروف"),
          concept(55, "نشاط", "تَحَدَّثُ وَعَبِّرْ"),
          concept(55, "نشاط", "أَنَا تعلمت"),
        ],
        extraBookPages: [149],
      },
      {
        key: "2-5",
        ordinal: "",
        type: "حرف",
        title: "حرف النون",
        printedHead: "حرف النون",
        bookFrom: 56,
        concepts: [
          concept(56, "حرف", "حرف النون"),
          concept(57, "نشاط", "نشاط ٤ أَنْطِقُ صَوْتَ (ن)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(57, "نشاط", "هيَّا نلعب"),
          concept(58, "نشاط", "نشاط ٧ أَتَتَبَّعُ النُّقَطَ، ثُمَّ أَكْتُبُ حَرْفَ (ن):"),
          concept(58, "نشاط", "اقرأ وحلل"),
          concept(59, "نشاط", "لعبة الحروف"),
          concept(59, "نشاط", "تحدث وعبّر"),
          concept(59, "نشاط", "أَنَا تَعَلَّمْتُ"),
        ],
        extraBookPages: [149],
      },
      {
        key: "2-6",
        ordinal: "",
        type: "حرف",
        title: "حرف الراء",
        printedHead: "حَرْفُ الرَّاءِ",
        bookFrom: 60,
        concepts: [
          concept(60, "حرف", "حَرْفُ الرَّاءِ"),
          concept(61, "نشاط", "نشاط 4 أَنْطِقُ صَوْتَ ( ر )، وَأُلاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(61, "نشاط", "هيا نلعب"),
          concept(62, "نشاط", "نشاط V أَنْطِقُ، وَأَتَبَّعُ النُّقَطَ، ثُمَّ أَكْتُبُ حَرْفَ (ر):"),
          concept(62, "نشاط", "أقْرَأُ وَأَحَلِّلُ"),
          concept(63, "نشاط", "لعبة الحروف"),
          concept(63, "نشاط", "أَتَحَدَّثُ وَأُعَبِّرُ"),
          concept(63, "نشاط", "أَنَا تَعَلَّمْتُ"),
        ],
        extraBookPages: [149],
      },
      {
        key: "2-7",
        ordinal: "",
        type: "حرف",
        title: "حرف الفاء",
        printedHead: "حَرْفُ الفَاءِ",
        bookFrom: 64,
        concepts: [
          concept(64, "حرف", "حَرْفُ الفَاءِ"),
          concept(65, "نشاط", "نشاط 4 أَنْطِقُ صَوْتَ (فَ)، وَأُلاَحِظُ الحَرَكَاتِ القَصِيرَةَ وَالسُّكُونَ:"),
          concept(65, "نشاط", "هيا نلعب"),
          concept(66, "نشاط", "نشاط ٧ أَتَتَبَّعُ النُّقَطَ، ثُمَّ أَكْتُبُ حَرْفَ (ف):"),
          concept(66, "نشاط", "اقْرَأْ وَحَلّْ"),
          concept(67, "نشاط", "لعبة الحروف"),
          concept(67, "نشاط", "تَحَدَّثُ وَعَبِّرْ"),
          concept(67, "نشاط", "أَنَا تعلمت"),
        ],
        extraBookPages: [149],
      },
      {
        key: "2-8",
        ordinal: "",
        type: "حرف",
        title: "حرف الكاف",
        printedHead: "حرف الكاف",
        bookFrom: 68,
        concepts: [
          concept(68, "حرف", "حرف الكاف"),
          concept(69, "نشاط", "نشاط ٥ أَنْطِقُ صَوْتَ (ك)، وَأُلاحِظُ الْحَرَكَاتِ القَصِيرَةَ وَالسُّكُون:"),
          concept(69, "نشاط", "هيا نلعب"),
          concept(70, "نشاط", "نشاط ٧ أَتَتَبَّعُ النُّقَطَ، ثُمَّ أَكْتُبُ حَرْفَ (ك):"),
          concept(70, "نشاط", "اقرأ ووحن"),
          concept(71, "نشاط", "لعبة الحروف"),
          concept(71, "نشاط", "تَحَدَّثْ وَعَبِّرْ"),
          concept(71, "نشاط", "أَنا تعلّمت"),
        ],
        extraBookPages: [149],
      },
      {
        key: "2-9",
        ordinal: "",
        type: "حرف",
        title: "حرف القاف",
        printedHead: "حَرْفُ القَافِ",
        bookFrom: 72,
        concepts: [
          concept(72, "حرف", "حَرْفُ القَافِ"),
          concept(73, "نشاط", "نشاط ٤ أَنْطِقُ صَوْتَ (قَ)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(73, "نشاط", "هيا نلعب"),
          concept(73, "نشاط", "إنطق ولاحظ"),
          concept(74, "نشاط", "نشاط (۸) أَتَتَبَّعُ النُّقَطَ، ثُمَّ أَكْتُبُ حَرْفَ (ق):"),
          concept(74, "نشاط", "لاحظ واكتب"),
          concept(74, "نشاط", "اقرأ وحدّث"),
          concept(75, "نشاط", "لعبة الحروف"),
          concept(75, "نشاط", "تَحَدَّثْ وَعَبِّرْ"),
          concept(75, "نشاط", "أنا تعلمت"),
          concept(76, "نشاط", "تَعَلَّمْتُ فِي هَذِهِ الْوَحْدَةِ"),
        ],
        extraBookPages: [150],
      },
      {
        key: "2-10",
        ordinal: "",
        type: "قصة",
        title: "القارئ الصغير",
        printedHead: "الْقَارِئُ الصَّغِيرُ",
        bookFrom: 77,
        concepts: [
          concept(77, "قصة", "الْقَارِئُ الصَّغِيرُ"),
          concept(77, "نشاط", "هَيَّا نَقْرَأُ وَنَسْتَخْدِمُ:"),
          concept(77, "قصة", "مَاذَا تَأْكُلُ؟"),
        ],
      },
      {
        key: "2-11",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الثانية",
        printedHead: "تَقْيِيمُ الوحدة الثَّانِيَةِ",
        bookFrom: 78,
        concepts: [
          concept(78, "تقييم", "تَقْيِيمُ الوحدة الثَّانِيَةِ"),
          concept(78, "نشاط", "هَيَّا نُرَاجِعُ"),
          concept(79, "نشاط", "كَمْ نَجْمَةً تُعْطِيهَا لِنَفْسِكَ؟"),
        ],
      },
      {
        key: "2-12",
        ordinal: "",
        type: "اقرأ مع الأسرة",
        title: "التعاون سر النجاح",
        printedHead: "« التَّعَاوُنُ سِرُّ النَّجَاحِ »",
        bookFrom: 80,
        concepts: [
          concept(80, "اقرأ مع الأسرة", "« التَّعَاوُنُ سِرُّ النَّجَاحِ »"),
          concept(80, "نشاط", "اقرأ مع الأسرة"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: أجزاء جسمي",
    printedHead: "أجزاء جسمي",
    bookFrom: 82,
    bookTo: 116,
    lessons: [
      {
        key: "3-1",
        ordinal: "",
        type: "تدريبات",
        title: "تدريبات صندوق جدتي",
        printedHead: "صُندُوق جَدَّتِي",
        bookFrom: 83,
        concepts: [
          concept(83, "تدريبات", "تدريبات صندوق جدتي"),
          concept(83, "نشاط", "لَاحِظِ الكَلِمَاتِ الشَّائِعَةَ"),
        ],
        extraBookPages: [146],
      },
      {
        key: "3-2",
        ordinal: "",
        type: "نشيد",
        title: "أحب جسمي",
        printedHead: "أُحِبُّ جِسْمِي",
        bookFrom: 84,
        concepts: [
          concept(84, "نشيد", "أُحِبُّ جِسْمِي"),
          concept(84, "نشاط", "(اسْتَمِعْ إِلَى النَّشِيدِ)"),
        ],
      },
      {
        key: "3-3",
        ordinal: "",
        type: "حرف",
        title: "حرف الياء",
        printedHead: "حرفُ الياءِ",
        bookFrom: 85,
        concepts: [
          concept(85, "حرف", "حرفُ الياءِ"),
          concept(86, "نشاط", "نشاط ٥ أَنْطِقُ صَوْتَ (ي)، وَأُلاَحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(86, "نشاط", "هيا نلعب"),
          concept(87, "نشاط", "نشاط ( 7 ) أَتَتَبَّعُ النُّقَطَ، ثُمَّ أَكْتُبُ حَرْفَ (ي):"),
          concept(87, "نشاط", "اقرأ وحلل"),
          concept(88, "نشاط", "لُعْبَةُ الحُرُوفِ"),
          concept(88, "نشاط", "تَحَدَّثْ وَعَبِّرْ"),
          concept(88, "نشاط", "أنا تعلمت"),
        ],
        extraBookPages: [150],
      },
      {
        key: "3-4",
        ordinal: "",
        type: "حرف",
        title: "حرف العين",
        printedHead: "حَرْفُ العَيْنِ",
        bookFrom: 89,
        concepts: [
          concept(89, "حرف", "حَرْفُ العَيْنِ"),
          concept(90, "نشاط", "نشاط ٥ أَنْطِقُ صَوْتَ (ع)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(90, "نشاط", "هيا نلعب"),
          concept(91, "نشاط", "نشاط (7) أَتَبَرَّعُ النُّقَطَ، ثُمَّ أَكْتُبُ حَرْفَ (ع):"),
          concept(91, "نشاط", "اقْرَأْ وَحَلِّلْ"),
          concept(92, "نشاط", "لعبة الحروف"),
          concept(92, "نشاط", "تَحَدَّثْ وَعَبِّرْ"),
          concept(92, "نشاط", "أَنَا تَعَلَّمْتُ"),
        ],
        extraBookPages: [150],
      },
      {
        key: "3-5",
        ordinal: "",
        type: "حرف",
        title: "حرف الشين",
        printedHead: "حَرْفُ الشِّينِ",
        bookFrom: 93,
        concepts: [
          concept(93, "حرف", "حَرْفُ الشِّينِ"),
          concept(94, "نشاط", "نشاط ٥ أَنْطِقُ صَوْتَ (ش)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(94, "نشاط", "هيا نلعب"),
          concept(95, "نشاط", "نشاط ٧ أَنْطِقُ، وَأَتَتَبَّعُ النُّقَطَ، ثُمَّ أَكْتُبُ حَرْفَ (ش):"),
          concept(95, "نشاط", "لاحظ واكتب"),
          concept(95, "نشاط", "اقرأ وحلّل"),
          concept(96, "نشاط", "لعبة الحروف"),
          concept(96, "نشاط", "تحدث وعبر"),
          concept(96, "نشاط", "أنا تعلمت"),
        ],
        extraBookPages: [150],
      },
      {
        key: "3-6",
        ordinal: "",
        type: "حرف",
        title: "حرف الواو",
        printedHead: "حَرْفُ الوَاوِ",
        bookFrom: 97,
        concepts: [
          concept(97, "حرف", "حَرْفُ الوَاوِ"),
          concept(98, "نشاط", "نشاط ٥ أَنْطِقُ صَوْتَ (و)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(98, "نشاط", "هيا نلعب"),
          concept(99, "نشاط", "نشاط V أَتَتَبَّعُ النُّقَطَ، ثُمَّ أَكْتُبُ حَرْفَ (و):"),
          concept(99, "نشاط", "اقرأ ووحش"),
          concept(100, "نشاط", "لعبة الحروف"),
          concept(100, "نشاط", "تَحَدَّثْ وَعَبِّرْ"),
          concept(100, "نشاط", "أَنَا تَعْلَمْتُ"),
        ],
        extraBookPages: [150],
      },
      {
        key: "3-7",
        ordinal: "",
        type: "حرف",
        title: "حرف الهاء",
        printedHead: "حرف الهاء",
        bookFrom: 101,
        concepts: [
          concept(101, "حرف", "حرف الهاء"),
          concept(102, "نشاط", "نشاط ٥ أَنْطِقُ صَوْتَ (هـ)، وَأُلاَحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(102, "نشاط", "هيا نلعب"),
          concept(103, "نشاط", "نشاط V أَتَتَبَّعُ النُّقَطَ، ثُمَّ أَكْتُبُ حَرْفَ (ه):"),
          concept(103, "نشاط", "اقرأ وحلّل"),
          concept(104, "نشاط", "لعبَةُ الحروف"),
          concept(104, "نشاط", "تَحَدَّثْ وَعَبِّرْ"),
          concept(104, "نشاط", "أَنَا تَعَلَّمْتُ"),
        ],
        extraBookPages: [150],
      },
      {
        key: "3-8",
        ordinal: "",
        type: "حرف",
        title: "حرف الذال",
        printedHead: "حرف الذّال",
        bookFrom: 105,
        concepts: [
          concept(105, "حرف", "حرف الذّال"),
          concept(106, "نشاط", "نشاط ٥ أَنْطِقُ صَوْتَ (ذ)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(106, "نشاط", "هيا نلعب"),
          concept(107, "نشاط", "نشاط 7 أَتَتَبَّعُ النُّقَطَ، ثُمَّ أَكْتُبُ حَرْفَ (ذ):"),
          concept(107, "نشاط", "لاحظ واكتب"),
          concept(107, "نشاط", "أقرأ وأحلل"),
          concept(108, "نشاط", "لعبة الحروف"),
          concept(108, "نشاط", "تَحَدَّثْ وَعَبِّرْ"),
          concept(108, "نشاط", "أنا تعلمت"),
        ],
        extraBookPages: [150],
      },
      {
        key: "3-9",
        ordinal: "",
        type: "حرف",
        title: "حرف الظاء",
        printedHead: "حرف الظاء",
        bookFrom: 109,
        concepts: [
          concept(109, "حرف", "حرف الظاء"),
          concept(110, "نشاط", "نشاط ٥ أَنْطِقُ صَوْتَ (ظ)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(110, "نشاط", "هيا نلعب"),
          concept(111, "نشاط", "نشاط V أَتَتَبَّعُ النُّقَاطَ، ثُمَّ أَكْتُبُ حَرْفَ (ظ):"),
          concept(111, "نشاط", "إقرأ أو حلّل"),
          concept(112, "نشاط", "لعبة الحروف"),
          concept(112, "نشاط", "تَحَدَّثْ وعَبِّرْ"),
          concept(112, "نشاط", "أَنَا تعلمت"),
          concept(113, "نشاط", "تَعَلَّمْتُ فِي هَذِهِ الْوَحْدَةِ"),
        ],
        extraBookPages: [151],
      },
      {
        key: "3-10",
        ordinal: "",
        type: "قصة",
        title: "القارئ الصغير",
        printedHead: "الْقَارِئُ الصَّغِيرُ",
        bookFrom: 114,
        concepts: [
          concept(114, "قصة", "الْقَارِئُ الصَّغِيرُ"),
          concept(114, "نشاط", "هَيَّا نَقْرَأُ وَنَسْتَخْدِمُ:"),
          concept(114, "قصة", "هَذَا جِسْمِي"),
        ],
      },
      {
        key: "3-11",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الثالثة",
        printedHead: "تَقْيِيمُ الْوَحْدَةِ الثَّالِثَةِ",
        bookFrom: 115,
        concepts: [
          concept(115, "تقييم", "تَقْيِيمُ الْوَحْدَةِ الثَّالِثَةِ"),
          concept(115, "نشاط", "هَيَّا نُرَاجِعُ"),
          concept(116, "نشاط", "كَمْ نَجْمَةً تُعْطِيهَا لِنَفْسِكَ؟"),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "الرابعة",
    title: "الوحدة الرابعة: مدرستي",
    printedHead: "مدرستي",
    bookFrom: 117,
    bookTo: 143,
    lessons: [
      {
        key: "4-1",
        ordinal: "",
        type: "تدريبات",
        title: "تدريبات يوم في المدرسة",
        printedHead: "يَوْمُ فِي المَدْرَسَةِ",
        bookFrom: 118,
        concepts: [
          concept(118, "تدريبات", "تدريبات يوم في المدرسة"),
          concept(118, "نشاط", "لاحظ الكَلِمَاتِ الشَّائِعَةَ"),
        ],
        extraBookPages: [147],
      },
      {
        key: "4-2",
        ordinal: "",
        type: "نشيد",
        title: "أحب مدرستي",
        printedHead: "أُحِبُّ مَدْرَسَتِي",
        bookFrom: 119,
        concepts: [
          concept(119, "نشيد", "أُحِبُّ مَدْرَسَتِي"),
          concept(119, "نشاط", "(اسْتَمِعْ إِلَى النَّشِيدِ)"),
        ],
      },
      {
        key: "4-3",
        ordinal: "",
        type: "حرف",
        title: "حرف الزاي",
        printedHead: "حَرْفُ الزَّاي",
        bookFrom: 120,
        concepts: [
          concept(120, "حرف", "حَرْفُ الزَّاي"),
          concept(120, "نشاط", "نشاط ٣ أَنْطِقُ صَوْتَ (ز)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ كَالْمِثَالِ:"),
          concept(121, "نشاط", "نشاط 4 أَنْطِقُ، وَأَكْتُبُ الْحَرَكَةَ الْمُنَاسِبَةَ عَلَى حَرْفِ (ز):"),
          concept(121, "نشاط", "لاحظ واكتب"),
          concept(122, "نشاط", "نشاط (8) أَنْطِقُ، وَأَكْتُبُ حَرْفَ (ز) مَضْبُوطًا بِالشَّكْلِ:"),
          concept(122, "نشاط", "لعبة الحروف"),
          concept(122, "نشاط", "تَحَدَّثْ وَعَبِّرْ"),
          concept(122, "نشاط", "أنا تعلمت"),
        ],
        extraBookPages: [151],
      },
      {
        key: "4-4",
        ordinal: "",
        type: "حرف",
        title: "حرف الطاء",
        printedHead: "حَرْفُ الطَّاءِ",
        bookFrom: 123,
        concepts: [
          concept(123, "حرف", "حَرْفُ الطَّاءِ"),
          concept(123, "نشاط", "نشاط 3 أَنْطِقُ صَوْتَ (ط)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(124, "نشاط", "نشاط 4 أَنْطِقُ، وَأَكْتُبُ الْحَرَكَةَ الْمُنَاسِبَةَ عَلَى حَرْفِ (ط):"),
          concept(124, "نشاط", "لاحظ واكتب"),
          concept(125, "نشاط", "نَشَاط ٨ أَنْطِقُ، وَأَكْتُبُ حَرْفَ (ط) مَضْبُوطًا بِالشَّكْلِ:"),
          concept(125, "نشاط", "لُعْبَةُ الحروف"),
          concept(125, "نشاط", "تَحَدَّثْ وَعَبِّرْ"),
          concept(125, "نشاط", "أَنَا تَعَلَّمْتُ"),
        ],
        extraBookPages: [151],
      },
      {
        key: "4-5",
        ordinal: "",
        type: "حرف",
        title: "حرف الصاد",
        printedHead: "حرف الصاد",
        bookFrom: 126,
        concepts: [
          concept(126, "حرف", "حرف الصاد"),
          concept(126, "نشاط", "نشاط ٣ أُلَاحِظُ شَكْلَ حَرْفِ (ص) فِي الْكَلِمَةِ، ثُمَّ أَخْتَارُ الشَّكْلَ الْمُنَاسِبَ:"),
          concept(127, "نشاط", "نشاط ٤ أَنْطِقُ صَوْتَ (ص)، وَأُلاَحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(127, "نشاط", "انطق ولاحظ"),
          concept(128, "نشاط", "نشاط ٨ أَنْطِقُ، وَأَكْتُبُ حَرْفَ (ص) مَضْبُوطاً بِالشَّكْلِ:"),
          concept(128, "نشاط", "لعبة الحروف"),
          concept(128, "نشاط", "تحدث وعبّر"),
          concept(128, "نشاط", "أنا تعلمت"),
        ],
        extraBookPages: [151],
      },
      {
        key: "4-6",
        ordinal: "",
        type: "حرف",
        title: "حرف الضاد",
        printedHead: "حرف الضاد",
        bookFrom: 129,
        concepts: [
          concept(129, "حرف", "حرف الضاد"),
          concept(129, "نشاط", "نشاط ٣ أَنْطِقُ صَوْتَ (ض)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(130, "نشاط", "نشاط ٤ أَنْطِقُ، وَأَكْتُبُ الْحَرَكَةَ الْمُنَاسِبَةَ عَلَى حَرْفِ (ض):"),
          concept(130, "نشاط", "انطق ولاحظ"),
          concept(130, "نشاط", "لاحظ واكتب"),
          concept(131, "نشاط", "نشاط A أَنْطِقُ، وَأَكْتُبُ حَرْفَ (ض) مَضْبُوطًا بِالشَّكْلِ:"),
          concept(131, "نشاط", "لعبة الحروف"),
          concept(131, "نشاط", "تَحَدَّثْ وَعَبِّرْ"),
          concept(131, "نشاط", "أَنَا تَعَلَّمْتُ"),
        ],
        extraBookPages: [151],
      },
      {
        key: "4-7",
        ordinal: "",
        type: "حرف",
        title: "حرف الثاء",
        printedHead: "حَرْفُ الثَّاءِ",
        bookFrom: 132,
        concepts: [
          concept(132, "حرف", "حَرْفُ الثَّاءِ"),
          concept(132, "نشاط", "نشاط (3) أَنْطِقُ حَرْفَ (ث)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(133, "نشاط", "نشاط 4 أَنْطِقُ، وَأَكْتُبُ الْحَرَكَةَ الْمُنَاسِبَةَ عَلَى حَرْف (ث):"),
          concept(133, "نشاط", "انطق ولاحظ"),
          concept(133, "نشاط", "لاحظ واكتب"),
          concept(134, "نشاط", "نشاط ٨ أَنْطِقُ، وَأَكْتُبُ حَرْفَ (ث) مَضْبُوطًا بِالشَّكْلِ:"),
          concept(134, "نشاط", "لعبة الحروف"),
          concept(134, "نشاط", "تَحَدَّثْ وَعَبِّرْ"),
          concept(134, "نشاط", "أنا تعلمت"),
        ],
        extraBookPages: [151],
      },
      {
        key: "4-8",
        ordinal: "",
        type: "حرف",
        title: "حرف الغين",
        printedHead: "حَرْفُ الْغَيْنِ",
        bookFrom: 135,
        concepts: [
          concept(135, "حرف", "حَرْفُ الْغَيْنِ"),
          concept(135, "نشاط", "نشاط ٣ أُلَاحِظُ شَكْلَ حَرْفِ (غ) فِي الْكَلِمَةِ، ثُمَّ أَخْتَارُ الشَّكْلَ الْمُنَاسِبَ:"),
          concept(136, "نشاط", "نشاط 5 أَنْطِقُ صَوْتَ (غ)، وَأُلَاحِظُ الْحَرَكَاتِ الْقَصِيرَةَ وَالسُّكُونَ:"),
          concept(136, "نشاط", "لاحظ واكتب"),
          concept(137, "نشاط", "نشاط A أَنْطِقُ، وَأَكْتُبُ حَرْفَ (غ) مَضْبُوطًا بِالشَّكْلِ:"),
          concept(137, "نشاط", "لعبة الحروف"),
          concept(137, "نشاط", "تَحَدَّثْ وَعَبْرٌ"),
          concept(137, "نشاط", "أَنا تعلمت"),
          concept(138, "نشاط", "تَعَلَّمْتُ فِي هَذِهِ الْوَحْدَةِ"),
        ],
        extraBookPages: [151],
      },
      {
        key: "4-9",
        ordinal: "",
        type: "قصة",
        title: "القارئ الصغير",
        printedHead: "القَارِئُ الصَّغِيرُ",
        bookFrom: 139,
        concepts: [
          concept(139, "قصة", "القَارِئُ الصَّغِيرُ"),
          concept(139, "نشاط", "هَيَّا نَقْرَأُ وَنَسْتَخْدِمُ:"),
          concept(139, "قصة", "هَذِهِ مَدْرَسَتِي"),
        ],
      },
      {
        key: "4-10",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الرابعة",
        printedHead: "تَقْيِيمُ الوَحْدَةِ الرَّابِعَةِ",
        bookFrom: 140,
        concepts: [
          concept(140, "تقييم", "تَقْيِيمُ الوَحْدَةِ الرَّابِعَةِ"),
          concept(140, "نشاط", "هَيَّا نُرَاجِعُ"),
          concept(141, "نشاط", "كَمْ نَجْمَةً تُعْطِيهَا لِنَفْسِكَ ؟"),
        ],
      },
      {
        key: "4-11",
        ordinal: "",
        type: "اقرأ مع الأسرة",
        title: "السلحفاة الحكيمة",
        printedHead: "« السُّلْحَفَاةُ الحَكِيمَةُ »",
        bookFrom: 142,
        concepts: [
          concept(142, "اقرأ مع الأسرة", "« السُّلْحَفَاةُ الحَكِيمَةُ »"),
          concept(142, "نشاط", "اقرأ مع الأسرة"),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the section opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the
 * section — so the unit opener stays inside the unit it belongs to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ARABIC_G1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ARABIC_G1_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * The appendix page(s) each lesson points to, keyed by the lesson key (`1-1` →
 * `[144]`). The تدريبات lessons print their exercises but not the story, and
 * every letter lesson points at its «قصة حرف» in «قصص الحروف»; the appendix
 * pages live in the back matter. The stage appends these pages so the student
 * reads the very page the tutor quotes from.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const unit of EGYPT_ARABIC_G1_T1_UNITS) {
    for (const lesson of unit.lessons) {
      if (lesson.extraBookPages?.length) out.set(lesson.key, [...lesson.extraBookPages]);
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
  "arabic-g1-t1",
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

/** Loads + joins the OCR text of a book-page range into one document. */
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

/**
 * Full document payload for one lesson: its owned range plus the appendix pages
 * it points to (its listening/letter story). The lesson's own pages come first.
 */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const range = lessonBookRange(unitIndex, lessonIndex);
  const lesson = EGYPT_ARABIC_G1_T1_UNITS[unitIndex]!.lessons[lessonIndex]!;
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
    .replace(/\u0640/g, "")
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
 * Page-number candidates a content page prints at its foot. This book's foot is a
 * bare numeral on its own last line («١٤»، «١١١»، «41»), sometimes wrapped in
 * parentheses («(119)»، «(۱۳۹)»، «-11-»), and once sharing its line with the
 * teacher note («٦٨ • يتعرف …»), so the last five lines are scanned and every
 * number on a foot-looking line is a candidate.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const tail = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(-5);
  const nums: number[] = [];
  for (const line of tail) {
    const looksLikeFoot =
      /^[[(ـ\-]*[0-9٠-٩۰-۹]+[\])ـ\-]*$/.test(line) || /^[0-9٠-٩۰-۹]+[\s•.·\-–—]/.test(line);
    if (!looksLikeFoot) continue;
    const latin = toLatinDigits(line).replace(/[^0-9]/g, " ").replace(/\s+/g, " ").trim();
    for (const tok of latin.split(" ")) if (tok) nums.push(Number(tok));
  }
  return [...new Set(nums)].filter((n) => n > 0);
}

/**
 * The book number a content page prints at its foot, or null. Every content page
 * that carries a folio prints exactly one number there and it is its own, which
 * is what fixes the offset; the pages listed in `FOLIO_LESS_ANCHORS` print no
 * parseable number and are handled by their anchor instead.
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
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {
  15: 10,
  16: 17,
  42: 43,
  56: 57,
  65: 10,
  95: 90,
  110: 11,
  115: 110,
  120: 130,
  121: 131,
  124: 134,
  126: 11,
  127: 137,
  128: 138,
  136: 63,
};

/**
 * The term pages that print no parseable folio in the OCR, each with the anchor
 * the check accepts in place of a page number. Every anchor is a head the page
 * itself prints: books 5/7/10 (pages without any printed number), books 8/17/
 * 70/71/78/117 (their folio misread as bare Latin letters), books 26/50/55/76/
 * 77/81/84/88 (activity/story pages that print no folio) and books 142–143 (the
 * unnumbered family story «السلحفاة الحكيمة»).
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  5: "آداب الفصل",
  7: "ثلاثة اختلافات",
  8: "الوعي الصوتي",
  10: "التمهيد للكتابة",
  17: "حرف الألف",
  26: "حرف الحاء",
  50: "أحللها إلى حروف",
  55: "حرف السين",
  70: "حرف (ك)",
  71: "حرف الكاف",
  76: "تعلمت في هذه الوحدة",
  77: "القارئ الصغير",
  78: "تقييم الوحدة الثانية",
  81: "التعاون",
  84: "أحب جسمي",
  88: "حرف الياء",
  117: "الوحدة الرابعة",
  142: "السلحفاة الحكيمة",
  143: "السلحفاة",
};

/** Every head kind the table may use: the lesson-head kinds plus «نشاط». */
const KNOWN_KINDS = new Set([
  "آداب",
  "تهيئة",
  "تدريبات",
  "نشيد",
  "حرف",
  "قصة",
  "تقييم",
  "اقرأ مع الأسرة",
  "نشاط",
]);

/**
 * Table invariants: lesson keys are unique and follow (section-lesson), every
 * range sits inside its section, concept pages rise inside their lesson, the
 * sections tile the term without gaps or overlaps, every appendix page a lesson
 * points to sits inside the book-wide appendix, and the first/last sections hit
 * the book's own bounds. A content mistake here would quietly ground the tutor
 * on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ARABIC_G1_T1_UNITS;
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
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول مكوّن`);
      }

      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lesson.bookFrom < minStart || lesson.bookFrom > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((c, ci) => {
        if (!c.title.trim()) problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: بلا عنوان`);
        if (!KNOWN_KINDS.has(c.kind)) {
          problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: نوع غير معروف «${c.kind}»`);
        }
        if (c.bookFrom < unit.bookFrom || c.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: صفحته ${c.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && c.bookFrom < prev.bookFrom) {
          problems.push(`الدرس ${lesson.key}: صفحات المكوّنات تنازلية (${prev.bookFrom} ثم ${c.bookFrom})`);
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }
      const last = lesson.concepts.at(-1)!;
      if (last.bookFrom < from || last.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: مكوّنه الأخير ${last.bookFrom} خارج نطاقه ${from}–${to}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر القسم ${unit.bookFrom}، وجدنا ${from}`);
      }
      for (const page of lesson.extraBookPages ?? []) {
        if (page < EGYPT_ARABIC_G1_T1_APPENDIX.from || page > EGYPT_ARABIC_G1_T1_APPENDIX.to) {
          problems.push(
            `الدرس ${lesson.key}: صفحة ملحقة ${page} خارج ملحق الكتاب ${EGYPT_ARABIC_G1_T1_APPENDIX.from}–${EGYPT_ARABIC_G1_T1_APPENDIX.to}`,
          );
        }
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
  if (first && first.bookFrom !== EGYPT_ARABIC_G1_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ARABIC_G1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ARABIC_G1_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ARABIC_G1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio (allowing the measured OCR misreads), or, on the pages that
 *     print no parseable folio, from the anchor named in `FOLIO_LESS_ANCHORS`;
 *  2. every section opener prints the section head and every lesson's first page
 *     prints that lesson's head;
 *  3. every lesson's title and every concept's head is printed on the pages the
 *     lesson owns (the concept on its own page), and every appendix page a
 *     lesson points to prints that lesson's story;
 *  4. every printed page in [5, 143] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_ARABIC_G1_T1_UNITS;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ARABIC_G1_T1_BOOK_START || book > EGYPT_ARABIC_G1_T1_BOOK_END) continue;
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
      } else if (footer !== book) {
        const misread = FOOTER_OCR_MISREADS[book];
        if (footer !== misread) {
          problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق رقمها`);
        }
      }
    }
  }

  if (printedPages.size !== EGYPT_ARABIC_G1_T1_BOOK_END - EGYPT_ARABIC_G1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ARABIC_G1_T1_BOOK_START} و${EGYPT_ARABIC_G1_T1_BOOK_END}`,
    );
  }

  // 2 + 3a. every section opener prints the section head, every lesson's first
  // page its head, and every lesson's title is printed somewhere in the pages it
  // owns.
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
      lesson.concepts.forEach((c) => {
        if (!pagePrints(c.bookFrom, c.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة المكوّن ${c.bookFrom} لا تطبع «${c.title}»`);
        }
      });
    });
  });

  // 3c. every appendix page a lesson points to prints that lesson's story: the
  // تدريبات story title (without the «تدريبات» prefix the appendix never prints)
  // or the letter lesson's own «حرف» head, which the appendix prints as «قصة حرف».
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const extras = lesson.extraBookPages ?? [];
      if (!extras.length) return;
      const texts = extras.map((page) => loadBookPage(page));
      extras.forEach((page, i) => {
        if (!texts[i]) problems.push(`الدرس ${lesson.key}: صفحة الملحق ${page} بلا نص OCR`);
      });
      const needle =
        lesson.type === "تدريبات" ? lesson.title.replace(/^تدريبات\s+/, "") : lesson.title;
      if (!normalize(texts.join("\n")).includes(normalize(needle))) {
        problems.push(`الدرس ${lesson.key}: صفحات الملحق ${extras.join(",")} لا تطبع «${needle}»`);
      }
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
  for (let p = EGYPT_ARABIC_G1_T1_BOOK_START; p <= EGYPT_ARABIC_G1_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
