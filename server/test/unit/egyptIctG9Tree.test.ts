import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_ICT_G9_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_ICT_G9_T1_UNITS,
  allLessonRanges,
  assertTreeMatchesTheBook,
  isConsistent,
  lessonBookRange,
  lessonDocument,
  loadBookPage,
} from "../../src/db/egyptIctG9T1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 79 — Egypt Preparatory-3 (Grade 9) ICT is the OFFICIAL first-term
 * Ministry textbook (2026/2027 MoE edition): 2 units × 9 printed lessons (one
 * app lesson each), every lesson document assembled from the OCR of the very
 * pages the book prints for it — including its divider page, its «أهداف الدرس»,
 * and its exercise block.
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the unit/lesson table, and its page ranges.
 */
describe("PHASE 79 — Egypt Grade-9 ICT official Ministry tree", () => {
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
    // Book page 4 is the unit-1 opener, book page 5 the first lesson.
    expect(loadBookPage(4)).toContain("الذكاء الاصطناعي ولغات البرمجة");
    expect(loadBookPage(5)).toContain("التفكير الحاسوبي");
  });

  it("tiles the book exactly: 2 units covering printed pages 4–95 once each", () => {
    expect(EGYPT_ICT_G9_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual([
      [4, 63],
      [64, 95],
    ]);
    const ranges = allLessonRanges();
    expect(ranges.length).toBe(9);
    expect(ranges[0]!.from).toBe(4);
    expect(ranges[ranges.length - 1]!.to).toBe(95);
    // Contiguous: every lesson starts on the page after the previous one ended.
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
  });

  it("keeps a lesson's own exercises and its unit opener inside that lesson", () => {
    const ranges = allLessonRanges();
    // Lesson 1-1 owns the unit-1 opener (4) and its exercise block through 17.
    const first = ranges.find((r) => r.key === "1-1")!;
    expect([first.from, first.to]).toEqual([4, 17]);
    // Lesson 2-4 opens on 87 and owns the unit's closing exercises (94–95).
    const last = ranges.find((r) => r.key === "2-4")!;
    expect([last.from, last.to]).toEqual([87, 95]);
    expect(loadBookPage(95)).toContain("الصف الثالث");
  });

  it("gives every lesson a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_ICT_G9_T1_UNITS.forEach((unit, ui) => {
      unit.lessons.forEach((lesson, li) => {
        const { from, to } = lessonBookRange(ui, li);
        const doc = lessonDocument(ui, li);
        expect(doc.length).toBeGreaterThan(0);
        // The title the book prints is retrievable for this lesson. It wraps
        // over two printed lines, so whitespace is collapsed before comparing.
        expect(doc.replace(/\s+/g, " ")).toContain(lesson.title);
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
    expect(counted).toBe(9);
  });

  it("seeds the official tree: ICT subject, 2 units, 9 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ICT_G9_SPEC);

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
    expect(unitRows[0]!.title).toBe("الوحدة الأولى: الذكاء الاصطناعي ولغات البرمجة");
    expect(unitRows[1]!.title).toBe("الوحدة الثانية: الذكاء الاصطناعي والأمن السيبراني");

    // One lesson per printed درس, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g9-ict-1-1", "l-g9-ict-1-2", "l-g9-ict-1-3", "l-g9-ict-1-4", "l-g9-ict-1-5"],
      ["l-g9-ict-2-1", "l-g9-ict-2-2", "l-g9-ict-2-3", "l-g9-ict-2-4"],
    ]);
    // Codes must not collide with another seeded curriculum's.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-g9-ict-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ICT_G9_SPEC);

    const t1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, seeded.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const unit2 = (await db.db.select().from(units).where(and(eq(units.termId, t1.id), eq(units.code, "unit-2"))).get())!;

    // The first lesson: the book's own pages, unit opener included.
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g9-ict-1-1")).get())!;
    expect(first.title).toBe("الدرس الأول: التفكير الحاسوبي وحل المشكلات");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(firstText).toContain("التفكير الحاسوبي");
    expect(firstText).toContain("[صفحة الكتاب 4]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
    }

    // A lesson in the LAST unit must be scoped to that unit, not unit-1.
    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g9-ict-2-4")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit2.id);
    }
  });
});
