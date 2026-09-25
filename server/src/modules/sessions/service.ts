import { and, asc, eq, inArray } from "drizzle-orm";
import { config } from "../../config/env.js";
import type { Db } from "../../db/index.js";
import { assessments, concepts as conceptsTable, learningSessions, messageAttachments, messages, students as studentsTable } from "../../db/schema.js";
import { newId } from "../../utils/ids.js";
import { Errors } from "../../utils/errors.js";
import { safeParseAssessment } from "../progress/mastery.js";
import {
  buildRecapMetadataBlock,
  buildSessionRecap,
  parseRecap,
  RECAP_SYSTEM_RULES,
  type RecapConceptEntry,
  type SessionRecap,
  type SessionRecapMetadata,
} from "./recap.js";
import type { AchievementEvent } from "../achievements/service.js";
import type { AchievementService } from "../achievements/service.js";
import type { SubscriptionService } from "../subscription/service.js";
import type { DocumentInput, ImageInput } from "../ai/types.js";
import type { CurriculumService } from "../curriculum/service.js";
import type { MemoryService } from "../tutor/memoryService.js";
import type { TutorEngine } from "../tutor/tutorEngine.js";
import type { AuditService } from "../audit/service.js";
import type { AiService } from "../ai/aiService.js";
import { OcrService, OCR_ELIGIBLE_MIMES } from "../ocr/service.js";
import { parseImageDataUrl } from "./attachments.js";
import { parseDocumentDataUrl } from "./documents.js";

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
    private readonly ocr: OcrService,
    private readonly subscriptions: SubscriptionService,
    private readonly achievements: AchievementService,
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
    const [msgs, attachments] = await Promise.all([
      this.db.db.select().from(messages).where(eq(messages.sessionId, sessionId)).orderBy(asc(messages.createdAt)),
      this.db.db.select().from(messageAttachments).where(eq(messageAttachments.sessionId, sessionId)),
    ]);
    const byMessage = new Map<string, AttachmentSummary[]>();
    for (const a of attachments) {
      const list = byMessage.get(a.messageId) ?? [];
      list.push(attachmentSummary(a, undefined, a.ocrApplied ?? false));
      byMessage.set(a.messageId, list);
    }
    return { session, messages: msgs.map((m) => ({ ...m, attachments: byMessage.get(m.id) ?? [] })) };
  }

  /** The full vertical slice: user message (+optional photo/file) → tutor turn → persisted replies. */
  async sendMessage(input: {
    sessionId: string;
    studentId: string;
    content?: string;
    image?: { dataUrl: string; fileName?: string };
    document?: { dataUrl: string; fileName?: string };
  }) {
    const session = await this.getOwned(input.sessionId, input.studentId);
    if (session.status !== "active") throw Errors.badRequest("الجلسة منتهية — ابدأ جلسة جديدة", "SESSION_ENDED");

    if (input.image && input.document) {
      throw Errors.badRequest("أرفِق صورةً واحدةً أو ملفًا واحدًا وليس كلاهما", "MULTIPLE_ATTACHMENTS");
    }

    const content = (input.content ?? "").trim().slice(0, 4000);
    const image = input.image
      ? parseImageDataUrl(input.image.dataUrl, { maxBytes: config.MAX_IMAGE_KB * 1024, fileName: input.image.fileName })
      : null;
    const document = input.document
      ? await parseDocumentDataUrl(input.document.dataUrl, {
          maxBytes: config.MAX_FILE_KB * 1024,
          maxChars: config.MAX_DOCUMENT_CHARS,
          fileName: input.document.fileName,
        })
      : null;
    if (content.length < 1 && !image && !document) throw Errors.badRequest("الرسالة فارغة");

    const studentRow = await this.db.db.select().from(studentsTable).where(eq(studentsTable.id, session.studentId)).get();
    if (!studentRow) throw Errors.internal("بروفايل الطالب مفقود");

    // PHASE 19 — OCR: a scanned PDF/DOCX with no text layer falls back to page
    // recognition through the AI OCR provider. The recognized text travels
    // exactly like extracted document text downstream (bounded by
    // MAX_OCR_CHARS, tripwire re-scanned, unused when empty).
    let documentText = document ? document.text : "";
    let ocrUsed = false;
    let ocrTruncated = false;
    if (document && documentText.trim().length === 0 && OCR_ELIGIBLE_MIMES.has(document.mimeType)) {
      const recognized = await this.ocr.recognize({
        mimeType: document.mimeType,
        base64: document.base64,
        fileName: document.fileName,
        maxChars: config.MAX_OCR_CHARS,
        contextUserId: studentRow.userId,
        contextSessionId: session.id,
      });
      if (recognized.text.trim().length > 0) {
        documentText = recognized.text;
        ocrUsed = true;
        ocrTruncated = recognized.truncated;
      }
    }
    const docInfo = document ? { text: documentText, truncated: ocrUsed ? ocrTruncated : document.truncated } : null;

    const now = new Date();
    const userMessage = (
      await this.db.db
        .insert(messages)
        .values({ id: newId("msg"), sessionId: session.id, role: "user", kind: "text", content, createdAt: now })
        .returning()
    )[0]!;

    let attachment: typeof messageAttachments.$inferSelect | null = null;
    if (image) {
      attachment = (
        await this.db.db
          .insert(messageAttachments)
          .values({
            id: newId("att"),
            messageId: userMessage.id,
            sessionId: session.id,
            mimeType: image.mimeType,
            fileName: image.fileName,
            sizeBytes: image.sizeBytes,
            sha256: image.sha256,
            data: image.bytes,
            extractedText: null,
            createdAt: now,
          })
          .returning()
      )[0]!;
    } else if (document) {
      attachment = (
        await this.db.db
          .insert(messageAttachments)
          .values({
            id: newId("att"),
            messageId: userMessage.id,
            sessionId: session.id,
            mimeType: document.mimeType,
            fileName: document.fileName,
            sizeBytes: document.sizeBytes,
            sha256: document.sha256,
            data: document.bytes,
            extractedText: documentText.length > 0 ? documentText : null,
            ocrApplied: ocrUsed,
            createdAt: now,
          })
          .returning()
      )[0]!;
    }

    const breadcrumb = session.lessonId
      ? await this.curriculum.lessonBreadcrumb(session.lessonId)
      : null;
    if (!breadcrumb) throw Errors.badRequest("جلسة بدون درس غير مدعومة بعد — ابدأ جلسة من درس محدد", "NO_LESSON");

    const images: ImageInput[] | undefined = image ? [{ mimeType: image.mimeType, base64: image.base64 }] : undefined;
    const documents: DocumentInput[] | undefined =
      document && documentText.trim().length > 0
        ? [{ fileName: document.fileName, mimeType: document.mimeType, text: documentText }]
        : undefined;
    // PHASE 20 — the daily tutor budget is plan-derived now: free students are
    // capped by DAILY_MESSAGE_LIMIT, premium by PREMIUM_DAILY_MESSAGE_LIMIT (0 = unlimited).
    const dailyLimit = await this.subscriptions.dailyLimitFor(studentRow.id);
    const result = await this.tutor.handle({
      student: studentRow,
      session,
      question: content,
      images,
      documents,
      breadcrumb,
      userId: studentRow.userId,
      dailyLimit,
    });

    const kind = mapKind(result.reply);
    // PHASE 23 — persist the tripwire outcome on the turn so parents/admins can
    // see a safety flag on the activity timeline without ever exposing content.
    const tripwireFired = result.intent.intent === "admin_bypass_attempt";
    const tutorMessage = (
      await this.db.db
        .insert(messages)
        .values({
          id: newId("msg"),
          sessionId: session.id,
          role: "tutor",
          kind,
          content: result.reply.content,
          safetyFlag: tripwireFired ? "prompt_injection" : null,
          createdAt: new Date(),
        })
        .returning()
    )[0]!;

    // PHASE 20 — achievements are best-effort: they never break the turn.
    await this.award(studentRow.id, "user_message");
    if (image) await this.award(studentRow.id, "vision_attached");
    else if (document) await this.award(studentRow.id, "document_attached");

    return {
      userMessage: {
        ...userMessage,
        attachments: attachment ? [attachmentSummary(attachment, docInfo, ocrUsed)] : [],
      },
      tutorMessage: tutorMessage!,
      contextChunkCount: result.contextChunkCount,
      remainingBudget: await this.remainingDaily(studentRow.id, userIdOf(studentRow)),
      safetyTripwire: tripwireFired,
      ocrUsed,
    };
  }

  /** Fetch a message attachment's bytes, enforcing session ownership first. */
  async getAttachment(sessionId: string, studentId: string, attachmentId: string): Promise<typeof messageAttachments.$inferSelect> {
    await this.getOwned(sessionId, studentId);
    const row = await this.db.db
      .select()
      .from(messageAttachments)
      .where(and(eq(messageAttachments.id, attachmentId), eq(messageAttachments.sessionId, sessionId)))
      .get();
    if (!row) throw Errors.notFound("المرفق غير موجود");
    return row;
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

    // PHASE 20 — completing sessions feeds the achievement counters (best-effort).
    await this.award(studentId, "session_ended");
  }

  /**
   * PHASE 29 (D-027) — safe session recap for the student (and, via the parent
   * service, for a linked parent). The AI is given METADATA ONLY — lesson and
   * concept titles + counters — never message content. The no-verbatim guard
   * then rejects any output that reproduces a message body, falling back to a
   * deterministic structured recap so a safe view always exists. An empty
   * session (no messages at all) yields `null`.
   */
  async recap(sessionId: string, studentId: string, actorUserId: string): Promise<SessionRecap | null> {
    const session = await this.getOwned(sessionId, studentId);
    const [msgs, atts] = await Promise.all([
      this.db.db.select().from(messages).where(eq(messages.sessionId, session.id)).orderBy(asc(messages.createdAt)),
      this.db.db.select({ id: messageAttachments.id }).from(messageAttachments).where(eq(messageAttachments.sessionId, session.id)),
    ]);

    let userMessages = 0;
    let tutorMessages = 0;
    let safetyFlagged = 0;
    const bodies: string[] = [];
    for (const m of msgs) {
      if (m.role === "user") {
        userMessages++;
        bodies.push(m.content);
      } else if (m.role === "tutor") {
        tutorMessages++;
        bodies.push(m.content);
      }
      if (m.safetyFlag) safetyFlagged++;
    }
    if (userMessages + tutorMessages === 0) return null;

    let lessonTitle: string | null = null;
    if (session.lessonId) {
      const breadcrumb = await this.curriculum.lessonBreadcrumb(session.lessonId);
      lessonTitle = breadcrumb.lesson.title;
    }
    const endedAt = session.endedAt ?? new Date();
    const durationMinutes = Math.max(0, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60000));
    const concepts = await this.sessionConcepts(session.id);

    const meta: SessionRecapMetadata = {
      lessonTitle,
      durationMinutes,
      userMessages,
      tutorMessages,
      attachmentCount: atts.length,
      safetyFlagged,
      concepts,
    };

    const response = await this.ai.complete({
      operation: "recap",
      messages: [
        { role: "system", content: RECAP_SYSTEM_RULES },
        {
          role: "user",
          content: `${buildRecapMetadataBlock(meta)}\n\nبناءً على البيانات الوصفية أعلاه فقط، أخرج ملخص الجلسة كـ JSON خالص.`,
        },
      ],
      json: true,
      contextUserId: actorUserId,
      contextSessionId: session.id,
    });

    return buildSessionRecap(meta, parseRecap(response.content), bodies);
  }

  /** Concepts assessed inside a session (assessments rows carry sessionId). */
  private async sessionConcepts(sessionId: string): Promise<RecapConceptEntry[]> {
    const rows = await this.db.db.select().from(assessments).where(eq(assessments.sessionId, sessionId));
    const tally = new Map<string, { attempts: number; correct: number }>();
    for (const row of rows) {
      const parsed = safeParseAssessment(row.resultJson);
      if (!parsed?.conceptId) continue;
      const entry = tally.get(parsed.conceptId) ?? { attempts: 0, correct: 0 };
      entry.attempts += 1;
      entry.correct += parsed.correct ? 1 : 0;
      tally.set(parsed.conceptId, entry);
    }
    if (tally.size === 0) return [];
    const conceptIds = [...tally.keys()];
    const titleRows = await this.db.db.select().from(conceptsTable).where(inArray(conceptsTable.id, conceptIds));
    const titleFor = new Map(titleRows.map((c) => [c.id, c.title]));
    return [...tally.entries()].map(([conceptId, t]) => ({
      title: titleFor.get(conceptId) ?? "مفهوم",
      attempts: t.attempts,
      correct: t.correct,
    }));
  }

  private async remainingDaily(studentId: string, userId: string): Promise<number> {
    const limit = await this.subscriptions.dailyLimitFor(studentId);
    if (limit === 0) return -1;
    const used = await this.ai.usage.countTutorCallsForUserToday(userId);
    return Math.max(0, limit - used);
  }

  /** Best-effort achievement evaluation — failures must never break the flow. */
  private async award(studentId: string, event: AchievementEvent): Promise<void> {
    try {
      await this.achievements.evaluate(studentId, event);
      // PHASE 32 — any learning activity also refreshes the daily streak.
      await this.achievements.evaluateStreak(studentId);
    } catch {
      // gamification is optional behavior; a DB hiccup must not fail a turn.
    }
  }
}

export interface AttachmentSummary {
  id: string;
  messageId: string;
  mimeType: string;
  fileName: string | null;
  sizeBytes: number;
  /** Document attachments only: extracted text length (0 when no text was extracted). */
  textChars?: number;
  /** Document attachments only: true when the text was cut to the chars budget. */
  truncated?: boolean;
  /** Document attachments only: true when the text came from OCR (scanned file). */
  ocr?: boolean;
}

function attachmentSummary(
  row: { id: string; messageId: string; mimeType: string; fileName: string | null; sizeBytes: number },
  document?: { text: string; truncated: boolean } | null,
  ocr = false,
): AttachmentSummary {
  return {
    id: row.id,
    messageId: row.messageId,
    mimeType: row.mimeType,
    fileName: row.fileName,
    sizeBytes: row.sizeBytes,
    ...(document ? { textChars: document.text.length, truncated: document.truncated } : {}),
    ...(ocr ? { ocr: true } : {}),
  };
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