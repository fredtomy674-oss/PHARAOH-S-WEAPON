import { and, asc, eq, isNull, or } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { curricula, educationSystems, grades, students, subjects } from "../../db/schema.js";
import { Errors } from "../../utils/errors.js";
import { newId, parentLinkCode } from "../../utils/ids.js";
import {
  resolveG12Choices,
  selectCurriculumIds,
  type G12ChoiceInput,
  type G12Choices,
} from "../curriculum/g12Selection.js";
import { sortTrackCodes, trackOption, type TrackOption } from "../curriculum/tracks.js";

export interface StudentInput extends G12ChoiceInput {
  displayName: string;
  gradeId: string;
  /** PHASE 185 — required only when the grade itself is split into tracks. */
  track?: string | null;
}

export interface GradeChangeResult {
  changed: boolean;
  deleted: {
    sessions: number;
    answers: number;
    assessments: number;
    progress: number;
    /** PHASE 182 — the child's own homework/exam planner rows. */
    tasks: number;
  };
}

const MAX_STUDENTS_PER_ACCOUNT = 8;

function cleanName(value: string): string {
  const name = value.trim();
  if (name.length < 2) throw Errors.badRequest("اسم الطالب يجب أن يكون حرفين على الأقل");
  return name.slice(0, 80);
}

function choicesDiffer(
  student: {
    studyLanguage: string | null;
    firstForeignLanguage: string | null;
    secondForeignLanguage: string | null;
    religion: string | null;
  },
  choices: G12Choices,
): boolean {
  return (
    student.studyLanguage !== choices.studyLanguage ||
    student.firstForeignLanguage !== choices.firstForeignLanguage ||
    student.secondForeignLanguage !== choices.secondForeignLanguage ||
    student.religion !== choices.religion
  );
}

