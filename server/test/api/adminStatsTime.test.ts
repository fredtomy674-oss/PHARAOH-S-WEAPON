import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { csrfHeaders, makeAdmin, makeApp, registerStudent, seedMiniCorpus, type AuthSession, type MiniCorpus, type TestApi } from "../helpers.js";
import { aiUsageLogs, learningSessions, messages } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

let emailSeq = 0;
const nth = (n: number) => `trends-${n}@test.local`;

const DAY_MS = 86_400_000;
/** A fixed instant `days` back from now, kept midday so no bucket straddles a day edge. */
const daysAgo = (days: number): Date => {
  const d = new Date(Date.now() - days * DAY_MS);
  d.setUTCHours(12, 0, 0, 0);
  return d;
};

interface TrendsShape {
  days: number;
  activeDays: number;
  sessionsByDay: Array<{ day: string; count: number }>;
  messagesByDay: Array<{ day: string; count: number }>;
  aiByDay: Array<{ day: string; calls: number; tokens: number; costUsd: number }>;
  topLessons: Array<{ lessonId: string; title: string; sessions: number }>;
  totals: { sessions: number; messages: number; aiCalls: number; aiCostUsd: number };
}

const dayKey = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * PHASE 34 — admin time analytics (D-021 tail: «مؤشرات زمنية (جلسات/يوم)،
 * ترتيب الدروس الأكثر نشاطًا» + D-031 tail: time-partitioned AI usage) on
 * GET /api/admin/stats. Past-day rows are seeded directly so the UTC-day
 * bucketing is deterministic.
 */
describe("admin time analytics (PHASE 34)", () => {
  let api!: TestApi;
  let admin!: AuthSession;
  let student!: AuthSession;
  let corpus!: MiniCorpus;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    admin = await makeAdmin(api.app, api.db);
    student = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);

    const db = api.db.db;
    // 3 sessions on lesson A today + 2 on lesson B today, 1 on lesson A 3 days ago,
    // 1 lessonless session today, 1 session outside the 14-day window.
    const mkSession = (lessonId: string | null, at: Date) => ({
      id: newId("s"),
      studentId: student.studentId!,
      curriculumId: corpus.curriculumId,
      gradeId: corpus.gradeId,
      subjectId: corpus.subjectId,
      lessonId,
      status: "ended" as const,
      startedAt: at,
      endedAt: at,
    });
    await db.insert(learningSessions).values([
      mkSession(corpus.lessonA, daysAgo(0)),
      mkSession(corpus.lessonA, daysAgo(0)),
      mkSession(corpus.lessonA, daysAgo(0)),
      mkSession(corpus.lessonB, daysAgo(0)),
      mkSession(corpus.lessonB, daysAgo(0)),
      mkSession(corpus.lessonA, daysAgo(3)),
      mkSession(null, daysAgo(0)), // lessonless — counts in the trend, not in the ranking
      mkSession(corpus.lessonA, daysAgo(30)), // outside the window
    ]);

    // Messages: 4 today, 2 three days ago, 2 outside the window.
    const sessionA = (
      await db.select({ id: learningSessions.id }).from(learningSessions).where(eq(learningSessions.lessonId, corpus.lessonA)).limit(1)
    )[0]!.id;
    const mkMessage = (at: Date, role: "user" | "tutor") => ({
      id: newId("m"),
      sessionId: sessionA,
      role,
      kind: "text" as const,
      content: "سؤال",
      createdAt: at,
    });
    await db.insert(messages).values([
      mkMessage(daysAgo(0), "user"),
      mkMessage(daysAgo(0), "tutor"),
      mkMessage(daysAgo(0), "user"),
      mkMessage(daysAgo(0), "tutor"),
      mkMessage(daysAgo(3), "user"),
      mkMessage(daysAgo(3), "tutor"),
      mkMessage(daysAgo(30), "user"),
      mkMessage(daysAgo(30), "tutor"),
    ]);

    // AI usage: 2 calls today, 1 call three days ago, 1 outside the window.
    const mkUsage = (at: Date, input: number, output: number, cost: number) => ({
      id: newId("u"),
      operation: "chat",
      provider: "mock",
      model: "mock-chat",
      inputTokens: input,
      outputTokens: output,
      costUsd: cost,
      latencyMs: 10,
      createdAt: at,
    });
    await db.insert(aiUsageLogs).values([
      mkUsage(daysAgo(0), 100, 50, 0.001),
      mkUsage(daysAgo(0), 20, 10, 0.0002),
      mkUsage(daysAgo(3), 7, 3, 0.5),
      mkUsage(daysAgo(30), 999, 999, 9),
    ]);
  });

  const getTrends = async (): Promise<TrendsShape> => {
    const res = await api.app.inject({ method: "GET", url: "/api/admin/stats", headers: csrfHeaders(admin) });
    expect(res.statusCode).toBe(200);
    return (res.json() as { stats: { trends: TrendsShape } }).stats.trends;
  };

  it("refuses students (403 FORBIDDEN) — trends stay admin-only", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/admin/stats", headers: csrfHeaders(student) });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("FORBIDDEN");
  });

  it("buckets sessions by UTC day and ignores rows outside the 14-day window", async () => {
    const trends = await getTrends();
    expect(trends.days).toBe(14);
    expect(trends.sessionsByDay).toHaveLength(14);

    const countOn = (back: number): number => trends.sessionsByDay.find((d) => d.day === dayKey(daysAgo(back)))!.count;
    expect(countOn(0)).toBe(6); // 5 lesson sessions + 1 lessonless
    expect(countOn(3)).toBe(1);
    expect(countOn(1)).toBe(0);
    expect(trends.sessionsByDay.reduce((a, d) => a + d.count, 0)).toBe(7); // the 30-day-old row is excluded
  });

  it("counts the day with activity", async () => {
    const trends = await getTrends();
    expect(trends.activeDays).toBe(2);
  });

  it("buckets messages by UTC day", async () => {
    const trends = await getTrends();
    const countOn = (back: number): number => trends.messagesByDay.find((d) => d.day === dayKey(daysAgo(back)))!.count;
    expect(countOn(0)).toBe(4);
    expect(countOn(3)).toBe(2);
    expect(trends.messagesByDay.reduce((a, d) => a + d.count, 0)).toBe(6);
  });

  it("partitions AI usage per day (calls, tokens, cost) — D-031 tail", async () => {
    const trends = await getTrends();
    const on = (back: number) => trends.aiByDay.find((d) => d.day === dayKey(daysAgo(back)))!;
    expect(on(0).calls).toBe(2);
    expect(on(0).tokens).toBe(180);
    expect(on(0).costUsd).toBe(0.0012);
    expect(on(3).calls).toBe(1);
    expect(on(3).costUsd).toBe(0.5);
    expect(trends.aiByDay.reduce((a, d) => a + d.calls, 0)).toBe(3);
  });

  it("ranks the most-active lessons inside the window and excludes lessonless sessions", async () => {
    const trends = await getTrends();
    expect(trends.topLessons).toEqual([
      // 3 today + 1 three days ago — the 30-day-old session is outside the window.
      { lessonId: corpus.lessonA, title: "الجمع ضمن الأعداد حتى 999", sessions: 4 },
      { lessonId: corpus.lessonB, title: "الكسور الاعتيادية", sessions: 2 },
    ]);
  });

  it("reports window totals for the card headline", async () => {
    const trends = await getTrends();
    expect(trends.totals.sessions).toBe(7);
    expect(trends.totals.messages).toBe(6);
    expect(trends.totals.aiCalls).toBe(3);
    expect(trends.totals.aiCostUsd).toBe(0.5012);
  });
});
