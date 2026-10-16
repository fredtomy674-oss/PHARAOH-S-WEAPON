import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_FAMILY_G5_SPEC, EGYPT_FARMING_G5_SPEC, EGYPT_LIBRARIES_G5_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET as FARMING_OFFSET,
  EGYPT_FARMING_G5_T1_BOOK_END,
  EGYPT_FARMING_G5_T1_BOOK_START,
  EGYPT_FARMING_G5_T1_UNITS,
  allLessonRanges as farmingLessonRanges,
  assertTreeMatchesTheBook as assertFarmingMatchesBook,
  isConsistent as isFarmingConsistent,
  lessonBookRange as farmingLessonRange,
  lessonDocument as farmingLessonDocument,
  loadBookPage as loadFarmingPage,
  printedFooter as farmingPrintedFooter,
} from "../../src/db/egyptFarmingG5T1.js";
import {
  EGYPT_LIBRARIES_G5_T1_BOOK_END,
  EGYPT_LIBRARIES_G5_T1_BOOK_START,
  EGYPT_LIBRARIES_G5_T1_UNITS,
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
} from "../../src/db/egyptLibrariesG5T1.js";
import {
  EGYPT_FAMILY_G5_T1_BACK_MATTER,
  EGYPT_FAMILY_G5_T1_BOOK_END,
  EGYPT_FAMILY_G5_T1_BOOK_START,
  EGYPT_FAMILY_G5_T1_MISSING_PRINT_PAGES,
  EGYPT_FAMILY_G5_T1_UNITS,
  allLessonRanges as familyLessonRanges,
  assertTreeMatchesTheBook as assertFamilyMatchesBook,
  bookToPdfPage as familyBookToPdfPage,
  isConsistent as isFamilyConsistent,
  lessonBookRange as familyLessonRange,
  lessonDocument as familyLessonDocument,
  loadBookPage as loadFamilyPage,
  pdfPageToBookPage as familyPdfToBookPage,
  printedFooter as familyPrintedFooter,
} from "../../src/db/egyptFamilyG5T1.js";
import { stageForLesson } from "../../src/modules/curriculum/bookStage.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, concepts, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 152 — the three Grade-5 «مهارات» books the MoE teaches alongside the
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
 *  - the family book's piecewise page model: its printed folios skip 26 (the
 *    blank leaf before the unit-2 opener — no scan), and the stage must report
 *    that page absent instead of showing a neighbouring scan;
 *  - the libraries book's spread model: one scan carries TWO printed pages,
 *    both resolve to the same stage image, and a lesson document stamps each
 *    spread's text exactly once;
 *  - the seeded trees and their RAG scope, with the book's own text in chunks.
 */
