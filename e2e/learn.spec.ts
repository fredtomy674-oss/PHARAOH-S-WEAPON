import { expect, test } from "@playwright/test";
import { endAllActiveSessions, login, selectFirst, selectOptionByLabel } from "./helpers.js";

/**
 * PHASE 159 (W3) — «تعلّم» وصفحة الدرس:
 * منتقٍ بصري (مادة ← وحدة ← درس)، صفحة درس تجمع كل شيء عن الدرس وتبدأ الحصة،
 * و«اختبرني» — اختبار قصير مقيّد بمفاهيم الدرس بتصحيح حتمي.
 */

const G6_MATH_UNIT = "الوحدة الأولى: قابلية القسمة والعوامل والمضاعفات";
const G6_MATH_LESSON = "المفهوم 1-1";

/**
 * الوصول الحتمي لدرس «المفهوم 1-1» من كتاب الرياضيات المصري للصف السادس
 * (نفس النطاق الذي تستورده مواصفات الإدارة — فصول/وحدات بعناوين ثابتة).
 */
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

test("LE1 (PHASE 159): the visual picker, the lesson page, and the direct return to the last pick", async ({ page }) => {
  await login(page);
  await page.getByTestId("start-lesson").click();
  await expect(page.getByTestId("learn-screen")).toBeVisible({ timeout: 20_000 });

  // المنتقي المرئي: الصف محفوظ → بطاقات المواد تظهر بلا أي خطوة أعمق،
  // والخطوات الأعمق (نظام · منهج · فصل) مطويّة فعلًا.
  await expect(page.getByTestId("select-country")).toBeHidden();
  await expect(page.getByTestId("select-subject").locator("[data-value]").first()).toBeVisible({ timeout: 20_000 });

  await openG6MathLesson(page);

  // صفحة الدرس: العنوان وموضعه ومفاهيمه الحقيقية.
  await expect(page.getByTestId("lesson-title")).toContainText(G6_MATH_LESSON, { timeout: 20_000 });
  await expect(page.getByTestId("lesson-place")).toContainText("الرياضيات");
  await expect(page.getByTestId("lesson-concept").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("lesson-mastery").first()).toBeVisible();

  // رجوع → «آخر اختيار» يعود مباشرة: المادة والوحدة والدرس بانتظاره.
  await page.getByTestId("lesson-back").click();
  await expect(page.getByTestId("learn-screen")).toBeVisible({ timeout: 20_000 });
  const lessonAgain = page.locator('[data-testid^="lesson-"]', { hasText: G6_MATH_LESSON }).first();
  await expect(lessonAgain).toBeVisible({ timeout: 20_000 });
  await lessonAgain.click();
  await expect(page.getByTestId("lesson-page")).toBeVisible({ timeout: 20_000 });

  // «ابدأ حصة ▶» تفتح الغرفة (02 كما هي).
  await page.getByTestId("lesson-start").click();
  await expect(page.getByTestId("chat-input")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("messages")).toBeVisible();

  // لا نترك جلسة مفتوحة للمواصفات التالية.
  page.on("dialog", (d) => void d.accept());
  await page.getByTestId("end-session").click();
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
});

