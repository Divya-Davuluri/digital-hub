import express from 'express';
import { db } from '../db';
import { clients, tasks, campaigns } from '../db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { authMiddleware, authorize, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/team/clients
router.get('/clients', authMiddleware, authorize('team', 'admin'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const assignedClients = await db.query.clients.findMany({
      where: and(
        eq(clients.tenantId, tenantId),
        eq(clients.assignedTeamMemberId, userId)
      ),
      orderBy: (clients, { desc }) => [desc(clients.createdAt)]
    });

    res.json(assignedClients);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team/tasks
router.get('/tasks', authMiddleware, authorize('team', 'admin'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    let teamTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.tenantId, tenantId),
        eq(tasks.assignedTo, userId)
      ),
      orderBy: (tasks, { desc }) => [desc(tasks.createdAt)]
    });

    if (teamTasks.length === 0) {
      // Seed data if empty
      const seedData = [
        { id: 'task-1', tenantId, title: 'Review Q2 Campaign Report', clientName: 'Nike Marketing', dueDate: '2026-05-10', priority: 'HIGH', status: 'PENDING', assignedTo: userId, createdAt: new Date().toISOString() },
        { id: 'task-2', tenantId, title: 'Update Ad Creative Assets', clientName: 'Nike Marketing', dueDate: '2026-05-12', priority: 'MEDIUM', status: 'PENDING', assignedTo: userId, createdAt: new Date().toISOString() },
        { id: 'task-3', tenantId, title: 'Client Monthly Call Prep', clientName: 'Nike Marketing', dueDate: '2026-05-08', priority: 'HIGH', status: 'PENDING', assignedTo: userId, createdAt: new Date().toISOString() },
        { id: 'task-4', tenantId, title: 'Budget Reallocation Request', clientName: 'Nike Marketing', dueDate: '2026-05-15', priority: 'LOW', status: 'PENDING', assignedTo: userId, createdAt: new Date().toISOString() },
        { id: 'task-5', tenantId, title: 'Social Media Content Plan', clientName: 'Nike Marketing', dueDate: '2026-05-11', priority: 'MEDIUM', status: 'PENDING', assignedTo: userId, createdAt: new Date().toISOString() },
        { id: 'task-6', tenantId, title: 'Analytics Dashboard Review', clientName: 'Nike Marketing', dueDate: '2026-05-09', priority: 'HIGH', status: 'PENDING', assignedTo: userId, createdAt: new Date().toISOString() },
        { id: 'task-7', tenantId, title: 'Competitor Analysis Report', clientName: 'Nike Marketing', dueDate: '2026-05-14', priority: 'MEDIUM', status: 'PENDING', assignedTo: userId, createdAt: new Date().toISOString() },
        { id: 'task-8', tenantId, title: 'Campaign Performance Summary', clientName: 'Nike Marketing', dueDate: '2026-05-13', priority: 'LOW', status: 'PENDING', assignedTo: userId, createdAt: new Date().toISOString() },
      ];
      
      for (const taskData of seedData) {
        try {
           await db.insert(tasks).values(taskData as any);
        } catch (e) {
            console.error('Error seeding task:', e);
        }
      }

      teamTasks = await db.query.tasks.findMany({
        where: and(
          eq(tasks.tenantId, tenantId),
          eq(tasks.assignedTo, userId)
        ),
        orderBy: (tasks, { desc }) => [desc(tasks.createdAt)]
      });
    }

    res.json(teamTasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team/campaigns
router.get('/campaigns', authMiddleware, authorize('team', 'admin'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const assignedClients = await db.query.clients.findMany({
      where: and(
        eq(clients.tenantId, tenantId),
        eq(clients.assignedTeamMemberId, userId)
      ),
      columns: { id: true }
    });

    const clientIds = assignedClients.map(c => c.id);

    if (clientIds.length === 0) {
      return res.json([]);
    }

    const teamCampaigns = await db.select({
      id: campaigns.id,
      name: campaigns.name,
      status: campaigns.status,
      budget: campaigns.budget,
      clientName: clients.name,
      impressions: campaigns.impressions,
      clicks: campaigns.clicks,
      conversions: campaigns.conversions,
      spend: campaigns.spend
    })
    .from(campaigns)
    .innerJoin(clients, eq(campaigns.clientId, clients.id))
    .where(and(
      eq(campaigns.tenantId, tenantId),
      inArray(campaigns.clientId, clientIds)
    ))
    .orderBy(desc(campaigns.createdAt));

    res.json(teamCampaigns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
