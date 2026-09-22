import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../plugins/auth.js";

const startBodySchema = {
  type: "object",
  required: ["curriculumId", "gradeId", "subjectId"],
  additionalProperties: false,
  properties: {
    curriculumId: { type: "string", maxLength: 64 },
    gradeId: { type: "string", maxLength: 64 },
    subjectId: { type: "string", maxLength: 64 },
    lessonId: { type: "string", maxLength: 64 },
  },
};

const messageBodySchema = {
  type: "object",
  required: ["content"],
  additionalProperties: false,
  properties: {
    content: { type: "string", minLength: 1, maxLength: 4000 },
  },
};

/**
 * Learning sessions: the vertical slice. Start a session on a lesson, then
 * chat with the tutor; ownership is enforced server-side on every call.
 */
export const sessionsRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", { preHandler: requireAuth, schema: { body: startBodySchema } }, async (request, reply) => {
    const auth = request.auth!;
    const body = request.body as { curriculumId: string; gradeId: string; subjectId: string; lessonId?: string };
    if (auth.user.role !== "student" || !auth.student) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "الجلسات مخصصة لحسابات الطلاب" } });
    }
    const session = await app.sessions.start({
      studentId: auth.student.id,
      curriculumId: body.curriculumId,
      gradeId: body.gradeId,
      subjectId: body.subjectId,
      lessonId: body.lessonId,
    });
    return reply.code(201).send({ session });
  });

  app.get("/", { preHandler: requireAuth }, async (request) => {
    const auth = request.auth!;
    if (!auth.student) {
      return { sessions: [] };
    }
    return { sessions: await app.sessions.list(auth.student.id) };
  });

  app.get("/:sessionId", { preHandler: requireAuth }, async (request) => {
    const auth = request.auth!;
    if (!auth.student) {
      return { session: null, messages: [] };
    }
    const { sessionId } = request.params as { sessionId: string };
    return app.sessions.getWithMessages(sessionId, auth.student.id);
  });

  app.post("/:sessionId/messages", { preHandler: requireAuth, schema: { body: messageBodySchema } }, async (request, reply) => {
    const auth = request.auth!;
    if (!auth.student) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "الجلسات مخصصة لحسابات الطلاب" } });
    }
    const { sessionId } = request.params as { sessionId: string };
    const body = request.body as { content: string };
    const result = await app.sessions.sendMessage({
      sessionId,
      studentId: auth.student.id,
      content: body.content,
    });
    return reply.send(result);
  });

  app.post("/:sessionId/end", { preHandler: requireAuth }, async (request, reply) => {
    const auth = request.auth!;
    if (!auth.student) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "الجلسات مخصصة لحسابات الطلاب" } });
    }
    const { sessionId } = request.params as { sessionId: string };
    await app.sessions.end(sessionId, auth.student.id, "user_request");
    return reply.send({ ok: true });
  });
};