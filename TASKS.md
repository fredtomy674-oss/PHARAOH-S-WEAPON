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

### PHASE 9 — Browser E2E (Playwright) ✅
- [x] تثبيت `@playwright/test` + Chromium (`npm run e2e:install`)؛ `playwright.config.ts` يدير خادمين تلقائيًا:
  خادم اختبار على **3107** بقاعدة SQLite مؤقتة تُحذف/تُزرع كل تشغيل (`e2e/reset-db.mjs` + seed؛ لا تمسّ قاعدة التطوير)
  + Vite حقيقي على **5173** يوجّه بروكسيته لخادم الاختبار (`VITE_API_PROXY_TARGET` → 3107)
- [x] تحسين الواجهة للملاحة: `data-testid` منظمة (auth/onboarding/chat/home) + `aria-label` لحقل الدردشة + `data-session-id` لصفوف الجلسات
- [x] 10 اختبارات E2E عبر متصفح حقيقي تمر المسار FULL (Browser→React→Vite proxy→Fastify→SQLite→RAG→AI provider→DB→Browser) — **10/10 أخضر**:
  الرحلة الكاملة (login→catalog walk→جلسة→رد RAG بدليل `وفقًا لمحتوى الدرس`→«مش فاهم» بنفس الجلسة→progress→end→قائمة منتهية→logout)،
  C عزل طالب جديد، A بيانات خاطئة، B حماية غير مسجّل (401 عبر البروكسي)، I RTL/عربي/لوحة مفاتيح،
  D رسالة فارغة، E خطأ API واضح (CSRF منتهي → «رمز التحقق غير صالح»)، F استئناف جلسة، G استهلاك الرصيد، H tripwire للحقن
- [x] إصلاحان حقيقيان بالخادم اكتشفتهما E2E: (1) رسالة rate-limit (RATE_LIMITED) تمر للعميل كما هي بدل أن تتحول إلى 500 عام — معالج الأخطاء يعبر حمولة `error`، (2) `/api/health` مستثنى من حد المعدل + `RATE_LIMIT_MAX` قابل للضبط عبر env
- [x] `npm run check` أخضر (61/61) + `npm run build` أخضر بعد كل إضافات E2E
- [x] docs sync (TASKS/CHANGELOG/TEST_PLAN/README/DECISIONS D-013) + commit

### PHASE 10 — Vision Upload (سؤال مصور) ✅
- [x] جدول `message_attachments` (BLOB + mime + sha256 + size) — migration `0001_careful_norrin_radd.sql` تُطبَّق تلقائيًا عند الإقلاع
- [x] واجهات AI متعددة الوسائط: `LLMRequest.images` → Gemini `inlineData` (رسالة المستخدم الأخيرة) + mock يقرّ «قرأت الصورة المرفقة» (عبارة حتمية للاختبارات)
- [x] `POST /api/sessions/:id/messages` يستقبل `image: { dataUrl, fileName }` (PNG/JPEG/WebP، حد `MAX_IMAGE_KB`=5000 افتراضيًا) + رسالة بلا نص مقبولة؛ رفض واضح للصيغة غير المدعومة والحجم الزائد
- [x] `GET /api/sessions/:id/attachments/:attId` يعيد بايتات الصورة للمالك فقط (getOwned) مع رؤوس أمان (nosniff + CSP sandbox + private cache)
- [x] الويب: زر «📷 صورة سؤال» + معاينة قبل الإرسال + إزالة + عرض الصورة داخل فقاعة رسالة المستخدم (تحميل عبر الـAPI بالكوكي — بلا CSRF للـGET)
- [x] Grounding محفوظ مع الصورة فقط: استرجاع احتياطي لسؤال فارغ («سؤال مصور في هذا الدرس») + PromptBuilder يُعلم النموذج بوجود صورة
- [x] اختبارات: unit (mock vision ×2) + API (7: إرفاق+رد+توثيق، صورة بلا نص، رسالة فارغة، صيغة مرفوضة، حجم زائد، جلب المرفق بالرؤوس الآمنة، عزل عبر الطلاب) — **70/70 أخضر**
- [x] E2E عبر المتصفح الحقيقي V1–V3 (ملف حقيقي → بروكسي → Fastify → SQLite → mock → عرض + GET بالمستخدم) — **13/13 أخضر**
- [x] `npm run check` أخضر (70/70) + `npm run build` أخضر + docs sync (DECISIONS D-014) + commit

### الخريطة الموسعة (بعد MVP — بحسب الأولوية)
- [ ] 🔴 Voice conversation (STT/TTS) — واجهات AI جاهزة (placeholder موثق)
- [x] ✅ Vision upload (سؤال مصور) — 3 E2E + 9 اختبارات (PHASE 10)
- [ ] 🟡 PDF/DOCX extractors حقيقية + معالجة صور
- [ ] 🟡 Parent dashboard + Admin dashboard
- [ ] 🟡 حماية رفع ملفات بمستويات فحص عميقة
- [ ] 🟡 Billing/Subscriptions تفعيل + Achievements تفعيل
- [ ] 🟡 Qdrant/pgvector adapter + إعادة تصنيف عبر نموذج
- [ ] 🟡 Analytics + إحصاءات
- [ ] 🟡 وضع multi-country seed (السعودية مثلًا)
- [x] ✅ اختبار UI آلي حقيقي (Playwright) عبر المتصفح — 13/13 (PHASE 9 + 10)
- [ ] 🟡 Caching مُفعَّل لتقليل استدعاءات المزود الحقيقي (AiCache جاهز)

---
**قاعدة: مهمة تعتبر DONE فقط بعد اختبارات خضراء. لا تعتمد على هذه القائمة للتتابع — اقفز فعليًا في PHASE الأقدم غير المكتملة.**