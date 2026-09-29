// PHASE 47 review aid: print the first tokens of every OCR'd page so we can
// confirm unit/concept boundaries and fill UNIT_OPENERS in egyptT1.ts.
import { readFileSync } from "node:fs";

const DIR = "./data/curriculum-ocr";
for (let p = 9; p <= 121; p++) {
  const pad = String(p).padStart(3, "0");
  let head = "";
  try {
    const text = readFileSync(`${DIR}/pages-${pad}.txt`, "utf8").trim();
    head = text.replace(/\s+/g, " ").slice(0, 90);
  } catch {
    head = "— MISSING —";
  }
  console.log(`pdf ${p} (book ${p - 9}): ${head}`);
}