import { expect, test } from "@playwright/test";
import {
  freezeLiveSpeech,
  installVoiceStubs,
  isLiveReady,
  liveSessionCount,
  login,
  pushLiveInterim,
  pushLiveUtterance,
  pushMicVoice,
  startFirstLesson,
  voiceTestState,
  waitLiveReady,
} from "./helpers.js";

/**
 * PHASE 168/169 — «المحادثة الحيّة»: one open microphone for the whole lesson.
 *
 * The owner asked in so many words («محادثة حيه… يسمع و يفهم و يرد خلال
 * المحادثة») after measuring ~7s between question and answer — and then asked
 * for the other half (PHASE 169): the microphone must NOT close while the
 * tutor speaks («اريد المحادثة تفاعلية… الطالب ممكن يقاطع المعلم اثناء الشرح…
 * ويتم استثناء صوت المعلم فقط») — the interruption is a spoken act, and only
 * the tutor's own voice must be excluded. His phone proved why that needs
 * rules: the open mic heard the phone's speaker, «transcribed» the tutor as
 * the student, and the tutor answered itself in a loop.
 *
 * The Web Speech APIs cannot be automated with real audio, so this suite drives
 * the same deterministic stubs as voice.spec.ts — with `live: true`, which
 * models a *continuous* session fed fragment by fragment
 * (`pushLiveUtterance`/`pushLiveInterim`) and the echo-cancelled probe
 * (`pushMicVoice`), and `freezeLiveSpeech`, which holds one spoken utterance
 * open so that both halves of the phase are PROVED rather than timed: the echo
 * must not silence the tutor, and the student's own words must.
 */
test.describe.configure({ mode: "serial" });

test("B1: the tutor's own echo is never a question — and a real interruption still silences it", async ({ page }) => {
  await installVoiceStubs(page, undefined, undefined, { live: true });
  // Auto-read is OFF (login's default): every sound in this test is the live
  // conversation itself — a conversation is spoken by design, not by preference.
  await login(page);
  await startFirstLesson(page);

  await page.getByTestId("live-conversation-toggle").click();
  await expect(page.getByTestId("live-hud")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("live-state")).toContainText("أسمعك");
  await expect(page.getByTestId("live-conversation-toggle")).toHaveAttribute("aria-pressed", "true");
  await waitLiveReady(page);
  // Hold the tutor's voice open *from before it ever starts*: with the engine
  // frozen, only the room's own stop can silence this reading.
  await freezeLiveSpeech(page);

  const question = "اشرح لي الجمع مع إعادة التجميع";
  await pushLiveInterim(page, "اشرح لي");
  await expect(page.getByTestId("live-interim")).toContainText("اشرح لي");
  // The utterance goes out by itself on the silence: the student's own bubble
  // is proof, and nothing was pressed to produce it.
  await pushLiveUtterance(page, question);
  await expect(page.getByTestId("msg-user-live")).toBeVisible({ timeout: 10_000 });
  expect((await voiceTestState(page)).recognitionLang).toBe("ar-EG");

  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("live-hud")).toHaveAttribute("data-state", "speaking");
  // PHASE 169 — the microphone stays OPEN while the tutor speaks: full duplex
  // on purpose. Echo is excluded by rules, never by closing the mic.
  expect(await isLiveReady(page)).toBe(true);
  await expect(page.getByTestId("live-interrupt")).toBeVisible();
  await expect.poll(async () => (await voiceTestState(page)).spoken.length, { timeout: 20_000 }).toBeGreaterThan(0);
  const heard = await voiceTestState(page);
  expect(heard.spoken[0]!.lang).toBe("ar-EG");
  expect(heard.audio.plays).toBe(0);

  // ---- the echo attack: the phone's speaker reads the tutor's own words back
  // into the open microphone — exactly what the owner's phone did.
  const cancelsBeforeEcho = heard.cancelCount;
  const echo = heard.spoken[0]!.text;
  await pushLiveInterim(page, echo);
  // The words are the tutor's, so they never appear as the student's caption…
  await expect(page.getByTestId("live-interim")).toHaveCount(0);
  await pushLiveUtterance(page, echo);
  // …and after the silence window releases them they are dropped silently:
  // no question is sent, and the tutor never stops reading.
  await page.waitForTimeout(1_600);
  await expect(page.getByTestId("msg-user")).toHaveCount(1);
  await expect(page.getByTestId("speak-status")).toBeVisible();
  expect((await voiceTestState(page)).cancelCount).toBe(cancelsBeforeEcho);

  // ---- a real interruption: the student's voice, with words that are not the
  // tutor's. The voice yields at once — the frozen engine proves the silence
  // is the room's stop, not a natural end.
  await pushMicVoice(page, true);
  await pushLiveInterim(page, "لحظة أستاذ");
  await expect(page.getByTestId("speak-status")).toHaveCount(0, { timeout: 5_000 });
  expect((await voiceTestState(page)).cancelCount).toBeGreaterThan(cancelsBeforeEcho);
  await expect(page.getByTestId("live-hud")).not.toHaveAttribute("data-state", "speaking");
  await pushLiveUtterance(page, "لحظة أستاذ");
  await pushLiveUtterance(page, "اشرح بمثال أسهل");
  await pushMicVoice(page, false);

  // The interruption became the next question — same voice, no buttons.
  await expect(page.getByTestId("msg-user")).toHaveCount(2, { timeout: 20_000 });
  await expect(page.getByTestId("msg-user").nth(1).locator("p")).toContainText("اشرح بمثال أسهل");

  // The spoken act is the interruption; the tap stays as the guaranteed one.
  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 20_000 });
  const cancelsBeforeTap = (await voiceTestState(page)).cancelCount;
  await page.getByTestId("live-interrupt").click();
  await expect(page.getByTestId("speak-status")).toHaveCount(0, { timeout: 5_000 });
  expect((await voiceTestState(page)).cancelCount).toBeGreaterThan(cancelsBeforeTap);

  // The student ends the mode himself: the strip goes and the mic closes.
  await page.getByTestId("live-exit").click();
  await expect(page.getByTestId("live-hud")).toHaveCount(0);
  await expect(page.getByTestId("live-conversation-toggle")).toHaveAttribute("aria-pressed", "false");
});

