// PHASE — official Egypt Primary-3 (Grade 3) Islamic Religious Education
// («التربية الدينية الإسلامية — الصف الثالث الابتدائي»), first term.
//
// The curriculum tree for the Egypt `eg-g3-islamic-education` curriculum is
// rebuilt from the Ministry textbook (90 scanned pages, first term only).
// This module is the single source of truth for the FIRST term: the three
// units of the first term (الثقة بالله، الإيمان والمحبة، الصداقة والإيمان),
// their printed lessons (six per unit — exactly as each unit's own «دروس
// الوحدة» on scans 8/32/60 lists them, with the السير unit split into its two
// printed biography lessons) and, for every lesson, the book's own printed
// «الأهداف» — verbatim, as on the lesson's head page («في نهاية هذا الدرس،
// يتوقع من التلميذ أن: …»). The self-checks at the bottom prove that mapping
// against the OCR itself, page by page.
//
// THE OFFSET IS +1 — book page N = scan page N + 1
// Every content page that carries a folio prints its own number on its last
// line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here:
// scan 10 prints «٩» (book 9), scan 13 prints «١٢» (book 12), scan 18 prints
// «١٧» (book 17), scan 33 prints «٣٢» (book 32), scan 40 prints «۳۹» (book 39,
// Extended Arabic-Indic digits), scan 61 prints «٦٠» (book 60), scan 74 prints
// «٧٣» (book 73) and scan 88 prints «٨٧» (book 87). The book's own contents
// (scans 6–7) independently confirms the lesson order.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–7 are before the term: the cover (1), the book-data page (2),
// the authorship credits (3), the «مقدمة» (4–5) and the printed contents
// (6–7). Scan pages 89–90 are after the term: the technical-specs table (89,
// naming «التربية الدينية» for «الصف الثالث الابتدائي») and the back cover
// (90). The term runs from the unit 1 opener (book 7 = scan 8, «دروس الوحدة»
// + «أهداف الوحدة») to the second term-assessment page (book 87 = scan 88):
// `EGYPT_ISLAMIC_G3_T1_BOOK_START` / `_END` are exactly those two pages, and
// the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 87 − 7 + 1 = 81.
//
// FOURTEEN TERM PAGES NEED A DOCUMENTED FOLIO EXCEPTION
// Three of them are the unit openers (books 7، 31، 59): by the book's own
// design each opener lists its unit's lessons and objectives and prints no
// folio at all (the last line is a unit objective). Nine more are lesson head
// pages whose «الأهداف» block sits at the foot (books 8، 20، 26، 36، 40، 44،
// 60، 64، 68): each prints its folio inline mid-page (e.g. «٨ الأهداف») while
// the last line is an objective, so the last-line folio test cannot read it.
// Book 50 (the عيسى lesson continuation) and book 71 (a شروط الصلاة worksheet)
// print no folio at all in the OCR. Rather than loosen the folio test, all
// fourteen are exempt from it and anchored on a marker that survives verbatim
// on the page, named in `FOLIO_LESS_ANCHORS`. `FOOTER_OCR_MISREADS` stays
// empty: no folio was read as a *different* number, and every other term page
// yields exactly its own single number.
//
// THE FOLIO CHECK READS THE LAST LINE, NOT THE HEAD
// Like the Grade-3 Arabic book (and unlike the Christian G3 book, whose folio
// heads the page), this book prints its folio as the bare last line of every
// content page («٩»، «١٢»، … «٨٧»). `footerCandidates` therefore reads the
// last non-empty line and accepts it only when it is a bare number; verified
// mechanically so every other term page yields exactly its own single number.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED «الأهداف»
// Every first-term lesson prints its «في نهاية هذا الدرس» items at the foot of
// its head page (two to four items). Each item is carried, byte-verbatim
// (including the text layer's own undiacritized variants on books 36/49/53,
// kept as stored), as a concept of that lesson with `bookFrom` set to the
// lesson's head page. Nothing is invented. `normalize` folds diacritics,
// spacing and the alef/ya/ta variants on both sides, so none of these quirks
// can break a match.
//
// LESSON SLOTS: THE NUMBERED FIVE, WITH THE BIOGRAPHIES SPLIT
// Each unit's «دروس الوحدة» numbers five lessons in order: العقيدة (١)،
// القرآن والتفسير (٢)، العبادات (٣)، السير والشخصيات (٤, in two printed parts
// (أ) and (ب), each with its own head page and its own «الأهداف» block),
// القيم والأخلاق (٥). Each biography part is therefore its own lesson (slots
// الرابع and الخامس) and the values lesson is the sixth — eighteen lessons in
// all, exactly as the Christian G3 book holds eighteen. The «مراجعة على
// الوحدة» pages (books 29–30، 57–58، 84–85) and the two «تقييمات الفصل
// الدراسي الأول» pages (books 86–87) are not lessons and stay inside the
// owning unit's last lesson range, exactly as the Christian G3 spec keeps its
// exam pages inside its last lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 1 (verified: book p.87 = scan p.88). */
export const BOOK_TO_PDF_OFFSET = 1;

