# API SPEC — AL FAROUQ AI

> آخر تحديث: 2026-09-23 — مصدر الحقيقة: Fastify routes في `server/src/modules`. كل responses JSON.
> Base: `/api` — Auth: session cookie (`alfarouq_session`) httpOnly + CSRF header للـmutations.

## 1. المصادقة

| Method | Route | الوصف | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | إنشاء حساب، يقبل `{email,password,displayName, role?: "student"\|"parent", gradeCode?}` — `role` افتراضيًا `student`؛ للطالب صف مدرسي، للوالد حساب بدون صف | public |
| POST | `/api/auth/login` | `{email,password}` → set cookie + CSRF | public |
| POST | `/api/auth/logout` | إبطال الجلسة | session |
| GET | `/api/auth/me` | المستخدم الحالي + `student` **أو** `parent` + `linkCode` (رمز مشاركة ولي الأمر للطالب فقط — `null` للوالدين) | session |

## 2. Curriculum (مفتوح للمصادق)

| Method | Route |
|---|---|
| GET | `/api/curriculum/countries` |
| GET | `/api/curriculum/countries/:countryCode/education-systems` |
| GET | `/api/curriculum/education-systems/:systemId/grades` |
| GET | `/api/curriculum/grades/:gradeId/subjects` |
| GET | `/api/curriculum/subjects/:subjectId/curricula?gradeId=` |
| GET | `/api/curriculum/curricula/:curriculumId/terms` |
| GET | `/api/curriculum/curricula/:curriculumId/units` |
| GET | `/api/curriculum/units/:unitId/lessons` |
| GET | `/api/curriculum/lessons/:lessonId/concepts` |
| GET | `/api/curriculum/lessons/:lessonId` (تفاصيل + مفاهيم) |

## 3. الطالب والجلسات

> كتالوج المنهج قراءة نقيّة (public) ومرشَّح بالبلد في كل مستوى — PHASE 16: البذر النموذجي يشمل **مصر + السعودية** (دولة→نظام→صف→مادة→منهج←فصل←وحدة←درس) مع عزل تام بين البلدين؛ مادة «الرياضيات» كتالوج عالمي مشترك.

| Method | Route | الوصف |
|---|---|---|
| PUT | `/api/me/student` | تحديث بروفايل الطالب (grade مرن) |
| POST | `/api/sessions` | `{curriculumId, gradeId, subjectId, lessonId?}` → ينشئ Learning Session |
| GET | `/api/sessions` | جلساتي (مع حالة كل منها) |
| GET | `/api/sessions/:id` | جلسة + رسائلها (مملوكة للطالب فقط) |
| POST | `/api/sessions/:id/messages` | `{content}` → رد المدرس (RAG+AI) — **المسار العمودي الكامل** |
| PATCH | `/api/sessions/:id` | `{status:'ended', endedReason}` |
| POST | `/api/sessions/:id/end` | إنهاء الجلسة (ينشئ recap للذاكرة) |
| GET | `/api/sessions/:id/recap` | **PHASE 29 (D-033)** — ملخص الجلسة الآمن `{recap: SessionRecap \| null}` — يُبنى من **بيانات وصفية فقط** (عنوان الدرس، مفاهيم الجلسة، عدّادات: رسائل/مدة/مرفقات/أعلام أمان) عبر عملية LLM `recap` مع حارس «لا نص حرفي» وسقوط حتمي آمن (`fallback`)؛ جلسة بلا رسائل → `null`؛ student فقط (غير طالب 403، جلسة الآخرين 403 ملكية، غير موجودة 404) |
| GET | `/api/progress/:studentId/concepts` | إتقان المفاهيم + نقاط القوة/الضعف |
| GET | `/api/progress/me` | **PHASE 24** — تقدمي + `mastery` (مفاهيمي: `mastery` خام + `decayedMastery` + `level` + `labelAr` عربية + `attempts`/`correct` + `daysSinceLastPractice` + `trend` صعود/ثبات/هبوط — الانحلال قراءةً فقط) + `progress` + `tutorUsageToday` | student فقط |

