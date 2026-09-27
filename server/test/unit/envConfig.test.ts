import { describe, expect, it } from "vitest";
import { EnvSchema } from "../../src/config/env.js";

/**
 * The environment is the one thing that must be readable straight out of the
 * shipped template: a developer copies `.env.example` and boots. These cases
 * pin the blank-placeholder behavior that makes that work (a blank value means
 * "unset", never 0/false-by-accident) plus the defaults the docs advertise.
 */
describe("EnvSchema — .env template boots as-is", () => {
  it("leaves a blank optional number unset instead of reading it as 0", () => {
    // `.env.example` ships `QDRANT_DIMENSION=`; z.coerce.number() would turn
    // that into 0 and the whole app would refuse to start.
    expect(EnvSchema.parse({ QDRANT_DIMENSION: "" }).QDRANT_DIMENSION).toBeUndefined();
    expect(EnvSchema.parse({ QDRANT_DIMENSION: "   " }).QDRANT_DIMENSION).toBeUndefined();
    expect(EnvSchema.parse({}).QDRANT_DIMENSION).toBeUndefined();
  });

  it("still accepts an explicit dimension and still rejects a bad one", () => {
    expect(EnvSchema.parse({ QDRANT_DIMENSION: "768" }).QDRANT_DIMENSION).toBe(768);
    expect(EnvSchema.safeParse({ QDRANT_DIMENSION: "0" }).success).toBe(false);
    expect(EnvSchema.safeParse({ QDRANT_DIMENSION: "-4" }).success).toBe(false);
  });

  it("reads a blank boolean as 'unset' (the field default) and only 'true' as true", () => {
    // Same rule as the blank optional number: an empty value in .env means
    // "I did not set this". It must never flip a switch on by accident —
    // RUN_LIVE_TESTS= (a natural way to leave it alone) spends real money.
    expect(EnvSchema.parse({ AI_CACHE_ENABLED: "" }).AI_CACHE_ENABLED).toBe(true);
    expect(EnvSchema.parse({ RAG_ENABLE_RERANK: "" }).RAG_ENABLE_RERANK).toBe(true);
    expect(EnvSchema.parse({ RUN_LIVE_TESTS: "" }).RUN_LIVE_TESTS).toBe(false);
    expect(EnvSchema.parse({}).RUN_LIVE_TESTS).toBe(false);
    expect(EnvSchema.parse({ AI_CACHE_ENABLED: "true" }).AI_CACHE_ENABLED).toBe(true);
    expect(EnvSchema.parse({ AI_CACHE_ENABLED: "TRUE" }).AI_CACHE_ENABLED).toBe(true);
    expect(EnvSchema.parse({ AI_CACHE_ENABLED: "false" }).AI_CACHE_ENABLED).toBe(false);
  });

  it("keeps the offline defaults the promise of the project rests on", () => {
    const parsed = EnvSchema.parse({});
    expect(parsed.AI_LLM_PROVIDER).toBe("mock");
    expect(parsed.AI_EMBEDDING_PROVIDER).toBe("mock");
    expect(parsed.SPEECH_PROVIDER).toBe("none");
    expect(parsed.VECTOR_STORE).toBe("sqlite");
    expect(parsed.NODE_ENV).toBe("development");
  });

  it("accepts the real-provider switch once a key is present", () => {
    const parsed = EnvSchema.parse({
      AI_LLM_PROVIDER: "gemini",
      AI_EMBEDDING_PROVIDER: "gemini",
      SPEECH_PROVIDER: "gemini",
      GEMINI_API_KEY: "a-key",
    });
    expect(parsed.AI_LLM_PROVIDER).toBe("gemini");
    expect(parsed.SPEECH_PROVIDER).toBe("gemini");
    expect(parsed.GEMINI_TTS_VOICE).toBe("Kore");
  });
});
