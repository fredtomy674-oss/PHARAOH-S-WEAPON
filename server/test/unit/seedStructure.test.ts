import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { EGYPT_SPEC, seedCountry } from "../../src/db/seed.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { KnowledgeService } from "../../src/modules/knowledge/service.js";
import { SqliteVectorStore } from "../../src/modules/rag/vectorStore.js";
import { chunks, concepts, lessons, questions, terms, units } from "../../src/db/schema.js";

/**
 * PHASE 43 — the seed stopped being a 3-lesson teaser: Egypt Grade-6 Math is a
 * real tree (2 terms → 4+1 units → 16 lessons) with real per-lesson RAG scope.
 * These tests pin the tree shape, the lesson-scoped concept codes, the chunk
 * scope fix (every chunk is stamped with its lesson's ACTUAL term/unit), and
 * the convergence rule (re-seeding a DB is a no-op that still repairs codes).
 * All DBs are `:memory:` (NODE_ENV=test) and providers are pinned to mock, so
 * the suite stays hermetic.
 */
describe("PHASE 43 — Egypt Grade-6 Math seed tree", () => {
  const setup = () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const knowledge = new KnowledgeService(db, ai, new SqliteVectorStore(db));
    return { db, knowledge };
  };

  it("seeds the full curriculum tree: 2 terms, 4+1 units, 16 lessons, E2E anchor first", async () => {
    const { db, knowledge } = setup();
    const seeded = await seedCountry(db, knowledge, EGYPT_SPEC);

    const termRows = await db.db.select().from(terms).where(eq(terms.curriculumId, seeded.curriculumId)).orderBy(terms.sortOrder);
    expect(termRows.map((t) => t.code)).toEqual(["term-1", "term-2"]);

    const t1 = termRows[0]!;
    const t2 = termRows[1]!;
    // The seeded scope map must point at the REAL row for each lesson.
    expect(seeded.lessons["l-add-sub"]!.termId).toBe(t1.id);
    expect(seeded.lessons["l-rational"]!.termId).toBe(t2.id);

    const t1Units = await db.db.select().from(units).where(eq(units.termId, t1.id)).orderBy(units.sortOrder);
    const t2Units = await db.db.select().from(units).where(eq(units.termId, t2.id)).orderBy(units.sortOrder);
    expect(t1Units.map((u) => u.code)).toEqual(["unit-1", "unit-2", "unit-3", "unit-4"]);
    expect(t2Units.map((u) => u.code)).toEqual(["unit-1"]);

    const sizes: number[] = [];
    for (const unit of [...t1Units, ...t2Units]) {
      const lessonRows = await db.db.select().from(lessons).where(eq(lessons.unitId, unit.id)).orderBy(lessons.sortOrder);
      sizes.push(lessonRows.length);
    }
    expect(sizes).toEqual([5, 3, 3, 2, 3]);

    const first = await db.db.select().from(lessons).where(eq(lessons.unitId, t1Units[0]!.id)).orderBy(lessons.sortOrder);
    expect(first[0]!.code).toBe("l-add-sub");
    expect(first[0]!.title).toBe("الجمع والطرح على الأعداد الطبيعية");
  });

  it("orders concepts with lesson-scoped codes c-<lesson>-<n>", async () => {
    const { db, knowledge } = setup();
    await seedCountry(db, knowledge, EGYPT_SPEC);

    const l = (await db.db.select().from(lessons).where(eq(lessons.code, "l-primes")).get())!;
    const cs = await db.db.select().from(concepts).where(eq(concepts.lessonId, l.id)).orderBy(concepts.code);
    expect(cs.map((c) => c.code)).toEqual(["c-l-primes-1", "c-l-primes-2"]);
    expect(cs.map((c) => c.title)).toEqual(["الأعداد الأولية", "تحليل العدد إلى عوامله"]);
  });

  it("stamps every chunk with its lesson's REAL term/unit, never the first unit (scope fix)", async () => {
    const { db, knowledge } = setup();
    const seeded = await seedCountry(db, knowledge, EGYPT_SPEC);

    const t1 = (await db.db.select().from(terms).where(eq(terms.code, "term-1")).get())!;
    const unit2 = (await db.db.select().from(units).where(and(eq(units.termId, t1.id), eq(units.code, "unit-2"))).get())!;
    const unit1 = (await db.db.select().from(units).where(and(eq(units.termId, t1.id), eq(units.code, "unit-1"))).get())!;
    // l-ratio lives under term-1/unit-2 — the pre-fix seeder claimed unit-1 for everything.
    expect(seeded.lessons["l-ratio"]!.termId).toBe(t1.id);
    expect(seeded.lessons["l-ratio"]!.unitId).toBe(unit2.id);
    expect(seeded.lessons["l-ratio"]!.unitId).not.toBe(unit1.id);

    const lRatio = (await db.db.select().from(lessons).where(eq(lessons.code, "l-ratio")).get())!;
    const ratioChunks = await db.db.select().from(chunks).where(eq(chunks.lessonId, lRatio.id));
    expect(ratioChunks.length).toBeGreaterThan(0);
    for (const c of ratioChunks) {
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
    expect(first.lessons).toBe(16);
    expect(first.concepts).toBe(35);
    expect(first.questions).toBe(16); // 12 MCQs + 4 open

    // Simulate a stale/legacy concept code (the old seeder used c-<n>-<n>),
    // then re-seed: nothing may duplicate and the code must be repaired.
    const lGcd = (await db.db.select().from(lessons).where(eq(lessons.code, "l-gcd-lcm")).get())!;
    const mcm = (await db.db.select().from(concepts).where(and(eq(concepts.lessonId, lGcd.id), eq(concepts.title, "المضاعف المشترك الأصغر"))).get())!;
    await db.db.update(concepts).set({ code: "c-stale-9" }).where(eq(concepts.id, mcm.id));

    await seedCountry(db, knowledge, EGYPT_SPEC);
    expect(await countAll()).toEqual(first);

    const repaired = (await db.db.select().from(concepts).where(eq(concepts.id, mcm.id)).get())!;
    expect(repaired.code).toBe("c-l-gcd-lcm-2");
  });
});