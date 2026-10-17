import { useEffect, useState } from "react";

/**
 * PHASE 165 (W8) — التثبيت من داخل التطبيق:
 * المنطق نقي وقابل للاختبار وحده، والربط بالمتصفح في hook واحد.
 * لا يَعِد المتصفح بالتثبيت إلا بحدث beforeinstallprompt — فالصف يظهر حينها
 * فقط؛ وعلى سفاري iOS (لا يملك هذا الحدث أبدًا) يظهر تلميح يدوي بدلًا منه.
 */
export type InstallRowKind = "button" | "ios-hint" | "none";

/** شكل الحدث كما يستعمله المتصفح فعلًا — لا نعتمد على نوع DOM غير معياري. */
export interface InstallPromptEventLike {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

/** سفاري iOS وحده يضيف «إضافة إلى الشاشة الرئيسية» — ورفاقه على iOS لا. */
export function isIoSSafari(userAgent: string): boolean {
  const ios = /iPhone|iPad|iPod/.test(userAgent);
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
  return ios && !otherBrowser && /Safari/.test(userAgent);
}

/** التطبيق يعمل الآن مثبَّتًا؟ (display-mode القياسية أو خاصية سفاري القديمة). */
export function isStandaloneDisplay(
  matchesStandalone: boolean,
  iosStandalone: boolean | undefined,
): boolean {
  return matchesStandalone || iosStandalone === true;
}

/** أي صفٍّ نعرضه في الدرج — قرار واحد نقي يُختبر وحده. */
export function installRowKind(input: {
  canInstall: boolean;
  iosSafari: boolean;
  standalone: boolean;
}): InstallRowKind {
  if (input.standalone) return "none";
  if (input.canInstall) return "button";
  if (input.iosSafari) return "ios-hint";
  return "none";
}

export interface InstallOffer {
  kind: InstallRowKind;
  install: () => Promise<void>;
}

export function useInstallOffer(): InstallOffer {
  const [deferred, setDeferred] = useState<InstallPromptEventLike | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as Event & InstallPromptEventLike);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const standalone =
    typeof window !== "undefined" &&
    isStandaloneDisplay(
      window.matchMedia?.("(display-mode: standalone)")?.matches ?? false,
      (window.navigator as Navigator & { standalone?: boolean }).standalone,
    );

  const kind = installRowKind({
    canInstall: deferred !== null,
    iosSafari: typeof navigator !== "undefined" && isIoSSafari(navigator.userAgent),
    standalone,
  });

  const install = async () => {
    const event = deferred;
    if (!event) return;
    setDeferred(null); // العرض يُستهلك مرة واحدة مهما كانت النتيجة
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      // المتصفح قد يرفض العرض — التطبيق يعمل كاملًا بلا تثبيت
    }
  };

  return { kind, install };
}
