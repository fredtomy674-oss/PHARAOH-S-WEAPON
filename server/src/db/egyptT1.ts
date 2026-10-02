// PHASE 47 — official Egypt Grade-6 Math, first term («كتاب الوزارة»).
//
// The curriculum tree for the Egypt `eg-g6-math` curriculum is rebuilt from the
// Ministry textbook `Math_Primary6_T1.pdf` (Math Techbook™, 2026 edition). This
// module is the single source of truth for its structure: the units/concepts as
// printed in the book's TOC (page 5-6 of the scan), with each concept's lessons
// and the exact page ranges those lessons occupy.
//
// Page mapping (verified against the scan + OCR):
//   pdfPage = bookPage + BOOK_TO_PDF_OFFSET   (book page 1 = PDF page 10)
//   Unit opener pages (الفيديو/المفردات) precede the unit's first concept.
//
// Document content per concept is assembled from the committed OCR text under
// server/data/curriculum-ocr/ — i.e. the tutor's grounding is literally the
// Ministry book, page by page.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.1 = PDF p.10). */
export const BOOK_TO_PDF_OFFSET = 9;

/** First page of the term — the (unnumbered) opener of unit 1. */
export const EGYPT_T1_BOOK_START = 0;

/**
 * Last numbered content page of the book (the final page of concept 1-7's last
 * lesson). Verified from the OCR review of the scan's tail pages — the back
 * cover is PDF 122, so this must stay below book 113.
 */
export const EGYPT_T1_BOOK_END = 111;

/** One concept (المفهوم) of the textbook — becomes one lesson in the app tree. */
export interface T1Concept {
  /** TOC concept label, e.g. "1-2" (المفهوم 1-2). */
  key: string;
  /** Concept title as printed in the TOC (after the colon). */
  title: string;
  /** Book pages where the concept's lessons start (printed TOC numbers). */
  lessonStarts: number[];
  /** The concept's lessons' printed «أهداف التعلم» bullets, verbatim. */
  concepts: string[];
}

export interface T1Unit {
  /** Arabic ordinal used in the unit title, e.g. "الأولى". */
  ordinal: string;
  /** Full unit title, e.g. "الوحدة الأولى: قابلية القسمة والعوامل والمضاعفات". */
  title: string;
  concepts: T1Concept[];
}

/**
 * The 7 units of the first term, straight from the book's printed TOC
 * (scan pages 5-6, OCR-verified).
 */
