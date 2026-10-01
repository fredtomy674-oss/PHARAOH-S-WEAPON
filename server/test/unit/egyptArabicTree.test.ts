import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_ARABIC_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_ARABIC_T1_APPENDIX,
  EGYPT_ARABIC_T1_BOOK_END,
  EGYPT_ARABIC_T1_BOOK_START,
  EGYPT_ARABIC_T1_UNITS,
  allLessonRanges,
  assertTreeMatchesTheBook,
  isConsistent,
  lessonBookRange,
  lessonDocument,
  loadBookPage,
} from "../../src/db/egyptArabicT1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, concepts, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 61 — Egypt Grade-6 Arabic is now the OFFICIAL first-term Ministry
 * textbook (2026/2027 MoE edition): 3 units, 12 printed «دروس», every printed
 * «مكوّن» of every lesson as the book's فهرس prints it, and each lesson document
 * assembled from the OCR of the very pages the book prints for it (including the
 * listening passage each listening lesson points to in the back matter).
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the unit/lesson/component table, and its page ranges.
 *  - The table invariants (keys, unit bounds, a gap-free tiling of the book).
 *  - The ranges against the book itself: every content page's printed footer
 *    proves its number (so the offset is right page by page), every unit opener
 *    prints its title, every lesson opener prints its «الدرس …» label, every
 *    component's start page prints its type's marker, and every printed page is
 *    owned by exactly one lesson. Measured, not assumed — the same check the
 *    seeder refuses to seed without.
 *  - The seeded tree and its RAG scope, and that a lesson's chunks carry the
 *    book's own text.
 */
