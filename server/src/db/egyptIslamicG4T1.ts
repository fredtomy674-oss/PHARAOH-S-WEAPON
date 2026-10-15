// Egyptian Ministry Grade-4 Islamic Religious Education
// («التربية الدينية الإسلامية — الصف الرابع الابتدائي»), first term.
//
// The curriculum tree for the Egypt `eg-g4-islamic-education` curriculum is
// rebuilt from the Ministry textbook (98 scanned pages, first term only).
// This module is the single source of truth for the FIRST term: the three
// printed units of the first term (الدِّينُ وَالْكَرَمُ، الْأُخُوَّةُ فِي الدِّينِ،
// الدِّينُ وَقَبُولُ الْآخَرِ), every printed lesson inside them (exactly as the
// book's own contents on scans 5–6 lists them) and, for every lesson, the
// book's own printed «الأهداف» — verbatim, as on the lesson's first page
// («في نهاية هذا الدرس يُتوقع من التلميذ أن: …»). The self-checks at the
// bottom prove that mapping against the OCR itself, page by page.
//
// THE OFFSET IS +1 — book page N = scan page N + 1
// Every content page that carries a folio prints it as a bare numeral on its
// last line, so `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted
// here: scan 8 prints «٧» (book 7), scan 12 prints «١١» (book 11), scan 20
// prints «١٩» (book 19), scan 27 prints «٢٦» (book 26), scan 37 prints «٣٦»
// (book 36), scan 66 prints «٦٥» (book 65), scan 88 prints «٨٧» (book 87),
// scan 93 prints «٩٢» (book 92) and scan 96 prints «٩٥» (book 95). The
// folios form one unbroken scan − 1 sequence across the whole term, which is
// what fixes the offset — not the contents numbers (see below).
//
// THE CONTENTS LISTS THREE WRONG START PAGES
// The contents (scans 5–6) lists the first three lessons at ٨، ١٢، ١٧, but
// the lessons' own first pages print their heads, their «الأهداف» and their
// folios on scans 8، 12، 17 — i.e. books ٧، ١١، ١٦. Scans 9 and 13 are body
// pages (a verse and the surah text, with no head and no folio), so no
// lesson can start there; every later contents number (١٩، ٢٣، ٢٦، …) agrees
// with the folio sequence exactly. The spec therefore follows the printed
// heads and folios (7، 11، 16), not the three contents typos.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–6 are before the term: the cover (1), the credits masthead
// (2), the «مُقَدِّمَةٌ» (3–4) and the two contents pages (5–6). Scan pages
// 97–98 are after the term: the publisher data page (97, which states the
// book has 96 pages) and the back matter (98). The term runs from the unit 1
// opener (book 6 = scan 7) to the second general-review page (book 95 = scan
// 96): `EGYPT_ISLAMIC_G4_T1_BOOK_START` / `_BOOK_END` are exactly those two
// pages, and the tiling assertion proves nothing in between is left
// unreachable. `pagesChecked` therefore equals 95 − 6 + 1 = 90.
//
// SEVEN TERM PAGES NEED A DOCUMENTED FOLIO EXCEPTION
// The two verse-text pages (books 8، 12: a hadith/verse close and the full
// surah text), the surah-Abasa page (book 69), the two body pages that close
// on content digits (books 55، 59) and the two unit openers that print a
// contents-like list instead of a folio (books 6، 35) carry no bare folio in
// the OCR. Rather than weaken the page-number check, these seven are exempt
// from it and anchored on a string the page itself prints, named in
// `FOLIO_LESS_ANCHORS`. Every other term page's last line is its own bare
// folio, verified mechanically, so `FOOTER_OCR_MISREADS` is empty. (The unit
// 3 opener, book 64, DOES print its folio «٦٤», so it needs no anchor.)
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED «الأهداف»
// Every teaching lesson prints a bulleted «الأهداف» list on its first page.
// Each item is carried verbatim as a concept of that lesson (kind «هدف»),
// with `bookFrom` set to the lesson's first page — exactly as the Christian
// siblings and the Grade-10 Islamic spec do. Two lists keep the text layer's
// own quirks honest rather than reconstructed: lesson 2-6 bullets print «.»
// instead of «•», and lessons 1-6 and 2-7 wrap one objective over two printed
// lines (stored joined).
//
// REVIEWS RIDE WITH THE LAST LESSON
// The «مُرَاجَعَةٌ عَلَى الْوَحْدَةِ» pages (books 33–34، 62–63، 90–91) and
// the «تَقْيِيمَاتٌ (مُرَاجَعَةٌ عَامَّةٌ)» pages (books 92–95) print exercises
// but no «الأهداف», so they are not lessons — the contents lists them with •
// bullets — and stay inside the owning unit's last lesson range, exactly as
// the Christian Grade-4 spec keeps its review and exam pages inside its last
// lesson. Lesson 3-3 («مُرَاجَعَةٌ عَلَى أَحْكَامِ لَامِ (أَلْ)
// وَالْإِظْهَارِ الْحَلْقِيِّ») IS a teaching lesson: it prints «الأهداف» on
// book 74 like any other lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 1 (verified: book p.95 = scan p.96). */
export const BOOK_TO_PDF_OFFSET = 1;

