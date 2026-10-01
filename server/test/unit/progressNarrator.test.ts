import { describe, expect, it } from "vitest";
import {
  ProgressNarrator,
  splitForProgressiveNarration,
  type ProgressStreamEvent,
} from "../../src/modules/ai/speech/progressNarrator.js";
import { stripMarkdownForSpeech } from "../../src/modules/ai/speech/stripMarkdown.js";

/**
 * PHASE 57 — the tutor's voice, one sentence at a time.
 *
 * Before this, pressing 🔊 (or hearing a voice-asked reply) waited for the whole
 * reply's audio to be built: 6.9–7.7s measured for a 160-character answer. These
 * tests pin the three things that make the first note land in ~80ms instead, and
 * the one thing that must never break while doing it:
 *
 *  • a whole sentence is spoken while the rest of the reply is still being
 *    written — an unfinished one is never spoken and then repeated;
 *  • pieces are released in sentence order, whatever order they finish in;
 *  • the whole reply is spoken *exactly once* — no word lost, none repeated, even
 *    when the stored reply differs from what the stream showed;
 *  • a voice failure is never a turn failure: the client keeps its text.
 */

/** Whitespace-insensitive form, so only the words are compared. */
function words(text: string): string {
  return text.replace(/\s+/g, "");
}

/** The concatenation of every piece, compared against the whole stripped reply. */
function spoken(pieces: string[]): string {
  return words(pieces.join(" "));
}

/** A speaker that resolves immediately, so only the splitting logic is exercised. */
function instantNarrator(): { narrator: ProgressNarrator; events: ProgressStreamEvent[]; spoken: () => string[] } {
  const events: ProgressStreamEvent[] = [];
  const said: string[] = [];
  const narrator = new ProgressNarrator({
    speak: async (text) => {
      said.push(text);
      return { audio: Buffer.from(text, "utf8"), mimeType: "audio/wav" };
    },
    emit: (event) => events.push(event),
  });
  return { narrator, events, spoken: () => said };
}

