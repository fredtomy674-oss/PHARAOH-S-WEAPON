import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import {
  curricula,
  curriculumEnrollments,
  grades,
  learningSessions,
  lessons,
  messages,
  parents,
  students,
  studentsParents,
} from "../../db/schema.js";
import type { MemoryService } from "../tutor/memoryService.js";
import { Errors } from "../../utils/errors.js";

export interface ChildSummary {
  studentId: string;
  displayName: string;
  gradeNameAr: string | null;
  /** Titles of the child's active enrolled curricula. */
  curricula: string[];
  lastSession: {
    id: string;
    lessonTitle: string | null;
    status: "active" | "ended" | "abandoned";
    startedAt: Date;
  } | null;
  sessionCount: number;
}

export interface ParentSessionSummary {
  id: string;
  lessonId: string | null;
  lessonTitle: string | null;
  status: "active" | "ended" | "abandoned";
  startedAt: Date;
  endedAt: Date | null;
  userMessages: number;
  tutorMessages: number;
  totalMessages: number;
}

export interface ChildDetail {
  child: {
    studentId: string;
    displayName: string;
    gradeNameAr: string | null;
    curricula: string[];
    sessionCount: number;
  };
  /** Read-only aggregates; never exposes raw message content (PHASE 18). */
  progress: {
    concepts: Array<{ conceptId: string; title: string; mastery: number }>;
    strengths: string[];
    weaknesses: string[];
  };
  sessions: ParentSessionSummary[];
}

/**
 * Parent dashboard (PHASE 18): a parent links their children by the child's
 * sharing code, then sees read-only progress + session summaries. Every method
 * re-verifies the parent↔child link — a parent can only ever observe children
 * explicitly linked to their own account (isolation is structural).
 */
export class ParentService {
  constructor(
    private readonly db: Db,
    private readonly memory: MemoryService,
  ) {}

  private async requireParent(userId: string): Promise<typeof parents.$inferSelect> {
    const parent = await this.db.db.select().from(parents).where(eq(parents.userId, userId)).get();
    if (!parent) throw Errors.forbidden("الوصول مخصص لحسابات أولياء الأمور");
    return parent;
  }

  async link(userId: string, code: string): Promise<ChildSummary> {
    const parent = await this.requireParent(userId);
    const normalized = code.trim().toUpperCase();
    const student = await this.db.db.select().from(students).where(eq(students.parentLinkCode, normalized)).get();
    if (!student) throw Errors.badRequest("كود الربط غير صحيح — تأكد منه مع الطالب", "INVALID_LINK_CODE");

    const existing = await this.db.db
      .select()
      .from(studentsParents)
      .where(and(eq(studentsParents.studentId, student.id), eq(studentsParents.parentId, parent.id)))
      .get();
    if (existing) throw Errors.conflict("هذا الطالب مربوط بحسابك من قبل", "ALREADY_LINKED");

    await this.db.db.insert(studentsParents).values({ studentId: student.id, parentId: parent.id });
    return this.childSummaryOf(student.id);
  }

  async listChildren(userId: string): Promise<ChildSummary[]> {
    const parent = await this.requireParent(userId);
    const links = await this.db.db.select().from(studentsParents).where(eq(studentsParents.parentId, parent.id));
    const summaries: ChildSummary[] = [];
    for (const link of links) summaries.push(await this.childSummaryOf(link.studentId));
    return summaries;
  }

  async unlink(userId: string, studentId: string): Promise<void> {
    const parent = await this.requireParent(userId);
    const deleted = await this.db.db
      .delete(studentsParents)
      .where(and(eq(studentsParents.parentId, parent.id), eq(studentsParents.studentId, studentId)))
      .returning({ id: studentsParents.studentId });
    if (deleted.length === 0) throw Errors.notFound("الطالب غير مربوط بحسابك");
  }

