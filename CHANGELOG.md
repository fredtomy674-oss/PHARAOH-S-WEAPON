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

## 2026-09-22 — جولة audit (إعادة زيارة D-011 بعد E2E)
- إعادة فحص `npm audit`: 4 moderate dev-only عبر `drizzle-kit → esbuild` (كما في D-011).
- محاولة إغلاقها بجذر via `overrides` على `@esbuild-kit/core-utils/esbuild`: أُثبت عملها ميكانيكيًا في عزلة (audit 0)، لكن على الشجرة الحقيقية يُخرج npm `npm ls`/`npm ci` قيمة `invalid` (`ELSPROBLEMS`) لأن الحزمة متروكة ولها مسارات متعددة — إذن audit نظيف ≠ tree سليم عبر overrides؛ رُفض patch-package لسلسلة dev-only.
- العودة للحالة المعروفة الجيدة (إزالة الـoverride + استعادة الـlock) → تراجع كامل أخضر: `check` (61/61)، `build`، E2E 10/10. توثيق النتائج في D-011.

## 2026-09-22 — الجلسة الرابعة (PHASE 10: Vision Upload — سؤال مصور)
- جدول `message_attachments` (BLOB + mimeType + sha256 + sizeBytes، فهارس session/message) → migration `0001_careful_norrin_radd.sql` تُطبَّق تلقائيًا عند الإقلاع.
- AI متعدد الوسائط: `ImageInput` على `LLMRequest` → Gemini `inlineData` في آخر رسالة مستخدم (multimodal) + mock يصدر عبارة «قرأت الصورة المرفقة» (IMAGEREAD_MARKER حتمي للاختبارات).
- POST messages يقبل `image: { dataUrl, fileName }` (PNG/JPEG/WebP؛ حد `MAX_IMAGE_KB`=5000 افتراضيًا، في الاختبارات 1) ورسالة بلا نص مقبولة عندما توجد صورة؛ أخطاء 400 واضحة (UNSUPPORTED_IMAGE_TYPE/IMAGE_TOO_LARGE/INVALID_IMAGE_FORMAT).
- GET `attachments/:attId` يخدم بايتات الصورة للمالك فقط (getOwned) مع `nosniff` + `CSP sandbox` + `cache-control: private` — اختبارا عزل: طالب آخر ← 403/404.
- Grounding مع صورة فقط: استرجاع احتياطي «سؤال مصور في هذا الدرس» عند فراغ النص + PromptBuilder يُعلِم النموذج بالصورة.
- الويب: زر «📷 صورة سؤال» + معاينة/إزالة + عرض المرفق داخل فقاعة المستخدم (GET عبر الكوكي بلا CSRF) + فحص مسبق للصيغة والحجم.
- اختبارات: unit mockVision (2) + API vision (7) → **70/70**؛ E2E V1–V3 (إرفاق حقيقي بالملف، صورة بلا نص، رفض حجم زائد) → **13/13**.
- `npm run check` أخضر (70/70) + `npm run build` أخضر؛ DECISIONS D-014 (base64 JSON في MVP + تخزين BLOB + نقاط أمان) + commit.

## 2026-09-22 — الجلسة الخامسة (PHASE 11: Voice conversation — سؤال بصوت)
- طبقة صوتية كاملة في المتصفح عبر Web Speech APIs (قرار D-015): `web/src/voice.ts` — STT `SpeechRecognition`/`webkitSpeechRecognition` (عربي `ar-EG`) وTTS `speechSynthesis`؛ بلا مفاتيح وبلا تغيير في الخادم (نفس واجهة الرسائل) → الدردشة النصية وVision بلا انحدار بحكم البناء.
- «🎙️ سؤال بصوت» في المُلوِّن: يُمرّر ناتج التعرف لحقل الرسالة **للمراجعة والتعديل** قبل الإرسال؛ حالة «جارٍ الاستماع…» مع إيقاف؛ رسالة واضحة «غير مدعوم في هذا المتصفح» عند غياب STT.
- سماع الرد: تشغيل تلقائي عند إرسال سؤال صوتي + زر «🔊 استمع» في كل فقاعة رد + شارة «جارٍ الاستماع إلى رد المدرس…» مع «⏹ إيقاف»؛ انتخاب صوت عربي إن وُجد.
- إصلاح اكتشفته E2E: محرك Chromium يرمي `TypeError` عند تعيين كائن صوت لا يطابق عقد `SpeechSynthesisVoice` (أصوات الـstub) — الآن `lang` أولًا + تعيين الصوت داخل try/catch.
- E2E حتمية عبر stubs مُحقنة (لا يمكن أتمتة ميكروفون حقيقي): `installVoiceStubs` (نتيجة نطق واحدة + تسجيل speak/cancel) — A1 صوت→مراجعة→إرسال→رد مُنطق→إيقاف، A2 مكتوب لا يُنطق تلقائيًا + 🔊 يعمل ويُوقِف، A3 غياب STT→خطأ واضح؛ تأكيدات إلغاء نسبية (React StrictMode في dev يعيد التركيب فينفّذ cleanup «مغادرة الغرفة» مبكرًا) — **16/16 E2E أخضر**.
- `npm run check` أخضر (70/70) + `npm run build` أخضر + docs sync (DECISIONS D-015) + commit.

