import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_ISLAMIC_G9_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_ISLAMIC_G9_T1_UNITS,
  allLessonRanges,
  assertTreeMatchesTheBook,
  isConsistent,
  lessonBookRange,
  lessonDocument,
  loadBookPage,
  printedFooter,
} from "../../src/db/egyptIslamicG9T1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 82 — Egypt Preparatory-3 (Grade 9) Islamic Religious Education is the
 * OFFICIAL first-term Ministry textbook (2026/2027 MoE edition): 3 units × 7
 * printed lessons (one app lesson each), every lesson document assembled from
 * the OCR of the very pages the book prints for it — including its unit opener
 * and its «مراجعة على الوحدة» block.
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the unit/lesson table, and its page ranges.
 */

/** Strips everything but letters and digits, so OCR spacing cannot break a match. */
function normalize(text: string): string {
  return text.replace(/\uFDFA/g, "").replace(/[^\p{L}\p{N}]/gu, "");
}

describe("PHASE 82 — Egypt Grade-9 Islamic official Ministry tree", () => {
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
    expect(result.pagesChecked).toBeGreaterThan(45);
  });

  it("reads the Islamic book at its own page offset", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(1);
    // Book page 5 is the unit-1 opener, book page 6 the first lesson.
    expect(normalize(loadBookPage(5))).toContain(normalize("قيم الإسلام في بناء الفرد والمجتمع"));
    expect(normalize(loadBookPage(6))).toContain(normalize("من أسماء الله الحسنى"));
    // The foot wraps the unit title, so the page number must still be read.
    expect(printedFooter(10)).toBe(10);
    expect(printedFooter(25)).toBe(25);
  });

  it("tiles the book exactly: 3 units covering printed pages 5–79 once each", () => {
    expect(EGYPT_ISLAMIC_G9_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual([
      [5, 28],
      [29, 55],
      [56, 79],
    ]);
    const ranges = allLessonRanges();
    expect(ranges.length).toBe(21);
    expect(ranges[0]!.from).toBe(5);
    expect(ranges[ranges.length - 1]!.to).toBe(79);
    // Contiguous: every lesson starts on the page after the previous one ended.
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
  });

  it("keeps each unit's opener and review inside that unit", () => {
    const ranges = allLessonRanges();
    // Lesson 1-1 owns the unit-1 opener (5) and its own pages.
    const first = ranges.find((r) => r.key === "1-1")!;
    expect([first.from, first.to]).toEqual([5, 9]);
    expect(normalize(loadBookPage(5))).toContain(normalize("الوحدة"));
    // Lesson 1-7 owns the unit-1 «مراجعة على الوحدة» (28).
    const last1 = ranges.find((r) => r.key === "1-7")!;
    expect([last1.from, last1.to]).toEqual([25, 28]);
    expect(normalize(loadBookPage(28))).toContain(normalize("مراجعة على الوحدة الأولى"));
    // The last unit's last lesson owns the final general review (79).
    const last = ranges.find((r) => r.key === "3-7")!;
    expect([last.from, last.to]).toEqual([75, 79]);
    expect(normalize(loadBookPage(79))).toContain(normalize("مراجعة عامة على الفصل الدراسي الأول"));
  });

  it("gives every lesson a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_ISLAMIC_G9_T1_UNITS.forEach((unit, ui) => {
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
    expect(counted).toBe(21);
  });

  it("seeds the official tree: Islamic subject, 3 units, 21 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ISLAMIC_G9_SPEC);

    expect(seeded.curriculumId).toBeTruthy();
    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("islamic-education");
    expect(subject.nameAr).toBe("التربية الدينية الإسلامية");

    const termRows = await db.db
      .select()
      .from(terms)
      .where(eq(terms.curriculumId, seeded.curriculumId))
      .orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1"]);
    const t1 = termRows[0]!;

    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.length).toBe(3);
    expect(unitRows[0]!.title).toBe("الوحدة الأولى: قيم الإسلام في بناء الفرد والمجتمع");
    expect(unitRows[2]!.title).toBe("الوحدة الثالثة: تحمل المسئولية في الإسلام");

    // One lesson per printed درس, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g9-isl-1-1", "l-g9-isl-1-2", "l-g9-isl-1-3", "l-g9-isl-1-4", "l-g9-isl-1-5", "l-g9-isl-1-6", "l-g9-isl-1-7"],
      ["l-g9-isl-2-1", "l-g9-isl-2-2", "l-g9-isl-2-3", "l-g9-isl-2-4", "l-g9-isl-2-5", "l-g9-isl-2-6", "l-g9-isl-2-7"],
      ["l-g9-isl-3-1", "l-g9-isl-3-2", "l-g9-isl-3-3", "l-g9-isl-3-4", "l-g9-isl-3-5", "l-g9-isl-3-6", "l-g9-isl-3-7"],
    ]);
    // Codes must not collide with another seeded curriculum's.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-g9-isl-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ISLAMIC_G9_SPEC);

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

    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g9-isl-1-1")).get())!;
    expect(first.title).toBe("الدرس الأول: من أسماء الله الحسنى: الغفور");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(normalize(firstText)).toContain(normalize("من أسماء الله الحسنى"));
    expect(firstText).toContain("[صفحة الكتاب 5]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit1.id);
    }
  });
});
