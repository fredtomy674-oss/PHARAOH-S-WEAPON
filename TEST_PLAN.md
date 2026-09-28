# TEST PLAN — AL FAROUQ AI

> آخر تحديث: 2026-09-27 — التنفيذ في `server/test/` (Vitest **484/484** في 63 ملفًا)، الويب يُفحص بنيويًا + E2E بالمتصفح **52/52**.

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

> العزل **بنيوي** (لا دفاعي): لا يمكن لولي الأمر رؤية أي طفل غير مربوط بصريح صفّ في `students_parents`. قاعدة الخصوصية: **عدّادات وفوق-بيانات فقط — لا محتوى خام أبدًا**؛ «تفاصيل المحادثة» المؤجلة فُعِّلت في PHASE 23 (خط زمني بيانات وصفية + مفاهيم + أعلام أمان — ينظر §4.11).

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
| `test/api/achievements.test.ts` | API (6) | 0 من 12 مقفلة طازجًا؛ صورة في جلسة حقيقية → شارة «مصوّر الأسئلة»؛ PDF → «قارئ نهم»؛ إنهاء الجلسة → «أول خطوة» (الإجمالي 3)؛ والد ← 403؛ عزل: طالب آخر 0 |

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

## 4.11 تفاصيل جلسات الطفل (PHASE 23) — خط زمني بيانات وصفية فقط

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/api/parent.test.ts` | API (2 إضافيان — الإجمالي 13) | `GET /api/parent/children/:id/sessions/:sid` ← جلسة حقيقية بأربعة أدوار (سؤال بخاصية **صورة** → رد → سؤال **حقن** → رد آمن موسوم): خط زمني `[user,tutor,user,tutor]` بدقة الترتيب، مرفق أول (`fileName=question.png`/`itemKind=image`/`sizeBytes>0`)، `safetyFlagged=[false,false,false,true]` + `flaggedTurns=1`، مفهوم من `recordAssessment(sessionId)` (`attempts=1/correct=1`) — و**6 نفي تسريب**: نصّا السؤال والرد، عبارة المعلّم `وفقًا لمحتوى الدرس`، بايتات الصورة، عدم وجود حقل `content` في أي مدخل؛ **عزل**: الطالب → 403، والد غير مربوط → 404، طفل غير مربوط → 404 (البوابة قبل أي قراءة جلسة)، جلسة مجهولة → 404 |
| `server/src/modules/parent/service.ts` | بنية | عمود `messages.content` **لا يُحدَّد في الاستعلام** في `sessionDetail` — تسريب مستحيل بنيويًا؛ المرفقات تُصف من `messageAttachments` بفوق-بيانات بلا `data`/`sha256`؛ المفاهيم من `assessments` عبر `safeParseAssessment(resultJson)`؛ `safetyFlagged` من `messages.safety_flag` (يُكتب في `sessions/service.ts` عند `intent === "admin_bypass_attempt"`) |
| `web/src/Parent.tsx` | UI | زر «التفاصيل» في صف الجلسة ← شاشة «تفاصيل الجلسة»: بطاقة (حالة/تاريخ/مدة/عدّادات) + **تنبيه سلامة** عند `flaggedTurns>0` + مفاهيم عُرضت + قائمة النشاط (شارات الدور/النوع/المرفق/OCR/«محجوب (أمان)») + عودة للتقدم |

> قاعدة الخصوصية المعزّزة: «لا محتوى خام» تعني الآن **لا تحديد** (selection) لا «لا عرض» فقط — حتى خطأ تسلسل مستقبلي لا يستطيع تسريب النصوص. الـ`recap` المخزّن يردّد نص الأسئلة (`summarizeSession`) لذلك **لا يُعرض للوالد** (يظل لذاكرة المعلّم الطويلة) — التوثيق في D-027.

## 4.12 محرك إتقان المفاهيم + التمرين (PHASE 24) — قراءةً: مستويات/انحلال/اتجاه + تصحيح حتمي يغذّي التقييمات

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/unit/mastery.test.ts` | وحدة (15) | `masteryLevel` على حدود الأربعة مستويات تمامًا (0.8/0.6/0.4) وخارج النطاق؛ `describeMastery` يعيد المستوى + التسمية العربية؛ `decayMastery`: صفر يومٍ = نفسه، 10 أيام ≈ `m·e^(−0.2)`، معدل 0 = ثابت، أيام/معدلات سالبة محايدة، لا يخرج عن [0,1]؛ `daysBetween` غير سالب؛ `masteryTrend`: فارغ/قليل = steady، نجاحات أخيرة أعلى بـ≥0.2 = up، إخفاقات = down، قريب = steady؛ `round2`؛ `safeParseAssessment`: JSON صالح/فارغ/غير JSON/مصفوفة/كائن متناثر |
| `test/api/practice.test.ts` | API (8) | أضعف مفهوم متتبَّع `conceptA` بخبرة واحدة خاطئة (0.1) يُخدم سؤاله **بلا تسريب مفتاح** (`correctIndex`/`answerKey` غائبان من JSON كاملًا — الخيارات نص فقط)؛ فلتر `conceptId` يعيد سؤال المفهوم؛ إجابة صحيحة → `correct:true` + شرح + `mastery.{score,level,labelAr}` + صفّ `answers` (content=النص المختار) + تقييم `type:"exercise"` في `assessments` + `studentProgress` (محاولتان، +0.15)؛ إجابة خاطئة → `correct:false` و−0.1؛ `progress/me` يكشف `mastery` بدخول المستوى/الانحلال/الحداثة/الاتجاه؛ والد → 403؛ طالب غير مسجَّل → `question:null` و404 عند الإرسال؛ `optionIndex` خارج النطاق/غير رقمي → 400 `INVALID_OPTION` |
| `server/src/modules/progress/mastery.ts` | بنية | محرك نقي بلا I/O يوحّد التعريف (مستويات + انحلال + اتجاه) بين لوحة الطالب والوالد وتغذية التمرين؛ `safeParseAssessment` مركزي |
| `server/src/modules/practice/service.ts` | بنية | نطاق `curriculumEnrollments` المسجَّل (التالي 404 بلا مؤشر وجود)؛ ترتيب «أضعف أولًا» ثم أي سؤال (حتمي: الأقدم)؛ **بلا `optionsJson` خام في الاستجابة**؛ كل إجابة تُدرَّب عبر `recordAssessment(type:"exercise")` |
| `server/src/db/seed.ts` | بنية | 6 أسئلة MCQ مصرية idempotent عبر `ensureDemoQuestions` (فرعا البذر) بصيغة `{options, correctIndex}`؛ السعودية بلا أسئلة (نطاق لكل منهج) |
| `web/src/Home.tsx` | UI | قسم «إتقان المفاهيم» (شارة مستوى عربية + نسبة انحلال + سهم اتجاه + حداثة) وزر «تمرين على نقاط ضعفك» ← لوحة تمرين (سؤال/خيارات/تحقق/شرح/شارة مستوى مُحدَّثة/«سؤال آخر»/إغلاق) |
| `web/src/Parent.tsx` | UI | مفاهيم تقدم الطفل تعرض `labelAr` بدل النسبة وحدها (شارة مستوى حسب `level`) |

> مبدأ PHASE 24: التمرين **قناة التقييم الحقيقية** — `recordAssessment` لم يكن يُستدعى من أي مسار إنتاجي (خامل منذ PHASE 1)؛ الآن كل إجابة تُدرَّب (تقييم/محاولة/إتقان) بتصحيح حتمي بلا استدعاءات AI (أوفلاين وبلا تكلفة).

## 4.13 خطة الممارسة (PHASE 25) — توصيات الإتقان كخطة مرتّبة قابلة للتنفيذ

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/unit/practicePlan.test.ts` | وحدة (5) | `sortPlan`: أضعف `decayedMastery` أولًا (0.2 قبل 0.6 قبل 0.9)؛ كسر تعادل بالحداثة (12 يومًا قبل 7 قبل 0)؛ كسر نهائي حتمي بـ`conceptId` (`apple` قبل `zebra`)؛ **لا يعدّل مصفوفة المدخلات** (ترتيبها الأصلي يبقى والمرجع مختلف)؛ «متقن» (0.95) بعد «يحتاج مراجعة» (0.3) مع تساوي الحداثة |
| `test/api/practicePlan.test.ts` | API (5) | `GET /api/practice/plan`: طالب بلا تتبع ← `{plan:[]}`؛ بعد إجابة خاطئة على `conceptA` ← صفّ واحد: أضعف مفهوم + `level:"needs_review"` + `lessonId/lessonTitle` من الكوربس + `availableQuestions:2` (سؤالا A) + `decayedMastery ≤ mastery` + **3 نفي تسريب** (`correctIndex`/`answerKey`/`options` غائبة)؛ رفع A بإجابات صحيحة ثم إضعاف B ← `B` أولًا (0.1 < 0.55) و`availableQuestions:1`؛ طالب يتابع مفهومًا **بلا تسجيل** ← `availableQuestions:0` (عدّاد النطاق)؛ والد → 403 |
| `server/src/modules/practice/plan.ts` | بنية | `sortPlan` نقي بلا I/O قابل للاختبار وحدات؛ صف الخطة فوق-بيانات (لا خيارات/مفتاح أبدًا) |
| `server/src/modules/practice/service.ts` | بنية | `planFor` يبني الخطة من `masterySummary` + ربط `concepts↔lessons` + عدّاد `questions` (mcq) موقوف على `curriculumEnrollments` النشطة |
| `server/src/modules/practice/routes.ts` | بنية | مسار `/plan` student فقط (403 للوالد/أدمن) — قراءة نقيّة بلا كتابة |
| `web/src/Home.tsx` | UI | قسم «خطة ممارستك» (شارة مستوى + عنوان درس + «n سؤال متاح» + حداثة + سهم اتجاه) وزر «تمرّن الآن» (معطَّل عند 0) يفتح لوحة التمرين **مقيّدة بالمفهوم**؛ تُحدَّث الخطة بعد إجابة وإغلاق |

> مبدأ PHASE 25: «الإتقان بلا خطة قيمة مجمّدة» — الخطة قراءةً نقيّة (بلا كتابة) بترتيب حتمي صافٍ (انحلال ثم إهمال ثم معرّف)؛ `availableQuestions` يعكس نطاق التسجيل الحقيقي فلا يُوعد الطالب بتمرين لا مادة له؛ لا مفتاح/خيارات في الـJSON إطلاقًا.

## 4.14 حساسية الصعوبة + شارات التمرين/الإتقان (PHASE 26) — دلتا مستجيبة + تغذية الشارات من المحرك

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/unit/difficultyDelta.test.ts` | وحدة (6) | `assessmentDelta`: easy +0.15/−0.1 (الحسم التاريخية)، medium +0.175/−0.125، hard +0.2/−0.15؛ الغياب → easy؛ دلتا الصحيح موجبة دائمًا والخاطئ سالبة؛ التراتب الصارم hard>medium>easy على الطرفين |
| `test/api/practiceDifficulty.test.ts` | API (3) | على سؤال **hard** في الكوربس (`questionC1`): المحاولة الأولى الصحيحة = 0.6 (بداية محايدة للصعوبة)، الثانية الصحيحة → **0.8** (+0.2)، الثالثة الخاطئة → **0.65** (−0.15) |
| `test/api/practiceBadges.test.ts` | API (4) | `GET /api/achievements/me`: الاثنتان (`practice_starter`/`mastery_first`) مقفولتان قبل التمرين؛ إجابة أولى (خاطئة) → «انطلاقة التمرين» مكتسبة و«أول إتقان» لا؛ 5 إجابات صحيحة على نفس المفهوم (0.1→0.85) → «أول إتقان» مكتسبة (بعد المستوى 4 لا — عند السادسة نعم)؛ زميل بلا نشاط → الاثنتان مقفولتان (عزل) |
| `server/src/modules/progress/mastery.ts` | بنية | `assessmentDelta` نقي موحّد (الافتراضي easy يحفظ سلوك concept_check واختبارات PHASE 24) |
| `server/src/modules/tutor/memoryService.ts` | بنية | `recordAssessment` يقبل `difficulty?` ويشتق الدلتا منه |
| `server/src/modules/achievements/service.ts` | بنية | تعريفان جديدان (المجموع 8) + عدّادا `practice_answer` (صفوف answers) و`mastery_achieved` (مفاهيم المستوى المعروض «متقن» عبر `decayMastery` — لا الخام) |
| `server/src/modules/practice/service.ts` | بنية | يمرر `q.difficulty` ويقيّم الحدثين بعد الإجابة **best-effort** (try/catch — الشارة لا تكسر الحلقة، والفشل يُعاد تلقائيًا) |
| إعادة استخدام | بنية | لا تغيير ويب — شاشة الإنجازات تعرض التعريفين تلقائيًا (مكتسب/مقفول)؛ شاشة التقدم تعرض دلتا الصعوبة عبر نفس `masterySummary` |

