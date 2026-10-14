// Egypt Secondary-1 (Grade 10) **English as a second foreign language**, first
// term — OFFICIAL curriculum.
//
// The first term IS the Ministry textbook (`English_second_language_secondary1.pdf`,
// 2026/2027 MoE edition, 51 scan pages, all OCR'd). This file is the book's table:
// the three units of its printed «Contents», the «REVIEW 1» that closes the term,
// each unit's printed lesson heads with the exact book pages they occupy, and each
// unit's verbatim Scope-and-Sequence outcomes. It is the single source of truth the
// seeder and the stage both read; the self-checks at the bottom prove the page
// mapping against the scan, page by page.
//
// THE OFFSET IS ZERO — book page = scan page
// Every content page prints its own number (scan page 7 prints «7», scan 24 prints
// «24»), so a book page N is scan page N (`BOOK_TO_PDF_OFFSET = 0`).
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–5 are the cover, the Introduction, the Contents and the two
// «Scope and Sequence» pages; scan page 50 is the «Audio Scripts» appendix and page
// 51 the credits. None of them is a lesson. The term runs from the Unit 1 opener
// (scan 6) to the end of «Review 1» (scan 49): `EGYPT_ENGLISH2_G10_T1_BOOK_START`
// / `_END` are exactly those two pages, and the tiling assertion proves nothing in
// between is left unreachable.
//
// THE RUNNING HEAD IS THE BOOK'S OWN, NOT ONE PER UNIT
// Unlike the Prep books, this one does not repeat the unit name on its pages: odd
// content pages print «First Term» and even pages print «Year One», each beside the
// page number. `assertTreeMatchesTheBook` therefore proves the running head at the
// book level (odd/even) and the unit identity from each lesson's printed head.
//
// EACH LESSON'S CONCEPTS ARE ITS UNIT'S PRINTED OUTCOMES, BY SKILL
// The book prints no per-lesson objectives: its outcomes sit in the printed «Scope
// and Sequence» (book pages 4–5), grouped by skill (Reading / Listening / Speaking /
// Language / Writing). Every unit follows the same four-lesson rhythm, which the
// printed skill banners on the lesson pages confirm — Lesson 1 Reading + Speaking,
// Lesson 2 Listening + Language, Lesson 3 Reading + Speaking, Lesson 4 Writing.
// Each lesson therefore carries the verbatim outcomes of the skill(s) it teaches.
// The subject code `english` is what makes the tutor answer in English (D-042).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** One lesson of the book — becomes one lesson in the app tree. */
export interface English2G10T1Lesson {
  /** App-addressable key, e.g. "1-1" (unit 1, lesson 1) or "review1-1". */
  key: string;
  /** Full app-facing lesson title, e.g. "Lesson 1: Who am I?". */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`), e.g. "Who am I?" or "Review 1".
   */
  printedHead: string;
  /** First printed book page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed outcomes for the skill(s) this lesson teaches. */
  concepts: string[];
}

/**
 * One printed section of the book — a unit, or the Review 1 that closes the term.
 * The book repeats no per-unit running head on its pages (see the file header), so
 * `footerTitle` records the title as the Contents prints it; the running head is
 * proved book-wide instead.
 */
export interface English2G10T1Section {
  /** Internal key: "1"…"3", "review1". */
  key: string;
  kind: "unit" | "review";
  /** Section title as printed in the Contents. */
  title: string;
  /** The section's title as the Contents prints it (see the interface note). */
  footerTitle: string;
  /** First printed page of the section (the unit opener / the review opener). */
  bookFrom: number;
  /** Last printed page of the section. */
  bookTo: number;
  lessons: English2G10T1Lesson[];
}

// ---------------------------------------------------------------------------
// The printed «Scope and Sequence» of each unit, verbatim, grouped by skill.
// ---------------------------------------------------------------------------

/** Unit 1 — Back to School (Contents: book page 5; opener: book page 6). */
const U1 = {
  reading: ["Self-introductions and cultural profiles", "First-day experiences"],
  listening: ["Introducing oneself", "Identifying personal & cultural information"],
  speaking: ["Introducing self and others", "Asking/answering personal questions"],
  language: ["Verb to be (am, is, are)", "Affirmative & interrogative forms"],
  writing: ["Social media post (4-5 sentences)"],
};

/** Unit 2 — Daily Routine and Healthy Life (Contents: book page 19). */
const U2 = {
  reading: ["Daily routines", "Healthy habits texts"],
  listening: ["Daily activities", "Simple talks about health"],
  speaking: ["Talking about routines", "Asking about habits"],
  language: ["Present Simple Affirmative and Negative form"],
  writing: ["Daily routine paragraph", "Healthy life blog"],
};

/** Unit 3 — My Time at School (Contents: book page 33). */
const U3 = {
  reading: ["School activities", "Daily school life"],
  listening: ["School conversations", "Instructions"],
  speaking: ["Talking about school and subjects", "Asking about activities"],
  language: ["Present Simple questions", "Do / Does usage", "Basic grammar in context"],
  writing: ["School day paragraph", "Simple email"],
};

/**
 * «Review 1» is one lesson carrying its printed parts: Vocabulary, Reading,
 * Language and Writing exercises (book pages 43–49).
 */
const REVIEW_CONCEPTS = [
  "Vocabulary: Choose the correct answer",
  "Reading: Read the text, then choose the correct answer",
  "Choose the TWO (2) correct answers",
  "Language: Choose the correct answer",
  "Reading: Read and complete the following table",
  "Writing: Write a paragraph of (4-5) sentences about «Your Daily Routine»",
  "Writing: Write a blog post of (4-5) sentences about «Technology in Your life»",
  "Writing: Write an email of (4-5) sentences to your friend Salma about «Your Good School Habits»",
];

// ---------------------------------------------------------------------------
// THE OFFSET AND THE TERM'S BOUNDS
// ---------------------------------------------------------------------------

/** Book page = scan page (every content page prints its own number). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed page of the term — the Unit 1 opener. */
export const EGYPT_ENGLISH2_G10_T1_BOOK_START = 6;

/** Last printed page of the term — the last page of «Review 1». */
export const EGYPT_ENGLISH2_G10_T1_BOOK_END = 49;

/**
 * The book in printed order: Unit 1 (6–17), Unit 2 (18–28), Unit 3 (29–42) and
 * Review 1 (43–49). Unit/lesson starts come from each printed «Lesson n» head; the
 * outcomes come from each unit's printed Scope and Sequence. Every page is checked
 * against the book by `assertTreeMatchesTheBook`.
 */
export const EGYPT_ENGLISH2_G10_T1_SECTIONS: English2G10T1Section[] = [
  {
    key: "1",
    kind: "unit",
    title: "Unit 1: Back to School",
    footerTitle: "Unit 1 Back to School",
    bookFrom: 6,
    bookTo: 17,
    lessons: [
      { key: "1-1", title: "Lesson 1: Who am I?", printedHead: "Who am I?", bookFrom: 7, concepts: [...U1.reading, ...U1.speaking] },
      { key: "1-2", title: "Lesson 2: About Me", printedHead: "About Me", bookFrom: 9, concepts: [...U1.listening, ...U1.language] },
      { key: "1-3", title: "Lesson 3: My Classroom and Me", printedHead: "My Classroom and Me", bookFrom: 11, concepts: [...U1.reading, ...U1.speaking] },
      { key: "1-4", title: 'Lesson 4: "About Me" Post', printedHead: "About Me Post", bookFrom: 14, concepts: [...U1.writing] },
    ],
  },
  {
    key: "2",
    kind: "unit",
    title: "Unit 2: Daily Routine and Healthy Life",
    footerTitle: "Unit 2 Daily Routine and Healthy Life",
    bookFrom: 18,
    bookTo: 28,
    lessons: [
      { key: "2-1", title: "Lesson 1: My Daily Routine", printedHead: "My Daily Routine", bookFrom: 19, concepts: [...U2.reading, ...U2.speaking] },
      { key: "2-2", title: "Lesson 2: Technology in my Day", printedHead: "Technology in my Day", bookFrom: 21, concepts: [...U2.listening, ...U2.language] },
      { key: "2-3", title: "Lesson 3: Living a Balanced and Healthy Life", printedHead: "Living a Balanced and Healthy Life", bookFrom: 24, concepts: [...U2.reading, ...U2.speaking] },
      { key: "2-4", title: "Lesson 4: Healthy Life in a Digital World", printedHead: "Healthy Life in a Digital World", bookFrom: 26, concepts: [...U2.writing] },
    ],
  },
  {
    key: "3",
    kind: "unit",
    title: "Unit 3: My Time at School",
    footerTitle: "Unit 3 My Time at School",
    bookFrom: 29,
    bookTo: 42,
    lessons: [
      { key: "3-1", title: "Lesson 1: My School Day", printedHead: "My School Day", bookFrom: 30, concepts: [...U3.reading, ...U3.speaking] },
      { key: "3-2", title: "Lesson 2: Our School Project", printedHead: "Our School Project", bookFrom: 33, concepts: [...U3.listening, ...U3.language] },
      { key: "3-3", title: "Lesson 3: Good School Habits", printedHead: "Good School Habits", bookFrom: 36, concepts: [...U3.reading, ...U3.speaking] },
      { key: "3-4", title: "Lesson 4: A Different School", printedHead: "A Different School", bookFrom: 39, concepts: [...U3.writing] },
    ],
  },
  {
    key: "review1",
    kind: "review",
    title: "Review 1",
    footerTitle: "Review 1",
    bookFrom: 43,
    bookTo: 49,
    lessons: [
      {
        key: "review1-1",
        title: "Review 1",
        printedHead: "Review 1",
        bookFrom: 43,
        concepts: [...REVIEW_CONCEPTS],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the section's first page (for its first
 * lesson — the unit opener) or its own start page, up to the page before the next
 * lesson starts, or the section's last page for its last lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_ENGLISH2_G10_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const ranges: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ENGLISH2_G10_T1_SECTIONS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      ranges.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return ranges;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. The book prints an
 * «Audio Scripts» appendix (book page 50) holding the three units' listening
 * passages; every listening lesson (Unit n, Lesson 2) points at it so the tutor can
 * quote the passage the book points to. Kept as a function so the seeder and the
 * stage share one shape across all the books.
 */
export function allLessonExtras(): Map<string, number[]> {
  const extras = new Map<string, number[]>();
  for (const section of EGYPT_ENGLISH2_G10_T1_SECTIONS) {
    if (section.kind !== "unit") continue;
    extras.set(`${section.key}-2`, [50]);
  }
  return extras;
}

// ---------------------------------------------------------------------------
// OCR loading
// ---------------------------------------------------------------------------

const OCR_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "curriculum-ocr",
  "english2-g10-t1",
);

/**
 * The OCR provider answers a truly blank page with a short sentence instead of an
 * empty string. It means "no text", not content.
 */
const NO_TEXT = /لا يوجد نص/;

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    const text = readFileSync(file, "utf8").trim();
    return NO_TEXT.test(text) ? "" : text;
  } catch {
    return "";
  }
}

/** One page of a lesson's document, with a stable printed-page marker. */
function pageBlock(book: number, text: string, appendix = false): string {
  return `### صفحة ${book}${appendix ? " (ملحق)" : ""}\n${text}`;
}

