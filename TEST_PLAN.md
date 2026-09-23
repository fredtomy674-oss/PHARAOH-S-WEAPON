# TEST PLAN — AL FAROUQ AI

> آخر تحديث: 2026-09-23 — التنفيذ في `server/test/` (Vitest **106/106**)، الويب يُفحص بنيويًا + E2E بالمتصفح **19/19** (بلا E2E جديد في PHASE 13 وفق المصادقة).

## 1. أدوات

- Vitest (Node, TS-native) — DB مختبري: SQLite `:memory:` أو ملف temp فريد لكل مجموعة.
- API tests عبر `app.inject()` (لا socket — أسرع ويغطي hooks/validation/cookies).
- AI tests: `MockLLMProvider`/`MockEmbeddingProvider` (أوفلاين، تحديث محدد) — **اختبارات حية فقط بـ`RUN_LIVE_TESTS=true`**.

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
| `test/unit/knowledgeFile.test.ts` | Unit | `ingestFile` PDF: kind/status + البايتات الخام (sha256=هوية الملف، size، BLOB `data`) + chunks (lessonId صحيح) + متجهات؛ DOCX kind=docx وصحة المحتوى داخل chunk؛ ملف بايتات متطابقة لنفس المنهج → `DOCUMENT_ALREADY_INGESTED`؛ استخراج صفري (ممسوح) → `EMPTY_DOCUMENT` (OCR مؤجل)؛ **إزالة تكرار chunks مرتكزة على الدرس** (نص واحد يُدرج في درسين = مسموح الآن) |
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
| `test/api/documents.test.ts` | API (Path A) | انتحال: بايتات نصية تُعلن `application/pdf` → `400 FILE_TYPE_MISMATCH`؛ مستند ممسوح **حقيقي** (`%PDF-1.4` بلا نص) يظل 200 مع `textChars=0` وRAG حاضر |
| `test/api/adminFile.test.ts` | API (Path B) | انتحالات ×3: نص→PDF، ZIP عام→DOCX، PDF→`text/plain` → `400 FILE_TYPE_MISMATCH`؛ ممسوح حقيقي → `EMPTY_DOCUMENT` (OCR مؤجل) |

> القاعدة: لا استخراج ولا تخزين لأي ملف لا يطابق توقيعه الفعلي نوعه المعلن — نقطة الفحص مشتركة (`parseDocumentDataUrl`) تغطي المسارين A وB دفعة واحدة.

## 4.4 زراعة متعددة الدول (PHASE 16) — مصر + السعودية

| الملف | المجموعة | ماذا يختبر |
|---|---|---|
| `test/api/multiCountry.test.ts` | API (8) | الكتالوج: الدول تشمل `eg`+`sa`؛ الأنظمة/الصفوف/المناهج مرشّحة بالبلد (لا نزيف بين البلدين)؛ سلسلة فصل→وحدة→درس سعودية كاملة؛ breadcrumb درس سعودي → `sa` |
| | API (تكامل RAG) | جلسة على درس سعودي تتأرض فقط بمحتوى سعودي («الرياض» حاضر، «مقارنة الكسور» غائب) وجلسة مصرية عكس ذلك في اتجاهين |
| `server/src/db/seed.ts` | بنية | بذر عام `seedCountry(spec)` — إعادة استخدام `subjects.math` العالمي (قيد `subjects_code_unique`): السعودية فوق قاعدة مصرية موجودة تُبذر بلا تكرار |

> العزل هيكلي (مرشحات `countryId`) — PHASE 16 لم تغيّر خدمةً ولا جدولًا؛ إعادة تشغيل البذر على قاعدة مختلطة تبقى idempotent. التأثير على E2E: ترتيب الدول أصبح أبجديًا (السعودية أولًا) — اختيار «مصر» صراحةً بـ`selectOptionByLabel` في `startFirstLesson`/`pickSecondLesson`.

---

# الجزء الثاني — Browser End-to-End (Playwright)

> آخر تحديث: 2026-09-23 — **22/22 أخضر** عبر `npm run e2e`. الاختبارات حقيقية 100%: متصفح Chromium → React SPA → Vite proxy → Fastify → SQLite → RAG → AI provider (mock=افتراضي المشروع) → persistence → المتصفح.

## 5. التشغيل والمتطلبات

```bash
npm install                       # بعد إضافة @playwright/test
npm run e2e:install               # مرة واحدة: تنزيل Chromium (~115MB)
npm run e2e                       # يشغّل كل شيء تلقائيًا (خادمان مُداران + 10 اختبارات)
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
- اختبار عزل البيانات (C) يسجّل طالبًا جديدًا عشوائيًا مؤقتًا.

## 7. الحالات المغطاة (22)

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

## 8. قيود معروفة

- `workers: 1` + `fullyParallel: false` إجباريان (قاعدة مشتركة + حساب تجريبي واحد)؛ داخل كل ملف `mode: "serial"`.
- المتصفح الافتراضي Chromium فقط (يمكن إضافة مشاريع أخرى إلى `projects`).
- الاختبارات تتوقع مزوّد AI افتراضيًا `mock`؛ لا مفاتيح حقيقية مطلوبة.
- `maxLength=4000` في حقل الدردشة يحجب تجاوز الطول من المستخدم — لذلك اختُبر خطأ API بواسطة سيناريو CSRF (E) بدل رسالة أطول من الحد (إصلاح موثق في DECISIONS D-013).
- Web Speech API (STT/TTS) لا يمكن أتمتة **صوت حقيقي** (ميكروفون/مخرجات) بشكل حتمي — لذلك تحقن اختبارات الصوت (A1–A3) stubs لـ `SpeechRecognition`/`speechSynthesis` (تسجيل حتمي للـspeak/cancel) وتعتمد على تأكيدات **نسبية** لعد الإلغاء لأن React StrictMode في dev يعيد تركيب غرفة الدردشة فيشغّل cleanup «مغادرة الغرفة» مرة واحدة مبكرًا.
- لتشغيل الاختبارات لا بد أن يكون المنفذان 3107 و5173 حرين؛ اختبار Playwright يرفض الميناءين المشغولين (لا إعادة استخدام تلقائية لقاعدة التطوير).