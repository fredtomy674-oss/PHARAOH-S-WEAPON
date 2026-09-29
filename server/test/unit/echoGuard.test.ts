import { describe, expect, it } from "vitest";
import { looksLikePromptEcho, regenerateEchoes } from "../../src/modules/tutor/echoGuard.js";

// Real transcripts of the failure observed live: gemma mirroring our own
// system prompt (in English) instead of tutoring, on a fresh session.
const liveEchoEnglish = `* User's Question: "كم تساوي 5 + 4؟" (How much is 5 + 4?)
* Persona: "سلاح الفرعون" (Friendly, patient tutor for primary school).
* Context: 6th Grade Math, Egypt, First Term, Addition and Subtraction of Natural Numbers.
* Constraints:
* Language: Simple Modern Standard Arabic (Fusha).`;

const liveEchoEnglishVariant = `* User Question: "كم تساوي 5 + 4؟" (How much is 5 + 4?)
* Persona: "سلاح الفرعون" (Friendly, patient tutor for 6th grade primary).
* Constraints:
* Response length: Max 100 words, 1-3 parts. * Structure: Explain -> Ask. * Output ...`;

// Hypothetical Arabic mirror: the model restates our own prompt lines.
const arabicMirror = `الطالب يسأل: «كم تساوي 5 + 4؟» (نية السؤال: طلب شرح)
قواعد سلوكية ثابتة:
1. لا تعطِ الحل مباشرة قبل محاولتين.`;

describe("looksLikePromptEcho", () => {
  it("flags the prompt-mirror replies we observed live", () => {
    expect(looksLikePromptEcho(liveEchoEnglish)).toBe(true);
    expect(looksLikePromptEcho(liveEchoEnglishVariant)).toBe(true);
    expect(looksLikePromptEcho(arabicMirror)).toBe(true);
  });

  it("never flags legitimate tutor replies, even ones greeting by name", () => {
    const legit = [
      "مرحبًا يا بطل! 👋 سنتعلم اليوم الجمع مع إعادة التجميع. هل يمكنك إخباري ما ناتج 14 + 18؟",
      "لا تقلق، سنراجعها معًا خطوة بخطوة. يبدو أنك نسيت الاستلاف. تخيل أن خانة الآحاد لا تتحمل أكثر من 9… هل يمكنك إخباري كم نكتب في الآحاد؟",
      "أنا سلاح الفرعون، مدرسك الخصوصي 💙 هيا نبدأ، كم يساوي 5 + 4؟",
      "إجابتك صحيحة، ممتاز يا بطل! [مصدر 1] الآن جرب هذه المسألة: كم ناتج 8 + 4؟",
      "اوه، يبدو أنك اخترت حرفًا! أنا كنت أنتظر رقمًا. تذكر أن 5 + 7 = 12، جرب: 8 + 4 كم تساوي؟",
    ];
    for (const t of legit) {
      expect(looksLikePromptEcho(t)).toBe(false);
    }
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