test("B2: back-to-back questions flow without touching anything", async ({ page }) => {
  await installVoiceStubs(page, undefined, undefined, { live: true });
  await login(page);
  await startFirstLesson(page);
  await page.getByTestId("live-conversation-toggle").click();
  await waitLiveReady(page);

  await pushMicVoice(page, true);
  await pushLiveUtterance(page, "ما هي خطوات الجمع مع إعادة التجميع؟");
  await pushMicVoice(page, false);
  await expect(page.getByTestId("msg-user-live")).toBeVisible({ timeout: 15_000 });

  // The student asks the next thing while the tutor is still working: the mic
  // is still open (PHASE 169), so the words are heard and kept, then sent the
  // moment the room is free — or directly, if the turn already ended. Either
  // way nothing is pressed and nothing is lost.
  await pushMicVoice(page, true);
  await pushLiveUtterance(page, "لماذا نجمّع العشرات؟");
  await pushMicVoice(page, false);
  await expect(page.getByTestId("msg-user")).toHaveCount(2, { timeout: 25_000 });
  await expect(page.getByTestId("msg-user").nth(1).locator("p")).toHaveText("لماذا نجمّع العشرات؟");

  // Two real answers, stored: the conversation continued by itself.
  await expect(page.getByTestId("msg-tutor")).toHaveCount(2, { timeout: 30_000 });

  // Once the tutor's voice is done, the strip settles back to listening —
  // the loop is open again with no press.
  await expect(page.getByTestId("live-hud")).toHaveAttribute("data-state", "listening", { timeout: 30_000 });
});

test("B3: a browser without SpeechRecognition says so and stays silent", async ({ page }) => {
  // Simulate a browser with no speech-to-text support (same shape as A3).
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

  await page.getByTestId("live-conversation-toggle").click();
  await expect(page.getByTestId("chat-error")).toContainText("غير مدعوم");
  await expect(page.getByTestId("live-hud")).toHaveCount(0);
  await expect(page.getByTestId("live-conversation-toggle")).toHaveAttribute("aria-pressed", "false");
});

