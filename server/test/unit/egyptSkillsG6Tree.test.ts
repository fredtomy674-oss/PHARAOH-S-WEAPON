import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_FAMILY_G6_SPEC, EGYPT_FARMING_G6_SPEC, EGYPT_LIBRARIES_G6_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET as FARMING_OFFSET,
  EGYPT_FARMING_G6_T1_BOOK_END,
  EGYPT_FARMING_G6_T1_BOOK_START,
  EGYPT_FARMING_G6_T1_UNITS,
  allLessonRanges as farmingLessonRanges,
  assertTreeMatchesTheBook as assertFarmingMatchesBook,
  isConsistent as isFarmingConsistent,
  lessonBookRange as farmingLessonRange,
  lessonDocument as farmingLessonDocument,
  loadBookPage as loadFarmingPage,
  printedFooter as farmingPrintedFooter,
} from "../../src/db/egyptFarmingG6T1.js";
import {
  EGYPT_LIBRARIES_G6_T1_BOOK_END,
  EGYPT_LIBRARIES_G6_T1_BOOK_START,
  EGYPT_LIBRARIES_G6_T1_UNITS,
  allLessonRanges as librariesLessonRanges,
  assertTreeMatchesTheBook as assertLibrariesMatchesBook,
  bookToPdfPage as librariesBookToPdfPage,
  folioCandidates as librariesFolioCandidates,
  isConsistent as isLibrariesConsistent,
  lessonBookRange as librariesLessonRange,
  lessonDocument as librariesLessonDocument,
  loadBookPage as loadLibrariesPage,
  pdfPageToBookPages as librariesPdfToBookPages,
  printedFooter as librariesPrintedFooter,
} from "../../src/db/egyptLibrariesG6T1.js";
import {
  EGYPT_FAMILY_G6_T1_BACK_MATTER,
  EGYPT_FAMILY_G6_T1_BOOK_END,
  EGYPT_FAMILY_G6_T1_BOOK_START,
  EGYPT_FAMILY_G6_T1_MISSING_PRINT_PAGES,
  EGYPT_FAMILY_G6_T1_UNITS,
  allLessonRanges as familyLessonRanges,
  assertTreeMatchesTheBook as assertFamilyMatchesBook,
  bookToPdfPage as familyBookToPdfPage,
  isConsistent as isFamilyConsistent,
  lessonBookRange as familyLessonRange,
  lessonDocument as familyLessonDocument,
  loadBookPage as loadFamilyPage,
  pdfPageToBookPage as familyPdfToBookPage,
  printedFooter as familyPrintedFooter,
} from "../../src/db/egyptFamilyG6T1.js";
import { stageForLesson } from "../../src/modules/curriculum/bookStage.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, concepts, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 153 — the three Grade-6 «مهارات» books the MoE teaches alongside the
 * regular subjects: «مهارات إدارة الأسرة (الاقتصاد المنزلي سابقًا)»، «مهارات
 * الزراعة» and «المكتبات». Each first term IS its Ministry student book:
 * units/lessons straight from the printed pages, every lesson grounded on the
 * pages its own title page opens, and every claim re-proved against the
 * scanned book (printed folios, printed titles, printed objectives, and — for
 * the libraries book — the book's own فهرس) before the seeder will run.
 *
 * These tests pin the things that could silently hide book content from the
 * tutor:
 *  - the table invariants (keys, unit bounds, a gap-free tiling of the book);
 *  - the ranges against the book itself — the same check the seeder refuses to
 *    seed without;
 *  - the family book's piecewise page model: its printed folios skip 24 (the
 *    blank leaf before the unit-2 opener — no scan), and the stage must report
 *    that page absent instead of showing a neighbouring scan;
 *  - the libraries book's single-page model: one scan per printed page, every
 *    folio names that same page, and the فهرس rows lag the truth by one page
 *    for most lessons (the checks tolerate exactly that);
 *  - the seeded trees and their RAG scope, with the book's own text in chunks.
 */
