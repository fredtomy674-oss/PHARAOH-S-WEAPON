# TECHNICAL ARCHITECTURE — AL FAROUQ AI

> آخر تحديث: 2026-09-22. القطع الكبيرة موثقة في DECISIONS.md.

## 1. نظرة عامة

```
┌─────────────────────────────┐
│  web/  React 19 + Vite (SPA)│  ← RTL-first, Arabic-first, عناصر Chrome (لا یکتبه) 
└──────────────┬──────────────┘
               │ HTTP / JSON (REST) — browser → Vite proxy → server
┌──────────────▼──────────────────────────────────────────────┐
│  server/  Fastify 5 + TypeScript                             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ modules/                                                │  │
│  │  auth • users/students • curriculum • knowledge ·      │  │
│  │  rag • ai • tutor • sessions • messages • progress     │  │
│  │  audit • usage ·                                       │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ai/  Provider abstraction                              │  │
│  │  LLMProvider ── Mock (dev/test) ── Gemini (real)       │  │
│  │  EmbeddingProvider ── Mock ── Gemini                   │  │
│  │  ModelRouter • UsageTracker • Cache                    │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ rag/  VectorStore (SqliteVectorStore) • Retrieval      │  │
│  │       Extraction • Cleaning • Chunking • Metadata      │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ db/  Drizzle ORM + better-sqlite3 + migrations         │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## 2. القرارات الهيكلية المفتاحية

1. **Server + SPA منفصلان** (وليس Next.js monolith): فصل نظيف، نشر مستقل، وفحص أسهل.
2. **SQLite محليًا** (صفر إعداد على هذا الجهاز) مع driver swap معتمد إلى Postgres.
3. **واجهات AI منفصلة**: `LLMProvider`, `EmbeddingProvider` — كل ميزة تستخدم الواجهة فقط.
4. **RAG برتوكول Metadata صارم** يقيّد الاسترجاع ببيئة الطالب (الصف/المادة/المنهج/...).
5. **التكلفة أولًا**: كل طلب AI يمر بـ `UsageTracker`، والـrouting يختار النموذج حسب المهمة.

## 3. وحدات السيرفر (server/src/modules)

| الوحدة | المسؤولية | واجهة عامة |
|---|---|---|
| `auth` | تسجيل/دخول/خروج، جلسات، CSRF | `POST /api/auth/*` |
| `users` | إدارة المستخدم والبروفايلات | `GET/PUT /api/me` |
| `curriculum` | بنية المنهج (country→concept) + seed | `GET /api/curriculum/*` |
| `knowledge` | استيعاب المستندات وتقطيعها وتخزين Metadata | `POST /api/admin/documents` |
| `rag` | Embedding + VectorStore + Retrieval + Rerank | داخلي عبر `RagService` |
| `ai` | Providers + Router + Usage + Cache | داخلي عبر `AiService` |
| `tutor` | بناء الرد التربوي، صنف الأسئلة، Memory، Progress | `POST /api/sessions/:id/messages` (metalayer) |
| `sessions` | Learning Sessions ورسائلها | `POST/GET /api/sessions` |
| `progress` | إتقان المفاهيم، نقاط القوة/الضعف | `GET /api/progress` |
| `audit` | Audit log للأحداث الحساسة | داخلي |
| `usage` | تتبع tokens والتكلفة | `GET /api/usage` (لاحقًا بـAdmin) |

## 4. تدفق الطلب (تدفق عمودي كامل)

```
POST /api/sessions/:id/messages {content, sessionId}
 ├─ auth hook (session cookie) → user → student
 ├─ validate + rate-limit (per student)
 ├─ verify session مملوكة لهذا الطالب (Authorization)
 ├─ save user message (tx)
 ├─ TutorEngine.handle({student, session, question})
 │   ├─ IntentClassifier → {type, concepts}
 │   ├─ RagService.retrieve(query, scopeFilter) → chunks (مع Metadata من المنهج)
 │   ├─ MemoryService.load(student) → نقاط القوة/الضعف + خلاصات جلسات سابقة
 │   ├─ PromptBuilder → SystemPrompt (تربوي) + Context (منهج موثوق) + Memory
 │   ├─ ModelRouter.llm() → LLMProvider (mock|gemini)
 │   ├─ UsageTracker.record(tokens, cost)
 │   └─ ResponseProcessor ← تحليل الرد (صحيح/خاطئ) لتحديث Memory
 ├─ save tutor message (tx)
 └─ ProgressService.update(concepts, result)
```

## 5. عزل البيانات (Data Isolation)

- كل استعلام على بيانات طالب يبدأ من `authUserId` المستخرج من الجلسة — لا UUID من عميل أبدًا.
- Retrieval يضيف `scopeFilter` إجباريًا: `country_id, education_system_id, grade_id, subject_id, curriculum_id, term_id, unit_id, lesson_id`.
- اختبارات أمان مخصصة تمنع تسريب طالب→طالب واستخدام منهج خاطئ (TEST_PLAN.md).

## 6. مسار الهجرة إلى الإنتاج

1. Postgres: عكس `schema.ts` إلى schema postgres (نفس الأسماء/العلاقات)، تثبيت pg pool، تغيير driver في `db/index.ts` فقط.
2. Vector store: تنفيذ `VectorStore` فوق pgvector/Chroma/Qdrant دون لمس `rag/`.
3. AI providers: إضافة `LLMProvider` جديد (Claude/… ) في مجلد `ai/providers/` وتفعيله من `.env` فقط.