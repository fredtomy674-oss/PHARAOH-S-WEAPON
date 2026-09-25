import { describe, expect, it } from "vitest";
import { MockLLMProvider, buildMockRecap } from "../../src/modules/ai/providers/mock.js";
import {
  buildRecapFallback,
  buildRecapMetadataBlock,
  buildSessionRecap,
  parseRecap,
  RECAP_SYSTEM_RULES,
  recapContainsMessageContent,
  type SessionRecapMetadata,
} from "../../src/modules/sessions/recap.js";

const META: SessionRecapMetadata = {
  lessonTitle: "مقارنة الكسور",
  durationMinutes: 6,
  userMessages: 3,
  tutorMessages: 4,
  attachmentCount: 1,
  safetyFlagged: 0,
  concepts: [{ title: "تقريب الكسور", attempts: 2, correct: 1 }],
};

const AI_JSON = JSON.stringify({
  headline: "جلسة تعلّم حول «مقارنة الكسور» — ركّزنا فيها على الشرح خطوة بخطوة.",
  focus: "التفاعل النشط مع أمثلة الدرس حتى تثبيت الفهم.",
  strengths: ["تفاعل نشط", "أرفقت صورة وسألت"],
  suggestions: ["أعد قراءة الدرس", "جرّب تمارين إضافية"],
});

/**
 * PHASE 29 (D-027) — the safe session recap pipeline: metadata-only AI input,
 * a strict JSON boundary, a no-verbatim guard that rejects content leakage,
 * and a deterministic structured fallback so a safe view always exists.
 */
describe("buildRecapMetadataBlock — PHASE 29", () => {
  it("sends metadata ONLY (titles + counters), never message content", () => {
    const block = buildRecapMetadataBlock(META);
    expect(block).toContain("<metadata>");
    expect(block).toContain("Lesson: «مقارنة الكسور»");
    expect(block).toContain("UserMessages: 3");
    expect(block).toContain("TutorMessages: 4");
    expect(block).toContain("DurationMinutes: 6");
    expect(block).toContain("Attachments: 1");
    expect(block).toContain("SafetyFlagged: 0");
    expect(block).toContain("Concepts: «تقريب الكسور» (2/1)");
    expect(block).not.toContain("رسالة الطالب");
  });
});

describe("parseRecap (validation boundary) — PHASE 29", () => {
  it("accepts a valid payload", () => {
    const parsed = parseRecap(AI_JSON);
    expect(parsed?.headline).toContain("مقارنة الكسور");
    expect(parsed?.strengths).toEqual(["تفاعل نشط", "أرفقت صورة وسألت"]);
  });

  it("accepts fenced JSON blocks", () => {
    const parsed = parseRecap("```json\n" + AI_JSON + "\n```");
    expect(parsed?.suggestions.length).toBe(2);
  });

  it("rejects malformed JSON, empty and prose replies", () => {
    expect(parseRecap("")).toBeNull();
    expect(parseRecap("{ not json")).toBeNull();
    expect(parseRecap("هذه ليست JSON")).toBeNull();
  });

  it("rejects missing or too-short headline/focus", () => {
    const base = JSON.parse(AI_JSON) as Record<string, unknown>;
    expect(parseRecap(JSON.stringify({ ...base, headline: "" }))).toBeNull();
    expect(parseRecap(JSON.stringify({ ...base, focus: "" }))).toBeNull();
  });

  it("rejects non-string list items", () => {
    const base = JSON.parse(AI_JSON) as Record<string, unknown>;
    expect(parseRecap(JSON.stringify({ ...base, strengths: [1, 2] }))).toBeNull();
    expect(parseRecap(JSON.stringify({ ...base, strengths: "تفاعل" }))).toBeNull();
  });
});

