import { config } from "../../config/env.js";
import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import type { LearningSession, Student } from "../../db/schema.js";
import { messages as messagesTable } from "../../db/schema.js";
import type { AiService } from "../ai/aiService.js";
import type { DocumentInput, ImageInput, LLMMessage } from "../ai/types.js";
import type { CurriculumBreadcrumb } from "../curriculum/service.js";
import { bookPageText, bookPagesInText, loadLessonBookText } from "../curriculum/bookStage.js";
import { ReplyRelay, type ReplyRelayHooks } from "./responseStream.js";
import type { RetrievalService } from "../rag/retrieval.js";
import { Errors } from "../../utils/errors.js";
import { classifyIntent, type TutorIntent } from "./intentClassifier.js";
import { resolveTutorLanguage, type TutorLanguage } from "./language.js";
import { MemoryService } from "./memoryService.js";
import { PromptBuilder } from "./promptBuilder.js";
import { parseTutorResponse, type TutorResponse } from "./responseProcessor.js";
import { looksLikeJsonFragment, looksLikePromptEcho, regenerateEchoes } from "./echoGuard.js";
import {
  parseStoredWidgets,
  snapToStep,
  splitReplyWidgets,
  type NumberLineWidget,
  type PinPlacement,
} from "./widgets.js";

export interface TutorHandleInput {
  student: Student;
  session: LearningSession;
  question: string;
  /** Photos attached to this turn (Vision: a student's photographed question). */
  images?: ImageInput[];
  /** Documents attached to this turn (student-uploaded file, extracted text is untrusted). */
  documents?: DocumentInput[];
  breadcrumb: CurriculumBreadcrumb;
  userId: string;
  /**
   * PHASE 48 — the printed textbook page the student is looking at right now
   * (the lesson room's stage). When present the tutor reads the same page
   * before answering, so it can point at what is physically in front of the
   * student. The caller validates the number against the lesson's own stage.
   */
  viewingPage?: number;
  /**
   * PHASE 75 — the lesson's whole printed page set (the stage pages). It is what
   * keeps the teacher and the student on the same pages for every curriculum:
   * the tutor is told which pages the lesson occupies, and the citations that
   * drive the room's page jumps are filtered to exactly this set, so the teacher
   * can never stand the student on a page this lesson does not have.
   */
  lessonPages?: number[];
  /**
   * PHASE 76 — the lesson's concepts in printed order. Together with the recent
   * transcript this is the teacher's roadmap: it teaches one concept at a time
   * and moves forward, instead of looping on a single question.
   */
  conceptTitles?: string[];
  /**
   * PHASE 50 — «لوح الحبر»: the student drew on a printed page of the book.
   *
   * The picture is already inside `images` (the page as he marked it); this
   * carries only the *facts about* the marks — which printed page they are on
   * (validated by the caller, may be absent) and how many strokes he drew. The
   * prompt turns those facts into words, so the tutor knows it is looking at
   * the student's own marks on the book, not at an illustration from the book.
   */
  ink?: { bookPage?: number; strokes: number };
  /**
   * PHASE 51 — the student placed the pin on the number line and asks for
   * verification. The value is his claim; which line it belongs to and what
   * the correct position is are resolved below from the stored transcript, so
   * a forged client cannot grade itself correct.
   */
  widget?: PinPlacement;
  /**
   * PHASE 55 — the just-stored user message's id, so history lookups (the
   * retrieval anchor) resolve to EARLIER turns, never to the question itself.
   */
  excludeMessageId?: string;
  /**
   * PHASE 49 — ask for the reply to be delivered as it is written, so the room
   * can show a tutor that is thinking in front of the student instead of a
   * spinner that may last eight seconds. Optional and advisory: without it the
   * turn behaves exactly as before, and nothing downstream (parsing, memory,
   * persistence) differs — the reply that gets stored is the same reply either
   * way.
   */
  stream?: ReplyRelayHooks;
  /**
   * PHASE 20 — daily tutor-call allowance for this student's plan (0 = unlimited).
   * Computed by the caller from the subscription; falls back to the global config.
   */
  dailyLimit?: number;
}

