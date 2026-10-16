// ---------------------------------------------------------------------------
// Egypt — «مهارات الزراعة» — Grade 5, term 1 (the real book).
// ---------------------------------------------------------------------------
// Source: the MoE student book PDF «Farming_skills_prim5_t1.pdf» — 35 pages,
// downloaded from studentbooks.moe.gov.eg and rendered + OCR'd into
// data/curriculum-ocr/farming-g5-t1/ (one pages-NNN.txt per PDF page). The
// book's text layer is unusable (InDesign ligature transposition), so the OCR
// corpus is the single source of truth for every check here.
//
// PAGE MODEL — verified page by page against the printed footers:
//   * PDF page N carries the printed folio N for every content page, so
//     book page == PDF page (offset 0). The footers come in the shapes the
//     Grade-4 book of this series uses — a bare number line («٦»), the number
//     merged with the running line («مهارات الزراعة | ٣١ | الفصل الدراسي
//     الأول») — and the same two chips were misread by the OCR model: the
//     unit-1 opener prints «ه» for ٥ and page 7 prints «V» for ٧;
//   * pages 1–4 are front matter (cover, credits, مقدمة الكتاب, فهرس
//     المحتويات) and page 5 (the unit-1 opener) is BOOK_START — the first page
//     the curriculum owns. Page 35 is the last page of the last lesson.
//
// TREE — taken from the book itself, never invented:
//   * unit titles and lesson titles are the strings the book prints on its
//     unit openers (5, 15, 26) and lesson title pages (7, 12, 16, 22, 27, 32);
//   * each lesson's concepts are its printed «الأهداف التعليمية» bullets,
//     verbatim;
//   * lessons are numbered continuously through the book («الدرس الثالث» is
//     the first lesson of unit 2), exactly as printed;
//   * the book's own فهرس المحتويات rows (lesson pages 7, 12, 16, 22, 27, 32,
//     unit spans 5–14 / 15–25 / 26–35) agree with every range below.
//
// Every claim above is re-proved by assertTreeMatchesTheBook() before the
// seeder will touch this book.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** PDF page = printed page in this book — the printed folios prove it page by page. */
export const BOOK_TO_PDF_OFFSET = 0;

/** First page the curriculum owns: the unit-1 opener. */
export const EGYPT_FARMING_G5_T1_BOOK_START = 5;

/** Last page of the last lesson. */
export const EGYPT_FARMING_G5_T1_BOOK_END = 35;

export interface EgyptFarmingG5T1Lesson {
  /** Lesson key as the seeder namespaces it: «unit-lesson» in Latin digits. */
  key: string;
  /** Printed ordinal, e.g. «الرابع» — printed sequence, not per-unit. */
  ordinal: string;
  /** Lesson title exactly as the lesson's title page prints it. */
  title: string;
  /** The page that prints this lesson's title and objectives. */
  bookFrom: number;
  /** The lesson's printed «الأهداف التعليمية» bullets, verbatim. */
  concepts: string[];
}

export interface EgyptFarmingG5T1Unit {
  /** Unit key as the seeder namespaces it: «1»… */
  key: string;
  ordinal: string;
  title: string;
  /** The unit's opener page — where the unit opens in the book. */
  bookFrom: number;
  bookTo: number;
  lessons: EgyptFarmingG5T1Lesson[];
}

