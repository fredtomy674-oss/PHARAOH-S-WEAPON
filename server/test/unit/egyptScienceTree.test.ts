import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_SCIENCE_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_SCIENCE_T1_UNITS,
  allConceptRanges,
  assertTreeMatchesTheBook,
  conceptBookRange,
  conceptDocument,
  isConsistent,
  loadBookPage,
} from "../../src/db/egyptScienceT1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, concepts, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 59 — Egypt Grade-6 Science is now the OFFICIAL first-term Ministry
 * textbook (2026/2027 MoE edition): 10 chapters, 22 printed concepts (one app
 * lesson each), every lesson document assembled from the OCR of the very pages
 * the book prints for that concept.
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the chapter/concept table, and its page ranges.
 *  - The table invariants (keys, chapter bounds, a gap-free tiling of the book).
 *  - The ranges against the book itself: every printed page that carries a
 *    concept head must fall inside that concept's derived range, and every
 *    concept must actually be printed on the pages it claims. Measured, not
 *    assumed — the same check the seeder refuses to seed without.
 *  - The derived end page keeps a concept's own exercises («حاول» / «تدرَّب» /
 *    «هيا نتوسّع») inside that concept. This is the specific bug the first pass
 *    had: ending a concept where its title changed dropped those pages, so
 *    "سؤال ٣ في صفحة ١٠" had nothing to retrieve.
 *  - The seeded tree and its RAG scope, and that a lesson's chunks carry the
 *    book's own text.
 */
describe("PHASE 59 — Egypt Grade-6 Science official Ministry tree", () => {
  it("has a table whose invariants hold: keys, chapter bounds, gap-free tiling", () => {
    const { ok, problems } = isConsistent();
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
  });

  it("matches the book: every printed concept head falls in its concept's range", () => {
    const result = assertTreeMatchesTheBook();
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
    // The whole first-term corpus was read, not a sample.
    expect(result.pagesChecked).toBe(92);
  });

  it("reads the science book at its own page offset, not the maths book's", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(1);
    // Book page 6 is PDF page 7 — the first chapter opener, footer reads ٦.
    expect(loadBookPage(6)).toContain("الفصل الأول");
    expect(loadBookPage(6)).toContain("الهواء واحتراق الأشياء");
  });

  it("tiles the book exactly: 10 chapters covering printed pages 6–97 once each", () => {
    expect(EGYPT_SCIENCE_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual([
      [6, 17], [18, 23], [24, 33], [34, 45], [46, 53], [54, 61], [62, 67], [68, 73], [74, 81], [82, 97],
    ]);
    const ranges = allConceptRanges();
    expect(ranges.length).toBe(22);
    expect(ranges[0]!.from).toBe(6);
    expect(ranges[ranges.length - 1]!.to).toBe(97);
    // Contiguous: every concept starts on the page after the previous one ended.
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
  });

  it("keeps a concept's own exercises inside that concept (the regression)", () => {
    const ranges = allConceptRanges();
    const oxygen = ranges.find((r) => r.key === "1-2")!;
    // «دور الأكسجين» teaches on book pages 8–9 and exercises on 10–11
    // («حاول» / «تدرَّب», head on the second line under the chapter marker).
    expect([oxygen.from, oxygen.to]).toEqual([8, 11]);
    expect(loadBookPage(10)).toContain("حاول");
    expect(loadBookPage(11)).toContain("اختر الإجابة الصحيحة");
    expect(conceptDocument(0, 1)).toContain("دور الأكسجين");
    expect(conceptDocument(0, 1)).toContain("[صفحة الكتاب 11]");
    // And the next concept still begins exactly where this one stops.
    const airAfter = ranges.find((r) => r.key === "1-3")!;
    expect(airAfter.from).toBe(12);
  });

  it("gives every concept a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_SCIENCE_T1_UNITS.forEach((unit, ui) => {
      unit.concepts.forEach((concept, ci) => {
        const { from, to } = conceptBookRange(ui, ci);
        const doc = conceptDocument(ui, ci);
        expect(doc.length).toBeGreaterThan(0);
        // The title the book prints is retrievable for this concept.
        expect(doc).toContain(concept.title);
        // Every page of the range is stamped, so a citation points at a real page.
        for (let book = from; book <= to; book++) {
          expect(doc).toContain(`[صفحة الكتاب ${book}]`);
        }
        // And nothing from the next concept's pages leaked in.
        const nextStart = unit.concepts[ci + 1]?.bookFrom;
        if (nextStart) expect(doc).not.toContain(`[صفحة الكتاب ${nextStart}]`);
        counted++;
      });
    });
    expect(counted).toBe(22);
  });

  it("seeds the official tree: science subject, 10 chapters, 22 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_SCIENCE_SPEC);

    expect(seeded.curriculumId).toBeTruthy();
    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("science");
    expect(subject.nameAr).toBe("العلوم");

    const termRows = await db.db.select().from(terms).where(eq(terms.curriculumId, seeded.curriculumId)).orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1", "term-2"]);
    const t1 = termRows[0]!;

    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.length).toBe(10);
    expect(unitRows[0]!.title).toBe("الفصل الأول: شروط الاحتراق");
    expect(unitRows[9]!.title).toBe("الفصل العاشر: تفاعل المحاليل مع الفلزات");

    // One lesson per printed مفهوم, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-sci-con-1-1", "l-sci-con-1-2", "l-sci-con-1-3"],
      ["l-sci-con-2-1", "l-sci-con-2-2"],
      ["l-sci-con-3-1", "l-sci-con-3-2", "l-sci-con-3-3"],
      ["l-sci-con-4-1", "l-sci-con-4-2", "l-sci-con-4-3"],
      ["l-sci-con-5-1", "l-sci-con-5-2"],
      ["l-sci-con-6-1", "l-sci-con-6-2"],
      ["l-sci-con-7-1", "l-sci-con-7-2"],
      ["l-sci-con-8-1"],
      ["l-sci-con-9-1", "l-sci-con-9-2"],
      ["l-sci-con-10-1", "l-sci-con-10-2"],
    ]);

    // The codes must not collide with another seeded curriculum's: the maths book
    // prints the same «chapter-concept» labels, so a bare `l-con-1-2` would exist
    // in two places.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-sci-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_SCIENCE_SPEC);

    const t1 = (await db.db.select().from(terms).where(and(eq(terms.curriculumId, seeded.curriculumId), eq(terms.code, "term-1"))).get())!;
    const unit10 = (await db.db.select().from(units).where(and(eq(units.termId, t1.id), eq(units.code, "unit-10"))).get())!;

    // The first lesson: the book's own opener text, page by page.
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-sci-con-1-1")).get())!;
    expect(first.title).toBe("المفهوم 1-1: الهواء واحتراق الأشياء");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(firstText).toContain("الهواء واحتراق الأشياء");
    expect(firstText).toContain("[صفحة الكتاب 6]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
    }

    // A lesson in the LAST chapter must be scoped to that chapter's unit, not unit-1.
    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-sci-con-10-2")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit10.id);
    }

    // Its concept row carries the book's concept title.
    const lastConcept = (await db.db.select().from(concepts).where(eq(concepts.lessonId, last.id)).get())!;
    expect(lastConcept.title).toBe("ماذا يتبقى بعد التبخير؟");
  });
});