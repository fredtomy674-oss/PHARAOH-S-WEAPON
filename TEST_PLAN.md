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