# AL FAROUQ AI — AI Tutor

مدرس خصوصي تفاعلي بالذكاء الاصطناعي يبني تجربة تعليمية شخصية لكل طالب، يبدأ من المناهج المصرية ومصمم للتوسع إلى الدول العربية.

> **انظر `PROJECT_BIBLE.md` أولًا** — هو الذاكرة الدائمة للمشروع (القرارات، العمارة، الحالة).

---

## المتطلبات

- Node.js >= 20 (طُوّر على v24)
- Git
- Windows/Linux/macOS — **لا يحتاج** Docker ولا PostgreSQL ولا مفاتيح AI للمعاينة (Mock provider افتراضي).

## التشغيل السريع (للمطوّر)

```bash
npm install

# 1) إعداد المتغيرات
cp .env.example .env        # ثم عدّل SESSION_SECRET فقط (للمعاينة يعمل بالافتراضي)

# 2) زرع بيانات المنهج + قاعدة البيانات (تُنشأ تلقائيًا عند أول إقلاع)
npm run db:seed

# 3) تشغيل كل شيء (server :3001 + web :5173)
npm run dev
```

افتح http://localhost:5173 → سجّل حسابًا → اختر: مصر → الصف السادس → الرياضيات → درس → ابدأ المذاكرة.

> السيرفر يطبّق migrations تلقائيًا عند الإقلاع. قاعدة البيانات تُخزن في `server/data/alfarouq.sqlite`.

## تفعيل المدرس AI الحقيقي (اختياري)

بدل `mock`:

```bash
# في .env
AI_LLM_PROVIDER=gemini
AI_EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=اكتب-مفتاحك-هنا
```

لا تضع المفتاح في أي ملف آخر. `.env` مستثنى من Git. الاختبارات الحية تحتاج `RUN_LIVE_TESTS=true` صراحةً (تكلفة + بيانات خارجية).

## الأوامر

| أمر | وصف |
|---|---|
| `npm run dev` | server + web معًا |
| `npm run dev:server` / `dev:web` | كل على حدة |
| `npm run db:seed` | زرع المنهج والمعرفة النموذجية |
| `npm run typecheck` | فحص الأنواع (كل الأعمال) |
| `npm run lint` | ESLint |
| `npm run test` | كل الاختبارات (أوفلاين Vitest 61/61) |
| `npm run check` | typecheck + lint + test |
| `npm run e2e` | اختبارات Browser E2E (Playwright) — 10/10 |
| `npm run e2e:install` | تنزيل Chromium (مرة واحدة) |
| `npm run e2e:report` | فتح تقرير HTML للاختبارات |

## اختبارات المتصفح (Playwright E2E)

اختبارات حقيقية عبر Chromium تمر المسار الكامل: **Browser → React → Vite proxy → Fastify → SQLite → RAG → AI provider → DB → Browser**. لا يستخدمون أي Mock للـAPI، والمزوّد الافتراضي هو Development Provider المدمج (`mock`).

```bash
npm run e2e:install   # مرة واحدة فقط
npm run e2e           # يُشغّل كل شيء تلقائيًا
```

- **عزل تام للبيانات**: اختبارات Playwright تشغّل خادمها الخاص على منفذ **3107** بقاعدة SQLite مؤقتة تُزرع من جديد عند كل تشغيل — لا تُمسّ بيانات التطوير أبدًا. واجهة الويب تُختبر على المنفذ القياسي **5173** وبروكسيتها تُوجّه لخادم الاختبار (المتغير `VITE_API_PROXY_TARGET`).
- **الحساب التجريبي**: `student@alfarouq.test` / `student-demo-123` (يُزرَع في كل قاعدة اختبار).
- **المتطلبات**: منفذا 3107 و5173 حرّان (اختبار Playwright يرفض ميناءً مشغولًا حتى لا يلمس بيئة التطوير). التفاصيل والقيود في `TEST_PLAN.md` §5–8.

## بنية المستودع

```
├─ PROJECT_BIBLE.md        ← الذاكرة الأساسية (اقرأني أولًا)
├─ *.md (14 وثيقة)         ← PRD, Architecture, DB, RAG, API, Security, Tests...
├─ server/                 ← Fastify + Drizzle + RAG + AI abstraction + Tutor engine
│  ├─ src/db/              ← schema + migrations
│  ├─ src/modules/         ← auth, curriculum, knowledge, rag, ai, tutor, sessions...
│  └─ test/                ← Vitest suites
└─ web/                    ← React 19 + Vite SPA (RTL عربي)
```

## الأمان والتكلفة

- جلسات DB + cookies httpOnly + CSRF + rate limiting يومي لكل طالب.
- كل طلبات AI مسجلة في `ai_usage_logs` (tokens/تقريب التكلفة). الحد الافتراضي 50 رسالة/طالب/يوم.
- لا توجد أسرار في الكود؛ كلها env vars (قالب في `.env.example`).

## الإنتاج (لاحقًا)

تغييرات موثقة للانتقال إلى PostgreSQL (driver swap)، وQdrant/pgvector للـvectors، وإضافة AI providers بمجرد env config — انظر `TECHNICAL_ARCHITECTURE.md` §6 و `DECISIONS.md`.

## الحالة الحالية

انظر `TASKS.md` و `CHANGELOG.md`.