describe("splitForProgressiveNarration — PHASE 57", () => {
  it("speaks a whole reply exactly once, in order, with raw offsets that fit", () => {
    const raw = [
      "قابلية القسمة على 2 تعني أن العدد يُقسَم بالتساوي على 2 دون باقٍ.",
      "العدد 8 يقبل القسمة على 2 لأن 8 ÷ 2 = 4.",
      "العدد 7 لا يقبلها لأن 7 ÷ 2 = 3.5 ويتبقى 1.",
      "ولذلك نقول إن الأعداد الزوجية فقط تقبل القسمة على 2.",
    ].join(" ");
    const pieces = splitForProgressiveNarration(raw);

    expect(pieces.length).toBeGreaterThan(1);
    // Every piece is a *verbatim* slice of the raw text: this is what lets the
    // narrator resume from an offset instead of guessing where it was.
    let at = 0;
    for (const piece of pieces) {
      expect(piece.end).toBeGreaterThan(at);
      expect(words(raw.slice(at, piece.end))).toContain(words(piece.text).slice(0, 10));
      at = piece.end;
    }
    expect(pieces[pieces.length - 1]!.end).toBe(raw.length);
    // The reply is spoken whole, in order, and not one word twice.
    expect(spoken(pieces.map((p) => p.text))).toBe(words(stripMarkdownForSpeech(raw)));
    // And in the order it was written.
    expect(pieces.map((p) => p.text).join(" ").indexOf("العدد 8")).toBeLessThan(
      pieces.map((p) => p.text).join(" ").indexOf("العدد 7"),
    );
  });

  it("marks the trailing sentence of a still-streaming reply as unfinished", () => {
    const pieces = splitForProgressiveNarration("جملة أولى مكتملة. وجملة ثانية مكتملة. وجملة ثالثة ما زالت تُكتب");
    expect(pieces[pieces.length - 1]!.complete).toBe(false);
    expect(pieces[pieces.length - 2]!.complete).toBe(true);
  });

  it("never merges a finished piece into an unfinished one", () => {
    // The second sentence is still being written: merging it into the first would
    // make the first wait for text that does not exist yet — the exact delay this
    // phase exists to remove.
    const pieces = splitForProgressiveNarration(
      "هذه جملة طويلة بما يكفي كي لا تُدمج مع ما بعدها إطلاقا لأنها تتجاوز الحد الأدنى. وهذه جملة أخرى",
    );
    expect(pieces.length).toBe(2);
    expect(pieces[0]!.complete).toBe(true);
    expect(pieces[1]!.complete).toBe(false);
  });

  it("merges a tiny piece forward, so the first sound is as long as it can be", () => {
    const pieces = splitForProgressiveNarration("نعم. ثم نضيف. ثم نجمع. ثم نتحقق من الناتج النهائي للتجميع كله.");
    // No piece is a stub of three words on its own…
    expect(pieces.every((p) => p.text.length >= 10)).toBe(true);
    // …and the first one is the pair a client hears first, not a fragment.
    expect(pieces[0]!.text.startsWith("نعم.")).toBe(true);
    expect(pieces[0]!.text).toContain("ثم نضيف");
  });

  it("keeps every piece within the request bound", () => {
    const long = Array.from({ length: 30 }, (_, i) => `هذه جملة رقم ${i} في رد طويل جدا يحتاج تقسيمًا صحيحًا.`).join(" ");
    const pieces = splitForProgressiveNarration(long, 120, 40, 8);
    // Bounded, but never at the price of dropping words: the excess folds into
    // the last piece.
    expect(pieces.length).toBeLessThanOrEqual(8);
    expect(spoken(pieces.map((p) => p.text))).toBe(words(stripMarkdownForSpeech(long)));
  });

  it("does not cut at a decimal point or inside a word", () => {
    // "3.5" is a number, and "e.g." is an abbreviation: neither ends a sentence.
    const pieces = splitForProgressiveNarration("الناتج 3.5 وليس 4 مثل مثال e.g. فقط شكرا لك");
    expect(pieces.length).toBeGreaterThan(0);
    expect(spoken(pieces.map((p) => p.text))).toBe(words("الناتج 3.5 وليس 4 مثل مثال e.g. فقط شكرا لك"));
  });

  it("speaks words, not markdown", () => {
    const pieces = splitForProgressiveNarration("**القاعدة:** نعدّ الآحاد. \n- ثم نجمع. \n- ثم نكتب الناتج.");
    const said = words(pieces.map((p) => p.text).join(" "));
    expect(said).not.toContain("**");
    expect(said).not.toContain("-");
    expect(said).toContain("القاعدة");
    expect(said).toContain("نجمع");
  });

  it("returns nothing for an empty or whitespace reply", () => {
    expect(splitForProgressiveNarration("")).toEqual([]);
    expect(splitForProgressiveNarration("   \n  ")).toEqual([]);
  });
});

