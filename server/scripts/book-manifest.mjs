// PHASE 59+ — turn a book's committed OCR text into a first-draft tree skeleton.
//
// Building the chapter/concept/page table by hand is the slowest part of an
// import for the assistant, and it is mechanical: the printed page footer gives
// the book-page number, the chapter openers give the units, and the «ن-م»
// concept heads give the lessons. This reads the OCR corpus and emits all three,
// so the table only has to be *checked* against the book, not discovered.
//
// It is a DRAFT, not an authority: the seeder still refuses to run unless
// `assertTreeMatchesTheBook` re-reads every page. This just removes the blank
// page. Handles «الفصل» and «الوحدة» openers, and Arabic-Indic or Latin digits.
//
// Usage:
//   OCR_DIR=<text-dir> npx tsx server/scripts/book-manifest.mjs
//   [SUBJECT=science] [TERM=t1] [OUT=<file.json>]  (default OUT = OCR_DIR/manifest.json)
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const OCR_DIR = process.env.OCR_DIR;
if (!OCR_DIR) throw new Error("set OCR_DIR (directory of pages-NNN.txt)");
if (!existsSync(OCR_DIR)) throw new Error(`OCR_DIR not found: ${OCR_DIR}`);

const AR = "٠١٢٣٤٥٦٧٨٩";
const toLatin = (s) => s.replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
const digits = (s) => toLatin(s).replace(/[^\d]/g, "");

const CONCEPT = /^([٠-٩0-9]+)\s*[-–—]\s*([٠-٩0-9]+)/;
const OPENER = /^(الفصل|الوحدة)\s+(.+?)\s*[:：]\s*(.+)$/;
const HEADING = /^(الفصل|الوحدة)\s+(.+)$/;

const files = readdirSync(OCR_DIR)
  .filter((f) => /^pages-\d+\.txt$/.test(f))
  .sort();

const offsets = [];
const chapters = [];
const concepts = [];
const seenChapter = new Set();
const seenConcept = new Set();
const pageInfo = [];
let chapterSeq = 0;

for (const file of files) {
  const pdf = Number(file.match(/\d+/)[0]);
  const raw = readFileSync(path.join(OCR_DIR, file), "utf8");
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  pageInfo.push({ pdf, chars: raw.replace(/\s+/g, "").length });

  // Printed page number: the last short all-digit line (the footer).
  for (let i = lines.length - 1; i >= 0; i--) {
    const d = /^[٠-٩0-9]{1,3}$/.test(lines[i]) ? Number(digits(lines[i])) : null;
    if (d !== null) {
      offsets.push(pdf - d);
      break;
    }
  }

  // Chapter / unit openers.
  for (const line of lines.slice(0, 8)) {
    const m = OPENER.exec(line);
    if (!m) continue;
    const key = `${m[1]}:${m[3].trim()}`;
    if (!seenChapter.has(key)) {
      seenChapter.add(key);
      chapterSeq += 1;
      chapters.push({ kind: m[1], ordinal: m[2].trim(), title: m[3].trim(), pdfPage: pdf, chapter: chapterSeq });
    }
    break;
  }

  // Concept heads in the page header. Deduped per chapter, so a book mislabel
  // that repeats another chapter's label (the science book prints chapter 10's
  // first concept as «١-١») is still surfaced instead of mistaken for a repeat.
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const m = CONCEPT.exec(lines[i]);
    if (!m) continue;
    const label = `${digits(m[1])}-${digits(m[2])}`;
    const key = `${chapterSeq}:${label}`;
    if (!seenConcept.has(key)) {
      seenConcept.add(key);
      // Title: the rest of the label line, minus an inline running head
      // («الفصل ٦ …»), else the following line.
      let title = lines[i].replace(CONCEPT, "").trim();
      const h = title.search(/(الفصل|الوحدة)\s/);
      if (h >= 0) title = title.slice(0, h).trim();
      if (!title) title = (lines[i + 1] ?? "").replace(CONCEPT, "").trim();
      concepts.push({ label, title, pdfPage: pdf, chapter: chapterSeq });
    }
    break;
  }
}

// The page offset is the value the footer agrees on most often.
const counts = new Map();
for (const o of offsets) counts.set(o, (counts.get(o) ?? 0) + 1);
const offset = offsets.length
  ? [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]
  : 0;
const bookPage = (pdf) => pdf - offset;

const manifest = {
  subject: process.env.SUBJECT ?? null,
  term: process.env.TERM ?? null,
  ocrDir: OCR_DIR,
  pages: files.length,
  offset,
  content: files.length
    ? { firstPdf: pageInfo[0].pdf, lastPdf: pageInfo[pageInfo.length - 1].pdf }
    : null,
  // Pages whose footer did not agree with the dominant offset (front/back matter).
  oddOffsets: offsets.filter((o) => o !== offset).length,
  chapters: chapters.map((c) => ({ ...c, bookPage: bookPage(c.pdfPage) })),
  concepts: concepts.map((c) => ({ ...c, bookPage: bookPage(c.pdfPage) })),
};

const out = process.env.OUT ?? path.join(OCR_DIR, "manifest.json");
writeFileSync(out, JSON.stringify(manifest, null, 2), "utf8");

console.log(`pages=${manifest.pages}  offset(pdf=book+${offset})  oddOffsets=${manifest.oddOffsets}`);
console.log(`chapters/units: ${manifest.chapters.length}`);
for (const c of manifest.chapters) console.log(`  book ${String(c.bookPage).padStart(3)}  ${c.kind} ${c.ordinal}: ${c.title}`);
console.log(`concepts: ${manifest.concepts.length}`);
for (const c of manifest.concepts) console.log(`  book ${String(c.bookPage).padStart(3)}  ${c.label.padEnd(6)} ${c.title}`);
console.log(`\nwritten: ${out}`);
