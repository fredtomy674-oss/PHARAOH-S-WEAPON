import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
    // Tests never touch external providers; the mock provider is the default.
    env: { NODE_ENV: "test", AI_LLM_PROVIDER: "mock", AI_EMBEDDING_PROVIDER: "mock" },
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
  },
});