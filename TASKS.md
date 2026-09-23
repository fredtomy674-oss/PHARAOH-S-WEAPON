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

### PHASE 11 — Voice conversation (سؤال بصوت) ✅
- [x] طبقة صوتية كاملة في المتصفح عبر Web Speech APIs (قرار D-015): `web/src/voice.ts` —
  STT عبر `SpeechRecognition` (و`webkitSpeechRecognition` للتوافق) وTTS عبر `speechSynthesis`؛
  بلا مفاتيح وبلا تغيير في الخادم → الدردشة النصية وVision بلا أي انحدار
- [x] «التحدث بدل الكتابة»: زر 🎙️ (+ حالة استماع مع إيقاف) ينسخ ناتج التعرف في حقل الرسالة **للمراجعة والتعديل** (لغة عربية `ar-EG`، يدعم Chrome/Edge على localhost/HTTPS، ورسالة واضحة «غير مدعوم في هذا المتصفح» عند غياب STT)
- [x] سماع الرد: تشغيل تلقائي لرد المدرس عند إرسال سؤال صوتي + زر 🔊 «استمع» على كل فقاعة رد + شارة «جارٍ الاستماع إلى رد المدرس…» مع زر ⏹ إيقاف (`speechSynthesis.cancel`)؛ انتخاب صوت عربي إن وُجد مع إصلاح محرك يرفض كائن صوت غير مطابق (try/catch — اكتشفته E2E)
- [x] E2E حتمية عبر stubs مُحقنة في المتصفح (لا يمكن أتمتة ميكروفون حقيقي): A1 (صوت → نص للمراجعة → تعديل → إرسال → رد مُنطق تلقائيًا → إيقاف)، A2 (رسالة مكتوبة لا تُنطق تلقائيًا؛ 🔊 يعمل ويُوقف)، A3 (عند غياب STT → خطأ واضح) — **16/16 أخضر**
- [x] `npm run check` أخضر (70/70) + `npm run build` أخضر + docs sync (DECISIONS D-015) + commit

### PHASE 12 — Student Documents in Chat (Path A) ✅
- [x] التخزين: عمود `extracted_text` nullable على `message_attachments` — migration `0002_material_virginia_dare.sql` تُطبَّق تلقائيًا؛ env `MAX_FILE_KB`=10000 و`MAX_DOCUMENT_CHARS`=20000؛ `bodyLimit` Fastify → 32MB
- [x] `POST /api/sessions/:id/messages` يقبل `document: { dataUrl, fileName }` (PDF/DOCX/TXT/MD) — **صورة XOR مستند** ← 400 `MULTIPLE_ATTACHMENTS`؛ رسالة بلا نص مقبولة مع ملف؛ أخطاء 400 واضحة (UNSUPPORTED_DOCUMENT_TYPE/DOCUMENT_TOO_LARGE/INVALID_DOCUMENT_FORMAT/EMPTY_DOCUMENT)
- [x] استخراج نص آمن بخواص JS نقية (في الذاكرة): PDF عبر **`pdfjs-dist`** legacy ESM (استُبعد `pdf-parse`: فرع debug عند استيراد ESM + تقلّب على Node 24)؛ DOCX عبر `mammoth@1.12.3` (فوق نطاق GHSA-rmjr-87wv-gf87)؛ TXT/MD UTF-8 + إزالة BOM؛ الاقتطاع لـ`MAX_DOCUMENT_CHARS` بـ«…»؛ الفشل/الممسوح → نص فارغ (OCR مؤجل)
- [x] AI آمن: `LLMRequest.documents` → Gemini يلحق النصوص بآخر رسالة مستخدم + mock «قرأت الملف المرفق» + أول 60 حرفًا؛ PromptBuilder: قاعدة نظام «محتوى `<document>` مستخدم غير موثوق»؛ **tripwire يعيد فحص نص المستند خادميًا قبل أي استدعاء** → SAFE_REFUSAL؛ استرجاع doc-only «سؤال عن محتوى الملف المرفق في هذا الدرس»
- [x] الويب: زر «📄 إرفاق ملف» + معاينة/إزالة + chip `msg-document` في فقاعة المستخدم + مرآة عميل 10MB + منع الجمع مع الصورة
- [x] مولد fixtures وليد Node خالص (`scripts/make-doc-fixtures.mjs`): PDF بيدوي + ZIP بيدوي (STORED+CRC-32؛ لأن أرشيفات Windows تكتب شرطات مائلة عكسية) → `e2e/fixtures/{question.pdf, question.docx, injection.txt}`
- [x] اختبارات: unit documents (6: PDF، DOCX، TXT، اقتطاع، تالف لا يرمي، ممسوح → فارغ) + mockDocument (3) + API documents (9) — **88/88 أخضر**
- [x] E2E D1–D3 (`document.spec.ts`): PDF+نص → قراءة+اقتطاع+RAG+chip؛ DOCX بلا نص → قراءة؛ حقن داخل TXT → رفض آمن بلا استدعاء — **19/19 أخضر**
- [x] `npm run check` أخضر (88/88) + `npm run build` أخضر + docs sync (DECISIONS D-016) + commit
- [x] Path B منفصل تمامًا (لا يُخلط مع مسار الطالب) — يُنفَّذ في PHASE 13

