// PHASE 48 — render the official textbook pages as real sRGB page images.
//
// WHY THIS EXISTS
// The first extraction (`pdf-resolve.mjs`) pulled the embedded scan JPEG straight
// out of the PDF. Those scans are **CMYK** (4 components, Adobe transform 0) and
// browsers render Adobe CMYK JPEGs as solid black — measured mean luminance 0.5
// to 16 out of 255, 100% of pixels under 100. So the lesson stage showed dark
// rectangles even though the file itself was perfectly readable to a renderer
// that understands CMYK (which is why the OCR corpus came out correct).
//
// The fix is to render the *page* instead of lifting the raw stream: pdf.js
// applies the PDF's own DeviceCMYK → RGB conversion, and Chromium's canvas then
// encodes a plain sRGB JPEG that every browser shows correctly. No new
// dependency: Playwright and pdfjs-dist are both already in the project.
//
// Usage:  node server/scripts/pdf-render-pages.mjs [pageNo...]
// Env:    PDF_PATH, OUT_DIR, TARGET_WIDTH (default 1600), QUALITY (0.9)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const PDF_PATH = process.env.PDF_PATH ?? "C:/Users/Administrator/Downloads/Math_Primary6_T1.pdf";
const OUT_DIR = process.env.OUT_DIR ?? path.join(HERE, "..", "data", "curriculum-pages");
const TARGET_WIDTH = Number(process.env.TARGET_WIDTH ?? 1600);
const QUALITY = Number(process.env.QUALITY ?? 0.9);

mkdirSync(OUT_DIR, { recursive: true });

const pdfjsDir = path.resolve("node_modules/pdfjs-dist/build");
for (const f of ["pdf.mjs", "pdf.worker.mjs"]) {
  if (!readFileSync(path.join(pdfjsDir, f), { flag: "r" })) throw new Error(`missing ${f}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 600, height: 400 } });

// Serve pdf.js and the book from one fake origin so ESM imports + fetch work.
await page.route("http://book.local/**", async (route) => {
  const url = new URL(route.request().url());
  if (url.pathname === "/book.pdf") {
    return route.fulfill({ path: PDF_PATH, contentType: "application/pdf" });
  }
  const file = url.pathname === "/" ? null : path.join(pdfjsDir, url.pathname.replace(/^\//, ""));
  if (!file || !url.pathname.endsWith(".mjs")) return route.fulfill({ status: 404, body: "" });
  return route.fulfill({ path: file, contentType: "text/javascript" });
});
await page.route("http://book.local/", (route) =>
  route.fulfill({ contentType: "text/html", body: "<!doctype html><meta charset=utf-8><title>render</title>" }),
);

await page.goto("http://book.local/", { waitUntil: "domcontentloaded" });

const total = await page.evaluate(async () => {
  const lib = await import("/pdf.mjs");
  lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
  const doc = await lib.getDocument("/book.pdf").promise;
  window.__doc = doc;
  return doc.numPages;
});
console.log(`pages in book: ${total}`);

const wanted = process.argv.slice(2).map(Number).filter((n) => n > 0);
const list = wanted.length ? wanted : Array.from({ length: total }, (_, i) => i + 1);

let written = 0;
const manifest = [];
for (const n of list) {
  const out = await page.evaluate(
    async ({ n, targetWidth, quality }) => {
      const p = await window.__doc.getPage(n);
      const base = p.getViewport({ scale: 1 });
      const scale = targetWidth / base.width;
      const viewport = p.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await p.render({ canvasContext: ctx, viewport, background: "#ffffff" }).promise;
      p.cleanup();
      const url = canvas.toDataURL("image/jpeg", quality);
      const b64 = url.slice(url.indexOf(",") + 1);
      const raw = atob(b64);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      return {
        bytes: Array.from(bytes),
        w: canvas.width,
        h: canvas.height,
        dataUrlLength: url.length,
      };
    },
    { n, targetWidth: TARGET_WIDTH, quality: QUALITY },
  );
  const buf = Buffer.from(out.bytes);
  const file = path.join(OUT_DIR, `pages-${String(n).padStart(3, "0")}.jpg`);
  writeFileSync(file, buf);
  manifest.push({ page: n, w: out.w, h: out.h, kb: Math.round(buf.length / 1024) });
  written++;
  if (n % 10 === 0 || !wanted.length) console.log(`  rendered ${n}/${total} → ${out.w}x${out.h} ${Math.round(buf.length / 1024)}KB`);
}

writeFileSync(path.join(OUT_DIR, "manifest-render.json"), JSON.stringify(manifest, null, 2));
await browser.close();
const totalKb = manifest.reduce((s, x) => s + x.kb, 0);
console.log(`Rendered ${written} pages → ${OUT_DIR} (${Math.round(totalKb / 1024)} MB total)`);