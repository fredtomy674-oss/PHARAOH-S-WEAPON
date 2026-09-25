import { and, asc, eq, inArray } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { answers, concepts, curriculumEnrollments, questions } from "../../db/schema.js";
import type { MemoryService } from "../tutor/memoryService.js";
import type { MasteryLevel } from "../progress/mastery.js";
import { Errors } from "../../utils/errors.js";
import { newId } from "../../utils/ids.js";

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

interface ParsedOptions {
  options: string[];
  correctIndex: number;
}

/**
 * PHASE 24 — practice loop for the concept-mastery engine. Serves MCQ
 * questions scoped to the student's enrolled curricula (weakest tracked
 * concepts first) and grades answers deterministically, feeding every
 * answered question into `MemoryService.recordAssessment` — the first
 * production caller of the previously dormant assessment path. No AI
 * provider involved: grading is pure, so it is fully offline-testable.
 */
export class PracticeService {
  constructor(
    private readonly db: Db,
    private readonly memory: MemoryService,
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
    await this.memory.recordAssessment({ studentId, conceptId: q.conceptId, correct, type: "exercise" });
    const summary = await this.memory.masterySummary(studentId);
    const entry = summary.find((s) => s.conceptId === q.conceptId) ?? null;
    return {
      correct,
      explanation: q.explanation,
      mastery: entry ? { score: entry.mastery, decayedScore: entry.decayedMastery, level: entry.level, labelAr: entry.labelAr } : null,
    };
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