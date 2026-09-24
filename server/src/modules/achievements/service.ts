import { and, count, eq, like, or } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { achievementDefinitions, achievements, learningSessions, messageAttachments, messages } from "../../db/schema.js";
import { newId } from "../../utils/ids.js";

/**
 * PHASE 20 — Achievements (gamification activation).
 *
 * `achievement_definitions` + `achievements` were schema-ready since PHASE 2;
 * this service turns them on:
 *   - Definitions are seeded idempotently by `code` (unique index).
 *   - Criteria live in code (criteriaJson mirrors them for visibility); each
 *     trigger event counts the student's own DB activity and awards every
 *     definition whose threshold it has reached.
 *   - Awarding is best-effort and duplicate-proof (unique student+definition,
 *     onConflictDoNothing) — a re-run can never double-award or crash a turn.
 */
export type AchievementEvent = "session_ended" | "user_message" | "document_attached" | "vision_attached";

interface DefinitionSeed {
  code: string;
  title: string;
  description: string;
  event: AchievementEvent;
  min: number;
}

export const ACHIEVEMENT_DEFINITIONS: readonly DefinitionSeed[] = [
  { code: "first_steps", title: "أول خطوة", description: "أكمل أول جلسة تعلّم كاملة.", event: "session_ended", min: 1 },
  { code: "explorer", title: "مستكشف", description: "أكمل 5 جلسات تعلّم.", event: "session_ended", min: 5 },
  { code: "scholar", title: "عالِم صغير", description: "أكمل 10 جلسات تعلّم.", event: "session_ended", min: 10 },
  { code: "chatty_student", title: "بارع الحوار", description: "أرسل 50 سؤالًا إلى المعلّم.", event: "user_message", min: 50 },
  { code: "bookworm", title: "قارئ نهم", description: "أرفق أول ملف PDF أو DOCX بسؤالك.", event: "document_attached", min: 1 },
  { code: "photographer", title: "مصوّر الأسئلة", description: "أرفق أول صورة لسؤال مكتوب.", event: "vision_attached", min: 1 },
];

export interface AchievementView {
  code: string;
  title: string;
  description: string | null;
  /** ISO timestamp when earned, or null while still locked. */
  awardedAt: string | null;
}

export class AchievementService {
  constructor(private readonly db: Db) {}

  /** Idempotent seeding by unique code (safe on every call/DB). */
  async ensureDefinitions(): Promise<void> {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      await this.db.db
        .insert(achievementDefinitions)
        .values({
          id: newId("achd"),
          code: def.code,
          title: def.title,
          description: def.description,
          criteriaJson: JSON.stringify({ event: def.event, min: def.min }),
        })
        .onConflictDoNothing({ target: achievementDefinitions.code });
    }
  }

  /** All definitions for a student: earned (awardedAt set) + locked (null). */
  async listForStudent(studentId: string): Promise<AchievementView[]> {
    await this.ensureDefinitions();
    const defs = await this.db.db.select().from(achievementDefinitions);
    const earned = await this.db.db.select().from(achievements).where(eq(achievements.studentId, studentId));
    const rowByCode = new Map(defs.map((d) => [d.code, d]));
    const awardedAtByDef = new Map(earned.map((e) => [e.definitionId, e.awardedAt]));
    const items: AchievementView[] = [];
    for (const seed of ACHIEVEMENT_DEFINITIONS) {
      const row = rowByCode.get(seed.code);
      if (!row) continue; // definitions ensure'd above — defensive only
      const at = awardedAtByDef.get(row.id);
      items.push({
        code: seed.code,
        title: seed.title,
        description: seed.description,
        awardedAt: at ? at.toISOString() : null,
      });
    }
    return items;
  }

  /**
   * Triggered by a lifecycle event: counts the student's own activity and
   * awards every still-missing definition whose threshold it reaches.
   * Returns only the newly awarded ones (previous awards stay put).
   */
  async evaluate(studentId: string, event: AchievementEvent): Promise<AchievementView[]> {
    const used = ACHIEVEMENT_DEFINITIONS.some((d) => d.event === event);
    if (!used) return [];
    await this.ensureDefinitions();
    const total = await this.countForEvent(studentId, event);
    const defs = await this.db.db.select().from(achievementDefinitions);
    const rowByCode = new Map(defs.map((d) => [d.code, d]));
    const awarded: AchievementView[] = [];
    for (const seed of ACHIEVEMENT_DEFINITIONS) {
      if (seed.event !== event || total < seed.min) continue;
      const row = rowByCode.get(seed.code);
      if (!row) continue;
      const inserted = await this.db.db
        .insert(achievements)
        .values({ id: newId("ach"), studentId, definitionId: row.id, awardedAt: new Date() })
        .onConflictDoNothing({ target: [achievements.studentId, achievements.definitionId] })
        .returning();
      if (inserted.length > 0) {
        awarded.push({ code: seed.code, title: seed.title, description: seed.description, awardedAt: inserted[0]!.awardedAt.toISOString() });
      }
    }
    return awarded;
  }

  /** Per-event counters, always scoped to the student's own sessions. */
  private async countForEvent(studentId: string, event: AchievementEvent): Promise<number> {
    const db = this.db.db;
    if (event === "session_ended") {
      return (
        db
          .select({ n: count() })
          .from(learningSessions)
          .where(and(eq(learningSessions.studentId, studentId), eq(learningSessions.status, "ended")))
          .get()?.n ?? 0
      );
    }
    if (event === "user_message") {
      return (
        db
          .select({ n: count() })
          .from(messages)
          .innerJoin(learningSessions, eq(messages.sessionId, learningSessions.id))
          .where(and(eq(learningSessions.studentId, studentId), eq(messages.role, "user")))
          .get()?.n ?? 0
      );
    }
    const documentsOnly =
      or(
        eq(messageAttachments.mimeType, "application/pdf"),
        eq(messageAttachments.mimeType, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
      ) ?? undefined;
    if (event === "document_attached") {
      return (
        db
          .select({ n: count() })
          .from(messageAttachments)
          .innerJoin(learningSessions, eq(messageAttachments.sessionId, learningSessions.id))
          .where(and(eq(learningSessions.studentId, studentId), documentsOnly))
          .get()?.n ?? 0
      );
    }
    // vision_attached
    return (
      db
        .select({ n: count() })
        .from(messageAttachments)
        .innerJoin(learningSessions, eq(messageAttachments.sessionId, learningSessions.id))
        .where(and(eq(learningSessions.studentId, studentId), like(messageAttachments.mimeType, "image/%")))
        .get()?.n ?? 0
    );
  }
}