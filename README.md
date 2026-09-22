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
| `npm run test` | كل الاختبارات (أوفلاين) |
| `npm run check` | typecheck + lint + test |

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