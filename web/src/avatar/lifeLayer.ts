import type { VRM } from "@pixiv/three-vrm";
import { blinkWeight } from "./visemeMapper.js";

/**
 * Avatar Lab — procedural "life" layer.
 *
 * Purpose: an avatar that only blinks and sways reads as a statue. This layer
 * gives the tutor continuous human presence — breathing, weight shift, head and
 * gaze micro-life, per-state gestures with smooth transitions — computed from
 * time alone. It is **deterministic** (same time ⇒ same pose, so it can be
 * tested) and **additive on explicit state**: it never invents a mood. States
 * still arrive only from real events (see avatarStates.ts); silence still means
 * nothing by itself.
 *
 * Division of labour:
 *  - The pure functions here (noise, damped pursuit, envelopes, per-state
 *    targets, `lifePoseAt`) are unit-tested in node with no DOM.
 *  - `createLifeAnimator()` is the thin adapter that damps normalized humanoid
 *    bones toward those targets. It writes *normalized* bones only, which
 *    `vrm.update(dt)` then maps onto the raw skeleton — the same contract the
 *    old one-shot `relaxBindPose` used, now continuous.
 *
 * Reduced motion: `lifePoseAt` returns the static per-state target with none of
 * the periodic/gesture motion, and the animator snaps instead of easing, so the
 * avatar simply holds the right pose. Mouth motion (from real audio) is
 * unaffected — it lives on the expression path.
 */

export type Triple = [number, number, number];

/** Normalized humanoid bones the life layer owns. */
export const LIFE_BONES = [
  "hips",
  "spine",
  "chest",
  "upperChest",
  "neck",
  "head",
  "leftShoulder",
  "rightShoulder",
  "leftUpperArm",
  "rightUpperArm",
  "leftLowerArm",
  "rightLowerArm",
  "leftHand",
  "rightHand",
  "leftEye",
  "rightEye",
] as const;

export type LifeBone = (typeof LIFE_BONES)[number];

const ZERO: Triple = [0, 0, 0];

export interface LifePose {
  rot: Partial<Record<LifeBone, Triple>>;
}

/** How fast a bone chases its target (per second). Higher = snappier. */
export const LIFE_LAMBDA = 7;

/**
 * Relaxed arms, shared by every state. In a VRM T-pose the arms extend along
 * ±X, so lowering them is a rotation about Z (forward) — the same axis the
 * original pose used, verified on screen for this base.
 */
export const BASE_ARMS_POSE: Partial<Record<LifeBone, Triple>> = {
  leftUpperArm: [0, 0, 1.25],
  rightUpperArm: [0, 0, -1.25],
  leftLowerArm: [0, 0.35, 0.18],
  rightLowerArm: [0, -0.35, -0.18],
  leftHand: [0, 0.25, 0],
  rightHand: [0, -0.25, 0],
};

/** Frame-rate-independent exponential pursuit of a scalar target. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  if (!(dt > 0) || !Number.isFinite(lambda)) return target;
  return target + (current - target) * Math.exp(-lambda * dt);
}

/** Shortest-arc angular pursuit (chooses the −π…π way round). */
export function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  if (!(dt > 0) || !Number.isFinite(lambda)) return target;
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * (1 - Math.exp(-lambda * dt));
}

/**
 * Smooth, deterministic, bounded 1-D noise in about [-1, 1]: a small sum of
 * incommensurate sines. No state, no allocation, and it does not loop on a
 * human-noticeable period the way a single sine does.
 */
export function smoothNoise(t: number, seed = 0): number {
  const s = seed * 12.9898;
  return (
    Math.sin(t * 0.00031 + s) * 0.5 +
    Math.sin(t * 0.00073 + s * 1.7) * 0.3 +
    Math.sin(t * 0.0017 + s * 2.3) * 0.2
  );
}

/** Breathing phase, -1..1, on a calm ~3.8 s cycle. */
export function breath(t: number): number {
  return Math.sin((t / 3800) * Math.PI * 2);
}

/** Slow body sway, -1..1, ~5.2 s cycle. */
export function sway(t: number): number {
  return Math.sin((t / 5200) * Math.PI * 2);
}

/** Very slow weight shift, -1..1, ~9 s cycle. */
export function weightShift(t: number): number {
  return Math.sin((t / 9000) * Math.PI * 2);
}

