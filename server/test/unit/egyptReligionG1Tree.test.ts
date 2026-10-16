import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_CHRISTIAN_G1_SPEC, EGYPT_ISLAMIC_G1_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET as ISLAMIC_OFFSET,
  EGYPT_ISLAMIC_G1_T1_BOOK_START,
  EGYPT_ISLAMIC_G1_T1_UNITS,
  allLessonRanges as islamicLessonRanges,
  assertTreeMatchesTheBook as assertIslamicTreeMatchesTheBook,
  isConsistent as isIslamicTreeConsistent,
  lessonBookRange as islamicLessonBookRange,
  lessonDocument as islamicLessonDocument,
  loadBookPage as loadIslamicPage,
} from "../../src/db/egyptIslamicG1T1.js";
import {
  BOOK_TO_PDF_OFFSET as CHRISTIAN_OFFSET,
  EGYPT_CHRISTIAN_G1_T1_BOOK_START,
  EGYPT_CHRISTIAN_G1_T1_UNITS,
  allLessonRanges as christianLessonRanges,
  assertTreeMatchesTheBook as assertChristianTreeMatchesTheBook,
  isConsistent as isChristianTreeConsistent,
  lessonBookRange as christianLessonBookRange,
  lessonDocument as christianLessonDocument,
  loadBookPage as loadChristianPage,
} from "../../src/db/egyptChristianG1T1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, lessons, subjects, terms, units } from "../../src/db/schema.js";

/** Letters + digits only, so printed harakat and line breaks cannot break a view. */
const norm = (text: string): string => text.replace(/[^\p{L}\p{N}]/gu, "");

/**
 * PHASE 149 — Egypt Grade 1 religious education is now the OFFICIAL first-term
 * Ministry textbooks: التربية الدينية الإسلامية (3 units × 6 printed lessons over
 * book pages 7–87) and التربية الدينية المسيحية (3 units × 6 printed lessons over
 * book pages 5–87). Every lesson document is assembled from the OCR of the very
 * pages the book prints for it, and every lesson's concepts are the printed
 * objectives of the book itself.
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the unit/lesson table, and its page ranges.
 */
