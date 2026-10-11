// PHASE G8-isl — official Egypt Preparatory-2 (Grade 8) Islamic Religious
// Education, first term («كتاب الوزارة»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g8-islamic-education` is rebuilt from the Ministry textbook
// `Islamic_Education_Prep2_T1.pdf` (80 scan pages, all OCR'd). This module is the
// single source of truth for its structure: the three units and their seven
// lessons each, exactly as the book's المحتويات (book page 4) prints them, and
// the «أهداف الدرس» the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage   (book page 9 = PDF page 9; offset 0)
// Numbered content pages carry their own number in the running foot, sometimes
// bare («٩», «٥٥»), sometimes wrapped with the unit title («١٢ الوحدة الأولى:
// …») or the school title («الصف الثاني الإعدادي - الفصل الدراسي الأول»), which
// is what fixes the mapping page by page. The unit openers and lesson heads
// print the running unit/lesson title instead of a numeral.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس», NOT A «مفهوم»
// The book's printed index stops at the lesson; each of its five «مجالات»
// (العقيدة، القرآن والتفسير، العبادات، السير والشخصيات، القيم والأخلاق) and the
// extra tajwīd lesson are numbered or listed, and where an index line covers two
// pages (e.g. «السيدة فاطمة الزهراء») the book prints two lessons and so does
// the app — exactly as the Grade-6 and Grade-9 Islamic books do. Each lesson's
// RAG document is the whole lesson; the app mirrors the book: unit → lesson.
// The «من أحكام التجويد» lines of each unit are one lesson like their printed
// counterparts.
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND UNIT REVIEW
// Each unit opens with a one-page opener (title + «أهداف الوحدة» + «دروس
// الوحدة») and closes with «مراجعة على الوحدة». Neither is a lesson, so — as in
// the other Ministry books — the opener rides with the unit's first lesson and
// the review with its last. A lesson's own `bookFrom` is still stored; the range
// it owns is derived as "from the unit's first page, down to the page before the
// next lesson starts, bounded by the unit".

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.9 = PDF p.9). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_ISLAMIC_G8_T1_BOOK_START = 5;

/** Last printed content page — the final «مراجعة على الوحدة الثالثة». */
export const EGYPT_ISLAMIC_G8_T1_BOOK_END = 79;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface IslamicG8T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /** Lesson title as printed at the head of the lesson (without the ordinal). */
  title: string;
  /**
   * First printed book page of the lesson itself. The range the lesson *owns*
   * also includes its unit's opener when it is the unit's first lesson, which is
   * why ownership is derived by `lessonBookRange` rather than stored here.
   */
  bookFrom: number;
  /**
   * The lesson's printed «أهداف الدرس» — the only per-lesson list the book
   * prints (there is no «مفهوم» layer in this book).
   */
  concepts: string[];
}

export interface IslamicG8T1Unit {
  /** Arabic ordinal used in unit-level messages, e.g. "الثانية". */
  ordinal: string;
  /** Unit title exactly as the book's index prints it. */
  title: string;
  /** First printed book page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed book page of the unit. */
  bookTo: number;
  lessons: IslamicG8T1Lesson[];
}

/**
 * The three units of the first term with their twenty-one lessons: unit/lesson
 * titles and numbered starts from the book's محتويات (4), objectives from each
 * lesson's first page (6, 9, 12, 14, 18, 21, 25 / 31, 35, 38, 40, 43, 48, 51 /
 * 57, 60, 63, 65, 69, 72, 75). Verified against every printed page by
 * `assertTreeMatchesTheBook`.
 */
