import { expect, test } from "@playwright/test";
import { login, sendChatMessage, startFirstLesson } from "./helpers.js";

/**
 * PHASE 53 — the tutor's reply renders as structure (bold, lists), never as a
 * wall of raw markdown, and narration reads the words rather than the syntax.
 */
test.describe.configure({ mode: "serial" });

test("FMT1: a tutor reply renders bold and list items, with no visible syntax", async ({ page }) => {
  await login(page);
  await startFirstLesson(page);

  await sendChatMessage(page, "اشرح لي الدرس");
  const tutor = page.getByTestId("msg-tutor").first();
  await expect(tutor).toContainText("تلميح", { timeout: 30_000 });

  // Bold renders as an element, not as asterisks the student can see.
  await expect(tutor.locator("strong")).toContainText("تلميح:");
  const text = (await tutor.textContent()) ?? "";
  expect(text).not.toContain("**");

  // The hint's steps render as real list items.
  const items = tutor.locator("li");
  expect(await items.count()).toBeGreaterThanOrEqual(2);
  await expect(items.first()).toContainText("المثال الأول");
});