test("LE2 (PHASE 159): اختبرني runs a lesson-scoped quiz with deterministic grading", async ({ page }) => {
  await login(page);
  await page.getByTestId("start-lesson").click();
  await expect(page.getByTestId("learn-screen")).toBeVisible({ timeout: 20_000 });
  await openG6MathLesson(page);

  // «اختبرني» يعمل من مفاهيم الدرس (أسئلة البذور مرتبطة بها — إصلاح 158).
  await expect(page.getByTestId("lesson-concept").first()).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("lesson-quiz-open").click();
  await expect(page.getByTestId("quiz-panel")).toBeVisible({ timeout: 20_000 });
  const progress = page.getByTestId("quiz-progress");
  await expect(progress).toContainText("سؤال", { timeout: 20_000 });

  // أجب عن كل سؤال: اختيار → تصحيح حتمي (بلا AI) → التالي، حتى النتيجة.
  let answered = 0;
  for (; answered < 6; answered += 1) {
    await page.getByTestId("quiz-option").first().click();
    await page.getByTestId("quiz-submit").click();
    await expect(page.getByTestId("quiz-feedback")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("quiz-next").click();
    // إما سؤال تالٍ أو النتيجة النهائية — كلاهما مقبول بعد «التالي».
    await expect(page.getByTestId("quiz-option").first().or(page.getByTestId("quiz-result"))).toBeVisible({ timeout: 20_000 });
    if (await page.getByTestId("quiz-result").isVisible()) break;
  }
  const result = page.getByTestId("quiz-result");
  await expect(result).toBeVisible({ timeout: 20_000 });
  const resultText = ((await result.textContent()) ?? "").replace(/\s+/g, " ");
  expect(resultText).toContain("أجبت");
  expect(resultText, `expected the final score of ${answered + 1} answered questions`).toContain(`من ${answered + 1}`);

  // لا يتسرب مفتاح الإجابة إلى الـDOM.
  await expect(page.locator("body")).not.toContainText("correctIndex");
  await expect(page.locator("body")).not.toContainText("answerKey");

  await page.getByTestId("quiz-close").click();
  await expect(page.getByTestId("quiz-panel")).toHaveCount(0);
});

test("LE3 (PHASE 159): the hub's first card follows the real session state — last lesson, then resume", async ({ page }) => {
  page.on("dialog", (d) => void d.accept());
  await login(page);

  // Clean slate: earlier specs may have left sessions open, and the hub's first
  // card follows the student's REAL session state (ended through the app API).
  await endAllActiveSessions(page);

  // 1) A finished session → «آخر درس» opens the lesson page directly.
  await page.getByTestId("start-lesson").click();
  await expect(page.getByTestId("learn-screen")).toBeVisible({ timeout: 20_000 });
  await openG6MathLesson(page);
  await page.getByTestId("lesson-start").click();
  await expect(page.getByTestId("chat-input")).toBeVisible({ timeout: 20_000 });
  // PHASE 179 — الدخول إلى الغرفة لا يفتح كيبورد الهاتف: اللوحة أولًا،
  // والكتابة عند لمس الحقل فقط.
  await expect(page.getByTestId("chat-input")).not.toBeFocused();
  await page.getByTestId("end-session").click();
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("nav-learn").click();
  await expect(page.getByTestId("learn-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("learn-last")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("learn-last")).toContainText(G6_MATH_LESSON);
  await page.getByTestId("learn-last-lesson").click();
  await expect(page.getByTestId("lesson-page")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("lesson-title")).toContainText(G6_MATH_LESSON, { timeout: 20_000 });

  // 2) An OPEN session wins the card → «أكمل الجلسة» returns to the room.
  await page.getByTestId("lesson-start").click();
  await expect(page.getByTestId("chat-input")).toBeVisible({ timeout: 20_000 });
  await page.goto("/");
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("nav-learn").click();
  await expect(page.getByTestId("learn-resume")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("learn-resume-open").click();
  await expect(page.getByTestId("chat-input")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("messages")).toBeVisible();

  // Leave a clean slate behind for the specs that follow.
  await page.getByTestId("end-session").click();
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });
});

test("LE4 (PHASE 178): «موادك» on the home opens «تعلّم» with that subject already selected", async ({ page }) => {
  await login(page);
  // The same G6 grade the picker helper uses above, so the card set is known.
  await page.getByTestId("nav-learn").click();
  await expect(page.getByTestId("learn-screen")).toBeVisible({ timeout: 20_000 });
  await selectOptionByLabel(page, "select-country", "مصر");
  await selectFirst(page, "select-system");
  await selectOptionByLabel(page, "select-grade", "الصف السادس الابتدائي");
  await page.getByTestId("nav-today").click();
  await expect(page.getByTestId("home-screen")).toBeVisible({ timeout: 20_000 });

  // PHASE 179 — الصفحة تعلن صفّها وتعرض مؤشرًا حيًّا وخطة أسبوع، لا قائمة
  // أهداف. الثلاثة موجودة قبل أي تمرين (حتى لو كانت القيم صفرًا).
  await expect(page.getByTestId("weekly-plan")).toBeVisible();
  await expect(page.getByTestId("weekly-step-lesson")).toBeVisible();
  await expect(page.getByTestId("weekly-step-practice")).toBeVisible();
  await expect(page.getByTestId("weekly-step-review")).toBeVisible();

  // The card names a subject — it must land ON it, not at the top of the picker.
  const mathCard = page.getByTestId("subject-card").filter({ hasText: "الرياضيات" }).first();
  if (!(await mathCard.isVisible().catch(() => false))) {
    const more = page.getByTestId("subjects-more");
    if ((await more.count()) > 0) await more.click();
  }
  await expect(mathCard).toBeVisible({ timeout: 20_000 });
  await mathCard.click();

  await expect(page.getByTestId("learn-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-testid="subject-option"][aria-pressed="true"] .ln-subject__name')).toHaveText("الرياضيات", {
    timeout: 20_000,
  });
  await expect(page.getByTestId("unit-option").filter({ hasText: G6_MATH_UNIT })).toBeVisible({ timeout: 20_000 });
});
