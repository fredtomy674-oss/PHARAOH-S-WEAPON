import "dotenv/config";
import { z } from "zod";

/**
 * Central, validated environment configuration.
 * Every secret/knob lives here; nothing is ever hardcoded in module code.
 */

const boolFromString = z
  .string()
  .optional()
  .transform((v) => v === undefined || v === "" || v.toLowerCase() === "true");

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().positive().default(3001),
  SESSION_SECRET: z.string().min(1).default("dev-only-insecure-secret-change-me"),
  DB_FILE: z.string().default("./data/alfarouq.sqlite"),
  DATABASE_URL: z.string().optional(),

  AI_LLM_PROVIDER: z.enum(["mock", "gemini"]).default("mock"),
  AI_EMBEDDING_PROVIDER: z.enum(["mock", "gemini"]).default("mock"),
  /** OCR of scanned files (Path A chats + Path B curriculum import): which provider reads the pages. */
  AI_OCR_PROVIDER: z.enum(["mock", "gemini"]).default("mock"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_LLM_MODEL: z.string().default("gemini-2.0-flash"),
  GEMINI_EMBEDDING_MODEL: z.string().default("text-embedding-004"),
  /** Vision-capable model used to read scanned PDF/DOCX pages (inline input). */
  GEMINI_OCR_MODEL: z.string().default("gemini-2.0-flash"),
  AI_ROUTING_LLM: z.string().default("default"),
  AI_ROUTING_EMBEDDING: z.string().default("default"),

  // AI caching (PHASE 22 / D-026): repeated deterministic calls hit an
  // in-memory LRU instead of the real provider. Only deterministic operations
  // are served from cache: classifier + rerank (LLM), embeddings (same texts →
  // same vectors) and OCR (same bytes → same text). Cache hits do NOT write
  // usage rows (zero provider cost). Tutor/recap/feedback stay uncached.
  AI_CACHE_ENABLED: boolFromString.default("true"),
  AI_CACHE_TTL_MS: z.coerce.number().int().positive().default(300000),
  AI_CACHE_EMBEDDING_TTL_MS: z.coerce.number().int().positive().default(3600000),
  AI_CACHE_OCR_TTL_MS: z.coerce.number().int().positive().default(86400000),
  AI_CACHE_MAX_ENTRIES: z.coerce.number().int().positive().default(256),

  // Cost guardrails
  DAILY_MESSAGE_LIMIT: z.coerce.number().int().nonnegative().default(50),
  /** Premium plan daily budget (PHASE 20). 0 = unlimited — the MVP upsell
   *  cliff: free students are capped by DAILY_MESSAGE_LIMIT, premium by this. */
  PREMIUM_DAILY_MESSAGE_LIMIT: z.coerce.number().int().nonnegative().default(0),

  // Rate limiting (per-IP, per minute). Default protects dev/prod; tests raise
  // it via env so automated suites never trip false 429s.
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),

  // Vision: max size (KB) for a photo attached to a tutor message. MVP accepts
  // PNG/JPEG/WebP images up to this size (5 MB default).
  MAX_IMAGE_KB: z.coerce.number().int().positive().default(5000),

  // Document upload (student-attached PDF/DOCX/TXT/MD in chat): max raw file
  // size in KB (10 MB default) and the cap on extracted text (chars) that is
  // actually shipped to the AI provider (cost guardrail).
  MAX_FILE_KB: z.coerce.number().int().positive().default(10000),
  MAX_DOCUMENT_CHARS: z.coerce.number().int().positive().default(20000),

  // OCR: cap on recognized text returned by the OCR provider per file (same
  // cost-guardrail idea as MAX_DOCUMENT_CHARS; Path B uses its own larger cap).
  MAX_OCR_CHARS: z.coerce.number().int().positive().default(20000),

  // Curriculum file import (Path B, admin): max raw file size in KB (20 MB
  // default) and the cap on extracted text (chars) chunked+embedded into the
  // knowledge base. Separate from the student-file caps by design.
  MAX_CURRICULUM_FILE_KB: z.coerce.number().int().positive().default(20480),
  MAX_CURRICULUM_DOCUMENT_CHARS: z.coerce.number().int().positive().default(200000),

  // RAG
  RAG_TOP_K: z.coerce.number().int().positive().default(5),
  RAG_ENABLE_RERANK: boolFromString.default("true"),
  RAG_MAX_CONTEXT_CHARS: z.coerce.number().int().positive().default(12000),
  /** Reranker flavor: lexical (fast, deterministic, default) | model (LLM-scored, opt-in). */
  RAG_RERANKER: z.enum(["lexical", "model"]).default("lexical"),

  // Vector store adapter (PHASE 21). sqlite = local MVP (default, zero deps);
  // qdrant = Qdrant over HTTP (Docker/Qdrant Cloud) — plain fetch, no client dep.
  VECTOR_STORE: z.enum(["sqlite", "qdrant"]).default("sqlite"),
  QDRANT_URL: z.string().url().default("http://127.0.0.1:6333"),
  QDRANT_COLLECTION: z.string().min(1).default("alfarouq"),
  /** Optional fixed vector dimension; when absent the store adopts the first embedding's dim. */
  QDRANT_DIMENSION: z.coerce.number().int().positive().optional(),

  // Frontend
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  API_BASE_URL: z.string().default("/api"),

  // Live provider tests opt-in (costs money & sends data externally)
  RUN_LIVE_TESTS: boolFromString.default("false"),
});

export type AppConfig = z.infer<typeof EnvSchema>;

const _parsed = EnvSchema.safeParse(process.env);
if (!_parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration:", _parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration — check .env");
}

export const config: AppConfig = _parsed.data;

export const isProd = config.NODE_ENV === "production";
export const isTest = config.NODE_ENV === "test";

/** True when the process should attempt real external AI provider calls. */
export const liveTestsEnabled = () => config.RUN_LIVE_TESTS === true;