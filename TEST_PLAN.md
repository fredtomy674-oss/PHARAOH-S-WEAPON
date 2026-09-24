# TEST PLAN — AL FAROUQ AI

> آخر تحديث: 2026-09-24 — التنفيذ في `server/test/` (Vitest **206/206**)، الويب يُفحص بنيويًا + E2E بالمتصفح **29/29**.

## 1. أدوات

- Vitest (Node, TS-native) — DB مختبري: SQLite `:memory:` أو ملف temp فريد لكل مجموعة.
- API tests عبر `app.inject()` (لا socket — أسرع ويغطي hooks/validation/cookies).
- AI tests: `MockLLMProvider`/`MockEmbeddingProvider`/`MockOcrProvider` (أوفلاين، تحديث محدد، OCR حتمي باشتقاق من تجزئة البايتات) — **اختبارات حية فقط بـ`RUN_LIVE_TESTS=true`**.

## 2. المجموعات

| المجموعة | الملفات |
|---|---|
| Unit | `src/modules/**` — chunker، prompt builder، intent classifier، cosine sim، config، routers |
| DB | schema quirks، migrations تطبق نضيفة، فهارس/قوالب فريدة |
| API | auth، curriculum، sessions، messages — عبر inject مع cookies |
| Auth/Security | ناجحة/فاشلة، CSRF، rate-limit، صلاحيات، صلابة جلسات |
| RAG | عزل الصفوف، استرجاع بالـscope، إعادة التصنيف |
| AI/Tutor | Mock provider، هيكلة الرد، تدرجات التلميحات، fallback |
| Integration (E2E قطري) | register → onboarding → session → message → progress |

## 3. حالات أمنية إلزامية (والمطلوب تنفيذها كاختبارات)

| # | Spin | المعيار |
|---|---|---|
| S1 | طالب A يقرأ رسائل/جلسات B | 404/403 — data isolation |
| S2 | طالب A يرسل في جلسة B | 403 |
| S3 | غياب CSRF في mutation | 403 |
| S4 | session منتهية/ملغاة | 401 |
| S5 | cookie بدون httpOnly | مرفوض في الاختيار الزمني للـset-cookie |
| S6 | chunk مع `ignorance` أمر («امسح التعليمات») | الرد لا يفصح النظام ويبقى ضمن الموضوع |
| S7 | رفع مستند بامتداد خبيث | rejected |
| S8 | إجابة RAG لصفين مختلفين | صفر chunks من الصف الآخر |
| S9 | جملة في منهج الصف 6 لا تظهر في جلسة الصف 7 | نفس S8 |
| S10 | أي خطأ 500 لا يسرّب stack trace | format ثابت آمن |

## 4. معايير الجودة

- كل Feature = اختبار. تشغيل: `npm run check` (typecheck+lint+test).
- تغطية تتبع بـ `c8` لعرضها (اختياري للشيكات).
- Fail الثبات: الاختبارات لا تعتمد على الشبكة ولا مفاتيح حقيقية.