/** One-shot nod (correct): starts at 0, oscillates, decays to 0. */
export function nodEnvelope(tInStateMs: number): number {
  if (!(tInStateMs > 0) || tInStateMs > 1700) return 0;
  return Math.sin((tInStateMs / 240) * Math.PI * 2) * Math.exp(-tInStateMs / 620);
}

/** One-shot head shake (incorrect): 0 at rest, decaying side-to-side. */
export function shakeEnvelope(tInStateMs: number): number {
  if (!(tInStateMs > 0) || tInStateMs > 2000) return 0;
  return Math.sin((tInStateMs / 260) * Math.PI * 2) * Math.exp(-tInStateMs / 720);
}

/** One-shot tilt (partial): a single soft lean that settles. */
export function tiltEnvelope(tInStateMs: number): number {
  if (!(tInStateMs > 0) || tInStateMs > 1400) return 0;
  return Math.sin((tInStateMs / 420) * Math.PI) * Math.exp(-tInStateMs / 800);
}

/** A short, occasionally-doubled blink — livelier than a metronome. */
export function lifeBlinkWeight(elapsedMs: number, reducedMotion: boolean): number {
  if (reducedMotion || elapsedMs < 0) return 0;
  const extra = elapsedMs % 9700 < 100 ? 1 : 0;
  return Math.max(blinkWeight(elapsedMs, reducedMotion), extra);
}

/**
 * Static per-state target pose (the "held" pose). Motion is layered on top by
 * `lifePoseAt`; this is what reduced-motion renders exactly.
 */
export function poseForState(state: string): LifePose {
  const rot: Partial<Record<LifeBone, Triple>> = { ...BASE_ARMS_POSE };
  switch (state) {
    case "listening":
      // Attentive: a slight forward lean and a small questioning tilt.
      rot.spine = [0.03, 0, 0];
      rot.chest = [0.06, 0, 0];
      rot.neck = [-0.02, 0, 0.03];
      rot.head = [0, 0, 0.05];
      rot.leftUpperArm = [0, 0, 1.32];
      rot.rightUpperArm = [0, 0, -1.32];
      break;
    case "thinking":
      // Gaze drifts up-and-away, head cocks slightly — no invented emotion.
      rot.chest = [0.02, 0, 0.02];
      rot.neck = [0.03, 0.08, 0.08];
      rot.head = [0.05, 0.1, 0.1];
      break;
    case "speaking":
      rot.chest = [0.03, 0, 0];
      break;
    case "correct":
      rot.chest = [-0.02, 0, 0];
      rot.neck = [-0.05, 0, 0];
      rot.head = [-0.04, 0, 0];
      rot.leftShoulder = [0, 0, -0.03];
      rot.rightShoulder = [0, 0, 0.03];
      break;
    case "partial":
      rot.neck = [0, 0, 0.05];
      rot.head = [0, 0, 0.09];
      break;
    case "incorrect":
      rot.neck = [0.02, 0, 0];
      rot.head = [0.03, 0, 0];
      break;
    default:
      // idle / off: near-neutral, calm.
      rot.neck = [0.01, 0, 0];
  }
  return { rot };
}

export interface LifeInput {
  elapsedMs: number;
  tInStateMs: number;
  mouthOpen: number;
  reducedMotion: boolean;
}

/**
 * Full target pose for a state at a moment in time: the held pose plus
 * breathing, sway, head/gaze micro-life and the state's gesture. Deterministic.
 */
