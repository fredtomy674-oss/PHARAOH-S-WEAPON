import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { csrfHeaders, headers, makeApp, registerParent, registerStudent, seedMiniCorpus, type AuthSession, type MiniCorpus, type TestApi } from "../helpers.js";

/** 1x1 transparent PNG (≈120 bytes base64, under the 1 KB test cap). */
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const fixturesDir = new URL("../../../e2e/fixtures/", import.meta.url);
const questionPdfDataUrl = (): string => {
  const bytes = readFileSync(fileURLToPath(new URL("question.pdf", fixturesDir)));
  return `data:application/pdf;base64,${bytes.toString("base64")}`;
};

const nth = (n: number) => `ach-api-${n}@test.local`;

/**
 * PHASE 20 — Achievements API. Lifecycle events inside real sessions award
 * badges (session end → أول خطوة, image attach → مصوّر الأسئلة, PDF attach →
 * قارئ نهم); the list endpoint shows earned + locked; parents are rejected.
 */
describe("achievements API (PHASE 20 — gamification)", () => {
  let api!: TestApi;
  let s!: AuthSession;
  let other!: AuthSession;
  let corpus!: MiniCorpus;
  let sessionId!: string;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    s = await registerStudent(api.app, nth(1));
    other = await registerStudent(api.app, nth(2));
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(s),
      payload: { curriculumId: corpus.curriculumId, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId: corpus.lessonA },
    });
    expect(start.statusCode).toBe(201);
    sessionId = start.json().session.id as string;
  });

  afterAll(async () => {
    api.app.close();
  });

  it("starts with 0 earned out of 8 total (all locked)", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/achievements/me", headers: headers(s) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(8); // 6 PHASE 20 + practice_starter + mastery_first (PHASE 26)
    expect(body.earned).toBe(0);
    expect(body.achievements.every((a: { awardedAt: string | null }) => a.awardedAt === null)).toBe(true);
  });

  it("attaching a photo to a turn earns مصوّر الأسئلة", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "حل السؤال في الصورة", image: { dataUrl: TINY_PNG, fileName: "q.png" } },
    });
    expect(res.statusCode).toBe(200);
    const mine = await api.app.inject({ method: "GET", url: "/api/achievements/me", headers: headers(s) });
    const photographer = mine.json().achievements.find((a: { code: string }) => a.code === "photographer");
    expect(photographer.awardedAt).toBeTruthy();
  });

  it("attaching a PDF to a turn earns قارئ نهم", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "اقرأ الملف المرفق", document: { dataUrl: questionPdfDataUrl(), fileName: "q.pdf" } },
    });
    expect(res.statusCode).toBe(200);
    const mine = await api.app.inject({ method: "GET", url: "/api/achievements/me", headers: headers(s) });
    const bookworm = mine.json().achievements.find((a: { code: string }) => a.code === "bookworm");
    expect(bookworm.awardedAt).toBeTruthy();
  });

  it("ending the session earns أول خطوة (3 badges total now)", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/end`,
      headers: csrfHeaders(s),
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    const mine = await api.app.inject({ method: "GET", url: "/api/achievements/me", headers: headers(s) });
    const body = mine.json();
    expect(body.earned).toBe(3);
    expect(body.achievements.find((a: { code: string }) => a.code === "first_steps").awardedAt).toBeTruthy();
  });

  it("a parent cannot read student achievements (403)", async () => {
    const parent = await registerParent(api.app, nth(3));
    const res = await api.app.inject({ method: "GET", url: "/api/achievements/me", headers: csrfHeaders(parent) });
    expect(res.statusCode).toBe(403);
  });

  it("isolates achievements: another student still shows 0 earned", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/achievements/me", headers: headers(other) });
    expect(res.json().earned).toBe(0);
  });
});