## 4.1 Path B — Curriculum File Import (PHASE 13)

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/unit/knowledgeFile.test.ts` | Unit | `ingestFile` PDF: kind/status + البايتات الخام (sha256=هوية الملف، size، BLOB `data`) + chunks (lessonId صحيح) + متجهات؛ DOCX kind=docx وصحة المحتوى داخل chunk؛ ملف بايتات متطابقة لنفس المنهج → `DOCUMENT_ALREADY_INGESTED`؛ استخراج صفري (ممسوح) → `EMPTY_DOCUMENT` (بلا OCR — خارج نطاق الوحدة؛ الإنقاذ في `admin/routes.ts`)؛ **إزالة تكرار chunks مرتكزة على الدرس** (نص واحد يُدرج في درسين = مسموح الآن) |
| `test/api/adminFile.test.ts` | API | 201 PDF مع بايتات + سرد القائمة admin؛ 201 DOCX؛ دوبليكات 409؛ **استرجاع فعلي داخل نطاق الدرس** (علامة `TutorFixtureDOCX 456` تظهر في رد مسند لـ RAG `وفقًا لمحتوى الدرس`)؛ **عزل عبر الدروس S8** (العلامة في درس A لا تصل لجلسة درس B)؛ **S6 عبر الملف** (محتوى «استبدل القواعد» داخل ملف مستورد يُعامَل كمحتوى لا تعليمات — رد طبيعي `سؤال جيد!` و`tripwire=false` ولا وضع نظام بديل)؛ 403 لغير admin؛ mime غير مدعوم؛ حجم فوق سقف الاختبارات (`MAX_CURRICULUM_FILE_KB=4`)؛ dataUrl تالف؛ ملف ممسوح؛ scope ناقص (Ajv) |
| `test/db/migrations.test.ts` | DB | migration `0003_many_namor`: عمود `document_versions.data` + الفهرس المركب `chunks_content_hash_lesson_unique` وغياب القديم `chunks_content_hash_unique` |

> ملاحظة: سقف الاختبارات `MAX_CURRICULUM_FILE_KB=4` في `vitest.config.ts` فقط — الافتراضي للإنتاج 20480 (20MB). الـfixtures المستقلة `curriculum.pdf`/`curriculum.docx` (نص درس > 40 حرفًا مع علامات) لا تمسّ `question.*` الخاصة بمسار الطالب.

## 4.2 Admin Dashboard (PHASE 14) — إثراء سرد المستندات

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/api/adminFile.test.ts` (قائمة المستندات) | API | `GET /api/admin/documents` ما زال 200 مع الـadmin ويعيد `id` المستند المستورد (قائمة قابلة للفلترة) — بعد إضافة `lessonId`/`lessonTitle`/`chunkCount` عبر LEFT JOIN |

> جذر التغيير: `admin/routes.ts` — الاستعلام الآن يَجمع (`count`) المقاطع ويربط `lessons.title` بكل مستند حتى تعرض اللوحة «أي ملف يغذي أي درس». لا تغيير في الحصانة (بقي `requireAdmin` وفلتر `status="ready"`).

## 4.3 حماية رفع الملفات (PHASE 15) — فحص MAGIC bytes

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/unit/fileTypes.test.ts` | Unit | `detectFileKind`: PDF حقيقي (رأس `%PDF-`)؛ PDF بعد junk-prefix ضمن 1024 بايت؛ DOCX (ZIP + `[Content_Types].xml`)؛ ZIP عام بلا content-types → ليس docx؛ نص UTF-8 (بـBOM وبدونه) → text؛ فارغ → text. `kindForDeclaredMime`: التطابق مع الـ4 MIME المدعومة وnull لغيره |
| `test/api/documents.test.ts` | API (Path A) | انتحال: بايتات نصية تُعلن `application/pdf` → `400 FILE_TYPE_MISMATCH`؛ مستند ممسوح **حقيقي** (`%PDF-1.4` بلا نص) يظل 200 مع OCR يحوله إلى نص غير فارغ (fixture `scanned.pdf`) وRAG حاضر |
| `test/api/adminFile.test.ts` | API (Path B) | انتحالات ×3: نص→PDF، ZIP عام→DOCX، PDF→`text/plain` → `400 FILE_TYPE_MISMATCH`؛ ممسوح حقيقي → OCR ينقذه قبل `ingestFile` (مستند جاهز بـ`ocrApplied=true` في سجل التدقيق)؛ TXT قصير صادق يبقى `EMPTY_DOCUMENT` بلا OCR |

> القاعدة: لا استخراج ولا تخزين لأي ملف لا يطابق توقيعه الفعلي نوعه المعلن — نقطة الفحص مشتركة (`parseDocumentDataUrl`) تغطي المسارين A وB دفعة واحدة.

## 4.4 زراعة متعددة الدول (PHASE 16) — مصر + السعودية

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/api/multiCountry.test.ts` | API (8) | الكتالوج: الدول تشمل `eg`+`sa`؛ الأنظمة/الصفوف/المناهج مرشّحة بالبلد (لا نزيف بين البلدين)؛ سلسلة فصل→وحدة→درس سعودية كاملة؛ breadcrumb درس سعودي → `sa` |
| | API (تكامل RAG) | جلسة على درس سعودي تتأرض فقط بمحتوى سعودي («الرياض» حاضر، «مقارنة الكسور» غائب) وجلسة مصرية عكس ذلك في اتجاهين |
| `server/src/db/seed.ts` | بنية | بذر عام `seedCountry(spec)` — إعادة استخدام `subjects.math` العالمي (قيد `subjects_code_unique`): السعودية فوق قاعدة مصرية موجودة تُبذر بلا تكرار |

