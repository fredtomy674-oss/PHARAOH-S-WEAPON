import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Locator, type Page, expect } from "@playwright/test";

/** Demo student seeded into every fresh E2E DB by `npm run e2e:backend`. */
export const DEMO_STUDENT = {
  email: "student@alfarouq.test",
  password: "student-demo-123",
};

/** Phrase the dev (mock) LLM provider only emits when RAG context was retrieved. */
export const RAG_CONTEXT_PHRASE = "وفقًا لمحتوى الدرس";
export const NO_RAG_PHRASE = "لم أستطع الوصول لمحتوى الدرس";
/** Emitted by the mock provider when zero chunks were retrieved — must NOT appear on a real RAG turn. */
export const NO_RETRIEVED_PLACEHOLDER = "لا يوجد محتوى مسترجع";

/** Mock provider marker: the tutor reply contains this when a photo was attached. */
export const VISION_MARKER = "قرأت الصورة المرفقة";

/** Mock provider marker: the tutor reply contains this when a document was attached. */
export const DOCUMENT_MARKER = "قرأت الملف المرفق";

/** Start of the tutor's safe-refusal reply (prompt-injection tripwire). */
export const SAFE_REFUSAL_PHRASE = "أنا هنا لمساعدتك في درسنا فقط";

/** Stable transcript emitted by the fake SpeechRecognition stub in voice tests. */
export const STT_TRANSCRIPT = "اذكر مثالًا على الجمع مع إعادة التجميع";

export interface VoiceTestState {
  /** Utterances handed to speechSynthesis.speak, in order (text + lang). */
  spoken: Array<{ text: string; lang: string }>;
  /** How many times speechSynthesis.cancel() was called. */
  cancelCount: number;
}

/**
 * Installs deterministic in-browser stubs for the Web Speech APIs so voice UI
 * flows can be automated without a real microphone or audio output:
 *  - SpeechRecognition: emits exactly ONE final result with `transcript`, then
 *    `onend` (mimics Chrome after a short pause on a spoken sentence).
 *  - speechSynthesis: records every spoken utterance + every cancel; plays no
 *    real audio.
 * The recorded state is exposed as `window.__voiceTest` for assertions.
 */
export async function installVoiceStubs(page: Page, transcript: string = STT_TRANSCRIPT): Promise<void> {
  await page.addInitScript((t: string) => {
    const state: VoiceTestState = { spoken: [], cancelCount: 0 };
    (window as unknown as { __voiceTest: VoiceTestState }).__voiceTest = state;

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
        setTimeout(() => {
          if (typeof this.onresult === "function") {
            this.onresult({ results: [{ isFinal: true, 0: { transcript: t } }] });
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
      getVoices: () => [
        { lang: "ar-EG", name: "Test Arabic Voice", default: false, localService: true, voiceURI: "test-ar" },
      ],
      speak(u: { text: string; lang: string }): void {
        pending.length = 0;
        state.spoken.push({ text: u.text, lang: u.lang });
        pending.push(u);
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
  }, transcript);
}

/** Reads the recorded voice-test state (only meaningful after installVoiceStubs). */
export async function voiceTestState(page: Page): Promise<VoiceTestState> {
  return page.evaluate(() => (window as unknown as { __voiceTest: VoiceTestState }).__voiceTest);
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
): Promise<void> {
  await page.goto("/");
  await expect(page.getByTestId("input-email")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-password").fill(password);
  await page.getByTestId("submit-auth").click();
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
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

/** Full onboarding walk: country → system → grade → subject → curriculum → term → unit → first lesson. */
export async function startFirstLesson(page: Page): Promise<void> {
  await page.getByTestId("start-lesson").click();
  await selectFirst(page, "select-country");
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