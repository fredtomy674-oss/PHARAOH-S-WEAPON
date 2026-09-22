import { config } from "../../config/env.js";
import type { Db } from "../../db/index.js";
import type { LearningSession, Student } from "../../db/schema.js";
import type { AiService } from "../ai/aiService.js";
import type { DocumentInput, ImageInput } from "../ai/types.js";
import type { CurriculumBreadcrumb } from "../curriculum/service.js";
import type { RetrievalService } from "../rag/retrieval.js";
import { Errors } from "../../utils/errors.js";
import { classifyIntent } from "./intentClassifier.js";
import { MemoryService } from "./memoryService.js";
import { PromptBuilder } from "./promptBuilder.js";
import { parseTutorResponse, type TutorResponse } from "./responseProcessor.js";

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
}

export interface TutorHandleResult {
  reply: TutorResponse;
  intent: ReturnType<typeof classifyIntent>;
  contextChunkCount: number;
  memory: Awaited<ReturnType<MemoryService["snapshot"]>>;
  usedMock: boolean;
}

const SAFE_REFUSAL: TutorResponse = {
  content: "أنا هنا لمساعدتك في درسنا فقط 💙. أخبرني بما تريد أن نفهمه سويًا من درس اليوم؟",
  tone: "friendly",
  parts: [{ type: "text", text: "أنا هنا لمساعدتك في درسنا فقط 💙. أخبرني بما تريد أن نفهمه سويًا من درس اليوم؟" }],
  assessment: { conceptsTouched: [], confidence: 0 },
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
    // 1) Daily budget (cost guardrail).
    const todayCalls = await this.ai.usage.countTutorCallsForUserToday(input.userId);
    if (config.DAILY_MESSAGE_LIMIT > 0 && todayCalls >= config.DAILY_MESSAGE_LIMIT) {
      throw Errors.tooMany(`وصلت إلى الحد اليومي (${config.DAILY_MESSAGE_LIMIT} رسالة). عد غدًا لمتابعة المذاكرة!`);
    }

    // 2) Intent (cheap, no tokens).
    const intent = classifyIntent(input.question);

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
      return { reply: SAFE_REFUSAL, intent: effectiveIntent, contextChunkCount: 0, memory, usedMock: this.ai.providers.llm.id === "mock" };
    }

    // 4) Scope-guarded retrieval. Photo-only or document-only turns have no
    // text query, so we retrieve against a neutral lesson query to keep
    // grounding (never zero).
    const hasDocument = (input.documents?.length ?? 0) > 0;
    const retrievalQuery =
      input.question.trim().length > 0
        ? input.question
        : hasDocument
          ? "سؤال عن محتوى الملف المرفق في هذا الدرس"
          : "سؤال مصور في هذا الدرس";
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
      conceptTitles: [],
    };
    const { messages } = this.promptBuilder.build({
      intent: intent.intent,
      question: input.question,
      lesson: lessonContext,
      chunks: retrieveResult.chunks,
      memory,
      studentName: input.student.displayName,
      hasImage: (input.images?.length ?? 0) > 0,
      documents: input.documents,
    });

    const llmResponse = await this.ai.complete({
      operation: "tutor",
      messages,
      json: true,
      images: input.images,
      documents: input.documents,
      contextUserId: input.userId,
      contextSessionId: input.session.id,
    });
    const reply = parseTutorResponse(llmResponse.content);

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

    return { reply, intent, contextChunkCount: retrieveResult.chunks.length, memory, usedMock: this.ai.providers.llm.id === "mock" };
  }
}

export { config as tutorConfig };