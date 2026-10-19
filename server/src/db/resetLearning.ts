/* eslint-disable no-console */
import { openDbAndMigrate } from "./index.js";
import { resetAllLearningData, StudentsService } from "../modules/students/service.js";

/**
 * PHASE 180 — one-time owner request: every existing account starts clean.
 *
 * This removes learning history only (sessions, messages/recaps/attachments,
 * answers, assessments, mastery/progress, memories, badges, student AI usage,
 * and old enrollments). Accounts, passwords, student profiles, parent links,
 * subscriptions and curriculum content are preserved. Each child is then
 * enrolled in their current grade's full plan.
 *
 * Run deliberately after a backup:
 *   npm run db:reset-learning --workspace server -- --yes
 */
if (!process.argv.includes("--yes")) {
  console.error("Refusing to reset learning data without --yes.");
  console.error("Usage: npm run db:reset-learning --workspace server -- --yes");
  process.exit(1);
}

const db = openDbAndMigrate();
const students = db.sqlite
  .prepare("SELECT id, grade_id AS gradeId FROM students WHERE grade_id IS NOT NULL")
  .all() as Array<{ id: string; gradeId: string }>;

try {
  const deleted = resetAllLearningData(db);
  const service = new StudentsService(db);
  for (const student of students) {
    await service.syncGradeEnrollments(student.id, student.gradeId);
  }
  const enrollments = Number(
    (db.sqlite.prepare("SELECT COUNT(*) AS n FROM curriculum_enrollments").get() as { n: number }).n,
  );
  console.log(JSON.stringify({ deleted, students: students.length, enrollments }, null, 2));
} finally {
  db.sqlite.close();
}