> مرفقات الطالب (§3): `POST /api/sessions/:id/messages` يقبل `{content, image?, document?}` حيث `document = {dataUrl, fileName}` (النوع يُشتق من dataUrl؛ حد `MAX_FILE_KB`، فحص MAGIC bytes، استخراج محدود `MAX_DOCUMENT_CHARS`). ممسوح ضوئيًا (PDF/DOCX بلا نص) → **قراءة تلقائية بالـOCR** (PHASE 19/D-023) تُخزَّن في `messageAttachments.ocrApplied` وتُعلّم الرد بـ`ocrUsed:true` و`messageAttachments[].ocr:true` (شارة «نص ممسوح ضوئيًا» في الواجهة)؛ فشل المزوّد → يحمل الرد النص كما لو كان استخراجًا صفريًا (لا انهيار).

> ملخص الجلسة (§3 — PHASE 29/D-033): `SessionRecap = {headline, focus, lessonTitle, durationMinutes, userMessages, tutorMessages, attachmentCount, safetyFlagged, concepts:[{title,attempts,correct}], strengths[], suggestions[], fallback}` — العملية `recap` لا تتلقى إلا البيانات الوصفية، وحارس «لا نص حرفي» يرفض أي ناتج يعيد إنتاج رسالة (سقوط حتمي آمن بـ`fallback:true`)؛ المزوّد mock حتمي (`mock-recap`) والديناميكية تسجَّل استخدامًا (`ai_usage_logs.operation="recap"`).

## 4. المعرفة (إدارة) — للمستخدم admin فقط

| Method | Route | الوصف |
|---|---|---|
| POST | `/api/admin/documents/ingest` | إضافة مستند نصي/CSV `{title, content, kind?, scope, source?, conceptIds?}` → ingestion كامل (chunk+embed) |
| POST | `/api/admin/documents/ingest-file` | **استيراد ملف منهج PDF/DOCX (و txt/md)** `{fileName, dataUrl, scope, title?, source?, conceptIds?}` — dataUrl قاعدة64، استخراج النص ثم chunk+embed، تخزين البايتات الخام (BLOB) + sha256 على النسخة؛ `kind` يُشتق من mime |
| GET | `/api/admin/documents` | قائمة المستندات (مع حالة ingestion) |
| GET | `/api/admin/stats` | **إحصاءات تشغيلية (PHASE 17 + PHASE 27)** — عدّادات لحظية بلا جداول جديدة: `users{total,students}`, `sessions{total,active,ended}`, `messages{total,user,tutor}`, `documents{total,ready}`, `chunks`, `curricula`, `lessons` + **`subscriptions{total,free,premium,active,conversionRate}`** (الخطة المخزّنة + «المميزة السارية فعليًا» = premium وtrialing/active وغير منتهية + تحويل بأعشار %) + **`ai{calls,byOperation,tokens,costUsd,cache{hits,misses,hitRate,size,maxEntries},estimatedSavingsTokens,estimatedSavingsUsd}`** (من `aiUsageLogs` + `ai.cacheStats()`؛ الوفورات = متوسط نداءات العمليات القابلة للتخزين المسجَّلة × الإصابات، أو متوسط المنصة عند غيابها) — عدّادات فقط بلا محتوى رسائل |
| POST | `/api/admin/questions/generate` | **PHASE 28 + 30** — توليد جماعي `{conceptId|lessonId|curriculumId, kind?: "mcq" \| "open"}` (نطاق واحد إلزامي؛ `kind` افتراضي `mcq`) → `{result: {generated, skipped, failed, items:[{conceptId, title, status, error?}]}}` — سؤال `easy` واحد لكل مفهوم بلا أسئلة **من نوعه** (عدّاد لكل نوع — المغطّى يُتخطّى)، مرتكز على مقاطع الدرس (عملية LLM `question_gen` قابلة للتخزين المؤقّت، mock حتمي أوفلاين؛ السؤال المفتوح يخزّن `answerKey` خادميًا)؛ **idempotent** (إعادة التشغيل تولّد 0)؛ درس بلا مقاطع → `failed` «لا يوجد محتوى»؛ `400` عند غياب/تعدد النطاق أو `kind` غير صالح؛ **بيانات وصفية فقط** — لا محتوى أسئلة في الاستجابة؛ يُسجَّل تدقيق `question.generate` | admin فقط |

