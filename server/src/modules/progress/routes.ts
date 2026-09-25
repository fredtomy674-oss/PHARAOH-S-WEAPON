import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../plugins/auth.js";

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
};