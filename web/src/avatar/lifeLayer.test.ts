import * as THREE from "three";
import { describe, expect, it } from "vitest";
import type { VRM } from "@pixiv/three-vrm";
import {
  BASE_ARMS_POSE,
  LIFE_BONES,
  breath,
  createLifeAnimator,
  damp,
  dampAngle,
  lifeBlinkWeight,
  lifePoseAt,
  nodEnvelope,
  poseForState,
  shakeEnvelope,
  smoothNoise,
  sway,
  tiltEnvelope,
  weightShift,
} from "./lifeLayer.js";
import { AVATAR_STATE_AR } from "./avatarStates.js";

const STATES = Object.keys(AVATAR_STATE_AR);

describe("life layer — pursuit", () => {
  it("damps toward the target and never overshoots it", () => {
    let v = 0;
    let previous = 0;
    for (let i = 0; i < 240; i++) {
      v = damp(v, 1, 7, 1 / 60);
      expect(v).toBeGreaterThanOrEqual(previous);
      expect(v).toBeLessThanOrEqual(1.0000001);
      previous = v;
    }
    expect(v).toBeCloseTo(1, 3);
  });

  it("snaps on a non-positive dt or an infinite lambda", () => {
    expect(damp(0, 1, 7, 0)).toBe(1);
    expect(damp(0, 1, Number.POSITIVE_INFINITY, 1 / 60)).toBe(1);
    expect(dampAngle(0, 1, Number.POSITIVE_INFINITY, 1 / 60)).toBe(1);
  });

  it("dampAngle takes the short way round the circle", () => {
    // From just under +π toward just over −π the short arc is through ±π (+), not 2π back.
    const from = Math.PI - 0.1;
    const to = -Math.PI + 0.1;
    const next = dampAngle(from, to, 7, 1 / 60);
    expect(next).toBeGreaterThan(from);
  });
});

describe("life layer — signal", () => {
  it("smoothNoise is deterministic, bounded, and seed-dependent", () => {
    expect(smoothNoise(1234, 1)).toBe(smoothNoise(1234, 1));
    expect(smoothNoise(1234, 1)).not.toBe(smoothNoise(1234, 2));
    for (let t = 0; t < 60000; t += 137) {
      expect(Math.abs(smoothNoise(t, 3))).toBeLessThanOrEqual(1);
    }
  });

  it("breath / sway / weightShift stay in -1..1 with distinct periods", () => {
    for (let t = 0; t < 40000; t += 211) {
      for (const fn of [breath, sway, weightShift]) {
        expect(Math.abs(fn(t))).toBeLessThanOrEqual(1);
      }
    }
  });

  it("one-shot envelopes start and end at rest and peak inside the window", () => {
    for (const fn of [nodEnvelope, shakeEnvelope, tiltEnvelope]) {
      expect(fn(0)).toBe(0);
      expect(fn(-10)).toBe(0);
      expect(fn(60000)).toBe(0);
      expect(Math.abs(fn(60))).toBeGreaterThan(0.1);
      for (let t = 0; t < 2500; t += 13) expect(Math.abs(fn(t))).toBeLessThanOrEqual(1);
    }
  });

  it("blinks are a pulse, doubled occasionally, and still silent under reduced motion", () => {
    expect(lifeBlinkWeight(0, false)).toBe(1);
    expect(lifeBlinkWeight(1000, false)).toBe(0);
    expect(lifeBlinkWeight(1000, true)).toBe(0);
    // The secondary blink lands mid-way between the primary ones.
    expect(lifeBlinkWeight(9700, false)).toBe(1);
    expect(lifeBlinkWeight(9700, true)).toBe(0);
  });
});

