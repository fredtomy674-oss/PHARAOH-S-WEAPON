import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_ENGLISH_G9_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_ENGLISH_G9_T1_SECTIONS,
  allLessonExtras,
  allLessonRanges,
  assertTreeMatchesTheBook,
  isConsistent,
  lessonBookRange,
  lessonDocument,
  loadBookPage,
  printedFooter,
} from "../../src/db/egyptEnglishG9T1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 85 — Egypt Preparatory-3 (Grade 9) English is the OFFICIAL first-term
 * Ministry textbook (2026/2027 MoE edition): the six units of its printed
 * «Contents», the two reviews around them, and the «Start Smart» bridge — each
 * made of its printed lessons, every lesson document assembled from the OCR of
 * the very pages the book prints for it (its unit opener included), and each
 * listening lesson joined to its own «Audioscripts» page.
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the section/lesson table, and its page ranges.
 */

/** Strips everything but letters and digits and folds case, so OCR spacing and the book's own uppercase heads cannot break a match. */
function normalize(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
}

describe("PHASE 85 — Egypt Grade-9 English official Ministry tree", () => {
  it("has a table whose invariants hold: keys, section bounds, gap-free tiling", () => {
    const { ok, problems } = isConsistent();
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
  });

  it("matches the book: every content page is mapped, footers and lesson heads agree", () => {
    const result = assertTreeMatchesTheBook();
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
    // The book's own running feet were read, not a sample.
    expect(result.pagesChecked).toBeGreaterThan(60);
  });

  it("reads the English book at its own page offset", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(1);
    // Book page 13 is the unit-1 opener, book page 14 its first lesson.
    expect(normalize(loadBookPage(13))).toContain(normalize("Unit 1 Personal Identity"));
    expect(normalize(loadBookPage(14))).toContain(normalize("Beyond My Looks"));
    // The foot wraps a running head, so the page number must still be read.
    expect(printedFooter(14)).toBe(14);
    expect(printedFooter(40)).toBe(40);
  });

  it("tiles the book exactly: Start Smart + 6 units + 2 reviews over pages 11–102", () => {
    expect(EGYPT_ENGLISH_G9_T1_SECTIONS.map((s) => [s.key, s.bookFrom, s.bookTo])).toEqual([
      ["start", 11, 12],
      ["1", 13, 26],
      ["2", 27, 40],
      ["3", 41, 54],
      ["review1", 55, 58],
      ["4", 59, 71],
      ["5", 72, 84],
      ["6", 85, 99],
      ["review2", 100, 102],
    ]);
    const ranges = allLessonRanges();
    expect(ranges.length).toBe(1 + 6 + 6 + 6 + 2 + 6 + 6 + 6 + 2);
    expect(ranges[0]!.from).toBe(11);
    expect(ranges[ranges.length - 1]!.to).toBe(102);
    // Contiguous: every lesson starts on the page after the previous one ended.
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
  });

  it("keeps each unit's opener inside that unit and ends it on its Self-Reflection page", () => {
    const ranges = allLessonRanges();
    // Lesson 1-1 owns the unit-1 opener (13) and its own pages.
    const first = ranges.find((r) => r.key === "1-1")!;
    expect([first.from, first.to]).toEqual([13, 15]);
    expect(normalize(loadBookPage(13))).toContain(normalize("Unit 1 Personal Identity"));
    // Lesson 1-6 closes unit 1 on its Self-Reflection page (26).
    const last1 = ranges.find((r) => r.key === "1-6")!;
    expect([last1.from, last1.to]).toEqual([24, 26]);
    expect(normalize(loadBookPage(26))).toContain(normalize("Self-Reflection"));
    // Lesson 4-1 owns the unit-4 opener (59); lesson 6-6 closes the book on its
    // Self-Reflection page (99).
    const first4 = ranges.find((r) => r.key === "4-1")!;
    expect([first4.from, first4.to]).toEqual([59, 61]);
    expect(normalize(loadBookPage(59))).toContain(normalize("Unit 4 Screen Time"));
    const last6 = ranges.find((r) => r.key === "6-6")!;
    expect([last6.from, last6.to]).toEqual([96, 99]);
    expect(normalize(loadBookPage(99))).toContain(normalize("Self-Reflection"));
  });

  it("gives every lesson a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_ENGLISH_G9_T1_SECTIONS.forEach((section, si) => {
      section.lessons.forEach((lesson, li) => {
        const { from, to } = lessonBookRange(si, li);
        const doc = lessonDocument(si, li);
        expect(doc.length).toBeGreaterThan(0);
        // The head the book prints at the lesson's own page is retrievable.
        expect(normalize(doc)).toContain(normalize(lesson.printedHead));
        // Every page of the range is stamped, so a citation points at a real page.
        for (let book = from; book <= to; book++) {
          expect(doc).toContain(`[صفحة الكتاب ${book}]`);
        }
        // And nothing from the next lesson's pages leaked in.
        const nextStart = section.lessons[li + 1]?.bookFrom;
        if (nextStart) expect(doc).not.toContain(`[صفحة الكتاب ${nextStart}]`);
        counted++;
      });
    });
    expect(counted).toBe(1 + 6 + 6 + 6 + 2 + 6 + 6 + 6 + 2);
  });

  it("joins each listening lesson to its own Audioscripts page", () => {
    const extras = allLessonExtras();
    // The scripts the back matter prints for the unit/review listening lessons.
    expect(extras.get("1-2")).toEqual([103]);
    expect(extras.get("2-2")).toEqual([104]);
    expect(extras.get("3-2")).toEqual([104]);
    expect(extras.get("review1-2")).toEqual([105]);
    expect(extras.get("4-2")).toEqual([105]);
    expect(extras.get("5-2")).toEqual([106]);
    expect(extras.get("6-2")).toEqual([106]);
    expect(extras.get("review2-1")).toEqual([107]);
    expect(extras.get("review2-2")).toEqual([107]);
    // The script page really is the unit-1 listening passage.
    expect(normalize(loadBookPage(103))).toContain(normalize("Self-discovery"));
    expect(normalize(loadBookPage(103))).toContain(normalize("Lesson 2 page 16 Exercise 2"));
    // And it reaches the lesson document.
    const doc = lessonDocument(1, 1); // section 1 = unit 1, lesson index 1 = 1-2
    expect(doc).toContain("[صفحة الكتاب 103]");
  });

  it("seeds the official tree: english subject, 9 sections, 41 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ENGLISH_G9_SPEC);

    expect(seeded.curriculumId).toBeTruthy();
    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("english");
    expect(subject.nameAr).toBe("اللغة الإنجليزية");

    const termRows = await db.db
      .select()
      .from(terms)
      .where(eq(terms.curriculumId, seeded.curriculumId))
      .orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1"]);
    const t1 = termRows[0]!;

    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.length).toBe(9);
    expect(unitRows[0]!.title).toBe("Start Smart");
    expect(unitRows[1]!.title).toBe("Unit 1: Personal Identity");
    expect(unitRows[8]!.title).toBe("Review 2");

    // One lesson per printed lesson, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g9-eng-start-1"],
      ["l-g9-eng-1-1", "l-g9-eng-1-2", "l-g9-eng-1-3", "l-g9-eng-1-4", "l-g9-eng-1-5", "l-g9-eng-1-6"],
      ["l-g9-eng-2-1", "l-g9-eng-2-2", "l-g9-eng-2-3", "l-g9-eng-2-4", "l-g9-eng-2-5", "l-g9-eng-2-6"],
      ["l-g9-eng-3-1", "l-g9-eng-3-2", "l-g9-eng-3-3", "l-g9-eng-3-4", "l-g9-eng-3-5", "l-g9-eng-3-6"],
      ["l-g9-eng-review1-1", "l-g9-eng-review1-2"],
      ["l-g9-eng-4-1", "l-g9-eng-4-2", "l-g9-eng-4-3", "l-g9-eng-4-4", "l-g9-eng-4-5", "l-g9-eng-4-6"],
      ["l-g9-eng-5-1", "l-g9-eng-5-2", "l-g9-eng-5-3", "l-g9-eng-5-4", "l-g9-eng-5-5", "l-g9-eng-5-6"],
      ["l-g9-eng-6-1", "l-g9-eng-6-2", "l-g9-eng-6-3", "l-g9-eng-6-4", "l-g9-eng-6-5", "l-g9-eng-6-6"],
      ["l-g9-eng-review2-1", "l-g9-eng-review2-2"],
    ]);
    // Codes must not collide with another seeded curriculum's.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-g9-eng-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ENGLISH_G9_SPEC);

    const t1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, seeded.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const unit2 = (await db.db
      .select()
      .from(units)
      .where(and(eq(units.termId, t1.id), eq(units.code, "unit-2")))
      .get())!;

    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g9-eng-1-1")).get())!;
    expect(first.title).toBe("Lesson 1: Beyond My Looks");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(normalize(firstText)).toContain(normalize("Beyond My Looks"));
    expect(firstText).toContain("[صفحة الكتاب 13]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit2.id);
    }
  });
});