export interface TutorHandleResult {
  reply: TutorResponse;
  intent: ReturnType<typeof classifyIntent>;
  contextChunkCount: number;
  memory: Awaited<ReturnType<MemoryService["snapshot"]>>;
  usedMock: boolean;
  /** PHASE 46 — how many prompt-echo replies were regenerated this turn (0 = clean). */
  promptEchoRegens: number;
  /**
   * PHASE 48 — printed pages of the official book this reply is grounded in
   * (from the retrieved chunks' `[صفحة الكتاب N]` markers). The room turns them
   * into one-click page references on the shared stage.
   */
  citedBookPages: number[];
  /**
   * PHASE 51 — validated number-line widgets this reply drew. Stored on the
   * tutor message (answer keys intact) and stripped on the wire, so the room
   * can render the line while the exercise keeps its key.
   */
  widgets: NumberLineWidget[];
}

const SAFE_REFUSAL_AR = "أنا هنا لمساعدتك في درسنا فقط 💙. أخبرني بما تريد أن نفهمه سويًا من درس اليوم؟";
/** PHASE 38/D-042 — an English-language curriculum gets an English refusal. */
const SAFE_REFUSAL_EN = "I am here to help you with our lesson only 💙. Tell me what you would like us to understand together today?";
/** PHASE 63 — French/German-medium curricula get their own refusal. */
const SAFE_REFUSAL_FR = "Je suis là pour t'aider uniquement avec notre leçon 💙. Dis-moi ce que tu veux que nous comprenions ensemble aujourd'hui ?";
const SAFE_REFUSAL_DE = "Ich bin hier, um dir nur bei unserer Lektion zu helfen 💙. Sag mir, was wir heute gemeinsam verstehen möchten?";

/**
 * The safety refusal is part of the tutor's voice, so it speaks the same
 * language as the lesson — an Arabic wall of text inside a French lesson is
 * exactly the "why is it talking that way?" moment we are removing.
 */
function safeRefusal(language: TutorLanguage): TutorResponse {
  const refusal: Record<TutorLanguage, string> = {
    ar: SAFE_REFUSAL_AR,
    en: SAFE_REFUSAL_EN,
    fr: SAFE_REFUSAL_FR,
    de: SAFE_REFUSAL_DE,
  };
  const text = refusal[language];
  return { content: text, tone: "friendly", parts: [{ type: "text", text }], assessment: { conceptsTouched: [], confidence: 0 } };
}

/**
 * PHASE 46 — how many extra generations a prompt-mirror (echo) reply may cost
 * before we accept whatever came back. Bounded on purpose: a model that keeps
 * mirroring must not stall the turn, and the tolerant parser still degrades a
 * bad reply to plain text.
 */
const MAX_PROMPT_ECHO_REGENS = 2;

/**
 * PHASE 76 — how many recent messages the teacher is reminded of. Enough to
 * hold the thread of the explanation and the student's last reactions, small
 * enough to stay cheap: the lesson content itself already arrives through
 * retrieval, this is only the dialogue around it.
 */
const TUTOR_HISTORY_LIMIT = 8;

/**
 * PHASE 46 — last-resort student-facing reply when the model keeps mirroring
 * the prompt even after a nudged regeneration. Never leak internal prompt text;
 * say honestly that this turn hiccuped and invite a retry.
 */
const mirrorFallback = (language: TutorLanguage): TutorResponse => {
  const content: Record<TutorLanguage, string> = {
    ar: "عذرًا يا بطل، عندي مشكلة مؤقتة في الرد — أعد سؤالك وسأحاول مجددًا 💙",
    en: "Sorry, I hit a hiccup — could you ask me again? 💙",
    fr: "Désolé, j'ai eu un petit souci — peux-tu me reposer la question ? 💙",
    de: "Entschuldige, ich hatte kurz ein Problem — kannst du mir die Frage noch einmal stellen? 💙",
  };
  return {
    content: content[language],
    tone: "apologetic",
    parts: [{ type: "text", text: content[language] }],
    assessment: { conceptsTouched: [], confidence: 0 },
  };
};

/**
 * Orchestrates one tutor turn: intent → scope-guarded retrieval → memory →
 * prompt → provider → structured parse → memory/progress update.
 */
