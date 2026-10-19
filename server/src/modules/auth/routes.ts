import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../plugins/auth.js";
import { publicUserFor } from "./present.js";

/** Fastify Ajv JSON schemas (the API contract; zod is used inside services). */
const jsonRegister = {
  type: "object",
  required: ["email", "password", "displayName"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email", maxLength: 200 },
    password: { type: "string", minLength: 8, maxLength: 128 },
    displayName: { type: "string", minLength: 2, maxLength: 80 },
    gradeId: { type: "string", maxLength: 64 },
    // PHASE 18: parents register with role "parent"; students are the default.
    role: { type: "string", enum: ["student", "parent"] },
  },
};

const jsonLogin = {
  type: "object",
  required: ["email", "password"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email", maxLength: 200 },
    password: { type: "string", minLength: 1, maxLength: 128 },
  },
};

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", { schema: { body: jsonRegister } }, async (request, reply) => {
    const body = request.body as { email: string; password: string; displayName: string; gradeId?: string; role?: "student" | "parent" };
    const { user, session } = await app.authService.register(body);
    app.setSessionCookie(reply, session.token, session.expiresAt.getTime() - Date.now());
    await app.audit.record({ actorUserId: user.user.id, action: "auth.register", entityType: "user", entityId: user.user.id, ip: request.ip });
    return reply.code(201).send({ user: await publicUserFor(app.db, user), csrfToken: session.csrfToken });
  });

  app.post("/login", { schema: { body: jsonLogin } }, async (request, reply) => {
    const body = request.body as { email: string; password: string };
    const { user, session } = await app.authService.login(body);
    app.setSessionCookie(reply, session.token, session.expiresAt.getTime() - Date.now());
    await app.audit.record({ actorUserId: user.user.id, action: "auth.login", entityType: "user", entityId: user.user.id, ip: request.ip });
    return { user: await publicUserFor(app.db, user), csrfToken: session.csrfToken };
  });

  app.post("/logout", { preHandler: requireAuth }, async (request, reply) => {
    if (request.authSessionId) {
      await app.authService.logout(request.authSessionId);
      await app.audit.record({ actorUserId: request.actorUserId, action: "auth.logout", entityType: "session", entityId: request.authSessionId, ip: request.ip });
    }
    app.clearSessionCookie(reply);
    return { ok: true };
  });

  app.get("/me", { preHandler: requireAuth }, async (request) => {
    return { user: await publicUserFor(app.db, request.auth!) };
  });
};
