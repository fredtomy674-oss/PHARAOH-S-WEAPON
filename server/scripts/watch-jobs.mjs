// Watchdog: snapshot progress of every pending OCR corpus + render directory.
// Usage: node server/scripts/watch-jobs.mjs
// Reads server/scripts/.watch-jobs.json (manifest), compares with the previous
// snapshot in server/scripts/.watch-snap.json, prints DONE/MOVING/STALLED per
// entry and rewrites the snapshot. Fast (<30s), no network, no API quota.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = path.join(HERE, ".watch-jobs.json");
const SNAP = path.join(HERE, ".watch-snap.json");

if (!existsSync(MANIFEST)) {
  console.error("no manifest: server/scripts/.watch-jobs.json");
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const prev = existsSync(SNAP) ? JSON.parse(readFileSync(SNAP, "utf8")) : {};
const now = Date.now();
const snap = {};
let done = 0;
let stalled = 0;

for (const job of manifest.jobs) {
  const dir = path.resolve(HERE, "..", job.dir);
  let total = 0;
  let good = 0;
  try {
    for (const f of readdirSync(dir)) {
      if (!job.match || !new RegExp(job.match).test(f)) continue;
      total++;
      try {
        if ((statSync(path.join(dir, f)).size ?? 0) >= (job.minBytes ?? 1)) good++;
      } catch { /* raced deletion */ }
    }
  } catch { /* dir missing yet */ }
  const key = job.dir;
  const before = prev[key];
  let state = "MOVING";
  if (good >= job.expected) {
    state = "DONE";
    done++;
  } else if (before && before.good === good) {
    state = `STALLED(${(before.good / job.expected * 100).toFixed(0)}%)`;
    stalled++;
  } else if (!before) {
    state = `NEW(${(good / job.expected * 100).toFixed(0)}%)`;
  } else {
    state = `MOVING(${(good / job.expected * 100).toFixed(0)}%)`;
  }
  snap[key] = { good, total, at: now };
  console.log(`${state.padEnd(14)} ${job.dir} ${good}/${job.expected}`);
}
writeFileSync(SNAP, JSON.stringify({ at: now, jobs: snap }, null, 1));
console.log(`--- done=${done} stalled=${stalled} total=${manifest.jobs.length} ---`);
if (stalled > 0) process.exitCode = 2;
