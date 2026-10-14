// PHASE 87 — الصف الثانى الإعدادى (الفصل الأول) — اللغة العربية
// («كتاب الوزارة»، طبعة 2026/2027).
//
// المنهج `eg-g8-arabic` مبنى من كتاب الوزارة (162 صفحة مسح ضوئى، OCR مكتمل
// فى `server/data/curriculum-ocr/arabic-p2-t1/`). هذا الملف هو المصدر الوحيد
// لهيكله: المراجعة العامة ثم الوحدات الثلاث كما يطبعها الفهرس، كل درس
// بمكوّناته وصفحاته المطبوعة.
//
// تخطيط الصفحات (مثبت من الفوتر المطبوع، book = pdf − 1):
//   مراجعة عامة: 6–9، الوحدة الأولى (انتمائي قوتي): 10–55،
//   الوحدة الثانية (بيئتي مسئوليتي): 56–104، الوحدة الثالثة (علم وقيم): 105–148.
//   الملحق (149–159): نصوص الاستماع (149–155) + تقييمات الوحدات (156–158) + مذكرات (159).
// درس الاستماع يملك نصه من الملحق عبر `extraBookPages`.
// درس التطبيق هو «الدرس» المطبوع فى الكتاب، لا الوحدة: صدر الوحدة يركب مع
// درسها الأول، وحصاد الوحدة مع درسها الأخير.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** رقم صفحة الكتاب N ↔ ملف PDF رقم N + OFFSET (مثبت: كتاب 10 = ملف 011). */
export const BOOK_TO_PDF_OFFSET = 1;

/** أول صفحة محتوى للترم — صدر المراجعة العامة. */
export const EGYPT_ARABIC_G8_T1_BOOK_START = 6;

/** آخر صفحة محتوى — حصاد الوحدة الثالثة. */
export const EGYPT_ARABIC_G8_T1_BOOK_END = 148;

/** الملحق الخلفى للكتاب، خارج نطاقات الدروس (بأرقام الكتاب). */
export const EGYPT_ARABIC_G8_T1_APPENDIX = {
  /** «نصوص الاستماع» — نصوص دروس الاستماع الثلاثة. */
  listening: { from: 149, to: 155 },
  /** «تقييمات الوحدات» + «مذكرات» — ملحق عام لا يتبع درسًا واحدًا. */
  rest: { from: 156, to: 159 },
} as const;

/** مكوّن واحد من الدرس — كما يطبعه الكتاب. */
export interface ArabicG8Concept {
  /** أول صفحة كتاب يطبع عليها المكوّن. */
  bookFrom: number;
  /** نوع المكوّن كما يسميه الكتاب. */
  kind: string;
  /** عنوان المكوّن كما يطبعه الكتاب. */
  title: string;
}

/** درس واحد من الكتاب — يصبح درسًا فى شجرة التطبيق. */
export interface ArabicG8Lesson {
  /** مفتاح الدرس، مثل "1-1" أو "rev-1". */
  key: string;
  /** ترتيب الدرس كما يطبعه الكتاب، مثل "الأول". */
  ordinal: string;
  /** نوع الدرس، مثل "الاستماع" أو "القراءة". */
  type: string;
  /** عنوان الدرس الكامل. */
  title: string;
  /** مكوّنات الدرس المطبوعة بترتيبها. */
  concepts: ArabicG8Concept[];
  /** صفحات الملحق التى يشير إليها الدرس (نص الاستماع). */
  extraBookPages?: number[];
}

/** قسم مطبوع من الكتاب — مراجعة أو وحدة. */
export interface ArabicG8Unit {
  kind: "unit" | "review";
  /** ترتيب القسم، مثل "الأولى". */
  ordinal: string;
  /** عنوان القسم كما يطبعه الكتاب. */
  title: string;
  /** أول صفحة للقسم (صفحة الصدور). */
  bookFrom: number;
  /** آخر صفحة للقسم (صفحة الحصاد/الختام). */
  bookTo: number;
  lessons: ArabicG8Lesson[];
}

