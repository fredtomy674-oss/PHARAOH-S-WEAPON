// PHASE 191 — official Egypt Secondary-3 (Grade 12) English, first term.
//
// Source: the 2026/2027 Ministry textbook «English — Secondary 3, Term 1».
// The tree follows the official printed «Contents»: six units and two reviews.
// Each guide is an original teaching note, not copied book prose.
import { createG12Book } from "./g12.js";

export const EGYPT_ENGLISH_G12_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry3/Term1/StudentBook/English_language_Sec3_tr1.pdf";

const book = createG12Book({
  subject: "English",
  grade: "الصف الثالث الثانوي",
  sourceUrl: EGYPT_ENGLISH_G12_T1_SOURCE,
  units: [
    {
      key: "unit-1",
      title: "Unit 1: Inside the World of Care",
      lessons: [
        {
          title: "Inside the World of Care",
          concepts: ["Present Perfect and Present Perfect Continuous", "Reading and speaking about healthcare roles", "Writing a blog post about a personal experience"],
          focus: "Links grammar to real communication about care work, and asks you to distinguish completed experience from an action still continuing.",
        },
      ],
    },
    {
      key: "unit-2",
      title: "Unit 2: The Power of Machines",
      lessons: [
        {
          title: "The Power of Machines",
          concepts: ["Reported statements and commands", "Reading and listening about technology", "Narrative and descriptive writing"],
          focus: "Shows how reported speech changes pronouns, time and place, and how technology stories can be told with both excitement and caution.",
        },
      ],
    },
    {
      key: "unit-3",
      title: "Unit 3: Protect Nature, Protect Future",
      lessons: [
        {
          title: "Protect Nature, Protect Future",
          concepts: ["Modal verbs for deduction, regret and blame", "Reading about climate justice", "Writing a persuasive essay"],
          focus: "Connects modal meaning to responsibility: what we know, what we regret, and what we should do for the environment.",
        },
      ],
    },
    {
      key: "review-1",
      title: "Review 1",
      lessons: [
        {
          title: "Review 1",
          concepts: ["Consolidating Units 1–3 grammar", "Vocabulary recycling", "Exam-style reading and writing tasks"],
          focus: "Turns the first three units into a retrieval practice set, so you can find the grammar point behind each mistake instead of only checking the score.",
        },
      ],
    },
    {
      key: "unit-4",
      title: "Unit 4: Marine Life",
      lessons: [
        {
          title: "Marine Life",
          concepts: ["Adjectives and compound adjectives", "Reading about coral reefs and whales", "Descriptive writing"],
          focus: "Builds precise description through adjectives, and asks you to explain the tension between tourism and marine conservation.",
        },
      ],
    },
    {
      key: "unit-5",
      title: "Unit 5: From Muscles to Mindset",
      lessons: [
        {
          title: "From Muscles to Mindset",
          concepts: ["Causative verbs have and get", "Reading about the future workplace", "Speaking for a debate"],
          focus: "Practises the difference between doing a task and having it done, while discussing how AI changes work and identity.",
        },
      ],
    },
    {
      key: "unit-6",
      title: "Unit 6: Let's Hang Out!",
      lessons: [
        {
          title: "Let's Hang Out!",
          concepts: ["Reported questions", "Making and responding to invitations", "Writing an online review"],
          focus: "Uses social situations to practise reported questions and polite interaction, then turns a personal experience into a useful review.",
        },
      ],
    },
    {
      key: "review-2",
      title: "Review 2",
      lessons: [
        {
          title: "Review 2",
          concepts: ["Consolidating Units 4–6 grammar", "Vocabulary recycling", "Integrated reading, speaking and writing"],
          focus: "Consolidates the second half of the term through mixed tasks, and helps you plan a final revision rather than reread everything passively.",
        },
      ],
    },
  ],
});

export const EGYPT_ENGLISH_G12_T1_BOOK = book.BOOK;
export const EGYPT_ENGLISH_G12_T1_UNITS = book.UNITS;
export const isEnglishG12TreeConsistent = book.isTreeConsistent;
export const englishG12LessonDocument = book.lessonDocument;
