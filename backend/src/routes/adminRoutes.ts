import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = Router();

// GET /api/admin/campaigns
router.get('/campaigns', 
  authMiddleware,
  async (req: any, res: any) => {
  try {
    const tenantId = 
      req.user?.tenantId ||
      req.user?.tenant_id || '';

    const campaigns = await db.all(sql`
      SELECT 
        c.id,
        c.name,
        c.client_name,
        c.status,
        c.budget,
        c.spent,
        c.platform,
        c.start_date,
        c.end_date,
        c.impressions,
        c.clicks,
        c.conversions,
        c.created_at
      FROM campaigns c
      WHERE c.tenant_id = ${tenantId}
      ORDER BY c.created_at DESC
    `);

    return res.json({
      success: true,
      campaigns: campaigns || [],
      total: campaigns?.length || 0
    });

  } catch (error: any) {
    console.error('GET campaigns:', 
      error.message);
    return res.status(500).json({
      success: false,
      campaigns: [],
      error: error.message
    });
  }
});

// POST /api/admin/campaigns
router.post('/campaigns',
  authMiddleware,
  async (req: any, res: any) => {
  try {
    const tenantId = 
      req.user?.tenantId ||
      req.user?.tenant_id || '';
    const userId = req.user?.id || '';

    const {
      name, clientName, clientId,
      budget, platform, status,
      startDate, endDate, description
    } = req.body || {};

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Campaign name is required'
      });
    }

    const campaignId = randomUUID();
    const now = new Date().toISOString();

    await db.run(sql`
      INSERT INTO campaigns (
        id, tenant_id, name,
        client_id, client_name,
        status, budget, spent,
        impressions, clicks, conversions,
        platform, start_date, end_date,
        assigned_team_member_id,
        created_by, created_at
      ) VALUES (
        ${campaignId},
        ${tenantId},
        ${name.trim()},
        ${clientId || null},
        ${clientName || null},
        ${status || 'ACTIVE'},
        ${Number(budget) || 0},
        0, 0, 0, 0,
        ${platform || 'Meta'},
        ${startDate || null},
        ${endDate || null},
        ${userId},
        ${userId},
        ${now}
      )
    `);

    return res.status(201).json({
      success: true,
      campaign: {
        id: campaignId,
        name: name.trim(),
        client_name: clientName || '',
        status: status || 'ACTIVE',
        budget: Number(budget) || 0,
        spent: 0,
        platform: platform || 'Meta',
        impressions: 0,
        clicks: 0,
        conversions: 0,
        created_at: now
      }
    });

  } catch (error: any) {
    console.error('POST campaigns:', 
      error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PATCH /api/admin/campaigns/:id
router.patch('/campaigns/:id',
  authMiddleware,
  async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const tenantId = 
      req.user?.tenantId ||
      req.user?.tenant_id || '';
    const { status } = req.body || {};

    await db.run(sql`
      UPDATE campaigns
      SET status = ${status}
      WHERE id = ${id}
      AND tenant_id = ${tenantId}
    `);

    return res.json({ success: true });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
