// Egypt Secondary-1 (Grade 10) English, first term — OFFICIAL curriculum.
//
// The first term IS the Ministry textbook (`english-g10-t1`, 2026/2027 MoE
// edition, 172 scan pages, all OCR'd). This file is the book's table: the
// printed «Start Smart» bridge, the six units of its Contents, and the two
// reviews that sit around them, each with the printed lesson heads and the exact
// book pages they occupy. It is the single source of truth the seeder and the
// stage both read; the self-checks at the bottom prove the page mapping against
// the scan, page by page.
//
// THE OFFSET IS ZERO — book page = scan page
// Unlike the Prep books, this one prints its own page number on the page: scan
// page 9 prints «9», scan 12 prints «12», scan 99 prints «99». A book page N is
// therefore scan page N (`BOOK_TO_PDF_OFFSET = 0`), and each content page also
// carries its section's running head — «12 · Unit 1 · Egypt's Heritage» at the
// foot, or «25 · Unit 2 · Hands Help, Hearts Care» at the head — so the mapping
// is read back from the book itself, not assumed.
//
// FRONT MATTER AND BACK MATTER ARE NOT THE TERM
// Scan pages 1–8 are the cover, the ownership page, the Contents, the Ministry
// message and the scope-and-sequence grid; scan page 100 is the copyright page.
// None of them is a lesson. The term runs from «Start Smart» (scan 9) to the end
// of «Review 2» (scan 99): `EGYPT_ENGLISH_G10_T1_BOOK_START`/`_END` are exactly
// those two pages, and the tiling assertion proves nothing in between is left
// unreachable.
//
// THE NOVEL IS A SECOND, SEPARATELY-PAGINATED BOOKLET (see the appendix below)
// «The Old Man and the Sea» is bound in after the term (scan pages 102–171) but
// its page numbers restart at 3 and reach 69 — numbering this book's single
// offset cannot express alongside the course's 9–99. It is therefore recorded in
// `EGYPT_ENGLISH_G10_T1_APPENDIX` and stays outside the tiled ranges until a
// later phase teaches it as its own part. Nothing about it is guessed here.
//
// EACH LESSON'S CONCEPTS ARE ITS UNIT'S PRINTED OUTCOMES, BY SKILL
// The book prints no per-lesson objectives: its «Learning Outcomes» sit on the
// unit opener, grouped by skill (Reading / Listening / Speaking / Language /
// Writing). Every unit follows the same five-lesson rhythm, which the printed
// section labels on the lesson pages confirm — L1 Reading + Speaking, L2
// Listening + Speaking, L3 Listening + Language, L4 Reading, L5 Writing. Each
// lesson therefore carries the verbatim outcomes of the skills it teaches, so
// the tutor's roadmap is focused and still printed in the book word for word.
// The full outcome set of every unit is reproduced below.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ scan page index N (verified: scan 9 prints «9»). */
export const BOOK_TO_PDF_OFFSET = 0;

/** First printed content page of the term — the «Start Smart» bridge. */
export const EGYPT_ENGLISH_G10_T1_BOOK_START = 9;

/** Last printed content page — the closing page of «Review 2». */
export const EGYPT_ENGLISH_G10_T1_BOOK_END = 99;

/**
 * Back matter bound in after the term, outside the tiled unit ranges. The novel
 * is its own booklet with its own page numbers, so it is described here rather
 * than tiled into the course (whose pages are 9–99). Kept as a fact about the
 * scan, not a lesson.
 */
export const EGYPT_ENGLISH_G10_T1_APPENDIX = {
  /**
   * «The Old Man and the Sea» — a complete booklet bound after the term. Its
   * cover is scan 102–103, its own page 3 (the Introduction) is scan 105, and
   * its last printed page 69 is scan 171. Its printed page = scan page − 102.
   */
  novel: { scanFrom: 102, scanTo: 171, printedFrom: 3, printedTo: 69 },
} as const;

