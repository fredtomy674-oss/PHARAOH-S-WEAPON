import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Locator, type Page, expect } from "@playwright/test";

/** Demo student seeded into every fresh E2E DB by `npm run e2e:backend`. */
export const DEMO_STUDENT = {
  email: "student@alfarouq.test",
  password: "student-demo-123",
};

/** Demo parent (PHASE 18): pre-linked to the demo student in the seed. */
export const DEMO_PARENT = {
  email: "parent@alfarouq.test",
  password: "parent-demo-123",
};

/** The demo student's fixed parent linking code (set by the seeder). */
export const DEMO_LINK_CODE = "SLH7KQ9M";

/** Phrase the dev (mock) LLM provider only emits when RAG context was retrieved. */
export const RAG_CONTEXT_PHRASE = "وفقًا لمحتوى الدرس";
export const NO_RAG_PHRASE = "لم أستطع الوصول لمحتوى الدرس";
/** Emitted by the mock provider when zero chunks were retrieved — must NOT appear on a real RAG turn. */
export const NO_RETRIEVED_PLACEHOLDER = "لا يوجد محتوى مسترجع";

/** Mock provider marker: the tutor reply contains this when a photo was attached. */
export const VISION_MARKER = "قرأت الصورة المرفقة";

/** PHASE 51 — mock provider markers for the number-line verdict. */
export const WIDGET_PIN_OK = "الدبوس في مكانه الصحيح";
export const WIDGET_PIN_RIGHT = "حرّك الدبوس إلى اليمين قليلًا";
export const WIDGET_PIN_LEFT = "حرّك الدبوس إلى اليسار قليلًا";

/** Mock provider marker: the tutor reply contains this when a document was attached. */
export const DOCUMENT_MARKER = "قرأت الملف المرفق";

/** Mock provider marker: OCR (PHASE 19) recognized text always contains this — proves a scanned file was read. */
export const OCR_MARKER = "نص الصفحة الممسوحة ضوئيًا";

/** Start of the tutor's safe-refusal reply (prompt-injection tripwire). */
export const SAFE_REFUSAL_PHRASE = "أنا هنا لمساعدتك في درسنا فقط";

/**
 * PHASE 38/D-042 — English counterparts, emitted by the mock provider only when
 * the session's subject is a foreign-language curriculum.
 */
export const ENGLISH_REPLY_MARKER = "I will explain this lesson in English";
export const ENGLISH_RAG_CONTEXT_PHRASE = "According to the lesson content";
export const ENGLISH_NO_RAG_PHRASE = "I could not reach the lesson content";
export const VISION_MARKER_EN = "I read the attached image";
export const SAFE_REFUSAL_EN_PHRASE = "I am here to help you with our lesson only";

/** Stable transcript emitted by the fake SpeechRecognition stub in voice tests. */
export const STT_TRANSCRIPT = "اذكر مثالًا على الجمع مع إعادة التجميع";

/**
 * PHASE 39/D-043 — an English transcript, and the installed voice set the fake
 * browser exposes. Arabic is listed FIRST on purpose: a naive "first voice
 * wins" or "any ar* voice" implementation would then narrate the English
 * lesson with the Arabic voice, which is the bug this phase fixes.
 */
export const STT_TRANSCRIPT_EN = "Explain when we add -s to the verb";

export interface StubVoice {
  lang: string;
  name: string;
}

/** Both languages installed — the normal machine. */
export const STUB_VOICES: StubVoice[] = [
  { lang: "ar-EG", name: "Test Arabic Voice" },
  { lang: "en-US", name: "Test English Voice" },
];

export interface VoiceTestState {
  /** Utterances handed to speechSynthesis.speak, in order (text + lang). */
  spoken: Array<{ text: string; lang: string }>;
  /** How many times speechSynthesis.cancel() was called. */
  cancelCount: number;
  /** The `lang` the app asked dictation to use (D-043: follows the lesson). */
  recognitionLang: string;
  /** PHASE 40/D-044 — server-generated audio: how it actually played. */
  audio: {
    plays: number;
    pauses: number;
    ended: number;
    lastSrc: string;
  };
  /**
   * PHASE 57 — the server's voice played *progressively*: one decoded piece per
   * sentence, scheduled back-to-back on one Web Audio timeline.
   *
   * `started` counts pieces that really began playing (this is the first-audio
   * latency the phase exists to cut), `stopped` pieces that were silenced by the
   * stop button, and `decodeFailures` pieces the browser refused — which must
   * never happen for the server's real WAVs, so the count is asserted too.
   */
  pieces: {
    started: number;
    stopped: number;
    decodeFailures: number;
  };
}

