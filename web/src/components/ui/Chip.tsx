import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ChipTone = "soft" | "outline" | "gold";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ChipTone;
  icon?: ReactNode;
}

/**
 * شريحة صغيرة (وسم/فلتر/معلومة).
 * بلا onClick تُعرض كعنصر ساكن غير قابل للتركيز.
 */
export function Chip({ tone = "soft", icon, className, children, onClick, type = "button", ...rest }: ChipProps) {
  const classes = ["ui-chip", `ui-chip--${tone}`, onClick ? "ui-chip--action" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  if (!onClick) {
    return (
      <span className={classes}>
        {icon ? <span className="ui-chip__icon" aria-hidden="true">{icon}</span> : null}
        {children}
      </span>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} {...rest}>
      {icon ? <span className="ui-chip__icon" aria-hidden="true">{icon}</span> : null}
      {children}
    </button>
  );
}
