import { expect, test } from "@playwright/test";
import {
  activeSessionIds,
  login,
  NO_RAG_PHRASE,
  NO_RETRIEVED_PLACEHOLDER,
  RAG_CONTEXT_PHRASE,
  remainingValue,
  selectFirst,
  selectOptionByLabel,
  sendChatMessage,
  startFirstLesson,
} from "./helpers.js";

/**
 * The full happy path, run for real through the browser:
 * login → curriculum selection → session → RAG-grounded tutor reply →
 * re-explanation in the SAME session → end → progress → ended session in list
 * → logout. Followed by a student-isolation check.
 */
test.describe.configure({ mode: "serial" });

let demoSessionId = "";

test("journey: login → lesson → RAG tutor reply → re-explain → end → progress → logout", async ({ page }) => {
  // 1) Login gate
  await page.goto("/");
  await expect(page.getByText("سلاح الفرعون")).toBeVisible({ timeout: 20_000 });
  await login(page);

  // 2) Student home
  await expect(page.getByTestId("home-screen")).toBeVisible();
  await expect(page.getByText(/أهلاً/)).toBeVisible();

  // 3) Curriculum selection (real data from the seeded DB) — startFirstLesson
  //    already clicks the "start lesson" button on Home. Capture active
  //    sessions BEFORE the walk so we can identify this test's new session.
  const activesBefore = await activeSessionIds(page);
  await startFirstLesson(page);

  // 4) Chat room open; lesson title shown
  const lessonTitle = (await page.locator(".chat-header strong").textContent())?.trim() ?? "";
  expect(lessonTitle.length).toBeGreaterThan(0);

  // 5) First question through the real UI.
  await sendChatMessage(page, "اشرح لي هذا الدرس خطوة بخطوة وأعطني مثالًا من الحياة");

  const userMsgs = page.getByTestId("msg-user");
  await expect(userMsgs).toHaveCount(1, { timeout: 30_000 });
  await expect(userMsgs.first()).toContainText("اشرح لي هذا الدرس");

  // 6) Tutor reply appears
  const tutorMsgs = page.getByTestId("msg-tutor");
  await expect(tutorMsgs).toHaveCount(1, { timeout: 30_000 });
  const tutorText = (await tutorMsgs.first().textContent()) ?? "";

  // 7) RAG evidence — the context phrase only exists when chunks were retrieved
  expect(tutorText).toContain(RAG_CONTEXT_PHRASE);
  expect(tutorText).not.toContain(NO_RAG_PHRASE);
  expect(tutorText).not.toContain(NO_RETRIEVED_PLACEHOLDER);
  expect(tutorText.length).toBeGreaterThan(400);

  // 8) Daily usage visible and consumed by one turn
  const remaining = page.getByTestId("remaining-budget");
  await expect(remaining).toBeVisible();
  const afterFirst = await remainingValue(remaining);
  expect(afterFirst).toBeLessThan(50);

  // remember the session id of THIS journey (via the browser through the proxy)
  const activesAfterFirst = await activeSessionIds(page);
  expect(activesAfterFirst.length).toBeGreaterThan(activesBefore.length);
  demoSessionId = activesAfterFirst.find((id) => !activesBefore.includes(id))!;
  expect(demoSessionId.length).toBeGreaterThan(0);

  // 9) «مش فاهم» → re-explanation in the SAME session (no new session)
  await page.getByTestId("btn-confused").click();
  await expect(tutorMsgs).toHaveCount(2, { timeout: 30_000 });
  const reExplainText = (await tutorMsgs.nth(1).textContent()) ?? "";
  expect(reExplainText.length).toBeGreaterThan(200);

  const afterSecond = await remainingValue(remaining);
  expect(afterSecond).toBeLessThan(afterFirst);

  const activeAfterReExplain = await activeSessionIds(page);
  // The SAME session persisted — no new session was created for the re-explain.
  expect(activeAfterReExplain.length).toBe(activesAfterFirst.length);
  expect(activeAfterReExplain).toContain(demoSessionId);

  // 10) End the session (accept the confirm dialog)
  page.on("dialog", (d) => void d.accept());
  await page.getByTestId("end-session").click();

  // 11) Back home → progress card shows real usage
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("progress-card")).toBeVisible();
  const usageText = (await page.getByTestId("stat-usage-today").textContent())!.trim();
  expect(Number(usageText)).toBeGreaterThanOrEqual(2);

  // 12) The ended session is persisted in the sessions list (targeted by id)
  const endedRow = page.locator(`[data-testid="session-row"][data-session-id="${demoSessionId}"]`);
  await expect(endedRow).toHaveCount(1);
  await expect(endedRow).toHaveAttribute("data-session-status", "ended");
  await expect(endedRow).toContainText("منتهية");

  const endedState = await page.evaluate(async (id) => {
    const res = await fetch("/api/sessions");
    const data = (await res.json()) as { sessions: Array<{ id: string; status: string }> };
    return data.sessions.find((s) => s.id === id)?.status;
  }, demoSessionId);
  expect(endedState).toBe("ended");

  // 13) Logout → back to the unauthenticated state
  await page.getByTestId("logout").click();
  await expect(page.getByTestId("input-email")).toBeVisible({ timeout: 20_000 });
});

