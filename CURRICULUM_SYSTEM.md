# CURRICULUM SYSTEM — AL FAROUQ AI

> آخر تحديث: 2026-09-22 — الكود في `server/src/modules/curriculum/` + seed.

## 1. الهرم المعتمد

```
Country (مصر)
└─ EducationSystem (التعليم الأساسي)
   └─ Grade (السادس الابتدائي)
      └─ Subject (الرياضيات)
         └─ Curriculum (منهج 2024/2025 — versioned + is_active)
            └─ Term (الفصل الدراسي الأول)
               └─ Unit (الوحدة 1: الأعداد الصحيحة)
                  └─ Lesson (درس: خواص الجمع)
                     └─ Concept (الإبدال، التجميع، …)
```

- **Concept** هو أصغر وحدة معرفية: يُستخدم في Metadata وRAG والـProgress والـMemory.
- كل مستوى له `code` stable (مثل `eg-primary-g6-math`) لتبسيط الـAPI والهندسة (المعرفات الرقمية تبقى المرجع الرسمي).

## 2. التصميم متعدد الدولات

- `countries`: متعدد — إضافة دولة لا تتطلب تغيير Schema.
- `curricula` versioned: تحديث منهج = نسخة جديدة بدل كسر النسخ النشطة.
- `curriculum_enrollments`: يحدد ما يدرسه الطالب (مركّز، يمنع خلط مناهج).

## 3. مصادر المعرفة والإدارة

| المصدر | الحالة الـMVP | المسار |
|---|---|---|
| TextView (txt/md/csv) | ✅ مدعوم الآن | extractor في `knowledge/` |
| PDF / DOCX | ⚠️ واجهات جاهزة، الاستخراج Placeholder موثق | `extractors/pdf.ts` يرمي `UnsupportedSourceError` |
| صور | ⚠️ مؤجل (يتطلب Vision provider) | موثق |
| بنوك أسئلة | ✅ جدول `questions/answers` + seeder يبذر أمثلة | قيد الاستخدام للتقييم |

- **لا Fine-Tuning تلقائي للمناهج**: المعرفة = Documents+Chunks (RAG). Fine-Tuning مجال منفصل معمارياً (انظر RAG_SYSTEM §5).

## 4. الـSeed النموذجي

`server/src/seeds/curriculum-egypt.mjs` يبذر:

- مصر → نظام التعليم الأساسي → الصف السادس الابتدائي → الرياضيات
- منهج 2024/2025 → الفصل الأول → وحدتين نموذجيتين → دروس → مفاهيم
- مستندات + chunks أمثلة (مع Metadata كاملة) لتشغيل RAG فوراً

استرجاع الـAPI: `GET /api/curriculum/countries`, `/api/curriculum/egypt/...` (انظر API_SPEC).

## 5. الحماية من «المنهج الخاطئ»

- Retrieval يفرض scopeFilter مطابق لسياق الجلسة (`grade_id`…`curriculum_id`).
- عند إنشاء جلسة يُثبّت `curriculum_id` + `lesson_id` وتحقق الأمان أن الـchunks المسترجعة تنتمي لنفس `curriculum_id` (اختبار مخصص).