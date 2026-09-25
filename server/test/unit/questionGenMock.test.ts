import { describe, expect, it } from "vitest";
import { MockLLMProvider, buildMockQuestion } from "../../src/modules/ai/providers/mock.js";
import { groundingPrompt, parseGeneratedQuestion } from "../../src/modules/practice/questionGen.js";

const CONTEXT =
  "درس الكسور الاعتيادية. مقارنة الكسور ذات المقامات المتشابهة تعتمد على البسط، فمثلًا 3/5 أكبر من 2/5. تبسيط الكسور يكون بقسمة البسط والمقام على العامل المشترك الأكبر. عبارة الزعفرانة النبتة الاستوائية غير موجودة في هذا الدرس.";

/**
 * PHASE 28 — the deterministic offline MCQ generator that powers question_gen
 * with mock providers: grounded (correct option is verbatim from the lesson),
 * stable (same input → same output), and safe (negation sentences like the
 * tripwire are never picked as the answer). Plus the strict parser boundary
 * that turns provider replies into stored questions.
 */
describe("buildMockQuestion (mock question_gen) — PHASE 28", () => {
  it("is deterministic for the same context", () => {
    const a = buildMockQuestion(CONTEXT, "مقارنة الكسور");
    const b = buildMockQuestion(CONTEXT, "مقارنة الكسور");
    expect(a).toEqual(b);
  });

  it("grounds the correct option verbatim in the lesson text", () => {
    const q = buildMockQuestion(CONTEXT, "مقارنة الكسور");
    expect(q.options.length).toBe(4);
    expect(q.correctIndex).toBeGreaterThanOrEqual(0);
    expect(q.correctIndex).toBeLessThan(4);
    const correct = q.options[q.correctIndex]!;
    expect(CONTEXT).toContain(correct);
    // No duplicate options, ever.
    expect(new Set(q.options).size).toBe(4);
  });

  it("mentions the concept in the stem and explains why the answer is right", () => {
    const q = buildMockQuestion(CONTEXT, "مقارنة الكسور");
    expect(q.content).toContain("مقارنة الكسور");
    expect(q.content).toContain("أي العبارات التالية وردت في الدرس");
    expect(q.explanation).toContain(q.options[q.correctIndex]!);
  });

  it("never picks the tripwire negation sentence as the answer", () => {
    for (let i = 0; i < 5; i++) {
      const q = buildMockQuestion(CONTEXT + ` حشو ${i} رقمية.`, "مقارنة الكسور");
      const correct = q.options[q.correctIndex]!;
      expect(correct).not.toContain("غير موجود");
    }
  });

  it("falls back to a single-fact context without breaking", () => {
    const q = buildMockQuestion("جملة واحدة فقط عن الجمع.", null);
    expect(q.options.length).toBe(4);
    expect(q.correctIndex).toBeGreaterThanOrEqual(0);
    expect(q.content).not.toContain("«");
  });
});

describe("mock complete for question_gen — PHASE 28", () => {
  it("emits a parseable, grounded MCQ JSON for the operation", async () => {
    const provider = new MockLLMProvider();
    const { system, user } = groundingPrompt({ conceptTitle: "مقارنة الكسور", context: CONTEXT });
    const res = await provider.complete({
      operation: "question_gen",
      json: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const parsed = parseGeneratedQuestion(res.content);
    expect(parsed).not.toBeNull();
    expect(parsed!.content).toContain("مقارنة الكسور");
    expect(parsed!.options.length).toBe(4);
    expect(CONTEXT).toContain(parsed!.options[parsed!.correctIndex]!);
  });
});

describe("parseGeneratedQuestion (validation boundary) — PHASE 28", () => {
  const valid = JSON.stringify({
    content: "أي العبارات التالية وردت في الدرس؟",
    options: ["أ", "ب", "ج", "د"],
    correctIndex: 2,
    explanation: "لأنها وردت حرفيًا.",
  });

  it("accepts a valid payload", () => {
    const parsed = parseGeneratedQuestion(valid);
    expect(parsed?.options).toEqual(["أ", "ب", "ج", "د"]);
    expect(parsed?.correctIndex).toBe(2);
    expect(parsed?.explanation).toBe("لأنها وردت حرفيًا.");
  });

  it("accepts fenced JSON blocks", () => {
    const parsed = parseGeneratedQuestion("```json\n" + valid + "\n```");
    expect(parsed?.options.length).toBe(4);
  });

  it("rejects malformed JSON and truncated replies", () => {
    expect(parseGeneratedQuestion("{ not json")).toBeNull();
    expect(parseGeneratedQuestion("")).toBeNull();
    expect(parseGeneratedQuestion("هذه ليست JSON على الإطلاق")).toBeNull();
  });

  it("rejects a too-short stem", () => {
    const bad = JSON.stringify({ ...JSON.parse(valid), content: "أ" });
    expect(parseGeneratedQuestion(bad)).toBeNull();
  });

  it("rejects too few options", () => {
    const bad = JSON.stringify({ ...JSON.parse(valid), options: ["أ"] });
    expect(parseGeneratedQuestion(bad)).toBeNull();
  });

  it("rejects non-integer / out-of-range correctIndex", () => {
    const badType = JSON.stringify({ ...JSON.parse(valid), correctIndex: "2" });
    expect(parseGeneratedQuestion(badType)).toBeNull();
    const badRange = JSON.stringify({ ...JSON.parse(valid), correctIndex: 4 });
    expect(parseGeneratedQuestion(badRange)).toBeNull();
  });

  it("tolerates a missing explanation", () => {
    const withoutExplanation = JSON.parse(valid) as Record<string, unknown>;
    delete withoutExplanation.explanation;
    const parsed = parseGeneratedQuestion(JSON.stringify(withoutExplanation));
    expect(parsed?.explanation).toBeNull();
  });
});

describe("groundingPrompt — PHASE 28", () => {
  it("embeds the lesson context inside <context> and names the concept", () => {
    const { system, user } = groundingPrompt({ conceptTitle: "مقارنة الكسور", context: CONTEXT });
    expect(system).toContain(`<context>${CONTEXT}</context>`);
    expect(user).toContain("المفهوم: «مقارنة الكسور»");
  });
});