> العزل هيكلي (مرشحات `countryId`) — PHASE 16 لم تغيّر خدمةً ولا جدولًا؛ إعادة تشغيل البذر على قاعدة مختلطة تبقى idempotent. التأثير على E2E: ترتيب الدول أصبح أبجديًا (السعودية أولًا) — اختيار «مصر» صراحةً بـ`selectOptionByLabel` في `startFirstLesson`/`pickSecondLesson`.

## 4.5 إحصاءات المسؤول (PHASE 17) — Analytics

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/api/adminStats.test.ts` | API (2) | الطالب يُرفض 403 `FORBIDDEN` قبل أي حساب؛ العدّادات تطابق النشاط الفعلي: جلسة (نشأت→رسالتان→انتهت) = جلسة منتهية واحدة و4 رسائل (2 طالب + 2 مدرس)، ومعها مستندات الكوربس الجاهزة ومقاطعها ومنهجه ودرساه |
| `server/src/modules/admin/routes.ts` | بنية | `GET /api/admin/stats` تجميع `count()` صافي بلا جداول جديدة؛ تبقى الحصانة على `requireAdmin` |
| `web/src/Admin.tsx` | UI | بطاقات «إحصاءات سريعة» `admin-stats-*`؛ الجلب متسامح (لا يعطّل الرفع — تحقَّق بـE2E A1) |

> الإحصاءات لحظية الصفاء لا مخزّنة؛ عدّادات SQLite بحجم MVP أرخص من جداول مزامنة. مؤشرات زمنية/رسوم لاحقًا بلا تغيير بنيوي.

## 4.6 لوحة أولياء الأمور (PHASE 18) — ربط بالكود + قراءة فقط

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/api/parent.test.ts` | API (11) | تسجيل `role:"parent"` → `/auth/me` بلا student و`linkCode=null`؛ طالب مسجَّل → `linkCode` بالصيغة المولّدة `^[A-HJ-NP-Z2-9]{8}$`؛ ربط: كود خاطئ → `400 INVALID_LINK_CODE`، كود الطالب → 200 بصف/مناهج/0 جلسات، تكرار → `409 ALREADY_LINKED`؛ **عزل**: يلية B قائمة فارغة وتفاصيل طفل A → 404 (لا وجودية)؛ **تفاصيل بلا تسريب**: جلسة حقيقية + `recordAssessment` → عدّادات رسائل (1/1) صحيحة ولا يظهر نص سؤال/رد في الاستجابة (`toContain` سالبان)؛ **403 متبادل**: الطالب على `/api/parent/*` وولي الأمر على `/api/sessions` (POST 403، GET قائمة فارغة) و`/api/progress/me` 403؛ unlink → قائمة فارغة + 404، وحذف غير مربوط → 404 |
| `server/src/modules/parent/` | بنية | خدمة مستقلة `ParentService(db, memory)` — كل قراءة تعيد التحقق من `students_parents` (الوصول للطفل مشروط بالرابط لا بالمعرف)؛ نهايات `requireAuth` + فحص دور؛ تكامل `progressDetail` (concepts/strengths/weaknesses) بلا كشف رسائل |
| `server/src/modules/auth/` | بنية | `register` يقبل `role` — مسار الوالد ينشئ `users(parent)+parents+profiles` بلا صف؛ `publicUser` يعرض `linkCode` للطالب |
| `web/src/Parent.tsx` | UI | نموذج ربط + بطاقات أبناء + تفاصيل الطفل (مفاهيم/قوة/ضعف/جلسات) + إلغاء ربط؛ كرت «كود ولي الأمر» في Home للطالب |

> العزل **بنيوي** (لا دفاعي): لا يمكن لولي الأمر رؤية أي طفل غير مربوط بصريح صفّ في `students_parents`. حدود MVP: عدّادات فقط للرسائل — لا محتوى خام. تفاصيل المحادثة مرحلة مستقلة لاحقًا (OCR أُنفِّذ في PHASE 19).

