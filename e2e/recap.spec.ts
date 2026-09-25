import { expect, test } from "@playwright/test";
import { activeSessionIds, DEMO_PARENT, login, sendChatMessage, startFirstLesson } from "./helpers.js";

/**
 * PHASE 29 (D-027) — safe session recaps:
 *  - R1: after ending a lesson, the student opens «ملخص الجلسة» on that exact
 *    ended row — headline names the lesson, strengths/suggestions render, and
 *    the live conversation text never appears.
 *  - R2: a linked parent reads the SAME safe recap from the session timeline —
 *    headline names the lesson, message content never leaves the server.
 */
test.describe.configure({ mode: "serial" });

/** Live-message phrases that must NEVER appear inside a recap view. */
const R1_SECRET = "السجل السري ألفًا باء لا يظهر في الملخص إطلاقًا";
const R1_PROBE = "اشرح لي الفكرة الأساسية في هذا الدرس ببساطة";
const R2_PROBE = "علمني مثالًا من الحياة على هذا الدرس";

test("R1: a student views the safe recap of an ended lesson session", async ({ page }) => {
  await login(page);

  // Identify THIS test's session (the sessions list renders oldest-first, so
  // we target the ended row by its exact id).
  const activesBefore = await activeSessionIds(page);
  await startFirstLesson(page);
  const lessonTitle = (await page.locator(".chat-header strong").textContent())?.trim() ?? "";
  expect(lessonTitle.length).toBeGreaterThan(0);

  await sendChatMessage(page, R1_PROBE);
  await sendChatMessage(page, R1_SECRET);

  const activesAfter = await activeSessionIds(page);
  const mySessionId = activesAfter.find((id) => !activesBefore.includes(id));
  expect(mySessionId).toBeTruthy();

  page.on("dialog", (d) => void d.accept());
  await page.getByTestId("end-session").click();
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });

  const myRow = page.locator(`[data-testid="session-row"][data-session-id="${mySessionId}"]`);
  await expect(myRow).toHaveCount(1);
  await expect(myRow).toHaveAttribute("data-session-status", "ended");

  const recapButton = myRow.getByTestId("session-recap-button");
  await expect(recapButton).toBeVisible({ timeout: 20_000 });
  await recapButton.click();

  const panel = myRow.getByTestId("session-recap");
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(panel.getByTestId("recap-headline")).toContainText(lessonTitle, { timeout: 20_000 });
  await expect(panel.getByTestId("recap-stats")).toContainText("رسالة منك");
  await expect(panel.getByTestId("recap-strengths").first()).toBeVisible();
  await expect(panel.getByTestId("recap-suggestions").first()).toBeVisible();

  // No-verbatim: the live conversation never shows up in the recap.
  await expect(panel).not.toContainText(R1_SECRET);
  await expect(panel).not.toContainText(R1_PROBE);
});

test("R2: a parent reads the same safe recap from the session timeline", async ({ page }) => {
  // 1) The demo student runs a fresh lesson so the parent's newest session is THIS one.
  await login(page);
  await startFirstLesson(page);
  const lessonTitle = (await page.locator(".chat-header strong").textContent())?.trim() ?? "";
  expect(lessonTitle.length).toBeGreaterThan(0);
  await sendChatMessage(page, R2_PROBE);

  page.on("dialog", (d) => void d.accept());
  await page.getByTestId("end-session").click();
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("logout").click();
  await expect(page.getByTestId("input-email")).toBeVisible({ timeout: 20_000 });

  // 2) The linked parent drills into the newest session (summaries are
  //    newest-first) and opens the safe recap.
  await login(page, DEMO_PARENT.email, DEMO_PARENT.password, "parent-screen");
  await page.getByTestId("parent-child-open").click();
  await expect(page.getByTestId("parent-child-detail")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("parent-session-open").first().click();
  await expect(page.getByTestId("parent-session-detail")).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("parent-recap-button").click();
  const panel = page.getByTestId("parent-session-recap");
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(panel.getByTestId("parent-recap-headline")).toContainText(lessonTitle, { timeout: 20_000 });
  await expect(panel.getByTestId("parent-recap-stats")).toContainText("رسالة منك");

  // 3) Message content never reaches the parent, even inside the recap.
  await expect(panel).not.toContainText(R2_PROBE);
  await expect(page.locator("body")).not.toContainText(R2_PROBE);
});