/** The same folding the tree's own checks use — OCR prints «ى» for «ي» at word ends. */
function normalize(text: string): string {
  return text
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

describe("PHASE 152 — Egypt Grade-5 «مهارات» official Ministry trees", () => {
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
      { label: "family", result: assertFamilyMatchesBook(), pages: 40 },
      { label: "farming", result: assertFarmingMatchesBook(), pages: 30 },
      { label: "libraries", result: assertLibrariesMatchesBook(), pages: 17 },
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
    expect(loadFarmingPage(7)).toContain("الزراعة في حديقة المدرسة");
    // The chips are the proof: page 5 prints «ه» (٥) and page 7 prints «V» (٧).
    expect(farmingPrintedFooter(5)).toBe(5);
    expect(farmingPrintedFooter(7)).toBe(7);
    expect(farmingPrintedFooter(6)).toBe(6);
    // The book's last page prints no readable folio, so pages 5–34 prove themselves.
    expect(farmingPrintedFooter(EGYPT_FARMING_G5_T1_BOOK_END)).toBeNull();
    expect(farmingPrintedFooter(EGYPT_FARMING_G5_T1_BOOK_END - 1)).toBe(EGYPT_FARMING_G5_T1_BOOK_END - 1);
    expect(familyPrintedFooter(7)).toBe(7);
    expect(familyPrintedFooter(28)).toBe(28);
    expect(familyPrintedFooter(EGYPT_FAMILY_G5_T1_BOOK_END)).toBe(EGYPT_FAMILY_G5_T1_BOOK_END);
    // Unit openers print no folio, so they have no readable footer.
    expect(familyPrintedFooter(5)).toBeNull();
    expect(familyPrintedFooter(27)).toBeNull();
  });

  it("maps the family book piecewise: folio 26 is skipped, and that page has no scan", () => {
    // Before the skip the shift is 0; after it the scan is the folio − 1.
    expect(familyBookToPdfPage(25)).toBe(25);
    expect(familyBookToPdfPage(27)).toBe(26);
    expect(familyBookToPdfPage(47)).toBe(46);
    // The one printed page the PDF never carried resolves past every scan.
    expect(EGYPT_FAMILY_G5_T1_MISSING_PRINT_PAGES).toEqual([26]);
    for (const page of EGYPT_FAMILY_G5_T1_MISSING_PRINT_PAGES) {
      expect(familyBookToPdfPage(page)).toBeGreaterThan(999);
      expect(loadFamilyPage(page)).toBe("");
    }
    // …and the inverse map proves the scans themselves: scan 26 carries the
    // unit-2 opener (labeled 27), scan 27 carries lesson 2-1's title page (28).
    expect(familyPdfToBookPage(26)).toBe(27);
    expect(familyPdfToBookPage(46)).toBe(47);
    expect(normalize(loadFamilyPage(27))).toContain(normalize("بيدي أصنع الفرق"));
    expect(normalize(loadFamilyPage(28))).toContain(normalize("تغذية سليمة"));
    // Back matter lies beyond BOOK_END: المراجع (48) … إرشادات التدريس الدامج (57).
    expect(EGYPT_FAMILY_G5_T1_BOOK_END).toBe(47);
    expect(EGYPT_FAMILY_G5_T1_BACK_MATTER).toEqual({ from: 48, to: 57 });
    expect(loadFamilyPage(48)).toContain("المراجع");
  });

  it("maps the libraries book by spreads: one scan carries two printed pages", () => {
    // The cover is its own scan; every page from 2 on shares a spread scan.
    expect(librariesBookToPdfPage(1)).toBe(1);
    expect(librariesBookToPdfPage(5)).toBe(3);
    expect(librariesBookToPdfPage(8)).toBe(5);
    expect(librariesBookToPdfPage(9)).toBe(5);
    expect(librariesBookToPdfPage(40)).toBe(21);
    expect(librariesPdfToBookPages(5)).toEqual({ from: 8, to: 9 });
    expect(librariesPdfToBookPages(21)).toEqual({ from: 40, to: 41 });
    // Both pages of a spread answer with that scan's text — that is the image
    // the student sees, too.
    expect(loadLibrariesPage(8)).toContain("كنز الاخلاق");
    expect(loadLibrariesPage(9)).toContain("كنز الاخلاق");
    // The folios read on scan 5 belong to its two pages, and each page that
    // prints its number proves it.
    expect(librariesFolioCandidates(5)).toEqual([8, 9]);
    expect(librariesPrintedFooter(8)).toBe(8);
    expect(librariesPrintedFooter(9)).toBe(9);
    // The lesson-1 page (5) shares its scan with the فهرس (4), so the only
    // folio on it belongs to page 4 — page 5 itself prints no number.
    expect(librariesPrintedFooter(5)).toBeNull();
    expect(loadLibrariesPage(4)).toContain("الدروس | الموضوع | الصفحة");
    expect(librariesPrintedFooter(EGYPT_LIBRARIES_G5_T1_BOOK_END)).toBe(EGYPT_LIBRARIES_G5_T1_BOOK_END);
  });

  it("tiles each book exactly, end to end", () => {
    const farming = farmingLessonRanges();
    expect(farming.map((r) => [r.from, r.to])).toEqual([
      [5, 11],
      [12, 14],
      [15, 21],
      [22, 25],
      [26, 31],
      [32, 35],
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
      [32, 34],
      [35, 37],
      [38, 40],
    ]);
    const family = familyLessonRanges();
    expect(family.map((r) => [r.from, r.to])).toEqual([
      [5, 13],
      [14, 19],
      [20, 26],
      [27, 35],
      [36, 43],
      [44, 47],
    ]);

    for (const [ranges, start, end] of [
      [farming, EGYPT_FARMING_G5_T1_BOOK_START, EGYPT_FARMING_G5_T1_BOOK_END],
      [libraries, EGYPT_LIBRARIES_G5_T1_BOOK_START, EGYPT_LIBRARIES_G5_T1_BOOK_END],
      [family, EGYPT_FAMILY_G5_T1_BOOK_START, EGYPT_FAMILY_G5_T1_BOOK_END],
    ] as const) {
      expect(ranges[0]!.from).toBe(start);
      expect(ranges[ranges.length - 1]!.to).toBe(end);
      for (let i = 1; i < ranges.length; i++) {
        expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
      }
    }
  });

  it("keeps the family book's un-scanned page owned by its lesson", () => {
    // The blank leaf 26 follows lesson 1-3's last scanned page (25) — no gap.
    const l3 = familyLessonRange(0, 2);
    expect([l3.from, l3.to]).toEqual([20, 26]);
    // The unit-2 opener (27) is inside lesson 2-1's range, like the unit-1
    // opener (5) is inside lesson 1-1's.
    expect(familyLessonRange(1, 0)).toEqual({ from: 27, to: 35 });
    for (const page of EGYPT_FAMILY_G5_T1_MISSING_PRINT_PAGES) {
      const owners = familyLessonRanges().filter((r) => page >= r.from && page <= r.to);
      expect(owners.length, `printed ${page}`).toBe(1);
    }
  });

  it("stages the family book: the un-scanned page reports absent, not a neighbouring scan", () => {
    const stage = stageForLesson("eg-g5-family", "l-g5-fam-1-3");
    expect(stage).not.toBeNull();
    expect(stage!.fromBookPage).toBe(20);
    expect(stage!.toBookPage).toBe(26);
    const missing = stage!.pages.find((p) => p.bookPage === 26)!;
    expect(missing.present).toBe(false);
    expect(missing.pdfPage).toBeGreaterThan(999);
    // The scanned page before it is present, so the absence is the page itself.
    const present = stage!.pages.find((p) => p.bookPage === 25)!;
    expect(present.present).toBe(true);
    // And the shift is real: the unit-2 opener (27) lives on scan 26.
    const shifted = stageForLesson("eg-g5-family", "l-g5-fam-2-1")!.pages[0]!;
    expect(shifted.bookPage).toBe(27);
    expect(shifted.pdfPage).toBe(26);
    expect(shifted.present).toBe(true);
  });

  it("stages the libraries book: both pages of a spread resolve to their scan", () => {
    const stage = stageForLesson("eg-g5-libraries", "l-g5-lib-1-2");
    expect(stage).not.toBeNull();
    expect(stage!.fromBookPage).toBe(8);
    expect(stage!.toBookPage).toBe(10);
    for (const bookPage of [8, 9]) {
      const page = stage!.pages.find((p) => p.bookPage === bookPage)!;
      expect(page.present).toBe(true);
      expect(page.pdfPage).toBe(5);
    }
    const next = stage!.pages.find((p) => p.bookPage === 10)!;
    expect(next.present).toBe(true);
    expect(next.pdfPage).toBe(6);
  });

  it("gives every lesson a document made of the book's own pages", () => {
    const books = [
      {
        units: EGYPT_FARMING_G5_T1_UNITS,
        range: farmingLessonRange,
        doc: farmingLessonDocument,
        load: loadFarmingPage,
        pdf: (book: number) => book + FARMING_OFFSET,
        count: 6,
      },
      {
        units: EGYPT_LIBRARIES_G5_T1_UNITS,
        range: librariesLessonRange,
        doc: librariesLessonDocument,
        load: loadLibrariesPage,
        pdf: librariesBookToPdfPage,
        count: 12,
      },
      {
        units: EGYPT_FAMILY_G5_T1_UNITS,
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
          // Every page of the range that has a scan is stamped — a spread's
          // text under the first of its pages the range owns, so a citation
          // points at a real page and no scan is counted twice.
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
    for (const bookUnits of [EGYPT_FARMING_G5_T1_UNITS, EGYPT_LIBRARIES_G5_T1_UNITS, EGYPT_FAMILY_G5_T1_UNITS]) {
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
    const seeded = await seedCountry(db, knowledge, EGYPT_FAMILY_G5_SPEC);

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
    expect(unitRows[0]!.title).toBe("تحدي وإرادة");
    expect(unitRows[1]!.title).toBe("بيدي أصنع الفرق");

    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g5-fam-1-1", "l-g5-fam-1-2", "l-g5-fam-1-3"],
      ["l-g5-fam-2-1", "l-g5-fam-2-2", "l-g5-fam-2-3"],
    ]);

    // The book restarts ordinals per unit: unit 2 opens with «الدرس الأول».
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g5-fam-2-1")).get())!;
    expect(first.title).toBe("الدرس الأول: تغذية سليمة");
  });

  it("seeds the farming tree: farming subject, 3 units, 6 lessons in term 1", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_FARMING_G5_SPEC);

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
    expect(unitRows.map((u) => u.title)).toEqual(["الزراعة المستدامة", "الصناعات الغذائية", "الألبان"]);

    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g5-farm-1-1", "l-g5-farm-1-2"],
      ["l-g5-farm-2-1", "l-g5-farm-2-2"],
      ["l-g5-farm-3-1", "l-g5-farm-3-2"],
    ]);

    // The farming book numbers its lessons continuously through the term.
    const unit2 = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g5-farm-2-1")).get())!;
    expect(unit2.title).toBe("الدرس الثالث: الشراب المستخلص");
  });

  it("seeds the libraries tree: libraries subject, one container unit, 12 lessons", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_LIBRARIES_G5_SPEC);

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
      Array.from({ length: 12 }, (_, i) => `l-g5-lib-1-${i + 1}`),
    );
    expect(rows[0]!.title).toBe("الدرس الأول: في كتب الحقائق العامة");
    expect(rows[11]!.title).toBe("الدرس الثاني عشر: سفير المكتبة");
  });

  it("grounds a lesson in its own book: chunks carry the book's pages, in their own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_FAMILY_G5_SPEC);

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
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g5-fam-1-1")).get())!;
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(firstText).toContain("معًا نستطيع");
    expect(firstText).toContain("[صفحة الكتاب 6]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
    }

    // A lesson in the LAST unit must be scoped to that unit, not unit-1.
    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g5-fam-2-3")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit2.id);
    }

    // Its concept row carries the book's own printed objectives.
    const firstConcept = (await db.db.select().from(concepts).where(eq(concepts.lessonId, first.id)).get())!;
    expect(firstConcept.title).toBe("يحدد أهمية المهن، وما الذي ستكون عليه في المستقبل.");
  });

  it("grounds the farming and libraries lessons in their own books", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));

    const farming = await seedCountry(db, knowledge, EGYPT_FARMING_G5_SPEC);
    const farmingT1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, farming.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const farmingLast = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g5-farm-3-2")).get())!;
    const farmingChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, farmingLast.id));
    const farmingText = farmingChunks.map((c) => c.content).join("\n");
    expect(farmingText).toContain("[صفحة الكتاب 32]");
    expect(farmingText).toContain("المنتجات اللبنية");
    for (const c of farmingChunks) expect(c.termId).toBe(farmingT1.id);

    const libraries = await seedCountry(db, knowledge, EGYPT_LIBRARIES_G5_SPEC);
    const librariesT1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, libraries.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const libLast = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g5-lib-1-12")).get())!;
    const libChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, libLast.id));
    const libText = libChunks.map((c) => c.content).join("\n");
    expect(libText).toContain("[صفحة الكتاب 38]");
    expect(libText).toContain("سفير المكتبة");
    for (const c of libChunks) expect(c.termId).toBe(librariesT1.id);
  });
});
