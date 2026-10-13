// PHASE 134 — official Egypt Primary-3 (Grade 3) Arabic language
// («اللغة العربية» — الصف الثالث الابتدائي، الفصل الدراسي الأول)، 2025/2026
// edition.
//
// The curriculum tree for the Egypt `eg-g3-arabic` curriculum is rebuilt from the
// Ministry textbook (122 scan pages, 115 of them OCR'd). This module is the
// single source of truth for its structure: the three printed units of the first
// term (العمل والأمل، صفاتي الجميلة، أحب بلدي), every printed lesson inside them
// (الاستماع، القراءة، نشيد، تقييم الوحدة، اقرأ مع الأسرة), and, for every lesson,
// the book's own printed heads, verbatim and with the printed page they start on.
// The self-checks at the bottom prove that mapping against the OCR itself, page
// by page.
//
// THE OFFSET IS ONE — book page = scan page − 1
// Every content page that carries a folio prints its own number, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here: scan 9 prints
// «٨» (book 8, the unit-1 تدريبات), scan 19 prints «١٨» (book 18, a «أتحدث
// وأعبر» page), scan 42 prints «٤١» (book 41, the «الطائرة التي حلّقت أخيرًا»
// family story's second page), scan 77 prints «٧٦» (book 76, the unit-2
// evaluation's second page), scan 111 prints «١١٠» (book 110, the «وطني»
// تدريبات) and scan 116 prints «(١١٦)» (book 115, the «الأسد المميز» family
// story's second page). The book's own «الفهرس» (scans 5–6) independently
// confirms the lesson starts.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–6 are before the term: the cover (1), the credits masthead (2),
// the «مقدمة» (3), the robot-guide page (4) and the printed «الفهرس» (5–6).
// Scan pages 117–122 are after the term: the book-wide «نصوص الاستماع» appendix
// (books 116–119 = scans 117–120, holding the three unit listening texts and the
// unit-assessment listening paragraphs), the publisher data page (121) and the
// back cover (122). The term runs from the «الوحدة الأولى» opener (book 6 = scan
// 7) to the «الأسد المميز» family story's second page (book 115 = scan 116):
// `EGYPT_ARABIC_G3_T1_BOOK_START` / `_BOOK_END` are exactly those two pages, and
// the tiling assertion proves nothing in between is left unreachable.
//
// FIVE SCANS WERE NEVER PRODUCED — THE PAGES BETWEEN EXIST, THE OCR DOESN'T
// The OCR corpus has 115 files for a 122-page book; scans 16, 25, 75, 81 and 93
// are absent (scan 1 — the cover — and scan 121 were also never produced, both
// outside the term). Four of the five absences fall inside a lesson range (they
// are story / activity / evaluation pages), so the tiling is unaffected: the page
// is still owned by exactly one lesson, it simply has no OCR text to check. The
// fifth, book 80 (scan 81), is the **unit-3 الاستماع lesson opener** — the only
// lesson opener the OCR lost; its head is therefore taken from the book's own
// «الفهرس» and its page-proof check is skipped (as it is for any page with no
// OCR text). They are listed in `MISSING_SCANS` so the gap is measured, not
// guessed.
//
// THIRTY-TWO TERM PAGES PRINT NO PARSEABLE FOLIO IN THE OCR
// Twenty-nine carry no machine-readable number at all: the three unit openers
// (books 6/42/79), the seven lesson openers that print only their own head
// (7/9/22/34/43/45/58), the four نشيد/قواعد openers (17/71/72/95), the seven
// story / activity pages (11/23/47/48/60/78/84/97) and the unit-evaluation and
// family-story pages (38/77/111). Three more print a folio the OCR misread as
// bare Latin letters — there are none in this book, so every such page is
// anchored on a printed head that only that page carries (see
// `FOLIO_LESS_ANCHORS`). Six further pages print a folio the OCR misread as a
// different number («١٢» as «١٣» on book 12, «٥٣» as «100» on book 53, «٥٦» as
// «٥١» on book 56, «٦٩» as «79» on book 69, «٧٦» as «٧١» on book 76 and «١١٢»
// as «١١٣» on book 112); those measured values live in `FOOTER_OCR_MISREADS` so
// the check stays strict instead of statistical.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// The book prints no per-lesson «أهداف» bullets as heads; its lesson layer is
// the lesson head (الدرس الأول الاستماع …) and its activity layer is the band
// heads it prints on the pages themselves (تدريبات، هيا نتعلم كلمات جديدة، هيا
// نفهم ونناقش، أرسم حلمي، هيا نفكر معًا، هيا نلعب ونتعلم، هيا نصمم معًا، مشهد
// تمثيلي، يوم السعادة، الأساليب والتراكيب، القواعد الإملائية، أتحدث وأعبر، هيا
// نكتب ونبدع، رحلتي مع الدرس، تقييم). Every concept below is one such head,
// transcribed verbatim from the OCR of the page its `bookFrom` names — including
// the OCR's own misreads of the printed headings («نشيد» for «نَشِيد»، «وطني»
// for «وَطَني») — so the page-proves-the-head check compares the transcription
// against the very text it was taken from.
//
// THE LISTENING TEXTS LIVE IN A BOOK-WIDE APPENDIX
// The الاستماع lessons print their exercises but deliberately not the story; the
// three stories are printed in the back-matter «نصوص استماع الوحدات» (books 117
// and 118). Each such lesson therefore also owns its appendix page through
// `extraBookPages`, so the tutor scoped to that lesson can quote the very story
// the book points it to. The appendix is not a lesson: it stays outside the tiled
// unit ranges.
//
// THE UNIT OPENER RIDES WITH THE FIRST LESSON
// Each unit opens with a one-page unit title (books 6, 42 and 79) that the
// الفهرس does not list as its own lesson. It is owned by the unit's first
// (الاستماع) lesson, whose range therefore starts one page before the lesson
// head, exactly as the Grade-2 book's units do.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 1 (verified: book p.115 = scan p.116). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the term — the «الوحدة الأولى» opener (scan 7). */
export const EGYPT_ARABIC_G3_T1_BOOK_START = 6;

