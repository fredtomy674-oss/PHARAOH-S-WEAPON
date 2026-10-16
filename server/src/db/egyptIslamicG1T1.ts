// PHASE 149 — official Egypt Grade-1 Islamic Religious Education
// («التربية الدينية الإسلامية — الصف الأول الابتدائي»), first term.
//
// The curriculum tree for the Egypt `eg-g1-islamic-education` curriculum is
// rebuilt from the Ministry textbook (88 scanned pages, first term only). This
// module is the single source of truth for the FIRST term: the three printed
// units of the first term (اللَّهُ رَبِّي، لِمَاذَا خَلَقَنَا اللهُ؟، اللَّهُ
// مَعَنَا), every printed lesson inside them (six per unit, exactly as each
// unit's own «دُرُوسُ الْوَحْدَةِ» on scans 7/35/61 lists them) and, for every
// lesson, the book's own printed «الْأَهْدَافُ» — verbatim, as on the lesson's
// head page («فِي نِهَايَةِ هَذَا الدَّرْسِ، يَتَوَقَّعُ مِنَ التِّلْمِيذِ أَنْ: …»).
// The self-checks at the bottom prove that mapping against the OCR itself, page
// by page.
//
// THE OFFSET IS 0 — book page N = scan page N
// Every content page that carries a folio prints its own number on its last
// line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here:
// scan 8 prints «٨», scan 45 prints «٤٥», scan 87 prints «٨٧» — 72 pages prove
// it one by one, page 6 of the front matter («٦») as well.
//
// SEVEN PAGES NEED A DOCUMENTED FOLIO EXCEPTION (see `FOLIO_ANCHORS`)
// Three of them are lesson head pages whose folio the OCR read *above* the
// objectives box (books 36, 40, 52 — each still prints its own number, so they
// are covered by `FOLIO_MID_PAGE`). Six print no number at all in the text the
// scan carries — the three unit openers (books 7, 35, 61) and the head pages of
// lessons 1-6, 3-5 and vice versa (books 30, 78) plus the second review page of
// unit 3 (book 85). Their folio is drawn inside the decorative badge at the foot
// of the page, which the OCR did not transcribe (verified against the page
// images); each of them is therefore anchored on a marker that survives verbatim
// on the page, named in `FOLIO_ANCHORS`. Nothing is loosened: a page with a folio
// on its last line must print its own number or the seeder refuses to run.
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER
// Every unit's opener (books 7, 35, 61) and every unit's closing review
// (books 33–34, 59–60, 84–85, and the final assessment 86–87) is not a lesson of
// its own — the book prints no «الأهداف» for them — so they ride with the
// lesson they belong to: the opener with the unit's first lesson, the review and
// the term assessment with the unit's last lesson. A lesson's own `bookFrom` is
// still stored; the range it owns is derived as "from the unit's first page, down
// to the page before the next lesson starts, bounded by the unit".
//
// WHY THE QURAN PART (ب) IS NOT A LESSON OF ITS OWN
// Each unit's Quran slot prints two parts: (أ) a full surah lesson with its own
// head page and its own «الْأَهْدَافُ», and (ب) «مِنْ سُوَرِ التِّلَاوَةِ
// وَالْحِفْظِ» — the bare text of the remaining short surahs (books 17, 44, 70),
// with no head of its own and no «الْأَهْدَافُ» at all. Exactly as the Grade-2
// Islamic book does with the same column, part (ب) stays inside the Quran lesson
// of its unit instead of becoming a lesson that could not be verified. Its text
// is part of that lesson's document, so the tutor still sees it.
//
// HOW GOD'S NAME IS PRINTED
// The book prints «اللَّهُ ﷺ» in some places where the blessing «صلى الله عليه
// وسلم» cannot apply (اللَّهُ ﷺ حَوْلَهُ); the OCR carried it as printed and this
// module does the same, so what the tutor grounds on is what the book shows.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book page 8 = PDF 8). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the term — the opener of unit 1. */
export const EGYPT_ISLAMIC_G1_T1_BOOK_START = 7;

/** Last printed page of the term — the second term-assessment page. */
export const EGYPT_ISLAMIC_G1_T1_BOOK_END = 87;

/** The scanned pages before the term: cover, blank, مقدمة, contents. */
export const EGYPT_ISLAMIC_G1_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The scanned pages after the term: the credits page. */
export const EGYPT_ISLAMIC_G1_T1_BACK_MATTER = { from: 88, to: 88 } as const;

