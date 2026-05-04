import { db } from '../src/db';
import { users, tenants } from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function createSpecificUser() {
  const email = 'sravani123@gmail.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 12);
  
  console.log('📡 CREATING USER IN TURSO...');
  
  // 1. Get or Create Tenant
  let tenant = await db.query.tenants.findFirst();
  let tenantId = tenant?.id;

  if (!tenantId) {
    tenantId = uuidv4();
    await db.insert(tenants).values({
      id: tenantId,
      name: 'Main Agency',
      subdomain: 'agency'
    });
  }

  // 2. Create User
  await db.insert(users).values({
    id: uuidv4(),
    email,
    password: hashedPassword,
    name: 'Sravani',
    role: 'admin',
    tenantId: tenantId as string
  });

  console.log(`✅ User created: ${email}`);
  process.exit(0);
}

createSpecificUser().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