/**
 * الكتاب بترتيب الطباعة: مراجعة عامة (6–9)، ثم الوحدات الثلاث
 * (10–55، 56–104، 105–148). عناوين الدروس من قوائم صدور الوحدات نفسها.
 */
export const EGYPT_ARABIC_G8_T1_UNITS: ArabicG8Unit[] = [
  {
    kind: "review",
    ordinal: "",
    title: "مراجعة عامة",
    bookFrom: 6,
    bookTo: 9,
    lessons: [
      {
        key: "rev-1",
        ordinal: "",
        type: "مراجعة",
        title: "مراجعة عامة",
        concepts: [{ bookFrom: 6, kind: "مراجعة", title: "مراجعة عامة" }],
      },
    ],
  },
  {
    kind: "unit",
    ordinal: "الأولى",
    title: "الوحدة الأولى: انتمائي قوتي",
    bookFrom: 10,
    bookTo: 55,
    lessons: [
      {
        key: "1-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "الدرس الأول (الاستماع): سيدة المقاومة المصرية «آمنة دهشان»",
        concepts: [{ bookFrom: 11, kind: "الاستماع", title: "سيدة المقاومة المصرية «آمنة دهشان»" }],
        extraBookPages: [149, 150, 151],
      },
      {
        key: "1-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "الدرس الثاني (القراءة): العبور إلى المستقبل «حرب أكتوبر»",
        concepts: [
          { bookFrom: 15, kind: "القراءة", title: "العبور إلى المستقبل «حرب أكتوبر»" },
          { bookFrom: 22, kind: "القواعد النحوية", title: "المعرب والمبني من الأسماء والحروف" },
          { bookFrom: 25, kind: "القواعد الإملائية", title: "الألف اللينة في الأسماء" },
          { bookFrom: 27, kind: "التحدث", title: "موضوعات وقضايا مرتبطة بالدرس" },
          { bookFrom: 28, kind: "الكتابة", title: "كتابة مقال وصف مكان" },
        ],
      },
      {
        key: "1-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "الدرس الثالث (القراءة): من صقور الوطنية «محمد مبروك»",
        concepts: [
          { bookFrom: 32, kind: "القراءة", title: "من صقور الوطنية «محمد مبروك»" },
          { bookFrom: 36, kind: "القواعد النحوية", title: "المعرب والمبني من الأفعال" },
          { bookFrom: 39, kind: "القواعد الإملائية", title: "الألف اللينة في الأفعال" },
          { bookFrom: 40, kind: "التحدث", title: "موضوعات وقضايا مرتبطة بالدرس" },
          { bookFrom: 41, kind: "الكتابة", title: "تطبيقات على كتابة مقال وصف مكان" },
        ],
      },
      {
        key: "1-4",
        ordinal: "الرابع",
        type: "النص الشعري",
        title: "الدرس الرابع (النص الشعري): مصر التي في خاطري",
        concepts: [{ bookFrom: 44, kind: "النص الشعري", title: "مصر التي في خاطري" }],
      },
    ],
  },
  {
    kind: "unit",
    ordinal: "الثانية",
    title: "الوحدة الثانية: بيئتي مسئوليتي",
    bookFrom: 56,
    bookTo: 104,
    lessons: [
      {
        key: "2-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "الدرس الأول (الاستماع): أقدم وديعة في يد المصري",
        concepts: [{ bookFrom: 57, kind: "الاستماع", title: "أقدم وديعة في يد المصري" }],
        extraBookPages: [152, 153],
      },
      {
        key: "2-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "الدرس الثاني (القراءة): من أجل غد",
        concepts: [
          { bookFrom: 62, kind: "القراءة", title: "من أجل غد" },
          { bookFrom: 70, kind: "القواعد النحوية", title: "الضمائر البارزة والمستترة" },
          { bookFrom: 75, kind: "القواعد الإملائية", title: "الألف اللينة في الحروف" },
          { bookFrom: 76, kind: "التحدث", title: "موضوعات وقضايا مرتبطة بالدرس" },
          { bookFrom: 77, kind: "الكتابة", title: "كتابة الخطبة الإقناعية" },
        ],
      },
      {
        key: "2-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "الدرس الثالث (القراءة): واحة مصرية صديقة للبيئة: مدينة الخارجة",
        concepts: [
          { bookFrom: 81, kind: "القراءة", title: "واحة مصرية صديقة للبيئة: مدينة الخارجة" },
          { bookFrom: 86, kind: "القواعد النحوية", title: "أدوات الشرط الجازمة" },
          { bookFrom: 88, kind: "القواعد الإملائية", title: "تطبيقات على الألف اللينة" },
          { bookFrom: 89, kind: "التحدث", title: "موضوعات وقضايا مرتبطة بالدرس" },
          { bookFrom: 90, kind: "الكتابة", title: "تطبيقات على كتابة الخطبة الإقناعية" },
        ],
      },
      {
        key: "2-4",
        ordinal: "الرابع",
        type: "النص الشعري",
        title: "الدرس الرابع (النص الشعري): ريفنا المصري",
        concepts: [{ bookFrom: 93, kind: "النص الشعري", title: "ريفنا المصري" }],
      },
    ],
  },
  {
    kind: "unit",
    ordinal: "الثالثة",
    title: "الوحدة الثالثة: علم وقيم",
    bookFrom: 105,
    bookTo: 148,
    lessons: [
      {
        key: "3-1",
        ordinal: "الأول",
        type: "الاستماع",
        title: "الدرس الأول (الاستماع): إنسان أم ظل إنسان",
        concepts: [{ bookFrom: 106, kind: "الاستماع", title: "إنسان أم ظل إنسان" }],
        extraBookPages: [154, 155],
      },
      {
        key: "3-2",
        ordinal: "الثاني",
        type: "القراءة",
        title: "الدرس الثاني (القراءة): عندما يصبح العلم رسالة (الخوارزمي)",
        concepts: [
          { bookFrom: 110, kind: "القراءة", title: "عندما يصبح العلم رسالة (الخوارزمي)" },
          { bookFrom: 116, kind: "القواعد النحوية", title: "أدوات الشرط غير الجازمة" },
          { bookFrom: 118, kind: "القواعد الإملائية", title: "التاء المربوطة والتاء المفتوحة والهاء" },
          { bookFrom: 120, kind: "التحدث", title: "موضوعات وقضايا مرتبطة بالدرس" },
          { bookFrom: 121, kind: "الكتابة", title: "تطبيقات على كتابة مقال وصف مكان" },
        ],
      },
      {
        key: "3-3",
        ordinal: "الثالث",
        type: "القراءة",
        title: "الدرس الثالث (القراءة): القراءة حياة",
        concepts: [
          { bookFrom: 124, kind: "القراءة", title: "القراءة حياة" },
          { bookFrom: 131, kind: "القواعد النحوية", title: "مراجعة على دروس النحو المقررة" },
          { bookFrom: 134, kind: "القواعد الإملائية", title: "تطبيقات التاء المربوطة والتاء المفتوحة والهاء" },
          { bookFrom: 135, kind: "التحدث", title: "موضوعات وقضايا مرتبطة بالدرس" },
          { bookFrom: 136, kind: "الكتابة", title: "تطبيقات على كتابة الخطبة الإقناعية" },
        ],
      },
      {
        key: "3-4",
        ordinal: "الرابع",
        type: "النص الشعري",
        title: "الدرس الرابع (النص الشعري): الجد سبيل المعالي",
        concepts: [{ bookFrom: 139, kind: "النص الشعري", title: "الجد سبيل المعالي" }],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// نطاقات الصفحات
// ---------------------------------------------------------------------------

/**
 * نطاق صفحات الكتاب التى يملكها الدرس: من صدر القسم (لأول درس) أو من صفحة
 * الدرس نفسه، حتى صفحة ما قبل الدرس التالى، أو نهاية القسم لآخر درس.
 */
export function lessonBookRange(unitIndex: number, lessonIndex: number): { from: number; to: number } {
  const unit = EGYPT_ARABIC_G8_T1_UNITS[unitIndex]!;
  const lesson = unit.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? unit.bookFrom : lesson.concepts[0]!.bookFrom;
  const next = unit.lessons[lessonIndex + 1];
  const to = next ? next.concepts[0]!.bookFrom - 1 : unit.bookTo;
  return { from, to };
}

/** كل نطاقات الدروس مسطحة — للاختبارات والتدقيق. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ARABIC_G8_T1_UNITS.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(ui, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * صفحات الملحق التى يشير إليها كل درس، بمفتاح الدرس (`1-1` → `[149, 150, 151]`).
 * دروس الاستماع تطبع التدريبات دون النص؛ النص فى الملحق الخلفى.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const unit of EGYPT_ARABIC_G8_T1_UNITS) {
    for (const lesson of unit.lessons) {
      if (lesson.extraBookPages?.length) out.set(lesson.key, [...lesson.extraBookPages]);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// تحميل نص الـ OCR
// ---------------------------------------------------------------------------

const OCR_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "curriculum-ocr",
  "arabic-p2-t1",
);

/** نص OCR لصفحة كتاب مطبوعة واحدة، أو "" إن لم تكن ممسوحة. */
export function loadBookPage(book: number): string {
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

/** تحميل ودمج نص OCR لنطاق صفحات كتاب فى مستند واحد. */
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

/**
 * حمولة المستند الكاملة لدرس واحد: نطاقه المملوك ثم صفحات الملحق التى
 * يشير إليها (نصوص الاستماع). صفحات الدرس نفسه أولًا.
 */
export function lessonDocument(unitIndex: number, lessonIndex: number): string {
  const range = lessonBookRange(unitIndex, lessonIndex);
  const lesson = EGYPT_ARABIC_G8_T1_UNITS[unitIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(range.from, range.to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// فحوص ذاتية
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** أرقام عربية مشرقية → لاتينية، لمقارنة الفوتر المطبوع بالرقم. */
function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * طيّ النص للمقارنة: يحذف التطويل والتشكيل، ويوحّد صور الألف/الياء/التاء
 * التى يطبعها الكتاب بلا اتساق، ويزيل كل غير الحروف والأرقام.
 */
function normalize(text: string): string {
  return text
    .replace(/\u0640/g, "")
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * العبارة التى تطبعها صفحة بداية المكوّن لنوعه.
 */
const KIND_MARKER: Record<string, string> = {
  الاستماع: "استماع",
  القراءة: "قراءة",
  "النص الشعري": "شعر",
  "القواعد النحوية": "القواعد النحوية",
  "القواعد الإملائية": "القواعد الإملائية",
  التحدث: "التحدث",
  الكتابة: "التعبير الكتابي",
};

/**
 * رقم الكتاب الذى تطبعه الصفحة فى سطرها الأخير، أو null إن لم يحمل السطر
 * الأخير رقم صفحة. فوتر هذا الكتاب يحمل اسم القسم بجانب الرقم.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  if (!last || last.length > 80) return null;
  const runs = last.match(/[٠-٩0-9]+/g);
  if (!runs || runs.length !== 1) return null;
  const digits = toLatinDigits(runs[0]!).replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return n > 0 ? n : null;
}

/**
 * صفحات المحتوى التى أساء الـ OCR قراءة فوترها، والقيمة المطبوعة بدلًا منها —
 * مقاسة لا مخمّنة. كل فوتر آخر مقروء يطابق رقم صفحته تمامًا.
 */
export const FOOTER_OCR_MISREADS: Readonly<Record<number, number>> = {};

/**
 * ثوابت الجدول: مفاتيح الدروس فريدة، وكل نطاق داخل قسمه، وصفحات المكوّنات
 * متصاعدة داخل درسها، والأقسام تبلّط الكتاب بلا فجوات أو تداخلات، وأول/آخر
 * قسم يطابق حدّى الكتاب.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const units = EGYPT_ARABIC_G8_T1_UNITS;
  const keys = new Set<string>();

  units.forEach((unit, ui) => {
    if (unit.lessons.length === 0) problems.push(`القسم ${unit.title}: بلا دروس`);
    unit.lessons.forEach((lesson, li) => {
      if (keys.has(lesson.key)) problems.push(`مفتاح درس مكرر: «${lesson.key}»`);
      keys.add(lesson.key);
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا مكوّنات`);
      if (lesson.concepts[0]!.kind !== lesson.type) {
        problems.push(`الدرس ${lesson.key}: نوعه «${lesson.type}» لا يطابق أول مكوّن «${lesson.concepts[0]!.kind}»`);
      }

      const lessonStart = lesson.concepts[0]!.bookFrom;
      const minStart = li === 0 ? unit.bookFrom : unit.bookFrom + 1;
      if (lessonStart < minStart || lessonStart > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lessonStart} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }

      lesson.concepts.forEach((concept, ci) => {
        if (!KIND_MARKER[concept.kind] && concept.kind !== "مراجعة") {
          problems.push(`الدرس ${lesson.key}: نوع مكوّن غير معروف «${concept.kind}»`);
        }
        if (concept.bookFrom < unit.bookFrom || concept.bookFrom > unit.bookTo) {
          problems.push(`الدرس ${lesson.key} المكوّن ${ci + 1}: صفحته ${concept.bookFrom} خارج نطاق القسم`);
        }
        const prev = lesson.concepts[ci - 1];
        if (prev && concept.bookFrom <= prev.bookFrom) {
          problems.push(
            `الدرس ${lesson.key}: صفحات المكوّنات غير تصاعدية (${prev.bookFrom} ثم ${concept.bookFrom})`,
          );
        }
      });

      const { from, to } = lessonBookRange(ui, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < unit.bookFrom || to > unit.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${unit.bookFrom}–${unit.bookTo}`);
      }
      const lastConcept = lesson.concepts.at(-1)!;
      if (lastConcept.bookFrom < from || lastConcept.bookFrom > to) {
        problems.push(`الدرس ${lesson.key}: مكوّنه الأخير ${lastConcept.bookFrom} خارج نطاقه ${from}–${to}`);
      }
      const next = unit.lessons[li + 1];
      if (next && to >= next.concepts[0]!.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== unit.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر القسم ${unit.bookFrom}، وجدنا ${from}`);
      }
      for (const page of lesson.extraBookPages ?? []) {
        if (page < EGYPT_ARABIC_G8_T1_APPENDIX.listening.from || page > EGYPT_ARABIC_G8_T1_APPENDIX.rest.to) {
          problems.push(
            `الدرس ${lesson.key}: صفحة ملحقة ${page} خارج ملحق الكتاب ${EGYPT_ARABIC_G8_T1_APPENDIX.listening.from}–${EGYPT_ARABIC_G8_T1_APPENDIX.rest.to}`,
          );
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
  if (first && first.bookFrom !== EGYPT_ARABIC_G8_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ARABIC_G8_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ARABIC_G8_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ARABIC_G8_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * الفحص القوى، ضد الكتاب نفسه:
 *  1. فوتر كل صفحة محتوى يثبت رقمها (مع استثناءات OCR المقاسة)؛
 *  2. صفحة صدور كل قسم تطبع عنوانه، وصفحة كل درس تطبع «الدرس …»، وصفحة كل
 *     مكوّن تطبع نوعه؛
 *  3. صفحات ملحق كل درس استماع تطبع عنوان الدرس؛
 *  4. كل صفحة مطبوعة فى [6، 148] يملكها درس واحد بالضبط.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const ranges = allLessonRanges();
  let footersChecked = 0;

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ARABIC_G8_T1_BOOK_START || book > EGYPT_ARABIC_G8_T1_BOOK_END) continue;
    printedPages.add(book);
    const text = loadBookPage(book);
    if (!text) continue;
    const footer = printedFooter(book);
    if (footer !== null) {
      footersChecked++;
      const misread = FOOTER_OCR_MISREADS[book];
      if (footer !== book && footer !== misread) {
        problems.push(`صفحة الكتاب ${book}: الفوتر المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_ARABIC_G8_T1_BOOK_END - EGYPT_ARABIC_G8_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ARABIC_G8_T1_BOOK_START} و${EGYPT_ARABIC_G8_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  EGYPT_ARABIC_G8_T1_UNITS.forEach((unit) => {
    // صدر القسم يطبع عنوان القسم؛ نطابق الاسم المميز (بعد «الوحدة الأولى:»)
    // لأن الترتيب والفوتر يثبتان الصدر، والـ OCR قد يخطئ حرفًا واحدًا فى
    // الترويسة (مقاس: صدر الوحدة الأولى يطبع «الوحدة» فيقرؤها «الودحة»).
    const distinctive = unit.title.includes(":")
      ? unit.title.split(":").slice(1).join(":").trim()
      : unit.title;
    const unitOpener = loadBookPage(unit.bookFrom);
    if (!unitOpener) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} بلا نص OCR`);
    } else if (!normalize(unitOpener).includes(normalize(distinctive))) {
      problems.push(`القسم ${unit.title}: صفحة صدوره ${unit.bookFrom} لا تطبع عنوانه`);
    }

    unit.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.concepts[0]!.bookFrom);
      const head = unit.kind === "review" ? "مراجعة عامة" : `الدرس ${lesson.ordinal}`;
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.concepts[0]!.bookFrom} بلا نص OCR`);
      } else if (!normalize(opener).includes(normalize(head))) {
        problems.push(
          `الدرس ${lesson.key}: صفحته الأولى ${lesson.concepts[0]!.bookFrom} لا تطبع «${head}»`,
        );
      }

      if (unit.kind !== "review") {
        lesson.concepts.forEach((concept) => {
          const marker = KIND_MARKER[concept.kind] ?? "";
          const page = loadBookPage(concept.bookFrom);
          if (!page) {
            problems.push(`الدرس ${lesson.key}: مكوّن «${concept.title}» صفحته ${concept.bookFrom} بلا نص OCR`);
          } else if (marker && !normalize(page).includes(normalize(marker))) {
            problems.push(
              `الدرس ${lesson.key}: صفحة المكوّن ${concept.bookFrom} لا تطبع «${marker}»`,
            );
          }
        });
      }

      const extras = lesson.extraBookPages ?? [];
      if (extras.length) {
        const texts = extras.map((page) => loadBookPage(page));
        extras.forEach((page, i) => {
          if (!texts[i]) problems.push(`الدرس ${lesson.key}: صفحة الملحق ${page} بلا نص OCR`);
        });
        if (lesson.type === "الاستماع") {
          const passageTitle = lesson.title.replace(/^الدرس \S+ \([^)]+\):\s*/, "");
          if (!normalize(texts.join("\n")).includes(normalize(passageTitle))) {
            problems.push(`الدرس ${lesson.key}: صفحات الملحق ${extras.join(",")} لا تطبع عنوان الدرس`);
          }
        }
      }
    });
  });

  // كل صفحة محتوى مطبوعة يملكها درس واحد بالضبط.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