/** Scans absent from the corpus. All 90 scans are present, so this is empty. */
export const MISSING_SCANS: readonly number[] = [];

/** First printed page of the term — the unit 1 opener (scan 8). */
export const EGYPT_ISLAMIC_G3_T1_BOOK_START = 7;

/** Last printed page of the term — the second term-assessment page (scan 88). */
export const EGYPT_ISLAMIC_G3_T1_BOOK_END = 87;

/** The scanned pages before the term: cover, book data, credits, مقدمة, contents. */
export const EGYPT_ISLAMIC_G3_T1_FRONT_MATTER = { from: 1, to: 7 } as const;

/** The scanned pages after the term: the specs table and the back cover. */
export const EGYPT_ISLAMIC_G3_T1_BACK_MATTER = { from: 89, to: 90 } as const;

/** One printed objective of a lesson — becomes one concept in the app tree. */
export interface IslamicG3T1Concept {
  /** Printed book page where this objective starts (the lesson's head page). */
  bookFrom: number;
  /** The printed component kind: «هدف». */
  kind: string;
  /** The printed objective, verbatim. */
  title: string;
}

/** One lesson («درس») of the first term, as each unit's «دروس الوحدة» lists it. */
export interface IslamicG3T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal of the lesson slot, e.g. "الثالث". */
  ordinal: string;
  /** The lesson's opening component type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson (مجال + عنوان). */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed «الأهداف» for this lesson, in order. */
  concepts: IslamicG3T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a unit — so no lesson below uses it; the
   * field is kept so this module shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — one of the three units of the first term. */
export interface IslamicG3T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"3". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: الثقة بالله". */
  title: string;
  /** The unit head the opener page prints, e.g. "الوحدة الأولى". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: IslamicG3T1Lesson[];
}

const TYPE = "هدف";

function concept(bookFrom: number, title: string): IslamicG3T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The three units of the first term with their printed lessons and every
 * printed «الأهداف» item, transcribed from the head page of each lesson and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from each unit's «دروس الوحدة» (scans 8/32/60); each
 * lesson's concepts are the objective lines the book prints at the foot of the
 * page the lesson starts on, kept byte-verbatim.
 */
