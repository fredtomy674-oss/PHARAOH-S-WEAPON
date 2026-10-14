// PHASE 110 — official Egypt Secondary-1 (Grade 10) Christian Religious Education
// («التربية الدينية المسيحية — الصف الأول الثانوى (العام - الفنى)»), first
// term.
//
// The curriculum tree for the Egypt `eg-g10-christian-education` curriculum is
// rebuilt from the Ministry textbook (160 scanned pages, both terms in one
// scan). This module is the single source of truth for the FIRST term only:
// the two units of the first term, their printed lessons (exactly as the
// book's own «المحتويات» on scan 4 lists them) and, for every lesson, the
// book's own printed «أهداف الدرس» — verbatim, as on the lesson's first page.
// The self-checks at the bottom prove that mapping against the OCR itself,
// page by page.
//
// THE OFFSET IS +4 — book page N = scan page N + 4
// Every content page prints its own folio in the running foot, so
// `BOOK_TO_PDF_OFFSET` is fixed by the scan itself and quoted here: scan 7
// prints «٣» (book 3), scan 9 prints «٥» (book 5), scan 24 prints «٢٠»
// (book 20), scan 33 prints «٢٩» (book 29), scan 40 prints «٣٦» (book 36),
// scan 46 prints «٤٢» (book 42), scan 52 prints «٤٨» (book 48), scan 61 prints
// «٥٧» (book 57), scan 67 prints «٦٣» (book 63), scan 76 prints «٧٢»
// (book 72) and scan 84 prints «٨٠» (book 80). The book's own «المحتويات»
// (scan 4) independently confirms it: it lists the ten first-term lessons with
// the very book pages their heads print on (٣، ١٠، ٢٠، ٢٩، ٣٦، ٤٢، ٤٨، ٥٧،
// ٦٣، ٧٢) — each head sits exactly on scan (page + 4), except lesson 1-1 whose
// head spread (book 2 = scan 6) is unnumbered so the contents points at the
// lesson's first numbered page (book 3) instead; see below.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–4 are before the term: the cover (1), the لجنة التعديل
// والمراجعة masthead (2), the «مقدمة» (3) and the printed first-term
// «المحتويات» (4). Scan pages 85–160 are after the term: the second term's
// own title page (85), a bound-in exam «تنبيه» instruction page (86), the
// second term's own «المحتويات» (87), the whole second-term content
// (88–159: «الفصل الدراسى الثانى» in every running foot, with its own
// pagination restarted — e.g. scan 89 prints «٥») and the technical-specs
// colophon (160). The term runs from the unit 1 opener (book 1 = scan 5) to
// the last unit-2 exam page (book 80 = scan 84):
// `EGYPT_CHRISTIAN_G10_T1_BOOK_START` / `_END` are exactly those two pages,
// and the tiling assertion proves nothing in between is left unreachable.
// `pagesChecked` therefore equals 80 − 1 + 1 = 80.
//
// FOUR TERM PAGES NEED A DOCUMENTED FOLIO EXCEPTION
// The two unit openers (books 1، 47: «الوحدة الأولى/الثانية» pages) and the
// first two lesson heads (books 2، 10) print the running foot with no folio at
// all — by the book's own design; every later lesson head does print its
// folio. Rather than weaken the page-number check, these four are exempt from
// it and anchored on a marker that survives verbatim on that page, named in
// `FOLIO_EXCEPTION_MARKERS`.
//
// THE FOOT CHECK SCANS THE LAST FOUR LINES, NOT THREE
// On most pages the folio sits inside the last three lines, but on books 40،
// 70، 76 the book prints the folio first and then the three foot lines
// («٤٠ / الصف الأول الثانوى / الفصل الدراسي الأول / مطابع الشركة القومية
// للتوزيع»), so the check scans the last four lines. This was verified
// mechanically to change nothing else: with four lines every other term page
// still yields exactly its own single number. Book 30 needs no exception
// either: it prints its folio in Extended Arabic-Indic digits («۳۰»), which
// `toLatinDigits` folds like the twin book does.
//
// EACH LESSON'S CONCEPTS ARE THE BOOK'S OWN PRINTED «أهداف الدرس»
// Every first-term lesson prints a numbered «أهداف الدرس» list on its first
// page («بنهاية هذا الدرس ينبغي أن يكون الطالب قادراً على أن : …»). Each item
// is carried, verbatim, as a concept of that lesson with `bookFrom` set to
// the lesson's first page. Nothing is invented. Four OCR survival quirks are
// kept honest rather than reconstructed: lesson 1-1 item 8 prints «الآباب»
// for «الآباء», lesson 1-2 item 8 reads «يحub (يحب)» with Latin letters fused
// in, lesson 1-5 numbers its fifth item «ه.» instead of «٥.», and lesson 2-2
// item 7 reads «يححب» with a doubled ح — each is transcribed exactly as the
// OCR prints it, which is what the concept-in-range check proves. The book's
// own numbering quirks are kept too: lessons 1-2 and 2-2 number their
// objectives with Latin «1.» digits while the rest use Arabic-Indic digits.
//
// FOUR LESSON TITLES FOLLOW THEIR OWN FIRST PAGE, NOT THE CONTENTS LINE
// The «المحتويات» lists lesson 1-3 as «تدبير الخلاص (التجسد الفداء)» but its
// head on book 20 prints «تدبير الخلاص (التجسد والفداء)»; lesson 1-4 as «سر
// الأفخارستيا» but its head on book 29 prints «سر الإفخارستيا»; lesson 2-2 as
// «فعالية الصلاة والصوم» but its head on book 57 prints «فاعلية الصلاة
// والصوم»; and lesson 2-4 as «أقوال الآباء» but its head on book 72 prints
// «أقوال آباء». Each lesson carries the form its own page prints, which is
// what the title-in-range check proves.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N + 4 (verified: book p.80 = scan p.84). */
export const BOOK_TO_PDF_OFFSET = 4;

