import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

// ENDPOINT 1 - GET /api/client/campaigns
router.get('/campaigns', async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.tenant_id || '';
    
    // Fetch campaigns for this tenant
    const campaignsResult = await db.run(sql`
      SELECT 
        id, name, status, budget, spent,
        impressions, clicks, conversions,
        platform, start_date, end_date,
        created_at,
        CASE WHEN impressions > 0 
          THEN ROUND(CAST(clicks AS FLOAT) / impressions * 100, 2)
          ELSE 0 
        END as ctr,
        CASE WHEN spent > 0 
          THEN ROUND(CAST(spent AS FLOAT) / NULLIF(clicks, 0), 2)
          ELSE 0 
        END as cpc
      FROM campaigns
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC
    `);

    const campaigns = campaignsResult.rows as any[];

    const totalSpend = campaigns.reduce((sum: number, c: any) => sum + (Number(c.spent) || 0), 0);
    const totalImpressions = campaigns.reduce((sum: number, c: any) => sum + (Number(c.impressions) || 0), 0);
    const totalClicks = campaigns.reduce((sum: number, c: any) => sum + (Number(c.clicks) || 0), 0);
    const totalConversions = campaigns.reduce((sum: number, c: any) => sum + (Number(c.conversions) || 0), 0);

    return res.json({
      success: true,
      campaigns: campaigns || [],
      metrics: {
        totalSpend,
        totalImpressions,
        totalClicks,
        totalConversions,
        avgCTR: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00',
        avgROAS: totalSpend > 0 ? (totalConversions * 50 / totalSpend).toFixed(2) : '0.00'
      }
    });

  } catch (error: any) {
    console.error('Client campaigns error:', error.message);
    return res.status(500).json({
      success: false,
      campaigns: [],
      metrics: { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0 },
      error: error.message
    });
  }
});

// ENDPOINT 2 - GET /api/client/analytics
router.get('/analytics', async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.tenant_id || '';

    const analyticsResult = await db.run(sql`
      SELECT date, impressions, clicks,
        conversions, spent, revenue, roas
      FROM analytics
      WHERE tenant_id = ${tenantId}
      ORDER BY date ASC
    `);

    const campaignsResult = await db.run(sql`
      SELECT id, name, status,
        impressions, clicks,
        conversions, spent, budget,
        platform
      FROM campaigns
      WHERE tenant_id = ${tenantId}
      ORDER BY spent DESC
    `);

    const analyticsData = analyticsResult.rows;
    const campaigns = campaignsResult.rows;

    const totals = {
      impressions: campaigns.reduce((s: number, c: any) => s + (Number(c.impressions) || 0), 0),
      clicks: campaigns.reduce((s: number, c: any) => s + (Number(c.clicks) || 0), 0),
      conversions: campaigns.reduce((s: number, c: any) => s + (Number(c.conversions) || 0), 0),
      spent: campaigns.reduce((s: number, c: any) => s + (Number(c.spent) || 0), 0),
      budget: campaigns.reduce((s: number, c: any) => s + (Number(c.budget) || 0), 0)
    };

    return res.json({
      success: true,
      analytics: analyticsData || [],
      campaigns: campaigns || [],
      totals,
      roas: totals.spent > 0 ? (totals.conversions * 50 / totals.spent).toFixed(2) : '0.00'
    });

  } catch (error: any) {
    console.error('Client analytics error:', error.message);
    return res.status(500).json({
      success: false,
      analytics: [],
      totals: { impressions: 0, clicks: 0, conversions: 0, spent: 0 }
    });
  }
});

// ENDPOINT 3 - GET /api/client/reports
router.get('/reports', async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.tenant_id || '';

    const campaignsResult = await db.run(sql`
      SELECT id, name, status,
        impressions, clicks,
        conversions, spent, budget,
        platform, start_date, end_date
      FROM campaigns
      WHERE tenant_id = ${tenantId}
    `);

    const campaigns = campaignsResult.rows as any[];

    const totalSpent = campaigns.reduce((s: number, c: any) => s + (Number(c.spent) || 0), 0);
    const totalBudget = campaigns.reduce((s: number, c: any) => s + (Number(c.budget) || 0), 0);
    const totalConversions = campaigns.reduce((s: number, c: any) => s + (Number(c.conversions) || 0), 0);

    return res.json({
      success: true,
      summary: {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c: any) => c.status === 'active' || c.status === 'ACTIVE').length,
        totalSpent,
        totalBudget,
        totalConversions,
        roas: totalSpent > 0 ? (totalConversions * 50 / totalSpent).toFixed(2) : '0.00'
      },
      campaigns
    });

  } catch (error: any) {
    console.error('Client reports error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
