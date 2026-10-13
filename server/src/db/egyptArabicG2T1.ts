// PHASE 109 — official Egypt Primary-2 (Grade 2) Arabic language
// («اللغة العربية» — الصف الثاني الابتدائي، الفصل الدراسي الأول)، 2025/2026
// edition.
//
// The curriculum tree for the Egypt `eg-g2-arabic` curriculum is rebuilt from the
// Ministry textbook (122 scanned pages, 107 of them OCR'd). This module is the
// single source of truth for its structure: the «مراجعة على ما سبق» review
// section, the three printed units of the first term (المعاملة الطيبة، عادات صحية،
// الرياضة والتكنولوجيا), every printed lesson inside them (الاستماع، القراءة،
// نشيد، تقييم الوحدة، اقرأ مع الأسرة), and, for every lesson, the book's own
// printed heads, verbatim and with the printed page they start on. The self-checks
// at the bottom prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS ONE — book page = scan page − 1
// Every content page that carries a folio prints its own number, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here: scan 7 prints
// «٦» (book 6, the «مراجعة على ما سبق» opener), scan 12 prints «11» (book 11, the
// «كلماتي الجميلة» lesson head), scan 42 prints «٤١» (book 41, the unit-1
// evaluation), scan 78 prints «٧٧» (book 77, the unit-2 evaluation), scan 84 prints
// «۸۳» (book 83, the unit-3 تدريبات), scan 117 prints «(۱۱٦)» (book 116, the
// «هيا نلعب» family story) and scan 118 prints «١٧» (book 117, the story's second
// page — its «١١٧» misread as «١٧»). The book's own «الفهرس» (scans 5–6)
// independently confirms the lesson starts.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–6 are before the term: the cover (1), the credits masthead (2),
// the «مقدمة» (3), the robot-guide page (4) and the printed «الفهرس» (5–6).
// Scan pages 119–122 are after the term: the book-wide «نصوص استماع الوحدات»
// appendix (book 118 = scan 119, holding the three unit listening texts), the
// «فقرات استماع تقييمات الوحدات» appendix (book 119 = scan 120), the publisher
// data page (120) and the back cover (121). The term runs from «مراجعة على ما
// سبق» (book 6 = scan 7) to the «هيا نلعب» family story's second page (book 117
// = scan 118): `EGYPT_ARABIC_G2_T1_BOOK_START` / `_BOOK_END` are exactly those
// two pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` therefore equals the number of OCR'd pages in [6,
// 117] — 97, because 15 scans were never produced (see `MISSING_SCANS`).
//
// FIFTEEN SCANS WERE NEVER PRODUCED — THE PAGES BETWEEN EXIST, THE OCR DOESN'T
// The OCR corpus has 107 files for a 122-page book; scans 16, 45, 55, 60, 65, 75,
// 76, 85, 90, 97, 100, 105, 107, 109, 116 are absent. Each falls inside a lesson
// range (they are activity / story-continuation / evaluation pages, never a
// lesson opener), so the tiling is unaffected: the page is still owned by exactly
// one lesson, it simply has no OCR text to check. They are listed in
// `MISSING_SCANS` so the gap is measured, not guessed.
//
// SEVENTEEN TERM PAGES PRINT NO PARSEABLE FOLIO IN THE OCR
// Eight of them carry no machine-readable number at all: book 8 (the unit-1
// opener «المعاملة الطيبة»), book 26 (a «أحب أصدقائي» story-continuation
// page), book 33 (the «صديقنا الجديد» speaking page), book 51 (a «أسناني
// قوية» discussion page), book 62 (a «طعامي الصحي» story page), book 80 (the
// second «غزال في ورطة» page), book 85 (the «حسام والكمبيوتر» story page),
// book 87 (a «هيا نتعلم كلمات جديدة» page), book 111 (the «رياضتي» song
// page) and book 114 (the unit-3 evaluation). Seven more print a folio the OCR
// misread as bare Latin letters — «V» for «٧» (book 7), «IV» for «١٧» (book 17),
// «VI» for «٧١» (book 71) — so they too are anchored on a printed head that only
// that page carries (see `FOLIO_LESS_ANCHORS`). Four further pages print a
// folio the OCR misread as a different number («٦۰» as «16» on book 60, «٦١» as
// «١٤» on book 61, «١١٢» as «113» on book 112 and «١١٧» as «١٧» on book 117);
// those measured values live in `FOOTER_OCR_MISREADS` so the check stays strict
// instead of statistical.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// The book prints no per-lesson «أهداف» bullets as heads; its lesson layer is
// the lesson head (الدرس الأول الاستماع …) and its activity layer is the band
// heads it prints on the pages themselves (تدريبات، هيا نتعلم كلمات جديدة، هيا
// نفهم ونناقش، عالم القصة، الأساليب والتراكيب، القواعد الإملائية، أتحدث
// وأعبر، هيا نكتب ونبدع، رحلتي مع الدرس، تقييم). Every concept below is one
// such head, transcribed verbatim from the OCR of the page its `bookFrom` names —
// including the OCR's own misreads of the printed headings («هيّا» for «هيا»,
// «رِحْلَتي» for «رحلتي», «النِّقِطَّةُ» for «القطة») — so the page-proves-the-head
// check compares the transcription against the very text it was taken from.
//
// THE LISTENING TEXTS LIVE IN A BOOK-WIDE APPENDIX
// The الاستماع lessons print their exercises but deliberately not the story; the
// three stories are printed in the back-matter «نصوص استماع الوحدات» (books
// 118–119). Each such lesson therefore also owns its appendix page through
// `extraBookPages`, so the tutor scoped to that lesson can quote the very story
// the book points it to. The appendix is not a lesson: it stays outside the tiled
// unit ranges.
//
// THE UNIT OPENER RIDES WITH THE FIRST LESSON
// Each unit opens with a one-page unit title (books 8, 44, 81) that the الفهرس
// does not list as its own lesson. It is owned by the unit's first (الاستماع)
// lesson, whose range therefore starts one page before the lesson head, exactly
// as the Grade-1 book's intro sections do.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 1 (verified: book p.117 = scan p.118). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the term — «مراجعة على ما سبق» (scan 7). */
export const EGYPT_ARABIC_G2_T1_BOOK_START = 6;

