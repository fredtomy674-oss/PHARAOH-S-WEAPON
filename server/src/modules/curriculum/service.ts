import { and, asc, eq } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import {
  concepts,
  countries,
  curricula,
  curriculumEnrollments,
  educationSystems,
  grades,
  lessons,
  subjects,
  terms,
  units,
} from "../../db/schema.js";
import { Errors } from "../../utils/errors.js";
import { newId } from "../../utils/ids.js";
import { sortTrackCodes, trackOption, type TrackOption } from "./tracks.js";

export type CurriculumBreadcrumb = {
  lesson: typeof lessons.$inferSelect;
  unit: typeof units.$inferSelect;
  term: typeof terms.$inferSelect;
  curriculum: typeof curricula.$inferSelect;
  grade: typeof grades.$inferSelect;
  subject: typeof subjects.$inferSelect;
  system: typeof educationSystems.$inferSelect;
  country: typeof countries.$inferSelect;
};

export class CurriculumService {
  constructor(private readonly db: Db) {}

  async listCountries() {
    return this.db.db.select().from(countries).orderBy(asc(countries.nameAr));
  }

  async listSystems(countryId: string) {
    return this.db.db.select().from(educationSystems).where(eq(educationSystems.countryId, countryId)).orderBy(asc(educationSystems.sortOrder));
  }

  async listGrades(systemId: string) {
    return this.db.db.select().from(grades).where(eq(grades.educationSystemId, systemId)).orderBy(asc(grades.levelOrder));
  }

  /**
   * Subjects, optionally scoped to a grade. With a grade, only subjects with at
   * least one active curriculum for that grade come back: the picker must show
   * what the grade actually teaches, not the whole catalog (every system and
   * country shares the subjects table). Without a grade, the full catalog.
   *
   * PHASE 185 — when a studentId is supplied, the list is narrowed to that
   * child's active enrollments. This is what keeps a literature student from
   * seeing chemistry (or a science student from seeing history) even though
   * both curricula hang under the same grade.
   */
  async listSubjects(gradeId?: string, studentId?: string) {
    if (!gradeId) return this.db.db.select().from(subjects).orderBy(asc(subjects.nameAr));
    if (studentId) {
      return this.db.db
        .selectDistinct({ id: subjects.id, code: subjects.code, name: subjects.name, nameAr: subjects.nameAr })
        .from(subjects)
        .innerJoin(
          curricula,
          and(eq(curricula.subjectId, subjects.id), eq(curricula.gradeId, gradeId), eq(curricula.isActive, true)),
        )
        .innerJoin(
          curriculumEnrollments,
          and(
            eq(curriculumEnrollments.curriculumId, curricula.id),
            eq(curriculumEnrollments.studentId, studentId),
            eq(curriculumEnrollments.isActive, true),
          ),
        )
        .orderBy(asc(subjects.nameAr));
    }
    return this.db.db
      .selectDistinct({ id: subjects.id, code: subjects.code, name: subjects.name, nameAr: subjects.nameAr })
      .from(subjects)
      .innerJoin(
        curricula,
        and(eq(curricula.subjectId, subjects.id), eq(curricula.gradeId, gradeId), eq(curricula.isActive, true)),
      )
      .orderBy(asc(subjects.nameAr));
  }

  async listCurricula(gradeId: string, subjectId: string, studentId?: string) {
    if (studentId) {
      const rows = await this.db.db
        .select({ curriculum: curricula })
        .from(curricula)
        .innerJoin(
          curriculumEnrollments,
          and(
            eq(curriculumEnrollments.curriculumId, curricula.id),
            eq(curriculumEnrollments.studentId, studentId),
            eq(curriculumEnrollments.isActive, true),
          ),
        )
        .where(and(eq(curricula.gradeId, gradeId), eq(curricula.subjectId, subjectId), eq(curricula.isActive, true)))
        .orderBy(asc(curricula.createdAt));
      return rows.map((row) => row.curriculum);
    }
    return this.db.db
      .select()
      .from(curricula)
      .where(and(eq(curricula.gradeId, gradeId), eq(curricula.subjectId, subjectId), eq(curricula.isActive, true)))
      .orderBy(asc(curricula.createdAt));
  }