export const EGYPT_ISLAMIC_G3_T1_UNITS: IslamicG3T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: الثقة بالله",
    printedHead: "الوِحْدَةُ الأُولَى",
    bookFrom: 7,
    bookTo: 30,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "العَقِيدَةُ أَرْكَانُ الإِيمَانِ",
        printedHead: "العَقِيدَةُ أَرْكَانُ الإِيمَانِ",
        bookFrom: 8,
        concepts: [
          concept(8, "يُحَدِّدَ أَرْكَانَ الإِيمَانِ."),
          concept(8, "يَشْرَحَ مَعْنَى كُلِّ رُكْنٍ مِنْ أَرْكَانِ الإِيمَانِ."),
          concept(8, "يَسْتَنْتِجَ أَهَمِّيَّةَ الإِيمَانِ فِي حَيَاتِهِ الْيَوْمِيَّةِ."),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الْقُرْآنُ وَالتَّفْسِيرُ سُورَةُ الْغَاشِيَةِ (تِلَاوَةٌ وَحِفْظٌ)",
        printedHead: "الْقُرْآنُ وَالتَّفْسِيرُ سُورَةُ الْغَاشِيَةِ (تِلَاوَةٌ وَحِفْظٌ)",
        bookFrom: 12,
        concepts: [
          concept(12, "يَتْلُوَ الْآيَاتِ تِلَاوَةً صَحِيحَةً."),
          concept(12, "يُرَدِّدَ سُورَةَ الْغَاشِيَةِ مِنَ الذَّاكِرَةِ."),
          concept(12, "يَسْتَنْتِجَ مَعَانِيَ الْآيَاتِ."),
          concept(12, "يَسْتَنْتِجَ الدُّرُوسَ وَالْقِيَمَ الَّتِي تَحُثُّ عَلَيْهَا الْآيَاتُ."),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الْعِبَادَاتُ صَلَاةُ الْجُمُعَةِ",
        printedHead: "الْعِبَادَاتُ صَلَاةُ الْجُمُعَةِ",
        bookFrom: 17,
        concepts: [
          concept(17, "يَسْتَنْتِجَ أَهَمِّيَّةَ صَلَاةِ الْجُمُعَةِ."),
          concept(17, "يُحَدِّدَ شُرُوطَ وَآدَابَ صَلَاةِ الْجُمُعَةِ."),
          concept(17, "يَسْتَنْتِجَ قِيمَةَ التَّعَاوُنِ وَالِاجْتِمَاعِ مَعَ الْمُسْلِمِينَ فِي الْمَسْجِدِ."),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "السِّيَرُ وَالشَّخْصِيَّاتُ عَامُ الْحُزْنِ",
        printedHead: "السِّيَرُ وَالشَّخْصِيَّاتُ عَامُ الْحُزْنِ",
        bookFrom: 20,
        concepts: [
          concept(20, "يَسْرُدَ أَهَمَّ أَحْدَاثِ (عَامِ الْحُزْنِ) فِي حَيَاةِ النَّبِيِّ مُحَمَّدٍ ﷺ."),
          concept(20, "يُوَضِّحَ أَثَرَ فَقْدِ السَّيِّدَةِ خَدِيجَةَ وَأَبِي طَالِبٍ عَلَى النَّبِيِّ ﷺ."),
          concept(20, "يَسْتَنْتِجَ الْقِيَمَ الْوَارِدَةَ فِي الدَّرْسِ."),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "السِّيَرُ وَالشَّخْصِيَّاتُ نَبِيُّ اللهِ زَكَرِيَّا عَلَيْهِ السَّلَامُ",
        printedHead: "السِّيَرُ وَالشَّخْصِيَّاتُ نَبِيُّ اللهِ زَكَرِيَّا عَلَيْهِ السَّلَامُ",
        bookFrom: 23,
        concepts: [
          concept(23, "يَتَعَرَّفَ قِصَّةَ نَبِيِّ اللهِ زَكَرِيَّا عَلَيْهِ السَّلَامُ."),
          concept(23, "يَفْهَمَ قِيمَةَ الدُّعَاءِ وَالثِّقَةِ بِاللهِ مِنْ خِلَالِ قِصَّةِ زَكَرِيَّا عَلَيْهِ السَّلَامُ."),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: TYPE,
        title: "الْقِيَمُ وَالْأَخْلَاقُ الثِّقَةُ بِاللَّهِ",
        printedHead: "الْقِيَمُ وَالْأَخْلَاقُ الثِّقَةُ بِاللَّهِ",
        bookFrom: 26,
        concepts: [
          concept(26, "يَتَعَرَّفَ مَعْنَى الثِّقَةِ بِاللَّهِ كَصِفَةٍ أَسَاسِيَّةٍ لِلْمُسْلِمِ."),
          concept(26, "يَسْتَنْتِجَ أَهَمِّيَّةَ الثِّقَةِ بِاللَّهِ فِي حَيَاتِهِ الْيَوْمِيَّةِ."),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: الإيمان والمحبة",
    printedHead: "الوَحْدَةُ الثَّانِيَةُ",
    bookFrom: 31,
    bookTo: 58,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "العَقِيدَةُ بَيْنَ الْإِسْلَامِ وَالْإِيمَانِ",
        printedHead: "العَقِيدَةُ بَيْنَ الْإِسْلَامِ وَالْإِيمَانِ",
        bookFrom: 32,
        concepts: [
          concept(32, "يُقَارِنَ بَيْنَ الْإِسْلَامِ وَالْإِيمَانِ."),
          concept(32, "يَسْتَنْتِجَ أَنَّ الْإِسْلَامَ وَالْإِيمَانَ يُكْمِلُ بَعْضُهُمَا بَعْضًا."),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "القرآن والتفسير سُورَةُ الأَعْلَى (تِلَاوَةٌ وَحِفْظٌ)",
        printedHead: "القرآن والتفسير سُورَةُ الأَعْلَى (تِلَاوَةٌ وَحِفْظٌ)",
        bookFrom: 36,
        concepts: [
          concept(36, "يَتْلُوَ آيَاتِ سُورَةِ الأَعْلَى تِلَاوَةً صَحِيحَةً."),
          concept(36, "يَسْتَنْتِجَ مَعَانِيَ الكَلِمَاتِ وَالعِبَرِ فِي الآيَاتِ (١-٥) مِنْ سُورَةِ الأَعْلَى."),
          concept(36, "يُرَدِّدَ آيَاتِ سُورَةِ الأَعْلَى مِنَ الذَّاكِرَةِ."),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الْعِبَادَاتُ صَلَاةُ الْعِيدَيْنِ",
        printedHead: "الْعِبَادَاتُ صَلَاةُ الْعِيدَيْنِ",
        bookFrom: 40,
        concepts: [
          concept(40, "يَتَعَرَّفَ صَلَاةَ الْعِيدَيْنِ وَأَهَمِّيَّتَهَا."),
          concept(40, "يُوَضِّحَ كَيْفِيَّةَ أَدَاءِ صَلَاةِ الْعِيدَيْنِ، ذَاكِرًا بَعْضَ آدَابِهَا."),
          concept(40, "يَسْتَنْتِجَ بَعْضَ الْقِيَمِ الِاجْتِمَاعِيَّةِ الَّتِي نَتَعَلَّمُهَا مِنْ صَلَاةِ الْعِيدَيْنِ."),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "السِّيَرُ وَالشَّخْصِيَّاتُ رِحْلَةُ النَّبِيِّ ﷺ إِلَى الطَّائِفِ وَدَعْوَةُ أَهْلِهَا",
        printedHead: "السِّيَرُ وَالشَّخْصِيَّاتُ رِحْلَةُ النَّبِيِّ ﷺ إِلَى الطَّائِفِ وَدَعْوَةُ أَهْلِهَا",
        bookFrom: 44,
        concepts: [
          concept(44, "يَسْرُدَ أَحْدَاثَ رِحْلَةِ النَّبِيِّ ﷺ إِلَى الطَّائِفِ."),
          concept(44, "يَسْتَخْلِصَ الْعِبَرَ وَالْقِيَمَ مِنْ رِحْلَةِ النَّبِيِّ ﷺ إِلَى الطَّائِفِ."),
          concept(44, "يَقْتَدِيَ بِالنَّبِيِّ ﷺ فِي صَبْرِهِ وَتَحَمُّلِهِ وَدَعَائِهِ لِرَبِّهِ."),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "السِّيَر وَالشَّخْصِيَّات نَبِيُّ اللهِ عِيسَى عَلَيْهِ السَّلَامُ",
        printedHead: "السِّيَر وَالشَّخْصِيَّات نَبِيُّ اللهِ عِيسَى عَلَيْهِ السَّلَامُ",
        bookFrom: 49,
        concepts: [
          concept(49, "يَتَعَرَّفَ قِصَّةَ نَبِيِّ اللهِ عِيسَى عَلَيْهِ السَّلَامُ، وَأَهَمَّ مُعْجِزَاتِهِ."),
          concept(49, "يَسْرُدَ بِإِيجَازٍ أَهَمَّ الْأَحْدَاثِ مِنْ حَيَاةِ عِيسَى عَلَيْهِ السَّلَامُ."),
          concept(49, "يَقْتَدِيَ بِأَخْلَاقِ عِيسَى عَلَيْهِ السَّلَامُ وَرِسَالَتِهِ."),
          concept(49, "يَسْتَنْتِجَ مَعْنَى قِيمَتَيِ الرَّحْمَةِ وَالتَّوَكُّلِ عَلَى اللهِ."),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: TYPE,
        title: "القيم والأخلاق مِنْ صِفَاتِ الْمُؤْمِنِ: الْمَحَبَّةُ",
        printedHead: "القيم والأخلاق مِنْ صِفَاتِ الْمُؤْمِنِ: الْمَحَبَّةُ",
        bookFrom: 53,
        concepts: [
          concept(53, "يَسْتَنْتِجَ مَعْنَى الْمَحَبَّةِ فِي الْإِسْلَامِ، وَأَهَمِّيَّتَهَا."),
          concept(53, "يُعَبِّرَ عَنِ الْمَحَبَّةِ بِطَرِيقَتِهِ."),
          concept(53, "يَحُثَّ زُمَلَاءَهُ عَلَى نَشْرِ الْمَحَبَّةِ فِي حَيَاتِهِمْ."),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الصداقة والإيمان",
    printedHead: "الوَحْدَةُ الثَّالِثَةُ",
    bookFrom: 59,
    bookTo: 87,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الْعَقِيدَةُ مِنْ أَرْكَانِ الْإِيمَانِ: (الْإِيمَانُ بِاللَّهِ تَعَالَى)",
        printedHead: "الْعَقِيدَةُ مِنْ أَرْكَانِ الْإِيمَانِ: (الْإِيمَانُ بِاللَّهِ تَعَالَى)",
        bookFrom: 60,
        concepts: [
          concept(60, "يَتَعَرَّفَ مَعْنَى الْإِيمَانِ بِاللَّهِ."),
          concept(60, "يُعَبِّرَ عَنْ أَهَمِّيَّةِ الْإِيمَانِ بِاللَّهِ فِي حَيَاتِهِ الْيَوْمِيَّةِ."),
          concept(60, "يُعَدِّدَ أَدِلَّةً عَلَى وُجُودِ اللَّهِ مِنْ حَوْلِهِ."),
          concept(60, "يُشَارِكَ فِي أَنْشِطَةٍ تُعَزِّزُ فَهْمَهُ لِلْإِيمَانِ بِاللَّهِ (تَعَالَى)."),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "الْقُرْآنُ وَالتَّفْسِيرُ سُورَةُ الطَّارِقِ (تِلَاوَةٌ وَحِفْظٌ)",
        printedHead: "الْقُرْآنُ وَالتَّفْسِيرُ سُورَةُ الطَّارِقِ (تِلَاوَةٌ وَحِفْظٌ)",
        bookFrom: 64,
        concepts: [
          concept(64, "يُرَدِّدَ آيَاتِ سُورَةِ الطَّارِقِ مِنْ حِفْظِهِ."),
          concept(64, "يَتَعَرَّفَ مَعَانِيَ الْكَلِمَاتِ الرَّئِيسِيَّةِ فِي الْآيَاتِ (١-٥)."),
          concept(64, "يُظْهِرَ شُعُورَهُ بِعَظَمَةِ اللَّهِ فِي خَلْقِ السَّمَاءِ وَالْإِنْسَانِ، وَالتَّفَكُّرَ فِي نِعَمِهِ."),
          concept(64, "يُشَارِكَ فِي الْأَنْشِطَةِ الصَّفِّيَّةِ لِتَعْزِيزِ فَهْمِهِ وَحِفْظِهِ لِلْآيَاتِ مِنَ السُّورَةِ."),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "الْعِبَادَاتُ شُرُوطُ صِحَّةِ الصَّلَاةِ",
        printedHead: "الْعِبَادَاتُ شُرُوطُ صِحَّةِ الصَّلَاةِ",
        bookFrom: 68,
        concepts: [
          concept(68, "يَتَعَرَّفَ شُرُوطَ صِحَّةِ الصَّلَاةِ."),
          concept(68, "يَعُدَّ شُرُوطَ صِحَّةِ الصَّلَاةِ."),
          concept(68, "يَتَعَرَّفَ أَهَمِّيَّةَ النَّظَافَةِ وَالطَّهَارَةِ."),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "السِّيَرُ وَالشَّخْصِيَّاتُ الإِسْرَاءُ وَالْمِعْرَاجُ",
        printedHead: "السِّيَرُ وَالشَّخْصِيَّاتُ الإِسْرَاءُ وَالْمِعْرَاجُ",
        bookFrom: 73,
        concepts: [
          concept(73, "يَصْغِيَ لِقِصَّةِ حَادِثَةِ الْإِسْرَاءِ وَالْمِعْرَاجِ."),
          concept(73, "يَسْرُدَ بِأُسْلُوبِهِ أَهَمَّ الْأَحْدَاثِ الَّتِي وَقَعَتْ خِلَالَ الرِّحْلَةِ الْمُبَارَكَةِ."),
          concept(73, "يُظْهِرَ شُعُورًا بِعَظَمَةِ اللَّهِ ﷺ وَقُدْرَتِهِ."),
          concept(73, "يَسْتَنْتِجَ الدُّرُوسَ الْمُسْتَفَادَةَ مِنْ هَذِهِ الْمُعْجِزَةِ."),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "السِّيَرُ وَالشَّخْصِيَّاتُ أَبُو بَكْرٍ الصِّدِّيقُ رَضِيَ اللهُ عَنْهُ",
        printedHead: "السِّيَرُ وَالشَّخْصِيَّاتُ أَبُو بَكْرٍ الصِّدِّيقُ رَضِيَ اللهُ عَنْهُ",
        bookFrom: 78,
        concepts: [
          concept(78, "يَتَعَرَّفَ شَخْصِيَّةَ أَبِي بَكْرٍ الصِّدِّيقِ رَضِيَ اللهُ عَنْهُ."),
          concept(78, "يُعَدِّدَ صِفَاتِ أَبِي بَكْرٍ الصِّدِّيقِ رَضِيَ اللهُ عَنْهُ وَأَخْلَاقَهُ الْمُمَيَّزَةَ."),
          concept(78, "يُدَلِّلَ عَلَى دَوْرِ أَبِي بَكْرٍ الصِّدِّيقِ رَضِيَ اللهُ عَنْهُ فِي نُصْرَةِ الْإِسْلَامِ وَمُسَانَدَةِ النَّبِيِّ ﷺ."),
          concept(78, "يُظْهِرَ شُعُورًا بِقِيمَةِ الصَّدَاقَةِ وَالْوَفَاءِ مِنْ خِلَالِ سِيرَةِ أَبِي بَكْرٍ الصِّدِّيقِ رَضِيَ اللهُ عَنْهُ."),
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: TYPE,
        title: "الْقِيَمُ وَالْأَخْلَاقُ الصَّدَاقَةُ",
        printedHead: "الْقِيَمُ وَالْأَخْلَاقُ الصَّدَاقَةُ",
        bookFrom: 81,
        concepts: [
          concept(81, "يَتَعَرَّفَ مَفْهُومَ الصَّدَاقَةِ فِي الْإِسْلَامِ."),
          concept(81, "يَذْكُرَ صِفَاتِ الصَّدِيقِ الصَّالِحِ وَفْقَ التَّعَالِيمِ الْإِسْلَامِيَّةِ."),
          concept(81, "يُظْهِرَ وَعْيًا بِأَهَمِّيَّةِ اخْتِيَارِ الْأَصْدِقَاءِ، وَتَأْثِيرِهِمْ فِي حَيَاةِ الْإِنْسَانِ."),
          concept(81, "يُطَبِّقَ بَعْضَ آدَابِ الصَّدَاقَةِ فِي الْحَيَاةِ الْيَوْمِيَّةِ."),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the
 * unit — so the unit opener, the unit review pages and (in unit 3) the term
 * assessments stay inside the unit they belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ISLAMIC_G3_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ISLAMIC_G3_T1_UNITS.forEach((unit, ui) => {
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
  "islamic-g3-t1",
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
 * Page-number candidates a content page prints at its foot. This book's foot is
 * a bare numeral on its own last line («٩»، «١٢»، … «٨٧»، book 39 in Extended
 * Arabic-Indic digits «۳۹»), so the last non-empty line is read and accepted
 * only when it is a bare number. Verified mechanically to leave every term
 * page outside the fourteen pages listed in `FOLIO_LESS_ANCHORS` yielding
 * exactly its own single number.
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
 * The book number a content page prints at its foot, or null. Every content
 * page that carries a folio prints exactly one number there and it is its own,
 * which is what fixes the offset; the pages named in `FOLIO_LESS_ANCHORS`
 * are handled separately instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The content pages whose printed footer the OCR misread as a *different*
 * number, and the value it printed instead — measured, not guessed. This book
 * has none: every parseable footer matches its page number exactly, and the
 * fourteen pages that carry no parseable number at all live in
 * `FOLIO_LESS_ANCHORS`.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no parseable folio in the OCR, each with a printed
 * string the check accepts in its place. Books 7/31/59 are the three unit
 * openers («دروس الوحدة» + «أهداف الوحدة»); they list their unit's lessons and
 * print no folio by design. Books 8/20/26/36/40/44/60/64/68 are lesson head
 * pages whose «الأهداف» block sits at the foot (the folio prints inline
 * mid-page, e.g. «٨ الأهداف»). Book 50 is the عيسى lesson continuation and
 * book 71 a شروط الصلاة worksheet; neither prints a folio in the OCR.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  7: "دُرُوسُ الوَحْدَةِ",
  8: "العَقِيدَةُ أَرْكَانُ الإِيمَانِ",
  20: "عَامُ الْحُزْنِ",
  26: "الثِّقَةُ بِاللَّهِ",
  31: "الوَحْدَةُ الثَّانِيَةُ",
  36: "سُورَةُ الأَعْلَى",
  40: "صَلَاةُ الْعِيدَيْنِ",
  44: "رِحْلَةُ النَّبِيِّ",
  50: "الدُّرُوسُ الْمُسْتَفَادَةُ مِنَ القِصَّةِ:",
  59: "الوَحْدَةُ الثَّالِثَةُ",
  60: "الْإِيمَانُ بِاللَّهِ تَعَالَى",
  64: "سُورَةُ الطَّارِقِ",
  68: "شُرُوطُ صِحَّةِ الصَّلَاةِ",
  71: "تَكُونُ النِّيَّةُ فِي الصَّلَاةِ مِنْ دَاخِلِ القَلْبِ",
};

/** Every head kind the table may use: the book's only per-lesson list kind. */
const KNOWN_KINDS = new Set(["هدف"]);

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every range
 * sits inside its section, every concept kind is known, concept pages rise
 * inside their lesson, the sections tile the term without gaps or overlaps, and
 * the first/last sections hit the book's own bounds. A content mistake here
 * would quietly ground the tutor on the wrong pages, so it fails loudly
 * instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ISLAMIC_G3_T1_UNITS;
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
      for (const page of lesson.extraBookPages ?? []) {
        if (page < EGYPT_ISLAMIC_G3_T1_BOOK_START || page > EGYPT_ISLAMIC_G3_T1_BOOK_END) {
          problems.push(`الدرس ${lesson.key}: صفحة ملحقة ${page} خارج نطاق الكتاب`);
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
  if (first && first.bookFrom !== EGYPT_ISLAMIC_G3_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ISLAMIC_G3_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ISLAMIC_G3_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ISLAMIC_G3_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio (the last line), or, on the fourteen pages named in
 *     `FOLIO_LESS_ANCHORS`, from the printed string quoted there;
 *  2. every unit's opener prints the unit head and every lesson's first page prints
 *     that lesson's head;
 *  3. every lesson's title and every objective is printed on the pages the
 *     lesson owns (each objective on its own head page);
 *  4. every printed page in [7, 87] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_ISLAMIC_G3_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ISLAMIC_G3_T1_BOOK_START || book > EGYPT_ISLAMIC_G3_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_ISLAMIC_G3_T1_BOOK_END - EGYPT_ISLAMIC_G3_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ISLAMIC_G3_T1_BOOK_START} و${EGYPT_ISLAMIC_G3_T1_BOOK_END}`,
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
  for (let p = EGYPT_ISLAMIC_G3_T1_BOOK_START; p <= EGYPT_ISLAMIC_G3_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
