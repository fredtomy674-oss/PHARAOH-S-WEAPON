// Extract the embedded text layer of a PDF instead of OCR-ing its pixels.
//
// WHY: many Ministry books are born-digital (typeset, not scanned). Their PDFs
// already carry an exact text layer, so OCR is wasted work: a network call per
// page, with recognition errors. Extracting the layer is instant, offline and
// 100% faithful to the page — strictly better than OCR for those books.
//
// WHEN NOT TO USE IT: Arabic books made in Word/InDesign often store glyphs in
// visual order, so the extracted string comes out scrambled ("احل" for "الح")
// with stray field markers. Those books must still go through vision OCR.
//
// Usage:
//   PDF_PATH=<book.pdf> OUT_DIR=<text> [FROM=1] [TO=n] [JOIN=space|none]
//   node server/scripts/extract-text.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const PDF_PATH = process.env.PDF_PATH;
const OUT_DIR = process.env.OUT_DIR;
if (!PDF_PATH || !OUT_DIR) {
  console.error("usage: PDF_PATH=<pdf> OUT_DIR=<dir> [FROM=1] [TO=n] node extract-text.mjs");
  process.exit(1);
}
const JOIN = process.env.JOIN ?? "space";
const pdfjs = await import("file:///C:/سلاح الفرعون/node_modules/pdfjs-dist/legacy/build/pdf.mjs");

const from = Number(process.env.FROM ?? 1);
const data = new Uint8Array(readFileSync(PDF_PATH));
const doc = await pdfjs.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;
const to = Number(process.env.TO ?? 0) || doc.numPages;
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

function pageText(items) {
  const sep = JOIN === "none" ? "" : " ";
  let raw = "";
  for (const it of items) {
    raw += it.str;
    if (it.hasEOL) raw += "\n";
    else if (sep) raw += sep;
  }
  return raw
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

let written = 0, empty = 0;
for (let p = from; p <= to && p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const tc = await page.getTextContent();
  const text = pageText(tc.items);
  writeFileSync(path.join(OUT_DIR, `pages-${String(p).padStart(3, "0")}.txt`), text, "utf8");
  if (text.length > 20) written++; else empty++;
}
console.log(`extracted ${to - from + 1} pages (${written} with text, ${empty} textless), join=${JOIN} -> ${OUT_DIR}`);
await doc.destroy();
