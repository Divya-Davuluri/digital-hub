import { Response } from 'express';
import { db } from '../db';
import { budgetPools, automationRules, spendingForecasts, campaigns, adGroups, campaignActivityLogs } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../utils/errors';

/**
 * GET /api/automation/pools
 */
export const getBudgetPools = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, workspaceId } = req.user;
  const pools = await db.query.budgetPools.findMany({
    where: and(eq(budgetPools.tenantId, tenantId), eq(budgetPools.workspaceId, workspaceId))
  });
  res.json(pools);
});

/**
 * POST /api/automation/pools
 */
export const createBudgetPool = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, workspaceId } = req.user;
  const { name, totalBudget, currency } = req.body;

  const id = uuidv4();
  await db.insert(budgetPools).values({
    id,
    tenantId,
    workspaceId,
    name,
    totalBudget,
    remaining: totalBudget,
    currency: currency || 'USD'
  });

  res.status(201).json({ success: true, id });
});

/**
 * GET /api/automation/rules
 */
export const getRules = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, workspaceId } = req.user;
  const rules = await db.query.automationRules.findMany({
    where: and(eq(automationRules.tenantId, tenantId), eq(automationRules.workspaceId, workspaceId))
  });
  res.json(rules);
});

/**
 * POST /api/automation/rules
 */
export const createRule = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, workspaceId } = req.user;
  const { name, targetType, targetId, triggerMetric, operator, threshold, action, actionValue } = req.body;

  const id = uuidv4();
  await db.insert(automationRules).values({
    id,
    tenantId,
    workspaceId,
    name,
    targetType,
    targetId,
    triggerMetric,
    operator,
    threshold,
    action,
    actionValue
  });

  res.status(201).json({ success: true, id });
});

/**
 * PATCH /api/automation/rules/:id/toggle
 */
export const toggleRule = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const { tenantId } = req.user;

  await db.update(automationRules)
    .set({ isActive: isActive ? 1 : 0 })
    .where(and(eq(automationRules.id, id), eq(automationRules.tenantId, tenantId)));

  res.json({ success: true });
});

/**
 * POST /api/automation/run-checks
 * Evaluation Engine
 */
export const runAutomationChecks = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, workspaceId } = req.user;
  
  const activeRules = await db.query.automationRules.findMany({
    where: and(
      eq(automationRules.tenantId, tenantId), 
      eq(automationRules.workspaceId, workspaceId),
      eq(automationRules.isActive, 1)
    )
  });

  const executions = [];

  for (const rule of activeRules) {
    // 1. Fetch current metrics (Simulated for this demo)
    // In a real app, we'd query the analytics table or external API
    const currentMetricValue = Math.random() * 100; // Mock value
    
    let isTriggered = false;
    switch(rule.operator) {
      case '>': isTriggered = currentMetricValue > rule.threshold; break;
      case '<': isTriggered = currentMetricValue < rule.threshold; break;
      case '>=': isTriggered = currentMetricValue >= rule.threshold; break;
      case '<=': isTriggered = currentMetricValue <= rule.threshold; break;
    }

    if (isTriggered) {
      // 2. Execute Action
      if (rule.action === 'pause') {
        if (rule.targetType === 'campaign') {
          await db.update(campaigns).set({ status: 'paused' }).where(eq(campaigns.id, rule.targetId));
        } else if (rule.targetType === 'ad_group') {
          await db.update(adGroups).set({ status: 'paused' }).where(eq(adGroups.id, rule.targetId));
        }
      } else if (rule.action === 'notify') {
        // Implement notification logic
      }

      // 3. Log Activity
      await db.insert(campaignActivityLogs).values({
        id: uuidv4(),
        campaignId: rule.targetType === 'campaign' ? rule.targetId : 'N/A',
        userId: req.user.id,
        action: 'AUTOMATION',
        details: `Rule "${rule.name}" triggered. Action: ${rule.action} executed.`
      });

      executions.push({ ruleId: rule.id, triggered: true, action: rule.action });
    }
  }

  res.json({ success: true, processed: activeRules.length, executions });
});

/**
 * GET /api/automation/forecast/:targetId
 * AI Forecasting (Simulated)
 */
export const getForecast = asyncHandler(async (req: any, res: Response) => {
  const { targetId } = req.params;
  
  // Simulated AI logic: Predict spend for the next 7 days based on last 7
  const forecast = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return {
      date: date.toISOString().split('T')[0],
      predictedSpend: 50 + Math.random() * 20,
      confidence: 0.85 + (Math.random() * 0.1)
    };
  });

  res.json(forecast);
});