describe("PHASE 61 — Egypt Grade-6 Arabic official Ministry tree", () => {
  it("has a table whose invariants hold: keys, unit bounds, gap-free tiling", () => {
    const { ok, problems } = isConsistent();
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
  });

  it("matches the book: footers, unit/lesson/component pages and full coverage", () => {
    const result = assertTreeMatchesTheBook();
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
    // Every content page whose last line is a bare numeral was read — not a sample.
    expect(result.pagesChecked).toBe(126);
  });

  it("reads the Arabic book at its own page offset", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(1);
    // Book page 7 is the listening lesson opener; book page 6 is the unit opener.
    expect(loadBookPage(7)).toContain("الاستماع");
    expect(loadBookPage(6)).toContain("الوحدة الأولى");
    expect(loadBookPage(8)).toContain("تدريبات");
  });

  it("tiles the book exactly: 3 units covering printed pages 6–144 once each", () => {
    expect([EGYPT_ARABIC_T1_BOOK_START, EGYPT_ARABIC_T1_BOOK_END]).toEqual([6, 144]);
    expect(EGYPT_ARABIC_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual([
      [6, 51],
      [52, 98],
      [99, 144],
    ]);
    const ranges = allLessonRanges();
    expect(ranges.length).toBe(12);
    expect(ranges[0]!.from).toBe(6);
    expect(ranges[ranges.length - 1]!.to).toBe(144);
    // Contiguous: every lesson owns the page after the previous one ended.
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
    // The book-wide listening appendix sits outside the tiled units.
    expect(EGYPT_ARABIC_T1_APPENDIX).toEqual({ from: 145, to: 149 });
    expect(ranges.some((r) => r.from <= 145 && r.to >= 145)).toBe(false);
  });

  it("keeps a unit's opener and assessment inside the unit (the regression)", () => {
    const ranges = allLessonRanges();
    const first = ranges.find((r) => r.key === "1-1")!;
    // Unit 1's opener is book page 6; lesson 1-1 teaches on 7–8.
    expect([first.from, first.to]).toEqual([6, 8]);
    expect(loadBookPage(6)).toContain("الوحدة الأولى");
    expect(lessonDocument(0, 0)).toContain("الوحدة الأولى");
    expect(lessonDocument(0, 0)).toContain("[صفحة الكتاب 6]");
    // The unit assessment rides with the unit's LAST lesson.
    const last1 = ranges.find((r) => r.key === "1-4")!;
    expect([last1.from, last1.to]).toEqual([39, 51]);
    expect(loadBookPage(46)).toContain("تقييم الوحدة الأولى");
    expect(lessonDocument(0, 3)).toContain("تقييم الوحدة الأولى");
    // And the next unit's opener belongs to the next unit, not to lesson 1-4.
    const next = ranges.find((r) => r.key === "2-1")!;
    expect(next.from).toBe(52);
    expect(lessonDocument(0, 3)).not.toContain("[صفحة الكتاب 52]");
  });

  it("gives every lesson a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_ARABIC_T1_UNITS.forEach((unit, ui) => {
      unit.lessons.forEach((lesson, li) => {
        const { from, to } = lessonBookRange(ui, li);
        const doc = lessonDocument(ui, li);
        expect(doc.length).toBeGreaterThan(0);
        for (let book = from; book <= to; book++) {
          expect(doc).toContain(`[صفحة الكتاب ${book}]`);
        }
        const nextStart = unit.lessons[li + 1]?.concepts[0]?.bookFrom;
        if (nextStart) expect(doc).not.toContain(`[صفحة الكتاب ${nextStart}]`);
        // A listening lesson also carries its appendix passage page.
        for (const page of lesson.extraBookPages ?? []) {
          expect(doc).toContain(`[صفحة الكتاب ${page}]`);
        }
        counted++;
      });
    });
    expect(counted).toBe(12);
    // The reading lesson's document really carries the book's reading + grammar.
    const reading = lessonDocument(0, 1);
    expect(reading).toContain("[صفحة الكتاب 9]");
    expect(reading).toContain("[صفحة الكتاب 15]");
    expect(reading).toContain("القواعد النحوية");
  });

  it("carries the book's own components on every lesson, as the فهرس prints them", () => {
    // Lesson 1-2 prints one component per «مكوّن»: reading + four language skills.
    const oneTwo = EGYPT_ARABIC_T1_UNITS[0]!.lessons[1]!.concepts.map((c) => `${c.kind}: ${c.title}`);
    expect(oneTwo).toEqual([
      "القراءة: كنز لا يقدر بثمن",
      "القواعد النحوية: الاسم النكرة والاسم المعرفة",
      "القواعد الإملائية: الهمزة المتوسطة على الألف",
      "التحدث: الوقت من ذهب",
      "الكتابة: نص معلوماتي",
    ]);
    // A listening lesson has exactly one component; a poetry lesson likewise.
    expect(EGYPT_ARABIC_T1_UNITS[0]!.lessons[0]!.concepts.map((c) => c.kind)).toEqual(["الاستماع"]);
    expect(EGYPT_ARABIC_T1_UNITS[2]!.lessons[3]!.concepts.map((c) => c.kind)).toEqual(["النص الشعري"]);
    // The listening lessons point at the appendix passage the book tells them to.
    expect(EGYPT_ARABIC_T1_UNITS[0]!.lessons[0]!.extraBookPages).toEqual([146]);
    expect(EGYPT_ARABIC_T1_UNITS[1]!.lessons[0]!.extraBookPages).toEqual([147]);
    expect(EGYPT_ARABIC_T1_UNITS[2]!.lessons[0]!.extraBookPages).toEqual([148]);
  });

  it("seeds the official tree: arabic subject, 3 units, 12 lessons in one term", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ARABIC_SPEC);

    expect(seeded.curriculumId).toBeTruthy();
    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("arabic");
    expect(subject.nameAr).toBe("اللغة العربية");

    const termRows = await db.db.select().from(terms).where(eq(terms.curriculumId, seeded.curriculumId)).orderBy(terms.sortOrder);
    // No hand-written second term: its book has not been imported.
    expect(termRows.map((t) => t.code)).toEqual(["term-1"]);
    const t1 = termRows[0]!;

    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.length).toBe(3);
    expect(unitRows[0]!.title).toBe("الوحدة الأولى: أطور ذاتي");
    expect(unitRows[2]!.title).toBe("الوحدة الثالثة: العلم والخيال والمستقبل");

    // One lesson per printed درس, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-ara-1-1", "l-ara-1-2", "l-ara-1-3", "l-ara-1-4"],
      ["l-ara-2-1", "l-ara-2-2", "l-ara-2-3", "l-ara-2-4"],
      ["l-ara-3-1", "l-ara-3-2", "l-ara-3-3", "l-ara-3-4"],
    ]);

    // The codes must not collide with another seeded curriculum's.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-ara-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ARABIC_SPEC);

    const t1 = (await db.db.select().from(terms).where(and(eq(terms.curriculumId, seeded.curriculumId), eq(terms.code, "term-1"))).get())!;
    const unit3 = (await db.db.select().from(units).where(and(eq(units.termId, t1.id), eq(units.code, "unit-3"))).get())!;

    // The first lesson: the unit opener, the book's own lesson page, and the
    // appendix listening passage the lesson points to.
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-ara-1-1")).get())!;
    expect(first.title).toBe("الدرس الأول (الاستماع): سمر تطور نفسها");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(firstText).toContain("الوحدة الأولى");
    expect(firstText).toContain("[صفحة الكتاب 6]");
    expect(firstText).toContain("[صفحة الكتاب 146]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
    }

    // A lesson in the LAST unit must be scoped to that unit, not unit-1.
    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-ara-3-4")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit3.id);
    }

    // Its concept row carries the book's printed component title.
    const lastConcepts = await db.db.select().from(concepts).where(eq(concepts.lessonId, last.id)).orderBy(concepts.code);
    expect(lastConcepts.map((c) => c.title)).toEqual(["النص الشعري: سعادة الأوطان"]);
  });
});
