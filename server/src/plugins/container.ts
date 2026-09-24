import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import type { Db } from "../db/index.js";
import { AiService } from "../modules/ai/aiService.js";
import { AuditService } from "../modules/audit/service.js";
import { AuthService } from "../modules/auth/service.js";
import { CurriculumService } from "../modules/curriculum/service.js";
import { KnowledgeService } from "../modules/knowledge/service.js";
import { OcrService } from "../modules/ocr/service.js";
import { ParentService } from "../modules/parent/service.js";
import { RetrievalService } from "../modules/rag/retrieval.js";
import { SqliteVectorStore } from "../modules/rag/vectorStore.js";
import { SessionService } from "../modules/sessions/service.js";
import { MemoryService } from "../modules/tutor/memoryService.js";
import { TutorEngine } from "../modules/tutor/tutorEngine.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Db;
    ai: AiService;
    audit: AuditService;
    authService: AuthService;
    curriculum: CurriculumService;
    knowledge: KnowledgeService;
    ocr: OcrService;
    retrieval: RetrievalService;
    vectorStore: SqliteVectorStore;
    memory: MemoryService;
    tutor: TutorEngine;
    sessions: SessionService;
    parents: ParentService;
    setSessionCookie: (reply: FastifyReply, token: string, maxAgeMs: number) => void;
    clearSessionCookie: (reply: FastifyReply) => void;
  }
}

export interface ContainerOptions {
  db: Db;
  forceProvider?: "mock" | "gemini";
}

/**
 * Builds and exposes every service on the Fastify instance. Central wiring
 * keeps modules decoupled: swapping a provider or storage is one-line config.
 */
export const containerPlugin: FastifyPluginAsync<ContainerOptions> = fp(async (app: FastifyInstance, opts: ContainerOptions) => {
  const db = opts.db;

  const ai = new AiService(db, { forceProvider: opts.forceProvider });
  const audit = new AuditService(db);
  const authService = new AuthService(db);
  const curriculum = new CurriculumService(db);
  const vectorStore = new SqliteVectorStore(db);
  const retrieval = new RetrievalService(db, ai, vectorStore);
  const memory = new MemoryService(db);
  const tutor = new TutorEngine(db, ai, retrieval, memory);
  const knowledge = new KnowledgeService(db, ai, vectorStore);
  const ocr = new OcrService(ai);
  const sessions = new SessionService(db, curriculum, tutor, memory, audit, ai, ocr);
  const parents = new ParentService(db, memory);

  app.decorate("db", db);
  app.decorate("ai", ai);
  app.decorate("audit", audit);
  app.decorate("authService", authService);
  app.decorate("curriculum", curriculum);
  app.decorate("knowledge", knowledge);
  app.decorate("ocr", ocr);
  app.decorate("retrieval", retrieval);
  app.decorate("vectorStore", vectorStore);
  app.decorate("memory", memory);
  app.decorate("tutor", tutor);
  app.decorate("sessions", sessions);
  app.decorate("parents", parents);
});