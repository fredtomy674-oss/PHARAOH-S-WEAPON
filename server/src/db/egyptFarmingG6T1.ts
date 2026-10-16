// ---------------------------------------------------------------------------
// Egypt — «مهارات الزراعة» — Grade 6, term 1 (the real book).
// ---------------------------------------------------------------------------
// Source: the MoE student book PDF «Farming_skills_prim6_t1.pdf» — 41 pages,
// downloaded from studentbooks.moe.gov.eg and rendered + OCR'd into
// data/curriculum-ocr/farming-g6-t1/ (one pages-NNN.txt per PDF page). The
// book's text layer is unusable (InDesign ligature transposition), so the OCR
// corpus is the single source of truth for every check here.
//
// PAGE MODEL — verified page by page against the printed footers:
//   * PDF page N carries the printed folio N for every content page, so
//     book page == PDF page (offset 0). The footers come in the two shapes the
//     series uses — a bare number line («٣٢»), the number merged with the
//     running line («مهارات الزراعة ٣٥ الفصل الدراسي الأول») — and the OCR
//     model misread the frontispiece's chip as «ه» (for ٥), the same misread
//     the Grade-4 and Grade-5 books of this series needed folded. (The series
//     also misreads some ٧ chips as «V»; folded for the same reason although
//     this book's scans do not produce it.)
//   * pages 1–5 are front matter: the cover, the team page (folio 2), مقدمة
//     الكتاب (folio 3), المحتوى (folio 4) and the decorative «مجمع الدروس»
//     montage (folio 5 — MoE reused the Grade-5 artwork; not teaching);
//   * the curriculum owns printed pages 6–41: the unit-1 opener (6) opens the
//     book and the last lesson ends on page 41, the book's last page — there
//     is no back matter;
//   * unlike the other skills books of the series, the unit openers DO print
//     their own folios (6, 17, 23, 29, 35), and the lessons are numbered
//     continuously «الدرس الأول»…«الدرس السادس» through the term;
//   * the book's own contents page lists the six lessons on pages 7, 13, 18,
//     24, 30 and 36 — the exact pages this table claims (it shortens two unit
//     titles: «النحل» for the opener's «نحل العسل»).
//
// Every claim above is re-proved by assertTreeMatchesTheBook() before the
// seeder will touch this book.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Printed pages and scan pages are the same number in this book. */
export const BOOK_TO_PDF_OFFSET = 0;

/** First page the curriculum owns: the unit-1 opener. */
export const EGYPT_FARMING_G6_T1_BOOK_START = 6;

/** Last page of the last lesson (the book's own last page — no back matter). */
export const EGYPT_FARMING_G6_T1_BOOK_END = 41;

export interface EgyptFarmingG6T1Lesson {
  /** Lesson key as the seeder namespaces it: «unit-lesson» — per-unit numbering. */
  key: string;
  /** Printed ordinal, e.g. «الأول» — the book numbers lessons continuously. */
  ordinal: string;
  /** Lesson title exactly as the lesson's title page prints it. */
  title: string;
  /** The page that prints this lesson's title and objectives. */
  bookFrom: number;
  /** The lesson's printed «الأهداف التعليمية» bullets, verbatim. */
  concepts: string[];
}

export interface EgyptFarmingG6T1Unit {
  /** Unit key as the seeder namespaces it: «1»… */
  key: string;
  ordinal: string;
  title: string;
  /** The unit's opener page — where the unit opens in the book. */
  bookFrom: number;
  bookTo: number;
  lessons: EgyptFarmingG6T1Lesson[];
}

