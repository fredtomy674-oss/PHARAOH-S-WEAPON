import { expect, test, type Page } from "@playwright/test";
import {
  forceNoServerSpeech,
  installVoiceStubs,
  login,
  NO_RAG_PHRASE,
  NO_RETRIEVED_PLACEHOLDER,
  openRoomTools,
  RAG_CONTEXT_PHRASE,
  sendChatMessage,
  startFirstLesson,
  STT_TRANSCRIPT,
  STUB_VOICES,
  voiceTestState,
} from "./helpers.js";

/**
 * Voice conversation (سؤال بصوت): STT + TTS through the REAL stack. The browser
 * Web Speech APIs themselves cannot be automated with real audio, so this suite
 * injects deterministic stubs (installVoiceStubs) and exercises the real UI:
 * mic → transcript appears in the input for review → edit → send through the
 * real server → tutor reply → spoken aloud (PHASE 166: EVERY reply, by default,
 * via the auto-read preference — a voice turn spoke before it too; and the 🔊
 * button on any bubble is "listen again") → stoppable. Text chat + Vision stay
 * untouched.
 *
 * PHASE 40 (D-044): the reply is now *heard* through the server's own voice —
 * the E2E backend runs a deterministic local speech provider — and the browser
 * voice is the fallback (forced with a 503 in A4/A6). Both paths are asserted,
 * because both are real deployments.
 *
 * PHASE 166: `login` switches the auto-read preference OFF unless a spec asks
 * for `keepAutoRead: true`, so only the specs ABOUT sound (A2, A8) hear it.
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

  // PHASE 170 — the mic lives in the room's «أدوات» sheet now.
  await openRoomTools(page);
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

/**
 * PHASE 166 — «القراءة التلقائية»: the owner asked in so many words that every
 * reply be heard without pressing anything («اريد ان يكون الرد تلقائى مستمع
 * بدون الحاجه الى الضغط على زر الاستماع»), and that 🔊 become "listen again".
 * This test walks the whole contract on the shipping default.
 */
test("A2: every reply is read aloud automatically; the switch silences it; 🔊 replays from the server", async ({ page }) => {
  await installVoiceStubs(page);
  // The other suites ask `login` for deterministic silence; this one keeps the
  // shipping default (auto-read ON) because that IS the behaviour under test.
  await login(page, undefined, undefined, "home-screen", { keepAutoRead: true });
  await startFirstLesson(page);

  // PHASE 170 — the auto-read switch lives in the «أدوات» sheet now.
  await openRoomTools(page);
  // The switch ships ON and tells assistive tech so.
  const toggle = page.getByTestId("auto-read-toggle");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  // Typed (not voiced) question → the reply is read aloud anyway, sentence by
  // sentence, by this machine's own voice — with no button pressed.
  await sendChatMessage(page, "ما هي خطوات الجمع مع إعادة التجميع؟");
  const reply = await tutorReplyText(page);
  expect(reply).toContain(RAG_CONTEXT_PHRASE);
  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(async () => (await voiceTestState(page)).spoken.length, { timeout: 15_000 })
    .toBeGreaterThan(0);
  let state = await voiceTestState(page);
  expect(state.spoken[0]!.lang).toBe("ar-EG");
  expect(state.spoken[0]!.text).not.toContain("**");
  // This machine has the voice: the server was never asked (narration is paid).
  expect(state.audio.plays).toBe(0);

  // The automatic reading is stoppable like any other.
  const cancelsBefore = state.cancelCount;
  await page.getByTestId("stop-tts").click();
  await expect(page.getByTestId("speak-status")).toHaveCount(0);
  const afterStop = await voiceTestState(page);
  expect(afterStop.cancelCount).toBeGreaterThan(cancelsBefore);
  await page.waitForTimeout(600);
  expect((await voiceTestState(page)).spoken).toHaveLength(afterStop.spoken.length);

  // A student who wants silence turns the switch off — and the next reply is
  // really silent: nothing spoken, nothing played, no status.
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  const silentBefore = (await voiceTestState(page)).spoken.length;
  await sendChatMessage(page, "أعد الشرح باختصار من فضلك");
  await expect(page.getByTestId("msg-tutor")).toHaveCount(2, { timeout: 30_000 });
  await page.waitForTimeout(800);
  const silentAfter = await voiceTestState(page);
  expect(silentAfter.spoken.length).toBe(silentBefore);
  expect(silentAfter.audio.plays).toBe(0);
  await expect(page.getByTestId("speak-status")).toHaveCount(0);

  // 🔊 on any reply remains "listen again": the server's voice, sentence by
  // sentence (PHASE 57) — and it is stoppable.
  await page.getByTestId("speak-reply").last().click();
  await expect.poll(async () => (await voiceTestState(page)).pieces.started, { timeout: 15_000 }).toBeGreaterThan(0);
  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 15_000 });
  state = await voiceTestState(page);
  expect(state.pieces.decodeFailures).toBe(0);
  expect(state.audio.plays).toBe(0);
  await expect(page.getByTestId("chat-error")).toHaveCount(0);

  const stoppedBefore = state.pieces.stopped;
  await page.getByTestId("stop-tts").click();
  await expect(page.getByTestId("speak-status")).toHaveCount(0);
  const afterStop2 = await voiceTestState(page);
  expect(afterStop2.pieces.stopped).toBeGreaterThan(stoppedBefore);
  const startedAtStop = afterStop2.pieces.started;
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

  await openRoomTools(page);
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

  // PHASE 170 — the mic lives in the room's «أدوات» sheet now.
  await openRoomTools(page);
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
 * PHASE 78 decided the honest outcome: an Arabic reply is never handed to the
 * machine's default English voice. The room stays silent — no wrong-language
 * audio — and states plainly how to add the voice.
 */
