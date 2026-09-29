import type { FastifyPluginAsync } from "fastify";
import { Errors } from "../../utils/errors.js";
import { resolveTutorLanguage } from "../tutor/language.js";
import { readPageImage, stageForLesson } from "./bookStage.js";

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

  app.get("/subjects", async () => ({ subjects: await app.curriculum.listSubjects() }));

  app.get("/curricula", async (request) => {
    const query = request.query as Record<string, unknown>;
    const gradeId = requireQuery(query, "gradeId", idPattern);
    const subjectId = requireQuery(query, "subjectId", idPattern);
    return { curricula: await app.curriculum.listCurricula(gradeId, subjectId) };
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

  /**
   * One textbook page image, addressed by its *printed* page number so the URL
   * the client shows the student ("صفحة 12") is the number on the paper.
   */
  app.get("/book-pages/:bookPage.jpg", async (request, reply) => {
    const { bookPage } = request.params as { bookPage: string };
    if (!/^\d{1,3}$/.test(bookPage)) {
      throw Errors.badRequest("رقم الصفحة غير صالح", "INVALID_PAGE");
    }
    const image = readPageImage(Number(bookPage));
    if (!image) throw Errors.notFound("صفحة الكتاب غير متاحة");
    // Textbook pages never change for a given edition: cache them hard.
    reply.header("cache-control", "public, max-age=86400, immutable");
    return reply.type("image/jpeg").send(image);
  });
};