قيود `ingest-file`:
- النوع يُشتق من `Content-Type` في dataUrl: `application/pdf` → pdf، `...wordprocessingml.document` → docx، غير ذلك → text — **مع فحص توافق MAGIC bytes** (PHASE 15): البايتات الفعلية يجب أن تطابق النوع المعلن، وإلا `400 FILE_TYPE_MISMATCH` (نص مُعاد تسميته `.pdf`، ZIP عام مدّعٍ أنه `.docx`، PDF متنكّر بنص — يُرفض قبل أي استخراج/تخزين). النقطة مشتركة (`parseDocumentDataUrl`) فتغطي مسار الطالب في §3 أيضًا.
- سقف الحجم: `MAX_CURRICULUM_FILE_KB` (افتراضي 20480 = 20MB) والنص المُستخرج `MAX_CURRICULUM_DOCUMENT_CHARS` (افتراضي 200000).
- ممسوح ضوئيًا (رأس PDF/DOCX سليم بلا نص يُستخرج) → **إنقاذ تلقائي بالـOCR** (`AI_OCR_PROVIDER`: mock افتراضيًا/Gemini في الإنتاج، سقف `MAX_OCR_CHARS`) قبل `ingestFile` — النص المعترف به يدخل أنابيب chunking/embedding ويبقى **محتوى `<context>`**؛ فشل المزوّد → هبوط آمن `400 EMPTY_DOCUMENT` (لا انهيار)؛ TXT/MD لا تُقرأ OCR إطلاقًا (ملف قصير صادق يبقى `EMPTY_DOCUMENT`).
- تكرار نفس البايتات لنفس المنهج → `409 DOCUMENT_ALREADY_INGESTED`.
- المحتوى المستورد يُسترجَع في `<context>` فقط (محتوى منهج، ليس تعليمات) — تمامًا كمسار النص.

## 5. Response errors

- 400 validation (بينها رموز أخطاء إدارة المستندات: `EMPTY_DOCUMENT`، `DOCUMENT_TOO_LARGE`، `UNSUPPORTED_DOCUMENT_TYPE`، `INVALID_DOCUMENT_FORMAT`، `FILE_TYPE_MISMATCH`، ومن PHASE 21 `VECTOR_DIMENSION_MISMATCH`)، 401 غير مصادق، 403 منع/مُرتد، 404 غير موجود، 409 تعارض (مثل `DOCUMENT_ALREADY_INGESTED`)، 429 معدل مفرط، 500 خطأ خادم، 503 خدمة خارجية غير متاحة (`VECTOR_STORE_UNAVAILABLE` — المعترف به عند `VECTOR_STORE=qdrant` ومخزنه منقطع؛ الاسترجاع نفسه يهبط آمنًا ولا يُخطئ).
- الشكل: `{ error: { code, message } }` — بدون تفاصيل داخلية.

## 6. مثال المسار العمودي

```
1) POST /api/auth/register
2) GET  /api/curriculum/countries → مصر
3) GET  .../education-systems → الأساسي
4) GET  .../grades → السادس
5) GET  .../subjects → الرياضيات
6) GET  .../curricula → منهج 2024/2025
7) GET  .../units → الوحدة 1
8) GET  .../lessons → الدرس 1
9) POST /api/sessions {..lessonId}
10) POST /api/sessions/:id/messages {content:"اشرح موضوع الجمع"}
11) GET  /api/sessions/:id (تاريخ الحوار)
```

