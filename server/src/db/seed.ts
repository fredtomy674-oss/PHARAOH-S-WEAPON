/* eslint-disable no-console */
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { and, asc, eq } from "drizzle-orm";
import { openDbAndMigrate } from "./index.js";
import { AiService } from "../modules/ai/aiService.js";
import { CurriculumService } from "../modules/curriculum/service.js";
import { KnowledgeService } from "../modules/knowledge/service.js";
import { createVectorStore } from "../modules/rag/factory.js";
import {
  chunks,
  concepts,
  countries,
  curricula,
  educationSystems,
  grades,
  lessons,
  parents,
  questions,
  students,
  studentsParents,
  subjects,
  terms,
  units,
  users,
} from "./schema.js";
import { newId } from "../utils/ids.js";
import { EGYPT_T1_UNITS, conceptDocument } from "./egyptT1.js";
import {
  EGYPT_SCIENCE_T1_UNITS,
  conceptDocument as scienceConceptDocument,
  isConsistent as isScienceTreeConsistent,
  assertTreeMatchesTheBook as assertScienceTreeMatchesBook,
} from "./egyptScienceT1.js";
import {
  EGYPT_SOCIAL_T1_UNITS,
  lessonDocument as socialLessonDocument,
  isConsistent as isSocialTreeConsistent,
  assertTreeMatchesTheBook as assertSocialTreeMatchesBook,
} from "./egyptSocialT1.js";
import {
  EGYPT_ARABIC_T1_UNITS,
  lessonDocument as arabicLessonDocument,
  isConsistent as isArabicTreeConsistent,
  assertTreeMatchesTheBook as assertArabicTreeMatchesBook,
} from "./egyptArabicT1.js";
import {
  EGYPT_ICT_T1_UNITS,
  lessonDocument as ictLessonDocument,
  isConsistent as isIctTreeConsistent,
  assertTreeMatchesTheBook as assertIctTreeMatchesBook,
} from "./egyptIctT1.js";
import {
  EGYPT_ISLAMIC_T1_UNITS,
  lessonDocument as islamicLessonDocument,
  isConsistent as isIslamicTreeConsistent,
  assertTreeMatchesTheBook as assertIslamicTreeMatchesBook,
} from "./egyptIslamicT1.js";

/** Where one seeded lesson lives — used as the RAG scope for its document. */
interface SeededLesson {
  lessonId: string;
  termId: string;
  unitId: string;
}

interface Seeded {
  countryId: string;
  systemId: string;
  gradeId: string;
  subjectId: string;
  curriculumId: string;
  /** PHASE 43 — every lesson plus the term/unit it was seeded under, so the RAG
   *  metadata describes the real tree instead of the first unit only. */
  lessons: Record<string, SeededLesson>;
}

/** One lesson: its concepts, and optionally the RAG document that grounds it. */
interface LessonSeedSpec {
  code: string;
  title: string;
  concepts: string[];
  doc?: { title: string; content: string };
}

/** A unit groups lessons inside one term (PHASE 43: a curriculum is a tree). */
interface UnitSeedSpec {
  code: string;
  title: string;
  lessons: LessonSeedSpec[];
}

/** A term groups units inside one curriculum. */
interface TermSeedSpec {
  code: string;
  title: string;
  units: UnitSeedSpec[];
}

/** One country's curriculum skeleton + per-lesson RAG documents (PHASE 16: multi-country). */
interface CountrySeedSpec {
  country: { code: string; name: string; nameAr: string };
  system: { code: string; name: string; nameAr: string; sortOrder: number };
  grade: { code: string; name: string; nameAr: string; levelOrder: number };
  /**
   * Global subject catalog entry (shared across countries, PHASE 38). Defaults
   * to Mathematics so the two original specs stay untouched; a language
   * curriculum declares its own code, and that code is what makes the tutor
   * answer in English (D-042).
   */
  subject?: { code: string; name: string; nameAr: string };
  curriculum: { code: string; title: string };
  /**
   * PHASE 43 — the whole curriculum tree. It used to be one term + one unit +
   * a flat lesson list, which is why the seeded "curriculum" was three lessons
   * with no second term, no second unit and nothing for a student to finish.
   */
  terms: TermSeedSpec[];
}

type DbHandle = ReturnType<typeof openDbAndMigrate>;

/** Egyptian Grade-6 Math skeleton + sample lesson documents (original PHASE 1 seed). */
/**
 * Egyptian Grade-6 Math — OFFICIAL curriculum (PHASE 47).
 *
 * The first-term tree IS the Ministry textbook (Math Techbook™ G6 T1): 7 units
 * with 10 printed concepts («المفاهيم» → app lessons), each grounded on the OCR
 * text of the book's own pages (server/data/curriculum-ocr/) so the tutor's RAG
 * retrieval reads from «كتاب الوزارة» verbatim. The second term remains a
 * hand-written placeholder until the T2 book is imported the same way.
 */
export const EGYPT_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  curriculum: { code: "eg-g6-math", title: "الرياضيات للصف السادس الابتدائي" },
  terms: [buildEgyptT1Term(), buildEgyptT2Placeholder()],
};

/** Term 1 = the official book: one app lesson per printed مفهوم, pages OCR'd. */
function buildEgyptT1Term(): TermSeedSpec {
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.concepts.map((concept, ci) => {
        const title = `المفهوم ${concept.key}: ${concept.title}`;
        return {
          code: `l-con-${concept.key}`,
          title,
          concepts: [concept.title],
          doc: { title, content: conceptDocument(ui, ci) },
        };
      }),
    })),
  };
}

/**
 * Egyptian Grade-6 **Science** — OFFICIAL curriculum (PHASE 59).
 *
 * The first term IS the Ministry textbook (`Science_Primary6_T1.pdf`, 2026/2027
 * MoE edition): its 10 chapters, one app lesson per printed مفهوم, each lesson
 * grounded on the OCR text of the very pages the book prints for that concept
 * (server/data/curriculum-ocr/science-t1/) — so the tutor's RAG retrieval reads
 * from «كتاب الوزارة» verbatim. The second term is a placeholder until its book
 * is imported the same way.
 *
 * The chapter/concept table itself is verified before seeding: `isConsistent`
 * checks the table's invariants and `assertTreeMatchesTheBook` re-reads every
 * printed page of the OCR corpus to confirm the concept head each page prints
 * falls inside that concept's page range. A wrong range would silently hide book
 * content from the tutor, so seeding refuses to run on an unverified table.
 */
export const EGYPT_SCIENCE_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  subject: { code: "science", name: "Science", nameAr: "العلوم" },
  curriculum: { code: "eg-g6-science", title: "العلوم للصف السادس الابتدائي" },
  terms: [buildEgyptScienceT1Term(), buildEgyptScienceT2Placeholder()],
};

