// PHASE — official Egypt Primary-5 (Grade 5) Arabic language
// («اللغة العربية» — الصف الخامس الابتدائي، الفصل الدراسي الأول)، 2025/2026
// edition.
//
// The curriculum tree for the Egypt `eg-g5-arabic` curriculum is rebuilt from the
// Ministry textbook (146 scan pages, all 146 OCR'd). This module is the
// single source of truth for its structure: the three printed units of the first
// term (نيلنا أمانة، فن التواصل، جمال الاختلاف), every printed lesson inside
// them (الاستماع، القراءة، النص الشعري، تقييم الوحدة، عودة للقراءة مع الأسرة),
// and, for every lesson, the book's own printed heads, verbatim and with the
// printed page they start on. The self-checks at the bottom prove that mapping
// against the OCR itself, page by page.
//
// THE OFFSET IS ONE — book page = scan page − 1
// Every content page that carries a folio prints its own number, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here: scan 7 prints
// «٦» (book 6, the unit-1 opener), scan 10 prints «٩» (book 9, the لم ألوث ماء
// النهر reading opener), scan 17 prints «١٦» (book 16, the grammar continuation),
// scan 51 prints «٥٠» (book 50, the unit-2 opener), scan 95 prints «٩٤» (book 94,
// the unit-3 opener) and scan 139 prints «١٣٨» (book 138, the أصدقاء رغم
// الاختلاف family story's second page). The book's own الفهرس (scans 5–6)
// independently confirms the lesson starts.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–6 are before the term: the cover (1), the credits masthead (2),
// the «مقدمة» (3), the هيا-بنا guide page (4) and two فهرس pages (5–6). Scan
// pages 145–146 are after the term: the publisher data page (145) and the back
// cover (146). The term runs from the «الوحدة الأولى» opener (book 6 = scan 7)
// to the «أصدقاء رغم الاختلاف» family story's second page (book 138 = scan
// 139): `EGYPT_ARABIC_G5_T1_BOOK_START` / `_BOOK_END` are exactly those two
// pages, and the tiling assertion proves nothing in between is left
// unreachable.
//
// NO SCAN IS MISSING — EVERY TERM PAGE HAS OCR
// The OCR corpus holds all 146 files for the 146-page book, so `MISSING_SCANS`
// is empty and every term page is checked like any other. Eleven pages print a
// folio the OCR misread as a different number («١٢» as «١٣» on book 12, «١٧» as
// «٤٧» on book 17, «٦٥» as «١٠» on book 65, «٦٩» as «١٩» on book 69, «٨١» as
// «٤٨» on book 81, «٨٥» as «٤٨» on book 85, «٨٧» as «٤٧» on book 87, «١٢١» as
// «١٣١» on book 121, «١٢٩» as «٢٩» on book 129, «١٣٣» as «٣٣» on book 133 and
// «١٣٧» as «٣٧» on book 137); those measured values live in
// `FOOTER_OCR_MISREADS` so the check stays strict instead of statistical.
//
// TWENTY-TWO TERM PAGES PRINT NO PARSEABLE FOLIO IN THE OCR
// The listening opener that prints a Latin «V» (book 7), the listening-exercise
// page (book 8), the story pages (10/11/55/70/117), the reading-activity pages
// (20/29/58/64/71/77/78/109/110/111/112/118) and the family-story continuations
// (49/93) — each is anchored on a head or string the page itself carries (see
// `FOLIO_LESS_ANCHORS`). Book 136 (the unit-3 evaluation's third page) likewise
// prints no folio and is anchored on its own head.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED HEADS
// The book prints no per-lesson «أهداف» bullets as heads; its lesson layer is
// the lesson head (الدرس الأول الاستماع …) and its activity layer is the band
// heads it prints on the pages themselves (تدريبات، هيا نتعلم مفردات جديدة، هيا
// نفهم ونناقش، التحدي، القراءة والأداء، التنغيم، أفكر وأعبر، لغة الجسد، مناقشة
// جماعية، مناقشة، ملخص ما تعلمته، الحقيقة والرأي، القراءة المتحررة، القواعد
// النحوية، القواعد الإملائية، أتحدث بطلاقة، هيا نكتب ونبدع، تطبيق كتابي، هيا
// نعرض ما كتبنا، أصنع قاموسي، قيّم نفسك، شرح الأبيات). Every concept below is
// one such head, transcribed from the OCR of the page its `bookFrom` names, so
// the page-proves-the-head check compares the transcription against the very
// text it was taken from.
//
// THE LISTENING TEXTS LIVE IN A BOOK-WIDE APPENDIX
// The الاستماع lessons print their exercises but deliberately not the story; the
// three stories are printed in the back-matter «نصوص الاستماع» (books 140–142;
// book 139 holds the divider). Each such lesson therefore also owns its appendix
// page through `extraBookPages`, so the tutor scoped to that lesson can quote
// the very story the book points it to. The appendix is not a lesson: it stays
// outside the tiled unit ranges. Book 143 («نصوص الاستماع والإملاء لتقييمات
// الوحدات») is appendix but owned by no lesson.
//
// THE UNIT OPENER RIDES WITH THE FIRST LESSON
// Each unit opens with a one-page unit title (books 6, 50 and 94) that the
// فهرس does not list as its own lesson. It is owned by the unit's first
// (الاستماع) lesson, whose range therefore starts one page before the lesson
// head, exactly as the Grade-3 and Grade-4 books' units do.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 1 (verified: book p.138 = scan p.139). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the term — the «الوحدة الأولى» opener (scan 7). */
export const EGYPT_ARABIC_G5_T1_BOOK_START = 6;

