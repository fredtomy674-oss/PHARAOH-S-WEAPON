import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeApp, registerStudent, type AuthSession, type TestApi } from "../helpers.js";

/**
 * PHASE 20 — SubscriptionService unit coverage. The `subscriptions` table was
 * schema-ready since PHASE 2; this service turns it into real semantics:
 * lazy free row, plan→limit mapping (0 = unlimited for premium), and the
 * effective-plan degradation rules (past_due/cancelled/expired → free budget).
 */
describe("SubscriptionService (PHASE 20 — plans & limits)", () => {
  let api!: TestApi;
  let student!: AuthSession;

  beforeAll(async () => {
    api = await makeApp();
    student = await registerStudent(api.app, "sub-unit@test.local");
  });

  afterAll(async () => {
    api.app.close();
  });

  it("lazily ensures a free/trialing subscription row and is idempotent", async () => {
    const summary = await api.app.subscriptions.summaryForStudent(student.studentId!);
    expect(summary.plan).toBe("free");
    expect(summary.status).toBe("trialing");
    expect(summary.dailyLimit).toBeGreaterThan(0);
    // Second read returns the same (now existing) row — no duplicates.
    const again = await api.app.subscriptions.summaryForStudent(student.studentId!);
    expect(again.plan).toBe("free");
    expect(again.startedAt).toBe(summary.startedAt);
  });

  it("maps the free plan to the base daily limit", async () => {
    // Vitest env does not override DAILY_MESSAGE_LIMIT → the default 50 applies.
    expect(await api.app.subscriptions.dailyLimitFor(student.studentId!)).toBe(50);
  });

  it("an active premium plan gets the premium budget (0 = unlimited by default)", async () => {
    await api.app.subscriptions.setPlan(student.studentId!, { plan: "premium" });
    const summary = await api.app.subscriptions.summaryForStudent(student.studentId!);
    expect(summary.plan).toBe("premium");
    expect(summary.status).toBe("active");
    expect(summary.dailyLimit).toBe(0); // PREMIUM_DAILY_MESSAGE_LIMIT default 0
  });

  it("past_due / cancelled degrade to the free budget", async () => {
    await api.app.subscriptions.setPlan(student.studentId!, { plan: "premium", status: "past_due" });
    expect(await api.app.subscriptions.dailyLimitFor(student.studentId!)).toBe(50);
    await api.app.subscriptions.setPlan(student.studentId!, { plan: "premium", status: "cancelled" });
    expect(await api.app.subscriptions.dailyLimitFor(student.studentId!)).toBe(50);
  });

  it("an expired premium keeps its declared tier but runs on the free budget", async () => {
    await api.app.subscriptions.setPlan(student.studentId!, { plan: "premium", status: "active", expiresAt: "2020-01-01T00:00:00.000Z" });
    const summary = await api.app.subscriptions.summaryForStudent(student.studentId!);
    expect(summary.plan).toBe("premium"); // what the admin granted…
    expect(summary.dailyLimit).toBe(50); // …and what it actually costs the student
  });
});