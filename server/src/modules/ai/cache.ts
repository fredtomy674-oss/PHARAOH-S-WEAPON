import { sha256Hex } from "../../utils/ids.js";
import type { LLMMessage, LLMResponse } from "./types.js";

interface CacheEntry {
  value: LLMResponse;
  expiresAt: number;
}

/**
 * Tiny in-memory LRU cache for repeated, deterministic-ish AI calls
 * (intent classification, lesson metadata). Tutor replies are NOT cached
 * (they must stay dynamic per student). Keeps cost low.
 */
export class AiCache {
  private store = new Map<string, CacheEntry>();
  private readonly ttlMs: number;

  constructor(opts: { ttlMs?: number; maxEntries?: number } = {}) {
    this.ttlMs = opts.ttlMs ?? 5 * 60 * 1000;
    this.maxEntries = opts.maxEntries ?? 256;
  }

  private maxEntries: number;

  key(operation: string, model: string, messages: LLMMessage[]): string {
    return `${operation}:${model}:${sha256Hex(JSON.stringify(messages))}`;
  }

  get(key: string): LLMResponse | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: LLMResponse): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.store.clear();
  }
}