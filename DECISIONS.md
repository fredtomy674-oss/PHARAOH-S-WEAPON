# DECISIONS — AL FAROUQ AI

> سجل القرارات المعمارية: **ماذا قررنا، لماذا، وماذا لو تغيّر؟** كل قرار يكتب بعد اتخاذه.

## D-001 — اللغة والبنية العامة
**القرار**: TypeScript للخادم والواجهة في npm workspaces (`server/` + `web/`).  
**لماذا**: لغة واحدة تقلل التبديل السياقي؛ Node 24 موجود؛ أفضل توافق مع AI coding agents وإعادة الاستخدام الشامل للنماذج.  
**بدائل**: Python(uv) — ممتاز للـAI لكنه يشطر النظام إلى لغتين.  
**المقارنة**: Maintainability=TS ✅, Agent-friendliness=TS ✅, Cost=متساوٍ, Performance=كافٍ.  
**فضلاً**: لا تغيير دون مشكلة معيارية حقيقية.

## D-002 — إطار السيرفر
**القرار**: Fastify 5 بدل Express.  
**لماذا**: JSON-schema validation مدمجة (Ajv، آمنة واحترافية)، plugin architecture نظيفة، أداء ممتاز، hooks لـauth/rate-limit.  
**بدائل**: Express 5 (شائع جدًا لكن validation يدويًا)، Hono (جديد، أقل نضجًا في plugins).  
**المخاطر**: عدد plugins أصغر قليلًا — مُدار بالتوثيق الرسمي.

## D-003 — قاعدة البيانات والمigrations
**القرار**: Drizzle ORM + drizzle-kit فوق `better-sqlite3` محليًا، مع مسار مهاجرة موثق إلى PostgreSQL.  
**لماذا**: SQLite=صفر إعداد على جهاز بلا Docker ولا Postgres؛ Drizzle: schema كنوع TypeScript نقية (agent-friendly)، migrations قابلة للقراءة، بلا محركات ثنائية (تجنب مشاكل Windows كما في Prisma).  
**بدائل**: Prisma (أثقل، binary engines)، Kysely (query builder فقط، بلا schema DSL كامل).  
**إلى الإنتاج**: تبديل driver في `db/index.ts` + مرآة schema-postgres (TECHNICAL_ARCHITECTURE §6). Migration-first: جديد schema = توليد migration + تطبيقه.

## D-004 — Vector Store
**القرار**: `SqliteVectorStore` ينفذ interface `VectorStore` (بحث تشابه ناقل في JS على ناتج SQL فلتر Metadata).  
**لماذا**: صفر بنية خارجية، دقة بمقياس MVP (≤100k chunk) مناسبة، وفصل كامل يسمح لاحقًا بـ pgvector/Chroma/Qdrant بدون لمس `rag/`.  
**لماذا لا sqlite-vec**: إضافة origin أصلية على Windows قد تعقد التشغيل (متغير؛ mapped env للتفعيل لاحقًا إن رغبنا).

## D-005 — AI Provider abstraction
**القرار**: Interfaces `LLMProvider` و `EmbeddingProvider`؛ تنفيذ `Mock*` (أوفلاين، للاختبارات والتطوير) و `Gemini*` (حقيقي). Routing بالنموذج حسب العملية عبر `AI_ROUTING_*`.  
**لماذا**: تغيير المزود = ملف + env، بلا إعادة بناء. Mock يسمح بـ vertical slice كامل بلا مفاتيح.  
**ملاحظة**: لا يُرسَل محتوى خارجي في الاختبارات؛ الاختبارات الحية opt-in `RUN_LIVE_TESTS=true`.

## D-006 — المصادقة
**القرار**: جلسات DB (جدول `sessions`) مع cookie httpOnly + CSRF token + bcryptjs للهاش.  
**لماذا**: قابلية الإلغاء فورية، تحكم بالصلاحيات خادميًا، مناسبة لمنتج قصّر، بلا اعتماد JWT stateless (صعوبة إلغاء).  
**بدائل**: JWT (رد عليّ بالإلغاء), Lucia (مكتبة رائعة لكن تعتمد على adapter آخر — نستغني عنها لصالح 100% تحكم).  
**ملاحظة**: bcryptjs نقية (بلا أصلية بناية على Windows)؛ يمكن ترقية المعاملات production في الـenv لاحقًا.

