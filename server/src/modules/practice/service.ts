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
import { groundingPrompt, parseGeneratedQuestion, QUESTION_GEN_MAX_CHUNKS, QUESTION_GEN_MAX_CONTEXT_CHARS } from "./questionGen.js";

/** A question the student can answer — NEVER includes the answer key. */
export interface PracticeQuestion {
  id: string;
  content: string;
  options: string[];
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
  /** null when the question is not linked to a concept (no mastery impact). */
  mastery: PracticeMastery | null;
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
 * question difficulty and feed the practice/mastery achievements. No AI
 * provider involved: grading is pure, so it is fully offline-testable.
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
   * Pick the next question: an explicit concept when asked, otherwise the
   * student's weakest tracked concept first, falling back to any enrolled
   * curriculum question (deterministic: oldest first).
   */
  async questionFor(studentId: string, conceptId?: string): Promise<PracticeQuestion | null> {
    const enrolled = await this.enrolledCurriculumIds(studentId);
    if (enrolled.length === 0) return null;
    const base = and(eq(questions.type, "mcq"), inArray(questions.curriculumId, enrolled));

    if (conceptId) {
      const row = await this.db.db
        .select()
        .from(questions)
        .where(and(base, eq(questions.conceptId, conceptId)))
        .orderBy(asc(questions.createdAt), asc(questions.id))
        .limit(1)
        .get();
      return row ? this.toPublic(row) : null;
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
      if (row) return this.toPublic(row);
    }

    const any = await this.db.db
      .select()
      .from(questions)
      .where(base)
      .orderBy(asc(questions.createdAt), asc(questions.id))
      .limit(1)
      .get();
    return any ? this.toPublic(any) : null;
  }

  /**
   * Grade an MCQ answer, persist the attempt, and update concept mastery.
   * Throws 404 when the question is unlinked to the student's curricula and
   * 400 for out-of-range options; other races surface as 500 via the mapper.
   */
  async submitAnswer(studentId: string, questionId: string, optionIndex: number, sessionId?: string): Promise<PracticeResult> {
    const enrolled = await this.enrolledCurriculumIds(studentId);
    const q = await this.db.db.select().from(questions).where(eq(questions.id, questionId)).get();
    if (!q || !q.curriculumId || !enrolled.includes(q.curriculumId)) {
      throw Errors.notFound("السؤال غير متاح لك");
    }
    const parsed = parseOptions(q.optionsJson);
    if (!parsed) throw Errors.internal("تعذر قراءة السؤال");
    if (optionIndex >= parsed.options.length) throw Errors.badRequest("اختر خيارًا صالحًا", "INVALID_OPTION");

    const correct = optionIndex === parsed.correctIndex;
    const now = new Date();
    // optionIndex < options.length is enforced above, so this is safe.
    const chosen = parsed.options[optionIndex]!;
    await this.db.db.insert(answers).values({
      id: newId("ans"),
      questionId,
      studentId,
      sessionId: sessionId ?? null,
      content: chosen,
      correct: correct ? 1 : 0,
      createdAt: now,
    });

    if (!q.conceptId) {
      return { correct, explanation: q.explanation, mastery: null };
    }
    await this.memory.recordAssessment({ studentId, conceptId: q.conceptId, correct, type: "exercise", difficulty: q.difficulty });
    const summary = await this.memory.masterySummary(studentId);
    const entry = summary.find((s) => s.conceptId === q.conceptId) ?? null;
    // PHASE 26 — the mastery engine now feeds badges (best-effort, never blocks
    // the answer): practice activity + concepts at the «متقن» display level.
    try {
      await this.achievements.evaluate(studentId, "practice_answer");
      await this.achievements.evaluate(studentId, "mastery_achieved");
    } catch {
      // Badge bookkeeping must never break the core loop — next answer retries.
    }
    return {
      correct,
      explanation: q.explanation,
      mastery: entry ? { score: entry.mastery, decayedScore: entry.decayedMastery, level: entry.level, labelAr: entry.labelAr } : null,
    };
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
        tracked: false,
      });
    }
    return sortPlan(items);
  }

  // --- PHASE 28 — LLM question generation (covers concepts with no questions) --

  /**
   * Student-facing generation (self-healing practice): exactly one MCQ for a
   * concept the student is enrolled in when it has no questions yet. Guards:
   * unknown concept → 404; concept outside the student's curricula → 404;
   * concept already has questions → 409. The generated row is stored and
   * immediately playable — one generation serves every student of that
   * curriculum.
   */
  async generateQuestionForStudent(studentId: string, conceptId: string, actorUserId: string): Promise<PracticeQuestion | null> {
    const concept = await this.db.db.select().from(concepts).where(eq(concepts.id, conceptId)).get();
    if (!concept) throw Errors.notFound("المفهوم غير موجود");
    const enrolled = await this.enrolledCurriculumIds(studentId);
    const curriculumId = await this.curriculumIdOfLesson(concept.lessonId);
    if (!curriculumId || !enrolled.includes(curriculumId)) {
      throw Errors.notFound("المفهوم غير متاح لك");
    }
    const existing = await this.countMcqForConcept(conceptId);
    if (existing > 0) throw Errors.conflict("لهذا المفهوم أسئلة متاحة بالفعل");
    const row = await this.generateQuestion(concept, curriculumId, actorUserId);
    return this.toPublic(row);
  }

  /**
   * Admin bulk generation: one MCQ per eligible concept in the scope (a
   * concept is eligible when it has no MCQs in its curriculum yet). Idempotent
   * — re-running skips everything already covered. Never reports question
   * content (admin stats stay metadata-only).
   */
  async generateQuestionsForScope(
    scope: { conceptId?: string; lessonId?: string; curriculumId?: string },
    actorUserId: string,
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
      const existing = await this.countMcqForConcept(concept.id);
      if (existing > 0) {
        result.skipped += 1;
        result.items.push({ conceptId: concept.id, title: concept.title, status: "skipped" });
        continue;
      }
      try {
        await this.generateQuestion(concept, curriculumId, actorUserId);
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

  /** Generate + persist ONE grounded MCQ for a concept (difficulty: easy). */
  private async generateQuestion(
    concept: { id: string; lessonId: string; title: string },
    curriculumId: string,
    contextUserId: string,
  ) {
    const contextText = await this.groundingForLesson(concept.lessonId);
    const { system, user } = groundingPrompt({ conceptTitle: concept.title, context: contextText });
    const response = await this.ai.complete({
      operation: "question_gen",
      json: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      contextUserId,
    });
    const parsed = parseGeneratedQuestion(response.content);
    if (!parsed) {
      throw Errors.serviceUnavailable("تعذّر توليد سؤال صحيح من محتوى الدرس");
    }
    const now = new Date();
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

  /** How many MCQ questions exist for a concept (any curriculum). */
  private async countMcqForConcept(conceptId: string): Promise<number> {
    const row = await this.db.db
      .select({ n: sql<number>`count(*)` })
      .from(questions)
      .where(and(eq(questions.type, "mcq"), eq(questions.conceptId, conceptId)))
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

  private async toPublic(q: { id: string; content: string; optionsJson: string | null; conceptId: string | null; difficulty: "easy" | "medium" | "hard" }): Promise<PracticeQuestion | null> {
    const parsed = parseOptions(q.optionsJson);
    if (!parsed) return null;
    const conceptTitle = q.conceptId
      ? (await this.db.db.select({ title: concepts.title }).from(concepts).where(eq(concepts.id, q.conceptId)).get())?.title ?? null
      : null;
    return {
      id: q.id,
      content: q.content,
      options: parsed.options,
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