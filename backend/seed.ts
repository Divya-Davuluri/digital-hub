import { db } from './src/db';
import { users, tenants } from './src/db/schema';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Seeding database with multiple roles...');

  let tenantId = '43f37c83-fc75-477c-987d-bb22899561b8'; // Using the existing tenant ID found earlier
  
  // 1. Ensure Tenant exists
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

  const hashedPassword = await bcrypt.hash('admin123', 12);

  const usersToSeed = [
    {
      id: uuidv4(),
      tenantId,
      name: 'Admin User',
      email: 'admin@agency.com',
      password: hashedPassword,
      role: 'admin' as const,
      status: 'active' as const,
      onboardingCompleted: 1
    },
    {
      id: uuidv4(),
      tenantId,
      name: 'Team Member',
      email: 'team@agency.com',
      password: hashedPassword,
      role: 'team' as const,
      status: 'active' as const,
      onboardingCompleted: 1
    },
    {
      id: uuidv4(),
      tenantId,
      name: 'Client User',
      email: 'client@tech.com',
      password: hashedPassword,
      role: 'client' as const,
      status: 'active' as const,
      onboardingCompleted: 1
    }
  ];

  for (const user of usersToSeed) {
    await db.insert(users).values(user).onConflictDoNothing();
    console.log(`✅ Seeded ${user.role}: ${user.email}`);
  }

  console.log('\n🚀 ALL CREDENTIALS (Password: admin123):');
  console.log('Admin: admin@agency.com');
  console.log('Team:  team@agency.com');
  console.log('Client: client@tech.com');
}

seed().catch(console.error);
