import { and, desc, eq } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import {
  assessments,
  concepts,
  learningSessions,
  sessionRecaps,
  studentMemories,
  studentProgress,
} from "../../db/schema.js";
import { newId } from "../../utils/ids.js";

export interface StudentMemorySnapshot {
  strengths: string[];
  weaknesses: string[];
  preferences: string[];
  facts: string[];
  recentRecaps: Array<{ sessionId: string; summary: string; createdAt: Date }>;
  masteryByConcept: Record<string, number>;
  totalAttempts: number;
  totalCorrect: number;
}

/**
 * Long-term memory + progress for a student. Feeds the tutor prompt so the
 * AI remembers what was taught and how the student is doing, session to
 * session. Also drives mastery tracking (assessments).
 */
export class MemoryService {
  constructor(private readonly db: Db) {}

  async snapshot(studentId: string): Promise<StudentMemorySnapshot> {
    const memories = await this.db.db
      .select()
      .from(studentMemories)
      .where(eq(studentMemories.studentId, studentId))
      .orderBy(desc(studentMemories.importance));

    const recaps = await this.db.db
      .select({
        sessionId: sessionRecaps.sessionId,
        summary: sessionRecaps.summary,
        createdAt: sessionRecaps.createdAt,
      })
      .from(sessionRecaps)
      .innerJoin(learningSessions, eq(sessionRecaps.sessionId, learningSessions.id))
      .where(eq(learningSessions.studentId, studentId))
      .orderBy(desc(sessionRecaps.createdAt))
      .limit(3);

    const progress = await this.db.db.select().from(studentProgress).where(eq(studentProgress.studentId, studentId));
    const masteryByConcept: Record<string, number> = {};
    let totalAttempts = 0;
    let totalCorrect = 0;
    for (const p of progress) {
      masteryByConcept[p.conceptId] = p.mastery;
      totalAttempts += p.attempts;
      totalCorrect += p.correct;
    }

    return {
      strengths: this.collect(memories, "strength"),
      weaknesses: this.collect(memories, "weakness"),
      preferences: this.collect(memories, "preference"),
      facts: this.collect(memories, "fact"),
      recentRecaps: recaps,
      masteryByConcept,
      totalAttempts,
      totalCorrect,
    };
  }

  /** Update (or create) a long-term memory entry keyed by kind+key. */
  async remember(studentId: string, kind: "strength" | "weakness" | "preference" | "fact", key: string, value: string, importance = 1): Promise<void> {
    const existing = await this.db.db
      .select()
      .from(studentMemories)
      .where(and(eq(studentMemories.studentId, studentId), eq(studentMemories.kind, kind), eq(studentMemories.key, key)))
      .get();
    const json = JSON.stringify(value);
    if (existing) {
      await this.db.db
        .update(studentMemories)
        .set({ valueJson: json, importance, updatedAt: new Date() })
        .where(eq(studentMemories.id, existing.id));
    } else {
      const now = new Date();
      await this.db.db.insert(studentMemories).values({
        id: newId("mem"),
        studentId,
        kind,
        key,
        valueJson: json,
        importance,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  /** Record an assessment attempt and update concept mastery (EWMA-style). */
  async recordAssessment(input: {
    studentId: string;
    sessionId?: string;
    conceptId: string;
    correct: boolean;
    type?: "concept_check" | "exercise";
  }): Promise<number> {
    const now = new Date();
    const row = await this.db.db
      .select()
      .from(studentProgress)
      .where(and(eq(studentProgress.studentId, input.studentId), eq(studentProgress.conceptId, input.conceptId)))
      .get();
    let mastery: number;
    if (row) {
      const attempts = row.attempts + 1;
      const correct = row.correct + (input.correct ? 1 : 0);
      // Slow-moving mastery: reward correctness, punish misses softly.
      mastery = Math.min(1, Math.max(0, row.mastery + (input.correct ? 0.15 : -0.1)));
      await this.db.db
        .update(studentProgress)
        .set({ mastery, attempts, correct, lastSeenAt: now })
        .where(eq(studentProgress.id, row.id));
    } else {
      mastery = input.correct ? 0.6 : 0.1;
      await this.db.db.insert(studentProgress).values({
        id: newId("prog"),
        studentId: input.studentId,
        conceptId: input.conceptId,
        mastery,
        attempts: 1,
        correct: input.correct ? 1 : 0,
        lastSeenAt: now,
      });
    }
    await this.db.db.insert(assessments).values({
      id: newId("asmt"),
      studentId: input.studentId,
      sessionId: input.sessionId ?? null,
      type: input.type ?? "concept_check",
      resultJson: JSON.stringify({ conceptId: input.conceptId, correct: input.correct }),
      total: 1,
      correct: input.correct ? 1 : 0,
      score: input.correct ? 1 : 0,
      createdAt: now,
    });
    return mastery;
  }

  async saveRecap(sessionId: string, summary: string, conceptsTouched: string[]): Promise<void> {
    await this.db.db.insert(sessionRecaps).values({
      id: newId("recap"),
      sessionId,
      summary,
      keyConceptsJson: JSON.stringify(conceptsTouched),
      createdAt: new Date(),
    });
  }

  async progressDetail(studentId: string, conceptId?: string) {
    const rows = await this.db.db
      .select({
        conceptId: studentProgress.conceptId,
        mastery: studentProgress.mastery,
        attempts: studentProgress.attempts,
        correct: studentProgress.correct,
        conceptTitle: concepts.title,
        conceptCode: concepts.code,
      })
      .from(studentProgress)
      .innerJoin(concepts, eq(studentProgress.conceptId, concepts.id))
      .where(conceptId ? and(eq(studentProgress.studentId, studentId), eq(studentProgress.conceptId, conceptId)) : eq(studentProgress.studentId, studentId));
    const strengths = rows.filter((r) => r.mastery >= 0.6).map((r) => ({ conceptId: r.conceptId, title: r.conceptTitle, mastery: r.mastery }));
    const weaknesses = rows.filter((r) => r.mastery < 0.6).map((r) => ({ conceptId: r.conceptId, title: r.conceptTitle, mastery: r.mastery }));
    return { concepts: rows, strengths, weaknesses };
  }

  private collect(memories: Array<{ id: string; kind: string; valueJson: string }>, kind: string): string[] {
    return memories
      .filter((m) => m.kind === kind)
      .map((m) => safeParseString(m.valueJson))
      .filter((v): v is string => Boolean(v));
  }
}

/** Tolerates corrupted value_json so one bad memory row can't break a session. */
function safeParseString(json: string): string | null {
  try {
    const value = JSON.parse(json) as unknown;
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}