import { beforeAll, describe, expect, it } from "vitest";
import { asc, eq } from "drizzle-orm";
import { csrfHeaders, makeAdmin, makeApp, seedMiniCorpus, type AuthSession, type MiniCorpus, type TestApi } from "../helpers.js";
import { chunks, concepts, documents, lessons, questions } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

/**
 * PHASE 36 (D-032 tail) — multi-chunk grounding end-to-end. A lesson longer
 * than the generation budget must ground its questions in material from the
 * WHOLE lesson, not only its opening. The fixture is built so the late, unique
 * sentence is the only "fact" the mock can quote: every other chunk is too short
 * to be treated as a fact, so if the generated question quotes the late sentence
 * the sampler MUST have reached deep into the lesson.
 */
describe("multi-chunk question grounding (D-032 tail) — PHASE 36", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let admin!: AuthSession;
  let longLessonId!: string;
  let longConceptId!: string;
  const LATE_FACT = "العبارة الفريدة في نهاية الدرس الطويل لا تظهر في أي موضع آخر";

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    admin = await makeAdmin(api.app, api.db);

    // A long lesson: 12 chunks, well past the 6-chunk generation budget. The
    // lesson hangs off the corpus's own unit and the chunks off a real document
    // so the foreign keys hold.
    longLessonId = newId("l");
    longConceptId = newId("con");
    await api.db.db.insert(lessons).values({
      id: longLessonId,
      unitId: corpus.unitId,
      code: "l-long",
      title: "درس طويل",
      sortOrder: 9,
    });
    await api.db.db.insert(concepts).values({
      id: longConceptId,
      lessonId: longLessonId,
      code: "c-long",
      title: "مفهوم الدرس الطويل",
      description: "مفهوم لتوليد سؤال عبر مقاطع متعددة",
    });
    const documentId = newId("doc");
    await api.db.db.insert(documents).values({
      id: documentId,
      curriculumId: corpus.curriculumId,
      kind: "text",
      title: "محتوى الدرس الطويل",
      status: "ready",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await api.db.db.insert(chunks).values(
      Array.from({ length: 12 }, (_, i) => ({
        id: newId("ch"),
        documentId,
        lessonId: longLessonId,
        contentHash: `hash-long-${i}`,
        createdAt: new Date(),
        position: i,
        // Every chunk but the last is below the mock's 8-char fact threshold,
        // so the ONLY quotable sentence in the whole lesson is the late fact.
        content: i === 11 ? `${LATE_FACT}.` : "قصير.",
      })),
    );
  });

  it("quotes a late chunk's fact, proving the grounding reached deep into the lesson", async () => {
    const promptChunks = await api.db.db
      .select({ position: chunks.position, content: chunks.content })
      .from(chunks)
      .where(eq(chunks.lessonId, longLessonId))
      .orderBy(asc(chunks.position));
    expect(promptChunks).toHaveLength(12);

    const res = await api.app.inject({
      method: "POST",
      url: "/api/admin/questions/generate",
      headers: csrfHeaders(admin),
      payload: { lessonId: longLessonId },
    });
    expect(res.statusCode).toBe(200);
    const report = res.json() as { result: { generated: number; items: Array<{ conceptId: string; status: string }> } };
    expect(report.result.generated).toBe(1);
    expect(report.result.items[0]!.status).toBe("generated");

    // The stored question is grounded in the LATE fact — the old
    // «first 6 chunks» rule could never have produced it.
    const rows = await api.db.db.select().from(questions).where(eq(questions.conceptId, longConceptId));
    expect(rows).toHaveLength(1);
    const options = JSON.parse(rows[0]!.optionsJson!) as { options: string[]; correctIndex: number };
    expect(options.options[options.correctIndex]).toBe(LATE_FACT);
  });

  it("a second generation over the same long lesson is idempotent (still covered)", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/admin/questions/generate",
      headers: csrfHeaders(admin),
      payload: { lessonId: longLessonId },
    });
    expect(res.statusCode).toBe(200);
    const report = res.json() as { result: { generated: number; skipped: number } };
    expect(report.result.generated).toBe(0);
    expect(report.result.skipped).toBe(1);
  });
});
