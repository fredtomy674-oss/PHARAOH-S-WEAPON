// Egypt Preparatory-2 (Grade 8) English, first term («كتاب الوزارة»), Ministry
// 2026/2027 edition.
//
// The curriculum `eg-g8-english` is rebuilt from the Ministry textbook
// `English_language_prep2_t1.pdf` (114 scan pages, all OCR'd). This module is the
// single source of truth for its structure: the six units of the printed
// «Contents», the two printed reviews around them, and the «Start Smart» bridge
// that precedes unit 1 — each with its printed lessons and its printed page.
//
// Page mapping (verified against the scan's printed footers):
//   bookPage = pdfPage − 1   (book page 14 = PDF page 15, the unit 1 Lesson 1)
// Every numbered content page carries its number in the running foot, either
// before the section title («14 Unit 1 Gen Alpha») or after it
// («Unit 1 Gen Alpha 15»), which is what fixes the offset at 1 and proves the
// mapping page by page.
//
// WHY THE APP'S LESSON IS THE BOOK'S «LESSON», NOT ITS «UNIT»
// The book prints «LESSON 1» … «LESSON 6» at the head of every lesson (its unit
// opener is a separate Learning Outcomes page, and each unit closes on an
// Assessment Corner page followed by a My Self-Reflection page). The app lesson
// is therefore the printed lesson: a unit's opener rides with its first lesson
// and its Assessment Corner/Self-Reflection with its last, exactly as the other
// Ministry books treat a unit's opener/assessment. «Start Smart», «Review 1» and
// «Review 2» are printed sections of the book, so each is a top-level unit too;
// the reviews keep their printed «Lesson 1» and «Lesson 2» sub-parts.
//
// WHY EVERY LESSON'S CONCEPTS COME FROM ITS UNIT'S PRINTED OUTCOMES
// Unlike the Arabic-medium Ministry books, this one prints no per-lesson
// objectives: its «Learning Outcomes» sit on the unit opener, grouped by skill
// (Reading / Listening / Speaking / Language / Writing). Each lesson carries the
// verbatim outcomes of the skill(s) it actually teaches — a reading lesson the
// unit's reading outcomes, the listening lesson its listening + language
// outcomes, the writing lesson its writing outcomes — so the tutor's roadmap is
// focused and still printed in the book word for word. The full outcome set of
// every unit is reproduced at the head of that unit below. «Start Smart» and the
// two «Review» sections print no outcomes at all: their lessons carry the
// exercise instructions the pages actually print.
//
// THE BOOK'S LISTENING PASSAGES LIVE IN A BOOK-WIDE APPENDIX
// Each unit's listening lesson prints its exercises but not the audio text; the
// texts are printed in the back matter «Audioscripts» (book pages 103–106). Each
// listening lesson therefore also owns its own script page through
// `extraBookPages`, so the tutor scoped to that lesson can quote the very
// passage the book points it to. The appendix is not a lesson: it stays outside
// the tiled unit ranges. The «Glossary» (book pages 107–111) is book-wide back
// matter and is not attached to any single lesson.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Book page number N ↔ PDF page index N + OFFSET (verified: book p.14 = PDF p.15). */
export const BOOK_TO_PDF_OFFSET = 1;

/** First printed content page of the term — the «Start Smart» bridge. */
export const EGYPT_ENGLISH_G8_T1_BOOK_START = 11;

/** Last printed content page — the closing page of «Review 2». */
export const EGYPT_ENGLISH_G8_T1_BOOK_END = 102;

/** The book-wide back matter, outside the tiled unit ranges (book pages). */
export const EGYPT_ENGLISH_G8_T1_APPENDIX = {
  /** «Audioscripts» — the listening passages each lesson points to. */
  audioscripts: { from: 103, to: 106 },
  /** «Glossary» — book-wide vocabulary, not attached to one lesson. */
  glossary: { from: 107, to: 111 },
} as const;

