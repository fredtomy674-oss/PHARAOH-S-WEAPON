import { sha256Hex } from "../../utils/ids.js";
import type { LLMMessage, LLMResponse } from "./types.js";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Tiny in-memory LRU cache for repeated, deterministic AI calls
 * (intent classification, reranking, embeddings, OCR). Tutor replies are NOT
 * cached (they must stay dynamic per student). Keeps cost low — a cache hit
 * skips the provider call entirely, so usage rows record nothing for it.
 */
export class AiCache<T = LLMResponse> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private hits = 0;
  private misses = 0;

  constructor(opts: { ttlMs?: number; maxEntries?: number } = {}) {
    this.ttlMs = opts.ttlMs ?? 5 * 60 * 1000;
    this.maxEntries = opts.maxEntries ?? 256;
  }

  private maxEntries: number;

  key(operation: string, model: string, messages: LLMMessage[]): string {
    return `${operation}:${model}:${sha256Hex(JSON.stringify(messages))}`;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.ttlMs) });
  }

  clear(): void {
    this.store.clear();
  }

  /** Hit/miss counters + size — surfaced on /api/health (PHASE 22). */
  stats(): { hits: number; misses: number; size: number; maxEntries: number } {
    return { hits: this.hits, misses: this.misses, size: this.store.size, maxEntries: this.maxEntries };
  }
}