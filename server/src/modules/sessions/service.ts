import { and, asc, eq, inArray } from "drizzle-orm";
import { config } from "../../config/env.js";
import type { Db } from "../../db/index.js";
import { assessments, concepts as conceptsTable, learningSessions, messageAttachments, messages, students as studentsTable } from "../../db/schema.js";
import { newId } from "../../utils/ids.js";
import { Errors } from "../../utils/errors.js";
import { safeParseAssessment } from "../progress/mastery.js";
import { parseTeachingAction, type TeachingAction } from "../tutor/teachingActions.js";
import { boardForWire, parseStoredBoard, type TutorBoard } from "../tutor/board.js";
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
import { readPageImage, stageForLesson } from "../curriculum/bookStage.js";
import type { MemoryService } from "../tutor/memoryService.js";
import type { TutorEngine } from "../tutor/tutorEngine.js";
import type { AuditService } from "../audit/service.js";
import type { AiService } from "../ai/aiService.js";
import { OcrService, OCR_ELIGIBLE_MIMES } from "../ocr/service.js";
import { SpeechService } from "../ai/speech/service.js";
import type { SpeechLanguage, SpeechResult } from "../ai/speech/types.js";
import { ProgressNarrator, type ProgressStreamEvent } from "../ai/speech/progressNarrator.js";
import { resolveTutorLanguage } from "../tutor/language.js";
import { parseImageDataUrl } from "./attachments.js";
import { parseDocumentDataUrl } from "./documents.js";
import { stripMarkdownForSpeech } from "../ai/speech/stripMarkdown.js";
import { PEDAGOGICAL_CLOSE_LABELS } from "../tutor/pedagogicalClose.js";
import { applyPronunciation } from "../tutor/pronunciation.js";
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
export type TutorMessageOut = Omit<StoredMessage, "bookPages" | "widgets" | "teachingAction" | "questionAnswer" | "board"> & {
  bookPages?: number[];
  widgets?: NumberLineView[];
  /**
   * PHASE 93/95 — the typed teaching action this tutor turn performed, decoded
   * from the stored JSON (never raw). Absent on a row that predates the column
   * or on a non-teaching message.
   */
  teachingAction?: TeachingAction;
  /**
   * PHASE 166 — what this reply wrote on the classroom board (title + short
   * lines), decoded from the stored JSON. Absent when the turn wrote nothing.
   */
  board?: TutorBoard;
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
  /**
   * PHASE 57 — progressive server narration: synthesize and stream each sentence
   * of the tutor's reply as it is written, so the student hears the first words
   * in ~3s instead of waiting ~7s for the whole reply's audio.
   *
   * Enabled by the client only for voice-question turns (a turn the student
   * expects to be spoken). Never required: the flag is a hint, and a server
   * without a speech provider simply ignores it — the room falls back to the
   * browser voice or the on-demand 🔊 path.
   */
  speakReply?: boolean;
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
  /**
   * PHASE 57 — one playable piece of the reply's voice, in sentence order.
   *
   * `seq` starts at 0 and increases by one, and the client must play the pieces
   * in that order: the server synthesizes them in parallel and releases them by
   * sequence, so a later sentence never overtakes an earlier one. The bytes are
   * a complete WAV, playable on its own — which is what lets the student hear
   * the first sentence while the rest of the answer is still being written.
   */
  | { type: "audio"; seq: number; base64: string; mimeType: string }
  /** The last piece has been sent; `ok:false` means the server had no usable voice. */
  | { type: "audio-end"; ok: boolean }
  | { type: "discard" }
  | ({ type: "done" } & TurnResult)
  | { type: "error"; message: string };

/** What reading one stored reply aloud needs: its words and its language. */
interface SpeechPlan {
  content: string;
  language: SpeechLanguage;
}

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
 * PHASE 146 — the teacher's answer key is SERVER-ONLY. The stored row carries it
 * (the engine grades the next turn against it), but the API must never: a key in
 * devtools is an exercise that answers itself. Same rule as the widget keys
 * (PHASE 51) — dropped on the way out, always, never conditionally.
 */
function withoutQuestionAnswer<T extends { questionAnswer?: string | null }>(row: T): Omit<T, "questionAnswer"> {
  const { questionAnswer: _questionAnswer, ...rest } = row;
  return rest;
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
 * PHASE 93/95 — read back the stored teaching action of a tutor message
 * (validated by zod on the way out). Same defensive rule as `parseBookPages`:
 * corrupt text degrades to "no action", never to a 500.
 */
function parseTeachingActionStored(raw: string | null): TeachingAction | undefined {
  if (!raw) return undefined;
  try {
    return parseTeachingAction(JSON.parse(raw)) ?? undefined;
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
  stage: { fromBookPage: number; toBookPage: number; pages?: { bookPage: number }[] } | null,
  page: number | undefined,
): number | undefined {
  if (!stage || page === undefined) return undefined;
  // PHASE 75 — a lesson's stage can reach beyond its own printed range (the
  // Arabic listening appendix), so membership in the lesson's page set is the
  // truth when it is known; the range remains the fallback for callers that
  // carry only a range.
  if (stage.pages && stage.pages.length > 0) {
    return stage.pages.some((p) => p.bookPage === page) ? page : undefined;
  }
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
    /**
     * PHASE 57 — where a voice failure is reported.
     *
     * Narration failure is deliberately invisible to the student (the client falls
     * back to the browser voice), which made it invisible to the operator too:
     * measured live, a 🔊 press that ended in `ok:false` logged nothing at all.
     * The minimal shape is declared here rather than importing a logger type, so
     * this module stays framework-agnostic and tests can pass a stub.
     */
    private readonly log: { warn: (details: object, message: string) => void } = { warn: () => {} },
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
      messages: msgs.map((row) => {
        // PHASE 146 — never ship the teacher's answer key (see withoutQuestionAnswer).
        const m = withoutQuestionAnswer(row);
        return {
          ...m,
          attachments: byMessage.get(m.id) ?? [],
          bookPages: parseBookPages(m.bookPages),
          widgets: widgetsForWire(parseStoredWidgets(m.widgets)),
          teachingAction: parseTeachingActionStored(m.teachingAction),
          // PHASE 166 — the board this reply wrote, so a reopened room shows it.
          board: boardForWire(parseStoredBoard(m.board)),
        };
      }),
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
    // PHASE 57 — progressive server narration, wired only when the client asked
    // for it and the server actually has a voice. It runs alongside the turn, not
    // inside it, so the tutor's own work is never delayed or failed by audio.
    //
    // The language is resolved here, from the very same rule the 🔊 route uses
    // (D-042: the tutor writes in the curriculum's language), so the narration
    // and the stored reply can never disagree about which language this is.
    // PHASE 171 — the language resolves *while* the turn runs instead of before
    // it: it needs a session read and a breadcrumb read, and every millisecond
    // spent waiting for them is silence the student hears (the owner's bar is
    // ChatGPT/Grok). The narrator is built the instant the answer exists; text
    // that streams before it is kept and handed over on creation, so nothing is
    // ever spoken twice or lost.
    let narrator: ProgressNarrator | null = null;
    let bufferedNarration = "";
    const languagePromise: Promise<SpeechLanguage | null> =
      input.speakReply && this.speech.available
        ? this.replyLanguage(input.sessionId, input.studentId).catch(() => null)
        : Promise.resolve(null);
    try {
      const turnPromise = this.runTurn(input, {
        onUserMessage: (message) => emit({ type: "user", message }),
        onDelta: (text) => {
          emit({ type: "delta", text });
          if (narrator) narrator.push(text);
          else bufferedNarration += text;
        },
        onDiscard: () => {
          emit({ type: "discard" });
          // Words taken back must not be synthesized: they are not going to be
          // heard, and the corrected answer takes their place.
          bufferedNarration = "";
          narrator?.retract();
        },
      });
      // The rejection is awaited below either way; this only keeps a fast
      // failure from ever looking unhandled while the language resolves.
      void turnPromise.catch(() => undefined);
      const language = await languagePromise;
      if (language) {
        try {
          // Same reason as the 🔊 route: the turn itself always answers, so a
          // voice failure is invisible to the student by design — and invisible
          // to the operator unless it is said here.
          narrator = this.createProgressNarrator(language, emit, (reason) => {
            this.log.warn(
              { err: reason, sessionId: input.sessionId },
              "live narration failed; the client will read the reply with its own voice",
            );
          });
          if (bufferedNarration) {
            narrator.push(bufferedNarration);
            bufferedNarration = "";
          }
        } catch {
          // No language, no narration: the text turn is what matters, and the
          // client keeps whatever fallback it already had.
          narrator = null;
        }
      }
      const result = await turnPromise;
      // PHASE 57 — the text is the answer, so it is released first: `done` carries
      // the stored reply and the room shows it now, without waiting for the voice
      // to catch up. The narration's tail is then awaited here, which keeps the
      // remaining `audio` events on the same response (the route writes lines for
      // as long as this call has not returned) and closes the stream only when the
      // student's last sentence is on the wire.
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
      // Whatever the stream did not reach (the sentence still being written when
      // the reply was stored) is spoken now, so the answer is never left unheard.
      await narrator?.finish(result.tutorMessage.content);
      // PHASE 57 — a client that asked for the voice is told either way. Without
      // this, a deployment with no voice would answer the turn with silence and no
      // way for the room to tell "still coming" from "nothing was ever said" — and
      // the student would simply never hear the answer.
      if (input.speakReply && !narrator) emit({ type: "audio-end", ok: false });
    } catch (err) {
      emit({ type: "error", message: err instanceof Error ? err.message : "تعذّر إتمام الدور" });
    } finally {
      narrator?.dispose();
    }
  }

  /**
   * PHASE 57 — the narrator for one turn: sentence-sized pieces of the reply,
   * synthesized in parallel and emitted *in order* the moment each is ready.
   *
   * It is handed the same `emit` the text uses, so the voice rides the reply's own
   * stream instead of a second request, and the client plays what it receives
   * while the answer is still being written. The class itself owns the guarantees
   * (order, no half-sentences, quiet degradation on a voice failure); this only
   * binds it to the server's voice and the reply's language.
   */
  private createProgressNarrator(
    language: SpeechLanguage,
    emit: (event: ProgressStreamEvent) => void,
    onPieceFailure?: (reason: unknown) => void,
  ): ProgressNarrator {
    return new ProgressNarrator({
      speak: (text) => this.speech.synthesize({ text: applyPronunciation(text, language), language }),
      emit,
      onPieceFailure,
    });
  }

  /**
   * PHASE 57 — the language the tutor answered in, from the session's lesson.
   *
   * One rule, two callers: the 🔊 route (`speechForMessage`) and the progressive
   * narrator ask the same question, so pressing 🔊 and hearing the turn spoken
   * live can never use different dialects. A session started without a lesson has
   * no subject to resolve and answers in Arabic, the product default — the same
   * fallback the tutor itself uses.
   */
  private async replyLanguage(sessionId: string, studentId: string): Promise<SpeechLanguage> {
    const session = await this.getOwned(sessionId, studentId);
    return session.lessonId
      ? resolveTutorLanguage((await this.curriculum.lessonBreadcrumb(session.lessonId)).subject)
      : "ar";
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

    // PHASE 48/W2 — the page of his own book this turn is about is resolved
    // BEFORE anything is written (a session without a lesson must fail without
    // leaving a half-turn behind).
    const breadcrumb = session.lessonId
      ? await this.curriculum.lessonBreadcrumb(session.lessonId)
      : null;
    if (!breadcrumb) throw Errors.badRequest("جلسة بدون درس غير مدعومة بعد — ابدأ جلسة من درس محدد", "NO_LESSON");
    // PHASE 76 — the lesson's concepts in printed order are the teacher's
    // roadmap: it teaches them one at a time and moves on, instead of looping
    // on a single question. A scoped read on the lesson, no model call.
    const lessonConcepts = await this.curriculum.listConcepts(breadcrumb.lesson.id);
    // PHASE 20 — the daily tutor budget is plan-derived now: free students are
    // capped by DAILY_MESSAGE_LIMIT, premium by PREMIUM_DAILY_MESSAGE_LIMIT (0 = unlimited).
    const dailyLimit = await this.subscriptions.dailyLimitFor(studentRow.id);
    // The stage is the lesson's own page range; every page claim is checked against
    // it by one shared rule (see resolveBookPage).
    const stage = stageForLesson(breadcrumb.curriculum.code, breadcrumb.lesson.code);
    const viewingPage = resolveBookPage(stage, input.bookPage);
    // PHASE 50 legacy — a pre-W2 ink turn named the printed page its marks were
    // on; board drawings (W2) carry no page at all. Resolved by the same rule
    // when present: an unknown page is not a lie to punish — the marks still
    // travel as a picture.
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
            // wall of hashes — this attachment *is* the student's own drawing.
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

    // PHASE 186 — the start tap is answered from the stored lesson roadmap.
    // This is deliberately before the vision/document branch: the start button
    // never carries an attachment, and a real question that happens to say the
    // same words still has an attachment-free path here. No retrieval, no model,
    // no daily-budget token spend — just the teacher opening the lesson.
    if (content === LESSON_START_COMMAND && !image && !ink && !document && !pin) {
      const intro = lessonOpening(
        breadcrumb.lesson.title,
        lessonConcepts.map((c) => c.title),
      );
      // Let the room paint the words immediately. The stored `done` event below
      // repeats the same text, which is what the client keeps.
      await hooks.onDelta?.(intro);
      const introMessage = (
        await this.db.db
          .insert(messages)
          .values({
            id: newId("msg"),
            sessionId: session.id,
            role: "tutor",
            kind: "text",
            content: intro,
            createdAt: new Date(),
          })
          .returning()
      )[0]!;
      return {
        userMessage: { ...userMessage, attachments: [] },
        tutorMessage: {
          ...withoutQuestionAnswer(introMessage),
          bookPages: parseBookPages(introMessage.bookPages),
          widgets: widgetsForWire(parseStoredWidgets(introMessage.widgets)),
          teachingAction: parseTeachingActionStored(introMessage.teachingAction),
          board: boardForWire(parseStoredBoard(introMessage.board)),
        },
        contextChunkCount: 0,
        citedBookPages: [],
        remainingBudget: await this.remainingDaily(studentRow.id, userIdOf(studentRow)),
        safetyTripwire: false,
        ocrUsed,
      };
    }

    // PHASE 50/W2 — an ink turn reaches the model as a picture too: the bytes
    // are the board with the student's marks on it, which is exactly what the
    // tutor needs to see. It is one vision input, not a photo plus an image.
    const pictures = image ?? ink;
    // The tutor sees the open book page: with no attached picture but a resolved
    // stage page, the printed page image travels as this turn's vision input, so
    // a question about anything drawn on the page (a picture, a letter's shape
    // or place) is answerable from sight, not from OCR text alone. An attached
    // picture always wins: the two never mix, and the engine is told which one
    // it got (see stageImagePage) so the prompt never claims an upload.
    const stageImagePage = !pictures && viewingPage !== undefined ? viewingPage : undefined;
    const stageImageBytes =
      stageImagePage !== undefined ? readPageImage(breadcrumb.curriculum.code, stageImagePage) : null;
    const images: ImageInput[] | undefined = pictures
      ? [{ mimeType: pictures.mimeType, base64: pictures.base64 }]
      : stageImageBytes
        ? [{ mimeType: "image/jpeg", base64: stageImageBytes.toString("base64") }]
        : undefined;
    const documents: DocumentInput[] | undefined =
      document && documentText.trim().length > 0
        ? [{ fileName: document.fileName, mimeType: document.mimeType, text: documentText }]
        : undefined;
    const result = await this.tutor.handle({
      student: studentRow,
      session,
      question: content,
      images,
      // The stage page the vision image shows (absent for uploads): without it
      // the prompt would misdescribe the book as a student-uploaded photo.
      ...(stageImageBytes && stageImagePage !== undefined ? { stageImagePage } : {}),
      documents,
      breadcrumb,
      userId: studentRow.userId,
      dailyLimit,
      viewingPage,
      // PHASE 75 — the lesson's whole printed page set travels with the turn, so
      // the tutor knows every page of the stage and every page it cites is one
      // the student can actually turn to.
      lessonPages: stage ? stage.pages.map((p) => p.bookPage) : undefined,
      // PHASE 76 — the lesson concepts, so the teacher has a roadmap.
      conceptTitles: lessonConcepts.map((c) => c.title),
      // PHASE 95 — the same roadmap *with ids*, so the engine can derive the
      // concept in focus, its real prerequisite (with the student's mastery) and
      // the next objective — from stored order, never guessed.
      concepts: lessonConcepts.map((c) => ({ id: c.id, title: c.title })),
      // The just-stored question, so history lookups resolve to earlier turns.
      excludeMessageId: userMessage.id,
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
          // PHASE 93/95 — the typed teaching move the engine chose for this turn.
          teachingAction: JSON.stringify(result.teachingAction),
          // PHASE 146 — the teacher's own answer key for the question this reply
          // asked (server-only; stripped from every wire view). The next turn
          // grades the student's answer against it.
          questionAnswer: result.questionAnswer,
          // PHASE 166 — what this reply wrote on the board. No keys live here
          // (the prompt forbids them), so stored and wire share one shape.
          board: result.board ? JSON.stringify(result.board) : null,
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
        ...withoutQuestionAnswer(tutorMessage!),
        bookPages: parseBookPages(tutorMessage!.bookPages),
        widgets: widgetsForWire(parseStoredWidgets(tutorMessage!.widgets)),
        teachingAction: parseTeachingActionStored(tutorMessage!.teachingAction),
        board: boardForWire(parseStoredBoard(tutorMessage!.board)),
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
    const plan = await this.planSpeech(sessionId, studentId, messageId);
    // PHASE 53 — spoken words, not syntax: the stored reply may carry **bold**
    // and lists for the eye, which the voice must not read aloud.
    return this.speech.synthesize({
      text: applyPronunciation(stripMarkdownForSpeech(plan.content), plan.language),
      language: plan.language,
    });
  }

  /**
   * Whether the server can produce audio at all.
   *
   * The streaming 🔊 route asks this *before* it writes a single byte, so a
   * deployment with no voice answers with the same 503 the buffered route does.
   * The client can then go straight to the browser's own voice, instead of opening
   * a stream that could only ever be silent — which the wire would have had to
   * report as a successful stream, because a status code cannot be sent afterwards.
   */
  get speechAvailable(): boolean {
    return this.speech.available;
  }

  /**
   * PHASE 57 — the same reply, resolved for reading aloud: whose reply it is and
   * which language it was written in.
   *
   * Public because the streaming route must resolve it *before* it starts the
   * response (once bytes are on the wire there is no status code left to send, so
   * a wrong id has to arrive as an ordinary 404 the client can fall back from).
   * Ids only, never text (D-044): the student can never make the paid voice say
   * something that is not in his own transcript. The narrator may apply the
   * curated pronunciation layer for the ear (PHASE 188), but the content is
   * always the stored reply.
   *
   * One rule, three callers — this, the buffered 🔊 route, and the turn's own
   * narrator — so a reply can never be read in two different dialects.
   */
  async planSpeech(sessionId: string, studentId: string, messageId: string): Promise<SpeechPlan> {
    const session = await this.getOwned(sessionId, studentId);
    const message = await this.db.db.select().from(messages).where(eq(messages.id, messageId)).get();
    if (!message || message.sessionId !== session.id) throw Errors.notFound("الرسالة غير موجودة");
    if (message.role !== "tutor") throw Errors.badRequest("يمكن نطق ردود المعلم فقط", "NOT_TUTOR_MESSAGE");
    // A session started without a lesson has no subject to resolve: Arabic, the
    // product default (same fallback as the tutor itself).
    const language = session.lessonId
      ? resolveTutorLanguage((await this.curriculum.lessonBreadcrumb(session.lessonId)).subject)
      : "ar";
    return { content: message.content, language };
  }

  /**
   * PHASE 57 — narrates a resolved plan, one sentence at a time, emitting each
   * playable piece as it is synthesized.
   *
   * The caller has already resolved the plan (so authorization failures are
   * ordinary error statuses, not truncated streams) and has already started the
   * response. This is the same narrator the live turn uses, fed a stored reply
   * instead of a stream, which is what makes 🔊 start speaking in about the time
   * the first sentence costs (~3s) instead of after the whole reply (6.9–7.7s
   * measured) — and makes a second press nearly instant, because every sentence
   * is cached individually by the speech service.
   */
  async narrateSpeechPlan(
    plan: SpeechPlan,
    emit: (event: ProgressStreamEvent) => void,
    onPieceFailure?: (reason: unknown) => void,
  ): Promise<void> {
    const narrator = this.createProgressNarrator(plan.language, emit, onPieceFailure);
    try {
      // Nothing was streamed, so the whole reply is the tail: `finish` speaks it
      // in order, in pieces.
      await narrator.finish(plan.content);
    } finally {
      narrator.dispose();
    }
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

/** A readable file name for a drawing — the record should read like a lesson. */
function inkBookName(inkPage: number | undefined): string {
  // Legacy (pre-W2) drawings marked a printed page; board drawings (W2+) name
  // the board itself.
  return inkPage === undefined ? "رسم-على-السبورة.jpg" : `صفحة-${inkPage}-مُعلَّمة.jpg`;
}


/**
 * PHASE 186 — the first tap must answer before the student can doubt the app.
 *
 * The start button sends this exact sentence. It used to take a full tutor turn:
 * retrieval, prompt assembly and a model that can stall for a minute. But the
 * lesson's printed roadmap is already stored, and the opening is a *roadmap*,
 * not a graded answer — so it is composed here, instantly, from the same
 * concept titles the model receives. The next turn still goes through the
 * tutor; this only removes the cold-start wait.
 */
const LESSON_START_COMMAND = "ابدأ الشرح";

export function lessonOpening(title: string, conceptTitles: string[]): string {
  const topics = conceptTitles.map((t) => t.trim()).filter((t) => t.length > 0).slice(0, 4);
  if (topics.length === 0) {
    return `بُصّ يا بطل، درسنا النهارده «${title}». ${PEDAGOGICAL_CLOSE_LABELS.ar}: اكتب سؤالك الأول عن الدرس في سطر واحد، وأنا سأقرأه وأبدأ معك من نقطة فهمك.`;
  }
  const roadmap = topics.map((topic, i) => `${i + 1}. ${topic}`).join("\n");
  return [
    `بُصّ يا بطل، درسنا النهارده «${title}». من أهم محاوره:`,
    roadmap,
    "",
    `نبدأ بأوّل فكرة: «${topics[0]}». ${PEDAGOGICAL_CLOSE_LABELS.ar}: اكتب في دفترك ما تعرفه عن الفكرة الأولى في سطرين، وأنا سأقرأه وأصححه معك قبل أن نبدأ الشرح.`,
  ].join("\n");
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