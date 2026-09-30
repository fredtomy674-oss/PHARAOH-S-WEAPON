import { expect, test } from "@playwright/test";
import {
  login,
  sendChatMessage,
  startFirstLesson,
  WIDGET_PIN_LEFT,
  WIDGET_PIN_OK,
  WIDGET_PIN_RIGHT,
} from "./helpers.js";

/**
 * PHASE 51 — «خط الأعداد»: the tutor draws a line inside its reply, the
 * student drags the pin on it, and the tutor verifies the position.
 *
 * Exercises the real stack end to end (mock tutor, zero keys): a turn that
 * asks for a number line comes back with a drawable line → keyboard-dragging
 * the pin to the key verifies correct → a wrong position is guided by
 * direction, never by naming the key.
 */
test.describe.configure({ mode: "serial" });

async function askForLine(page: Parameters<typeof sendChatMessage>[0]): Promise<void> {
  await login(page);
  await startFirstLesson(page);
  await sendChatMessage(page, "ارسم لي خط الأعداد من فضلك");
  await expect(page.getByTestId("numberline")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("numberline-question")).toContainText("العدد 7");
}

/** Moves the pin with the keyboard (physical: ArrowRight grows the value). */
async function movePin(page: Parameters<typeof sendChatMessage>[0], presses: number): Promise<void> {
  const pin = page.getByTestId("nl-pin");
  await pin.click();
  for (let i = 0; i < presses; i++) await page.keyboard.press("ArrowRight");
}

test("N1: the tutor draws a line, the pin lands on the key, the verdict praises", async ({ page }) => {
  await askForLine(page);

  await movePin(page, 7);
  await expect(page.getByTestId("nl-value")).toContainText("7");

  await page.getByTestId("nl-verify").click();
  const tutorMsgs = page.getByTestId("msg-tutor");
  await expect(tutorMsgs.last()).toContainText(WIDGET_PIN_OK, { timeout: 30_000 });
});

test("N2: a low pin is guided rightward without naming the key", async ({ page }) => {
  await askForLine(page);

  await movePin(page, 4);
  await page.getByTestId("nl-verify").click();
  const tutorMsgs = page.getByTestId("msg-tutor");
  await expect(tutorMsgs.last()).toContainText(WIDGET_PIN_RIGHT, { timeout: 30_000 });
  // The key is never quoted back: guiding means direction, not the answer.
  await expect(tutorMsgs.last()).not.toContainText("الموضع الصحيح هو 7");
});

test("N3: a high pin is guided leftward", async ({ page }) => {
  await askForLine(page);

  // Home resets to the line start then four steps left of the key… via End.
  const pin = page.getByTestId("nl-pin");
  await pin.click();
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByTestId("nl-value")).toContainText("9");

  await page.getByTestId("nl-verify").click();
  await expect(page.getByTestId("msg-tutor").last()).toContainText(WIDGET_PIN_LEFT, { timeout: 30_000 });
});
