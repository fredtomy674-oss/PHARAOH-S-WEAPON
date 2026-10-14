// PHASE 139 — official Egypt KG2 (رياض أطفال 2, المستوى الثاني) Arabic language
// («اللغة العربية» — رياض الأطفال، المستوى الثاني، الفصل الدراسي الأول)،
// 2025/2026 edition.
//
// The curriculum tree for the Egypt `eg-kg2-arabic` curriculum is rebuilt from the
// Ministry textbook (114 scan pages, all 114 OCR'd). This module is the single
// source of truth for its structure: the two intro sections («آدَابُ قَاعَةِ
// النَّشَاطِ» and «التَّهْيِئَةُ»), the three printed units of the first term
// (غذائي، أدواتي وألعابي، وسائل المواصلات), every printed lesson inside them
// (أنشطة قصة الاستماع، الدرس الأول…الخامس، حرف، أغنية، مراجعة، أنا أعبر، أنا
// تعلمت), and, for every lesson, the book's own printed heads, verbatim and with
// the printed page they start on. The self-checks at the bottom prove that
// mapping against the OCR itself, page by page.
//
// THE OFFSET IS ONE — book page = scan page − 1
// Every content page that carries a folio prints its own number, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here: scan 7 prints
// «٦» (book 6, التهيئة), scan 14 prints «۱۳» (book 13, الدرس الأول, in extended
// Arabic-Indic digits), scan 20 prints «19» (book 19, in Latin digits), scan 42
// prints «٤١» (book 41, حرف الدال), scan 80 prints «٧٩» (book 79, الدرس الأول of
// unit 3) and scan 109 prints «١٠٨» (book 108, أنا تعلمت). The book's own
// «الفهرس» (scan 5) independently confirms the lesson starts.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–5 are before the term: the cover (1), the credits masthead (2),
// the «مقدمة» (3), the robot-guide «من المهم أن تقرأ لطفلك» page (4) and the
// printed «الفهرس» (5). Scan pages 110–114 are after the term: the book-wide
// «قصص استماع الوحدات» appendix (books 109–111 = scans 110–112, one listening
// story per unit), the publisher data page (113) and the back cover (114). The
// term runs from «آدَابُ قَاعَةِ النَّشَاطِ» (book 5 = scan 6) to «أَنَا
// تَعَلَّمْتُ» of unit 3 (book 108 = scan 109):
// `EGYPT_ARABIC_KG2_T1_BOOK_START` / `_BOOK_END` are exactly those two pages, and
// the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 108 − 5 + 1 = 104.
//
// FIFTEEN TERM PAGES PRINT NO PARSEABLE FOLIO UNDER THE FOOT RULE
// The three unit openers (books 11/44/77) print their head but no page number.
// Four pages print a folio the OCR misread as bare Latin letters: book 7 («٧» as
// «V»), book 17 («١٧» as «IV»), book 71 («٧١» as «VI») and book 76 («٧٦» as
// «VI»). Four pages glue their folio to the end of the teacher-note line, which
// the foot rule does not parse: books 8/42/52/80/90 (their «٨»/«٤٢»/«٥٢»/«٨٠»/
// «٩٠» close the objective bullet instead of standing alone). Book 26 carries no
// folio in the OCR at all. Two pages print a correct folio beside a second
// number the rule also accepts: book 28 (its «٢٨» plus the lone نشاط number «٣»)
// and book 94 (its «٩٤» plus the passport stamp «24 APR 2025»). Rather than
// weaken the page-number check, all fifteen are exempt from it and anchored on a
// printed head that only that page carries (see `FOLIO_LESS_ANCHORS`). Every
// other parseable footer matches its page number exactly — including the
// extended-digits «۱۳» (book 13) and the Latin «19»/«96» (books 19/96) — so
// `FOOTER_OCR_MISREADS` is empty.
//
// THE «حَرْفُ السِّينِ» HEAD IS TRANSCRIBED VERBATIM FROM THE OCR
// The unit-2 السين lesson opener (book 63 = scan 64) heads itself «حَرْفُ
// الشِّينِ» in the OCR while every نشاط line on its three pages — and the
// الفهرس («حرف السين ٦٣») — says السين. The lesson keeps the OCR-verbatim head
// as its `printedHead` and the book's own «حرف السين» as its title; both checks
// pass because the title is printed in the نشاط lines of the same range.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// The book prints no per-lesson «أهداف»; its lesson layer is the الفهرس items
// (أنشطة قصة الاستماع، الدرس، حرف، أغنية، مراجعة، أنا أعبر، أنا تعلمت) and its
// activity layer is the band heads it prints on the pages themselves (نشاط ١…١٠،
// شهادة الإنجاز، أنا أعبر، أنا تعلمت، أتحدث مع أصحابي، أنا وأسرتي، ألعب مع
// أصحابي). Every concept below is one such head, transcribed verbatim from the
// OCR of the page its `bookFrom` names — including the OCR's own vocalisation
// quirks («الْكَلِماتِ»، «دائِرَةً»، «الْمُناسِبِ») — so the page-proves-the-head
// check compares the transcription against the very text it was taken from.
//
// THE LISTENING STORIES LIVE IN A BOOK-WIDE APPENDIX
// The أنشطة قصة الاستماع lessons print their exercises but deliberately not the
// story («قصة الاستماع في نهاية الكتاب»); the three stories are printed in the
// back-matter «قصص استماع الوحدات» (books 109–111, one page per unit). Each such
// lesson therefore also owns its appendix page through `extraBookPages`, so the
// tutor scoped to that lesson can quote the very story the book points it to.
// The appendix is not a lesson: it stays outside the tiled unit ranges.
//
// THE UNIT OPENER RIDES WITH THE FIRST LESSON
// Each unit opens with a one-page unit title (books 11, 44 and 77) that the
// الفهرس does not list as its own lesson. It is owned by the unit's first
// (أنشطة قصة الاستماع) lesson, whose range therefore starts one page before the
// lesson head, exactly as the Grade-1/Grade-3 books' units do.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 1 (verified: book p.108 = scan p.109). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the term — «آدَابُ قَاعَةِ النَّشَاطِ» (scan 6). */
export const EGYPT_ARABIC_KG2_T1_BOOK_START = 5;

/** Last printed page of the term — unit-3 «أَنَا تَعَلَّمْتُ» (scan 109). */
export const EGYPT_ARABIC_KG2_T1_BOOK_END = 108;

