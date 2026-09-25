import { describe, expect, it } from "vitest";
import {
  gradeContainsAnswerKey,
  gradeFallback,
  gradePrompt,
  normalizeArabic,
  parseGrade,
  referenceCoverage,
  tokensOf,
} from "../../src/modules/practice/grade.js";
import { buildMockGrade } from "../../src/modules/ai/providers/mock.js";

/**
 * PHASE 30 — the open-question grading boundary: Arabic normalization and
 * token coverage (deterministic fallback grading), the strict `parseGrade`
 * JSON boundary, the «لا نص حرفي» guard that rejects feedback re-quoting the
 * hidden answer, and determinism of both the fallback and the mock provider
 * grader.
 */
describe("grade — Arabic normalization (PHASE 30)", () => {
  it("strips tashkeel + tatweel and collapses whitespace", () => {
    expect(normalizeArabic("  نَـقْسِمُ  الْكَسْرَ  ")).toBe("نقسم الكسر");
  });

  it("unifies alef forms and ى → ي", () => {
    expect(normalizeArabic("أحمد إبراهيم آمنة علي")).toBe("احمد ابراهيم امنة علي");
  });

  it("maps Arabic-Indic digits to Latin", () => {
    expect(normalizeArabic("ناتج ٨٤٥")).toBe("ناتج 845");
  });

  it("keeps Latin tokens comparable (2/3 vs ٢/٣)", () => {
    expect(normalizeArabic("٢/٣")).toBe("2/3");
    expect(normalizeArabic("2/3")).toBe("2/3");
  });
});

describe("grade — token coverage (PHASE 30)", () => {
  it("splits only on non-letter/non-digit separators", () => {
    expect(tokensOf("نقسم البسط 2/3 على 4")).toEqual(["نقسم", "البسط", "2", "3", "على", "4"]);
  });

  it("full overlap → 1", () => {
    expect(referenceCoverage("نقسم البسط والمقام على 4", "نقسم البسط والمقام على 4")).toBe(1);
  });

  it("partial overlap → the reference-token ratio", () => {
    // «نقسم البسط والمقام على 4» tokenizes to 5 tokens (والمقام rides one token).
    const score = referenceCoverage("نقسم البسط والمقام على 4", "البسط والمقام على 4");
    expect(score).toBe(4 / 5);
  });

  it("no overlap → 0", () => {
    expect(referenceCoverage("نقسم البسط", "إجابة عشوائية تمامًا")).toBe(0);
  });

  it("short numeric keys behave like exact matches", () => {
    expect(referenceCoverage("26", "26")).toBe(1);
    expect(referenceCoverage("26", "2/6")).toBe(0);
    expect(referenceCoverage("26", "846")).toBe(0);
  });

  it("tolerates modest rephrasing for multi-word references", () => {
    expect(referenceCoverage("الجمع مع إعادة التجميع", "إعادة التجميع في الجمع")).toBe(3 / 4);
    expect(referenceCoverage("الجمع مع إعادة التجميع", "إعادة التجميع")).toBe(2 / 4);
  });
});

describe("grade — parseGrade boundary (PHASE 30)", () => {
  it("accepts a valid JSON grade", () => {
    expect(parseGrade('{"correct": true, "score": 0.85, "feedback": "إجابة جيدة"}')).toEqual({
      correct: true,
      score: 0.85,
      feedback: "إجابة جيدة",
    });
  });

  it("tolerates a fenced ```json block", () => {
    const grade = parseGrade('```json\n{"correct": false, "score": 0.4, "feedback": "قريبة"}\n```');
    expect(grade).toEqual({ correct: false, score: 0.4, feedback: "قريبة" });
  });

  it("rejects a score outside [0, 1]", () => {
    expect(parseGrade('{"correct": true, "score": 1.4, "feedback": "جيد"}')).toBeNull();
    expect(parseGrade('{"correct": true, "score": -0.2, "feedback": "جيد"}')).toBeNull();
  });

  it("rejects non-boolean correct / non-finite score / empty feedback", () => {
    expect(parseGrade('{"correct": "yes", "score": 0.5, "feedback": "جيد"}')).toBeNull();
    expect(parseGrade('{"correct": true, "score": null, "feedback": "جيد"}')).toBeNull();
    expect(parseGrade('{"correct": true, "score": 0.5, "feedback": "   "}')).toBeNull();
  });

  it("rejects non-JSON output", () => {
    expect(parseGrade("ليس JSON إطلاقًا")).toBeNull();
    expect(parseGrade("")).toBeNull();
  });
});

