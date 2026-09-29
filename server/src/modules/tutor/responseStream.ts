/**
 * PHASE 49 — reading a tutor reply while the model is still writing it.
 *
 * The tutor's reply is JSON (`{"content": "…", "parts": […], "assessment": {…}}`),
 * so streaming the raw tokens would show the student a wall of punctuation. To
 * write a reply as it forms, we have to find the `content` string inside a JSON
 * document that does not exist yet.
 *
 * This is a resumable scanner, not a regex: a regex cannot be resumed, and the
 * boundary that matters here is arbitrary — the model can stop between the
 * backslash and the `n` of an escape, or in the middle of a key. Feeding the
 * same characters in any chunking must produce exactly the same text, which is
 * the property the tests pin.
 *
 * Scope: the FIRST top-level `"content"` key — the field the room shows, and the
 * one the reply schema puts first. If a model instead writes prose before the
 * JSON, the scanner finds nothing and the caller falls back to showing the
 * finished reply: lost liveliness, never wrong or duplicated text.
 */

import { looksLikePromptEcho } from "./echoGuard.js";

const SIMPLE_ESCAPES: Record<string, string> = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f" };

/** Result of consuming one character of a JSON string. */
interface ReadResult {
  /** Text this character decoded to (empty when it belongs to a partial escape). */
  text: string;
  /** True on the closing quote. */
  ended: boolean;
}

/**
 * One JSON string read across chunk boundaries.
 *
 * The first `push` must be the opening quote. An escape sequence cut in half by
 * a boundary is held in `pending` until the rest of it arrives, so a chunk
 * boundary is invisible to the decoded result.
 */
class StringReader {
  private started = false;
  private pending = "";
  private ended = false;
  private readonly out: string[] = [];

  /** Everything decoded so far. */
  get text(): string {
    return this.out.join("");
  }

  push(ch: string): ReadResult {
    if (this.ended) return { text: "", ended: false };
    if (!this.started) {
      this.started = true;
      return { text: "", ended: false };
    }
    if (this.pending.length > 0) {
      this.pending += ch;
      if (this.pending[1] === "u") {
        // \uXXXX — wait for all four hex digits, across as many chunks as it takes.
        if (this.pending.length < 6) return { text: "", ended: false };
        const hex = this.pending.slice(2);
        this.pending = "";
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) return { text: "", ended: false };
        // Lone halves of a surrogate pair stay adjacent in the output string,
        // which is exactly how UTF-16 spells the astral character.
        const code = String.fromCharCode(parseInt(hex, 16));
        this.out.push(code);
        return { text: code, ended: false };
      }
      if (this.pending.length < 2) return { text: "", ended: false };
      const decoded = SIMPLE_ESCAPES[this.pending[1]!] ?? this.pending[1]!;
      this.pending = "";
      this.out.push(decoded);
      return { text: decoded, ended: false };
    }
    if (ch === "\\") {
      this.pending = "\\";
      return { text: "", ended: false };
    }
    if (ch === '"') {
      this.ended = true;
      return { text: "", ended: true };
    }
    this.out.push(ch);
    return { text: ch, ended: false };
  }
}

type Mode = "seekObject" | "keyOrEnd" | "key" | "afterKey" | "beforeValue" | "value" | "skipValue" | "done";

const WHITESPACE = " \n\r\t";

/**
 * Everything that may legitimately precede the JSON object: whitespace, or the
 * code fence a model wraps JSON in when it does not trust the JSON mode.
 *
 * The inner groups are all optional so the pattern also accepts a *partial* fence
 * ("`", "``j"): the prefix is tested one character at a time, and a reply that
 * is cut right after the first backtick must not be mistaken for prose.
 *
 * This is deliberately the *whole* allowance. Scanning forward for the first `{`
 * anywhere in the output is more generous, and it is wrong: a prose answer that
 * merely mentions a `"content"` key would have its quoted words streamed to the
 * student as if they were the reply. The turn asks for JSON, so "not JSON" is a
 * real possibility — and the honest response to it is to show nothing until the
 * finished answer arrives, not to show the wrong words first.
 */