describe("recapContainsMessageContent (no-verbatim guard) — PHASE 29", () => {
  const bodies = ["اشرح لي هذا الدرس خطوة بخطوة مع مثال من الحياة", "لم أفهم الجمع مع إعادة التجميع"];

  it("passes unrelated recap text", () => {
    const recap = "جلسة تعلّم حول «مقارنة الكسور» — تفاعلنا بأسئلة وشرح.";
    expect(recapContainsMessageContent(recap, bodies)).toBe(false);
  });

  it("trips when a message body is embedded verbatim", () => {
    expect(recapContainsMessageContent("رأيت السؤال: " + bodies[0] + ". وشرحته.", bodies)).toBe(true);
  });

  it("trips when a recap sentence was copied out of a message", () => {
    expect(recapContainsMessageContent(bodies[1]!, bodies)).toBe(true);
  });

  it("does not trip on the lesson title even when the student typed it", () => {
    const studentTypedTitle = ["مقارنة الكسور"];
    const recap = "جلسة تعلّم حول «مقارنة الكسور» — ركّزنا في الشرح.";
    expect(recapContainsMessageContent(recap, studentTypedTitle, [META.lessonTitle!])).toBe(false);
  });

  it("trips when a short body appears inside a longer recap", () => {
    expect(recapContainsMessageContent("ناقشنا: 487 + 358 = 845، ثم انتقلنا لتمرين.", ["487 + 358 = 845"])).toBe(true);
  });
});

describe("buildSessionRecap (merge + fallback) — PHASE 29", () => {
  it("merges a clean AI recap (fallback=false) and caps the lists", () => {
    const recap = buildSessionRecap(META, parseRecap(AI_JSON), ["اشرح لي هذا الدرس"]);
    expect(recap.fallback).toBe(false);
    expect(recap.headline).toContain("مقارنة الكسور");
    expect(recap.lessonTitle).toBe("مقارنة الكسور");
    expect(recap.userMessages).toBe(3);
    expect(recap.concepts).toEqual([{ title: "تقريب الكسور", attempts: 2, correct: 1 }]);
  });

  it("falls back when the AI reply is not parseable", () => {
    const recap = buildSessionRecap(META, null, []);
    expect(recap.fallback).toBe(true);
    expect(recap.headline).toContain("مقارنة الكسور");
  });

  it("falls back when the AI recap leaks a message body", () => {
    const leaky = JSON.stringify({
      headline: "لقد طلب مني: اشرح لي هذا الدرس خطوة بخطوة مع مثال من الحياة",
      focus: "المحور",
      strengths: [],
      suggestions: [],
    });
    const recap = buildSessionRecap(META, parseRecap(leaky), ["اشرح لي هذا الدرس خطوة بخطوة مع مثال من الحياة"]);
    expect(recap.fallback).toBe(true);
    expect(recap.headline).not.toContain("اطلب مني");
  });
});

describe("buildRecapFallback — PHASE 29", () => {
  it("is deterministic and includes the metadata counters", () => {
    const a = buildRecapFallback(META);
    const b = buildRecapFallback(META);
    expect(a).toEqual(b);
    expect(a.fallback).toBe(true);
    expect(a.headline).toContain("مقارنة الكسور");
    expect(a.focus).toContain("4 ردّ");
    expect(a.suggestions.length).toBeGreaterThan(0);
  });

  it("flags safety improvements when a tripwire fired", () => {
    const recap = buildRecapFallback({ ...META, safetyFlagged: 2 });
    expect(recap.suggestions.some((s) => s.includes("تجاوز"))).toBe(true);
  });
});

describe("mock complete for recap — PHASE 29", () => {
  it("emits a parseable JSON recap grounded in the metadata block", async () => {
    const provider = new MockLLMProvider();
    const block = buildRecapMetadataBlock(META);
    const res = await provider.complete({
      operation: "recap",
      json: true,
      messages: [
        { role: "system", content: RECAP_SYSTEM_RULES },
        { role: "user", content: `${block}\nأخرج ملخص الجلسة كـ JSON خالص.` },
      ],
    });
    const parsed = parseRecap(res.content);
    expect(parsed).not.toBeNull();
    expect(parsed!.headline).toContain("مقارنة الكسور");
    expect(parsed!.strengths.length).toBeGreaterThan(0);
    expect(parsed!.suggestions.length).toBeGreaterThan(0);
  });

  it("is deterministic for the same metadata", () => {
    const a = buildMockRecap(buildRecapMetadataBlock(META));
    const b = buildMockRecap(buildRecapMetadataBlock(META));
    expect(a).toEqual(b);
  });
});