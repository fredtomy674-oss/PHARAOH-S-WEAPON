// PHASE 185 — official Egypt Secondary-2 (Grade 11) English, first term.
//
// Source: the 2026/2027 Ministry textbook «English — Secondary 2, Term 1».
// The tree follows the official «Scope and Sequence» (OCR of the Ministry PDF):
// six units, three lessons each, with the unit's language, skills, life skills
// and values. Each lesson's guide is an original teaching note, not copied book
// prose. The subject code `english` is what makes the tutor answer in English.
import { checkG11Tree, g11LessonDocument, type G11UnitSpec } from "./g11.js";

export const EGYPT_ENGLISH_G11_T1_SOURCE =
  "https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026_2027/Secondry/Secondry2/Term1/StudentBook/English_language_2sec_t1.pdf";

export const EGYPT_ENGLISH_G11_T1_UNITS: G11UnitSpec[] = [
  {
    key: "1",
    title: "Unit 1: Egypt-Africa Cooperation",
    lessons: [
      {
        key: "1-1",
        title: "Reading and Speaking: Egypt, Gateway to Africa",
        concepts: [
          "Reading for main ideas and supporting details",
          "Vocabulary: gateway, infrastructure, partnership, mutual, manufactured",
          "Speaking: discussing Egypt's location and the benefits of cooperation",
        ],
        guide: `This lesson asks you to read an article about Egypt's role as a bridge between Africa, the Middle East and Europe. Start by finding the main idea: Egypt's position is not only geographical, but economic and political. Then collect supporting details: road and energy projects, trade in manufactured goods and raw materials, scholarships, and medical convoys.
When you speak about the text, do not simply repeat sentences. Use a pattern: "Egypt is important because... For example... This matters because..." That pattern turns a detail into an argument. Practise the target vocabulary in your own sentences: a gateway is a point of access, infrastructure is the basic system a society needs, and a partnership is a relationship in which both sides contribute.
A useful reading habit is to mark words you can guess from context before reaching for a dictionary. The sentence around "mutual" tells you that both sides benefit. Finally, prepare a one-minute answer to "Why is Egypt's location an advantage for African cooperation?" with one reason and one example.`,
      },
      {
        key: "1-2",
        title: "Listening and Speaking: Voices from the Partnership",
        concepts: [
          "Listening for numbers, names and specific details",
          "Vocabulary: integration, hybrid, expanding, rural, stable, funding",
          "Speaking: a two-minute role-play at an African forum",
        ],
        guide: `In this lesson you listen to speakers describe trade, agriculture and development partnerships. Before you listen, read the task and predict the kind of answer each gap needs: a number, a country, a project name or a challenge. Prediction reduces the amount you have to hold in memory while listening.
Listen for signposts such as "the main goal", "the biggest challenge" and "next year". These phrases tell you that a key detail is coming. Do not stop at a word you missed; keep following the speaker's argument and return to the gap later. After listening, check your answers against the whole meaning, not just the number.
The role-play gives you a chance to use the vocabulary actively. Speak as a delegate: state your country's interest, give one example of cooperation, and respond politely to a different view. Useful phrases include "From our perspective...", "That is a fair point, but..." and "Could we agree on...?" Keep your turn to about one minute so your partner can respond.`,
      },
      {
        key: "1-3",
        title: "Language and Writing: Present Continuous and Persuasive Writing",
        concepts: [
          "Present continuous for actions happening now",
          "Present continuous passive: is/are being + past participle",
          "Writing an essay with clear, persuasive phrases",
        ],
        guide: `The present continuous describes a situation in progress: "Egypt is strengthening its ties with African countries." The passive form shifts attention to the action or the thing affected: "New roads are being built." Choose the passive when the doer is unknown, unimportant, or obvious from context; choose the active when the doer matters.
A persuasive essay needs a clear position, reasons, evidence and a conclusion. A simple structure works well: introduce the issue, give two reasons with examples, answer one objection, and restate your position. Use signposts such as "First", "In addition", "However" and "Therefore", but do not overload the essay with them.
For this unit, write about why cooperation between Egypt and African countries is valuable. Support your view with one economic example and one human example, such as education or health. End with a recommendation, not a repetition: "For these reasons, Egypt should continue to invest in..." Read your draft aloud to check that every paragraph has one clear job.`,
      },
    ],
  },
  {
    key: "2",
    title: "Unit 2: Startups and Young Entrepreneurs",
    lessons: [
      {
        key: "2-1",
        title: "Reading and Language: Young Entrepreneurs",
        concepts: [
          "Reading an article about inspiring entrepreneurs",
          "Past perfect active and passive",
          "Vocabulary for business, risk and perseverance",
        ],
        guide: `This unit explores how young people turn an idea into a business. As you read, separate the entrepreneur's story into three parts: the problem, the solution and the obstacle. Most startup stories follow this pattern, and recognising it helps you summarise quickly and accurately.
The past perfect is useful for background: "She had already tested the product before she met the investor." It shows which event happened first. The passive form, "The product had been tested", is common when the process matters more than the person. Do not use the past perfect for every past action; use it when the order of events would otherwise be unclear.
Build a small business vocabulary bank: revenue, investor, prototype, launch, scale, profit, risk, failure. Then practise explaining a startup in three sentences using at least four of these words. The goal is not to sound complicated, but to be precise.`,
      },
      {
        key: "2-2",
        title: "Listening and Speaking: The Startup Pitch",
        concepts: [
          "Listening for a speaker's purpose and key claims",
          "Recognising problems, solutions and evidence in a pitch",
          "Speaking: role-play an investor meeting",
        ],
        guide: `A pitch is a short, structured argument. Listen for four moves: the problem, the product, the evidence and the ask. The speaker may use phrases like "Our customers struggle with...", "Unlike existing solutions...", "We have already...", and "We are looking for...". These phrases are clues to the pitch's structure.
In an investor meeting, you need both confidence and curiosity. Ask questions such as "Who is your main customer?", "How will you make money?", and "What could go wrong?" A good investor does not only praise the idea; they test whether the team understands the risks. A good founder answers directly and does not promise more than the evidence supports.
Role-play with a partner. One of you presents a startup; the other asks three questions. Then swap roles. Use polite disagreement: "I see your point, but the market may be smaller than you think." At the end, give one strength and one improvement.`,
      },
      {
        key: "2-3",
        title: "Writing: A Business Email",
        concepts: [
          "Formal email structure: subject, greeting, purpose, action, closing",
          "Polite request and follow-up language",
          "Editing for clarity and register",
        ],
        guide: `A business email should be easy to act on. Put the purpose in the subject line, greet the reader appropriately, state why you are writing in the first two lines, and end with a clear request or next step. A useful shape is: context, request, deadline, thanks.
Formal English is not the same as long English. Prefer "Could you send the report by Thursday?" to "I would be extremely grateful if you could possibly consider sending..." Use "I am writing to..." for the purpose, "Could you please..." for a request, and "I look forward to hearing from you" for a closing.
Before sending, check three things: Is the reader's name correct? Is the action clear? Is the tone polite without being vague? Delete unnecessary apologies and repeated thanks. A short, precise email respects the reader's time and is more likely to get a reply.`,
      },
    ],
  },
  {
    key: "3",
    title: "Unit 3: Sustainable Development Goals",
    lessons: [
      {
        key: "3-1",
        title: "Reading and Language: Egypt Vision 2030",
        concepts: [
          "Reading for the main argument and examples",
          "Adjectives and adverbs: form, position and comparison",
          "Vocabulary for development, health, education and sustainability",
        ],
        guide: `This unit connects English to the Sustainable Development Goals and Egypt Vision 2030. When you read about development, look for the difference between a goal and a result. A goal is what a society wants to achieve; a result is evidence that something has changed. A strong answer uses both.
Adjectives describe nouns: "a healthy economy". Adverbs describe verbs, adjectives or other adverbs: "The economy is growing steadily." Be careful with forms: "good" becomes "well" as an adverb, while "fast" can be both. Comparison matters too: "more sustainable", "the most urgent", "as important as".
Choose one goal, such as quality education or good health, and explain it in three sentences: what the goal means, why it matters in Egypt, and one practical action. Use at least two adjectives and two adverbs. Then check that each adverb adds real information rather than repeating the adjective.`,
      },
      {
        key: "3-2",
        title: "Listening and Speaking: Egypt's Path to Better Healthcare",
        concepts: [
          "Listening for cause, effect and solutions",
          "Note-taking with headings and abbreviations",
          "Speaking: discussing comprehensive development",
        ],
        guide: `Development texts often describe a chain: a problem, a cause, an action and an effect. In this listening, listen for that chain. For example, a shortage of clinics may lead to a new programme, which leads to earlier treatment. If you only catch the action, you miss the reason it matters.
Use a note-taking layout with three columns: problem, action, result. Abbreviate common words, but do not invent symbols you will forget. After listening, reconstruct the chain in full sentences with a partner. This is more useful than copying the audio word for word.
In the discussion, connect health to other goals: education, poverty, clean water and inequality. A strong opinion includes a qualification: "Healthcare is essential, but it cannot succeed without clean water and nutrition." That sentence shows you understand development as a system, not a list.`,
      },
      {
        key: "3-3",
        title: "Writing: A Blog Post about Development",
        concepts: [
          "Blog structure: hook, context, example, reflection",
          "Using adjectives and adverbs precisely",
          "Writing for a general audience",
        ],
        guide: `A blog post is less formal than a report but still needs a clear structure. Start with a hook: a question, a surprising fact or a short scene. Then explain the issue, give one concrete example, and end with a reflection or a call to action. The reader should learn something and feel something.
Use adjectives and adverbs to make your writing specific. "A big problem" is vague; "a shortage of qualified nurses in rural clinics" is precise. "Very important" is weak; "essential" or "urgent" is stronger. Cut intensifiers such as "really" and "very" when a better word exists.
For this task, write about one development goal in your community. Include one number or example, one personal observation, and one suggestion. Keep paragraphs short. End with a question that invites the reader to think, not a generic "Thank you for reading".`,
      },
    ],
  },
  {
    key: "4",
    title: "Unit 4: Natural Disasters",
    lessons: [
      {
        key: "4-1",
        title: "Reading and Language: Understanding Natural Disasters",
        concepts: [
          "Reading for cause, impact and response",
          "Comparative and superlative adjectives",
          "Vocabulary for risk, emergency and recovery",
        ],
        guide: `A natural disaster is not only a physical event; it is the meeting of a hazard with a vulnerable community. An earthquake in an empty desert is different from an earthquake in a crowded city. When you read, separate the hazard, the damage and the response. This three-part frame helps you write clear summaries.
Comparative adjectives compare two things: "stronger", "more dangerous", "better". Superlatives compare one thing with a whole group: "the strongest", "the most dangerous", "the best". Use "than" with comparatives and "the" with superlatives. Avoid double comparatives such as "more stronger".
Vocabulary matters in emergencies. Learn the difference between "warning" (before), "evacuation" (moving people away), "relief" (help after) and "recovery" (long-term rebuilding). Then explain one disaster in three sentences using one comparative and one superlative.`,
      },
      {
        key: "4-2",
        title: "Listening and Speaking: Emergency Preparedness",
        concepts: [
          "Listening for instructions and sequence",
          "Risk assessment and decision-making under pressure",
          "Speaking: a city planning team role-play",
        ],
        guide: `Emergency instructions are usually sequenced: first, next, then, finally. Listen for imperative verbs and time markers. If you miss one step, the whole procedure may become unsafe, so check your notes with a partner and ask clarifying questions such as "Did they say before or after the alarm?"
Risk is a combination of probability and impact. A low-probability event with enormous impact may still need preparation. In the role-play, your team must decide where to spend a limited budget. Consider evacuation routes, shelters, communication, medical supplies and public education. Every choice has an opportunity cost.
A good team decision is not the loudest opinion. It states the criterion, compares options, and records the reason. Try: "We prioritised shelters because the flood risk is high and the impact on families is severe. That means we will delay the warning-system upgrade." This is transparent and testable.`,
      },
      {
        key: "4-3",
        title: "Writing: A Formal Report",
        concepts: [
          "Report structure: purpose, findings, recommendations",
          "Objective tone and passive voice",
          "Linking causes, effects and recommendations",
        ],
        guide: `A formal report answers a question for a reader who needs to act. Start with a short purpose statement, then present findings under clear headings, and end with recommendations. Unlike an essay, a report does not need a dramatic hook; it needs ordered evidence and a clear conclusion.
Use an objective tone. "The survey found that..." is stronger than "I think most people..." The passive voice is common in reports: "Three risks were identified." Use it when the action matters more than the doer, but do not hide responsibility when the doer is important.
Recommendations should follow from findings. If the finding is that few residents know the evacuation route, the recommendation is to publish a map and run a drill. Link them explicitly: "Because..., it is recommended that..." Finish with a priority and a time frame so the reader knows what to do first.`,
      },
    ],
  },
  {
    key: "5",
    title: "Unit 5: Media Manipulation",
    lessons: [
      {
        key: "5-1",
        title: "Reading and Language: The Anatomy of Fake News",
        concepts: [
          "Reading critically: claim, source, evidence and bias",
          "Tag questions",
          "Vocabulary for media, credibility and manipulation",
        ],
        guide: `Fake news is not always a completely invented story. It may be a real fact placed in a misleading context, a headline that exaggerates, or a source that looks official but is not. Critical reading means asking four questions: What is the claim? Who says it? What evidence is offered? What is left out?
Tag questions turn a statement into a check: "The source is reliable, isn't it?" "They didn't verify the photo, did they?" The tag uses the auxiliary of the main sentence and reverses its polarity. Be careful with negatives and with irregular auxiliaries.
Build a media vocabulary: credible, biased, anonymous, clickbait, misleading, verify, source, headline. Then choose one viral claim and evaluate it in four sentences. Do not simply say "it is fake"; explain which part is unsupported and what evidence would change your mind.`,
      },
      {
        key: "5-2",
        title: "Listening and Speaking: Regulating Social Media",
        concepts: [
          "Listening for arguments for and against regulation",
          "Evaluating the reliability of news sources",
          "Speaking: a structured discussion",
        ],
        guide: `Social media regulation raises a genuine conflict between two goods: protecting people from harm and protecting freedom of expression. A strong discussion does not pretend the conflict disappears. It defines the harm, proposes a measure, and asks whether the measure is proportionate.
While listening, sort the speakers' points into three groups: safety, freedom and practicality. Then notice which evidence they use: a study, an anecdote, a principle or a prediction. Evidence is not all equal. A single story can illustrate a problem, but it cannot prove how common the problem is.
In your discussion, use a structure: "I agree that..., but I would add...", "That may be true in some cases; however...", and "What would change your mind?" The last question is especially powerful because it tests whether a position is open to evidence.`,
      },
      {
        key: "5-3",
        title: "Writing: An Opinion Essay",
        concepts: [
          "Opinion essay structure: thesis, reasons, counterargument, conclusion",
          "Using evidence without overclaiming",
          "Tag questions for rhetorical effect",
        ],
        guide: `An opinion essay is an argument, not a list of feelings. State a clear thesis, support it with reasons and evidence, and answer the strongest objection. A counterargument makes your essay more credible because it shows you have considered the other side.
Use evidence carefully. "A study found..." is stronger than "Everyone knows..." If you are unsure, qualify: "This may be because..." or "One possible explanation is..." Overclaiming weakens trust. A rhetorical tag question can engage the reader, but it should not replace evidence: "If we cannot verify a story, should we share it?"
Choose a media issue, such as whether platforms should label manipulated images. Write four paragraphs: introduction, two supporting reasons, counterargument and conclusion. End with a practical recommendation, not a vague call for "more awareness".`,
      },
    ],
  },
  {
    key: "6",
    title: "Unit 6: Soft Skills vs. Hard Skills",
    lessons: [
      {
        key: "6-1",
        title: "Reading and Language: Hard Skills and Soft Skills",
        concepts: [
          "Reading an article about skills and future careers",
          "Defining and non-defining relative clauses",
          "Vocabulary for teamwork, communication and employability",
        ],
        guide: `Hard skills are teachable, measurable abilities such as coding, accounting or operating a machine. Soft skills are interpersonal and personal abilities such as communication, teamwork, problem-solving and emotional intelligence. The contrast is useful, but the best employees need both. A brilliant programmer who cannot explain an idea will struggle; a friendly colleague who cannot do the task will also struggle.
Relative clauses add information about a noun. A defining clause is essential: "The skill that employers value most is communication." A non-defining clause adds extra information between commas: "Communication, which is often called a soft skill, is essential." Do not use "that" in a non-defining clause.
Think about your own evidence. Instead of saying "I am a good team player", describe a situation: "In a school project, I organised the schedule and helped two classmates meet the deadline." Evidence is more persuasive than a label.`,
      },
      {
        key: "6-2",
        title: "Listening and Speaking: The Skills Debate",
        concepts: [
          "Listening for claims, examples and concessions",
          "Note-taking in a debate",
          "Speaking: discussing future careers",
        ],
        guide: `A debate is easier to follow if you track the moves: claim, reason, example, concession, response. Speakers often signal a concession with "Admittedly", "It is true that" or "While I accept that". These phrases do not mean the speaker has changed sides; they often prepare a stronger response.
Take notes in two columns: "for" and "against". Under each, write the claim and one piece of evidence. Then identify the point where the speakers disagree most sharply. That point is usually the best place to enter the discussion yourself.
When you discuss future careers, avoid predicting with certainty. Use "is likely to", "may", "could" and "it depends on". The future of work is shaped by technology, demography and policy, so a good answer names the uncertainty rather than hiding it.`,
      },
      {
        key: "6-3",
        title: "Writing: A Descriptive Essay about a Person",
        concepts: [
          "Descriptive essay structure and sensory detail",
          "Defining and non-defining relative clauses",
          "Showing character through action, not labels",
        ],
        guide: `A descriptive essay about a person should make the reader see the person, not just read a list of adjectives. Choose two or three concrete details: a habit, an object, a gesture, a way of speaking. Then show what those details reveal about character.
Relative clauses help you combine information smoothly. "My grandfather, who taught me to repair bicycles, was patient with every mistake." The clause adds context without a new short sentence. But do not chain too many clauses; clarity matters more than complexity.
Avoid empty labels such as "kind" or "hard-working" unless you prove them. A sentence like "He always left the last piece of bread for whoever came late" shows generosity through action. End with a reflection: what did this person teach you, and how does that lesson appear in your own life?`,
      },
    ],
  },
];

export const EGYPT_ENGLISH_G11_T1_BOOK = {
  subject: "English",
  grade: "Grade 11 (Secondary 2)",
  sourceUrl: EGYPT_ENGLISH_G11_T1_SOURCE,
};

export function isEnglishG11TreeConsistent() {
  return checkG11Tree("English — Secondary 2", EGYPT_ENGLISH_G11_T1_UNITS);
}

export function englishG11LessonDocument(unitIndex: number, lessonIndex: number): string {
  return g11LessonDocument(EGYPT_ENGLISH_G11_T1_BOOK, EGYPT_ENGLISH_G11_T1_UNITS, unitIndex, lessonIndex);
}
