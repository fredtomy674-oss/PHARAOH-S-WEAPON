import { useSyncExternalStore } from "react";

/**
 * المظهر: حرية الطالب (قرار المالك 2026-10-16).
 * - الافتراضي: «حسب جهازي» (system) — يتبع prefers-color-scheme.
 * - الطالب يستطيع تثبيت ليلي أو نهاري، ويُحفظ اختياره محليًا.
 * - لا يلمس أي بيانات: قيمة نصية واحدة في localStorage.
 */
export type ThemeChoice = "light" | "dark" | "system";
export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "alfarouq_theme";

const listeners = new Set<() => void>();

function prefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** ما اختاره الطالب فعلًا (افتراضيًا: system). */
export function readChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* وضع خاص / تخزين مغلق */
  }
  return "system";
}

/** الوضع الفعلي المعروض الآن. */
export function resolveMode(choice: ThemeChoice): ThemeMode {
  if (choice === "system") return prefersDark() ? "dark" : "light";
  return choice;
}

function writeDom(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", mode);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", mode === "dark" ? "#0A0908" : "#F7F3EB");
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

/** يثبّت اختيارًا (light | dark | system) ويحفظه. */
export function setThemeChoice(choice: ThemeChoice): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    /* تجاهل — التطبيق يعمل بلا حفظ */
  }
  writeDom(resolveMode(choice));
  notify();
}

/** يعكس اختيار الطالب بين الوضعين (زرّ التبديل السريع). */
export function toggleTheme(): void {
  setThemeChoice(resolveMode(readChoice()) === "dark" ? "light" : "dark");
}

/** يُنادى مرة واحدة عند إقلاع التطبيق. */
export function initTheme(): void {
  writeDom(resolveMode(readChoice()));
  if (typeof window === "undefined" || !window.matchMedia) return;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = (): void => {
    if (readChoice() === "system") {
      writeDom(resolveMode("system"));
      notify();
    }
  };
  if (typeof media.addEventListener === "function") media.addEventListener("change", onChange);
  else if (typeof media.addListener === "function") media.addListener(onChange);
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/** حالة المظهر داخل React. */
export function useTheme(): {
  choice: ThemeChoice;
  mode: ThemeMode;
  setChoice: (choice: ThemeChoice) => void;
} {
  const choice = useSyncExternalStore(subscribe, readChoice, () => "system" as ThemeChoice);
  return { choice, mode: resolveMode(choice), setChoice: setThemeChoice };
}