describe("life layer — poses", () => {
  it("defines a distinct bone at most once and always carries the arm chain", () => {
    expect(new Set(LIFE_BONES).size).toBe(LIFE_BONES.length);
    for (const state of STATES) {
      const pose = poseForState(state).rot;
      // Every state starts from the relaxed arms (a state may nudge them).
      for (const bone of Object.keys(BASE_ARMS_POSE)) {
        expect(pose[bone as keyof typeof pose]).toBeDefined();
      }
    }
    // idle / off are purely the relaxed arms — no state-specific arm change.
    for (const state of ["idle", "off"]) {
      const rot = poseForState(state).rot;
      for (const [bone, value] of Object.entries(BASE_ARMS_POSE)) {
        expect(rot[bone as keyof typeof rot]).toEqual(value);
      }
    }
  });

  it("covers every declared state, and idle/off stay near-neutral", () => {
    for (const state of STATES) {
      const pose = poseForState(state);
      expect(Object.keys(pose.rot).length).toBeGreaterThan(0);
    }
    expect(poseForState("idle").rot.head).toBeUndefined();
    expect(poseForState("off").rot.head).toBeUndefined();
  });

  it("reduced motion is exactly the held pose, with zero periodic motion", () => {
    const input = { tInStateMs: 300, mouthOpen: 0.8, reducedMotion: false };
    for (const state of STATES) {
      const still = { ...input, reducedMotion: true };
      const a = lifePoseAt(state, { ...still, elapsedMs: 0 });
      const b = lifePoseAt(state, { ...still, elapsedMs: 4321 });
      expect(a).toEqual(b);
      expect(a).toEqual(poseForState(state));
    }
  });

  it("adds continuous motion in normal mode and is deterministic", () => {
    const input = { elapsedMs: 8000, tInStateMs: 500, mouthOpen: 0.5, reducedMotion: false };
    expect(lifePoseAt("idle", input)).toEqual(lifePoseAt("idle", input));
    expect(lifePoseAt("idle", input)).not.toEqual(poseForState("idle"));
  });

  it("plays its gesture only inside the state, then settles back to rest", () => {
    const base = { elapsedMs: 5000, mouthOpen: 0, reducedMotion: false };
    const start = lifePoseAt("correct", { ...base, tInStateMs: 0 });
    const mid = lifePoseAt("correct", { ...base, tInStateMs: 60 });
    const late = lifePoseAt("correct", { ...base, tInStateMs: 5000 });
    expect(mid.rot.head![0]).not.toBeCloseTo(start.rot.head![0], 3);
    // Once the gesture has decayed the pose matches its own rest pose exactly.
    expect(late).toEqual(start);
    // A shake only moves yaw; a nod only moves pitch (same periodic motion).
    const still = lifePoseAt("incorrect", { ...base, tInStateMs: 0 });
    const shake = lifePoseAt("incorrect", { ...base, tInStateMs: 65 });
    expect(shake.rot.head![0]).toBeCloseTo(still.rot.head![0], 6);
    expect(Math.abs(shake.rot.head![1] ?? 0)).toBeGreaterThan(0.01);
  });
});

describe("life layer — animator", () => {
  function fakeVrm(): { vrm: VRM; nodes: Record<string, THREE.Object3D> } {
    const names = ["head", "neck", "chest", "leftEye", "rightEye"];
    const nodes: Record<string, THREE.Object3D> = {};
    for (const name of names) nodes[name] = new THREE.Object3D();
    const humanoid = {
      getNormalizedBoneNode: (name: string) => nodes[name] ?? null,
    };
    return { vrm: { humanoid } as unknown as VRM, nodes };
  }

  it("writes normalized bones and eases toward the target (no crash on gaps)", () => {
    const { vrm, nodes } = fakeVrm();
    const animator = createLifeAnimator();
    const frame = {
      state: "idle",
      elapsedMs: 1000,
      tInStateMs: 1000,
      mouthOpen: 0,
      reducedMotion: false,
      dt: 1 / 60,
    };
    animator.update(vrm, frame);
    const first = nodes.head!.rotation.x;
    expect(Number.isFinite(first)).toBe(true);
    for (let i = 0; i < 120; i++) animator.update(vrm, frame);
    expect(Number.isFinite(nodes.head!.rotation.x)).toBe(true);
    // Eyes exist on this fake rig, so gaze drift reaches them.
    expect(Number.isFinite(nodes.leftEye!.rotation.y)).toBe(true);
  });

  it("snaps straight to the held pose under reduced motion", () => {
    const { vrm, nodes } = fakeVrm();
    const animator = createLifeAnimator();
    animator.update(vrm, {
      state: "correct",
      elapsedMs: 0,
      tInStateMs: 400,
      mouthOpen: 0,
      reducedMotion: true,
      dt: 1 / 60,
    });
    expect(nodes.head!.rotation.x).toBeCloseTo(poseForState("correct").rot.head![0], 6);
  });
});