test("A6: no server voice and no voice for the language is stated plainly", async ({ page }) => {
  // Only an English voice is installed — an Arabic lesson on this machine.
  await installVoiceStubs(page, STT_TRANSCRIPT, [{ lang: "en-US", name: "Test English Voice" }]);
  await forceNoServerSpeech(page);
  await login(page);
  await startFirstLesson(page);

  await sendChatMessage(page, "ما هي خطوات الجمع مع إعادة التجميع؟");
  await tutorReplyText(page);
  await page.getByTestId("speak-reply").first().click();

  // The server answers 503 and the fallback refuses to read Arabic in the
  // machine's English voice: nothing is spoken, and the student gets the
  // actionable notice instead of wrong-language audio.
  //
  // PHASE 183 (D-066) — a missing device voice is a dismissible warning, not
  // a dead `chat-error`: the room keeps listening, the reply stays written, and
  // the note can be hidden without leaving the lesson. Assert that contract.
  const notice = page.getByTestId("voice-warning");
  await expect(notice).toContainText("لا يوجد صوت العربية", { timeout: 15_000 });
  await expect(notice).toContainText("الردّ مكتوب");
  const state = await voiceTestState(page);
  expect(state.spoken.length).toBe(0);
  expect(state.audio.plays).toBe(0);
  await expect(page.getByTestId("chat-error")).toHaveCount(0);
  await page.getByTestId("voice-warning-dismiss").click();
  await expect(notice).toHaveCount(0);
});

/**
 * PHASE 166 — the defect behind the owner's «بعد أول 3 ردود الاستماع لا يعمل»:
 * mobile engines sometimes accept an utterance and then go silent forever — no
 * start event, no end event, no error — and every later sentence queues behind
 * it. The room now watches every utterance: it revives the engine (cancel +
 * resume + a hand-over in a later task, PHASE 167) and only then declares it
 * wedged. This test models exactly that engine — the FIRST utterance is
 * accepted and stays completely silent.
 */
test("A8: an utterance that never starts or ends is revived, not left frozen", async ({ page }) => {
  await installVoiceStubs(page, STT_TRANSCRIPT, STUB_VOICES, { stallFirst: true });
  await login(page, undefined, undefined, "home-screen", { keepAutoRead: true });
  await startFirstLesson(page);

  await sendChatMessage(page, "ما هي خطوات الجمع مع إعادة التجميع؟");
  await tutorReplyText(page);

  // The first utterance stalls; within the watch budget the engine is revived
  // (cancel + resume) and the same sentence is handed over again — after the
  // PHASE 167 gap, so the re-hand is polled for instead of assumed to have
  // happened the instant `resume` was counted.
  await expect
    .poll(async () => (await voiceTestState(page)).resumeCount, { timeout: 25_000 })
    .toBeGreaterThan(0);
  await expect
    .poll(async () => (await voiceTestState(page)).spoken.length, { timeout: 25_000 })
    .toBeGreaterThanOrEqual(2);

  // And the reply keeps being read after the revival: the queue is not frozen,
  // the reading is in the lesson's own language — this is the part the old room
  // got wrong (it went silent for every later reply).
  await expect
    .poll(async () => (await voiceTestState(page)).spoken.length, { timeout: 25_000 })
    .toBeGreaterThan(2);
  const state = await voiceTestState(page);
  expect(state.spoken[0]!.lang).toBe("ar-EG");
  await expect(page.getByTestId("chat-error")).toHaveCount(0);
});

/**
 * PHASE 167 — the engine that never answers at all, no matter how many times
 * it is asked. The old room spent one same-task revive on it, declared it
 * wedged and went silent for the rest of the session — the 🔊 button included,
 * which could never say why. Now: both revive rounds hand the sentence over in
 * later tasks (the Android-safe way), the wedge is stated honestly instead of
 * pretended, and an explicit press re-arms the engine.
 */
test("A9: a permanently dead engine is stated honestly, and 🔊 re-arms it", async ({ page }) => {
  await installVoiceStubs(page, STT_TRANSCRIPT, STUB_VOICES, { stallAlways: true });
  await forceNoServerSpeech(page);
  await login(page, undefined, undefined, "home-screen", { keepAutoRead: true });
  await startFirstLesson(page);

  await sendChatMessage(page, "ما هي خطوات الجمع مع إعادة التجميع؟");
  await tutorReplyText(page);

  // Both revive rounds are spent on the first sentence (cancel + resume twice),
  // each re-hand in a later task — not the old same-task hand-over.
  await expect
    .poll(async () => (await voiceTestState(page)).resumeCount, { timeout: 40_000 })
    .toBeGreaterThanOrEqual(2);

  // 🔊 is not a dead button on a wedged engine: the press re-arms the local
  // voice, and the reply is handed to it again.
  const before = await voiceTestState(page);
  await page.getByTestId("speak-reply").last().click();
  await expect
    .poll(async () => (await voiceTestState(page)).resumeCount, { timeout: 40_000 })
    .toBeGreaterThan(before.resumeCount);

  // What remains silent is explained once — with the one act that really clears
  // a wedged engine: a reload. No more unexplained silence.
  await expect(page.getByTestId("chat-error")).toContainText("أعد تحديث الصفحة", { timeout: 40_000 });
});
