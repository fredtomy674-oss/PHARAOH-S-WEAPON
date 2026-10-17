import { expect, test } from "@playwright/test";
import { login, selectFirst, selectOptionByLabel } from "./helpers.js";

/**
 * PHASE 161 (W6) — «رحلتي»: مساحة الرحلة (حديقة النيل الحتمية · إتقاني ·
 * إنجازاتي بنفس العقود · سجل جلساتي · دفتر أخطائي).
 *
 * ملف مستقل عن `journey.spec.ts` (عقود الجلسة والعزل منذ المراحل الأولى) —
 * هذان الاختباران يخصّان المساحة نفسها:
 * JN1 يثبّت الهيكل والحتمية الحيّة: نفس بيانات الإتقان ⇒ نفس زرع الحديقة.
 * JN2 يثبّت الحلقة الوحيدة الجديدة: إجابة خاطئة تدخل «دفتر أخطائي»،
 * و«راجع هذه» يفتح تمرينًا مقيّدًا بالمفهوم نفسه.
 */

const G6_MATH_UNIT = "الوحدة الأولى: قابلية القسمة والعوامل والمضاعفات";
const G6_MATH_LESSON = "المفهوم 1-1";

/** نفس المسار الحتمي في مواصفات 159/160: كتاب الرياضيات المصري للصف السادس. */
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

test("JN1 (PHASE 161): «رحلتي» تفتح من التنقّل — الحديقة حتمية والشـارات كما كانت", async ({ page }) => {
  await login(page);
  await page.getByTestId("nav-journey").click();
  await expect(page.getByTestId("achievements-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("journey-title")).toContainText("رحلتي");

  // الحديقة: زرع حتمي — نقرأ عدد النباتات ثم نعيد الزيارة ونقارن.
  const garden = page.getByTestId("journey-garden");
  await expect(garden).toBeVisible({ timeout: 20_000 });
  const plants = await garden.getAttribute("data-plants");
  expect(plants, "الحديقة بلا data-plants").not.toBeNull();

  // الإنجازات: العقد القديم نفسه — 12 صفًا بشاراتها وعدّادها.
  await expect(page.getByTestId("achievement-list")).toBeVisible({ timeout: 20_000 });
  expect(await page.getByTestId("achievement-row").count()).toBe(12);
  await expect(page.getByTestId("achievements-earned")).toBeVisible();

  // بقية المساحات حاضرة دائمًا (محتوى أو فراغ صادق — لا كذب).
  await expect(page.getByTestId("journey-mastery")).toBeVisible();
  await expect(page.getByTestId("journey-sessions")).toBeVisible();
  await expect(page.getByTestId("journey-mistakes")).toBeVisible();

  // حتمية حيّة: إعادة الزيارة بنفس البيانات ⇒ نفس الزرع بالضبط.
  await page.reload();
  await page.getByTestId("nav-journey").click();
  await expect(page.getByTestId("journey-garden")).toBeVisible({ timeout: 20_000 });
  expect(await page.getByTestId("journey-garden").getAttribute("data-plants")).toBe(plants);
});

test("JN2 (PHASE 161): خطأ في الاختبار يدخل الدفتر و«راجع هذه» يفتح تمرينًا على المفهوم", async ({ page }) => {
  await login(page);
  await page.getByTestId("start-lesson").click();
  await expect(page.getByTestId("learn-screen")).toBeVisible({ timeout: 20_000 });
  await openG6MathLesson(page);

  // إجابة خاطئة عمدًا — آخر خيار خطأ دائمًا في أسئلة البذور (مفاتيح 0/1/2)؛
  // والطقم قد يخدم قبلنا أسئلة مولّدة، فنكرّر حتى تُسجَّل إجابة خاطئة فعلًا.
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

  // «رحلتي»: الخطأ ظهر في الدفتر بمفهومه واختياره الخاطئ.
  await page.getByTestId("nav-journey").click();
  await expect(page.getByTestId("achievements-screen")).toBeVisible({ timeout: 20_000 });
  const item = page.getByTestId("journey-mistake").first();
  await expect(item).toBeVisible({ timeout: 20_000 });
  await expect(item).toContainText("اخترت:");

  // «راجع هذه»: تمرين مقيّد بالمفهوم نفسه — سؤال وحيد الإجابة MCQ.
  const review = item.getByTestId("journey-mistake-review");
  await expect(review).toBeEnabled();
  await review.click();
  await expect(page.getByTestId("journey-practice")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("journey-practice-question")).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("journey-practice-option").first().click();
  await page.getByTestId("journey-practice-submit").click();
  await expect(page.getByTestId("journey-practice-feedback")).toBeVisible({ timeout: 20_000 });
  // المفهوم متتبَّع دائمًا هنا ⇒ شريحة الإتقان تظهر مع النتيجة.
  await expect(page.getByTestId("journey-practice-mastery")).toBeVisible();
});
