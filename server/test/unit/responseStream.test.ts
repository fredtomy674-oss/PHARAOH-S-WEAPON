// PHASE 49 — reading a tutor reply out of a JSON document that does not exist
// yet.
//
// The invariant these tests exist for: for ANY way of splitting the same reply
// into chunks, the concatenated deltas equal the reply's `content` exactly.
// Streaming that works only for the chunking the model happened to produce is
// not streaming, it is luck.
import { describe, expect, it } from "vitest";
import { ReplyRelay, TutorReplyStream } from "../../src/modules/tutor/responseStream.js";

const REPLY = {
  content: "قابلية القسمة: العدد يقبل القسمة على 2 إذا كان رقم آحاده زوجيًا.\nمثال: 102 يقبل القسمة على 2",
  parts: [{ type: "text", text: "…" }],
  assessment: { conceptsTouched: ["قابلية القسمة"], confidence: 0.9 },
};
const REPLY_JSON = JSON.stringify(REPLY);

/**
 * Ways to cut a string into pieces of about `size` characters, each starting at
 * a different offset. The prefix is emitted as its own first piece so no
 * character is ever dropped — a cut that loses text is not a cut, it is a bug in
 * the test that would pass for the wrong reason.
 */
function chunkings(text: string, size: number): string[][] {
  const out: string[][] = [];
  for (let offset = 0; offset < size; offset += 1) {
    const parts: string[] = offset > 0 ? [text.slice(0, offset)] : [];
    for (let i = offset; i < text.length; i += size) parts.push(text.slice(i, i + size));
    if (parts.length > 0) out.push(parts);
  }
  return out;
}

function streamAll(chunks: string[]): string {
  const reader = new TutorReplyStream();
  return chunks.map((c) => reader.push(c)).join("");
}

describe("TutorReplyStream", () => {
  it("emits the reply text, and nothing else, whatever the chunking", () => {
    for (const size of [1, 2, 3, 5, 7, 13, 64, 1000]) {
      for (const chunks of chunkings(REPLY_JSON, size)) {
        expect(streamAll(chunks), `chunk size ${size}`).toBe(REPLY.content);
      }
    }
  });

  it("never emits a character twice", () => {
    const reader = new TutorReplyStream();
    // Chunk boundaries in the middle of the escaped \n are the classic failure.
    const pieces: string[] = [];
    for (let i = 0; i < REPLY_JSON.length; i += 1) pieces.push(reader.push(REPLY_JSON[i]!));
    expect(pieces.join("")).toBe(REPLY.content);
    expect(reader.push("追加 junk")).toBe(""); // after the value, silence
  });

  it("decodes JSON escapes the model writes instead of raw characters", () => {
    // Hand-written the way a model writes it: real newline escaped, quote escaped.
    const raw = '{"content": "سطر أول\\nسطر \\"ثاني\\"","parts":[]}';
    const text = streamAll([raw.slice(0, 18), raw.slice(18, 30), raw.slice(30)]);
    expect(text).toBe('سطر أول\nسطر "ثاني"');
  });

  it("decodes \\uXXXX escapes split across a chunk boundary", () => {
    const raw = '{"content": "\\u0645\\u062b\\u0627\\u0644"}';
    // One character per chunk: the worst possible place to cut an escape.
    expect(streamAll([...raw])).toBe("مثال");
  });

  it("skips fields that come before content", () => {
    const raw = '{"tone":"friendly","content":"الشرح","parts":[]}';
    expect(streamAll([raw])).toBe("الشرح");
  });

  it("skips a nested structure before content without being fooled by its brackets", () => {
    const raw = '{"meta":{"tags":["a]b","c"],"n":1},"content":"بعد التداخل","x":2}';
    expect(streamAll([raw])).toBe("بعد التداخل");
  });

  it("finds the reply when the model wraps it in a code fence", () => {
    const raw = `\`\`\`json\n${REPLY_JSON}\n\`\`\``;
    expect(streamAll([raw])).toBe(REPLY.content);
  });

  it("refuses to stream prose that merely mentions a content key", () => {
    // Observed live: a model that ignores JSON mode answers in prose, and the
    // prose can contain the very words "content" and a quoted string. Streaming
    // those would put text on the student's screen that the stored reply never
    // contained — so the reader shows nothing and the finished answer arrives
    // whole, exactly as it always did before streaming existed.
    const prose = 'الشخصية: معلم رياضيات. الحقل "content" يجب أن يحتوي على: "نص طويل" ثم كلام آخر.';
    const reader = new TutorReplyStream();
    expect(streamAll([prose])).toBe("");
    expect(reader.found).toBe(false);
  });

  it("finds nothing when there is no content field, and says so quietly", () => {
    const reader = new TutorReplyStream();
    expect(streamAll(["لا يوجد JSON هنا، فقط نص."])).toBe("");
    expect(reader.found).toBe(false);
  });

  it("ignores a nested content field (only the top-level one is the reply)", () => {
    const raw = '{"meta":{"content":"داخلي"},"content":"الظاهر"}';
    expect(streamAll([raw])).toBe("الظاهر");
  });

  it("treats a non-string content as nothing to stream", () => {
    expect(streamAll(['{"content": null}'])).toBe("");
  });

  it("reports done only after the value is closed", () => {
    const reader = new TutorReplyStream();
    reader.push('{"content": "نص');
    expect(reader.done).toBe(false);
    reader.push('"');
    expect(reader.done).toBe(true);
    expect(reader.value).toBe("نص");
  });
});

