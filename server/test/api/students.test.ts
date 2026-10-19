import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import {
  cookieValueOf,
  csrfHeaders,
  headers,
  makeApp,
  registerParent,
  registerStudent,
  seedMiniCorpus,
  seedSaudiCorpus,
  type AuthSession,
  type MiniCorpus,
  type SaudiCorpus,
  type TestApi,
} from "../helpers.js";
import { answers, learningSessions } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

/**
 * PHASE 180 — «لكل طالبٍ ملفّه».
 *
 * These tests lock the boundary the owner asked for: several children per
 * account, each with an independent grade/plan/history; a session-scoped
 * active child; no grade change through the old profile endpoint; and a
 * transactional wipe only behind the explicit confirmation.
 */

let api: TestApi;
let corpus: MiniCorpus;
let saudi: SaudiCorpus;

beforeAll(async () => {
  api = await makeApp();
  corpus = await seedMiniCorpus(api);
  saudi = await seedSaudiCorpus(api);
});

async function me(session: AuthSession) {
  const res = await api.app.inject({ method: "GET", url: "/api/auth/me", headers: headers(session) });
  expect(res.statusCode).toBe(200);
  return res.json() as {
    user: {
      student?: { id: string; displayName: string; gradeId: string | null; gradeNameAr: string | null };
      students: Array<{ id: string; displayName: string; gradeId: string | null }>;
      linkCode?: string | null;
      gradeNameAr?: string | null;
    };
  };
}

async function setup(session: AuthSession, name: string, gradeId: string) {
  if (!session.studentId) throw new Error("registered student has no id");
  const res = await api.app.inject({
    method: "PUT",
    url: `/api/students/${session.studentId}/setup`,
    headers: csrfHeaders(session),
    payload: { displayName: name, gradeId },
  });
  expect(res.statusCode).toBe(200);
  return res.json() as { user: Awaited<ReturnType<typeof me>>["user"] };
}