/**
 * Installs deterministic in-browser stubs for the Web Speech APIs so voice UI
 * flows can be automated without a real microphone or audio output:
 *  - SpeechRecognition: emits exactly ONE final result with `transcript`, then
 *    `onend` (mimics Chrome after a short pause on a spoken sentence), and
 *    records the `lang` the app asked to dictate in (D-043).
 *  - speechSynthesis: exposes `voices` (both languages by default) and records
 *    every spoken utterance + every cancel; plays no real audio.
 *  - <audio>: records play/pause/ended and the last src, so the server-audio
 *    path (PHASE 40/D-044) can be asserted as really played and really stopped.
 *  The recorded state is exposed as `window.__voiceTest` for assertions.
 */
export async function installVoiceStubs(
  page: Page,
  transcript: string = STT_TRANSCRIPT,
  voices: StubVoice[] = STUB_VOICES,
): Promise<void> {
  await page.addInitScript((opts: { transcript: string; voices: StubVoice[] }) => {
    const state: VoiceTestState = { spoken: [], cancelCount: 0, recognitionLang: "", audio: { plays: 0, pauses: 0, ended: 0, lastSrc: "" }, pieces: { started: 0, stopped: 0, decodeFailures: 0 } };
    (window as unknown as { __voiceTest: VoiceTestState }).__voiceTest = state;

    // PHASE 57 — progressive server voice. The real Web Audio pipeline is used
    // (verified to work headless: the context runs, the server's WAV decodes,
    // the clock advances and `onended` fires), so a broken piece would surface as
    // a real decode rejection. Only the two calls that prove "the tutor's voice
    // was heard" are wrapped.
    const Ctx = window.AudioContext;
    const sourceProto = Ctx?.prototype ? (window as unknown as { AudioBufferSourceNode?: typeof AudioBufferSourceNode }).AudioBufferSourceNode?.prototype : undefined;
    if (Ctx && sourceProto) {
      const originalStart = sourceProto.start;
      sourceProto.start = function start(this: AudioBufferSourceNode, ...args: [number?]) {
        state.pieces.started += 1;
        return originalStart.apply(this, args);
      };
      const originalStop = sourceProto.stop;
      sourceProto.stop = function stop(this: AudioBufferSourceNode, ...args: [number?]) {
        state.pieces.stopped += 1;
        return originalStop.apply(this, args);
      };
      // decodeAudioData *detaches* the buffer it is given (per spec), so the
      // original is called with a copy: this must stay genuine.
      const originalDecode = Ctx.prototype.decodeAudioData;
      Ctx.prototype.decodeAudioData = function decode(this: AudioContext, data: ArrayBuffer, ...rest: []) {
        const copy = data.slice(0);
        return originalDecode.call(this, copy, ...rest).then(
          (buffer) => buffer,
          (err) => {
            state.pieces.decodeFailures += 1;
            throw err;
          },
        );
      };
    }

    // PHASE 40/D-044 — server audio playback recorder. Delegating to the real
    // prototype keeps decoding/playback genuine: a broken WAV would surface as
    // a rejected play() promise, which is exactly what we want to catch.
    const media = window.HTMLMediaElement?.prototype;
    if (media) {
      const originalPlay = media.play;
      media.play = function play(this: HTMLMediaElement) {
        state.audio.plays += 1;
        state.audio.lastSrc = this.src || "";
        this.addEventListener("ended", () => {
          state.audio.ended += 1;
        });
        return originalPlay.call(this);
      };
      const originalPause = media.pause;
      media.pause = function pause(this: HTMLMediaElement) {
        state.audio.pauses += 1;
        return originalPause.call(this);
      };
    }

    // One-shot SpeechRecognition: one final result, then end.
    class FakeSpeechRecognition {
      lang = "ar-EG";
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start(): void {
        // The app sets `lang` after construction — record what it asked for.
        state.recognitionLang = this.lang;
        setTimeout(() => {
          if (typeof this.onresult === "function") {
            this.onresult({ results: [{ isFinal: true, 0: { transcript: opts.transcript } }] });
          }
          if (typeof this.onend === "function") this.onend();
        }, 400);
      }
      stop(): void {
        if (typeof this.onend === "function") this.onend();
      }
    }
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = FakeSpeechRecognition;

    // Recording speechSynthesis: no real audio.
    const pending: Array<{ text: string; lang: string }> = [];
    const fakeSynth = {
      getVoices: () =>
        opts.voices.map((v) => ({
          lang: v.lang,
          name: v.name,
          default: v.lang === "en-US",
          localService: true,
          voiceURI: `test-${v.lang}`,
        })),
      speak(u: { text: string; lang: string; onend?: () => void; onerror?: () => void }): void {
        pending.length = 0;
        state.spoken.push({ text: u.text, lang: u.lang });
        pending.push(u);
        // PHASE 56 — an utterance must END for the next one to start: the room now
        // reads a reply sentence by sentence (see `narrator.ts`), so a stub that
        // never ends its utterance would stall the queue after the first sentence
        // and hide the very behaviour these tests are about. The delay is
        // proportional to the text, because a real voice takes real time — a stub
        // that ended instantly would let the whole reply be "spoken" before a
        // test could look at it.
        const duration = Math.min(3000, Math.max(500, u.text.length * 25));
        setTimeout(() => {
          if (pending[0] === u) u.onend?.();
        }, duration);
      },
      cancel(): void {
        state.cancelCount += 1;
        pending.length = 0;
      },
      paused: false,
      pendingSpeech: pending,
      get speaking(): boolean {
        return pending.length > 0;
      },
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: fakeSynth,
      configurable: true,
      writable: true,
    });
  }, { transcript, voices });
}

