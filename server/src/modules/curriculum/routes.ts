import type { FastifyPluginAsync } from "fastify";
import { Errors } from "../../utils/errors.js";

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
    return { breadcrumb: await app.curriculum.lessonBreadcrumb(lessonId) };
  });

  app.get("/lessons/:lessonId/concepts", async (request) => {
    const { lessonId } = request.params as { lessonId: string };
    return { concepts: await app.curriculum.listConcepts(lessonId) };
  });
};