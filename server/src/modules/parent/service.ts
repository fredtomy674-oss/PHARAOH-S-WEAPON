import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import {
  assessments,
  concepts,
  curricula,
  curriculumEnrollments,
  grades,
  learningSessions,
  lessons,
  messageAttachments,
  messages,
  parents,
  students,
  studentsParents,
} from "../../db/schema.js";
import type { MemoryService } from "../tutor/memoryService.js";
import type { SessionService } from "../sessions/service.js";
import type { SessionRecap } from "../sessions/recap.js";
import { Errors } from "../../utils/errors.js";
import { safeParseAssessment } from "../progress/mastery.js";

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

export interface ParentSessionAttachment {
  id: string;
  mimeType: string;
  fileName: string | null;
  sizeBytes: number;
  itemKind: "image" | "document";
  ocrApplied: boolean;
}

export interface ParentTimelineEntry {
  id: string;
  role: "user" | "tutor" | "system";
  kind: string;
  createdAt: Date;
  attachments: ParentSessionAttachment[];
  /** True when the prompt-injection tripwire fired for this turn (PHASE 23). */
  safetyFlagged: boolean;
}

export interface ParentSessionDetail {
  session: {
    id: string;
    lessonTitle: string | null;
    status: "active" | "ended" | "abandoned";
    startedAt: Date;
    endedAt: Date | null;
    endedReason: string | null;
    durationMinutes: number;
    userMessages: number;
    tutorMessages: number;
    totalMessages: number;
  };
  /** Concepts assessed during the session (derived from assessments, PHASE 23). */
  concepts: Array<{ conceptId: string; title: string; attempts: number; correct: number }>;
  safety: { flaggedTurns: number };
  /** Metadata-only timeline. Message content NEVER leaves the server. */
  timeline: ParentTimelineEntry[];
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
 * Parent dashboard (PHASE 18 + 23): a parent links their children by the child's
 * sharing code, then sees read-only progress + session summaries, and (PHASE 23)
 * a metadata-only activity timeline per session with safety flags and assessed
 * concepts — message CONTENT is never selected here. Every method re-verifies
 * the parent↔child link — a parent can only ever observe children explicitly
 * linked to their own account (isolation is structural).
 */
export class ParentService {
  constructor(
    private readonly db: Db,
    private readonly memory: MemoryService,
    private readonly sessions: SessionService,
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
    const mastery = await this.memory.masterySummary(studentId);

    return {
      child: {
        studentId: summary.studentId,
        displayName: summary.displayName,
        gradeNameAr: summary.gradeNameAr,
        curricula: summary.curricula,
        sessionCount: summary.sessionCount,
      },
      progress: {
        // PHASE 24: each concept now carries the mastery level + Arabic label
        // (decayed, read-side) alongside the raw persisted score.
        concepts: mastery.map((m) => ({
          conceptId: m.conceptId,
          title: m.title,
          mastery: m.mastery,
          decayedMastery: m.decayedMastery,
          level: m.level,
          labelAr: m.labelAr,
          trend: m.trend,
        })),
        strengths: detail.strengths.map((s) => s.title),
        weaknesses: detail.weaknesses.map((w) => w.title),
      },
      sessions: await this.sessionSummaries(studentId),
    };
  }

