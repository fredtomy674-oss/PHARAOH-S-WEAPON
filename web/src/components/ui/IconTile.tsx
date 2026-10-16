import type { ReactNode } from "react";

/** درجات دافئة داخل عائلة الهوية — لا لون خارجها. */
export type TileTone = "gold" | "deep" | "sage" | "paper" | "night";

export interface IconTileProps {
  tone?: TileTone;
  size?: "md" | "lg";
  children: ReactNode;
  className?: string;
  /** وصف نصي بديل عن الرمز (للوصول) */
  label?: string;
}

/** مربع رمزي بزوايا ناعمة — أساس بطاقات المواد والمصادر. */
export function IconTile({ tone = "gold", size = "md", children, className, label }: IconTileProps) {
  const classes = ["ui-tile", `ui-tile--${tone}`, `ui-tile--${size}`, className ?? ""]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={classes} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {children}
    </span>
  );
}
