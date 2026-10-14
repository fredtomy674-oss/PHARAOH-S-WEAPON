// PHASE — official Egypt Primary-4 (Grade 4) Arabic language
// («اللغة العربية» — الصف الرابع الابتدائي، الفصل الدراسي الأول)، 2025/2026
// edition.
//
// The curriculum tree for the Egypt `eg-g4-arabic` curriculum is rebuilt from the
// Ministry textbook (146 scan pages, all 146 OCR'd). This module is the
// single source of truth for its structure: the three printed units of the first
// term (أنا وحلمي، أخلاقي.. حياتي، رسالة من أطفال مصر), every printed lesson
// inside them (الاستماع، القراءة، النص الشعري، تقييم الوحدة، عودة للقراءة مع
// الأسرة), and, for every lesson, the book's own printed heads, verbatim and
// with the printed page they start on. The self-checks at the bottom prove that
// mapping against the OCR itself, page by page.
//
// THE OFFSET IS ONE — book page = scan page − 1
// Every content page that carries a folio prints its own number, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here: scan 7 prints
// «٦» (book 6, the unit-1 opener), scan 11 prints «١٠» (book 10, the صندوق
// الأحلام story's first page), scan 42 prints «٤١» (book 41, the اسلمي يا مصر
// lesson opener), scan 54 prints «٥٣» (book 53, the unit-2 listening opener),
// scan 99 prints «٩٨» (book 98, the unit-3 listening opener), scan 137 prints
// «١٣٦» (book 136, the unit-3 evaluation's first page) and scan 141 prints
// «١٤٠» (book 140, the unit-1 listening appendix). The book's own running heads
// (الوحدة الأولى: أنا وحلمي …) independently confirm the lesson starts.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–6 are before the term: the cover (1), the credits masthead (2),
// the «مقدمة» (3), the robot-guide page (4) and two فهرس-tinted pages (5–6,
// barely OCR'd). Scan pages 145–146 are after the term: the publisher data page
// (145) and the back cover (146). The term runs from the «الوحدة الأولى» opener
// (book 6 = scan 7) to the «دَرْسُ لَا يُنْسَى» family story's second page
// (book 139 = scan 140): `EGYPT_ARABIC_G4_T1_BOOK_START` / `_BOOK_END` are
// exactly those two pages, and the tiling assertion proves nothing in between is
// left unreachable.
//
// NO SCAN IS MISSING — EVERY TERM PAGE HAS OCR
// The OCR corpus holds all 146 files for the 146-page book, so `MISSING_SCANS`
// is empty and every term page is checked like any other. Fifteen pages print a
// folio the OCR misread as a different number («١٢» as «١٣» on book 12, «١٥» as
// «١٠» on book 15, «٢٤» as «٣٤» on book 24, «٦٢» as «٦٣» on book 62, «٦٤» as
// «١٤» on book 64, «٦٥» as «١٠» on book 65, «٦٩» as «١٩» on book 69, «٩٢» as
// «٩٣» on book 92, «٩٥» as «٩٠» on book 95, «١١٢» as «١١٣» on book 112, «١٢٠»
// as «١٣٠» on book 120, «١٢٤» as «١٣٤» on book 124, «١٢٦» as «١٣٦» on book 126،
// «١٣٧» as «٣٧» on book 137 and «١٣٩» as «٣٩» on book 139); those measured
// values live in `FOOTER_OCR_MISREADS` so the check stays strict instead of
// statistical.
//
// TWENTY-TWO TERM PAGES PRINT NO PARSEABLE FOLIO IN THE OCR
// The listening opener that prints a Latin «V» (book 7), the listening-exercise
// pages (8/99/117), the story and poem pages (11/27/51/71/87/138), the
// grammar-table, writing-model and summary pages (18/22/66/75/78/81/111/118),
// the evaluation continuations (49/85/94) and the شرح الأبيات page (88) — each
// is anchored on a head the page itself carries (see `FOLIO_LESS_ANCHORS`).
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// The book prints no per-lesson «أهداف» bullets as heads; its lesson layer is
// the lesson head (الدرس الأول الاستماع …) and its activity layer is the band
// heads it prints on the pages themselves (تدريبات، هيا نتعلم مفردات جديدة، هيا
// نفهم ونناقش، مناقشة جماعية، ملخص النص، ملخص الدرس، القراءة المتحررة، القواعد
// النحوية، القواعد الإملائية، أتحدث بطلاقة، هيا نكتب ونبدع، تطبيق كتابي، هيا
// نعرض ما كتبنا، أصنع قاموسي، أقيّم ذاتي، قيّم نفسك، التحدي، شرح الأبيات).
// Every concept below is one such head, transcribed from the OCR of the page its
// `bookFrom` names, so the page-proves-the-head check compares the transcription
// against the very text it was taken from.
//
// THE LISTENING TEXTS LIVE IN A BOOK-WIDE APPENDIX
// The الاستماع lessons print their exercises but deliberately not the story; the
// three stories are printed in the back-matter «نصوص استماع الوحدات» (books 140
// and 142 … book 141 holds the unit-2 story). Each such lesson therefore also
// owns its appendix page through `extraBookPages`, so the tutor scoped to that
// lesson can quote the very story the book points it to. The appendix is not a
// lesson: it stays outside the tiled unit ranges. Book 143 («نصوص الاستماع
// والإملاء» — the unit-evaluation listening paragraphs) is appendix but owned
// by no lesson.
//
// THE UNIT OPENER RIDES WITH THE FIRST LESSON
// Each unit opens with a one-page unit title (books 6, 52 and 97) that the
// فهرس does not list as its own lesson. It is owned by the unit's first
// (الاستماع) lesson, whose range therefore starts one page before the lesson
// head, exactly as the Grade-3 book's units do.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 1 (verified: book p.139 = scan p.140). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the term — the «الوحدة الأولى» opener (scan 7). */
export const EGYPT_ARABIC_G4_T1_BOOK_START = 6;