/** Scans absent from the corpus. All 98 scans are present, so this is empty. */
export const MISSING_SCANS: readonly number[] = [];

/** First printed page of the term — the unit 1 opener (scan 7). */
export const EGYPT_ISLAMIC_G4_T1_BOOK_START = 6;

/** Last printed page of the term — the second general-review page (scan 96). */
export const EGYPT_ISLAMIC_G4_T1_BOOK_END = 95;

/** The scanned pages before the term: cover, credits, مقدمة and contents. */
export const EGYPT_ISLAMIC_G4_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The scanned pages after the term: the publisher data page and back matter. */
export const EGYPT_ISLAMIC_G4_T1_BACK_MATTER = { from: 97, to: 98 } as const;

/** One printed objective of a lesson — becomes one concept in the app tree. */
export interface IslamicG4T1Concept {
  /** Printed book page where this objective starts (the lesson's first page). */
  bookFrom: number;
  /** The printed component kind: «هدف». */
  kind: string;
  /** The printed objective, verbatim. */
  title: string;
}

/** One lesson of the first term, as the contents lists it. */
export interface IslamicG4T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Positional Arabic ordinal, e.g. "الثالث" (the book numbers no lessons). */
  ordinal: string;
  /** The lesson's opening component type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson. */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed «الأهداف» for this lesson, in order. */
  concepts: IslamicG4T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book prints no
   * appendix: every page of the term belongs to a unit. Kept so the module
   * shares the shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — one of the three units of the first term. */
export interface IslamicG4T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"3". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: الدِّينُ وَالْكَرَمُ". */
  title: string;
  /** The unit head the opener page prints, e.g. "الْوَحْدَةُ الْأُولَى". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: IslamicG4T1Lesson[];
}

const TYPE = "هدف";

function concept(bookFrom: number, title: string): IslamicG4T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The three units of the first term with their printed lessons and every
 * printed «الأهداف» item, transcribed from the first page of each lesson
 * and checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Lesson starts come from the book's contents (scans 5–6) corrected by the
 * lessons' own heads and folios for the first three lessons (7، 11، 16 —
 * see the header comment); each lesson's concepts are the bulleted
 * objectives the book prints on the page the lesson starts on, kept
 * verbatim.
 */