export const EGYPT_ISLAMIC_G8_T1_UNITS: IslamicG8T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: بِنَاءُ المُجْتَمَعِ المُسْلِمِ",
    bookFrom: 5,
    bookTo: 29,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "العَقِيدَة: من أسماء الله (تعالى): الغَنِيُّ",
        bookFrom: 6,
        concepts: [
          "يَتَعَرَّفَ مَعْنَى اسْمِ اللَّهِ (الغَنِيِّ).",
          "يَسْتَدِلَّ عَلَى حَاجَةِ الْإِنْسَانِ إِلَى اللَّهِ (تعالى).",
          "يَتَعَرَّفَ أَثَرَ الإيمان بِاسْمِ اللَّهِ (الغَنِيِّ) فِي حَيَاتِهِ اليَوْمِيَّةِ.",
          "يُظْهِرَ سُلُوكِيَّاتٍ تَدُلُّ عَلَى تَوَكُّلِهِ عَلَى اللَّهِ وَشُكْرِهِ.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "القُرْآنُ والتفسير: سورة (المُنافقون) تِلاوة وحِفْظ وتَفْسِير",
        bookFrom: 9,
        concepts: [
          "يتعرَّف سُورةَ (المُنَافِقُونَ)؛ سببَ نُزولها.",
          "يُظْهِرَ فهمَهُ لمعاني المُفردات الأساسية في السورة.",
          "يستخلص الدُّروس المستفَادَة من السورة، خاصةً في التحذير من النفاق، وأهمية الصدق.",
          "يُطبِّق ما تعلَّمه في سُلوكه اليومي من خلال الالتزام بالصدق والإخلاص.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "من أحكام التجويد: التَّفْخِيم والتَّرْقِيق",
        bookFrom: 12,
        concepts: [
          "يُمَيِّزَ الحُرُوفَ المُفَخَّمَةَ مِنَ المُرَقَّقَةِ مَعَ ذِكْرِ أَمْثِلَةٍ.",
          "يُطَبِّقَ قَوَاعِدَ التَّفْخِيمِ وَالتَّرْقِيقِ فِي أَثْنَاءِ تِلَاوَةِ القُرْآنِ الكَرِيمِ.",
          "يَتَعَرَّفَ مَفْهُومَ التَّفْخِيمِ وَالتَّرْقِيقِ فِي تَجْوِيدِ القُرْآنِ الكَرِيمِ.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "العبادات: يُسْرُ الإسلام في الصلاة",
        bookFrom: 14,
        concepts: [
          "يَتَعَرَّفَ كيفية صلاة القصر.",
          "يُوَضِّحَ كيفية الجمع بين صلاتين.",
          "يُحَدِّدَ الشروط التي تُجيز القَصر.",
          "يَذْكُرَ نوعي الجمع في السفر.",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "السَّيْرُ والشخصيات: أعمال الرسول ﷺ في المدينة",
        bookFrom: 18,
        concepts: [
          "يتعرَّف أبرز أعمال الرسول ﷺ في المدينة المنورة بعد الهجرة.",
          "يُظْهِرَ فَهُمَهُ لأهمية أعمال الرسول ﷺ في بناء المجتمع الإسلامي.",
          "يستخلص الدروس المستفادة من أعمال النَّبِيِّ ﷺ مع ربطها بحياته.",
          "يُظْهِرَ سُلُوكِيَاتٍ تَعْكِسُ الاقتداء بالنَّبِيِّ ﷺ في التعاون والعدل والرحمة.",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "السيدة فاطمة الزهراء رَضِيَ اللَّهُ عَنْهَا",
        bookFrom: 21,
        concepts: [
          "يتعرفَ نَسَبَ السيدة فاطمة الزهراء رَضِيَ اللَّهُ عَنْهَا ومكانتها عِنْدَ النَّبِيِّ ﷺ.",
          "يفهم أبرزَ محطّات حياتها ودَوْرَهَا فِي خدمة الإسلام.",
          "يستخلص الدروس المستفادة من سيرتها، مِثْلَ: الصبر، والإخلاص، والتواضع.",
          "يُظْهِرَ سلوكيات تعكس الاقتداء بالسيدة فاطمة رَضِيَ اللَّهُ عَنْهَا في الأخلاق والتعامل مَعَ الأسرة والمجتمع.",
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        title: "القِيَمُ وَالأَخْلَاقُ: المُسْلِمُ مُهَذَّبُ النَّفْسِ",
        bookFrom: 25,
        concepts: [
          "يَفْهَمَ مَعْنَى تَهْذِيبِ النفس وأهميتَهُ في الإسلام.",
          "يَسْتَخْلِصَ الدروس المستفادة مِنْ تهذيب النفس وأثرَهُ على الفرد والمجتمع.",
          "يَدُلَّلَ على صفات المسلم مُهَذَّب النفس من القرآن والسنة.",
          "يُظْهِرَ سُلُوكياتٍ تَعْكَسُ تهذيب النفس في تعاملاتِهِ اليوميَّةِ.",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدةُ الثَّانِيَةُ: العِفَّةُ والسَّمَاحَةُ",
    bookFrom: 30,
    bookTo: 55,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "العَقِيدَة: الإيمان بالقضاء والقَدَر",
        bookFrom: 31,
        concepts: [
          "يَتَعَرَّفَ مَعْنَى الْإِيمَانِ بِالْقَضَاءِ وَالْقَدَرِ وَثَمَرَاتِهِ فِي حَيَاةِ الْمُؤْمِنِ.",
          "يَتَعَرَّفَ الْأَخْطَاءَ الشَّائِعَةَ فِي فَهْمِ الْقَدَرِ وَكَيْفِيَّةَ تَجَنُّبِهَا.",
          "يَدُلَّلَ عَلَى الإِيمَانِ بِالْقَدَرِ مِنْ خِلَالِ أَدِلَّةٍ مِنَ الْقُرْآنِ والسنة.",
          "يُمَارِسَ سُلُوكِيَاتٍ تَعَكْسُ الرِّضَا بِالْقَضَاءِ، وَالْأَخْذَ بِالْأَسْبَابِ.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "القُرْآنُ والتفسير: سورة (الجُمْعَةِ) (الآيات: 1-8) تِلاوة وحِفْظ وتَفْسِير",
        bookFrom: 35,
        concepts: [
          "يتعرَّف معاني مُفردات الآيات (1-8) من سورة الجُمُعَةِ ومَوْضُوعَاتِها الرَّئیسيَّةِ.",
          "يستخلص الدُّروس المستفادة من الآيات (1-8).",
          "يمارس سلوكيات تعكس احترام رسالة النَّبيِّ ﷺ وتَحَمُّل المسؤولية الدَّعويَّة.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "من أحكام التجويد: من أحكام النون الساكنة والتنوين (الإظهار والإدغامُ)",
        bookFrom: 38,
        concepts: [
          "يتعرَّفَ النونَ الساكنةَ وأحكامَها في التجويد: (الإظهار والإدغام).",
          "يُطَبِّقَ هَدَيْنِ الْحُكْمَيْنِ بشكل صحيح في أثناء تلاوة القرآن الكريم.",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "العبادات: الصلواتُ ذواتُ الأسباب",
        bookFrom: 40,
        concepts: [
          "يتعرَّفَ الصلوات ذوات الأسباب (الكسوف، الخسوف، الاستسقاء، التراويح، الاستخارة) وأحكامها.",
          "يُطَبِّقَ مَا تَعَلَّمَهُ فِي مواقف عمليّة (مثل محاكاة الصلاة).",
          "يستنتج حِكْمَة مشروعية هذه الصلوات.",
          "يمارس سلوكيات تعكس تقديره لتيسير الإسلام وحرْصَهُ على الصلاة.",
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        title: "السِّيَرُ والشخصيات: المواطنة في مدينةِ الرَّسولِ ﷺ",
        bookFrom: 43,
        concepts: [
          "يستنتج المواطنة في المدينة المنورة، وكيف عكست التعايش والعدل.",
          "يتعرّف علاقة النبي ﷺ بمشري مَكَّة، ويهود الجزيرة، ونصارى الشام.",
          "يستخلص الدروس المستفادة من علاقة الرسول ﷺ باليهود والنصارى.",
          "يمارس سلوكيات تعكس التعايش السلمي والاحترام مع الآخرين فِي مُجْتَمَعِهِ.",
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        title: "أم المؤمنين عائشةُ بِنْتُ أبي بكر رَضِيَ اللَّهُ عَنْهَا",
        bookFrom: 48,
        concepts: [
          "يتعَرَّفَ نسبَ أُمِّ المؤمنينَ عائشةَ رَضِيَ اللهُ عَنْهَا ومكانتَها عندَ النَّبيِّ عَليْهِ .",
          "يُحَدِّدَ أبرزَ مواقفِ حياتِها ودورَها في خِدْمَةِ الإسلام.",
          "يستخلصَ الدروسَ المستفادةَ من سيرتها.",
          "يقتديَ في سلوكياتِهِ بأمِّ المؤمنينَ عائشةَ رَضِيَ اللهُ عَنْهَا.",
        ],
      },
      {
        key: "2-7",
        ordinal: "السابع",
        title: "القِيَمُ وَالأَخْلَاقُ: المسلمُ عَفِيفُ اللِّسَانِ",
        bookFrom: 51,
        concepts: [
          "يستنتج معنى عَفَّة اللِّسَان وأهميتَهَا في الإسلام.",
          "يستخلص الدروس المستفادةَ من عَفَّة اللسان وأثرها على الفرد والمجتمع.",
          "يُحَدِّدَ صفات المسلم عفيف اللسان، ويعرفَ أمثلةً على ذلك من القرآن والسنة.",
          "يلتزم عَفَّةَ اللسان في تعاملاتِهِ اليوميّة.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدةُ الثَّالِثَةُ: التَّوحيدُ",
    bookFrom: 56,
    bookTo: 79,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "العقيدةُ: التَّوْحِيدُ أَسَاسُ الحُرِّيَّةِ",
        bookFrom: 57,
        concepts: [
          "يَتَعَرَّفَ صِفَاتِ اللَّهِ لِلدَّلَالَةِ عَلَى الْوَحْدَانِيَّةِ .",
          "يُؤْمِنَ بِجَمِيعِ الْأَنْبِيَاءِ .",
          "يَدُلَّ عَلَى وَحْدَانِيَّةِ اللَّهِ من القرآن الكريم .",
          "يُؤْمِنَ بِأَنَّ التَّقَرُّبَ إِلَى اللَّهِ يكون بامتثال أوامره .",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "القرآنُ والتفسيرُ: سورة (الجُمْعَةِ) (الآياتُ: ٩ – ١١) تِلاوة وحِفْظ وتَفْسِير",
        bookFrom: 60,
        concepts: [
          "يَتَعَرَّفَ نُبْذَةً عَنِ الْآيَاتِ ٩-١١ مِنْ سُورَةِ الْجُمُعَةِ وَأَحْكَامَ صَلَاةِ الْجُمُعَةِ.",
          "يَسْتَنْتِجَ مَعَانِيَ الْمَفْرَدَاتِ الْأَسَاسِيَّةِ فِي هَذِهِ الْآيَاتِ.",
          "يَسْتَخْلِصَ الدُّرُوسَ الْمُسْتَفَادَةَ، خَاصَّةً فِي أَهَمِّيَّةِ ذِكْرِ اللَّهِ وَالتَّحْذِيرِ مِنَ الِانْشِغَالِ بِالدُّنْيَا.",
          "يُظْهِرَ سُلُوكِيَاتِ تَعَكُّسُ الْحِرْصَ عَلَى صَلَاةِ الْجُمُعَةِ وَتَقْدِيمَ طَاعَةِ اللَّهِ عَلَى الدُّنْيَا.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "من أحكام التجويد من أحكام النون الساكنة والتنوين (الإقلاب والإخفاءُ)",
        bookFrom: 63,
        concepts: [
          "يُعرِّف الإِقْلاب والإخفاء تعريفًا صحيحًا.",
          "يفرّق بين الإقلاب والإخفاء من حيث الحُكْم والأَدَاء.",
          "يميّز كلا من الحُكْمَيْن في التلاوة.",
          "يُطبّق النطق الصحيح لهذين الحُكْمَيْن عند التلاوة.",
          "يتجنّب الأخطاء الشائعة في نطق التنوين قبل الحروف المناسبة.",
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        title: "العباداتُ: من أحكام الصيام",
        bookFrom: 65,
        concepts: [
          "يبين شروط وجوب الصوم وشروط صحَّته.",
          "يشرح أحكام قضاء الصوم والفدية.",
          "يميز المفطرات الحديثة وأحكامها (كالحقنة، والتبرع بالدم، وعلاج الأسنان، والروائح).",
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        title: "السِّيَرُ والشخصيات: أحداث السنتين السابعة والثامنة للهجرة",
        bookFrom: 69,
        concepts: [
          "يُعدّد أهم أحداث السنتين السابعة والثامنة للهجرة.",
          "يستنتج أثر تلك الأحداث في انتشار الإسلام.",
          "يقتدي بحكمة النُّبيّ الله في تعامله مع الأعداء والحلفاء.",
          "يربط بين أحداث السيرة وواقعنا المعاصر في الثبات والعمل والتخطيط.",
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        title: "أم المؤمنين أُمُّ سَلَمَةَ رضيَ عنها",
        bookFrom: 72,
        concepts: [
          "يَتَعَرَّفَ نَسَبَ أُمِّ سَلَمَةَ رضيَ عنها وَنَشْأَتَهَا.",
          "يَقْتَدِيَ بِصَبْرِهَا وَثَبَاتِهَا وَإِيمَانِهَا.",
          "يُحَدِّدَ أَبْرَزَ مَوَاقِفَهَا فِي الْإِسْلَامِ وَحِكْمَتَهَا فِي النَّصِيحَةِ والرَّأْيِ.",
          "يُقَدِّرَ دَوْرَ الْمَرْأَةِ الصَّالِحَةِ فِي نُصْرَةِ الْإِسْلَامِ.",
        ],
      },
      {
        key: "3-7",
        ordinal: "السابع",
        title: "القِيَمُ وَالأَخْلَاقُ: المُسْلِمُ مُتَسَامِحٌ مع الآخَرِ",
        bookFrom: 75,
        concepts: [
          "يُعَرِّفَ معنى التسامح ومكانته في الإسلام.",
          "يَسْتَدِلَّ من القرآن والسنة على وجوب التسامح.",
          "يُفَرِّقَ بين التسامح والضعف، والتسامح والتمييع.",
          "يَذْكُرَ نماذجَ من تَسَامُحِ النَّبِيِّ ﷺ مع الآخرين.",
          "يَتَحَلَّى بخُلُقِ التسامح في تعامله مع الآخرين.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the unit's first page for the unit's first
 * lesson (its opener rides with it), otherwise from the lesson's own first page;
 * down to the page before the next lesson starts, bounded by the unit's last
 * page (so «مراجعة على الوحدة» rides with the unit's last lesson).
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ISLAMIC_G8_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ISLAMIC_G8_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
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
  "islamic-p2-t1",
);

/**
 * The OCR provider answers a truly blank page with this sentence instead of an
 * empty string. It means "no text", not content, so verification treats it as
 * missing while `loadBookPage` still returns it verbatim.
 */
const NO_TEXT = "لا يوجد نص مكتوب في الصورة المرفقة";

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

/** True when a content page carries real text (not the blank-page placeholder). */
function pageHasText(book: number): boolean {
  const text = loadBookPage(book);
  return text.length > 0 && !text.includes(NO_TEXT);
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
// Self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"; // U+0660..U+0669
const EXT_AR_DIGITS = "۰۱۲۳۴۵۶۷۸۹"; // U+06F0..U+06F9

/**
 * Arabic-Indic digits → Latin. The scan mixes Eastern (٠–٩) and Extended
 * Arabic-Indic (۰–۹) digits from page to page, so both ranges are mapped; a
 * footer would otherwise compare unequal for a purely cosmetic reason.
 */
function toLatinDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(EXT_AR_DIGITS.indexOf(d)));
}

/**
 * The book number a content page prints in its running foot, or null when the
 * last line is not a running foot (unit openers and lesson heads print the unit
 * title instead). The foot is one number wrapped with either the unit title
 * («١٢ الوحدة الأولى: …») or the school title («الصف الثاني الإعدادي - الفصل
 * الدراسي الأول ٥»), or the number alone; the last line is accepted only when it
 * looks like one of those — a lone numeral or a line carrying «الوحدة»/«الصف» —
 * so a content line that merely ends in a number is not mistaken for the foot.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  const latin = toLatinDigits(last);
  const runs = latin.match(/\d{1,3}/g) ?? [];
  if (runs.length !== 1) return null;
  const looksLikeFoot = /^[\d\s]+$/.test(latin) || /الوحدة|الصف/.test(last);
  if (!looksLikeFoot) return null;
  return Number(runs[0]);
}

/**
 * Strips everything but letters and digits, so OCR spacing cannot break a match.
 * The «ﷺ» honorific ligature is dropped too, so a title like «أعمال الرسول ﷺ في
 * المدينة» and the head that prints the symbol between the two words still match.
 */
function normalize(text: string): string {
  return text.replace(/\uFDFA/g, "").replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ISLAMIC_G8_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (lesson.bookFrom <= unit.bookFrom || lesson.bookFrom > unit.bookTo) {
        problems.push(
          `الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق الوحدة ${unit.bookFrom + 1}–${unit.bookTo}`,
        );
      }
      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق الوحدة ${unit.bookFrom}–${unit.bookTo}`);
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
      problems.push(`فجوة صفحات بين ${unit.ordinal} و${nextUnit.ordinal}: ${unit.bookTo + 1}–${nextUnit.bookFrom - 1}`);
    }
  });

  const first = units[0];
  const last = units[units.length - 1];
  if (first && first.bookFrom !== EGYPT_ISLAMIC_G8_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_ISLAMIC_G8_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ISLAMIC_G8_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_ISLAMIC_G8_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the offset and proves the mapping page by page;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every lesson's own first page prints that lesson's title;
 *  4. every printed page in the book is owned by exactly one lesson — no page
 *     can fall between two lessons and be unreachable.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const ranges = allLessonRanges();
  let footersChecked = 0;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ISLAMIC_G8_T1_BOOK_START || book > EGYPT_ISLAMIC_G8_T1_BOOK_END) continue;
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
      footersChecked++;
      if (footer !== book) {
        problems.push(`صفحة الكتاب ${book}: الفوتر المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_ISLAMIC_G8_T1_BOOK_END - EGYPT_ISLAMIC_G8_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ISLAMIC_G8_T1_BOOK_START} و${EGYPT_ISLAMIC_G8_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its title.
  EGYPT_ISLAMIC_G8_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      if (!normalize(opener).includes(normalize(lesson.title))) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع عنوانه «${lesson.title}»`);
      }
    });
  });

  // 4. every printed page is owned by exactly one lesson.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}