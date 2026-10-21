import { inArray } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { grades } from "../../db/schema.js";
import { trackLabel } from "../curriculum/tracks.js";
import type { AuthUser } from "./service.js";

/**
 * PHASE 180 — «الملف الشخصي لكل طالب».
 *
 * The auth response carries every child on the account, plus which child this
 * login session has active. The web gate uses this list to show the picker for
 * a family with several children, and to keep the account drawer in sync.
 */
export async function publicUserFor(db: Db, authUser: AuthUser) {
  const gradeIds = [...new Set(authUser.students.map((s) => s.gradeId).filter((id): id is string => Boolean(id)))];
  const gradeRows =
    gradeIds.length > 0
      ? await db.db
          .select({ id: grades.id, code: grades.code, nameAr: grades.nameAr })
          .from(grades)
          .where(inArray(grades.id, gradeIds))
      : [];
  const gradeNameById = new Map(gradeRows.map((g) => [g.id, g.nameAr]));
  const gradeCodeById = new Map(gradeRows.map((g) => [g.id, g.code]));
  const active = authUser.student;

  return {
    id: authUser.user.id,
    email: authUser.user.email,
    role: authUser.user.role,
    createdAt: authUser.user.createdAt,
    student: active
      ? {
          id: active.id,
          displayName: active.displayName,
          gradeId: active.gradeId ?? null,
          gradeCode: active.gradeId ? (gradeCodeById.get(active.gradeId) ?? null) : null,
          gradeNameAr: active.gradeId ? (gradeNameById.get(active.gradeId) ?? null) : null,
          track: active.track ?? null,
          trackNameAr: trackLabel(active.track),
          studyLanguage: active.studyLanguage ?? null,
          firstForeignLanguage: active.firstForeignLanguage ?? null,
          secondForeignLanguage: active.secondForeignLanguage ?? null,
          religion: active.religion ?? null,
        }
      : undefined,
    students: authUser.students.map((student) => ({
      id: student.id,
      displayName: student.displayName,
      gradeId: student.gradeId ?? null,
      gradeCode: student.gradeId ? (gradeCodeById.get(student.gradeId) ?? null) : null,
      gradeNameAr: student.gradeId ? (gradeNameById.get(student.gradeId) ?? null) : null,
      track: student.track ?? null,
      trackNameAr: trackLabel(student.track),
      studyLanguage: student.studyLanguage ?? null,
      firstForeignLanguage: student.firstForeignLanguage ?? null,
      secondForeignLanguage: student.secondForeignLanguage ?? null,
      religion: student.religion ?? null,
    })),
    // PHASE 179 — the active grade's human name for «مواد صفك» / «خطة صفك».
    gradeNameAr: active?.gradeId ? (gradeNameById.get(active.gradeId) ?? null) : null,
    // PHASE 18: the active student's parent-linking code (null until it exists).
    linkCode: active?.parentLinkCode ?? null,
  };
}
