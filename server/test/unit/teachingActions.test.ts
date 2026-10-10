import { describe, expect, it } from "vitest";
import {
  TEACHING_ACTION_TYPES,
  decideTeachingAction,
  looksLikeNumericOrdering,
  parseTeachingAction,
  teachingActionDirective,
  type TeachingAction,
} from "../../src/modules/tutor/teachingActions.js";

/**
 * PHASE 93/adaptive — the typed teaching-action contract and the deterministic
 * adaptive policy. The model never chooses an action; the engine does.
 */

const baseFacts = {
  intent: "explanation" as const,
  isAnswerTurn: false,
  lastAnswerCorrect: null,
  studentConfused: false,
  alreadyExplained: false,
  numericOrdering: false,
  hasBookPages: false,
  hasInk: false,
  hasAttachment: false,
  questionEmpty: false,
  prerequisite: null,
  nextConcept: null,
  concept: "المفهوم",
};

describe("TeachingAction contract (zod)", () => {
  const samples: TeachingAction[] = [
    { type: "explain", concept: "أ", reason: "r" },
    { type: "diagnose", concept: null, reason: "r" },
    { type: "hint", concept: "أ", reason: "r", level: 2 },
    { type: "visual_explanation", concept: "أ", reason: "r" },
    { type: "interactive_board", concept: "أ", reason: "r", board: "numberline" },
    { type: "textbook_reference", concept: "أ", reason: "r", pages: [12, 13] },
    { type: "practice", concept: "أ", reason: "r" },
    { type: "review_prerequisite", concept: "أ", reason: "r", prerequisite: "الجمع", mastery: 0.3 },
    { type: "celebrate_progress", concept: "أ", reason: "r" },
    { type: "continue_learning", concept: "أ", reason: "r", nextConcept: "ب" },
  ];

  it("validates every declared action type", () => {
    for (const sample of samples) {
      expect(TEACHING_ACTION_TYPES).toContain(sample.type);
      expect(parseTeachingAction(sample)).not.toBeNull();
    }
  });

  it("rejects an unknown board (the model may not invent a board)", () => {
    expect(parseTeachingAction({ type: "interactive_board", concept: "أ", reason: "r", board: "hologram" })).toBeNull();
  });

  it("rejects a prerequisite action with no prerequisite text", () => {
    expect(parseTeachingAction({ type: "review_prerequisite", concept: "أ", reason: "r" })).toBeNull();
  });

  it("rejects a hint level outside 1..2", () => {
    expect(parseTeachingAction({ type: "hint", concept: "أ", reason: "r", level: 5 })).toBeNull();
  });

  it("rejects an empty reason", () => {
    expect(parseTeachingAction({ type: "explain", concept: "أ", reason: "" })).toBeNull();
  });
});

