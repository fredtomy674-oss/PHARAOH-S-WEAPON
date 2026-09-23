import { describe, expect, it, beforeAll } from "vitest";
import { makeApp, seedMiniCorpus, seedSaudiCorpus, registerStudent, csrfHeaders, type AuthSession, type MiniCorpus, type SaudiCorpus, type TestApi } from "../helpers.js";

let emailSeq = 0;
const nth = (n: number) => `saudi-${n}@test.local`;

/**
 * PHASE 16 — multi-country curriculum: the catalog and the RAG pipeline are
 * regional, not Egypt-only. A Saudi (KSA) corpus seeded on top of the Egyptian
 * corpus must stay fully isolated: catalogs filter by country, and a session
 * started on a Saudi lesson is grounded only in Saudi content.
 */
describe("multi-country curriculum (مصر + السعودية) — PHASE 16", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let saudi!: SaudiCorpus;
  let s!: AuthSession;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    saudi = await seedSaudiCorpus(api);
    s = await registerStudent(api.app, nth(++emailSeq));
  });

  it("countries lists both مصر and السعودية", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/curriculum/countries" });
    expect(res.statusCode).toBe(200);
    const codes = (res.json().countries as Array<{ code: string; nameAr: string }>).map((c) => c.code);
    expect(codes).toContain("eg");
    expect(codes).toContain("sa");
  });

  it("systems are filtered by country: Saudi system only under the Saudi country", async () => {
    const sa = await api.app.inject({ method: "GET", url: `/api/curriculum/systems?countryId=${saudi.countryId}` });
    const saCodes = (sa.json().systems as Array<{ code: string }>).map((x) => x.code);
    expect(saCodes).toEqual(["sa-ministry"]);

    const eg = await api.app.inject({ method: "GET", url: `/api/curriculum/systems?countryId=${corpus.countryId}` });
    const egCodes = (eg.json().systems as Array<{ code: string }>).map((x) => x.code);
    expect(egCodes).toContain("mo-edu");
    expect(egCodes).not.toContain("sa-ministry");
  });

  it("grades stay inside their education system (no cross-country bleed)", async () => {
    const sa = await api.app.inject({ method: "GET", url: `/api/curriculum/grades?systemId=${saudi.systemId}` });
    const saCodes = (sa.json().grades as Array<{ code: string }>).map((x) => x.code);
    expect(saCodes).toEqual(["sa-grade-6"]);

    const eg = await api.app.inject({ method: "GET", url: `/api/curriculum/grades?systemId=${corpus.systemId}` });
    const egCodes = (eg.json().grades as Array<{ code: string }>).map((x) => x.code);
    expect(egCodes).toContain("grade-6");
    expect(egCodes).not.toContain("sa-grade-6");
  });

  it("curricula listing under the Saudi grade returns only Saudi curricula", async () => {
    const res = await api.app.inject({
      method: "GET",
      url: `/api/curriculum/curricula?gradeId=${saudi.gradeId}&subjectId=${saudi.subjectId}`,
    });
    expect(res.statusCode).toBe(200);
    const curricula = res.json().curricula as Array<{ code: string; title: string }>;
    expect(curricula.map((c) => c.code)).toContain("sa-g6-math");
    expect(curricula.map((c) => c.code)).not.toContain("corpus-math");
  });

  it("the Saudi term → unit → lesson chain resolves to the Saudi lesson", async () => {
    const terms = await api.app.inject({ method: "GET", url: `/api/curriculum/terms?curriculumId=${saudi.curriculumId}` });
    expect((terms.json().terms as Array<{ code: string }>).map((t) => t.code)).toEqual(["sa-term-1"]);

    const units = await api.app.inject({ method: "GET", url: `/api/curriculum/units?termId=${saudi.termId}` });
    expect((units.json().units as Array<{ code: string }>).map((u) => u.code)).toEqual(["sa-unit-1"]);

    const lessons = await api.app.inject({ method: "GET", url: `/api/curriculum/lessons?unitId=${saudi.unitId}` });
    const lessonCodes = (lessons.json().lessons as Array<{ code: string; title: string }>);
    expect(lessonCodes.map((l) => l.code)).toEqual(["l-sa-ops"]);
    expect(lessonCodes[0]!.title).toBe("العمليات على الأعداد الطبيعية");
  });

  it("breadcrumb of a Saudi lesson walks to Saudi Arabia (sa)", async () => {
    const res = await api.app.inject({ method: "GET", url: `/api/curriculum/lessons/${saudi.lessonId}/breadcrumb` });
    expect(res.statusCode).toBe(200);
    const breadcrumb = res.json().breadcrumb as { country: { code: string; nameAr: string }; curriculum: { code: string }; grade: { nameAr: string } };
    expect(breadcrumb.country.code).toBe("sa");
    expect(breadcrumb.country.nameAr).toBe("السعودية");
    expect(breadcrumb.curriculum.code).toBe("sa-g6-math");
    expect(breadcrumb.grade.nameAr).toBe("الصف السادس الابتدائي");
  });

  it("a session on the Saudi lesson is grounded only in Saudi content (RAG country isolation)", async () => {
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(s),
      payload: { curriculumId: saudi.curriculumId, gradeId: saudi.gradeId, subjectId: saudi.subjectId, lessonId: saudi.lessonId },
    });
    expect(start.statusCode).toBe(201);
    const sessionId = (start.json() as { session: { id: string } }).session.id;

    const reply = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload: { content: "اشرح مثالًا عن الجمع مع إعادة التجميع في مدينة الرياض" },
    });
    expect(reply.statusCode).toBe(200);
    const content = (reply.json() as { tutorMessage: { content: string } }).tutorMessage.content;
    // Grounded in the Saudi lesson document (retrieval anchor: الرياض).
    expect(content).toContain("وفقًا لمحتوى الدرس");
    expect(content).toContain("الرياض");
    // Never leaks the Egyptian corpus lesson (B) content into the Saudi scope.
    expect(content).not.toContain("مقارنة الكسور");
  });

  it("an Egyptian session still retrieves Egyptian content and never Saudi content (control)", async () => {
    const s2 = await registerStudent(api.app, nth(++emailSeq));
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(s2),
      payload: { curriculumId: corpus.curriculumId, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId: corpus.lessonB },
    });
    expect(start.statusCode).toBe(201);
    const sessionId = (start.json() as { session: { id: string } }).session.id;

    const reply = await api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s2),
      payload: { content: "كيف نقارن الكسور ذات المقامات المتشابهة؟" },
    });
    expect(reply.statusCode).toBe(200);
    const content = (reply.json() as { tutorMessage: { content: string } }).tutorMessage.content;
    expect(content).toContain("وفقًا لمحتوى الدرس");
    expect(content).toContain("مقارنة الكسور");
    expect(content).not.toContain("الرياض");
  });
});