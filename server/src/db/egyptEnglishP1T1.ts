// Egypt Preparatory-1 (Grade 7) English, first term («كتاب الوزارة»), Ministry
// 2026/2027 edition.
//
// The curriculum `eg-g7-english` is rebuilt from the Ministry textbook
// `English_Prep1_T1.pdf` (113 scan pages, all OCR'd). This module is the single
// source of truth for its structure: the six units of the printed «Contents»,
// the two printed reviews around them, and the «Start Smart» bridge that
// precedes unit 1 — each with its printed lessons and its printed page.
//
// Page mapping (verified against the scan's printed footers):
//   bookPage = pdfPage − 1   (book page 14 = PDF page 15, the unit 1 Lesson 1)
// Every numbered content page carries its number in the running foot, either
// before the section title («14 Unit 1 Life in a Digital World») or after it
// («Unit 1 Life in a Digital World 15»), which fixes the offset at 1 and proves
// the mapping page by page. Unit openers print no footer.
//
// WHY THE APP'S LESSON IS THE BOOK'S «LESSON», NOT ITS «UNIT»
// The book prints «LESSON 1» … «LESSON 6» at the head of every lesson (its unit
// opener is a separate Learning Outcomes page, and each unit closes on an
// Assessment Corner page followed by a My Self-Reflection page). The app lesson
// is therefore the printed lesson: a unit's opener rides with its first lesson
// and its Assessment Corner/Self-Reflection with its last. «Start Smart»,
// «Review 1» and «Review 2» are printed sections of the book, so each is a
// top-level unit too; the reviews keep their printed «Lesson 1» and «Lesson 2»
// sub-parts.
//
// THE LESSON SHAPE OF THIS BOOK (differs from the G8 predecessor)
// Each unit follows: L1 reading, L2 listening + language (+ speaking), L3
// reading, L4 «Story Time» (the serialized story «The Magic Classroom», one
// chapter per unit), L5 writing («Before You Write»), L6 «Team-Project
// Roundtable» (the class performance project; the unit's Assessment Corner and
// My Self-Reflection pages ride with it). Every unit's lessons land on
// consecutive even book pages, two printed pages each, except L6 which takes
// three (its own pages + Assessment Corner + Self-Reflection).
//
// WHY EVERY LESSON'S CONCEPTS COME FROM ITS UNIT'S PRINTED OUTCOMES
// Unlike the Arabic-medium Ministry books, this one prints no per-lesson
// objectives: its «Learning Outcomes» sit on the unit opener, grouped by skill
// (Reading / Listening / Speaking / Language / Writing). Each lesson carries the
// verbatim outcomes of the skill(s) it actually teaches — a reading lesson the
// unit's reading outcomes, the listening lesson its listening + language
// outcomes, the writing lesson its writing outcomes, the roundtable its
// speaking outcomes — so the tutor's roadmap is focused and still printed in
// the book word for word. The full outcome set of every unit is reproduced at
// the head of that unit below. «Start Smart» and the two «Review» sections
// print no outcomes at all: their lessons carry the exercise instructions the
// pages actually print.
//
// THE BOOK'S LISTENING PASSAGES LIVE IN A BOOK-WIDE APPENDIX
// Each unit's listening lesson prints its exercises but not the audio text; the
// texts are printed in the back matter «Audioscripts» (book pages 104–107).
// Each listening lesson therefore also owns its own script page through
// `extraBookPages`, so the tutor scoped to that lesson can quote the very
// passage the book points it to. The appendix is not a lesson: it stays outside
// the tiled unit ranges. The «Glossary» (book pages 108–111) is book-wide back
// matter and is not attached to any single lesson.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.14 = PDF p.15). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed content page of the term — the «Start Smart» bridge. */
export const EGYPT_ENGLISH_P1_T1_BOOK_START = 11;

/** Last printed content page — the closing page of «Review 2». */
export const EGYPT_ENGLISH_P1_T1_BOOK_END = 103;