export function lifePoseAt(state: string, input: LifeInput): LifePose {
  const base = poseForState(state);
  const rot: Partial<Record<LifeBone, Triple>> = { ...base.rot };
  if (input.reducedMotion) return { rot };

  const t = input.elapsedMs;
  const mouth = input.mouthOpen < 0 ? 0 : input.mouthOpen > 1 ? 1 : input.mouthOpen;
  const add = (bone: LifeBone, x: number, y: number, z: number): void => {
    const cur = rot[bone] ?? ZERO;
    rot[bone] = [cur[0] + x, cur[1] + y, cur[2] + z];
  };

  // Breathing (chest rise + faint shoulder lift).
  const b = breath(t);
  add("chest", 0.012 * b, 0, 0);
  add("spine", 0.006 * b, 0, 0);
  add("neck", -0.008 * b, 0, 0);
  add("leftShoulder", 0, 0, -0.02 * b);
  add("rightShoulder", 0, 0, 0.02 * b);

  // Body sway + very slow weight shift.
  const s = sway(t);
  const w = weightShift(t);
  add("hips", 0, 0, 0.015 * s + 0.01 * w);
  add("spine", 0, 0, -0.008 * s);
  add("chest", 0, 0, 0.006 * s);

  // Head + neck micro-life (independent seeds so it never looks metronomic).
  add("head", 0.012 * smoothNoise(t, 1), 0.02 * smoothNoise(t, 2), 0.012 * smoothNoise(t, 3));
  add("neck", 0.008 * smoothNoise(t, 4), 0.012 * smoothNoise(t, 5), 0.008 * smoothNoise(t, 6));

  // Gaze drift.
  const gazeYaw = 0.09 * smoothNoise(t, 7);
  const gazePitch = 0.05 * smoothNoise(t, 8);
  add("leftEye", gazePitch, gazeYaw, 0);
  add("rightEye", gazePitch, gazeYaw, 0);

  switch (state) {
    case "speaking": {
      // Head gives a little on each stressed syllable; hands answer softly on
      // the known Z axis (raising/lowering), never on the unverified elbow axis.
      const g = Math.sin(t / 420) * 0.1 + Math.sin(t / 910 + 1.3) * 0.06;
      add("head", -0.02 * mouth + 0.012 * g, 0, 0);
      add("neck", -0.01 * mouth, 0, 0);
      add("leftUpperArm", 0, 0, -0.07 * g * mouth);
      add("rightUpperArm", 0, 0, 0.07 * g * mouth);
      break;
    }
    case "listening": {
      // An occasional small nod while the student talks.
      const pulse = Math.pow(Math.max(0, Math.sin(t / 2400)), 6) * 0.05;
      add("head", pulse, 0, 0);
      break;
    }
    case "thinking": {
      const drift = smoothNoise(t * 0.6, 9);
      add("head", -0.02, 0.05 * drift, 0.02);
      add("leftEye", -0.04, 0.05, 0);
      add("rightEye", -0.04, 0.05, 0);
      break;
    }
    case "correct": {
      const n = nodEnvelope(input.tInStateMs);
      add("head", n * 0.14, 0, 0);
      add("neck", n * 0.08, 0, 0);
      break;
    }
    case "incorrect": {
      const sh = shakeEnvelope(input.tInStateMs);
      add("head", 0, sh * 0.16, 0);
      add("neck", 0, sh * 0.09, 0);
      break;
    }
    case "partial": {
      const ti = tiltEnvelope(input.tInStateMs);
      add("head", 0, 0, ti * 0.12);
      add("neck", 0, 0, ti * 0.07);
      break;
    }
  }

  return { rot };
}

export interface LifeFrame {
  state: string;
  elapsedMs: number;
  tInStateMs: number;
  mouthOpen: number;
  reducedMotion: boolean;
  dt: number;
}

/**
 * Adapter: damps the normalized humanoid bones toward `lifePoseAt`'s target
 * every frame. Smooth transitions are just this pursuit — no keyframe system.
 * A no-op on a model without the humanoid rig.
 */
export function createLifeAnimator(): { update: (vrm: VRM, frame: LifeFrame) => void } {
  const current = new Map<LifeBone, Triple>();
  return {
    update(vrm: VRM, frame: LifeFrame): void {
      const humanoid = vrm.humanoid;
      if (!humanoid) return;
      const target = lifePoseAt(frame.state, frame).rot;
      const lambda = frame.reducedMotion ? Number.POSITIVE_INFINITY : LIFE_LAMBDA;
      for (const bone of LIFE_BONES) {
        const node = humanoid.getNormalizedBoneNode(
          bone as Parameters<typeof humanoid.getNormalizedBoneNode>[0],
        );
        if (!node) continue;
        const to = target[bone] ?? ZERO;
        const from = current.get(bone) ?? ZERO;
        const next: Triple = [
          damp(from[0], to[0], lambda, frame.dt),
          damp(from[1], to[1], lambda, frame.dt),
          damp(from[2], to[2], lambda, frame.dt),
        ];
        current.set(bone, next);
        node.rotation.set(next[0], next[1], next[2]);
      }
    },
  };
}