/** The document a lesson grounds the tutor in: its own range, then its appendix pages. */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const { from, to } = lessonBookRange(sectionIndex, lessonIndex);
  const parts: string[] = [];
  for (let p = from; p <= to; p++) {
    const text = loadBookPage(p);
    if (text) parts.push(pageBlock(p, text));
  }
  const section = EGYPT_ENGLISH2_G10_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const extra = allLessonExtras().get(lesson.key);
  for (const p of extra ?? []) {
    const text = loadBookPage(p);
    if (text) parts.push(pageBlock(p, text, true));
  }
  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/** Strips everything but letters and digits, so OCR spacing cannot break a match. */
function normalize(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Page-number candidates a content page prints in its running head or foot. The
 * number sits beside the running head, laid out either alone on its line («7»), at
 * the line's start («7 First Term») or at its end («First Term 13»). So the
 * candidates are the 1–3 digit tokens of the first three and last three non-empty
 * lines, taken from the running-head line and from any line that starts with one.
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const window = [...lines.slice(0, 3), ...lines.slice(-3)];
  const candidates = new Set<number>();
  for (const line of window) {
    if (/^first term$|^year one$/i.test(line)) continue;
    if (/first\s*term|year\s*one/i.test(line)) {
      // The number rides the running-head line: take every 1–3 digit token on it.
      for (const m of line.matchAll(/\d{1,3}/g)) candidates.add(Number(m[0]));
      continue;
    }
    const m = line.match(/^(\d{1,3})(?:\D|$)/);
    if (m) candidates.add(Number(m[1]));
  }
  return [...candidates];
}