/** Last printed page of the term — «دَرْسُ لَا يُنْسَى» p.2 (scan 140). */
export const EGYPT_ARABIC_G4_T1_BOOK_END = 139;

/** The scanned pages before the term: cover, credits, مقدمة, robot guide, فهرس. */
export const EGYPT_ARABIC_G4_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The scanned pages after the term: the publisher data page and the back cover. */
export const EGYPT_ARABIC_G4_T1_BACK_MATTER = { from: 145, to: 146 } as const;

/**
 * The book-wide listening-text appendix, in book pages: «نصوص استماع الوحدات»
 * (books 140–142) holds the three unit listening stories the الاستماع lessons
 * point to; «نصوص الاستماع والإملاء» (book 143) holds the book-wide
 * unit-evaluation listening paragraphs.
 */
export const EGYPT_ARABIC_G4_T1_APPENDIX = { from: 140, to: 143 } as const;

/**
 * The term pages the OCR never produced, in book pages. The corpus holds every
 * scan of this book, so this list is empty and every term page is checked.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of the textbook — becomes one concept in the app tree. */
export interface ArabicG4T1Concept {
  bookFrom: number;
  kind: string;
  title: string;
}

/** One printed lesson of the textbook — becomes one lesson in the app tree. */
export interface ArabicG4T1Lesson {
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
  concepts: ArabicG4T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to (its listening story).
   * Kept outside the tiled unit ranges but included in the lesson's RAG document.
   */
  extraBookPages?: number[];
}

/** One printed unit of the book. */
export interface ArabicG4T1Section {
  kind: "unit";
  /** Internal key: "1"…"3". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: أنا وحلمي". */
  title: string;
  /** The section head the opener page prints, e.g. "أَنَا وَحُلْمِي". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next section's opener). */
  bookTo: number;
  lessons: ArabicG4T1Lesson[];
}

function concept(bookFrom: number, kind: string, title: string): ArabicG4T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The three units of the first term with their printed lessons and every printed
 * head, transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 */
