// PHASE 140 — official Egypt KG1 (رياض أطفال 1, المستوى الأول) Arabic language
// («اللغة العربية» — رياض الأطفال، المستوى الأول، الفصل الدراسي الأول)،
// 2025/2026 edition.
//
// The curriculum tree for the Egypt `eg-kg1-arabic` curriculum is rebuilt from the
// Ministry textbook (96 scan pages, all 96 OCR'd). This module is the single
// source of truth for its structure: the three printed units of the first term
// (التهيئة، أنا وأسرتي، الطبيعة من حولي), every printed lesson inside them
// (آداب قاعة النشاط، الوعي البصري…التمهيد للحروف، أنشطة قصة الاستماع، الدرس
// الأول…الخامس، حرف، أغنية، مراجعة، أنا أعبر، أنا تعلمت), and, for every lesson,
// the book's own printed heads, verbatim and with the printed page they start on.
// The self-checks at the bottom prove that mapping against the OCR itself, page
// by page.
//
// THE OFFSET IS ZERO — book page = scan page
// Every content page that carries a folio prints its own number, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here: scan 6 prints
// «٦» (book 6, آداب قاعة النشاط), scan 19 prints «١٩» (book 19), scan 42 prints
// «٤٢» (book 42), scan 51 prints «51» (book 51, in Latin digits), scan 79 prints
// «٧٩» (book 79, الدرس الرابع of unit 3) and scan 95 prints «٩٥» (book 95, the
// unit-3 listening story). The book's own «الفهرس» (scan 4) independently confirms
// the lesson starts.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–4 are before the term: the cover masthead (1), the «مقدمة» (2),
// the robot-guide «من المهم أن تقرأ لطفلك» page (3) and the printed «الفهرس» (4).
// Scan page 96 is after the term: the publisher data page. The term runs from the
// «الْوَحْدَةُ الْأُولَى» opener (book 5 = scan 5) to «أَنَا تَعَلَّمْتُ» of unit 3
// (book 93 = scan 93):
// `EGYPT_ARABIC_KG1_T1_BOOK_START` / `_BOOK_END` are exactly those two pages, and
// the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 93 − 5 + 1 = 89.
//
// TWENTY-FIVE TERM PAGES PRINT NO PARSEABLE FOLIO UNDER THE FOOT RULE
// The three unit openers (books 5/29/62) print their head but no page number.
// Five pages print a folio the OCR misread as bare Latin letters: book 7 («٧» as
// «V» glued to the teacher note), book 8 («٨» as «A» beside the نشاط numbers),
// book 17 («١٧» as «IV»), book 57 («٥٧» as «OV») and book 71 («٧١» as «VI»).
// Seven pages glue their folio to the end of the teacher-note line, which the
// foot rule does not parse: books 13/14/16/18/24/32/47 (their «١٣»/«١٤»/«١٦»/
// «١٨»/«٢٤»/«٣٢»/«٤٧» close the objective bullet instead of standing alone).
// Five pages print their folio beside other numbers the rule also accepts:
// book 40 (its «٤٠» beside the leading نشاط number «8»), book 59 (its «٥٩»
// beside the leading «۸»), book 65 (its «10» beside the نشاط number «٥»),
// book 68 and book 73 (their «٦٨»/«٧٣» beside the «١ ٢ ٣» steps), and book 76
// (its «٧١» beside the نشاط number «٢»). Book 55 prints
// «00» for «٥٥», book 88 prints a «٤ ٣ ٢ ١» countdown with «M», and books 81/93
// carry no folio in the OCR at all. Rather than weaken the page-number check,
// all twenty-five are exempt from it and anchored on a printed head that only
// that page carries (see `FOLIO_LESS_ANCHORS`).
//
// FIVE PAGES PRINT A FOLIO THE OCR MISREAD AS A DIFFERENT NUMBER
// Book 15 («١٥» as «١٠»), book 56 («٥٦» as «01»), book 61 («٦١» as «17»),
// book 64 («٦٤» as «١٤») and book 90 («٩٠» as «9.»);
// those measured values live in `FOOTER_OCR_MISREADS` so the check stays strict
// instead of statistical. Every other parseable footer matches its page number
// exactly — including the extended-digits «۱۰» (book 10) and the Latin «51»
// (book 51).
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// The book prints no per-lesson «أهداف»; its lesson layer is the الفهرس items
// (آداب قاعة النشاط، الوعي البصري…التمهيد للحروف، أنشطة قصة الاستماع، الدرس،
// حرف، أغنية، مراجعة، أنا أعبر، أنا تعلمت) and its activity layer is the نشاط
// heads it prints on the pages themselves. Every concept below is one such head,
// transcribed verbatim from the OCR of the page its `bookFrom` names — including
// the OCR's own vocalisation quirks («الوَعْيُ البَصَرِيُّ»، «رابعا»، «المِيمِ»،
// «أُغْنِيّةُ») — so the page-proves-the-head check compares the transcription
// against the very text it was taken from.
//
// THE LISTENING STORIES LIVE IN A BOOK-WIDE APPENDIX
// The أنشطة قصة الاستماع lessons print their exercises but deliberately not the
// story («قصة الاستماع في نهاية الكتاب»); the two stories are printed in the
// back-matter «قصص استماع الوحدات» (books 94–95, one page per story unit). Each
// such lesson therefore also owns its appendix page through `extraBookPages`, so
// the tutor scoped to that lesson can quote the very story the book points it to.
// The appendix is not a lesson: it stays outside the tiled unit ranges. (The
// التهيئة unit opens with no listening story, so it owns no appendix page.)
//
// THE UNIT OPENER RIDES WITH THE FIRST LESSON
// Each unit opens with a one-page unit title (books 5, 29 and 62) that the
// الفهرس does not list as its own lesson. It is owned by the unit's first lesson
// (آداب قاعة النشاط / أنشطة قصة الاستماع), whose range therefore starts one page
// before the lesson head, exactly as the KG2/Grade-3 books' units do.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N (verified: book p.93 = scan p.93). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the term — the «الْوَحْدَةُ الْأُولَى» opener (scan 5). */
export const EGYPT_ARABIC_KG1_T1_BOOK_START = 5;

