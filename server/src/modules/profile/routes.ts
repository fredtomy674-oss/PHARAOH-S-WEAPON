import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { students } from "../../db/schema.js";
import { requireAuth } from "../../plugins/auth.js";

export const profileRoutes: FastifyPluginAsync = async (app) => {
  const updateSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
      displayName: { type: "string", minLength: 2, maxLength: 80 },
      gradeId: { type: ["string", "null"], maxLength: 64 },
      countryId: { type: ["string", "null"], maxLength: 64 },
    },
  };

  app.put("/me/student", { preHandler: requireAuth, schema: { body: updateSchema } }, async (request, reply) => {
    const auth = request.auth!;
    if (auth.user.role !== "student" || !auth.student) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "الحساب ليس طالبًا" } });
    }
    const body = request.body as { displayName?: string; gradeId?: string | null };

    const before = await app.db.db.select().from(students).where(eq(students.id, auth.student.id)).get();
    const now = new Date();
    await app.db.db
      .update(students)
      .set({
        displayName: body.displayName ?? before?.displayName,
        gradeId: body.gradeId === undefined ? before?.gradeId : body.gradeId,
        updatedAt: now,
      })
      .where(eq(students.id, auth.student.id));

    await app.audit.record({
      actorUserId: auth.user.id,
      action: "profile.update",
      entityType: "student",
      entityId: auth.student.id,
      beforeJson: JSON.stringify({ displayName: before?.displayName, gradeId: before?.gradeId }),
      afterJson: JSON.stringify(body),
      ip: request.ip,
    });

    const updated = await app.db.db.select().from(students).where(eq(students.id, auth.student.id)).get();
    return reply.send({ student: updated });
  });
};