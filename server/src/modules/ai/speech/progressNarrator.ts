import { stripMarkdownForSpeech } from "./stripMarkdown.js";

/**
 * PHASE 57 — the server's voice, one sentence at a time.
 *
 * Measured before this existed: pressing 🔊 waited for the whole reply's audio
 * to be synthesized before a single note played — 6.9–7.7s for a 160-character
 * reply, even with the three parallel requests the provider already makes. The
 * student pressed a button and nothing happened for seven seconds, which is why
 * the audio felt "not immediate" even though the text reply was already on screen
 * at 1.5s.
 *
 * The fix is progressive narration: the server splits the reply into sentences,
 * synthesizes them in parallel (bounded concurrency), and emits each chunk the
 * moment it is ready. The client plays them in order, so the first note lands at
 * about the time it takes to synthesize one sentence (~3s measured) and the rest
 * follows while the student is already listening.
 *
 * This runs entirely on the server: the client needs no installed Arabic voice
 * (D-044) and the API key never leaves it.
 *
 * ## Why the split happens on the *raw* text
 *
 * The reply arrives as markdown and must be spoken without its markers, so it is
 * stripped on the way to the voice. Stripping is block-structured: a paragraph
 * becomes a list item once its `-` line arrives. Re-stripping the whole
 * accumulated reply on every delta (the obvious implementation) is therefore not
 * monotonic, and the offset it recorded before a rewrite no longer points where
 * it did — measurably losing the first sentence and repeating another.
 *
 * So the narrator splits the *raw* text it has received, at sentence boundaries,
 * and strips only the finished piece it is about to speak. Sentence boundaries
 * (`.!?؟…` and newlines) are never part of markdown syntax, and the reply's
 * stream is a prefix of the reply that gets stored, which makes every offset
 * here exact — no guessing, no re-alignment.
 */

// ------------------------------------------------------------- splitting ----

/** One speakable piece of a reply. */
export interface SpokenChunk {
  /** The words to speak (markdown already removed). */
  text: string;
  /** Offset in the raw text it was cut from, just past this piece. */
  end: number;
  /**
   * True when this piece ends at real sentence punctuation, so it can never grow
   * again. The trailing run of a still-streaming reply is normally *incomplete* —
   * speaking it would say half a sentence and then say it again.
   */
  complete: boolean;
}

/** Maximum characters per synthesized piece (raw, so the spoken form is no longer). */
const CHUNK_MAX_CHARS = 120;
/** A piece shorter than this is merged with the next (tiny requests waste quota). */
const CHUNK_MIN_CHARS = 40;
/**
 * Hard bound on pieces per split, so one reply cannot fan out into a dozen
 * requests. It is a per-split bound, not a per-reply one: the whole-text split
 * (the 🔊 route) never exceeds it, while a streamed reply is split again as each
 * sentence completes — measured 16 pieces for an 842-character answer. That is the
 * deliberate trade for a first sound in ~80ms, and the per-sentence cache makes
 * every later press of the same reply free.
 */
const CHUNK_MAX_COUNT = 8;

interface RawSentence {
  text: string;
  start: number;
  end: number;
  complete: boolean;
}

/** A piece of the reply as a range of the raw text it was cut from. */
interface RawRange {
  start: number;
  /** Offset just past this piece. */
  end: number;
  complete: boolean;
}

/** Cuts `text` into sentences, recording the raw offsets they occupy. */
function scanSentences(text: string): RawSentence[] {
  const sentences: RawSentence[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (!/[.!?؟…\n]/.test(ch)) continue;
    // A point between two digits is a decimal, not the end of a sentence.
    if (ch === "." && /\d/.test(text[i - 1] ?? "") && /\d/.test(text[i + 1] ?? "")) continue;
    // A point with no space after it belongs to the word (an abbreviation, or a
    // domain), not to the sentence.
    const next = text[i + 1];
    if (ch === "." && next !== undefined && !/\s/.test(next)) continue;
    const raw = text.slice(start, i + 1);
    if (raw.trim()) sentences.push({ text: raw.trim(), start, end: i + 1, complete: true });
    start = i + 1;
  }
  if (start < text.length) {
    const raw = text.slice(start);
    if (raw.trim()) sentences.push({ text: raw.trim(), start, end: text.length, complete: false });
  }
  return sentences;
}

