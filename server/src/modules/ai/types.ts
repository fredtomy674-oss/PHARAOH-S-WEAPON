/**
 * AI Provider abstraction — the ONLY way module code talks to models.
 * Swapping providers = config change, never a rebuild.
 */

export type LLMRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

/** Inline image attachment for a multimodal turn (Vision upload). */
export interface ImageInput {
  mimeType: string;
  base64: string;
}

/**
 * Inline document attachment for a tutor turn (student-uploaded file in chat).
 * The text is ALWAYS server-extracted, untrusted user data, already bounded by
 * MAX_DOCUMENT_CHARS — never interpolated into the system prompt.
 */
export interface DocumentInput {
  fileName: string | null;
  mimeType: string;
  text: string;
}

/** High-level capabilities used for routing (cost-aware: classifier uses a cheap model). */
export type AIOperation = "classifier" | "tutor" | "recap" | "feedback" | "embedding";

export interface LLMRequest {
  operation: AIOperation;
  messages: LLMMessage[];
  /** Images attached to the latest user turn (multimodal providers only). */
  images?: ImageInput[];
  /** Documents attached to the latest user turn (extracted text, untrusted). */
  documents?: DocumentInput[];
  /** Ask the provider for JSON via its native structured-output path when supported. */
  json?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
  /** Explicit model override (e.g. a fine-tuned variant later). */
  model?: string;
  /** Server-side trace context (never sent to the provider). */
  contextUserId?: string;
  contextSessionId?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface LLMProvider {
  readonly id: string;
  complete(request: LLMRequest): Promise<LLMResponse>;
}

export interface EmbeddingRequest {
  texts: string[];
  model?: string;
}

export interface EmbeddingResponse {
  vectors: number[][];
  model: string;
  dims: number;
}

export interface EmbeddingProvider {
  readonly id: string;
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
}

export interface AIProviders {
  llm: LLMProvider;
  embeddings: EmbeddingProvider;
}

/** Estimated USD cost per 1M tokens per model (approx; usage logs are estimates). */
export const PRICE_PER_1M_TOKENS: Record<string, { input: number; output: number }> = {
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "text-embedding-004": { input: 0.125, output: 0 },
  mock: { input: 0, output: 0 },
};

export type { LLMRole as Role };