export const EGYPT_ARABIC_G4_T1_SECTIONS: ArabicG4T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: أنا وحلمي",
    printedHead: "أَنَا وَحُلْمِي",
    bookFrom: 6,
    bookTo: 51,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "كل منا له حلم",
        printedHead: "الدرس الأول: الاستماع كُلُّ مِنَّا لَهُ حُلْمٌ",
        bookFrom: 7,
        concepts: [
          concept(7, "الاستماع", "الدرس الأول: الاستماع كُلُّ مِنَّا لَهُ حُلْمٌ"),
          concept(8, "تدريبات", "تدريبات كُلُّ مِنَّا لَهُ حُلْمٌ"),
        ],
        extraBookPages: [140],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "صندوق الأحلام",
        printedHead: "الدرس الثاني: القراءة صُنْدُوقُ الْأَحْلَامِ",
        bookFrom: 9,
        concepts: [
          concept(9, "القراءة", "الدرس الثاني: القراءة صُنْدُوقُ الْأَحْلَامِ"),
          concept(12, "تدريبات", "تدريبات صندوق الأحلام"),
          concept(12, "هيا نتعلم مفردات جديدة", "هيا نتعلم مفردات جديدة"),
          concept(13, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(14, "هيا نفهم ونناقش", "مُنَاقَشَةٌ جَمَاعِيَّةٌ"),
          concept(14, "ملخص النص", "مُلخص النص"),
          concept(14, "هيا نفهم ونناقش", "القِرَاءَةُ المُتَحَرِّرَةُ"),
          concept(15, "القواعد النحوية", "القواعد النَّحْوِيَّة أنواعُ الكَلِمَةِ"),
          concept(17, "القواعد النحوية", "علاماتُ الاسم"),
          concept(19, "القواعد الإملائية", "القواعد الإملائية دُخُولُ حُرُوفِ (ف - ب - ك - ل)"),
          concept(20, "أتحدث بطلاقة", "أتحدث بطلاقة تحدي الدقيقة الواحدة"),
          concept(21, "هيا نكتب ونبدع", "هيا نكتب ونبدع رسالة شخصية إلى أخي الغالي"),
          concept(22, "تطبيق كتابي", "تطبيق كتابي رسالة شخصية إلى صديقي المخلص"),
          concept(23, "أقيّم ذاتي", "أُقَيِّمُ ذاتي"),
          concept(24, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(25, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "من أنا؟",
        printedHead: "الدرس الثالث: القراءة مَنْ أَنَا؟",
        bookFrom: 26,
        concepts: [
          concept(26, "القراءة", "الدرس الثالث: القراءة مَنْ أَنَا؟"),
          concept(29, "تدريبات", "تدريبات مَنْ أنا؟"),
          concept(30, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(31, "هيا نفهم ونناقش", "مُنَاقَشَةٌ جَمَاعِيَّةٌ"),
          concept(32, "القواعد النحوية", "القواعد النحوية المُفردُ والمُثنَّى والجَمْعُ"),
          concept(34, "القواعد الإملائية", "القواعد الإملائية تطبيقات على دُخُولِ حُرُوفِ (فَ - بِـ - كَـ - لِـ)"),
          concept(35, "أتحدث بطلاقة", "أتحدث بطلاقة تحدي الدقيقة الواحدة"),
          concept(36, "هيا نكتب ونبدع", "هيا نكتب ونبدع تطبيقات على كتابة الرسالة الشخصية"),
          concept(37, "تطبيق كتابي", "تطبيق كتابي رسالة شخصية إلى المذيعة الرائعة (أبلة فضيلة)"),
          concept(38, "هيا نعرض ما كتبنا", "هيا نعرض ما كتبنا"),
          concept(39, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(40, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: "النص الشعري",
        title: "اسلمي يا مصر",
        printedHead: "الدرس الرابع: النص الشعري اسْلَمِي يَا مِصْرُ",
        bookFrom: 41,
        concepts: [
          concept(41, "النص الشعري", "الدرس الرابع: النص الشعري اسْلَمِي يَا مِصْرُ"),
          concept(43, "النص الشعري", "شرح الأبيات"),
          concept(44, "تدريبات", "تدريبات اسلمي يا مصر"),
          concept(44, "هيا نتعلم مفردات جديدة", "هيا نتعلم مفردات جديدة"),
          concept(44, "هيا نفهم ونناقش", "هيا نفهم ونناقش"),
          concept(45, "التحدي", "هَلْ أَنْتُمْ مُسْتَعِدُّونَ لِلتَّحَدِّي؟"),
          concept(46, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(47, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "1-5",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الأولى",
        printedHead: "تقييم الوحدة الأولى",
        bookFrom: 48,
        concepts: [concept(48, "تقييم", "تقييم الوحدة الأولى")],
      },
      {
        key: "1-6",
        ordinal: "",
        type: "عودة للقراءة مع الأسرة",
        title: "جسر الأمل",
        printedHead: "عودة للقراءة مع الأسرة قصة (جِسْرُ الأَمَلِ)",
        bookFrom: 50,
        concepts: [concept(50, "عودة للقراءة مع الأسرة", "عودة للقراءة مع الأسرة قصة (جِسْرُ الأَمَلِ)")],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: أخلاقي.. حياتي",
    printedHead: "أَخْلَاقِي.. حَيَاتِي",
    bookFrom: 52,
    bookTo: 96,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "قوة الأخلاق في حياتنا",
        printedHead: "الدرس الأول: الاستماع",
        bookFrom: 53,
        concepts: [
          concept(53, "الاستماع", "الدرس الأول: الاستماع"),
          concept(54, "تدريبات", "تدريبات قوة الأخلاق في حياتنا"),
        ],
        extraBookPages: [141],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "الغالي المجاني",
        printedHead: "الدرس الثاني: القراءة الْغَالِي الْمَجَّانِيُّ",
        bookFrom: 55,
        concepts: [
          concept(55, "القراءة", "الدرس الثاني: القراءة الْغَالِي الْمَجَّانِيُّ"),
          concept(58, "هيا نتعلم مفردات جديدة", "هَيَّا نَتَعَلَّمُ مُفْرَدَاتٍ جَدِيدَةً"),
          concept(59, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُناقِشُ"),
          concept(60, "هيا نفهم ونناقش", "مُنَاقَشَةٌ جَمَاعِيَّةٌ"),
          concept(61, "القواعد النحوية", "القَوَاعِدُ النَّحْوِيَّةُ الضَّمَائِرُ"),
          concept(63, "القواعد الإملائية", "القَواعِدُ الإِمْلائِيَّةُ عَلاماتُ التَّرْقيمِ"),
          concept(64, "أتحدث بطلاقة", "أتحدث بطلاقة تحدي الدقيقة الواحدة"),
          concept(65, "هيا نكتب ونبدع", "هيا نكتب ونبدع مناقشة فكرة «زيارة مستشفى»"),
          concept(66, "تطبيق كتابي", "تطبيق كتابي مناقشة فكرة «فريق المساعدة»"),
          concept(67, "أقيّم ذاتي", "أُقَيِّمُ ذَاتِي"),
          concept(68, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(69, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "فكر قليلًا.. تربح كثيرًا",
        printedHead: "الدرس الثالث: القراءة فَكِّرْ قَلِيلًا.. تَرْبَحْ كَثِيرًا",
        bookFrom: 70,
        concepts: [
          concept(70, "القراءة", "الدرس الثالث: القراءة فَكِّرْ قَلِيلًا.. تَرْبَحْ كَثِيرًا"),
          concept(73, "تدريبات", "تدريبات فَكِّر قَليلًا.. تَربَح كَثيرًا"),
          concept(73, "هيا نتعلم مفردات جديدة", "هَيَّا نَتَعَلَّمُ مُفْرَداتٍ جَدِيدَةً"),
          concept(74, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(75, "ملخص الدرس", "ملخص الدرس"),
          concept(75, "هيا نفهم ونناقش", "القراءةُ المُتحرِّرةُ"),
          concept(76, "القواعد النحوية", "القواعد النحوية رُكنا الجُملة الاسمية"),
          concept(77, "القواعد النحوية", "الْمُبْتَدَأُ وَالْخَبَرُ الْمُفْرَدُ"),
          concept(79, "القواعد الإملائية", "القواعد الإملائية تطبيقات على علامات الترقيم"),
          concept(80, "أتحدث بطلاقة", "أتحدث بطلاقة تحدي الدقيقة الواحدة"),
          concept(81, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ"),
          concept(82, "هيا نكتب ونبدع", "مُنَاقَشَةُ فِكْرَةِ «إِعَادَةِ تَرْتِيبِ الْفُصُولِ»"),
          concept(83, "هيا نعرض ما كتبنا", "هَيَّا نَعْرِضُ مَا كَتَبْنَا"),
          concept(84, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(85, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: "النص الشعري",
        title: "طريق السعادة",
        printedHead: "الدرس الرابع: النص الشعري طريقُ السَّعَادَة",
        bookFrom: 86,
        concepts: [
          concept(86, "النص الشعري", "الدرس الرابع: النص الشعري طريقُ السَّعَادَة"),
          concept(88, "النص الشعري", "شرح الأبيات"),
          concept(89, "تدريبات", "تدريبات طريق السعادة"),
          concept(89, "هيا نتعلم مفردات جديدة", "هيا نتعلم مفردات جديدة"),
          concept(89, "هيا نفهم ونناقش", "هيا نفهم ونناقش"),
          concept(90, "التحدي", "هَلْ أَنتُم مُسْتَعِدُّونَ لِلتَّحَدِّي؟"),
          concept(91, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(92, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "2-5",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الثانية",
        printedHead: "تقييم الوحدة الثانية",
        bookFrom: 93,
        concepts: [concept(93, "تقييم", "تقييم الوحدة الثانية")],
      },
      {
        key: "2-6",
        ordinal: "",
        type: "عودة للقراءة مع الأسرة",
        title: "الكلمة التي غيرت كل شيء",
        printedHead: "عودة للقراءة مع الأسرة قصة للقراءة فقط الْكَلِمَةُ الَّتِي غَيَّرَتْ كُلَّ شَيْءٍ",
        bookFrom: 95,
        concepts: [
          concept(95, "عودة للقراءة مع الأسرة", "عودة للقراءة مع الأسرة قصة للقراءة فقط الْكَلِمَةُ الَّتِي غَيَّرَتْ كُلَّ شَيْءٍ"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: رسالة من أطفال مصر",
    printedHead: "رِسَالَةٌ مِنْ أَطْفَالِ مِصْرَ",
    bookFrom: 97,
    bookTo: 139,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "رسالة إلى أصدقاء الطبيعة",
        printedHead: "الدرس الأول: الاستماع",
        bookFrom: 98,
        concepts: [
          concept(98, "الاستماع", "الدرس الأول: الاستماع"),
          concept(99, "تدريبات", "تدريبات رسالة إلى أصدقاء الطبيعة"),
        ],
        extraBookPages: [142],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "رسالة الشجرة العجوز",
        printedHead: "الدرس الثاني: القراءة رسالة الشجرة العجوز",
        bookFrom: 100,
        concepts: [
          concept(100, "القراءة", "الدرس الثاني: القراءة رسالة الشجرة العجوز"),
          concept(103, "تدريبات", "تدريبات رسالة الشجرة العجوز"),
          concept(103, "هيا نتعلم مفردات جديدة", "هَيَّا نَتَعَلَّمُ مُفْرَدَاتٍ جَدِيدَةً"),
          concept(104, "هيا نفهم ونناقش", "هَيَا نَفْهَمُ وَنُنَاقِشُ"),
          concept(105, "هيا نفهم ونناقش", "مُنَاقَشَةٌ جَمَاعِيَّةٌ"),
          concept(106, "القواعد النحوية", "القواعد النحوية الْمُبْتَدَأُ وَالْخَبَرُ الْمُثَنَّى"),
          concept(108, "القواعد الإملائية", "القواعد الإملائية حروف تُنطق ولا تُكتب"),
          concept(109, "أتحدث بطلاقة", "أَتَحَدَّثُ بِطَلاقَةٍ تَحَدِّي الدَّقِيقَةِ الْوَاحِدَةِ"),
          concept(110, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ"),
          concept(111, "هيا نعرض ما كتبنا", "هيا نعرض ما كتبنا"),
          concept(112, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(113, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "أفعال صغيرة ونتائج كبيرة",
        printedHead: "الدرس الثالث: القراءة أَفْعَالٌ صَغِيرَةٌ وَنَتَائِجُ كَبِيرَةٌ",
        bookFrom: 114,
        concepts: [
          concept(114, "القراءة", "الدرس الثالث: القراءة أَفْعَالٌ صَغِيرَةٌ وَنَتَائِجُ كَبِيرَةٌ"),
          concept(117, "تدريبات", "تدريبات أفعال صغيرة ونتائج كبيرة"),
          concept(117, "هيا نتعلم مفردات جديدة", "هيا نتعلم مفردات جديدة"),
          concept(118, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(119, "هيا نفهم ونناقش", "مُناقشة جماعية"),
          concept(119, "ملخص النص", "ملخص النص"),
          concept(119, "هيا نفهم ونناقش", "القراءة المتحررة"),
          concept(120, "القواعد النحوية", "القَوَاعِدُ النَّحْوِيَّةُ المُبْتَدَأُ والخَبَرُ جَمْعُ المُذَكَّرِ السَّالِمِ"),
          concept(122, "القواعد الإملائية", "القواعد الإملائية تطبيقات على حُروفٍ تُنطَقُ ولا تُكتَبُ"),
          concept(123, "أتحدث بطلاقة", "أتحدث بطلاقة تحدّي الدقيقة الواحدة"),
          concept(124, "هيا نكتب ونبدع", "هَيَّا نُبْدِعُ وَنَكْتُبُ"),
          concept(125, "هيا نكتب ونبدع", "مُنَاقَشَةُ فِكْرَة «مُشَارَكَةِ الأَطْفَالِ فِي تَنْظِيفِ الْحَيِّ»"),
          concept(126, "هيا نعرض ما كتبنا", "هَيَّا نَعْرِضُ مَا كَتَبْنَا"),
          concept(127, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(128, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: "النص الشعري",
        title: "في البستان",
        printedHead: "الدرس الرابع: النَّصُّ الشِّعريُّ في الْبُسْتَانِ",
        bookFrom: 129,
        concepts: [
          concept(129, "النص الشعري", "الدرس الرابع: النَّصُّ الشِّعريُّ في الْبُسْتَانِ"),
          concept(131, "النص الشعري", "شرح الأبيات"),
          concept(132, "تدريبات", "تدريبات في البستان"),
          concept(132, "هيا نتعلم مفردات جديدة", "هيا نتعلم مفردات جديدة"),
          concept(132, "هيا نفهم ونناقش", "هيا نفهم ونناقش"),
          concept(133, "التحدي", "هَلْ أَنْتُمْ مُسْتَعِدُّونَ لِلتَّحَدِّي؟"),
          concept(134, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(135, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "3-5",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الثالثة",
        printedHead: "تقييم الوحدة الثالثة",
        bookFrom: 136,
        concepts: [concept(136, "تقييم", "تقييم الوحدة الثالثة")],
      },
      {
        key: "3-6",
        ordinal: "",
        type: "عودة للقراءة مع الأسرة",
        title: "درس لا ينسى",
        printedHead: "عودة للقراءة مع الأسرة قصة للقراءة فقط دَرْسُ لَا يُنْسَى",
        bookFrom: 138,
        concepts: [concept(138, "عودة للقراءة مع الأسرة", "عودة للقراءة مع الأسرة قصة للقراءة فقط دَرْسُ لَا يُنْسَى")],
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
  const unit = EGYPT_ARABIC_G4_T1_SECTIONS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ARABIC_G4_T1_SECTIONS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * The appendix page(s) each lesson points to, keyed by the lesson key (`1-1` →
 * `[140]`). The الاستماع lessons print their exercises but not the story; the
 * stories are printed in the back-matter «نصوص استماع الوحدات» (books 140–142).
 * The stage appends these pages so the student reads the very page the tutor
 * quotes from.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const unit of EGYPT_ARABIC_G4_T1_SECTIONS) {
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
  "arabic-g4-t1",
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
  const lesson = EGYPT_ARABIC_G4_T1_SECTIONS[unitIndex]!.lessons[lessonIndex]!;
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
 * bare numeral on its own last line («٦»، «١٨»، «١٠٠»), so the last non-empty
 * line is scanned and every number on a foot-looking line is a candidate.
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
  15: 10,
  24: 34,
  62: 63,
  64: 14,
  65: 10,
  69: 19,
  92: 93,
  95: 90,
  112: 113,
  120: 130,
  124: 134,
  126: 136,
  137: 37,
  139: 39,
};

/**
 * The term pages that print no parseable folio in the OCR, each with the anchor
 * the check accepts in place of a page number. Every anchor is a head the page
 * itself prints: the listening openers and exercise pages (7/8/99/117), the
 * story pages (11/27/51/71/87/138), the grammar-table and writing-model pages
 * (18/22/66/75/78/81/111/118) and the evaluation continuations (49/85/94).
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  7: "كُلُّ مِنَّا لَهُ حُلْمٌ",
  8: "تدريبات كُلُّ مِنَّا لَهُ حُلْمٌ",
  11: "الْمُفْرَدَاتُ الْجَدِيدَةُ",
  18: "أُكَمِّلُ الْجَدْوَلَ التَّالِيَ",
  22: "تطبيق كتابي",
  27: "الْيَوْمَ أَحْكِي لَكُمْ عَنْ نَفْسِي",
  49: "تقييم الوحدة الأولى",
  51: "اجْتَمَعَ أَشْرَفُ مَعَ أَصْدِقَائِهِ",
  66: "تطبيق كتابي",
  71: "فَكِّرْ قَلِيلًا.. تَرْبَحْ كَثِيرًا",
  75: "ملخص الدرس",
  78: "أَخْتَارُ الْمُبْتَدَأَ الصَّحِيحَ",
  81: "هَيَّا نَكْتُبُ وَنُبْدِعُ",
  85: "قَيِّمْ نَفْسَكَ",
  87: "طَرِيقُ السَّعَادَةِ",
  88: "شرح الأبيات",
  94: "تقييم الوحدة الثانية",
  99: "تدريبات رسالة إلى أصدقاء الطبيعة",
  111: "هيا نعرض ما كتبنا",
  117: "أفعال صغيرة ونتائج كبيرة",
  118: "هَيَّا نَفْهَمُ وَنُنَاقِشُ",
  138: "دَرْسُ لَا يُنْسَى",
};

/** Every head kind the table may use: the lesson-head kinds plus the section kinds. */
const KNOWN_KINDS = new Set([
  "الاستماع",
  "القراءة",
  "النص الشعري",
  "تقييم",
  "عودة للقراءة مع الأسرة",
  "تدريبات",
  "هيا نتعلم مفردات جديدة",
  "هيا نفهم ونناقش",
  "ملخص النص",
  "ملخص الدرس",
  "القواعد النحوية",
  "القواعد الإملائية",
  "أتحدث بطلاقة",
  "هيا نكتب ونبدع",
  "تطبيق كتابي",
  "هيا نعرض ما كتبنا",
  "أصنع قاموسي",
  "أقيّم ذاتي",
  "قيّم نفسك",
  "التحدي",
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
  const units = EGYPT_ARABIC_G4_T1_SECTIONS;

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
        if (page < EGYPT_ARABIC_G4_T1_APPENDIX.from || page > EGYPT_ARABIC_G4_T1_APPENDIX.to) {
          problems.push(
            `الدرس ${lesson.key}: صفحة ملحقة ${page} خارج ملحق الكتاب ${EGYPT_ARABIC_G4_T1_APPENDIX.from}–${EGYPT_ARABIC_G4_T1_APPENDIX.to}`,
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
  if (first && first.bookFrom !== EGYPT_ARABIC_G4_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ARABIC_G4_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (lastUnit && lastUnit.bookTo !== EGYPT_ARABIC_G4_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ARABIC_G4_T1_BOOK_END}، وجدنا ${lastUnit.bookTo}`);
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
 *  4. every printed page in [6, 139] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR'd
 *     page of the term.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_ARABIC_G4_T1_SECTIONS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ARABIC_G4_T1_BOOK_START || book > EGYPT_ARABIC_G4_T1_BOOK_END) continue;
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
  for (let p = EGYPT_ARABIC_G4_T1_BOOK_START; p <= EGYPT_ARABIC_G4_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
