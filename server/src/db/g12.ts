/**
 * PHASE 191 — shared shape for the Secondary-3 (G12) first-term books.
 *
 * The Ministry PDFs are mostly scanned, so every tree below is taken from the
 * official printed table of contents. A book module supplies the printed
 * heads, two or more concepts per lesson, and a short original focus note; the
 * helper expands that note into our own teaching guide. No textbook prose is
 * copied.
 */
export interface G12LessonInput {
  /** Printed lesson/concept head from the Ministry book. */
  title: string;
  /** The printed sub-heads or key ideas that the lesson must cover. */
  concepts: string[];
  /** One original sentence naming the teaching purpose of this lesson. */
  focus: string;
}

export interface G12UnitInput {
  key: string;
  title: string;
  lessons: G12LessonInput[];
}

export interface G12LessonSpec {
  /** Stable within the book, generated as "unit-lesson". */
  key: string;
  title: string;
  concepts: string[];
  /** Original teaching guide (not copied textbook prose). */
  guide: string;
}

export interface G12UnitSpec {
  key: string;
  title: string;
  lessons: G12LessonSpec[];
}

export interface G12TreeCheck {
  ok: boolean;
  problems: string[];
}

export interface G12BookIdentity {
  subject: string;
  grade: string;
  sourceUrl: string;
}

/** Build the guide from the lesson's own printed concepts plus our focus note. */
export function g12Guide(title: string, concepts: string[], focus: string): string {
  const heads = concepts.join("، ");
  return [
    `في درس «${title}» نعمل على ${heads}. ${focus.trim()}`,
    "ابدأ بقراءة العنوان والمفاهيم قراءة متأنية، ثم اربط كل مفهوم بمثال من الكتاب المدرسي أو من خبرتك، واكتب تعريفًا قصيرًا لكل مصطلح بأسلوبك.",
    "بعد ذلك اختبر فهمك بثلاثة أسئلة: ما الفكرة الأساسية؟ ما الدليل الذي يسندها؟ وما التطبيق الذي يوضحها؟ إذا تعثرت في نقطة، عد إلى الصفحة المطابقة في كتاب الوزارة قبل الانتقال.",
    "اختم بتلخيص الدرس في خمس جمل واشرحه لزميل؛ الهدف ليس حفظ العبارات، بل بناء فهم يمكن استخدامه في حل الأسئلة الجديدة.",
  ].join("\n");
}

/** Expand the compact book input into the full seeded tree. */
export function g12Book(units: G12UnitInput[]): G12UnitSpec[] {
  return units.map((unit, unitIndex) => ({
    key: unit.key,
    title: unit.title,
    lessons: unit.lessons.map((lesson, lessonIndex) => ({
      key: `${unitIndex + 1}-${lessonIndex + 1}`,
      title: lesson.title,
      concepts: lesson.concepts,
      guide: g12Guide(lesson.title, lesson.concepts, lesson.focus),
    })),
  }));
}

/**
 * Structural verification before seeding. It proves every printed head has a
 * real lesson, at least two concepts, and a substantive original guide.
 */
