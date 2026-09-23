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