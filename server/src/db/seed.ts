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
  ragVectors,
  students,
  studentsParents,
  subjects,
  terms,
  units,
  users,
} from "./schema.js";
import { newId } from "../utils/ids.js";
import { hasMeaningfulContent } from "../modules/rag/chunker.js";
import {
  EGYPT_T1_UNITS,
  conceptDocument,
  assertTreeMatchesTheBook as assertMathTreeMatchesBook,
  isConsistent as isMathTreeConsistent,
} from "./egyptT1.js";
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
  EGYPT_SOCIAL_G9_T1_UNITS,
  lessonDocument as socialG9LessonDocument,
  isConsistent as isSocialG9TreeConsistent,
  assertTreeMatchesTheBook as assertSocialG9TreeMatchesBook,
} from "./egyptSocialG9T1.js";
import {
  EGYPT_SOCIAL_G8_T1_UNITS,
  lessonDocument as socialG8LessonDocument,
  isConsistent as isSocialG8TreeConsistent,
  assertTreeMatchesTheBook as assertSocialG8TreeMatchesBook,
} from "./egyptSocialG8T1.js";
import {
  EGYPT_ARABIC_T1_UNITS,
  lessonDocument as arabicLessonDocument,
  isConsistent as isArabicTreeConsistent,
  assertTreeMatchesTheBook as assertArabicTreeMatchesBook,
} from "./egyptArabicT1.js";
import {
  EGYPT_ARABIC_G9_T1_UNITS,
  lessonDocument as arabicG9LessonDocument,
  isConsistent as isArabicG9TreeConsistent,
  assertTreeMatchesTheBook as assertArabicG9TreeMatchesBook,
} from "./egyptArabicG9T1.js";
import {
  EGYPT_ARABIC_G8_T1_UNITS,
  lessonDocument as arabicG8LessonDocument,
  isConsistent as isArabicG8TreeConsistent,
  assertTreeMatchesTheBook as assertArabicG8TreeMatchesBook,
} from "./egyptArabicG8T1.js";
import {
  EGYPT_ICT_T1_UNITS,
  lessonDocument as ictLessonDocument,
  isConsistent as isIctTreeConsistent,
  assertTreeMatchesTheBook as assertIctTreeMatchesBook,
} from "./egyptIctT1.js";
import {
  EGYPT_ICT_G9_T1_UNITS,
  lessonDocument as ictG9LessonDocument,
  isConsistent as isIctG9TreeConsistent,
  assertTreeMatchesTheBook as assertIctG9TreeMatchesBook,
} from "./egyptIctG9T1.js";
import {
  EGYPT_ICT_G8_T1_UNITS,
  lessonDocument as ictG8LessonDocument,
  isConsistent as isIctG8TreeConsistent,
  assertTreeMatchesTheBook as assertIctG8TreeMatchesBook,
} from "./egyptIctG8T1.js";
import {
  EGYPT_ICT_G8_EN_T1_UNITS,
  lessonDocument as ictG8EnLessonDocument,
  isConsistent as isIctG8EnTreeConsistent,
  assertTreeMatchesTheBook as assertIctG8EnTreeMatchesBook,
} from "./egyptIctG8EnT1.js";
import {
  EGYPT_ISLAMIC_T1_UNITS,
  lessonDocument as islamicLessonDocument,
  isConsistent as isIslamicTreeConsistent,
  assertTreeMatchesTheBook as assertIslamicTreeMatchesBook,
} from "./egyptIslamicT1.js";
import {
  EGYPT_ISLAMIC_G9_T1_UNITS,
  lessonDocument as islamicG9LessonDocument,
  isConsistent as isIslamicG9TreeConsistent,
  assertTreeMatchesTheBook as assertIslamicG9TreeMatchesBook,
} from "./egyptIslamicG9T1.js";
import {
  EGYPT_ISLAMIC_G8_T1_UNITS,
  lessonDocument as islamicG8LessonDocument,
  isConsistent as isIslamicG8TreeConsistent,
  assertTreeMatchesTheBook as assertIslamicG8TreeMatchesBook,
} from "./egyptIslamicG8T1.js";
import {
  EGYPT_CHRISTIAN_T1_UNITS,
  lessonDocument as christianLessonDocument,
  isConsistent as isChristianTreeConsistent,
  assertTreeMatchesTheBook as assertChristianTreeMatchesBook,
} from "./egyptChristianT1.js";
import {
  EGYPT_CHRISTIAN_G9_T1_UNITS,
  lessonDocument as christianG9LessonDocument,
  isConsistent as isChristianG9TreeConsistent,
  assertTreeMatchesTheBook as assertChristianG9TreeMatchesBook,
} from "./egyptChristianG9T1.js";
import {
  EGYPT_CHRISTIAN_G8_T1_UNITS,
  lessonDocument as christianG8LessonDocument,
  isConsistent as isChristianG8TreeConsistent,
  assertTreeMatchesTheBook as assertChristianG8TreeMatchesBook,
} from "./egyptChristianG8T1.js";
import {
  EGYPT_CHRISTIAN_P1_T1_UNITS,
  lessonDocument as christianP1LessonDocument,
  isConsistent as isChristianP1TreeConsistent,
  assertTreeMatchesTheBook as assertChristianP1TreeMatchesBook,
} from "./egyptChristianP1T1.js";
import {
  EGYPT_THEATER_P1_T1_UNITS,
  lessonDocument as theaterP1LessonDocument,
  isConsistent as isTheaterP1TreeConsistent,
  assertTreeMatchesTheBook as assertTheaterP1TreeMatchesBook,
} from "./egyptTheaterP1T1.js";
import {
  EGYPT_LIBRARIES_P1_T1_UNITS,
  lessonDocument as librariesP1LessonDocument,
  isConsistent as isLibrariesP1TreeConsistent,
  assertTreeMatchesTheBook as assertLibrariesP1TreeMatchesBook,
} from "./egyptLibrariesP1T1.js";
import {
  EGYPT_EDUCATIONAL_MEDIA_P1_T1_UNITS,
  lessonDocument as educationalMediaP1LessonDocument,
  isConsistent as isEducationalMediaP1TreeConsistent,
  assertTreeMatchesTheBook as assertEducationalMediaP1TreeMatchesBook,
} from "./egyptEducationalMediaP1T1.js";
import {
  EGYPT_ICT_P1_T1_UNITS,
  lessonDocument as ictP1LessonDocument,
  isConsistent as isIctP1TreeConsistent,
  assertTreeMatchesTheBook as assertIctP1TreeMatchesBook,
} from "./egyptIctP1T1.js";
import {
  EGYPT_ARABIC_P1_T1_UNITS,
  lessonDocument as arabicP1LessonDocument,
  isConsistent as isArabicP1TreeConsistent,
  assertTreeMatchesTheBook as assertArabicP1TreeMatchesBook,
} from "./egyptArabicP1T1.js";
import {
  EGYPT_ISLAMIC_P1_T1_UNITS,
  lessonDocument as islamicP1LessonDocument,
  isConsistent as isIslamicP1TreeConsistent,
  assertTreeMatchesTheBook as assertIslamicP1TreeMatchesBook,
} from "./egyptIslamicP1T1.js";
import {
  EGYPT_MATH_EN_T1_UNITS,
  conceptDocument as mathEnConceptDocument,
  isConsistent as isMathEnTreeConsistent,
  assertTreeMatchesTheBook as assertMathEnTreeMatchesBook,
} from "./egyptMathEnT1.js";
import {
  EGYPT_MATH_FR_T1_UNITS,
  conceptDocument as mathFrConceptDocument,
  isConsistent as isMathFrTreeConsistent,
  assertTreeMatchesTheBook as assertMathFrTreeMatchesBook,
} from "./egyptMathFrT1.js";
import {
  EGYPT_MATH_G9_T1_UNITS,
  lessonDocument as mathG9LessonDocument,
  isConsistent as isMathG9TreeConsistent,
  assertTreeMatchesTheBook as assertMathG9TreeMatchesBook,
} from "./egyptMathG9T1.js";
import {
  EGYPT_MATH_P1_T1_UNITS,
  lessonDocument as mathP1LessonDocument,
  isConsistent as isMathP1TreeConsistent,
  assertTreeMatchesTheBook as assertMathP1TreeMatchesBook,
} from "./egyptMathP1T1.js";
import {
  EGYPT_SCIENCE_G9_T1_UNITS,
  lessonDocument as scienceG9LessonDocument,
  isConsistent as isScienceG9TreeConsistent,
  assertTreeMatchesTheBook as assertScienceG9TreeMatchesBook,
} from "./egyptScienceG9T1.js";
import {
  EGYPT_SCIENCE_G8_T1_UNITS,
  lessonDocument as scienceG8LessonDocument,
  isConsistent as isScienceG8TreeConsistent,
  assertTreeMatchesTheBook as assertScienceG8TreeMatchesBook,
} from "./egyptScienceG8T1.js";
import {
  EGYPT_AGRICULTURE_G8_T1_UNITS,
  lessonDocument as agricultureG8LessonDocument,
  isConsistent as isAgricultureG8TreeConsistent,
  assertTreeMatchesTheBook as assertAgricultureG8TreeMatchesBook,
} from "./egyptAgricultureG8T1.js";
import {
  EGYPT_INDUSTRY_G8_T1_UNITS,
  lessonDocument as industryG8LessonDocument,
  isConsistent as isIndustryG8TreeConsistent,
  assertTreeMatchesTheBook as assertIndustryG8TreeMatchesBook,
} from "./egyptIndustryG8T1.js";
import {
  EGYPT_LIBRARIES_G8_T1_UNITS,
  lessonDocument as librariesG8LessonDocument,
  isConsistent as isLibrariesG8TreeConsistent,
  assertTreeMatchesTheBook as assertLibrariesG8TreeMatchesBook,
} from "./egyptLibrariesG8T1.js";
import {
  EGYPT_SCIENCE_G8_EN_T1_UNITS,
  lessonDocument as scienceG8EnLessonDocument,
  isConsistent as isScienceG8EnTreeConsistent,
  assertTreeMatchesTheBook as assertScienceG8EnTreeMatchesBook,
} from "./egyptScienceG8EnT1.js";
import {
  EGYPT_SCIENCE_EN_P1_T1_UNITS,
  lessonDocument as scienceEnP1LessonDocument,
  isConsistent as isScienceEnP1TreeConsistent,
  assertTreeMatchesTheBook as assertScienceEnP1TreeMatchesBook,
} from "./egyptScienceEnP1T1.js";
import {
  EGYPT_MATH_EN_P1_T1_UNITS,
  lessonDocument as mathEnP1LessonDocument,
  isConsistent as isMathEnP1TreeConsistent,
  assertTreeMatchesTheBook as assertMathEnP1TreeMatchesBook,
} from "./egyptMathEnP1T1.js";
import {
  EGYPT_SCIENCE_FR_P1_T1_UNITS,
  lessonDocument as scienceFrP1LessonDocument,
  isConsistent as isScienceFrP1TreeConsistent,
  assertTreeMatchesTheBook as assertScienceFrP1TreeMatchesBook,
} from "./egyptScienceFrP1T1.js";
import {
  EGYPT_SCIENCE_P1_T1_UNITS,
  lessonDocument as scienceP1LessonDocument,
  isConsistent as isScienceP1TreeConsistent,
  assertTreeMatchesTheBook as assertScienceP1TreeMatchesBook,
} from "./egyptScienceP1T1.js";
import {
  EGYPT_SOCIAL_P1_T1_UNITS,
  lessonDocument as socialP1LessonDocument,
  isConsistent as isSocialP1TreeConsistent,
  assertTreeMatchesTheBook as assertSocialP1TreeMatchesBook,
} from "./egyptSocialP1T1.js";
import {
  EGYPT_ENGLISH_G9_T1_SECTIONS,
  lessonDocument as englishG9LessonDocument,
  isConsistent as isEnglishG9TreeConsistent,
  assertTreeMatchesTheBook as assertEnglishG9TreeMatchesBook,
} from "./egyptEnglishG9T1.js";
import {
  EGYPT_ENGLISH_G10_T1_SECTIONS,
  lessonDocument as englishG10LessonDocument,
  isConsistent as isEnglishG10TreeConsistent,
  assertTreeMatchesTheBook as assertEnglishG10TreeMatchesBook,
} from "./egyptEnglishG10T1.js";
import {
  EGYPT_ENGLISH2_G10_T1_SECTIONS,
  lessonDocument as english2G10LessonDocument,
  isConsistent as isEnglish2G10TreeConsistent,
  assertTreeMatchesTheBook as assertEnglish2G10TreeMatchesBook,
} from "./egyptEnglish2G10T1.js";
import {
  EGYPT_ITALIAN_G10_T1_SECTIONS,
  lessonDocument as italianG10LessonDocument,
  isConsistent as isItalianG10TreeConsistent,
  assertTreeMatchesTheBook as assertItalianG10TreeMatchesBook,
} from "./egyptItalianG10T1.js";
import {
  EGYPT_GERMAN_G10_T1_SECTIONS,
  lessonDocument as germanG10LessonDocument,
  isConsistent as isGermanG10TreeConsistent,
  assertTreeMatchesTheBook as assertGermanG10TreeMatchesBook,
} from "./egyptGermanG10T1.js";
import {
  EGYPT_SPANISH_G10_T1_SECTIONS,
  lessonDocument as spanishG10LessonDocument,
  isConsistent as isSpanishG10TreeConsistent,
  assertTreeMatchesTheBook as assertSpanishG10TreeMatchesBook,
} from "./egyptSpanishG10T1.js";
import {
  EGYPT_FRENCH_G10_T1_SECTIONS,
  lessonDocument as frenchG10LessonDocument,
  isConsistent as isFrenchG10TreeConsistent,
  assertTreeMatchesTheBook as assertFrenchG10TreeMatchesBook,
} from "./egyptFrenchG10T1.js";
import {
  EGYPT_ENGLISH_G8_T1_SECTIONS,
  lessonDocument as englishG8LessonDocument,
  isConsistent as isEnglishG8TreeConsistent,
  assertTreeMatchesTheBook as assertEnglishG8TreeMatchesBook,
} from "./egyptEnglishG8T1.js";
import {
  EGYPT_ENGLISH_P1_T1_SECTIONS,
  lessonDocument as englishP1LessonDocument,
  isConsistent as isEnglishP1TreeConsistent,
  assertTreeMatchesTheBook as assertEnglishP1TreeMatchesBook,
} from "./egyptEnglishP1T1.js";
import {
  EGYPT_MATH_G8_T1_UNITS,
  lessonDocument as mathG8LessonDocument,
  isConsistent as isMathG8TreeConsistent,
  assertTreeMatchesTheBook as assertMathG8TreeMatchesBook,
} from "./egyptMathG8T1.js";
import {
  EGYPT_MATH_G8_EN_T1_UNITS,
  lessonDocument as mathG8EnLessonDocument,
  isConsistent as isMathG8EnTreeConsistent,
  assertTreeMatchesTheBook as assertMathG8EnTreeMatchesBook,
} from "./egyptMathG8EnT1.js";
import {
  EGYPT_MATH_G8_FR_T1_UNITS,
  lessonDocument as mathG8FrLessonDocument,
  isConsistent as isMathG8FrTreeConsistent,
  assertTreeMatchesTheBook as assertMathG8FrTreeMatchesBook,
} from "./egyptMathG8FrT1.js";

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
 * Egyptian Grade-6 Math — OFFICIAL curriculum (PHASE 47; concepts aligned in
 * PHASE 69).
 *
 * The first-term tree IS the Ministry textbook (Math Techbook™ G6 T1): 7 units
 * with 10 printed concepts («المفاهيم» → app lessons), each grounded on the OCR
 * text of the book's own pages (server/data/curriculum-ocr/) so the tutor's RAG
 * retrieval reads from «كتاب الوزارة» verbatim. Each lesson's `concepts` are the
 * printed «أهداف التعلم» bullets of its lessons, verbatim. The tree is verified
 * before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` re-reads every page to confirm each objective is
 * printed in its concept's range and each lesson start prints the objective
 * header. The second term remains a hand-written placeholder until the T2 book is
 * imported the same way.
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
  const check = verifyMathTree();
  if (!check.ok) throw new Error(`شجرة كتاب الرياضيات غير متسقة:\n- ${check.problems.join("\n- ")}`);
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
          concepts: concept.concepts,
          doc: { title, content: conceptDocument(ui, ci) },
        };
      }),
    })),
  };
}

/** Both halves of the maths tree verification, as one verdict. */
function verifyMathTree(): { ok: boolean; problems: string[] } {
  const table = isMathTreeConsistent();
  const book = assertMathTreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-3 (Grade 9) **Mathematics** — OFFICIAL curriculum
 * (PHASE 83).
 *
 * The first term IS the Ministry textbook (`Math_Ar_prep3_t1.pdf`, 2026/2027 MoE
 * edition, 114 scan pages, all OCR'd): its 4 units and 15 lessons exactly as the
 * book's المحتويات prints them. The book prints no «مفهوم» layer, so each
 * lesson's concepts are the printed «نواتج التعلم» at its head, and a unit's
 * opener and its «تقييم الوحدة» ride with its first/last lesson. There is no
 * second term yet: its book has not been imported.
 */
export const EGYPT_MATH_G9_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-9", name: "Grade 9", nameAr: "الصف الثالث الإعدادي", levelOrder: 9 },
  curriculum: { code: "eg-g9-math", title: "الرياضيات للصف الثالث الإعدادي" },
  terms: [buildEgyptMathG9Term()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptMathG9Term(): TermSeedSpec {
  const check = verifyMathG9Tree();
  if (!check.ok) throw new Error(`شجرة كتاب الرياضيات (إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_MATH_G9_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          code: `l-g9-math-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: mathG9LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-9 maths tree verification, as one verdict. */
function verifyMathG9Tree(): { ok: boolean; problems: string[] } {
  const table = isMathG9TreeConsistent();
  const book = assertMathG9TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-1 (Grade 7) **Mathematics** — OFFICIAL curriculum
 * (PHASE 97).
 *
 * The first term IS the Ministry textbook (`Math_Prep1_T1.pdf`, 2026/2027 MoE
 * edition, 121 pages, all OCR'd): its 4 units and 16 lessons exactly as the
 * book's «محتويات الكتاب» (book page iv) prints them, each grounded on the OCR
 * text of the pages the book prints for it
 * (server/data/curriculum-ocr/math-p1-t1/). The book prints no «مفهوم» layer, so
 * each lesson's concepts are the printed «نواتج التعلم» at its head; a unit's
 * opener rides with its first lesson and its «تقييم الوحدة» — plus the book's
 * closing «تقييم نهائي» — with its last. The credits page (book 114) is back
 * matter outside the taught ranges. There is no second-term spec: its book has
 * not been imported.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed running
 * feet, each lesson head's own title, and the tiling. Seeding refuses to run on
 * an unverified table.
 */
export const EGYPT_MATH_P1_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-7", name: "Grade 7", nameAr: "الصف الأول الإعدادي", levelOrder: 7 },
  subject: { code: "math", name: "Mathematics", nameAr: "الرياضيات" },
  curriculum: { code: "eg-g7-math", title: "الرياضيات للصف الأول الإعدادي" },
  terms: [buildEgyptMathP1Term()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptMathP1Term(): TermSeedSpec {
  const check = verifyMathP1Tree();
  if (!check.ok) throw new Error(`شجرة كتاب الرياضيات (أولى إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_MATH_P1_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g7-math-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: mathP1LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-7 maths tree verification, as one verdict. */
function verifyMathP1Tree(): { ok: boolean; problems: string[] } {
  const table = isMathP1TreeConsistent();
  const book = assertMathP1TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-2 (Grade 8) **Mathematics** — OFFICIAL curriculum.
 *
 * The first term IS the Ministry textbook (`Math_Ar_prep2_t1.pdf`, 2026/2027
 * MoE edition, 130 scan pages, all OCR'd): the four units and their seventeen
 * printed «الدرس» exactly as «محتويات الكتاب» (book page iv) lists them, each
 * grounded on the OCR text of the pages the book prints for it
 * (server/data/curriculum-ocr/math-p2-t1/). The app lesson is the book's
 * printed «الدرس» — there is no «مفهوم» layer: the lesson head prints
 * «نواتج التعلم», and every content page's foot prints that page's own
 * number. A unit's opener rides with its unit's first lesson, and each unit's
 * «تقييم الوحدة» — plus the book's closing «تقييم نهائى» — rides with its
 * last. Books 123–125 (a foreign appendix, the credits and the back cover)
 * are back matter outside the taught ranges.
 *
 * The tree is verified before seeding: `isConsistent` checks the table's
 * invariants and `assertTreeMatchesTheBook` proves the page mapping from the
 * 116 printed running feet, each lesson head's own title, and the tiling.
 * Seeding refuses to run on an unverified table.
 */
export const EGYPT_MATH_G8_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-8", name: "Grade 8", nameAr: "الصف الثاني الإعدادي", levelOrder: 8 },
  subject: { code: "math", name: "Mathematics", nameAr: "الرياضيات" },
  curriculum: { code: "eg-g8-math", title: "الرياضيات للصف الثاني الإعدادي" },
  terms: [buildEgyptMathG8Term()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptMathG8Term(): TermSeedSpec {
  const check = verifyMathG8Tree();
  if (!check.ok) throw new Error(`شجرة كتاب الرياضيات (ثانية إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_MATH_G8_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g8-math-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: mathG8LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-8 maths tree verification, as one verdict. */
function verifyMathG8Tree(): { ok: boolean; problems: string[] } {
  const table = isMathG8TreeConsistent();
  const book = assertMathG8TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-2 (Grade 8) **Mathematics, English-medium edition** —
 * OFFICIAL curriculum.
 *
 * The first term IS the Ministry textbook `Math_EN_Prp2_T1.pdf` (2026/2027 MoE
 * edition, 130 scan pages, all OCR'd) — the English edition of the same book as
 * `eg-g8-math`: the same four units and seventeen printed «الدرس» exactly as
 * the book's contents page (book page iv) lists them, each grounded on the OCR
 * text of the pages the book prints for it (server/data/curriculum-ocr/
 * math-en-p2-t1/). The app lesson is the book's printed «الدرس» — there is no
 * «مفهوم» layer: the lesson head prints «Learning Outcomes». A unit's opener
 * rides with its unit's first lesson, and each unit's «Unit N Assessment» —
 * plus the book's closing «Final Assessment» — rides with its last. Books
 * 123–125 (a blank page, the credits and the back cover) are back matter
 * outside the taught ranges.
 *
 * The tree is verified before seeding: `isConsistent` checks the table's
 * invariants and `assertTreeMatchesTheBook` proves the page mapping from the
 * 116 printed running feet, each lesson head's own title, and the tiling.
 * Seeding refuses to run on an unverified table.
 */
export const EGYPT_MATH_G8_EN_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-8", name: "Grade 8", nameAr: "الصف الثاني الإعدادي", levelOrder: 8 },
  subject: { code: "math-en", name: "Mathematics (English)", nameAr: "الرياضيات (بالإنجليزية)" },
  curriculum: { code: "eg-g8-math-en", title: "الرياضيات للصف الثاني الإعدادي (بالإنجليزية)" },
  terms: [buildEgyptMathG8EnTerm()],
};

/** Term 1 = the official English book: unit → lesson, the whole lesson as its document. */
function buildEgyptMathG8EnTerm(): TermSeedSpec {
  const check = verifyMathG8EnTree();
  if (!check.ok) throw new Error(`شجرة كتاب الرياضيات (بالإنجليزية) ثانية إعدادي غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_MATH_G8_EN_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g8-math-en-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: mathG8EnLessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-8 English-medium maths tree verification, as one verdict. */
function verifyMathG8EnTree(): { ok: boolean; problems: string[] } {
  const table = isMathG8EnTreeConsistent();
  const book = assertMathG8EnTreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-2 (Grade 8) **Mathematics, French-medium edition** —
 * OFFICIAL curriculum.
 *
 * The first term IS the Ministry textbook `Math_FR_Prp2_T1.pdf` (2026/2027 MoE
 * edition, 128 scan pages, all OCR'd) — the French edition of the same book as
 * `eg-g8-math`: the same four units and seventeen printed «الدرس» exactly as
 * the book's contents page (book page iv) lists them, each grounded on the OCR
 * text of the pages the book prints for it (server/data/curriculum-ocr/
 * math-fr-p2-t1/). The app lesson is the book's printed «الدرس» — there is no
 * «مفهوم» layer: the lesson head prints «Résultats d'apprentissage». A unit's
 * opener rides with its unit's first lesson, and each unit's «Évaluation de
 * l'unité N» — plus the book's closing «Évaluation finale» — rides with its
 * last. Books 123–128 (a blank page, the credits and publisher back matter)
 * are back matter outside the taught ranges.
 *
 * The tree is verified before seeding: `isConsistent` checks the table's
 * invariants and `assertTreeMatchesTheBook` proves the page mapping from the
 * 114 printed running feet, each lesson head's own title, and the tiling.
 * Seeding refuses to run on an unverified table.
 */
export const EGYPT_MATH_G8_FR_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-8", name: "Grade 8", nameAr: "الصف الثاني الإعدادي", levelOrder: 8 },
  subject: { code: "math-fr", name: "Mathematics (French)", nameAr: "الرياضيات (بالفرنسية)" },
  curriculum: { code: "eg-g8-math-fr", title: "الرياضيات للصف الثاني الإعدادي (بالفرنسية)" },
  terms: [buildEgyptMathG8FrTerm()],
};

/** Term 1 = the official French book: unit → lesson, the whole lesson as its document. */
function buildEgyptMathG8FrTerm(): TermSeedSpec {
  const check = verifyMathG8FrTree();
  if (!check.ok) throw new Error(`شجرة كتاب الرياضيات (بالفرنسية) ثانية إعدادي غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_MATH_G8_FR_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g8-math-fr-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: mathG8FrLessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-8 French-medium maths tree verification, as one verdict. */
function verifyMathG8FrTree(): { ok: boolean; problems: string[] } {
  const table = isMathG8FrTreeConsistent();
  const book = assertMathG8FrTreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-3 (Grade 9) **Science** — OFFICIAL curriculum (PHASE 84).
 *
 * The first term IS the Ministry textbook (`Science_AR_Prp3_Tr1.pdf`, 2026/2027
 * MoE edition, 114 scan pages, all OCR'd): its 4 units and 10 lessons exactly as
 * the book's المحتويات prints them. Like the other Preparatory books, it has no
 * «مفهوم» layer, so each lesson's concepts are the printed «أهداف الدرس» at its
 * head, and a unit's opener rides with its first lesson. There is no unit-level
 * «مراجعة»: every unit ends on the last lesson's own «أسئلة تقييم الدرس». There
 * is no second term yet: its book has not been imported.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the lesson titles each lesson page prints, and the tiling. Seeding refuses to
 * run on an unverified table.
 */
export const EGYPT_SCIENCE_G9_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-9", name: "Grade 9", nameAr: "الصف الثالث الإعدادي", levelOrder: 9 },
  subject: { code: "science", name: "Science", nameAr: "العلوم" },
  curriculum: { code: "eg-g9-science", title: "العلوم للصف الثالث الإعدادي" },
  terms: [buildEgyptScienceG9Term()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptScienceG9Term(): TermSeedSpec {
  const check = verifyScienceG9Tree();
  if (!check.ok) throw new Error(`شجرة كتاب العلوم (إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_SCIENCE_G9_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g9-sci-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: scienceG9LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-9 science tree verification, as one verdict. */
function verifyScienceG9Tree(): { ok: boolean; problems: string[] } {
  const table = isScienceG9TreeConsistent();
  const book = assertScienceG9TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-8 (Preparatory-2) **Science** — OFFICIAL curriculum.
 *
 * The first term IS the Ministry textbook (`Science_Ar_prep2_t1.pdf`, «اكتشف
 * و تعلم», 2026/2027 MoE edition, 106 scan pages): the four units and their
 * eleven printed «الدرس» exactly as «محتويات الكتاب» (book pages iv–v) lists
 * them, each grounded on the OCR text of the pages the book prints for it
 * (server/data/curriculum-ocr/science-p2-t1/). The app lesson is the book's
 * printed «الدرس» — there is no «مفهوم» layer: the lesson head prints
 * «مصطلحات الدرس» then «أهداف الدرس», and every content page's foot names
 * that lesson. A unit's «دروس الوحدة / نواتج التعلم» opener rides with its
 * unit's first lesson, and each lesson carries the verbatim «أهداف الدرس» the
 * book prints at its head.
 *
 * Book pages ≤ 0 are front matter (the «محتويات» themselves) and 98–99 are the
 * credits and back cover: outside the taught ranges.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping page by page from the
 * printed footers, checks every lesson's opener prints its title, and confirms
 * no printed page falls outside a lesson. Seeding refuses to run on an
 * unverified table.
 */
export const EGYPT_SCIENCE_G8_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-8", name: "Grade 8", nameAr: "الصف الثاني الإعدادي", levelOrder: 8 },
  subject: { code: "science", name: "Science", nameAr: "العلوم" },
  curriculum: { code: "eg-g8-science", title: "العلوم للصف الثاني الإعدادي" },
  terms: [buildEgyptScienceG8Term()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptScienceG8Term(): TermSeedSpec {
  const check = verifyScienceG8Tree();
  if (!check.ok) throw new Error(`شجرة كتاب العلوم (ثانية إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_SCIENCE_G8_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g8-sci-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: scienceG8LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-8 science tree verification, as one verdict. */
function verifyScienceG8Tree(): { ok: boolean; problems: string[] } {
  const table = isScienceG8TreeConsistent();
  const book = assertScienceG8TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-8 (Preparatory-2) **Science, English-medium** — OFFICIAL
 * curriculum (`eg-g8-science-en`), registered as its own subject
 * (`science-en`, «العلوم (بالإنجليزية)») alongside the Arabic one, mirroring
 * how `eg-g6-math-en` sits beside `eg-g6-math`.
 *
 * The first term IS the Ministry textbook `Science_EN_Pep2_T1.pdf`
 * (2026/2027 MoE edition, 104 scan pages, all OCR'd): the same four units and
 * eleven printed lessons as the Arabic edition — the book's «Contents» and
 * «Lesson Objectives» are the source of truth, and the app lesson is the
 * printed Lesson. The document is the whole lesson assembled from the OCR of
 * the pages the book prints for it, its unit opener included.
 *
 * Verified before seeding: `isConsistent` checks the table's invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the 82 printed
 * running feet, each lesson head's own title, and the tiling.
 */
export const EGYPT_SCIENCE_G8_EN_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-8", name: "Grade 8", nameAr: "الصف الثاني الإعدادي", levelOrder: 8 },
  subject: { code: "science-en", name: "Science (English)", nameAr: "العلوم (بالإنجليزية)" },
  curriculum: { code: "eg-g8-science-en", title: "العلوم للصف الثاني الإعدادي (بالإنجليزية)" },
  terms: [buildEgyptScienceG8EnTerm()],
};

/** Term 1 = the official English book: unit → lesson, the whole lesson as one document. */
function buildEgyptScienceG8EnTerm(): TermSeedSpec {
  const check = verifyScienceG8EnTree();
  if (!check.ok) throw new Error(`شجرة كتاب العلوم الإنجليزي (ثانية إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_SCIENCE_G8_EN_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g8-sci-en-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: scienceG8EnLessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-8 English-science tree verification, as one verdict. */
function verifyScienceG8EnTree(): { ok: boolean; problems: string[] } {
  const table = isScienceG8EnTreeConsistent();
  const book = assertScienceG8EnTreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-1 (Grade 7) **Science, English-medium** — OFFICIAL
 * curriculum (PHASE 97).
 *
 * The first term IS the Ministry textbook (`Science_Prep1_T1_EN.pdf`,
 * 2026/2027 MoE edition, 102 scan pages, all OCR'd): the four units and twelve
 * printed lessons exactly as the book's «Contents» (book pages iv–v) prints them,
 * each grounded on the OCR text of the pages the book prints for it
 * (server/data/curriculum-ocr/science-en-p1-t1/). The app lesson is the printed
 * Lesson and its concepts are the printed «Lesson Objectives»; a unit's opener
 * rides with its first lesson and its assessment with its last. There is no
 * second-term spec: its book has not been imported.
 *
 * Verified before seeding: `isConsistent` checks the table's invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed running
 * feet, each lesson head's own title, and the tiling.
 */
export const EGYPT_SCIENCE_EN_P1_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-7", name: "Grade 7", nameAr: "الصف الأول الإعدادي", levelOrder: 7 },
  subject: { code: "science-en", name: "Science (English)", nameAr: "العلوم (بالإنجليزية)" },
  curriculum: { code: "eg-g7-science-en", title: "العلوم للصف الأول الإعدادي (بالإنجليزية)" },
  terms: [buildEgyptScienceEnP1Term()],
};

/** Term 1 = the official English book: unit → lesson, the whole lesson as one document. */
function buildEgyptScienceEnP1Term(): TermSeedSpec {
  const check = verifyScienceEnP1Tree();
  if (!check.ok) throw new Error(`شجرة كتاب العلوم الإنجليزي (أولى إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_SCIENCE_EN_P1_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g7-sci-en-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: scienceEnP1LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-7 English-science tree verification, as one verdict. */
function verifyScienceEnP1Tree(): { ok: boolean; problems: string[] } {
  const table = isScienceEnP1TreeConsistent();
  const book = assertScienceEnP1TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-1 (Grade 7) **Mathematics, English-medium edition** —
 * OFFICIAL curriculum (PHASE 99).
 *
 * The first term IS the Ministry textbook `Math_EN_Prp1_T1.pdf` (2026/2027 MoE
 * edition, 122 scan pages, vision-OCR'd) — the English edition of the same book
 * as `eg-g7-math`: four units and sixteen printed «الدرس» in the book's own
 * order, each grounded on the OCR text of the pages the book prints for it
 * (server/data/curriculum-ocr/math-en-p1-t1/). The app lesson is the printed
 * «الدرس»; each one's head prints «Learning Outcomes», which become the
 * lesson's concepts. A unit opener rides with its first lesson and each unit's
 * «Unit N Assessment» — plus the closing «Final Assessment» — with its last.
 *
 * The tree is verified before seeding (`isConsistent` + `assertTreeMatchesTheBook`),
 * including the printed running feet and the tiling to books 1–113 (book page 48
 * is a textless figure page the verifier lists in `TEXTLESS_PAGES`).
 */
export const EGYPT_MATH_EN_P1_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-7", name: "Grade 7", nameAr: "الصف الأول الإعدادي", levelOrder: 7 },
  subject: { code: "math-en", name: "Mathematics (English)", nameAr: "الرياضيات (بالإنجليزية)" },
  curriculum: { code: "eg-g7-math-en", title: "الرياضيات للصف الأول الإعدادي (بالإنجليزية)" },
  terms: [buildMathEnP1Term()],
};

/** Term 1 = the official English maths book: unit → lesson, the whole lesson as one document. */
function buildMathEnP1Term(): TermSeedSpec {
  const check = verifyMathEnP1Tree();
  if (!check.ok) throw new Error(`شجرة كتاب الرياضيات الإنجليزي (أولى إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_MATH_EN_P1_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g7-math-en-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: mathEnP1LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-7 English-maths tree verification, as one verdict. */
function verifyMathEnP1Tree(): { ok: boolean; problems: string[] } {
  const table = isMathEnP1TreeConsistent();
  const book = assertMathEnP1TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-1 (Grade 7) **Science, Arabic edition** — OFFICIAL
 * curriculum (PHASE 99).
 *
 * The first term IS the Ministry textbook `Science_Prep1_T1.pdf` (102 scan
 * pages, vision-OCR'd) — the Arabic edition of the same book as `eg-g7-science-en`
 * and `eg-g7-science-fr`: the same four units and twelve printed «الدرس» in the
 * book's own order (server/data/curriculum-ocr/science-p1-t1/). Each app lesson
 * is the printed «الدرس»; the lesson head prints «نواتج التعلم», which become
 * the lesson's concepts. A unit opener rides with its first lesson and each
 * unit's «تقييم الوحدة» — plus the closing «التقييم النهائي» — with its last.
 *
 * The tree is verified before seeding (`isConsistent` + `assertTreeMatchesTheBook`),
 * including each page's printed running foot (captioned «الدرس»/«الوحدة») and the
 * tiling to books 6–107.
 */
export const EGYPT_SCIENCE_P1_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-7", name: "Grade 7", nameAr: "الصف الأول الإعدادي", levelOrder: 7 },
  subject: { code: "science", name: "Science", nameAr: "العلوم" },
  curriculum: { code: "eg-g7-science", title: "العلوم للصف الأول الإعدادي" },
  terms: [buildScienceP1Term()],
};

/** Term 1 = the official Arabic science book: unit → lesson, the whole lesson as one document. */
function buildScienceP1Term(): TermSeedSpec {
  const check = verifyScienceP1Tree();
  if (!check.ok) throw new Error(`شجرة كتاب العلوم (أولى إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_SCIENCE_P1_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g7-sci-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: scienceP1LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-7 Arabic-science tree verification, as one verdict. */
function verifyScienceP1Tree(): { ok: boolean; problems: string[] } {
  const table = isScienceP1TreeConsistent();
  const book = assertScienceP1TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-1 (Grade 7) **Science, French-medium edition** —
 * OFFICIAL curriculum (PHASE 99).
 *
 * The first term IS the Ministry textbook `Science_FR_Prp1_TR1.pdf` (101 scan
 * pages, vision-OCR'd) — the French edition of the same book as `eg-g7-science-en`
 * and `eg-g7-science`: the same four units and twelve printed «Leçon» in the
 * book's own order (server/data/curriculum-ocr/science-fr-p1-t1/). The app lesson
 * is the printed «Leçon», titled bilingually; its head prints «Objectifs», which
 * become the lesson's concepts.
 *
 * The tree is verified before seeding (`isConsistent` + `assertTreeMatchesTheBook`),
 * including each page's printed running foot («LEÇON»/«UNITÉ») and the tiling to
 * books 1–93.
 */
export const EGYPT_SCIENCE_FR_P1_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-7", name: "Grade 7", nameAr: "الصف الأول الإعدادي", levelOrder: 7 },
  subject: { code: "science-fr", name: "Science (French)", nameAr: "العلوم (بالفرنسية)" },
  curriculum: { code: "eg-g7-science-fr", title: "العلوم للصف الأول الإعدادي (بالفرنسية)" },
  terms: [buildScienceFrP1Term()],
};

/** Term 1 = the official French science book: unit → lesson, the whole lesson as one document. */
function buildScienceFrP1Term(): TermSeedSpec {
  const check = verifyScienceFrP1Tree();
  if (!check.ok) throw new Error(`شجرة كتاب العلوم الفرنسي (أولى إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_SCIENCE_FR_P1_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g7-sci-fr-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: scienceFrP1LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-7 French-science tree verification, as one verdict. */
function verifyScienceFrP1Tree(): { ok: boolean; problems: string[] } {
  const table = isScienceFrP1TreeConsistent();
  const book = assertScienceFrP1TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-1 (Grade 7) **Social Studies, Arabic edition** —
 * OFFICIAL curriculum (PHASE 99).
 *
 * The first term IS the Ministry textbook `Social_Studies_Prep1_T1.pdf` (110
 * scan pages, vision-OCR'd) — `server/data/curriculum-ocr/social-p1-t1/`. Four
 * units and eleven printed «الدرس» mirror the Grade-8 social structure (unit →
 * lesson, first lesson owns the unit opener, last owns «تقييم ختامي»), each
 * grounded on its printed pages; the general review and the two term exams live
 * in the lesson range of the closing «مراجعة عامة» section (books 96–107).
 * There is no concepts fingerprint check (mirrors `eg-g8-social`): the book's
 * «أهداف» are transcribed by hand and OCR-cleaned.
 *
 * The tree is verified before seeding (`isConsistent` + `assertTreeMatchesTheBook`),
 * including each page's bare printed footer and the tiling to books 6–107 (book
 * page 55 is a textless map page the verifier lists in `TEXTLESS_PAGES`).
 */
export const EGYPT_SOCIAL_P1_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-7", name: "Grade 7", nameAr: "الصف الأول الإعدادي", levelOrder: 7 },
  subject: { code: "social", name: "Social Studies", nameAr: "الدراسات الاجتماعية" },
  curriculum: { code: "eg-g7-social", title: "الدراسات الاجتماعية للصف الأول الإعدادي" },
  terms: [buildSocialP1Term()],
};

/** Term 1 = the official social-studies book: unit → lesson, the whole lesson as one document. */
function buildSocialP1Term(): TermSeedSpec {
  const check = verifySocialP1Tree();
  if (!check.ok) throw new Error(`شجرة كتاب الدراسات الاجتماعية (أولى إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_SOCIAL_P1_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g7-social-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: socialP1LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-7 social-studies tree verification, as one verdict. */
function verifySocialP1Tree(): { ok: boolean; problems: string[] } {
  const table = isSocialP1TreeConsistent();
  const book = assertSocialP1TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-3 (Grade 9) **English** — OFFICIAL curriculum (PHASE 85).
 *
 * The first term IS the Ministry textbook (`English_language_prep3_t1.pdf`,
 * 2026/2027 MoE edition, 114 scan pages, all OCR'd): the six units of its printed
 * «Contents», the two reviews around them, and the «Start Smart» bridge that
 * precedes unit 1. The app lesson is the book's printed **lesson** (a unit's
 * Learning Outcomes opener rides with its first lesson, its Self-Reflection with
 * its last); the reviews keep their printed «Lesson 1»/«Lesson 2». The book
 * prints no per-lesson objectives — its outcomes sit on the unit opener, grouped
 * by skill — so each lesson's `concepts` are the verbatim outcomes of the skill(s)
 * it teaches. Each listening lesson also points at its own «Audioscripts» page so
 * the tutor can quote the passage the book points to. The subject code `english`
 * is what makes the tutor answer in English (D-042).
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the lesson heads each lesson page prints, the appendix pages, and the tiling.
 * Seeding refuses to run on an unverified table.
 */
export const EGYPT_ENGLISH_G9_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-9", name: "Grade 9", nameAr: "الصف الثالث الإعدادي", levelOrder: 9 },
  subject: { code: "english", name: "English", nameAr: "اللغة الإنجليزية" },
  curriculum: { code: "eg-g9-english", title: "اللغة الإنجليزية للصف الثالث الإعدادي" },
  terms: [buildEgyptEnglishG9Term()],
};

/** Term 1 = the official book: printed section → printed lesson, as its document. */
function buildEgyptEnglishG9Term(): TermSeedSpec {
  const check = verifyEnglishG9Tree();
  if (!check.ok) throw new Error(`شجرة كتاب الإنجليزي (إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ENGLISH_G9_T1_SECTIONS.map((section, si) => ({
      code: `unit-${si + 1}`,
      title: section.title,
      lessons: section.lessons.map((lesson, li) => ({
        // Namespaced so codes stay unique across every seeded curriculum.
        code: `l-g9-eng-${lesson.key}`,
        title: lesson.title,
        concepts: lesson.concepts,
        doc: { title: lesson.title, content: englishG9LessonDocument(si, li) },
      })),
    })),
  };
}

/** Both halves of the Grade-9 English tree verification, as one verdict. */
function verifyEnglishG9Tree(): { ok: boolean; problems: string[] } {
  const table = isEnglishG9TreeConsistent();
  const book = assertEnglishG9TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Secondary-1 (Grade 10) **English** — OFFICIAL curriculum (PHASE 100).
 *
 * The first term IS the Ministry textbook (`english-g10-t1`, 2026/2027 MoE
 * edition, 172 scan pages, all OCR'd): the printed «Start Smart» bridge, the six
 * units of its Contents, and the two reviews around them. The book prints its own
 * page number on every content page, so the offset is zero (book page = scan
 * page) and the mapping is read straight back from the page's running head/foot.
 * The app lesson is the book's printed **lesson** (a unit's Learning Outcomes
 * opener rides with its first lesson); each review is one lesson carrying its
 * printed A–F parts. The book prints no per-lesson objectives — its outcomes sit
 * on the unit opener, grouped by skill — so each lesson's `concepts` are the
 * verbatim outcomes of the skill(s) it teaches. The subject code `english` is
 * what makes the tutor answer in English (D-042).
 *
 * «The Old Man and the Sea» is bound in after the term as its own separately
 * paginated booklet; it is recorded as an appendix, not tiled into the term.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed page
 * numbers, the running heads, the lesson heads each lesson page prints, and the
 * tiling. Seeding refuses to run on an unverified table.
 */
export const EGYPT_ENGLISH_G10_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-10", name: "Grade 10", nameAr: "الصف الأول الثانوي", levelOrder: 10 },
  subject: { code: "english", name: "English", nameAr: "اللغة الإنجليزية" },
  curriculum: { code: "eg-g10-english", title: "اللغة الإنجليزية للصف الأول الثانوي" },
  terms: [buildEgyptEnglishG10Term()],
};

/** Term 1 = the official book: printed section → printed lesson, as its document. */
function buildEgyptEnglishG10Term(): TermSeedSpec {
  const check = verifyEnglishG10Tree();
  if (!check.ok) throw new Error(`شجرة كتاب الإنجليزي (أولى ثانوي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ENGLISH_G10_T1_SECTIONS.map((section, si) => ({
      code: `unit-${si + 1}`,
      title: section.title,
      lessons: section.lessons.map((lesson, li) => ({
        // Namespaced so codes stay unique across every seeded curriculum.
        code: `l-g10-eng-${lesson.key}`,
        title: lesson.title,
        concepts: lesson.concepts,
        doc: { title: lesson.title, content: englishG10LessonDocument(si, li) },
      })),
    })),
  };
}

/** Both halves of the Grade-10 English tree verification, as one verdict. */
function verifyEnglishG10Tree(): { ok: boolean; problems: string[] } {
  const table = isEnglishG10TreeConsistent();
  const book = assertEnglishG10TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Secondary-1 (Grade 10) **English as a second foreign language** —
 * OFFICIAL curriculum (PHASE 101).
 *
 * The first term IS the Ministry textbook (`English_second_language_secondary1.pdf`,
 * 2026/2027 MoE edition, 51 scan pages, all OCR'd): the three units of its printed
 * «Contents» and the «Review 1» that closes the term. The book prints its own page
 * number on every content page, so the offset is zero (book page = scan page). The
 * app lesson is the book's printed **lesson** (a unit's opener rides with its first
 * lesson); the review is one lesson carrying its printed parts. Like its Grade-10
 * sibling, the book prints no per-lesson objectives — its outcomes sit in the
 * printed «Scope and Sequence», grouped by skill — so each lesson's `concepts` are
 * the verbatim outcomes of the skill(s) it teaches, and each listening lesson also
 * points at the book's «Audio Scripts» appendix so the tutor can quote the passage
 * the book points to. The subject code `english` is what makes the tutor answer in
 * English (D-042).
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed page numbers,
 * the book-wide running head, the lesson heads each lesson page prints, and the
 * tiling. Seeding refuses to run on an unverified table.
 */
export const EGYPT_ENGLISH2_G10_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-10", name: "Grade 10", nameAr: "الصف الأول الثانوي", levelOrder: 10 },
  subject: { code: "english", name: "English", nameAr: "اللغة الإنجليزية" },
  curriculum: { code: "eg-g10-english2", title: "اللغة الإنجليزية (لغة أجنبية ثانية) للصف الأول الثانوي" },
  terms: [buildEgyptEnglish2G10Term()],
};

/** Term 1 = the official book: printed section → printed lesson, as its document. */
function buildEgyptEnglish2G10Term(): TermSeedSpec {
  const check = verifyEnglish2G10Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب الإنجليزي (لغة ثانية — أولى ثانوي) غير متسقة:\n${check.problems.join("\n")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ENGLISH2_G10_T1_SECTIONS.map((section, si) => ({
      code: `unit-${si + 1}`,
      title: section.title,
      lessons: section.lessons.map((lesson, li) => ({
        // Namespaced so codes are unique across every seeded curriculum.
        code: `l-g10-eng2-${lesson.key}`,
        title: lesson.title,
        concepts: lesson.concepts,
        doc: { title: lesson.title, content: english2G10LessonDocument(si, li) },
      })),
    })),
  };
}

/** Both halves of the Grade-10 English2 tree verification, as one verdict. */
function verifyEnglish2G10Tree(): { ok: boolean; problems: string[] } {
  const table = isEnglish2G10TreeConsistent();
  const book = assertEnglish2G10TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Secondary-1 (Grade 10) **Italian** — OFFICIAL curriculum (PHASE 102).
 *
 * The first term IS the Ministry textbook (`Progetto italiano Junior 1 Plus`,
 * the combined «libro di classe & quaderno degli esercizi» volume, 112 scan
 * pages, text-layer extracted): the six Unità of its printed «Indice» and the
 * pages they occupy (book pages 7–46). The book prints its own page number on
 * every content page, so the offset is zero (book page = scan page). The app
 * lesson is the book's printed **lesson** (a unit's «Per cominciare...» opener
 * rides with its first lesson); the culture+review block that closes Unità 2, 4
 * and 6 is one extra lesson. The book prints no per-lesson objectives — its
 * «Elementi comunicativi e lessicali» / «Elementi grammaticali» sit in the Indice
 * beside each lesson letter — so every lesson's `concepts` are those lines,
 * verbatim, in the student's own Contents. The subject code `italian` is what
 * makes the tutor answer in Italian.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed page
 * numbers, the printed lesson heads, the culture anchors, the exact-one-owner
 * tiling and the coverage of every page of the term. Seeding refuses to run on an
 * unverified table.
 */
export const EGYPT_ITALIAN_G10_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-10", name: "Grade 10", nameAr: "الصف الأول الثانوي", levelOrder: 10 },
  subject: { code: "italian", name: "Italian", nameAr: "اللغة الإيطالية" },
  curriculum: { code: "eg-g10-italian", title: "اللغة الإيطالية للصف الأول الثانوي" },
  terms: [buildEgyptItalianG10Term()],
};

/** Term 1 = the official book: printed section → printed lesson, as its document. */
function buildEgyptItalianG10Term(): TermSeedSpec {
  const check = verifyItalianG10Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب الإيطالي (أولى ثانوي) غير متسقة:\n${check.problems.join("\n")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ITALIAN_G10_T1_SECTIONS.map((section, si) => ({
      code: `unit-${si + 1}`,
      title: section.title,
      lessons: section.lessons.map((lesson, li) => ({
        // Namespaced so codes are unique across every seeded curriculum.
        code: `l-g10-ita-${lesson.key}`,
        title: lesson.title,
        concepts: lesson.concepts,
        doc: { title: lesson.title, content: italianG10LessonDocument(si, li) },
      })),
    })),
  };
}

/** Both halves of the Grade-10 Italian tree verification, as one verdict. */
function verifyItalianG10Tree(): { ok: boolean; problems: string[] } {
  const table = isItalianG10TreeConsistent();
  const book = assertItalianG10TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Secondary-1 (Grade 10) **German** — OFFICIAL curriculum (PHASE 103).
 *
 * The first term IS the Ministry textbook (`Schritte international 1`,
 * Schulbuchausgabe Ägypten — Kursbuch + Arbeitsbuch, 112 scan pages, Gemini
 * OCR): the four Lektionen of its printed «Inhalt Kursbuch» (book page 5) and
 * the pages they occupy (book pages 8–47). Every content page prints its own
 * number glued to the running head («acht 8 LEKTION 1»), so the offset is zero.
 * A lesson is each printed component of a Lektion: the Einstiegsdoppelseite
 * (which carries the Lektion title and its five «Lernziele» A–E), the five
 * Lernschritte A–E, the «Grammatik» overview and the closing Zwischenspiel
 * double page. Each lesson's `concepts` are the book's own «Lernziele» / overview
 * lines, verbatim in German. The subject code `german` is what makes the tutor
 * answer in German.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed page
 * numbers, the per-Lektion running heads, the printed lesson heads, the
 * Zwischenspiel anchors, the exact-one-owner tiling and the coverage of every page
 * of the term. Seeding refuses to run on an unverified table.
 */
export const EGYPT_GERMAN_G10_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-10", name: "Grade 10", nameAr: "الصف الأول الثانوي", levelOrder: 10 },
  subject: { code: "german", name: "German", nameAr: "اللغة الألمانية" },
  curriculum: { code: "eg-g10-german", title: "اللغة الألمانية للصف الأول الثانوي" },
  terms: [buildEgyptGermanG10Term()],
};

/** Term 1 = the official book: printed Lektion → printed lesson, as its document. */
function buildEgyptGermanG10Term(): TermSeedSpec {
  const check = verifyGermanG10Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب الألماني (أولى ثانوي) غير متسقة:\n${check.problems.join("\n")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_GERMAN_G10_T1_SECTIONS.map((section, si) => ({
      code: `unit-${si + 1}`,
      title: section.title,
      lessons: section.lessons.map((lesson, li) => ({
        // Namespaced so codes are unique across every seeded curriculum.
        code: `l-g10-deu-${lesson.key}`,
        title: lesson.title,
        concepts: lesson.concepts,
        doc: { title: lesson.title, content: germanG10LessonDocument(si, li) },
      })),
    })),
  };
}

/** Both halves of the Grade-10 German tree verification, as one verdict. */
function verifyGermanG10Tree(): { ok: boolean; problems: string[] } {
  const table = isGermanG10TreeConsistent();
  const book = assertGermanG10TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Secondary-1 (Grade 10) **Spanish** — OFFICIAL curriculum (PHASE 104).
 *
 * The first term IS the Ministry textbook (`¡VALE! Manual de español para la
 * enseñanza secundaria egipcia, Volumen 1`, coordinated by the Instituto
 * Cervantes de El Cairo — 80 scan pages, Gemini OCR): the six Unidades of its
 * printed «CONTENIDOS VOLUMEN 1» (book page 9) and the pages they occupy (book
 * pages 10–80). Every content page prints its own number at the foot, glued to
 * the Spanish running head or to the Arabic print-shop imprint, so the offset is
 * zero. A lesson is each printed component of a Unidad: the unit opener (which
 * carries the title and its «Contenidos»), the «PARA PRACTICAR» exercise block
 * and the «PARA ESTUDIAR Y REPASAR» summary page. Each lesson's `concepts` are the
 * book's own printed lines, verbatim in Spanish. The subject code `spanish` is
 * what makes the tutor answer in Spanish.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed page
 * numbers, the per-Unidad running heads, the printed lesson heads, the exact-one
 * owner tiling and the coverage of every page of the term (a handful of pages
 * whose folio/head the OCR missed are anchored on a printed string of their own
 * page). Seeding refuses to run on an unverified table.
 */
export const EGYPT_SPANISH_G10_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-10", name: "Grade 10", nameAr: "الصف الأول الثانوي", levelOrder: 10 },
  subject: { code: "spanish", name: "Spanish", nameAr: "اللغة الإسبانية" },
  curriculum: { code: "eg-g10-spanish", title: "اللغة الإسبانية للصف الأول الثانوي" },
  terms: [buildEgyptSpanishG10Term()],
};

/** Term 1 = the official book: printed Unidad → printed lesson, as its document. */
function buildEgyptSpanishG10Term(): TermSeedSpec {
  const check = verifySpanishG10Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب الإسباني (أولى ثانوي) غير متسقة:\n${check.problems.join("\n")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_SPANISH_G10_T1_SECTIONS.map((section, si) => ({
      code: `unit-${si + 1}`,
      title: section.title,
      lessons: section.lessons.map((lesson, li) => ({
        // Namespaced so codes are unique across every seeded curriculum.
        code: `l-g10-spa-${lesson.key}`,
        title: lesson.title,
        concepts: lesson.concepts,
        doc: { title: lesson.title, content: spanishG10LessonDocument(si, li) },
      })),
    })),
  };
}

/** Both halves of the Grade-10 Spanish tree verification, as one verdict. */
function verifySpanishG10Tree(): { ok: boolean; problems: string[] } {
  const table = isSpanishG10TreeConsistent();
  const book = assertSpanishG10TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Secondary-1 (Grade 10) **French** — OFFICIAL curriculum (PHASE 105).
 *
 * The first term IS the Ministry textbook (`Nouveau Champion 1 – Méthode de
 * français, Première année secondaire`, Clé International – DENH, 170 scan
 * pages, Gemini OCR): the four Unités of its printed «Tableau des contenus»
 * (book pages 5–6, scan 6–7) and the pages they occupy (book pages 8–157). The
 * printed book page = scan page − 1 (`BOOK_TO_PDF_OFFSET = 1`), proven by the
 * folios the contents print before the term begins. A lesson is each printed
 * component of a Unité: the four «Leçons», the two-page «Point de culture», the
 * «Projet final» page and its «Grille d'évaluation». Each «Leçon»'s `concepts`
 * are its printed «À la fin de cette leçon, je serai capable de :» bullets,
 * verbatim in French. The subject code `french` is what makes the tutor answer
 * in French.
 *
 * Three printed double leaves are genuinely blank and separate the units (book
 * pages 44–45, 82–83, 120–121): they belong to no lesson, and the strong check
 * requires them to be empty and unowned while the 144 real content pages tile the
 * term exactly with one owner each.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed page
 * numbers, the printed lesson heads, the blank leaves, the exact-one-owner tiling
 * and the coverage of every content page of the term. Seeding refuses to run on
 * an unverified table.
 */
export const EGYPT_FRENCH_G10_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-10", name: "Grade 10", nameAr: "الصف الأول الثانوي", levelOrder: 10 },
  subject: { code: "french", name: "French", nameAr: "اللغة الفرنسية" },
  curriculum: { code: "eg-g10-french", title: "اللغة الفرنسية للصف الأول الثانوي" },
  terms: [buildEgyptFrenchG10Term()],
};

/** Term 1 = the official book: printed Unité → printed lesson, as its document. */
function buildEgyptFrenchG10Term(): TermSeedSpec {
  const check = verifyFrenchG10Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب الفرنسي (أولى ثانوي) غير متسقة:\n${check.problems.join("\n")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_FRENCH_G10_T1_SECTIONS.map((section, si) => ({
      code: `unit-${si + 1}`,
      title: section.title,
      lessons: section.lessons.map((lesson, li) => ({
        // Namespaced so codes are unique across every seeded curriculum.
        code: `l-g10-fra-${lesson.key}`,
        title: lesson.title,
        concepts: lesson.concepts,
        doc: { title: lesson.title, content: frenchG10LessonDocument(si, li) },
      })),
    })),
  };
}

/** Both halves of the Grade-10 French tree verification, as one verdict. */
function verifyFrenchG10Tree(): { ok: boolean; problems: string[] } {
  const table = isFrenchG10TreeConsistent();
  const book = assertFrenchG10TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-8 **English** — OFFICIAL curriculum.
 *
 * The first term IS the Ministry textbook (`English_language_prep2_t1.pdf`,
 * 2026/2027 MoE edition, 114 scan pages, all OCR'd): the six units of its printed
 * «Contents», the two reviews around them, and the «Start Smart» bridge that
 * precedes unit 1. Exactly like its Grade-9 sibling, the app lesson is the
 * book's printed **lesson** (a unit's Learning Outcomes opener rides with its
 * first lesson, its Assessment Corner + My Self-Reflection with its last); the
 * reviews keep their printed «Lesson 1»/«Lesson 2». The book prints no
 * per-lesson objectives — its outcomes sit on the unit opener, grouped by skill
 * — so each lesson's `concepts` are the verbatim outcomes of the skill(s) it
 * teaches, and each listening lesson also points at its own «Audioscripts» page
 * so the tutor can quote the passage the book points to. The subject code
 * `english` is what makes the tutor answer in English (D-042).
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the lesson heads each lesson page prints, the appendix pages, and the tiling.
 * Seeding refuses to run on an unverified table.
 */
export const EGYPT_ENGLISH_G8_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-8", name: "Grade 8", nameAr: "الصف الثاني الإعدادي", levelOrder: 8 },
  subject: { code: "english", name: "English", nameAr: "اللغة الإنجليزية" },
  curriculum: { code: "eg-g8-english", title: "اللغة الإنجليزية للصف الثاني الإعدادي" },
  terms: [buildEgyptEnglishG8Term()],
};

/** Term 1 = the official book: printed section → printed lesson, as its document. */
function buildEgyptEnglishG8Term(): TermSeedSpec {
  const check = verifyEnglishG8Tree();
  if (!check.ok) throw new Error(`شجرة كتاب الإنجليزي (ثانية إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ENGLISH_G8_T1_SECTIONS.map((section, si) => ({
      code: `unit-${si + 1}`,
      title: section.title,
      lessons: section.lessons.map((lesson, li) => ({
        // Namespaced so codes stay unique across every seeded curriculum.
        code: `l-g8-eng-${lesson.key}`,
        title: lesson.title,
        concepts: lesson.concepts,
        doc: { title: lesson.title, content: englishG8LessonDocument(si, li) },
      })),
    })),
  };
}

/** Both halves of the Grade-8 English tree verification, as one verdict. */
function verifyEnglishG8Tree(): { ok: boolean; problems: string[] } {
  const table = isEnglishG8TreeConsistent();
  const book = assertEnglishG8TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-7 **English** — OFFICIAL curriculum.
 *
 * The first term IS the Ministry textbook (`English_language_prep1_t1.pdf`,
 * 2026/2027 MoE edition, 113 scan pages, all OCR'd): the six units of its
 * printed «Contents», the two reviews around them, and the «Start Smart» bridge
 * that precedes unit 1. Exactly like its Grade-8 sibling, the app lesson is the
 * book's printed **lesson** (a unit's Learning Outcomes opener rides with its
 * first lesson, its Assessment Corner + My Self-Reflection with its last); the
 * reviews keep their printed «Lesson 1»/«Lesson 2». The book prints no
 * per-lesson objectives — its outcomes sit on the unit opener, grouped by skill
 * — so each lesson's `concepts` are the verbatim outcomes of the skill(s) it
 * teaches, and each listening lesson also points at its own «Audioscripts» page
 * so the tutor can quote the passage the book points to. The subject code
 * `english` is what makes the tutor answer in English (D-042).
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the lesson heads each lesson page prints, the appendix pages, and the tiling.
 * Seeding refuses to run on an unverified table.
 */
export const EGYPT_ENGLISH_P1_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-7", name: "Grade 7", nameAr: "الصف الأول الإعدادي", levelOrder: 7 },
  subject: { code: "english", name: "English", nameAr: "اللغة الإنجليزية" },
  curriculum: { code: "eg-g7-english", title: "اللغة الإنجليزية للصف الأول الإعدادي" },
  terms: [buildEgyptEnglishP1Term()],
};

/** Term 1 = the official book: printed section → printed lesson, as its document. */
function buildEgyptEnglishP1Term(): TermSeedSpec {
  const check = verifyEnglishP1Tree();
  if (!check.ok) throw new Error(`شجرة كتاب الإنجليزي (أول إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ENGLISH_P1_T1_SECTIONS.map((section, si) => ({
      code: `unit-${si + 1}`,
      title: section.title,
      lessons: section.lessons.map((lesson, li) => ({
        // Namespaced so codes stay unique across every seeded curriculum.
        code: `l-g7-eng-${lesson.key}`,
        title: lesson.title,
        concepts: lesson.concepts,
        doc: { title: lesson.title, content: englishP1LessonDocument(si, li) },
      })),
    })),
  };
}

/** Both halves of the Grade-7 English tree verification, as one verdict. */
function verifyEnglishP1Tree(): { ok: boolean; problems: string[] } {
  const table = isEnglishP1TreeConsistent();
  const book = assertEnglishP1TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-6 **Science** — OFFICIAL curriculum (PHASE 59; concepts aligned
 * in PHASE 69).
 *
 * The first term IS the Ministry textbook (`Science_Primary6_T1.pdf`, 2026/2027
 * MoE edition): its 10 chapters, one app lesson per printed مفهوم, each lesson
 * grounded on the OCR text of the very pages the book prints for that concept
 * (server/data/curriculum-ocr/science-t1/) — so the tutor's RAG retrieval reads
 * from «كتاب الوزارة» verbatim. The book prints no objectives list, so each
 * lesson's `concepts` are the concept's own printed «تعلّم …» learning topic(s),
 * verbatim. The second term is a placeholder until its book is imported the same
 * way.
 *
 * The chapter/concept table itself is verified before seeding: `isConsistent`
 * checks the table's invariants and `assertTreeMatchesTheBook` re-reads every
 * printed page of the OCR corpus to confirm the concept head each page prints
 * falls inside that concept's page range and that each learning topic is printed
 * in its own pages. A wrong range would silently hide book content from the
 * tutor, so seeding refuses to run on an unverified table.
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
          concepts: concept.concepts,
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
 * Egyptian Preparatory-3 (Grade 9) **Social Studies** — OFFICIAL curriculum
 * (PHASE 81).
 *
 * The first term IS the Ministry textbook (`Social_Studies_Prep3_T1.pdf`,
 * 2026/2027 MoE edition): its 4 units and 11 lessons as printed in the المحتويات
 * (book pages 5–6), each lesson carrying its printed «أهداف الدرس». Every
 * lesson's RAG document is the OCR text of the very pages the book prints for it
 * (server/data/curriculum-ocr/social-p3-t1/). There is no second-term spec: its
 * book has not been imported, and a hand-written stand-in would misrepresent it.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping page by page from the
 * printed footers, checks every lesson's opener prints its title, and confirms
 * no printed page falls outside a lesson. Seeding refuses to run on an
 * unverified table.
 */
export const EGYPT_SOCIAL_G9_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-9", name: "Grade 9", nameAr: "الصف الثالث الإعدادي", levelOrder: 9 },
  subject: { code: "social", name: "Social Studies", nameAr: "الدراسات الاجتماعية" },
  curriculum: { code: "eg-g9-social", title: "الدراسات الاجتماعية للصف الثالث الإعدادي" },
  terms: [buildEgyptSocialG9Term()],
};

/** Term 1 = the official book: one app lesson per printed درس, pages OCR'd. */
function buildEgyptSocialG9Term(): TermSeedSpec {
  const check = verifySocialG9Tree();
  if (!check.ok) throw new Error(`شجرة كتاب الدراسات الاجتماعية (إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_SOCIAL_G9_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g9-soc-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: socialG9LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-9 social tree verification, as one verdict. */
function verifySocialG9Tree(): { ok: boolean; problems: string[] } {
  const table = isSocialG9TreeConsistent();
  const book = assertSocialG9TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-8 **Social Studies** — OFFICIAL curriculum.
 *
 * The first term IS the Ministry textbook (`Social_studies_prep2_t1.pdf`,
 * 2026/2027 MoE edition, 106 scan pages, all OCR'd): «مصر وعلاقتها بآسيا
 * وأوروبا — الأرض والحضارة والتنمية», exactly as its فهرس prints them — the
 * four units of its printed «Contents», the «تقييم ختامي» that closes each, and
 * the general review that follows them, each grounded on the OCR text of the
 * pages the book prints for it (server/data/curriculum-ocr/social-p2-t1/).
 * The app lesson is the book's printed **درس** (a unit's «الفكرة الرئيسية /
 * نواتج تعلم الوحدة» opener rides with its first lesson, its «تقييم ختامي» with
 * its last), and each lesson carries the verbatim «أهداف الدرس» the book prints
 * at its head.
 *
 * The general review is its own section rather than unit 4's tail: it prints its
 * own running head and is a question bank plus the term «اختبار», not a lesson.
 * Book pages 0–5 and 104–105 are front/back matter, outside the taught ranges.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping page by page from the
 * printed footers, checks every lesson's opener prints its title, and confirms
 * no printed page falls outside a lesson. Seeding refuses to run on an
 * unverified table.
 */
export const EGYPT_SOCIAL_G8_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-8", name: "Grade 8", nameAr: "الصف الثاني الإعدادي", levelOrder: 8 },
  subject: { code: "social", name: "Social Studies", nameAr: "الدراسات الاجتماعية" },
  curriculum: { code: "eg-g8-social", title: "الدراسات الاجتماعية للصف الثاني الإعدادي" },
  terms: [buildEgyptSocialG8Term()],
};

/** Term 1 = the official book: one app lesson per printed درس, pages OCR'd. */
function buildEgyptSocialG8Term(): TermSeedSpec {
  const check = verifySocialG8Tree();
  if (!check.ok) throw new Error(`شجرة كتاب الدراسات الاجتماعية (ثانية إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_SOCIAL_G8_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        // The review prints no «الدرس …» head, so it carries no ordinal.
        const title = lesson.ordinal ? `الدرس ${lesson.ordinal}: ${lesson.title}` : lesson.title;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g8-soc-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: socialG8LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-8 social tree verification, as one verdict. */
function verifySocialG8Tree(): { ok: boolean; problems: string[] } {
  const table = isSocialG8TreeConsistent();
  const book = assertSocialG8TreeMatchesBook();
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
 * Egyptian Preparatory-3 (Grade 9) **Arabic language** — OFFICIAL curriculum
 * (PHASE 86).
 *
 * The first term IS the Ministry textbook (`Arabic_language_prep3_t1.pdf`,
 * 2026/2027 MoE edition, 162 scanned pages): its leading «مراجعة عامة», its 3
 * units, their 12 lessons and every printed «مكوّن» of each lesson, exactly as the
 * book's فهرس prints them. Each lesson is grounded on the OCR text of the pages
 * the book prints for it (server/data/curriculum-ocr/arabic-p3-t1/); the listening
 * lessons also carry the back-matter passage («نصوص الاستماع») the book points
 * them to. There is no second-term spec: its book has not been imported.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed running
 * feet, the section/lesson/component pages against what each page actually
 * prints, and the tiling. Seeding refuses to run on an unverified table.
 */
export const EGYPT_ARABIC_G9_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-9", name: "Grade 9", nameAr: "الصف الثالث الإعدادي", levelOrder: 9 },
  subject: { code: "arabic", name: "Arabic", nameAr: "اللغة العربية" },
  curriculum: { code: "eg-g9-arabic", title: "اللغة العربية للصف الثالث الإعدادي" },
  terms: [buildEgyptArabicG9Term()],
};

/** Term 1 = the official book: section → lesson → the book's own printed components. */
function buildEgyptArabicG9Term(): TermSeedSpec {
  const check = verifyArabicG9Tree();
  if (!check.ok) throw new Error(`شجرة كتاب اللغة العربية (إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ARABIC_G9_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => ({
        // Namespaced so codes stay unique across every seeded curriculum.
        code: `l-g9-ara-${lesson.key}`,
        title: lesson.title,
        concepts: lesson.concepts.map((concept) => `${concept.kind}: ${concept.title}`),
        doc: { title: lesson.title, content: arabicG9LessonDocument(ui, li) },
      })),
    })),
  };
}

/** Both halves of the Grade-9 Arabic tree verification, as one verdict. */
function verifyArabicG9Tree(): { ok: boolean; problems: string[] } {
  const table = isArabicG9TreeConsistent();
  const book = assertArabicG9TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-2 (Grade 8) **Arabic** — OFFICIAL curriculum (PHASE 87).
 *
 * The first term IS the Ministry textbook (2026/2027 MoE edition, 162 scan
 * pages): the «مراجعة عامة» then the three units exactly as the book's فهرس
 * prints them (الوحدة الأولى: انتمائي قوتي، الوحدة الثانية: بيئتي مسئوليتي،
 * الوحدة الثالثة: علم وقيم), each lesson grounded on the OCR text of the pages
 * the book prints for it (server/data/curriculum-ocr/arabic-p2-t1/); the
 * listening lessons also carry their «نصوص الاستماع» back-matter passage the
 * book points them to (book pages 149–155). There is no second-term spec: its
 * book has not been imported.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed running
 * feet, the section/lesson/component pages against what each page actually
 * prints, and the tiling. Seeding refuses to run on an unverified table.
 */
export const EGYPT_ARABIC_G8_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-8", name: "Grade 8", nameAr: "الصف الثاني الإعدادي", levelOrder: 8 },
  subject: { code: "arabic", name: "Arabic", nameAr: "اللغة العربية" },
  curriculum: { code: "eg-g8-arabic", title: "اللغة العربية للصف الثاني الإعدادي" },
  terms: [buildEgyptArabicG8Term()],
};

/** Term 1 = the official book: section → lesson → the book's own printed components. */
function buildEgyptArabicG8Term(): TermSeedSpec {
  const check = verifyArabicG8Tree();
  if (!check.ok) throw new Error(`شجرة كتاب اللغة العربية (ثانية إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ARABIC_G8_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => ({
        // Namespaced so codes stay unique across every seeded curriculum.
        code: `l-g8-ara-${lesson.key}`,
        title: lesson.title,
        concepts: lesson.concepts.map((concept) => `${concept.kind}: ${concept.title}`),
        doc: { title: lesson.title, content: arabicG8LessonDocument(ui, li) },
      })),
    })),
  };
}

/** Both halves of the Grade-8 Arabic tree verification, as one verdict. */
function verifyArabicG8Tree(): { ok: boolean; problems: string[] } {
  const table = isArabicG8TreeConsistent();
  const book = assertArabicG8TreeMatchesBook();
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
 * Egyptian Preparatory-3 (Grade 9) **Information and Communication Technology** —
 * OFFICIAL curriculum (PHASE 79).
 *
 * The first term IS the Ministry textbook (`ICT_Arabic_Prp3_TR1.pdf`, 2026/2027
 * MoE edition, 96 pages): its 2 units and 9 lessons exactly as the book's
 * فهرس الموضوعات (book page 3) prints them, each grounded on the OCR text of the
 * pages the book prints for it (server/data/curriculum-ocr/ict-p3-t1/). The book
 * prints no «مفهوم» layer, so each lesson's concepts are the printed
 * «أهداف الدرس» the book puts at its head.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the lesson titles each page prints, and the tiling. Seeding refuses to run on
 * an unverified table.
 */
export const EGYPT_ICT_G9_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-9", name: "Grade 9", nameAr: "الصف الثالث الإعدادي", levelOrder: 9 },
  subject: { code: "ict", name: "Information and Communication Technology", nameAr: "تكنولوجيا المعلومات والاتصالات" },
  curriculum: { code: "eg-g9-ict", title: "تكنولوجيا المعلومات والاتصالات للصف الثالث الإعدادي" },
  terms: [buildEgyptIctG9Term()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptIctG9Term(): TermSeedSpec {
  const check = verifyIctG9Tree();
  if (!check.ok) throw new Error(`شجرة كتاب تكنولوجيا المعلومات (إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ICT_G9_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g9-ict-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: ictG9LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-9 ICT tree verification, as one verdict. */
function verifyIctG9Tree(): { ok: boolean; problems: string[] } {
  const table = isIctG9TreeConsistent();
  const book = assertIctG9TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}









/**
 * Egyptian Preparatory-2 (Grade 8) **Information and Communication
 * Technology** — OFFICIAL curriculum.
 *
 * The first term IS the Ministry textbook (`ICT_Arabic_Prp2_T1.pdf`,
 * 2026/2027 MoE edition, 93 scan pages, all OCR'd): its 2 units and 8 lessons
 * exactly as the book's قائمة المحتويات (book page 3) prints them, each
 * grounded on the OCR text of the pages the book prints for it
 * (server/data/curriculum-ocr/ict-p2-t1/). The book prints no «مفهوم» layer,
 * so each lesson's concepts are the printed «الأهداف» the book puts at its
 * head. A unit's opener (4, 43) and each lesson's printed opener
 * («الدرس الأول: …», the page before its numbered content) ride with the
 * lesson that prints them.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the 73 printed
 * footers, the lesson titles each page prints, and the tiling. Seeding refuses
 * to run on an unverified table.
 */
export const EGYPT_ICT_G8_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-8", name: "Grade 8", nameAr: "الصف الثاني الإعدادي", levelOrder: 8 },
  subject: { code: "ict", name: "Information and Communication Technology", nameAr: "تكنولوجيا المعلومات والاتصالات" },
  curriculum: { code: "eg-g8-ict", title: "تكنولوجيا المعلومات والاتصالات للصف الثاني الإعدادي" },
  terms: [buildEgyptIctG8Term()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptIctG8Term(): TermSeedSpec {
  const check = verifyIctG8Tree();
  if (!check.ok) throw new Error(`شجرة كتاب تكنولوجيا المعلومات (إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ICT_G8_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g8-ict-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: ictG8LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-8 ICT tree verification, as one verdict. */
function verifyIctG8Tree(): { ok: boolean; problems: string[] } {
  const table = isIctG8TreeConsistent();
  const book = assertIctG8TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-2 (Grade 8) **Information and Communication Technology,
 * English medium** — OFFICIAL curriculum.
 *
 * The first term IS the English-medium Ministry textbook
 * (`ICT_English_Prp2_T1.pdf`, 2026/2027 MoE edition, 89 scan pages, all
 * OCR'd): its 2 units and 8 lessons exactly as the book's Contents (book
 * page 3) prints them, each grounded on the OCR text of the pages the book
 * prints for it (server/data/curriculum-ocr/ict-en-p2-t1/). The book prints no
 * «مفهوم» layer, so each lesson's concepts are the printed «Objectives» the
 * book puts at its head. A unit's opener (4, 40) and each lesson's printed
 * front page («Lesson N: …», the page before its numbered content) ride with
 * the lesson that prints them. Lesson and unit titles are bilingual
 * «English — Arabic», as the English edition teaches the same eight lessons as
 * the Arabic book.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the 75 printed
 * footers, the lesson titles each page prints, and the tiling. Seeding refuses
 * to run on an unverified table.
 */
export const EGYPT_ICT_G8_EN_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-8", name: "Grade 8", nameAr: "الصف الثاني الإعدادي", levelOrder: 8 },
  subject: {
    code: "ict-en",
    name: "Information and Communication Technology (English)",
    nameAr: "تكنولوجيا المعلومات والاتصالات (بالإنجليزية)",
  },
  curriculum: {
    code: "eg-g8-ict-en",
    title: "تكنولوجيا المعلومات والاتصالات للصف الثاني الإعدادي (بالإنجليزية)",
  },
  terms: [buildEgyptIctG8EnTerm()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptIctG8EnTerm(): TermSeedSpec {
  const check = verifyIctG8EnTree();
  if (!check.ok) throw new Error(`شجرة كتاب تكنولوجيا المعلومات (بالإنجليزية) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ICT_G8_EN_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g8-ict-en-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: ictG8EnLessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-8 ICT EN tree verification, as one verdict. */
function verifyIctG8EnTree(): { ok: boolean; problems: string[] } {
  const table = isIctG8EnTreeConsistent();
  const book = assertIctG8EnTreeMatchesBook();
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

/**
 * Egyptian Preparatory-3 (Grade 9) **Islamic Religious Education** — OFFICIAL
 * curriculum (PHASE 82).
 *
 * The first term IS the Ministry textbook (`Islamic_Education_Prep3_T1.pdf`,
 * 2026/2027 MoE edition, 82 scan pages, all OCR'd): its 3 units and 21 lessons
 * exactly as the book's المحتويات prints them. The book prints no «مفهوم» layer,
 * so each lesson's concepts are the printed «أهداف الدرس» it puts at its head,
 * and a unit's opener and «مراجعة على الوحدة» ride with its first/last lesson.
 * There is no second term yet: its book has not been imported.
 */
export const EGYPT_ISLAMIC_G9_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-9", name: "Grade 9", nameAr: "الصف الثالث الإعدادي", levelOrder: 9 },
  subject: { code: "islamic-education", name: "Islamic Religious Education", nameAr: "التربية الدينية الإسلامية" },
  curriculum: { code: "eg-g9-islamic-education", title: "التربية الدينية الإسلامية للصف الثالث الإعدادي" },
  terms: [buildEgyptIslamicG9Term()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptIslamicG9Term(): TermSeedSpec {
  const check = verifyIslamicG9Tree();
  if (!check.ok) throw new Error(`شجرة كتاب التربية الدينية الإسلامية (إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ISLAMIC_G9_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g9-isl-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: islamicG9LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-9 Islamic tree verification, as one verdict. */
function verifyIslamicG9Tree(): { ok: boolean; problems: string[] } {
  const table = isIslamicG9TreeConsistent();
  const book = assertIslamicG9TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}



/**
 * Egyptian Preparatory-2 (Grade 8) **Islamic Religious Education** — OFFICIAL
 * curriculum (this phase).
 *
 * The first term IS the Ministry textbook (`Islamic_Education_Prep2_T1.pdf`,
 * 2026/2027 MoE edition, 80 scan pages, all OCR'd): its 3 units and 21 lessons,
 * exactly as the book's المحتويات (page 4) prints them. The book prints no
 * «مفهوم» layer, so each lesson's concepts are the printed «أهداف الدرس» it puts
 * at its head, and a unit's opener and «مراجعة على الوحدة» ride with its
 * first/last lesson. Book pages map 1:1 to PDF pages (offset 0), fixed by the
 * running footers the numbered pages print. There is no second term yet: its
 * book has not been imported, and a hand-written stand-in would misrepresent it.
 */
export const EGYPT_ISLAMIC_G8_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-8", name: "Grade 8", nameAr: "الصف الثاني الإعدادي", levelOrder: 8 },
  subject: { code: "islamic-education", name: "Islamic Religious Education", nameAr: "التربية الدينية الإسلامية" },
  curriculum: { code: "eg-g8-islamic-education", title: "التربية الدينية الإسلامية للصف الثاني الإعدادي" },
  terms: [buildEgyptIslamicG8Term()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptIslamicG8Term(): TermSeedSpec {
  const check = verifyIslamicG8Tree();
  if (!check.ok) throw new Error(`شجرة كتاب التربية الدينية الإسلامية (الصف الثاني الإعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ISLAMIC_G8_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g8-isl-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: islamicG8LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-8 Islamic tree verification, as one verdict. */
function verifyIslamicG8Tree(): { ok: boolean; problems: string[] } {
  const table = isIslamicG8TreeConsistent();
  const book = assertIslamicG8TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-6 **Christian Religious Education** — OFFICIAL curriculum
 * (PHASE 65).
 *
 * The first term IS the Ministry textbook (`Christian_Education_Primary6_T1.pdf`,
 * 2026/2027 MoE edition, reviewed by the Coptic Orthodox Church): its 3 units and
 * 18 lessons, exactly as the book's محتويات الكتاب prints them, each grounded on
 * the OCR text of the pages the book prints for it
 * (server/data/curriculum-ocr/christian-t1/). The book prints no «مفهوم» layer,
 * so each lesson's concepts are the printed «أهداف الدرس» the book puts at its
 * head. There is no second-term spec: its book has not been imported, and a
 * hand-written stand-in would misrepresent it.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the lesson titles each page prints, and the tiling. Seeding refuses to run on
 * an unverified table.
 */
export const EGYPT_CHRISTIAN_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  subject: { code: "christian-education", name: "Christian Religious Education", nameAr: "التربية الدينية المسيحية" },
  curriculum: {
    code: "eg-g6-christian-education",
    title: "التربية الدينية المسيحية للصف السادس الابتدائي",
  },
  terms: [buildEgyptChristianT1Term()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptChristianT1Term(): TermSeedSpec {
  const check = verifyChristianTree();
  if (!check.ok) throw new Error(`شجرة كتاب التربية الدينية المسيحية غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_CHRISTIAN_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-chr-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: christianLessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Christian tree verification, as one verdict. */
function verifyChristianTree(): { ok: boolean; problems: string[] } {
  const table = isChristianTreeConsistent();
  const book = assertChristianTreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-3 (Grade 9) **Christian Religious Education** — OFFICIAL
 * curriculum (PHASE 80).
 *
 * The first term IS the Ministry textbook (`Christian_Education_Prep3_T1.pdf`,
 * 2026/2027 MoE edition, reviewed by the Coptic Orthodox Church): its 3 units and
 * 18 lessons, exactly as the book's unit openers print their «قائمة دروس
 * الوحدة», each grounded on the OCR text of the pages the book prints for it
 * (server/data/curriculum-ocr/christian-p3-t1/). The book prints no «مفهوم»
 * layer, so each lesson's concepts are the printed «أهداف الدرس» the book puts
 * at its head.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the lesson topics each page prints, and the tiling. Seeding refuses to run on
 * an unverified table.
 */
export const EGYPT_CHRISTIAN_G9_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-9", name: "Grade 9", nameAr: "الصف الثالث الإعدادي", levelOrder: 9 },
  subject: { code: "christian-education", name: "Christian Religious Education", nameAr: "التربية الدينية المسيحية" },
  curriculum: {
    code: "eg-g9-christian-education",
    title: "التربية الدينية المسيحية للصف الثالث الإعدادي",
  },
  terms: [buildEgyptChristianG9Term()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptChristianG9Term(): TermSeedSpec {
  const check = verifyChristianG9Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب التربية الدينية المسيحية (إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_CHRISTIAN_G9_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g9-chr-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: christianG9LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-9 Christian tree verification, as one verdict. */
function verifyChristianG9Tree(): { ok: boolean; problems: string[] } {
  const table = isChristianG9TreeConsistent();
  const book = assertChristianG9TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-2 (Grade 8) **Christian Religious Education** — OFFICIAL
 * curriculum.
 *
 * The first term IS the Ministry textbook (`Christian_Education_Prep2_T1.pdf`,
 * 2026/2027 MoE edition): its 3 units and 18 lessons, exactly as the book's
 * unit openers print their «قائمة دروس الوحدة», each grounded on the OCR text
 * of the pages the book prints for it (server/data/curriculum-ocr/
 * christian-p2-t1/). The book prints no «مفهوم» layer, so each lesson's
 * concepts are the printed «أهداف الدرس» the book puts at its head.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the lesson topics each page prints, and the tiling. Seeding refuses to run on
 * an unverified table.
 */
export const EGYPT_CHRISTIAN_G8_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-8", name: "Grade 8", nameAr: "الصف الثاني الإعدادي", levelOrder: 8 },
  subject: { code: "christian-education", name: "Christian Religious Education", nameAr: "التربية الدينية المسيحية" },
  curriculum: {
    code: "eg-g8-christian-education",
    title: "التربية الدينية المسيحية للصف الثاني الإعدادي",
  },
  terms: [buildEgyptChristianG8Term()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptChristianG8Term(): TermSeedSpec {
  const check = verifyChristianG8Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب التربية الدينية المسيحية (ثانية إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_CHRISTIAN_G8_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g8-chr-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: christianG8LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-8 Christian tree verification, as one verdict. */
function verifyChristianG8Tree(): { ok: boolean; problems: string[] } {
  const table = isChristianG8TreeConsistent();
  const book = assertChristianG8TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Preparatory-1 (Grade 7) **Christian Religious Education** — OFFICIAL
 * curriculum.
 *
 * The first term IS the Ministry textbook (`Christian_Education_Prep1_T1.pdf`,
 * 2026/2027 MoE edition): its 3 units and 18 lessons, exactly as the book's
 * unit openers print their «قائمة دروس الوحدة», each grounded on the OCR text
 * of the pages the book prints for it (server/data/curriculum-ocr/
 * christian-p1-t1/). The book prints no «مفهوم» layer, so each lesson's
 * concepts are the printed «أهداف الدرس» the book puts at its head.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the lesson topics each page prints, and the tiling. Seeding refuses to run on
 * an unverified table.
 */
export const EGYPT_CHRISTIAN_P1_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-7", name: "Grade 7", nameAr: "الصف الأول الإعدادي", levelOrder: 7 },
  subject: { code: "christian-education", name: "Christian Religious Education", nameAr: "التربية الدينية المسيحية" },
  curriculum: {
    code: "eg-g7-christian-education",
    title: "التربية الدينية المسيحية للصف الأول الإعدادي",
  },
  terms: [buildEgyptChristianP1Term()],
};

/** Term 1 = the official book: unit → lesson, the whole lesson as its document. */
function buildEgyptChristianP1Term(): TermSeedSpec {
  const check = verifyChristianP1Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب التربية الدينية المسيحية (أول إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_CHRISTIAN_P1_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g7-chr-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: christianP1LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-7 Christian tree verification, as one verdict. */
function verifyChristianP1Tree(): { ok: boolean; problems: string[] } {
  const table = isChristianP1TreeConsistent();
  const book = assertChristianP1TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-7 **Theatre** («التربية المسرحية») — OFFICIAL curriculum (PHASE 82).
 *
 * The first term IS the Ministry textbook (`Thetar_prep1_Tr1.pdf`, 2026/2027 MoE
 * teacher's guide): its ten printed «الموضوعات» as the book's فهرس الموضوعات
 * (book page 5) prints them, one app lesson per topic, each grounded on the OCR
 * text of the very pages the topic owns
 * (server/data/curriculum-ocr/theater-p1-t1/) — so the tutor's RAG retrieval
 * reads from «كتاب الوزارة» verbatim. Each lesson's `concepts` are the topic's
 * own printed «الأهداف», verbatim. The closing self-evaluation form is kept as
 * back matter outside the lesson ranges.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the topic heads each topic page prints, and the tiling. Seeding refuses to run
 * on an unverified table.
 */
export const EGYPT_THEATER_P1_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-7", name: "Grade 7", nameAr: "الصف الأول الإعدادي", levelOrder: 7 },
  subject: { code: "theater", name: "Theatre", nameAr: "التربية المسرحية" },
  curriculum: { code: "eg-g7-theater", title: "التربية المسرحية للصف الأول الإعدادي" },
  terms: [buildEgyptTheaterP1Term()],
};

/** Term 1 = the official book: printed topic → its single app lesson. */
function buildEgyptTheaterP1Term(): TermSeedSpec {
  const check = verifyTheaterP1Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب التربية المسرحية (أول إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_THEATER_P1_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الموضوع ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g7-the-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: theaterP1LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-7 Theatre tree verification, as one verdict. */
function verifyTheaterP1Tree(): { ok: boolean; problems: string[] } {
  const table = isTheaterP1TreeConsistent();
  const book = assertTheaterP1TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-7 **Library & research skills** («المكتبات ومهارات البحث») —
 * OFFICIAL curriculum (PHASE 81).
 *
 * The first term IS the Ministry textbook
 * (`Librarie_research_skills_prep1_Tr1.pdf`, 2026/2027 MoE edition): its ten
 * printed «الموضوعات» as the book's فهرس الموضوعات (book page 3) prints them,
 * one app lesson per topic, each grounded on the OCR text of the very pages the
 * topic owns (server/data/curriculum-ocr/libraries-p1-t1/). Each lesson's
 * `concepts` are the topic's own printed objectives, verbatim. The closing
 * «المصطلحات» glossary is kept as back matter outside the lesson ranges.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the topic heads each topic page prints, and the tiling. Seeding refuses to run
 * on an unverified table.
 */
export const EGYPT_LIBRARIES_P1_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-7", name: "Grade 7", nameAr: "الصف الأول الإعدادي", levelOrder: 7 },
  subject: { code: "libraries", name: "Library & Research Skills", nameAr: "المكتبات ومهارات البحث" },
  curriculum: { code: "eg-g7-libraries", title: "المكتبات ومهارات البحث للصف الأول الإعدادي" },
  terms: [buildEgyptLibrariesP1Term()],
};

/** Term 1 = the official book: printed topic → its single app lesson. */
function buildEgyptLibrariesP1Term(): TermSeedSpec {
  const check = verifyLibrariesP1Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب المكتبات ومهارات البحث (أول إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_LIBRARIES_P1_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الموضوع ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g7-lib-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: librariesP1LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-7 Library tree verification, as one verdict. */
function verifyLibrariesP1Tree(): { ok: boolean; problems: string[] } {
  const table = isLibrariesP1TreeConsistent();
  const book = assertLibrariesP1TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-8 **Agriculture & entrepreneurship** («مهارات الزراعة وريادة
 * الأعمال») — OFFICIAL curriculum (PHASE 99), one of the three Prep-2 books the
 * Prep-1 sweep left out.
 *
 * The first term IS the Ministry textbook (`Agriculture_2_Preparatory_TR1.pdf`,
 * 2026/2027 MoE edition): its two printed fields («مجال نباتات الزينة والمشاتل
 * الإنتاجية» / «مجال الألبان») and nine printed lessons, one app lesson per
 * printed lesson, each grounded on the OCR text of the very pages the lesson
 * owns (server/data/curriculum-ocr/agriculture-p2-t1/). Each lesson's `concepts`
 * are its own printed «الأهداف», verbatim.
 *
 * Verified before seeding: `isConsistent` checks the table's invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the 50 printed
 * footers, each lesson opener's own title, the tiling, and that every printed
 * objective really appears inside its lesson's pages.
 */
export const EGYPT_AGRICULTURE_G8_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-8", name: "Grade 8", nameAr: "الصف الثاني الإعدادي", levelOrder: 8 },
  subject: { code: "agriculture", name: "Agriculture & Entrepreneurship", nameAr: "مهارات الزراعة وريادة الأعمال" },
  curriculum: { code: "eg-g8-agriculture", title: "مهارات الزراعة وريادة الأعمال للصف الثاني الإعدادي" },
  terms: [buildEgyptAgricultureG8Term()],
};

/** Term 1 = the official book: field → lesson, the whole lesson as its document. */
function buildEgyptAgricultureG8Term(): TermSeedSpec {
  const check = verifyAgricultureG8Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب الزراعة (ثانية إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_AGRICULTURE_G8_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g8-agri-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: agricultureG8LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-8 Agriculture tree verification, as one verdict. */
function verifyAgricultureG8Tree(): { ok: boolean; problems: string[] } {
  const table = isAgricultureG8TreeConsistent();
  const book = assertAgricultureG8TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-8 **Industry & entrepreneurship** («مهارات الصناعة وريادة
 * الأعمال») — OFFICIAL curriculum (PHASE 99), one of the three Prep-2 books the
 * Prep-1 sweep left out.
 *
 * The first term IS the Ministry textbook (`Industry_Prep2_T1.pdf`, 2026/2027
 * MoE edition): its two printed fields («مهارات الحفر على الخشب والأركت» /
 * «مهارات تكنولوجيا الأعمال الصحية») and seven printed sections
 * («أولاً/ثانيًا/…»), one app lesson per printed section, each grounded on the
 * OCR text of the very pages the section owns
 * (server/data/curriculum-ocr/industry-p2-t1/). Each lesson's `concepts` are the
 * section's own printed «نواتج التعلم المستهدفة», verbatim.
 *
 * Verified before seeding: `isConsistent` checks the table's invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the 35 printed
 * footers, each section opener's own title, the tiling, and that every printed
 * outcome really appears inside its lesson's pages.
 */
export const EGYPT_INDUSTRY_G8_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-8", name: "Grade 8", nameAr: "الصف الثاني الإعدادي", levelOrder: 8 },
  subject: { code: "industry", name: "Industry & Entrepreneurship", nameAr: "مهارات الصناعة وريادة الأعمال" },
  curriculum: { code: "eg-g8-industry", title: "مهارات الصناعة وريادة الأعمال للصف الثاني الإعدادي" },
  terms: [buildEgyptIndustryG8Term()],
};

/** Term 1 = the official book: field → section, the whole section as its document. */
function buildEgyptIndustryG8Term(): TermSeedSpec {
  const check = verifyIndustryG8Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب الصناعة (ثانية إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_INDUSTRY_G8_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g8-ind-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: industryG8LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-8 Industry tree verification, as one verdict. */
function verifyIndustryG8Tree(): { ok: boolean; problems: string[] } {
  const table = isIndustryG8TreeConsistent();
  const book = assertIndustryG8TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-8 **Library & research skills** («المكتبات ومهارات البحث») —
 * OFFICIAL curriculum (PHASE 99), one of the three Prep-2 books the Prep-1 sweep
 * left out; the Grade-7 library book was already ported (PHASE 81).
 *
 * The first term IS the Ministry textbook (`Libraries_2prep_tr1.pdf`, 2026/2027
 * MoE edition): its ten printed «الموضوعات», one app lesson per topic, each
 * grounded on the OCR text of the very pages the topic owns
 * (server/data/curriculum-ocr/libraries-p2-t1/). Each lesson's `concepts` are
 * the topic's own printed «الأهداف», verbatim. The closing «قائمة المصطلحات»
 * glossary is kept as back matter outside the lesson ranges.
 *
 * Verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the 53 printed
 * footers, the topic titles each opener prints, the tiling, and that every
 * printed objective really appears inside its topic's pages.
 */
export const EGYPT_LIBRARIES_G8_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-8", name: "Grade 8", nameAr: "الصف الثاني الإعدادي", levelOrder: 8 },
  subject: { code: "libraries", name: "Library & Research Skills", nameAr: "المكتبات ومهارات البحث" },
  curriculum: { code: "eg-g8-libraries", title: "المكتبات ومهارات البحث للصف الثاني الإعدادي" },
  terms: [buildEgyptLibrariesG8Term()],
};

/** Term 1 = the official book: printed topic → its single app lesson. */
function buildEgyptLibrariesG8Term(): TermSeedSpec {
  const check = verifyLibrariesG8Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب المكتبات (ثانية إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_LIBRARIES_G8_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الموضوع ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g8-lib-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: librariesG8LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-8 Library tree verification, as one verdict. */
function verifyLibrariesG8Tree(): { ok: boolean; problems: string[] } {
  const table = isLibrariesG8TreeConsistent();
  const book = assertLibrariesG8TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-7 **Educational media** («الإعلام التربوي») — OFFICIAL
 * curriculum (PHASE 80).
 *
 * The first term IS the Ministry textbook (`Educational_media_Pep1_Tr1.pdf`,
 * 2026/2027 MoE edition): its ten printed «الموضوعات» as the book's فهرس
 * الموضوعات (book page 3) prints them, one app lesson per topic, each grounded
 * on the OCR text of the very pages the topic owns
 * (server/data/curriculum-ocr/educational-media-p1-t1/). Each lesson's
 * `concepts` are the topic's own printed «الأهداف», verbatim.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the topic heads each topic page prints, and the tiling. Seeding refuses to run
 * on an unverified table.
 */
export const EGYPT_EDUCATIONAL_MEDIA_P1_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-7", name: "Grade 7", nameAr: "الصف الأول الإعدادي", levelOrder: 7 },
  subject: { code: "educational-media", name: "Educational Media", nameAr: "الإعلام التربوي" },
  curriculum: { code: "eg-g7-educational-media", title: "الإعلام التربوي للصف الأول الإعدادي" },
  terms: [buildEgyptEducationalMediaP1Term()],
};

/** Term 1 = the official book: printed topic → its single app lesson. */
function buildEgyptEducationalMediaP1Term(): TermSeedSpec {
  const check = verifyEducationalMediaP1Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب الإعلام التربوي (أول إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_EDUCATIONAL_MEDIA_P1_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الموضوع ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g7-edm-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: educationalMediaP1LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-7 Educational-media tree verification, as one verdict. */
function verifyEducationalMediaP1Tree(): { ok: boolean; problems: string[] } {
  const table = isEducationalMediaP1TreeConsistent();
  const book = assertEducationalMediaP1TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-7 **Information & Communication Technology** («تكنولوجيا
 * المعلومات والاتصالات») — OFFICIAL curriculum (PHASE 79).
 *
 * The first term IS the Ministry textbook (`ICT_ARABIC_Prp1_TR1.pdf`,
 * 2026/2027 MoE edition): its single printed chapter «الفصل: المبادئ والأساسيات
 * الرقمية» and its ten lessons, one app lesson per printed lesson, each grounded
 * on the OCR text of the very pages the lesson owns
 * (server/data/curriculum-ocr/ict-p1-t1/). Each lesson's `concepts` are the
 * lesson's own printed «نواتج التعلم», verbatim.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the lesson heads each lesson page prints, and the tiling. Seeding refuses to
 * run on an unverified table.
 */
export const EGYPT_ICT_P1_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-7", name: "Grade 7", nameAr: "الصف الأول الإعدادي", levelOrder: 7 },
  subject: { code: "ict", name: "Information & Communication Technology", nameAr: "تكنولوجيا المعلومات والاتصالات" },
  curriculum: { code: "eg-g7-ict", title: "تكنولوجيا المعلومات والاتصالات للصف الأول الإعدادي" },
  terms: [buildEgyptIctP1Term()],
};

/** Term 1 = the official book: printed unit → printed lesson. */
function buildEgyptIctP1Term(): TermSeedSpec {
  const check = verifyIctP1Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب تكنولوجيا المعلومات (أول إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ICT_P1_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g7-ict-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: ictP1LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-7 ICT tree verification, as one verdict. */
function verifyIctP1Tree(): { ok: boolean; problems: string[] } {
  const table = isIctP1TreeConsistent();
  const book = assertIctP1TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-7 **Arabic language** («اللغة العربية») — OFFICIAL curriculum
 * (PHASE 88).
 *
 * The first term IS the Ministry textbook (`Arabic_Prep1_T1.pdf`, 2026/2027 MoE
 * edition): its general review (مراجعة عامة) then the three units as the book's
 * فهرس prints them, each lesson carrying the book's own printed components
 * (قراءة، قواعد نحوية، قواعد إملائية، تحدث، كتابة، نص شعري), grounded on the OCR
 * text of the pages the book prints for each
 * (server/data/curriculum-ocr/arabic-p1-t1/). Listening lessons also carry their
 * appendix passage («نصوص الاستماع»). Each lesson's `concepts` are its printed
 * components, «النوع: العنوان».
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the unit/lesson/component pages against what each page actually prints, and
 * the tiling. Seeding refuses to run on an unverified table.
 */
export const EGYPT_ARABIC_P1_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-7", name: "Grade 7", nameAr: "الصف الأول الإعدادي", levelOrder: 7 },
  subject: { code: "arabic", name: "Arabic", nameAr: "اللغة العربية" },
  curriculum: { code: "eg-g7-arabic", title: "اللغة العربية للصف الأول الإعدادي" },
  terms: [buildEgyptArabicP1Term()],
};

/** Term 1 = the official book: unit → lesson → the book's own printed components. */
function buildEgyptArabicP1Term(): TermSeedSpec {
  const check = verifyArabicP1Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب اللغة العربية (أول إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ARABIC_P1_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = lesson.title;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g7-ara-${lesson.key}`,
          title,
          concepts: lesson.concepts.map((concept) => `${concept.kind}: ${concept.title}`),
          doc: { title, content: arabicP1LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-7 Arabic tree verification, as one verdict. */
function verifyArabicP1Tree(): { ok: boolean; problems: string[] } {
  const table = isArabicP1TreeConsistent();
  const book = assertArabicP1TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-7 **Islamic religious education** («التربية الدينية الإسلامية»)
 * — OFFICIAL curriculum (PHASE 83).
 *
 * The first term IS the Ministry textbook (`Islamic_Education_Prep1_T1.pdf`,
 * 2026/2027 MoE edition): its printed units and their lessons as the book's
 * فهرس prints them, each grounded on the OCR text of the very pages the lesson
 * owns (server/data/curriculum-ocr/islamic-p1-t1/). Each lesson's `concepts` are
 * the lesson's own printed «الأهداف», verbatim.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the lesson heads each lesson page prints, and the tiling. Seeding refuses to
 * run on an unverified table.
 */
export const EGYPT_ISLAMIC_P1_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-7", name: "Grade 7", nameAr: "الصف الأول الإعدادي", levelOrder: 7 },
  subject: { code: "islamic-education", name: "Islamic Religious Education", nameAr: "التربية الدينية الإسلامية" },
  curriculum: { code: "eg-g7-islamic-education", title: "التربية الدينية الإسلامية للصف الأول الإعدادي" },
  terms: [buildEgyptIslamicP1Term()],
};

/** Term 1 = the official book: printed unit → printed lesson. */
function buildEgyptIslamicP1Term(): TermSeedSpec {
  const check = verifyIslamicP1Tree();
  if (!check.ok) {
    throw new Error(`شجرة كتاب التربية الإسلامية (أول إعدادي) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  }
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_ISLAMIC_P1_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.lessons.map((lesson, li) => {
        const title = `الدرس ${lesson.ordinal}: ${lesson.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-g7-isl-${lesson.key}`,
          title,
          concepts: lesson.concepts,
          doc: { title, content: islamicP1LessonDocument(ui, li) },
        };
      }),
    })),
  };
}

/** Both halves of the Grade-7 Islamic tree verification, as one verdict. */
function verifyIslamicP1Tree(): { ok: boolean; problems: string[] } {
  const table = isIslamicP1TreeConsistent();
  const book = assertIslamicP1TreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-6 **Mathematics, English-medium edition** — OFFICIAL curriculum
 * (PHASE 66).
 *
 * The first term IS the Ministry textbook `Math_Primary6_T1_EN.pdf` (Primary 6
 * Mathematics Techbook™, 2026/2027 edition): the same seven units as the Arabic
 * `eg-g6-math`, with each printed concept as an app lesson, grounded on the OCR
 * text of the pages the book prints for it
 * (server/data/curriculum-ocr/math-en-t1/). Each lesson's concepts are the
 * printed «Learning Target» bullets of its lessons, verbatim. There is no
 * second-term spec: its book has not been imported.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the concept titles each page prints, and the tiling. Seeding refuses to run on
 * an unverified table.
 */
export const EGYPT_MATH_EN_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  subject: { code: "math-en", name: "Mathematics (English)", nameAr: "الرياضيات (بالإنجليزية)" },
  curriculum: { code: "eg-g6-math-en", title: "الرياضيات للصف السادس الابتدائي (بالإنجليزية)" },
  terms: [buildEgyptMathEnT1Term()],
};

/** Term 1 = the official English-medium book: one app lesson per printed concept. */
function buildEgyptMathEnT1Term(): TermSeedSpec {
  const check = verifyMathEnTree();
  if (!check.ok) throw new Error(`شجرة كتاب الرياضيات (بالإنجليزية) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_MATH_EN_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.concepts.map((concept, ci) => {
        const title = `المفهوم ${concept.key}: ${concept.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-men-${concept.key.replace(".", "-")}`,
          title,
          concepts: concept.concepts,
          doc: { title, content: mathEnConceptDocument(ui, ci) },
        };
      }),
    })),
  };
}

/** Both halves of the English-medium maths tree verification, as one verdict. */
function verifyMathEnTree(): { ok: boolean; problems: string[] } {
  const table = isMathEnTreeConsistent();
  const book = assertMathEnTreeMatchesBook();
  return { ok: table.ok && book.ok, problems: [...table.problems, ...book.problems] };
}

/**
 * Egyptian Grade-6 **Mathematics, French-medium edition** — OFFICIAL curriculum
 * (PHASE 67).
 *
 * The first term IS the Ministry textbook `Math_Primary6_T1_FR.pdf` («Maths 1er
 * Terme», 2026/2027 edition): the same seven units as the Arabic `eg-g6-math` and
 * the English `eg-g6-math-en`, with each printed concept as an app lesson,
 * grounded on the OCR text of the pages the book prints for it
 * (server/data/curriculum-ocr/math-fr-t1/ — the whole book is OCR'd, one source).
 * Each lesson's concepts are the printed «Objectif(s) d'apprentissage» bullets of
 * its lessons, verbatim. There is no second-term spec: its book has not been
 * imported.
 *
 * The tree is verified before seeding: `isConsistent` checks its invariants and
 * `assertTreeMatchesTheBook` proves the page mapping from the printed footers,
 * the concept titles each page prints, and the tiling. Seeding refuses to run on
 * an unverified table.
 */
export const EGYPT_MATH_FR_SPEC: CountrySeedSpec = {
  country: { code: "eg", name: "Egypt", nameAr: "مصر" },
  system: { code: "mo-edu", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم", sortOrder: 1 },
  grade: { code: "grade-6", name: "Grade 6", nameAr: "الصف السادس الابتدائي", levelOrder: 6 },
  subject: { code: "math-fr", name: "Mathematics (French)", nameAr: "الرياضيات (بالفرنسية)" },
  curriculum: { code: "eg-g6-math-fr", title: "الرياضيات للصف السادس الابتدائي (بالفرنسية)" },
  terms: [buildEgyptMathFrT1Term()],
};

/** Term 1 = the official French-medium book: one app lesson per printed concept. */
function buildEgyptMathFrT1Term(): TermSeedSpec {
  const check = verifyMathFrTree();
  if (!check.ok) throw new Error(`شجرة كتاب الرياضيات (بالفرنسية) غير متسقة:\n- ${check.problems.join("\n- ")}`);
  return {
    code: "term-1",
    title: "الفصل الدراسي الأول",
    units: EGYPT_MATH_FR_T1_UNITS.map((unit, ui) => ({
      code: `unit-${ui + 1}`,
      title: unit.title,
      lessons: unit.concepts.map((concept, ci) => {
        const title = `المفهوم ${concept.key}: ${concept.title}`;
        return {
          // Namespaced so codes stay unique across every seeded curriculum.
          code: `l-mfr-${concept.key.replace(".", "-")}`,
          title,
          concepts: concept.concepts,
          doc: { title, content: mathFrConceptDocument(ui, ci) },
        };
      }),
    })),
  };
}

/** Both halves of the French-medium maths tree verification, as one verdict. */
function verifyMathFrTree(): { ok: boolean; problems: string[] } {
  const table = isMathFrTreeConsistent();
  const book = assertMathFrTreeMatchesBook();
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

  await pruneContentFreeChunks(db);

  const egypt = await seedCountry(db, knowledge, EGYPT_SPEC);
  await seedCountry(db, knowledge, EGYPT_ENGLISH_SPEC);
  await seedCountry(db, knowledge, EGYPT_SCIENCE_SPEC);
  await seedCountry(db, knowledge, EGYPT_SOCIAL_SPEC);
  await seedCountry(db, knowledge, EGYPT_SOCIAL_G9_SPEC);
  await seedCountry(db, knowledge, EGYPT_SOCIAL_G8_SPEC);
  await seedCountry(db, knowledge, EGYPT_ARABIC_SPEC);
  await seedCountry(db, knowledge, EGYPT_ARABIC_G9_SPEC);
  await seedCountry(db, knowledge, EGYPT_ARABIC_G8_SPEC);  await seedCountry(db, knowledge, EGYPT_ICT_SPEC);
  await seedCountry(db, knowledge, EGYPT_ICT_G8_SPEC);
  await seedCountry(db, knowledge, EGYPT_ICT_G8_EN_SPEC);
  await seedCountry(db, knowledge, EGYPT_ICT_G9_SPEC);  await seedCountry(db, knowledge, EGYPT_ISLAMIC_SPEC);  await seedCountry(db, knowledge, EGYPT_ISLAMIC_G8_SPEC);
  await seedCountry(db, knowledge, EGYPT_ISLAMIC_G9_SPEC);
  await seedCountry(db, knowledge, EGYPT_CHRISTIAN_SPEC);
  await seedCountry(db, knowledge, EGYPT_CHRISTIAN_G9_SPEC);
  await seedCountry(db, knowledge, EGYPT_CHRISTIAN_G8_SPEC);
  await seedCountry(db, knowledge, EGYPT_CHRISTIAN_P1_SPEC);
  await seedCountry(db, knowledge, EGYPT_THEATER_P1_SPEC);
  await seedCountry(db, knowledge, EGYPT_LIBRARIES_P1_SPEC);
  await seedCountry(db, knowledge, EGYPT_EDUCATIONAL_MEDIA_P1_SPEC);
  await seedCountry(db, knowledge, EGYPT_ICT_P1_SPEC);
  await seedCountry(db, knowledge, EGYPT_ARABIC_P1_SPEC);
  await seedCountry(db, knowledge, EGYPT_ISLAMIC_P1_SPEC);
  await seedCountry(db, knowledge, EGYPT_MATH_EN_SPEC);
  await seedCountry(db, knowledge, EGYPT_MATH_FR_SPEC);
  await seedCountry(db, knowledge, EGYPT_MATH_G9_SPEC);
  await seedCountry(db, knowledge, EGYPT_MATH_G8_SPEC);
  await seedCountry(db, knowledge, EGYPT_MATH_G8_EN_SPEC);
  await seedCountry(db, knowledge, EGYPT_MATH_G8_FR_SPEC);
  await seedCountry(db, knowledge, EGYPT_MATH_P1_SPEC);
  await seedCountry(db, knowledge, EGYPT_SCIENCE_G9_SPEC);
  await seedCountry(db, knowledge, EGYPT_SCIENCE_G8_SPEC);
  await seedCountry(db, knowledge, EGYPT_SCIENCE_G8_EN_SPEC);
  await seedCountry(db, knowledge, EGYPT_AGRICULTURE_G8_SPEC);
  await seedCountry(db, knowledge, EGYPT_INDUSTRY_G8_SPEC);
  await seedCountry(db, knowledge, EGYPT_LIBRARIES_G8_SPEC);
  await seedCountry(db, knowledge, EGYPT_SCIENCE_EN_P1_SPEC);
  await seedCountry(db, knowledge, EGYPT_MATH_EN_P1_SPEC);
  await seedCountry(db, knowledge, EGYPT_SCIENCE_P1_SPEC);
  await seedCountry(db, knowledge, EGYPT_SCIENCE_FR_P1_SPEC);
  await seedCountry(db, knowledge, EGYPT_SOCIAL_P1_SPEC);
  await seedCountry(db, knowledge, EGYPT_ENGLISH_G9_SPEC);
  await seedCountry(db, knowledge, EGYPT_ENGLISH_G10_SPEC);
  await seedCountry(db, knowledge, EGYPT_ENGLISH2_G10_SPEC);
  await seedCountry(db, knowledge, EGYPT_ITALIAN_G10_SPEC);
  await seedCountry(db, knowledge, EGYPT_GERMAN_G10_SPEC);
  await seedCountry(db, knowledge, EGYPT_SPANISH_G10_SPEC);
  await seedCountry(db, knowledge, EGYPT_FRENCH_G10_SPEC);
  await seedCountry(db, knowledge, EGYPT_ENGLISH_G8_SPEC);
  await seedCountry(db, knowledge, EGYPT_ENGLISH_P1_SPEC);
  await seedCountry(db, knowledge, SAUDI_SPEC);
  await seedUsers(db, curriculum, egypt);

  db.sqlite.close();
  console.log("✓ Seed complete — Egypt (Math + English + Science + Social Studies + Arabic + ICT + Islamic & Christian Education + Math English + Math French) + Saudi Grade-6 Math, demo accounts, RAG corpora ready.");
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
 *
 * PHASE 69 — concepts the lesson no longer prints are deleted, so re-seeding
 * converges on the spec instead of accumulating stale rows (the maths and
 * science lessons moved from a single title concept to their printed objective
 * bullets / learning topics).
 */
async function reconcileConcepts(db: DbHandle, lessonId: string, lessonSpec: LessonSeedSpec): Promise<void> {
  const existing = await db.db.select().from(concepts).where(eq(concepts.lessonId, lessonId)).orderBy(asc(concepts.code));
  const specTitles = new Set(lessonSpec.concepts);
  for (const row of existing) {
    if (!specTitles.has(row.title)) {
      await db.db.delete(concepts).where(eq(concepts.id, row.id));
    }
  }
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

/**
 * Content-free chunks are OCR noise — the detached dot columns of a printed
 * answer key, rules, stray punctuation. `chunkText` refuses to create them, but
 * rows ingested before that guard exist, and a seeder that skips a lesson whose
 * chunks already exist would never repair them. This pass converges any
 * knowledge base (local or deployed) by deleting such rows and their vectors.
 */
async function pruneContentFreeChunks(db: DbHandle): Promise<void> {
  const rows = await db.db.select({ id: chunks.id, content: chunks.content }).from(chunks);
  const noise = rows.filter((row) => !hasMeaningfulContent(row.content));
  for (const row of noise) {
    await db.db.delete(ragVectors).where(eq(ragVectors.chunkId, row.id));
    await db.db.delete(chunks).where(eq(chunks.id, row.id));
  }
  if (noise.length > 0) {
    console.log(`⌫ Removed ${noise.length} content-free chunk(s) left by OCR noise.`);
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
