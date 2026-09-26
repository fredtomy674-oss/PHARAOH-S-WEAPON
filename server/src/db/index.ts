import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { config, isTest } from "../config/env.js";
import * as schema from "./schema.js";

export type Db = ReturnType<typeof createDb>;

function resolveDbFile(): string {
  if (isTest) return ":memory:";
  const file = config.DB_FILE;
  // Ensure the parent directory exists for file-based databases.
  if (file !== ":memory:") {
    const dir = path.dirname(path.resolve(file));
    fs.mkdirSync(dir, { recursive: true });
  }
  return file;
}

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "drizzle",
  "migrations",
);

export function createDb() {
  const file = resolveDbFile();
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  return { sqlite, db };
}

export function applyMigrations(db: Db): void {
  // For in-memory test DBs we run migrations from the on-disk folder too.
  migrate(db.db, { migrationsFolder });

  // PHASE 33 — one-time (idempotent) data backfill: legacy `student_progress`
  // rows predate `last_practice_at`, and their `last_seen_at` was ONLY ever
  // written by practice, so it is a faithful record of the last practice.
  // The achievements engine keeps badges practice-gated through this column.
  db.sqlite.prepare("UPDATE student_progress SET last_practice_at = last_seen_at WHERE last_practice_at IS NULL;").run();
}

/** One-shot: used by index.ts and the seeder. */
export function openDbAndMigrate(): Db {
  const db = createDb();
  applyMigrations(db);
  return db;
}

export type DbInstance = Db;