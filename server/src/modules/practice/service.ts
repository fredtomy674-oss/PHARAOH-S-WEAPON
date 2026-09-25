import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { answers, chunks, concepts, curriculumEnrollments, lessons, questions, terms, units } from "../../db/schema.js";
import type { MemoryService } from "../tutor/memoryService.js";
import { describeMastery, type MasteryLevel } from "../progress/mastery.js";
import type { AchievementService } from "../achievements/service.js";
import type { AiService } from "../ai/aiService.js";
import { Errors } from "../../utils/errors.js";
import { newId } from "../../utils/ids.js";
import { sortPlan, type PracticePlanItem } from "./plan.js";
import {
  groundingPrompt,
  parseGeneratedOpenQuestion,
  parseGeneratedQuestion,
  QUESTION_GEN_MAX_CHUNKS,
  QUESTION_GEN_MAX_CONTEXT_CHARS,
} from "./questionGen.js";
import {
  GRADE_OPEN_MAX_STUDENT_ANSWER_CHARS,
  gradeContainsAnswerKey,
  gradeFallback,
  gradePrompt,
  parseGrade,
} from "./grade.js";

/** A question the student can answer — NEVER includes the answer key. */
export interface PracticeQuestion {
  id: string;
  content: string;
  /** null for open questions (free-text answers) — options exist for MCQ only. */
  options: string[] | null;
  type: "mcq" | "open";
  conceptId: string | null;
  conceptTitle: string | null;
  difficulty: "easy" | "medium" | "hard";
}

export interface PracticeMastery {
  score: number;
  decayedScore: number;
  level: MasteryLevel;
  labelAr: string;
}

export interface PracticeResult {
  correct: boolean;
  explanation: string | null;
  /** PHASE 30 — LLM grading of open answers: 0..1 estimate + written feedback (null for MCQ). */
  score: number | null;
  feedback: string | null;
  /** null when the question is not linked to a concept (no mastery impact). */
  mastery: PracticeMastery | null;
}

/** PHASE 30 — one answer submission (option index for MCQ, free text for open). */
export interface SubmitAnswerInput {
  optionIndex?: unknown;
  answer?: unknown;
  /** PHASE 31 — client-measured seconds (display → submit); MCQ only, optional. */
  timeTakenSeconds?: unknown;
}

/**
 * PHASE 31 — accept the client's measured answer time as whole seconds in a
 * sane 1..600 window; silently drop anything malformed (string/float/out of
 * range → null = "unknown" band, unit multiplier). Time is a soft signal,
 * never a gate: an absent or lying client simply gets neutral scaling.
 */
export function normalizeAnswerSeconds(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 1 || value > 600) return null;
  return value;
}

/** Counts-only result of a (possibly multi-concept) admin bulk generation. */
export interface AdminQuestionGenResult {
  generated: number;
  skipped: number;
  failed: number;
  items: Array<{ conceptId: string; title: string; status: "generated" | "skipped" | "failed"; error?: string }>;
}

interface ParsedOptions {
  options: string[];
  correctIndex: number;
}

/**
 * PHASE 24 + 25 + 26 — practice loop for the concept-mastery engine. Serves
 * MCQ questions scoped to the student's enrolled curricula (weakest tracked
 * concepts first) and grades answers deterministically, feeding every answered
 * question into `MemoryService.recordAssessment` — the first production caller
 * of the previously dormant assessment path. PHASE 26: grades weight mastery by
 * question difficulty and feed the practice/mastery achievements. PHASE 30:
 * «أسئلة مفتوحة» are activated end-to-end — the loop can serve `open`
 * questions and grades free-text answers through the dynamic AI operation
 * `grade_open` (deterministic mock offline, LLM in production) with a
 * "لا نص حرفي" guard and a deterministic fallback. PHASE 31: the client's
 * measured answer time (display → submit, MCQ only) is stored and scales the
 * mastery delta via the speed band (fast 1.25×, slow 0.75×, unknown 1×) —
 * first attempts stay neutral and malformed times are silently dropped.
 */
