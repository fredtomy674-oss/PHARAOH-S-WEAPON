import { expect, test } from "@playwright/test";
import {
  freezeLiveSpeech,
  installVoiceStubs,
  login,
  pushLiveInterim,
  pushLiveUtterance,
  startFirstLesson,
  voiceTestState,
  waitLiveReady,
} from "./helpers.js";

/**
 * PHASE 168 — «المحادثة الحيّة»: one open microphone for the whole lesson.
 *
 * The owner asked in so many words («محادثة حيه… يسمع و يفهم و يرد خلال
 * المحادثة») after measuring ~7s between question and answer — and asked that
 * the student stop being distracted by a press per turn. Here the student
 * speaks, pauses, and the room sends by itself; the tutor's voice answers while
 * the answer is still being written (the PHASE 56/57 machinery, unchanged), and
 * yields the instant the student speaks again.
 *
 * The Web Speech APIs cannot be automated with real audio, so this suite drives
 * the same deterministic stubs as voice.spec.ts — with `live: true`, which
 * models a *continuous* session fed fragment by fragment
 * (`pushLiveUtterance`/`pushLiveInterim`), and `freezeLiveSpeech`, which holds
 * one spoken utterance open so barge-in is proved rather than timed.
 */
test.describe.configure({ mode: "serial" });

test("B1: live mode sends on silence, speaks the reply as it streams, and yields on barge-in", async ({ page }) => {
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
  // frozen, the only thing that can silence this reading is the student's own
  // voice — barge-in is then proved, not timed.
  await freezeLiveSpeech(page);

  // The student just talks — fragments arrive, the caption follows the words
  // as they are recognized...
  const question = "اشرح لي الجمع مع إعادة التجميع";
  await pushLiveInterim(page, "اشرح لي");
  await expect(page.getByTestId("live-interim")).toContainText("اشرح لي");
  // ...and after the silence the utterance goes out by itself: the student's
  // own bubble is proof, and nothing was pressed to produce it.
  await pushLiveUtterance(page, question);
  await expect(page.getByTestId("msg-user-live")).toBeVisible({ timeout: 10_000 });
  expect((await voiceTestState(page)).recognitionLang).toBe("ar-EG");

  await expect(page.getByTestId("speak-status")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("live-hud")).toHaveAttribute("data-state", "speaking");
  // The reply is genuinely heard while the room is still on the same turn:
  // this machine's own voice reads it sentence by sentence (PHASE 56), so the
  // server was never asked to synthesize anything.
  await expect.poll(async () => (await voiceTestState(page)).spoken.length, { timeout: 20_000 }).toBeGreaterThan(0);
  const heard = await voiceTestState(page);
  expect(heard.spoken[0]!.lang).toBe("ar-EG");
  expect(heard.audio.plays).toBe(0);

  // The student interrupts mid-sentence: the voice must yield at once — the
  // frozen engine proves the silence is the room's stop, not a natural end.
  const cancelsBefore = heard.cancelCount;
  await pushLiveInterim(page, "لحظة");
  await expect(page.getByTestId("speak-status")).toHaveCount(0, { timeout: 5_000 });
  expect((await voiceTestState(page)).cancelCount).toBeGreaterThan(cancelsBefore);
  await expect(page.getByTestId("live-hud")).not.toHaveAttribute("data-state", "speaking");

  // The interruption became the next question — same voice, no buttons.
  await pushLiveUtterance(page, "اشرح بمثال");
  await expect(page.getByTestId("msg-user")).toHaveCount(2, { timeout: 20_000 });
  await expect(page.getByTestId("msg-user").nth(1).locator("p")).toHaveText("اشرح بمثال");
  await expect(page.getByTestId("msg-user").first().locator("p")).toHaveText(question);

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

  await pushLiveUtterance(page, "ما هي خطوات الجمع مع إعادة التجميع؟");
  await expect(page.getByTestId("msg-user-live")).toBeVisible({ timeout: 15_000 });

  // The student asks the next thing while the tutor is still working: the
  // question is kept and sent the moment the room is free (or directly, if the
  // turn already ended) — either way it is never lost, and nothing is pressed.
  await pushLiveUtterance(page, "لماذا نجمّع العشرات؟");
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