/** Reads the recorded voice-test state (only meaningful after installVoiceStubs). */
export async function voiceTestState(page: Page): Promise<VoiceTestState> {
  return page.evaluate(() => (window as unknown as { __voiceTest: VoiceTestState }).__voiceTest);
}

/**
 * PHASE 40 (D-044) — makes the server behave like a deployment with no voice
 * (`SPEECH_PROVIDER=none`) or an outage, by answering the narration route with
 * the very 503 the server would send. The app must then read the reply with the
 * browser's own voice — the behaviour every offline installation depends on.
 */
export async function forceNoServerSpeech(page: Page): Promise<void> {
  // PHASE 57 — BOTH narration routes must answer 503, not just the buffered one:
  // the room now tries the progressive stream first and only then the whole blob,
  // and a deployment without a voice must fail both the same way.
  const noVoice = (route: import("@playwright/test").Route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "SPEECH_UNAVAILABLE", message: "النطق على الخادم غير مُفعَّل" } }),
    });
  await page.route("**/api/sessions/*/messages/*/speech/stream", noVoice);
  await page.route("**/api/sessions/*/messages/*/speech", noVoice);
}

/** 1x1 transparent PNG (base64) used to simulate a photographed question. */
export const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

/** Attaches an image through the real UI's file input (returns the preview locator). */
export async function attachImage(page: Page, base64 = TINY_PNG_BASE64): Promise<void> {
  await page.getByTestId("attach-input").setInputFiles({
    name: "question.png",
    mimeType: "image/png",
    buffer: Buffer.from(base64, "base64"),
  });
  await expect(page.getByTestId("image-preview")).toBeVisible({ timeout: 10_000 });
}

const e2eFixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

/** Reads a binary fixture from e2e/fixtures/ (used by the document spec). */
export function docFixture(fileName: string): Buffer {
  return readFileSync(path.join(e2eFixturesDir, fileName));
}

const DOCUMENT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

/** Attaches a document through the real UI's file input (returns when the preview shows). */
export async function attachDocument(page: Page, fileName: string, buffer: Buffer): Promise<void> {
  const ext = fileName.split(".").pop() ?? "";
  await page.getByTestId("attach-document-input").setInputFiles({
    name: fileName,
    mimeType: DOCUMENT_MIME[ext] ?? "application/octet-stream",
    buffer,
  });
  await expect(page.getByTestId("document-preview")).toBeVisible({ timeout: 10_000 });
}