> مبدأ PHASE 26: «سؤال صعب يستحق وزنًا أكبر» — دلتا الإتقان تستجيب لصعوبة ما يُسأل عنه، والمحاولة الأولى محايدة (0.6/0.1) فالتفاضل على التتابع؛ والشارة «أول إتقان» تقرأ المستوى **المعروض** (بعد الانحلال — نفس ما يراه الطفل) حتى لا تكذب على القُرّاء أثناء الامتدادات.

## 4.15 إحصاءات الاشتراكات + وفورات الكاش (PHASE 27) — اكتمال لوحة المدير

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/api/adminStatsExtended.test.ts` | API (4) | قمع الاشتراكات: ترقية مميزة سارية → `{total:2, free:1, premium:1, active:1, conversionRate:50}`؛ انحدار `past_due` → «سارية» 0 مع بقاء الخطة المخزّنة premium (التحويل 0)؛ عدّادات الاستخدام بعد دورتين `calls≥2`/`tokens>0`/`byOperation.tutor≥2`؛ إصابات كاش بعد تكرار نفس السؤال (`hitRate>0`) مع وفورات توكن (`estimatedSavingsTokens>0`) وUSD = 0 على mock (تسعير صفر) |
| `server/src/modules/admin/routes.ts` | بنية | `/stats` (admin-only) يُضيف `subscriptions` + `ai` — تجميعات `aiUsageLogs`/`subscriptions` + `app.ai.cacheStats()`؛ تقدير الوفورات = متوسط نداءات العمليات القابلة للتخزين المعاد له المتوسط المنصّتي عند غيابها؛ عدّادات فقط بلا محتوى |
| `web/src/api.ts` + `web/src/Admin.tsx` | بنية | `AdminStats` الموسّع + بطاقتا «الاشتراكات — نظرة سريعة» و«الذكاء الاصطناعي — الاستخدام والوفورات» (testids `admin-stats-subscriptions`/`admin-stats-ai`) — قراءة فقط بلا أي إجراءات في الواجهة |

> مبدأ PHASE 27: لوحة المدير تحكي قصة المنصة — من يدفع (قمع الخطط بـ«السارية فعليًا» لا المخزّنة فقط) وما يُوفّره الكاش (كل إصابة = نداء مزوّد لم يُدفع)؛ تقدير الوفورات «أفضل جهد» صريح لا يُسوَّق كفاتورة.

## 4.16 أسئلة مولّدة بالمفهوم (PHASE 28) — تغطية المفاهيم بلا أسئلة عبر عملة `question_gen`

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/unit/questionGenMock.test.ts` | وحدة (14) | `buildMockQuestion` حتمي لنفس السياق؛ الصحيح **حرفي من نص الدرس** ومشتتّات مميزة (4 خيارات بلا تكرار)؛ جملة النفي «غير موجود» لا تُلتقط كإجابة أبدًا (5 تكرارات بسياقات مُطعَّمة)؛ نص يدوي يذكر المفهوم ويشرح بصحة؛ fallback بلا اسم مفهوم؛ `complete(question_gen)` تنتج JSON قابلاً للتحليل مرتكزة على السياق؛ حدود `parseGeneratedQuestion` (JSON صالح/ملفوف، رفض النص القصير/الخيارات القليلة/`correctIndex` غير عددي أو خارج المدى، شرح اختياري)؛ `groundingPrompt` يضمّن `<context>` و«المفهوم: «…»» |
| `test/api/practiceGenerate.test.ts` | API (9) | توليد ذاتي للطالب: 403 لولي الأمر؛ 400 بلا `conceptId`؛ 404 لمفهوم مجهول و**لخارج مناهج الطالب المسجَّلة** (طالب زميل)؛ 409 لمفهوم مغطّى بأسئلة؛ نجاح على مفهوم بلا أسئلة → سؤال «أي العبارات التالية وردت في الدرس» + تخزين `mcq`/`easy` بنطاق المنهج (مرتبطًا بالدرس/المفهوم) **بلا `correctIndex`/`answerKey`/`optionsJson` في الاستجابة**؛ التصحيح عبر `correctIndex` المقروء من DB (لا من الاستجابة) → `correct:true` + إتقان > 0؛ 503 لمفهوم بدرس بلا مقاطع («لا يوجد محتوى»)؛ 401 غير مصادق |
| `test/api/adminQuestionGen.test.ts` | API (6) | تغطية جماعية إدارية: 403 للطالب؛ 400 عند غياب/تعدد النطاق؛ نطاق درس → ولّد 1 وتخطّى 2 (المغطّى) **ببيانات وصفية فقط بلا محتوى أسئلة**؛ نطاق منهج → ولّد 1 وتخطّى 4؛ إعادة التشغيل idempotent (ولّد 0، تخطّى 5، بلا تكرار في DB)؛ مفهوم بدرس بلا مقاطع → `failed` «لا يوجد محتوى» |
| `test/api/practicePlan.test.ts` (+`test/unit/practicePlan.test.ts`) | API (3 → 3 صفوف) | عقد PHASE 25 مُحدَّث: الخطة تُدرج **المفاهيم غير المتتبعة** لمناهج الطالب المسجَّلة (`tracked:false`, إتقان 0) بعد المتتبعة — كل خرائط الخطة (الفارغة-سابقًا، أضعف أولًا، ترتيب أضعفين) أصبحت 3 صفوف والاقتران بالعناوين؛ عزل غير المسجَّل يبقى صفًا واحدًا (أثر واحد فقط) |
| `server/src/modules/...` | بنية | `ai/types.ts` (عملة) + `ai/aiService.ts` (كاش) + `ai/providers/mock.ts` (`buildMockQuestion`) + `practice/questionGen.ts` (جارٍ) + `practice/service.ts` (منع التسريب) + `practice/routes.ts` (POST /generate بـ`contextUserId=auth.user.id` — ربط معرّفات) + `admin/routes.ts` (POST /questions/generate) |
| `web/src/api.ts` + `web/src/Home.tsx` + `web/src/Admin.tsx` | بنية | `tracked` في العنصر + «توليد سؤال» (`plan-generate`) للصفوف بلا أسئلة + بطاقة إنشاء إدارية `admin-question-gen` |

> مبدأ PHASE 28: المفاهيم بلا أسئلة لا تُضيّع — طالب يرمم ما يدرسه («توليد سؤال» ذاتي) ومدير يغطي البنك دفعة واحدة (idempotent) أوفلاين عبر mock؛ كلاهما بلا تسريب للمفتاح (يُقرأ خادميًا عند التصحيح فقط).

## 4.17 ملخص الجلسة الآمن (PHASE 29) — إغلاق بند D-027 المؤجل: «مُلخّص جلسة AI آمن للعرض (عملية `recap` مع فحص «لا نص حرفي»)»

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/unit/recap.test.ts` | وحدة (18) | `buildRecapMetadataBlock` يرسل عناوين الدروس/المفاهيم والعدادات فقط **بلا أي محتوى رسائل**؛ حدود `parseRecap` (JSON صالح/ملفوف بـ```json، رفض غير JSON، عنوان ≤5/تركيز ≤3، قوائم بلا سلاسل)؛ حارس `recapContainsMessageContent` باتجاهين (رسالة كاملة ≥12 حرفًا داخل الملخص + جملة ملخص ≥25 حرفًا داخل رسالة) مع **استثناء عنوان الدرس الذي كتبه الطالب نفسه** (لا يُطلق الحارس) ورسالة قصيرة داخل ملخص أطول (يُطلق)؛ `buildSessionRecap` يدمج ناتجًا نظيفًا (`fallback:false` + عدادات + مفاهيم) ويسقط عند `aiJson=null` **وعند تسريب رسالة** (`fallback:true` بلا النص المسرَّب)؛ `buildRecapFallback` حتمي وفيه تلميح أمان عند `safetyFlagged>0`؛ mock `complete(recap)` يُحلَّل JSON وحتمي |
| `test/api/sessionRecap.test.ts` | API (8) | طالب يقرأ ملخص جلسته المنتهية: `lessonTitle` من الدرس + العنوان يحمل اسم الدرس + عدّادات + `fallback:false` + **حتمية** (نداءان → `toEqual`)؛ **لا رسالة سرية** («المفتاح السري ٧٧٧٧٧…») ولا كلمة منها في العرض؛ جلسة بلا رسائل → `{recap:null}`؛ طالب آخر → 403 (ملكية `getOwned` — كمسارات الجلسات)؛ admin → 403؛ ولي أمر مربوط يقرأ نفس الحمولة (`fallback:false` + بلا رسالة سرية)؛ ولي أمر غير مربوط → 404 (بوابة الربط قبل القراءة)؛ ولي الأمر على مسار الطالب → 403 |
| `test/api/sessionRecap.test.ts` (parent describe) | API (3 ضمن الـ8) | راجع السطر أعلاه — سياق الوالد داخل نفس الملف بـ`makeApp` منفصل |
| `server/src/modules/...` | بنية | `sessions/recap.ts` (جديد: بيانات وصفية/باحث/حارس/سقوط) + `ai/providers/mock.ts` (`extractMetadataBlock` + `buildMockRecap` حتمي) + `sessions/service.ts` (`recap(sessionId, studentId, actorUserId)` — بيانات وصفية فقط للاستدعاء، `contextUserId` صحيحة، مفاهيم الجلسة من `assessments`) + `sessions/routes.ts` (`GET /:sessionId/recap` student فقط) + `parent/service.ts` (`sessionRecap` — بوابة الربط + إعادة استخدام `sessions.recap` + حقن `SessionService`) + `parent/routes.ts` (`GET /children/:studentId/sessions/:sessionId/recap`) + `plugins/container.ts` (حقن `sessions` في `ParentService`) |
| `web/src/api.ts` + `web/src/RecapCard.tsx` + `web/src/Home.tsx` + `web/src/Parent.tsx` | بنية | `SessionRecap` + `getSessionRecap`/`getParentSessionRecap`؛ مكوّن مشترك `RecapCard` (عنوان/تركيز/إحصائيات/نقاط قوة/اقتراحات/تنبيه `fallback`)؛ Home زر «ملخص الجلسة» على صف الجلسة المنتهية بالذات (`session-recap-button`/`session-recap`/`session-recap-empty`)؛ Parent بطاقة «ملخص الجلسة الآمن» (`parent-recap-button`/`parent-session-recap`) — كلاهما يعرض **نفس الحمولة** |