/** One lesson of the book — becomes one lesson in the app tree. */
export interface EnglishG8T1Lesson {
  /** App-addressable key, e.g. "1-1" (unit 1, lesson 1) or "review1-2". */
  key: string;
  /** Full app-facing lesson title, e.g. "Lesson 1: Meet Gen Alpha". */
  title: string;
  /**
   * The string the lesson's own first page must print (checked by
   * `assertTreeMatchesTheBook`), e.g. "Meet Gen Alpha" or "Lesson 2".
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
export interface EnglishG8T1Section {
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
  lessons: EnglishG8T1Lesson[];
}

// ---------------------------------------------------------------------------
// The printed «Learning Outcomes» of each unit, verbatim, grouped by skill.
// ---------------------------------------------------------------------------

/** Unit 1 — Gen Alpha (opener: book page 13). */
const U1 = {
  reading: [
    "Identify the main idea in a text about Gen Alpha's digital habits",
    "Extract specific details from a text to answer comprehension questions about Gen Alpha and Gen Z",
  ],
  listening: [
    "Identify the main topic of a podcast about Gen Alpha",
    "Extract specific details from a podcast to determine if statements are true or false",
  ],
  speaking: [
    "Express opinions verbally on topics related to digital habits and online trends",
    "Ask and answer questions about students' own and others' digital lives",
  ],
  language: [
    "Differentiate between the uses of the present continuous tense",
    "Use target grammar accurately to express current activities, and the arranged future",
  ],
  writing: [
    'Write a blog post about a "Day in the Life of a Gen Alpha Teen"',
    "Incorporate target vocabulary and grammar structures into writing tasks",
  ],
};

/** Unit 2 — My Digital Footprint (opener: book page 27). */
const U2 = {
  reading: [
    "Identify key details, main ideas, synonyms, antonyms, and words with prefixes in informational texts",
    "Answer comprehension questions about online safety",
  ],
  listening: [
    "Identify main ideas and supporting details from an audio",
    "Demonstrate understanding by answering questions based on an audio content",
  ],
  speaking: [
    "Engage in pair and group discussions about online habits and safety",
    "Perform role-play scenarios, practicing how to respond to online risks",
  ],
  language: [
    "Recognize and correctly use the present simple passive voice in context",
    "Form passive voice sentences for giving advice or describing actions online",
  ],
  writing: [
    "Write clear, well-organized tips for staying safe online using target vocabulary",
    "Revise and proofread writing based on peer and self-feedback",
    "Use correct spelling and grammar when expressing advice or opinions about online safety",
  ],
};

/** Unit 3 — Facing Challenges (opener: book page 41). */
const U3 = {
  reading: [
    "Identify the main idea and supporting details in a motivational article",
    "Infer the meanings of new words using time expressions and context clues",
  ],
  listening: [
    "Identify the main idea and details in a spoken story",
    "Identify feelings and choices of speakers based on language clues",
  ],
  speaking: [
    "Describe personal or real-life challenges and explain how they are overcome",
    "Apply target grammar and vocabulary to discuss problems and solutions",
    'Connect ideas using "because, so, and although"',
  ],
  language: [
    "Use the past simple and past continuous correctly to describe past events",
    "Use time expressions in context",
  ],
  writing: [
    "Write about a personal challenge using appropriate vocabulary and past tenses",
    "Organize a short text with clear sequencing using time expressions",
  ],
};

/** Unit 4 — Art and Expression (opener: book page 58). */
const U4 = {
  reading: [
    "Identify different types of artwork mentioned in a text",
    "Use context clues to understand the meaning of new words",
    "Use descriptive adjectives to expand vocabulary",
  ],
  listening: [
    "Summarize the main ideas from an interview with an artist",
    "Extract specific details from a listening passage",
    "Identify meanings of words from context",
  ],
  speaking: [
    "Describe favorite types of artwork",
    "Explain a favorite artwork using adjectives",
    "Express ideas clearly and with enthusiasm when discussing art",
  ],
  language: [
    "Apply descriptive adjectives to make sentences clearer",
    "Use the connectors : because, so, although and but",
  ],
  writing: [
    "Write an email of a type of art using target language",
    "Integrate unit vocabulary effectively into writing",
  ],
};

/** Unit 5 — Around the World (opener: book page 72). */
const U5 = {
  reading: [
    "Identify the main idea and supporting details in a travel blog",
    "Compare and contrast the writer's experience in Japan and Morocco using examples from the text",
    "Identify facts and opinions in a short text and make simple inferences based on information about people, places, and culture",
  ],
  listening: [
    "Identify the main idea and important details from a spoken tour about famous places in Cairo",
    "Pick out specific information such as names, numbers, languages, and foods mentioned in the audio",
  ],
  speaking: [
    "Talk about cultural aspects of a country (food, traditions, greetings, landmarks)",
    "Share and compare ideas about countries and cultures in a structured conversation (Role-play)",
  ],
  language: [
    "Identify and explain comparatives, superlatives in context",
    "Create accurate sentences using these grammar forms",
  ],
  writing: [
    "Write a social media post using key vocabulary and comparatives and superlatives",
    "Edit writing using peer feedback and self-check",
  ],
};

/** Unit 6 — Young Innovators (opener: book page 87). */
const U6 = {
  reading: [
    "Infer the writer's attitude of writing a text about the idea of innovation",
    "Identify the main idea in a reading profile of an Egyptian innovator",
    "Extract specific details from a text to answer comprehension questions about important innovations",
  ],
  listening: [
    "Infer the speaker's tone based on the listening text",
    "Extract specific details to answer questions about the text",
  ],
  speaking: [
    "Express opinions verbally on topics related to innovations",
    "Ask and answer questions about some innovations",
  ],
  language: ["Use the first and second conditionals"],
  writing: [
    "Write a structured biography about an innovator",
    "Incorporate target vocabulary and grammar structures into writing tasks",
  ],
};

/**
 * The book in printed order: Start Smart (11–12), Units 1–3 (13–54), Review 1
 * (55–57), Units 4–6 (58–99), Review 2 (100–102). Unit/lesson starts come from
 * each printed «LESSON n» head; the outcomes come from each unit opener. Every
 * page is checked against the book by `assertTreeMatchesTheBook`.
 *
 * Unit 6 is the one unit that does not follow the two-pages-per-lesson rhythm:
 * its Lesson 3 («A Man of Impact») is a single printed page, so Lesson 4 starts
 * on book 93 rather than 94. The ranges below are what the scan prints, not a
 * pattern, and the tiling assertion proves it.
 */
export const EGYPT_ENGLISH_G8_T1_SECTIONS: EnglishG8T1Section[] = [
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
          "Read the following text, then answer the questions",
          "Choose the correct answer from a, b, c or d",
          "Complete the sentences with the correct form of the word(s) in brackets",
          'Write a paragraph of (90 – 100) words on "My Favorite Season"',
        ],
      },
    ],
  },
  {
    key: "1",
    kind: "unit",
    title: "Unit 1: Gen Alpha",
    footerTitle: "Unit 1 Gen Alpha",
    bookFrom: 13,
    bookTo: 26,
    lessons: [
      { key: "1-1", title: "Lesson 1: Meet Gen Alpha", printedHead: "Meet Gen Alpha", bookFrom: 14, concepts: [...U1.reading] },
      { key: "1-2", title: "Lesson 2: Gen Alpha's Digital Life", printedHead: "Gen Alpha's Digital Life", bookFrom: 16, concepts: [...U1.listening, ...U1.language], extraBookPages: [103] },
      { key: "1-3", title: "Lesson 3: The Digital Bridge", printedHead: "The Digital Bridge", bookFrom: 18, concepts: [...U1.reading] },
      { key: "1-4", title: "Lesson 4: Story Time", printedHead: "Story Time", bookFrom: 20, concepts: [...U1.reading] },
      { key: "1-5", title: "Lesson 5: Let's Talk", printedHead: "Let's Talk", bookFrom: 22, concepts: [...U1.speaking] },
      { key: "1-6", title: "Lesson 6: Expressing Identity Online", printedHead: "Expressing Identity Online", bookFrom: 24, concepts: [...U1.writing] },
    ],
  },
  {
    key: "2",
    kind: "unit",
    title: "Unit 2: My Digital Footprint",
    footerTitle: "Unit 2 My Digital Footprint",
    bookFrom: 27,
    bookTo: 40,
    lessons: [
      { key: "2-1", title: "Lesson 1: Protecting Your Privacy in the Digital Age", printedHead: "Protecting Your Privacy in the Digital Age", bookFrom: 28, concepts: [...U2.reading] },
      { key: "2-2", title: "Lesson 2: Staying Safe Online", printedHead: "Staying Safe Online", bookFrom: 30, concepts: [...U2.listening, ...U2.language], extraBookPages: [103] },
      { key: "2-3", title: "Lesson 3: Managing Your Online Data", printedHead: "Managing Your Online Data", bookFrom: 32, concepts: [...U2.reading] },
      { key: "2-4", title: "Lesson 4: Story Time", printedHead: "Story Time", bookFrom: 34, concepts: [...U2.reading] },
      { key: "2-5", title: "Lesson 5: Let's Talk", printedHead: "Let's Talk", bookFrom: 36, concepts: [...U2.speaking] },
      { key: "2-6", title: "Lesson 6: Digital Detectives", printedHead: "Digital Detectives", bookFrom: 38, concepts: [...U2.writing] },
    ],
  },
  {
    key: "3",
    kind: "unit",
    title: "Unit 3: Facing Challenges",
    footerTitle: "Unit 3 Facing Challenges",
    bookFrom: 41,
    bookTo: 54,
    lessons: [
      { key: "3-1", title: "Lesson 1: Overcoming Challenges", printedHead: "Overcoming Challenges", bookFrom: 42, concepts: [...U3.reading] },
      { key: "3-2", title: "Lesson 2: Advice for Facing Challenges", printedHead: "Advice for Facing Challenges", bookFrom: 44, concepts: [...U3.listening, ...U3.language], extraBookPages: [104] },
      { key: "3-3", title: "Lesson 3: Facing Traffic Challenges", printedHead: "Facing Traffic Challenges", bookFrom: 46, concepts: [...U3.reading] },
      { key: "3-4", title: "Lesson 4: Story Time", printedHead: "Story Time", bookFrom: 48, concepts: [...U3.reading] },
      { key: "3-5", title: "Lesson 5: Let's Talk", printedHead: "Let's Talk", bookFrom: 50, concepts: [...U3.speaking] },
      { key: "3-6", title: "Lesson 6: The Power of Facing Challenges", printedHead: "The Power of Facing Challenges", bookFrom: 52, concepts: [...U3.writing] },
    ],
  },
  {
    key: "review1",
    kind: "review",
    title: "Review 1",
    footerTitle: "Review 1",
    bookFrom: 55,
    bookTo: 57,
    lessons: [
      {
        key: "review1-1",
        title: "Review 1: Lesson 1",
        printedHead: "Lesson 1",
        bookFrom: 55,
        concepts: [
          "Listen to the audio, then choose the correct answer",
          "Read the following dialog",
          "Choose the correct answer from a, b, c or d",
        ],
        extraBookPages: [105],
      },
      {
        key: "review1-2",
        title: "Review 1: Lesson 2",
        printedHead: "Lesson 2",
        bookFrom: 56,
        concepts: [
          "Fill in the spaces with words from the box",
          "Write a paragraph of (90 – 100) words about staying safe online",
          "Complete the following using words from the box",
          "Choose the correct answer from a, b, c or d",
        ],
      },
    ],
  },
  {
    key: "4",
    kind: "unit",
    title: "Unit 4: Art and Expression",
    footerTitle: "Unit 4 Art and Expression",
    bookFrom: 58,
    bookTo: 71,
    lessons: [
      { key: "4-1", title: "Lesson 1: A Journey Through Art!", printedHead: "A Journey Through Art!", bookFrom: 59, concepts: [...U4.reading] },
      { key: "4-2", title: "Lesson 2: Exploring Art: Listen up!", printedHead: "Exploring Art: Listen up!", bookFrom: 61, concepts: [...U4.listening, ...U4.language], extraBookPages: [105] },
      { key: "4-3", title: "Lesson 3: An article about an Artist", printedHead: "An article about an Artist", bookFrom: 63, concepts: [...U4.reading] },
      { key: "4-4", title: "Lesson 4: Story Time", printedHead: "Story Time", bookFrom: 65, concepts: [...U4.reading] },
      { key: "4-5", title: "Lesson 5: Let's Talk", printedHead: "Let's Talk", bookFrom: 67, concepts: [...U4.speaking] },
      { key: "4-6", title: "Lesson 6: My Performance Review", printedHead: "My Performance Review", bookFrom: 69, concepts: [...U4.writing] },
    ],
  },
  {
    key: "5",
    kind: "unit",
    title: "Unit 5: Around the World",
    footerTitle: "Unit 5 Around the World",
    bookFrom: 72,
    bookTo: 86,
    lessons: [
      { key: "5-1", title: "Lesson 1: Have You Ever Explored the World?", printedHead: "Have You Ever Explored the World?", bookFrom: 73, concepts: [...U5.reading] },
      { key: "5-2", title: "Lesson 2: A Tour around Cairo", printedHead: "A Tour around Cairo", bookFrom: 75, concepts: [...U5.listening, ...U5.language], extraBookPages: [105] },
      { key: "5-3", title: "Lesson 3: Around the World in Four Amazing Places", printedHead: "Around the World in Four Amazing Places", bookFrom: 77, concepts: [...U5.reading] },
      { key: "5-4", title: "Lesson 4: Story Time", printedHead: "Story Time", bookFrom: 79, concepts: [...U5.reading] },
      { key: "5-5", title: "Lesson 5: Let's Talk", printedHead: "Let's Talk", bookFrom: 81, concepts: [...U5.speaking] },
      { key: "5-6", title: "Lesson 6: Come Explore with Us!", printedHead: "Come Explore with Us!", bookFrom: 83, concepts: [...U5.writing] },
    ],
  },
  {
    key: "6",
    kind: "unit",
    title: "Unit 6: Young Innovators",
    footerTitle: "Unit 6 Young Innovators",
    bookFrom: 87,
    bookTo: 99,
    lessons: [
      { key: "6-1", title: "Lesson 1: Making Your Ideas Happen", printedHead: "Making Your Ideas Happen", bookFrom: 88, concepts: [...U6.reading] },
      { key: "6-2", title: "Lesson 2: Inspiring Innovators", printedHead: "Inspiring Innovators", bookFrom: 90, concepts: [...U6.listening, ...U6.language], extraBookPages: [106] },
      { key: "6-3", title: "Lesson 3: A Man of Impact", printedHead: "A Man of Impact", bookFrom: 92, concepts: [...U6.reading] },
      { key: "6-4", title: "Lesson 4: Story Time", printedHead: "Story Time", bookFrom: 93, concepts: [...U6.reading] },
      { key: "6-5", title: "Lesson 5: Let's Talk", printedHead: "Let's Talk", bookFrom: 95, concepts: [...U6.speaking] },
      { key: "6-6", title: "Lesson 6: A biography about Ahmed Idris", printedHead: "A biography about Ahmed Idris", bookFrom: 97, concepts: [...U6.writing] },
    ],
  },
  {
    key: "review2",
    kind: "review",
    title: "Review 2",
    footerTitle: "Review 2",
    bookFrom: 100,
    bookTo: 102,
    lessons: [
      {
        key: "review2-1",
        title: "Review 2: Lesson 1",
        printedHead: "Lesson 1",
        bookFrom: 100,
        concepts: [
          "Listen and choose the correct answer from a, b, c or d",
          "Listen again and complete",
          "Choose the correct answer from a, b, c or d",
          "Read the following text, then answer the questions",
        ],
        extraBookPages: [106],
      },
      {
        key: "review2-2",
        title: "Review 2: Lesson 2",
        printedHead: "Lesson 2",
        bookFrom: 101,
        concepts: [
          "Read and complete the text with the words in the box",
          "Complete the following dialog",
          "Rewrite the following sentences using the words in brackets to give the same meaning",
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
  const section = EGYPT_ENGLISH_G8_T1_SECTIONS[sectionIndex]!;
  const lesson = section.lessons[lessonIndex]!;
  const from = lessonIndex === 0 ? section.bookFrom : lesson.bookFrom;
  const next = section.lessons[lessonIndex + 1];
  const to = next ? next.bookFrom - 1 : section.bookTo;
  return { from, to };
}

/** Every lesson's derived range, flattened — used by the tests and the audit. */
export function allLessonRanges(): { key: string; title: string; from: number; to: number }[] {
  const out: { key: string; title: string; from: number; to: number }[] = [];
  EGYPT_ENGLISH_G8_T1_SECTIONS.forEach((section, si) => {
    section.lessons.forEach((lesson, li) => {
      const { from, to } = lessonBookRange(si, li);
      out.push({ key: lesson.key, title: lesson.title, from, to });
    });
  });
  return out;
}

/**
 * The appendix page(s) each lesson points to, keyed by the lesson key
 * (`1-2` → `[103]`). The listening lessons print their exercises but not the
 * audio text; the text lives in the back matter. The stage appends these pages
 * so the student reads the very page the tutor quotes from.
 */
export function allLessonExtras(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const section of EGYPT_ENGLISH_G8_T1_SECTIONS) {
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
  "english-p2-t1",
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
  const lesson = EGYPT_ENGLISH_G8_T1_SECTIONS[sectionIndex]!.lessons[lessonIndex]!;
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
  ...EGYPT_ENGLISH_G8_T1_SECTIONS.map((s) => s.footerTitle),
  "Audioscripts",
  "Glossary",
]
  .map(normalize)
  .sort((a, b) => b.length - a.length);

/**
 * The book number a content page prints in its running foot, or null when the
 * last line is not a running foot. The foot is the page number next to the
 * section's running head, in either order («14 Unit 1 Gen Alpha» /
 * «Unit 1 Gen Alpha 15»), or a bare numeral. Only a line that matches a
 * known running head (or is a lone number) is accepted, so a content line that
 * merely ends in a number is not mistaken for the foot.
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
  const sections = EGYPT_ENGLISH_G8_T1_SECTIONS;

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
  if (first && first.bookFrom !== EGYPT_ENGLISH_G8_T1_BOOK_START) {
    problems.push(`القسم الأول يجب أن يبدأ من الصفحة ${EGYPT_ENGLISH_G8_T1_BOOK_START}، وجدنا ${first.bookFrom}`);
  }
  if (last && last.bookTo !== EGYPT_ENGLISH_G8_T1_BOOK_END) {
    problems.push(`القسم الأخير يجب أن ينتهي عند الصفحة ${EGYPT_ENGLISH_G8_T1_BOOK_END}، وجدنا ${last.bookTo}`);
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

  const files = existsSync(OCR_DIR) ? readdirSync(OCR_DIR).filter((f) => /^pages-\d{3}\.txt$/.test(f)).sort() : [];
  const printedPages = new Set<number>();
  for (const file of files) {
    const book = Number(file.slice(6, 9)) - BOOK_TO_PDF_OFFSET;
    if (book < EGYPT_ENGLISH_G8_T1_BOOK_START || book > EGYPT_ENGLISH_G8_T1_BOOK_END) continue;
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

  if (printedPages.size !== EGYPT_ENGLISH_G8_T1_BOOK_END - EGYPT_ENGLISH_G8_T1_BOOK_START + 1) {
    problems.push(
      `نسيج الكتاب ناقص: ${printedPages.size} صفحة بين ${EGYPT_ENGLISH_G8_T1_BOOK_START} و${EGYPT_ENGLISH_G8_T1_BOOK_END}`,
    );
  }
  if (footersChecked === 0) problems.push("لم يُعثر على أي فوتر مطبوع — المسار غير صحيح؟");

  // 3. each lesson's own first page prints its head.
  EGYPT_ENGLISH_G8_T1_SECTIONS.forEach((section) => {
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
