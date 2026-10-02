// Audit page coverage of every committed Egypt Grade-6 curriculum.
//
// For each subject: (1) do the lesson ranges tile the whole book with no gap and
// no overlap, and (2) does every page in that span carry real OCR text? A page
// that belongs to no lesson, or a page whose OCR is empty (or only the model's
// «no text in the image» placeholder), is content the tutor cannot see.
//
// Usage (from server/): npx tsx scripts/audit-curricula.ts   [OUT=<file>]
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";

// Capture everything and write UTF-8 directly (PowerShell redirection mangles Arabic).
const OUT_FILE = process.env.OUT ?? "scripts/.audit-out.txt";
const captured: string[] = [];
console.log = (...args: unknown[]) => { captured.push(args.map(String).join(" ")); };
import { fileURLToPath } from "node:url";
import * as math from "../src/db/egyptT1.js";
import * as science from "../src/db/egyptScienceT1.js";
import * as social from "../src/db/egyptSocialT1.js";
import * as arabic from "../src/db/egyptArabicT1.js";
import * as ict from "../src/db/egyptIctT1.js";
import * as islamic from "../src/db/egyptIslamicT1.js";
import * as christian from "../src/db/egyptChristianT1.js";
import * as mathEn from "../src/db/egyptMathEnT1.js";
import * as mathFr from "../src/db/egyptMathFrT1.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OCR = path.join(HERE, "..", "data", "curriculum-ocr");

// The OCR provider answers a truly blank page with one of these sentences
// (wording varies between calls) instead of an empty string. They mean «no
// text», so the audit must count them as empty rather than as content.
const NO_TEXT_MARKERS = [
  "لا يوجد نص مكتوب في الصورة المرفقة",
  "لا توجد نصوص في الصورة المرفقة",
  "لا توجد نصوص في هذه الصورة",
  "لا يوجد نص في الصورة",
];
const isNoText = (t: string) => t.length === 0 || NO_TEXT_MARKERS.some((m) => t.includes(m));

const mathRanges: { key: string; title: string; from: number; to: number }[] = [];
math.EGYPT_T1_UNITS.forEach((u, ui) =>
  u.concepts.forEach((c, ci) => {
    const r = math.conceptBookRange(ui, ci);
    mathRanges.push({ key: c.key, title: c.title, from: r.from, to: r.to });
  }),
);
const mathPage = (book: number) => {
  const f = path.join(OCR, `pages-${String(book + math.BOOK_TO_PDF_OFFSET).padStart(3, "0")}.txt`);
  return existsSync(f) ? readFileSync(f, "utf8").trim() : "";
};

interface Audit {
  name: string;
  start: number;
  end: number;
  ranges: { key: string; title: string; from: number; to: number }[];
  page: (book: number) => string;
  /** Pages known to be pure pictures (no text layer, OCR hallucinated) — not a gap. */
  ignoreEmpty?: ReadonlySet<number>;
  extra?: { label: string; start: number; end: number };
}

