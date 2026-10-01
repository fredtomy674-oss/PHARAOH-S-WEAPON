import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_ISLAMIC_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_ISLAMIC_T1_UNITS,
  allLessonRanges,
  assertTreeMatchesTheBook,
  isConsistent,
  lessonBookRange,
  lessonDocument,
  loadBookPage,
} from "../../src/db/egyptIslamicT1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 64 — Egypt Grade-6 Islamic Religious Education is now the OFFICIAL
 * first-term Ministry textbook (2026/2027 MoE edition, reviewed by Al-Azhar):
 * 3 units and 20 printed lessons (one app lesson each), every lesson document
 * assembled from the OCR of the very pages the book prints for it — including
 * the activities the book keeps inside the lesson and the unit review that rides
 * with the unit's last lesson.
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the unit/lesson table, and its page ranges.
 */

/** Same letter/digit normalization the tree's own verification uses. */
const norm = (text: string) => text.replace(/[^\p{L}\p{N}]/gu, "");

describe("PHASE 64 — Egypt Grade-6 Islamic Education official Ministry tree", () => {
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

  it("reads the Islamic book at its own page offset", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(1);
    // Book page 6 is the unit-1 opener, book page 7 the first lesson.
    expect(norm(loadBookPage(6))).toContain(norm("الرحمة والرفق"));
    expect(norm(loadBookPage(7))).toContain(norm("الإيمان باليوم الآخر"));
  });

  it("tiles the book exactly: 3 units covering printed pages 6–95 once each", () => {
    expect(EGYPT_ISLAMIC_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual([
      [6, 38],
      [39, 68],
      [69, 95],
    ]);
    const ranges = allLessonRanges();
    expect(ranges.length).toBe(20);
    expect(ranges[0]!.from).toBe(6);
    expect(ranges[ranges.length - 1]!.to).toBe(95);
    // Contiguous: every lesson starts on the page after the previous one ended.
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
  });

  it("keeps a unit opener with its first lesson and a unit review with its last", () => {
    const ranges = allLessonRanges();
    // Lesson 1-1 owns the unit-1 opener (6) and its lesson pages (7–10).
    const first = ranges.find((r) => r.key === "1-1")!;
    expect([first.from, first.to]).toEqual([6, 10]);
    // Lesson 1-7 owns the unit review «مراجعة على الوحدة الأولى» on page 38.
    const review = ranges.find((r) => r.key === "1-7")!;
    expect([review.from, review.to]).toEqual([33, 38]);
    expect(norm(loadBookPage(38))).toContain(norm("مراجعة على الوحدة الأولى"));
    // Lesson 3-6 owns the unit review and the final «التقييم النهائي» (94–95).
    const last = ranges.find((r) => r.key === "3-6")!;
    expect([last.from, last.to]).toEqual([89, 95]);
    expect(norm(loadBookPage(93))).toContain(norm("مراجعة على الوحدة الثالثة"));
    expect(norm(loadBookPage(94))).toContain(norm("التقييم النهائي"));
    expect(norm(loadBookPage(95))).toContain(norm("أكمل الفراغات"));
  });

  it("gives every lesson a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_ISLAMIC_T1_UNITS.forEach((unit, ui) => {
      unit.lessons.forEach((lesson, li) => {
        const { from, to } = lessonBookRange(ui, li);
        const doc = lessonDocument(ui, li);
        expect(doc.length).toBeGreaterThan(0);
        // The title the book prints is retrievable for this lesson (modulo the
        // OCR's diacritics, which the tree's own verification also normalizes).
        expect(norm(doc)).toContain(norm(lesson.title));
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
    expect(counted).toBe(20);
  });

  it("seeds the official tree: Islamic Education subject, 3 units, 20 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ISLAMIC_SPEC);

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
    expect(unitRows[0]!.title).toBe("الوحدة الأولى: الرحمة والرفق");
    expect(unitRows[1]!.title).toBe("الوحدة الثانية: الأخوة في الدين");
    expect(unitRows[2]!.title).toBe("الوحدة الثالثة: التقوى والعمل الصالح");

    // One lesson per printed درس, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-isl-1-1", "l-isl-1-2", "l-isl-1-3", "l-isl-1-4", "l-isl-1-5", "l-isl-1-6", "l-isl-1-7"],
      ["l-isl-2-1", "l-isl-2-2", "l-isl-2-3", "l-isl-2-4", "l-isl-2-5", "l-isl-2-6", "l-isl-2-7"],
      ["l-isl-3-1", "l-isl-3-2", "l-isl-3-3", "l-isl-3-4", "l-isl-3-5", "l-isl-3-6"],
    ]);
    // Codes must not collide with another seeded curriculum's.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-isl-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ISLAMIC_SPEC);

    const t1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, seeded.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const unit3 = (await db.db.select().from(units).where(and(eq(units.termId, t1.id), eq(units.code, "unit-3"))).get())!;

    // The first lesson: the book's own pages, unit opener included.
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-isl-1-1")).get())!;
    expect(first.title).toBe("الدرس الأول: الإيمان باليوم الآخر");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(norm(firstText)).toContain(norm("الإيمان باليوم الآخر"));
    expect(firstText).toContain("[صفحة الكتاب 6]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
    }

    // A lesson in the LAST unit must be scoped to that unit, not unit-1.
    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-isl-3-6")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit3.id);
    }
  });
});
