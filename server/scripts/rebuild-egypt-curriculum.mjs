// PHASE 47 ops: rebuild the Egypt Grade-6 Math curriculum subtree from scratch
// so the official «كتاب الوزارة» T1 tree replaces the old hand-written one.
//
// The old eg-g6-math tree (terms/units/lessons/concepts/documents/chunks/
// questions + the demo student's learning sessions & progress under it) is
// demo-seed data: it is deleted wholesale (FK constraints cascade) and then
// `npm run db:seed` recreates it grounded in the official book.
//
// Run:  npx tsx ./scripts/rebuild-egypt-curriculum.mjs   (from server/)
// SAFETY: only touches curriculum code "eg-g6-math"; every other country's
// curriculum (Saudi, Egypt-English) is untouched.
import "dotenv/config";
import { openDbAndMigrate } from "../src/db/index.js";
import { curricula } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

const db = openDbAndMigrate();
const cur = await db.db.select({ id: curricula.id }).from(curricula).where(eq(curricula.code, "eg-g6-math")).get();
if (!cur) {
  console.log("No eg-g6-math curriculum found — nothing to rebuild.");
  db.sqlite.close();
  process.exit(0);
}
const before = db.sqlite.prepare("SELECT COUNT(*) AS n FROM chunks WHERE curriculum_id = ?").get(cur.id).n;
// Single delete: FK cascade handles terms→units→lessons→concepts→progress,
// documents→versions→chunks→vectors, questions, sessions, enrollments.
db.db.delete(curricula).where(eq(curricula.id, cur.id)).run();
console.log(`  Deleted eg-g6-math curriculum subtree (had ${before} chunks).`);
console.log("Next: `npm run db:seed` then `npm run db:reembed`.");
db.sqlite.close();