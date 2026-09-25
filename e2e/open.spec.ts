import { expect, test } from "@playwright/test";
import { login } from "./helpers.js";

/**
 * PHASE 30 (D-028) — open-question practice end to end:
 *  - O1: the seeded open question for «تبسيط الكسور» answers deterministically
 *    correct for the exact fact "2/3", shows the LLM-graded feedback + mastery
 *    badge, and never leaks the answer key anywhere in the DOM.
 *  - O2: self-healing open generation — a concept without an open question
 *    offers «توليد سؤال مقالي», which grounds a fresh open question on demand,
 *    accepts a free-text answer, and returns graded feedback.
 */
test.describe.configure({ mode: "serial" });

test("O1 (PHASE 30): answering a seeded open question grades via the LLM with no key leak", async ({ page }) => {
  await login(page);

  // 1) The plan offers the seeded open question for «تبسيط الكسور».
  await expect(page.getByTestId("plan-section")).toBeVisible({ timeout: 20_000 });
  const row = page.locator('[data-testid="plan-row"]').filter({ hasText: "تبسيط الكسور" });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.getByTestId("plan-open-practice").click();

  // 2) The open panel renders a free-text box and the question text.
  await expect(page.getByTestId("practice-panel")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("practice-question")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("practice-open-input")).toBeVisible({ timeout: 20_000 });

  // 3) The payload never carries the answer key into the DOM.
  await expect(page.locator("body")).not.toContainText("answerKey");
  await expect(page.locator("body")).not.toContainText("correctIndex");

  // 4) The exact grounded fact grades correct deterministically.
  await page.getByTestId("practice-open-input").fill("2/3");
  await page.getByTestId("practice-submit").click();
  await expect(page.getByTestId("practice-feedback")).toBeVisible({ timeout: 20_000 });
  const feedback = await page.getByTestId("practice-feedback").innerText();
  expect(feedback).toContain("موفقة");
  await expect(page.getByTestId("practice-score")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("practice-mastery")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("body")).not.toContainText("answerKey");
});

test("O2 (PHASE 30): self-healing open question generation + free-text grading", async ({ page }) => {
  await login(page);

  // A concept with no seeded open question offers «توليد سؤال مقالي».
  await expect(page.getByTestId("plan-section")).toBeVisible({ timeout: 20_000 });
  const row = page.locator('[data-testid="plan-row"]').filter({ hasText: "الطرح مع الاستلاف" });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.getByTestId("plan-open-generate").click();

  // The generated open question lands in the same panel with a textarea.
  await expect(page.getByTestId("practice-panel")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("practice-open-input")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("practice-question")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("body")).not.toContainText("answerKey");

  // Any free text is graded (deterministic outcome unknown here — feedback shows).
  await page.getByTestId("practice-open-input").fill("20");
  await page.getByTestId("practice-submit").click();
  await expect(page.getByTestId("practice-feedback")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("practice-feedback")).not.toBeEmpty();
  await expect(page.locator("body")).not.toContainText("answerKey");
});