## 2026-09-23 — الجلسة السادسة (PHASE 12: Student Documents in Chat — Path A)
- جدول `message_attachments` يُوسَّع بـ`extracted_text` (nullable) — migration `0002_material_virginia_dare.sql` تُطبَّق تلقائيًا؛ `POST messages` يقبل `document: { dataUrl, fileName }` (PDF/DOCX/TXT/MD) مع **صورة XOR مستند** (400 `MULTIPLE_ATTACHMENTS`)؛ env جديدان `MAX_FILE_KB` (10000) و`MAX_DOCUMENT_CHARS` (20000)؛ `bodyLimit` لـFastify → 32MB.
- استخراج نص آمن **خواص JS نقية** (في الذاكرة، بلا نظام ملفات): PDF عبر **`pdfjs-dist`** (legacy ESM، بلا worker) — استُبعد `pdf-parse` بعد فشل ثابت: فرع الـdebug فيه يُفعَّل تحت ESM `import()` (ENOENT) وحتى عبر CJS يتقلّب على Node 24 («bad XRef entry» لنفس الملف)، بينما pdfjs-dist مستقر؛ DOCX عبر `mammoth@1.12.3` (فوق نطاق GHSA-rmjr-87wv-gf87)؛ TXT/MD UTF-8 + إزالة BOM؛ الفشل/الممسوح ضوئيًا → نص فارغ (**OCR مؤجل صراحةً**).
- مولد fixtures وليد Node خالص (`scripts/make-doc-fixtures.mjs`): PDF بيدوي بإزاحات xref محسوبة + ZIP بيدوي (STORED + CRC-32) — `Compress-Archive`/.NET Framework يكتبان أسماء إدخالات بشرطة مائلة عكسية فترفضها OPC/المخطوطات الجاهزة؛ المولد الآن بلا أي اعتماد على shell.
- AI: `LLMRequest.documents` (`DocumentInput`) → Gemini يلحق نصوص المستندات بآخر رسالة مستخدم + mock يعترف «قرأت الملف المرفق» (عبارة حتمية للاختبارات) ويعيد أول 60 حرفًا من النص؛ PromptBuilder يضيف قاعدة نظام: محتوى `<document>` مستخدم **غير موثوق**؛ **tripwire الحقن يعيد فحص نص المستند خادميًا (classifyIntent) قبل أي استدعاء نموذج** → SAFE_REFUSAL بلا استدعاء؛ استرجاع احتياطي doc-only «سؤال عن محتوى الملف المرفق في هذا الدرس».
- الويب: زر «📄 إرفاق ملف» (PDF/DOCX/TXT/MD، مرآة عميل 10MB) + معاينة/إزالة + فقاعة chip `msg-document` + منع الجمع مع الصورة.
- مسار B (إدخال PDF/DOCX في قاعدة المعرفة) **غير ممسوس** — `rag/extractors.ts` يرفض pdf/docx كما كان (S7).
- اختبارات: unit documents (6) + mockDocument (3) + API documents (9: إرفاق+استخراج+RAG، مستند بلا نص، صورة+مستند مرفوض، صيغة مرفوضة، حجم زائد، حقن → رفض آمن بلا استدعاء، ممسوح → لا انهيار، جلب المرفق بالرؤوس الآمنة، عزل عبر الطلاب) → **88/88**.
- E2E D1–D3 (`document.spec.ts` عبر متصفح حقيقي): D1 PDF+نص → قراءة + اقتطاع النص + RAG + chip؛ D2 DOCX بلا نص → زر الإرسال مفعّل + قراءة؛ D3 حقن داخل TXT → رفض آمن «أنا هنا لمساعدتك في درسنا فقط» بلا علامة قراءة → **19/19 أخضر**.
- `npm run check` أخضر (88/88) + `npm run build` أخضر + docs sync (DECISIONS D-016/TASKS/README/TEST_PLAN/.env.example) + commit.

## 2026-09-23 — الجلسة السابعة (PHASE 13: Curriculum File Import — Path B)
- مسار جديد بالكامل لإدخال ملفات المناهج في قاعدة المعرفة — **بلا أي تعديل على مسار الطالب (Path A)**: `POST /api/admin/documents/ingest-file` (admin+CSRF) يقبل `{ fileName, dataUrl, scope, title?, source?, conceptIds? }`؛ النوع يُشتق من mime (pdf/docx/text) ويُعاد استخدام `parseDocumentDataUrl`/`extractDocumentText` من `sessions/documents.js` كما هي.
- التخزين: `document_versions.data` (BLOB للبايتات الخام) + `sha256` = تجزئة بايتات الملف (هوية إزالة التكرار) — migration `0003_many_namor.sql` (مع استبدال الفهرس الفريد العام بـ`chunks_content_hash_lesson_unique (content_hash, lesson_id)` ليجعل إزالة تكرار chunks مرتكزةً على الدرس).
- env جديدان: `MAX_CURRICULUM_FILE_KB` (20480/20MB — b64 ≈27.96M ضمن حدود Ajv 28M وbodyLimit 32MB) و`MAX_CURRICULUM_DOCUMENT_CHARS` (200000)؛ الاختبارات بسقف `MAX_CURRICULUM_FILE_KB=4`.
- `KnowledgeService.ingestFile`: بايتات+تجزئة + دوبليكات 409 `DOCUMENT_ALREADY_INGESTED` + clean→chunk→embed→chunks/vectors + `EMPTY_DOCUMENT` للمسح الضوئي (**OCR مؤجل**)؛ `fileKindFromMime` + `fileSha256`؛ `ingestText` دوبليكاته أصبحت مرتكزة على الدرس.
- fixtures مناهج مستقلة `curriculum.pdf`/`curriculum.docx` من المولّد (نص درس واقعي >40 حرفًا وعلامات `TutorFixturePDF 123`/`TutorFixtureDOCX 456`) — `question.*` لم يتغيّر بايتًا-بايت (593B/1297B معتمدة)؛ MediaBox PDF وُسّع إلى 1500 حتى يستخرج pdfjs السطر كاملًا عند غياب مقاييس الخطوط القياسية.
- اختبارات: unit `knowledgeFile` (5) + API `adminFile` (12: 201/403/حدود/استرجاع فعلي/عزل S8/S6 عبر الملف/progress) + migrations (عمود + فهرس) → **106/106 أخضر**؛ **بلا E2E هذه المرحلة** (مصادقة النطاق: API+unit فقط).
- إصلاح مرافق في مزوّد `mock`: استخراج كتلة `<context>` الحقيقية (آخر وسم) بدل أول تواجد داخل نثر قواعد النظام → صدى الرد في التطوير يعكس المحتوى المسترجع الفعلي (بلا أثر على مسار الطالب في أي وقت).
- `npm run check` أخضر (106/106) + `npm run build` أخضر + docs sync (DECISIONS D-017/TASKS/API_SPEC §4+§7/RAG_SYSTEM §1+§6/TEST_PLAN/.env.example + مولد fixtures).

