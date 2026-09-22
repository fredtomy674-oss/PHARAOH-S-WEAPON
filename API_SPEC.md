# API SPEC — AL FAROUQ AI

> آخر تحديث: 2026-09-22 — مصدر الحقيقة: Fastify routes في `server/src/modules`. كل responses JSON.
> Base: `/api` — Auth: session cookie (`alfarouq_session`) httpOnly + CSRF header للـmutations.

## 1. المصادقة

| Method | Route | الوصف | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | إنشاء حساب طالب (+student profile) `{email,password,displayName,gradeCode?}` | public |
| POST | `/api/auth/login` | `{email,password}` → set cookie + CSRF | public |
| POST | `/api/auth/logout` | إبطال الجلسة | session |
| GET | `/api/auth/me` | المستخدم الحالي + student | session |

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

## 4. المعرفة (إدارة) — للمستخدم admin (البنية جاهزة)

| Method | Route | الوصف |
|---|---|---|
| POST | `/api/admin/documents` | تحميل/إنشاء مستند نصي وإضافته (ingestion كامل) |
| POST | `/api/admin/documents/:id/reingest` | إعادة معالجة إصدار جديد |
| GET | `/api/admin/documents` | قائمة المستندات (مع حالة ingestion) |

## 5. Response errors

- 400 validation، 401 غير مصادق، 403 منع/مُرتد، 404 غير موجود، 429 معدل مفرط، 500 خطأ خادم.
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