describe("decideTeachingAction — deterministic adaptive policy", () => {
  it("is deterministic: same facts always yield the same action", () => {
    expect(decideTeachingAction({ ...baseFacts, intent: "exercise" })).toEqual(
      decideTeachingAction({ ...baseFacts, intent: "exercise" }),
    );
  });

  it("attachment-only ink turn: explain the marked spot (the marks ARE the question)", () => {
    expect(decideTeachingAction({ ...baseFacts, hasAttachment: true, questionEmpty: true, hasInk: true })).toEqual({
      type: "explain",
      concept: "المفهوم",
      reason: "ink_question",
    });
  });

  it("attachment-only photo turn: explain what it points at", () => {
    expect(decideTeachingAction({ ...baseFacts, hasAttachment: true, questionEmpty: true })).toMatchObject({
      type: "explain",
      reason: "attachment_question",
    });
  });

  it("correct answer: celebrate and move on — never re-teach or re-test", () => {
    expect(decideTeachingAction({ ...baseFacts, isAnswerTurn: true, lastAnswerCorrect: true })).toEqual({
      type: "celebrate_progress",
      concept: "المفهوم",
      reason: "answer_correct",
    });
  });

  it("wrong answer with a weak prerequisite: rebuild the foundation first", () => {
    expect(
      decideTeachingAction({
        ...baseFacts,
        isAnswerTurn: true,
        lastAnswerCorrect: false,
        prerequisite: { title: "الجمع", mastery: 0.2 },
      }),
    ).toEqual({
      type: "review_prerequisite",
      concept: "المفهوم",
      reason: "answer_wrong_prerequisite",
      prerequisite: "الجمع",
      mastery: 0.2,
    });
  });

  it("wrong answer with a solid prerequisite: give a hint, not the solution", () => {
    expect(
      decideTeachingAction({
        ...baseFacts,
        isAnswerTurn: true,
        lastAnswerCorrect: false,
        prerequisite: { title: "الجمع", mastery: 0.9 },
      }),
    ).toMatchObject({ type: "hint", reason: "answer_wrong", level: 1 });
  });

  it("wrong answer with unknown prerequisite mastery (null): hint, never assume weakness", () => {
    expect(
      decideTeachingAction({
        ...baseFacts,
        isAnswerTurn: true,
        lastAnswerCorrect: false,
        prerequisite: { title: "الجمع", mastery: null },
      }),
    ).toMatchObject({ type: "hint", reason: "answer_wrong", level: 1 });
  });

  it("unverified answer: teach, never assert mastery", () => {
    expect(decideTeachingAction({ ...baseFacts, isAnswerTurn: true, lastAnswerCorrect: null })).toMatchObject({
      type: "explain",
      reason: "answer_unverified",
    });
  });

  it("confusion after an earlier explanation: a different approach, not a repeat", () => {
    expect(decideTeachingAction({ ...baseFacts, studentConfused: true, alreadyExplained: true })).toMatchObject({
      type: "visual_explanation",
      reason: "confused_retry",
    });
  });

  it("confusion over a known-weak prerequisite: rebuild the foundation first", () => {
    expect(
      decideTeachingAction({
        ...baseFacts,
        studentConfused: true,
        alreadyExplained: true,
        prerequisite: { title: "الجمع", mastery: 0.2 },
      }),
    ).toEqual({
      type: "review_prerequisite",
      concept: "المفهوم",
      reason: "confused_weak_prerequisite",
      prerequisite: "الجمع",
      mastery: 0.2,
    });
  });

  it("confusion over an unknown-mastery prerequisite: retry visually, do not assume a gap", () => {
    expect(
      decideTeachingAction({
        ...baseFacts,
        studentConfused: true,
        alreadyExplained: true,
        prerequisite: { title: "الجمع", mastery: null },
      }),
    ).toMatchObject({ type: "visual_explanation", reason: "confused_retry" });
  });

  it("confusion on the first explanation: start simpler", () => {
    expect(decideTeachingAction({ ...baseFacts, studentConfused: true, alreadyExplained: false })).toMatchObject({
      type: "explain",
      reason: "confused_first_time",
      approach: "simpler",
    });
  });

  it("numeric ordering question: draw the deterministic board", () => {
    expect(decideTeachingAction({ ...baseFacts, numericOrdering: true, intent: "explanation" })).toMatchObject({
      type: "interactive_board",
      board: "numberline",
      reason: "numeric_ordering",
    });
  });

  it("exercise request without ordering: a real practice question", () => {
    expect(decideTeachingAction({ ...baseFacts, intent: "exercise" })).toMatchObject({
      type: "practice",
      reason: "exercise_request",
    });
  });

  it("hint request: a nudge that leaves the decisive step to the student", () => {
    expect(decideTeachingAction({ ...baseFacts, intent: "hint_request" })).toMatchObject({
      type: "hint",
      reason: "hint_request",
      level: 1,
    });
  });

  it("understood with a next objective: continue the roadmap", () => {
    expect(decideTeachingAction({ ...baseFacts, intent: "check_understanding", nextConcept: "الطرح" })).toEqual({
      type: "continue_learning",
      concept: "المفهوم",
      reason: "understood_advance",
      nextConcept: "الطرح",
    });
  });

  it("understood at the end of the roadmap: deepen instead of looping", () => {
    expect(decideTeachingAction({ ...baseFacts, intent: "check_understanding", nextConcept: null })).toMatchObject({
      type: "practice",
      reason: "understood_deepen",
    });
  });

  it("first explanation with book pages: ground it in the printed example", () => {
    expect(decideTeachingAction({ ...baseFacts, intent: "explanation", hasBookPages: true })).toMatchObject({
      type: "textbook_reference",
      reason: "explain_from_book",
    });
  });

  it("repeat explanation: plain explain (the page was already shown)", () => {
    expect(
      decideTeachingAction({ ...baseFacts, intent: "explanation", hasBookPages: true, alreadyExplained: true }),
    ).toMatchObject({ type: "explain", reason: "explanation_request" });
  });

  it("greeting / session start: teach the first idea, do not chat", () => {
    expect(decideTeachingAction({ ...baseFacts, intent: "motivation" })).toMatchObject({
      type: "explain",
      reason: "start_teaching",
    });
  });

  it("off-topic: redirect gently to the lesson", () => {
    expect(decideTeachingAction({ ...baseFacts, intent: "off_topic" })).toMatchObject({
      type: "explain",
      reason: "redirect_to_lesson",
    });
  });
});

describe("looksLikeNumericOrdering", () => {
  it("detects Arabic ordering/comparison questions", () => {
    expect(looksLikeNumericOrdering("رتّب الأعداد تصاعديًا")).toBe(true);
    expect(looksLikeNumericOrdering("أين يقع الكسر ٣/٤ على خط الأعداد؟")).toBe(true);
    expect(looksLikeNumericOrdering("قارن بين ٠.٥ و ٠.٧")).toBe(true);
  });

  it("does not fire on unrelated questions", () => {
    expect(looksLikeNumericOrdering("ما معنى الكلمة في الدرس؟")).toBe(false);
    expect(looksLikeNumericOrdering("")).toBe(false);
  });
});

describe("teachingActionDirective", () => {
  const samples: TeachingAction[] = [
    { type: "explain", concept: "أ", reason: "r" },
    { type: "diagnose", concept: null, reason: "r" },
    { type: "hint", concept: "أ", reason: "r" },
    { type: "visual_explanation", concept: "أ", reason: "r" },
    { type: "interactive_board", concept: "أ", reason: "r", board: "numberline" },
    { type: "interactive_board", concept: "أ", reason: "r", board: "ink" },
    { type: "textbook_reference", concept: "أ", reason: "r" },
    { type: "practice", concept: "أ", reason: "r" },
    { type: "review_prerequisite", concept: "أ", reason: "r", prerequisite: "الجمع" },
    { type: "celebrate_progress", concept: "أ", reason: "r" },
    { type: "continue_learning", concept: "أ", reason: "r", nextConcept: "الطرح" },
  ];

  it("produces a non-empty instruction for every action type", () => {
    for (const action of samples) expect(teachingActionDirective(action).length).toBeGreaterThan(0);
  });

  it("names the prerequisite and the next objective so the model cannot confuse them", () => {
    expect(
      teachingActionDirective({ type: "review_prerequisite", concept: "أ", reason: "r", prerequisite: "الجمع" }),
    ).toContain("الجمع");
    expect(
      teachingActionDirective({ type: "continue_learning", concept: "أ", reason: "r", nextConcept: "الطرح" }),
    ).toContain("الطرح");
  });
});
