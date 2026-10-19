import { and, asc, eq } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { curricula, educationSystems, grades, students } from "../../db/schema.js";
import { Errors } from "../../utils/errors.js";
import { newId, parentLinkCode } from "../../utils/ids.js";

export interface StudentInput {
  displayName: string;
  gradeId: string;
}

export interface GradeChangeResult {
  changed: boolean;
  deleted: {
    sessions: number;
    answers: number;
    assessments: number;
    progress: number;
  };
}

const MAX_STUDENTS_PER_ACCOUNT = 8;

function cleanName(value: string): string {
  const name = value.trim();
  if (name.length < 2) throw Errors.badRequest("اسم الطالب يجب أن يكون حرفين على الأقل");
  return name.slice(0, 80);
}

/**
 * PHASE 180 — «لكل طالبٍ ملفّه».
 *
 * Every operation is owner-scoped: a student id alone is never enough. Grade
 * changes are the only destructive operation, and they are transactional so a
 * half-cleared child can never exist.
 */
export class StudentsService {
  constructor(private readonly db: Db) {}

  async listForUser(userId: string) {
    return this.db.db
      .select()
      .from(students)
      .where(eq(students.userId, userId))
      .orderBy(asc(students.createdAt), asc(students.id));
  }

  async getOwned(userId: string, studentId: string): Promise<typeof students.$inferSelect> {
    const row = await this.db.db.select().from(students).where(eq(students.id, studentId)).get();
    if (!row || row.userId !== userId) throw Errors.notFound("الطالب غير موجود");
    return row;
  }

