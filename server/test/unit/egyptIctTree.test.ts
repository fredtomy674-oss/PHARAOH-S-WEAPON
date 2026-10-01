import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_ICT_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_ICT_T1_UNITS,
  allLessonRanges,
  assertTreeMatchesTheBook,
  isConsistent,
  lessonBookRange,
  lessonDocument,
  loadBookPage,
} from "../../src/db/egyptIctT1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 62 — Egypt Grade-6 ICT is now the OFFICIAL first-term Ministry textbook
 * (2026/2027 MoE edition): 2 units × 6 printed lessons (one app lesson each),
 * every lesson document assembled from the OCR of the very pages the book prints
 * for it — including the «الأسئلة وتدريبات» block the book keeps inside the
 * lesson.
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the unit/lesson table, and its page ranges.
 */
describe("PHASE 62 — Egypt Grade-6 ICT official Ministry tree", () => {
  it("has a table whose invariants hold: keys, unit bounds, gap-free tiling", () => {
    const { ok, problems } = isConsistent();
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
  });

  it("matches the book: every content page is mapped, footers and titles agree", () => {
    const result = assertTreeMatchesTheBook();
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
    // The book's own running feet were read, not a sample.
    expect(result.pagesChecked).toBeGreaterThan(30);
  });

  it("reads the ICT book at its own page offset", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(0);
    // Book page 7 is the unit-1 opener, book page 8 the first lesson.
    expect(loadBookPage(7)).toContain("دور تكنولوجيا المعلومات في حياتنا");
    expect(loadBookPage(8)).toContain("شبكات الكمبيوتر");
  });

  it("tiles the book exactly: 2 units covering printed pages 7–57 once each", () => {
    expect(EGYPT_ICT_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual([
      [7, 27],
      [28, 57],
    ]);
    const ranges = allLessonRanges();
    expect(ranges.length).toBe(12);
    expect(ranges[0]!.from).toBe(7);
    expect(ranges[ranges.length - 1]!.to).toBe(57);
    // Contiguous: every lesson starts on the page after the previous one ended.
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
  });

  it("keeps a lesson's own exercises and its unit opener inside that lesson", () => {
    const ranges = allLessonRanges();
    // Lesson 1-1 owns the unit-1 opener (7) and its exercise block (8–10).
    const first = ranges.find((r) => r.key === "1-1")!;
    expect([first.from, first.to]).toEqual([7, 10]);
    expect(loadBookPage(10)).toContain("الأسئلة وتدريبات");
    // Lesson 2-6 opens on 53 and owns the unit's closing exercises (56–57).
    const last = ranges.find((r) => r.key === "2-6")!;
    expect([last.from, last.to]).toEqual([53, 57]);
    expect(loadBookPage(56)).toContain("الأسئلة وتدريبات");
    expect(loadBookPage(57)).toContain("OneDrive");
  });

  it("gives every lesson a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_ICT_T1_UNITS.forEach((unit, ui) => {
      unit.lessons.forEach((lesson, li) => {
        const { from, to } = lessonBookRange(ui, li);
        const doc = lessonDocument(ui, li);
        expect(doc.length).toBeGreaterThan(0);
        // The title the book prints is retrievable for this lesson.
        expect(doc).toContain(lesson.title);
        // Every page of the range is stamped, so a citation points at a real page.
        for (let book = from; book <= to; book++) {
          expect(doc).toContain(`[صفحة الكتاب ${book}]`);
        }
        // And nothing from the next lesson's pages leaked in.
        const nextStart = unit.lessons[li + 1]?.bookFrom;
        if (nextStart) expect(doc).not.toContain(`[صفحة الكتاب ${nextStart}]`);
        counted++;
      });
    });
    expect(counted).toBe(12);
  });

  it("seeds the official tree: ICT subject, 2 units, 12 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ICT_SPEC);

    expect(seeded.curriculumId).toBeTruthy();
    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("ict");
    expect(subject.nameAr).toBe("تكنولوجيا المعلومات والاتصالات");

    const termRows = await db.db
      .select()
      .from(terms)
      .where(eq(terms.curriculumId, seeded.curriculumId))
      .orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1"]);
    const t1 = termRows[0]!;

    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.length).toBe(2);
    expect(unitRows[0]!.title).toBe("الوحدة الأولى: دور تكنولوجيا المعلومات في حياتنا");
    expect(unitRows[1]!.title).toBe("الوحدة الثانية: احتياطات الأمن والسلامة الرقمية");

    // One lesson per printed درس, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-ict-1-1", "l-ict-1-2", "l-ict-1-3", "l-ict-1-4", "l-ict-1-5", "l-ict-1-6"],
      ["l-ict-2-1", "l-ict-2-2", "l-ict-2-3", "l-ict-2-4", "l-ict-2-5", "l-ict-2-6"],
    ]);
    // Codes must not collide with another seeded curriculum's.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-ict-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ICT_SPEC);

    const t1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, seeded.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const unit2 = (await db.db.select().from(units).where(and(eq(units.termId, t1.id), eq(units.code, "unit-2"))).get())!;

    // The first lesson: the book's own pages, unit opener included.
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-ict-1-1")).get())!;
    expect(first.title).toBe("الدرس الأول: شبكات الكمبيوتر");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(firstText).toContain("شبكات الكمبيوتر");
    expect(firstText).toContain("[صفحة الكتاب 7]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
    }

    // A lesson in the LAST unit must be scoped to that unit, not unit-1.
    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-ict-2-6")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit2.id);
    }
  });
});
