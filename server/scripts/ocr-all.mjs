// PHASE 59 — OCR every content page of a Ministry book, in parallel.
//
// A chapter is subdivided into concepts (المفهوم) labelled «ن-م». The chapter
// opener gives only the first one, so the tree is incomplete until every concept
// label has been seen. Rather than guessing which pages open a concept, this
// scans the whole book: OCR of every content page, printing only the header line
// that carries a concept label, and writing the full text to disk at the same
// time because the seeder grounds lesson documents in it.
//
// SPEED: the scan is network-bound (one Gemini call per page). A pool of
// CONCURRENCY workers (default 4) keeps that many calls in flight, so a 100-page
// book lands in minutes instead of tens of minutes. The Gemini provider already
// retries transient upstream failures itself; each page adds its own retry loop
// on top, so a blip costs one page, not the run. Resumable: an existing
// non-empty text file is skipped, so a re-run after an interruption only pays
// for the pages still missing.
//
// Usage:
//   PAGES_DIR=<images> OUT_DIR=<text> [FROM=1] [TO=0] [CONCURRENCY=4] [RESUME=0] \
//     npx tsx server/scripts/ocr-all.mjs
import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { GeminiOcrProvider } from "../src/modules/ai/providers/gemini.js";

const PAGES_DIR = process.env.PAGES_DIR;
const OUT_DIR = process.env.OUT_DIR;
if (!PAGES_DIR || !OUT_DIR) throw new Error("set PAGES_DIR (images) and OUT_DIR (text)");
const from = Number(process.env.FROM ?? 1);
const to = Number(process.env.TO ?? 0);
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY ?? 4));
const KEY = process.env.GEMINI_API_KEY;
if (!KEY) throw new Error("GEMINI_API_KEY missing");

mkdirSync(OUT_DIR, { recursive: true });
const provider = new GeminiOcrProvider();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Quota is per-model, so a hard 429 on one model is answered by naming another.
// GEMINI_OCR_MODELS is a comma-separated rotation tried attempt by attempt;
// a single GEMINI_OCR_MODEL still works, and either falls back to the config default.
const MODELS = (process.env.GEMINI_OCR_MODELS ?? process.env.GEMINI_OCR_MODEL ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const modelFor = (attempt) => (MODELS.length ? MODELS[(attempt - 1) % MODELS.length] : undefined);

// A concept label is «<chapter>-<concept>» in Arabic-Indic digits, e.g. ١-٢.
const LABEL = /^([٠-٩0-9]+)\s*[-–—]\s*([٠-٩0-9]+)/;

const found = new Map();
const failed = [];
let done = 0;
let skipped = 0;
let next = from;
let stopped = false;

// A 429 means the model's bucket is empty for *every* worker, so retrying
// immediately just burns more quota. When one worker sees it, all workers wait
// for the bucket to refill before their next call.
let pauseUntil = 0;
const ATTEMPTS = 6;
// A hard 429 on one model can be answered by naming another model (quota is
// per-model), so this stays configurable instead of a magic 20s.
const RATE_LIMIT_PAUSE_MS = Number(process.env.RATE_LIMIT_PAUSE_MS ?? 20000);

function isRateLimit(err) {
  const status = err && typeof err === "object" && err.meta ? err.meta.upstreamStatus : undefined;
  return status === 429 || status === 503;
}

async function waitForBucket() {
  const wait = pauseUntil - Date.now();
  if (wait > 0) await sleep(wait);
}

/** Read the concept head (if any) off a page's OCR text, and remember it. */
function scanConcepts(p, text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    const m = LABEL.exec(lines[i]);
    if (!m) continue;
    const title = (lines[i + 1] ?? "").replace(LABEL, "").trim();
    const key = `${m[1]}-${m[2]}`;
    if (!found.has(key)) found.set(key, { page: p, label: key, title: title.slice(0, 120) });
    break;
  }
}

/** OCR one page. Returns false when the page image is missing (the book ended). */
async function doPage(p) {
  const pad = String(p).padStart(3, "0");
  const outFile = path.join(OUT_DIR, `pages-${pad}.txt`);
  const resuming = process.env.RESUME !== "0" && existsSync(outFile) && readFileSync(outFile, "utf8").trim();
  if (resuming) {
    skipped++;
  } else {
    let b64;
    try {
      b64 = readFileSync(path.join(PAGES_DIR, `pages-${pad}.jpg`)).toString("base64");
    } catch {
      return false;
    }
    let text = "";
    let lastErr = "";
    for (let attempt = 1; attempt <= ATTEMPTS && !text; attempt++) {
      const model = modelFor(attempt);
      if (attempt > 1 && model) console.log(`page ${pad}: attempt ${attempt} using ${model}`);
      await waitForBucket();
      try {
        const t0 = Date.now();
        const res = await provider.ocr({
          mimeType: "image/jpeg",
          base64: b64,
          fileName: `pages-${pad}.jpg`,
          ...(model ? { model } : {}),
        });
        text = res.text.trim();
        if (text) {
          writeFileSync(outFile, text, "utf8");
          console.log(`page ${pad}: OK ${((Date.now() - t0) / 1000).toFixed(1)}s chars=${text.length}`);
        } else {
          console.log(`page ${pad}: empty response, retrying`);
        }
      } catch (err) {
        lastErr = err instanceof Error ? err.message : String(err);
        if (isRateLimit(err)) {
          pauseUntil = Math.max(pauseUntil, Date.now() + RATE_LIMIT_PAUSE_MS);
          console.log(`page ${pad}: attempt ${attempt} rate-limited — pausing pool`);
        } else {
          console.log(`page ${pad}: attempt ${attempt} failed (${lastErr.slice(0, 120)})`);
        }
        if (attempt < ATTEMPTS) await sleep(Math.min(15000, 1000 * 2 ** (attempt - 1)));
      }
    }
    if (!text) {
      failed.push(p);
      console.error(`page ${pad}: GAVE UP — ${lastErr.slice(0, 160)}`);
    } else {
      done++;
    }
  }
  if (existsSync(outFile)) scanConcepts(p, readFileSync(outFile, "utf8"));
  return true;
}

async function worker() {
  while (!stopped) {
    const p = next++;
    if (p > to) return;
    const keepGoing = await doPage(p);
    if (!keepGoing) {
      stopped = true;
      return;
    }
  }
}

const workers = Math.max(1, Math.min(CONCURRENCY, Math.max(0, to - from + 1)));
console.log(`OCR pool: ${workers} workers, pages ${from}..${to} → ${OUT_DIR}`);
await Promise.all(Array.from({ length: workers }, () => worker()));

console.log(`\nOCR done: ${done} new, ${skipped} resumed, failed=[${failed.join(",")}]`);
console.log(`concepts found: ${found.size}`);
for (const [, v] of [...found.entries()].sort((a, b) => {
  const [ac, an] = a[0].split("-").map(Number);
  const [bc, bn] = b[0].split("-").map(Number);
  return ac - bc || an - bn;
})) {
  console.log(`  ${v.label.padEnd(6)} pdf=${String(v.page).padStart(3)}  ${v.title}`);
}
if (failed.length) process.exitCode = 1;
if (process.env.MISSING_OUT) {
  writeFileSync(process.env.MISSING_OUT, JSON.stringify([...failed].sort((a, b) => a - b)), "utf8");
}
