import { afterEach, describe, expect, it, vi } from "vitest";
import { applyMigrations, createDb, type Db } from "../../src/db/index.js";
import { users } from "../../src/db/schema.js";
import { AiService } from "../../src/modules/ai/aiService.js";
import { AiCache } from "../../src/modules/ai/cache.js";

/**
 * PHASE 22 (D-026) — AiCache: LRU + TTL + hit/miss counters that power the
 * provider-call reduction (classifier/rerank/embeddings/OCR are determinisic
 * and serve-from-cache; tutor/recap/feedback never are).
 */
describe("AiCache (PHASE 22 — in-memory LRU + stats)", () => {
  it("round-trips values and counts hits/misses", () => {
    const cache = new AiCache<string>({ ttlMs: 60_000 });
    expect(cache.get("k")).toBeNull();
    expect(cache.get("k")).toBeNull();
    expect(cache.stats()).toMatchObject({ hits: 0, misses: 2, size: 0 });
    cache.set("k", "v");
    expect(cache.get("k")).toBe("v");
    expect(cache.get("k")).toBe("v");
    expect(cache.stats()).toMatchObject({ hits: 2, misses: 2, size: 1 });
  });

  it("expires entries after TTL (miss + row removed)", () => {
    vi.useFakeTimers();
    try {
      const cache = new AiCache<string>({ ttlMs: 1000 });
      cache.set("k", "v");
      vi.advanceTimersByTime(1001);
      expect(cache.get("k")).toBeNull();
      expect(cache.stats().size).toBe(0);
      expect(cache.stats().misses).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("honors the per-set TTL override", () => {
    vi.useFakeTimers();
    try {
      const cache = new AiCache<string>({ ttlMs: 60_000 });
      cache.set("k", "v", 100);
      vi.advanceTimersByTime(101);
      expect(cache.get("k")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("evicts the oldest entry when full (LRU)", () => {
    const cache = new AiCache<string>({ maxEntries: 2 });
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");
    expect(cache.get("a")).toBeNull();
    expect(cache.get("b")).toBe("2");
    expect(cache.get("c")).toBe("3");
    expect(cache.stats().size).toBe(2);
  });

  it("key() is content-addressed and clear() drops all rows", () => {
    const cache = new AiCache<string>();
    const k1 = cache.key("classifier", "m", [{ role: "user", content: "ما هو الجمع" }]);
    const k2 = cache.key("classifier", "m", [{ role: "user", content: "ما هو الجمع" }]);
    const k3 = cache.key("classifier", "m", [{ role: "user", content: "ما هو الطرح" }]);
    expect(k1).toBe(k2);
    expect(k1).not.toBe(k3);
    cache.set(k1, "v");
    cache.clear();
    expect(cache.get(k1)).toBeNull();
  });
});

/** PHASE 22 — behavior through the real AiService facade (mock providers). */
const dbs: Db[] = [];
function makeAi(opts?: { cacheEnabled?: boolean }): { ai: AiService; userId: string } {
  const db = createDb();
  applyMigrations(db);
  dbs.push(db);
  const ai = new AiService(db, { forceProvider: "mock", cacheEnabled: opts?.cacheEnabled });
  const userId = `usr_cache_${dbs.length}`;
  const now = new Date();
  db.db
    .insert(users)
    .values({ id: userId, email: `${userId}@test.local`, passwordHash: "h", role: "student", status: "active", createdAt: now, updatedAt: now })
    .run();
  return { ai, userId };
}

afterEach(() => {
  for (const db of dbs) db.sqlite.close();
  dbs.length = 0;
});

describe("AI caching through AiService (PHASE 22 — deterministic calls skip the provider)", () => {
  it("classifier: identical request is served from cache (one usage row, one miss + one hit)", async () => {
    const { ai, userId } = makeAi();
    const messages = [
      { role: "system" as const, content: "صنّف نية الطالب" },
      { role: "user" as const, content: "اشرح الجمع" },
    ];
    const a = await ai.complete({ operation: "classifier", messages, contextUserId: userId });
    const b = await ai.complete({ operation: "classifier", messages, contextUserId: userId });
    expect(b.content).toBe(a.content);
    expect(await ai.usage.totalUsageForUser(userId)).toMatchObject({ calls: 1 });
    expect(ai.cacheStats()).toMatchObject({ hits: 1, misses: 1 });
  });

  it("rerank (new deterministic LLM operation) is cached too", async () => {
    const { ai, userId } = makeAi();
    const messages = [
      { role: "system" as const, content: "أعد ترتيب المقاطع" },
      { role: "user" as const, content: "[1] أ [2] ب" },
    ];
    const a = await ai.complete({ operation: "rerank", messages, temperature: 0, json: true, contextUserId: userId });
    const b = await ai.complete({ operation: "rerank", messages, temperature: 0, json: true, contextUserId: userId });
    expect(b.content).toBe(a.content);
    expect(await ai.usage.totalUsageForUser(userId)).toMatchObject({ calls: 1 });
  });

  it("tutor is NEVER cached (dynamic per student) — every call records usage", async () => {
    const { ai, userId } = makeAi();
    const messages = [{ role: "user" as const, content: "سؤال اليوم" }];
    await ai.complete({ operation: "tutor", messages, contextUserId: userId });
    await ai.complete({ operation: "tutor", messages, contextUserId: userId });
    expect(await ai.usage.totalUsageForUser(userId)).toMatchObject({ calls: 2 });
    expect(ai.cacheStats().hits).toBe(0);
  });

  it("embeddings: identical texts hit the provider once (second call from cache)", async () => {
    const { ai } = makeAi();
    const one = await ai.embed({ texts: ["ما هو الجمع"] });
    const two = await ai.embed({ texts: ["ما هو الجمع"] });
    expect(two.vectors[0]).toEqual(one.vectors[0]);
    expect(ai.cacheStats()).toMatchObject({ hits: 1, misses: 1 });
  });

  it("ocr: identical bytes hit the provider once", async () => {
    const { ai, userId } = makeAi();
    const request = { mimeType: "application/pdf", base64: "aGVsbG8=" };
    const a = await ai.ocr({ ...request, contextUserId: userId });
    const b = await ai.ocr({ ...request, contextUserId: userId });
    expect(b.text).toBe(a.text);
    expect(await ai.usage.totalUsageForUser(userId)).toMatchObject({ calls: 1 });
    expect(ai.cacheStats()).toMatchObject({ hits: 1, misses: 1 });
  });

  it("cacheEnabled=false disables caching entirely (usage on every call)", async () => {
    const { ai, userId } = makeAi({ cacheEnabled: false });
    const messages = [
      { role: "system" as const, content: "صنّف نية الطالب" },
      { role: "user" as const, content: "اشرح الجمع" },
    ];
    await ai.complete({ operation: "classifier", messages, contextUserId: userId });
    await ai.complete({ operation: "classifier", messages, contextUserId: userId });
    expect(await ai.usage.totalUsageForUser(userId)).toMatchObject({ calls: 2 });
    expect(ai.cacheStats()).toMatchObject({ hits: 0, misses: 0 });
  });
});