export class PracticeService {
  constructor(
    private readonly db: Db,
    private readonly memory: MemoryService,
    private readonly achievements: AchievementService,
    /** PHASE 28 — the AI facade used to generate questions for questionless concepts. */
    private readonly ai: AiService,
  ) {}

  /** Curricula the student is actively enrolled in (practice scope). */
  private async enrolledCurriculumIds(studentId: string): Promise<string[]> {
    const rows = await this.db.db
      .select({ curriculumId: curriculumEnrollments.curriculumId })
      .from(curriculumEnrollments)
      .where(and(eq(curriculumEnrollments.studentId, studentId), eq(curriculumEnrollments.isActive, true)));
    return rows.map((r) => r.curriculumId);
  }

  /**
   * Pick the next question of the requested type ("mcq" by default, "open" for
   * free-text): an explicit concept when asked, otherwise the student's
   * weakest tracked concept first, falling back to any enrolled curriculum
   * question (deterministic: oldest first).
   */
  async questionFor(studentId: string, conceptId?: string, type: "mcq" | "open" = "mcq"): Promise<PracticeQuestion | null> {
    const enrolled = await this.enrolledCurriculumIds(studentId);
    if (enrolled.length === 0) return null;
    const base = and(eq(questions.type, type), inArray(questions.curriculumId, enrolled));

    if (conceptId) {
      const row = await this.db.db
        .select()
        .from(questions)
        .where(and(base, eq(questions.conceptId, conceptId)))
        .orderBy(asc(questions.createdAt), asc(questions.id))
        .limit(1)
        .get();
      return row ? await this.toPublic(row) : null;
    }

    const { concepts: rows } = await this.memory.progressDetail(studentId);
    const ordered = [...rows].sort((a, b) => a.mastery - b.mastery);
    for (const c of ordered) {
      const row = await this.db.db
        .select()
        .from(questions)
        .where(and(base, eq(questions.conceptId, c.conceptId)))
        .orderBy(asc(questions.createdAt), asc(questions.id))
        .limit(1)
        .get();
      if (row) return await this.toPublic(row);
    }

    const any = await this.db.db
      .select()
      .from(questions)
      .where(base)
      .orderBy(asc(questions.createdAt), asc(questions.id))
      .limit(1)
      .get();
    return any ? await this.toPublic(any) : null;
  }

  /**
   * Grade an answer (MCQ option index or open free text), persist the attempt,
   * and update concept mastery. Throws 404 when the question is unlinked to the
   * student's curricula; 400 for out-of-range options / missing answers and for
   * submitting the wrong payload kind for the question's type; other races
   * surface as 500 via the mapper. PHASE 30: open answers are graded through
   * the dynamic AI operation `grade_open` (mock offline / LLM in production)
   * with a no-verbatim guard + deterministic fallback.
   */
  async submitAnswer(
    studentId: string,
    questionId: string,
    input: SubmitAnswerInput,
    ctx: { actorUserId: string; sessionId?: string },
  ): Promise<PracticeResult> {
    const enrolled = await this.enrolledCurriculumIds(studentId);
    const q = await this.db.db.select().from(questions).where(eq(questions.id, questionId)).get();
    if (!q || !q.curriculumId || !enrolled.includes(q.curriculumId)) {
      throw Errors.notFound("السؤال غير متاح لك");
    }
    // The payload must be unambiguous: either an option index or a text answer.
    if (input.optionIndex !== undefined && input.optionIndex !== null && input.answer !== undefined && input.answer !== null) {
      throw Errors.badRequest("أرسل إمّا خيارًا أو إجابة نصية، وليس الاثنين معًا", "INVALID_SUBMIT");
    }
    if (q.type === "open") return this.gradeOpenAnswer(studentId, q, input, ctx);
    return this.gradeMcqAnswer(studentId, q, input, ctx);
  }

