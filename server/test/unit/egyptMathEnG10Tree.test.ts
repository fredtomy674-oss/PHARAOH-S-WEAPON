// PHASE 154 — the Secondary-1 (Grade 10) Mathematics (English-medium) book,
// `eg-g10-math-en`. The first term IS the Ministry student book (123 scanned
// pages, Gemini OCR): four units, seventeen lessons, and every lesson grounded
// on the pages the book itself prints. These tests pin the things that could
// silently hide book content from the tutor:
//  - the table invariants and the printer-proof book check — the seeder refuses
//    to run without them;
//  - the page arithmetic: book N = scan N+4, with the folio printed three ways
//    and the eight unnumbered unit-intro pages anchored instead;
//  - the lesson ranges tiling books 2–119 exactly;
//  - the seeded tree and its RAG scope, with the book's own pages in chunks.
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_MATH_EN_G10_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_MATH_EN_G10_T1_BOOK_END,
  EGYPT_MATH_EN_G10_T1_BOOK_START,
  EGYPT_MATH_EN_G10_T1_FRONT_MATTER,
  EGYPT_MATH_EN_G10_T1_UNITS,
  allLessonExtras,
  allLessonRanges,
  assertTreeMatchesTheBook,
  isConsistent,
  lessonBookRange,
  lessonDocument,
  loadBookPage,
  printedFooter,
} from "../../src/db/egyptMathEnG10T1.js";
import { stageForLesson } from "../../src/modules/curriculum/bookStage.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, concepts, lessons, subjects, terms, units } from "../../src/db/schema.js";

