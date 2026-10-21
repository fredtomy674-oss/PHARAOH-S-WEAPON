import { expect, test } from "@playwright/test";
import { login, startFirstLesson } from "./helpers.js";

/**
 * PHASE 182 — the student-experience pass:
 *  - the lesson room opens with one obvious start CTA above the board;
 *  - the optional avatar says its ~19 MB price BEFORE anyone downloads it.
 */
test("UX1 (PHASE 182): the room starts from a visible top CTA and the avatar price is disclosed", async ({ page }) => {
  await login(page);
  await startFirstLesson(page);

  // The start strip is the first thing the room offers, and the old empty-state
  // button is gone (one `lesson-start-action`, not a duplicate).
  await expect(page.getByTestId("room-start-strip")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("lesson-start-action")).toHaveCount(1);
  await expect(page.getByTestId("lesson-start-action")).toBeVisible();
  await expect(page.getByTestId("msg-user")).toHaveCount(0);

  // The optional avatar is honest about its size before it is opened.
  await expect(page.getByTestId("live-teacher-size")).toBeVisible();
  await expect(page.getByTestId("live-teacher-size")).toContainText("19");

  // One tap starts the real first turn; the strip retires itself.
  await page.getByTestId("lesson-start-action").click();
  await expect(page.getByTestId("msg-user")).toHaveCount(1, { timeout: 20_000 });
  await expect(page.getByTestId("room-start-strip")).toHaveCount(0);
});
