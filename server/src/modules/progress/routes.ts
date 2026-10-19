import type { FastifyPluginAsync } from "fastify";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth } from "../../plugins/auth.js";
import { answers, concepts, lessons, questions } from "../../db/schema.js";
import { buildPrerequisiteGraph } from "./prerequisites.js";
import { groupMistakes } from "./mistakes.js";

/** Student progress for the current student (locked to the session user). */
export const progressRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me", { preHandler: requireAuth }, async (request, reply) => {
    const auth = request.auth!;
    if (auth.user.role !== "student" || !auth.student) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "التقدم مخصص لحسابات الطلاب" } });
    }
    // PHASE 179 — the progress surface is the CURRENT grade's, not every row
    // the child ever touched (the home's «كل المواد والصفوف» scatter).
    const gradeId = auth.student.gradeId ?? null;
    const detail = await app.memory.progressDetail(auth.student.id, undefined, gradeId);
    return {
      progress: detail,
      mastery: await app.memory.masterySummary(auth.student.id, new Date(), gradeId),
      tutorUsageToday: await app.ai.usage.countTutorCallsForUserToday(auth.user.id),
    };
  });

  /**
   * PHASE 161 (W6) — «دفتر أخطائي»: the student's own recent wrong MCQ picks,
   * grouped per question (how many times missed, the latest wrong pick, its
   * concept and lesson). Own data only, read-only; MCQ aggregates of stored
   * answers — never message content and never free text.
   */
  app.get("/me/mistakes", { preHandler: requireAuth }, async (request, reply) => {
    const auth = request.auth!;
    if (auth.user.role !== "student" || !auth.student) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "دفتر الأخطاء مخصص لحسابات الطلاب" } });
    }
    const rows = await app.db.db
      .select({
        questionId: questions.id,
        question: questions.content,
        chosen: answers.content,
        createdAt: answers.createdAt,
        conceptId: questions.conceptId,
        conceptTitle: concepts.title,
        lessonId: questions.lessonId,
        lessonTitle: lessons.title,
      })
      .from(answers)
      .innerJoin(questions, eq(answers.questionId, questions.id))
      .leftJoin(concepts, eq(questions.conceptId, concepts.id))
      .leftJoin(lessons, eq(questions.lessonId, lessons.id))
      .where(and(eq(answers.studentId, auth.student.id), eq(answers.correct, 0), eq(questions.type, "mcq")))
      .orderBy(desc(answers.createdAt))
      .limit(300);
    return { mistakes: groupMistakes(rows) };
  });

  /**
   * PHASE 95 — the lesson's prerequisite graph (concept order) with the student's
   * real mastery percentages. Powers the student's «خريطة المفاهيم» view: which
   * idea comes before which, and how solid each one actually is. Locked to the
   * session's own student — a parent/other user cannot read a child's mastery
   * graph through this route.
   */
  app.get(
    "/prerequisites/:lessonId",
    {
      preHandler: requireAuth,
      schema: {
        params: {
          type: "object",
          required: ["lessonId"],
          additionalProperties: false,
          properties: { lessonId: { type: "string", minLength: 1, maxLength: 64 } },
        },
      },
    },
    async (request, reply) => {
      const auth = request.auth!;
      if (auth.user.role !== "student" || !auth.student) {
        return reply.code(403).send({ error: { code: "FORBIDDEN", message: "خريطة المفاهيم مخصصة لحسابات الطلاب" } });
      }
      const { lessonId } = request.params as { lessonId: string };
      const [concepts, memory] = await Promise.all([
        app.curriculum.listConcepts(lessonId),
        app.memory.snapshot(auth.student.id),
      ]);
      const graph = buildPrerequisiteGraph(
        concepts.map((c) => ({ id: c.id, title: c.title })),
        memory.masteryByConcept,
      );
      return { graph };
    },
  );
};
