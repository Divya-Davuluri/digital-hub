import { db } from './src/db';
import { campaigns, clients, workspaces, reportRequests, tenants, users } from './src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

async function seedData() {
  console.log('Seeding demo data...');

  const tenantId = uuidv4();
  const adminWorkspaceId = uuidv4();
  const teamWorkspaceId = uuidv4();
  const clientWorkspaceId = uuidv4();

  // 1. Create Tenant
  await db.insert(tenants).values({
    id: tenantId,
    name: 'Main Agency',
    subdomain: 'agency'
  });

  // 2. Create Workspaces
  await db.insert(workspaces).values([
    { id: adminWorkspaceId, tenantId, name: 'Admin HQ', slug: 'admin-hq' },
    { id: teamWorkspaceId, tenantId, name: 'Team Workspace', slug: 'team-ws' },
    { id: clientWorkspaceId, tenantId, name: 'Global Tech Client', slug: 'global-tech' }
  ]);

  // 3. Create Users
  const hashedPassword = await bcrypt.hash('Password123!', 12);
  
  await db.insert(users).values([
    {
      id: uuidv4(),
      tenantId,
      workspaceId: adminWorkspaceId,
      name: 'Admin User',
      email: 'admin@agency.com',
      password: hashedPassword,
      role: 'admin'
    },
    {
      id: uuidv4(),
      tenantId,
      workspaceId: teamWorkspaceId,
      name: 'Team Member',
      email: 'team@agency.com',
      password: hashedPassword,
      role: 'team'
    },
    {
      id: uuidv4(),
      tenantId,
      workspaceId: clientWorkspaceId,
      name: 'Client User',
      email: 'client@tech.com',
      password: hashedPassword,
      role: 'client'
    }
  ]);

  // 4. Create Client Record for the client workspace
  const clientId = uuidv4();
  await db.insert(clients).values({
    id: clientId,
    tenantId,
    workspaceId: clientWorkspaceId,
    name: 'Client User',
    email: 'client@tech.com',
    companyName: 'Global Tech',
    status: 'active'
  });

  // 5. Create Campaigns
  await db.insert(campaigns).values([
    {
      id: uuidv4(),
      tenantId,
      workspaceId: clientWorkspaceId,
      clientId,
      name: 'Summer Campaign',
      budget: 5000,
      channel: 'google',
      impressions: 120000,
      clicks: 4500,
      spend: 3200,
      conversions: 120,
      status: 'active'
    },
    {
      id: uuidv4(),
      tenantId,
      workspaceId: clientWorkspaceId,
      clientId,
      name: 'Holiday Sale',
      budget: 8000,
      channel: 'facebook',
      impressions: 250000,
      clicks: 12000,
      spend: 5400,
      conversions: 350,
      status: 'active'
    },
    {
      id: uuidv4(),
      tenantId,
      workspaceId: teamWorkspaceId, // Different workspace
      name: 'Team Test Campaign',
      budget: 2000,
      channel: 'tiktok',
      impressions: 50000,
      clicks: 1000,
      spend: 800,
      conversions: 10,
      status: 'active'
    }
  ]);

  // 6. Create Report Requests
  await db.insert(reportRequests).values([
    {
      id: uuidv4(),
      tenantId,
      workspaceId: clientWorkspaceId,
      clientId,
      reportType: 'MONTHLY_PERFORMANCE',
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      tenantId,
      workspaceId: clientWorkspaceId,
      clientId,
      reportType: 'ROI_ANALYSIS',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    }
  ]);

  console.log('Seeding complete!');
  console.log('Logins:');
  console.log('Admin: admin@agency.com / Password123!');
  console.log('Team: team@agency.com / Password123!');
  console.log('Client: client@tech.com / Password123!');
}

seedData().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
