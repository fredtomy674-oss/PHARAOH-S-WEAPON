import type { Db } from "../../db/index.js";
import { auditLogs } from "../../db/schema.js";

export interface AuditRecordInput {
  actorUserId?: string | null;
  action:
    | "auth.register"
    | "auth.login"
    | "auth.logout"
    | "profile.update"
    | "document.ingest"
    | "session.start"
    | "session.end"
    | "parent.link"
    | "parent.unlink"
    | "subscription.update"
    | "question.generate"
    | "forbidden.access";
  entityType: string;
  entityId?: string | null;
  beforeJson?: string | null;
  afterJson?: string | null;
  ip?: string | null;
}

/**
 * Audit logger for sensitive operations. Never stores secrets or message
 * content — only identifiers, actions and before/after JSON snapshots.
 */
export class AuditService {
  constructor(private readonly db: Db) {}

  async record(input: AuditRecordInput): Promise<void> {
    await this.db.db.insert(auditLogs).values({
      id: `aud_${crypto.randomUUID().replaceAll("-", "")}`,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      beforeJson: input.beforeJson ?? null,
      afterJson: input.afterJson ?? null,
      ip: input.ip ?? null,
      createdAt: new Date(),
    });
  }
}