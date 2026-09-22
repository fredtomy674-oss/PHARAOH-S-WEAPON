# CHANGELOG — AL FAROUQ AI

> تنسيق: [يوم-شهر-سنة] — سطر واحد لكل تغيير هام. لا تُحذف السجلات.

## 2026-09-22 — الجلسة الأولى (البناء)
- PHASE 0: فحص البيئة (Win10 x64, Node 24, SQLite, RTX 3060, لا Docker/Postgres/Redis; git ✓).
- PHASE 1: إنشاء workspace-root (npm workspaces server+web), tsconfig.base, .gitignore, .env.example.
- PHASE 1: إنشاء 14 مستندًا أساسيًا للمشروع (PROJECT_BIBLE, PRD, Architecture, DB Schema, AI Engine, Curriculum, RAG, API, UI/UX, Security, Test Plan, Decisions, Tasks, Changelog, README).
- DECISIONS: D-001..D-010 (TS/workspaces, Fastify, Drizzle+SQLite, SqliteVectorStore, AI abstraction, DB sessions+CSRF, Metadata-first RAG, React+Vite, Vitest, cost tracker).

## 2026-09-22 — الجلسة الثانية (الخادم + الشريحة الرأسية + الويب)
- PHASE 2: هيكلة `server/src` (app.ts, index.ts, config zod, plugins container/auth) + خطأ موحّد بلا تسريب stack.
- PHASE 2: Drizzle schema (33 جدولًا) + توليد/تطبيق migration تلقائيًا + فهارس، ترقية drizzle-orm إلى 0.45.3 (عالي-sev) وvitest إلى 5.0.1.
- PHASE 3: auth (register/login/logout/me, sessions DB, CSRF, bcryptjs, rate-limit) + /api/profile.
- PHASE 4: seed idempotent مصر/وزارة التربية/صف6/رياضيات (3 دروس + مفاهيم + docs chunked+embedded mock) + demo accounts + admin ingestion (txt/md فقط).
- PHASE 5: RAG كامل (EmbeddingProvider mock/gemini + SqliteVectorStore + cosine + scopeFilter إلزامي).
- PHASE 6: AI abstraction (Mock/Gemini للـLLM والـEmbeddings) + ModelRouter + UsageTracker + AiCache + IntentClassifier (tripwire للحقن) + PromptBuilder + Memory/Progress.
- PHASE 7: Sessions/Messages API مع إجبار الملكية + Tutoring multi-turn + progress.
- PHASE 8: 61/61 اختبارًا (unit+db+api+security S1–S10) — `npm run check` أخضر بالكامل.
- التحقق الحي (server): `slice-test.ps1` عبر 127.0.0.1:3001 — SLICE-OK (login→catalog→session→tutor chunks=2→tripwire→progress→end).
- الويب (PHASE 7): إنشاء `web/` (Vite 6 + React 19 + TS + RTL CSS عربي) — auth, onboarding picker, chat «فهمت/مش فاهم», Home/progress, Vite proxy /api→:3001.
- إصلاح: عميل الويب لا يرسل `Content-Type: application/json` مع POST بلا جسم (Fastify 400 FST_ERR_CTP_EMPTY_JSON_BODY) — مزامنة `ProgressDetail` مع شكل الاستجابة الفعلية.
- التحقق الحي (web): `web-slice.ps1` عبر بروكسي Vite 5173 — WEB-SLICE-OK (SPA/RTL, login, catalog walk كامل, session, tutor, re-explain, progress, end, logout).
- DECISIONS: NOTE — قبول 4 ثغرات moderate dev-only (drizzle-kit→esbuild)؛ توثيق سلوك Fastify للـJSON الفارغ.
- Commits: multi (phase2…phase8) بأسلوب Conventional Commits.

## 2026-09-22 — الجلسة الثالثة (اختبارات Browser E2E بـ Playwright)
- PHASE 9: تثبيت `@playwright/test` + Chromium؛ `playwright.config.ts` يدير خادمين تلقائيًا (backend اختبار 3107 بقاعدة SQLite مؤقتة تُزرع كل تشغيل + Vite 5173 يوجّه بروكسيته لخادم الاختبار عبر `VITE_API_PROXY_TARGET`).
- سكربتات: `e2e`/`e2e:install`/`e2e:report`/`e2e:backend` (reset-db + seed + start) + `start:src` في الـserver.
- الواجهة: `data-testid` منظمة (auth/onboarding/chat/home) + `aria-label` لحقل الدردشة + `data-session-id` لصفوف الجلسات (بلا إعادة تصميم).
- أول تشغيل E2E كشف **عيبين حقيقيين في الخادم**: (1) معالج الأخطاء كان يبتلع رسالة rate-limit (RATE_LIMITED) ويحوّلها إلى 500 عام — الآن تمر حمولة الخطأ كما هي؛ (2) حد 120/دقيقة ثابت يكفي لتجربة يدهنها الـhealth-poll + مجموعة آلية — الآن `RATE_LIMIT_MAX` عبر env + `/api/health` مستثنى (`allowList`).
- 10/10 اختبارات E2E خضراء عبر متصفح حقيقي (رحلة كاملة + A..I: خطأ بيانات، حماية غير مسجّل، عزل طالب جديد، رسالة فارغة، خطأ API عبر CSRF منتهي، استئناف جلسة، استهلاك رصيد، tripwire حقن، RTL/لوحة مفاتيح).
- بعد E2E: `npm run check` أخضر (61/61 Vitest + typecheck + lint) و `npm run build` أخضر.
- DECISIONS: D-013 (بنية E2E + قرار rate-limit قابل للضبط وتمرير الرسائل).
- Commit: `phase9-playwright-e2e`.

## (أعمدة لاحقة تُضاف هنا كل مرحلة)