## 2026-09-23 — الجلسة الثامنة (PHASE 14: Admin Dashboard — استيراد ملفات المنهج عبر الواجهة)
- شاشة `web/src/Admin.tsx` جديدة (role-gated عبر `user.role === "admin"` في `App`): زر «لوحة الإدارة» يظهر في Home للـadmin فقط (A3 يثبت غيابه للطالب)؛ بطاقة استيراد بملف (PDF/DOCX/TXT/MD → dataUrl client-side، مرآة 20MB) + عنوان/مصدر اختياريين + اختيار **نطاق الدرس** بنفس نمط picker المنهج ثم `POST /api/admin/documents/ingest-file`؛ نجاح يعرض عدد المقاطع والخطأ (مثل «مستورد مسبقًا») يُعرض بوضوح.
- `GET /api/admin/documents` أُثرِي خادميًا: LEFT JOIN على `chunks`+`lessons` + `count` → عمود الدرس (`lessonId`/`lessonTitle`) و`chunkCount` لكل مستند — لوحة مفيدة فعلًا (أي ملف يغذي أي درس وكم أضاف) مع بقاء اختبارات القائمة الحالية خضراء.
- `web/src/api.ts`: `listAdminDocuments`/`ingestCurriculumFile` + أنواع `AdminDocument`/`CurriculumIngestScope`/`IngestFileResult`؛ CSS جديد (`admin-*`/`admin-table`) في `styles.css`.
- E2E `e2e/admin.spec.ts` (متصفح حقيقي): A1 رفع `curriculum.pdf` للدرس الثاني (الضرب والقسمة — عزل نطاقي عن بقية المجموعة) → نجاح + صف اللائحة باسم الدرس و`chunkCount>0`؛ A2 إعادة رفع نفس البايتات → 409 «مستورد مسبقًا» عبر UI؛ A3 الطالب لا يرى زر الإدارة — **22/22 أخضر**.
- `npm run check` أخضر (106/106 Vitest) + `npm run build` أخضر + docs sync (TASKS/DECISIONS D-018/TEST_PLAN/README/CHANGELOG) + commit.

## 2026-09-23 — الجلسة التاسعة (PHASE 15: حماية رفع الملفات — فحص MAGIC bytes)
- وحدة نقية جديدة `server/src/utils/fileTypes.ts`: `detectFileKind(bytes)` تفحص البايتات الخام (PDF: رأس `%PDF-` بأول 1024 بايتًا وفق مواصفة PDF؛ DOCX: رأس ZIP `PK\x03\x04` + `[Content_Types].xml` بأول 64KB؛ غيرها = نص) + `kindForDeclaredMime` لخريطة التطابق.
- رُبط الفحص في **نقطة مشتركة** `parseDocumentDataUrl` فيغطي المسارين دفعة واحدة: A (مرفق الطالب في الدردشة) وB (استيراد ملفات المناهج). لا استخراج ولا تخزين لأي ملف لا يطابق نوعه المعلن: نص مُعاد تسميته `.pdf`/`.docx`، ZIP عام مدّعٍ أنه مستند Word، أو PDF متنكّر بنص → `400 FILE_TYPE_MISMATCH`.
- اختبارات: unit `fileTypes` (7) + API Path A انتحال (documents 10) + API Path B انتحالات ×3 (adminFile 15) — وصُحح اختبار «الممسوح» لاستخدام **رأس PDF حقيقي** (`%PDF-1.4` بلا نص) كي يبقى `EMPTY_DOCUMENT` حقيقيًا — **117/117 أخضر**.
- `npm run check` أخضر (117/117) + `npm run build` أخضر + E2E **22/22** (لا انحدار في مسار الرفع الحقيقي) + docs sync (DECISIONS D-019/TASKS/TEST_PLAN/README/API_SPEC).

## 2026-09-23 — الجلسة العاشرة (PHASE 16: زرع منهج سعودي — multi-country)
- أُعيد هيكلة `server/src/db/seed.ts` إلى بذر عام `seedCountry(db, knowledge, spec)` (+ بصمتي `CountrySeedSpec`): مصر (الأصل بنصوصه حرفيًا) ثم السعودية — بلد `sa`، نظام «وزارة التعليم»، الصف السادس، منهج `sa-g6-math` بدرسين `l-sa-ops`/`l-sa-units` بمحتوى محلي (سوق الرياض/الريال السعودي/فريق جدة) يُغذّيان RAG بنفس أنبوب `ingestText`.
- **الكتالوج العالمي المشترك**: جدول `subjects` عالمي بلا countryId — تُعاد الاستفادة من صفّ `math` الموجود عبر `subjects_code_unique` فلا تكرار أبدًا (بذر بنجاح على قاعدة مختلطة: مصر موجودة → السعودية تُضاف).
- لا تغيير في الخدمة — مرشحات `countryId` القائمة كفيلة بالعزل؛ أُثبت ذلك باختبارات: عزل الكتالوج لكل شبركة (نظام/صف/منهج/فصل/وحدة/درس) + تكامل RAG ثنائي الاتجاه (جلسة سعودية تتأرض بمحتواها ولا يسرّب محتوى مصر، والعكس).
- إصلاح E2E بلا منتج: كنت السعودية مترتبة أبجديًا قبل مصر فكان «أول خيار» سعوديًا — أُضيف `selectOptionByLabel` (اختيار حتمي بالنص) في `e2e/helpers.ts` واختيار «مصر» صراحةً في `startFirstLesson` و`pickSecondLesson`.
- 125/125 Vitest (117 + 8 multiCountry) + build أخضر + E2E **22/22** على قاعدة مُعاد بذرها ببلدين + docs sync (DECISIONS D-020/TASKS/TEST_PLAN/README/API_SPEC).

## (أعمدة لاحقة تُضاف هنا كل مرحلة)

## 2026-09-23 — الجلسة الحادية عشرة (PHASE 17: Analytics — إحصاءات المسؤول)
- نهاية خادمية `GET /api/admin/stats` (محصّنة بـ`requireAdmin`) — تجميعات صافية من الجداول القائمة (لا جداول/تخزين جديد): مستخدمون/طلاب، جلسات (إجمالي/نشطة/منتهية)، رسائل (إجمالي/طالب/مدرس)، مستندات (إجمالي/جاهزة)، مقاطع معرفية، مناهج، دروس.
- واجهة: قسم «إحصاءات سريعة» (بطاقات `admin-stats-*`) في أعلى لوحة الإدارة مع تنسيق `admin-stats-grid`؛ الجلب متسامح فلا يعطّل تدفق الرفع أبدًا (تحقق منه E2E A1).
- اختبارات API (2): الطالب يُرفض 403 FORBIDDEN + العدّادات تطابق النشاط الفعلي (جلسة → رسائل → إنهاء → مستندات/مقاطع الكوربس).
- 127/127 Vitest (125 + 2) + build أخضر + E2E 22/22 (لا انحدار) + docs sync (DECISIONS D-021/TASKS/TEST_PLAN/README/API_SPEC).

