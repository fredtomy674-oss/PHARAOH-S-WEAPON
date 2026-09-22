# SECURITY — AL FAROUQ AI

> آخر تحديث: 2026-09-22 — المبادئ مطبقة في الكود (اختبارات أمنية في TEST_PLAN).

## 1. المبادئ

1. لا أسرار في الكود — فقط env (انظر `.env.example`).
2. أقل صلاحية، فصل بيانات، افتراض الرفض.
3. أمان الطلاب أولوية؛ **بدون ادعاء امتثال قانوني** لأي دولة قبل مراجعة قانونية متخصصة.

## 2. المصادقة والجلسات

- كلمات مرور: `bcryptjs` (hash salted). JWT غير مستخدم — جلسات DB قابلة للإلغاء.
- Cookie: `alfarouq_session` — httpOnly, SameSite=Lax, Secure حسب `NODE_ENV=production`, maxAge محدد.
- CSRF: token مرتبط بالجلسة، يُطلب عبر header `x-csrf-token` لكل mutation؛ الاختبار يثبت الرفض عند غيابه.
- Rate limiting: `@fastify/rate-limit` عام + حد يومي لكل طالب على رسائل AI (`DAILY_MESSAGE_LIMIT`).

## 3. تفويض (Authorization)

- Auth hook يضخ `authUser` في كل route.
- الوصول إلى بيانات طالب/جلسة/تقدّم **يبدأ من الجلسة** — لا UUID من Client.
- مالكة الجلسة إلزامية: `session.student_id === auth.student.id` وإلا 403.
- مسارات `admin/*` محمية بدور admin (بلا مستخدمين admin في الـMVP seed — البنية جاهزة).

## 4. الحماية من Prompt Injection

- Chunks = بيانات غير موثوقة تُغلَّف بعزل واضح داخل الشرح بالموقع الثابت.
- Instruction text يوضح: محتوى `<context>` مرجعي فقط.
- Intent filter: أوامر «امسح قواعدك» تُصنَّف `admin_bypass_attempt` وتُرفض بأدب.
- المعالجة تعامل الـLLM output كبيانات غير موثوقة: تُصيَّف قبل العرض (escape HTML في المتصفح عبر React).

## 5. الملفات المرفوعة (أساس لاحق — جاهز المعماري)

- طول/حجم/نوع المُتحقق منه خادميًا، الامتدادات بيضاء القائمة، تخزين خارج جذر الويب، filename مولّد خادميًا (لا يثق بأسماء الملفات)، SHA-256 للتتبع. Extenders وهميين ملحوظين.

## 6. رؤوس HTTP وCORS

- CSP صارم (self + ws للـdev) عبر `@fastify/helmet` بدائل يدوية بسيطة.
- CORS مقيد بـ `WEB_ORIGIN` مع `credentials: true`.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`.

## 7. التدقيق (Audit)

- جدول `audit_logs`: تسجيل تسجيل الدخول/الخروج، تغييرات البروفايل، عمليات ingestion، محاولات غير مصرح بها (403).
- `ai_usage_logs`: نفقة/استخدام، بدون محتوى الرسائل.

## 8. الحماية العامة

- Validation عبر Fastify JSON-schema لكل body/query/params.
- لا تعرض stack traces؛ خطأ واحد شكل JSON آمن.
- NoSQL/ORM Injection غير وارد (Drizzle parametrized) — الاختبارات تضمن عدم كسر عناوين FK.