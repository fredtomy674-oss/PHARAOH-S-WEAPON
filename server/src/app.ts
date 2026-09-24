import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { Db } from "./db/index.js";
import { config, isProd } from "./config/env.js";
import { AppError } from "./utils/errors.js";
import { containerPlugin } from "./plugins/container.js";
import { authPlugin } from "./plugins/auth.js";
import { authRoutes } from "./modules/auth/routes.js";
import { profileRoutes } from "./modules/profile/routes.js";
import { curriculumRoutes } from "./modules/curriculum/routes.js";
import { sessionsRoutes } from "./modules/sessions/routes.js";
import { progressRoutes } from "./modules/progress/routes.js";
import { adminRoutes } from "./modules/admin/routes.js";
import { parentRoutes } from "./modules/parent/routes.js";
import { subscriptionRoutes } from "./modules/subscription/routes.js";
import { achievementsRoutes } from "./modules/achievements/routes.js";

export interface BuildAppOptions {
  forceProvider?: "mock" | "gemini";
  logger?: boolean;
}

/**
 * Assembles the Fastify app. Order matters: cookie/cors/helmet/rate-limit
 * first (infra), then the container (services), then auth (depends on
 * services), then routes.
 */
export async function buildApp(db: Db, opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: opts.logger ?? { level: isProd ? "info" : "warn" },
    trustProxy: isProd,
    // Document uploads ship as base64 data-URLs inside JSON (up to 10 MB default),
    // so the default 1 MB Fastify body limit would silently reject them.
    bodyLimit: 32 * 1024 * 1024,
    // Ajv does not support all JSON schema formats by default; email is fine.
    ajv: { customOptions: { removeAdditional: "all", coerceTypes: true, useDefaults: true } },
  });

  // --- Infra ---------------------------------------------------------------
  await app.register(cookie);
  await app.register(cors, { origin: config.WEB_ORIGIN, credentials: true });
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Vite HMR in dev uses a websocket on the dev origin.
        connectSrc: ["'self'", "ws:", "http:", "https:"],
      },
    },
  });
  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: "1 minute",
    // Health probes (dev tooling / uptime checks) must never be rate-limited.
    allowList: (request) => request.url === "/api/health",
    // Consistent JSON shape with the rest of the API.
    errorResponseBuilder: () => ({
      error: { code: "RATE_LIMITED", message: "طلبات كثيرة خلال دقيقة — حاول بعد قليل" },
    }),
  });

  // --- Services + security -------------------------------------------------
  await app.register(containerPlugin, { db, forceProvider: opts.forceProvider });
  await app.register(authPlugin, { secure: isProd });

  // --- Error mapping (no stack/DB details leak) ----------------------------
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: {
          code: error.code,
          message: error.expose ? error.message : "حدث خطأ داخلي، حاول مرة أخرى",
        },
      });
    }
    // @fastify/rate-limit throws { statusCode: 429, error: { code, message } } —
    // pass its clear payload through instead of degrading it to INTERNAL.
    const fastifyErr = error as { statusCode?: number; error?: { code?: string; message?: string } };
    if (typeof fastifyErr.statusCode === "number" && fastifyErr.statusCode >= 400 && fastifyErr.statusCode < 500 && fastifyErr.error) {
      return reply.code(fastifyErr.statusCode).send({
        error: {
          code: fastifyErr.error.code ?? "BAD_REQUEST",
          message: fastifyErr.error.message ?? "طلب غير صالح",
        },
      });
    }
    // Fastify validation / unknown errors.
    request.log.error({ err: error }, "unhandled error");
    const statusCode = (error as { statusCode?: number }).statusCode;
    const status = typeof statusCode === "number" && statusCode >= 400 && statusCode < 500 ? statusCode : 500;
    return reply.code(status).send({
      error: {
        code: status === 400 ? "BAD_REQUEST" : "INTERNAL",
        message: status === 400 ? "طلب غير صالح" : "حدث خطأ داخلي، حاول مرة أخرى",
      },
    });
  });

  // --- Routes --------------------------------------------------------------
  await app.register(
    async (api) => {
      api.get("/health", async () => ({
        status: "ok",
        provider: api.ai.providers.llm.id,
        cache: api.ai.cacheStats(),
        time: new Date().toISOString(),
      }));
      await api.register(authRoutes, { prefix: "/auth" });
      await api.register(profileRoutes, { prefix: "/profile" });
      await api.register(curriculumRoutes, { prefix: "/curriculum" });
      await api.register(sessionsRoutes, { prefix: "/sessions" });
      await api.register(progressRoutes, { prefix: "/progress" });
      await api.register(adminRoutes, { prefix: "/admin" });
      await api.register(parentRoutes, { prefix: "/parent" });
      await api.register(subscriptionRoutes, { prefix: "/me" });
      await api.register(achievementsRoutes, { prefix: "/achievements" });
    },
    { prefix: "/api" },
  );

  return app;
}