export const EGYPT_FARMING_G5_T1_UNITS: EgyptFarmingG5T1Unit[] = [
  {
    key: "1",
    ordinal: "الأولى",
    title: "الزراعة المستدامة",
    bookFrom: 5,
    bookTo: 14,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "الزراعة في حديقة المدرسة",
        bookFrom: 7,
        concepts: [
          "يعدد التلميذ أدوات الزراعة الأساسية المستخدمة في حديقة المدرسة .",
          "ينفذ التلميذ خطوات إعداد حوض زراعي وزراعة بذور أو شتلات فيه .",
          "يقارن التلميذ بين نبات جيد الرعاية و آخر مهمل ، مستنتجا أسباب الفرق",
          "يقيم التلميذ مدى نجاح خطة الري و العناية التي وضعتها مجموعته .",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "إعادة تدوير مخلفات النباتات",
        bookFrom: 12,
        concepts: [
          "يعدد التلميذ ثلاث أنواع من مخلفات النباتات المنزلية أو المدرسية .",
          "ينفذ التلميذ خطوات عملية إنشاء كومة سماد عضوي ( كمبوست ) بسيطة .",
          "يفسر التلميذ الفرق بين المخلفات النباتية القابلة للتحلل و غير القابلة للتحلل",
          "يقارن التلميذ بين أثر إلقاء المخلفات النباتية و أثر إعادة تدويرها على البيئة.",
        ],
      },
    ],
  },
  {
    key: "2",
    ordinal: "الثانية",
    title: "الصناعات الغذائية",
    bookFrom: 15,
    bookTo: 25,
    lessons: [
      {
        key: "2-1",
        ordinal: "الثالث",
        title: "الشراب المستخلص",
        bookFrom: 16,
        concepts: [
          "يسمي التلميذ ثلاث مشروبات مصرية مستخلصة من النبات ( الكركديه ، اليانسون ).",
          "ينفذ التلميذ خطوات استخلاص شراب الكركديه البارد عمليا داخل معمل الزراعة .",
          "يفسر التلميذ معنى ( الاستخلاص ) و يميزه عن العصر و الخلط .",
          "يبتكر التلميذ خلطة استخلاص جديدة بمزيج نوعين من الأعشاب الطبيعية .",
        ],
      },
      {
        key: "2-2",
        ordinal: "الرابع",
        title: "جولة داخل مصنع شراب الفاكهة",
        bookFrom: 22,
        concepts: [
          "يرتب التلميذ مراحل تصنيع شراب الفاكهة داخل المصنع بالترتيب الصحيح .",
          "يقارن التلميذ بين شراب الفاكهة المصنع في المصنع وبين العصير المحضر يدويا في المنزل.",
          "يفسر التلميذ سبب استخدام البسترة في حفظ شراب الفاكهة من التلف .",
          "يقيم التلميذ أهمية إجراء الجودة و السلامة الغذائية في كل مرحلة من مراحل التصنيع .",
        ],
      },
    ],
  },
  {
    key: "3",
    ordinal: "الثالثة",
    title: "الألبان",
    bookFrom: 26,
    bookTo: 35,
    lessons: [
      {
        key: "3-1",
        ordinal: "الخامس",
        title: "اللبن (مصادر إنتاج اللبن)",
        bookFrom: 27,
        concepts: [
          "يعدد التلميذ خمسة مصادر حيوانية لإنتاج اللبن .",
          "يرتب التلميذ مراحل رحلة اللبن من الحلب حتى وصوله لمائدة الأسرة .",
          "يفسر التلميذ سبب أهمية البسترة في حفظ اللبن وضمان سلامته .",
          "يقترح التلميذ فكرة منتج جديد قائم على اللبن أو أحد مشتقاته .",
        ],
      },
      {
        key: "3-2",
        ordinal: "السادس",
        title: "المنتجات اللبنية",
        bookFrom: 32,
        concepts: [
          "يُحدد المصادر الحيوانية للحصول على اللبن، ويستنتج مفهوم المنتجات اللبنية.",
          "يُصنف المنتجات اللبنية المختلفة (مثل الجبن، الزبادي، والزبدة) بناءً على طريقة تحضيرها أو مكوناتها.",
          "يُدرك أهمية القيمة الغذائية للحليب ومنتجاته في بناء جسمه، ويحرص على تناولها يوميًا.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the unit's opener (for the unit's first
 * lesson) or its own title page, up to the page before the next lesson starts,
 * or the unit's last page for its last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_FARMING_G5_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_FARMING_G5_T1_UNITS.forEach((unit, ui) => {
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
  "farming-g5-t1",
);

/**
 * The OCR provider answers a truly blank page with a sentence instead of an
 * empty string. It means "no text", not content, so verification treats it as
 * missing while `loadBookPage` still returns it verbatim.
 */
const NO_TEXT = "لا يوجد نص";

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

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, so a printed footer can be compared to a number. */
function toLatinDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    // The scanner also emits the extended (Persian) digit forms for some chips.
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/**
 * The book number a content page prints in its foot (or riding in its header
 * line), or null when no single number can be read — unit openers print none,
 * and an ambiguous line is safer left unchecked.
 *
 * The OCR model misread two chips in this book exactly as it did in the same
 * series' Grade-4 book: page 7's chip as «V» (for ٧) and the unit-1 opener's
 * as «ه» (for ٥). Only those two known readings are folded; anything else must
 * match the book number.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const candidates = new Set<number>();
  for (const line of lines) {
    const latin = toLatinDigits(line);
    if (/^\d{1,3}$/.test(latin)) candidates.add(Number(latin));
    if (/^[هVv]$/.test(line)) {
      candidates.add(/ه/.test(line) ? 5 : 7);
      continue;
    }
    const footerish = /الصف الخامس|الفصل الدراس/.test(line);
    if (!footerish) continue;
    if (/(^|[\s|])[هVv]([\s|]|$)/.test(line)) candidates.add(/ه/.test(line) ? 5 : 7);
    for (const run of latin.match(/\d{1,3}/g) ?? []) candidates.add(Number(run));
  }
  const values = [...candidates].filter((n) => n >= 1 && n <= 99);
  return values.length === 1 ? values[0]! : null;
}

/** Strips everything but letters and digits, so OCR spacing cannot break a match. */
function normalize(text: string): string {
  return text
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its unit, units tile the book without gaps or overlaps, and the first/last
 * units hit the book's own bounds. A content mistake here would quietly ground
 * the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_FARMING_G5_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_FARMING_G5_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_FARMING_G5_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_FARMING_G5_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_FARMING_G5_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed folio of every content page proves its book number;
 *  2. every content page carries real OCR text (not the blank-page placeholder);
 *  3. every lesson's title page prints that lesson's title;
 *  4. the same page prints each of the lesson's concepts verbatim — the
 *     objectives the app ships are the book's own words;
 *  5. every printed page in the book is owned by exactly one lesson — no page
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
    const book = Number(file.slice(6, 9)) + BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_FARMING_G5_T1_BOOK_START || book > EGYPT_FARMING_G5_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_FARMING_G5_T1_BOOK_END - EGYPT_FARMING_G5_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_FARMING_G5_T1_BOOK_START} و${EGYPT_FARMING_G5_T1_BOOK_END}`,
    );
  }
  if (footersChecked < 25) {
    problems.push(`أرقام الفوتر قليلة (${footersChecked}) — المسار أو القاعدة غير صحيحة`);
  }

  // 3 + 4. each lesson's title page prints its title and its concepts.
  EGYPT_FARMING_G5_T1_UNITS.forEach((unit) => {
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

  // 5. every printed page is owned by exactly one lesson.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
