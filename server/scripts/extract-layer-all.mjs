// Extract every page of a PDF's embedded text layer into OUT_DIR as
// pages-NNN.txt, and report how many pages carry "garbled" runs (fonts whose
// ToUnicode map is missing, seen as control chars or the ¬ symbol followed by
// long uppercase runs).
// Usage: PDF_PATH=<book.pdf> OUT_DIR=<dir> npx tsx scripts/extract-layer-all.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const PDF = process.env.PDF_PATH;
const OUT_DIR = process.env.OUT_DIR;
if (!PDF || !OUT_DIR) throw new Error("set PDF_PATH and OUT_DIR");
mkdirSync(OUT_DIR, { recursive: true });

const pdfjs = await import(pathToFileURL(path.join(ROOT, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs")).href);
pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(path.join(ROOT, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs")).href;
const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(PDF)), useSystemFonts: true }).promise;

let garbled = 0;
const garbledPages = [];
for (let n = 1; n <= doc.numPages; n++) {
  const page = await doc.getPage(n);
  const tc = await page.getTextContent();
  const text = tc.items.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim();
  writeFileSync(path.join(OUT_DIR, `pages-${String(n).padStart(3, "0")}.txt`), text + "\n", "utf8");
  const control = /[\u0000-\u0008\u000b-\u001f]/.test(text);
  const weird = /[\u00ac\u00ae\u00a9\u00a4]/.test(text);
  if (control || weird) {
    garbled++;
    garbledPages.push(n);
  }
}
console.log(`pages=${doc.numPages} garbled-ish=${garbled} :: ${garbledPages.join(",")}`);