  private async gradeMcqAnswer(
    studentId: string,
    q: { id: string; optionsJson: string | null; explanation: string | null; conceptId: string | null; difficulty: "easy" | "medium" | "hard" },
    input: SubmitAnswerInput,
    ctx: { sessionId?: string },
  ): Promise<PracticeResult> {
    const optionIndex = input.optionIndex;
    if (typeof optionIndex !== "number" || !Number.isInteger(optionIndex) || optionIndex < 0) {
      throw Errors.badRequest("اختر خيارًا صالحًا", "INVALID_OPTION");
    }
    const parsed = parseOptions(q.optionsJson);
    if (!parsed) throw Errors.internal("تعذر قراءة السؤال");
    if (optionIndex >= parsed.options.length) throw Errors.badRequest("اختر خيارًا صالحًا", "INVALID_OPTION");

    const correct = optionIndex === parsed.correctIndex;
    const now = new Date();
    // optionIndex < options.length is enforced above, so this is safe.
    const chosen = parsed.options[optionIndex]!;
    // PHASE 31 — the client's measured answer time is stored and later feeds
    // the speed-scaled mastery delta (silently neutral when absent/invalid).
    const answerSeconds = normalizeAnswerSeconds(input.timeTakenSeconds);
    await this.db.db.insert(answers).values({
      id: newId("ans"),
      questionId: q.id,
      studentId,
      sessionId: ctx.sessionId ?? null,
      content: chosen,
      correct: correct ? 1 : 0,
      answerSeconds,
      createdAt: now,
    });

    if (!q.conceptId) {
      return { correct, explanation: q.explanation, mastery: null, score: null, feedback: null };
    }
    await this.memory.recordAssessment({ studentId, conceptId: q.conceptId, correct, type: "exercise", difficulty: q.difficulty, answerSeconds });
    const mastery = await this.masteryAfter(q.conceptId, studentId);
    return {
      correct,
      explanation: q.explanation,
      mastery,
      score: null,
      feedback: null,
    };
  }

  /** PHASE 30 — grade a free-text answer via `grade_open` and record the attempt. */
  private async gradeOpenAnswer(
    studentId: string,
    q: { id: string; content: string; optionsJson: string | null; answerKey: string | null; explanation: string | null; conceptId: string | null; difficulty: "easy" | "medium" | "hard" },
    input: SubmitAnswerInput,
    ctx: { actorUserId: string; sessionId?: string },
  ): Promise<PracticeResult> {
    if (input.optionIndex !== undefined && input.optionIndex !== null) {
      throw Errors.badRequest("هذا سؤال مقالي — اكتب إجابتك نصيًا", "INVALID_ANSWER");
    }
    const answer = typeof input.answer === "string" ? input.answer.trim() : "";
    if (answer.length === 0) throw Errors.badRequest("اكتب إجابة قبل التحقق منها", "INVALID_ANSWER");
    if (answer.length > GRADE_OPEN_MAX_STUDENT_ANSWER_CHARS) {
      throw Errors.badRequest("الإجابة طويلة جدًا — لخّصها في جملة أو جملتين", "INVALID_ANSWER");
    }
    if (!q.answerKey || q.answerKey.trim().length === 0) {
      throw Errors.internal("تعذر تصحيح السؤال");
    }
    const conceptTitle = q.conceptId
      ? ((await this.db.db.select({ title: concepts.title }).from(concepts).where(eq(concepts.id, q.conceptId)).get())?.title ?? null)
      : null;

    const { system, user } = gradePrompt({
      conceptTitle,
      questionContent: q.content,
      referenceAnswer: q.answerKey,
      studentAnswer: answer,
    });
    const response = await this.ai.complete({
      operation: "grade_open",
      json: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      contextUserId: ctx.actorUserId,
    });
    const parsed = parseGrade(response.content);
    // A malformed reply or one that re-quotes the hidden answer → safe fallback.
    const grade = parsed && !gradeContainsAnswerKey(parsed.feedback, q.answerKey)
      ? parsed
      : gradeFallback({ conceptTitle, referenceAnswer: q.answerKey, studentAnswer: answer });

    const now = new Date();
    // PHASE 31 — answer time is an MCQ-only signal: typing time isn't a
    // mastery signal, so open answers always store null and use the unit band.
    await this.db.db.insert(answers).values({
      id: newId("ans"),
      questionId: q.id,
      studentId,
      sessionId: ctx.sessionId ?? null,
      content: answer,
      correct: grade.correct ? 1 : 0,
      answerSeconds: null,
      createdAt: now,
    });

    if (!q.conceptId) {
      return { correct: grade.correct, explanation: q.explanation, mastery: null, score: grade.score, feedback: grade.feedback };
    }
    await this.memory.recordAssessment({ studentId, conceptId: q.conceptId, correct: grade.correct, type: "exercise", difficulty: q.difficulty });
    const mastery = await this.masteryAfter(q.conceptId, studentId);
    return {
      correct: grade.correct,
      explanation: q.explanation,
      mastery,
      score: grade.score,
      feedback: grade.feedback,
    };
  }