function storedChoices(row: {
  studyLanguage: string | null;
  firstForeignLanguage: string | null;
  secondForeignLanguage: string | null;
  religion: string | null;
}): G12Choices | null {
  if (!row.studyLanguage || !row.firstForeignLanguage || !row.secondForeignLanguage || !row.religion) return null;
  return {
    studyLanguage: row.studyLanguage as G12Choices["studyLanguage"],
    firstForeignLanguage: row.firstForeignLanguage as G12Choices["firstForeignLanguage"],
    secondForeignLanguage: row.secondForeignLanguage as G12Choices["secondForeignLanguage"],
    religion: row.religion as G12Choices["religion"],
  };
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
    const { countryId, code: gradeCode } = await this.gradeContext(input.gradeId);
    const track = await this.resolveTrack(input.gradeId, input.track);
    const isG12 = gradeCode === "grade-12";
    const choices = isG12 ? resolveG12Choices(input) : null;
    const count = Number(
      (this.db.sqlite.prepare("SELECT COUNT(*) AS n FROM students WHERE user_id = ?").get(userId) as { n: number }).n,
    );
    if (count >= MAX_STUDENTS_PER_ACCOUNT) {
      throw Errors.conflict(`يمكن إضافة ${MAX_STUDENTS_PER_ACCOUNT} طلاب كحد أقصى للحساب`);
    }

    const id = newId("stu");
    const linkCode = await this.freshLinkCode();
    const now = Date.now();
    const curriculumIds = await this.gradeCurricula(input.gradeId, track, choices, isG12);

    this.db.sqlite.transaction(() => {
      this.db.sqlite
        .prepare(
          `INSERT INTO students (
             id, user_id, display_name, country_id, grade_id, track,
             study_language, first_foreign_language, second_foreign_language, religion,
             parent_link_code, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          id,
          userId,
          displayName,
          countryId,
          input.gradeId,
          track,
          choices?.studyLanguage ?? null,
          choices?.firstForeignLanguage ?? null,
          choices?.secondForeignLanguage ?? null,
          choices?.religion ?? null,
          linkCode,
          now,
          now,
        );
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
    // Onboarding must not become a side door for switching tracks without the
    // destructive warning: a saved track changes only through changeGrade().
    if (student.gradeId && student.track && input.track && input.track !== student.track) {
      throw Errors.conflict("المسار محفوظ بالفعل — استخدم «تغيير المنهج» مع تأكيد مسح البيانات", "TRACK_LOCKED");
    }
    const { countryId, code: gradeCode } = await this.gradeContext(input.gradeId);
    const track = await this.resolveTrack(input.gradeId, input.track ?? student.track);
    const isG12 = gradeCode === "grade-12";
    const choices = isG12
      ? resolveG12Choices(input, {
          studyLanguage: student.studyLanguage,
          firstForeignLanguage: student.firstForeignLanguage,
          secondForeignLanguage: student.secondForeignLanguage,
          religion: student.religion,
        })
      : null;
    const curriculumIds = await this.gradeCurricula(input.gradeId, track, choices, isG12);
    const now = Date.now();

    this.db.sqlite.transaction(() => {
      this.db.sqlite
        .prepare(
          `UPDATE students SET
             display_name = ?, grade_id = ?, country_id = ?, track = ?,
             study_language = ?, first_foreign_language = ?, second_foreign_language = ?, religion = ?,
             updated_at = ?
           WHERE id = ?`,
        )
        .run(
          displayName,
          input.gradeId,
          countryId,
          track,
          choices?.studyLanguage ?? null,
          choices?.firstForeignLanguage ?? null,
          choices?.secondForeignLanguage ?? null,
          choices?.religion ?? null,
          now,
          studentId,
        );
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
  async changeGrade(
    userId: string,
    studentId: string,
    gradeId: string,
    requestedTrack?: string | null,
    choiceInput?: G12ChoiceInput,
  ): Promise<GradeChangeResult> {
    const student = await this.getOwned(userId, studentId);
    const { countryId, code: gradeCode } = await this.gradeContext(gradeId);
    const track = await this.resolveTrack(gradeId, requestedTrack);
    const isG12 = gradeCode === "grade-12";
    const choices = isG12
      ? resolveG12Choices(choiceInput ?? {}, {
          studyLanguage: student.studyLanguage,
          firstForeignLanguage: student.firstForeignLanguage,
          secondForeignLanguage: student.secondForeignLanguage,
          religion: student.religion,
        })
      : null;
    if (student.gradeId === gradeId && student.track === track) {
      // Changing only the language/religion choices is not a destructive grade
      // change. Keep the learning record and re-enroll the new editions.
      if (isG12 && choices && choicesDiffer(student, choices)) {
        await this.updateChoices(userId, studentId, choiceInput ?? {});
      }
      return { changed: false, deleted: { sessions: 0, answers: 0, assessments: 0, progress: 0, tasks: 0 } };
    }
    const curriculumIds = await this.gradeCurricula(gradeId, track, choices, isG12);
    const now = Date.now();
    const count = (sql: string) => Number((this.db.sqlite.prepare(sql).get(studentId) as { n: number }).n);
    const deleted = {
      sessions: count("SELECT COUNT(*) AS n FROM learning_sessions WHERE student_id = ?"),
      answers: count("SELECT COUNT(*) AS n FROM answers WHERE student_id = ?"),
      assessments: count("SELECT COUNT(*) AS n FROM assessments WHERE student_id = ?"),
      progress: count("SELECT COUNT(*) AS n FROM student_progress WHERE student_id = ?"),
      tasks: count("SELECT COUNT(*) AS n FROM student_tasks WHERE student_id = ?"),
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
      // PHASE 182 — a grade change changes the child's whole week; their own
      // homework/exam list is learning data and is wiped with it.
      this.db.sqlite.prepare("DELETE FROM student_tasks WHERE student_id = ?").run(studentId);
      this.db.sqlite.prepare("DELETE FROM learning_sessions WHERE student_id = ?").run(studentId);
      this.db.sqlite.prepare("DELETE FROM curriculum_enrollments WHERE student_id = ?").run(studentId);
      this.db.sqlite
        .prepare(
          `UPDATE students SET
             grade_id = ?, country_id = ?, track = ?,
             study_language = ?, first_foreign_language = ?, second_foreign_language = ?, religion = ?,
             updated_at = ?
           WHERE id = ?`,
        )
        .run(
          gradeId,
          countryId,
          track,
          choices?.studyLanguage ?? null,
          choices?.firstForeignLanguage ?? null,
          choices?.secondForeignLanguage ?? null,
          choices?.religion ?? null,
          now,
          studentId,
        );
      this.enrollNow(studentId, curriculumIds, now);
    })();

    return { changed: true, deleted };
  }

  /**
   * Change the four G12 choices without touching grades or learning data.
   * Progress on an old edition remains stored; switching back restores it.
   */
  async updateChoices(userId: string, studentId: string, input: G12ChoiceInput) {
    const student = await this.getOwned(userId, studentId);
    const gradeId = student.gradeId;
    if (!gradeId) throw Errors.badRequest("اختر الصف الدراسي أولًا", "GRADE_REQUIRED");
    const { code: gradeCode } = await this.gradeContext(gradeId);
    if (gradeCode !== "grade-12") {
      throw Errors.badRequest("اختيارات لغة الدراسة متاحة للصف الثالث الثانوي فقط", "G12_CHOICES_NOT_APPLICABLE");
    }
    const choices = resolveG12Choices(input, {
      studyLanguage: student.studyLanguage,
      firstForeignLanguage: student.firstForeignLanguage,
      secondForeignLanguage: student.secondForeignLanguage,
      religion: student.religion,
    });
    const curriculumIds = await this.gradeCurricula(gradeId, student.track, choices, true);
    const now = Date.now();
    this.db.sqlite.transaction(() => {
      this.db.sqlite
        .prepare(
          `UPDATE students SET
             study_language = ?, first_foreign_language = ?, second_foreign_language = ?, religion = ?,
             updated_at = ?
           WHERE id = ?`,
        )
        .run(
          choices.studyLanguage,
          choices.firstForeignLanguage,
          choices.secondForeignLanguage,
          choices.religion,
          now,
          studentId,
        );
      this.db.sqlite
        .prepare(
          `DELETE FROM curriculum_enrollments
            WHERE student_id = ?
              AND curriculum_id IN (SELECT id FROM curricula WHERE grade_id = ?)`,
        )
        .run(studentId, gradeId);
      this.enrollNow(studentId, curriculumIds, now);
    })();
    return this.getOwned(userId, studentId);
  }

  /** Used by onboarding and maintenance: make the full grade plan available. */
  async syncGradeEnrollments(studentId: string, gradeId: string): Promise<void> {
    const student = await this.db.db
      .select({
        track: students.track,
        studyLanguage: students.studyLanguage,
        firstForeignLanguage: students.firstForeignLanguage,
        secondForeignLanguage: students.secondForeignLanguage,
        religion: students.religion,
      })
      .from(students)
      .where(eq(students.id, studentId))
      .get();
    if (!student) throw Errors.notFound("الطالب غير موجود");
    const { code: gradeCode } = await this.gradeContext(gradeId);
    const isG12 = gradeCode === "grade-12";
    const choices = isG12 && storedChoices(student) ? (storedChoices(student) as G12Choices) : null;
    const ids = await this.gradeCurricula(gradeId, student.track, choices, isG12);
    const now = Date.now();
    this.db.sqlite.transaction(() => {
      // Reconcile the full grade plan so a language/track change cannot leave
      // an old edition enrolled next to the new one.
      this.db.sqlite
        .prepare(
          `DELETE FROM curriculum_enrollments
            WHERE student_id = ?
              AND curriculum_id IN (SELECT id FROM curricula WHERE grade_id = ?)`,
        )
        .run(studentId, gradeId);
      this.enrollNow(studentId, ids, now);
    })();
  }

  private async gradeContext(gradeId: string): Promise<{ countryId: string; code: string }> {
    const row = await this.db.db
      .select({ countryId: educationSystems.countryId, code: grades.code })
      .from(grades)
      .innerJoin(educationSystems, eq(grades.educationSystemId, educationSystems.id))
      .where(eq(grades.id, gradeId))
      .get();
    if (!row) throw Errors.notFound("الصف الدراسي غير موجود");
    return row;
  }

  /**
   * The track a child may be enrolled on. A grade with no track-specific
   * curriculum is track-free (all primary/preparatory grades and G10); a grade
   * that offers tracks requires an explicit choice, otherwise the child would
   * silently get one track's books or both.
   */
  private async resolveTrack(gradeId: string, requested?: string | null): Promise<string | null> {
    const options = await this.trackOptions(gradeId);
    if (options.length === 0) {
      if (requested) throw Errors.badRequest("هذا الصف لا يحتاج اختيار مسار دراسي", "TRACK_NOT_APPLICABLE");
      return null;
    }
    if (!requested) {
      throw Errors.badRequest("اختر المسار الدراسي أولًا: علمي أو أدبي", "TRACK_REQUIRED");
    }
    const normalized = requested.trim();
    if (!options.some((option) => option.code === normalized)) {
      throw Errors.badRequest("هذا المسار غير متاح للصف المختار", "TRACK_NOT_AVAILABLE");
    }
    return normalized;
  }

  /** Distinct tracks that actually have an active curriculum in this grade. */
  private async trackOptions(gradeId: string): Promise<TrackOption[]> {
    const rows = await this.db.db
      .selectDistinct({ track: curricula.track })
      .from(curricula)
      .where(and(eq(curricula.gradeId, gradeId), eq(curricula.isActive, true)));
    const codes = rows
      .map((row) => row.track)
      .filter((track): track is string => Boolean(track));
    return sortTrackCodes(codes).map(trackOption);
  }

  private async gradeCurricula(
    gradeId: string,
    track: string | null,
    choices: G12Choices | null = null,
    isG12 = false,
  ): Promise<string[]> {
    // A common curriculum (track = null) belongs to every child in the grade;
    // a track-specific one belongs only to that track. For G12 the selector
    // then keeps exactly one language edition per subject and the chosen
    // religion/first/second-language books.
    const trackFilter = track
      ? or(isNull(curricula.track), eq(curricula.track, track))
      : isNull(curricula.track);
    const rows = await this.db.db
      .select({
        id: curricula.id,
        code: curricula.code,
        track: curricula.track,
        subjectCode: subjects.code,
        language: curricula.language,
        variantOf: curricula.variantOf,
        languageRole: curricula.languageRole,
      })
      .from(curricula)
      .innerJoin(subjects, eq(curricula.subjectId, subjects.id))
      .where(and(eq(curricula.gradeId, gradeId), eq(curricula.isActive, true), trackFilter));
    return selectCurriculumIds(rows, { track, isG12, choices });
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
    tasks: count("student_tasks"),
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
    db.sqlite.prepare("DELETE FROM student_tasks").run();
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
