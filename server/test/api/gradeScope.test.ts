import { beforeAll, describe, expect, it } from "vitest";
import {
  csrfHeaders,
  makeApp,
  registerStudent,
  seedMiniCorpus,
  type AuthSession,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";
import {
  concepts,
  countries,
  curricula,
  curriculumEnrollments,
  educationSystems,
  grades,
  lessons,
  questions,
  subjects,
  terms,
  units,
} from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

/**
 * PHASE 179 — «صفّك وحدك».
 *
 * The owner's report: the home showed exercises from every subject and grade.
 * The cause was historical, not cosmetic — curriculum enrollments accumulate
 * (one per lesson ever started), the practice plan/machinery read ALL of them,
 * and mastery rows from a previous grade stayed in the progress card. These
 * tests lock the boundary: a student's plan, progress and practice are scoped
 * to the grade in their profile, even when they remain enrolled in an older
 * grade's curriculum.
 */

let emailSeq = 0;
const nth = (n: number) => `gradescope-${n}@test.local`;

interface ForeignCorpus {
  gradeId: string;
  curriculumId: string;
  conceptId: string;
  questionId: string;
}

async function seedForeignGrade(api: TestApi): Promise<ForeignCorpus> {
  const db = api.db.db;
  const now = new Date();
  const country = { id: newId("c"), code: "eg-old", name: "Egypt", nameAr: "مصر" };
  await db.insert(countries).values(country);
  const system = { id: newId("sys"), countryId: country.id, code: "old-edu", name: "Ministry", nameAr: "الوزارة", sortOrder: 2 };
  await db.insert(educationSystems).values(system);
  const grade = { id: newId("g"), educationSystemId: system.id, code: "grade-5", name: "Grade 5", nameAr: "الصف الخامس", levelOrder: 5 };
  await db.insert(grades).values(grade);
  const subject = { id: newId("subj"), code: "science-old", name: "Science", nameAr: "العلوم" };
  await db.insert(subjects).values(subject);
  const curriculum = {
    id: newId("cur"),
    countryId: country.id,
    educationSystemId: system.id,
    gradeId: grade.id,
    subjectId: subject.id,
    code: "old-grade-5-science",
    title: "علوم الصف الخامس",
    version: "1.0",
    isActive: true,
    createdAt: now,
  };
  await db.insert(curricula).values(curriculum);
  const term = { id: newId("t"), curriculumId: curriculum.id, code: "old-t1", title: "الفصل الأول", sortOrder: 1 };
  await db.insert(terms).values(term);
  const unit = { id: newId("u"), termId: term.id, code: "old-u1", title: "الوحدة الأولى", sortOrder: 1 };
  await db.insert(units).values(unit);
  const lesson = { id: newId("l"), unitId: unit.id, code: "old-l1", title: "درس قديم", sortOrder: 1 };
  await db.insert(lessons).values(lesson);
  const concept = { id: newId("con"), lessonId: lesson.id, code: "old-c1", title: "مفهوم من صف سابق", description: null };
  await db.insert(concepts).values(concept);
  const question = {
    id: newId("q"),
    curriculumId: curriculum.id,
    lessonId: lesson.id,
    conceptId: concept.id,
    difficulty: "easy" as const,
    type: "mcq" as const,
    content: "سؤال من صف سابق؟",
    explanation: null,
    optionsJson: JSON.stringify({ options: ["أ", "ب"], correctIndex: 0 }),
    answerKey: null,
    createdAt: now,
  };
  await db.insert(questions).values(question);
  return { gradeId: grade.id, curriculumId: curriculum.id, conceptId: concept.id, questionId: question.id };
}

describe("grade scope (PHASE 179) — «صفّك وحدك»", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let foreign!: ForeignCorpus;
  let student!: AuthSession;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    foreign = await seedForeignGrade(api);
    student = await registerStudent(api.app, nth(++emailSeq), undefined, undefined, corpus.gradeId);

    // The child really IS still enrolled in the old grade's curriculum (this
    // is how the historical bug looked): both enrollments are active.
    await api.db.db.insert(curriculumEnrollments).values([
      {
        id: newId("enr"),
        studentId: student.studentId!,
        curriculumId: corpus.curriculumId,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: newId("enr"),
        studentId: student.studentId!,
        curriculumId: foreign.curriculumId,
        isActive: true,
        createdAt: new Date(),
      },
    ]);

    // Real mastery rows on both grades.
    await api.memory.recordAssessment({
      studentId: student.studentId!,
      conceptId: corpus.conceptAId,
      correct: true,
      type: "exercise",
    });
    await api.memory.recordAssessment({
      studentId: student.studentId!,
      conceptId: foreign.conceptId,
      correct: false,
      type: "exercise",
    });
  });

  it("the practice plan never lists a concept from another grade, even while enrolled", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/practice/plan", headers: csrfHeaders(student) });
    expect(res.statusCode).toBe(200);
    const { plan } = res.json() as {
      plan: Array<{ conceptId: string; subjectNameAr: string | null; title: string }>;
    };
    const ids = plan.map((p) => p.conceptId);
    expect(ids).not.toContain(foreign.conceptId);
    expect(ids).toContain(corpus.conceptAId);
    expect(plan.every((p) => p.title !== "مفهوم من صف سابق")).toBe(true);
    // The row now names its subject so the weekly plan can be concrete.
    const graded = plan.find((p) => p.conceptId === corpus.conceptAId)!;
    expect(graded.subjectNameAr).toBe("الرياضيات");
  });

  it("progress/me measures the current grade only", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/progress/me", headers: csrfHeaders(student) });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      progress: { concepts: Array<{ conceptId: string }> };
      mastery: Array<{ conceptId: string }>;
    };
    const ids = body.progress.concepts.map((c) => c.conceptId);
    expect(ids).toContain(corpus.conceptAId);
    expect(ids).not.toContain(foreign.conceptId);
    expect(body.mastery.map((m) => m.conceptId)).not.toContain(foreign.conceptId);
  });

  it("answering an old grade's question is refused (404 — not your grade)", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: `/api/practice/questions/${foreign.questionId}/submit`,
      headers: csrfHeaders(student),
      payload: { optionIndex: 0 },
    });
    expect(res.statusCode).toBe(404);
  });
});
