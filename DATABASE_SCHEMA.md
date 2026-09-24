# DATABASE SCHEMA — AL FAROUQ AI

> آخر تحديث: 2026-09-24 — مرآة لـ `server/src/db/schema.ts` (المصدر الحقيقي).
> migrations مولّدة بـ drizzle-kit ومطبقة تلقائيًا عند إقلاع السيرفر.

## 1. ملاحظة استراتيجية

- قاعدة البيانات العلائقية = **إدارة النظام** (هوية، مناهج، جلسات، تقدم، استخدام).
- **وليست** بديلًا عن RAG: تحزين المتجهات يحدث في `VectorStore` مفصول (لكنه محلّي على نفس SQLite في MVP).
- المخطط مصمم لمتعدد الدولات من اليوم الأول (`countries`, `education_systems`).

## 2. الكيانات والعلاقات

### الهوية والوصول (`users`, `sessions`, `students`, `parents`, `profiles`, `students_parents`, `subscriptions`)

- `users(id, email UNIQUE, password_hash, role: student|parent|admin, status, created_at)`
- `sessions(id, user_id→users, token_hash, csrf_token, expires_at, created_at, revoked_at)` — جلسات قاعدة بيانات قابلة للإلغاء
- `students(id, user_id UNIQUE, display_name, country_id?, grade_id?, birth_year?)`
- `parents(id, user_id UNIQUE)`
- `profiles(id, user_id UNIQUE, locale, ui_theme, voice_enabled…)`
- `students_parents(student_id, parent_id, relationship)` — علاقة رباعية
- `subscriptions(id, student_id UNIQUE, plan: free|premium, status: trialing|active|past_due|cancelled|expired, started_at, expires_at?)` — **مُفعَّل (PHASE 20)**: يُنشأ كسولًا عند أول قراءة (`free`/`trialing`)؛ مميز ساري فقط عند `trialing|active` وغير منتهٍ؛ الحد اليومي: مجاني `DAILY_MESSAGE_LIMIT` / مميز `PREMIUM_DAILY_MESSAGE_LIMIT` (0 = بلا حدود)

### المناهج (`countries → education_systems → grades → subjects → curricula → terms → units → lessons → concepts`)

- تسلسل هرمي واحد، كل مستوى يشير إلى الأب.
- `concepts` هي أصغر وحدة معرفية وتُستخدم في Metadata/الاسترجاع والتقدم.
- `grades`: `(education_system_id, name, level_order)` — `level_order` يسمح بمقارنة الصفوف.
- `curricula`: `(subject_id, grade_id, version, is_active)`.
- `curriculum_enrollments(student_id, curriculum_id)` — ما يدرسه الطالب بفعالية.
- كل المستويات لها `code` ثابت (slug) لسهولة الهندسة والـAPI.

### المعرفة (Knowledge Base) — `documents`, `document_versions`, `chunks`

- `documents(id, curriculum_id?, kind, title, lang, uploader_user_id, status, source, checksum, metadata_json)`
- `document_versions(id, document_id, version, file_path, sha256, size_bytes, created_at)` — تعقّب نسخ المستند
- `chunks(id, document_id, version_id, content, content_hash UNIQUE, position, metadata_json)` — Metadata كاملة: country_id…lesson_id, concept_ids, source, version
- `questions(id, curriculum_id?, difficulty, type, content, explanation, options_json)` + `answers` — بنك أسئلة (أساس جاهز لاحقًا، يُزرع مع seed بسيط)

### التعليم التكيُّفي — `student_progress` (إتقان مفهوم), `assessments`, `student_memories`, `achievements`, `achievement_definitions`

- `student_progress(id, student_id, concept_id, mastery DOUBLE 0..1, attempts, correct, last_seen_at, UNIQUE(student_id, concept_id))`
- `student_memories(id, student_id, kind, key, value_json, importance, created_at, updated_at)` — ذاكرة طويلة المدى للمدرس (نقاط قوة/ضعف، تفضيلات)
- `assessments(id, session_id?, student_id, type, result_json, total, correct, score, created_at)`
- `achievement_definitions(id, code UNIQUE, title, description, icon, event, threshold, criteria_json)` — **مُفعَّلة (PHASE 20)**: 6 تعريفات ثابتة تُبذر حتميًا بالكود (upsert على `code`؛ فهرس فريد `achievement_definitions_code_unique` migration `0006`)
- `achievements(id, student_id, definition_id, awarded_at, UNIQUE(student_id, definition_id))` — **مُفعَّلة (PHASE 20)**: منح مضاد للتكرار `onConflictDoNothing` على أحداث دورة الحياة (جلسة منتهية/رسالة/مرفق مستند/مرفق صورة)

### الجلسات والتفاعل — `learning_sessions`, `messages`

- `learning_sessions(id, student_id, curriculum_id, grade_id, subject_id, lesson_id?, status, started_at, ended_at, ended_reason)`
- `messages(id, session_id, role: user|tutor|system, content, kind: text|hint|question|…, created_at)` — سجل كامل للحوار خالٍ من بيانات المتجهات.
- `session_recaps(id, session_id UNIQUE, summary, key_concepts_json, created_at)` — خلاصة جلسة تُغذي الذاكرة طويلة المدى.

### المراقبة والاقتصاد — `ai_usage_logs`, `audit_logs`

- `ai_usage_logs(id, user_id, session_id?, operation, provider, model, input_tokens, output_tokens, cost_usd, latency_ms, created_at)`
- `audit_logs(id, actor_user_id, action, entity_type, entity_id, before_json?, after_json?, ip, created_at)`

## 3. فهارس إلزامية

- فهارس unique على: users.email, users.external_ref?, sessions.token_hash, chunks.content_hash, student_progress(student_id,concept_id).
- فهارس FK شائعة: messages(session_id), student_progress(student_id), chunks(document_id), etc.
- فهارس `level_order` في grades، و`is_active` في curricula—للاستعلامات المتكررة.

## 4. قيود التكامل

- FK مع `ON DELETE CASCADE` للبيانات التابعة (messages/session, chunks/document).
- Students مرتبطون بـ user عبر UNIQUE — بروفايل واحد لكل مستخدم.
- لا UUID من العميل: كل المعرّفات تُولَّد خادميًا.

## 5. التعامل مع Postgres لاحقاً

معظم الجداول قابلة للنسخ المباشر؛ الاختلافات: `better-sqlite3`→`pg`, أنواع نصية (INTEGER→SERIAL?), DateTime → timestamptz. عملية الهجرة موثقة في TECHNICAL_ARCHITECTURE §6.