## 2026-09-23 — الجلسة الثانية عشرة (PHASE 18: Parent Dashboard — لوحة أولياء الأمور)
- **نموذج البيانات مهيّأ أصلًا** (جداول `parents` + `students_parents` موجودة منذ PHASE 2) — ما أُضيف فعليًا: عمود `students.parentLinkCode` (text، unique) + migration `0004_fixed_james_howlett.sql` (تُطبَّق تلقائيًا عند الإقلاع) ومولّد `parentLinkCode()` في `server/src/utils/ids.ts` (أبجدية `A-HJ-NP-Z2-9` بلا محارف ملتبسة، طول 8).
- **القرار D-022**: الربط بِـ**كود مشاركة قصير** (لا بريد إلكتروني — لا يثبت صلة قرابة) يظهر للطالب في صفحته الرئيسية ويُعرض في `/auth/me` كـ`linkCode`؛ كود ثابت للطالب التجريبي `SLH7KQ9M` مع إعادة ملء تلقائية للطلاب القدامى عند `db:seed` (env-overridable `SEED_PARENT_*`).
- **المصادقة**: `register` يقبل `role: "student"|"parent"` — مسار الوالد ينشئ `users`(parent)+`parents`+`profiles` بدون صف؛ `AuthUser`/`buildAuthUser` يحملان `parent?`؛ `publicUser` يعرض `linkCode` للطالب.
- **وحدة `server/src/modules/parent/`** (مسارات `/api/parent/*` بِـ`requireAuth` + فحص دور): `POST /link` (`INVALID_LINK_CODE`/`ALREADY_LINKED`)، `GET /children` (بطاقات: اسم/صف/مناهج/آخر جلسة/عدد جلسات)، `GET /children/:studentId` (هوية + تقدم `progressDetail` + ملخصات جلسات مع عدّادات رسائل)، `DELETE /children/:studentId`. **العزل بنيوي**: كل قراءة تعيد التحقق من رابط الوالد↔الطفل → أجنبي 404 (لا مؤشر وجود)؛ **لا يُكشف محتوى رسائل خام إطلاقًا — عدّادات فقط** (حدود MVP).
- **Seed**: حساب والد تجريبي `parent@alfarouq.test`/`parent-demo-123` + ربط idempotent مع الطالب التجريبي.
- **الويب**: شاشة `Parent.tsx` (ربط بالكود + بطاقات أبناء + تفاصيل الطفل مع قوائم المفاهيم/القوة/الضعف والجلسات + إلغاء الربط) وراء فرع role في `App.tsx`؛ كرت «كود ولي الأمر» في Home للطالب.
- **اختبارات**: API `parent.test.ts` (11: دور الوالد في /me، كود في /me بصيغة مولّدة، ربط ×4، عزل B 404، تفاصيل بلا تسريب رسائل، 403 متبادل، unlink + 404) → **138/138 أخضر**؛ E2E `parent.spec.ts` P1–P3 (الأم يرى ابنه وتفاصيله المجمّعة، الطالب يرى كوده، كود خاطئ → خطأ واضح) → **25/25 أخضر**.
- إصلاح في seed أثناء التطوير: إعادة جلب صف الوالد بعد الإنشاء (كان `const parentAccount` يحمل `undefined` لأنه جُلب قبل الإدراج) — الربط يعمل على قواعد جديدة وقديمة.
- `npm run check` أخضر (138/138) + `npm run build` أخضر + docs sync (DECISIONS D-022/TASKS/TEST_PLAN/README/API_SPEC).

## 2026-09-24 — الجلسة الثالثة عشرة (PHASE 19: OCR للمستندات الممسوحة ضوئيًا — المساران A وB)
- **القرار D-023**: OCR عبر تجريد مزود AI الموجود (بلا محرك محلي ثقيل) — `OcrProvider` جديد (`ocr(request)` + `AiService.ocr()` تسجّل الاستخدام `operation="ocr"`): `MockOcrProvider` نص عربي حتمي (`OCR_TEXT_MARKER` + رمز من تجزئة البايتات — ملفات مختلفة → نصوص مختلفة مستقرة، بلا تكرار كتل) أوفلاين/أوفلاين للاختبارات، و`GeminiOcrProvider` يقرأ الملف **inline** (`inlineData` — `application/pdf` و`image/*` مباشرة، **بلا rasterization** لهذه المرحلة).
- **التهيئة**: `AI_OCR_PROVIDER` (mock|gemini، افتراضي mock)، `GEMINI_OCR_MODEL` (افتراضي gemini-2.0-flash)، `MAX_OCR_CHARS` (افتراضي 20000)؛ `AIOperation` + `"ocr"`؛ `ModelRouter.ocrModel()`.
- **`server/src/modules/ocr/service.ts`**: حارس MIME (`OCR_ELIGIBLE_MIMES` = PDF/DOCX فقط — TXT/MD لا تُقرأ OCR إطلاقًا)، حد `maxChars` بفاصلة «…»، **هبوط آمن** عند فشل المزوّد (نص فارغ — لا انهيار للجلسة/الاستيراد)؛ رُبط في `container.ts` وحُقن في `SessionService`.
- **المسار A** (`sessions/service.ts`): مرفق PDF/DOCX باستخراج صفري → OCR → النص يُعامَل كنص مستخرج تمامًا (يُخزَّن في `extractedText` ويُمرَّر للمُدرّس + **تُعاد فحوصات الحقن عليه**)؛ عمود `messageAttachments.ocrApplied` (migration `0005_zippy_logan.sql`) → شارة «نص ممسوح ضوئيًا — قُرئ تلقائيًا» في الدردشة (`data-testid="msg-ocr-badge"`) عبر `TurnResult.ocrUsed` + `AttachmentSummary.ocr`.
- **المسار B** (`admin/routes.ts`): استيراد باستخراج < 40 حرفًا وPDF/DOCX → OCR → النص يدخل أنابيب chunking/embedding (يُسترجَع كمحتوى `<context>` فقط)؛ دوبليكات ملفات تعمل كما هي؛ رسالة `EMPTY_DOCUMENT` تحدّثت.
- **Fixture**: `e2e/fixtures/scanned.pdf` (PDF صالح صفحة واحدة بلا طبقة نص — `blankPdf()` في `scripts/make-doc-fixtures.mjs`؛ يثبت الاختبار أن pdfjs يستخرج منه `""`).
- **اختبارات**: وحدة `ocr.test.ts` (7) + `documents.test.ts` (+1) + API `ocr.test.ts` (4) + تحديث اختباريّ «OCR مؤجل» القديمين إلى السلوك الجديد → **150/150 أخضر**؛ E2E `ocr.spec.ts` (2: O1 الطالب يرفع ممسوحًا → قراءة + شارة؛ O2 الإدارة تستورد ممسوحًا → نجاح + كتل) → **27/27 أخضر**.
- `npm run check` أخضر (150/150) + `npm run build` أخضر + docs sync (DECISIONS D-023/TASKS/TEST_PLAN/README/API_SPEC/RAG_SYSTEM).

