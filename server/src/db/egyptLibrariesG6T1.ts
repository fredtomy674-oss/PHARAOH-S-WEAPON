// ---------------------------------------------------------------------------
// Egypt — «المكتبات» — Grade 6, term 1 (the real book).
// ---------------------------------------------------------------------------
// Source: the MoE student book PDF «Libraries_prim6_t1.pdf» — 42 pages, whose
// pages are SINGLE-PAGE scans (unlike the same series' Grade-5 book, whose
// scans pair two facing pages): page 1 is the cover, page 42 is a scan whose
// OCR returned only the provider's «لا يوجد نص …» placeholder. The scans were
// OCR'd into data/curriculum-ocr/libraries-g6-t1/ (one pages-NNN.txt per
// scan); the book's text layer is unusable (InDesign ligature transposition),
// so that corpus is the single source of truth for every check here.
//
// PAGE MODEL — verified scan by scan: each scan carries exactly one printed
// page, and every folio the OCR can read on a scan names that same scan
// («١١»…«١٥», «١٧», «١٩», «٢٣», «٢٥»…«٢٧», «٢٩», «٣١», «٣٥»…«٣٧»,
// «٣٩»…«٤١»), so printed page == scan page throughout.
//
// The curriculum owns printed pages 5–41: page 5 opens lesson 1 (lesson 1's
// title page) and page 41 is the last page of lesson 12. Pages 1–4 are the
// cover, the credits page (folio 2 — it prints no number), مقدمة الكتاب
// (folio 3) and قائمة المحتويات (folio 4).
//
// TREE — taken from the book itself, never invented:
//   * lesson titles are the strings the lesson title pages print («الدرس
//     الأول : رحلة في أنشطة المكتبة» … «الدرس الثاني عشر : مكتبتي المنزلية»);
//   * each lesson's concepts are its printed «الأهداف» bullets, verbatim;
//   * the lessons are numbered continuously «الأول»…«الثاني عشر», and the book
//     has no unit openers — the single container unit is the app's own shell,
//     titled with the book's cover name, so lesson 1 starts ON its first page;
//   * the book's own فهرس is the production's draft-era table: its rows lag
//     the printed folios by one page for lessons 1–6 and 11–12 (they print ٤
//     where the title page prints ٥, ٧/٨ … ١٩/٢٠, ٣٥/٣٦, ٣٨/٣٩) while lessons
//     7–10 match exactly. The checks below therefore require each row to name
//     its lesson within one page of the printed truth, and the folios the
//     pages themselves carry win, as always.
//
// Every claim above is re-proved by assertTreeMatchesTheBook() before the
// seeder will touch this book.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** First page the curriculum owns: the lesson-1 title page. */
export const EGYPT_LIBRARIES_G6_T1_BOOK_START = 5;

/** Last page of lesson 12. */
export const EGYPT_LIBRARIES_G6_T1_BOOK_END = 41;

/** The book's own name — what its cover prints; the container unit takes it. */
export const EGYPT_LIBRARIES_G6_T1_SPINE_TITLE = "المكتبات";

/** Number of scans the PDF carries (one printed page per scan). */
export const EGYPT_LIBRARIES_G6_T1_SCANS = 42;

/** Scan that carries a printed page: one scan per page, so this is identity. */
export function bookToPdfPage(book: number): number {
  return book;
}

/** The printed page a scan carries, or null outside the PDF. */
export function pdfPageToBookPages(pdf: number): { from: number; to: number } | null {
  if (pdf >= 1 && pdf <= EGYPT_LIBRARIES_G6_T1_SCANS) return { from: pdf, to: pdf };
  return null;
}