/** Term 1 = the official book: one app lesson per printed مفهوم, pages OCR'd. */
function buildEgyptScienceT1Term(): TermSeedSpec {
  const check = verifyScienceTree();
  if (!check.ok) throw new Error(`شجرة كتاب العلوم غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_SCIENCE_T1_UNITS.map((chapter, ui) => ({
      code: `unit-${ui + 1}`,
      title: chapter.title,
      lessons: chapter.concepts.map((concept, ci) => {
        const title = `المفهوم ${concept.key}: ${concept.title}`;
        return {
          // Namespaced: the science book prints the same «chapter-concept» labels
          // as the maths book (١-١, ١-٢ …), so a bare `l-con-1-2` would be the same
          // string in two curricula — a lookup by code would silently answer from
          // the wrong book. Codes stay unique across every seeded curriculum.
          code: `l-sci-con-${concept.key}`,
          title,
          concepts: [concept.title],
          doc: { title, content: scienceConceptDocument(ui, ci) },
        };
      }),
    })),
  };
}

/** Both halves of the science tree verification, as one verdict. */
function verifyScienceTree(): { ok: boolean; problems: string[] } {
  const table = isScienceTreeConsistent();
  const book = assertScienceTreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/** Term 2 placeholder — hand-written until the second-term book is imported. */
function buildEgyptScienceT2Placeholder(): TermSeedSpec {
  return {
    code: "term-2",
    title: "الفصل الدراسي الثاني",
    units: [
      {
        code: "unit-1",
        title: "المادة وحالاتها",
        lessons: [
          {
            code: "l-matter-states",
            title: "حالات المادة والمادة النقية",
            concepts: ["حالات المادة الثلاث", "المادة النقية والمادة المخلوطة"],
            doc: {
              title: "حالات المادة والمادة النقية",
              content: `درس حالات المادة والمادة النقية.
حالات المادة: تنقسم المادة إلى ثلاث حالات، وهي الصلبة والسائلة والغازية. تختلف الحالة في شكل المادة وانتظام جزيئاتها وقربها من بعضها. صلبة: جزيئاتها منتظمة ومتراصّة ومثبتة في مكانها مثل الحديد. سائلة: جزيئاتها قريبة من بعضها لكنها غير منتظمة وتتحرك بحرية مثل الماء. غازية: جزيئاتها متباعدة وتتحرك في كل الاتجاهات مثل الهواء.
المادة النقية: كل جزء منها له نفس التركيب والخصائص، مثل الماء النقي والذهب. والمادة المخلوطة: تتكوّن من أكثر من مادة نقية، مثل الهواء (ثاني أكسيد الكربون + الأكسجين + النيتروجين) والماء المالح.
مثال: الملح النقي مادة نقية لأن كل ذراته من نوع واحد (الصوديوم والكلور)، وأي ماء تذوب فيه ذرات يصبح مخلوطًا.
تذكر: المادة تنتقل بين الحالات بالتسخين أو التبريد، والتركيب نفسه لا يتغيّر.`,
            },
          },
          {
            code: "l-elements-mixtures",
            title: "العناصر والمركبات",
            concepts: ["العناصر والمركبات", "الخلوط وطرق فصلها"],
            doc: {
              title: "العناصر والمركبات",
              content: `درس العناصر والمركبات.
العنصر: مادة نقية تتكوّن من نوع واحد من الذرات، وله اسم ورمز، مثل الأكسجين (O) والكربون (C).
المركّب: مادة نقية تتكوّن من ذرات نوعين أو أكثر مرتبطة بترتيب ثابت، مثل الماء (H₂O) وثاني أكسيد الكربون (CO₂).
الخليط: اجتماع مواد دون ارتباط كيميائي، مثل الهواء، ويمكن فصله بطرق فيزيائية: بالترشيح، أو بالتسخين (التبخير)، أو بالتقطير.
مثال تطبيقي: إذا أذبت ملعقة ملح في كوب ماء فحصلت على «ماء مالح»، وهذا خلط قابل للفصل بالتسخين: الماء يتبخر والملح يبقى.
تذكر: الماء مركّب ثابت (H₂O)، والماء المالح خلط متغيّر (ماء + ملح).`,
            },
          },
        ],
      },
    ],
  };
}

/**
 * Egyptian Grade-6 **Social Studies** — OFFICIAL curriculum (PHASE 60).
 *
 * The first term IS the Ministry textbook (`Social_Studies_Primary6_T1.pdf`,
 * 2026/2027 MoE edition): its 3 units and 12 lessons as printed in the contents
 * page, each lesson carrying the book's own printed concepts. Every lesson's RAG
 * document is the OCR text of the very pages the book prints for it
 * (server/data/curriculum-ocr/social-t1/). There is no second-term spec: its
 * book has not been imported, and a hand-written stand-in would misrepresent it.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping page by page from the
 * printed footers, checks every lesson's opener prints its title, and confirms
 * no printed page falls outside a lesson. Seeding refuses to run on an
 * unverified table.
 */
export const EGYPT_SOCIAL_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  subject: { code: "social", name: "Social Studies", nameAr: "الدراسات الاجتماعية" },
  curriculum: { code: "eg-g6-social", title: "الدراسات الاجتماعية للصف السادس الابتدائي" },
  terms: [buildEgyptSocialT1Term()],
};

/** Term 1 = the official book: one app lesson per printed درس, pages OCR'd. */
function buildEgyptSocialT1Term(): TermSeedSpec {
  const check = verifySocialTree();
  if (!check.ok) throw new Error(`شجرة كتاب الدراسات الاجتماعية غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_SOCIAL_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-soc-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: socialLessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the social tree verification, as one verdict. */
function verifySocialTree(): { ok: boolean; problems: string[] } {
  const table = isSocialTreeConsistent();
  const book = assertSocialTreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-6 **Arabic language** — OFFICIAL curriculum (PHASE 61).
 *
 * The first term IS the Ministry textbook (`Arabic_Primary6_T1.pdf`, 2026/2027
 * MoE edition): its 3 units, 12 lessons and every printed «مكوّن» of each lesson,
 * exactly as the book's فهرس prints them, each grounded on the OCR text of the
 * pages the book prints for it (server/data/curriculum-ocr/arabic-t1/). Listening
 * lessons also carry their appendix passage («نصوص استماع الوحدات»). There is no
 * second-term spec: its book has not been imported, and a hand-written stand-in
 * would misrepresent it.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the unit/lesson/component pages against what each page actually prints, and the
 * tiling. Seeding refuses to run on an unverified table.
 */
export const EGYPT_ARABIC_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  subject: { code: "arabic", name: "Arabic", nameAr: "اللغة العربية" },
  curriculum: { code: "eg-g6-arabic", title: "اللغة العربية للصف السادس الابتدائي" },
  terms: [buildEgyptArabicT1Term()],
};

/** Term 1 = the official book: unit → lesson → the book's own printed components. */
function buildEgyptArabicT1Term(): TermSeedSpec {
  const check = verifyArabicTree();
  if (!check.ok) throw new Error(`شجرة كتاب اللغة العربية غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ARABIC_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal} (${lesson.type}): ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-ara-${lesson.key}`,
          title,
          concepts: lesson.concepts.map((concept) => `${concept.kind}: ${concept.title}`),
          doc: { title, content: arabicLessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Arabic tree verification, as one verdict. */
function verifyArabicTree(): { ok: boolean; problems: string[] } {
  const table = isArabicTreeConsistent();
  const book = assertArabicTreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-6 **Information and Communication Technology** — OFFICIAL
 * curriculum (PHASE 62).
 *
 * The first term IS the Ministry textbook (`ICT_Arabic_Primary6_T1.pdf`,
 * 2026/2027 MoE edition): its 2 units and 12 lessons exactly as the book's
 * قائمة المحتويات prints them, each grounded on the OCR text of the pages the
 * book prints for it (server/data/curriculum-ocr/ict-t1/). There is no second
 * term yet: its book has not been imported, and a hand-written stand-in would
 * misrepresent it.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the lesson titles each page prints, and the tiling. Seeding refuses to run on
 * an unverified table.
 */
export const EGYPT_ICT_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  subject: { code: "ict", name: "Information and Communication Technology", nameAr: "تكنولوجيا المعلومات والاتصالات" },
  curriculum: { code: "eg-g6-ict", title: "تكنولوجيا المعلومات والاتصالات للصف السادس الابتدائي" },
  terms: [buildEgyptIctT1Term()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptIctT1Term(): TermSeedSpec {
  const check = verifyIctTree();
  if (!check.ok) throw new Error(`شجرة كتاب تكنولوجيا المعلومات غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ICT_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-ict-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: ictLessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the ICT tree verification, as one verdict. */
function verifyIctTree(): { ok: boolean; problems: string[] } {
  const table = isIctTreeConsistent();
  const book = assertIctTreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-6 **Islamic Religious Education** — OFFICIAL curriculum (PHASE 64).
 *
 * The first term IS the Ministry textbook (`Islamic_Education_Primary6_T1.pdf`,
 * 2026/2027 MoE edition, reviewed by Al-Azhar): its 3 units and 20 lessons,
 * exactly as the book's قائمة المحتويات prints them, each grounded on the OCR
 * text of the pages the book prints for it
 * (server/data/curriculum-ocr/islamic-t1/). The book prints no «مفهوم» layer, so
 * each lesson's concepts are the printed «الأهداف» the book puts at its head.
 * There is no second-term spec: its book has not been imported, and a
 * hand-written stand-in would misrepresent it.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the lesson titles each page prints, and the tiling. Seeding refuses to run on
 * an unverified table.
 */
export const EGYPT_ISLAMIC_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  subject: { code: "islamic-education", name: "Islamic Religious Education", nameAr: "التربية الدينية الإسلامية" },
  curriculum: { code: "eg-g6-islamic-education", title: "التربية الدينية الإسلامية للصف السادس الابتدائي" },
  terms: [buildEgyptIslamicT1Term()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptIslamicT1Term(): TermSeedSpec {
  const check = verifyIslamicTree();
  if (!check.ok) throw new Error(`شجرة كتاب التربية الدينية الإسلامية غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ISLAMIC_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-isl-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: islamicLessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Islamic tree verification, as one verdict. */
function verifyIslamicTree(): { ok: boolean; problems: string[] } {
  const table = isIslamicTreeConsistent();
  const book = assertIslamicTreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/** Term 2 placeholder — hand-written until the second-term book is imported. */
function buildEgyptT2Placeholder(): TermSeedSpec {
  return {
    code: "term-2",
    title: "الفصل الدراسي الثاني",
    units: [
      {
        code: "unit-1",
        title: "الأعداد العشرية والنسبية",
        lessons: [
          {
            code: "l-decimals",
            title: "الأعداد العشرية والعمليات عليها",
            concepts: ["قراءة الأعداد العشرية وترتيبها", "جمع الأعداد العشرية وطرحها"],
            doc: {
              title: "الأعداد العشرية والعمليات عليها",
              content: `درس الأعداد العشرية والعمليات عليها.
قراءة العدد العشري: نقرأ الجزء الصحيح ثم كلمة (و) ثم الجزء العشري. مثال: 3.45 يقرأ ثلاثة و45 من مئة، وأول منزلة بعد الفاصلة هي الأعشار.
ترتيب الأعداد العشرية: نقارن الجزء الصحيح أولًا، ثم ننظر إلى منزلة الأعشار فالجزء من مئة. مثال: 4.3 أصغر من 4.35 لأن 3 أعشار أصغر من 35 من مئة.
جمع الأعداد العشرية وطرحها: نرتب الأرقام بحيث تقع الفواصل تحت بعضها ثم نجمع أو نطرح منزلة لمنزلة. مثال: 12.5 + 3.75 = 16.25.
مثال تطبيقي: اشترى سامي أقلامًا بـ12.75 جنيه ودفترًا بـ7.5 جنيهات. كم دفع؟ 12.75 + 7.50 = 20.25 جنيهًا.
تذكر: أضف أصفارًا نهاية العدد العشري لتساوي عدد المنازل قبل الجمع أو الطرح.`,
            },
          },
          {
            code: "l-rational",
            title: "الأعداد النسبية",
            concepts: ["الأعداد النسبية الموجبة والسالبة", "تمثيل الأعداد النسبية على خط الأعداد"],
            doc: {
              title: "الأعداد النسبية الموجبة والسالبة",
              content: `درس الأعداد النسبية.
الأعداد النسبية: كل عدد يمكن كتابته على صورة أ/ب حيث ب لا يساوي صفرًا، وتشمل الأعداد الصحيحة الموجبة والسالبة والكسور. أمثلة: -3، 1/2، 0.75 أعداد نسبية.
الموجبة والسالبة: الموجبة أكبر من صفر وتقع يمين الصفر على خط الأعداد، والسالبة أصغر من صفر وتقع يسار الصفر. مثال: -4 أصغر من 2 لأنها تقع على يسار الصفر.
تمثيل الأعداد النسبية على خط الأعداد: لكل عدد نسبي نقطة واحدة على الخط، وتقسم المسافة بين صفر و1 حسب المقام. مثال: 3/4 تقع بين 0 و1 قرب 1، والعدد -3/4 يقع على يسار الصفر.
مثال تطبيقي: بلغت درجة حرارة مدينة خمس درجات تحت الصفر، فكيف نكتبها؟ نكتبها -5 درجات.
تذكر: كلما اتجهت يسارًا على خط الأعداد قلت القيمة، وكلما اتجهت يمينًا زادت.`,
            },
          },
          {
            code: "l-equations",
            title: "المعادلات والمسائل اللفظية",
            concepts: ["حل معادلة من خطوة", "كتابة المعادلة من مسألة لفظية"],
            doc: {
              title: "المعادلات والمسائل اللفظية",
              content: `درس المعادلات والمسائل اللفظية.
المعادلة: جملة رياضية تعبر عن تساوي مقدارين وتحتوي مجهولًا. مثال: س + 7 = 15، والمجهول يمثل قيمة نبحث عنها.
حل معادلة من خطوة: نعزل المجهول في طرف باستخدام العملية العكسية. مثال: في س + 7 = 15 نطرح 7 من الطرفين فس = 8. وفي 3 س = 12 نقسم الطرفين على 3 فس = 4.
كتابة المعادلة من مسألة لفظية: نختار رمزًا للمجهول ونترجم الجملة إلى معادلة. مثال: إذا كان عدد الورود في الباقة مضافًا إليه 5 يساوي 20، فنكتب س + 5 = 20.
مثال تطبيقي: ثمن قلمين و3 جنيهات يساوي 11 جنيهًا. ما ثمن القلم الواحد؟ المعادلة 2 س + 3 = 11، إذن 2 س = 8، فس = 4 جنيهات.
تذكر: ما تفعله في أحد الطرفين افعله في الطرف الآخر، وتحقق من الحل بتعويض القيمة في المعادلة الأصلية.`,
            },
          },
        ],
      },
    ],
  };
}
/** Saudi (KSA) Grade-6 Math skeleton — proves the architecture is truly regional (PHASE 16). */
export const SAUDI_SPEC: CountrySeedSpec = {
  country: { code: "sa", name: "Saudi Arabia", nameAr: "السعودية" },
  system: { code: "sa-ministry", name: "Ministry of Education", nameAr: "وزارة التعليم", sortOrder: 1 },
  grade: { code: "sa-grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  curriculum: { code: "sa-g6-math", title: "الرياضيات للصف السادس الابتدائي" },
  terms: [
    {
      code: "sa-term-1",
      title: "الفصل الدراسي الأول",
      units: [
        {
          code: "sa-unit-1",
          title: "الأعداد والعمليات عليها",
          lessons: [
          {
            code: "l-sa-ops",
            title: "العمليات على الأعداد الطبيعية",
            concepts: ["الجمع مع إعادة التجميع", "الضرب في مضاعفات العشرة"],
            doc: {
              title: "العمليات على الأعداد الطبيعية",
              content: `درس العمليات على الأعداد الطبيعية.
الجمع مع إعادة التجميع: عند جمع 2754 + 386 نبدأ من الآحاد: 4 + 6 = 10، نكتب 0 ونرفع 1 للعشرات. ثم العشرات: 5 + 8 + 1 = 14، نكتب 4 ونرفع 1 للمئات. المئات: 7 + 3 + 1 = 11، نكتب 1 ونرفع 1 للألوف. والألوف: 2 + 1 = 3. الناتج 3140.
الضرب في مضاعفات العشرة: لضرب 43 × 20 نضرب 43 × 2 = 86 ثم نضيف صفرًا فيصبح 860.
مثال تطبيقي: اشترى خالد في سوق مدينة الرياض 15 دفترًا، ثمن الدفتر الواحد 9 ريالات سعودية. كم دفع؟ 15 × 9 = 135 ريالًا سعوديًا.
تذكر: البدء دائمًا من الآحاد، وكتابة أرقام النقل بعناية يمنع الأخطاء الشائعة في الجمع والضرب.`,
            },
          },
          {
            code: "l-sa-units",
            title: "القياس والوحدات المترية",
            concepts: ["وحدات الطول", "التحويل بين الوحدات المترية"],
            doc: {
              title: "القياس والوحدات المترية",
              content: `درس القياس والوحدات المترية.
وحدات الطول: المتر هو الوحدة الأساسية، والمليمتر والسنتيمتر والكيلومتر وحدات فرعية ومضاعفات. المتر الواحد يساوي 100 سنتيمتر، والكيلومتر يساوي 1000 متر.
التحويل بين الوحدات: للتحويل من وحدة كبيرة إلى أصغر نضرب، ومن أصغر إلى أكبر نقسم. مثال: 3 كيلومترات = 3000 متر؛ و250 سنتيمترًا = 2.5 متر.
مثال تطبيقي: يقيس فريق طلاب في مدينة جدة ساحة المدرسة، فوجدوا طولها 120 مترًا. ما طول الساحة بالسنتيمتر؟ 120 × 100 = 12000 سنتيمتر.
تذكر: حدد هل تتحول من كبير إلى صغير (اضرب) أم من صغير إلى كبير (اقسم) قبل الإجابة.`,
            },
          },
          ],
        },
      ],
    },
  ],
};

/**
 * Egyptian Grade-6 **English** curriculum (PHASE 38) — the second subject under
 * the same country/system/grade, so the picker shows two real curricula and the
 * tutor's reply language can be observed end-to-end. Lesson content is English
 * (that is the point), titles bilingual so the Arabic UI stays readable.
 */
export const EGYPT_ENGLISH_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  subject: { code: "english", name: "English", nameAr: "اللغة الإنجليزية" },
  curriculum: { code: "eg-g6-english", title: "اللغة الإنجليزية للصف السادس الابتدائي" },
  terms: [
    {
      code: "en-term-1",
      title: "الفصل الدراسي الأول",
      units: [
        {
          code: "en-unit-1",
          title: "الوحدة الأولى: Family and Friends — العائلة والأصدقاء",
          lessons: [
          {
            code: "l-en-present-simple",
            title: "Present Simple — المضارع البسيط",
            concepts: ["The verb 'to be'", "Third person singular with -s"],
            doc: {
              title: "Present simple: the verb to be and the -s form",
              content: `Lesson: Present simple.
The verb "to be": we use am, is and are. Use "am" with I: I am a student. Use "is" with he, she and it: She is my sister. Use "are" with you, we and they: They are my friends.
Third person singular: when the subject is he, she or it, we add -s to the verb in the present simple. Example: I play football, but he plays football. The negative uses "does not": He does not play football. The question uses "do you": Do you play football?
Example: Sara lives in Cairo and her brother lives in Giza. Every day Sara goes to school by bus and she arrives at seven o'clock.
Remember: add -s only for he, she and it (and for I am / he is / they are with the verb to be).`,
            },
          },
          {
            code: "l-en-family",
            title: "Family Members and Possessives — أفراد العائلة والملكية",
            concepts: ["Family vocabulary", "Possessive adjectives (my, your, his, her)"],
            doc: {
              title: "Family members and possessive adjectives",
              content: `Lesson: Family members and possessives.
Family vocabulary: father, mother, brother, sister, grandfather, grandmother, uncle, aunt, cousin.
Possessive adjectives: my (for I), your (for you), his (for he), her (for she), its (for it), our (for we), their (for they). Examples: This is my father. That is her bag.
Example: Ahmed is my cousin. His father is a teacher and her mother is a doctor. Their house is near the school.
Remember: "her" comes before a noun that starts with a vowel sound, and "his" is used for things and people alike.`,
            },
          },
          ],
        },
      ],
    },
  ],
};

/**
 * Idempotent multi-country seeder: Egypt (original) + Saudi Arabia (PHASE 16)
 * Grade-6 Math skeletons + Egypt's Grade-6 English curriculum (PHASE 38) +
 * sample lesson documents (→ chunks → mock embeddings) + demo accounts for the
 * manual vertical slice. Running twice is a no-op.
 * The global subject catalog is shared across countries (reused, never duplicated).
 */
async function main(): Promise<void> {
  const db = openDbAndMigrate();
  const ai = new AiService(db, { forceProvider: "mock" });
  // Seed always writes locally — the default factory flavor stays sqlite unless env says otherwise.
  const vectorStore = createVectorStore(db, { kind: "sqlite" });
  const knowledge = new KnowledgeService(db, ai, vectorStore);
  const curriculum = new CurriculumService(db);

  const egypt = await seedCountry(db, knowledge, EGYPT_SPEC);
  await seedCountry(db, knowledge, EGYPT_ENGLISH_SPEC);
  await seedCountry(db, knowledge, EGYPT_SCIENCE_SPEC);
  await seedCountry(db, knowledge, EGYPT_SOCIAL_SPEC);
  await seedCountry(db, knowledge, EGYPT_ARABIC_SPEC);
  await seedCountry(db, knowledge, EGYPT_ICT_SPEC);
  await seedCountry(db, knowledge, EGYPT_ISLAMIC_SPEC);
  await seedCountry(db, knowledge, SAUDI_SPEC);
  await seedUsers(db, curriculum, egypt);

  db.sqlite.close();
  console.log("✓ Seed complete — Egypt (Math + English + Science + Social Studies + Arabic + ICT + Islamic Education) + Saudi Grade-6 Math, demo accounts, RAG corpora ready.");
}

/**
 * Idempotent per-LEVEL seeder for one curriculum spec. Every level is created
 * only when missing, so a spec may hang under a country/system/grade that the
 * previous spec already created (PHASE 38: Egypt's English curriculum lives
 * under the same country + system + grade as Egypt's Math one) and re-running
 * the seeder stays a no-op.
 */
export async function seedCountry(db: DbHandle, knowledge: KnowledgeService, spec: CountrySeedSpec): Promise<Seeded> {
  const now = new Date();
  let created = false;

  let c = await db.db.select().from(countries).where(eq(countries.code, spec.country.code)).get();
  if (!c) {
    c = { id: newId("c"), code: spec.country.code, name: spec.country.name, nameAr: spec.country.nameAr };
    await db.db.insert(countries).values(c);
    created = true;
  }
  let sys = await db.db.select().from(educationSystems).where(and(eq(educationSystems.countryId, c.id), eq(educationSystems.code, spec.system.code))).get();
  if (!sys) {
    sys = { id: newId("sys"), countryId: c.id, code: spec.system.code, name: spec.system.name, nameAr: spec.system.nameAr, sortOrder: spec.system.sortOrder };
    await db.db.insert(educationSystems).values(sys);
    created = true;
  }
  let g = await db.db.select().from(grades).where(and(eq(grades.educationSystemId, sys.id), eq(grades.code, spec.grade.code))).get();
  if (!g) {
    g = { id: newId("g"), educationSystemId: sys.id, code: spec.grade.code, name: spec.grade.name, nameAr: spec.grade.nameAr, levelOrder: spec.grade.levelOrder };
    await db.db.insert(grades).values(g);
    created = true;
  }

  // The subject catalog is global and shared across countries — reuse it when a
  // previous country (or a previous spec) already created it, never duplicate.
  const subjectSpec = spec.subject ?? { code: "math", name: "Mathematics", nameAr: "الرياضيات" };
  let subj = await db.db.select().from(subjects).where(eq(subjects.code, subjectSpec.code)).get();
  if (!subj) {
    subj = { id: newId("subj"), ...subjectSpec };
    await db.db.insert(subjects).values(subj);
    created = true;
  }

  let cur = await db.db.select().from(curricula).where(eq(curricula.code, spec.curriculum.code)).get();
  if (!cur) {
    cur = { id: newId("cur"), countryId: c.id, educationSystemId: sys.id, gradeId: g.id, subjectId: subj.id, code: spec.curriculum.code, title: spec.curriculum.title, version: "1.0", isActive: true, createdAt: now };
    await db.db.insert(curricula).values(cur);
    created = true;
  }
  const lessonsMap: Record<string, SeededLesson> = {};
  for (const [ti, termSpec] of spec.terms.entries()) {
    let term = await db.db.select().from(terms).where(and(eq(terms.curriculumId, cur.id), eq(terms.code, termSpec.code))).get();
    if (!term) {
      term = { id: newId("t"), curriculumId: cur.id, code: termSpec.code, title: termSpec.title, sortOrder: ti + 1 };
      await db.db.insert(terms).values(term);
      created = true;
    }
    for (const [ui, unitSpec] of termSpec.units.entries()) {
      let unit = await db.db.select().from(units).where(and(eq(units.termId, term.id), eq(units.code, unitSpec.code))).get();
      if (!unit) {
        unit = { id: newId("u"), termId: term.id, code: unitSpec.code, title: unitSpec.title, sortOrder: ui + 1 };
        await db.db.insert(units).values(unit);
        created = true;
      }
      for (const [i, lessonSpec] of unitSpec.lessons.entries()) {
        let lesson = await db.db.select().from(lessons).where(and(eq(lessons.unitId, unit.id), eq(lessons.code, lessonSpec.code))).get();
        if (!lesson) {
          lesson = { id: newId("l"), unitId: unit.id, code: lessonSpec.code, title: lessonSpec.title, sortOrder: i + 1 };
          await db.db.insert(lessons).values(lesson);
          created = true;
        }
        lessonsMap[lessonSpec.code] = { lessonId: lesson.id, termId: term.id, unitId: unit.id };
        await reconcileConcepts(db, lesson.id, lessonSpec);
      }
    }
  }

  if (created) console.log(`✓ Curriculum skeleton ready (${spec.country.nameAr} — ${spec.curriculum.title}).`);

  const seeded = { countryId: c.id, systemId: sys.id, gradeId: g.id, subjectId: subj.id, curriculumId: cur.id, lessons: lessonsMap };
  await ingestLessonDocuments(db, knowledge, seeded, spec);
  await ensureDemoQuestions(db, seeded, demoQuestionsOf(spec.curriculum.code));
  await ensureDemoOpenQuestions(db, seeded, demoOpenQuestionsOf(spec.curriculum.code));
  return seeded;
}

/**
 * PHASE 43 — concept seeding converges instead of freezing. Existing concepts
 * are matched by title, missing ones are inserted, and codes are reconciled to
 * `c-<lesson-code>-<n>`: lesson-scoped, so numbering never collides across
 * units the way a per-spec index would. Identity is the row id — the code is a
 * display/order key, which is exactly why renumbering it here is safe.
 */
async function reconcileConcepts(db: DbHandle, lessonId: string, lessonSpec: LessonSeedSpec): Promise<void> {
  const existing = await db.db.select().from(concepts).where(eq(concepts.lessonId, lessonId)).orderBy(asc(concepts.code));
  const byTitle = new Map(existing.map((row) => [row.title, row]));
  for (const [j, title] of lessonSpec.concepts.entries()) {
    const code = `c-${lessonSpec.code}-${j + 1}`;
    const row = byTitle.get(title);
    if (row) {
      if (row.code !== code) {
        await db.db.update(concepts).set({ code }).where(eq(concepts.id, row.id));
      }
    } else {
      await db.db.insert(concepts).values({
        id: newId("con"),
        lessonId,
        code,
        title,
        description: `مفهوم ${title} من درس ${lessonSpec.title}`,
      });
    }
  }
}

async function ingestLessonDocuments(db: DbHandle, knowledge: KnowledgeService, seeded: Seeded, spec: CountrySeedSpec): Promise<void> {
  for (const term of spec.terms) {
    for (const unit of term.units) {
      for (const lessonSpec of unit.lessons) {
        if (!lessonSpec.doc) continue;
        const scoped = seeded.lessons[lessonSpec.code]!;
        const existing = await db.db.select({ id: chunks.id }).from(chunks).where(eq(chunks.lessonId, scoped.lessonId)).limit(1);
        if (existing.length > 0) {
          console.log(`  ↺ Document for "${lessonSpec.doc.title}" already ingested — skipped.`);
          continue;
        }
        await knowledge.ingestText({
          title: lessonSpec.doc.title,
          content: lessonSpec.doc.content,
          kind: "text",
          source: `seed:${spec.curriculum.code}-sample`,
          scope: {
            countryId: seeded.countryId,
            educationSystemId: seeded.systemId,
            gradeId: seeded.gradeId,
            subjectId: seeded.subjectId,
            curriculumId: seeded.curriculumId,
            termId: scoped.termId,
            unitId: scoped.unitId,
            lessonId: scoped.lessonId,
          },
        });
        console.log(`  ✓ Ingested "${lessonSpec.doc.title}" → chunks + vectors.`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// PHASE 24 — demo practice questions (Egyptian curriculum). Seeded
// idempotently so `npm run db:seed` never duplicates them; they feed the
// practice loop that drives the concept-mastery engine. Saudi Arabia
// intentionally has none — proof the practice scope is truly per-curriculum.
// PHASE 30 — demo OPEN (free-text) questions for the same curriculum, with a
// hidden `answerKey` the server grades via the `grade_open` AI operation.
// ---------------------------------------------------------------------------

interface DemoQuestionSpec {
  lessonCode: string;
  conceptTitle?: string;
  difficulty: "easy" | "medium" | "hard";
  content: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface DemoOpenQuestionSpec {
  lessonCode: string;
  conceptTitle?: string;
  difficulty: "easy" | "medium" | "hard";
  content: string;
  answerKey: string;
  explanation: string;
}

const EGYPT_DEMO_QUESTIONS: DemoQuestionSpec[] = [
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "قابلية القسمة والعامل المشترك الأكبر والمضاعف المشترك الأصغر",
    difficulty: "medium",
    content: "ما القاسم المشترك الأكبر للعددين 12 و18؟",
    options: ["3", "6", "9", "2"],
    correctIndex: 1,
    explanation: "قواسم 12: 1، 2، 3، 4، 6، 12 وقواسم 18: 1، 2، 3، 6، 9، 18، فالقاسم المشترك الأكبر هو 6.",
  },
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "قابلية القسمة والعامل المشترك الأكبر والمضاعف المشترك الأصغر",
    difficulty: "medium",
    content: "ما المضاعف المشترك الأصغر للعددين 4 و6؟",
    options: ["12", "24", "18", "6"],
    correctIndex: 0,
    explanation: "مضاعفات 4: 4، 8، 12، 16 ومضاعفات 6: 6، 12، 18، فالمضاعف المشترك الأصغر هو 12.",
  },
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "قابلية القسمة والعامل المشترك الأكبر والمضاعف المشترك الأصغر",
    difficulty: "easy",
    content: "بعد تبسيط الكسر 8/12 يصبح:",
    options: ["2/3", "4/6", "3/4", "1/2"],
    correctIndex: 0,
    explanation: "نقسم البسط والمقام على العامل المشترك الأكبر 4: 8 ÷ 4 = 2 و 12 ÷ 4 = 3، فيصبح 2/3.",
  },
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "قابلية القسمة والعامل المشترك الأكبر والمضاعف المشترك الأصغر",
    difficulty: "easy",
    content: "ما ناتج 1/4 + 2/4؟",
    options: ["3/4", "3/8", "2/4", "1/2"],
    correctIndex: 0,
    explanation: "نجمع البسطين ونُبقي المقام كما هو: 1 + 2 = 3، إذن الناتج 3/4.",
  },
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "قابلية القسمة والعامل المشترك الأكبر والمضاعف المشترك الأصغر",
    difficulty: "easy",
    content: "ما العدد الأولي من بين الأعداد التالية؟",
    options: ["9", "15", "17", "21"],
    correctIndex: 2,
    explanation: "العدد الأولي لا يقبل القسمة إلا على نفسه وعلى الواحد، ومن بين الخيارات 17 أولي لأن 9 و15 و21 لها قواسم أخرى.",
  },
  {
    lessonCode: "l-con-1-2",
    conceptTitle: "استكشاف خط الأعداد",
    difficulty: "easy",
    content: "على خط الأعداد، يقع الكسر 1/2 بين:",
    options: ["0 و1", "1 و2", "−1 و0", "−2 و−1"],
    correctIndex: 0,
    explanation: "العدد النسبي 1/2 أكبر من صفر وأصغر من 1، فيقع بين 0 و1 على خط الأعداد.",
  },
  {
    lessonCode: "l-con-3-2",
    conceptTitle: "تفسير القيمة المطلقة واستخدامها",
    difficulty: "easy",
    content: "ما قيمة |−5|؟",
    options: ["5", "−5", "0", "10"],
    correctIndex: 0,
    explanation: "القيمة المطلقة تعبر عن البعد عن الصفر دون اتجاه، فـ|−5| = 5.",
  },
  {
    lessonCode: "l-con-2-3",
    conceptTitle: "المقادير الجبرية والأسس",
    difficulty: "easy",
    content: "ما قيمة 2³؟",
    options: ["8", "6", "9", "4"],
    correctIndex: 0,
    explanation: "الأس يعني تكرار الضرب: 2³ = 2 × 2 × 2 = 8.",
  },
  {
    lessonCode: "l-con-1-4",
    conceptTitle: "كتابة المعادلات والمتباينات واستراتيجيات حلها",
    difficulty: "easy",
    content: "ما حل المعادلة س + 7 = 15؟",
    options: ["8", "22", "7", "15"],
    correctIndex: 0,
    explanation: "نطرح 7 من الطرفين: س = 15 − 7 = 8.",
  },
  {
    lessonCode: "l-con-1-6",
    conceptTitle: "جمع البيانات وتمثيلها وتطبيقات عليها",
    difficulty: "medium",
    content: "ما المتوسط الحسابي للدرجات 7، 8، 9، 6، 10؟",
    options: ["8", "7", "9", "40"],
    correctIndex: 0,
    explanation: "المتوسط = (7 + 8 + 9 + 6 + 10) ÷ 5 = 40 ÷ 5 = 8.",
  },
  {
    lessonCode: "l-con-1-7",
    conceptTitle: "استكشاف مقاييس النزعة المركزية والانتشار",
    difficulty: "medium",
    content: "ما الوسيط للقيم 4، 7، 9، 11، 15؟",
    options: ["9", "7", "11", "15"],
    correctIndex: 0,
    explanation: "القيم مرتبة تصاعديًا وعددها 5، فالوسيط هو القيمة الوسطى 9.",
  },
];

/**
 * PHASE 30 — demo OPEN questions (free-text, graded by `grade_open`). The
 * answerKey is a short grounded fact (the seeded MCQ explanations use the same
 * wording), so a student writing the exact fact scores 1.0 deterministically.
 */
const EGYPT_DEMO_OPEN_QUESTIONS: DemoOpenQuestionSpec[] = [
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "قابلية القسمة والعامل المشترك الأكبر والمضاعف المشترك الأصغر",
    difficulty: "easy",
    content: "اكتب الكسر المبسّط للكسر 8/12.",
    answerKey: "2/3",
    explanation: "نقسم البسط والمقام على العامل المشترك الأكبر 4: 8 ÷ 4 = 2 و 12 ÷ 4 = 3، فيصبح 2/3.",
  },
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "قابلية القسمة والعامل المشترك الأكبر والمضاعف المشترك الأصغر",
    difficulty: "easy",
    content: "اكتب العدد الأولي الزوجي الوحيد.",
    answerKey: "2",
    explanation: "العدد 2 هو العدد الأولي الزوجي الوحيد، لأنه لا يقبل القسمة إلا على نفسه وعلى الواحد.",
  },
  {
    lessonCode: "l-con-1-1",
    conceptTitle: "قابلية القسمة والعامل المشترك الأكبر والمضاعف المشترك الأصغر",
    difficulty: "medium",
    content: "ما ناتج 78 ÷ 3 بالقسمة المطولة؟ اكتب إجابتك.",
    answerKey: "26",
    explanation: "7 ÷ 3 = 2 والباقي 1، ننزل 8 فتصبح 18، و18 ÷ 3 = 6. الناتج 26.",
  },
  {
    lessonCode: "l-con-1-4",
    conceptTitle: "كتابة المعادلات والمتباينات واستراتيجيات حلها",
    difficulty: "medium",
    content: "ما حل المعادلة س + 5 = 20؟ اكتب القيمة.",
    answerKey: "15",
    explanation: "نطرح 5 من الطرفين: س = 20 − 5 = 15.",
  },
];

/** PHASE 38 — two English MCQs so the new curriculum has a working practice loop. */
const EGYPT_ENGLISH_DEMO_QUESTIONS: DemoQuestionSpec[] = [
  {
    lessonCode: "l-en-present-simple",
    conceptTitle: "Third person singular with -s",
    difficulty: "easy",
    content: "Choose the correct sentence: he ___ to school by bus.",
    options: ["go", "goes", "going", "gone"],
    correctIndex: 1,
    explanation: "With he / she / it we add -s to the verb in the present simple: he goes.",
  },
  {
    lessonCode: "l-en-present-simple",
    conceptTitle: "The verb 'to be'",
    difficulty: "easy",
    content: "Choose the correct sentence: My sister ___ a teacher.",
    options: ["are", "am", "is", "be"],
    correctIndex: 2,
    explanation: "We use \"is\" with he, she and it: she is a teacher.",
  },
];

/** Per-curriculum demo question set — keyed by curriculum code, not country. */
function demoQuestionsOf(curriculumCode: string): DemoQuestionSpec[] {
  if (curriculumCode === "eg-g6-math") return EGYPT_DEMO_QUESTIONS;
  if (curriculumCode === "eg-g6-english") return EGYPT_ENGLISH_DEMO_QUESTIONS;
  return [];
}

/** Per-curriculum demo OPEN question set — Egypt Math only (PHASE 30). */
function demoOpenQuestionsOf(curriculumCode: string): DemoOpenQuestionSpec[] {
  return curriculumCode === "eg-g6-math" ? EGYPT_DEMO_OPEN_QUESTIONS : [];
}

/** Insert each missing demo question for its lesson/concept (idempotent). */
async function ensureDemoQuestions(db: DbHandle, seeded: Seeded, specs: DemoQuestionSpec[]): Promise<void> {
  for (const q of specs) {
    const scoped = seeded.lessons[q.lessonCode];
    if (!scoped) continue;
    const lessonId = scoped.lessonId;
    if (!q.options[q.correctIndex]) continue;
    const existing = await db.db
      .select({ id: questions.id })
      .from(questions)
      .where(and(eq(questions.lessonId, lessonId), eq(questions.content, q.content)))
      .limit(1);
    if (existing.length > 0) continue;
    const conceptId = q.conceptTitle
      ? (await db.db.select({ id: concepts.id }).from(concepts).where(and(eq(concepts.lessonId, lessonId), eq(concepts.title, q.conceptTitle))).limit(1).get())?.id ?? null
      : null;
    await db.db.insert(questions).values({
      id: newId("q"),
      curriculumId: seeded.curriculumId,
      lessonId,
      conceptId,
      difficulty: q.difficulty,
      type: "mcq",
      content: q.content,
      explanation: q.explanation,
      optionsJson: JSON.stringify({ options: q.options, correctIndex: q.correctIndex }),
      answerKey: null,
      createdAt: new Date(),
    });
    console.log(`  ✓ Seeded practice question "${q.content}"`);
  }
}

/** Insert each missing demo OPEN question (idempotent; answerKey stays server-side). */
async function ensureDemoOpenQuestions(db: DbHandle, seeded: Seeded, specs: DemoOpenQuestionSpec[]): Promise<void> {
  for (const q of specs) {
    const scoped = seeded.lessons[q.lessonCode];
    if (!scoped) continue;
    const lessonId = scoped.lessonId;
    const existing = await db.db
      .select({ id: questions.id })
      .from(questions)
      .where(and(eq(questions.lessonId, lessonId), eq(questions.content, q.content)))
      .limit(1);
    if (existing.length > 0) continue;
    const conceptId = q.conceptTitle
      ? (await db.db.select({ id: concepts.id }).from(concepts).where(and(eq(concepts.lessonId, lessonId), eq(concepts.title, q.conceptTitle))).limit(1).get())?.id ?? null
      : null;
    await db.db.insert(questions).values({
      id: newId("q"),
      curriculumId: seeded.curriculumId,
      lessonId,
      conceptId,
      difficulty: q.difficulty,
      type: "open",
      content: q.content,
      explanation: q.explanation,
      optionsJson: null,
      answerKey: q.answerKey,
      createdAt: new Date(),
    });
    console.log(`  ✓ Seeded practice open question "${q.content}"`);
  }
}

async function seedUsers(db: DbHandle, curriculum: CurriculumService, seeded: Seeded): Promise<void> {
  const demoStudentEmail = process.env.SEED_STUDENT_EMAIL ?? "student@alfarouq.test";
  const demoStudentPassword = process.env.SEED_STUDENT_PASSWORD ?? "student-demo-123";
  const demoAdminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@alfarouq.test";
  const demoAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin-demo-123";
  const demoParentEmail = process.env.SEED_PARENT_EMAIL ?? "parent@alfarouq.test";
  const demoParentPassword = process.env.SEED_PARENT_PASSWORD ?? "parent-demo-123";
  // Fixed, known code: lets the demo parent link the demo student in E2E/dev.
  const demoLinkCode = process.env.SEED_PARENT_LINK_CODE ?? "SLH7KQ9M";

  let studentId: string | null = null;
  const studentAccount = await db.db.select().from(users).where(eq(users.email, demoStudentEmail)).get();
  if (!studentAccount) {
    const now = new Date();
    const userId = newId("usr");
    await db.db.insert(users).values({
      id: userId,
      email: demoStudentEmail,
      passwordHash: await bcrypt.hash(demoStudentPassword, 12),
      role: "student",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    studentId = newId("stu");
    await db.db.insert(students).values({
      id: studentId,
      userId,
      displayName: "طالب تجريبي",
      countryId: seeded.countryId,
      gradeId: seeded.gradeId,
      parentLinkCode: demoLinkCode,
      createdAt: now,
      updatedAt: now,
    });
    await curriculum.enroll(studentId, seeded.curriculumId);
    console.log(`  ✓ Demo student created: ${demoStudentEmail}`);
  } else {
    console.log(`  ↺ Demo student exists: ${demoStudentEmail}`);
    // Backfill the link code on re-runs (students created before PHASE 18 lack one).
    const existing = await db.db.select().from(students).where(eq(students.userId, studentAccount.id)).get();
    studentId = existing?.id ?? null;
    if (existing && !existing.parentLinkCode) {
      await db.db
        .update(students)
        .set({ parentLinkCode: demoLinkCode, updatedAt: new Date() })
        .where(eq(students.userId, studentAccount.id));
      console.log(`  ✓ Demo student parent-link code backfilled: ${demoLinkCode}`);
    }
  }

  const adminAccount = await db.db.select().from(users).where(eq(users.email, demoAdminEmail)).get();
  if (!adminAccount) {
    const now = new Date();
    await db.db.insert(users).values({
      id: newId("usr"),
      email: demoAdminEmail,
      passwordHash: await bcrypt.hash(demoAdminPassword, 12),
      role: "admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  ✓ Demo admin created: ${demoAdminEmail}`);
  } else {
    console.log(`  ↺ Demo admin exists: ${demoAdminEmail}`);
  }

  const parentAccount = await db.db.select().from(users).where(eq(users.email, demoParentEmail)).get();
  if (!parentAccount) {
    const now = new Date();
    const userId = newId("usr");
    await db.db.insert(users).values({
      id: userId,
      email: demoParentEmail,
      passwordHash: await bcrypt.hash(demoParentPassword, 12),
      role: "parent",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    await db.db.insert(parents).values({ id: newId("par"), userId });
    console.log(`  ✓ Demo parent created: ${demoParentEmail}`);
  } else {
    console.log(`  ↺ Demo parent exists: ${demoParentEmail}`);
  }

  // PHASE 18: pre-link the demo parent ↔ demo student (idempotent).
  // Re-fetch the parent account: it may have just been created above.
  const parentRowForLink = await db.db.select().from(users).where(eq(users.email, demoParentEmail)).get();
  if (studentId && parentRowForLink) {
    const parentRow = await db.db.select().from(parents).where(eq(parents.userId, parentRowForLink.id)).get();
    const studentRow = await db.db.select().from(students).where(eq(students.id, studentId)).get();
    if (parentRow && studentRow) {
      const alreadyLinked = await db.db
        .select()
        .from(studentsParents)
        .where(and(eq(studentsParents.studentId, studentRow.id), eq(studentsParents.parentId, parentRow.id)))
        .get();
      if (!alreadyLinked) {
        await db.db.insert(studentsParents).values({ studentId: studentRow.id, parentId: parentRow.id });
        console.log(`  ✓ Demo parent linked to demo student (${demoLinkCode})`);
      } else {
        console.log("  ↺ Demo parent already linked to demo student");
      }
    }
  } else {
    console.log("  ↺ Demo student missing — skipping parent↔student link");
  }

  console.log(`\nDemo logins (dev only): student ${demoStudentEmail} / admin ${demoAdminEmail} / parent ${demoParentEmail} — insecure defaults, change in production via env.`);
}

// PHASE 43 — the seeder is importable for tests: it runs only when executed
// directly (the `npm run db:seed` script); importing it is inert.
const isDirectRun =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}

