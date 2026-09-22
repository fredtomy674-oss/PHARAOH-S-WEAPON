import { config } from "../../config/env.js";
import type { Db } from "../../db/index.js";
import { AiCache } from "./cache.js";
import { ModelRouter } from "./router.js";
import { UsageTracker } from "./usage.js";
import { GeminiEmbeddingProvider, GeminiLLMProvider } from "./providers/gemini.js";
import { MockEmbeddingProvider, MockLLMProvider } from "./providers/mock.js";
import { Errors } from "../../utils/errors.js";
import type { AIProviders, EmbeddingRequest, EmbeddingResponse, LLMRequest, LLMResponse } from "./types.js";

/**
 * Facade for all AI access. Constructed once per app; modules depend on this
 * class only. Choosing a provider is a pure environment decision.
 */
export class AiService {
  readonly providers: AIProviders;
  readonly router: ModelRouter;
  readonly usage: UsageTracker;
  readonly cache: AiCache;

  constructor(db: Db, opts?: { forceProvider?: "mock" | "gemini"; overrides?: Partial<Record<"classifier" | "tutor" | "recap" | "feedback" | "embedding", string>> }) {
    const llmChoice = opts?.forceProvider ?? config.AI_LLM_PROVIDER;
    const embedChoice = opts?.forceProvider ?? config.AI_EMBEDDING_PROVIDER;

    const llm = llmChoice === "gemini" ? new GeminiLLMProvider() : new MockLLMProvider();
    const embeddings = embedChoice === "gemini" ? new GeminiEmbeddingProvider() : new MockEmbeddingProvider();

    this.providers = { llm, embeddings };
    this.router = new ModelRouter({ overrides: opts?.overrides });
    this.usage = new UsageTracker(db);
    this.cache = new AiCache();
  }

  /** Single entry point for LLM calls (routing + cache + usage). */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const model = this.router.llmModel(request.operation, request.model);
    const cacheable = request.operation === "classifier";
    const key = cacheable ? this.cache.key(request.operation, model, request.messages) : null;
    if (key) {
      const hit = this.cache.get(key);
      if (hit) return hit;
    }
    const started = Date.now();
    let response: LLMResponse;
    try {
      response = await this.providers.llm.complete({ ...request, model });
    } catch (err) {
      throw err;
    }
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
    if (key) this.cache.set(key, response);
    return response;
  }

  /** Single entry point for embedding calls. */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const model = this.router.embeddingModel("embedding", request.model);
    const response = await this.providers.embeddings.embed({ ...request, model });
    await this.usage.record({
      operation: "embedding",
      provider: this.providers.embeddings.id,
      model: response.model,
      inputTokens: response.vectors.length,
      outputTokens: 0,
      latencyMs: 0,
    });
    return response;
  }

  assertOfflineOnly(): never {
    throw Errors.internal("المزود الحقيقي يتطلب مفتاحًا وترخيصًا — استخدم mock للتطوير المحلي");
  }
}