// PHASE 192 — official G12 Arabic grammar, first term.
//
// The Ministry's G12 index points at «القواعد الأساسية للنحو والصرف» — the
// same 184-page secondary-stage grammar book used by the G10 entry. Its
// thirteen units and printed lesson heads are already transcribed and verified
// in `egyptNahwG10T1.ts`; this module re-exports that verified tree under the
// G12 lesson namespace and adds our own teaching guide to every lesson.
import {
  checkG12Tree,
  g12Guide,
  g12LessonDocument,
  type G12BookIdentity,
  type G12UnitSpec,
} from "./g12.js";
import { EGYPT_NAHW_G10_T1_UNITS } from "./egyptNahwG10T1.js";

export const EGYPT_NAHW_G12_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry3/Term1/StudentBook/Arabic_language_NAHO_Sec3.pdf";

export const EGYPT_NAHW_G12_T1_UNITS: G12UnitSpec[] = EGYPT_NAHW_G10_T1_UNITS.map((unit) => ({
  key: unit.key,
  title: unit.title,
  lessons: unit.lessons.map((lesson) => {
    const concepts = lesson.concepts.map((concept) => concept.title);
    if (concepts.length < 2) concepts.push("أمثلة وتطبيقات على القاعدة");
    return {
      key: lesson.key,
      title: lesson.title,
      concepts,
      guide: g12Guide(
        lesson.title,
        concepts,
        "اقرأ القاعدة في كتاب الوزارة، ثم طبّقها على الأمثلة المحلولة واكتب مثالًا جديدًا من إنشائك يوضح الفرق بين الحالتين.",
      ),
    };
  }),
}));

export const EGYPT_NAHW_G12_T1_BOOK: G12BookIdentity = {
  subject: "القواعد الأساسية للنحو والصرف",
  grade: "الصف الثالث الثانوي",
  sourceUrl: EGYPT_NAHW_G12_T1_SOURCE,
};

export function isNahwG12TreeConsistent() {
  return checkG12Tree("القواعد الأساسية للنحو والصرف — ثالثة ثانوي", EGYPT_NAHW_G12_T1_UNITS);
}

export function nahwG12LessonDocument(unitIndex: number, lessonIndex: number): string {
  return g12LessonDocument(EGYPT_NAHW_G12_T1_BOOK, EGYPT_NAHW_G12_T1_UNITS, unitIndex, lessonIndex);
}
