// PHASE 59 — render a whole Ministry book (or the pages still missing) into an
// isolated directory. Each book gets its own OUT_DIR because the maths book's
// pages live in server/data/curriculum-pages under the same page-NNN.jpg names.
//
// WHY A REAL HTTP SERVER, NOT PLAYWRIGHT ROUTE FULFILMENT
// The Social Studies scan is 90 MB. Fulfilling it through `page.route` hands
// pdf.js the whole body in one response, and Chromium's renderer died with
// "Target page, context or browser has been closed" while parsing it — before a
// single page rendered. Node's pdf.js parses the same file in 78 ms, so the file
// is fine; the delivery was the problem. A tiny range-capable server lets pdf.js
// fetch the header, then each page's image on demand, which keeps the renderer's
// peak memory to one page instead of the whole book. It also needs no dependency.
//
// SPEED: rendering is CPU-bound in the renderer. CONCURRENCY Chromium pages
// (default 3) each own their own pdf.js document, so several pages render at
// once instead of one after another. Each page renders one canvas at a time, so
// peak memory stays at CONCURRENCY pages, not the whole book.
//
// Usage:
//   PDF_PATH=<book.pdf> OUT_DIR=<dir> [TARGET_WIDTH=1600] [QUALITY=0.9]
//   [CONCURRENCY=3] [SKIP_EXISTING=0] npx tsx server/scripts/render-book.mjs [page ...]
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const PDF_PATH = process.env.PDF_PATH;
const OUT_DIR = process.env.OUT_DIR;
const TARGET_WIDTH = Number(process.env.TARGET_WIDTH ?? 1600);
const QUALITY = Number(process.env.QUALITY ?? 0.9);
const SKIP_EXISTING = process.env.SKIP_EXISTING !== "0";
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY ?? 3));
if (!PDF_PATH || !OUT_DIR) throw new Error("set PDF_PATH and OUT_DIR");
mkdirSync(OUT_DIR, { recursive: true });

const pdfjsDir = path.join(ROOT, "node_modules", "pdfjs-dist", "build");
for (const f of ["pdf.mjs", "pdf.worker.mjs"]) {
  if (!existsSync(path.join(pdfjsDir, f))) throw new Error(`missing ${f} in ${pdfjsDir}`);
}

const MIME = { ".pdf": "application/pdf", ".mjs": "text/javascript" };
const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end("<!doctype html><meta charset=utf-8>");
    return;
  }
  const file =
    url.pathname === "/book.pdf" ? PDF_PATH : path.join(pdfjsDir, url.pathname.replace(/^\//, ""));
  if (!existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const type = MIME[path.extname(file)] ?? "application/octet-stream";
  const size = statSync(file).size;
  const range = req.headers.range;
  const m = range ? /bytes=(\d*)-(\d*)/.exec(range) : null;
  if (m) {
    const start = m[1] ? Number(m[1]) : 0;
    const end = Math.min(m[2] ? Number(m[2]) : size - 1, size - 1);
    res.writeHead(206, {
      "content-type": type,
      "accept-ranges": "bytes",
      "content-range": `bytes ${start}-${end}/${size}`,
      "content-length": end - start + 1,
    });
    createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { "content-type": type, "accept-ranges": "bytes", "content-length": size });
    createReadStream(file).pipe(res);
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;

const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});

/** A Chromium page with its own pdf.js document, ready to render any page. */
async function newWorker() {
  const page = await browser.newPage({ viewport: { width: 600, height: 400 } });
  page.setDefaultTimeout(0);
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    const lib = await import("/pdf.mjs");
    lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
    window.__doc = await lib.getDocument({ url: "/book.pdf", disableAutoFetch: true }).promise;
  });
  return page;
}

const first = await newWorker();
const total = await first.evaluate(() => window.__doc.numPages);
console.log(`pages in book: ${total}`);

const wanted = process.argv.slice(2).map(Number).filter((n) => n > 0);
const list = wanted.length ? wanted : Array.from({ length: total }, (_, i) => i + 1);

const workers = [first];
for (let i = 1; i < Math.min(CONCURRENCY, list.length); i++) workers.push(await newWorker());
console.log(`render pool: ${workers.length} workers, ${list.length} pages → ${OUT_DIR}`);

const manifest = [];
let written = 0;
let skipped = 0;
let cursor = 0;

async function renderInto(page, n) {
  const out = await page.evaluate(
    async ({ n, targetWidth, quality }) => {
      const p = await window.__doc.getPage(n);
      const base = p.getViewport({ scale: 1 });
      const viewport = p.getViewport({ scale: targetWidth / base.width });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await p.render({ canvasContext: ctx, viewport, background: "#ffffff" }).promise;
      p.cleanup();
      const url = canvas.toDataURL("image/jpeg", quality);
      const raw = atob(url.slice(url.indexOf(",") + 1));
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      return { bytes: Array.from(bytes), w: canvas.width, h: canvas.height };
    },
    { n, targetWidth: TARGET_WIDTH, quality: QUALITY },
  );
  const buf = Buffer.from(out.bytes);
  writeFileSync(path.join(OUT_DIR, `pages-${String(n).padStart(3, "0")}.jpg`), buf);
  manifest.push({ page: n, w: out.w, h: out.h, kb: Math.round(buf.length / 1024) });
  written += 1;
  if (written % 10 === 0) console.log(`  rendered ${written}/${list.length}`);
}

await Promise.all(
  workers.map(async (page) => {
    while (true) {
      const n = list[cursor++];
      if (n === undefined) return;
      const file = path.join(OUT_DIR, `pages-${String(n).padStart(3, "0")}.jpg`);
      if (SKIP_EXISTING && existsSync(file)) {
        skipped += 1;
        continue;
      }
      await renderInto(page, n);
    }
  }),
);

if (manifest.length) {
  manifest.sort((a, b) => a.page - b.page);
  const manifestFile = path.join(OUT_DIR, "manifest-render.json");
  const prev = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, "utf8")) : [];
  const merged = new Map(prev.map((m) => [m.page, m]));
  for (const m of manifest) merged.set(m.page, m);
  writeFileSync(manifestFile, JSON.stringify([...merged.values()].sort((a, b) => a.page - b.page), null, 2));
}
await browser.close();
server.close();
console.log(`Rendered ${written} pages, skipped ${skipped} → ${OUT_DIR}`);
