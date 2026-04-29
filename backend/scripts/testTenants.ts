import { db } from '../src/db';
import { users, tenants, clients, tasks } from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

async function testMultiTenancy() {
  console.log('🧪 STARTING MULTI-TENANCY ISOLATION TEST...');

  try {
    const hashedPassword = await bcrypt.hash('password123', 12);

    // 1. Create Agency A
    const tenantAId = uuidv4();
    await db.insert(tenants).values({
      id: tenantAId,
      name: 'Agency Alpha',
      subdomain: 'alpha-' + Math.random().toString(36).substring(2, 7),
    });

    const userAId = uuidv4();
    await db.insert(users).values({
      id: userAId,
      tenantId: tenantAId,
      name: 'Alpha Admin',
      email: 'alpha@test.com',
      password: hashedPassword,
      role: 'admin',
    });

    await db.insert(clients).values({
      id: uuidv4(),
      tenantId: tenantAId,
      name: 'Alpha Client 1',
      email: 'contact@alphaclient.com',
    });

    // 2. Create Agency B
    const tenantBId = uuidv4();
    await db.insert(tenants).values({
      id: tenantBId,
      name: 'Agency Beta',
      subdomain: 'beta-' + Math.random().toString(36).substring(2, 7),
    });

    const userBId = uuidv4();
    await db.insert(users).values({
      id: userBId,
      tenantId: tenantBId,
      name: 'Beta Admin',
      email: 'beta@test.com',
      password: hashedPassword,
      role: 'admin',
    });

    await db.insert(clients).values({
      id: uuidv4(),
      tenantId: tenantBId,
      name: 'Beta Client 1',
      email: 'contact@betaclient.com',
    });

    console.log('✅ TEST DATA CREATED SUCCESSFULLY!');
    console.log('-----------------------------------');
    console.log('Agency A: alpha@test.com / password123');
    console.log('Agency B: beta@test.com / password123');
    console.log('-----------------------------------');
    console.log('Testing Isolation: Login as Alpha and you will NOT see Beta Client.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ TEST SEEDING FAILED:', error);
    process.exit(1);
  }
}

testMultiTenancy();