> مبدأ PHASE 29: المدرّس لا ينهي درسًا بلا محصّلة — والملخص **آمن بالتصميم**: لا نص رسالة يدخل الاستدعاء (بيانات وصفية فقط)، وحارس «لا نص حرفي» يرفض أي ناتج يعيد إنتاج رسالة، وسقوط حتمي آمن يجعل العرض موجودًا دائمًا للطالب ووليّ الأمر.

## 4.18 التصحيح الآلي للإجابات المفتوحة (PHASE 30) — إغلاق بند D-028 المؤجل: أسئلة `type:"open"` عبر عملية `grade_open` مع عزل بنيوي للمفتاح

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/unit/grade.test.ts` | وحدة (27) | `normalizeArabic` (تجريد الشكل/التطويل، توحيد أشكال الألف والياء، **الأرقام العربية والهندية → لاتينية** — «٢/٣» ≡ «2/3»، إطباق الفراغات)؛ `tokensOf` (تقسيم على غير حرف/رقم — «والمقام» رمز واحد)؛ `referenceCoverage` (نسبة توكنات المفتاح المغطاة، المفاتيح الرقمية القصيرة تطابق تام، إعادة صياغة جزئية)؛ حدود `parseGrade` (JSON صالح/ملفوف ```json/رفض score خارج [0,1] أو `correct` غير منطقي أو تغذية فارغة/غير JSON)؛ `gradePrompt` يضع `<reference>` نظامًا و`<student_answer>` مستخدمًا (نص الطالب **لا يدخل رسالة النظام**)؛ حارس `gradeContainsAnswerKey` (نص حرفي للمفتاح في التغذية، تغطية ≥60% لمفتاح طويل، مرور تغذية تعليمية غير ذات صلة، مفتاح قصير ضمن قالب ثابت)؛ `gradeFallback` حتمي يصدّق «موفقة» ويعطي «قريبة» في النطاق و«غير دقيقة» ضعيفًا و**لا يعيد المفتاح أبدًا**؛ حتمية `buildMockGrade` وتطابقها مع السقوط وخلو تغذيتها من توكنات المفتاح |
| `test/api/openQuestion.test.ts` | API (11) | توليد `kind:"open"` → 200 بلا `answerKey`/`optionsJson`/`correctIndex` في أي استجابة والمفتاح يُخزَّن خادميًا (`answerKey` نص غير فارغ، `optionsJson` null)؛ **409** عند تكرار نوع مفتوح لنفس المفهوم؛ `GET /question?type=open` → `options:null`؛ إرسال المفتاح من DB → `correct:true, score:1` + تغذية بلا نص المفتاح + صف `answers` + تقدم/إتقان؛ إرسال نص غير ذي صلة → `false` وتحت 0.7؛ `optionIndex` على سؤال مفتوح → `400 INVALID_ANSWER` و`answer` على MCQ → `400 INVALID_OPTION` وكلاهما → `400 INVALID_SUBMIT` وإجابة فارغة → `400 INVALID_ANSWER`؛ `type=essay`/`kind=essay` → `400 INVALID_TYPE`/`INVALID_KIND`؛ خطة تظهر `openQuestions:1` بلا تسريب مفتاح؛ والد → 403 على التوليد والجلب |
| `server/src/modules/...` | بنية | `practice/grade.ts` (جديد: تطبيع/توكنات/تغطية/قالب فصل/باحث صارم/حارس/سقوط/ثوابت السقوف) + `ai/providers/mock.ts` (`extractBlock` + `buildMockGrade` حتمي بتغطية التوكنات + `buildMockOpenQuestion` بلا اقتباس المفتاح في التوضيح + «النوع: mcq\|open» لـ`question_gen`) + `practice/service.ts` (توزيع `submitAnswer` بطبقة النوع، `toPublic`/`questionFor(type)`، عداد توليد لكل نوع) + `practice/plan.ts` (`openQuestions`) + `practice/routes.ts` (`type`/`kind`/`{answer}`) + `admin/routes.ts` (`kind?` في التوليد الجماعي) + `db/seed.ts` (سؤالان مصريان مفتوحان مبذوران) |
| `web/src/api.ts` + `web/src/Home.tsx` + `web/src/styles.css` | بنية | `getPracticeQuestion(type?)`/`submitOpenPracticeAnswer`/`generatePracticeQuestion(kind?)`؛ صف الخطة «سؤال مقالي»/«توليد سؤال مقالي» (`plan-open-practice`/`plan-open-generate`)؛ لوحة التمرين حقل `practice-open-input`، إرسال معطّل بلا نص، تغذية `feedback` + شارة `practice-score` |

> مبدأ PHASE 30: الإجابة الحرة تصدُق **كأنها من المدرّس** — لكن المفتاح النموذجي **بنيويًا لن يصل للطالب**: رسالة النظام فقط (خارج متناول أي عرض)، وحارس «لا نص حرفي» يرفض تغذية تعيد إنتاج المفتاح، وسقوط حتمي قوَالبي لا يقتبسه إطلاقًا.

## 4.19 زمن الإجابة في معادلة الإتقان + شارات الإتقان المتدرجة (PHASE 31) — إغلاق بندَي D-028/D-030 «إنتاج لاحقًا»

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/unit/masteryTime.test.ts` | وحدة (8) | `answerTimeBand`: null/undefined/سالبة/NaN → `unknown`، 0..9 → `fast`، 10..60 → `normal`، 61+ → `slow`؛ `TIME_MULTIPLIER` (سريع 1.25 / عادي 1 / بطيء 0.75 / مجهول 1)؛ `timeScaledDelta`: بقاء الحتميات التاريخية عند مجهول، مضاعفة الدلتا بالنطاق باتجاه واحد للصح والخطأ، وتركيب EWMA عبر `round2` (سريع 0.79 > بطيء 0.71 > محايد 0.75؛ خاطئ سريع 0.48 مقابل 0.5 محايد) |
| `test/api/practiceTime.test.ts` | API (4) | إرسال `timeTakenSeconds` → يُخزَّن في `answers.answer_seconds` ويفرّق المتتاليات (سريع 3ث → 0.79 ضد بطيء 500ث → 0.71 على نفس المفهوم والنتيجة)؛ **المحاولة الأولى محايدة** (0.6) في أي سرعة وعلى أي صعوبة؛ إسقاط الفاسد/خارج النطاق (سلسلة/كسر/601) → null + مضاعِف الوحدة (0.6 ثم 0.75)؛ **المفتوح لا يسجّل زمنًا** أبدًا (answerSeconds null مع اكتمال التصحيح والإتقان) |
| `test/api/tierBadges.test.ts` | API (2) | عبر حلقة الإرسال الحقيقية: إتقان 3 مفاهيم → `mastery_three` مكتسبة و`mastery_five` مقفولة و`total=12`؛ إتقان مفهومَين إضافيَّين (مفاهيم/أسئلة مدخلة في الـDB) → `mastery_five` مكتسبة |
| `server/src/modules/...` | بنية | `progress/mastery.ts` (`AnswerTimeBand`/حدّا النطاق/`TIME_MULTIPLIER`/`answerTimeBand`/`timeScaledDelta` — كلها نقية) + `tutor/memoryService.ts` (`recordAssessment(answerSeconds?)` مع `round2` على الصف الموجود) + `db/schema.ts` + `drizzle/migrations/0008_*.sql` (`answers.answer_seconds` nullable) + `practice/service.ts` (`timeTakenSeconds?` + `normalizeAnswerSeconds`؛ MCQ يخزّن/يمرّر والمفتوح null) + `practice/routes.ts` + `achievements/service.ts` (`mastery_three`/`mastery_five` — المجموع 10) |
| `web/src/api.ts` + `web/src/Home.tsx` | بنية | `submitPracticeAnswer(id, option, timeTakenSeconds?)` تُضمّنه عند توفّره؛ `PracticeState.shownAt` عند كل سؤال (بدء/توليد/تالي) + ثوانٍ مقصوصة 1..600 على إرسال MCQ فقط |
| `test/api/achievements.test.ts` | API (6) | تحديث ميكانيكي: `total` 8 → 10 → **12** (تم تمرير شارات التدرّج والمواظبة الجديدة) |

> مبدأ PHASE 31: سرعة الإجابة **إشارة قوة لا حُكم** — تُضخّم الدلتا باتجاه واحد للصح والخطأ (سريع ×1.25 / بطيء ×0.75 / مجهول ×1)، والمحاولة الأولى تبقى محايدة، وعدم الإرسال لا يغيّر المسار القديم حرفيًا. شارات التدرّج تمنحها نفس عدّادات المستوى المعروض «متقن» بلا كود جديد.

## 4.20 التعاقب اليومي + شارات «المواظبة» (PHASE 32) — إغلاق بندَي D-024/D-035 «تتابع أسبوعي»

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/unit/streak.test.ts` | وحدة (10) | `dayKey` من توقيع الوقت (بداية/نهاية يوم UTC)؛ `previousDay` يعبر أشهرًا/سنوات (28 فبراير، 1 يناير −3)؛ `streakForDates`: صفر على فارغ/فاسد، يومٌ وحيد اليوم، **سلسلة تنتهي أمس مع بقاء اليوم فارغًا** (الرأفة)، 3 أيام متتالية، دمج التكرار والترتيب العشوائي، **انقطاع يعيد التصفير** (1 و2 بحسب موقع الفجوة)، تجاهل الأيام المستقبلية، أسبوع كامل = 7 |
| `test/api/streak.test.ts` | API (4) | بذر أيام ماضية مباشرة + إرسال اليوم عبر الحلقة الحقيقية: 3 أيام متتالية → «مواظب 3 أيام» مكتسبة و«مواظب أسبوع» مقفولة و`total=12` والخطة تُفصح `streak:3`؛ **يوم ضائع** (3 و1 فقط) → `streak:2` بلا شارة؛ **جلسات تُعدّ نشاطًا** (جلسات يومٍ واحد تُدمج أُيّامه، +إجابة اليوم → 2) مع عدم تسريب شارة لطالب آخر (عزل)؛ **إعادة تقييم لا تمنح مزدوجًا** (عدّاد المكتسب قبل/بعد متساوٍ) |
| `server/src/modules/progress/streak.ts` | بنية | محرك نقي بلا I/O: `dayKey`/`previousDay`/`streakForDates` (UTC، تكرارات/ترتيب/مستقبل مُعالَجة) |
| `server/src/modules/achievements/service.ts` | بنية | `streakForStudent` (قراءة `answers.createdAt` ∪ `learningSessions.startedAt` — بدء الجلسة يومُ نشاطٍ؛ عمودا الزمن `ts()` = epoch ميلي-ثانية تُستخرج أُيّامهما في JS لأن جدول الجلسات بلا `createdAt`) + `evaluateStreak` (منح **بمقارنة التعاقب الحالي** عبر نفس `awardFor` المضاد للتكرار) + حدث `daily_streak` يفوضه `evaluate` + تعريفا `streak_three`/`streak_seven` (المجموع 10 → 12) |
| `server/src/modules/practice/service.ts` + `sessions/service.ts` | بنية | حقن best-effort: بعد كل إجابة تمرين (`masteryAfter`) وفي كل حدث جلسة (`award`) — إعادة تقييم التعاقب بلا كسر للمسار |
| `server/src/modules/practice/routes.ts` | بنية | `GET /api/practice/plan` ← `{ plan, streak }` |
| `web/src/api.ts` + `web/src/Home.tsx` + `styles.css` | بنية | `getPracticePlan()` ← `PracticePlanResponse { plan, streak }`؛ شارة «🔥 تعاقب N أيام» فوق خطة الممارسة (`data-testid="practice-streak"`، جمع عربي 1/2/3-10/11+ عبر `streakLabel`) + صف `plan-head` |

