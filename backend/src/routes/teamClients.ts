import express from 'express';
import { db } from '../db';
import { clients } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/team/clients
router.get('/clients', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const results = await db.run(sql`
      SELECT 
        id, name, email, company_name as companyName,
        status, created_at as createdAt
      FROM clients
      WHERE tenant_id = ${tenantId}
      AND assigned_team_member_id = ${userId}
      ORDER BY created_at DESC
    `);

    // Handle results format depending on driver
    const teamClients = results.rows || results;

    res.json(teamClients);
  } catch (err: any) {
    console.error('[GET_TEAM_CLIENTS_ERROR]', err);
    res.status(500).json({ error: 'Failed to load clients. Please refresh.' });
  }
});

// POST /api/team/clients
router.post('/clients', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { contactPerson, companyName, contactEmail } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    if (!contactPerson || !companyName || !contactEmail) {
      return res.status(400).json({ error: 'Contact person, company name, and email are required' });
    }

    const clientId = uuidv4();
    const createdAt = new Date().toISOString();

    await db.run(sql`
      INSERT INTO clients (
        id,
        tenant_id,
        name,
        email,
        company_name,
        status,
        assigned_team_member_id,
        created_at
      ) VALUES (
        ${clientId},
        ${tenantId},
        ${contactPerson},
        ${contactEmail},
        ${companyName},
        'active',
        ${userId},
        ${createdAt}
      )
    `);

    res.status(201).json({
      success: true,
      client: {
        id: clientId,
        name: contactPerson,
        email: contactEmail,
        companyName: companyName,
        status: 'active',
        assignedTeamMemberId: userId,
        createdAt: createdAt
      }
    });
  } catch (err: any) {
    console.error('[POST_TEAM_CLIENT_ERROR]', err);
    res.status(500).json({ error: 'Failed to create client. Please try again.' });
  }
});

export default router;
