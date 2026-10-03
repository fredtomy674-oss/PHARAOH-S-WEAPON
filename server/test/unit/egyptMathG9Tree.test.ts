import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_MATH_G9_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_MATH_G9_T1_UNITS,
  allLessonRanges,
  assertTreeMatchesTheBook,
  isConsistent,
  lessonBookRange,
  lessonDocument,
  loadBookPage,
  printedFooter,
} from "../../src/db/egyptMathG9T1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 83 — Egypt Preparatory-3 (Grade 9) Mathematics is the OFFICIAL
 * first-term Ministry textbook (2026/2027 MoE edition): 4 units × 15 printed
 * lessons (one app lesson each), every lesson document assembled from the OCR of
 * the very pages the book prints for it — including its unit opener and its
 * «تقييم الوحدة» block.
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the unit/lesson table, and its page ranges.
 */

/** Strips everything but letters and digits, so OCR spacing cannot break a match. */
function normalize(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

describe("PHASE 83 — Egypt Grade-9 Mathematics official Ministry tree", () => {
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
    expect(result.pagesChecked).toBeGreaterThan(60);
  });

  it("reads the maths book at its own page offset", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(5);
    // Book page 1 is the unit-1 opener, book page 2 the first lesson.
    expect(normalize(loadBookPage(1))).toContain(normalize("الأعداد والعمليات عليها"));
    expect(normalize(loadBookPage(2))).toContain(normalize("قوى القوى"));
    // The foot wraps a running head, so the page number must still be read.
    expect(printedFooter(14)).toBe(14);
    expect(printedFooter(55)).toBe(55);
  });

  it("tiles the book exactly: 4 units covering printed pages 1–107 once each", () => {
    expect(EGYPT_MATH_G9_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual([
      [1, 12],
      [13, 46],
      [47, 94],
      [95, 107],
    ]);
    const ranges = allLessonRanges();
    expect(ranges.length).toBe(15);
    expect(ranges[0]!.from).toBe(1);
    expect(ranges[ranges.length - 1]!.to).toBe(107);
    // Contiguous: every lesson starts on the page after the previous one ended.
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
  });

  it("keeps each unit's opener and assessment inside that unit", () => {
    const ranges = allLessonRanges();
    // Lesson 1-1 owns the unit-1 opener (1) and its own pages.
    const first = ranges.find((r) => r.key === "1-1")!;
    expect([first.from, first.to]).toEqual([1, 6]);
    expect(normalize(loadBookPage(1))).toContain(normalize("الوحدة 1"));
    // Lesson 2-5 owns the unit-2 «تقييم الوحدة الثانية» (45–46).
    const last2 = ranges.find((r) => r.key === "2-5")!;
    expect([last2.from, last2.to]).toEqual([38, 46]);
    expect(normalize(loadBookPage(45))).toContain(normalize("تقييم الوحدة الثانية"));
    // Lesson 3-7 owns the unit-3 «تقييم الوحدة الثالثة» (93–94).
    const last3 = ranges.find((r) => r.key === "3-7")!;
    expect([last3.from, last3.to]).toEqual([86, 94]);
    expect(normalize(loadBookPage(93))).toContain(normalize("تقييم الوحدة الثالثة"));
    // The last unit's only lesson owns the final «تقييم نهائى» (105–107).
    const last = ranges.find((r) => r.key === "4-1")!;
    expect([last.from, last.to]).toEqual([95, 107]);
    expect(normalize(loadBookPage(107))).toContain(normalize("تقييم نهائى"));
  });

  it("gives every lesson a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_MATH_G9_T1_UNITS.forEach((unit, ui) => {
      unit.lessons.forEach((lesson, li) => {
        const { from, to } = lessonBookRange(ui, li);
        const doc = lessonDocument(ui, li);
        expect(doc.length).toBeGreaterThan(0);
        // The title the book prints at the head of the lesson is retrievable.
        expect(normalize(doc)).toContain(normalize(lesson.title));
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
    expect(counted).toBe(15);
  });

  it("seeds the official tree: maths subject, 4 units, 15 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_MATH_G9_SPEC);

    expect(seeded.curriculumId).toBeTruthy();
    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("math");
    expect(subject.nameAr).toBe("الرياضيات");

    const termRows = await db.db
      .select()
      .from(terms)
      .where(eq(terms.curriculumId, seeded.curriculumId))
      .orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1"]);
    const t1 = termRows[0]!;

    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.length).toBe(4);
    expect(unitRows[0]!.title).toBe("الوحدة الأولى: الأعداد والعمليات عليها");
    expect(unitRows[3]!.title).toBe("الوحدة الرابعة: الإحصاء");

    // One lesson per printed درس, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g9-math-1-1", "l-g9-math-1-2"],
      ["l-g9-math-2-1", "l-g9-math-2-2", "l-g9-math-2-3", "l-g9-math-2-4", "l-g9-math-2-5"],
      ["l-g9-math-3-1", "l-g9-math-3-2", "l-g9-math-3-3", "l-g9-math-3-4", "l-g9-math-3-5", "l-g9-math-3-6", "l-g9-math-3-7"],
      ["l-g9-math-4-1"],
    ]);
    // Codes must not collide with another seeded curriculum's.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-g9-math-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_MATH_G9_SPEC);

    const t1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, seeded.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const unit1 = (await db.db
      .select()
      .from(units)
      .where(and(eq(units.termId, t1.id), eq(units.code, "unit-1")))
      .get())!;

    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g9-math-1-1")).get())!;
    expect(first.title).toBe("الدرس الأول: قوى القوى");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(normalize(firstText)).toContain(normalize("قوى القوى"));
    expect(firstText).toContain("[صفحة الكتاب 1]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit1.id);
    }
  });
});
