/**
 * PHASE 165 (W8/D-048) — تسجيل القوقعة (service worker) في الإنتاج وحده:
 * التطوير عبر HMR لا يجب أن يُقاصّ بكاش قديم، والاختبار يبني ثم يخدم dist
 * فتسجَّل القوقعة كما ستُشحن للطالب. أي فشل هنا صامت: التطبيق كامل بلا أوفلاين.
 */
export function registerPwa(): void {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const register = (): void => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  };
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
