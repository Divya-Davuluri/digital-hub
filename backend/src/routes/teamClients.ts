import express from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/clients', 
  authMiddleware, 
  async (req: any, res: any) => {
  try {
    const { 
      contactPerson, 
      companyName, 
      contactEmail 
    } = req.body;

    const teamMemberId = req.user.id;
    const tenantId = req.user.tenantId 
      || req.user.tenant_id;

    if (!contactPerson || !contactEmail) {
      return res.status(400).json({
        success: false,
        error: 'Contact person and email required'
      });
    }

    const clientId = uuidv4();

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
        ${companyName || null},
        'active',
        ${teamMemberId},
        ${new Date().toISOString()}
      )
    `);

    return res.json({
      success: true,
      client: {
        id: clientId,
        name: contactPerson,
        email: contactEmail,
        companyName: companyName || '',
        status: 'active',
        assignedTeamMemberId: teamMemberId,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Create client error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create client',
      details: error.message
    });
  }
});

router.get('/clients',
  authMiddleware,
  async (req: any, res: any) => {
  try {
    const teamMemberId = req.user.id;
    const tenantId = req.user.tenantId 
      || req.user.tenant_id;

    const results = await db.run(sql`
      SELECT 
        id, name, email, 
        company_name as companyName, status, created_at as createdAt
      FROM clients
      WHERE tenant_id = ${tenantId}
      AND assigned_team_member_id = ${teamMemberId}
      ORDER BY created_at DESC
    `);

    const clientsList = results.rows || results;

    return res.json({
      success: true,
      clients: clientsList
    });

  } catch (error: any) {
    console.error('Get clients error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch clients',
      details: error.message
    });
  }
});

export default router;
