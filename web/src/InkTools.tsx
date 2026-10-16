import type { InkTool } from "./ink.js";

/**
 * PHASE 56 — the ink toolbar, lifted OUT of the drawing sheet.
 *
 * Measured on the running app: while the toolbar lived inside the sheet, it
 * inflated the sheet 58px wider and 62px taller than the surface, so the
 * drawing canvas covered the toolbar and sat offset from the surface — a mark
 * around a line landed away from that line. Now the surface is its own box and
 * this bar sits under it as a sibling.
 *
 * W2 — the surface is the teacher's board (no page image, so no loading state):
 * the bar answers the question the tools raise — how many marks are on the
 * board.
 */
export default function InkTools({
  tool,
  onTool,
  count,
  onClear,
}: {
  tool: InkTool;
  onTool: (tool: InkTool) => void;
  count: number;
  onClear: () => void;
}) {
  return (
    <div className="ink-tools" role="toolbar" aria-label="أدوات الرسم" data-testid="ink-board">
      <button
        type="button"
        data-testid="ink-pen"
        className={`btn small ghost${tool === "pen" ? " active" : ""}`}
        aria-pressed={tool === "pen"}
        onClick={() => onTool("pen")}
      >
        ✏️ قلم
      </button>
      <button
        type="button"
        data-testid="ink-eraser"
        className={`btn small ghost${tool === "eraser" ? " active" : ""}`}
        aria-pressed={tool === "eraser"}
        onClick={() => onTool("eraser")}
      >
        🧽 ممحاة
      </button>
      <button type="button" data-testid="ink-clear" className="btn small ghost" disabled={count === 0} onClick={onClear}>
        🗑️ مسح الكل
      </button>
      <span className="muted small" data-testid="ink-count" aria-live="polite">
        {count === 0
          ? // PHASE 56 — measured: the longer «لتحدد سؤالك» made this bar 457px
            // wide under a 399px page, so the bar looked like a second, wider
            // page. The bar says what to do; the composer says where it goes.
            "ارسم على السبورة"
          : `${count} ${count === 1 ? "علامة" : "علامات"} على السبورة`}
      </span>
    </div>
  );
}