export const EGYPT_FARMING_G6_T1_UNITS: EgyptFarmingG6T1Unit[] = [
  {
    key: "1",
    ordinal: "الأولى",
    title: "نباتات الزينة",
    bookFrom: 6,
    bookTo: 16,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        title: "زراعة النباتات المزهرة",
        bookFrom: 7,
        concepts: [
          "يُعَدِّد الطالب أجزاء الزهرة الرئيسية (الكأس - التويج - الأسدية - المدقة).",
          "يشرح الطالب دورة حياة النبات المزهر من البذرة إلى الإزهار.",
          "يطبّق الطالب خطوات زراعة شتلة نبات مزهر في أصيص بطريقة صحيحة.",
          "يُقَيِّم الطالب مدى ملاءمة عوامل بيئية معينة (ضوء - ماء - تربة) لنمو نبات مزهر محدد.",
        ],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        title: "فن تنسيق الأزهار",
        bookFrom: 13,
        concepts: [
          "يذكر التلميذ اسمين من أدوات تنسيق الزهور المستخدمة في عمل الباقات.",
          "يوضح التلميذ أسس اختيار الألوان المتناسقة عند تنسيق باقة زهور.",
          "يطبق التلميذ خطوات عمل باقة زهور بسيطة باستخدام أزهار وأوراق متاحة.",
          "يصمم التلميذ باقة زهور بتشكيل خاص به يعبر عن مناسبة معينة.",
        ],
      },
    ],
  },
  {
    key: "2",
    ordinal: "الثانية",
    title: "الصناعات الغذائية",
    bookFrom: 17,
    bookTo: 22,
    lessons: [
      {
        key: "2-1",
        ordinal: "الثالث",
        title: "المربى",
        bookFrom: 18,
        concepts: [
          "يُعدد التلميذ ثلاثة أنواع من الفاكهة الصالحة لتصنيع المربى.",
          "يشرح التلميذ دور السكر في حفظ المربى من التلف.",
          "يشارك التلميذ في تحضير عينة مربى بسيطة وفق خطوات آمنة.",
          "يحكم التلميذ على جودة المربى المُحضّرة بمعايير محددة.",
        ],
      },
    ],
  },
  {
    key: "3",
    ordinal: "الثالثة",
    title: "الألبان",
    bookFrom: 23,
    bookTo: 28,
    lessons: [
      {
        key: "3-1",
        ordinal: "الرابع",
        title: "اللبن الزبادي المُطعّم",
        bookFrom: 24,
        concepts: [
          "يُعرّف اللبن الزبادي ويذكر أنواع النكهات الطبيعية المستخدمة في تطعيمه.",
          "يشرح دور البكتيريا النافعة في تخمّر اللبن وتحوّله إلى زبادي.",
          "يُنفّذ خطوات تحضير الزبادي المطعّم عمليًا باتباع إجراءات السلامة والتعقيم.",
          "يُقيّم جودة المنتج النهائي من حيث القوام والطعم ومدة الصلاحية.",
        ],
      },
    ],
  },
  {
    key: "4",
    ordinal: "الرابعة",
    title: "الزراعة المستدامة",
    bookFrom: 29,
    bookTo: 34,
    lessons: [
      {
        key: "4-1",
        ordinal: "الخامس",
        title: "السياحة الزراعية",
        bookFrom: 30,
        concepts: [
          "يُعرّف الطالب مفهوم السياحة الزراعية.",
          "يوضح الطالب أهمية السياحة الزراعية اقتصاديًا وبيئيًا وتعليميًا.",
          "يقارن الطالب بين موقعين سياحيين زراعيين من حيث نقاط القوة والجذب.",
          "يقيم التلميذ مدى صلاحية موقع معين ( كالحديقة المدرسية ) لإقامة نشاط سياحي زراعي بسيط",
        ],
      },
    ],
  },
  {
    key: "5",
    ordinal: "الخامسة",
    title: "نحل العسل",
    bookFrom: 35,
    bookTo: 41,
    lessons: [
      {
        key: "5-1",
        ordinal: "السادس",
        title: "تربية النحل",
        bookFrom: 36,
        concepts: [
          "يُعدد أفراد طائفة النحل (ملكة - شغالات - ذكور).",
          "يشرح دورة حياة النحلة ووظيفة كل فرد في الخلية.",
          "يقارن بين عسل النحل الطبيعي ومنتجات النحل الأخرى (الشمع، الغذاء الملكي، صمغ النحل).",
          "يُقيم أهمية النحل في تلقيح النباتات وأثره على الإنتاج الزراعي.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the unit's opener page (for the first
 * lesson of a unit) or its own title page, up to the page before the next
 * lesson starts, or the unit's last page for its last lesson.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_FARMING_G6_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_FARMING_G6_T1_UNITS.forEach((unit, ui) => {
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
  "farming-g6-t1",
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
 * line), or null when no single number can be read — an ambiguous line is
 * safer left unchecked.
 *
 * The OCR model misread the frontispiece's chip as «ه» (for ٥) — the same
 * misread the same series' Grade-4 and Grade-5 books needed folded; the series
 * also misreads some ٧ chips as «V», folded for the same reason. Only those two
 * known readings are folded; anything else must match the book number.
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
    const footerish = /الصف السادس|الفصل الدراس/.test(line);
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
  const units = EGYPT_FARMING_G6_T1_UNITS;

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
  if (first && first.bookFrom !== EGYPT_FARMING_G6_T1_BOOK_START) {
    problems.push(`الوحدة الأولى يجب أن تبدأ من الصفحة ${EGYPT_FARMING_G6_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_FARMING_G6_T1_BOOK_END) {
    problems.push(`الوحدة الأخيرة يجب أن تنتهي عند الصفحة ${EGYPT_FARMING_G6_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed folio of every content page proves its book number (with the
 *     two known chip misreads folded);
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
    if (book < EGYPT_FARMING_G6_T1_BOOK_START || book > EGYPT_FARMING_G6_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_FARMING_G6_T1_BOOK_END - EGYPT_FARMING_G6_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_FARMING_G6_T1_BOOK_START} و${EGYPT_FARMING_G6_T1_BOOK_END}`,
    );
  }
  if (footersChecked < 32) {
    problems.push(`أرقام الفوتر قليلة (${footersChecked}) — المسار أو القاعدة غير صحيحة`);
  }

  // 3 + 4. each lesson's title page prints its title and its concepts.
  EGYPT_FARMING_G6_T1_UNITS.forEach((unit) => {
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
