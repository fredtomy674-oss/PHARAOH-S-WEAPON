import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils, type VRM } from "@pixiv/three-vrm";
import { EXPRESSION_PRESETS, expressionForState } from "./visemeMapper.js";
import { createLifeAnimator, lifeBlinkWeight } from "./lifeLayer.js";
import { applyTutorLook } from "./tutorLook.js";
import type { AvatarState } from "./avatarStates.js";

export type AvatarLoadStatus = "empty" | "loading" | "ready" | "error";

export interface VrmAvatarProps {
  /** Same-origin .vrm URL, object URL from the file picker, or raw bytes. Null = slot pending. */
  model: string | ArrayBuffer | null;
  /** Presence state driving expressions (mouth comes from the audio envelope). */
  avatarState: AvatarState;
  /** Reads the current mouth openness 0..1 (analyser RMS, speech boundary pulse). */
  getMouthOpen: () => number;
  /** Reduced motion: static held pose, no breathing/sway/blink (mouth still follows speech). */
  reducedMotion: boolean;
  /**
   * Apply the tutor treatment (life layer + pose + hair re-tint). Default true.
   * Lab-only escape hatch (`?look=off`) for reviewing a bare candidate model.
   */
  applyLook?: boolean;
  onStatus: (status: AvatarLoadStatus, detail?: string) => void;
  onFps: (fps: number) => void;
}

/** Below this sustained frame rate the Lab suggests the lightweight fallback. */
export const LOW_FPS_THRESHOLD = 25;

/**
 * Imperative three.js viewport (deliberately no React Three Fiber: one model,
 * one camera, no scene graph in React state — the smallest bundle that can
 * prove the pipeline). All three.js objects live inside the effect and are
 * disposed in its cleanup, so StrictMode double-mounts and unmounts are safe.
 */