## D-007 — الـRAG: Metadata هو الحاجز
**القرار**: كل chunk يحمل Metadata كاملة (country→concept, source, version) و Retrieval يرفض أي استدعاء بلا scopeFilter كامل.  
**لماذا**: يمنع «المنهج الخاطئ» على مستوى التصميم، لا بالاعتماد على النموذج.

## D-008 — الواجهة
**القرار**: React 19 + Vite 6 + TypeScript، CSS خالص (RTL-first) عربي.  
**لماذا**: قلة الاعتماديات، تحكم كامل بثيم RTL، سرعة Build، وواجهات أنواع الصوت/الصور كفتحات موثقة.  
**بدائل**: Next.js (monolith يُضْعِف فصل المكونات)، MUI (ثقيل عن الحاجة).

## D-009 — التجارب/التهيئة
**القرار**: Vitest + inject + Mock providers كل شيء قابل للتشغيل أوفلاين. Rate limit يومي للطالب على رسائل AI.  
**لماذا**: التكلفة محدودة (`DAILY_MESSAGE_LIMIT`)، والاختبارات مستقرة (لا شبكة).

## D-010 — إدارة التكلفة
**القرار**: كل استدعاء LLM يمر عبر `UsageTracker` (سجل `ai_usage_logs`) + caching في `AiCache` للاستجابات الشائعة + router يختار النماذج الرخيصة لمهام معينة (classifier أصغر).  
**لماذا**: cost-awareness صبريًا؛ تقدير التكلفة يُحسب من عمود النموذج في حالة توفره.

## D-011 — قبول ثغرات dev-only المتبقية (4 moderate)
**القرار**: قبول 4 ثغرات moderate متبقية في `npm audit` — كلها dev-only عبر سلسلة `drizzle-kit → @esbuild-kit/esm-loader → @esbuild-kit/core-utils → esbuild@0.18.20`.  
**لماذا**: لا تدخل في حزمة الإنتاج runtime؛ لا شيء هنا يستخدم `esbuild serve` (الوضع المتأثر بالثغرة) — vite وtsx يستخدمان transform فقط، وكل مثيلات esbuild الأخرى موسّعة (0.25.12/0.28.2).  
**جولة 2026-09-22 (تحقّق إضافي)**: حُوّل لإغلاقها عبر `overrides` (رفع esbuild المتداخل إلى إصدار مصحح) — أُثبت ميكانيكيًا في عزلة أنه يعمل، لكن على شجرة المشروع الحقيقية (مسارات متعددة: vite + tsx + drizzle-kit) يتجاهل npm الـoverride في فحص `npm ls`/`npm ci` ويُخرج `ELSPROBLEMS invalid` (حزمة core-utils متروكة `deprecated: Merged into tsx`، ونطاقها `~0.18.20` ثابت). لذا: **إما audit نظيف أو `npm ls`/`ci` سليم — لا كلاهما** عبر overrides. رُفض تعقيد patch-package لسلسلة dev-only → الإبقاء على D-011.  
**فضلاً لاحقًا**: عندما يُسقط drizzle-kit `@esbuild-kit/esm-loader` (أو يُستبدل core-utils) → `npm audit fix` وإغلاق السجل.

## D-012 — سلوك Fastify مع JSON فارغ + مواصفات جسم الـAPI
**القرار**: عميل الويب يرسل `Content-Type: application/json` فقط عند وجود جسم فعلي.  
**لماذا**: Fastify يرفض `POST` يحمل content-type=json مع جسم فارغ (400 `FST_ERR_CTP_EMPTY_JSON_BODY`). أثر ذلك: `logout`/`endSession` كانت ستفشل في الويب قبل الإصلاح.  
**ملاحظة للاختبارات الخارجية**: المحاكاة عبر curl بلا content-type بلا جسم تعمل (`{"ok":true}`)؛ النقطة النهائية idempotent (إنهاء جلسة منتهية لا يعيد خطأ).

## D-013 — بنية Browser E2E (Playwright) + rate-limit قابل للضبط
**القرار**:
1. اختبارات Playwright على مستوى جذر workspace (`e2e/` + `playwright.config.ts`)، تشغّلها أمر `npm run e2e` بخادمين مُدارين تلقائيًا:
   - خادم اختبار على منفذ **3107** ضد قاعدة SQLite مؤقتة (تُحذف وتُزرع كل تشغيل عبر `e2e/reset-db.mjs` + seed) — **لا تمسّ قاعدة التطوير** `server/data/alfarouq.sqlite`.
   - Vite حقيقي على **5173** (ميناء التطوير القياسي) ببروكسي `VITE_API_PROXY_TARGET` (افتراضي خارج الاختبارات: 3001 — بدون تغيير سلوك التطوير).
