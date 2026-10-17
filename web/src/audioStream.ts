// PHASE 57 — plays the tutor's voice as it arrives, sentence by sentence.
//
// The problem this exists to solve is measured, not imagined: pressing 🔊 used
// to wait for the *whole* reply's audio before a single note played (6.9–7.7s for
// a 160-character reply), so the button felt broken next to a text reply that was
// on screen in 1.5s. The server now synthesizes one sentence at a time and sends
// each piece as soon as it exists; this is the other half — play the first piece
// the moment it lands, and join the rest with no gap.
//
// Why Web Audio and not one <audio> element per sentence: separate elements
// cannot be scheduled against each other, so a sentence-sized gap opens between
// every one of them and the tutor sounds like a stutterer. Scheduling decoded
// buffers back-to-back on one timeline is what makes a streamed reply sound like
// one voice.
//
// If any of this is unavailable (no AudioContext, an undecodable piece, an
// autoplay policy that keeps the context suspended) the queue reports it once
// through `onError` and the room falls back to the buffered endpoint — a slower
// voice is still a voice, and silence is not an answer.

export interface AudioPiece {
  /** Position in the stream, from 0, strictly increasing. */
  seq: number;
  base64: string;
  mimeType: string;
}

export interface StreamedAudioHandlers {
  /** The first piece started playing. */
  onStart: () => void;
  /** The last piece finished. */
  onDone: () => void;
  /**
   * Playback broke *after* it started (a piece would not decode, or the browser
   * refused to run audio). The caller falls back to a slower path; nothing else
   * in this queue can recover.
   */
  onError: () => void;
}

export interface StreamedAudio {
  /**
   * False when this browser cannot play raw audio pieces at all — decided before
   * anything is fetched, so the caller can fall back without waiting.
   */
  readonly usable: boolean;
  /**
   * PHASE 162 — the live waveform tap for the teacher's mouth: the same audio
   * graph the room already plays through, exposed instead of duplicated. Null
   * when Web Audio keeps sources off an analyser (never the case when usable).
   */
  readonly analyser: AnalyserNode | null;
  /** Hands over one piece. Never blocks; pieces may arrive in any order. */
  push: (piece: AudioPiece) => void;
  /** No more pieces are coming. */
  end: () => void;
  /** Silences everything and forgets the queue. */
  stop: () => void;
}

/** Decodes base64 audio into bytes without pulling in a dependency. */
function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * A tiny margin so the very first piece is scheduled in the future rather than
 * "now" — a source started at the exact current time can be dropped by some
 * browsers, which would be a silent first sentence.
 */
const FIRST_PIECE_MARGIN_S = 0.06;

export function createStreamedAudio(handlers: StreamedAudioHandlers): StreamedAudio {
  type AudioContextCtor = new () => AudioContext;
  const Ctor: AudioContextCtor | undefined =
    typeof window === "undefined"
      ? undefined
      : ((window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor }).AudioContext ??
        (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext);
  if (!Ctor) {
    // No Web Audio at all: the caller is inside a click handler and can fall back
    // before it returns, so no reply is ever left waiting on a queue that was
    // never going to play.
    return { usable: false, analyser: null, push: () => {}, end: () => {}, stop: () => {} };
  }

  const ctx = new Ctor();
  // PHASE 162 — one analyser in the path, so the mouth can read the very
  // waveform the room is playing (the Lab proved this tap; the room reuses it).
  let analyser: AnalyserNode | null = null;
  try {
    const maybe = ctx as AudioContext & { createAnalyser?: () => AnalyserNode };
    if (typeof maybe.createAnalyser === "function") {
      analyser = maybe.createAnalyser();
      analyser.connect(ctx.destination);
    }
  } catch {
    analyser = null;
  }
  // Decoded pieces waiting for their turn, keyed by sequence number.
  const decoded = new Map<number, AudioBuffer>();
  const sources = new Set<AudioBufferSourceNode>();
  let nextSeq = 0;
  /** When the next piece must start for the speech to be continuous. */
  let nextAt = 0;
  let started = false;
  let stopped = false;
  let finished = false;
  let failed = false;
  /** Pieces still to decode, and the number still to play. */
  let decoding = 0;
  let playing = 0;

  let closed = false;
  /**
   * Releases the audio context. A stopped or broken player will never play again,
   * so keeping its context alive would cost a browser's limited number of them
   * for the rest of the lesson — and this one is silent by definition.
   */
  const closeContext = (): void => {
    if (closed) return;
    closed = true;
    try {
      const closable = ctx as AudioContext & { close?: () => Promise<void> };
      void closable.close?.();
    } catch {
      // Nothing to release.
    }
  };

  const giveUp = (): void => {
    if (failed || stopped) return;
    failed = true;
    for (const source of sources) {
      try {
        source.onended = null;
        source.stop();
      } catch {
        // Already ended: nothing to silence.
      }
    }
    sources.clear();
    decoded.clear();
    closeContext();
    handlers.onError();
  };

  /** Schedules every consecutive decoded piece; the first gap stops the drain. */
  const drain = (): void => {
    if (stopped || failed) return;
    for (;;) {
      const buffer = decoded.get(nextSeq);
      if (!buffer) return;
      decoded.delete(nextSeq);
      // `nextAt` is the end of the piece before it, so consecutive sentences join
      // with no silence between them; the margin keeps the very first piece from
      // being scheduled at the exact current time (a browser may drop that), and
      // the max() recovers if the queue ran dry long enough for the timeline to
      // fall behind the clock.
      const at = Math.max(nextAt, ctx.currentTime + FIRST_PIECE_MARGIN_S);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(analyser ?? ctx.destination);
      source.onended = () => {
        sources.delete(source);
        playing -= 1;
        if (finished && playing === 0 && decoding === 0) handlers.onDone();
      };
      sources.add(source);
      nextAt = at + buffer.duration;
      nextSeq += 1;
      playing += 1;
      if (!started) {
        started = true;
        handlers.onStart();
      }
      source.start(at);
    }
  };

  /**
   * Read through a call so the check after an `await` sees the *live* context: a
   * browser that refuses to resume leaves the queue silent forever otherwise.
   */
  const running = (): boolean => ctx.state === "running";

  const resume = async (): Promise<void> => {
    if (running()) return;
    try {
      await ctx.resume();
    } catch {
      // Autoplay refused: the caller falls back rather than leaving a dead queue.
    }
    if (!running()) giveUp();
  };

  return {
    usable: true,
    analyser,
    push: (piece) => {
      if (stopped || failed || finished) return;
      decoding += 1;
      void resume();
      ctx.decodeAudioData(decodeBase64(piece.base64).buffer as ArrayBuffer).then(
        (buffer) => {
          decoding -= 1;
          if (stopped || failed) return;
          decoded.set(piece.seq, buffer);
          drain();
          if (finished && playing === 0 && decoding === 0 && decoded.size === 0) handlers.onDone();
        },
        () => {
          decoding -= 1;
          giveUp();
        },
      );
    },
    end: () => {
      if (stopped || failed || finished) return;
      finished = true;
      // Everything is already scheduled unless a piece is still decoding.
      if (playing === 0 && decoding === 0 && decoded.size === 0) handlers.onDone();
    },
    stop: () => {
      if (stopped) return;
      stopped = true;
      for (const source of sources) {
        try {
          source.onended = null;
          source.stop();
        } catch {
          // Already ended.
        }
      }
      sources.clear();
      decoded.clear();
      closeContext();
    },
  };
}
