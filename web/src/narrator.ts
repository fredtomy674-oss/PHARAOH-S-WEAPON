import { stripMarkdown } from "./format.js";
import { isSentenceEnd, splitSentences } from "./voice.js";

/**
 * PHASE 56 — hearing the tutor while the tutor is still talking.
 *
 * Measured before this existed: the room waited for the turn to be stored, then
 * asked the server for audio, then played it. Three serial waits after the words
 * were already written — the student stared at a finished bubble and heard
 * nothing. Now the reply is spoken sentence by sentence as the sentences
 * arrive, and the rest follows when the turn lands.
 *
 * Two honest limits, both deliberate:
 *
 *  • This uses the machine's own voice, because it is the only one that can
 *    start before the turn is stored: the server's measured voice needs 6.9–7.7s
 *    for a whole reply (48 characters alone cost 3.0s), so it can never be the
 *    instant one. The 🔊 button still uses the server, where waiting buys the
 *    better voice. A machine with no voice for the reply's language reports
 *    `unheard()`, and the room then narrates the reply from the server — one
 *    voice, whole answer, slightly later. Never two voices.
 *  • If the room retracts what it showed (a prompt echo, PHASE 46/53), the
 *    narrator forgets those words and keeps serving the turn: words that were
 *    taken back must not stay in the air, and must not cost the student the
 *    corrected answer either.
 *
 * PHASE 169 — the first words no longer wait for the first full sentence (see
 * `fastSpokenChunk`): a natural Arabic sentence can run past 40 characters, so
 * "wait for the period" was a second or more of silence before the voice
 * started. Only the FIRST chunk is cut early; everything after it keeps the
 * whole-sentence rule, and the words are the same words, in the same order.
 */

/** What one utterance attempt told us. */
export interface SpeakAttempt {
  /** True when the machine started speaking this text. */
  started: boolean;
  /** The browser listed voices and none of them speaks the reply language. */
  missingVoice: boolean;
}

/** What the student did not hear, once the turn is over. */
export interface Unheard {
  /** The part of the reply no voice ever read. */
  tail: string;
  /** True when nothing at all was heard, so the whole reply is still owed. */
  heardNothing: boolean;
}

/**
 * PHASE 169 — a first chunk shorter than this is a stutter, not speech: no
 * pause before `FIRST_CHUNK_MIN` is worth cutting for.
 */
export const FIRST_CHUNK_MIN = 8;

/**
 * PHASE 169 — even a reply with no pause at all must start by this point: the
 * first chunk is cut at the last space inside this window.
 */
export const FIRST_CHUNK_MAX = 48;

/**
 * PHASE 172 — sentences that are already WAITING when the voice goes idle are
 * joined into one hand-over, up to this length. Every hand-over costs the
 * engine a breath; on the owner's phone those breaths were heard as «يتوقف
 * ثم يستمر» between sentences. Joining cannot delay the start — only text the
 * voice was going to read anyway is joined, and only while it is already
 * queued — so the first sound is as fast as before and the speech flows.
 */
export const NARRATOR_MERGE_MAX = 220;

/**
 * The reply's very first words, released before the first sentence is
 * complete. One ascending scan, and the FIRST thing that qualifies wins:
 * a real sentence end (speak it whole); a comma/؛/: pause at or past
 * `FIRST_CHUNK_MIN`; and if nothing paused inside `FIRST_CHUNK_MAX`, the
 * last space at the window's edge — never inside a word. Returns null while
 * the text is still too short to cut safely; the next `feed` brings more.
 */
export function fastSpokenChunk(text: string): string | null {
  if (!text) return null;
  for (let i = 0; i < text.length; i++) {
    if (isSentenceEnd(text, i)) return text.slice(0, i + 1);
    if (i >= FIRST_CHUNK_MIN && "،؛:".includes(text[i]!)) return text.slice(0, i + 1);
    // Nothing paused in the whole window: the voice starts on the words that
    // exist instead of waiting for a pause that may still be far away.
    if (i >= FIRST_CHUNK_MAX) {
      const space = text.lastIndexOf(" ", i);
      return space >= FIRST_CHUNK_MIN ? text.slice(0, space) : null;
    }
  }
  return null;
}

export interface Narrator {
  /** Feed the reply as it streams: whole sentences are spoken as they complete. */
  feed(text: string): void;
  /**
   * The turn is over. `fullText` is the authoritative stored reply, so whatever
   * is left of it is spoken now (empty when the stream already covered it).
   */
  finish(fullText: string): void;
  /** The room took back the words it was showing; forget them and carry on. */
  retract(): void;
  /** Stop everything immediately (a new turn started, or the student muted). */
  stop(): void;
  /** True when this narrator cannot speak any more. */
  readonly broken: boolean;
  /** What was not heard, or null while the voice is still working. */
  unheard(): Unheard | null;
}

