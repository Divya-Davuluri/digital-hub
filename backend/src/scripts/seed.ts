import { db } from '../db';
import { analytics, workspaces, campaigns, tenants, tenantBranding } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function runSeed() {
  console.log('--- Starting Platform Stabilization Seed ---');

  // 1. Fix Tenant Names
  console.log('Fixing tenant names...');
  try {
    await db.run(sql`UPDATE tenants SET name = 'Digital Marketing Hub' WHERE name = '' OR name IS NULL;`);
    console.log('✅ Tenant names fixed');
  } catch (err) {
    console.error('❌ Failed to fix tenant names:', err);
  }

  // 2. Ensure Tenant Branding Exists
  console.log('Ensuring branding records...');
  try {
    const allTenants = await db.select().from(tenants);
    for (const t of allTenants) {
      const existing = await db.query.tenantBranding.findFirst({
        where: eq(tenantBranding.tenantId, t.id)
      });
      if (!existing) {
        await db.insert(tenantBranding).values({
          id: uuidv4(),
          tenantId: t.id,
          agencyName: t.name || 'Digital Marketing Hub',
          primaryColor: '#6366f1',
          secondaryColor: '#4f46e5',
        });
      }
    }
    console.log('✅ Branding records verified');
  } catch (err) {
    console.error('❌ Failed to seed branding:', err);
  }

  // 3. Seed Analytics
  console.log('Seeding analytics...');
  try {
    const allWorkspaces = await db.select().from(workspaces);
    for (const ws of allWorkspaces) {
      const existing = await db.select().from(analytics).where(eq(analytics.workspaceId, ws.id));
      if (existing.length >= 25) continue;

      const firstCampaign = await db.query.campaigns.findFirst({
        where: eq(campaigns.workspaceId, ws.id)
      });

      if (!firstCampaign) {
        console.log(`Skipping ${ws.name} — no campaigns found`);
        continue;
      }

      const now = new Date();
      const rows = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        rows.push({
          tenantId: ws.tenantId,
          workspaceId: ws.id,
          campaignId: firstCampaign.id,
          date: date.toISOString().split('T')[0],
          impressions: Math.floor(2000 + (i*100) % 5000),
          clicks: Math.floor(50 + (i*10) % 200),
          conversions: Math.floor(2 + (i % 8)),
          spent: Math.floor(100 + (i*20) % 400),
          roas: parseFloat((2 + (i % 15) / 5).toFixed(2)),
        });
      }
      
      for (let j = 0; j < rows.length; j += 10) {
        await db.insert(analytics).values(rows.slice(j, j + 10));
      }
      console.log(`✅ Seeded analytics for ${ws.name}`);
    }
  } catch (err) {
    console.error('❌ Failed to seed analytics:', err);
  }

  console.log('--- Seed Completed ---');
  process.exit(0);
}

runSeed();
