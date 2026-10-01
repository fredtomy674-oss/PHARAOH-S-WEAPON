import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_SOCIAL_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_SOCIAL_T1_UNITS,
  allLessonRanges,
  assertTreeMatchesTheBook,
  isConsistent,
  lessonBookRange,
  lessonDocument,
  loadBookPage,
} from "../../src/db/egyptSocialT1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, concepts, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 60 — Egypt Grade-6 Social Studies is now the OFFICIAL first-term
 * Ministry textbook (2026/2027 MoE edition): 3 units, 12 printed lessons, the
 * book's own concept list on every lesson, and each lesson document assembled
 * from the OCR of the very pages the book prints for it.
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the unit/lesson table, and its page ranges.
 *  - The table invariants (keys, unit bounds, a gap-free tiling of the book).
 *  - The ranges against the book itself: every content page's printed footer
 *    proves its number (so the offset is right page by page), every lesson's
 *    opener prints its title, and every printed page is owned by exactly one
 *    lesson. Measured, not assumed — the same check the seeder refuses to seed
 *    without.
 *  - The derived range keeps the unit opener and the unit assessment inside the
 *    unit: the opener with its first lesson, the assessment with its last. This
 *    is the choice the maths book already makes for a unit's trailing pages.
 *  - The seeded tree and its RAG scope, and that a lesson's chunks carry the
 *    book's own text.
 */
