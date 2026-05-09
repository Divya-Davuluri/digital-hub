import { db } from './src/db';
import { campaigns, analytics, reports } from './src/db/schema';
import { v4 as uuidv4 } from 'uuid';

async function seedExistingClient() {
  const tenantId = '43f37c83-fc75-477c-987d-bb22899561b8';
  const workspaceId = 'cc99ff68-3a4a-4217-97c5-cc3a09f7826d';
  // Note: Using a null clientId since it's optional and we just need it to show in the workspace.
  // Actually, wait, let's look up the client record first.
  const clientId = '9713c363-f634-46f4-91ac-85927851d110'; // This is the user ID, but the schema references clients.id. It's optional anyway.
  
  console.log('Seeding existing workspace:', workspaceId);

  const campaign1Id = uuidv4();
  const campaign2Id = uuidv4();
  const now = new Date();

  try {
    // 1. Create Sample Campaigns
    await db.insert(campaigns).values([
      {
        id: campaign1Id,
        tenantId,
        workspaceId,
        name: 'Summer Growth Campaign',
        channel: 'google',
        budget: 5000,
        spend: 1240,
        impressions: 45000,
        clicks: 1200,
        conversions: 85,
        status: 'active',
        startDate: now.toISOString()
      },
      {
        id: campaign2Id,
        tenantId,
        workspaceId,
        name: 'Social Brand Awareness',
        channel: 'facebook',
        budget: 2500,
        spend: 850,
        impressions: 125000,
        clicks: 3400,
        conversions: 12,
        status: 'active',
        startDate: now.toISOString()
      }
    ]);
    console.log('Campaigns inserted.');

    // 2. Create Sample Analytics Summary (last 7 days)
    const analyticsData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      analyticsData.push({
        tenantId,
        workspaceId,
        campaignId: campaign1Id,
        date: d.toISOString().split('T')[0],
        clicks: Math.floor(Math.random() * 200),
        impressions: Math.floor(Math.random() * 10000),
        conversions: Math.floor(Math.random() * 20),
        spend: Math.floor(Math.random() * 500)
      });
    }
    await db.insert(analytics).values(analyticsData);
    console.log('Analytics inserted.');

    // 3. Create Starter Report
    await db.insert(reports).values({
      id: uuidv4(),
      tenantId,
      workspaceId,
      name: 'Initial Strategy & Setup Report',
      url: '#',
      type: 'PERFORMANCE',
      status: 'READY'
    });
    console.log('Reports inserted.');

    console.log('✅ Manual seeding for workspace completed successfully!');
  } catch (err) {
    console.error('Error seeding data:', err);
  }
}

seedExistingClient();