2. `RATE_LIMIT_MAX` أصبح متغير env (الافتراضي 120/دقيقة)؛ `allowList` يستثني `/api/health`؛ معالج الأخطاء يمرر حمولة `error` الصادرة من rate-limit كما هي (كانت تتحول إلى 500 عام).  
**لماذا**: اختبار E2E حقيقي يستحق عزلًا كاملًا للبيانات؛ مجموعة آلية + health-poll تتجاوز حد 120/دقيقة بسهولة → 429 كاذبة. ورسالة «طلبات كثيرة» الواضحة كانت تضيع من المستخدم.  
**بدائل**: تشغيل E2E فوق قاعدة التطوير (يرفضه المستخدم: لا تفسد بيانات التطوير)؛ معدل ثابت مرتفع (يُضعف الحماية في الجميع).  
**ملاحظات**:
- `workers: 1` + `fullyParallel: false` إجباريان (قاعدة مشتركة + حساب تجريبي واحد).
- المتصفح: Chromium (افتراضي) — القابل للتوسعة عبر `projects`.
- حقل الدردشة `maxLength=4000` يمنع تجاوز الطول من المستخدم حقًا؛ لذلك اختبار «خطأ API واضح» استخدم سيناريو CSRF منتهي (E) بدل رسالة طويلة (كانت ستمر عبر المتصفح قبل الوصول للخادم).

## D-014 — Vision Upload (سؤال مصور): base64-JSON في MVP + تخزين BLOB + نقاط أمان
**القرار** (PHASE 10):
1. الرفع عبر `POST /messages` في JSON الحالي بجسم `image: { dataUrl, fileName }` (base64) بدل multipart — يبقي العقود والحدود (schema zod + Fastify validation) والـCSRF في مكانها.
2. التخزين BLOB في جدول `message_attachments` (message_id فريد، session_id للعزل/الحذف، sha256 + size + mime) — بلا نظام ملفات خارجي، يخدم قاعدة الاختبارات المؤقتة بلا أثر.
3. الخدمة عبر `GET /sessions/:id/attachments/:attId` بفحص ملكية (`getOwned`) + رؤوس `content-type` (قائمة بيضاء)، `x-content-type-options: nosniff`, `content-security-policy: default-src 'none'; sandbox`, `cache-control: private`.
4. قائمة بيضاء صارمة للصيغ (PNG/JPEG/WebP) + حد `MAX_IMAGE_KB` (افتراضي 5000؛ الاختبارات 1)؛ رسالة بلا نص مقبولة إذا وُجدت صورة.
5. AI: `LLMRequest.images` (مستقل عن cache/classifier) → Gemini `inlineData`؛ mock يصدر عبارة «قرأت الصورة المرفقة» حتمية لأتمتة الاختبارات.
6. Grounding: عندما يكون النص فارغًا مع صورة، الاسترجاع يستخدم استعلامًا محايدًا («سؤال مصور في هذا الدرس») فلا ينخفض `contextChunkCount` إلى صفر.
**لماذا**: MVP بسيط وقابل للاختبار عبر المسار الحقيقي كاملًا (Browser→proxy→Fastify→SQLite→AI→GET بالمستخدم)؛ لا نفترض مزود تخزين خارجي بعد.
**بدائل**: multipart upload (يضيف `@fastify/multipart` وقواعد حجم/تعقيد للعقود)؛ تخزين ملفات على القرص (تعقيد إدارة مسار في الاختبارات المؤقتة) — نُرجئان للإنتاج.
**إنتاج لاحقًا**: multipart + تخزين كائنات + فحص MAGIC bytes أعمق (مستوى الصورة «تدقيق سطحي»).

