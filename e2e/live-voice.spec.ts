import { expect, test } from "@playwright/test";
import {
  freezeLiveSpeech,
  installVoiceStubs,
  isLiveReady,
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