const audits: Audit[] = [
  {
    name: "الرياضيات (eg-g6-math)",
    start: 0,
    end: math.EGYPT_T1_BOOK_END,
    ranges: mathRanges,
    page: mathPage,
    // Same page geometry as the English edition (book = PDF − 9): book
    // 13/67/79/97 are full-page pictures with no text layer, and OCR answered
    // «no text». Verified by reading the PDF text layer directly.
    ignoreEmpty: new Set([13, 67, 79, 97]),
  },
  {
    name: "العلوم (eg-g6-science)",
    start: science.EGYPT_SCIENCE_T1_BOOK_START,
    end: science.EGYPT_SCIENCE_T1_BOOK_END,
    ranges: science.allConceptRanges(),
    page: science.loadBookPage,
  },
  {
    name: "الدراسات الاجتماعية (eg-g6-social)",
    start: social.EGYPT_SOCIAL_T1_BOOK_START,
    end: social.EGYPT_SOCIAL_T1_BOOK_END,
    ranges: social.allLessonRanges(),
    page: social.loadBookPage,
    // Book 7 and 75 sit between a unit opener (6, 74) and that unit's first
    // lesson (8, 76): full-page pictures the scan has no text for.
    ignoreEmpty: new Set([7, 75]),
  },
  {
    name: "اللغة العربية (eg-g6-arabic)",
    start: arabic.EGYPT_ARABIC_T1_BOOK_START,
    end: arabic.EGYPT_ARABIC_T1_BOOK_END,
    ranges: arabic.allLessonRanges(),
    page: arabic.loadBookPage,
    extra: { label: "الملاحق", start: arabic.EGYPT_ARABIC_T1_APPENDIX.from, end: arabic.EGYPT_ARABIC_T1_APPENDIX.to },
  },
  {
    name: "تكنولوجيا المعلومات والاتصالات (eg-g6-ict)",
    start: ict.EGYPT_ICT_T1_BOOK_START,
    end: ict.EGYPT_ICT_T1_BOOK_END,
    ranges: ict.allLessonRanges(),
    page: ict.loadBookPage,
  },
  {
    name: "التربية الدينية الإسلامية (eg-g6-islamic-education)",
    start: islamic.EGYPT_ISLAMIC_T1_BOOK_START,
    end: islamic.EGYPT_ISLAMIC_T1_BOOK_END,
    ranges: islamic.allLessonRanges(),
    page: islamic.loadBookPage,
  },
  {
    name: "التربية الدينية المسيحية (eg-g6-christian-education)",
    start: christian.EGYPT_CHRISTIAN_T1_BOOK_START,
    end: christian.EGYPT_CHRISTIAN_T1_BOOK_END,
    ranges: christian.allLessonRanges(),
    page: christian.loadBookPage,
  },
  {
    name: "الرياضيات بالإنجليزية (eg-g6-math-en)",
    start: mathEn.EGYPT_MATH_EN_T1_BOOK_START,
    end: mathEn.EGYPT_MATH_EN_T1_BOOK_END,
    ranges: mathEn.allConceptRanges(),
    page: mathEn.loadBookPage,
    // Book 13/67/79/97 are full-page pictures: the PDF has no text layer there
    // and the OCR answered with «no text» (or invented words on 97).
    ignoreEmpty: new Set([13, 67, 79, 97]),
  },
  {
    name: "الرياضيات بالفرنسية (eg-g6-math-fr)",
    start: mathFr.EGYPT_MATH_FR_T1_BOOK_START,
    end: mathFr.EGYPT_MATH_FR_T1_BOOK_END,
    ranges: mathFr.allConceptRanges(),
    page: mathFr.loadBookPage,
    // Book 13 is a full-page picture (no text layer). Books 67/79 are pictures
    // too, but the French scan prints a photo credit on them, so they carry text.
    ignoreEmpty: new Set([13]),
  },
];

let anyProblem = false;
for (const a of audits) {
  const problems: string[] = [];
  const covered = new Map<number, string>();
  for (const r of a.ranges) {
    for (let b = r.from; b <= r.to; b++) {
      if (covered.has(b)) problems.push(`صفحة ${b}: مملوكة لدرسين (${covered.get(b)} و ${r.key})`);
      covered.set(b, r.key);
    }
    if (r.from > r.to) problems.push(`${r.key}: نطاق معكوس ${r.from}–${r.to}`);
  }
  let chars = 0;
  let empty = 0;
  for (let b = a.start; b <= a.end; b++) {
    if (!a.ranges.some((r) => b >= r.from && b <= r.to)) problems.push(`صفحة ${b}: لا ينتمي لأي درس`);
    const t = a.page(b);
    if (isNoText(t)) {
      empty++;
      if (!a.ignoreEmpty?.has(b)) problems.push(`صفحة ${b}: بلا نص OCR`);
    } else chars += t.length;
  }
  const nextKnown = a.extra ? a.extra : null;
  if (nextKnown) {
    for (let b = nextKnown.start; b <= nextKnown.end; b++) {
      if (isNoText(a.page(b))) problems.push(`${nextKnown.label} صفحة ${b}: بلا نص OCR`);
    }
  }
  const status = problems.length === 0 ? "سليم ✅" : `به ${problems.length} مشكلة ❌`;
  console.log(`\n### ${a.name}: ${status}`);
  console.log(`  الصفحات ${a.start}–${a.end} | دروس=${a.ranges.length} | محارف=${chars} | صفحات فارغة=${empty}`);
  for (const p of problems.slice(0, 25)) console.log(`  - ${p}`);
  if (problems.length > 25) console.log(`  … و${problems.length - 25} مشكلة أخرى`);
  if (problems.length) anyProblem = true;
}

console.log(`\nالخلاصة: ${anyProblem ? "توجد مشكلات تحتاج إصلاحًا" : "كل الصفحات مغطاة ولها نص"}`);

writeFileSync(OUT_FILE, captured.join("\n") + "\n", "utf8");
