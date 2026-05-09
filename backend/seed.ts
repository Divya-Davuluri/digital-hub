import { db } from './src/db';
import { users, tenants, workspaces } from './src/db/schema';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Seeding database with multiple roles & workspace context...');

  let tenantId = '43f37c83-fc75-477c-987d-bb22899561b8';
  
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

  // 2. Create a default Workspace for testing
  const workspaceId = uuidv4();
  await db.insert(workspaces).values({
    id: workspaceId,
    tenantId,
    name: 'Tech Solutions Workspace',
    slug: 'tech-solutions',
    status: 'active'
  }).onConflictDoNothing();
  console.log(`✅ Seeded Workspace: ${workspaceId}`);

  const hashedPassword = await bcrypt.hash('admin123', 12);

  const usersToSeed = [
    {
      id: uuidv4(),
      tenantId,
      workspaceId: null,
      name: 'Admin User',
      email: 'admin@agency.com',
      password: hashedPassword,
      role: 'admin' as const,
      status: 'active' as const,
      onboardingCompleted: 1,
      onboardingStep: 'completed',
      firstLogin: 0
    },
    {
      id: uuidv4(),
      tenantId,
      workspaceId: null,
      name: 'Team Member',
      email: 'team@agency.com',
      password: hashedPassword,
      role: 'team' as const,
      status: 'active' as const,
      onboardingCompleted: 1,
      onboardingStep: 'completed',
      firstLogin: 0
    },
    {
      id: uuidv4(),
      tenantId,
      workspaceId: workspaceId, // CLIENT MUST HAVE WORKSPACE
      name: 'Client User',
      email: 'client@tech.com',
      password: hashedPassword,
      role: 'client' as const,
      status: 'active' as const,
      onboardingCompleted: 0, // Set to 0 to test onboarding flow
      onboardingStep: 'start',
      firstLogin: 1
    }
  ];

  for (const user of usersToSeed) {
    // Delete existing user if any to ensure clean seed with new columns
    await db.delete(users).where(eq(users.email, user.email));
    await db.insert(users).values(user);
    console.log(`✅ Seeded ${user.role}: ${user.email}`);
  }

  console.log('\n🚀 ALL CREDENTIALS (Password: admin123):');
  console.log('Admin: admin@agency.com');
  console.log('Team:  team@agency.com');
  console.log('Client: client@tech.com (Onboarding Pending)');
}

// Helper for eq
import { eq } from 'drizzle-orm';

seed().catch(console.error);
