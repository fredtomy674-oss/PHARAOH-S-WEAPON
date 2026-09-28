import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrations, createDb, type Db } from "../../src/db/index.js";
import { buildApp } from "../../src/app.js";
import { Errors } from "../../src/utils/errors.js";
import type { FastifyInstance } from "fastify";

/**
 * PHASE 42 — the error contract the moment a real provider is in the loop.
 *
 * Two failures that used to look identical from the outside: a hidden
 * `Errors.internal` (the client got a generic message and the operator got no
 * log line at all) and a busy upstream (the client got the same generic
 * message, so a student could not tell "try again" from "broken"). These cases
 * pin both halves: the student gets something actionable and safe, and the
 * server keeps the real reason — the leak guard is the point of the exercise.
 */
describe("error mapping for a real provider (a real provider can fail) — PHASE 42", () => {
  let db!: Db;
  let app!: FastifyInstance;

  beforeAll(async () => {
    db = createDb();
    applyMigrations(db);
    app = await buildApp(db, { logger: false });
    app.get("/__probe/busy", async () => {
      throw Errors.serviceUnavailable("المعلّم غير متاح الآن بسبب ضغط على الخدمة، حاول بعد لحظات", "AI_UPSTREAM_BUSY", {
        upstreamStatus: 429,
        model: "gemini-3.1-flash-lite-preview",
        upstreamDetail: "You exceeded your current quota, plan gemini-3.1-flash-lite-preview",
      });
    });
    app.get("/__probe/hidden", async () => {
      throw Errors.internal("فشل الاتصال بقاعدة البيانات: sqlite alfarouq.sqlite");
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("tells the student the tutor is busy and how to proceed", async () => {
    const res = await app.inject({ method: "GET", url: "/__probe/busy" });
    expect(res.statusCode).toBe(503);
    const body = res.json() as { error: { code: string; message: string } };
    expect(body.error.code).toBe("AI_UPSTREAM_BUSY");
    expect(body.error.message).toContain("حاول بعد لحظات");
  });

  it("never ships the upstream status, model name or quota text to the client", async () => {
    const res = await app.inject({ method: "GET", url: "/__probe/busy" });
    const raw = res.body;
    expect(raw).not.toContain("429");
    expect(raw).not.toContain("gemini-3.1-flash-lite-preview");
    expect(raw).not.toContain("quota");
    expect(raw).not.toContain("upstreamDetail");
  });

  it("keeps an internal failure generic (no path, no driver, no SQL)", async () => {
    const res = await app.inject({ method: "GET", url: "/__probe/hidden" });
    expect(res.statusCode).toBe(500);
    const body = res.json() as { error: { code: string; message: string } };
    expect(body.error.code).toBe("INTERNAL");
    expect(body.error.message).toBe("حدث خطأ داخلي، حاول مرة أخرى");
    expect(res.body).not.toContain("sqlite");
  });
});
