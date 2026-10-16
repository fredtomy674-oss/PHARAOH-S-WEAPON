import { useCallback, useEffect, useRef } from "react";
import { drawStrokes, inkWidthFor, INK_COLOR, type InkStroke, type InkTool } from "./ink.js";

/**
 * PHASE 50 — «لوح الحبر» — W2: the transparent drawing surface of the teacher's
 * board.
 *
 * PHASE 56 — three defects, all measured on the running app, all fixed by
 * construction here:
 *
 * 1. The canvas sized itself from `parentElement`, and its parent carries
 *    `display: contents` — an element with no box. `getBoundingClientRect()`
 *    returned 0×0, so the pixel buffer became 1×1 (the `Math.max(1, …)` floor
 *    hid the failure) and the browser stretched ONE red pixel across the whole
 *    surface: «شاشة حمراء بكامل صفحة الكتاب». It now measures ITS OWN box, which
 *    is the surface the student actually points at.
 * 2. The pen width was multiplied by the target's device width, so a stroke
 *    covered the entire surface (see `inkWidthFor`). Widths are now a fraction
 *    of the board, so screen and export agree.
 * 3. The toolbar used to live INSIDE the drawing sheet, inflating it 58px wider
 *    and 62px taller than the surface. The toolbar is now a sibling of the
 *    surface (see `InkTools`), so the canvas is the surface's box and nothing
 *    else.
 *
 * W2 — the surface is the board itself (a fixed 4:3 frame), so there is no
 * image to wait for and no `ready` gate: the canvas refits through a
 * ResizeObserver on every layout change, and `composeInkBoard` exports the
 * marks over the board's own colour.
 *
 * The board never sends anything itself: it reports strokes upward, and the
 * room composites board + marks into the picture the tutor sees.
 */
export default function InkBoard({
  resetToken,
  strokes,
  tool,
  onChange,
}: {
  /**
   * Bumped by the room after the marks have been sent: the tutor has them now,
   * so the board starts fresh. A token, not a boolean, because two consecutive
   * sends must both clear.
   */
  resetToken: number;
  /** Controlled by the room (it owns the marks it has to send). */
  strokes: InkStroke[];
  tool: InkTool;
  onChange: (strokes: InkStroke[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef<InkStroke | null>(null);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const toolRef = useRef(tool);
  toolRef.current = tool;

  const repaint = useCallback((list: InkStroke[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStrokes(ctx, list, canvas.width, canvas.height);
  }, []);

  const fitCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // PHASE 56 — the canvas fills its surface box by CSS, so the canvas
    // measures ITSELF: no box-less ancestor can hand it a 0×0 rect and
    // collapse the buffer.
    const box = canvas.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return; // not laid out yet — keep the old buffer
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const nextWidth = Math.round(box.width * dpr);
    const nextHeight = Math.round(box.height * dpr);
    if (canvas.width === nextWidth && canvas.height === nextHeight) return;
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    repaint(strokesRef.current);
  }, [repaint]);

  useEffect(() => {
    fitCanvas();
    // W2 — the board's box changes with the layout (fonts, viewport, the grid
    // reflowing): a ResizeObserver refits the pixel buffer on every change, so
    // there is no image to wait for and no `ready` gate to miss a first mark.
    const canvas = canvasRef.current;
    const observer = canvas && typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => fitCanvas()) : null;
    if (canvas && observer) observer.observe(canvas);
    window.addEventListener("resize", fitCanvas);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", fitCanvas);
    };
  }, [fitCanvas]);

  useEffect(() => {
    repaint(strokes);
  }, [strokes, repaint]);

  // The marks were delivered with the question: start fresh, and tell the room
  // the board is empty so it stops offering to send them again.
  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false;
      return;
    }
    drawingRef.current = null;
    onChange([]);
  }, [resetToken, onChange]);

  const pointOf = (e: React.PointerEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    // Before the board lays out, the canvas is zero-sized: there is nothing to
    // point at yet, so the gesture is dropped instead of recording NaN
    // coordinates.
    if (rect.width < 1 || rect.height < 1) return null;
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  /** The eraser lifts whole strokes: anything within a fingertip of the path goes. */
  const eraseAt = (list: InkStroke[], x: number, y: number): InkStroke[] => {
    const radius = 0.03;
    return list.filter((s) => !s.points.some((p) => Math.hypot(p.x - x, p.y - y) < radius));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // PHASE 56 — no `ready` gate on the gesture. Measured on the running app:
    // `ready` (React state fed by an image's load event) could still be false
    // one frame after the canvas already had its final box, and the gate
    // swallowed the student's first mark without a trace. The real requirement
    // is geometric — a box to point at — and `pointOf` enforces it.
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    const p = pointOf(e);
    if (!p) return;
    const canvas = canvasRef.current!;
    // The width is stored as a fraction of the board, taken from the board the
    // student is actually looking at.
    const width = inkWidthFor(canvas.getBoundingClientRect().width);
    if (toolRef.current === "eraser") {
      drawingRef.current = { tool: "eraser", color: INK_COLOR, width, points: [p] };
      report(eraseAt(strokesRef.current, p.x, p.y));
      return;
    }
    drawingRef.current = { tool: "pen", color: INK_COLOR, width, points: [p] };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const active = drawingRef.current;
    if (!active) return;
    e.preventDefault();
    const p = pointOf(e);
    if (!p) return;
    if (active.tool === "eraser") {
      report(eraseAt(strokesRef.current, p.x, p.y));
      active.points = [p];
      repaint([...strokesRef.current, active]);
      return;
    }
    active.points.push(p);
    repaint([...strokesRef.current, active]);
  };

  const endStroke = () => {
    const active = drawingRef.current;
    drawingRef.current = null;
    if (!active || active.tool === "eraser") return;
    if (active.points.length === 0) return;
    report([...strokesRef.current, active]);
  };

  const report = (list: InkStroke[]) => {
    strokesRef.current = list;
    onChange(list);
  };

  return (
    <canvas
      ref={canvasRef}
      className="ink-canvas"
      data-testid="ink-canvas"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endStroke}
      onPointerCancel={() => {
        drawingRef.current = null;
      }}
      aria-label="سبورة الرسم — ارسم بإصبعك واكتب سؤالك"
    />
  );
}
