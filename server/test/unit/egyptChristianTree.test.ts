import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_CHRISTIAN_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_CHRISTIAN_T1_UNITS,
  allLessonRanges,
  assertTreeMatchesTheBook,
  isConsistent,
  lessonBookRange,
  lessonDocument,
  loadBookPage,
  printedFooter,
} from "../../src/db/egyptChristianT1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 65 — Egypt Grade-6 Christian Religious Education is now the OFFICIAL
 * first-term Ministry textbook (2026/2027 MoE edition, reviewed by the Coptic
 * Orthodox Church): 3 units and 18 printed lessons (one app lesson each), every
 * lesson document assembled from the OCR of the very pages the book prints for
 * it — including the activities the book keeps inside the lesson and the unit
 * review / final assessments that ride with the unit's last lesson.
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the unit/lesson table, and its page ranges.
 */

/** Same letter/digit normalization the tree's own verification uses. */
const norm = (text: string) =>
  text
    .replace(/[\u0622\u0623\u0625\u0627\u0671]/g, "\u0627")
    .replace(/[\u0649\u06CC]/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0640/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");

describe("PHASE 65 — Egypt Grade-6 Christian Education official Ministry tree", () => {
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

  it("documents the one OCR footer misread instead of hiding it", () => {
    // Page 76's foot «٧٦» was OCR'd as «٢٦»; the tree records the misread so
    // the book-wide footer proof stays exact rather than fuzzy.
    expect(printedFooter(76)).toBe(26);
  });

  it("reads the Christian book at its own page offset", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(1);
    // Book page 6 is the unit-1 opener, book page 7 the first lesson.
    expect(norm(loadBookPage(6))).toContain(norm("الله في حياة قديسيه"));
    expect(norm(loadBookPage(7))).toContain(norm("الله واحد مثلث الأقانيم"));
  });

  it("tiles the book exactly: 3 units covering printed pages 6–92 once each", () => {
    expect(EGYPT_CHRISTIAN_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual([
      [6, 31],
      [32, 60],
      [61, 92],
    ]);
    const ranges = allLessonRanges();
    expect(ranges.length).toBe(18);
    expect(ranges[0]!.from).toBe(6);
    expect(ranges[ranges.length - 1]!.to).toBe(92);
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
    // Lesson 1-6 owns the unit-1 review «مراجعة على الوحدة الأولى» (31).
    const review = ranges.find((r) => r.key === "1-6")!;
    expect([review.from, review.to]).toEqual([27, 31]);
    expect(norm(loadBookPage(31))).toContain(norm("مراجعة على الوحدة الأولى"));
    // Lesson 3-6 owns the unit-3 review and the final «اختبارات على الفصل» (89–92).
    const last = ranges.find((r) => r.key === "3-6")!;
    expect([last.from, last.to]).toEqual([84, 92]);
    expect(norm(loadBookPage(89))).toContain(norm("مراجعة على الوحدة الثالثة"));
    expect(norm(loadBookPage(90))).toContain(norm("اختبارات على الفصل الدراسي الأول"));
    expect(norm(loadBookPage(92))).toContain(norm("اختبار (٣)"));
  });

  it("gives every lesson a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_CHRISTIAN_T1_UNITS.forEach((unit, ui) => {
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
    expect(counted).toBe(18);
  });

  it("seeds the official tree: Christian Education subject, 3 units, 18 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_CHRISTIAN_SPEC);

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
    expect(unitRows[0]!.title).toBe("الوحدة الأولى: الله في حياة قديسيه");
    expect(unitRows[1]!.title).toBe("الوحدة الثانية: الصبر والاجتهاد");
    expect(unitRows[2]!.title).toBe("الوحدة الثالثة: سلطان الرب يسوع");

    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-chr-1-1", "l-chr-1-2", "l-chr-1-3", "l-chr-1-4", "l-chr-1-5", "l-chr-1-6"],
      ["l-chr-2-1", "l-chr-2-2", "l-chr-2-3", "l-chr-2-4", "l-chr-2-5", "l-chr-2-6"],
      ["l-chr-3-1", "l-chr-3-2", "l-chr-3-3", "l-chr-3-4", "l-chr-3-5", "l-chr-3-6"],
    ]);
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-chr-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_CHRISTIAN_SPEC);

    const t1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, seeded.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const unit3 = (await db.db.select().from(units).where(and(eq(units.termId, t1.id), eq(units.code, "unit-3"))).get())!;

    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-chr-1-1")).get())!;
    expect(first.title).toBe("الدرس الأول: العقيدة: الله واحد مثلث الأقانيم");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(norm(firstText)).toContain(norm("العقيدة: الله واحد مثلث الأقانيم"));
    expect(firstText).toContain("[صفحة الكتاب 6]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
    }

    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-chr-3-6")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit3.id);
    }
  });
});
