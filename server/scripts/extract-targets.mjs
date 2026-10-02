// Pull the printed "Learning Target" lines of each lesson in an OCR book.
// Usage: node scripts/extract-targets.mjs <ocrDir> <offset> <bookPage,...>
import { readFileSync } from "node:fs";
import path from "node:path";

const [dir, offsetArg, pagesArg] = process.argv.slice(2);
const offset = Number(offsetArg);
const books = pagesArg.split(",").map((s) => Number(s.trim()));

for (const book of books) {
  const pdf = book + offset;
  const file = path.join(dir, `pages-${String(pdf).padStart(3, "0")}.txt`);
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch {
    console.log(`\n### book ${book} (pdf ${pdf}) <missing>`);
    continue;
  }
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const start = lines.findIndex((l) => /^Learning Target/i.test(l));
  if (start === -1) {
    console.log(`\n### book ${book} (pdf ${pdf}) — no Learning Target`);
    continue;
  }
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^Classroom Practices/i.test(l)) break;
    if (l) out.push(l);
  }
  console.log(`\n### book ${book} (pdf ${pdf})\n${out.join("\n")}`);
}
