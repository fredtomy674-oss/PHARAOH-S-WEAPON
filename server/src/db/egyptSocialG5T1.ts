// PHASE — official Egypt Primary-5 (Grade 5) Social Studies
// («الدراسات الاجتماعية — الصف الخامس الابتدائي»), first term.
//
// The curriculum tree for the Egypt `eg-g5-social` curriculum is rebuilt from
// the Ministry textbook (98 scanned pages, first term only). This module is the
// single source of truth for the FIRST term: the three units of the first term
// plus the general review (exactly as the book's own «المحتويات» on scan 4
// lists them) and, for every lesson, the book's own printed «أهداف الدرس» —
// verbatim, as on the lesson's first page («في نهاية هذا الدرس، سأكون قادرًا
// على أن: …»). The self-checks at the bottom prove that mapping against the
// OCR itself, page by page.
//
// THE OFFSET IS +1 — book page N = scan page N + 1
// Every content page that carries a folio prints it as its FIRST line, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here: scan 9
// prints «8» (book 8), scan 15 prints «14» (book 14), scan 41 prints «40»
// (book 40), scan 69 prints «68» (book 68) and scan 95 prints «94» (book 94).
// Five «تدريبات الدرس» pages (books 20، 44، 74، 81) and the second-unit
// assessment head (book 64) print the folio as their SECOND line instead,
// behind their own head; book 57 prints its folio glued into its running head
// («الفصل الدراسي الأول 57 … 57»); and the opening review page (book 93)
// prints its folio as its LAST line. `footerCandidates` reads exactly those
// positions, so every other term page yields exactly its own single number and
// `FOOTER_OCR_MISREADS` is empty.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–6 are before the term: the cover (1, no text layer), the
// credits masthead (2), the «مقدمة» (3), the printed «المحتويات» (4) and the
// two-page curriculum map (5–6). Scan pages 97–98 are after the term: the
// (empty) back cover. The term runs from the unit 1 opener (book 6 = scan 7)
// to the last general-review page (book 95 = scan 96):
// `EGYPT_SOCIAL_G5_T1_BOOK_START` / `_END` are exactly those two pages, and
// the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 95 − 6 + 1 = 90 minus `MISSING_SCANS`.
//
// THREE TERM PAGES HAVE NO TEXT LAYER AT ALL
// Books 7، 39، 67 (scans 8، 40، 68) are zero-byte files: each is the full-page
// photo verso facing its unit's opener spread and carries no text layer, so no
// folio and no head can be read from it. Rather than weaken the page-number
// check, these three are listed in `MISSING_SCANS` and skipped by the folio
// proof; they stay owned by their unit's first lesson range, exactly as the
// Discovery spec keeps its missing pages inside their owning lesson.
//
// THREE UNIT OPENERS PRINT NO FOLIO BY DESIGN
// The three unit openers (books 6، 38، 66) print no folio at all — each lists
// its unit's lessons under «دروس الوحدة» instead. Rather than weaken the
// page-number check, these three are exempt from it and anchored on the
// «دروس الوحدة» head each really prints, named in `FOLIO_LESS_ANCHORS`.
// Every other OCR'd term page's head (or, for book 93, foot) is its own bare
// folio, verified mechanically.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED «أهداف الدرس»
// Every first-term lesson prints its objectives on its first page — four items
// (lessons 1-1، 1-4، 2-2، 3-1، 3-2) or five (lessons 1-2، 1-3، 2-1، 2-3،
// 2-4، 3-3). Every item is carried byte-verbatim as a concept of that lesson,
// keeping the text layer's own visual-order quirks honest rather than
// reconstructed (split words such as «ي أم … ِز» for «أميز», «د أح … ِد» for
// «أحدد», «س أف … ِر» for «أفسر»). Lesson 2-4's items carry the printed «•»
// bullet, which is omitted here exactly as the English spec omits exercise
// numerals — the folded comparison ignores it either way.
//
// THE GENERAL REVIEW IS ITS OWN SECTION
// «مراجعة عامة على الفصل الدراسي الأول» (book pages 93–95) is not part of
// unit 3: it carries its own running head, and it is a different kind of page
// — a bank of review questions («السؤال الأول» … «السؤال السابع»). Folding it
// into unit 3's last lesson would hand the tutor pages that jump from national
// projects to exam questions under one lesson heading, so it stands as its own
// section with a single lesson, and its `concepts` are the seven question
// instructions the pages actually print (kind «سؤال»).
//
// THE UNIT ASSESSMENTS RIDE WITH THE LAST LESSON
// The «تقييم الوحدة» pages (books 36–37، 64–65، 91–92) and the closing
// «النشاط الختامي للوحدة» are not lessons — the contents lists them with •
// bullets — and stay inside the owning unit's last lesson range, exactly as
// the Grade-8 social spec keeps its unit assessments inside its last lesson.
// The unit opener likewise rides with its unit's first lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 1 (verified: book p.68 = scan p.69). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed page of the term — the unit 1 opener (scan 7). */
export const EGYPT_SOCIAL_G5_T1_BOOK_START = 6;

