import { useEffect, useRef, type ReactNode } from "react";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** لوحة سفلية (Sheet) — للاختيارات السريعة وأدوات السبورة. */
export function Sheet({ open, onClose, title, children, footer, className }: SheetProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const classes = ["ui-sheet__panel", className ?? ""].filter(Boolean).join(" ");

  return (
    <div className="ui-sheet" role="presentation" onClick={onClose}>
      <div
        className={classes}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
        ref={panelRef}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="ui-sheet__grip" aria-hidden="true" />
        {title ? <h3 className="ui-sheet__title">{title}</h3> : null}
        <div className="ui-sheet__body">{children}</div>
        {footer ? <div className="ui-sheet__foot">{footer}</div> : null}
      </div>
    </div>
  );
}