## 2026-09-24 — الجلسة الرابعة عشرة (PHASE 20: Billing/Subscriptions بلا بوابة دفع + Achievements)
- **القرار D-024**: جدولا `subscriptions` و`achievement_definitions`+`achievements` جاهزان منذ PHASE 2 — هذه المرحلة تُفعّلهما فقط؛ الإضافة الوحيدة للمخطط: فهرس فريد `achievement_definitions_code_unique` (migration `0006_sharp_toad.sql`) لضمان بذر حتمي بالكود.
- **فوترة MVP بلا بوابة دفع**: صف الاشتراك يُنشأ **كسولًا** (`free`/`trialing`)؛ البرج الفعلي مشتق: مميز ساري (`plan=premium` + `status∈trialing|active` + غير منتهٍ) → `PREMIUM_DAILY_MESSAGE_LIMIT` (افتراضي 0 = بلا حدود)، وإلا حد المجاني `DAILY_MESSAGE_LIMIT`؛ **past_due/cancelled/منتهٍ → هبوط تلقائي لحدود المجاني**. الإدارة تمنح/تلغي (`PUT /api/admin/subscriptions/students/:id` + سجل تدقيق `subscription.update`)؛ الطالب يقرأ (`GET /api/me/subscription`).
- **التنفيذ**: `SubscriptionService` يغذّي حد `TutorEngine` عبر حقل `dailyLimit` في `TutorHandleInput` (انعكاس صفري على منطق الـ429 القائم)؛ `remainingDaily` تحدّث العدّاد برقم حد الخطة (بلا حدود عند 0).
- **الإنجازات (خادمي، أحداث دورة حياة، منح مضاد للتكرار)**: تعريفات ثابتة بأحداث: `session_ended` (أول خطوة=1 جلسة، مستكشف=5، عالِم صغير=10)، `user_message` (بارع الحوار=50 رسالة)، `document_attached` (قارئ نهم — أول PDF/DOCX)، `vision_attached` (مصوّر الأسئلة — أول صورة). العدّادات **مقيّدة بجلسات الطالب نفسه**؛ الأحداث تُطلق من `SessionService` **best-effort try/catch** (لا يكسر الجلسة أبدًا)؛ الإدراج `onConflictDoNothing` يمنع التكرار. `GET /api/achievements/me` (طالب فقط؛ والد/إدارة 403).
- **الويب**: بطاقة «خطتك» (مجانية/مميزة + انتهاء + حد اليوم + زر «🏆 إنجازاتي») في Home؛ شاشة إنجازات تعرض المكتسب والمقفل؛ قسم «الاشتراكات» في لوحة الإدارة (قائمة + ترقية/إلغاء).
- **اختبارات**: وحدة `subscription.test.ts` (5) + وحدة `achievements.test.ts` (7) + API `subscription.test.ts` (7) + API `achievements.test.ts` (6) → **175/175 أخضر**؛ E2E `achievements.spec.ts` (2: E1 شارة + بطاقة مجانية؛ E2 ترقية إدارية → مميزة) → **29/29 أخضر**.
- `npm run check` أخضر (175/175) + `npm run build` أخضر + docs sync (DECISIONS D-024/TASKS/CHANGELOG/TEST_PLAN/README/API_SPEC/DATABASE_SCHEMA/.env.example).

## 2026-09-24 — الجلسة الخامسة عشرة (PHASE 21: Qdrant adapter + إعادة تصنيف عبر نموذج)
- **القرار D-025**: واجهتا `VectorStore`/`Reranker` (منذ PHASE 5) صارتا مزوّدَين — نفس الواجهات، سلوك افتراضي مطابق، واختيار التنفيذ من الإعداد (نفس نمط مزوّدي AI: mock افتراضيًا، خارجي اختياري).
- **`QdrantVectorStore` (HTTP صافٍ بلا اعتماديات)**: point id **UUID حتمي** من `sha256(chunkId)`، عزل الفلترة على **payload النطاق** المعكَس في كل نقطة، إنشاء المجموعة تلقائيًا (Cosine + بُعد المتجه)، مهلة `AbortController`، **فشل غير متماثل**: `upsert`/`remove` ترمي `503 VECTOR_STORE_UNAVAILABLE` (خطأ `Errors.serviceUnavailable` جديد) أما `search` فيعود `[]` (جلسة الطالب لا تنهار أبدًا مع مخزن متجهات منقطع). pgvector مؤجل حتى توفر Postgres (نفس الواجهة).
- **المصنع**: `VECTOR_STORE=sqlite|qdrant` + `QDRANT_URL`/`QDRANT_COLLECTION`/`QDRANT_DIMENSION`؛ رُبط في `container.ts` و`seed.ts` (بقسر sqlite ليبقى البذر محليًا) وسطر إقلاع `index.ts`.
- **`ModelReranker` (إعادة تصنيف عبر النموذج)**: واجهة `Reranker` صارت غير متزامنة؛ العملية `"rerank"` أُضيفت لـ`AIOperation`/الـrouter (يُحتسب استهلاكها كباقي العمليات)؛ طلب JSON صارم مع **هبوط آمن** (أي فشل/ردّ غير صالح → ترتيب الإدخال كما هو)؛ الترتيب على `position` فقط. `RAG_RERANKER=lexical|model` (الافتراضي lexicon المحددة الحتمية) + `RAG_ENABLE_RERANK=false` → `NoopReranker` (المفتاح المعلّق في env وُصل أخيرًا).
- **عقد `upsert` وُسّع بـ`scope?`**: Qdrant يعكس حقول النطاق في الـpayload ليعزل الاستعلام؛ `SqliteVectorStore` يتجاهله (فلتر SQL قائم).
- **اختبارات**: `qdrantVectorStore.test.ts` (8 — خادم Qdrant وهمي في العملية عبر node:http بلا Docker) + `modelReranker.test.ts` (7 — مزوّد مقيد حتمي) + `ragFactory.test.ts` (5) → **195/195 أخضر**؛ E2E **29/29 أخضر** (qlite+lexical افتراضيًا، لا تغيير UI).
- `npm run check` أخضر (195/195) + `npm run build` أخضر + docs sync (DECISIONS D-025/TASKS/CHANGELOG/TEST_PLAN/README/API_SPEC/RAG_SYSTEM/.env.example).

