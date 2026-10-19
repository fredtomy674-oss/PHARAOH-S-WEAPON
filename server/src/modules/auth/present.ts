import { inArray } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { grades } from "../../db/schema.js";
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
      ? await db.db.select({ id: grades.id, nameAr: grades.nameAr }).from(grades).where(inArray(grades.id, gradeIds))
      : [];
  const gradeNameById = new Map(gradeRows.map((g) => [g.id, g.nameAr]));
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
          gradeNameAr: active.gradeId ? (gradeNameById.get(active.gradeId) ?? null) : null,
        }
      : undefined,
    students: authUser.students.map((student) => ({
      id: student.id,
      displayName: student.displayName,
      gradeId: student.gradeId ?? null,
      gradeNameAr: student.gradeId ? (gradeNameById.get(student.gradeId) ?? null) : null,
    })),
    // PHASE 179 — the active grade's human name for «مواد صفك» / «خطة صفك».
    gradeNameAr: active?.gradeId ? (gradeNameById.get(active.gradeId) ?? null) : null,
    // PHASE 18: the active student's parent-linking code (null until it exists).
    linkCode: active?.parentLinkCode ?? null,
  };
}