### PHASE 13 — Curriculum File Import (Path B) ✅
- [x] استكشاف + 6 قرارات موثقة (D-017) + موافقة البداية: إعادة استخدام `extractDocumentText`/`parseDocumentDataUrl` من `sessions/documents.js` (صفري التعديل على Path A)؛ BLOB للبايتات الخام + sha256 كـ«هوية الملف»؛ إزالة تكرار chunks مرتبطة بالدرس `(content_hash, lesson_id)` بدل الفهرس العام
- [x] Schema + migration `0003_many_namor.sql`: عمود `document_versions.data` (BLOB) + الفهرس المركب الجديد (حذف `chunks_content_hash_unique`)
- [x] env: `MAX_CURRICULUM_FILE_KB`=20480 (20MB؛ b64 ≈27.96M < Ajv 28M وbodyLimit 32MB) و`MAX_CURRICULUM_DOCUMENT_CHARS`=200000 — وسقف اختبار `MAX_CURRICULUM_FILE_KB=4` (vitest.config + .env.example)
- [x] `KnowledgeService.ingestFile` (raw sha256+size+data، دوبليكات 409 `DOCUMENT_ALREADY_INGESTED`، clean→chunk→embed→chunks/vectors، `EMPTY_DOCUMENT` للفارغ) + `fileKindFromMime` + `fileSha256(Buffer)`؛ `ingestText` دوبليكاته أصبح مرتكزة على الدرس
- [x] `POST /api/admin/documents/ingest-file` (admin + CSRF؛ schema: dataUrl ≤ 28_000_000، scope كامل إلزامي) → 201 `{ document: { documentId, versionId, chunkCount } }`
- [x] fixtures مناهج مستقلة `curriculum.pdf`/`curriculum.docx` (نص درس واقعي > 40 حرفًا + علامات `TutorFixturePDF 123`/`TutorFixtureDOCX 456`) — المولّد يُوسَّع وبقي `question.*` مطابقًا بايتًا-بايت (593B/1297B) وMediaBox PDF أوسع (1500) حتى يستخرج pdfjs السطر كاملًا
- [x] اختبارات: unit `knowledgeFile` (PDF بايتات+شُعب+متجهات، DOCX، دوبليكات، ممسوح، عزل درس فريد) + API `adminFile` (201/403/خطوط الحدود/استرجاع فعلي/عزل S8/S6 عبر الملف) + migrations (عمود data + فهرس) — **106/106 أخضر** (بلا E2E هذه المرحلة)
- [x] إصلاح مُرافق في مزوّد `mock`: استخراج كتلة `<context>` الحقيقية (آخر وسم) بدل أول تواجد داخل قواعد النظام — صدى الرد في dev يطابق المحتوى المسترجع فعليًا
- [x] `npm run check` أخضر (106/106) + `npm run build` أخضر + docs sync (DECISIONS D-017، API_SPEC §4/§7، RAG_SYSTEM §1/§6، TEST_PLAN) + commit
- [ ] OCR للمستندات الممسوحة ضوئيًا (مؤجل صراحةً — يُفتح كمرحلة مستقلة)

