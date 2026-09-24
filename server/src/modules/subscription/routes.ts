import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../plugins/auth.js";
import { Errors } from "../../utils/errors.js";

/**
 * PHASE 20 — Student-facing subscription view: `GET /api/me/subscription`.
 * Read-only for the student (granting/revoking is an admin action).
 */
export const subscriptionRoutes: FastifyPluginAsync = async (app) => {
  app.get("/subscription", { preHandler: requireAuth }, async (request) => {
    const auth = request.auth!;
    if (auth.user.role !== "student" || !auth.student) {
      throw Errors.forbidden("هذه النهاية مخصصة لحسابات الطلاب");
    }
    return app.subscriptions.summaryForStudent(auth.student.id);
  });
};