/** Last printed page of the term — «أصدقاء رغم الاختلاف» p.2 (scan 139). */
export const EGYPT_ARABIC_G5_T1_BOOK_END = 138;

/** The scanned pages before the term: cover, credits, مقدمة, guide page, فهرس. */
export const EGYPT_ARABIC_G5_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The scanned pages after the term: the publisher data page and the back cover. */
export const EGYPT_ARABIC_G5_T1_BACK_MATTER = { from: 145, to: 146 } as const;

/**
 * The book-wide listening-text appendix, in book pages: the «نصوص الاستماع»
 * divider (book 139) and the three unit listening stories (books 140–142),
 * then «نصوص الاستماع والإملاء لتقييمات الوحدات» (book 143) with the book-wide
 * unit-evaluation listening and dictation paragraphs.
 */
export const EGYPT_ARABIC_G5_T1_APPENDIX = { from: 139, to: 143 } as const;

/**
 * The term pages the OCR never produced, in book pages. The corpus holds every
 * scan of this book, so this list is empty and every term page is checked.
 */
export const MISSING_SCANS: readonly number[] = [];

/** One printed head of the textbook — becomes one concept in the app tree. */
export interface ArabicG5T1Concept {
  bookFrom: number;
  kind: string;
  title: string;
}

/** One printed lesson of the textbook — becomes one lesson in the app tree. */
export interface ArabicG5T1Lesson {
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
  concepts: ArabicG5T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to (its listening story).
   * Kept outside the tiled unit ranges but included in the lesson's RAG document.
   */
  extraBookPages?: number[];
}

/** One printed unit of the book. */
export interface ArabicG5T1Section {
  kind: "unit";
  /** Internal key: "1"…"3". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: نيلنا أمانة". */
  title: string;
  /** The section head the opener page prints, e.g. "نِيلُنَا أَمَانَةٌ". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next section's opener). */
  bookTo: number;
  lessons: ArabicG5T1Lesson[];
}

function concept(bookFrom: number, kind: string, title: string): ArabicG5T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The three units of the first term with their printed lessons and every printed
 * head, transcribed from the pages the book prints them on and checked by
 * `assertTreeMatchesTheBook` before seeding.
 */