## 7. استيراد ملف منهج (مثال)

```
1) تسجيل دخول admin → cookie + CSRF
2) POST /api/admin/documents/ingest-file
   { fileName: "unit1.pdf",
     dataUrl: "data:application/pdf;base64,JVBERi0...",
     scope: { countryId, gradeId, subjectId, curriculumId, unitId, lessonId },
     title: "الوحدة 1" }
   → 201 { document: { documentId, versionId, chunkCount } }
3) GET  /api/admin/documents (list)
```

## 8. أولياء الأمور (PHASE 18 + 23 + 29)

> نهايات القراءة **قراءة فقط** وكلها تشترط رابطًا صريحًا في `students_parents` بين الوالد والطفل — طفل غير مربوط = `404 NOT_FOUND` (بلا مؤشر وجود). **لا يُكشف محتوى رسائل في أي استجابة** — عدّادات وفوق-بيانات فقط؛ في تفاصيل الجلسة (PHASE 23) لا يُحدَّد عمود `content` من قاعدة البيانات أصلًا، وفي ملخص الجلسة (PHASE 29) تُمرَّر البيانات الوصفية نفسها للمزوّد مع حارس لا-نص-حرفي — فنصوص المحادثة لا تدخل أي استجابة من قراءات الوالد.

| Method | Route | الوصف | Auth |
|---|---|---|---|
| POST | `/api/parent/link` | `{code}` — ربط طفل بِكود المشاركة (case-insensitive عبر `toUpperCase`) → 201 بطاقة الطفل؛ `400 INVALID_LINK_CODE`؛ `409 ALREADY_LINKED` | parent فقط |
| GET | `/api/parent/children` | قائمة الأبناء المربوطين (اسم/صف/مناهج/عدد جلسات/آخر جلسة) | parent فقط |
| GET | `/api/parent/children/:studentId` | بطاقة كاملة: هوية + تقدّم (`progressDetail`: مفاهيم تحمل **شارة مستوى عربية `labelAr`/`level`/`decayedMastery`/`trend`** + نقاط قوة/ضعف) + ملخصات جلسات (درس/تاريخ/حالة/`userMessages`/`tutorMessages`) + كود الطالب الحالي | parent فقط |
| GET | `/api/parent/children/:studentId/sessions/:sessionId` | **PHASE 23** — تفاصيل جلسة: `session` (درس/حالة/تواريخ/`durationMinutes`/عدّادات/سبب النهاية) + `concepts` (مفاهيم عُرضت من `assessments`) + `safety.flaggedTurns` + `timeline` (لكل رسالة: `role`/`kind`/`createdAt`/`attachments[{mimeType,fileName,sizeBytes,itemKind,ocrApplied}]`/`safetyFlagged`) — **بلا `content` ولا بايتات مرفقات ولا `sha256`**؛ جلسة لا تخصّ الطفل المربوط = `404` | parent فقط |
| GET | `/api/parent/children/:studentId/sessions/:sessionId/recap` | **PHASE 29 (D-033)** — `{recap: SessionRecap \| null}` — **نفس الحمولة التي يقرؤها الطالب** من مسارّه: بيانات وصفية فقط (عنوان/مفاهيم/عدّادات) + حارس لا-نص-حرفي + سقوط آمن؛ طفل غير مربوط أو جلسة لا تخصه = `404` قبل أي قراءة | parent فقط |
| DELETE | `/api/parent/children/:studentId` | فك الربط → 204؛ غير مربوط → 404 | parent فقط |

**عزل الأدوار**: الطالب على أي `/api/parent/*` → `403 FORBIDDEN`؛ ولي الأمر على `/api/sessions` (POST) و`/api/progress/me` → `403 FORBIDDEN` (و`GET /api/sessions` = قائمة فارغة). التسجيل: `POST /api/auth/register` مع `role: "parent"`. `GET /api/auth/me` للطالب يعرض `linkCode` (مولّد بـ`parentLinkCode()` — 8 محارف من `A-HJ-NP-Z2-9`).

