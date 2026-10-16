import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_FAMILY_G4_SPEC, EGYPT_FARMING_G4_SPEC, EGYPT_LIBRARIES_G4_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET as FARMING_OFFSET,
  EGYPT_FARMING_G4_T1_BOOK_END,
  EGYPT_FARMING_G4_T1_BOOK_START,
  EGYPT_FARMING_G4_T1_UNITS,
  allLessonRanges as farmingLessonRanges,
  assertTreeMatchesTheBook as assertFarmingMatchesBook,
  isConsistent as isFarmingConsistent,
  lessonBookRange as farmingLessonRange,
  lessonDocument as farmingLessonDocument,
  loadBookPage as loadFarmingPage,
  printedFooter as farmingPrintedFooter,
} from "../../src/db/egyptFarmingG4T1.js";
import {
  BOOK_TO_PDF_OFFSET as LIBRARIES_OFFSET,
  EGYPT_LIBRARIES_G4_T1_BOOK_END,
  EGYPT_LIBRARIES_G4_T1_BOOK_START,
  EGYPT_LIBRARIES_G4_T1_UNITS,
  allLessonRanges as librariesLessonRanges,
  assertTreeMatchesTheBook as assertLibrariesMatchesBook,
  isConsistent as isLibrariesConsistent,
  lessonBookRange as librariesLessonRange,
  lessonDocument as librariesLessonDocument,
  loadBookPage as loadLibrariesPage,
  printedFooter as librariesPrintedFooter,
} from "../../src/db/egyptLibrariesG4T1.js";
import {
  EGYPT_FAMILY_G4_T1_BACK_MATTER,
  EGYPT_FAMILY_G4_T1_BOOK_END,
  EGYPT_FAMILY_G4_T1_BOOK_START,
  EGYPT_FAMILY_G4_T1_MISSING_PRINT_PAGES,
  EGYPT_FAMILY_G4_T1_UNITS,
  allLessonRanges as familyLessonRanges,
  assertTreeMatchesTheBook as assertFamilyMatchesBook,
  bookToPdfPage as familyBookToPdfPage,
  isConsistent as isFamilyConsistent,
  lessonBookRange as familyLessonRange,
  lessonDocument as familyLessonDocument,
  loadBookPage as loadFamilyPage,
  pdfPageToBookPage as familyPdfToBookPage,
  printedFooter as familyPrintedFooter,
} from "../../src/db/egyptFamilyG4T1.js";
import { stageForLesson } from "../../src/modules/curriculum/bookStage.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, concepts, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 151 — the three Grade-4 «مهارات» books the MoE teaches alongside the
 * regular subjects: «مهارات إدارة الأسرة وريادة الأعمال»، «مهارات الزراعة
 * وريادة الأعمال» and «المكتبات ومهارات البحث». Each first term IS its
 * Ministry student book: units/lessons straight from the printed pages, every
 * lesson grounded on the pages its own title page opens, and every claim
 * re-proved against the scanned book (printed folios, printed titles, printed
 * objectives) before the seeder will run.
 *
 * These tests pin the things that could silently hide book content from the
 * tutor:
 *  - the table invariants (keys, unit bounds, a gap-free tiling of the book);
 *  - the ranges against the book itself — the same check the seeder refuses to
 *    seed without;
 *  - the family book's piecewise page model: its printed folios skip 25 and 33,
 *    those two pages have no scan, and the stage must report them absent
 *    instead of showing a neighbouring page;
 *  - the seeded trees and their RAG scope, with the book's own text in chunks.
 */
