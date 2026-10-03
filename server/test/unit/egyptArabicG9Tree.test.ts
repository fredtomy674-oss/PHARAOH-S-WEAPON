import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_ARABIC_G9_SPEC, seedCountry } from "../../src/db/seed.js";
import {
  BOOK_TO_PDF_OFFSET,
  EGYPT_ARABIC_G9_T1_APPENDIX,
  EGYPT_ARABIC_G9_T1_BOOK_END,
  EGYPT_ARABIC_G9_T1_BOOK_START,
  EGYPT_ARABIC_G9_T1_UNITS,
  allLessonExtras,
  allLessonRanges,
  assertTreeMatchesTheBook,
  isConsistent,
  lessonBookRange,
  lessonDocument,
  loadBookPage,
} from "../../src/db/egyptArabicG9T1.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, concepts, lessons, subjects, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 86 — Egypt Preparatory-3 (Grade 9) Arabic is now the OFFICIAL first-term
 * Ministry textbook (2026/2027 MoE edition): the leading «مراجعة عامة», 3 units,
 * 12 printed «دروس», every printed «مكوّن» of every lesson as the book's فهرس
 * prints it, and each lesson document assembled from the OCR of the very pages the
 * book prints for it (including the listening passage each listening lesson points
 * to in the back matter).
 *
 * These tests pin the two things that can silently hide book content from the
 * tutor: the section/lesson/component table, and its page ranges — measured
 * against the book, not assumed. The same check the seeder refuses to seed without.
 */

