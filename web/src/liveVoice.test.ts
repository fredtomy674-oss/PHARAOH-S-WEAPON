import { describe, expect, it } from "vitest";
import { LIVE_MAX_UTTERANCE_CHARS, LIVE_MAX_UTTERANCE_MS, LIVE_SILENCE_MS, LiveUtteranceTracker } from "./voice.js";

/**
 * PHASE 168 — the segmentation behind «المحادثة الحيّة»: fragments in, whole
 * utterances out. The tracker is pure and clock-injected by design (see
 * `voice.ts`), so the rules a live conversation lives by are proved here
 * without a browser — including the two that only exist because a real engine
 * is messy: a final arriving after its own interim was released, and a student
 * who never pauses.
 */
describe("PHASE 168 — live utterance segmentation", () => {
  it("gathers fragments into one utterance and releases it on silence", () => {
    const tracker = new LiveUtteranceTracker();
    expect(tracker.noteInterim("اشرح", 0)).toBe(true); // a burst began
    expect(tracker.noteInterim("اشرح لي", 300)).toBe(false); // still the same one
    expect(tracker.noteFinal("اشرح لي", 500)).toBe(false);
    expect(tracker.live).toBe("اشرح لي");
    expect(tracker.noteFinal("الجمع", 900)).toBe(false);
    expect(tracker.live).toBe("اشرح لي الجمع");
    // Not yet: the student paused, but not long enough.
    expect(tracker.tick(900 + LIVE_SILENCE_MS - 1)).toBeNull();
    // The silence ends the utterance — exactly the words that were said.
    expect(tracker.tick(900 + LIVE_SILENCE_MS)).toBe("اشرح لي الجمع");
    // The next burst is a new utterance.
    expect(tracker.noteInterim("وبعدين", 9000)).toBe(true);
    expect(tracker.live).toBe("وبعدين");
  });

  it("replaces interim text instead of piling it up (the way engines report it)", () => {
    const tracker = new LiveUtteranceTracker();
    tracker.noteInterim("ل", 0);
    tracker.noteInterim("لح", 100);
    tracker.noteInterim("لحظة", 200);
    expect(tracker.live).toBe("لحظة");
    // The final replaces the interim tail it finalizes — not a second copy.
    tracker.noteFinal("لحظة من فضلك", 300);
    expect(tracker.live).toBe("لحظة من فضلك");
  });

  it("releases a speaker who never pauses at the bound, and defaults are the shipped ones", () => {
    const tracker = new LiveUtteranceTracker({ silenceMs: 1000, maxMs: 10_000 });
    tracker.noteFinal("قصة", 0);
    tracker.noteFinal("طويلة", 9_900);
    expect(tracker.tick(10_000)).toBe("قصة طويلة");
    // The exported constants are the ones the mode actually runs with.
    expect(LIVE_SILENCE_MS).toBe(900);
    expect(LIVE_MAX_UTTERANCE_MS).toBe(20_000);
    expect(LIVE_MAX_UTTERANCE_CHARS).toBe(700);
  });

  it("PHASE 172 — a runaway transcript is bounded by its text, not only by the clock", () => {
    // An engine that keeps reporting fragments (room noise, the speaker's own
    // echo) must not be able to grow one giant turn: the message route refuses
    // content past 4000 characters, and the api log shows exactly that refusal
    // reaching a real student. The character bound releases far earlier.
    const tracker = new LiveUtteranceTracker({ silenceMs: 1000, maxMs: 60_000, maxChars: 20 });
    tracker.noteFinal("أ ب ج د ه و ز", 0); // a burst began, 13 characters
    expect(tracker.tick(10)).toBeNull();
    tracker.noteFinal("ح ط ي ك", 20); // now 21 characters
    // Released by the text, long before the silence and the clock would allow.
    expect(tracker.tick(30)).toBe("أ ب ج د ه و ز ح ط ي ك");
    expect(tracker.tick(40)).toBeNull();
  });

  it("flush ends the utterance now — and nothing said is not an utterance", () => {
    const tracker = new LiveUtteranceTracker();
    expect(tracker.flush()).toBeNull();
    tracker.noteFinal("سؤال", 0);
    expect(tracker.flush()).toBe("سؤال");
    expect(tracker.flush()).toBeNull();
    // A burst with no words is dropped, never sent as an empty question.
    tracker.noteFinal("   ", 5_000);
    expect(tracker.tick(5_000 + LIVE_SILENCE_MS)).toBeNull();
    expect(tracker.flush()).toBeNull();
  });

  it("a final that merely re-reports the just-released words is an echo, not a new question", () => {
    const tracker = new LiveUtteranceTracker({ silenceMs: 1000, maxMs: LIVE_MAX_UTTERANCE_MS });
    tracker.noteInterim("اشرح لي الجمع", 0);
    expect(tracker.tick(1050)).toBe("اشرح لي الجمع"); // released on the silence
    // The engine's own late final arrives: the same question, not a second one.
    expect(tracker.noteFinal("اشرح لي الجمع", 1300)).toBe(false);
    expect(tracker.tick(5000)).toBeNull(); // nothing new was said
    // A genuinely new question still begins normally.
    expect(tracker.noteFinal("وضّح بالرسم", 6000)).toBe(true);
  });

  it("a new burst is announced exactly once — the barge-in signal", () => {
    const tracker = new LiveUtteranceTracker({ silenceMs: 1000, maxMs: LIVE_MAX_UTTERANCE_MS });
    expect(tracker.noteInterim("أ", 0)).toBe(true);
    expect(tracker.noteInterim("أستاذ", 100)).toBe(false);
    expect(tracker.noteFinal("أستاذ", 200)).toBe(false);
    tracker.tick(1200); // released by the silence
    expect(tracker.noteFinal("سؤال تاني", 5_000)).toBe(true);
  });
});
