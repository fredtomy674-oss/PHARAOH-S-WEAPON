import { config as loadEnvFiles } from "dotenv";
import { z } from "zod";

/**
 * Central, validated environment configuration.
 * Every secret/knob lives here; nothing is ever hardcoded in module code.
 *
 * Every npm script runs with cwd = server/, so the `dotenv/config` default
 * (./.env) would miss the repository-root `.env` the docs tell you to create.
 * Both locations are read — first match wins and real process env still wins
 * over both — so copying `.env.example` works from either place.
 */
loadEnvFiles({ path: [".env", "../.env"], quiet: true });

/**
 * A boolean knob read from the environment. A blank value (`VAR=` in .env)
 * means "I did not set this" and therefore yields the field's own default —
 * it must never silently read as `true` (that would flip a cost/safety switch
 * like RUN_LIVE_TESTS on by accident).
 */
const boolFromString = (defaultValue: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v.trim() === "" ? defaultValue : v.toLowerCase() === "true"));

/**
 * An optional number that a blank `.env` value means "leave it unset".
 * `.env.example` ships placeholders like `QDRANT_DIMENSION=`; a plain
 * `z.coerce.number()` would read that as 0 and refuse to boot, so copying the
 * template verbatim has to keep working.
 */
const optionalIntFromString = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v.trim() === "" ? undefined : v))
  .pipe(z.coerce.number().int().positive().optional());

/** The whole environment contract, exported so tests can parse a candidate env without touching process.env. */
export const EnvSchema = z.object({
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

  // PHASE 40 (D-044) — توليد الصوت على الخادم. المتصفح لا يملك محرّك نطق، بل
  // يستعير أصوات نظام تشغيل الطالب، فلا ينطق العربية جهاز بلا حزمة صوت
  // عربية — مهما دقّ كود التطبيق. الحل: التوليد على الخادم، فيبقى المفتاح
  // والصوت عندنا ولا يثبّت الطالب شيئًا.
  // "none" (default) = off: the browser voice is used, exactly as before.
  // Set to "gemini" once (with GEMINI_API_KEY) and every student hears Arabic.
  // "stub" generates a deterministic local WAV — for the E2E suite only.
  SPEECH_PROVIDER: z.enum(["none", "stub", "gemini"]).default("none"),
  GEMINI_TTS_MODEL: z.string().default("gemini-2.5-flash-preview-tts"),
  /** Prebuilt voice name; the model family decides which languages it covers. */
  GEMINI_TTS_VOICE: z.string().default("Kore"),
  /** Optional BCP-47 dialect hint per language (e.g. "ar-EG"). Empty = the
   *  model detects the language from the text itself. */
  GEMINI_TTS_LANGUAGE_AR: z.string().default(""),
  GEMINI_TTS_LANGUAGE_EN: z.string().default(""),
  /** Cap on synthesized text (chars) — bounds latency and cost for a long reply. */
  SPEECH_MAX_CHARS: z.coerce.number().int().positive().default(4000),
  /** Abort the provider call after this many ms; the client then falls back to
   *  the browser voice instead of waiting forever. */
  SPEECH_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),

  // AI caching (PHASE 22 / D-026): repeated deterministic calls hit an
  // in-memory LRU instead of the real provider. Only deterministic operations
  // are served from cache: classifier + rerank (LLM), embeddings (same texts →
  // same vectors) and OCR (same bytes → same text). Cache hits do NOT write
  // usage rows (zero provider cost). Tutor/recap/feedback stay uncached.
  AI_CACHE_ENABLED: boolFromString(true),
  AI_CACHE_TTL_MS: z.coerce.number().int().positive().default(300000),
  AI_CACHE_EMBEDDING_TTL_MS: z.coerce.number().int().positive().default(3600000),
  AI_CACHE_OCR_TTL_MS: z.coerce.number().int().positive().default(86400000),
  AI_CACHE_MAX_ENTRIES: z.coerce.number().int().positive().default(256),

  // Cost guardrails
  DAILY_MESSAGE_LIMIT: z.coerce.number().int().nonnegative().default(50),
  /** Premium plan daily budget (PHASE 20). 0 = unlimited — the MVP upsell
   *  cliff: free students are capped by DAILY_MESSAGE_LIMIT, premium by this. */
  PREMIUM_DAILY_MESSAGE_LIMIT: z.coerce.number().int().nonnegative().default(0),

  // Concept mastery (PHASE 24): exponential forgetting rate per day, applied
  // READ-side when summarizing mastery. Default 0.02 ≈ ~2%/day (half-life ≈ 35
  // days); 0 disables decay (static mastery).
  MASTERY_DECAY_PER_DAY: z.coerce.number().min(0).default(0.02),

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
  RAG_ENABLE_RERANK: boolFromString(true),
  RAG_MAX_CONTEXT_CHARS: z.coerce.number().int().positive().default(12000),
  /** Reranker flavor: lexical (fast, deterministic, default) | model (LLM-scored, opt-in). */
  RAG_RERANKER: z.enum(["lexical", "model"]).default("lexical"),

  // Vector store adapter (PHASE 21). sqlite = local MVP (default, zero deps);
  // qdrant = Qdrant over HTTP (Docker/Qdrant Cloud) — plain fetch, no client dep.
  VECTOR_STORE: z.enum(["sqlite", "qdrant"]).default("sqlite"),
  QDRANT_URL: z.string().url().default("http://127.0.0.1:6333"),
  QDRANT_COLLECTION: z.string().min(1).default("alfarouq"),
  /** Optional fixed vector dimension; when absent the store adopts the first embedding's dim. */
  QDRANT_DIMENSION: optionalIntFromString,

  // Frontend
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  API_BASE_URL: z.string().default("/api"),

  // Live provider tests opt-in (costs money & sends data externally)
  RUN_LIVE_TESTS: boolFromString(false),
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