/** The same folding the tree's own checks use — OCR prints «ى» for «ي» at word ends. */
function normalize(text: string): string {
  return text
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

describe("PHASE 153 — Egypt Grade-6 «مهارات» official Ministry trees", () => {
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
      { label: "family", result: assertFamilyMatchesBook(), pages: 36 },
      { label: "farming", result: assertFarmingMatchesBook(), pages: 36 },
      { label: "libraries", result: assertLibrariesMatchesBook(), pages: 19 },
    ];
    for (const { label, result, pages } of results) {
      expect(result.problems, label).toEqual([]);
      expect(result.ok, label).toBe(true);
      // The whole first-term corpus of each book was checked, not a sample.
      expect(result.pagesChecked, label).toBe(pages);
    }
  });

  it("reads farming and family at their own printed folios, with the two known chip folds", () => {
    expect(FARMING_OFFSET).toBe(0);
    expect(normalize(loadFarmingPage(7))).toContain(normalize("زراعة النباتات المزهرة"));
    // The frontispiece's chip is the folded «ه» (٥) — the same misread the
    // Grade-4/5 books of the series needed.
    expect(farmingPrintedFooter(5)).toBe(5);
    // Unlike the Grade-5 book, this one's unit openers DO print their folios.
    expect(farmingPrintedFooter(6)).toBe(6);
    expect(farmingPrintedFooter(17)).toBe(17);
    expect(farmingPrintedFooter(7)).toBe(7);
    expect(farmingPrintedFooter(EGYPT_FARMING_G6_T1_BOOK_END)).toBe(EGYPT_FARMING_G6_T1_BOOK_END);
    expect(familyPrintedFooter(6)).toBe(6);
    // Page 7's chip is printed «V» (٧) — the same OCR misread the Grade-4/5
    // books of the series needed folded.
    expect(familyPrintedFooter(7)).toBe(7);
    expect(familyPrintedFooter(28)).toBe(28);
    expect(familyPrintedFooter(EGYPT_FAMILY_G6_T1_BOOK_END)).toBe(EGYPT_FAMILY_G6_T1_BOOK_END);
    // Unit openers print no folio, so they have no readable footer (the
    // unit-2 opener is page 25 — one past the missing leaf 24).
    expect(familyPrintedFooter(5)).toBeNull();
    expect(familyPrintedFooter(25)).toBeNull();
  });

  it("maps the family book piecewise: folio 24 is skipped, and that page has no scan", () => {
    // Before the skip the shift is 0; after it the scan is the folio − 1.
    expect(familyBookToPdfPage(23)).toBe(23);
    expect(familyBookToPdfPage(25)).toBe(24);
    expect(familyBookToPdfPage(43)).toBe(42);
    // The one printed page the PDF never carried resolves past every scan.
    expect(EGYPT_FAMILY_G6_T1_MISSING_PRINT_PAGES).toEqual([24]);
    for (const page of EGYPT_FAMILY_G6_T1_MISSING_PRINT_PAGES) {
      expect(familyBookToPdfPage(page)).toBeGreaterThan(999);
      expect(loadFamilyPage(page)).toBe("");
    }
    // …and the inverse map proves the scans themselves: scan 24 carries the
    // unit-2 opener (labeled 25), scan 25 carries lesson 2-1's title page (26).
    expect(familyPdfToBookPage(24)).toBe(25);
    expect(familyPdfToBookPage(52)).toBe(53);
    // The unit-2 opener reprints unit 1's wordmark (a MoE production error):
    // the page really says «الوحدة الثانية / بيئتي مسئوليتي», while the book's
    // فهرس and running heads print «تراث مجتمعنا» — the name the table ships.
    expect(normalize(loadFamilyPage(25))).toContain(normalize("الوحدة الثانية"));
    expect(normalize(loadFamilyPage(25))).toContain(normalize("بيئتي مسئوليتي"));
    expect(EGYPT_FAMILY_G6_T1_UNITS[1]!.title).toBe("تراث مجتمعنا");
    expect(normalize(loadFamilyPage(26))).toContain(normalize("عاداتي وتقاليدي"));
    // Back matter lies beyond BOOK_END: المراجع (44) … إرشادات التدريس (53).
    expect(EGYPT_FAMILY_G6_T1_BOOK_END).toBe(43);
    expect(EGYPT_FAMILY_G6_T1_BACK_MATTER).toEqual({ from: 44, to: 53 });
    expect(loadFamilyPage(44)).toContain("المراجع");
  });

  it("maps the libraries book page-for-page: one scan carries one printed page", () => {
    // Unlike the Grade-5 book of the series (spread scans), each scan is one
    // printed page, so the map is identity.
    expect(librariesBookToPdfPage(5)).toBe(5);
    expect(librariesBookToPdfPage(11)).toBe(11);
    expect(librariesBookToPdfPage(41)).toBe(41);
    expect(librariesPdfToBookPages(11)).toEqual({ from: 11, to: 11 });
    expect(loadLibrariesPage(5)).toContain("رحلة في أنشطة المكتبة");
    // The folios read on a scan name that same scan, and each page that
    // prints its number proves it.
    expect(librariesFolioCandidates(11)).toEqual([11]);
    expect(librariesPrintedFooter(11)).toBe(11);
    expect(librariesPrintedFooter(41)).toBe(41);
    // The lesson-1 title page prints no folio — its foot line has no number.
    expect(librariesPrintedFooter(5)).toBeNull();
    expect(librariesFolioCandidates(5)).toEqual([]);
    // The فهرس rows lag the printed folios (lesson 12 printed as «مكتبى
    // المنزلية» on page ٣٨, while the title page prints «مكتبتي المنزلية» on
    // page 39) — the tree's own check tolerates exactly that one-page lag and
    // the one-letter title variant.
    expect(loadLibrariesPage(4)).toContain("الدرس الثاني عشر | مكتبى المنزلية | ٣٨");
    expect(normalize(loadLibrariesPage(39))).toContain(normalize("مكتبتي المنزلية"));
  });

  it("tiles each book exactly, end to end", () => {
    const farming = farmingLessonRanges();
    expect(farming.map((r) => [r.from, r.to])).toEqual([
      [6, 12],
      [13, 16],
      [17, 22],
      [23, 28],
      [29, 34],
      [35, 41],
    ]);
    const libraries = librariesLessonRanges();
    expect(libraries.length).toBe(12);
    expect(libraries.map((r) => [r.from, r.to])).toEqual([
      [5, 7],
      [8, 10],
      [11, 13],
      [14, 16],
      [17, 19],
      [20, 22],
      [23, 25],
      [26, 28],
      [29, 31],
      [32, 35],
      [36, 38],
      [39, 41],
    ]);
    const family = familyLessonRanges();
    expect(family.map((r) => [r.from, r.to])).toEqual([
      [5, 9],
      [10, 15],
      [16, 24],
      [25, 31],
      [32, 37],
      [38, 43],
    ]);

    for (const [ranges, start, end] of [
      [farming, EGYPT_FARMING_G6_T1_BOOK_START, EGYPT_FARMING_G6_T1_BOOK_END],
      [libraries, EGYPT_LIBRARIES_G6_T1_BOOK_START, EGYPT_LIBRARIES_G6_T1_BOOK_END],
      [family, EGYPT_FAMILY_G6_T1_BOOK_START, EGYPT_FAMILY_G6_T1_BOOK_END],
    ] as const) {
      expect(ranges[0]!.from).toBe(start);
      expect(ranges[ranges.length - 1]!.to).toBe(end);
      for (let i = 1; i < ranges.length; i++) {
        expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
      }
    }
  });

  it("keeps the family book's un-scanned page owned by its lesson", () => {
    // The blank leaf 24 follows lesson 1-3's last scanned page (23) — no gap.
    const l3 = familyLessonRange(0, 2);
    expect([l3.from, l3.to]).toEqual([16, 24]);
    // The unit-2 opener (25) is inside lesson 2-1's range, like the unit-1
    // opener (5) is inside lesson 1-1's.
    expect(familyLessonRange(1, 0)).toEqual({ from: 25, to: 31 });
    for (const page of EGYPT_FAMILY_G6_T1_MISSING_PRINT_PAGES) {
      const owners = familyLessonRanges().filter((r) => page >= r.from && page <= r.to);
      expect(owners.length, `printed ${page}`).toBe(1);
    }
  });

  it("stages the family book: the un-scanned page reports absent, not a neighbouring scan", () => {
    const stage = stageForLesson("eg-g6-family", "l-g6-fam-1-3");
    expect(stage).not.toBeNull();
    expect(stage!.fromBookPage).toBe(16);
    expect(stage!.toBookPage).toBe(24);
    const missing = stage!.pages.find((p) => p.bookPage === 24)!;
    expect(missing.present).toBe(false);
    expect(missing.pdfPage).toBeGreaterThan(999);
    // The scanned page before it is present, so the absence is the page itself.
    const present = stage!.pages.find((p) => p.bookPage === 23)!;
    expect(present.present).toBe(true);
    // And the shift is real: the unit-2 opener (25) lives on scan 24.
    const shifted = stageForLesson("eg-g6-family", "l-g6-fam-2-1")!.pages[0]!;
    expect(shifted.bookPage).toBe(25);
    expect(shifted.pdfPage).toBe(24);
    expect(shifted.present).toBe(true);
  });

  it("stages the libraries book: every printed page resolves to its own scan", () => {
    const stage = stageForLesson("eg-g6-libraries", "l-g6-lib-1-2");
    expect(stage).not.toBeNull();
    expect(stage!.fromBookPage).toBe(8);
    expect(stage!.toBookPage).toBe(10);
    for (const bookPage of [8, 9, 10]) {
      const page = stage!.pages.find((p) => p.bookPage === bookPage)!;
      expect(page.present).toBe(true);
      expect(page.pdfPage).toBe(bookPage);
    }
  });

  it("gives every lesson a document made of the book's own pages", () => {
    const books = [
      {
        units: EGYPT_FARMING_G6_T1_UNITS,
        range: farmingLessonRange,
        doc: farmingLessonDocument,
        load: loadFarmingPage,
        pdf: (book: number) => book + FARMING_OFFSET,
        count: 6,
      },
      {
        units: EGYPT_LIBRARIES_G6_T1_UNITS,
        range: librariesLessonRange,
        doc: librariesLessonDocument,
        load: loadLibrariesPage,
        pdf: librariesBookToPdfPage,
        count: 12,
      },
      {
        units: EGYPT_FAMILY_G6_T1_UNITS,
        range: familyLessonRange,
        doc: familyLessonDocument,
        load: loadFamilyPage,
        pdf: familyBookToPdfPage,
        count: 6,
      },
    ];
    for (const { units: bookUnits, range, doc, load, pdf, count } of books) {
      let seen = 0;
      bookUnits.forEach((unit, ui) => {
        unit.lessons.forEach((lesson, li) => {
          const { from, to } = range(ui, li);
          const text = doc(ui, li);
          expect(text.length).toBeGreaterThan(0);
          // The lesson's own title page prints its title (a unit's first lesson
          // owns the unit opener too, which prints the unit title instead).
          expect(normalize(load(lesson.bookFrom))).toContain(normalize(lesson.title.split(/\s+/)[0]!));
          // Every page of the range that has a scan is stamped — each scan's
          // text under its own page, so a citation points at a real page and
          // no scan is counted twice.
          for (let book = from; book <= to; book++) {
            const page = load(book);
            const firstOfItsScan = book === from || pdf(book) !== pdf(book - 1);
            if (page && firstOfItsScan) {
              expect(text).toContain(`[صفحة الكتاب ${book}]`);
            } else {
              expect(text).not.toContain(`[صفحة الكتاب ${book}]`);
            }
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
    for (const bookUnits of [EGYPT_FARMING_G6_T1_UNITS, EGYPT_LIBRARIES_G6_T1_UNITS, EGYPT_FAMILY_G6_T1_UNITS]) {
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
    expect(counted).toBe(80);
  });

  it("seeds the family tree: family subject, 2 units, 6 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_FAMILY_G6_SPEC);

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
    expect(unitRows[0]!.title).toBe("بيئتي مسئوليتي");
    expect(unitRows[1]!.title).toBe("تراث مجتمعنا");

    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g6-fam-1-1", "l-g6-fam-1-2", "l-g6-fam-1-3"],
      ["l-g6-fam-2-1", "l-g6-fam-2-2", "l-g6-fam-2-3"],
    ]);

    // The book restarts ordinals per unit: unit 2 opens with «الدرس الأول».
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g6-fam-2-1")).get())!;
    expect(first.title).toBe("الدرس الأول: عاداتي وتقاليدي");
  });

  it("seeds the farming tree: farming subject, 5 units, 6 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_FARMING_G6_SPEC);

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
    expect(unitRows.map((u) => u.title)).toEqual([
      "نباتات الزينة",
      "الصناعات الغذائية",
      "الألبان",
      "الزراعة المستدامة",
      "نحل العسل",
    ]);

    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g6-farm-1-1", "l-g6-farm-1-2"],
      ["l-g6-farm-2-1"],
      ["l-g6-farm-3-1"],
      ["l-g6-farm-4-1"],
      ["l-g6-farm-5-1"],
    ]);

    // The farming book numbers its lessons continuously through the term.
    const unit2 = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g6-farm-2-1")).get())!;
    expect(unit2.title).toBe("الدرس الثالث: المربى");
  });

  it("seeds the libraries tree: libraries subject, one container unit, 12 lessons", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_LIBRARIES_G6_SPEC);

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
    expect(unitRows[0]!.title).toBe("المكتبات");
    const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unitRows[0]!.id)).orderBy(lessons.sortOrder);
    expect(rows.map((r) => r.code)).toEqual(
      Array.from({ length: 12 }, (_, i) => `l-g6-lib-1-${i + 1}`),
    );
    expect(rows[0]!.title).toBe("الدرس الأول: رحلة في أنشطة المكتبة");
    expect(rows[11]!.title).toBe("الدرس الثاني عشر: مكتبتي المنزلية");
  });

  it("grounds a lesson in its own book: chunks carry the book's pages, in their own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_FAMILY_G6_SPEC);

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

    // The first lesson: the unit opener and the book's own title/objectives
    // page, page by page.
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g6-fam-1-1")).get())!;
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(firstText).toContain("التوفير");
    expect(firstText).toContain("[صفحة الكتاب 5]");
    expect(firstText).toContain("[صفحة الكتاب 6]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
    }

    // A lesson in the LAST unit must be scoped to that unit, not unit-1.
    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g6-fam-2-3")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit2.id);
    }

    // Its concept row carries the book's own printed objectives.
    const firstConcept = (await db.db.select().from(concepts).where(eq(concepts.lessonId, first.id)).get())!;
    expect(firstConcept.title).toBe("يعدد أهمية التوفير وترشيد الاستهلاك.");
  });

  it("grounds the farming and libraries lessons in their own books", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));

    const farming = await seedCountry(db, knowledge, EGYPT_FARMING_G6_SPEC);
    const farmingT1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, farming.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const farmingLast = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g6-farm-5-1")).get())!;
    const farmingChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, farmingLast.id));
    const farmingText = farmingChunks.map((c) => c.content).join("\n");
    expect(farmingText).toContain("[صفحة الكتاب 35]");
    expect(farmingText).toContain("نحل العسل");
    for (const c of farmingChunks) expect(c.termId).toBe(farmingT1.id);

    const libraries = await seedCountry(db, knowledge, EGYPT_LIBRARIES_G6_SPEC);
    const librariesT1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, libraries.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const libLast = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g6-lib-1-12")).get())!;
    const libChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, libLast.id));
    const libText = libChunks.map((c) => c.content).join("\n");
    expect(libText).toContain("[صفحة الكتاب 39]");
    expect(libText).toContain("مكتبتي المنزلية");
    for (const c of libChunks) expect(c.termId).toBe(librariesT1.id);
  });
});
