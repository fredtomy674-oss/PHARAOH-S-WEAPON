import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  hint?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  /** سطح مرتفع قليلًا (بطاقة بطل مثلًا) */
  elevated?: boolean;
}

/** سطح المحتوى الأساسي: ورق دافئ + حدود رقيقة + ظل من الرموز. */
export function Card({
  title,
  hint,
  actions,
  footer,
  elevated = false,
  className,
  children,
  ...rest
}: CardProps) {
  const classes = ["ui-card", elevated ? "ui-card--elevated" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes} {...rest}>
      {title || actions ? (
        <header className="ui-card__head">
          <div className="ui-card__titles">
            {title ? <h3 className="ui-card__title">{title}</h3> : null}
            {hint ? <p className="ui-card__hint">{hint}</p> : null}
          </div>
          {actions ? <div className="ui-card__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="ui-card__body">{children}</div>
      {footer ? <footer className="ui-card__foot">{footer}</footer> : null}
    </section>
  );
}
