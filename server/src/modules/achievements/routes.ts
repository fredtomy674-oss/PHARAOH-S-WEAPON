import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../plugins/auth.js";
import { Errors } from "../../utils/errors.js";

/**
 * PHASE 20 — Student-facing achievements: `GET /api/achievements/me`.
 * Definitions are seeded lazily; earned badges carry `awardedAt`.
 */
export const achievementsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me", { preHandler: requireAuth }, async (request) => {
    const auth = request.auth!;
    if (auth.user.role !== "student" || !auth.student) {
      throw Errors.forbidden("هذه النهاية مخصصة لحسابات الطلاب");
    }
    const items = await app.achievements.listForStudent(auth.student.id);
    return { achievements: items, earned: items.filter((i) => i.awardedAt !== null).length, total: items.length };
  });
};