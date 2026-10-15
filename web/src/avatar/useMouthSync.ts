import { useEffect, useRef } from "react";
import { amplitudeToMouth, rms, smoothLevel } from "./visemeMapper.js";

/**
 * Single audio-motion loop for the Lab: each animation frame reads the live
 * analyser (server voice, mic test) into a smoothed mouth level the avatar
 * consumes, or decays a speechSynthesis boundary pulse when no audio samples
 * exist (browser voices expose no signal — the approximate mode, labelled so
 * in the UI).
 */
export function useMouthSync(active: boolean): {
  mouthRef: React.MutableRefObject<number>;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  pulse: () => void;
  getMouthOpen: () => number;
} {
  const mouthRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pulseRef = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;
  const scratchRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    const tick = () => {
      if (cancelled) return;
      raf = requestAnimationFrame(tick);
      const analyser = analyserRef.current;
      let target = 0;
      if (activeRef.current && analyser) {
        const size = analyser.fftSize;
        if (!scratchRef.current || scratchRef.current.length !== size) {
          scratchRef.current = new Uint8Array(size);
        }
        analyser.getByteTimeDomainData(scratchRef.current as Uint8Array<ArrayBuffer>);
        const samples = Array.from(scratchRef.current, (v) => (v - 128) / 128);
        target = amplitudeToMouth(rms(samples));
      } else if (pulseRef.current > 0) {
        target = pulseRef.current;
        pulseRef.current = Math.max(0, pulseRef.current - 0.08);
      }
      mouthRef.current = activeRef.current || pulseRef.current > 0 ? smoothLevel(mouthRef.current, target) : smoothLevel(mouthRef.current, 0);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  const api = useRef({
    mouthRef,
    analyserRef,
    pulse: () => {
      pulseRef.current = 1;
    },
    getMouthOpen: () => mouthRef.current,
  });
  return api.current;
}
