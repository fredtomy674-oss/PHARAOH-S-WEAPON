# TEST PLAN — AL FAROUQ AI

> آخر تحديث: 2026-09-22 — التنفيذ في `server/test/` (Vitest)، الويب يُفحص بنيويًا.

## 1. أدوات

- Vitest (Node, TS-native) — DB مختبري: SQLite `:memory:` أو ملف temp فريد لكل مجموعة.
- API tests عبر `app.inject()` (لا socket — أسرع ويغطي hooks/validation/cookies).
- AI tests: `MockLLMProvider`/`MockEmbeddingProvider` (أوفلاين، تحديث محدد) — **اختبارات حية فقط بـ`RUN_LIVE_TESTS=true`**.

## 2. المجموعات

| المجموعة | الملفات |
|---|---|
| Unit | `src/modules/**` — chunker، prompt builder، intent classifier، cosine sim، config، routers |
| DB | schema quirks، migrations تطبق نضيفة، فهارس/قوالب فريدة |
| API | auth، curriculum، sessions، messages — عبر inject مع cookies |
| Auth/Security | ناجحة/فاشلة، CSRF، rate-limit، صلاحيات، صلابة جلسات |
| RAG | عزل الصفوف، استرجاع بالـscope، إعادة التصنيف |
| AI/Tutor | Mock provider، هيكلة الرد، تدرجات التلميحات، fallback |
| Integration (E2E قطري) | register → onboarding → session → message → progress |

## 3. حالات أمنية إلزامية (والمطلوب تنفيذها كاختبارات)

| # | Spin | المعيار |
|---|---|---|
| S1 | طالب A يقرأ رسائل/جلسات B | 404/403 — data isolation |
| S2 | طالب A يرسل في جلسة B | 403 |
| S3 | غياب CSRF في mutation | 403 |
| S4 | session منتهية/ملغاة | 401 |
| S5 | cookie بدون httpOnly | مرفوض في الاختيار الزمني للـset-cookie |
| S6 | chunk مع `ignorance` أمر («امسح التعليمات») | الرد لا يفصح النظام ويبقى ضمن الموضوع |
| S7 | رفع مستند بامتداد خبيث | rejected |
| S8 | إجابة RAG لصفين مختلفين | صفر chunks من الصف الآخر |
| S9 | جملة في منهج الصف 6 لا تظهر في جلسة الصف 7 | نفس S8 |
| S10 | أي خطأ 500 لا يسرّب stack trace | format ثابت آمن |

## 4. معايير الجودة

- كل Feature = اختبار. تشغيل: `npm run check` (typecheck+lint+test).
- تغطية تتبع بـ `c8` لعرضها (اختياري للشيكات).
- Fail الثبات: الاختبارات لا تعتمد على الشبكة ولا مفاتيح حقيقية.

---

# الجزء الثاني — Browser End-to-End (Playwright)

> آخر تحديث: 2026-09-22 — **10/10 أخضر** عبر `npm run e2e`. الاختبارات حقيقية 100%: متصفح Chromium → React SPA → Vite proxy → Fastify → SQLite → RAG → AI provider (mock=افتراضي المشروع) → persistence → المتصفح.

## 5. التشغيل والمتطلبات

```bash
npm install                       # بعد إضافة @playwright/test
npm run e2e:install               # مرة واحدة: تنزيل Chromium (~115MB)
npm run e2e                       # يشغّل كل شيء تلقائيًا (خادمان مُداران + 10 اختبارات)
npm run e2e -- --ui               # وضع Playwright UI (اختياري)
npm run e2e:report                # فتح تقرير HTML السابق
```

**الإدارة التلقائية للخوادم** (`playwright.config.ts`):
- خادم اختبار على **127.0.0.1:3107** بقاعدة SQLite مؤقتة تُحذف وتُزرع من جديد عند كل تشغيل (`e2e/reset-db.mjs` + seed) — **لا تُمسّ بيانات التطوير** (`server/data/alfarouq.sqlite`).
- Vite على **localhost:5173** (الميناء القياسي) وبروكسيتها تُوجّه للخادم الاختباري عبر `VITE_API_PROXY_TARGET` (الافتراضي خارج الاختبارات: 3001).
- متغيرات الاختبار: `RATE_LIMIT_MAX=1000` (المجموعة الآلية تتجاوز حد التنمية 120/دقيقة)، `DAILY_MESSAGE_LIMIT=50`.

