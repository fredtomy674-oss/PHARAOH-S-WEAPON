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

/** The one honest pen: a warm red that reads on white paper and on figures. */
export const INK_COLOR = "#d92626";
/** A fingertip-wide line, in CSS pixels on the page the student sees. */
export const INK_WIDTH_CSS = 5;
/** How far the eraser reaches, as a fraction of the page width. */
export const ERASER_RADIUS = 0.03;

/** The stored width for a pen on a page laid out `pageCssWidth` wide. */
export function inkWidthFor(pageCssWidth: number): number {
  if (!(pageCssWidth > 0)) return 0;
  return INK_WIDTH_CSS / pageCssWidth;
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
    // PHASE 56 — the eraser is a SPONGE, not a white pen: painting the page
    // white with a page-wide stroke looked like a red/white flash and read as
    // a bug. It draws its own reach as a ring, so the student sees the
    // footprint they are about to lift, and it never persists (an eraser
    // gesture removes strokes, it does not add one).
    if (stroke.tool === "eraser") {
      const r = ERASER_RADIUS * width;
      for (const p of stroke.points) {
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(22, 32, 46, 0.55)";
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
