import { describe, expect, it } from "vitest";
import {
  ADAPTATION_RULES,
  TEACHING_METHOD,
  lessonRoadmap,
  turnDirective,
  type TurnFacts,
} from "../../src/modules/tutor/teachingStrategy.js";

/**
 * PHASE 76 — the teaching method, tested in isolation from the curriculum.
 *
 * The regression this module guards against is behavioural, not textual: the
 * old tutor ended *every* reply with a checking question, so it read as an
 * interrogation loop rather than a lesson. These tests pin the deliberate
 * replacement — explain first, ask only at a checkpoint, one step per turn,
 * and adapt to the student's response.
 */
const facts = (over: Partial<TurnFacts> = {}): TurnFacts => ({
  intent: "explanation",
  isAnswerTurn: false,
  hasImage: false,
  hasDocument: false,
  questionEmpty: false,
  ...over,
});

describe("teachingStrategy — the method", () => {
  it("explains first rather than opening every reply with a question", () => {
    expect(TEACHING_METHOD).toContain("اشرح أولًا");
    expect(TEACHING_METHOD).toContain("السؤال أداةٌ لا عادة");
    expect(TEACHING_METHOD).toContain("ليس في كل ردّ");
  });

  it("teaches one idea at a time and never skips ahead while the student is stuck", () => {
    expect(TEACHING_METHOD).toContain("خطوةً واحدة في كل ردّ");
    expect(TEACHING_METHOD).toContain("الطالب متعثّر في الحالية");
  });

  it("adapts to a correct answer, a mistake, confusion and silence", () => {
    expect(ADAPTATION_RULES).toContain("أجاب صحيحًا");
    expect(ADAPTATION_RULES).toContain("بأسلوب مختلف");
    expect(ADAPTATION_RULES).toContain("مش فاهم");
    expect(ADAPTATION_RULES).toContain("لم يصل إلى إجابة");
  });

  it("never names a Ministry book page (the page rule belongs to the curriculum prompt)", () => {
    expect(TEACHING_METHOD).not.toContain("من كتاب الوزارة");
    expect(ADAPTATION_RULES).not.toContain("من كتاب الوزارة");
  });
});

describe("teachingStrategy — the lesson roadmap", () => {
  it("lists the lesson's concepts in printed order", () => {
    const roadmap = lessonRoadmap(["الفكرة العامة", "المعنى اللغوي"]);
    expect(roadmap).toContain("1) الفكرة العامة");
    expect(roadmap).toContain("2) المعنى اللغوي");
    expect(roadmap).toContain("خطوة واحدة في كل ردّ");
  });

  it("falls back to the book's page order when the lesson has no recorded concepts", () => {
    const roadmap = lessonRoadmap(["  ", ""]);
    expect(roadmap).toContain("ترتيب أفكار الكتاب");
    expect(roadmap).not.toContain("1)");
  });
});

describe("teachingStrategy — the per-turn directive", () => {
  it("asks the teacher to explain, not to interrogate, on an explanation turn", () => {
    const directive = turnDirective(facts({ intent: "explanation" }));
    expect(directive).toContain("شرحٌ لا استجواب");
    expect(directive).toContain("خطوةً واحدة كاملة");
    expect(directive).not.toContain("اسأل سؤالًا");
  });

  it("forces evaluate-then-teach on an answer turn", () => {
    const directive = turnDirective(facts({ intent: "answer", isAnswerTurn: true }));
    expect(directive).toContain("قيّم إجابته");
    expect(directive).toContain("علّمه الخطوة التالية");
    expect(directive).toContain("لا تجعل ردّك مجرّد سؤال جديد");
  });

  it("moves forward instead of re-testing when the student says «فهمت»", () => {
    const directive = turnDirective(facts({ intent: "check_understanding" }));
    expect(directive).toContain("علّمه الفكرة التالية");
    expect(directive).toContain("ممنوع أن تبسّط");
  });

  it("starts the actual lesson on a greeting", () => {
    const directive = turnDirective(facts({ intent: "motivation" }));
    expect(directive).toContain("ابدأ التعليم فعلًا");
  });

  it("stays silent for an attachment-only turn (its ask line already names the task)", () => {
    expect(turnDirective(facts({ hasImage: true, questionEmpty: true }))).toBe("");
    expect(turnDirective(facts({ hasDocument: true, questionEmpty: true }))).toBe("");
  });
});
