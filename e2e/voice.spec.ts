import { expect, test, type Page } from "@playwright/test";
import {
  installVoiceStubs,
  login,
  NO_RAG_PHRASE,
  NO_RETRIEVED_PLACEHOLDER,
  RAG_CONTEXT_PHRASE,
  sendChatMessage,
  startFirstLesson,
  STT_TRANSCRIPT,
  voiceTestState,
} from "./helpers.js";

/**
 * Voice conversation (سؤال بصوت): STT/TTS through the REAL stack. The browser
 * Web Speech APIs themselves cannot be automated with real audio, so this
 * suite injects deterministic stubs (installVoiceStubs) and exercises the real
 * UI: mic → transcript appears in the input for review → edit → send through
 * the real server → tutor reply → spoken aloud (auto after a voice turn, or
 * via 🔊 on the bubble) → stoppable. Text chat + Vision stay untouched.
 */
test.describe.configure({ mode: "serial" });

async function tutorReplyText(page: Page): Promise<string> {
  const tutorMsgs = page.getByTestId("msg-tutor");
  await expect(tutorMsgs).toHaveCount(1, { timeout: 30_000 });
  const text = (await tutorMsgs.first().locator("p").textContent()) ?? "";
  expect(text.length).toBeGreaterThan(0);
  return text;
}

test("A1: a voice question is transcribed, editable, sent, and the tutor reply is spoken + stoppable", async ({ page }) => {
  await installVoiceStubs(page);
  await login(page);
  await startFirstLesson(page);

  // Ask by voice: the mic button starts listening, then transcribes into the
  // input for review.
  await page.getByTestId("voice-input").click();
  await expect(page.getByTestId("voice-listening")).toBeVisible({ timeout: 5_000 });
  await expect(page.getByTestId("chat-input")).toHaveValue(STT_TRANSCRIPT, { timeout: 10_000 });
  // The listening chip clears once dictation ends on its own.
  await expect(page.getByTestId("voice-listening")).toHaveCount(0);

  // Review step: the student edits the resulting text before sending.
  const reviewed = "اذكر مثالًا على الجمع مع إعادة التجميع، واشرح خطوة التجميع";
  await page.getByTestId("chat-input").fill(reviewed);
  await page.getByTestId("send-message").click();

  // Tutor replies with RAG grounding intact (voice changes nothing server-side).
  const reply = await tutorReplyText(page);
  expect(reply).toContain(RAG_CONTEXT_PHRASE);
  expect(reply).not.toContain(NO_RAG_PHRASE);
  expect(reply).not.toContain(NO_RETRIEVED_PLACEHOLDER);
  await expect(page.getByTestId("msg-user").first().locator("p")).toHaveText(reviewed);

  // Auto-speak: because this turn was asked by voice, the reply is read aloud.
  const state = await voiceTestState(page);
  expect(state.spoken).toHaveLength(1);
  expect(state.spoken[0].text).toBe(reply);

  // The speaking status is visible, and the student can stop the audio.
  await expect(page.getByTestId("speak-status")).toBeVisible();
  // Note: the absolute cancel count is not asserted because React StrictMode
  // (dev) double-mounts the room, running the "leave chat" cleanup once early.
  const cancelsBefore = (await voiceTestState(page)).cancelCount;
  await page.getByTestId("stop-tts").click();
  await expect(page.getByTestId("speak-status")).toHaveCount(0);
  const afterStop = await voiceTestState(page);
  expect(afterStop.cancelCount).toBe(cancelsBefore + 1);
});

test("A2: a typed question does not auto-speak; the 🔊 button speaks a reply and stop works", async ({ page }) => {
  await installVoiceStubs(page);
  await login(page);
  await startFirstLesson(page);

  // Typed (not voiced) question → no auto-speak.
  await sendChatMessage(page, "ما هي خطوات الجمع مع إعادة التجميع؟");
  const reply = await tutorReplyText(page);
  expect(reply).toContain(RAG_CONTEXT_PHRASE);
  let state = await voiceTestState(page);
  expect(state.spoken).toHaveLength(0);
  await expect(page.getByTestId("speak-status")).toHaveCount(0);

  // Manual listen: the 🔊 button on the tutor bubble speaks that reply.
  await page.getByTestId("speak-reply").first().click();
  state = await voiceTestState(page);
  expect(state.spoken).toHaveLength(1);
  expect(state.spoken[0].text).toBe(reply);
  await expect(page.getByTestId("speak-status")).toBeVisible();

  // Stop the reading.
  const cancelsBefore = (await voiceTestState(page)).cancelCount;
  await page.getByTestId("stop-tts").click();
  await expect(page.getByTestId("speak-status")).toHaveCount(0);
  const afterStop = await voiceTestState(page);
  expect(afterStop.cancelCount).toBe(cancelsBefore + 1);
});

test("A3: browsers without SpeechRecognition show a clear, actionable error", async ({ page }) => {
  // Simulate a browser with no speech-to-text support.
  await page.addInitScript(() => {
    const wnd = window as unknown as Record<string, unknown>;
    const undef = (key: string) => {
      try {
        Object.defineProperty(wnd, key, { value: undefined, configurable: true, writable: true });
      } catch {
        try {
          wnd[key] = undefined;
        } catch {
          /* environment exposes a read-only API — treat as not-overridable */
        }
      }
    };
    undef("SpeechRecognition");
    undef("webkitSpeechRecognition");
  });
  await login(page);
  await startFirstLesson(page);

  await page.getByTestId("voice-input").click();
  await expect(page.getByTestId("chat-error")).toContainText("غير مدعوم");
  await expect(page.getByTestId("voice-listening")).toHaveCount(0);
  await expect(page.getByTestId("msg-user")).toHaveCount(0);
});