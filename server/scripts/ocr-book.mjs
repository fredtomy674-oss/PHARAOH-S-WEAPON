// PHASE 47 pipeline, stage 1: OCR every content page of the official Grade-6
// Arabic math T1 book (Math_Primary6_T1.pdf) into committed text files so the
// curriculum seeder can ground lesson documents in «كتاب الوزارة» exactly.
//
// Pages 9..121 are scanned lesson/unit pages (1..8 = covers, TOC, letter to
// parents; 122 = back cover). Output: server/data/curriculum-ocr/pages-NNN.txt
// (UTF-8, one file per page). Resumable: existing non-empty files are skipped.
import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GeminiOcrProvider } from "../src/modules/ai/providers/gemini.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.join(HERE, "..", "data", "curriculum-ocr");
const JPG_DIR = path.join(HERE, ".curriculum-pages");

const from = Number(process.env.FROM ?? 9);
const to = Number(process.env.TO ?? 121);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(PAGES_DIR, { recursive: true });
const provider = new GeminiOcrProvider();

const failed = [];
let ok = 0;
let skipped = 0;
for (let p = from; p <= to; p++) {
  const pad = String(p).padStart(3, "0");
  const outFile = path.join(PAGES_DIR, `pages-${pad}.txt`);
  if (existsSync(outFile) && readFileSync(outFile, "utf8").trim().length > 0) {
    skipped++;
    continue;
  }
  const jpg = path.join(JPG_DIR, `pages-${pad}.jpg`);
  const base64 = readFileSync(jpg).toString("base64");
  let lastErr = "";
  let done = false;
  for (let attempt = 1; attempt <= 4 && !done; attempt++) {
    try {
      const t0 = Date.now();
      const res = await provider.ocr({
        mimeType: "image/jpeg",
        base64,
        fileName: `pages-${pad}.jpg`,
      });
      writeFileSync(outFile, res.text.trim(), "utf8");
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`page ${p}: OK ${secs}s chars=${res.text.length}`);
      done = true;
      ok++;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      console.log(`page ${p}: attempt ${attempt} failed (${lastErr.slice(0, 120)})`);
      if (attempt < 4) await sleep(2000 * attempt);
    }
  }
  if (!done) {
    failed.push(p);
    console.error(`page ${p}: GAVE UP after 4 attempts — ${lastErr.slice(0, 200)}`);
  }
}
console.log(`\nOCR batch done: ok=${ok} skipped=${skipped} failed=[${failed.join(",")}]`);
if (failed.length) process.exitCode = 1;