import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
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
import { concepts, lessons, questions } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

let emailSeq = 0;
const nth = (n: number) => `aqg-${n}@test.local`;

interface GenResultRow {
  conceptId: string;
  title: string;
  status: "generated" | "skipped" | "failed";
  error?: string;
}

/**
 * PHASE 28 — admin bulk question generation: one MCQ per eligible concept in
 * a curriculum/lesson/concept scope, grounded in the lesson chunks. Idempotent
 * (re-runs skip covered concepts), metadata-only responses (no question data
 * leaves the server), and lessons without content are reported as failed.
 */
describe("admin question generation (POST /api/admin/questions/generate) — PHASE 28", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let admin!: AuthSession;
  let student!: AuthSession;
  let conceptD!: string; // lesson B, no questions — curriculum-scope target
  let conceptD2!: string; // lesson A, no questions — lesson-scope target
  let chunklessLesson!: string; // lesson with no chunks — failure target

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    admin = await makeAdmin(api.app, api.db);
    student = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);

    const lessonB = (await api.db.db.select().from(lessons).where(eq(lessons.code, "l-b")).get())!;
    conceptD = newId("con");
    await api.db.db.insert(concepts).values({
      id: conceptD,
      lessonId: lessonB.id,
      code: "c-b2",
      title: "تبسيط الكسور",
      description: "مفهوم بلا أسئلة",
    });
    const lessonA = (await api.db.db.select().from(lessons).where(eq(lessons.code, "l-a")).get())!;
    conceptD2 = newId("con");
    await api.db.db.insert(concepts).values({
      id: conceptD2,
      lessonId: lessonA.id,
      code: "c-a3",
      title: "تقدير نواتج الجمع",
      description: "مفهوم بلا أسئلة",
    });

    chunklessLesson = newId("l");
    await api.db.db.insert(lessons).values({
      id: chunklessLesson,
      unitId: corpus.unitId,
      code: "l-empty",
      title: "درس بلا محتوى",
      sortOrder: 3,
    });
    const conceptE = newId("con");
    await api.db.db.insert(concepts).values({
      id: conceptE,
      lessonId: chunklessLesson,
      code: "c-e1",
      title: "مفهوم بلا محتوى",
      description: "لا يملك مقاطع معرفية",
    });
  });

  it("rejects non-admins (students get 403)", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/admin/questions/generate",
      headers: csrfHeaders(student),
      payload: { curriculumId: corpus.curriculumId },
    });
    expect(res.statusCode).toBe(403);
  });

  it("requires exactly one scope dimension", async () => {
    const none = await api.app.inject({
      method: "POST",
      url: "/api/admin/questions/generate",
      headers: csrfHeaders(admin),
      payload: {},
    });
    expect(none.statusCode).toBe(400);
    const many = await api.app.inject({
      method: "POST",
      url: "/api/admin/questions/generate",
      headers: csrfHeaders(admin),
      payload: { curriculumId: corpus.curriculumId, lessonId: corpus.lessonA },
    });
    expect(many.statusCode).toBe(400);
  });

  it("generates one grounded MCQ per eligible concept in a lesson scope", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/admin/questions/generate",
      headers: csrfHeaders(admin),
      payload: { lessonId: corpus.lessonA },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { result: { generated: number; skipped: number; failed: number; items: GenResultRow[] } };
    expect(body.result.generated).toBe(1); // conceptD2 only
    expect(body.result.skipped).toBe(2); // conceptA + conceptC already covered
    expect(body.result.failed).toBe(0);
    const item = body.result.items.find((i) => i.conceptId === conceptD2);
    expect(item?.status).toBe("generated");
    // No question content in the response — metadata only.
    expect(res.body).not.toContain("options");
    const row = (await api.db.db.select().from(questions).where(eq(questions.conceptId, conceptD2)).get())!;
    expect(row.type).toBe("mcq");
    expect(row.difficulty).toBe("easy");
    expect(row.curriculumId).toBe(corpus.curriculumId);
    const parsed = JSON.parse(row.optionsJson!) as { options: string[]; correctIndex: number };
    expect(parsed.options.length).toBe(4);
    expect(parsed.correctIndex).toBeGreaterThanOrEqual(0);
    expect(parsed.correctIndex).toBeLessThan(4);
  });

  it("covers the rest of the curriculum in a curriculum scope", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/admin/questions/generate",
      headers: csrfHeaders(admin),
      payload: { curriculumId: corpus.curriculumId },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { result: { generated: number; skipped: number; failed: number; items: GenResultRow[] } };
    // conceptD (lesson B) remains; A/B/C/D2 are already covered.
    expect(body.result.generated).toBe(1);
    expect(body.result.skipped).toBe(4);
    expect(body.result.items.find((i) => i.conceptId === conceptD)?.status).toBe("generated");
  });

  it("is idempotent — re-running skips everything", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/admin/questions/generate",
      headers: csrfHeaders(admin),
      payload: { curriculumId: corpus.curriculumId },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { result: { generated: number; skipped: number; failed: number } };
    expect(body.result.generated).toBe(0);
    expect(body.result.skipped).toBe(5);
    // No duplicates: conceptD still owns exactly one question.
    const count = await api.db.db
      .select({ n: questions.id })
      .from(questions)
      .where(eq(questions.conceptId, conceptD));
    expect(count.length).toBe(1);
  });

  it("reports concepts without lesson content as failed", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/admin/questions/generate",
      headers: csrfHeaders(admin),
      payload: { lessonId: chunklessLesson },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { result: { generated: number; skipped: number; failed: number; items: GenResultRow[] } };
    expect(body.result.generated).toBe(0);
    expect(body.result.failed).toBe(1);
    expect(body.result.items[0]?.error).toContain("لا يوجد محتوى");
  });
});