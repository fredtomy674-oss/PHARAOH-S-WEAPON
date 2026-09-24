import { eq } from "drizzle-orm";
import { config } from "../../config/env.js";
import type { Db } from "../../db/index.js";
import { subscriptions } from "../../db/schema.js";
import { newId } from "../../utils/ids.js";

/**
 * PHASE 20 — Subscriptions (billing without a payment gateway).
 *
 * The `subscriptions` table was schema-ready since PHASE 2; this service turns
 * it into real product semantics:
 *   - A row is lazily ensured for every student (free / trialing by default).
 *   - `plan` names a tier; `status` + `expiresAt` decide whether the tier is
 *     actually in effect (premium requires trialing|active AND not expired).
 *   - The daily tutor budget is derived from the effective plan: free students
 *     are capped by DAILY_MESSAGE_LIMIT, premium by PREMIUM_DAILY_MESSAGE_LIMIT
 *     (0 = unlimited). No external provider — an admin grants/revokes via the
 *     admin API (billing gateway stays a later phase).
 */
export const SUBSCRIPTION_PLANS = ["free", "premium"] as const;
export const SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due", "cancelled"] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export interface SubscriptionSummary {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startedAt: string | null;
  expiresAt: string | null;
  /** Daily tutor-call allowance derived from the effective plan (0 = unlimited). */
  dailyLimit: number;
}

export class SubscriptionService {
  constructor(private readonly db: Db) {}

  /** Lazy row creation: every student implicitly has a free subscription. */
  private async ensure(studentId: string): Promise<typeof subscriptions.$inferSelect> {
    const existing = await this.db.db.select().from(subscriptions).where(eq(subscriptions.studentId, studentId)).get();
    if (existing) return existing;
    const [row] = await this.db.db
      .insert(subscriptions)
      .values({ id: newId("sub"), studentId, plan: "free", status: "trialing", startedAt: new Date() })
      .returning();
    return row!;
  }

  async summaryForStudent(studentId: string): Promise<SubscriptionSummary> {
    const row = await this.ensure(studentId);
    const effective = this.effectivePlan(row.plan, row.status, row.expiresAt);
    return {
      plan: row.plan as SubscriptionPlan,
      status: row.status as SubscriptionStatus,
      startedAt: row.startedAt.toISOString(),
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      dailyLimit: effective === "premium" ? config.PREMIUM_DAILY_MESSAGE_LIMIT : config.DAILY_MESSAGE_LIMIT,
    };
  }

  /** Daily tutor-call allowance for a student (0 = unlimited) — enforced per turn. */
  async dailyLimitFor(studentId: string): Promise<number> {
    const row = await this.ensure(studentId);
    return this.effectivePlan(row.plan, row.status, row.expiresAt) === "premium"
      ? config.PREMIUM_DAILY_MESSAGE_LIMIT
      : config.DAILY_MESSAGE_LIMIT;
  }

  /** Admin upsert: create-or-update a student's subscription (billing gateway later). */
  async setPlan(
    studentId: string,
    input: { plan: SubscriptionPlan; status?: SubscriptionStatus; expiresAt?: string | null; startedAt?: string },
  ): Promise<SubscriptionSummary> {
    const plan = input.plan;
    const status = input.status ?? "active";
    const expiresAt = input.expiresAt === undefined || input.expiresAt === null ? null : new Date(input.expiresAt);
    const startedAt = input.startedAt ? new Date(input.startedAt) : new Date();
    const existing = await this.db.db.select().from(subscriptions).where(eq(subscriptions.studentId, studentId)).get();
    if (existing) {
      await this.db.db.update(subscriptions).set({ plan, status, expiresAt, startedAt }).where(eq(subscriptions.id, existing.id));
    } else {
      await this.db.db.insert(subscriptions).values({ id: newId("sub"), studentId, plan, status, expiresAt, startedAt });
    }
    return this.summaryForStudent(studentId);
  }

  /**
   * A premium tier is only in effect while it is billable: trialing/active and
   * not past its expiry. past_due/cancelled/expired degrade to the free plan
   * (the daily cap snaps back to the free budget).
   */
  private effectivePlan(plan: string, status: string, expiresAt: Date | null): SubscriptionPlan {
    if (
      plan === "premium" &&
      (status === "trialing" || status === "active") &&
      (expiresAt === null || expiresAt.getTime() > Date.now())
    ) {
      return "premium";
    }
    return "free";
  }
}