export interface EgyptLibrariesG6T1Lesson {
  /** Lesson key as the seeder namespaces it: «unit-lesson» in Latin digits. */
  key: string;
  /** Printed ordinal, e.g. «الحادي عشر» — printed sequence, not per-unit. */
  ordinal: string;
  /** Lesson title exactly as the lesson's title page prints it. */
  title: string;
  /** The page that prints this lesson's title and objectives. */
  bookFrom: number;
  /** The lesson's printed «الأهداف» bullets, verbatim. */
  concepts: string[];
}

export interface EgyptLibrariesG6T1Unit {
  /** Unit key as the seeder namespaces it: «1». */
  key: string;
  ordinal: string;
  title: string;
  /** The unit's first page — the first lesson's title page. */
  bookFrom: number;
  bookTo: number;
  lessons: EgyptLibrariesG6T1Lesson[];
}

export const EGYPT_LIBRARIES_G6_T1_UNITS: EgyptLibrariesG6T1Unit[] = [
  {
    key: "1",
    ordinal: "الأولى",
    title: EGYPT_LIBRARIES_G6_T1_SPINE_TITLE,
    bookFrom: 5,
    bookTo: 41,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "رحلة في أنشطة المكتبة",
        bookFrom: 5,
        concepts: [
          "يتعرف على الانشطة الموجودة داخل المكتبة.",
          "يتعرف على الانشطة الحوارية داخل المكتبة.",
          "يتعرف على الانشطة الورقية داخل المكتبة.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "أشارك وأتميز",
        bookFrom: 8,
        concepts: [
          "يتعرف على أنواع المسابقات الثقافية والفنية المتاحة داخل المكتبة.",
          "يكتشف خطوات التسجيل والاشتراك في المسابقات بفاعلية.",
          "يدرك أهمية التميز الفردي والعمل الجماعي في تمثيل المدرسة بالمسابقات.",
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        title: "الباحث الصغير",
        bookFrom: 11,
        concepts: [
          "يتعرف على مصادر البحث عن المعلومات داخل المكتبة",
          "يستخدم الكتاب في الحصول على معلومة",
          "يستخدم الانترنت للبحث عن معلومة",
          "يقارن بين المعلومات التي حصل عليها من الكتاب والإنترنت",
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        title: "اكتشف مكونات الكتاب",
        bookFrom: 14,
        concepts: [
          "يتعرف على اجزاء للكتاب. ( الغلاف، صفحة العنوان، المقدمة - الفهرس)",
          "يكتشف أهمية كل جزء من مكونات الكتاب في تسهيل عملية- القراءة والوصول للمعلومات بفاعلية",
          "يدرك قيمة الحفاظ على سلامة الكتاب",
        ],
      },
      {
        key: "1-5",
        ordinal: "الخامس",
        title: "ماذا تخبرنا صفحة العنوان ؟",
        bookFrom: 17,
        concepts: [
          "يتعرف على البيانات الأساسية الموجودة في صفحة العنوان.",
          "يكتشف أهمية كل بيان في تحديد هوية الكتاب الدقيقة وتوثيقه بطريقة صحيحة.",
          "يقدر قيمة الملكية الفكرية والجهود المشتركة بين المؤلف والناشر لإخراج الكتاب.",
        ],
      },
      {
        key: "1-6",
        ordinal: "السادس",
        title: "المحتويات أم المراجع",
        bookFrom: 20,
        concepts: [
          "يتعرف على مفهوم كل من «قائمة المحتويات» و«قائمة المراجع» في الكتاب",
          "يكتشف الفرق الجوهري بين وظيفتين تنظيم وفهرسة موضوعات الكتاب، مقابل توثيق مصادر المعلومات وأمانتها",
          "يدرك أهمية القائمتين كأدوات أساسية لتسهيل القراءة وتوثيق المعرفة بذكاء.",
        ],
      },
      {
        key: "1-7",
        ordinal: "السابع",
        title: "المعلومات في كل مكان",
        bookFrom: 23,
        concepts: [
          "يتعرف على مصادر المعلومات المتنوعة المحيطة به في بيئته اليومية .",
          "يكتشف كيفية التمييز بين المصادر المختلفة واختيار الأنسب منها للحصول على إجابات دقيقة لأسئلته.",
          "يستخدم المصادر المرئية والمسموعة كمصادر للمعلومات.",
        ],
      },
      {
        key: "1-8",
        ordinal: "الثامن",
        title: "مستكشف المعلومات بين الورق والانترنت",
        bookFrom: 26,
        concepts: [
          "يتعرف على الخصائص المميزة للمصادر الورقية والمصادر الرقمية.",
          "يكتشف الفروق الجوهرية بين البحث في الفهرس الورقي والبحث باستخدام محركات البحث الرقمية.",
          "يدرك متى يلجأ للمصدر الورقية ومتى يفضل المصدر الرقمي لضمان سرعة ودقة الوصول للمعلومة.",
        ],
      },
      {
        key: "1-9",
        ordinal: "التاسع",
        title: "رحلة البحث عن المعلومات",
        bookFrom: 29,
        concepts: [
          "يتعرف على أدوات البحث عن المعلومات.",
          "يميز الذكاء الاصطناعي كأداة للمعلومات .",
          "يتعرف على أضرار الاعتماد الكلي على الذكاء الاصطناعي.",
        ],
      },
      {
        key: "1-10",
        ordinal: "العاشر",
        title: "نتحاور في المكتبة",
        bookFrom: 32,
        concepts: [
          "يتعرف على أنواع الأنشطة الحوارية المتاحة داخل المكتبة (المناظرات الثقافية، صالون القراءة، ندوات النقاش).",
          "يكتشف آداب الحوار الفعال وقواعد التعبير عن الرأي وتقبل الرأي الآخر أثناء النقاش.",
          "يدرك أهمية الحوار البنّاء في تبادل المعرفة وبناء الشخصية القيادية- الإيجابية داخل المدرسة .",
        ],
      },
      {
        key: "1-11",
        ordinal: "الحادي عشر",
        title: "من الحوار الى الفكرة",
        bookFrom: 36,
        concepts: [
          "التعرف على مفاهيم الأنشطة الحوارية الأساسية :الندوة - المحاضرة المناظرة، وفهم الفروق الجوهرية بينها",
          "يكتشف خطوات الاستماع الواعي ويدون الملاحظات لاستخراج الفكرة الرئيسية بفاعلية",
          "يدرك أهمية الإنصات المتبادل واحترام الرأي الآخر في صياغة الأفكار وتطوير الفكر الفردي والجماعي",
        ],
      },
      {
        key: "1-12",
        ordinal: "الثاني عشر",
        title: "مكتبتي المنزلية",
        bookFrom: 39,
        concepts: [
          "معرفة أهمية وجود مكتبة منزلية.",
          "يحدد خطوات إنشاء مكتبة منزلية منظمة.",
          "يختار الكتب المفضلة له.",
          "يطبق مهارات التنظيم والترتيب في ترتيب مكتبته الخاصة.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the unit's first page (for the first
 * lesson — this book's unit has no opener of its own) or its own title page, up
 * to the page before the next lesson starts, or the unit's last page for its
 * last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_LIBRARIES_G6_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_LIBRARIES_G6_T1_UNITS.forEach((unit, ui) => {
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
  "libraries-g6-t1",
);

/**
 * The OCR provider answers a truly blank page with a sentence instead of an
 * empty string. It means "no text", not content, so verification treats it as
 * missing while `loadBookPage` still returns it verbatim.
 */
const NO_TEXT = "لا يوجد نص";

/** OCR text of one scan, or "" when the scan was not OCR'd. */
function loadScan(pdf: number): string {
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

/** OCR text of one printed book page — its scan's text (one page per scan). */
export function loadBookPage(book: number): string {
  const pdf = bookToPdfPage(book);
  if (pdf < 1 || pdf > EGYPT_LIBRARIES_G6_T1_SCANS) return "";
  return loadScan(pdf);
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

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    // The scanner also emits the extended (Persian) digit forms for some chips.
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/**
 * Every number a scan prints as a folio: standalone chips («٢٣») and numbers
 * riding at the end of the running lines («... الصف السادس الأبتدائي ١٢» /
 * «... الفصل الدراسي الأول ١٥»). Sorted ascending, deduplicated.
 *
 * The scan shows ONE printed page, so its candidates must all name that same
 * page — the check reports any intruder instead of guessing what it numbers.
 */
export function folioCandidates(pdf: number): number[] {
  const text = loadScan(pdf);
  if (!text) return [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const candidates = new Set<number>();
  for (const line of lines) {
    const latin = toLatinDigits(line);
    if (/^\d{1,3}$/.test(latin)) candidates.add(Number(latin));
    const marker = latin.search(/الصف السادس ال[اأ]بتدائي|الفصل الدراسي ال(اول|أول)/);
    if (marker < 0) continue;
    for (const run of latin.slice(marker).match(/\d{1,3}/g) ?? []) candidates.add(Number(run));
  }
  return [...candidates].filter((n) => n >= 1 && n <= 99).sort((a, b) => a - b);
}

/**
 * The book number a content page prints in its running foot, or null when no
 * single readable folio on its scan names it. The scan must not carry a number
 * outside its own page for this to answer at all.
 */
export function printedFooter(book: number): number | null {
  const candidates = folioCandidates(bookToPdfPage(book));
  if (candidates.some((n) => n !== book)) return null;
  return candidates.includes(book) ? book : null;
}

/** Strips everything but letters and digits, so OCR spacing cannot break a match. */
function normalize(text: string): string {
  return text
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * One insertion, deletion or substitution apart — the most the فهرس lookup
 * may forgive: the فهرس prints lesson 12's title with a final «ى»
 * («مكتبى المنزلية») where the lesson's own title page prints «مكتبتي
 * المنزلية». Anything else must match its row exactly.
 */
function oneLetterApart(a: string, b: string): boolean {
  if (a === b) return false;
  if (a.length === b.length) {
    let diff = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i] && ++diff > 1) return false;
    return diff === 1;
  }
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  if (long.length - short.length !== 1) return false;
  for (let i = 0; i < long.length; i++) {
    if (long.slice(0, i) + long.slice(i + 1) === short) return true;
  }
  return false;
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * the unit, and the unit tiles the book without gaps or overlaps. Unlike the
 * multi-unit books, this book's single container unit has no opener page of
 * its own, so its first lesson may start ON the unit's first page — never
 * before it.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_LIBRARIES_G6_T1_UNITS;

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`الوحدة ${unit.ordinal}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      const expectedKey = `${ui + 1}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`الوحدة ${ui + 1} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (lesson.bookFrom < unit.bookFrom || lesson.bookFrom > unit.bookTo) {
        problems.push(
          `الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق الوحدة ${unit.bookFrom}–${unit.bookTo}`,
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
  if (first && first.bookFrom !== EGYPT_LIBRARIES_G6_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_LIBRARIES_G6_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_LIBRARIES_G6_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_LIBRARIES_G6_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every folio readable on a scan names that same scan's page (a stray
 *     number would mean the mapping is wrong);
 *  2. the folios prove the book numbers of the pages that print them;
 *  3. every content page carries real OCR text (not the blank-page placeholder);
 *  4. every lesson's title page prints that lesson's title, and the same page
 *     prints each of the lesson's concepts verbatim — the objectives the app
 *     ships are the book's own words;
 *  5. the book's own فهرس lists every lesson, each row naming it within one
 *     page of the printed truth (the row lag documented above);
 *  6. every printed page in the book is owned by exactly one lesson — no page
 *     can fall between two lessons and be unreachable.
 *
 * A wrong page range is arithmetically tidy but would hide book content from the
 * tutor, so the seeder refuses to run on an unverified table.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const ranges = allLessonRanges();
  let footersChecked = 0;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const pdf = Number(file.slice(6, 9));
    const span = pdfPageToBookPages(pdf);
    if (!span) continue;
    const candidates = folioCandidates(pdf);
    for (const n of candidates) {
      if (n !== span.from) {
        problems.push(`الملزمة ${pdf}: رقم ${n} لا ينتمي إلى صفحتها ${span.from}`);
      }
    }
    for (let book = span.from; book <= span.to; book++) {
      if (book < EGYPT_LIBRARIES_G6_T1_BOOK_START || book > EGYPT_LIBRARIES_G6_T1_BOOK_END) continue;
      printedPages.add(book);
      const text = loadBookPage(book);
      if (!text) {
        problems.push(`صفحة الكتاب ${book}: بلا نص OCR (الملزمة ${pdf})`);
        continue;
      }
      if (!pageHasText(book)) {
        problems.push(`صفحة الكتاب ${book}: بلا نص حقيقي (صفحة فارغة أو فشل مسح)`);
        continue;
      }
      if (candidates.includes(book)) footersChecked++;
    }
  }

  if (printedPages.size !== EGYPT_LIBRARIES_G6_T1_BOOK_END - EGYPT_LIBRARIES_G6_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_LIBRARIES_G6_T1_BOOK_START} و${EGYPT_LIBRARIES_G6_T1_BOOK_END}`,
    );
  }
  if (footersChecked < 15) {
    problems.push(`أرقام الفوتر قليلة (${footersChecked}) — المسار أو القاعدة غير صحيحة`);
  }

  // 4. each lesson's title page prints its title and its concepts.
  EGYPT_LIBRARIES_G6_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحة عنوانه ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      const flat = normalize(opener);
      if (!flat.includes(normalize(lesson.title))) {
        problems.push(`الدرس ${lesson.key}: صفحة عنوانه ${lesson.bookFrom} لا تطبع عنوانه «${lesson.title}»`);
      }
      for (const concept of lesson.concepts) {
        if (!flat.includes(normalize(concept))) {
          problems.push(`الدرس ${lesson.key}: هدف «${concept}» غير مطبوع في صفحة العنوان ${lesson.bookFrom}`);
        }
      }
    });
  });

  // 5. the book's own فهرس lists every lesson (each row within one page of
  // the printed truth — see the التوسع note above).
  const contents = new Map<string, number>();
  const contentsText = loadBookPage(4);
  for (const raw of contentsText.split(/\r?\n/)) {
    const parts = raw.split("|").map((s) => s.trim());
    if (parts.length < 3 || !/^الدرس\s/.test(parts[0]!)) continue;
    const page = Number(toLatinDigits(parts[2]!).replace(/[^\d]/g, ""));
    if (!Number.isFinite(page) || page < 1 || page > 99) continue;
    contents.set(normalize(parts[1]!), page);
  }
  if (contents.size < 12) {
    problems.push(`فهرس الكتاب ناقص: ${contents.size} صفًا (المتوقع ١٢)`);
  }
  EGYPT_LIBRARIES_G6_T1_UNITS.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const key = normalize(lesson.title);
      let got = contents.get(key);
      if (got === undefined) {
        for (const [rowTitle, rowPage] of contents) {
          if (oneLetterApart(rowTitle, key)) {
            got = rowPage;
            break;
          }
        }
      }
      if (got === undefined) {
        problems.push(`فهرس الكتاب لا يسرد الدرس «${lesson.title}»`);
      } else if (got !== lesson.bookFrom && got !== lesson.bookFrom - 1) {
        problems.push(`فهرس الكتاب يضع «${lesson.title}» في الصفحة ${got}، والصفحة المطبوعة تفتحها عند ${lesson.bookFrom}`);
      }
    });
  });

  // 6. every printed page is owned by exactly one lesson.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
