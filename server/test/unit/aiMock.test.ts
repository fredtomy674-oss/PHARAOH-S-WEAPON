import { describe, expect, it } from "vitest";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { users } from "../../src/db/schema.js";
import { AiService } from "../../src/modules/ai/aiService.js";

describe("mock AI provider (offline default)", () => {
  it("returns a structured tutor JSON reply when json=true", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const res = await ai.complete({
      operation: "tutor",
      messages: [
        { role: "system", content: "أنت معلم عربي. <context>محتوى عن الجمع</context>" },
        { role: "user", content: "اشرح الجمع" },
      ],
      json: true,
    });
    expect(res.model).toBe("mock-tutor");
    const parsed = JSON.parse(res.content) as { content: string; parts: Array<{ type: string }> };
    expect(parsed.content.length).toBeGreaterThan(0);
    expect(Array.isArray(parsed.parts)).toBe(true);
    db.sqlite.close();
  });

  it("produces deterministic embedding vectors with the documented dims", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    const one = await ai.embed({ texts: ["ما هو الجمع"] });
    const two = await ai.embed({ texts: ["ما هو الجمع"] });
    expect(one.dims).toBe(64);
    expect(one.vectors[0]).toEqual(two.vectors[0]);
    expect(ai.providers.embeddings.id).toBe("mock");
    db.sqlite.close();
  });

  it("records usage rows (cost counters, no content) for every call", async () => {
    const db = createDb();
    applyMigrations(db);
    const ai = new AiService(db, { forceProvider: "mock" });
    // A real user row satisfies the FK on ai_usage_logs.user_id.
    const now = new Date();
    db.db
      .insert(users)
      .values({ id: "usr_usage_1", email: "usage@test.local", passwordHash: "h", role: "student", status: "active", createdAt: now, updatedAt: now })
      .run();
    await ai.complete({
      operation: "tutor",
      messages: [{ role: "user", content: "سؤال" }],
      contextUserId: "usr_usage_1",
    });
    const usage = await ai.usage.totalUsageForUser("usr_usage_1");
    expect(usage.calls).toBe(1);
    expect(usage.tokens).toBeGreaterThan(0);
    db.sqlite.close();
  });
});