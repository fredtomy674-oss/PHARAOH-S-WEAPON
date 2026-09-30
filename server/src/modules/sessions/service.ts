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
import { stageForLesson } from "../curriculum/bookStage.js";
import type { MemoryService } from "../tutor/memoryService.js";
import type { TutorEngine } from "../tutor/tutorEngine.js";
import type { AuditService } from "../audit/service.js";
import type { AiService } from "../ai/aiService.js";
import { OcrService, OCR_ELIGIBLE_MIMES } from "../ocr/service.js";
import { SpeechService } from "../ai/speech/service.js";
import type { SpeechResult } from "../ai/speech/types.js";
import { resolveTutorLanguage } from "../tutor/language.js";
import { parseImageDataUrl } from "./attachments.js";
import { parseDocumentDataUrl } from "./documents.js";
import { parseStoredWidgets, PinPlacementSchema, widgetsForWire, type NumberLineView } from "../tutor/widgets.js";

export interface StartSessionInput {
  studentId: string;
  curriculumId: string;
  gradeId: string;
  subjectId: string;
  lessonId?: string;
}

/** A stored message, as the API returns it (never the raw row alone). */
type StoredMessage = typeof messages.$inferSelect;

/**
 * A tutor message as the API returns it: the stored row with the page
 * references already decoded. The stored column is text; the wire format is
 * numbers, so the raw column is replaced rather than intersected.
 *
 * PHASE 51 — same treatment for widgets: stored with answer keys, sent without
 * them (the exercise must not answer itself in devtools).
 */
export type TutorMessageOut = Omit<StoredMessage, "bookPages" | "widgets"> & {
  bookPages?: number[];
  widgets?: NumberLineView[];
};

/** What one student turn is made of (identical for the buffered and live paths). */
export interface SendMessageInput {
  sessionId: string;
  studentId: string;
  content?: string;
  image?: { dataUrl: string; fileName?: string };
  document?: { dataUrl: string; fileName?: string };
  /**
   * PHASE 48 — the printed book page the student is looking at when he sends
   * this message (the room's stage). Lets the tutor read the same page.
   * Validated against *this lesson's own* page range below: a client that
   * sends page 900 gets ignored, never an error — a stale room must not be able
   * to break the conversation.
   */
  bookPage?: number;
  /**
   * PHASE 50 — «لوح الحبر»: the page the student *drew on*.
   *
   * `dataUrl` is the printed page as he marked it (page + his own strokes), so
   * the tutor sees literally what the student sees plus the finger-drawn marks
   * over it — the one thing that turns "which page?" into "which part of it?".
   * `page`/`strokes` are the student's claim about what he marked; the page is
   * re-checked against the lesson's own range exactly like `bookPage`, and the
   * stroke count is a fact the record keeps for the audit, never trust.
   */
  ink?: { dataUrl: string; page?: number; strokes?: number };
  /**
   * PHASE 51 — the pin the student placed on the number line, asking for
   * verification. Only the value travels: which line it belongs to and what
   * the correct position is are resolved from the stored transcript, so a
   * forged client cannot grade itself correct.
   */
  widget?: { value: number };
}

/** The completed turn, exactly as the buffered endpoint has always returned it. */
export interface TurnResult {
  userMessage: StoredMessage & { attachments: AttachmentSummary[] };
  tutorMessage: TutorMessageOut;
  contextChunkCount: number;
  citedBookPages: number[];
  remainingBudget: number;
  safetyTripwire: boolean;
  ocrUsed: boolean;
}

/**
 * PHASE 49 — the live view of a turn, as one JSON object per line (NDJSON).
 *
 * `done` repeats the buffered endpoint's whole payload, so the client can end
 * up in exactly the state it would have reached without streaming. The deltas
 * in between are a *preview*: they can be withdrawn (`discard`) and they are
 * always replaced by `done`.
 */
export type TutorStreamEvent =
  | { type: "user"; message: StoredMessage & { attachments: AttachmentSummary[] } }
  | { type: "delta"; text: string }
  | { type: "discard" }
  | ({ type: "done" } & TurnResult)
  | { type: "error"; message: string };

/** Hooks the streaming path uses to observe a turn it does not orchestrate. */
interface TurnHooks {
  /** Fires as soon as the student's own message is stored, before generation. */
  onUserMessage?: (message: StoredMessage & { attachments: AttachmentSummary[] }) => void;
  /** A slice of the tutor's reply that is safe to display. */
  onDelta?: (text: string) => void | Promise<void>;
  /** Whatever was displayed was an internal echo and must be taken back. */
  onDiscard?: () => void | Promise<void>;
}

