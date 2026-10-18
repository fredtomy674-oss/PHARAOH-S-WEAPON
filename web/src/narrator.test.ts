import { describe, expect, it } from "vitest";
import { FIRST_CHUNK_MAX, FIRST_CHUNK_MIN, createNarrator, fastSpokenChunk, type SpeakAttempt } from "./narrator.js";

/**
 * PHASE 169 — the narrator's fast start: the owner measured the room «بطيئة في
 * الرد» and the first sound waited for a whole sentence (up to 140 characters)
 * on top of the silence window. Only the FIRST chunk may now end early — a
 * pause, or the last space inside `FIRST_CHUNK_MAX` — and everything after it
 * keeps the whole-sentence rule, in the same words, in the same order.
 */
describe("PHASE 169 — fastSpokenChunk", () => {
  it("cuts at a real sentence end, whole", () => {
    expect(fastSpokenChunk("الجمع بسيط! والطرح كذلك")).toBe("الجمع بسيط!");
    expect(fastSpokenChunk("ما رأيك؟ أكمل")).toBe("ما رأيك؟");
  });

  it("cuts at the first comma/؛/: past the minimum, so the voice starts on the first clause", () => {
    expect(fastSpokenChunk("الخطوة الأولى، نجمع العشرات")).toBe("الخطوة الأولى،");
  });

  it("waits — null — while the text is still too short to cut safely", () => {
    expect(fastSpokenChunk("الجمع بسيط")).toBeNull();
    // A comma this early would make a stutter, not speech.
    expect(fastSpokenChunk("آه، وهذا")).toBeNull();
    // `2.5` is a number, never an ending (the same guard as splitSentences).
    expect(fastSpokenChunk("الناتج يساوي 2.5 ثم نكمل")).toBeNull();
    // A point inside a file name is not an ending either.
    expect(fastSpokenChunk("انظر ملف report.txt ثم أكمل")).toBeNull();
  });

  it("the earliest cut wins — a pause after the window never delays the start", () => {
    // The shape of the real reply that exposed this: no short pause at all
    // (a comma past the window, a «؟» far away) — the voice must still start
    // inside the window, on whole words.
    const text = "أهلاً بك يا بطل اليوم نركز على درسنا الجميل في كتاب اكتشف، وهو يخص صفحة واحدة";
    const cut = fastSpokenChunk(text);
    expect(cut).not.toBeNull();
    expect(text.startsWith(cut!)).toBe(true);
    expect(cut!.length).toBeLessThanOrEqual(FIRST_CHUNK_MAX);
    expect(text[cut!.length]).toBe(" ");
  });

  it("a pause-less reply is cut at the last safe space, never inside a word", () => {
    const text = "هذا نص طويل جدا بدون فواصل ولا نقاط ابدا في هذه الجملة المستمرة";
    const cut = fastSpokenChunk(text);
    expect(cut).not.toBeNull();
    expect(text.startsWith(cut!)).toBe(true);
    expect(cut!.length).toBeGreaterThanOrEqual(FIRST_CHUNK_MIN);
    expect(cut!.length).toBeLessThanOrEqual(FIRST_CHUNK_MAX);
    // The cut lands on a space: no half-word ever reaches the voice.
    expect(text[cut!.length]).toBe(" ");
  });
});

