import { openDbAndMigrate } from "./db/index.js";
import { buildApp } from "./app.js";
import { config } from "./config/env.js";

async function main(): Promise<void> {
  const db = openDbAndMigrate();
  const app = await buildApp(db);

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "shutting down");
    await app.close();
    db.sqlite.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info(
    `سلاح الفرعون tutor listening on http://${config.HOST}:${config.PORT} ` +
      `(LLM=${app.ai.providers.llm.id}, VectorStore=${config.VECTOR_STORE}, Reranker=${config.RAG_ENABLE_RERANK ? config.RAG_RERANKER : "off"}, Cache=${config.AI_CACHE_ENABLED ? "on" : "off"}, RAG=${config.RAG_TOP_K} chunks)`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal boot error:", err);
  process.exit(1);
});