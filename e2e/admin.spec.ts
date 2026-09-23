import { expect, test, type Page } from "@playwright/test";
import { docFixture, login, selectFirst, selectOptionByLabel } from "./helpers.js";

/**
 * Admin dashboard — curriculum file import (Path B, PHASE 14):
 * an admin uploads a PDF curriculum file, ties it to a lesson scope, and the
 * document appears in the knowledge-base list. Also verifies the student role
 * never sees the admin entry point, and that byte-identical re-imports are
 * rejected with a clear error (file-level dedup).
 */
test.describe.configure({ mode: "serial" });

const ADMIN = { email: "admin@alfarouq.test", password: "admin-demo-123" };

/** Walks the admin scope picker to the SECOND lesson of the seeded Egyptian unit. */
async function pickSecondLesson(page: Page): Promise<void> {
  await selectOptionByLabel(page, "select-country", "مصر");
  await selectFirst(page, "select-system");
  await selectFirst(page, "select-grade");
  await selectFirst(page, "select-subject");
  await selectFirst(page, "select-curriculum");
  await selectFirst(page, "select-term");
  await selectFirst(page, "select-unit");

  const lessons = page.locator('[data-testid^="lesson-"]');
  await expect(lessons.nth(1)).toBeVisible({ timeout: 20_000 });
  await lessons.nth(1).click();
  await expect(page.getByTestId("admin-selected-lesson")).toContainText("الضرب والقسمة");
}

test("A1: an admin uploads a PDF curriculum file into a lesson and sees it in the knowledge base", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("open-admin")).toBeVisible();
  await page.getByTestId("open-admin").click();
  await expect(page.getByTestId("admin-screen")).toBeVisible({ timeout: 20_000 });

  await pickSecondLesson(page);

  await page.getByTestId("admin-file-input").setInputFiles({
    name: "curriculum.pdf",
    mimeType: "application/pdf",
    buffer: docFixture("curriculum.pdf"),
  });
  await page.getByTestId("admin-title-input").fill("ملف درس الضرب والقسمة");

  const submit = page.getByTestId("admin-submit-upload");
  await expect(submit).toBeEnabled();
  await submit.click();

  // The ingest succeeds: a success notice with a retrieved chunk count shows.
  await expect(page.getByTestId("admin-upload-result")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("admin-upload-result")).toContainText("تم استيراد الملف بنجاح");

  // The document row appears in the list, tied to the lesson + chunk count.
  const row = page.getByTestId("admin-doc-row").filter({ hasText: "ملف درس الضرب والقسمة" });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await expect(row).toContainText("الضرب والقسمة");
  await expect(row).toContainText("PDF");
  const chunks = Number(await row.getAttribute("data-chunks"));
  expect(chunks).toBeGreaterThan(0);
});

test("A2: re-importing byte-identical file bytes for the same curriculum is rejected with a clear error", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await page.getByTestId("open-admin").click();
  await expect(page.getByTestId("admin-screen")).toBeVisible({ timeout: 20_000 });

  await pickSecondLesson(page);

  await page.getByTestId("admin-file-input").setInputFiles({
    name: "curriculum-copy.pdf",
    mimeType: "application/pdf",
    buffer: docFixture("curriculum.pdf"),
  });

  const submit = page.getByTestId("admin-submit-upload");
  await expect(submit).toBeEnabled();
  await submit.click();

  // Server-side file dedup rejects it: same bytes, same curriculum.
  await expect(page.getByTestId("admin-upload-error")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("admin-upload-error")).toContainText("مستورد مسبقًا");
});

test("A3: a student never sees the admin entry point", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("open-admin")).toHaveCount(0);
});