### PHASE 14 — Admin Dashboard: استيراد ملفات المنهج عبر الواجهة ✅
- [x] شاشة `Admin.tsx` في الويب (مسار role-gated في `App`؛ زر «لوحة الإدارة» يظهر في Home للـadmin فقط — لا يظهر للطالب إطلاقًا)
- [x] بطاقة «استيراد ملف منهجي»: اختيار ملف (PDF/DOCX/TXT/MD) + عنوان/مصدر اختياريان + **نطاق الدرس** بنفس نمط picker الخاص بالمنهج (دولة→نظام→صف→مادة→منهج→فصل→وحدة→درس)؛ رفع الملف يُقرأ client-side كـ dataUrl (مرآة سقف المنهج 20MB) ثم `POST /api/admin/documents/ingest-file` (CSRF يُرفق تلقائيًا) → رسالة نجاح بعدد المقاطع؛ أخطاء الخادم (مثل `DOCUMENT_ALREADY_INGESTED`) تُعرض بوضوح
- [x] قائمة «المستندات المستوردة»: `GET /api/admin/documents` أُثري خادميًا بعمود الدرس (`lessonId`/`lessonTitle`) و`chunkCount` (LEFT JOIN chunks+lessons + `count`) كي تكون اللوحة مفيدة فعلًا (أي مستند يغذي أي درس وكم أضاف مقاطع) — بلا تغيير في شكل الاعتماد الحالي للاختبارات
- [x] E2E `admin.spec.ts` (متصفح حقيقي): A1 رفع `curriculum.pdf` للدرس **الثاني** (الضرب والقسمة — عزل عن نطاقات بقية specs) → نجاح + صف في اللائحة باسم الدرس و`chunkCount>0`؛ A2 إعادة رفع نفس البايتات → خطأ «مستورد مسبقًا» (dedup حقيقي عبر UI)؛ A3 الطالب لا يرى زر الإدارة إطلاقًا — **22/22 أخضر**
- [x] `npm run check` أخضر (106/106) + `npm run build` أخضر + docs sync (DECISIONS D-018/TASKS/CHANGELOG/TEST_PLAN/README) + commit

### PHASE 15 — حماية رفع الملفات: فحص توقيع الملفات (MAGIC bytes) ✅
- [x] وحدة نقية `utils/fileTypes.ts`: `detectFileKind(bytes)` يشمّ البايتات الخام — PDF عبر رأس `%PDF-` خلال أول 1024 بايتًا (يسمح بـ junk-prefix وفق مواصفة PDF)، DOCX عبر رأس `PK\x03\x04` + وجود `[Content_Types].xml` في أول 64KB، وكل ما سواهما = نص؛ + `kindForDeclaredMime` (التطابق مع MIME المعلن) وأخطاء `FILE_TYPE_MISMATCH`
- [x] الربط في نقطة مشتركة `parseDocumentDataUrl` (المساران A وB معًا): بعد فك الترميز وقبل أي استخراج/تخزين يُقارَن النوع المكتشف بالمعلن — تطابق فقط يمر؛ انتحال ممتد (نص → .pdf، ZIP عام → .docx، PDF → نص) → `400 FILE_TYPE_MISMATCH`؛ **النص المُقرأ داخل المُستخرج الفعلي** يبقى عبر mime المعلن المطابق
- [x] اختبارات: unit `fileTypes` (7) + API Path A انتحال نص-كـ-PDF (10) + API Path B (15): نص→PDF، ZIP→DOCX، PDF→نص، مع تصحيح اختبار «الممسوح» لرأس PDF **حقيقي** (%PDF-1.4 بلا نص) ليُبقي `EMPTY_DOCUMENT` — **117/117 أخضر**
- [x] `npm run check` أخضر (117/117) + `npm run build` أخضر + E2E 22/22 (لا انحدار في مسار الرفع) + docs sync (DECISIONS D-019/TASKS/CHANGELOG/TEST_PLAN/README/API_SPEC) + commit

### PHASE 16 — زرع منهج سعودي (multi-country) ✅
- [x] إعادة هيكلة `db/seed.ts` إلى بذر عام `seedCountry(db, knowledge, spec)` بمواصفات `CountrySeedSpec` — تُبذر مصر (الأصل، نصوصها حرفيًا) ثم **السعودية**: `sa` / وزارة التعليم / الصف السادس / منهج `sa-g6-math` بدروس `l-sa-ops` و`l-sa-units` بمحتوى سعودي (الرياض/جدة/الريال السعودي) ومفعّل RAG عبر نفس أنبوب `ingestText`
- [x] **الكتالوج العالمي المشترك**: جدول `subjects` عالمي بلا countryId — السلالة الجديدة تعيد استخدام صفّ `math` الموجود ولا تُكرّره أبدًا (إلا مع قيد uniqueness موجود `subjects_code_unique`)
- [x] العزل لا يتطلب تغييرًا في الخدمة (مرشحات countryId موجودة أصلًا): اختبارات عزل الكتالوج (نظام/صف/منهج/فصل/وحدة/درس لكل بلد) + تكامل RAG ثنائي الاتجاه: جلسة سعودية تتأرض بمحتوى سعودي («الرياض» حاضر، «مقارنة الكسور» غائب) وجلسة مصرية عكس ذلك
- [x] إصلاح E2E: بعد إضافة السعودية أصبحت مترتبة أبجديًا قبل «مصر» فأصبح «أول خيار» سعوديًا — أُضيف `selectOptionByLabel(page, testId, label)` في `e2e/helpers.ts` واختيار «مصر» صراحةً في `startFirstLesson` و`pickSecondLesson` (admin.spec) — اختبارات حتمية بلا اعتماد على الترتيب
- [x] **125/125 أخضر** (117 + 8 multiCountry) + `npm run build` أخضر + E2E 22/22 مع البذرة الجديدة + docs sync (DECISIONS D-020/TASKS/CHANGELOG/TEST_PLAN/README/API_SPEC) + commit