## 9. الاشتراكات والإنجازات (PHASE 20) — فوترة بلا بوابة دفع

> بطاقة «خطتك» في الواجهة تقرأ هذه النهايات؛ `dailyLimit` رقم فعلي: مجاني = `DAILY_MESSAGE_LIMIT` (خادميًا في محرك المدرّس)، مميز ساري = `PREMIUM_DAILY_MESSAGE_LIMIT` (0 = بلا حدود). الخطة المميزة «سارية» فقط عند `status ∈ trialing|active` **و** `expiresAt` غير ماضٍ — وإلا تهبط تلقائيًا لحدود المجاني (الصف يبقى معلنًا بالخطة الممنوحة).

| Method | Route | الوصف | Auth |
|---|---|---|---|
| GET | `/api/me/subscription` | ملخص اشتراكي (يُنشأ **كسولًا** `free`/`trialing` عند أول قراءة): `{plan, status, startedAt, expiresAt?, dailyLimit}` | student فقط |
| GET | `/api/achievements/me` | شاراتي: `{total, earned, achievements: [{code, title, description, icon, awardedAt|null, threshold}]}` — **10 تعريفات** (6 PHASE 20: أول خطوة/مستكشف/عالِم صغير/بارع الحوار/قارئ نهم/مصوّر الأسئلة + 2 PHASE 26: `practice_starter` «انطلاقة التمرين» أول إجابة + `mastery_first` «أول إتقان» أول مفهوم «متقن» بالدرجة المعروضة + 2 PHASE 31: `mastery_three` «متقن 3 مفاهيم» و`mastery_five` «متقن 5 مفاهيم» — نفس عدّاد المستوى المعروض) | student فقط |
| GET | `/api/admin/subscriptions` | قائمة الاشتراكات (صفوف الطلاب الموجودين): `{studentId, studentEmail, plan, status, startedAt, expiresAt?, dailyLimit}` — أحدث بدء أولًا | admin فقط |
| PUT | `/api/admin/subscriptions/students/:studentId` | منح/إلغاء: `{plan: "free"|"premium", status?: "trialing"|"active"|"past_due"|"cancelled", expiresAt?}` → upsert + سجل تدقيق `subscription.update` | admin فقط |

**عزل الأدوار**: والد أو admin على `GET /api/me/subscription` و`/api/achievements/me` → `403`؛ طالب على `/api/admin/subscriptions*` → `403`؛ طالب مجهول على PUT → `404`. **منح الإنجازات خادمي بحت** — يُطلق من `SessionService` على أحداث (`session_ended`, `user_message`, `document_attached`, `vision_attached`) و**من `PracticeService` على (`practice_answer`, `mastery_achieved` — PHASE 26)** بمنح `onConflictDoNothing` مضاد للتكرار وبعدّادات مقيّدة بجلسات الطالب نفسه؛ فشل أي منح لا يكسر الجلسة/الإجابة (best-effort).

## 10. التمرين + خطة الممارسة (PHASE 24 + 25 + 26 + 28 + 30) — تصحيح حتمي + تصحيح LLM للإجابات المفتوحة يغذّيان التقييمات