> مبدأ PHASE 32: التعاقب **وصف حتمي للسلوك لا عدّاد مكافأة** — يُقرأ من بيانات التمارين والجلسات الفعلية وقت الطلب، واليوم غير المنتهي لا يكسر السلسلة، والشارات دائمة (يوم ضائع لا يلغي مكتسبة)، والمنح مُقارن بالتعاقب الحالي فيتسق مع ما يَراه الطالب.

## 4.21 الجلسات في حلقة الإتقان (PHASE 33) — إنهاء جلسة درس يُنعش حداثة تعرّض مفاصله، والشارات تبقى معلّقة على آخر ممارسة

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/api/sessionRecency.test.ts` | API (6) | جلسة درس تنتهي → مفاهيمها الممارَسة سابقًا تُنعش `last_seen_at` (**بدون** مساس بالإتقان/المحاولات/`last_practice_at` — ذات صفوف قائمة فقط، والدرس يُحدَّد من الجلسة)؛ **لا صفوف جديدة** لمفاهيم غير الممارَسة + دروس أخرى عازلة (تفاعل درسٍ لا يمسّ درسًا مجاورًا)؛ **الشارة مرتبطة بالممارسة**: تعرّض بالجلسة لا يمنح «متقن» بينما إجابة تمرين فوق 0.8 تمنحه (حساب الانحلال من `last_practiced_at` لا `last_seen_at`)؛ صفوف قديمة `last_practiced_at=null` (ما قبل migration) تنحل من `last_seen_at` (المسار القديم حرفيًّا)؛ إنهاء جلسة بلا درس أو بلا ممارسة سابقة = لا-op نظيف؛ بعد مذاكرة درس تُعاد الخطة: المفهوم الممارَس صار أطْرأ فيُرتب آخر ويزول عن منطقة الخطر |
| `server/src/db/schema.ts` + `db/index.ts` | بنية | عمود `student_progress.last_practice_at` (nullable، migration `0009` ALTER TABLE واحدة) + تعبئة خلفية أحادية في `applyMigrations` (`last_practice_at = last_seen_at WHERE null` — يتجاهل الصفوف المملوءة) |
| `server/src/modules/tutor/memoryService.ts` | بنية | `recordAssessment` يكتب `lastPracticedAt` في الإدراج والتحديث؛ `touchConceptRecency(studentId, conceptIds, at)` تحديث `last_seen_at` فقط لصفوف قائمة بلا upsert |
| `server/src/modules/sessions/service.ts` | بنية | في `end()`: كتلة best-effort (try/catch) تُنعش حداثة مفاهيم `session.lessonId` عند وجوده — لا تُكسر الجلسة أبدًا |
| `server/src/modules/achievements/service.ts` | بنية | عدّاد `mastery_achieved` يحسب الانحلال من `r.lastPracticedAt ?? r.lastSeenAt` (الشارات ممارسةً لا تعرّضًا) |

> مبدأ PHASE 33: **«الحداثة» وصفان لا واحد** — خطة الممارسة والعرض تعتبران المذاكرة تعرّضًا جديدًا (SRS)، بينما شارات «متقن» لا تُشترى بمطالعة (تصحيحًا لوهم «درّست فامتلكت»). سطح API لم يتغير؛ الأثر يظهر في ترتيب الخطة وتأجيل منطقة الخطر بعد مذاكرة يوم.

## 4.22 الإحصاءات الزمنية في لوحة المدير (PHASE 34) — إغلاق ذيلَي D-021 («مؤشرات زمنية + ترتيب الدروس») وD-031 («تقسيم الفترة الزمنية للاستخدام»)

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `server/test/unit/adminTrends.test.ts` | وحدة نقية (16) | `lastNDayKeys`: نافذة **تصاعدية بلا فجوات**، عبور حدّ الشهر (30 ديسمبر ← 1 يناير)، سنة كبيسة (29 فبراير)، نافذة يوم واحد؛ `windowStart`: منتصف ليل UTC لأقدم يوم في النافذة ومطابقته لأول مفتاح (فلا تتناقض دلاء JS مع شرط SQL)؛ `countsByDay`: **تعبئة أصفار** لكل أيام النافذة، التقاط باليوم UTC، **تجاهل ما قبل النافذة**، احتساب الطابع الواقع على حدّ أقدم يوم بالضبط، وحدّ UTC (23:59:59.999 ≠ 00:00:00.000)؛ `usageByDay`: جمع النداءات/التوكنز/التكلفة لكل يوم، نافذة فارغة، تجاهل خارج النافذة، و**تقريب التكلفة لأربع منازل** فلا يصل طفوان الجمع إلى الواجهة |
| `server/test/api/adminStatsTime.test.ts` | API (7) | `trends` في `GET /api/admin/stats` (بذور بتواريخ مُرجَعة مباشرة لضمان حتمية التقطيع): **403** للطالب (`FORBIDDEN`)، تقطيع الجلسات باليوم مع تجاهل صفّ 30 يومًا خارجه (6 اليوم/1 قبل 3 أيام)، عدد الأيام النشطة، تقطيع الرسائل باليوم (4/2)، **تقسيم استهلاك AI زمنيًا** (نداءات/توكنز/تكلفة لكل يوم — تفصيل D-031)، **ترتيب الدروس داخل النافذة** مع العنوان واستثناء الجلسات بلا درس (4 مقابل 2 لا 5 — أي أن الجلسة القديمة لا تتسرّب إلى قائمة نافذة 14 يومًا)، ومجاميع النافذة |
| `server/src/modules/admin/trends.ts` | بنية | وحدة **بلا I/O** تُعيد استخدام `dayKey`/`previousDay` من `progress/streak.ts` (لا تكرار لتعريف اليوم)؛ تكلفة مُقرَّبة لأربع منازل |
| `e2e/admin.spec.ts` **A6** | E2E (1) | لوحة المدير تعرض بطاقة «النشاط الزمني» بمجاميعها الثلاثة، **عمودًا واحدًا لكل يوم في المخططين** (14 لكل منهما)، وقائمة «الدروس الأكثر نشاطًا» **بعنوان درس حقيقي** من القاعدة المشتركة |

> مبدأ PHASE 34: **«اليوم» معرّف واحد** — الرسم الزمني يستعير دالة اليوم من محرك التعاقب بدل `date()` في SQL، فلا يمكن أن يقول الرسم إن اليوم مختلف عن يوم شارة التعاقب. والمخططات **CSS خالص** (لا مكتبة رسوم) ضمن قيد «صفر تبعيات جديدة».

## 4.23 حداثة الممارسة على سطحَي الوالد والخطة (PHASE 35) — إغلاق ذيل D-037

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `server/test/unit/practicePlan.test.ts` | وحدة (+6) | `REVIEW_DUE_DAYS = 14` بالحدّين بالضبط (`13` ليست مستحقة، `14` مستحقة) و`0` (اليوم) ليست مستحقة؛ **الاستحقاق يتقدّم على عمل أقوى وأحدث**؛ ترتيب مجموعة «المستحق» يبقى بالضعف ثم الأقدم تعرّضًا؛ **مفهوم غير متتبَّع لا يدخل المجموعة** (جديد لا مهمل)؛ `sortPlan` لا تحوّر للمصفوفة الأصلية (والمُصنِّع يشتقّ العلامة من الحداثة فلا يستطيع مزيّف ادّعاء قِدم لا يرتّبه) |
| `server/test/api/practiceRecencySurface.test.ts` | API (5) | لوحة الوالد تعرض **ساعة الممارسة لا التعرّض**: مفهوم أُجيب عنه قبل 40 يومًا ثم تعرّض قبل 20 يومًا يُقرأ كـ«منذ ~40 يوم» لا «منذ 20»؛ المفهوم الذي أُجيب عنه أمس يُقرأ «1»؛ الترتيب المعروض (الطابع) متسق؛ **صف قديم `last_practiced_at=null`** يعود إلى حداثة التعرّض ولا يُدّعى «لم يمارس أبدًا»؛ إجابة تمرين مصحَّحة **تُحدّث الساعة نفسها التي يقرأها الوالد** وتُصفّر عدّاد أيام التعرّض في الخطة |
| `server/src/modules/practice/plan.ts` | بنية | `dueForReview` + `isDueForReview`/`REVIEW_DUE_DAYS` (عتبة مربوطة بثابت الانحلال 2% يوميًا) + `sortPlan` يبدأ بالمستحقين |
| `e2e/parent.spec.ts` **P5** + `e2e/practice.spec.ts` **PR6** | E2E (2) | الطالب يمرّن حقيقيًا ثم الوالد يقرأ «آخر ممارسة» بجانب شارة المستوى؛ وبعد التمرين مباشرة **لا** تظهر شارة «راجع قبل أن ينسى» (إثبات أنها ليست تسمية شاملة) |

> مبدأ PHASE 35: ما يخرج للواجهة **مترجم لا مكرَّر** — العتبة والتاريخ يُشتقّان في مكان واحد (`plan.ts`/`masterySummary`) ويصلان نصًّا جاهزًا للعرض، فلا يمكن أن تتناقض البطاقة والشارة. وقسر D-027 قائم: بيانات وصفية فقط بلا محتوى.

## 4.24 التوليد عبر مقاطع الدرس كلها (PHASE 36) — إغلاق ذيل D-032

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `server/test/unit/questionGenMock.test.ts` | وحدة (+8) | `selectGroundingChunks`: درس داخل الميزانية يُؤخذ كاملًا بترتيبه؛ **البداية والنهاية محفوظتان** لدرس طويل؛ العيّنة **تتجاوز البادئة** (مقطع بعد 5 موجود — وهو ما يجعل قاعدة «أول 6» مستحيلة)؛ لا تجاوز للميزانية ولا تكرار؛ **حتمية** (بلا عشوائية) لنتائج قابلة للإعادة؛ الحفاظ على ترتيب `position` (فيبقى `<context>` درسًا متصلًا)؛ ميزانية غير موجبة ⇒ `[]`، ودرس فارغ ⇒ `[]`؛ الافتراضي = ميزانية التوليد |
| `server/test/api/multiChunkGrounding.test.ts` | API (2) | **اختبار حاسم للسلوك**: درس من 12 مقطعًا، كل مقطع فيه **«قصير.»** (تحت عتبة «الحقيقة» عند المزوّد الوهمي فلا يُقتبس) عدا **آخر مقطع** بجملة فريدة؛ السؤال المولَّد يقتبس **الجملة الخلفية** ⇒ البرهان على أن التوليد وصل إلى عمق الدرس (ويستحيل مع قاعدة «أول 6 مقاطع»). والتوليد الثاني على الدرس نفسه idempotent (0 مولَّد/1 متخطّى) |
| `server/src/modules/practice/service.ts` | بنية | `groundingForLesson`: الاستعلام بلا `LIMIT` (الاقتطاع في JS بعد الاختيار) والدمج بترتيب `position`؛ **الموازنة لم تتغيّر** (6 مقاطع/4000 حرف) |

> مبدأ PHASE 36: **حتمية بلا تكلفة** — العيّنة تُنتجها حسابات فهرس لا استدعاء نموذج ولا عشوائية، فتكسب تغطية الدرس كاملًا دون أن يتغير حجم الطلب ولا زمنه ولا قابلية إعادة الإنتاج.

---

## 4.25 فشل بدء الجلسة في مسار اختيار الدرس (PHASE 37) — عطل مُبلَّغ

| البُعد | التفصيل |
|---|---|
| **ماذا كان** | `web/src/Onboarding.tsx` كان `pickLesson` يستدعي `setBreadcrumb(...)` **قبل** `await startSession`. والنجاح وحده يُفكّ المكوّن (انتقال إلى الدردشة)، فشاشة «الدرس المختار» كانت **لا تُرى إلا عند الفشل** — وفقرة `onboarding-error` تُرسم **حصريًا** في واجهة المنتقي. النتيجة: عند فشل البدء يرى الطالب بطاقة فيها عنوان الدرس وزرّا «تغيير الدرس»/«الرئيسية» فقط: **لا خطأ، ولا درس، ولا محادثة، ولا خطوة تالية** (وهو ما يصفه المُبلِّغ حرفيًا: «لا يظهر أي فعل أو بيئة للشرح») |
| **ماذا تحقّقنا منه** | المسار السليم (مصر/السعودية · طالب تجريبي وطالب جديد) يعمل ويفتح الدردشة — فالعطل ليس في مسار النجاح بل في **وجه الفشل وحده**. والتحقق الخادمي كان سليمًا (`SessionService.start` يرفض `400 LESSON_CURRICULUM_MISMATCH`/`LESSON_SCOPE_MISMATCH`)، لكنه كان يقع حين تُبقي السلسلة النازلة معرّفات منهج قديمة بعد تغيير مستوى أعلى |
| **الإصلاح** | (أ) الفشل يبقي الطالب في المنتقي: تظهر رسالة الخادم كما هي، وقائمة الدروس باقية، ونفس النقرة تُعاد بنجاح؛ وشاشة «الدرس المختار» **حُذفت كلها** فيصير تكرار العمى مستحيلًا بنيويًا لا متوقفًا على تذكّر حالة. (ب) `clearBelow(level)` بترتيب 0=دولة … 6=وحدة: تغيير أي مستوى يُصفّر كل ما تحته، فيستحيل إرسال منهج/صف من نطاق آخر مع درس من نطاق ثالث |
| **الاختبارات** | E2E **ON1** (حجب `POST /api/sessions` برد 400: الخطأ يظهر بنصه، **لا** شاشة ميتة، لا محادثة، المنتقي يعمل، ونفس النقرة تنجح بعد رفع الحجب، ثم إنهاء الجلسة حتى لا تُترك نشطة) + **ON2** (تصفير المادة يُسقط المنهج/الفصل/الوحدة/الدروس ويُبقي النظام والصف، وتغيير الدولة يُسقط كل شيء) ⇒ **46/46 أخضر**؛ وVitest بلا تغيير (**431/431**) لأن الإصلاح كله في الويب |
| **ما لم يتغيّر** | التحقق الخادمي في `start()` **بقي كما هو** — لم يُخفَّف الحارس ليُرضي الواجهة؛ والفحص البنيوي (typecheck + lint) أخضر بلا تعديل |

---

## 4.26 لغة الشرح تتبع المنهج لا الواجهة (PHASE 38) — العربية افتراضيًا، والإنجليزية في مناهج اللغات

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `server/test/unit/tutorLanguage.test.ts` | وحدة (11) | `resolveTutorLanguage`: العربية افتراضيًا لأي مادة (رياضيات، علوم، **والعربية نفسها** — فاللغة تُدرَّس بالعربية)، والإنجليزية لرموز اللغات؛ التطبيع (حالة/فراغات/شرطات/شرطة سفلية) والبادئة `lang-`؛ الرمز الناقص أو غير المعروف ⇒ عربية. عقد الـ prompt: وسم `<reply_language>` بالقيمة الصحيحة، والقاعدة الأولى وسطر الإغلاق بلغة الطلب، و**القواعد 2–7 وحماية النظام متطابقة حرفيًا في اللغتين** (وإلاّ انحرف عقد الأمان). المزوّد الوهمي يقرأ الوسم فيكتب بكل لغة (`ENGLISH_REPLY_MARKER` وبدونه)، والمصنّف يوجّه الأسئلة الإنجليزية (تمرين/تلميح/لم أفهم) إلى نواياها لا إلى «شرح» عام. و**بطاقة الاقتباس** `[مصدر 1]`/`[source 1]` بلغة الردّ — فهي تُقتبس حرفيًا في النصّ المُخرَج، فتسريبها عربي داخل ردّ إنجليزي هو نفس المشكلة (لُحظت أثناء تجربة حيّة على بيانات التطوير) |
| `server/test/api/tutorLanguage.test.ts` | API (4) | المسار الكامل `POST /api/sessions` + `POST /:id/messages`: (١) منهج رياضيات يردّ **عربيًا** حتى مع سؤال إنجليزي (`سؤال جيد` + عنوان المفهوم، بلا علامة إنجليزية)؛ (٢) منهج إنجليزي يردّ **إنجليزيًا** مستندًا على الدرس («Great question!» + `does not` من نص الدرس) **بلا أي تسرّب عربي**؛ (٣) ثبات اللغة عبر الأدوار مع صورة مرفقة (علامة `IMAGE_READ_MARKER_EN`)؛ (٤) محاولة حقن `ignore all previous instructions` في الدرس الإنجليزي تردّ بالرفض **الإنجليزي** لا العربي |
| `e2e/language.spec.ts` | E2E (LN1) | المتصفح على المسار الحقيقي: شارة اللغة في الترويسة تتبع ما قرّره الخادم (`🗿 الشرح بالعربية` لدرس الرياضيات، `🗽 الشرح بالإنجليزية` لدرس الإنجليزية)؛ الرد الإنجليزي مستند على الدرس (`ENGLISH_RAG_CONTEXT_PHRASE`) بلا أي علامة عربية؛ صورة مرفقة تُقرأ بالإنجليزية؛ محاولات الحقن تردّ بالرفض الإنجليزي؛ ثم إنهاء الجلستين حتى لا تُترك نشطة |
| `server/src/db/seed.ts` | بنية | `seedCountry` idempotent **على كل مستوى** (كان يفترض «الدولة موجودة ⇒ المنهج موجود» فينكسر مع أول منهج ثانٍ تحت دولة واحدة)؛ ومفتاح `demoQuestionsOf` = رمز المنهج لا الدولة فلا تتسرّب أسئلة الرياضيات إلى المنهج الإنجليزي |

> مبدأ PHASE 38: **اللغة خاصية المنهج لا خاصية الرسالة** — تُشتقّ من رمز المادة مرة واحدة في أول `handle()`، فاللغة ثابتة للدرس في الاختبار كما في الإنتاج، وقواعد السلامة لا تتفرّع بين اللغتين. والاختبار حاسم: يكفي أن يجيب درس واحد بلغة واحدة لتُكشف أي انحراف في حلّ اللغة.

---

## 4.27 لغة الصوت تتبع لغة الشرح (PHASE 39) — الإملاء والنطق بلغة المنهج

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `e2e/voice.spec.ts` | E2E (A1/A2 + **A4**) | **A1/A2** (تأكيدان جديدان): الإملاء يطلب `ar-EG` والنطق يرسل `utterance.lang = "ar-EG"` في درس رياضيات **رغم وجود صوت إنجليزي في القائمة** — والقائمة تضع العربيّ أوّلًا، فيكشف ذلك أيّ تنفيذ يلتقط «أول صوت» أو «أي صوت عربي» — ولا يظهر تنبيه «لا يوجد صوت» على جهاز يملك الصوت. **A4** (جديد): جهازٌ بصوت إنجليزي فقط ⇒ الوسم يبقى `ar-EG` (فالمحرّك الذي يملك العربية ينطقه) **مع** تنبيه واضح قابل للتنفيذ: «لا يوجد صوت العربية مثبّت على هذا الجهاز… من إعدادات النظام»، والنطق يستمرّ |
| `e2e/language.spec.ts` | E2E (**LN2**) | منهج الإنجليزية: زر الميكروفون يطلب الإملاء بـ`en-US` (والنسخ يظهر كما هو للمراجعة)، والردّ الإنجليزي يُنطق تلقائيًا بـ`en-US` — مع التجهئة التي تسرد **العربي أوّلًا** — ولا تنبيه لغياب الصوت |
| `e2e/helpers.ts` | بنية | `installVoiceStubs(page, transcript, voices)`: تسرد **صوتين** (`ar-EG` ثمّ `en-US` عمدًا) وتسجّل `recognitionLang` الذي طلبه التطبيق، وتقبل مجموعة أصوات مخصّصة — فالتجهئة القديمة (صوت عربي فقط) كانت تُخفي العيب كلّه |
| `web/src/voice.ts` | بنية | `speechTag` (`ar-EG`/`en-US`) + `pickVoice` (الوسم المطابق أوّلًا ثمّ نفس اللغة الأساسية) + `primeVoices` بتحديث `voiceschanged` (كروم يعيد `getVoices()` فارغة في أول نداء) + `missingVoice` لا يُعلن عن **قائمة فارغة** (فهي تعني «لم تُحمَّل بعد» لا «لا يوجد صوت») |

> مبدأ PHASE 39: **الصوت جزء من اللغة لا طبقة مستقلّة** — الإملاء والنطق يأخذان `replyLanguage` من الخادم (D-042) لا قيمة مثبّتة، فلم يبقَ في الواجهة مكانٌ واحد يكتب لغةً من عنده. والعقد المقيس هو **وسم `utterance.lang`** لا كائن `utterance.voice` (لأنّ الوسم ما يحترمه كل محرّك).

---

## 4.28 النطق على الخادم بدل أصوات الجهاز (PHASE 40) — الطالب لا يثبّت شيئًا

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `server/test/unit/speech.test.ts` | وحدة (16) | `wav.ts`: ترويسة RIFF من 44 بايت تُبنى صحيحة (الاسم `WAVE`، عدد القنوات، معدّل العيّنات المستخرج من `audio/L16;rate=…`، `bits=16`، والحجم = البيانات + 44)، ورفض نوع `audio/*` غير معروف بدل بثّ ملف لا يقرؤه المتصفح. ومزوّد `stub` يعطي WAV حقيقيًا محليًّا بلا شبكة. ومزوّد `gemini` عبر `fetch` موموك: **شكل الطلب** (`generateContent` + `responseModalities: ["AUDIO"]` + `speechConfig.voiceConfig.prebuiltVoiceConfig` باسم الصوت و`languageCode` الاختياري)، وغلّف استجابة `audio/L16` في WAV، وأنّ **كل** تعثّر (غير 2xx، أو استثناء شبكة، أو ردّ بلا `inlineData`) يصير `503 SPEECH_UNAVAILABLE`. و`factory` يفهم `none`/`stub`/`gemini` ويرفض غيرها. و`SpeechService`: الكاش بمفتاح `(لغة، نموذج، صوت، هاش نصّ)` فلا يُعيد الطلب بلغة أخرى، و`capText` يقصّ عند الحدّ على حدّ كلمة |
| `server/test/api/speech.test.ts` | API (8) | `POST /api/sessions/:sessionId/messages/:messageId/speech`: (١) ردّ مملوك ⇒ `200` ببايتات `audio/wav` صالحة للتشغيل مع ترويسات `content-type` و`cache-control: private` و`nosniff`؛ (٢) منهج إنجليزي ⇒ الصوت من الخادم بلغة الدرس (`replyLanguage`) بلا أن يطلبها العميل؛ (٣) `messageId` لرسالة **طالب** ⇒ `400 NOT_TUTOR_MESSAGE`؛ (٤) غير المالك ⇒ 403، و(٥) رسالة ليست في هذه الجلسة ⇒ 404، و(٦) بلا جلسة ⇒ 401؛ (٧) الطلب الثاني للرسالة نفسها ⇒ من الكاش بلا توليد ثانٍ؛ (٨) `SPEECH_PROVIDER=none` ⇒ `503 SPEECH_UNAVAILABLE` و`GET /api/health` يُعلن `speech: "none"` |
| `e2e/voice.spec.ts` | E2E (**A1/A2** + **A4** المعاد + **A5**/**A6** جديدان) | الخادم في وضع `stub` (`SPEECH_PROVIDER` في `backendEnv`)، فالمسار الحقيقي صار **خادميًا**: **A1/A2** يعدّلان ليشهدا تشغيل `audio` حقيقيًا من `blob:` (`state.audio.plays === 1`، و`lastSrc` يبدأ بـ`blob:`، و`state.spoken` فارغ لأنّ `speechSynthesis` لم يُستعمل أصلًا)، والإيقاف يمرّ عبر `state.audio.pauses`. و**A4** المعاد كتابته: جهاز بلا صوت عربي + نطق خادمي = **الطالب يسمع العربية بلا تنبيه** — وهو بلاغ المستخدم نفسه كاختبار أخضر. و**A5** جديد: `forceNoServerSpeech(page)` يعترض المسار بالـ503 الحقيقي فيعود الصوت إلى `ar-EG` من المتصفح **صامتًا** بلا تنبيه. و**A6** جديد: 503 مع لا صوت عربي ⇒ التنبيه يظهر صحيحًا — فبقي التنبيه معناه في المسار الوحيد الذي يهمّ فيه صوت الجهاز |
| `e2e/language.spec.ts` | E2E (**LN2** + **LN3** جديد) | **LN2** صار يمرّ على المسار الخادمي فيُعدّ التشغيل بـ`expect.poll` (لا بالشارة العابرة التي قد تسبق التقدّم). و**LN3** جديد: بعد حجب المسار بالـ503 ينطق درسُ الإنجليزية ردّه بصوت `en-US` من المتصفح — بلا تنبيه لأنّ الصوت موجود |
| `e2e/helpers.ts` | بنية | `VoiceTestState.audio` (`plays`/`pauses`/`ended`/`lastSrc`) لقياس تشغيل `<audio>` حقيقي بدل نطقٍ وهمي، و`forceNoServerSpeech` لاختبار الاحتياطي بالـ503 نفسه الذي يعيده الخادم (لا حالة وهمية)، و`installVoiceStubs` ما زالت تسرد العربيّ أوّلًا عمدًا (كما في PHASE 39) |