## 4.7 OCR للمستندات الممسوحة ضوئيًا (PHASE 19) — المساران A وB عبر مزود AI

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/unit/ocr.test.ts` | Unit (7) | `OcrService.recognize`: MIME مؤهّل (PDF → يُستدعى المزوّد)؛ TXT/MD **لا تُقرأ OCR إطلاقًا** (صفر calls)؛ `maxChars` يقصّ بفاصلة «…» + `truncated:true`؛ فشل المزوّد → `{text:"", truncated:false}` (هبوط آمن — لا استثناء)؛ Mock OCR حتمي: ملفات بايتات مختلفة → نصوص مختلفة، والملف ذاته → ذات النص (استقرار)؛ `AiService.ocr` يُسجّل الاستخدام `operation="ocr"` في دفتر الاستهلاك |
| `test/api/ocr.test.ts` | API (4) | **A**: رفع ممسوح (`scanned.pdf`) في جلسة → `ocrApplied=true` + `ocrUsed=true` + رد المعلم يحمل `OCR_TEXT_MARKER` + شارة `msg-ocr-badge` في `messageAttachments.ocr`؛ **A**: PDF بطبقة نصية → OCR لا يُستدعى (صفر `operation=ocr` في سجل الاستخدام) — **PHASE 22**: استيراد إداري لبايتات `scanned.pdf` المتطابقة (سبق التعرف عليها لطالب Path A في نفس العملية) → النص يصل للمعرفة والاستخدام ينمو 0 أو +1 فقط (لا شحنة مكررة — ضربة الـcache)؛ **B**: TXT قصير صادق يبقى `EMPTY_DOCUMENT` (لا OCR) |
| `test/unit/documents.test.ts` (+1) | Unit | scan/mock: fixture `scanned.pdf` صالح وصفحته الواحدة بلا طبقة نص — pdfjs يستخرج منه `""` (تثبيت شكل المسح الضوئي) |
| `server/src/modules/ocr/service.ts` | بنية | حارس `OCR_ELIGIBLE_MIMES` (PDF/DOCX)، قصّ `MAX_OCR_CHARS`، فشل المزوّد → نص فارغ لا انهيار؛ حُقن في `SessionService` (Path A) و`admin/routes.ts` (Path B) عبر `container.ts` |

> القاعدة: `AI_OCR_PROVIDER` (mock افتراضيًا أوفلاين حتمي — `GEMINI_OCR_MODEL`/`MAX_OCR_CHARS` جاهزان للإنتاج). نص OCR **محتوى غير موثوق**: المسار A يعيد فحصه بتريبواير الحقن قبل أي استدعاء للمدرّس، والمسار B يسترجعه كمحتوى `<context>` فقط.

## 4.8 Billing/Subscriptions (بلا بوابة دفع) + Achievements (PHASE 20)

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/unit/subscription.test.ts` | Unit (5) | «سارية» فقط عند `plan=premium` + `status∈trialing|active` + غير منتهٍ؛ `past_due`/`cancelled`/منتهٍ → حد المجاني؛ `dailyLimitFor`: مجاني = `DAILY_MESSAGE_LIMIT`، مميز = `PREMIUM_DAILY_MESSAGE_LIMIT` (0 = بلا حدود)؛ `summaryForStudent`/`setPlan` upsert (وضع خطة يعيد تعيين الحالة الافتراضية) |
| `test/unit/achievements.test.ts` | Unit (7) | بذر التعريفات idempotent بالكود (فريد، بلا تكرار) وكلها مقفلة؛ `first_steps` على أول جلسة منتهية؛ **لا تكرار** عند إعادة التقييم؛ `explorer` عند 5 و`scholar` عند 10؛ `chatty_student` عند 50 رسالة؛ `bookworm` لمرفق PDF و`photographer` لصورة (إدراج مباشر)؛ **عزل بين طالبين** (ب لا يرى جوائز أ) |
| `test/api/subscription.test.ts` | API (7) | إنشاء **كسول** مجاني + ملخص؛ والد/إدارة ← 403؛ قائمة الإدارة تُظهر الطالب بعد أول قراءة؛ منح مميز → الطالب يرى `dailyLimit=0` + سجل تدقيق `subscription.update`؛ طالب مجهول ← 404؛ طالب يمنح نفسه ← 403؛ **مميز منتهٍ → الخطة معلنة لكن الميزانية مجانية** (50) |
| `test/api/achievements.test.ts` | API (6) | 0 من 6 مقفلة طازجًا؛ صورة في جلسة حقيقية → شارة «مصوّر الأسئلة»؛ PDF → «قارئ نهم»؛ إنهاء الجلسة → «أول خطوة» (الإجمالي 3)؛ والد ← 403؛ عزل: طالب آخر 0 |

