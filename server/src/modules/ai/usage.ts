import { and, eq, gte, lt } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { aiUsageLogs } from "../../db/schema.js";
import { newId } from "../../utils/ids.js";
import { PRICE_PER_1M_TOKENS } from "./types.js";

export interface UsageRecordInput {
  userId?: string;
  sessionId?: string;
  operation: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

/**
 * Records every AI call for cost awareness. Never stores message content —
 * only counters and identifiers (privacy-preserving).
 */
export class UsageTracker {
  constructor(private readonly db: Db) {}

  async record(input: UsageRecordInput): Promise<void> {
    const price = PRICE_PER_1M_TOKENS[input.model] ?? { input: 0, output: 0 };
    const costUsd = (input.inputTokens / 1_000_000) * price.input + (input.outputTokens / 1_000_000) * price.output;
    await this.db.db.insert(aiUsageLogs).values({
      id: newId("usage"),
      userId: input.userId ?? null,
      sessionId: input.sessionId ?? null,
      operation: input.operation,
      provider: input.provider,
      model: input.model,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      costUsd: Number(costUsd.toFixed(6)),
      latencyMs: input.latencyMs,
      createdAt: new Date(),
    });
  }

  /** Counts AI messages (tutor operation) for a student today — used for the daily budget. */
  async countTutorCallsForUserToday(userId: string): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const rows = await this.db.db
      .select({ n: aiUsageLogs.id })
      .from(aiUsageLogs)
      .where(and(eq(aiUsageLogs.userId, userId), eq(aiUsageLogs.operation, "tutor"), gte(aiUsageLogs.createdAt, start), lt(aiUsageLogs.createdAt, end)));
    return rows.length;
  }

  async totalUsageForUser(userId: string): Promise<{ calls: number; costUsd: number; tokens: number }> {
    const rows = await this.db.db.select().from(aiUsageLogs).where(eq(aiUsageLogs.userId, userId));
    const costUsd = rows.reduce((acc, r) => acc + r.costUsd, 0);
    const tokens = rows.reduce((acc, r) => acc + r.inputTokens + r.outputTokens, 0);
    return { calls: rows.length, costUsd, tokens };
  }
}

export { aiUsageLogs as usageTable };