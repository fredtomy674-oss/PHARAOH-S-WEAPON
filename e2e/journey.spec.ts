import { expect, test } from "@playwright/test";
import {
  activeSessionIds,
  login,
  NO_RAG_PHRASE,
  NO_RETRIEVED_PLACEHOLDER,
  openAccount,
  RAG_CONTEXT_PHRASE,
  remainingValue,
  roomLessonTitle,
  selectFirst,
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

  // 4) Lesson room open; lesson title shown (PHASE 48: addressed by test id,
  // so the room's layout can keep evolving without breaking the journey).
  const lessonTitle = await roomLessonTitle(page);

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
  // PHASE 166 — the ceiling itself is a backend knob (the E2E run raises it: see
  // playwright.config.ts), so the invariant is "positive and already below the
  // ceiling", never a hard-coded number; the real contract is the decrement.
  expect(afterFirst).toBeGreaterThan(0);
  expect(afterFirst).toBeLessThan(200);

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

  // 13) Logout → back to the unauthenticated state (PHASE 156: via ☰ drawer)
  await openAccount(page);
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
  // An API registration does not write the browser's localStorage; first-run
  // saves name + grade with a CSRF-protected PUT, so seed the token it returns.
  const registered = (await register.json()) as { csrfToken: string };
  await context.addInitScript((token) => localStorage.setItem("alfarouq_csrf", token), registered.csrfToken);

  // UI level: PHASE 180 requires name + grade before any student screen, then
  // the home shows no sessions at all (nothing from other students).
  await page.goto("/");
  await expect(page.getByTestId("first-run")).toBeVisible({ timeout: 20_000 });
  await page.locator('[data-testid^="first-run-grade-"]').first().click();
  await page.getByTestId("first-run-skip").click();
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
 * no message and no way forward. Now the failure must be VISIBLE and the screen
 * must stay usable so the very same click can be retried.
 *
 * PHASE 159 — legitimate navigation change (documented in the same commit): a
 * lesson now opens its own page first (the missing layer between the picker and
 * the room), and the session starts from its «ابدأ حصة» button. The failure
 * therefore surfaces on the lesson page — same contract, same testids
 * (`onboarding-error`), same retry-the-same-click promise.
 */
test("ON1: a failed session start explains itself and can be retried", async ({ page }) => {
  await page.goto("/");
  await login(page);
  await page.getByTestId("start-lesson").click();
  await expect(page.getByTestId("learn-grade-chip")).toBeVisible();
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

  // PHASE 159: the lesson opens its page; starting the session is its button.
  await lesson.click();
  const start = page.getByTestId("lesson-start");
  await expect(start).toBeVisible({ timeout: 20_000 });
  await start.click();

  // The failure is explained, not silent.
  const error = page.getByTestId("onboarding-error");
  await expect(error).toBeVisible({ timeout: 20_000 });
  await expect(error).toContainText("الدرس لا ينتمي للمنهج المحدد");
  // No stranded screen: no chat, the lesson page stays usable (the same button
  // retries) and رجوع leads back to the picker.
  await expect(page.getByTestId("chat-input")).toHaveCount(0);
  await expect(page.getByTestId("lesson-start")).toBeVisible();
  await expect(page.getByTestId("lesson-back")).toBeVisible();

  // Same click now succeeds — the student is never stuck.
  await page.unroute("**/api/sessions");
  await page.getByTestId("lesson-start").click();
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
  await expect(page.getByTestId("learn-grade-chip")).toBeVisible();
  await selectFirst(page, "select-subject");
  await selectFirst(page, "select-curriculum");
  await selectFirst(page, "select-term");
  await selectFirst(page, "select-unit");
  await expect(page.locator('[data-testid^="lesson-"]')).not.toHaveCount(0);

  // Reset the SUBJECT → curriculum/term/unit/lessons must go with it.
  // PHASE 159 — the subject step is now a card group; its «تغيير» control is
  // the reset (one of the two reset positions this spec documents).
  await page.getByTestId("subject-change").click();
  await expect(page.getByTestId("select-curriculum")).toHaveCount(0);
  await expect(page.getByTestId("select-term")).toHaveCount(0);
  await expect(page.getByTestId("select-unit")).toHaveCount(0);
  await expect(page.locator('[data-testid^="lesson-"]')).toHaveCount(0);
  // Levels above it are untouched: the child's grade stays visible and locked,
  // and the Learn picker never offers a country/system/grade control again.
  await expect(page.getByTestId("learn-grade-chip")).toContainText("الصف السادس");
  await expect(page.getByTestId("select-country")).toHaveCount(0);
  await expect(page.getByTestId("select-system")).toHaveCount(0);
  await expect(page.getByTestId("select-grade")).toHaveCount(0);

  // Re-pick the cascade under the locked grade; it still works end to end.
  await selectFirst(page, "select-subject");
  await selectFirst(page, "select-curriculum");
  await selectFirst(page, "select-term");
  await selectFirst(page, "select-unit");
  await expect(page.locator('[data-testid^="lesson-"]')).not.toHaveCount(0);
});