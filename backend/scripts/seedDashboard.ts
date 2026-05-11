import { db } from '../src/db';
import { users, clients, campaigns, tenantBranding, notifications, tenants, workspaces } from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
  console.log('🌱 Seeding Dashboard Data...');

  // 1. Create a Tenant
  const tenantId = uuidv4();
  console.log(`Creating tenant: ${tenantId}`);
  await db.insert(tenants).values({
    id: tenantId,
    name: 'Main Agency',
    subdomain: 'agency-' + Math.random().toString(36).substring(7),
  }).onConflictDoNothing();

  // 2. Create a test admin user
  const testEmail = 'admin@demo.com';
  console.log('Creating test admin user...');
  const adminId = uuidv4();
  await db.insert(users).values({
    id: adminId,
    email: testEmail,
    password: 'hashed_password_here', 
    name: 'Demo Admin',
    role: 'admin',
    tenantId: tenantId,
  }).onConflictDoNothing();

  const admin = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, testEmail),
  });

  if (!admin) throw new Error("Admin user creation failed");
  
  const actualTenantId = admin.tenantId!;
  const userId = admin.id;

  // 3. Create Clients and Workspaces
  console.log('Creating clients and workspaces...');
  const clientData = [
    { name: 'Acme Corp', email: 'contact@acme.com' },
    { name: 'Globex', email: 'info@globex.com' },
    { name: 'Soylent Corp', email: 'sales@soylent.com' }
  ];
  
  const createdClients = [];

  for (const data of clientData) {
    const workspaceId = uuidv4();
    const clientId = uuidv4();
    
    await db.insert(workspaces).values({
      id: workspaceId,
      tenantId: actualTenantId,
      name: `${data.name} Workspace`,
      slug: data.name.toLowerCase().replace(/ /g, '-'),
    });

    await db.insert(clients).values({
      id: clientId,
      name: data.name,
      email: data.email,
      tenantId: actualTenantId,
      workspaceId: workspaceId,
      status: 'active',
    });

    createdClients.push({ clientId, workspaceId });
  }

  // 4. Create Campaigns with Performance Data
  console.log('Creating campaigns...');
  const channels = ['google', 'facebook', 'instagram', 'linkedin', 'tiktok'] as const;
  
  for (const { clientId, workspaceId } of createdClients) {
    for (let i = 0; i < 3; i++) {
      await db.insert(campaigns).values({
        id: uuidv4(),
        tenantId: actualTenantId,
        workspaceId,
        clientId,
        name: `Campaign ${i + 1} for ${workspaceId.slice(0, 4)}`,
        channel: channels[Math.floor(Math.random() * channels.length)],
        status: 'active',
        budget: Math.floor(Math.random() * 5000) + 1000,
        spend: Math.floor(Math.random() * 1000) + 100,
        impressions: Math.floor(Math.random() * 10000) + 5000,
        clicks: Math.floor(Math.random() * 500) + 50,
        conversions: Math.floor(Math.random() * 50) + 5,
        startDate: new Date().toISOString(),
      });
    }
  }

  // 5. Create Branding
  console.log('Creating branding...');
  await db.insert(tenantBranding).values({
    id: uuidv4(),
    tenantId: actualTenantId,
    logoUrl: 'https://via.placeholder.com/150?text=DigitalHub',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    subdomain: 'demo-agency',
  }).onConflictDoNothing();

  // 6. Create Notifications
  console.log('Creating notifications...');
  await db.insert(notifications).values([
    {
      id: uuidv4(),
      tenantId: actualTenantId,
      type: 'warning',
      message: 'Campaign "Summer Sale" is approaching budget limit.',
      isRead: 0,
    },
    {
      id: uuidv4(),
      tenantId: actualTenantId,
      type: 'success',
      message: 'New client "Acme Corp" successfully onboarded.',
      isRead: 1,
    },
    {
      id: uuidv4(),
      tenantId: actualTenantId,
      type: 'info',
      message: 'Monthly report for April is now available.',
      isRead: 0,
    }
  ]);

  console.log('✅ Seeding completed!');
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
