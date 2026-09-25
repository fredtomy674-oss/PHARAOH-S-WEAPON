import { expect, test } from "@playwright/test";
import { login } from "./helpers.js";

/**
 * PHASE 24 — concept mastery + practice loop, end to end: the demo student
 * opens the practice panel from the progress card, answers a seeded question
 * (outcome may be right or wrong), always gets deterministic feedback plus a
 * mastery-level badge, and after a reload sees the practiced concept listed
 * in the new "إتقان المفاهيم" section with level/trend.
 */
test.describe.configure({ mode: "serial" });

test("PR1 (PHASE 24): practicing a question updates concept mastery on the student home", async ({ page }) => {
  await login(page);

  // 1) Open the practice panel from the progress card.
  await expect(page.getByTestId("open-practice")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("open-practice").click();
  await expect(page.getByTestId("practice-panel")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("practice-question")).toBeVisible({ timeout: 20_000 });

  // 2) The question payload never leaks the answer key into the DOM.
  await expect(page.locator("body")).not.toContainText("correctIndex");
  await expect(page.locator("body")).not.toContainText("answerKey");

  // 3) Pick the first option and submit — correct or not, feedback shows and
  //    the engine reports the updated mastery level badge.
  await page.getByTestId("practice-option").first().click();
  await page.getByTestId("practice-submit").click();
  await expect(page.getByTestId("practice-feedback")).toBeVisible({ timeout: 20_000 });
  const feedback = await page.getByTestId("practice-feedback").innerText();
  expect(feedback).toMatch(/إجابة (صحيحة|غير صحيحة)/);
  await expect(page.getByTestId("practice-mastery")).toBeVisible({ timeout: 20_000 });

  // 4) Reload the home screen: the concept is now tracked in "إتقان المفاهيم"
  //    with a level badge and practice recency.
  await page.reload();
  await expect(page.getByTestId("mastery-section")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("mastery-list")).toBeVisible({ timeout: 20_000 });
  const rows = page.getByTestId("mastery-concept-row");
  await expect(rows.first()).toBeVisible({ timeout: 20_000 });
  expect(await rows.count()).toBeGreaterThanOrEqual(1);
  await expect(page.getByTestId("mastery-level").first()).toBeVisible();
  await expect(page.getByTestId("mastery-trend").first()).toBeVisible();
});