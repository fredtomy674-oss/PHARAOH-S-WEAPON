import { sqliteTable, text, integer, real, blob, uniqueIndex, index, primaryKey } from "drizzle-orm/sqlite-core";

/** Helper types for SQLite (Drizzle). */
const id = () => text("id").primaryKey();
const ts = (name: string) => integer(name, { mode: "timestamp_ms" });
const bool = (name: string) => integer(name, { mode: "boolean" });
const slug = (name: string) => text(name);

/** User roles. Students are the MVP focus; parents/admins are architected. */
export const users = sqliteTable(
  "users",
  {
    id: id(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ["student", "parent", "admin"] }).notNull().default("student"),
    status: text("status", { enum: ["active", "disabled"] }).notNull().default("active"),
    createdAt: ts("created_at").notNull(),
    updatedAt: ts("updated_at").notNull(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

/** Server-side sessions (revocable, DB-backed). Hash of the cookie token. */
export const sessions = sqliteTable(
  "sessions",
  {
    id: id(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    csrfToken: text("csrf_token").notNull(),
    expiresAt: ts("expires_at").notNull(),
    revokedAt: ts("revoked_at"),
    createdAt: ts("created_at").notNull(),
  },
  (t) => [uniqueIndex("sessions_token_hash_unique").on(t.tokenHash), index("sessions_user_idx").on(t.userId)],
);

export const students = sqliteTable(
  "students",
  {
    id: id(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    countryId: text("country_id").references(() => countries.id, { onDelete: "set null" }),
    gradeId: text("grade_id").references(() => grades.id, { onDelete: "set null" }),
    birthYear: integer("birth_year"),
    /** Sharing code a parent enters to link/observe this child (PHASE 18). */
    parentLinkCode: text("parent_link_code"),
    createdAt: ts("created_at").notNull(),
    updatedAt: ts("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("students_user_id_unique").on(t.userId),
    uniqueIndex("students_parent_link_code_unique").on(t.parentLinkCode),
  ],
);

export const parents = sqliteTable(
  "parents",
  {
    id: id(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("parents_user_id_unique").on(t.userId)],
);

export const profiles = sqliteTable(
  "profiles",
  {
    id: id(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    locale: text("locale").notNull().default("ar-EG"),
    uiTheme: text("ui_theme").notNull().default("light"),
  },
  (t) => [uniqueIndex("profiles_user_id_unique").on(t.userId)],
);

export const studentsParents = sqliteTable(
  "students_parents",
  {
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    parentId: text("parent_id").notNull().references(() => parents.id, { onDelete: "cascade" }),
    relationship: text("relationship").notNull().default("parent"),
  },
  (t) => [primaryKey({ columns: [t.studentId, t.parentId] })],
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: id(),
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    plan: text("plan").notNull().default("free"),
    status: text("status", { enum: ["trialing", "active", "past_due", "cancelled"] }).notNull().default("trialing"),
    startedAt: ts("started_at").notNull(),
    expiresAt: ts("expires_at"),
  },
  (t) => [index("subscriptions_student_idx").on(t.studentId)],
);

// ---------------------------------------------------------------------------
// Curriculum hierarchy (multi-country from day one)
// ---------------------------------------------------------------------------

export const countries = sqliteTable(
  "countries",
  {
    id: id(),
    code: slug("code").notNull(),
    name: text("name").notNull(),
    nameAr: text("name_ar").notNull(),
  },
  (t) => [uniqueIndex("countries_code_unique").on(t.code)],
);

export const educationSystems = sqliteTable(
  "education_systems",
  {
    id: id(),
    countryId: text("country_id").notNull().references(() => countries.id, { onDelete: "cascade" }),
    code: slug("code").notNull(),
    name: text("name").notNull(),
    nameAr: text("name_ar").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("education_systems_code_unique").on(t.code), index("education_systems_country_idx").on(t.countryId)],
);

export const grades = sqliteTable(
  "grades",
  {
    id: id(),
    educationSystemId: text("education_system_id").notNull().references(() => educationSystems.id, { onDelete: "cascade" }),
    code: slug("code").notNull(),
    name: text("name").notNull(),
    nameAr: text("name_ar").notNull(),
    levelOrder: integer("level_order").notNull().default(0),
  },
  (t) => [uniqueIndex("grades_code_unique").on(t.code), index("grades_system_idx").on(t.educationSystemId)],
);

/** Subjects are global (math is math everywhere) — curricula bind them per grade/country. */
export const subjects = sqliteTable(
  "subjects",
  {
    id: id(),
    code: slug("code").notNull(),
    name: text("name").notNull(),
    nameAr: text("name_ar").notNull(),
  },
  (t) => [uniqueIndex("subjects_code_unique").on(t.code)],
);

export const curricula = sqliteTable(
  "curricula",
  {
    id: id(),
    countryId: text("country_id").notNull().references(() => countries.id, { onDelete: "cascade" }),
    educationSystemId: text("education_system_id").notNull().references(() => educationSystems.id, { onDelete: "cascade" }),
    gradeId: text("grade_id").notNull().references(() => grades.id, { onDelete: "cascade" }),
    subjectId: text("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
    code: slug("code").notNull(),
    title: text("title").notNull(),
    version: text("version").notNull().default("1.0"),
    isActive: bool("is_active").notNull().default(true),
    createdAt: ts("created_at").notNull(),
  },
  (t) => [uniqueIndex("curricula_code_unique").on(t.code), index("curricula_grade_subject_idx").on(t.gradeId, t.subjectId)],
);

export const terms = sqliteTable(
  "terms",
  {
    id: id(),
    curriculumId: text("curriculum_id").notNull().references(() => curricula.id, { onDelete: "cascade" }),
    code: slug("code").notNull(),
    title: text("title").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("terms_curriculum_idx").on(t.curriculumId)],
);

export const units = sqliteTable(
  "units",
  {
    id: id(),
    termId: text("term_id").notNull().references(() => terms.id, { onDelete: "cascade" }),
    code: slug("code").notNull(),
    title: text("title").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("units_term_idx").on(t.termId)],
);

export const lessons = sqliteTable(
  "lessons",
  {
    id: id(),
    unitId: text("unit_id").notNull().references(() => units.id, { onDelete: "cascade" }),
    code: slug("code").notNull(),
    title: text("title").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("lessons_unit_idx").on(t.unitId)],
);

export const concepts = sqliteTable(
  "concepts",
  {
    id: id(),
    lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    code: slug("code").notNull(),
    title: text("title").notNull(),
    description: text("description"),
  },
  (t) => [index("concepts_lesson_idx").on(t.lessonId)],
);

export const curriculumEnrollments = sqliteTable(
  "curriculum_enrollments",
  {
    id: id(),
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    curriculumId: text("curriculum_id").notNull().references(() => curricula.id, { onDelete: "cascade" }),
    isActive: bool("is_active").notNull().default(true),
    createdAt: ts("created_at").notNull(),
  },
  (t) => [uniqueIndex("enrollments_student_curriculum_unique").on(t.studentId, t.curriculumId)],
);

// ---------------------------------------------------------------------------
// Knowledge base (documents → versions → chunks)
// ---------------------------------------------------------------------------

export const documents = sqliteTable(
  "documents",
  {
    id: id(),
    curriculumId: text("curriculum_id").references(() => curricula.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["text", "pdf", "docx", "csv", "image", "structured"] }).notNull().default("text"),
    title: text("title").notNull(),
    lang: text("lang").notNull().default("ar"),
    status: text("status", { enum: ["draft", "ready", "failed"] }).notNull().default("draft"),
    source: text("source"),
    uploaderUserId: text("uploader_user_id").references(() => users.id, { onDelete: "set null" }),
    metadataJson: text("metadata_json"),
    createdAt: ts("created_at").notNull(),
    updatedAt: ts("updated_at").notNull(),
  },
  (t) => [index("documents_curriculum_idx").on(t.curriculumId)],
);

export const documentVersions = sqliteTable(
  "document_versions",
  {
    id: id(),
    documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    filePath: text("file_path"),
    sha256: text("sha256"),
    sizeBytes: integer("size_bytes").notNull().default(0),
    /** Raw uploaded file bytes (curriculum file imports only; null for text ingest). */
    data: blob("data", { mode: "buffer" }),
    status: text("status", { enum: ["processed", "failed", "pending"] }).notNull().default("pending"),
    createdAt: ts("created_at").notNull(),
  },
  (t) => [index("document_versions_doc_idx").on(t.documentId)],
);

/**
 * RAG unit with FULL curriculum metadata. This is the isolation barrier that
 * prevents content from the wrong grade/subject/lesson entering a session.
 */
export const chunks = sqliteTable(
  "chunks",
  {
    id: id(),
    documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    versionId: text("version_id").references(() => documentVersions.id, { onDelete: "set null" }),
    content: text("content").notNull(),
    contentHash: text("content_hash").notNull(),
    position: integer("position").notNull().default(0),
    countryId: text("country_id"),
    educationSystemId: text("education_system_id"),
    gradeId: text("grade_id"),
    subjectId: text("subject_id"),
    curriculumId: text("curriculum_id"),
    termId: text("term_id"),
    unitId: text("unit_id"),
    lessonId: text("lesson_id"),
    conceptIdsJson: text("concept_ids_json"),
    source: text("source"),
    version: text("version"),
    metadataJson: text("metadata_json"),
    createdAt: ts("created_at").notNull(),
  },
  (t) => [
    // Duplicate-content prevention is SCOPED to the lesson (content_hash alone
    // would silently drop the second lesson's copy of identical text).
    uniqueIndex("chunks_content_hash_lesson_unique").on(t.contentHash, t.lessonId),
    index("chunks_scope_idx").on(t.countryId, t.educationSystemId, t.gradeId, t.subjectId, t.curriculumId, t.termId, t.unitId, t.lessonId),
    index("chunks_document_idx").on(t.documentId),
  ],
);

/** Vector embeddings for chunks (MVP: local brute-force cosine + scope filter). */
export const ragVectors = sqliteTable(
  "rag_vectors",
  {
    chunkId: text("chunk_id").notNull().references(() => chunks.id, { onDelete: "cascade" }),
    embedding: text("embedding").notNull(), // JSON array of floats (SQLite BLOB alternative)
    embeddingModel: text("embedding_model").notNull(),
    dim: integer("dim").notNull(),
  },
  (t) => [uniqueIndex("rag_vectors_chunk_unique").on(t.chunkId)],
);

// Question bank (schema ready; MVP seeds a few examples for assessments)
export const questions = sqliteTable(
  "questions",
  {
    id: id(),
    curriculumId: text("curriculum_id").references(() => curricula.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
    conceptId: text("concept_id").references(() => concepts.id, { onDelete: "set null" }),
    difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull().default("medium"),
    type: text("type", { enum: ["mcq", "open"] }).notNull().default("open"),
    content: text("content").notNull(),
    explanation: text("explanation"),
    optionsJson: text("options_json"),
    answerKey: text("answer_key"),
    createdAt: ts("created_at").notNull(),
  },
  (t) => [index("questions_lesson_idx").on(t.lessonId)],
);

export const answers = sqliteTable(
  "answers",
  {
    id: id(),
    questionId: text("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => learningSessions.id, { onDelete: "set null" }),
    content: text("content").notNull(),
    correct: integer("correct"),
    createdAt: ts("created_at").notNull(),
  },
  (t) => [index("answers_student_idx").on(t.studentId)],
);

// ---------------------------------------------------------------------------
// Learning sessions & dialogue
// ---------------------------------------------------------------------------

export const learningSessions = sqliteTable(
  "learning_sessions",
  {
    id: id(),
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    curriculumId: text("curriculum_id").notNull().references(() => curricula.id, { onDelete: "cascade" }),
    gradeId: text("grade_id").notNull().references(() => grades.id, { onDelete: "cascade" }),
    subjectId: text("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
    status: text("status", { enum: ["active", "ended", "abandoned"] }).notNull().default("active"),
    startedAt: ts("started_at").notNull(),
    endedAt: ts("ended_at"),
    endedReason: text("ended_reason"),
  },
  (t) => [index("sessions_student_idx").on(t.studentId), index("sessions_lesson_idx").on(t.lessonId)],
);

export const messages = sqliteTable(
  "messages",
  {
    id: id(),
    sessionId: text("session_id").notNull().references(() => learningSessions.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "tutor", "system"] }).notNull(),
    kind: text("kind", { enum: ["text", "hint", "question", "example", "feedback", "system"] }).notNull().default("text"),
    content: text("content").notNull(),
    createdAt: ts("created_at").notNull(),
  },
  (t) => [index("messages_session_idx").on(t.sessionId)],
);

/**
 * Images attached to a user message (Vision: student photos a homework
 * question). MVP stores bytes as BLOB; ownership is enforced via session.
 */
export const messageAttachments = sqliteTable(
  "message_attachments",
  {
    id: id(),
    messageId: text("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull().references(() => learningSessions.id, { onDelete: "cascade" }),
    mimeType: text("mime_type").notNull(),
    fileName: text("file_name"),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: text("sha256").notNull(),
    data: blob("data", { mode: "buffer" }).notNull(),
    /** Document attachments only: extracted plain text (null for images / empty extractions). */
    extractedText: text("extracted_text"),
    /** Document attachments only: true when `extractedText` came from OCR (scanned file). */
    ocrApplied: integer("ocr_applied", { mode: "boolean" }).default(false),
    createdAt: ts("created_at").notNull(),
  },
  (t) => [
    index("attachments_session_idx").on(t.sessionId),
    uniqueIndex("attachments_message_unique").on(t.messageId),
  ],
);

export const sessionRecaps = sqliteTable(
  "session_recaps",
  {
    id: id(),
    sessionId: text("session_id").notNull().references(() => learningSessions.id, { onDelete: "cascade" }),
    summary: text("summary").notNull(),
    keyConceptsJson: text("key_concepts_json"),
    createdAt: ts("created_at").notNull(),
  },
  (t) => [uniqueIndex("recaps_session_unique").on(t.sessionId)],
);

// ---------------------------------------------------------------------------
// Progress / memory / assessment
// ---------------------------------------------------------------------------

export const studentProgress = sqliteTable(
  "student_progress",
  {
    id: id(),
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    conceptId: text("concept_id").notNull().references(() => concepts.id, { onDelete: "cascade" }),
    mastery: real("mastery").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    correct: integer("correct").notNull().default(0),
    lastSeenAt: ts("last_seen_at").notNull(),
  },
  (t) => [uniqueIndex("progress_student_concept_unique").on(t.studentId, t.conceptId)],
);

export const studentMemories = sqliteTable(
  "student_memories",
  {
    id: id(),
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["strength", "weakness", "preference", "fact"] }).notNull(),
    key: text("key").notNull(),
    valueJson: text("value_json").notNull(),
    importance: integer("importance").notNull().default(1),
    createdAt: ts("created_at").notNull(),
    updatedAt: ts("updated_at").notNull(),
  },
  (t) => [uniqueIndex("memories_student_key_unique").on(t.studentId, t.key)],
);

export const assessments = sqliteTable(
  "assessments",
  {
    id: id(),
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => learningSessions.id, { onDelete: "set null" }),
    type: text("type", { enum: ["concept_check", "exercise"] }).notNull(),
    resultJson: text("result_json"),
    total: integer("total").notNull().default(0),
    correct: integer("correct").notNull().default(0),
    score: real("score").notNull().default(0),
    createdAt: ts("created_at").notNull(),
  },
  (t) => [index("assessments_student_idx").on(t.studentId)],
);

// ---------------------------------------------------------------------------
// Gamification (schema ready)
// ---------------------------------------------------------------------------

export const achievementDefinitions = sqliteTable("achievement_definitions", {
  id: id(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  criteriaJson: text("criteria_json"),
});

export const achievements = sqliteTable(
  "achievements",
  {
    id: id(),
    studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    definitionId: text("definition_id").notNull().references(() => achievementDefinitions.id, { onDelete: "cascade" }),
    awardedAt: ts("awarded_at").notNull(),
  },
  (t) => [uniqueIndex("achievements_student_definition_unique").on(t.studentId, t.definitionId)],
);

// ---------------------------------------------------------------------------
// Ops: AI usage & audit (no message content — only counters and identifiers)
// ---------------------------------------------------------------------------

export const aiUsageLogs = sqliteTable(
  "ai_usage_logs",
  {
    id: id(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    sessionId: text("session_id").references(() => learningSessions.id, { onDelete: "set null" }),
    operation: text("operation").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    costUsd: real("cost_usd").notNull().default(0),
    latencyMs: integer("latency_ms").notNull().default(0),
    createdAt: ts("created_at").notNull(),
  },
  (t) => [index("usage_user_idx").on(t.userId)],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: id(),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    beforeJson: text("before_json"),
    afterJson: text("after_json"),
    ip: text("ip"),
    createdAt: ts("created_at").notNull(),
  },
  (t) => [index("audit_actor_idx").on(t.actorUserId), index("audit_created_idx").on(t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Country = typeof countries.$inferSelect;
export type Curriculum = typeof curricula.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Concept = typeof concepts.$inferSelect;
export type ChunkRow = typeof chunks.$inferSelect;
export type LearningSession = typeof learningSessions.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;