/** Folds text for comparison — mirrors the module, so the book's diacritics cannot break it. */
function norm(text: string): string {
  return text
    .replace(/\u0640/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

describe("PHASE 86 — Egypt Grade-9 Arabic official Ministry tree", () => {
  it("has a table whose invariants hold: keys, section bounds, gap-free tiling", () => {
    const { ok, problems } = isConsistent();
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
  });

  it("matches the book: running feet, section/lesson/component pages and full coverage", () => {
    const result = assertTreeMatchesTheBook();
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
    // Nearly every content page prints its own number on the running foot.
    expect(result.pagesChecked).toBeGreaterThan(110);
  });

  it("reads the Arabic book at its own page offset", () => {
    expect(BOOK_TO_PDF_OFFSET).toBe(1);
    // Book page 7 is the «مراجعة عامة» opener; book page 14 is unit 1's opener.
    expect(norm(loadBookPage(7))).toContain(norm("مراجعة عامة"));
    expect(norm(loadBookPage(14))).toContain(norm("الوحدة الأولى"));
    // Book page 15 is the first listening lesson's opener.
    expect(norm(loadBookPage(15))).toContain(norm("استماع"));
    expect(norm(loadBookPage(15))).toContain(norm("آداب التعامل مع الوالدين"));
  });

  it("tiles the book exactly: review + 3 units over printed pages 7–147", () => {
    expect([EGYPT_ARABIC_G9_T1_BOOK_START, EGYPT_ARABIC_G9_T1_BOOK_END]).toEqual([7, 147]);
    expect(EGYPT_ARABIC_G9_T1_UNITS.map((u) => [u.kind, u.bookFrom, u.bookTo])).toEqual([
      ["review", 7, 13],
      ["unit", 14, 58],
      ["unit", 59, 104],
      ["unit", 105, 147],
    ]);
    const ranges = allLessonRanges();
    expect(ranges.length).toBe(13);
    expect(ranges[0]!.from).toBe(7);
    expect(ranges[ranges.length - 1]!.to).toBe(147);
    // Contiguous: every lesson owns the page after the previous one ended.
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.from).toBe(ranges[i - 1]!.to + 1);
    }
    // The book-wide listening appendix sits outside the tiled sections.
    expect(EGYPT_ARABIC_G9_T1_APPENDIX).toEqual({ from: 148, to: 156 });
    expect(ranges.some((r) => r.from <= 148 && r.to >= 148)).toBe(false);
  });

  it("keeps a unit's opener and assessment inside the unit (the regression)", () => {
    const ranges = allLessonRanges();
    // Unit 1's opener is book page 14; lesson 1-1 teaches on 15–19.
    const first = ranges.find((r) => r.key === "1-1")!;
    expect([first.from, first.to]).toEqual([14, 19]);
    expect(norm(loadBookPage(14))).toContain(norm("الوحدة الأولى"));
    expect(lessonDocument(1, 0)).toContain("[صفحة الكتاب 14]");
    // Raw OCR keeps the book's diacritics, so compare folded text.
    expect(norm(lessonDocument(1, 0))).toContain(norm("الوحدة الأولى"));
    // The unit assessment rides with the unit's LAST lesson.
    const last1 = ranges.find((r) => r.key === "1-4")!;
    expect([last1.from, last1.to]).toEqual([49, 58]);
    expect(norm(loadBookPage(54))).toContain(norm("تقييم على الوحدة الأولى"));
    expect(lessonDocument(1, 3)).toContain("[صفحة الكتاب 54]");
    // And the next unit's opener belongs to the next unit, not to lesson 1-4.
    expect(ranges.find((r) => r.key === "2-1")!.from).toBe(59);
    expect(lessonDocument(1, 3)).not.toContain("[صفحة الكتاب 59]");
  });

  it("gives every lesson a document made of the book's own pages", () => {
    let counted = 0;
    EGYPT_ARABIC_G9_T1_UNITS.forEach((unit, ui) => {
      unit.lessons.forEach((lesson, li) => {
        const { from, to } = lessonBookRange(ui, li);
        const doc = lessonDocument(ui, li);
        expect(doc.length).toBeGreaterThan(0);
        for (let book = from; book <= to; book++) {
          expect(doc).toContain(`[صفحة الكتاب ${book}]`);
        }
        const nextStart = unit.lessons[li + 1]?.concepts[0]?.bookFrom;
        if (nextStart) expect(doc).not.toContain(`[صفحة الكتاب ${nextStart}]`);
        for (const page of lesson.extraBookPages ?? []) {
          expect(doc).toContain(`[صفحة الكتاب ${page}]`);
        }
        counted++;
      });
    });
    expect(counted).toBe(13);
    // The reading lesson's document really carries the book's reading + grammar.
    const reading = lessonDocument(1, 1);
    expect(reading).toContain("[صفحة الكتاب 20]");
    expect(reading).toContain("[صفحة الكتاب 27]");
    expect(norm(reading)).toContain(norm("القواعد النحوية"));
  });

  it("carries the book's own components on every lesson, as the فهرس prints them", () => {
    // Lesson 1-2 prints one component per «مكوّن»: reading + four language skills.
    const oneTwo = EGYPT_ARABIC_G9_T1_UNITS[1]!.lessons[1]!.concepts.map((c) => `${c.kind}: ${c.title}`);
    expect(oneTwo).toEqual([
      "القراءة: أغلى من الذهب",
      "القواعد النحوية: اسم الفاعل",
      "القواعد الإملائية: الألف اللينة في الأسماء والأفعال والحروف",
      "التحدث: موضوعات وقضايا مرتبطة بموضوع الدرس",
      "الكتابة: كتابة نص إقناعي",
    ]);
    // A listening lesson has exactly one component; a poetry lesson likewise.
    expect(EGYPT_ARABIC_G9_T1_UNITS[1]!.lessons[0]!.concepts.map((c) => c.kind)).toEqual(["الاستماع"]);
    expect(EGYPT_ARABIC_G9_T1_UNITS[3]!.lessons[3]!.concepts.map((c) => c.kind)).toEqual(["النص الشعري"]);
    // The review is its own leading section with its three printed parts.
    expect(EGYPT_ARABIC_G9_T1_UNITS[0]!.kind).toBe("review");
    expect(EGYPT_ARABIC_G9_T1_UNITS[0]!.lessons[0]!.concepts.map((c) => c.title)).toEqual([
      "أولًا: مفاهيم التذوق الجمالي",
      "ثانيًا: القواعد الإملائية",
      "ثالثًا: القواعد النحوية",
    ]);
    // The listening lessons point at the appendix passage the book tells them to.
    const extras = allLessonExtras();
    expect(extras.get("1-1")).toEqual([149, 150]);
    expect(extras.get("2-1")).toEqual([151, 152]);
    expect(extras.get("3-1")).toEqual([153, 154]);
    // The unit assessments' listening texts (back matter 155–156) ride with each
    // unit's last lesson, so the tutor teaching the assessment can show them.
    expect(extras.get("1-4")).toEqual([155]);
    expect(extras.get("2-4")).toEqual([155]);
    expect(extras.get("3-4")).toEqual([156]);
    expect(norm(loadBookPage(149))).toContain(norm("آداب التعامل مع الوالدين"));
    expect(norm(loadBookPage(151))).toContain(norm("ثمرة القراءة"));
  });

  it("seeds the official tree: arabic subject, review + 3 units, 13 lessons in one term", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ARABIC_G9_SPEC);

    expect(seeded.curriculumId).toBeTruthy();
    const subject = (await db.db.select().from(subjects).where(eq(subjects.id, seeded.subjectId)).get())!;
    expect(subject.code).toBe("arabic");
    expect(subject.nameAr).toBe("اللغة العربية");

    const termRows = await db.db.select().from(terms).where(eq(terms.curriculumId, seeded.curriculumId)).orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1"]);
    const t1 = termRows[0]!;

    const unitRows = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    expect(unitRows.length).toBe(4);
    expect(unitRows[0]!.title).toBe("مراجعة عامة");
    expect(unitRows[1]!.title).toBe("الوحدة الأولى: قيم تحمي شبابنا");
    expect(unitRows[3]!.title).toBe("الوحدة الثالثة: أنا والمستقبل");

    // One lesson per printed درس, in the book's own order.
    const lessonsByUnit: string[][] = [];
    for (const unit of unitRows) {
      const rows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      lessonsByUnit.push(rows.map((r) => r.code));
    }
    expect(lessonsByUnit).toEqual([
      ["l-g9-ara-rev-1"],
      ["l-g9-ara-1-1", "l-g9-ara-1-2", "l-g9-ara-1-3", "l-g9-ara-1-4"],
      ["l-g9-ara-2-1", "l-g9-ara-2-2", "l-g9-ara-2-3", "l-g9-ara-2-4"],
      ["l-g9-ara-3-1", "l-g9-ara-3-2", "l-g9-ara-3-3", "l-g9-ara-3-4"],
    ]);

    // The codes must not collide with another seeded curriculum's.
    const allCodes = lessonsByUnit.flat();
    expect(new Set(allCodes).size).toBe(allCodes.length);
    expect(allCodes.every((c) => c.startsWith("l-g9-ara-"))).toBe(true);
  });

  it("grounds a lesson in the book: its chunks carry the book's page text, in its own scope", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    const seeded = await seedCountry(db, knowledge, EGYPT_ARABIC_G9_SPEC);

    const t1 = (await db.db
      .select()
      .from(terms)
      .where(and(eq(terms.curriculumId, seeded.curriculumId), eq(terms.code, "term-1")))
      .get())!;
    const unit3 = (await db.db
      .select()
      .from(units)
      .where(and(eq(units.termId, t1.id), eq(units.code, "unit-4")))
      .get())!;

    // The first lesson: the unit opener, the book's own lesson page, and the
    // appendix listening passage the lesson points to.
    const first = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g9-ara-1-1")).get())!;
    expect(first.title).toBe("الدرس الأول (الاستماع): آداب التعامل مع الوالدين");
    const firstChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, first.id));
    expect(firstChunks.length).toBeGreaterThan(0);
    const firstText = firstChunks.map((c) => c.content).join("\n");
    expect(norm(firstText)).toContain(norm("الوحدة الأولى"));
    expect(firstText).toContain("[صفحة الكتاب 14]");
    expect(firstText).toContain("[صفحة الكتاب 149]");
    expect(firstText).toContain("[صفحة الكتاب 150]");
    for (const c of firstChunks) {
      expect(c.termId).toBe(t1.id);
    }

    // A lesson in the LAST unit must be scoped to that unit, not unit-1.
    const last = (await db.db.select().from(lessons).where(eq(lessons.code, "l-g9-ara-3-4")).get())!;
    const lastChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, last.id));
    expect(lastChunks.length).toBeGreaterThan(0);
    for (const c of lastChunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit3.id);
    }

    // Its concept row carries the book's printed component title.
    const lastConcepts = await db.db.select().from(concepts).where(eq(concepts.lessonId, last.id)).orderBy(concepts.code);
    expect(lastConcepts.map((c) => c.title)).toEqual(["النص الشعري: اصنع بيدك مجدك"]);
  });
});