/** Last printed page of the term — «الأسد المميز» p.2 (scan 116). */
export const EGYPT_ARABIC_G3_T1_BOOK_END = 115;

/** The scanned pages before the term: cover, credits, مقدمة, robot guide, فهرس. */
export const EGYPT_ARABIC_G3_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The scanned pages after the term: the appendix divider, the listening appendices and the cover. */
export const EGYPT_ARABIC_G3_T1_BACK_MATTER = { from: 117, to: 122 } as const;

/**
 * The book-wide listening-text appendix, in book pages: «نصوص استماع الوحدات»
 * (books 117–118) holds the three unit listening stories the الاستماع lessons
 * point to; «فقرات استماع تقييمات الوحدات» (book 119) holds the book-wide
 * listening paragraphs and unit-assessment passages.
 */
export const EGYPT_ARABIC_G3_T1_APPENDIX = { from: 116, to: 119 } as const;

/**
 * The term pages the OCR never produced, in book pages. They exist in the book
 * (each is still owned by exactly one lesson) but have no text to check; book 80
 * is the one lesson opener among them.
 */
export const MISSING_SCANS: readonly number[] = [15, 24, 74, 80, 92];

/** One printed head of the textbook — becomes one concept in the app tree. */
export interface ArabicG3T1Concept {
  bookFrom: number;
  kind: string;
  title: string;
}

/** One printed lesson of the textbook — becomes one lesson in the app tree. */
export interface ArabicG3T1Lesson {
  /** App-addressable key, e.g. "1-3" (unit 1, lesson 3). */
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
  concepts: ArabicG3T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to (its listening story).
   * Kept outside the tiled unit ranges but included in the lesson's RAG document.
   */
  extraBookPages?: number[];
}

/** One printed unit of the book. */
export interface ArabicG3T1Section {
  kind: "unit";
  /** Internal key: "1"…"3". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: العمل والأمل". */
  title: string;
  /** The section head the opener page prints, e.g. "العمل والأمل". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next section's opener). */
  bookTo: number;
  lessons: ArabicG3T1Lesson[];
}

function concept(bookFrom: number, kind: string, title: string): ArabicG3T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The three units of the first term with their printed lessons and every printed
 * head, transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 */
