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

## سجلات قرارات مستقبلية
- (فارغ — يُضاف عند اتخاذ قرارات جديدة، لا تُحذف القديمة)