/** Last printed page of the term — unit-3 «أَنَا تَعَلَّمْتُ» (scan 93). */
export const EGYPT_ARABIC_KG1_T1_BOOK_END = 93;

/** The scanned pages before the term: cover masthead, مقدمة, robot guide, فهرس. */
export const EGYPT_ARABIC_KG1_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/** The scanned pages after the term: the publisher data page. */
export const EGYPT_ARABIC_KG1_T1_BACK_MATTER = { from: 96, to: 96 } as const;

/**
 * The book-wide listening-story appendix, in book pages: «قصص استماع الوحدات»
 * (books 94–95) holds the two unit listening stories the أنشطة قصة الاستماع
 * lessons point to, one page per story unit.
 */
export const EGYPT_ARABIC_KG1_T1_APPENDIX = { from: 94, to: 95 } as const;

/**
 * The term pages the OCR never produced, in book pages. The corpus holds all
 * 96 scans, so every term page is checked like any other.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of the textbook — becomes one concept in the app tree. */
export interface ArabicKg1T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: lesson-head kind or «نشاط» for activity heads. */
  kind: string;
  /** The printed head, verbatim from the book's OCR. */
  title: string;
}

/** One printed lesson of the textbook — becomes one lesson in the app tree. */
export interface ArabicKg1T1Lesson {
  /** App-addressable key, e.g. "1-3" (unit 1, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson head; "" where the book numbers nothing. */
  ordinal: string;
  /** The lesson's opening head type — its first concept's kind. */
  type: string;
  /** Lesson title as printed (without the الفهرس-only wording). */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: ArabicKg1T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to (its listening story).
   * Kept outside the tiled unit ranges but included in the lesson's RAG document.
   */
  extraBookPages?: number[];
}

/** One printed unit of the book. */
export interface ArabicKg1T1Unit {
  /** Whether this is a numbered unit (all three KG1 sections are units). */
  kind: "unit";
  /** Internal key: "1"…"3". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: التهيئة". */
  title: string;
  /** The section head the opener page prints, e.g. "التَّهْيِئَةُ". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next section's opener). */
  bookTo: number;
  lessons: ArabicKg1T1Lesson[];
}

function concept(bookFrom: number, kind: string, title: string): ArabicKg1T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The three units of the first term with their printed lessons and every printed
 * head, transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 *
 * Lesson starts come from the book's «الفهرس» (scan 4); each lesson's leading
 * concept is the very heading the book prints on the page the lesson starts on,
 * and the book's own vocalisation of those headings is kept verbatim in
 * `title`/`printedHead`/`concepts` even where it disagrees from page to page.
 */
