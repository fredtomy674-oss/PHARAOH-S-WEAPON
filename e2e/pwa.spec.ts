import { expect, test } from "@playwright/test";
import { DEMO_STUDENT } from "./helpers.js";

/**
 * PHASE 165 (W8) — PWA على البناء الحقيقي (dist + preview :5175).
 * القوقعة تُسجَّل في الإنتاج فقط؛ هذه السويت الوحيدة التي تراها فعلًا، وبقية
 * السويت تجري على خادم التطوير (HMR بلا كاش) فيبقى سلوكها كما كان بالضبط.
 */
const PWA_PORT = Number(process.env.E2E_PWA_PORT ?? 5175);
const PWA_URL = `http://127.0.0.1:${PWA_PORT}`;

test("PW1 (PHASE 165): the shipped build is installable — manifest, icons, service worker, offline shell", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(PWA_URL + "/", { waitUntil: "domcontentloaded" });

  // المانيفست معلَن في الرأس ويُخدَم ملفًا صحيحًا.
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  const manifest = await (
    await page.request.get(PWA_URL + "/manifest.webmanifest")
  ).json();
  expect(manifest.name).toContain("سلاح الفرعون");
  expect(manifest.display).toBe("standalone");
  expect(manifest.lang).toBe("ar");
  expect(manifest.dir).toBe("rtl");
  expect(manifest.start_url).toBe("/");
  expect(manifest.icons.map((icon: { src: string }) => icon.src)).toEqual(
    expect.arrayContaining([
      "/icons/icon-192.png",
      "/icons/icon-512.png",
      "/icons/icon-maskable-512.png",
    ]),
  );
  expect(
    manifest.icons.some((icon: { purpose?: string }) => icon.purpose === "maskable"),
  ).toBe(true);

  // الأيقونات المعلنة تُخدَم فعلًا كـPNG (وهي شرط قابلية التثبيت في المتصفحات).
  for (const src of [
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/icons/icon-maskable-512.png",
    "/icons/apple-touch-icon.png",
  ]) {
    const response = await page.request.get(PWA_URL + src);
    expect(response.status(), src).toBe(200);
    expect(response.headers()["content-type"], src).toContain("image/png");
  }

  // القوقعة تُسجَّل وتنشط وتسيطر بلا إعادة تحميل (skipWaiting + clients.claim).
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          navigator.serviceWorker
            .getRegistration()
            .then((registration) =>
              registration && registration.active ? registration.scope : "",
            ),
        ),
      { timeout: 30_000, message: "service worker activates" },
    )
    .toContain(String(PWA_PORT));
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), {
      timeout: 30_000,
    })
    .toBe(true);

  // بلا شبكة — من الزيارة الأولى نفسها: التنقّل يعود إلى index.html من الكاش،
  // وأصول المدخل (JS/CSS) سبق أن جمعها install من index نفسه — فالقوقعة كاملة.
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("tab-login")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--bg").trim(),
      ),
    )
    .not.toBe("");
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(false);
  await context.close();
});

test("PW2 (PHASE 165): when the browser offers installation, the drawer carries the offer — taking it consumes it", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(PWA_URL + "/", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("input-email")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("input-email").fill(DEMO_STUDENT.email);
  await page.getByTestId("input-password").fill(DEMO_STUDENT.password);
  await page.getByTestId("submit-auth").click();
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });

  // بلا عرض من المتصفح لا يوجد صف أصلًا (لا وعد كاذب للمستخدم).
  await page.getByTestId("account-menu").click();
  await expect(page.getByTestId("account-close")).toBeVisible();
  await expect(page.getByTestId("install-app")).toHaveCount(0);

  // عرضٌ حقيقي الشكل — beforeinstallprompt لا يُطلَق في متصفح آلي فتُحاكى بنيته.
  await page.evaluate(() => {
    const probe = window as unknown as { __promptCalls: number };
    probe.__promptCalls = 0;
    const event = Object.assign(new Event("beforeinstallprompt"), {
      prompt: () => {
        probe.__promptCalls += 1;
        return Promise.resolve();
      },
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(event);
  });
  await expect(page.getByTestId("install-app")).toBeVisible();
  await page.getByTestId("install-app").click();
  await expect(page.getByTestId("install-app")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => (window as unknown as { __promptCalls: number }).__promptCalls,
    ),
  ).toBe(1);
  await context.close();
});