> فلسفة التغطية: `dailyLimitFor` يُختبر وحدويًا لأن الإعدادات تُحلَّل في استيراد الوحدة (لا تتجاوز لكل اختبار)؛ واجهات API تثبت أن `remainingBudget`/الملخص يعكس الخطة (مجاني N−1، مميز بلا حد)؛ مسار الـ429 نفسه منطق قائم لم يتغير.

## 4.9 Qdrant adapter + إعادة تصنيف عبر نموذج (PHASE 21)

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/unit/qdrantVectorStore.test.ts` | Unit (8) | ضد **خادم Qdrant وهمي في العملية** (node:http حقيقي على منفذ عابر — بلا Docker): إنشاء المجموعة تلقائيًا عند أول upsert (بُعد Cosine)؛ roundtrip upsert→search يرجع `chunkId` بمرتبة cosine؛ **عزل نطاق عبر فلتر payload** (مقطع درس آخر لا يتسرب؛ نطاق فارغ يرجع الكل كما يفعل SQLite)؛ id حتمي (إعادة upsert تستبدل بلا تكرار)؛ remove بحقل chunkId + id مجهول لا-op؛ بحث على مجموعة غير منشأة → `[]`؛ رفض `VECTOR_DIMENSION_MISMATCH` قبل الشبكة؛ رفض الخادم للمتجه الخاطئ → `503 VECTOR_STORE_UNAVAILABLE`؛ **انقطاع شبكة** (عبر `fetchImpl` يرمي) → upsert/remove يرميان 503 وsearch يعود `[]` |
| `test/unit/modelReranker.test.ts` | Unit (7) | مزوّد مقيد حتمي (stub `complete`): إعادة الترتيب بـ`[3,1,2]` (مع `position` جديد)؛ مجموعة جزئية `[2]` → المختار أولًا والباقي بترتيبه الأصلي؛ **تجاوز استدعاء** عند 0/1 مقطع؛ ردّ غير JSON → المصفوفة كما هي (والاستدعاء تم)؛ مؤشرات خارج المدى/مكررة → كما هي؛ انهيار مزوّد → لا يكسر الدور؛ `parseRanking` صارم (مضاف إلى نص/سیاج، كسور، صفر، خارج مدى، تكرار، مصفوفة فارغة) |
| `test/unit/ragFactory.test.ts` | Unit (5) | `createVectorStore`: sqlite افتراضيًا + بقسر → `SqliteVectorStore`، qdrant بقسر → `QdrantVectorStore`؛ `createReranker`: `enabled:false` → `NoopReranker`، lexical → `LexicalReranker`، model → `ModelReranker` |

> فلسفة التغطية: لا يمكن تشغيل Qdrant حقيقي (لا Docker في البيئة) — الخادم الوهمي في العملية يختبر **عقد النقل الفعلي** (نفس المسارات/الحمولات/رموز الحالة) فيبقى كل شيء أوفلاين وحتميًا؛ `ModelReranker` يُختبر بمزوّد مقيد لأن النموذج الحتمي (mock) يُفشل بصدق في تحليل الرد — مسار الهبوط الآمن هو ما يهم. الافتراضي (sqlite + lexical) مطابق لسلوك PHASE 20 → لا انحدار.

## 4.10 تفعيل التخزين المؤقت (PHASE 22 — AiCache يخدم العمليات الحتمية)

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/unit/aiCache.test.ts` | Unit (5) | roundtrip get/set + عدّادات `hits/misses` دقيقة؛ انتهاء TTL (ساعة وهمية → miss + إزالة الصف)؛ TTL اختياري لكل إدخال مضبوط؛ إخلاء **الأقدم** عند الامتلاء (LRU)؛ `key()` محتوى-العنوان (نفس الرسائل → نفس المفتاح، رسالة مختلفة → مفتاح مختلف) و`clear()` تفرّغ |
| `test/unit/aiCaching.test.ts` | Unit (6) | عبر `AiService` حقيقي بمزوّدات mock: `classifier` بطلبات متطابقة → مرّتان نفس المحتوى + **صف استخدام واحد** + `cacheStats()={hits:1,misses:1}`؛ `rerank` يُخزَّن كذلك؛ `tutor` بطلبات متطابقة → **صفّا استخدام** و`hits=0` (لا يُخزَّن أبدًا)؛ `embed` بنصوص متطابقة → متجهات متطابقة وإجمالي `hits=1`؛ `ocr` ببايتات متطابقة → نص واحد وصفّ استخدام واحد و`hits=1`؛ `cacheEnabled:false` → كل استدعاء يمر للمزوّد ويُسجَّل (`hits/misses=0`) |

