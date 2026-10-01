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
  // The sheet shrink-wraps the page image: drawing before it lays out would
  // land on a zero-sized canvas, so wait for the laid-out board explicitly.
  // `complete` (not just width) matters: a half-streamed image keeps growing,
  // and coordinates read mid-growth land off-canvas.
  await expect.poll(
    async () =>
      page.evaluate(() => {
        const img = document.querySelector('[data-testid="stage-image"]') as HTMLImageElement;
        const canvas = document.querySelector('[data-testid="ink-canvas"]') as HTMLElement;
        if (!img || !canvas || !img.complete || img.naturalWidth === 0) return 0;
        return Math.round(canvas.getBoundingClientRect().width);
      }),
    { timeout: 20_000 },
  ).toBeGreaterThan(50);
}

/** Draws a circle on the ink canvas with the mouse (a finger on touch screens). */
async function drawCircle(page: Page): Promise<void> {
  const canvas = page.getByTestId("ink-canvas");
  // The room keeps keyboard focus in the composer without scrolling, so the
  // stage may sit above the viewport: bring the board into view first, then
  // read a fresh box — coordinates from a scrolled-away box miss the canvas.
  await canvas.scrollIntoViewIfNeeded();
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

/** How much of the live canvas is ink red (the page must not be). */
async function redShareOfCanvas(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="ink-canvas"]') as HTMLCanvasElement;
    const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
    let red = 0;
    let sampled = 0;
    for (let i = 0; i < data.length; i += 16) {
      sampled += 1;
      if (data[i]! > 150 && data[i + 1]! < 115 && data[i + 2]! < 115) red += 1;
    }
    return red / sampled;
  });
}

/** How much of a picture the tutor receives is ink red. */
async function redShareOfImage(page: Page, testId: string): Promise<number> {
  return page.evaluate(async (id) => {
    const img = document.querySelector(`[data-testid="${id}"]`) as HTMLImageElement;
    if (!img.complete) await img.decode();
    const probe = document.createElement("canvas");
    probe.width = img.naturalWidth;
    probe.height = img.naturalHeight;
    const ctx = probe.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, probe.width, probe.height);
    let red = 0;
    let sampled = 0;
    for (let i = 0; i < data.length; i += 16) {
      sampled += 1;
      if (data[i]! > 150 && data[i + 1]! < 115 && data[i + 2]! < 115) red += 1;
    }
    return red / sampled;
  }, testId);
}

/**
 * PHASE 56 — the red screen. These are pixel gates, not style checks, because the
 * bug was never in the CSS: measured on the running app, the canvas's pixel
 * buffer was 1×1 (its parent carried `display: contents`, so the fit measured a
 * 0×0 box) and every stroke was drawn `width × deviceWidth` pixels wide, so a
 * single red pixel was stretched across the whole page.
 */
test("the board is the page: one circle covers a circle", async ({ page }) => {
  await openMathRoom(page);

  // The canvas is the page's own box — not a stretched box, not an offset one.
  const boxes = await page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="ink-canvas"]') as HTMLCanvasElement;
    const image = document.querySelector('[data-testid="stage-image"]') as HTMLImageElement;
    const c = canvas.getBoundingClientRect();
    const i = image.getBoundingClientRect();
    return {
      backing: [canvas.width, canvas.height],
      css: [c.x, c.y, c.width, c.height],
      image: [i.x, i.y, i.width, i.height],
    };
  });
  expect(boxes.backing[0], "the pixel buffer collapsed to a sliver").toBeGreaterThan(100);
  expect(boxes.backing[1]).toBeGreaterThan(100);
  for (const [axis, a, b] of [
    ["x", boxes.css[0]!, boxes.image[0]!],
    ["y", boxes.css[1]!, boxes.image[1]!],
    ["width", boxes.css[2]!, boxes.image[2]!],
    ["height", boxes.css[3]!, boxes.image[3]!],
  ] as const) {
    expect(Math.abs(a - b), `the board and the page disagree on ${axis}`).toBeLessThanOrEqual(2);
  }

  await drawCircle(page);
  await expect(page.getByTestId("ink-count")).toContainText("علامة");
  // A circle around one line is a mark. The bug painted 100% of the page.
  expect(await redShareOfCanvas(page), "the page is covered in ink").toBeLessThan(0.03);
});

test("the picture the tutor receives is the marked page, not a red rectangle", async ({ page }) => {
  await openMathRoom(page);
  await drawCircle(page);
  await sendChatMessage(page, "ما هذا الذي حددته؟");
  await expectTutorReply(page, VISION_MARKER);

  // The exported picture is measured, not trusted: the same width bug was baked
  // into it, so the tutor was looking at a red page and reading nothing.
  const share = await redShareOfImage(page, "msg-attachment");
  expect(share, "the exported page is a red rectangle").toBeLessThan(0.03);
});
