import type { FastifyPluginAsync } from "fastify";
import { count, desc, eq } from "drizzle-orm";
import { chunks, curricula, documents, learningSessions, lessons, messages, students, users } from "../../db/schema.js";
import { requireAdmin } from "../../plugins/auth.js";
import { Errors } from "../../utils/errors.js";
import { config } from "../../config/env.js";
import { parseDocumentDataUrl } from "../sessions/documents.js";

const ingestBodySchema = {
  type: "object",
  required: ["title", "content", "scope"],
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 3, maxLength: 200 },
    content: { type: "string", minLength: 40, maxLength: 500000 },
    kind: { type: "string", enum: ["text", "csv"], default: "text" },
    source: { type: "string", maxLength: 300 },
    conceptIds: { type: "array", items: { type: "string", maxLength: 64 }, maxItems: 20 },
    scope: {
      type: "object",
      required: ["countryId", "gradeId", "subjectId", "curriculumId", "lessonId"],
      additionalProperties: false,
      properties: {
        countryId: { type: "string", maxLength: 64 },
        educationSystemId: { type: "string", maxLength: 64 },
        gradeId: { type: "string", maxLength: 64 },
        subjectId: { type: "string", maxLength: 64 },
        curriculumId: { type: "string", maxLength: 64 },
        termId: { type: "string", maxLength: 64 },
        unitId: { type: "string", maxLength: 64 },
        lessonId: { type: "string", maxLength: 64 },
      },
    },
  },
};

const ingestFileScopeSchema = {
  type: "object",
  required: ["countryId", "gradeId", "subjectId", "curriculumId", "lessonId"],
  additionalProperties: false,
  properties: {
    countryId: { type: "string", maxLength: 64 },
    educationSystemId: { type: "string", maxLength: 64 },
    gradeId: { type: "string", maxLength: 64 },
    subjectId: { type: "string", maxLength: 64 },
    curriculumId: { type: "string", maxLength: 64 },
    termId: { type: "string", maxLength: 64 },
    unitId: { type: "string", maxLength: 64 },
    lessonId: { type: "string", maxLength: 64 },
  },
};

const ingestFileBodySchema = {
  type: "object",
  required: ["fileName", "dataUrl", "scope"],
  additionalProperties: false,
  properties: {
    fileName: { type: "string", minLength: 1, maxLength: 255 },
    // base64 data-URL of up to MAX_CURRICULUM_FILE_KB (20 MB default) ≈ 27.96M chars.
    dataUrl: { type: "string", minLength: 1, maxLength: 28_000_000 },
    title: { type: "string", minLength: 1, maxLength: 200 },
    source: { type: "string", maxLength: 300 },
    conceptIds: { type: "array", items: { type: "string", maxLength: 64 }, maxItems: 20 },
    scope: ingestFileScopeSchema,
  },
};

/**
 * Admin-only knowledge-base management: ingest curriculum documents
 * (text/csv or uploaded PDF/DOCX/TXT/MD files) which are chunked, embedded
 * and scoped for RAG.
 */