export interface NarratorDeps {
  /** Speak one chunk; call `onDone` when it ends. */
  speak: (text: string, onDone: () => void) => SpeakAttempt;
  /** Presence: is the room speaking right now? */
  onSpeaking: (speaking: boolean) => void;
  /**
   * PHASE 169 — the words of a chunk, told to the room the instant it is
   * handed to the voice. The live conversation keeps them as the matching
   * window that tells the tutor's own voice from the student's (`echoGuard`).
   */
  onChunk?: (text: string) => void;
}

export function createNarrator(deps: NarratorDeps): Narrator {
  /** A sentence waiting to be read, with its end in the *stored* reply. */
  interface Queued {
    /** Spoken words — markdown removed, because a voice must not read `**`. */
    text: string;
    /** Offset in the stored reply up to and including this sentence. */
    end: number;
  }
  let queue: Queued[] = [];
  /** Characters of the reply handed to the queue so far. */
  let consumed = 0;
  /** Offset in the stored reply up to which a voice actually read it. */
  let heard = 0;
  /** The stored reply, once `finish` knows it. */
  let stored = "";
  let busy = false;
  let broken = false;
  let stopped = false;
  /**
   * PHASE 169 — true once anything has been queued for the voice. The fast
   * first chunk exists only for the FIRST words of a turn: after they are on
   * their way, the whole-sentence rule is what the reply deserves. Reset by
   * `retract` — words taken back make the corrected reply start over.
   */
  let started = false;

  const pump = (): void => {
    if (stopped) return;
    if (busy || broken) return;
    // PHASE 172 — join what is already waiting (see NARRATOR_MERGE_MAX): fewer
    // hand-overs, fewer engine breaths between sentences, identical words in
    // identical order, and nothing joined that is not already in the queue.
    while (queue.length >= 2) {
      const first = queue[0]!;
      const second = queue[1]!;
      if (first.text.length + second.text.length + 1 > NARRATOR_MERGE_MAX) break;
      queue.splice(0, 2, { text: `${first.text} ${second.text}`, end: second.end });
    }
    const next = queue.shift();
    if (next === undefined) {
      deps.onSpeaking(false);
      return;
    }
    busy = true;
    deps.onSpeaking(true);
    // PHASE 169 — the moment the voice gets these words, the room's matching
    // window (the live conversation's echo rules) must know them.
    deps.onChunk?.(next.text);
    const attempt = deps.speak(next.text, () => {
      busy = false;
      pump();
    });
    if (attempt.started && !attempt.missingVoice) {
      heard = Math.max(heard, next.end);
      return;
    }
    // Nothing was heard for this sentence, and the same voice will not read the
    // next one either. Say so once and let the room cover the rest itself.
    busy = false;
    broken = true;
    queue = [];
    deps.onSpeaking(false);
  };

  /** Speak every complete sentence of `text` that has not been spoken yet. */
  const take = (text: string): void => {
    if (stopped || broken) return;
    let fresh = text.slice(consumed);
    // PHASE 169 — the very first words do not wait for the first full
    // sentence: a fast chunk (see `fastSpokenChunk`) starts the voice while
    // the rest of the sentence is still being written. The remainder of the
    // reply is served by the ordinary whole-sentence rule below.
    if (!started && fresh) {
      const first = fastSpokenChunk(fresh);
      if (first !== null) {
        const words = stripMarkdown(first).trim();
        if (words) queue.push({ text: words, end: consumed + first.length });
        started = true;
        consumed += first.length;
        fresh = text.slice(consumed);
      }
    }
    const { ready, rest } = splitSentences(fresh);
    if (ready.length === 0) {
      pump();
      return;
    }
    for (const sentence of ready) {
      const words = stripMarkdown(sentence.text).trim();
      if (words) {
        queue.push({ text: words, end: consumed + sentence.end });
        started = true;
      }
    }
    consumed = text.length - rest.length;
    pump();
  };

  return {
    feed: take,
    finish(fullText: string): void {
      if (stopped) return;
      stored = fullText;
      if (broken) return;
      const tail = fullText.slice(Math.min(consumed, fullText.length));
      consumed = fullText.length;
      const words = stripMarkdown(tail).trim();
      if (words) {
        queue.push({ text: words, end: fullText.length });
        started = true;
      }
      pump();
    },
    retract(): void {
      if (stopped) return;
      // Words on screen were taken back: they are gone, not "already spoken".
      consumed = 0;
      heard = 0;
      queue = [];
      started = false;
      pump();
    },
    stop(): void {
      stopped = true;
      queue = [];
      busy = false;
      deps.onSpeaking(false);
    },
    get broken(): boolean {
      return broken;
    },
    unheard(): Unheard | null {
      if (!broken) return null;
      // No stored reply yet (the voice died mid-stream): what is unsaid is
      // everything from the last word that was actually read.
      const text = stored;
      return {
        tail: stored ? text.slice(Math.min(heard, text.length)) : "",
        heardNothing: heard === 0,
      };
    },
  };
}