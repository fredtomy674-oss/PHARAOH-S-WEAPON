import { expect, test } from "@playwright/test";
import { DEMO_LINK_CODE, DEMO_PARENT, login } from "./helpers.js";

/**
 * Parent dashboard (PHASE 18): a parent logs in, sees their pre-linked child,
 * and opens a read-only progress view; the student's home shows the sharing
 * code the parent uses to link; an unknown code shows a clear error.
 * The E2E DB is seeded fresh — the demo parent is pre-linked to the demo
 * student (whose fixed code is DEMO_LINK_CODE).
 */
test.describe.configure({ mode: "serial" });

test("P1: a parent sees their linked child and its progress dashboard", async ({ page }) => {
  await login(page, DEMO_PARENT.email, DEMO_PARENT.password, "parent-screen");

  // The seeded demo parent is pre-linked to the seeded demo student.
  const row = page.getByTestId("parent-child-row");
  await expect(row).toBeVisible({ timeout: 20_000 });
  await expect(row).toContainText("طالب تجريبي");

  await page.getByTestId("parent-child-open").click();
  await expect(page.getByTestId("parent-child-detail")).toBeVisible({ timeout: 20_000 });

  // The demo student may or may not have sessions by the time this test runs
  // (earlier E2E flows in the shared DB create some) — but the parent only
  // ever sees the aggregated section: a list of summaries or a clean empty
  // state; never raw message content.
  await expect(page.getByTestId("parent-progress-card")).toBeVisible({ timeout: 20_000 });
  const sessionsView = page.getByTestId("parent-sessions-list").or(page.getByTestId("parent-sessions-empty"));
  await expect(sessionsView).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("parent-back").click();
  await expect(page.getByTestId("parent-screen")).toBeVisible({ timeout: 20_000 });
});

test("P2: a student's home shows the parent link code", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("parent-link-card")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("link-code-value")).toHaveText(DEMO_LINK_CODE);
});

test("P3: a parent linking an unknown code sees a clear error", async ({ page }) => {
  await login(page, DEMO_PARENT.email, DEMO_PARENT.password, "parent-screen");

  await page.getByTestId("parent-link-code-input").fill("ZZZZZZZZ");
  await page.getByTestId("parent-link-submit").click();

  await expect(page.getByTestId("parent-link-error")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("parent-link-error")).toContainText("كود الربط غير صحيح");
});