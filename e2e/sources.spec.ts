import { expect, test } from "@playwright/test";
import { login, selectFirst, selectOptionByLabel } from "./helpers.js";

/**
 * PHASE 160 (W5) — «مصادر الدرس»: التبويبات الستة (ملخص · تعريفات · بطاقات ·
 * أخطاء شائعة · أمثلة · مراجعة) تُبنى حتميًا من صفحات كتاب الطالب نفسه.
 *
 * SR1 يثبّت الهيكل وقاعدة التوثيق: «كل سطر يعرف صفحته».
 * SR2 يثبّت المصدر الحيّ الوحيد: إجابة خاطئة تُصبح «خطأ شائعًا» مجمّعًا —
 * بلا أسماء وبلا نص حر.
 */

const G6_MATH_UNIT = "الوحدة الأولى: قابلية القسمة والعوامل والمضاعفات";
const G6_MATH_LESSON = "المفهوم 1-1";

/** نفس المسار الحتمي في مواصفة تعلّم (159): كتاب الرياضيات المصري للصف السادس. */
async function openG6MathLesson(page: import("@playwright/test").Page): Promise<void> {
  await selectOptionByLabel(page, "select-country", "مصر");
  await selectFirst(page, "select-system");
  await selectOptionByLabel(page, "select-grade", "الصف السادس الابتدائي");
  await selectOptionByLabel(page, "select-subject", "الرياضيات");
  await selectOptionByLabel(page, "select-unit", G6_MATH_UNIT);
  const lesson = page.locator('[data-testid^="lesson-"]', { hasText: G6_MATH_LESSON }).first();
  await expect(lesson).toBeVisible({ timeout: 20_000 });
  await lesson.click();
  await expect(page.getByTestId("lesson-page")).toBeVisible({ timeout: 20_000 });
}

const SOURCE_TABS = ["summary", "definitions", "cards", "errors", "examples", "review"] as const;

test("SR1 (PHASE 160): six sources from the book — every line carries its page", async ({ page }) => {
  await login(page);
  await page.getByTestId("start-lesson").click();
  await expect(page.getByTestId("learn-screen")).toBeVisible({ timeout: 20_000 });
  await openG6MathLesson(page);

  // شريحة المرجع في الرأس: «كتابك — صفحات …» — مرجع لا نسخ (§15).
  await expect(page.getByTestId("lesson-book-pages")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("lesson-book-pages")).toContainText("صفحات");

  // التبويبات الستة كلها حاضرة.
  await expect(page.getByTestId("lesson-sources")).toBeVisible({ timeout: 20_000 });
  for (const tab of SOURCE_TABS) {
    await expect(page.locator(`[data-testid="source-tab"][data-tab="${tab}"]`)).toBeVisible();
  }

  // «ملخص» افتراضيًا: أهداف الكتاب نفسها، وكل سطر عليه صفحته.
  await expect(page.getByTestId("sources-panel")).toHaveAttribute("data-tab", "summary");
  const summaryItems = page.getByTestId("source-item");
  await expect(summaryItems.first()).toBeVisible({ timeout: 20_000 });
  expect(await summaryItems.count()).toBeGreaterThanOrEqual(3);
  await expect(page.getByTestId("source-item").filter({ hasText: "أستطيع أن" }).first()).toBeVisible();
  for (const item of await summaryItems.all()) {
    const pageChip = item.getByTestId("source-page");
    await expect(pageChip).toBeVisible();
    await expect(pageChip).toContainText(/صفحة \d+/);
  }

  // «بطاقات»: أنواع مرصودة + عدّادات الأنواع في المقدمة.
  await page.locator('[data-testid="source-tab"][data-tab="cards"]').click();
  await expect(page.getByTestId("source-counts")).toBeVisible();
  expect(await page.getByTestId("source-count").count()).toBeGreaterThanOrEqual(2);
  expect(await page.getByTestId("source-item").count()).toBeGreaterThanOrEqual(2);

  // «تعريفات»: ما عرّفه الكتاب بنفسه.
  await page.locator('[data-testid="source-tab"][data-tab="definitions"]').click();
  expect(await page.getByTestId("source-item").count()).toBeGreaterThanOrEqual(2);

  // «أمثلة»: مواقف الكتاب الحياتية من «استكشف».
  await page.locator('[data-testid="source-tab"][data-tab="examples"]').click();
  expect(await page.getByTestId("source-item").count()).toBeGreaterThanOrEqual(3);

  // «مراجعة»: قائمة تحقق من أهداف الكتاب + أسئلته.
  await page.locator('[data-testid="source-tab"][data-tab="review"]').click();
  expect(await page.getByTestId("source-item").count()).toBeGreaterThanOrEqual(3);

  // «أخطاء شائعة»: إما أخطاء حقيقية (مرصودة أو من الكتاب) وإما حالة فارغة صادقة.
  await page.locator('[data-testid="source-tab"][data-tab="errors"]').click();
  if ((await page.getByTestId("source-item").count()) === 0) {
    await expect(page.getByTestId("sources-empty")).toBeVisible();
  } else {
    // كل خطأ «من الكتاب» يحمل صفحته دائمًا (المرصود مجمّع بلا صفحة).
    const bookItems = page.locator('[data-testid="source-item"][data-kind="book"]');
    for (const item of await bookItems.all()) {
      await expect(item.getByTestId("source-page")).toBeVisible();
    }
  }
});