  async create(userId: string, input: StudentInput) {
    const displayName = cleanName(input.displayName);
    const { countryId } = await this.gradeContext(input.gradeId);
    const count = Number(
      (this.db.sqlite.prepare("SELECT COUNT(*) AS n FROM students WHERE user_id = ?").get(userId) as { n: number }).n,
    );
    if (count >= MAX_STUDENTS_PER_ACCOUNT) {
      throw Errors.conflict(`يمكن إضافة ${MAX_STUDENTS_PER_ACCOUNT} طلاب كحد أقصى للحساب`);
    }

    const id = newId("stu");
    const linkCode = await this.freshLinkCode();
    const now = Date.now();
    const curriculumIds = await this.gradeCurricula(input.gradeId);

    this.db.sqlite.transaction(() => {
      this.db.sqlite
        .prepare(
          `INSERT INTO students (id, user_id, display_name, country_id, grade_id, parent_link_code, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(id, userId, displayName, countryId, input.gradeId, linkCode, now, now);
      this.enrollNow(id, curriculumIds, now);
    })();

    return this.getOwned(userId, id);
  }

  /**
   * First-run onboarding: choose the child's name and grade. This is not the
   * destructive grade-change path — it is only allowed before a grade exists.
   */
  async setup(userId: string, studentId: string, input: StudentInput) {
    const student = await this.getOwned(userId, studentId);
    const displayName = cleanName(input.displayName);
    if (student.gradeId && student.gradeId !== input.gradeId) {
      throw Errors.conflict("الصف محفوظ بالفعل — استخدم «تغيير المنهج» مع تأكيد مسح البيانات", "GRADE_LOCKED");
    }
    const { countryId } = await this.gradeContext(input.gradeId);
    const curriculumIds = await this.gradeCurricula(input.gradeId);
    const now = Date.now();

    this.db.sqlite.transaction(() => {
      this.db.sqlite
        .prepare("UPDATE students SET display_name = ?, grade_id = ?, country_id = ?, updated_at = ? WHERE id = ?")
        .run(displayName, input.gradeId, countryId, now, studentId);
      this.db.sqlite.prepare("DELETE FROM curriculum_enrollments WHERE student_id = ?").run(studentId);
      this.enrollNow(studentId, curriculumIds, now);
    })();

    return this.getOwned(userId, studentId);
  }

  async rename(userId: string, studentId: string, displayNameInput: string) {
    const displayName = cleanName(displayNameInput);
    await this.getOwned(userId, studentId);
    await this.db.db.update(students).set({ displayName, updatedAt: new Date() }).where(eq(students.id, studentId));
    return this.getOwned(userId, studentId);
  }

  async activate(sessionId: string, userId: string, studentId: string) {
    const student = await this.getOwned(userId, studentId);
    const result = this.db.sqlite
      .prepare("UPDATE sessions SET student_id = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL")
      .run(student.id, sessionId, userId);
    if (result.changes === 0) throw Errors.unauthorized("انتهت الجلسة — سجّل الدخول من جديد");
    return student;
  }

  /**
   * «تغيير المنهج» — the only path allowed to erase a child's learning record.
   * Everything below happens in one SQLite transaction: answers, assessments,
   * mastery, memories, badges, learning sessions (messages/recaps/attachments
   * cascade), then the old enrollments. The profile, subscription and parent
   * link stay intact.
   */
  async changeGrade(userId: string, studentId: string, gradeId: string): Promise<GradeChangeResult> {
    const student = await this.getOwned(userId, studentId);
    const { countryId } = await this.gradeContext(gradeId);
    if (student.gradeId === gradeId) {
      return { changed: false, deleted: { sessions: 0, answers: 0, assessments: 0, progress: 0 } };
    }
    const curriculumIds = await this.gradeCurricula(gradeId);
    const now = Date.now();
    const count = (sql: string) => Number((this.db.sqlite.prepare(sql).get(studentId) as { n: number }).n);
    const deleted = {
      sessions: count("SELECT COUNT(*) AS n FROM learning_sessions WHERE student_id = ?"),
      answers: count("SELECT COUNT(*) AS n FROM answers WHERE student_id = ?"),
      assessments: count("SELECT COUNT(*) AS n FROM assessments WHERE student_id = ?"),
      progress: count("SELECT COUNT(*) AS n FROM student_progress WHERE student_id = ?"),
    };

    this.db.sqlite.transaction(() => {
      this.db.sqlite
        .prepare("DELETE FROM message_attachments WHERE session_id IN (SELECT id FROM learning_sessions WHERE student_id = ?)")
        .run(studentId);
      this.db.sqlite
        .prepare("DELETE FROM messages WHERE session_id IN (SELECT id FROM learning_sessions WHERE student_id = ?)")
        .run(studentId);
      this.db.sqlite
        .prepare("DELETE FROM session_recaps WHERE session_id IN (SELECT id FROM learning_sessions WHERE student_id = ?)")
        .run(studentId);
      this.db.sqlite.prepare("DELETE FROM answers WHERE student_id = ?").run(studentId);
      this.db.sqlite.prepare("DELETE FROM assessments WHERE student_id = ?").run(studentId);
      this.db.sqlite.prepare("DELETE FROM student_progress WHERE student_id = ?").run(studentId);
      this.db.sqlite.prepare("DELETE FROM student_memories WHERE student_id = ?").run(studentId);
      this.db.sqlite.prepare("DELETE FROM achievements WHERE student_id = ?").run(studentId);
      this.db.sqlite.prepare("DELETE FROM learning_sessions WHERE student_id = ?").run(studentId);
      this.db.sqlite.prepare("DELETE FROM curriculum_enrollments WHERE student_id = ?").run(studentId);
      this.db.sqlite
        .prepare("UPDATE students SET grade_id = ?, country_id = ?, updated_at = ? WHERE id = ?")
        .run(gradeId, countryId, now, studentId);
      this.enrollNow(studentId, curriculumIds, now);
    })();

    return { changed: true, deleted };
  }

  /** Used by onboarding and maintenance: make the full grade plan available. */
  async syncGradeEnrollments(studentId: string, gradeId: string): Promise<void> {
    const ids = await this.gradeCurricula(gradeId);
    const now = Date.now();
    this.db.sqlite.transaction(() => this.enrollNow(studentId, ids, now))();
  }

  private async gradeContext(gradeId: string): Promise<{ countryId: string }> {
    const row = await this.db.db
      .select({ countryId: educationSystems.countryId })
      .from(grades)
      .innerJoin(educationSystems, eq(grades.educationSystemId, educationSystems.id))
      .where(eq(grades.id, gradeId))
      .get();
    if (!row) throw Errors.notFound("الصف الدراسي غير موجود");
    return row;
  }

  private async gradeCurricula(gradeId: string): Promise<string[]> {
    const rows = await this.db.db
      .select({ id: curricula.id })
      .from(curricula)
      .where(and(eq(curricula.gradeId, gradeId), eq(curricula.isActive, true)));
    return rows.map((row) => row.id);
  }

  private async freshLinkCode(): Promise<string> {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const code = parentLinkCode();
      const existing = this.db.sqlite.prepare("SELECT 1 FROM students WHERE parent_link_code = ?").get(code);
      if (!existing) return code;
    }
    throw Errors.internal("تعذّر توليد كود ولي الأمر");
  }

  private enrollNow(studentId: string, curriculumIds: string[], now: number): void {
    const enroll = this.db.sqlite.prepare(
      `INSERT INTO curriculum_enrollments (id, student_id, curriculum_id, is_active, created_at)
       VALUES (?, ?, ?, 1, ?)
       ON CONFLICT DO NOTHING`,
    );
    for (const curriculumId of curriculumIds) {
      enroll.run(newId("enr"), studentId, curriculumId, now);
    }
  }
}

/** Shared by the one-time maintenance script (not a request path). */
export function resetAllLearningData(db: Db): Record<string, number> {
  const count = (table: string) => Number((db.sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n);
  const deleted = {
    answers: count("answers"),
    assessments: count("assessments"),
    progress: count("student_progress"),
    memories: count("student_memories"),
    achievements: count("achievements"),
    sessions: count("learning_sessions"),
    enrollments: count("curriculum_enrollments"),
    aiUsage: 0,
  };
  db.sqlite.transaction(() => {
    db.sqlite.prepare("DELETE FROM message_attachments").run();
    db.sqlite.prepare("DELETE FROM messages").run();
    db.sqlite.prepare("DELETE FROM session_recaps").run();
    db.sqlite.prepare("DELETE FROM answers").run();
    db.sqlite.prepare("DELETE FROM assessments").run();
    db.sqlite.prepare("DELETE FROM student_progress").run();
    db.sqlite.prepare("DELETE FROM student_memories").run();
    db.sqlite.prepare("DELETE FROM achievements").run();
    db.sqlite.prepare("DELETE FROM learning_sessions").run();
    // The grade plan is re-seeded below for each student's current grade;
    // clearing OLD enrollments first removes any cross-grade leftovers.
    db.sqlite.prepare("DELETE FROM curriculum_enrollments").run();
    deleted.aiUsage = Number(
      db.sqlite.prepare("DELETE FROM ai_usage_logs WHERE user_id IN (SELECT id FROM users WHERE role = 'student')").run().changes ?? 0,
    );
  })();
  return deleted;
}
