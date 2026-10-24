import { describe, expect, it } from "vitest";
import { looksLikeJsonFragment, looksLikePromptEcho, regenerateEchoes } from "../../src/modules/tutor/echoGuard.js";

// Real transcripts of the failure observed live: gemma mirroring our own
// system prompt (in English) instead of tutoring, on a fresh session.
const liveEchoEnglish = `* User's Question: "كم تساوي 5 + 4؟" (How much is 5 + 4?)
* Persona: "( بتاعي )" (Friendly, patient tutor for primary school).
* Context: 6th Grade Math, Egypt, First Term, Addition and Subtraction of Natural Numbers.
* Constraints:
* Language: Simple Modern Standard Arabic (Fusha).`;

const liveEchoEnglishVariant = `* User Question: "كم تساوي 5 + 4؟" (How much is 5 + 4?)
* Persona: "( بتاعي )" (Friendly, patient tutor for 6th grade primary).
* Constraints:
* Response length: Max 100 words, 1-3 parts. * Structure: Explain -> Ask. * Output ...`;

// Hypothetical Arabic mirror: the model restates our own prompt lines.
const arabicMirror = `الطالب يسأل: «كم تساوي 5 + 4؟» (نية السؤال: طلب شرح)
قواعد سلوكية ثابتة:
1. لا تعطِ الحل مباشرة قبل محاولتين.`;

// PHASE 52 — the live capture: gemma answering a thin prompt with a bullet
// list of its own assignment (reproduced via scripts/.echo-probe.ts). The
// current guard catches this instance through `Constraint:`; the variants
// below are the ones that slipped through.
const liveBulletMirror = `*   Role: 6th-grade math teacher.
    *   Language: Arabic.
    *   Task: Define "divisibility" (قابلية القسمة) in two short sentences.
    *   Constraint: Output must be *only* a valid, parseable JSON in the format \`{"content": "text in Arabic"}\`. No extra text, no comments.

    *   Concept: Divisibility means a number can be divided by another number without leaving a remainder.
    *   Draft 1 (Arabic): قابلية القسمة تعني أن العدد يمكن تقسيمه على عدد آخر دون وجود باقٍ.
    *   Refining for 6th grade: قابلية القسمة هي قدرة عدد على القسمة على عدد آخر.`;

// The gap: the same dialect with no `Constraint:` line at all.
const gapVariantMyRole = `* My Role: 6th-grade math teacher.
* User Role: a 6th-grade student.
* Task: Define divisibility in two short sentences.`;

const gapVariantRoleTask = `* Role: 6th-grade math teacher.
* Task: Define divisibility in two short sentences.`;

describe("looksLikePromptEcho", () => {
  it("flags the prompt-mirror replies we observed live", () => {
    expect(looksLikePromptEcho(liveEchoEnglish)).toBe(true);
    expect(looksLikePromptEcho(liveEchoEnglishVariant)).toBe(true);
    expect(looksLikePromptEcho(arabicMirror)).toBe(true);
  });

  it("flags gemma's bullet-list dialect, live capture included", () => {
    expect(looksLikePromptEcho(liveBulletMirror)).toBe(true);
  });

  it("closes the gap: mirrors with no Constraint line are still caught", () => {
    expect(looksLikePromptEcho(gapVariantMyRole)).toBe(true);
    expect(looksLikePromptEcho(gapVariantRoleTask)).toBe(true);
  });

  it("never flags legitimate tutor replies, even ones greeting by name", () => {
    const legit = [
      "مرحبًا يا بطل! 👋 سنتعلم اليوم الجمع مع إعادة التجميع. هل يمكنك إخباري ما ناتج 14 + 18؟",
      "لا تقلق، سنراجعها معًا خطوة بخطوة. يبدو أنك نسيت الاستلاف. تخيل أن خانة الآحاد لا تتحمل أكثر من 9… هل يمكنك إخباري كم نكتب في الآحاد؟",
      "أنا المدرس الخصوصي ( بتاعك ) 💙 هيا نبدأ، كم يساوي 5 + 4؟",
      "إجابتك صحيحة، ممتاز يا بطل! [مصدر 1] الآن جرب هذه المسألة: كم ناتج 8 + 4؟",
      "اوه، يبدو أنك اخترت حرفًا! أنا كنت أنتظر رقمًا. تذكر أن 5 + 7 = 12، جرب: 8 + 4 كم تساوي؟",
    ];
    for (const t of legit) {
      expect(looksLikePromptEcho(t)).toBe(false);
    }
  });

  it("does not trip on a single bullet that a real exercise may use", () => {
    // One `* Task:` bullet can be a legitimate exercise line (notably in a
    // foreign-language lesson); mirrors stack them, so one alone is innocent.
    expect(looksLikePromptEcho("* Task: complete the sentence with the correct verb.")).toBe(false);
    expect(looksLikePromptEcho("* Role: the numerator tells how many parts we take.")).toBe(false);
    // …and ordinary prose about roles is untouched.
    expect(looksLikePromptEcho("The role of zero in addition is to change nothing.")).toBe(false);
    // A real reply's own bullets are Arabic, unstarred duties the tutor never assigns.
    expect(looksLikePromptEcho("تذكر دائمًا:\n* راجع جدول الضرب\n* اكتب خطواتك")).toBe(false);
  });
});

