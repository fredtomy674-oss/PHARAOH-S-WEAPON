import { and, asc, eq } from "drizzle-orm";
import { config } from "../../config/env.js";
import type { Db } from "../../db/index.js";
import { learningSessions, messages, students as studentsTable } from "../../db/schema.js";
import { newId } from "../../utils/ids.js";
import { Errors } from "../../utils/errors.js";
import type { CurriculumService } from "../curriculum/service.js";
import type { MemoryService } from "../tutor/memoryService.js";
import type { TutorEngine } from "../tutor/tutorEngine.js";
import type { AuditService } from "../audit/service.js";
import type { AiService } from "../ai/aiService.js";

export interface StartSessionInput {
  studentId: string;
  curriculumId: string;
  gradeId: string;
  subjectId: string;
  lessonId?: string;
}

export class SessionService {
  constructor(
    private readonly db: Db,
    private readonly curriculum: CurriculumService,
    private readonly tutor: TutorEngine,
    private readonly memory: MemoryService,
    private readonly audit: AuditService,
    private readonly ai: AiService,
  ) {}

  async start(input: StartSessionInput): Promise<typeof learningSessions.$inferSelect> {
    if (input.lessonId) {
      const breadcrumb = await this.curriculum.lessonBreadcrumb(input.lessonId);
      if (breadcrumb.curriculum.id !== input.curriculumId) {
        throw Errors.badRequest("الدرس لا ينتمي للمنهج المحدد", "LESSON_CURRICULUM_MISMATCH");
      }
      if (breadcrumb.grade.id !== input.gradeId || breadcrumb.subject.id !== input.subjectId) {
        throw Errors.badRequest("الدرس لا يطابق الصف/المادة المحددين", "LESSON_SCOPE_MISMATCH");
      }
    }

    // Enroll the student in this curriculum (learning intent tracking).
    await this.curriculum.enroll(input.studentId, input.curriculumId);

    const now = new Date();
    const result = await this.db.db
      .insert(learningSessions)
      .values({
        id: newId("lsn"),
        studentId: input.studentId,
        curriculumId: input.curriculumId,
        gradeId: input.gradeId,
        subjectId: input.subjectId,
        lessonId: input.lessonId ?? null,
        status: "active",
        startedAt: now,
      })
      .returning();
    const session = result[0]!;
    await this.audit.record({ actorUserId: undefined, action: "session.start", entityType: "learning_session", entityId: session.id, afterJson: JSON.stringify({ curriculumId: session.curriculumId, lessonId: session.lessonId }) });
    return session;
  }

  async getOwned(sessionId: string, studentId: string): Promise<typeof learningSessions.$inferSelect> {
    const session = await this.db.db.select().from(learningSessions).where(eq(learningSessions.id, sessionId)).get();
    if (!session) throw Errors.notFound("الجلسة غير موجودة");
    if (session.studentId !== studentId) throw Errors.forbidden("لا يمكن الوصول إلى جلسات الآخرين");
    return session;
  }

  async list(studentId: string) {
    return this.db.db.select().from(learningSessions).where(eq(learningSessions.studentId, studentId)).orderBy(asc(learningSessions.startedAt));
  }

  async getWithMessages(sessionId: string, studentId: string) {
    const session = await this.getOwned(sessionId, studentId);
    const msgs = await this.db.db.select().from(messages).where(eq(messages.sessionId, sessionId)).orderBy(asc(messages.createdAt));
    return { session, messages: msgs };
  }

  /** The full vertical slice: user message → tutor turn → persisted replies. */
  async sendMessage(input: { sessionId: string; studentId: string; content: string }) {
    const session = await this.getOwned(input.sessionId, input.studentId);
    if (session.status !== "active") throw Errors.badRequest("الجلسة منتهية — ابدأ جلسة جديدة", "SESSION_ENDED");

    const content = input.content.trim().slice(0, 4000);
    if (content.length < 1) throw Errors.badRequest("الرسالة فارغة");

    const now = new Date();
    const userMessage = await this.db.db
      .insert(messages)
      .values({ id: newId("msg"), sessionId: session.id, role: "user", kind: "text", content, createdAt: now })
      .returning();

    const breadcrumb = session.lessonId
      ? await this.curriculum.lessonBreadcrumb(session.lessonId)
      : null;
    if (!breadcrumb) throw Errors.badRequest("جلسة بدون درس غير مدعومة بعد — ابدأ جلسة من درس محدد", "NO_LESSON");

    const studentRow = await this.db.db.select().from(studentsTable).where(eq(studentsTable.id, session.studentId)).get();
    if (!studentRow) throw Errors.internal("بروفايل الطالب مفقود");

    const result = await this.tutor.handle({
      student: studentRow,
      session,
      question: content,
      breadcrumb,
      userId: studentRow.userId,
    });

    const kind = mapKind(result.reply);
    const tutorMessage = await this.db.db
      .insert(messages)
      .values({
        id: newId("msg"),
        sessionId: session.id,
        role: "tutor",
        kind,
        content: result.reply.content,
        createdAt: new Date(),
      })
      .returning();

    return {
      userMessage: userMessage[0]!,
      tutorMessage: tutorMessage[0]!,
      contextChunkCount: result.contextChunkCount,
      remainingBudget: await this.remainingDaily(userIdOf(studentRow)),
      safetyTripwire: result.intent.intent === "admin_bypass_attempt",
    };
  }

  async end(sessionId: string, studentId: string, reason = "user_request"): Promise<void> {
    const session = await this.getOwned(sessionId, studentId);
    if (session.status !== "active") return;
    await this.db.db.update(learningSessions).set({ status: "ended", endedAt: new Date(), endedReason: reason }).where(eq(learningSessions.id, session.id));

    // Session recap (feeds long-term memory next session).
    try {
      const msgs = await this.db.db.select().from(messages).where(and(eq(messages.sessionId, session.id), eq(messages.role, "user"))).orderBy(asc(messages.createdAt));
      const summary = summarizeSession(msgs.map((m) => m.content));
      await this.memory.saveRecap(session.id, summary, []);
    } catch {
      // Recaps are best-effort; never fail session end because of them.
    }
    await this.audit.record({ actorUserId: undefined, action: "session.end", entityType: "learning_session", entityId: session.id, afterJson: JSON.stringify({ reason }) });
  }

  private async remainingDaily(userId: string): Promise<number> {
    const limit = config.DAILY_MESSAGE_LIMIT;
    if (limit === 0) return -1;
    const used = await this.ai.usage.countTutorCallsForUserToday(userId);
    return Math.max(0, limit - used);
  }
}

function mapKind(reply: { parts?: Array<{ type: "text" | "hint" | "question" | "example" }> }): "text" | "hint" | "question" | "example" {
  const hint = reply.parts?.find((p) => p.type === "hint");
  if (hint) return "hint";
  const q = reply.parts?.find((p) => p.type === "question");
  if (q) return "question";
  const ex = reply.parts?.find((p) => p.type === "example");
  if (ex) return "example";
  return "text";
}

function userIdOf(student: { userId: string }): string {
  return student.userId;
}

function summarizeSession(contents: string[]): string {
  if (contents.length === 0) return "لم يُطرح أسئلة.";
  const joined = contents.join(" ").slice(0, 300);
  return `نقاط نوقشت: ${joined}`;
}