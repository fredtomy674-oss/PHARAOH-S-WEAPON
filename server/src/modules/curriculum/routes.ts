import type { FastifyPluginAsync } from "fastify";
import { Errors } from "../../utils/errors.js";
import { resolveTutorLanguage } from "../tutor/language.js";
import { stageForLesson } from "./bookStage.js";

function requireQuery(query: Record<string, unknown>, name: string, pattern?: RegExp): string {
  const value = query[name];
  if (typeof value !== "string" || value.length === 0) {
    throw Errors.badRequest(`المعامل ${name} مطلوب`, "MISSING_QUERY_PARAM");
  }
  if (pattern && !pattern.test(value)) {
    throw Errors.badRequest(`المعامل ${name} غير صالح`, "INVALID_QUERY_PARAM");
  }
  return value;
}

const idPattern = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Read-only curriculum catalog (public). Drives the onboarding picker:
 * countries → systems → grades → subjects → curricula → terms → units →
 * lessons → concepts.
 */
export const curriculumRoutes: FastifyPluginAsync = async (app) => {
  app.get("/countries", async () => ({ countries: await app.curriculum.listCountries() }));

  app.get("/systems", async (request) => {
    const countryId = requireQuery(request.query as Record<string, unknown>, "countryId", idPattern);
    return { systems: await app.curriculum.listSystems(countryId) };
  });

  app.get("/grades", async (request) => {
    const systemId = requireQuery(request.query as Record<string, unknown>, "systemId", idPattern);
    return { grades: await app.curriculum.listGrades(systemId) };
  });

  app.get("/subjects", async (request) => {
    // Optional: scoped to the picked grade, only subjects that grade teaches.
    // Absent: the full catalog (backward compatible).
    const query = request.query as Record<string, unknown>;
    const raw = query.gradeId;
    const gradeId = typeof raw === "string" && raw.length > 0 ? raw : undefined;
    if (gradeId !== undefined && !idPattern.test(gradeId)) {
      throw Errors.badRequest("المعامل gradeId غير صالح", "INVALID_QUERY_PARAM");
    }
    // PHASE 185 — optional student scope: only that child's active enrollments.
    // It is how the track choice becomes a hard boundary in the picker.
    const rawStudent = query.studentId;
    const studentId = typeof rawStudent === "string" && rawStudent.length > 0 ? rawStudent : undefined;
    if (studentId !== undefined && !idPattern.test(studentId)) {
      throw Errors.badRequest("المعامل studentId غير صالح", "INVALID_QUERY_PARAM");
    }
    return { subjects: await app.curriculum.listSubjects(gradeId, studentId) };
  });

  app.get("/curricula", async (request) => {
    const query = request.query as Record<string, unknown>;
    const gradeId = requireQuery(query, "gradeId", idPattern);
    const subjectId = requireQuery(query, "subjectId", idPattern);
    const rawStudent = query.studentId;
    const studentId = typeof rawStudent === "string" && rawStudent.length > 0 ? rawStudent : undefined;
    if (studentId !== undefined && !idPattern.test(studentId)) {
      throw Errors.badRequest("المعامل studentId غير صالح", "INVALID_QUERY_PARAM");
    }
    return { curricula: await app.curriculum.listCurricula(gradeId, subjectId, studentId) };
  });

  /** PHASE 185 — «علمي ولا أدبي؟»: the tracks this grade actually offers. */
  app.get("/tracks", async (request) => {
    const gradeId = requireQuery(request.query as Record<string, unknown>, "gradeId", idPattern);
    return { tracks: await app.curriculum.listTrackOptions(gradeId) };
  });

  app.get("/terms", async (request) => {
    const curriculumId = requireQuery(request.query as Record<string, unknown>, "curriculumId", idPattern);
    return { terms: await app.curriculum.listTerms(curriculumId) };
  });

  app.get("/units", async (request) => {
    const termId = requireQuery(request.query as Record<string, unknown>, "termId", idPattern);
    return { units: await app.curriculum.listUnits(termId) };
  });

  app.get("/lessons", async (request) => {
    const unitId = requireQuery(request.query as Record<string, unknown>, "unitId", idPattern);
    return { lessons: await app.curriculum.listLessons(unitId) };
  });

  app.get("/lessons/:lessonId/breadcrumb", async (request) => {
    const { lessonId } = request.params as { lessonId: string };
    const breadcrumb = await app.curriculum.lessonBreadcrumb(lessonId);
    // PHASE 38/D-042 — the client shows which language the tutor will answer in.
    // The server resolves it (single source of truth) and the client only displays
    // it, so the badge can never disagree with the actual reply language.
    return { breadcrumb, replyLanguage: resolveTutorLanguage(breadcrumb.subject) };
  });

  app.get("/lessons/:lessonId/concepts", async (request) => {
    const { lessonId } = request.params as { lessonId: string };
    return { concepts: await app.curriculum.listConcepts(lessonId) };
  });

  /**
   * PHASE 48 — «مسرح الكتاب»: the printed pages a lesson occupies.
   *
   * The session shows the real page instead of describing it, and cites it
   * (`[صفحة الكتاب 12]`) — the same page the student can turn to. `stage` is
   * null for lessons that are not pages of a rasterized book, and a book with
   * no extracted images comes back with `hasImages: false`; the room treats both
   * as a text-only session rather than an error.
   */
  app.get("/lessons/:lessonId/stage", async (request) => {
    const { lessonId } = request.params as { lessonId: string };
    const { curriculum, lesson } = await app.curriculum.lessonBreadcrumb(lessonId);
    // Match on the curriculum's stable code, never its row id: the code is what
    // identifies "the Egypt Grade-6 first-term book" across reseeds, and the
    // lesson code (l-con-1-1) already names the printed concept.
    return { stage: stageForLesson(curriculum.code, lesson.code) };
  });

  // W2 — «المرجع لا النسخ» (الأطلس §١٥): the book-pages image service is gone.
  // The room names the page («كتابك — صفحة ٦ من ٧») and the student opens his
  // own copy. The page IMAGES stay internal to the tutor (vision/OCR read them
  // server-side — see `readPageImage` callers in the sessions service).
};