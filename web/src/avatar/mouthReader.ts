// PHASE 162 (W7) — the mouth reader: one live object the lesson room owns.
//
// The Avatar Lab drove its mouth from a React hook with its own rAF loop. The
// room cannot afford a second always-on frame loop, so the smoothing lives
// where the mouth is actually consumed: the renderer calls `getMouthOpen()`
// once per frame (VrmAvatar does), and this reader turns whatever REAL signal
// exists at that instant into an openness value:
//
//   • a server-WAV AnalyserNode (the streamed narration's own graph) → the
//     audio envelope, exactly as the Lab proved;
//   • a boundary pulse (browser speechSynthesis fires word boundaries) → the
//     approximate mode, labelled as such in the Lab and used only when the
//     machine's own voice is what the student hears;
//   • nothing → the mouth decays to closed. Silence is never performed.
//
// It is intentionally framework-free and duck-typed (any object with
// `fftSize` + `getByteTimeDomainData` works), so the full mapping is unit
// tested in Node with a fake analyser.

import { amplitudeToMouth, rms, smoothLevel } from "./visemeMapper.js";

/** The slice of AnalyserNode this reader uses — fake-friendly for tests. */
export interface MouthAnalyser {
  fftSize: number;
  getByteTimeDomainData(array: Uint8Array): void;
}

export interface MouthReader {
  /** Point at the playing audio's analyser, or null to stop sampling it. */
  setAnalyser(analyser: MouthAnalyser | null): void;
  /** One word boundary of a browser-voiced utterance. */
  pulse(): void;
  /** Current mouth openness 0..1 — called once per rendered frame. */
  getMouthOpen(): number;
}

/** How fast a boundary pulse fades when no audio samples exist. */
const PULSE_DECAY = 0.08;

export function createMouthReader(): MouthReader {
  let analyser: MouthAnalyser | null = null;
  let level = 0;
  let pulseLevel = 0;
  let scratch: Uint8Array | null = null;

  return {
    setAnalyser(next) {
      analyser = next;
      // Real samples replace the approximate mode: never mix the two.
      if (next) pulseLevel = 0;
    },
    pulse() {
      pulseLevel = 1;
    },
    getMouthOpen() {
      let target = 0;
      if (analyser) {
        const size = analyser.fftSize;
        if (!scratch || scratch.length !== size) scratch = new Uint8Array(size);
        analyser.getByteTimeDomainData(scratch);
        const samples = Array.from(scratch, (v) => (v - 128) / 128);
        target = amplitudeToMouth(rms(samples));
      } else if (pulseLevel > 0) {
        target = pulseLevel;
        pulseLevel = Math.max(0, pulseLevel - PULSE_DECAY);
      }
      level = smoothLevel(level, target);
      return level;
    },
  };
}
