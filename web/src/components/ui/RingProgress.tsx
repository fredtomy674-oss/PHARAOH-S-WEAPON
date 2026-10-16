import type { ReactNode } from "react";

export interface RingProgressProps {
  /** نسبة الإتقان من 0 إلى 1 */
  value: number;
  size?: number;
  stroke?: number;
  /** ما يُكتب في القلب (افتراضيًا النسبة) */
  label?: ReactNode;
  caption?: ReactNode;
  className?: string;
}

/** حلقة تقدّم/إتقان — SVG بلا صور (لغة الأشكال الهندسية). */
export function RingProgress({
  value,
  size = 88,
  stroke = 8,
  label,
  caption,
  className,
}: RingProgressProps) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const percent = Math.round(safe * 100);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * safe;
  const classes = ["ui-ring", className ?? ""].filter(Boolean).join(" ");

  return (
    <div className={classes} role="img" aria-label={`${percent}٪`}>
      <div className="ui-ring__figure" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle
            className="ui-ring__track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
          />
          <circle
            className="ui-ring__bar"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <span className="ui-ring__center">{label ?? `${percent}٪`}</span>
      </div>
      {caption ? <span className="ui-ring__caption">{caption}</span> : null}
    </div>
  );
}
