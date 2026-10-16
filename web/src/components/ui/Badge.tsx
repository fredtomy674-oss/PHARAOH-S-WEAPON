import type { ReactNode } from "react";

export type BadgeTone = "gold" | "ok" | "warn" | "danger" | "muted";

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

/** وسم حالة صغير — الدلالة من النص والرمز لا من لون دخيل. */
export function Badge({ tone = "gold", children, className }: BadgeProps) {
  const classes = ["ui-badge", `ui-badge--${tone}`, className ?? ""].filter(Boolean).join(" ");
  return <span className={classes}>{children}</span>;
}
