import { describe, expect, it } from "vitest";
import {
  assertsCorrectness,
  gradeTextAnswer,
  numbersIn,
  splitReplyQuestionKey,
} from "../../src/modules/tutor/questionKey.js";

/**
 * PHASE 146 — «المحرك يقرّر»: the tutor asked a written question, the student
 * answered WRONG, and the tutor said «صحيح». These tests lock the two halves of
 * the fix: the ENGINE grades a written answer against the key the tutor attached
 * to its question (deterministically, no model in the loop), and praise without
 * a verdict is detected so it can never ship.
 */
describe("gradeTextAnswer — the engine's verdict on a written answer", () => {
  it("grades numeric keys exactly, Latin and Arabic-Indic alike", () => {
    expect(gradeTextAnswer("7", "7")).toBe(true);
    expect(gradeTextAnswer("7", "٧")).toBe(true);
    expect(gradeTextAnswer("42", "42")).toBe(true);
    expect(gradeTextAnswer("42", "٤٢")).toBe(true);
    // A wrong number is wrong, however it is written.
    expect(gradeTextAnswer("7", "17")).toBe(false);
    expect(gradeTextAnswer("7", "8")).toBe(false);
    expect(gradeTextAnswer("42", "24")).toBe(false);
  });

  it("finds the key number inside a sentence answer", () => {
    expect(gradeTextAnswer("12", "الإجابة هي 12")).toBe(true);
    expect(gradeTextAnswer("12", "أعتقد أنها 12 سم")).toBe(true);
    expect(gradeTextAnswer("12", "الإجابة هي 13")).toBe(false);
  });

  it("keeps the order of a fractional key (2/3 is not 3/2)", () => {
    expect(gradeTextAnswer("2/3", "2/3")).toBe(true);
    expect(gradeTextAnswer("2/3", "٣/٢")).toBe(false);
  });

  it("grades word keys by token coverage", () => {
    expect(gradeTextAnswer("ارتفاع المثلث", "ارتفاع المثلث")).toBe(true);
    expect(gradeTextAnswer("ارتفاع المثلث", "الارتفاع هو المثلث")).toBe(true);
    expect(gradeTextAnswer("ارتفاع المثلث", "قاعدة المثلث")).toBe(false);
  });

  it("needs BOTH halves when the key mixes words and a number", () => {
    expect(gradeTextAnswer("نقسم الطرفين على 4", "نقسم الطرفين على 4")).toBe(true);
    expect(gradeTextAnswer("نقسم الطرفين على 4", "نقسم الطرفين على 5")).toBe(false);
    expect(gradeTextAnswer("نقسم الطرفين على 4", "نضرب الطرفين في 4")).toBe(false);
  });

  it("refuses to grade an empty key or an empty answer", () => {
    expect(gradeTextAnswer("", "7")).toBe(false);
    expect(gradeTextAnswer("7", "   ")).toBe(false);
  });
});

describe("numbersIn", () => {
  it("reads numbers in document order", () => {
    expect(numbersIn("x = 12 و y = 3.5")).toEqual([12, 3.5]);
    expect(numbersIn("لا أرقام هنا")).toEqual([]);
  });
});

describe("splitReplyQuestionKey — the key never travels to the browser", () => {
  it("takes the first question key out of the parts", () => {
    const { parts, questionAnswer } = splitReplyQuestionKey([
      { type: "text", text: "اسمع جيدًا" },
      { type: "question", text: "كم ناتج ٦ × ٧؟", answer: "42" },
    ]);
    expect(questionAnswer).toBe("42");
    for (const p of parts) expect(p).not.toHaveProperty("answer");
    expect(parts[1]).toEqual({ type: "question", text: "كم ناتج ٦ × ٧؟" });
  });

  it("ignores a key attached to a non-question part, but still strips it", () => {
    const { parts, questionAnswer } = splitReplyQuestionKey([
      { type: "text", text: "خطوة أولى", answer: "لا يجب أن تُقرأ" },
    ]);
    expect(questionAnswer).toBeNull();
    expect(parts[0]).not.toHaveProperty("answer");
  });

  it("keeps the first key when a reply carries more than one", () => {
    const { questionAnswer } = splitReplyQuestionKey([
      { type: "question", text: "س1", answer: "أول" },
      { type: "question", text: "س2", answer: "ثاني" },
    ]);
    expect(questionAnswer).toBe("أول");
  });

  it("returns no key for an empty reply", () => {
    expect(splitReplyQuestionKey(undefined)).toEqual({ parts: [], questionAnswer: null });
  });
});

describe("assertsCorrectness — unearned praise is a bug", () => {
  it("catches the phrases a student reads as «your answer is right»", () => {
    for (const text of [
      "أحسنت يا بطل!",
      "إجابة صحيحة تمامًا",
      "إجابتك صحيحة، لنكمل",
      "بالضبط!",
      "ممتاز، هل تجرب المثال التالي؟",
      "صحيح، نكمل الآن",
      "That's right, well done!",
    ]) {
      expect(assertsCorrectness(text)).toBe(true);
    }
  });

  it("does not fire on a neutral teaching line", () => {
    for (const text of [
      "الخيار الصحيح هو الجمع لأن...",
      "الحل الصحيح يكون بجمع البسطين",
      "أعد الخطوة الصحيحة أمامك ثم قارن",
      "لنكمل الفكرة التالية من الدرس",
    ]) {
      expect(assertsCorrectness(text)).toBe(false);
    }
  });
});