test("C: a brand-new student never sees another student's sessions", async ({ browser }) => {
  expect(demoSessionId.length).toBeGreaterThan(0);

  const context = await browser.newContext();
  const page = await context.newPage();

  // Register a fresh student through the real API (through the Vite proxy).
  const email = `e2e-isolation-${Date.now()}@test.local`;
  const register = await context.request.post("/api/auth/register", {
    data: { email, password: "isolation-pass-123", displayName: "طالب عزل" },
  });
  expect(register.ok()).toBeTruthy();

  // UI level: the home screen shows no sessions at all (nothing from other students).
  await page.goto("/");
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("no-sessions")).toBeVisible();
  await expect(page.getByTestId("session-list")).toHaveCount(0);

  // API level: attempting to read the demo student's session is denied.
  const forbidden = await context.request.get(`/api/sessions/${demoSessionId}`);
  expect([403, 404]).toContain(forbidden.status());

  await context.close();
});

/**
 * Regression (the reported "I picked country → grade → lesson and nothing
 * happened"): a failed session start used to strand the student on a card with
 * no message and no way forward. Now the failure must be VISIBLE and the picker
 * must stay usable so the very same click can be retried.
 */
test("ON1: a failed session start explains itself and can be retried", async ({ page }) => {
  await page.goto("/");
  await login(page);
  await page.getByTestId("start-lesson").click();
  await selectOptionByLabel(page, "select-country", "مصر");
  await selectFirst(page, "select-system");
  await selectFirst(page, "select-grade");
  await selectFirst(page, "select-subject");
  await selectFirst(page, "select-curriculum");
  await selectFirst(page, "select-term");
  await selectFirst(page, "select-unit");

  const lesson = page.locator('[data-testid^="lesson-"]').first();
  await expect(lesson).toBeVisible({ timeout: 20_000 });

  // Force the server to reject the start (same shape the real 400 uses).
  await page.route("**/api/sessions", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "LESSON_CURRICULUM_MISMATCH", message: "الدرس لا ينتمي للمنهج المحدد" } }),
      });
      return;
    }
    await route.continue();
  });

  await lesson.click();

  // The failure is explained, not silent.
  const error = page.getByTestId("onboarding-error");
  await expect(error).toBeVisible({ timeout: 20_000 });
  await expect(error).toContainText("الدرس لا ينتمي للمنهج المحدد");
  // No stranded "lesson chosen" screen: no chat, and the picker is still usable.
  await expect(page.getByTestId("chat-input")).toHaveCount(0);
  await expect(page.getByTestId("select-country")).toBeVisible();
  await expect(page.locator('[data-testid^="lesson-"]')).not.toHaveCount(0);

  // Same click now succeeds — the student is never stuck.
  await page.unroute("**/api/sessions");
  await lesson.click();
  await expect(page.getByTestId("chat-input")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("messages")).toBeVisible();

  // Leave no active session behind for the specs that follow.
  page.on("dialog", (d) => void d.accept());
  await page.getByTestId("end-session").click();
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
});

/**
 * Changing an upstream level must clear everything below it — a stale
 * curriculum/grade paired with a lesson from another scope is exactly what the
 * server rejects, and the picker must never offer a lesson it no longer shows.
 */
test("ON2: changing an upstream level clears the whole cascade below it", async ({ page }) => {
  await page.goto("/");
  await login(page);
  await page.getByTestId("start-lesson").click();
  await selectOptionByLabel(page, "select-country", "مصر");
  await selectFirst(page, "select-system");
  await selectFirst(page, "select-grade");
  await selectFirst(page, "select-subject");
  await selectFirst(page, "select-curriculum");
  await selectFirst(page, "select-term");
  await selectFirst(page, "select-unit");
  await expect(page.locator('[data-testid^="lesson-"]')).not.toHaveCount(0);

  // Reset the SUBJECT → curriculum/term/unit/lessons must go with it.
  await page.getByTestId("select-subject").selectOption("");
  await expect(page.getByTestId("select-curriculum")).toHaveCount(0);
  await expect(page.getByTestId("select-term")).toHaveCount(0);
  await expect(page.getByTestId("select-unit")).toHaveCount(0);
  await expect(page.locator('[data-testid^="lesson-"]')).toHaveCount(0);
  // Levels above it are untouched (the system/grade are still valid).
  await expect(page.getByTestId("select-system")).toBeVisible();
  await expect(page.getByTestId("select-grade")).toBeVisible();

  // Re-pick, then change the COUNTRY → everything below must clear too.
  await selectFirst(page, "select-subject");
  await selectFirst(page, "select-curriculum");
  await selectFirst(page, "select-term");
  await selectFirst(page, "select-unit");
  await expect(page.locator('[data-testid^="lesson-"]')).not.toHaveCount(0);
  await selectOptionByLabel(page, "select-country", "السعودية");
  await expect(page.getByTestId("select-system")).toHaveValue("");
  await expect(page.getByTestId("select-grade")).toHaveCount(0);
  await expect(page.locator('[data-testid^="lesson-"]')).toHaveCount(0);
});