  /**
   * PHASE 185 — the tracks a grade actually offers, derived from its active
   * curricula. Empty for all grades before Secondary-2.
   */
  async listTrackOptions(gradeId: string): Promise<TrackOption[]> {
    const rows = await this.db.db
      .selectDistinct({ track: curricula.track })
      .from(curricula)
      .where(and(eq(curricula.gradeId, gradeId), eq(curricula.isActive, true)));
    const codes = rows
      .map((row) => row.track)
      .filter((track): track is string => Boolean(track));
    return sortTrackCodes(codes).map(trackOption);
  }

  async listTerms(curriculumId: string) {
    return this.db.db.select().from(terms).where(eq(terms.curriculumId, curriculumId)).orderBy(asc(terms.sortOrder));
  }

  async listUnits(termId: string) {
    return this.db.db.select().from(units).where(eq(units.termId, termId)).orderBy(asc(units.sortOrder));
  }

  async listLessons(unitId: string) {
    return this.db.db.select().from(lessons).where(eq(lessons.unitId, unitId)).orderBy(asc(lessons.sortOrder));
  }

  async listConcepts(lessonId: string) {
    return this.db.db.select().from(concepts).where(eq(concepts.lessonId, lessonId)).orderBy(asc(concepts.code));
  }

  async getLesson(lessonId: string) {
    const lesson = await this.db.db.select().from(lessons).where(eq(lessons.id, lessonId)).get();
    if (!lesson) throw Errors.notFound("الدرس غير موجود");
    return lesson;
  }

  /** Full breadcrumb for a lesson — used to build the RAG scope of a session. */
  async lessonBreadcrumb(lessonId: string): Promise<CurriculumBreadcrumb> {
    const lesson = await this.getLesson(lessonId);
    const unit = await this.db.db.select().from(units).where(eq(units.id, lesson.unitId)).get();
    if (!unit) throw Errors.notFound("الوحدة غير موجودة");
    const term = await this.db.db.select().from(terms).where(eq(terms.id, unit.termId)).get();
    if (!term) throw Errors.notFound("الفصل غير موجود");
    const curriculum = await this.db.db.select().from(curricula).where(eq(curricula.id, term.curriculumId)).get();
    if (!curriculum) throw Errors.notFound("المنهج غير موجود");
    const grade = await this.db.db.select().from(grades).where(eq(grades.id, curriculum.gradeId)).get();
    if (!grade) throw Errors.notFound("الصف غير موجود");
    const subject = await this.db.db.select().from(subjects).where(eq(subjects.id, curriculum.subjectId)).get();
    if (!subject) throw Errors.notFound("المادة غير موجودة");
    const system = await this.db.db.select().from(educationSystems).where(eq(educationSystems.id, curriculum.educationSystemId)).get();
    if (!system) throw Errors.notFound("نظام التعليم غير موجود");
    const country = await this.db.db.select().from(countries).where(eq(countries.id, curriculum.countryId)).get();
    if (!country) throw Errors.notFound("البلد غير موجود");
    return { lesson, unit, term, curriculum, grade, subject, system, country };
  }

  async enroll(studentId: string, curriculumId: string) {
    const existing = await this.db.db
      .select()
      .from(curriculumEnrollments)
      .where(and(eq(curriculumEnrollments.studentId, studentId), eq(curriculumEnrollments.curriculumId, curriculumId)))
      .get();
    if (existing) return existing;
    await this.db.db.insert(curriculumEnrollments).values({
      id: newId("enr"),
      studentId,
      curriculumId,
      isActive: true,
      createdAt: new Date(),
    });
    return this.db.db
      .select()
      .from(curriculumEnrollments)
      .where(and(eq(curriculumEnrollments.studentId, studentId), eq(curriculumEnrollments.curriculumId, curriculumId)))
      .get();
  }
}