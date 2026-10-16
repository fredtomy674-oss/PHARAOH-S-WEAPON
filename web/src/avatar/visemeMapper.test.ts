import { describe, expect, it } from "vitest";
import {
  EXPRESSION_PRESETS,
  amplitudeToMouth,
  blinkWeight,
  expressionForState,
  isBlinkTime,
  rms,
  smoothLevel,
} from "./visemeMapper.js";
import { AVATAR_STATE_AR } from "./avatarStates.js";

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

  it("writes the blink weight down again outside the pulse (never latches)", () => {
    // Regression: only ever writing 1 left the eyes shut after the first blink.
    expect(blinkWeight(0, false)).toBe(1);
    expect(blinkWeight(149, false)).toBe(1);
    expect(blinkWeight(150, false)).toBe(0);
    expect(blinkWeight(2000, false)).toBe(0);
    expect(blinkWeight(4200, false)).toBe(1);
    // Reduced motion: never blink at all.
    expect(blinkWeight(0, true)).toBe(0);
    expect(blinkWeight(4200, true)).toBe(0);
  });

  it("lists every preset a state can use, so stale ones can be cleared", () => {
    // The renderer zeroes every preset not requested this frame; if a state's
    // preset were missing from the list it would latch on the face forever.
    const listed = new Set<string>(EXPRESSION_PRESETS);
    expect(listed.has("blink")).toBe(true);
    for (const mouth of ["aa", "ih", "ou", "ee", "oh"]) expect(listed.has(mouth)).toBe(true);
    for (const state of Object.keys(AVATAR_STATE_AR)) {
      for (const preset of Object.keys(expressionForState(state))) {
        expect(listed.has(preset)).toBe(true);
      }
    }
  });
});