describe("PHASE 169 — the narrator starts on the first clause", () => {
  interface Harness {
    narrator: ReturnType<typeof createNarrator>;
    spoken: string[];
    chunks: string[];
    speaking: boolean[];
    finishChunk: () => void;
  }

  function harness(): Harness {
    const spoken: string[] = [];
    const chunks: string[] = [];
    const speaking: boolean[] = [];
    const done: Array<() => void> = [];
    const narrator = createNarrator({
      onSpeaking: (s) => speaking.push(s),
      onChunk: (t) => chunks.push(t),
      speak: (text: string, onDone: () => void): SpeakAttempt => {
        spoken.push(text);
        done.push(onDone);
        return { started: true, missingVoice: false };
      },
    });
    return {
      narrator,
      spoken,
      chunks,
      speaking,
      finishChunk: () => {
        const next = done.shift();
        next?.();
      },
    };
  }

  it("speaks the first clause while the rest of the sentence is still being written", () => {
    const h = harness();
    h.narrator.feed("الخطوة الأولى، نجمع العشرات");
    // The voice already has words — the sentence is not finished yet.
    expect(h.spoken).toEqual(["الخطوة الأولى،"]);
    // …and the room's echo rules were told exactly what went into the air.
    expect(h.chunks).toEqual(["الخطوة الأولى،"]);

    // The sentence completes later: it goes out whole, the ordinary rule.
    h.narrator.feed("الخطوة الأولى، نجمع العشرات ثم الوحدات. ثانيا نسجل الناتج");
    h.finishChunk();
    expect(h.spoken).toEqual(["الخطوة الأولى،", "نجمع العشرات ثم الوحدات."]);
  });

  it("keeps the whole-sentence rule for every later chunk", () => {
    const h = harness();
    h.narrator.feed("أولا نقرأ. ثانيا، نجمع ثم");
    expect(h.spoken).toEqual(["أولا نقرأ."]);
    h.finishChunk();
    // «ثانيا،» alone would be a stutter after the fast start already happened:
    // the next sentence waits for its own end.
    expect(h.spoken).toEqual(["أولا نقرأ."]);
    h.narrator.feed("أولا نقرأ. ثانيا، نجمع ثم نسجل.");
    h.finishChunk();
    expect(h.spoken).toEqual(["أولا نقرأ.", "ثانيا، نجمع ثم نسجل."]);
  });

  it("retract re-arms the fast start for the corrected words", () => {
    const h = harness();
    h.narrator.feed("الجمع بسيط! اكمل");
    expect(h.spoken).toEqual(["الجمع بسيط!"]);
    h.finishChunk();
    h.narrator.retract();
    h.narrator.feed("التجميع سهل! اكمل");
    expect(h.spoken).toEqual(["الجمع بسيط!", "التجميع سهل!"]);
  });

  it("finish still speaks the tail — a short reply is never stranded", () => {
    const h = harness();
    h.narrator.feed("جملة قصيرة");
    expect(h.spoken).toEqual([]); // still no pause to cut on
    h.narrator.finish("جملة قصيرة.");
    expect(h.spoken).toEqual(["جملة قصيرة."]);
  });
});

describe("PHASE 172 — one breath between sentences, not one per sentence", () => {
  function harness(): {
    narrator: ReturnType<typeof createNarrator>;
    spoken: string[];
    chunks: string[];
    finishChunk: () => void;
  } {
    const spoken: string[] = [];
    const chunks: string[] = [];
    const done: Array<() => void> = [];
    const narrator = createNarrator({
      onSpeaking: () => undefined,
      onChunk: (t) => chunks.push(t),
      speak: (text: string, onDone: () => void): SpeakAttempt => {
        spoken.push(text);
        done.push(onDone);
        return { started: true, missingVoice: false };
      },
    });
    return {
      narrator,
      spoken,
      chunks,
      finishChunk: () => {
        done.shift()?.();
      },
    };
  }

  it("joins sentences that are already waiting — identical words, one hand-over", () => {
    const h = harness();
    h.narrator.feed("أولا نقرأ. ثانيا نجمع. ثالثا نطرح.");
    // The burst arrived at once: the voice starts on the same first words, and
    // everything already waiting rides the same hand-over — no engine breath
    // between the sentences is paid at all.
    expect(h.spoken).toEqual(["أولا نقرأ. ثانيا نجمع. ثالثا نطرح."]);
    // The echo rules heard exactly the same words, in the same order.
    expect(h.chunks).toEqual(["أولا نقرأ. ثانيا نجمع. ثالثا نطرح."]);
  });

  it("never joins what is still arriving — a sentence goes out when its turn comes", () => {
    const h = harness();
    h.narrator.feed("الجمع بسيط! والطرح");
    expect(h.spoken).toEqual(["الجمع بسيط!"]);
    h.narrator.feed("الجمع بسيط! والطرح سهل.");
    h.finishChunk();
    expect(h.spoken).toEqual(["الجمع بسيط!", "والطرح سهل."]);
  });

  it("keeps long sentences apart — the bound is a breath budget, not a blender", () => {
    const long = "ا".repeat(130);
    const h = harness();
    h.narrator.feed(`نبدأ. ${long}. ${long}.`);
    // The short opener and the first long sentence fit the budget together…
    expect(h.spoken).toEqual([`نبدأ. ${long}.`]);
    // …but the third sentence would blow past it and keeps its own hand-over.
    h.finishChunk();
    expect(h.spoken).toEqual([`نبدأ. ${long}.`, `${long}.`]);
  });
});