describe("ReplyRelay (what the student actually sees)", () => {
  /** Runs a reply through the relay and returns everything it displayed. */
  async function relay(chunks: string[], hooks: { onDiscard?: () => void } = {}): Promise<{ shown: string; discarded: number }> {
    let shown = "";
    let discarded = 0;
    const r = new ReplyRelay({
      onDelta: (t) => {
        shown += t;
      },
      onDiscard: () => {
        discarded += 1;
        shown = "";
      },
      ...hooks,
    });
    for (const c of chunks) await r.push(c);
    await r.finish();
    return { shown, discarded };
  }

  it("shows the whole reply, exactly once, in order", async () => {
    const { shown } = await relay(chunkings(REPLY_JSON, 9)[0]!);
    expect(shown).toBe(REPLY.content);
  });

  it("never streams a pictograph into the room (PHASE 187)", async () => {
    const raw = JSON.stringify({
      content: "أهلاً 👋 يا بطل.\n✅ صح!\n💡 **تلميح:**\nراجع الخطوة.",
    });
    const { shown } = await relay([raw]);
    expect(shown).toContain("أهلاً يا بطل.");
    expect(shown).toContain("صح!");
    expect(shown).toContain("تلميح:");
    expect(shown).not.toMatch(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it("holds back the tail so a short reply is not shown twice", async () => {
    // A short reply never crosses the guard window mid-stream: it must appear
    // exactly when the reply is finished, not twice.
    const { shown } = await relay(['{"content": "قصير جدًا"}']);
    expect(shown).toBe("قصير جدًا");
  });

  it("streams the body of a long reply while it is still being written", async () => {
    const long = "و".repeat(600);
    const raw = JSON.stringify({ content: long });
    let seen = 0;
    // Feed one character at a time and watch text appear BEFORE the last
    // character is fed — that is the whole point of streaming.
    const live = new ReplyRelay({
      onDelta: (t) => {
        seen += t.length;
      },
    });
    let shownAtHalf = 0;
    for (let i = 0; i < raw.length; i += 1) {
      await live.push(raw[i]!);
      // PHASE 56: the old fixed 240-char guard meant a ~300-char reply showed
      // NOTHING until the model had finished. Half-way through a 600-char reply
      // the student must already be reading a real share of it.
      if (shownAtHalf === 0 && i > raw.length / 2) shownAtHalf = seen;
    }
    expect(shownAtHalf, "nothing was shown until the reply had ended").toBeGreaterThan(0);
    expect(shownAtHalf, "less than a quarter was shown half-way through").toBeGreaterThan(long.length / 4);
    await live.finish();
    expect(seen).toBe(long.length);
  });

  it("shows a finished sentence at once, and holds only the unfinished one", async () => {
    // PHASE 56 — released line by line: a complete sentence goes out immediately
    // (the student hears and reads it), and only the trailing half-sentence waits
    // for the words that finish it.
    const first = "العدد 48 يقبل القسمة على 2 لأن رقم آحاده 8 زوجي.";
    const second = "وماذا عن 49؟";
    const raw = `{"content":"${first}\n${second}"}`;
    let shown = "";
    const live = new ReplyRelay({
      onDelta: (t) => {
        shown += t;
      },
    });
    const cut = raw.indexOf("\n") + 1;
    for (const ch of raw.slice(0, cut)) await live.push(ch);
    expect(shown, "a complete sentence was withheld").toBe(`${first}\n`);
    // Half-way through the second sentence, not one character of it is out.
    for (const ch of raw.slice(cut, raw.length - 2)) await live.push(ch);
    expect(shown, "an unfinished sentence leaked").toBe(`${first}\n`);
    await live.finish();
    expect(shown).toBe(`${first}\n${second}`);
  });

  it("takes back a prompt echo instead of showing our own rules to the student", async () => {
    // PHASE 46 in streaming form: a weak model restates the prompt. The relay
    // must withdraw it, because those words are internal.
    const echo = JSON.stringify({
      content: "Persona: سلاح الفرعون\nConstraints:\n- أجب بإيجاز",
      parts: [],
    });
    const { shown, discarded } = await relay(chunkings(echo, 11)[0]!);
    expect(shown).toBe("");
    expect(discarded).toBe(1);
  });

  it("takes back an Arabic echo too (our own rules are written in Arabic)", async () => {
    const echo = JSON.stringify({ content: "قواعد سلوكية ثابتة\n1. كن ودودًا\n" + "ح".repeat(400) });
    const { shown, discarded } = await relay([echo]);
    expect(shown).toBe("");
    expect(discarded).toBe(1);
  });

  it("discards once, not once per chunk", async () => {
    const echo = JSON.stringify({ content: "Persona: x" + "ق".repeat(500) });
    const { discarded } = await relay(chunkings(echo, 7)[0]!);
    expect(discarded).toBe(1);
  });
});
