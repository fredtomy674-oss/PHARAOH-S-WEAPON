import { expect, test } from "@playwright/test";
import { ensureG6Grade, login, sendChatMessage, startFirstLesson } from "./helpers.js";

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
  await ensureG6Grade(page);

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
  await ensureG6Grade(page);

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
  await ensureG6Grade(page);
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
 * PR4 (PHASE 28; re-anchored in PHASE 48, re-anchored again in PHASE 158): the
 * concept that ships with zero seeded questions. Its plan row offers
 * generate-on-demand, the grounded generated stem («أي العبارات التالية وردت
 * في الدرس») lands in the practice panel, and answering tracks the concept in
 * إتقان المفاهيم after a reload.
 *
 * PHASE 48: the anchor concept used to be «مقارنة الكسور», a lesson of the old
 * hand-built tree. PHASE 47 replaced Egypt's tree with the official Ministry
 * textbook, so that lesson no longer exists.
 *
 * PHASE 158: the PHASE 48 anchor matched the *lesson* name «استخدام التعبيرات
 * الرياضية وتحليلها» — a lesson of grade 5, outside the demo student's enrolled
 * curricula, so its row never existed in the plan. The test now anchors on
 * «أستطيع أن أستخدم متغيراً في تعبير رياضي للتعبير عن بيانات متعددة», a real
 * concept of the enrolled grade-6 book that ships with no seeded question,
 * i.e. the exact case this test exists to cover.
 *
 * It is also now *self-sufficient*: the old flow leaned on admin.spec's A5
 * having generated a question for the anchor concept in the shared E2E database,
 * so `plan-practice` was only reachable thanks to cross-file ordering. It now
 * drives whichever primary action the row offers (generate-on-demand, or the
 * ready-to-practice button admin's bulk pass may have created), so it proves the
 * generate → practise → mastery chain on its own in either ordering.
 */
test("PR4 (PHASE 28): the student reaches a grounded question for تعبير رياضي with a variable and is tracked", async ({ page }) => {
  await login(page);
  await ensureG6Grade(page);
  await expect(page.getByTestId("plan-section")).toBeVisible({ timeout: 20_000 });

  // PHASE 179 — the home shows the three most important plan steps first.
  const planMore = page.getByTestId("plan-more");
  if ((await planMore.count()) > 0) await planMore.click();

  const row = page
    .locator('[data-testid="plan-row"]')
    .filter({ hasText: "أستطيع أن أستخدم متغيراً في تعبير رياضي للتعبير عن بيانات متعددة" });
  await expect(row).toBeVisible({ timeout: 20_000 });

  // The concept ships with zero seeded questions, so the row's primary action is
  // generate-on-demand. A *full-suite* run may have had admin.spec's A5 bulk-fill
  // that gap first (it generates coverage for the same curriculum), in which case
  // the row offers the ready-to-practice action instead. Both are legitimate, so
  // this asserts the invariant that actually matters — exactly one primary action
  // — and then drives whichever one the row is offering.
  const gap = row.getByTestId("plan-generate");
  const ready = row.getByTestId("plan-practice");
  const actions = (await gap.count()) + (await ready.count());
  expect(actions, "expected exactly one primary practice action on the plan row").toBe(1);
  await (actions === 1 && (await gap.count()) === 1 ? gap : ready).click();

  // The grounded stem (generated on demand, or already delivered) lands in the panel.
  await expect(page.getByTestId("practice-panel")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("practice-question")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("practice-question")).toContainText("أي العبارات التالية وردت في الدرس");

  // Answer it (right or wrong) — deterministic feedback always shows.
  await page.getByTestId("practice-option").first().click();
  await page.getByTestId("practice-submit").click();
  await expect(page.getByTestId("practice-feedback")).toBeVisible({ timeout: 20_000 });

  // Reload: the concept is now tracked in the mastery summary.
  await page.reload();
  await expect(page.getByTestId("mastery-section")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("mastery-concept-row").filter({ hasText: "أستطيع أن أستخدم متغيراً في تعبير رياضي" })).toBeVisible({ timeout: 20_000 });
});

/**
 * PR5 (PHASE 33): ending a lesson session refreshes EXPOSURE recency for the
 * practiced concepts of that lesson — the real start → message → end walk
 * exercises the new recency hook (best-effort, never blocks), and afterwards
 * the practice plan still renders on the home screen.
 */
test("PR5 (PHASE 33): ending a lesson session keeps the practice plan healthy", async ({ page }) => {
  await login(page);
  await ensureG6Grade(page);
  await expect(page.getByTestId("plan-section")).toBeVisible({ timeout: 20_000 });
  expect(await page.getByTestId("plan-row").count()).toBeGreaterThanOrEqual(1);

  // Study a lesson through the real lesson-session flow, then end it.
  await startFirstLesson(page);
  await sendChatMessage(page, "راجعت هذا الدرس قبل التمارين");
  await expect(page.getByTestId("msg-tutor")).toHaveCount(1, { timeout: 30_000 });
  page.on("dialog", (d) => void d.accept());
  await page.getByTestId("end-session").click();

  // Back home: the plan (and the recency path behind it) is still healthy.
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("plan-section")).toBeVisible({ timeout: 20_000 });
  // PHASE 170 — wait for the plan itself, not just its card: the card renders
  // its loading state first, so an immediate count could read a half-loaded plan.
  await expect(page.getByTestId("plan-row").first()).toBeVisible({ timeout: 20_000 });
  expect(await page.getByTestId("plan-row").count()).toBeGreaterThanOrEqual(1);
});

/**
 * PHASE 35 (D-037 tail) — the plan carries the «راجع قبل أن ينسى» urgency flag.
 * The demo student practiced minutes ago, so NO row is due — the flag must not
 * appear yet, which proves the plan is not blanket-labelling everything. The
 * ordering contract itself is covered by the unit + API tests (14-day threshold).
 */
test("PR6 (PHASE 35): the plan shows no «راجع قبل أن ينسى» flag right after practice", async ({ page }) => {
  await login(page);
  await ensureG6Grade(page);
  await expect(page.getByTestId("plan-section")).toBeVisible({ timeout: 20_000 });
  // PHASE 170 — wait for the plan itself, not just its card: the card renders
  // its loading state first, so an immediate count could read a half-loaded plan.
  await expect(page.getByTestId("plan-row").first()).toBeVisible({ timeout: 20_000 });
  expect(await page.getByTestId("plan-row").count()).toBeGreaterThanOrEqual(1);

  // Every row renders its level; the due pill is reserved for stale concepts.
  await expect(page.getByTestId("plan-level").first()).toBeVisible();
  expect(await page.getByTestId("plan-due").count()).toBe(0);
});