export function checkG12Tree(book: string, units: G12UnitSpec[]): G12TreeCheck {
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
export function g12LessonDocument(
  book: G12BookIdentity,
  units: G12UnitSpec[],
  unitIndex: number,
  lessonIndex: number,
): string {
  const unit = units[unitIndex];
  const lesson = unit?.lessons[lessonIndex];
  if (!unit || !lesson) throw new Error("G12 lesson out of range");
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

/**
 * Small factory used by each G12 book module. It keeps the exported shape
 * identical to the G11 modules while letting each file stay data-only.
 */
export function createG12Book(input: G12BookIdentity & { units: G12UnitInput[] }) {
  const units = g12Book(input.units);
  const book: G12BookIdentity = {
    subject: input.subject,
    grade: input.grade,
    sourceUrl: input.sourceUrl,
  };
  return {
    BOOK: book,
    UNITS: units,
    isTreeConsistent: () => checkG12Tree(input.subject, units),
    lessonDocument: (unitIndex: number, lessonIndex: number) =>
      g12LessonDocument(book, units, unitIndex, lessonIndex),
  };
}

/**
 * PHASE 192 — the same original-guide contract in the language of a
 * language-medium edition. These guides are ours, not translations of the
 * Ministry prose: they tell the learner how to study the printed heads.
 */
export type G12ContentLanguage = "en" | "fr";

export function g12GuideLocalized(
  language: G12ContentLanguage,
  title: string,
  concepts: string[],
  focus: string,
): string {
  if (language === "fr") {
    return [
      `Dans la leçon « ${title} », nous travaillons sur ${concepts.join(", ")}. ${focus.trim()}`,
      "Commencez par lire le titre et les notions du manuel, puis reliez chaque notion à un exemple du livre ou à une situation de votre quotidien, et rédigez une courte définition de chaque terme avec vos propres mots.",
      "Vérifiez ensuite votre compréhension avec trois questions : quelle est l'idée principale ? quelle preuve ou quel exemple la soutient ? comment l'appliquer dans un exercice ? Si un point reste flou, revenez à la page correspondante du manuel officiel avant de continuer.",
      "Terminez par un résumé de cinq phrases et expliquez la leçon à un camarade : l'objectif n'est pas de mémoriser des formulations, mais de construire une compréhension réutilisable dans des questions nouvelles.",
    ].join("\n");
  }
  return [
    `In the lesson “${title}” we work on ${concepts.join(", ")}. ${focus.trim()}`,
    "Start by reading the heading and the key concepts carefully, then connect each concept to an example from the official textbook or your own experience, and write a short definition of every term in your own words.",
    "Next, test your understanding with three questions: What is the main idea? What evidence or example supports it? How can it be applied in a new exercise? If a point is unclear, return to the matching page in the Ministry book before moving on.",
    "Finish by summarising the lesson in five sentences and explaining it to a classmate; the goal is not to memorise wording, but to build understanding you can use in new questions.",
  ].join("\n");
}

export function g12BookLocalized(units: G12UnitInput[], language: G12ContentLanguage): G12UnitSpec[] {
  return units.map((unit, unitIndex) => ({
    key: unit.key,
    title: unit.title,
    lessons: unit.lessons.map((lesson, lessonIndex) => ({
      key: `${unitIndex + 1}-${lessonIndex + 1}`,
      title: lesson.title,
      concepts: lesson.concepts,
      guide: g12GuideLocalized(language, lesson.title, lesson.concepts, lesson.focus),
    })),
  }));
}

export function g12LessonDocumentLocalized(
  book: G12BookIdentity,
  units: G12UnitSpec[],
  unitIndex: number,
  lessonIndex: number,
  language: G12ContentLanguage,
): string {
  const unit = units[unitIndex];
  const lesson = unit?.lessons[lessonIndex];
  if (!unit || !lesson) throw new Error("G12 lesson out of range");
  const labels =
    language === "fr"
      ? {
          subject: "Matière",
          grade: "Niveau",
          term: "Trimestre",
          termName: "Premier trimestre",
          unit: "Unité",
          lesson: "Leçon",
          heads: "Notions indiquées dans le manuel officiel :",
          guide: "Guide d'étude original (le manuel est la référence ; ce texte est le nôtre) :",
          source: "Pour consulter le manuel officiel :",
        }
      : {
          subject: "Subject",
          grade: "Grade",
          term: "Term",
          termName: "First term",
          unit: "Unit",
          lesson: "Lesson",
          heads: "Concepts printed in the official textbook:",
          guide: "Original study guide (the textbook is the reference; this text is ours):",
          source: "Official textbook reference:",
        };
  return [
    `${labels.subject}: ${book.subject}`,
    `${labels.grade}: ${book.grade}`,
    `${labels.term}: ${labels.termName}`,
    `${labels.unit}: ${unit.title}`,
    `${labels.lesson}: ${lesson.title}`,
    "",
    labels.heads,
    ...lesson.concepts.map((concept) => `- ${concept}`),
    "",
    labels.guide,
    lesson.guide.trim(),
    "",
    `${labels.source} ${book.sourceUrl}`,
  ].join("\n");
}

export function createG12LocalizedBook(
  input: G12BookIdentity & { units: G12UnitInput[]; language: G12ContentLanguage },
) {
  const units = g12BookLocalized(input.units, input.language);
  const book: G12BookIdentity = {
    subject: input.subject,
    grade: input.grade,
    sourceUrl: input.sourceUrl,
  };
  return {
    BOOK: book,
    UNITS: units,
    isTreeConsistent: () => checkG12Tree(`${input.subject} (${input.language})`, units),
    lessonDocument: (unitIndex: number, lessonIndex: number) =>
      g12LessonDocumentLocalized(book, units, unitIndex, lessonIndex, input.language),
  };
}