  /**
   * PHASE 23 — privacy-safe session detail for a linked child: a metadata-only
   * activity timeline (roles/kinds/timestamps/attachment descriptors/safety
   * flags) + the concepts assessed during the session. Message CONTENT is never
   * selected from the DB here, so it cannot leak by construction.
   */
  async sessionDetail(userId: string, studentId: string, sessionId: string): Promise<ParentSessionDetail> {
    const parent = await this.requireParent(userId);
    const link = await this.db.db
      .select()
      .from(studentsParents)
      .where(and(eq(studentsParents.parentId, parent.id), eq(studentsParents.studentId, studentId)))
      .get();
    if (!link) throw Errors.notFound("الطالب غير مربوط بحسابك");

    const session = await this.db.db.select().from(learningSessions).where(eq(learningSessions.id, sessionId)).get();
    if (!session || session.studentId !== studentId) throw Errors.notFound("الجلسة غير موجودة");

    const lessonTitle = session.lessonId
      ? (await this.db.db.select().from(lessons).where(eq(lessons.id, session.lessonId)).get())?.title ?? null
      : null;

    const [msgs, atts] = await Promise.all([
      this.db.db.select().from(messages).where(eq(messages.sessionId, sessionId)).orderBy(messages.createdAt),
      this.db.db.select().from(messageAttachments).where(eq(messageAttachments.sessionId, sessionId)),
    ]);

    const byMessage = new Map<string, ParentSessionAttachment[]>();
    for (const a of atts) {
      const list = byMessage.get(a.messageId) ?? [];
      list.push({
        id: a.id,
        mimeType: a.mimeType,
        fileName: a.fileName,
        sizeBytes: a.sizeBytes,
        itemKind: a.mimeType.startsWith("image/") ? "image" : "document",
        ocrApplied: a.ocrApplied ?? false,
      });
      byMessage.set(a.messageId, list);
    }

    let userMessages = 0;
    let tutorMessages = 0;
    for (const m of msgs) {
      if (m.role === "user") userMessages++;
      else if (m.role === "tutor") tutorMessages++;
    }

    const endedAt = session.endedAt ?? new Date();
    const durationMinutes = Math.max(0, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60000));

    // Concepts assessed inside this session — assessments rows carry sessionId.
    const assessmentRows = await this.db.db.select().from(assessments).where(eq(assessments.sessionId, sessionId));
    const conceptIds = new Set<string>();
    const tally = new Map<string, { attempts: number; correct: number }>();
    for (const row of assessmentRows) {
      const parsed = safeParseAssessment(row.resultJson);
      if (!parsed?.conceptId) continue;
      conceptIds.add(parsed.conceptId);
      const t = tally.get(parsed.conceptId) ?? { attempts: 0, correct: 0 };
      t.attempts += 1;
      t.correct += parsed.correct ? 1 : 0;
      tally.set(parsed.conceptId, t);
    }
    const titleFor = new Map<string, string>();
    if (conceptIds.size > 0) {
      const conceptRows = await this.db.db.select().from(concepts).where(inArray(concepts.id, [...conceptIds]));
      for (const c of conceptRows) titleFor.set(c.id, c.title);
    }

    return {
      session: {
        id: session.id,
        lessonTitle,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        endedReason: session.endedReason,
        durationMinutes,
        userMessages,
        tutorMessages,
        totalMessages: userMessages + tutorMessages,
      },
      concepts: [...tally.entries()].map(([conceptId, t]) => ({
        conceptId,
        title: titleFor.get(conceptId) ?? "مفهوم",
        attempts: t.attempts,
        correct: t.correct,
      })),
      safety: { flaggedTurns: msgs.filter((m) => m.safetyFlag).length },
      timeline: msgs.map((m) => ({
        id: m.id,
        role: m.role,
        kind: m.kind,
        createdAt: m.createdAt,
        attachments: byMessage.get(m.id) ?? [],
        safetyFlagged: Boolean(m.safetyFlag),
      })),
    };
  }

  /**
   * PHASE 29 (D-027) — parent-facing session recap. Same safety contract as the
   * student route: the AI sees metadata only, the no-verbatim guard applies,
   * and the link check gates it just like every other child read.
   */
  async sessionRecap(userId: string, studentId: string, sessionId: string): Promise<SessionRecap | null> {
    const parent = await this.requireParent(userId);
    const link = await this.db.db
      .select()
      .from(studentsParents)
      .where(and(eq(studentsParents.parentId, parent.id), eq(studentsParents.studentId, studentId)))
      .get();
    if (!link) throw Errors.notFound("الطالب غير مربوط بحسابك");

    const session = await this.db.db.select().from(learningSessions).where(eq(learningSessions.id, sessionId)).get();
    if (!session || session.studentId !== studentId) throw Errors.notFound("الجلسة غير موجودة");

    return this.sessions.recap(sessionId, session.studentId, userId);
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