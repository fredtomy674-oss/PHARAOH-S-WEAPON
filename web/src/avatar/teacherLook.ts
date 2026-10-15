import * as THREE from "three";
import type { VRM } from "@pixiv/three-vrm";

/**
 * "Egyptian teacher" look, applied at load on top of the licensed VRM base.
 *
 * The base (a CC0 VRoid Studio sample) already provides the professional outfit
 * — white blouse, navy vest, navy skirt — so this module does not build clothes.
 * It adds the one thing the base cannot express, a fitted headscarf, and hides
 * the parts the scarf replaces (the hair and the school neck bow).
 *
 * The scarf is generated geometry (no third-party asset), sized from the model's
 * own face bounds so it survives a base swap, and parented to the model root so
 * it rides the existing idle sway. Nothing here runs unless the Lab mounts it;
 * the lesson room never imports it.
 */

/** Dusty mauve from the reference board. */
const HIJAB_COLOR = 0xb0859e;

/** Hide the parts the headscarf makes redundant: the hair and the neck bow. */
function hideReplacedParts(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const material = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    const list = Array.isArray(material) ? material : material ? [material] : [];
    for (const mat of list) if (/hair|accessory/i.test(mat.name)) mat.visible = false;
  });
}

/** First mesh in the tree whose material name matches. */
function findMeshByMaterial(root: THREE.Object3D, re: RegExp): THREE.Mesh | null {
  let found: THREE.Mesh | null = null;
  root.traverse((obj) => {
    if (found) return;
    const mesh = obj as THREE.Mesh;
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    const list = Array.isArray(material) ? material : material ? [material] : [];
    if (mesh.isMesh && list.some((m) => re.test(m.name))) found = mesh;
  });
  return found;
}

/**
 * A partial ellipsoid ("hood") with an oval hole cut in the +Z (front) face —
 * the headscarf silhouette. `openX`/`openY` are the hole's half-extents, sized
 * from the model's own face so the whole face shows and the cheeks are framed.
 */
export function buildHood(rx: number, ry: number, rz: number, openX: number, openY: number): THREE.BufferGeometry {
  const seg = 72;
  const rings = 48;
  const positions: number[] = [];
  for (let i = 0; i <= rings; i++) {
    const theta = (i / rings) * Math.PI;
    const st = Math.sin(theta);
    const ct = Math.cos(theta);
    for (let j = 0; j <= seg; j++) {
      const phi = (j / seg) * Math.PI * 2;
      positions.push(rx * st * Math.sin(phi), ry * ct, rz * st * Math.cos(phi));
    }
  }
  const indices: number[] = [];
  for (let i = 0; i < rings; i++) {
    const theta = ((i + 0.5) / rings) * Math.PI;
    const st = Math.sin(theta);
    const ct = Math.cos(theta);
    for (let j = 0; j < seg; j++) {
      const phi = ((j + 0.5) / seg) * Math.PI * 2;
      const x = rx * st * Math.sin(phi);
      const y = ry * ct;
      const z = rz * st * Math.cos(phi);
      // Face window: front half, inside the face oval -> no cloth there.
      if (z > 0 && (x / openX) ** 2 + (y / openY) ** 2 < 1) continue;
      const a = i * (seg + 1) + j;
      const b = a + 1;
      const c = a + seg + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** A shoulder cape: an elliptical sheet with an eased flare and a rolled hem. */
export function buildDrape(
  rTopX: number,
  rTopZ: number,
  rBotX: number,
  rBotZ: number,
  height: number,
  rings = 14,
): THREE.BufferGeometry {
  const seg = 72;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const ease = t * t * (3 - 2 * t);
    const roll = t > 0.8 ? 1 - 0.5 * ((t - 0.8) / 0.2) : 1;
    const sx = (rTopX + (rBotX - rTopX) * ease) * roll;
    const sz = (rTopZ + (rBotZ - rTopZ) * ease) * roll;
    const y = -t * height;
    for (let j = 0; j <= seg; j++) {
      const phi = (j / seg) * Math.PI * 2;
      positions.push(sx * Math.sin(phi), y, sz * Math.cos(phi));
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * (seg + 1) + j;
      const b = a + 1;
      const c = a + seg + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Apply the teacher look to a loaded VRM. Returns the added objects (for tests /
 * disposal). Safe no-op pieces if the model lacks the expected parts.
 */
export function applyTeacherLook(vrm: VRM): THREE.Object3D[] {
  const scene = vrm.scene;
  scene.updateWorldMatrix(true, true);
  hideReplacedParts(scene);

  const face = findMeshByMaterial(scene, /Face_00_SKIN/i) ?? findMeshByMaterial(scene, /face/i);
  if (!face) return [];

  // Work in the model root's LOCAL frame: a VRM 0.x root carries a 180° yaw so
  // it faces the camera, and geometry added as its child must not re-apply it.
  const inverse = new THREE.Matrix4().copy(scene.matrixWorld).invert();
  const box = new THREE.Box3().setFromObject(face).applyMatrix4(inverse);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  // Rotation that turns the hood's +Z face-window toward the model's front.
  const yaw = -scene.rotation.y;

  // Fabric-ish material: sheen gives cloth a soft grazing highlight (a plain
  // standard material read as plastic at this scale).
  const material = new THREE.MeshPhysicalMaterial({
    color: HIJAB_COLOR,
    roughness: 0.85,
    metalness: 0,
    sheen: 1,
    sheenRoughness: 0.7,
    sheenColor: new THREE.Color(0xdfc9d8),
    side: THREE.DoubleSide,
  });

  const rx = size.x * 0.62;
  const ry = size.y * 0.58;
  const rz = size.x * 0.62;
  const centerY = center.y + size.y * 0.06;
  const centerZ = center.z - size.x * 0.16;
  const hood = new THREE.Mesh(buildHood(rx, ry, rz, size.x * 0.47, size.y * 0.55), material);
  hood.position.set(center.x, centerY, centerZ);
  hood.rotation.y = yaw;

  // Neck/chest drape: starts under the jaw (never over the chin), hugs the neck,
  // then flares onto the chest with a rolled hem so the edge reads as fabric.
  const topY = centerY - ry * 0.82;
  const drapeHeight = size.y * 0.62;
  const drape = new THREE.Mesh(
    buildDrape(rx * 0.55, rz * 0.55, rx * 1.18, rz * 0.98, drapeHeight),
    material,
  );
  drape.position.set(center.x, topY, centerZ);

  scene.add(hood, drape);
  return [hood, drape];
}
