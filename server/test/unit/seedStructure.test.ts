import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_SPEC, seedCountry } from "../../src/db/seed.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, concepts, lessons, questions, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 47 — the Egypt Grade-6 Math curriculum is now the OFFICIAL first-term
 * Ministry textbook («كتاب الوزارة», Math Techbook™ 2026): term-1 = its 7 units
 * and 10 printed concepts (one app lesson per مفهوم), and every lesson document
 * is assembled from the OCR text of the book's own pages (server/data/
 * curriculum-ocr/), so the tutor's RAG grounding is the book, verbatim. Term-2
 * stays a hand-written placeholder until its book is imported.
 * These tests pin the official tree shape, the lesson-scoped concept codes, the
 * chunk scope fix (every chunk is stamped with its lesson's ACTUAL term/unit),
 * the convergence rule (re-seeding a DB is a no-op that still repairs codes),
 * and that lesson-1's chunks really contain the book's page-1 text.
 * All DBs are `:memory:` (NODE_ENV=test) and providers are pinned to mock, so
 * the suite stays hermetic.
 */
describe("PHASE 47 — Egypt Grade-6 Math official Ministry tree", () => {
  const setup = () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    return { db, knowledge };
  };

  it("seeds the official tree: 2 terms, 7+1 units, 13 lessons, E2E anchor first", async () => {
    const { db, knowledge } = setup();
    const seeded = await seedCountry(db, knowledge, EGYPT_SPEC);

    const termRows = await db.db.select().from(terms).where(eq(terms.curriculumId, seeded.curriculumId)).orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1", "term-2"]);

    const t1 = termRows[0]!;
    const t2 = termRows[1]!;
    // The seeded scope map must point at the REAL row for each lesson.
    expect(seeded.lessons["l-con-1-1"]!.termId).toBe(t1.id);
    expect(seeded.lessons["l-rational"]!.termId).toBe(t2.id);

    const t1Units = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    const t2Units = await db.db.select().from(units).where(eq(units.termId, t2.id)).orderBy(units.sortOrder);
    // Term 1 mirrors the book: الوحدة الأولى .. السابعة (7 units).
    expect(t1Units.map((u) => u.code)).toEqual(["unit-1", "unit-2", "unit-3", "unit-4", "unit-5", "unit-6", "unit-7"]);
    expect(t2Units.map((u) => u.code)).toEqual(["unit-1"]);

    const sizes: number[] = [];
    for (const unit of [...t1Units, ...t2Units]) {
      const lessonRows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      sizes.push(lessonRows.length);
    }
    // term-1: concepts per unit = 1 / 3 / 2 / 1 / 1 / 1 / 1; term-2: 3 lessons.
    expect(sizes).toEqual([1, 3, 2, 1, 1, 1, 1, 3]);

    const first = await db.db.select().from(lessons).where(eq(lessons.unitId, t1Units[0]!.id)).orderBy(lessons.sortOrder);
    expect(first[0]!.code).toBe("l-con-1-1");
    expect(first[0]!.title).toBe("المفهوم 1-1: قابلية القسمة والعامل المشترك الأكبر والمضاعف المشترك الأصغر");
  });

  it("grounds lesson 1 in the book: its chunks contain the OCR'd page-1 text", async () => {
    const { db, knowledge } = setup();
    await seedCountry(db, knowledge, EGYPT_SPEC);

    const l = (await db.db.select().from(lessons).where(eq(lessons.code, "l-con-1-1")).get())!;
    const lessonChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, l.id));
    expect(lessonChunks.length).toBeGreaterThan(0);
    const all = lessonChunks.map((c) => c.content).join("\n");
    // Book page 1 (PDF page 10) is the "استكشف" lesson on divisibility rules.
    expect(all).toContain("استكشف");
    expect(all).toContain("الأعداد الزوجية");
  });

  it("orders concepts with lesson-scoped codes c-<lesson>-<n>", async () => {
    const { db, knowledge } = setup();
    await seedCountry(db, knowledge, EGYPT_SPEC);

    const l = (await db.db.select().from(lessons).where(eq(lessons.code, "l-con-1-1")).get())!;
    const cs = await db.db.select().from(concepts).where(eq(concepts.lessonId, l.id)).orderBy(concepts.code);
    // A lesson's concepts are the printed «أهداف التعلم» bullets of the concept's
    // four lessons (book pages 1, 3, 5 and 8), verbatim.
    expect(cs.map((c) => c.code)).toEqual([
      "c-l-con-1-1-1",
      "c-l-con-1-1-2",
      "c-l-con-1-1-3",
      "c-l-con-1-1-4",
      "c-l-con-1-1-5",
      "c-l-con-1-1-6",
    ]);
    expect(cs.map((c) => c.title)).toEqual([
      "أستطيع أن أستنتج قابلية القسمة على 2 ، 3 ، 4 ، 5 ، 10 ، 6",
      "أستطيع أن أستخدم تحليل العدد إلى عوامل أولية في إيجاد العامل المشترك الأكبر والمضاعف المشترك الأصغر",
      "أستطيع أن أكتب تعبيرات عددية تتضمن عامل مشترك أكبر وأحللها",
      "أستطيع أن أتخيل كيف يمكن لتعبير عددي يمثل عددين كليين في صورة مضاعف مجموع عددين كليين أن يمثل موقفا حياتيا",
      "أستطيع أن أحلل عمليتي جمع الكسور الاعتيادية وطرحها وأوجد ناتج هاتين العمليتين",
      "أستطيع أن أستخدم المضاعف المشترك الأصغر لتكوين مقام مشترك",
    ]);
  });

  it("stamps every chunk with its lesson's REAL term/unit, never the first unit (scope fix)", async () => {
    const { db, knowledge } = setup();
    const seeded = await seedCountry(db, knowledge, EGYPT_SPEC);

    const t1 = (await db.db.select().from(terms).where(eq(terms.code, "term-1")).get())!;
    const unit2 = (await db.db.select().from(units).where(and(eq(units.termId, t1.id), eq(units.code, "unit-2"))).get())!;
    const unit1 = (await db.db.select().from(units).where(and(eq(units.termId, t1.id), eq(units.code, "unit-1"))).get())!;
    // l-con-3-2 (المفهوم 3-2) lives under term-1/unit-2 — the pre-fix seeder claimed unit-1 for everything.
    expect(seeded.lessons["l-con-3-2"]!.termId).toBe(t1.id);
    expect(seeded.lessons["l-con-3-2"]!.unitId).toBe(unit2.id);
    expect(seeded.lessons["l-con-3-2"]!.unitId).not.toBe(unit1.id);

    const lCon32 = (await db.db.select().from(lessons).where(eq(lessons.code, "l-con-3-2")).get())!;
    const con32Chunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, lCon32.id));
    expect(con32Chunks.length).toBeGreaterThan(0);
    for (const c of con32Chunks) {
      expect(c.termId).toBe(t1.id);
      expect(c.unitId).toBe(unit2.id);
    }

    // Every other document chunk must agree with ITS lesson's scope as well.
    for (const [code, scope] of Object.entries(seeded.lessons)) {
      const lesson = (await db.db.select().from(lessons).where(eq(lessons.code, code)).get())!;
      const rows = await db.db.select().from(chunks).where(eq(chunks.lessonId, lesson.id));
      for (const c of rows) {
        expect(c.termId).toBe(scope.termId);
        expect(c.unitId).toBe(scope.unitId);
      }
    }
  });

  it("re-seeding converges: identical counts, stale concept codes repaired", async () => {
    const { db, knowledge } = setup();
    await seedCountry(db, knowledge, EGYPT_SPEC);

    const countAll = async () => ({
      lessons: (await db.db.select().from(lessons)).length,
      concepts: (await db.db.select().from(concepts)).length,
      chunks: (await db.db.select().from(chunks)).length,
      questions: (await db.db.select().from(questions)).length,
    });
    const first = await countAll();
    expect(first.lessons).toBe(13); // 10 official T1 concepts + 3 T2 placeholder
    expect(first.concepts).toBe(53); // 47 printed objectives (T1) + 6 (T2 pairs)
    expect(first.questions).toBe(15); // 11 MCQs + 4 open
    expect(first.chunks).toBeGreaterThan(0);

    // Simulate a stale/legacy concept code, then re-seed: nothing may duplicate
    // and the code must be repaired.
    const lCon11 = (await db.db.select().from(lessons).where(eq(lessons.code, "l-con-1-1")).get())!;
    const concept = (await db.db.select().from(concepts).where(and(eq(concepts.lessonId, lCon11.id), eq(concepts.title, "أستطيع أن أستنتج قابلية القسمة على 2 ، 3 ، 4 ، 5 ، 10 ، 6"))).get())!;
    await db.db.update(concepts).set({ code: "c-stale-9" }).where(eq(concepts.id, concept.id));

    await seedCountry(db, knowledge, EGYPT_SPEC);
    expect(await countAll()).toEqual(first);

    const repaired = (await db.db.select().from(concepts).where(eq(concepts.id, concept.id)).get())!;
    expect(repaired.code).toBe("c-l-con-1-1-1");
  });

  it("prunes a concept the lesson no longer prints, so re-seeding converges", async () => {
    const { db, knowledge } = setup();
    await seedCountry(db, knowledge, EGYPT_SPEC);

    const l = (await db.db.select().from(lessons).where(eq(lessons.code, "l-con-1-1")).get())!;
    const before = await db.db.select().from(concepts).where(eq(concepts.lessonId, l.id));
    expect(before).toHaveLength(6);
    // Simulate a legacy row left over from before the lesson's printed objectives
    // were imported: its title is in no spec.
    await db.db.update(concepts).set({ title: "مفهوم قديم" }).where(eq(concepts.id, before[0]!.id));

    await seedCountry(db, knowledge, EGYPT_SPEC);

    const after = await db.db.select().from(concepts).where(eq(concepts.lessonId, l.id));
    expect(after).toHaveLength(6); // the stale row is gone, the printed one is back
    expect(after.some((c) => c.title === "مفهوم قديم")).toBe(false);
    expect(after.map((c) => c.code)).toContain("c-l-con-1-1-1");
  });
});