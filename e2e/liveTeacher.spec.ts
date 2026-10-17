import { expect, test } from "@playwright/test";
import { login, openAccount, sendChatMessage, startFirstLesson, WIDGET_PIN_OK } from "./helpers.js";

/**
 * PHASE 162 (W7) — «المعلّم الحيّ»: قبول الخطة حرفيًا.
 *
 *  • صفر بايتات لمَن أطفأه: لا حزمة أفاتار ولا نموذج على الشبكة إطلاقًا.
 *  • الحالات من أحداث حقيقية فقط: تفكير أثناء الدور، انتظار بعده، وحكم
 *    المحرك (celebrate_progress ⇒ «أحسنت») من محك حقيقي — دبوس خط الأعداد.
 *  • التحميل الكسول: المسرح ثلاثي الأبعاد لا يُطلَب إلا عند فتح اللوحة.
 *  • تقليل الحركة يُحترم (وضع ثابت، الفم وحده يتبع الصوت).
 *
 * الأسماء تتفادى تكرار `live-teacher` (لا وجود له قبل هذه المرحلة).
 */

/** أي طلب يعني أن حزمة الأفاتار أو نموذجها على الشبكة — ولو بايتًا. */
const AVATAR_BYTES = /LiveAvatarStage|VrmAvatar|tutor\.vrm|three-vrm|\/deps\/three/i;

function watchAvatarRequests(page: import("@playwright/test").Page): string[] {
  const seen: string[] = [];
  page.on("request", (request) => {
    if (AVATAR_BYTES.test(request.url())) seen.push(request.url());
  });
  return seen;
}

test("LT1: الإطفاء يقطع كل بايتات الأفاتار — والإخفاء كامل في الغرفة", async ({ page }) => {
  const avatarRequests = watchAvatarRequests(page);

  await login(page);
  // البطاقة في الرئيسية تقرأ المفتاح الحقيقي نفسه.
  await expect(page.getByTestId("home-teacher-card")).toHaveAttribute("data-enabled", "1");

  await openAccount(page);
  const toggle = page.getByTestId("live-teacher-toggle");
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  expect(await page.evaluate(() => localStorage.getItem("alfarouq_live_teacher"))).toBe("0");
  await page.getByTestId("account-close").click();

  // نفس الجلسة: البطاقة تتغير فورًا (اشتراك واحد، بلا إعادة تحميل).
  await expect(page.getByTestId("home-teacher-card")).toHaveAttribute("data-enabled", "0");
  await expect(page.getByTestId("home-teacher-note")).toContainText("مطفأ");

  await startFirstLesson(page);
  await expect(page.getByTestId("chat-input")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("live-teacher")).toHaveCount(0);

  // دور كامل (سؤال + رد) واللوحة غائبة — ولا بايت واحد من الأفاتار.
  await sendChatMessage(page, "اشرح مفهوم هذا الدرس ببساطة");
  await expect(page.getByTestId("msg-tutor")).toHaveCount(1, { timeout: 30_000 });
  await expect(page.getByTestId("live-teacher")).toHaveCount(0);
  expect(avatarRequests, `تسرّبت بايتات أفاتار رغم الإطفاء: ${avatarRequests.join(", ")}`).toEqual([]);
});

test("LT2: الحالات من أحداث حقيقية — «يفكّر» أثناء الدور — والتحميل لا يسبق الفتح", async ({ page }) => {
  const avatarRequests = watchAvatarRequests(page);

  await login(page);
  // إبطاء نداء البث يجعل نافذة «التفكير» الحقيقية قابلة للرصد (لا سباق).
  await page.route("**/api/sessions/*/messages/stream*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await startFirstLesson(page);

  const state = page.getByTestId("live-teacher-state");
  await expect(page.getByTestId("live-teacher")).toBeVisible();
  await expect(state).toHaveAttribute("data-state", "idle");

  await sendChatMessage(page, "اشرح مفهوم هذا الدرس ببساطة");
  await expect(state).toHaveAttribute("data-state", "thinking");
  await expect(page.getByTestId("msg-tutor")).toHaveCount(1, { timeout: 30_000 });
  // انتهى الدور بلا صوت: حالة الانتظار تعود بحدث انتهاء الدور نفسه.
  await expect(state).toHaveAttribute("data-state", "idle");

  // قبل فتح اللوحة: صفر طلبات أفاتار — والهيكل الخفيف وحده يعمل.
  expect(avatarRequests, "طُلب الأفاتار قبل فتح اللوحة").toEqual([]);

  await page.getByTestId("live-teacher-open").click();
  await expect(page.getByTestId("live-teacher-stage")).toBeVisible();
  const stage = page.locator('[data-testid="live-teacher-stage"]');
  await expect(stage.locator("canvas, [data-testid=live-teacher-fallback]").first()).toBeVisible({ timeout: 45_000 });
  // الحزمة الثقيلة وصلت — عند الفتح فقط.
  await expect.poll(() => avatarRequests.length, { timeout: 20_000 }).toBeGreaterThan(0);

  // الطيّ يُزيل المسرح (والنموذج يُنظَّف معه).
  await page.getByTestId("live-teacher-open").click();
  await expect(page.getByTestId("live-teacher-stage")).toHaveCount(0);
});

test.describe("تقليل الحركة", () => {
  test.use({ reducedMotion: "reduce" });

  test("LT3: الوضع الثابت يُحترم — الفم وحده يتبع الصوت", async ({ page }) => {
    await login(page);
    await startFirstLesson(page);
    await page.getByTestId("live-teacher-open").click();
    const av = page.locator('[data-testid="live-teacher-stage"] .w7-av');
    await expect(av).toBeVisible({ timeout: 20_000 });
    await expect(av).toHaveAttribute("data-motion", "reduced");
  });
});

test("LT4: حكم حقيقي من المحرك — الدبوس الصحيح «أحسنت» ثم تمضي الحصة", async ({ page }) => {
  await login(page);
  await startFirstLesson(page);

  await sendChatMessage(page, "ارسم لي خط الأعداد من فضلك");
  await expect(page.getByTestId("numberline")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("numberline-question")).toContainText("العدد 7");

  const pin = page.getByTestId("nl-pin");
  await pin.click();
  for (let i = 0; i < 7; i += 1) await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("nl-value")).toContainText("7");
  await page.getByTestId("nl-verify").click();

  await expect(page.getByTestId("msg-tutor").last()).toContainText(WIDGET_PIN_OK, { timeout: 30_000 });
  // الحكم الذي حكم به المحرك فعلًا (سبب answer_correct) — لا اختراع.
  await expect(page.getByTestId("teaching-action").last()).toHaveAttribute("data-action", "celebrate_progress");

  const state = page.getByTestId("live-teacher-state");
  await expect(state).toHaveAttribute("data-state", "correct", { timeout: 20_000 });
  // لحظة الحكم تنتهي وتمضي الحصة — بلا مشهد دائم.
  await expect(state).toHaveAttribute("data-state", "idle", { timeout: 15_000 });
});