describe("PHASE 60 — Egypt Grade-6 Social Studies official Ministry tree", () => {
  it("has a table whose invariants hold: keys, unit bounds, gap-free tiling", () => {
    const { ok, problems } = isConsistent();
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
  });

  it("matches the book: printed footers, lesson openers and full page coverage", () => {
    const result = assertTreeMatchesTheBook();
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
    // Every content page that prints a footer was read — not a sample.
    expect(result.pagesChecked).toBe(99);
  });

  it("reads the social book at its own page offset", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(1);
    // Book page 8 is PDF page 9 — unit 1 lesson 1's opener, footer reads ٨.
    expect(loadBookPage(8)).toContain("وطننا العربي");
    expect(loadBookPage(8)).toContain("الموقع - الأهمية");
    // Book page 6 is the unit opener that lists the unit's lessons.
    expect(loadBookPage(6)).toContain("الوحدة الأولى");
  });

  it("tiles the book exactly: 3 units covering printed pages 6–111 once each", () => {
    expect(EGYPT_SOCIAL_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual([
      [6, 39],
      [40, 73],
      [74, 111],
    ]);
    const ranges = allLessonRanges();
    expect(ranges.length).toBe(12);
    expect(ranges[0]!.from).toBe(6);
    expect(ranges[ranges.length - 1]!.to).toBe(111);
    // Contiguous: every lesson owns the page after the previous one ended.
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
  });

  it("keeps a unit's opener and assessment inside the unit (the regression)", () => {
    const ranges = allLessonRanges();
    const first = ranges.find((r) => r.key === "1-1")!;
    // Unit 1's opener is book pages 6–7; lesson 1 teaches on 8–15.
    expect([first.from, first.to]).toEqual([6, 15]);
    expect(loadBookPage(6)).toContain("دروس الوحدة");
    expect(loadBookPage(6)).toContain("الوحدة الأولى");
    expect(lessonDocument(0, 0)).toContain("الوحدة الأولى");
    expect(lessonDocument(0, 0)).toContain("[صفحة الكتاب 6]");
    // The unit assessment rides with the unit's LAST lesson.
    const last1 = ranges.find((r) => r.key === "1-4")!;
    expect([last1.from, last1.to]).toEqual([30, 39]);
    expect(loadBookPage(37)).toContain("تقييم الوحدة الأولى");
    expect(lessonDocument(0, 3)).toContain("تقييم الوحدة الأولى");
    // And the next unit's opener belongs to the next unit, not to lesson 1-4.
    const next = ranges.find((r) => r.key === "2-1")!;
    expect(next.from).toBe(40);
    expect(lessonDocument(0, 3)).not.toContain("[صفحة الكتاب 40]");
  });

  it("gives every lesson a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_SOCIAL_T1_UNITS.forEach((unit, ui) => {
      unit.lessons.forEach((lesson, li) => {
        const { from, to } = lessonBookRange(ui, li);
        const doc = lessonDocument(ui, li);
        expect(doc.length).toBeGreaterThan(0);
        expect(doc).toContain(lesson.title);
        for (let book = from; book <= to; book++) {
          expect(doc).toContain(`[صفحة الكتاب ${book}]`);
        }
        const nextStart = unit.lessons[li + 1]?.bookFrom;
        if (nextStart) expect(doc).not.toContain(`[صفحة الكتاب ${nextStart}]`);
        counted++;
      });
    });
    expect(counted).toBe(12);
  });

  it("carries the book's own concepts, including the two the book leaves blank", () => {
    // Printed in the «المفاهيم» column of the curriculum map.
    expect(EGYPT_SOCIAL_T1_UNITS[0]!.lessons[1]!.concepts).toEqual([
      "التعرية المائية",
      "التعرية الهوائية",
      "الأودية الجافة",
    ]);
    // Unit 2 lesson 4 and unit 3 lesson 4 have a blank «المفاهيم» cell; their
    // concepts are that row's printed «المعارف», not an invention.
    expect(EGYPT_SOCIAL_T1_UNITS[1]!.lessons[3]!.concepts).toEqual(["عصر الدولة الأموية", "عصر الدولة العباسية"]);
    expect(EGYPT_SOCIAL_T1_UNITS[2]!.lessons[3]!.concepts).toEqual([
      "مقومات السياحة",
      "أنواع السياحة",
      "أهمية السياحة",
      "تنمية السياحة",
    ]);
  });

  it("seeds the official tree: social subject, 3 units, 12 lessons in one term", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_SOCIAL_SPEC);

    expect(seeded.curriculumId).toBeTruthy();
    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("social");
    expect(subject.nameAr).toBe("الدراسات الاجتماعية");

    const termRows = await db.db.select().from(terms).where(eq(terms.curriculumId, seeded.curriculumId)).orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1"]);
    const t1 = termRows[0]!;

    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.length).toBe(3);
    expect(unitRows[0]!.title).toBe("الوحدة الأولى: وطننا العربي (خصائص وتحديات)");
    expect(unitRows[2]!.title).toBe("الوحدة الثالثة: وطننا العربي والتنمية الاقتصادية");

    // One lesson per printed درس, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-soc-1-1", "l-soc-1-2", "l-soc-1-3", "l-soc-1-4"],
      ["l-soc-2-1", "l-soc-2-2", "l-soc-2-3", "l-soc-2-4"],
      ["l-soc-3-1", "l-soc-3-2", "l-soc-3-3", "l-soc-3-4"],
    ]);

    // The codes must not collide with another seeded curriculum's.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-soc-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_SOCIAL_SPEC);

    const t1 = (await db.db.select().from(terms).where(and(eq(terms.curriculumId, seeded.curriculumId), eq(terms.code, "term-1"))).get())!;
    const unit3 = (await db.db.select().from(units).where(and(eq(units.termId, t1.id), eq(units.code, "unit-3"))).get())!;

    // The first lesson: the unit opener and the book's own lesson text, page by page.
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-soc-1-1")).get())!;
    expect(first.title).toBe("الدرس الأول: وطننا العربي (الموقع - الأهمية)");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(firstText).toContain("الوحدة الأولى");
    expect(firstText).toContain("[صفحة الكتاب 6]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
    }

    // A lesson in the LAST unit must be scoped to that unit, not unit-1.
    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-soc-3-4")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit3.id);
    }

    // Its concept rows carry the book's concept titles.
    const lastConcepts = await db.db.select().from(concepts).where(eq(concepts.lessonId, last.id)).orderBy(concepts.code);
    expect(lastConcepts.map((c) => c.title)).toEqual(["مقومات السياحة", "أنواع السياحة", "أهمية السياحة", "تنمية السياحة"]);
  });
});