/** First printed page of the term — the unit 1 opener (scan 5). */
export const EGYPT_CHRISTIAN_G10_T1_BOOK_START = 1;

/** Last printed page of the term — the unit 2 third-exam page (scan 84). */
export const EGYPT_CHRISTIAN_G10_T1_BOOK_END = 80;

/** The scanned pages before the term: cover, reviewers, مقدمة and المحتويات. */
export const EGYPT_CHRISTIAN_G10_T1_FRONT_MATTER = { from: 1, to: 4 } as const;

/** The scanned pages after the term: the whole second term plus the colophon. */
export const EGYPT_CHRISTIAN_G10_T1_BACK_MATTER = { from: 85, to: 160 } as const;

/** One printed objective of a lesson — becomes one concept in the app tree. */
export interface ChristianG10T1Concept {
  /** Printed book page where this objective starts (the lesson's first page). */
  bookFrom: number;
  /** The printed component kind: «هدف». */
  kind: string;
  /** The printed objective, verbatim. */
  title: string;
}

/** One lesson («درس») of the first term, as the «المحتويات» lists it. */
export interface ChristianG10T1Lesson {
  /** App-addressable key, e.g. "2-3" (unit 2, lesson 3). */
  key: string;
  /** Arabic ordinal used in the lesson title, e.g. "الثالث". */
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
  concepts: ChristianG10T1Concept[];
}

/** One printed section of the book — one of the two units of the first term. */
export interface ChristianG10T1Section {
  /** This book's sections are its units. */
  kind: "unit";
  /** Internal key: "1"…"2". */
  key: string;
  /** Arabic ordinal of the unit, e.g. "الأولى". */
  ordinal: string;
  /** Full app-facing section title, e.g. "الوحدة الأولى: العقيدة". */
  title: string;
  /** The unit head the opener page prints, e.g. "العقيدة". */
  printedHead: string;
  /** First printed page of the section (its opener). */
  bookFrom: number;
  /** Last printed page of the section (the page before the next unit's opener). */
  bookTo: number;
  lessons: ChristianG10T1Lesson[];
}

const TYPE = "هدف";

function concept(bookFrom: number, title: string): ChristianG10T1Concept {
  return { bookFrom, kind: TYPE, title };
}