/** Last printed page of the term — the last general-review page (scan 96). */
export const EGYPT_SOCIAL_G5_T1_BOOK_END = 95;

/** The scanned pages before the term: cover, credits, مقدمة, محتويات, curriculum map. */
export const EGYPT_SOCIAL_G5_T1_FRONT_MATTER = { from: 1, to: 6 } as const;

/** The scanned pages after the term: the (empty) back cover. */
export const EGYPT_SOCIAL_G5_T1_BACK_MATTER = { from: 97, to: 98 } as const;

/**
 * The term pages with no usable OCR, as book pages. Books 7، 39، 67 (scans 8،
 * 40، 68) are zero-byte files — each is the full-page photo verso of its
 * unit's opener spread and carries no text layer. Each exists in the book and
 * is still owned by exactly one lesson (its unit's first lesson range), but no
 * folio and no head can be read from it, so the folio proof skips it and
 * `pagesChecked` is the full term range minus these three.
 */
export const MISSING_SCANS: readonly number[] = [7, 39, 67];

/** One printed objective of a lesson — becomes one concept in the app tree. */
export interface SocialG5T1Concept {
  /** Printed book page where this objective starts (the lesson's first page). */
  bookFrom: number;
  /** The printed component kind: «هدف», or «سؤال» for the review. */
  kind: string;
  /** The printed objective (or question instruction), verbatim. */
  title: string;
}

/** One lesson («درس») of the first term, as the «المحتويات» lists it. */
export interface SocialG5T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". Empty for the review. */
  ordinal: string;
  /** The lesson's opening component type — its first concept's kind. */
  type: string;
  /** Lesson title as printed at the head of the lesson (without the number prefix). */
  title: string;
  /** The string the lesson's own first page must print (checked before seeding). */
  printedHead: string;
  /** First printed page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed «أهداف الدرس» for this lesson, in order. */
  concepts: SocialG5T1Concept[];
  /**
   * Book-wide appendix pages this lesson points to. This book has no appendix:
   * every page of the term belongs to a unit. Kept so the module shares the
   * shape of the other Egyptian specs.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — one of the three units, or the general review. */
