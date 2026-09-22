import { expect, test, type Page } from "@playwright/test";
import {
  attachImage,
  login,
  NO_RAG_PHRASE,
  NO_RETRIEVED_PLACEHOLDER,
  RAG_CONTEXT_PHRASE,
  sendChatMessage,
  startFirstLesson,
  VISION_MARKER,
} from "./helpers.js";

/**
 * Vision upload (سؤال مصور): a student photographs a question, attaches it to
 * a tutor turn, and the tutor reads it. Exercise the REAL stack: browser file
 * input → Vite proxy → Fastify → SQLite attachment BLOB → multimodal mock
 * provider → persisted history + attachment GET (ownership-guarded).
 */
test.describe.configure({ mode: "serial" });

async function expectTutorReply(page: Page, contain: string): Promise<string> {
  const tutorMsgs = page.getByTestId("msg-tutor");
  await expect(tutorMsgs).toHaveCount(1, { timeout: 30_000 });
  const text = (await tutorMsgs.first().textContent()) ?? "";
  expect(text).toContain(contain);
  return text;
}

test("V1: a photographed question is attached, read by the tutor, and rendered back", async ({ page }) => {
  await login(page);
  await startFirstLesson(page);

  await attachImage(page);
  await sendChatMessage(page, "حل السؤال الموجود في الصورة من فضلك");
  await expectTutorReply(page, VISION_MARKER);

  // Grounding stays on: RAG context is present, the "no retrieval" placeholder is not.
  await expect(page.getByTestId("msg-tutor").first()).toContainText(RAG_CONTEXT_PHRASE);
  await expect(page.getByTestId("msg-tutor").first()).not.toContainText(NO_RAG_PHRASE);
  await expect(page.getByTestId("msg-tutor").first()).not.toContainText(NO_RETRIEVED_PLACEHOLDER);

  // The user bubble renders the attached photo back (loaded through the proxy).
  const img = page.getByTestId("msg-attachment");
  await expect(img).toBeVisible();
  const src = await img.getAttribute("src");
  expect(src).toContain("/api/sessions/");
  expect(src).toContain("/attachments/");

  // The attachment endpoint actually serves bytes to its owner (cookie auth via proxy).
  const res = await page.request.get(src!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  const body = await res.body();
  expect(body.length).toBeGreaterThan(0);
});

test("V2: a photo-only message (no text) still gets a grounded tutor reply", async ({ page }) => {
  await login(page);
  await startFirstLesson(page);

  await attachImage(page);
  // No text: the send button enables on the photo alone.
  const send = page.getByTestId("send-message");
  await expect(send).toBeEnabled();
  await send.click();

  await expectTutorReply(page, VISION_MARKER);
  await expect(page.getByTestId("msg-tutor").first()).toContainText(RAG_CONTEXT_PHRASE);
  await expect(page.getByTestId("msg-tutor").first()).not.toContainText(NO_RAG_PHRASE);
});

test("V3: an over-size photo is rejected client-side with a clear message", async ({ page }) => {
  await login(page);
  await startFirstLesson(page);

  // 6 MB of zeros in a PNG shell — exceeds the 5 MB client cap.
  const oversized = Buffer.alloc(6 * 1024 * 1024);
  await page.getByTestId("attach-input").setInputFiles({
    name: "big.png",
    mimeType: "image/png",
    buffer: oversized,
  });
  await expect(page.getByTestId("chat-error")).toContainText("الصورة كبيرة جدًا");
  await expect(page.getByTestId("image-preview")).toHaveCount(0);
  await expect(page.getByTestId("msg-user")).toHaveCount(0);
});