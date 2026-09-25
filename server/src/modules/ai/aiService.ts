import { config } from "../../config/env.js";
import type { Db } from "../../db/index.js";
import { AiCache } from "./cache.js";
import { ModelRouter } from "./router.js";
import { UsageTracker } from "./usage.js";
import { GeminiEmbeddingProvider, GeminiLLMProvider, GeminiOcrProvider } from "./providers/gemini.js";
import { MockEmbeddingProvider, MockLLMProvider, MockOcrProvider } from "./providers/mock.js";
import { Errors } from "../../utils/errors.js";
import { sha256Hex } from "../../utils/ids.js";
import type { AIProviders, EmbeddingRequest, EmbeddingResponse, LLMRequest, LLMResponse, OcrRequest, OcrResponse } from "./types.js";

const LLM_CACHEABLE: ReadonlySet<string> = new Set(["classifier", "rerank", "question_gen"]);

/**
 * Facade for all AI access. Constructed once per app; modules depend on this
 * class only. Choosing a provider is a pure environment decision.
 *
 * PHASE 22 (D-026) — deterministic calls are served from the in-memory LRU
 * and never reach the real provider: `classifier` + `rerank` (LLM), embeddings
 * (same texts → same vectors) and OCR (same bytes → same text). A cache hit
 * records NO usage row (zero provider cost). Tutor/recap/feedback stay dynamic.
 */
export class AiService {
  readonly providers: AIProviders;
  readonly router: ModelRouter;
  readonly usage: UsageTracker;
  /** LLM cache (classifier + rerank). Hit stats aggregate in `cacheStats()`. */
  readonly cache: AiCache<LLMResponse>;
  private readonly embeddingCache: AiCache<EmbeddingResponse>;
  private readonly ocrCache: AiCache<OcrResponse>;
  private readonly cacheEnabled: boolean;

  constructor(
    db: Db,
    opts?: {
      forceProvider?: "mock" | "gemini";
      overrides?: Partial<Record<"classifier" | "tutor" | "recap" | "feedback" | "embedding" | "ocr" | "rerank" | "question_gen", string>>;
      /** Test/override knob for the module-scoped AI_CACHE_ENABLED. */
      cacheEnabled?: boolean;
    },
  ) {
    const llmChoice = opts?.forceProvider ?? config.AI_LLM_PROVIDER;
    const embedChoice = opts?.forceProvider ?? config.AI_EMBEDDING_PROVIDER;
    const ocrChoice = opts?.forceProvider ?? config.AI_OCR_PROVIDER;

    const llm = llmChoice === "gemini" ? new GeminiLLMProvider() : new MockLLMProvider();
    const embeddings = embedChoice === "gemini" ? new GeminiEmbeddingProvider() : new MockEmbeddingProvider();
    const ocr = ocrChoice === "gemini" ? new GeminiOcrProvider() : new MockOcrProvider();

    this.providers = { llm, embeddings, ocr };
    this.router = new ModelRouter({ overrides: opts?.overrides });
    this.usage = new UsageTracker(db);
    this.cacheEnabled = opts?.cacheEnabled ?? config.AI_CACHE_ENABLED;
    this.cache = new AiCache<LLMResponse>({ ttlMs: config.AI_CACHE_TTL_MS, maxEntries: config.AI_CACHE_MAX_ENTRIES });
    this.embeddingCache = new AiCache<EmbeddingResponse>({ ttlMs: config.AI_CACHE_EMBEDDING_TTL_MS, maxEntries: config.AI_CACHE_MAX_ENTRIES });
    this.ocrCache = new AiCache<OcrResponse>({ ttlMs: config.AI_CACHE_OCR_TTL_MS, maxEntries: config.AI_CACHE_MAX_ENTRIES });
  }

  /** Single entry point for LLM calls (routing + cache + usage). */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const model = this.router.llmModel(request.operation, request.model);
    const cacheable = this.cacheEnabled && LLM_CACHEABLE.has(request.operation);
    const key = cacheable ? this.cache.key(request.operation, model, request.messages) : null;
    if (key) {
      const hit = this.cache.get(key);
      if (hit) return hit;
    }
    const started = Date.now();
    const response = await this.providers.llm.complete({ ...request, model });
    await this.usage.record({
      userId: request.contextUserId,
      sessionId: request.contextSessionId,
      operation: request.operation,
      provider: this.providers.llm.id,
      model: response.model,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      latencyMs: Date.now() - started,
    });
    if (key) this.cache.set(key, response, config.AI_CACHE_TTL_MS);
    return response;
  }

  /** Single entry point for embedding calls (deterministic → cached). */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const model = this.router.embeddingModel("embedding", request.model);
    const key = this.cacheEnabled ? `embedding:${model}:${sha256Hex(JSON.stringify(request.texts))}` : null;
    if (key) {
      const hit = this.embeddingCache.get(key);
      if (hit) return hit;
    }
    const response = await this.providers.embeddings.embed({ ...request, model });
    if (!key) {
      await this.usage.record({
        operation: "embedding",
        provider: this.providers.embeddings.id,
        model: response.model,
        inputTokens: response.vectors.length,
        outputTokens: 0,
        latencyMs: 0,
      });
    } else {
      this.embeddingCache.set(key, response, config.AI_CACHE_EMBEDDING_TTL_MS);
    }
    return response;
  }

  /** Single entry point for OCR calls (scanned file recognition + usage log). */
  async ocr(request: OcrRequest): Promise<OcrResponse> {
    const model = this.router.ocrModel();
    const key = this.cacheEnabled ? `ocr:${model}:${sha256Hex(`${request.mimeType}:${request.base64}`)}` : null;
    if (key) {
      const hit = this.ocrCache.get(key);
      if (hit) return hit;
    }
    const started = Date.now();
    const response = await this.providers.ocr.ocr({ ...request, model });
    await this.usage.record({
      userId: request.contextUserId,
      sessionId: request.contextSessionId,
      operation: "ocr",
      provider: this.providers.ocr.id,
      model: response.model,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      latencyMs: Date.now() - started,
    });
    if (key) this.ocrCache.set(key, response, config.AI_CACHE_OCR_TTL_MS);
    return response;
  }

  /** Combined hit/miss counters across all three caches (surfaced on /api/health). */
  cacheStats(): { hits: number; misses: number; size: number; maxEntries: number } {
    const counts = [this.cache.stats(), this.embeddingCache.stats(), this.ocrCache.stats()];
    return {
      hits: counts.reduce((acc, c) => acc + c.hits, 0),
      misses: counts.reduce((acc, c) => acc + c.misses, 0),
      size: counts.reduce((acc, c) => acc + c.size, 0),
      maxEntries: this.cache.stats().maxEntries,
    };
  }

  assertOfflineOnly(): never {
    throw Errors.internal("المزود الحقيقي يتطلب مفتاحًا وترخيصًا — استخدم mock للتطوير المحلي");
  }
}