test("SR2 (PHASE 160): a wrong quiz answer becomes a مرصود «خطأ شائع» — بلا أسماء", async ({ page }) => {
  await login(page);
  await page.getByTestId("start-lesson").click();
  await expect(page.getByTestId("learn-screen")).toBeVisible({ timeout: 20_000 });
  await openG6MathLesson(page);

  // إجابة خاطئة عمدًا: آخر خيار خطأ دائمًا في أسئلة البذور لهذا الدرس (مفاتيح
  // الصواب 0/1/2 — لا 3). الطقم قد يخدم قبلنا أسئلة مولّدة (من مواصفات
  // الإدارة) يصحّ فيها آخر خيار أحيانًا، لذلك نتقدّم عبر الأسئلة حتى تُسجَّل
  // إجابة خاطئة فعلًا — والحلقة محصّنة في الحالتين.
  await page.getByTestId("lesson-quiz-open").click();
  await expect(page.getByTestId("quiz-question")).toBeVisible({ timeout: 20_000 });
  let wrongRecorded = false;
  for (let i = 0; i < 8; i += 1) {
    await page.getByTestId("quiz-option").last().click();
    await page.getByTestId("quiz-submit").click();
    const feedback = page.getByTestId("quiz-feedback");
    await expect(feedback).toBeVisible({ timeout: 20_000 });
    if ((await feedback.innerText()).includes("غير صحيحة")) {
      wrongRecorded = true;
      break;
    }
    const next = page.getByTestId("quiz-next");
    if ((await next.count()) === 0) break;
    await next.click();
    const question = page.getByTestId("quiz-question");
    await question.waitFor({ state: "visible", timeout: 10_000 }).catch(() => undefined);
    if (!(await question.isVisible().catch(() => false))) break; // انتهت الأسئلة → شاشة النتيجة
  }
  expect(wrongRecorded, "لم تُسجَّل إجابة خاطئة خلال أسئلة الاختبار").toBe(true);
  await page.getByTestId("quiz-close").click();
  await expect(page.getByTestId("quiz-panel")).toHaveCount(0);

  // «أخطاء شائعة» يعرض الخطأ المرصود مجمّعًا — سؤال + خيار خاطئ + عدد، بلا أسماء.
  await page.locator('[data-testid="source-tab"][data-tab="errors"]').click();
  const observed = page.locator('[data-testid="source-item"][data-kind="observed"]');
  await expect(observed.first()).toBeVisible({ timeout: 20_000 });
  await expect(observed.first()).toContainText("الخطأ المتكرر");
});
