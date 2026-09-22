# TASKS — AL FAROUQ AI

> **هذا الملف هو الحالة الحية للمشروع.** يقرأه أي وكيل/مهندس جديد لاستئناف العمل.
> System: 🔴 OPEN | 🟡 IN PROGRESS | ✅ DONE | ⏸ BLOCKED (سبب موثق)

## النهج: مراحل PHASE 0 → 8 ثم الخريطة الموسعة

### PHASE 0 — Environment Audit ✅
- [x] فحص OS/Runtime/Git/Docker/GPU/DB/env — سجل في DECISIONS.md.

### PHASE 1 — Foundation + Project Bible ✅
- [x] git init + workspace root + .gitignore + .env.example + tsconfig.base
- [x] PROJECT_BIBLE.md وكل الوثائق (14 ملف)
- [x] README.md

### PHASE 2 — Architecture + DB + Configuration ✅
- [x] Structure server (Fastify app, config/plugins/modules, error mapping بلا تسريب stack)
- [x] Drizzle schema كامل (33 جدولًا: users, students, sessions, curriculum, knowledge, AiUsage, audit, …)
- [x] توليد migration (`0000_colossal_thanos.sql`) + تطبيقها تلقائيًا عند الإقلاع (`openDbAndMigrate`)
- [x] Config عبر zod من env (افتراضيات تعمل بدون `.env`: mock providers + SQLite محلي)
- [x] Double-check: `drizzle-orm` 0.45.3 (مسح advisory عالي)؛ `vitest` 5.0.1
- [x] الويب: workspace `web/` (Vite 6 + React 19 + TS)، eslint/react-hooks، build ناجح

### PHASE 3 — Authentication + Student Profile ✅
- [x] auth routes (register/login/logout/me) + جلسات DB + cookie httpOnly + CSRF + bcryptjs + rate-limit (120/دقيقة)
- [x] /api/profile (student profile + grade update)
- [x] اختبارات S3/S4/S5 + S8 (CSRF، revocation، عزل بين الطلاب، صلاحيات admin)

### PHASE 4 — Curriculum + Knowledge Base ✅
- [x] Seed مصر/وزارة التربية/الصف السادس/رياضيات + 3 دروس + مفاهيم + demo accounts (idempotent)
- [x] Ingestion pipeline (extractor مكوّن، chunker مشترك، metadata كامل country→concept)
- [x] Admin document routes (نوع txt/md فقط، رفض الملفات الخبيثة S7)

### PHASE 5 — RAG ✅
- [x] EmbeddingProvider (mock 64-dim / gemini) + SqliteVectorStore + cosine (مُختبَر unit)
- [x] Retrieval + scopeFilter إلزامي (Metadata هو الحاجز — D-007) + top-k من env (RAG_TOP_K=5)

### PHASE 6 — AI Tutor Engine ✅
- [x] LLMProvider (mock/gemini) + ModelRouter (routing بالنموذج/العملية) + UsageTracker + AiCache
- [x] IntentClassifier (يشمل محاولات تجاوز التعليمات — S6 tripwire) + PromptBuilder + ResponseProcessor
- [x] Memory + Progress services (آمنة تجاه السجلات التالفة — S4)

### PHASE 7 — Vertical Slice ✅
- [x] Sessions/Messages API (start/list/get/send/end) مع إجبار الملكية خادميًا (S1)
- [x] ربط TutorEngine بالـAPI (multi-turn + RAG + persistence + progress)
- [x] واجهة الويب: onboarding picker (دولة→نظام→صف→مادة→منهج→فصل→وحدة→درس) + غرفة دردشة RTL + أزرار «فهمت/مش فاهم» + عرض التقدم + استئناف الجلسات
- [x] تحقق حي عبر بروكسي Vite (5173): SPA/RTL, login, catalog walk, session, tutor (chunks=2), re-explain, progress, end, logout — WEB-SLICE-OK

### PHASE 8 — Testing + Security Hardening ✅
- [x] Suite كامل: unit (chunker, intent, promptBuilder, cosine, extractors, ids, aiMock) + db/migrations + api vertical slice + security (S1–S10) — **61/61 اختبارًا أخضر**
- [x] `npm run check` = typecheck (server+web) + lint (server+web) + test — كله أخضر
- [x] إصلاح معرِف في الويب: لا تُرسل `Content-Type: application/json` لطلبات POST بلا جسم (Fastify يرفض 400 FST_ERR_CTP_EMPTY_JSON_BODY)
- [x] docs sync (TASKS/CHANGELOG/DECISIONS) + commits لكل مرحلة

### الخريطة الموسعة (بعد MVP — بحسب الأولوية)
- [ ] 🔴 Voice conversation (STT/TTS) — واجهات AI جاهزة (placeholder موثق)
- [ ] 🔴 Vision upload (سؤال مصور)
- [ ] 🟡 PDF/DOCX extractors حقيقية + معالجة صور
- [ ] 🟡 Parent dashboard + Admin dashboard
- [ ] 🟡 حماية رفع ملفات بمستويات فحص عميقة
- [ ] 🟡 Billing/Subscriptions تفعيل + Achievements تفعيل
- [ ] 🟡 Qdrant/pgvector adapter + إعادة تصنيف عبر نموذج
- [ ] 🟡 Analytics + إحصاءات
- [ ] 🟡 وضع multi-country seed (السعودية مثلًا)
- [ ] 🟡 اختبار UI آلي حقيقي (Playwright/WebdriverIO) عبر المتصفح
- [ ] 🟡 Caching مُفعَّل لتقليل استدعاءات المزود الحقيقي (AiCache جاهز)

---
**قاعدة: مهمة تعتبر DONE فقط بعد اختبارات خضراء. لا تعتمد على هذه القائمة للتتابع — اقفز فعليًا في PHASE الأقدم غير المكتملة.**