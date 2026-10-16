import * as THREE from "three";
import type { VRM } from "@pixiv/three-vrm";

/**
 * "Tutor" look, applied at load on top of the licensed VRM base.
 *
 * The base (a CC0 VRoid Studio sample) already provides the complete
 * professional outfit — white shirt, navy vest, orange tie — so this module
 * builds **no geometry**: it does not add clothes and does not add a scarf.
 * It only re-tints the one thing the base cannot express for the role, the
 * hair (and matching eyebrows), from their sample colour to a natural dark
 * brown, by rewriting the existing map textures in place.
 *
 * Everything here runs at load and is idempotent per material; the lesson room
 * never imports this. Nothing is added to the scene, so disposal needs no
 * change (the replaced textures are owned by the material they were set on).
 */

/** Natural dark brown for the tutor's hair. */
export const HAIR_BROWN = 0x2b1d16;

/** MToon shade tone (the toon "shadow" term) for the same hair. */
export const HAIR_BROWN_SHADE = 0x140c08;

/** Parts whose map we re-tint: the hair and the eyebrows (kept in sync). */
export const RECOLOR_PATTERN = /hair|brow/i;

/** Split a 0xRRGGBB hex into sRGB unit channels (no colour management). */
export function hexToUnit(hex: number): [number, number, number] {
  return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
}

/** Material names this module owns (pure: used by tests). */
export function isRecolorTarget(materialName: string): boolean {
  return RECOLOR_PATTERN.test(materialName);
}

/**
 * Map a texture pixel's luminance (0..1) onto the target tint's ramp: dark
 * pixels read as near-black roots, bright pixels keep the tint's brightness.
 * Keeping the per-pixel luminance preserves the base's own strand gradient, so
 * the hair keeps its shading instead of turning flat.
 */
export function shadeForLuminance(
  luminance: number,
  target: [number, number, number],
): [number, number, number] {
  const t = luminance < 0 ? 0 : luminance > 1 ? 1 : luminance;
  const k = 0.15 + 0.85 * t;
  return [target[0] * k, target[1] * k, target[2] * k];
}

/** Structural view of the MToon/standard fields we touch. */
interface RecolorableMaterial extends THREE.Material {
  map?: THREE.Texture | null;
  color?: THREE.Color;
  shadeColorFactor?: THREE.Color;
}

/** Re-tint one map texture's pixels toward `target`, keeping alpha. */
function recolorMapTexture(map: THREE.Texture, target: [number, number, number]): THREE.Texture | null {
  const image = map.image as (CanvasImageSource & { width?: number; height?: number }) | undefined;
  const width = image?.width ?? 0;
  const height = image?.height ?? 0;
  if (!image || width <= 0 || height <= 0) return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const luminance = (0.299 * px[i]! + 0.587 * px[i + 1]! + 0.114 * px[i + 2]!) / 255;
    const [r, g, b] = shadeForLuminance(luminance, target);
    px[i] = Math.round(r * 255);
    px[i + 1] = Math.round(g * 255);
    px[i + 2] = Math.round(b * 255);
  }
  ctx.putImageData(data, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = map.flipY;
  tex.wrapS = map.wrapS;
  tex.wrapT = map.wrapT;
  tex.colorSpace = map.colorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Re-tint every hair/brow material in the tree. Returns how many materials were
 * changed. Safe no-op off the DOM (tests) or on a base lacking those materials.
 */
export function recolorHair(
  scene: THREE.Object3D,
  targetHex: number = HAIR_BROWN,
  shadeHex: number = HAIR_BROWN_SHADE,
): number {
  if (typeof document === "undefined") return 0;
  const target = hexToUnit(targetHex);
  const done = new Set<THREE.Material>();
  let changed = 0;
  scene.traverse((obj) => {
    const material = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    const list = Array.isArray(material) ? material : material ? [material] : [];
    for (const mat of list) {
      if (done.has(mat) || !isRecolorTarget(mat.name)) continue;
      done.add(mat);
      const m = mat as RecolorableMaterial;
      const recolored = m.map ? recolorMapTexture(m.map, target) : null;
      if (recolored) m.map = recolored;
      // The map now carries the tint, so the multiply factor must be neutral.
      m.color?.setHex(0xffffff);
      m.shadeColorFactor?.setHex(shadeHex);
      changed++;
    }
  });
  return changed;
}

/** Apply the whole tutor treatment to a loaded VRM. */
export function applyTutorLook(vrm: VRM): number {
  return recolorHair(vrm.scene);
}