## 2026-09-24 — الجلسة السادسة عشرة (PHASE 22: تفعيل التخزين المؤقت — AiCache)
- **القرار D-026**: العمليات الحتمية فحسب تُخدم من ذاكرة LRU داخل العملية (`AiCache` جاهز منذ PHASE 6): LLM `classifier` + `rerank`، و`embedding` (نفس النصوص → نفس المتجهات)، و`ocr` (نفس البايتات → نفس النص) — أما **المعلّم/recap/feedback فديناميكية لا تُخزَّن أبدًا**.
- **AiCache عام + عدّادات**: `AiCache<T>` (ثلاث نسخ عبر `AiService`: LLM/embedding/OCR)، `set(key, value, ttlMs?)` اختياري لكل إدخال، `stats()` (hits/misses/size)، ومفاتيح محتوى-العنوان بصمة `sha256` (لا مسح للنصوص الحية).
- **لا يسجَّل استخدام عند الضربة**: ضربة الـcache = صفر استدعاء مزوّد = صفر تكلفة — الملفات/النصوص المتطابقة في نفس العملية تُعاد معالجتها بلا شحنة مكررة (مسار B بعد A بواسطة بايتات متطابقة = استفادة من التعرف الأول). `AI_CACHE_ENABLED=false` يُرجع كل شيء للمزوّد مع التسجيل.
- **الإعدادات + المراقبة**: `AI_CACHE_TTL_MS` (5 د)/`AI_CACHE_EMBEDDING_TTL_MS` (ساعة)/`AI_CACHE_OCR_TTL_MS` (24 س)/`AI_CACHE_MAX_ENTRIES` (256)؛ `GET /api/health` يعرض `cache: {hits, misses, size, maxEntries}` بلا واجهة جديدة.
- **اختبارات**: `unit/aiCache.test.ts` (5) + `unit/aiCaching.test.ts` (6 عبر AiService حقيقي بمزوّدات mock) → **206/206 أخضر**؛ `ocr.test.ts` (API) عُدّل لدلالات الشحنة الجديدة (بايتات متطابقة → نمو 0/+1 فقط)؛ E2E **29/29 أخضر** (المعلّم لا يُخزَّن — لا تغيير سلوكي).
- `npm run check` أخضر (206/206) + `npm run build` أخضر + docs sync (DECISIONS D-026/TASKS/CHANGELOG/TEST_PLAN/README/.env.example).

## 2026-09-24 — الجلسة السابعة عشرة (PHASE 23: لوحة ولي الأمر — تفاصيل جلسات الطفل)
- **القرار D-027**: تفعيل البند المؤجل «تفاصيل المحادثة» كخط زمني **بيانات وصفية فقط** — عمود `messages.content` **لا يُحدَّد في الاستعلام إطلاقًا** (لا تسريب بنيويًا)، والمرفقات تُصف بفوق-بيانات بلا بايتات/بصمات.
- **مخطط**: عمود `messages.safety_flag` (nullable — `prompt_injection` عند إطلاق tripwire) عبر `0007_abandoned_celestials.sql` (توليد drizzle-kit: SQL + journal + snapshot).
- **تخزين العلم**: `sendMessage` أصبح يخزّن نتيجة tripwire على دوران الرد (كان يُعرض ولا يُحفظ) — العدّاد مشتقّ من الصف لا من فحص النصوص.
- **النهاية الجديدة**: `GET /api/parent/children/:studentId/sessions/:sessionId` ← `ParentService.sessionDetail`: مدة/تحية + **خط زمني** `{role, kind, createdAt, attachments, safetyFlagged}` + مفاهيم الجلسة من `assessments` (تحليل `resultJson` بصبر) + `safety.flaggedTurns`؛ عزل بنيوي (لا رابط → 404، جلسة طفل آخر → 404، الطالب → 403).
- **الويب**: زر «التفاصيل» في صف الجلسة → شاشة تفاصيل (بطاقة جلسة، **تنبيه سلامة** عند أعلام، مفاهيم عُرضت، قائمة النشاط بشارات الدور/النوع/المرفق/OCR/الأمان) + زر عودة.
- **اختبارات**: API `parent.test.ts` 11→**13** (خط زمني 4 أدوار بدقة + مرفق صورة + عَلَم واحد + مفهوم من `recordAssessment` + 6 نفي تسريب؛ عزل 403/404 ×٤) → **208/208 أخضر**؛ E2E `parent.spec.ts` +**P4** (طالب يسأل + حقن → الوالد يفتح التفاصيل: 4 مداخل + شارة أمان + 3 نفي تسريب) → **30/30 أخضر**.
- `npm run check` أخضر (208/208) + `npm run build` أخضر + docs sync (DECISIONS D-027/TASKS/CHANGELOG/TEST_PLAN/README/API_SPEC) + commit.