export const EGYPT_ARABIC_G5_T1_SECTIONS: ArabicG5T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: نيلنا أمانة",
    printedHead: "نِيلُنَا أَمَانَةٌ",
    bookFrom: 6,
    bookTo: 49,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "سر الحياة",
        printedHead: "الدرس الأول: الاستماع",
        bookFrom: 7,
        concepts: [
          concept(7, "الاستماع", "الدرس الأول: الاستماع"),
          concept(8, "تدريبات", "تَدريبات سِرُّ الحَياةِ"),
        ],
        extraBookPages: [140],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "لم ألوث ماء النهر",
        printedHead: "الدرس الثاني: القراءة",
        bookFrom: 9,
        concepts: [
          concept(9, "القراءة", "الدرس الثاني: القراءة"),
          concept(12, "تدريبات", "تدريبات لم ألوث ماء النهر"),
          concept(12, "هيا نتعلم مفردات جديدة", "هيا نتعلم مفردات جديدة"),
          concept(13, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(13, "التحدي", "هَلْ أَنْتُمْ مُسْتَعِدُّونَ لِلتَّحَدِّي؟"),
          concept(14, "القراءة والأداء", "القراءة والأداء"),
          concept(14, "التنغيم", "التنغيم"),
          concept(14, "أفكر وأعبر", "أُفَكِّرُ وَأُعَبِّرُ"),
          concept(14, "مناقشة جماعية", "مُنَاقَشَةٌ جَمَاعِيَّةٌ"),
          concept(14, "القراءة المتحررة", "القراءةُ الْمُتَحَرِّرَةُ"),
          concept(15, "القواعد النحوية", "القَوَاعِدُ النَّحْوِيَّةُ المَفْعُولُ بِهِ"),
          concept(17, "القواعد الإملائية", "القواعد الإملائية هَمْزَةُ الْقَطْعِ وَأَلِفُ الْوَصْلِ"),
          concept(18, "أتحدث بطلاقة", "أَتَحَدَّثُ بِطَلاقَةٍ تحدّي الدقيقة الواحدة | نهر النيل"),
          concept(19, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ رسالة رسمية إلى مدير المدرسة"),
          concept(21, "هيا نعرض ما كتبنا", "هَيَّا نَعْرِضُ مَا كَتَبْنَا عَرْضًا شَفَهِيًّا"),
          concept(22, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(23, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "بطل حل المشكلات",
        printedHead: "الدرس الثالث: القراءة بَطَلُ حَلِّ الْمُشْكِلاتِ",
        bookFrom: 24,
        concepts: [
          concept(24, "القراءة", "الدرس الثالث: القراءة بَطَلُ حَلِّ الْمُشْكِلاتِ"),
          concept(27, "تدريبات", "تدريبات بطل حل المشكلات"),
          concept(27, "هيا نتعلم مفردات جديدة", "هيا نتعلم مفردات جديدة"),
          concept(28, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(28, "التحدي", "هَلْ أَنْتُمْ مُسْتَعِدُّونَ لِلتَّحَدِّي؟"),
          concept(29, "القراءة والأداء", "القراءة والأداء"),
          concept(29, "لغة الجسد", "لغة الجسد"),
          concept(29, "مناقشة جماعية", "مناقشة جماعية"),
          concept(29, "ملخص ما تعلمته", "ملخص ما تعلمته"),
          concept(30, "القواعد النحوية", "القَواعِدُ النَّحْوِيَّةُ المَفْعولُ بِهِ (الْمُفْرَدُ وجَمْعُ التَّكْسِيرِ)"),
          concept(32, "القواعد الإملائية", "القواعد الإملائية تطبيقات على: (هَمزة القَطع وألف الوَصل)"),
          concept(33, "أتحدث بطلاقة", "أَتَحَدَّثُ بِطَلاقَة تحدّي الدقيقة الواحدة خطوات حل المشكلات"),
          concept(34, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ تطبيقات على الرسالة الرسمية"),
          concept(36, "هيا نعرض ما كتبنا", "هَيَّا نَعْرِضُ مَا كَتَبْنَا"),
          concept(37, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(38, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: "النص الشعري",
        title: "حكاية عطاء",
        printedHead: "الدرس الرابع: النص الشعري",
        bookFrom: 39,
        concepts: [
          concept(39, "النص الشعري", "الدرس الرابع: النص الشعري"),
          concept(41, "شرح الأبيات", "شرح الأبيات:"),
          concept(42, "تدريبات", "تدريبات حكاية عطاء"),
          concept(42, "هيا نتعلم مفردات جديدة", "هَيَّا نَتَعَلَّمُ مُفْرَدَاتٍ جَدِيدَةً"),
          concept(42, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(42, "التحدي", "هَلْ أَنْتُمْ مُسْتَعِدُّونَ لِلتَّحَدِّي؟"),
          concept(44, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(45, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "1-5",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الأولى",
        printedHead: "تقييم الوحدة الأولى",
        bookFrom: 46,
        concepts: [concept(46, "تقييم", "تقييم الوحدة الأولى")],
      },
      {
        key: "1-6",
        ordinal: "",
        type: "عودة للقراءة مع الأسرة",
        title: "هيا نحمي نيلنا",
        printedHead: "عودة للقراءة مع الأسرة قصة للقراءة فقط هَيَّا نَحْمِي نِيلَنَا",
        bookFrom: 48,
        concepts: [
          concept(48, "عودة للقراءة مع الأسرة", "عودة للقراءة مع الأسرة قصة للقراءة فقط هَيَّا نَحْمِي نِيلَنَا"),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: فن التواصل",
    printedHead: "فنُّ التواصُل",
    bookFrom: 50,
    bookTo: 93,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "جسر التواصل",
        printedHead: "الدرس الأول: الاستماع جِسْرُ التَّوَاصُلِ",
        bookFrom: 51,
        concepts: [
          concept(51, "الاستماع", "الدرس الأول: الاستماع جِسْرُ التَّوَاصُلِ"),
          concept(52, "تدريبات", "تدريبات جسر التواصل"),
          concept(52, "التحدي", "التحدِّي اليَوْمِي"),
        ],
        extraBookPages: [141],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "لغة النصر",
        printedHead: "الدرس الثاني: القراءة لُغَةُ النَّظَر",
        bookFrom: 53,
        concepts: [
          concept(53, "القراءة", "الدرس الثاني: القراءة لُغَةُ النَّظَر"),
          concept(56, "تدريبات", "تدريبات لغة النص"),
          concept(56, "هيا نتعلم مفردات جديدة", "هَيَّا نَتَعَلَّمُ مُفْرَدَاتٍ جَدِيدَةً"),
          concept(57, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(57, "التحدي", "هَلْ أَنْتُمْ مُسْتَعِدُّونَ لِلتَّحَدِّي؟"),
          concept(58, "القراءة والأداء", "القراءة والأداء"),
          concept(58, "مناقشة جماعية", "مُناقشة جماعية"),
          concept(58, "مناقشة", "مناقشة خطوات فعّالة لإدارة النقاش:"),
          concept(58, "القراءة المتحررة", "القراءة المتحررة"),
          concept(59, "القواعد النحوية", "القَوَاعِدُ النَّحْوِيَّةُ إعرابُ المَفْعولِ به (جَمْعِ المُؤَنَّثِ السالِمِ)"),
          concept(61, "القواعد الإملائية", "القواعد الإملائية الهمزة المتطرفة على السطر"),
          concept(62, "أتحدث بطلاقة", "أَتَحَدَّثُ بِطَلاقَةٍ سحر اللغات تحدّي الدقيقة الواحدة"),
          concept(63, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ اكْتُبْ يَوْمِيَّاتِكَ"),
          concept(64, "تطبيق كتابي", "تطبيق كتابي يومياتي - يوم مميز في حياتي"),
          concept(65, "هيا نعرض ما كتبنا", "هَيَّا نَعرِضُ مَا كَتَبْنَا"),
          concept(66, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(67, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "الرسالة عبر الزمن",
        printedHead: "الدرس الثالث: القراءة الرِّسَالَةُ عَبْرَ الزَّمَنِ",
        bookFrom: 68,
        concepts: [
          concept(68, "القراءة", "الدرس الثالث: القراءة الرِّسَالَةُ عَبْرَ الزَّمَنِ"),
          concept(71, "تدريبات", "تدريبات الرسالة عبر الزمن"),
          concept(71, "هيا نتعلم مفردات جديدة", "هَيَّا نَتَعَلَّمُ مُفْرَدَاتٍ جَدِيدَةً"),
          concept(72, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(73, "التحدي", "هَلْ أَنْتُمْ مُسْتَعِدُّونَ لِلتَّحَدِّي؟"),
          concept(73, "القراءة والأداء", "القِراءَةُ والأَدَاءِ"),
          concept(73, "مناقشة جماعية", "مُناقشَة جماعيّة"),
          concept(73, "القراءة المتحررة", "القِراءَةُ المُتَحَرِّرَة"),
          concept(74, "القواعد النحوية", "القواعد النحوية المفعول به (المثنى وجمع المذكر السالم)"),
          concept(76, "القواعد الإملائية", "القواعد الإملائية تطبيقات على (الهمزة المتطرفة على السطر)"),
          concept(77, "أتحدث بطلاقة", "أَتَحَدَّثُ بِطَلَاقَةٍ تحدّي الدقيقة الواحدة وسائل التواصل عبر العصور"),
          concept(78, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ تطبيقات على كتابة اليوميات"),
          concept(78, "تطبيق كتابي", "تطبيق كتابي اكتب يومياتك"),
          concept(80, "هيا نعرض ما كتبنا", "هَيَّا نَعْرِضُ مَا كَتَبْنَا عَرْضًا شَفَهِيًّا"),
          concept(81, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(82, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: "النص الشعري",
        title: "أخي الإنسان",
        printedHead: "الدرس الرابع: النص الشعري",
        bookFrom: 83,
        concepts: [
          concept(83, "النص الشعري", "الدرس الرابع: النص الشعري"),
          concept(85, "شرح الأبيات", "شرح الأبيات:"),
          concept(86, "تدريبات", "تدريبات أخي الإنسان"),
          concept(86, "هيا نتعلم مفردات جديدة", "هَيَّا نَتَعَلَّمُ مُفْرَدَاتٍ جَدِيدَةً"),
          concept(86, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(86, "التحدي", "هَلْ أَنْتُمْ مُسْتَعِدُّونَ لِلتَّحَدِّي؟"),
          concept(88, "أصنع قاموسي", "أصْنَعُ قاموسي"),
          concept(89, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "2-5",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الثانية",
        printedHead: "تقييم الوحدة الثانية",
        bookFrom: 90,
        concepts: [concept(90, "تقييم", "تقييم الوحدة الثانية")],
      },
      {
        key: "2-6",
        ordinal: "",
        type: "عودة للقراءة مع الأسرة",
        title: "السر أمانة",
        printedHead: "عودة للقراءة مع الأسرة السر أمانة قصة للقراءة فقط",
        bookFrom: 92,
        concepts: [concept(92, "عودة للقراءة مع الأسرة", "عودة للقراءة مع الأسرة السر أمانة قصة للقراءة فقط")],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: جمال الاختلاف",
    printedHead: "جمال الاختلاف",
    bookFrom: 94,
    bookTo: 138,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "التنوع حياة",
        printedHead: "الدرس الأول: الاستماع التَّنَوُّعُ حَيَاةٌ",
        bookFrom: 95,
        concepts: [
          concept(95, "الاستماع", "الدرس الأول: الاستماع التَّنَوُّعُ حَيَاةٌ"),
          concept(96, "تدريبات", "تدريبات التنوع حياة"),
          concept(96, "التحدي", "التحدي اليومي"),
        ],
        extraBookPages: [142],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "كيف يصبح العالم أجمل؟",
        printedHead: "الدرس الثاني: القراءة كَيْفَ يُصْبِحُ الْعَالَمُ أَجْمَلَ؟",
        bookFrom: 97,
        concepts: [
          concept(97, "القراءة", "الدرس الثاني: القراءة كَيْفَ يُصْبِحُ الْعَالَمُ أَجْمَلَ؟"),
          concept(100, "تدريبات", "تدريبات كيف يصبح العالم أجمل؟"),
          concept(100, "هيا نتعلم مفردات جديدة", "هَيَّا نَتَعَلَّمُ مُفْرَداتٍ جَدِيدَةً"),
          concept(101, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(101, "التحدي", "هَلْ أَنْتُمْ مُسْتَعِدُّونَ لِلتَّحَدِّي؟"),
          concept(102, "القراءة والأداء", "القراءة والأداء"),
          concept(102, "التنغيم", "التنغيم"),
          concept(102, "أفكر وأعبر", "أُفَكِّرُ وَأُعَبِّرُ"),
          concept(102, "مناقشة جماعية", "مُناقشة جماعية"),
          concept(102, "القراءة المتحررة", "القراءةُ المُتحرِّرَةُ"),
          concept(103, "القواعد النحوية", "القَوَاعِدُ النَّحْوِيَّةُ المَفْعُولُ لِأَجْلِهِ"),
          concept(105, "القواعد الإملائية", "القواعد الإملائية الهمزة المتطرفة على الألف"),
          concept(106, "أتحدث بطلاقة", "أَتَحَدَّثُ بِطَلاقَةٍ تحدّي الدقيقة الواحدة مهرجان الأطعمة التقليدية"),
          concept(107, "هيا نكتب ونبدع", "هيا نكتب ونبدع تطبيقات على الرسالة الرسمية"),
          concept(109, "هيا نعرض ما كتبنا", "هيا نَعْرِضُ مَا كَتَبْنَا"),
          concept(110, "أصنع قاموسي", "أصنع قاموسي"),
          concept(111, "قيّم نفسك", "قيّم نفسك"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "حائر أمام محل الزهور",
        printedHead: "الدرس الثالث: القراءة حَائِرٌ أَمَامَ مَحَلِّ الزُّهُورِ",
        bookFrom: 112,
        concepts: [
          concept(112, "القراءة", "الدرس الثالث: القراءة حَائِرٌ أَمَامَ مَحَلِّ الزُّهُورِ"),
          concept(115, "تدريبات", "تدريبات حائر أمام محل الزهور"),
          concept(115, "هيا نتعلم مفردات جديدة", "هَيَّا نَتَعَلَّمُ مُفْرَدَاتٍ جَدِيدَةً"),
          concept(116, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُناقِشُ"),
          concept(116, "الحقيقة والرأي", "الحقيقة والرأي"),
          concept(116, "التحدي", "هَلْ أَنْتُمْ مُسْتَعِدُّونَ لِلتَّحَدِّي؟"),
          concept(117, "أفكر وأعبر", "أُفَكِّرُ وَأُعَبِّرُ"),
          concept(117, "مناقشة جماعية", "مُناقَشَةٌ جَماعِيَّةٌ"),
          concept(117, "القراءة المتحررة", "القِراءَةُ المُتَحَرِّرَةُ"),
          concept(118, "القواعد النحوية", "القَواعِدُ النَّحْوِيَّةُ إعرابُ ظَرْفَيِ الزَّمانِ وَالمَكانِ"),
          concept(120, "القواعد الإملائية", "القَوَاعِدُ الإِمْلَائِيَّةُ تَطْبِيقَاتٌ عَلَى ( الهَمْزَةِ المُتَطَرِّفَةِ عَلَى الأَلِفِ )"),
          concept(121, "أتحدث بطلاقة", "أَتَحَدَّثُ بِطَلاقَةٍ تحدّي الدقيقة الواحدة الاختلاف قوة"),
          concept(122, "هيا نكتب ونبدع", "هَيَّا نَكْتُبُ وَنُبْدِعُ تطبيقات على كتابة اليوميات"),
          concept(124, "هيا نعرض ما كتبنا", "هَيَّا نَعْرِضُ مَا كَتَبْنَا عَرْضًا شَفَهِيًّا"),
          concept(125, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(126, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: "النص الشعري",
        title: "جمال التنوع",
        printedHead: "الدرس الرابع: النص الشعري جَمَالُ التَّنَوُّعِ",
        bookFrom: 127,
        concepts: [
          concept(127, "النص الشعري", "الدرس الرابع: النص الشعري جَمَالُ التَّنَوُّعِ"),
          concept(129, "شرح الأبيات", "شَرْحُ الأبياتِ:"),
          concept(130, "تدريبات", "تدريبات جمال التنوع"),
          concept(130, "هيا نتعلم مفردات جديدة", "هَيَّا نَتَعَلَّمُ مُفْرَدَاتٍ جَدِيدَةً"),
          concept(130, "هيا نفهم ونناقش", "هَيَّا نَفْهَمُ وَنُنَاقِشُ"),
          concept(130, "التحدي", "هَلْ أَنْتُمْ مُسْتَعِدُّونَ لِلتَّحَدِّي؟"),
          concept(132, "أصنع قاموسي", "أَصْنَعُ قَامُوسِي"),
          concept(133, "قيّم نفسك", "قَيِّمْ نَفْسَكَ"),
        ],
      },
      {
        key: "3-5",
        ordinal: "",
        type: "تقييم",
        title: "تقييم الوحدة الثالثة",
        printedHead: "تقييم الوحدة الثالثة",
        bookFrom: 134,
        concepts: [concept(134, "تقييم", "تقييم الوحدة الثالثة")],
      },
      {
        key: "3-6",
        ordinal: "",
        type: "عودة للقراءة مع الأسرة",
        title: "أصدقاء رغم الاختلاف",
        printedHead: "عودة للقراءة مع الأسرة قصة للقراءة فقط أَصْدِقاءُ رَغْمَ الِاخْتِلافِ",
        bookFrom: 137,
        concepts: [
          concept(137, "عودة للقراءة مع الأسرة", "عودة للقراءة مع الأسرة قصة للقراءة فقط أَصْدِقاءُ رَغْمَ الِاخْتِلافِ"),
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
  const unit = EGYPT_ARABIC_G5_T1_SECTIONS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ARABIC_G5_T1_SECTIONS.forEach((unit, ui) => {
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
 * stories are printed in the back-matter «نصوص الاستماع» (books 140–142).
 * The stage appends these pages so the student reads the very page the tutor
 * quotes from.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const unit of EGYPT_ARABIC_G5_T1_SECTIONS) {
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
  "arabic-g5-t1",
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
  const lesson = EGYPT_ARABIC_G5_T1_SECTIONS[unitIndex]!.lessons[lessonIndex]!;
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
  17: 47,
  65: 10,
  69: 19,
  81: 48,
  85: 48,
  87: 47,
  121: 131,
  129: 29,
  133: 33,
  137: 37,
};

/**
 * The term pages that print no parseable folio in the OCR, each with the anchor
 * the check accepts in place of a page number. Every anchor is a string the page
 * itself prints: the listening opener and exercise page (7/8), the story pages
 * (10/11/55/70/117), the reading-activity pages
 * (20/29/58/64/71/77/78/109/110/111/112/118), the family-story continuations
 * (49/93) and the unit-3 evaluation's third page (136).
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  7: "سِرُّ الْحَيَاةِ",
  8: "تَدريبات سِرُّ الحَياةِ",
  10: "لَمْ أُلَوِّثْ مَاءَ النَّهْرِ",
  11: "الْمُفْرَدَاتُ الْجَدِيدَةُ:",
  20: "رسالة رسمية إلى معلم الفصل",
  29: "القراءة والأداء",
  49: "اسْتَطَاعَ الْمُعَلِّمُ",
  55: "الْمُفْرَدَاتُ الْجَدِيدَةُ:",
  58: "القراءة والأداء",
  64: "تطبيق كتابي",
  70: "المُفْرَدَاتُ الجَدِيدَةُ:",
  71: "الرسالة عبر الزمن",
  77: "أَتَحَدَّثُ بِطَلَاقَةٍ",
  78: "هَيَّا نَكْتُبُ وَنُبْدِعُ",
  93: "فَالسِّرُّ أَمَانَةٌ",
  109: "هيا نَعْرِضُ مَا كَتَبْنَا",
  110: "أصنع قاموسي",
  111: "قيّم نفسك",
  112: "حَائِرٌ أَمَامَ مَحَلِّ الزُّهُورِ",
  117: "مُناقَشَةٌ جَماعِيَّةٌ",
  118: "القَواعِدُ النَّحْوِيَّةُ",
  136: "تقييم الوحدة الثالثة",
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
  "التحدي",
  "القراءة والأداء",
  "التنغيم",
  "أفكر وأعبر",
  "لغة الجسد",
  "مناقشة جماعية",
  "مناقشة",
  "ملخص ما تعلمته",
  "الحقيقة والرأي",
  "القراءة المتحررة",
  "القواعد النحوية",
  "القواعد الإملائية",
  "أتحدث بطلاقة",
  "هيا نكتب ونبدع",
  "تطبيق كتابي",
  "هيا نعرض ما كتبنا",
  "أصنع قاموسي",
  "قيّم نفسك",
  "شرح الأبيات",
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
  const units = EGYPT_ARABIC_G5_T1_SECTIONS;

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
        if (page < EGYPT_ARABIC_G5_T1_APPENDIX.from || page > EGYPT_ARABIC_G5_T1_APPENDIX.to) {
          problems.push(
            `الدرس ${lesson.key}: صفحة ملحقة ${page} خارج ملحق الكتاب ${EGYPT_ARABIC_G5_T1_APPENDIX.from}–${EGYPT_ARABIC_G5_T1_APPENDIX.to}`,
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
  if (first && first.bookFrom !== EGYPT_ARABIC_G5_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ARABIC_G5_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (lastUnit && lastUnit.bookTo !== EGYPT_ARABIC_G5_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ARABIC_G5_T1_BOOK_END}، وجدنا ${lastUnit.bookTo}`);
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
 *  4. every printed page in [6, 138] is owned by exactly one lesson — no page
 *     falls between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR'd
 *     page of the term.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_ARABIC_G5_T1_SECTIONS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ARABIC_G5_T1_BOOK_START || book > EGYPT_ARABIC_G5_T1_BOOK_END) continue;
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
  for (let p = EGYPT_ARABIC_G5_T1_BOOK_START; p <= EGYPT_ARABIC_G5_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
