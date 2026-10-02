// Probe which Gemini OCR models still answer, one tiny page each.
// Usage: PAGES_DIR=<images> [PAGE=107] [GEMINI_OCR_MODELS=a,b,c] node scripts/probe-ocr-models.mjs
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { GeminiOcrProvider } from "../src/modules/ai/providers/gemini.js";

const PAGES_DIR = process.env.PAGES_DIR;
if (!PAGES_DIR) throw new Error("set PAGES_DIR (directory of pages-NNN.jpg)");
const page = process.env.PAGE ?? "107";
const b64 = readFileSync(path.join(PAGES_DIR, `pages-${String(page).padStart(3, "0")}.jpg`)).toString("base64");
const provider = new GeminiOcrProvider();
const models = (process.env.GEMINI_OCR_MODELS ?? "gemini-3.6-flash,gemini-3.5-flash,gemini-3.8-flash,gemini-flash-latest,gemini-3.1-flash-lite-preview,gemini-3.5-flash-lite,gemini-flash-lite-latest,gemini-2.5-flash").split(",").map((s) => s.trim()).filter(Boolean);

for (const model of models) {
  try {
    const t0 = Date.now();
    const res = await provider.ocr({ mimeType: "image/jpeg", base64: b64, fileName: `pages-${page}.jpg`, model });
    console.log(`${model}: OK ${((Date.now() - t0) / 1000).toFixed(1)}s chars=${res.text.trim().length}`);
  } catch (err) {
    const status = err && typeof err === "object" && err.meta ? err.meta.upstreamStatus : "";
    console.log(`${model}: FAIL ${status} ${(err instanceof Error ? err.message : String(err)).slice(0, 100)}`);
  }
}
