/**
 * PHASE 50 — «لوح الحبر» — W2: the surface is the teacher's BOARD now.
 *
 * The student draws on the board with a finger, and his marks travel with his
 * question as one picture. (Until W2 the surface was the printed page itself;
 * the book is never shown any more — الأطلس §١٥ «المرجع لا النسخ» — so the
 * board is the honest place for a student's marks.)
 *
 * The vocabulary is deliberately small — a mark is a mark:
 *
 *   • `InkStroke` is one finger-down-to-up gesture: a tool, a colour, a width
 *     (all in CSS pixels at drawing time) and the points of the path, stored in
 *     *normalized* coordinates (0..1 of the board) so a stroke drawn on a phone
 *     replays exactly on a desktop and on the composited picture we send;
 *   • `drawStrokes` replays strokes on any 2D context at any pixel size — the
 *     overlay canvas on screen and the export canvas use the same function, so
 *     what the student sees is what the tutor gets;
 *   • `composeInkBoard` paints the board surface with the marks over it and
 *     returns a JPEG data-URL capped in width, because the raw board plus
 *     strokes would make every marked question a multi-megabyte upload.
 *
 * No dependencies, no colour picker, no brush engine: a student drawing his
 * question needs one honest pen, not Photoshop.
 */

export type InkTool = "pen" | "eraser";

export interface InkPoint {
  /** 0..1 across the page. */
  x: number;
  /** 0..1 down the page. */
  y: number;
}

export interface InkStroke {
  tool: InkTool;
  color: string;
  /**
   * PHASE 56 — a FRACTION of the page width, not CSS pixels.
   *
   * The pen is one physical instrument: the line the student drew on a 400-px
   * page must be the same visible thickness on a 620-px page and on the
   * 1100-px picture the tutor reads. A width in CSS pixels can only be
   * right at one size — the old code multiplied it by the target's device
   * width, so every replay drew a line thousands of pixels wide: one red
   * stroke covered the whole printed page, on screen and in the export.
   * A fraction replays identically at any size, so the overlay and the
   * exported picture agree by construction (PHASE 50's promise).
   */
  width: number;
  points: InkPoint[];
}

/** The one honest pen: a warm red that reads on the board in both themes. */
export const INK_COLOR = "#d92626";
/** A fingertip-wide line, in CSS pixels on the board the student sees. */
export const INK_WIDTH_CSS = 5;
/** How far the eraser reaches, as a fraction of the board width. */
export const ERASER_RADIUS = 0.03;

/** The stored width for a pen on a board laid out `boardCssWidth` wide. */
export function inkWidthFor(boardCssWidth: number): number {
  if (!(boardCssWidth > 0)) return 0;
  return INK_WIDTH_CSS / boardCssWidth;
}

/** A stroke with fewer than two points is a tap, not a mark — keep it anyway. */
export function isDrawable(stroke: InkStroke): boolean {
  return stroke.points.length > 0;
}

function strokeStyle(ctx: CanvasRenderingContext2D, stroke: InkStroke, pageWidth: number): void {
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = Math.max(1, stroke.width * pageWidth);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

/**
 * Replay strokes onto a context sized `width`×`height` device pixels. One
 * implementation for the screen overlay and the exported picture — if these two
 * ever disagree, the student points at one thing and the tutor sees another.
 */
export function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: InkStroke[],
  width: number,
  height: number,
): void {
  ctx.save();
  for (const stroke of strokes) {
    if (!isDrawable(stroke)) continue;
    // PHASE 56 — the eraser is a SPONGE, not a white pen: painting the surface
    // white with a board-wide stroke looked like a red/white flash and read as
    // a bug. It draws its own reach as a ring, so the student sees the
    // footprint they are about to lift, and it never persists (an eraser
    // gesture removes strokes, it does not add one). The ring is a neutral grey
    // because the board itself is light in the day theme and dark at night.
    if (stroke.tool === "eraser") {
      const r = ERASER_RADIUS * width;
      for (const p of stroke.points) {
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(130, 130, 130, 0.85)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      continue;
    }
    strokeStyle(ctx, stroke, width);
    ctx.beginPath();
    const [first, ...rest] = stroke.points;
    ctx.moveTo(first!.x * width, first!.y * height);
    // A lone tap still leaves a dot: the student touched *here*.
    if (rest.length === 0) ctx.lineTo(first!.x * width + 0.5, first!.y * height + 0.5);
    for (const p of rest) ctx.lineTo(p.x * width, p.y * height);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * The board's frame on screen (CSS `aspect-ratio: 4 / 3`). The export keeps
 * the same frame, so a circle the student drew is a circle in the picture the
 * tutor reads — the overlay and the export agree by construction.
 */
export const BOARD_ASPECT = 4 / 3;

export interface ComposedInk {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Paint the board surface with the student's marks over it. The export is a
 * JPEG at most `maxWidth` wide — a marked board must travel like a photo, not
 * like a print file.
 *
 * `surface` is the board's own colour as the student sees it (the board
 * follows the room's theme, and the room reads it off the live element);
 * whiteboard white is the honest fallback.
 */
export async function composeInkBoard(
  strokes: InkStroke[],
  surface = "#ffffff",
  maxWidth = 1100,
): Promise<ComposedInk> {
  const width = Math.max(1, Math.round(maxWidth));
  const height = Math.max(1, Math.round(width / BOARD_ASPECT));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذر تجهيز السبورة للرسم");
  ctx.fillStyle = surface;
  ctx.fillRect(0, 0, width, height);
  // Normalized coordinates replay 1:1 at any size — the overlay and the export
  // agree by construction.
  drawStrokes(ctx, strokes, width, height);
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.82), width, height };
}