  /** Shared mastery/achievements bookkeeping after any answered question. */
  private async masteryAfter(conceptId: string, studentId: string): Promise<PracticeMastery | null> {
    const summary = await this.memory.masterySummary(studentId);
    const entry = summary.find((s) => s.conceptId === conceptId) ?? null;
    // PHASE 26 — the mastery engine now feeds badges (best-effort, never blocks
    // the answer): practice activity + concepts at the «متقن» display level.
    try {
      await this.achievements.evaluate(studentId, "practice_answer");
      await this.achievements.evaluate(studentId, "mastery_achieved");
    } catch {
      // Badge bookkeeping must never break the core loop — next answer retries.
    }
    return entry ? { score: entry.mastery, decayedScore: entry.decayedMastery, level: entry.level, labelAr: entry.labelAr } : null;
  }

  /**
   * PHASE 25 — the student's practice plan: every tracked concept ranked
   * weakest-first (decayed mastery, then staleness), decorated with its
   * lesson and the number of MCQ questions available in the student's
   * enrolled curricula. Computed read-side (no writes) — the "recommendations
   * as a plan" item deferred from D-028.
   */
  async planFor(studentId: string): Promise<PracticePlanItem[]> {
    const summaries = await this.memory.masterySummary(studentId);
    const enrolled = await this.enrolledCurriculumIds(studentId);

    // PHASE 28 — every concept of the student's enrolled curricula is part of
    // the plan, practiced or not. Untracked concepts (mastery 0) appear below
    // the tracked ones so concepts WITHOUT questions are discoverable and can
    // be generated into practice instead of being invisible dead ends.
    const allConcepts =
      enrolled.length > 0
        ? await this.db.db
            .select({
              conceptId: concepts.id,
              code: concepts.code,
              title: concepts.title,
              lessonId: lessons.id,
              lessonTitle: lessons.title,
            })
            .from(concepts)
            .innerJoin(lessons, eq(concepts.lessonId, lessons.id))
            .innerJoin(units, eq(lessons.unitId, units.id))
            .innerJoin(terms, eq(units.termId, terms.id))
            .where(inArray(terms.curriculumId, enrolled))
            .all()
        : [];

    const conceptIds = [...new Set([...summaries.map((s) => s.conceptId), ...allConcepts.map((c) => c.conceptId)])];

    const lessonInfo = new Map<string, { lessonId: string; lessonTitle: string }>();
    const nameRows = await this.db.db
      .select({ conceptId: concepts.id, lessonId: concepts.lessonId, lessonTitle: lessons.title })
      .from(concepts)
      .innerJoin(lessons, eq(concepts.lessonId, lessons.id))
      .where(inArray(concepts.id, conceptIds))
      .all();
    for (const row of nameRows) {
      lessonInfo.set(row.conceptId, { lessonId: row.lessonId, lessonTitle: row.lessonTitle });
    }

    const available = new Map<string, number>();
    const openAvailable = new Map<string, number>();
    if (enrolled.length > 0) {
      const countRows = await this.db.db
        .select({ conceptId: questions.conceptId, n: sql<number>`count(*)` })
        .from(questions)
        .where(
          and(eq(questions.type, "mcq"), inArray(questions.curriculumId, enrolled), inArray(questions.conceptId, conceptIds)),
        )
        .groupBy(questions.conceptId)
        .all();
      for (const row of countRows) {
        available.set(row.conceptId ?? "", row.n);
      }
      // PHASE 30 — open questions are counted separately so the plan can offer
      // «سؤال مقالي» / «توليد سؤال مقالي» per concept.
      const openRows = await this.db.db
        .select({ conceptId: questions.conceptId, n: sql<number>`count(*)` })
        .from(questions)
        .where(
          and(eq(questions.type, "open"), inArray(questions.curriculumId, enrolled), inArray(questions.conceptId, conceptIds)),
        )
        .groupBy(questions.conceptId)
        .all();
      for (const row of openRows) {
        openAvailable.set(row.conceptId ?? "", row.n);
      }
    }

    const tracked = new Map(summaries.map((s) => [s.conceptId, s]));
    const items: PracticePlanItem[] = summaries.map((s) => ({
      conceptId: s.conceptId,
      code: s.code,
      title: s.title,
      lessonId: lessonInfo.get(s.conceptId)?.lessonId ?? null,
      lessonTitle: lessonInfo.get(s.conceptId)?.lessonTitle ?? null,
      mastery: s.mastery,
      decayedMastery: s.decayedMastery,
      level: s.level,
      labelAr: s.labelAr,
      trend: s.trend,
      attempts: s.attempts,
      correct: s.correct,
      daysSinceLastPractice: s.daysSinceLastPractice,
      availableQuestions: available.get(s.conceptId) ?? 0,
      openQuestions: openAvailable.get(s.conceptId) ?? 0,
      tracked: true,
    }));
    for (const c of allConcepts) {
      if (tracked.has(c.conceptId)) continue;
      const { level, labelAr } = describeMastery(0);
      items.push({
        conceptId: c.conceptId,
        code: c.code,
        title: c.title,
        lessonId: c.lessonId,
        lessonTitle: c.lessonTitle,
        mastery: 0,
        decayedMastery: 0,
        level,
        labelAr,
        trend: "steady",
        attempts: 0,
        correct: 0,
        daysSinceLastPractice: 0,
        availableQuestions: available.get(c.conceptId) ?? 0,
        openQuestions: openAvailable.get(c.conceptId) ?? 0,
        tracked: false,
      });
    }
    return sortPlan(items);
  }

