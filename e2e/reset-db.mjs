// Resets the dedicated E2E SQLite database so every Playwright run starts from
// a clean, fully seeded state. Never touches the dev database.
import fs from "node:fs";

const file = process.env.DB_FILE;
if (!file || file === ":memory:") {
  console.error("E2E reset: DB_FILE env is required and must be a file path.");
  process.exit(1);
}

for (const suffix of ["", "-wal", "-shm"]) {
  try {
    fs.rmSync(file + suffix, { force: true });
  } catch {
    // ignore
  }
}
console.log(`E2E test DB reset: ${file}`);