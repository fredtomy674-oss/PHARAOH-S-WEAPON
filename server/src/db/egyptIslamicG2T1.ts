// Egyptian Ministry Grade-2 Islamic Religious Education
// («التربية الدينية الإسلامية — الصف الثاني الابتدائي»), first term.
//
// The curriculum tree for the Egypt `eg-g2-islamic-education` curriculum is
// rebuilt from the Ministry textbook (90 scanned pages, first term only).
// This module is the single source of truth for the FIRST term: the three
// printed units of the first term (التَّوَكُّلُ عَلَى اللَّهِ تَعَالَى، مِنْ
// نِعَمِ اللهِ تَعَالَى، الشُّكْرُ لِلَّهِ تَعَالَى), every printed lesson
// inside them (exactly as each unit's own «دُرُوسُ الوَحْدَةِ» on scans 8/36/63
// numbers them) and, for every lesson, the book's own printed «الأهداف» —
// verbatim, as on the lesson's head page («فِي نِهَايَةِ هَذَا الدَّرْسِ،
// يُتَوَقَّعُ مِنَ التِّلْمِيذِ أَنْ: …»). The self-checks at the bottom prove
// that mapping against the OCR itself, page by page.
//
// THE OFFSET IS +1 — book page N = scan page N + 1
// Every content page that carries a folio prints its own number on its last
// line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here:
// scan 7 prints «6» (book 6), scan 12 prints «١١» (book 11), scan 18 prints
// «١٧» (book 17), scan 40 prints «٣٩» (book 39, the surah-Al-Tin head), scan
// 62 prints «٦١» (book 61), scan 77 prints «٧٦» (book 76, the Dawud head) and
// scan 88 prints «۸۷» (book 87, Extended Arabic-Indic digits). The book's own
// contents (scans 6–7) independently confirms the lesson order.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–7 are before the term: the cover (1), the authorship credits
// (2), the name page (3), the «مُقَدِّمَةٌ» (4–5) and the printed contents
// (6–7). Scan pages 89–90 are after the term: the technical-specs table (89,
// naming «التربية الدينية الإسلامية» for «الصف الثاني الابتدائي») and the
// back cover (90, a list of hygiene/behaviour bullets). The term runs from
// the unit 1 opener (book 7 = scan 8, «دُرُوسُ الوَحْدَةِ» + «أَهْدَافُ
// الوَحْدَةِ») to the second term-assessment page (book 87 = scan 88):
// `EGYPT_ISLAMIC_G2_T1_BOOK_START` / `_BOOK_END` are exactly those two pages,
// and the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 87 − 7 + 1 = 81.
//
// TWENTY-SIX TERM PAGES NEED A DOCUMENTED FOLIO EXCEPTION, PLUS ONE MISREAD
// Three of them are the unit openers (books 7، 35، 62): by the book's own
// design each opener lists its unit's lessons and objectives and prints no
// folio at all (the last line is a unit objective). Nine more are lesson head
// pages whose «الأهداف» block sits at the foot (books 8، 12، 18، 36، 48،
// 51، 56، 66، 78): each prints its folio inline mid-page (e.g. «١٢» on book
// 12, «۷۸» on book 78) while the last line is an objective, so the last-line
// folio test cannot read it. Eleven are body pages that close on content
// digits or exercise marks (books 9، 10، 13، 22، 26، 31، 33، 40، 50، 52،
// 60، 82). Three open with a bare item number the footer test would mistake
// for a folio (books 35 «9 …», 62 «٦ …», 65 «3 …»). Rather than loosen the
// folio test, all twenty-six are exempt from it and anchored on a marker that
// survives verbatim on the page, named in `FOLIO_LESS_ANCHORS`. Book 53
// prints «٥٣» but the OCR kept only «03»: it stays numeric and is recorded in
// `FOOTER_OCR_MISREADS`. Every other term page yields exactly its own single
// number.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED «الأهداف»
// Every teaching lesson prints its «الأهداف» list on its head page. Each item
// is carried verbatim as a concept of that lesson (kind «هدف»), with
// `bookFrom` set to the lesson's head page — exactly as the Islamic G3/G4
// siblings do. Five head pages serialize two objectives across one OCR line
// or interleave them (books 29، 48، 51، 56، 66: the vision layer wrapped a
// two-part objective over two lines out of order); each stored string is a
// contiguous fragment the page itself prints, so the mechanical proof holds,
// and the lesson's full page text (via `lessonDocument`) still grounds the
// tutor on the complete wording. Nothing is invented.
//
// LESSON SLOTS: THE NUMBERED FIVE, WITH THE BIOGRAPHIES SPLIT
// Each unit's «دُرُوسُ الوَحْدَةِ» numbers five lessons in order: العقيدة (١)،
// القرآن والتفسير (٢, in two printed parts (أ) and (ب)), العبادات (٣)،
// السير والشخصيات (٤, in two printed parts (أ) and (ب)), القيم والأخلاق (٥).
// Each biography part carries its own head page and its own «الأهداف» block,
// so each is its own lesson (slots الرابع and الخامس) — exactly as the
// Islamic G3 spec splits its biography parts. The Quran (ب) parts (سورة
// البينة book 17، سورة العلق book 44، سورة الضحى book 70) print the bare
// surah text with no head and no «الأهداف», so they stay inside the owning
// Quran lesson instead of becoming lessons (a lesson with no objectives would
// fail `isConsistent`). Six lessons per unit, eighteen in all — exactly as
// the Islamic G3 book holds eighteen. The «مُرَاجَعَةٌ عَلَى الْوَحْدَةِ»
// pages (books 33–34، 60–61، 82–83) and the two «تقييمات الفصل الدراسي الأول»
// pages (books 84–87) are not lessons and stay inside the owning unit's last
// lesson range, exactly as the Islamic G3 spec keeps its review and exam
// pages inside its last lesson.
//
// THE GRADE-2 AMANA HEAD WRAPS ITS TITLE OVER TWO LINES
// Lesson 2-6 prints its مجال and title interleaved across two OCR lines
// («القِيَمُ قِصَّةُ (الأَمَانَةُ فِي الحِفَاظِ» / «وَالأَخْلَاقُ عَلَى
// الجِسْمِ وَالعَقْلِ)»). Its title and printedHead are stored in that exact
// page order, so the mechanical proof holds.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 1 (verified: book p.87 = scan p.88). */
export const BOOK_TO_PDF_OFFSET = 1;

