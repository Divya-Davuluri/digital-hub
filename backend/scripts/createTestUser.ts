import { db } from '../src/db';
import { users, tenants, tenantBranding } from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import { eq } from 'drizzle-orm';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function createAdmin() {
  const email = 'admin@demo.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 12);
  
  console.log('📡 ATTEMPTING TURSO CONNECTION...');
  
  // Cleanup
  await db.delete(users).where(eq(users.email, email));
  await db.delete(tenants).where(eq(tenants.subdomain, 'demo'));

  // 1. Create Tenant
  const tenantId = uuidv4();
  await db.insert(tenants).values({
    id: tenantId,
    name: 'Demo Agency',
    subdomain: 'demo'
  });

  // 2. Create Admin User
  const userId = uuidv4();
  await db.insert(users).values({
    id: userId,
    email,
    password: hashedPassword,
    name: 'Demo Admin',
    role: 'admin',
    tenantId: tenantId
  });

  // 3. Create Default Branding
  await db.insert(tenantBranding).values({
    id: uuidv4(),
    tenantId: tenantId,
    primaryColor: '#4f46e5',
    secondaryColor: '#10b981',
    subdomain: 'demo'
  });

  console.log(`✅ Multi-Tenant Setup Complete!`);
  console.log(`Tenant Subdomain: demo`);
  console.log(`Admin Email: ${email}`);
  console.log(`Admin Password: ${password}`);
  process.exit(0);
}

createAdmin().catch(err => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