/** One printed objective of a lesson — becomes one concept in the app tree. */
export interface IslamicG1T1Concept {
  /** Printed book page that carries this objective. */
  bookFrom: number;
  /** The printed component kind: «هدف». */
  kind: string;
  /** The printed objective, verbatim. */
  title: string;
}

/** One lesson («درس») of the first term, as each unit's «دُرُوسُ الْوَحْدَةِ» lists it. */
export interface IslamicG1T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal of the lesson slot, e.g. "الثالث". This book prints no lesson
   * numbering, so the ordinal is the slot's position in the unit, nothing more. */
  ordinal: string;
  /** The lesson's opening component type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson (مجال + عنوان), one string. */
  title: string;
  /** The lines the lesson's own head page prints (each must be found there). */
  printedHead: string[];
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed «الْأَهْدَافُ» for this lesson, in order. */
  concepts: IslamicG1T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a unit — so no lesson below uses it; the
   * field is kept so this module shares the shape of the sibling Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — one of the three units of the first term. */
export interface IslamicG1T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"3". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: اللَّهُ رَبِّي". */
  title: string;
  /** The lines the unit's opener page prints (each must be found there). */
  printedHead: string[];
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: IslamicG1T1Lesson[];
}

const TYPE = "هدف";

function concept(bookFrom: number, title: string): IslamicG1T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/** Lesson title = the printed head lines joined, exactly as the book prints them. */
function headTitle(lines: string[]): string {
  return lines.join(" ");
}

/**
 * The three units of the first term with their printed lessons and every printed
 * «الْأَهْدَافُ» item, transcribed from the head page of each lesson and checked
 * by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from each unit's «دُرُوسُ الْوَحْدَةِ» (scans 7/35/61);
 * each lesson's concepts are the objective lines the book prints at the foot of
 * the page the lesson starts on, kept verbatim.
 */
