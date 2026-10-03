import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_CHRISTIAN_G9_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_CHRISTIAN_G9_T1_UNITS,
  allLessonRanges,
  assertTreeMatchesTheBook,
  isConsistent,
  lessonBookRange,
  lessonDocument,
  lessonTopic,
  loadBookPage,
} from "../../src/db/egyptChristianG9T1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 80 — Egypt Preparatory-3 (Grade 9) Christian Religious Education is the
 * OFFICIAL first-term Ministry textbook (2026/2027 MoE edition): 3 units × 18
 * printed lessons (one app lesson each), every lesson document assembled from
 * the OCR of the very pages the book prints for it — including its unit opener
 * and its «الأنشطة والممارسات» block.
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the unit/lesson table, and its page ranges.
 */

/** Strips everything but letters and digits, so OCR spacing/vocalisation cannot break a match. */
function normalize(text: string): string {
  return text
    .replace(/[\u0622\u0623\u0625\u0627\u0671]/g, "\u0627")
    .replace(/[\u0649\u06CC]/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0640/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

describe("PHASE 80 — Egypt Grade-9 Christian official Ministry tree", () => {
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

  it("reads the Christian book at its own page offset", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(1);
    // Book page 6 is the unit-1 opener, book page 7 the first lesson.
    expect(loadBookPage(6)).toContain("دعوة الله لنا");
    expect(loadBookPage(7)).toContain("وُجود الله");
  });

  it("tiles the book exactly: 3 units covering printed pages 6–79 once each", () => {
    expect(EGYPT_CHRISTIAN_G9_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual([
      [6, 29],
      [30, 51],
      [52, 79],
    ]);
    const ranges = allLessonRanges();
    expect(ranges.length).toBe(18);
    expect(ranges[0]!.from).toBe(6);
    expect(ranges[ranges.length - 1]!.to).toBe(79);
    // Contiguous: every lesson starts on the page after the previous one ended.
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
  });

  it("keeps a lesson's own activities and its unit opener inside that lesson", () => {
    const ranges = allLessonRanges();
    // Lesson 1-1 owns the unit-1 opener (6) and its activity block through 9.
    const first = ranges.find((r) => r.key === "1-1")!;
    expect([first.from, first.to]).toEqual([6, 9]);
    // Lesson 3-6 opens on 70 and owns the unit review (74) and the general
    // review (75–79).
    const last = ranges.find((r) => r.key === "3-6")!;
    expect([last.from, last.to]).toEqual([70, 79]);
    expect(loadBookPage(75)).toContain("مراجعة عامة");
  });

  it("gives every lesson a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_CHRISTIAN_G9_T1_UNITS.forEach((unit, ui) => {
      unit.lessons.forEach((lesson, li) => {
        const { from, to } = lessonBookRange(ui, li);
        const doc = lessonDocument(ui, li);
        expect(doc.length).toBeGreaterThan(0);
        // The topic the book prints on the lesson's first page is retrievable.
        expect(normalize(doc)).toContain(normalize(lessonTopic(lesson.title)));
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
    expect(counted).toBe(18);
  });

  it("seeds the official tree: Christian subject, 3 units, 18 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_CHRISTIAN_G9_SPEC);

    expect(seeded.curriculumId).toBeTruthy();
    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("christian-education");
    expect(subject.nameAr).toBe("التربية الدينية المسيحية");

    const termRows = await db.db
      .select()
      .from(terms)
      .where(eq(terms.curriculumId, seeded.curriculumId))
      .orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1"]);
    const t1 = termRows[0]!;

    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.length).toBe(3);
    expect(unitRows[0]!.title).toBe("الوحدة الأولى: دعوة الله لنا");
    expect(unitRows[1]!.title).toBe("الوحدة الثانية: دستور إيماننا");
    expect(unitRows[2]!.title).toBe("الوحدة الثالثة: الإيمان المسيحي والمسؤولية");

    // One lesson per printed درس, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g9-chr-1-1", "l-g9-chr-1-2", "l-g9-chr-1-3", "l-g9-chr-1-4", "l-g9-chr-1-5", "l-g9-chr-1-6"],
      ["l-g9-chr-2-1", "l-g9-chr-2-2", "l-g9-chr-2-3", "l-g9-chr-2-4", "l-g9-chr-2-5", "l-g9-chr-2-6"],
      ["l-g9-chr-3-1", "l-g9-chr-3-2", "l-g9-chr-3-3", "l-g9-chr-3-4", "l-g9-chr-3-5", "l-g9-chr-3-6"],
    ]);
    // Codes must not collide with another seeded curriculum's.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-g9-chr-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_CHRISTIAN_G9_SPEC);

    const t1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, seeded.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const unit3 = (await db.db
      .select()
      .from(units)
      .where(and(eq(units.termId, t1.id), eq(units.code, "unit-3")))
      .get())!;

    // The first lesson: the book's own pages, unit opener included.
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g9-chr-1-1")).get())!;
    expect(first.title).toBe("الدرس الأول: العقيدة: وجود الله");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(firstText).toContain("وُجود الله");
    expect(firstText).toContain("[صفحة الكتاب 6]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
    }

    // A lesson in the LAST unit must be scoped to that unit, not unit-1.
    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g9-chr-3-6")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit3.id);
    }
  });
});
