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

### PHASE 2 — Architecture + DB + Configuration 🟡
- [x] Structure server (Fastify app, config, plugins)
- [x] Drizzle schema كامل (كل الكيانات في DATABASE_SCHEMA.md)
- [x] توليد migration + تطبيقها عند الإقلاع
- [x] Config عبر zod من env
- [ ] Double-check: إكمال فهارس/قيود إضافية عند الحاجة

### PHASE 3 — Authentication + Student Profile 🟡
- [ ] auth routes + sessions + CSRF + rate-limit
- [ ] /api/auth/me + profile update routes
- [ ] اختبارات S3/S4/S5 (CSRF، revocation)

### PHASE 4 — Curriculum + Knowledge Base 🟡
- [ ] Seed مصر/رياضيات G6 + مفاهيم
- [ ] Ingestion pipeline (text extractor, cleaning, chunker, metadata)
- [ ] Admin document routes

### PHASE 5 — RAG 🟡
- [ ] EmbeddingProvider (mock/gemini)
- [ ] SqliteVectorStore + cosine
- [ ] Retrieval + scopeFilter + rerank optional

### PHASE 6 — AI Tutor Engine 🟡
- [ ] LLMProvider (mock/gemini) + ModelRouter + UsageTracker + Cache
- [ ] IntentClassifier + PromptBuilder + ResponseProcessor
- [ ] Memory + Progress services

### PHASE 7 — Vertical Slice ✅/🟡 (التنفيذ الجاري)
- [ ] Sessions/Messages API كامل
- [ ] ربط TutorEngine بالـAPI
- [ ] واجهة الويب (onboarding + chat + RTL)

### PHASE 8 — Testing + Security Hardening 🟡
- [ ] Suite كامل (Unit/API/DB/AI/RAG/Auth/Security/E2E)
- [ ] Checks النهائية (typecheck+lint+test) + docs sync + commits

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

---
**قاعدة: مهمة تعتبر DONE فقط بعد اختبارات خضراء. لا تعتمد على هذه القائمة للتتابع — اقفز فعليًا في PHASE الأقدم غير المكتملة.**