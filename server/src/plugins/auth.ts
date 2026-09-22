import type { FastifyPluginAsync, FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { safeEqual } from "../modules/auth/service.js";

const COOKIE_NAME = "alfarouq_session";

declare module "fastify" {
  interface FastifyRequest {
    /** Populated by the auth hook when a valid session cookie is present. */
    auth?: import("../modules/auth/service.js").AuthUser;
    authSessionId?: string;
    csrfToken?: string;
    actorUserId?: string | null;
  }
}

export interface AuthPluginOptions {
  cookieName?: string;
  secure?: boolean;
  cookieDomain?: string;
}

/**
 * Auth plugin: sets up cookie parsing, a request hook that resolves the session
 * cookie into auth context, and a `requireAuth` preHandler + CSRF gate.
 */
export const authPlugin: FastifyPluginAsync<AuthPluginOptions> = fp(async (app: FastifyInstance, opts: AuthPluginOptions) => {
  const cookieName = opts.cookieName ?? COOKIE_NAME;
  const secure = opts.secure ?? process.env.NODE_ENV === "production";

  const authService = app.authService;

  app.addHook("onRequest", async (request) => {
    const raw = request.cookies?.[cookieName];
    if (!raw) return;
    const result = await authService.validateToken(raw);
    if (!result) {
      // Clear an invalid cookie when replying (best-effort).
      request.auth = undefined;
      return;
    }
    const authUser = await authService.buildAuthUser(result.userId);
    request.auth = authUser;
    request.authSessionId = result.sessionId;
    request.csrfToken = result.csrfToken;
    request.actorUserId = result.userId;
  });

  /** Attach helpers used by routes. */
  app.decorate("setSessionCookie", (reply: FastifyReply, token: string, maxAgeMs: number) => {
    void reply.setCookie(cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: Math.floor(maxAgeMs / 1000),
    });
  });

  app.decorate("clearSessionCookie", (reply: FastifyReply) => {
    void reply.clearCookie(cookieName, { path: "/" });
  });
});

/** PreHandler: rejects unauthenticated requests. */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.auth || !request.authSessionId || !request.csrfToken) {
    await reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "يجب تسجيل الدخول" } });
    return;
  }
  // CSRF gate on state-changing methods.
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const header = request.headers["x-csrf-token"];
    if (typeof header !== "string" || !safeEqual(header, request.csrfToken)) {
      await reply.code(403).send({ error: { code: "CSRF_INVALID", message: "رمز التحقق غير صالح" } });
    }
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await requireAuth(request, reply);
  if (reply.sent) return;
  if (request.auth?.user.role !== "admin") {
    await reply.code(403).send({ error: { code: "FORBIDDEN", message: "لا تملك صلاحية لهذا الإجراء" } });
  }
}

export { COOKIE_NAME };