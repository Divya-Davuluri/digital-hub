import { db } from '../db';
import { campaigns, analytics, reports, workspaces, clients } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function ensureStarterData(tenantId: string, workspaceId: string, clientId: string) {
  // 1. Check if campaigns exist
  const existingCampaigns = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.workspaceId, workspaceId), eq(campaigns.tenantId, tenantId))
  });

  if (existingCampaigns) return; // Data already exists

  console.log(`[Seeding] Creating starter data for Workspace: ${workspaceId}, Client: ${clientId}`);

  // 2. Create Starter Campaigns
  const camp1Id = uuidv4();
  const camp2Id = uuidv4();

  await db.insert(campaigns).values([
    {
      id: camp1Id,
      tenantId,
      workspaceId,
      name: 'Starter Growth Campaign',
      status: 'ACTIVE',
      channel: 'Google',
      budget: 2500,
      spent: 1240,
      clicks: 840,
      impressions: 12000,
      conversions: 42,
      createdAt: new Date().toISOString()
    },
    {
      id: camp2Id,
      tenantId,
      workspaceId,
      name: 'Brand Awareness Campaign',
      status: 'ACTIVE',
      channel: 'Facebook',
      budget: 1500,
      spent: 450,
      clicks: 320,
      impressions: 45000,
      conversions: 12,
      createdAt: new Date().toISOString()
    }
  ]);

  // 3. Create Analytics Rows (Last 7 days)
  const analyticsData: any[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    analyticsData.push({
      tenantId,
      workspaceId,
      campaignId: camp1Id,
      date: d.toISOString().split('T')[0],
      clicks: Math.floor(Math.random() * 50) + 10,
      impressions: Math.floor(Math.random() * 1000) + 500,
      conversions: Math.floor(Math.random() * 5),
      spent: Math.floor(Math.random() * 100) + 20,
      totalSpent: 0,
      roas: 0
    });
  }

  await db.insert(analytics).values(analyticsData);

  // 4. Create Initial Report
  await db.insert(reports).values({
    id: uuidv4(),
    tenantId,
    workspaceId,
    clientId: clientId,
    report_name: 'Initial Performance Report',
    type: 'PERFORMANCE',
    period: 'Last 7 Days',
    status: 'COMPLETED',
    createdAt: new Date().toISOString()
  });

  console.log(`[Seeding] Successfully seeded starter data for ${workspaceId}`);
}
