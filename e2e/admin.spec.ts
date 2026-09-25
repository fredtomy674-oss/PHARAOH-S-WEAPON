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

test("A4: the admin dashboard shows the subscription funnel and AI usage/savings cards (PHASE 27)", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("open-admin").click();
  await expect(page.getByTestId("admin-screen")).toBeVisible({ timeout: 20_000 });

  // The legacy operational stats grid plus the two PHASE 27 sections render.
  await expect(page.getByTestId("admin-stats")).toBeVisible({ timeout: 20_000 });
  const subscriptions = page.getByTestId("admin-stats-subscriptions");
  await expect(subscriptions).toBeVisible();
  await expect(subscriptions.getByTestId("admin-stat-subs-active")).toContainText(/مميزة سارية/);
  await expect(subscriptions.getByTestId("admin-stat-subs-conversion")).toContainText("معدل التحويل");
  const ai = page.getByTestId("admin-stats-ai");
  await expect(ai).toBeVisible();
  await expect(ai.getByTestId("admin-stat-ai-cache-hit")).toContainText("الكاش");
  await expect(ai.getByTestId("admin-stat-ai-savings")).toContainText("وفورات");
});

/**
 * PHASE 28 — LLM question generation for questionless concepts: the admin
 * binds the Egyptian curriculum and generates coverage. Only «مقارنة الكسور»
 * has zero seeded questions → exactly 1 generated, 6 skipped. The delivered
 * question is then played end-to-end by the student in PR4.
 */
test("A5 (PHASE 28): the admin generates questions for questionless concepts in the chosen curriculum", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("open-admin").click();
  await expect(page.getByTestId("admin-screen")).toBeVisible({ timeout: 20_000 });

  // Bind curriculumId to the Egyptian curriculum — the same cascade the ingest
  // card uses. The generation card needs no term/unit/lesson selection.
  await selectOptionByLabel(page, "select-country", "مصر");
  await selectFirst(page, "select-system");
  await selectFirst(page, "select-grade");
  await selectFirst(page, "select-subject");
  await selectFirst(page, "select-curriculum");

  const generate = page.getByTestId("admin-gen-questions");
  await expect(generate).toBeEnabled({ timeout: 20_000 });
  await generate.click();

  // Only «مقارنة الكسور» is eligible → the report says exactly 1 generated.
  const result = page.getByTestId("admin-gen-result");
  await expect(result).toBeVisible({ timeout: 30_000 });
  await expect(result).toContainText("تم توليد 1 سؤالًا");
});