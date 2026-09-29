import { expect, test, type Page } from "@playwright/test";
import {
  DEMO_STUDENT,
  docFixture,
  login,
  selectFirst,
  selectOptionByLabel,
  sendChatMessage,
  startFirstLesson,
} from "./helpers.js";

/**
 * Admin dashboard — curriculum file import (Path B, PHASE 14):
 * an admin uploads a PDF curriculum file, ties it to a lesson scope, and the
 * document appears in the knowledge-base list. Also verifies the student role
 * never sees the admin entry point, and that byte-identical re-imports are
 * rejected with a clear error (file-level dedup).
 */
test.describe.configure({ mode: "serial" });

const ADMIN = { email: "admin@alfarouq.test", password: "admin-demo-123" };

/**
 * PHASE 28 target lesson, as it exists in the official Ministry textbook
 * (PHASE 47): «استكشاف خط الأعداد» is the first lesson of «الوحدة الثانية».
 * The old anchor was the second lesson of «الوحدة الأولى», which the official
 * book no longer contains — that unit now holds exactly one lesson, so the walk
 * descends into «الوحدة الثانية» (three lessons) and picks its first.
 */
const TARGET_LESSON = "استكشاف خط الأعداد";
const TARGET_UNIT = "الوحدة الثانية";

async function pickTargetLesson(page: Page): Promise<void> {
  // PHASE 48: every level below is chosen by *label*, not by position. The scope
  // cascade is ordered by Arabic text, so "first option" silently meant
  // السعودية / اللغة الإنجليزية on some seeds — the walk then landed on a
  // curriculum with no «الوحدة الثانية» at all. Anchoring by label is
  // deterministic and reads as the intent: import into Egypt's Grade-6 official
  // math book.
  await selectOptionByLabel(page, "select-country", "مصر");
  await selectFirst(page, "select-system");
  await selectFirst(page, "select-grade");
  await selectOptionByLabel(page, "select-subject", "الرياضيات");
  await selectFirst(page, "select-curriculum");
  await selectFirst(page, "select-term");
  await selectOptionByLabel(page, "select-unit", TARGET_UNIT);

  const lessons = page.locator('[data-testid^="lesson-"]');
  await expect(lessons.first()).toBeVisible({ timeout: 20_000 });
  await lessons.first().click();
  await expect(page.getByTestId("admin-selected-lesson")).toContainText(TARGET_LESSON);
}

test("A1: an admin uploads a PDF curriculum file into a lesson and sees it in the knowledge base", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("open-admin")).toBeVisible();
  await page.getByTestId("open-admin").click();
  await expect(page.getByTestId("admin-screen")).toBeVisible({ timeout: 20_000 });

  await pickTargetLesson(page);

  await page.getByTestId("admin-file-input").setInputFiles({
    name: "curriculum.pdf",
    mimeType: "application/pdf",
    buffer: docFixture("curriculum.pdf"),
  });
  await page.getByTestId("admin-title-input").fill("ملف المنهج");

  const submit = page.getByTestId("admin-submit-upload");
  await expect(submit).toBeEnabled();
  await submit.click();

  // The ingest succeeds: a success notice with a retrieved chunk count shows.
  await expect(page.getByTestId("admin-upload-result")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("admin-upload-result")).toContainText("تم استيراد الملف بنجاح");

  // The document row appears in the list, tied to the lesson + chunk count.
  const row = page.getByTestId("admin-doc-row").filter({ hasText: "ملف المنهج" });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await expect(row).toContainText("استكشاف خط الأعداد");
  await expect(row).toContainText("PDF");
  const chunks = Number(await row.getAttribute("data-chunks"));
  expect(chunks).toBeGreaterThan(0);
});

test("A2: re-importing byte-identical file bytes for the same curriculum is rejected with a clear error", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await page.getByTestId("open-admin").click();
  await expect(page.getByTestId("admin-screen")).toBeVisible({ timeout: 20_000 });

  await pickTargetLesson(page);

  await page.getByTestId("admin-file-input").setInputFiles({
    name: "curriculum-copy.pdf",
    mimeType: "application/pdf",
    buffer: docFixture("curriculum.pdf"),
  });

  const submit = page.getByTestId("admin-submit-upload");
  await expect(submit).toBeEnabled();
  await submit.click();

  // Server-side file dedup rejects it: same bytes, same curriculum.
  await expect(page.getByTestId("admin-upload-error")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("admin-upload-error")).toContainText("مستورد مسبقًا");
});

test("A3: a student never sees the admin entry point", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("open-admin")).toHaveCount(0);
});

test("A4: the admin dashboard shows the subscription funnel and AI usage/savings cards (PHASE 27)", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("open-admin").click();
  await expect(page.getByTestId("admin-screen")).toBeVisible({ timeout: 20_000 });

  // The legacy operational stats grid plus the two PHASE 27 sections render.
  await expect(page.getByTestId("admin-stats")).toBeVisible({ timeout: 20_000 });
  const subscriptions = page.getByTestId("admin-stats-subscriptions");
  await expect(subscriptions).toBeVisible();
  await expect(subscriptions.getByTestId("admin-stat-subs-active")).toContainText(/مميزة سارية/);
  await expect(subscriptions.getByTestId("admin-stat-subs-conversion")).toContainText("معدل التحويل");
  const ai = page.getByTestId("admin-stats-ai");
  await expect(ai).toBeVisible();
  await expect(ai.getByTestId("admin-stat-ai-cache-hit")).toContainText("الكاش");
  await expect(ai.getByTestId("admin-stat-ai-savings")).toContainText("وفورات");
});