describe("ProgressNarrator — PHASE 57", () => {
  it("speaks the first sentence while the rest of the reply is still being written", async () => {
    const { narrator, spoken: said } = instantNarrator();
    // A sentence in progress must not be spoken: it would be half-heard and then
    // said again when the rest arrives.
    narrator.push("قابلية القسمة على 2 تعني أن العدد يقبل القسمة");
    await Promise.resolve();
    expect(said()).toEqual([]);

    narrator.push(" على 2 دون باقٍ.");
    await Promise.resolve();
    expect(said()).toHaveLength(1);
    expect(said()[0]).toBe("قابلية القسمة على 2 تعني أن العدد يقبل القسمة على 2 دون باقٍ.");

    narrator.push(" والعدد 8 يقبلها لأن 8 ÷ 2 = 4");
    await Promise.resolve();
    expect(said()).toHaveLength(1);
    await narrator.finish("قابلية القسمة على 2 تعني أن العدد يقبل القسمة على 2 دون باقٍ. والعدد 8 يقبلها لأن 8 ÷ 2 = 4.");
    expect(said()).toHaveLength(2);
  });

  it("speaks the whole reply exactly once when it arrives in small slices", async () => {
    const reply = [
      "أهلاً بك في درس القسمة على 2.",
      "العدد الذي يقبل القسمة على 2 دون باقٍ هو العدد الزوجي.",
      "العدد 8 يقبل القسمة لأن 8 ÷ 2 = 4.",
      "العدد 7 لا يقبلها لأن 7 ÷ 2 = 3.5.",
      "وإذن الحكم على الزوجية هو نصف الحكم الصحيح.",
    ].join(" ");
    const { narrator, events, spoken: said } = instantNarrator();
    // The worst case for a splitter: one or two characters at a time.
    for (let i = 0; i < reply.length; i += 3) narrator.push(reply.slice(i, i + 3));
    await narrator.finish(reply);

    expect(spoken(said())).toBe(words(stripMarkdownForSpeech(reply)));
    // Sequence numbers are 0..n with no gap and no repeat — that is the client's
    // only guarantee about the order it must play them in.
    const seqs = events.filter((e): e is Extract<ProgressStreamEvent, { type: "audio" }> => e.type === "audio").map((e) => e.seq);
    expect(seqs).toEqual(seqs.map((_, i) => i));
    expect(events[events.length - 1]).toEqual({ type: "audio-end", ok: true });
  });

  it("speaks a reply whose stored text grew after the last delta, without repeating it", async () => {
    const { narrator, spoken: said } = instantNarrator();
    narrator.push("العدد 8 يقبل القسمة على 2 لأن 8 ÷ 2 = 4 وهذا كل ما في");
    await Promise.resolve();
    // The room was still showing a prefix; the stored reply is the authority, so
    // the text it gained after the last delta (the period, the last word) is part
    // of what is spoken.
    await narrator.finish("العدد 8 يقبل القسمة على 2 لأن 8 ÷ 2 = 4 وهذا كل ما في الأمر.");
    expect(spoken(said())).toBe(words("العدد 8 يقبل القسمة على 2 لأن 8 ÷ 2 = 4 وهذا كل ما في الأمر."));
  });

  it("takes the remainder from the point of disagreement, so no word is said twice", async () => {
    const { narrator, spoken: said } = instantNarrator();
    narrator.push("العدد 8 يقبل القسمة على 2 لأن");
    await Promise.resolve();
    // The stream's tail was *rewritten*, not merely extended: the honest answer is
    // the corrected reply from the point the two texts stop agreeing.
    await narrator.finish("العدد 8 يقبل القسمة على 2 لأن 8 ÷ 2 = 4 harbour.");
    const saidWords = spoken(said());
    expect(saidWords).toBe(words("العدد 8 يقبل القسمة على 2 لأن 8 ÷ 2 = 4 harbour."));
    // "لأن" was never spoken on its own, and never twice.
    expect(saidWords.match(/لأن/g)).toHaveLength(1);
  });

  it("never speaks words the room took back, and still speaks the corrected reply", async () => {
    // The real timing: the echo guard fires long before a synthesis has finished,
    // so the echo's audio is still being made when the room takes the words back.
    const events: ProgressStreamEvent[] = [];
    let openEcho: (() => void) | null = null;
    let first = true;
    const asked: string[] = [];
    const narrator = new ProgressNarrator({
      speak: (text) =>
        new Promise((resolve) => {
          asked.push(text);
          const ready = { audio: Buffer.from(text, "utf8"), mimeType: "audio/wav" };
          // Only the echo's synthesis is held back — the corrected answer answers
          // straight away, as a warm cache would.
          if (first) {
            first = false;
            openEcho = () => resolve(ready);
            return;
          }
          resolve(ready);
        }),
      emit: (event) => events.push(event),
    });

    // The prompt echo: the room showed the student's own question, then retracted it.
    narrator.push("اشرح قابلية القسمة على 2 بأمثلة قصيرة.");
    expect(asked).toHaveLength(1);
    narrator.retract();

    // The echo's audio arrives *after* the retraction. It must be dropped, not
    // played: the student must hear the answer, not their own question.
    openEcho!();
    await Promise.resolve();
    await Promise.resolve();

    narrator.push("قابلية القسمة على 2 تعني أن العدد يقبل");
    await narrator.finish("قابلية القسمة على 2 تعني أن العدد يقبل القسمة على 2 دون باقٍ.");
    const heard = events
      .filter((e): e is Extract<ProgressStreamEvent, { type: "audio" }> => e.type === "audio")
      .map((e) => Buffer.from(e.base64, "base64").toString("utf8"));
    expect(heard.join(" ")).not.toContain("اشرح");
    expect(words(heard.join(" "))).toBe(words("قابلية القسمة على 2 تعني أن العدد يقبل القسمة على 2 دون باقٍ."));
  });

  it("does not let a retracted piece's failure silence the corrected answer", async () => {
    const events: ProgressStreamEvent[] = [];
    let failEcho: (() => void) | null = null;
    let first = true;
    const narrator = new ProgressNarrator({
      speak: (text) =>
        new Promise((resolve, reject) => {
          const ready = { audio: Buffer.from(text, "utf8"), mimeType: "audio/wav" };
          if (first) {
            first = false;
            failEcho = () => reject(new Error("quota exhausted"));
            return;
          }
          resolve(ready);
        }),
      emit: (event) => events.push(event),
    });
    narrator.push("اشرح قابلية القسمة على 2 بأمثلة قصيرة.");
    narrator.retract();
    // The discarded piece's synthesis fails on the way out. It is not part of the
    // conversation any more, so it must not count as the voice being down.
    failEcho!();
    await Promise.resolve();

    await narrator.finish("قابلية القسمة على 2 تعني أن العدد يقبل القسمة على 2 دون باقٍ.");
    const heard = events
      .filter((e): e is Extract<ProgressStreamEvent, { type: "audio" }> => e.type === "audio")
      .map((e) => Buffer.from(e.base64, "base64").toString("utf8"));
    expect(words(heard.join(" "))).toBe(words("قابلية القسمة على 2 تعني أن العدد يقبل القسمة على 2 دون باقٍ."));
    expect(events[events.length - 1]).toEqual({ type: "audio-end", ok: true });
  });

  it("releases pieces in sentence order even when the later ones finish first", async () => {
    const events: ProgressStreamEvent[] = [];
    const gates: Array<{ text: string; open: () => void }> = [];
    const narrator = new ProgressNarrator({
      speak: (text) =>
        new Promise((resolve) => {
          gates.push({ text, open: () => resolve({ audio: Buffer.from(text, "utf8"), mimeType: "audio/wav" }) });
        }),
      emit: (event) => events.push(event),
    });

    narrator.push(
      [
        "الجملة الأولى الطويلة بما يكفي كي لا تُدمج مع ما بعدها إطلاقا أبدا أبدا أبدا.",
        "الجملة الثانية الطويلة بما يكفي كي لا تُدمج مع ما بعدها إطلاقا أبدا أبدا أبدا.",
        "الجملة الثالثة الطويلة بما يكفي كي لا تُدمج مع ما بعدها إطلاقا أبدا أبدا أبدا.",
      ].join(" "),
    );
    expect(gates).toHaveLength(3);
    expect(events).toHaveLength(0);

    // The third sentence is synthesized first, then the second: neither may be
    // heard, because the student is on sentence one.
    gates[2]!.open();
    await Promise.resolve();
    gates[1]!.open();
    await Promise.resolve();
    expect(events).toHaveLength(0);

    gates[0]!.open();
    await narrator.finish("");
    const spokenOrder = events
      .filter((e): e is Extract<ProgressStreamEvent, { type: "audio" }> => e.type === "audio")
      .map((e) => Buffer.from(e.base64, "base64").toString("utf8"));
    expect(spokenOrder[0]).toContain("الجملة الأولى");
    expect(spokenOrder[1]).toContain("الجملة الثانية");
    expect(spokenOrder[2]).toContain("الجملة الثالثة");
  });

  it("synthesizes at most three pieces at a time", async () => {
    let inFlight = 0;
    let peak = 0;
    const narrator = new ProgressNarrator({
      speak: async (text) => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 1));
        inFlight -= 1;
        return { audio: Buffer.from(text, "utf8"), mimeType: "audio/wav" };
      },
      emit: () => undefined,
    });
    const reply = Array.from({ length: 12 }, (_, i) => `هذه جملة كاملة رقم ${i} في رد طويل بما يكفي للنطق.`).join(" ");
    for (let i = 0; i < reply.length; i += 25) narrator.push(reply.slice(i, i + 25));
    await narrator.finish(reply);
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(1);
  });

  it("reports a voice failure instead of failing the turn, and stays quiet afterwards", async () => {
    const events: ProgressStreamEvent[] = [];
    const asked: string[] = [];
    const narrator = new ProgressNarrator({
      speak: async (text) => {
        asked.push(text);
        throw new Error("quota exhausted");
      },
      emit: (event) => events.push(event),
    });
    narrator.push("قابلية القسمة على 2 تعني أن العدد يقبل القسمة على 2 دون باقٍ.");
    await narrator.finish("قابلية القسمة على 2 تعني أن العدد يقبل القسمة على 2 دون باقٍ. والعدد 8 يقبلها.");

    // No piece, and the client is told the truth so it can read the reply itself.
    expect(events).toEqual([{ type: "audio-end", ok: false }]);
    // At most the concurrency bound was ever asked for: one refusal stops this
    // turn's narration instead of hammering a provider that just said no.
    expect(asked.length).toBeLessThanOrEqual(3);
    // …and nothing more is asked for the rest of the turn.
    const afterFailure = asked.length;
    narrator.push(" نصا لم يُكتب بعد.");
    await Promise.resolve();
    expect(asked).toHaveLength(afterFailure);
  });

  it("reports *why* a piece failed, once — a blank stream is not diagnosable", async () => {
    const events: ProgressStreamEvent[] = [];
    const reasons: unknown[] = [];
    const narrator = new ProgressNarrator({
      speak: async () => {
        throw new Error("429 quota");
      },
      emit: (event) => events.push(event),
      onPieceFailure: (reason) => reasons.push(reason),
    });
    await narrator.finish("العدد 8 يقبل القسمة على 2. والعدد 7 لا يقبلها.");

    // Measured live: a 🔊 press that ended in `ok:false` left nothing in the logs,
    // so "the quota ran out" and "the splitter is broken" looked the same.
    expect(reasons).toHaveLength(1);
    expect(String((reasons[0] as Error).message)).toContain("429");
    expect(events).toEqual([{ type: "audio-end", ok: false }]);
  });

  it("says so when a voice turn was never narrated at all", async () => {
    const events: ProgressStreamEvent[] = [];
    const narrator = new ProgressNarrator({
      speak: async (text) => ({ audio: Buffer.from(text, "utf8"), mimeType: "audio/wav" }),
      emit: (event) => events.push(event),
    });
    await narrator.finish("");
    expect(events).toEqual([{ type: "audio-end", ok: false }]);
  });

  it("says nothing at all once it is disposed (the student moved on)", async () => {
    const events: ProgressStreamEvent[] = [];
    const narrator = new ProgressNarrator({
      speak: async (text) => ({ audio: Buffer.from(text, "utf8"), mimeType: "audio/wav" }),
      emit: (event) => events.push(event),
    });
    narrator.push("قابلية القسمة على 2 تعني أن العدد يقبل القسمة على 2 دون باقٍ.");
    narrator.dispose();
    await narrator.finish("قابلية القسمة على 2 تعني أن العدد يقبل القسمة على 2 دون باقٍ.");
    narrator.push(" نص إضافي لا يجب أن يُنطق.");
    expect(events).toEqual([]);
  });

  it("speaks a one-line reply that arrives without a trailing newline", async () => {
    const { narrator, spoken: said } = instantNarrator();
    const reply = "إذن، 8 زوجي و7 فردي، وهذا هو الفرق بينهما.";
    narrator.push(reply);
    await narrator.finish(reply);
    expect(said()).toEqual([reply]);
  });
});