/**
 * The two units of the first term with their printed lessons and every
 * printed «أهداف الدرس» item, transcribed from the first page of each lesson
 * and checked by `assertTreeMatchesTheBook` before seeding.
 *
 * Unit/lesson starts come from the book's «المحتويات» (scan 4); each lesson's
 * concepts are the numbered objectives the book prints on the page the lesson
 * starts on, kept verbatim — including the book's own numbering quirks
 * (lessons 1-2 and 2-2 use Latin «1.» digits, lesson 1-5 numbers its fifth
 * item «ه.») and the OCR survival quirks quoted in the header comment.
 */
export const EGYPT_CHRISTIAN_G10_T1_UNITS: ChristianG10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: العقيدة",
    printedHead: "العقيدة",
    bookFrom: 1,
    bookTo: 46,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: TYPE,
        title: "الله واحد مثلث الأقانيم",
        printedHead: "الدرس الأول الله واحد مثلث الأقانيم",
        bookFrom: 2,
        concepts: [
          concept(2, "١. يردد بعض الآيات ويحفظها عن وحدانية الله."),
          concept(2, "٢. يتعرف مفهوم وحدانية الله في الكتاب المقدس."),
          concept(2, "٣. يمارس العبادة لله الواحد مثلث الأقانيم."),
          concept(2, "٤. يدرك مفهوم الله الواحد مثلث الأقانيم."),
          concept(2, "٥. يشعر بوجود الله في حياته."),
          concept(2, "٦. يواظب على الذهاب للكنيسة ويسبح الله الواحد مثلث الأقانيم."),
          concept(2, "٧. يحب الله من كل قلبه ونفسه وفكره وقدرته."),
          concept(2, "٨. يربط بين نصوص الكتاب المقدس وقانون الإيمان المسيحي وأقوال الآباب."),
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "طبيعة السيد المسيح له المجد",
        printedHead: "الدرس الثاني طبيعة السيد المسيح له المجد",
        bookFrom: 10,
        concepts: [
          concept(10, "1. يتعرف طبيعة السيد المسيح من حيث أنها طبيعة واحدة ."),
          concept(10, "2. يدرك طبيعة الاتحاد من خلال بعض الأمثلة"),
          concept(10, "3. يفهم أن وحدة الطبيعة ظهرت في الميلاد والكفارة والالام وفى المشيئة والفعل"),
          concept(10, "4. يستخلص بعض المفاهيم الايمانية مثل ابن الله الوحيد - ابن الانسان - اقنوم الكلمة ."),
          concept(10, "5. يحفظ بعض الآيات التي تشير إلى لاهوت السيد المسيح ."),
          concept(10, "6. يتأمل في طبيعة السيد المسيح ."),
          concept(10, "7. يمارس الصلاة والعبادة والاستعداد للقاء الرب يسوع ."),
          concept(10, "8. يحub (يحب) السيد المسيح من كل قلبه وفكره ونفسه وقدرته ."),
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "تدبير الخلاص (التجسد والفداء)",
        printedHead: "الدرس الثالث تدبير الخلاص (التجسد والفداء)",
        bookFrom: 20,
        concepts: [
          concept(20, "١. يتعرف مفهوم التجسد والفداء وأسبابه وبركاته ."),
          concept(20, "٢. يقدر بركات التجسد الإلهي والفداء ويستفيد منهما ."),
          concept(20, "٣. يدرك محبة الله للبشرية ومجيئه للعالم ."),
          concept(20, "٤. يتمثل باتضاع السيد المسيح ويسلك بالمحبة والمغفرة للآخرين ."),
          concept(20, "٥. يحرص على قراءة الكتاب المقدس ويحفظ وصاياه ."),
          concept(20, "٦. يقف على حاجة البشرية إلى الفداء ."),
          concept(20, "٧. يفهم بعض نبوات العهد القديم التي تشير إلى آلام السيد المسيح ."),
          concept(20, "٨. يشعر بأهمية التجسد والفداء في علاقته بالله والحياة الأبدية ."),
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "سر الإفخارستيا (تأسيسه - ممارسته في الكنيسة الأولى)",
        printedHead: "الدرس الرابع سر الإفخارستيا",
        bookFrom: 29,
        concepts: [
          concept(29, "١. يدرك رموز الإفخارستيا في العهد القديم ."),
          concept(29, "٢. يتعرف مفهوم الإفخارستيا وتأسيس هذا السر ."),
          concept(29, "٣. يفهم نصوص الكتاب المقدس عن سر الإفخارستيا وممارسة الكنيسة له وأقوال الآباء عنه ."),
          concept(29, "٤. يدرك أهمية سر الإفخارستيا وبركاته ."),
          concept(29, "٥. يحذر من التناول بدون استحقاق ."),
          concept(29, "٦. يواظب على التوبة والاعتراف والتناول من جسد الرب ودمه ."),
          concept(29, "٧. يردد بعض الآيات عن سر الإفخارستيا ويحفظها ."),
          concept(29, "٨. يرتل ترنيمة مناسبة عن سر الإفخارستيا ( التناول ) ."),
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        type: TYPE,
        title: "الوحي في الكتاب المقدس",
        printedHead: "الدرس الخامس الوحي في الكتاب المقدس",
        bookFrom: 36,
        concepts: [
          concept(36, "١. يتعرف مفهوم الوحي لغويًا ومسيحيًا وضرورته وخصائصه في المسيحية."),
          concept(36, "٢. يدرك طرق الوحي وعمل روح القدس فيه."),
          concept(36, "٣. يثق في مواعيد الله وينفذ وصاياه."),
          concept(36, "٤. يواظب على قراءة الكتاب المقدس ويحفظ بعض آياته."),
          concept(36, "ه. يشكر الله على محبته وحديثه إلينا."),
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        type: TYPE,
        title: "القديسة مريم والدة الإله (في الكتاب المقدس وتعاليم الآباء)",
        printedHead: "الدرس السادس القديسة مريم والدة الإله",
        bookFrom: 42,
        concepts: [
          concept(42, "١. يتعرف نبوات العهد القديم عن العذراء مريم ."),
          concept(42, "٢. يفهم المقصود بعبارة « ثيوتوكوس »."),
          concept(42, "٣. يقدر مكانة القديسة العذراء مريم في الكنيسة ."),
          concept(42, "٤. يردد قانون الإيمان بدءًا من نعظمك يا أم النور الحقيقي ."),
          concept(42, "٥. يحب القديسين ويتشفع بهم وفي مقدمتهم القديسة العذراء مريم ."),
          concept(42, "٦. يشارك في التسبيح لله والألحان والترانيم التي تتعلق بمديح السيدة العذراء ."),
          concept(42, "٧. يربط بين آيات العهد القديم والعهد الجديد عن مكانة القديسة العذراء مريم ."),
        ],
      },
    ],
  },
  {
    key: "2",
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: العبادة",
    printedHead: "العبادة",
    bookFrom: 47,
    bookTo: 80,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: TYPE,
        title: "معالم الطريق الروحي (محاسبة النفس - القراءات والتدريبات الروحية)",
        printedHead: "الدرس الأول معالم الطريق الروحي",
        bookFrom: 48,
        concepts: [
          concept(48, "١. يتعرف مفهوم كل من محاسبه النفس والقراءات والتدريبات الروحية ."),
          concept(48, "٢. يمارس فضيلة محاسبة النفس والتدريبات المرتبطة بها ."),
          concept(48, "٣. يحب سماع كلمة الله وقراءة الكتاب المقدس ."),
          concept(48, "٤. يواظب على محاسبة النفس والقراءات الروحية ."),
          concept(48, "٥. يمارس حياة الصلاة قبل كل عمل يؤديه ."),
          concept(48, "٦. يسلك بوداعة في تعامله مع الآخرين ويبتعد عن خطية الأدانة ."),
          concept(48, "٧. يفرق بين القراءات التي تبنى حياته الروحية وشخصيته وتلك التي تعثره ليبتعد عنها ."),
        ],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: TYPE,
        title: "فاعلية الصلاة والصوم",
        printedHead: "الدرس الثاني فاعلية الصلاة والصوم",
        bookFrom: 57,
        concepts: [
          concept(57, "1. يتعرف مفهوم الصلاة والصوم وفعاليتهما ."),
          concept(57, "2. يربط بين الصلاة والصوم وغيرهما من الفضائل ."),
          concept(57, "3. يشارك زملاءه وأسرته في الصلاة والصوم ."),
          concept(57, "4. يواظب على الصلاة في الكنيسة ."),
          concept(57, "5. يرنم بعض الترانيم التي تتعلق بالصلاة والصوم ."),
          concept(57, "6. يحرص على الصلاة من أجل جميع الناس ."),
          concept(57, "7. يححب الله من كل فكره وقلبه ومن كل قدرته ."),
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: TYPE,
        title: "التوبة والاعتراف والتناول (روحياً)",
        printedHead: "الدرس الثالث التوبة والاعتراف والتناول (روحياً)",
        bookFrom: 63,
        concepts: [
          concept(63, "١. يتعرف مفهوم التوبة وشروطها وأسسها وعلاماتها وكيف نعيشها ."),
          concept(63, "٢. يدرك مفهوم التناول وأهميته وخطورة التناول بدون استحقاق ."),
          concept(63, "٣. يحب الله من كل فكره وقلبه وقدرته ويحب قريبه كنفسه ."),
          concept(63, "٤. يواظب على ممارسة سر الاعتراف والتوبة ."),
          concept(63, "٥. يمارس سر التناول والاستعداد له ."),
          concept(63, "٦. يربط بين الاعتراف والتوبة وبين التناول ."),
          concept(63, "٧. يكتسب فضيلة الجهاد ضد الخطية من خلال التوبة والاستعداد للتناول ."),
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: TYPE,
        title: "محفوظات (مزامير وصلوات وأقوال آباء)",
        printedHead: "الدرس الرابع محفوظات",
        bookFrom: 72,
        concepts: [
          concept(72, "١. يردد آيات الكتاب المقدس ويطبقها في حياته ."),
          concept(72, "٢. يشارك زملائه والكنيسة في الصلوات والترانيم ."),
          concept(72, "٣. يدرك ما تتضمنه هذه الصلوات من معان روحية ."),
          concept(72, "٤. يتعود على الصلاة والحديث مع الله ويطلب منه طلبات روحية ."),
          concept(72, "٥. يمارس أعمال الرحمة والوداعة والفضائل من أجل الحياة للأبدية ."),
          concept(72, "٦. يشعر بدوره في المجتمع باعتباره عضوا فعالا ومؤثرا فيه ."),
          concept(72, "٧. يفرق بين أعمال النور وأعمال الظلمة وفقا لتعاليم الكتاب المقدس ."),
        ],
      },
    ],
  },
];

/**
 * The range a lesson owns: from the unit opener (its first lesson) or its own
 * head page, down to the page before the next lesson starts, bounded by the
 * unit — so the unit opener and the unit drills stay inside the unit they
 * belong to.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_CHRISTIAN_G10_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_CHRISTIAN_G10_T1_UNITS.forEach((unit, ui) => {
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
  "christian-g10-t1",
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

/** The document a lesson grounds the tutor in: its own page range, in order. */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(unitIndex, lessonIndex);
  const parts: string[] = [];
  for (let p = from; p <= to; p++) {
    const text = loadBookPage(p);
    if (text) parts.push(pageBlock(p, text));
  }
  return parts.join("\n\n");
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
 * the running foot «التربية الدينية المسيحية … الصف الأول الثانوى … الفصل
 * الدراسى الأول … مطابع الشركة القومية للتوزيع» carrying the folio beside it
 * («٣ … الصف الأول الثانوى»، «٤٢ الصف الأول الثانوى»، «الصف الأول الثانوى
 * ١١»)، so the last four lines are scanned and every number on a foot-looking
 * line is a candidate. Four lines — not three — because on some pages the book
 * prints the folio first and then the three foot lines («٤٠ / الصف الأول
 * الثانوى / الفصل الدراسي الأول / مطابع الشركة القومية للتوزيع» on books 40،
 * 70، 76); verified mechanically to leave every other term page yielding
 * exactly its own single number.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const tail = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(-4);
  const nums: number[] = [];
  for (const line of tail) {
    const looksLikeFoot =
      /^[([]?[0-9٠-٩۰-۹]+[\])]?$/.test(line) || /مطابع|الفصل الدراسي|الصف الأول/.test(line);
    if (!looksLikeFoot) continue;
    const latin = toLatinDigits(line).replace(/[^0-9]/g, " ").replace(/\s+/g, " ").trim();
    for (const tok of latin.split(" ")) if (tok) nums.push(Number(tok));
  }
  return [...new Set(nums)].filter((n) => n > 0);
}

