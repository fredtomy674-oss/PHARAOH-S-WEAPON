import { beforeAll, describe, expect, it } from "vitest";
import {
  csrfHeaders,
  headers,
  makeApp,
  registerStudent,
  seedMiniCorpus,
  type AuthSession,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";
import { curricula, grades, subjects } from "../../src/db/schema.js";
import { newId } from "../../src/utils/ids.js";

/**
 * PHASE 185 — «علمي ولا أدبي؟».
 *
 * A Secondary-2 child must choose a track before enrollment, and the catalog
 * must never show the other track's books. These tests build a minimal G11
 * corpus on top of the existing Egypt fixture and exercise the real HTTP paths:
 * creation, enrollment, subject/curriculum filtering, and a track change.
 */

let api: TestApi;
let corpus: MiniCorpus;
let gradeId: string;
const subject = { arabic: "", chemistry: "", social: "" };
const curriculum = { arabic: "", chemistry: "", social: "" };

async function createChild(session: AuthSession, payload: Record<string, unknown>) {
  return api.app.inject({
    method: "POST",
    url: "/api/students",
    headers: csrfHeaders(session),
    payload,
  });
}

async function subjectCodes(studentId: string): Promise<string[]> {
  const res = await api.app.inject({
    method: "GET",
    url: `/api/curriculum/subjects?gradeId=${encodeURIComponent(gradeId)}&studentId=${encodeURIComponent(studentId)}`,
    headers: headers(apiSession),
  });
  expect(res.statusCode).toBe(200);
  return (res.json() as { subjects: Array<{ code: string }> }).subjects.map((s) => s.code).sort();
}

let apiSession: AuthSession;

describe("PHASE 185 — Secondary-2 tracks", () => {
  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    const now = new Date();

    const grade = {
      id: newId("g"),
      educationSystemId: corpus.systemId,
      code: "grade-11",
      name: "Grade 11",
      nameAr: "الصف الثاني الثانوي",
      levelOrder: 11,
    };
    await api.db.db.insert(grades).values(grade);
    gradeId = grade.id;

    const rows = [
      { key: "arabic", code: "arabic-track-test", nameAr: "اللغة العربية", name: "Arabic" },
      { key: "chemistry", code: "chemistry-track-test", nameAr: "الكيمياء", name: "Chemistry" },
      { key: "social", code: "social-track-test", nameAr: "التاريخ", name: "History" },
    ] as const;
    for (const row of rows) {
      const id = newId("subj");
      subject[row.key] = id;
      await api.db.db.insert(subjects).values({ id, code: row.code, name: row.name, nameAr: row.nameAr });
    }

    const specs = [
      { key: "arabic", code: "eg-test-g11-arabic", title: "اللغة العربية", track: null },
      { key: "chemistry", code: "eg-test-g11-chemistry", title: "الكيمياء", track: "science" },
      { key: "social", code: "eg-test-g11-history", title: "التاريخ", track: "literature" },
    ] as const;
    for (const spec of specs) {
      const id = newId("cur");
      curriculum[spec.key] = id;
      await api.db.db.insert(curricula).values({
        id,
        countryId: corpus.countryId,
        educationSystemId: corpus.systemId,
        gradeId,
        subjectId: subject[spec.key],
        code: spec.code,
        title: spec.title,
        version: "1.0",
        isActive: true,
        track: spec.track,
        createdAt: now,
      });
    }

    apiSession = await registerStudent(api.app, `tracks-${Date.now()}@test.local`, "password-123", "طالب مسار");
  });

  it("refuses to enroll a G11 child without a track", async () => {
    const res = await createChild(apiSession, { displayName: "بلا مسار", gradeId });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe("TRACK_REQUIRED");
  });

  it("enrolls a science child in common + science only", async () => {
    const res = await createChild(apiSession, { displayName: "عالم", gradeId, track: "science" });
    expect(res.statusCode).toBe(201);
    const student = (res.json() as { user: { student: { id: string; track: string; trackNameAr: string } } }).user.student;
    expect(student.track).toBe("science");
    expect(student.trackNameAr).toBe("علمي");
    expect(await subjectCodes(student.id)).toEqual(["arabic-track-test", "chemistry-track-test"]);

    const social = await api.app.inject({
      method: "GET",
      url: `/api/curriculum/curricula?gradeId=${encodeURIComponent(gradeId)}&subjectId=${encodeURIComponent(subject.social)}&studentId=${encodeURIComponent(student.id)}`,
      headers: headers(apiSession),
    });
    expect((social.json() as { curricula: unknown[] }).curricula).toHaveLength(0);

    const rows = api.db.sqlite
      .prepare("SELECT curriculum_id AS curriculumId FROM curriculum_enrollments WHERE student_id = ?")
      .all(student.id) as Array<{ curriculumId: string }>;
    const ids = rows.map((row) => row.curriculumId);
    expect(ids).toContain(curriculum.arabic);
    expect(ids).toContain(curriculum.chemistry);
    expect(ids).not.toContain(curriculum.social);
  });

  it("enrolls a literature child in common + literature only", async () => {
    const session = await registerStudent(api.app, `tracks-lit-${Date.now()}@test.local`, "password-123", "طالبة أدبي");
    const res = await createChild(session, { displayName: "أديبة", gradeId, track: "literature" });
    expect(res.statusCode).toBe(201);
    const student = (res.json() as { user: { student: { id: string; track: string } } }).user.student;
    expect(student.track).toBe("literature");
    expect(await subjectCodes(student.id)).toEqual(["arabic-track-test", "social-track-test"]);
  });

  it("switches tracks in place and replaces the other track's enrollments", async () => {
    const res = await createChild(apiSession, { displayName: "متحول", gradeId, track: "science" });
    expect(res.statusCode).toBe(201);
    const student = (res.json() as { user: { student: { id: string } } }).user.student;

    const changed = await api.app.inject({
      method: "PUT",
      url: `/api/students/${student.id}/grade`,
      headers: csrfHeaders(apiSession),
      payload: { gradeId, track: "literature", confirmReset: true },
    });
    expect(changed.statusCode).toBe(200);
    const updated = changed.json() as { user: { student: { track: string; trackNameAr: string } } };
    expect(updated.user.student.track).toBe("literature");
    expect(updated.user.student.trackNameAr).toBe("أدبي");

    expect(await subjectCodes(student.id)).toEqual(["arabic-track-test", "social-track-test"]);
    const rows = api.db.sqlite
      .prepare("SELECT curriculum_id AS curriculumId FROM curriculum_enrollments WHERE student_id = ?")
      .all(student.id) as Array<{ curriculumId: string }>;
    const ids = rows.map((row) => row.curriculumId);
    expect(ids).toContain(curriculum.social);
    expect(ids).not.toContain(curriculum.chemistry);
  });

  it("does not switch tracks through the non-destructive setup path", async () => {
    const res = await createChild(apiSession, { displayName: "ثابت المسار", gradeId, track: "science" });
    expect(res.statusCode).toBe(201);
    const student = (res.json() as { user: { student: { id: string } } }).user.student;
    const setup = await api.app.inject({
      method: "PUT",
      url: `/api/students/${student.id}/setup`,
      headers: csrfHeaders(apiSession),
      payload: { displayName: "ثابت المسار", gradeId, track: "literature" },
    });
    expect(setup.statusCode).toBe(409);
    expect((setup.json() as { error: { code: string } }).error.code).toBe("TRACK_LOCKED");
  });

  it("rejects a track that the grade does not offer", async () => {
    const res = await createChild(apiSession, { displayName: "مسار خاطئ", gradeId, track: "arts" });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe("TRACK_NOT_AVAILABLE");
  });

  it("exposes the offered tracks for the onboarding picker", async () => {
    const res = await api.app.inject({
      method: "GET",
      url: `/api/curriculum/tracks?gradeId=${encodeURIComponent(gradeId)}`,
    });
    expect(res.statusCode).toBe(200);
    const tracks = (res.json() as { tracks: Array<{ code: string; nameAr: string }> }).tracks;
    expect(tracks.map((track) => track.code)).toEqual(["science", "literature"]);
    expect(tracks.map((track) => track.nameAr)).toEqual(["علمي", "أدبي"]);
  });
});
