import { expect, test } from "@playwright/test";
import { DEMO_STUDENT } from "./helpers.js";

/**
 * Auth guards + RTL basics:
 * A wrong password, B unauthenticated API access, I RTL/Arabic/keyboard.
 */
test.describe.configure({ mode: "serial" });

test("A: wrong credentials show a clear error and the user stays logged out", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("input-email")).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("input-email").fill(DEMO_STUDENT.email);
  await page.getByTestId("input-password").fill("definitely-wrong-123");
  await page.getByTestId("submit-auth").click();

  await expect(page.getByTestId("auth-error")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("auth-error")).toContainText("البريد أو كلمة المرور غير صحيحة");
  // Still on the login screen — never reached the protected home.
  await expect(page.getByTestId("input-email")).toBeVisible();
  await expect(page.getByTestId("home-screen")).toHaveCount(0);
});

test("B: an unauthenticated user cannot read protected resources (through the real proxy)", async ({ request }) => {
  const me = await request.get("/api/auth/me");
  expect(me.status()).toBe(401);

  const sessions = await request.get("/api/sessions");
  expect(sessions.status()).toBe(401);

  const progress = await request.get("/api/progress/me");
  expect(progress.status()).toBe(401);
});

test("I: RTL document, Arabic UI and basic keyboard navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("input-email")).toBeVisible({ timeout: 20_000 });

  // Direction + language of the document.
  const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
  const lang = await page.evaluate(() => document.documentElement.getAttribute("lang"));
  expect(dir).toBe("rtl");
  expect(lang).toBe("ar");

  // Arabic-labeled form fields (wrapping <label> provides the accessible name).
  await expect(page.getByLabel("البريد الإلكتروني")).toBeVisible();
  await expect(page.getByLabel("كلمة المرور")).toBeVisible();

  // Basic keyboard navigation: email → password focus order, then Enter to submit.
  await page.getByTestId("input-email").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("input-password")).toBeFocused();

  await page.getByTestId("input-email").fill(DEMO_STUDENT.email);
  await page.getByTestId("input-password").fill(DEMO_STUDENT.password);
  await page.getByTestId("input-password").press("Enter");
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });

  // Arabic navigation present on the student home.
  await expect(page.getByText("معلمك الخصوصي الذكي")).toBeVisible();
  await expect(page.getByTestId("start-lesson")).toBeVisible();
});