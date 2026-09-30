import { useCallback, useEffect, useRef, useState } from "react";
import { INK_COLOR, INK_WIDTH, drawStrokes, type InkStroke, type InkTool } from "./ink.js";

/**
 * PHASE 50 — «لوح الحبر»: a transparent drawing surface laid exactly over the
 * printed page.
 *
 * Geometry is the whole contract: the canvas is absolutely positioned inside
 * `.room-sheet`, the same shrink-wrapped box as the page image, so every
 * normalized coordinate means the same pixel on screen and on the composited
 * picture the tutor receives. If the canvas ever covered a larger box than the
 * image (the padded stage, letterboxed), a circle around a line would arrive at
 * the tutor shifted away from that line.
 *
 * The student draws with a finger, a stylus, or a mouse. An eraser removes the
 * strokes it touches — a classroom eraser lifts whole pencil lines, it does not
 * smudge pixels — and clearing or turning the page starts the board fresh,
 * because a mark belongs to the page it was drawn on.
 *
 * The board never sends anything itself: it reports strokes upward, and the
 * room composites page + marks into the picture the tutor sees when the
 * student asks his question.
 */
export default function InkBoard({
  pageKey,
  resetToken,
  onChange,
}: {
  /** Changes when the stage turns — the board starts fresh on a new page. */
  pageKey: string | number;
  /**
   * Bumped by the room after the marks have been sent: the tutor has them now,
   * so the board starts fresh. A token, not a boolean, because two consecutive
   * sends must both clear.
   */
  resetToken: number;
  onChange: (strokes: InkStroke[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<InkTool>("pen");
  const [strokes, setStrokes] = useState<InkStroke[]>([]);
  const drawingRef = useRef<InkStroke | null>(null);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  // A mark belongs to its page: turning the stage clears the board, so a
  // circle drawn on page 5 can never travel to page 6.
  const [lastKey, setLastKey] = useState(pageKey);
  if (pageKey !== lastKey) {
    setLastKey(pageKey);
    setStrokes([]);
    drawingRef.current = null;
  }

  const repaint = useCallback((list: InkStroke[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStrokes(ctx, list, canvas.width, canvas.height);
  }, []);

  const fitCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    // The canvas fills `.room-sheet` by CSS; its pixel buffer follows the
    // sheet's laid-out box (capped by device pixel ratio).
    const box = canvas?.parentElement?.getBoundingClientRect();
    if (!canvas || !box) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(box.width * dpr));
    canvas.height = Math.max(1, Math.round(box.height * dpr));
    repaint(strokesRef.current);
  }, [repaint]);

  useEffect(() => {
    fitCanvas();
    window.addEventListener("resize", fitCanvas);
    return () => window.removeEventListener("resize", fitCanvas);
  }, [fitCanvas, pageKey]);

  useEffect(() => {
    repaint(strokes);
  }, [strokes, pageKey, repaint]);

  // The marks were delivered with the question: start fresh, and tell the room
  // the board is empty so it stops offering to send them again.
  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false;
      return;
    }
    drawingRef.current = null;
    setStrokes([]);
    onChange([]);
  }, [resetToken, onChange]);

  const report = (list: InkStroke[]) => {
    setStrokes(list);
    onChange(list);
  };

  const pointOf = (e: React.PointerEvent): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
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
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    const p = pointOf(e);
    if (tool === "eraser") {
      report(eraseAt(strokesRef.current, p.x, p.y));
      drawingRef.current = { tool: "eraser", color: INK_COLOR, width: INK_WIDTH, points: [p] };
      return;
    }
    drawingRef.current = { tool: "pen", color: INK_COLOR, width: INK_WIDTH, points: [p] };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const active = drawingRef.current;
    if (!active) return;
    e.preventDefault();
    const p = pointOf(e);
    if (active.tool === "eraser") {
      report(eraseAt(strokesRef.current, p.x, p.y));
      active.points = [p];
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

  const count = strokes.length;

  // display:contents — the canvas belongs to `.room-sheet` (the image's exact
  // box) and the toolbar becomes a grid item of `.room-page` beneath it.
  return (
    <div className="ink-board" data-testid="ink-board">
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
        aria-label="لوح الرسم على الصفحة — ارسم بإصبعك لتحدد موضع سؤالك"
      />
      <div className="ink-tools" role="toolbar" aria-label="أدوات الرسم">
        <button
          type="button"
          data-testid="ink-pen"
          className={`btn small ghost${tool === "pen" ? " active" : ""}`}
          aria-pressed={tool === "pen"}
          onClick={() => setTool("pen")}
        >
          ✏️ قلم
        </button>
        <button
          type="button"
          data-testid="ink-eraser"
          className={`btn small ghost${tool === "eraser" ? " active" : ""}`}
          aria-pressed={tool === "eraser"}
          onClick={() => setTool("eraser")}
        >
          🧽 ممحاة
        </button>
        <button
          type="button"
          data-testid="ink-clear"
          className="btn small ghost"
          disabled={count === 0}
          onClick={() => report([])}
        >
          🗑️ مسح الكل
        </button>
        <span className="muted small" data-testid="ink-count" aria-live="polite">
          {count === 0 ? "ارسم على الصفحة لتحدد سؤالك" : `${count} ${count === 1 ? "علامة" : "علامات"} على الصفحة`}
        </span>
      </div>
    </div>
  );
}