> مبدأ PHASE 40: **الطالب لا يملك محرّك نطق، فالنطق مسؤولية الخادم** — المتصفح يستعير أصوات نظام التشغيل، وطلب «ثبّت حزمة صوت» يطلب من الطالب ضبط جهازٍ لا نتحكّم فيه. فصار المسار يطلب `audio/wav` بمعرّفات فقط (403/404/400 تمنع إساءة استخدام مزوّد مدفوع)، ولغة النطق تُحلّ في الخادم من خبز الدرس نفسه (D-042)، وأي 503 يعود الصوت إلى صوت المتصفح صامتًا. والاختبار الحاسم هو **A4**: ما كان بلاغًا من المستخدم صار شرطًا أخضر.

## 4.29 تهيئة التشغيل الحقيقي: «ردود محفوظة» سببها الإعداد (PHASE 41) — القالب يُقلع، والمزوّد يُعلن نفسه

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `server/test/unit/envConfig.test.ts` | وحدة (5) | عقد الإعداد يُفحص على مُدخَلٍ مُصطنع لا على `process.env`: القيمة الفارغة في `QDRANT_DIMENSION=` تُقرأ **غير مضبوطة** لا `0` (وهي التي كانت تُسقط الخادم عند نسخ القالب حرفيًّا)، والبُعد الصريح `"768"` يُقبل بينما `"0"` و`"-4"` يُرفضان، والقيمة المنطقية الفارغة تعني **افتراضيَّها** (`RUN_LIVE_TESTS=` ⇒ `false` لا فاتورة مفاجئة)، والافتراضيات Offline تصمد، ومفتاح المزوّد الحقيقي (`gemini` للنصّ والتضمين والصوت معًا) يُقبل |
| `server/test/api/speech.test.ts` | API (1) | `GET /api/health` يُعلن المزوّدات **الثلاثة** معًا: `provider` و`speech` (الذي أضافته PHASE 40) و`embeddings` الجديد — فنموذجٌ حقيقي يقرأ متجهاتٍ وهمية يبقى ردًّا محفوظًا بصياغةٍ أذكى، ومن يُشغّل المنصّة يستحقّ أن يرى حالة كل حلقةٍ في لقطة واحدة |