export const EGYPT_ISLAMIC_G1_T1_UNITS: IslamicG1T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: اللَّهُ رَبِّي",
    printedHead: ["الْوَحْدَةُ الْأُولَى", "اللَّهُ رَبِّي"],
    bookFrom: 7,
    bookTo: 34,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: headTitle(["الْعَقِيدَةُ اللَّهُ تَعَالَى (الْخَالِقُ)"]),
        printedHead: ["الْعَقِيدَةُ اللَّهُ تَعَالَى (الْخَالِقُ)"],
        bookFrom: 8,
        concepts: [
          concept(8, "يَسْتَنْتِجَ مَعْنَى اسْمِ اللَّهِ تَعَالَى (الْخَالِقِ)."),
          concept(8, "يُعَدِّدَ مَخْلُوقَاتِ اللَّهِ (تَعَالَى) حَوْلَهُ."),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        // Part (ب) of this slot — «مِنْ سُوَرِ التِّلَاوَةِ وَالْحِفْظِ»
        // (الْإِخْلَاصِ - الْفَلَقِ - النَّاسِ) on book page 17 — prints no head and
        // no objectives, so it stays inside this lesson (see the header).
        title: headTitle(["الْقُرْآنُ وَالتَّفْسِيرُ", "سُورَةُ الْفَاتِحَةِ"]),
        printedHead: ["الْقُرْآنُ وَالتَّفْسِيرُ", "سُورَةُ الْفَاتِحَةِ"],
        bookFrom: 12,
        concepts: [
          concept(12, "يَسْتَمِعَ لِتِلَاوَةِ سُورَةِ الْفَاتِحَةِ."),
          concept(12, "يُفَسِّرَ مَعَانِيَ بَعْضِ الْكَلِمَاتِ لِسُورَةِ الْفَاتِحَةِ."),
          concept(12, "يُعَبِّرَ عَنْ فَهْمِهِ لِسُورَةِ الْفَاتِحَةِ."),
          concept(12, "يَسْتَنْتِجَ الْقِيَمَ الْوَارِدَةَ فِي سُورَةِ الْفَاتِحَةِ."),
          concept(12, "يَحْمَدَ اللَّهَ (تَعَالَى) عَلَى نِعَمِهِ."),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: headTitle(["الْعِبَادَاتُ", "أَرْكَانُ الْإِسْلَامِ"]),
        printedHead: ["الْعِبَادَاتُ", "أَرْكَانُ الْإِسْلَامِ"],
        bookFrom: 18,
        concepts: [
          concept(18, "يُعَدِّدَ أَرْكَانَ الْإِسْلَامِ الْخَمْسَةَ."),
          concept(18, "يَسْتَنْتِجَ أَهَمِّيَّةَ أَرْكَانِ الْإِسْلَامِ فِي حَيَاةِ الْمُسْلِمِ."),
          concept(18, "يُعَبِّرَ عَنْ فَهْمِهِ لِأَرْكَانِ الْإِسْلَامِ."),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: headTitle(["السِّيَرُ وَالشَّخْصِيَّاتُ", "مَوْلِدُ النَّبِيِّ ﷺ"]),
        printedHead: ["السِّيَرُ وَالشَّخْصِيَّاتُ", "مَوْلِدُ النَّبِيِّ ﷺ"],
        bookFrom: 22,
        concepts: [
          concept(22, "يَتَعَرَّفَ الْأَحْدَاثَ الَّتِي سَبَقَتْ مِيلَادَ النَّبِيِّ ﷺ."),
          concept(22, "يَتَعَرَّفَ قِصَّةَ مَوْلِدِ النَّبِيِّ ﷺ."),
          concept(22, "يُعَبِّرَ بِأُسْلُوبِهِ عَنْ حُبِّهِ لِلنَّبِيِّ مُحَمَّدٍ ﷺ."),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: headTitle(["السِّيَرُ وَالشَّخْصِيَّاتُ", "أَبُو الْبَشَرِ آدَمُ عَلَيْهِ السَّلَامُ"]),
        printedHead: ["السِّيَرُ وَالشَّخْصِيَّاتُ", "أَبُو الْبَشَرِ آدَمُ عَلَيْهِ السَّلَامُ"],
        bookFrom: 26,
        concepts: [
          concept(26, "يَتَعَرَّفَ قِصَّةَ خَلْقِ آدَمَ عَلَيْهِ السَّلَامُ."),
          concept(26, "يَتَعَلَّمَ الِاعْتِذَارَ إِذَا أَخْطَأَ."),
          concept(26, "يَسْتَنْتِجَ أَنَّ طَاعَةَ اللَّهِ (تَعَالَى) سَبَبُ سَعَادَةِ الْإِنْسَانِ."),
          concept(26, "يَسْتَشْعِرَ قِيمَةَ الِاخْتِيَارِ الَّذِي مَرَّ بِهِ آدَمُ عَلَيْهِ السَّلَامُ."),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: TYPE,
        // The unit's closing review (books 33–34) rides with this lesson.
        title: headTitle(["الْقِيَمُ", "وَالْأَخْلَاقُ", "إِلْقَاءُ السَّلَامِ"]),
        printedHead: ["الْقِيَمُ", "وَالْأَخْلَاقُ", "إِلْقَاءُ السَّلَامِ"],
        bookFrom: 30,
        concepts: [
          concept(30, "يَتَعَرَّفَ تَحِيَّةَ الْإِسْلَامِ."),
          concept(30, "يَسْتَنْتِجَ أَهَمِّيَّةَ نَشْرِ السَّلَامِ بَيْنَ النَّاسِ."),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: لِمَاذَا خَلَقَنَا اللهُ؟",
    printedHead: ["الوَحْدَةُ الثَّانِيَةُ", "لِمَاذَا خَلَقَنَا اللهُ؟"],
    bookFrom: 35,
    bookTo: 60,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: headTitle(["الْعَقِيدَةُ", "لِمَاذَا خَلَقَنَا اللَّهُ (تَعَالَى)؟"]),
        printedHead: ["الْعَقِيدَةُ", "لِمَاذَا خَلَقَنَا اللَّهُ (تَعَالَى)؟"],
        bookFrom: 36,
        concepts: [
          concept(36, "يَسْتَنْتِجَ أَنَّ اللَّهَ (تَعَالَى) خَلَقَنَا؛ لِنَعْبُدَهُ وَنَعْمُرَ الْأَرْضَ بِالْخَيْرِ."),
          concept(36, "يُعَبِّرَ عَنْ شُكْرِهِ لِلَّهِ (تَعَالَى) عَلَى نِعْمَةِ الْخَلْقِ بِكَلِمَاتِهِ وَأَفْعَالِهِ."),
          concept(36, "يَتَعَرَّفَ أَمْثِلَةً بَسِيطَةً لِكَيْفِيَّةِ عِبَادَةِ اللَّهِ ﷺ بِعَمَلِ الْخَيْرِ فِي حَيَاتِهِ الْيَوْمِيَّةِ."),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        // Part (ب) — (النَّصْرِ - الكَافِرُونَ) on book page 44 — stays inside this
        // lesson, exactly as part (ب) of unit 1 does.
        title: headTitle(["الْقُرْآنُ", "وَالتَّفْسِيرُ", "سُورَةُ الْمَسَدِ"]),
        printedHead: ["الْقُرْآنُ", "وَالتَّفْسِيرُ", "سُورَةُ الْمَسَدِ"],
        bookFrom: 40,
        concepts: [
          concept(40, "يُفَسِّرَ مَعَانِي بَعْضِ الْكَلِمَاتِ مِنْ سُورَةِ (الْمَسَدِ)."),
          concept(40, "يُظْهِرَ فَهْمًا لِسُورَةِ (الْمَسَدِ)."),
          concept(40, "يَحْفَظَ بَعْضَ قِصَارِ السُّوَرِ (الْمَسَدِ - النَّصْرِ - الْكَافِرُونَ)."),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: headTitle(["الْعِبَادَاتُ", "الطَّهَارَةُ وَالْوُضُوءُ"]),
        printedHead: ["الْعِبَادَاتُ", "الطَّهَارَةُ وَالْوُضُوءُ"],
        bookFrom: 45,
        concepts: [
          concept(45, "يَتَعَرَّفَ أَهَمِّيَّةَ الطَّهَارَةِ وَالنَّظَافَةِ."),
          concept(45, "يُحَدِّدَ أَعْضَاءَ الْوُضُوءِ."),
          concept(45, "يُرَتِّبَ أَعْمَالَ الْوُضُوءِ."),
          concept(45, "يَحْفَظَ آيَةً تَدُلُّ عَلَى مَشْرُوعِيَّةِ الْوُضُوءِ."),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: headTitle(["السِّيَرُ وَالشَّخْصِيَّاتُ", "طُفُولَةُ النَّبِيِّ ﷺ"]),
        printedHead: ["السِّيَرُ وَالشَّخْصِيَّاتُ", "طُفُولَةُ النَّبِيِّ ﷺ"],
        bookFrom: 49,
        concepts: [
          concept(49, "يَتَعَرَّفَ مَرْحَلَةَ طُفُولَةِ النَّبِيِّ ﷺ."),
          concept(49, "يَسْتَنْتِجَ أَهَمِّيَّةَ الْبَادِيَةِ فِي حَيَاةِ النَّبِيِّ ﷺ، مِثْلَ تَعَلُّمِ اللُّغَةِ الْعَرَبِيَّةِ الْفَصِيحَةِ وَقُوَّةِ الْجِسْمِ."),
          concept(49, "يُحَدِّدَ الْقِيَمَ الطَّيِّبَةَ الَّتِي عَاشَهَا النَّبِيُّ ﷺ فِي صِغَرِهِ، كَالِاعْتِمَادِ عَلَى النَّفْسِ."),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: headTitle(["السِّيَرُ وَالشَّخْصِيَّاتُ", "نَبِيُّ اللَّهِ إِدْرِيسُ عَلَيْهِ السَّلَامُ"]),
        printedHead: ["السِّيَرُ وَالشَّخْصِيَّاتُ", "نَبِيُّ اللَّهِ إِدْرِيسُ عَلَيْهِ السَّلَامُ"],
        bookFrom: 52,
        concepts: [
          concept(52, "يَتَعَرَّفَ شَخْصِيَّةَ نَبِيِّ اللَّهِ إِدْرِيسَ عَلَيْهِ السَّلَامُ."),
          concept(52, "يُوَضِّحَ إِسْهَامَاتِ إِدْرِيسَ عَلَيْهِ السَّلَامُ فِي تَعْلِيمِ النَّاسِ الْكِتَابَةَ وَالصِّنَاعَاتِ النَّافِعَةَ."),
          concept(52, "يَسْتَنْتِجَ الْقِيَمَ مِنْ قِصَّةِ إِدْرِيسَ عَلَيْهِ السَّلَامُ."),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: TYPE,
        // The unit's closing review (books 59–60) rides with this lesson.
        title: headTitle(["الْقِيَمُ وَالْأَخْلَاقُ", "قِصَّةُ (إِتْقَانُ الْعَمَلِ)"]),
        printedHead: ["الْقِيَمُ وَالْأَخْلَاقُ", "قِصَّةُ (إِتْقَانُ الْعَمَلِ)"],
        bookFrom: 56,
        concepts: [
          concept(56, "يَسْتَنْتِجَ أَنَّ اللَّهَ (تَعَالَى) يُحِبُّ الْعَمَلَ الْمُتْقَنَ، وَيَرْضَى عَنْ صَاحِبِهِ."),
          concept(56, "يَتَعَلَّمَ كَيْفَ يُتْقِنُ عَمَلَهُ فِي أُمُورٍ بَسِيطَةٍ، مِثْلَ الدِّرَاسَةِ أَوْ مُسَاعَدَةِ الْأَهْلِ."),
          concept(56, "يَحْرِصَ عَلَى تَحْقِيقِ الْإِتْقَانِ فِي جَمِيعِ أُمُورِ حَيَاتِهِ الْيَوْمِيَّةِ."),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: اللَّهُ مَعَنَا",
    printedHead: ["الوَحْدَةُ الثَّالِثَةُ", "اللَّهُ مَعَنَا"],
    bookFrom: 61,
    bookTo: 87,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: headTitle(["الْعَقِيدَةُ اللَّهُ تَعَالَى (الْوَاحِدُ)"]),
        printedHead: ["الْعَقِيدَةُ اللَّهُ تَعَالَى (الْوَاحِدُ)"],
        bookFrom: 62,
        concepts: [
          concept(62, "يَسْتَنْتِجَ مَعْنَى اسْمِ اللَّهِ (الْوَاحِدِ)."),
          concept(62, "يُعَدِّدَ مَخْلُوقَاتِ اللَّهِ حَوْلَهُ."),
          concept(62, "يُعَبِّرَ عَنْ فَهْمِهِ لِاسْمِ اللَّهِ (الْوَاحِدِ)."),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        // Part (ب) — (الْمَاعُونِ - الْكَوْثَرِ) on book page 70 — stays inside
        // this lesson.
        title: headTitle(["الْقُرْآنُ وَالتَّفْسِيرُ", "سُورَةُ قُرَيْشٍ"]),
        printedHead: ["الْقُرْآنُ وَالتَّفْسِيرُ", "سُورَةُ قُرَيْشٍ"],
        bookFrom: 65,
        concepts: [
          concept(65, "يَتَعَرَّفَ الْمَعْنَى الْإِجْمَالِيَّ لِسُورَةِ قُرَيْشٍ."),
          concept(65, "يُعَبِّرَ عَنْ فَهْمِهِ لِسُورَةِ قُرَيْشٍ."),
          concept(65, "يَحْفَظَ بَعْضَ قِصَارِ السُّوَرِ: (قُرَيْش - الْمَاعُون - الْكَوْثَر)."),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: headTitle(["الْعِبَادَاتُ", "الصَّلَاةُ"]),
        printedHead: ["الْعِبَادَاتُ", "الصَّلَاةُ"],
        bookFrom: 71,
        concepts: [
          concept(71, "يَتَعَرَّفَ أَنَّ الصَّلَاةَ مِنْ أَرْكَانِ الْإِسْلَامِ."),
          concept(71, "يَسْتَنْتِجَ أَهَمِّيَّةَ الصَّلَاةِ."),
          concept(71, "يَتَعَرَّفَ أَثَرَ الصَّلَاةِ فِي الْمُسْلِمِ."),
          concept(71, "يُحَاكِيَ أَعْمَالَ الصَّلَاةِ."),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: headTitle(["السِّيَرُ وَالشَّخْصِيَّاتُ (تَابِعٌ) طُفُولَةُ النَّبِيِّ ﷺ"]),
        printedHead: ["السِّيَرُ وَالشَّخْصِيَّاتُ (تَابِعٌ) طُفُولَةُ النَّبِيِّ ﷺ"],
        bookFrom: 75,
        concepts: [
          concept(75, "يَسْرُدَ أَحْدَاثًا مِنْ طُفُولَةِ النَّبِيِّ ﷺ."),
          concept(75, "يَسْتَنْتِجَ فَضْلَ الْأُمِّ وَحَنَانَهَا مِنْ خِلَالِ تَعَلُّقِ النَّبِيِّ ﷺ بِأُمِّهِ."),
          concept(75, "يُعَبِّرَ عَنْ حُبِّهِ لِلْأُمِّ."),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: headTitle(["السِّيَرُ وَالشَّخْصِيَّاتُ", "نَبِيُّ اللَّهِ نُوحٌ عَلَيْهِ السَّلَامُ"]),
        printedHead: ["السِّيَرُ وَالشَّخْصِيَّاتُ", "نَبِيُّ اللَّهِ نُوحٌ عَلَيْهِ السَّلَامُ"],
        bookFrom: 78,
        concepts: [
          concept(78, "يَتَعَرَّفَ قِصَّةَ نَبِيِّ اللَّهِ نُوحٍ عَلَيْهِ السَّلَامُ وَدَعْوَتِهِ لِقَوْمِهِ وَبِنَاءِ السَّفِينَةِ."),
          concept(78, "يَسْتَنْتِجَ أَنَّ اللَّهَ تَعَالَى يَنْصُرُ الْمُؤْمِنِينَ، وَيُعَاقِبُ مَنْ يَعْصِيهِ."),
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: TYPE,
        // This lesson prints no «الأهداف» block of its own: book page 82 is the
        // six-panel story «الصِّدْقُ وَالْأَمَانَةُ» and closes on the Quranic
        // verse (verified against the page image). Its objective is therefore the
        // one the book prints for it, verbatim, as item ١٠ of the unit's own
        // «أَهْدَافُ الْوَحْدَةِ» on the opener (book page 61) — `bookFrom: 61`.
        // The unit's closing review (books 84–85) and the term assessment
        // (books 86–87) ride with this lesson.
        title: headTitle(["الْقِيَمُ وَالْأَخْلَاقُ الصِّدْقُ وَالْأَمَانَةُ"]),
        printedHead: ["الْقِيَمُ وَالْأَخْلَاقُ الصِّدْقُ وَالْأَمَانَةُ"],
        bookFrom: 82,
        concepts: [
          concept(61, "يَتَمَسَّكَ بِالصِّدْقِ فِي حَدِيثِهِ وَبِالْأَمَانَةِ فِي سُلُوكِهِ."),
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/** Printed page span a lesson owns (see the header: openers and reviews ride). */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ISLAMIC_G1_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ISLAMIC_G1_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/** The printed-page span of a unit, taken from the table itself. */
export function unitBookRange(unitIndex: number): { from: number; to: number } {
  const unit = EGYPT_ISLAMIC_G1_T1_UNITS[unitIndex]!;
  return { from: unit.bookFrom, to: unit.bookTo };
}

/**
 * PHASE 75 — appendix pages per printed lesson key. This book has no appendix,
 * so the map is empty; the function exists so the lesson-page stager can treat
 * every book the same way.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const unit of EGYPT_ISLAMIC_G1_T1_UNITS) {
    for (const lesson of unit.lessons) {
      if (lesson.extraBookPages && lesson.extraBookPages.length > 0) {
        out.set(lesson.key, [...lesson.extraBookPages]);
      }
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
  "islamic-g1-t1",
);

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

/** Loads + joins the OCR text of a book-page range into one lesson document. */
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

/** Convenience: the full document payload for one lesson. */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const range = lessonBookRange(unitIndex, lessonIndex);
  return loadBookRange(range.from, range.to);
}

// ---------------------------------------------------------------------------
// PHASE 149 — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed folio can be compared to a number. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * Strips everything but letters and digits: harakat, punctuation, spacing and
 * line breaks all drop out, so a printed line can be compared to the string the
 * book prints without depending on how the scanner ordered the marks.
 */
function normalize(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

function lastLine(text: string): string {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
}

/**
 * The book number a content page prints in its running foot, or null when its
 * last line is not a bare number. This book prints the folio as a plain number
 * («٨», «٤٥», «٨٧»), so anything else on the last line means "no folio here" and
 * the page must be one of the documented exceptions.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = toLatinDigits(lastLine(text)).trim();
  if (!/^\d+$/.test(last)) return null;
  return Number(last);
}

/** True when the page's own number is printed somewhere in the OCR text. */
function pagePrintsNumber(book: number): boolean {
  const text = toLatinDigits(loadBookPage(book));
  return new RegExp(`(^|\\D)${book}(\\D|$)`).test(text);
}

/**
 * The head pages whose folio the OCR read *above* the lesson's objectives box
 * instead of on the last line (books 36, 40, 52). Each of them still prints its
 * own number, so the check only has to look for it anywhere on the page.
 */
export const FOLIO_MID_PAGE: readonly number[] = [36, 40, 52];

/**
 * The pages that print no number in the text the scan carries, each anchored on
 * a marker that survives verbatim on the page. Their folio is drawn inside the
 * decorative badge at the foot of the page, which the OCR did not transcribe:
 * books 7/35/61 are the unit openers, 30 and 78 are lesson head pages that close
 * on their objectives box, and 85 is the second review page of unit 3.
 */
export const FOLIO_ANCHORS: Readonly<Record<number, string>> = {
  7: "دُرُوسُ الْوَحْدَةِ",
  30: "إِلْقَاءُ السَّلَامِ",
  35: "لِمَاذَا خَلَقَنَا اللهُ؟",
  61: "اللَّهُ مَعَنَا",
  78: "نَبِيُّ اللَّهِ نُوحٌ عَلَيْهِ السَّلَامُ",
  85: "أَهْلَكَ اللَّهُ قَوْمَ نُوحٍ عَلَيْهِ السَّلَامُ بِـ",
};

/** True when a content page carries real text (not the blank-page placeholder). */
function pageHasText(book: number): boolean {
  const text = loadBookPage(book);
  return text.length > 0 && !text.includes("لا يوجد نص");
}

/**
 * Table invariants: lesson keys match their position, every lesson sits inside
 * its unit, units tile the book without gaps or overlaps, every lesson has at
 * least one printed objective and each objective is printed inside its unit, and
 * the first unit starts where the contents describe it. A content mistake here
 * would quietly ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ISLAMIC_G1_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    if (unit.printedHead.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا ترويسة مطبوعة`);
    if (unit.bookFrom >= unit.bookTo) problems.push(`الوحدة ${unit.ordinal}: نطاق معكوس ${unit.bookFrom}–${unit.bookTo}`);

    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.printedHead.length === 0) problems.push(`الدرس ${lesson.key}: بلا ترويسة مطبوعة`);
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف مطبوعة`);
      if (lesson.bookFrom <= unit.bookFrom || lesson.bookFrom > unit.bookTo) {
        problems.push(
          `الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق الوحدة ${unit.bookFrom + 1}–${unit.bookTo}`,
        );
      }
      for (const [ci, c] of lesson.concepts.entries()) {
        if (!c.title.trim()) problems.push(`الدرس ${lesson.key} هدف ${ci + 1}: بلا نص`);
        if (c.kind !== TYPE) problems.push(`الدرس ${lesson.key} هدف ${ci + 1}: نوعه «${c.kind}» بدل «${TYPE}»`);
        if (c.bookFrom < unit.bookFrom || c.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} هدف ${ci + 1}: صفحته ${c.bookFrom} خارج نطاق الوحدة`);
        }
      }
      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق الوحدة ${unit.bookFrom}–${unit.bookTo}`);
      }
      if (lesson.bookFrom < from || lesson.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: صفحة ترويسته ${lesson.bookFrom} خارج نطاقه ${from}–${to}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر الوحدة ${unit.bookFrom}، وجدنا ${from}`);
      }
    });

    const nextUnit = units[ui + 1];
    if (nextUnit && unit.bookTo >= nextUnit.bookFrom) {
      problems.push(`الوحدة ${unit.ordinal} تتداخل مع ${nextUnit.ordinal}`);
    } else if (nextUnit && unit.bookTo !== nextUnit.bookFrom - 1) {
      problems.push(
        `فجوة صفحات بين ${unit.ordinal} و${nextUnit.ordinal}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`,
      );
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_ISLAMIC_G1_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_ISLAMIC_G1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ISLAMIC_G1_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_ISLAMIC_G1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed folio of every content page proves its book number — 72 pages
 *     print it on their last line, 3 more print it above their objectives box,
 *     and the 6 pages whose folio the scan does not carry are named in
 *     `FOLIO_ANCHORS` and verified against a marker printed on them;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every unit's opener page prints the unit's own printed head;
 *  4. every lesson's head page prints that lesson's printed head;
 *  5. every lesson's printed objectives are on the page that carries them,
 *     verbatim — the objectives the app ships are the book's own words;
 *  6. every printed page in the book is owned by exactly one lesson — no page can
 *     fall between two lessons and be unreachable.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  let folioProven = 0;
  let anchored = 0;

  const files = existsSync(OCR_DIR)
    ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort()
    : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ISLAMIC_G1_T1_BOOK_START || book > EGYPT_ISLAMIC_G1_T1_BOOK_END) continue;
    printedPages.add(book);
    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    if (!pageHasText(book)) {
      problems.push(`صفحة الكتاب ${book}: بلا نص حقيقي (صفحة فارغة أو فشل مسح)`);
      continue;
    }
    const footer = printedFooter(book);
    if (footer !== null) {
      folioProven++;
      if (footer !== book) problems.push(`صفحة الكتاب ${book}: الفوتر المطبوع ${footer} لا يطابق رقمها`);
      continue;
    }
    if (FOLIO_MID_PAGE.includes(book)) {
      folioProven++;
      if (!pagePrintsNumber(book)) {
        problems.push(`صفحة الكتاب ${book}: موثّقة كذات فوتر في وسط الصفحة، ولا يظهر رقمها في نصّها`);
      }
      continue;
    }
    const anchor = FOLIO_ANCHORS[book];
    if (!anchor) {
      problems.push(`صفحة الكتاب ${book}: بلا فوتر في آخر سطر وليست في الاستثناءات الموثقة`);
      continue;
    }
    anchored++;
    if (!normalize(text).includes(normalize(anchor))) {
      problems.push(`صفحة الكتاب ${book}: بلا فوتر وفيها استثناء، لكن علامتها «${anchor}» غير مطبوعة عليها`);
    }
  }

  if (printedPages.size !== EGYPT_ISLAMIC_G1_T1_BOOK_END - EGYPT_ISLAMIC_G1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ISLAMIC_G1_T1_BOOK_START} و${EGYPT_ISLAMIC_G1_T1_BOOK_END}`,
    );
  }
  if (folioProven < 70) {
    problems.push(`أرقام الفوتر قليلة (${folioProven}) — المسار أو القاعدة غير صحيحة`);
  }
  if (anchored !== Object.keys(FOLIO_ANCHORS).length) {
    problems.push(`الاستثناءات الموثقة ${Object.keys(FOLIO_ANCHORS).length} لكن المفحوص منها ${anchored}`);
  }

  // 3 + 4. every unit opener and every lesson head page prints its own head.
  EGYPT_ISLAMIC_G1_T1_UNITS.forEach((unit) => {
    const opener = loadBookPage(unit.bookFrom);
    if (!opener) {
      problems.push(`الوحدة ${unit.ordinal}: صفحة صدرها ${unit.bookFrom} بلا نص OCR`);
    } else {
      for (const line of unit.printedHead) {
        if (!normalize(opener).includes(normalize(line))) {
          problems.push(`الوحدة ${unit.ordinal}: صدرها ${unit.bookFrom} لا يطبع «${line}»`);
        }
      }
    }
    unit.lessons.forEach((lesson) => {
      const head = loadBookPage(lesson.bookFrom);
      if (!head) {
        problems.push(`الدرس ${lesson.key}: صفحة ترويسته ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      for (const line of lesson.printedHead) {
        if (!normalize(head).includes(normalize(line))) {
          problems.push(`الدرس ${lesson.key}: صفحته ${lesson.bookFrom} لا تطبع «${line}»`);
        }
      }
      // 5. the printed objectives, verbatim, on the page that carries them.
      for (const c of lesson.concepts) {
        const page = loadBookPage(c.bookFrom);
        if (!page) {
          problems.push(`الدرس ${lesson.key}: صفحة الأهداف ${c.bookFrom} بلا نص OCR`);
        } else if (!normalize(page).includes(normalize(c.title))) {
          problems.push(`الدرس ${lesson.key}: هدف «${c.title}» غير مطبوع في صفحة الكتاب ${c.bookFrom}`);
        }
      }
    });
  });

  // 6. every printed page is owned by exactly one lesson.
  const ranges = allLessonRanges();
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: folioProven };
}
