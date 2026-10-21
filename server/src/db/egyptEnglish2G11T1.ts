// PHASE 190 — official Egypt Secondary-2 (Grade 11) English as a second
// foreign language, first term.
//
// Source: the 2026/2027 Ministry textbook `English_second_language_secondary2.pdf`.
// The tree follows the printed «Contents»: three units, four printed lessons
// each, plus the closing Review 1. The review is folded into the fourth lesson
// of Unit 3 so the app tree keeps the twelve taught lessons of the term while
// still naming the book's revision page in that lesson's concepts.
import { checkG11Tree, g11LessonDocument, type G11UnitSpec } from "./g11.js";

export const EGYPT_ENGLISH2_G11_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry2/Term1/StudentBook/English_second_language_secondary2.pdf";

export const EGYPT_ENGLISH2_G11_T1_UNITS: G11UnitSpec[] = [
  {
    key: "1",
    title: "Unit 1: People & Friends",
    lessons: [
      {
        key: "1-1",
        title: "My Friend",
        concepts: [
          "Present continuous for actions happening now",
          "Adjectives that describe personality",
          "Reading for main ideas and supporting details",
        ],
        guide: `This lesson introduces the unit through a short text about a best friend. Students practise the present continuous to describe what people are doing at the moment of speaking, and they collect adjectives such as kind, funny, polite, and friendly. The reading work moves from a general question to specific details, so students should first find the main idea and then underline the words that prove their answer. The writing model at the end shows how a few clear sentences can describe a person without a long list. Encourage students to connect each adjective with an action or example, because a character becomes convincing when behaviour supports the label.`,
      },
      {
        key: "1-2",
        title: "Friends in Action",
        concepts: [
          "Listening for key information in conversations",
          "Present continuous questions and short answers",
          "Describing actions in a classroom or playground",
        ],
        guide: `The second lesson moves from description to interaction. Students listen to short conversations about friends who are studying, playing, and helping one another, then answer true/false and completion tasks. The grammar focus is the present continuous question form: What are you doing? Are you helping your classmate? Short answers keep the drill natural. In speaking, pairs act out a small scene and report what their partner is doing. The teacher should draw attention to time words such as now, at the moment, and today, because they signal that the action is temporary rather than habitual.`,
      },
      {
        key: "1-3",
        title: "People and Friendship",
        concepts: [
          "Reading about neighbours and community",
          "Inferring character from actions",
          "Using context to guess new vocabulary",
        ],
        guide: `This lesson widens the idea of friendship from a best friend to neighbours and the local community. The reading describes people standing, talking, laughing, and helping an elderly neighbour, so the questions ask students to infer feelings and relationships rather than copy a sentence. Inference means using clues: if everyone is smiling and sharing stories, the atmosphere is probably friendly. Vocabulary work should focus on the way context narrows meaning, for example neighbour, polite, and laugh. A useful follow-up is to ask students which small act in the text made the community stronger and why.`,
      },
      {
        key: "1-4",
        title: "Friendship and Good Behavior",
        concepts: [
          "Writing a short paragraph about a friend",
          "Connectors and a clear topic sentence",
          "Reviewing the unit's vocabulary and present continuous",
        ],
        guide: `The final lesson turns reading into writing. Students plan a five-to-seven sentence paragraph about a friend: a topic sentence, two or three supporting details, and a closing sentence. The book's model shows good behaviour through concrete actions such as helping, listening, and sharing, not through empty praise. Students should revise for subject-verb agreement, correct present continuous forms, and clear pronouns. The lesson also closes the unit, so it is a good place to recycle vocabulary from the previous three lessons. A short peer check, focused on one strength and one improvement, keeps feedback practical and kind.`,
      },
    ],
  },
  {
    key: "2",
    title: "Unit 2: Places & Directions in My Town",
    lessons: [
      {
        key: "2-1",
        title: "Places In My Town",
        concepts: [
          "There is / there are for existence",
          "Vocabulary for places and services in a town",
          "Writing a short description of a neighbourhood",
        ],
        guide: `This lesson introduces the town as a network of places and services: bank, hospital, school, market, park, and cinema. Students use there is and there are to say what exists, and they add prepositions such as near, next to, and opposite to locate it. The writing model describes a town in simple sentences, then invites students to write about their own area. Accuracy matters more than length: one clear sentence about a place and its position is better than a list of names. Teachers can turn the lesson into a map task, where students place labels and then describe the map to a partner.`,
      },
      {
        key: "2-2",
        title: "Directions Around Town",
        concepts: [
          "Imperatives for giving directions",
          "Prepositions and landmarks",
          "Listening and following a route on a map",
        ],
        guide: `The second lesson teaches students to move through the town. Directions use imperatives such as go straight, turn left, turn right, and stop at the corner, supported by landmarks like the bank, the mosque, or the school. Listening is central: students hear a short route and trace it on a map, then compare their route with a partner. Speaking practice reverses the roles, so one student gives directions and the other checks. The teacher should insist on sequence words first, then, after that, because a route without order is confusing. This is also a good lesson for teaching polite clarification: Could you repeat that, please?`,
      },
      {
        key: "2-3",
        title: "People In My Town",
        concepts: [
          "Jobs and community roles",
          "Reading for examples of service",
          "Present simple for routines and facts",
        ],
        guide: `This lesson looks at the people who keep a town working: teachers, doctors, farmers, shopkeepers, cleaners, and drivers. The reading shows how each job helps others, and the questions ask students to match people with their contribution. The present simple is recycled for routines and general facts: a doctor helps sick people; farmers grow food. Vocabulary should be practised in collocations, not isolated words, for example treat patients, grow crops, and keep the streets clean. A short discussion can ask which job students admire and what daily responsibilities it involves.`,
      },
      {
        key: "2-4",
        title: "My Town and Technology",
        concepts: [
          "Technology in community services",
          "Reading for advantages and safety",
          "Using because and so to give reasons and results",
        ],
        guide: `The final lesson of Unit 2 connects the town to technology. Students read about a computer centre where people use devices, search for information, and learn digital skills. The lesson balances benefits with safety: technology saves time and opens access to knowledge, but it also requires responsible use. Students practise linking ideas with because and so, which helps them explain a reason and its result. A good classroom task is to list two ways technology helps the local community and one rule that keeps users safe. This prepares students for the next unit's focus on daily routines and screen time.`,
      },
    ],
  },
  {
    key: "3",
    title: "Unit 3: Daily Routine & Technology Use",
    lessons: [
      {
        key: "3-1",
        title: "A Day in the Life of a Teenager",
        concepts: [
          "Present simple and adverbs of frequency",
          "Telling a daily routine in order",
          "Reading for times and sequence",
        ],
        guide: `This lesson follows a teenager through an ordinary day: waking up, checking a phone, having breakfast, going to school, and doing homework. Students use the present simple with adverbs of frequency such as always, usually, often, sometimes, and never. Sequence words (first, then, after school, in the evening) turn a list of activities into a readable routine. The reading questions ask for times and order, so students should scan for numbers and time expressions. A useful speaking task is to compare two routines and find one healthy habit and one habit that needs improvement.`,
      },
      {
        key: "3-2",
        title: "Technology in My Life",
        concepts: [
          "Vocabulary for devices and online actions",
          "Listening for habits and frequency",
          "Talking about how and why technology is used",
        ],
        guide: `The lesson focuses on the devices and actions that fill daily life: phone, laptop, screen, log in, browse, type, download, search, and share. Students listen to short descriptions of technology habits and identify what each speaker does and how often. The grammar remains the present simple, now with a wider set of verbs and frequency expressions. Speaking should move beyond yes/no answers: students explain what they use a device for, how long they spend, and whether the habit helps or distracts them. This sets up the next lesson's discussion of healthy screen time.`,
      },
      {
        key: "3-3",
        title: "Healthy Technology Use",
        concepts: [
          "Screen time and its effects on health",
          "Reading for cause and effect",
          "Giving advice with should and should not",
        ],
        guide: `This lesson treats technology as a question of balance. The reading describes a student who uses a phone and computer for long hours, then feels tired or distracted, and it asks students to connect cause with effect. The language focus includes should and should not for advice: you should take breaks, you should not use a screen late at night. Students can evaluate a weekly timetable and suggest small changes. The goal is not to condemn technology but to help learners notice how duration, posture, sleep, and attention interact. A short class survey makes the topic personal without asking for private details.`,
      },
      {
        key: "3-4",
        title: "Online Safety & Responsibility",
        concepts: [
          "Rules for safe online behaviour",
          "Writing a paragraph about a favourite device",
          "Review 1: vocabulary, grammar, and skills",
        ],
        guide: `The last lesson brings the unit together around safety and responsibility. Students read about strangers online, privacy, strong passwords, and the importance of asking an adult when something feels wrong. Imperatives and should/should not are recycled in rules and advice. The writing task asks for a short paragraph about a favourite device, using a topic sentence and clear reasons. This is also the point to review the term: vocabulary from the three units, present simple and continuous, frequency adverbs, and direction language. A quick self-check against the book's Review 1 helps students see what to revisit before the next term.`,
      },
    ],
  },
];

export const EGYPT_ENGLISH2_G11_T1_BOOK = {
  subject: "English as a Second Foreign Language",
  grade: "Secondary 2",
  sourceUrl: EGYPT_ENGLISH2_G11_T1_SOURCE,
};

export function isEnglish2G11TreeConsistent() {
  return checkG11Tree("English 2 — Secondary 2", EGYPT_ENGLISH2_G11_T1_UNITS);
}

export function english2G11LessonDocument(unitIndex: number, lessonIndex: number): string {
  return g11LessonDocument(EGYPT_ENGLISH2_G11_T1_BOOK, EGYPT_ENGLISH2_G11_T1_UNITS, unitIndex, lessonIndex);
}