  // --- PHASE 28 + 30 — LLM question generation (covers concepts with no questions) --

  /**
   * Student-facing generation (self-healing practice): exactly one question of
   * the requested kind for a concept the student is enrolled in when that kind
   * has no questions yet. Guards: unknown concept → 404; concept outside the
   * student's curricula → 404; concept already has that kind → 409. The
   * generated row is stored and immediately playable — one generation serves
   * every student of that curriculum.
   */
  async generateQuestionForStudent(
    studentId: string,
    conceptId: string,
    actorUserId: string,
    kind: "mcq" | "open" = "mcq",
  ): Promise<PracticeQuestion | null> {
    const concept = await this.db.db.select().from(concepts).where(eq(concepts.id, conceptId)).get();
    if (!concept) throw Errors.notFound("المفهوم غير موجود");
    const enrolled = await this.enrolledCurriculumIds(studentId);
    const curriculumId = await this.curriculumIdOfLesson(concept.lessonId);
    if (!curriculumId || !enrolled.includes(curriculumId)) {
      throw Errors.notFound("المفهوم غير متاح لك");
    }
    const existing = await this.countQuestionsForConcept(conceptId, kind);
    if (existing > 0) throw Errors.conflict("لهذا المفهوم أسئلة من هذا النوع متاحة بالفعل");
    const row = await this.generateQuestion(concept, curriculumId, actorUserId, kind);
    return this.toPublic(row);
  }

