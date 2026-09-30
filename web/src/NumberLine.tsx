import { useCallback, useEffect, useRef, useState } from "react";

/**
 * PHASE 51 — «خط الأعداد»: the tutor's line, drawn inside its own reply, with
 * a pin the student drags.
 *
 * The room owns the geometry and nothing else: ticks from `step`, the pin
 * snapped to the line's own step (the same rule the server verifies by, so a
 * pin the room calls 7 the tutor also calls 7), and the value reported upward
 * for verification. The correct position never reaches this component — the
 * exercise keeps its key.
 */

export interface NumberLineView {
  kind: "numberline";
  from: number;
  to: number;
  step: number;
  markers?: Array<{ value: number; label?: string }>;
  question?: string;
}

function formatTick(n: number): string {
  // Binary steps (0.1) print dust without this; Egyptian textbooks print 0.3.
  return String(Math.round(n * 1e6) / 1e6);
}

export default function NumberLine({
  line,
  onVerify,
  verifying,
}: {
  line: NumberLineView;
  onVerify: (value: number) => void;
  verifying: boolean;
}) {
  const span = line.to - line.from;
  const [pin, setPin] = useState(line.from);
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);

  // A new line starts the pin back at its beginning — a leftover pin from the
  // previous exercise would answer a question nobody asked.
  const key = `${line.from}:${line.to}:${line.step}`;
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setPin(line.from);
  }

  const snap = useCallback(
    (value: number): number => {
      const n = Math.round((value - line.from) / line.step);
      const clamped = Math.min(Math.max(n, 0), Math.round(span / line.step));
      return Math.round((line.from + clamped * line.step) * 1e6) / 1e6;
    },
    [line.from, line.step, span],
  );

  // Plot area: ticks are inset by half a step so the end ticks stay visible.
  const PAD = 28;
  const W = 640;
  const H = 118;
  const xOf = useCallback(
    (value: number): number => PAD + ((value - line.from) / span) * (W - PAD * 2),
    [line.from, span],
  );
  const valueOf = useCallback(
    (x: number): number => line.from + ((x - PAD) / (W - PAD * 2)) * span,
    [line.from, span],
  );

  const tickCount = Math.round(span / line.step);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => line.from + i * line.step);
  // Crowded lines label every nth tick — a wall of overlapping digits helps no one.
  const labelEvery = Math.max(1, Math.ceil(ticks.length / 11));

  const pointOf = (clientX: number): number => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * W;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // Focusing here (not relying on the click) is what lets the keyboard move
    // the pin right after a drag — pointerdown's own default would not focus.
    (e.currentTarget as SVGGElement).focus();
    draggingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setPin(snap(valueOf(pointOf(e.clientX))));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    setPin(snap(valueOf(pointOf(e.clientX))));
  };
  const endDrag = () => {
    draggingRef.current = false;
  };

  const moveByStep = (delta: number) => {
    // Keyboard parity with dragging — and what the end-to-end test drives.
    setPin((p) => snap(p + delta * line.step));
  };

  useEffect(() => {
    if (!draggingRef.current) return;
    const up = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  return (
    <div className="numberline" data-testid="numberline">
      {line.question && (
        <p className="numberline-question" data-testid="numberline-question">
          📏 {line.question}
        </p>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="numberline-svg"
        role="group"
        aria-label={`خط أعداد من ${formatTick(line.from)} إلى ${formatTick(line.to)}`}
      >
        <line x1={PAD} y1={58} x2={W - PAD} y2={58} className="nl-axis" />
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={xOf(t)} y1={52} x2={xOf(t)} y2={64} className="nl-tick" />
            {i % labelEvery === 0 && (
              <text x={xOf(t)} y={84} textAnchor="middle" className="nl-label">
                {formatTick(t)}
              </text>
            )}
          </g>
        ))}
        {(line.markers ?? []).map((m, i) => (
          <g key={i}>
            <circle cx={xOf(m.value)} cy={58} r={5} className="nl-marker" />
            {m.label && (
              <text x={xOf(m.value)} y={38} textAnchor="middle" className="nl-marker-label">
                {m.label}
              </text>
            )}
          </g>
        ))}
        {/* The student's pin: a slider by role, so keyboards and assistive tech move it too. */}
        <g
          data-testid="nl-pin"
          role="slider"
          tabIndex={0}
          aria-label="دبوسك على خط الأعداد"
          aria-valuemin={line.from}
          aria-valuemax={line.to}
          aria-valuenow={pin}
          aria-valuetext={formatTick(pin)}
          transform={`translate(${xOf(pin)} 58)`}
          className="nl-pin"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              e.preventDefault();
              moveByStep(1);
            } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              e.preventDefault();
              moveByStep(-1);
            } else if (e.key === "Home") {
              e.preventDefault();
              setPin(line.from);
            } else if (e.key === "End") {
              e.preventDefault();
              setPin(line.to);
            }
          }}
          style={{ touchAction: "none", cursor: "grab" }}
        >
          <line y1={-26} y2={-8} className="nl-pin-stem" />
          <circle r={11} className="nl-pin-head" />
          <text y={5} textAnchor="middle" className="nl-pin-value">
            {formatTick(pin)}
          </text>
        </g>
      </svg>
      <div className="numberline-actions">
        <span className="muted small" data-testid="nl-value" aria-live="polite">
          دبوسك عند {formatTick(pin)}
        </span>
        <button
          type="button"
          data-testid="nl-verify"
          className="btn small primary"
          disabled={verifying}
          onClick={() => onVerify(pin)}
        >
          {verifying ? "المعلّم يتحقق…" : "تحقق من موضع الدبوس"}
        </button>
      </div>
    </div>
  );
}