export const EGYPT_ARABIC_KG1_T1_UNITS: ArabicKg1T1Unit[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: التهيئة",
    printedHead: "التَّهْيِئَةُ",
    bookFrom: 5,
    bookTo: 28,
    lessons: [
      {
        key: "1-1",
        ordinal: "",
        type: "آداب",
        title: "آداب قاعة النشاط",
        printedHead: "آدَابُ قَاعَةِ النَّشَاطِ",
        bookFrom: 6,
        concepts: [
          concept(6, "آداب", "آدَابُ قَاعَةِ النَّشَاطِ"),
          concept(6, "نشاط", "كَيْفَ أَتَصَرَّفُ فِي قَاعَةِ النَّشَاطِ؟"),
        ],
      },
      {
        key: "1-2",
        ordinal: "",
        type: "تهيئة",
        title: "الوعي البصري",
        printedHead: "أَوَّلًا : الوَعْيُ البَصَرِيُّ",
        bookFrom: 7,
        concepts: [
          concept(7, "تهيئة", "أَوَّلًا : الوَعْيُ البَصَرِيُّ"),
          concept(7, "نشاط", "نشاط 1 أَصِلُ كُلَّ صُورَةٍ بِاللَّوْنِ المُطَابِقِ لَهَا:"),
          concept(8, "نشاط", "نشاط أَصِلُ كُلَّ صُورَةٍ بِظِلِّهَا الصَّحِيحِ:"),
          concept(9, "نشاط", "نشاط 0 أَبْحَثُ عَنِ الْأَشْيَاءِ التَّالِيَةِ فِي الصُّورَةِ، وَأَضَعُ عَلَامَةَ (√) عِنْدَمَا أَجِدُهَا:"),
          concept(10, "نشاط", "نشاط أضَعُ دَائِرَةً حَوْلَ الكَائِنِ الأَصْغَرِ:"),
          concept(11, "نشاط", "نشاط ٨ أصلُ؛ لِأُكَوِّنَ شَكْلَ كُلِّ حَيَوَانٍ:"),
        ],
      },
      {
        key: "1-3",
        ordinal: "",
        type: "تهيئة",
        title: "الوعي الصوتي",
        printedHead: "ثَانِيًا: الْوَعْيُ الصَّوْتِيُّ",
        bookFrom: 12,
        concepts: [
          concept(12, "تهيئة", "ثَانِيًا: الْوَعْيُ الصَّوْتِيُّ"),
          concept(12, "نشاط", "نَشَاط (١) أَسْتَمِعُ، وَأَضَعُ دَائِرَةً حَوْلَ الصُّورَةِ الَّتِي تُمَثِّلُ مَصْدَرَ الصَّوْتِ:"),
          concept(13, "نشاط", "نشاط ٣ أَسْتَمِعُ إِلَى الْأَصْوَاتِ، وَأُقَلِّدُهَا:"),
          concept(14, "نشاط", "نشاط ٤ أَنْطِقُ، وَأَرْسُمُ دَائِرَةً حَوْلَ الصُّورَةِ الَّتِي تَبْدَأُ بِنَفْسِ الصَّوْتِ:"),
          concept(15, "نشاط", "نشاط ٥ أَنْطِقُ، وَأُلَوِّنُ الصُّورَةَ الَّتِي تَبْدَأُ بِصَوْتٍ مُخْتَلِفٍ:"),
        ],
      },
      {
        key: "1-4",
        ordinal: "",
        type: "تهيئة",
        title: "مهارات الإدراك",
        printedHead: "ثَالِثًا: مَهَارَاتُ الْإِدْرَاكِ",
        bookFrom: 16,
        concepts: [
          concept(16, "تهيئة", "ثَالِثًا: مَهَارَاتُ الْإِدْرَاكِ"),
          concept(16, "نشاط", "نَشَاط (١) أَصِلُ الصُّورَةَ بِمَكَانِهَا الصَّحِيحِ:"),
          concept(17, "نشاط", "نشاط (٣) أُلاحِظُ، وَأُلَوِّنُ بِنَفْسِ النَّمَطِ:"),
          concept(18, "نشاط", "نشاط ٥ أُلَوِّنُ الْأَدَاةَ الْمُنَاسِبَةَ:"),
          concept(19, "نشاط", "نشاط ٦ أصلُ وَسِيلَةَ الْمُوَاصَلَاتِ بِمَكَانِهَا الْمُنَاسِبِ:"),
        ],
      },
      {
        key: "1-5",
        ordinal: "",
        type: "تهيئة",
        title: "الاستعداد للكتابة",
        printedHead: "رابعا : الِاسْتِعْدَادُ لِلْكِتَابَةِ",
        bookFrom: 20,
        concepts: [
          concept(20, "تهيئة", "رابعا : الِاسْتِعْدَادُ لِلْكِتَابَةِ"),
          concept(20, "نشاط", "نشاط 1 أَتَتَبَّعُ الْأَسْهُمَ مِنَ الْيَمِينِ إِلَى الْيَسَارِ؛ لِيَصِلَ كُلُّ كَائِنِ لِبَيْتِهِ:"),
          concept(21, "نشاط", "نشاط ٢ أَتَتَبَّعُ الْأَسْهُمَ مِنَ الْيَمِينِ إِلَى الْيَسَارِ؛ لِيَحْصُلَ كُلُّ كَائِنٍ عَلَى طَعَامِهِ:"),
          concept(22, "نشاط", "نشاط ٣ أصلُ كُلَّ حَيَوَانٍ بِالطَّعَامِ الْخَاصِّ بِهِ:"),
          concept(23, "نشاط", "نشاط ٥ أصلُ النِّقَاطَ؛ لأُكَوِّنَ الصُّورَةَ، ثُمَّ أُلَوِّنَهَا:"),
          concept(24, "نشاط", "نشاط ٧ أُلاحِظُ الْخُطُوطَ، وَأَرْسُمُها:"),
        ],
      },
      {
        key: "1-6",
        ordinal: "",
        type: "تهيئة",
        title: "مهارة التحدث",
        printedHead: "خَامِسًا: مَهَارَةُ التَّحَدُّثِ",
        bookFrom: 25,
        concepts: [
          concept(25, "تهيئة", "خَامِسًا: مَهَارَةُ التَّحَدُّثِ"),
          concept(25, "نشاط", "نَشاط ١ أُلاحِظُ أَصْدِقاءَ الْفَلَّاحِ بِالْمَزْرَعَةِ، وَأَنْطِقُ اسْمَ كُلِّ مِنْهَا:"),
          concept(26, "نشاط", "نشاط ٣ عَبِّرْ عَنِ الصُّوَرِ التَّالِيَةِ:"),
        ],
      },
      {
        key: "1-7",
        ordinal: "",
        type: "تهيئة",
        title: "التمهيد لتعلم الحروف العربية",
        printedHead: "سَادِسًا: التَّمْهِيدُ لِتَعَلُّمِ الْحُرُوفِ الْعَرَبِيَّةِ",
        bookFrom: 27,
        concepts: [
          concept(27, "تهيئة", "سَادِسًا: التَّمْهِيدُ لِتَعَلُّمِ الْحُرُوفِ الْعَرَبِيَّةِ"),
          concept(27, "نشاط", "نَشاط (١) أَخْتَارُ الشَّكْلَ الَّذِي يَتَّجِهُ مِنَ الْيَمِينِ إِلَى الْيَسَارِ:"),
          concept(28, "نشاط", "نشاط أَرْسُمُ فِي الْهَوَاءِ:"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: أنا وأسرتي",
    printedHead: "أَنَا وَأُسْرَتِي",
    bookFrom: 29,
    bookTo: 61,
    lessons: [
      {
        key: "2-1",
        ordinal: "",
        type: "أنشطة قصة الاستماع",
        title: "أسرتي الحبيبة",
        printedHead: "أَنْشِطَةُ قِصَّةِ الِاسْتِمَاعِ أُسْرَتِي الحَبِيبَةُ",
        bookFrom: 30,
        concepts: [
          concept(30, "أنشطة قصة الاستماع", "أَنْشِطَةُ قِصَّةِ الِاسْتِمَاعِ أُسْرَتِي الحَبِيبَةُ"),
          concept(30, "نشاط", "نشاط 1 أُلَوِّنُ، مَاذَا فَعَلَ بَاسِمُ فِي القِصَّةِ:"),
        ],
        extraBookPages: [94],
      },
      {
        key: "2-2",
        ordinal: "الأول",
        type: "الدرس",
        title: "هذا أنا",
        printedHead: "الدَّرْسُ الأَوَّلُ هَذَا أَنَا",
        bookFrom: 31,
        concepts: [
          concept(31, "الدرس", "الدَّرْسُ الأَوَّلُ هَذَا أَنَا"),
          concept(31, "نشاط", "نَشاط (١) أَتَعَرَّفُ عَلَى صَدِيقَيَّ (مَرْيَم وَيَحْيَى):"),
          concept(32, "نشاط", "نشاط ٤ أَرْسُمُ شَيْئًا أُحِبُّهُ، وَأُشَارِكُ أَصْحَابِي:"),
        ],
      },
      {
        key: "2-3",
        ordinal: "",
        type: "حرف",
        title: "حرف الألف",
        printedHead: "حَرْفُ الْأَلِفِ",
        bookFrom: 33,
        concepts: [
          concept(33, "حرف", "حَرْفُ الْأَلِفِ"),
          concept(33, "نشاط", "نَشاط ١ أُلاحِظُ حَرْفَ الْأَلِفِ، وَأُلَوِّنُ:"),
          concept(34, "نشاط", "نشاط ٣ أَنْطِقُ، وَأُمَيِّزُ الْكَلِمَاتِ الَّتِي بِهَا حَرْفُ (أ):"),
          concept(35, "نشاط", "نشاط ٦ أَكْتُبُ حَرْفَ الْأَلِفِ:"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الثاني",
        type: "الدرس",
        title: "أمي وأبي",
        printedHead: "الدَّرْسُ الثَّاني أُمِّي وَأَبِي",
        bookFrom: 36,
        concepts: [
          concept(36, "الدرس", "الدَّرْسُ الثَّاني أُمِّي وَأَبِي"),
          concept(36, "نشاط", "نَشاط (١) أَتَعَرَّفُ أُمِّي وَأَبِي:"),
          concept(37, "نشاط", "نشاط ٤ أَرْسُمُ وَأُعَرِّفُ أَبِي وَأُمِّي لِأَصْحَابِي:"),
        ],
      },
      {
        key: "2-5",
        ordinal: "",
        type: "حرف",
        title: "حرف الباء",
        printedHead: "حَرْفُ الْبَاءِ",
        bookFrom: 38,
        concepts: [
          concept(38, "حرف", "حَرْفُ الْبَاءِ"),
          concept(38, "نشاط", "نَشاط ١ أُلاحِظُ حَرْفَ الْبَاءِ، وَأُلَوِّنُ:"),
          concept(39, "نشاط", "نشاط ٣ أَنْطِقُ وَأُمَيِّزُ الْكَلِمَاتِ الَّتِي بِهَا حَرْفُ (ب):"),
          concept(40, "نشاط", "نشاط 6 أَكْتُبُ حَرْفَ الْبَاءِ:"),
        ],
      },
      {
        key: "2-6",
        ordinal: "الثالث",
        type: "الدرس",
        title: "إخوتي وألعابي",
        printedHead: "الدَّرْسُ الثَّالِثُ إِخْوَتي وَأَلْعابي",
        bookFrom: 41,
        concepts: [
          concept(41, "الدرس", "الدَّرْسُ الثَّالِثُ إِخْوَتي وَأَلْعابي"),
          concept(41, "نشاط", "نَشاط (١) أَتَعَرَّفُ أَخي وَأُخْتِي:"),
          concept(42, "نشاط", "نشاط ٣: أَرْسُمُ أَلْعَابِي، وَأَعْرِضُ الرَّسْمَ عَلَى أَصْحَابِي:"),
        ],
      },
      {
        key: "2-7",
        ordinal: "",
        type: "حرف",
        title: "حرف الميم",
        printedHead: "حَرْفُ المِيمِ",
        bookFrom: 43,
        concepts: [
          concept(43, "حرف", "حَرْفُ المِيمِ"),
          concept(43, "نشاط", "نشاط 1 أُلاحِظُ حَرْفَ (م)، وَأُلَوِّنُ:"),
          concept(44, "نشاط", "نشاط ٣ أَنْطِقُ وَأُمَيِّزُ الْكَلِمَاتِ الَّتِي بِهَا حَرْفُ (م):"),
          concept(45, "نشاط", "نشاط ٦ أُكْتُبْ حَرْفَ الْمِيمِ:"),
        ],
      },
      {
        key: "2-8",
        ordinal: "الرابع",
        type: "الدرس",
        title: "بيتي الجميل",
        printedHead: "الدَّرْسُ الرَّابِعُ بَيْتِي الْجَمِيلُ",
        bookFrom: 46,
        concepts: [
          concept(46, "الدرس", "الدَّرْسُ الرَّابِعُ بَيْتِي الْجَمِيلُ"),
          concept(46, "نشاط", "نَشاط (١) أَتَعَرَّفُ أَجْزَاءَ الْبَيْتِ الرَّئِيسَةَ:"),
          concept(47, "نشاط", "نشاط ٤ أُلَوِّنُ، وَأُعَرِّفُ أَصْحَابِي بِشَكْلِ بَيْتِي:"),
        ],
      },
      {
        key: "2-9",
        ordinal: "",
        type: "حرف",
        title: "حرف الحاء",
        printedHead: "حَرْفُ الْحَاءِ",
        bookFrom: 48,
        concepts: [
          concept(48, "حرف", "حَرْفُ الْحَاءِ"),
          concept(48, "نشاط", "نَشاط ١ أُلاحِظُ حَرْفَ (ح)، وَأُلَوِّنُ:"),
          concept(49, "نشاط", "نشاط ٣ أَنْطِقُ وَأُمَيِّزُ الْكَلِمَاتِ الَّتِي بِهَا حَرْفُ (ح):"),
          concept(50, "نشاط", "نشاط ٦ أَكْتُبُ حَرْفَ الْحَاءِ:"),
        ],
      },
      {
        key: "2-10",
        ordinal: "الخامس",
        type: "الدرس",
        title: "جدي وجدتي",
        printedHead: "الدَّرْسُ الْخَامِسُ جَدِّي وَجَدَّتِي",
        bookFrom: 51,
        concepts: [
          concept(51, "الدرس", "الدَّرْسُ الْخَامِسُ جَدِّي وَجَدَّتِي"),
          concept(51, "نشاط", "نشاط 1 أَتَعَرَّفُ جَدِّي وَجَدَّتِي:"),
          concept(52, "نشاط", "نشاط أُحَدِّدُ أَنْشِطَتِي الْمُفَضَّلَةَ مَعَ جَدِّي وَجَدَّتِي، وَأُشَارِكُ أَصْحَابِي:"),
        ],
      },
      {
        key: "2-11",
        ordinal: "",
        type: "حرف",
        title: "حرف الجيم",
        printedHead: "حَرْفُ الْجِيمِ",
        bookFrom: 53,
        concepts: [
          concept(53, "حرف", "حَرْفُ الْجِيمِ"),
          concept(53, "نشاط", "نَشاط (١) أُلاحِظُ حَرْفَ (ج)، وَأُلَوِّنُ:"),
          concept(54, "نشاط", "نشاط ٣ أَنْطِقُ وَأُمَيِّزُ الْكَلِمَاتِ الَّتِي بِهَا حَرْفُ (ج):"),
          concept(55, "نشاط", "نشاط أَكْتُبُ حَرْفَ الْجِيمِ:"),
        ],
      },
      {
        key: "2-12",
        ordinal: "",
        type: "أغنية",
        title: "أسرتي",
        printedHead: "أُغْنِيّةُ أُسْرَتِي",
        bookFrom: 56,
        concepts: [concept(56, "أغنية", "أُغْنِيّةُ أُسْرَتِي")],
      },
      {
        key: "2-13",
        ordinal: "",
        type: "حرف",
        title: "حرف الدال",
        printedHead: "حَرْفُ الدَّالِ",
        bookFrom: 57,
        concepts: [
          concept(57, "حرف", "حَرْفُ الدَّالِ"),
          concept(57, "نشاط", "نشاط 1 أُلَاحِظُ حَرْفَ (د)، وَأُلَوِّنُ:"),
          concept(58, "نشاط", "نشاط ٣ أَنْطِقُ وَأُمَيِّزُ الْكَلِمَاتِ الَّتِي بِهَا حَرْفُ (د):"),
          concept(59, "نشاط", "نشاط 1 أَكْتُبُ حَرْفَ الدَّالِ:"),
        ],
      },
      {
        key: "2-14",
        ordinal: "",
        type: "أنا أعبر",
        title: "أنا أعبر",
        printedHead: "أَنَا أُعَبِّرُ",
        bookFrom: 60,
        concepts: [
          concept(60, "أنا أعبر", "أَنَا أُعَبِّرُ"),
          concept(60, "نشاط", "نشاط (١) أُعَرِّفُ نَفْسِي لِلْآخَرِينَ:"),
        ],
      },
      {
        key: "2-15",
        ordinal: "",
        type: "أنا تعلمت",
        title: "أنا تعلمت",
        printedHead: "أَنَا تَعَلَّمْتُ",
        bookFrom: 61,
        concepts: [
          concept(61, "أنا تعلمت", "أَنَا تَعَلَّمْتُ"),
          concept(61, "نشاط", "نَشَاط 1 أُلَوِّنُ الْحُرُوفَ الَّتِي تَعَلَّمْتُهَا:"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الطبيعة من حولي",
    printedHead: "الطَّبِيعَةُ مِنْ حَوْلِي",
    bookFrom: 62,
    bookTo: 93,
    lessons: [
      {
        key: "3-1",
        ordinal: "",
        type: "أنشطة قصة الاستماع",
        title: "رحلة أرنوب في الطبيعة",
        printedHead: "أَنْشِطَةُ قِصَّةِ الِاسْتِمَاعِ رِحْلَةُ أَرْنُوبٍ فِي الطَّبِيعَةِ",
        bookFrom: 63,
        concepts: [
          concept(63, "أنشطة قصة الاستماع", "أَنْشِطَةُ قِصَّةِ الِاسْتِمَاعِ رِحْلَةُ أَرْنُوبٍ فِي الطَّبِيعَةِ"),
          concept(63, "نشاط", "نَشاط (١) أُلَوِّنُ الْأَشْيَاءَ الَّتِي شَاهَدَهَا أَرْنُوبُ فِي الطَّبِيعَةِ:"),
        ],
        extraBookPages: [95],
      },
      {
        key: "3-2",
        ordinal: "الأول",
        type: "الدرس",
        title: "الزهور والألوان",
        printedHead: "الدَّرْسُ الأَوَّلُ الزُّهُورُ وَالأَلْوَانُ",
        bookFrom: 64,
        concepts: [
          concept(64, "الدرس", "الدَّرْسُ الأَوَّلُ الزُّهُورُ وَالأَلْوَانُ"),
          concept(64, "نشاط", "نَشاط (١) أَتَعَرَّفُ الزُّهُورَ الْجَمِيلَةَ وَأَلْوَانَهَا:"),
          concept(65, "نشاط", "نشاط ٣ نَتَحَدَّثُ عَنْ أَهَمِّيَّةِ الزُّهُورِ فِي حَيَاتِنَا:"),
        ],
      },
      {
        key: "3-3",
        ordinal: "",
        type: "حرف",
        title: "حرف الخاء",
        printedHead: "حَرْفُ الْخَاءِ",
        bookFrom: 66,
        concepts: [
          concept(66, "حرف", "حَرْفُ الْخَاءِ"),
          concept(66, "نشاط", "نَشاط (١) أُلاحِظُ حَرْفَ الْخَاءِ، ثُمَّ أُلَوِّنُ:"),
          concept(67, "نشاط", "نشاط ٣ أَنْطِقُ وَأَصِلُ حَرْفَ (خ) بِالصُّوَرِ الَّتِي بِهَا صَوْتُهُ:"),
          concept(68, "نشاط", "نشاط ٦ أَكْتُبُ حَرْفَ الْخَاءِ:"),
        ],
      },
      {
        key: "3-4",
        ordinal: "الثاني",
        type: "الدرس",
        title: "أشجار خضراء",
        printedHead: "الدَّرْسُ الثَّانِي أَشْجَارٌ خَضْرَاءُ",
        bookFrom: 69,
        concepts: [
          concept(69, "الدرس", "الدَّرْسُ الثَّانِي أَشْجَارٌ خَضْرَاءُ"),
          concept(69, "نشاط", "نَشَاط (١) أَتَعَرَّفُ أَنْوَاعَ الْأَشْجَارِ:"),
          concept(70, "نشاط", "نشاط ٣ نَتَعَرَّفُ أَجْزَاءَ الشَّجَرَةِ، ثُمَّ نَصِلُهَا بِمَكَانِهَا بِالشَّجَرَةِ:"),
        ],
      },
      {
        key: "3-5",
        ordinal: "",
        type: "حرف",
        title: "حرف التاء",
        printedHead: "حَرْفُ التَّاءِ",
        bookFrom: 71,
        concepts: [
          concept(71, "حرف", "حَرْفُ التَّاءِ"),
          concept(71, "نشاط", "نَشاط ١ أُلاحِظُ حَرْفَ التَّاءِ، ثُمَّ أُلَوِّنُ:"),
          concept(72, "نشاط", "نشاط ٣ أَنْطِقُ وَأَصِلُ حَرْفَ (ت) بِالصُّوَرِ الَّتِي بِهَا صَوْتُهُ:"),
          concept(73, "نشاط", "نشاط ٦ أَكْتُبُ حَرْفَ التَّاءِ:"),
        ],
      },
      {
        key: "3-6",
        ordinal: "الثالث",
        type: "الدرس",
        title: "الشمس والقمر",
        printedHead: "الدَّرْسُ الثَّالِثُ الشَّمْسُ وَالْقَمَرُ",
        bookFrom: 74,
        concepts: [
          concept(74, "الدرس", "الدَّرْسُ الثَّالِثُ الشَّمْسُ وَالْقَمَرُ"),
          concept(74, "نشاط", "نَشاط (١) أَتَعَرَّفُ الشَّمْسَ وَالْقَمَرَ:"),
          concept(75, "نشاط", "نشاط ٤ نُقَلِّدُ حَرَكَةَ الشَّمْسِ وَالْقَمَرِ عِنْدَ الْإِشَارَةِ إِلَى الصُّورَةِ:"),
        ],
      },
      {
        key: "3-7",
        ordinal: "",
        type: "حرف",
        title: "حرف اللام",
        printedHead: "حَرْفُ اللَّامِ",
        bookFrom: 76,
        concepts: [
          concept(76, "حرف", "حَرْفُ اللَّامِ"),
          concept(76, "نشاط", "نشاط أُلاحِظُ حَرْفَ اللَّامِ، وَأُلَوِّنُ:"),
          concept(77, "نشاط", "نشاط (٣) أَنْطِقُ وَأَصِلُ حَرْفَ (ل) بِالصُّوَرِ الَّتِي بِهَا صَوْتُهُ:"),
          concept(78, "نشاط", "نشاط ٦ أُكْتُبُ حَرْفَ اللَّامِ:"),
        ],
      },
      {
        key: "3-8",
        ordinal: "الرابع",
        type: "الدرس",
        title: "البحر",
        printedHead: "الدَّرْسُ الرَّابِعُ الْبَحْرُ",
        bookFrom: 79,
        concepts: [
          concept(79, "الدرس", "الدَّرْسُ الرَّابِعُ الْبَحْرُ"),
          concept(79, "نشاط", "نَشاط (١) أَتَعَرَّفُ الْبَحْرَ:"),
          concept(80, "نشاط", "نشاط ٤ نَتَخَيَّلُ وَنُقَلِّدُ الْحَرَكَاتِ:"),
        ],
      },
      {
        key: "3-9",
        ordinal: "",
        type: "حرف",
        title: "حرف السين",
        printedHead: "حَرْفُ السِّينِ",
        bookFrom: 81,
        concepts: [
          concept(81, "حرف", "حَرْفُ السِّينِ"),
          concept(81, "نشاط", "نشاط 1 أُلَاحِظُ حَرْفَ السِّينِ، ثُمَّ أُلَوِّنُهُ:"),
          concept(82, "نشاط", "نشاط ٣ أَنْطِقُ وَأَصِلُ حَرْفَ (س) بِالصُّوَرِ الَّتِي بِهَا صَوْتُهُ:"),
          concept(83, "نشاط", "نشاط ٦ أكتبُ حَرفَ السِّينِ:"),
        ],
      },
      {
        key: "3-10",
        ordinal: "الخامس",
        type: "الدرس",
        title: "أنا أزرع",
        printedHead: "الدَّرْسُ الْخَامِسُ أَنَا أَزْرَعُ",
        bookFrom: 84,
        concepts: [
          concept(84, "الدرس", "الدَّرْسُ الْخَامِسُ أَنَا أَزْرَعُ"),
          concept(84, "نشاط", "نَشَاط ١ أَتَعَرَّفُ كَيْفَ نَزْرَعُ:"),
          concept(85, "نشاط", "نشاط ٣ نَحْكِي قِصَّةَ (بِذْرَةِ الذُّرَةِ):"),
        ],
      },
      {
        key: "3-11",
        ordinal: "",
        type: "حرف",
        title: "حرف النون",
        printedHead: "حَرْفُ النُّونِ",
        bookFrom: 86,
        concepts: [
          concept(86, "حرف", "حَرْفُ النُّونِ"),
          concept(86, "نشاط", "نَشاط (١) أُلاحِظُ حَرْفَ (ن)، ثُمَّ أُلَوِّنُهُ:"),
          concept(87, "نشاط", "نشاط ٣ أَنْطِقُ وَأَصِلُ حَرْفَ (ن) بِالصُّوَرِ الَّتِي بِهَا صَوْتُهُ:"),
          concept(88, "نشاط", "نَشاط ٦ أَكْتُبُ حَرْفَ النُّونِ:"),
        ],
      },
      {
        key: "3-12",
        ordinal: "",
        type: "أغنية",
        title: "انظر حولك",
        printedHead: "أُغْنِيَةُ انْظُرْ حَوْلَكَ",
        bookFrom: 89,
        concepts: [concept(89, "أغنية", "أُغْنِيَةُ انْظُرْ حَوْلَكَ")],
      },
      {
        key: "3-13",
        ordinal: "",
        type: "مراجعة",
        title: "مراجعة",
        printedHead: "مُرَاجَعَةٌ",
        bookFrom: 90,
        concepts: [
          concept(90, "مراجعة", "مُرَاجَعَةٌ"),
          concept(90, "نشاط", "نشاط 1 أُلَوِّنُ الْحُرُوفَ الْمُتَشَابِهَةَ بِنَفْسِ اللَّوْنِ:"),
          concept(91, "نشاط", "نشاط (٣) أَنْطِقُ، وَأَضَعُ دَائِرَةً حَوْلَ الصُّورَةِ الْمُنَاسِبَةِ:"),
        ],
      },
      {
        key: "3-14",
        ordinal: "",
        type: "أنا أعبر",
        title: "أنا أعبر",
        printedHead: "أَنَا أُعَبِّرُ",
        bookFrom: 92,
        concepts: [
          concept(92, "أنا أعبر", "أَنَا أُعَبِّرُ"),
          concept(92, "نشاط", "نَشَاط ١ أَنَا أُحِبُّ الطَّبِيعَةَ:"),
        ],
      },
      {
        key: "3-15",
        ordinal: "",
        type: "أنا تعلمت",
        title: "أنا تعلمت",
        printedHead: "أَنَا تَعَلَّمْتُ",
        bookFrom: 93,
        concepts: [
          concept(93, "أنا تعلمت", "أَنَا تَعَلَّمْتُ"),
          concept(93, "نشاط", "نَشَاط (١) أَصِلُ الصُّورَةَ بِمَكَانِهَا الْمُنَاسِبِ فِي الطَّبِيعَةِ:"),
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
  const unit = EGYPT_ARABIC_KG1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ARABIC_KG1_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * The appendix page(s) each lesson points to, keyed by the lesson key (`2-1` →
 * `[94]`). The أنشطة قصة الاستماع lessons print their exercises but not the
 * story; the stories are printed in the back-matter «قصص استماع الوحدات» (books
 * 94–95, one page per story unit). The stage appends these pages so the student
 * reads the very page the tutor quotes from.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const unit of EGYPT_ARABIC_KG1_T1_UNITS) {
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
  "arabic-kg1-t1",
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
 * it points to (its listening story). The lesson's own pages come first.
 */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const range = lessonBookRange(unitIndex, lessonIndex);
  const lesson = EGYPT_ARABIC_KG1_T1_UNITS[unitIndex]!.lessons[lessonIndex]!;
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
 * Page-number candidates a content page prints at its foot. This book's foot is a
 * bare numeral on its own line («٦»، «١٤»، «51»), sometimes leading the teacher
 * note («٤٤ ينطق …»، «٦٨ يكتب …»), so the last five lines are scanned and every
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
 * its page number exactly (including the extended-digits «۱۰» on book 10 and the
 * Latin «51» on book 51), which is what fixes the offset. Listing the exceptions
 * keeps the check strict instead of statistical.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {
  15: 10,
  56: 1,
  61: 17,
  64: 14,
  90: 9,
};

/**
 * The term pages that print no parseable folio under the foot rule, each with
 * the anchor the check accepts in place of a page number. Every anchor is a head
 * the page itself prints: books 5/29/62 (the unit openers, which print no
 * number), books 7/8/17/57/71 (their folio misread as bare Latin letters «V»/
 * «A»/«IV»/«OV»/«VI»), books 13/14/16/18/24/32/47 (their folio glued to the end
 * of the teacher-note line), books 40/59/65/68/73/76 (their folio beside another
 * number the rule also accepts), book 55 («٥٥» as «00»), book 88 (its countdown
 * «٤ ٣ ٢ ١» with «M») and books 81/93 (no folio in the OCR at all).
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  5: "التَّهْيِئَةُ",
  7: "الوَعْيُ البَصَرِيُّ",
  8: "أَصِلُ كُلَّ صُورَةٍ بِظِلِّهَا الصَّحِيحِ",
  13: "وَأُقَلِّدُهَا",
  14: "بِنَفْسِ الصَّوْتِ",
  16: "بِمَكَانِهَا الصَّحِيحِ",
  17: "بِنَفْسِ النَّمَطِ",
  18: "الْأَدَاةَ الْمُنَاسِبَةَ",
  24: "وَأَرْسُمُها",
  29: "أَنَا وَأُسْرَتِي",
  32: "بَصْمَةِ",
  40: "أَكْتُبُ حَرْفَ الْبَاءِ",
  47: "مِفْتَاحَ بَيْتِكَ",
  55: "أَكْتُبُ حَرْفَ الْجِيمِ",
  57: "حَرْفُ الدَّالِ",
  59: "أَكْتُبُ حَرْفَ الدَّالِ",
  62: "الطَّبِيعَةُ مِنْ حَوْلِي",
  65: "زَهْرِيَّةٍ",
  68: "أَكْتُبُ حَرْفَ الْخَاءِ",
  71: "حَرْفُ التَّاءِ",
  73: "أَكْتُبُ حَرْفَ التَّاءِ",
  76: "أُلاحِظُ حَرْفَ اللَّامِ، وَأُلَوِّنُ",
  81: "حَرْفُ السِّينِ",
  88: "أَكْتُبُ حَرْفَ النُّونِ",
  93: "بِمَكَانِهَا الْمُنَاسِبِ",
};

/** Every head kind the table may use: the lesson-head kinds plus «نشاط». */
const KNOWN_KINDS = new Set([
  "آداب",
  "تهيئة",
  "أنشطة قصة الاستماع",
  "الدرس",
  "حرف",
  "أغنية",
  "مراجعة",
  "أنا أعبر",
  "أنا تعلمت",
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
  const units = EGYPT_ARABIC_KG1_T1_UNITS;
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
        if (page < EGYPT_ARABIC_KG1_T1_APPENDIX.from || page > EGYPT_ARABIC_KG1_T1_APPENDIX.to) {
          problems.push(
            `الدرس ${lesson.key}: صفحة ملحقة ${page} خارج ملحق الكتاب ${EGYPT_ARABIC_KG1_T1_APPENDIX.from}–${EGYPT_ARABIC_KG1_T1_APPENDIX.to}`,
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
  if (first && first.bookFrom !== EGYPT_ARABIC_KG1_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ARABIC_KG1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ARABIC_KG1_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ARABIC_KG1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio (allowing the measured OCR misreads), or, on the pages that
 *     print no parseable folio, from the anchor named in
 *     `FOLIO_LESS_ANCHORS`;
 *  2. every section opener prints the section head and every lesson's first page
 *     prints that lesson's head;
 *  3. every lesson's title and every concept's head is printed on the pages the
 *     lesson owns (the concept on its own page), and every appendix page a
 *     lesson points to prints that lesson's story;
 *  4. every printed page in [5, 93] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_ARABIC_KG1_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ARABIC_KG1_T1_BOOK_START || book > EGYPT_ARABIC_KG1_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_ARABIC_KG1_T1_BOOK_END - EGYPT_ARABIC_KG1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ARABIC_KG1_T1_BOOK_START} و${EGYPT_ARABIC_KG1_T1_BOOK_END}`,
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

  // 3c. every appendix page a lesson points to prints that lesson's story.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const extras = lesson.extraBookPages ?? [];
      if (!extras.length) return;
      const texts = extras.map((page) => loadBookPage(page));
      extras.forEach((page, i) => {
        if (!texts[i]) problems.push(`الدرس ${lesson.key}: صفحة الملحق ${page} بلا نص OCR`);
      });
      if (!normalize(texts.join("\n")).includes(normalize(lesson.title))) {
        problems.push(`الدرس ${lesson.key}: صفحات الملحق ${extras.join(",")} لا تطبع «${lesson.title}»`);
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
  for (let p = EGYPT_ARABIC_KG1_T1_BOOK_START; p <= EGYPT_ARABIC_KG1_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