  /**
   * Admin bulk generation: one question of the requested kind per eligible
   * concept in the scope (a concept is eligible when it has none of that kind
   * in its curriculum yet). Idempotent — re-running skips everything already
   * covered. Never reports question content (admin stats stay metadata-only).
   */
  async generateQuestionsForScope(
    scope: { conceptId?: string; lessonId?: string; curriculumId?: string },
    actorUserId: string,
    kind: "mcq" | "open" = "mcq",
  ): Promise<AdminQuestionGenResult> {
    const concepts = await this.conceptsInScope(scope);
    const result: AdminQuestionGenResult = { generated: 0, skipped: 0, failed: 0, items: [] };
    for (const concept of concepts) {
      const curriculumId = await this.curriculumIdOfLesson(concept.lessonId);
      if (!curriculumId) {
        result.failed += 1;
        result.items.push({ conceptId: concept.id, title: concept.title, status: "failed", error: "لا ينتمي المفهوم لمنهج معلوم" });
        continue;
      }
      const existing = await this.countQuestionsForConcept(concept.id, kind);
      if (existing > 0) {
        result.skipped += 1;
        result.items.push({ conceptId: concept.id, title: concept.title, status: "skipped" });
        continue;
      }
      try {
        await this.generateQuestion(concept, curriculumId, actorUserId, kind);
        result.generated += 1;
        result.items.push({ conceptId: concept.id, title: concept.title, status: "generated" });
      } catch (err) {
        result.failed += 1;
        result.items.push({
          conceptId: concept.id,
          title: concept.title,
          status: "failed",
          error: err instanceof Error ? err.message : "تعذّر التوليد",
        });
      }
    }
    return result;
  }

  /** Generate + persist ONE grounded question (difficulty: easy) of the requested kind. */
  private async generateQuestion(
    concept: { id: string; lessonId: string; title: string },
    curriculumId: string,
    contextUserId: string,
    kind: "mcq" | "open",
  ) {
    const contextText = await this.groundingForLesson(concept.lessonId);
    const { system, user } = groundingPrompt({ conceptTitle: concept.title, context: contextText, kind });
    const response = await this.ai.complete({
      operation: "question_gen",
      json: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      contextUserId,
    });
    const now = new Date();
    if (kind === "open") {
      const parsed = parseGeneratedOpenQuestion(response.content);
      if (!parsed) {
        throw Errors.serviceUnavailable("تعذّر توليد سؤال مقالي صحيح من محتوى الدرس");
      }
      const row = {
        id: newId("q"),
        curriculumId,
        lessonId: concept.lessonId,
        conceptId: concept.id,
        difficulty: "easy" as const,
        type: "open" as const,
        content: parsed.content,
        explanation: parsed.explanation,
        optionsJson: null,
        // The model answer is the grading key — server-only, never exposed.
        answerKey: parsed.answerKey,
        createdAt: now,
      };
      await this.db.db.insert(questions).values(row);
      return row;
    }
    const parsed = parseGeneratedQuestion(response.content);
    if (!parsed) {
      throw Errors.serviceUnavailable("تعذّر توليد سؤال صحيح من محتوى الدرس");
    }
    const row = {
      id: newId("q"),
      curriculumId,
      lessonId: concept.lessonId,
      conceptId: concept.id,
      difficulty: "easy" as const,
      type: "mcq" as const,
      content: parsed.content,
      explanation: parsed.explanation,
      optionsJson: JSON.stringify({ options: parsed.options, correctIndex: parsed.correctIndex }),
      answerKey: null,
      createdAt: now,
    };
    await this.db.db.insert(questions).values(row);
    return row;
  }

  /** Grounding text for generation: the lesson's top chunks, bounded. */
  private async groundingForLesson(lessonId: string): Promise<string> {
    const rows = await this.db.db
      .select({ content: chunks.content })
      .from(chunks)
      .where(eq(chunks.lessonId, lessonId))
      .orderBy(asc(chunks.position), asc(chunks.id))
      .limit(QUESTION_GEN_MAX_CHUNKS);
    const text = rows
      .map((r) => r.content)
      .join("\n")
      .trim();
    if (text.length === 0) throw Errors.serviceUnavailable("لا يوجد محتوى للدرس لتوليد سؤال منه");
    return text.slice(0, QUESTION_GEN_MAX_CONTEXT_CHARS);
  }