/** The scanned pages before the term: cover, credits, مقدمة, robot guide, فهرس. */
export const EGYPT_ARABIC_KG2_T1_FRONT_MATTER = { from: 1, to: 5 } as const;

/** The scanned pages after the term: the story appendix + publisher/back cover. */
export const EGYPT_ARABIC_KG2_T1_BACK_MATTER = { from: 110, to: 114 } as const;

/**
 * The book-wide listening-story appendix, in book pages: «قصص استماع الوحدات»
 * (books 109–111) holds the three unit listening stories the أنشطة قصة
 * الاستماع lessons point to, one page per unit.
 */
export const EGYPT_ARABIC_KG2_T1_APPENDIX = { from: 109, to: 111 } as const;

/**
 * The term pages the OCR never produced, in book pages. The corpus holds all
 * 114 scans, so every term page is checked like any other.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of the textbook — becomes one concept in the app tree. */
export interface ArabicKg2T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: lesson-head kind or «نشاط» for activity/band heads. */
  kind: string;
  /** The printed head, verbatim from the book's OCR. */
  title: string;
}

/** One printed lesson of the textbook — becomes one lesson in the app tree. */
export interface ArabicKg2T1Lesson {
  /** App-addressable key, e.g. "1-3" (unit 1, lesson 3); "tah-1" for التهيئة. */
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
  concepts: ArabicKg2T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to (its listening story).
   * Kept outside the tiled unit ranges but included in the lesson's RAG document.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — an intro section or one of the three units. */
export interface ArabicKg2T1Unit {
  /** Whether this is a numbered unit or a leading intro section. */
  kind: "unit" | "intro";
  /** Internal key: "1"…"3" for units, "adab"/"tah" for the intro sections. */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى"; "" for intro sections. */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: غذائي". */
  title: string;
  /** The section head the opener page prints, e.g. "غذائي". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next section's opener). */
  bookTo: number;
  lessons: ArabicKg2T1Lesson[];
}

function concept(bookFrom: number, kind: string, title: string): ArabicKg2T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The two intro sections and the three units of the first term with their printed
 * lessons and every printed head, transcribed from the pages the book prints them
 * on and checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Lesson starts come from the book's «الفهرس» (scan 5); each lesson's leading
 * concept is the very heading the book prints on the page the lesson starts on,
 * and the book's own vocalisation of those headings is kept verbatim in
 * `title`/`printedHead`/`concepts` even where it disagrees from page to page.
 */
export const EGYPT_ARABIC_KG2_T1_UNITS: ArabicKg2T1Unit[] = [
  {
    key: "adab",
    kind: "intro",
    ordinal: "",
    title: "آداب قاعة النشاط",
    printedHead: "آدَابُ قَاعَةِ النَّشَاطِ",
    bookFrom: 5,
    bookTo: 5,
    lessons: [
      {
        key: "adab-1",
        ordinal: "",
        type: "آداب",
        title: "آداب قاعة النشاط",
        printedHead: "آدَابُ قَاعَةِ النَّشَاطِ",
        bookFrom: 5,
        concepts: [
          concept(5, "آداب", "آدَابُ قَاعَةِ النَّشَاطِ"),
          concept(5, "نشاط", "كَيْفَ أَتَصَرَّفُ فِي قَاعَةِ النَّشَاطِ؟"),
        ],
      },
    ],
  },
  {
    key: "tah",
    kind: "intro",
    ordinal: "",
    title: "التهيئة",
    printedHead: "التَّهْيِئَةُ",
    bookFrom: 6,
    bookTo: 10,
    lessons: [
      {
        key: "tah-1",
        ordinal: "",
        type: "تهيئة",
        title: "التهيئة",
        printedHead: "التَّهْيِئَةُ",
        bookFrom: 6,
        concepts: [
          concept(6, "تهيئة", "أَوَّلًا: الْوَعْيُ الْبَصَرِيُّ"),
          concept(7, "تهيئة", "ثَانِيًا: الْوَعْيُ الصَّوْتِيُّ"),
          concept(8, "تهيئة", "ثَالِثًا: مَهَارَاتُ الْإِدْرَاكِ"),
          concept(9, "تهيئة", "رَابِعًا: الِاسْتِعْدَادُ لِلْكِتَابَةِ"),
          concept(10, "تهيئة", "خَامِسًا: مَهَارَةُ التَّحَدُّثِ"),
        ],
      },
    ],
  },
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: غذائي",
    printedHead: "غذائي",
    bookFrom: 11,
    bookTo: 43,
    lessons: [
      {
        key: "1-1",
        ordinal: "",
        type: "أنشطة قصة الاستماع",
        title: "الوجبة المفضلة لهند",
        printedHead: "أَنْشِطَةُ قِصَّةِ الِاسْتِمَاعِ الْوَجْبَةُ الْمُفَضَّلَةُ لِهِنْدَ",
        bookFrom: 12,
        concepts: [
          concept(12, "أنشطة قصة الاستماع", "أَنْشِطَةُ قِصَّةِ الِاسْتِمَاعِ الْوَجْبَةُ الْمُفَضَّلَةُ لِهِنْدَ"),
          concept(12, "نشاط", "نَشاط (١) أَرْسُمُ دَائِرَةً حَوْلَ الْأَطْعِمَةِ الَّتِي تَنَاوَلَتْهَا هِنْدُ:"),
        ],
        extraBookPages: [109],
      },
      {
        key: "1-2",
        ordinal: "الأول",
        type: "الدرس",
        title: "الفواكه",
        printedHead: "الدَّرْسُ الأَوَّلُ الْفَوَاكِهُ",
        bookFrom: 13,
        concepts: [
          concept(13, "الدرس", "الدَّرْسُ الأَوَّلُ الْفَوَاكِهُ"),
          concept(13, "نشاط", "نشاط 1 أَتَعَرَّفُ بَعْضَ الْفَوَاكِهِ اللَّذِيذَةِ:"),
          concept(14, "نشاط", "نشاط ٣ أَخْتَارُ ثِمَارَ الْفَاكِهَةِ الَّتِي أُحِبُّهَا، وَأَرْسُمُهَا فِي السَّلَّةِ:"),
        ],
      },
      {
        key: "1-3",
        ordinal: "",
        type: "حرف",
        title: "حرف الألف",
        printedHead: "حَرْفُ الْأَلِفِ",
        bookFrom: 15,
        concepts: [
          concept(15, "حرف", "حَرْفُ الْأَلِفِ"),
          concept(15, "نشاط", "نَشاط (١) أُلاحِظُ حَرْفَ الْأَلِفِ، وَأُلَوِّنُ:"),
          concept(16, "نشاط", "نشاط ٤ أَنْطِقُ، وَأُمَيِّزُ أَصْوَاتَ حَرْفِ ( أ ):"),
          concept(17, "نشاط", "نشاط ٧ أكتُبُ حَرْفَ الأَلِفِ:"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الثاني",
        type: "الدرس",
        title: "الخضراوات",
        printedHead: "الدَّرْسُ الثَّانِي الْخَضْرَاوَاتُ",
        bookFrom: 18,
        concepts: [
          concept(18, "الدرس", "الدَّرْسُ الثَّانِي الْخَضْرَاوَاتُ"),
          concept(18, "نشاط", "نَشاط (١) أَتَعَرَّفُ بَعْضَ الْخَضْرَاوَاتِ اللَّذِيذَةَ:"),
          concept(19, "نشاط", "نَطَقَ الخضراواتِ، وَنَصِلُهَا بِأَلْوَانِهَا:"),
        ],
      },
      {
        key: "1-5",
        ordinal: "",
        type: "حرف",
        title: "حرف الباء",
        printedHead: "حَرْفُ الْبَاءِ",
        bookFrom: 20,
        concepts: [
          concept(20, "حرف", "حَرْفُ الْبَاءِ"),
          concept(20, "نشاط", "نَشاط (٣) أَبْحَثُ عَنْ حَرْفِ (ب - ب - ب - ب) فِي الْكَلِمَاتِ، وَأَضَعُ دَائِرَةً حَوْلَهُ:"),
          concept(21, "نشاط", "نشاط ٥ أَصِلُ الصُّورَةَ بِصَوْتِ حَرْفِ (ب) الْمُنَاسِبِ:"),
          concept(22, "نشاط", "نشاط ٩ أَنْطِقُ الْحُرُوفَ؛ لِأُكَوِّنَ كَلِمَةً:"),
        ],
      },
      {
        key: "1-6",
        ordinal: "الثالث",
        type: "الدرس",
        title: "الألبان",
        printedHead: "الدَّرْسُ الثَّالِثُ الأَلْبَانُ",
        bookFrom: 23,
        concepts: [
          concept(23, "الدرس", "الدَّرْسُ الثَّالِثُ الأَلْبَانُ"),
          concept(23, "نشاط", "نَشاط (٢) أَصِلُ صُوَرَ مُنْتَجَاتِ الأَلْبَانِ بِطَرِيقَةِ تَنَاوُلِهَا:"),
          concept(24, "نشاط", "نشاط ٥ أُمَيِّزُ مُنْتَجَاتِ الْأَلْبَانِ، وَأَضَعُ عَلَامَةَ (✓) أَسْفَلَهَا:"),
        ],
      },
      {
        key: "1-7",
        ordinal: "",
        type: "حرف",
        title: "حرف الميم",
        printedHead: "حَرْفُ الْمِيمِ",
        bookFrom: 25,
        concepts: [
          concept(25, "حرف", "حَرْفُ الْمِيمِ"),
          concept(25, "نشاط", "نَشاط ٣ أَبْحَثُ عَنْ حَرْفِ (م - مـ - ـمـ - ـم) فِي الْكَلِمَاتِ، وَأَضَعُ دَائِرَةً حَوْلَهُ:"),
          concept(26, "نشاط", "نشاط ٥ أَصِلُ الصُّورَةَ بِصَوْتِ حَرْفِ (م) الْمُنَاسِبِ:"),
          concept(27, "نشاط", "نشاط ٩ أَنْطِقُ الْحُرُوفَ؛ لِأُكَوِّنَ كَلِمَةً:"),
        ],
      },
      {
        key: "1-8",
        ordinal: "الرابع",
        type: "الدرس",
        title: "وجبتي",
        printedHead: "الدَّرْسُ الرَّابِعُ وَجْبَتِي",
        bookFrom: 28,
        concepts: [
          concept(28, "الدرس", "الدَّرْسُ الرَّابِعُ وَجْبَتِي"),
          concept(28, "نشاط", "مَاذَا يُوجَدُ فِي طَبَقِي؟"),
          concept(29, "نشاط", "نشاط ٥ أَخْتَارُ طَبَقَ الطَّعَامِ الْمُتَكَامِلَ:"),
        ],
      },
      {
        key: "1-9",
        ordinal: "",
        type: "حرف",
        title: "حرف الحاء",
        printedHead: "حَرْفُ الْحَاءِ",
        bookFrom: 30,
        concepts: [
          concept(30, "حرف", "حَرْفُ الْحَاءِ"),
          concept(30, "نشاط", "نَشاط ٣ أَبْحَثُ عَنْ حَرْفِ (ح - حـ - ـحـ - ـح) فِي الْكَلِمَاتِ، وَأَضَعُ دَائِرَةً حَوْلَهُ:"),
          concept(31, "نشاط", "نشاط ٥ أَصِلُ الصُّورَةَ بِصَوْتِ حَرْفِ (ح) الْمُنَاسِبِ:"),
          concept(32, "نشاط", "نشاط ٩ أَنْطِقُ، وَأَدْمِجُ ثُمَّ أَتَتَبَّعُ الْكَلِمَةَ:"),
        ],
      },
      {
        key: "1-10",
        ordinal: "الخامس",
        type: "الدرس",
        title: "آداب الطعام",
        printedHead: "الدَّرْسُ الْخَامِسُ آدَابُ الطَّعَامِ",
        bookFrom: 33,
        concepts: [
          concept(33, "الدرس", "الدَّرْسُ الْخَامِسُ آدَابُ الطَّعَامِ"),
          concept(33, "نشاط", "نَشاط (٢) أَضَعُ عَلَامَةَ (✓) عِنْدَ السُّلُوكِ الَّذِي أَفْعَلُهُ قَبْلَ تَنَاوُلِ الطَّعَامِ:"),
          concept(34, "نشاط", "نشاط ٥ أَخْتَارُ الصُّورَةَ الَّتِي تُعَبِّرُ عَنِ الْوَجْبَةِ الْمُنَاسِبَةِ:"),
        ],
      },
      {
        key: "1-11",
        ordinal: "",
        type: "حرف",
        title: "حرف الجيم",
        printedHead: "حَرْفُ الْجِيمِ",
        bookFrom: 35,
        concepts: [
          concept(35, "حرف", "حَرْفُ الْجِيمِ"),
          concept(35, "نشاط", "نَشاط ٣ أَبْحَثُ عَنْ حَرْفِ (ج - ج - ج - ج) فِي الْكَلِماتِ، وَأَضَعُ دائِرَةً حَوْلَهُ:"),
          concept(36, "نشاط", "نشاط ٦ لُعْبَةُ (الصَّلْصالِ):"),
          concept(37, "نشاط", "نشاط ٨ أَنْطِقُ، وَأَكْتُبُ حَرْفَ (ج) مَضْبُوطًا بِالشَّكْلِ:"),
        ],
      },
      {
        key: "1-12",
        ordinal: "",
        type: "أغنية",
        title: "أطعمتي",
        printedHead: "أُغْنِيَةُ أَطْعِمَتِي",
        bookFrom: 38,
        concepts: [concept(38, "أغنية", "أُغْنِيَةُ أَطْعِمَتِي")],
      },
      {
        key: "1-13",
        ordinal: "",
        type: "حرف",
        title: "حرف الدال",
        printedHead: "حَرْفُ الدَّالِ",
        bookFrom: 39,
        concepts: [
          concept(39, "حرف", "حَرْفُ الدَّالِ"),
          concept(39, "نشاط", "نَشاط ٣ أَبْحَثُ عَنْ حَرْفِ ( د - د ) فِي الكَلِمَاتِ، وَأَضَعُ دَائِرَةً حَوْلَهُ:"),
          concept(40, "نشاط", "نشاط ٦ لُعْبَةُ (جَمْعِ الْقِطَعِ):"),
          concept(41, "نشاط", "نشاط ٩ أَنْطِقُ، ثُمَّ أَكْتُبُ الْكَلِمَةَ الَّتِي وَجَدْتُهَا:"),
        ],
      },
      {
        key: "1-14",
        ordinal: "",
        type: "أنا أعبر",
        title: "أنا أعبر",
        printedHead: "أَنَا أُعَبِّرُ",
        bookFrom: 42,
        concepts: [
          concept(42, "أنا أعبر", "أَنَا أُعَبِّرُ"),
          concept(42, "نشاط", "نشاط ١ أَتَحَدَّثُ عَنِ الْمَائِدَةِ الصِّحِّيَّةِ:"),
        ],
      },
      {
        key: "1-15",
        ordinal: "",
        type: "أنا تعلمت",
        title: "أنا تعلمت",
        printedHead: "أَنَا تَعَلَّمْتُ",
        bookFrom: 43,
        concepts: [
          concept(43, "أنا تعلمت", "أَنَا تَعَلَّمْتُ"),
          concept(43, "نشاط", "نشاط (١) أَصِلُ كُلَّ حَرْفٍ بِشَكْلِهِ مُتَّصِلًا:"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: أدواتي وألعابي",
    printedHead: "أَدَوَاتِي وَأَلْعَابِي",
    bookFrom: 44,
    bookTo: 76,
    lessons: [
      {
        key: "2-1",
        ordinal: "",
        type: "أنشطة قصة الاستماع",
        title: "أدواتي وألعابي",
        printedHead: "أَنْشِطَةُ قِصَّةِ الِاسْتِمَاعِ أَدَوَاتِي وَأَلْعَابِي",
        bookFrom: 45,
        concepts: [
          concept(45, "أنشطة قصة الاستماع", "أَنْشِطَةُ قِصَّةِ الِاسْتِمَاعِ أَدَوَاتِي وَأَلْعَابِي"),
          concept(45, "نشاط", "نشاط ١ أُرَتِّبُ أَحْدَاثَ الْقِصَّةِ:"),
        ],
        extraBookPages: [110],
      },
      {
        key: "2-2",
        ordinal: "الأول",
        type: "الدرس",
        title: "أدوات المائدة",
        printedHead: "الدَّرْسُ الْأَوَّلُ أَدَوَاتُ الْمَائِدَةِ",
        bookFrom: 46,
        concepts: [
          concept(46, "الدرس", "الدَّرْسُ الْأَوَّلُ أَدَوَاتُ الْمَائِدَةِ"),
          concept(46, "نشاط", "نَشاط (١) أَتَعَرَّفُ أَدَوَاتِ الْمَائِدَةِ:"),
          concept(47, "نشاط", "نشاط ٤ أُلَوِّنُ الطِّفْلَ الَّذِي يَسْتَخْدِمُ أَدَوَاتِهِ بِشَكْلٍ صَحِيحٍ:"),
        ],
      },
      {
        key: "2-3",
        ordinal: "",
        type: "حرف",
        title: "حرف الخاء",
        printedHead: "حَرْفُ الْخَاءِ",
        bookFrom: 48,
        concepts: [
          concept(48, "حرف", "حَرْفُ الْخَاءِ"),
          concept(48, "نشاط", "نَشَاط (٢) أُلَوِّنُ الصُّوَرَ الَّتِي بِهَا حَرْفُ (خ):"),
          concept(49, "نشاط", "نشاط ٥ أَنْطِقُ، وَأَتَتَبَّعُ الْمَتَاهَةَ؛ لِأَصِلَ الصُّورَةَ بِصَوْتِ حَرْفِ (خ) الْمُنَاسِبِ:"),
          concept(50, "نشاط", "نشاط ٩ أَقْرَأُ الْكَلِمَةَ، ثُمَّ أُحَلِّلُهَا إِلَى حُرُوفِ:"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الثاني",
        type: "الدرس",
        title: "أدواتي المدرسية",
        printedHead: "الدَّرْسُ الثَّانِي أَدَوَاتِي الْمَدْرَسِيَّةُ",
        bookFrom: 51,
        concepts: [
          concept(51, "الدرس", "الدَّرْسُ الثَّانِي أَدَوَاتِي الْمَدْرَسِيَّةُ"),
          concept(51, "نشاط", "نَشاط (٢) أَضَعُ أَدَوَاتِي الْمَدْرَسِيَّةَ فِي:"),
          concept(52, "نشاط", "نشاط ٦ أَضَعُ دَائِرَةً حَوْلَ الْأَدَوَاتِ الْمَدْرَسِيَّةِ:"),
        ],
      },
      {
        key: "2-5",
        ordinal: "",
        type: "حرف",
        title: "حرف التاء",
        printedHead: "حَرْفُ التَّاءِ",
        bookFrom: 53,
        concepts: [
          concept(53, "حرف", "حَرْفُ التَّاءِ"),
          concept(53, "نشاط", "نَشاط ٣ أُلاحِظُ أَشْكالَ حَرْفِ (ت - ت - ت - ت) فِي الْكَلِماتِ، ثُمَّ أَرْسُمُ دائِرَةً حَوْلَ الشَّكْلِ الْمُناسِبِ لِلْكَلِمَةِ:"),
          concept(54, "نشاط", "نشاط ٥ أَنْطِقُ، وَأَتَتَبَّعُ الْمَتَاهَةَ؛ لِأَصِلَ الصُّورَةَ بِصَوْتِ حَرْفِ (ت) الْمُنَاسِبِ:"),
          concept(55, "نشاط", "نشاط ٩ أَقْرَأُ الْكَلِمَةَ، ثُمَّ أُحَلِّلُهَا إِلَى حُرُوفٍ:"),
        ],
      },
      {
        key: "2-6",
        ordinal: "الثالث",
        type: "الدرس",
        title: "أدوات النظافة",
        printedHead: "الدَّرْسُ الثَّالِثُ أَدَوَاتُ النَّظَافَةِ",
        bookFrom: 56,
        concepts: [
          concept(56, "الدرس", "الدَّرْسُ الثَّالِثُ أَدَوَاتُ النَّظَافَةِ"),
          concept(56, "نشاط", "نَشَاط (٢) أَصِلُ كُلَّ طِفْلٍ بِمَا يَحْتَاجُ:"),
          concept(57, "نشاط", "نشاط ٤ هَيَّا نَغْسِلُ أَيْدِيَنَا، وَنَذْكُرُ الْخُطُوَاتِ الصَّحِيحَةَ لِغَسْلِ الْيَدَيْنِ:"),
        ],
      },
      {
        key: "2-7",
        ordinal: "",
        type: "حرف",
        title: "حرف اللام",
        printedHead: "حَرْفُ اللَّامِ",
        bookFrom: 58,
        concepts: [
          concept(58, "حرف", "حَرْفُ اللَّامِ"),
          concept(58, "نشاط", "نَشاط (٣) أُلاحِظُ أَشْكالَ حَرْفِ (ل - لـ - ـلـ - ـل) فِي الْكَلِماتِ، ثُمَّ أُلَوِّنُ الشَّكْلَ الْمُناسِبَ لِلْكَلِمَةِ:"),
          concept(59, "نشاط", "نشاط ٥ أَنْطِقُ، وَأَتَتَبَّعُ الْمَتَاهَةَ؛ لِأَصِلَ الصُّورَةَ بِصَوْتِ حَرْفِ (ل) الْمُنَاسِبِ:"),
          concept(60, "نشاط", "نشاط ٩ أَقْرَأُ الْكَلِمَةَ، ثُمَّ أُحَلِّلُهَا إِلَى حُرُوفٍ:"),
        ],
      },
      {
        key: "2-8",
        ordinal: "الرابع",
        type: "الدرس",
        title: "ألعابي",
        printedHead: "الدَّرْسُ الرَّابِعُ أَلْعَابِي",
        bookFrom: 61,
        concepts: [
          concept(61, "الدرس", "الدَّرْسُ الرَّابِعُ أَلْعَابِي"),
          concept(61, "نشاط", "نَشاط (١) أَتَعَرَّفُ أَلْعَابِيَ الْمُمْتِعَةَ:"),
          concept(62, "نشاط", "نَشَاط ٣ هَيَّا نَصِلُ بَيْنَ كُلِّ صَدِيقَيْنِ يَلْعَبَانِ اللُّعْبَةَ نَفْسَهَا، ثُمَّ نَلْعَبُ مَعاً:"),
        ],
      },
      {
        key: "2-9",
        ordinal: "",
        type: "حرف",
        title: "حرف السين",
        printedHead: "حَرْفُ الشِّينِ",
        bookFrom: 63,
        concepts: [
          concept(63, "حرف", "حَرْفُ الشِّينِ"),
          concept(63, "نشاط", "نشاط (٣) أُلاحِظُ أَشْكَالَ حَرْفِ (س - سـ - ـسـ - ـس) فِي الْكَلِمَاتِ، ثُمَّ أَرْسُمُ دَائِرَةً حَوْلَ الشَّكْلِ الْمُنَاسِبِ لِلْكَلِمَةِ:"),
          concept(64, "نشاط", "نشاط ٥ أَنْطِقُ، وَأَتَتَبَّعُ الْمَتَاهَةَ؛ لِأَصِلَ الصُّورَةَ بِصَوْتِ حَرْفِ (س) الْمُنَاسِبِ:"),
          concept(65, "نشاط", "نشاط ٩ أَقْرَأُ الْكَلِمَةَ، ثُمَّ أُحَلِّلُهَا إِلَى حُرُوفٍ:"),
        ],
      },
      {
        key: "2-10",
        ordinal: "الخامس",
        type: "الدرس",
        title: "أحافظ على أدواتي",
        printedHead: "الدَّرْسُ الْخَامِسُ أُحَافِظُ عَلَى أَدَوَاتِي",
        bookFrom: 66,
        concepts: [
          concept(66, "الدرس", "الدَّرْسُ الْخَامِسُ أُحَافِظُ عَلَى أَدَوَاتِي"),
          concept(66, "نشاط", "نَشَاط (١) هَيَّا نُلَاحِظُ مَكَانَ الْأَدَوَاتِ:"),
          concept(67, "نشاط", "نشاط ٥ أَضَعُ دَائِرَةً عَلَى أَدَوَاتِي الَّتِي يَجِبُ أَنْ أُحَافِظَ عَلَيْهَا:"),
        ],
      },
      {
        key: "2-11",
        ordinal: "",
        type: "حرف",
        title: "حرف النون",
        printedHead: "حَرْفُ النُّونِ",
        bookFrom: 68,
        concepts: [
          concept(68, "حرف", "حَرْفُ النُّونِ"),
          concept(68, "نشاط", "نَشاط (٣) أُلاحِظُ أَشْكالَ حَرْفِ (ن - ن - ن - ن) فِي الْكَلِماتِ، ثُمَّ أَرْسُمُ دائِرَةً حَوْلَ الشَّكْلِ الْمُناسِبِ لِلْكَلِمَةِ:"),
          concept(69, "نشاط", "نشاط ٥ أَصِلُ الصُّورَةَ بِصَوْتِ حَرْفِ (ن) الْمُنَاسِبِ:"),
          concept(70, "نشاط", "نشاط ٩ أقرأ الكلمة، ثم أحللها إلى حروف:"),
        ],
      },
      {
        key: "2-12",
        ordinal: "",
        type: "أغنية",
        title: "أدواتي",
        printedHead: "أُغْنِيَةُ أَدَوَاتِي",
        bookFrom: 71,
        concepts: [concept(71, "أغنية", "أُغْنِيَةُ أَدَوَاتِي")],
      },
      {
        key: "2-13",
        ordinal: "",
        type: "حرف",
        title: "حرف الراء",
        printedHead: "حَرْفُ الرَّاءِ",
        bookFrom: 72,
        concepts: [
          concept(72, "حرف", "حَرْفُ الرَّاءِ"),
          concept(72, "نشاط", "نَشَاطُ ٣ أُلَاحِظُ أَشْكَالَ حَرْفِ (ر - ر) فِي الْكَلِمَاتِ، ثُمَّ أَرْسُمُ دَائِرَةً حَوْلَ الشَّكْلِ الْمُنَاسِبِ لِلْكَلِمَةِ:"),
          concept(73, "نشاط", "نشاط ٥ أَصِلُ الصُّورَةَ بِصَوْتِ حَرْفِ (ر) الْمُنَاسِبِ:"),
          concept(74, "نشاط", "نشاط 9 أَقْرَأُ الْكَلِمَةَ، ثُمَّ أُحَلِّلُهَا إِلَى حُرُوفِ:"),
        ],
      },
      {
        key: "2-14",
        ordinal: "",
        type: "أنا أعبر",
        title: "أنا أعبر",
        printedHead: "أَنَا أُعَبِّرُ",
        bookFrom: 75,
        concepts: [
          concept(75, "أنا أعبر", "أَنَا أُعَبِّرُ"),
          concept(75, "نشاط", "نَشَاط ١ أَحْكِي عَنْ أَدَوَاتِي:"),
        ],
      },
      {
        key: "2-15",
        ordinal: "",
        type: "أنا تعلمت",
        title: "أنا تعلمت",
        printedHead: "أَنَا تَعَلَّمْتُ",
        bookFrom: 76,
        concepts: [
          concept(76, "أنا تعلمت", "أَنَا تَعَلَّمْتُ"),
          concept(76, "نشاط", "نَشَاط 1 أَصِلُ كُلَّ حَرْفٍ بِالشَّكْلِ الْمُتَّصِلِ لَهُ:"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: وسائل المواصلات",
    printedHead: "وَسَائِلُ الْمُوَاصَلَاتِ",
    bookFrom: 77,
    bookTo: 108,
    lessons: [
      {
        key: "3-1",
        ordinal: "",
        type: "أنشطة قصة الاستماع",
        title: "رحلة سلمى إلى الروضة",
        printedHead: "أَنْشِطَةُ قِصَّةِ الِاسْتِمَاعِ رِحْلَةُ سَلْمَى إِلَى الرَّوْضَةِ",
        bookFrom: 78,
        concepts: [
          concept(78, "أنشطة قصة الاستماع", "أَنْشِطَةُ قِصَّةِ الِاسْتِمَاعِ رِحْلَةُ سَلْمَى إِلَى الرَّوْضَةِ"),
          concept(78, "نشاط", "نَشَاط (١) أُلَوِّنُ وَسِيلَةَ الْمُوَاصَلَاتِ الَّتِي ذَهَبَتْ بِهَا سَلْمَى إِلَى الرَّوْضَةِ:"),
        ],
        extraBookPages: [111],
      },
      {
        key: "3-2",
        ordinal: "الأول",
        type: "الدرس",
        title: "السيارة",
        printedHead: "الدَّرْسُ الأَوَّلُ السَّيَّارَةُ",
        bookFrom: 79,
        concepts: [
          concept(79, "الدرس", "الدَّرْسُ الأَوَّلُ السَّيَّارَةُ"),
          concept(79, "نشاط", "نَشاط (٢) أُلَاحِظُ أَشْكَالَ وَأَلْوَانَ السَّيَّارَاتِ، وَأُلَوِّنُهَا:"),
          concept(80, "نشاط", "نشاط ٥ أَصِلُ السَّيَّارَةَ بِالْمَكَانِ الْمُنَاسِبِ:"),
        ],
      },
      {
        key: "3-3",
        ordinal: "",
        type: "حرف",
        title: "حرف الفاء",
        printedHead: "حَرْفُ الْفَاءِ",
        bookFrom: 81,
        concepts: [
          concept(81, "حرف", "حَرْفُ الْفَاءِ"),
          concept(81, "نشاط", "نَشَاط (٣) أُلَاحِظُ أَشْكَالَ حَرْفِ (ف - فـ - ـفـ - ـف)، ثُمَّ أَصِلُ الْحَرْفَ بِالْكَلِمَةِ الْمُنَاسِبَةِ:"),
          concept(82, "نشاط", "نشاط ٥ أُلَوِّنُ صَوْتَ حَرْفِ (ف) الْمُنَاسِبَ:"),
          concept(83, "نشاط", "نشاط ٩ أُرَتِّبُ الْحُرُوفَ؛ لِأُكَوِّنَ الْكَلِمَةَ، ثُمَّ أَكْتُبُهَا:"),
        ],
      },
      {
        key: "3-4",
        ordinal: "الثاني",
        type: "الدرس",
        title: "الدراجة",
        printedHead: "الدَّرْسُ الثَّانِي الدَّرَّاجَةُ",
        bookFrom: 84,
        concepts: [
          concept(84, "الدرس", "الدَّرْسُ الثَّانِي الدَّرَّاجَةُ"),
          concept(84, "نشاط", "نَشاط (٢) أُلَوِّنُ مَا أَرْتَدِيهِ عِنْدَ رُكُوبِ الدَّرَّاجَةِ:"),
          concept(85, "نشاط", "نَشاط ٥ أَخْتَارُ الطَّرِيقَ الْآمِنَ لِلدَّرَّاجَةِ:"),
        ],
      },
      {
        key: "3-5",
        ordinal: "",
        type: "حرف",
        title: "حرف الكاف",
        printedHead: "حَرْفُ الْكَافِ",
        bookFrom: 86,
        concepts: [
          concept(86, "حرف", "حَرْفُ الْكَافِ"),
          concept(86, "نشاط", "نَشاط (٣) أُلاحِظُ أَشْكالَ حَرْفِ (كـ - كـ - ـكـ - ك)، ثُمَّ أَصِلُ الْحَرْفَ بِالْكَلِمَةِ الْمُناسِبَةِ:"),
          concept(87, "نشاط", "نشاط ٥ أُلَوِّنُ صَوْتَ حَرْفِ (ك) الْمُنَاسِبَ:"),
          concept(88, "نشاط", "نشاط ٩ أُرَتِّبُ الْحُرُوفَ؛ لِأُكَوِّنَ الْكَلِمَةَ، ثُمَّ أَكْتُبُهَا:"),
        ],
      },
      {
        key: "3-6",
        ordinal: "الثالث",
        type: "الدرس",
        title: "القطار",
        printedHead: "الدَّرْسُ الثَّالِثُ الْقِطَارُ",
        bookFrom: 89,
        concepts: [
          concept(89, "الدرس", "الدَّرْسُ الثَّالِثُ الْقِطَارُ"),
          concept(89, "نشاط", "نَشاط (٣) أَضَعُ عَلَامَةَ (✓) عِنْدَ السُّلُوكِ الصَّحِيحِ، وَعَلَامَةَ (X) عِنْدَ السُّلُوكِ الْخَطَأِ:"),
          concept(90, "نشاط", "نشاط ٥ أَصِلُ الْقِطَارَ بِالْمَكَانِ الْمُنَاسِبِ:"),
        ],
      },
      {
        key: "3-7",
        ordinal: "",
        type: "حرف",
        title: "حرف القاف",
        printedHead: "حَرْفُ الْقَافِ",
        bookFrom: 91,
        concepts: [
          concept(91, "حرف", "حَرْفُ الْقَافِ"),
          concept(91, "نشاط", "نَشاط (٣) أُلاحِظُ أَشْكالَ حَرْفِ (ق - ق - ق - ق)، ثُمَّ أَصِلُ الشَّكْلَ الْحَرْفِ بِالْكَلِمَةِ الْمُناسِبَةِ:"),
          concept(92, "نشاط", "نشاط ٥ أُلَوِّنُ صَوْتَ حَرْفِ (ق) الْمُنَاسِبَ:"),
          concept(93, "نشاط", "نشاط ٩ أُرَتِّبُ الْحُرُوفَ؛ لِأُكَوِّنَ الْكَلِمَةَ، ثُمَّ أَكْتُبُهَا:"),
        ],
      },
      {
        key: "3-8",
        ordinal: "الرابع",
        type: "الدرس",
        title: "الطائرة",
        printedHead: "الدَّرْسُ الرَّابِعُ الطَّائِرَةُ",
        bookFrom: 94,
        concepts: [
          concept(94, "الدرس", "الدَّرْسُ الرَّابِعُ الطَّائِرَةُ"),
          concept(94, "نشاط", "نشاط ٢ أَضَعُ دَائِرَةً حَوْلَ مَا أَحْتَاجُهُ عِنْدَ السَّفَرِ بِالطَّائِرَةِ:"),
          concept(95, "نشاط", "نشاط ٥ أَصِلُ الطَّائِرَةَ بِمَكَانِهَا الْمُنَاسِبِ:"),
        ],
      },
      {
        key: "3-9",
        ordinal: "",
        type: "حرف",
        title: "حرف الياء",
        printedHead: "حَرْفُ الْيَاءِ",
        bookFrom: 96,
        concepts: [
          concept(96, "حرف", "حَرْفُ الْيَاءِ"),
          concept(96, "نشاط", "نشاط ٣ أُلَاحِظُ أَشْكَالَ حَرْفِ (ي - ي - ي - ي)، ثُمَّ أَصِلُ شَكْلَ الْحَرْفِ بِالْكَلِمَةِ الْمُنَاسِبَةِ:"),
          concept(97, "نشاط", "نشاط ٥ أُلَوِّنُ صَوْتَ حَرْفِ (ي) الْمُنَاسِبَ:"),
          concept(98, "نشاط", "نشاط ٩ أُرَتِّبُ الْحُرُوفَ؛ لِأُكَوِّنَ الْكَلِمَةَ، ثُمَّ أَكْتُبُهَا:"),
        ],
      },
      {
        key: "3-10",
        ordinal: "الخامس",
        type: "الدرس",
        title: "السفينة",
        printedHead: "الدَّرْسُ الْخَامِسُ السَّفِينَةُ",
        bookFrom: 99,
        concepts: [
          concept(99, "الدرس", "الدَّرْسُ الْخَامِسُ السَّفِينَةُ"),
          concept(99, "نشاط", "نَشاط (٢) أَصِلُ السَّفِينَةَ بِالْمَكَانِ الَّذِي تَسِيرُ فِيهِ:"),
          concept(100, "نشاط", "نشاط ٥ أَضَعُ دَائِرَةً حَوْلَ السَّفِينَةِ مِنْ بَيْنِ الصُّوَرِ، ثُمَّ أَرْسُمُهَا:"),
        ],
      },
      {
        key: "3-11",
        ordinal: "",
        type: "حرف",
        title: "حرف العين",
        printedHead: "حَرْفُ الْعَيْنِ",
        bookFrom: 101,
        concepts: [
          concept(101, "حرف", "حَرْفُ الْعَيْنِ"),
          concept(101, "نشاط", "نشاط ٣ أُلَاحِظُ أَشْكَالَ حَرْفِ (ع - ع - ـع - ـعـ)، ثُمَّ أَصِلُ شَكْلَ الْحَرْفِ بِالْكَلِمَةِ الْمُنَاسِبَةِ:"),
          concept(102, "نشاط", "نشاط ٥ أُلَوِّنُ صَوْتَ حَرْفِ (ع) الْمُنَاسِبَ:"),
          concept(103, "نشاط", "نشاط ٩ أُرَتِّبُ الْحُرُوفَ؛ لِأُكَوِّنَ الْكَلِمَةَ، ثُمَّ أَكْتُبُهَا:"),
        ],
      },
      {
        key: "3-12",
        ordinal: "",
        type: "أغنية",
        title: "رحلة المساء",
        printedHead: "أُغْنِيَةُ رِحْلَةُ الْمَسَاءِ",
        bookFrom: 104,
        concepts: [concept(104, "أغنية", "أُغْنِيَةُ رِحْلَةُ الْمَسَاءِ")],
      },
      {
        key: "3-13",
        ordinal: "",
        type: "مراجعة",
        title: "مراجعة",
        printedHead: "مُرَاجَعَة",
        bookFrom: 105,
        concepts: [
          concept(105, "مراجعة", "مُرَاجَعَة"),
          concept(105, "نشاط", "نَشَاط (٢) أَضَعُ عَلَامَةَ (✓) أَمَامَ الصُّورَةِ الَّتِي تَبْدَأُ بِصَوْتِ الْحَرْفِ:"),
          concept(106, "نشاط", "نشاط ٤ أُحَلِّلُ الْكَلِمَتَيْنِ الْآتِيَتَيْنِ إِلَى حُرُوفٍ:"),
        ],
      },
      {
        key: "3-14",
        ordinal: "",
        type: "أنا أعبر",
        title: "أنا أعبر",
        printedHead: "أَنَا أُعَبِّرُ",
        bookFrom: 107,
        concepts: [
          concept(107, "أنا أعبر", "أَنَا أُعَبِّرُ"),
          concept(107, "نشاط", "نَشَاط 1 أَصِفُ مَاذَا يَرْكَبُ كُلُّ شَخْصِ:"),
        ],
      },
      {
        key: "3-15",
        ordinal: "",
        type: "أنا تعلمت",
        title: "أنا تعلمت",
        printedHead: "أَنَا تَعَلَّمْتُ",
        bookFrom: 108,
        concepts: [
          concept(108, "أنا تعلمت", "أَنَا تَعَلَّمْتُ"),
          concept(108, "نشاط", "نَشَاط (٢) أَنْطِقُ، وَأَخْتَارُ الْحَرْفَ الصَّحِيحَ:"),
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
  const unit = EGYPT_ARABIC_KG2_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ARABIC_KG2_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * The appendix page(s) each lesson points to, keyed by the lesson key (`1-1` →
 * `[109]`). The أنشطة قصة الاستماع lessons print their exercises but not the
 * story; the stories are printed in the back-matter «قصص استماع الوحدات» (books
 * 109–111, one page per unit). The stage appends these pages so the student
 * reads the very page the tutor quotes from.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const unit of EGYPT_ARABIC_KG2_T1_UNITS) {
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
  "arabic-kg2-t1",
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
  const lesson = EGYPT_ARABIC_KG2_T1_UNITS[unitIndex]!.lessons[lessonIndex]!;
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
 * bare numeral on its own line («٦»، «١٤»، «41»), sometimes sharing its line
 * with the teacher note («١٤ • يتعرف …»), so the last five lines are scanned and
 * every number on a foot-looking line is a candidate.
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
 * printed instead — measured, not guessed. Every parseable footer matches its
 * page number exactly (including the extended-digits «۱۳» on book 13 and the
 * Latin «19»/«96» on books 19/96), which is what fixes the offset, so this map
 * is empty.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no parseable folio under the foot rule, each with
 * the anchor the check accepts in place of a page number. Every anchor is a head
 * the page itself prints: books 11/44/77 (the unit openers, which print no
 * number), books 7/17/71/76 (their folio misread as bare Latin letters «V»/
 * «IV»/«VI»/«VI»), books 8/42/52/80/90 (their folio glued to the end of the
 * teacher-note line), book 26 (no folio in the OCR at all), book 28 (its «٢٨»
 * beside the lone نشاط number «٣») and book 94 (its «٩٤» beside the passport
 * stamp «24 APR 2025»).
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  7: "الْوَعْيُ الصَّوْتِيُّ",
  8: "مَهَارَاتُ الْإِدْرَاكِ",
  11: "غذائي",
  17: "حَرْفَ الأَلِفِ",
  26: "سُلَّمُ الْحُرُوفِ",
  28: "مَاذَا يُوجَدُ فِي طَبَقِي؟",
  42: "أَنَا أُعَبِّرُ",
  44: "أَدَوَاتِي وَأَلْعَابِي",
  52: "الْأَدَوَاتِ الْمَدْرَسِيَّةِ",
  71: "أَدَوَاتِي",
  76: "أَنَا تَعَلَّمْتُ",
  77: "وَسَائِلُ الْمُوَاصَلَاتِ",
  80: "أُمَثِّلُ مَعَ أَصْحَابِي",
  90: "مَحَطَّةِ الْقِطَارِ",
  94: "الطَّائِرَةُ",
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
  const units = EGYPT_ARABIC_KG2_T1_UNITS;
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
        if (page < EGYPT_ARABIC_KG2_T1_APPENDIX.from || page > EGYPT_ARABIC_KG2_T1_APPENDIX.to) {
          problems.push(
            `الدرس ${lesson.key}: صفحة ملحقة ${page} خارج ملحق الكتاب ${EGYPT_ARABIC_KG2_T1_APPENDIX.from}–${EGYPT_ARABIC_KG2_T1_APPENDIX.to}`,
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
  if (first && first.bookFrom !== EGYPT_ARABIC_KG2_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ARABIC_KG2_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ARABIC_KG2_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ARABIC_KG2_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio (every parseable footer matches its page exactly), or, on the
 *     pages that print no parseable folio, from the anchor named in
 *     `FOLIO_LESS_ANCHORS`;
 *  2. every section opener prints the section head and every lesson's first page
 *     prints that lesson's head;
 *  3. every lesson's title and every concept's head is printed on the pages the
 *     lesson owns (the concept on its own page), and every appendix page a
 *     lesson points to prints that lesson's story;
 *  4. every printed page in [5, 108] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_ARABIC_KG2_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ARABIC_KG2_T1_BOOK_START || book > EGYPT_ARABIC_KG2_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_ARABIC_KG2_T1_BOOK_END - EGYPT_ARABIC_KG2_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ARABIC_KG2_T1_BOOK_START} و${EGYPT_ARABIC_KG2_T1_BOOK_END}`,
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
  for (let p = EGYPT_ARABIC_KG2_T1_BOOK_START; p <= EGYPT_ARABIC_KG2_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
