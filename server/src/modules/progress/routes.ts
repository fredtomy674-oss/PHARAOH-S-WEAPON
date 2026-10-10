import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../plugins/auth.js";
import { buildPrerequisiteGraph } from "./prerequisites.js";

/** Student progress for the current student (locked to the session user). */
export const progressRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me", { preHandler: requireAuth }, async (request, reply) => {
    const auth = request.auth!;
    if (auth.user.role !== "student" || !auth.student) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "التقدم مخصص لحسابات الطلاب" } });
    }
    const detail = await app.memory.progressDetail(auth.student.id);
    return {
      progress: detail,
      mastery: await app.memory.masterySummary(auth.student.id),
      tutorUsageToday: await app.ai.usage.countTutorCallsForUserToday(auth.user.id),
    };
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