describe("PHASE 154 — Egypt Secondary-1 Mathematics (English-medium) official tree", () => {
  it("has a table whose invariants hold", () => {
    const check = isConsistent();
    expect(check.problems).toEqual([]);
    expect(check.ok).toBe(true);
  });

  it("matches the book: folios, opener heads and every printed activity head", () => {
    const result = assertTreeMatchesTheBook();
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.pagesChecked).toBe(EGYPT_MATH_EN_G10_T1_BOOK_END - EGYPT_MATH_EN_G10_T1_BOOK_START + 1);
  });

  it("reads the book at its own offset — a folio names the scan that holds it", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(4);
    expect(EGYPT_MATH_EN_G10_T1_BOOK_START).toBe(2);
    expect(EGYPT_MATH_EN_G10_T1_BOOK_END).toBe(119);
    expect(EGYPT_MATH_EN_G10_T1_FRONT_MATTER).toEqual({ from: 1, to: 5 });
    // The folio is printed three ways: bare (4), glued to the start of the
    // French-style footer (10), glued to the end of the English one (27), and
    // both glued shapes recur across the units.
    expect(printedFooter(4)).toBe(4);
    expect(printedFooter(10)).toBe(10);
    expect(printedFooter(27)).toBe(27);
    expect(printedFooter(46)).toBe(46);
    expect(printedFooter(86)).toBe(86);
    expect(printedFooter(119)).toBe(119);
    // The four unit intro spreads (8 pages) print no folio at all.
    const anchored: [number, string][] = [
      [2, "Unit objectives"],
      [3, "Lesson of the unit"],
      [30, "Unit objectives"],
      [31, "Lessons of the Unit"],
      [60, "Unit objectives"],
      [61, "Lessons of the Unit"],
      [80, "Unit objectives"],
      [81, "Lessons of the unit"],
    ];
    for (const [page, anchor] of anchored) {
      expect(loadBookPage(page), `page ${page}`).toContain(anchor);
    }
  });

  it("prints the lesson's own head on the page the table claims for it", () => {
    // Spot-check the flagship lessons; the full sweep is the assert above.
    expect(loadBookPage(4)).toContain("An Introduction in Complex Numbers");
    expect(loadBookPage(10)).toContain("Roots of a Quadratic");
    expect(loadBookPage(90)).toContain("Systems of Measuring Angle");
    expect(loadBookPage(103)).toContain("Related Angles");
    // The term's last page closes lesson 4-6's exercises, folio 119.
    expect(loadBookPage(119)).toContain("Use the degree measure");
    expect(printedFooter(119)).toBe(119);
    // The English book paginates like the Arabic one: 1-3 starts where it does
    // in the Arabic twin (book 14), and 4-4 in both (book 103).
    expect(EGYPT_MATH_EN_G10_T1_UNITS[0]!.lessons[2]!.bookFrom).toBe(14);
    expect(EGYPT_MATH_EN_G10_T1_UNITS[3]!.lessons[3]!.bookFrom).toBe(103);
  });

  it("tiles the term exactly: four units, seventeen lessons, books 2–119", () => {
    expect(EGYPT_MATH_EN_G10_T1_UNITS.map((u) => u.title)).toEqual([
      "Algebra, relations and functions",
      "Similarity",
      "The Triangle Proportionality Theorems",
      "Trigonometry",
    ]);
    expect(EGYPT_MATH_EN_G10_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual([
      [2, 29],
      [30, 59],
      [60, 79],
      [80, 119],
    ]);
    expect(allLessonRanges().map((r) => [r.key, r.from, r.to])).toEqual([
      ["1-1", 2, 9],
      ["1-2", 10, 13],
      ["1-3", 14, 19],
      ["1-4", 20, 26],
      ["1-5", 27, 29],
      ["2-1", 30, 35],
      ["2-2", 36, 44],
      ["2-3", 45, 52],
      ["2-4", 53, 59],
      ["3-1", 60, 71],
      ["3-2", 72, 79],
      ["4-1", 80, 89],
      ["4-2", 90, 94],
      ["4-3", 95, 102],
      ["4-4", 103, 111],
      ["4-5", 112, 115],
      ["4-6", 116, 119],
    ]);
    // The unit opener rides with the unit's first lesson; the term's last
    // lesson ends on the book's last page.
    expect(lessonBookRange(0, 0)).toEqual({ from: 2, to: 9 });
    expect(lessonBookRange(3, 5)).toEqual({ from: 116, to: 119 });
    // No appendix pages exist in this book (contrast the Arabic listening book).
    expect(allLessonExtras().size).toBe(0);
  });

  it("grounds every lesson in the book's own pages", () => {
    let checked = 0;
    EGYPT_MATH_EN_G10_T1_UNITS.forEach((unit, ui) => {
      unit.lessons.forEach((lesson, li) => {
        const { from, to } = lessonBookRange(ui, li);
        const doc = lessonDocument(ui, li);
        expect(doc.length, lesson.key).toBeGreaterThan(0);
        expect(doc, lesson.key).toContain(`### صفحة ${lesson.bookFrom}`);
        // Every lesson opens with its own printed head, on its own head page.
        expect(lesson.concepts[0]!.kind).toBe(lesson.type);
        expect(lesson.concepts[0]!.title).toBe(lesson.printedHead);
        expect(lesson.concepts[0]!.bookFrom).toBe(lesson.bookFrom);
        // Every concept starts on a page inside the lesson's own range, in order.
        for (const c of lesson.concepts) {
          expect(c.bookFrom, `${lesson.key} ${c.title}`).toBeGreaterThanOrEqual(from);
          expect(c.bookFrom, `${lesson.key} ${c.title}`).toBeLessThanOrEqual(to);
        }
        checked++;
      });
    });
    expect(checked).toBe(17);
  });

  it("seeds the tree: math-en subject, 4 units, 17 lessons, pages in the chunks", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_MATH_EN_G10_SPEC);
    expect(seeded.curriculumId).toBeTruthy();

    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("math-en");

    const termRows = await db.db
      .select()
      .from(terms)
      .where(eq(terms.curriculumId, seeded.curriculumId))
      .orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1"]);
    const t1 = termRows[0]!;

    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.map((u) => u.title)).toEqual([
      "Algebra, relations and functions",
      "Similarity",
      "The Triangle Proportionality Theorems",
      "Trigonometry",
    ]);

    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g10-math-en-1-1", "l-g10-math-en-1-2", "l-g10-math-en-1-3", "l-g10-math-en-1-4", "l-g10-math-en-1-5"],
      ["l-g10-math-en-2-1", "l-g10-math-en-2-2", "l-g10-math-en-2-3", "l-g10-math-en-2-4"],
      ["l-g10-math-en-3-1", "l-g10-math-en-3-2"],
      ["l-g10-math-en-4-1", "l-g10-math-en-4-2", "l-g10-math-en-4-3", "l-g10-math-en-4-4", "l-g10-math-en-4-5", "l-g10-math-en-4-6"],
    ]);

    // The first lesson's chunks carry its own printed pages, marker included,
    // and stay scoped to its own term — the tutor must never read a neighbour.
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g10-math-en-1-1")).get())!;
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(firstText).toContain("### صفحة 4");
    expect(firstText).toContain("An Introduction in Complex Numbers");
    for (const c of firstChunks) expect(c.termId).toBe(t1.id);

    // Its first concept is the lesson's own head, kind preserved.
    const firstConcept = (await db.db.select().from(concepts).where(eq(concepts.lessonId, first.id)).get())!;
    expect(firstConcept.title).toBe("Lesson: An Introduction in Complex Numbers");

    // The last lesson (4-6) ends on the book's last page and belongs to unit 4.
    const unit4 = (await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder))[3]!;
    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g10-math-en-4-6")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit4.id);
    }
  });

  it("stages the book: every printed page resolves to the scan that holds it", () => {
    const stage = stageForLesson("eg-g10-math-en", "l-g10-math-en-1-1")!;
    expect(stage).not.toBeNull();
    expect(stage.fromBookPage).toBe(2);
    expect(stage.pages[0]!.bookPage).toBe(2);
    expect(stage.pages[0]!.pdfPage).toBe(6);
    expect(stage.pages[0]!.present).toBe(true);
    const last = stageForLesson("eg-g10-math-en", "l-g10-math-en-4-6")!;
    expect(last.toBookPage).toBe(119);
    expect(last.pages.at(-1)!.pdfPage).toBe(123);
    expect(last.pages.at(-1)!.present).toBe(true);
  });

  it("registers under its own curriculum code with no lesson collision", () => {
    // The maths family keeps three distinct namespaces for the same pages.
    expect(new Set(["l-g10-math-1-1", "l-g10-math-en-1-1", "l-g10-math-fr-1-1"]).size).toBe(3);
    expect(EGYPT_MATH_EN_G10_SPEC.curriculum.code).toBe("eg-g10-math-en");
    expect(EGYPT_MATH_EN_G10_SPEC.subject!.code).toBe("math-en");
  });
});
