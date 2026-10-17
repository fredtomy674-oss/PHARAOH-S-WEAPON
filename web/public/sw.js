/* PHASE 165 (W8/D-048) — قوقعة أوفلاين يدوية بلا مكتبات.
   القواعد الثلاث:
   1) /api/** شبكة فقط — لا يُكتب أي ردّ API في الكاش أبدًا (بيانات الطالب مقدّسة).
   2) التنقّل: الشبكة أولًا، وعند التعذّر index.html من الكاش (القوقعة تُفتح بلا شبكة).
   3) الأصول الثابتة (بنية البناء المُهشَّرة + الخطوط + الأيقونات): الكاش أولًا مع
      تحديث خلفي — فالتحديث يصل ولو بعد طلب واحد.
   تغيير النسخة = تغيير CACHE — والقديم يُحذف في activate. */
const CACHE = "pharaoh-shell-v1";
const PRECACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  /* الخطوط كلها محلية وOFL — فالقوقعة الأوفلاين تعرض النص بهوية المنتج لا بخط النظام. */
  "/fonts/Cairo-Variable.ttf",
  "/fonts/IBMPlexSansArabic-Regular.ttf",
  "/fonts/IBMPlexSansArabic-Medium.ttf",
  "/fonts/IBMPlexSansArabic-SemiBold.ttf",
  "/fonts/IBMPlexSansArabic-Bold.ttf",
  "/fonts/SpaceGrotesk-Variable.ttf",
];

/** أصول المدخل المبنية (JS/CSS/الخطوط المسبقة) — تُشتق من index.html نفسه،
    فلا قائمة أسماء مُهشَّرة تُصان يدويًا، والقوقعة تصلح إعادةَ التحميل
    الأوفلاين من الزيارة الأولى لا من الثانية. */
function entryAssets(html) {
  return [...html.matchAll(/(?:src|href)="(\/(?:assets|fonts)\/[^"]+)"/g)].map(
    (match) => match[1],
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await cache.addAll(PRECACHE);
      try {
        const html = await (await fetch("/index.html", { cache: "reload" })).text();
        await cache.addAll(entryAssets(html));
      } catch {
        /* أصول المدخل قدرٌ زائد: القوقعة الأساسية وحدها تكفي للتثبيت. */
      }
      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // الشبكة وحدها — لا كاش لبيانات الطالب

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() =>
          caches
            .match("/index.html", { ignoreVary: true })
            .then((cached) => cached || Response.error()),
        ),
    );
    return;
  }

  /* ignoreVary مقصودة: خادم المعاينة (وخوادم الإنتاج) يضع Vary: Origin على
     الأصول، وطلب الـinstall يحمل Origin بينما طلب الصفحة لا يحمله — فيفشل
     القصّ بلا هذه الراية. أصولنا ثابتة بالمسار (مُهشَّرة) فالسلامة بالمسار. */
  event.respondWith(
    caches.match(request, { ignoreVary: true }).then((cached) => {
      const fromNetwork = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fromNetwork;
    }),
  );
});