> مبدأ PHASE 41: **القيمة الفارغة في `.env` تعني «غير مضبوطة» أبدًا** — لا صفرًا ولا `true` مفاجئًا؛ وتبديل مزوّد التضمين **لا يعيد بناء ما كُتب من قبل**، فله أداة `npm run db:reembed` لأنّ `cosine()` يقصّ المتجهين إلى أقصرهما فيصمت عند اختلاف الأبعاد بدل أن يصرخ. والاختبار الحاسم هنا ليس سلوكًا في الواجهة بل **صمتٍ كان يضلّل**: كان المشروع يعمل على `mock` وعلى سرّ افتراضي وقالبٍ يُسقط الإقلاع — أي أنّ العطل في طبقة الإعداد لا في منطق الردّ، و«ردود محفوظة» عَرَضٌ لا مرض.

## 4.30 المفتاح صحيح والردّ لا يجيء: موديلٌ متقاعد وسعةٌ متقطّعة (PHASE 42) — الصمود أمام مزوّدٍ حيّ

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `server/test/unit/geminiResilience.test.ts` | وحدة (5) | مزوّد Gemini أمام شبكةٍ وهمية، وكل حالةٍ منها **مقيسة على واجهة حيّة** لأنّ الموديل نفسه أجاب 5/5 ثمّ 2/3 ثمّ 429 أربع مرّات: (1) حالة 503 ثمّ 200 ⇒ تُعاد المحاولة ويُعاد ردّ المحاولة الثانية (2) حالة 429 ثمّ 200 ⇒ أيضًا، لأنّ حصة الموديل قد تمتلئ في أثناء الدور (3) 503 دائمة ⇒ يتوقّف عند ثلاث محاولات ويعطي `AppError` بـ`503` و`AI_UPSTREAM_BUSY` و`meta.upstreamStatus`، ورسالته **لا تحوي نصوص المزوّد** (4) 404 ⇒ **محاولة واحدة لا غير**، لأنّ الاسم المتقاعد لا يُصلحه التكرار (5) مسار التضمين يشارك السلوك نفسه مع وسمٍ يميّزه في `meta` |
| `server/test/api/errorMapping.test.ts` | API (3) | عقدُ الخطأ حين يكون المزوّد حيًّا: (1) الطالب يقرأ رسالةً **قابلة للتنفيذ** («حاول بعد لحظات») بدل «حدث خطأ داخلي» (2) الردّ **لا يحوي** رقم حالة المزوّد ولا اسم الموديل ولا نصّ الحصة ولا مفتاح `meta` — فالمشغّل يقرأ السجلّ والطالب لا يقرأ داخليّات الاشتراك (3) خطأٌ داخليٌّ عادي يبقى عامًّا بلا مسار قاعدة البيانات ولا اسم السائق |

> مبدأ PHASE 42: **الفشل العابر حقٌّ للطالب في أن يُقال، لا ذنبٌ يُقنَّع** — مزوّدٌ خارجيٌّ بسعةٍ متقطّعة يعني أن دورًا واحدًا قد يفشل رغم صحّة كل شيء، فالمشروع يعيد المحاولة على العابر وحده (لا على الحتميّ: 404 اسمٌ ميتٌ لا يُصلحه التكرار)، وإن نفدت المحاولات يقول `503 AI_UPSTREAM_BUSY` ما يفعل الطالب، ويبقى **السبب في `meta` على الخادم** لأنّ «الحصة نفدت» و«السعة مشغولة» يبدوان للطالب متطابقين ويُحلّان بشيئين مختلفين. وأصلحث هذه المرحلة أيضًا **عزلًا بنيويًّا**: كان ملفّ `server/.env` غير المتتبَّع يقرّر مزوّدات الحزمتين (4 حالات و11 اختبار متصفّح)، فصار `test/setup.ts` و`playwright.config.ts` يُثبّتان المزوّدات على `mock` صراحةً.

---

# الجزء الثاني — Browser End-to-End (Playwright)

> آخر تحديث: 2026-09-27 — **52/52 أخضر** عبر `npm run e2e`. الاختبارات حقيقية 100%: متصفح Chromium → React SPA → Vite proxy → Fastify → SQLite → RAG → AI provider (mock=افتراضي المشروع) → persistence → المتصفح.

## 5. التشغيل والمتطلبات