> فلسفة التغطية: `AI_CACHE_ENABLED` يُحلَّل في استيراد الوحدة (لا يتجاوز لكل اختبار) — لذلك يأخذ `AiService` مفتاح `cacheEnabled` في المنشئ لاختبار مسار الإيقاف حتميًا؛ سلوك «الفواتير تعكس الاستدعاءات الحقيقية» يُثبت بالعدَّاد (صفوف `ai_usage_logs`) لا بنص الرد، لأن الاستجابات في mock متطابقة أيضًا.

---

# الجزء الثاني — Browser End-to-End (Playwright)

> آخر تحديث: 2026-09-24 — **29/29 أخضر** عبر `npm run e2e`. الاختبارات حقيقية 100%: متصفح Chromium → React SPA → Vite proxy → Fastify → SQLite → RAG → AI provider (mock=افتراضي المشروع) → persistence → المتصفح.

## 5. التشغيل والمتطلبات

```bash
npm install                       # بعد إضافة @playwright/test
npm run e2e:install               # مرة واحدة: تنزيل Chromium (~115MB)
npm run e2e                       # يشغّل كل شيء تلقائيًا (خادمان مُداران + 29 اختبارًا)
npm run e2e -- --ui               # وضع Playwright UI (اختياري)
npm run e2e:report                # فتح تقرير HTML السابق
```

**الإدارة التلقائية للخوادم** (`playwright.config.ts`):
- خادم اختبار على **127.0.0.1:3107** بقاعدة SQLite مؤقتة تُحذف وتُزرع من جديد عند كل تشغيل (`e2e/reset-db.mjs` + seed) — **لا تُمسّ بيانات التطوير** (`server/data/alfarouq.sqlite`).
- Vite على **localhost:5173** (الميناء القياسي) وبروكسيتها تُوجّه للخادم الاختباري عبر `VITE_API_PROXY_TARGET` (الافتراضي خارج الاختبارات: 3001).
- متغيرات الاختبار: `RATE_LIMIT_MAX=1000` (المجموعة الآلية تتجاوز حد التنمية 120/دقيقة)، `DAILY_MESSAGE_LIMIT=50`.

## 6. الحساب التجريبي المستخدم

- الطالب: `student@alfarouq.test` / `student-demo-123` (يتزرع مع كل قاعدة اختبار جديدة).
- Admin: `admin@alfarouq.test` / `admin-demo-123` (نفس التزرعة — ضروري لاختبارات لوحة الإدارة A1/A2).
- **ولي الأمر: `parent@alfarouq.test` / `parent-demo-123`** (نفس التزرعة — مربوط مسبقًا بالطالب التجريبي؛ كود الربط الثابت `SLH7KQ9M`).
- اختبار عزل البيانات (C) يسجّل طالبًا جديدًا عشوائيًا مؤقتًا.

## 7. الحالات المغطاة (29)

