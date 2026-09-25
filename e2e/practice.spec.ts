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

/**
 * PR2 (PHASE 25): the mastery engine now also drives a ranked practice plan —
 * after PR1 practiced the weakest concept, "خطة ممارستك" lists it with its
 * lesson + available questions, and "تمرّن الآن" opens practice scoped to it.
 */
test("PR2 (PHASE 25): the practice plan ranks weak concepts and opens scoped practice", async ({ page }) => {
  await login(page);

  // 1) The plan section rendered with at least one ranked concept.
  await expect(page.getByTestId("plan-section")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("plan-list")).toBeVisible({ timeout: 20_000 });
  const rows = page.getByTestId("plan-row");
  expect(await rows.count()).toBeGreaterThanOrEqual(1);

  // 2) Each row shows its lesson and how many questions are available.
  await expect(page.getByTestId("plan-lesson").first()).toBeVisible();
  await expect(page.getByTestId("plan-questions").first()).toBeVisible();
  await expect(page.getByTestId("plan-level").first()).toBeVisible();
  await expect(page.getByTestId("plan-trend").first()).toBeVisible();

  // 3) "تمرّن الآن" on the first PRACTICABLE concept opens the practice panel
  //    with a real question, scoped to that concept (chip shows its title).
  const practiceable = page.locator('[data-testid="plan-practice"]:not([disabled])');
  await expect(practiceable.first()).toBeVisible({ timeout: 20_000 });
  await practiceable.first().click();
  await expect(page.getByTestId("practice-panel")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("practice-question")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("practice-concept")).toBeVisible();
});

/**
 * PR3 (PHASE 26): the mastery engine also feeds achievements — PR1 already
 * answered one question, so «انطلاقة التمرين» shows earned on the student's
 * achievements screen while «أول إتقان» (first concept at متقن level) is still
 * locked. No web change needed: badges render through the existing screen.
 */
test("PR3 (PHASE 26): the first practice answer earns انطلاقة التمرين while أول إتقان stays locked", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("open-achievements").click();
  await expect(page.getByTestId("achievements-screen")).toBeVisible({ timeout: 20_000 });

  const starter = page.locator('[data-testid="achievement-row"][data-code="practice_starter"]');
  await expect(starter).toBeVisible({ timeout: 20_000 });
  await expect(starter).toContainText("انطلاقة التمرين");
  await expect(starter).toHaveAttribute("data-earned", "true");

  const masteryFirst = page.locator('[data-testid="achievement-row"][data-code="mastery_first"]');
  await expect(masteryFirst).toBeVisible();
  await expect(masteryFirst).toContainText("أول إتقان");
  await expect(masteryFirst).toHaveAttribute("data-earned", "false");
});

/**
 * PR4 (PHASE 28): A5 delivered the admin-generated «مقارنة الكسور» question —
 * the concept that shipped with zero seeded questions. The student now sees a
 * "تمرّن الآن" button on that plan row, gets the grounded generated stem
 * («أي العبارات التالية وردت في الدرس»), and answering tracks the concept in
 * إتقان المفاهيم after a reload.
 */
test("PR4 (PHASE 28): the student practices the admin-generated question for مقارنة الكسور", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("plan-section")).toBeVisible({ timeout: 20_000 });

  // The previously questionless concept now offers its generated question.
  const row = page.locator('[data-testid="plan-row"]').filter({ hasText: "مقارنة الكسور" });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.getByTestId("plan-practice").click();
  await expect(page.getByTestId("practice-panel")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("practice-question")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("practice-question")).toContainText("أي العبارات التالية وردت في الدرس");

  // Answer it (right or wrong) — deterministic feedback always shows.
  await page.getByTestId("practice-option").first().click();
  await page.getByTestId("practice-submit").click();
  await expect(page.getByTestId("practice-feedback")).toBeVisible({ timeout: 20_000 });

  // Reload: مقارنة الكسور is now tracked in the mastery summary.
  await page.reload();
  await expect(page.getByTestId("mastery-section")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("mastery-concept-row").filter({ hasText: "مقارنة الكسور" })).toBeVisible({ timeout: 20_000 });
});