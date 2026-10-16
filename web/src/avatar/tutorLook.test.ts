import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  HAIR_BROWN,
  hexToUnit,
  isRecolorTarget,
  recolorHair,
  shadeForLuminance,
} from "./tutorLook.js";

describe("tutor look — hair re-tint", () => {
  it("claims exactly the hair and brow materials, never skin/eyes/clothes", () => {
    expect(isRecolorTarget("M00_000_HairBack_00_HAIR")).toBe(true);
    expect(isRecolorTarget("F00_000_Hair_00_HAIR_01")).toBe(true);
    expect(isRecolorTarget("M00_000_00_FaceBrow_00_FACE")).toBe(true);
    // Must not touch the face, the eyes, or the outfit (incl. the neck tie).
    expect(isRecolorTarget("M00_000_00_Face_00_SKIN")).toBe(false);
    expect(isRecolorTarget("M00_000_00_EyeIris_00_EYE")).toBe(false);
    expect(isRecolorTarget("M00_001_01_Tops_01_CLOTH")).toBe(false);
    expect(isRecolorTarget("M00_001_01_AccessoryNeck_01_CLOTH")).toBe(false);
  });

  it("splits the tint hex into sRGB unit channels", () => {
    const [r, g, b] = hexToUnit(HAIR_BROWN);
    expect(r).toBeCloseTo(0x2b / 255, 6);
    expect(g).toBeCloseTo(0x1d / 255, 6);
    expect(b).toBeCloseTo(0x16 / 255, 6);
  });

  it("ramps dark pixels to near-black and bright pixels to the tint, monotonic", () => {
    const target: [number, number, number] = [1, 1, 1];
    const lo = shadeForLuminance(0, target);
    const mid = shadeForLuminance(0.5, target);
    const hi = shadeForLuminance(1, target);
    expect(lo[0]).toBeCloseTo(0.15, 6);
    expect(hi[0]).toBeCloseTo(1, 6);
    expect(lo[0]).toBeLessThan(mid[0]);
    expect(mid[0]).toBeLessThan(hi[0]);
    // Out-of-range luminance is clamped, never wraps or goes negative.
    expect(shadeForLuminance(-5, target)[0]).toBeCloseTo(0.15, 6);
    expect(shadeForLuminance(9, target)[0]).toBeCloseTo(1, 6);
  });

  it("is a safe no-op when there is no DOM (server/tests)", () => {
    const scene = new THREE.Object3D();
    expect(recolorHair(scene)).toBe(0);
  });
});