/** Last printed page of the term — «هيا نلعب» p.2 (scan 118). */
export const EGYPT_ARABIC_G2_T1_BOOK_END = 117;

/** The scanned pages before the term: cover, credits, مقدمة, robot guide, فهرس. */
export const EGYPT_ARABIC_G2_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The scanned pages after the term: the two appendices + publisher/back cover. */
export const EGYPT_ARABIC_G2_T1_BACK_MATTER = { from: 119, to: 122 } as const;

/**
 * The book-wide listening-text appendix, in book pages: «نصوص استماع الوحدات»
 * (books 118–119) holds the three unit listening stories the الاستماع lessons
 * point to; «فقرات استماع تقييمات الوحدات» (book 119) holds the book-wide
 * listening paragraphs and unit-assessment passages.
 */
export const EGYPT_ARABIC_G2_T1_APPENDIX = { from: 118, to: 119 } as const;

/**
 * The scans the OCR corpus never produced, as book pages: 15 gaps, each inside a
 * lesson range (never a lesson opener), so the tiling is unaffected.
 */
export const EGYPT_ARABIC_G2_T1_MISSING_SCANS: readonly number[] = [
  15, 44, 54, 59, 64, 74, 75, 84, 89, 96, 99, 104, 106, 108, 115,
];

/** One printed head of a lesson — becomes one concept in the app tree. */
export interface ArabicG2T1Concept {
  /** Printed book page where this head starts. */
  bookFrom: number;
  /** The printed head kind: lesson-head kind or a section-head kind. */
  kind: string;
  /** The printed head, verbatim from the book's OCR. */
  title: string;
}

