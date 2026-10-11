// PHASE 97 — collapse runaway dot runs in OCR page text.
//
// The vision model occasionally answers a fill-in line («........») by emitting
// tens of thousands of dots: a single page of the theatre book came back with a
// 122k-character line. Genuine worksheet blanks are well under MIN_KEEP
// characters, so only those hallucinations are touched; the page's real text is
// left byte-for-byte intact.
//
// Usage: node server/scripts/clean-ocr-dots.mjs <ocr-dir> [minKeep]
//   <ocr-dir>  path relative to the repo root or absolute (e.g.
//              server/data/curriculum-ocr/theater-p1-t1)
//   [minKeep]  shortest dot run to collapse (default 200)
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("usage: node server/scripts/clean-ocr-dots.mjs <ocr-dir> [minKeep]");
  process.exit(1);
}
const minKeep = Number(process.argv[3] ?? 200);
const abs = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
const re = new RegExp(`\\.{${minKeep},}`, "g");

let changed = 0;
for (const name of readdirSync(abs).filter((n) => /^pages-\d+\.txt$/.test(n)).sort()) {
  const p = path.join(abs, name);
  const before = readFileSync(p, "utf8");
  const after = before.replace(re, "…");
  if (after !== before) {
    writeFileSync(p, after, "utf8");
    changed += 1;
    console.log(`cleaned ${name}: ${before.length} -> ${after.length} chars`);
  }
}
console.log(`done: ${changed} files cleaned in ${dir} (minKeep=${minKeep})`);