export const EGYPT_ISLAMIC_G4_T1_UNITS: IslamicG4T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: الدِّينُ وَالْكَرَمُ",
    printedHead: "الْوَحْدَةُ الْأُولَى",
    bookFrom: 6,
    bookTo: 34,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الإِيمَانُ بِالرُّسُلِ",
        printedHead: "الإِيمَانُ بِالرُّسُلِ",
        bookFrom: 7,
        concepts: [
          concept(7, "يتعرَّف مفهوم الرسول والرسالة."),
          concept(7, "يوضح الحكمة من إرسال الرسل."),
          concept(7, "يعدد أسماء بعض الرسل الذين أرسلهم الله إلى البشر."),
          concept(7, "يستنتج أثر الإيمان بالرسل في حياة المسلم."),
          concept(7, "يظهر تقديره لدور الرسل في نشر الهداية."),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "سُورَةُ الانْفِطَارِ",
        printedHead: "سُورَةُ الانْفِطَارِ",
        bookFrom: 11,
        concepts: [
          concept(11, "يتلو سورة الانفطار تلاوةً صحيحةً."),
          concept(11, "يقرأ غيبًا سورة الانفطار بشكلٍ مُتقن."),
          concept(11, "يتعرَّف معاني المفردات الواردة في السورة."),
          concept(11, "يستنتج القيم والمبادئ التي تدعو إليها السورة الكريمة."),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا: أَحْكَامُ لَامِ (أَلْ)",
        printedHead: "وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا",
        bookFrom: 16,
        concepts: [
          concept(16, "يراعي بعض أحكام التلاوة: لام (أل)."),
          concept(16, "يحدّد الحروف التي تأتي بعد اللام الشمسية."),
          concept(16, "يحدّد الحروف التي تأتي بعد اللام القمرية."),
          concept(16, "يُميّز بين حروف اللام الشمسية وحروف اللام القمرية."),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "الزَّكَاةُ",
        printedHead: "الزَّكَاةُ",
        bookFrom: 19,
        concepts: [
          concept(19, "يتعرَّف أهمية الزكاة في الإسلام، وأثرها في المجتمع."),
          concept(19, "يتعرَّف حكم الزكاة في الإسلام."),
          concept(19, "يُظهر حبَّه للعطاء والتكافل الاجتماعي من خلال أقواله وأفعاله."),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "بِنَاءُ الْمَسْجِدِ النَّبَوِيِّ",
        printedHead: "بِنَاءُ الْمَسْجِدِ النَّبَوِيِّ",
        bookFrom: 23,
        concepts: [
          concept(23, "يستنتج أسباب بناء النبي ﷺ للمسجد النبوي."),
          concept(23, "يصف كيفية بناء المسجد النبوي، والأدوات التي استخدمت في بنائه."),
          concept(23, "يستنتج القيم الإسلامية المستفادة من مشاركة النبي ﷺ وأصحابه في بناء المسجد."),
          concept(23, "يُعَبِّر عن أهمية المسجد في حياة المجتمع المسلم."),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: TYPE,
        title: "أَبُو أَيُّوبَ الْأَنْصَارِيُّ",
        printedHead: "أَبُو أَيُّوبَ الْأَنْصَارِيُّ",
        bookFrom: 26,
        concepts: [
          concept(26, "يَتَعَرَّفَ الصَّحَابِيَّ أَبَا أَيُّوبَ الْأَنْصَارِيَّ رَضِيَ اللهُ عَنْهُ وَسِيرَتَهُ الْعَطِرَةَ."),
          concept(
            26,
            "يَسْتَنْتِجَ الصِّفَاتِ الْحَمِيدَةَ الَّتِي تَمَيَّزَ بِهَا الصَّحَابِيُّ أَبُو أَيُّوبَ الْأَنْصَارِيُّ رَضِيَ اللهُ عَنْهُ.",
          ),
          concept(
            26,
            "يُظْهِرَ تَقْدِيرًا لِأَهَمِّيَّةِ الْإِيثَارِ مِنْ خِلَالِ مَوَاقِفِ أَبِي أَيُّوبَ الْأَنْصَارِيِّ رَضِيَ اللهُ عَنْهُ.",
          ),
          concept(26, "يُطَبِّقَ الْقِيَمَ الْمُسْتَفَادَةَ فِي الْحَيَاةِ الْيَوْمِيَّةِ، مِثْلَ الْكَرَمِ وَالْإِيثَارِ."),
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        type: TYPE,
        title: "إِكْرَامُ الضَّيْفِ",
        printedHead: "إِكْرامُ الضَّيفِ",
        bookFrom: 29,
        concepts: [
          concept(29, "يشرح معنى إكرام الضيف وأهميته في الإسلام."),
          concept(29, "يدلل من القرآن الكريم والسنة النبوية على إكرام الضيف."),
          concept(29, "يستنتج الآثار التي يحققها إكرام الضيف في المجتمع."),
          concept(29, "يطبق سلوكيات إكرام الضيف في حياته اليومية."),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: الْأُخُوَّةُ فِي الدِّينِ",
    printedHead: "الوَحْدَةُ الثَّانِيَةُ",
    bookFrom: 35,
    bookTo: 63,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "وَظِيفَةُ الرُّسُلِ",
        printedHead: "وَظِيفَةُ الرُّسُلِ",
        bookFrom: 36,
        concepts: [
          concept(36, "يستنتج أهمية الرسالة السماوية في هداية الناس."),
          concept(36, "يستخلص الدروس والقيم من سير الرسل عليهم السلام."),
          concept(36, "يطبّق ما تعلّمه من سير الرسل في الحياة اليومية."),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "سُورَةُ التَّكْوِيرِ",
        printedHead: "سُورَةُ التَّكْوِيرِ",
        bookFrom: 40,
        concepts: [
          concept(40, "يتلو سورة التكوير تلاوةً صحيحةً."),
          concept(40, "يتعرَّف معاني المفردات الجديدة في السورة الكريمة."),
          concept(40, "يستنتج القيم والمبادئ التي تتضمنها السورة الكريمة."),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا: أَحْكَامُ النُّونِ السَّاكِنَةِ وَالتَّنْوِينِ (الْإِظْهَارُ الْحَلْقِيُّ)",
        printedHead: "أَحْكَامُ النُّونِ السَّاكِنَةِ وَالتَّنْوِينِ",
        bookFrom: 45,
        concepts: [
          concept(45, "يَتَعَرَّفَ أَحْكَامَ النُّونِ السَّاكِنَةِ وَالتَّنْوِينِ (الْإِظْهَارُ الْحَلْقِيُّ)."),
          concept(45, "يُمَيِّزَ أَحْرُفَ الْإِظْهَارِ الْحَلْقِيِّ."),
          concept(45, "يُطَبِّقَ حُكْمَ الْإِظْهَارِ الْحَلْقِيِّ لِلنُّونِ السَّاكِنَةِ وَالتَّنْوِينِ فِي أَثْنَاءِ تِلَاوَتِهِ."),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "شُرُوطُ الزَّكَاةِ",
        printedHead: "شُرُوطُ الزَّكَاةِ",
        bookFrom: 48,
        concepts: [
          concept(48, "يتعرَّف شروط وجوب الزَّكاة."),
          concept(48, "يُطبِّق مفهوم الزكاة في الحياة اليومية من خلال أمثلة عملية."),
          concept(48, "يربط بين شروط الزكاة وأدلتها الشرعية."),
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "الْمُؤَاخَاةُ بَيْنَ الْمُهَاجِرِينَ وَالْأَنْصَارِ",
        printedHead: "الْمُؤَاخَاةُ بَيْنَ الْمُهَاجِرِينَ وَالْأَنْصَارِ",
        bookFrom: 51,
        concepts: [
          concept(51, "يَتَعَرَّفَ الْمَقْصُودَ بِالْمُؤَاخَاةِ بَيْنَ الْمُهَاجِرِينَ وَالْأَنْصَارِ."),
          concept(51, "يَشْرَحَ الْأَسْبَابَ الَّتِي دَعَتِ النَّبِيَّ ﷺ إِلَى تَشْرِيعِ الْمُؤَاخَاةِ."),
          concept(51, "يَسْتَنْتِجَ الدُّرُوسَ الْمُسْتَفَادَةَ مِنْ مَوَاقِفِ الْمُؤَاخَاةِ بَيْنَ الْمُهَاجِرِينَ وَالْأَنْصَارِ."),
          concept(51, "يُعَبِّرَ عَنْ أَهَمِّيَّةِ التَّعَاوُنِ وَالْإِيثَارِ فِي حَيَاتِنَا الْيَوْمِيَّةِ."),
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        type: TYPE,
        title: "عَبْدُ الرَّحْمَنِ بْنُ عَوْفٍ",
        printedHead: "عَبْدُ الرَّحْمَنِ بْنُ عَوْفٍ",
        bookFrom: 54,
        concepts: [
          concept(54, "يتعرَّف الصحابي الجليل عبد الرحمن بن عوف رضي الله عنه، ودوره في الإسلام."),
          concept(54, "يستنتج صفاته وأخلاقه رضي الله عنه من خلال المواقف التي مرَّ بها."),
          concept(54, "يستخلص الدروس المستفادة من حياته رضي الله عنه."),
          concept(54, "يطبّق ما تعلَّمه من حياة عبد الرحمن بن عوف رضي الله عنه في مواقف حياتية."),
          concept(54, "يكتشف معلومات إضافية عن عبد الرحمن بن عوف رضي الله عنه مستخدمًا التقنيات الحديثة."),
        ],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        type: TYPE,
        title: "الِاعْتِمَادُ عَلَى النَّفْسِ",
        printedHead: "الِاعْتِمَادُ عَلَى النَّفْسِ",
        bookFrom: 58,
        concepts: [
          concept(58, "يَتَعَرَّفَ مَعْنَى الِاعْتِمَادِ عَلَى النَّفْسِ، وَأَهَمِّيَتِهِ فِي حَيَاةِ الْمُسْلِمِ."),
          concept(58, "يُظْهِرَ وَعْيًا بِقِيمِ الِاجْتِهَادِ، وَالْعَمَلِ، وَعَدَمِ التَّوَاكُلِ فِي الْإِسْلَامِ."),
          concept(
            58,
            "يَسْتَنْتِجَ مِنْ خِلَالِ مَوَاقِفَ مُخْتَارَةٍ مِنَ السِّيرَةِ النَّبَوِيَّةِ وَحَيَاةِ الصَّحَابَةِ قِيمَةَ الِاعْتِمَادِ عَلَى النَّفْسِ.",
          ),
          concept(
            58,
            "يُطَبِّقَ مَبْدَأَ الِاعْتِمَادِ عَلَى النَّفْسِ فِي حَيَاتِهِ الْيَوْمِيَّةِ مِنْ خِلَالِ أَمْثِلَةٍ عَمَلِيَّةٍ.",
          ),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الدِّينُ وَقَبُولُ الْآخَرِ",
    printedHead: "الوَحْدَةُ الثَّالِثَةُ",
    bookFrom: 64,
    bookTo: 95,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "بَيْنَ النُّبُوَّةِ وَالرِّسَالَةِ",
        printedHead: "بَيْنَ النُّبُوَّةِ وَالرِّسَالَةِ",
        bookFrom: 65,
        concepts: [
          concept(65, "يتعرّف مفهوم النبي والرسول في الإسلام."),
          concept(65, "يفرّق بين النبي والرسول؛ من حيث المهمة والخصائص."),
          concept(65, "يشرح أهمية الرسالات السماوية ودورها في هداية الناس."),
          concept(65, "يعدّد أمثلة من حياة الأنبياء والرسل."),
          concept(65, "يشارك في أنشطة تفاعلية تعزّز التعلّم الممتع باستخدام التكنولوجيا."),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "سُورَةُ عَبَسَ",
        printedHead: "سُورَةُ عَبَسَ",
        bookFrom: 68,
        concepts: [
          concept(68, "يتلو سورة عبس تلاوة صحيحة من الذاكرة."),
          concept(68, "يتعرّف معاني المفردات في السورة."),
          concept(68, "يستنتج القيم الإسلامية والدروس المستفادة من الآيات."),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "مُرَاجَعَةٌ عَلَى أَحْكَامِ لَامِ (أَلْ) وَالْإِظْهَارِ الْحَلْقِيِّ",
        printedHead: "مُرَاجَعَةٌ عَلَى أَحْكَامِ لَامِ (أَلْ)",
        bookFrom: 74,
        concepts: [
          concept(74, "يُرَاعِيَ الْفَرْقَ فِي النُّطْقِ بَيْنَ اللَّامِ الشَّمْسِيَّةِ وَاللَّامِ الْقَمَرِيَّةِ فِي أَثْنَاءِ التِّلَاوَةِ."),
          concept(74, "يَتَعَرَّفَ أَحْكَامَ النُّونِ السَّاكِنَةِ وَالتَّنْوِينِ (الْإِظْهَارِ الْحَلْقِيِّ)."),
          concept(74, "يَعُدَّ أَحْرُفَ الْإِظْهَارِ الْحَلْقِيِّ."),
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "أَنْوَاعُ الزَّكَاةِ",
        printedHead: "أَنْوَاعُ الزَّكَاةِ",
        bookFrom: 77,
        concepts: [
          concept(77, "يتعرَّف أنواع الزكاة المختلفة: (زكاة الزروع والثمار، زكاة الأنعام)."),
          concept(77, "يستنتج الحكمة من فرض الزكاة، وفوائدها للفرد والمجتمع."),
          concept(77, "يظهر حبه للعطاء والإحسان."),
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "وَثِيقَةُ الْمَدِينَةِ وَأُسُسُ الدَّوْلَةِ الْإِسْلَامِيَّةِ",
        printedHead: "وَثِيقَةُ الْمَدِينَةِ وَأُسُسُ الدَّوْلَةِ الْإِسْلَامِيَّةِ",
        bookFrom: 80,
        concepts: [
          concept(80, "يتعرّف وثيقة المدينة، ودورها في بناء الدولة الإسلامية."),
          concept(80, "يستنتج القيم والمبادئ التي قامت عليها الوثيقة، مثل العدل، والمساواة، والتعايش السلمي."),
          concept(80, "يوضّح كيف ساهمت الوثيقة في تنظيم المجتمع الإسلامي في المدينة المنورة."),
          concept(80, "يُظهر روح التسامح واحترام الآخرين من خلال فهم أسس التعايش التي أرستها الوثيقة."),
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        type: TYPE,
        title: "عُثْمَانُ بْنُ عَفَّانَ",
        printedHead: "عُثْمَانُ بْنُ عَفَّانَ",
        bookFrom: 83,
        concepts: [
          concept(83, "يتعرّف سيرة الصحابي عثمان بن عفان رضي الله عنه ونشأته."),
          concept(83, "يحدّد أبرز صفات عثمان بن عفان رضي الله عنه وأخلاقه التي اشتهر بها."),
          concept(83, "يتعرّف دور عثمان بن عفان رضي الله عنه في نشر الإسلام وأهم أعماله في خلافته."),
          concept(83, "يستخلص الدروس المستفادة من سيرة عثمان بن عفان رضي الله عنه ويمكن تطبيقها في الحياة اليومية."),
        ],
      },
      {
        key: "3-7",
        ordinal: "السابع",
        type: TYPE,
        title: "السَّخَاءُ",
        printedHead: "السَّخَاءُ",
        bookFrom: 87,
        concepts: [
          concept(87, "يُميّز الفرق بين السخاء والبخل."),
          concept(87, "يتعرّف أمثلة من السيرة النبوية عن السخاء."),
          concept(87, "يستخلص الدروس المستفادة من القصص الإسلامية."),
          concept(87, "يُشارك في مبادرات مجتمعية تظهر إدراكه للسخاء."),
          concept(87, "يُطبّق قيمة السخاء في مواقف حياتية."),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the
 * unit — so the unit opener, the unit reviews and (in unit 3) the general
 * evaluations stay inside the unit they belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ISLAMIC_G4_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ISLAMIC_G4_T1_UNITS.forEach((unit, ui) => {
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
  "islamic-g4-t1",
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
 * Page-number candidates a content page prints at its foot. This book's foot
 * is a bare numeral on its own last line («٧»، «١٩»، «٩٥»), so the last
 * non-empty line is scanned and every number on a foot-looking line is a
 * candidate.
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
    /^[([]?[0-9٠-٩۰-۹]+[\])]?$/.test(last) || /^[0-9٠-٩۰-۹]+[\s•.·\-–—]/.test(last);
  if (!looksLikeFoot) return [];
  const latin = toLatinDigits(last).replace(/[^0-9]/g, " ").replace(/\s+/g, " ").trim();
  const nums: number[] = [];
  for (const tok of latin.split(" ")) if (tok) nums.push(Number(tok));
  return [...new Set(nums)].filter((n) => n > 0);
}

/**
 * The book number a content page prints at its foot, or null. Every content
 * page that carries a folio prints exactly one number there and it is its own,
 * which is what fixes the offset; the pages listed in `FOLIO_LESS_ANCHORS`
 * print no parseable number and are handled by their anchor instead.
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
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no parseable folio in the OCR, each with the anchor
 * the check accepts in place of a page number. Every anchor is a string the
 * page itself prints: the two unit openers (6/35), the hadith-close page (8),
 * the two surah-text pages (12/69) and the two body pages that close on
 * content digits (55/59).
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  6: "الْوَحْدَةُ الْأُولَى",
  8: "وَلَوْ كَانَ بَعْضُهُمْ لِبَعْضٍ ظَهِيرًا",
  12: "يَوْمَ لَا تَمْلِكُ نَفْسٌ لِنَفْسٍ شَيْئًا وَالْأَمْرُ يَوْمَئِذٍ لِلَّهِ",
  35: "الوَحْدَةُ الثَّانِيَةُ",
  55: "دُلَّنِي عَلَى السُّوقِ",
  59: "يَسْعَى إِلَيْهَا بِقُوَّةٍ وَعَزْمٍ",
  69: "فَإِذَا جَاءَتِ الصَّاخَّةُ",
};

/** Every head kind the table may use: this book's lessons carry objectives only. */
const KNOWN_KINDS = new Set(["هدف"]);

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every range
 * sits inside its section, concept pages rise inside their lesson, every concept
 * kind is known with the lesson type matching its first concept, the sections
 * tile the term without gaps or overlaps, and the first/last sections hit the
 * book's own bounds. A content mistake here would quietly ground the tutor on the
 * wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ISLAMIC_G4_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_ISLAMIC_G4_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ISLAMIC_G4_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ISLAMIC_G4_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ISLAMIC_G4_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     its printed folio, or, on the seven pages named in
 *     `FOLIO_LESS_ANCHORS`, from the anchor quoted there;
 *  2. every unit opener prints the unit head and every lesson's first page prints
 *     that lesson's head;
 *  3. every lesson's title and every objective is printed on the pages the
 *     lesson owns (each objective on its own first page);
 *  4. every printed page in [6, 95] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR'd
 *     page of the term.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_ISLAMIC_G4_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ISLAMIC_G4_T1_BOOK_START || book > EGYPT_ISLAMIC_G4_T1_BOOK_END) continue;
    const text = loadBookPage(book);
    pagesChecked += 1;
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }

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

  // 2. every unit opener prints the unit head and every lesson's first page
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

  // 3. every objective's printed head is on its own page.
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.concepts.forEach((c) => {
        if (loadBookPage(c.bookFrom) && !pagePrints(c.bookFrom, c.title)) {
          problems.push(`الدرس ${lesson.key}: صفحة المكوّن ${c.bookFrom} لا تطبع «${c.title}»`);
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
  for (let p = EGYPT_ISLAMIC_G4_T1_BOOK_START; p <= EGYPT_ISLAMIC_G4_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