describe("PHASE 180 — multiple students", () => {
  it("onboards a child with name + grade, auto-enrolls that grade only, and gives a full plan", async () => {
    const session = await registerStudent(api.app, `multi-onboard-${Date.now()}@test.local`, "password-123", "طالب أول");
    const before = await me(session);
    expect(before.user.student?.id).toBe(session.studentId);
    expect(before.user.student?.gradeId).toBeNull();
    expect(before.user.students).toHaveLength(1);

    const updated = await setup(session, "أحمد", corpus.gradeId);
    expect(updated.user.student?.displayName).toBe("أحمد");
    expect(updated.user.student?.gradeId).toBe(corpus.gradeId);
    expect(updated.user.student?.gradeNameAr).toBe("الصف السادس");
    expect(updated.user.linkCode).toBeTruthy();

    const enrollments = api.db.sqlite
      .prepare("SELECT curriculum_id AS curriculumId FROM curriculum_enrollments WHERE student_id = ?")
      .all(session.studentId!) as Array<{ curriculumId: string }>;
    expect(enrollments.map((e) => e.curriculumId)).toContain(corpus.curriculumId);
    expect(enrollments.some((e) => e.curriculumId === saudi.curriculumId)).toBe(false);
  });

  it("adds a second child, makes it the active child, and keeps each child's history separate", async () => {
    const email = `multi-add-${Date.now()}@test.local`;
    const session = await registerStudent(api.app, email, "password-123", "الطفل الأول");
    await setup(session, "الطفل الأول", corpus.gradeId);

    // A real session + an answer for the first child.
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(session),
      payload: { curriculumId: corpus.curriculumId, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId: corpus.lessonA },
    });
    expect(start.statusCode).toBe(201);
    const firstSessionId = (start.json() as { session: { id: string } }).session.id;
    await api.db.db.insert(answers).values({
      id: newId("ans"),
      questionId: corpus.questionA1Id,
      studentId: session.studentId!,
      sessionId: firstSessionId,
      content: "إجابة الطفل الأول",
      correct: 1,
      createdAt: new Date(),
    });

    const add = await api.app.inject({
      method: "POST",
      url: "/api/students",
      headers: csrfHeaders(session),
      payload: { displayName: "الطفل الثاني", gradeId: corpus.gradeId },
    });
    expect(add.statusCode).toBe(201);
    const added = add.json() as { user: { student: { id: string; displayName: string }; students: Array<{ id: string }> } };
    const secondId = added.user.student.id;
    expect(secondId).not.toBe(session.studentId);
    expect(added.user.student.displayName).toBe("الطفل الثاني");
    expect(added.user.students).toHaveLength(2);

    const after = await me(session);
    expect(after.user.student?.id).toBe(secondId);
    expect(after.user.students).toHaveLength(2);

    // The active session is now the second child: a new learning session must
    // belong to them, while the first child's session still exists untouched.
    const secondStart = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(session),
      payload: { curriculumId: corpus.curriculumId, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId: corpus.lessonA },
    });
    expect(secondStart.statusCode).toBe(201);
    const secondSessionId = (secondStart.json() as { session: { id: string } }).session.id;
    const rows = api.db.sqlite
      .prepare("SELECT id, student_id AS studentId FROM learning_sessions WHERE id IN (?, ?)")
      .all(firstSessionId, secondSessionId) as Array<{ id: string; studentId: string }>;
    expect(rows.find((r) => r.id === firstSessionId)?.studentId).toBe(session.studentId);
    expect(rows.find((r) => r.id === secondSessionId)?.studentId).toBe(secondId);

    // Switching back does not move or erase either history.
    const activate = await api.app.inject({
      method: "POST",
      url: `/api/students/${session.studentId}/activate`,
      headers: csrfHeaders(session),
    });
    expect(activate.statusCode).toBe(200);
    expect((activate.json() as { user: { student: { id: string } } }).user.student.id).toBe(session.studentId);
    const firstSession = await api.db.db.select().from(learningSessions).where(eq(learningSessions.id, firstSessionId)).get();
    expect(firstSession?.studentId).toBe(session.studentId);

    // A fresh login on a family account with more than one child must NOT pick
    // one silently: it starts with the picker (no active student), then can
    // activate either child for this login session.
    const relogin = await api.app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email, password: "password-123" },
    });
    expect(relogin.statusCode).toBe(200);
    const reloginBody = relogin.json() as {
      user: { student?: { id: string }; students: Array<{ id: string }> };
      csrfToken: string;
    };
    expect(reloginBody.user.student).toBeUndefined();
    expect(reloginBody.user.students).toHaveLength(2);
    const fresh: AuthSession = {
      cookie: cookieValueOf(relogin.headers["set-cookie"]),
      csrfToken: reloginBody.csrfToken,
      userId: session.userId,
    };
    const freshMe = await me(fresh);
    expect(freshMe.user.student).toBeUndefined();
    const freshActivate = await api.app.inject({
      method: "POST",
      url: `/api/students/${secondId}/activate`,
      headers: csrfHeaders(fresh),
    });
    expect(freshActivate.statusCode).toBe(200);
    expect((freshActivate.json() as { user: { student: { id: string } } }).user.student.id).toBe(secondId);
  });

  it("locks the old profile grade field and requires confirmation for a destructive grade change", async () => {
    const session = await registerStudent(api.app, `multi-guard-${Date.now()}@test.local`, "password-123", "طالب الحماية");
    await setup(session, "طالب الحماية", corpus.gradeId);

    const profile = await api.app.inject({
      method: "PUT",
      url: "/api/profile/me/student",
      headers: csrfHeaders(session),
      payload: { gradeId: saudi.gradeId },
    });
    expect(profile.statusCode).toBe(400);

    const setupBypass = await api.app.inject({
      method: "PUT",
      url: `/api/students/${session.studentId}/setup`,
      headers: csrfHeaders(session),
      payload: { displayName: "طالب الحماية", gradeId: saudi.gradeId },
    });
    expect(setupBypass.statusCode).toBe(409);

    const noConfirm = await api.app.inject({
      method: "PUT",
      url: `/api/students/${session.studentId}/grade`,
      headers: csrfHeaders(session),
      payload: { gradeId: saudi.gradeId, confirmReset: false },
    });
    expect(noConfirm.statusCode).toBe(400);
    const still = await me(session);
    expect(still.user.student?.gradeId).toBe(corpus.gradeId);

    // The lesson-start route also refuses a crafted request from another grade.
    const crossGrade = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(session),
      payload: {
        curriculumId: corpus.curriculumId,
        gradeId: saudi.gradeId,
        subjectId: corpus.subjectId,
        lessonId: corpus.lessonA,
      },
    });
    expect(crossGrade.statusCode).toBe(400);
    expect((crossGrade.json() as { error: { code: string } }).error.code).toBe("GRADE_LOCKED");
  });

  it("wipes only the changed child's sessions, answers, progress and old plan, then enrolls the new grade", async () => {
    const session = await registerStudent(api.app, `multi-wipe-${Date.now()}@test.local`, "password-123", "طالب المسح");
    await setup(session, "طالب المسح", corpus.gradeId);

    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(session),
      payload: { curriculumId: corpus.curriculumId, gradeId: corpus.gradeId, subjectId: corpus.subjectId, lessonId: corpus.lessonA },
    });
    expect(start.statusCode).toBe(201);
    const sessionId = (start.json() as { session: { id: string } }).session.id;
    await api.db.db.insert(answers).values({
      id: newId("ans"),
      questionId: corpus.questionA1Id,
      studentId: session.studentId!,
      sessionId,
      content: "إجابة قبل المسح",
      correct: 1,
      createdAt: new Date(),
    });
    await api.memory.recordAssessment({ studentId: session.studentId!, conceptId: corpus.conceptAId, correct: true });

    const changed = await api.app.inject({
      method: "PUT",
      url: `/api/students/${session.studentId}/grade`,
      headers: csrfHeaders(session),
      payload: { gradeId: saudi.gradeId, confirmReset: true },
    });
    expect(changed.statusCode).toBe(200);
    const changedBody = changed.json() as {
      user: { student: { gradeId: string; gradeNameAr: string | null } };
      changed: boolean;
      deleted: { sessions: number; answers: number };
    };
    expect(changedBody.changed).toBe(true);
    expect(changedBody.user.student.gradeId).toBe(saudi.gradeId);
    expect(changedBody.deleted.sessions).toBe(1);
    expect(changedBody.deleted.answers).toBe(1);

    const count = (table: string) =>
      Number(
        (
          api.db.sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE student_id = ?`).get(session.studentId!) as { n: number }
        ).n,
      );
    expect(count("learning_sessions")).toBe(0);
    expect(count("answers")).toBe(0);
    expect(count("student_progress")).toBe(0);
    expect(count("assessments")).toBe(0);
    expect(count("student_memories")).toBe(0);
    expect(count("achievements")).toBe(0);

    const enrollments = api.db.sqlite
      .prepare("SELECT curriculum_id AS curriculumId FROM curriculum_enrollments WHERE student_id = ?")
      .all(session.studentId!) as Array<{ curriculumId: string }>;
    expect(enrollments.map((e) => e.curriculumId)).toEqual([saudi.curriculumId]);
  });

  it("lets a parent link two children and see each report under its own name", async () => {
    const student = await registerStudent(api.app, `multi-parent-${Date.now()}@test.local`, "password-123", "الطفل الأول");
    await setup(student, "الطفل الأول", corpus.gradeId);
    const firstCode = (await me(student)).user.linkCode!;

    const add = await api.app.inject({
      method: "POST",
      url: "/api/students",
      headers: csrfHeaders(student),
      payload: { displayName: "الطفلة الثانية", gradeId: corpus.gradeId },
    });
    expect(add.statusCode).toBe(201);
    const secondId = (add.json() as { user: { student: { id: string } } }).user.student.id;
    const secondCode = (await me(student)).user.linkCode!;
    expect(secondCode).not.toBe(firstCode);

    const parent = await registerParent(api.app, `multi-parent-${Date.now()}@test.local`);
    for (const code of [firstCode, secondCode]) {
      const link = await api.app.inject({
        method: "POST",
        url: "/api/parent/link",
        headers: csrfHeaders(parent),
        payload: { code },
      });
      expect(link.statusCode).toBe(200);
    }

    const children = await api.app.inject({ method: "GET", url: "/api/parent/children", headers: headers(parent) });
    expect(children.statusCode).toBe(200);
    const list = (children.json() as { children: Array<{ studentId: string; displayName: string }> }).children;
    expect(list).toHaveLength(2);
    expect(list.map((c) => c.displayName).sort()).toEqual(["الطفل الأول", "الطفلة الثانية"].sort());

    const detail = await api.app.inject({
      method: "GET",
      url: `/api/parent/children/${secondId}`,
      headers: headers(parent),
    });
    expect(detail.statusCode).toBe(200);
    const body = detail.json() as { child: { displayName: string; gradeNameAr: string | null } };
    expect(body.child.displayName).toBe("الطفلة الثانية");
    expect(body.child.gradeNameAr).toBe("الصف السادس");
  });
});