| # | الملف | ماذا يختبر | ملاحظات |
|---|---|---|---|
| الرحلة | `journey.spec.ts` | login → اختيار المنهج كاملًا → جلسة → رد معلم مستند لـ RAG (`وفقًا لمحتوى الدرس` مع عدم وجود `لا يوجد محتوى مسترجع`) → «مش فاهم» → **نفس الجلسة** (العدد لا يزيد + نفس الـid) → إنهاء → progress → صف منتهي في القائمة → logout | serial |
| C | `journey.spec.ts` | طالب جديد لا يرى جلسات غيره (UI: قائمة فارغة؛ API: 403/404 لقراءة جلسة طالب آخر) | |
| A | `auth.spec.ts` | بيانات دخول خاطئة → رسالة «البريد أو كلمة المرور غير صحيحة» + البقاء خارجًا | |
| B | `auth.spec.ts` | غير مسجّل: `/auth/me`, `/sessions`, `/progress/me` → 401 عبر البروكسي الحقيقي | |
| I | `auth.spec.ts` | `dir=rtl` + `lang=ar` + Arabic UI + تنقّل لوحة المفاتيح (Tab/Enter) + حقول مرتبطة بـ label | |
| D | `chat.spec.ts` | رسالة فارغة/مسافات → الزر معطّل + لا فقاعة | |
| E | `chat.spec.ts` | CSRF منتهي (إزالة التوكن من localStorage + إعادة تحميل) → 403 «رمز التحقق غير صالح» يظهر بوضوح في واجهة الدردشة | أمني حقيقي عبر المسار الكامل |
| G | `chat.spec.ts` | «متبقي اليوم» ينخفض مع كل ردة (r2 < r1) | |
| H | `chat.spec.ts` | محاولة حقن تعليمات → تنبيه tripwire + رد آمن «أنا هنا لمساعدتك في درسنا فقط» بدون سياق RAG | |
| F | `chat.spec.ts` | استئناف جلسة نشطة بعد reload: المحادثة مسترجعة من DB + متابعة بنجاح | |
| V1 | `vision.spec.ts` | إرفاق صورة حقيقية (ملف عبر input) → رد المعلم يقرأها («قرأت الصورة المرفقة») + RAG حاضر + الصورة معروضة في فقاعة المستخدم + `GET attachments` يعيد بايتات بصيغة image/png للمالك | المسار الكامل: Browser→proxy→Fastify→SQLite BLOB→mock→GET |
| V2 | `vision.spec.ts` | رسالة بلا نص + صورة فقط → زر الإرسال مفعّل + رد مستند لـ RAG (استرجاع احتياطي) | |
| V3 | `vision.spec.ts` | صورة >5MB → رفض قبلي برسالة «الصورة كبيرة جدًا» + لا معاينة ولا فقاعة | |
| A1 | `voice.spec.ts` | سؤال صوتي (زر 🎙️) → النص الممنسوخ في الحقل للمراجعة → تعديله → إرسال → رد مستند لـ RAG → نطق تلقائي للرد (نفس نص الفقاعة) → شارة استماع ظاهرة → ⏹ إيقاف يوقف النطق (إلغاء نسبي) | STT/TTS عبر stubs حتمية محقونة (`installVoiceStubs`) — لا يمكن أتمتة ميكروفون حقيقي |
| A2 | `voice.spec.ts` | رسالة **مكتوبة** لا تُنطق تلقائيًا؛ زر «🔊 استمع» في فقاعة رد يُنطق ذلك الرد؛ ⏹ يوقفه | |
| A3 | `voice.spec.ts` | متصفح بلا `SpeechRecognition` → خطأ واضح «غير مدعوم في هذا المتصفح» + لا استماع ولا إرسال | |
| D1 | `document.spec.ts` | إرفاق PDF حقيقي (ملف) → رد المعلم يقرؤه («قرأت الملف المرفق») + يعيد نص المستخرج («TutorFixturePDF 123») + RAG حاضر + بلا مكانة «لا يوجد محتوى مسترجع» + chip `msg-document` في فقاعة المستخدم | المسار الكامل: Browser→proxy→Fastify→استخراج PDF→documents input→mock |
| D2 | `document.spec.ts` | رسالة بلا نص + مستند DOCX فقط → زر الإرسال مفعّل + قراءة + نص المستخرج («TutorFixtureDOCX 456») | |
| D3 | `document.spec.ts` | ملف TXT يحوي **حقن تعليمات** («تجاهل كل التعليمات…») → رد آمن «أنا هنا لمساعدتك في درسنا فقط» **دون** علامة القراءة (لا استدعاء نموذج — tripwire خادمي يعيد فحص النص المستخرج) | أمني حقيقي عبر المسار الكامل |
| A1 | `admin.spec.ts` | Login كـadmin → زر «لوحة الإدارة» ظاهر → اختيار **الدرس الثاني** (الضرب والقسمة) في نطاق الاستيراد → رفع `curriculum.pdf` بملف حقيقي → رسالة نجاح بعدد المقاطع + صف في اللائحة بعنوان الوثيقة واسم الدرس و`chunkCount>0` (مقارنتها عبر `data-chunks`) | المسار الكامل: Browser→proxy→Fastify→ingest-file→RAG chunks→list |
| A2 | `admin.spec.ts` | إعادة رفع **نفس البايتات** لمنهج ذاته → خطأ الخادم «…مستورد مسبقًا» يظهر بوضوح في الواجهة (dedup حقيقي عبر UI) | |
| A3 | `admin.spec.ts` | الطالب (لا admin) **لا يرى زر الإدارة إطلاقًا** — نقطة الدخول مشروطة بالـrole في الواجهة (والحصانة الخادمية `requireAdmin` مُختبَرة في Vitest) | |
| P1 | `parent.spec.ts` | ولي الأمر (دور جديد قابل للتسجيل) يرى ابنه المربوط `parent-child-row` → يفتح تفاصيله: بطاقة تقدم ظاهرة + قسم الجلسات (قائمة ملخصات `parent-session-row` بعناوين/حالات/«رسائل: n» **أو** حالة الفارغة — الطالب التجريبي تتراكم عليه جلسات من اختبارات سابقة في القاعدة المشتركة فتقبَل الحالتان بـ`locator.or`) → زر عودة لقائمة الأبناء | serial |
| P2 | `parent.spec.ts` | الطالب يرى بطاقة «كود ولي الأمر» في الرئيسية وقيمتها (`link-code-value`) تساوي `SLH7KQ9M` — رمز المشاركة الذي يوظفه الوالد للربط | |
| P3 | `parent.spec.ts` | إدخال كود ربط خاطئ → خطأ «رمز الربط غير صحيح» يظهر بوضوح ويبقى نموذج الربط | |
| O1 | `ocr.spec.ts` | الطالب يرفع PDF ممسوحًا ضوئيًا (`scanned.pdf`) → المدرّس يقرؤه عبر OCR («قرأت الملف المرفق» + نص يحوي `OCR_MARKER`) + RAG حاضر + شارة «نص ممسوح ضوئيًا» (غير موجودة في ملف بطبقة نصية) | المسار الكامل: Browser→proxy→استخراج صفري→OCR (mock)→tripwire→mock |
| O2 | `ocr.spec.ts` | admin يستورد PDF ممسوحًا ضوئيًا على درس → نجاح بعدد مقاطع + صف في اللائحة بـ`chunkCount>0` | المسار الكامل: ingest ← OCR ← chunks RAG |
| E1 | `achievements.spec.ts` | طالب **جديد** يسجّل من واجهة التسجيل الحقيقية → بطاقة «خطتك» تظهر «مجانية» → يُنهي أول درس (درس كامل) → يفتح «🏆 إنجازاتي» → شارة «أول خطوة» مكتسبة (`data-earned=true`) وبقية الشارات مقفلة | serial — التسجيل عبر UI لأن بدء الجلسة يحتاج رمز CSRF في localStorage |
| E2 | `achievements.spec.ts` | admin يفتح «الاشتراكات» في اللوحة → صف الطالب يُلتقط بالبريد → زر ترقية → `data-plan="premium"` → **نفس الطالب** يسجّل دخولًا ويجد بطاقته «مميزة» | المنح إداري بلا بوابة دفع؛ زر الإلغاء `sub-revoke-*` يعيد «مجانية» |