## 2026-09-25 — الجلسة الثامنة عشرة (PHASE 24: محرك إتقان المفاهيم + تمرين سريع)
- **القرار D-028**: الإتقان يُحسب **قراءةً** من سجلات التقدم + التقييمات (مستويات عربية رباعية، انحلال أُسي Ebbinghaus، اتجاه من آخر ≤3 أحداث)، وتُفعَّل جداول `questions`/`answers` الخاملة منذ PHASE 1 كقناة **تمرين MCQ حتمي** (بلا استدعاءات AI) تُغذّي `recordAssessment` — أول مُستدعٍ إنتاجي لمسار التقييمات.
- **محرك نقي** `progress/mastery.ts`: `masteryLevel`/`describeMastery`/`decayMastery`/`masteryTrend`/`daysBetween`/`round2` + `safeParseAssessment` مركزي (كان محليًا في parent/service). معامل `MASTERY_DECAY_PER_DAY` جديد (افتراضي 0.02 ≈ نصف عمر 35 يومًا؛ 0 = إيقاف).
- **الخدمات**: `memoryService.masterySummary(studentId)` يزيّن كل مفهوم بـ `{level, labelAr, decayedMastery, daysSinceLastPractice, trend}` (الانحلال قراءةً فقط — ذاكرة المعلّم تحتفظ بالقيمة الخام)؛ `progress/me` يكشف `mastery`؛ مفاهيم تقدم الطفل في لوحة الوالد تحمل المستوى/الشارة.
- **التمرين**: `GET /api/practice/question` (أضعف مفهوم متتبَّع أولًا ثم أي سؤال في مناهج الطالب المسجَّلة؛ بلا تسريب المفتاح) + `POST /api/practice/questions/:id/submit` (تصحيح + `answers` + تقييم + شرح + مستوى مُحدَّث)؛ غير مسجَّل → 404، ولي أمر → 403، خيار غير صالح → 400.
- **بذر**: 6 أسئلة MCQ مصرية مرتبطة بمفاهيم الدروس الثلاثة — idempotent، والسعودية بلا أسئلة عمدًا (إثبات النطاق لكل منهج).
- **الويب**: `Home.tsx` قسم «إتقان المفاهيم» (شارات + نسبة + سهم اتجاه + حداثة) + لوحة «تمرين سريع»؛ `Parent.tsx` شارات مستوى في تقدم الطفل.
- **اختبارات**: وحدة `mastery.test.ts` **+15** و API `practice.test.ts` **+8** → **231/231 أخضر**؛ E2E `practice.spec.ts` **PR1** (تمرين → تغذية راجعة + شارة مستوى → reload → صفّ إتقان) → **31/31 أخضر**.

## 2026-09-25 — الجلسة التاسعة عشرة (PHASE 25: خطة الممارسة — توصيات الإتقان كخطة مرتّبة)
- **القرار D-029**: استيفاء البند المؤجل من D-028 — `GET /api/practice/plan` يحوّل الإتقان إلى **خطة قراءةٍ نقيّة** (بلا كتابة): كل مفهوم متتبَّع يُرتَّب «الأضعف أولًا» ويظهر مع درسه وعدد أسئلته المتاحة.
- **ترتيب صافٍ** (`practice/plan.ts` — `sortPlan`): `decayedMastery` تصاعديًا → `daysSinceLastPractice` تنازليًا → `conceptId` حتميًا؛ لا تعديل للمدخلات.
- **الخدمة**: `planFor(studentId)` — ربط `concepts↔lessons` + عدّاد `availableQuestions` موقوف على **مناهج الطالب المسجَّلة فقط** (`curriculumEnrollments` النشطة؛ مفهوم متتبَّع لغير المسجَّل = 0)؛ مسار `/plan` student فقط (ولي أمر → 403) وبلا خيارات/مفتاح أبدًا.
- **الويب**: قسم «خطة ممارستك» داخل بطاقة التقدم (شارة مستوى + درس + «n سؤال متاح» + حداثة + سهم اتجاه) وزر «تمرّن الآن» يفتح لوحة التمرين **مقيّدًا بالمفهوم** (إعادة استخدام `question?conceptId=` — لا مسار أسئلة جديد).
- **اختبارات**: وحدة `practicePlan.test.ts` **+5** و API `practicePlan.test.ts` **+5** → **241/241 أخضر**؛ E2E `practice.spec.ts` **PR2** (خطة + تمرّن الآن → لوحة تمرين بسؤال حقيقي) → **32/32 أخضر**.

## 2026-09-25 — الجلسة العشرون (PHASE 26: حساسية الصعوبة + شارات التمرين والإتقان)
- **القرار D-030**: إغلاق بندي D-028 المؤجلين — «المعادلة تعتمد على صعوبة السؤال» + «ربط مخرجات المحرك بشارات الإنجاز».
- **معادلة مستجيبة للصعوبة**: `assessmentDelta` النقّي في `mastery.ts` (سهل +0.15/−0.1 — الحسم التاريخية، متوسط +0.175/−0.125، صعب +0.2/−0.15)؛ `recordAssessment` يقبل `difficulty?` وتمريره يأتي من سؤال التمرين الفعلي؛ المحاولة الأولى محايدة للصعوبة (0.6/0.1) فالتفاضل على التتابع.
- **شارات يغذّيها المحرك**: «انطلاقة التمرين» (أول إجابة تمرين) و«أول إتقان» (أول مفهوم «متقن» بالدرجة المعروضة — لا الخام)؛ الحقن بعد كل إجابة **best-effort** (لا يكسر الحلقة) بنفس مسار إنجازات PHASE 20 — **صفر تغيير ويب** (الشاشتان تعرضان التعريفات تلقائيًا).
- **الاختبارات**: وحدة `difficultyDelta.test.ts` **+6** و API `practiceDifficulty.test.ts` **+3** (0.6 → 0.8 → 0.65 على سؤال صعب) و API `practiceBadges.test.ts` **+4** + تحديث ميكانيكي `achievements.test.ts` (total 6→8) → **254/254 أخضر**؛ E2E `practice.spec.ts` **PR3** («انطلاقة التمرين» مكتسبة و«أول إتقان» مقفولة) → **33/33 أخضر**. الكوربس المصغّر حصل على مفهوم ثالث بسؤال **hard** (`questionC1`) لتثبيت الدلتا.</think>