test("B4: the conversation opens in the immersive «وضع المحادثة» — minimize keeps it alive, and the captions stay honest", async ({ page }) => {
  await installVoiceStubs(page, undefined, undefined, { live: true });
  await login(page);
  await startFirstLesson(page);

  await page.getByTestId("live-conversation-toggle").click();
  // PHASE 171 — the mode opens full-screen (the ChatGPT-like first impression
  // the owner asked for): the orb, the same honest state line, and the same
  // testids the strip always carried — one place at a time.
  await expect(page.getByTestId("voice-focus")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("voice-orb")).toBeVisible();
  await expect(page.getByTestId("live-hud")).toBeVisible();
  await expect(page.getByTestId("live-state")).toContainText("أسمعك");
  await waitLiveReady(page);
  // Frozen from before the first utterance: the reading stays open, so the
  // «قاطِعني» moment below is the room's stop, not a natural end (as in B1).
  await freezeLiveSpeech(page);

  // «للغرفة» folds it back to the calm strip — the microphone never closes.
  await page.getByTestId("voice-focus-minimize").click();
  await expect(page.getByTestId("voice-focus")).toHaveCount(0);
  await expect(page.getByTestId("live-hud")).toBeVisible();
  expect(await isLiveReady(page)).toBe(true);

  // And the strip's own door brings the full mode back.
  await page.getByTestId("voice-focus-expand").click();
  await expect(page.getByTestId("voice-focus")).toBeVisible();

  // A spoken question: its words appear as the student's own caption…
  await pushMicVoice(page, true);
  await pushLiveInterim(page, "ما هي خطوات الجمع");
  await expect(page.getByTestId("live-interim")).toContainText("خطوات الجمع");
  await pushLiveUtterance(page, "ما هي خطوات الجمع مع إعادة التجميع؟");
  await pushMicVoice(page, false);
  await expect(page.getByTestId("voice-user-caption")).toContainText("خطوات الجمع", { timeout: 15_000 });

  // …and the tutor's answer writes itself while it streams.
  await expect(page.getByTestId("voice-tutor-caption")).toContainText(/\S/, { timeout: 25_000 });

  // A real interruption is answered visibly: the flash says he was heard —
  // the mic stays open (PHASE 169) and the tutor yields.
  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("live-hud")).toHaveAttribute("data-state", "speaking");
  await pushMicVoice(page, true);
  await pushLiveInterim(page, "لحظة أستاذ");
  await expect(page.getByTestId("voice-barge")).toBeVisible({ timeout: 5_000 });
  await pushMicVoice(page, false);

  await page.getByTestId("live-exit").click();
  await expect(page.getByTestId("voice-focus")).toHaveCount(0);
  await expect(page.getByTestId("live-hud")).toHaveCount(0);
  await expect(page.getByTestId("live-conversation-toggle")).toHaveAttribute("aria-pressed", "false");
});

test("B5: a failure inside the immersive mode is stated where the child is looking", async ({ page }) => {
  await installVoiceStubs(page, undefined, undefined, { live: true });
  await login(page);
  await startFirstLesson(page);

  await page.getByTestId("live-conversation-toggle").click();
  await expect(page.getByTestId("voice-focus")).toBeVisible({ timeout: 10_000 });
  await waitLiveReady(page);

  // The turn itself is refused — a busy server, an outage. Before PHASE 172 the
  // room's notice line sat BEHIND the full-screen mode: the child saw a
  // conversation that simply "does not work" and was told nothing at all.
  const refuse = (route: import("@playwright/test").Route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "BUSY", message: "المعلّم مشغول الآن — حاول بعد لحظات" } }),
    });
  await page.route("**/api/sessions/*/messages/stream", refuse);
  await page.route("**/api/sessions/*/messages", refuse);

  await pushMicVoice(page, true);
  await pushLiveUtterance(page, "اشرح لي الجمع");
  await pushMicVoice(page, false);

  // The words were heard and the send was refused: the reason must be visible
  // inside the mode itself — same notice, same words as the room's own line.
  await expect(page.getByTestId("voice-notice")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("voice-notice")).toContainText("مشغول");
  await expect(page.getByTestId("voice-focus")).toBeVisible();
});