### PHASE 17 — Analytics: إحصاءات المسؤول ✅
- [x] نهاية خادمية `GET /api/admin/stats` (محصّنة بـ`requireAdmin`): تجميعات صافية من الجداول القائمة فقط — مستخدمون/طلاب، جلسات (إجمالي/نشطة/منتهية)، رسائل (إجمالي/طالب/مدرس)، مستندات (إجمالي/جاهزة)، مقاطع معرفية، مناهج، دروس — بلا تخزين جديد ولا جداول
- [x] واجهة: قسم «إحصاءات سريعة» في أعلى لوحة الإدارة (`Admin.tsx`) ببطاقات `admin-stats-*` (مستخدم/طالب/جلسة/رسالة/مستند/مقطع) + تنسيق `admin-stats-grid` — الجلب متسامح (لا يعطّل رفع الملفات أبدًا)
- [x] اختبارات API (2): رفض الطالب (403 FORBIDDEN) + عدّادات مطابقة للنشاط الفعلي (جلسة نشأت وانتهت برسالتين → 4 رسائل، مستندات الكوربس جاهزة بمقاطعها)
- [x] **127/127 أخضر** (125 + 2 adminStats) + `npm run build` أخضر + E2E 22/22 (لا انحدار في تدفق الإدارة) + docs sync (DECISIONS D-021/TASKS/CHANGELOG/TEST_PLAN/README/API_SPEC) + commit

### الخريطة الموسعة (بعد MVP — بحسب الأولوية)
- [x] ✅ Voice conversation (STT/TTS) — Web Speech API في المتصفح (PHASE 11)؛ ترقية لاحقة: مزوّد STT/TTS خادمي عبر واجهات AI
- [x] ✅ Vision upload (سؤال مصور) — 3 E2E + 9 اختبارات (PHASE 10)
- [x] ✅ Student files in chat (Path A — PDF/DOCX/TXT/MD) — 3 E2E + 18 اختبارات (PHASE 12)؛ OCR مؤجل
- [x] ✅ Curriculum files in knowledge base (Path B — PDF/DOCX/TXT/MD عبر `ingest-file`) — 14 اختبارًا (PHASE 13)؛ OCR مؤجل
- [ ] 🟡 OCR للمستندات الممسوحة ضوئيًا (المساران A وB) — تُفتح كمرحلة مستقلة
- [ ] 🟡 Parent dashboard
- [x] ✅ Admin dashboard (لوحة استيراد ملفات المنهج PDF/DOCX عبر الواجهة) — PHASE 14
- [x] ✅ حماية رفع الملفات: فحص MAGIC bytes (تُرفض الانتحالات قبل الاستخراج/التخزين) — PHASE 15؛ OCR يبقى مؤجلًا
- [ ] 🟡 Billing/Subscriptions تفعيل + Achievements تفعيل
- [ ] 🟡 Qdrant/pgvector adapter + إعادة تصنيف عبر نموذج
- [x] ✅ Analytics + إحصاءات المسؤول في اللوحة (نهاية `GET /api/admin/stats` بلا جداول جديدة) — PHASE 17
- [x] ✅ زرع منهج سعودي multi-country (وزارة التعليم/السادس/رياضيات — أثبت أن العمارة إقليمية) — PHASE 16
- [x] ✅ اختبار UI آلي حقيقي (Playwright) عبر المتصفح — 16/16 (PHASE 9 + 10 + 11)
- [ ] 🟡 Caching مُفعَّل لتقليل استدعاءات المزود الحقيقي (AiCache جاهز)

---
**قاعدة: مهمة تعتبر DONE فقط بعد اختبارات خضراء. لا تعتمد على هذه القائمة للتتابع — اقفز فعليًا في PHASE الأقدم غير المكتملة.**