/** Scans absent from the corpus. All 90 scans are present, so this is empty. */
export const MISSING_SCANS: readonly number[] = [];

/** First printed page of the term — the unit 1 opener (scan 8). */
export const EGYPT_ISLAMIC_G2_T1_BOOK_START = 7;

/** Last printed page of the term — the second term-assessment page (scan 88). */
export const EGYPT_ISLAMIC_G2_T1_BOOK_END = 87;

/** The scanned pages before the term: cover, credits, name page, مقدمة, contents. */
export const EGYPT_ISLAMIC_G2_T1_FRONT_MATTER = { from: 1, to: 7 } as const;

/** The scanned pages after the term: the specs table and the back cover. */
export const EGYPT_ISLAMIC_G2_T1_BACK_MATTER = { from: 89, to: 90 } as const;

/** One printed objective of a lesson — becomes one concept in the app tree. */
export interface IslamicG2T1Concept {
  /** Printed book page where this objective starts (the lesson's head page). */
  bookFrom: number;
  /** The printed component kind: «هدف». */
  kind: string;
  /** The printed objective, verbatim. */
  title: string;
}

/** One lesson («درس») of the first term, as each unit's «دُرُوسُ الوَحْدَةِ» lists it. */
export interface IslamicG2T1Lesson {
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
  concepts: IslamicG2T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix —
   * every page of the term belongs to a unit — so no lesson below uses it; the
   * field is kept so this module shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — one of the three units of the first term. */
export interface IslamicG2T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"3". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: التَّوَكُّلُ عَلَى اللَّهِ تَعَالَى". */
  title: string;
  /** The unit head the opener page prints, e.g. "الوحدة الأولى". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: IslamicG2T1Lesson[];
}

const TYPE = "هدف";

function concept(bookFrom: number, title: string): IslamicG2T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The three units of the first term with their printed lessons and every
 * printed «الأهداف» item, transcribed from the head page of each lesson and
 * checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from each unit's «دُرُوسُ الوَحْدَةِ» (scans 8/36/63);
 * each lesson's concepts are the objective lines the book prints at the foot
 * of the page the lesson starts on, kept verbatim.
 */
export const EGYPT_ISLAMIC_G2_T1_UNITS: IslamicG2T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: التَّوَكُّلُ عَلَى اللَّهِ تَعَالَى",
    printedHead: "الوحدة الأولى",
    bookFrom: 7,
    bookTo: 34,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "العَقِيدَةُ اللهُ تَعَالَى (السَّمِيعُ)",
        printedHead: "العَقِيدَةُ اللهُ تَعَالَى (السَّمِيعُ)",
        bookFrom: 8,
        concepts: [
          concept(8, "يَتَعَرَّفَ مَعْنَى اسْمِ اللَّهِ تَعَالَى (السَّمِيعِ)."),
          concept(8, "يَرْبِطَ بَيْنَ اسْمِ اللَّهِ تَعَالَى (السَّمِيعِ) وَسُلُوكِيَاتِهِ فِي حَيَاتِهِ الْيَوْمِيَّةِ."),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "القُرْآنُ وَالتَّفْسِيرُ سُورَةُ القَدْرِ",
        printedHead: "سُورَةُ القَدْرِ",
        bookFrom: 12,
        concepts: [
          concept(12, "يَتْلُو سُورَةَ القَدْرِ تِلَاوَةً صَحِيحَةً."),
          concept(12, "يَسْتَنْتِجَ مَعَانِي بَعْضِ المُفْرَدَاتِ الوَارِدَةِ فِي السُّورَةِ."),
          concept(12, "يَتَعَرَّفَ فَضْلَ لَيْلَةِ القَدْرِ، وَسَبَبَ تَسْمِيَتِهَا، وَأَهَمِّيَّتَهَا فِي الإِسْلَامِ."),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "العِبَادَاتُ الأَذَانُ",
        printedHead: "العِبَادَاتُ الأَذَانُ",
        bookFrom: 18,
        concepts: [
          concept(18, "يَسْتَنْتِجَ وَظِيفَةَ الْأَذَانِ وَأَهَمِّيَّتَهُ فِي المُجْتَمَعِ المُسْلِمِ."),
          concept(18, "يُرَدِّدَ خَلْفَ المُؤَذِّنِ."),
          concept(18, "يُظْهِرَ احْتِرَامَهُ لِلْأَذَانِ وَاسْتِعْدَادَهُ لِلصَّلَاةِ عِنْدَ سَمَاعِهِ."),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "السِّيرُ وَالشَّخْصِيَّاتُ نُزُولُ الوَحْيِ عَلَى النَّبِيِّ ﷺ",
        printedHead: "نُزُولُ الوَحْيِ عَلَى النَّبِيِّ ﷺ",
        bookFrom: 21,
        concepts: [
          concept(21, "يَتَعَرَّفَ قِصَّةَ بِعْثَةِ الرَّسُولِ ﷺ وَبِدَايَةَ نُزُولِ الْوَحْيِ بِشَكْلٍ مُبَسَّطٍ."),
          concept(21, "يَسْتَنْتِجَ مَعْنَى (الْوَحْيِ) وَدَوْرَ جِبْرِيلَ ﷺ فِي إِيصَالِهِ."),
          concept(21, "يُظْهِرَ وَعْيًا بِأَهَمِّيَّةِ الصَّبْرِ وَالثِّقَةِ بِاللَّهِ اسْتِفَادَةً مِنْ سِيرَةِ الرَّسُولِ ﷺ."),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "السِّيرُ وَالشَّخْصِيَّاتُ نَبِيُّ اللَّهِ شُعَيْبٌ عَلَيْهِ السَّلَامُ",
        printedHead: "نَبِيُّ اللَّهِ شُعَيْبٌ عَلَيْهِ السَّلَامُ",
        bookFrom: 25,
        concepts: [
          concept(25, "يَتَعَرَّفَ قِصَّةَ نَبِيِّ اللَّهِ شُعَيْبٍ عَلَيْهِ السَّلَامُ وَقَوْمِهِ (مَدْيَنَ) وَدَعْوَتَهُ لَهُمْ."),
          concept(
            25,
            "يَسْتَنْتِجَ أَهَمِّيَّةَ الصِّدْقِ وَالْعَدْلِ فِي التَّعَامُلِ مَعَ الْآخَرِينَ، كَمَا عَلَّمَ شُعَيْبٌ عَلَيْهِ السَّلَامُ قَوْمَهُ.",
          ),
          concept(
            25,
            "يَرْبِطَ بَيْنَ دَعْوَةِ نَبِيِّ اللَّهِ شُعَيْبٍ عَلَيْهِ السَّلَامُ وَبَيْنَ أَفْعَالِ يَوْمِيَّةٍ مِثْلِ عَدَمِ الْغِشِّ وَمُسَاعَدَةِ الْآخَرِينَ.",
          ),
          concept(25, "يُظْهِرَ شُعُورَهُ بِأَهَمِّيَّةِ الصِّدْقِ وَالْأَمَانَةِ، وَيَحْرِصَ عَلَى تَطْبِيقِهِمَا فِي حَيَاتِهِ."),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: TYPE,
        title: "القِيَمُ وَالأَخْلَاقُ التَّوَكُّلُ عَلَى اللَّهِ (تَعَالَى)",
        printedHead: "التَّوَكُّلُ عَلَى اللَّهِ (تَعَالَى)",
        bookFrom: 29,
        concepts: [
          concept(29, "يَسْتَنْتِجَ أَنَّ التَّوَكُّلَ هُوَ الثِّقَةُ بِأَنَّ اللَّهَ سَيُوَفِّقُهُ مَعَ بَذْلِ الجُهْدِ."),
          concept(29, "يُطَبِّقَ التَّوَكُّلَ فِي مَوَاقِفِ حَيَاتِهِ اليَوْمِيَّةِ مِثْلَ الدِّرَاسَةِ"),
          concept(
            29,
            "يُظْهِرَ شُعُورًا بِالاطْمِئْنَانِ وَالتَّفَاؤُلِ عِنْدَمَا يَعْتَمِدُ عَلَى اللَّهِ فِي أُمُورِهِ مُوَاجَهَةِ الصُّعُوبَاتِ.",
          ),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: مِنْ نِعَمِ اللهِ (تَعَالَى)",
    printedHead: "الوحدة الثانية",
    bookFrom: 35,
    bookTo: 61,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "العَقِيدَةُ اللَّهُ تَعَالَى (البَصِيرُ)",
        printedHead: "العَقِيدَةُ اللَّهُ تَعَالَى (البَصِيرُ)",
        bookFrom: 36,
        concepts: [
          concept(36, "يَسْتَنْتِجَ مَعْنَى اسْمِ اللَّهِ تَعَالَى (البَصِيرُ)."),
          concept(36, "يُظْهِرَ وَعْيًا بِأَنَّ اللَّهَ ﷺ يَرَى أَفْعَالَنَا وَيَعْلَمُ مَا فِي قُلُوبِنَا"),
          concept(36, "يُلْتَزِمَ بِعَمَلِ الخَيْرِ؛ لِأَنَّ اللَّهَ تَعَالَى (البَصِيرَ) يَرَاهُ."),
          concept(36, "يُظْهِرَ شُعُورَهُ بِالرَّاحَةِ؛ لِأَنَّ اللَّهَ يَرَاهُ وَيَحْمِيهِ دَائِمًا."),
          concept(36, "يُوَظِّفَ إِدْرَاكَهُ لِمَفْهُومِ (البَصِيرِ) فِي مَوَاقِفِ حَيَاتِهِ."),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "القُرْآنُ وَالتَّفْسِيرُ سُورَةُ التِّينِ",
        printedHead: "سُورَةُ التِّينِ",
        bookFrom: 39,
        concepts: [
          concept(39, "يَتَعَرَّفَ سُورَةَ التِّينِ وَسَبَبَ تَسْمِيَتِهَا."),
          concept(39, "يُعَبِّرَ بِكَلِمَاتٍ بَسِيطَةٍ عَنْ مَعْنَى السُّورَةِ، وَمَا تَدُلُّ عَلَيْهِ مِنْ عَظَمَةِ خَلْقِ اللَّهِ ﷺ"),
          concept(39, "يَرْبِطَ بَيْنَ مَضْمُونِ السُّورَةِ وَبَعْضِ الْقِيَمِ مِثْلِ شُكْرِ اللَّهِ ﷺ وَالْعَمَلِ الصَّالِحِ."),
          concept(39, "يَتْلُوَ سُورَةَ التِّينِ تِلَاوَةً صَحِيحَةً."),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "العِبَادَاتُ الإِقَامَةُ",
        printedHead: "العِبَادَاتُ الإِقَامَةُ",
        bookFrom: 45,
        concepts: [
          concept(45, "يُرَدِّدَ نَصَّ الإِقَامَةِ لِلصَّلَاةِ بِشَكْلٍ صَحِيحٍ."),
          concept(45, "يَسْتَنْتِجَ مَعْنَى إِقَامَةِ الصَّلَاةِ."),
          concept(45, "يُفَرِّقَ بَيْنَ الأَذَانِ وَالإِقَامَةِ؛ مِنْ حَيْثُ التَّوْقِيتُ وَالنَّصُّ."),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "السَّيْرُ وَالشَّخْصِيَّاتُ بِدَايَةُ الدَّعْوَةِ (الدَّعْوَةُ السِّرِّيَّةُ)",
        printedHead: "بِدَايَةُ الدَّعْوَةِ (الدَّعْوَةُ السِّرِّيَّةُ)",
        bookFrom: 48,
        concepts: [
          concept(48, "يَتَعَرَّفَ بِدَايَةَ الدَّعْوَةِ الإِسْلَامِيَّةِ وَأَسْمَاءَ أَوَائِلِ مَنْ آمَنُوا"),
          concept(48, "يَرْبِطَ بَيْنَ قِيَمِ الوَفَاءِ وَالشَّجَاعَةِ الَّتِي أَظْهَرَهَا الأَوَائِلُ، وَحَيَاتِهِ اليَوْمِيَّةِ"),
          concept(48, "يَشْرَحَ - بِكَلِمَاتٍ بَسِيطَةٍ - كَيْفَ بَدَأَ النَّبِيُّ دَعْوَتَهُ وَدَوْرَ أَصْحَابِهِ"),
          concept(48, "يُظْهِرَ شُعُورَهُ بِالفَخْرِ بِنَبِيِّهِ وَبِصَحَابَتِهِ الكِرَامِ."),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "السَّيْرُ وَالشَّخْصِيَّاتُ نَبِيُّ اللَّهِ مُوسَى عَلَيْهِ السَّلام",
        printedHead: "نَبِيُّ اللَّهِ مُوسَى عَلَيْهِ السَّلام",
        bookFrom: 51,
        concepts: [
          concept(51, "يَتَعَرَّفَ قِصَّةَ وِلَادَةِ مُوسَى الله وَكَيْفَ أَنْقَذَهُ اللَّهُ مِنْ فِرْعَوْنَ."),
          concept(51, "يُظْهِرَ شُعُورًا بِالْامْتِنَانِ لِنِعْمَةِ اللَّهِ وَحِمَايَتِهِ لَنَا فِي الْأَوْقَاتِ"),
          concept(51, "يَسْتَنْتِجَ مَعْنَى التَّوَكَّلِ عَلَى اللَّهِ مِنْ قِصَّةِ نَبِيِّ اللَّهِ مُوسَى الا السلام."),
          concept(51, "يَسْتَنْتِجَ أَهَمِّيَّةَ الشَّجَاعَةِ وَالصَّبْرِ مِنْ خِلَالِ مَوْقِفِ أُمِّ مُوسَى."),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: TYPE,
        title: "القِيَمُ قِصَّةُ (الأَمَانَةُ فِي الحِفَاظِ وَالأَخْلَاقُ عَلَى الجِسْمِ وَالعَقْلِ)",
        printedHead: "القِيَمُ قِصَّةُ (الأَمَانَةُ فِي الحِفَاظِ وَالأَخْلَاقُ عَلَى الجِسْمِ وَالعَقْلِ)",
        bookFrom: 56,
        concepts: [
          concept(56, "يُوَضِّحَ مَعْنَى الأَمَانَةِ وَأَهَمِّيَّتَهَا فِي الحِفَاظِ عَلَى الجِسْمِ"),
          concept(56, "يُعَدِّدَ الصُّوَرَ المُخْتَلِفَةَ لِلْحِفَاظِ عَلَى الجِسْمِ وَالعَقْلِ."),
          concept(56, "يُفَسِّرَ الأَثَرَ الطَّيِّبَ لِلْحِفَاظِ عَلَى الجِسْمِ وَالعَقْلِ."),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الشُّكْرُ لِلَّهِ (تَعَالَى)",
    printedHead: "الوِحْدَةُ الثَّالِثَةُ",
    bookFrom: 62,
    bookTo: 87,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "العَقِيدَةُ اللَّهُ تَعَالَى (الشَّكُورُ)",
        printedHead: "العَقِيدَةُ اللَّهُ تَعَالَى (الشَّكُورُ)",
        bookFrom: 63,
        concepts: [
          concept(63, "يَسْتَنْتِجَ مَعْنَى اسْمِ اللَّهِ تَعَالَى (الشَّكُورِ) بِأَنَّهُ الَّذِي يُحِبُّ الشَّكْرَ وَيُجَازِي عَلَيْهِ."),
          concept(63, "يَعْرِفَ أَنَّ اللَّهَ تَعَالَى (الشَّكُورَ) يَرَى أَعْمَالَنَا الصَّغِيرَةَ وَيُقَدِّرُهَا."),
          concept(63, "يُمَارِسَ قَوْلَ (الْحَمْدُ لِلَّهِ) فِي مَوَاقِفَ يَوْمِيَّةٍ لِيُعَبِّرَ عَنِ الشُّكْرِ."),
          concept(63, "يُظْهِرَ شُعُورَهُ بِالِامْتِنَانِ لِنِعَمِ اللَّهِ (تَعَالَى) وَيَحْرِصَ عَلَى شُكْرِهِ فِي حَيَاتِهِ الْيَوْمِيَّةِ."),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "القُرْآنُ وَالتَّفْسِيرُ سُورَةُ الشَّرْحِ",
        printedHead: "سُورَةُ الشَّرْحِ",
        bookFrom: 66,
        concepts: [
          concept(66, "يَفْهَمَ سُورَةَ الشَّرْحِ فَهْمًا صَحِيحًا مِنْ خِلَالِ قِرَاءَةِ تَفْسِيرِهَا."),
          concept(66, "يَرْبِطَ بَيْنَ مَضْمُونِ السُّورَةِ وَقِيَمِ مِثْلِ الصَّبْرِ وَالشُّكْرِ لِلَّهِ تَعَالَى"),
          concept(66, "يَشْرَحَ بِكَلِمَاتٍ بَسِيطَةٍ كَيْفَ يُسَاعِدُ اللَّهُ (تَعَالَى) عِبَادَهُ"),
          concept(66, "يُظْهِرَ شُعُورَهُ بِالتَّفَاؤُلِ وَالثِّقَةِ بِأَنَّ اللَّهَ (تَعَالَى) مَعَهُ"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "العِبَادَاتُ صَلَاةُ الجَمَاعَةِ",
        printedHead: "العِبَادَاتُ صَلَاةُ الجَمَاعَةِ",
        bookFrom: 71,
        concepts: [
          concept(71, "يُحَافِظَ عَلَى الصَّلَاةِ، وَيُدْرِكَ فَضْلَ المُحَافَظَةِ عَلَيْهَا."),
          concept(71, "يَتَعَرَّفَ فَضْلَ صَلَاةِ الجَمَاعَةِ."),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "السَّيْرُ وَالشَّخْصِيَّاتُ الدَّعْوَةُ الجَهْرِيَّةُ",
        printedHead: "الدَّعْوَةُ الجَهْرِيَّةُ",
        bookFrom: 73,
        concepts: [
          concept(73, "يَعْرِفَ أَنَّ النَّبِيَّ ﷺ دَعَا النَّاسَ عَلَانِيَةً لِعِبَادَةِ اللَّهِ رَغْمَ الْمُعَارَضَةِ، وَيَشْرَحَ ذَلِكَ بِكَلِمَاتٍ بَسِيطَةٍ"),
          concept(73, "يُظْهِرَ شُعُورَهُ بِالْفَخْرِ بِنَبِيِّهِ ﷺ وَيَحْرِصَ عَلَى الشَّجَاعَةِ وَالصَّبْرِ عِنْدَ مُوَاجَهَةِ الصُّعُوبَاتِ"),
          concept(73, "يَرْبِطَ بَيْنَ شَجَاعَةِ النَّبِيِّ ﷺ وَبَيْنَ مَوَاقِفَ حَيَاتِيَّةٍ يَحْتَاجُ فِيهَا إِلَى الشَّجَاعَةِ (مِثْلَ قَوْلِ الحَقِّ)"),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "السِّيرُ وَالشَّخْصِيَّاتُ نَبِيُّ اللَّهِ دَاوُدُ عَلَيْهِ السَّلَامُ",
        printedHead: "نَبِيُّ اللَّهِ دَاوُدُ عَلَيْهِ السَّلَامُ",
        bookFrom: 76,
        concepts: [
          concept(76, "يَتَعَرَّفَ قِصَّةَ حَيَاةِ نَبِيِّ اللَّهِ دَاوُدَ عَلَيْهِ السَّلَامُ."),
          concept(76, "يَسْتَنْتِجَ أَنَّ اللَّهَ (تَعَالَى) يَنْصُرُ مَنْ يَثِقُ بِهِ، وَيَعْتَمِدُ عَلَيْهِ."),
          concept(76, "يَرْبِطَ بَيْنَ ثِقَةِ دَاوُدَ عَلَيْهِ السَّلَامُ بِاللَّهِ، وَبَيْنَ مَوَاقِفَ يَحْتَاجُ فِيهَا إِلَى الثِّقَةِ بِاللَّهِ (تَعَالَى) فِي حَيَاتِهِ."),
          concept(76, "يُظْهِرَ شُعُورَهُ بِالفَخْرِ بِأَنْبِيَاءِ اللَّهِ (تَعَالَى)، وَيَحْرِصَ عَلَى ذِكْرِ اللَّهِ وَالثِّقَةِ بِهِ."),
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: TYPE,
        title: "القِيَمُ وَالْأَخْلَاقُ قِصَّةٌ (فِي السَّرَّاءِ وَالضَّرَّاءِ)",
        printedHead: "قِصَّةٌ (فِي السَّرَّاءِ وَالضَّرَّاءِ)",
        bookFrom: 78,
        concepts: [
          concept(78, "يُظْهِرَ التَّعَاطُفَ مَعَ الْآخَرِينَ فِي سُلُوكِهِ الْيَوْمِيِّ."),
          concept(78, "يُعَبِّرَ عَنْ مُشَارَكَةِ الْآخَرِينَ فِي السَّرَّاءِ وَالضَّرَّاءِ."),
          concept(78, "يَحْفَظَ حَدِيثًا عَنْ تَوَادِّ الْمُسْلِمِينَ وَتَرَاحُمِهِمْ."),
          concept(78, "يُفَسِّرَ أَثَرَ مُشَارَكَةِ الْآخَرِينَ فِي السَّرَّاءِ وَالضَّرَّاءِ وَفِي الْمُجْتَمَعِ مِنْ حَوْلِنَا."),
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
  const unit = EGYPT_ISLAMIC_G2_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ISLAMIC_G2_T1_UNITS.forEach((unit, ui) => {
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
  "islamic-g2-t1",
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
 * a bare numeral on its own last line («١١»، «١٧»، … «٨٦»، books 28/38/81/87
 * in Extended Arabic-Indic digits «۲۸»/«۳۸»/«۸۱»/«۸۷»), so the last non-empty
 * line is read and accepted only when it is a bare number. Verified
 * mechanically to leave every term page outside the twenty-six pages listed in
 * `FOLIO_LESS_ANCHORS` yielding exactly its own single number.
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
 * number, and the value it printed instead — measured, not guessed. Book 53
 * prints «٥٣» but the text layer kept only «03»; every other parseable footer
 * matches its page number exactly, and the twenty-six pages that carry no
 * parseable number at all live in `FOLIO_LESS_ANCHORS`.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {
  53: 3,
};

/**
 * The term pages that print no parseable folio in the OCR, each with a printed
 * string the check accepts in its place. Books 7/35/62 are the three unit
 * openers («دُرُوسُ الوَحْدَةِ» + «أَهْدَافُ الوَحْدَةِ»); they list their
 * unit's lessons and print no folio by design. Books 8/12/18/36/48/51/56/66/78
 * are lesson head pages whose «الأهداف» block sits at the foot (the folio
 * prints inline mid-page). Books 35/62/65 open their last line with a list
 * item number («9 …»، «٦ …»، «3 …») the footer test would mistake for a
 * folio. The rest are body pages that close on content digits or exercise
 * marks (books 9/10/13/22/26/31/33/40/50/52/60/82).
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  7: "دُرُوسُ الوَحْدَةِ",
  8: "اللهُ تَعَالَى (السَّمِيعُ)",
  9: "تَحَدَّثْ مَعَ صَدِيقِكَ",
  10: "كَائِنَاتٌ لَا نَسْتَطِيعُ أَنْ نَفْهَمَ كَلَامَهَا",
  12: "سُورَةُ القَدْرِ",
  13: "أَلْفِ شَهْرٍ مِنْ غَيْرِهَا.",
  18: "الأَذَانُ",
  22: "تُسَاعِدُ النَّاسَ عند مَصَائِبِهِمْ",
  26: "ظَلَمُوا الصَّيْحَةُ فَأَصْبَحُوا فِي دِيَارِهِمْ جَاثِمِينَ",
  31: "التَّوَكَّلُ يَعْنِي أَنْ نَعْتَمِدَ عَلَى اللَّهِ",
  33: "(ج) إِلَى العَمَلِ",
  35: "الوحدة الثانية",
  36: "اللَّهُ تَعَالَى (البَصِيرُ)",
  40: "الْإِيمَانُ وَالْعَمَلُ الصَّالِحُ يَرْفَعَانِ",
  48: "الأَوَائِلِ فِي مُسَانَدَتِهِ.",
  50: "اخْتَرْ أَحَدَ السَّابِقِينَ الْأَوَائِلِ",
  51: "نَبِيُّ اللَّهِ مُوسَى",
  52: "وَأَغْرَقَ فِرْعَوْنَ وَجُنُودَهُ",
  56: "يُوَضِّحَ مَعْنَى الأَمَانَةِ",
  60: "تَكْبِيرَاتُ الْعِيدِ",
  62: "الوِحْدَةُ الثَّالِثَةُ",
  65: "مَادَا يُعَلِّمُنَا اسْمُ اللَّهِ تَعَالَى",
  66: "سُورَةُ الشَّرْحِ",
  73: "يَحْتَاجُ فِيهَا إِلَى الشَّجَاعَةِ",
  78: "فِي السَّرَّاءِ وَالضَّرَّاءِ",
  82: "(جـ) التَّعَبُ",
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
  const units = EGYPT_ISLAMIC_G2_T1_UNITS;
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
        if (page < EGYPT_ISLAMIC_G2_T1_BOOK_START || page > EGYPT_ISLAMIC_G2_T1_BOOK_END) {
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
  if (first && first.bookFrom !== EGYPT_ISLAMIC_G2_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ISLAMIC_G2_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ISLAMIC_G2_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ISLAMIC_G2_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio (the last line), or, on the twenty-six pages named in
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
  const units = EGYPT_ISLAMIC_G2_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ISLAMIC_G2_T1_BOOK_START || book > EGYPT_ISLAMIC_G2_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_ISLAMIC_G2_T1_BOOK_END - EGYPT_ISLAMIC_G2_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ISLAMIC_G2_T1_BOOK_START} و${EGYPT_ISLAMIC_G2_T1_BOOK_END}`,
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
  for (let p = EGYPT_ISLAMIC_G2_T1_BOOK_START; p <= EGYPT_ISLAMIC_G2_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