## 2026-09-25 — الجلسة الحادية والعشرون (PHASE 27: إحصاءات الاشتراكات + وفورات الكاش في لوحة المدير)
- **القرار D-031**: إغلاق بندي D-024 وD-026 المؤجلين — توسيع `GET /api/admin/stats` بنفس نمط PHASE 17 (تجميعات نقيّة فوق الجداول الحالية، بلا تخزين جديد، admin-only).
- **قمع الاشتراكات**: `subscriptions{total, free, premium, active, conversionRate}` — توزيع الخطة المخزّنة + **المميزة السارية فعليًا** (trialing/active وغير منتهية) + معدل التحويل (أعشار %) — بلا اعتماديات.
- **الاستخدام + الوفورات**: `ai{calls, byOperation, tokens, costUsd, cache{hits,misses,hitRate,size,maxEntries}, estimatedSavingsTokens, estimatedSavingsUsd}` — الوفورات ≈ متوسط التوكن/التكلفة لنداءات العمليات القابلة للتخزين المؤقّت التي وصلت للمزوّد (المسجَّلة) × إصابات الكاش، مع بديل متوسط المنصة عند غيابها (مثل Embeddings في mock لا تُسجَّل)؛ عدّادات فقط بلا محتوى رسائل أبدًا.
- **الويب**: بطاقتا «الاشتراكات — نظرة سريعة» و«الذكاء الاصطناعي — الاستخدام والوفورات» في لوحة الإدارة (testids: `admin-stats-subscriptions`/`admin-stat-subs-*` و`admin-stats-ai`/`admin-stat-ai-*`).
- **إصلاح**: إزالة كتلة خاملة `<|DSML|tool_calls>` كانت مضمّنة بالخطأ في ذيل CHANGELOG (تكرير قسم PHASE 26) — الجلسة العشرون أصبحت قسمًا واحدًا نظيفًا.
- **الاختبارات**: API `adminStatsExtended.test.ts` **+4** (القمع free/premium/active/تحويل 50%، انحدار past_due → «سارية» 0، عدّادات الاستخدام tutor≥2، إصابات كاش مع وفورات توكن >0 وUSD=0 على mock) → **258/258 أخضر**؛ E2E `admin.spec.ts` **A4** (البطاقتان تعرضان للمدير) → **34/34 أخضر**.

## 2026-09-25 — الجلسة الثانية والعشرون (PHASE 28: أسئلة مولّدة بالمفهوم — تغطية المفاهيم بلا أسئلة)
- **القرار D-032**: إغلاق البند المؤجل المتكرر في D-028/D-029/D-030 — عملة LLM جديدة **`question_gen`** (قابلة للتخزين المؤقّت + mock حتمي أوفلاين بلا مفتاح) تولّد **سؤال MCQ واحدًا لكل مفهوم بلا أسئلة** مرتكزًا على مقاطع الدرس (سقف `QUESTION_GEN_MAX_CHUNKS`=6 / `QUESTION_GEN_MAX_CONTEXT_CHARS`=4000) — بلا مخطط جديد: يُخزَّن في جدول `questions` الحالي (`mcq`/`easy`/`optionsJson={options,correctIndex}`/`answerKey=null`) ويدخل حلقة «ضعف → ممارسة → إتقان» فورًا (يُصحَّح ويُدرّب تقييمًا كأي سؤال مزروع).
- **الختم الحتمي** (`practice/questionGen.ts` — جديد): `parseGeneratedQuestion` حد صارم (JSON بعد تجريد الكتلة الملفوفة، نص ≥5، خيارات ≥4، `correctIndex` عددي في المدى) + `groundingPrompt` (`<context>` + «المفهوم: «…»»)؛ mock `buildMockQuestion`: حقائق من تقسيم السياق مع **استبعاد نفي «غير موجود»** (جملة الطُعم لا تُلتقط قط كإجابة)، الصحيح **حرفي من الدرس**، مشتتّات طفرة رقم + حشوات، وتدوير حتمي يخفي موضع الصحيح.
- **التوليد الذاتي للطالب**: `POST /api/practice/generate {conceptId}` (404 مجهول/خارج مناهجه، 409 مغطّى، 503 درس بلا مقاطع) — وفي **الخطة** صارت المفاهيم غير المتتبعة لمناهج الطالب المسجَّلة **تُدرَج** (`tracked:false`, إتقان 0) مرتبة بعد المتتبعة فلم تعد المفاهيم بلا أسئلة («مقارنة الكسور» المصرية والسعودية كلها) مخفية — صفها يعرض **«توليد سؤال»** (`plan-generate`) يولّد ويفتح لوحة التمرين فورًا.
- **التوليد الجماعي الإداري**: `POST /api/admin/questions/generate` بنطاق واحد `{conceptId|lessonId|curriculumId}` → `{result:{generated,skipped,failed,items}}` **بيانات وصفية فقط** بلا محتوى أسئلة، idempotent (إعادة التشغيل تولّد 0)، مفهوم بلا مقاطع → `failed`، وتدقيق `question.generate`؛ `question_gen` أُضيفت إلى `LLM_CACHEABLE`/`CACHEABLE_OPERATIONS` (تحسبها إحصاءات PHASE 27) وذهبت `contextUserId` الصحيحة (`auth.user.id` — `ai_usage_logs.userId` يرجع لـ`users` لا `students`؛ كشفها اختبار API كان 500).
- **الويب**: بطاقة «توليد أسئلة بالمفهوم (LLM)» في اللوحة (زر `admin-gen-questions` معطّل حتى اختيار منهج + تقرير `admin-gen-result`) + «لم يُمارَس بعد` للمفاهيم غير المتتبعة في الخطة.
- **اختبارات**: وحدة `questionGenMock.test.ts` **+14** وAPI `practiceGenerate.test.ts` **+9** وAPI `adminQuestionGen.test.ts` **+6** + تحديث عقد PHASE 25 (خطة = 3 صفوف مع `tracked` في الوحدة والـAPI) → **289/289 أخضر**؛ E2E `admin.spec.ts` **A5** (الإدارة تولّد للمنهج المصري: «تم توليد 1 سؤالًا» — مقارنة الكسور الوحيد بلا أسئلة) و`practice.spec.ts` **PR4** (الطالب يمرّن المولّد: «أي العبارات التالية وردت في الدرس» → تغذية راجعة → إتقان بعد reload) → **36/36 أخضر**.
- `npm run check` أخضر (289/289) + `npm run build` أخضر + docs sync (DECISIONS D-032/TASKS/CHANGELOG/TEST_PLAN/README/API_SPEC) + commit.
