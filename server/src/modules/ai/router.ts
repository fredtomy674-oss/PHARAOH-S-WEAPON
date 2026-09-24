import { config } from "../../config/env.js";
import type { AIOperation } from "./types.js";

/**
 * Cost-aware routing: picks the cheapest suitable model per operation.
 * Config lives in env (AI_ROUTING_*). Later this can become a full
 * capability router (cheap model for classification, big model for recap...).
 */
export class ModelRouter {
  private readonly overrides: Partial<Record<AIOperation, string>>;

  constructor(opts?: { overrides?: Partial<Record<AIOperation, string>> }) {
    this.overrides = opts?.overrides ?? {};
  }

  /** Resolve the model to use for an operation + requested default. */
  llmModel(operation: AIOperation, requested?: string): string {
    const candidate = requested ?? this.overrides[operation];
    if (candidate && candidate !== "default") return candidate;
    return config.GEMINI_LLM_MODEL;
  }

  /** OCR reads scanned pages — a vision-capable model (dedicated env override). */
  ocrModel(): string {
    return config.GEMINI_OCR_MODEL;
  }

  embeddingModel(operation: AIOperation, requested?: string): string {
    const candidate = requested ?? this.overrides[operation];
    if (candidate && candidate !== "default") return candidate;
    return config.GEMINI_EMBEDDING_MODEL;
  }
}