/**
 * PHASE 48 — read back the stored page references of a tutor message.
 *
 * Defensive on purpose: this is text a previous process wrote. A corrupt or
 * hand-edited row must degrade to "no page references" (a reply with no chips),
 * never to a 500 that costs the student his whole session history.
 */
function parseBookPages(raw: string | null): number[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    const pages = parsed.filter((n): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0);
    return pages.length > 0 ? pages : undefined;
  } catch {
    return undefined;
  }
}

/**
 * PHASE 48/50 — trust a printed page number only when it is a page this lesson
 * actually owns.
 *
 * Two callers with one rule: the open page (`bookPage`) and the marked page
 * (`ink.page`). Silent ignore, never a 400: a room can be a turn stale, and a
 * stale or forged page must never block the student's question. A lesson with no
 * rasterized book has no range, so nothing is ever believed.
 */
export function resolveBookPage(
  stage: { fromBookPage: number; toBookPage: number } | null,
  page: number | undefined,
): number | undefined {
  if (!stage || page === undefined) return undefined;
  return page >= stage.fromBookPage && page <= stage.toBookPage ? page : undefined;
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
    private readonly speech: SpeechService,
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
    return {
      session,
      // PHASE 48 — the page references are stored with the message, so the room
      // can rebuild the tutor's page chips for a session it re-opened.
      // PHASE 51 — same for number lines: stored with keys, re-read without.
      messages: msgs.map((m) => ({
        ...m,
        attachments: byMessage.get(m.id) ?? [],
        bookPages: parseBookPages(m.bookPages),
        widgets: widgetsForWire(parseStoredWidgets(m.widgets)),
      })),
    };
  }

  /**
   * The full vertical slice: user message (+optional photo/file) → tutor turn → persisted replies.
   */
  async sendMessage(input: SendMessageInput) {
    return this.runTurn(input, {});
  }

  /**
   * PHASE 49 — the same turn, delivered as it happens.
   *
   * Not a second implementation: `runTurn` is the only place a turn is
   * orchestrated, and this just supplies the hooks. That matters because the two
   * paths must never disagree about what a turn *is* — the budget check, the
   * attachment rules, the safety tripwire and what gets stored are one
   * implementation, not two that drift.
   *
   * Errors travel in-band as an `error` event: the response has already started
   * by the time most failures can happen (the user's own message is stored
   * before the tutor is asked), so a status code is no longer available. The
   * room renders the same message it renders for a failed request.
   */
  async streamMessage(input: SendMessageInput, emit: (event: TutorStreamEvent) => void): Promise<void> {
    try {
      const result = await this.runTurn(input, {
        onUserMessage: (message) => emit({ type: "user", message }),
        onDelta: (text) => emit({ type: "delta", text }),
        onDiscard: () => emit({ type: "discard" }),
      });
      emit({
        type: "done",
        userMessage: result.userMessage,
        tutorMessage: result.tutorMessage,
        contextChunkCount: result.contextChunkCount,
        citedBookPages: result.citedBookPages,
        remainingBudget: result.remainingBudget,
        safetyTripwire: result.safetyTripwire,
        ocrUsed: result.ocrUsed,
      });
    } catch (err) {
      emit({ type: "error", message: err instanceof Error ? err.message : "تعذّر إتمام الدور" });
    }
  }

  private async runTurn(input: SendMessageInput, hooks: TurnHooks): Promise<TurnResult> {
    const session = await this.getOwned(input.sessionId, input.studentId);
    if (session.status !== "active") throw Errors.badRequest("الجلسة منتهية — ابدأ جلسة جديدة", "SESSION_ENDED");

    if (input.image && input.document) {
      throw Errors.badRequest("أرفِق صورةً واحدةً أو ملفًا واحدًا وليس كلاهما", "MULTIPLE_ATTACHMENTS");
    }
    // PHASE 50 — an ink turn already carries a picture (the page as marked), so a
    // photo on top of it would be a second visual input the tutor cannot tell
    // apart. One visual per turn, and the database enforces it too: the unique
    // attachment index is per message.
    if (input.image && input.ink) {
      throw Errors.badRequest("أرفِق صورةً واحدةً: امسح على الصفحة أو صوّر سؤالك، لا الاثنين معًا", "MULTIPLE_ATTACHMENTS");
    }

    const content = (input.content ?? "").trim().slice(0, 4000);
    const image = input.image
      ? parseImageDataUrl(input.image.dataUrl, { maxBytes: config.MAX_IMAGE_KB * 1024, fileName: input.image.fileName })
      : null;
    const ink = input.ink
      ? parseImageDataUrl(input.ink.dataUrl, { maxBytes: config.MAX_IMAGE_KB * 1024 })
      : null;
    const document = input.document
      ? await parseDocumentDataUrl(input.document.dataUrl, {
          maxBytes: config.MAX_FILE_KB * 1024,
          maxChars: config.MAX_DOCUMENT_CHARS,
          fileName: input.document.fileName,
        })
      : null;
    // PHASE 51 — the pin value travels as a fact for the prompt, resolved
    // against the transcript's line by the engine. An unparseable pin is not a
    // reason to fail the turn: the typed question still stands on its own.
    const pin = PinPlacementSchema.safeParse(input.widget).success ? input.widget! : undefined;
    if (content.length < 1 && !image && !ink && !document && !pin) throw Errors.badRequest("الرسالة فارغة");

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

    // PHASE 48/50 — which pages of the Ministry book this turn is about, resolved
    // BEFORE anything is written: the marked page is stored *on* the attachment,
    // and a session without a lesson must fail without leaving a half-turn behind.
    const breadcrumb = session.lessonId
      ? await this.curriculum.lessonBreadcrumb(session.lessonId)
      : null;
    if (!breadcrumb) throw Errors.badRequest("جلسة بدون درس غير مدعومة بعد — ابدأ جلسة من درس محدد", "NO_LESSON");
    // PHASE 20 — the daily tutor budget is plan-derived now: free students are
    // capped by DAILY_MESSAGE_LIMIT, premium by PREMIUM_DAILY_MESSAGE_LIMIT (0 = unlimited).
    const dailyLimit = await this.subscriptions.dailyLimitFor(studentRow.id);
    // The stage is the lesson's own page range; every page claim is checked against
    // it by one shared rule (see resolveBookPage).
    const stage = stageForLesson(breadcrumb.curriculum.code, breadcrumb.lesson.code);
    const viewingPage = resolveBookPage(stage, input.bookPage);
    // PHASE 50 — the page the student's own marks are on, resolved by the same
    // rule. An unmarked page (no stage, or a page this lesson does not own) is
    // not a lie to punish: the marks still travel as a picture.
    const inkPage = resolveBookPage(stage, input.ink?.page);
    const strokeCount = ink ? clampStrokes(input.ink?.strokes) : 0;

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
    } else if (ink) {
      attachment = (
        await this.db.db
          .insert(messageAttachments)
          .values({
            id: newId("att"),
            messageId: userMessage.id,
            sessionId: session.id,
            mimeType: ink.mimeType,
            // A readable name is the difference between an auditable record and a
            // wall of hashes — this attachment *is* a page of the Ministry book.
            fileName: inkBookName(inkPage),
            sizeBytes: ink.sizeBytes,
            sha256: ink.sha256,
            data: ink.bytes,
            extractedText: null,
            inkPage: inkPage ?? null,
            inkStrokes: strokeCount,
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

    // PHASE 49 — the student's own words are already stored, so the room can
    // show them immediately and the wait belongs to the tutor alone.
    if (hooks.onUserMessage) {
      hooks.onUserMessage({
        ...userMessage,
        attachments: attachment ? [attachmentSummary(attachment, docInfo, ocrUsed)] : [],
      });
    }

    // PHASE 50 — an ink turn reaches the model as a picture too: the bytes are
    // the printed page with the student's marks on it, which is exactly what the
    // tutor needs to see. It is one vision input, not a photo plus an image.
    const pictures = image ?? ink;
    const images: ImageInput[] | undefined = pictures ? [{ mimeType: pictures.mimeType, base64: pictures.base64 }] : undefined;
    const documents: DocumentInput[] | undefined =
      document && documentText.trim().length > 0
        ? [{ fileName: document.fileName, mimeType: document.mimeType, text: documentText }]
        : undefined;
    const result = await this.tutor.handle({
      student: studentRow,
      session,
      question: content,
      images,
      documents,
      breadcrumb,
      userId: studentRow.userId,
      dailyLimit,
      viewingPage,
      ...(ink ? { ink: { bookPage: inkPage, strokes: strokeCount } } : {}),
      ...(pin ? { widget: pin } : {}),
      // Only when the caller can actually show progress; the buffered endpoint
      // omits it and gets the exact behaviour it has always had.
      ...(hooks.onDelta ? { stream: { onDelta: hooks.onDelta, onDiscard: hooks.onDiscard } } : {}),
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
          bookPages: result.citedBookPages.length > 0 ? JSON.stringify(result.citedBookPages) : null,
          // PHASE 51 — the lines this reply drew, keys intact for verification.
          widgets: result.widgets.length > 0 ? JSON.stringify(result.widgets) : null,
          createdAt: new Date(),
        })
        .returning()
    )[0]!;

    // PHASE 20 — achievements are best-effort: they never break the turn.
    await this.award(studentRow.id, "user_message");
    // PHASE 50 — a marked-up page is an image attachment, and the "photographer"
    // counter counts image rows, so the ink turn earns the same badge a photo does.
    if (image || ink) await this.award(studentRow.id, "vision_attached");
    else if (document) await this.award(studentRow.id, "document_attached");

    return {
      userMessage: {
        ...userMessage,
        attachments: attachment ? [attachmentSummary(attachment, docInfo, ocrUsed)] : [],
      },
      // PHASE 51 — the wire view strips the answer keys (see TutorMessageOut).
      tutorMessage: {
        ...tutorMessage!,
        bookPages: parseBookPages(tutorMessage!.bookPages),
        widgets: widgetsForWire(parseStoredWidgets(tutorMessage!.widgets)),
      },
      contextChunkCount: result.contextChunkCount,
      // PHASE 48 — the pages this answer is built on, so the room can offer
      // them as one-tap jumps on the shared stage.
      citedBookPages: result.citedBookPages,
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

  /**
   * PHASE 40 (D-044) — the audio for reading one of the student's own tutor
   * replies aloud.
   *
   * The client sends *ids*, never text: the server reads the stored reply, so a
   * student can never make the (paid) server voice say arbitrary text, and the
   * audio can never disagree with the bubble above it. Ownership comes from
   * `getOwned`; the language is the same one the tutor wrote in (D-042), so
   * what is read matches what is written without the client asking.
   */
  async speechForMessage(sessionId: string, studentId: string, messageId: string): Promise<SpeechResult> {
    const session = await this.getOwned(sessionId, studentId);
    const message = await this.db.db.select().from(messages).where(eq(messages.id, messageId)).get();
    if (!message || message.sessionId !== session.id) throw Errors.notFound("الرسالة غير موجودة");
    if (message.role !== "tutor") throw Errors.badRequest("يمكن نطق ردود المعلم فقط", "NOT_TUTOR_MESSAGE");

    // A session started without a lesson has no subject to resolve: Arabic, the
    // product default (same fallback as the tutor itself).
    const language = session.lessonId
      ? resolveTutorLanguage((await this.curriculum.lessonBreadcrumb(session.lessonId)).subject)
      : "ar";
    return this.speech.synthesize({ text: message.content, language });
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

    // PHASE 33 — ending a lesson session refreshes EXPOSURE recency for the
    // lesson's concepts (existing progress rows only; mastery unchanged), so
    // the practice plan and mastery display reflect that the material was just
    // studied. Best-effort like recaps: never fail the end call.
    if (session.lessonId) {
      try {
        const lessonConcepts = await this.db.db
          .select({ id: conceptsTable.id })
          .from(conceptsTable)
          .where(eq(conceptsTable.lessonId, session.lessonId));
        await this.memory.touchConceptRecency(
          session.studentId,
          lessonConcepts.map((c) => c.id),
          session.endedAt ?? new Date(),
        );
      } catch {
        // Recency refresh is optional behavior; a hiccup must not fail the end.
      }
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
  /**
   * PHASE 50 — ink attachments only: the printed book page the student marked,
   * so the transcript can say *which* page he drew on rather than showing a
   * picture of a page with no name.
   */
  inkPage?: number;
  /** PHASE 50 — ink attachments only: how many strokes the student drew. */
  inkStrokes?: number;
}

function attachmentSummary(
  row: {
    id: string;
    messageId: string;
    mimeType: string;
    fileName: string | null;
    sizeBytes: number;
    inkPage?: number | null;
    inkStrokes?: number | null;
  },
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
    ...(row.inkPage !== undefined && row.inkPage !== null ? { inkPage: row.inkPage } : {}),
    ...(row.inkStrokes !== undefined && row.inkStrokes !== null ? { inkStrokes: row.inkStrokes } : {}),
  };
}

/**
 * PHASE 50 — how many strokes the client claims. Bounded because it is stored
 * and shown in Arabic prose inside the prompt: an unbounded client number would
 * be a student's own text injected into the tutor's instructions.
 */
const MAX_INK_STROKES = 200;

function clampStrokes(strokes: number | undefined): number {
  if (strokes === undefined || !Number.isFinite(strokes)) return 0;
  return Math.max(0, Math.min(MAX_INK_STROKES, Math.round(strokes)));
}

/** A readable file name for a marked-up page — the record should read like a lesson. */
function inkBookName(inkPage: number | undefined): string {
  return inkPage === undefined ? "صفحة-مُعلَّمة.jpg" : `صفحة-${inkPage}-مُعلَّمة.jpg`;
}


function mapKind(reply: { parts?: Array<{ type: "text" | "hint" | "question" | "example" | "widget" }> }): "text" | "hint" | "question" | "example" {
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