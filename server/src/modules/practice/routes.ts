import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../plugins/auth.js";
import { Errors } from "../../utils/errors.js";

/**
 * PHASE 24 + 25 + 28 + 30 — practice loop feeding the concept-mastery engine.
 *   GET  /api/practice/question?conceptId=…&type=mcq|open  → { question } (null when none)
 *   GET  /api/practice/plan                    → { plan } ranked weakest-first
 *   POST /api/practice/generate                → { question } for a questionless concept (kind: mcq|open)
 *   POST /api/practice/questions/:id/submit    → { correct, explanation, mastery, score, feedback }
 * Student-only. MCQ grading is deterministic (no AI calls); open answers go
 * through the PHASE 30 `grade_open` AI operation (mock offline / LLM in
 * production); the PHASE 28/30 generation path touches the AI provider —
 * once per questionless concept (per kind), then cached/stored for everyone.
 */
export const practiceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/question", { preHandler: requireAuth }, async (request) => {
    const auth = request.auth!;
    if (auth.user.role !== "student" || !auth.student) {
      throw Errors.forbidden("التمارين مخصصة لحسابات الطلاب");
    }
    const raw = (request.query as { conceptId?: unknown; type?: unknown }).conceptId;
    const conceptId = typeof raw === "string" && raw.length > 0 ? raw : undefined;
    const rawType = (request.query as { type?: unknown }).type;
    const type: "mcq" | "open" | null =
      rawType === undefined || rawType === "mcq" ? "mcq" : rawType === "open" ? "open" : null;
    if (!type) throw Errors.badRequest("نوع سؤال غير مدعوم", "INVALID_TYPE");
    const question = await app.practice.questionFor(auth.student.id, conceptId, type);
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

  // PHASE 28 + 30 — self-healing practice: generate one MCQ (kind defaults to
  // "mcq") or one open question for a concept that has none of that kind yet
  // (offline via the mock provider, LLM in production). The generated question
  // is stored and immediately playable by the whole class.
  app.post("/generate", { preHandler: requireAuth }, async (request) => {
    const auth = request.auth!;
    if (auth.user.role !== "student" || !auth.student) {
      throw Errors.forbidden("التمارين مخصصة لحسابات الطلاب");
    }
    const body = (request.body ?? {}) as { conceptId?: unknown; kind?: unknown };
    const conceptId = body.conceptId;
    if (typeof conceptId !== "string" || conceptId.length === 0) {
      throw Errors.badRequest("اختر مفهومًا لتوليد سؤاله", "INVALID_CONCEPT");
    }
    const kind: "mcq" | "open" | null =
      body.kind === undefined || body.kind === "mcq" ? "mcq" : body.kind === "open" ? "open" : null;
    if (!kind) throw Errors.badRequest("نوع التوليد غير مدعوم", "INVALID_KIND");
    const question = await app.practice.generateQuestionForStudent(auth.student.id, conceptId, auth.user.id, kind);
    return { question };
  });

  app.post("/questions/:id/submit", { preHandler: requireAuth }, async (request) => {
    const auth = request.auth!;
    if (auth.user.role !== "student" || !auth.student) {
      throw Errors.forbidden("التمارين مخصصة لحسابات الطلاب");
    }
    const { id } = request.params as { id: string };
    const body = (request.body ?? {}) as { optionIndex?: unknown; answer?: unknown };
    // The question's type decides which field is meaningful; the service rejects
    // a wrong payload kind and validates ranges/bounds.
    return app.practice.submitAnswer(
      auth.student.id,
      id,
      { optionIndex: body.optionIndex, answer: body.answer },
      { actorUserId: auth.user.id },
    );
  });
};