describe("looksLikeJsonFragment", () => {
  it("flags the truncated envelope we observed live", () => {
    expect(looksLikeJsonFragment('{\n  "content": "أهلاً بك يا بطل! 💙\\n\\nقابلية')).toBe(true);
  });

  it("flags a cut inside the key name itself", () => {
    // Observed live: the model stopped mid-key (`"content` with no closing
    // quote), which a complete-key matcher cannot see.
    expect(looksLikeJsonFragment('{\n  "content')).toBe(true);
    expect(looksLikeJsonFragment('{"con')).toBe(true);
  });

  it("leaves real replies alone — prose, valid JSON, and braces in math", () => {
    expect(looksLikeJsonFragment("أهلاً بك يا بطل! لنراجع قابلية القسمة.")).toBe(false);
    // Well-formed JSON parses, so it is never a fragment.
    expect(looksLikeJsonFragment('{"content": "أهلاً بك"}')).toBe(false);
    // Braces that are not an envelope (a set in math) are untouched.
    expect(looksLikeJsonFragment("مجموعة القواسم {1، 2، 3} مهمة.")).toBe(false);
    expect(looksLikeJsonFragment("{1، 2، 3}")).toBe(false);
    // An envelope start that parses is fine; one that never closes is not.
    expect(looksLikeJsonFragment('{"content": "ناقص')).toBe(true);
  });
});

describe("regenerateEchoes", () => {
  it("regenerates an echo once and returns the clean reply", async () => {
    let calls = 0;
    const produce = async (attempt: number) => {
      calls += 1;
      return { content: attempt === 0 ? liveEchoEnglish : "أحسنت يا بطل! الآن: كم ناتج 8 + 4؟" };
    };
    const { response, regens } = await regenerateEchoes(produce, 2);
    expect(regens).toBe(1);
    expect(response.content).toContain("أحسنت");
    expect(calls).toBe(2);
  });

  it("stops regenerating once the budget is spent", async () => {
    let calls = 0;
    const produce = async () => {
      calls += 1;
      return { content: liveEchoEnglish };
    };
    const { regens } = await regenerateEchoes(produce, 2);
    expect(regens).toBe(2);
    expect(calls).toBe(3); // initial + 2 bounded regens, never more
  });

  it("does not call the provider twice on a clean reply", async () => {
    let calls = 0;
    const produce = async () => {
      calls += 1;
      return { content: "إجابة صحيحة!" };
    };
    const { response, regens } = await regenerateEchoes(produce, 2);
    expect(regens).toBe(0);
    expect(response.content).toBe("إجابة صحيحة!");
    expect(calls).toBe(1);
  });

  it("passes the attempt index so the caller can vary the retry", async () => {
    const attempts: number[] = [];
    const produce = async (attempt: number) => {
      attempts.push(attempt);
      return { content: attempt === 0 ? liveEchoEnglish : liveEchoEnglish };
    };
    await regenerateEchoes(produce, 2);
    expect(attempts).toEqual([0, 1, 2]);
  });
});
