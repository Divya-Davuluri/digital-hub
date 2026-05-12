import { db } from '../db';
import { campaigns, workspaces, clients } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Seeding Master Admin Demo Data...');
  
  // 1. Get first workspace
  const workspace = await db.query.workspaces.findFirst();
  if (!workspace) {
    console.error('❌ No workspace found. Please log in once first.');
    return;
  }

  const tenantId = workspace.tenantId;
  const workspaceId = workspace.id;

  // 2. Create a demo client if missing
  let client = await db.query.clients.findFirst({
    where: eq(clients.workspaceId, workspaceId)
  });

  if (!client) {
    const clientId = uuidv4();
    await db.insert(clients).values({
      id: clientId,
      tenantId,
      workspaceId,
      name: 'Global Enterprise Corp',
      email: 'contact@globalcorp.com',
      status: 'active'
    });
    client = { id: clientId } as any;
  }

  // 3. Inject 3 Professional Campaigns
  const demoCampaigns = [
    { name: 'Q2 Growth Sprint', platform: 'Meta', budget: 15000, spent: 4250, impressions: 125000, clicks: 3200, conversions: 184, channel: 'facebook' },
    { name: 'Brand Awareness 2026', platform: 'Google Ads', budget: 25000, spent: 12800, impressions: 450000, clicks: 8900, conversions: 412, channel: 'google' },
    { name: 'Product Launch X', platform: 'LinkedIn', budget: 50000, spent: 32000, impressions: 85000, clicks: 1200, conversions: 98, channel: 'linkedin' }
  ];

  for (const c of demoCampaigns) {
    await db.insert(campaigns).values({
      id: uuidv4(),
      tenantId,
      workspaceId,
      clientId: client?.id,
      name: c.name,
      platform: c.platform,
      budget: c.budget,
      spent: c.spent,
      impressions: c.impressions,
      clicks: c.clicks,
      conversions: c.conversions,
      ctr: (c.clicks / c.impressions) * 100,
      channel: c.channel,
      status: 'ACTIVE'
    });
  }

  console.log('✅ Successfully seeded 3 professional campaigns!');
}

seed().catch(console.error);