export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.post("/documents/ingest", { preHandler: requireAdmin, schema: { body: ingestBodySchema } }, async (request, reply) => {
    const auth = request.auth!;
    const body = request.body as {
      title: string;
      content: string;
      kind?: "text" | "csv";
      source?: string;
      conceptIds?: string[];
      scope: {
        countryId: string;
        educationSystemId?: string;
        gradeId: string;
        subjectId: string;
        curriculumId: string;
        termId?: string;
        unitId?: string;
        lessonId: string;
      };
    };

    // The ingester cannot accept unsupported kinds today; reject early with a clear message.
    if (body.kind && body.kind !== "text" && body.kind !== "csv") {
      throw Errors.badRequest("نوع المستند غير مدعوم في MVP (يدعم: text, csv)", "UNSUPPORTED_SOURCE");
    }

    const result = await app.knowledge.ingestText({
      title: body.title,
      content: body.content,
      kind: body.kind,
      source: body.source,
      uploaderUserId: auth.user.id,
      conceptIds: body.conceptIds,
      scope: body.scope,
    });

    await app.audit.record({
      actorUserId: auth.user.id,
      action: "document.ingest",
      entityType: "document",
      entityId: result.documentId,
      afterJson: JSON.stringify({ title: body.title, chunkCount: result.chunkCount }),
      ip: request.ip,
    });

    return reply.code(201).send({ document: result });
  });

  app.post("/documents/ingest-file", { preHandler: requireAdmin, schema: { body: ingestFileBodySchema } }, async (request, reply) => {
    const auth = request.auth!;
    const body = request.body as {
      fileName: string;
      dataUrl: string;
      title?: string;
      source?: string;
      conceptIds?: string[];
      scope: {
        countryId: string;
        educationSystemId?: string;
        gradeId: string;
        subjectId: string;
        curriculumId: string;
        termId?: string;
        unitId?: string;
        lessonId: string;
      };
    };

    // Path B — curriculum file import: validate + extract with the SAME pure-JS
    // pipeline as student files (data-URL whitelist, size cap, sha256, bounded
    // text). The extracted text is curriculum CONTENT for the knowledge base —
    // it lands in <context> (never the system prompt) exactly like ingestText.
    const parsed = await parseDocumentDataUrl(body.dataUrl, {
      maxBytes: config.MAX_CURRICULUM_FILE_KB * 1024,
      maxChars: config.MAX_CURRICULUM_DOCUMENT_CHARS,
      fileName: body.fileName,
    });

    const result = await app.knowledge.ingestFile({
      fileName: body.fileName,
      mimeType: parsed.mimeType,
      bytes: parsed.bytes,
      text: parsed.text,
      title: body.title,
      source: body.source,
      uploaderUserId: auth.user.id,
      conceptIds: body.conceptIds,
      scope: body.scope,
    });

    await app.audit.record({
      actorUserId: auth.user.id,
      action: "document.ingest",
      entityType: "document",
      entityId: result.documentId,
      afterJson: JSON.stringify({ title: body.title ?? body.fileName, mimeType: parsed.mimeType, chunkCount: result.chunkCount }),
      ip: request.ip,
    });

    return reply.code(201).send({ document: result });
  });

  app.get("/documents", { preHandler: requireAdmin }, async () => {
    // Join per-document chunk aggregates so the admin dashboard can show which
    // lesson each document feeds (scope linkage) and how much content it added.
    const rows = await app.db.db
      .select({
        id: documents.id,
        kind: documents.kind,
        title: documents.title,
        status: documents.status,
        source: documents.source,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        lessonId: chunks.lessonId,
        lessonTitle: lessons.title,
        chunkCount: count(chunks.id),
      })
      .from(documents)
      .leftJoin(chunks, eq(chunks.documentId, documents.id))
      .leftJoin(lessons, eq(lessons.id, chunks.lessonId))
      .where(eq(documents.status, "ready"))
      .groupBy(documents.id)
      .orderBy(desc(documents.createdAt))
      .limit(100);
    return { documents: rows };
  });

  app.get("/stats", { preHandler: requireAdmin }, async () => {
    // PHASE 17 — operational statistics for the admin dashboard. Pure
    // aggregations over existing tables; no new storage, admin-only.
    const usersTotal = (await app.db.db.select({ value: count() }).from(users).get())!;
    const studentUsers = (await app.db.db.select({ value: count() }).from(students).get())!;
    const sessionsTotal = (await app.db.db.select({ value: count() }).from(learningSessions).get())!;
    const sessionsActive = (await app.db.db.select({ value: count() }).from(learningSessions).where(eq(learningSessions.status, "active")).get())!;
    const sessionsEnded = (await app.db.db.select({ value: count() }).from(learningSessions).where(eq(learningSessions.status, "ended")).get())!;
    const messagesTotal = (await app.db.db.select({ value: count() }).from(messages).get())!;
    const messagesUser = (await app.db.db.select({ value: count() }).from(messages).where(eq(messages.role, "user")).get())!;
    const messagesTutor = (await app.db.db.select({ value: count() }).from(messages).where(eq(messages.role, "tutor")).get())!;
    const documentsTotal = (await app.db.db.select({ value: count() }).from(documents).get())!;
    const documentsReady = (await app.db.db.select({ value: count() }).from(documents).where(eq(documents.status, "ready")).get())!;
    const chunksTotal = (await app.db.db.select({ value: count() }).from(chunks).get())!;
    const curriculaTotal = (await app.db.db.select({ value: count() }).from(curricula).get())!;
    const lessonsTotal = (await app.db.db.select({ value: count() }).from(lessons).get())!;

    return {
      stats: {
        users: { total: usersTotal.value, students: studentUsers.value },
        sessions: { total: sessionsTotal.value, active: sessionsActive.value, ended: sessionsEnded.value },
        messages: { total: messagesTotal.value, user: messagesUser.value, tutor: messagesTutor.value },
        documents: { total: documentsTotal.value, ready: documentsReady.value },
        chunks: chunksTotal.value,
        curricula: curriculaTotal.value,
        lessons: lessonsTotal.value,
      },
    };
  });
};