## 8. قيود معروفة

- `workers: 1` + `fullyParallel: false` إجباريان (قاعدة مشتركة + حساب تجريبي واحد)؛ داخل كل ملف `mode: "serial"`.
- المتصفح الافتراضي Chromium فقط (يمكن إضافة مشاريع أخرى إلى `projects`).
- الاختبارات تتوقع مزوّد AI افتراضيًا `mock`؛ لا مفاتيح حقيقية مطلوبة.
- `maxLength=4000` في حقل الدردشة يحجب تجاوز الطول من المستخدم — لذلك اختُبر خطأ API بواسطة سيناريو CSRF (E) بدل رسالة أطول من الحد (إصلاح موثق في DECISIONS D-013).
- Web Speech API (STT/TTS) لا يمكن أتمتة **صوت حقيقي** (ميكروفون/مخرجات) بشكل حتمي — لذلك تحقن اختبارات الصوت (A1–A3) stubs لـ `SpeechRecognition`/`speechSynthesis` (تسجيل حتمي للـspeak/cancel) وتعتمد على تأكيدات **نسبية** لعد الإلغاء لأن React StrictMode في dev يعيد تركيب غرفة الدردشة فيشغّل cleanup «مغادرة الغرفة» مرة واحدة مبكرًا.
- لتشغيل الاختبارات لا بد أن يكون المنفذان 3107 و5173 حرين؛ اختبار Playwright يرفض الميناءين المشغولين (لا إعادة استخدام تلقائية لقاعدة التطوير).