```bash
npm install                       # بعد إضافة @playwright/test
npm run e2e:install               # مرة واحدة: تنزيل Chromium (~115MB)
npm run e2e                       # يشغّل كل شيء تلقائيًا (خادمان مُداران + 52 اختبارًا)
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

## 7. الحالات المغطاة (52)

| # | الملف | ماذا يختبر | ملاحظات |
|---|---|---|---|
| الرحلة | `journey.spec.ts` | login → اختيار المنهج كاملًا → جلسة → رد معلم مستند لـ RAG (`وفقًا لمحتوى الدرس` مع عدم وجود `لا يوجد محتوى مسترجع`) → «مش فاهم» → **نفس الجلسة** (العدد لا يزيد + نفس الـid) → إنهاء → progress → صف منتهي في القائمة → logout | serial |
| C | `journey.spec.ts` | طالب جديد لا يرى جلسات غيره (UI: قائمة فارغة؛ API: 403/404 لقراءة جلسة طالب آخر) | |
| ON1 | `journey.spec.ts` | (PHASE 37) اختيار الدرس مع حجب `POST /api/sessions` برد 400 (`LESSON_CURRICULUM_MISMATCH`) → الفشل **مُفسَّر**: `onboarding-error` يعرض نص الخادم، و**لا** محادثة ولا شاشة «درس مختار» ميتة، والمنتقي وقائمة الدروس باقيان → رفع الحجب ونفس النقرة تفتح الدردشة (`chat-input` + `messages`) → إنهاء الجلسة | serial — إثبات غياب العمى: الاختبار كان يمرّ على الشاشات القديمة لأن الفشل لم يكن قابلًا للوصول من مسار نجاح |
| ON2 | `journey.spec.ts` | (PHASE 37) بعد إكمال السلسلة (مصر…الوحدة) تظهر الدروس → تصفير **المادة** يُسقط المنهج/الفصل/الوحدة/الدروس ويُبقي النظام والصف → إعادة الاختيار ثم تغيير **الدولة** إلى السعودية يُصفّر النظام فما دونه ويُخفي الدروس | serial — إثبات أن المنهج القديم مع درس من نطاق آخر صار غير قابل للإرسال |
| LN1 | `language.spec.ts` | (PHASE 38) الطالب يبدأ درس **الرياضيات** → الشارة «الشرح بالعربية» والرد عربي مستند، بلا علامة إنجليزية → ينهي الجلسة → يبدأ درس **اللغة الإنجليزية** (مصر ← النظام ← الصف ← المادة ← المنهج ← الفصل ← الوحدة ← الدرس) → الشارة «الشرح بالإنجليزية» → سؤال إنجليزي: ردّ إنجليزي مستند على الدرس (`ENGLISH_RAG_CONTEXT_PHRASE`) بلا أي علامة عربية → صورة مرفقة تُقرأ بالإنجليزية (`VISION_MARKER_EN`) → محاولة حقن تردّ بالرفض الإنجليزي (`SAFE_REFUSAL_EN_PHRASE`) لا العربي | serial — الكفتان تنهيان كلٌّ منهما جلسته؛ الشارة تُقرأ من الخادم فلا يمكن أن تخالف ما سيُقال |
| **LN2** | `language.spec.ts` | (PHASE 39، ومُعاد كتابته في PHASE 40 على المسار الخادمي) نفس الطالب في **منهج الإنجليزية** والمتصفح مهيّأ لتجهيزات الصوت: زر الميكروفون يطلب الإملاء بـ`en-US` (والنسخ الإنجليزي يصل للحقل للمراجعة) → إرسال → الردّ الإنجليزي يُنطق تلقائيًا من الخادم — **رغم أنّ التجهئة تسرد الصوت العربيّ أوّلًا** — وبلا تنبيه غيابِ صوت | يثبت أنّ الصوت يأخذ لغة المنهج من الخادم (D-042) لا قيمة مثبّتة؛ وفي PHASE 40 صار عدّ التشغيل بـ`expect.poll` على عدّاد الخادم لا بالشارة العابرة؛ وLN3 يثبت الحفاظ على اللغة في الاحتياطي |
| **LN3** | `language.spec.ts` | (PHASE 40) نفس سيناريو LN2 بعد حجب مسار النطق الخادمي بالـ503 (`forceNoServerSpeech`): الردّ الإنجليزي في درس إنجليزي يُنطق بصوت `en-US` من المتصفح، وبلا تنبيه غياب صوت، و`spoken` غير فارغ | الطرف الآخر من LN2: الخادم يعطي الصوت حين يكون مهيّأً، والاحتياطي يحفظ **اللغة نفسها** (D-043) حين لا يكون |
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
| A1 | `voice.spec.ts` | سؤال صوتي (زر 🎙️) → النص الممنسوخ في الحقل للمراجعة → تعديله → إرسال → رد مستند لـ RAG → نطق تلقائي للرد (نفس نص الفقاعة) → شارة استماع ظاهرة → ⏹ إيقاف يوقف النطق (إلغاء نسبي) | STT/TTS عبر stubs حتمية محقونة (`installVoiceStubs`) — لا يمكن أتمتة ميكروفون حقيقي. **PHASE 39**: الإملاء يطلب `ar-EG` والنطق يرسل `ar-EG` رغم وجود صوت إنجليزي في القائمة. **PHASE 40**: الصوت يأتي من الخادم (`blob:` حقيقي) و`spoken` فارغ، و⏹ يوقف `<audio>` عبر `pauses` |
| A2 | `voice.spec.ts` | رسالة **مكتوبة** لا تُنطق تلقائيًا؛ زر «🔊 استمع» في فقاعة رد يُنطق ذلك الرد؛ ⏹ يوقفه | **PHASE 39**: النطق بـ`ar-EG` في درس رياضيات، **بلا** تنبيه غياب صوت على جهاز يملكه. **PHASE 40**: التشغيل من بايتات الخادم (`plays=1` و`lastSrc` يبدأ بـ`blob:`)، والإيقاف يصل إلى المشغّل لا إلى `speechSynthesis` |
| A3 | `voice.spec.ts` | متصفح بلا `SpeechRecognition` → خطأ واضح «غير مدعوم في هذا المتصفح» + لا استماع ولا إرسال | |
| **A4** | `voice.spec.ts` | **PHASE 40** — جهاز بلا صوت للغة الدرس (صوت إنجليزي فقط) ودرس رياضيات، مع نطق خادمي سليم: التشغيل يقع فعلًا (`audio.plays=1` و`lastSrc` يبدأ بـ`blob:`) و**بلا** تنبيه غياب صوت، و`spoken` فارغ | معكوس الحالة التي بلّغ عنها المستخدم: بعد كشف أنّ الحلّ ليس في جهازه أصلًا صار الصوت من الخادم. وفارغية `spoken` دليل إضافي على أنّ غياب النطق لم يكن بسبب الصوت، طالما كان الخادم يعمل — فحالة «الجهاز بلا صوت» لم تعد بلاغًا |
| **A5** | `voice.spec.ts` | (PHASE 40) نطق خادمي محجوب بـ503 + جهاز فيه صوت عربي: التشغيل يعود إلى صوت المتصفح بوسم `ar-EG` و**بلا** تنبيه، و`spoken` يتضمّن نصّ الردّ | يثبت الصمت المقصود: غياب المزوّد لا يعني عجزًا، فلا يُخوّف الطالب ولا يُفقده النطق |
| **A6** | `voice.spec.ts` | (PHASE 40) نطق خادمي محجوب بـ503 + جهاز بلا صوت عربي: `spoken` يتضمّن الردّ بوسم `ar-EG` (فالمتصفح حاول) **مع** تنبيه «لا يوجد صوت العربية مثبّت» | أسوأ حالة ممكنة، وهي الوحيدة التي يبقى فيها تنبيه D-043 صحيحًا: عندها لا حلّ في الجهاز، فيُقال للطالب ما الحقّ أن يُقال فقط |
| D1 | `document.spec.ts` | إرفاق PDF حقيقي (ملف) → رد المعلم يقرؤه («قرأت الملف المرفق») + يعيد نص المستخرج («TutorFixturePDF 123») + RAG حاضر + بلا مكانة «لا يوجد محتوى مسترجع» + chip `msg-document` في فقاعة المستخدم | المسار الكامل: Browser→proxy→Fastify→استخراج PDF→documents input→mock |
| D2 | `document.spec.ts` | رسالة بلا نص + مستند DOCX فقط → زر الإرسال مفعّل + قراءة + نص المستخرج («TutorFixtureDOCX 456») | |
| D3 | `document.spec.ts` | ملف TXT يحوي **حقن تعليمات** («تجاهل كل التعليمات…») → رد آمن «أنا هنا لمساعدتك في درسنا فقط» **دون** علامة القراءة (لا استدعاء نموذج — tripwire خادمي يعيد فحص النص المستخرج) | أمني حقيقي عبر المسار الكامل |
| A1 | `admin.spec.ts` | Login كـadmin → زر «لوحة الإدارة» ظاهر → اختيار **الدرس الثاني** (الضرب والقسمة) في نطاق الاستيراد → رفع `curriculum.pdf` بملف حقيقي → رسالة نجاح بعدد المقاطع + صف في اللائحة بعنوان الوثيقة واسم الدرس و`chunkCount>0` (مقارنتها عبر `data-chunks`) | المسار الكامل: Browser→proxy→Fastify→ingest-file→RAG chunks→list |
| A2 | `admin.spec.ts` | إعادة رفع **نفس البايتات** لمنهج ذاته → خطأ الخادم «…مستورد مسبقًا» يظهر بوضوح في الواجهة (dedup حقيقي عبر UI) | |
| A3 | `admin.spec.ts` | الطالب (لا admin) **لا يرى زر الإدارة إطلاقًا** — نقطة الدخول مشروطة بالـrole في الواجهة (والحصانة الخادمية `requireAdmin` مُختبَرة في Vitest) | |
| A4 | `admin.spec.ts` | لوحة المدير تعرض بطاقتي **قسم الاشتراكات** (`admin-stats-subscriptions`: إجمالي/مميزة/سارية فعليًا/معدل التحويل) و**قسم الذكاء الاصطناعي** (`admin-stats-ai`: نداءات/توكن/تكلفة/إصابة كاش/وفورات تقديرية) — PHASE 27 | |
| A5 | `admin.spec.ts` | (PHASE 28) المدير يجوب النطاق حتى `curriculumId` (مصر → النظام → الصف → المادة → المنهج) → بطاقة **توليد أسئلة بالمفهوم** (`admin-gen-questions`) تُفعَّل → نتائج الكل مفهوم بلا أسئلة في المنهج المصري → تقرير «تم توليد 1 سؤالًا» (`admin-gen-result`) — مقارنة الكسور الوحيد بلا أسئلة بين 7 مفاهيم؛ المولّد يصبح قابلًا للعب في PR4 | serial — يتقدّم على practice.spec لأن «مقارنة الكسور» تُمرَّن في PR4 |
| A6 | `admin.spec.ts` | (PHASE 34) لوحة المدير تعرض بطاقة **«النشاط الزمني — آخر 14 يومًا»** (`admin-stats-trends`) بمجاميعها الثلاثة، **14 عمودًا** في كل من مخططَي الجلسات والرسائل (تطابق نافذة الـ UTC)، وقائمة **«الدروس الأكثر نشاطًا»** (`admin-trend-top-lesson`) بعنوان درس حقيقي | serial |
| P1 | `parent.spec.ts` | ولي الأمر (دور جديد قابل للتسجيل) يرى ابنه المربوط `parent-child-row` → يفتح تفاصيله: بطاقة تقدم ظاهرة + قسم الجلسات (قائمة ملخصات `parent-session-row` بعناوين/حالات/«رسائل: n» **أو** حالة الفارغة — الطالب التجريبي تتراكم عليه جلسات من اختبارات سابقة في القاعدة المشتركة فتقبَل الحالتان بـ`locator.or`) → زر عودة لقائمة الأبناء | serial |
| P2 | `parent.spec.ts` | الطالب يرى بطاقة «كود ولي الأمر» في الرئيسية وقيمتها (`link-code-value`) تساوي `SLH7KQ9M` — رمز المشاركة الذي يوظفه الوالد للربط | |
| P3 | `parent.spec.ts` | إدخال كود ربط خاطئ → خطأ «رمز الربط غير صحيح» يظهر بوضوح ويبقى نموذج الربط | |
| P4 | `parent.spec.ts` | (PHASE 23) الطالب يبدأ درسًا ويرسل سؤالًا + سؤال **حقن** → الوالد يفتح «التفاصيل» لأحدث جلسة: 4 مداخل زمنية + شارة «محجوب (أمان)» واحدة + تنبيه سلامة — و**لا يظهر** نصّا السؤالين ولا عبارة الرد الآمن (`SAFE_REFUSAL_PHRASE`) في الـbody | serial |
| P5 | `parent.spec.ts` | (PHASE 35) الطالب يفتح أول تمرين من خطته (`plan-practice`) ويغلق اللوحة (تمرين حقيقي ⇒ ختم «آخر ممارسة») → خروج → الوالد يفتح «تقدّم الطفل» → صفوف التقدّم تحمل **حداثة ممارسة** (`parent-progress-last-practice`) بجانب شارة المستوى | serial — يثبت أن ساعة الممارسة (لا التعرّض) هي ما يراه الوالد |
| O1 | `ocr.spec.ts` | الطالب يرفع PDF ممسوحًا ضوئيًا (`scanned.pdf`) → المدرّس يقرؤه عبر OCR («قرأت الملف المرفق» + نص يحوي `OCR_MARKER`) + RAG حاضر + شارة «نص ممسوح ضوئيًا» (غير موجودة في ملف بطبقة نصية) | المسار الكامل: Browser→proxy→استخراج صفري→OCR (mock)→tripwire→mock |
| O2 | `ocr.spec.ts` | admin يستورد PDF ممسوحًا ضوئيًا على درس → نجاح بعدد مقاطع + صف في اللائحة بـ`chunkCount>0` | المسار الكامل: ingest ← OCR ← chunks RAG |
| Q1 | `open.spec.ts` | (PHASE 30) الطالب يفتح «خطة ممارستك» → صف **«تبسيط الكسور»** (بسؤال مفتوح مبذور `answerKey=«2/3»`) يعرض زر **«سؤال مقالي»** (`plan-open-practice`) → اللوحة تعرض الحقل الحر `practice-open-input` → كتابة «2/3» → **موفقة** (`practice-feedback` تحوي «موفقة» — تغذية mock للصحيح) + شارة `practice-score` + إتقان `practice-mastery` → **`answerKey`/`correctIndex` غائبان عن `body` إطلاقًا** | سؤال المبذور الجديد حتمي النتيجة (تغطية تامة = 1.0)؛ النص اللاتيني/العربي متكافئ بعد التطبيع |
| Q2 | `open.spec.ts` | (PHASE 30) صف **«الطرح مع الاستلاف»** (بلا سؤال مفتوح مبذور) يعرض **«توليد سؤال مقالي»** (`plan-open-generate`) → يفتح اللوحة على سؤال مفتوح **مولَّد عند الطلب** (نص السؤال + حقل حر) → كتابة أي نص → `practice-feedback` غير فارغة و**لا `answerKey` في body** | التوليد مرتكز على مقاطع الدرس (mock حتمي)؛ نتيجة التصحيح تحتمل أيًا من النطاقات — التغذية الراجعة تُفحص لوجودها لا محتواها |
| E1 | `achievements.spec.ts` | طالب **جديد** يسجّل من واجهة التسجيل الحقيقية → بطاقة «خطتك» تظهر «مجانية» → يُنهي أول درس (درس كامل) → يفتح «🏆 إنجازاتي» → شارة «أول خطوة» مكتسبة (`data-earned=true`) وبقية الشارات مقفلة — وبعد PHASE 31+32: **12 صفًا** (`achievement-row`) وشارات التدرّج والمواظبة الأربع (`mastery_three`/`mastery_five`/`streak_three`/`streak_seven`) مقفلة | serial — التسجيل عبر UI لأن بدء الجلسة يحتاج رمز CSRF في localStorage |
| E2 | `achievements.spec.ts` | admin يفتح «الاشتراكات» في اللوحة → صف الطالب يُلتقط بالبريد → زر ترقية → `data-plan="premium"` → **نفس الطالب** يسجّل دخولًا ويجد بطاقته «مميزة» | المنح إداري بلا بوابة دفع؛ زر الإلغاء `sub-revoke-*` يعيد «مجانية» |
| PR1 | `practice.spec.ts` | (PHASE 24) الطالب يفتح «تمرين سريع» → سؤال MCQ مصر الأول يظهر (`practice-question`) **بلا `correctIndex`/`answerKey` في الصفحة** → اختيار خيار → تغذية راجعة (`practice-feedback` تطابق إما «إجابة صحيحة» أو «إجابة خاطئة») + شرح + شارة مستوى (`practice-mastery`) → «سؤال آخر» يعيد فتح لوحة السؤال → reload الرئيسية → قسم «إتقان المفاهيم» فيه **صف واحد على الأقل** بشارة مستوى (`mastery-concept-row`) | التمرين حتمي بلا AI؛ النتيجة تحتمل صح/خطأ (الخيار الأول) — التغذية الراجعة تقبَل الحالتين |
| PR2 | `practice.spec.ts` | (PHASE 25) بعد PR1 صار المفهوم الأضعف متتبَّعًا → «خطة ممارستك» (`plan-section` + `plan-list`) فيها **صف واحد على الأقل** (`plan-row`) بدرس (`plan-lesson`) وعدد أسئلة متاحة (`plan-questions`) وشارة مستوى (`plan-level`) وسهم اتجاه (`plan-trend`) → زر «تمرّن الآن» لأول مفهوم **ممارَس** (`plan-practice:not([disabled])`) يفتح لوحة التمرين (`practice-panel`) بسؤال حقيقي (`practice-question`) + شارة المفهوم (`practice-concept`) | الخطة قراءة نقيّة من الإتقان؛ E2E يتسامح مع أي حالة تراكمية (استهداف `:not([disabled])`) |
| PR3 | `practice.spec.ts` | (PHASE 26) بعد إجابات PR1/PR2 → شاشة الإنجازات (`achievements-screen`) تعرض الشارتين الجديدتين: `practice_starter` «انطلاقة التمرين» **مكتسبة** (`data-earned="true"`) لأن طالب العرض أجب عن إجابة واحدة على الأقل، و`mastery_first` «أول إتقان» **مقفولة** (`data-earned="false"` — لا مفهوم بعد في «متقن») | E2E يتسامح مع أي نتيجة إجابة سابقة («انطلاقة» أول إجابة مهما كانت نتيجتها)؛ «أول إتقان» لا تُكتسب إلا بـ≥0.8 على مفهوم — خارج نطاق الجلسة |
| PR4 | `practice.spec.ts` | (PHASE 28) بعد A5 (الذي يولّد سؤال «مقارنة الكسور» إداريًا) → الطالب يفتح الرئيسية: صف الخطة لمنهجه فيه «مقارنة الكسور» بصفر أسئلة سابقًا يحمل الآن **«تمرّن الآن»** → `practice-question` يعرض النص المولّد «أي العبارات التالية وردت في الدرس» → اختيار أول خيار → `practice-feedback` → reload → **قسم «إتقان المفاهيم» فيه صف «مقارنة الكسور»** (`mastery-concept-row` filter) | سؤال طرحة A5 قبل practice.spec (admin<practice أبجديًا، قاعدة مشتركة)؛ النتيجة تحتمل صح/خطأ — التغذية الراجعة تقبَل الحالتين |
| PR5 | `practice.spec.ts` | (PHASE 33) الطالب يبدأ درسًا حقيقيًا (بداية الرحلة الكاملة مع اختيار المنهج) → يرسل رسالة → «إنهاء الجلسة» → يعود الرئيسية → «خطة ممارستك» سليمة (مفاهيم مفاهيميه معروضة بخطة مرتّبة — مسار المذاكرة لم يكسر الخطة) + صف الجلسة في القائمة منتهي | serial — يُنهي جلسة للطالب التجريبي المشترك فيبقى الدعمُ للجلسات في recap R1/R2 (قاعدة مشتركة تحتمل أي حالة تراكمية) |
| PR6 | `practice.spec.ts` | (PHASE 35) بعد تمرين حديث: صفوف الخطة تحمل **لا** شارة «راجع قبل أن ينسى» (`plan-due` صفّ = 0) مع بقاء `plan-level` ظاهرًا — إثبات أن الاستحقاق (عتبة 14 يومًا) ليس تسمية شاملة لكل الصفوف؛ عتبة الترتيب نفسها مُغطّاة في Vitest | serial |
| R1 | `recap.spec.ts` | (PHASE 29) الطالب يبدأ درسًا → رسالة فحص (`R1_PROBE`) + رسالة سرية (`R1_SECRET`) → إنهاء → يعود الرئيسية → على **صف جلسته بالذات** (`[data-session-id]` لأن القائمة تصاعدية) يظهر «ملخص الجلسة» (`session-recap-button`) → البطاقة (`session-recap`) بعنوان يحمل اسم **درسه** (`recap-headline`) + إحصائيات (`recap-stats` «رسالة منك») + نقاط قوة واقتراحات → **لا يظهر نصّ الرسالتين** في البطاقة | serial — الجلسة الجديدة تُعرف بفرق «الجلسات النشطة قبل/بعد» كالمسار journey |
| R2 | `recap.spec.ts` | (PHASE 29) الطالب التجريبي ينهي درسًا برسالة فحص (`R2_PROBE`) → ولي الأمر المسجّل دخوله يفتح أحدث جلسة (القائمة تنازلية → `.first()`) → «عرض الملخص» (`parent-recap-button`) → بطاقة (`parent-session-recap`) بعنوان يحمل **نفس اسم الدرس** (`parent-recap-headline`) + «رسالة منك» — و**لا يظهر** نص رسالة الطالب في البطاقة ولا في `body` كاملًا | serial — الجلسة الجديدة هي الأحدث في قاعدة مشتركة؛ R1/R2 بعد parent.spec أبجديًا |

## 8. قيود معروفة

- `workers: 1` + `fullyParallel: false` إجباريان (قاعدة مشتركة + حساب تجريبي واحد)؛ داخل كل ملف `mode: "serial"`.
- المتصفح الافتراضي Chromium فقط (يمكن إضافة مشاريع أخرى إلى `projects`).
- الاختبارات تتوقع مزوّد AI افتراضيًا `mock`؛ لا مفاتيح حقيقية مطلوبة.
- `maxLength=4000` في حقل الدردشة يحجب تجاوز الطول من المستخدم — لذلك اختُبر خطأ API بواسطة سيناريو CSRF (E) بدل رسالة أطول من الحد (إصلاح موثق في DECISIONS D-013).
- Web Speech API (STT/TTS) لا يمكن أتمتة **صوت حقيقي** (ميكروفون/مخرجات) بشكل حتمي — لذلك تحقن اختبارات الصوت (A1–A3) stubs لـ `SpeechRecognition`/`speechSynthesis` (تسجيل حتمي للـspeak/cancel) وتعتمد على تأكيدات **نسبية** لعد الإلغاء لأن React StrictMode في dev يعيد تركيب غرفة الدردشة فيشغّل cleanup «مغادرة الغرفة» مرة واحدة مبكرًا.
- لتشغيل الاختبارات لا بد أن يكون المنفذان 3107 و5173 حرين؛ اختبار Playwright يرفض الميناءين المشغولين (لا إعادة استخدام تلقائية لقاعدة التطوير).
