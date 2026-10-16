import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_SCIENCE_EN_G6_SPEC, EGYPT_SCIENCE_FR_G6_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET as EN_OFFSET,
  EGYPT_SCIENCE_EN_G6_T1_BOOK_END,
  EGYPT_SCIENCE_EN_G6_T1_UNITS,
  allConceptRanges as enConceptRanges,
  assertTreeMatchesTheBook as assertEnMatchesBook,
  conceptBookRange as enConceptRange,
  conceptDocument as enConceptDocument,
  isConsistent as isEnConsistent,
  loadBookPage as loadEnPage,
  printedFooter as enPrintedFooter,
} from "../../src/db/egyptScienceEnG6T1.js";
import {
  BOOK_TO_PDF_OFFSET as FR_OFFSET,
  EGYPT_SCIENCE_FR_G6_T1_BOOK_END,
  EGYPT_SCIENCE_FR_G6_T1_UNITS,
  allConceptRanges as frConceptRanges,
  assertTreeMatchesTheBook as assertFrMatchesBook,
  conceptBookRange as frConceptRange,
  conceptDocument as frConceptDocument,
  isConsistent as isFrConsistent,
  loadBookPage as loadFrPage,
  printedFooter as frPrintedFooter,
} from "../../src/db/egyptScienceFrG6T1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, concepts, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 150 — Egypt Grade-6 Science is now complete in all three Ministry
 * editions: the Arabic first term (PHASE 59) and the English- and
 * French-medium first terms (the Discovery Education editions), each 10
 * printed chapters, 22 printed concepts (one app lesson each), every lesson
 * document assembled from the OCR of the very pages the book prints for that
 * concept.
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the chapter/concept table, and its page ranges.
 *  - The table invariants (keys, chapter bounds, a gap-free tiling of the book).
 *  - The ranges against the book itself: every concept's opener page prints its
 *    own title, every title and printed learning topic is printed inside the
 *    pages its concept claims, and every printed page proves its own number —
 *    the folio that fixes `pdfPage = bookPage + 1`. Measured, not assumed — the
 *    same check the seeder refuses to seed without.
 *  - The derived end page keeps a concept's own exercises («Try» / «Exercise»,
 *    «Essaye» / «Entraine-toi») inside that concept, so "question 1 on page 10"
 *    has something to retrieve.
 *  - The seeded trees and their RAG scope, and that a lesson's chunks carry the
 *    book's own text.
 */
