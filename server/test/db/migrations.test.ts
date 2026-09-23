import { describe, expect, it } from "vitest";
import { applyMigrations, createDb } from "../../src/db/index.js";
import { users } from "../../src/db/schema.js";

describe("migrations (in-memory)", () => {
  it("applies the migration set cleanly", () => {
    const db = createDb();
    applyMigrations(db);
    const rows = db.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;
    const names = rows.map((r) => r.name);
    for (const table of ["users", "sessions", "students", "chunks", "rag_vectors", "messages", "learning_sessions", "audit_logs", "ai_usage_logs", "student_memories", "student_progress", "countries", "curricula", "lessons", "concepts"]) {
      expect(names).toContain(table);
    }
    db.sqlite.close();
  });

  it("enforces the unique email constraint", () => {
    const db = createDb();
    applyMigrations(db);
    const now = new Date();
    const insert = () =>
      db.db
        .insert(users)
        .values({ id: "u1", email: "same@example.com", passwordHash: "h", role: "student", status: "active", createdAt: now, updatedAt: now })
        .run();
    insert();
    expect(() => insert()).toThrow();
    db.sqlite.close();
  });

  it("sets foreign_keys ON", () => {
    const db = createDb();
    applyMigrations(db);
    const row = db.sqlite.pragma("foreign_keys", { simple: true });
    expect(row).toBeTruthy();
    db.sqlite.close();
  });

  it("applies the Path B migration: raw-file `data` column + lesson-scoped content dedup index", () => {
    const db = createDb();
    applyMigrations(db);
    const cols = (db.sqlite.prepare("PRAGMA table_info(document_versions)").all() as Array<{ name: string }>).map((c) => c.name);
    expect(cols).toContain("data");
    const indexes = (db.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='chunks'").all() as Array<{ name: string }>).map((r) => r.name);
    expect(indexes).toContain("chunks_content_hash_lesson_unique");
    expect(indexes).not.toContain("chunks_content_hash_unique");
    db.sqlite.close();
  });
});