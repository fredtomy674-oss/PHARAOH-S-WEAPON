import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../plugins/auth.js";
import { Errors } from "../../utils/errors.js";

/**
 * PHASE 24 + 25 + 28 — practice loop feeding the concept-mastery engine.
 *   GET  /api/practice/question?conceptId=…  → { question } (null when none)
 *   GET  /api/practice/plan                  → { plan } ranked weakest-first
 *   POST /api/practice/generate              → { question } for a questionless concept
 *   POST /api/practice/questions/:id/submit  → { correct, explanation, mastery }
 * Student-only. Grading is deterministic (no AI calls); only the PHASE 28
 * generation path touches the AI provider — once per questionless concept,
 * then cached/stored for everyone.
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

  // PHASE 28 — self-healing practice: generate one MCQ for a concept that has
  // no questions yet (offline via the mock provider, LLM in production). The
  // generated question is stored and immediately playable by the whole class.
  app.post("/generate", { preHandler: requireAuth }, async (request) => {
    const auth = request.auth!;
    if (auth.user.role !== "student" || !auth.student) {
      throw Errors.forbidden("التمارين مخصصة لحسابات الطلاب");
    }
    const body = (request.body ?? {}) as { conceptId?: unknown };
    const conceptId = body.conceptId;
    if (typeof conceptId !== "string" || conceptId.length === 0) {
      throw Errors.badRequest("اختر مفهومًا لتوليد سؤاله", "INVALID_CONCEPT");
    }
    const question = await app.practice.generateQuestionForStudent(auth.student.id, conceptId, auth.user.id);
    return { question };
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