describe("PHASE 149 — Egypt Grade-1 Islamic official Ministry tree", () => {
  it("has a table whose invariants hold: keys, unit bounds, gap-free tiling", () => {
    const { ok, problems } = isIslamicTreeConsistent();
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
  });

  it("matches the book: every content page is mapped, footers and objectives agree", () => {
    const result = assertIslamicTreeMatchesTheBook();
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
    // 72 pages prove their folio on their own last line + 3 above the objectives box.
    expect(result.pagesChecked).toBe(75);
  });

  it("reads the Islamic book at its own page offset", () => {
    expect(ISLAMIC_OFFSET).toBe(0);
    expect(EGYPT_ISLAMIC_G1_T1_BOOK_START).toBe(7);
    // Book page 7 is the unit-1 opener, book page 8 the first lesson («الْخَالِقُ»).
    expect(loadIslamicPage(7)).toContain("دُرُوسُ الْوَحْدَةِ");
    expect(loadIslamicPage(8)).toContain("الْخَالِقُ");
    // And the last two term pages are the final assessment opener and its third page.
    expect(norm(loadIslamicPage(86))).toContain(norm("على الفصل الدراسي الأول"));
    expect(loadIslamicPage(87)).toContain("٨٧");
  });

  it("tiles the book exactly: 3 units covering printed pages 7–87 once each", () => {
    expect(EGYPT_ISLAMIC_G1_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual([
      [7, 34],
      [35, 60],
      [61, 87],
    ]);
    const ranges = islamicLessonRanges();
    expect(ranges.length).toBe(18);
    expect(ranges[0]!.from).toBe(7);
    expect(ranges[ranges.length - 1]!.to).toBe(87);
    // Contiguous: every lesson starts on the page after the previous one ended.
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
  });

  it("keeps a unit opener, the surahs page and the review inside their lessons", () => {
    const ranges = islamicLessonRanges();
    // Lesson 1-1 owns the unit-1 opener (7) and its activity pages.
    const first = ranges.find((r) => r.key === "1-1")!;
    expect([first.from, first.to]).toEqual([7, 11]);
    // Lesson 1-2 folds in «مِنْ سُوَرِ التِّلَاوَةِ» (17), which prints no head of its own.
    const quran = ranges.find((r) => r.key === "1-2")!;
    expect([quran.from, quran.to]).toEqual([12, 17]);
    expect(loadIslamicPage(17)).toContain("الْفَلَقِ");
    // Lesson 3-6 owns the unit's closing review (84–85) and the term assessment (86–87).
    const last = ranges.find((r) => r.key === "3-6")!;
    expect([last.from, last.to]).toEqual([82, 87]);
    expect(norm(loadIslamicPage(84))).toContain(norm("مراجعة على الوحدة الثالثة"));
  });

  it("gives every lesson a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_ISLAMIC_G1_T1_UNITS.forEach((unit, ui) => {
      unit.lessons.forEach((lesson, li) => {
        const { from, to } = islamicLessonBookRange(ui, li);
        const doc = islamicLessonDocument(ui, li);
        expect(doc.length).toBeGreaterThan(0);
        // The head the book prints is retrievable for this lesson.
        for (const line of lesson.printedHead) {
          expect(norm(doc)).toContain(norm(line));
        }
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

  it("seeds the official tree: Islamic subject, 3 units, 18 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ISLAMIC_G1_SPEC);

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
    expect(unitRows[0]!.title).toBe("الوحدة الأولى: اللَّهُ رَبِّي");

    // One lesson per printed درس, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g1-isl-1-1", "l-g1-isl-1-2", "l-g1-isl-1-3", "l-g1-isl-1-4", "l-g1-isl-1-5", "l-g1-isl-1-6"],
      ["l-g1-isl-2-1", "l-g1-isl-2-2", "l-g1-isl-2-3", "l-g1-isl-2-4", "l-g1-isl-2-5", "l-g1-isl-2-6"],
      ["l-g1-isl-3-1", "l-g1-isl-3-2", "l-g1-isl-3-3", "l-g1-isl-3-4", "l-g1-isl-3-5", "l-g1-isl-3-6"],
    ]);
    // Codes must not collide with another seeded curriculum's.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-g1-isl-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ISLAMIC_G1_SPEC);

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
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g1-isl-1-1")).get())!;
    expect(first.title).toBe("الْعَقِيدَةُ اللَّهُ تَعَالَى (الْخَالِقُ)");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(firstText).toContain("دُرُوسُ الْوَحْدَةِ");
    expect(firstText).toContain("[صفحة الكتاب 7]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
    }

    // Its objectives are the book's own printed objectives, verbatim.
    expect(norm(firstText)).toContain(norm("يُعَدِّدَ مَخْلُوقَاتِ اللَّهِ (تَعَالَى) حَوْلَهُ."));

    // A lesson in the LAST unit must be scoped to that unit, not unit-1.
    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g1-isl-3-6")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit3.id);
    }
  });
});