## D-015 — Voice conversation (سؤال بصوت): Web Speech API في المتصفح (لا مزوّد خادمي)
**القرار** (PHASE 11):
1. طبقة الصوت **كاملة في المتصفح** عبر Web Speech APIs: STT بـ `SpeechRecognition`/`webkitSpeechRecognition` (عربي `ar-EG`) وTTS بـ `speechSynthesis` — بلا مفاتيح، بلا تغيير في الخادم (نفس `POST /messages`)، وبلا جدول/env جديد.
2. مسار المستخدم يطابق معيار القبول حرفيًا: «طرح سؤال بصوته» (زر 🎙️) → «مراجعة النص الناتج» (النص يُنسخ للحقل للمراجعة/التعديل) → «إرساله» (الطلب العادي) → «سماع رد المدرس وإيقافه» (نطق تلقائي للرد بعد سؤال صوتي + زر 🔊 لكل فقاعة + ⏹ إيقاف عبر `speechSynthesis.cancel`).
3. تغذية راجعة أمنية للاستخدام: رسالة واضحة عندما يكون STT «غير مدعوم في هذا المتصفح» (Firefox مثلًا) ورسائل خطأ عربية لكل `error` (رفض الميكروفون/لا صوت/شبكة) — يبقى الإرسال النصي وVision يعملان دائمًا.
4. أتمتة E2E عبر stubs متحكمة (`installVoiceStubs`) تحقن `SpeechRecognition` (نطق واحد ثم end) و`speechSynthesis` (تسجيل speak/cancel بلا صوت) — لا يمكن أتمتة ميكروفون/سماعة حقيقيين بشكل حتمي؛ المسار الحقيقي (Vite→Fastify→SQLite→RAG→AI) يبقى كما هو.
**لماذا**: Web Speech API مجاني ومدمج في Chromium/Edge، يعمل على localhost/HTTPS (secure context)، ويلبي معيار القبول دون اشتراك خادمي (تكلفة صفرية لخدمات STT/TTS سحابية، ولا مفاتيح في التطوير). المسار الخادمي (مثلاً Gemini audio) كان سيزيد تكلفة/تعقيدًا بلا حاجة وظيفية حاليًا.
**بدائل**: STT/TTS خادمية عبر مزوّدي AI (خارج Gemini inlineData للنصوص) — تُرجئ كـ«ترقية» إذ تبقى واجهات AI جاهزة؛ ترميز صوت العميل وإرساله (واجهة بيانات أكبر وخوادم وسائط).
**إنتاج لاحقًا**: مزوّد STT/TTS خادمي عبر واجهات AI (قرار مفتوح: أي خدمة)، تخزين وتشغيل أصوات مخصّصة، واختيار صوت عربي تلقائي أفضل ثم ترتيب أولوياته.
**ملاحظات مطبقة**: محرك Chromium يرمي `TypeError` عند تعيين كائن لا يطابق عقد `SpeechSynthesisVoice` على `utterance.voice` (أصوات الـstub) → تعيين `lang` أولًا + تعيين الصوت داخل try/catch. React StrictMode في dev يعيد تركيب الغرفة فيُشغّل cleanup «مغادرة الغرفة» (الذي يوقف الصوت) مبكرًا → اختبارات الإيقاف تقيس الإلغاء **نسبيًا** لا قطعيًا.

