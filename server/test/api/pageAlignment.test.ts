import { beforeAll, describe, expect, it } from "vitest";
import { newId } from "../../src/utils/ids.js";
import { curricula, lessons, terms, units } from "../../src/db/schema.js";
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
 * PHASE 75 — the teacher and the student share the lesson's own book pages for
 * every curriculum. The room's cited pages are what makes that visible and
 * clickable, so a cited page must always be a page of THIS lesson: a passage
 * that slipped in from a neighbour may not offer the student a page his stage
 * does not have.
 */
describe("lesson page alignment — API", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let s!: AuthSession;
  let sessionId!: string;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    s = await registerStudent(api.app, "page-align@test.local");
    const db = api.db.db;
    const now = new Date();
    // A real staged lesson: the curriculum code resolves to the maths book and
    // `l-con-1-1` owns pages 0–13 of it.
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
    const term = { id: newId("t"), curriculumId: cur.id, code: "t-align", title: "الفصل", sortOrder: 1 };
    await db.insert(terms).values(term);
    const unit = { id: newId("u"), termId: term.id, code: "u-align", title: "الوحدة", sortOrder: 1 };
    await db.insert(units).values(unit);
    const lesson = { id: newId("l"), unitId: unit.id, code: "l-con-1-1", title: "المفهوم 1-1", sortOrder: 1 };
    await db.insert(lessons).values(lesson);
    // One passage naming page 5 (this lesson owns 0–13) and page 50 (another
    // lesson's page). Both are real printed pages of the book; only the first
    // belongs to this lesson — exactly the drift the filter must stop.
    await api.knowledge.ingestText({
      title: "مقطع بصفحات",
      content: "[صفحة الكتاب 5] قابلية القسمة على 2: الآحاد زوجي (0، 2، 4، 6، 8). [صفحة الكتاب 50] نص من درس آخر لا يخص درسنا.",
      kind: "text",
      source: "test-page-align",
      scope: {
        countryId: corpus.countryId,
        educationSystemId: corpus.systemId,
        gradeId: corpus.gradeId,
        subjectId: corpus.subjectId,
        curriculumId: cur.id,
        termId: term.id,
        unitId: unit.id,
        lessonId: lesson.id,
      },
    });
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(s),
      payload: { curriculumId: cur.id, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId: lesson.id },
    });
    expect(start.statusCode).toBe(201);
    sessionId = (start.json() as { session: { id: string } }).session.id;
  });

  it("cites only pages the lesson's stage actually has", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "اشرح لي من الكتاب", bookPage: 5 },
    });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as { citedBookPages: number[] };
    // Page 5 is part of the lesson (stage 0–13); page 50 is not, so it is dropped.
    expect(turn.citedBookPages).toEqual([5]);
  });
});
