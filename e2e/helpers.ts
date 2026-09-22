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