import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
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

export interface IngestFileInput {
  fileName: string;
  mimeType: string;
  /** Raw uploaded file bytes (stored on the version row as `data`). */
  bytes: Buffer;
  /** Server-extracted plain text of the file (already bounded by the caller). */
  text: string;
  title?: string;
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
      // Skip exact duplicate content within the same LESSON (dedup is lesson-
      // scoped, so identical text in another lesson still becomes its own
      // lesson-scoped chunk — mirrors the (content_hash, lesson_id) index).
      const existing = await this.db.db
        .select({ id: chunks.id })
        .from(chunks)
        .where(and(sqlEqHash(hash), eq(chunks.lessonId, input.scope.lessonId)))
        .limit(1);
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

  /**
   * Path B — curriculum file import: a PDF/DOCX/TXT/MD uploaded by an admin is
   * parsed in-memory (pure-JS via pdfjs-dist/mammoth), its extracted text is
   * clean → chunk → embed → stored exactly like `ingestText` (full curriculum
   * scope on every chunk = the RAG isolation barrier). The raw bytes are kept
   * on the version row (`data`) for future re-processing/OCR; `sha256` covers
   * the raw file for file-level dedup.
   */
  async ingestFile(input: IngestFileInput): Promise<IngestResult> {
    const cleaned = cleanText(input.text);
    if (cleaned.trim().length < 40) {
      throw Errors.badRequest(
        "لم يُستخرج نص كافٍ من الملف (أقل من 40 حرفًا) — الملف ممسوح ضوئيًا أو بلا نص؟ استخراج OCR مؤجل في هذه المرحلة",
        "EMPTY_DOCUMENT",
      );
    }

    const rawHash = fileSha256(input.bytes);
    const sizeBytes = input.bytes.length;

    // File-level dedup: identical raw bytes already imported for THIS curriculum.
    const dup = await this.db.db
      .select({ documentId: documentVersions.documentId })
      .from(documentVersions)
      .innerJoin(documents, eq(documents.id, documentVersions.documentId))
      .where(and(eq(documentVersions.sha256, rawHash), eq(documents.curriculumId, input.scope.curriculumId), eq(documentVersions.status, "processed")))
      .limit(1)
      .get();
    if (dup) {
      throw Errors.conflict(
        "ملف مطابق (نفس البايتات) مستورد مسبقًا في هذا المنهج — أعد التصدير أو غيّر الاسم/المحتوى",
        "DOCUMENT_ALREADY_INGESTED",
      );
    }

    const now = new Date();
    const documentId = newId("doc");
    const title = input.title && input.title.trim().length > 0 ? input.title.trim() : input.fileName;

    await this.db.db.insert(documents).values({
      id: documentId,
      curriculumId: input.scope.curriculumId,
      kind: fileKindFromMime(input.mimeType),
      title,
      lang: "ar",
      status: "draft",
      source: input.source ?? null,
      uploaderUserId: input.uploaderUserId ?? null,
      metadataJson: JSON.stringify({ scope: serializeScope(input.scope) }),
      createdAt: now,
      updatedAt: now,
    });

    const versionId = newId("dv");
    await this.db.db.insert(documentVersions).values({
      id: versionId,
      documentId,
      version: 1,
      sha256: rawHash,
      sizeBytes,
      data: input.bytes,
      status: "pending",
      createdAt: now,
    });

    const pieces = chunkText(cleaned);
    const conceptIdsJson = input.conceptIds ? JSON.stringify(input.conceptIds) : "[]";
    const metadataJson = JSON.stringify({ title });

    const embedResult = await this.ai.embed({ texts: pieces.map((p) => p.content) });
    const vectors = embedResult.vectors;

    let chunkCount = 0;
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i]!;
      const hash = contentHash(piece.content);
      // Lesson-scoped content dedup (same rule as ingestText).
      const existing = await this.db.db
        .select({ id: chunks.id })
        .from(chunks)
        .where(and(sqlEqHash(hash), eq(chunks.lessonId, input.scope.lessonId)))
        .limit(1);
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

/** Maps an allowed upload mime type to the documents.kind enum value. */
function fileKindFromMime(mimeType: string): "pdf" | "docx" | "text" {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  return "text";
}

/** SHA-256 hex of raw file bytes (file-level dedup identity). */
function fileSha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
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