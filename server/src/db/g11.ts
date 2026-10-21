/**
 * PHASE 185 — shared shape for the Secondary-2 (G11) first-term books.
 *
 * The 2026/2027 Ministry books are scanned, so the G11 import starts from the
 * official printed tables of contents (OCR'd from the Ministry PDFs) rather than
 * inventing a syllabus. Each book module owns its units/lessons and a short,
 * original teaching guide per lesson. The guide is written by us — it is not a
 * copy of the book — and the lesson tree keeps the book's own printed heads so a
 * student can always find the matching page in «كتاب الوزارة».
 */
export interface G11LessonSpec {
  /** Stable within the book, e.g. "1-1"; becomes the app lesson code suffix. */
  key: string;
  /** App-facing title, taken from the book's printed lesson/concept head. */
  title: string;
  /** The book's printed heads under this lesson, plus the key ideas to master. */
  concepts: string[];
  /** Original teaching guide (not copied textbook prose). */
  guide: string;
}

export interface G11UnitSpec {
  key: string;
  title: string;
  lessons: G11LessonSpec[];
}

export interface G11TreeCheck {
  ok: boolean;
  problems: string[];
}

/**
 * Structural verification before seeding. It deliberately does not pretend to
 * verify page images: the source of truth for this first slice is the official
 * table of contents, and the checks below prove the tree itself is whole.
 */
export function checkG11Tree(book: string, units: G11UnitSpec[]): G11TreeCheck {
  const problems: string[] = [];
  if (units.length === 0) problems.push(`${book}: no units`);
  const unitKeys = new Set<string>();
  const lessonKeys = new Set<string>();
  for (const unit of units) {
    if (!unit.key.trim()) problems.push(`${book}: empty unit key`);
    if (unitKeys.has(unit.key)) problems.push(`${book}: duplicate unit key ${unit.key}`);
    unitKeys.add(unit.key);
    if (!unit.title.trim()) problems.push(`${book}/${unit.key}: empty unit title`);
    if (unit.lessons.length === 0) problems.push(`${book}/${unit.key}: no lessons`);
    for (const lesson of unit.lessons) {
      if (!lesson.key.trim()) problems.push(`${book}/${unit.key}: empty lesson key`);
      if (lessonKeys.has(lesson.key)) problems.push(`${book}: duplicate lesson key ${lesson.key}`);
      lessonKeys.add(lesson.key);
      if (!lesson.title.trim()) problems.push(`${book}/${lesson.key}: empty lesson title`);
      if (lesson.concepts.length < 2) problems.push(`${book}/${lesson.key}: fewer than two concepts`);
      if (lesson.concepts.some((concept) => !concept.trim())) {
        problems.push(`${book}/${lesson.key}: empty concept`);
      }
      if (lesson.guide.trim().length < 180) {
        problems.push(`${book}/${lesson.key}: teaching guide is too thin`);
      }
    }
  }
  return { ok: problems.length === 0, problems };
}

/** One lesson's RAG document: book identity, printed heads, original guide. */
export function g11LessonDocument(
  book: { subject: string; grade: string; sourceUrl: string },
  units: G11UnitSpec[],
  unitIndex: number,
  lessonIndex: number,
): string {
  const unit = units[unitIndex];
  const lesson = unit?.lessons[lessonIndex];
  if (!unit || !lesson) throw new Error("G11 lesson out of range");
  return [
    `المادة: ${book.subject}`,
    `الصف: ${book.grade}`,
    `الفصل الدراسي: الأول`,
    `الوحدة: ${unit.title}`,
    `الدرس: ${lesson.title}`,
    "",
    "المحاور كما وردت في الكتاب المدرسي:",
    ...lesson.concepts.map((concept) => `- ${concept}`),
    "",
    "شرح تعليمي أصلي (المرجع هو الكتاب المدرسي، وهذا شرحنا لا نسخًا منه):",
    lesson.guide.trim(),
    "",
    `للرجوع إلى الكتاب الرسمي: ${book.sourceUrl}`,
  ].join("\n");
}
