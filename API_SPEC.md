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
| GET | `/api/progress/:studentId/concepts` | إتقان المفاهيم + نقاط القوة/الضعف |

> مرفقات الطالب (§3): `POST /api/sessions/:id/messages` يقبل `{content, image?, document?}` حيث `document = {dataUrl, fileName}` (النوع يُشتق من dataUrl؛ حد `MAX_FILE_KB`، فحص MAGIC bytes، استخراج محدود `MAX_DOCUMENT_CHARS`). ممسوح ضوئيًا (PDF/DOCX بلا نص) → **قراءة تلقائية بالـOCR** (PHASE 19/D-023) تُخزَّن في `messageAttachments.ocrApplied` وتُعلّم الرد بـ`ocrUsed:true` و`messageAttachments[].ocr:true` (شارة «نص ممسوح ضوئيًا» في الواجهة)؛ فشل المزوّد → يحمل الرد النص كما لو كان استخراجًا صفريًا (لا انهيار).

## 4. المعرفة (إدارة) — للمستخدم admin فقط

| Method | Route | الوصف |
|---|---|---|
| POST | `/api/admin/documents/ingest` | إضافة مستند نصي/CSV `{title, content, kind?, scope, source?, conceptIds?}` → ingestion كامل (chunk+embed) |
| POST | `/api/admin/documents/ingest-file` | **استيراد ملف منهج PDF/DOCX (و txt/md)** `{fileName, dataUrl, scope, title?, source?, conceptIds?}` — dataUrl قاعدة64، استخراج النص ثم chunk+embed، تخزين البايتات الخام (BLOB) + sha256 على النسخة؛ `kind` يُشتق من mime |
| GET | `/api/admin/documents` | قائمة المستندات (مع حالة ingestion) |
| GET | `/api/admin/stats` | **إحصاءات تشغيلية (PHASE 17)** — عدّادات لحظية بلا جداول جديدة: `users{total,students}`, `sessions{total,active,ended}`, `messages{total,user,tutor}`, `documents{total,ready}`, `chunks`, `curricula`, `lessons` |

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

## 8. أولياء الأمور (PHASE 18)

> نهايات القراءة **قراءة فقط** وكلها تشترط رابطًا صريحًا في `students_parents` بين الوالد والطفل — طفل غير مربوط = `404 NOT_FOUND` (بلا مؤشر وجود). **لا يُكشف محتوى رسائل في أي استجابة** — عدّادات فقط.

| Method | Route | الوصف | Auth |
|---|---|---|---|
| POST | `/api/parent/link` | `{code}` — ربط طفل بِكود المشاركة (case-insensitive عبر `toUpperCase`) → 201 بطاقة الطفل؛ `400 INVALID_LINK_CODE`؛ `409 ALREADY_LINKED` | parent فقط |
| GET | `/api/parent/children` | قائمة الأبناء المربوطين (اسم/صف/مناهج/عدد جلسات/آخر جلسة) | parent فقط |
| GET | `/api/parent/children/:studentId` | بطاقة كاملة: هوية + تقدّم (`progressDetail`: مفاهيم + نقاط قوة/ضعف) + ملخصات جلسات (درس/تاريخ/حالة/`userMessages`/`tutorMessages`) + كود الطالب الحالي | parent فقط |
| DELETE | `/api/parent/children/:studentId` | فك الربط → 204؛ غير مربوط → 404 | parent فقط |

**عزل الأدوار**: الطالب على أي `/api/parent/*` → `403 FORBIDDEN`؛ ولي الأمر على `/api/sessions` (POST) و`/api/progress/me` → `403 FORBIDDEN` (و`GET /api/sessions` = قائمة فارغة). التسجيل: `POST /api/auth/register` مع `role: "parent"`. `GET /api/auth/me` للطالب يعرض `linkCode` (مولّد بـ`parentLinkCode()` — 8 محارف من `A-HJ-NP-Z2-9`).

## 9. الاشتراكات والإنجازات (PHASE 20) — فوترة بلا بوابة دفع

> بطاقة «خطتك» في الواجهة تقرأ هذه النهايات؛ `dailyLimit` رقم فعلي: مجاني = `DAILY_MESSAGE_LIMIT` (خادميًا في محرك المدرّس)، مميز ساري = `PREMIUM_DAILY_MESSAGE_LIMIT` (0 = بلا حدود). الخطة المميزة «سارية» فقط عند `status ∈ trialing|active` **و** `expiresAt` غير ماضٍ — وإلا تهبط تلقائيًا لحدود المجاني (الصف يبقى معلنًا بالخطة الممنوحة).

| Method | Route | الوصف | Auth |
|---|---|---|---|
| GET | `/api/me/subscription` | ملخص اشتراكي (يُنشأ **كسولًا** `free`/`trialing` عند أول قراءة): `{plan, status, startedAt, expiresAt?, dailyLimit}` | student فقط |
| GET | `/api/achievements/me` | شاراتي: `{total, earned, achievements: [{code, title, description, icon, awardedAt|null, threshold}]}` — 6 تعريفات (أول خطوة/مستكشف/عالِم صغير/بارع الحوار/قارئ نهم/مصوّر الأسئلة) | student فقط |
| GET | `/api/admin/subscriptions` | قائمة الاشتراكات (صفوف الطلاب الموجودين): `{studentId, studentEmail, plan, status, startedAt, expiresAt?, dailyLimit}` — أحدث بدء أولًا | admin فقط |
| PUT | `/api/admin/subscriptions/students/:studentId` | منح/إلغاء: `{plan: "free"|"premium", status?: "trialing"|"active"|"past_due"|"cancelled", expiresAt?}` → upsert + سجل تدقيق `subscription.update` | admin فقط |

**عزل الأدوار**: والد أو admin على `GET /api/me/subscription` و`/api/achievements/me` → `403`؛ طالب على `/api/admin/subscriptions*` → `403`؛ طالب مجهول على PUT → `404`. **منح الإنجازات خادمي بحت** — يُطلق من `SessionService` على أحداث (`session_ended`, `user_message`, `document_attached`, `vision_attached`) بمنح `onConflictDoNothing` مضاد للتكرار وبعدّادات مقيّدة بجلسات الطالب نفسه؛ فشل أي منح لا يكسر الجلسة (best-effort).