/**
 * Splits reply text into sentence-sized pieces suitable for parallel synthesis.
 *
 * Pieces are whole sentences only, merged up to `CHUNK_MIN_CHARS` so a reply of
 * short sentences does not become a burst of tiny requests, and folded down to
 * `CHUNK_MAX_COUNT` so a long reply is never truncated. `end` is a raw offset, so
 * the caller can continue from exactly where this piece stopped.
 */
export function splitForProgressiveNarration(
  input: string,
  maxChars = CHUNK_MAX_CHARS,
  minChars = CHUNK_MIN_CHARS,
  maxCount = CHUNK_MAX_COUNT,
): SpokenChunk[] {
  if (!input.trim()) return [];
  const sentences = scanSentences(input);
  if (sentences.length === 0) return [];

  // Group whole sentences into pieces no longer than `maxChars`, keeping each
  // group as a *raw range* of the input rather than a re-joined string. That is
  // not a detail: a reply's list items and blank lines are markdown structure, so
  // gluing sentences back together with a space turns `- ثم نجمع.` into the tail
  // of a paragraph, and the marker is then spoken as a word. Cutting ranges and
  // slicing the original keeps the reply's own grammar intact and makes every
  // offset exact by construction.
  //
  // An unfinished sentence always ends its own group: merging it with the one
  // before it would make that finished sentence wait for text that has not been
  // written yet.
  const grouped: RawRange[] = [];
  let start = -1;
  let end = 0;
  let complete = false;
  for (const sentence of sentences) {
    const wouldBe = start < 0 ? 0 : end - start + 1 + (sentence.end - sentence.start);
    if (start < 0 || wouldBe > maxChars || complete !== sentence.complete) {
      if (start >= 0) grouped.push({ start, end, complete });
      start = sentence.start;
    }
    end = sentence.end;
    // A piece is only complete when its last sentence is: that is what decides
    // whether more text can still join it.
    complete = sentence.complete;
  }
  if (start >= 0) grouped.push({ start, end, complete });

  // Merge a piece that is too small to be worth a request of its own into the one
  // after it. Merging forward (rather than backward) keeps the first piece — the
  // one the student hears soonest — as large as the text allows. A piece is never
  // merged into an *unfinished* one: that would make the finished sentence wait
  // for text that has not been written yet, which is the whole delay this phase
  // exists to remove.
  const merged: RawRange[] = [];
  for (let i = 0; i < grouped.length; i++) {
    const piece = grouped[i]!;
    const next = grouped[i + 1];
    if (next?.complete && piece.end - piece.start < minChars && next.end - piece.start <= maxChars) {
      merged.push({ start: piece.start, end: next.end, complete: next.complete });
      i += 1;
      continue;
    }
    merged.push({ ...piece });
  }

  // Fold any excess into the last piece: the reply is always spoken whole.
  while (merged.length > maxCount) {
    const tail = merged.pop()!;
    const last = merged.length - 1;
    merged[last] = { ...merged[last]!, end: tail.end, complete: tail.complete };
  }

  return merged.map((piece) => ({
    text: stripMarkdownForSpeech(input.slice(piece.start, piece.end)).trim(),
    end: piece.end,
    complete: piece.complete,
  }));
}

// ------------------------------------------------------------- narration ----

/** One audio event on the wire. */
export interface ProgressAudioEvent {
  type: "audio";
  /** Position in the stream, from 0, strictly increasing. */
  seq: number;
  base64: string;
  mimeType: string;
}

/** The last audio event of a narration: `ok:false` means nothing was playable. */
export interface ProgressAudioEndEvent {
  type: "audio-end";
  ok: boolean;
}

export type ProgressStreamEvent = ProgressAudioEvent | ProgressAudioEndEvent;

export interface ProgressNarratorDeps {
  /** Synthesizes one piece; may reject when the provider has no voice. */
  speak: (text: string) => Promise<{ audio: Buffer; mimeType: string }>;
  /** Sends one event to the client. */
  emit: (event: ProgressStreamEvent) => void;
  /**
   * Reports a piece that failed to synthesize.
   *
   * The student is never told: the client already answers a voice failure by
   * reading the reply with the browser's own voice, which is the right answer for
   * him. But silence on the server made this undiagnosable — measured live, a
   * press that ended in `audio-end ok:false` left nothing in the logs at all, so
   * "quota exhausted" and "a bug in the splitter" looked identical from outside.
   * Optional so the unit tests need no logger; the routes wire the request log.
   */
  onPieceFailure?: (reason: unknown) => void;
}

