import { db } from '../db';
import { analytics, workspaces } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function seedAnalyticsData() {
  console.log('Starting analytics seed...');
  
  const allWorkspaces = await db
    .select()
    .from(workspaces);
  
  console.log(`Found ${allWorkspaces.length} workspaces`);

  for (const ws of allWorkspaces) {
    const existing = await db
      .select()
      .from(analytics)
      .where(eq(analytics.workspaceId, ws.id));
    
    if (existing.length >= 25) {
      console.log(`Skipping ${ws.id} — has enough data`);
      continue;
    }

    console.log(`Seeding workspace: ${ws.name}`);
    const rows = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const spend = Math.floor(150 + (i * 17) % 150);
      const clicks = Math.floor(50 + (i * 13) % 80);
      const impressions = Math.floor(2000 + (i*300) % 3000);
      const conversions = Math.floor(2 + (i % 5));
      const roas = parseFloat(
        (2.5 + (i % 20) / 10).toFixed(2)
      );

      rows.push({
        id: uuidv4(), // The schema uses integer autoIncrement, but the provided seed uses uuid? Let's check schema again.
        tenantId: ws.tenantId,
        workspaceId: ws.id,
        campaignId: null, // The schema has campaignId as notNull. I should find a campaign or fix this.
        date: dateStr,
        impressions,
        clicks,
        conversions,
        spent: spend,
        roas,
      });
    }

    // Wait, let's check schema.ts for analytics again.
    // 272: export const analytics = sqliteTable('analytics', {
    // 273:   id: integer('id').primaryKey({ autoIncrement: true }),
    // 274:   tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    // 275:   workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    // 276:   campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
    // ...
    
    // I need a campaignId because it is notNull.
    // I'll fetch one campaign for the workspace.
    
    const { campaigns } = require('../db/schema');
    const firstCampaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.workspaceId, ws.id)
    });

    if (!firstCampaign) {
      console.log(`No campaigns found for ${ws.name}, skipping analytics seed for this workspace.`);
      continue;
    }

    const rowsWithCampaign = rows.map(r => ({
      ...r,
      campaignId: firstCampaign.id,
      id: undefined // Let autoIncrement handle it
    }));

    // Insert in batches of 10
    for (let i = 0; i < rowsWithCampaign.length; i += 10) {
      const batch = rowsWithCampaign.slice(i, i + 10);
      // @ts-ignore
      await db.insert(analytics).values(batch);
    }
    console.log(`✅ Seeded 30 days for: ${ws.name}`);
  }
  
  console.log('✅ Analytics seeding complete!');
}

seedAnalyticsData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
