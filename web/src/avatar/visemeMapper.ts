// Avatar Lab — amplitude-driven mouth mapping (pure, tested).
//
// Honest scope, stated up front: this maps the REAL audio envelope to jaw
// motion, so the mouth opens exactly while sound plays and closes in silence.
// It is NOT phoneme recognition — /b/ vs /m/ shapes need either Rhubarb
// pre-processing or a phoneme model, both deliberately out of Phase 1 (no new
// providers, no new binaries). The Lab labels the mode accordingly.

/** RMS window the mapper treats as "fully open mouth". */
export const FULL_OPEN_RMS = 0.3;
/** RMS below this is room noise, never speech. */
export const SILENCE_RMS = 0.02;

/** Raw RMS (0..1+) of a time-domain sample window. */
export function rms(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i]! * samples[i]!;
  return Math.sqrt(sum / samples.length);
}

/** RMS → mouth openness 0..1, with a silence floor. */
export function amplitudeToMouth(rmsValue: number): number {
  if (!(rmsValue > 0)) return 0;
  const open = (rmsValue - SILENCE_RMS) / (FULL_OPEN_RMS - SILENCE_RMS);
  return Math.min(1, Math.max(0, open));
}

/** One-pole smoothing factor for a per-frame level (0 = frozen, 1 = raw). */
export function smoothLevel(previous: number, target: number, factor = 0.35): number {
  return previous + (target - previous) * Math.min(1, Math.max(0, factor));
}

/**
 * VRM expression weights for a presence state. VRM 1.0 preset names
 * (aa/ih/ou/ee/oh, blink, happy/sad/surprised/angry/relaxed/neutral).
 * Mouth shape comes from the audio envelope, never from here.
 */
export function expressionForState(state: string): Record<string, number> {
  switch (state) {
    case "correct":
      return { happy: 0.8, relaxed: 0.4 };
    case "partial":
      return { surprised: 0.35, relaxed: 0.4 };
    case "incorrect":
      return { sad: 0.45, relaxed: 0.3 };
    case "thinking":
      return { surprised: 0.25, relaxed: 0.5 };
    case "listening":
      return { relaxed: 0.7, neutral: 0.3 };
    case "speaking":
      return { relaxed: 0.5, neutral: 0.2 };
    default:
      return { neutral: 0.6, relaxed: 0.4 };
  }
}

/** Blink timing: a blink occupies `durationMs` of every `periodMs`. */
export function isBlinkTime(elapsedMs: number, periodMs = 4200, durationMs = 150): boolean {
  if (elapsedMs < 0 || periodMs <= 0 || durationMs <= 0) return false;
  return elapsedMs % periodMs < durationMs;
}
