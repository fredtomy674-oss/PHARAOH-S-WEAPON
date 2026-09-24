import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../plugins/auth.js";

const linkBodySchema = {
  type: "object",
  required: ["code"],
  additionalProperties: false,
  properties: {
    code: { type: "string", minLength: 4, maxLength: 32 },
  },
};

/**
 * Parent dashboard (PHASE 18 + 23): link children by their sharing code and view
 * read-only progress + session summaries, plus (PHASE 23) a metadata-only
 * activity timeline per session with safety flags and assessed concepts. Every
 * route is parent-only and every child read is gated by the parent↔child link
 * (isolation is structural). Message content is never exposed — only metadata.
 */
export const parentRoutes: FastifyPluginAsync = async (app) => {
  app.post("/link", { preHandler: requireAuth, schema: { body: linkBodySchema } }, async (request, reply) => {
    const auth = request.auth!;
    if (auth.user.role !== "parent") {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "ربط الأبناء مخصص لحسابات أولياء الأمور" } });
    }
    const { code } = request.body as { code: string };
    const child = await app.parents.link(auth.user.id, code);
    await app.audit.record({ actorUserId: auth.user.id, action: "parent.link", entityType: "student", entityId: child.studentId, ip: request.ip });
    return reply.send({ child });
  });

  app.get("/children", { preHandler: requireAuth }, async (request, reply) => {
    const auth = request.auth!;
    if (auth.user.role !== "parent") {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "لوحة أولياء الأمور مخصصة لحسابات أولياء الأمور" } });
    }
    return { children: await app.parents.listChildren(auth.user.id) };
  });

  app.get("/children/:studentId", { preHandler: requireAuth }, async (request, reply) => {
    const auth = request.auth!;
    if (auth.user.role !== "parent") {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "لوحة أولياء الأمور مخصصة لحسابات أولياء الأمور" } });
    }
    const { studentId } = request.params as { studentId: string };
    return app.parents.childDetail(auth.user.id, studentId);
  });

  // PHASE 23 — privacy-safe session detail: metadata timeline, assessed
  // concepts, safety flags. Content never leaves the server.
  app.get("/children/:studentId/sessions/:sessionId", { preHandler: requireAuth }, async (request, reply) => {
    const auth = request.auth!;
    if (auth.user.role !== "parent") {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "لوحة أولياء الأمور مخصصة لحسابات أولياء الأمور" } });
    }
    const { studentId, sessionId } = request.params as { studentId: string; sessionId: string };
    return app.parents.sessionDetail(auth.user.id, studentId, sessionId);
  });

  app.delete("/children/:studentId", { preHandler: requireAuth }, async (request, reply) => {
    const auth = request.auth!;
    if (auth.user.role !== "parent") {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "لوحة أولياء الأمور مخصصة لحسابات أولياء الأمور" } });
    }
    const { studentId } = request.params as { studentId: string };
    await app.parents.unlink(auth.user.id, studentId);
    await app.audit.record({ actorUserId: auth.user.id, action: "parent.unlink", entityType: "student", entityId: studentId, ip: request.ip });
    return reply.send({ ok: true });
  });
};