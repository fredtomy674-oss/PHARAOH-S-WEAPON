import { beforeAll, describe, expect, it } from "vitest";
import { newId } from "../../src/utils/ids.js";
import { curricula, lessons, terms, units } from "../../src/db/schema.js";
import { IMAGE_READ_MARKER } from "../../src/modules/ai/providers/mock.js";
import {
  csrfHeaders,
  makeApp,
  registerStudent,
  seedMiniCorpus,
  type AuthSession,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";

/**
 * The tutor sees the open book page: with no attached picture but a resolved
 * stage page, the printed page image travels as the turn's vision input, so a
 * question about anything drawn on the page is answerable from sight rather
 * than from OCR text alone. The mock provider echoes IMAGE_READ_MARKER into
 * its reply if and only if images reached the model call, which makes the
 * wiring observable without vision.
 */
describe("stage page vision — API", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let s!: AuthSession;
  let sessionId!: string;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    s = await registerStudent(api.app, "stage-vision@test.local");
    const db = api.db.db;
    const now = new Date();
    // A real staged lesson: the curriculum code resolves to the maths book and
    // `l-con-1-1` owns pages 0–13 of it (same fixture as pageAlignment).
    const cur = {
      id: newId("cur"),
      countryId: corpus.countryId,
      educationSystemId: corpus.systemId,
      gradeId: corpus.gradeId,
      subjectId: corpus.subjectId,
      code: "eg-g6-math",
      title: "رياضيات السادس — الوزارة",
      version: "1.0",
      isActive: true,
      createdAt: now,
    };
    await db.insert(curricula).values(cur);
    const term = { id: newId("t"), curriculumId: cur.id, code: "t-vision", title: "الفصل", sortOrder: 1 };
    await db.insert(terms).values(term);
    const unit = { id: newId("u"), termId: term.id, code: "u-vision", title: "الوحدة", sortOrder: 1 };
    await db.insert(units).values(unit);
    const lesson = { id: newId("l"), unitId: unit.id, code: "l-con-1-1", title: "المفهوم 1-1", sortOrder: 1 };
    await db.insert(lessons).values(lesson);
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(s),
      payload: { curriculumId: cur.id, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId: lesson.id },
    });
    expect(start.statusCode).toBe(201);
    sessionId = (start.json() as { session: { id: string } }).session.id;
  });

  it("sends the open stage page image to the model when nothing is attached", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "ماذا ترى في الصفحة؟", bookPage: 5 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { tutorMessage: { content: string } };
    expect(body.tutorMessage.content).toContain(IMAGE_READ_MARKER);
  });

  it("sends no image when no stage page is open", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "اشرح لي الدرس" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { tutorMessage: { content: string } };
    expect(body.tutorMessage.content).not.toContain(IMAGE_READ_MARKER);
  });
});
