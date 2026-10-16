import type { ReactNode } from "react";
import { Button } from "./Button.js";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  note?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionTestId?: string;
  className?: string;
}

/** حالة فراغ مصمّمة: رمز + جملة + زر واحد (خطة W0 — بلا صورة معقدة). */
export function EmptyState({
  icon,
  title,
  note,
  actionLabel,
  onAction,
  actionTestId,
  className,
}: EmptyStateProps) {
  const classes = ["ui-empty", className ?? ""].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      {icon ? <span className="ui-empty__icon" aria-hidden="true">{icon}</span> : null}
      <p className="ui-empty__title">{title}</p>
      {note ? <p className="ui-empty__note">{note}</p> : null}
      {actionLabel && onAction ? (
        <Button variant="primary" size="sm" onClick={onAction} data-testid={actionTestId}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
