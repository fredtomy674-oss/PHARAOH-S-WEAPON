import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_SCIENCE_G9_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_SCIENCE_G9_T1_UNITS,
  allLessonRanges,
  assertTreeMatchesTheBook,
  isConsistent,
  lessonBookRange,
  lessonDocument,
  loadBookPage,
  printedFooter,
} from "../../src/db/egyptScienceG9T1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 84 — Egypt Preparatory-3 (Grade 9) Science is the OFFICIAL first-term
 * Ministry textbook (2026/2027 MoE edition): 4 units × 10 printed دروس (one app
 * lesson each), every lesson document assembled from the OCR of the very pages
 * the book prints for it — including its unit opener.
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the unit/lesson table, and its page ranges.
 */

/**
 * Strips everything but letters and digits, unifying the same orthographic
 * variants the module's own normaliser does (final ya ى/ي, ta-marbuta ة/ه,
 * hamza forms), so OCR spacing and the book's own running heads cannot break a
 * match — e.g. the head «السجل الحفرى» still matches the title «السجل الحفري».
 */
function normalize(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

describe("PHASE 84 — Egypt Grade-9 Science official Ministry tree", () => {
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

  it("reads the science book at its own page offset", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(7);
    // Book page 1 is the unit-1 opener, book page 2 the first lesson.
    expect(normalize(loadBookPage(1))).toContain(normalize("الوحدة 1"));
    expect(normalize(loadBookPage(2))).toContain(normalize("أنواع التفاعلات الكيميائية"));
    // The foot wraps a running head, so the page number must still be read.
    expect(printedFooter(3)).toBe(3);
    expect(printedFooter(17)).toBe(17);
  });

  it("tiles the book exactly: 4 units covering printed pages 1–102 once each", () => {
    expect(EGYPT_SCIENCE_G9_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual([
      [1, 33],
      [34, 63],
      [64, 83],
      [84, 102],
    ]);
    const ranges = allLessonRanges();
    expect(ranges.length).toBe(10);
    expect(ranges[0]!.from).toBe(1);
    expect(ranges[ranges.length - 1]!.to).toBe(102);
    // Contiguous: every lesson starts on the page after the previous one ended.
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
  });

  it("keeps each unit's opener inside that unit and ends it on the last lesson's assessment", () => {
    const ranges = allLessonRanges();
    // Lesson 1-1 owns the unit-1 opener (1) and its own pages.
    const first = ranges.find((r) => r.key === "1-1")!;
    expect([first.from, first.to]).toEqual([1, 14]);
    expect(normalize(loadBookPage(1))).toContain(normalize("الوحدة 1"));
    // Lesson 1-3 closes unit 1 on its «أسئلة تقييم الدرس الثالث».
    const last1 = ranges.find((r) => r.key === "1-3")!;
    expect([last1.from, last1.to]).toEqual([25, 33]);
    expect(normalize(loadBookPage(33))).toContain(normalize("أسئلة تقييم الدرس الثالث"));
    // Lesson 2-1 owns the unit-2 opener (34).
    const first2 = ranges.find((r) => r.key === "2-1")!;
    expect([first2.from, first2.to]).toEqual([34, 45]);
    expect(normalize(loadBookPage(34))).toContain(normalize("الوحدة 2"));
    // Lesson 3-1 owns the unit-3 opener (64).
    const first3 = ranges.find((r) => r.key === "3-1")!;
    expect([first3.from, first3.to]).toEqual([64, 74]);
    expect(normalize(loadBookPage(64))).toContain(normalize("الوحدة 3"));
    // Lesson 4-1 owns the unit-4 opener (84); lesson 4-2 closes the book on its
    // last lesson assessment (102).
    const first4 = ranges.find((r) => r.key === "4-1")!;
    expect([first4.from, first4.to]).toEqual([84, 94]);
    expect(normalize(loadBookPage(84))).toContain(normalize("الوحدة 4"));
    const last = ranges.find((r) => r.key === "4-2")!;
    expect([last.from, last.to]).toEqual([95, 102]);
    expect(normalize(loadBookPage(102))).toContain(normalize("أسئلة تقييم الدرس الثاني"));
  });

  it("gives every lesson a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_SCIENCE_G9_T1_UNITS.forEach((unit, ui) => {
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
    expect(counted).toBe(10);
  });

  it("seeds the official tree: science subject, 4 units, 10 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_SCIENCE_G9_SPEC);

    expect(seeded.curriculumId).toBeTruthy();
    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("science");
    expect(subject.nameAr).toBe("العلوم");

    const termRows = await db.db
      .select()
      .from(terms)
      .where(eq(terms.curriculumId, seeded.curriculumId))
      .orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1"]);
    const t1 = termRows[0]!;

    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.length).toBe(4);
    expect(unitRows[0]!.title).toBe("الوحدة الأولى: التفاعلات الكيميائية وآثارها البيئية");
    expect(unitRows[3]!.title).toBe("الوحدة الرابعة: تاريخ كوكب الأرض");

    // One lesson per printed درس, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g9-sci-1-1", "l-g9-sci-1-2", "l-g9-sci-1-3"],
      ["l-g9-sci-2-1", "l-g9-sci-2-2", "l-g9-sci-2-3"],
      ["l-g9-sci-3-1", "l-g9-sci-3-2"],
      ["l-g9-sci-4-1", "l-g9-sci-4-2"],
    ]);
    // Codes must not collide with another seeded curriculum's.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-g9-sci-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_SCIENCE_G9_SPEC);

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

    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g9-sci-1-1")).get())!;
    expect(first.title).toBe("الدرس الأول: أنواع التفاعلات الكيميائية");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(normalize(firstText)).toContain(normalize("أنواع التفاعلات الكيميائية"));
    expect(firstText).toContain("[صفحة الكتاب 1]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit1.id);
    }
  });
});
