import { db } from '../db';
import { subscriptions, users, workspaces } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { PLANS, PlanId } from '../config/plans';

export async function checkPlanLimit(
  tenantId: string,
  limitType: 'workspaces' | 'teamSeats'
): Promise<{ allowed: boolean; message?: string }> {
  try {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.tenantId, tenantId),
    });

    const planId: PlanId = (sub?.plan as PlanId) || 'starter';
    const plan = PLANS[planId] || PLANS.starter;

    if (limitType === 'workspaces') {
      const limit = plan.limits.clientWorkspaces;
      if (limit === -1) return { allowed: true };

      const currentCount = await db.select()
        .from(workspaces)
        .where(eq(workspaces.tenantId, tenantId))
        .then(rows => rows.length);

      if (currentCount >= limit) {
        return {
          allowed: false,
          message: `Upgrade to Growth or Agency Pro to add more client workspaces. You have reached the limit of ${limit} workspaces for the ${plan.name} plan.`,
        };
      }
    } else if (limitType === 'teamSeats') {
      const limit = plan.limits.teamSeats;
      if (limit === -1) return { allowed: true };

      const currentCount = await db.select()
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            eq(users.role, 'team')
          )
        )
        .then(rows => rows.length);

      if (currentCount >= limit) {
        return {
          allowed: false,
          message: `Upgrade to Growth or Agency Pro to add more team members. You have reached the limit of ${limit} team seats for the ${plan.name} plan.`,
        };
      }
    }
  } catch (err) {
    console.error('[Billing limits] Error checking limits:', err);
  }

  return { allowed: true };
}