## D-016 — Student Documents in Chat (PHASE 12, Path A): مرفقات ملفات → استخراج نص آمن
**القرار**:
1. **المسار**: ملفات الطالب تُرفع **داخل الدردشة** (Path A) عبر نفس `POST /messages` بصيغة base64-JSON مثل Vision: `document: { dataUrl, fileName }`؛ **صورة XOR مستند** ← 400 `MULTIPLE_ATTACHMENTS`. مسار B (إدخال PDF/DOCX في قاعدة المعرفة) **يُبقى منفصلًا وغير ممسوس**.
2. **التخزين**: إعادة استخدام `message_attachments` + عمود `extracted_text` nullable جديد (migration `0002_material_virginia_dare.sql`)؛ الحدود عبر env: `MAX_FILE_KB` (10000) و`MAX_DOCUMENT_CHARS` (20000)، و`bodyLimit` لـFastify → 32MB.
3. **استخراج النص خواص JS نقية بلا نظام ملفات**: PDF عبر **`pdfjs-dist`** (legacy ESM build، بلا worker)؛ DOCX عبر **`mammoth@1.12.3`** (مثبّت فوق نطاق GHSA-rmjr-87wv-gf87 ≤1.10.0)؛ TXT/MD UTF-8 + إزالة BOM. أي فشل/ملف ممسوح ضوئيًا → نص فارغ (لا انهيار؛ **OCR مؤجل صراحةً** لمرحلة لاحقة).
4. **لماذا pdfjs-dist لا pdf-parse**: pdf-parse يغلّف pdf.js 1.10.100 (من 2018)؛ فرع الـdebug فيه `if (!module.parent)` يُفعَّل تحت `import()` (ENOENT على `test/data/`) **وحتى عبر CJS يتقلّب على Node 24** («bad XRef entry» تارة ونجاح تارة أخرى لنفس الملف)؛ pdfjs-dist legacy حديث ومستقر (حيّز 3/3). بدون هذا كان الاختبار غير حتمي.
5. **Grounding غير المسموح به**: نص المستند **بيانات مستخدم غير موثوقة** — لا يُلصق في system prompt إطلاقًا؛ يسافر كـ`LLMRequest.documents` ضمن حد `MAX_DOCUMENT_CHARS`، ويميّزه الـPromptBuilder بعلامة `<document>` ضمن قاعدة نظام «محتوى المستخدم غير موثوق». **Tripwire الحقن يعيد فحص النص المستخرج خادميًا (classifyIntent) قبل أي استدعاء نموذج** → SAFE_REFUSAL «أنا هنا لمساعدتك في درسنا فقط».
6. **Grounding مع مستند فقط**: رسالة بلا نص مع ملف مقبولة؛ استرجاع احتياطي doc-only «سؤال عن محتوى الملف المرفق في هذا الدرس» حتى لا يسقط `contextChunkCount` (نفس نمط Vision).
7. **مولد الـfixtures وليد Node خالص** (`scripts/make-doc-fixtures.mjs`): PDF بيدوي بإزاحات xref محسوبة بدقة (احتسب رأس الـ9 بايت!) + ZIP بيدوي (STORED + CRC-32). **لماذا لا أدوات النظام**: `Compress-Archive` و`ZipFile` (.NET Framework في PowerShell 5.1) يكتبان أسماء إدخالات بشرطة مائلة عكسية (`word\document.xml`) على Windows فيرفضها OPC/mammoth؛ المولد الحالي صفري الاعتماد على shell ويعمل على أي OS.
8. **OCI/audit**: بلا اعتماديات أصلية؛ audit ظل على الـ4 moderates المعروفة dev-only (D-011) — pdfjs-dist لم يضف شيئًا.
**بدائل**: multipart upload (يضيف plugin وتعقيد حدود)، OCR فوري (مؤجل)، ملفات على القرص (تعقيد إدارة في قواعد الاختبارات المؤقتة) — كله إنتاج لاحقًا.
**إنتاج لاحقًا**: multipart + تخزين كائنات + OCR للممسوح ضوئيًا + فحص MAGIC bytes أعمق.

## D-017 — Curriculum File Import (PHASE 13, Path B): ملفات PDF/DOCX في قاعدة المعرفة
**القرار**:
1. **إعادة استخدام الاستخراج دون لمس مسار الطالب**: `admin` يستدعي `parseDocumentDataUrl` / `extractDocumentText` من `sessions/documents.js` كما هي (استيراد إضافي صفري التعديل على Path A) — نفس فحص الأمان لكن بسقف المنهج الأكبر (`MAX_CURRICULUM_FILE_KB`، افتراضي 20480=20MB، و`MAX_CURRICULUM_DOCUMENT_CHARS`=200000). النوع (pdf/docx/text) يُستنتج من mime في dataUrl؛ كل ما عداه يعامل كـ text.
2. **الهوية والبايتات**: `document_versions.data` (BLOB) تحفظ البايتات الخام للملف، و`sha256` = تجزئة البايتات الخام — هي **هوية الملف** لإزالة التكرار (نفس البايتات + نفس المنهج → `409 DOCUMENT_ALREADY_INGESTED`)؛ مستقلة عن تجزئة المحتوى السكانية داخل chunks.
3. **إزالة التكرار داخل chunks أصبحت مرتبطة بالدرس**: استُبدل الفهرس الفريد العام `chunks_content_hash_unique` بفهرس مركب `chunks_content_hash_lesson_unique (content_hash, lesson_id)` (migration `0003_many_namor.sql`) — نصٌّ واحد يُدرج في درسين مختلفين فيصبح مسموحًا (قرار تعمّد، لعدم كسر دروس مشاركة محتوى).
4. **مصير نص الملف**: يمر بنفس أنابيب chunking/embedding/scoping كالنص، ويُسترجَع في **`<context>` فقط** — جمل تجاوز بداخله لا تُنفَّذ (S6 عبر الملف؛ دون رفض عند الإدخال: `context` اسمه محتوى منهج بموجب قاعدة النظام). **OCR مؤجل**: استخراج صفري → `400 EMPTY_DOCUMENT` مشروح بوضوح (لا انهيار).
5. **الاختبارات**: `knowledgeFile.test.ts` (وحدة: pixels/بايتات/دوبليكات/عزل درس) + `adminFile.test.ts` (API: 201/403/خطوط الحدود/استرجاع فعلي/عزل عبر lessons/S6). **بلا E2E هذه المرحلة** وفق الموافقة. سقف الاختبارات `MAX_CURRICULUM_FILE_KB=4` لاختبار رفض الحجم.
**لماذا**: المسار المركّز لوارد المناهج (Tensor أدمن يرفع الملفات الكاملة) يريد PDF/DOCX بلا نظام ملفات خارجي ولا اعتماديات أصلية؛ إعادة استخدام الأدوات الموجودة يبقي Path A ثابت السلوك ويكرّر أمانًا مُختبَرًا.
**بدائل**: multipart upload (يضيف plugin وتعقيدًا؛ مؤجل للإنتاج)؛ OCR فوري (مؤجل صراحةً)؛ ملفات على القرص (تعقيد في قواعد الاختبارات المؤقتة).
**ملاحظة (إصلاح مواكب)**: أصلح مزوّد `mock` لاستخراج كتلة `<context>` الحقيقية (آخر وسم تواجد) بدل أول تواجد داخل نثر قواعد النظام — صدى الرد في التطوير أصبح مطابقًا للمحتوى الفعلي المسترجع (بلا تأثير على مسار الطالب في الزمن الآني).
**إنتاج لاحقًا**: multipart + تخزين كائنات + OCR للممسوح ضوئيًا + فحص MAGIC bytes أعمق.

