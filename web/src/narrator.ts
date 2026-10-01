import { stripMarkdown } from "./format.js";
import { splitSentences } from "./voice.js";

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

  const pump = (): void => {
    if (stopped) return;
    if (busy || broken) return;
    const next = queue.shift();
    if (next === undefined) {
      deps.onSpeaking(false);
      return;
    }
    busy = true;
    deps.onSpeaking(true);
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
    const fresh = text.slice(consumed);
    const { ready, rest } = splitSentences(fresh);
    if (ready.length === 0) return;
    for (const sentence of ready) {
      const words = stripMarkdown(sentence.text).trim();
      if (words) queue.push({ text: words, end: consumed + sentence.end });
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
      if (words) queue.push({ text: words, end: fullText.length });
      pump();
    },
    retract(): void {
      if (stopped) return;
      // Words on screen were taken back: they are gone, not "already spoken".
      consumed = 0;
      heard = 0;
      queue = [];
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