test("B6: a capture hiccup drops the probe, never the mode — the recognizer reopens and the words still arrive", async ({ page }) => {
  await installVoiceStubs(page, undefined, undefined, { live: true });
  await login(page);
  await startFirstLesson(page);

  await page.getByTestId("live-conversation-toggle").click();
  await expect(page.getByTestId("voice-focus")).toBeVisible({ timeout: 10_000 });
  await waitLiveReady(page);

  // PHASE 174 — the owner's phone ended the whole mode exactly here: the
  // recognizer's capture failed ("audio-capture" — the error this project
  // reproduced on a machine with no microphone) and the old code read it as
  // final. The echo probe is the page's only other consumer of that same
  // microphone, and it is an enhancement — so the ladder drops it and
  // reopens the recognizer: the words are the mode.
  const sessionsBefore = await liveSessionCount(page);
  await page.evaluate(() => {
    (window as unknown as { __speechPush: { error: (code: string) => void } }).__speechPush.error("audio-capture");
  });

  // The mode must NOT end, no error line may appear, and a fresh recognition
  // session must open — the receipt that the ladder ran.
  await expect(page.getByTestId("voice-focus")).toBeVisible();
  await expect(page.getByTestId("chat-error")).toHaveCount(0);
  await expect.poll(() => liveSessionCount(page), { timeout: 5_000 }).toBeGreaterThan(sessionsBefore);
  expect((await voiceTestState(page)).micProbeStops).toBeGreaterThan(0);

  // …and the words still reach the tutor and are answered: the probe's
  // absence costs a little latency, never the turn.
  await pushLiveUtterance(page, "ما هي خطوات الجمع");
  await expect(page.getByTestId("voice-user-caption")).toContainText("خطوات الجمع", { timeout: 15_000 });
  await expect(page.getByTestId("voice-tutor-caption")).toContainText(/\S/, { timeout: 25_000 });
});

test("B7: a touch device listens like its dictation — single-utterance sessions, no probe, and the words still arrive", async ({ browser }) => {
  // PHASE 175 — the owner's phone: the dictation key transcribes his speech
  // perfectly while live mode heard nothing. The difference is the shape —
  // live held TWO claims on one microphone (a continuous session + the echo
  // probe) where dictation holds one, single-utterance, session. A phone is
  // therefore the honest way to run this contract: touch-first, dictation
  // shape, and (on a real device) no probe at all.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  await context.addInitScript(() => {
    try {
      Object.defineProperty(navigator, "maxTouchPoints", { get: () => 1, configurable: true });
    } catch {
      /* the environment forbids the override — hasTouch alone already says touch */
    }
  });
  const page = await context.newPage();
  await installVoiceStubs(page, undefined, undefined, { live: true });
  await login(page);
  await startFirstLesson(page);

  await page.getByTestId("live-conversation-toggle").click();
  await expect(page.getByTestId("voice-focus")).toBeVisible({ timeout: 10_000 });
  await waitLiveReady(page);

  // The phone recipe, stated as facts: the session is a single-utterance one
  // (dictation's own shape) and the probe was never even requested.
  const opened = await voiceTestState(page);
  expect(opened.liveContinuous).toBe(false);
  expect(opened.micProbeCalls).toBe(0);

  // The words arrive, show as his caption, and go out by themselves…
  await pushLiveInterim(page, "اشرح لي الجمع");
  await expect(page.getByTestId("live-interim")).toContainText("الجمع");
  await pushLiveUtterance(page, "اشرح لي الجمع مع إعادة التجميع");
  await expect(page.getByTestId("msg-user-live")).toBeVisible({ timeout: 15_000 });

  // …the single-utterance session ends on its own final the way Chrome's do,
  // and the mode reopens it by itself — the session count is the receipt.
  await expect.poll(() => liveSessionCount(page), { timeout: 10_000 }).toBeGreaterThan(1);

  // The tutor answers in his own voice and the microphone is still open.
  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("live-hud")).toHaveAttribute("data-state", "speaking");
  expect(await isLiveReady(page)).toBe(true);
  await context.close();
});

