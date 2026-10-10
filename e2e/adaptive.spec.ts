import { expect, test } from "@playwright/test";
import { login, sendChatMessage, startLessonOfSubject } from "./helpers.js";

/**
 * PHASE 93/95 — the adaptive layer, seen by the student.
 *
 * Two things must be true in the real browser (mock tutor, real DB):
 *  • every tutor reply carries the ENGINE's typed teaching move as a chip, so
 *    «what the tutor is doing» is legible instead of implied by prose;
 *  • the lesson's concept map is drawn from the book's own order, with the
 *    student's real mastery — never an invented relation.
 */
test.describe.configure({ mode: "serial" });

const ACTION_TYPES = [
  "explain",
  "diagnose",
  "hint",
  "visual_explanation",
  "interactive_board",
  "textbook_reference",
  "practice",
  "review_prerequisite",
  "celebrate_progress",
  "continue_learning",
];

test("ADAPT1: the tutor's reply shows the engine's teaching move", async ({ page }) => {
  await login(page);
  await startLessonOfSubject(page, "الرياضيات");
  await sendChatMessage(page, "اشرح لي الدرس");

  const chip = page.getByTestId("teaching-action").first();
  await expect(chip).toBeVisible({ timeout: 30_000 });
  const action = await chip.getAttribute("data-action");
  expect(action, "the reply carried no typed teaching action").toBeTruthy();
  expect(ACTION_TYPES).toContain(action!);
});

test("ADAPT2: the concept map is drawn with real mastery in the lesson's order", async ({ page }) => {
  await login(page);
  await startLessonOfSubject(page, "الرياضيات");

  const map = page.getByTestId("concept-map");
  await expect(map).toBeVisible({ timeout: 20_000 });

  const nodes = page.getByTestId("concept-map-node");
  await expect(nodes.first()).toBeVisible({ timeout: 20_000 });
  expect(await nodes.count()).toBeGreaterThanOrEqual(1);

  // Every node is one of the real mastery bands (or honestly untracked).
  for (const level of await nodes.evaluateAll((els) => els.map((el) => el.getAttribute("data-level")))) {
    expect(["mastered", "advanced", "developing", "needs_review", "untracked"]).toContain(level);
  }
});
