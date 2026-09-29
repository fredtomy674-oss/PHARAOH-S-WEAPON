// Resolve the page tree with a balanced <<...>> dict parser; extract the main
// JPEG scan of every page into .curriculum-pages/.
import { mkdirSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";

const file = process.env.PDF_PATH ?? "C:/Users/Administrator/Downloads/Math_Primary6_T1.pdf";
const outDir = process.env.OUT_DIR ?? "./scripts/.curriculum-pages";
mkdirSync(outDir, { recursive: true });

const bytes = readFileSync(file);
const text = bytes.toString("latin1");

/** Return {dict, afterDict} for the <<...>> starting at/after idx, balanced. */
function parseDict(text, idx) {
  const open = text.indexOf("<<", idx);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < text.length - 1; i++) {
    if (text[i] === "<" && text[i + 1] === "<") { depth++; i++; continue; }
    if (text[i] === ">" && text[i + 1] === ">") {
      depth--;
      if (depth === 0) {
        const dict = text.slice(open + 2, i);
        return { dict, afterDict: i + 2, open, start: open - 2 };
      }
      i++;
    }
  }
  return null;
}

// ---------- collect all dicts keyed by obj number ----------
const dictByObj = new Map();
const lObj = /(\d+)\s+0\s+obj/g;
let lm;
while ((lm = lObj.exec(text)) !== null) {
  const objNum = Number(lm[1]);
  if (dictByObj.has(objNum)) continue;
  const parsed = parseDict(text, lm.index + lm[0].length);
  if (parsed) dictByObj.set(objNum, { ...parsed, idx: lm.index });
}
console.log("dict objects parsed:", dictByObj.size);

// ---------- JPEG stream table (objNum -> {start,length}) ----------
const jpegByObj = new Map();
for (const [objNum, { dict, afterDict }] of dictByObj) {
  if (!/\/Subtype\s*\/Image/.test(dict) || !/DCTDecode/.test(dict)) continue;
  const lenMatch = /\/Length\s+(\d+)/.exec(dict);
  const lenRef = /\/Length\s+(\d+)\s+0\s+R/.exec(dict);
  let length = -1;
  if (lenMatch && !lenRef) length = Number(lenMatch[1]);
  else if (lenRef) {
    const rm = dictByObj.get(Number(lenRef[1]));
    const lmm = rm ? /\/Length\s+(\d+)/.exec(rm.dict) : null;
    length = lmm ? Number(lmm[1]) : -1;
  }
  // after `>>` comes optional whitespace then `stream\r?\n` then bytes
  let start = -1;
  const after = text.slice(afterDict, afterDict + 40);
  const sm = /^\s*stream(\r?\n|[\r\n])/.exec(after);
  if (sm) start = afterDict + sm[0].length;
  if (length > 0 && start >= 0 && start + length <= bytes.length) {
    jpegByObj.set(objNum, { start, length });
  }
}
console.log("JPEG image streams:", jpegByObj.size);

// ---------- page tree ----------
function pairsOf(dict) {
  const p = {};
  for (const mm of dict.matchAll(/(\/[A-Za-z]\w*)\s*(\[[\s\S]*?\]|[^\s]+)/g)) p[mm[1]] = mm[2];
  return p;
}
function refsOf(v) { return [...v.matchAll(/(\d+)\s+0\s+R/g)].map((x) => Number(x[1])); }

const pagesNodes = new Map();
const pageObjs = new Set();
for (const [num, { dict }] of dictByObj) {
  const p = pairsOf(dict.replace(/\s+/g, " "));
  if (p["/Type"] === "/Type /Pages" || /\/Type\s*\/Pages/.test(dict)) {
    pagesNodes.set(num, refsOf(p["/Kids"] ?? ""));
  }
  if (/\/Type\s*\/Page(?![s])/.test(dict)) pageObjs.add(num);
}
console.log("page dicts:", pageObjs.size, "pages nodes:", pagesNodes.size);
const allKids = new Set([...pagesNodes.values()].flat());
const root = [...pagesNodes.keys()].find((n) => !allKids.has(n));
const ordered = [];
(function walk(node) {
  const kids = pagesNodes.get(node);
  if (!kids) return;
  for (const k of kids) {
    if (pagesNodes.has(k)) walk(k);
    else ordered.push(k);
  }
})(root);
console.log("ordered pages:", ordered.length);

// ---------- extract ----------
const manifest = [];
for (let i = 0; i < ordered.length; i++) {
  const pageNum = i + 1;
  const info = dictByObj.get(ordered[i]);
  if (!info) continue;
  const xobjMatch = /\/XObject\s*<<([\s\S]*?)>>/.exec(info.dict);
  const xrefs = [];
  if (xobjMatch) {
    for (const nm of xobjMatch[1].matchAll(/\/(\w+)\s+(\d+)\s+0\s+R/g)) xrefs.push({ name: nm[1], obj: Number(nm[2]) });
  }
  let best = null;
  for (const { name, obj } of xrefs) {
    const j = jpegByObj.get(obj);
    if (!j) continue;
    if (!best || j.length > best.length) best = { name, obj, ...j };
  }
  if (i < 3 || pageNum === ordered.length) {
    console.log(`page ${pageNum}: obj=${ordered[i]} xrefs=${xrefs.length} ${JSON.stringify(xrefs.map((x) => `${x.name}#${x.obj}`))} best=${best ? `${best.name}#${best.obj} ${(best.length / 1024).toFixed(0)}KB` : "?"}`);
  }
  if (best) {
    writeFileSync(`${outDir}/pages-${String(pageNum).padStart(3, "0")}.jpg`, bytes.subarray(best.start, best.start + best.length));
    manifest.push({ page: pageNum, obj: best.obj, name: best.name, kb: Math.round(best.length / 1024) });
  }
}
writeFileSync(`${outDir}/manifest.json`, JSON.stringify(manifest, null, 2));
const total = manifest.reduce((s, x) => s + x.kb, 0);
console.log(`Extracted ${manifest.length}/${ordered.length} pages, ${Math.round(total / 1024)} MB total, avg ${manifest.length ? Math.round(total / manifest.length) : 0} KB/page.`);