const JSON_PREFIX = /^\s*(?:`{0,3}(?:j(?:s(?:o(?:n)?)?)?)?\s*)?$/;

/** The longest legal prefix; a cap keeps the check from growing with the reply. */
const JSON_PREFIX_ALLOWANCE = 32;

export class TutorReplyStream {
  private raw = "";
  private pos = 0;
  private mode: Mode = "seekObject";
  private key = "";
  private keyReader: StringReader | null = null;
  private valueReader: StringReader | null = null;
  private emitted = 0;
  /** Start of the value currently being skipped, for the rescan. */
  private skipFrom = 0;
  /** What was read before the JSON object started (must match `JSON_PREFIX`). */
  private prefix = "";

  /** True once the `content` string has been fully read (or the document failed). */
  get done(): boolean {
    return this.mode === "done";
  }

  /** True when a `content` string was actually located. */
  get found(): boolean {
    return this.valueReader !== null;
  }

  /** The complete `content` value so far (decoded). */
  get value(): string {
    return this.valueReader ? this.valueReader.text : "";
  }

  /**
   * Feeds the next slice of the raw reply and returns the part of the reply
   * text that became readable because of it (possibly empty, possibly several
   * words). Every character of `content` is returned exactly once, in order.
   */
  push(chunk: string): string {
    if (this.mode === "done") return "";
    this.raw += chunk;
    // The cursor is not a progress signal: two legitimate transitions (opening a
    // key, opening the value) hand the opening quote to a reader and leave `pos`
    // where it is. `step` reports what happened instead — "wait" is the state a
    // mode sits in when it needs text that has not arrived, and it is what keeps
    // this loop from spinning.
    while (this.pos < this.raw.length) {
      const outcome = this.step();
      if (outcome === "stop" || outcome === "wait") break;
    }
    const full = this.value;
    if (full.length <= this.emitted) return "";
    const fresh = full.slice(this.emitted);
    this.emitted = full.length;
    return fresh;
  }

  /**
   * Consumes at most one character.
   *   "read" — progress; call again.
   *   "wait" — the mode needs text that has not arrived yet; call after the
   *            next `push` (and do not spin now).
   *   "stop" — the reply's text is complete, or the document is unreadable.
   */
  private step(): "read" | "wait" | "stop" {
    const ch = this.raw[this.pos]!;
    switch (this.mode) {
      case "seekObject": {
        if (ch === "{") {
          this.pos += 1;
          this.mode = "keyOrEnd";
          return "read";
        }
        // Only a code fence may come before the object; anything else means this
        // is prose, and prose has no `content` field we may trust.
        if (this.prefix.length < JSON_PREFIX_ALLOWANCE && JSON_PREFIX.test(this.prefix + ch)) {
          this.prefix += ch;
          this.pos += 1;
          return "read";
        }
        this.mode = "done";
        return "stop";
      }
      case "keyOrEnd": {
        if (ch === '"') {
          this.keyReader = new StringReader();
          this.mode = "key";
          return "read"; // the reader consumes the opening quote itself
        }
        if (ch === "}" || WHITESPACE.includes(ch) || ch === ",") {
          this.pos += 1;
          return "read";
        }
        this.mode = "done"; // not an object we can read
        return "stop";
      }
      case "key": {
        const r = this.keyReader!.push(ch);
        this.pos += 1;
        if (r.ended) {
          this.key = this.keyReader!.text;
          this.mode = "afterKey";
        }
        return "read";
      }
      case "afterKey": {
        if (WHITESPACE.includes(ch)) {
          this.pos += 1;
          return "read";
        }
        if (ch !== ":") {
          this.mode = "done";
          return "stop";
        }
        this.pos += 1;
        if (this.key === "content") {
          this.mode = "beforeValue";
        } else {
          this.mode = "skipValue";
          this.skipFrom = this.pos;
        }
        return "read";
      }
      case "beforeValue": {
        if (WHITESPACE.includes(ch)) {
          this.pos += 1;
          return "read";
        }
        if (ch !== '"') {
          this.mode = "done"; // a non-string `content` has nothing to stream
          return "stop";
        }
        this.valueReader = new StringReader();
        this.mode = "value";
        return "read";
      }
      case "value": {
        const r = this.valueReader!.push(ch);
        this.pos += 1;
        if (r.ended) {
          this.mode = "done";
          return "stop";
        }
        return "read";
      }
      case "skipValue": {
        // Rescanned from the same start on every chunk, so a value cut in half
        // by a boundary is re-read correctly instead of half-consumed. In
        // practice this only skips a field *before* `content` — a few characters.
        const end = this.scanValue(this.skipFrom);
        if (end < 0) return "wait"; // incomplete: wait for more input
        this.pos = end;
        this.mode = "keyOrEnd";
        return "read";
      }
      default:
        return "stop";
    }
  }

  /**
   * Finds the index of the delimiter that ends the JSON value starting at
   * `from`, or -1 when the text so far does not contain it yet.
   */
  private scanValue(from: number): number {
    let depth = 0;
    let inString = false;
    for (let i = from; i < this.raw.length; i += 1) {
      const c = this.raw[i]!;
      if (inString) {
        if (c === "\\") i += 1;
        else if (c === '"') inString = false;
        continue;
      }
      if (c === '"') inString = true;
      else if (c === "{" || c === "[") depth += 1;
      else if (c === "}" || c === "]") {
        if (depth === 0) return i;
        depth -= 1;
      } else if (depth === 0 && c === ",") return i;
    }
    return -1;
  }
}

/**
 * PHASE 49 — turns the raw model stream into text that is safe to put on
 * screen *while the reply is still being written*.
 *
 * Two things make that harder than appending tokens, and both are about trust,
 * not about plumbing:
 *
 *  1. The reply is JSON, so the readable text is found by `TutorReplyStream`.
 *  2. The reply is unproven. PHASE 46 exists because a weak model sometimes
 *     answers by mirroring our own system prompt — and a mirror is, character for
 *     character, the internal rules and lesson context the student must never
 *     read. Buffering until the end would kill streaming, so instead the tail of
 *     the reply is held back and the echo is checked as it goes: a mirror is
 *     recognised within the first few words (it opens by restating the persona)
 *     and dropped, while a genuine reply streams freely.
 *
 * The `done` event of the turn always carries the authoritative, persisted text,
 * so even a wrong guess here cannot change what the student ends up reading —
 * this only decides what they see while waiting.
 */

/** How much of the end of a reply is withheld until the reply is proven safe. */
const TAIL_GUARD = 240;

export interface ReplyRelayHooks {
  /** Newly readable text, safe to show. */
  onDelta: (text: string) => void | Promise<void>;
  /** What was shown was an internal echo after all: take it back off the screen. */
  onDiscard?: () => void;
}

export class ReplyRelay {
  private readonly reader = new TutorReplyStream();
  private hold = "";
  private tainted = false;
  private discarded = false;
  private finished = false;

  constructor(private readonly hooks: ReplyRelayHooks) {}

  /** Feed the next slice of raw provider output. */
  async push(raw: string): Promise<void> {
    if (this.tainted) return;
    const fresh = this.reader.push(raw);
    if (!fresh) return;
    this.hold += fresh;
    if (looksLikePromptEcho(this.hold)) {
      this.tainted = true;
      await this.drop();
      return;
    }
    await this.flushTail();
  }

  /** The reply is complete: release the withheld tail, unless it was tainted. */
  async finish(): Promise<void> {
    if (this.finished) return;
    this.finished = true;
    if (this.tainted) return;
    if (looksLikePromptEcho(this.reader.value)) {
      this.tainted = true;
      await this.drop();
      return;
    }
    const tail = this.hold;
    this.hold = "";
    if (tail) await this.hooks.onDelta(tail);
  }

  /** Everything except the guard window goes out; the window waits for `finish`. */
  private async flushTail(): Promise<void> {
    if (this.hold.length <= TAIL_GUARD) return;
    const ready = this.hold.slice(0, this.hold.length - TAIL_GUARD);
    this.hold = this.hold.slice(this.hold.length - TAIL_GUARD);
    if (ready) await this.hooks.onDelta(ready);
  }

  private async drop(): Promise<void> {
    this.hold = "";
    if (this.discarded) return;
    this.discarded = true;
    await this.hooks.onDiscard?.();
  }
}