export async function login(
  page: Page,
  email = DEMO_STUDENT.email,
  password = DEMO_STUDENT.password,
  expectedTestId = "home-screen",
): Promise<void> {
  await page.goto("/");
  await expect(page.getByTestId("input-email")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-password").fill(password);
  await page.getByTestId("submit-auth").click();
  await expect(page.getByTestId(expectedTestId)).toBeVisible({ timeout: 20_000 });
}

/** Picks the first real option of a dropdown (never the placeholder). Returns its value. */
export async function selectFirst(page: Page, testId: string): Promise<string> {
  const select = page.getByTestId(testId);
  await expect(select).toBeVisible({ timeout: 20_000 });
  const firstOption = select.locator("option").nth(1);
  await expect(firstOption).toBeAttached({ timeout: 20_000 });
  const value = await firstOption.getAttribute("value");
  expect(value, `expected a selectable option in ${testId}`).toBeTruthy();
  await select.selectOption(value!);
  return value!;
}

/**
 * Selects a dropdown option by its displayed label — deterministic even when
 * the option ordering changes (e.g. multi-country seeds: PHASE 16 adds Saudi,
 * which sorts ahead of Egypt alphabetically, so "first option" is no longer مصر).
 */
export async function selectOptionByLabel(page: Page, testId: string, label: string): Promise<string> {
  const select = page.getByTestId(testId);
  await expect(select).toBeVisible({ timeout: 20_000 });
  const option = select.locator("option", { hasText: label }).first();
  await expect(option).toBeAttached({ timeout: 20_000 });
  const value = await option.getAttribute("value");
  expect(value, `expected a "${label}" option in ${testId}`).toBeTruthy();
  await select.selectOption(value!);
  return value!;
}

/** Full onboarding walk: country → system → grade → subject → curriculum → term → unit → first lesson. */
export async function startFirstLesson(page: Page): Promise<void> {
  await page.getByTestId("start-lesson").click();
  await selectOptionByLabel(page, "select-country", "مصر");
  await selectFirst(page, "select-system");
  await selectFirst(page, "select-grade");
  await selectFirst(page, "select-subject");
  await selectFirst(page, "select-curriculum");
  await selectFirst(page, "select-term");
  await selectFirst(page, "select-unit");

  const firstLesson = page.locator('[data-testid^="lesson-"]').first();
  await expect(firstLesson).toBeVisible({ timeout: 20_000 });
  await firstLesson.click();
  await expect(page.getByTestId("chat-input")).toBeVisible({ timeout: 20_000 });
}

/**
 * Full onboarding walk to a specific subject: country → system → grade →
 * subject (by label) → curriculum → term → unit → first lesson. PHASE 38 uses
 * it to reach the English curriculum under the same country/grade as Math.
 *
 * The grade is Grade 6 by label, not by position: since subjects are scoped to
 * the picked grade, "first grade" (KG1) no longer offers every subject, so a
 * positional pick silently lands on the wrong book. Grade 6 teaches both Math
 * and English, which is all this walk's callers need.
 */
export async function startLessonOfSubject(page: Page, subjectLabel: string): Promise<void> {
  await page.getByTestId("start-lesson").click();
  await selectOptionByLabel(page, "select-country", "مصر");
  await selectFirst(page, "select-system");
  await selectOptionByLabel(page, "select-grade", "الصف السادس الابتدائي");
  await selectOptionByLabel(page, "select-subject", subjectLabel);
  await selectFirst(page, "select-curriculum");
  await selectFirst(page, "select-term");
  await selectFirst(page, "select-unit");

  const firstLesson = page.locator('[data-testid^="lesson-"]').first();
  await expect(firstLesson).toBeVisible({ timeout: 20_000 });
  await firstLesson.click();
  await expect(page.getByTestId("chat-input")).toBeVisible({ timeout: 20_000 });
}

/**
 * The lesson title the room's ribbon is currently showing.
 *
 * The ribbon renders a «الجلسة» placeholder until the breadcrumb request
 * resolves, so reading it the moment the room mounts is a race — it returns the
 * placeholder and every later "did the app show the right lesson?" assertion
 * silently compares against a placeholder. Wait for the real title instead of
 * sleeping: if the breadcrumb genuinely fails, this times out and says so.
 */
export async function roomLessonTitle(page: Page): Promise<string> {
  const title = page.getByTestId("room-lesson-title");
  await expect(title).not.toHaveText("الجلسة", { timeout: 20_000 });
  const text = (await title.textContent())?.trim() ?? "";
  expect(text.length, "room ribbon showed an empty lesson title").toBeGreaterThan(0);
  return text;
}

/** Sends a message through the real chat UI and returns the tutor bubble locator. */
export async function sendChatMessage(
  page: Page,
  content: string,
): Promise<void> {
  await page.getByTestId("chat-input").fill(content);
  await page.getByTestId("send-message").click();
}

export async function remainingValue(locator: Locator): Promise<number> {
  const text = (await locator.textContent()) ?? "";
  const match = text.match(/متبقي اليوم:\s*(\d+)/);
  if (!match) throw new Error(`cannot parse remaining budget from: ${text}`);
  return Number(match[1]);
}

export async function activeSessionIds(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const res = await fetch("/api/sessions");
    const data = (await res.json()) as { sessions: Array<{ id: string; status: string }> };
    return data.sessions.filter((s) => s.status === "active").map((s) => s.id);
  });
}