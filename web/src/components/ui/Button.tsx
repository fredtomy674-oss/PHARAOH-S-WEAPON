import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "ghost" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** أساسي (ذهبي) · شبحي (سطح + حدود) · هادئ (نص فقط) */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** يمتد بعرض الحاوية */
  block?: boolean;
  icon?: ReactNode;
}

/**
 * زر الهوية: الذهبي أساسي بنص داكن (٨.٩:١) — بلا ألوان خارج العائلة.
 * هدف اللمس ≥ ٤٤px في المقاس العادي.
 */
export function Button({
  variant = "primary",
  size = "md",
  block = false,
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = [
    "ui-btn",
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    block ? "ui-btn--block" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...rest}>
      {icon ? (
        <span className="ui-btn__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="ui-btn__label">{children}</span>
    </button>
  );
}