export class TutorEngine {
  private readonly promptBuilder = new PromptBuilder();

  constructor(
    private readonly db: Db,
    private readonly ai: AiService,
    private readonly retrieval: RetrievalService,
    private readonly memory: MemoryService,
  ) {}

  async handle(input: TutorHandleInput): Promise<TutorHandleResult> {
    // 0) PHASE 38/D-042 — reply language for this lesson's subject. Resolved
    //    once, up front, so every branch below (including the safety refusal)
    //    speaks the same language as the curriculum.
    const language: TutorLanguage = resolveTutorLanguage(input.breadcrumb.subject);

    // 1) Daily budget (cost guardrail) — plan-derived (free vs premium, PHASE 20).
    const todayCalls = await this.ai.usage.countTutorCallsForUserToday(input.userId);
    const limit = input.dailyLimit ?? config.DAILY_MESSAGE_LIMIT;
    if (limit > 0 && todayCalls >= limit) {
      throw Errors.tooMany(`وصلت إلى الحد اليومي (${limit} رسالة). عد غدًا لمتابعة المذاكرة!`);
    }

    // 2) Intent (cheap, no tokens). PHASE 45 — answer recognition is
    // CONTEXT-AWARE: the student's new message is already committed, so read the
    // last TUTOR message and treat this turn as an ANSWER whenever the tutor has
    // just asked a question. Without the context, sentence replies («الإجابة هي
    // 15», «لا أعرف», «مش متأكد») fell through to `explanation` and the tutor
    // kept explaining instead of verifying the answer.
    const lastTutorRow = await this.db.db
      .select({ content: messagesTable.content, kind: messagesTable.kind, widgets: messagesTable.widgets })
      .from(messagesTable)
      .where(and(eq(messagesTable.sessionId, input.session.id), eq(messagesTable.role, "tutor")))
      .orderBy(desc(messagesTable.createdAt))
      .limit(1)
      .get();
    const lastTutorMessage = lastTutorRow?.content?.trim();
    // A question is "pending" when the previous tutor reply is tagged as a
    // question, or (tolerant-parser fallback) simply ends with a question mark.
    const pendingQuestion =
      lastTutorRow !== undefined &&
      (lastTutorRow.kind === "question" || /[؟?]\s*$/.test(lastTutorRow.content ?? ""));
    const intent = classifyIntent(input.question, { pendingQuestion });
    const isAnswerTurn = intent.intent === "answer" && !!lastTutorMessage;

    // 3) Prompt-injection tripwire — no model call, no retrieval. A student
    // file must never change the system's rules: the extracted document text
    // is re-scanned for bypass phrasing just like the typed question.
    const documentBypass = (input.documents ?? []).some(
      (d) => classifyIntent(d.text).intent === "admin_bypass_attempt",
    );
    if (intent.intent === "admin_bypass_attempt" || documentBypass) {
      const memory = await this.memory.snapshot(input.student.id);
      const effectiveIntent: ReturnType<typeof classifyIntent> = documentBypass
        ? { intent: "admin_bypass_attempt", confidence: 0.95, concepts: intent.concepts }
        : intent;
      return { reply: safeRefusal(language), intent: effectiveIntent, contextChunkCount: 0, memory, usedMock: this.ai.providers.llm.id === "mock", promptEchoRegens: 0, citedBookPages: [], widgets: [] };
    }

    // 4) Scope-guarded retrieval. Photo-only or document-only turns have no
    // text query, so we retrieve against a neutral lesson query to keep
    // grounding (never zero).
    const hasDocument = (input.documents?.length ?? 0) > 0;
    // PHASE 44 — when the student is answering, retrieve on the PENDING
    // question, not on the bare answer ("9" yields no meaningful curriculum
    // grounding; "كم ناتج 5+4" does).
    // PHASE 55 — anchor a concept-less follow-up on the concept in progress
    // (see buildRetrievalQuery): the tutor's last message first, the
    // student's last EARLIER message when no tutor reply exists yet (a failed
    // first turn must not leave the second one anchorless).
    let anchorMessage = lastTutorRow?.content?.trim() || undefined;
    if (!anchorMessage && input.excludeMessageId) {
      const lastUserRow = await this.db.db
        .select({ content: messagesTable.content })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.sessionId, input.session.id),
            eq(messagesTable.role, "user"),
            // The just-stored question anchors nothing: it IS this turn.
            ne(messagesTable.id, input.excludeMessageId),
          ),
        )
        .orderBy(desc(messagesTable.createdAt))
        .limit(1)
        .get();
      anchorMessage = lastUserRow?.content?.trim() || undefined;
    }
    const retrievalQuery = buildRetrievalQuery({
      question: input.question,
      intent: intent.intent,
      intentConcepts: intent.concepts,
      isAnswerTurn,
      lastTutorMessage,
      anchorMessage,
      hasDocument,
    });
    const retrieveResult = await this.retrieval.retrieve({
      question: retrievalQuery,
      scope: {
        countryId: input.breadcrumb.country.id,
        educationSystemId: input.breadcrumb.system.id,
        gradeId: input.breadcrumb.grade.id,
        subjectId: input.breadcrumb.subject.id,
        curriculumId: input.breadcrumb.curriculum.id,
        termId: input.breadcrumb.term.id,
        unitId: input.breadcrumb.unit.id,
        lessonId: input.breadcrumb.lesson.id,
      },
      topK: config.RAG_TOP_K,
    });

    // 5) Memory snapshot (long-term).
    const memory = await this.memory.snapshot(input.student.id);

    // 5b) PHASE 76 — the recent transcript (oldest first), so the teacher
    // continues the lesson instead of restarting it. Without it the model only
    // ever sees the current question, cannot know what it already explained,
    // and falls back to asking a question every turn.
    const history = await this.recentHistory(input.session.id, input.excludeMessageId);

    // PHASE 48 — the page the student has open. Its OCR text is the *same*
    // corpus the retriever draws from, so "the tutor sees the page" costs no
    // extra model call and no latency: it is a lookup, not a vision request.
    // Validated to a real printed page of the lesson's own range by the caller.
    const viewingPage =
      input.viewingPage !== undefined
        ? { bookPage: input.viewingPage, text: bookPageText(input.breadcrumb.curriculum.code, input.viewingPage) }
        : undefined;

    // PHASE 78 — the lesson's ENTIRE printed text, marker-prefixed page by page.
    // Retrieval is top-5 chunks (~2.5k chars) and can miss the page holding the
    // lesson's printed worked example or تمرين — which is how a tutor ends up
    // inventing its own. Shipping the whole lesson (bounded; see the helper)
    // makes the book's printed examples and problems part of every prompt.
    const lessonBookText = loadLessonBookText(
      input.breadcrumb.curriculum.code,
      input.lessonPages,
      config.TUTOR_LESSON_BOOK_CHARS,
    );

    // PHASE 48 — citations. Every book chunk carries a `[صفحة الكتاب N]` marker
    // written by the seeder, so the pages a reply is built on are a fact about
    // the retrieval, not a guess the model has to make (and get wrong).
    //
    // PHASE 75 — the markers are additionally restricted to the lesson's own
    // pages (`lessonPages`), so a passage that slipped in from a neighbour — or
    // an appendix page this lesson does not point to — can never make the tutor
    // offer a page the student's stage does not have. Without a stage (text-only
    // curricula), the global sanity bound still applies.
    //
    // PHASE 78 — the full lesson text joins the markers, so when the tutor
    // answers from the whole lesson (not just the retrieved five chunks) those
    // pages are named as references too.
    const allowedPages =
      input.lessonPages && input.lessonPages.length > 0 ? new Set(input.lessonPages) : undefined;
    const citedBookPages = bookPagesInText(
      [...retrieveResult.chunks.map((c) => c.content), lessonBookText].filter(Boolean).join("\n"),
      allowedPages,
    );

    // PHASE 51 — which line the pin belongs to. The key is resolved from the
    // stored transcript (the last line the tutor drew), never from the
    // client's echo: the room sends only the pin value, so a forged client
    // cannot grade itself correct. A pin with no line behind it is still
    // answered — the tutor reacts to the position without a key.
    //
    // The lookup skips verdict replies on purpose: a verification answer draws
    // no line itself, so "the last tutor message" would lose the key one turn
    // after it was drawn. The last message that *drew a line* is the key.
    const lastLineRow = input.widget
      ? await this.db.db
          .select({ widgets: messagesTable.widgets })
          .from(messagesTable)
          .where(
            and(
              eq(messagesTable.sessionId, input.session.id),
              eq(messagesTable.role, "tutor"),
              isNotNull(messagesTable.widgets),
            ),
          )
          .orderBy(desc(messagesTable.createdAt))
          .limit(1)
          .get()
      : undefined;
    const lastLine = lastNumberLine(lastLineRow?.widgets);
    const pin =
      input.widget !== undefined
        ? {
            value: lastLine ? snapToStep(input.widget.value, lastLine.from, lastLine.step) : input.widget.value,
            line: lastLine,
          }
        : undefined;

    // 6) Build prompt & call provider.
    const lessonContext = {
      countryNameAr: input.breadcrumb.country.nameAr,
      systemNameAr: input.breadcrumb.system.nameAr,
      gradeNameAr: input.breadcrumb.grade.nameAr,
      subjectNameAr: input.breadcrumb.subject.nameAr,
      curriculumTitle: input.breadcrumb.curriculum.title,
      termTitle: input.breadcrumb.term.title,
      unitTitle: input.breadcrumb.unit.title,
      lessonTitle: input.breadcrumb.lesson.title,
      conceptTitles: input.conceptTitles ?? [],
    };
    const { messages } = this.promptBuilder.build({
      intent: intent.intent,
      question: input.question,
      lesson: lessonContext,
      chunks: retrieveResult.chunks,
      memory,
      studentName: input.student.displayName,
      // PHASE 50 — an ink turn is a vision turn: the only picture is the marked
      // page, so reading it means reading the student's own marks on the book.
      hasImage: (input.images?.length ?? 0) > 0,
      ink: input.ink,
      documents: input.documents,
      language,
      // PHASE 76 — the pending question travels on EVERY turn where the tutor
      // actually asked one, not only answer turns. On a non-answer turn it lets
      // the prompt say "this message is not an answer — don't grade a reply that
      // was never given"; on an answer turn the prompt builder still derives
      // `isAnswerTurn` from the intent, so nothing else changes.
      lastQuestion: pendingQuestion && lastTutorMessage ? lastTutorMessage : undefined,
      viewingPage,
      lessonPages: input.lessonPages,
      // PHASE 78 — the whole lesson book text, so the tutor explains from the
      // book's own pages instead of inventing examples the page never printed.
      lessonBookText,
      // PHASE 76 — the dialogue so far, so the teacher continues the lesson.
      history,
      widget: pin,
    });

    // PHASE 46 — prompt-mirror guard: a weak model occasionally answers a turn
    // by echoing the system prompt back (observed live with gemma on a fresh
    // session). Detect the mirror on the raw content and regenerate, bounded,
    // so the student never sees internal prompt text. Blind repetition does not
    // break a model stuck mirroring, so each regeneration appends a short
    // "answer NOW" nudge to the ask line (same question, varied instruction).
    const nudgedMessages: LLMMessage[] = messages.map((m, i) =>
      i === messages.length - 1 && m.role === "user"
        ? {
            ...m,
            content:
              `${m.content}\n\n⚠️ أجب الآن مباشرةً: لا تعِد صياغة التعليمات ولا تلخص السياق ولا تذكر أي قواعد داخلية. ` +
              `ابدأ ردّك فورًا موجّهًا إلى الطالب، ثم علّم فعلًا: اشرح أو اخطُ خطوةً أو اعرض مثال الكتاب، وتابع الدرس من حيث وقفتما.`,
          }
        : m,
    );
    // PHASE 53 — a mirror means THIS model is stuck narrating its assignment,
    // not that the question is bad: hammering the stuck model with the same
    // nudge twice is how a turn burns a minute. Regenerations walk the
    // fallback models instead (attempt 1 → first fallback, …), so a stuck
    // primary yields to a fresh bucket. No fallbacks configured = previous
    // behaviour exactly (same model, nudged).
    const regenModels = this.ai.fallbackModels();
    // A mirror wrapped in valid JSON hides its bullets mid-line, where a
    // line-anchored marker cannot see them — so the regen check reads both the
    // raw envelope and the parsed inner content (PHASE 53). A truncated
    // envelope is the same family (an unusable reply, never an answer) and
    // regenerates the same way, on the next model.
    const isEcho = (raw: string): boolean => {
      if (looksLikePromptEcho(raw)) return true;
      const parsed = parseTutorResponse(raw).content;
      return looksLikePromptEcho(parsed) || looksLikeJsonFragment(parsed);
    };
    const { response: llmResponse, regens: promptEchoRegens } = await regenerateEchoes(
      async (attempt) => {
        const request = {
          operation: "tutor" as const,
          messages: attempt === 0 ? messages : nudgedMessages,
          json: true,
          // PHASE 43 hotfix — hard ceiling on the tutor reply so a verbose
          // fallback model cannot stall the turn: 900 output tokens ≈ ~1.5 k
          // Arabic chars, double the shorter replies the prompt now asks for,
          // and the tolerant parser still degrades to plain text if a cap ever
          // trims the JSON.
          // PHASE 55 — lowered to 600: observed replies peak near 440 tokens,
          // so this keeps generous headroom while halving what a rambling
          // model can burn on a degraded day (≈60s at 10 tok/s). A cap that
          // trims mid-envelope yields a fragment, which the guard regenerates.
          // PHASE 76 — raised to 800: a real teaching turn explains an idea and
          // works the book's example before it can ask anything, which does not
          // fit the old "one question" budget. The prompt still asks for a
          // focused 2–4 parts, so this is headroom, not an invitation to ramble.
          maxOutputTokens: 800,
          // PHASE 56 — ask for no thinking. Measured on the real prompt: the
          // Gemini 3 family reasons by default, those tokens arrive BEFORE the
          // first visible word, and a fallback model that thought freely spent
          // its whole 600-token budget on reasoning and returned a truncated,
          // unparseable envelope (`MAX_TOKENS`, broken JSON). With this the same
          // prompt answers in ~1s instead of 6–36s. Models that refuse the field
          // are retried without it by the provider (measured: 3.5-flash-lite 400s).
          thinkingBudget: 0,
          images: input.images,
          documents: input.documents,
          contextUserId: input.userId,
          contextSessionId: input.session.id,
          ...(attempt > 0 && regenModels[attempt - 1] ? { model: regenModels[attempt - 1] } : {}),
        };
        // Only the first attempt is streamed. A regeneration exists because the
        // first answer was unusable, so showing it would be a waste of the
        // student's attention — and the relay has usually already dropped it.
        if (attempt > 0 || !input.stream) return this.ai.complete(request);
        const relay = new ReplyRelay(input.stream);
        const streamed = await this.ai.stream(request, (raw) => relay.push(raw));
        await relay.finish();
        return streamed;
      },
      MAX_PROMPT_ECHO_REGENS,
      isEcho,
    );
    // A regeneration means the streamed first answer was thrown away; make sure
    // the room stopped displaying it even if the mirror was not recognisable as
    // one. Dropping twice is a no-op, so this is safe to say unconditionally.
    if (promptEchoRegens > 0 && input.stream?.onDiscard) await input.stream.onDiscard();
    let reply = parseTutorResponse(llmResponse.content);
    // Last resort: the budget is spent but the model still mirrors — degrade
    // gracefully instead of printing a prompt echo to the student. A truncated
    // envelope degrades the same way: braces are never an answer.
    if (looksLikePromptEcho(reply.content) || looksLikeJsonFragment(reply.content)) {
      reply = mirrorFallback(language);
    }
    // PHASE 51 — split the reply's widgets from its words: only drawable lines
    // are stored and rendered, the rest degrades to its text fallback.
    const split = splitReplyWidgets(reply.parts);
    reply = { ...reply, parts: split.parts };

    // 7) Update memory/progress with what we know.
    const touchedConcepts = reply.assessment?.conceptsTouched ?? [];
    const correctGuess = intent.intent === "check_understanding";
    for (const conceptTitle of touchedConcepts.slice(0, 3)) {
      // We only update mastery for concepts we can resolve in the lesson.
      void conceptTitle;
    }
    if (correctGuess) {
      // Student confirmed understanding — nudge mastery upward for the lesson concepts next turn.
      void this.memory.remember(input.student.id, "preference", "lesson_pace", "يفضل المتابعة بعد التأكيد", 1).catch(() => undefined);
    }

    return { reply, intent, contextChunkCount: retrieveResult.chunks.length, memory, usedMock: this.ai.providers.llm.id === "mock", promptEchoRegens, citedBookPages, widgets: split.widgets };
  }

  /**
   * PHASE 76 — the last `TUTOR_HISTORY_LIMIT` messages of this session, oldest
   * first, as chat turns the provider understands. `excludeMessageId` is the
   * just-stored student message (already committed by the caller), excluded so
   * the dialogue ends where the current turn begins. Empty content never travels
   * (an attachment-only turn would otherwise look like a blank line).
   */
  private async recentHistory(sessionId: string, excludeMessageId?: string): Promise<LLMMessage[]> {
    const rows = await this.db.db
      .select({ role: messagesTable.role, content: messagesTable.content })
      .from(messagesTable)
      .where(
        excludeMessageId
          ? and(eq(messagesTable.sessionId, sessionId), ne(messagesTable.id, excludeMessageId))
          : eq(messagesTable.sessionId, sessionId),
      )
      .orderBy(desc(messagesTable.createdAt))
      .limit(TUTOR_HISTORY_LIMIT)
      .all();
    return rows
      .reverse()
      .filter((m) => (m.content ?? "").trim().length > 0)
      .map((m) => ({ role: (m.role === "tutor" ? "assistant" : "user") as LLMMessage["role"], content: m.content! }));
  }
}

