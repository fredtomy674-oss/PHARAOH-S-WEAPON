import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
    // Tests never touch external providers; the mock provider is the default.
    // MAX_IMAGE_KB=1 lets the API suite exercise the size cap cheaply.
    env: { NODE_ENV: "test", AI_LLM_PROVIDER: "mock", AI_EMBEDDING_PROVIDER: "mock", MAX_IMAGE_KB: "1", MAX_FILE_KB: "4", MAX_CURRICULUM_FILE_KB: "4" },
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
  },
});