/**
 * How many pieces are synthesized at once.
 *
 * The same bound the provider already applies to a whole reply: a burst of
 * parallel requests is what earns the per-model 429 PHASE 44 had to work around,
 * and a stalled queue would cost the student his voice.
 */
const CHUNK_CONCURRENCY = 3;

interface PendingChunk {
  base64: string;
  mimeType: string;
}

interface InFlight {
  promise: Promise<void>;
}

/** How much of `before` is still a verbatim prefix of `after`. */
function commonPrefixLength(before: string, after: string): number {
  const max = Math.min(before.length, after.length);
  let i = 0;
  while (i < max && before[i] === after[i]) i += 1;
  return i;
}

/**
 * The narrator for one turn: sentence-sized pieces of the reply, synthesized in
 * parallel and released *in order* the moment each is ready.
 *
 * Three rules keep it honest:
 *
 *  • Order is a promise. Pieces are synthesized concurrently but released by
 *    sequence number, so the student never hears sentence 3 before sentence 2.
 *  • A voice failure is never a turn failure. If the provider refuses (quota,
 *    offline, no voice) the narrator gives up quietly; the client keeps the text
 *    it already has and decides how to read it.
 *  • Retracted words are never spoken. If the room takes back what it showed (a
 *    prompt echo), the narrator forgets those words entirely, so the corrected
 *    answer is heard once and the discarded one is never spoken.
 */
export class ProgressNarrator {
  /** Every character the room has shown, in order. */
  private streamed = "";
  /** The part of it that has not been turned into pieces yet. */
  private carry = "";
  /** True once `finish` has run — no more text is coming. */
  private closed = false;
  /** Sequence number handed to the next piece that is queued. */
  private nextSeq = 0;
  /** Sequence number of the next piece waiting to be released. */
  private releaseSeq = 0;
  /** Synthesized pieces waiting for their turn, keyed by sequence number. */
  private readonly ready = new Map<number, PendingChunk>();
  /** Pieces queued but not yet launched (the concurrency bound holds them). */
  private readonly pending: Array<{ text: string; seq: number }> = [];
  /** Pieces currently being synthesized. */
  private readonly inFlight = new Set<InFlight>();
  /** True once a piece has failed: stop, and let the client fall back. */
  private broken = false;
  private disposed = false;
  /**
   * Bumped by `retract`. A synthesis that was already in flight cannot be
   * cancelled, so its result is dropped instead of released: the words the room
   * took back must never be spoken, and their sequence number is about to be
   * reused by the corrected answer.
   */
  private epoch = 0;

  constructor(private readonly deps: ProgressNarratorDeps) {}

  /**
   * Feed the next slice of the reply as the room shows it.
   *
   * Never awaits: the turn must not wait on audio. Whatever is a whole sentence
   * goes to the synthesizer at once, which is where the first-audio latency comes
   * from — the student hears the opening sentence while the rest is still being
   * written.
   */
  push(delta: string): void {
    if (this.disposed || this.broken) return;
    this.streamed += delta;
    this.carry += delta;
    this.drain();
  }

  /**
   * The room took back the words it was showing; forget them and carry on.
   *
   * The echo guard fires within a few hundred milliseconds, long before a real
   * synthesis has finished, so the piece in flight at this moment is dropped by
   * the epoch rather than spoken. (Audio already *released* cannot be recalled by
   * anyone — it is on the wire — which is why nothing is released until a piece
   * is really ready.)
   */
  retract(): void {
    if (this.disposed || this.broken) return;
    this.epoch += 1;
    this.streamed = "";
    this.carry = "";
    this.nextSeq = 0;
    this.releaseSeq = 0;
    this.ready.clear();
    this.pending.length = 0;
  }

  /**
   * The reply is complete: speak whatever is left, then release everything in
   * order. Awaited by the caller, so `done` reaches the client only after the
   * last piece is on the wire and its playback queue is complete.
   *
   * `fullText` is the *stored* reply: authoritative, and it is what the student
   * reads. The stream is a prefix of it, so the unspoken part is exactly what
   * follows the common prefix — which is why nothing is ever spoken twice, and
   * why a reply whose preview was retracted is still spoken whole.
   */
  async finish(fullText: string): Promise<void> {
    if (this.disposed) return;
    this.closed = true;
    if (!this.broken) {
      // What is still unspoken is the buffer we held back plus whatever the reply
      // gained after it. The common prefix is where the stored reply and the text
      // we received stop agreeing, so it is where "the rest" begins — and when
      // they disagree *before* the buffer (a rewritten tail), the remainder is
      // taken from the point of disagreement, so no word is ever spoken twice.
      const agreed = commonPrefixLength(this.streamed, fullText);
      const heldFrom = this.streamed.length - this.carry.length;
      this.carry = agreed >= heldFrom ? `${this.carry}${fullText.slice(agreed)}` : fullText.slice(agreed);
      this.drain();
    }
    await this.settled();
    if (!this.disposed) this.deps.emit({ type: "audio-end", ok: this.releaseSeq > 0 });
  }

