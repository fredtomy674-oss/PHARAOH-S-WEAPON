// One command per Ministry book: render → OCR (parallel) → tree manifest.
//
// Collapses the three-stage import into a single invocation so the next book
// (T2 of any subject, or a re-import) needs one line, not three. Each stage is
// resumable on its own, so re-running only pays for what is missing.
//
// Usage (run from server/ so `.env` — and GEMINI_API_KEY — is found):
//   SUBJECT=science TERM=t2 PDF_PATH="../Downloads/Science_Primary6_T2.pdf" \
//     npx tsx scripts/import-book.mjs
//
// Optional env:
//   BASE_DIR=<scratch>   default scripts/.import-<subject>-<term>
//   OCR_OUT=<dir>        default data/curriculum-ocr/<subject>-<term>  (committed text)
//   TARGET_WIDTH=1600    CONCURRENCY=4    SKIP_RENDER=1    SKIP_OCR=1
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.resolve(HERE, "..");

const SUBJECT = process.env.SUBJECT;
const TERM = process.env.TERM;
const PDF_PATH = process.env.PDF_PATH;
if (!SUBJECT || !TERM || !PDF_PATH) throw new Error("set SUBJECT, TERM and PDF_PATH");
const pdfAbs = path.resolve(PDF_PATH);
if (!existsSync(pdfAbs)) throw new Error(`PDF not found: ${pdfAbs}`);

const CONCURRENCY = process.env.CONCURRENCY ?? "4";
const TARGET_WIDTH = process.env.TARGET_WIDTH ?? "1600";
const BASE = process.env.BASE_DIR ?? path.join(HERE, `.import-${SUBJECT}-${TERM}`);
const PAGES = path.join(BASE, "pages");
const OCR = process.env.OCR_OUT ?? path.join(SERVER, "data", "curriculum-ocr", `${SUBJECT}-${TERM}`);
const MANIFEST = path.join(BASE, "manifest.json");
mkdirSync(BASE, { recursive: true });

const run = (label, command, env, opts) => {
  console.log(`\n=== ${label} ===`);
  const r = spawnSync(command, { cwd: SERVER, stdio: "inherit", shell: true, env: { ...process.env, ...env } });
  if (r.status !== 0) {
    // OCR is resumable and a failed page is data we can re-fetch later, so a
    // non-zero OCR exit must not discard the render or the manifest. Render is
    // different: without images there is nothing to OCR.
    if (opts?.fatal === false) {
      console.warn(`\n[${label}] exited ${r.status} — continuing (re-runnable).`);
      return r.status;
    }
    throw new Error(`${label} failed (exit ${r.status})`);
  }
  return r.status;
};

if (process.env.SKIP_RENDER !== "1") {
  run("render", "npx tsx scripts/render-book.mjs", {
    PDF_PATH: pdfAbs, OUT_DIR: PAGES, CONCURRENCY, TARGET_WIDTH,
  });
}
if (process.env.SKIP_OCR !== "1") {
  run(
    "ocr",
    "npx tsx scripts/ocr-all.mjs",
    { PAGES_DIR: PAGES, OUT_DIR: OCR, FROM: "1", TO: "9999", CONCURRENCY, MISSING_OUT: MANIFEST.replace(/manifest\.json$/, "missing.json") },
    { fatal: false },
  );
}
run("manifest", "node scripts/book-manifest.mjs", { OCR_DIR: OCR, SUBJECT, TERM, OUT: MANIFEST });

console.log(`\nDone.\n  OCR text  → ${OCR}\n  Manifest  → ${MANIFEST}`);