/**
 * The book number a content page prints at its foot, or null. Every content
 * page that carries a folio prints exactly one number there and it is its own,
 * which is what fixes the offset; the pages named in `FOLIO_EXCEPTION_MARKERS`
 * are handled separately instead.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  return candidates.length === 1 ? candidates[0]! : null;
}

/**
 * The four term pages exempt from the folio check, each with the marker
 * the check accepts in place of a page number: books 1 and 47 are the unit
 * openers («الوحدة الأولى/الثانية» pages) and books 2 and 10 are the first two
 * lesson heads — all four print the running foot with no folio by design,
 * while every later lesson head prints its own folio.
 */
const FOLIO_EXCEPTION_MARKERS: Readonly<Record<number, string>> = {
  1: "العقيدة",
  2: "الله واحد مثلث الأقانيم",
  10: "طبيعة السيد المسيح له المجد",
  47: "العبادة",
};

/**
 * Table invariants: lesson keys are unique and follow (unit-lesson), every range
 * sits inside its section, concept pages rise inside their lesson, the sections
 * tile the term without gaps or overlaps, and the first/last sections hit the
 * book's own bounds. A content mistake here would quietly ground the tutor on the
 * wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_CHRISTIAN_G10_T1_UNITS;
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
  if (first && first.bookFrom !== EGYPT_CHRISTIAN_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_CHRISTIAN_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_CHRISTIAN_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_CHRISTIAN_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every term page carries real OCR text and proves its book number — from its
 *     printed folio, or, on the four pages named in
 *     `FOLIO_EXCEPTION_MARKERS`, from the marker quoted there;
 *  2. every unit's opener prints the unit head and every lesson's first page prints
 *     that lesson's head;
 *  3. every lesson's title and every objective is printed on the pages the
 *     lesson owns (each objective on its own first page);
 *  4. every printed page in [1, 80] is owned by exactly one lesson — no page falls
 *     between two lessons and is unreachable;
 *  5. the pages tile the term with no gap. `pagesChecked` counts every page of the
 *     term, so it equals `_BOOK_END - _BOOK_START + 1`.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const units = EGYPT_CHRISTIAN_G10_T1_UNITS;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let pagesChecked = 0;

  // 1. every page of the term carries text and proves its own number.
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_CHRISTIAN_G10_T1_BOOK_START || book > EGYPT_CHRISTIAN_G10_T1_BOOK_END) continue;
    const text = loadBookPage(book);
    pagesChecked += 1;
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    printedPages.add(book);

    const marker = FOLIO_EXCEPTION_MARKERS[book];
    if (marker !== undefined) {
      if (!normalize(text).includes(normalize(marker))) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع ولا تطبع المرساة «${marker}»`);
      }
    } else {
      const footer = printedFooter(book);
      if (footer === null) {
        problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع`);
      } else if (footer !== book) {
        problems.push(`صفحة الكتاب ${book}: الرقم المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_CHRISTIAN_G10_T1_BOOK_END - EGYPT_CHRISTIAN_G10_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_CHRISTIAN_G10_T1_BOOK_START} و${EGYPT_CHRISTIAN_G10_T1_BOOK_END}`,
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
  for (let p = EGYPT_CHRISTIAN_G10_T1_BOOK_START; p <= EGYPT_CHRISTIAN_G10_T1_BOOK_END; p++) {
    if (!owner.has(p)) problems.push(`الصفحة ${p} لا يملكها أي درس`);
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}
