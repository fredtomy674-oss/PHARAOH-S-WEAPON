import { expect, test, type Page } from "@playwright/test";
import {
  attachDocument,
  docFixture,
  DOCUMENT_MARKER,
  login,
  NO_RAG_PHRASE,
  NO_RETRIEVED_PLACEHOLDER,
  RAG_CONTEXT_PHRASE,
  SAFE_REFUSAL_PHRASE,
  sendChatMessage,
  startFirstLesson,
} from "./helpers.js";

/**
 * Document upload (ملف سؤال في الدردشة) — Path A (PHASE 12): a student attaches
 * a PDF/DOCX/TXT file to a tutor turn; the server extracts a bounded text with
 * pure-JS parsers, feeds it to the tutor as document input (never the system
 * prompt), and the mock provider acknowledges it. Also exercises the
 * prompt-injection tripwire that re-scans the extracted file text server-side
 * before any model call. Scanned files (no text layer) fall back to OCR —
 * covered separately in ocr.spec.ts (PHASE 19).
 */
test.describe.configure({ mode: "serial" });

async function expectTutorReply(page: Page, contain: string): Promise<string> {
  const tutorMsgs = page.getByTestId("msg-tutor");
  await expect(tutorMsgs).toHaveCount(1, { timeout: 30_000 });
  const text = (await tutorMsgs.first().textContent()) ?? "";
  expect(text).toContain(contain);
  return text;
}

test("D1: a PDF is attached, read by the tutor, grounded on the lesson, and rendered back as a chip", async ({ page }) => {
  await login(page);
  await startFirstLesson(page);

  await attachDocument(page, "question.pdf", docFixture("question.pdf"));
  await sendChatMessage(page, "حل السؤال الموجود في الملف المرفق من فضلك");

  // The mock provider echoes the server-extracted PDF text back into the reply.
  const text = await expectTutorReply(page, DOCUMENT_MARKER);
  expect(text).toContain("TutorFixturePDF 123");
  expect(text).toContain("question.pdf");

  // Grounding stays on: RAG context is present, the "no retrieval" placeholders are not.
  await expect(page.getByTestId("msg-tutor").first()).toContainText(RAG_CONTEXT_PHRASE);
  await expect(page.getByTestId("msg-tutor").first()).not.toContainText(NO_RAG_PHRASE);
  await expect(page.getByTestId("msg-tutor").first()).not.toContainText(NO_RETRIEVED_PLACEHOLDER);

  // The user bubble renders the attached file chip.
  await expect(page.getByTestId("msg-document")).toBeVisible();
});

test("D2: a document-only message (no typed text) is still read and answered", async ({ page }) => {
  await login(page);
  await startFirstLesson(page);

  await attachDocument(page, "question.docx", docFixture("question.docx"));
  // No text typed: the send button enables on the attached document alone.
  const send = page.getByTestId("send-message");
  await expect(send).toBeEnabled();
  await send.click();

  const text = await expectTutorReply(page, DOCUMENT_MARKER);
  expect(text).toContain("TutorFixtureDOCX 456");
  await expect(page.getByTestId("msg-document")).toBeVisible();
});

test("D3: prompt injection hidden inside an attached file triggers the safe refusal, not the model", async ({ page }) => {
  await login(page);
  await startFirstLesson(page);

  await attachDocument(page, "injection.txt", docFixture("injection.txt"));
  await sendChatMessage(page, "اقرأ الملف المرفق");

  // The tripwire re-scan intercepts the turn before any model call: the tutor
  // refuses politely and NEVER emits the "document read" marker.
  const text = await expectTutorReply(page, SAFE_REFUSAL_PHRASE);
  expect(text).not.toContain(DOCUMENT_MARKER);
});