/** The book-wide back matter, outside the tiled unit ranges (book pages). */
export const EGYPT_ENGLISH_P1_T1_APPENDIX = {
  /** «Audioscripts» — the listening passages each lesson points to. */
  audioscripts: { from: 104, to: 107 },
  /** «Glossary» — book-wide vocabulary, not attached to one lesson. */
  glossary: { from: 108, to: 111 },
} as const;

/** One lesson of the book — becomes one lesson in the app tree. */
export interface EnglishP1T1Lesson {
  /** App-addressable key, e.g. "1-1" (unit 1, lesson 1) or "review1-2". */
  key: string;
  /** Full app-facing lesson title, e.g. "Lesson 1: A Day in My Digital Life". */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`), e.g. "A Day in My Digital Life" or "Lesson 2".
   */
  printedHead: string;
  /** First printed book page of the lesson itself (the page that prints its head). */
  bookFrom: number;
  /** The book's printed outcomes for the skill(s) this lesson teaches. */
  concepts: string[];
  /**
   * Book-wide appendix pages this lesson points to (its audioscript). Kept
   * outside the tiled unit ranges but included in the lesson's RAG document.
   */
  extraBookPages?: number[];
}

/** One printed section of the book — a unit, a review, or the Start Smart bridge. */
export interface EnglishP1T1Section {
  /** Internal key: "start", "1"…"6", "review1", "review2". */
  key: string;
  kind: "start" | "unit" | "review";
  /** Section title as printed on its first page / in the Contents. */
  title: string;
  /** The exact running-head text the section prints in its footers. */
  footerTitle: string;
  /** First printed page of the section. */
  bookFrom: number;
  /** Last printed page of the section. */
  bookTo: number;
  lessons: EnglishP1T1Lesson[];
}

// ---------------------------------------------------------------------------
// The printed «Learning Outcomes» of each unit, verbatim, grouped by skill.
// ---------------------------------------------------------------------------
// Unit openers print: Reading / Listening / Speaking / Language / Writing.

/** Unit 1 — Life in a Digital World (opener: book page 13). */
const U1 = {
  reading: [
    "Identify the main idea of a blog post about technology",
    "Identify specific details of a text about technology",
    "Use context clues to infer the meanings of words",
  ],
  listening: [
    "Identify the main idea when people talk about using digital devices",
    "Identify specific details about how people use technology",
  ],
  speaking: ["Express personal experiences and opinions about digital devices through speaking tasks"],
  language: [
    "Use grammatical structures (i.e., present simple and adverbs of frequency) to talk about digital habits",
    "Differentiate between different parts of speech (Noun, Verb, Adjective)",
  ],
  writing: ["Practice writing an email about daily routine using technology"],
};

/** Unit 2 — Learning to Learn (opener: book page 27). */
const U2 = {
  reading: [
    "Identify the main idea in texts about learning styles and tools",
    "Identify specific details about different learning strategies and methods",
    "Relate reading content to personal experiences with learning",
  ],
  listening: [
    "Identify the main idea in audio texts about learning goals and strategies",
    "Identify specific details about setting and achieving personal learning goals",
  ],
  speaking: [
    "Express personal learning styles, habits, and preferences",
    "Share and reflect on learning experiences in small groups",
  ],
  language: ["Use \"can\" accurately to describe learning abilities", "Use present continuous tense correctly"],
  writing: [
    "Write short descriptive sentences about personal learning styles and habits",
    "Write about a learning app, website, or activity",
  ],
};

/** Unit 3 — Role Models (opener: book page 41). */
const U3 = {
  reading: [
    "Identify specific details about a role model's actions and qualities",
    "Use context clues to understand vocabulary related to leadership and personal qualities",
  ],
  listening: [
    "Identify the main idea in interviews about role models and inspiring figures",
    "Identify specific details such as what a role model did, their impact, and their personal qualities",
  ],
  speaking: [
    "Talk about a personal role model using past simple and key vocabulary",
    "Discuss leadership qualities in pairs or groups",
  ],
  language: [
    "Identify and use regular and irregular past simple verbs to talk about past actions and events",
    "Use past simple to ask and answer questions in conversations / interviews",
  ],
  writing: [
    "Write a paragraph about someone students admire using past simple tense",
    "Express personal feelings and reflections about the qualities and actions of a role model",
  ],
};

/** Unit 4 — Smart Choices (opener: book page 59). */
const U4 = {
  reading: [
    "Identify the main idea and at least two specific details in a text about your choices",
    "Use context clues to understand vocabulary related to making smart choices",
  ],
  listening: [
    "Identify the main idea in conversations about making difficult choices",
    "Find specific details about options and advice in situations",
  ],
  speaking: ["Talk about personal daily choices", "Give and ask for advice using \"should\""],
  language: [
    "Identify and create first conditional sentences to talk about future possibilities",
    "Use \"should and shouldn't\" for advice",
  ],
  writing: ["Write a blog post about a personal problem"],
};

/** Unit 5 — Future Dreams (opener: book page 73). */
const U5 = {
  reading: [
    "Identify the main idea and at least two supporting details in different text types",
    "Use context clues to understand new words related to jobs and future planning",
  ],
  listening: [
    "Identify the main idea in a text about future plans and careers",
    "Identify at least two supporting details in a text about future plans and careers",
  ],
  speaking: [
    "Talk about personal future goals and describe steps to achieve them using \"going to\"",
    "Share personal dreams and give reasons in a short presentation or discussion",
  ],
  language: ['Recognize and explain future-tense structures with "going to" in context'],
  writing: ["Write a structured review about a dream job and steps to achieve it"],
};

/** Unit 6 — Global Citizens (opener: book page 87). */
const U6 = {
  reading: [
    "Identify the main idea and specific details in texts about global citizenship and community rules",
    "Use context clues to understand new vocabulary related to global responsibility",
  ],
  listening: [
    "Identify the main idea and specific details in spoken texts about community or environmental topics",
    "Infer the meaning of key expressions from context",
  ],
  speaking: [
    "Describe good citizen behaviors using correct vocabulary and structures",
    "Explain community or school rules clearly",
  ],
  language: ['Use "must" and "mustn\'t" accurately to express rules and obligations'],
  writing: ["Write a social media post on a list of rules for being a good citizen using target structures and vocabulary"],
};

/**
 * The book in printed order: Start Smart (11–12), Units 1–3 (13–54), Review 1
 * (55–58), Units 4–6 (59–100), Review 2 (101–103). Unit/lesson starts come from
 * each printed «LESSON n» head; the outcomes come from each unit opener. Every
 * page is checked against the book by `assertTreeMatchesTheBook`.
 *
 * Each unit's lessons start on consecutive even book pages (14, 16, 18, 20, 22,
 * 24 for unit 1), two printed pages each; only the last lesson of a unit takes
 * three pages so the printed Assessment Corner and My Self-Reflection ride with
 * it.
 */
export const EGYPT_ENGLISH_P1_T1_SECTIONS: EnglishP1T1Section[] = [
  {
    key: "start",
    kind: "start",
    title: "Start Smart",
    footerTitle: "Start Smart",
    bookFrom: 11,
    bookTo: 12,
    lessons: [
      {
        key: "start-1",
        title: "Start Smart",
        printedHead: "Start Smart",
        bookFrom: 11,
        concepts: [
          "Complete the following dialog",
          "Choose the correct answer from a, b, c, or d",
          "Fill in the blank with the correct word from the box",
          "Choose the correct answer from a, b, c, or d",
          "Reorder the words to make correct sentences",
          'Write a paragraph of (80-100) words using present simple and present continuous to describe yourself',
        ],
      },
    ],
  },
  {
    key: "1",
    kind: "unit",
    title: "Unit 1: Life in a Digital World",
    footerTitle: "Unit 1 Life in a Digital World",
    bookFrom: 13,
    bookTo: 26,
    lessons: [
      { key: "1-1", title: "Lesson 1: A Day in My Digital Life", printedHead: "A Day in My Digital Life", bookFrom: 14, concepts: [...U1.reading] },
      { key: "1-2", title: "Lesson 2: How We Use Technology", printedHead: "How We Use Technology", bookFrom: 16, concepts: [...U1.listening, ...U1.language], extraBookPages: [104] },
      { key: "1-3", title: "Lesson 3: Digital Devices", printedHead: "Digital Devices", bookFrom: 18, concepts: [...U1.reading] },
      { key: "1-4", title: "Lesson 4: Story Time", printedHead: "Story Time", bookFrom: 20, concepts: [...U1.reading] },
      { key: "1-5", title: "Lesson 5: An Email to a Friend", printedHead: "An Email to a Friend", bookFrom: 22, concepts: [...U1.writing], extraBookPages: [104] },
      { key: "1-6", title: "Lesson 6: Team-Project Roundtable", printedHead: "Team-Project Roundtable", bookFrom: 24, concepts: [...U1.speaking] },
    ],
  },
  {
    key: "2",
    kind: "unit",
    title: "Unit 2: Learning to Learn",
    footerTitle: "Unit 2 Learning to Learn",
    bookFrom: 27,
    bookTo: 40,
    lessons: [
      { key: "2-1", title: "Lesson 1: My Learning Journey", printedHead: "My Learning Journey", bookFrom: 28, concepts: [...U2.reading] },
      { key: "2-2", title: "Lesson 2: Learning Challenges and Solutions", printedHead: "Learning Challenges and Solutions", bookFrom: 30, concepts: [...U2.listening, ...U2.language], extraBookPages: [104, 105] },
      { key: "2-3", title: "Lesson 3: Benefits of Learning Together", printedHead: "Benefits of Learning Together", bookFrom: 32, concepts: [...U2.reading] },
      { key: "2-4", title: "Lesson 4: Story Time", printedHead: "Story Time", bookFrom: 34, concepts: [...U2.reading] },
      { key: "2-5", title: "Lesson 5: My Learning Plan", printedHead: "My Learning Plan", bookFrom: 36, concepts: [...U2.writing] },
      { key: "2-6", title: "Lesson 6: Team-Project Roundtable", printedHead: "Team-Project Roundtable", bookFrom: 38, concepts: [...U2.speaking] },
    ],
  },
  {
    key: "3",
    kind: "unit",
    title: "Unit 3: Role Models",
    footerTitle: "Unit 3 Role Models",
    bookFrom: 41,
    bookTo: 54,
    lessons: [
      { key: "3-1", title: "Lesson 1: An Egyptian Hero", printedHead: "An Egyptian Hero", bookFrom: 42, concepts: [...U3.reading] },
      { key: "3-2", title: "Lesson 2: Heroes and Role Models", printedHead: "Heroes and Role Models", bookFrom: 44, concepts: [...U3.listening, ...U3.language], extraBookPages: [105] },
      { key: "3-3", title: "Lesson 3: A Great Egyptian Thinker", printedHead: "A Great Egyptian Thinker", bookFrom: 46, concepts: [...U3.reading] },
      { key: "3-4", title: "Lesson 4: Story Time", printedHead: "Story Time", bookFrom: 48, concepts: [...U3.reading] },
      { key: "3-5", title: "Lesson 5: A Hero Who Made a Difference", printedHead: "A Hero Who Made a Difference", bookFrom: 50, concepts: [...U3.writing] },
      { key: "3-6", title: "Lesson 6: Team-Project Roundtable", printedHead: "Team-Project Roundtable", bookFrom: 52, concepts: [...U3.speaking] },
    ],
  },
  {
    key: "review1",
    kind: "review",
    title: "Review 1",
    footerTitle: "Review 1",
    bookFrom: 55,
    bookTo: 58,
    lessons: [
      {
        key: "review1-1",
        title: "Review 1: Lesson 1",
        printedHead: "Lesson 1",
        bookFrom: 55,
        concepts: [
          "Complete the sentences with words from the list below",
          "Listen to the audio text and answer the following questions",
          "Listen again and put T (True) or F (False)",
          "Listen and answer the questions below",
          "Write an email of (80-100) words to your teacher, explaining your difficulty and asking for help",
        ],
        extraBookPages: [105],
      },
      {
        key: "review1-2",
        title: "Review 1: Lesson 2",
        printedHead: "Lesson 2",
        bookFrom: 56,
        concepts: [
          "Classify the following words into the correct categories",
          "Complete the following sentences using words from the list below",
          "Complete the dialog between Ahmed and Mariam",
          "Read and circle the correct word",
          "Write a short biography of (80-100) words about someone you admire",
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    title: "Unit 4: Smart Choices",
    footerTitle: "Unit 4 Smart Choices",
    bookFrom: 59,
    bookTo: 72,
    lessons: [
      { key: "4-1", title: "Lesson 1: Think Before You Choose ?", printedHead: "Think Before You Choose ?", bookFrom: 60, concepts: [...U4.reading] },
      { key: "4-2", title: "Lesson 2: Decisions and Consequences", printedHead: "Decisions and Consequences", bookFrom: 62, concepts: [...U4.listening, ...U4.language], extraBookPages: [106] },
      { key: "4-3", title: "Lesson 3: An Interview with an Athlete", printedHead: "An Interview with an Athlete", bookFrom: 64, concepts: [...U4.reading] },
      { key: "4-4", title: "Lesson 4: Story Time", printedHead: "Story Time", bookFrom: 66, concepts: [...U4.reading] },
      { key: "4-5", title: "Lesson 5: Asking for and Giving Advice", printedHead: "Asking for and Giving Advice", bookFrom: 68, concepts: [...U4.writing] },
      { key: "4-6", title: "Lesson 6: Team-Project Roundtable", printedHead: "Team-Project Roundtable", bookFrom: 70, concepts: [...U4.speaking] },
    ],
  },
  {
    key: "5",
    kind: "unit",
    title: "Unit 5: Future Dreams",
    footerTitle: "Unit 5 Future Dreams",
    bookFrom: 73,
    bookTo: 86,
    lessons: [
      { key: "5-1", title: "Lesson 1: Discover Your Future!", printedHead: "Discover Your Future!", bookFrom: 74, concepts: [...U5.reading] },
      { key: "5-2", title: "Lesson 2: Listening", printedHead: "Listening", bookFrom: 76, concepts: [...U5.listening, ...U5.language], extraBookPages: [107] },
      { key: "5-3", title: "Lesson 3: My plan for a future career", printedHead: "My plan for a future career", bookFrom: 78, concepts: [...U5.reading] },
      { key: "5-4", title: "Lesson 4: Story Time", printedHead: "Story Time", bookFrom: 80, concepts: [...U5.reading] },
      { key: "5-5", title: "Lesson 5: My Dream Job!", printedHead: "My Dream Job!", bookFrom: 82, concepts: [...U5.writing] },
      { key: "5-6", title: "Lesson 6: Team-Project Roundtable", printedHead: "Team-Project Roundtable", bookFrom: 84, concepts: [...U5.speaking] },
    ],
  },
  {
    key: "6",
    kind: "unit",
    title: "Unit 6: Global Citizens",
    footerTitle: "Unit 6 Global Citizens",
    bookFrom: 87,
    bookTo: 100,
    lessons: [
      { key: "6-1", title: "Lesson 1: Being a Global Citizen", printedHead: "Being a Global Citizen", bookFrom: 88, concepts: [...U6.reading] },
      { key: "6-2", title: "Lesson 2: Global Citizen Talk", printedHead: "Global Citizen Talk", bookFrom: 90, concepts: [...U6.listening, ...U6.language], extraBookPages: [107] },
      { key: "6-3", title: "Lesson 3: Ocean Circle", printedHead: "Ocean Circle", bookFrom: 92, concepts: [...U6.reading] },
      { key: "6-4", title: "Lesson 4: Story Time", printedHead: "Story Time", bookFrom: 94, concepts: [...U6.reading] },
      { key: "6-5", title: "Lesson 5: Let's Make a Difference", printedHead: "Let's Make a Difference", bookFrom: 96, concepts: [...U6.writing] },
      { key: "6-6", title: "Lesson 6: Team-Project Roundtable", printedHead: "Team-Project Roundtable", bookFrom: 98, concepts: [...U6.speaking] },
    ],
  },
  {
    key: "review2",
    kind: "review",
    title: "Review 2",
    footerTitle: "Review 2",
    bookFrom: 101,
    bookTo: 103,
    lessons: [
      {
        key: "review2-1",
        title: "Review 2: Lesson 1",
        printedHead: "Lesson 1",
        bookFrom: 101,
        concepts: [
          "Listen and answer the following",
          "Choose the correct answer from a, b, c or d",
          "Complete the sentences with words from the list below",
          "Read the following passage and answer the questions below",
        ],
        extraBookPages: [107],
      },
      {
        key: "review2-2",
        title: "Review 2: Lesson 2",
        printedHead: "Lesson 2",
        bookFrom: 102,
        concepts: [
          "Read and complete the text with words in the box",
          "Listen and answer the questions below",
          "Write an email of (80-100) words to a friend about your dream job",
          "Complete the dialog between Maya and Samir",
          "Circle the correct answer",
          "Write a biography of (80-100) words about a person who has made a significant positive impact on your life",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page ranges
// ---------------------------------------------------------------------------

/**
 * Book-page span a lesson owns: from the section's first page (for its first
 * lesson — the unit opener, or the review's own heading page) or its own start
 * page, up to the page before the next lesson starts, or the section's last page
 * for its last lesson.
 */
export function lessonBookRange(sectionIndex: number, lessonIndex: number): { from: number; to: number } {
  const section = EGYPT_ENGLISH_P1_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ENGLISH_P1_T1_SECTIONS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * The appendix page(s) each lesson points to, keyed by the lesson key
 * (`1-2` → `[104]`). The listening lessons print their exercises but not the
 * audio text; the text lives in the back matter. The stage appends these pages
 * so the student reads the very page the tutor quotes from.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const section of EGYPT_ENGLISH_P1_T1_SECTIONS) {
    for (const lesson of section.lessons) {
      if (lesson.extraBookPages?.length) out.set(lesson.key, [...lesson.extraBookPages]);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// OCR text loading
// ---------------------------------------------------------------------------

const OCR_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "curriculum-ocr",
  "english-p1-t1",
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

/**
 * Full document payload for one lesson: its owned range plus the appendix pages
 * it points to (its audioscript). The lesson's own pages come first.
 */
export function lessonDocument(sectionIndex: number, lessonIndex: number): string {
  const range = lessonBookRange(sectionIndex, lessonIndex);
  const lesson = EGYPT_ENGLISH_P1_T1_SECTIONS[sectionIndex]!.lessons[lessonIndex]!;
  const parts = [loadBookRange(range.from, range.to)];
  for (const page of lesson.extraBookPages ?? []) parts.push(loadBookRange(page, page));
  return parts.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// Self-checks
// ---------------------------------------------------------------------------

/** Strips everything but letters and digits, so OCR spacing cannot break a match. */
function normalize(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

/** Every printed running-head the book uses in its footers, normalized. */
const FOOTER_TITLES = [
  ...EGYPT_ENGLISH_P1_T1_SECTIONS.map((s) => s.footerTitle),
  "Audioscripts",
  "Glossary",
]
  .map(normalize)
  .sort((a, b) => b.length - a.length);

/**
 * The book number a content page prints in its running foot, or null when the
 * last line is not a running foot. The foot is the page number next to the
 * section's running head, in either order («14 Unit 1 Life in a Digital World» /
 * «Unit 1 Life in a Digital World 15»), or a bare numeral. Only a line that
 * matches a known running head (or is a lone number) is accepted, so a content
 * line that merely ends in a number is not mistaken for the foot.
 */
export function printedFooter(book: number): number | null {
  const text = loadBookPage(book);
  if (!text) return null;
  const last = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  const n = normalize(last);
  if (n.length === 0) return null;
  if (/^\d{1,3}$/.test(n)) return Number(n);
  for (const title of FOOTER_TITLES) {
    const lead = n.match(new RegExp(`^(\\d{1,3})${title}$`));
    if (lead) return Number(lead[1]);
    const trail = n.match(new RegExp(`^${title}(\\d{1,3})$`));
    if (trail) return Number(trail[1]);
  }
  return null;
}

/**
 * Table invariants: lesson keys match their position, every range sits inside
 * its section, sections tile the book without gaps or overlaps, and the first
 * section starts where the Contents says. A content mistake here would quietly
 * ground the tutor on the wrong pages, so it fails loudly instead.
 */
export function isConsistent(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const sections = EGYPT_ENGLISH_P1_T1_SECTIONS;

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
      problems.push(`القسم ${section.key} يتداخل مع ${nextSection.key}`);
    } else if (nextSection && section.bookTo !== nextSection.bookFrom - 1) {
      problems.push(`فجوة صفحات بين ${section.key} و${nextSection.key}: ${section.bookTo + 1}–${nextSection.bookFrom - 1}`);
    }
  });

  const first = sections[0];
  const last = sections[sections.length - 1];
  if (first && first.bookFrom !== EGYPT_ENGLISH_P1_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ENGLISH_P1_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ENGLISH_P1_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ENGLISH_P1_T1_BOOK_END}، وجدنا ${last.bookTo}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The strong check, against the book itself:
 *  1. the printed footer of every content page proves its book number;
 *  2. every content page carries real OCR text;
 *  3. every lesson's own first page prints that lesson's head;
 *  4. every printed page is owned by exactly one lesson — no page can fall
 *     between two lessons and be unreachable;
 *  5. every appendix page a lesson points to exists and carries text.
 */
export function assertTreeMatchesTheBook(): { ok: boolean; problems: string[]; pagesChecked: number } {
  const problems: string[] = [];
  const ranges = allLessonRanges();
  let footersChecked = 0;

  const files = readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort();
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ENGLISH_P1_T1_BOOK_START || book > EGYPT_ENGLISH_P1_T1_BOOK_END) continue;
    printedPages.add(book);
    const text = loadBookPage(book);
    if (!text) {
      problems.push(`صفحة الكتاب ${book}: بلا نص OCR`);
      continue;
    }
    if (!pageHasText(book)) {
      problems.push(`صفحة الكتاب ${book}: بلا نص حقيقي (صفحة فارغة أو فشل مسح)`);
      continue;
    }
    const footer = printedFooter(book);
    if (footer !== null) {
      footersChecked++;
      if (footer !== book) {
        problems.push(`صفحة الكتاب ${book}: الفوتر المطبوع ${footer} لا يطابق رقمها`);
      }
    }
  }

  if (printedPages.size !== EGYPT_ENGLISH_P1_T1_BOOK_END - EGYPT_ENGLISH_P1_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ENGLISH_P1_T1_BOOK_START} و${EGYPT_ENGLISH_P1_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its head.
  EGYPT_ENGLISH_P1_T1_SECTIONS.forEach((section) => {
    section.lessons.forEach((lesson) => {
      const opener = loadBookPage(lesson.bookFrom);
      if (!opener) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} بلا نص OCR`);
        return;
      }
      if (!normalize(opener).toLowerCase().includes(normalize(lesson.printedHead).toLowerCase())) {
        problems.push(`الدرس ${lesson.key}: صفحته الأولى ${lesson.bookFrom} لا تطبع عنوانه «${lesson.printedHead}»`);
      }
    });
  });

  // 4. every printed page is owned by exactly one lesson.
  for (const book of printedPages) {
    const owners = ranges.filter((r) => book >= r.from && book <= r.to);
    if (owners.length !== 1) {
      problems.push(`صفحة الكتاب ${book}: يملكها ${owners.length} درسًا (${owners.map((o) => o.key).join(",")})`);
    }
  }

  // 5. every appendix page a lesson points to carries text.
  for (const [key, pages] of allLessonExtras()) {
    for (const page of pages) {
      if (!pageHasText(page)) problems.push(`الدرس ${key}: صفحة الملحق ${page} بلا نص OCR`);
    }
  }

  return { ok: problems.length === 0, problems, pagesChecked: footersChecked };
}