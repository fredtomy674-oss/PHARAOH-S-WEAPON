import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../plugins/auth.js";
import { Errors } from "../../utils/errors.js";

/**
 * PHASE 24 + 25 — practice loop feeding the concept-mastery engine.
 *   GET  /api/practice/question?conceptId=…  → { question } (null when none)
 *   GET  /api/practice/plan                  → { plan } ranked weakest-first
 *   POST /api/practice/questions/:id/submit  → { correct, explanation, mastery }
 * Student-only. Grading is deterministic (no AI calls), so offline + cheap.
 */
export const practiceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/question", { preHandler: requireAuth }, async (request) => {
    const auth = request.auth!;
    if (auth.user.role !== "student" || !auth.student) {
      throw Errors.forbidden("التمارين مخصصة لحسابات الطلاب");
    }
    const raw = (request.query as { conceptId?: unknown }).conceptId;
    const conceptId = typeof raw === "string" && raw.length > 0 ? raw : undefined;
    const question = await app.practice.questionFor(auth.student.id, conceptId);
    return { question };
  });

  // PHASE 25 — the ranked practice plan (weakest tracked concepts first).
  app.get("/plan", { preHandler: requireAuth }, async (request) => {
    const auth = request.auth!;
    if (auth.user.role !== "student" || !auth.student) {
      throw Errors.forbidden("التمارين مخصصة لحسابات الطلاب");
    }
    return { plan: await app.practice.planFor(auth.student.id) };
  });

  app.post("/questions/:id/submit", { preHandler: requireAuth }, async (request) => {
    const auth = request.auth!;
    if (auth.user.role !== "student" || !auth.student) {
      throw Errors.forbidden("التمارين مخصصة لحسابات الطلاب");
    }
    const body = (request.body ?? {}) as { optionIndex?: unknown };
    const optionIndex = body.optionIndex;
    if (typeof optionIndex !== "number" || !Number.isInteger(optionIndex) || optionIndex < 0) {
      throw Errors.badRequest("اختر خيارًا صالحًا", "INVALID_OPTION");
    }
    const { id } = request.params as { id: string };
    return app.practice.submitAnswer(auth.student.id, id, optionIndex);
  });
};