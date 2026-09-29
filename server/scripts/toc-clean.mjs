// Normalize TOC OCR output: strip dotted leader rows, keep structure lines.
import { readFileSync, writeFileSync } from "node:fs";

for (const p of [5, 6]) {
  const t = readFileSync(`./scripts/.curriculum-pages/ocr-p${p}.txt`, "utf8");
  const out = [];
  for (const raw of t.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    // Collapse dotted/dash leader runs into a single space, then squeeze.
    let clean = line.replace(/(?:[.۔ـ•·]+│)+/g, " ").replace(/[.۔•·]{2,}/g, " ").replace(/\s+/g, " ").trim();
    // A trailing standalone number is the page reference — keep it glued.
    out.push(clean);
  }
  writeFileSync(`./scripts/.curriculum-pages/toc-p${p}.txt`, out.join("\n"));
  console.log(`-- ocr-p${p}: ${out.length} non-empty lines, ${t.length} chars raw`);
  for (const line of out.slice(0, 40)) console.log("   |", line.slice(0, 160));
}