> حلقة ضعف → ممارسة → إتقان: السؤال يُختار من **أضعف المفاهيم المتتبعة أولًا** (الأقل إتقانًا/الصحيح) ثم أي سؤال ضمن مناهج الطالب المسجَّلة (الأقدم أولًا — حتمي). تصحيح الـMCQ **محلي حتمي بلا أي استدعاء AI**، وكل إجابة تكتب صف `answers` وتدرّب تقييمًا (`recordAssessment` نوع `exercise`) فيتغيّر مستوى إتقان المفهوم لحظيًا (يُشاهَد في `GET /api/progress/me` ولوحة الوالد وتغذية الراجعة وخطة الممارسة). **خطة الممارسة (PHASE 25)** تُرتِّب كل مفهوم متتبَّع «الأضعف أولًا» (انحلال ثم إهمال ثم معرّف) مع درسه وعدد أسئلته المتاحة ضمن مناهج الطالب المسجَّلة — فتتحول البيانات إلى إجراء («تمرّن الآن») في الواجهة. **التوليد (PHASE 28)**: المفاهيم غير المتتبعة لمناهج الطالب المسجَّلة **تُدرَج الآن في الخطة** (`tracked:false`, إتقان 0) — مرتبة بعد المتتبعة — فتكشف المفاهيم بلا أسئلة وتتيح «توليد سؤال» يغلق الفجوة أوفلاين. **الإجابة المفتوحة (PHASE 30/D-034)**: تفعيل أسئلة `type:"open"` — الإجابة الحرة تُصدَّر عبر عملية LLM **ديناميكية** `grade_open` (خارج التخزين المؤقّت؛ `<reference>` = المفتاح النموذجي في رسالة النظام، `<student_answer>` في رسالة المستخدم، سقف `1500` حرفًا، تصحيح ≥`0.7` صحيح / ≥`0.4` قريب) مع حارس «لا نص حرفي» + سقوط قوَالبي حتمي يمنعان وصول `answerKey` للطالب — والنتيجة `{correct, score, feedback, ...}` تدرّب الإتقان كالـMCQ.

| Method | Route | الوصف | Auth |
|---|---|---|---|
| GET | `/api/practice/question?conceptId=&type=` | `{question}` حيث `question: {id, content, options: string[] \| null, type: "mcq" \| "open", conceptId, conceptTitle, difficulty}` أو `null` عند لا سؤال؛ `?type=mcq` (افتراضي — الخيارات نص فقط) أو `?type=open` (**PHASE 30** → `options:null` + `type:"open"` لتستقبل الواجهة نصًا حرًا)؛ قيمة أخرى → `400 INVALID_TYPE`؛ **المفتاح لا يغادر الخادم** — `correctIndex`/`answerKey`/`optionsJson` الخام غائبة تمامًا من الـJSON | student فقط |
| GET | `/api/practice/plan` | **PHASE 25 + 28 + 30** — `{plan}` خطة مرتّبة `[{conceptId, code, title, lessonId, lessonTitle, mastery, decayedMastery, level, labelAr, trend, attempts, correct, daysSinceLastPractice, availableQuestions, openQuestions, tracked}]` — «الأضعف أولًا» (انحلال ثم إهمال ثم معرّف)، **المتتبَّع قبل غير المتتبَّع** (PHASE 28)، `availableQuestions` بعدّاد MCQ و`openQuestions` (**PHASE 30**) بعدّاد الأسئلة المفتوحة **ضمن مناهج الطالب المسجَّلة فقط**؛ قراءة نقيّة بلا كتابة وبلا خيارات/مفتاح | student فقط |
| POST | `/api/practice/questions/:questionId/submit` | سؤال MCQ: `{optionIndex}` (و`timeTakenSeconds?` **PHASE 31** — صحيح 1..600 يقيسه العميل بين العرض والإرسال؛ فاسد/خارج النطاق → يُسقَط ويُخزَّن null) → `{correct: boolean, explanation: string|null, mastery: {score, decayedScore, level, labelAr}|null}` (null عند سؤال بلا مفهوم)؛ التصحيح يعتمد `correctIndex` خادميًا ويُدرّب التقييم — **PHASE 26: الدلتا حسب `difficulty`** (`+0.15`/`−0.1` سهل، `+0.175`/`−0.125` متوسط، `+0.2`/`−0.15` صعب على صف موجود؛ `0.6/0.1` أول محاولة محايدة للصعوبة). **PHASE 31: الزمن يضرب الدلتا بمضاعِف قوة الإشارة** (سريع <10ث ×1.25 / عادي ×1 / بطيء >60ث ×0.75 / مجهول ×1 — باتجاه واحد للصح والخطأ؛ المحاولة الأولى تبقى محايدة مهما كانت السرعة). سؤال **مفتوح (PHASE 30)**: `{answer}` (نص حر ≤ `1500` حرفًا) → `{correct, score: number|null, feedback: string|null, explanation: string|null, mastery}` عبر عملية LLM `grade_open` (`<reference>` نظامًا من `answerKey`/<`student_answer>` مستخدمًا؛ حارس لا-نص-حرفي + سقوط قوَالبي حتمي — التغذية **بلا مفتاح أبدًا**؛ لا يُقبل الزمن — `answers.answer_seconds` يحفظ null دائمًا). كلا النوعين يكتب صف `answers` (بـ`content` = الخيار المختار أو النص الحر) ويقيّم شارات التمرين/الإتقان (best-effort) | student فقط |
| POST | `/api/practice/generate` | **PHASE 28 + 30** — توليد ذاتي `{conceptId, kind?: "mcq" \| "open"}` (افتراضي `mcq`) → `{question}` (عام — بلا مفتاح كالعادة)؛ سؤال مرتكز على مقاطع درس المفهوم (عملية LLM `question_gen` قابلة للتخزين، mock حتمي أوفلاين؛ النوع يُعلَّم في رسالة المستخدم «النوع: mcq\|open») يُخزَّن ويُمارَس فورًا؛ `404` لمفهوم مجهول/خارج مناهج الطالب، `409` عندما يكون للمفهوم سؤال من **نفس النوع**، `503` عندما يكون درس المفهوم بلا مقاطع أو فشل توليد القالب، `400 INVALID_KIND` لقيمة نوع غير صالحة | student فقط |

