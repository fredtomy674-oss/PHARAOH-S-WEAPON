import { expect, test } from "@playwright/test";
import { openAccount } from "./helpers.js";

/**
 * PHASE 180 — «لكل طالبٍ ملفّه» through the real UI:
 * register → first-run (name + grade) → add a second child → switch between
 * them → change the first child's grade only through the destructive warning.
 */
test("M1: a family account adds, switches, and re-scopes two children", async ({ page }) => {
  const email = `e2e-students-${Date.now()}@test.local`;
  const password = "students-pass-123";

  await page.goto("/");
  await page.getByTestId("tab-register").click();
  await page.getByTestId("input-display-name").fill("الطفل الأول");
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-password").fill(password);
  await page.getByTestId("submit-auth").click();

  // First run is now name + grade, not grade alone.
  await expect(page.getByTestId("first-run")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("first-run-name")).toHaveValue("الطفل الأول");
  await page.locator('[data-testid^="first-run-grade-"]').filter({ hasText: "الصف السادس" }).first().click();
  await page.getByTestId("first-run-skip").click();
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("grade-chip")).toContainText("الصف السادس");

  // Add a second child from the account drawer. Each child gets its own plan.
  await openAccount(page);
  await page.getByTestId("student-add-open").click();
  await expect(page.getByTestId("student-add-name")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("student-add-name").fill("الطفلة الثانية");
  await page.locator('[data-testid^="student-grade-"]').filter({ hasText: "الصف السادس" }).first().click();
  const added = page.waitForResponse(
    (r) => r.url().endsWith("/api/students") && r.request().method() === "POST" && r.ok(),
    { timeout: 30_000 },
  );
  await page.getByTestId("student-add-submit").click();
  await added;
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("home-screen")).toContainText("الطفلة الثانية");
  await expect(page.getByTestId("grade-chip")).toContainText("الصف السادس");

  // Switch back: the first child's own profile is restored, not the second's.
  await openAccount(page);
  await expect(page.getByTestId("student-drawer-card")).toContainText("الطفلة الثانية");
  await page.getByTestId("student-switch-open").click();
  await expect(page.getByTestId("student-switch-list")).toBeVisible({ timeout: 20_000 });
  const switched = page.waitForResponse(
    (r) => r.url().includes("/api/students/") && r.url().endsWith("/activate") && r.request().method() === "POST" && r.ok(),
    { timeout: 30_000 },
  );
  await page.getByTestId("student-switch-list").getByRole("button", { name: /الطفل الأول/ }).click();
  await switched;
  await expect(page.getByTestId("home-screen")).toContainText("الطفل الأول");
  await expect(page.getByTestId("grade-chip")).toContainText("الصف السادس");

  // The ONLY grade path is the destructive «تغيير المنهج», warning first.
  await page.getByTestId("change-curriculum").click();
  await expect(page.getByTestId("student-grade-warning")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("student-grade-warning")).toContainText("سيمسح");
  await page.locator('[data-testid^="student-grade-"]').filter({ hasText: "الصف الخامس" }).first().click();
  await page.getByTestId("student-grade-ack").check();
  const changed = page.waitForResponse(
    (r) => r.url().includes("/api/students/") && r.url().endsWith("/grade") && r.request().method() === "PUT" && r.ok(),
    { timeout: 30_000 },
  );
  await page.getByTestId("student-grade-confirm").click();
  await changed;
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("grade-chip")).toContainText("الصف الخامس");

  // The second child kept Grade 6: grade changes are per child, never account-wide.
  await openAccount(page);
  await page.getByTestId("student-switch-open").click();
  const back = page.waitForResponse(
    (r) => r.url().includes("/api/students/") && r.url().endsWith("/activate") && r.request().method() === "POST" && r.ok(),
    { timeout: 30_000 },
  );
  await page.getByTestId("student-switch-list").getByRole("button", { name: /الطفلة الثانية/ }).click();
  await back;
  await expect(page.getByTestId("grade-chip")).toContainText("الصف السادس");

  // Logging in again with two children shows the picker (no child is assumed).
  await openAccount(page);
  await page.getByTestId("logout").click();
  await expect(page.getByTestId("input-email")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-password").fill(password);
  await page.getByTestId("submit-auth").click();
  await expect(page.getByTestId("student-picker")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("student-picker")).toContainText("الطفل الأول");
  await expect(page.getByTestId("student-picker")).toContainText("الطفلة الثانية");
  const picked = page.waitForResponse(
    (r) => r.url().includes("/api/students/") && r.url().endsWith("/activate") && r.request().method() === "POST" && r.ok(),
    { timeout: 30_000 },
  );
  await page.getByTestId("student-pick-list").getByRole("button", { name: /الطفلة الثانية/ }).click();
  await picked;
  await expect(page.getByTestId("home-screen")).toContainText("الطفلة الثانية");
  await expect(page.getByTestId("grade-chip")).toContainText("الصف السادس");
});