/**
 * The book number a content page prints in its running head/foot, or null. Every
 * content page prints its own number, so a page that carries it returns itself; a
 * mismatch returns the largest candidate so the caller can see the difference.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : Math.max(...candidates);
}

/** The running head this book prints on a content page: odd pages / even pages. */
function runningHeadFor(book: number): string {
  return book % 2 === 1 ? "First Term" : "Year One";
}

/**
 * Table invariants: lesson keys match their position, every range sits inside its
 * section, sections tile the book without gaps or overlaps, and the first section
 * starts where the Contents says. A content mistake here would quietly ground the
 * tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_ENGLISH2_G10_T1_SECTIONS;

  sections.forEach((section, si) => {
    if (section.lessons.length === 0) problems.push(`القسم ${section.key}: بلا دروس`);
    if (!section.footerTitle.trim()) problems.push(`القسم ${section.key}: بلا عنوان`);
    section.lessons.forEach((lesson, li) => {
      const expectedKey = `${section.key}-${li + 1}`;
      if (lesson.key !== expectedKey) {
        problems.push(`القسم ${section.key} الدرس ${li + 1}: المفتاح «${lesson.key}» بدل «${expectedKey}»`);
      }
      if (lesson.concepts.length === 0) problems.push(`الدرس ${lesson.key}: بلا أهداف`);
      if (!lesson.title.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان`);
      if (!lesson.printedHead.trim()) problems.push(`الدرس ${lesson.key}: بلا عنوان مطبوع`);
      if (lesson.bookFrom < section.bookFrom || lesson.bookFrom > section.bookTo) {
        problems.push(`الدرس ${lesson.key}: بدايته ${lesson.bookFrom} خارج نطاق القسم ${section.bookFrom}–${section.bookTo}`);
      }
      const { from, to } = lessonBookRange(si, li);
      if (from > to) problems.push(`الدرس ${lesson.key}: نطاق الصفحات معكوس (${from}–${to})`);
      if (from < section.bookFrom || to > section.bookTo) {
        problems.push(`الدرس ${lesson.key}: نطاقه ${from}–${to} خارج نطاق القسم ${section.bookFrom}–${section.bookTo}`);
      }
      const next = section.lessons[li + 1];
      if (next && to >= next.bookFrom) problems.push(`الدرس ${lesson.key} يتداخل مع ${next.key}`);
      if (li === 0 && from !== section.bookFrom) {
        problems.push(`الدرس ${lesson.key}: أول درس يجب أن يبدأ من صدر القسم ${section.bookFrom}، وجدنا ${from}`);
      }
    });
    const nextSection = sections[si + 1];
    if (nextSection && section.bookTo >= nextSection.bookFrom) {
      problems.push(`القسم ${section.key} يتداخل مع القسم ${nextSection.key}`);
    }
    if (nextSection && section.bookTo + 1 !== nextSection.bookFrom) {
      problems.push(`فجوة بين القسم ${section.key} (حتى ${section.bookTo}) والقسم ${nextSection.key} (من ${nextSection.bookFrom})`);
    }
  });

  const first = sections[0]!;
  const last = sections[sections.length - 1]!;
  if (first.bookFrom !== EGYPT_ENGLISH2_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من ${EGYPT_ENGLISH2_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last.bookTo !== EGYPT_ENGLISH2_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند ${EGYPT_ENGLISH2_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every content page carries real OCR text and prints its own book number in
 *     its running head/foot;
 *  2. every content page carries the book's running head for its parity («First
 *     Term» on odd pages, «Year One» on even pages);
 *  3. every lesson's own first page prints that lesson's head;
 *  4. every printed page is owned by exactly one lesson — no page falls between
 *     two lessons and is unreachable;
 *  5. the pages tile the term [START, END] with no gap.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const sections = EGYPT_ENGLISH2_G10_T1_SECTIONS;

  // The three unit openers are full-page graphics: their OCR carries the unit banner
  // but not the page number or the running head, so they are exempt from steps 1–2.
  const openers = new Set(sections.filter((s) => s.kind === "unit").map((s) => s.bookFrom));

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let footersChecked = 0;

  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ENGLISH2_G10_T1_BOOK_START || book > EGYPT_ENGLISH2_G10_T1_BOOK_END) continue;
    printedPages.add(book);

    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }

    if (openers.has(book)) continue;

    const footer = printedFooter(book);
    if (footer === null) {
      problems.push(`صفحة الكتاب ${book}: بلا رقم مطبوع`);
    } else {
      footersChecked += 1;
      if (footer !== book) problems.push(`صفحة الكتاب ${book}: رقمها المطبوع لا يطابقها (وجدنا ${footer})`);
    }

    const head = normalize(runningHeadFor(book));
    if (!normalize(text).includes(head)) {
      problems.push(`صفحة الكتاب ${book}: لا تحمل ترويسة الكتاب «${runningHeadFor(book)}»`);
    }
  }

  // 3. every lesson's own first page prints that lesson's head.
  for (const section of sections) {
    for (const lesson of section.lessons) {
      const page = loadBookPage(lesson.bookFrom);
      if (!page) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        continue;
      }
      if (!normalize(page).toLowerCase().includes(normalize(lesson.printedHead).toLowerCase())) {
        problems.push(`الدرس ${lesson.key}: صفحة ${lesson.bookFrom} لا تطبع عنوانه «${lesson.printedHead}»`);
      }
    }
  }

  // 4. every content page is owned by exactly one lesson.
  const owners = new Map<number, string[]>();
  for (const r of allLessonRanges()) {
    for (let p = r.from; p <= r.to; p++) {
      const list = owners.get(p) ?? [];
      list.push(r.key);
      owners.set(p, list);
    }
  }
  for (const book of printedPages) {
    const list = owners.get(book) ?? [];
    if (list.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: ${list.length === 0 ? "لا يملكها أي درس" : `يملكها أكثر من درس (${list.join("، ")})`}`);
    }
  }

  // 5. the pages tile the term exactly.
  const expected = EGYPT_ENGLISH2_G10_T1_BOOK_END - EGYPT_ENGLISH2_G10_T1_BOOK_START + 1;
  if (printedPages.size !== expected) {
    problems.push(`عدد صفحات المحصود ${printedPages.size} بينما المتوقع ${expected} (${EGYPT_ENGLISH2_G10_T1_BOOK_START}–${EGYPT_ENGLISH2_G10_T1_BOOK_END})`);
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}
