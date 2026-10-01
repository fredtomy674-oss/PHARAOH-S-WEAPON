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
  // Only the formatted content blocks: the bubble also holds page chips and
  // the 🔊 button, which narration never reads. Joined with newlines, this is
  // exactly stripMarkdown(content) by the formatter's invariant — so the voice
  // tests verify spoken === shown, not spoken === chrome.
  const parts = await tutorMsgs.first().locator(".fmt-p, .fmt-ul, .fmt-ol, .fmt-h").allTextContents();
  const text = parts.join("\n");
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
  // PHASE 56 — measured: the server's voice needs 6.9–7.7s for a whole reply,
  // while the words themselves arrive over ~800ms. The reply is therefore read
  // sentence by sentence by this machine's own voice as the sentences arrive, and
  // the server is never asked — which is why nothing was played from a blob.
  // What is read is the reply itself: same language, no markdown left in it.
  await expect
    .poll(async () => (await voiceTestState(page)).spoken.length, { timeout: 15_000 })
    .toBeGreaterThan(0);
  expect(state.audio.plays).toBe(0);
  expect(state.spoken[0]!.lang).toBe("ar-EG");
  expect(state.spoken[0]!.text).not.toContain("**");

  // The speaking status is visible, and the student can stop it: the reply was
  // being read by this machine's voice, so stopping cancels that voice.
  const cancelsBefore = state.cancelCount;
  await page.getByTestId("stop-tts").click();
  await expect(page.getByTestId("speak-status")).toHaveCount(0);
  const afterStop = await voiceTestState(page);
  expect(afterStop.cancelCount).toBeGreaterThan(cancelsBefore);
  // Stopping really stops: the sentences still queued must never be read.
  await page.waitForTimeout(600);
  expect((await voiceTestState(page)).spoken).toHaveLength(afterStop.spoken.length);
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
  // PHASE 57 — measured: this button used to stay silent for the whole reply's
  // audio (6.9–7.7s for a 160-character reply) before a note played. It now asks
  // for the reply's voice *sentence by sentence*, so the counter moves as soon as
  // the first sentence exists (~3s, and near-instant on a repeat press because
  // each sentence is cached).
  await expect.poll(async () => (await voiceTestState(page)).pieces.started, { timeout: 15_000 }).toBeGreaterThan(0);
  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 15_000 });
  state = await voiceTestState(page);
  // Every piece the server sent was really decoded and played: no silent piece,
  // and no waiting for the whole-reply blob that this path replaces.
  expect(state.pieces.decodeFailures).toBe(0);
  expect(state.audio.plays).toBe(0);
  // Narration never nags the student — the server has a voice, so the machine's
  // voices are irrelevant to whether the reply can be heard.
  await expect(page.getByTestId("chat-error")).toHaveCount(0);

  // Stop the reading: the scheduled pieces are silenced, and the queue that
  // would have played the rest of the reply is dropped with them.
  const stoppedBefore = state.pieces.stopped;
  await page.getByTestId("stop-tts").click();
  await expect(page.getByTestId("speak-status")).toHaveCount(0);
  const afterStop = await voiceTestState(page);
  expect(afterStop.pieces.stopped).toBeGreaterThan(stoppedBefore);
  // Nothing that had not started may start after the stop.
  const startedAtStop = afterStop.pieces.started;
  await page.waitForTimeout(600);
  expect((await voiceTestState(page)).pieces.started).toBe(startedAtStop);
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

  // Polled: the audio comes from the server, so the counter is read once it has
  // really moved rather than the instant after the click.
  // PHASE 57 — progressively: the first sentence is played as soon as it exists
  // rather than after the whole reply's audio is built.
  await expect.poll(async () => (await voiceTestState(page)).pieces.started, { timeout: 15_000 }).toBeGreaterThan(0);
  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 15_000 });
  const state = await voiceTestState(page);
  // The server's WAVs really decoded and played, one piece at a time.
  expect(state.pieces.decodeFailures).toBe(0);
  // The browser was never asked to speak — no wrong-language audio, and no
  // scary "install a voice pack" message for a student who cannot act on it.
  expect(state.spoken).toHaveLength(0);
  await expect(page.getByTestId("chat-error")).toHaveCount(0);
});

/**
 * PHASE 56 + 57 — the same guarantee on the *automatic* path, which is the one
 * that used to have no voice at all until the turn was stored: a machine with no
 * Arabic voice asks by voice, so the room asks the SERVER to narrate the turn as
 * it is written (`speak: true`) and plays each sentence's audio the moment it
 * arrives — on the same stream as the text. The browser's own voice is never
 * asked (measured: no voice for Arabic), so nothing may be read twice and
 * nothing may be read in the wrong language.
 */
test("A7: a voice-asked turn on a machine with no Arabic voice is narrated by the server", async ({ page }) => {
  await installVoiceStubs(page, STT_TRANSCRIPT, [{ lang: "en-US", name: "Test English Voice" }]);
  await login(page);
  await startFirstLesson(page);

  // Ask by voice, so the room tries to narrate the reply as it arrives.
  await page.getByTestId("voice-input").click();
  await expect(page.getByTestId("chat-input")).toHaveValue(STT_TRANSCRIPT, { timeout: 10_000 });
  await page.getByTestId("send-message").click();
  await tutorReplyText(page);

  // The server narrates this turn, sentence by sentence, as the reply streams.
  await expect.poll(async () => (await voiceTestState(page)).pieces.started, { timeout: 15_000 }).toBeGreaterThan(0);
  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 15_000 });
  const state = await voiceTestState(page);
  // Real server audio, really decoded — this is not a blob the app pretended to
  // play, and the machine's voices were irrelevant to it.
  expect(state.pieces.decodeFailures).toBe(0);
  // The browser was asked once, found no Arabic voice, and that attempt was
  // abandoned — it must not have read the reply in English.
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
  // Polled, not read once: the reply goes to the server first (a 503 here), so
  // the browser's voice starts a moment after the click.
  await expect.poll(async () => (await voiceTestState(page)).spoken.length, { timeout: 15_000 }).toBe(1);
  const state = await voiceTestState(page);
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
  // Polled, not read once: the reply first goes to the server (which answers 503
  // here), so the browser's voice starts a moment after the click.
  await expect.poll(async () => (await voiceTestState(page)).spoken.length, { timeout: 15_000 }).toBe(1);
  const state = await voiceTestState(page);
  expect(state.spoken[0].text).toBe(reply);
  expect(state.spoken[0].lang).toBe("ar-EG");
  // ...and the student gets an actionable message rather than wrong audio.
  await expect(page.getByTestId("chat-error")).toContainText("لا يوجد صوت العربية");
  await expect(page.getByTestId("chat-error")).toContainText("Language options");
});
