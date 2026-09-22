import { inArray } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { chunks as chunksTable } from "../../db/schema.js";
import type { AiService } from "../ai/aiService.js";
import { Errors } from "../../utils/errors.js";
import type { ChunkMetadata, RankedChunk, Reranker, RetrieveInput, RetrieveResult, CurriculumScope, VectorStore } from "./types.js";
import { REQUIRED_SCOPE_FIELDS } from "./types.js";

export class LexicalReranker implements Reranker {
  rerank(query: string, items: RankedChunk[]): RankedChunk[] {
    const tokens = new Set(
      query
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((t) => t.length > 2),
    );
    if (tokens.size === 0) return items;
    return items
      .map((item) => {
        const content = item.content.toLowerCase();
        let overlap = 0;
        for (const token of tokens) if (content.includes(token)) overlap++;
        return { ...item, score: item.score + overlap * 0.05 };
      })
      .sort((a, b) => b.score - a.score);
  }
}

/**
 * Retrieval pipeline: validate scope (isolation) → embed question → vector
 * search within scope → load chunk rows → lexical rerank → build context text.
 */
export class RetrievalService {
  constructor(
    private readonly db: Db,
    private readonly ai: AiService,
    private readonly vectorStore: VectorStore,
    private readonly reranker: Reranker = new LexicalReranker(),
  ) {}

  async retrieve(input: RetrieveInput): Promise<RetrieveResult> {
    const scope = input.scope;
    for (const field of REQUIRED_SCOPE_FIELDS) {
      if (!scope[field]) {
        throw Errors.badRequest(`نطاق الاسترجاع ناقص: ${field} مطلوب لمنع خلط المناهج`, "INVALID_RAG_SCOPE");
      }
    }

    const embedResult = await this.ai.embed({ texts: [input.question] });
    const query = embedResult.vectors[0];
    if (!query || query.length === 0) {
      throw Errors.internal("فشل توليد تضمين السؤال");
    }

    const topK = input.topK ?? 5;
    const hits = await this.vectorStore.search({ query, scope, topK, maxCandidates: 300 });

    if (hits.length === 0) return { chunks: [], contextText: "", model: embedResult.model };

    const chunkRows = await this.db.db
      .select()
      .from(chunksTable)
      .where(inArray(chunksTable.id, hits.map((h) => h.chunkId)));

    const byId = new Map(chunkRows.map((c) => [c.id, c]));
    const ranked: RankedChunk[] = hits
      .map((hit) => {
        const row = byId.get(hit.chunkId);
        if (!row) return null;
        const metadata: ChunkMetadata = {
          documentId: row.documentId,
          versionId: row.versionId ?? undefined,
          source: row.source ?? undefined,
          version: row.version ?? undefined,
          countryId: row.countryId ?? undefined,
          educationSystemId: row.educationSystemId ?? undefined,
          gradeId: row.gradeId ?? undefined,
          subjectId: row.subjectId ?? undefined,
          curriculumId: row.curriculumId ?? undefined,
          termId: row.termId ?? undefined,
          unitId: row.unitId ?? undefined,
          lessonId: row.lessonId ?? undefined,
          title: row.metadataJson ? (JSON.parse(row.metadataJson) as { title?: string }).title : undefined,
        };
        return { chunkId: row.id, content: row.content, score: hit.score, metadata, position: row.position };
      })
      .filter((x): x is RankedChunk => x !== null);

    const finalChunks = this.reranker.rerank(input.question, ranked).slice(0, topK);
    const contextText = finalChunks.map((c, i) => `[مصدر ${i + 1}]\n${c.content}`).join("\n\n---\n\n");
    return { chunks: finalChunks, contextText, model: embedResult.model };
  }
}

export type { CurriculumScope };