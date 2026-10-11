// PHASE G8-chr — official Egypt Preparatory-2 (Grade 8) Christian Religious
// Education, first term («كتاب التلميذ»), Ministry 2026/2027 edition.
//
// The curriculum `eg-g8-christian-education` is rebuilt from the Ministry
// textbook `Christian_Education_Prep2_T1.pdf` (97 scan pages, all OCR'd). This
// module is the single source of truth for its structure: the three units
// («عناية الله بنا»، «الإيمان والطاعة»، «الإيمان في مواجهة التحديات») and their six
// lessons each, exactly as the book's unit openers print their «قائمة دروس
// الوحدة», and the «أهداف الدرس» the book prints at the head of every lesson.
//
// Page mapping (verified against the scan's footers):
//   bookPage = pdfPage − 1   (book page 7 = PDF page 8)
// Every content page prints its own book number bare in the running foot — in
// Arabic-Indic digits («١٦») or Latin («11») — which fixes the offset at 1. Five
// content pages print no footer: the three unit openers (their last line is the
// unit's lesson list), the unit-1 lesson-1 head page, and the golden-verses page
// (book 70); the other 85 content pages prove the mapping page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «الدرس»
// The book's printed index stops at the lesson (three units × six lessons); it
// has no «مفهوم» layer. So the app mirrors the book: unit → lesson. Each
// lesson's RAG document is the whole lesson (its pages, including the
// «الأنشطة والممارسات» and «أسئلة الدرس» blocks the book places at the end of it).
//
// WHY A LESSON'S RANGE INCLUDES ITS UNIT OPENER AND UNIT REVIEW
// Each unit opens with an opener page (title + «قائمة دروس الوحدة») and closes
// with «مراجعة على الوحدة»; the last unit also carries the «مراجعة عامة» of the
// first term (books 92–94) and the «تأملات روحية» divider (book 95). None of
// these is a lesson, so — exactly as the primary-6 and Prep-3 books do — the
// opener rides with the unit's first lesson and the review with its last.
// A lesson's own `bookFrom` is still stored; the range it owns is derived as
// "from the unit's first page, down to the page before the next lesson starts,
// bounded by the unit".
//
// WHY THE LESSON TITLE CHECK LOOKS AT THE LESSON'S PAGES, NOT ONLY ITS HEAD
// A Prep-2 lesson page prints its title in separate blocks — the category
// (e.g. «العقيدة»), then «الدرس N», then the topic. The title stored here is the
// full «category: topic» the unit opener's index shows; verification compares
// the topic after the first colon against the lesson's own pages (its head page
// normally carries it — lesson 3-3's scanned head drops a letter in «تكريس
// القلب» while the lesson body prints «تكريس» six times, which is why the check
// spans the lesson rather than the single head line).

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book page 7 = PDF 8). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the book's content — the opener of unit 1. */
export const EGYPT_CHRISTIAN_G8_T1_BOOK_START = 6;

/** Last printed content page — the «تأملات روحية» divider at the end of unit 3. */
export const EGYPT_CHRISTIAN_G8_T1_BOOK_END = 95;

/** One lesson (الدرس) of the textbook — becomes one lesson in the app tree. */
export interface ChristianG8T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
  ordinal: string;
  /**
   * Lesson title as the unit opener's index prints it, `category: topic`. The
   * lesson's own page prints the category and the topic as separate blocks, so
   * verification compares the topic after the first colon, not the whole title.
   */
  title: string;
  /**
   * First printed book page of the lesson itself. The range the lesson *owns*
   * also includes its unit's opener when it is the unit's first lesson, which is
   * why ownership is derived by `lessonBookRange` rather than stored here.
   */
  bookFrom: number;
  /**
   * The book's printed «أهداف الدرس» for this lesson (the only per-lesson list
   * the book prints; there is no «مفهوم»/«مكوّن» layer in this book).
   */
  concepts: string[];
}