/**
 * PHASE 28 — LLM question generation for questionless concepts: the admin binds
 * the Egyptian curriculum and generates coverage for everything the seed leaves
 * empty.
 *
 * PHASE 48: this used to pin the exact total ("تم توليد 23 سؤالًا"), a number
 * that describes the *old* hand-built Egypt tree (35 concepts, 12 seeded). The
 * PHASE 47 official Ministry book has a different shape, so the count moved and
 * the assertion rotted. A magic number is the wrong contract for "cover the
 * gaps": the test now asserts the invariants that actually matter — at least one
 * question was generated, already-covered concepts were skipped rather than
 * duplicated, and nothing failed.
 */
test("A5 (PHASE 28): the admin generates questions for questionless concepts in the chosen curriculum", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("open-admin").click();
  await expect(page.getByTestId("admin-screen")).toBeVisible({ timeout: 20_000 });

  // Bind curriculumId to the Egyptian *mathematics* curriculum — chosen by label
  // so the walk cannot silently land on English or on Saudi Arabia.
  await selectOptionByLabel(page, "select-country", "مصر");
  await selectFirst(page, "select-system");
  await selectFirst(page, "select-grade");
  await selectOptionByLabel(page, "select-subject", "الرياضيات");
  await selectFirst(page, "select-curriculum");

  const generate = page.getByTestId("admin-gen-questions");
  await expect(generate).toBeEnabled({ timeout: 20_000 });
  await generate.click();

  const result = page.getByTestId("admin-gen-result");
  await expect(result).toBeVisible({ timeout: 30_000 });
  const report = await result.innerText();

  // Invariants, not a magic total: gaps were filled, covered concepts were left
  // alone, and the generator reported no failures.
  const generated = Number(report.match(/تم توليد\s+(\d+)/)?.[1] ?? "0");
  const skipped = Number(report.match(/تخطّى\s+(\d+)/)?.[1] ?? "0");
  const failed = Number(report.match(/فشل\s+(\d+)/)?.[1] ?? "-1");
  expect(generated, `unexpected generation report: ${report}`).toBeGreaterThan(0);
  expect(skipped, `expected already-covered concepts to be skipped: ${report}`).toBeGreaterThan(0);
  expect(failed, `generation reported failures: ${report}`).toBe(0);
});

test("A6 (PHASE 34): the admin dashboard shows 14-day activity columns and the most-active lessons", async ({ page }) => {
  // PHASE 48: this used to lean on the shared E2E database already holding lesson
  // sessions "from the earlier specs", and to assert the ranking contains
  // «الجمع والطرح على الأعداد الطبيعية» — a lesson of the old hand-built tree
  // that the PHASE 47 official book does not contain. It now produces its own
  // traffic and asserts the ranking carries the title of the lesson it actually
  // studied, so it proves the analytics path on its own instead of on luck.
  await login(page, DEMO_STUDENT.email, DEMO_STUDENT.password);
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });

  // Start a real lesson and read the title the room's ribbon shows for it.
  await startFirstLesson(page);
  const lessonTitle = (await page.getByTestId("room-lesson-title").textContent())?.trim() ?? "";
  expect(lessonTitle.length).toBeGreaterThan(0);
  await sendChatMessage(page, "أراجع هذا الدرس لأري لوحة نشاط المعلم");

  // Leave the lesson (the room asks before leaving), then switch to the admin.
  page.once("dialog", (d) => void d.accept());
  await page.getByTestId("end-session").click();
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("logout").click();
  await expect(page.getByTestId("input-email")).toBeVisible({ timeout: 20_000 });

  await login(page, ADMIN.email, ADMIN.password);
  await page.getByTestId("open-admin").click();
  await expect(page.getByTestId("admin-screen")).toBeVisible({ timeout: 20_000 });

  const trends = page.getByTestId("admin-stats-trends");
  await expect(trends).toBeVisible({ timeout: 20_000 });
  await expect(trends.getByTestId("admin-stat-trend-sessions")).toContainText("جلسة");
  await expect(trends.getByTestId("admin-stat-trend-messages")).toContainText("رسالة");
  await expect(trends.getByTestId("admin-stat-trend-ai-calls")).toContainText("نداء ذكاء اصطناعي");

  // One column per UTC day of the window, for both charts.
  await expect(page.getByTestId("admin-trend-bars-sessions").getByTestId("admin-trend-bar")).toHaveCount(14);
  await expect(page.getByTestId("admin-trend-bars-messages").getByTestId("admin-trend-bar")).toHaveCount(14);

  // The ranking lists the lesson that was actually studied, with its count.
  const topLessons = trends.getByTestId("admin-trend-top-lessons");
  await expect(topLessons.getByTestId("admin-trend-top-lesson").first()).toBeVisible({ timeout: 20_000 });
  await expect(topLessons).toContainText(lessonTitle);
});