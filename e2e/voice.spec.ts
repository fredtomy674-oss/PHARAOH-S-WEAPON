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
  // D-043 — a math lesson is dictated and narrated in Arabic, even though the
  // stub browser also has an English voice installed (listed second).
  expect(state.recognitionLang).toBe("ar-EG");
  expect(state.spoken[0].lang).toBe("ar-EG");

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
  expect(state.spoken[0].lang).toBe("ar-EG");
  await expect(page.getByTestId("speak-status")).toBeVisible();
  // A machine that has the voice is never nagged about a missing one.
  await expect(page.getByTestId("chat-error")).toHaveCount(0);

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

/**
 * D-043 — the real-world report: on a machine with no Arabic voice installed,
 * the browser read the Arabic reply with its default (English) voice. The tag
 * is now always the lesson's language, and the missing voice is stated plainly
 * instead of leaving the student wondering what they just heard.
 */
test("A4: a machine with no voice for the lesson language is told plainly", async ({ page }) => {
  // Only an English voice is installed — an Arabic lesson on this machine.
  await installVoiceStubs(page, STT_TRANSCRIPT, [{ lang: "en-US", name: "Test English Voice" }]);
  await login(page);
  await startFirstLesson(page);

  await sendChatMessage(page, "ما هي خطوات الجمع مع إعادة التجميع؟");
  const reply = await tutorReplyText(page);
  await page.getByTestId("speak-reply").first().click();

  // The utterance still carries the right language tag (so any engine that can
  // speak Arabic will use it)...
  const state = await voiceTestState(page);
  expect(state.spoken).toHaveLength(1);
  expect(state.spoken[0].text).toBe(reply);
  expect(state.spoken[0].lang).toBe("ar-EG");
  // ...and the student gets an actionable message rather than wrong audio.
  await expect(page.getByTestId("chat-error")).toContainText("لا يوجد صوت العربية");
  await expect(page.getByTestId("chat-error")).toContainText("Language options");
});