import { db } from '../src/db';
import { tenants, clients, campaigns, tasks, users } from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedDemoData() {
  console.log('🚀 [DEMO SEED] STARTING DEMO DATA INJECTION...');

  const tenantEmail = 'admin@demo.com';
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, tenantEmail)
  });

  if (!user) {
    console.error('❌ [DEMO SEED] Demo user not found. Run seedProduction.ts first.');
    process.exit(1);
  }

  const tenantId = user.tenantId;

  // 1. Create Clients
  console.log('🏢 [DEMO SEED] Creating Demo Clients...');
  const client1Id = uuidv4();
  const client2Id = uuidv4();
  
  await db.insert(clients).values([
    { id: client1Id, tenantId, name: 'EcoWare Solutions', email: 'contact@ecoware.com', status: 'active' },
    { id: client2Id, tenantId, name: 'FutureTech Systems', email: 'growth@futuretech.io', status: 'active' }
  ]).onConflictDoNothing();

  // 2. Create Campaigns
  console.log('🚀 [DEMO SEED] Creating Demo Campaigns...');
  await db.insert(campaigns).values([
    { 
      id: uuidv4(), tenantId, clientId: client1Id, name: 'Spring Sustainability Drive', 
      channel: 'google', budget: 5000, spend: 3200, impressions: 45000, clicks: 1200, conversions: 85, status: 'active' 
    },
    { 
      id: uuidv4(), tenantId, clientId: client1Id, name: 'Eco-Friendly Product Launch', 
      channel: 'facebook', budget: 3000, spend: 2800, impressions: 85000, clicks: 3400, conversions: 120, status: 'active' 
    },
    { 
      id: uuidv4(), tenantId, clientId: client2Id, name: 'Cloud Infrastructure Awareness', 
      channel: 'linkedin', budget: 10000, spend: 4500, impressions: 12000, clicks: 450, conversions: 12, status: 'active' 
    }
  ]).onConflictDoNothing();

  // 3. Create Tasks
  console.log('✅ [DEMO SEED] Creating Demo Tasks...');
  await db.insert(tasks).values([
    { id: uuidv4(), tenantId, title: 'Finalize Q2 Ad Copy', status: 'todo', priority: 'high', createdBy: user.id },
    { id: uuidv4(), tenantId, title: 'Weekly Reporting for EcoWare', status: 'todo', priority: 'medium', createdBy: user.id },
    { id: uuidv4(), tenantId, title: 'Budget Allocation Meeting', status: 'todo', priority: 'low', createdBy: user.id }
  ]).onConflictDoNothing();

  console.log('✨ [DEMO SEED] DEMO DATA INJECTED SUCCESSFULLY!');
  process.exit(0);
}

seedDemoData().catch(err => {
  console.error('❌ [DEMO SEED] FAILED:', err);
  process.exit(1);
});
