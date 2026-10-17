import { describe, expect, it } from "vitest";
import { createMouthReader, type MouthAnalyser } from "./mouthReader.js";

/** A fake analyser: replays a scripted waveform, one window per call. */
function fakeAnalyser(window: (i: number) => number[], fftSize = 64): MouthAnalyser & { calls: number } {
  let count = 0;
  return {
    fftSize,
    get calls() {
      return count;
    },
    getByteTimeDomainData(array: Uint8Array) {
      const samples = window(count++);
      for (let i = 0; i < array.length; i += 1) array[i] = samples[i % samples.length] ?? 128;
    },
  };
}

/** 128 = silence in byte time-domain data; ±large = loud audio. */
const silentWindow = () => Array.from({ length: 64 }, () => 128);
const loudWindow = () => Array.from({ length: 64 }, (_, i) => (i % 2 === 0 ? 228 : 28));

describe("PHASE 162 — the mouth reader", () => {
  it("stays closed when there is no signal at all", () => {
    const reader = createMouthReader();
    for (let i = 0; i < 10; i += 1) expect(reader.getMouthOpen()).toBe(0);
  });

  it("opens on a real audio envelope and closes when the samples go silent", () => {
    const reader = createMouthReader();
    reader.setAnalyser(fakeAnalyser((i) => (i < 5 ? loudWindow() : silentWindow())));
    let sawOpen = 0;
    for (let i = 0; i < 5; i += 1) sawOpen = Math.max(sawOpen, reader.getMouthOpen());
    expect(sawOpen).toBeGreaterThan(0.4);
    // Silence decays the smoothed level back toward zero, never below it.
    let last = 1;
    for (let i = 0; i < 40; i += 1) {
      last = reader.getMouthOpen();
      expect(last).toBeGreaterThanOrEqual(0);
      expect(last).toBeLessThanOrEqual(1);
    }
    expect(last).toBeLessThan(0.05);
  });

  it("uses the boundary pulse only when no analyser exists, and it fades", () => {
    const reader = createMouthReader();
    reader.pulse();
    const first = reader.getMouthOpen();
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThanOrEqual(1);
    let later = first;
    for (let i = 0; i < 60; i += 1) later = reader.getMouthOpen();
    expect(later).toBeLessThan(first);
    expect(later).toBeLessThan(0.05);
  });

  it("real samples replace the pulse mode instantly (no mixing of the two)", () => {
    const reader = createMouthReader();
    reader.pulse();
    expect(reader.getMouthOpen()).toBeGreaterThan(0);
    reader.setAnalyser(fakeAnalyser(() => silentWindow()));
    // The pulse is discarded; silent samples decay the level instead of pulsing.
    const a = reader.getMouthOpen();
    const b = reader.getMouthOpen();
    expect(b).toBeLessThanOrEqual(a);
  });

  it("clearing the analyser decays to silence — stopping audio never freezes the mouth", () => {
    const reader = createMouthReader();
    reader.setAnalyser(fakeAnalyser(() => loudWindow()));
    for (let i = 0; i < 20; i += 1) reader.getMouthOpen();
    const open = reader.getMouthOpen();
    expect(open).toBeGreaterThan(0.4);
    reader.setAnalyser(null);
    let last = open;
    for (let i = 0; i < 60; i += 1) last = reader.getMouthOpen();
    expect(last).toBeLessThan(0.05);
  });

  it("handles an fftSize change between frames (a new audio graph)", () => {
    const reader = createMouthReader();
    reader.setAnalyser(fakeAnalyser(() => loudWindow(), 32));
    reader.getMouthOpen();
    reader.setAnalyser(fakeAnalyser(() => loudWindow(), 128));
    expect(reader.getMouthOpen()).toBeGreaterThan(0);
  });
});
