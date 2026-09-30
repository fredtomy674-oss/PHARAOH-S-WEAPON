/**
 * PHASE 50 — «لوح الحبر»: the student draws on the printed page with a finger.
 *
 * The vocabulary is deliberately small — a mark is a mark:
 *
 *   • `InkStroke` is one finger-down-to-up gesture: a tool, a colour, a width
 *     (all in CSS pixels at drawing time) and the points of the path, stored in
 *     *normalized* coordinates (0..1 of the page) so a stroke drawn on a phone
 *     replays exactly on a desktop and on the composited picture we send;
 *   • `drawStrokes` replays strokes on any 2D context at any pixel size — the
 *     overlay canvas on screen and the export canvas use the same function, so
 *     what the student sees is what the tutor gets;
 *   • `composeInkPage` paints the printed page with the marks over it and
 *     returns a JPEG data-URL capped in width, because the raw 1500-px page plus
 *     strokes would make every marked question a multi-megabyte upload.
 *
 * No dependencies, no colour picker, no brush engine: a student pointing at a
 * line needs one honest pen, not Photoshop.
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
  /** CSS pixels at drawing time; scaled by the replay target. */
  width: number;
  points: InkPoint[];
}

/** The one honest pen: a warm red that reads on white paper and on figures. */
export const INK_COLOR = "#d92626";
/** A fingertip-wide line on a phone, scaled up with the page. */
export const INK_WIDTH = 5;

/** A stroke with fewer than two points is a tap, not a mark — keep it anyway. */
export function isDrawable(stroke: InkStroke): boolean {
  return stroke.points.length > 0;
}

function strokeStyle(ctx: CanvasRenderingContext2D, stroke: InkStroke, scale: number): void {
  ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;
  ctx.lineWidth = Math.max(1, stroke.width * scale);
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

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Same-origin page: no CORS taint, so the canvas stays exportable.
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("تعذر تحميل صفحة الكتاب"));
    img.src = url;
  });
}

export interface ComposedInk {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Paint the printed page with the student's marks over it. The export is a
 * JPEG at most `maxWidth` wide — a marked question must travel like a photo,
 * not like a print file. Throws when the page itself cannot be loaded: sending
 * marks without their page would show the tutor a finger pointing at nothing.
 */
export async function composeInkPage(
  pageUrl: string,
  strokes: InkStroke[],
  maxWidth = 1100,
): Promise<ComposedInk> {
  const img = await loadImage(pageUrl);
  const scale = Math.min(1, maxWidth / img.naturalWidth);
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذر تجهيز الصفحة للرسم");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  // Normalized coordinates replay 1:1 at any size — the overlay and the export
  // agree by construction.
  drawStrokes(ctx, strokes, width, height);
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.82), width, height };
}
