# PROJECT BIBLE — AL FAROUQ AI (AI Tutor)

> **هذا الملف هو الذاكرة الدائمة للمشروع.**
> أي وكيل AI أو مهندس جديد يجب أن يقرأ هذا الملف أولًا قبل أي عمل، ثم يقرأ:
> `TASKS.md` (الحالة الحالية) و `CHANGELOG.md` (ما تم إنجازه) و `DECISIONS.md` (القرارات ولماذا).
>
> آخر تحديث: 2026-09-22 — أُنشئ في PHASE 1.

---

## 1. ما هو المشروع؟

منصة تعليمية يلعب فيها **AI مدرسًا خصوصيًا تفاعليًا** لكل طالب على حدة.
تبدأ بالمناهج المصرية، ومصممة من اليوم الأول للتوسع إلى باقي الدول العربية.

**ليست Chatbot عامًا.** المدرس AI يجب أن:

- يفهم سؤال الطالب ويحدد الدرس/المفهوم المرتبط به.
- يبني إجابته على **محتوى المنهج المعتمد** (Knowledge Base + RAG)، لا على ذاكرته فقط.
- يشرح بطرق مختلفة حتى يفهم الطالب، ويطرح أسئلة، ويحلل إجابات الطالب.
- يعطي تلميحات بدل الحل المباشر عندما يكون تربويًا أفضل.
- يتذكر تقدم الطالب ونقاط قوته وضعفه من جلسة لأخرى (Memory + Progress).

## 2. المسار الأساسي للمستخدم (Vertical Slice الأول)

```
Student
→ تسجيل/دخول
→ إنشاء Student Profile
→ اختيار المرحلة
→ الصف
→ المادة
→ المنهج
→ الوحدة
→ الدرس
→ بدء Learning Session
→ إرسال سؤال → RAG Retrieval (مقيّد بمنهج الطالب) → AI Tutor → رد موثوق
→ متابعة الحوار
→ حفظ الجلسة + تسجيل التقدم
```

## 3. Stack المعتمد (ملخص — التفاصيل والسبب في DECISIONS.md)

| طبقة | التقنية |
|---|---|
| Language | TypeScript (server + web) — Node >= 20 |
| Server | Fastify 5 (plugins, JSON-schema validation) |
| DB | SQLite (dev) عبر Drizzle ORM + drizzle-kit migrations — مسار مؤكد لـPostgres |
| Vector store | `SqliteVectorStore` (محلي) ضمن واجهة `VectorStore` قابلة للاستبدال |
| AI Providers | واجهة `LLMProvider` / `EmbeddingProvider` — تنفيذات: `Mock` (أوفلاين للاختبارات) + `Gemini` (حقيقي) |
| Auth | جلسات DB مع cookies httpOnly، bcryptjs، CSRF protection، rate limiting |
| Frontend | React 19 + Vite + TypeScript، CSS design system يدعم RTL، عربي أولًا |
| Tests | Vitest — Unit / Integration / API (fastify.inject) / DB / AI / RAG / Auth / Security |
| ‏Git | نعم، commits منطقية بعد كل مرحلة مستقرة |

## 4. قيم ومبادئ إلزامية

1. **بيئة العمل**: طُوّرت واختُبرت على Windows 10، Node 24، CPU i3-7100، RAM 16GB، GPU RTX 3060 12GB.
2. **بدون مبتوري الشكل**: أي جزء Placeholder يجب أن يكون موثقًا بسبب تقني حقيقي.
3. **لا أسرار في الكود**: كل شيء عبر env vars + `.env.example`.
4. **لا Monolith فوضوي**: فصل واضح server/web + وحدات داخلية نظيفة.
5. **لا ربط بموديل واحد**: AI abstraction layer إلزامي.
6. **المنهج ليس prompt طويل**: المنهج = Knowledge Base مُدارة + RAG.
7. **RAG ليس بديل قاعدة بيانات**: العلائقية للإدارة، والمتجهات للاسترجاع المعرفي.
8. **لا Fine-Tuning لحل مشكلة Retrieval**: الاثنان مفصولان معمارياً.
9. **لا Feature بلا اختبار**: تعريف النجاح في SECTION 10.
10. **التكلفة محكومة**: routing + tracking + caching + limits من اليوم الأول.

## 5. حدود النطاق الحالية (MVP)

| في النطاق الآن | خارج النطاق الآن (معمارية جاهزة) |
|---|---|
| Text chat مع المدرس AI | Voice / Speech (واجهات جاهزة) |
| منهج مصري نموذجي (Grade 6 Math كـSeed) | كل المناهج المصرية + الدول الأخرى |
| RAG على مستندات نصية (txt/md/csv) | PDF/DOCX/صور (extractors فارغة موثقة) |
| تسجيل دخول + Profile + جلسات + Memory أساسية | Parent/Admin dashboards، Billing، المجتمع |

## 6. قواعد العمل لأنظمة الوكيل (Context Compaction / جلسة جديدة)

عند استئناف العمل:

1. اقرأ: `PROJECT_BIBLE.md` → `TASKS.md` → `CHANGELOG.md` → `DECISIONS.md`.
2. شغّل `npm run check` (typecheck + lint + tests) للتأكد أن الأساس سليم.
3. اكمل من أول مهمة `OPEN` في `TASKS.md` دون القفز بين المراحل.
4. بعد كل مرحلة: نفذ → اختبر → حدّث docs → حدّث TASKS/CHANGELOG → commit.

## 7. الدليل السريع للأوامر

| الأمر | الوصف |
|---|---|
| `npm install` | تثبيت كل شيء (npm workspaces) |
| `npm run dev` | تشغيل server (3001) + web (5173) |
| `npm run dev:server` | السيرفر فقط (مع auto-migrate عند الإقلاع) |
| `npm run dev:web` | الواجهة فقط |
| `npm run db:seed` | زرع بيانات المنهج النموذجية |
| `npm run check` | typecheck + lint + كل الاختبارات |
| `npm run test` | اختبارات السيرفر فقط |

## 8. مصادر المعرفة والعمل القادم

انظر `TASKS.md` للحالة الحية، و`CHANGELOG.md` للسجل الزمني، وكل وثيقة تقنية في الجذر لتفاصيل العمارة.