test("B8: nine word-less seconds clear the field once — the probe goes and the session is rebuilt", async ({ page }) => {
  await installVoiceStubs(page, undefined, undefined, { live: true });
  await login(page);
  await startFirstLesson(page);

  await page.getByTestId("live-conversation-toggle").click();
  await expect(page.getByTestId("voice-focus")).toBeVisible({ timeout: 10_000 });
  await waitLiveReady(page);

  const sessionsBefore = await liveSessionCount(page);
  expect((await voiceTestState(page)).micProbeStops).toBe(0);

  // PHASE 175 — the death with no error: the mode opens, the child speaks,
  // and not one fragment ever arrives. At the exact moment the screen admits
  // «لم أسمعك بعد», the session clears the field behind the scenes — probe
  // released, recognizer rebuilt — so the next words start fresh.
  await expect(page.getByTestId("live-mic-hint")).toBeVisible({ timeout: 12_000 });
  await expect.poll(() => liveSessionCount(page), { timeout: 10_000 }).toBeGreaterThan(sessionsBefore);
  expect((await voiceTestState(page)).micProbeStops).toBeGreaterThan(0);

  // …and the fresh session carries the words that follow, all the way to the
  // tutor's voice — the rescue is invisible except for the answer.
  await pushLiveInterim(page, "اشرح لي الجمع");
  await expect(page.getByTestId("live-interim")).toContainText("الجمع");
  await pushLiveUtterance(page, "اشرح لي الجمع مع إعادة التجميع");
  await expect(page.getByTestId("msg-user-live")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 20_000 });
});

test("B9: a new turn silences the old reading — one voice at a time, whichever turn asked next", async ({ page }) => {
  await installVoiceStubs(page, undefined, undefined, { live: true });
  await login(page);
  await startFirstLesson(page);

  await page.getByTestId("live-conversation-toggle").click();
  await expect(page.getByTestId("voice-focus")).toBeVisible({ timeout: 10_000 });
  // The strip is where a typed question happens: the same room, the same
  // microphone — the child may type while the tutor talks.
  await page.getByTestId("voice-focus-minimize").click();
  await expect(page.getByTestId("live-hud")).toBeVisible();
  await waitLiveReady(page);
  // Frozen from before the first utterance: the reading never ends on its own,
  // so only the room's own stop can silence it (as in B1).
  await freezeLiveSpeech(page);

  await pushLiveUtterance(page, "اشرح لي الجمع مع إعادة التجميع");
  await expect(page.getByTestId("msg-user-live")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("live-hud")).toHaveAttribute("data-state", "speaking");
  expect((await voiceTestState(page)).spoken.length).toBeGreaterThan(0);

  // PHASE 177 — «صوت واحد»: the owner heard «معلمين… واحد بيتكلم كلام مختلف».
  // An echoed question (or any later turn) used to start a SECOND voice while
  // the first reading was still in the air, because only a spoken interruption
  // ever stopped it. A new turn silences it now, before anything else happens.
  const cancelsBefore = (await voiceTestState(page)).cancelCount;
  await page.getByTestId("chat-input").fill("اشرح بمثال آخر من الكتاب");
  await page.getByTestId("send-message").click();
  await expect(page.getByTestId("speak-status")).toHaveCount(0, { timeout: 5_000 });
  await expect(page.getByTestId("live-hud")).not.toHaveAttribute("data-state", "speaking");
  expect((await voiceTestState(page)).cancelCount).toBeGreaterThan(cancelsBefore);

  // The typed turn itself is not lost to the stop: it goes out and is answered.
  await expect(page.getByTestId("msg-user")).toHaveCount(2, { timeout: 20_000 });
  await expect(page.getByTestId("msg-tutor")).toHaveCount(2, { timeout: 30_000 });

  // …and the conversation's own voice returns for the next spoken question:
  // the silence was a stop, not a wedge.
  await pushLiveUtterance(page, "ما هي خطوات الجمع؟");
  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 25_000 });

  await page.getByTestId("live-exit").click();
  await expect(page.getByTestId("live-hud")).toHaveCount(0);
});