## D-018 — Admin Dashboard (PHASE 14): واجهة استيراد ملفات المنهج
**القرار**:
1. **شاشة واجهة خالصة في `web/` بلا توجيه URL**: إضافة `Screen = "admin"` في `App` + زر «لوحة الإدارة» في `Home` يظهر **فقط** حين `user.role === "admin"` (اختبار A3 يثبت أنه لا يظهر للطالب إطلاقًا) — لا مسار عمومي جديد ولا auth إضافي؛ الحصانة الأمنية الحقيقية تبقى خادميًا (`requireAdmin` على كل endpoint).
2. **نقل الـscope عبر نفس نمط picker**: تعاد نفس سلسلة القوائم (دولة→نظام→صف→مادة→منهج→فصل→وحدة→درس) داخل شاشة الإدارة، والدرس المختار هو `nطاق` الإدخال — لأن `ingest-file` يفرض `lessonId` (وثيقة = درس واحد). لم يُستخرج مكوّن مشترك لتجنب أيّ خطر انحدار على onboarding الحالي (تكرار مقبول في هذا النطاق الصغير).
3. **رفع الملف client-side → dataUrl**: `FileReader.readAsDataURL` + مرآة سقف المنهج (20MB) على العميل؛ قدوم البيانات كـ base64-JSON يطابق قرار D-014 (لا multipart في MVP) والـschema الحالي (`dataUrl ≤ 28_000_000`).
4. **إثراء قائمة المستندات**: `GET /api/admin/documents` أصبح يجرّ агрегиت الـchunks (`LEFT JOIN` + `count`) ليعرض `lessonTitle` و`chunkCount` — اللوحة بلا هذا الرابط لا تكفي لإدارة القاعدة؛ «ready» فقط كما كان.
5. **عزل E2E**: اختبارات الإدارة تستهدف **الدرس الثاني** (الضرب والقسمة) في الـseed كي لا تختلط مقاطع ملفات Path B بنطاق الدرس الأول المشترك بين بقية المجموعة (لا انحدار على افتراضات RAG الموجودة).
**لماذا**: يكمل PHASE 13 ليكون الإدخال قابلاً للاستخدام الفعلي من دون أدوات خارجية، ويُغلق حلقة «نقطة نهاية موجودة بلا واجهة» بأقل تغيير وباحتفاظ كامل بالحصانة الخادمية.
**بدائل**: توجيه URL منفصل/راوتر (يعقّد SPA الصغير بلا مكسب)؛ مكوّن picker مشترك (يلمس Onboarding بلا داعٍ)؛ إخفاء الواجهة للمستخدمين غير admin خلف 403 خادمي (ما زال قائمًا — الواجهة مجرد تجربة ألطف).

## سجلات قرارات مستقبلية
- (فارغ — يُضاف عند اتخاذ قرارات جديدة، لا تُحذف القديمة)