  /** Concepts matching the admin generation scope (exactly one dimension). */
  private async conceptsInScope(scope: { conceptId?: string; lessonId?: string; curriculumId?: string }): Promise<Array<{ id: string; lessonId: string; title: string }>> {
    if (scope.conceptId) {
      const concept = await this.db.db
        .select({ id: concepts.id, lessonId: concepts.lessonId, title: concepts.title })
        .from(concepts)
        .where(eq(concepts.id, scope.conceptId))
        .get();
      return concept ? [concept] : [];
    }
    if (scope.lessonId) {
      return this.db.db
        .select({ id: concepts.id, lessonId: concepts.lessonId, title: concepts.title })
        .from(concepts)
        .where(eq(concepts.lessonId, scope.lessonId))
        .all();
    }
    return this.db.db
      .select({
        id: concepts.id,
        lessonId: concepts.lessonId,
        title: concepts.title,
      })
      .from(concepts)
      .innerJoin(lessons, eq(concepts.lessonId, lessons.id))
      .innerJoin(units, eq(lessons.unitId, units.id))
      .innerJoin(terms, eq(units.termId, terms.id))
      .where(eq(terms.curriculumId, scope.curriculumId ?? ""))
      .all();
  }

  /** How many questions of a type exist for a concept (any curriculum). */
  private async countQuestionsForConcept(conceptId: string, type: "mcq" | "open"): Promise<number> {
    const row = await this.db.db
      .select({ n: sql<number>`count(*)` })
      .from(questions)
      .where(and(eq(questions.type, type), eq(questions.conceptId, conceptId)))
      .get();
    return Number(row?.n ?? 0);
  }

  /** The curriculum a lesson belongs to (lessons → units → terms). */
  private async curriculumIdOfLesson(lessonId: string): Promise<string | null> {
    const row = await this.db.db
      .select({ curriculumId: terms.curriculumId })
      .from(lessons)
      .innerJoin(units, eq(lessons.unitId, units.id))
      .innerJoin(terms, eq(units.termId, terms.id))
      .where(eq(lessons.id, lessonId))
      .get();
    return row?.curriculumId ?? null;
  }

  /** Present a stored question for the student — NEVER includes the answer key. */
  private async toPublic(q: { id: string; content: string; optionsJson: string | null; type: "mcq" | "open"; conceptId: string | null; difficulty: "easy" | "medium" | "hard" }): Promise<PracticeQuestion | null> {
    if (q.type === "open") {
      const conceptTitle = q.conceptId
        ? (await this.db.db.select({ title: concepts.title }).from(concepts).where(eq(concepts.id, q.conceptId)).get())?.title ?? null
        : null;
      return {
        id: q.id,
        content: q.content,
        // Open questions have no options — the student writes the answer.
        options: null,
        type: "open",
        conceptId: q.conceptId,
        conceptTitle,
        difficulty: q.difficulty,
      };
    }
    const parsed = parseOptions(q.optionsJson);
    if (!parsed) return null;
    const conceptTitle = q.conceptId
      ? (await this.db.db.select({ title: concepts.title }).from(concepts).where(eq(concepts.id, q.conceptId)).get())?.title ?? null
      : null;
    return {
      id: q.id,
      content: q.content,
      options: parsed.options,
      type: "mcq",
      conceptId: q.conceptId,
      conceptTitle,
      difficulty: q.difficulty,
    };
  }
}

/** Options live in `optionsJson` as `{ options, correctIndex }` (seeded). */
function parseOptions(json: string | null): ParsedOptions | null {
  if (!json) return null;
  try {
    const value = JSON.parse(json) as { options?: unknown; correctIndex?: unknown };
    if (!Array.isArray(value.options) || typeof value.correctIndex !== "number") return null;
    if (value.options.some((o) => typeof o !== "string")) return null;
    const options = value.options as string[];
    if (value.correctIndex < 0 || value.correctIndex >= options.length) return null;
    return { options, correctIndex: value.correctIndex };
  } catch {
    return null;
  }
}