export const EGYPT_ARABIC_G3_T1_SECTIONS: ArabicG3T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: العمل والأمل",
    printedHead: "الْعَمَلُ وَالْأَمَلُ",
    bookFrom: 6,
    bookTo: 41,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "ازرع نبتة",
        printedHead: "الدَّرْسُ الأَوَّلُ الاسْتِمَاعُ ازْرَعْ نَبْتَةً",
        bookFrom: 7,
        concepts: [
          concept(7, "الاستماع", "الدَّرْسُ الأَوَّلُ الاسْتِمَاعُ ازْرَعْ نَبْتَةً"),
          concept(8, "تدريبات", "تَدْرِيبَات أَزْرَعُ نَبْتَةً"),
        ],
        extraBookPages: [117],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "من فضلك.. كرر المحاولة",
        printedHead: "الدَّرْسُ الثَّانِي الْقِرَاءَةُ مِنْ فَضْلِكَ.. كَرِّرِ الْمُحَاوَلَةَ",
        bookFrom: 9,
        concepts: [
          concept(9, "القراءة", "الدَّرْسُ الثَّانِي الْقِرَاءَةُ مِنْ فَضْلِكَ.. كَرِّرِ الْمُحَاوَلَةَ"),
          concept(12, "هيا نتعلم كلمات جديدة", "هَيَّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً"),
          concept(13, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(14, "أرسم حلمي", "أَرْسُمُ حُلْمِي"),
          concept(16, "نشاط", "نشاط ٣ أُرَتِّبُ الْكَلِمَاتِ الْآتِيَةَ؛ لِأُكَوِّنَ سُؤَالًا مُنَاسِبًا كَالْمِثَالِ:"),
          concept(17, "القواعد الإملائية", "الْمَقَاطِعُ الصَّوْتِيَّةُ الْقَوَاعِدُ الْإِمْلَائِيَّةُ"),
          concept(18, "أتحدث وأعبر", "أَتَحَدَّثُ وَأُعَبِّرُ حَاوِلْ مَرَّةً أُخْرَى"),
          concept(19, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ الْقِصَّةُ الْمُصَوَّرَةُ"),
          concept(20, "رحلتي مع الدرس", "رِحْلَتِي مَعَ الدَّرْسِ"),
          concept(21, "تقييم", "تَقْيِيمُ مِنْ فَضْلِكَ.. كَرِّرِ الْمُحَاوَلَةَ"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "البطل الخفي",
        printedHead: "الدَّرْسُ الثَّالِثُ الْقِرَاءَةُ الْبَطَلُ الْخَفِيُّ",
        bookFrom: 22,
        concepts: [
          concept(22, "القراءة", "الدَّرْسُ الثَّالِثُ الْقِرَاءَةُ الْبَطَلُ الْخَفِيُّ"),
          concept(25, "هيا نتعلم كلمات جديدة", "هَيَّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً"),
          concept(26, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(27, "هيا نفكر معًا", "هَيَّا نُفَكِّرْ مَعًا"),
          concept(28, "الأساليب والتراكيب", "الْأَسَالِيبُ وَالتَّرَاكِيبُ"),
          concept(29, "القواعد الإملائية", "الْقَوَاعِدُ الْإِمْلَائِيَّةُ"),
          concept(30, "أتحدث وأعبر", "شُكْرًا لَكَ أَتَحَدَّثُ وَأُعَبِّرُ"),
          concept(31, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ مُرَاجَعَةٌ عَلَى الْقِصَّةِ الْمُصَوَّرَةِ"),
          concept(32, "رحلتي مع الدرس", "رِحْلَتِي مَعَ الدَّرْسِ"),
          concept(33, "تقييم", "تَقْيِيمُ الْبَطَلُ الْخَفِيُّ"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: "نشيد",
        title: "أسرار النجاح",
        printedHead: "الدَّرْسُ الرَّابِعُ نَشِيد أَسْرَارُ النَّجَاحِ",
        bookFrom: 34,
        concepts: [
          concept(34, "نشيد", "الدَّرْسُ الرَّابِعُ نَشِيد أَسْرَارُ النَّجَاحِ"),
          concept(36, "هيا نتعلم كلمات جديدة", "هَيَّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً"),
          concept(37, "تقييم", "تَقْيِيم أَسْرَارُ النَّجَاحِ"),
        ],
      },
      {
        key: "1-5",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الأولى",
        printedHead: "تَقْيِيمُ الْوَحْدَةِ الْأُولَى",
        bookFrom: 38,
        concepts: [concept(38, "تقييم", "تَقْيِيمُ الْوَحْدَةِ الْأُولَى")],
      },
      {
        key: "1-6",
        ordinal: "",
        type: "اقرأ مع الأسرة",
        title: "الطائرة التي حلّقت أخيرًا",
        printedHead: "قصة الطَّائِرَةُ الَّتِي حَلَّقَتْ أَخِيرًا",
        bookFrom: 40,
        concepts: [concept(40, "اقرأ مع الأسرة", "قصة الطَّائِرَةُ الَّتِي حَلَّقَتْ أَخِيرًا")],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: صفاتي الجميلة",
    printedHead: "صِفَاتِي الْجَمِيلَةُ",
    bookFrom: 42,
    bookTo: 78,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "الزهرة والصبار",
        printedHead: "الدَّرْسُ الأَوَّلُ الاسْتِمَاعُ الزَّهْرَةُ وَالصَّبَّارُ",
        bookFrom: 43,
        concepts: [
          concept(43, "الاستماع", "الدَّرْسُ الأَوَّلُ الاسْتِمَاعُ الزَّهْرَةُ وَالصَّبَّارُ"),
          concept(44, "تدريبات", "تَدْرِيبَاتِ الزَّهْرَةُ وَالصَّبَّارُ"),
        ],
        extraBookPages: [117],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "السعادة في المساعدة",
        printedHead: "الدَّرْسُ الثَّانِي الْقِرَاءَةُ السَّعَادَةُ فِي الْمُسَاعَدَةِ",
        bookFrom: 45,
        concepts: [
          concept(45, "القراءة", "الدَّرْسُ الثَّانِي الْقِرَاءَةُ السَّعَادَةُ فِي الْمُسَاعَدَةِ"),
          concept(48, "هيا نتعلم كلمات جديدة", "هَيَّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً"),
          concept(49, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(50, "نشاط", "يَوْمُ السَّعَادَةِ"),
          concept(51, "الأساليب والتراكيب", "الْأَسَالِيبُ وَالتَّرَاكِيبُ"),
          concept(53, "القواعد الإملائية", "الْقَوَاعِدُ الْإِمْلَائِيَّةُ التَّنْوِينُ"),
          concept(54, "أتحدث وأعبر", "أُسَاعِدُ غَيْرِي أَتَحَدَّثُ وَأُعَبِّرُ"),
          concept(55, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ كِتَابَةُ نِهَايَةٍ جَدِيدَةٍ لِقِصَّةٍ"),
          concept(56, "رحلتي مع الدرس", "رِحْلَتِي مَعَ الدَّرْسِ"),
          concept(57, "تقييم", "تَقْيِيم السَّعَادَةُ فِي الْمُسَاعَدَةِ"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "أول من رفع يده",
        printedHead: "الدَّرْسُ الثَّالِثُ أَوَّلُ مَنْ رَفَعَ يَدَهُ الْقِرَاءَةُ",
        bookFrom: 58,
        concepts: [
          concept(58, "القراءة", "الدَّرْسُ الثَّالِثُ أَوَّلُ مَنْ رَفَعَ يَدَهُ الْقِرَاءَةُ"),
          concept(61, "هيا نتعلم كلمات جديدة", "هَيَّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً"),
          concept(62, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(63, "هيا نلعب ونعلم", "هَيَّا نَلْعَبْ وَنَتَعَلَّمْ"),
          concept(64, "الأساليب والتراكيب", "الْأَسَالِيبُ وَالتَّرَاكِيبُ أُسْلُوبُ النَّفْيِ"),
          concept(66, "القواعد الإملائية", "الْقَوَاعِدُ الْإِمْلَائِيَّةُ"),
          concept(67, "أتحدث وأعبر", "أَتَحَدَّثُ وَأُعَبِّرُ أَنَا مُبَادِرٌ"),
          concept(68, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ مُرَاجَعَةٌ عَلَى كِتَابَةِ نِهَايَةٍ جَدِيدَةٍ لِقِصَّةٍ"),
          concept(69, "رحلتي مع الدرس", "رِحْلَتِي مَعَ الدَّرْسِ"),
          concept(70, "تقييم", "تَقْيِيم أَوَّلُ مَنْ رَفَعَ يَدَهُ"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: "نشيد",
        title: "أخلاقنا",
        printedHead: "نَشِيد أَخْلَاقُنَا",
        bookFrom: 71,
        concepts: [
          concept(71, "نشيد", "نَشِيد أَخْلَاقُنَا"),
          concept(73, "هيا نتعلم كلمات جديدة", "هَيَّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً"),
        ],
      },
      {
        key: "2-5",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الثانية",
        printedHead: "تَقْيِيمُ الْوَحْدَةِ الثَّانِيَةِ",
        bookFrom: 75,
        concepts: [concept(75, "تقييم", "تَقْيِيمُ الْوَحْدَةِ الثَّانِيَةِ")],
      },
      {
        key: "2-6",
        ordinal: "",
        type: "اقرأ مع الأسرة",
        title: "الرسالة الصغيرة",
        printedHead: "قِصَّةٌ الرِّسَالَةُ الصَّغِيرَةُ",
        bookFrom: 77,
        concepts: [concept(77, "اقرأ مع الأسرة", "قِصَّةٌ الرِّسَالَةُ الصَّغِيرَةُ")],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: أحب بلدي",
    printedHead: "أُحِبُّ بَلَدِي",
    bookFrom: 79,
    bookTo: 115,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "العصفور الجريء",
        printedHead: "الدَّرْسُ الأَوَّلُ الِاسْتِمَاعُ الْعُصْفُورُ الْجَرِيءُ",
        bookFrom: 80,
        concepts: [
          concept(80, "الاستماع", "الدَّرْسُ الأَوَّلُ الِاسْتِمَاعُ الْعُصْفُورُ الْجَرِيءُ"),
          concept(81, "تدريبات", "تَدْرِيبَات الْعُصْفُورُ الْجَرِيءُ"),
        ],
        extraBookPages: [118],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "صندوق الابتكار",
        printedHead: "الدَّرْسُ الثَّانِي الْقِرَاءَةُ صُنْدُوقُ الْابْتِكَارِ",
        bookFrom: 82,
        concepts: [
          concept(82, "القراءة", "الدَّرْسُ الثَّانِي الْقِرَاءَةُ صُنْدُوقُ الْابْتِكَارِ"),
          concept(85, "هيا نتعلم كلمات جديدة", "هَيَّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً"),
          concept(86, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(87, "هيا نصمم معًا", "هَيَّا نُصَمِّمُ مَعًا"),
          concept(88, "الأساليب والتراكيب", "الْأَسَالِيبُ وَالتَّرَاكِيبُ"),
          concept(90, "القواعد الإملائية", "الْقَوَاعِدُ الْإِمْلَائِيَّةُ"),
          concept(91, "أتحدث وأعبر", "أَتَحَدَّثُ وَأُعَبِّرُ زَهْرِيَّةٌ جَمِيلَةٌ"),
          concept(93, "رحلتي مع الدرس", "رِحْلَتِي مَعَ الدَّرْسِ"),
          concept(94, "تقييم", "تَقْيِيم صُنْدُوقُ الْابْتِكَارِ"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "ورقة من التاريخ",
        printedHead: "الدَّرْسُ الثَّالِثُ الْقِرَاءَةُ وَرَقَةٌ مِنْ التَّارِيخ",
        bookFrom: 95,
        concepts: [
          concept(95, "القراءة", "الدَّرْسُ الثَّالِثُ الْقِرَاءَةُ وَرَقَةٌ مِنْ التَّارِيخ"),
          concept(98, "هيا نتعلم كلمات جديدة", "هَيَّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً"),
          concept(99, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(100, "مشهد تمثيلي", "مَشْهَدٌ تَمْثِيلِيٌّ"),
          concept(101, "الأساليب والتراكيب", "الْأَسَالِيبُ وَالتَّرَاكِيبُ"),
          concept(103, "القواعد الإملائية", "الْقَوَاعِدُ الْإِمْلَائِيَّةُ"),
          concept(104, "أتحدث وأعبر", "فِي الْمَتْحَفِ أَتَحَدَّثُ وَأُعَبِّرُ"),
          concept(105, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ مُرَاجَعَةٌ عَلَى كِتَابَةِ نِهَايَةٍ جَدِيدَةٍ لِقِصَّةٍ"),
          concept(106, "رحلتي مع الدرس", "رِحْلَتِي مَعَ الدَّرْسِ"),
          concept(107, "تقييم", "تَقييم وَرَقَةٌ مِنَ التَّارِيخِ"),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: "نشيد",
        title: "وطني",
        printedHead: "الدَّرْسُ الرَّابِعُ نَشِيد وَطَني",
        bookFrom: 108,
        concepts: [
          concept(108, "نشيد", "الدَّرْسُ الرَّابِعُ نَشِيد وَطَني"),
          concept(110, "تدريبات", "تَدْرِيبَات وَطَنِي"),
          concept(111, "تقييم", "تَقْيِيم وَطَنِي"),
        ],
      },
      {
        key: "3-5",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الثالثة",
        printedHead: "تَقْيِيمُ الْوَحْدَةِ الثَّالِثَةِ",
        bookFrom: 112,
        concepts: [concept(112, "تقييم", "تَقْيِيمُ الْوَحْدَةِ الثَّالِثَةِ")],
      },
      {
        key: "3-6",
        ordinal: "",
        type: "اقرأ مع الأسرة",
        title: "الأسد المميز",
        printedHead: "قصة الْأَسَدُ الْمُمَيَّزُ",
        bookFrom: 114,
        concepts: [concept(114, "اقرأ مع الأسرة", "قصة الْأَسَدُ الْمُمَيَّزُ")],
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
  const unit = EGYPT_ARABIC_G3_T1_SECTIONS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ARABIC_G3_T1_SECTIONS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * The appendix page(s) each lesson points to, keyed by the lesson key (`1-1` →
 * `[117]`). The الاستماع lessons print their exercises but not the story; the
 * stories are printed in the back-matter «نصوص استماع الوحدات» (books 117–118).
 * The stage appends these pages so the student reads the very page the tutor
 * quotes from.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const unit of EGYPT_ARABIC_G3_T1_SECTIONS) {
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
  "arabic-g3-t1",
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
  const lesson = EGYPT_ARABIC_G3_T1_SECTIONS[unitIndex]!.lessons[lessonIndex]!;
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
 * bare numeral on its own last line («٨»، «١٨»، «(١١٦)»), sometimes wrapped in
 * parentheses, so the last non-empty line is scanned and every number on a
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
  12: 13,
  53: 100,
  56: 51,
  69: 79,
  76: 71,
  112: 113,
};

/**
 * The term pages that print no parseable folio in the OCR, each with the anchor
 * the check accepts in place of a page number. Every anchor is a head the page
 * itself prints: the three unit openers (6/42/79), the lesson openers that carry
 * only their own head (7/9/22/34/43/45/58), the نشيد/قواعد openers (17/71/72/95),
 * the story/activity pages (11/23/26/30/46/47/48/55/60/78/84/97) and the
 * evaluation / family-story pages (38/77/108/111).
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  6: "الْعَمَلُ وَالْأَمَلُ",
  7: "ازْرَعْ نَبْتَةً",
  9: "مِنْ فَضْلِكَ.. كَرِّرِ الْمُحَاوَلَةَ",
  10: "مِنْ فَضْلِكَ.. كَرِّرِ المُحاوَلَةَ",
  11: "جَلَسَ وَالِدِي بِجِوَارِي",
  17: "الْمَقَاطِعُ الصَّوْتِيَّةُ",
  22: "البطل الخفي",
  23: "البَطَلُ الخَفِيُّ",
  26: "هَيَّا نَفْهَمُ وَنُنَاقِشُ",
  30: "شُكْرًا لَكَ",
  34: "أَسْرَارُ النَّجَاحِ",
  38: "تَقْيِيمُ الْوَحْدَةِ الْأُولَى",
  42: "صِفَاتِي الْجَمِيلَةُ",
  43: "الزَّهْرَةُ وَالصَّبَّارُ",
  45: "السَّعَادَةُ في المُسَاعَدَةِ",
  46: "السَّعَادَةُ فِي المُسَاعَدَةِ",
  47: "قَالَتِ الْمُعَلِّمَةُ",
  48: "هَيَّا نَتَعَلَّمُ كَلِمَاتٍ جَدِيدَةً",
  55: "هَيَّا نَكْتُبُ وَنُبْدِعُ",
  58: "أَوَّلُ مَنْ رَفَعَ يَدَهُ",
  60: "تَوَجَّهَتْ إِيمَانُ إِلَى السَّبُّورَةِ",
  71: "نَشِيد أَخْلَاقُنَا",
  72: "أَخْلَاقُنَا جَمِيلَةٌ كَالشَّمْسِ",
  77: "قِصَّةٌ الرِّسَالَةُ الصَّغِيرَةُ",
  78: "بَعْدَ الْفُسْحَةِ عَادَ آدَمُ",
  79: "أُحِبُّ بَلَدِي",
  82: "صُنْدُوقُ الْابْتِكَارِ",
  84: "كَانَ الْأَطْفَالُ يُنْصِتُونَ لِسَلْمَى",
  95: "وَرَقَةٌ مِنْ التَّارِيخ",
  97: "أَنَا فَخُورٌ بِوَطَنِي مِصْرَ",
  108: "وَطَني",
  111: "وَطَنِي",
};

/** Every head kind the table may use: the lesson-head kinds plus the section kinds. */
const KNOWN_KINDS = new Set([
  "الاستماع",
  "القراءة",
  "نشيد",
  "تقييم",
  "اقرأ مع الأسرة",
  "تدريبات",
  "هيا نتعلم كلمات جديدة",
  "هيا نفهم ونناقش",
  "أرسم حلمي",
  "هيا نفكر معًا",
  "هيا نلعب ونعلم",
  "هيا نصمم معًا",
  "مشهد تمثيلي",
  "الأساليب والتراكيب",
  "القواعد الإملائية",
  "أتحدث وأعبر",
  "هيا نكتب ونبدع",
  "رحلتي مع الدرس",
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
  const units = EGYPT_ARABIC_G3_T1_SECTIONS;

  units.forEach((unit, ui) => {
    if (!unit.title.trim()) problems.push(`القسم ${unit.key}: بلا عنوان`);
    if (!unit.printedHead.trim()) problems.push(`القسم ${unit.key}: بلا عنوان مطبوع`);
    if (unit.lessons.length === 0) problems.push(`القسم ${unit.key}: بلا دروس`);

    unit.lessons.forEach((lesson, li) => {
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
        if (page < EGYPT_ARABIC_G3_T1_APPENDIX.from || page > EGYPT_ARABIC_G3_T1_APPENDIX.to) {
          problems.push(
            `الدرس ${lesson.key}: صفحة ملحقة ${page} خارج ملحق الكتاب ${EGYPT_ARABIC_G3_T1_APPENDIX.from}–${EGYPT_ARABIC_G3_T1_APPENDIX.to}`,
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
  const lastUnit = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_ARABIC_G3_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ARABIC_G3_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (lastUnit && lastUnit.bookTo !== EGYPT_ARABIC_G3_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ARABIC_G3_T1_BOOK_END}، وجدنا ${lastUnit.bookTo}`);
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
 *  4. every printed page in [6, 115] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR'd
 *     page of the term.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_ARABIC_G3_T1_SECTIONS;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ARABIC_G3_T1_BOOK_START || book > EGYPT_ARABIC_G3_T1_BOOK_END) continue;
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
        problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق صفحته`);
      }
    }
  }

  // 2. every section opener prints the section head and every lesson's first page
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

  // 3a. every concept's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (loadBookPage(c.bookFrom) && !pagePrints(c.bookFrom, c.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة المكوّن ${c.bookFrom} لا تطبع «${c.title}»`);
        }
      });
    });
  });

  // 3b. every appendix page a lesson points to prints that lesson's story.
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
  for (let p = EGYPT_ARABIC_G3_T1_BOOK_START; p <= EGYPT_ARABIC_G3_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