describe("PHASE 149 — Egypt Grade-1 Christian official Ministry tree", () => {
  it("has a table whose invariants hold: keys, unit bounds, gap-free tiling", () => {
    const { ok, problems } = isChristianTreeConsistent();
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
  });

  it("matches the book: every content page is mapped, footers and titles agree", () => {
    const result = assertChristianTreeMatchesTheBook();
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
    // 80 pages prove their folio on their own last line; the 3 openers are anchored.
    expect(result.pagesChecked).toBe(80);
  });

  it("reads the Christian book at its own page offset", () => {
    expect(CHRISTIAN_OFFSET).toBe(0);
    expect(EGYPT_CHRISTIAN_G1_T1_BOOK_START).toBe(5);
    // Book page 5 is the unit-1 opener, book page 6 the first lesson.
    expect(loadChristianPage(5)).toContain("الوحدة الأولى");
    expect(loadChristianPage(6)).toContain("الله الخالق");
    // And the last term page is the term assessment.
    expect(loadChristianPage(85)).toContain("اختبارات على الفصل الدراسي الأول");
  });

  it("tiles the book exactly: 3 units covering printed pages 5–87 once each", () => {
    expect(EGYPT_CHRISTIAN_G1_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual([
      [5, 30],
      [31, 56],
      [57, 87],
    ]);
    const ranges = christianLessonRanges();
    expect(ranges.length).toBe(18);
    expect(ranges[0]!.from).toBe(5);
    expect(ranges[ranges.length - 1]!.to).toBe(87);
    // Contiguous: every lesson starts on the page after the previous one ended.
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
  });

  it("keeps a unit opener, the longest lessons and the review inside their lessons", () => {
    const ranges = christianLessonRanges();
    // Lesson 1-1 owns the unit-1 opener (5) and its four pages.
    const first = ranges.find((r) => r.key === "1-1")!;
    expect([first.from, first.to]).toEqual([5, 9]);
    // Unit 3's first two lessons run five pages each (extra activity pages).
    expect([ranges.find((r) => r.key === "3-1")!.from, ranges.find((r) => r.key === "3-1")!.to]).toEqual([57, 62]);
    expect([ranges.find((r) => r.key === "3-2")!.from, ranges.find((r) => r.key === "3-2")!.to]).toEqual([63, 67]);
    // Lesson 3-6 owns the unit's closing review (84) and the term assessment (85–87).
    const last = ranges.find((r) => r.key === "3-6")!;
    expect([last.from, last.to]).toEqual([80, 87]);
    expect(loadChristianPage(84)).toContain("مراجعة على الوحدة الثالثة");
  });

  it("gives every lesson a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_CHRISTIAN_G1_T1_UNITS.forEach((unit, ui) => {
      unit.lessons.forEach((lesson, li) => {
        const { from, to } = christianLessonBookRange(ui, li);
        const doc = christianLessonDocument(ui, li);
        expect(doc.length).toBeGreaterThan(0);
        // The head the book prints is retrievable for this lesson. (The index entry
        // the title comes from is proven on the unit opener by the module itself.)
        for (const line of lesson.printedHead) {
          expect(norm(doc)).toContain(norm(line));
        }
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
    const seeded = await seedCountry(db, knowledge, EGYPT_CHRISTIAN_G1_SPEC);

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
    expect(unitRows[0]!.title).toBe("الوحدة الأولى: الله الخالق الغافر");

    // One lesson per printed درس, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g1-chr-1-1", "l-g1-chr-1-2", "l-g1-chr-1-3", "l-g1-chr-1-4", "l-g1-chr-1-5", "l-g1-chr-1-6"],
      ["l-g1-chr-2-1", "l-g1-chr-2-2", "l-g1-chr-2-3", "l-g1-chr-2-4", "l-g1-chr-2-5", "l-g1-chr-2-6"],
      ["l-g1-chr-3-1", "l-g1-chr-3-2", "l-g1-chr-3-3", "l-g1-chr-3-4", "l-g1-chr-3-5", "l-g1-chr-3-6"],
    ]);
    // Codes must not collide with another seeded curriculum's.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-g1-chr-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_CHRISTIAN_G1_SPEC);

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
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g1-chr-1-1")).get())!;
    expect(first.title).toBe("الدرس الأول: العقيدة: الله الخالق");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(firstText).toContain("الله الخالق الغافر");
    expect(firstText).toContain("[صفحة الكتاب 5]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
    }

    // Its objectives are the book's own printed objectives, verbatim.
    expect(norm(firstText)).toContain(norm("يشكر الله على كل الأشياء التي خلقها من أجله."));

    // A lesson in the LAST unit must be scoped to that unit, not unit-1.
    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g1-chr-3-6")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit3.id);
    }
  });
});