  /** Read-only child view: identity + progress aggregates + session summaries. */
  async childDetail(userId: string, studentId: string): Promise<ChildDetail> {
    const parent = await this.requireParent(userId);
    const link = await this.db.db
      .select()
      .from(studentsParents)
      .where(and(eq(studentsParents.parentId, parent.id), eq(studentsParents.studentId, studentId)))
      .get();
    if (!link) throw Errors.notFound("الطالب غير مربوط بحسابك");

    const summary = await this.childSummaryOf(studentId);
    const detail = await this.memory.progressDetail(studentId);

    return {
      child: {
        studentId: summary.studentId,
        displayName: summary.displayName,
        gradeNameAr: summary.gradeNameAr,
        curricula: summary.curricula,
        sessionCount: summary.sessionCount,
      },
      progress: {
        concepts: detail.concepts.map((c) => ({ conceptId: c.conceptId, title: c.conceptTitle, mastery: c.mastery })),
        strengths: detail.strengths.map((s) => s.title),
        weaknesses: detail.weaknesses.map((w) => w.title),
      },
      sessions: await this.sessionSummaries(studentId),
    };
  }

  private async childSummaryOf(studentId: string): Promise<ChildSummary> {
    const child = await this.db.db.select().from(students).where(eq(students.id, studentId)).get();
    if (!child) throw Errors.notFound("الطالب غير موجود");

    const grade = child.gradeId
      ? await this.db.db.select().from(grades).where(eq(grades.id, child.gradeId)).get()
      : undefined;

    const enrollments = await this.db.db
      .select({ title: curricula.title })
      .from(curriculumEnrollments)
      .innerJoin(curricula, eq(curriculumEnrollments.curriculumId, curricula.id))
      .where(and(eq(curriculumEnrollments.studentId, studentId), eq(curriculumEnrollments.isActive, true)));

    const latest = await this.db.db
      .select()
      .from(learningSessions)
      .where(eq(learningSessions.studentId, studentId))
      .orderBy(desc(learningSessions.startedAt))
      .get();

    let lessonTitle: string | null = null;
    if (latest?.lessonId) {
      const lesson = await this.db.db.select().from(lessons).where(eq(lessons.id, latest.lessonId)).get();
      lessonTitle = lesson?.title ?? null;
    }

    const { n } = (await this.db.db
      .select({ n: count() })
      .from(learningSessions)
      .where(eq(learningSessions.studentId, studentId))
      .get()) ?? { n: 0 };

    return {
      studentId,
      displayName: child.displayName,
      gradeNameAr: grade?.nameAr ?? null,
      curricula: enrollments.map((e) => e.title),
      lastSession: latest
        ? { id: latest.id, lessonTitle, status: latest.status, startedAt: latest.startedAt }
        : null,
      sessionCount: n,
    };
  }

  private async sessionSummaries(studentId: string): Promise<ParentSessionSummary[]> {
    const rows = await this.db.db
      .select()
      .from(learningSessions)
      .where(eq(learningSessions.studentId, studentId))
      .orderBy(desc(learningSessions.startedAt));

    const sessionIds = rows.map((r) => r.id);
    const lessonTitles = new Map<string, string>();
    const lessonIds = rows.map((r) => r.lessonId).filter((x): x is string => Boolean(x));
    if (lessonIds.length > 0) {
      const lessonsRows = await this.db.db.select().from(lessons).where(inArray(lessons.id, lessonIds));
      for (const l of lessonsRows) lessonTitles.set(l.id, l.title);
    }

    const counts = new Map<string, { userMessages: number; tutorMessages: number }>();
    if (sessionIds.length > 0) {
      const rowsWithCounts = await this.db.db
        .select({ sessionId: messages.sessionId, role: messages.role, n: sql<number>`count(*)` })
        .from(messages)
        .where(inArray(messages.sessionId, sessionIds))
        .groupBy(messages.sessionId, messages.role);
      for (const r of rowsWithCounts) {
        const entry = counts.get(r.sessionId) ?? { userMessages: 0, tutorMessages: 0 };
        if (r.role === "user") entry.userMessages = Number(r.n);
        if (r.role === "tutor") entry.tutorMessages = Number(r.n);
        counts.set(r.sessionId, entry);
      }
    }

    return rows.map((r) => {
      const c = counts.get(r.id) ?? { userMessages: 0, tutorMessages: 0 };
      return {
        id: r.id,
        lessonId: r.lessonId,
        lessonTitle: r.lessonId ? (lessonTitles.get(r.lessonId) ?? null) : null,
        status: r.status,
        startedAt: r.startedAt,
        endedAt: r.endedAt,
        userMessages: c.userMessages,
        tutorMessages: c.tutorMessages,
        totalMessages: c.userMessages + c.tutorMessages,
      };
    });
  }
}