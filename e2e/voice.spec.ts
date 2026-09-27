import { expect, test, type Page } from "@playwright/test";
import {
  forceNoServerSpeech,
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
 * Voice conversation (سؤال بصوت): STT + TTS through the REAL stack. The browser
 * Web Speech APIs themselves cannot be automated with real audio, so this suite
 * injects deterministic stubs (installVoiceStubs) and exercises the real UI:
 * mic → transcript appears in the input for review → edit → send through the
 * real server → tutor reply → spoken aloud (auto after a voice turn, or via 🔊
 * on the bubble) → stoppable. Text chat + Vision stay untouched.
 *
 * PHASE 40 (D-044): the reply is now *heard* through the server's own voice —
 * the E2E backend runs a deterministic local speech provider — and the browser
 * voice is the fallback (forced with a 503 in A4/A6). Both paths are asserted,
 * because both are real deployments.
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
  // D-043 — dictation follows the lesson (Arabic here), never a hardcoded value.
  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 15_000 });
  const state = await voiceTestState(page);
  expect(state.recognitionLang).toBe("ar-EG");
  // D-044 — the audio came from the server, not from this machine's voices.
  expect(state.audio.plays).toBe(1);
  expect(state.audio.lastSrc.startsWith("blob:")).toBe(true);
  expect(state.spoken).toHaveLength(0);

  // The speaking status is visible, and the student can stop the audio.
  const pausesBefore = state.audio.pauses;
  await page.getByTestId("stop-tts").click();
  await expect(page.getByTestId("speak-status")).toHaveCount(0);
  const afterStop = await voiceTestState(page);
  expect(afterStop.audio.pauses).toBe(pausesBefore + 1);
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
  expect(state.audio.plays).toBe(0);
  await expect(page.getByTestId("speak-status")).toHaveCount(0);

  // Manual listen: the 🔊 button on the tutor bubble speaks that reply.
  await page.getByTestId("speak-reply").first().click();
  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 15_000 });
  state = await voiceTestState(page);
  expect(state.audio.plays).toBe(1);
  expect(state.audio.lastSrc.startsWith("blob:")).toBe(true);
  // Narration never nags the student — the server has a voice, so the machine's
  // voices are irrelevant to whether the reply can be heard.
  await expect(page.getByTestId("chat-error")).toHaveCount(0);

  // Stop the reading.
  const pausesBefore = state.audio.pauses;
  await page.getByTestId("stop-tts").click();
  await expect(page.getByTestId("speak-status")).toHaveCount(0);
  const afterStop = await voiceTestState(page);
  expect(afterStop.audio.pauses).toBe(pausesBefore + 1);
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
 * D-044 — the report that started this phase: on a machine with no Arabic voice
 * installed, the student was told to change Windows settings (or simply heard
 * English). The server's own voice removes both: the reply is now heard in
 * Arabic on a machine that has *no* Arabic voice at all, and nothing is asked
 * of the student.
 */
test("A4: a machine with no Arabic voice still hears the Arabic reply from the server", async ({ page }) => {
  // Only an English voice is installed — the worst case the old code had.
  await installVoiceStubs(page, STT_TRANSCRIPT, [{ lang: "en-US", name: "Test English Voice" }]);
  await login(page);
  await startFirstLesson(page);

  await sendChatMessage(page, "ما هي خطوات الجمع مع إعادة التجميع؟");
  await tutorReplyText(page);
  await page.getByTestId("speak-reply").first().click();

  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 15_000 });
  const state = await voiceTestState(page);
  expect(state.audio.plays).toBe(1);
  // The browser was never asked to speak — no wrong-language audio, and no
  // scary "install a voice pack" message for a student who cannot act on it.
  expect(state.spoken).toHaveLength(0);
  await expect(page.getByTestId("chat-error")).toHaveCount(0);
});

/**
 * The other half of D-044: when the server has no voice (offline deployment,
 * `SPEECH_PROVIDER=none`, or an outage) the app must not leave 🔊 dead — it
 * reads the reply with the browser, in the lesson's language, silently.
 */
test("A5: with no server voice the app falls back to the browser voice", async ({ page }) => {
  await installVoiceStubs(page);
  await forceNoServerSpeech(page);
  await login(page);
  await startFirstLesson(page);

  await sendChatMessage(page, "ما هي خطوات الجمع مع إعادة التجميع؟");
  const reply = await tutorReplyText(page);
  await page.getByTestId("speak-reply").first().click();

  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 15_000 });
  const state = await voiceTestState(page);
  expect(state.spoken).toHaveLength(1);
  expect(state.spoken[0].text).toBe(reply);
  expect(state.spoken[0].lang).toBe("ar-EG");
  expect(state.audio.plays).toBe(0);
  // A machine that has the voice is never nagged about a missing one.
  await expect(page.getByTestId("chat-error")).toHaveCount(0);
});

/**
 * Worst case with the fallback: no server voice AND no Arabic voice installed.
 * The student still gets sound plus a plain, actionable message — the notice
 * now describes the only situation it can still help with.
 */
test("A6: no server voice and no voice for the language is stated plainly", async ({ page }) => {
  // Only an English voice is installed — an Arabic lesson on this machine.
  await installVoiceStubs(page, STT_TRANSCRIPT, [{ lang: "en-US", name: "Test English Voice" }]);
  await forceNoServerSpeech(page);
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
