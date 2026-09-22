import { eq } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { chunks, documents, documentVersions } from "../../db/schema.js";
import { newId, sha256Hex } from "../../utils/ids.js";
import type { AiService } from "../ai/aiService.js";
import { chunkText } from "../rag/chunker.js";
import { cleanText, contentHash, extractText, type SourceKind } from "../rag/extractors.js";
import type { VectorStore } from "../rag/types.js";
import type { CurriculumScope } from "../rag/types.js";
import { Errors } from "../../utils/errors.js";

export interface IngestTextInput {
  title: string;
  content: string;
  kind?: SourceKind;
  scope: CurriculumScope & { curriculumId: string; lessonId: string };
  source?: string;
  uploaderUserId?: string;
  conceptIds?: string[];
}

export interface IngestResult {
  documentId: string;
  versionId: string;
  chunkCount: number;
}

const sqlEqHash = (hash: string) => eq(chunks.contentHash, hash);
const sqlEqId = (id: string) => eq(documents.id, id);
const sqlEqId2 = (id: string) => eq(documentVersions.id, id);

/**
 * Knowledge ingestion: extract → clean → chunk → metadata → embed → store.
 * Metadata carries the full curriculum scope (the isolation barrier for RAG).
 */
export class KnowledgeService {
  constructor(
    private readonly db: Db,
    private readonly ai: AiService,
    private readonly vectorStore: VectorStore,
  ) {}

  async ingestText(input: IngestTextInput): Promise<IngestResult> {
    const extracted = extractText(input.kind ?? "text", input.content);
    const cleaned = cleanText(extracted.text);
    if (cleaned.trim().length < 40) {
      throw Errors.badRequest("المحتوى قصير جدًا (أقل من 40 حرفًا) — لا يمكن استيعابه", "EMPTY_DOCUMENT");
    }

    const now = new Date();
    const documentId = newId("doc");
    const uploaderUserId = input.uploaderUserId ?? null;

    await this.db.db.insert(documents).values({
      id: documentId,
      curriculumId: input.scope.curriculumId,
      kind: extracted.kind,
      title: input.title,
      lang: "ar",
      status: "draft",
      source: input.source ?? null,
      uploaderUserId,
      metadataJson: JSON.stringify({ scope: serializeScope(input.scope) }),
      createdAt: now,
      updatedAt: now,
    });

    const versionId = newId("dv");
    await this.db.db.insert(documentVersions).values({
      id: versionId,
      documentId,
      version: 1,
      sizeBytes: Buffer.byteLength(cleaned, "utf8"),
      sha256: sha256Hex(cleaned),
      status: "pending",
      createdAt: now,
    });

    const pieces = chunkText(cleaned);
    const conceptIdsJson = input.conceptIds ? JSON.stringify(input.conceptIds) : "[]";
    const metadataJson = JSON.stringify({ title: input.title });

    // Embed in batches of 16 to bound provider calls.
    const pieceTexts = pieces.map((p) => p.content);
    const embedResult = await this.ai.embed({ texts: pieceTexts });
    const vectors = embedResult.vectors;

    let chunkCount = 0;
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i]!;
      const hash = contentHash(piece.content);
      // Skip exact duplicate content within the same document set.
      const existing = await this.db.db.select({ id: chunks.id }).from(chunks).where(sqlEqHash(hash)).limit(1);
      if (existing.length > 0) continue;

      const chunkId = newId("chunk");
      await this.db.db.insert(chunks).values({
        id: chunkId,
        documentId,
        versionId,
        content: piece.content,
        contentHash: hash,
        position: piece.position,
        countryId: input.scope.countryId ?? null,
        educationSystemId: input.scope.educationSystemId ?? null,
        gradeId: input.scope.gradeId ?? null,
        subjectId: input.scope.subjectId ?? null,
        curriculumId: input.scope.curriculumId,
        termId: input.scope.termId ?? null,
        unitId: input.scope.unitId ?? null,
        lessonId: input.scope.lessonId,
        conceptIdsJson,
        source: input.source ?? null,
        version: "1.0",
        metadataJson,
        createdAt: now,
      });

      const vector = vectors[i];
      if (vector && vector.length > 0) {
        await this.vectorStore.upsert({ chunkId, embedding: vector, model: embedResult.model });
      }
      chunkCount++;
    }

    await this.db.db
      .update(documents)
      .set({ status: chunkCount > 0 ? "ready" : "failed", updatedAt: new Date() })
      .where(sqlEqId(documentId));
    await this.db.db.update(documentVersions).set({ status: chunkCount > 0 ? "processed" : "failed" }).where(sqlEqId2(versionId));

    return { documentId, versionId, chunkCount };
  }
}

function serializeScope(scope: CurriculumScope): Record<string, string | undefined> {
  return {
    countryId: scope.countryId,
    educationSystemId: scope.educationSystemId,
    gradeId: scope.gradeId,
    subjectId: scope.subjectId,
    curriculumId: scope.curriculumId,
    termId: scope.termId,
    unitId: scope.unitId,
    lessonId: scope.lessonId,
  };
}