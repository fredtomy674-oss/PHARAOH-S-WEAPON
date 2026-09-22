import type { FastifyPluginAsync } from "fastify";
import { desc, eq } from "drizzle-orm";
import { documents } from "../../db/schema.js";
import { requireAdmin } from "../../plugins/auth.js";
import { Errors } from "../../utils/errors.js";

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

/**
 * Admin-only knowledge-base management: ingest curriculum documents
 * (text/csv in the MVP), which are chunked, embedded and scoped for RAG.
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

  app.get("/documents", { preHandler: requireAdmin }, async () => {
    const rows = await app.db.db
      .select()
      .from(documents)
      .where(eq(documents.status, "ready"))
      .orderBy(desc(documents.createdAt))
      .limit(100);
    return { documents: rows };
  });
};