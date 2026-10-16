import type { ReactNode } from "react";

export interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** رقم ومعناه — للرئيسية ومركز ولي الأمر. */
export function StatTile({ label, value, hint, icon, className }: StatTileProps) {
  const classes = ["ui-stat", className ?? ""].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      {icon ? <span className="ui-stat__icon" aria-hidden="true">{icon}</span> : null}
      <span className="ui-stat__value">{value}</span>
      <span className="ui-stat__label">{label}</span>
      {hint ? <span className="ui-stat__hint">{hint}</span> : null}
    </div>
  );
}