describe("grade — prompt builder keeps untrusted text out of the system turn (PHASE 30)", () => {
  it("puts the reference only in the system prompt and the student answer only in the user turn", () => {
    const { system, user } = gradePrompt({
      conceptTitle: "تبسيط الكسور",
      questionContent: "اكتب الكسر المبسّط للكسر 8/12.",
      referenceAnswer: "2/3",
      studentAnswer: "سأكتب نص كشف عابر",
    });
    expect(system).toContain("<reference>2/3</reference>");
    expect(system).not.toContain("سأكتب نص كشف عابر");
    expect(user).toContain("<student_answer>");
    expect(user).toContain("سأكتب نص كشف عابر");
    expect(user).not.toContain("2/3");
  });
});

describe("grade — «لا نص حرفي» guard (PHASE 30)", () => {
  it("flags a verbatim echo of the reference in feedback", () => {
    expect(gradeContainsAnswerKey("إجابتك 2/3 صحيحة تمامًا", "2/3")).toBe(true);
  });

  it("flags feedback echoing most of a long reference", () => {
    const ref = "نقسم البسط والمقام على العامل المشترك الأكبر";
    expect(gradeContainsAnswerKey(`أحسنت! ${ref} هو المطلوب هنا`, ref)).toBe(true);
  });

  it("passes unrelated educational feedback", () => {
    expect(gradeContainsAnswerKey("راجع خطوات القسمة ثم أعد المحاولة", "26")).toBe(false);
    expect(gradeContainsAnswerKey("فكرتك صحيحة لكن رتّب خطوات الحل", "نقسم البسط والمقام على العامل المشترك الأكبر")).toBe(false);
  });

  it("below the meaningfulness floor for tiny keys (relies on templates)", () => {
    // "26" normalizes to 2 chars — the guard deliberately does not flag it;
    // the fixed feedback templates never echo numeric keys anyway.
    expect(gradeContainsAnswerKey("ربما تحتاج للمراجعة", "26")).toBe(false);
  });
});

describe("grade — deterministic fallback (PHASE 30)", () => {
  it("is deterministic and correct on a full answer", () => {
    const a = gradeFallback({ conceptTitle: "تبسيط الكسور", referenceAnswer: "2/3", studentAnswer: "2/3" });
    const b = gradeFallback({ conceptTitle: "تبسيط الكسور", referenceAnswer: "2/3", studentAnswer: "2/3" });
    expect(a).toEqual(b);
    expect(a.correct).toBe(true);
    expect(a.score).toBe(1);
    expect(a.fallback).toBe(true);
  });

  it("scores partial answers and marks them incorrect below the threshold", () => {
    // «نقسم البسط والمقام على 4» = 5 tokens; «البسط والمقام» covers 2 → 0.4 (near band).
    const near = gradeFallback({ conceptTitle: null, referenceAnswer: "نقسم البسط والمقام على 4", studentAnswer: "البسط والمقام" });
    expect(near.correct).toBe(false);
    expect(near.score).toBe(0.4);
    expect(near.feedback).toContain("قريبة");
  });

  it("falls back plainly for unrelated answers", () => {
    const weak = gradeFallback({ conceptTitle: null, referenceAnswer: "نقسم البسط والمقام على 4", studentAnswer: "لا أعرف" });
    expect(weak.correct).toBe(false);
    expect(weak.score).toBe(0);
    expect(weak.feedback).toContain("غير دقيقة");
  });

  it("never echoes the reference answer in the fallback feedback", () => {
    const ref = "ناتج 487 + 358 مع إعادة التجميع هو 845";
    for (const answer of [ref, "845", "848", "844", "لا أعرف"]) {
      const grade = gradeFallback({ conceptTitle: "الجمع مع إعادة التجميع", referenceAnswer: ref, studentAnswer: answer });
      expect(grade.feedback).not.toContain("845");
      expect(grade.feedback).not.toContain("487");
    }
  });
});

describe("grade — mock provider `buildMockGrade` determinism (PHASE 30)", () => {
  it("is deterministic and mirrors the fallback outcome", () => {
    const a = buildMockGrade("2/3", "2/3");
    const b = buildMockGrade("2/3", "2/3");
    expect(a).toEqual(b);
    expect(a.correct).toBe(true);
    expect(a.score).toBe(1);
  });

  it("marks unrelated answers incorrect within [0, 1]", () => {
    const grade = buildMockGrade("نقسم البسط والمقام على العامل المشترك الأكبر", "أهلاً بالعالم");
    expect(grade.correct).toBe(false);
    expect(grade.score).toBeGreaterThanOrEqual(0);
    expect(grade.score).toBeLessThanOrEqual(1);
  });

  it("feedback never contains reference tokens", () => {
    const ref = "المقطع الصحيح من الدرس";
    for (const answer of [ref, "المقطع الصحيح", "لا "]) {
      const grade = buildMockGrade(ref, answer);
      expect(grade.feedback).not.toContain("المقطع");
    }
  });
});