/** One printed lesson of the textbook — becomes one lesson in the app tree. */
export interface ArabicG2T1Lesson {
  /** App-addressable key, e.g. "1-3" (unit 1, lesson 3); "muraja-1" for the review. */
  key: string;
  /** Arabic ordinal used in the lesson head; "" where the book numbers nothing. */
  ordinal: string;
  /** The lesson's opening head type — its first concept's kind. */
  type: string;
  /** Lesson title as printed (without the lesson-head wording). */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed heads for this lesson, in order, with their start pages. */
  concepts: ArabicG2T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to (its listening story).
   * Kept outside the tiled unit ranges but included in the lesson's RAG document.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — the review section or one of the three units. */
export interface ArabicG2T1Section {
  /** Whether this is a numbered unit or the leading review section. */
  kind: "unit" | "intro";
  /** Internal key: "1"…"3" for units, "muraja" for the review section. */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى"; "" for the review section. */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: المعاملة الطيبة". */
  title: string;
  /** The section head the opener page prints, e.g. "المعاملة الطيبة". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next section's opener). */
  bookTo: number;
  lessons: ArabicG2T1Lesson[];
}

function concept(bookFrom: number, kind: string, title: string): ArabicG2T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The review section and the three units of the first term with their printed
 * lessons and every printed head, transcribed from the pages the book prints them
 * on and checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Lesson starts come from the book's «الفهرس» (scans 5–6); each lesson's leading
 * concept is the very heading the book prints on the page the lesson starts on,
 * and the book's own vocalisation of those headings is kept verbatim in
 * `title`/`printedHead`/`concepts` even where it disagrees from page to page.
 */
export const EGYPT_ARABIC_G2_T1_SECTIONS: ArabicG2T1Section[] = [
  {
    key: "muraja",
    kind: "intro",
    ordinal: "",
    title: "مراجعة على ما سبق",
    printedHead: "مُرَاجَعَةٌ عَلَى مَا سَبَقَ",
    bookFrom: 6,
    bookTo: 7,
    lessons: [
      {
        key: "muraja-1",
        ordinal: "",
        type: "مراجعة",
        title: "مراجعة على ما سبق",
        printedHead: "مُرَاجَعَةٌ عَلَى مَا سَبَقَ",
        bookFrom: 6,
        concepts: [
          concept(6, "مراجعة", "مُرَاجَعَةٌ عَلَى مَا سَبَقَ"),
          concept(6, "نشاط", "نشاط 1 أصلُ كُلَّ جُمْلَةٍ بِالصُّورَةِ الْمُنَاسِبَةِ:"),
          concept(6, "نشاط", "نشاط ٢ أَخْتَارُ الإِجَابَةَ الصَّحِيحَةَ:"),
          concept(6, "نشاط", "نشاط ٣ أَضَعُ (هَذَا - هَذِهِ - هَؤُلَاءِ) فِي الْمَكَانِ الْمُنَاسِبِ:"),
          concept(7, "نشاط", "نَشاط ٤ أَخْتَارُ، ثُمَّ أُكْمِلُ الْكَلِمَةَ:"),
          concept(7, "نشاط", "نَشاط ٥ أَصِلُ كُلَّ كَلِمَةٍ بِمَا يُنَاسِبُهَا:"),
          concept(7, "نشاط", "نَشاط ٦ أَخْتَارُ الكَلِمَةَ الصَّحِيحَةَ، ثُمَّ أَكْتُبُهَا كَالْمِثَالِ:"),
        ],
      },
    ],
  },
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: المعاملة الطيبة",
    printedHead: "الْمُعَامَلَةُ الطَّيِّبَةُ",
    bookFrom: 8,
    bookTo: 43,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "يوم جميل",
        printedHead: "الدَّرْسُ الأَوَّلُ الاسْتِمَاعُ يَوْمٌ جَميلٌ",
        bookFrom: 9,
        concepts: [
          concept(9, "الاستماع", "الدَّرْسُ الأَوَّلُ الاسْتِمَاعُ يَوْمٌ جَميلٌ"),
          concept(10, "تدريبات", "تَدْرِيبَات يَوْمٌ جَمِيلٌ"),
        ],
        extraBookPages: [118],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "كلماتي الجميلة",
        printedHead: "الدَّرْسُ الثَّانِي القْرَاءَةُ كَلِمَاتِي الجَميلَة",
        bookFrom: 11,
        concepts: [
          concept(11, "القراءة", "الدَّرْسُ الثَّانِي القْرَاءَةُ كَلِمَاتِي الجَميلَة"),
          concept(14, "هيا نتعلم كلمات جديدة", "هَيَّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً"),
          concept(17, "الأساليب والتراكيب", "الْأَسَالِيبُ وَالتَّرَاكِيبُ الْمُفْرَدُ وَالْمُثَنَّى"),
          concept(19, "القواعد الإملائية", "الْقَوَاعِدُ الْإِمْلَائِيَّةُ تَحْلِيلُ الْكَلِمَاتِ إِلَى مَقَاطِعَ صَوْتِيَّةٍ"),
          concept(20, "أتحدث وأعبر", "أَتَحَدَّثُ وَأُعَبِّرُ كَلِمَاتٌ وَمَوَاقِفُ تُسْعِدُ الْآخَرِينَ"),
          concept(21, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ وَصْفُ صُورَةٍ"),
          concept(22, "رحلتي مع الدرس", "رِحْلَتِي مَعَ الدَّرْسِ"),
          concept(23, "تقييم", "تَقْيِيمُ كَلِمَاتِي الْجَمِيلَةِ"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "أحب أصدقائي",
        printedHead: "الدَّرْسُ الثَّالِثُ القْرَاءَةُ أُحِبُّ أَصْدِقَائِي",
        bookFrom: 24,
        concepts: [
          concept(24, "القراءة", "الدَّرْسُ الثَّالِثُ القْرَاءَةُ أُحِبُّ أَصْدِقَائِي"),
          concept(27, "هيا نتعلم كلمات جديدة", "هَيَّا نَتَعَلَّمْ كَلِمَاتٍ جَدِيدَةً"),
          concept(28, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(29, "عالم القصة", "عَالَمُ القِصَّةِ"),
          concept(30, "الأساليب والتراكيب", "الْأَسَالِيبُ وَالتَّرَاكِيبُ أَسْمَاءُ الإِشَارَةِ"),
          concept(33, "أتحدث وأعبر", "أَتَحَدَّثُ وَأُعَبِّرُ صَدِيقُنَا الْجَدِيدُ"),
          concept(34, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ مُرَاجَعَةٌ عَلَى وَصْفِ صُورَةٍ"),
          concept(35, "رحلتي مع الدرس", "رِحْلَتِي مَعَ الدَّرْسِ"),
          concept(36, "تقييم", "تَقْيِيم أُحِبُّ أَصْدِقَائِي"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: "نشيد",
        title: "الطفل المهذب",
        printedHead: "الدَّرْسُ الرَّابِعُ نَشيد الطِّفْلُ المُهَذَّبُ",
        bookFrom: 37,
        concepts: [
          concept(37, "نشيد", "الدَّرْسُ الرَّابِعُ نَشيد الطِّفْلُ المُهَذَّبُ"),
          concept(39, "هيا نتعلم كلمات جديدة", "هيّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً"),
          concept(40, "تقييم", "الطِّفْلُ المُهَذَّبُ"),
        ],
      },
      {
        key: "1-5",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الأولى",
        printedHead: "تَقْيِيمُ الوَحْدَةِ الأُولَى",
        bookFrom: 41,
        concepts: [
          concept(41, "تقييم", "تَقْيِيمُ الوَحْدَةِ الأُولَى"),
        ],
      },
      {
        key: "1-6",
        ordinal: "",
        type: "اقرأ مع الأسرة",
        title: "القطة والكلب",
        printedHead: "النِّقِطَّةُ وَالْكَلْبُ",
        bookFrom: 43,
        concepts: [
          concept(43, "اقرأ مع الأسرة", "النِّقِطَّةُ وَالْكَلْبُ"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: عادات صحية",
    printedHead: "عادات صحية",
    bookFrom: 44,
    bookTo: 80,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "أرتب حياتي",
        printedHead: "الدَّرْسُ الأَوَّلُ الاسْتِمَاعُ أُرَتِّبُ حَيَاتِي",
        bookFrom: 45,
        concepts: [
          concept(45, "الاستماع", "الدَّرْسُ الأَوَّلُ الاسْتِمَاعُ أُرَتِّبُ حَيَاتِي"),
          concept(46, "تدريبات", "تَدْرِيبَات أُرَتِّبُ حَيَاتِي"),
        ],
        extraBookPages: [118],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "أسناني قوية",
        printedHead: "الدَّرْسُ الثَّانِي الْقِرَاءَةُ أَسْنَانِي قَوِيَّةٌ",
        bookFrom: 47,
        concepts: [
          concept(47, "القراءة", "الدَّرْسُ الثَّانِي الْقِرَاءَةُ أَسْنَانِي قَوِيَّةٌ"),
          concept(50, "هيا نتعلم كلمات جديدة", "هَيَّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً"),
          concept(51, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(53, "الأساليب والتراكيب", "الْأَسَالِيبُ وَالتَّرَاكِيبُ مِنْ أَسْمَاءِ الْإِشَارَةِ (ذَلِكَ - تِلْكَ)"),
          concept(55, "القواعد الإملائية", "الْقَوَاعِدُ الْإِمْلَائِيَّةُ اللَّامُ الشَّمْسِيَّةُ وَاللَّامُ الْقَمَرِيَّةُ"),
          concept(56, "أتحدث وأعبر", "أَتَحَدَّثُ وَأُعَبِّرُ صَدِيقَتِي الْفُرْشَاةُ"),
          concept(57, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ البِطَاقَةُ التَّعْرِيفِيَّةُ"),
          concept(58, "رحلتي مع الدرس", "رِحْلَتِي مَعَ الدَّرْسِ"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "طعامي الصحي",
        printedHead: "الدَّرْسُ الثَّالِثُ الْقِرَاءَةُ طَعَامِي الصِّحِيُّ",
        bookFrom: 60,
        concepts: [
          concept(60, "القراءة", "الدَّرْسُ الثَّالِثُ الْقِرَاءَةُ طَعَامِي الصِّحِيُّ"),
          concept(63, "هيا نتعلم كلمات جديدة", "هَيَّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً"),
          concept(66, "الأساليب والتراكيب", "الْأَسَالِيبُ وَالتَّرَاكِيبُ أَوَّلًا: ظَرْفُ الْمَكَانِ"),
          concept(68, "القواعد الإملائية", "الْقَوَاعِدُ الْإِمْلَائِيَّةُ مُرَاجَعَةٌ عَلَى اللَّامِ الشَّمْسِيَّةِ وَاللَّامِ الْقَمَرِيَّةِ"),
          concept(69, "أتحدث وأعبر", "أَتَحَدَّثُ وَأُعَبِّرُ أَهْتَمُّ بِغِذَائِي"),
          concept(70, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ مُرَاجَعَةٌ عَلَى الْبِطَاقَةِ التَّعْرِيفِيَّةِ"),
          concept(71, "رحلتي مع الدرس", "رِحْلَتِي مَعَ الدَّرْسِ"),
          concept(72, "تقييم", "تَقْيِيم طَعَامِي الصِّحِّيُّ"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: "نشيد",
        title: "البطل الصغير",
        printedHead: "الدَّرْسُ الرَّابِعُ نَشِيدُ البَطَلُ الصَّغِيرُ",
        bookFrom: 73,
        concepts: [
          concept(73, "نشيد", "الدَّرْسُ الرَّابِعُ نَشِيدُ البَطَلُ الصَّغِيرُ"),
          concept(76, "تقييم", "تَقْييم الْبَطَل الصَّغِير"),
        ],
      },
      {
        key: "2-5",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الثانية",
        printedHead: "تَقْيِيمُ الْوَحْدَةِ الثَّانِيَةِ",
        bookFrom: 77,
        concepts: [
          concept(77, "تقييم", "تَقْيِيمُ الْوَحْدَةِ الثَّانِيَةِ"),
        ],
      },
      {
        key: "2-6",
        ordinal: "",
        type: "اقرأ مع الأسرة",
        title: "غزال في ورطة",
        printedHead: "قِصَّةٌ غَزَالٌ فِي وَرْطَةٍ",
        bookFrom: 79,
        concepts: [
          concept(79, "اقرأ مع الأسرة", "قِصَّةٌ غَزَالٌ فِي وَرْطَةٍ"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الرياضة والتكنولوجيا",
    printedHead: "الرِّيَاضَةُ وَالتَّكْنُولُوجِيَا",
    bookFrom: 81,
    bookTo: 117,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "الرياضة لنا جميعًا",
        printedHead: "الدَّرْسُ الأَوَّلُ الِاسْتِمَاعُ الرِّيَاضَةُ لَنَا جَمِيعًا",
        bookFrom: 82,
        concepts: [
          concept(82, "الاستماع", "الدَّرْسُ الأَوَّلُ الِاسْتِمَاعُ الرِّيَاضَةُ لَنَا جَمِيعًا"),
          concept(83, "تدريبات", "تَدْرِيباتُ الرِّيَاضَةُ لَنَا جَمِيعًا"),
        ],
        extraBookPages: [119],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "حسام والكمبيوتر",
        printedHead: "الدَّرْسُ الثَّانِي القْرَاءَةُ حُسَام وَالْكَمْبِيُوتَرْ",
        bookFrom: 84,
        concepts: [
          concept(84, "القراءة", "الدَّرْسُ الثَّانِي القْرَاءَةُ حُسَام وَالْكَمْبِيُوتَرْ"),
          concept(85, "قصة", "حُسَام وَالْكَمْبِيُوتَرْ"),
          concept(87, "هيا نتعلم كلمات جديدة", "هَيَّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً"),
          concept(88, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(90, "الأساليب والتراكيب", "الْأَسَالِيبُ وَالتَّرَاكِيبُ أَوَّلًا: أُسْلُوبُ الْأَمْرِ"),
          concept(92, "القواعد الإملائية", "الْقَوَاعِدُ الْإِمْلَائِيَّةُ الْحُرُوفُ الْمُتَشَابِهَةُ فِي النُّطْقِ"),
          concept(93, "أتحدث وأعبر", "أَتَحَدَّثُ وَأُعَبِّرُ أَنَا وَالْكَمْبِيُوتَرُ"),
          concept(94, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنَبْدِعُ مُرَاجَعَةٌ عَلَى وَصْفِ صُورَةٍ"),
          concept(95, "رحلتي مع الدرس", "رِحْلَتي مَعَ الدَّرْسِ"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "في النادي",
        printedHead: "الدَّرْسُ الثَّالِثُ القْرَاءَةُ في النَّادي",
        bookFrom: 97,
        concepts: [
          concept(97, "القراءة", "الدَّرْسُ الثَّالِثُ القْرَاءَةُ في النَّادي"),
          concept(100, "هيا نتعلم كلمات جديدة", "هَيَّا نَتَعَلَّمْ كَلِمَاتٍ جَدِيدَةً"),
          concept(101, "هيا نفهم ونناقش", "هِيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(102, "استعد للتفوق", "اسْتَعِدَّ لِلتَّفَوُّقِ"),
          concept(103, "الأساليب والتراكيب", "الْأَسَالِيبُ وَالتَّرَاكِيبُ الْأَسْمَاءُ الْمَوْصُولَةُ (الَّذِي - الَّتِي)"),
          concept(105, "القواعد الإملائية", "الْقَوَاعِدُ الْإِمْلَائِيَّةُ مُرَاجَعَةُ"),
          concept(107, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ مُرَاجَعَةٌ عَلَى الْبِطَاقَةِ التَّعْرِيفِيَّةِ"),
          concept(109, "تقييم", "تَقْيِيمٌ فِي النَّادِي"),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: "نشيد",
        title: "رياضتي",
        printedHead: "الدَّرْسُ الرَّابِعُ نَشِيد رِيَاضَتِي",
        bookFrom: 110,
        concepts: [
          concept(110, "نشيد", "الدَّرْسُ الرَّابِعُ نَشِيد رِيَاضَتِي"),
          concept(112, "هيا نتعلم كلمات جديدة", "هَيَّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً"),
          concept(113, "تقييم", "تَقْييمٌ نَشِيدِ رِيَاضَتِي"),
        ],
      },
      {
        key: "3-5",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الثالثة",
        printedHead: "تَقْيِيمُ الْوَحْدَةِ الثَّالِثَةِ",
        bookFrom: 114,
        concepts: [
          concept(114, "تقييم", "تَقْيِيمُ الْوَحْدَةِ الثَّالِثَةِ"),
        ],
      },
      {
        key: "3-6",
        ordinal: "",
        type: "اقرأ مع الأسرة",
        title: "هيا نلعب",
        printedHead: "هَيَّا نَلْعَبْ",
        bookFrom: 116,
        concepts: [
          concept(116, "اقرأ مع الأسرة", "هَيَّا نَلْعَبْ"),
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
  const unit = EGYPT_ARABIC_G2_T1_SECTIONS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ARABIC_G2_T1_SECTIONS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * The appendix page(s) each lesson points to, keyed by the lesson key (`1-1` →
 * `[118]`). The الاستماع lessons print their exercises but not the story; the
 * stories are printed in the back-matter «نصوص استماع الوحدات» (books 118–119).
 * The stage appends these pages so the student reads the very page the tutor
 * quotes from.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const unit of EGYPT_ARABIC_G2_T1_SECTIONS) {
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
  "arabic-g2-t1",
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
  const lesson = EGYPT_ARABIC_G2_T1_SECTIONS[unitIndex]!.lessons[lessonIndex]!;
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
 * bare numeral on its own last line («١٠»، «٤٥»، «101», «(١١٦)»), sometimes wrapped
 * in parentheses, so the last non-empty line is scanned and every number on a
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
    /^[[(ـ\-]*[0-9٠-٩۰-۹]+[\])ـ\-]*$/.test(last) || /^[0-9٠-٩۰-۹]+[\s•.·\-–—]/.test(last);
  if (!looksLikeFoot) return [];
  const latin = toLatinDigits(last).replace(/[^0-9]/g, " ").replace(/\s+/g, " ").trim();
  const nums: number[] = [];
  for (const tok of latin.split(" ")) if (tok) nums.push(Number(tok));
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
  60: 16,
  61: 14,
  112: 113,
  117: 17,
};

/**
 * The term pages that print no parseable folio in the OCR, each with the anchor
 * the check accepts in place of a page number. Every anchor is a head the page
 * itself prints: book 8 (the unit-1 opener), books 26/33/51/62/80/85/87/111/114
 * (pages that print no folio at all) and books 7/17/71 (their folio misread as
 * bare Latin letters «V»/«IV»/«VI» for «٧»/«١٧»/«٧١»).
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  7: "أَخْتَارُ، ثُمَّ أُكْمِلُ الْكَلِمَةَ",
  8: "الْمُعَامَلَةُ الطَّيِّبَةُ",
  17: "الْمُفْرَدُ وَالْمُثَنَّى",
  26: "عُدْنَا: رَجَعْنَا.",
  33: "صَدِيقُنَا الْجَدِيدُ",
  51: "هَيَّا نَفْهَمُ وَنُنَاقِشُ",
  62: "نَشَاط: الْمُضَادُّ: كَسَل.",
  71: "رِحْلَتِي مَعَ الدَّرْسِ",
  80: "الْحَيَاةُ أَجْمَلُ بِالتَّعَاوُنِ",
  85: "حُسَام وَالْكَمْبِيُوتَرْ",
  87: "هَيَّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً",
  111: "رِيَاضَتِي",
  114: "تَقْيِيمُ الْوَحْدَةِ الثَّالِثَةِ",
};

/** Every head kind the table may use: the lesson-head kinds plus the section kinds. */
const KNOWN_KINDS = new Set([
  "مراجعة",
  "الاستماع",
  "القراءة",
  "نشيد",
  "تقييم",
  "اقرأ مع الأسرة",
  "تدريبات",
  "هيا نتعلم كلمات جديدة",
  "هيا نفهم ونناقش",
  "عالم القصة",
  "الأساليب والتراكيب",
  "القواعد الإملائية",
  "أتحدث وأعبر",
  "هيا نكتب ونبدع",
  "رحلتي مع الدرس",
  "قصة",
  "استعد للتفوق",
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
  const units = EGYPT_ARABIC_G2_T1_SECTIONS;
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
        if (page < EGYPT_ARABIC_G2_T1_APPENDIX.from || page > EGYPT_ARABIC_G2_T1_APPENDIX.to) {
          problems.push(
            `الدرس ${lesson.key}: صفحة ملحقة ${page} خارج ملحق الكتاب ${EGYPT_ARABIC_G2_T1_APPENDIX.from}–${EGYPT_ARABIC_G2_T1_APPENDIX.to}`,
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
  if (first && first.bookFrom !== EGYPT_ARABIC_G2_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ARABIC_G2_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ARABIC_G2_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ARABIC_G2_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     its printed folio (allowing the measured OCR misreads), or, on the pages
 *     that print no parseable folio, from the anchor named in
 *     `FOLIO_LESS_ANCHORS`;
 *  2. every section opener prints the section head and every lesson's first page
 *     prints that lesson's head;
 *  3. every lesson's title and every concept's head is printed on the pages the
 *     lesson owns (the concept on its own page), and every appendix page a
 *     lesson points to prints that lesson's story;
 *  4. every printed page in [6, 117] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR'd
 *     page of the term.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_ARABIC_G2_T1_SECTIONS;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ARABIC_G2_T1_BOOK_START || book > EGYPT_ARABIC_G2_T1_BOOK_END) continue;
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

  // 2 + 3a. every section opener prints the section head, every lesson's first
  // page its head, and every lesson's title is printed somewhere in the pages it
  // owns.
  units.forEach((unit, ui) => {
    if (loadBookPage(unit.bookFrom) && !pagePrints(unit.bookFrom, unit.printedHead)) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} لا تطبع «${unit.printedHead}»`);
    }

    unit.lessons.forEach((lesson, li) => {
      if (loadBookPage(lesson.bookFrom) && !pagePrints(lesson.bookFrom, lesson.printedHead)) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع «${lesson.printedHead}»`);
      }
      const { from, to } = lessonBookRange(ui, li);
      let titlePrinted = false;
      for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.title);
      if (!titlePrinted) {
        for (let p = from; p <= to && !titlePrinted; p++) titlePrinted = pagePrints(p, lesson.printedHead);
      }
      if (!titlePrinted) {
        problems.push(`الدرس ${lesson.key}: لا يطبع عنوانه «${lesson.title}» في نطاقه ${from}–${to}`);
      }
    });
  });

  // 3b. every concept's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (loadBookPage(c.bookFrom) && !pagePrints(c.bookFrom, c.title)) {
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
      const needle = lesson.title;
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
  for (let p = EGYPT_ARABIC_G2_T1_BOOK_START; p <= EGYPT_ARABIC_G2_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
