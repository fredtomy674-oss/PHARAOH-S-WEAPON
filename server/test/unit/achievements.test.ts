import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import {
  achievements,
  learningSessions,
  messageAttachments,
  messages,
} from "../../src/db/schema.js";
import { ACHIEVEMENT_DEFINITIONS } from "../../src/modules/achievements/service.js";
import { newId } from "../../src/utils/ids.js";
import { makeApp, registerStudent, seedMiniCorpus, type AuthSession, type MiniCorpus, type TestApi } from "../helpers.js";

const PDF_MIME = "application/pdf";

/**
 * PHASE 20 — AchievementService unit coverage. The gamification tables were
 * schema-ready since PHASE 2; this service activates them: idempotent
 * definition seeding (unique by code), event-driven evaluation against the
 * student's own DB activity, and duplicate-proof awarding.
 */
describe("AchievementService (PHASE 20 — gamification)", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let student!: AuthSession;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    student = await registerStudent(api.app, "ach-unit@test.local");
  });

  afterAll(async () => {
    api.app.close();
  });

  const endedSession = async (): Promise<string> => {
    const now = new Date();
    const [row] = await api.db.db
      .insert(learningSessions)
      .values({
        id: newId("lsn"),
        studentId: student.studentId!,
        curriculumId: corpus.curriculumId,
        gradeId: corpus.gradeId,
        subjectId: corpus.subjectId,
        lessonId: corpus.lessonA,
        status: "ended",
        startedAt: now,
        endedAt: now,
      })
      .returning();
    return row!.id;
  };

  const insertUserMessage = async (sessionId: string): Promise<string> => {
    const [row] = await api.db.db
      .insert(messages)
      .values({ id: newId("msg"), sessionId, role: "user", kind: "text", content: "سؤال اختبار", createdAt: new Date() })
      .returning();
    return row!.id;
  };

  it("seeds definitions idempotently by code and starts fully locked", async () => {
    await api.app.achievements.ensureDefinitions();
    const first = await api.app.achievements.listForStudent(student.studentId!);
    await api.app.achievements.ensureDefinitions();
    const second = await api.app.achievements.listForStudent(student.studentId!);
    expect(first).toHaveLength(ACHIEVEMENT_DEFINITIONS.length);
    expect(second).toHaveLength(first.length);
    expect(second.every((a) => a.awardedAt === null)).toBe(true);
  });

  it("awards first_steps on the first ended session", async () => {
    await endedSession();
    const awarded = await api.app.achievements.evaluate(student.studentId!, "session_ended");
    expect(awarded.map((a) => a.code)).toContain("first_steps");
    expect(awarded[0]!.awardedAt).not.toBeNull();
  });

  it("never double-awards an already-earned badge", async () => {
    const awarded = await api.app.achievements.evaluate(student.studentId!, "session_ended");
    expect(awarded).toHaveLength(0);
    const earned = await api.app.achievements.listForStudent(student.studentId!);
    const firstSteps = earned.find((a) => a.code === "first_steps")!;
    expect(firstSteps.awardedAt).not.toBeNull();
  });

  it("awards explorer at 5 ended sessions and scholar at 10", async () => {
    for (let i = 0; i < 4; i++) await endedSession(); // total 5
    const atFive = await api.app.achievements.evaluate(student.studentId!, "session_ended");
    expect(atFive.map((a) => a.code)).toContain("explorer");
    for (let i = 0; i < 5; i++) await endedSession(); // total 10
    const atTen = await api.app.achievements.evaluate(student.studentId!, "session_ended");
    expect(atTen.map((a) => a.code)).toEqual(["scholar"]);
  });

  it("awards chatty_student once 50 user messages exist", async () => {
    const sessionId = await endedSession();
    for (let i = 0; i < 50; i++) await insertUserMessage(sessionId);
    const awarded = await api.app.achievements.evaluate(student.studentId!, "user_message");
    expect(awarded.map((a) => a.code)).toContain("chatty_student");
  });

  it("awards bookworm for a PDF attachment and photographer for an image", async () => {
    const sessionId = await endedSession();
    const pdfMessageId = await insertUserMessage(sessionId);
    await api.db.db.insert(messageAttachments).values({
      id: newId("att"),
      messageId: pdfMessageId,
      sessionId,
      mimeType: PDF_MIME,
      fileName: "كتاب.pdf",
      sizeBytes: 12,
      sha256: "a".repeat(64),
      data: Buffer.from([1, 2, 3]),
      createdAt: new Date(),
    });
    const imageMessageId = await insertUserMessage(sessionId);
    await api.db.db.insert(messageAttachments).values({
      id: newId("att"),
      messageId: imageMessageId,
      sessionId,
      mimeType: "image/png",
      fileName: "سؤال.png",
      sizeBytes: 12,
      sha256: "b".repeat(64),
      data: Buffer.from([4, 5, 6]),
      createdAt: new Date(),
    });

    const forDocs = await api.app.achievements.evaluate(student.studentId!, "document_attached");
    expect(forDocs.map((a) => a.code)).toContain("bookworm");
    const forVision = await api.app.achievements.evaluate(student.studentId!, "vision_attached");
    expect(forVision.map((a) => a.code)).toContain("photographer");
  });

  it("isolates achievements between students", async () => {
    const other = await registerStudent(api.app, "ach-unit-b@test.local");
    const items = await api.app.achievements.listForStudent(other.studentId!);
    expect(items.every((a) => a.awardedAt === null)).toBe(true);
    // And the first student still has their awards (no cross-leak).
    const mine = await api.db.db.select().from(achievements).where(eq(achievements.studentId, student.studentId!));
    expect(mine.length).toBeGreaterThan(0);
  });
});