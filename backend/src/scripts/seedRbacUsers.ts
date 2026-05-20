import { db } from '../db';
import { users, clients, workspaces, tenants, teamAssignments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

async function run() {
  console.log('--- Seeding RBAC Test Users and Assignments ---');

  // 1. Get or create Tenant
  const allTenants = await db.select().from(tenants).limit(1);
  let tenantId = allTenants[0]?.id;
  if (!tenantId) {
    tenantId = uuidv4();
    await db.insert(tenants).values({
      id: tenantId,
      name: 'Digital Marketing Hub',
      createdAt: new Date().toISOString()
    } as any);
    console.log(`Created default tenant with ID: ${tenantId}`);
  } else {
    console.log(`Using existing tenant ID: ${tenantId}`);
  }

  // Helper to hash password
  const hashedPassword = await bcrypt.hash('password123', 12);

  // 2. Create Admin
  const adminEmail = 'admin@test.com';
  const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  let adminId = existingAdmin[0]?.id;
  if (!adminId) {
    adminId = uuidv4();
    await db.insert(users).values({
      id: adminId,
      tenantId: tenantId!,
      workspaceId: null,
      name: 'Test Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      provider: 'local',
      onboardingCompleted: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any);
    console.log('✅ Created Admin user: admin@test.com');
  } else {
    console.log('Admin user already exists');
  }

  // 3. Create Team Member
  const teamEmail = 'team@test.com';
  const existingTeam = await db.select().from(users).where(eq(users.email, teamEmail)).limit(1);
  let teamId = existingTeam[0]?.id;
  if (!teamId) {
    teamId = uuidv4();
    await db.insert(users).values({
      id: teamId,
      tenantId: tenantId!,
      workspaceId: null,
      name: 'Test Team Member',
      email: teamEmail,
      password: hashedPassword,
      role: 'team',
      provider: 'local',
      onboardingCompleted: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any);
    console.log('✅ Created Team user: team@test.com');
  } else {
    console.log('Team user already exists');
  }

  // 4. Create Workspace 1 & Client 1 (Assigned to Team)
  const clientEmail1 = 'client@test.com';
  const existingClientUser1 = await db.select().from(users).where(eq(users.email, clientEmail1)).limit(1);

  const ws1Id = uuidv4();
  const c1Id = uuidv4();

  if (existingClientUser1.length === 0) {
    // Insert Workspace 1
    await db.insert(workspaces).values({
      id: ws1Id,
      tenantId: tenantId!,
      name: 'Client One Corp',
      slug: 'client-one-corp',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any);

    // Insert Client 1
    await db.insert(clients).values({
      id: c1Id,
      tenantId: tenantId!,
      workspaceId: ws1Id,
      name: 'Client One Contact',
      email: clientEmail1,
      companyName: 'Client One Corp',
      status: 'active',
      plan: 'starter',
      assignedTeamMemberId: teamId
    } as any);

    // Insert Client User 1
    const newClientUserId1 = uuidv4();
    await db.insert(users).values({
      id: newClientUserId1,
      tenantId: tenantId!,
      workspaceId: ws1Id,
      name: 'Client One Contact',
      email: clientEmail1,
      password: hashedPassword,
      role: 'client',
      provider: 'local',
      onboardingCompleted: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any);
    console.log('✅ Created Client 1 user: client@test.com (Assigned to team member via assignedTeamMemberId)');
    
    // Explicit Team Assignment for Client 1 in team_assignments
    await db.insert(teamAssignments).values({
      id: uuidv4(),
      tenantId: tenantId!,
      workspaceId: ws1Id,
      userId: teamId,
      clientId: c1Id,
      createdAt: new Date().toISOString()
    } as any);
    console.log('✅ Created explicit Team Assignment for Client 1 in team_assignments');
  } else {
    console.log('Client 1 user already exists');
  }

  // 5. Create Workspace 2 & Client 2 (NOT Assigned to Team)
  const clientEmail2 = 'client2@test.com';
  const existingClientUser2 = await db.select().from(users).where(eq(users.email, clientEmail2)).limit(1);

  const ws2Id = uuidv4();
  const c2Id = uuidv4();

  if (existingClientUser2.length === 0) {
    // Insert Workspace 2
    await db.insert(workspaces).values({
      id: ws2Id,
      tenantId: tenantId!,
      name: 'Client Two Corp',
      slug: 'client-two-corp',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any);

    // Insert Client 2
    await db.insert(clients).values({
      id: c2Id,
      tenantId: tenantId!,
      workspaceId: ws2Id,
      name: 'Client Two Contact',
      email: clientEmail2,
      companyName: 'Client Two Corp',
      status: 'active',
      plan: 'starter',
      assignedTeamMemberId: null
    } as any);

    // Insert Client User 2
    const newClientUserId2 = uuidv4();
    await db.insert(users).values({
      id: newClientUserId2,
      tenantId: tenantId!,
      workspaceId: ws2Id,
      name: 'Client Two Contact',
      email: clientEmail2,
      password: hashedPassword,
      role: 'client',
      provider: 'local',
      onboardingCompleted: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any);
    console.log('✅ Created Client 2 user: client2@test.com (Unassigned)');
  } else {
    console.log('Client 2 user already exists');
  }

  console.log('--- RBAC Seeding Completed ---');
}

run().then(() => process.exit(0)).catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