export interface ChristianG8T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الثانية". */
  ordinal: string;
  /** Unit title as printed, e.g. "الوحدة الأولى: عناية الله بنا". */
  title: string;
  /** First printed page of the unit — its opener page. */
  bookFrom: number;
  /** Last printed page of the unit (the page before the next unit's opener). */
  bookTo: number;
  lessons: ChristianG8T1Lesson[];
}

/**
 * The three units of the first term with their eighteen lessons: unit/lesson
 * starts from each unit's opener page (6, 36, 63), objectives from each lesson's
 * first page. Verified against every printed page by `assertTreeMatchesTheBook`.
 */
export const EGYPT_CHRISTIAN_G8_T1_UNITS: ChristianG8T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: عناية الله بنا",
    bookFrom: 6,
    bookTo: 35,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "العقيدة: الختان والهيكل والمجوس",
        bookFrom: 7,
        concepts: [
          "يتعرف أن الله أرسل ابنه ليكون مخلصًا للبشرية كلها.",
          "يستنتج أن الرب يسوع أطاع الشريعة منذ طفولته.",
          "يتعرف أن المجوس من الأمم جاءوا ليسجدوا للرب يسوع، إعلانًا أن الخلاص للجميع.",
          "يدلل أن الشر (هيرودس) يقاوم خطة الله، لكن الله يحمي أولاده.",
          "يعبر عن ثقته بأن الله يحقق وعوده كما أعلن للأنبياء وللشعب.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "المحفوظات: (متى ٦ : ٢٥ - ٣٠) - بعض الآيات الذهبية",
        bookFrom: 12,
        concepts: [
          "يردد الآيات الدالة على عناية الله بالإنسان في كل الأوقات والأحوال.",
          "يتعرف المعاني والمفردات الصعبة وتوظيفها في فهم الآيات الكتابية.",
          "يحدد ثمار الروح كما جاءت في يردد بفهم الآيات.",
          "يسرد مواقف حياتية وظف بها بعض الآيات الكتابية.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "العبادة: الكنيسة عبر الزمن",
        bookFrom: 16,
        concepts: [
          "يشرح معنى كلمة \"كنيسة\" ذلك المكان الذي يجتمع فيه الله مع الإنسان.",
          "يتتبع تطور الكنيسة عبر العصور من جنة عدن حتى ملكوت السموات.",
          "يوضح أن كل مساكن العهد القديم كانت رموزًا لكنيسة العهد الجديد.",
          "يذكر كيف أسس الروح القدس الكنيسة في يوم الخمسين.",
          "يستنتج أن الفردوس صار مسكنا للأرواح البارة بعد موت المسيح.",
          "يعبر عن اشتياقه إلى الكنيسة السماوية (ملكوت السموات) حيث السعادة الأبدية مع الله.",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "شخصيات كتابية: موسي والخروج",
        bookFrom: 22,
        concepts: [
          "يدلل أن الله يستطيع أن يحفظ أولاده مهما كانت الظروف صعبة.",
          "يوضح كيف استخدم الله موسى ليخرج شعبه من أرض مصر.",
          "يتعرف أن الطاعة لله تقود إلى الحرية والخلاص.",
          "يستنتج خطورة العصيان والتذمر كما حدث مع بني إسرائيل في البرية.",
          "يعبر عن اقتدائه بشجاعة مريم وأمانة هارون في مساندة موسى.",
          "يعطى أمثلة على أن الله أمين في وعوده، يقود أولاده حتى يصلوا إلى الملكوت",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "شخصيات تاريخية: الإستشهاد في المسيحية",
        bookFrom: 26,
        concepts: [
          "يتعرف أن \"شهيدًا\" يعنى شاهدًا للمسيح بحَيَاتِهِ وأعمالِهِ ودَمِهِ.",
          "يَستنتجُ مَكانةَ الشّهداءِ العظيمة في الكنيسةِ.",
          "يعبر عن اعتزازه بانتمائه للكنيسةِ التي لُقّبت بـ \"أُمّ الشُّهَدَاءِ\".",
          "يَتَعَرَّفُ أسبابَ اضطهادِ الرُّومانِ للمسيحيّينَ.",
          "يدلل على أنه شاهدٌ للمسيح في حياتِهِ اليوميّةِ.",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "القيم والأخلاق: تهذيب النفس",
        bookFrom: 31,
        concepts: [
          "يتعرف أن ضبط اللسان يحفظ الإنسان من فقدان بركات كثيرة.",
          "يستنتج أنَّ الهروب من الخطيئة هو شجاعة وليس ضعفًا.",
          "يدلل على أن المثابرة والانضباط هما مفتاح النجاح.",
          "يشرح كيف ان التواضع هو طريق الإنتصار الحقيقي.",
          "يتعرف أن تقديس الفكر هو أساس حياة طاهرة ومقدسة.",
          "يحدد خطوات عملية بحياته اليومية لتهذيب النفس .",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: الإيمان والطاعة",
    bookFrom: 36,
    bookTo: 62,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        title: "العقيدة: الهروب إلى أرض مصر",
        bookFrom: 37,
        concepts: [
          "يتعرّف أحداث رحلة العائلة المقدسة إلى مصر.",
          "يستنتج أنّ الله يُحوّل الألم والضيقات إلى بركة وخير عظيم.",
          "يدلل على طاعة مريم ويوسف لكلمة الله رغم الصعوبات.",
          "يقتدي بيوسف النجار في الطاعة السريعة لصوت الله.",
          "يؤكد أنّ الرب يسوع هو المخلّص الذي جاء إلى العالم.",
          "يعبر عن شكره لله لأنه جعل أرض مصر مباركة بزيارة السيد المسيح لها.",
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        title: "المحفوظات: (متى ٦ : ٣٠ - ٣٤) - (متى ٧ : ١ - ٥) - بعض الآيات الذهبية",
        bookFrom: 42,
        concepts: [
          "يتعرف يردد الآيات الكتابية بفهم ويشرح معاني كلماتها",
          "يعبر عن ثقته في رعاية الله واهتمامه به أكثر من كل المخلوقات .",
          "يضع خطة لمواجهة القلق المفرط تجاه احتياجاته اليومية بالثقة في الله .",
          "يطلب ملكوت الله أولًا ويجعل مشيئة الله أولوية في حياته.",
          "يسرد موقف حياتي يوضح الاعتماد على الله في تلبية احتياجاته.",
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        title: "العبادة: توبة أغسطينوس",
        bookFrom: 46,
        concepts: [
          "يلخص أهم الأحداث حياة أغسطينوس .",
          "يتعرف على دور والدة أغسطينوس في توبته.",
          "يشرح أثر الصلاة في تغيير حياة الإنسان.",
          "يستنتج أن الأصدقاء الأشرار يقودون الإنسان للخطية.",
          "يستنتج أن لا أحد بعيد عن خلاص الله، مهما كانت خطاياهُ كبيرةً.",
          "يقتدي بالقديس أغسطينوس في التوبة الصادقة التي تغير حياة الإنسان كلها.",
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        title: "شخصيات كتابية: يشوع والميراث",
        bookFrom: 50,
        concepts: [
          "يتعرف قوة الطاعة لكلمة الله وبركاتها.",
          "يعبر عن ثقته بأن الله قادر أن يصنع معجزات فوق الطبيعة.",
          "يدلل على أن الإيمان يقود إلى النصرة، بينما الشك يقود إلى الهزيمة.",
          "يستنتج أن القائد الروحي الحقيقي هو الذي يتكل على الله، لا على قوته الشخصية.",
          "يقيم نفسه في ضوء قيمتى الأمانة والرحمة كما فعلت راحاب.",
        ],
      },
      {
        key: "2-5",
        ordinal: "الخامس",
        title: "شخصيات تاريخية: رحلة مع الشهداء",
        bookFrom: 54,
        concepts: [
          "يَذكُر كيف كان الرّب يسوع يُقوّي الشّهداء ويُعَزّيهم.",
          "يَستنتج أن المُعجزات كانت علامة على قُوّة الله العاملة مع المؤمنين.",
          "يدلل على دور الكنيسة في الصلاة من أجل أولادها وقت الاضطهاد.",
          "يشرح الأشكال المتعددة للشهادة (الطّهارة، الإيمان، الدفاع عن العقيدة).",
          "يميز بين \"الشهادة البيضاء\" و\"الشهادة الحمراء\".",
          "يقتدي بمحبة المسيحيين الأوائل الذين ضَحّوا بحياتهم من أجل الآخرين.",
          "يسرد موقفًا حياتيًا يوضح أنه شاهدًا للمسيح",
        ],
      },
      {
        key: "2-6",
        ordinal: "السادس",
        title: "القيم والأخلاق: عفة اللسان - أبيجايل",
        bookFrom: 58,
        concepts: [
          "يتعرف أن عفة اللسان والكلمة اللينة تطفئ الغضب.",
          "يثمن دور أبيجايل في منع داود من الانتقام.",
          "يدلل على أن الله يستخدم أشخاصًا ضعفاء ليصنعوا عملًا عظيمًا.",
          "يستنتج أن الانتقام للذات لا يُرضي الله، وأنه يبارك من يترك الأمر له.",
          "يؤيد أن الكلمه الحكيمة تحفظ البيت والأسرة من الخراب والهلاك.",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: الإيمان في مواجهة التحديات",
    bookFrom: 63,
    bookTo: 95,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        title: "العقيدة: من مصر إلى برية الأردن",
        bookFrom: 64,
        concepts: [
          "يوضح كيف حمى الله الطفل يسوع من خطر هيرودس.",
          "يفسر المقصود بـ \"كان يسوع ينمو في الحكمة والقامات والنعمة عند الله والناس\".",
          "يفسر سبب معمودية الرب يسوع على يد يوحنا رغم أنه بلا خطية.",
          "يشرح ردود الرب يسوع على تجارب إبليس في البرية.",
          "يعبر عن إيمانه بأن يسوع هو ابن الله الذي أُرسل لخلاص العالم.",
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        title: "المحفوظات: (متى ٧ : ٧ - ١٢) - بعض الآيات الذهبية",
        bookFrom: 69,
        concepts: [
          "يردد الآيات بفهم.",
          "يشرح معاني الكلمات الأساسية الواردة بالآيات.",
          "يربط بين الصور الرمزية والآيات.",
          "يطبق عمليًا ما جاء بالآيات من مبادئ في حياته اليومية.",
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        title: "العبادة: تكريس القلب وتحديات العصر",
        bookFrom: 72,
        concepts: [
          "يميّز بين الاستخدام الجيد والسيئ للتكنولوجيا ووسائل التواصل الاجتماعي.",
          "يعبر عن أهمية فضيلة \"الحكمة والإفراز\" في تكريس قلبه لله.",
          "يقترح اساليب للحفاظ على قلبه دون الانشغال بأفكار خاطئة مضللة.",
          "يقترح معايير لتقييم صداقاته الرقمية ويتجنب التفاعل مع الغرباء على الإنترنت.",
          "يثمن دور الكنيسة في إرشاده وتكريس قلبه لله وسط تحديات العصر الرقمي.",
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        title: "شخصيات كتابية: قضاة بني إسرائيل (قضاة ٢ - ٢١)",
        bookFrom: 78,
        concepts: [
          "يقارن بين يشوع ودبورة وشمشون ويفتاح وصموئيل من حيث الأمانة لله.",
          "يدلل على أن الله أمين في وعوده مهما تغيّر الناس.",
          "يشرح خطورة تقليد عادات الأمم والابتعاد عن عبادة الله.",
          "يستنتج أن الله قادر أن يستخدم أشخاصًا ضعفاء لينجز بهم أعمالًا عظيمة.",
          "يستنتج أن التهاون في وصايا الله يؤدي إلى الانكسار والخسارة .",
        ],
      },
      {
        key: "3-5",
        ordinal: "الخامس",
        title: "شخصيات تاريخية: بطولات الشهداء",
        bookFrom: 82,
        concepts: [
          "يتعرف أن الاستشهاد علامة حب المسيحي الحقيقي للمسيح.",
          "يتعرف نماذج متنوعة من الشهداء عبر التاريخ",
          "يستنتج أن عصر الاستشهاد لم ينتهِ، والكنيسة مازالت تقدم شهداء حتى اليوم.",
          "يميز بين الشهادة بالدم والشهادة بالحياة اليومية (الشهيد الأحمر والشهيد الأبيض).",
          "يعبر عن شجاعته في مواجهة التحديات الصغيرة اليومية مثل قول الحق ورفض الخطية.",
          "يضع خطة للالتزام بالصلاة والتسبيح والتمسك بالصليب كقوة للحياة المسيحية.",
        ],
      },
      {
        key: "3-6",
        ordinal: "السادس",
        title: "القيم والأخلاق: التسامح ونبذ العنف",
        bookFrom: 87,
        concepts: [
          "يتعرف تعاليم السيد المسيح والتي ترفض العنف بالمحبة والغفران.",
          "يرفض استخدام العنف، مقتديًا بالسيد المسيح في بستان جثسيماني.",
          "يتأمل في محبة السيد المسيح على الصليب وغفرانه لصالبييه.",
          "يقتدي بتغيّر التلاميذ بعد حلول الروح القدس، وكيف صاروا دعاة للسلام.",
          "يدلل على تطبيقه لوصية الكتاب: «اغلب الشر بالخير» بحياته اليومية.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the unit's opener (for the unit's first
 * lesson) or its own start page, up to the page before the next lesson starts,
 * or the unit's last page for its last lesson. Deriving the end this way keeps
 * the unit opener and each lesson's activity block inside the lesson they
 * belong to — and lands the unit review on the last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_CHRISTIAN_G8_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_CHRISTIAN_G8_T1_UNITS.forEach((unit, ui) => {
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
  "christian-p2-t1",
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
// PHASE G8-chr — self-checks
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EXT_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/**
 * Arabic-Indic («١٦») and Extended Arabic-Indic («۸») digits → Latin, so a printed
 * footer can be compared to a number. The OCR mixes both digit systems — scans
 * of some pages render «۹», «۷۸», «۸۷» — so a reader must accept either.
 */
function toLatinDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EXT_DIGITS.indexOf(d)));
}

/**
 * Removes Arabic combining marks (fatha, damma, shadda, …). OCR sometimes
 * returns a fully vocalised line («مِنْ مِصْرَ إِلَى بَرِيَّةِ الْأُرْدُنِّ»), which
 * would otherwise defeat the footer and title tests.
 */
function stripArabicMarks(text: string): string {
  return text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
}

/**
 * The book number a content page prints in its running foot, or null when the
 * last line is not a footer. This book's foot is the page number alone, bare in
 * either digit system («١٦» or «11»), so a last line of pure digits is a footer.
 * Five pages print none: the three unit openers (whose last line is the unit's
 * lesson list), the unit-1 lesson-1 head page, and lesson 3-2's golden-verses
 * page — plus the book's colophon outside the content range.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const last = stripArabicMarks(lines[lines.length - 1] ?? "");
  const latin = toLatinDigits(last);
  if (!/^\d+$/.test(latin)) return null;
  return Number(latin);
}

/**
 * Strips everything but letters and digits, then folds the letter variants OCR
 * and typography introduce (hamza forms → ا, alef maqsura → ي, ta marbuta → ه),
 * so spacing, vocalisation or a spelling variant cannot break a title match.
 */
function normalize(text: string): string {
  return text
    .replace(/[\u0622\u0623\u0625\u0627\u0671]/g, "\u0627")
    .replace(/[\u0649\u06CC]/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0640/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * The topic half of a lesson's `category: topic` title — what a Prep-2 lesson
 * page actually prints. A title with no colon is returned whole.
 */
export function lessonTopic(title: string): string {
  const colon = title.indexOf(":");
  return (colon >= 0 ? title.slice(colon + 1) : title).trim();
}

/** Normalized word tokens of a text: marks stripped, letter variants folded. */
function words(text: string): string[] {
  return stripArabicMarks(text)
    .split(/[^\p{L}\p{N}]+/u)
    .map((w) => normalize(w))
    .filter(Boolean);
}

/**
 * OCR-tolerant word equality: identical, or the page simply dropped one letter
 * of the printed word (the scan of lesson 3-3's head prints «تكرس» where the
 * body prints «تكريس»). Anything more different is a real mismatch.
 */
function fuzzyEqual(a: string, b: string): boolean {
  if (a === b) return true;
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  if (long.length !== short.length + 1) return false;
  let j = 0;
  for (let i = 0; i < long.length && j < short.length; i++) {
    if (long[i] === short[j]) j++;
  }
  return j === short.length;
}

/**
 * True when the topic's words appear in order inside the page text. This is the
 * fallback for a contiguous-match miss: the OCR occasionally embeds «<br>» tags
 * into a flowing line (splitting «(متى ٦ : ٢٥ - ٣٠)» from «بعض الآيات الذهبية»),
 * which would otherwise defeat a single-string comparison.
 */
export function topicWordsInOrder(topic: string, pageText: string): boolean {
  const tw = words(topic);
  const pw = words(pageText);
  let j = 0;
  for (let i = 0; i < pw.length && j < tw.length; i++) {
    const pageWord = pw[i];
    const topicWord = tw[j];
    if (pageWord && topicWord && fuzzyEqual(pageWord, topicWord)) j++;
  }
  return j === tw.length;
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first unit
 * starts where the contents page says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_CHRISTIAN_G8_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_CHRISTIAN_G8_T1_BOOK_START) {
    problems.push(
      `الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_CHRISTIAN_G8_T1_BOOK_START}، وجدنا ${first.bookFrom}`,
    );
  }
  if (last && last.bookTo !== EGYPT_CHRISTIAN_G8_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_CHRISTIAN_G8_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number — this is
 *     what fixes the offset and proves the mapping page by page;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every lesson's own pages print that lesson's topic (the half after the
 *     first colon of its `category: topic` title; its head page normally carries
 *     it, and the scan of lesson 3-3's head drops a letter that its body prints
 *     correctly, so the whole lesson span is checked);
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
    if (book < EGYPT_CHRISTIAN_G8_T1_BOOK_START || book > EGYPT_CHRISTIAN_G8_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_CHRISTIAN_G8_T1_BOOK_END - EGYPT_CHRISTIAN_G8_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_CHRISTIAN_G8_T1_BOOK_START} و${EGYPT_CHRISTIAN_G8_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own pages print that lesson's topic.
  EGYPT_CHRISTIAN_G8_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { to } = lessonBookRange(ui, li);
      const ownPages = loadBookRange(lesson.bookFrom, to);
      if (!ownPages) {
        problems.push(`الدرس ${lesson.key}: صفحاته ${lesson.bookFrom}–${to} بلا نص OCR`);
        return;
      }
      const topic = lessonTopic(lesson.title);
      const printed =
        normalize(ownPages).includes(normalize(topic)) || topicWordsInOrder(topic, ownPages);
      if (!printed) {
        problems.push(`الدرس ${lesson.key}: صفحاته ${lesson.bookFrom}–${to} لا تطبع عنوانه «${topic}»`);
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