/** One lesson of the book — becomes one lesson in the app tree. */
export interface EnglishG10T1Lesson {
  /** App-addressable key, e.g. "1-1" (unit 1, lesson 1) or "review1-1". */
  key: string;
  /** Full app-facing lesson title, e.g. "Lesson 1: Taking Pride in Our Beloved Egypt". */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`), e.g. "Where Pride Begins" or "Lesson 5".
   */
  printedHead: string;
  /** First printed book page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed outcomes for the skill(s) this lesson teaches. */
  concepts: string[];
}

/** One printed section of the book — a unit, a review, or the Start Smart bridge. */
export interface EnglishG10T1Section {
  /** Internal key: "start", "1"…"6", "review1", "review2". */
  key: string;
  kind: "start" | "unit" | "review";
  /** Section title as printed on its first page / in the Contents. */
  title: string;
  /**
   * The section's running head, as the pages print it. Each content page must
   * carry it (`assertTreeMatchesTheBook`); unit openers print theirs in a
   * scrambled layout, so they are exempt.
   */
  footerTitle: string;
  /** First printed page of the section. */
  bookFrom: number;
  /** Last printed page of the section. */
  bookTo: number;
  lessons: EnglishG10T1Lesson[];
}

// ---------------------------------------------------------------------------
// The printed «Learning Outcomes» of each unit, verbatim, grouped by skill.
// ---------------------------------------------------------------------------

/** Unit 1 — Egypt's Heritage (opener: book page 11). */
const U1 = {
  reading: [
    "Identify gist in a text about Egypt's heritage",
    "Recognize specific detail in a text about Egypt's heritage",
  ],
  listening: ["Identify the main ideas from audio texts about cultural heritage and its preservation"],
  speaking: [
    "Describe a longer, ongoing action in the past using the Past Continuous and a shorter action in past simple.",
  ],
  language: [
    "Use the past simple for completed past actions",
    "Use the past continuous to show that an action was in progress",
  ],
  writing: [
    'Write a short narrative paragraph about "a strange day in my life" using past simple and past continuous',
  ],
};

/** Unit 2 — Hands Help, Hearts Care (opener: book page 24). */
const U2 = {
  reading: [
    "Reading short texts about helping others and community",
    "Identify key details of a text about volunteering and serving communities",
  ],
  listening: ["Identify the main idea of a text", "Identify specific details of a text"],
  speaking: ["Expressing varied social roles in community service"],
  language: ["Using modal verbs for suggestion, advice, invitations and prohibition"],
  writing: ["Writing a descriptive essay"],
};

/** Unit 3 — Truth Vs. Lies (opener: book page 36). */
const U3 = {
  reading: [
    "Reading short texts and conversations about: Truth trap",
    "Reading short texts and conversations about: False news and ideas",
  ],
  listening: ["Listening to a text about wise choice in a world full of traps"],
  speaking: [
    "Talking about real-life and online situations",
    "Giving advice for a friend who is in a trouble",
  ],
  language: ["Conditional zero, first, and second"],
  writing: ["A paragraph about fake news and fake platforms"],
};

/** Unit 4 — Save and Shine (opener: book page 57). */
const U4 = {
  reading: [
    "An article about how to go green in industry",
    "Identify key details of a text about the importance of clean energy",
  ],
  listening: ["A community campaign"],
  speaking: ["A debate about the importance of green industry"],
  language: ["Verbs + (inf. or –ing) forms"],
  writing: ["Write a formal email"],
};

/** Unit 5 — Using Technology at Schools (opener: book page 69). */
const U5 = {
  reading: [
    "Analyze a text to identify how learning a foreign language can open new cultures and opportunities",
    "Identify specific examples of how technology aids in language acquisition and learning",
    "Infer the meaning of specialized vocabulary (e.g., fluency, tolerance, perspectives) from context",
  ],
  listening: [
    "Extract specific details from an audio track about the journey of a multilingual student",
    "Identify the main idea of a text about students and technology",
    "Distinguish between correct and incorrect statements based on listening text",
  ],
  speaking: [
    "Discuss the benefits of learning a foreign language and how it helps students become global citizens",
    "Engage in a role-play using conditional sentences to ask and answer questions about language learning",
    "Express opinions on how technology, like AI, can assist in language learning",
  ],
  language: [
    'Correctly use quantifiers such as "some, any, much, many, a few, and a little" with both countable and uncountable nouns',
    'Distinguish between the uses of "some" and "any" in affirmative statements, questions, and offers',
    "Identify and correct mistakes in sentences involving countable and uncountable nouns",
  ],
  writing: ["Write an essay about how learning a foreign language can help students"],
};

/** Unit 6 — Job Hunting (opener: book page 80). */
const U6 = {
  reading: [
    "Analyze texts to identify the main ideas about the modern job market, including digital platforms and networking",
    "Infer the meaning of specialized vocabulary (e.g., resume, polished, footprint, generic) from context clues within an article",
    "Identify the key sections and purpose of a resume or Curriculum Vitae (CV)",
  ],
  listening: [
    "Identify key ideas from a career coach's talk",
    "Recognize specific advice from a career coach's talk",
    "Extract details about skills, opportunities, and career advice from an audio track",
  ],
  speaking: [
    "Express opinions on various aspects of job hunting, such as the importance of grades versus experience",
    "Engage in role-play scenarios, such as a job search simulation or a mock interview, to practice professional communication",
    "Apply interview strategies like the STAR Method to answer behavioral questions effectively",
  ],
  language: [
    'Correctly use definite and indefinite articles ("a", "an", "the") and know when no article is needed',
    "Identify and correct grammatical mistakes related to article usage in sentences",
    "Use action verbs to describe job experience in a CV",
  ],
  writing: [
    "Compose a well-structured and professional CV, including personal information, education, and relevant skills",
    "Draft a short paragraph about job hunting or internships",
    "Summarize an article or talk about volunteering in a concise manner",
  ],
};

/**
 * Both «Review» sections print the same six parts (A–F), so their single lesson
 * carries the same printed section list.
 */
const REVIEW_CONCEPTS = [
  "A. Vocabulary: Choose the (Two) correct answers out of the FIVE (5) options given",
  "B. Language: Choose the correct answer from a, b, c, or d",
  "C. Translation: Choose the correct English translation from a, b, c, or d",
  "D. Reading Comprehension: Read the passage, then choose the correct answer",
  "E. Writing: Choose the correct answer, then write a text of (120 – 150) words",
  "F. The Novel: Answer the following questions",
];

/**
 * The book in printed order: Start Smart (9–10), Units 1–3 (11–47), Review 1
 * (48–56), Units 4–6 (57–91), Review 2 (92–99). Unit/lesson starts come from
 * each printed «LESSON n» head; the outcomes come from each unit opener. Every
 * page is checked against the book by `assertTreeMatchesTheBook`.
 */
export const EGYPT_ENGLISH_G10_T1_SECTIONS: EnglishG10T1Section[] = [
  {
    key: "start",
    kind: "start",
    title: "Start Smart",
    footerTitle: "Start Smart",
    bookFrom: 9,
    bookTo: 10,
    lessons: [
      {
        key: "start-1",
        title: "Start Smart",
        printedHead: "Start Smart",
        bookFrom: 9,
        concepts: [
          "Read the following text, then answer the questions below",
          "Listen and answer the questions",
          "Complete the following sentences using the words in the box",
          "Rewrite the following sentences using the words in brackets to give the same meaning",
          "Write a short email of (120) words to your friend",
        ],
      },
    ],
  },
  {
    key: "1",
    kind: "unit",
    title: "Unit 1: Egypt's Heritage",
    footerTitle: "Unit 1 Egypt's Heritage",
    bookFrom: 11,
    bookTo: 23,
    lessons: [
      { key: "1-1", title: "Lesson 1: Taking Pride in Our Beloved Egypt", printedHead: "Taking Pride in Our Beloved Egypt", bookFrom: 12, concepts: [...U1.reading, ...U1.speaking] },
      { key: "1-2", title: "Lesson 2: Moments That Shaped Us", printedHead: "Moments That Shaped Us", bookFrom: 15, concepts: [...U1.listening, ...U1.speaking] },
      { key: "1-3", title: "Lesson 3: Listening", printedHead: "Listening", bookFrom: 17, concepts: [...U1.listening, ...U1.language] },
      { key: "1-4", title: "Lesson 4: Where Pride Begins", printedHead: "Where Pride Begins", bookFrom: 19, concepts: [...U1.reading] },
      { key: "1-5", title: "Lesson 5: An Essay about Technology", printedHead: "An Essay about Technology", bookFrom: 22, concepts: [...U1.writing] },
    ],
  },
  {
    key: "2",
    kind: "unit",
    title: "Unit 2: Hands Help, Hearts Care",
    footerTitle: "Unit 2 Hands Help, Hearts Care",
    bookFrom: 24,
    bookTo: 35,
    lessons: [
      { key: "2-1", title: "Lesson 1: The Warm Bread", printedHead: "The Warm Bread", bookFrom: 25, concepts: [...U2.reading, ...U2.speaking] },
      { key: "2-2", title: "Lesson 2: Planting Trees, Growing Myself", printedHead: "Planting Trees, Growing Myself", bookFrom: 28, concepts: [...U2.listening, ...U2.speaking] },
      { key: "2-3", title: "Lesson 3: Voluntary work", printedHead: "Voluntary work", bookFrom: 30, concepts: [...U2.listening, ...U2.language] },
      { key: "2-4", title: "Lesson 4: Serving the Community in Times of Danger", printedHead: "Serving the Community in Times of Danger", bookFrom: 32, concepts: [...U2.reading] },
      { key: "2-5", title: "Lesson 5: Show, Don't Just Tell", printedHead: "Show, Don't Just Tell", bookFrom: 34, concepts: [...U2.writing] },
    ],
  },
  {
    key: "3",
    kind: "unit",
    title: "Unit 3: Truth Vs. Lies",
    footerTitle: "Unit 3 Truth Vs. Lies",
    bookFrom: 36,
    bookTo: 47,
    lessons: [
      { key: "3-1", title: "Lesson 1: When Appearances lie", printedHead: "When Appearances lie", bookFrom: 37, concepts: [...U3.reading, ...U3.speaking] },
      { key: "3-2", title: "Lesson 2: Wise Choices in a World Full of Traps", printedHead: "Wise Choices in a World Full of Traps", bookFrom: 40, concepts: [...U3.listening, ...U3.speaking] },
      { key: "3-3", title: "Lesson 3: Fake Appearance", printedHead: "Fake Appearance", bookFrom: 42, concepts: [...U3.listening, ...U3.language] },
      { key: "3-4", title: "Lesson 4: The Truth Trap", printedHead: "The Truth Trap", bookFrom: 44, concepts: [...U3.reading] },
      { key: "3-5", title: "Lesson 5: Essay Writing", printedHead: "Lesson 5", bookFrom: 46, concepts: [...U3.writing] },
    ],
  },
  {
    key: "review1",
    kind: "review",
    title: "Review 1",
    footerTitle: "Review 1",
    bookFrom: 48,
    bookTo: 56,
    lessons: [
      {
        key: "review1-1",
        title: "Review 1",
        printedHead: "Review 1",
        bookFrom: 48,
        concepts: [...REVIEW_CONCEPTS],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    title: "Unit 4: Save and Shine",
    footerTitle: "Unit 4 Save and Shine",
    bookFrom: 57,
    bookTo: 68,
    lessons: [
      { key: "4-1", title: "Lesson 1", printedHead: "Lesson 1", bookFrom: 58, concepts: [...U4.reading, ...U4.speaking] },
      { key: "4-2", title: "Lesson 2: One Bag at a Time", printedHead: "One Bag at a Time", bookFrom: 61, concepts: [...U4.listening, ...U4.speaking] },
      { key: "4-3", title: "Lesson 3: Small Actions Can Make a Difference", printedHead: "Small Actions Can Make a Difference", bookFrom: 63, concepts: [...U4.listening, ...U4.language] },
      { key: "4-4", title: "Lesson 4: Helping our community", printedHead: "Helping our community", bookFrom: 65, concepts: [...U4.reading] },
      { key: "4-5", title: "Lesson 5: Formal Email Writing", printedHead: "Formal Email Writing", bookFrom: 68, concepts: [...U4.writing] },
    ],
  },
  {
    key: "5",
    kind: "unit",
    title: "Unit 5: Using Technology at Schools",
    footerTitle: "Unit 5 Using Technology at Schools",
    bookFrom: 69,
    bookTo: 79,
    lessons: [
      { key: "5-1", title: "Lesson 1: Why Learning a Foreign Language Matters", printedHead: "Why Learning a Foreign Language Matters", bookFrom: 70, concepts: [...U5.reading, ...U5.speaking] },
      { key: "5-2", title: "Lesson 2: My Journey as a Multilingual", printedHead: "My Journey as a Multilingual", bookFrom: 73, concepts: [...U5.listening, ...U5.speaking] },
      { key: "5-3", title: "Lesson 3: Modern Technology and Learning Foreign Languages", printedHead: "Modern Technology and Learning Foreign Languages", bookFrom: 75, concepts: [...U5.listening, ...U5.language] },
      { key: "5-4", title: "Lesson 4: Ramy's Journey with English", printedHead: "Ramy's Journey with English", bookFrom: 77, concepts: [...U5.reading] },
      { key: "5-5", title: "Lesson 5: Informal Email", printedHead: "Informal Email", bookFrom: 79, concepts: [...U5.writing] },
    ],
  },
  {
    key: "6",
    kind: "unit",
    title: "Unit 6: Job Hunting",
    footerTitle: "Unit 6 Job Hunting",
    bookFrom: 80,
    bookTo: 91,
    lessons: [
      { key: "6-1", title: "Lesson 1: The Modern Job Hunt", printedHead: "The Modern Job Hunt", bookFrom: 81, concepts: [...U6.reading, ...U6.speaking] },
      { key: "6-2", title: "Lesson 2: Job Interview", printedHead: "Job Interview", bookFrom: 84, concepts: [...U6.listening, ...U6.speaking] },
      { key: "6-3", title: "Lesson 3: Career Decisions", printedHead: "Career Decisions", bookFrom: 86, concepts: [...U6.listening, ...U6.language] },
      { key: "6-4", title: "Lesson 4: My Resume", printedHead: "My Resume", bookFrom: 88, concepts: [...U6.reading] },
      { key: "6-5", title: "Lesson 5: Curriculum Vitae (CV)", printedHead: "Curriculum Vitae (CV)", bookFrom: 90, concepts: [...U6.writing] },
    ],
  },
  {
    key: "review2",
    kind: "review",
    title: "Review 2",
    footerTitle: "Review 2",
    bookFrom: 92,
    bookTo: 99,
    lessons: [
      {
        key: "review2-1",
        title: "Review 2",
        printedHead: "Review 2",
        bookFrom: 92,
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
 * lesson — the unit opener) or its own start page, up to the page before the
 * next lesson starts, or the section's last page for its last lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_ENGLISH_G10_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ENGLISH_G10_T1_SECTIONS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * Book-wide appendix pages a lesson points to but does not own. This book has
 * none: its listening lessons print their exercises and the book prints no
 * audioscripts, so every lesson's document is exactly its own range. Kept as a
 * function so the seeder and the stage share one shape across all the books.
 */
export function allLessonExtras(): Map<string, number[]> {
  return new Map<string, number[]>();
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
  "english-g10-t1",
);

/**
 * The OCR provider answers a truly blank page with a short sentence instead of
 * an empty string. It means "no text", not content.
 */
const NO_TEXT = /لا يوجد نص/;

/** OCR text of one printed book page, or "" when the page was not OCR'd. */
export function loadBookPage(book: number): string {
  const pdf = book + BOOK_TO_PDF_OFFSET;
  const file = path.join(OCR_DIR, `pages-${String(pdf).padStart(3, "0")}.txt`);
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

/** True when a content page carries real text (not the blank-page placeholder). */
function pageHasText(book: number): boolean {
  const text = loadBookPage(book);
  return text.length > 0 && !NO_TEXT.test(text);
}

/** Loads + joins the OCR text of a book-page range into one lesson document. */
export function loadBookRange(fromBook: number, toBook: number): string {
  const parts: string[] = [];
  for (let book = fromBook; book <= toBook; book++) {
    const text = loadBookPage(book);
    if (!text) continue;
    parts.push(`[صفحة الكتاب ${book}]`);
    parts.push(text);
  }
  return parts.join("\n\n");
}

/** Full document payload for one lesson: its owned printed range. */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const range = lessonBookRange(sectionIndex, lessonIndex);
  return loadBookRange(range.from, range.to);
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/** Strips everything but letters and digits, so OCR spacing cannot break a match. */
function normalize(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Page-number candidates a content page prints in its running head or foot.
 *
 * This book lays its running head out differently from the Prep books: the
 * number may sit at the top («25 · Unit 2 · …») or at the bottom («… · 12 ·
 * Unit 1 · Egypt's Heritage»), and the heading itself may wrap across several
 * lines. What every content page does print is the bare number, alone on its
 * own line, next to that heading. So the candidates are the lone 1–3 digit
 * tokens in the first three and last eight lines — the page's furniture, never
 * its body (whose enumerations carry a trailing dot and so never match).
 */
export function footerCandidates(book: number): number[] {
  const text = loadBookPage(book);
  if (!text) return [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const region = [...lines.slice(0, 3), ...lines.slice(-8)];
  const numbers = new Set<number>();
  for (const line of region) {
    if (/^\d{1,3}$/.test(line)) numbers.add(Number(line));
  }
  return [...numbers].sort((a, b) => a - b);
}

/**
 * The book number a content page prints in its running head/foot, or null when
 * it prints none. Returns the page's own number when it is among the candidates,
 * otherwise the largest candidate (so a wrong page still reports a number and
 * the caller can see the mismatch). Unit openers print no page number at all —
 * the only number near their head is the unit numeral — so they return null-ish
 * values the caller filters out.
 */
export function printedFooter(book: number): number | null {
  const candidates = footerCandidates(book);
  if (candidates.length === 0) return null;
  return candidates.includes(book) ? book : candidates[candidates.length - 1]!;
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its section, sections tile the book without gaps or overlaps, and the first
 * section starts where the Contents says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_ENGLISH_G10_T1_SECTIONS;

  sections.forEach((section, si) => {
    if (section.lessons.length === 0) problems.push(`القسم ${section.key}: بلا دروس`);
    if (!section.footerTitle.trim()) problems.push(`القسم ${section.key}: بلا عنوان فوتر`);
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
  if (first.bookFrom !== EGYPT_ENGLISH_G10_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من ${EGYPT_ENGLISH_G10_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last.bookTo !== EGYPT_ENGLISH_G10_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند ${EGYPT_ENGLISH_G10_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. every content page carries real OCR text and prints its own book number
 *     in its running head/foot (the six unit openers print no page number — the
 *     only numeral near their head is the unit numeral — so they are exempt);
 *  2. every content page carries its section's running head (unit openers print
 *     theirs scrambled across the page — exempt);
 *  3. every lesson's own first page prints that lesson's head;
 *  4. every printed page is owned by exactly one lesson — no page falls between
 *     two lessons and is unreachable;
 *  5. the pages tile the term [START, END] with no gap.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const sections = EGYPT_ENGLISH_G10_T1_SECTIONS;

  /** Unit openers print no page number — the only numeral near their head is the unit number. */
  const unitOpeners = new Set(sections.filter((s) => s.kind === "unit").map((s) => s.bookFrom));
  const sectionByPage = new Map<number, EnglishG10T1Section>();
  for (const section of sections) {
    for (let p = section.bookFrom; p <= section.bookTo; p++) sectionByPage.set(p, section);
  }

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  let footersChecked = 0;

  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ENGLISH_G10_T1_BOOK_START || book > EGYPT_ENGLISH_G10_T1_BOOK_END) continue;
    printedPages.add(book);

    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    if (!pageHasText(book)) {
      problems.push(`صفحة الكتاب ${book}: صفحة فارغة بلا نص`);
      continue;
    }

    const footer = printedFooter(book);
    if (footer !== null) {
      footersChecked += 1;
      if (footer !== book && !unitOpeners.has(book)) {
        problems.push(`صفحة الكتاب ${book}: رقمها المطبوع لا يطابقها (وجدنا ${footer})`);
      }
    }

    const section = sectionByPage.get(book);
    if (!section) {
      problems.push(`صفحة الكتاب ${book}: لا تنتمي لأي قسم`);
      continue;
    }
    if (!unitOpeners.has(book)) {
      const head = normalize(section.footerTitle).toLowerCase();
      if (!normalize(loadBookPage(book)).toLowerCase().includes(head)) {
        problems.push(`صفحة الكتاب ${book}: لا تحمل عنوان قسمها «${section.footerTitle}»`);
      }
    }
  }

  if (footersChecked === 0) problems.push("لم يُعثر على أي رقم مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its head.
  for (const section of sections) {
    for (const lesson of section.lessons) {
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        continue;
      }
      if (!normalize(opener).toLowerCase().includes(normalize(lesson.printedHead).toLowerCase())) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع عنوانه «${lesson.printedHead}»`);
      }
    }
  }

  // 4. every printed page is owned by exactly one lesson.
  const ownerPages = new Map<number, string[]>();
  for (const { key, from, to } of allLessonRanges()) {
    for (let p = from; p <= to; p++) {
      const list = ownerPages.get(p) ?? [];
      list.push(key);
      ownerPages.set(p, list);
    }
  }
  for (const book of printedPages) {
    const owners = ownerPages.get(book) ?? [];
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: ${owners.length === 0 ? "لا يملكها أي درس" : `يملكها أكثر من درس (${owners.join(", ")})`}`);
    }
  }

  const expected = EGYPT_ENGLISH_G10_T1_BOOK_END - EGYPT_ENGLISH_G10_T1_BOOK_START + 1;
  if (printedPages.size !== expected) {
    problems.push(`عدد صفحات المحصود ${printedPages.size} بينما المتوقع ${expected} (${EGYPT_ENGLISH_G10_T1_BOOK_START}–${EGYPT_ENGLISH_G10_T1_BOOK_END})`);
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}

