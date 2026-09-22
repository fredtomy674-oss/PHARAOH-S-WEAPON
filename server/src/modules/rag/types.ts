/**
 * RAG domain types. The scope filter is the security barrier that prevents
 * content from the wrong country/grade/subject/lesson entering a session.
 */

export interface CurriculumScope {
  countryId?: string;
  educationSystemId?: string;
  gradeId?: string;
  subjectId?: string;
  curriculumId?: string;
  termId?: string;
  unitId?: string;
  lessonId?: string;
  conceptIds?: string[];
}

/** Metadata attached to every chunk (mirrors RAG_SYSTEM.md §2). */
export interface ChunkMetadata extends CurriculumScope {
  documentId: string;
  versionId?: string;
  source?: string;
  version?: string;
  title?: string;
}

export interface RankedChunk {
  chunkId: string;
  content: string;
  score: number;
  metadata: ChunkMetadata;
  position: number;
}

export interface VectorStore {
  upsert(input: { chunkId: string; embedding: number[]; model: string }): Promise<void>;
  remove(chunkId: string): Promise<void>;
  search(input: { query: number[]; scope: CurriculumScope; topK: number; maxCandidates?: number }): Promise<Array<{ chunkId: string; score: number }>>;
}

export interface Reranker {
  rerank(query: string, chunks: RankedChunk[]): RankedChunk[];
}

export interface RetrieveInput {
  question: string;
  scope: CurriculumScope;
  topK?: number;
}

export interface RetrieveResult {
  chunks: RankedChunk[];
  contextText: string;
  model: string;
}

/** Required scope fields to query. Anything less risks cross-curriculum leakage. */
export const REQUIRED_SCOPE_FIELDS = [
  "countryId",
  "educationSystemId",
  "gradeId",
  "subjectId",
  "curriculumId",
  "lessonId",
] as const;