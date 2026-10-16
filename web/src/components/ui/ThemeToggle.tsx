import { useTheme } from "../../theme.js";

export interface ThemeToggleProps {
  className?: string;
  testId?: string;
}

/**
 * حرية الطالب: تبديل فوري بين الليلي والنهاري (يُحفظ محليًا).
 * الرمز يعرض «إلى أين ستذهب» لا «أين أنت».
 */
export function ThemeToggle({ className, testId = "theme-toggle" }: ThemeToggleProps) {
  const { mode, setChoice } = useTheme();
  const goingDark = mode !== "dark";
  const label = goingDark ? "التبديل إلى الوضع الليلي" : "التبديل إلى الوضع النهاري";
  const classes = ["ui-theme-toggle", className ?? ""].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={classes}
      data-testid={testId}
      aria-label={label}
      title={label}
      onClick={() => setChoice(goingDark ? "dark" : "light")}
    >
      {goingDark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 14.6A8.6 8.6 0 019.4 4 8.6 8.6 0 1020 14.6z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.1" />
          <path d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5" />
        </svg>
      )}
    </button>
  );
}