describe("PHASE 151 — Egypt Grade-4 «مهارات» official Ministry trees", () => {
  it("has tables whose invariants hold (all three books)", () => {
    const checks = [
      { label: "family", check: isFamilyConsistent() },
      { label: "farming", check: isFarmingConsistent() },
      { label: "libraries", check: isLibrariesConsistent() },
    ];
    for (const { label, check } of checks) {
      expect(check.problems, label).toEqual([]);
      expect(check.ok, label).toBe(true);
    }
  });

  it("matches the books: folios, opener heads and printed objectives on every page", () => {
    const results = [
      { label: "family", result: assertFamilyMatchesBook(), pages: 48 },
      { label: "farming", result: assertFarmingMatchesBook(), pages: 28 },
      { label: "libraries", result: assertLibrariesMatchesBook(), pages: 30 },
    ];
    for (const { label, result, pages } of results) {
      expect(result.problems, label).toEqual([]);
      expect(result.ok, label).toBe(true);
      // The whole first-term corpus of each book was checked, not a sample.
      expect(result.pagesChecked, label).toBe(pages);
    }
  });

  it("reads farming and libraries at their own folio, offset 0", () => {
    expect(FARMING_OFFSET).toBe(0);
    expect(LIBRARIES_OFFSET).toBe(0);
    expect(loadFarmingPage(6)).toContain("رعاية نباتات الزينة");
    expect(loadLibrariesPage(8)).toContain("بيوت الكتب");
    // The chip is the proof: page 6 prints ٦, the last lesson page prints its own.
    expect(farmingPrintedFooter(6)).toBe(6);
    expect(librariesPrintedFooter(8)).toBe(8);
    expect(farmingPrintedFooter(EGYPT_FARMING_G4_T1_BOOK_END)).toBe(EGYPT_FARMING_G4_T1_BOOK_END);
    expect(librariesPrintedFooter(EGYPT_LIBRARIES_G4_T1_BOOK_END)).toBe(EGYPT_LIBRARIES_G4_T1_BOOK_END);
    // The two OCR chip misreads are folded, and only those two.
    expect(farmingPrintedFooter(5)).toBe(5);
    expect(farmingPrintedFooter(7)).toBe(7);
    expect(familyPrintedFooter(7)).toBe(7);
  });

  it("maps the family book piecewise: folios skip 25 and 33, and those pages have no scan", () => {
    // Before the first skip the shift is 0; after it the scan is the folio − 1.
    expect(familyBookToPdfPage(24)).toBe(24);
    expect(familyBookToPdfPage(26)).toBe(25);
    expect(familyBookToPdfPage(32)).toBe(31);
    // After the second skip the shift is 2 — page 34 rides on scan 32.
    expect(familyBookToPdfPage(34)).toBe(32);
    expect(familyBookToPdfPage(56)).toBe(54);
    // The two printed pages the PDF never carried resolve past every scan.
    for (const page of EGYPT_FAMILY_G4_T1_MISSING_PRINT_PAGES) {
      expect(familyBookToPdfPage(page)).toBeGreaterThan(999);
      expect(loadFamilyPage(page)).toBe("");
    }
    // …and the inverse map proves the scans themselves: scan 25 prints 26.
    expect(familyPdfToBookPage(25)).toBe(26);
    expect(familyPdfToBookPage(32)).toBe(34);
    expect(familyPdfToBookPage(54)).toBe(56);
    // The scan of printed 26 really carries «إبرة وخيط»'s title page.
    expect(loadFamilyPage(26)).toContain("إبرة وخيط");
    expect(familyPrintedFooter(26)).toBe(26);
    expect(familyPrintedFooter(34)).toBe(34);
    // Back matter lies beyond BOOK_END and prints unnumbered pages.
    expect(EGYPT_FAMILY_G4_T1_BOOK_END).toBe(56);
    expect(EGYPT_FAMILY_G4_T1_BACK_MATTER).toEqual({ from: 57, to: 66 });
  });

  it("tiles each book exactly, end to end", () => {
    const farming = farmingLessonRanges();
    expect(farming.map((r) => [r.from, r.to])).toEqual([
      [5, 10],
      [11, 15],
      [16, 19],
      [20, 25],
      [26, 30],
      [31, 33],
    ]);
    const libraries = librariesLessonRanges();
    expect(libraries.length).toBe(12);
    expect(libraries.map((r) => [r.from, r.to])).toEqual([
      [5, 7],
      [8, 10],
      [11, 13],
      [14, 16],
      [17, 19],
      [20, 21],
      [22, 24],
      [25, 27],
      [28, 30],
      [31, 33],
      [34, 36],
      [37, 39],
    ]);
    const family = familyLessonRanges();
    expect(family.map((r) => [r.from, r.to])).toEqual([
      [5, 15],
      [16, 25],
      [26, 31],
      [32, 39],
      [40, 47],
      [48, 56],
    ]);

    for (const [ranges, start, end] of [
      [farming, EGYPT_FARMING_G4_T1_BOOK_START, EGYPT_FARMING_G4_T1_BOOK_END],
      [libraries, EGYPT_LIBRARIES_G4_T1_BOOK_START, EGYPT_LIBRARIES_G4_T1_BOOK_END],
      [family, EGYPT_FAMILY_G4_T1_BOOK_START, EGYPT_FAMILY_G4_T1_BOOK_END],
    ] as const) {
      expect(ranges[0]!.from).toBe(start);
      expect(ranges[ranges.length - 1]!.to).toBe(end);
      for (let i = 1; i < ranges.length; i++) {
        expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
      }
    }
  });

  it("keeps the family book's un-scanned pages owned by their lesson", () => {
    // Printed 25 ends lesson 1-2, printed 33 ends lesson 1-3 — no gap.
    const l2 = familyLessonRange(0, 1);
    expect([l2.from, l2.to]).toEqual([16, 25]);
    const l3 = familyLessonRange(0, 2);
    expect([l3.from, l3.to]).toEqual([26, 31]);
    for (const page of EGYPT_FAMILY_G4_T1_MISSING_PRINT_PAGES) {
      const owners = familyLessonRanges().filter((r) => page >= r.from && page <= r.to);
      expect(owners.length, `printed ${page}`).toBe(1);
    }
  });

  it("stages the family book: un-scanned pages report absent, not a neighbouring scan", () => {
    const stage = stageForLesson("eg-g4-family", "l-g4-fam-1-2");
    expect(stage).not.toBeNull();
    expect(stage!.fromBookPage).toBe(16);
    expect(stage!.toBookPage).toBe(25);
    const missing = stage!.pages.find((p) => p.bookPage === 25)!;
    expect(missing.present).toBe(false);
    expect(missing.pdfPage).toBeGreaterThan(999);
    // The scanned page before it is present, so the absence is the page itself.
    const present = stage!.pages.find((p) => p.bookPage === 24)!;
    expect(present.present).toBe(true);
    // And the shift is real: printed 26 lives on scan 25.
    const shifted = stageForLesson("eg-g4-family", "l-g4-fam-1-3")!.pages[0]!;
    expect(shifted.bookPage).toBe(26);
    expect(shifted.pdfPage).toBe(25);
    expect(shifted.present).toBe(true);
  });

  it("gives every lesson a document made of the book's own pages", () => {
    const books = [
      {
        units: EGYPT_FARMING_G4_T1_UNITS,
        range: farmingLessonRange,
        doc: farmingLessonDocument,
        load: loadFarmingPage,
        count: 6,
      },
      {
        units: EGYPT_LIBRARIES_G4_T1_UNITS,
        range: librariesLessonRange,
        doc: librariesLessonDocument,
        load: loadLibrariesPage,
        count: 12,
      },
      {
        units: EGYPT_FAMILY_G4_T1_UNITS,
        range: familyLessonRange,
        doc: familyLessonDocument,
        load: loadFamilyPage,
        count: 6,
      },
    ];
    for (const { units: bookUnits, range, doc, load, count } of books) {
      let seen = 0;
      bookUnits.forEach((unit, ui) => {
        unit.lessons.forEach((lesson, li) => {
          const { from, to } = range(ui, li);
          const text = doc(ui, li);
          expect(text.length).toBeGreaterThan(0);
          // The lesson's own title page prints its title (a unit's first lesson
          // owns the unit opener too, which prints the unit title instead).
          expect(load(lesson.bookFrom)).toContain(lesson.title.split(/\s+/)[0]!);
          // Every page of the range that has a scan is stamped, so a citation
          // points at a real page; un-scanned pages cannot be stamped.
          for (let book = from; book <= to; book++) {
            const page = load(book);
            if (page) expect(text).toContain(`[صفحة الكتاب ${book}]`);
            else expect(text).not.toContain(`[صفحة الكتاب ${book}]`);
          }
          // And nothing from the next lesson's pages leaked in.
          const nextStart = unit.lessons[li + 1]?.bookFrom;
          if (nextStart) expect(text).not.toContain(`[صفحة الكتاب ${nextStart}]`);
          seen++;
        });
      });
      expect(seen).toBe(count);
    }
  });

  it("gives every lesson its printed objectives, verbatim", () => {
    let counted = 0;
    for (const bookUnits of [EGYPT_FARMING_G4_T1_UNITS, EGYPT_LIBRARIES_G4_T1_UNITS, EGYPT_FAMILY_G4_T1_UNITS]) {
      for (const unit of bookUnits) {
        for (const lesson of unit.lessons) {
          expect(lesson.concepts.length).toBeGreaterThan(0);
          for (const objective of lesson.concepts) {
            expect(objective.trim().length).toBeGreaterThan(0);
            counted++;
          }
        }
      }
    }
    expect(counted).toBe(77);
  });

  it("seeds the family tree: family subject, 2 units, 6 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_FAMILY_G4_SPEC);

    expect(seeded.curriculumId).toBeTruthy();
    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("family");
    expect(subject.nameAr).toBe("مهارات إدارة الأسرة وريادة الأعمال");

    const termRows = await db.db
      .select()
      .from(terms)
      .where(eq(terms.curriculumId, seeded.curriculumId))
      .orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1"]);
    const t1 = termRows[0]!;

    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.length).toBe(2);
    expect(unitRows[0]!.title).toBe("فن ومهارة");
    expect(unitRows[1]!.title).toBe("مهارة وإبداع");

    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g4-fam-1-1", "l-g4-fam-1-2", "l-g4-fam-1-3"],
      ["l-g4-fam-2-1", "l-g4-fam-2-2", "l-g4-fam-2-3"],
    ]);

    // The book restarts ordinals per unit: unit 2 opens with «الدرس الأول».
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g4-fam-2-1")).get())!;
    expect(first.title).toBe("الدرس الأول: أحافظ على أدواتي");
  });

  it("seeds the farming tree: farming subject, 3 units, 6 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_FARMING_G4_SPEC);

    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("farming");
    expect(subject.nameAr).toBe("مهارات الزراعة وريادة الأعمال");

    const termRows = await db.db
      .select()
      .from(terms)
      .where(eq(terms.curriculumId, seeded.curriculumId))
      .orderBy(terms.sortOrder);
    const t1 = termRows[0]!;
    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.map((u) => u.title)).toEqual(["نباتات الزينة", "الصناعات الغذائية", "الاستدامة في الزراعة"]);

    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g4-farm-1-1", "l-g4-farm-1-2", "l-g4-farm-1-3"],
      ["l-g4-farm-2-1"],
      ["l-g4-farm-3-1", "l-g4-farm-3-2"],
    ]);

    // The farming book numbers its lessons continuously through the term.
    const unit2 = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g4-farm-2-1")).get())!;
    expect(unit2.title).toBe("الدرس الرابع: الشراب الطبيعي و الشراب الصناعي");
  });

  it("seeds the libraries tree: libraries subject, one container unit, 12 lessons", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_LIBRARIES_G4_SPEC);

    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("libraries");
    expect(subject.nameAr).toBe("المكتبات ومهارات البحث");

    const termRows = await db.db
      .select()
      .from(terms)
      .where(eq(terms.curriculumId, seeded.curriculumId))
      .orderBy(terms.sortOrder);
    const t1 = termRows[0]!;
    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    // The book prints no units: one honest container, titled with the book's name.
    expect(unitRows.length).toBe(1);
    expect(unitRows[0]!.title).toBe("المكتبات ومهارات البحث");
    const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unitRows[0]!.id)).orderBy(lessons.sortOrder);
    expect(rows.map((r) => r.code)).toEqual(
      Array.from({ length: 12 }, (_, i) => `l-g4-lib-1-${i + 1}`),
    );
    expect(rows[0]!.title).toBe("الدرس الأول: من النقش إلى القلم");
    expect(rows[11]!.title).toBe("الدرس الثاني عشر: من الرف إلى الإنجاز");
  });

  it("grounds a lesson in its own book: chunks carry the book's pages, in their own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_FAMILY_G4_SPEC);

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

    // The first lesson: the book's own title/objectives page, page by page.
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g4-fam-1-1")).get())!;
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(firstText).toContain("أسرتي الصغيرة");
    expect(firstText).toContain("[صفحة الكتاب 6]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
    }

    // A lesson in the LAST unit must be scoped to that unit, not unit-1.
    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g4-fam-2-3")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit2.id);
    }

    // Its concept row carries the book's own printed objectives.
    const firstConcept = (await db.db.select().from(concepts).where(eq(concepts.lessonId, first.id)).get())!;
    expect(firstConcept.title).toBe("يحدد أهمية دوره ومسئولياته اليومية في أسرته.");
  });

  it("grounds the farming and libraries lessons in their own books", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));

    const farming = await seedCountry(db, knowledge, EGYPT_FARMING_G4_SPEC);
    const farmingT1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, farming.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const farmingLast = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g4-farm-3-2")).get())!;
    const farmingChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, farmingLast.id));
    const farmingText = farmingChunks.map((c) => c.content).join("\n");
    expect(farmingText).toContain("[صفحة الكتاب 31]");
    expect(farmingText).toContain("تدوير الخامات");
    for (const c of farmingChunks) expect(c.termId).toBe(farmingT1.id);

    const libraries = await seedCountry(db, knowledge, EGYPT_LIBRARIES_G4_SPEC);
    const librariesT1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, libraries.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const libLast = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g4-lib-1-12")).get())!;
    const libChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, libLast.id));
    const libText = libChunks.map((c) => c.content).join("\n");
    expect(libText).toContain("[صفحة الكتاب 37]");
    expect(libText).toContain("من الرف إلى الإنجاز");
    for (const c of libChunks) expect(c.termId).toBe(librariesT1.id);
  });
});
