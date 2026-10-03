import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_SOCIAL_G9_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_SOCIAL_G9_T1_UNITS,
  allLessonRanges,
  assertTreeMatchesTheBook,
  isConsistent,
  lessonBookRange,
  lessonDocument,
  loadBookPage,
} from "../../src/db/egyptSocialG9T1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 81 — Egypt Preparatory-3 (Grade 9) Social Studies is the OFFICIAL
 * first-term Ministry textbook (2026/2027 MoE edition): 4 units × 11 printed
 * lessons (one app lesson each), every lesson document assembled from the OCR of
 * the very pages the book prints for it — including its unit opener and its
 * «تقييم ختامي على الوحدة» block.
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the unit/lesson table, and its page ranges.
 */

/** Strips everything but letters and digits, so OCR spacing cannot break a match. */
function normalize(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

describe("PHASE 81 — Egypt Grade-9 Social official Ministry tree", () => {
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
    expect(result.pagesChecked).toBeGreaterThan(90);
  });

  it("reads the Social book at its own page offset", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(1);
    // Book page 8 is the unit-1 opener, book page 10 the first lesson.
    expect(loadBookPage(8)).toContain("الملامح الطبيعية والحضارية");
    expect(loadBookPage(10)).toContain("موقع ومظاهر سطح قارات");
  });

  it("tiles the book exactly: 4 units covering printed pages 8–111 once each", () => {
    expect(EGYPT_SOCIAL_G9_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual([
      [8, 35],
      [36, 61],
      [62, 89],
      [90, 111],
    ]);
    const ranges = allLessonRanges();
    expect(ranges.length).toBe(11);
    expect(ranges[0]!.from).toBe(8);
    expect(ranges[ranges.length - 1]!.to).toBe(111);
    // Contiguous: every lesson starts on the page after the previous one ended.
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
  });

  it("keeps each unit's opener and assessment inside that unit", () => {
    const ranges = allLessonRanges();
    // Lesson 1-1 owns the two-page unit-1 opener (8–9) and its own pages.
    const first = ranges.find((r) => r.key === "1-1")!;
    expect([first.from, first.to]).toEqual([8, 19]);
    expect(loadBookPage(8)).toContain("الوحدة");
    // Lesson 1-3 owns the unit-1 assessment (34–35).
    const last1 = ranges.find((r) => r.key === "1-3")!;
    expect([last1.from, last1.to]).toEqual([26, 35]);
    expect(loadBookPage(34)).toContain("تقييم ختامي على الوحدة الأولى");
    // The last unit's last lesson owns the final general review (108–111).
    const last = ranges.find((r) => r.key === "4-2")!;
    expect([last.from, last.to]).toEqual([100, 111]);
    expect(loadBookPage(108)).toContain("المراجعة العامة");
  });

  it("gives every lesson a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_SOCIAL_G9_T1_UNITS.forEach((unit, ui) => {
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
    expect(counted).toBe(11);
  });

  it("seeds the official tree: Social subject, 4 units, 11 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_SOCIAL_G9_SPEC);

    expect(seeded.curriculumId).toBeTruthy();
    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("social");
    expect(subject.nameAr).toBe("الدراسات الاجتماعية");

    const termRows = await db.db
      .select()
      .from(terms)
      .where(eq(terms.curriculumId, seeded.curriculumId))
      .orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1"]);
    const t1 = termRows[0]!;

    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.length).toBe(4);
    expect(unitRows[0]!.title).toBe("الوحدة الأولى: الملامح الطبيعية والحضارية لقارات العالم الجديد");
    expect(unitRows[3]!.title).toBe("الوحدة الرابعة: الحركة الوطنية في مواجهة الاحتلال البريطاني");

    // One lesson per printed درس, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g9-soc-1-1", "l-g9-soc-1-2", "l-g9-soc-1-3"],
      ["l-g9-soc-2-1", "l-g9-soc-2-2", "l-g9-soc-2-3"],
      ["l-g9-soc-3-1", "l-g9-soc-3-2", "l-g9-soc-3-3"],
      ["l-g9-soc-4-1", "l-g9-soc-4-2"],
    ]);
    // Codes must not collide with another seeded curriculum's.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-g9-soc-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_SOCIAL_G9_SPEC);

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

    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g9-soc-1-1")).get())!;
    expect(first.title).toBe("الدرس الأول: موقع ومظاهر سطح قارات العالم الجديد");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(firstText).toContain("موقع ومظاهر سطح قارات");
    expect(firstText).toContain("[صفحة الكتاب 8]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit1.id);
    }
  });
});
