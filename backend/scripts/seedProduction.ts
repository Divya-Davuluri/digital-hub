import { db } from '../src/db';
import { users, tenants, clients, tasks } from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedProduction() {
  console.log('📡 [SEED] STARTING PRODUCTION-GRADE SEEDING...');

  // 1. Ensure Main Tenant Exists
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const existingTenant = await db.query.tenants.findFirst({
    where: (tenants, { eq }) => eq(tenants.id, tenantId)
  });

  if (!existingTenant) {
    console.log('🏢 [SEED] Creating Main Tenant...');
    await db.insert(tenants).values({
      id: tenantId,
      name: 'HubSaaS Main Agency',
      subdomain: 'agency'
    });
  }

  // 2. Ensure Admin User Exists
  const adminEmail = 'admin@demo.com';
  const hashedPassword = await bcrypt.hash('password123', 12);
  const existingAdmin = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, adminEmail)
  });

  if (!existingAdmin) {
    console.log('👤 [SEED] Creating Admin User...');
    await db.insert(users).values({
      id: uuidv4(),
      tenantId,
      name: 'System Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      provider: 'local'
    });
  } else {
    console.log('👤 [SEED] Admin user already exists.');
  }

  // 3. Ensure Team User Exists
  const teamEmail = 'team@demo.com';
  const existingTeam = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, teamEmail)
  });

  if (!existingTeam) {
    console.log('👥 [SEED] Creating Team User...');
    await db.insert(users).values({
      id: uuidv4(),
      tenantId,
      name: 'Team Member',
      email: teamEmail,
      password: hashedPassword,
      role: 'team',
      provider: 'local'
    });
  }

  console.log('✅ [SEED] PRODUCTION SEEDING COMPLETE');
  process.exit(0);
}

seedProduction().catch(err => {
  console.error('❌ [SEED] FAILED:', err);
  process.exit(1);
});
