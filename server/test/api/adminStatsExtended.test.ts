import { beforeAll, describe, expect, it } from "vitest";
import {
  csrfHeaders,
  makeAdmin,
  makeApp,
  registerStudent,
  seedMiniCorpus,
  type AuthSession,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";

let emailSeq = 0;
const nth = (n: number) => `stats-ext-${n}@test.local`;

interface StatsShape {
  subscriptions: { total: number; free: number; premium: number; active: number; conversionRate: number };
  ai: {
    calls: number;
    byOperation: Record<string, number>;
    tokens: number;
    costUsd: number;
    cache: { hits: number; misses: number; hitRate: number; size: number; maxEntries: number };
    estimatedSavingsTokens: number;
    estimatedSavingsUsd: number;
  };
}

const getStats = async (api: TestApi, admin: AuthSession): Promise<StatsShape> => {
  const res = await api.app.inject({ method: "GET", url: "/api/admin/stats", headers: csrfHeaders(admin) });
  expect(res.statusCode).toBe(200);
  return (res.json() as { stats: StatsShape }).stats;
};

const startSession = async (api: TestApi, student: AuthSession, corpus: MiniCorpus): Promise<string> => {
  const start = await api.app.inject({
    method: "POST",
    url: "/api/sessions",
    headers: csrfHeaders(student),
    payload: { curriculumId: corpus.curriculumId, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId: corpus.lessonA },
  });
  expect(start.statusCode).toBe(201);
  return (start.json() as { session: { id: string } }).session.id;
};

const sendTurn = async (api: TestApi, sessionId: string, student: AuthSession, content: string): Promise<void> => {
  const turn = await api.app.inject({
    method: "POST",
    url: `/api/sessions/${sessionId}/messages`,
    headers: csrfHeaders(student),
    payload: { content },
  });
  expect(turn.statusCode).toBe(200);
};

/**
 * PHASE 27 (D-031) — /api/admin/stats extension: the subscription funnel
 * (stored tiers + effective premium, D-024) and the AI usage/cache-savings
 * section (D-026). Pure aggregations, admin-only, no message content.
 */
describe("admin analytics extension (GET /api/admin/stats) — PHASE 27", () => {
  let api!: TestApi;
  let admin!: AuthSession;
  let studentA!: AuthSession;
  let studentB!: AuthSession;
  let corpus!: MiniCorpus;
  let sessionId!: string;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    admin = await makeAdmin(api.app, api.db);
    studentA = await registerStudent(api.app, nth(++emailSeq));
    studentB = await registerStudent(api.app, nth(++emailSeq));
  });

  it("reports the subscription funnel from stored tiers + effective premium", async () => {
    // Force the lazy subscription rows for both students, then upgrade B to an
    // active premium plan with no expiry.
    await api.app.inject({ method: "GET", url: "/api/me/subscription", headers: csrfHeaders(studentA) });
    await api.app.inject({ method: "GET", url: "/api/me/subscription", headers: csrfHeaders(studentB) });
    const up = await api.app.inject({
      method: "PUT",
      url: `/api/admin/subscriptions/students/${studentB.studentId}`,
      headers: csrfHeaders(admin),
      payload: { plan: "premium", status: "active" },
    });
    expect(up.statusCode).toBe(200);

    const stats = await getStats(api, admin);
    expect(stats.subscriptions).toEqual({ total: 2, free: 1, premium: 1, active: 1, conversionRate: 50 });
  });

  it("degrades effective premium when the status is past_due (funnel still shows stored tier)", async () => {
    await api.app.inject({
      method: "PUT",
      url: `/api/admin/subscriptions/students/${studentB.studentId}`,
      headers: csrfHeaders(admin),
      payload: { plan: "premium", status: "past_due" },
    });
    const stats = await getStats(api, admin);
    expect(stats.subscriptions.total).toBe(2);
    expect(stats.subscriptions.premium).toBe(1);
    expect(stats.subscriptions.active).toBe(0);
    expect(stats.subscriptions.conversionRate).toBe(0);

    // Restore an active plan so the funnel stays representative for the file.
    await api.app.inject({
      method: "PUT",
      url: `/api/admin/subscriptions/students/${studentB.studentId}`,
      headers: csrfHeaders(admin),
      payload: { plan: "premium", status: "active" },
    });
  });

  it("tracks AI usage counters (calls, tokens, cost, operation breakdown)", async () => {
    sessionId = await startSession(api, studentA, corpus);
    // Two tutor turns record a usage row each. Embedding calls never log a row
    // (they populate the cache), so the breakdown reflects tutor only here.
    await sendTurn(api, sessionId, studentA, "اشرح لي عملية الجمع مع الاستلاف بمثال");
    await sendTurn(api, sessionId, studentA, "ما ناتج جمع 487 و 358؟");

    const stats = await getStats(api, admin);
    expect(stats.ai.calls).toBeGreaterThanOrEqual(2);
    expect(stats.ai.tokens).toBeGreaterThan(0);
    expect(stats.ai.costUsd).toBe(0); // mock provider pricing is zero
    expect(stats.ai.byOperation.tutor ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("reports cache hits with estimated token savings from repeated deterministic calls", async () => {
    // Repeating an IDENTICAL turn hits the embedding cache (the same question
    // text embeds to the same vector) while the dynamic tutor call still
    // records a (missed) usage row.
    await sendTurn(api, sessionId, studentA, "ما ناتج جمع 487 و 358؟");

    const stats = await getStats(api, admin);
    expect(stats.ai.cache.misses).toBeGreaterThan(0);
    expect(stats.ai.cache.hits).toBeGreaterThan(0);
    expect(stats.ai.cache.hitRate).toBeGreaterThan(0);
    expect(stats.ai.cache.hitRate).toBeLessThanOrEqual(100);
    expect(stats.ai.cache.size).toBeGreaterThanOrEqual(0);
    expect(stats.ai.cache.maxEntries).toBeGreaterThan(0);
    // Savings scale with hits; with the zero-priced mock the USD estimate is 0.
    expect(stats.ai.estimatedSavingsTokens).toBeGreaterThan(0);
    expect(stats.ai.estimatedSavingsUsd).toBe(0);
  });
});