**قواعد وعزل**: غير مسجَّل في منهج السؤال (`curriculumEnrollments`) → `404` بلا مؤشر وجود (والسؤال لا يُخدم أصلًا عبر `question: null`)؛ ولي أمر/أدمن على أي `/api/practice/*` → `403 FORBIDDEN` (المسار مسجَّل بنطاق `student` قبل body validation)؛ غياب/خروج `optionIndex` عن حدود الخيارات أو غير عددي → `400 INVALID_OPTION`. السؤال/الخيارات/الشرح يُقرآن من `questions.optionsJson` (خادمي فقط). **PHASE 30 — نوعان من الإرسال**: `optionIndex` لـ`mcq` فقط (نص حر على MCQ → `400 INVALID_OPTION`) و`answer` لـ`open` فقط (خيار على سؤال مفتوح → `400 INVALID_ANSWER`) وكلاهما معًا → `400 INVALID_SUBMIT`؛ إجابة مفتوحة فارغة أو أطول من `1500` حرفًا → `400 INVALID_ANSWER`؛ `answerKey` يُقرأ من قاعدة البيانات خادميًا فقط (سؤال مفتوح بلا مفتاح → خطأ داخلي) — والتغذية الراجعة والدرجة/الشرح لا يعيدان المفتاح أبدًا. **التوليد (PHASE 28 + 30)**: طالب لا يملك مفهومًا (مجهول/خارج مناهجه) → `404`، مفهوم مغطّى بسؤال من نفس النوع → `409`، درس بلا مقاطع أو قالب فاشل → `503`؛ الإدارة تطلب نطاقًا واحدًا (0 أو أكثر → `400`). **السعودية بلا أسئلة تجريبية** في البذر عمدًا — إثبات نطاق التمرين لكل منهج على حدة (وتستفيد من التوليد الإداري لتغطية مفاهيمها الأربعة)؛ البذر المصري يشمـل سؤالين مفتوحين («تبسيط الكسور» مفتاحه «2/3»، «القسمة المطولة» مفتاحه «26») لجعل E2E حتمي النتيجة.