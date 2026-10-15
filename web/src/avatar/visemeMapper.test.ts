import { describe, expect, it } from "vitest";
import {
  amplitudeToMouth,
  expressionForState,
  isBlinkTime,
  rms,
  smoothLevel,
} from "./visemeMapper.js";

describe("viseme mapper", () => {
  it("measures RMS energy of a sample window", () => {
    expect(rms([])).toBe(0);
    expect(rms([0, 0, 0])).toBe(0);
    expect(rms([1, -1, 1, -1])).toBeCloseTo(1);
    expect(rms([0.5, -0.5])).toBeCloseTo(0.5);
  });

  it("maps silence to a closed mouth and loud speech to fully open", () => {
    expect(amplitudeToMouth(0)).toBe(0);
    expect(amplitudeToMouth(-1)).toBe(0);
    expect(amplitudeToMouth(0.01)).toBe(0);
    expect(amplitudeToMouth(0.3)).toBe(1);
    expect(amplitudeToMouth(10)).toBe(1);
    const half = amplitudeToMouth(0.16);
    expect(half).toBeGreaterThan(0.3);
    expect(half).toBeLessThan(0.7);
  });

  it("smooths levels without overshooting", () => {
    expect(smoothLevel(0, 1, 0.5)).toBeCloseTo(0.5);
    expect(smoothLevel(0.5, 0.5)).toBeCloseTo(0.5);
    expect(smoothLevel(0, 1, 0)).toBe(0);
    expect(smoothLevel(0, 1, 2)).toBe(1);
  });

  it("poses expressions per state without touching the mouth", () => {
    expect(expressionForState("correct").happy).toBeGreaterThan(0);
    expect(expressionForState("incorrect").sad).toBeGreaterThan(0);
    expect(expressionForState("idle").neutral).toBeGreaterThan(0);
    for (const s of ["idle", "speaking", "correct"]) {
      expect(expressionForState(s).aa ?? 0).toBe(0);
    }
  });

  it("schedules periodic blinks", () => {
    expect(isBlinkTime(0)).toBe(true);
    expect(isBlinkTime(149)).toBe(true);
    expect(isBlinkTime(150)).toBe(false);
    expect(isBlinkTime(4200)).toBe(true);
    expect(isBlinkTime(-5)).toBe(false);
  });
});