export function VrmAvatar({
  model,
  avatarState,
  getMouthOpen,
  reducedMotion,
  applyLook = true,
  onStatus,
  onFps,
}: VrmAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<AvatarState>(avatarState);
  stateRef.current = avatarState;
  const mouthRef = useRef(getMouthOpen);
  mouthRef.current = getMouthOpen;
  const motionRef = useRef(reducedMotion);
  motionRef.current = reducedMotion;
  const callbacksRef = useRef({ onStatus, onFps });
  callbacksRef.current = { onStatus, onFps };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!model) {
      callbacksRef.current.onStatus("empty");
      return;
    }
    // No WebGL at all: report, render nothing. The Lab shows the fallback.
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) {
      callbacksRef.current.onStatus("error", "لا يوجد WebGL في هذا المتصفح");
      return;
    }

    let disposed = false;
    let vrm: VRM | null = null;
    // The life layer owns the normalized bones. Null while a bare model is shown
    // (`?look=off`) or before the rig has loaded.
    let animator: ReturnType<typeof createLifeAnimator> | null = null;
    let lastState: AvatarState = stateRef.current;
    let tInStateMs = 0;
    const clock = new THREE.Clock();
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(1.5, 2.5, 3);
    scene.add(key);

    const resize = () => {
      const parent = canvas.parentElement;
      const w = Math.max(1, parent?.clientWidth ?? 300);
      const h = Math.max(1, parent?.clientHeight ?? 300);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    // Frame-rate meter (EMA, reported 4x/second): the Lab's perf evidence.
    let fpsEma = 60;
    let lastFpsReport = 0;
    let raf = 0;
    let elapsed = 0;

    const frame = () => {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), 0.1);
      elapsed += dt * 1000;
      if (dt > 0) fpsEma = fpsEma * 0.92 + (1 / dt) * 0.08;
      const now = performance.now();
      if (now - lastFpsReport > 250) {
        lastFpsReport = now;
        callbacksRef.current.onFps(Math.round(fpsEma));
      }
      if (vrm) {
        const st = stateRef.current;
        const manager = vrm.expressionManager;
        if (manager) {
          // Mouth shape follows the audio envelope, never the state.
          const mouth = mouthRef.current();
          const wants: Record<string, number> = {
            aa: mouth,
            ih: Math.max(0, mouth - 0.55) * 0.9,
            blink: lifeBlinkWeight(elapsed, motionRef.current),
            ...expressionForState(st),
          };
          // Written EVERY frame including the zeros: the manager latches, so a
          // stale pulse (blink) or a previous state's preset (happy after a
          // correct answer) would otherwise stick to the face forever.
          for (const name of EXPRESSION_PRESETS) {
            try {
              manager.setValue(name, wants[name] ?? 0);
            } catch {
              // Unknown preset on this model: leave it alone.
            }
          }
        }
        if (animator) {
          if (st !== lastState) {
            lastState = st;
            tInStateMs = 0;
          } else {
            tInStateMs += dt * 1000;
          }
          animator.update(vrm, {
            state: st,
            elapsedMs: elapsed,
            tInStateMs,
            mouthOpen: mouthRef.current(),
            reducedMotion: motionRef.current,
            dt,
          });
        }
        if (typeof (vrm as unknown as { update?: unknown }).update === "function") {
          // dt = 0 under reduced motion: three-vrm's spring bones early-return on
          // a non-positive delta, so the hair stops swinging instead of drifting.
          // `reset()` then relaxes it to its rest shape *in the current pose*, so
          // the freeze never catches it mid-swing after a gesture.
          (vrm as unknown as { update: (dt: number) => void }).update(motionRef.current ? 0 : dt);
          if (motionRef.current) vrm.springBoneManager?.reset();
        }
      }
      renderer.render(scene, camera);
    };

    callbacksRef.current.onStatus("loading");
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    const onLoad = (gltf: { scene: THREE.Object3D; userData: { vrm?: VRM } }) => {
      if (disposed) return;
      const loaded = gltf.userData.vrm ?? null;
      if (!loaded) {
        callbacksRef.current.onStatus("error", "الملف ليس VRM صالحًا (لا توجد بيانات شخصية)");
        return;
      }
      vrm = loaded;
      scene.add(vrm.scene);
      // VRM 0.x faces -Z; flip it to face the camera (no-op for VRM 1.0).
      VRMUtils.rotateVRM0(loaded);
      // Treatment, not identity: the base ships in a VRoid T-pose, so the life
      // layer drives every bone (starting from the relaxed arms) and the tutor
      // look re-tints the hair materials. No geometry is added.
      if (applyLook) {
        animator = createLifeAnimator();
        applyTutorLook(loaded);
      }
      // Frame head-and-shoulders from the model's own bounds (any height works).
      const box = new THREE.Box3().setFromObject(vrm.scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const headY = box.max.y - size.y * 0.18;
      camera.position.set(center.x, headY, center.z + size.y * 1.15);
      camera.lookAt(center.x, headY, center.z);
      callbacksRef.current.onStatus("ready");
      raf = requestAnimationFrame(frame);
    };
    const onError = (err: unknown) => {
      if (disposed) return;
      callbacksRef.current.onStatus("error", err instanceof Error ? err.message : "تعذّر تحميل النموذج");
    };
    if (typeof model === "string") loader.load(model, onLoad, undefined, onError);
    else loader.parse(model, "", onLoad, onError);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh & {
          geometry?: THREE.BufferGeometry;
          material?: THREE.Material | THREE.Material[];
        };
        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        for (const material of materials) {
          const withMaps = material as THREE.Material & Record<string, THREE.Texture | undefined>;
          for (const key of Object.keys(withMaps)) {
            const value = withMaps[key];
            if (value && (value as THREE.Texture).isTexture) (value as THREE.Texture).dispose();
          }
          material.dispose();
        }
      });
      renderer.dispose();
    };
  }, [model, applyLook]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
