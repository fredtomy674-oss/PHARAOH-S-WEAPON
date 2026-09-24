import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { auditLogs } from "../../src/db/schema.js";
import { csrfHeaders, headers, makeAdmin, makeApp, registerParent, registerStudent, type AuthSession, type TestApi } from "../helpers.js";

const nth = (n: number) => `sub-api-${n}@test.local`;

/**
 * PHASE 20 — Subscriptions API (billing without a payment gateway). Students
 * read their own plan (`GET /api/me/subscription`, lazily created as free);
 * admins manage plans (`GET/PUT /api/admin/subscriptions*`) with full audit
 * trails; premium maps to the premium daily budget (0 = unlimited by default)
 * unless the tier is past_due/cancelled/expired.
 */
describe("subscriptions API (PHASE 20 — billing without a payment gateway)", () => {
  let api!: TestApi;
  let admin!: AuthSession;
  let student!: AuthSession;
  let parent!: AuthSession;

  beforeAll(async () => {
    api = await makeApp();
    admin = await makeAdmin(api.app, api.db);
    student = await registerStudent(api.app, nth(1));
    parent = await registerParent(api.app, nth(2));
  });

  afterAll(async () => {
    api.app.close();
  });

  it("a student reads their own lazily-created free subscription", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/me/subscription", headers: headers(student) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.plan).toBe("free");
    expect(body.status).toBe("trialing");
    expect(body.dailyLimit).toBeGreaterThan(0);
    expect(body.startedAt).toBeTruthy();
  });

  it("parents and admins cannot read a student subscription (403)", async () => {
    const parentRes = await api.app.inject({ method: "GET", url: "/api/me/subscription", headers: csrfHeaders(parent) });
    expect(parentRes.statusCode).toBe(403);
    const adminRes = await api.app.inject({ method: "GET", url: "/api/me/subscription", headers: csrfHeaders(admin) });
    expect(adminRes.statusCode).toBe(403);
  });

  it("the admin list shows the student once its row exists", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/admin/subscriptions", headers: csrfHeaders(admin) });
    expect(res.statusCode).toBe(200);
    const items = res.json().subscriptions as Array<{ studentId: string; plan: string; status: string; studentEmail: string }>;
    expect(items.some((s) => s.studentId === student.studentId && s.plan === "free" && s.studentEmail === nth(1))).toBe(true);
  });

  it("admin grants premium → student sees premium + unlimited budget, audit recorded", async () => {
    const res = await api.app.inject({
      method: "PUT",
      url: `/api/admin/subscriptions/students/${student.studentId}`,
      headers: csrfHeaders(admin),
      payload: { plan: "premium", status: "active" },
    });
    expect(res.statusCode).toBe(200);
    const sub = res.json().subscription;
    expect(sub.plan).toBe("premium");
    expect(sub.status).toBe("active");
    expect(sub.dailyLimit).toBe(0); // PREMIUM_DAILY_MESSAGE_LIMIT default 0 → unlimited

    const mine = await api.app.inject({ method: "GET", url: "/api/me/subscription", headers: headers(student) });
    expect(mine.json().plan).toBe("premium");
    expect(mine.json().dailyLimit).toBe(0);

    const audit = await api.db.db.select().from(auditLogs).where(eq(auditLogs.action, "subscription.update")).get();
    expect(audit).toBeTruthy();
    expect(JSON.parse(audit!.afterJson!)).toMatchObject({ plan: "premium", status: "active" });
  });

  it("admin cannot grant to an unknown student (404)", async () => {
    const res = await api.app.inject({
      method: "PUT",
      url: "/api/admin/subscriptions/students/student_missing",
      headers: csrfHeaders(admin),
      payload: { plan: "premium" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("a student cannot grant themselves a plan (403)", async () => {
    const res = await api.app.inject({
      method: "PUT",
      url: `/api/admin/subscriptions/students/${student.studentId}`,
      headers: csrfHeaders(student),
      payload: { plan: "free" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("an expired premium tier stays declared but runs on the free budget", async () => {
    const res = await api.app.inject({
      method: "PUT",
      url: `/api/admin/subscriptions/students/${student.studentId}`,
      headers: csrfHeaders(admin),
      payload: { plan: "premium", status: "active", expiresAt: "2020-01-01T00:00:00.000Z" },
    });
    expect(res.statusCode).toBe(200);
    const mine = await api.app.inject({ method: "GET", url: "/api/me/subscription", headers: headers(student) });
    const body = mine.json();
    expect(body.plan).toBe("premium"); // what was granted…
    expect(body.dailyLimit).toBe(50); // …and the free budget it really costs today
  });
});