/**
 * PHASE 51 — the last number line the tutor drew in this session, if any. The
 * pin the student just placed is verified against this line's key.
 */
function lastNumberLine(raw: string | null | undefined): NumberLineWidget | undefined {
  const widgets = parseStoredWidgets(raw ?? null);
  return widgets?.[widgets.length - 1];
}

/**
 * PHASE 55 — what the retriever searches for.
 *
 * A vague follow-up ("مش فاهم، اشرح بطريقة أسهل") names no concept, so bare
 * retrieval drifts: observed live, it pulled GCD chunks into a
 * divisibility-by-2 explanation and the tutor followed them off a cliff. When
 * the question carries no concept of its own, the query is anchored on what
 * the tutor just said — the concept in progress — instead of the vague words
 * alone. A question that names its concept (or answers the pending one)
 * travels exactly as before.
 */
export function buildRetrievalQuery(args: {
  question: string;
  intent: TutorIntent;
  intentConcepts: string[];
  isAnswerTurn: boolean;
  lastTutorMessage?: string;
  /**
   * The concept in progress, in the student's or tutor's own words — the
   * tutor's last message first, the student's last earlier message when no
   * tutor reply exists yet. A vague follow-up is searched with this attached,
   * so it cannot drift off the topic the student is stuck on.
   */
  anchorMessage?: string;
  hasDocument: boolean;
}): string {
  if (args.isAnswerTurn && args.lastTutorMessage) return args.lastTutorMessage;
  const q = args.question.trim();
  if (q.length === 0) {
    return args.hasDocument ? "سؤال عن محتوى الملف المرفق في هذا الدرس" : "سؤال مصور في هذا الدرس";
  }
  // Anchored only for open-ended explanation/hint requests: a bare "explain
  // (it) simpler" names nothing, so without the anchor the query drifts (seen
  // live: GCD chunks inside a divisibility explanation). Self-contained turns
  // — exercises ("ما ناتج جمع 487 و 358؟"), answers, confirmations — travel
  // exactly as written, which also keeps repeated questions embedding to the
  // same vector (the embedding cache stays deterministic).
  if ((args.intent === "explanation" || args.intent === "hint_request") && args.intentConcepts.length === 0 && args.anchorMessage) {
    return `${args.anchorMessage.slice(0, 500)} ${q}`;
  }
  return q;
}

export { config as tutorConfig };
