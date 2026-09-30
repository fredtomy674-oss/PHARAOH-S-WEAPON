import { expect, test, type Page } from "@playwright/test";
import {
  login,
  RAG_CONTEXT_PHRASE,
  sendChatMessage,
  startLessonOfSubject,
  VISION_MARKER,
} from "./helpers.js";

/**
 * PHASE 50 — «لوح الحبر»: the student draws on the printed page with a finger,
 * and the tutor sees the page *as he marked it*.
 *
 * Exercises the real stack end to end: pointer drawing on the stage overlay →
 * page + marks composited in the browser → Fastify → stored attachment naming
 * the printed page → the mock tutor reading the picture → the transcript
 * captioning the marks as the student's own drawing on that page.
 */
test.describe.configure({ mode: "serial" });

async function openMathRoom(page: Page): Promise<void> {
  await login(page);
  // The first math lesson owns real printed pages (the stage), so the board exists.
  await startLessonOfSubject(page, "الرياضيات");
  await expect(page.getByTestId("stage-image")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("ink-canvas")).toBeVisible();
}

/** Draws a circle on the ink canvas with the mouse (a finger on touch screens). */
async function drawCircle(page: Page): Promise<void> {
  const canvas = page.getByTestId("ink-canvas");
  const box = await canvas.boundingBox();
  expect(box, "ink canvas has no laid-out box").toBeTruthy();
  const cx = box!.x + box!.width / 2;
  const cy = box!.y + box!.height / 2;
  const rx = Math.min(60, box!.width / 4);
  const ry = Math.min(45, box!.height / 4);
  await page.mouse.move(cx + rx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    await page.mouse.move(cx + rx * Math.cos(a), cy + ry * Math.sin(a), { steps: 2 });
  }
  await page.mouse.up();
}

async function expectTutorReply(page: Page, contain: string): Promise<void> {
  const tutorMsgs = page.getByTestId("msg-tutor");
  await expect(tutorMsgs.last()).toContainText(contain, { timeout: 30_000 });
}

test("a circle on the page travels with the question and comes back captioned", async ({ page }) => {
  await openMathRoom(page);
  await drawCircle(page);

  // The board counts the mark, and the send button wakes up on ink alone.
  await expect(page.getByTestId("ink-count")).toContainText("علامة");
  await expect(page.getByTestId("send-message")).toBeEnabled();

  await sendChatMessage(page, "ما هذا الذي حددته؟");
  await expectTutorReply(page, VISION_MARKER);
  // Grounding stays on: the answer is still built from the lesson.
  await expect(page.getByTestId("msg-tutor").last()).toContainText(RAG_CONTEXT_PHRASE);

  // The transcript shows the marked page back, captioned as the student's own
  // drawing — not as a nameless photo.
  const userMsgs = page.getByTestId("msg-user");
  await expect(userMsgs.last().getByTestId("msg-attachment")).toBeVisible();
  await expect(userMsgs.last().getByTestId("msg-ink-caption")).toContainText("رسمك على");

  // The marks were delivered: the board starts fresh for the next question.
  await expect(page.getByTestId("ink-count")).toContainText("ارسم على الصفحة");
});

test("marks alone — no typed words — are a complete question", async ({ page }) => {
  await openMathRoom(page);
  await drawCircle(page);

  // No text at all: the marks *are* the question ("what did I circle?").
  await page.getByTestId("send-message").click();
  await expectTutorReply(page, VISION_MARKER);
  await expect(page.getByTestId("msg-user").last().getByTestId("msg-ink-caption")).toContainText("رسمك على");
});

test("turning the page leaves the old marks behind", async ({ page }) => {
  await openMathRoom(page);
  await drawCircle(page);
  await expect(page.getByTestId("ink-count")).toContainText("علامة");

  // A mark belongs to its page: turning the stage clears the board, so a
  // circle on page 0 can never travel to page 1.
  await page.getByTestId("stage-next").click();
  await expect(page.getByTestId("ink-count")).toContainText("ارسم على الصفحة");
});

test("the composer announces hitchhiking marks and lets the student drop them", async ({ page }) => {
  await openMathRoom(page);
  await drawCircle(page);

  // The marks ride with the next send — the composer says so instead of
  // smuggling them invisibly onto every later question.
  await expect(page.getByTestId("ink-pending")).toContainText("ستُرسل مع سؤالك");

  // One tap drops them: the board clears and the send button sleeps again.
  await page.getByTestId("ink-drop").click();
  await expect(page.getByTestId("ink-pending")).toHaveCount(0);
  await expect(page.getByTestId("ink-count")).toContainText("ارسم على الصفحة");
  await expect(page.getByTestId("send-message")).toBeDisabled();
});