## 6. الحساب التجريبي المستخدم

- الطالب: `student@alfarouq.test` / `student-demo-123` (يتزرع مع كل قاعدة اختبار جديدة).
- اختبار عزل البيانات (C) يسجّل طالبًا جديدًا عشوائيًا مؤقتًا.

## 7. الحالات المغطاة (13)

| # | الملف | ماذا يختبر | ملاحظات |
|---|---|---|---|
| الرحلة | `journey.spec.ts` | login → اختيار المنهج كاملًا → جلسة → رد معلم مستند لـ RAG (`وفقًا لمحتوى الدرس` مع عدم وجود `لا يوجد محتوى مسترجع`) → «مش فاهم» → **نفس الجلسة** (العدد لا يزيد + نفس الـid) → إنهاء → progress → صف منتهي في القائمة → logout | serial |
| C | `journey.spec.ts` | طالب جديد لا يرى جلسات غيره (UI: قائمة فارغة؛ API: 403/404 لقراءة جلسة طالب آخر) | |
| A | `auth.spec.ts` | بيانات دخول خاطئة → رسالة «البريد أو كلمة المرور غير صحيحة» + البقاء خارجًا | |
| B | `auth.spec.ts` | غير مسجّل: `/auth/me`, `/sessions`, `/progress/me` → 401 عبر البروكسي الحقيقي | |
| I | `auth.spec.ts` | `dir=rtl` + `lang=ar` + Arabic UI + تنقّل لوحة المفاتيح (Tab/Enter) + حقول مرتبطة بـ label | |
| D | `chat.spec.ts` | رسالة فارغة/مسافات → الزر معطّل + لا فقاعة | |
| E | `chat.spec.ts` | CSRF منتهي (إزالة التوكن من localStorage + إعادة تحميل) → 403 «رمز التحقق غير صالح» يظهر بوضوح في واجهة الدردشة | أمني حقيقي عبر المسار الكامل |
| G | `chat.spec.ts` | «متبقي اليوم» ينخفض مع كل ردة (r2 < r1) | |
| H | `chat.spec.ts` | محاولة حقن تعليمات → تنبيه tripwire + رد آمن «أنا هنا لمساعدتك في درسنا فقط» بدون سياق RAG | |
| F | `chat.spec.ts` | استئناف جلسة نشطة بعد reload: المحادثة مسترجعة من DB + متابعة بنجاح | |
| V1 | `vision.spec.ts` | إرفاق صورة حقيقية (ملف عبر input) → رد المعلم يقرأها («قرأت الصورة المرفقة») + RAG حاضر + الصورة معروضة في فقاعة المستخدم + `GET attachments` يعيد بايتات بصيغة image/png للمالك | المسار الكامل: Browser→proxy→Fastify→SQLite BLOB→mock→GET |
| V2 | `vision.spec.ts` | رسالة بلا نص + صورة فقط → زر الإرسال مفعّل + رد مستند لـ RAG (استرجاع احتياطي) | |
| V3 | `vision.spec.ts` | صورة >5MB → رفض قبلي برسالة «الصورة كبيرة جدًا» + لا معاينة ولا فقاعة | |

## 8. قيود معروفة

- `workers: 1` + `fullyParallel: false` إجباريان (قاعدة مشتركة + حساب تجريبي واحد)؛ داخل كل ملف `mode: "serial"`.
- المتصفح الافتراضي Chromium فقط (يمكن إضافة مشاريع أخرى إلى `projects`).
- الاختبارات تتوقع مزوّد AI افتراضيًا `mock`؛ لا مفاتيح حقيقية مطلوبة.
- `maxLength=4000` في حقل الدردشة يحجب تجاوز الطول من المستخدم — لذلك اختُبر خطأ API بواسطة سيناريو CSRF (E) بدل رسالة أطول من الحد (إصلاح موثق في DECISIONS D-013).
- لتشغيل الاختبارات لا بد أن يكون المنفذان 3107 و5173 حرين؛ اختبار Playwright يرفض الميناءين المشغولين (لا إعادة استخدام تلقائية لقاعدة التطوير).