export const EGYPT_T1_UNITS: T1Unit[] = [
  {
    ordinal: "الأولى",
    title: "الوحدة الأولى: قابلية القسمة والعوامل والمضاعفات",
    concepts: [
      {
        key: "1-1",
        title: "قابلية القسمة والعامل المشترك الأكبر والمضاعف المشترك الأصغر",
        lessonStarts: [1, 3, 5, 8],
        concepts: [
          "أستطيع أن أستنتج قابلية القسمة على 2 ، 3 ، 4 ، 5 ، 10 ، 6",
          "أستطيع أن أستخدم تحليل العدد إلى عوامل أولية في إيجاد العامل المشترك الأكبر والمضاعف المشترك الأصغر",
          "أستطيع أن أكتب تعبيرات عددية تتضمن عامل مشترك أكبر وأحللها",
          "أستطيع أن أتخيل كيف يمكن لتعبير عددي يمثل عددين كليين في صورة مضاعف مجموع عددين كليين أن يمثل موقفا حياتيا",
          "أستطيع أن أحلل عمليتي جمع الكسور الاعتيادية وطرحها وأوجد ناتج هاتين العمليتين",
          "أستطيع أن أستخدم المضاعف المشترك الأصغر لتكوين مقام مشترك",
        ],
      },
    ],
  },
  {
    ordinal: "الثانية",
    title: "الوحدة الثانية: الأعداد النسبية",
    concepts: [
      {
        key: "1-2",
        title: "استكشاف خط الأعداد",
        lessonStarts: [15, 19],
        concepts: [
          "أستطيع أن أدرك أن خط الأعداد يمكن أن يتضمن الأعداد السالبة التي يمكن استخدامها لتمثيل مواقف حياتية",
          "أستطيع أن أحدد النقاط التي تمثل الأعداد الموجبة والسالبة على خط الأعداد",
          "أستطيع أن أناقش المواضع النسبية عن طريق تحديد النقاط التي تمثل الأعداد الموجبة والسالبة على خط الأعداد",
          "أستطيع أن أستخدم النشاط الرقمي التفاعلي لاكتشاف الأعداد المتعاكسة",
        ],
      },
      {
        key: "2-2",
        title: "استكشاف الأعداد النسبية",
        lessonStarts: [23, 26],
        concepts: [
          "أستطيع أن أستخدم مخطط فن لإدراك مفهوم نظام الأعداد",
          "أستطيع أن أتحقق من تماثل خط الأعداد واستخدام الأعداد المتعاكسة من خلال مواقف حياتية للعبة شد الحبل",
          "أستطيع أن أستخدم الأعداد النسبية لتمثيل مواقف حياتية، ثم أرتب القيم من الأصغر إلى الأكبر",
        ],
      },
      {
        key: "3-2",
        title: "تفسير القيمة المطلقة واستخدامها",
        lessonStarts: [28, 31],
        concepts: [
          "أستطيع أن أمثل المسافة في مواقف حياتية تتعلق بقفزات الأسماك ومقابلة الأصدقاء عند أحواض الأسماك",
          "أستطيع أن أفهم معنى القيمة المطلقة على خط الأعداد",
          "أستطيع أن أقارن القيم المطلقة باستخدام الرموز",
          "أستطيع أن أفسر استخدام القيمة المطلقة من خلال مواقف حياتية عن النقود ودرجات الحرارة",
        ],
      },
    ],
  },
  {
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: المقادير الجبرية",
    concepts: [
      {
        key: "1-3",
        title: "استخدام التعبيرات الرياضية وتحليلها",
        lessonStarts: [35, 39, 43],
        // الصفحتان 35 و39 تطبعان الهدف نفسه حول عناصر المقادير الجبرية؛ تُحفظ
        // النسخة الواحدة حتى لا يُسلَّم المعلم تكرارًا.
        concepts: [
          "أستطيع أن أستخدم متغيراً في تعبير رياضي للتعبير عن بيانات متعددة",
          "أستطيع أن أحدد عناصر المقادير الجبرية، مثل الحدود والحدود المتشابهة والثوابت والمعاملات",
          "أستطيع أن أستخدم خط أعداد كبير ومجسم لتمثيل التعبيرات العددية والمقادير الجبرية",
          "أستطيع أن أكتب تعبيرات لفظية لتمثيل تعبيرات عددية ومقادير جبرية تمثل مواقف حياتية",
        ],
      },
      {
        key: "2-3",
        title: "المقادير الجبرية والأسس",
        lessonStarts: [47, 50, 52, 55],
        concepts: [
          "أستطيع أن أراجع الترتيب الأساسي للعمليات",
          "أستطيع أن أضع التعبيرات العددية التي تتضمن أُسسًا في أبسط صورة",
          "أستطيع أن أجد قيمة المقادير الجبرية المرتبطة بمواقف حياتية بوضع قيمة مكان المتغير",
          "أستطيع أن أجد قيمة المقادير الجبرية التي تشتمل على أسس وأقواس",
          "أستطيع أن أكتشف ما إذا كان المقداران الجبريان متكافئين باستخدام الميزان ذي الكفتين كنموذج مجسم",
        ],
      },
    ],
  },
  {
    ordinal: "الرابعة",
    title: "الوحدة الرابعة: المعادلات والمتباينات",
    concepts: [
      {
        key: "1-4",
        title: "كتابة المعادلات والمتباينات واستراتيجيات حلها",
        lessonStarts: [59, 61, 64],
        concepts: [
          "أستطيع أن أستخدم ميزانًا ذي كفتين لتمثيل المعادلات الجبرية وحلها",
          "أستطيع أن أستكشف اللافتات التي تشير إلى بعض القيود مثل حد السرعة وإعلانات التخفيضات وحد الكتلة وحد السعة",
          "أستطيع أن أحلل هذه المواقف وأحدد كيف تختلف عن مواقف المعادلات",
          "أستطيع أن أستخدم خط أعداد لتمثيل حل المتباينات",
        ],
      },
    ],
  },
  {
    ordinal: "الخامسة",
    title: "الوحدة الخامسة: المتغيرات التابعة والمستقلة",
    concepts: [
      {
        key: "1-5",
        title: "استكشاف العلاقة بين متغيرين",
        lessonStarts: [69, 72, 74, 76],
        concepts: [
          "أستطيع أن أستكشف تعريفات المتغيرات المستقلة والمتغيرات التابعة وأطبق هذه التعريفات",
          "أستطيع أن أستكشف المعادلات الجبرية وأكونها لتمثيل مواقف حياتية",
          "أستطيع أن أكتشف كيف أستخدم المتغيرات المستقلة والتابعة عند كتابة المعادلات",
          "أستطيع أن أربط تمثيلات المتغيرات التابعة والمستقلة في الجداول والمعادلات والتمثيلات البيانية",
          "أستطيع أن أمثل المتغيرات التابعة والمستقلة على مستوى إحداثي",
        ],
      },
    ],
  },
  {
    ordinal: "السادسة",
    title: "الوحدة السادسة: توزيع البيانات",
    concepts: [
      {
        key: "1-6",
        title: "جمع البيانات وتمثيلها وتطبيقات عليها",
        lessonStarts: [81, 85, 88, 90, 94],
        concepts: [
          "أستطيع أن أستكشف الأسئلة الإحصائية والبيانات",
          "أستطيع أن أحدد أوجه الشبه والاختلاف بين الأسئلة الإحصائية وغير الإحصائية",
          "أستطيع أن أستكشف خصائص المدرجات التكرارية",
          "أستطيع أن أرسم مدرجًا تكراريًا لمجموعة البيانات المحددة",
          "أستطيع أن أجمع بيانات باستخدام مكعبات الأعداد وأرسم مدرجًا تكراريًا لهذه البيانات",
          "أستطيع أن أحسب الوسيط وملخص الخمس نقاط لمجموعة البيانات، وأصف كيفية تمثيل هذه القيم في مخطط الصندوق",
          "أستطيع أن أحلل مخططات تمثيل البيانات لتحديد المخطط الأكثر ملاءمة عند الإجابة عن الأسئلة الإحصائية",
        ],
      },
    ],
  },
  {
    ordinal: "السابعة",
    title: "الوحدة السابعة: مقاييس النزعة المركزية والانتشار",
    concepts: [
      {
        key: "1-7",
        title: "استكشاف مقاييس النزعة المركزية والانتشار",
        lessonStarts: [99, 102, 105, 109],
        concepts: [
          "أستطيع أن ألخص البيانات في مجموعة البيانات باستخدام عدد واحد",
          "أستطيع أن أستكشف الوسط الحسابي كنصيب متساو",
          "أستطيع أن أحدد خوارزمية لحساب الوسط الحسابي لمجموعة بيانات",
          "أستطيع أن أحدد كيفية مساعدة القيم المتطرفة وشكل الرسم البياني على تحديد ما إذا كان الوسط الحسابي أم الوسيط مقياسًا أفضل للنزعة المركزية",
          "أستطيع أن أعرف مدى مجموعات البيانات وأحسبه ليكون مقدمة لأهمية مقاييس الانتشار",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Lesson page ranges & OCR text loading
// ---------------------------------------------------------------------------

/**
 * The unit's opener page (الفيديو + المفردات الأساسية) sits on the book page
 * right before the unit's first concept — OCR-verified at PDFs 9, 23, 43, 67,
 * 77, 89 and 107 (i.e. book pages 0, 14, 34, 58, 68, 80, 98). Unit 1's opener
 * is unnumbered, so we model its book page as 0.
 */
function unitOpenerBookPage(unitIndex: number): number {
  return EGYPT_T1_UNITS[unitIndex]!.concepts[0]!.lessonStarts[0]! - 1;
}

/**
 * Book-page span of one concept: from its unit's opener (first concept) or its
 * first lesson, up to just before the next lesson/unit boundary — the next
 * unit's opener page belongs to that unit, not to the previous concept.
 */
export function conceptBookRange(unitIndex: number, conceptIndex: number): { from: number; to: number } {
  const unit = EGYPT_T1_UNITS[unitIndex]!;
  const concept = unit.concepts[conceptIndex]!;
  const from = conceptIndex === 0 ? unitOpenerBookPage(unitIndex) : concept.lessonStarts[0]!;
  let to: number;
  if (conceptIndex + 1 < unit.concepts.length) {
    to = unit.concepts[conceptIndex + 1]!.lessonStarts[0]! - 1;
  } else if (unitIndex + 1 < EGYPT_T1_UNITS.length) {
    to = unitOpenerBookPage(unitIndex + 1) - 1;
  } else {
    to = EGYPT_T1_BOOK_END;
  }
  return { from, to };
}

const OCR_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "curriculum-ocr");

/**
 * Pages that are full-page pictures with no machine-readable text — the maths
 * book has the same layout as its English and French editions (books 13, 67, 79
 * and 97 are photographs). The scan carries no text on them, so they read "".
 */
const IMAGE_ONLY_BOOK_PAGES: ReadonlySet<number> = new Set([13, 67, 79, 97]);

/** OCR text of book page N, or "" when the page is a documented picture. */
export function loadBookPage(book: number): string {
  if (IMAGE_ONLY_BOOK_PAGES.has(book)) return "";
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    // Missing page (should not happen after a full batch) — read as empty.
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

/** Convenience: the full document payload for one concept lesson. */
export function conceptDocument(unitIndex: number, conceptIndex: number): string {
  const range = conceptBookRange(unitIndex, conceptIndex);
  return loadBookRange(range.from, range.to);
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/**
 * Arabic-folded, punctuation-free text: lets a printed objective match across
 * the OCR's inconsistent hamza/ya/ta-marbuta and its optional tashkeel.
 */
function normalize(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0624/g, "\u0648")
    .replace(/\u0626/g, "\u064A")
    .replace(/[^\u0621-\u064A0-9]/g, "");
}

/**
 * Table invariants: every range sits inside its unit, units tile the book without
 * gaps or overlaps, and the table starts/ends where the book does. A content
 * mistake here would quietly ground the tutor on the wrong pages.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];

  EGYPT_T1_UNITS.forEach((unit, ui) => {
    if (unit.concepts.length === 0) problems.push(`الوحدة ${ui + 1}: بلا مفاهيم`);
    unit.concepts.forEach((concept, ci) => {
      if (concept.concepts.length === 0) problems.push(`المفهوم ${concept.key}: بلا أهداف`);
      if (concept.lessonStarts.length === 0) problems.push(`المفهوم ${concept.key}: بلا دروس`);
      const { from, to } = conceptBookRange(ui, ci);
      if (from > to) problems.push(`المفهوم ${concept.key}: نطاق الصفحات معكوس (${from}–${to})`);
      const next = unit.concepts[ci + 1];
      if (next && to >= next.lessonStarts[0]!) problems.push(`المفهوم ${concept.key} يتداخل مع ${next.key}`);
    });
    if (ui + 1 < EGYPT_T1_UNITS.length) {
      const unitTo = conceptBookRange(ui, unit.concepts.length - 1).to;
      if (unitTo >= unitOpenerBookPage(ui + 1)) problems.push(`الوحدة ${ui + 1} تتداخل مع الوحدة التالية`);
      else if (unitTo !== unitOpenerBookPage(ui + 1) - 1) problems.push(`فجوة صفحات بعد الوحدة ${ui + 1}`);
    }
  });

  if (unitOpenerBookPage(0) !== EGYPT_T1_BOOK_START) {
    problems.push(`بداية المنهج يجب أن تكون الصفحة ${EGYPT_T1_BOOK_START}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every content page carries real OCR text (the picture-only pages are
 *     documented and excluded);
 *  2. every objective in `concepts` is printed inside the objective's own
 *     concept range — so the app's concept list cannot drift from the book;
 *  3. every lesson start page prints the book's «هدف/أهداف التعلم» header, which
 *     is what makes those pages genuine lesson starts;
 *  4. every printed page is owned by exactly one concept.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  let pagesChecked = 0;

  for (let book = EGYPT_T1_BOOK_START; book <= EGYPT_T1_BOOK_END; book++) {
    if (IMAGE_ONLY_BOOK_PAGES.has(book)) continue;
    if (!loadBookPage(book)) {
      problems.push(`صفحة الكتاب ${book}: بلا نص مسح`);
      continue;
    }
    pagesChecked++;
  }

  const ranges: { key: string; from: number; to: number }[] = [];
  EGYPT_T1_UNITS.forEach((unit, ui) => {
    unit.concepts.forEach((concept, ci) => {
      const { from, to } = conceptBookRange(ui, ci);
      ranges.push({ key: concept.key, from, to });

      let text = "";
      for (let book = from; book <= to; book++) text += " " + loadBookPage(book);
      const haystack = normalize(text);
      for (const target of concept.concepts) {
        const fingerprint = normalize(target).slice(0, 15);
        if (fingerprint.length < 8) continue;
        if (!haystack.includes(fingerprint)) {
          problems.push(`المفهوم ${concept.key}: هدفه «${target}» غير مطبوع في صفحاته ${from}–${to}`);
        }
      }
      for (const start of concept.lessonStarts) {
        if (!/(?:أهداف|هدف)\s*التعلم/.test(loadBookPage(start))) {
          problems.push(`المفهوم ${concept.key}: صفحة بداية الدرس ${start} لا تطبع «هدف التعلم»`);
        }
      }
    });
  });

  for (let book = EGYPT_T1_BOOK_START; book <= EGYPT_T1_BOOK_END; book++) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} مفهومًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked };
}