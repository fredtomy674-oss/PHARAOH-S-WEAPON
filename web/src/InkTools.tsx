import type { InkTool } from "./ink.js";

/**
 * PHASE 56 — the ink toolbar, lifted OUT of `.room-sheet`.
 *
 * Measured on the running app: while the toolbar lived inside the sheet, it
 * inflated the sheet 58px wider and 62px taller than the page image, so the
 * drawing canvas covered the toolbar and sat offset from the printed page —
 * a mark around a line landed away from that line. Now the sheet is the
 * image's box and nothing else, and this bar sits under it as a sibling.
 *
 * The bar answers the question the tools raise: how many marks are on the
 * page, and whether drawing is possible yet.
 */
export default function InkTools({
  tool,
  onTool,
  count,
  ready,
  onClear,
}: {
  tool: InkTool;
  onTool: (tool: InkTool) => void;
  count: number;
  ready: boolean;
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
        {!ready
          ? "جارٍ تحميل الصفحة…"
          : count === 0
            ? // PHASE 56 — measured: the longer «لتحدد سؤالك» made this bar 457px
              // wide under a 399px page, so the bar looked like a second, wider
              // page. The bar says what to do; the composer says where it goes.
              "ارسم على الصفحة"
            : `${count} ${count === 1 ? "علامة" : "علامات"} على الصفحة`}
      </span>
    </div>
  );
}
