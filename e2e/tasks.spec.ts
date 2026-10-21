import { expect, test } from "@playwright/test";
import { ensureG6Grade, login } from "./helpers.js";

/**
 * PHASE 182 — «أسبوعي»: the task board lives in the dedicated plan screen, is
 * saved on the server (not localStorage), and feeds the quiet next-task line on
 * Home. The API tests prove per-child isolation; this test proves the student
 * can create, complete, and delete a task through the real UI.
 */
test("TK1 (PHASE 182): a student adds, completes, and deletes a homework task", async ({ page }) => {
  await login(page);
  await ensureG6Grade(page);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const iso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  const title = `مراجعة تجريبية ${Date.now()}`;

  // 1) Open the full plan screen and wait for the real (not loading) body.
  await expect(page.getByTestId("home-plan-link")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("home-plan-link").click();
  await expect(page.getByTestId("plan-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("plan-screen-loading")).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByTestId("tasks-section")).toBeVisible();

  // 2) Add an exam for tomorrow.
  await page.getByTestId("task-add-toggle").click();
  await expect(page.getByTestId("task-form")).toBeVisible();
  await page.getByTestId("task-title").fill(title);
  await page.getByTestId("task-kind").selectOption("exam");
  await page.getByTestId("task-date").fill(iso);
  await page.getByTestId("task-submit").click();

  const row = page.getByTestId("task-row").filter({ hasText: title });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await expect(row).toContainText("امتحان");

  // 3) Home carries the nearest task as one quiet line.
  await page.getByTestId("plan-screen-back").click();
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("home-next-task")).toContainText(title);

  // 4) Complete it: the open list hides it, «إظهار المنجز» brings it back marked.
  await page.getByTestId("home-plan-link").click();
  await expect(page.getByTestId("plan-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("task-row").filter({ hasText: title })).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("task-row").filter({ hasText: title }).getByTestId("task-toggle").click();
  await expect(page.getByTestId("task-row").filter({ hasText: title })).toHaveCount(0, { timeout: 20_000 });
  await page.getByTestId("tasks-show-done").click();
  const doneRow = page.getByTestId("task-row").filter({ hasText: title });
  await expect(doneRow).toHaveAttribute("data-done", "1", { timeout: 20_000 });

  // 5) Delete it — the plan stays child-scoped and clean.
  page.on("dialog", (d) => void d.accept());
  await doneRow.getByTestId("task-delete").click();
  await expect(page.getByTestId("task-row").filter({ hasText: title })).toHaveCount(0, { timeout: 20_000 });
});
