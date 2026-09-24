import { expect, test } from "@playwright/test";
import { login, sendChatMessage, startFirstLesson } from "./helpers.js";

/**
 * PHASE 20 — Billing/Subscriptions (بلا بوابة دفع) + Achievements, end-to-end:
 *  - E1: a brand-new student completes their first lesson → the «أول خطوة»
 *    badge is earned and shown in their achievements screen; their plan card
 *    reads «مجانية» (free plan, lazily created).
 *  - E2: the admin upgrades that same student to premium through the dashboard
 *    subscriptions panel → the student's plan card now reads «مميزة».
 */
test.describe.configure({ mode: "serial" });

const ADMIN = { email: "admin@alfarouq.test", password: "admin-demo-123" };
const PASS = "e2e-ach-pass-123";

let freshEmail = "";

test("E1: a fresh student earns أول خطوة after their first session and sees a free plan", async ({ page }) => {
  freshEmail = `e2e-achievements-${Date.now()}@test.local`;

  // Register through the real UI so the CSRF token lands in localStorage
  // (a state-changing session start later would otherwise be CSRF-rejected).
  await page.goto("/");
  await page.getByTestId("tab-register").click();
  await page.getByTestId("input-display-name").fill("طالب شارات");
  await page.getByTestId("input-email").fill(freshEmail);
  await page.getByTestId("input-password").fill(PASS);
  await page.getByTestId("submit-auth").click();
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });

  // PHASE 20 — the student's plan card: lazily-created free subscription.
  await expect(page.getByTestId("subscription-card")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("subscription-plan")).toHaveText("مجانية");

  // Complete the first lesson (lesson walk → one grounded exchange → end).
  await startFirstLesson(page);
  await sendChatMessage(page, "اشرح لي هذا الدرس مع مثال من الحياة");
  await expect(page.getByTestId("msg-tutor")).toHaveCount(1, { timeout: 30_000 });
  page.on("dialog", (d) => void d.accept());
  await page.getByTestId("end-session").click();
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });

  // PHASE 20 — the achievements screen: «أول خطوة» earned, everything else locked.
  await page.getByTestId("open-achievements").click();
  await expect(page.getByTestId("achievements-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("achievements-earned")).toHaveText("1");
  const firstSteps = page.locator('[data-testid="achievement-row"][data-code="first_steps"]');
  await expect(firstSteps).toHaveAttribute("data-earned", "true");
  const explorer = page.locator('[data-testid="achievement-row"][data-code="explorer"]');
  await expect(explorer).toHaveAttribute("data-earned", "false");
  await page.getByTestId("achievements-back").click();
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
});

test("E2: an admin upgrades the student to premium and the student sees مميزة", async ({ browser }) => {
  expect(freshEmail.length).toBeGreaterThan(0);

  // The admin grants premium through the real dashboard subscriptions panel.
  const adminCtx = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  await login(adminPage, ADMIN.email, ADMIN.password);
  await expect(adminPage.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await adminPage.getByTestId("open-admin").click();
  await expect(adminPage.getByTestId("admin-screen")).toBeVisible({ timeout: 20_000 });
  const section = adminPage.getByTestId("admin-subscriptions");
  await expect(section).toBeVisible({ timeout: 20_000 });
  const row = section.getByTestId("admin-sub-row").filter({ hasText: freshEmail });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.locator('[data-testid^="sub-upgrade-"]').click();
  await expect(row).toHaveAttribute("data-plan", "premium", { timeout: 20_000 });
  await adminCtx.close();

  // The same student now sees the premium plan card.
  const studentCtx = await browser.newContext();
  const studentPage = await studentCtx.newPage();
  await login(studentPage, freshEmail, PASS, "home-screen");
  await expect(studentPage.getByTestId("subscription-plan")).toHaveText("مميزة");
  await studentCtx.close();
});