  /** Stop everything (the turn ended, or the client went away). */
  dispose(): void {
    this.disposed = true;
    this.ready.clear();
    this.pending.length = 0;
    this.inFlight.clear();
  }

  /**
   * Speaks every whole sentence in the carry and keeps the rest for later.
   *
   * The carry advances by the raw offset the splitter reported. Every offset is
   * relative to the carry as it was handed to the splitter, so the carry is
   * trimmed once, after the loop — trimming inside it would make the second
   * piece's offset point past its own text and lose the rest of the reply.
   */
  private drain(): void {
    if (this.disposed || this.broken) return;
    if (!this.carry.trim()) {
      if (this.closed) this.carry = "";
      return;
    }
    let consumed = 0;
    for (const piece of splitForProgressiveNarration(this.carry)) {
      // While the reply is still being written, a piece with no closing
      // punctuation is a sentence in progress: hold it, so half a sentence is
      // never spoken and then repeated. Once the reply is closed there is no
      // "later" any more, so the trailing sentence is spoken as it stands.
      if (!piece.complete && !this.closed) break;
      if (piece.text) this.start(piece.text);
      consumed = piece.end;
    }
    if (consumed > 0) this.carry = this.carry.slice(consumed);
    if (this.closed) this.carry = "";
  }

  /**
   * Queues one piece, giving it the next sequence number.
   *
   * The concurrency bound is applied at launch time, so sequence numbers are
   * handed out in text order even while synthesis runs concurrently — which is
   * exactly what makes in-order release possible.
   */
  private start(text: string): void {
    if (this.disposed || this.broken) return;
    this.pending.push({ text, seq: this.nextSeq++ });
    this.startPending();
  }

  /** Launches queued pieces while a concurrency slot is free. */
  private startPending(): void {
    while (!this.disposed && !this.broken && this.inFlight.size < CHUNK_CONCURRENCY && this.pending.length > 0) {
      const next = this.pending.shift()!;
      const entry: InFlight = { promise: Promise.resolve() };
      const epoch = this.epoch;
      entry.promise = this.deps
        .speak(next.text)
        .then((result) => {
          if (this.disposed || this.broken || epoch !== this.epoch) return;
          this.ready.set(next.seq, { base64: result.audio.toString("base64"), mimeType: result.mimeType });
          this.release();
        })
        .catch((err) => {
          // A failure of a superseded piece belongs to words that no longer exist:
          // the answer that replaced them deserves its own voice.
          if (this.disposed || epoch !== this.epoch) return;
          // One piece failed (quota, transient outage): stop narrating this turn.
          // The client keeps the text it already has and falls back to its own
          // voice, so a voice outage never costs the student his answer.
          //
          // Said out loud on the way out: the student is answered, but the operator
          // is not left guessing why his press of 🔊 made no sound.
          this.deps.onPieceFailure?.(err);
          this.broken = true;
          this.ready.clear();
          this.pending.length = 0;
        })
        .finally(() => {
          this.inFlight.delete(entry);
          // A slot just freed: keep the pipe full.
          this.startPending();
        });
      this.inFlight.add(entry);
    }
  }

  /** Releases every piece whose turn has come, in sequence order. */
  private release(): void {
    while (!this.disposed && this.ready.has(this.releaseSeq)) {
      const chunk = this.ready.get(this.releaseSeq)!;
      this.ready.delete(this.releaseSeq);
      const seq = this.releaseSeq;
      this.releaseSeq += 1;
      this.deps.emit({ type: "audio", seq, base64: chunk.base64, mimeType: chunk.mimeType });
    }
  }

  /** Resolves once every in-flight piece has settled and been released. */
  private async settled(): Promise<void> {
    while (!this.disposed && !this.broken && this.inFlight.size > 0) {
      await Promise.allSettled([...this.inFlight].map((entry) => entry.promise));
    }
  }
}
