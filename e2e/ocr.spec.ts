import { expect, test, type Page } from "@playwright/test";
import {
  attachDocument,
  docFixture,
  DOCUMENT_MARKER,
  login,
  OCR_MARKER,
  selectFirst,
  selectOptionByLabel,
  sendChatMessage,
  startFirstLesson,
} from "./helpers.js";

/**
 * OCR of scanned files (PHASE 19) — E2E:
 *   O1 (Path A): a student attaches a scanned PDF (valid PDF with NO text layer)
 *     → the AI OCR fallback recognizes the page and the tutor reads it like any
 *     document (marker + recognized text), and the attachment chip shows the
 *     "نص ممسوح ضوئيًا" badge.
 *   O2 (Path B): an admin imports the same scanned PDF into a lesson → the OCR
 *     text joins the knowledge base (chunk row + success notice).
 */
test.describe.configure({ mode: "serial" });

const ADMIN = { email: "admin@alfarouq.test", password: "admin-demo-123" };

async function expectTutorReply(page: Page, contain: string): Promise<string> {
  const tutorMsgs = page.getByTestId("msg-tutor");
  await expect(tutorMsgs).toHaveCount(1, { timeout: 30_000 });
  const text = (await tutorMsgs.first().textContent()) ?? "";
  expect(text).toContain(contain);
  return text;
}

test("O1: a scanned PDF is OCR'd — the tutor reads the recognized text and the badge shows", async ({ page }) => {
  await login(page);
  await startFirstLesson(page);

  // scanned.pdf is a real PDF whose text layer is EMPTY — exactly what an
  // image-only scan looks like to the extractor. OCR must recover its text.
  await attachDocument(page, "scanned.pdf", docFixture("scanned.pdf"));
  await sendChatMessage(page, "اقرأ الملف المرفق");

  const text = await expectTutorReply(page, DOCUMENT_MARKER);
  expect(text).toContain(OCR_MARKER);
  expect(text).toContain("scanned.pdf");

  // The user bubble renders the file chip WITH the OCR badge.
  await expect(page.getByTestId("msg-document")).toBeVisible();
  await expect(page.getByTestId("msg-ocr-badge")).toBeVisible();
  await expect(page.getByTestId("msg-ocr-badge")).toContainText("نص ممسوح ضوئيًا");
});

test("O2: an admin imports a scanned PDF and its OCR text joins the knowledge base", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("open-admin").click();
  await expect(page.getByTestId("admin-screen")).toBeVisible({ timeout: 20_000 });

  // First lesson of the seeded Egyptian unit.
  await selectOptionByLabel(page, "select-country", "مصر");
  await selectFirst(page, "select-system");
  await selectFirst(page, "select-grade");
  await selectFirst(page, "select-subject");
  await selectFirst(page, "select-curriculum");
  await selectFirst(page, "select-term");
  await selectFirst(page, "select-unit");
  const lessons = page.locator('[data-testid^="lesson-"]');
  await expect(lessons.first()).toBeVisible({ timeout: 20_000 });
  await lessons.first().click();

  await page.getByTestId("admin-file-input").setInputFiles({
    name: "scanned.pdf",
    mimeType: "application/pdf",
    buffer: docFixture("scanned.pdf"),
  });
  await page.getByTestId("admin-title-input").fill("درس ممسوح ضوئيًا — OCR");

  const submit = page.getByTestId("admin-submit-upload");
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.getByTestId("admin-upload-result")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("admin-upload-result")).toContainText("تم استيراد الملف بنجاح");

  const row = page.getByTestId("admin-doc-row").filter({ hasText: "درس ممسوح ضوئيًا — OCR" });
  await expect(row).toBeVisible({ timeout: 20_000 });
  const chunks = Number(await row.getAttribute("data-chunks"));
  expect(chunks).toBeGreaterThan(0);
});