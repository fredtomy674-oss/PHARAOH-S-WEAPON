import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_MATH_EN_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_MATH_EN_T1_UNITS,
  allConceptRanges,
  assertTreeMatchesTheBook,
  conceptBookRange,
  conceptDocument,
  isConsistent,
  loadBookPage,
  printedFooter,
  unitOpenerBookPage,
} from "../../src/db/egyptMathEnT1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 66 — Egypt Grade-6 Mathematics, English-medium edition, is now the
 * official first-term Ministry textbook (`Math_Primary6_T1_EN.pdf`): the same
 * seven units as the Arabic `eg-g6-math`, one app lesson per printed concept (so
 * the book's unit → concept → lesson index is preserved: the concept is the app
 * lesson, its lessons live inside its document). Every lesson document is the
 * OCR of the very pages the book prints for it, and every lesson's concepts are
 * the printed «Learning Target» bullets.
 */

const norm = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "");

describe("PHASE 66 — Egypt Grade-6 Mathematics (English-medium) official Ministry tree", () => {
  it("has a table whose invariants hold: unit bounds and gap-free tiling", () => {
    const { ok, problems } = isConsistent();
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
  });

  it("matches the book: every content page is mapped, footers and titles agree", () => {
    const result = assertTreeMatchesTheBook();
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
    // The book's own running feet were read, not a sample.
    expect(result.pagesChecked).toBeGreaterThan(40);
  });

  it("reads the English-medium book at its own page offset", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(9);
    // Book page 1 is the first lesson of unit 1 (PDF 10).
    expect(norm(loadBookPage(1))).toContain(norm("Divisibility, GCF and LCM"));
    // Book page 111 is the last numbered content page, and its foot says 111.
    expect(printedFooter(111)).toBe(111);
  });

  it("blanks the four full-page pictures rather than injecting OCR guesses", () => {
    // No text layer, and OCR answered with «no text» or invented foreign words.
    for (const book of [13, 67, 79, 97]) {
      expect(loadBookPage(book)).toBe("");
    }
  });

  it("tiles the book exactly: 7 units, 10 concepts covering printed pages 0–111 once each", () => {
    expect(EGYPT_MATH_EN_T1_UNITS.length).toBe(7);
    expect([...EGYPT_MATH_EN_T1_UNITS.keys()].map((i) => unitOpenerBookPage(i))).toEqual([
      0, 14, 34, 58, 68, 80, 98,
    ]);
    const ranges = allConceptRanges();
    expect(ranges.length).toBe(10);
    expect(ranges[0]!.from).toBe(0);
    expect(ranges[ranges.length - 1]!.to).toBe(111);
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
  });

  it("keeps a unit opener with its first concept", () => {
    const ranges = allConceptRanges();
    const first = ranges.find((r) => r.key === "1.1")!;
    // Unit 1's unnumbered opener (book 0) rides with concept 1.1.
    expect([first.from, first.to]).toEqual([0, 13]);
    // Unit 5's opener is book 68; concept 5.1 owns it.
    const u5 = ranges.find((r) => r.key === "5.1")!;
    expect([u5.from, u5.to]).toEqual([68, 79]);
    expect(norm(loadBookPage(68))).toContain(norm("Dependent and Independent Variables"));
  });

  it("gives every concept a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_MATH_EN_T1_UNITS.forEach((unit, ui) => {
      unit.concepts.forEach((concept, ci) => {
        const { from, to } = conceptBookRange(ui, ci);
        const doc = conceptDocument(ui, ci);
        expect(concept.concepts.length).toBeGreaterThan(0);
        const english = concept.title.split(" — ")[0]!;
        expect(norm(doc)).toContain(norm(english));
        // Pages with no text (the picture-only ones) are legitimately absent.
        for (let book = from; book <= to; book++) {
          if (loadBookPage(book)) expect(doc).toContain(`[صفحة الكتاب ${book}]`);
        }
        const nextStart = unit.concepts[ci + 1]?.lessonStarts[0];
        if (nextStart) expect(doc).not.toContain(`[صفحة الكتاب ${nextStart}]`);
        counted++;
      });
    });
    expect(counted).toBe(10);
  });

  it("seeds the official tree: Mathematics (English) subject, 7 units, 10 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_MATH_EN_SPEC);

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
    expect(unitRows.length).toBe(7);

    const perUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      perUnit.push(rows.map((r) => r.code));
    }
    expect(perUnit.map((codes) => codes.length)).toEqual([1, 3, 2, 1, 1, 1, 1]);
    expect(perUnit.flat()).toEqual([
      "l-men-1-1",
      "l-men-2-1",
      "l-men-2-2",
      "l-men-2-3",
      "l-men-3-1",
      "l-men-3-2",
      "l-men-4-1",
      "l-men-5-1",
      "l-men-6-1",
      "l-men-7-1",
    ]);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_MATH_EN_SPEC);

    const t1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, seeded.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const unit1 = (await db.db.select().from(units).where(and(eq(units.termId, t1.id), eq(units.code, "unit-1"))).get())!;

    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-men-1-1")).get())!;
    expect(first.title).toContain("Divisibility, GCF and LCM");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(norm(firstText)).toContain(norm("Divisibility, GCF and LCM"));
    expect(firstText).toContain("[صفحة الكتاب 0]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit1.id);
    }

    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-men-7-1")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    expect(lastChunks.map((c) => c.content).join("\n")).toContain("[صفحة الكتاب 111]");
  });
});
