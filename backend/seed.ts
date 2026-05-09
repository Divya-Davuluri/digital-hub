import { db } from './src/db';
import { users, tenants } from './src/db/schema';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Seeding database...');

  let tenantId = '9142f583-09e6-4df9-b4a2-bcab048799b5';
  
  // 1. Get or Create Default Tenant
  const existingTenant = await db.query.tenants.findFirst();
  if (existingTenant) {
    tenantId = existingTenant.id;
    console.log(`Using existing tenant: ${existingTenant.name} (${tenantId})`);
  } else {
    await db.insert(tenants).values({
      id: tenantId,
      name: 'Digital Marketing Agency',
      subdomain: 'agency'
    });
    console.log(`Created new tenant: ${tenantId}`);
  }

  // 2. Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 12);
  await db.insert(users).values({
    id: uuidv4(),
    tenantId,
    name: 'Admin User',
    email: 'admin@agency.com',
    password: hashedPassword,
    role: 'admin',
    status: 'active',
    onboardingCompleted: 1
  }).onConflictDoNothing();

  console.log('✅ Seed completed: admin@agency.com / admin123');
}

seed().catch(console.error);