describe("PHASE 150 — Egypt Grade-6 Science (English/French) official Ministry trees", () => {
  it("has tables whose invariants hold (both editions)", () => {
    const checks = [
      { label: "English", check: isEnConsistent() },
      { label: "French", check: isFrConsistent() },
    ];
    for (const { label, check } of checks) {
      expect(check.problems, label).toEqual([]);
      expect(check.ok, label).toBe(true);
    }
  });

  it("matches the books: folios, opener heads and learning topics on every printed page", () => {
    const results = [
      { label: "English", result: assertEnMatchesBook() },
      { label: "French", result: assertFrMatchesBook() },
    ];
    for (const { label, result } of results) {
      expect(result.problems, label).toEqual([]);
      expect(result.ok, label).toBe(true);
      // The whole first-term corpus of each book was read, not a sample.
      expect(result.pagesChecked, label).toBe(86);
    }
  });

  it("reads both books at their own page offset, proved by the printed folio", () => {
    expect(EN_OFFSET).toBe(1);
    expect(FR_OFFSET).toBe(1);
    // Book page 6 is PDF page 7 — the first chapter opener.
    expect(loadEnPage(6)).toContain("How Things Burn and Air");
    expect(loadFrPage(6)).toContain("combustion des objets");
    // The plain folio is the last line of every page of the term.
    expect(enPrintedFooter(6)).toBe(6);
    expect(frPrintedFooter(6)).toBe(6);
    expect(enPrintedFooter(EGYPT_SCIENCE_EN_G6_T1_BOOK_END)).toBe(EGYPT_SCIENCE_EN_G6_T1_BOOK_END);
    expect(frPrintedFooter(EGYPT_SCIENCE_FR_G6_T1_BOOK_END)).toBe(EGYPT_SCIENCE_FR_G6_T1_BOOK_END);
    // The blank ruled pages (EN 92–95) sit outside the tree; the back cover
    // still prints the Ministry dedication, but no concept owns it.
    expect(loadEnPage(92)).toBe("");
    expect(loadEnPage(96)).toContain("dedicates this book");
  });

  it("tiles both books exactly: 10 chapters covering printed pages 6–91 once each", () => {
    const expected = [
      [6, 17],
      [18, 23],
      [24, 33],
      [34, 45],
      [46, 53],
      [54, 61],
      [62, 67],
      [68, 73],
      [74, 81],
      [82, 91],
    ];
    expect(EGYPT_SCIENCE_EN_G6_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual(expected);
    expect(EGYPT_SCIENCE_FR_G6_T1_UNITS.map((u) => [u.bookFrom, u.bookTo])).toEqual(expected);

    for (const ranges of [enConceptRanges(), frConceptRanges()]) {
      expect(ranges.length).toBe(22);
      expect(ranges[0]!.from).toBe(6);
      expect(ranges[ranges.length - 1]!.to).toBe(91);
      // Contiguous: every concept starts on the page after the previous one ended.
      for (let i = 1; i < ranges.length; i++) {
        expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
      }
    }
  });

  it("keeps a concept's own exercises inside that concept (the regression, both editions)", () => {
    const enOxygen = enConceptRanges().find((r) => r.key === "1-2")!;
    expect([enOxygen.from, enOxygen.to]).toEqual([8, 11]);
    // «The Role of Oxygen» teaches on book pages 8–9 and exercises on 10–11.
    expect(loadEnPage(10)).toContain("Try");
    expect(loadEnPage(11)).toContain("Exercise");
    expect(enConceptDocument(0, 1)).toContain("The Role of Oxygen");
    expect(enConceptDocument(0, 1)).toContain("### صفحة 11");
    expect(enConceptRanges().find((r) => r.key === "1-3")!.from).toBe(12);

    const frOxygen = frConceptRanges().find((r) => r.key === "1-2")!;
    expect([frOxygen.from, frOxygen.to]).toEqual([8, 11]);
    expect(loadFrPage(10)).toContain("Essaye");
    expect(loadFrPage(11)).toMatch(/Entra[iî]ne-toi/);
    expect(frConceptDocument(0, 1)).toContain("Le Rôle De L'oxygène");
    expect(frConceptDocument(0, 1)).toContain("### صفحة 11");
    expect(frConceptRanges().find((r) => r.key === "1-3")!.from).toBe(12);
  });

  it("gives every concept a document made of the book's own pages (both editions)", () => {
    const books = [
      { units: EGYPT_SCIENCE_EN_G6_T1_UNITS, range: enConceptRange, doc: enConceptDocument },
      { units: EGYPT_SCIENCE_FR_G6_T1_UNITS, range: frConceptRange, doc: frConceptDocument },
    ];
    for (const { units: bookUnits, range, doc } of books) {
      let counted = 0;
      bookUnits.forEach((unit, ui) => {
        unit.concepts.forEach((concept, ci) => {
          const { from, to } = range(ui, ci);
          const text = doc(ui, ci);
          expect(text.length).toBeGreaterThan(0);
          // The concept's printed opening words are retrievable from its document.
          expect(text).toContain(concept.title.split(/\s+/).slice(0, 2).join(" "));
          // Every page of the range is stamped, so a citation points at a real page.
          for (let book = from; book <= to; book++) {
            expect(text).toContain(`### صفحة ${book}`);
          }
          // And nothing from the next concept's pages leaked in.
          const nextStart = unit.concepts[ci + 1]?.bookFrom;
          if (nextStart) expect(text).not.toContain(`### صفحة ${nextStart}`);
          counted++;
        });
      });
      expect(counted).toBe(22);
    }
  });

  it("gives every concept its printed learning topic (both editions)", () => {
    for (const bookUnits of [EGYPT_SCIENCE_EN_G6_T1_UNITS, EGYPT_SCIENCE_FR_G6_T1_UNITS]) {
      let topics = 0;
      for (const unit of bookUnits) {
        for (const concept of unit.concepts) {
          expect(concept.concepts.length).toBeGreaterThan(0);
          for (const topic of concept.concepts) {
            expect(topic.trim().length).toBeGreaterThan(0);
            topics++;
          }
        }
      }
      expect(topics).toBe(22);
    }
  });

  it("seeds the official English tree: science-en subject, 10 chapters, 22 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_SCIENCE_EN_G6_SPEC);

    expect(seeded.curriculumId).toBeTruthy();
    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("science-en");
    expect(subject.nameAr).toBe("العلوم (بالإنجليزية)");

    const termRows = await db.db
      .select()
      .from(terms)
      .where(eq(terms.curriculumId, seeded.curriculumId))
      .orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1"]);
    const t1 = termRows[0]!;

    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.length).toBe(10);
    expect(unitRows[0]!.title).toBe("Chapter 1: Conditions for Burning");
    expect(unitRows[9]!.title).toBe("Chapter 10: Reaction between Solutions and Metals");

    // One lesson per printed concept, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g6-sci-en-1-1", "l-g6-sci-en-1-2", "l-g6-sci-en-1-3"],
      ["l-g6-sci-en-2-1", "l-g6-sci-en-2-2"],
      ["l-g6-sci-en-3-1", "l-g6-sci-en-3-2", "l-g6-sci-en-3-3"],
      ["l-g6-sci-en-4-1", "l-g6-sci-en-4-2", "l-g6-sci-en-4-3"],
      ["l-g6-sci-en-5-1", "l-g6-sci-en-5-2"],
      ["l-g6-sci-en-6-1", "l-g6-sci-en-6-2"],
      ["l-g6-sci-en-7-1", "l-g6-sci-en-7-2"],
      ["l-g6-sci-en-8-1"],
      ["l-g6-sci-en-9-1", "l-g6-sci-en-9-2"],
      ["l-g6-sci-en-10-1", "l-g6-sci-en-10-2"],
    ]);

    // Namespaced: the science books print the same «chapter-concept» labels, so
    // a bare `l-con-1-2` would exist in more than one curriculum.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-g6-sci-en-"))).toBe(true);
  });

  it("seeds the official French tree: science-fr subject, 10 chapters, 22 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_SCIENCE_FR_G6_SPEC);

    expect(seeded.curriculumId).toBeTruthy();
    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("science-fr");
    expect(subject.nameAr).toBe("العلوم (بالفرنسية)");

    const termRows = await db.db
      .select()
      .from(terms)
      .where(eq(terms.curriculumId, seeded.curriculumId))
      .orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1"]);
    const t1 = termRows[0]!;

    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.length).toBe(10);
    expect(unitRows[0]!.title).toBe("Chapitre 1 : Les conditions de combustion");
    expect(unitRows[9]!.title).toBe("Chapitre 10 : La réaction des solutions avec les métaux");

    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g6-sci-fr-1-1", "l-g6-sci-fr-1-2", "l-g6-sci-fr-1-3"],
      ["l-g6-sci-fr-2-1", "l-g6-sci-fr-2-2"],
      ["l-g6-sci-fr-3-1", "l-g6-sci-fr-3-2", "l-g6-sci-fr-3-3"],
      ["l-g6-sci-fr-4-1", "l-g6-sci-fr-4-2", "l-g6-sci-fr-4-3"],
      ["l-g6-sci-fr-5-1", "l-g6-sci-fr-5-2"],
      ["l-g6-sci-fr-6-1", "l-g6-sci-fr-6-2"],
      ["l-g6-sci-fr-7-1", "l-g6-sci-fr-7-2"],
      ["l-g6-sci-fr-8-1"],
      ["l-g6-sci-fr-9-1", "l-g6-sci-fr-9-2"],
      ["l-g6-sci-fr-10-1", "l-g6-sci-fr-10-2"],
    ]);

    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-g6-sci-fr-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_SCIENCE_EN_G6_SPEC);

    const t1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, seeded.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const unit10 = (await db.db
      .select()
      .from(units)
      .where(and(eq(units.termId, t1.id), eq(units.code, "unit-10")))
      .get())!;

    // The first lesson: the book's own opener text, page by page.
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g6-sci-en-1-1")).get())!;
    expect(first.title).toBe("Concept 1-1: How Things Burn and Air");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(firstText).toContain("How Things Burn and Air");
    expect(firstText).toContain("### صفحة 6");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
    }

    // A lesson in the LAST chapter must be scoped to that chapter's unit, not unit-1.
    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g6-sci-en-10-2")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit10.id);
    }

    // Its concept row carries the book's printed «Point!» learning topic.
    const lastConcept = (await db.db.select().from(concepts).where(eq(concepts.lessonId, last.id)).get())!;
    expect(lastConcept.title).toBe("Changes in Metals");
  });

  it("grounds the French lesson in its own book, not the English or Arabic one", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_SCIENCE_FR_G6_SPEC);

    const t1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, seeded.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const unit10 = (await db.db
      .select()
      .from(units)
      .where(and(eq(units.termId, t1.id), eq(units.code, "unit-10")))
      .get())!;

    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g6-sci-fr-1-1")).get())!;
    expect(first.title).toBe("Concept 1-1 : L'air et La combustion des objets");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(firstText).toContain("combustion des objets");
    expect(firstText).toContain("### صفحة 6");

    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g6-sci-fr-10-2")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit10.id);
    }
    const lastConcept = (await db.db.select().from(concepts).where(eq(concepts.lessonId, last.id)).get())!;
    expect(lastConcept.title).toBe("Les changements dans les métaux");
  });
});