export interface SocialG5T1Unit {
  /** This book's sections are its units (the review stands as its own). */
  kind: "unit";
  /** Internal key: "1"…"4". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". Empty for the review. */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: مصر موقع متميز وطبيعة متنوعة". */
  title: string;
  /** The unit head the opener page prints, e.g. "الوحدة األولى". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: SocialG5T1Lesson[];
}

const TYPE = "هدف";
const REVIEW_TYPE = "سؤال";

function concept(bookFrom: number, kind: string, title: string): SocialG5T1Concept {
  return { bookFrom, kind, title };
}

/**
 * The three units of the first term plus the general review, with their
 * printed lessons and every printed «أهداف الدرس» item, transcribed from the
 * first page of each lesson and checked by `assertTreeMatchesTheBook` before
 * seeding.
 *
 * Unit/lesson starts come from the book's «المحتويات» (scan 4); each lesson's
 * concepts are the objective lines the book prints on the page the lesson
 * starts on, kept byte-verbatim (see the header comment for the text layer's
 * own visual-order quirks), each with `bookFrom` set to that first page. The
 * review's concepts are its seven printed question instructions.
 */
export const EGYPT_SOCIAL_G5_T1_UNITS: SocialG5T1Unit[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: مصر موقع متميز وطبيعة متنوعة",
    printedHead: "الوحدة األولى",
    bookFrom: 6,
    bookTo: 37,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "موقع مصر الفلكي",
        printedHead: "موقع مصر الفلكي",
        bookFrom: 8,
        concepts: [
          concept(8, TYPE, "ِز بين خطوط الطول ودوائر العرض من حيث التعريف واȖستخدامات. ي أم"),
          concept(8, TYPE, "أقارن بين توقيت مصر ودول أخرى باستخدام خطوط الطول."),
          concept(8, TYPE, "ِد موقع مصر الفلكي على الخريطة بدقة. د أح"),
          concept(8, TYPE, "ِر تأثير الموقع الفلكي على المناخ والزمن. س أف"),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "مظاهر سطح مصر",
        printedHead: "مظاهر سطح مصر",
        bookFrom: 14,
        concepts: [
          concept(14, TYPE, "أقارن بين اȚقسام الرئيسية لسطح مصر."),
          concept(14, TYPE, "أحدِد مواقع بعض مظاهر سطح مصر."),
          concept(14, TYPE, "أربط بين مظاهر سطح مصر وعوامل تشكيلها."),
          concept(14, TYPE, "أشرح العوامل الطبيعية التي أدت إلى تنوع مظاهر السطح."),
          concept(14, TYPE, "ُع مظاهر سطح مصر. و في تن ) ( يري لعظمة الله د ِر عن تق ب أع"),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "مناخ مصر",
        printedHead: "مناخ مصر",
        bookFrom: 22,
        concepts: [
          concept(22, TYPE, "أقارن بين الطقس والمناخ."),
          concept(22, TYPE, "أستنتج العوامل المؤثرة في مناخ مصر."),
          concept(22, TYPE, "أصف مناخ مصر خȗل فصول السنة اȚربعة."),
          concept(22, TYPE, "أحدِد اȚقاليم المناخية على خريطة مصر."),
          concept(22, TYPE, "في تنوع خصائص اȚقاليم المناخية. ) ( يري عظمة الخالق د أعبِر عن تق"),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "النباتات الطبيعية والحيوانات البرية",
        printedHead: "النباتات الطبيعية والحيوانات البرية",
        bookFrom: 30,
        concepts: [
          concept(30, TYPE, "أحدِد المقصود بالنباتات الطبيعية والحيوانات البرية."),
          concept(30, TYPE, "أربط بين نوع البيئة والنباتات الطبيعية والحيوانات البرية التي تعيش فيها."),
          concept(30, TYPE, "أفسِر أهمية النباتات الطبيعية والحيوانات البرية."),
          concept(30, TYPE, "أستنتج اȚخطار التي تتعرض لها النباتات الطبيعية والحيوانات البرية."),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: الحضارة المصرية القديمة",
    printedHead: "الوحدة الثانية",
    bookFrom: 38,
    bookTo: 65,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "عوامل قيام الحضارة المصرية القديمة",
        printedHead: "عوامل قيام الحضارة المصرية القديمة",
        bookFrom: 40,
        concepts: [
          concept(40, TYPE, "ِز بين العوامل الطبيعية والبشرية لقيام الحضارة المصرية القديمة. ي أم"),
          concept(40, TYPE, "ألخص تأثير العوامل الطبيعية على قيام الحضارة المصرية القديمة."),
          concept(40, TYPE, "ِر عن تقديري جهود المصريين القدماء في بناء حضارتهم. ب أع"),
          concept(40, TYPE, "أوضح تأثير اȖستقرار السياسي على الحضارة المصرية القديمة."),
          concept(40, TYPE, "ُز الحضارة المصرية القديمة عن الحضارات اȚخرى. ي ِر أسباب تم س أف"),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "حياة المصري القديم «عصور ما قبل التاريخ»",
        printedHead: "حياة المصري القديم «عصور ما قبل التاريخ»",
        bookFrom: 46,
        concepts: [
          concept(46, TYPE, "أوضح المقصود بعصور ما قبل التاريخ."),
          concept(46, TYPE, "أتتبع التسلسل الزمني لنشأة الحضارة المصرية القديمة."),
          concept(46, TYPE, "َف أهم اȚنشطة التي مارسها المصري القديم في عصور ما قبل التاريخ. ر أتع"),
          concept(46, TYPE, "ِر عن تقديري لدور الحضارة المصرية القديمة في العالم. ب أع"),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "حياة المصري القديم «العصور التاريخية»",
        printedHead: "حياة المصري القديم «العصور التاريخية»",
        bookFrom: 52,
        concepts: [
          concept(52, TYPE, "أحدِد أهم خصائص العصر العتيق."),
          concept(52, TYPE, "يثة. د يمة والوسطى والح د ولة الق د ِز بين إنجازات ملوك ال ي أم"),
          concept(52, TYPE, "ِر أسباب غزو الهكسوس لمصر. س أف"),
          concept(52, TYPE, "ولة الوسطى. د أشرح أهمية المشروعات اȖقتصادية التي تمت في عصر ال"),
          concept(52, TYPE, "ًا عن مصر. ع يثة دفا د ولة الح د أقدِم نماذج للحروب التي خاضها الجيش المصري في ال"),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "مصر في عصري البطالمة والرومان",
        printedHead: "مصر في عصري البطالمة والرومان",
        bookFrom: 58,
        concepts: [
          concept(58, TYPE, "ِر سبب اهتمام اȜسكندر اȚكبر بالسيطرة على مصر. س أف"),
          concept(58, TYPE, "أوضح بعض مظاهر الحياة الثقافية في مصر في عصري البطالمة والرومان."),
          concept(58, TYPE, "أقارن بين خصائص الحياة اȖقتصادية في مصر تحت حكم البطالمة والرومان."),
          concept(58, TYPE, "أقارن بين أسباب سقوط دولة البطالمة ودولة الرومان."),
          concept(58, TYPE, "ِر سبب ترحيب المصريين بالفتح اȜسȗمي. س أف"),
        ],
      },
    ],
  },
  {
    key: "3",
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: كنوز مصر",
    printedHead: "الوحدة الثالثة",
    bookFrom: 66,
    bookTo: 92,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الثروة المعدنية ومصادر الطاقة",
        printedHead: "الثروة المعدنية ومصادر الطاقة",
        bookFrom: 68,
        concepts: [
          concept(68, TYPE, "أوزِع بعض مناطق استخراج المعادن وإنتاج الطاقة على خريطة مصر."),
          concept(68, TYPE, "ِز بين مصادر الطاقة المتجددة وغير المتجددة. ي أم"),
          concept(68, TYPE, "أستنتج اȚهمية اȖقتصادية لبعض المعادن ومصادر الطاقة في مصر."),
          concept(68, TYPE, "ِر عن تقديري لدور الدولة واȚفراد في تنمية الثروات المعدنية ومصادر الطاقة. ب أع"),
        ],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "موارد المياه",
        printedHead: "موارد المياه",
        bookFrom: 76,
        concepts: [
          concept(76, TYPE, "ِز بين المياه المالحة والعذبة في مصر. ي أم"),
          concept(76, TYPE, "أوضِح استخدامات المياه في مصر."),
          concept(76, TYPE, "أفسِر أسباب مشكȗت المياه في مصر."),
          concept(76, TYPE, "ِر جهود الدولة للتغلب على مشكȗت المياه. د أق"),
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "المشروعات القومية (رؤية مصر للمستقبل)",
        printedHead: "المشروعات القومية (رؤية مصر للمستقبل)",
        bookFrom: 83,
        concepts: [
          concept(83, TYPE, "ودورها في التنمية المستدامة. أتعرف رؤية مصر"),
          concept(83, TYPE, "ِد بعض المشروعات القومية التي تقوم بها الدولة في مختلف المجاȖت. د أح"),
          concept(83, TYPE, "أوضح أثر المشروعات القومية على حياة المواطنين."),
          concept(83, TYPE, "ِر جهود الدولة في تنفيذ المشروعات القومية. د أق"),
          concept(83, TYPE, "أقترح فكرة مشروع قومي لتحسين جودة الحياة في محافظتي."),
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    ordinal: "",
    title: "مراجعة عامة على الفصل الدراسي اﻷول",
    printedHead: "مراجعة عامة على الفصل الدراسي اﻷول",
    bookFrom: 93,
    bookTo: 95,
    lessons: [
      {
        key: "4-1",
        ordinal: "",
        type: REVIEW_TYPE,
        title: "مراجعة عامة على الفصل الدراسي اﻷول",
        printedHead: "مراجعة عامة على الفصل الدراسي اﻷول",
        bookFrom: 93,
        // The review prints no «أهداف الدرس» — it is a bank of seven labelled
        // questions, so its concepts are the instructions the pages print.
        concepts: [
          concept(93, REVIEW_TYPE, "اكتـب كلمـة (صـواب) أمـام العبـارة الصحيحـة، وكلمـة (خطـأ) أمـام العبارة"),
          concept(93, REVIEW_TYPE, "اختر اȜجابة الصحيحة مما بين القوسين"),
          concept(94, REVIEW_TYPE, "ما الفرق بين كل من"),
          concept(94, REVIEW_TYPE, "بم تفسر"),
          concept(95, REVIEW_TYPE, "ما المقصود بكل مما يلي"),
          concept(95, REVIEW_TYPE, "ما النتائج المترتبة على"),
          concept(95, REVIEW_TYPE, "اكتب ما تشير إليه كل عبارة مما يلي"),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the
 * unit — so the unit opener, the «تدريبات الدرس» pages, the unit assessment
 * and the closing «النشاط الختامي» stay inside the unit they belong to. A page
 * whose scan carries no text (books 7، 39، 67) is still owned this way, so the
 * ranges tile [6, 95] exactly and no reachable content sits outside a lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_SOCIAL_G5_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_SOCIAL_G5_T1_UNITS.forEach((unit, ui) => {
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
  "social-g5-t1",
);

/**
 * The OCR provider answers a truly blank page with a short Arabic sentence
 * instead of an empty string. It means "no text", not content. The loader
 * normalises such pages to "" so a future page map cannot mistake a blank for
 * content. (This corpus instead leaves its three photo pages as zero-byte
 * files, which already load as "".)
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

/**
 * Full document payload for one lesson: its owned range plus any appendix
 * pages it points to. The lesson's own pages come first. (No lesson of this
 * book points outside its range; the loop is kept so the loader shares one
 * shape across the books.)
 */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const range = lessonBookRange(unitIndex, lessonIndex);
  const lesson = EGYPT_SOCIAL_G5_T1_UNITS[unitIndex]!.lessons[lessonIndex]!;
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

/** A bare folio numeral, or null when the line is not one. */
function bareNumber(line: string): number | null {
  const latin = toLatinDigits(line).trim();
  if (!/^[0-9]+$/.test(latin)) return null;
  const n = Number(latin);
  return n > 0 ? n : null;
}

/**
 * Page-number candidates a content page prints at its head (or, for the
 * opening review page, at its foot). Most pages print a bare folio as their
 * very first line (scan 9 prints «8», scan 95 prints «94»); the «تدريبات
 * الدرس» pages of books 20، 44، 74، 81 and the second-unit assessment head
 * (book 64) print it as their second line instead, behind their own head;
 * book 57 prints its folio glued into its running head («الفصل الدراسي الأول
 * 57 … 57»); and the opening review page (book 93) prints its folio as its
 * last line («93»). The positions are read in that order and the first hit
 * wins, so body numerals (exercise numbers, map scales) can never be mistaken
 * for a folio.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const first = lines[0] ?? "";
  const second = lines[1] ?? "";
  const last = lines[lines.length - 1] ?? "";
  const head = bareNumber(first);
  if (head !== null) return [head];
  const sub = bareNumber(second);
  if (sub !== null) return [sub];
  const glued = [...new Set((toLatinDigits(first).match(/[0-9]+/g) ?? []).map(Number))].filter((n) => n > 0);
  if (glued.length > 0) return glued;
  const foot = bareNumber(last);
  if (foot !== null) return [foot];
  return [];
}

/**
 * The book number a content page prints, or null. Every OCR'd content page
 * that carries a folio prints exactly one number in the positions above and it
 * is its own, which is what fixes the offset; the unit openers named in
 * `FOLIO_LESS_ANCHORS` print no parseable number and are handled there
 * instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The content pages whose printed footer the OCR misread, and the value it
 * printed instead — measured, not guessed. Every parseable folio matches its
 * page number exactly in this book, so there are none; listing the exceptions
 * keeps the check strict instead of statistical.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * The term pages that print no parseable folio in the OCR, each with a printed
 * string the check accepts in its place. The three unit openers (books 6، 38،
 * 66) list their unit's lessons under «دروس الوحدة» and print no folio by
 * design; each is anchored to that head, which it really prints.
 */
const FOLIO_LESS_ANCHORS: Readonly<Record<number, string>> = {
  6: "دروس الوحدة",
  38: "دروس الوحدة",
  66: "دروس الوحدة",
};

/** Every head kind the table may use: lesson objectives plus the review questions. */
const KNOWN_KINDS = new Set(["هدف", "سؤال"]);

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every range
 * sits inside its section, concept pages rise inside their lesson, the sections
 * tile the term without gaps or overlaps, and the first/last sections hit the
 * book's own bounds. A content mistake here would quietly ground the tutor on the
 * wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_SOCIAL_G5_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_SOCIAL_G5_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_SOCIAL_G5_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_SOCIAL_G5_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_SOCIAL_G5_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every OCR'd term page carries real text and proves its book number — from
 *     its printed folio (allowing the measured OCR misreads), or, on the three
 *     pages named in `FOLIO_LESS_ANCHORS`, from the anchor the page itself
 *     prints. The pages in `MISSING_SCANS` carry no text layer at all and are
 *     not iterated for this proof;
 *  2. every unit opener prints the unit head and every lesson's first page prints
 *     that lesson's head;
 *  3. every lesson's title and every objective is printed on the pages the
 *     lesson owns (each objective on its own first page);
 *  4. every printed page in [6, 95] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every OCR'd
 *     page of the term, i.e. `_BOOK_END - _BOOK_START + 1` minus `MISSING_SCANS`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_SOCIAL_G5_T1_UNITS;
  const missing = new Set<number>(MISSING_SCANS);

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every OCR'd page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_SOCIAL_G5_T1_BOOK_START || book > EGYPT_SOCIAL_G5_T1_BOOK_END) continue;
    if (missing.has(book)) continue;
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

  const expectedPages = EGYPT_SOCIAL_G5_T1_BOOK_END - EGYPT_SOCIAL_G5_T1_BOOK_START + 1 - MISSING_SCANS.length;
  if (printedPages.size !== expectedPages) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_SOCIAL_G5_T1_BOOK_START} و${EGYPT_SOCIAL_G5_T1_BOOK_END}، المتوقع ${expectedPages}`,
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
  for (let p = EGYPT_SOCIAL_G5_T1_BOOK_START; p <= EGYPT_SOCIAL_G5_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
