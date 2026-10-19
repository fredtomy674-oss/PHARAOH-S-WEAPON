import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { grades } from "../../db/schema.js";
import { requireAuth } from "../../plugins/auth.js";

/**
 * PHASE 179 — «صفّك وحدك»: the student's grade travels with the session user,
 * so every screen can say what it is measuring («مواد صفك»، «خطة صفك»).
 * Resolved only on auth responses (login/register/me) — never per request.
 */
async function gradeNameFor(db: Db, authUser: { student?: { gradeId: string | null } | undefined }): Promise<string | null> {
  const gradeId = authUser.student?.gradeId;
  if (!gradeId) return null;
  const grade = await db.db.select({ nameAr: grades.nameAr }).from(grades).where(eq(grades.id, gradeId)).get();
  return grade?.nameAr ?? null;
}

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
    return reply.code(201).send({ user: publicUser(user, await gradeNameFor(app.db, user)), csrfToken: session.csrfToken });
  });

  app.post("/login", { schema: { body: jsonLogin } }, async (request, reply) => {
    const body = request.body as { email: string; password: string };
    const { user, session } = await app.authService.login(body);
    app.setSessionCookie(reply, session.token, session.expiresAt.getTime() - Date.now());
    await app.audit.record({ actorUserId: user.user.id, action: "auth.login", entityType: "user", entityId: user.user.id, ip: request.ip });
    return { user: publicUser(user, await gradeNameFor(app.db, user)), csrfToken: session.csrfToken };
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
    const authUser = request.auth!;
    return { user: publicUser(authUser, await gradeNameFor(app.db, authUser)) };
  });
};

export function publicUser(authUser: { user: { id: string; email: string; role: string; createdAt: Date }; student?: { id: string; displayName: string; gradeId: string | null; parentLinkCode: string | null } | undefined }, gradeNameAr: string | null = null) {
  return {
    id: authUser.user.id,
    email: authUser.user.email,
    role: authUser.user.role,
    createdAt: authUser.user.createdAt,
    student: authUser.student
      ? { id: authUser.student.id, displayName: authUser.student.displayName, gradeId: authUser.student.gradeId ?? null }
      : undefined,
    // PHASE 179 — the grade's human name for «مواد صفك» / «خطة صفك» (null when
    // the profile has no grade yet, e.g. a brand-new student before onboarding).
    gradeNameAr,
    // PHASE 18: the student's parent-linking code (null until it exists).
    linkCode: authUser.student?.parentLinkCode ?? null,
  };
}